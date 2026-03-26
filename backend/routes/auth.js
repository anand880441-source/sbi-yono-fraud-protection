const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sbi-yono-safeguard-secret-2024';

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        console.log('📝 Registration:', email);
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check existing
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user
        const user = new User({ name, email, password, phone });
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log(`✅ Registered: ${email}`);
        
        res.json({
            success: true,
            message: 'Registration successful',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
        
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login:', email);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const isValid = user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Update login stats
        user.loginCount += 1;
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log(`✅ Logged in: ${email}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user._id, name: user.name, email: user.email, loginCount: user.loginCount }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== FORGOT PASSWORD ==========
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'Email not found' });
        }
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        
        console.log('\n' + '='.repeat(60));
        console.log('🔑 PASSWORD RESET LINK');
        console.log('='.repeat(60));
        console.log(`Email: ${email}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('='.repeat(60) + '\n');
        
        res.json({
            success: true,
            message: 'Password reset link sent (check console)',
            resetLink: resetUrl
        });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired token' });
        }
        
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        console.log(`✅ Password reset: ${user.email}`);
        
        res.json({ success: true, message: 'Password reset successful' });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== GET CURRENT USER ==========
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token' });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ success: true, user });
        
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
