// src/components/PurchaseOrders.tsx
import { useEffect, useState } from 'react';
import { Plus, X, Download, Trash2, CheckCircle, Send, Package } from 'lucide-react';
import { api } from '../api/client';

function generatePDF(order: any, supplier: any) {
  import('jspdf').then(({ jsPDF }) => {
    import('jspdf-autotable').then(({ default: autoTable }) => {
      const doc = new jsPDF();
      // Header
      doc.setFillColor(0, 128, 96);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('QUANTORA IMS', 14, 18);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text('Purchase Order', 14, 28);
      doc.text(order.po_number, 196, 18, { align: 'right' });
      doc.text(new Date(order.order_date).toLocaleDateString(), 196, 28, { align: 'right' });
      // Supplier Info
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Supplier:', 14, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(supplier?.name || 'N/A', 14, 63);
      doc.text(supplier?.contact_name || '', 14, 70);
      doc.text(supplier?.email || '', 14, 77);
      doc.text(supplier?.address || '', 14, 84);
      // Expected Date
      if (order.expected_date) {
        doc.setFont('helvetica', 'bold');
        doc.text('Expected Delivery:', 130, 55);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date(order.expected_date).toLocaleDateString(), 130, 63);
      }
      // Items Table
      autoTable(doc, {
        startY: 95,
        head: [['Product', 'SKU', 'Qty', 'Unit Cost', 'Total']],
        body: order.line_items?.map((item: any) => [
          item.product_title, item.sku || '—', item.quantity_ordered,
          `$${item.unit_cost.toFixed(2)}`, `$${item.line_total.toFixed(2)}`,
        ]) || [],
        foot: [['', '', '', 'GRAND TOTAL', `$${order.total_amount?.toFixed(2)}`]],
        headStyles: { fillColor: [0, 128, 96], textColor: 255, fontStyle: 'bold' },
        footStyles: { fillColor: [240, 240, 240], fontStyle: 'bold', fontSize: 11 },
        styles: { fontSize: 10 },
      });
      // Notes
      if (order.notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.text(order.notes, 14, finalY + 7);
      }
      doc.save(`${order.po_number}.pdf`);
    });
  });
}

const statusConfig: Record<string, any> = {
  draft: { label: 'Draft', cls: 'badge-neutral', icon: <Package size={11} /> },
  sent: { label: 'Sent', cls: 'badge-info', icon: <Send size={11} /> },
  received: { label: 'Received', cls: 'badge-success', icon: <CheckCircle size={11} /> },
};

