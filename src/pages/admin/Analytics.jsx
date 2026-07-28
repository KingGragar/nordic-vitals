import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { getAdminAnalytics } from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('en', { maximumFractionDigits: 0 })
const PCT = v => Number(v).toFixed(1) + '%'

const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']

function KpiCard({ label, value, sub, color, arrow }) {
  return (
    <div style={{
      background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text1)', lineHeight: 1.1 }}>{value}</span>
      {sub && (
        <span style={{ fontSize: 12, color: arrow === 'up' ? '#10b981' : arrow === 'down' ? '#ef4444' : 'var(--text2)' }}>
          {arrow === 'up' ? '▲' : arrow === 'down' ? '▼' : ''} {sub}
        </span>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.value > 10000 ? NOK(p.value) : p.value.toLocaleString()}
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revenueTab, setRevenueTab] = useState('revenue')

  useEffect(() => {
    getAdminAnalytics()
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading analytics…</div></AdminLayout>
  if (!data) return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Analytics unavailable.</div></AdminLayout>

  const { kpis, monthlyRevenue, memberGrowth, conversionFunnel, geoDistribution, categoryRevenue } = data

  const funnelMax = conversionFunnel[0]?.count || 1
  const funnelData = conversionFunnel.map((s, i) => ({
    ...s,
    pct: ((s.count / funnelMax) * 100).toFixed(1),
    dropPct: i === 0 ? null : (((conversionFunnel[i - 1].count - s.count) / conversionFunnel[i - 1].count) * 100).toFixed(1),
  }))

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>Business Analytics</h1>
          <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 0' }}>Revenue, growth, and conversion — last 13 months</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard label="YTD Revenue" value={NOK(kpis.ytdRevenue)} sub={`+${kpis.ytdRevenueGrowth}% vs prior year`} arrow="up" />
          <KpiCard label="Autoship MRR" value={NOK(kpis.autoshipMRR)} sub="Recurring monthly revenue" />
          <KpiCard label="Avg Order Value" value={NOK(kpis.avgOrderValue)} />
          <KpiCard label="Commission Ratio" value={PCT(kpis.commissionPayoutRatio)} sub="% of revenue paid out" />
          <KpiCard label="Member Activation" value={PCT(kpis.activeConversionRate)} sub="Active / all-time sign-ups" arrow="up" />
          <KpiCard label="Avg Recruits / Member" value={kpis.avgRecruitPerMember.toFixed(1)} />
        </div>

        {/* Revenue Trend */}
        <Section title="Revenue Trend">
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {[['revenue', 'Revenue'], ['orders', 'Orders'], ['commissions', 'Commissions']].map(([k, l]) => (
              <button key={k} onClick={() => setRevenueTab(k)} style={{
                padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12,
                background: revenueTab === k ? 'var(--accent)' : 'var(--navy3)',
                color: revenueTab === k ? '#fff' : 'var(--text2)',
              }}>{l}</button>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }}
                tickFormatter={v => revenueTab === 'orders' ? v : (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
              <Tooltip content={<CustomTooltip />} />
              {revenueTab === 'revenue' && (
                <Line type="monotone" dataKey="revenue" name="Revenue (NOK)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
              {revenueTab === 'orders' && (
                <Line type="monotone" dataKey="orders" name="Orders" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
              {revenueTab === 'commissions' && (
                <Line type="monotone" dataKey="commissions" name="Commissions (NOK)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
          <p style={{ fontSize: 11, color: 'var(--text2)', margin: '8px 0 0', textAlign: 'right' }}>
            * Jul 26 is a partial month
          </p>
        </Section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px,1fr))', gap: 20, marginBottom: 20 }}>
          {/* Member Growth */}
          <Section title="Member Growth">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={memberGrowth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
                <Area type="monotone" dataKey="cumulative" name="Total Members" stroke="#3b82f6" fill="url(#cumGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="newMembers" name="New Joins" stroke="#10b981" fill="url(#newGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Section>

          {/* Category Revenue */}
          <Section title="Revenue by Product Category">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryRevenue} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text2)' }}
                  tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--text2)' }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Revenue (NOK)" radius={[0, 4, 4, 0]}>
                  {categoryRevenue.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px,1fr))', gap: 20, marginBottom: 20 }}>
          {/* Conversion Funnel */}
          <Section title="Conversion Funnel">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
              {funnelData.map((s, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text1)' }}>{s.stage}</span>
                    <span style={{ color: 'var(--text2)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.count.toLocaleString()} &nbsp;
                      <span style={{ color: '#3b82f6' }}>{s.pct}%</span>
                    </span>
                  </div>
                  <div style={{ background: 'var(--navy3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                    <div style={{
                      width: s.pct + '%', height: '100%', borderRadius: 4,
                      background: `hsl(${220 - i * 22}, 80%, ${55 + i * 4}%)`,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  {s.dropPct && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 2, textAlign: 'right' }}>
                      ↓ {s.dropPct}% drop-off
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {/* Geographic Distribution */}
          <Section title="Geographic Distribution">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr>
                    {['#', 'Country', 'Members', 'Share', 'Bar'].map(h => (
                      <th key={h} style={{
                        padding: '6px 10px', textAlign: h === '#' || h === 'Members' || h === 'Share' ? 'right' : 'left',
                        color: 'var(--text2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase',
                        borderBottom: '1px solid var(--navy3)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {geoDistribution.map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--navy3)' }}>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: 'var(--text2)', fontSize: 11 }}>{i + 1}</td>
                      <td style={{ padding: '7px 10px', color: 'var(--text1)', fontWeight: 500 }}>{g.country}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{g.members}</td>
                      <td style={{ padding: '7px 10px', textAlign: 'right', color: '#3b82f6' }}>{g.pct}%</td>
                      <td style={{ padding: '7px 10px', minWidth: 80 }}>
                        <div style={{ background: 'var(--navy3)', borderRadius: 3, height: 6 }}>
                          <div style={{ width: g.pct + '%', height: '100%', borderRadius: 3, background: '#3b82f6' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </div>

        {/* Commission Efficiency (Revenue vs Commissions overlay) */}
        <Section title="Revenue vs Commissions Paid">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text2)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text2)' }} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text2)' }} />
              <Bar dataKey="revenue"     name="Revenue (NOK)"     fill="#3b82f6" radius={[3,3,0,0]} />
              <Bar dataKey="commissions" name="Commissions (NOK)" fill="#f59e0b" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

      </div>
    </AdminLayout>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 20px 16px', marginBottom: 0 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text1)', margin: '0 0 16px' }}>{title}</h2>
      {children}
    </div>
  )
}
