import { useState, useMemo, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { ADMIN_MEMBERS } from '../../data/mock'
import {
  getAdminMembers, getMemberDetail, updateMemberStatus, setMemberRank, addMemberNote,
} from '../../api/mlmApi'

const PAGE_SIZE = 20

const RANK_COLORS = {
  Unranked: '#9ca3af',
  Bronze:   '#cd7f32',
  Silver:   '#aaaaaa',
  Gold:     '#c9a84c',
  Platinum: '#ffffff',
}

const ALL_RANKS = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']

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

function InfoRow({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 500, wordBreak: 'break-word' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}

function MemberModal({ memberId, onClose, onToast, onMembersRefresh }) {
  const [tab, setTab]             = useState('profile')
  const [detail, setDetail]       = useState(null)
  const [loading, setLoading]     = useState(true)
  const [confirmAction, setConfirmAction] = useState(null)
  const [newRank, setNewRank]     = useState('')
  const [note, setNote]           = useState('')
  const [saving, setSaving]       = useState(false)

  useEffect(() => {
    if (!memberId) return
    setLoading(true)
    setTab('profile')
    getMemberDetail(memberId)
      .then(d => { setDetail(d); setNote(d.member.notes || '') })
      .catch(() => onToast('Failed to load member detail'))
      .finally(() => setLoading(false))
  }, [memberId])

  if (!memberId) return null

  const member = detail?.member

  async function handleToggleStatus() {
    const next = member.status === 'Active' ? 'Inactive' : 'Active'
    setSaving(true)
    try {
      await updateMemberStatus(memberId, next)
      setDetail(d => ({ ...d, member: { ...d.member, status: next } }))
      onMembersRefresh()
      onToast(`${member.name} set to ${next}`)
    } catch {
      onToast('Failed to update status')
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  async function handleSetRank() {
    if (!newRank) return
    setSaving(true)
    try {
      await setMemberRank(memberId, newRank)
      setDetail(d => ({ ...d, member: { ...d.member, rank: newRank } }))
      onMembersRefresh()
      onToast(`Rank set to ${newRank}`)
    } catch {
      onToast('Failed to update rank')
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  async function handleSaveNote() {
    setSaving(true)
    try {
      await addMemberNote(memberId, note)
      onToast('Note saved')
    } catch {
      onToast('Failed to save note')
    } finally {
      setSaving(false)
    }
  }

  const tabStyle = active => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent',
    background: 'none',
    color: active ? 'var(--gold)' : 'var(--text2)',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    fontSize: '14px',
    whiteSpace: 'nowrap',
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: '680px', position: 'relative',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '16px', right: '16px',
              background: 'none', border: 'none', color: 'var(--text2)',
              fontSize: '22px', lineHeight: 1, cursor: 'pointer',
            }}
          >
            ×
          </button>

          {loading ? (
            <div style={{ color: 'var(--text2)', paddingBottom: '20px' }}>Loading…</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '18px', fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
                }}>
                  {member?.name?.[0] ?? '?'}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)' }}>
                    {member?.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', fontFamily: 'monospace' }}>
                    {member?.id} &nbsp;·&nbsp;
                    <span style={{ color: RANK_COLORS[member?.rank] || '#9ca3af', fontWeight: 600 }}>
                      {member?.rank}
                    </span>
                    &nbsp;·&nbsp;
                    <span className={member?.status === 'Active' ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: '11px' }}>
                      {member?.status}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0', overflowX: 'auto' }}>
                {['profile', 'commissions', 'downline', 'actions'].map(t => (
                  <button key={t} style={tabStyle(tab === t)} onClick={() => setTab(t)}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Body */}
        {!loading && member && (
          <div style={{ overflowY: 'auto', padding: '24px', flexGrow: 1 }}>

            {/* ── Profile tab ─────────────────────────────── */}
            {tab === 'profile' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                  <InfoRow label="Full Name"  value={member.name} />
                  <InfoRow label="Member ID"  value={member.id} />
                  <InfoRow label="Email"      value={member.email} />
                  <InfoRow label="Phone"      value={member.phone} />
                  <InfoRow label="Country"    value={member.country} />
                  <InfoRow label="Joined"     value={member.joined} />
                  <InfoRow label="Sponsor"    value={member.sponsor} />
                  <InfoRow label="PV / GV"    value={`${member.pv} / ${(member.gv ?? 0).toLocaleString()}`} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                    Admin Note
                  </div>
                  <textarea
                    className="input"
                    style={{ width: '100%', minHeight: '72px', resize: 'vertical', fontSize: '13px' }}
                    placeholder="Internal note (not visible to member)…"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                  />
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '8px' }}
                    disabled={saving}
                    onClick={handleSaveNote}
                  >
                    {saving ? 'Saving…' : 'Save Note'}
                  </button>
                </div>
              </>
            )}

            {/* ── Commissions tab ─────────────────────────── */}
            {tab === 'commissions' && (
              <>
                <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px,1fr))', gap: '12px' }}>
                  {[
                    { label: 'PV',         value: member.pv },
                    { label: 'GV',         value: (member.gv ?? 0).toLocaleString() },
                    { label: 'Rank',       value: member.rank },
                  ].map(({ label, value }) => (
                    <div key={label} className="card" style={{ padding: '12px 16px', background: 'var(--navy2)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{label}</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--gold)', marginTop: '4px' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                  Recent commission activity for this member
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.commissions ?? []).length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text2)', padding: '24px' }}>
                            No commission history found.
                          </td>
                        </tr>
                      )}
                      {(detail.commissions ?? []).map((c, i) => (
                        <tr key={i}>
                          <td style={{ color: 'var(--cream)', fontWeight: 500 }}>{c.type ?? c.source ?? '—'}</td>
                          <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{(c.amount ?? 0).toLocaleString()} MLMT</td>
                          <td>
                            <span className={c.status === 'Paid' ? 'badge badge-green' : 'badge badge-yellow'}>
                              {c.status ?? 'Pending'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{c.period ?? c.date ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text2)', marginBottom: '10px' }}>
                  Recent orders
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Amount</th>
                        <th>PV</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detail.orders ?? []).length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text2)', padding: '24px' }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                      {(detail.orders ?? []).map((o, i) => (
                        <tr key={i}>
                          <td style={{ fontFamily: 'monospace', fontSize: '13px', color: 'var(--text2)' }}>{o.orderId ?? o.id}</td>
                          <td style={{ color: 'var(--cream)', fontWeight: 500 }}>NOK {(o.amount ?? 0).toLocaleString()}</td>
                          <td>{o.pv ?? '—'}</td>
                          <td>
                            <span className={o.status === 'Delivered' ? 'badge badge-green' : o.status === 'Cancelled' ? 'badge badge-red' : 'badge badge-yellow'}>
                              {o.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{o.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── Downline tab ─────────────────────────────── */}
            {tab === 'downline' && (
              <>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                  Direct recruits sponsored by {member.name}
                </div>
                {(detail.downline ?? []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px' }}>
                    No direct recruits yet.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>ID</th>
                          <th>Rank</th>
                          <th>PV</th>
                          <th>GV</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(detail.downline ?? []).map(d => (
                          <tr key={d.id}>
                            <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{d.name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text2)' }}>{d.id}</td>
                            <td>
                              <span style={{ color: RANK_COLORS[d.rank] || '#9ca3af', fontWeight: 600, fontSize: '13px' }}>
                                {d.rank}
                              </span>
                            </td>
                            <td>{d.pv}</td>
                            <td>{(d.gv ?? 0).toLocaleString()}</td>
                            <td>
                              <span className={d.status === 'Active' ? 'badge badge-green' : 'badge badge-red'}>
                                {d.status}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{d.joined}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)' }}>
                  Total direct recruits: <strong style={{ color: 'var(--cream)' }}>{(detail.downline ?? []).length}</strong>
                  &nbsp;· Combined GV from leg:{' '}
                  <strong style={{ color: 'var(--gold)' }}>
                    {(detail.downline ?? []).reduce((s, d) => s + (d.gv ?? 0), 0).toLocaleString()} GV
                  </strong>
                </div>
              </>
            )}

            {/* ── Actions tab ──────────────────────────────── */}
            {tab === 'actions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Status toggle */}
                <div className="card" style={{ background: 'var(--navy2)', padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>Account Status</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                    Current status: <span className={member.status === 'Active' ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize: '11px' }}>{member.status}</span>
                  </div>
                  {confirmAction === 'status' ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
                        Confirm {member.status === 'Active' ? 'suspend' : 'activate'} {member.name}?
                      </span>
                      <button className="btn btn-danger btn-sm" disabled={saving} onClick={handleToggleStatus}>
                        {saving ? 'Saving…' : 'Confirm'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className={`btn btn-sm ${member.status === 'Active' ? 'btn-danger' : 'btn-green'}`}
                      onClick={() => setConfirmAction('status')}
                    >
                      {member.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                    </button>
                  )}
                </div>

                {/* Rank override */}
                <div className="card" style={{ background: 'var(--navy2)', padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>Manual Rank Override</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                    Current rank: <span style={{ color: RANK_COLORS[member.rank] || '#9ca3af', fontWeight: 600 }}>{member.rank}</span>
                  </div>
                  {confirmAction === 'rank' ? (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
                        Set rank to <strong style={{ color: RANK_COLORS[newRank] || '#9ca3af' }}>{newRank}</strong>?
                      </span>
                      <button className="btn btn-sm" style={{ background: 'var(--gold)', color: '#000' }} disabled={saving} onClick={handleSetRank}>
                        {saving ? 'Saving…' : 'Confirm'}
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setConfirmAction(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        className="input"
                        style={{ maxWidth: '160px' }}
                        value={newRank}
                        onChange={e => setNewRank(e.target.value)}
                      >
                        <option value="">Select rank…</option>
                        {ALL_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button
                        className="btn btn-outline btn-sm"
                        disabled={!newRank || newRank === member.rank}
                        onClick={() => setConfirmAction('rank')}
                      >
                        Apply Override
                      </button>
                    </div>
                  )}
                </div>

                {/* Password reset */}
                <div className="card" style={{ background: 'var(--navy2)', padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>Password Reset</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '12px' }}>
                    Send a password reset link to <strong style={{ color: 'var(--cream)' }}>{member.email}</strong>.
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => onToast(`Password reset email sent to ${member.email}`)}
                  >
                    Send Reset Email
                  </button>
                </div>

                {/* Contact info copy */}
                <div className="card" style={{ background: 'var(--navy2)', padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '6px' }}>Contact Details</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.8' }}>
                    <div>Email: <a href={`mailto:${member.email}`} style={{ color: 'var(--gold)' }}>{member.email}</a></div>
                    <div>Phone: {member.phone ?? '—'}</div>
                    <div>Country: {member.country ?? '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function exportCsv(members) {
  const headers = ['Name', 'ID', 'Email', 'Phone', 'Country', 'Sponsor', 'Rank', 'PV', 'GV', 'Status', 'Joined']
  const rows = members.map(m => [
    m.name, m.id, m.email ?? '', m.phone ?? '', m.country ?? '', m.sponsor, m.rank, m.pv, m.gv, m.status, m.joined,
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
  const [members, setMembers]           = useState(ADMIN_MEMBERS)
  const [search, setSearch]             = useState('')
  const [rankFilter, setRankFilter]     = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMemberId, setViewMemberId] = useState(null)
  const [toast, setToast]               = useState(null)
  const [page, setPage]                 = useState(1)
  const [sortCol, setSortCol]           = useState('name')
  const [sortDir, setSortDir]           = useState('asc')

  useEffect(() => {
    getAdminMembers()
      .then(d => { if (d?.members?.length) setMembers(d.members) })
      .catch(() => {})
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function refreshMembers() {
    getAdminMembers()
      .then(d => { if (d?.members?.length) setMembers(d.members) })
      .catch(() => {})
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
        m.sponsor.toLowerCase().includes(q) ||
        (m.email || '').toLowerCase().includes(q)
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
          placeholder="Search name, ID, sponsor, email…"
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
              <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setViewMemberId(m.id)}>
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
                <td onClick={e => e.stopPropagation()}>
                  <span className={m.status === 'Active' ? 'badge badge-green' : 'badge badge-red'}>
                    {m.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{m.joined}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewMemberId(m.id)}
                  >
                    View →
                  </button>
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
        memberId={viewMemberId}
        onClose={() => setViewMemberId(null)}
        onToast={showToast}
        onMembersRefresh={refreshMembers}
      />

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
