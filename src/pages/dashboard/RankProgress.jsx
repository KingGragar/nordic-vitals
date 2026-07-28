import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getRankProgress } from '../../api/mlmApi'

const RANKS = [
  { name: 'Unranked', icon: '⬜', color: '#64748b' },
  { name: 'Bronze',   icon: '🥉', color: '#b45309' },
  { name: 'Silver',   icon: '🥈', color: '#6b7280' },
  { name: 'Gold',     icon: '🥇', color: '#d97706' },
  { name: 'Platinum', icon: '💎', color: '#7c3aed' },
]

const RANK_REQS = {
  Unranked: { min_pv: 0,    min_left_gv: 0,     min_right_gv: 0,     active_recruits: 0 },
  Bronze:   { min_pv: 100,  min_left_gv: 500,   min_right_gv: 500,   active_recruits: 1 },
  Silver:   { min_pv: 300,  min_left_gv: 2000,  min_right_gv: 2000,  active_recruits: 3 },
  Gold:     { min_pv: 500,  min_left_gv: 5000,  min_right_gv: 5000,  active_recruits: 5 },
  Platinum: { min_pv: 1000, min_left_gv: 15000, min_right_gv: 15000, active_recruits: 10 },
}

const RANK_PERKS = {
  Unranked: [],
  Bronze:   ['5% commission on level 1', 'Access to member shop discounts', 'Nordic Vitals starter kit'],
  Silver:   ['8% commission on levels 1–2', 'Monthly product allowance (NOK 200)', 'Priority customer support'],
  Gold:     ['10% commission on levels 1–3', 'Monthly product allowance (NOK 500)', 'Quarterly bonus pool entry', 'Gold leadership calls'],
  Platinum: ['12% commission on levels 1–4', 'Monthly product allowance (NOK 1 500)', 'Annual retreat invitation', 'Platinum mentorship program', 'Governance voting rights'],
}

const RANK_TIPS = {
  Bronze:   ['Place your first order to generate personal PV', 'Recruit one active member to your team', 'Focus on building volume on either leg first'],
  Silver:   ['Increase monthly PV to at least 300 (one order of NOK ~900+)', 'Help your recruits become active to grow both legs', 'Aim for balanced GV across left and right legs'],
  Gold:     ['Set up an autoship to maintain consistent personal PV', 'Coach your Bronze/Silver members to rank up', 'Focus on building your weaker leg to reach 5 000 GV on both sides'],
  Platinum: ['Develop at least 10 active first-line recruits', 'Coach Gold members to keep rank volume above 15 000 GV per leg', 'Use the Commission Calculator to forecast breakaway bonuses'],
}

function fmt(n) { return n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n) }

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 100
  const done = pct >= 100
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>
        <span>{fmt(value)} / {fmt(max)}</span>
        <span style={{ color: done ? '#4ade80' : color }}>{done ? '✓ Met' : `${Math.round(pct)}%`}</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: done ? '#4ade80' : color,
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function RankBadge({ rank, size = 'md', active = false }) {
  const cfg = RANKS.find(r => r.name === rank) || RANKS[0]
  const sz = size === 'lg' ? 56 : size === 'sm' ? 28 : 40
  return (
    <div style={{
      width: sz, height: sz, borderRadius: sz / 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: sz * 0.55,
      background: active ? `${cfg.color}30` : 'rgba(255,255,255,0.06)',
      border: `2px solid ${active ? cfg.color : 'rgba(255,255,255,0.1)'}`,
      boxShadow: active ? `0 0 12px ${cfg.color}50` : 'none',
      flexShrink: 0,
    }}>
      {cfg.icon}
    </div>
  )
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)' }}>{sub}</div>}
    </div>
  )
}

