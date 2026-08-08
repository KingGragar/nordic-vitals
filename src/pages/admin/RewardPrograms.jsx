import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRewardPrograms, createAdminRewardProgram, toggleAdminRewardProgram, deleteAdminRewardProgram } from '../../api/mlmApi'

const TYPE_COLOR = { multiplier: '#fbbf24', milestone: '#86efac', bonus: '#93c5fd' }
const TYPE_ICON  = { multiplier: '✖️', milestone: '🏆', bonus: '💹' }
const BLANK = { name: '', type: 'multiplier', multiplier: 2.0, bonusPct: 10, milestone: '', reward: '', segment: 'All Members', startDate: '', endDate: '' }
const SEGMENTS = ['All Members','Active Members','Bronze Members','Gold+ Rank','New Members (30d)','Custom Segment A']

export default function AdminRewardPrograms() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminRewardPrograms().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.name || !form.segment || !form.startDate) return
    setSaving(true)
    const created = await createAdminRewardProgram(form)
    setData(prev => ({ programs: [created, ...(prev?.programs || [])] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function handleToggle(id, active) {
    await toggleAdminRewardProgram(id, !active)
    setData(prev => ({ programs: prev.programs.map(p => p.id === id ? { ...p, active: !p.active } : p) }))
  }

  async function handleDelete(id) {
    await deleteAdminRewardProgram(id)
    setData(prev => ({ programs: prev.programs.filter(p => p.id !== id) }))
    setConfirmId(null)
  }

  const programs = data?.programs || []
  const totalAwarded = programs.reduce((s, p) => s + (p.totalAwarded || 0), 0)
  const activeCount  = programs.filter(p => p.active).length

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const btn  = (bg, fg = '#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Reward Programs</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Create and manage bonus multipliers, milestone rewards, and referral boosters</p>
          </div>
          <button style={btn('#f59e0b')} onClick={() => setModal(true)}>+ New Program</button>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Programs', value: programs.length },
            { label: 'Active', value: activeCount, color: '#86efac' },
            { label: 'Total Awarded', value: `€${totalAwarded.toLocaleString()}`, color: '#fbbf24' },
            { label: 'Enrolled Members', value: programs.reduce((s, p) => s + (p.enrolledCount || 0), 0).toLocaleString(), color: '#93c5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color ?? 'var(--text)' }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Programs grid */}
        {loading ? (
          <div style={{ ...card, textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
            {programs.map(p => (
              <div key={p.id} style={{ ...card, opacity: p.active ? 1 : 0.65 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 13, background: 'rgba(0,0,0,.2)', color: TYPE_COLOR[p.type], borderRadius: 5, padding: '2px 8px', marginBottom: 6, display: 'inline-block' }}>{TYPE_ICON[p.type]} {p.type}</span>
                    <h3 style={{ margin: '6px 0 0', fontSize: 16, fontWeight: 700 }}>{p.name}</h3>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{p.active ? 'Active' : 'Paused'}</span>
                    <div onClick={() => handleToggle(p.id, p.active)} style={{ width: 34, height: 18, borderRadius: 9, background: p.active ? '#22c55e' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: p.active ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
                    </div>
                  </label>
                </div>

                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>
                  {p.type === 'multiplier' && <span>×{p.multiplier} points multiplier</span>}
                  {p.type === 'bonus' && <span>+{p.bonusPct}% commission bonus</span>}
                  {p.type === 'milestone' && <span>Milestone: {p.milestone} → {p.reward}</span>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                  <div>Segment: <strong style={{ color: 'var(--text)' }}>{p.segment}</strong></div>
                  <div>Enrolled: <strong style={{ color: '#93c5fd' }}>{p.enrolledCount?.toLocaleString()}</strong></div>
                  <div>Awarded: <strong style={{ color: '#fbbf24' }}>€{p.totalAwarded?.toLocaleString()}</strong></div>
                  <div>Ends: <strong style={{ color: 'var(--text)' }}>{p.endDate ? new Date(p.endDate).toLocaleDateString() : 'No end'}</strong></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {confirmId === p.id
                    ? <><button style={{ ...btn('#ef4444'), padding: '5px 12px', fontSize: 12 }} onClick={() => handleDelete(p.id)}>Confirm</button><button style={{ ...btn('transparent', 'var(--text)'), padding: '5px 12px', fontSize: 12 }} onClick={() => setConfirmId(null)}>Cancel</button></>
                    : <button style={{ ...btn('transparent', '#f87171'), padding: '5px 12px', fontSize: 12 }} onClick={() => setConfirmId(p.id)}>Delete</button>
                  }
                </div>
              </div>
            ))}
            {programs.length === 0 && <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>No reward programs yet.</div>}
          </div>
        )}

        {/* Create modal */}
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,.4)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>New Reward Program</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Program Name</label><input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Bonus Blast" /></div>
                <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Type</label>
                  <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="multiplier">Points Multiplier</option>
                    <option value="bonus">Commission Bonus %</option>
                    <option value="milestone">Milestone Reward</option>
                  </select>
                </div>
                {form.type === 'multiplier' && <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Multiplier (×)</label><input style={inp} type="number" step="0.1" min="1" value={form.multiplier} onChange={e => setForm(f => ({ ...f, multiplier: parseFloat(e.target.value) }))} /></div>}
                {form.type === 'bonus' && <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Bonus %</label><input style={inp} type="number" min="1" max="100" value={form.bonusPct} onChange={e => setForm(f => ({ ...f, bonusPct: parseInt(e.target.value) }))} /></div>}
                {form.type === 'milestone' && <>
                  <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Milestone Trigger</label><input style={inp} value={form.milestone} onChange={e => setForm(f => ({ ...f, milestone: e.target.value }))} placeholder="e.g. Reach Silver rank" /></div>
                  <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Reward Description</label><input style={inp} value={form.reward} onChange={e => setForm(f => ({ ...f, reward: e.target.value }))} placeholder="e.g. €50 store credit" /></div>
                </>}
                <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Target Segment</label>
                  <select style={inp} value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                    {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Start Date</label><input style={inp} type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
                  <div><label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>End Date</label><input style={inp} type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button style={btn('var(--border)', 'var(--text)')} onClick={() => { setModal(false); setForm(BLANK) }}>Cancel</button>
                <button style={btn('#f59e0b')} onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Program'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
