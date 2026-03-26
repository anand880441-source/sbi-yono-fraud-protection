const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
    url: { type: String, required: true },
    isLegitimate: Boolean,
    confidence: Number,
    features: Object,
    timestamp: { type: Date, default: Date.now },
    source: { type: String, enum: ['dashboard', 'extension', 'whatsapp'] }
});

module.exports = mongoose.model('Scan', scanSchema);