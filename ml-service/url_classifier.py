import re
import joblib
import os
from advanced_model import AdvancedMLModel

class URLClassifier:
    def __init__(self):
        self.model = None
        self.advanced_model = AdvancedMLModel()
        self.use_advanced = False
        
    def extract_features(self, url):
        """Extract features using advanced model"""
        return self.advanced_model.extract_advanced_features(url)
    
    def train_advanced(self):
        """Train advanced ML model"""
        print("🚀 Training advanced ML model...")
        metrics = self.advanced_model.train()
        self.use_advanced = True
        print(f"✅ Model trained! Accuracy: {metrics['accuracy']:.2%}")
        return metrics
    
    def load_advanced_model(self):
        """Load pre-trained advanced model"""
        if os.path.exists('models/random_forest.pkl'):
            self.advanced_model.model = joblib.load('models/random_forest.pkl')
            self.advanced_model.scaler = joblib.load('models/scaler.pkl')
            self.use_advanced = True
            return True
        return False
    
    def predict(self, url):
        """Predict using advanced model if available"""
        # Try to load advanced model first
        if not self.use_advanced:
            if not self.load_advanced_model():
                print("⚠️ Advanced model not found. Training new model...")
                self.train_advanced()
        
        # Extract features
        features = self.extract_features(url)
        
        # Get prediction from advanced model
        result = self.advanced_model.predict(features)
        
        return {
            'is_legitimate': result['is_legitimate'],
            'confidence': result['confidence'],
            'probabilities': result['probabilities'],
            'features': {
                'length': features[0],
                'num_dots': features[1],
                'num_hyphens': features[2],
                'num_slashes': features[3],
                'has_ip': features[5],
                'has_at': features[6],
                'is_https': features[7],
                'has_sbi_keyword': features[8],
                'has_yono_keyword': features[9],
                'has_suspicious': features[10],
                'num_params': features[11],
                'entropy': round(features[16], 3)
            }
        }
    
    def train(self):
        """Alias for train_advanced"""
        return self.train_advanced()
    
    def load_model(self):
        """Alias for load_advanced_model"""
        return self.load_advanced_model()
