import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCoupons, createAdminCoupon, updateAdminCoupon, deleteAdminCoupon } from '../../api/mlmApi'

const BLANK = { code: '', type: 'percent', value: '', minOrder: '', maxUses: '', expiresAt: '', scope: 'all', status: 'active' }

function CouponModal({ coupon, onSave, onClose }) {
  const [form, setForm] = useState(coupon || BLANK)
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 500, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{coupon ? 'Edit Coupon' : 'Create Coupon'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Coupon Code *</label><input required value={form.code} onChange={set('code')} style={{ ...inp, textTransform: 'uppercase', letterSpacing: 2 }} placeholder="NORDIC20" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Discount Type</label>
              <select value={form.type} onChange={set('type')} style={inp}>
                <option value="percent">Percent Off (%)</option>
                <option value="fixed">Fixed Amount (NOK)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div><label style={lbl}>Value</label><input type="number" min="0" value={form.value} onChange={set('value')} style={inp} placeholder="20" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={lbl}>Min Order (NOK)</label><input type="number" min="0" value={form.minOrder} onChange={set('minOrder')} style={inp} placeholder="0" /></div>
            <div><label style={lbl}>Max Uses</label><input type="number" min="1" value={form.maxUses} onChange={set('maxUses')} style={inp} placeholder="Unlimited" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Scope</label>
              <select value={form.scope} onChange={set('scope')} style={inp}>
                <option value="all">All customers</option>
                <option value="members">Members only</option>
                <option value="new">New customers only</option>
              </select>
            </div>
            <div><label style={lbl}>Expires At</label><input type="date" value={form.expiresAt} onChange={set('expiresAt')} style={inp} /></div>
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select value={form.status} onChange={set('status')} style={inp}>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : coupon ? 'Save Changes' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminCoupons().then(setCoupons).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(form) {
    if (modal?.id) {
      const updated = await updateAdminCoupon(modal.id, form)
      setCoupons(c => c.map(x => x.id === modal.id ? { ...x, ...updated } : x))
    } else {
      const created = await createAdminCoupon(form)
      setCoupons(c => [created, ...c])
    }
  }

  async function handleDelete(coupon) {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return
    await deleteAdminCoupon(coupon.id)
    setCoupons(c => c.filter(x => x.id !== coupon.id))
  }

  const filtered = !coupons ? [] : filter === 'all' ? coupons : coupons.filter(c => c.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const totalUses = (coupons || []).reduce((s, c) => s + c.uses, 0)
  const totalSavings = (coupons || []).reduce((s, c) => s + c.totalSavings, 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏷️ Coupon Codes</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Create and manage discount coupon codes for customers.</div>
          </div>
          <button onClick={() => setModal({})} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Create Coupon
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Coupons', value: (coupons || []).length },
            { label: 'Active', value: (coupons || []).filter(c => c.status === 'active').length },
            { label: 'Total Uses', value: totalUses.toLocaleString() },
            { label: 'Total Savings', value: `${totalSavings.toLocaleString()} NOK` },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['all', 'active', 'paused', 'expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No coupons found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                  {['Code', 'Discount', 'Scope', 'Uses', 'Savings (NOK)', 'Expires', 'Status', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 10px', fontWeight: 700, letterSpacing: 1, fontFamily: 'monospace' }}>{c.code}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--gold)', fontWeight: 600 }}>
                      {c.type === 'percent' ? `${c.value}%` : c.type === 'fixed' ? `${c.value} NOK` : 'Free Shipping'}
                    </td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)', textTransform: 'capitalize' }}>{c.scope.replace('_', ' ')}</td>
                    <td style={{ padding: '10px 10px', textAlign: 'center' }}>{c.uses}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td style={{ padding: '10px 10px' }}>{c.totalSavings.toLocaleString()}</td>
                    <td style={{ padding: '10px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{c.expiresAt || '—'}</td>
                    <td style={{ padding: '10px 10px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.status === 'active' ? '#052e16' : c.status === 'expired' ? '#1c1c1c' : '#3b2a0f', color: c.status === 'active' ? '#86efac' : c.status === 'expired' ? '#9ca3af' : '#fcd34d', border: `1px solid ${c.status === 'active' ? '#166534' : c.status === 'expired' ? '#374151' : '#d97706'}` }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setModal(c)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '4px 10px', cursor: 'pointer', marginRight: 6 }}>Edit</button>
                      <button onClick={() => handleDelete(c)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, color: '#f87171', fontSize: 12, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && <CouponModal coupon={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
