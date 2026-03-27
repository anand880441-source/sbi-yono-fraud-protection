const nodemailer = require('nodemailer');

// Create transporter (using Ethereal for demo - no setup needed)
const createTransporter = async () => {
    // For demo, we'll use Ethereal (fake SMTP that shows emails in browser)
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

// Send email alert when fake URL is detected
const sendFakeUrlAlert = async (email, url, confidence, userName) => {
    try {
        const transporter = await createTransporter();
        
        const mailOptions = {
            from: '"SBI YONO SafeGuard" <security@sbi-safeguard.com>',
            to: email,
            subject: '🚨 Security Alert: Fake YONO App Detected!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #0066b3; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .header h1 { color: white; margin: 0; }
                        .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px; }
                        .alert-box { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0; }
                        .confidence-bar { background: #e0e0e0; border-radius: 10px; height: 20px; overflow: hidden; margin: 10px 0; }
                        .confidence-fill { background: #f44336; height: 100%; width: ${confidence * 100}%; }
                        .button { background: #0066b3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 20px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🛡️ SBI YONO SafeGuard</h1>
                        </div>
                        <div class="content">
                            <h2>Security Alert!</h2>
                            <p>Hello ${userName},</p>
                            <p>Our system has detected a potential fake YONO app link that you tried to access:</p>
                            
                            <div class="alert-box">
                                <strong>🚨 Suspicious Link Detected:</strong><br>
                                <code style="word-break: break-all;">${url}</code>
                                <div class="confidence-bar">
                                    <div class="confidence-fill"></div>
                                </div>
                                <p><strong>Confidence:</strong> ${(confidence * 100).toFixed(0)}%</p>
                            </div>
                            
                            <h3>What you should do:</h3>
                            <ul>
                                <li>❌ Do NOT download or install any APK from this link</li>
                                <li>✅ Always download YONO from Google Play Store or Apple App Store</li>
                                <li>✅ Report this link to SBI cyber cell</li>
                                <li>✅ Never share OTP or MPIN with anyone</li>
                            </ul>
                            
                            <a href="https://sbi-yono-fraud-protection.netlify.app" class="button">Visit Dashboard</a>
                            
                            <div class="footer">
                                <p>This is an automated alert from SBI YONO SafeGuard.</p>
                                <p>Stay vigilant, stay safe! 🛡️</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('📧 Alert email sent!');
        console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        
        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
        
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
    try {
        const transporter = await createTransporter();
        
        const mailOptions = {
            from: '"SBI YONO SafeGuard" <welcome@sbi-safeguard.com>',
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
                            <li>✓ Receive email alerts when fake URLs are detected</li>
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
        
        return { success: true, previewUrl: nodemailer.getTestMessageUrl(info) };
        
    } catch (error) {
        console.error('Welcome email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendFakeUrlAlert, sendWelcomeEmail };
