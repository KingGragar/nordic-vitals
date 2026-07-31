import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, Sector,
} from 'recharts'
import { getAdminFinancials } from '../../api/mlmApi'

const NOK  = v => 'NOK ' + Number(v).toLocaleString('en', { maximumFractionDigits: 0 })
const PCT  = v => Number(v).toFixed(1) + '%'
const fmtK = v => {
  if (Math.abs(v) >= 1_000_000) return 'NOK ' + (v / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(v) >= 1_000)     return 'NOK ' + (v / 1_000).toFixed(0) + 'K'
  return 'NOK ' + v
}

const PERIOD_OPTIONS = [
  { label: 'Last 6 months',  value: 6  },
  { label: 'Last 12 months', value: 12 },
  { label: 'All',            value: 999 },
]

function KpiCard({ label, value, sub, color, note }) {
  return (
    <div style={{
      background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--text1)', lineHeight: 1.15 }}>{value}</span>
      {sub  && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</span>}
      {note && <span style={{ fontSize: 11, color: '#f59e0b' }}>{note}</span>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--navy3)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? fmtK(p.value) : p.value}
        </div>
      ))}
    </div>
  )
}

const PctTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--navy3)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>
          {p.name}: {PCT(p.value)}
        </div>
      ))}
    </div>
  )
}

function ActiveShape({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value }) {
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--text1)" fontSize={15} fontWeight={700}>{payload.name}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text2)" fontSize={13}>{fmtK(value)}</text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="var(--text2)" fontSize={12}>{PCT(percent * 100)}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 1} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  )
}

