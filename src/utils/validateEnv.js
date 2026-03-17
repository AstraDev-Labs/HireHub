/**
 * Environment Variable Validation
 * Fails fast at startup if critical env vars are missing.
 */

const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'JWT_EXPIRES_IN',
    'JWT_REFRESH_EXPIRES_IN',
];

const optionalButWarned = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_S3_BUCKET_NAME',
    'AWS_REGION',
    'EMAIL_USERNAME',
    'EMAIL_PASSWORD',
    'EMAIL_HOST',
    'FRONTEND_URL',
];

function validateEnv() {
    const missing = [];
    const warned = [];

    for (const key of requiredVars) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    for (const key of optionalButWarned) {
        if (!process.env[key]) {
            warned.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('❌ FATAL: Missing required environment variables:');
        missing.forEach(k => console.error(`   - ${k}`));
        console.error('Please set these in your .env file.');
        process.exit(1);
    }

    if (warned.length > 0) {
        console.warn('⚠️  Missing optional environment variables (some features may not work):');
        warned.forEach(k => console.warn(`   - ${k}`));
    }

    // Validate JWT secret strength
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        console.warn('⚠️  JWT_SECRET is shorter than 32 characters — consider using a stronger secret.');
    }

    // Warn if using default or weak secrets in production
    if (process.env.NODE_ENV === 'production') {
        const weakSecrets = ['secret', '123456', 'password', 'default_secret'];
        if (weakSecrets.some(s => process.env.JWT_SECRET.includes(s) || process.env.JWT_REFRESH_SECRET.includes(s))) {
            console.error('⚠️  CRITICAL: Weak or default JWT secrets used in production environment!');
            // Downgraded from fatal to warning to prevent crashing existing deployed environments.
            // process.exit(1);
        }

        if (!process.env.RSA_PRIVATE_KEY) {
            console.warn('⚠️  PRODUCTION WARNING: RSA_PRIVATE_KEY is not set. Login payloads will be sent in plaintext.');
        }
    }

    console.log('✅ Environment validation passed');
}

module.exports = validateEnv;
