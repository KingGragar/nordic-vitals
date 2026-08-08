import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminPartners, createAdminPartner, updateAdminPartner } from '../../api/mlmApi'

const TYPE_LABELS = { wholesale: 'Wholesale', reseller: 'Reseller', brand_ambassador: 'Brand Ambassador' }
const STATUS_COLORS = {
  active:   { bg: '#052e16', color: '#86efac', border: '#166534' },
  pending:  { bg: '#3b2a0f', color: '#fcd34d', border: '#d97706' },
  inactive: { bg: '#1a1a1a', color: '#9ca3af', border: '#374151' },
}

function PartnerModal({ partner, onSave, onClose }) {
  const [form, setForm] = useState(partner || { name: '', type: 'wholesale', contact: '', country: 'NO', discountPct: 15, status: 'pending' })
  const [saving, setSaving] = useState(false)
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{partner ? 'Edit Partner' : 'New Partner'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Company Name</label>
              <input value={form.name} onChange={set('name')} required style={inp} placeholder="Partner company name" />
            </div>
            <div>
              <label style={lbl}>Partner Type</label>
              <select value={form.type} onChange={set('type')} style={inp}>
                {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={form.status} onChange={set('status')} style={inp}>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Contact Email</label>
              <input type="email" value={form.contact} onChange={set('contact')} required style={inp} placeholder="contact@partner.com" />
            </div>
            <div>
              <label style={lbl}>Country Code</label>
              <input value={form.country} onChange={set('country')} style={inp} placeholder="NO" maxLength={2} />
            </div>
            <div>
              <label style={lbl}>Discount %</label>
              <input type="number" value={form.discountPct} onChange={set('discountPct')} min={0} max={50} style={inp} />
            </div>
          </div>
          <button type="submit" disabled={saving} style={{ padding: 10, background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginTop: 4 }}>
            {saving ? 'Saving…' : partner ? 'Save Changes' : 'Add Partner'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminPartnerPortal() {
  const [partners, setPartners] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminPartners().then(setPartners).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (form.id) {
      await updateAdminPartner(form.id, form)
      setPartners(p => p.map(x => x.id === form.id ? { ...x, ...form } : x))
    } else {
      const created = await createAdminPartner(form)
      setPartners(p => [created, ...p])
    }
  }

  const filtered = !partners ? [] : filter === 'all' ? partners : partners.filter(p => p.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const stats = {
    total: (partners || []).length,
    active: (partners || []).filter(p => p.status === 'active').length,
    revenue: 'NOK 815K',
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🤝 Partner Portal</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage wholesale accounts, resellers, and brand ambassadors.</div>
          </div>
          <button onClick={() => setModal({})} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Add Partner
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Partners', value: stats.total },
            { label: 'Active', value: stats.active },
            { label: 'Partner Revenue', value: stats.revenue },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'active', 'pending', 'inactive'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No partners found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Company', 'Type', 'Contact', 'Country', 'Discount', 'Orders', 'Revenue', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.inactive
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{TYPE_LABELS[p.type] || p.type}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)', fontSize: 12 }}>{p.contact}</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{p.country}</td>
                      <td style={{ padding: '10px 10px', fontWeight: 600 }}>{p.discountPct}%</td>
                      <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{p.totalOrders}</td>
                      <td style={{ padding: '10px 10px', color: '#86efac', fontWeight: 600 }}>{p.totalRevenue}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                        <button onClick={() => setModal(p)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {modal !== null && <PartnerModal partner={modal.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
