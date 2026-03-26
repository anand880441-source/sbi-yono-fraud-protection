// warning.js - External script for warning page

// Get URL parameters when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Warning page loaded');
    
    // Get the full URL and parse
    const currentUrl = window.location.href;
    const urlParams = new URLSearchParams(window.location.search);
    
    // Get parameters
    let suspiciousUrl = urlParams.get('url');
    let confidence = parseFloat(urlParams.get('confidence'));
    
    console.log('URL param:', suspiciousUrl);
    console.log('Confidence param:', confidence);
    
    // Handle missing parameters
    if (!suspiciousUrl) {
        suspiciousUrl = 'URL parameter missing - please ensure backend is running on port 5000';
    } else {
        // Decode the URL
        suspiciousUrl = decodeURIComponent(suspiciousUrl);
    }
    
    if (isNaN(confidence)) {
        confidence = 0.95;
    }
    
    // Display the URL
    const urlText = document.getElementById('urlText');
    if (urlText) {
        urlText.textContent = suspiciousUrl;
    }
    
    // Display confidence
    const confidencePercent = Math.round(confidence * 100);
    const confidenceValue = document.getElementById('confidenceValue');
    if (confidenceValue) {
        confidenceValue.textContent = `${confidencePercent}%`;
        
        // Change color based on confidence
        if (confidencePercent > 80) {
            confidenceValue.style.color = '#c62828';
        } else if (confidencePercent > 50) {
            confidenceValue.style.color = '#ff9800';
        } else {
            confidenceValue.style.color = '#4caf50';
        }
    }
    
    // Debug info
    const debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
        debugDiv.style.display = 'block';
        debugDiv.innerHTML = `
            <strong>Debug Info:</strong><br>
            Full URL: ${currentUrl}<br>
            Search String: ${window.location.search}<br>
            URL Param 'url': ${urlParams.get('url')}<br>
            URL Param 'confidence': ${urlParams.get('confidence')}<br>
            Decoded URL: ${suspiciousUrl}
        `;
    }
});

// Report button functionality (separate function)
function reportFakeApp() {
    const reportBtn = document.getElementById('reportBtn');
    const suspiciousUrl = document.getElementById('urlText')?.textContent || '';
    
    if (!reportBtn) return;
    
    reportBtn.disabled = true;
    reportBtn.textContent = 'Reporting...';
    
    fetch('http://localhost:5000/api/report', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: suspiciousUrl,
            reporter: 'chrome_extension',
            source: 'warning_page'
        })
    })
    .then(response => {
        if (response.ok) {
            alert('✅ Thank you for reporting! Our security team will review and block this fake app immediately.');
            reportBtn.textContent = '✓ Reported Successfully';
            reportBtn.style.background = '#4caf50';
        } else {
            alert('❌ Failed to report. Please try again.');
            reportBtn.disabled = false;
            reportBtn.textContent = '🚨 Report This Fake App';
        }
    })
    .catch(error => {
        console.error('Report failed:', error);
        alert('❌ Could not connect to reporting service. Please make sure the backend is running on port 5000.');
        reportBtn.disabled = false;
        reportBtn.textContent = '🚨 Report This Fake App';
    });
}

// Close page function
function closePage() {
    window.close();
}

// Add keyboard shortcut to close
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.close();
    }
});
