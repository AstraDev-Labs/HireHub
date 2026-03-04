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

    static async encrypt(message: string, publicKey: CryptoKey) {
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

        // 3. Encrypt the AES key with the receiver's RSA public key
        const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
        const encryptedAesKeyBuffer = await window.crypto.subtle.encrypt(
            { name: "RSA-OAEP" },
            publicKey,
            exportedAesKey
        );

        // 4. Combine everything into a returnable format
        return {
            cipherText: btoa(String.fromCharCode(...new Uint8Array(cipherTextBuffer))),
            iv: btoa(String.fromCharCode(...iv)),
            encryptedKey: btoa(String.fromCharCode(...new Uint8Array(encryptedAesKeyBuffer)))
        };
    }

    static async decrypt(encryptedData: any, privateKey: CryptoKey) {
        try {
            const { cipherText, iv, encryptedKey } = encryptedData;

            // 1. Decrypt the AES key with RSA private key
            const encryptedKeyBuffer = new Uint8Array(atob(encryptedKey).split("").map(c => c.charCodeAt(0)));
            const aesKeyBuffer = await window.crypto.subtle.decrypt(
                { name: "RSA-OAEP" },
                privateKey,
                encryptedKeyBuffer
            );

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
}
