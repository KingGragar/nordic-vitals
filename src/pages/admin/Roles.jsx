import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminUsers, inviteAdminUser, updateAdminUserRole,
  deactivateAdminUser, getRolePermissions,
} from '../../api/mlmApi'

const ROLES = ['super_admin', 'admin', 'moderator', 'analyst']
const ROLE_LABELS = { super_admin: 'Super Admin', admin: 'Admin', moderator: 'Moderator', analyst: 'Analyst' }
const ROLE_COLORS = { super_admin: '#ef4444', admin: '#f59e0b', moderator: '#3b82f6', analyst: '#10b981' }

function fmt(iso) {
  if (!iso) return 'Never'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function RoleBadge({ role }) {
  return (
    <span style={{
      background: ROLE_COLORS[role] + '22',
      color: ROLE_COLORS[role],
      border: `1px solid ${ROLE_COLORS[role]}55`,
      borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.07em',
    }}>{ROLE_LABELS[role] || role}</span>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    active:   { bg: '#10b98122', color: '#10b981', label: 'Active' },
    inactive: { bg: '#6b728022', color: '#6b7280', label: 'Inactive' },
    invited:  { bg: '#f59e0b22', color: '#f59e0b', label: 'Invited' },
  }[status] || { bg: '#6b728022', color: '#6b7280', label: status }
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600,
    }}>{cfg.label}</span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 12, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: color || 'var(--text1)', lineHeight: 1.1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text2)' }}>{sub}</span>}
    </div>
  )
}

function Check({ val }) {
  return val
    ? <span style={{ color: '#10b981', fontSize: 16 }}>✓</span>
    : <span style={{ color: '#6b7280', fontSize: 14 }}>–</span>
}

