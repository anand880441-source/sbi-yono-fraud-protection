const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    url: String,
    reporter: String,
    status: { type: String, enum: ['pending', 'blocked', 'reviewed'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);