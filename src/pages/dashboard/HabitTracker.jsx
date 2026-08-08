import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberHabits, logMemberHabit, createMemberHabit } from '../../api/mlmApi'

const DEFAULT_ICONS = ['💊', '💧', '🏋️', '😴', '📞', '📚', '🥗', '🧘', '🚶', '✅']

function NewHabitModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('✅')
  const [target, setTarget] = useState(5)
  const [saving, setSaving] = useState(false)
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  async function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onSave({ name, icon, target: Number(target) })
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>New Habit</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lbl}>Habit Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required style={inp} placeholder="e.g. Take morning supplements" />
          </div>
          <div>
            <label style={lbl}>Icon</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEFAULT_ICONS.map(i => (
                <button key={i} type="button" onClick={() => setIcon(i)} style={{ width: 38, height: 38, borderRadius: 7, border: `2px solid ${icon === i ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--bg)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Weekly Target (days per week): {target}</label>
            <input type="range" min={1} max={7} value={target} onChange={e => setTarget(e.target.value)} style={{ width: '100%' }} />
          </div>
          <button type="submit" disabled={saving} style={{ padding: 10, background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Add Habit'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function HabitTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toggling, setToggling] = useState(null)
  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    getMemberHabits().then(setData).finally(() => setLoading(false))
  }, [])

  async function toggleDay(habitId, date) {
    setToggling(`${habitId}-${date}`)
    await logMemberHabit(habitId, date)
    setData(d => ({
      ...d,
      habits: d.habits.map(h => {
        if (h.id !== habitId) return h
        const has = h.completedDates.includes(date)
        const completedDates = has ? h.completedDates.filter(x => x !== date) : [...h.completedDates, date]
        return { ...h, completedDates }
      }),
    }))
    setToggling(null)
  }

  async function handleCreate(payload) {
    const created = await createMemberHabit(payload)
    setData(d => ({ ...d, habits: [...d.habits, created] }))
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const weekLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🔁 Habit Tracker</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Build consistency with daily habits and track your streaks.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + New Habit
          </button>
        </div>

        {loading || !data ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : data.habits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No habits yet. Add your first one!</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 22 }}>
              {[
                { label: 'Habits', value: data.habits.length },
                { label: 'Best Streak', value: `${Math.max(...data.habits.map(h => h.streak))}d` },
                { label: 'Completed Today', value: data.habits.filter(h => h.completedDates.includes(today)).length },
              ].map(s => (
                <div key={s.label} style={card}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 10, paddingRight: 4 }}>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Habit</div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.weekDates.length}, 32px)`, gap: 4 }}>
                {weekLabels.slice(0, data.weekDates.length).map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: 11, color: data.weekDates[i] === today ? 'var(--gold)' : 'var(--text2)', fontWeight: data.weekDates[i] === today ? 700 : 400 }}>
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.habits.map(habit => {
                const doneCount = habit.completedDates.filter(d => data.weekDates.includes(d)).length
                const pct = Math.round((doneCount / habit.target) * 100)
                return (
                  <div key={habit.id} style={card}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 18 }}>{habit.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{habit.name}</span>
                          <span style={{ fontSize: 12, color: '#fcd34d', marginLeft: 4 }}>🔥 {habit.streak}d</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, background: 'var(--border)', borderRadius: 99, height: 4, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: pct >= 100 ? '#86efac' : 'var(--gold)', borderRadius: 99, transition: 'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>{doneCount}/{habit.target} days</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${data.weekDates.length}, 32px)`, gap: 4 }}>
                        {data.weekDates.map(date => {
                          const done = habit.completedDates.includes(date)
                          const isToday = date === today
                          const key = `${habit.id}-${date}`
                          return (
                            <button key={date} onClick={() => toggleDay(habit.id, date)} disabled={toggling === key} style={{
                              width: 30, height: 30, borderRadius: 6,
                              border: isToday ? '2px solid var(--gold)' : '1px solid var(--border)',
                              background: done ? 'var(--gold)' : 'var(--bg)',
                              cursor: 'pointer',
                              opacity: toggling === key ? 0.6 : 1,
                              fontSize: 14,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: done ? '#000' : 'var(--text2)',
                            }}>
                              {done ? '✓' : ''}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
      {modal && <NewHabitModal onSave={handleCreate} onClose={() => setModal(false)} />}
    </DashboardLayout>
  )
}
