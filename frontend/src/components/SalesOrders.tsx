// src/components/SalesOrders.tsx
import { useEffect, useState } from 'react';
import { ShoppingBag, RefreshCw, Search, User, Mail, Calendar, Tag } from 'lucide-react';
import { api } from '../api/client';

export default function SalesOrders({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = () => {
    setLoading(true);
    api.getSalesOrders()
      .then(r => {
        setOrders(r.orders || []);
      })
      .catch(e => {
        showToast(e.message, 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Filter orders by Name (#1001), Customer Name, Customer Email, or Item Title
  const filtered = orders.filter(o => {
    const term = search.toLowerCase();
    const matchesName = o.name?.toLowerCase().includes(term);
    
    const custName = o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase() : '';
    const custEmail = o.customer?.email?.toLowerCase() || '';
    const matchesCustomer = custName.includes(term) || custEmail.includes(term);
    
    const matchesItems = o.lineItems?.some((item: any) => 
      item.title?.toLowerCase().includes(term)
    );

    return matchesName || matchesCustomer || matchesItems;
  });

  const getFinancialBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'PAID') return <span className="badge badge-success">Paid</span>;
    if (s === 'PENDING') return <span className="badge badge-warning">Pending</span>;
    if (s === 'AUTHORIZED') return <span className="badge badge-info" style={{ background: '#e0f2fe', color: '#0369a1' }}>Authorized</span>;
    return <span className="badge badge-secondary">{status}</span>;
  };

  const getFulfillmentBadge = (status: string) => {
    const s = status?.toUpperCase();
    if (s === 'FULFILLED') return <span className="badge badge-success">Fulfilled</span>;
    if (s === 'UNFULFILLED') return <span className="badge badge-warning">Unfulfilled</span>;
    if (s === 'PARTIALLY_FULFILLED') return <span className="badge badge-info" style={{ background: '#fef3c7', color: '#b45309' }}>Partial</span>;
    if (s === 'RESTOCKED') return <span className="badge badge-secondary">Restocked</span>;
    return <span className="badge badge-secondary">{status}</span>;
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-desc">Customer storefront orders fetched in real-time from Shopify</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Search Input */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search by order number (#1001), customer name, email, or item..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
              <ShoppingBag size={30} color="var(--primary)" />
            </div>
            <div className="empty-state-title">No orders found</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320 }}>
              There are no sales orders in your Shopify developer store yet. Complete a test transaction on the storefront to see it here!
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => {
                  const dateStr = new Date(o.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={o.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <Tag size={14} color="var(--primary)" />
                          <span style={{ fontWeight: 700, color: '#fff' }}>{o.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={13} style={{ opacity: 0.6 }} />
                          {dateStr}
                        </div>
                      </td>
                      <td>
                        {o.customer && (o.customer.firstName || o.customer.lastName) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
                              <User size={12} style={{ opacity: 0.7 }} />
                              {o.customer.firstName} {o.customer.lastName}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                              <Mail size={11} style={{ opacity: 0.6 }} />
                              {o.customer.email}
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)' }}>
                              <User size={12} style={{ opacity: 0.7 }} />
                              Storefront Customer
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }} title="Shopify Developer stores restrict access to Customer PII.">
                              <Mail size={11} style={{ opacity: 0.6 }} />
                              PII Restricted (Dev Store)
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
                          {o.lineItems?.map((item: any, idx: number) => (
                            <span key={idx} style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)' }}>
                              {item.title} <strong style={{ color: 'var(--primary)', marginLeft: 4 }}>×{item.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{getFinancialBadge(o.displayFinancialStatus)}</td>
                      <td>{getFulfillmentBadge(o.displayFulfillmentStatus)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                        {parseFloat(o.totalPriceSet?.shopMoney?.amount || '0').toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}{' '}
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500 }}>
                          {o.totalPriceSet?.shopMoney?.currencyCode || 'CAD'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--sp-8)', color: 'var(--text-muted)' }}>
                      No orders match your search term.
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
