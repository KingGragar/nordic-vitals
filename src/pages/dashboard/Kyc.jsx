import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyKyc, submitKycDocument, submitKycForReview } from '../../api/mlmApi'
import usePageTitle from '../../hooks/usePageTitle'

const DOC_TYPES = [
  {
    type: 'government_id',
    label: 'Government-issued ID',
    desc: 'Passport, national identity card, or driving licence. Must be valid and not expired.',
    accept: '.jpg,.jpeg,.png,.pdf',
    icon: '🪪',
  },
  {
    type: 'proof_of_address',
    label: 'Proof of Address',
    desc: 'Utility bill or bank statement dated within the last 3 months showing your name and address.',
    accept: '.jpg,.jpeg,.png,.pdf',
    icon: '🏠',
  },
  {
    type: 'selfie',
    label: 'Selfie with ID',
    desc: 'A clear photo of yourself holding your government ID next to your face.',
    accept: '.jpg,.jpeg,.png',
    icon: '🤳',
  },
]

const STATUS_CONFIG = {
  unverified: { label: 'Not Started',    color: '#6b7280', bg: 'rgba(107,114,128,0.15)', icon: '⚪' },
  draft:      { label: 'In Progress',    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  icon: '📝' },
  pending:    { label: 'Under Review',   color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  icon: '⏳' },
  approved:   { label: 'Verified',       color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   icon: '✅' },
  rejected:   { label: 'Action Needed',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)',   icon: '❌' },
}

function StatusBanner({ status, notes }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.unverified
  return (
    <div style={{ background: cfg.bg, border: `1px solid ${cfg.color}33`, borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 28 }}>{cfg.icon}</span>
      <div>
        <div style={{ fontWeight: 700, color: cfg.color, fontSize: 16, marginBottom: 4 }}>
          KYC Status: {cfg.label}
        </div>
        {status === 'unverified' && <div style={{ color: 'var(--text2)', fontSize: 14 }}>Complete identity verification to unlock withdrawals and full platform features.</div>}
        {status === 'draft' && <div style={{ color: 'var(--text2)', fontSize: 14 }}>Upload all 3 required documents and submit for review.</div>}
        {status === 'pending' && <div style={{ color: 'var(--text2)', fontSize: 14 }}>Your documents are being reviewed by our compliance team. This usually takes 1–2 business days.</div>}
        {status === 'approved' && <div style={{ color: 'var(--text2)', fontSize: 14 }}>Your identity has been verified. All platform features are unlocked.</div>}
        {status === 'rejected' && (
          <div>
            <div style={{ color: 'var(--text1)', fontSize: 14, marginBottom: 6 }}>One or more documents were not accepted. Please resubmit.</div>
            {notes && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ef4444' }}>
              <strong>Review note:</strong> {notes}
            </div>}
          </div>
        )}
      </div>
    </div>
  )
}

