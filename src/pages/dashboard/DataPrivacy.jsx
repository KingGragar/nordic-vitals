import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import usePageTitle from '../../hooks/usePageTitle'
import { useAuth } from '../../context/AuthContext'
import { getMyDataSummary, requestDataExport, requestAccountDeletion, updateConsentPreferences } from '../../api/mlmApi'

const COOKIE_KEY = 'nv_cookie_consent'

function loadConsent() {
  try { const r = localStorage.getItem(COOKIE_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function saveConsent(prefs) {
  try { localStorage.setItem(COOKIE_KEY, JSON.stringify({ ...prefs, savedAt: new Date().toISOString() })) } catch (_) {}
}

const CONSENT_CATS = [
  { id: 'essential',        label: 'Essential',        desc: 'Required for the site to function. Always on.',             required: true },
  { id: 'analytics',        label: 'Analytics',        desc: 'Anonymised page-view and session data for site improvement.', required: false },
  { id: 'marketing',        label: 'Marketing',        desc: 'Referral attribution and promotional personalisation.',       required: false },
  { id: 'personalization',  label: 'Personalization',  desc: 'Remembering display preferences across visits.',             required: false },
]

const DELETION_REASONS = [
  'I no longer want to be a member',
  'I have privacy concerns',
  'I want to create a new account',
  'The service does not meet my needs',
  'Other',
]

function Toggle({ on, onChange, disabled }) {
  return (
    <div
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 12, flexShrink: 0,
        background: (disabled || on) ? 'var(--gold)' : 'var(--border)',
        position: 'relative', cursor: disabled ? 'default' : 'pointer', transition: 'background .2s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: (disabled || on) ? 'calc(100% - 21px)' : 3,
        width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s',
      }} />
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '20px 22px', ...style,
    }}>
      {children}
    </div>
  )
}

