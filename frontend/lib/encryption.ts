export class EncryptionManager {
    static async generateKeyPair() {
        const keyPair = await window.crypto.subtle.generateKey(
            {
                name: "RSA-OAEP",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["encrypt", "decrypt"]
        );
        return keyPair;
    }

    static async exportKey(key: CryptoKey) {
        const exported = await window.crypto.subtle.exportKey("jwk", key);
        return JSON.stringify(exported);
    }

    static async importPublicKey(jwkString: string) {
        const jwk = JSON.parse(jwkString);
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["encrypt"]
        );
    }

    static async importPrivateKey(jwkString: string) {
        const jwk = JSON.parse(jwkString);
        return window.crypto.subtle.importKey(
            "jwk",
            jwk,
            {
                name: "RSA-OAEP",
                hash: "SHA-256",
            },
            true,
            ["decrypt"]
        );
    }


    static async encrypt(message: string, publicKeys: CryptoKey[]) {
        // 1. Generate a symmetric key for AES-GCM
        const aesKey = await window.crypto.subtle.generateKey(
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );

        // 2. Encrypt the message with AES-GCM
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = new TextEncoder().encode(message);
        const cipherTextBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            aesKey,
            encodedMessage
        );

        // 3. Encrypt the AES key with each of the provided RSA public keys
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

        const encryptedKeys = await Promise.all(
            publicKeys.map(async (pubKey) => {
                const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
                    { name: "RSA-OAEP" },
                    pubKey,
                    exportedAesKey
                );
                return btoa(String.fromCharCode(...new Uint8Array(encryptedAesKeyBuffer)));
            })
        );

        // 4. Combine everything into a returnable format
        return {
            cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherTextBuffer))),
            iv: btoa(String.fromCharCode(...iv)),
            encryptedKeys: encryptedKeys
        };
    }


    static async decrypt(encryptedData: any, privateKey: CryptoKey) {
        try {
            const { cipherText, iv, encryptedKeys, encryptedKey } = encryptedData;

            // Support backward compatibility (old messages use 'encryptedKey', new ones use 'encryptedKeys' array)
            const keysToTry = encryptedKeys || (encryptedKey ? [encryptedKey] : []);

            let aesKeyBuffer = null;
            let lastError = null;

            // 1. Decrypt the AES key with RSA private key (try all available encrypted keys)
            for (const keyString of keysToTry) {
                try {
                    const encryptedKeyBuffer = new Uint8Array(atob(keyString).split("").map(c => c.charCodeAt(0)));
                    aesKeyBuffer = await window.crypto.subtle.decrypt(
                        { name: "RSA-OAEP" },
                        privateKey,
                        encryptedKeyBuffer
                    );
                    if (aesKeyBuffer) break; // Found the matching key!
                } catch (e) {
                    lastError = e;
                    // This key didn't work (wasn't encrypted for us), try the next one
                }
            }

            if (!aesKeyBuffer) {
                throw new Error("Could not decrypt the message key. Are you sure this message is for you?");
            }

            // 2. Import the AES key
            const aesKey = await window.crypto.subtle.importKey(
                "raw",
                aesKeyBuffer,
                "AES-GCM",
                true,
                ["decrypt"]
            );

            // 3. Decrypt the message
            const ivBuffer = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));
            const cipherTextBuffer = new Uint8Array(atob(cipherText).split("").map(c => c.charCodeAt(0)));

            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBuffer },
                aesKey,
                cipherTextBuffer
            );

            return new TextDecoder().decode(decryptedBuffer);
        } catch (error) {
            console.error("Decryption failed:", error);
            return "[Decryption Error]";
        }
    }


    // Helper to derive a symmetric key from a password
    static async deriveKeyFromPassword(password: string, salt: string): Promise<CryptoKey> {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode(salt),
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    // Encrypt a string (like a serialized private key) using a derived password key
    static async encryptWithPassword(data: string, password: string, emailOrId: string): Promise<string> {
        const key = await this.deriveKeyFromPassword(password, emailOrId);

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedData = new TextEncoder().encode(data);

        const cipherTextBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encodedData
        );

        return JSON.stringify({
            cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherTextBuffer))),
            iv: btoa(String.fromCharCode(...iv))
        });
    }

    // Decrypt a string using a derived password key
    static async decryptWithPassword(encryptedDataString: string, password: string, emailOrId: string): Promise<string> {
        const encryptedData = JSON.parse(encryptedDataString);
        const { cipherText, iv } = encryptedData;

        const key = await this.deriveKeyFromPassword(password, emailOrId);

        const ivBuffer = new Uint8Array(atob(iv).split("").map(c => c.charCodeAt(0)));
        const cipherTextBuffer = new Uint8Array(atob(cipherText).split("").map(c => c.charCodeAt(0)));

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: ivBuffer },
            key,
            cipherTextBuffer
        );

        return new TextDecoder().decode(decryptedBuffer);
    }

}
