import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { updateProfile, updatePassword, setup2FA, enable2FA, disable2FA, isMock2FAEnabled } from '../../api/mlmApi'

export default function Profile() {
  const { user } = useAuth()

  const [personalInfo, setPersonalInfo] = useState({
    name:    user?.name  ?? 'Lars Eriksen',
    email:   user?.email ?? 'member@nordic.no',
    phone:   '+47 912 34 567',
    country: 'Norway',
  })

  const [passwords, setPasswords] = useState({
    current: '',
    next:    '',
    confirm: '',
  })

  const [toast, setToast]   = useState(null)
  const [saving, setSaving] = useState(false)

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => isMock2FAEnabled(user?.userId ?? ''))
  const [showEnable2FA, setShowEnable2FA]   = useState(false)
  const [showDisable2FA, setShowDisable2FA] = useState(false)
  const [twoFASetup, setTwoFASetup]         = useState(null) // { secret, qr_uri }
  const [twoFACode, setTwoFACode]           = useState('')
  const [twoFALoading, setTwoFALoading]     = useState(false)
  const [twoFAError, setTwoFAError]         = useState('')

  async function openEnable2FA() {
    setTwoFAError('')
    setTwoFACode('')
    setTwoFALoading(true)
    try {
      const setup = await setup2FA(user?.userId ?? '', user?.email ?? '')
      setTwoFASetup(setup)
      setShowEnable2FA(true)
    } catch (err) {
      showToast(err.message || 'Failed to start 2FA setup', true)
    } finally {
      setTwoFALoading(false)
    }
  }

  async function handleEnable2FA(e) {
    e.preventDefault()
    setTwoFAError('')
    setTwoFALoading(true)
    try {
      await enable2FA(user?.userId ?? '', twoFACode)
      setTwoFactorEnabled(true)
      setShowEnable2FA(false)
      setTwoFASetup(null)
      setTwoFACode('')
      showToast('Two-factor authentication enabled ✓')
    } catch (err) {
      setTwoFAError(err.message || 'Invalid code')
    } finally {
      setTwoFALoading(false)
    }
  }

  async function handleDisable2FA(e) {
    e.preventDefault()
    setTwoFAError('')
    setTwoFALoading(true)
    try {
      await disable2FA(user?.userId ?? '', twoFACode)
      setTwoFactorEnabled(false)
      setShowDisable2FA(false)
      setTwoFACode('')
      showToast('Two-factor authentication disabled')
    } catch (err) {
      setTwoFAError(err.message || 'Invalid code')
    } finally {
      setTwoFALoading(false)
    }
  }

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSavePersonal(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile(user?.memberId ?? 'NV-10042', {
        name:    personalInfo.name,
        email:   personalInfo.email,
        phone:   personalInfo.phone,
        country: personalInfo.country,
      })
      showToast('Profile updated successfully ✓')
    } catch {
      showToast('Failed to update profile', true)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    if (!passwords.current) return showToast('Please enter your current password', true)
    if (passwords.next.length < 6) return showToast('New password must be at least 6 characters', true)
    if (passwords.next !== passwords.confirm) return showToast('Passwords do not match', true)
    setSaving(true)
    try {
      await updatePassword(user?.memberId ?? 'NV-10042', {
        current_password: passwords.current,
        new_password: passwords.next,
      })
      setPasswords({ current: '', next: '', confirm: '' })
      showToast('Password updated successfully ✓')
    } catch {
      showToast('Failed to update password', true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '28px' }}>
        Profile
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>

        {/* Personal Info */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
            Personal Information
          </h2>
          <form onSubmit={handleSavePersonal}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="label-text">Full Name</label>
                <input
                  className="input"
                  value={personalInfo.name}
                  onChange={e => setPersonalInfo(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-text">Email Address</label>
                <input
                  className="input"
                  type="email"
                  value={personalInfo.email}
                  onChange={e => setPersonalInfo(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-text">Phone Number</label>
                <input
                  className="input"
                  type="tel"
                  value={personalInfo.phone}
                  onChange={e => setPersonalInfo(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-text">Country</label>
                <input
                  className="input"
                  value={personalInfo.country}
                  onChange={e => setPersonalInfo(p => ({ ...p, country: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="label-text">Member ID</label>
              <input
                className="input"
                value={user?.memberId ?? 'NV-10042'}
                readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed', marginBottom: '20px' }}
              />
            </div>
            <button type="submit" className="btn btn-gold" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* KYC Status */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>KYC Status</h2>
            <span className="badge badge-green" style={{ fontSize: '12px', padding: '4px 10px' }}>
              ✓ Verified
            </span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
            Last verified: <span style={{ color: 'var(--cream)' }}>2026-01-15</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
            {[
              { label: 'National ID', status: 'Verified ✓' },
              { label: 'Address Proof', status: 'Verified ✓' },
            ].map(doc => (
              <div
                key={doc.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--navy)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '14px', color: 'var(--text)' }}>{doc.label}</span>
                <span style={{ fontSize: '13px', color: 'var(--green-ok)', fontWeight: 600 }}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>

          <a
            href="#"
            style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 600 }}
            onClick={e => e.preventDefault()}
          >
            Update documents →
          </a>
        </div>

        {/* Security */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
            Security
          </h2>

          {/* Change Password */}
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
            Change Password
          </h3>
          <form onSubmit={handleUpdatePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label className="label-text">Current Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter current password"
                  value={passwords.current}
                  onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                  autoComplete="current-password"
                />
              </div>
              <div>
                <label className="label-text">New Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Enter new password"
                  value={passwords.next}
                  onChange={e => setPasswords(p => ({ ...p, next: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label-text">Confirm New Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-outline" disabled={saving}>
              {saving ? 'Saving…' : 'Update Password'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '28px 0' }} />

          {/* Two-Factor Authentication */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                Two-Factor Authentication (2FA)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5, maxWidth: '340px' }}>
                {twoFactorEnabled
                  ? 'Your account is protected with an authenticator app. You\'ll need it each time you sign in.'
                  : 'Add an extra layer of security by requiring a code from your authenticator app at login.'}
              </p>
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '20px',
                background: twoFactorEnabled ? 'rgba(34,197,94,0.12)' : 'rgba(100,116,139,0.12)',
                color: twoFactorEnabled ? 'var(--green-ok)' : 'var(--text2)',
                border: `1px solid ${twoFactorEnabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
              }}
            >
              {twoFactorEnabled ? '✓ Enabled' : 'Disabled'}
            </span>
          </div>
          <div style={{ marginTop: '16px' }}>
            {twoFactorEnabled ? (
              <button
                className="btn btn-outline"
                onClick={() => { setTwoFACode(''); setTwoFAError(''); setShowDisable2FA(true) }}
                style={{ fontSize: '13px', color: '#fca5a5', borderColor: 'rgba(229,62,62,0.4)' }}
              >
                Disable 2FA
              </button>
            ) : (
              <button
                className="btn btn-outline"
                onClick={openEnable2FA}
                disabled={twoFALoading}
                style={{ fontSize: '13px' }}
              >
                {twoFALoading ? 'Loading…' : 'Enable 2FA'}
              </button>
            )}
          </div>
        </div>

        {/* Enable 2FA Modal */}
        {showEnable2FA && twoFASetup && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}>
            <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '32px', position: 'relative' }}>
              <button
                onClick={() => { setShowEnable2FA(false); setTwoFASetup(null); setTwoFACode(''); setTwoFAError('') }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '18px', cursor: 'pointer' }}
              >✕</button>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
                Enable Two-Factor Auth
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '24px', lineHeight: 1.5 }}>
                Scan this QR code with Google Authenticator, Authy, or any TOTP app.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ padding: '12px', background: 'white', borderRadius: '8px' }}>
                  <QRCodeSVG value={twoFASetup.qr_uri} size={160} />
                </div>
              </div>

              <div style={{
                background: 'var(--navy)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>
                  Can't scan? Enter this key manually:
                </div>
                <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--gold)', letterSpacing: '2px' }}>
                  {twoFASetup.secret}
                </div>
              </div>

              {twoFAError && (
                <div style={{ background: 'rgba(229,62,62,0.12)', border: '1px solid rgba(229,62,62,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠ {twoFAError}
                </div>
              )}

              <form onSubmit={handleEnable2FA}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-text">Confirm with code from your app</label>
                  <input
                    className="input"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '6px' }}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px' }}>
                    In demo mode, any 6-digit code works except 000000.
                  </p>
                </div>
                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={twoFALoading || twoFACode.length !== 6}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {twoFALoading ? 'Verifying…' : 'Activate 2FA'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Disable 2FA Modal */}
        {showDisable2FA && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px',
          }}>
            <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '32px', position: 'relative' }}>
              <button
                onClick={() => { setShowDisable2FA(false); setTwoFACode(''); setTwoFAError('') }}
                style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '18px', cursor: 'pointer' }}
              >✕</button>

              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
                Disable Two-Factor Auth
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '24px', lineHeight: 1.5 }}>
                Enter a code from your authenticator app to confirm you want to disable 2FA.
              </p>

              {twoFAError && (
                <div style={{ background: 'rgba(229,62,62,0.12)', border: '1px solid rgba(229,62,62,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                  ⚠ {twoFAError}
                </div>
              )}

              <form onSubmit={handleDisable2FA}>
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-text">Authenticator Code</label>
                  <input
                    className="input"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={twoFACode}
                    onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                    style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '6px' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-outline"
                  disabled={twoFALoading || twoFACode.length !== 6}
                  style={{ width: '100%', justifyContent: 'center', color: '#fca5a5', borderColor: 'rgba(229,62,62,0.4)' }}
                >
                  {twoFALoading ? 'Verifying…' : 'Confirm Disable'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div
          className="toast"
          style={toast.isError ? { background: '#7f1d1d' } : {}}
        >
          {toast.msg}
        </div>
      )}
    </DashboardLayout>
  )
}
