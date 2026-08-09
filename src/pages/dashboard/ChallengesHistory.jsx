import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberChallengesHistory } from '../../api/mlmApi'

const TYPE_ICONS = { recruitment: '👥', sales: '💰', wellness: '💪', social: '📣', training: '📚' }
const RESULT_STYLES = {
  won:          { bg: '#052e16', color: '#86efac', border: '#166534', label: '🏆 Won' },
  active:       { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3', label: '🔵 Active' },
  participated: { bg: '#1c1917', color: '#fbbf24', border: '#92400e', label: '✓ Participated' },
  missed:       { bg: '#18181b', color: '#71717a', border: '#3f3f46', label: '✗ Missed' },
}

export default function DashChallengesHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMemberChallengesHistory().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const filtered = filter === 'all' ? data.history : data.history.filter(c => c.result === filter || c.type === filter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏆 Challenges History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>All past and active challenges — your results, ranks, and prizes earned.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Participated',  value: data.stats.participated,     color: '#a5b4fc' },
            { label: 'Won',           value: data.stats.won,               color: '#86efac' },
            { label: 'Prize Value',   value: data.stats.totalPrizeValue,   color: '#fbbf24' },
            { label: 'Win Streak',    value: `${data.stats.currentStreak}`, color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'active', 'won', 'participated', 'missed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(c => {
            const rs = RESULT_STYLES[c.result] || RESULT_STYLES.participated
            return (
              <div key={c.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 24 }}>{TYPE_ICONS[c.type] || '🎯'}</span>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{c.title}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{c.startDate} → {c.endDate} · {c.participants} participants</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}`, borderRadius: 20, padding: '3px 12px', whiteSpace: 'nowrap' }}>
                    {rs.label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                  {c.rank && (
                    <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
                      {c.rank === 1 ? '🥇' : c.rank === 2 ? '🥈' : c.rank === 3 ? '🥉' : `#${c.rank}`} Rank
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: '#86efac' }}>🎁 {c.prize}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
