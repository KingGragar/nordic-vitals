import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getAdminSummary, getAdminMembers,
  getAdminTopEarners, getAdminWeeklySignups, getAdminNetworkVolume,
} from '../../api/mlmApi'

const RANK_ORDER  = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Unranked']
const RANK_COLORS = { Platinum: '#ffffff', Gold: '#c9a84c', Silver: '#aaaaaa', Bronze: '#cd7f32', Unranked: '#9ca3af' }

const PERIOD_OPTIONS = [
  { value: '4',  label: 'Last 4 weeks' },
  { value: '8',  label: 'Last 8 weeks' },
  { value: '12', label: 'Last 12 weeks' },
  { value: '26', label: 'Last 6 months' },
]

function downloadCSV(filename, rows, headers) {
  const escape = v => (v === null || v === undefined) ? '' : String(v).replace(/"/g, '""')
  const lines = [headers.join(','), ...rows.map(r => r.map(c => `"${escape(c)}"`).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function Reports() {
  const [tokenSummary,  setTokenSummary]  = useState(null)
  const [members,       setMembers]       = useState(null)
  const [topEarners,    setTopEarners]    = useState(null)
  const [weeklyData,    setWeeklyData]    = useState(null)
  const [weeklyLoaded,  setWeeklyLoaded]  = useState(false)
  const [networkVol,    setNetworkVol]    = useState(null)
  const [weeksBack,     setWeeksBack]     = useState('8')

  useEffect(() => {
    getAdminSummary().then(d => setTokenSummary(d)).catch(() => {})
    getAdminMembers().then(d => setMembers(d.members || [])).catch(() => {})
    getAdminTopEarners({ limit: 10 }).then(d => setTopEarners(d.earners || [])).catch(() => {})
    getAdminNetworkVolume().then(d => setNetworkVol(d)).catch(() => {})
  }, [])

  useEffect(() => {
    setWeeklyLoaded(false)
    setWeeklyData(null)
    getAdminWeeklySignups({ weeks: parseInt(weeksBack, 10) })
      .then(d => setWeeklyData(d.weeks || []))
      .catch(() => {})
      .finally(() => setWeeklyLoaded(true))
  }, [weeksBack])

  const totalMembers  = members !== null ? members.length : 847
  const activeMembers = members !== null ? members.filter(m => m.status === 'Active').length : 312

  const rankDist = useMemo(() => {
    if (!members || members.length === 0) return null
    const active = members.filter(m => m.status === 'Active')
    const counts = {}
    RANK_ORDER.forEach(r => { counts[r] = 0 })
    active.forEach(m => {
      const r = m.rank in counts ? m.rank : 'Unranked'
      counts[r]++
    })
    const totalActive = active.length || 1
    return RANK_ORDER.map(rank => ({
      rank,
      members: counts[rank],
      pct: ((counts[rank] / totalActive) * 100).toFixed(1) + '%',
      avgGV: active.filter(m => m.rank === rank).reduce((s, m, _, a) => s + (m.gv || 0) / a.length, 0).toLocaleString('en', { maximumFractionDigits: 0 }),
      color: RANK_COLORS[rank],
    }))
  }, [members])

  const chartData = weeklyData || []

  function handleExportRankDist() {
    const rows = (rankDist || []).map(r => [r.rank, r.members, r.pct, r.avgGV])
    downloadCSV(`rank-distribution-${new Date().toISOString().slice(0,10)}.csv`,
      rows, ['Rank', 'Members', '% of Active', 'Avg GV'])
  }

  function handleExportTopEarners() {
    const earners = topEarners || []
    const rows = earners.map((e, i) => [i + 1, e.name, e.user_id, e.total_commissions])
    downloadCSV(`top-earners-${new Date().toISOString().slice(0,10)}.csv`,
      rows, ['#', 'Member', 'ID', 'Commissions (MLMT)'])
  }

  function handleExportWeeklySignups() {
    if (!chartData.length) return
    const rows = chartData.map(w => [w.week, w.count])
    downloadCSV(`weekly-signups-${new Date().toISOString().slice(0,10)}.csv`,
      rows, ['Week', 'New Members'])
  }

  const btnStyle = {
    padding: '5px 12px', fontSize: '12px', fontWeight: 600,
    borderRadius: '6px', border: '1px solid var(--border)',
    background: 'var(--navy3)', color: 'var(--text2)',
    cursor: 'pointer',
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
          Reports
        </h1>
      </div>

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
        <div className="stat-card">
          <div className="label">Total Members</div>
          <div className="value">{totalMembers.toLocaleString()}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="label">Active MTD</div>
          <div className="value">{activeMembers.toLocaleString()}</div>
          <div className="sub">This month</div>
        </div>
        <div className="stat-card">
          <div className="label">Network Volume</div>
          <div className="value">{networkVol ? `${networkVol.network_pv.toLocaleString()} PV` : '—'}</div>
          <div className="sub">This cycle</div>
        </div>
        <div className="stat-card">
          <div className="label">Commissions Paid</div>
          <div className="value">{networkVol ? `${networkVol.commissions_paid_last_run.toLocaleString()} MLMT` : '—'}</div>
          <div className="sub">Last run</div>
        </div>
      </div>

      {/* New members chart */}
      <div style={{
        background: 'var(--navy2)', borderRadius: '12px',
        padding: '20px', marginBottom: '28px', border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
            New Members per Week
          </h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={weeksBack}
              onChange={e => setWeeksBack(e.target.value)}
              style={{
                padding: '4px 8px', fontSize: '12px', borderRadius: '6px',
                border: '1px solid var(--border)', background: 'var(--navy3)',
                color: 'var(--text)', cursor: 'pointer',
              }}
            >
              {PERIOD_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button style={btnStyle} onClick={handleExportWeeklySignups} disabled={!chartData.length}>
              Export CSV
            </button>
          </div>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e3450" />
              <XAxis dataKey="week" tick={{ fill: '#8a9bb0', fontSize: 12 }} axisLine={{ stroke: '#8a9bb0' }} tickLine={false} />
              <YAxis tick={{ fill: '#8a9bb0', fontSize: 12 }} axisLine={{ stroke: '#8a9bb0' }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12243a', border: '1px solid #1e3450', borderRadius: '8px', color: '#d1cec8', fontSize: '13px' }}
                cursor={{ fill: 'rgba(201,168,76,0.08)' }}
                labelStyle={{ color: '#c9a84c', fontWeight: 700 }}
              />
              <Bar dataKey="count" fill="#c9a84c" radius={[4, 4, 0, 0]} name="New Members" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
            {weeklyLoaded ? 'No signup data available yet.' : 'Loading…'}
          </div>
        )}
      </div>

      {/* Two-column: rank dist + top earners */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>

        {/* Rank distribution */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
              Rank Distribution
              {members !== null && <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>live</span>}
            </h2>
            <button style={btnStyle} onClick={handleExportRankDist} disabled={!rankDist}>
              Export CSV
            </button>
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
              {(rankDist || [
                { rank: 'Platinum', members: 3,   pct: '1.0%',  avgGV: '18,200', color: '#ffffff' },
                { rank: 'Gold',     members: 12,  pct: '3.8%',  avgGV: '7,400',  color: '#c9a84c' },
                { rank: 'Silver',   members: 47,  pct: '15.1%', avgGV: '3,100',  color: '#aaaaaa' },
                { rank: 'Bronze',   members: 89,  pct: '28.5%', avgGV: '890',    color: '#cd7f32' },
                { rank: 'Unranked', members: 161, pct: '51.6%', avgGV: '95',     color: '#9ca3af' },
              ]).map(row => (
                <tr key={row.rank}>
                  <td><span style={{ color: row.color, fontWeight: 600, fontSize: '13px' }}>{row.rank}</span></td>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
              Top Earners — July 2026
              {topEarners !== null && <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>live</span>}
            </h2>
            <button style={btnStyle} onClick={handleExportTopEarners} disabled={!topEarners}>
              Export CSV
            </button>
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
              {(topEarners || [
                { name: 'Lars Eriksen',  user_id: 'NV-10042', total_commissions: 2340 },
                { name: 'Mia Andersen',  user_id: 'NV-10087', total_commissions: 1890 },
                { name: 'Sigrid Voss',   user_id: 'NV-10230', total_commissions: 1440 },
                { name: 'Erik Solberg',  user_id: 'NV-10091', total_commissions: 980  },
                { name: 'Olaf Berg',     user_id: 'NV-10241', total_commissions: 670  },
              ]).map((e, i) => (
                <tr key={e.user_id}>
                  <td style={{ color: 'var(--text2)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{e.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{e.user_id}</td>
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{e.total_commissions.toLocaleString()} MLMT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  )
}
