import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminVendors, createAdminVendor, updateAdminVendor, deleteAdminVendor } from '../../api/mlmApi'

const BLANK = { name: '', contact: '', country: '', paymentTerms: 'Net 30', leadDays: 14, status: 'active' }

function VendorModal({ vendor, onSave, onClose }) {
  const [form, setForm] = useState(vendor || BLANK)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{vendor ? 'Edit Vendor' : 'Add Vendor'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Vendor Name *</label><input required value={form.name} onChange={set('name')} style={inp} placeholder="Company name" /></div>
          <div><label style={lbl}>Contact Email *</label><input required type="email" value={form.contact} onChange={set('contact')} style={inp} placeholder="orders@example.com" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Country</label><input value={form.country} onChange={set('country')} style={inp} placeholder="Norway" /></div>
            <div><label style={lbl}>Lead Time (days)</label><input type="number" min="1" value={form.leadDays} onChange={set('leadDays')} style={inp} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Payment Terms</label>
              <select value={form.paymentTerms} onChange={set('paymentTerms')} style={inp}>
                {['Net 30', 'Net 45', 'Net 60', 'Prepaid', 'COD'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} style={inp}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : vendor ? 'Save Changes' : 'Add Vendor'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminVendors() {
  const [vendors, setVendors] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminVendors().then(setVendors).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (modal?.id) {
      const updated = await updateAdminVendor(modal.id, form)
      setVendors(v => v.map(x => x.id === modal.id ? { ...x, ...updated } : x))
    } else {
      const created = await createAdminVendor(form)
      setVendors(v => [created, ...v])
    }
  }

  async function handleDelete(v) {
    if (!window.confirm(`Delete vendor "${v.name}"? This cannot be undone.`)) return
    await deleteAdminVendor(v.id)
    setVendors(prev => prev.filter(x => x.id !== v.id))
  }

  const filtered = !vendors ? [] : filter === 'all' ? vendors : vendors.filter(v => v.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏭 Vendor Management</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage product suppliers and procurement contacts.</div>
          </div>
          <button onClick={() => setModal({})} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Add Vendor
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Vendors', value: (vendors || []).length },
            { label: 'Active', value: (vendors || []).filter(v => v.status === 'active').length },
            { label: 'Total Products', value: (vendors || []).reduce((s, v) => s + v.products, 0) },
            { label: 'Countries', value: new Set((vendors || []).map(v => v.country)).size },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'active', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No vendors found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Vendor', 'Contact', 'Country', 'Payment Terms', 'Lead Days', 'Products', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px', fontWeight: 600 }}>{v.name}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{v.contact}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{v.country}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{v.paymentTerms}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>{v.leadDays}d</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>{v.products}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: v.status === 'active' ? '#052e16' : '#1c1c1c', color: v.status === 'active' ? '#86efac' : '#9ca3af', border: `1px solid ${v.status === 'active' ? '#166534' : '#374151'}` }}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setModal(v)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                      <button onClick={() => handleDelete(v)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: '#f87171', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <VendorModal vendor={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
