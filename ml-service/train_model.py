import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import requests
import json

class AdvancedMLModel:
    def __init__(self):
        self.model = None
        self.feature_names = [
            'url_length', 'num_dots', 'num_hyphens', 'num_slashes',
            'has_ip', 'has_at', 'has_https', 'has_sbi_keyword',
            'has_suspicious', 'num_params', 'domain_age_days',
            'has_google_safe_browsing', 'alexa_rank'
        ]
    
    def fetch_phishing_data(self):
        """Fetch real phishing dataset from open source"""
        # Using PhishTank dataset (free API)
        try:
            response = requests.get(
                'https://raw.githubusercontent.com/mitchellkrogza/Phishing.Database/master/phishing-domains.csv',
                timeout=30
            )
            df = pd.read_csv(pd.compat.StringIO(response.text))
            return df
        except:
            print("Using local training data")
            return self.generate_training_data()
    
    def generate_training_data(self):
        """Generate synthetic training data with 1000+ samples"""
        np.random.seed(42)
        n_samples = 2000
        
        # Generate legitimate URLs (SBI and other safe sites)
        legitimate = []
        for _ in range(n_samples // 2):
            features = [
                np.random.randint(20, 60),  # url_length
                np.random.randint(1, 4),    # num_dots
                np.random.randint(0, 2),    # num_hyphens
                np.random.randint(2, 5),    # num_slashes
                0,                          # has_ip
                0,                          # has_at
                1,                          # has_https
                np.random.choice([0, 1], p=[0.7, 0.3]),  # has_sbi_keyword
                0,                          # has_suspicious
                np.random.randint(0, 3),    # num_params
                np.random.randint(100, 3650),  # domain_age_days
                1,                          # has_google_safe_browsing
                np.random.randint(1, 10000)  # alexa_rank
            ]
            legitimate.append(features)
        
        # Generate phishing URLs
        phishing = []
        for _ in range(n_samples // 2):
            features = [
                np.random.randint(50, 120),  # url_length
                np.random.randint(3, 8),     # num_dots
                np.random.randint(1, 5),     # num_hyphens
                np.random.randint(3, 8),     # num_slashes
                np.random.choice([0, 1], p=[0.8, 0.2]),  # has_ip
                np.random.choice([0, 1], p=[0.9, 0.1]),  # has_at
                np.random.choice([0, 1], p=[0.3, 0.7]),  # has_https
                np.random.choice([0, 1], p=[0.5, 0.5]),  # has_sbi_keyword
                1,                          # has_suspicious
                np.random.randint(1, 10),   # num_params
                np.random.randint(1, 30),   # domain_age_days (new domain)
                0,                          # has_google_safe_browsing
                np.random.randint(50000, 1000000)  # alexa_rank
            ]
            phishing.append(features)
        
        X = np.array(legitimate + phishing)
        y = np.array([1] * (n_samples // 2) + [0] * (n_samples // 2))
        
        return X, y
    
    def train(self):
        """Train advanced ML model"""
        print("🔄 Fetching training data...")
        X, y = self.generate_training_data()
        
        print(f"📊 Training with {len(X)} samples")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Train Random Forest
        self.model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )
        
        self.model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"✅ Model trained! Accuracy: {accuracy:.2%}")
        print("\n📈 Classification Report:")
        print(classification_report(y_test, y_pred))
        
        # Save model
        joblib.dump(self.model, 'models/advanced_url_classifier.pkl')
        joblib.dump(self.feature_names, 'models/feature_names.pkl')
        
        return accuracy
    
    def predict_proba(self, features):
        """Predict probability"""
        if self.model is None:
            self.model = joblib.load('models/advanced_url_classifier.pkl')
        
        proba = self.model.predict_proba([features])[0]
        return {
            'is_legitimate': proba[1] > 0.5,
            'confidence': float(max(proba)),
            'probabilities': {
                'legitimate': float(proba[1]),
                'phishing': float(proba[0])
            }
        }

if __name__ == "__main__":
    model = AdvancedMLModel()
    model.train()