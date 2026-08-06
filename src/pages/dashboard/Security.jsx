import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import {
  getSecurityProfile, changePassword,
  setupTwoFactor, verifyAndEnableTwoFactor, disableTwoFactor,
  revokeSession,
} from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

const DEVICE_ICON = { MacBook: '💻', iPhone: '📱', iPad: '📱', Windows: '🖥️', Android: '📱', Linux: '🖥️' }
function deviceIcon(device) {
  for (const [k, v] of Object.entries(DEVICE_ICON)) if (device.includes(k)) return v
  return '🖥️'
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDateShort(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`
  return fmtDate(iso)
}

function KpiCard({ icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: '22px', marginBottom: '6px' }}>{icon}</div>
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '18px', color: color || 'var(--cream)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak', color: '#f97316' },
    { label: 'Fair', color: '#eab308' },
    { label: 'Good', color: '#84cc16' },
    { label: 'Strong', color: '#22c55e' },
    { label: 'Very Strong', color: '#10b981' },
  ]
  const lvl = levels[Math.min(score, 5)]
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i < score ? lvl.color : 'var(--border)' }} />
        ))}
      </div>
      <div style={{ fontSize: '11px', color: lvl.color }}>{lvl.label}</div>
    </div>
  )
}

function PasswordTab({ userId, onToast }) {
  const [form, setForm] = useState({ current: '', newPw: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setSuccess(false)
    if (!form.current) { setError('Enter your current password.'); return }
    if (form.newPw.length < 8) { setError('New password must be at least 8 characters.'); return }
    if (form.newPw !== form.confirm) { setError('Passwords do not match.'); return }
    setSaving(true)
    try {
      await changePassword(userId, { currentPassword: form.current, newPassword: form.newPw })
      setSuccess(true)
      setForm({ current: '', newPw: '', confirm: '' })
      onToast('Password changed successfully ✓')
    } catch (err) {
      setError(err.message || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Change Password</h3>
      <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>
        Use a strong, unique password. We recommend at least 12 characters with a mix of letters, numbers, and symbols.
      </p>
      <form onSubmit={handleSave}>
        {['current', 'newPw', 'confirm'].map(field => {
          const labels = { current: 'Current Password', newPw: 'New Password', confirm: 'Confirm New Password' }
          return (
            <div key={field} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>
                {labels[field]}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={show[field === 'current' ? 'current' : field === 'newPw' ? 'new' : 'confirm'] ? 'text' : 'password'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={field === 'current' ? 'Current password' : field === 'newPw' ? 'New password' : 'Confirm new password'}
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShow(s => ({ ...s, [field === 'current' ? 'current' : field === 'newPw' ? 'new' : 'confirm']: !s[field === 'current' ? 'current' : field === 'newPw' ? 'new' : 'confirm'] }))}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)', fontSize: '16px' }}
                >
                  {show[field === 'current' ? 'current' : field === 'newPw' ? 'new' : 'confirm'] ? '🙈' : '👁️'}
                </button>
              </div>
              {field === 'newPw' && <PasswordStrength password={form.newPw} />}
            </div>
          )
        })}
        {error && (
          <div style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', marginBottom: '14px' }}>
            {error}
          </div>
        )}
        <button className="btn btn-gold" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Change Password'}
        </button>
      </form>

      <div style={{
        marginTop: '32px', background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '14px 18px',
      }}>
        <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>Password Tips</div>
        <ul style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.8', margin: 0, paddingLeft: '18px' }}>
          <li>At least 12 characters</li>
          <li>Mix uppercase & lowercase letters</li>
          <li>Include numbers and symbols (!@#$%)</li>
          <li>Never reuse a password from another site</li>
          <li>Consider using a password manager</li>
        </ul>
      </div>
    </div>
  )
}

function TwoFactorTab({ userId, profile, onRefresh, onToast }) {
  const [phase, setPhase] = useState('idle') // idle | setup | verify | disabling | codes
  const [setupData, setSetupData] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState([])

  async function startSetup() {
    setError('')
    setSaving(true)
    try {
      const d = await setupTwoFactor(userId)
      setSetupData(d)
      setPhase('setup')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function verify() {
    setError('')
    if (!code.trim()) { setError('Enter the 6-digit code.'); return }
    setSaving(true)
    try {
      const res = await verifyAndEnableTwoFactor(userId, code.replace(/\s/g,''))
      setRecoveryCodes(res.recoveryCodes || [])
      setPhase('codes')
      onToast('2FA enabled ✓')
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function disable() {
    setError('')
    if (!password) { setError('Enter your password to disable 2FA.'); return }
    setSaving(true)
    try {
      await disableTwoFactor(userId, password)
      setPhase('idle')
      setPassword('')
      onToast('2FA disabled')
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const enabled = profile?.twoFactorEnabled

  return (
    <div style={{ maxWidth: '500px' }}>
      <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Two-Factor Authentication</h3>
      <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '24px' }}>
        2FA adds an extra layer of security by requiring a code from your authenticator app at every login.
      </p>

      {/* Status badge */}
      <div style={{
        background: enabled ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
        border: `1px solid ${enabled ? '#22c55e' : '#ef4444'}`,
        borderRadius: '10px', padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
      }}>
        <span style={{ fontSize: '24px' }}>{enabled ? '🛡️' : '⚠️'}</span>
        <div>
          <div style={{ color: enabled ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '14px' }}>
            {enabled ? '2FA is Enabled' : '2FA is Disabled'}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '12px' }}>
            {enabled ? 'Your account is protected with an authenticator app.' : 'Your account is less secure without 2FA.'}
          </div>
        </div>
        {enabled && phase === 'idle' && (
          <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setPhase('disabling')}>Disable</button>
        )}
      </div>

      {/* Not enabled — setup flow */}
      {!enabled && phase === 'idle' && (
        <button className="btn btn-gold" onClick={startSetup} disabled={saving}>
          {saving ? 'Loading…' : '⚡ Enable 2FA'}
        </button>
      )}

      {!enabled && phase === 'setup' && setupData && (
        <div>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Step 1 — Add to your authenticator app</div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '14px' }}>
              Open Google Authenticator, Authy, or any TOTP app and add a new account manually using this key:
            </p>
            <div style={{
              background: '#0d1117', border: '1px solid var(--border)', borderRadius: '8px',
              padding: '12px 16px', fontFamily: 'monospace', fontSize: '16px',
              letterSpacing: '3px', color: 'var(--gold)', textAlign: 'center', marginBottom: '8px',
            }}>
              {setupData.manualKey}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '11px', textAlign: 'center' }}>
              Account name: <strong>Nordic Vitals</strong> · Algorithm: TOTP (SHA-1, 30s)
            </div>
          </div>

          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ color: 'var(--gold)', fontWeight: 600, marginBottom: '12px', fontSize: '14px' }}>Step 2 — Verify the code</div>
            <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>
              Enter the 6-digit code shown in your authenticator app
            </label>
            <input
              className="input"
              placeholder="123 456"
              value={code}
              onChange={e => setCode(e.target.value.replace(/[^0-9]/g,'').slice(0,6))}
              maxLength={6}
              style={{ width: '100%', fontSize: '22px', letterSpacing: '4px', textAlign: 'center' }}
            />
            {error && (
              <div style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginTop: '10px' }}>{error}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setPhase('idle'); setCode(''); setError('') }}>Cancel</button>
            <button className="btn btn-gold" onClick={verify} disabled={saving || code.length < 6}>
              {saving ? 'Verifying…' : 'Enable 2FA'}
            </button>
          </div>
        </div>
      )}

      {phase === 'codes' && (
        <div>
          <div style={{
            background: 'rgba(234,179,8,0.1)', border: '1px solid #eab308',
            borderRadius: '10px', padding: '20px', marginBottom: '20px',
          }}>
            <div style={{ color: '#eab308', fontWeight: 700, marginBottom: '8px' }}>⚠️ Save your recovery codes</div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>
              Store these in a safe place. Each code can only be used once if you lose access to your authenticator app.
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
              fontFamily: 'monospace', fontSize: '13px',
            }}>
              {recoveryCodes.map(c => (
                <div key={c} style={{ background: '#0d1117', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--cream)' }}>{c}</div>
              ))}
            </div>
          </div>
          <button className="btn btn-gold" onClick={() => setPhase('idle')}>Done — I've saved my codes</button>
        </div>
      )}

      {/* Disabling flow */}
      {enabled && phase === 'disabling' && (
        <div>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ color: '#fca5a5', fontWeight: 600, marginBottom: '12px' }}>Confirm disable 2FA</div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '14px' }}>Enter your account password to confirm.</p>
            <input className="input" type="password" placeholder="Your password" value={password}
              onChange={e => setPassword(e.target.value)} style={{ width: '100%' }} />
            {error && (
              <div style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginTop: '10px' }}>{error}</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline btn-sm" onClick={() => { setPhase('idle'); setPassword(''); setError('') }}>Cancel</button>
            <button className="btn btn-danger" onClick={disable} disabled={saving}>
              {saving ? 'Disabling…' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      )}

      {/* Recovery codes view (when already enabled) */}
      {enabled && phase === 'idle' && profile?.recoveryCodes?.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '13px', marginBottom: '12px' }}>Recovery Codes</div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px',
            fontFamily: 'monospace', fontSize: '13px',
          }}>
            {profile.recoveryCodes.map(c => (
              <div key={c} style={{ background: '#0d1117', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 12px', color: 'var(--cream)' }}>{c}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SessionsTab({ userId, profile, onRefresh, onToast }) {
  const [revoking, setRevoking] = useState(null)

  async function handleRevoke(sessionId) {
    setRevoking(sessionId)
    try {
      await revokeSession(userId, sessionId)
      onToast('Session revoked ✓')
      onRefresh()
    } finally {
      setRevoking(null)
    }
  }

  const sessions = profile?.activeSessions || []
  const history = profile?.loginHistory || []

  return (
    <div>
      {/* Active Sessions */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Active Sessions</h3>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>
          These devices are currently signed in to your account. Revoke any sessions you don't recognise.
        </p>
        {sessions.length === 0 ? (
          <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '32px' }}>No active sessions found.</div>
        ) : sessions.map(s => (
          <div key={s.id} style={{
            background: 'var(--navy2)',
            border: `1px solid ${s.isCurrent ? 'var(--gold)' : 'var(--border)'}`,
            borderRadius: '12px', padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px',
          }}>
            <span style={{ fontSize: '28px' }}>{deviceIcon(s.device)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{s.device}</span>
                {s.isCurrent && <span className="badge" style={{ background: '#78350f', color: '#fcd34d', fontSize: '10px' }}>THIS DEVICE</span>}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.browser} · {s.os}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px' }}>
                {s.ip} · {s.location} · Last active {fmtDateShort(s.lastActive)}
              </div>
            </div>
            {!s.isCurrent && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleRevoke(s.id)}
                disabled={revoking === s.id}
              >
                {revoking === s.id ? '…' : 'Revoke'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Login History */}
      <div>
        <h3 style={{ color: 'var(--cream)', fontWeight: 700, marginBottom: '6px', fontSize: '16px' }}>Login History</h3>
        <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>
          Recent login attempts to your account. Failed attempts from unfamiliar locations should be investigated.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date / Time', 'IP Address', 'Location', 'Device', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600, fontSize: '11px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--cream)' }}>{fmtDate(h.at)}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: '12px' }}>{h.ip}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{h.location}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{h.device}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${h.success ? 'badge-green' : ''}`} style={!h.success ? { background: '#7f1d1d', color: '#fca5a5' } : {}}>
                      {h.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.some(h => !h.success) && (
          <div style={{
            marginTop: '16px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
            borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px',
          }}>
            <span style={{ fontSize: '18px' }}>🚨</span>
            <div>
              <div style={{ color: '#fca5a5', fontWeight: 600, fontSize: '13px', marginBottom: '2px' }}>Suspicious Login Attempt Detected</div>
              <div style={{ color: 'var(--text2)', fontSize: '12px' }}>
                We detected a failed login from an unexpected location. If this wasn't you, change your password and enable 2FA immediately.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Security() {
  const { user } = useAuth()
  const userId = user?.memberId || 'NV-10042'

  const [tab, setTab] = useState('password')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)

  async function loadProfile() {
    const d = await getSecurityProfile(userId)
    setProfile(d)
    setLoading(false)
  }

  useEffect(() => { loadProfile() }, [userId])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const pwChangedAgo = profile?.passwordChangedAt
    ? (() => {
        const d = Date.now() - new Date(profile.passwordChangedAt).getTime()
        const days = Math.floor(d / 86400000)
        return days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`
      })()
    : '—'

  return (
    <DashboardLayout>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'var(--green2)', color: '#fff', padding: '12px 20px',
          borderRadius: '10px', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>Security Center</h1>
        <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Manage your password, two-factor authentication, and active sessions.</p>
      </div>

      {/* KPI strip */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '14px', marginBottom: '28px' }}>
          <KpiCard icon="🔑" label="Password Changed" value={pwChangedAgo} sub="Keep it fresh every 90 days" color="var(--gold)" />
          <KpiCard icon="🛡️" label="Two-Factor Auth" value={profile?.twoFactorEnabled ? 'Enabled' : 'Disabled'} sub={profile?.twoFactorEnabled ? 'Account protected' : 'Recommended'} color={profile?.twoFactorEnabled ? 'var(--green-ok)' : 'var(--red)'} />
          <KpiCard icon="🖥️" label="Active Sessions" value={profile?.activeSessions?.length || 0} sub="Devices signed in" color="var(--cream)" />
          <KpiCard icon="🕐" label="Last Login" value={profile?.loginHistory?.[0] ? fmtDateShort(profile.loginHistory[0].at) : '—'} sub={profile?.loginHistory?.[0]?.location || ''} color="var(--cream)" />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'password', label: '🔑 Password' },
          { key: '2fa', label: '🛡️ Two-Factor Auth' },
          { key: 'sessions', label: '🖥️ Sessions & History' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            color: tab === t.key ? 'var(--gold)' : 'var(--text2)',
            borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {tab === 'password' && <PasswordTab userId={userId} onToast={showToast} />}
          {tab === '2fa' && <TwoFactorTab userId={userId} profile={profile} onRefresh={loadProfile} onToast={showToast} />}
          {tab === 'sessions' && <SessionsTab userId={userId} profile={profile} onRefresh={loadProfile} onToast={showToast} />}
        </>
      )}
    </DashboardLayout>
  )
}
