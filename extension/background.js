// Background service worker for Chrome extension
const BACKEND_URL = 'http://localhost:5000/api';

// Listen for navigation to check URLs
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId === 0) { // Main frame only
        const url = details.url;
        
        // Skip chrome:// and extension pages
        if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
            return;
        }
        
        try {
            console.log('Checking URL:', url);
            
            // Check URL safety
            const result = await checkUrl(url);
            
            console.log('Detection result:', result);
            
            if (!result.is_legitimate) {
                console.log('Fake URL detected! Redirecting...');
                
                // Build warning URL with properly encoded parameters
                const encodedUrl = encodeURIComponent(url);
                const warningUrl = chrome.runtime.getURL(`warning.html?url=${encodedUrl}&confidence=${result.confidence}`);
                
                console.log('Redirecting to:', warningUrl);
                
                // Redirect to warning page
                chrome.tabs.update(details.tabId, {
                    url: warningUrl
                });
            }
        } catch (error) {
            console.error('Error checking URL:', error);
        }
    }
});

// Function to check URL
async function checkUrl(url) {
    try {
        const response = await fetch(`${BACKEND_URL}/detect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        return data.data;
        
    } catch (error) {
        console.error('Error checking URL:', error);
        // Assume safe if backend unreachable to avoid blocking all sites
        return { is_legitimate: true, confidence: 0 };
    }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkUrl') {
        checkUrl(request.url).then(result => {
            sendResponse(result);
        });
        return true; // Keep message channel open for async response
    }
});

console.log('SBI YONO SafeGuard extension loaded');
