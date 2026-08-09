import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberMindfulness, logMemberMindfulnessSession } from '../../api/mlmApi'

const TYPES = ['meditation', 'breathing', 'body_scan', 'visualization', 'journaling']
const TYPE_ICONS = { meditation: '🧘', breathing: '🌬️', body_scan: '🫁', visualization: '✨', journaling: '📝' }
const DURATIONS = [5, 10, 15, 20, 30, 45]

export default function DashMindfulness() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState(null)
  const [sessionType, setSessionType] = useState('meditation')
  const [sessionDuration, setSessionDuration] = useState(10)
  const [logging, setLogging] = useState(false)

  useEffect(() => { getMemberMindfulness().then(setData).finally(() => setLoading(false)) }, [])

  async function handleComplete(mood) {
    setLogging(true)
    await logMemberMindfulnessSession({ type: activeSession, duration: sessionDuration, mood })
    setData(prev => ({
      ...prev,
      stats: { ...prev.stats, totalMinutes: prev.stats.totalMinutes + sessionDuration, streak: prev.stats.streak + 1 },
      sessions: [{ id: Date.now(), type: activeSession, duration: sessionDuration, mood, date: 'Today', notes: null }, ...prev.sessions],
    }))
    setActiveSession(null)
    setLogging(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const MOOD = ['😫', '😕', '😐', '🙂', '😊']

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧘 Mindfulness</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>Meditation, breathing, and mindfulness sessions for peak performance and recovery.</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Streak',        value: `${data.stats.streak} days`,   color: '#fbbf24' },
            { label: 'This Month',    value: `${data.stats.monthSessions} sessions`, color: '#a5b4fc' },
            { label: 'Total Minutes', value: `${data.stats.totalMinutes}`,  color: '#86efac' },
            { label: 'Avg Mood Lift', value: `+${data.stats.avgMoodLift}`,  color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {!activeSession ? (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Start a Session</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10, marginBottom: 18 }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setSessionType(t)} style={{
                  padding: '14px 10px', borderRadius: 10, border: `2px solid ${sessionType === t ? '#a5b4fc' : 'var(--border)'}`,
                  background: sessionType === t ? '#a5b4fc22' : 'var(--bg)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 24 }}>{TYPE_ICONS[t]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: sessionType === t ? '#a5b4fc' : 'var(--text)', textTransform: 'capitalize', textAlign: 'center' }}>
                    {t.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>Duration</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => setSessionDuration(d)} style={{
                    padding: '8px 16px', borderRadius: 20, border: `1px solid ${sessionDuration === d ? '#86efac' : 'var(--border)'}`,
                    background: sessionDuration === d ? '#86efac22' : 'transparent',
                    color: sessionDuration === d ? '#86efac' : 'var(--text2)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  }}>{d} min</button>
                ))}
              </div>
            </div>
            <button onClick={() => setActiveSession(sessionType)} style={{
              width: '100%', padding: '14px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #a5b4fc, #86efac)',
              color: '#000', fontWeight: 800, cursor: 'pointer', fontSize: 15,
            }}>
              {TYPE_ICONS[sessionType]} Begin {sessionDuration}-Minute {sessionType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          </div>
        ) : (
          <div style={{ ...card, textAlign: 'center', padding: '36px 24px', borderColor: '#a5b4fc' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>{TYPE_ICONS[activeSession]}</div>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Session Complete! 🎉</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 28 }}>
              {sessionDuration}-minute {activeSession.replace('_', ' ')} · How are you feeling?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 }}>
              {MOOD.map((m, i) => (
                <button key={i} onClick={() => handleComplete(i + 1)} disabled={logging} style={{
                  fontSize: 32, background: 'none', border: '2px solid var(--border)', borderRadius: 50,
                  width: 56, height: 56, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{m}</button>
              ))}
            </div>
            <button onClick={() => setActiveSession(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 13, cursor: 'pointer' }}>Skip mood check</button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Session History</div>
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {data.sessions.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 22 }}>{TYPE_ICONS[s.type]}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{s.type.replace('_', ' ')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.duration} min · {s.date}</div>
                  </div>
                  <span style={{ fontSize: 20 }}>{s.mood ? MOOD[s.mood - 1] : '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Mood After Sessions</div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 14 }}>Average post-session mood by type</div>
            {data.moodByType.map(m => (
              <div key={m.type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 18 }}>{TYPE_ICONS[m.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'capitalize' }}>{m.type.replace('_', ' ')}</div>
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 4 }}>
                    <div style={{ width: `${(m.avg / 5) * 100}%`, height: '100%', background: '#a5b4fc', borderRadius: 2 }} />
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#a5b4fc' }}>{m.avg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
