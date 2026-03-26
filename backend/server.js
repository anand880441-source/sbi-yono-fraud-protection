const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/sbi-fraud";

mongoose
  .connect(MONGODB_URI)

  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ========== MongoDB Models ==========

// Scan Schema - FIXED
const scanSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isLegitimate: { type: Boolean, required: true },
  confidence: { type: Number, required: true },
  features: { type: Object, default: {} },
  timestamp: { type: Date, default: Date.now },
  source: {
    type: String,
    enum: [
      "dashboard",
      "extension",
      "whatsapp",
      "mobile",
      "bulk",
      "web_dashboard",
    ],
    default: "dashboard",
  },
  ip: { type: String, default: "unknown" },
});

// Report Schema
const reportSchema = new mongoose.Schema({
  url: { type: String, required: true },
  reporter: { type: String, default: "anonymous" },
  source: { type: String, default: "dashboard" }, // Removed enum restriction
  status: {
    type: String,
    enum: ["pending", "reviewed", "blocked"],
    default: "pending",
  },
  detectionConfidence: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

// Create models
const Scan = mongoose.model("Scan", scanSchema);
const Report = mongoose.model("Report", reportSchema);

// ========== Helper Functions ==========

function extractDomain(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname;
  } catch (e) {
    return url;
  }
}

// ========== CORS Configuration ==========
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://sbi-yono-fraud-protection.netlify.app",
      "https://*.netlify.app",
      "https://sbi-backend-b5hk.onrender.com",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

// ========== Health Check ==========
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "SBI Fraud Detection API",
    timestamp: new Date(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ========== Detect URL Endpoint (with Database Save) ==========
app.post("/api/detect", async (req, res) => {
  try {
    const { url, source = "dashboard", ip = "unknown" } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Call Python ML service
    const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, { url });
    const mlData = response.data;

    // Save scan to database
    const scan = new Scan({
      url: url,
      isLegitimate: mlData.is_legitimate,
      confidence: mlData.confidence,
      features: mlData.features || {},
      source: source,
      ip: ip,
    });
    await scan.save();

    console.log(
      `📊 Scan saved: ${url} -> ${mlData.is_legitimate ? "Safe" : "Fake"} (${(mlData.confidence * 100).toFixed(0)}%)`,
    );

    res.json({
      success: true,
      data: mlData,
    });
  } catch (error) {
    console.error("Error calling ML service:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to detect URL",
      details: error.message,
    });
  }
});

// ========== Report Fake App Endpoint ==========
app.post("/api/report", async (req, res) => {
  try {
    const { url, reporter, source = "dashboard" } = req.body;

    console.log("📝 Report received:", { url, reporter, source });

    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required" });
    }

    // Save report to database
    const report = new Report({
      url: url,
      reporter: reporter || "anonymous",
      source: source,
      status: "pending",
    });

    await report.save();
    console.log("✅ Report saved to database:", report._id);

    // Try to forward to ML service (don't await, let it run in background)
    axios
      .post(`${ML_SERVICE_URL}/report_fake_app`, {
        url,
        reporter: reporter || "anonymous",
        source: source,
      })
      .catch((e) => {
        console.log(`⚠️ ML service report forwarding failed: ${e.message}`);
      });

    res.json({
      success: true,
      message: "Fake app reported successfully",
      report: report,
    });
  } catch (error) {
    console.error("❌ Error reporting app:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to report app",
      details: error.message,
    });
  }
});

// ========== Get All Reports ==========
app.get("/api/reports", async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(100);
    res.json({
      success: true,
      count: reports.length,
      reports: reports,
    });
  } catch (error) {
    console.error("Error fetching reports:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch reports" });
  }
});

// ========== Bulk URL Detection ==========
app.post("/api/detect-bulk", async (req, res) => {
  try {
    const { urls, source = "bulk" } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, {
            url,
          });

          // Save each scan
          const scan = new Scan({
            url: url,
            isLegitimate: response.data.is_legitimate,
            confidence: response.data.confidence,
            features: response.data.features || {},
            source: source,
          });
          await scan.save();

          return { url, ...response.data };
        } catch (e) {
          return { url, error: e.message };
        }
      }),
    );

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error in bulk detection:", error.message);
    res
      .status(500)
      .json({ success: false, error: "Failed to process bulk detection" });
  }
});

// ========== Threat Intelligence Endpoints ==========

