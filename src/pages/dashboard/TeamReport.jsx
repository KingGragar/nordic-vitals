import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getTeamReport } from '../../api/mlmApi'

const RANK_COLORS = {
  Unranked: '#6b7280', Bronze: '#92400e', Silver: '#9ca3af', Gold: '#d97706', Platinum: '#7c3aed',
}

const PERIOD_LABELS = {
  week: 'This Week',
  month: 'This Month',
  last_month: 'Last Month',
}

function KpiCard({ label, value, sub, color = '#c9a84c', icon }) {
  return (
    <div style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#aaa' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#666' }}>{sub}</div>}
    </div>
  )
}

export default function TeamReport() {
  const { user } = useAuth()
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getTeamReport(user?.memberId ?? user?.userId, period)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, period])

  const s = { color: '#e5e7eb', fontFamily: 'sans-serif', minHeight: '100vh', padding: '24px 20px', maxWidth: 960, margin: '0 auto' }

  return (
    <DashboardLayout>
      <div style={s}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📊 Team Performance Report</h1>
            <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>
              How your network is performing across key metrics
            </p>
          </div>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PERIOD_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setPeriod(key)}
                style={{
                  padding: '7px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                  border: period === key ? '1px solid #c9a84c' : '1px solid #333',
                  background: period === key ? '#2a1f00' : '#111',
                  color: period === key ? '#c9a84c' : '#9ca3af',
                  fontWeight: period === key ? 600 : 400,
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>Loading report…</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>No data available.</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
              <KpiCard icon="🏆" label="Team Commissions" value={`${data.teamCommissions.toLocaleString()} MLMT`} color="#c9a84c" sub={PERIOD_LABELS[period]} />
              <KpiCard icon="👥" label="Team Size" value={data.teamSize} sub={`${data.activeCount} active`} color="#3b82f6" />
              <KpiCard icon="📦" label="Team PV" value={data.totalTeamPV.toLocaleString()} sub="Personal Volume" color="#22c55e" />
              <KpiCard icon="🌐" label="Team GV" value={data.totalTeamGV.toLocaleString()} sub="Group Volume" color="#a78bfa" />
              <KpiCard icon="🆕" label="New Recruits" value={data.newRecruits} sub={PERIOD_LABELS[period]} color="#f59e0b" />
              <KpiCard icon="⬆️" label="Rank-Ups" value={data.rankUps.length} sub={PERIOD_LABELS[period]} color="#34d399" />
              <KpiCard icon="⚠️" label="At-Risk Members" value={data.atRisk.length} sub="Need attention" color="#ef4444" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* Weekly commissions chart */}
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>Weekly Commission Flow</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.weeklyData} barSize={18}>
                    <XAxis dataKey="week" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, color: '#e5e7eb' }}
                      formatter={(v) => [`${v.toLocaleString()} MLMT`, 'Commissions']}
                    />
                    <Bar dataKey="commissions" fill="#c9a84c" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Commission breakdown pie */}
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>Commission Breakdown</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.commBreakdown} dataKey="amount" nameKey="type" cx="45%" cy="50%" outerRadius={70} paddingAngle={2}>
                      {data.commBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(v) => <span style={{ color: '#aaa', fontSize: 11 }}>{v}</span>}
                      iconSize={10}
                    />
                    <Tooltip
                      contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 6, color: '#e5e7eb' }}
                      formatter={(v) => [`${v.toLocaleString()} MLMT`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Performers */}
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>🥇 Top Performers — {PERIOD_LABELS[period]}</h3>
              {data.topPerformers.length === 0 ? (
                <p style={{ color: '#555', margin: 0, fontSize: 13 }}>No team data for this period.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: '#666', borderBottom: '1px solid #2a2a2a' }}>
                      {['#', 'Member', 'Rank', 'Level', 'PV', 'GV', 'Comm. Earned'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPerformers.map((m, i) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid #1f1f1f' }}>
                        <td style={{ padding: '8px 8px', color: i === 0 ? '#c9a84c' : '#666' }}>{i + 1}</td>
                        <td style={{ padding: '8px 8px', fontWeight: 600, color: '#e5e7eb' }}>{m.name}</td>
                        <td style={{ padding: '8px 8px' }}>
                          <span style={{
                            background: RANK_COLORS[m.rank] + '22', color: RANK_COLORS[m.rank],
                            padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                          }}>{m.rank}</span>
                        </td>
                        <td style={{ padding: '8px 8px', color: '#9ca3af' }}>L{m.level}</td>
                        <td style={{ padding: '8px 8px', color: '#e5e7eb' }}>{m.pv.toLocaleString()}</td>
                        <td style={{ padding: '8px 8px', color: '#a78bfa' }}>{m.gv.toLocaleString()}</td>
                        <td style={{ padding: '8px 8px', color: '#c9a84c', fontWeight: 600 }}>
                          {m.commEarned.toLocaleString()} MLMT
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
              {/* New Recruits */}
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>🆕 New Recruits</h3>
                {data.recentRecruits.length === 0 ? (
                  <p style={{ color: '#555', margin: 0, fontSize: 13 }}>No new recruits {PERIOD_LABELS[period].toLowerCase()}.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.recentRecruits.map(r => (
                      <div key={r.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '10px 14px',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                          <div style={{ color: '#666', fontSize: 11 }}>Recruited by {r.sponsor}</div>
                        </div>
                        <div style={{ fontSize: 11, color: '#22c55e', background: '#14532d22', padding: '3px 8px', borderRadius: 10 }}>
                          +{r.joinedAgo}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rank-Ups */}
              <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px' }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>⬆️ Rank Advancements</h3>
                {data.rankUps.length === 0 ? (
                  <p style={{ color: '#555', margin: 0, fontSize: 13 }}>No rank-ups {PERIOD_LABELS[period].toLowerCase()}.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.rankUps.map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: '#111', border: '1px solid #1f1f1f', borderRadius: 8, padding: '10px 14px',
                      }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                          <span style={{ color: RANK_COLORS[r.from] }}>{r.from}</span>
                          <span style={{ color: '#555' }}>→</span>
                          <span style={{ color: RANK_COLORS[r.to], fontWeight: 700 }}>{r.to}</span>
                          <span style={{ color: '#555', marginLeft: 4 }}>{r.daysAgo}d ago</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* At-Risk Members */}
            {data.atRisk.length > 0 && (
              <div style={{ background: '#1a0000', border: '1px solid #3b1111', borderRadius: 10, padding: '18px 20px', marginBottom: 28 }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#ef4444', fontWeight: 600 }}>
                  ⚠️ Members Needing Attention ({data.atRisk.length})
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                  {data.atRisk.map(m => (
                    <div key={m.id} style={{
                      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 14px',
                    }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{m.name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
                        <span>{m.id}</span>
                        <span style={{ color: m.status === 'Inactive' ? '#ef4444' : '#f59e0b' }}>{m.status}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                        PV: {m.pv} · L{m.level ?? '?'} · {m.rank}
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ margin: '14px 0 0', fontSize: 12, color: '#9ca3af' }}>
                  Consider reaching out via{' '}
                  <Link to="/dashboard/team-broadcast" style={{ color: '#c9a84c' }}>Team Broadcast</Link>
                  {' '}or direct WhatsApp to re-engage these members.
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, padding: '18px 20px' }}>
              <h3 style={{ margin: '0 0 14px', fontSize: 14, color: '#ccc', fontWeight: 600 }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { to: '/dashboard/team-broadcast', label: '📣 Send Team Broadcast' },
                  { to: '/dashboard/my-team',        label: '👥 Full Team List' },
                  { to: '/dashboard/leaderboard',    label: '🏆 Leaderboard' },
                  { to: '/dashboard/challenges',     label: '🏅 Team Challenges' },
                  { to: '/dashboard/prospects',      label: '🎯 Prospect Tracker' },
                  { to: '/dashboard/business-plan',  label: '📋 Goal Planner' },
                ].map(a => (
                  <Link key={a.to} to={a.to} style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, textDecoration: 'none',
                    background: '#111', border: '1px solid #333', color: '#c9a84c',
                    fontWeight: 500, transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#c9a84c'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#333'}
                  >{a.label}</Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
