const axios = require('axios');

/**
 * sendEmail - Redirects email sending to Vercel Email Gateway
 * This bypasses Render's network restrictions.
 */
const sendEmail = async (options) => {
    // 0. Fallback for testing: If no internal key, log to console
    const VERCEL_URL = process.env.FRONTEND_URL;
    const INTERNAL_KEY = process.env.INTERNAL_EMAIL_BACKEND_KEY;

    if (!INTERNAL_KEY) {
        console.warn('⚠️  INTERNAL_EMAIL_BACKEND_KEY is missing! LOGGING EMAIL INSTEAD OF SENDING:');
        console.log('-----------------------------------');
        console.log('📧 To:', options.email);
        console.log('🔗 Type:', options.type || 'forgot-password');
        console.log('-----------------------------------');
        return;
    }

    try {
        const response = await axios.post(`${VERCEL_URL}/api/send-email`, {
            to: options.email,
            subject: options.subject,
            type: options.type || 'forgot-password',
            data: options.data || {}
        }, {
            headers: {
                'Authorization': `Bearer ${INTERNAL_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout for the Vercel call
        });

        if (response.data.success) {
            console.log('✅ Email successfully dispatched via Vercel Gateway to:', options.email);
        }
    } catch (err) {
        console.error('❌ Vercel Email Gateway Error:', err.response?.data || err.message);

        // Final fallback: Log the link so the user isn't stuck if Vercel is down/misconfigured
        if (options.data && options.data.resetURL) {
            console.log('-----------------------------------');
            console.log('🔗 EMERGENCY RESET LINK (Vercel Gateway Failed):');
            console.log(options.data.resetURL);
            console.log('-----------------------------------');
        }

        throw new Error('Failed to send email via Vercel Gateway');
    }
};

module.exports = sendEmail;
