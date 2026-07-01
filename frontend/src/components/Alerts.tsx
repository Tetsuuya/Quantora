// src/components/Alerts.tsx
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, Bell } from 'lucide-react';
import { api } from '../api/client';

export default function Alerts({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.getAlerts().then(r => setAlerts(r.alerts || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const resolve = async (id: string) => {
    try {
      await api.resolveAlert(id);
      showToast('Alert resolved!', 'success');
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Low-Stock Alerts</h1>
          <p className="page-desc">Products that have dropped below their reorder threshold</p>
        </div>
        <button className="btn btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
      </div>

      {alerts.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <CheckCircle size={30} color="var(--primary)" />
            </div>
            <div className="empty-state-title">All stock levels are healthy!</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>No alerts at this time. Alerts are automatically triggered when inventory drops below your set reorder points.</p>
          </div>
        </div>
      ) : (
        <div className="section-gap">
          <div className="alert alert-warning">
            <AlertTriangle size={16} />
            <span><strong>{alerts.length} product{alerts.length > 1 ? 's' : ''}</strong> require immediate attention. Review and create purchase orders to restock.</span>
          </div>
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Product</th><th>Current Stock</th><th>Reorder Point</th><th>Severity</th><th>Triggered</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {alerts.map((a: any) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <Bell size={15} color={a.current_qty === 0 ? 'var(--danger)' : 'var(--warning)'} />
                          <span style={{ fontWeight: 600 }}>{a.product_title}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, fontSize: 16, color: a.current_qty === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {a.current_qty}
                        </span>
                      </td>
                      <td>{a.reorder_point}</td>
                      <td>
                        {a.current_qty === 0
                          ? <span className="badge badge-danger">🔴 Critical — Out of Stock</span>
                          : <span className="badge badge-warning">⚠️ Low Stock</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(a.triggered_at).toLocaleString()}
                      </td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => resolve(a.id)}>
                          <CheckCircle size={13} /> Resolve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
