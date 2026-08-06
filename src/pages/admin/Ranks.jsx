import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRanks, createRank, updateRank, deleteRank } from '../../api/mlmApi'

const ICONS = ['⭐', '🥉', '🥈', '🥇', '💎', '💠', '🔷', '👑', '🏆', '🌟', '🔥', '⚡', '🎖️', '🏅']
const COLORS = [
  { label: 'Gray',        value: '#9ca3af' },
  { label: 'Bronze',      value: '#cd7f32' },
  { label: 'Silver',      value: '#c0c0c0' },
  { label: 'Gold',        value: '#ffd700' },
  { label: 'Platinum',    value: '#e5e4e2' },
  { label: 'Ice Blue',    value: '#b9f2ff' },
  { label: 'Royal Blue',  value: '#3b82f6' },
  { label: 'Purple',      value: '#a855f7' },
  { label: 'Rose Gold',   value: '#f43f5e' },
  { label: 'Emerald',     value: '#10b981' },
]

const BLANK = {
  name: '', slug: '', color: '#ffd700', icon: '⭐', order: 99,
  pvRequired: 0, gvRequired: 0, activeLegsRequired: 0, legVolRequired: 0,
  monthlyBonus: 0, retailDiscount: 20, qualifyingPeriod: 'month', active: true,
}

function fmtNOK(n) {
  if (!n) return '—'
  return 'NOK ' + Number(n).toLocaleString('no-NO')
}

