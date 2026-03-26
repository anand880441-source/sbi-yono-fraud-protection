const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// In-memory storage for reported apps (replace with database later)
const reportedApps = [];

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "SBI Fraud Detection API",
    timestamp: new Date(),
  });
});

// Detect URL endpoint
app.post("/api/detect", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Call Python ML service
    const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, { url });

    res.json({
      success: true,
      data: response.data,
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

// Report fake app endpoint
app.post("/api/report", async (req, res) => {
  try {
    const { url, reporter, source } = req.body;

    const report = {
      id: Date.now(),
      url,
      reporter: reporter || "anonymous",
      source: source || "manual",
      reportedAt: new Date().toISOString(),
      status: "pending",
    };

    reportedApps.push(report);

    // Also forward to ML service for logging (don't fail if this errors)
    try {
      await axios.post(`${ML_SERVICE_URL}/report_fake_app`, {
        url,
        reporter: reporter || "anonymous",
        source: source || "backend",
      });
      console.log(`✅ Report logged to ML service: ${url}`);
    } catch (e) {
      console.log(`⚠️ ML service report logging failed: ${e.message}`);
      // Don't fail the main request if ML service logging fails
    }

    res.json({
      success: true,
      message: "Fake app reported successfully",
      report,
    });
  } catch (error) {
    console.error("Error reporting app:", error.message);
    res.status(500).json({ success: false, error: "Failed to report app" });
  }
});

// Get all reported apps
app.get("/api/reports", (req, res) => {
  res.json({
    success: true,
    count: reportedApps.length,
    reports: reportedApps,
  });
});

// Bulk URL detection (for scanning multiple links)
app.post("/api/detect-bulk", async (req, res) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: "URLs array is required" });
    }

    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          const response = await axios.post(`${ML_SERVICE_URL}/detect_url`, {
            url,
          });
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Node.js backend running on http://localhost:${PORT}`);
  console.log(`📡 ML Service connected to: ${ML_SERVICE_URL}`);
});
