const nodemailer = require('nodemailer');

// Create test account on the fly (no setup needed!)
const createTransporter = async () => {
    // Create Ethereal test account
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });
};

// Store test accounts (for viewing emails)
let lastTestAccount = null;

const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
    const transporter = await createTransporter();
    
    const mailOptions = {
        from: '"SBI YONO SafeGuard" <noreply@sbi-safeguard.com>',
        to: email,
        subject: 'Password Reset Request - SBI YONO SafeGuard',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0066b3; padding: 20px; text-align: center;">
                    <h1 style="color: white;">🔐 Password Reset</h1>
                </div>
                <div style="padding: 20px; background: #f5f5f5;">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your SBI YONO SafeGuard account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #0066b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    </div>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Stay safe! - SBI YONO SafeGuard Team</p>
                </div>
            </div>
        `
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Log preview URL (for demo purposes)
    console.log('📧 Password reset email sent!');
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return info;
};

const sendWelcomeEmail = async (email, name) => {
    const transporter = await createTransporter();
    
    const mailOptions = {
        from: '"SBI YONO SafeGuard" <noreply@sbi-safeguard.com>',
        to: email,
        subject: 'Welcome to SBI YONO SafeGuard!',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0066b3; padding: 20px; text-align: center;">
                    <h1 style="color: white;">🛡️ Welcome to SBI YONO SafeGuard!</h1>
                </div>
                <div style="padding: 20px; background: #f5f5f5;">
                    <p>Hello ${name},</p>
                    <p>Thank you for joining SBI YONO SafeGuard! You're now protected from fake YONO apps and phishing links.</p>
                    <p>With our system, you can:</p>
                    <ul>
                        <li>✓ Check any suspicious link instantly</li>
                        <li>✓ Get real-time threat intelligence</li>
                        <li>✓ Report fake apps</li>
                        <li>✓ Receive alerts on WhatsApp</li>
                    </ul>
                    <p>Start protecting yourself today!</p>
                    <hr />
                    <p style="font-size: 12px; color: #666;">Stay safe! - SBI YONO SafeGuard Team</p>
                </div>
            </div>
        `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('📧 Welcome email sent!');
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    
    return info;
};

module.exports = { sendPasswordResetEmail, sendWelcomeEmail };