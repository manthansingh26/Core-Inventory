import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { UserPlus, ShieldCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: registration form, 2: OTP verification, 3: success
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/register', form);
      
      if (res.data.requiresVerification) {
        setUserId(res.data.userId);
        setStep(2);
        toast.success('OTP sent to your email!');
      } else {
        // Old flow fallback
        localStorage.setItem('token', res.data.token);
        toast.success('Account created!');
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/verify-registration', { userId, otp });
      localStorage.setItem('token', res.data.token);
      setStep(3);
      toast.success('Email verified successfully!');
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/resend-verification', { userId });
      toast.success('OTP resent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">📦</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>CoreInventory</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Inventory Management System</div>
          </div>
        </div>

        {step === 1 && (
          <>
            <h1>Create Account</h1>
            <p>Get started with CoreInventory today.</p>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form className="auth-form" onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  id="reg-name" 
                  className="form-control" 
                  placeholder="John Doe" 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  id="reg-email" 
                  className="form-control" 
                  type="email" 
                  placeholder="you@company.com" 
                  value={form.email} 
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input 
                  id="reg-password" 
                  className="form-control" 
                  type="password" 
                  placeholder="Min. 6 characters" 
                  value={form.password} 
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                  minLength={6} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select 
                  id="reg-role" 
                  className="form-control" 
                  value={form.role} 
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <option value="staff">Warehouse Staff</option>
                  <option value="manager">Inventory Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button 
                id="reg-btn" 
                className="btn btn-primary w-full" 
                type="submit" 
                disabled={loading} 
                style={{ justifyContent: 'center', padding: '11px' }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <><UserPlus size={16} /> Create Account</>
                )}
              </button>
            </form>
            
            <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13.5 }}>
              Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1>Verify Your Email</h1>
            <p>We've sent a 6-digit code to {form.email}</p>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">Enter OTP</label>
                <input 
                  id="reg-otp" 
                  className="form-control" 
                  placeholder="6-digit code" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  maxLength={6} 
                  required 
                  style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }}
                />
              </div>
              <button 
                className="btn btn-primary w-full" 
                type="submit" 
                disabled={loading} 
                style={{ justifyContent: 'center', padding: '11px' }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: 18, height: 18 }} />
                ) : (
                  <><ShieldCheck size={16} /> Verify Email</>
                )}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary w-full" 
                onClick={handleResendOtp}
                disabled={loading}
                style={{ justifyContent: 'center' }}
              >
                Resend OTP
              </button>
            </form>
            
            <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
              Wrong email? <button 
                onClick={() => setStep(1)} 
                className="auth-link" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Go back
              </button>
            </p>
          </>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8 }}>Account Created!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              Your email has been verified. Redirecting to dashboard...
            </p>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}
      </div>
    </div>
  );
}
