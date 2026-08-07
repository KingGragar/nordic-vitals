import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAchievements } from '../../api/mlmApi'

function ProgressBar({ value, max, color = 'var(--gold)' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
        <span>{typeof value === 'number' && value > 999 ? `NOK ${value.toLocaleString()}` : value} / {typeof max === 'number' && max > 999 ? `NOK ${max.toLocaleString()}` : max}</span>
        <span>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

export default function Achievements() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  useEffect(() => {
    getMemberAchievements().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const allLocked = data.locked.length
  const almostDone = data.locked.filter(a => (a.progress / a.target) >= 0.75)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 4 }}>🏅 Achievements</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>Earn points by hitting milestones — they reflect your growth as a Nordic Vitals ambassador.</div>
        </div>

        {/* Points summary */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 48 }}>🎖️</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 28, color: 'var(--gold)' }}>{data.totalPoints.toLocaleString()} pts</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{data.earned.length} achievement{data.earned.length !== 1 ? 's' : ''} earned · {allLocked} still locked</div>
          </div>
          <div style={{ textAlign: 'right', minWidth: 140 }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Next potential points</div>
            <div style={{ fontWeight: 700, fontSize: 20 }}>+{data.locked.reduce((s, a) => s + a.points, 0).toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>if all unlocked</div>
          </div>
        </div>

        {/* Almost there banner */}
        {almostDone.length > 0 && (
          <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 10, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>⚡</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#93c5fd', marginBottom: 4 }}>Almost there!</div>
              <div style={{ fontSize: 13, color: '#93c5fd' }}>
                {almostDone.map(a => `${a.icon} ${a.name} (${Math.round((a.progress / a.target) * 100)}%)`).join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['all', 'All'], ['earned', `Earned (${data.earned.length})`], ['locked', `Locked (${allLocked})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ padding: '7px 18px', borderRadius: 20, border: '1px solid var(--border)', background: tab === key ? 'var(--gold)' : 'var(--bg)', color: tab === key ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: tab === key ? 700 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Earned section */}
        {(tab === 'all' || tab === 'earned') && data.earned.length > 0 && (
          <div style={{ marginBottom: tab === 'all' ? 32 : 0 }}>
            {tab === 'all' && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: '#86efac' }}>✅ Earned</div>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
              {data.earned.map(a => (
                <div key={a.id} style={{ background: 'var(--card)', border: '1px solid #166534', borderRadius: 12, padding: '18px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 36, flexShrink: 0 }}>{a.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, lineHeight: 1.4 }}>{a.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text2)' }}>🗓️ {new Date(a.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)' }}>+{a.points} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked section */}
        {(tab === 'all' || tab === 'locked') && data.locked.length > 0 && (
          <div>
            {tab === 'all' && <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--text2)' }}>🔒 Locked</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.locked.map(a => {
                const pct = Math.round((a.progress / a.target) * 100)
                const nearlyDone = pct >= 75
                return (
                  <div key={a.id} style={{ background: 'var(--card)', border: `1px solid ${nearlyDone ? '#92400e' : 'var(--border)'}`, borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div style={{ fontSize: 32, flexShrink: 0, opacity: 0.5, filter: 'grayscale(1)' }}>{a.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>+{a.points} pts</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, lineHeight: 1.4 }}>{a.desc}</div>
                      <ProgressBar value={a.progress} max={a.target} color={nearlyDone ? '#f59e0b' : '#6366f1'} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'earned' && data.earned.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏅</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No achievements yet</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>Start selling and building your team to earn your first badge.</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