function downloadCSV(monthly) {
  const cols = ['Month','Revenue','COGS','Gross Profit','Gross Margin %','Commissions','Platform Fee','Admin Overhead','Net Profit','Net Margin %']
  const rows = monthly.map(r => [
    r.month, r.revenue, r.cogs, r.grossProfit, r.grossMarginPct,
    r.commissions, r.platformFee, r.adminOverhead, r.netProfit, r.netMarginPct,
  ])
  const csv = [cols, ...rows].map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `nordic-vitals-financials-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}

export default function Financials() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState(12)
  const [activeIdx, setActiveIdx] = useState(0)
  const [tab, setTab]         = useState('pnl')  // 'pnl' | 'margin' | 'quarterly'

  useEffect(() => {
    getAdminFinancials()
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const onPieEnter = useCallback((_, idx) => setActiveIdx(idx), [])

  if (loading) return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading financials…</div></AdminLayout>
  if (!data)   return <AdminLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Financial data unavailable.</div></AdminLayout>

  const { summary, monthly, expenseBreakdown, quarters } = data
  const chartMonths = period >= 999 ? monthly : monthly.slice(-period)
  const totalExpenses = summary.ytdRevenue - summary.ytdNetProfit

  const tabBtn = (key, label) => (
    <button
      onClick={() => setTab(key)}
      style={{
        padding: '6px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
        background: tab === key ? 'var(--gold)' : 'var(--navy3)',
        color:      tab === key ? '#111'       : 'var(--text2)',
        fontWeight: tab === key ? 700 : 400,
      }}
    >{label}</button>
  )

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>💰 Financial P&amp;L</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
              Revenue, cost structure, and profitability · YTD as of Jul 2026
            </p>
          </div>
          <button
            onClick={() => downloadCSV(monthly)}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--navy3)', color: 'var(--text1)', fontSize: 13,
            }}
          >⬇ Export CSV</button>
        </div>

        {/* KPI row 1 — Revenue & Profit */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <KpiCard label="YTD Revenue"     value={NOK(summary.ytdRevenue)}    sub="Jul 25 – Jul 26" color="var(--gold)" />
          <KpiCard label="YTD Gross Profit" value={NOK(summary.ytdGrossProfit)} sub={`${PCT(summary.grossMarginPct)} gross margin`} color="#10b981" />
          <KpiCard label="YTD Net Profit"  value={NOK(summary.ytdNetProfit)}  sub={`${PCT(summary.netMarginPct)} net margin`} color="#10b981" />
          <KpiCard label="MRR (Jun 26)"    value={NOK(summary.mrr)}           sub="Monthly recurring revenue" />
          <KpiCard label="ARR (annualised)" value={NOK(summary.arr)}          sub="MRR × 12" />
        </div>

        {/* KPI row 2 — Unit Economics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <KpiCard label="LTV" value={NOK(summary.ltv)}         sub="Avg lifetime value / member" color="#8b5cf6" />
          <KpiCard label="CAC" value={NOK(summary.cac)}         sub="Customer acquisition cost"   color="#ef4444" />
          <KpiCard label="LTV : CAC" value={`${summary.ltvCacRatio}×`} sub="Target ≥ 3×" color={summary.ltvCacRatio >= 3 ? '#10b981' : '#ef4444'} note={summary.ltvCacRatio >= 3 ? '✓ Healthy' : '⚠ Below target'} />
          <KpiCard label="Commission Ratio" value={PCT(summary.commissionRatio)} sub="% of revenue paid out" color="#f59e0b" />
          <KpiCard label="Total Expenses" value={NOK(totalExpenses)} sub="COGS + commissions + ops" color="#ef4444" />
        </div>

        {/* Chart tabs */}
        <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {tabBtn('pnl',       'P&L Breakdown')}
              {tabBtn('margin',    'Margin Trends')}
              {tabBtn('quarterly', 'Quarterly Summary')}
            </div>
            {tab !== 'quarterly' && (
              <select
                value={period}
                onChange={e => setPeriod(Number(e.target.value))}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid var(--navy3)',
                  background: 'var(--navy3)', color: 'var(--text1)', fontSize: 13,
                }}
              >
                {PERIOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            )}
          </div>

          {tab === 'pnl' && (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartMonths} margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: 'var(--text2)', fontSize: 11 }} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="revenue"     name="Revenue"      fill="#3b82f6" opacity={0.85} radius={[3,3,0,0]} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" opacity={0.85} radius={[3,3,0,0]} />
                <Bar dataKey="netProfit"   name="Net Profit"   fill="#c9a84c" opacity={0.85} radius={[3,3,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {tab === 'margin' && (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartMonths} margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 65]} tick={{ fill: 'var(--text2)', fontSize: 11 }} width={40} />
                <Tooltip content={<PctTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Line type="monotone" dataKey="grossMarginPct" name="Gross Margin %" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="netMarginPct"   name="Net Margin %"   stroke="#c9a84c" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          )}

          {tab === 'quarterly' && (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={quarters} margin={{ top: 4, right: 16, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="quarter" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: 'var(--text2)', fontSize: 11 }} width={72} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="revenue"     name="Revenue"      fill="#3b82f6" opacity={0.85} radius={[3,3,0,0]} />
                <Bar dataKey="grossProfit" name="Gross Profit" fill="#10b981" opacity={0.85} radius={[3,3,0,0]} />
                <Bar dataKey="netProfit"   name="Net Profit"   fill="#c9a84c" opacity={0.85} radius={[3,3,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense breakdown + monthly table side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 16, alignItems: 'start' }}>

          {/* Donut */}
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20, minWidth: 260 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>YTD Cost Structure</h3>
            <PieChart width={240} height={220}>
              <Pie
                data={expenseBreakdown}
                cx={118} cy={108}
                innerRadius={64} outerRadius={95}
                dataKey="value"
                activeIndex={activeIdx}
                activeShape={ActiveShape}
                onMouseEnter={onPieEnter}
              >
                {expenseBreakdown.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              {expenseBreakdown.map((e, i) => (
                <div
                  key={i}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default',
                    opacity: activeIdx === i ? 1 : 0.65, transition: 'opacity .15s' }}
                >
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: e.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, flex: 1 }}>{e.name}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{fmtK(e.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly P&L table */}
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20, overflowX: 'auto' }}>
            <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Monthly P&amp;L Table</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                  {['Month','Revenue','COGS','Gross Profit','GM%','Commissions','Plat. Fee','Admin','Net Profit','NM%'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)', fontWeight: 600, fontSize: 11 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.map((r, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid var(--navy3)',
                    background: r.partial ? 'rgba(201,168,76,0.06)' : 'transparent',
                  }}>
                    <td style={{ padding: '6px 10px', color: 'var(--text2)', fontWeight: r.partial ? 600 : 400 }}>
                      {r.month}{r.partial ? ' *' : ''}
                    </td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text1)' }}>{NOK(r.revenue)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#ef4444' }}>{NOK(r.cogs)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{NOK(r.grossProfit)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)' }}>{PCT(r.grossMarginPct)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: '#f59e0b' }}>{NOK(r.commissions)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)' }}>{NOK(r.platformFee)}</td>
                    <td style={{ padding: '6px 10px', textAlign: 'right', color: 'var(--text2)' }}>{NOK(r.adminOverhead)}</td>
                    <td style={{
                      padding: '6px 10px', textAlign: 'right', fontWeight: 600,
                      color: r.netProfit >= 0 ? '#10b981' : '#ef4444',
                    }}>{NOK(r.netProfit)}</td>
                    <td style={{
                      padding: '6px 10px', textAlign: 'right',
                      color: r.netMarginPct >= 0 ? '#10b981' : '#ef4444',
                    }}>{PCT(r.netMarginPct)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--navy3)', fontWeight: 700 }}>
                  <td style={{ padding: '8px 10px', color: 'var(--text1)' }}>YTD Total</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--gold)' }}>{NOK(summary.ytdRevenue)}</td>
                  <td colSpan={2} style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981' }}>GP: {NOK(summary.ytdGrossProfit)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text2)' }}>{PCT(summary.grossMarginPct)}</td>
                  <td colSpan={3} style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text2)' }}>Ops expenses included</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981' }}>{NOK(summary.ytdNetProfit)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981' }}>{PCT(summary.netMarginPct)}</td>
                </tr>
              </tfoot>
            </table>
            <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text2)' }}>
              * Partial month (Jul 26, data through 31 Jul). COGS estimated at 53.6% of revenue. Platform fee 3% of revenue. Admin overhead NOK 25,000/month fixed.
            </p>
          </div>
        </div>

        {/* Quarterly summary cards */}
        <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Quarterly Highlights</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {quarters.map((q, i) => (
              <div key={i} style={{
                background: 'var(--navy3)', borderRadius: 8, padding: '14px 16px',
                border: q.quarter.includes('partial') ? '1px solid var(--gold)' : '1px solid transparent',
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--gold)' }}>
                  {q.quarter}{q.quarter.includes('partial') ? '' : ''}
                </div>
                <div style={{ fontSize: 13, marginBottom: 3 }}>Revenue: <strong>{NOK(q.revenue)}</strong></div>
                <div style={{ fontSize: 13, marginBottom: 3, color: '#10b981' }}>GP: <strong>{NOK(q.grossProfit)}</strong></div>
                <div style={{ fontSize: 13, marginBottom: 3, color: '#10b981' }}>Net: <strong>{NOK(q.netProfit)}</strong></div>
                <div style={{ marginTop: 6 }}>
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: q.netMarginPct >= 20 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    color: q.netMarginPct >= 20 ? '#10b981' : '#f59e0b',
                  }}>NM {PCT(q.netMarginPct)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
