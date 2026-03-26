import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os
import math
from datetime import datetime

class AdvancedMLModel:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = [
            'url_length', 'num_dots', 'num_hyphens', 'num_slashes', 'num_underscores',
            'has_ip', 'has_at', 'has_https', 'has_sbi_keyword', 'has_yono_keyword',
            'has_suspicious', 'num_params', 'has_double_slash', 'has_redirect',
            'domain_length', 'subdomain_count', 'entropy'
        ]
        self.model_type = None
    
    def calculate_entropy(self, url):
        """Calculate Shannon entropy of URL"""
        prob = [float(url.count(c)) / len(url) for c in set(url)]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob if p > 0])
        return entropy
    
    def extract_advanced_features(self, url):
        """Extract advanced features from URL"""
        features = {}
        
        features['url_length'] = len(url)
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = url.count('-')
        features['num_slashes'] = url.count('/')
        features['num_underscores'] = url.count('_')
        
        features['has_ip'] = 1 if any(c.isdigit() for c in url) and url.count('.') >= 3 else 0
        features['has_at'] = 1 if '@' in url else 0
        features['has_https'] = 1 if url.startswith('https') else 0
        features['has_sbi_keyword'] = 1 if 'sbi' in url.lower() else 0
        features['has_yono_keyword'] = 1 if 'yono' in url.lower() else 0
        
        suspicious = ['download', 'apk', 'update', 'kyc', 'verify', 'click', 'login']
        features['has_suspicious'] = 1 if any(word in url.lower() for word in suspicious) else 0
        
        features['num_params'] = url.count('&') + url.count('?')
        features['has_double_slash'] = 1 if '//' in url[8:] else 0
        features['has_redirect'] = 1 if 'redirect' in url.lower() or 'goto' in url.lower() else 0
        
        try:
            domain = url.split('/')[2] if len(url.split('/')) > 2 else ''
            features['domain_length'] = len(domain)
            features['subdomain_count'] = domain.count('.')
        except:
            features['domain_length'] = 0
            features['subdomain_count'] = 0
        
        features['entropy'] = self.calculate_entropy(url)
        
        return list(features.values())
    
    def generate_training_data(self, n_samples=5000):
        """Generate comprehensive training dataset"""
        np.random.seed(42)
        
        X_train = []
        y_train = []
        
        # Legitimate SBI URLs
        legit_urls = [
            'https://sbi.co.in', 'https://www.onlinesbi.com', 'https://retail.onlinesbi.com',
            'https://yonobusiness.sbi', 'https://www.sbi.co.in/web/personal-banking'
        ]
        
        for url in legit_urls:
            for _ in range(200):
                features = self.extract_advanced_features(url)
                X_train.append(features)
                y_train.append(1)
        
        # Fake URLs
        fake_urls = [
            'http://sbi-kyc-update.com/download/yono.apk',
            'http://sbi-secure-verify.com/login',
            'https://yonobusiness-update.net/verify',
            'http://192.168.1.100/yono.apk',
            'https://sbi-verify-account.com'
        ]
        
        for url in fake_urls:
            for _ in range(200):
                features = self.extract_advanced_features(url)
                X_train.append(features)
                y_train.append(0)
        
        # Random URLs
        for _ in range(2000):
            random_len = np.random.randint(20, 80)
            random_chars = ''.join(np.random.choice(list('abcdefghijklmnopqrstuvwxyz0123456789'), random_len))
            random_url = f"https://{random_chars}.com/login"
            features = self.extract_advanced_features(random_url)
            X_train.append(features)
            y_train.append(np.random.choice([0, 1], p=[0.6, 0.4]))
        
        return np.array(X_train), np.array(y_train)
    
    def train(self):
        """Train ensemble model"""
        print("Generating training data...")
        X, y = self.generate_training_data(5000)
        
        print(f"Training with {len(X)} samples, {len(self.feature_names)} features")
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print("Training Random Forest...")
        rf_model = RandomForestClassifier(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
        rf_model.fit(X_train_scaled, y_train)
        
        accuracy = rf_model.score(X_test_scaled, y_test)
        print(f"Model accuracy: {accuracy:.2%}")
        
        os.makedirs('models', exist_ok=True)
        joblib.dump(rf_model, 'models/random_forest.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        
        self.model = rf_model
        
        return {'accuracy': accuracy}
    
    def predict(self, features):
        """Predict using model"""
        if self.model is None:
            self.model = joblib.load('models/random_forest.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
        
        features_scaled = self.scaler.transform([features])
        proba = self.model.predict_proba(features_scaled)[0]
        
        return {
            'is_legitimate': proba[1] > 0.5,
            'confidence': float(max(proba))
        }

if __name__ == "__main__":
    model = AdvancedMLModel()
    model.train()
