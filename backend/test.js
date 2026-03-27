const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = express();
app.use(express.json());

// Simple User Schema
const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
    name: String
});

UserSchema.pre('save', function(next) {
    if (!this.isModified('password')) return next();
    this.password = bcrypt.hashSync(this.password, 10);
    next();
});

const User = mongoose.model('User', UserSchema);

// Connect
mongoose.connect('mongodb+srv://anandsutharcg_db_user:sbi-yono@sbi-yono.rrpzo3u.mongodb.net/')
    .then(() => console.log('MongoDB connected'));

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const user = new User({ email, password, name });
        await user.save();
        res.json({ success: true, user: { email, name } });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(10000, () => console.log('Test server on 10000'));