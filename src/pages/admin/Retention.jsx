import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getRetentionStats } from '../../api/mlmApi'

const COHORT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6']
const RISK_BADGE = {
  High:   { bg: '#3f1d1d', color: '#f87171' },
  Medium: { bg: '#3f2e1d', color: '#fb923c' },
  Low:    { bg: '#1e3a2a', color: '#4ade80' },
}
const RANK_COLOR = { platinum: '#e2e8f0', gold: '#fbbf24', silver: '#94a3b8', bronze: '#b45309', member: '#60a5fa' }

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text1)', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</span>}
    </div>
  )
}

const ScoreBar = ({ score }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ flex: 1, background: '#1e293b', borderRadius: 4, height: 6, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: 4,
        width: `${score}%`,
        background: score < 20 ? '#ef4444' : score < 40 ? '#f97316' : score < 60 ? '#eab308' : score < 80 ? '#22c55e' : '#3b82f6',
      }} />
    </div>
    <span style={{ fontSize: 12, color: 'var(--text2)', width: 28, textAlign: 'right' }}>{score}</span>
  </div>
)

export default function Retention() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState('at-risk')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey]  = useState('activityScore')
  const [sortDir, setSortDir]  = useState('asc')
  const [riskFilter, setRiskFilter] = useState('all')

  useEffect(() => {
    getRetentionStats().then(d => { setData(d); setLoading(false) })
  }, [])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filteredAtRisk = data
    ? data.atRiskMembers
        .filter(m => {
          const q = search.toLowerCase()
          const matchSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
          const matchRisk = riskFilter === 'all' || m.churnRisk === riskFilter
          return matchSearch && matchRisk
        })
        .sort((a, b) => {
          const av = a[sortKey], bv = b[sortKey]
          if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
          return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))
        })
    : []

  const col = { color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }
  const cell = { padding: '10px 12px', fontSize: 13, color: 'var(--text1)', borderTop: '1px solid var(--border)' }
  const SortIcon = ({ k }) => <span style={{ marginLeft: 3, opacity: sortKey === k ? 1 : 0.3 }}>{sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>

  if (loading) return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading retention data…</div></AdminLayout>

  return (
    <AdminLayout>
      <div style={{ padding: 24, maxWidth: 1200 }}>
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>📉 Retention & Churn</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
            Member activity scores, cohort retention, and at-risk identification
          </p>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KpiCard label="Active Rate" value={`${data.activeRate}%`} sub={`${Math.round(data.totalMembers * data.activeRate / 100)} of ${data.totalMembers} members`} color="#3b82f6" />
          <KpiCard label="30-Day Retention" value={`${data.retention30}%`} sub="active 30d" color="#10b981" />
          <KpiCard label="Avg Activity Score" value={data.avgScore} sub="out of 100" color="#f59e0b" />
          <KpiCard label="At-Risk Members" value={data.atRisk} sub="score < 35" color="#ef4444" />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          {/* Cohort retention */}
          <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', marginBottom: 16 }}>Cohort Retention by Week</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.cohortChart} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tickFormatter={v => `${v}%`} tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[0, 105]} />
                <Tooltip formatter={(v, n) => [`${v}%`, `${n} cohort`]} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                {['Jan', 'Feb', 'Mar', 'Apr'].map((m, i) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={COHORT_COLORS[i]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity distribution */}
          <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', marginBottom: 16 }}>Activity Score Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.activityDistribution} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.activityDistribution.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabs: At-Risk / Top Engaged */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {['at-risk', 'top-engaged'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: tab === t ? '#3b82f6' : 'var(--navy2)', color: tab === t ? '#fff' : 'var(--text2)',
            }}>
              {t === 'at-risk' ? `⚠️ At-Risk (${data.atRisk})` : `⭐ Top Engaged (${data.topEngaged.length})`}
            </button>
          ))}
        </div>

        {tab === 'at-risk' && (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search member…"
                style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--text1)', fontSize: 13, width: 220 }}
              />
              {['all', 'High', 'Medium', 'Low'].map(r => (
                <button key={r} onClick={() => setRiskFilter(r)} style={{
                  padding: '7px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  background: riskFilter === r ? '#3b82f6' : 'var(--navy2)', color: riskFilter === r ? '#fff' : 'var(--text2)',
                }}>
                  {r === 'all' ? 'All Risk' : `${r} Risk`}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: 12, alignSelf: 'center' }}>
                {filteredAtRisk.length} members
              </span>
            </div>

            <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: '#0f172a' }}>
                      <th style={col} onClick={() => toggleSort('name')}>Member <SortIcon k="name" /></th>
                      <th style={col}>Rank</th>
                      <th style={col} onClick={() => toggleSort('activityScore')}>Score <SortIcon k="activityScore" /></th>
                      <th style={col} onClick={() => toggleSort('daysSinceActive')}>Last Active <SortIcon k="daysSinceActive" /></th>
                      <th style={col} onClick={() => toggleSort('churnRisk')}>Churn Risk <SortIcon k="churnRisk" /></th>
                      <th style={col}>Country</th>
                      <th style={col}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAtRisk.length === 0 ? (
                      <tr><td colSpan={7} style={{ ...cell, textAlign: 'center', color: 'var(--text2)', padding: 32 }}>No members match filter</td></tr>
                    ) : filteredAtRisk.map(m => (
                      <tr key={m.id} style={{ transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                        <td style={cell}>
                          <div style={{ fontWeight: 600 }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.email}</div>
                        </td>
                        <td style={cell}>
                          <span style={{ background: '#1e293b', color: RANK_COLOR[m.rank] || '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11, textTransform: 'capitalize' }}>{m.rank}</span>
                        </td>
                        <td style={{ ...cell, minWidth: 140 }}>
                          <ScoreBar score={m.activityScore} />
                        </td>
                        <td style={cell}>
                          <div>{m.lastActive}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.daysSinceActive}d ago</div>
                        </td>
                        <td style={cell}>
                          <span style={{ background: RISK_BADGE[m.churnRisk]?.bg, color: RISK_BADGE[m.churnRisk]?.color, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{m.churnRisk}</span>
                        </td>
                        <td style={{ ...cell, color: 'var(--text2)' }}>{m.country}</td>
                        <td style={cell}>
                          <button
                            onClick={() => alert(`Draft re-engagement email to ${m.name} (${m.email})`)}
                            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, background: '#1e3a5f', color: '#60a5fa' }}
                          >
                            ✉️ Re-engage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'top-engaged' && (
          <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th style={col}>#</th>
                    <th style={col}>Member</th>
                    <th style={col}>Rank</th>
                    <th style={col}>Activity Score</th>
                    <th style={col}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEngaged.map((m, i) => (
                    <tr key={m.id} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                      <td style={{ ...cell, color: 'var(--text2)', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ ...cell, fontWeight: 600 }}>{m.name}</td>
                      <td style={cell}>
                        <span style={{ background: '#1e293b', color: RANK_COLOR[m.rank] || '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 11, textTransform: 'capitalize' }}>{m.rank}</span>
                      </td>
                      <td style={{ ...cell, minWidth: 160 }}>
                        <ScoreBar score={m.activityScore} />
                      </td>
                      <td style={{ ...cell, color: 'var(--text2)' }}>{m.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
