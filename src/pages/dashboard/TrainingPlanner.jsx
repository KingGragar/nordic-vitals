import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTrainingPlanner, registerMemberTraining } from '../../api/mlmApi'

const TYPE_COLOR = { webinar: '#93c5fd', video: '#86efac', live: '#fbbf24' }
const TYPE_ICON  = { webinar: '💻', video: '▶️', live: '🎤' }

export default function DashTrainingPlanner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [registering, setRegistering] = useState(null)

  useEffect(() => {
    getMemberTrainingPlanner().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleRegister(id) {
    setRegistering(id)
    await registerMemberTraining(id)
    setData(prev => ({
      ...prev,
      upcoming: prev.upcoming.map(s => s.id === id ? { ...s, registered: true } : s)
    }))
    setRegistering(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn  = (bg, fg = '#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Training Planner</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Schedule sessions and track your learning journey</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Streak', value: loading ? '…' : `${data?.streakDays ?? 0} days`, color: '#fbbf24' },
            { label: 'Hours Completed', value: loading ? '…' : `${data?.totalHours ?? 0}h`, color: '#86efac' },
            { label: 'Upcoming Sessions', value: loading ? '…' : (data?.upcoming?.length ?? 0), color: '#93c5fd' },
            { label: 'Past Completed', value: loading ? '…' : (data?.past?.length ?? 0), color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {['upcoming','past'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', border: 'none', background: 'transparent', color: tab === t ? '#818cf8' : 'var(--text-muted)', fontWeight: tab === t ? 700 : 400, cursor: 'pointer', fontSize: 14, borderBottom: tab === t ? '2px solid #818cf8' : '2px solid transparent', textTransform: 'capitalize', marginBottom: -1 }}>
              {t === 'upcoming' ? 'Upcoming' : 'Completed'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ ...card, textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>Loading…</div>
        ) : tab === 'upcoming' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.upcoming || []).map(s => (
              <div key={s.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: `${TYPE_COLOR[s.type]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  {TYPE_ICON[s.type]}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, background: 'rgba(0,0,0,.2)', color: TYPE_COLOR[s.type], borderRadius: 5, padding: '2px 8px' }}>{s.type}</span>
                    {s.registered && <span style={{ fontSize: 12, background: 'rgba(34,197,94,.15)', color: '#86efac', borderRadius: 5, padding: '2px 8px' }}>✓ Registered</span>}
                  </div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{s.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Host: {s.host}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                    📅 {new Date(s.date).toLocaleString()} · ⏱ {s.duration} min
                    {s.seats && <> · 👥 {s.enrolled}/{s.seats} seats</>}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {s.registered ? (
                    <span style={{ padding: '8px 16px', borderRadius: 7, background: 'rgba(34,197,94,.15)', color: '#86efac', fontSize: 13, fontWeight: 600 }}>Registered</span>
                  ) : (
                    <button style={btn('#6366f1')} onClick={() => handleRegister(s.id)} disabled={registering === s.id}>
                      {registering === s.id ? 'Registering…' : 'Register'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(data?.upcoming || []).length === 0 && <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>No upcoming sessions.</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.past || []).map(s => (
              <div key={s.id} style={{ ...card, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(34,197,94,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>✅</div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700 }}>{s.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Host: {s.host} · {new Date(s.date).toLocaleDateString()} · {s.duration} min</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.score >= 90 ? '#86efac' : s.score >= 70 ? '#fbbf24' : '#f87171' }}>{s.score}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                </div>
              </div>
            ))}
            {(data?.past || []).length === 0 && <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>No completed sessions yet.</div>}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
