import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamGoals } from '../../api/mlmApi'

const STATUS_STYLE = {
  on_track:  { color: '#22c55e', bg: '#052e16', label: '✅ On Track' },
  behind:    { color: '#f59e0b', bg: '#422006', label: '⚠️ Behind' },
  completed: { color: '#60a5fa', bg: '#1e3a5f', label: '🏆 Completed' },
  at_risk:   { color: '#ef4444', bg: '#2d0f0f', label: '🚨 At Risk' },
}

const METRIC_ICON = { new_members: '👥', team_volume: '💰', rank_ups: '🏅', retention: '📊', training: '🎓' }

function fmt(val, unit) {
  if (unit === 'NOK') return 'NOK ' + val.toLocaleString()
  if (unit === '%') return val + '%'
  return val.toLocaleString()
}

function GoalCard({ goal }) {
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100))
  const st = STATUS_STYLE[goal.status] || STATUS_STYLE.behind
  const daysLeft = Math.max(0, Math.ceil((new Date(goal.deadline) - Date.now()) / 86400000))

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 22 }}>{METRIC_ICON[goal.metric] || '🎯'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{goal.title}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Deadline: {new Date(goal.deadline).toLocaleDateString()} · {goal.status !== 'completed' ? `${daysLeft}d left` : 'Done'}</div>
          </div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: 'var(--text2)' }}>Progress</span>
        <span style={{ fontWeight: 700 }}>{fmt(goal.current, goal.unit)} / {fmt(goal.target, goal.unit)}</span>
      </div>
      <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: goal.status === 'completed' ? '#60a5fa' : goal.status === 'on_track' ? '#22c55e' : '#f59e0b', borderRadius: 4, transition: 'width 0.4s' }} />
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>{pct}%</div>
    </div>
  )
}

export default function MemberTeamGoals() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMemberTeamGoals().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Failed to load team goals.</div></DashboardLayout>

  const { teamName, goals, topContributors } = data
  const completed = goals.filter(g => g.status === 'completed').length
  const onTrack = goals.filter(g => g.status === 'on_track').length
  const behind = goals.filter(g => g.status === 'behind' || g.status === 'at_risk').length
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, margin: 0 }}>🏆 Team Goals</h1>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{teamName} · collective targets and progress</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
          {[['🎯', 'Total Goals', goals.length, 'var(--text)'], ['✅', 'On Track', onTrack, '#22c55e'], ['⚠️', 'Behind', behind, '#f59e0b'], ['🏆', 'Completed', completed, '#60a5fa']].map(([icon, label, val, color]) => (
            <div key={label} style={card}>
              <div style={{ fontSize: 20 }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 24, color, marginTop: 4 }}>{val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Active Goals</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {goals.filter(g => g.status !== 'completed').map(g => <GoalCard key={g.id} goal={g} />)}
          {goals.filter(g => g.status !== 'completed').length === 0 && (
            <div style={{ ...card, textAlign: 'center', padding: 40, color: 'var(--text2)' }}>All goals completed! 🎉</div>
          )}
        </div>

        {goals.some(g => g.status === 'completed') && (
          <>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Completed Goals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {goals.filter(g => g.status === 'completed').map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </>
        )}

        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Top Contributors This Period</div>
        <div style={{ ...card, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {['#', 'Member', 'Rank', 'Recruits', 'Volume'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: h === '#' ? 'center' : 'left', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topContributors.map((c, i) => (
                <tr key={c.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : 'var(--text2)' }}>{i + 1}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: '12px' }}><span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)' }}>{c.rank}</span></td>
                  <td style={{ padding: '12px', color: '#22c55e', fontWeight: 600 }}>+{c.recruits}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>NOK {c.volume.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
