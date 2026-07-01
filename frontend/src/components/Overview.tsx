// src/components/Overview.tsx
import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, Warehouse, ShoppingCart, CheckCircle } from 'lucide-react';
import { api } from '../api/client';

export default function Overview() {
  const [products, setProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProducts(), api.getAlerts(), api.getOrders()])
      .then(([p, a, o]) => {
        setProducts(p.products || []);
        setAlerts(a.alerts || []);
        setOrders(o.orders || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const totalStock = products.reduce((s: number, p: any) => s + p.total_stock, 0);
  const outOfStock = products.filter((p: any) => p.is_out_of_stock).length;
  const lowStock = products.filter((p: any) => p.is_low_stock).length;
  const totalValue = products.reduce((s: number, p: any) => s + parseFloat(p.price || 0) * p.total_stock, 0);
  const pendingOrders = orders.filter((o: any) => o.status === 'draft' || o.status === 'sent').length;
  const locations = [...new Set(products.flatMap((p: any) => p.inventory?.map((i: any) => i.location_name) || []))];

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-desc">Real-time inventory data from your Shopify store</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-color': 'var(--primary)', '--kpi-bg': 'var(--primary-light)' } as any}>
          <div className="kpi-icon"><Package size={18} /></div>
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{totalProducts}</div>
          <div className="kpi-footer">{locations.length} warehouse location{locations.length !== 1 ? 's' : ''}</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#2c6ecb', '--kpi-bg': '#e8f0fd' } as any}>
          <div className="kpi-icon"><TrendingUp size={18} /></div>
          <div className="kpi-label">Total Units</div>
          <div className="kpi-value">{totalStock.toLocaleString()}</div>
          <div className="kpi-footer">across all locations</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#c05717', '--kpi-bg': '#fff5ea' } as any}>
          <div className="kpi-icon"><AlertTriangle size={18} /></div>
          <div className="kpi-label">Low Stock</div>
          <div className="kpi-value">{lowStock + outOfStock}</div>
          <div className="kpi-footer">{outOfStock} out of stock</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--primary)', '--kpi-bg': 'var(--primary-light)' } as any}>
          <div className="kpi-icon"><TrendingUp size={18} /></div>
          <div className="kpi-label">Inventory Value</div>
          <div className="kpi-value">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div className="kpi-footer">estimated retail value</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': '#5c6bc0', '--kpi-bg': '#eeeffd' } as any}>
          <div className="kpi-icon"><ShoppingCart size={18} /></div>
          <div className="kpi-label">Open POs</div>
          <div className="kpi-value">{pendingOrders}</div>
          <div className="kpi-footer">{orders.length} total orders</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-color': 'var(--danger)', '--kpi-bg': 'var(--danger-light)' } as any}>
          <div className="kpi-icon"><AlertTriangle size={18} /></div>
          <div className="kpi-label">Open Alerts</div>
          <div className="kpi-value">{alerts.length}</div>
          <div className="kpi-footer">require attention</div>
        </div>
      </div>

      {/* Warehouse Locations */}
      <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Warehouse Locations</div>
            <div className="card-subtitle">Active inventory storage sites from Shopify</div>
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-3)' }}>
          {locations.map(loc => (
            <div key={loc} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', minWidth: 180 }}>
              <Warehouse size={16} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: 13 }}>{loc}</span>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>Active</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">⚠️ Active Low-Stock Alerts</div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Current Qty</th>
                  <th>Reorder Point</th>
                  <th>Severity</th>
                  <th>Triggered</th>
                </tr>
              </thead>
              <tbody>
                {alerts.slice(0, 5).map((a: any) => (
                  <tr key={a.id}>
                    <td><strong>{a.product_title}</strong></td>
                    <td><span className="stock-number" style={{ color: a.current_qty === 0 ? 'var(--danger)' : 'var(--warning)' }}>{a.current_qty}</span></td>
                    <td>{a.reorder_point}</td>
                    <td>
                      {a.current_qty === 0
                        ? <span className="badge badge-danger">Critical</span>
                        : <span className="badge badge-warning">Low</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{new Date(a.triggered_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {alerts.length === 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-5)', color: 'var(--primary)' }}>
            <CheckCircle size={20} />
            <span style={{ fontWeight: 600 }}>All stock levels are healthy — no alerts at this time.</span>
          </div>
        </div>
      )}
    </div>
  );
}
