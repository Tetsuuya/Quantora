// src/components/ActivityLog.tsx
import { useEffect, useState } from 'react';
import { History, RefreshCw, Search, ArrowRight, Activity, Calendar, MapPin } from 'lucide-react';
import { api } from '../api/client';

export default function ActivityLog({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.getTransactions()
      .then(r => {
        setTransactions(r.transactions || []);
      })
      .catch(e => {
        showToast(e.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Filter transactions by product title, SKU, or reason
  const filtered = transactions.filter(t => {
    const term = search.toLowerCase();
    return (
      t.product_title?.toLowerCase().includes(term) ||
      t.sku?.toLowerCase().includes(term) ||
      t.reason?.toLowerCase().includes(term) ||
      t.location_name?.toLowerCase().includes(term)
    );
  });

  const formatAdjustment = (change: number) => {
    if (change > 0) {
      return (
        <span className="badge badge-success" style={{ fontWeight: 700, fontSize: 13, padding: '4px 8px' }}>
          +{change}
        </span>
      );
    }
    return (
      <span className="badge badge-danger" style={{ fontWeight: 700, fontSize: 13, padding: '4px 8px' }}>
        {change}
      </span>
    );
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Activity Log</h1>
          <p className="page-desc">Complete audit trail of all manual and automated stock changes</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Search Filter */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by product title, SKU, warehouse location, or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <History size={30} color="var(--primary)" />
            </div>
            <div className="empty-state-title">No transactions logged yet</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>
              Audit logs are automatically captured when you adjust stock levels or receive purchase orders.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product</th>
                  <th>Location</th>
                  <th>Adjustment</th>
                  <th>Stock Change</th>
                  <th>Reason / Event</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const dateStr = new Date(t.timestamp).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={t.id}>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ opacity: 0.6 }} />
                          {dateStr}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{t.product_title}</span>
                          {t.sku && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              SKU: {t.sku}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={13} style={{ opacity: 0.6, color: 'var(--primary)' }} />
                          {t.location_name}
                        </div>
                      </td>
                      <td>{formatAdjustment(t.qty_change)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                          <span style={{ color: 'var(--text-muted)' }}>{t.qty_before}</span>
                          <ArrowRight size={12} style={{ opacity: 0.5 }} />
                          <strong style={{ color: '#fff' }}>{t.qty_after}</strong>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 500 }}>
                          <Activity size={13} style={{ opacity: 0.7, color: t.qty_change > 0 ? 'var(--primary)' : 'var(--warning)' }} />
                          {t.reason}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                      No activity logs match your search term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
