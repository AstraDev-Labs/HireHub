import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Shared secret for internal API calls between Render and Vercel
const INTERNAL_API_KEY = process.env.INTERNAL_EMAIL_BACKEND_KEY;

export async function POST(request: Request) {
    try {
        // 1. Verify Internal API Key
        const authHeader = request.headers.get('Authorization');
        if (!INTERNAL_API_KEY || authHeader !== `Bearer ${INTERNAL_API_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { to, subject, type, data } = body;

        if (!to || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Setup Transporter (Gmail)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD // Should be an App Password
            }
        });

        // 3. Define Templates
        let html = '';
        let text = '';

        if (type === 'forgot-password') {
            const { resetURL, fullName } = data || {};
            html = `
                <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #e5e7eb; border-radius: 20px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <h2 style="color: #111827; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">Reset Your Password</h2>
                    </div>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                        Hi ${fullName || 'there'},<br><br>
                        We received a request to reset your password for your HireHub account. Click the button below to set a new password.
                    </p>
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetURL}" style="background-color: #3b82f6; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; transition: all 0.2s;">Reset Password</a>
                    </div>
                    <p style="color: #9ca3af; font-size: 14px; line-height: 1.5; margin-top: 32px; text-align: center;">
                        This link will expire in 10 minutes.<br>
                        If you didn't request this, you can safely ignore this email.
                    </p>
                    <div style="margin-top: 40px; padding-top: 24px; border-top: 1px solid #f3f4f6; text-align: center;">
                        <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; 2026 HireHub. All rights reserved.</p>
                    </div>
                </div>
            `;
            text = `Hi ${fullName || 'there'},\n\nWe received a request to reset your password. Use the link below to set a new one:\n\n${resetURL}\n\nThis link expires in 10 minutes.`;
        } else if (type === 'verification') {
            // Placeholder for verification email
            const { verificationURL } = data || {};
            html = `<div>Verification Link: ${verificationURL}</div>`;
            text = `Verification Link: ${verificationURL}`;
        }

        // 4. Send Email
        await transporter.sendMail({
            from: `"HireHub System" <${process.env.EMAIL_USERNAME}>`,
            to,
            subject,
            text,
            html
        });

        return NextResponse.json({ success: true, message: 'Email sent successfully via Vercel Gateway' });

    } catch (error: any) {
        console.error('VERCEL EMAIL GATEWAY ERROR:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
