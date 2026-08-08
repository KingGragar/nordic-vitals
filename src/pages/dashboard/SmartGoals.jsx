import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberSmartGoals, createMemberSmartGoal, updateMemberSmartGoalProgress, deleteMemberSmartGoal } from '../../api/mlmApi'

const CAT_ICON = { sales: '💰', recruitment: '👥', rank: '🏅', health: '💪', learning: '📚', personal: '⭐' }
const STATUS_COLOR = { on_track: '#86efac', behind: '#f87171', completed: '#93c5fd', paused: '#fbbf24' }
const STATUS_BG    = { on_track: '#14532d', behind: '#7f1d1d', completed: '#1e3a5f', paused: '#78350f' }
const BLANK = { title: '', category: 'sales', specific: '', measurable: '', target: '', deadline: '', milestones: [] }

export default function DashSmartGoals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState(null)
  const [progressInput, setProgressInput] = useState({})

  useEffect(() => {
    getMemberSmartGoals().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.title || !form.target || !form.deadline) return
    setSaving(true)
    const created = await createMemberSmartGoal(form)
    setData(prev => ({ ...prev, goals: [...(prev?.goals || []), created] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function handleProgress(id) {
    const val = parseFloat(progressInput[id])
    if (isNaN(val)) return
    await updateMemberSmartGoalProgress(id, val)
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, current: val, status: val >= g.target ? 'completed' : g.status } : g)
    }))
    setProgressInput(p => ({ ...p, [id]: '' }))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this goal?')) return
    await deleteMemberSmartGoal(id)
    setData(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }))
  }

  const goals = data?.goals || []
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  const stats = [
    { label: 'Active Goals', value: goals.filter(g => g.status !== 'completed').length, color: 'var(--gold)' },
    { label: 'Completed', value: goals.filter(g => g.status === 'completed').length, color: '#86efac' },
    { label: 'On Track', value: goals.filter(g => g.status === 'on_track').length, color: '#93c5fd' },
    { label: 'Behind', value: goals.filter(g => g.status === 'behind').length, color: '#f87171' },
  ]

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎯 SMART Goals</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Set Specific, Measurable, Achievable, Relevant, Time-bound goals.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Goal
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 22 }}>
          {stats.map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !goals.length ? (
          <div style={{ ...card, textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No goals yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Create your first SMART goal to start tracking your progress.</div>
            <button onClick={() => setModal(true)} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>+ New Goal</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {goals.map(g => {
              const pct = Math.min(100, Math.round(((g.current || 0) / g.target) * 100))
              const isExpanded = expanded === g.id
              return (
                <div key={g.id} style={card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 18 }}>{CAT_ICON[g.category] || '⭐'}</span>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{g.title}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: STATUS_BG[g.status], color: STATUS_COLOR[g.status], textTransform: 'capitalize' }}>{g.status?.replace('_', ' ')}</span>
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 12 }}>Deadline: {g.deadline} · {g.category}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{pct}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{g.current ?? 0} / {g.target} {g.unit || ''}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 12, marginBottom: 4, height: 8, borderRadius: 4, background: 'var(--bg)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 4, background: g.status === 'completed' ? '#93c5fd' : g.status === 'behind' ? '#ef4444' : 'var(--gold)', transition: 'width 0.4s' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="number" value={progressInput[g.id] || ''} onChange={e => setProgressInput(p => ({ ...p, [g.id]: e.target.value }))} placeholder="Update progress…" style={{ ...inp, width: 160 }} />
                      <button onClick={() => handleProgress(g.id)} style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Update</button>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(g.specific || g.measurable || g.milestones?.length > 0) && (
                        <button onClick={() => setExpanded(isExpanded ? null : g.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>
                          {isExpanded ? 'Less' : 'Details'}
                        </button>
                      )}
                      <button onClick={() => handleDelete(g.id)} style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      {g.specific && <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600, fontSize: 12 }}>Specific: </span><span style={{ fontSize: 13, color: 'var(--text2)' }}>{g.specific}</span></div>}
                      {g.measurable && <div style={{ marginBottom: 8 }}><span style={{ fontWeight: 600, fontSize: 12 }}>How measured: </span><span style={{ fontSize: 13, color: 'var(--text2)' }}>{g.measurable}</span></div>}
                      {g.milestones?.length > 0 && (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 6 }}>Milestones</div>
                          {g.milestones.map((m, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                              <span>{m.done ? '✅' : '⭕'}</span>
                              <span style={{ color: m.done ? 'var(--text2)' : 'var(--text)', textDecoration: m.done ? 'line-through' : 'none' }}>{m.label}</span>
                              <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 12 }}>{m.dueDate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20, overflowY: 'auto' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 500, margin: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>🎯 New SMART Goal</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Goal Title *</div>
                <input value={form.title} placeholder="e.g. Reach Silver rank by September" onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Category</div>
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inp}>
                    {Object.entries(CAT_ICON).map(([k, v]) => <option key={k} value={k}>{v} {k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Deadline *</div>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Target Value *</div>
                  <input type="number" value={form.target} placeholder="e.g. 10" onChange={e => setForm(p => ({ ...p, target: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Unit</div>
                  <input value={form.unit || ''} placeholder="e.g. sales" onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} style={inp} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Specific (what exactly?)</div>
                <textarea value={form.specific} rows={2} placeholder="Describe exactly what you want to achieve…" onChange={e => setForm(p => ({ ...p, specific: e.target.value }))} style={{ ...inp, resize: 'vertical' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>How will you measure it?</div>
                <input value={form.measurable} placeholder="e.g. Track weekly sales in the dashboard" onChange={e => setForm(p => ({ ...p, measurable: e.target.value }))} style={inp} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleCreate} disabled={saving || !form.title || !form.target || !form.deadline} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Saving…' : 'Create Goal'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
