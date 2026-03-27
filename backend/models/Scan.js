const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
    url: { type: String, required: true },
    isLegitimate: Boolean,
    confidence: Number,
    features: Object,
    timestamp: { type: Date, default: Date.now },
    source: { type: String, default: 'dashboard' },
    ip: { type: String, default: 'unknown' }
});

module.exports = mongoose.model('Scan', scanSchema);