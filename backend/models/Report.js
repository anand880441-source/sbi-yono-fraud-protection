const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    url: { type: String, required: true },
    reporter: { type: String, default: 'anonymous' },
    source: { type: String, default: 'dashboard' },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);