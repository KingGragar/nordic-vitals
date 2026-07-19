/**
 * Earnings.jsx — Member back-office earnings dashboard
 * Mock data · GET /v1/mlm/admin/earnings/:userId wires live when Arctico ships it
 */

import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import DashboardLayout from '../../components/DashboardLayout'

// ── Mock data (swap for API response from GET /v1/mlm/admin/earnings/:userId) ─
const MOCK_EARNINGS = {
  this_period: 905,
  to_date: 8420,
  projected: 1240,
  by_bonus_type: { pairing: 450, matching: 175, direct: 175, override: 35, pool: 220 },
  weekly_series: [
    { week: 'May 26', pairing: 380, matching: 120, direct: 140, override: 20, pool: 180 },
    { week: 'Jun 2',  pairing: 450, matching: 155, direct: 175, override: 30, pool: 210 },
    { week: 'Jun 9',  pairing: 310, matching: 90,  direct: 120, override: 15, pool: 160 },
    { week: 'Jun 16', pairing: 520, matching: 180, direct: 200, override: 40, pool: 240 },
    { week: 'Jun 23', pairing: 410, matching: 130, direct: 160, override: 25, pool: 195 },
    { week: 'Jun 30', pairing: 620, matching: 210, direct: 230, override: 50, pool: 280 },
    { week: 'Jul 7',  pairing: 480, matching: 165, direct: 185, override: 38, pool: 220 },
    { week: 'Jul 13', pairing: 450, matching: 175, direct: 175, override: 35, pool: 220 },
  ],
  cumulative_series: [820, 1745, 2530, 3690, 4610, 5970, 7058, 8420],
  leg_balance: { left_bv: 1840, right_bv: 1210, left_carry: 640, right_carry: 0 },
  downline_growth: [
    { week: 'May 26', left: 2, right: 1 },
    { week: 'Jun 2',  left: 3, right: 1 },
    { week: 'Jun 9',  left: 3, right: 2 },
    { week: 'Jun 16', left: 4, right: 2 },
    { week: 'Jun 23', left: 5, right: 2 },
    { week: 'Jun 30', left: 6, right: 3 },
    { week: 'Jul 7',  left: 7, right: 4 },
    { week: 'Jul 13', left: 8, right: 4 },
  ],
  rank: { current: 'Silver', next: 'Gold', progress_pct: 58 },
}

// ── Colour palette ─────────────────────────────────────────────────────────────
const BONUS_COLORS = {
  pairing:  '#6366f1',
  matching: '#22c55e',
  direct:   '#f59e0b',
  override: '#ec4899',
  pool:     '#06b6d4',
}

const CHART_THEME = {
  gridStroke: '#1e3450',
  labelFill:  '#8a9bb0',
  tooltipBg:  '#12243a',
  tooltipBorder: '#1e3450',
}

