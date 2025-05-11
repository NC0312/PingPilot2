// utils/emailService.js

import nodemailer from 'nodemailer';

// Configure the email transport
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

// Send alert for down server
export const sendDownAlert = async (server, user) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `🔴 Alert: ${server.name} is DOWN`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #ff4d4d; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">Server Down Alert</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello ${user.name || user.email},</p>
            <p>We've detected that your server <strong>${server.name}</strong> is currently <strong>DOWN</strong>.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #ff4d4d;">
              <p style="margin: 0;"><strong>Server URL:</strong> ${server.url}</p>
              <p style="margin: 8px 0 0;"><strong>Time Detected:</strong> ${new Date().toLocaleString()}</p>
              ${server.error ? `<p style="margin: 8px 0 0;"><strong>Error:</strong> ${server.error}</p>` : ''}
            </div>
            <p>Please check your server as soon as possible.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/servers/${server.id}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Server Details</a>
            </div>
          </div>
          <div style="text-align: center; padding: 15px; color: #666; font-size: 12px;">
            <p>This is an automated message from Ping Pilot. Please do not reply to this email.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Down alert sent for server: ${server.name}`);
        return true;
    } catch (error) {
        console.error('Error sending down alert:', error);
        return false;
    }
};

// Send recovery alert
export const sendRecoveryAlert = async (server, user) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `🟢 Recovery: ${server.name} is UP`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #10b981; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">Server Recovery Alert</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello ${user.name || user.email},</p>
            <p>Good news! Your server <strong>${server.name}</strong> is now <strong>UP and running</strong>.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #10b981;">
              <p style="margin: 0;"><strong>Server URL:</strong> ${server.url}</p>
              <p style="margin: 8px 0 0;"><strong>Time Detected:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 8px 0 0;"><strong>Response Time:</strong> ${server.responseTime}ms</p>
            </div>
            <p>No further action is needed at this time.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/servers/${server.id}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Server Details</a>
            </div>
          </div>
          <div style="text-align: center; padding: 15px; color: #666; font-size: 12px;">
            <p>This is an automated message from Ping Pilot. Please do not reply to this email.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Recovery alert sent for server: ${server.name}`);
        return true;
    } catch (error) {
        console.error('Error sending recovery alert:', error);
        return false;
    }
};

// Send response time threshold alert
export const sendResponseTimeAlert = async (server, user) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `⚠️ Warning: ${server.name} - High Response Time`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f59e0b; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">Response Time Alert</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello ${user.name || user.email},</p>
            <p>Your server <strong>${server.name}</strong> is responding slower than the threshold you've set.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #f59e0b;">
              <p style="margin: 0;"><strong>Server URL:</strong> ${server.url}</p>
              <p style="margin: 8px 0 0;"><strong>Time Detected:</strong> ${new Date().toLocaleString()}</p>
              <p style="margin: 8px 0 0;"><strong>Current Response Time:</strong> ${server.responseTime}ms</p>
              <p style="margin: 8px 0 0;"><strong>Threshold:</strong> ${server.monitoring.alerts.responseThreshold}ms</p>
            </div>
            <p>You may want to investigate performance issues with your server.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/servers/${server.id}" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Server Details</a>
            </div>
          </div>
          <div style="text-align: center; padding: 15px; color: #666; font-size: 12px;">
            <p>This is an automated message from Ping Pilot. Please do not reply to this email.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Response time alert sent for server: ${server.name}`);
        return true;
    } catch (error) {
        console.error('Error sending response time alert:', error);
        return false;
    }
};

// Send trial expiration reminder
export const sendTrialExpirationReminder = async (server, user, daysLeft) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: `⏰ Reminder: Trial Period for ${server.name} Ending Soon`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #6366f1; color: white; padding: 15px; text-align: center;">
            <h1 style="margin: 0;">Trial Period Ending Soon</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <p>Hello ${user.name || user.email},</p>
            <p>This is a friendly reminder that your free trial period for server <strong>${server.name}</strong> is ending soon.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-left: 4px solid #6366f1;">
              <p style="margin: 0;"><strong>Server URL:</strong> ${server.url}</p>
              <p style="margin: 8px 0 0;"><strong>Days Remaining:</strong> ${daysLeft}</p>
              <p style="margin: 8px 0 0;"><strong>Trial Ends On:</strong> ${new Date(server.monitoring.trialEndsAt.toDate()).toLocaleDateString()}</p>
            </div>
            <p>To continue monitoring this server after the trial period, please subscribe to one of our plans.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe" style="background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-right: 10px;">View Plans</a>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/servers/${server.id}" style="background-color: #6b7280; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Server Details</a>
            </div>
          </div>
          <div style="text-align: center; padding: 15px; color: #666; font-size: 12px;">
            <p>This is an automated message from Ping Pilot. Please do not reply to this email.</p>
          </div>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Trial expiration reminder sent for server: ${server.name}`);
        return true;
    } catch (error) {
        console.error('Error sending trial expiration reminder:', error);
        return false;
    }
};