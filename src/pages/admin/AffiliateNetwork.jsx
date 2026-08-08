import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminAffiliateNetwork, createAdminAffiliate, updateAdminAffiliateStatus } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', paused: '#fbbf24', terminated: '#f87171', pending: '#93c5fd' }
const STATUS_BG    = { active: '#14532d', paused: '#78350f', terminated: '#7f1d1d', pending: '#1e3a5f' }
const BLANK = { name: '', email: '', website: '', commissionPct: 10, tier: 'standard', notes: '' }

export default function AdminAffiliateNetwork() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('revenue')

  const load = useCallback(() => {
    setLoading(true)
    getAdminAffiliateNetwork().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.name || !form.email) return
    setSaving(true)
    const created = await createAdminAffiliate(form)
    setData(prev => ({ ...prev, affiliates: [created, ...(prev?.affiliates || [])] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function toggleStatus(id, current) {
    const next = current === 'active' ? 'paused' : 'active'
    await updateAdminAffiliateStatus(id, next)
    setData(prev => ({ ...prev, affiliates: prev.affiliates.map(a => a.id === id ? { ...a, status: next } : a) }))
  }

  const affiliates = (data?.affiliates || [])
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'revenue' ? b.revenue - a.revenue : sort === 'clicks' ? b.clicks - a.clicks : b.conversions - a.conversions)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  const allAff = data?.affiliates || []
  const stats = [
    { label: 'Total Affiliates', value: allAff.length, color: 'var(--text)' },
    { label: 'Active', value: allAff.filter(a => a.status === 'active').length, color: '#86efac' },
    { label: 'Total Revenue', value: `€${allAff.reduce((s, a) => s + (a.revenue || 0), 0).toLocaleString()}`, color: '#fbbf24' },
    { label: 'Pending Payout', value: `€${allAff.reduce((s, a) => s + (a.pendingPayout || 0), 0).toLocaleString()}`, color: '#93c5fd' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🤝 Affiliate Network</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>External affiliate partners — blogs, influencers, review sites — separate from the MLM downline.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Add Affiliate
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search affiliates…" style={{ ...inp, width: 210, flex: 'none' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'active', 'paused', 'pending', 'terminated'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 13px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ ...inp, width: 140, flex: 'none' }}>
            <option value="revenue">Sort: Revenue</option>
            <option value="clicks">Sort: Clicks</option>
            <option value="conversions">Sort: Conversions</option>
          </select>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !affiliates.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No affiliates found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {affiliates.map(a => (
              <div key={a.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                  {a.name.charAt(0)}
                </div>
                <div style={{ flex: '1 1 180px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>{a.email}</div>
                  {a.website && <div style={{ color: 'var(--text2)', fontSize: 11 }}>{a.website}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 70px)', gap: 8, textAlign: 'center' }}>
                  {[['Clicks', a.clicks?.toLocaleString()], ['Conv.', a.conversions], ['Revenue', `€${(a.revenue || 0).toLocaleString()}`]].map(([l, v]) => (
                    <div key={l}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{v}</div>
                      <div style={{ fontSize: 11, color: 'var(--text2)' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'right', minWidth: 60 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.commissionPct}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize' }}>{a.tier}</div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[a.status], color: STATUS_COLOR[a.status], textTransform: 'capitalize' }}>{a.status}</span>
                {(a.status === 'active' || a.status === 'paused') && (
                  <button onClick={() => toggleStatus(a.id, a.status)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                    {a.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 460 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Add Affiliate Partner</div>
              {[
                { label: 'Name / Handle', key: 'name', placeholder: 'e.g. PeptideReviewNorge' },
                { label: 'Email', key: 'email', placeholder: 'partner@example.com' },
                { label: 'Website', key: 'website', placeholder: 'https://example.com' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input value={form[f.key]} placeholder={f.placeholder} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Commission %</div>
                  <input type="number" value={form.commissionPct} min={1} max={50} onChange={e => setForm(p => ({ ...p, commissionPct: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Tier</div>
                  <select value={form.tier} onChange={e => setForm(p => ({ ...p, tier: e.target.value }))} style={inp}>
                    {['standard', 'silver', 'gold', 'platinum'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Internal Notes</div>
                <textarea value={form.notes} rows={2} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.name || !form.email} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Adding…' : 'Add Affiliate'}
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
