import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminGamification, toggleAdminGamificationRule } from '../../api/mlmApi'

export default function AdminGamification() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminGamification().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function toggle(rule) {
    setToggling(rule.id)
    await toggleAdminGamificationRule(rule.id, !rule.active)
    setData(prev => ({
      ...prev,
      pointsRules: prev.pointsRules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r),
    }))
    setToggling(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎮 Gamification</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Badge categories, XP point rules, challenge templates, and leaderboard config.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { label: 'Active Badges',    value: data.stats.activeBadges,                       color: '#fbbf24' },
            { label: 'Active Rules',     value: data.stats.activeRules,                        color: '#86efac' },
            { label: 'Challenges Live',  value: data.stats.challengesRunning,                  color: '#a5b4fc' },
            { label: 'Total XP Awarded', value: data.stats.totalXPAwarded.toLocaleString(),    color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>XP Points Rules</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.pointsRules.map(rule => (
                <div key={rule.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{rule.event}</div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#fbbf24', minWidth: 50, textAlign: 'right' }}>+{rule.points}</span>
                  <button
                    disabled={toggling === rule.id}
                    onClick={() => toggle(rule)}
                    style={{
                      padding: '4px 14px', borderRadius: 20, border: `1px solid ${rule.active ? '#166534' : 'var(--border)'}`,
                      background: rule.active ? '#052e16' : 'var(--bg)',
                      color: rule.active ? '#86efac' : 'var(--text2)',
                      fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap',
                    }}
                  >
                    {toggling === rule.id ? '…' : rule.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Badge Categories</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {data.badgeCategories.map(cat => (
                <div key={cat.id} style={{ ...card, borderLeft: `4px solid ${cat.color}` }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: cat.color }}>{cat.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{cat.badges} badges</div>
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, marginBottom: 12 }}>Leaderboard Config</div>
            <div style={card}>
              {[
                { label: 'Period',    value: data.leaderboardConfig.period },
                { label: 'Metric',   value: data.leaderboardConfig.metric.toUpperCase() },
                { label: 'Top N',    value: data.leaderboardConfig.topN },
                { label: 'Reset Day', value: `Day ${data.leaderboardConfig.resetDay} of month` },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text2)', fontSize: 13 }}>{row.label}</span>
                  <span style={{ fontWeight: 700, fontSize: 13, textTransform: 'capitalize' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
