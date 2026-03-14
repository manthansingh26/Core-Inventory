import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StockMoveList from '../components/StockMoveList';
import StockMoveForm from '../components/StockMoveForm';

export default function Receipts() {
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
    api.get('/receipts', { params }).then(r => {
      setData(r.data.data);
      setTotal(r.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <StockMoveList
        title="Receipts"
        description="Incoming goods from suppliers"
        data={data}
        total={total}
        loading={loading}
        type="receipt"
        basePath="/receipts"
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onNew={() => setShowForm(true)}
        statusFilter={statusFilter}
        searchVal={search}
      />
      {showForm && (
        <StockMoveForm
          type="receipt"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </>
  );
}
