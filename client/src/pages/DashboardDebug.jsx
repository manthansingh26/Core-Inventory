import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DashboardDebug() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🔍 Dashboard: Starting data fetch...');
    
    api.get('/dashboard')
      .then(res => {
        console.log('✅ Dashboard: API response received:', res.data);
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('❌ Dashboard: API error:', err);
        console.error('Error details:', err.response?.data || err.message);
        setError(err.response?.data?.message || err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>🔄 Loading Dashboard...</h2>
        <p>Fetching data from API...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>❌ Dashboard Error</h2>
        <p><strong>Error:</strong> {error}</p>
        <p>Check the browser console for more details.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>❌ No Data</h2>
        <p>No data received from API.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>✅ Dashboard Debug - Data Loaded Successfully!</h2>
      
      <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h3>📊 API Response Structure:</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h3>🎯 KPIs Summary:</h3>
        {data.data?.kpis ? (
          <ul>
            <li>Total Products: {data.data.kpis.totalProducts}</li>
            <li>Low Stock Items: {data.data.kpis.lowStockCount}</li>
            <li>Out of Stock Items: {data.data.kpis.outOfStockCount}</li>
            <li>Pending Receipts: {data.data.kpis.pendingReceipts}</li>
            <li>Pending Deliveries: {data.data.kpis.pendingDeliveries}</li>
            <li>Pending Transfers: {data.data.kpis.pendingTransfers}</li>
            <li>Late Receipts: {data.data.kpis.lateReceipts}</li>
            <li>Late Deliveries: {data.data.kpis.lateDeliveries}</li>
            <li>Done Today: {data.data.kpis.doneToday}</li>
          </ul>
        ) : (
          <p>❌ KPIs not found in response</p>
        )}
      </div>

      <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', margin: '20px 0' }}>
        <h3>📈 Recent Moves:</h3>
        {data.data?.recentMoves ? (
          <ul>
            {data.data.recentMoves.map((move, index) => (
              <li key={index}>
                {move.id?.date} - {move.id?.type}: {move.count} operations
              </li>
            ))}
          </ul>
        ) : (
          <p>❌ Recent moves not found in response</p>
        )}
      </div>

      <button 
        onClick={() => {
          console.log('🔄 Manually retrying dashboard fetch...');
          window.location.reload();
        }}
        style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
      >
        🔄 Reload Dashboard
      </button>
    </div>
  );
}
