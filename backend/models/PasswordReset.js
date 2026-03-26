const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
    email: { type: String, required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true, default: () => new Date(Date.now() + 3600000) } // 1 hour
});

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
