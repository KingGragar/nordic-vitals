import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAdminSummary } from '../../api/mlmApi'

const WEEKLY_DATA = [
  { week: 'May 26', count: 12 },
  { week: 'Jun 2',  count: 18 },
  { week: 'Jun 9',  count: 9  },
  { week: 'Jun 16', count: 24 },
  { week: 'Jun 23', count: 15 },
  { week: 'Jun 30', count: 31 },
  { week: 'Jul 7',  count: 22 },
  { week: 'Jul 13', count: 14 },
]

const RANK_DIST = [
  { rank: 'Platinum', members: 3,   pct: '1.0%',  avgGV: '18,200', color: '#ffffff' },
  { rank: 'Gold',     members: 12,  pct: '3.8%',  avgGV: '7,400',  color: '#c9a84c' },
  { rank: 'Silver',   members: 47,  pct: '15.1%', avgGV: '3,100',  color: '#aaaaaa' },
  { rank: 'Bronze',   members: 89,  pct: '28.5%', avgGV: '890',    color: '#cd7f32' },
  { rank: 'Unranked', members: 161, pct: '51.6%', avgGV: '95',     color: '#9ca3af' },
]

const TOP_EARNERS = [
  { name: 'Lars Eriksen',  id: 'NV-10042', amount: '2,340' },
  { name: 'Mia Andersen',  id: 'NV-10087', amount: '1,890' },
  { name: 'Sigrid Voss',   id: 'NV-10230', amount: '1,440' },
  { name: 'Erik Solberg',  id: 'NV-10091', amount: '980'   },
  { name: 'Olaf Berg',     id: 'NV-10241', amount: '670'   },
]

const KPI_CARDS = [
  { label: 'Total Members',        value: '847',        sub: 'All time' },
  { label: 'Active MTD',           value: '312',        sub: 'July 2026' },
  { label: 'Network Volume',       value: '42,800 PV',  sub: 'This cycle' },
  { label: 'Commissions Paid',     value: '18,400 MLMT', sub: 'Last run' },
]

export default function Reports() {
  const [tokenSummary, setTokenSummary] = useState(null)

  useEffect(() => {
    getAdminSummary().then(d => setTokenSummary(d)).catch(() => {})
  }, [])

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Reports
      </h1>

      {/* MLMT Token summary */}
      {tokenSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <div className="stat-card" style={{ borderColor: '#92400e' }}>
            <div className="label">MLMT Total Supply</div>
            <div className="value" style={{ color: 'var(--gold)' }}>{tokenSummary.total_supply?.toLocaleString()}</div>
            <div className="sub">Ledger-only · testnet</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#92400e' }}>
            <div className="label">Token Holders</div>
            <div className="value" style={{ color: 'var(--gold)' }}>{tokenSummary.holders}</div>
            <div className="sub">Active wallets</div>
          </div>
          <div className="stat-card" style={{ borderColor: '#92400e' }}>
            <div className="label">Total Bonus Paid</div>
            <div className="value" style={{ color: 'var(--gold)' }}>{tokenSummary.total_bonus_paid?.toLocaleString()} MLMT</div>
            <div className="sub">All time</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {KPI_CARDS.map(kpi => (
          <div key={kpi.label} className="stat-card">
            <div className="label">{kpi.label}</div>
            <div className="value">{kpi.value}</div>
            <div className="sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* New members chart */}
      <div
        style={{
          background: 'var(--navy2)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '28px',
          border: '1px solid var(--border)',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          New Members per Week (last 8 weeks)
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={WEEKLY_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3450" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#8a9bb0', fontSize: 12 }}
              axisLine={{ stroke: '#8a9bb0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8a9bb0', fontSize: 12 }}
              axisLine={{ stroke: '#8a9bb0' }}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#12243a',
                border: '1px solid #1e3450',
                borderRadius: '8px',
                color: '#d1cec8',
                fontSize: '13px',
              }}
              cursor={{ fill: 'rgba(201,168,76,0.08)' }}
              labelStyle={{ color: '#c9a84c', fontWeight: 700 }}
            />
            <Bar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} name="New Members" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Two-column section: rank dist + top earners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

        {/* Rank distribution */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>
              Rank Distribution
            </h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Members</th>
                <th>% of Active</th>
                <th>Avg GV</th>
              </tr>
            </thead>
            <tbody>
              {RANK_DIST.map(row => (
                <tr key={row.rank}>
                  <td>
                    <span style={{ color: row.color, fontWeight: 600, fontSize: '13px' }}>
                      {row.rank}
                    </span>
                  </td>
                  <td>{row.members}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{row.pct}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{row.avgGV}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top earners */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>
              Top Earners — July 2026
            </h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Member</th>
                <th>ID</th>
                <th>Commissions</th>
              </tr>
            </thead>
            <tbody>
              {TOP_EARNERS.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ color: 'var(--text2)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{e.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{e.id}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{e.amount} MLMT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  )
}
