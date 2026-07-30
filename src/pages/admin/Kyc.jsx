import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminKycQueue, approveKyc, rejectKyc } from '../../api/mlmApi'

const STATUS_BADGE = {
  pending:    { label: 'Pending',        bg: '#3b82f620', color: '#3b82f6' },
  approved:   { label: 'Approved',       bg: '#22c55e20', color: '#22c55e' },
  rejected:   { label: 'Action Needed',  bg: '#ef444420', color: '#ef4444' },
  draft:      { label: 'In Progress',    bg: '#f59e0b20', color: '#f59e0b' },
  unverified: { label: 'Not Started',    bg: '#6b728020', color: '#6b7280' },
}

const DOC_TYPE_LABEL = {
  government_id:    '🪪 Government ID',
  proof_of_address: '🏠 Proof of Address',
  selfie:           '🤳 Selfie with ID',
}

const PAGE_SIZE = 20

export default function AdminKyc() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewAction, setReviewAction] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminKycQueue({ status: statusFilter, search })
      .then(data => { setSubmissions(data); setPage(1) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleApprove() {
    if (!selected) return
    setActionLoading(true)
    try {
      await approveKyc(selected.id, reviewNotes)
      showToast(`${selected.name} approved.`)
      setSelected(null)
      setReviewNotes('')
      setReviewAction(null)
      load()
    } catch (e) {
      showToast(e.message || 'Action failed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject() {
    if (!selected || !reviewNotes.trim()) return
    setActionLoading(true)
    try {
      await rejectKyc(selected.id, reviewNotes)
      showToast(`${selected.name} rejected.`)
      setSelected(null)
      setReviewNotes('')
      setReviewAction(null)
      load()
    } catch (e) {
      showToast(e.message || 'Action failed.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const paged = submissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE))

  const counts = {
    all:       submissions.length,
    pending:   submissions.filter(k => k.status === 'pending').length,
    approved:  submissions.filter(k => k.status === 'approved').length,
    rejected:  submissions.filter(k => k.status === 'rejected').length,
    draft:     submissions.filter(k => k.status === 'draft').length,
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px 0', maxWidth: 1100, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--text1)' }}>🔏 KYC Verification Queue</h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
          Review member identity verification submissions for AML/KYC compliance.
        </p>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Pending Review', value: counts.pending,  color: '#3b82f6' },
            { label: 'Approved',       value: counts.approved, color: '#22c55e' },
            { label: 'Rejected',       value: counts.rejected, color: '#ef4444' },
            { label: 'In Progress',    value: counts.draft,    color: '#f59e0b' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['pending', 'rejected', 'approved', 'draft', 'all'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                  background: statusFilter === s ? '#3b82f6' : 'var(--surface)',
                  color: statusFilter === s ? '#fff' : 'var(--text2)',
                }}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, ID, email…"
            style={{ marginLeft: 'auto', padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text1)', fontSize: 13, minWidth: 220 }}
          />
        </div>

        {/* Table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Member', 'Member ID', 'Country', 'Submitted', 'Docs', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading…</td></tr>
                ) : paged.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No submissions found.</td></tr>
                ) : paged.map(k => {
                  const badge = STATUS_BADGE[k.status] || STATUS_BADGE.unverified
                  return (
                    <tr key={k.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', color: 'var(--text1)', fontWeight: 600 }}>{k.name}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{k.memberId}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{k.country || '—'}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {k.submitted_at ? new Date(k.submitted_at).toLocaleDateString('en-GB') : '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{k.docs.length} / 3</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: 12 }}>{badge.label}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <button
                          onClick={() => { setSelected(k); setReviewNotes(k.review_notes || ''); setReviewAction(null) }}
                          style={{ background: '#3b82f615', color: '#3b82f6', border: '1px solid #3b82f630', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>‹ Prev</button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text2)' }}>Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text2)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next ›</button>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setReviewAction(null) } }}
        >
          <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 28, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>Review: {selected.name}</h2>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{selected.memberId} · {selected.email} · {selected.country}</div>
              </div>
              <button onClick={() => { setSelected(null); setReviewAction(null) }} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 18 }}>
              {(() => { const badge = STATUS_BADGE[selected.status] || STATUS_BADGE.unverified; return (
                <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '4px 14px', fontWeight: 700, fontSize: 13 }}>{badge.label}</span>
              )})()}
              {selected.submitted_at && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--text3)' }}>
                  Submitted {new Date(selected.submitted_at).toLocaleString('en-GB')}
                </span>
              )}
            </div>

            {/* Documents */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text1)', marginBottom: 10 }}>Documents ({selected.docs.length})</div>
              {selected.docs.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No documents uploaded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selected.docs.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                      <span style={{ fontSize: 20 }}>{DOC_TYPE_LABEL[d.type]?.split(' ')[0] || '📄'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text1)' }}>{DOC_TYPE_LABEL[d.type] || d.type}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{d.filename} · {d.size_kb} KB · {new Date(d.uploaded_at).toLocaleDateString('en-GB')}</div>
                      </div>
                      <span style={{
                        fontSize: 12, fontWeight: 600, borderRadius: 20, padding: '2px 10px',
                        background: d.verified ? '#22c55e20' : '#6b728020',
                        color: d.verified ? '#22c55e' : '#6b7280',
                      }}>
                        {d.verified ? '✓ Verified' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Previous review notes */}
            {selected.review_notes && selected.status !== 'pending' && (
              <div style={{ marginBottom: 16, background: 'rgba(59,130,246,0.07)', border: '1px solid #3b82f620', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
                <strong style={{ color: 'var(--text1)' }}>Previous review note:</strong>
                <div style={{ marginTop: 4, color: 'var(--text2)' }}>{selected.review_notes}</div>
                {selected.reviewed_by && <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text3)' }}>by {selected.reviewed_by} on {new Date(selected.reviewed_at).toLocaleDateString('en-GB')}</div>}
              </div>
            )}

            {/* Review actions */}
            {selected.status === 'pending' && !reviewAction && (
              <div>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Add review notes (required for rejection)…"
                  rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text1)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 14 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setReviewAction('reject')}
                    style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444430', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >
                    ✗ Reject
                  </button>
                  <button
                    onClick={() => setReviewAction('approve')}
                    style={{ background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e30', borderRadius: 8, padding: '9px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
                  >
                    ✓ Approve
                  </button>
                </div>
              </div>
            )}

            {/* Confirm approve */}
            {reviewAction === 'approve' && (
              <div style={{ background: '#22c55e10', border: '1px solid #22c55e30', borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Confirm Approval</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  This will mark <strong>{selected.name}</strong>'s KYC as verified and unlock withdrawals on their account.
                </div>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Optional approval notes…"
                  rows={2}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text1)', fontSize: 13, resize: 'none', boxSizing: 'border-box', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setReviewAction(null)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: 'var(--text2)', fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleApprove} disabled={actionLoading} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
                    {actionLoading ? 'Processing…' : 'Confirm Approval'}
                  </button>
                </div>
              </div>
            )}

            {/* Confirm reject */}
            {reviewAction === 'reject' && (
              <div style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: 10, padding: 18 }}>
                <div style={{ fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>Confirm Rejection</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                  The member will be notified and asked to resubmit. Provide a clear reason.
                </div>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="Rejection reason (required)…"
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${reviewNotes.trim() ? 'var(--border)' : '#ef4444'}`, background: 'var(--bg)', color: 'var(--text1)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box', marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setReviewAction(null)} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: 'var(--text2)', fontWeight: 600 }}>Cancel</button>
                  <button onClick={handleReject} disabled={actionLoading || !reviewNotes.trim()} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: reviewNotes.trim() ? 'pointer' : 'not-allowed', opacity: reviewNotes.trim() ? 1 : 0.6 }}>
                    {actionLoading ? 'Processing…' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Already reviewed — show re-review option */}
            {['approved', 'rejected', 'draft', 'unverified'].includes(selected.status) && (
              <div style={{ textAlign: 'right', marginTop: 16 }}>
                <button onClick={() => { setSelected(null); setReviewAction(null) }} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', color: 'var(--text2)', fontWeight: 600, fontSize: 13 }}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: toast.type === 'error' ? '#ef4444' : '#22c55e', color: '#fff', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
