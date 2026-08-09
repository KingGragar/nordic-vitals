import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberMoodJournal, addMemberMoodEntry } from '../../api/mlmApi'

const MOODS = [
  { score: 1, emoji: '😫', label: 'Terrible' },
  { score: 2, emoji: '😕', label: 'Bad' },
  { score: 3, emoji: '😐', label: 'Neutral' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😊', label: 'Great' },
]
const ENERGY = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
const FACTORS = ['exercise', 'nutrition', 'sleep', 'work', 'social', 'products', 'stress']
const MOOD_COLORS = { 1: '#ef4444', 2: '#f97316', 3: '#fbbf24', 4: '#86efac', 5: '#34d399' }

export default function DashMoodJournal() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMood, setSelectedMood] = useState(null)
  const [energy, setEnergy] = useState(2)
  const [note, setNote] = useState('')
  const [factors, setFactors] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { getMemberMoodJournal().then(setData).finally(() => setLoading(false)) }, [])

  function toggleFactor(f) {
    setFactors(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function handleSave() {
    if (!selectedMood) return
    setSaving(true)
    await addMemberMoodEntry({ mood: selectedMood, energy: energy + 1, factors, note })
    setData(prev => ({
      ...prev,
      entries: [{ id: Date.now(), date: 'Today', mood: selectedMood, energy: energy + 1, factors, note }, ...prev.entries],
      stats: { ...prev.stats, avgMood: ((prev.stats.avgMood * 30 + selectedMood) / 31).toFixed(1) },
    }))
    setSelectedMood(null); setEnergy(2); setNote(''); setFactors([])
    setSaving(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const days = data.entries.slice(0, 14).map(e => ({ date: e.date, mood: e.mood })).reverse()
  const maxDay = 5

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📔 Mood Journal</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Track your daily mood and energy to spot patterns and optimize your wellbeing.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Avg Mood (30d)', value: `${data.stats.avgMood}/5`,   color: '#fbbf24' },
            { label: 'Best Factor',   value: data.stats.bestFactor,         color: '#86efac' },
            { label: 'Entries',       value: data.stats.totalEntries,        color: '#a5b4fc' },
            { label: 'Mood Trend',    value: data.stats.trend,               color: data.stats.trend.startsWith('+') ? '#86efac' : '#ef4444' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Log Today's Mood</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
            {MOODS.map(m => (
              <button key={m.score} onClick={() => setSelectedMood(m.score)} style={{
                flex: 1, minWidth: 80, padding: '12px 8px', borderRadius: 10,
                border: `2px solid ${selectedMood === m.score ? MOOD_COLORS[m.score] : 'var(--border)'}`,
                background: selectedMood === m.score ? MOOD_COLORS[m.score] + '22' : 'var(--bg)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}>
                <span style={{ fontSize: 28 }}>{m.emoji}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: selectedMood === m.score ? MOOD_COLORS[m.score] : 'var(--text2)' }}>{m.label}</span>
              </button>
            ))}
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Energy Level: <strong style={{ color: 'var(--text)' }}>{ENERGY[energy]}</strong></div>
            <input type="range" min={0} max={4} value={energy} onChange={e => setEnergy(Number(e.target.value))} style={{ width: '100%', accentColor: '#86efac' }} />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Key Factors</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {FACTORS.map(f => (
                <button key={f} onClick={() => toggleFactor(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: `1px solid ${factors.includes(f) ? '#a5b4fc' : 'var(--border)'}`,
                  background: factors.includes(f) ? '#a5b4fc22' : 'transparent',
                  color: factors.includes(f) ? '#a5b4fc' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
                }}>{f}</button>
              ))}
            </div>
          </div>

          <textarea
            value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note… (optional)"
            rows={2}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
          />

          <button onClick={handleSave} disabled={!selectedMood || saving} style={{
            width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
            background: selectedMood ? MOOD_COLORS[selectedMood] : 'var(--border)',
            color: '#000', fontWeight: 800, cursor: selectedMood ? 'pointer' : 'default', fontSize: 14,
          }}>
            {saving ? 'Saving…' : `Save Entry ${selectedMood ? MOODS[selectedMood - 1].emoji : ''}`}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>14-Day Mood Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
              {days.map((d, i) => (
                <div key={i} title={`${d.date}: ${d.mood}/5`} style={{
                  flex: 1, height: `${(d.mood / maxDay) * 80}px`,
                  background: MOOD_COLORS[d.mood] || '#888',
                  borderRadius: '3px 3px 0 0',
                  minHeight: 8,
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text2)', marginTop: 4 }}>
              <span>14 days ago</span><span>Today</span>
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Factor Impact</div>
            {data.factorCorrelation.map(f => (
              <div key={f.factor} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 1, fontSize: 13, textTransform: 'capitalize' }}>{f.factor}</span>
                <div style={{ width: 80, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ width: `${(f.avgMood / 5) * 100}%`, height: '100%', background: MOOD_COLORS[Math.round(f.avgMood)] || '#888', borderRadius: 3 }} />
                </div>
                <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700, color: MOOD_COLORS[Math.round(f.avgMood)] || '#888' }}>{f.avgMood}</span>
              </div>
            ))}
          </div>

          <div style={{ ...card, gridColumn: '1 / -1' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Recent Entries</div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {data.entries.slice(0, 10).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{MOODS.find(m => m.score === e.mood)?.emoji || '😐'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      {e.factors.map(f => (
                        <span key={f} style={{ padding: '1px 8px', borderRadius: 10, background: 'var(--border)', fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize' }}>{f}</span>
                      ))}
                    </div>
                    {e.note && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{e.note}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text2)', flexShrink: 0 }}>{e.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