export default function DataPrivacy() {
  usePageTitle('Data Privacy', 'Manage your GDPR data rights — consent, data export, and account deletion.')
  const { user } = useAuth()

  const [dataSummary, setDataSummary] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  const [consent, setConsent] = useState(() => loadConsent() || { essential: true, analytics: false, marketing: false, personalization: false })
  const [consentSaved, setConsentSaved] = useState(false)
  const [savingConsent, setSavingConsent] = useState(false)

  const [exportRequested, setExportRequested] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportResult, setExportResult] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteReason, setDeleteReason] = useState(DELETION_REASONS[0])
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteResult, setDeleteResult] = useState(null)

  useEffect(() => {
    if (!user?.userId) return
    getMyDataSummary(user.userId)
      .then(d => setDataSummary(d))
      .finally(() => setLoadingData(false))
  }, [user?.userId])

  async function handleSaveConsent() {
    setSavingConsent(true)
    saveConsent(consent)
    await updateConsentPreferences(user?.userId, consent).catch(() => {})
    setSavingConsent(false)
    setConsentSaved(true)
    setTimeout(() => setConsentSaved(false), 3000)
  }

  async function handleRequestExport() {
    setExportLoading(true)
    try {
      const res = await requestDataExport(user?.userId)
      setExportResult(res)
      setExportRequested(true)
    } catch (_) {
      alert('Export request failed. Please try again.')
    } finally {
      setExportLoading(false)
    }
  }

  async function handleDeleteConfirm() {
    if (deleteConfirmText.toLowerCase() !== 'delete my account') return
    setDeleteLoading(true)
    try {
      const res = await requestAccountDeletion(user?.userId, deleteReason)
      setDeleteResult(res)
      setShowDeleteModal(false)
    } catch (_) {
      alert('Deletion request failed. Please contact support.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const s = {
    h2: { fontSize: 16, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 },
    sub: { fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 16 },
    label: { fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
    input: {
      width: '100%', background: 'var(--navy)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '9px 12px', color: 'var(--cream)', fontSize: 13,
    },
    btn: (variant = 'primary') => ({
      padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      cursor: 'pointer', border: 'none',
      background: variant === 'primary' ? 'var(--gold)' : variant === 'danger' ? 'var(--red)' : 'var(--navy3)',
      color: variant === 'primary' ? 'var(--navy)' : '#fff',
    }),
  }

  const consentDate = loadConsent()?.savedAt
    ? new Date(loadConsent().savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 740, margin: '0 auto', padding: '24px 16px 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            GDPR · YOUR RIGHTS
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--cream)', marginBottom: 8 }}>Data Privacy Centre</h1>
          <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7 }}>
            Under the General Data Protection Regulation (GDPR) and Norway's Personopplysningsloven, you have the right to
            access, correct, export, and erase your personal data. Manage everything here.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Cookie / Consent Preferences */}
          <Card>
            <h2 style={s.h2}>🍪 Cookie & Consent Preferences</h2>
            <p style={s.sub}>
              Control how we use cookies and trackers.
              {consentDate && <span> Last updated: <strong style={{ color: 'var(--cream)' }}>{consentDate}</strong>.</span>}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {CONSENT_CATS.map(cat => (
                <div key={cat.id} style={{
                  background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{cat.label}</span>
                      {cat.required && (
                        <span style={{ fontSize: 10, background: 'var(--navy3)', color: 'var(--text2)', borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>
                          Required
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>{cat.desc}</p>
                  </div>
                  <Toggle
                    on={cat.required ? true : consent[cat.id]}
                    disabled={cat.required}
                    onChange={v => setConsent(p => ({ ...p, [cat.id]: v }))}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={handleSaveConsent}
              disabled={savingConsent}
              style={s.btn('primary')}
            >
              {savingConsent ? 'Saving…' : consentSaved ? '✓ Saved!' : 'Save Preferences'}
            </button>
          </Card>

          {/* Data I hold on you */}
          <Card>
            <h2 style={s.h2}>📋 Data We Hold About You</h2>
            <p style={s.sub}>Categories of personal data processed by Nordic Vitals and the Arctico platform.</p>
            {loadingData ? (
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Loading…</p>
            ) : dataSummary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dataSummary.categories.map(cat => (
                  <div key={cat.name} style={{
                    background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{cat.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>{cat.items.join(', ')}</p>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        Retained: {cat.retained}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Unable to load data summary.</p>
            )}
          </Card>

          {/* Data Export */}
          <Card>
            <h2 style={s.h2}>📥 Export Your Data (Right of Portability)</h2>
            <p style={s.sub}>
              Request a full machine-readable export of your personal data (GDPR Article 20).
              We will prepare a JSON/CSV archive and notify you by email when it is ready (typically within 24 hours).
            </p>
            {exportRequested && exportResult ? (
              <div style={{ background: 'rgba(56,161,105,.12)', border: '1px solid var(--green-ok)', borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ color: 'var(--green-ok)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>✓ Export requested</p>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>
                  Request ID: <code style={{ color: 'var(--cream)' }}>{exportResult.requestId}</code><br />
                  Estimated ready: <strong style={{ color: 'var(--cream)' }}>{new Date(exportResult.estimatedReadyAt).toLocaleString()}</strong>.
                  You will receive a download link by email.
                </p>
              </div>
            ) : (
              <button onClick={handleRequestExport} disabled={exportLoading} style={s.btn('secondary')}>
                {exportLoading ? 'Requesting…' : 'Request Data Export'}
              </button>
            )}
          </Card>

          {/* Legal rights summary */}
          <Card>
            <h2 style={s.h2}>⚖️ Your GDPR Rights</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>Under the GDPR you have the following rights regarding your personal data:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
              {[
                { icon: '👁️', title: 'Right of Access', desc: 'Request a copy of all data we hold.' },
                { icon: '✏️', title: 'Right to Rectify', desc: 'Correct inaccurate personal data via Profile settings.' },
                { icon: '🗑️', title: 'Right to Erasure', desc: 'Request deletion of your account and data (see below).' },
                { icon: '📦', title: 'Right to Portability', desc: 'Export your data in machine-readable format.' },
                { icon: '🛑', title: 'Right to Object', desc: 'Object to processing for marketing or analytics purposes.' },
                { icon: '⏸️', title: 'Right to Restrict', desc: 'Limit how we process your data in certain circumstances.' },
              ].map(r => (
                <div key={r.title} style={{ background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{r.icon}</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)', marginBottom: 3 }}>{r.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0 }}>{r.desc}</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 14, lineHeight: 1.6 }}>
              To exercise any right, contact our Data Protection Officer at{' '}
              <a href="mailto:privacy@nordicvitals.com" style={{ color: 'var(--gold)' }}>privacy@nordicvitals.com</a>.
              You also have the right to lodge a complaint with{' '}
              <a href="https://www.datatilsynet.no" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>Datatilsynet</a> (Norway's DPA).
            </p>
          </Card>

          {/* Account Deletion */}
          <Card style={{ border: '1px solid rgba(229,62,62,.35)' }}>
            <h2 style={{ ...s.h2, color: 'var(--red)' }}>🗑️ Delete My Account (Right to Erasure)</h2>
            <p style={s.sub}>
              Permanently delete your Nordic Vitals account and all associated personal data (GDPR Article 17).
              <br />
              <strong style={{ color: 'var(--cream)' }}>Note:</strong> Financial records required by Norwegian accounting law (Bokføringsloven § 13) are retained for 10 years
              regardless of account deletion. Erasure cannot be undone.
            </p>
            {deleteResult ? (
              <div style={{ background: 'rgba(229,62,62,.1)', border: '1px solid var(--red)', borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ color: 'var(--red)', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Deletion requested</p>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>
                  Your account is scheduled for deletion on{' '}
                  <strong style={{ color: 'var(--cream)' }}>
                    {new Date(deleteResult.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </strong>.
                  You have a {deleteResult.gracePeriodDays}-day grace period to cancel by contacting support.
                </p>
              </div>
            ) : (
              <button onClick={() => setShowDeleteModal(true)} style={s.btn('danger')}>
                Request Account Deletion
              </button>
            )}
          </Card>

        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--red)', borderRadius: 14, padding: 28, maxWidth: 460, width: '100%' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>⚠️ Delete Account</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
              This action schedules permanent deletion of your account with a 30-day grace period.
              Any active autoships, pending payouts, or open support tickets will be cancelled.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Reason for leaving</label>
              <select
                value={deleteReason}
                onChange={e => setDeleteReason(e.target.value)}
                style={{ ...s.input, marginTop: 6 }}
              >
                {DELETION_REASONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={s.label}>Type <strong>delete my account</strong> to confirm</label>
              <input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="delete my account"
                style={{ ...s.input, marginTop: 6 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                style={{ ...s.btn('secondary'), flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteConfirmText.toLowerCase() !== 'delete my account' || deleteLoading}
                style={{
                  ...s.btn('danger'), flex: 1,
                  opacity: deleteConfirmText.toLowerCase() !== 'delete my account' ? 0.4 : 1,
                }}
              >
                {deleteLoading ? 'Processing…' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
