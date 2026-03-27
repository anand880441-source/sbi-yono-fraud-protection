import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { forgotPassword } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);
        
        const result = await forgotPassword(email);
        
        if (result.success) {
            setMessage('Password reset link has been sent to your email. Check console for demo link.');
            if (result.resetLink) {
                setMessage(prev => `${prev}\n\nDemo Link: ${result.resetLink}`);
            }
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">🔑</div>
                    <h1>Forgot Password</h1>
                    <p>Enter your email to reset your password</p>
                </div>
                
                {message && <div className="auth-success">{message}</div>}
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Enter your registered email"
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} className="auth-btn">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>
                
                <div className="auth-footer">
                    <Link to="/login">Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
