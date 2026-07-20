import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'

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

  const [toast, setToast] = useState(null)

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  function handleSavePersonal(e) {
    e.preventDefault()
    showToast('Profile updated successfully ✓')
  }

  function handleUpdatePassword(e) {
    e.preventDefault()
    if (!passwords.current) return showToast('Please enter your current password', true)
    if (passwords.next.length < 6) return showToast('New password must be at least 6 characters', true)
    if (passwords.next !== passwords.confirm) return showToast('Passwords do not match', true)
    setPasswords({ current: '', next: '', confirm: '' })
    showToast('Password updated successfully ✓')
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
            <button type="submit" className="btn btn-gold">
              Save Changes
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
            <button type="submit" className="btn btn-outline">
              Update Password
            </button>
          </form>
        </div>
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