function DocStep({ docDef, uploaded, onUpload, disabled }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file) return
    setUploading(true)
    try {
      await onUpload(docDef.type, file.name)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${uploaded ? '#22c55e44' : 'var(--border)'}`, borderRadius: 12, padding: 20, position: 'relative' }}>
      {uploaded && (
        <span style={{ position: 'absolute', top: 12, right: 12, background: '#22c55e22', color: '#22c55e', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>✓ Uploaded</span>
      )}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 28 }}>{docDef.icon}</span>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text1)', marginBottom: 4 }}>{docDef.label}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{docDef.desc}</div>
        </div>
      </div>
      {uploaded ? (
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>📄</span>
          <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>{uploaded.filename} ({uploaded.size_kb} KB)</span>
          {!disabled && (
            <label style={{ fontSize: 12, color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>
              Replace
              <input type="file" accept={docDef.accept} style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
            </label>
          )}
        </div>
      ) : (
        <label
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px',
            border: `2px dashed ${dragging ? '#3b82f6' : 'var(--border)'}`,
            borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
            background: dragging ? 'rgba(59,130,246,0.07)' : 'transparent', transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          <span style={{ fontSize: 28 }}>{uploading ? '⏳' : '📤'}</span>
          <div style={{ fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
            {uploading ? 'Uploading…' : 'Drag & drop or click to browse'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>
            Accepted: {docDef.accept.replaceAll('.', '').toUpperCase()}
          </div>
          <input
            type="file"
            accept={docDef.accept}
            style={{ display: 'none' }}
            disabled={disabled || uploading}
            onChange={e => handleFile(e.target.files[0])}
          />
        </label>
      )}
    </div>
  )
}

export default function Kyc() {
  usePageTitle('Identity Verification (KYC)', 'Verify your identity to unlock all Nordic Vitals features.')
  const { user } = useAuth()
  const [kyc, setKyc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getMyKyc(user.userId)
      .then(setKyc)
      .catch(() => setKyc({ status: 'unverified', docs: [] }))
      .finally(() => setLoading(false))
  }, [user])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleUpload(docType, filename) {
    try {
      await submitKycDocument(user.userId, docType, filename)
      const refreshed = await getMyKyc(user.userId)
      setKyc(refreshed)
      showToast('Document uploaded successfully.')
    } catch (e) {
      showToast(e.message || 'Upload failed.', 'error')
    }
  }

  async function handleSubmit() {
    setSubmitting(true)
    try {
      await submitKycForReview(user.userId)
      const refreshed = await getMyKyc(user.userId)
      setKyc(refreshed)
      showToast('Application submitted for review!')
    } catch (e) {
      showToast(e.message || 'Submission failed.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const status = kyc?.status || 'unverified'
  const uploadedDocs = kyc?.docs || []
  const canEdit = status === 'unverified' || status === 'draft' || status === 'rejected'
  const allUploaded = DOC_TYPES.every(d => uploadedDocs.find(u => u.type === d.type))
  const canSubmit = canEdit && allUploaded

  const step = kyc ? ['unverified', 'draft'].includes(status) ? 1 : status === 'pending' ? 2 : 3 : 0

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', marginBottom: 4 }}>
          🔏 Identity Verification (KYC)
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
          Norwegian AML/KYC regulations require us to verify member identities before processing withdrawals. Your documents are stored securely and never shared with third parties.
        </p>

        {/* Progress tracker */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--surface)', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
          {[
            { n: 1, label: 'Upload Documents', active: step >= 1 },
            { n: 2, label: 'Under Review',     active: step >= 2 },
            { n: 3, label: 'Verified',         active: step >= 3 },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '14px 10px', textAlign: 'center', background: s.active ? (status === 'rejected' && s.n === 3 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)') : 'transparent', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13,
                background: s.active ? (status === 'rejected' && s.n === 3 ? '#ef4444' : '#3b82f6') : 'var(--border)',
                color: s.active ? '#fff' : 'var(--text3)',
              }}>
                {status === 'approved' && s.n === 3 ? '✓' : status === 'rejected' && s.n === 3 ? '✗' : s.n}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: s.active ? 'var(--text1)' : 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading KYC status…</div>
        ) : (
          <>
            <StatusBanner status={status} notes={kyc?.review_notes} />

            {/* Document upload steps */}
            {(canEdit || status === 'pending') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>
                  Required Documents
                </h2>
                {DOC_TYPES.map(docDef => (
                  <DocStep
                    key={docDef.type}
                    docDef={docDef}
                    uploaded={uploadedDocs.find(d => d.type === docDef.type)}
                    onUpload={handleUpload}
                    disabled={!canEdit}
                  />
                ))}
              </div>
            )}

            {/* Approved: show verified doc list */}
            {status === 'approved' && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text1)', marginBottom: 14 }}>Verified Documents</h2>
                {uploadedDocs.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < uploadedDocs.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 20 }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text1)' }}>{d.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{d.filename} · {d.size_kb} KB</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#22c55e', background: '#22c55e18', borderRadius: 20, padding: '2px 10px' }}>✓ Verified</span>
                  </div>
                ))}
                {kyc?.reviewed_at && (
                  <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text3)' }}>
                    Verified on {new Date(kyc.reviewed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} by {kyc.reviewed_by}
                  </div>
                )}
              </div>
            )}

            {/* Submit button */}
            {canEdit && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  {uploadedDocs.length} / {DOC_TYPES.length} documents uploaded
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  style={{
                    background: canSubmit ? '#3b82f6' : 'var(--border)',
                    color: canSubmit ? '#fff' : 'var(--text3)',
                    border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: canSubmit ? 'pointer' : 'not-allowed',
                  }}
                >
                  {submitting ? 'Submitting…' : status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
                </button>
              </div>
            )}

            {/* Info box */}
            <div style={{ marginTop: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, fontSize: 13, color: 'var(--text2)', lineHeight: 1.7 }}>
              <strong style={{ color: 'var(--text1)' }}>Why do we need this?</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                <li>Norwegian anti-money laundering regulations (AML) require identity verification for payout processing.</li>
                <li>Documents are encrypted at rest and only accessible by our compliance team.</li>
                <li>Verification typically takes 1–2 business days.</li>
                <li>Contact <a href="/dashboard/support" style={{ color: '#3b82f6' }}>support</a> if you have questions.</li>
              </ul>
            </div>
          </>
        )}

        {toast && (
          <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: toast.type === 'error' ? '#ef4444' : '#22c55e',
            color: '#fff', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            {toast.msg}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
