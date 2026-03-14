import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, ShieldCheck, KeyRound, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password, 4: done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.otp) setDevOtp(res.data.otp); // dev mode
      setStep(2);
      toast.success('OTP sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/verify-otp', { email, otp });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStep(4);
      toast.success('Password reset!');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">📦</div>
          <div><div style={{ fontWeight: 800, fontSize: 18 }}>CoreInventory</div></div>
        </div>

        {step < 4 && (
          <>
            <h1>Reset Password</h1>
            <p>Follow the steps to reset your account password.</p>
            <div className="stepper" style={{ marginBottom: 24 }}>
              <div className={`step ${step >= 1 ? (step > 1 ? 'done' : 'active') : ''}`}><div className="step-circle">1</div><span className="step-label">Email</span></div>
              <div className="step-line" style={{ background: step > 1 ? 'var(--success)' : 'var(--border)' }} />
              <div className={`step ${step >= 2 ? (step > 2 ? 'done' : 'active') : ''}`}><div className="step-circle">2</div><span className="step-label">OTP</span></div>
              <div className="step-line" style={{ background: step > 2 ? 'var(--success)' : 'var(--border)' }} />
              <div className={`step ${step >= 3 ? 'active' : ''}`}><div className="step-circle">3</div><span className="step-label">Password</span></div>
            </div>
          </>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        {step === 1 && (
          <form className="auth-form" onSubmit={sendOtp}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input id="fp-email" className="form-control" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: 11 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><Mail size={16} /> Send OTP</>}
            </button>
          </form>
        )}

        {step === 2 && (
          <form className="auth-form" onSubmit={verifyOtp}>
            {devOtp && <div className="alert alert-warning">🔧 Dev mode OTP: <strong>{devOtp}</strong></div>}
            <div className="form-group">
              <label className="form-label">Enter OTP</label>
              <input id="fp-otp" className="form-control" placeholder="6-digit code" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required style={{ letterSpacing: '0.3em', fontSize: 20, textAlign: 'center' }} />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: 11 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><ShieldCheck size={16} /> Verify OTP</>}
            </button>
            <button type="button" className="btn btn-secondary w-full" onClick={sendOtp} style={{ justifyContent: 'center' }}>Resend OTP</button>
          </form>
        )}

        {step === 3 && (
          <form className="auth-form" onSubmit={resetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input id="fp-newpass" className="form-control" type="password" placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: 11 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><KeyRound size={16} /> Reset Password</>}
            </button>
          </form>
        )}

        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
            <h2 style={{ marginBottom: 8 }}>Password Reset!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Your password has been updated successfully.</p>
            <Link to="/login" className="btn btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>Back to Login</Link>
          </div>
        )}

        {step < 4 && (
          <p style={{ marginTop: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
            Remember it? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
