import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StockMoveList from '../components/StockMoveList';
import StockMoveForm from '../components/StockMoveForm';

export default function Adjustments() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    api.get('/adjustments', { params }).then(r => {
      setData(r.data.data);
      setTotal(r.data.data.length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <StockMoveList
        title="Stock Adjustments"
        description="Fix discrepancies between recorded and physical stock"
        data={data}
        total={total}
        loading={loading}
        type="adjustment"
        basePath="/adjustments"
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onNew={() => setShowForm(true)}
        statusFilter={statusFilter}
        searchVal={search}
      />
      {showForm && (
        <StockMoveForm
          type="adjustment"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </>
  );
}
