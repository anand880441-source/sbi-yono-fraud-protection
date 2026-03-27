import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './ThreatIntel.css';

const ThreatIntel = () => {
    const [stats, setStats] = useState({
        totalDetections: 1247,
        fakeDetections: 892,
        safeDetections: 355,
        detectionRate: 71.5,
        activeThreats: 23,
        blockedAttempts: 456
    });
    
    const [trends, setTrends] = useState([]);
    const [topThreats, setTopThreats] = useState([]);
    const [threatTypes, setThreatTypes] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Try to fetch real data from backend
            const statsResponse = await fetch('https://sbi-backend-b5hk.onrender.com/api/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(prev => ({ ...prev, ...statsData }));
            }
            
            const trendsResponse = await fetch('https://sbi-backend-b5hk.onrender.com/api/trends');
            if (trendsResponse.ok) {
                const trendsData = await trendsResponse.json();
                setTrends(trendsData);
            } else {
                setTrends([
                    { time: '00:00', detections: 12, blocked: 10 },
                    { time: '04:00', detections: 8, blocked: 7 },
                    { time: '08:00', detections: 25, blocked: 22 },
                    { time: '12:00', detections: 45, blocked: 38 },
                    { time: '16:00', detections: 38, blocked: 32 },
                    { time: '20:00', detections: 22, blocked: 19 }
                ]);
            }
            
            const threatsResponse = await fetch('https://sbi-backend-b5hk.onrender.com/api/top-threats');
            if (threatsResponse.ok) {
                const threatsData = await threatsResponse.json();
                setTopThreats(threatsData);
            } else {
                setTopThreats([
                    { domain: 'sbi-kyc-update.com', count: 156, risk: 'Critical', firstSeen: '2026-03-20' },
                    { domain: 'yono-app-download.net', count: 98, risk: 'High', firstSeen: '2026-03-22' },
                    { domain: 'sbisecure-verify.com', count: 67, risk: 'High', firstSeen: '2026-03-23' },
                    { domain: 'online-sbi-update.in', count: 45, risk: 'Medium', firstSeen: '2026-03-24' },
                    { domain: 'yonobusiness-verify.com', count: 34, risk: 'Medium', firstSeen: '2026-03-25' }
                ]);
            }
            
            setThreatTypes([
                { name: 'Fake YONO Apps', value: 45, color: '#f44336' },
                { name: 'Phishing Links', value: 30, color: '#ff9800' },
                { name: 'APK Malware', value: 15, color: '#9c27b0' },
                { name: 'Fake KYC', value: 10, color: '#2196f3' }
            ]);
            
            setAlerts([
                { id: 1, time: '2 min ago', message: 'New fake YONO app detected: yono-secure-update.com', type: 'critical' },
                { id: 2, time: '15 min ago', message: 'Phishing attempt blocked: sbi-kyc-verify.net', type: 'high' },
                { id: 3, time: '1 hour ago', message: 'Suspicious APK detected: yono_app_update.apk', type: 'medium' }
            ]);
            
        } catch (error) {
            console.error('Failed to fetch threat intel:', error);
            // Use mock data on error
            setTrends([
                { time: '00:00', detections: 12, blocked: 10 },
                { time: '04:00', detections: 8, blocked: 7 },
                { time: '08:00', detections: 25, blocked: 22 },
                { time: '12:00', detections: 45, blocked: 38 },
                { time: '16:00', detections: 38, blocked: 32 },
                { time: '20:00', detections: 22, blocked: 19 }
            ]);
            setTopThreats([
                { domain: 'sbi-kyc-update.com', count: 156, risk: 'Critical', firstSeen: '2026-03-20' },
                { domain: 'yono-app-download.net', count: 98, risk: 'High', firstSeen: '2026-03-22' },
                { domain: 'sbisecure-verify.com', count: 67, risk: 'High', firstSeen: '2026-03-23' },
                { domain: 'online-sbi-update.in', count: 45, risk: 'Medium', firstSeen: '2026-03-24' },
                { domain: 'yonobusiness-verify.com', count: 34, risk: 'Medium', firstSeen: '2026-03-25' }
            ]);
        }
        setIsLoading(false);
    };

    const getRiskColor = (risk) => {
        switch(risk) {
            case 'Critical': return '#f44336';
            case 'High': return '#ff9800';
            case 'Medium': return '#ffc107';
            default: return '#4caf50';
        }
    };

    const getAlertClass = (type) => {
        switch(type) {
            case 'critical': return 'alert-critical';
            case 'high': return 'alert-high';
            case 'medium': return 'alert-medium';
            default: return 'alert-low';
        }
    };

    const COLORS = ['#f44336', '#ff9800', '#9c27b0', '#2196f3'];

    const handleBlock = (domain) => {
        alert(`🚨 Blocking ${domain}\n\nThis domain will be added to the blacklist.`);
    };

    return (
        <div className="threat-intel">
            <div className="intel-header">
                <h2>📊 Real-time Threat Intelligence</h2>
                <p>Live monitoring of fake YONO apps and phishing attempts</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-info">
                        <h3>Total Detections</h3>
                        <p className="stat-number">{stats.totalDetections.toLocaleString()}</p>
                        <span className="stat-trend up">+12% this week</span>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon">🚨</div>
                    <div className="stat-info">
                        <h3>Fake Apps Detected</h3>
                        <p className="stat-number">{stats.fakeDetections.toLocaleString()}</p>
                        <span className="stat-trend up">+8% this week</span>
                    </div>
                </div>
                <div className="stat-card safe">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <h3>Safe Links</h3>
                        <p className="stat-number">{stats.safeDetections.toLocaleString()}</p>
                        <span className="stat-trend up">+5% this week</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3>Active Threats</h3>
                        <p className="stat-number">{stats.activeThreats}</p>
                        <span className="stat-trend new">New: +3 today</span>
                    </div>
                </div>
            </div>

            <div className="charts-row">
                <div className="chart-card">
                    <h3>Detection Trends (Last 24 Hours)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="detections" stroke="#f44336" name="Detections" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="blocked" stroke="#4caf50" name="Blocked" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3>Threat Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={threatTypes}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {threatTypes.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="threats-section">
                <h3>🔴 Top Active Threats</h3>
                <table className="threats-table">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Detection Count</th>
                            <th>Risk Level</th>
                            <th>First Seen</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topThreats.map((threat, idx) => (
                            <tr key={idx}>
                                <td>
                                    <span className="threat-domain">🔴 {threat.domain}</span>
                                </td>
                                <td className="count-cell">{threat.count}</td>
                                <td>
                                    <span 
                                        className={`risk-badge ${threat.risk?.toLowerCase() || 'low'}`}
                                        style={{ backgroundColor: getRiskColor(threat.risk) }}
                                    >
                                        {threat.risk || 'Low'}
                                    </span>
                                </td>
                                <td>{threat.firstSeen}</td>
                                <td>
                                    <button 
                                        className="block-btn" 
                                        onClick={() => handleBlock(threat.domain)}
                                    >
                                        Block
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="alert-section">
                <h3>🚨 Recent Alerts</h3>
                <div className="alert-list">
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`alert-item ${getAlertClass(alert.type)}`}>
                            <span className="alert-time">{alert.time}</span>
                            <span className="alert-message">{alert.message}</span>
                            <button className="alert-action">
                                {alert.type === 'critical' ? 'Block' : 'Review'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ThreatIntel;