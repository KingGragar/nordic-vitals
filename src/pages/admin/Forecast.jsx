import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  ComposedChart, AreaChart, Area, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { getAdminForecast } from '../../api/mlmApi'

const NOK  = v => 'NOK ' + Number(v).toLocaleString('en', { maximumFractionDigits: 0 })
const fmtK = v => {
  if (Math.abs(v) >= 1_000_000) return 'NOK ' + (v / 1_000_000).toFixed(2) + 'M'
  if (Math.abs(v) >= 1_000)     return 'NOK ' + (v / 1_000).toFixed(1) + 'K'
  return 'NOK ' + Number(v).toFixed(0)
}
const PCT = v => Number(v).toFixed(1) + '%'

const SCENARIOS = [
  { key: 'conservative', label: 'Conservative', color: '#64748b' },
  { key: 'base',         label: 'Base',         color: '#3b82f6' },
  { key: 'optimistic',   label: 'Optimistic',   color: '#10b981' },
]

const HORIZONS = [
  { label: '3 months',  value: 3  },
  { label: '6 months',  value: 6  },
  { label: '12 months', value: 12 },
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

const ChartTooltip = ({ active, payload, label, nok }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--navy3)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {nok ? fmtK(p.value) : p.value?.toLocaleString()}
        </div>
      ))}
    </div>
  )
}

function SustainabilityMeter({ ratio }) {
  const pct   = Math.min(100, ratio)
  const color = ratio < 40 ? '#10b981' : ratio < 60 ? '#f59e0b' : '#ef4444'
  const label = ratio < 40 ? 'Healthy' : ratio < 60 ? 'Monitor' : 'At Risk'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: 'var(--text2)' }}>Commission / Revenue ratio</span>
        <span style={{ fontWeight: 700, color }}>{PCT(ratio)} — {label}</span>
      </div>
      <div style={{ height: 12, background: 'var(--navy3)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 6, transition: 'width 0.4s' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)' }}>
        <span>0%</span><span>Safe &lt;40%</span><span>Warn &lt;60%</span><span>100%</span>
      </div>
    </div>
  )
}

