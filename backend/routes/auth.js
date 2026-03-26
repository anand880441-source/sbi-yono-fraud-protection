const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

// ========== REGISTER ==========
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        console.log('📝 Registration attempt:', { name, email, phone });
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Create user - password will be hashed by pre-save middleware
        const user = new User({ name, email, password, phone });
        await user.save();
        
        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET || 'sbi-yono-secret-key-2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ New user registered: ${email}`);
        
        res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed: ' + error.message });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log('🔐 Login attempt:', email);
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Update login stats
        user.loginCount += 1;
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name, role: user.role },
            process.env.JWT_SECRET || 'sbi-yono-secret-key-2024',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ User logged in: ${email} (${user.loginCount} total logins)`);
        
        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                loginCount: user.loginCount,
                lastLogin: user.lastLogin
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed: ' + error.message });
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
        
        console.log('\n' + '='.repeat(70));
        console.log('📧 PASSWORD RESET REQUEST');
        console.log('='.repeat(70));
        console.log(`To: ${email}`);
        console.log(`Reset Link: ${resetUrl}`);
        console.log('='.repeat(70) + '\n');
        
        res.json({
            success: true,
            message: 'Password reset link sent (check console)',
            demoLink: resetUrl
        });
        
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

// ========== RESET PASSWORD ==========
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password required' });
        }
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }
        
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        console.log(`✅ Password reset successful for: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Password reset successful! You can now login.'
        });
        
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

// ========== GET CURRENT USER ==========
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sbi-yono-secret-key-2024');
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