export default function PurchaseOrders({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ supplier_id: '', expected_date: '', notes: '' });
  const [lineItems, setLineItems] = useState<any[]>([{ shopify_product_id: '', product_title: '', sku: '', quantity_ordered: 1, unit_cost: 0 }]);

  const load = () => {
    Promise.all([api.getOrders(), api.getSuppliers(), api.getProducts()])
      .then(([o, s, p]) => { setOrders(o.orders || []); setSuppliers(s.suppliers || []); setProducts(p.products || []); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const addLine = () => setLineItems([...lineItems, { shopify_product_id: '', product_title: '', sku: '', quantity_ordered: 1, unit_cost: 0 }]);
  const removeLine = (i: number) => setLineItems(lineItems.filter((_, idx) => idx !== i));
  const setLine = (i: number, field: string, value: any) => {
    const updated = [...lineItems];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'shopify_product_id') {
      const prod = products.find(p => p.id === value);
      if (prod) updated[i] = { ...updated[i], product_title: prod.title, sku: prod.sku || '', unit_cost: parseFloat(prod.price) };
    }
    setLineItems(updated);
  };

  const saveOrder = async () => {
    if (!form.supplier_id) { showToast('Select a supplier', 'error'); return; }
    if (!lineItems.some(l => l.shopify_product_id)) { showToast('Add at least one product', 'error'); return; }
    try {
      await api.createOrder({ ...form, line_items: lineItems.filter(l => l.shopify_product_id) });
      showToast('Purchase order created!', 'success');
      setModal(false); setForm({ supplier_id: '', expected_date: '', notes: '' });
      setLineItems([{ shopify_product_id: '', product_title: '', sku: '', quantity_ordered: 1, unit_cost: 0 }]);
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await api.updateOrder(id, { status }); showToast(`Order marked as ${status}`, 'success'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Delete this order?')) return;
    try { await api.deleteOrder(id); showToast('Order deleted', 'warning'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  const totalQty = lineItems.reduce((s, l) => s + (l.quantity_ordered || 0), 0);
  const totalCost = lineItems.reduce((s, l) => s + (l.quantity_ordered || 0) * (l.unit_cost || 0), 0);

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-desc">Create, track, and download POs for your suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Purchase Order</button>
      </div>

      {orders.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-title">No purchase orders yet</div><button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={14} /> Create first PO</button></div></div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>PO Number</th><th>Supplier</th><th>Date</th><th>Expected</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => {
                  const sc = statusConfig[o.status] || statusConfig.draft;
                  return (
                    <tr key={o.id}>
                      <td><strong style={{ fontFamily: 'monospace' }}>{o.po_number}</strong></td>
                      <td>{o.supplier?.name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(o.order_date || o.created_at).toLocaleDateString()}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.expected_date ? new Date(o.expected_date).toLocaleDateString() : '—'}</td>
                      <td>{o.line_items?.length || 0} items</td>
                      <td><strong>${o.total_amount?.toFixed(2)}</strong></td>
                      <td><span className={`badge ${sc.cls}`}>{sc.icon} {sc.label}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => generatePDF(o, o.supplier)}><Download size={13} /></button>
                          {o.status === 'draft' && <button className="btn btn-primary btn-sm" onClick={() => updateStatus(o.id, 'sent')}>Send</button>}
                          {o.status === 'sent' && <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(o.id, 'received')}>Receive</button>}
                          <button className="btn btn-ghost btn-sm btn-icon" style={{ color: 'var(--danger)' }} onClick={() => deleteOrder(o.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New Purchase Order</span>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Supplier *</label>
                  <select className="form-select" value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})}>
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Expected Delivery</label>
                  <input className="form-input" type="date" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})} />
                </div>
              </div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', marginBottom: 'var(--sp-4)' }}>
                <div style={{ background: 'var(--bg)', padding: '8px 14px', fontWeight: 700, fontSize: 13, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Order Items</span>
                  <button className="btn btn-primary btn-sm" onClick={addLine}><Plus size={12} /> Add Item</button>
                </div>
                {lineItems.map((item, i) => (
                  <div key={i} style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 'var(--sp-2)', alignItems: 'center' }}>
                    <select className="form-select" value={item.shopify_product_id} onChange={e => setLine(i, 'shopify_product_id', e.target.value)}>
                      <option value="">Select product...</option>
                      {products.filter(p => p.status === 'ACTIVE').map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                    <input className="form-input" type="number" min={1} placeholder="Qty" value={item.quantity_ordered} onChange={e => setLine(i, 'quantity_ordered', parseInt(e.target.value) || 1)} />
                    <input className="form-input" type="number" min={0} step="0.01" placeholder="Unit cost" value={item.unit_cost} onChange={e => setLine(i, 'unit_cost', parseFloat(e.target.value) || 0)} />
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => removeLine(i)} disabled={lineItems.length === 1}><X size={14} /></button>
                  </div>
                ))}
                <div style={{ padding: '10px 14px', background: 'var(--bg)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-5)', fontWeight: 700, fontSize: 13 }}>
                  <span>Total Qty: {totalQty}</span>
                  <span>Total: ${totalCost.toFixed(2)}</span>
                </div>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Any additional notes for this order..." /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveOrder}><Plus size={14} /> Create PO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
