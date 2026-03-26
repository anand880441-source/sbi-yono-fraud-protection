// Content script that runs on web pages
let warningShown = false;

// Function to check for APK download links
function checkForAPKLinks() {
    const links = document.querySelectorAll('a[href$=".apk"], a[href*="download"]');
    
    links.forEach(link => {
        const url = link.href;
        
        // Send to background for checking
        chrome.runtime.sendMessage({ action: 'checkUrl', url: url }, (response) => {
            if (response && !response.is_legitimate && !warningShown) {
                warningShown = true;
                showInlineWarning(link, url);
            }
        });
    });
}

// Show inline warning near suspicious link
function showInlineWarning(link, url) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'sbi-security-warning';
    warningDiv.innerHTML = `
        <div style="background: #ff4444; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; border: 2px solid #cc0000;">
            <strong>⚠️ SBI YONO Security Alert</strong><br>
            This link may lead to a fake YONO app!<br>
            <small>URL: ${url.substring(0, 80)}${url.length > 80 ? '...' : ''}</small><br>
            <button id="sbi-report-btn" style="margin-top: 5px; background: white; color: #ff4444; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">
                🚨 Report Fake App
            </button>
        </div>
    `;
    
    link.parentNode.insertBefore(warningDiv, link);
    
    // Add report functionality
    const reportBtn = warningDiv.querySelector('#sbi-report-btn');
    if (reportBtn) {
        reportBtn.onclick = () => {
            fetch('http://localhost:5000/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, source: 'chrome_extension' })
            }).then(() => {
                alert('✅ Reported! Thank you for helping keep SBI customers safe.');
                warningDiv.remove();
            }).catch(() => {
                alert('Failed to report. Please try again.');
            });
        };
    }
}

// Run on page load
checkForAPKLinks();

// Also run when new content loads (for SPAs)
const observer = new MutationObserver(() => {
    checkForAPKLinks();
});
observer.observe(document.body, { childList: true, subtree: true });
