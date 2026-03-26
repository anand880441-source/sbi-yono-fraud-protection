const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';
const BOT_NAME = 'SBI YONO Safety Bot';

// Simulated WhatsApp message handler (replace with actual WhatsApp Business API)
class WhatsAppBot {
    constructor() {
        this.userSessions = new Map(); // Track user conversations
    }

    // Main message handler
    async handleMessage(phoneNumber, message) {
        console.log(`📱 Message from ${phoneNumber}: ${message}`);
        
        // Check if message contains a URL
        const urls = this.extractUrls(message);
        
        if (urls.length > 0) {
            return await this.handleUrls(phoneNumber, urls);
        }
        
        // Handle commands
        if (message.toLowerCase().includes('help')) {
            return this.getHelpMessage();
        }
        
        if (message.toLowerCase().includes('report')) {
            return this.getReportInstructions();
        }
        
        return this.getWelcomeMessage();
    }
    
    // Extract URLs from text
    extractUrls(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }
    
    // Handle URL detection
    async handleUrls(phoneNumber, urls) {
        const results = [];
        
        for (const url of urls) {
            try {
                const response = await axios.post(`${BACKEND_URL}/detect`, { url });
                const result = response.data.data;
                
                results.push({
                    url: url,
                    isLegitimate: result.is_legitimate,
                    confidence: result.confidence,
                    warning: result.warning
                });
                
                // If fake app detected, offer reporting
                if (!result.is_legitimate) {
                    await this.offerReporting(phoneNumber, url);
                }
                
            } catch (error) {
                console.error(`Error detecting URL ${url}:`, error.message);
                results.push({
                    url: url,
                    error: 'Could not check this link. Please try again.'
                });
            }
        }
        
        return this.formatResults(results);
    }
    
    // Format detection results for WhatsApp
    formatResults(results) {
        let message = '🔍 *SBI YONO Security Check Results:*\n\n';
        
        for (const result of results) {
            if (result.error) {
                message += `⚠️ ${result.url}\n❌ ${result.error}\n\n`;
            } else if (result.isLegitimate) {
                message += `✅ *SAFE*\n📎 ${result.url}\n✓ ${result.warning}\n\n`;
            } else {
                message += `🚨 *FAKE APP DETECTED!*\n📎 ${result.url}\n⚠️ ${result.warning}\n🔒 Confidence: ${(result.confidence * 100).toFixed(1)}%\n\n`;
            }
        }
        
        message += '_\n📌 *Safety Tips:_*\n';
        message += '• Always download YONO from Google Play Store or Apple App Store\n';
        message += '• SBI never asks for OTP/MPIN via SMS or WhatsApp\n';
        message += '• Type "help" for more information\n';
        message += '• Type "report" to report suspicious links';
        
        return message;
    }
    
    // Offer to report fake app
    async offerReporting(phoneNumber, url) {
        // Store session for this user
        this.userSessions.set(phoneNumber, {
            state: 'offering_report',
            url: url,
            timestamp: Date.now()
        });
        
        // In real implementation, send follow-up message:
        // "Would you like to report this fake app? Reply 'yes' to report."
    }
    
    // Handle report submission
    async handleReport(phoneNumber, url, reporter) {
        try {
            await axios.post(`${BACKEND_URL}/report`, {
                url: url,
                reporter: reporter || phoneNumber,
                source: 'whatsapp_bot'
            });
            
            return '✅ *Thank you for reporting!* Our security team will review and block this fake app immediately. Stay safe! 🛡️';
            
        } catch (error) {
            console.error('Report failed:', error.message);
            return '❌ Failed to submit report. Please try again or use the YONO app dashboard.';
        }
    }
    
    // Help message
    getHelpMessage() {
        return `🛡️ *SBI YONO Safety Bot - Help*

*Commands:*
• Send any link to check if it's safe
• Type *help* - Show this menu
• Type *report* - Learn how to report fake apps

*What I do:*
✅ Detect fake YONO app download links
✅ Identify phishing URLs
✅ Warn about suspicious websites
✅ Help report fraudulent apps

*Example:* 
Send me a suspicious link like:
"http://sbi-update.com/download/yono.apk"

I'll check it instantly and warn you if it's dangerous!

🔒 *Remember:* SBI never asks for personal details via WhatsApp. Stay vigilant!`;
    }
    
    // Report instructions
    getReportInstructions() {
        return `📢 *How to Report Fake Apps:*

1. Send the suspicious link to me
2. I'll analyze it and confirm if it's fake
3. Reply with "report" after detection
4. Our team will block it immediately

*Alternative Methods:*
• Use the YONO app dashboard
• Call SBI helpline: 1800 1234 5555
• Visit your nearest SBI branch

Together we can stop digital fraud! 🛡️`;
    }
    
    // Welcome message
    getWelcomeMessage() {
        return `🛡️ *Welcome to SBI YONO Safety Bot!*

I help protect you from fake YONO apps and phishing links.

*Try this:* 
Send me any suspicious link you receive, and I'll check if it's safe!

Type *help* to learn more.

🔒 *Your safety is our priority!*`;
    }
    
    // Clean up old sessions
    cleanupSessions() {
        const now = Date.now();
        for (const [phone, session] of this.userSessions.entries()) {
            if (now - session.timestamp > 30 * 60 * 1000) { // 30 minutes timeout
                this.userSessions.delete(phone);
            }
        }
    }
}

// Start bot simulation (for testing)
const bot = new WhatsAppBot();

// Simulate incoming messages for testing
async function simulateMessage() {
    console.log('\n🤖 WhatsApp Bot Simulator Started');
    console.log('Type messages to test the bot (type "exit" to quit)\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    const askQuestion = () => {
        rl.question('You: ', async (input) => {
            if (input.toLowerCase() === 'exit') {
                console.log('Bot stopped');
                rl.close();
                return;
            }
            
            const response = await bot.handleMessage('+919876543210', input);
            console.log(`\n🤖 Bot: ${response}\n`);
            askQuestion();
        });
    };
    
    askQuestion();
}

// For production with actual WhatsApp Business API
async function startBot() {
    console.log('🤖 SBI YONO Safety Bot Started');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Waiting for WhatsApp messages...\n');
    
    // In production, connect to WhatsApp Business API here
    // For now, run simulator
    await simulateMessage();
}

// Start bot
startBot().catch(console.error);
