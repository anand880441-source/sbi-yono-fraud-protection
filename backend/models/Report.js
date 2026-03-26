const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    url: { type: String, required: true },
    reporter: { type: String, default: 'anonymous' },
    source: { type: String, enum: ['dashboard', 'whatsapp', 'extension', 'mobile'] },
    status: { type: String, enum: ['pending', 'reviewed', 'blocked'], default: 'pending' },
    detectionConfidence: { type: Number },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);