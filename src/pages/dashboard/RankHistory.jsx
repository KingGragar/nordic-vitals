import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberRankHistory } from '../../api/mlmApi'

const RANK_COLOR = {
  Bronze:   { color: '#cd7f32', bg: '#2d1500' },
  Silver:   { color: '#c0c0c0', bg: '#1c1c1c' },
  Gold:     { color: '#fbbf24', bg: '#2d1b00' },
  Platinum: { color: '#e2e8f0', bg: '#1e293b' },
  Diamond:  { color: '#67e8f9', bg: '#083344' },
}

function RankBadge({ rank, small }) {
  const style = RANK_COLOR[rank] || { color: '#9ca3af', bg: '#1c1c1c' }
  return (
    <span style={{
      padding: small ? '2px 8px' : '4px 12px',
      borderRadius: 20,
      fontSize: small ? 11 : 13,
      fontWeight: 700,
      background: style.bg,
      color: style.color,
      display: 'inline-block',
    }}>
      {rank}
    </span>
  )
}

export default function MemberRankHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMemberRankHistory().then(setData).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Failed to load rank history.</div></DashboardLayout>

  const { currentRank, currentPoints, nextRank, nextPoints, history, milestones } = data
  const progressPct = Math.min(100, Math.round((currentPoints / nextPoints) * 100))
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '18px 20px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📈 Rank History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Your rank progression over time — commissions, recruits, and key milestones.</div>
        </div>

        {/* Current rank + progress to next */}
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Current Rank</div>
              <RankBadge rank={currentRank} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Points to {nextRank}</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{(nextPoints - currentPoints).toLocaleString()} pts needed</div>
            </div>
          </div>
          <div style={{ height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--gold)', borderRadius: 5, transition: 'width 0.5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
            <span>{currentPoints.toLocaleString()} pts</span>
            <span>{progressPct}% to {nextRank} ({nextPoints.toLocaleString()} pts)</span>
          </div>
        </div>

        {/* Milestones */}
        {milestones && milestones.length > 0 && (
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>🏅 Key Milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{m.event}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly history table */}
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>📅 Monthly Breakdown</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>Month</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600 }}>Rank</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600 }}>Points</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600 }}>Commissions (NOK)</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', fontWeight: 600 }}>Recruits</th>
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((h, i) => {
                  const [year, mon] = h.month.split('-')
                  const label = new Date(parseInt(year), parseInt(mon) - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
                  const prevRank = history[history.length - 2 - i]?.rank
                  const rankChanged = i < history.length - 1 && h.rank !== prevRank
                  return (
                    <tr key={h.month} style={{ borderBottom: '1px solid var(--border)', background: rankChanged ? 'rgba(251,191,36,0.04)' : 'transparent' }}>
                      <td style={{ padding: '10px 10px', fontWeight: 500 }}>{label}</td>
                      <td style={{ padding: '10px 10px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <RankBadge rank={h.rank} small />
                          {rankChanged && <span style={{ fontSize: 10, color: '#fbbf24' }}>▲ promoted</span>}
                        </span>
                      </td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 600 }}>{h.points.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right', color: '#22c55e' }}>+{h.commissions.toLocaleString()}</td>
                      <td style={{ padding: '10px 10px', textAlign: 'right' }}>{h.recruits > 0 ? `+${h.recruits}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
