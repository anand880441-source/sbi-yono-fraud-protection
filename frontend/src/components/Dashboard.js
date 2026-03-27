import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiExternalLink,
  FiShield,
  FiTrendingUp,
  FiClock,
} from "react-icons/fi";
import ThreatIntel from "./ThreatIntel/ThreatIntel";
import "./Dashboard.css";

const API_URL =
  process.env.REACT_APP_API_URL || "https://sbi-backend-b5hk.onrender.com/api";

function Dashboard() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentUrls, setRecentUrls] = useState([]);
  const [reports, setReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  const [activeTab, setActiveTab] = useState("checker");
  const { user, logout } = useAuth();
  console.log("User in dashboard:", user);

 const handleLogout = () => {
    console.log("Logout clicked!");
    logout();
    navigate('/login');
};

  const detectUrl = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/detect`, { url });
      const detectionResult = response.data;
      setResult(detectionResult);

      setRecentUrls((prev) =>
        [
          {
            url,
            timestamp: new Date(),
            result: detectionResult.data.is_legitimate,
          },
          ...prev,
        ].slice(0, 5),
      );
    } catch (error) {
      console.error("Detection failed:", error);
      setResult({ error: "Failed to detect URL", data: null });
    } finally {
      setLoading(false);
    }
  };

  const reportFakeApp = async () => {
    if (!url) {
      alert("No URL to report");
      return;
    }

    try {
      console.log("Reporting URL:", url);

      const response = await axios.post(`${API_URL}/report`, {
        url: url,
        reporter: "dashboard_user",
        source: "web_dashboard",
      });

      console.log("Report response:", response.data);

      if (response.data.success) {
        alert(
          "✅ Fake app reported successfully! We will review and block it.",
        );
        loadReports();
      } else {
        alert(
          "❌ Failed to report: " + (response.data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Report failed:", error);
      console.error("Error details:", error.response?.data);
      alert(
        "❌ Failed to report. Please try again. Error: " +
          (error.response?.data?.error || error.message),
      );
    }
  };

  const loadReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/reports`);
      setReports(response.data.reports);
    } catch (error) {
      console.error("Failed to load reports");
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.7) return "#4caf50";
    if (confidence > 0.4) return "#ff9800";
    return "#f44336";
  };

  return (
    <div className="dashboard">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <FiShield size={32} color="#0066b3" />
            <h1>SBI YONO Fraud Protection</h1>
          </div>
          <p className="tagline">
            Protecting customers from fake apps and phishing links
          </p>
          <div className="user-menu">
            <span className="user-name">👋 Hello, {user?.name}</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="sbi-badge">
        <span>India's Largest Public Sector Bank</span>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <FiTrendingUp size={24} />
          <div className="stat-info">
            <h3>URLs Scanned</h3>
            <p>{recentUrls.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <FiClock size={24} />
          <div className="stat-info">
            <h3>Recent Checks</h3>
            <p>{recentUrls.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <FiAlertTriangle size={24} />
          <div className="stat-info">
            <h3>Fake Detected</h3>
            <p>{recentUrls.filter((u) => !u.result).length}</p>
          </div>
        </div>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "checker" ? "tab active" : "tab"}
          onClick={() => setActiveTab("checker")}
        >
          🔍 URL Checker
        </button>
        <button
          className={activeTab === "intel" ? "tab active" : "tab"}
          onClick={() => setActiveTab("intel")}
        >
          📊 Threat Intelligence
        </button>
      </div>

      {activeTab === "checker" ? (
        <div className="main-content">
          <div className="url-checker">
            <h2>Check URL Safety</h2>
            <form onSubmit={detectUrl}>
              <input
                type="text"
                placeholder="Enter suspicious link (e.g., http://sbi-update.com/download)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="url-input"
              />
              <button type="submit" disabled={loading} className="check-btn">
                {loading ? "Checking..." : "Check URL"}
              </button>
            </form>

            {result && result.data && (
              <div
                className={`result-card ${result.data.is_legitimate ? "safe" : "danger"}`}
              >
                <div className="result-icon">
                  {result.data.is_legitimate ? (
                    <FiCheckCircle size={48} />
                  ) : (
                    <FiAlertTriangle size={48} />
                  )}
                </div>
                <div className="result-details">
                  <h3>
                    {result.data.is_legitimate
                      ? "✓ Safe Link"
                      : "⚠️ Suspicious Link Detected!"}
                  </h3>
                  <p className="warning-text">{result.data.warning}</p>
                  <div className="confidence-bar">
                    <div
                      className="confidence-fill"
                      style={{
                        width: `${result.data.confidence * 100}%`,
                        backgroundColor: getConfidenceColor(
                          result.data.confidence,
                        ),
                      }}
                    />
                    <span>
                      Confidence: {(result.data.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="features">
                    <h4>URL Analysis:</h4>
                    <div className="feature-grid">
                      <span>🔗 Length: {result.data.features.length}</span>
                      <span>
                        🔒 HTTPS: {result.data.features.is_https ? "Yes" : "No"}
                      </span>
                      <span>
                        ⚠️ Suspicious Words:{" "}
                        {result.data.features.has_suspicious ? "Yes" : "No"}
                      </span>
                      <span>
                        🏢 Official Domain:{" "}
                        {result.data.features.is_official_domain ? "Yes" : "No"}
                      </span>
                      <span>
                        🌐 IP Address:{" "}
                        {result.data.features.has_ip ? "Yes" : "No"}
                      </span>
                      <span>📊 Dots: {result.data.features.num_dots}</span>
                    </div>
                  </div>
                  {!result.data.is_legitimate && (
                    <button onClick={reportFakeApp} className="report-btn">
                      🚨 Report This Fake App
                    </button>
                  )}
                </div>
              </div>
            )}

            {result && result.error && (
              <div className="error-card">
                <p>❌ Error: {result.error}</p>
              </div>
            )}
          </div>

          <div className="sidebar">
            <div className="recent-section">
              <h3>Recent Checks</h3>
              {recentUrls.map((item, idx) => (
                <div key={idx} className="recent-item">
                  <span
                    className={item.result ? "safe-dot" : "danger-dot"}
                  ></span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    {item.url.length > 40
                      ? item.url.substring(0, 40) + "..."
                      : item.url}
                    <FiExternalLink size={12} />
                  </a>
                  <small>{item.timestamp.toLocaleTimeString()}</small>
                </div>
              ))}
            </div>

            <div className="tips-section">
              <h3>🔒 Safety Tips</h3>
              <ul>
                <li>
                  ✅ Always download YONO from Google Play Store or Apple App
                  Store
                </li>
                <li>✅ Never click on suspicious links in SMS or WhatsApp</li>
                <li>✅ SBI never asks for OTP or MPIN via email/SMS</li>
                <li>✅ Check for "https://" and "sbi.co.in" in the URL</li>
                <li>✅ Report fake apps immediately using this dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <ThreatIntel />
      )}
    </div>
  );
}

export default Dashboard;
