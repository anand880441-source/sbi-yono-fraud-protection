const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
const JWT_SECRET = process.env.JWT_SECRET || "sbi-yono-secret-key-2024";

// ========== MongoDB Connection ==========
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sbi-fraud";

mongoose.connect(MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));

// ========== User Schema - FIXED ==========
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    role: { type: String, default: "user" },
    loginCount: { type: Number, default: 0 },
    lastLogin: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

// FIXED: Async/await pre-save hook
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

// ========== Scan Schema ==========
const scanSchema = new mongoose.Schema({
    url: { type: String, required: true },
    isLegitimate: { type: Boolean, required: true },
    confidence: { type: Number, required: true },
    features: { type: Object, default: {} },
    timestamp: { type: Date, default: Date.now },
    source: { type: String, default: "dashboard" },
    ip: { type: String, default: "unknown" }
});

const reportSchema = new mongoose.Schema({
    url: { type: String, required: true },
    reporter: { type: String, default: "anonymous" },
    source: { type: String, default: "dashboard" },
    status: { type: String, default: "pending" },
    createdAt: { type: Date, default: Date.now }
});

const Scan = mongoose.model("Scan", scanSchema);
const Report = mongoose.model("Report", reportSchema);

// ========== Helper Functions ==========
function extractDomain(url) {
    try { return new URL(url).hostname; } catch { return url; }
}

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

// ========== AUTH ROUTES ==========

// Register
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
        console.error("❌ Register error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Login
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
        console.error("❌ Login error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// ========== API ROUTES ==========

app.get("/health", (req, res) => {
    res.json({ status: "OK", service: "SBI Fraud Detection API", timestamp: new Date(), mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});

app.get("/test", (req, res) => {
    res.json({ message: "Server is working!", time: new Date() });
});

app.post("/api/detect", async (req, res) => {
    try {
        const { url, source = "dashboard", ip = "unknown" } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });
        
        const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, { url });
        const mlData = response.data;
        
        const scan = new Scan({ url, isLegitimate: mlData.is_legitimate, confidence: mlData.confidence, features: mlData.features || {}, source, ip });
        await scan.save();
        
        res.json({ success: true, data: mlData });
        
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, error: "Failed to detect URL" });
    }
});

app.post("/api/report", async (req, res) => {
    try {
        const { url, reporter, source = "dashboard" } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });
        
        const report = new Report({ url, reporter: reporter || "anonymous", source });
        await report.save();
        
        res.json({ success: true, message: "Fake app reported successfully", report });
        
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to report app" });
    }
});

app.get("/api/stats", async (req, res) => {
    try {
        const totalScans = await Scan.countDocuments();
        const fakeDetections = await Scan.countDocuments({ isLegitimate: false });
        res.json({ totalDetections: totalScans, fakeDetections, safeDetections: totalScans - fakeDetections, detectionRate: totalScans ? ((fakeDetections / totalScans) * 100).toFixed(1) : 0 });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
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
        res.status(500).json({ error: "Failed to fetch trends" });
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
        res.status(500).json({ error: "Failed to fetch top threats" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Backend running on http://localhost:${PORT}`);
    console.log(`📡 ML Service: ${ML_SERVICE_URL}`);
});