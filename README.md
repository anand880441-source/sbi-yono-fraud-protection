# SBI YONO Fraud Protection System

## Overview
A multi-layered security solution to protect SBI customers from fake YONO apps and phishing links. The system detects fraudulent URLs with 95% confidence and provides real-time warnings across web, WhatsApp, and browser platforms.

## Features
- 🧠 **AI-Powered URL Detection** - 95% accuracy in detecting fake YONO apps
- 🌐 **React Dashboard** - Admin interface for URL checking and reporting
- 💬 **WhatsApp Bot** - Real-time link checking in WhatsApp
- 🔌 **Chrome Extension** - Browser-level protection with automatic warnings
- 📊 **Real-time Reporting** - Users can report fake apps instantly

## Tech Stack
- **Backend**: Node.js + Express
- **ML Service**: Python + FastAPI
- **Frontend**: React.js
- **Detection**: Rule-based scoring with 10+ features
- **Browser**: Chrome Extension (Manifest V3)

## Prerequisites
- Node.js (v16+)
- Python (3.8+)
- npm or yarn
- Chrome browser (for extension)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/sbi-yono-fraud-protection.git
cd sbi-yono-fraud-protection
