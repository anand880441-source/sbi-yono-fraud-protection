import re
import joblib
import os

class URLClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.use_advanced = False
        
    def extract_features(self, url):
        """Extract features from URL for classification"""
        features = {}
        
        features['length'] = len(url)
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = url.count('-')
        features['num_slashes'] = url.count('/')
        features['has_ip'] = 1 if re.search(r'\d+\.\d+\.\d+\.\d+', url) else 0
        features['has_at'] = 1 if '@' in url else 0
        features['is_https'] = 1 if url.startswith('https') else 0
        features['has_sbi_keyword'] = 1 if 'sbi' in url.lower() else 0
        features['has_yono_keyword'] = 1 if 'yono' in url.lower() else 0
        
        suspicious = ['download', 'apk', 'update', 'kyc', 'verify', 'click', 'login']
        features['has_suspicious'] = 1 if any(word in url.lower() for word in suspicious) else 0
        features['num_params'] = url.count('&') + url.count('?')
        
        # Domain analysis
        try:
            domain = url.split('/')[2] if len(url.split('/')) > 2 else ''
            features['domain_length'] = len(domain)
            features['subdomain_count'] = domain.count('.')
        except:
            features['domain_length'] = 0
            features['subdomain_count'] = 0
        
        return list(features.values())
    
    def load_model(self):
        """Load pre-trained model"""
        try:
            if os.path.exists('models/random_forest.pkl'):
                self.model = joblib.load('models/random_forest.pkl')
                self.scaler = joblib.load('models/scaler.pkl')
                self.use_advanced = True
                print("Model loaded successfully")
                return True
        except Exception as e:
            print(f"Error loading model: {e}")
        return False
    
    def train(self):
        """Train the model"""
        from advanced_model import AdvancedMLModel
        advanced = AdvancedMLModel()
        metrics = advanced.train()
        self.model = advanced.model
        self.scaler = advanced.scaler
        self.use_advanced = True
        return metrics
    
    def predict(self, url):
        """Predict if URL is legitimate or fake"""
        features = self.extract_features(url)
        
        if not self.use_advanced:
            if not self.load_model():
                self.train()
        
        # Scale features if scaler exists
        if self.scaler:
            features_scaled = self.scaler.transform([features])
            proba = self.model.predict_proba(features_scaled)[0]
        else:
            proba = self.model.predict_proba([features])[0]
        
        is_legitimate = proba[1] > 0.5
        
        warning = ""
        if not is_legitimate:
            warning = "⚠️ WARNING: This link appears suspicious! Only download YONO from official app stores."
        else:
            warning = "✓ This link appears safe. Always verify the URL before entering credentials."
        
        return {
            'is_legitimate': is_legitimate,
            'confidence': float(max(proba)),
            'warning': warning,
            'features': {
                'length': features[0],
                'num_dots': features[1],
                'num_hyphens': features[2],
                'num_slashes': features[3],
                'has_ip': features[4],
                'has_at': features[5],
                'is_https': features[6],
                'has_sbi_keyword': features[7],
                'has_yono_keyword': features[8],
                'has_suspicious': features[9],
                'num_params': features[10],
                'domain_length': features[11],
                'subdomain_count': features[12]
            }
        }
