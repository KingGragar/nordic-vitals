import { useState, useMemo, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { ADMIN_MEMBERS } from '../../data/mock'
import { getAdminMembers } from '../../api/mlmApi'

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
        {/* Close button */}
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

export default function Members() {
  const [members, setMembers] = useState(ADMIN_MEMBERS)
  const [search, setSearch]   = useState('')
  const [rankFilter, setRankFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMember, setViewMember] = useState(null)
  const [toast, setToast] = useState(null)

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

  const filtered = useMemo(() => {
    return members.filter(m => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.sponsor.toLowerCase().includes(q)
      const matchRank   = rankFilter === 'All' || m.rank === rankFilter
      const matchStatus = statusFilter === 'All' || m.status === statusFilter
      return matchSearch && matchRank && matchStatus
    })
  }, [members, search, rankFilter, statusFilter])

  return (
    <AdminLayout>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)' }}>
          Member Management
        </h1>
        <span className="badge badge-blue">{filtered.length} members</span>
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
              <th>Name</th>
              <th>ID</th>
              <th>Sponsor</th>
              <th>Rank</th>
              <th>PV</th>
              <th>GV</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px' }}>
                  No members match the current filters.
                </td>
              </tr>
            )}
            {filtered.map(m => (
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
