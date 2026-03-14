import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import StockMoveList from '../components/StockMoveList';
import StockMoveForm from '../components/StockMoveForm';

export default function Deliveries() {
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
    api.get('/deliveries', { params }).then(r => {
      setData(r.data.data);
      setTotal(r.data.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      <StockMoveList
        title="Delivery Orders"
        description="Outgoing goods to customers"
        data={data}
        total={total}
        loading={loading}
        type="delivery"
        basePath="/deliveries"
        onSearch={setSearch}
        onStatusFilter={setStatusFilter}
        onNew={() => setShowForm(true)}
        statusFilter={statusFilter}
        searchVal={search}
      />
      {showForm && (
        <StockMoveForm
          type="delivery"
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchData(); }}
        />
      )}
    </>
  );
}
