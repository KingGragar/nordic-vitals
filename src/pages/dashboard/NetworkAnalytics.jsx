import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getNetworkAnalytics } from '../../api/mlmApi'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const RANK_COLOR = { Silver: '#c9a84c', Bronze: '#cd7f32', Gold: '#f59e0b', Platinum: '#6366f1', Unranked: '#6b7280' }

function kpi(label, value, sub, color = '#3b82f6') {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', minWidth: 140 }}>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function Badge({ label, color }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: 4, fontSize: 11, padding: '1px 7px', fontWeight: 600 }}>
      {label}
    </span>
  )
}

function BalanceBar({ leftGv, rightGv, leftLabel, rightLabel }) {
  const total = leftGv + rightGv || 1
  const leftPct = Math.round((leftGv / total) * 100)
  const rightPct = 100 - leftPct
  const balanced = Math.abs(leftPct - 50) <= 10
  const color = balanced ? '#22c55e' : Math.abs(leftPct - 50) <= 20 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6, color: 'var(--text2)' }}>
        <span>{leftLabel}</span>
        <span style={{ fontWeight: 700, color }}>{leftPct}% / {rightPct}%</span>
        <span>{rightLabel}</span>
      </div>
      <div style={{ height: 18, borderRadius: 9, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
        <div style={{ width: `${leftPct}%`, background: '#3b82f6', transition: 'width .4s' }} />
        <div style={{ width: `${rightPct}%`, background: '#22c55e', transition: 'width .4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 4, color: 'var(--text2)' }}>
        <span>{leftGv.toLocaleString()} GV</span>
        <span style={{ color, fontWeight: 600 }}>{balanced ? '✓ Balanced' : '! Rebalance needed'}</span>
        <span>{rightGv.toLocaleString()} GV</span>
      </div>
    </div>
  )
}

export default function NetworkAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.userId) return
    getNetworkAnalytics(user.userId)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [user?.userId])

  const healthScore = useMemo(() => {
    if (!data) return 0
    const { summary, levelBreakdown, legBalance } = data
    const activeRate = summary.totalMembers > 0 ? summary.activeMembers / summary.totalMembers : 0
    const balanceRatio = legBalance
      ? 1 - Math.abs(legBalance.leftGv - legBalance.rightGv) / ((legBalance.leftGv + legBalance.rightGv) || 1)
      : 0.5
    const depthScore = Math.min(summary.networkDepth / 5, 1)
    const l1Share = levelBreakdown?.[0]?.total > 0 ? 1 : 0
    return Math.round((activeRate * 40 + balanceRatio * 30 + depthScore * 20 + l1Share * 10))
  }, [data])

  const healthColor = healthScore >= 75 ? '#22c55e' : healthScore >= 50 ? '#f59e0b' : '#ef4444'
  const healthLabel = healthScore >= 75 ? 'Strong' : healthScore >= 50 ? 'Fair' : 'Needs attention'

  if (loading) return (
    <DashboardLayout>
      <div style={{ padding: 32, color: 'var(--text2)' }}>Loading network analytics…</div>
    </DashboardLayout>
  )

  if (!data) return (
    <DashboardLayout>
      <div style={{ padding: 32, color: 'var(--text2)' }}>Could not load network data.</div>
    </DashboardLayout>
  )

  const { summary, levelBreakdown, legBalance, growthWeekly, topContributors, recentActivity } = data

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1000 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📡 Network Analytics</h2>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Your downline at a glance</span>
        </div>

        {/* KPI Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {kpi('Network Size', summary.totalMembers, `${summary.activeMembers} active / ${summary.inactiveMembers} inactive`)}
          {kpi('Active Rate', `${summary.totalMembers ? Math.round(summary.activeMembers / summary.totalMembers * 100) : 0}%`, 'of your downline', '#22c55e')}
          {kpi('Network Depth', `${summary.networkDepth} lvls`, 'deepest level reached')}
          {kpi('New (30d)', `+${summary.newLast30d}`, `+${summary.newLast7d} this week`, '#f59e0b')}
          {kpi('Health Score', `${healthScore}`, healthLabel, healthColor)}
          {kpi('Total GV', summary.totalNetworkGv.toLocaleString(), 'all levels combined', '#8b5cf6')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Level Breakdown */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Level Breakdown</div>
            {levelBreakdown.map(lvl => {
              const activeW = lvl.total > 0 ? Math.round(lvl.active / lvl.total * 100) : 0
              return (
                <div key={lvl.level} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{lvl.label}</span>
                    <span style={{ color: 'var(--text2)' }}>{lvl.total} members · {lvl.gv.toLocaleString()} GV</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${activeW}%`, background: '#22c55e' }} />
                    <div style={{ width: `${100 - activeW}%`, background: '#ef444433' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 2, color: 'var(--text2)' }}>
                    <span style={{ color: '#22c55e' }}>{lvl.active} active</span>
                    <span style={{ color: '#ef4444' }}>{lvl.inactive} inactive</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Binary Leg Balance */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Binary Leg Balance</div>
            {legBalance ? (
              <BalanceBar {...legBalance} />
            ) : (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>Not applicable for your plan type.</div>
            )}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Volume per Level</div>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={levelBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }} formatter={(v) => [v.toLocaleString() + ' GV', 'GV']} />
                  <Bar dataKey="gv" radius={[4, 4, 0, 0]}>
                    {levelBreakdown.map((_, i) => (
                      <Cell key={i} fill={['#3b82f6','#22c55e','#f59e0b','#8b5cf6','#6b7280'][i % 5]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>Recruit Growth (12 weeks)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={growthWeekly} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12 }} formatter={(v) => [v, 'New recruits']} />
              <Line type="monotone" dataKey="recruits" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>

          {/* Top Contributors */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Top Network Contributors</div>
            {topContributors.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>No downline yet.</div>
            ) : topContributors.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < topContributors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#3b82f622', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>L{m.level} · {m.directRecruits} direct recruits</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{m.gv.toLocaleString()} GV</div>
                  <Badge label={m.rank} color={RANK_COLOR[m.rank] || '#6b7280'} />
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Recent Network Activity</div>
            {recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontSize: 13 }}>No recent activity.</div>
            ) : recentActivity.map((ev, i) => {
              const icon = ev.type === 'recruit' ? '👤' : ev.type === 'rank' ? '⭐' : '📦'
              const color = ev.type === 'recruit' ? '#22c55e' : ev.type === 'rank' ? '#f59e0b' : '#3b82f6'
              return (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: 20, lineHeight: 1.2 }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color }}>{ev.member}</span>
                      {' '}<span style={{ color: 'var(--text2)' }}>— {ev.note}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{ev.date}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Tips box */}
        <div style={{ marginTop: 20, background: '#3b82f611', border: '1px solid #3b82f633', borderRadius: 10, padding: '14px 20px' }}>
          <div style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>💡 Network Growth Tips</div>
          <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text2)', fontSize: 13, lineHeight: 1.8 }}>
            {summary.activeMembers / (summary.totalMembers || 1) < 0.7 && (
              <li>Your active rate is below 70% — re-engage inactive members with a personal message or announcement.</li>
            )}
            {legBalance && Math.abs(legBalance.leftGv - legBalance.rightGv) > 500 && (
              <li>Your legs are unbalanced by {Math.abs(legBalance.leftGv - legBalance.rightGv).toLocaleString()} GV — focus recruiting on your weaker leg to maximize binary commission.</li>
            )}
            {summary.newLast30d < 2 && (
              <li>Only {summary.newLast30d} new recruit{summary.newLast30d !== 1 ? 's' : ''} in 30 days — share your referral link on social media to accelerate growth.</li>
            )}
            <li>Depth matters: encourage your L1 members to recruit their own teams to multiply your GV.</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
