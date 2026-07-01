// src/components/Inventory.tsx
import { useEffect, useState, useRef } from 'react';
import { Search, ScanLine, RefreshCw, Edit2, X, Check } from 'lucide-react';
import { api } from '../api/client';

interface InventoryProps { showToast: (msg: string, type?: any) => void; onScanClick: () => void; }

export default function Inventory({ showToast, onScanClick }: InventoryProps) {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingQty, setEditingQty] = useState<{ prodId: string; locId: string; val: number } | null>(null);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const load = () => {
    setLoading(true);
    Promise.all([api.getProducts(), api.getSuppliers()])
      .then(([p, s]) => { setProducts(p.products || []); setSuppliers(s.suppliers || []); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'low') return matchSearch && (p.is_low_stock || p.is_out_of_stock);
    if (filter === 'out') return matchSearch && p.is_out_of_stock;
    return matchSearch;
  });

  const getSupplierName = (id: string) => suppliers.find(s => s.id === id)?.name || '—';

  const saveQty = async () => {
    if (!editingQty) return;
    try {
      await api.adjustInventory({
        product_id: editingQty.prodId,
        location_id: editingQty.locId,
        quantity: editingQty.val,
        inventory_item_id: editingQty.locId,
      });
      showToast('Stock level updated!', 'success');
      setEditingQty(null);
      load();
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const statusBadge = (p: any) => {
    if (p.is_out_of_stock) return <span className="badge badge-danger">Out of Stock</span>;
    if (p.is_low_stock) return <span className="badge badge-warning">Low Stock</span>;
    if (p.status === 'DRAFT') return <span className="badge badge-neutral">Draft</span>;
    return <span className="badge badge-success">Active</span>;
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Manager</h1>
          <p className="page-desc">Live product stock levels across all warehouse locations</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={onScanClick}><ScanLine size={15} /> Scan Barcode</button>
          <button className="btn btn-secondary" onClick={load}><RefreshCw size={15} /> Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search products, SKU, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {(['all', 'low', 'out'] as const).map(f => (
          <button key={f} className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All Products' : f === 'low' ? '⚠️ Low Stock' : '🔴 Out of Stock'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Products ({filtered.length})</div>
            <div className="card-subtitle">Click qty to edit inline • Changes sync to Shopify</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Supplier</th>
                <th>Locations & Stock</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No products found</div></div></td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      {p.image_url
                        ? <img className="product-img" src={p.image_url} alt={p.title} />
                        : <div className="product-img-placeholder">📦</div>}
                      <div>
                        <div className="product-name">{p.title}</div>
                        <div className="product-vendor">{p.vendor}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{p.sku || '—'}</td>
                  <td>{statusBadge(p)}</td>
                  <td style={{ fontSize: 12 }}>{getSupplierName(p.supplier_id)}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.inventory?.map((inv: any) => (
                        <div key={inv.location_id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <span className="warehouse-tag">{inv.location_name}</span>
                          {editingQty?.prodId === p.id && editingQty.locId === inv.location_id ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input type="number" className="form-input" style={{ width: 70, padding: '4px 8px' }} min={0}
                                value={editingQty.val} onChange={e => setEditingQty({ ...editingQty, val: parseInt(e.target.value) || 0 })} />
                              <button className="btn btn-primary btn-sm btn-icon" onClick={saveQty}><Check size={12} /></button>
                              <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditingQty(null)}><X size={12} /></button>
                            </div>
                          ) : (
                            <span className={`stock-number ${inv.available === 0 ? 'text-danger' : ''}`}
                              style={{ cursor: 'pointer', color: inv.available === 0 ? 'var(--danger)' : inv.available <= 5 ? 'var(--warning)' : 'var(--text-primary)' }}
                              onClick={() => setEditingQty({ prodId: p.id, locId: inv.location_id, val: inv.available })}>
                              {inv.available}
                              <Edit2 size={10} style={{ marginLeft: 4, opacity: 0.4 }} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td><strong style={{ fontSize: 15 }}>{p.total_stock}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
