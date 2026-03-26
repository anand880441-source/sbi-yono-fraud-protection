const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const BACKEND_URL = process.env.BACKEND_URL || 'https://sbi-backend-b5hk.onrender.com/api';
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'sbi_yono_2024';

// Webhook verification (Meta requires this)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('✅ Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Receive messages from WhatsApp
app.post('/webhook', async (req, res) => {
    try {
        const body = req.body;
        
        // Check if it's a message from Meta
        if (body.object === 'whatsapp_business_account') {
            const entry = body.entry[0];
            const changes = entry.changes[0];
            const value = changes.value;
            
            if (value.messages && value.messages[0]) {
                const message = value.messages[0];
                const from = message.from;
                const text = message.text?.body || '';
                
                console.log(`📱 Message from ${from}: ${text}`);
                
                // Process the message
                const reply = await processMessage(text);
                
                // Send reply
                await sendWhatsAppMessage(from, reply);
            }
        }
        
        res.sendStatus(200);
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

// Process message (same logic as your bot)
async function processMessage(message) {
    // Extract URLs
    const urls = extractUrls(message);
    
    if (urls.length > 0) {
        let reply = '🔍 *SBI YONO Security Check Results:*\n\n';
        
        for (const url of urls) {
            const result = await checkUrl(url);
            
            if (result.is_legitimate) {
                reply += `✅ *SAFE*\n📎 ${url}\n✓ ${result.warning}\n\n`;
            } else {
                reply += `🚨 *FAKE APP DETECTED!*\n📎 ${url}\n⚠️ ${result.warning}\n🔒 Confidence: ${(result.confidence * 100).toFixed(0)}%\n\n`;
            }
        }
        
        reply += '\n📌 *Safety Tips:*\n• Download YONO only from official app stores\n• SBI never asks for OTP/MPIN via WhatsApp\n• Type "help" for more information';
        
        return reply;
    }
    
    // Handle commands
    if (message.toLowerCase().includes('help')) {
        return `🛡️ *SBI YONO Safety Bot - Help*\n\n*Commands:*\n• Send any link to check if it's safe\n• Type *help* - Show this menu\n• Type *report* - Report fake apps\n\n*Example:*\n"http://sbi-kyc-update.com/download/yono.apk"`;
    }
    
    if (message.toLowerCase().includes('report')) {
        return `📢 *How to Report Fake Apps:*\n\n1. Send the suspicious link to me\n2. I'll analyze it and confirm if it's fake\n3. Reply with "report" after detection\n4. Our team will block it immediately`;
    }
    
    return `🛡️ *Welcome to SBI YONO Safety Bot!*\n\nI help protect you from fake YONO apps and phishing links.\n\n*Try this:*\nSend me any suspicious link you receive, and I'll check if it's safe!\n\nType *help* to learn more.`;
}

// Extract URLs from text
function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

// Check URL with your backend
async function checkUrl(url) {
    try {
        const response = await axios.post(`${BACKEND_URL}/detect`, { url });
        return response.data.data;
    } catch (error) {
        console.error('Error checking URL:', error.message);
        return {
            is_legitimate: true,
            confidence: 0,
            warning: 'Unable to check URL. Please try again.'
        };
    }
}

// Send WhatsApp message via Meta API
async function sendWhatsAppMessage(to, message) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    
    if (!token || !phoneId) {
        console.log('⚠️ WhatsApp API not configured. Message would be sent:', message);
        return;
    }
    
    try {
        await axios.post(
            `https://graph.facebook.com/v18.0/${phoneId}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log(`✅ Reply sent to ${to}`);
    } catch (error) {
        console.error('Failed to send message:', error.response?.data || error.message);
    }
}

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'WhatsApp Bot' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🤖 WhatsApp Bot webhook running on port ${PORT}`);
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`✅ Webhook verification token: ${VERIFY_TOKEN}`);
});