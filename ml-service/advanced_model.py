import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from sklearn.preprocessing import StandardScaler
import joblib
import json
import os
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
        import math
        prob = [float(url.count(c)) / len(url) for c in set(url)]
        entropy = -sum([p * math.log(p) / math.log(2.0) for p in prob])
        return entropy
    
    def extract_advanced_features(self, url):
        """Extract advanced features from URL"""
        features = {}
        
        # Basic features
        features['url_length'] = len(url)
        features['num_dots'] = url.count('.')
        features['num_hyphens'] = url.count('-')
        features['num_slashes'] = url.count('/')
        features['num_underscores'] = url.count('_')
        
        # Security features
        features['has_ip'] = 1 if any(c.isdigit() for c in url) and url.count('.') >= 3 else 0
        features['has_at'] = 1 if '@' in url else 0
        features['has_https'] = 1 if url.startswith('https') else 0
        features['has_sbi_keyword'] = 1 if 'sbi' in url.lower() else 0
        features['has_yono_keyword'] = 1 if 'yono' in url.lower() else 0
        
        # Suspicious keywords (expanded list)
        suspicious = ['download', 'apk', 'update', 'kyc', 'verify', 'click', 'login', 
                      'secure', 'validate', 'account', 'confirm', 'activate', 'warning',
                      'alert', 'urgent', 'immediate', 'fix', 'patch', 'upgrade']
        features['has_suspicious'] = 1 if any(word in url.lower() for word in suspicious) else 0
        
        # URL structure
        features['num_params'] = url.count('&') + url.count('?')
        features['has_double_slash'] = 1 if '//' in url[8:] else 0
        features['has_redirect'] = 1 if 'redirect' in url.lower() or 'goto' in url.lower() else 0
        
        # Domain analysis
        try:
            domain = url.split('/')[2] if len(url.split('/')) > 2 else ''
            features['domain_length'] = len(domain)
            features['subdomain_count'] = domain.count('.')
        except:
            features['domain_length'] = 0
            features['subdomain_count'] = 0
        
        # Entropy (detect random-looking URLs)
        features['entropy'] = self.calculate_entropy(url)
        
        return list(features.values())
    
    def generate_training_data(self, n_samples=5000):
        """Generate comprehensive training dataset"""
        np.random.seed(42)
        
        # Legitimate URLs (SBI and other trusted sites)
        legitimate_patterns = [
            # SBI domains
            (['https://www.sbi.co.in', 'https://retail.onlinesbi.com', 'https://yonobusiness.sbi'], 1.0),
            # Banking domains
            (['https://www.hdfcbank.com', 'https://www.icicibank.com', 'https://www.axisbank.com'], 0.95),
            # E-commerce
            (['https://www.amazon.in', 'https://www.flipkart.com', 'https://paytm.com'], 0.9),
            # Social media
            (['https://www.facebook.com', 'https://twitter.com', 'https://www.instagram.com'], 0.85),
            # Search engines
            (['https://www.google.com', 'https://www.bing.com', 'https://www.yahoo.com'], 0.9)
        ]
        
        # Fake/Phishing patterns
        fake_patterns = [
            # Fake SBI
            (['sbi-kyc-update.com', 'sbi-secure-verify.com', 'yonobusiness-update.net',
              'sbi-login-verify.in', 'online-sbi-update.xyz'], 0.0),
            # Fake banking
            (['hdfc-secure-login.com', 'icici-update-now.in', 'axis-bank-verify.net'], 0.0),
            # Suspicious TLDs
            (['.xyz', '.top', '.club', '.online', '.site', '.tech', '.info'], 0.05),
            # IP-based
            (['192.168.1.1', '10.0.0.1', '172.16.0.1'], 0.02)
        ]
        
        X_train = []
        y_train = []
        
        # Generate legitimate samples
        for domains, weight in legitimate_patterns:
            for domain in domains:
                for _ in range(int(n_samples * 0.3 / len(legitimate_patterns))):
                    features = self.extract_advanced_features(domain)
                    X_train.append(features)
                    y_train.append(1)
        
        # Generate fake samples
        for patterns, weight in fake_patterns:
            for pattern in patterns:
                for _ in range(int(n_samples * 0.5 / len(fake_patterns))):
                    # Create variations
                    variations = [
                        f"http://{pattern}/download/yono.apk",
                        f"https://{pattern}/login",
                        f"http://{pattern}/verify-account",
                        f"https://{pattern}/update-kyc"
                    ]
                    for var in variations:
                        features = self.extract_advanced_features(var)
                        X_train.append(features)
                        y_train.append(0)
        
        # Generate random URLs
        for _ in range(n_samples - len(X_train)):
            random_chars = ''.join(np.random.choice(list('abcdefghijklmnopqrstuvwxyz0123456789'), 15))
            random_url = f"https://{random_chars}.com/login"
            features = self.extract_advanced_features(random_url)
            X_train.append(features)
            y_train.append(np.random.choice([0, 1], p=[0.6, 0.4]))
        
        return np.array(X_train), np.array(y_train)
    
    def train(self):
        """Train ensemble model"""
        print("🔬 Generating advanced training data...")
        X, y = self.generate_training_data(5000)
        
        print(f"📊 Training with {len(X)} samples, {len(self.feature_names)} features")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train Random Forest
        print("🌲 Training Random Forest...")
        rf_model = RandomForestClassifier(
            n_estimators=300,
            max_depth=20,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )
        rf_model.fit(X_train_scaled, y_train)
        
        # Train Gradient Boosting
        print("📈 Training Gradient Boosting...")
        gb_model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=10,
            learning_rate=0.1,
            random_state=42
        )
        gb_model.fit(X_train_scaled, y_train)
        
        # Ensemble predictions
        rf_pred = rf_model.predict(X_test_scaled)
        gb_pred = gb_model.predict(X_test_scaled)
        
        # Weighted ensemble (70% RF, 30% GB)
        ensemble_pred = (rf_pred * 0.7 + gb_pred * 0.3) > 0.5
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, ensemble_pred)
        precision = precision_score(y_test, ensemble_pred)
        recall = recall_score(y_test, ensemble_pred)
        f1 = f1_score(y_test, ensemble_pred)
        
        print("\n" + "="*50)
        print("📊 MODEL PERFORMANCE")
        print("="*50)
        print(f"✅ Accuracy:  {accuracy:.2%}")
        print(f"✅ Precision: {precision:.2%}")
        print(f"✅ Recall:    {recall:.2%}")
        print(f"✅ F1 Score:  {f1:.2%}")
        
        # Cross-validation
        cv_scores = cross_val_score(rf_model, X_train_scaled, y_train, cv=5)
        print(f"\n📈 Cross-validation scores: {cv_scores.mean():.2%} (+/- {cv_scores.std():.2%})")
        
        # Feature importance
        feature_importance = pd.DataFrame({
            'feature': self.feature_names,
            'importance': rf_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("\n🔍 Top 10 Most Important Features:")
        print(feature_importance.head(10).to_string(index=False))
        
        # Save models
        os.makedirs('models', exist_ok=True)
        joblib.dump(rf_model, 'models/random_forest.pkl')
        joblib.dump(gb_model, 'models/gradient_boosting.pkl')
        joblib.dump(self.scaler, 'models/scaler.pkl')
        joblib.dump(self.feature_names, 'models/feature_names.pkl')
        
        # Save metrics
        metrics = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'training_date': datetime.now().isoformat(),
            'n_samples': len(X),
            'n_features': len(self.feature_names)
        }
        
        with open('models/metrics.json', 'w') as f:
            json.dump(metrics, f, indent=2)
        
        self.model = rf_model
        self.model_type = 'ensemble'
        
        return metrics
    
    def predict(self, features):
        """Predict using ensemble model"""
        if self.model is None:
            self.model = joblib.load('models/random_forest.pkl')
            self.scaler = joblib.load('models/scaler.pkl')
        
        features_scaled = self.scaler.transform([features])
        proba = self.model.predict_proba(features_scaled)[0]
        
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
