import { useState, useMemo, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { ADMIN_MEMBERS } from '../../data/mock'
import { getAdminMembers } from '../../api/mlmApi'

const PAGE_SIZE = 20

const RANK_COLORS = {
  Unranked: '#9ca3af',
  Bronze:   '#cd7f32',
  Silver:   '#aaaaaa',
  Gold:     '#c9a84c',
  Platinum: '#ffffff',
}

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', lineHeight: 1, cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  )
}

function MemberModal({ member, onClose, onToast }) {
  if (!member) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '520px', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'none', border: 'none', color: 'var(--text2)',
            fontSize: '20px', lineHeight: 1, cursor: 'pointer',
          }}
        >
          ×
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          Member Details
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '24px' }}>
          {[
            ['Name',    member.name],
            ['ID',      member.id],
            ['Sponsor chain', `${member.sponsor} → NV-00010`],
            ['Rank',    <span style={{ color: RANK_COLORS[member.rank] || '#9ca3af', fontWeight: 600 }}>{member.rank}</span>],
            ['PV',      member.pv],
            ['GV',      member.gv],
            ['Status',  <span className={member.status === 'Active' ? 'badge badge-green' : 'badge badge-red'}>{member.status}</span>],
            ['Joined',  member.joined],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                {label}
              </div>
              <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 500 }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onToast('Feature coming soon')}
          >
            Move in Tree
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onToast('Password reset email sent')}
          >
            Reset Password
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onToast('Feature coming soon')}
          >
            Suspend Account
          </button>
        </div>
      </div>
    </div>
  )
}

function exportCsv(members) {
  const headers = ['Name', 'ID', 'Sponsor', 'Rank', 'PV', 'GV', 'Status', 'Joined']
  const rows = members.map(m => [
    m.name, m.id, m.sponsor, m.rank, m.pv, m.gv, m.status, m.joined,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `nordic-vitals-members-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']

function cmpRank(a, b) {
  return RANK_ORDER.indexOf(a.rank) - RANK_ORDER.indexOf(b.rank)
}

export default function Members() {
  const [members, setMembers]       = useState(ADMIN_MEMBERS)
  const [search, setSearch]         = useState('')
  const [rankFilter, setRankFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMember, setViewMember] = useState(null)
  const [toast, setToast]           = useState(null)
  const [page, setPage]             = useState(1)
  const [sortCol, setSortCol]       = useState('name')
  const [sortDir, setSortDir]       = useState('asc')

  useEffect(() => {
    getAdminMembers()
      .then(d => { if (d?.members?.length) setMembers(d.members) })
      .catch(() => {})
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function toggleStatus(id) {
    setMembers(prev =>
      prev.map(m =>
        m.id === id
          ? { ...m, status: m.status === 'Active' ? 'Inactive' : 'Active' }
          : m
      )
    )
  }

  function handleSort(col) {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  function sortIndicator(col) {
    if (col !== sortCol) return <span style={{ color: 'var(--border)', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: 'var(--gold)', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const filtered = useMemo(() => {
    setPage(1)
    const base = members.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.sponsor.toLowerCase().includes(q)
      const matchRank   = rankFilter === 'All' || m.rank === rankFilter
      const matchStatus = statusFilter === 'All' || m.status === statusFilter
      return matchSearch && matchRank && matchStatus
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return [...base].sort((a, b) => {
      if (sortCol === 'rank')   return dir * cmpRank(a, b)
      if (sortCol === 'pv')     return dir * (a.pv - b.pv)
      if (sortCol === 'gv')     return dir * (a.gv - b.gv)
      if (sortCol === 'joined') return dir * a.joined.localeCompare(b.joined)
      if (sortCol === 'status') return dir * a.status.localeCompare(b.status)
      return dir * String(a[sortCol] ?? '').localeCompare(String(b[sortCol] ?? ''))
    })
  }, [members, search, rankFilter, statusFilter, sortCol, sortDir])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <AdminLayout>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)' }}>
          Member Management
        </h1>
        <span className="badge badge-blue">{filtered.length} members</span>
        <button
          className="btn btn-outline btn-sm"
          style={{ marginLeft: 'auto' }}
          onClick={() => { exportCsv(filtered); showToast(`Exported ${filtered.length} members to CSV`) }}
          title="Download filtered members as CSV"
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: '280px' }}
          placeholder="Search name, ID, or sponsor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input"
          style={{ maxWidth: '160px' }}
          value={rankFilter}
          onChange={e => setRankFilter(e.target.value)}
        >
          <option value="All">All Ranks</option>
          <option value="Unranked">Unranked</option>
          <option value="Bronze">Bronze</option>
          <option value="Silver">Silver</option>
          <option value="Gold">Gold</option>
          <option value="Platinum">Platinum</option>
        </select>
        <div style={{ display: 'flex', gap: '4px' }}>
          {['All', 'Active', 'Inactive'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="btn btn-sm"
              style={{
                background: statusFilter === s ? 'var(--navy3)' : 'transparent',
                border: `1px solid ${statusFilter === s ? 'var(--gold)' : 'var(--border)'}`,
                color: statusFilter === s ? 'var(--gold)' : 'var(--text2)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {[
                ['name',   'Name'],
                ['id',     'ID'],
                ['sponsor','Sponsor'],
                ['rank',   'Rank'],
                ['pv',     'PV'],
                ['gv',     'GV'],
                ['status', 'Status'],
                ['joined', 'Joined'],
              ].map(([col, label]) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                >
                  {label}{sortIndicator(col)}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                  No members match the current filters.
                </td>
              </tr>
            )}
            {paginated.map(m => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{m.name}</td>
                <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '13px' }}>{m.id}</td>
                <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '13px' }}>{m.sponsor}</td>
                <td>
                  <span style={{ color: RANK_COLORS[m.rank] || '#9ca3af', fontWeight: 600, fontSize: '13px' }}>
                    {m.rank}
                  </span>
                </td>
                <td>{m.pv}</td>
                <td>{m.gv.toLocaleString()}</td>
                <td>
                  <span className={m.status === 'Active' ? 'badge badge-green' : 'badge badge-red'}>
                    {m.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{m.joined}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setViewMember(m)}
                    >
                      View
                    </button>
                    <button
                      className={`btn btn-sm ${m.status === 'Active' ? 'btn-danger' : 'btn-green'}`}
                      onClick={() => toggleStatus(m.id)}
                    >
                      {m.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: '16px', flexWrap: 'wrap', gap: '10px',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
            Page {page} of {totalPages} · {filtered.length} total
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 1}
              onClick={() => setPage(1)}
              style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
            >
              «
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              style={{ opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'default' : 'pointer' }}
            >
              ‹ Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              return p <= totalPages ? (
                <button
                  key={p}
                  className="btn btn-sm"
                  onClick={() => setPage(p)}
                  style={{
                    background: p === page ? 'var(--navy3)' : 'transparent',
                    border: `1px solid ${p === page ? 'var(--gold)' : 'var(--border)'}`,
                    color: p === page ? 'var(--gold)' : 'var(--text2)',
                    minWidth: '34px',
                  }}
                >
                  {p}
                </button>
              ) : null
            })}
            <button
              className="btn btn-outline btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              Next ›
            </button>
            <button
              className="btn btn-outline btn-sm"
              disabled={page === totalPages}
              onClick={() => setPage(totalPages)}
              style={{ opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'default' : 'pointer' }}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Member detail modal */}
      <MemberModal
        member={viewMember}
        onClose={() => setViewMember(null)}
        onToast={showToast}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
