const BACKEND_URL = 'http://localhost:5000/api';

document.getElementById('checkBtn').addEventListener('click', async () => {
    const url = document.getElementById('urlInput').value;
    const resultDiv = document.getElementById('result');
    
    if (!url) {
        resultDiv.innerHTML = '<div class="result" style="background: #ff9800;">Please enter a URL</div>';
        return;
    }
    
    resultDiv.innerHTML = '<div class="loading">Checking... 🔍</div>';
    
    try {
        const response = await fetch(`${BACKEND_URL}/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        const result = data.data;
        
        if (result.is_legitimate) {
            resultDiv.innerHTML = `
                <div class="result result-safe">
                    ✅ SAFE LINK<br>
                    Confidence: ${(result.confidence * 100).toFixed(1)}%<br>
                    ${result.warning}
                </div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div class="result result-danger">
                    🚨 FAKE APP DETECTED!<br>
                    Confidence: ${(result.confidence * 100).toFixed(1)}%<br>
                    ${result.warning}<br>
                    <button id="reportFromPopup" style="margin-top: 8px; background: white; color: #f44336; padding: 5px;">Report This Fake App</button>
                </div>
            `;
            
            document.getElementById('reportFromPopup')?.addEventListener('click', async () => {
                await fetch(`${BACKEND_URL}/report`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, source: 'chrome_extension_popup' })
                });
                alert('✅ Reported! Our team will review and block it.');
            });
        }
        
    } catch (error) {
        resultDiv.innerHTML = '<div class="result" style="background: #f44336;">Error checking URL. Please try again.</div>';
    }
});
