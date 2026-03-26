import requests
import os

class GoogleSafeBrowsing:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('GOOGLE_SAFE_BROWSING_KEY', '')
        self.api_url = 'https://safebrowsing.googleapis.com/v4/threatMatches:find'
    
    def check_url(self, url):
        """Check URL against Google Safe Browsing database"""
        if not self.api_key:
            return {'safe': True, 'reason': 'No API key'}
        
        payload = {
            'client': {
                'clientId': 'sbi-fraud-protection',
                'clientVersion': '1.0.0'
            },
            'threatInfo': {
                'threatTypes': [
                    'MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE',
                    'POTENTIALLY_HARMFUL_APPLICATION'
                ],
                'platformTypes': ['ANY_PLATFORM'],
                'threatEntryTypes': ['URL'],
                'threatEntries': [{'url': url}]
            }
        }
        
        try:
            response = requests.post(
                f"{self.api_url}?key={self.api_key}",
                json=payload,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'matches' in data:
                    return {
                        'safe': False,
                        'reason': data['matches'][0]['threatType'],
                        'details': data['matches']
                    }
            
            return {'safe': True, 'reason': 'Not flagged'}
            
        except Exception as e:
            print(f"Safe Browsing API error: {e}")
            return {'safe': True, 'reason': 'API error'}