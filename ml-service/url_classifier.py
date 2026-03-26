import re
import joblib
import os

class URLClassifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.advanced_model = None
        
    def load_model(self):
        """Load pre-trained model"""
        try:
            from advanced_model import AdvancedMLModel
            self.advanced_model = AdvancedMLModel()
            self.advanced_model.model = joblib.load('models/random_forest.pkl')
            self.advanced_model.scaler = joblib.load('models/scaler.pkl')
            print("Advanced model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading model: {e}")
            return False
    
    def train(self):
        """Train the model"""
        from advanced_model import AdvancedMLModel
        self.advanced_model = AdvancedMLModel()
        metrics = self.advanced_model.train()
        print(f"Model trained! Accuracy: {metrics['accuracy']:.2%}")
        return metrics
    
    def extract_features(self, url):
        """Extract features using advanced model"""
        if self.advanced_model is None:
            self.load_model()
        if self.advanced_model:
            return self.advanced_model.extract_advanced_features(url)
        return []
    
    def predict(self, url):
        """Predict if URL is legitimate or fake"""
        # Try to use advanced model
        try:
            if self.advanced_model is None:
                self.load_model()
            
            if self.advanced_model and self.advanced_model.model:
                features = self.advanced_model.extract_advanced_features(url)
                result = self.advanced_model.predict(features)
                
                is_legitimate = result['is_legitimate']
                confidence = result['confidence']
                
                warning = ""
                if not is_legitimate:
                    warning = "⚠️ WARNING: This link appears suspicious! Only download YONO from official app stores."
                else:
                    warning = "✓ This link appears safe. Always verify the URL before entering credentials."
                
                return {
                    'is_legitimate': is_legitimate,
                    'confidence': confidence,
                    'warning': warning,
                    'features': {
                        'length': features[0],
                        'num_dots': features[1],
                        'num_hyphens': features[2],
                        'num_slashes': features[3],
                        'has_ip': features[5],
                        'has_at': features[6],
                        'is_https': features[7],
                        'has_sbi_keyword': features[8],
                        'has_suspicious': features[10],
                        'num_params': features[11],
                        'entropy': round(features[16], 3) if len(features) > 16 else 0
                    }
                }
        except Exception as e:
            print(f"Error in advanced model: {e}")
        
        # Fallback to simple rule-based
        return self._rule_based_predict(url)
    
    def _rule_based_predict(self, url):
        """Fallback rule-based prediction"""
        # Simple rule-based detection
        is_legitimate = url.startswith('https') and 'sbi.co.in' in url
        confidence = 0.85 if is_legitimate else 0.75
        
        warning = ""
        if not is_legitimate:
            warning = "⚠️ WARNING: This link appears suspicious! Only download YONO from official app stores."
        else:
            warning = "✓ This link appears safe. Always verify the URL before entering credentials."
        
        return {
            'is_legitimate': is_legitimate,
            'confidence': confidence,
            'warning': warning,
            'features': {}
        }