// Get overall stats
app.get("/api/stats", async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments();
    const fakeDetections = await Scan.countDocuments({ isLegitimate: false });
    const safeDetections = await Scan.countDocuments({ isLegitimate: true });

    // Last 24 hours stats
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentScans = await Scan.countDocuments({
      timestamp: { $gte: last24h },
    });
    const recentFake = await Scan.countDocuments({
      timestamp: { $gte: last24h },
      isLegitimate: false,
    });

    // Active threats (unique fake domains in last 7 days)
    const last7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeThreats = await Scan.distinct("url", {
      timestamp: { $gte: last7d },
      isLegitimate: false,
    });

    res.json({
      totalDetections: totalScans,
      fakeDetections: fakeDetections,
      safeDetections: safeDetections,
      detectionRate:
        totalScans > 0 ? ((fakeDetections / totalScans) * 100).toFixed(1) : 0,
      recentScans: recentScans,
      recentFake: recentFake,
      activeThreats: activeThreats.length,
      blockedAttempts: fakeDetections,
    });
  } catch (error) {
    console.error("Error fetching stats:", error.message);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get detection trends (last 24 hours)
app.get("/api/trends", async (req, res) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trends = await Scan.aggregate([
      { $match: { timestamp: { $gte: last24h } } },
      {
        $group: {
          _id: {
            hour: { $hour: "$timestamp" },
            day: { $dayOfMonth: "$timestamp" },
          },
          detections: { $sum: 1 },
          blocked: {
            $sum: { $cond: [{ $eq: ["$isLegitimate", false] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.day": 1, "_id.hour": 1 } },
    ]);

    // Format for chart
    const formattedTrends = [];
    for (let i = 0; i < 24; i++) {
      const hourData = trends.find((t) => t._id.hour === i);
      formattedTrends.push({
        time: `${i.toString().padStart(2, "0")}:00`,
        detections: hourData?.detections || 0,
        blocked: hourData?.blocked || 0,
      });
    }

    res.json(formattedTrends);
  } catch (error) {
    console.error("Error fetching trends:", error.message);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

// Get top threats
app.get("/api/top-threats", async (req, res) => {
  try {
    const threats = await Scan.aggregate([
      { $match: { isLegitimate: false } },
      {
        $group: {
          _id: "$url",
          count: { $sum: 1 },
          firstSeen: { $min: "$timestamp" },
          lastSeen: { $max: "$timestamp" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const formattedThreats = threats.map((t) => {
      const risk =
        t.count > 100
          ? "Critical"
          : t.count > 50
            ? "High"
            : t.count > 20
              ? "Medium"
              : "Low";
      return {
        domain: extractDomain(t._id),
        count: t.count,
        risk: risk,
        firstSeen: t.firstSeen.toISOString().split("T")[0],
        lastSeen: t.lastSeen.toISOString().split("T")[0],
      };
    });

    res.json(formattedThreats);
  } catch (error) {
    console.error("Error fetching top threats:", error.message);
    res.status(500).json({ error: "Failed to fetch top threats" });
  }
});

// Get threat distribution
app.get("/api/threat-types", async (req, res) => {
  try {
    const fakeScans = await Scan.find({ isLegitimate: false });

    const threatTypes = {
      "Fake YONO Apps": 0,
      "Phishing Links": 0,
      "APK Malware": 0,
      "Fake KYC": 0,
    };

    fakeScans.forEach((scan) => {
      const url = scan.url.toLowerCase();
      if (url.includes("yono") || url.includes("yonobusiness")) {
        threatTypes["Fake YONO Apps"]++;
      } else if (url.includes("apk") || url.includes("download")) {
        threatTypes["APK Malware"]++;
      } else if (url.includes("kyc")) {
        threatTypes["Fake KYC"]++;
      } else {
        threatTypes["Phishing Links"]++;
      }
    });

    const total = fakeScans.length || 1;
    const distribution = Object.entries(threatTypes).map(([name, value]) => ({
      name: name,
      value: Math.round((value / total) * 100),
      color:
        name === "Fake YONO Apps"
          ? "#f44336"
          : name === "Phishing Links"
            ? "#ff9800"
            : name === "APK Malware"
              ? "#9c27b0"
              : "#2196f3",
    }));

    res.json(distribution);
  } catch (error) {
    console.error("Error fetching threat types:", error.message);
    res.status(500).json({ error: "Failed to fetch threat types" });
  }
});

// Get recent alerts
app.get("/api/recent-alerts", async (req, res) => {
  try {
    const recentFake = await Scan.find({ isLegitimate: false })
      .sort({ timestamp: -1 })
      .limit(10);

    const alerts = recentFake.map((scan) => ({
      id: scan._id,
      time: getTimeAgo(scan.timestamp),
      message: `Suspicious link detected: ${extractDomain(scan.url)}`,
      type:
        scan.confidence > 0.9
          ? "critical"
          : scan.confidence > 0.7
            ? "high"
            : "medium",
      url: scan.url,
    }));

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error.message);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// Helper function for time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

// ========== Start Server ==========
app.listen(PORT, () => {
  console.log(`🚀 Node.js backend running on http://localhost:${PORT}`);
  console.log(`📡 ML Service connected to: ${ML_SERVICE_URL}`);
});
