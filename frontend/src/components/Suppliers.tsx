// src/components/Suppliers.tsx
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Building2 } from 'lucide-react';
import { api } from '../api/client';

const empty = { name: '', contact_name: '', email: '', phone: '', address: '', payment_terms: 'Net 30', lead_time_days: 7 };

export default function Suppliers({ showToast }: { showToast: (msg: string, type?: any) => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    api.getSuppliers().then(r => setSuppliers(r.suppliers || [])).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openAdd = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s: any) => { setEditing(s); setForm({ ...s }); setModal(true); };
  const close = () => setModal(false);

  const save = async () => {
    try {
      if (editing) { await api.updateSupplier(editing.id, form); showToast('Supplier updated!'); }
      else { await api.createSupplier(form); showToast('Supplier added!'); }
      close(); load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this supplier?')) return;
    try { await api.deleteSupplier(id); showToast('Supplier deleted', 'warning'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="loading-overlay"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Supplier Directory</h1>
          <p className="page-desc">Manage your product suppliers and their contact details</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Supplier</button>
      </div>

      {suppliers.length === 0 ? (
        <div className="card"><div className="empty-state"><div className="empty-state-icon">🏭</div><div className="empty-state-title">No suppliers yet</div><button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add your first supplier</button></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px,1fr))', gap: 'var(--sp-4)' }}>
          {suppliers.map(s => (
            <div key={s.id} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={18} color="var(--primary)" />
                  </div>
                  <div>
                    <div className="card-title">{s.name}</div>
                    <div className="card-subtitle">{s.contact_name}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--sp-1)' }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--danger)' }} onClick={() => remove(s.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                {[
                  ['📧', s.email],
                  ['📞', s.phone || '—'],
                  ['📍', s.address || '—'],
                  ['💳', s.payment_terms],
                  ['⏱️', `${s.lead_time_days} day lead time`],
                ].map(([icon, val], i) => (
                  <div key={i} style={{ display: 'flex', gap: 'var(--sp-2)', fontSize: 12.5, alignItems: 'flex-start' }}>
                    <span>{icon}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={close}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Supplier' : 'Add New Supplier'}</span>
              <button className="btn btn-ghost btn-icon" onClick={close}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Company Name *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Contact Person</label><input className="form-input" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Email *</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Payment Terms</label>
                  <select className="form-select" value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}>
                    {['Net 15','Net 30','Net 60','COD','Prepaid'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Lead Time (days)</label><input className="form-input" type="number" min={1} value={form.lead_time_days} onChange={e => setForm({...form, lead_time_days: parseInt(e.target.value)})} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>{editing ? 'Save Changes' : 'Add Supplier'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
