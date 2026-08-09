import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberFitnessTracker, addMemberFitnessSession } from '../../api/mlmApi'

const ACT_ICONS = { running: '🏃', cycling: '🚴', weightlifting: '🏋️', yoga: '🧘', swimming: '🏊', walking: '🚶', hiit: '⚡', other: '🏅' }
const INTENSITY_COLORS = { low: '#86efac', medium: '#fbbf24', high: '#f87171' }

export default function DashFitnessTracker() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'running', duration: '', intensity: 'medium', calories: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getMemberFitnessTracker().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!form.duration) return
    setSaving(true)
    const newEntry = { ...form, id: 'ft' + Date.now(), date: new Date().toISOString().slice(0, 10), duration: Number(form.duration), calories: Number(form.calories) || 0 }
    await addMemberFitnessSession(newEntry)
    setData(prev => ({ ...prev, sessions: [{ ...newEntry }, ...prev.sessions] }))
    setForm({ type: 'running', duration: '', intensity: 'medium', calories: '', notes: '' })
    setShowForm(false)
    setSaving(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const maxMin = Math.max(...data.weekChart.map(d => d.minutes), 1)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏋️ Fitness Tracker</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Log workouts, track weekly activity, and monitor your fitness consistency.</div>
          </div>
          <button onClick={() => setShowForm(s => !s)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            + Log Session
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Sessions This Month', value: data.stats.sessionsThisMonth,             color: '#86efac' },
            { label: 'Total Minutes',       value: `${data.stats.totalMinutes.toLocaleString()}min`, color: '#a5b4fc' },
            { label: 'Calories Burned',     value: `${data.stats.caloriesBurned.toLocaleString()}kcal`, color: '#fbbf24' },
            { label: 'Active Streak',       value: `🔥 ${data.stats.activeStreak}d`,         color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{ ...card, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Log Fitness Session</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Activity Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                  {Object.keys(ACT_ICONS).map(t => <option key={t} value={t}>{ACT_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Duration (minutes)</label>
                <input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="45"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Intensity</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['low', 'medium', 'high'].map(lvl => (
                    <button key={lvl} onClick={() => setForm(f => ({ ...f, intensity: lvl }))} style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, border: `2px solid ${form.intensity === lvl ? INTENSITY_COLORS[lvl] : 'var(--border)'}`,
                      background: form.intensity === lvl ? INTENSITY_COLORS[lvl] + '22' : 'transparent',
                      color: form.intensity === lvl ? INTENSITY_COLORS[lvl] : 'var(--text2)',
                      fontWeight: 700, cursor: 'pointer', fontSize: 12, textTransform: 'capitalize',
                    }}>{lvl}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Calories (optional)</label>
                <input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="350"
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            </div>
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes (optional)…"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box', marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} disabled={!form.duration || saving}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: form.duration ? 'var(--gold)' : 'var(--border)', color: form.duration ? '#000' : 'var(--text2)', fontWeight: 700, cursor: form.duration ? 'pointer' : 'not-allowed', fontSize: 13 }}>
                {saving ? 'Saving…' : 'Save Session'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 14 }}>This Week's Activity</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 100 }}>
            {data.weekChart.map(d => {
              const pct = Math.round((d.minutes / maxMin) * 100)
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 10, color: d.minutes ? '#86efac' : 'var(--text2)', fontWeight: 600 }}>{d.minutes ? `${d.minutes}m` : ''}</div>
                  <div style={{ width: '100%', height: 70, background: 'var(--border)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ width: '100%', height: `${pct}%`, background: d.minutes ? 'linear-gradient(180deg,#86efac,#059669)' : 'transparent', borderRadius: 6, minHeight: d.minutes ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600 }}>{d.day}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Session Log</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.sessions.map(s => (
              <div key={s.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
                <span style={{ fontSize: 26 }}>{ACT_ICONS[s.type] || '🏅'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize', marginBottom: 2 }}>{s.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.date} · {s.duration} min
                    {s.calories > 0 && ` · ${s.calories} kcal`}
                    {s.notes && ` · ${s.notes}`}
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700, background: (INTENSITY_COLORS[s.intensity] || '#888') + '22', color: INTENSITY_COLORS[s.intensity] || '#888', textTransform: 'capitalize' }}>
                  {s.intensity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
