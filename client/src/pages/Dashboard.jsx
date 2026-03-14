import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Package, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight,
  AlertTriangle, XCircle, TrendingUp, Clock, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const CHART_COLORS = {
  receipt: '#6366f1',
  delivery: '#22c55e',
  transfer: '#f59e0b',
  adjustment: '#3b82f6'
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><p>Failed to load dashboard.</p></div>;

  const { kpis, recentMoves } = data;

  // Build chart data for last 7 days
  const chartMap = {};
  recentMoves.forEach(m => {
    const d = m.id.date;
    if (!chartMap[d]) chartMap[d] = { date: d, receipt: 0, delivery: 0, transfer: 0, adjustment: 0 };
    chartMap[d][m.id.type] = m.count;
  });
  const chartData = Object.values(chartMap).sort((a, b) => a.date.localeCompare(b.date));

  const kpiCards = [
    { label: 'Total Products', value: kpis.totalProducts, icon: <Package size={20} />, color: 'var(--accent)', colorDim: 'var(--accent-dim)', to: '/products' },
    { label: 'Low Stock Items', value: kpis.lowStockCount, icon: <AlertTriangle size={20} />, color: 'var(--warning)', colorDim: 'var(--warning-dim)', to: '/products?lowStock=true' },
    { label: 'Out of Stock', value: kpis.outOfStockCount, icon: <XCircle size={20} />, color: 'var(--danger)', colorDim: 'var(--danger-dim)', to: '/products' },
    { label: 'Pending Receipts', value: kpis.pendingReceipts, icon: <ArrowDownToLine size={20} />, color: '#6366f1', colorDim: 'rgba(99,102,241,0.12)', to: '/receipts' },
    { label: 'Pending Deliveries', value: kpis.pendingDeliveries, icon: <ArrowUpFromLine size={20} />, color: 'var(--success)', colorDim: 'var(--success-dim)', to: '/deliveries' },
    { label: 'Scheduled Transfers', value: kpis.pendingTransfers, icon: <ArrowLeftRight size={20} />, color: 'var(--warning)', colorDim: 'var(--warning-dim)', to: '/transfers' },
    { label: 'Late Receipts', value: kpis.lateReceipts, icon: <Clock size={20} />, color: 'var(--danger)', colorDim: 'var(--danger-dim)', to: '/receipts' },
    { label: 'Done Today', value: kpis.doneToday, icon: <CheckCircle2 size={20} />, color: 'var(--success)', colorDim: 'var(--success-dim)', to: '/history' },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5 }}>
        <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block' }} />
            {p.name}: {p.value}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h2>Inventory Dashboard</h2>
          <p>Real-time overview of your stock operations</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/receipts')}>
            <ArrowDownToLine size={15} /> New Receipt
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/deliveries')}>
            <ArrowUpFromLine size={15} /> New Delivery
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((k) => (
          <div
            key={k.label}
            className="kpi-card"
            style={{ '--kpi-color': k.color, '--kpi-color-dim': k.colorDim }}
            onClick={() => navigate(k.to)}
          >
            <div className="kpi-icon">
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Activity (Last 7 Days)</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Operations completed by type</div>
            </div>
            <TrendingUp size={18} style={{ color: 'var(--accent-light)' }} />
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={14} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="receipt" fill={CHART_COLORS.receipt} radius={[4, 4, 0, 0]} name="Receipts" />
                <Bar dataKey="delivery" fill={CHART_COLORS.delivery} radius={[4, 4, 0, 0]} name="Deliveries" />
                <Bar dataKey="transfer" fill={CHART_COLORS.transfer} radius={[4, 4, 0, 0]} name="Transfers" />
                <Bar dataKey="adjustment" fill={CHART_COLORS.adjustment} radius={[4, 4, 0, 0]} name="Adjustments" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ paddingTop: 40 }}>
              <TrendingUp size={40} />
              <p>No activity in the last 7 days</p>
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="card">
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20 }}>Operations Summary</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Receipts Pending', val: kpis.pendingReceipts, late: kpis.lateReceipts, color: 'var(--accent)', to: '/receipts' },
              { label: 'Deliveries Pending', val: kpis.pendingDeliveries, late: kpis.lateDeliveries, color: 'var(--success)', to: '/deliveries' },
              { label: 'Transfers Pending', val: kpis.pendingTransfers, late: 0, color: 'var(--warning)', to: '/transfers' },
            ].map(s => (
              <div key={s.label}
                onClick={() => navigate(s.to)}
                style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', border: '1px solid var(--border)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.label}</span>
                  <span style={{ fontWeight: 800, fontSize: 20, color: s.color }}>{s.val}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (s.val / 20) * 100)}%`, height: '100%', background: s.color, borderRadius: 4 }} />
                </div>
                {s.late > 0 && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 6 }}>⚠ {s.late} late</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(CHART_COLORS).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: v, display: 'inline-block' }} />
            {k.charAt(0).toUpperCase() + k.slice(1)}s
          </div>
        ))}
      </div>
    </div>
  );
}
