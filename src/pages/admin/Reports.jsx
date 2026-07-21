import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import {
  getAdminSummary, getAdminMembers,
  getAdminTopEarners, getAdminWeeklySignups, getAdminNetworkVolume,
} from '../../api/mlmApi'

const RANK_ORDER  = ['Platinum', 'Gold', 'Silver', 'Bronze', 'Unranked']
const RANK_COLORS = { Platinum: '#ffffff', Gold: '#c9a84c', Silver: '#aaaaaa', Bronze: '#cd7f32', Unranked: '#9ca3af' }

export default function Reports() {
  const [tokenSummary,  setTokenSummary]  = useState(null)
  const [members,       setMembers]       = useState(null)
  const [topEarners,    setTopEarners]    = useState(null)
  const [weeklyData,    setWeeklyData]    = useState(null)
  const [weeklyLoaded,  setWeeklyLoaded]  = useState(false)
  const [networkVol,    setNetworkVol]    = useState(null)

  useEffect(() => {
    getAdminSummary().then(d => setTokenSummary(d)).catch(() => {})
    getAdminMembers().then(d => setMembers(d.members || [])).catch(() => {})
    getAdminTopEarners({ limit: 5 }).then(d => setTopEarners(d.earners || [])).catch(() => {})
    getAdminWeeklySignups({ weeks: 8 })
      .then(d => setWeeklyData(d.weeks || []))
      .catch(() => {})
      .finally(() => setWeeklyLoaded(true))
    getAdminNetworkVolume().then(d => setNetworkVol(d)).catch(() => {})
  }, [])

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
        <div className="stat-card">
          <div className="label">Total Members</div>
          <div className="value">{totalMembers.toLocaleString()}</div>
          <div className="sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="label">Active MTD</div>
          <div className="value">{activeMembers.toLocaleString()}</div>
          <div className="sub">July 2026</div>
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
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          New Members per Week (last 8 weeks)
        </h2>
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

        {/* Rank distribution — derived from live members */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>
              Rank Distribution
              {members !== null && <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>live</span>}
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
          <div style={{ padding: '20px 20px 0', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>
              Top Earners — July 2026
              {topEarners !== null && <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 400, marginLeft: '8px' }}>live</span>}
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
