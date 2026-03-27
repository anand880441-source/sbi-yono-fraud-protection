const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const JWT_SECRET = process.env.JWT_SECRET || "sbi-yono-secret-key-2024";

// ========== MongoDB Connection ==========
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sbi-fraud";

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch(err => console.error("❌ MongoDB error:", err));

// ========== CORS ==========
app.use(cors({
    origin: [
        "http://localhost:3000",
        "https://sbi-yono-fraud-protection.netlify.app",
        "https://*.netlify.app",
        "https://sbi-backend-b5hk.onrender.com"
    ],
    credentials: true
}));
app.use(express.json());

// ========== User Schema ==========
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: String,
    resetPasswordExpires: Date
});

// Hash password - using async/await
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password - async method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// ========== Scan Schema ==========
const scanSchema = new mongoose.Schema({
    url: String,
    isLegitimate: Boolean,
    confidence: Number,
    features: Object,
    timestamp: { type: Date, default: Date.now },
    source: { type: String, default: 'dashboard' }
});
const Scan = mongoose.model('Scan', scanSchema);

// ========== Report Schema ==========
const reportSchema = new mongoose.Schema({
    url: String,
    reporter: { type: String, default: 'anonymous' },
    source: { type: String, default: 'dashboard' },
    createdAt: { type: Date, default: Date.now }
});
const Report = mongoose.model('Report', reportSchema);

// ========== Helper Functions ==========
function extractDomain(url) {
    try { return new URL(url).hostname; } catch { return url; }
}

// ========== AUTH ROUTES - ALL USING ASYNC/AWAIT ==========

// REGISTER
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        console.log("📝 Register:", email);
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email and password required" });
        }
        
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: "Email already registered" });
        }
        
        const user = new User({ name, email, password, phone });
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        console.log(`✅ Registered: ${email}`);
        
        res.json({
            success: true,
            message: "Registration successful",
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
        
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ error: error.message });
    }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        
        console.log("🔐 Login:", email);
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const isValid = await user.comparePassword(password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        user.loginCount += 1;
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { userId: user._id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: "7d" }
        );
        
        console.log(`✅ Logged in: ${email}`);
        
        res.json({
            success: true,
            message: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email, loginCount: user.loginCount }
        });
        
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: error.message });
    }
});

// FORGOT PASSWORD
app.post("/api/auth/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: "Email not found" });
        }
        
        const resetToken = crypto.randomBytes(32).toString("hex");
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
        await user.save();
        
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
        
        console.log("\n🔑 PASSWORD RESET LINK");
        console.log(`Email: ${email}`);
        console.log(`Link: ${resetUrl}\n`);
        
        res.json({ success: true, message: "Reset link sent (check console)", resetLink: resetUrl });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RESET PASSWORD
app.post("/api/auth/reset-password", async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({ error: "Invalid or expired token" });
        }
        
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        
        res.json({ success: true, message: "Password reset successful" });
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET CURRENT USER
app.get("/api/auth/me", async (req, res) => {
    try {
        const token = req.headers.authorization?.replace("Bearer ", "");
        if (!token) return res.status(401).json({ error: "No token" });
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        
        res.json({ success: true, user });
        
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

// ========== API ROUTES ==========

app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "SBI Fraud Detection API", timestamp: new Date() });
});

app.get("/test", (req, res) => {
    res.json({ message: "Server is working!", time: new Date() });
});

app.post("/api/detect", async (req, res) => {
    try {
        const { url, source = "dashboard" } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });
        
        const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, { url });
        
        const scan = new Scan({ url, isLegitimate: response.data.is_legitimate, confidence: response.data.confidence, features: response.data.features || {}, source });
        await scan.save();
        
        res.json({ success: true, data: response.data });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/api/report", async (req, res) => {
    try {
        const { url, reporter, source = "dashboard" } = req.body;
        if (!url) return res.status(400).json({ error: "URL required" });
        
        const report = new Report({ url, reporter: reporter || "anonymous", source });
        await report.save();
        
        res.json({ success: true, message: "Reported successfully", report });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get("/api/reports", async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 }).limit(100);
        res.json({ success: true, reports });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/stats", async (req, res) => {
    try {
        const total = await Scan.countDocuments();
        const fake = await Scan.countDocuments({ isLegitimate: false });
        res.json({ totalDetections: total, fakeDetections: fake, safeDetections: total - fake, detectionRate: total ? ((fake / total) * 100).toFixed(1) : 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/trends", async (req, res) => {
    try {
        const trends = await Scan.aggregate([
            { $group: { _id: { $hour: "$timestamp" }, detections: { $sum: 1 }, blocked: { $sum: { $cond: [{ $eq: ["$isLegitimate", false] }, 1, 0] } } } },
            { $sort: { "_id": 1 } }
        ]);
        const formatted = trends.map(t => ({ time: `${t._id.toString().padStart(2, '0')}:00`, detections: t.detections, blocked: t.blocked }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/top-threats", async (req, res) => {
    try {
        const threats = await Scan.aggregate([
            { $match: { isLegitimate: false } },
            { $group: { _id: "$url", count: { $sum: 1 }, firstSeen: { $min: "$timestamp" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const formatted = threats.map(t => ({ domain: extractDomain(t._id), count: t.count, risk: t.count > 50 ? "High" : "Medium", firstSeen: t.firstSeen.toISOString().split("T")[0] }));
        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/threat-types", async (req, res) => {
    try {
        const fakeScans = await Scan.find({ isLegitimate: false });
        const types = { "Fake YONO Apps": 0, "Phishing Links": 0, "APK Malware": 0, "Fake KYC": 0 };
        fakeScans.forEach(scan => {
            const url = scan.url.toLowerCase();
            if (url.includes("yono")) types["Fake YONO Apps"]++;
            else if (url.includes("apk")) types["APK Malware"]++;
            else if (url.includes("kyc")) types["Fake KYC"]++;
            else types["Phishing Links"]++;
        });
        const total = fakeScans.length || 1;
        const distribution = Object.entries(types).map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
        res.json(distribution);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/api/recent-alerts", async (req, res) => {
    try {
        const recent = await Scan.find({ isLegitimate: false }).sort({ timestamp: -1 }).limit(10);
        const alerts = recent.map(scan => ({ id: scan._id, time: getTimeAgo(scan.timestamp), message: `Suspicious: ${extractDomain(scan.url)}`, type: scan.confidence > 0.9 ? "critical" : "high" }));
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour ago`;
    return `${Math.floor(hours / 24)} days ago`;
}

app.post("/api/detect-bulk", async (req, res) => {
    try {
        const { urls, source = "bulk" } = req.body;
        if (!urls || !Array.isArray(urls)) return res.status(400).json({ error: "URLs array required" });
        
        const results = await Promise.all(urls.map(async (url) => {
            try {
                const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, { url });
                await new Scan({ url, isLegitimate: response.data.is_legitimate, confidence: response.data.confidence, features: response.data.features || {}, source }).save();
                return { url, ...response.data };
            } catch (e) {
                return { url, error: e.message };
            }
        }));
        res.json({ success: true, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(`🚀 Backend running on port ${PORT}`);
    console.log(`📡 ML Service: ${ML_SERVICE_URL}`);
});