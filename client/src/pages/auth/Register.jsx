import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, loading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await register(form);
    if (!result.success) setError(result.message);
    else toast.success('Account created!');
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
        <h1>Create Account</h1>
        <p>Get started with CoreInventory today.</p>
        {error && <div className="alert alert-danger">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="reg-name" className="form-control" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="reg-email" className="form-control" type="email" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="reg-password" className="form-control" type="password" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select id="reg-role" className="form-control" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="staff">Warehouse Staff</option>
              <option value="manager">Inventory Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button id="reg-btn" className="btn btn-primary w-full" type="submit" disabled={loading} style={{ justifyContent: 'center', padding: '11px' }}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : <><UserPlus size={16} /> Create Account</>}
          </button>
        </form>
        <p style={{ marginTop: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13.5 }}>
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
