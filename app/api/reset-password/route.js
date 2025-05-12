// app/api/reset-password/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
    try {
        const { email } = await req.json();
        console.log('Processing password reset for:', email);

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required', type: 'missing_email' },
                { status: 400 }
            );
        }

        // Check if user exists
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // For security reasons, don't reveal that the email doesn't exist
            // Instead, pretend we sent an email
            return NextResponse.json(
                { message: 'If an account with that email exists, we have sent password reset instructions.', success: true },
                { status: 200 }
            );
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userId = userData.uid;

        // Generate reset token and expiry
        const resetToken = uuidv4();
        const resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

        // Update user with reset token
        await updateDoc(userDoc.ref, {
            resetToken,
            resetTokenExpiry
        });

        // 7. SMTP configuration check
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM_EMAIL) {
            console.error('Missing SMTP configuration:', {
                host: process.env.SMTP_HOST,
                user: process.env.SMTP_USER,
                from: process.env.SMTP_FROM_EMAIL,
            });
            return NextResponse.json(
                { error: 'Server configuration error', type: 'server_config_error' },
                { status: 500 }
            );
        }

        // 8. Send reset email with link
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });

        try {
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('SMTP connection verification failed:', verifyError);
            return NextResponse.json(
                { error: 'Email service unavailable', type: 'smtp_error', details: verifyError.message },
                { status: 500 }
            );
        }

        // Create reset link with token and userId
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}&userId=${userId}`;

        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: 'Reset Your Password - Ping Pilot',
            html: `
                <h1>Hello,</h1>
                <p>We received a request to reset your password for your Ping Pilot account. Click the button below to reset your password:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #1D4ED8; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                <p>If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
                <p>This link will expire in 24 hours.</p>
                <p>Best regards,</p>
                <p>Team Ping Pilot</p>
                <img src="cid:logo" style="width: 120px; height: 40px;"/>
            `,
            attachments: [{
                filename: 'logo.png',
                path: process.cwd() + '/public/logo.png',
                cid: 'logo',
            }],
        };

        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Password reset email sent successfully:', info.messageId);
            console.log('SMTP response:', info.response);

            return NextResponse.json(
                {
                    message: 'If an account with that email exists, we have sent password reset instructions.',
                    success: true
                },
                { status: 200 }
            );
        } catch (sendError) {
            console.error('Error sending reset email:', sendError);
            return NextResponse.json(
                { error: 'Failed to send reset email', type: 'send_error', details: sendError.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in reset password process:', error);
        return NextResponse.json(
            { error: 'Password reset process failed', type: 'general_error', details: error.message },
            { status: 500 }
        );
    }
}