export default function Roles() {
  const [users, setUsers] = useState([])
  const [permissions, setPermissions] = useState({ roles: {}, labels: {} })
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'moderator', note: '' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [confirmModal, setConfirmModal] = useState(null)
  const [changeRoleModal, setChangeRoleModal] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    Promise.all([getAdminUsers(), getRolePermissions()])
      .then(([u, p]) => { setUsers(u); setPermissions(p) })
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    if (filterRole && u.role !== filterRole) return false
    if (filterStatus && u.status !== filterStatus) return false
    return true
  })

  const kpiActive = users.filter(u => u.status === 'active').length
  const kpiInvited = users.filter(u => u.status === 'invited').length
  const kpiMfa = users.filter(u => u.mfaEnabled).length

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteForm.email) { setInviteError('Email is required'); return }
    setInviteLoading(true); setInviteError('')
    try {
      const u = await inviteAdminUser(inviteForm)
      setUsers(prev => [...prev, u])
      setShowInvite(false)
      setInviteForm({ email: '', role: 'moderator', note: '' })
      showToast(`Invite sent to ${inviteForm.email}`)
    } catch {
      setInviteError('Failed to send invite. Try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  async function handleToggleStatus(user) {
    setConfirmModal(null)
    const updated = await deactivateAdminUser(user.id)
    setUsers(prev => prev.map(u => u.id === user.id
      ? { ...u, status: updated.status || (u.status === 'inactive' ? 'active' : 'inactive') }
      : u
    ))
    showToast(`${user.name} ${updated.status === 'active' ? 'reactivated' : 'deactivated'}`)
  }

  async function handleRoleChange() {
    if (!changeRoleModal || !newRole) return
    await updateAdminUserRole(changeRoleModal.id, newRole)
    setUsers(prev => prev.map(u => u.id === changeRoleModal.id ? { ...u, role: newRole } : u))
    showToast(`${changeRoleModal.name}'s role updated to ${ROLE_LABELS[newRole]}`)
    setChangeRoleModal(null); setNewRole('')
  }

  const permKeys = Object.keys(permissions.labels || {})

  const s = { borderBottom: '2px solid var(--accent)' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>🔐 Roles &amp; Permissions</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 14 }}>Manage admin access and permission levels</p>
          </div>
          <button onClick={() => setShowInvite(true)} style={{
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
          }}>+ Invite Admin</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard label="Total Admins" value={users.length} sub="all roles" />
          <KpiCard label="Active" value={kpiActive} color="#10b981" sub="currently enabled" />
          <KpiCard label="Pending Invites" value={kpiInvited} color="#f59e0b" sub="awaiting signup" />
          <KpiCard label="MFA Enabled" value={kpiMfa} sub={`of ${users.length} admins`} />
          <KpiCard label="Roles Defined" value={Object.keys(permissions.roles || {}).length} sub="access levels" />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 24, borderBottom: '1px solid var(--navy3)' }}>
          {['users', 'permissions'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', color: tab === t ? 'var(--accent)' : 'var(--text2)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              marginBottom: -1, textTransform: 'capitalize',
            }}>{t === 'users' ? '👥 Admin Users' : '🔑 Permission Matrix'}</button>
          ))}
        </div>

        {tab === 'users' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name or email…"
                style={{
                  background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 8,
                  color: 'var(--text1)', padding: '8px 12px', fontSize: 13, flex: '1 1 180px',
                }}
              />
              <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{
                background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 8,
                color: 'var(--text1)', padding: '8px 12px', fontSize: 13, minWidth: 130,
              }}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{
                background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 8,
                color: 'var(--text1)', padding: '8px 12px', fontSize: 13, minWidth: 120,
              }}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="invited">Invited</option>
              </select>
            </div>

            {loading ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                      {['Name / Email', 'Role', 'Status', 'Last Login', 'MFA', 'Note', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', color: 'var(--text2)', fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text2)' }}>No admins match your filters.</td></tr>
                    )}
                    {filtered.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--navy3)', opacity: u.status === 'inactive' ? 0.55 : 1 }}>
                        <td style={{ padding: '12px 12px' }}>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div style={{ color: 'var(--text2)', fontSize: 12 }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px 12px' }}><RoleBadge role={u.role} /></td>
                        <td style={{ padding: '12px 12px' }}><StatusBadge status={u.status} /></td>
                        <td style={{ padding: '12px 12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtTime(u.lastLogin)}</td>
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          {u.mfaEnabled
                            ? <span style={{ color: '#10b981' }} title="MFA enabled">🔒</span>
                            : <span style={{ color: '#6b7280' }} title="MFA disabled">🔓</span>}
                        </td>
                        <td style={{ padding: '12px 12px', color: 'var(--text2)', fontSize: 12, maxWidth: 160 }}>{u.note || '—'}</td>
                        <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => { setChangeRoleModal(u); setNewRole(u.role) }}
                            disabled={u.role === 'super_admin'}
                            style={{
                              background: 'var(--navy3)', border: 'none', color: 'var(--text1)',
                              borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: u.role === 'super_admin' ? 'not-allowed' : 'pointer',
                              marginRight: 6, opacity: u.role === 'super_admin' ? 0.4 : 1,
                            }}>Change Role</button>
                          <button
                            onClick={() => setConfirmModal(u)}
                            disabled={u.role === 'super_admin' || u.status === 'invited'}
                            style={{
                              background: u.status === 'inactive' ? '#10b98122' : '#ef444422',
                              color: u.status === 'inactive' ? '#10b981' : '#ef4444',
                              border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12,
                              cursor: (u.role === 'super_admin' || u.status === 'invited') ? 'not-allowed' : 'pointer',
                              opacity: (u.role === 'super_admin' || u.status === 'invited') ? 0.4 : 1,
                            }}>{u.status === 'inactive' ? 'Reactivate' : 'Deactivate'}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === 'permissions' && (
          <div>
            <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>
              Read-only matrix showing what each role can access. Role definitions are managed by a Super Admin from the platform settings.
            </p>
            {loading ? (
              <p style={{ color: 'var(--text2)', textAlign: 'center', padding: 40 }}>Loading…</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
                  {Object.entries(permissions.roles || {}).map(([key, r]) => (
                    <div key={key} style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 18px', borderLeft: `3px solid ${r.color}` }}>
                      <div style={{ fontWeight: 700, color: r.color, fontSize: 14, marginBottom: 4 }}>{r.label}</div>
                      <div style={{ color: 'var(--text2)', fontSize: 12 }}>{r.description}</div>
                    </div>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                        <th style={{ padding: '10px 14px', color: 'var(--text2)', fontWeight: 600, textAlign: 'left' }}>Module</th>
                        {ROLES.map(r => (
                          <th key={r} style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <RoleBadge role={r} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permKeys.map(key => (
                        <tr key={key} style={{ borderBottom: '1px solid var(--navy3)' }}>
                          <td style={{ padding: '10px 14px', fontWeight: 500 }}>{permissions.labels[key]}</td>
                          {ROLES.map(r => (
                            <td key={r} style={{ padding: '10px 14px', textAlign: 'center' }}>
                              <Check val={permissions.roles[r]?.permissions?.[key]} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showInvite && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }} onClick={e => e.target === e.currentTarget && setShowInvite(false)}>
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18 }}>Invite Admin User</h3>
            <form onSubmit={handleInvite}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Email *</label>
                <input
                  type="email" value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  style={{
                    width: '100%', background: 'var(--navy3)', border: '1px solid var(--navy4)',
                    borderRadius: 8, color: 'var(--text1)', padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
                  }}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  style={{
                    width: '100%', background: 'var(--navy3)', border: '1px solid var(--navy4)',
                    borderRadius: 8, color: 'var(--text1)', padding: '9px 12px', fontSize: 14,
                  }}>
                  {ROLES.filter(r => r !== 'super_admin').map(r => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Note (optional)</label>
                <input
                  value={inviteForm.note}
                  onChange={e => setInviteForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="e.g. Customer support team"
                  style={{
                    width: '100%', background: 'var(--navy3)', border: '1px solid var(--navy4)',
                    borderRadius: 8, color: 'var(--text1)', padding: '9px 12px', fontSize: 14, boxSizing: 'border-box',
                  }}
                />
              </div>
              {inviteError && <p style={{ color: '#ef4444', fontSize: 13, margin: '0 0 12px' }}>{inviteError}</p>}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowInvite(false)} style={{
                  background: 'var(--navy3)', border: 'none', color: 'var(--text2)',
                  borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 14,
                }}>Cancel</button>
                <button type="submit" disabled={inviteLoading} style={{
                  background: 'var(--accent)', border: 'none', color: '#fff',
                  borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                  opacity: inviteLoading ? 0.7 : 1,
                }}>{inviteLoading ? 'Sending…' : 'Send Invite'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }} onClick={e => e.target === e.currentTarget && setConfirmModal(null)}>
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>
              {confirmModal.status === 'inactive' ? 'Reactivate' : 'Deactivate'} Admin
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 20px' }}>
              {confirmModal.status === 'inactive'
                ? `Restore access for ${confirmModal.name}?`
                : `Remove admin access for ${confirmModal.name}? They will no longer be able to log in.`}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmModal(null)} style={{
                background: 'var(--navy3)', border: 'none', color: 'var(--text2)',
                borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 14,
              }}>Cancel</button>
              <button onClick={() => handleToggleStatus(confirmModal)} style={{
                background: confirmModal.status === 'inactive' ? '#10b981' : '#ef4444',
                border: 'none', color: '#fff', borderRadius: 8,
                padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}>{confirmModal.status === 'inactive' ? 'Reactivate' : 'Deactivate'}</button>
            </div>
          </div>
        </div>
      )}

      {changeRoleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: '#000a', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
        }} onClick={e => e.target === e.currentTarget && setChangeRoleModal(null)}>
          <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>Change Role — {changeRoleModal.name}</h3>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: '0 0 16px' }}>
              Current: <RoleBadge role={changeRoleModal.role} />
            </p>
            <select
              value={newRole} onChange={e => setNewRole(e.target.value)}
              style={{
                width: '100%', background: 'var(--navy3)', border: '1px solid var(--navy4)',
                borderRadius: 8, color: 'var(--text1)', padding: '9px 12px', fontSize: 14,
                marginBottom: 20,
              }}>
              {ROLES.filter(r => r !== 'super_admin').map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text2)' }}>
              {permissions.roles[newRole]?.description || ''}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setChangeRoleModal(null); setNewRole('') }} style={{
                background: 'var(--navy3)', border: 'none', color: 'var(--text2)',
                borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 14,
              }}>Cancel</button>
              <button onClick={handleRoleChange} disabled={newRole === changeRoleModal.role} style={{
                background: 'var(--accent)', border: 'none', color: '#fff',
                borderRadius: 8, padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
                opacity: newRole === changeRoleModal.role ? 0.5 : 1,
              }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#10b981',
          color: '#fff', borderRadius: 10, padding: '12px 20px', fontWeight: 600,
          fontSize: 14, zIndex: 2000, boxShadow: '0 4px 16px #0006',
        }}>{toast}</div>
      )}
    </AdminLayout>
  )
}