export default function RankProgress() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getRankProgress(user.userId).then(d => { setData(d); setLoading(false) })
  }, [user])

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text2)' }}>
          Loading rank data…
        </div>
      </DashboardLayout>
    )
  }

  const { currentRank, pv, leftGV, rightGV, activeRecruits, daysAtRank, history } = data

  const rankIdx = RANKS.findIndex(r => r.name === currentRank)
  const nextRank = rankIdx >= 0 && rankIdx < RANKS.length - 1 ? RANKS[rankIdx + 1] : null
  const currentColor = (RANKS.find(r => r.name === currentRank) || RANKS[0]).color
  const nextReqs = nextRank ? RANK_REQS[nextRank.name] : null

  const pvPct     = nextReqs ? Math.min(100, (pv / nextReqs.min_pv) * 100) : 100
  const lGvPct    = nextReqs ? Math.min(100, (leftGV / nextReqs.min_left_gv) * 100) : 100
  const rGvPct    = nextReqs ? Math.min(100, (rightGV / nextReqs.min_right_gv) * 100) : 100
  const recPct    = nextReqs ? Math.min(100, (activeRecruits / nextReqs.active_recruits) * 100) : 100
  const overallPct = nextReqs ? Math.round((pvPct + lGvPct + rGvPct + recPct) / 4) : 100

  const tips = nextRank ? RANK_TIPS[nextRank.name] || [] : []
  const perks = RANK_PERKS[currentRank] || []

  function estimatedDays() {
    if (!nextReqs) return null
    const pvGap  = Math.max(0, nextReqs.min_pv - pv)
    const lgvGap = Math.max(0, nextReqs.min_left_gv  - leftGV)
    const rgvGap = Math.max(0, nextReqs.min_right_gv - rightGV)
    if (pvGap === 0 && lgvGap === 0 && rgvGap === 0) return 'All volume targets met!'
    const monthlyPV  = Math.round(pv * 0.9)
    const monthlyGV  = Math.round((leftGV + rightGV) * 0.15)
    const pvMonths   = monthlyPV  > 0 ? pvGap / monthlyPV  : 99
    const lgvMonths  = monthlyGV > 0 ? lgvGap / (monthlyGV * 0.5) : 99
    const rgvMonths  = monthlyGV > 0 ? rgvGap / (monthlyGV * 0.5) : 99
    const months = Math.ceil(Math.max(pvMonths, lgvMonths, rgvMonths))
    if (months <= 0) return 'Ready now!'
    if (months === 1) return '~1 month'
    if (months <= 12) return `~${months} months`
    return `~${Math.round(months / 12)} year${months > 24 ? 's' : ''}`
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 40px' }}>

        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📊 Rank Progress</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 14 }}>
            Track your advancement toward the next rank and see what's needed.
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          <StatCard label="Current Rank" value={`${(RANKS.find(r => r.name === currentRank) || RANKS[0]).icon} ${currentRank}`} color={currentColor} />
          <StatCard label="Next Rank" value={nextRank ? `${nextRank.icon} ${nextRank.name}` : '🏆 Max Rank'} color={nextRank?.color} />
          <StatCard label="Overall Progress" value={`${overallPct}%`} sub={nextRank ? `to ${nextRank.name}` : 'Platinum achieved'} color={overallPct >= 100 ? '#4ade80' : currentColor} />
          <StatCard label="Days at Rank" value={daysAtRank} sub="at current rank" />
          <StatCard label="Est. Time to Next" value={nextRank ? estimatedDays() : '—'} sub="based on current growth" />
        </div>

        {/* Rank Ladder */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px', color: 'var(--text)' }}>Rank Ladder</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
            {RANKS.map((r, i) => {
              const isCurrent = r.name === currentRank
              const isPast    = i < rankIdx
              const isNext    = nextRank && r.name === nextRank.name
              return (
                <div key={r.name} style={{ display: 'flex', alignItems: 'center', flex: i < RANKS.length - 1 ? '1 1 0' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 72 }}>
                    <RankBadge rank={r.name} size={isCurrent ? 'lg' : 'md'} active={isCurrent || isPast} />
                    <div style={{
                      fontSize: 11, fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? r.color : isPast ? '#4ade80' : 'var(--text2)',
                      textAlign: 'center', whiteSpace: 'nowrap',
                    }}>
                      {r.name}
                      {isCurrent && <div style={{ fontSize: 9, color: r.color, marginTop: 2 }}>← YOU</div>}
                      {isPast && <div style={{ fontSize: 9, color: '#4ade80', marginTop: 2 }}>✓</div>}
                      {isNext && <div style={{ fontSize: 9, color: r.color, marginTop: 2 }}>NEXT</div>}
                    </div>
                  </div>
                  {i < RANKS.length - 1 && (
                    <div style={{
                      flex: 1, height: 3, margin: '0 4px', marginTop: -16,
                      background: isPast ? '#4ade8080' : 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Progress to next rank */}
          {nextRank && (
            <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>
                Progress to {nextRank.icon} {nextRank.name}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Personal Volume (PV)</div>
                  <ProgressBar value={pv} max={nextReqs.min_pv} color={nextRank.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Left Leg GV</div>
                  <ProgressBar value={leftGV} max={nextReqs.min_left_gv} color={nextRank.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Right Leg GV</div>
                  <ProgressBar value={rightGV} max={nextReqs.min_right_gv} color={nextRank.color} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Active Recruits</div>
                  <ProgressBar value={activeRecruits} max={nextReqs.active_recruits} color={nextRank.color} />
                </div>
              </div>
            </div>
          )}

          {!nextRank && (
            <div style={{ background: 'var(--navy2)', border: '1px solid #7c3aed44', borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10 }}>
              <div style={{ fontSize: 48 }}>💎</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>Platinum Achieved!</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>You have reached the highest rank in Nordic Vitals. Thank you for your leadership!</div>
            </div>
          )}

          {/* Current rank perks */}
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>
              {(RANKS.find(r => r.name === currentRank) || RANKS[0]).icon} {currentRank} Perks
            </h2>
            {perks.length > 0 ? (
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {perks.map((p, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>Complete your first order to unlock rank perks.</div>
            )}
          </div>
        </div>

        {/* Tips for next rank */}
        {nextRank && tips.length > 0 && (
          <div style={{
            background: `${nextRank.color}10`,
            border: `1px solid ${nextRank.color}40`,
            borderRadius: 14, padding: '18px 22px', marginBottom: 24,
          }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: nextRank.color }}>
              💡 Tips to reach {nextRank.name}
            </h2>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tips.map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text)' }}>
                  <span style={{ color: nextRank.color, fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* All rank requirements table */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 24, overflowX: 'auto' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>All Rank Requirements</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Rank', 'Min PV', 'Left Leg GV', 'Right Leg GV', 'Active Recruits'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RANKS.slice(1).map(r => {
                const req = RANK_REQS[r.name]
                const isCurrent = r.name === currentRank
                const isNext    = nextRank && r.name === nextRank.name
                return (
                  <tr key={r.name} style={{
                    borderBottom: '1px solid var(--border)',
                    background: isCurrent ? `${r.color}12` : 'transparent',
                  }}>
                    <td style={{ padding: '10px 10px', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? r.color : 'var(--text)', whiteSpace: 'nowrap' }}>
                      {r.icon} {r.name}
                      {isCurrent && <span style={{ fontSize: 10, marginLeft: 6, color: r.color }}>← current</span>}
                      {isNext    && <span style={{ fontSize: 10, marginLeft: 6, color: r.color }}>← next</span>}
                    </td>
                    <td style={{ padding: '10px 10px', color: isCurrent || (req && pv >= req.min_pv) ? '#4ade80' : 'var(--text)' }}>{fmt(req.min_pv)}</td>
                    <td style={{ padding: '10px 10px', color: isCurrent || (req && leftGV >= req.min_left_gv) ? '#4ade80' : 'var(--text)' }}>{fmt(req.min_left_gv)}</td>
                    <td style={{ padding: '10px 10px', color: isCurrent || (req && rightGV >= req.min_right_gv) ? '#4ade80' : 'var(--text)' }}>{fmt(req.min_right_gv)}</td>
                    <td style={{ padding: '10px 10px', color: isCurrent || (req && activeRecruits >= req.active_recruits) ? '#4ade80' : 'var(--text)' }}>{req.active_recruits}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Rank history */}
        {history && history.length > 0 && (
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px' }}>Rank History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {history.map((entry, i) => {
                const cfg = RANKS.find(r => r.name === entry.rank) || RANKS[0]
                return (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <RankBadge rank={entry.rank} size="sm" active={i === 0} />
                      {i < history.length - 1 && (
                        <div style={{ width: 2, flex: 1, minHeight: 28, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                      )}
                    </div>
                    <div style={{ paddingBottom: i < history.length - 1 ? 20 : 0, paddingTop: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{entry.rank}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        {new Date(entry.achievedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
                        {entry.note && <span style={{ marginLeft: 8 }}>— {entry.note}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