function RankBadge({ rank }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: rank.color + '22', border: `1px solid ${rank.color}55`,
      color: rank.color, borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600,
    }}>
      {rank.icon} {rank.name}
    </span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '22px', color: color || 'var(--cream)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function RankModal({ mode, initial, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(initial || BLANK)

  function set(field, val) { setForm(f => ({ ...f, [field]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    const slug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
    onSave({ ...form, slug, order: Number(form.order), pvRequired: Number(form.pvRequired), gvRequired: Number(form.gvRequired), activeLegsRequired: Number(form.activeLegsRequired), legVolRequired: Number(form.legVolRequired), monthlyBonus: Number(form.monthlyBonus), retailDiscount: Number(form.retailDiscount) })
  }

  const fieldStyle = { display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }
  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '28px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h3 style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: '20px' }}>
          {mode === 'create' ? 'Create Rank' : `Edit — ${initial?.name}`}
        </h3>

        <form onSubmit={handleSubmit}>
          <div style={row}>
            <div>
              <label style={fieldStyle}>Rank Name *</label>
              <input className="input" value={form.name} required
                onChange={e => set('name', e.target.value)} style={{ width: '100%' }} placeholder="e.g. Diamond" />
            </div>
            <div>
              <label style={fieldStyle}>Display Order</label>
              <input className="input" type="number" min="1" value={form.order}
                onChange={e => set('order', e.target.value)} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={fieldStyle}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => set('icon', ic)} style={{
                  width: '36px', height: '36px', borderRadius: '8px', fontSize: '18px', cursor: 'pointer',
                  background: form.icon === ic ? 'var(--gold)' : 'var(--navy)', border: `2px solid ${form.icon === ic ? 'var(--gold)' : 'var(--border)'}`,
                }}>{ic}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={fieldStyle}>Colour</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {COLORS.map(c => (
                <button key={c.value} type="button" title={c.label} onClick={() => set('color', c.value)} style={{
                  width: '28px', height: '28px', borderRadius: '50%', background: c.value, cursor: 'pointer',
                  border: `3px solid ${form.color === c.value ? 'var(--cream)' : 'transparent'}`,
                }} />
              ))}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
                style={{ width: '32px', height: '28px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
              <span style={{ color: 'var(--text2)', fontSize: '11px' }}>Custom colour: {form.color}</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginBottom: '16px', paddingTop: '16px' }}>
            <div style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Qualification Requirements
            </div>
            <div style={row}>
              <div>
                <label style={fieldStyle}>Personal Volume (PV)</label>
                <input className="input" type="number" min="0" value={form.pvRequired}
                  onChange={e => set('pvRequired', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={fieldStyle}>Group Volume (GV)</label>
                <input className="input" type="number" min="0" value={form.gvRequired}
                  onChange={e => set('gvRequired', e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={row}>
              <div>
                <label style={fieldStyle}>Active Legs Required</label>
                <input className="input" type="number" min="0" value={form.activeLegsRequired}
                  onChange={e => set('activeLegsRequired', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={fieldStyle}>Min Volume Per Leg (GV)</label>
                <input className="input" type="number" min="0" value={form.legVolRequired}
                  onChange={e => set('legVolRequired', e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={fieldStyle}>Qualifying Period</label>
              <select className="input" value={form.qualifyingPeriod}
                onChange={e => set('qualifyingPeriod', e.target.value)} style={{ width: '100%' }}>
                <option value="month">Monthly</option>
                <option value="quarter">Quarterly</option>
                <option value="lifetime">Lifetime (one-time)</option>
              </select>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginBottom: '16px', paddingTop: '16px' }}>
            <div style={{ color: 'var(--text2)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Rank Benefits
            </div>
            <div style={row}>
              <div>
                <label style={fieldStyle}>Monthly Rank Bonus (NOK)</label>
                <input className="input" type="number" min="0" value={form.monthlyBonus}
                  onChange={e => set('monthlyBonus', e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label style={fieldStyle}>Retail Discount %</label>
                <input className="input" type="number" min="0" max="100" value={form.retailDiscount}
                  onChange={e => set('retailDiscount', e.target.value)} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input type="checkbox" id="rank-active" checked={form.active}
              onChange={e => set('active', e.target.checked)} style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
            <label htmlFor="rank-active" style={{ color: 'var(--cream)', fontSize: '13px', cursor: 'pointer' }}>Rank is active</label>
          </div>

          {error && <div style={{ color: '#f87171', marginBottom: '12px', fontSize: '13px' }}>{error}</div>}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn" disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create Rank' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Ranks() {
  const [ranks, setRanks] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getAdminRanks()
      setRanks(res.ranks || [])
    } catch {}
    setLoading(false)
  }

  async function handleSave(data) {
    setSaving(true)
    setSaveError('')
    try {
      if (modal.mode === 'create') {
        await createRank(data)
      } else {
        await updateRank(modal.rank.id, data)
      }
      await load()
      setModal(null)
    } catch (e) {
      setSaveError(e?.message || 'Save failed.')
    }
    setSaving(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRank(deleteTarget.id)
      await load()
      setDeleteTarget(null)
    } catch {}
    setDeleting(false)
  }

  async function toggleActive(rank) {
    try {
      await updateRank(rank.id, { active: !rank.active })
      await load()
    } catch {}
  }

  const totalMembers = ranks.reduce((s, r) => s + (r.memberCount || 0), 0)
  const activeRanks  = ranks.filter(r => r.active).length
  const maxBonus     = Math.max(0, ...ranks.map(r => r.monthlyBonus || 0))
  const topRank      = ranks.find(r => r.monthlyBonus === maxBonus)

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontWeight: 700, fontSize: '22px', color: 'var(--cream)', marginBottom: '4px' }}>🏅 Rank Manager</h1>
            <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Define MLM rank tiers, qualification requirements, and benefits.</p>
          </div>
          <button className="btn" onClick={() => { setSaveError(''); setModal({ mode: 'create', rank: null }) }}>
            + Create Rank
          </button>
        </div>

        <div className="stat-grid" style={{ marginBottom: '28px' }}>
          <KpiCard label="Total Ranks" value={ranks.length} sub={`${activeRanks} active`} />
          <KpiCard label="Total Ranked Members" value={totalMembers.toLocaleString('no-NO')} />
          <KpiCard label="Top Rank" value={topRank ? `${topRank.icon} ${topRank.name}` : '—'} sub={topRank ? `${topRank.memberCount} members` : ''} color="var(--gold)" />
          <KpiCard label="Max Monthly Bonus" value={fmtNOK(maxBonus)} color="#86efac" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading ranks…</div>
        ) : ranks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
            No ranks yet. <button className="btn" style={{ marginTop: '12px' }} onClick={() => setModal({ mode: 'create', rank: null })}>Create First Rank</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ranks.map((rank, idx) => (
              <div key={rank.id} style={{
                background: 'var(--navy2)', border: `1px solid ${rank.active ? rank.color + '44' : 'var(--border)'}`,
                borderLeft: `4px solid ${rank.color}`, borderRadius: '12px', padding: '18px 20px',
                opacity: rank.active ? 1 : 0.6,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1', minWidth: '200px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '22px', background: rank.color + '22', border: `1px solid ${rank.color}44`,
                    }}>{rank.icon}</div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: rank.color }}>{rank.name}</span>
                        {!rank.active && <span className="badge" style={{ background: 'var(--navy3)', color: 'var(--text2)', fontSize: '10px' }}>Inactive</span>}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: '11px' }}>Rank #{rank.order} · {rank.memberCount || 0} members</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '16px', flex: '3', minWidth: '280px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text2)', fontSize: '10px', marginBottom: '2px' }}>PV Required</div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{rank.pvRequired || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text2)', fontSize: '10px', marginBottom: '2px' }}>GV Required</div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{rank.gvRequired?.toLocaleString('no-NO') || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text2)', fontSize: '10px', marginBottom: '2px' }}>Active Legs</div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{rank.activeLegsRequired || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text2)', fontSize: '10px', marginBottom: '2px' }}>Monthly Bonus</div>
                      <div style={{ fontWeight: 600, color: rank.monthlyBonus ? '#86efac' : 'var(--text2)', fontSize: '14px' }}>{fmtNOK(rank.monthlyBonus)}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--text2)', fontSize: '10px', marginBottom: '2px' }}>Retail Disc.</div>
                      <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{rank.retailDiscount}%</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => toggleActive(rank)}
                      style={{
                        padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                        background: rank.active ? '#052e16' : 'var(--navy3)',
                        color: rank.active ? '#86efac' : 'var(--text2)',
                        border: `1px solid ${rank.active ? '#166534' : 'var(--border)'}`,
                      }}>{rank.active ? 'Active' : 'Inactive'}</button>
                    <button className="btn-outline" style={{ padding: '5px 12px', fontSize: '12px' }}
                      onClick={() => { setSaveError(''); setModal({ mode: 'edit', rank }) }}>Edit</button>
                    <button onClick={() => setDeleteTarget(rank)} style={{
                      padding: '5px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                      background: 'transparent', color: '#f87171', border: '1px solid #f8717144',
                    }}>Delete</button>
                  </div>
                </div>

                {(rank.legVolRequired > 0 || rank.qualifyingPeriod !== 'month') && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {rank.legVolRequired > 0 && (
                      <span style={{ color: 'var(--text2)', fontSize: '11px' }}>
                        Min leg vol: <strong style={{ color: 'var(--cream)' }}>{rank.legVolRequired.toLocaleString('no-NO')} GV</strong>
                      </span>
                    )}
                    <span style={{ color: 'var(--text2)', fontSize: '11px' }}>
                      Qualifying: <strong style={{ color: 'var(--cream)', textTransform: 'capitalize' }}>{rank.qualifyingPeriod}</strong>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {modal && (
          <RankModal
            mode={modal.mode}
            initial={modal.rank || undefined}
            onSave={handleSave}
            onClose={() => setModal(null)}
            saving={saving}
            error={saveError}
          />
        )}

        {deleteTarget && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
          }}>
            <div style={{
              background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
              padding: '28px', maxWidth: '400px', width: '100%',
            }}>
              <h3 style={{ color: '#f87171', fontWeight: 700, marginBottom: '10px' }}>Delete Rank?</h3>
              <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '6px' }}>
                You are about to delete <strong style={{ color: 'var(--cream)' }}>{deleteTarget.icon} {deleteTarget.name}</strong>.
              </p>
              <p style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '20px' }}>
                This affects <strong>{deleteTarget.memberCount || 0}</strong> current members who hold this rank. Their rank will revert to the previous tier.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn-outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
                <button onClick={handleDelete} disabled={deleting} style={{
                  padding: '8px 18px', borderRadius: '8px', background: '#7f1d1d', color: '#fca5a5',
                  border: '1px solid #b91c1c', cursor: 'pointer', fontWeight: 600,
                }}>{deleting ? 'Deleting…' : 'Delete Rank'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
