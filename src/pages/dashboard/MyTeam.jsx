import { useState, useEffect, useMemo } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyTeam } from '../../api/mlmApi'

const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
const RANK_COLORS = {
  Unranked: '#6b7280',
  Bronze:   '#92400e',
  Silver:   '#6b7280',
  Gold:     '#d97706',
  Platinum: '#7c3aed',
}
const STATUS_COLORS = { Active: '#16a34a', Inactive: '#dc2626', Pending: '#d97706' }

const PER_PAGE = 20

function exportCSV(members) {
  const headers = ['ID', 'Name', 'Email', 'Level', 'Sponsor', 'Rank', 'PV', 'GV', 'Status', 'Last Activity', 'Joined']
  const rows = members.map(m => [
    m.id, m.name, m.email, m.level, m.sponsor, m.rank, m.pv, m.gv, m.status, m.lastActivity, m.joined
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `my-team-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function MyTeam() {
  const { user } = useAuth()
  const memberId = user?.memberId ?? 'NV-10042'

  const [allMembers, setAllMembers] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [rankFilter, setRankFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [levelFilter, setLevelFilter]   = useState('All')
  const [sortKey, setSortKey]   = useState('gv')
  const [sortDir, setSortDir]   = useState('desc')
  const [page, setPage]         = useState(1)

  useEffect(() => {
    setLoading(true)
    getMyTeam(memberId)
      .then(d => setAllMembers(d.members ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [memberId])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const filtered = useMemo(() => {
    let list = [...allMembers]
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q))
    }
    if (rankFilter !== 'All') list = list.filter(m => m.rank === rankFilter)
    if (statusFilter !== 'All') list = list.filter(m => m.status === statusFilter)
    if (levelFilter === 'Direct') list = list.filter(m => m.level === 1)
    else if (levelFilter === 'Level 2') list = list.filter(m => m.level === 2)
    else if (levelFilter === 'Level 3+') list = list.filter(m => m.level >= 3)
    list.sort((a, b) => {
      let av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [allMembers, search, rankFilter, statusFilter, levelFilter, sortKey, sortDir])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const pageRows   = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const kpi = useMemo(() => ({
    total:    allMembers.length,
    active:   allMembers.filter(m => m.status === 'Active').length,
    totalGV:  allMembers.reduce((s, m) => s + (m.gv || 0), 0),
    maxLevel: allMembers.reduce((max, m) => Math.max(max, m.level || 0), 0),
  }), [allMembers])

  const rankDist = useMemo(() => {
    const counts = {}
    RANK_ORDER.forEach(r => { counts[r] = 0 })
    allMembers.forEach(m => { if (counts[m.rank] !== undefined) counts[m.rank]++ })
    return counts
  }, [allMembers])

  function SortHeader({ col, label }) {
    const active = sortKey === col
    return (
      <th onClick={() => toggleSort(col)} style={{ cursor: 'pointer', whiteSpace: 'nowrap', padding: '10px 12px', textAlign: 'left', userSelect: 'none' }}>
        {label} {active ? (sortDir === 'asc' ? '▲' : '▼') : <span style={{ opacity: 0.3 }}>▲▼</span>}
      </th>
    )
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>👥 My Team</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>Your full downline — search, filter, and track everyone in your network.</p>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Members', value: kpi.total, icon: '👥' },
            { label: 'Active Members', value: kpi.active, icon: '✅' },
            { label: 'Team GV (MLMT)', value: kpi.totalGV.toLocaleString(), icon: '📊' },
            { label: 'Deepest Level', value: kpi.maxLevel ? `L${kpi.maxLevel}` : '—', icon: '🌊' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--border,#e5e7eb)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 22 }}>{c.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, margin: '4px 0 2px' }}>{loading ? '…' : c.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Rank distribution mini-bar */}
        {!loading && kpi.total > 0 && (
          <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--border,#e5e7eb)', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Rank breakdown:</span>
            {RANK_ORDER.filter(r => rankDist[r] > 0).map(r => (
              <span key={r} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: RANK_COLORS[r], display: 'inline-block' }} />
                {r} <strong>{rankDist[r]}</strong>
              </span>
            ))}
          </div>
        )}

        {/* Search & Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, ID, or email…"
            style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border,#e5e7eb)', fontSize: 14, background: 'var(--input-bg,#fff)', color: 'inherit' }}
          />
          <select value={rankFilter} onChange={e => { setRankFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border,#e5e7eb)', fontSize: 14, background: 'var(--input-bg,#fff)', color: 'inherit' }}>
            <option value="All">All Ranks</option>
            {RANK_ORDER.map(r => <option key={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border,#e5e7eb)', fontSize: 14, background: 'var(--input-bg,#fff)', color: 'inherit' }}>
            <option value="All">All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
          <select value={levelFilter} onChange={e => { setLevelFilter(e.target.value); setPage(1) }}
            style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border,#e5e7eb)', fontSize: 14, background: 'var(--input-bg,#fff)', color: 'inherit' }}>
            <option value="All">All Levels</option>
            <option value="Direct">Direct (L1)</option>
            <option value="Level 2">Level 2</option>
            <option value="Level 3+">Level 3+</option>
          </select>
          <button onClick={() => exportCSV(filtered)}
            style={{ padding: '8px 14px', borderRadius: 7, border: '1px solid var(--border,#e5e7eb)', background: 'var(--input-bg,#fff)', cursor: 'pointer', fontSize: 14, color: 'inherit' }}>
            ⬇ Export CSV
          </button>
          <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 4 }}>{filtered.length} members</span>
        </div>

        {/* Table */}
        <div style={{ background: 'var(--card-bg,#fff)', border: '1px solid var(--border,#e5e7eb)', borderRadius: 10, overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#6b7280' }}>Loading your team…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>No team members found</div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>
                {allMembers.length === 0 ? 'Start recruiting to build your team!' : 'Try adjusting your filters.'}
              </div>
            </div>
          ) : (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--table-header,#f9fafb)', borderBottom: '2px solid var(--border,#e5e7eb)' }}>
                    <SortHeader col="name" label="Name" />
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>ID</th>
                    <SortHeader col="level" label="Level" />
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Sponsor</th>
                    <SortHeader col="rank" label="Rank" />
                    <SortHeader col="pv" label="PV" />
                    <SortHeader col="gv" label="GV" />
                    <th style={{ padding: '10px 12px', textAlign: 'left' }}>Status</th>
                    <SortHeader col="lastActivity" label="Last Activity" />
                    <SortHeader col="joined" label="Joined" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border,#e5e7eb)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt,rgba(0,0,0,.02))' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 500 }}>{m.name}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{m.id}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 4, padding: '2px 7px', fontSize: 12, fontWeight: 600 }}>
                          L{m.level}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>{m.sponsor}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: RANK_COLORS[m.rank] + '22', color: RANK_COLORS[m.rank], borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 600 }}>
                          {m.rank}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.pv}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.gv.toLocaleString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ color: STATUS_COLORS[m.status] || '#6b7280', fontWeight: 600, fontSize: 12 }}>
                          {m.status === 'Active' ? '● ' : '○ '}{m.status}
                        </span>
                        {m.status === 'Inactive' && (
                          <div style={{ color: '#f97316', fontSize: 11, marginTop: 2 }}>⚠ At risk</div>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>{m.lastActivity ?? '—'}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 12 }}>{m.joined}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '14px 0', borderTop: '1px solid var(--border,#e5e7eb)' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border,#e5e7eb)', cursor: page === 1 ? 'default' : 'pointer', opacity: page === 1 ? 0.4 : 1, background: 'var(--input-bg,#fff)', color: 'inherit' }}>
                    ← Prev
                  </button>
                  <span style={{ fontSize: 14, color: '#6b7280' }}>Page {page} of {totalPages}</span>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border,#e5e7eb)', cursor: page === totalPages ? 'default' : 'pointer', opacity: page === totalPages ? 0.4 : 1, background: 'var(--input-bg,#fff)', color: 'inherit' }}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Help tip */}
        {!loading && allMembers.length > 0 && (
          <p style={{ marginTop: 14, color: '#6b7280', fontSize: 13 }}>
            💡 Tip: Sort by <strong>Last Activity</strong> to spot team members who need re-engagement. Sort by <strong>GV</strong> to find your top producers.
          </p>
        )}
      </div>
    </DashboardLayout>
  )
}
