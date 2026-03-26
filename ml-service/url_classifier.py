import re

class URLClassifier:
    def __init__(self):
        self.is_trained = True
        
    def extract_features(self, url):
        """Extract features from URL for classification"""
        features = {}
        
        # URL length
        features['length'] = len(url)
        
        # Contains IP address
        features['has_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
        
        # Contains @ symbol
        features['has_at'] = 1 if '@' in url else 0
        
        # Number of dots
        features['num_dots'] = url.count('.')
        
        # Number of hyphens
        features['num_hyphens'] = url.count('-')
        
        # Number of slashes
        features['num_slashes'] = url.count('/')
        
        # Has 'sbi' or 'yono' in domain
        try:
            domain = url.split('/')[2] if len(url.split('/')) > 2 else ''
        except:
            domain = ''
        features['has_sbi_keyword'] = 1 if 'sbi' in domain.lower() or 'yono' in domain.lower() else 0
        
        # Is HTTPS
        features['is_https'] = 1 if url.startswith('https') else 0
        
        # Has suspicious keywords
        suspicious = ['download', 'apk', 'update', 'kyc', 'verify', 'click', 'login', 'secure', 'validate', 'account']
        features['has_suspicious'] = 1 if any(word in url.lower() for word in suspicious) else 0
        
        # Check if domain is official SBI domain
        official_domains = ['sbi.co.in', 'onlinesbi.com', 'yonobusiness.sbi', 'retail.onlinesbi.com']
        features['is_official_domain'] = 1 if any(domain == official or domain.endswith('.' + official) for official in official_domains) else 0
        
        # Number of query parameters
        features['num_params'] = url.count('&') + url.count('?')
        
        return list(features.values())
    
    def predict(self, url):
        """Rule-based prediction with weighted scoring"""
        features = self.extract_features(url)
        
        # Scoring system (higher score = more legitimate)
        score = 0
        
        # Strong positive signals (legitimate)
        if features[10] == 1:  # is_official_domain
            score += 100
        elif features[7] == 1 and features[6] == 1:  # HTTPS + has SBI keyword
            score += 50
        elif features[7] == 1:  # HTTPS only
            score += 20
        
        # Negative signals (fake)
        if features[1] == 1:  # has_ip
            score -= 100
        if features[2] == 1:  # has_at
            score -= 80
        if features[8] == 1:  # has_suspicious (download, apk, etc.)
            score -= 60
        if features[7] == 0 and features[6] == 1:  # HTTP + has SBI keyword (fake usually)
            score -= 40
        if features[0] > 60:  # very long URL
            score -= 20
        if features[3] > 4:   # too many dots
            score -= 15
        if features[4] > 3:   # too many hyphens
            score -= 15
        
        # Special rule: If URL contains suspicious words AND is not official domain, mark as fake
        if features[8] == 1 and features[10] == 0:
            score -= 50
        
        # Determine if legitimate (score > 0 means legitimate)
        is_legitimate = score > 0
        
        # Calculate confidence based on score magnitude
        confidence = min(abs(score) / 100, 0.95)
        if confidence < 0.5:
            confidence = 0.5
        
        return {
            'is_legitimate': is_legitimate,
            'confidence': float(confidence),
            'score': score,
            'features': {
                'length': features[0],
                'has_ip': features[1],
                'has_at': features[2],
                'num_dots': features[3],
                'num_hyphens': features[4],
                'num_slashes': features[5],
                'has_sbi_keyword': features[6],
                'is_https': features[7],
                'has_suspicious': features[8],
                'num_params': features[9],
                'is_official_domain': features[10]
            }
        }
    
    def load_model(self):
        return True
    
    def train(self):
        return True