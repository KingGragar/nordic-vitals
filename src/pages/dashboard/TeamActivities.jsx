import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamActivities } from '../../api/mlmApi'

const TYPE_COLOR = { order: '#86efac', rank: '#818cf8', recruit: '#93c5fd', milestone: '#fbbf24', challenge: '#fb923c', training: '#c4b5fd' }
const TYPE_ICON = { order: '🛒', rank: '⭐', recruit: '👋', milestone: '🏆', challenge: '💪', training: '📚' }

export default function DashTeamActivities() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    getMemberTeamActivities().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const activities = (data?.activities || []).filter(a => filter === 'all' || a.type === filter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Team Activities</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Live feed of orders, rank-ups, recruits and milestones across your team</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Team Events (7d)', value: (data?.activities || []).length, color: '#93c5fd' },
            { label: 'Active Members', value: data?.activeMembers || 0, color: '#86efac' },
            { label: 'Rank-ups (30d)', value: data?.rankUps30d || 0, color: '#818cf8' },
            { label: 'New Recruits (30d)', value: data?.recruits30d || 0, color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'order', 'rank', 'recruit', 'milestone', 'challenge', 'training'].map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: filter === t ? (TYPE_COLOR[t] || '#6366f1') : 'var(--border)', color: filter === t ? '#fff' : 'var(--text-muted)' }}>{t === 'all' ? 'All' : TYPE_ICON[t] + ' ' + t}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading team activity…</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activities.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No {filter !== 'all' ? filter : ''} activities to show.</div>
            ) : activities.map((act, i) => (
              <div key={i} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${TYPE_COLOR[act.type] || '#93c5fd'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[act.type] || '📌'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{act.memberName}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[act.type] || '#93c5fd', background: `${TYPE_COLOR[act.type] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{act.type}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{act.description}</div>
                  {act.detail && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{act.detail}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{act.timeAgo}</div>
                  {act.value && <div style={{ fontSize: 13, fontWeight: 700, color: TYPE_COLOR[act.type] || 'var(--text)', marginTop: 2 }}>{act.value}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && data?.topPerformers && (
          <div style={{ ...card, marginTop: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Top Performers This Week</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {data.topPerformers.map((p, i) => (
                <div key={i} style={{ background: 'var(--bg,#f8fafc)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', minWidth: 130, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{['🥇', '🥈', '🥉'][i] || '⭐'}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600, marginTop: 2 }}>{p.metric}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, textTransform: 'capitalize' }}>{p.category}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
