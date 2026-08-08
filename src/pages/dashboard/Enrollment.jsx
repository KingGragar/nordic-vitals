import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberEnrollments, createMemberEnrollmentInvite } from '../../api/mlmApi'

const STATUS_BADGE = {
  pending: { bg: '#3b2a0f', color: '#fcd34d', border: '#d97706', label: 'Pending' },
  active: { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Active' },
  expired: { bg: '#1c1c1c', color: '#9ca3af', border: '#374151', label: 'Expired' },
  onboarding: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Onboarding' },
}

function InviteModal({ onSend, onClose }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  async function submit(e) {
    e.preventDefault()
    setSending(true)
    await onSend(form)
    setSending(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Send Enrollment Invite</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label style={lbl}>Name *</label><input required value={form.name} onChange={set('name')} style={inp} placeholder="Anna Hansen" /></div>
          <div><label style={lbl}>Email *</label><input required type="email" value={form.email} onChange={set('email')} style={inp} placeholder="anna@example.com" /></div>
          <div>
            <label style={lbl}>Personal Message (optional)</label>
            <textarea value={form.message} onChange={set('message')} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="Hey Anna, I thought you might be interested in…" />
          </div>
          <button type="submit" disabled={sending} style={{ padding: '10px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: sending ? 'not-allowed' : 'pointer', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending…' : 'Send Invite'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Enrollment() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getMemberEnrollments().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleInvite(form) {
    const result = await createMemberEnrollmentInvite(form)
    setData(d => d ? { ...d, enrollments: [result, ...d.enrollments] } : d)
  }

  const all = data?.enrollments || []
  const filtered = filter === 'all' ? all : all.filter(e => e.status === filter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🤝 Enrollment Center</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Enroll new members and track their onboarding progress.</div>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Send Invite
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !data ? null : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Total Enrolled', value: data.totalEnrolled },
                { label: 'Active Members', value: all.filter(e => e.status === 'active').length },
                { label: 'Pending Invites', value: all.filter(e => e.status === 'pending').length },
                { label: 'This Month', value: data.enrolledThisMonth },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'pending', 'onboarding', 'active', 'expired'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
                  {f}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No enrollments found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map(e => {
                  const badge = STATUS_BADGE[e.status] || STATUS_BADGE.pending
                  return (
                    <div key={e.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{e.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{e.email}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Invited {e.invitedAt}{e.joinedAt ? ` · Joined ${e.joinedAt}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {badge.label}
                        </span>
                        {e.status === 'onboarding' && (
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>Step {e.onboardingStep}/{e.onboardingTotal}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <InviteModal onSend={handleInvite} onClose={() => setShowModal(false)} />}
    </DashboardLayout>
  )
}