export default function Forecast() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [horizon,  setHorizon]  = useState(6)
  const [scenario, setScenario] = useState('base')

  // Scenario sliders
  const [recruitRate, setRecruitRate] = useState(8)   // new members/month
  const [avgOrder,    setAvgOrder]    = useState(950)  // NOK

  useEffect(() => {
    setLoading(true)
    getAdminForecast({ horizon, recruitRate, avgOrder })
      .then(setData)
      .finally(() => setLoading(false))
  }, [horizon, recruitRate, avgOrder])

  if (loading || !data) {
    return (
      <AdminLayout>
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 15 }}>
          Loading forecast…
        </div>
      </AdminLayout>
    )
  }

  const months     = data.months.slice(0, horizon)
  const projMonths = months.filter(m => m.projected)
  const kpi        = data.kpi[scenario]

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1200 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>📈 Revenue & Growth Forecast</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text2)' }}>
              Forward-looking projections based on current growth trends and your scenario inputs.
              Mock data — projections will reflect live data once Arctico API is connected.
            </p>
          </div>

          {/* Horizon selector */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            {HORIZONS.map(h => (
              <button
                key={h.value}
                onClick={() => setHorizon(h.value)}
                style={{
                  padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13,
                  background: horizon === h.value ? 'var(--gold)' : 'var(--navy3)',
                  color: horizon === h.value ? '#0a0f1e' : 'var(--text1)', fontWeight: horizon === h.value ? 700 : 400,
                }}
              >{h.label}</button>
            ))}
          </div>
        </div>

        {/* Scenario tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {SCENARIOS.map(s => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              style={{
                padding: '7px 18px', borderRadius: 8, border: `2px solid ${s.color}`, cursor: 'pointer', fontSize: 13,
                background: scenario === s.key ? s.color : 'transparent',
                color: scenario === s.key ? '#fff' : s.color,
                fontWeight: 600,
              }}
            >{s.label}</button>
          ))}
          <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text2)', alignSelf: 'center' }}>
            Scenarios use fixed growth multipliers. Tune inputs below to calibrate the Base scenario.
          </span>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard
            label={`Revenue (${horizon}m)`}
            value={fmtK(kpi.totalRevenue)}
            sub={`Avg ${fmtK(kpi.totalRevenue / horizon)}/mo`}
            color="#c9a84c"
          />
          <KpiCard
            label={`Commission (${horizon}m)`}
            value={fmtK(kpi.totalCommission)}
            sub={`Avg ${fmtK(kpi.totalCommission / horizon)}/mo`}
            color="#a78bfa"
          />
          <KpiCard
            label="Net Profit (est.)"
            value={fmtK(kpi.totalRevenue - kpi.totalCommission - kpi.totalCogs)}
            sub={`COGS ~${fmtK(kpi.totalCogs)}`}
            color={kpi.totalRevenue - kpi.totalCommission - kpi.totalCogs > 0 ? '#10b981' : '#ef4444'}
          />
          <KpiCard
            label="Projected Members"
            value={kpi.endMembers.toLocaleString()}
            sub={`+${(kpi.endMembers - kpi.startMembers).toLocaleString()} new over ${horizon}m`}
            color="#3b82f6"
          />
          <KpiCard
            label="Comm/Revenue Ratio"
            value={PCT(kpi.avgCommRatio)}
            sub="Target: under 40%"
            color={kpi.avgCommRatio < 40 ? '#10b981' : kpi.avgCommRatio < 60 ? '#f59e0b' : '#ef4444'}
            note={kpi.avgCommRatio >= 60 ? '⚠ Adjust rates or recruitment speed' : undefined}
          />
          <KpiCard
            label="Break-Even Month"
            value={kpi.breakEvenMonth ?? 'Not in window'}
            sub="Month when cumulative profit turns positive"
            color="#f59e0b"
          />
        </div>

        {/* Sustainability meter */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15 }}>Plan Sustainability</h3>
          <SustainabilityMeter ratio={kpi.avgCommRatio} />
          <p style={{ margin: '12px 0 0', fontSize: 12, color: 'var(--text2)' }}>
            Commission-to-revenue ratio measures financial sustainability. Below 40% is healthy for MLM;
            above 60% is dangerous without very high order volumes. Configure rates in{' '}
            <a href="/admin/plan" style={{ color: 'var(--gold)' }}>Plan Config</a>.
          </p>
        </div>

        {/* Scenario input sliders */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15 }}>Scenario Inputs (Base)</h3>
          <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--text2)' }}>
            Adjust these assumptions to calibrate the Base scenario. Conservative = 0.6×, Optimistic = 1.6×.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13 }}>New members/month (Base)</label>
                <strong style={{ fontSize: 13, color: 'var(--gold)' }}>{recruitRate}</strong>
              </div>
              <input
                type="range" min={1} max={50} value={recruitRate}
                onChange={e => setRecruitRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                <span>1</span><span>25</span><span>50</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13 }}>Avg order value (NOK)</label>
                <strong style={{ fontSize: 13, color: 'var(--gold)' }}>NOK {avgOrder.toLocaleString()}</strong>
              </div>
              <input
                type="range" min={200} max={3000} step={50} value={avgOrder}
                onChange={e => setAvgOrder(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--gold)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                <span>NOK 200</span><span>NOK 1 500</span><span>NOK 3 000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue vs Commission chart */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 15 }}>Monthly Revenue vs. Commission Liability</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={months} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <YAxis tickFormatter={v => fmtK(v)} tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip nok />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {projMonths.length > 0 && (
                <ReferenceLine
                  x={projMonths[0].month}
                  stroke="var(--gold)"
                  strokeDasharray="4 4"
                  label={{ value: 'Forecast →', fill: 'var(--gold)', fontSize: 11, position: 'insideTopRight' }}
                />
              )}
              <Bar dataKey={`scenarios.${scenario}.revenue`}    name="Revenue"    fill="#c9a84c" opacity={0.9} radius={[3,3,0,0]} />
              <Bar dataKey={`scenarios.${scenario}.commission`} name="Commission" fill="#a78bfa" opacity={0.8} radius={[3,3,0,0]} />
              <Line dataKey={`scenarios.${scenario}.netProfit`} name="Net Profit" stroke="#10b981" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Member growth chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15 }}>Member Count Projection</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={months} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {projMonths.length > 0 && (
                  <ReferenceLine x={projMonths[0].month} stroke="var(--gold)" strokeDasharray="4 4" />
                )}
                <Area dataKey="scenarios.conservative.members" name="Conservative" stroke="#64748b" fill="#64748b" fillOpacity={0.15} strokeWidth={1} dot={false} />
                <Area dataKey="scenarios.base.members"         name="Base"         stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2}  strokeWidth={2} dot={false} />
                <Area dataKey="scenarios.optimistic.members"   name="Optimistic"   stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={1} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: 15 }}>Commission/Revenue Ratio Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={months} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--navy3)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <YAxis tickFormatter={v => v + '%'} tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => [PCT(v), '']} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <ReferenceLine y={40} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Safe 40%', fill: '#10b981', fontSize: 10 }} />
                <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Danger 60%', fill: '#ef4444', fontSize: 10 }} />
                {projMonths.length > 0 && (
                  <ReferenceLine x={projMonths[0].month} stroke="var(--gold)" strokeDasharray="4 4" />
                )}
                <Line dataKey={`scenarios.${scenario}.commRatio`} name="Comm/Revenue %" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Month-by-month table */}
        <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '20px 24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 15 }}>Month-by-Month Breakdown ({SCENARIOS.find(s => s.key === scenario)?.label})</h3>
            <button
              onClick={() => {
                const rows = months.map(m => {
                  const s = m.scenarios[scenario]
                  return [m.month, m.projected ? 'Projected' : 'Actual', s.members, NOK(s.revenue), NOK(s.commission), PCT(s.commRatio), NOK(s.netProfit)].join(',')
                })
                const csv = ['Month,Type,Members,Revenue,Commission,Comm %,Net Profit', ...rows].join('\n')
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
                a.download = `forecast-${scenario}-${horizon}m.csv`; a.click()
              }}
              style={{
                padding: '7px 14px', background: 'var(--navy3)', border: 'none',
                borderRadius: 6, color: 'var(--text1)', fontSize: 12, cursor: 'pointer',
              }}
            >⬇ CSV</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                  {['Month', 'Type', 'Members', 'Revenue', 'Commission', 'Comm %', 'Net Profit'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap', ':first-child': { textAlign: 'left' } }}
                        {...(h === 'Month' ? { style: { padding: '8px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600 } } : {})}
                    >{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((m, i) => {
                  const s = m.scenarios[scenario]
                  const profit = s.netProfit
                  return (
                    <tr key={m.month} style={{ borderBottom: '1px solid var(--navy3)', background: m.projected ? 'rgba(59,130,246,0.05)' : 'transparent' }}>
                      <td style={{ padding: '9px 12px', fontWeight: m.projected ? 400 : 600 }}>{m.month}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                        <span style={{
                          fontSize: 11, padding: '2px 8px', borderRadius: 4,
                          background: m.projected ? 'rgba(59,130,246,0.2)' : 'rgba(16,185,129,0.2)',
                          color: m.projected ? '#93c5fd' : '#6ee7b7',
                        }}>{m.projected ? 'Projected' : 'Actual'}</span>
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>{s.members.toLocaleString()}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: '#c9a84c' }}>{fmtK(s.revenue)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: '#a78bfa' }}>{fmtK(s.commission)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: s.commRatio < 40 ? '#10b981' : s.commRatio < 60 ? '#f59e0b' : '#ef4444' }}>
                        {PCT(s.commRatio)}
                      </td>
                      <td style={{ padding: '9px 12px', textAlign: 'right', color: profit >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {profit >= 0 ? '+' : ''}{fmtK(profit)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.6, padding: '12px 16px', background: 'var(--navy2)', borderRadius: 8, borderLeft: '3px solid var(--navy3)' }}>
          <strong>Disclaimer:</strong> All projections are illustrative estimates based on current mock data and the assumptions
          entered above. Actual results will vary. These forecasts do not constitute financial advice and should not be
          presented to investors, regulators, or third parties as guaranteed outcomes.
        </div>
      </div>
    </AdminLayout>
  )
}
