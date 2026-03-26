const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    isActive: { type: Boolean, default: true },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Hash password before saving - FIXED
userSchema.pre('save', function(next) {
    const user = this;
    if (!user.isModified('password')) return next();
    
    bcrypt.hash(user.password, 10, (err, hash) => {
        if (err) return next(err);
        user.password = hash;
        next();
    });
});

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
