import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminFlashSales, createAdminFlashSale, updateAdminFlashSale, deleteAdminFlashSale } from '../../api/mlmApi'

const STATUS_STYLE = {
  active:    { bg: '#052e16', color: '#86efac', border: '#166534' },
  scheduled: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  draft:     { bg: '#1c1c1c', color: '#9ca3af', border: '#374151' },
  expired:   { bg: '#2d1b00', color: '#9ca3af', border: '#374151' },
}

function pad(n) { return String(n).padStart(2, '0') }

function Countdown({ endsAt }) {
  const [diff, setDiff] = useState(0)
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, new Date(endsAt) - Date.now()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  if (diff <= 0) return <span style={{ color: '#9ca3af', fontSize: 12 }}>Ended</span>
  return <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#fbbf24' }}>{pad(h)}:{pad(m)}:{pad(s)}</span>
}

function SaleModal({ sale, onSave, onClose }) {
  const editing = !!sale
  const [form, setForm] = useState({
    title: sale?.title || '',
    discount: sale?.discount || 20,
    discountType: sale?.discountType || 'percent',
    products: sale?.products?.join(', ') || '',
    stockLimit: sale?.stockLimit || 100,
    startsAt: sale?.startsAt?.slice(0, 16) || '',
    endsAt: sale?.endsAt?.slice(0, 16) || '',
    status: sale?.status || 'draft',
  })
  const [saving, setSaving] = useState(false)

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const sel = { ...inp }
  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.title.trim() || !form.startsAt || !form.endsAt) return
    setSaving(true)
    const data = {
      ...form,
      discount: Number(form.discount),
      stockLimit: Number(form.stockLimit),
      products: form.products.split(',').map(s => s.trim()).filter(Boolean),
    }
    await onSave(data)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{editing ? 'Edit Flash Sale' : 'New Flash Sale'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Summer Protein Blast" style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Discount</label>
              <input type="number" min="1" value={form.discount} onChange={e => set('discount', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Type</label>
              <select value={form.discountType} onChange={e => set('discountType', e.target.value)} style={sel}>
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (NOK)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Products (comma-separated)</label>
            <input value={form.products} onChange={e => set('products', e.target.value)} placeholder="Whey Pro 1kg, BCAA Matrix" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Stock Limit</label>
            <input type="number" min="1" value={form.stockLimit} onChange={e => set('stockLimit', e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Starts At *</label>
              <input type="datetime-local" value={form.startsAt} onChange={e => set('startsAt', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Ends At *</label>
              <input type="datetime-local" value={form.endsAt} onChange={e => set('endsAt', e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={sel}>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 2, padding: '10px 0', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Sale'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminFlashSales() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    try { setSales(await getAdminFlashSales()) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function handleSave(data) {
    if (modal?.id) { const u = await updateAdminFlashSale(modal.id, data); setSales(p => p.map(s => s.id === modal.id ? u : s)) }
    else { const n = await createAdminFlashSale(data); setSales(p => [...p, n]) }
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminFlashSale(id)
    setSales(p => p.filter(s => s.id !== id))
    setDeleting(null)
  }

  const filtered = filter === 'all' ? sales : sales.filter(s => s.status === filter)
  const counts = { active: sales.filter(s => s.status === 'active').length, scheduled: sales.filter(s => s.status === 'scheduled').length, total: sales.length }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color) => ({ padding: '6px 14px', borderRadius: 6, border: 'none', background: bg, color, fontWeight: 600, fontSize: 13, cursor: 'pointer' })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>⚡ Flash Sales</h1>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Time-limited deals with countdown timers</div>
          </div>
          <button onClick={() => setModal({})} style={{ ...btn('#22c55e', '#fff'), padding: '10px 20px' }}>+ New Flash Sale</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {[['⚡', 'Active Now', counts.active, '#22c55e'], ['📅', 'Scheduled', counts.scheduled, '#60a5fa'], ['📋', 'Total Sales', counts.total, 'var(--text)']].map(([icon, label, val, color]) => (
            <div key={label} style={card}>
              <div style={{ fontSize: 22 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 24, color, marginTop: 6 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'active', 'scheduled', 'draft', 'expired'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--primary, #22c55e)' : 'var(--bg)', color: filter === f ? '#fff' : 'var(--text)', fontWeight: filter === f ? 700 : 400, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No flash sales found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => {
              const st = STATUS_STYLE[s.status] || STATUS_STYLE.draft
              const pct = s.stockLimit > 0 ? Math.min(100, Math.round((s.sold / s.stockLimit) * 100)) : 0
              return (
                <div key={s.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>{s.title}</div>
                        <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color, border: `1px solid ${st.border}`, textTransform: 'uppercase' }}>{s.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
                        {s.discountType === 'percent' ? `${s.discount}% off` : `NOK ${s.discount} off`} · {s.products?.join(', ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setModal(s)} style={btn('var(--bg)', 'var(--text)')}>Edit</button>
                      <button onClick={() => handleDelete(s.id)} disabled={deleting === s.id} style={{ ...btn('#2d0f0f', '#fca5a5'), opacity: deleting === s.id ? 0.5 : 1 }}>Delete</button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>TIME REMAINING</div>
                      {s.status === 'active' ? <Countdown endsAt={s.endsAt} /> : <span style={{ fontSize: 13, color: 'var(--text2)' }}>—</span>}
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>STOCK SOLD</div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{s.sold} / {s.stockLimit}</div>
                    </div>
                    <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>SCHEDULE</div>
                      <div style={{ fontSize: 12 }}>{new Date(s.startsAt).toLocaleString()} → {new Date(s.endsAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
                      <span>Stock utilisation</span><span>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? '#ef4444' : '#22c55e', borderRadius: 3, transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {modal !== null && <SaleModal sale={modal?.id ? modal : null} onSave={handleSave} onClose={() => setModal(null)} />}
    </AdminLayout>
  )
}
