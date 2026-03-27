const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    loginCount: { type: Number, default: 0 },
    lastLogin: Date,
    createdAt: { type: Date, default: Date.now }
});

// Simple hash function
userSchema.pre('save', function(next) {
    const user = this;
    if (!user.isModified('password')) return next();
    
    bcrypt.hash(user.password, 10, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
    });
});

// Simple compare function
userSchema.methods.comparePassword = function(candidate, cb) {
    bcrypt.compare(candidate, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = mongoose.model('User', userSchema);