// ── Shared recharts tooltip style ──────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: CHART_THEME.tooltipBg,
    border: `1px solid ${CHART_THEME.tooltipBorder}`,
    borderRadius: '8px',
    fontSize: '12px',
    color: '#d1cec8',
  },
  itemStyle: { color: '#d1cec8' },
  labelStyle: { color: '#8a9bb0', fontWeight: 600, marginBottom: '4px' },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Section({ title, children, style }) {
  return (
    <div style={{
      background: 'var(--navy2)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px 22px',
      ...style,
    }}>
      {title && (
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px', letterSpacing: '0.02em' }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

function StatCard({ label, value, sub, valueColor = 'var(--cream)', accent }) {
  return (
    <div className="stat-card" style={{
      background: 'var(--navy2)',
      border: `1px solid ${accent || 'var(--border)'}`,
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      flex: '1 1 180px',
      minWidth: 0,
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: valueColor, lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{sub}</div>}
    </div>
  )
}

function LegMeter({ label, bv, carry, color, warn }) {
  const maxBv = 2400
  const pct = Math.min((bv / maxBv) * 100, 100)
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700, color: color }}>{label}</span>
        <span style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{bv.toLocaleString()} BV</span>
      </div>

      {/* BV bar */}
      <div style={{ height: '10px', background: 'var(--navy3)', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color, borderRadius: '999px',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Carryover row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
        <span style={{ color: 'var(--text2)' }}>Carryover</span>
        <span style={{ color: carry > 0 ? color : 'var(--text2)', fontWeight: 600 }}>
          {carry.toLocaleString()} BV
        </span>
      </div>

      {/* Flush warning */}
      {warn && (
        <div style={{
          marginTop: '10px', padding: '8px 12px',
          background: '#422006', border: '1px solid #92400e',
          borderRadius: '7px', fontSize: '11px', color: '#fcd34d',
        }}>
          Carryover flushed — right leg BV did not exceed threshold. Build your right leg this cycle to avoid another flush.
        </div>
      )}
    </div>
  )
}

const PLAN_TYPES = [
  { value: 'binary',        label: 'Binary' },
  { value: 'breakaway',     label: 'Breakaway' },
  { value: 'forced_matrix', label: 'Forced Matrix' },
]

// ── Main page ──────────────────────────────────────────────────────────────────
export default function EarningsPage() {
  const [data] = useState(MOCK_EARNINGS)
  const [planType, setPlanType] = useState('binary')

  // Build cumulative series as array of objects for recharts
  const cumulativeSeries = data.weekly_series.map((w, i) => ({
    week: w.week,
    total: data.cumulative_series[i],
  }))

  const { leg_balance, rank } = data
  const leftFlush = leg_balance.left_carry === 0
  const rightFlush = leg_balance.right_carry === 0

  return (
    <DashboardLayout>
      {/* Page header */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
              Earnings
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
              Mock data · GET /v1/mlm/admin/earnings/:userId wires live when Arctico ships it · {planType}
            </p>
          </div>
        </div>
      </div>

      {/* Plan type selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '16px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '4px' }}>
          Plan type
        </span>
        {PLAN_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPlanType(value)}
            style={{
              padding: '4px 14px',
              borderRadius: '999px',
              border: planType === value ? '1px solid #c9a84c' : '1px solid var(--border)',
              background: planType === value ? '#c9a84c22' : 'transparent',
              color: planType === value ? '#c9a84c' : 'var(--text2)',
              fontSize: '12px',
              fontWeight: planType === value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text2)', fontStyle: 'italic' }}>
          Live data wires when /earnings/:userId ships
        </span>
      </div>

      {/* ── 1. Hero KPI row ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <StatCard
          label="This Week"
          value={`${data.this_period.toLocaleString()} MLMT`}
          sub="Current period"
          valueColor="#22c55e"
          accent="#166534"
        />
        <StatCard
          label="Total To-Date"
          value={`${data.to_date.toLocaleString()} MLMT`}
          sub="All time"
          valueColor="#c9a84c"
          accent="#78350f"
        />
        <StatCard
          label="Projected"
          value={`${data.projected.toLocaleString()} MLMT`}
          sub="↑ 37% above current pace"
          valueColor="var(--cream)"
        />
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          flex: '1 1 180px',
          minWidth: 0,
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>
            Rank
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#c0c8d8' }}>{rank.current}</span>
            <span style={{ color: 'var(--text2)' }}>→</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#c9a84c' }}>{rank.next}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--navy3)', borderRadius: '999px', overflow: 'hidden', marginBottom: '6px' }}>
            <div style={{
              width: `${rank.progress_pct}%`, height: '100%',
              background: 'linear-gradient(90deg, #c9a84c, #e8c96a)',
              borderRadius: '999px',
            }} />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{rank.progress_pct}% to {rank.next}</div>
        </div>
      </div>

      {/* ── 2 + 3. Charts row ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', marginBottom: '16px' }}>

        {/* Weekly stacked bar */}
        <Section title="Weekly Earnings by Bonus Type">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.weekly_series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} />
              <XAxis dataKey="week" tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} />
              <YAxis tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} />
              <Tooltip
                {...tooltipStyle}
                formatter={(val, name) => [`${val} MLMT`, name.charAt(0).toUpperCase() + name.slice(1)]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text2)' }} />
              {Object.entries(BONUS_COLORS).map(([key, color]) => (
                <Bar key={key} dataKey={key} stackId="a" fill={color} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Cumulative line */}
        <Section title="Cumulative Earnings">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={cumulativeSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} />
              <XAxis dataKey="week" tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} />
              <YAxis tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} />
              <Tooltip
                {...tooltipStyle}
                formatter={(val) => [`${val.toLocaleString()} MLMT`, 'Cumulative']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#c9a84c"
                strokeWidth={2.5}
                dot={{ fill: '#c9a84c', r: 3 }}
                activeDot={{ r: 5, fill: '#e8c96a' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Section>
      </div>

      {/* ── 4. Leg / structure balance ───────────────────────────────────────── */}
      {planType === 'binary' ? (
        <Section title="Binary Leg Balance" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            <LegMeter
              label="Left Leg"
              bv={leg_balance.left_bv}
              carry={leg_balance.left_carry}
              color="#3b82f6"
              warn={leftFlush}
            />
            <div style={{ width: '1px', background: 'var(--border)', alignSelf: 'stretch' }} />
            <LegMeter
              label="Right Leg"
              bv={leg_balance.right_bv}
              carry={leg_balance.right_carry}
              color="#22c55e"
              warn={rightFlush}
            />
          </div>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text2)' }}>
            Left carry advantage: <span style={{ color: '#3b82f6', fontWeight: 600 }}>
              +{(leg_balance.left_carry - leg_balance.right_carry).toLocaleString()} BV
            </span> — pairs will draw from the left leg carryover first in the next cycle.
          </div>
        </Section>
      ) : (
        <Section
          title={planType === 'breakaway' ? 'Breakaway Structure' : 'Matrix Position'}
          style={{ marginBottom: '16px' }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '18px 0', color: 'var(--text2)', fontSize: '13px',
          }}>
            <span style={{ fontSize: '20px', opacity: 0.4 }}>
              {planType === 'breakaway' ? '🌲' : '⊞'}
            </span>
            <span>
              {planType === 'breakaway'
                ? 'Breakaway volume legs and generation overrides will appear here when GET /v1/mlm/admin/earnings/:userId ships.'
                : 'Matrix position, spillover, and cycle data will appear here when GET /v1/mlm/admin/earnings/:userId ships.'}
            </span>
          </div>
        </Section>
      )}

      {/* ── 5 + 6. Downline growth + rank progress ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', marginBottom: '16px' }}>

        {/* Downline growth */}
        <Section title="Downline Growth">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.downline_growth} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_THEME.gridStroke} />
              <XAxis dataKey="week" tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} />
              <YAxis tick={{ fill: CHART_THEME.labelFill, fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                {...tooltipStyle}
                formatter={(val, name) => [`${val} members`, name.charAt(0).toUpperCase() + name.slice(1) + ' leg']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: 'var(--text2)' }} />
              <Line type="monotone" dataKey="left"  stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 3 }} activeDot={{ r: 5 }} name="Left" />
              <Line type="monotone" dataKey="right" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} name="Right" />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* Rank progress */}
        <Section title="Next Rank Progress">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Current rank</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#c0c8d8' }}>{rank.current}</div>
            </div>
            <div style={{ fontSize: '28px', color: 'var(--border)' }}>→</div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>Target rank</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#c9a84c' }}>{rank.next}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
              <span>Progress</span>
              <span style={{ color: '#c9a84c', fontWeight: 700 }}>{rank.progress_pct}%</span>
            </div>
            <div style={{ height: '12px', background: 'var(--navy3)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{
                width: `${rank.progress_pct}%`, height: '100%',
                background: 'linear-gradient(90deg, #c9a84c 0%, #e8c96a 100%)',
                borderRadius: '999px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>

          {/* Rank requirement breakdown (illustrative, plan-specific) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {(planType === 'binary' ? [
              { req: 'Personal Volume (PV)', current: '580 PV',    target: '500 PV',    met: true  },
              { req: 'Left Leg BV',          current: '1,840 BV',  target: '2,500 BV',  met: false },
              { req: 'Right Leg BV',         current: '1,210 BV',  target: '2,500 BV',  met: false },
              { req: 'Active Downline',      current: '12',        target: '10',        met: true  },
            ] : planType === 'breakaway' ? [
              { req: 'Personal Volume (PV)',  current: '580 PV',    target: '500 PV',    met: true  },
              { req: 'Group Sales Volume',    current: '3,050 GV',  target: '5,000 GV',  met: false },
              { req: 'Active Legs',           current: '2',         target: '3',         met: false },
              { req: 'Active Downline',       current: '12',        target: '10',        met: true  },
            ] : [
              { req: 'Personal Volume (PV)',  current: '580 PV',    target: '500 PV',    met: true  },
              { req: 'Matrix Positions Filled', current: '8',       target: '10',        met: false },
              { req: 'Cycle Count',           current: '1',         target: '2',         met: false },
              { req: 'Active Downline',       current: '12',        target: '10',        met: true  },
            ]).map(({ req, current, target, met }) => (
              <div key={req} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text2)' }}>
                  <span style={{ color: met ? '#22c55e' : '#64748b', fontSize: '10px' }}>{met ? '✓' : '○'}</span>
                  {req}
                </div>
                <span style={{ color: met ? '#22c55e' : 'var(--text)', fontWeight: 600 }}>
                  {current}
                  <span style={{ color: 'var(--text2)', fontWeight: 400 }}> / {target}</span>
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '18px', padding: '10px 14px',
            background: 'var(--navy3)', border: '1px solid var(--border)',
            borderRadius: '8px', fontSize: '12px', color: 'var(--text2)',
          }}>
            Rank thresholds are illustrative — exact Gold requirements will be confirmed in the Arctico rank table.
          </div>
        </Section>
      </div>

      {/* ── Bonus type breakdown (mini bar) ─────────────────────────────────── */}
      <Section title="This Period — Bonus Breakdown">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {Object.entries(data.by_bonus_type).map(([type, amount]) => {
            const color = BONUS_COLORS[type]
            const pct = Math.round((amount / data.this_period) * 100)
            return (
              <div key={type} style={{
                flex: '1 1 140px', minWidth: 0,
                background: 'var(--navy3)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: color, fontWeight: 700, textTransform: 'capitalize' }}>{type}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text2)' }}>{pct}%</span>
                </div>
                <div style={{ height: '5px', background: 'var(--navy2)', borderRadius: '999px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px' }} />
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--cream)' }}>
                  {amount.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400 }}>MLMT</span>
                </div>
              </div>
            )
          })}
        </div>
      </Section>
    </DashboardLayout>
  )
}
