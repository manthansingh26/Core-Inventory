import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { User, Save, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      const updated = res.data.user;
      setUser(updated);
      localStorage.setItem('ci_user', JSON.stringify(updated));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Update failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left"><h2>My Profile</h2><p>Manage your account settings</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, maxWidth: 800 }}>
        {/* Avatar card */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 auto 16px' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>{user?.email}</div>
          <div style={{ marginTop: 10 }}>
            <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)' }}>
              <Shield size={11} /> {user?.role}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Edit Information</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input id="profile-name" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-control" value={user?.email} disabled style={{ opacity: 0.5 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-control" value={user?.role} disabled style={{ opacity: 0.5, textTransform: 'capitalize' }} />
            </div>
            <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={15} /> Save Changes</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
