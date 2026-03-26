const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const BACKEND_URL = process.env.BACKEND_URL || 'https://sbi-backend-b5hk.onrender.com/api';
const PORT = process.env.PORT || 10000;

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'SBI YONO WhatsApp Bot',
        version: '1.0'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'WhatsApp Bot', timestamp: new Date() });
});

// Twilio webhook endpoint - THIS MUST BE HERE
app.post('/webhook', async (req, res) => {
    console.log('📥 Webhook received:', req.body);
    
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
        let reply = '🔍 *SBI YONO Security Check:*\n\n';
        
        for (const url of urls) {
            const result = await checkUrl(url);
            
            if (result.is_legitimate) {
                reply += `✅ *SAFE*\n📎 ${url}\n\n`;
            } else {
                reply += `🚨 *FAKE APP DETECTED!*\n📎 ${url}\n⚠️ ${result.warning}\n🔒 ${(result.confidence * 100).toFixed(0)}% confidence\n\n`;
            }
        }
        
        reply += 'Type "help" for more info.';
        return reply;
    }
    
    if (message.toLowerCase().includes('help')) {
        return `🛡️ *SBI YONO Safety Bot*\n\nSend any suspicious link to check if it's safe.\n\nExample: http://sbi-kyc-update.com/download/yono.apk`;
    }
    
    return `🛡️ *SBI YONO Safety Bot*\n\nSend any suspicious link and I'll check if it's safe!\n\nType "help" for more info.`;
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
        return { is_legitimate: true, confidence: 0.5, warning: 'Unable to check' };
    }
}

app.listen(PORT, () => {
    console.log(`🤖 WhatsApp Bot running on port ${PORT}`);
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    console.log(`✅ Webhook URL: /webhook (POST)`);
});