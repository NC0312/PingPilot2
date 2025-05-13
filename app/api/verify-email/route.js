// app/api/verify-email/route.js
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import dns from 'dns';
import axios from 'axios';
import { promisify } from 'util';
import { db } from '../../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

// Promisify DNS methods
const resolveMx = promisify(dns.resolveMx);
const dnsLookup = promisify(dns.lookup);

export async function POST(req) {
    try {
        const { email, name, userId } = await req.json();
        console.log('Validating email:', email);

        // 1. Basic format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format', type: 'invalid_format' },
                { status: 400 }
            );
        }

        // 2. Extract domain
        const domain = email.split('@')[1].toLowerCase();
        console.log('Extracted domain:', domain);

        // 3. Check domain existence with DNS lookup
        try {
            const lookupResult = await dnsLookup(domain);
            console.log(`DNS lookup successful for ${domain}:`, lookupResult);
        } catch (lookupError) {
            console.error(`DNS lookup failed for ${domain}:`, lookupError);
            return NextResponse.json(
                { error: 'Email domain does not exist', type: 'nonexistent_domain' },
                { status: 400 }
            );
        }

        // 4. Check MX records
        try {
            const mxRecords = await resolveMx(domain);
            if (!mxRecords || mxRecords.length === 0) {
                console.log(`No MX records found for ${domain}`);
                return NextResponse.json(
                    { error: 'Email domain cannot receive mail', type: 'no_mx_records' },
                    { status: 400 }
                );
            }
            console.log(`MX records for ${domain}:`, mxRecords);
        } catch (mxError) {
            console.error(`MX lookup failed for ${domain}:`, mxError);
            return NextResponse.json(
                { error: 'Email domain cannot receive mail', type: 'mx_lookup_failed' },
                { status: 400 }
            );
        }

        // 5. Use Abstract API for additional email validation (if available)
        const apiKey = process.env.ABSTRACT_API_KEY || "YOUR_API_KEY"; // Replace with your API key
        try {
            const abstractResponse = await axios.get(
                `https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`
            );
            console.log(`AbstractAPI response for ${email}:`, abstractResponse.data);

            const { is_valid_format, is_smtp_valid, is_disposable_email, deliverability } = abstractResponse.data;

            if (!is_valid_format.value || is_disposable_email.value) {
                console.log(`Email ${email} rejected: invalid format or disposable`);
                return NextResponse.json(
                    { error: 'Invalid or disposable email address', type: 'invalid_email' },
                    { status: 400 }
                );
            }

            if (!is_smtp_valid.value || deliverability !== 'DELIVERABLE') {
                console.log(`Email ${email} rejected: SMTP invalid or undeliverable`);
                return NextResponse.json(
                    { error: 'Email address does not exist or is undeliverable', type: 'undeliverable' },
                    { status: 400 }
                );
            }

            console.log(`Email ${email} passed AbstractAPI validation`);
        } catch (apiError) {
            console.error('AbstractAPI request failed:', apiError.message);
            // Continue without third-party validation if service is unavailable
            console.log('Proceeding without third-party validation');
        }

        // 6. Generate verification token and store in Firebase
        const token = uuidv4();
        const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                verificationToken: token,
                verificationTokenExpiry: expiryTime.getTime(),
                updatedAt: new Date().toISOString()
            });
            console.log(`User document updated with verification token`);
        } catch (userUpdateError) {
            console.error('Error updating user with verification token:', userUpdateError);
            // Continue to store in emailVerifications as fallback
        }

        const verificationData = {
            email,
            userId,
            token,
            createdAt: new Date().toISOString(),
            used: false,
            expiresAt: expiryTime.toISOString(),
        };

        await addDoc(collection(db, 'emailVerifications'), verificationData);

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

        // 8. Send verification email with link
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

        // Create verification link with token and userId
        const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${token}&userId=${userId}`;

        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            to: email,
            subject: 'Verify Your Email - Ping Pilot',
            html: `
                <h1>Hello ${name || 'there'},</h1>
                <p>Thank you for signing up for Ping Pilot. Please verify your email by clicking the link below:</p>
                <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #1D4ED8; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
                <p>If you didn't request this, please ignore this email.</p>
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
            console.log('Verification email sent successfully:', info.messageId);
            console.log('SMTP response:', info.response);

            return NextResponse.json(
                {
                    message: 'Verification email sent. Please check your inbox to confirm your email address.',
                    success: true
                },
                { status: 200 }
            );
        } catch (sendError) {
            console.error('Error sending verification email:', sendError);
            return NextResponse.json(
                { error: 'Failed to send verification email', type: 'send_error', details: sendError.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Error in verification process:', error);
        return NextResponse.json(
            { error: 'Email verification process failed', type: 'general_error', details: error.message },
            { status: 500 }
        );
    }
}