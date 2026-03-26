const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BACKEND_URL = process.env.BACKEND_URL || 'https://sbi-backend-b5hk.onrender.com/api';
const PORT = process.env.PORT || 3002;

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'SBI YONO WhatsApp Bot',
        version: '1.0',
        endpoints: {
            webhook: 'POST /webhook',
            health: 'GET /health'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'WhatsApp Bot', timestamp: new Date() });
});

// Twilio webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        const from = req.body.From;
        const message = req.body.Body;
        
        console.log(`📱 Message from ${from}: ${message}`);
        
        const reply = await processMessage(message);
        
        const twiml = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Message>${escapeXml(reply)}</Message>
        </Response>`;
        
        res.set('Content-Type', 'text/xml');
        res.send(twiml);
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
});

function escapeXml(str) {
    return str.replace(/[<>&]/g, function(m) {
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        if (m === '&') return '&amp;';
        return m;
    });
}

async function processMessage(message) {
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
    
    if (message.toLowerCase().includes('help')) {
        return `🛡️ *SBI YONO Safety Bot - Help*\n\n*Commands:*\n• Send any link to check if it's safe\n• Type *help* - Show this menu\n\n*Example:*\nhttp://sbi-kyc-update.com/download/yono.apk`;
    }
    
    return `🛡️ *Welcome to SBI YONO Safety Bot!*\n\nI help protect you from fake YONO apps.\n\nSend me any suspicious link, and I'll check if it's safe!\n\nType *help* to learn more.`;
}

function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
}

async function checkUrl(url) {
    try {
        const response = await axios.post(`${BACKEND_URL}/detect`, { url });
        return response.data.data;
    } catch (error) {
        console.error('Error checking URL:', error.message);
        return {
            is_legitimate: true,
            confidence: 0.5,
            warning: 'Unable to check URL. Please try again.'
        };
    }
}

app.listen(PORT, () => {
    console.log(`🤖 WhatsApp Bot running on port ${PORT}`);
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`✅ Webhook URL: http://localhost:${PORT}/webhook`);
});
