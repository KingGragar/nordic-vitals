import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMemberForecast } from '../../api/mlmApi'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

const RANK_COLORS = { Unranked: '#9ca3af', Bronze: '#cd7f32', Silver: '#94a3b8', Gold: '#c9a84c', Platinum: '#6366f1' }

function KPICard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 22px',
      borderLeft: `4px solid ${accent || '#c9a84c'}`,
    }}>
      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ProgressBar({ label, pct, need, unit, color = '#c9a84c' }) {
  const safe = Math.min(100, pct)
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#e5e7eb' }}>{label}</span>
        <span style={{ fontSize: 12, color: safe >= 100 ? '#22c55e' : '#9ca3af' }}>
          {safe >= 100 ? '✅ Met' : `${safe}% — need ${need} more ${unit}`}
        </span>
      </div>
      <div style={{ background: '#2a2a2a', borderRadius: 4, height: 8 }}>
        <div style={{ width: `${safe}%`, background: safe >= 100 ? '#22c55e' : color, height: 8, borderRadius: 4, transition: 'width .4s' }} />
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: '#9ca3af', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value?.toLocaleString()} MLMT</strong>
        </div>
      ))}
    </div>
  )
}

export default function Forecast() {
  const { user } = useAuth()
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [recruits, setRecruits] = useState(null)
  const [horizon]               = useState(6)

  async function load(rpm) {
    setLoading(true)
    try {
      const res = await getMemberForecast(user?.userId, { horizon, recruitsPerMonth: rpm })
      setData(res)
      if (rpm == null) setRecruits(res.defaultRecruits)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(null) }, [user?.userId])

  function handleRecruitChange(e) {
    const val = Number(e.target.value)
    setRecruits(val)
    load(val)
  }

  if (loading && !data) return (
    <DashboardLayout>
      <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading forecast…</div>
    </DashboardLayout>
  )

  const { months, nextMonthEarnings, sixMonthTotal, progressToNext, currentRank, nextRank,
          currentPV, currentGV, currentRecruits, actions } = data || {}

  const nextMonthCurrent = nextMonthEarnings?.current ?? 0
  const sixMonthCurrent  = sixMonthTotal?.current ?? 0
  const sixMonthAccel    = sixMonthTotal?.accelerated ?? 0

  const rankUpCurrent     = progressToNext?.rankUpMonthCurrent
  const rankUpAccelerated = progressToNext?.rankUpMonthAccelerated

  const chartData = months?.map(m => ({
    month:       m.month,
    Current:     m.projected ? m.current     : m.commission ?? m.current,
    Accelerated: m.projected ? m.accelerated : m.commission ?? m.accelerated,
    actual:      !m.projected,
  }))

  // Find first projected month index for the reference line
  const splitIdx = months?.findIndex(m => m.projected)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>📈 Earnings Forecast</h1>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: 14 }}>
            Based on your current activity — last 3 months actual + {horizon}-month projection.
          </p>
        </div>

        {/* Current rank badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: RANK_COLORS[currentRank] + '22', color: RANK_COLORS[currentRank],
            border: `1px solid ${RANK_COLORS[currentRank]}44`,
          }}>
            {currentRank} Member
          </div>
          {nextRank && nextRank !== currentRank && (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>
              → targeting <span style={{ color: RANK_COLORS[nextRank] }}>{nextRank}</span>
            </div>
          )}
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 28 }}>
          <KPICard
            label="Next Month (Current Pace)"
            value={`${nextMonthCurrent.toLocaleString()} MLMT`}
            sub="Projected commission earnings"
            accent="#3b82f6"
          />
          <KPICard
            label={`${horizon}-Month Total (Current Pace)`}
            value={`${sixMonthCurrent.toLocaleString()} MLMT`}
            sub="Cumulative projection"
            accent="#c9a84c"
          />
          <KPICard
            label={`${horizon}-Month Total (Accelerated)`}
            value={`${sixMonthAccel.toLocaleString()} MLMT`}
            sub={`+${Math.round((sixMonthAccel / Math.max(sixMonthCurrent, 1) - 1) * 100)}% vs current pace`}
            accent="#22c55e"
          />
          <KPICard
            label="Rank-Up Estimate"
            value={rankUpCurrent ? `~${rankUpCurrent}` : currentRank === 'Platinum' ? 'Max Rank ✅' : 'Beyond 6 months'}
            sub={rankUpAccelerated && rankUpAccelerated !== rankUpCurrent ? `Accelerated: ~${rankUpAccelerated}` : 'at current pace'}
            accent={RANK_COLORS[nextRank] || '#9ca3af'}
          />
        </div>

        {/* Recruit rate slider */}
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
          padding: '18px 22px', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: '#e5e7eb', fontWeight: 600 }}>Recruits per month</span>
            <span style={{
              background: '#c9a84c22', color: '#c9a84c', border: '1px solid #c9a84c44',
              borderRadius: 20, padding: '3px 12px', fontSize: 14, fontWeight: 700,
            }}>{recruits}</span>
          </div>
          <input
            type="range" min={0} max={10} value={recruits ?? 2}
            onChange={handleRecruitChange}
            style={{ width: '100%', accentColor: '#c9a84c' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#6b7280', marginTop: 4 }}>
            <span>0 (no recruiting)</span><span>5 (solid pace)</span><span>10 (very active)</span>
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: '#9ca3af' }}>
            Drag to see how your monthly recruit rate changes your earnings forecast.
            Accelerated scenario adds ×1.8 to this rate.
          </p>
        </div>

        {/* Forecast chart */}
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
          padding: '20px', marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, color: '#fff' }}>Commission Forecast</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 16, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
              <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={v => v.toLocaleString()} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {splitIdx != null && splitIdx > 0 && (
                <ReferenceLine x={chartData[splitIdx]?.month} stroke="#444" strokeDasharray="4 4"
                  label={{ value: 'Projected →', position: 'insideTopLeft', fontSize: 10, fill: '#6b7280' }} />
              )}
              <Line
                type="monotone" dataKey="Current" name="Current Pace"
                stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                strokeDasharray={(d) => d?.actual ? undefined : '6 3'}
              />
              <Line
                type="monotone" dataKey="Accelerated" name="Accelerated"
                stroke="#c9a84c" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }}
                strokeDasharray="6 3"
              />
            </LineChart>
          </ResponsiveContainer>
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#6b7280' }}>
            Solid lines = actual (last 3 months). Dashed = projected. Dashed-gold = accelerated scenario.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Rank progress at end of horizon */}
          {progressToNext && nextRank !== currentRank && (
            <div style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '20px',
            }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#fff' }}>
                Progress to <span style={{ color: RANK_COLORS[nextRank] }}>{nextRank}</span>
              </h2>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: '#9ca3af' }}>
                At end of {horizon}-month projection (current pace):
              </p>
              <ProgressBar
                label="Personal PV"
                pct={progressToNext.pvPct}
                need={progressToNext.pvNeed}
                unit="PV"
              />
              <ProgressBar
                label="Group Volume (weak leg)"
                pct={progressToNext.gvPct}
                need={progressToNext.gvNeed}
                unit="GV"
                color="#3b82f6"
              />
              <ProgressBar
                label="Direct Recruits"
                pct={progressToNext.recPct}
                need={progressToNext.recNeed}
                unit="recruits"
                color="#a78bfa"
              />
              <div style={{ marginTop: 14, padding: '10px 14px', background: '#111', borderRadius: 8, fontSize: 12 }}>
                <span style={{ color: '#9ca3af' }}>Current pace rank-up: </span>
                <strong style={{ color: rankUpCurrent ? '#c9a84c' : '#9ca3af' }}>
                  {rankUpCurrent || 'Not within 6 months'}
                </strong>
                {rankUpAccelerated && (
                  <span style={{ marginLeft: 12, color: '#9ca3af' }}>
                    Accelerated: <strong style={{ color: '#22c55e' }}>{rankUpAccelerated}</strong>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Monthly breakdown table */}
          <div style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
            padding: '20px', overflowX: 'auto',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#fff' }}>Monthly Breakdown</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2a2a2a' }}>
                  <th style={{ padding: '6px 8px', textAlign: 'left', color: '#9ca3af', fontWeight: 500 }}>Month</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', color: '#3b82f6', fontWeight: 500 }}>Current</th>
                  <th style={{ padding: '6px 8px', textAlign: 'right', color: '#c9a84c', fontWeight: 500 }}>Accel.</th>
                  <th style={{ padding: '6px 8px', textAlign: 'center', color: '#9ca3af', fontWeight: 500 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {months?.map((m, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #1e1e1e', background: !m.projected ? '#111' : 'transparent' }}>
                    <td style={{ padding: '6px 8px', color: '#e5e7eb' }}>{m.month}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#3b82f6' }}>
                      {(m.projected ? m.current : (m.commission ?? m.current))?.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', color: '#c9a84c' }}>
                      {(m.projected ? m.accelerated : (m.commission ?? m.accelerated))?.toLocaleString()}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 10,
                        background: m.projected ? '#1e3a5f' : '#1a2e1a',
                        color: m.projected ? '#60a5fa' : '#4ade80',
                      }}>
                        {m.projected ? 'projected' : 'actual'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action recommendations */}
        <div style={{
          background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '20px',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, color: '#fff' }}>
            🎯 Recommended Actions to Improve Your Forecast
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
            {actions?.map((a, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px 14px',
                background: '#111', borderRadius: 8, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                <span style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.5 }}>{a.text}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link to="/dashboard/referral"
              style={{ padding: '8px 16px', background: '#c9a84c', color: '#000', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              Share Referral Link
            </Link>
            <Link to="/dashboard/rank-progress"
              style={{ padding: '8px 16px', background: '#1e3a5f', color: '#60a5fa', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              View Rank Progress
            </Link>
            <Link to="/dashboard/business-plan"
              style={{ padding: '8px 16px', background: '#1a1a1a', color: '#9ca3af', border: '1px solid #333', borderRadius: 8, fontSize: 13, textDecoration: 'none' }}>
              Set Income Goal
            </Link>
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 11, color: '#4b5563', textAlign: 'center' }}>
          Projections are estimates based on your historical activity and selected parameters. Past performance does not guarantee future results.
          MLMT values are illustrative; actual NOK conversion depends on the current exchange rate in Admin Settings.
        </p>
      </div>
    </DashboardLayout>
  )
}
