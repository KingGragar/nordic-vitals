import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout'

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '12px' }}>
      <div style={{ position: 'relative', width: '40px', height: '22px', flexShrink: 0 }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          style={{
            opacity: 0, width: 0, height: 0, position: 'absolute',
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            background: checked ? 'var(--green2)' : 'var(--navy3)',
            borderRadius: '999px',
            border: `1px solid ${checked ? 'var(--green2)' : 'var(--border)'}`,
            transition: 'background 0.2s, border-color 0.2s',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '20px' : '3px',
            width: '14px',
            height: '14px',
            background: '#fff',
            borderRadius: '50%',
            transition: 'left 0.2s',
          }}
        />
      </div>
      <span style={{ fontSize: '14px', color: 'var(--text)', userSelect: 'none' }}>{label}</span>
    </label>
  )
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '12px' }}>{title}</h2>
        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  )
}

export default function Settings() {
  // General settings
  const [companyName, setCompanyName] = useState('Nordic Vitals AS')
  const [currency, setCurrency]       = useState('NOK')
  const [timezone, setTimezone]       = useState('Europe/Oslo')
  const [language, setLanguage]       = useState('Norwegian')

  // Notification toggles
  const [notifs, setNotifs] = useState({
    newMember:       true,
    rankChange:      true,
    commissionRun:   true,
    smsWithdrawal:   false,
  })

  // Danger zone modals
  const [showResetConfirm, setShowResetConfirm]   = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function toggleNotif(key) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function saveGeneral() {
    showToast('General settings saved ✓')
  }

  function saveNotifications() {
    showToast('Notification preferences saved ✓')
  }

  function handleReset() {
    setShowResetConfirm(false)
    showToast('Action cancelled — contact system administrator')
  }

  function handleDelete() {
    setShowDeleteConfirm(false)
    showToast('Action cancelled — contact system administrator')
  }

  const inputRow = (label, content) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
      <label className="label-text" style={{ margin: 0, minWidth: '160px', flexShrink: 0 }}>
        {label}
      </label>
      {content}
    </div>
  )

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', marginBottom: '28px' }}>
        System Settings
      </h1>

      {/* General card */}
      <div className="card" style={{ maxWidth: '560px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          General
        </h2>

        {inputRow('Company Name',
          <input
            className="input"
            style={{ maxWidth: '260px' }}
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
          />
        )}
        {inputRow('Currency',
          <select className="input" style={{ maxWidth: '120px' }} value={currency} onChange={e => setCurrency(e.target.value)}>
            <option>NOK</option>
            <option>EUR</option>
            <option>USD</option>
            <option>SEK</option>
            <option>DKK</option>
          </select>
        )}
        {inputRow('Timezone',
          <select className="input" style={{ maxWidth: '220px' }} value={timezone} onChange={e => setTimezone(e.target.value)}>
            <option>Europe/Oslo</option>
            <option>Europe/Stockholm</option>
            <option>Europe/Copenhagen</option>
            <option>UTC</option>
          </select>
        )}
        {inputRow('Language',
          <div style={{ display: 'flex', gap: '4px' }}>
            {['Norwegian', 'English'].map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className="btn btn-sm"
                style={{
                  background: language === lang ? 'var(--navy3)' : 'transparent',
                  border: `1px solid ${language === lang ? 'var(--gold)' : 'var(--border)'}`,
                  color: language === lang ? 'var(--gold)' : 'var(--text2)',
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: '4px' }}>
          <button className="btn btn-gold btn-sm" onClick={saveGeneral}>
            Save
          </button>
        </div>
      </div>

      {/* Notifications card */}
      <div className="card" style={{ maxWidth: '560px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>
          Notifications
        </h2>

        <ToggleSwitch
          checked={notifs.newMember}
          onChange={() => toggleNotif('newMember')}
          label="Email on new member"
        />
        <ToggleSwitch
          checked={notifs.rankChange}
          onChange={() => toggleNotif('rankChange')}
          label="Email on rank change"
        />
        <ToggleSwitch
          checked={notifs.commissionRun}
          onChange={() => toggleNotif('commissionRun')}
          label="Email on commission run complete"
        />
        <ToggleSwitch
          checked={notifs.smsWithdrawal}
          onChange={() => toggleNotif('smsWithdrawal')}
          label="SMS on withdrawal request"
        />

        <div style={{ marginTop: '8px' }}>
          <button className="btn btn-gold btn-sm" onClick={saveNotifications}>
            Save Preferences
          </button>
        </div>
      </div>

      {/* Danger zone card */}
      <div
        className="card"
        style={{ maxWidth: '560px', borderColor: '#991b1b', borderWidth: '1px' }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#fca5a5', marginBottom: '6px' }}>
          Danger Zone
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '20px' }}>
          These actions are irreversible. Proceed with extreme caution.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: '8px',
            background: 'rgba(127,29,29,0.15)', border: '1px solid #7f1d1d',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>
                Reset all commission data
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                Removes all historical commission records and resets balances to zero.
              </div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowResetConfirm(true)}
            >
              Reset Commission Data
            </button>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: '8px',
            background: 'rgba(127,29,29,0.15)', border: '1px solid #7f1d1d',
            flexWrap: 'wrap', gap: '10px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>
                Delete all members
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                Permanently removes all member accounts and associated data.
              </div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete All Members
            </button>
          </div>
        </div>
      </div>

      {/* Reset commission confirm */}
      {showResetConfirm && (
        <ConfirmModal
          title="Reset all commission data?"
          message="This will permanently delete all historical commission records and reset all member balances to zero. This action cannot be undone."
          onConfirm={handleReset}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}

      {/* Delete all members confirm */}
      {showDeleteConfirm && (
        <ConfirmModal
          title="Delete all members?"
          message="This will permanently delete all member accounts, trees, commission history, and associated data. This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
