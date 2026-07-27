import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import AdminLayout from '../../components/AdminLayout'
import { getAdminReferrals } from '../../api/mlmApi'

const RANKS = ['all', 'Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
const PER_PAGE = 15

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function pct(conv, clicks) {
  if (!clicks) return '0.0%'
  return ((conv / clicks) * 100).toFixed(1) + '%'
}

function RateBar({ value, max }) {
  const pctVal = max ? Math.round((value / max) * 100) : 0
  const color = pctVal >= 15 ? '#f59e0b' : pctVal >= 8 ? '#3b82f6' : '#6b7280'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px' }}>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pctVal)}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.4s' }} />
      </div>
      <span style={{ color: 'var(--cream)', fontSize: '12px', whiteSpace: 'nowrap', minWidth: '38px' }}>{value.toFixed(1)}%</span>
    </div>
  )
}

const CHART_COLORS = ['#c9a84c', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#14b8a6', '#f43f5e', '#64748b', '#8b5cf6', '#ec4899']

export default function Referrals() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('conversions30d')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await getAdminReferrals()
      setRows(res.referrals || [])
    } catch {}
    setLoading(false)
  }

  function toggleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
    setPage(1)
  }

  const filtered = rows.filter(r => {
    if (rankFilter !== 'all' && r.rank !== rankFilter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.memberName.toLowerCase().includes(q) ||
        r.memberId.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q)
      )
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortField] ?? 0
    const bv = b[sortField] ?? 0
    const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
    return sortDir === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PER_PAGE))
  const visible = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const totalClicks      = rows.reduce((s, r) => s + r.clicks30d, 0)
  const totalConversions = rows.reduce((s, r) => s + r.conversions30d, 0)
  const activeReferrers  = rows.filter(r => r.status === 'Active' && r.conversions30d > 0).length
  const avgRate          = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'
  const maxConvRate      = Math.max(...rows.map(r => r.clicks30d > 0 ? (r.conversions30d / r.clicks30d) * 100 : 0))

  const chartData = [...rows]
    .sort((a, b) => b.conversionsAll - a.conversionsAll)
    .slice(0, 10)
    .map(r => ({ name: r.memberName.split(' ')[0], conversions: r.conversionsAll, clicks: r.clicksAll }))

  function exportCsv() {
    const header = 'Member ID,Name,Rank,Status,Referral Code,Clicks (30d),Conv (30d),Rate (30d),Lifetime Clicks,Lifetime Conv,Lifetime Rate,Commissions Earned (MLMT),Last Conversion'
    const csvRows = sorted.map(r => [
      r.memberId, r.memberName, r.rank, r.status, r.referralCode,
      r.clicks30d, r.conversions30d,
      r.clicks30d > 0 ? ((r.conversions30d / r.clicks30d) * 100).toFixed(1) + '%' : '0.0%',
      r.clicksAll, r.conversionsAll,
      r.clicksAll > 0 ? ((r.conversionsAll / r.clicksAll) * 100).toFixed(1) + '%' : '0.0%',
      r.totalCommissionsEarned,
      fmtDate(r.lastConversionAt),
    ].join(','))
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `referral-stats-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  function SortTh({ field, label, style = {} }) {
    const active = sortField === field
    return (
      <th
        onClick={() => toggleSort(field)}
        style={{ padding: '10px 12px', textAlign: 'left', color: active ? 'var(--gold)' : 'var(--text2)', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none', ...style }}
      >
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  const rankColors = { Silver: '#c9a84c', Bronze: '#cd7f32', Gold: '#ffd700', Platinum: '#e5e7eb', Unranked: '#6b7280' }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--cream)', margin: 0 }}>Referral Tracking</h1>
        <button className="btn btn-outline" onClick={exportCsv} style={{ fontSize: '13px' }}>↓ Export CSV</button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Active Referrers', value: activeReferrers, icon: '🤝', sub: 'Converted in 30d' },
          { label: 'Clicks (30d)', value: totalClicks.toLocaleString(), icon: '👆', sub: 'Total link visits' },
          { label: 'Conversions (30d)', value: totalConversions.toLocaleString(), icon: '✅', sub: 'New signups via referral' },
          { label: 'Avg Conv. Rate', value: `${avgRate}%`, icon: '📈', sub: 'Clicks → signups' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{k.icon}</div>
            <div style={{ color: 'var(--cream)', fontWeight: '800', fontSize: '22px', marginBottom: '4px' }}>{k.value}</div>
            <div style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '2px' }}>{k.label}</div>
            <div style={{ color: 'var(--text2)', fontSize: '11px', opacity: 0.7 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Top Referrers chart */}
      {!loading && chartData.length > 0 && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--cream)', fontSize: '15px', fontWeight: '700', marginBottom: '20px' }}>Top Referrers — Lifetime Conversions</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                labelStyle={{ color: 'var(--cream)', fontWeight: '700' }}
                formatter={(val, name) => [val.toLocaleString(), name === 'conversions' ? 'Conversions' : 'Clicks']}
              />
              <Bar dataKey="conversions" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          placeholder="Search member, ID or code…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ flex: '1', minWidth: '200px' }}
        />
        <select className="input" value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }}>
          {RANKS.map(r => <option key={r} value={r}>{r === 'all' ? 'All Ranks' : r}</option>)}
        </select>
        <select className="input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }} style={{ width: 'auto', minWidth: '130px' }}>
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>No referral records found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <SortTh field="memberName"   label="Member" />
                <SortTh field="rank"         label="Rank" />
                <th style={{ padding: '10px 12px', color: 'var(--text2)', fontWeight: '600', whiteSpace: 'nowrap' }}>Referral Code</th>
                <SortTh field="clicks30d"       label="Clicks (30d)" />
                <SortTh field="conversions30d"  label="Conv (30d)" />
                <th style={{ padding: '10px 12px', color: 'var(--text2)', fontWeight: '600', whiteSpace: 'nowrap' }}>Rate (30d)</th>
                <SortTh field="conversionsAll"  label="Lifetime Conv" />
                <SortTh field="totalCommissionsEarned" label="Commissions" />
                <SortTh field="lastConversionAt" label="Last Conv" />
                <th style={{ padding: '10px 12px', color: 'var(--text2)', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(r => {
                const rate30d = r.clicks30d > 0 ? (r.conversions30d / r.clicks30d) * 100 : 0
                return (
                  <tr key={r.memberId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ color: 'var(--cream)', fontWeight: '600' }}>{r.memberName}</div>
                      <div style={{ color: 'var(--text2)', fontSize: '11px' }}>{r.memberId}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: rankColors[r.rank] || '#9ca3af', fontWeight: '700', fontSize: '12px' }}>{r.rank}</span>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--gold)', fontWeight: '700' }}>{r.referralCode}</td>
                    <td style={{ padding: '12px', color: 'var(--cream)', textAlign: 'right', paddingRight: '20px' }}>{r.clicks30d.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: 'var(--cream)', textAlign: 'right', paddingRight: '20px', fontWeight: '700' }}>{r.conversions30d}</td>
                    <td style={{ padding: '12px' }}>
                      <RateBar value={rate30d} max={maxConvRate} />
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text2)', textAlign: 'right', paddingRight: '20px' }}>{r.conversionsAll}</td>
                    <td style={{ padding: '12px', color: 'var(--cream)', textAlign: 'right', paddingRight: '20px' }}>{r.totalCommissionsEarned.toLocaleString()} MLMT</td>
                    <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(r.lastConversionAt)}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        background: r.status === 'Active' ? 'rgba(52,211,153,0.15)' : 'rgba(107,114,128,0.15)',
                        color: r.status === 'Active' ? '#34d399' : '#9ca3af',
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text2)', fontSize: '13px' }}>
              {filtered.length} referrer{filtered.length !== 1 ? 's' : ''} · Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
