import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCreditNotes, createAdminCreditNote, voidAdminCreditNote } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', used: '#93c5fd', void: '#f87171', expired: '#fbbf24' }
const STATUS_BG    = { active: '#14532d', used: '#1e3a5f', void: '#7f1d1d', expired: '#78350f' }
const TYPE_ICON    = { refund: '↩️', goodwill: '🎁', correction: '✏️', loyalty: '⭐' }
const BLANK = { memberId: '', memberName: '', amount: '', currency: 'EUR', reason: '', type: 'refund', expiryDays: 90 }

export default function AdminCreditNotes() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getAdminCreditNotes().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.memberId || !form.amount || !form.reason) return
    setSaving(true)
    const created = await createAdminCreditNote(form)
    setData(prev => ({ ...prev, notes: [created, ...(prev?.notes || [])] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function handleVoid(id) {
    if (!confirm('Void this credit note? This cannot be undone.')) return
    await voidAdminCreditNote(id)
    setData(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? { ...n, status: 'void' } : n) }))
  }

  const notes = data?.notes || []
  const filtered = notes
    .filter(n => filter === 'all' || n.status === filter)
    .filter(n => !search || n.memberName.toLowerCase().includes(search.toLowerCase()) || n.id.includes(search))

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  const stats = [
    { label: 'Total Issued', value: notes.length, color: 'var(--text)' },
    { label: 'Active', value: notes.filter(n => n.status === 'active').length, color: '#86efac' },
    { label: 'Total Value', value: `€${notes.filter(n => n.status === 'active').reduce((s, n) => s + n.amount, 0).toLocaleString()}`, color: '#fbbf24' },
    { label: 'Used', value: notes.filter(n => n.status === 'used').length, color: '#93c5fd' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📄 Credit Notes</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Issue and manage store credit notes — refunds, goodwill, corrections, loyalty awards.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Issue Credit Note
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by member or ID…" style={{ ...inp, width: 220, flex: 'none' }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'active', 'used', 'void', 'expired'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !filtered.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No credit notes found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(n => (
              <div key={n.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ fontSize: 22, minWidth: 30, textAlign: 'center' }}>{TYPE_ICON[n.type] || '📄'}</div>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{n.memberName}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{n.reason}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>#{n.id} · {n.type} · Issued {n.issuedAt}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>€{n.amount.toLocaleString()}</div>
                  {n.expiresAt && <div style={{ fontSize: 11, color: 'var(--text2)' }}>Expires {n.expiresAt}</div>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[n.status], color: STATUS_COLOR[n.status], textTransform: 'capitalize' }}>{n.status}</span>
                {n.status === 'active' && (
                  <button onClick={() => handleVoid(n.id)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Void</button>
                )}
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Issue Credit Note</div>
              {[
                { label: 'Member ID', key: 'memberId', placeholder: 'e.g. M-1042' },
                { label: 'Member Name', key: 'memberName', placeholder: 'e.g. Anna Svensson' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input value={form[f.key]} placeholder={f.placeholder} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Amount</div>
                  <input type="number" value={form.amount} placeholder="0.00" min="0" onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Currency</div>
                  <select value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))} style={inp}>
                    {['EUR', 'NOK', 'SEK', 'DKK', 'GBP'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Type</div>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inp}>
                  {['refund', 'goodwill', 'correction', 'loyalty'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Reason (internal note)</div>
                <textarea value={form.reason} placeholder="Describe why this credit note is being issued…" rows={3} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Expires in (days)</div>
                <input type="number" value={form.expiryDays} min={1} onChange={e => setForm(p => ({ ...p, expiryDays: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.memberId || !form.amount || !form.reason} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Issuing…' : 'Issue Credit Note'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
