import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getNotificationPrefs, saveNotificationPrefs } from '../../api/mlmApi'

const CHANNELS = ['email', 'inapp', 'push']
const CHANNEL_LABELS = { email: '📧 Email', inapp: '🔔 In-App', push: '📱 Push (PWA)' }
const CHANNEL_DESC = {
  email: 'Delivered to your registered email address.',
  inapp: 'Shown in the bell notification feed inside the platform.',
  push:  'Browser push notifications when the app is open or installed.',
}

const CATEGORIES = [
  {
    key: 'commissions',
    label: '💰 Commissions & Payouts',
    desc: 'New commission credited, payout processed, payout rejected.',
    default: { email: true, inapp: true, push: true },
  },
  {
    key: 'rank_change',
    label: '🏅 Rank Changes',
    desc: 'When you advance or drop a rank.',
    default: { email: true, inapp: true, push: true },
  },
  {
    key: 'new_recruit',
    label: '👥 New Recruits',
    desc: 'When someone joins via your referral link.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'order_updates',
    label: '📦 Order Updates',
    desc: 'Order confirmed, shipped, delivered, or returned.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'autoship',
    label: '♻️ Autoship Reminders',
    desc: 'Upcoming autoship renewals and billing reminders.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'announcements',
    label: '📣 Announcements',
    desc: 'Company news, product launches, and platform updates.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'events',
    label: '🎙️ Events & Webinars',
    desc: 'Registration confirmations and event reminders.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'training',
    label: '🎓 Training & Certification',
    desc: 'New modules available, quiz results, reward claims.',
    default: { email: false, inapp: true, push: false },
  },
  {
    key: 'promotions',
    label: '🎁 Promotions & Offers',
    desc: 'Flash sales, bonus point events, and exclusive member deals.',
    default: { email: true, inapp: false, push: false },
  },
  {
    key: 'support',
    label: '🎫 Support Tickets',
    desc: 'Replies and status changes on your support tickets.',
    default: { email: true, inapp: true, push: false },
  },
  {
    key: 'kyc',
    label: '🔏 KYC / Account Security',
    desc: 'Identity verification updates and security alerts.',
    default: { email: true, inapp: true, push: true },
  },
  {
    key: 'system',
    label: '⚙️ System Alerts',
    desc: 'Maintenance windows, password changes, and login alerts.',
    default: { email: true, inapp: true, push: false },
  },
]

const DIGEST_OPTIONS = [
  { value: 'instant',  label: 'Instant',       desc: 'Send each notification immediately.' },
  { value: 'daily',    label: 'Daily Digest',   desc: 'Batch into one email each morning at 08:00.' },
  { value: 'weekly',   label: 'Weekly Digest',  desc: 'One summary email every Monday morning.' },
]

function buildDefaults() {
  const prefs = {}
  CATEGORIES.forEach(c => { prefs[c.key] = { ...c.default } })
  return { channels: prefs, digest: 'instant', quietHoursEnabled: false, quietStart: '22:00', quietEnd: '07:00' }
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        background: checked ? 'var(--gold)' : 'var(--navy3)',
        position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: disabled ? 0.4 : 1,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: checked ? 21 : 3, width: 16, height: 16,
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  )
}

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>×</button>
    </div>
  )
}

export default function NotificationPreferences() {
  const { user } = useAuth()
  const [prefs, setPrefs]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [dirty, setDirty]       = useState(false)
  const [toast, setToast]       = useState(null)
  const [saved, setSaved]       = useState(false)

  useEffect(() => {
    getNotificationPrefs(user?.memberId || 'NV-10042')
      .then(p => setPrefs(p || buildDefaults()))
      .catch(() => setPrefs(buildDefaults()))
      .finally(() => setLoading(false))
  }, [user])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function setChannel(catKey, channel, value) {
    setPrefs(p => ({
      ...p,
      channels: { ...p.channels, [catKey]: { ...p.channels[catKey], [channel]: value } },
    }))
    setDirty(true)
    setSaved(false)
  }

  function setAllChannel(channel, value) {
    setPrefs(p => {
      const channels = { ...p.channels }
      CATEGORIES.forEach(c => { channels[c.key] = { ...channels[c.key], [channel]: value } })
      return { ...p, channels }
    })
    setDirty(true)
    setSaved(false)
  }

  function setPref(key, value) {
    setPrefs(p => ({ ...p, [key]: value }))
    setDirty(true)
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveNotificationPrefs(user?.memberId || 'NV-10042', prefs)
      setDirty(false)
      setSaved(true)
      showToast('Notification preferences saved.')
    } catch {
      showToast('Failed to save — please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setPrefs(buildDefaults())
    setDirty(true)
    setSaved(false)
    showToast('Reset to defaults — save to apply.')
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading preferences…</div>
    </DashboardLayout>
  )

  const allEmailOn  = CATEGORIES.every(c => prefs.channels[c.key]?.email)
  const allInappOn  = CATEGORIES.every(c => prefs.channels[c.key]?.inapp)
  const allPushOn   = CATEGORIES.every(c => prefs.channels[c.key]?.push)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 780 }}>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}

        {/* Header */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
              🔔 Notification Preferences
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>
              Choose which notifications you receive and how they're delivered.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleReset}
              className="btn btn-outline btn-sm"
              style={{ fontSize: 12 }}
            >
              Reset to defaults
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className="btn btn-sm"
              style={{
                background: saved && !dirty ? '#16a34a' : 'var(--gold)',
                color: '#000', fontWeight: 700, fontSize: 13,
                opacity: (!dirty && !saved) ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving…' : saved && !dirty ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Delivery digest preference */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
            📬 Email Delivery Frequency
          </h2>
          <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            Controls how often enabled email notifications are batched and sent.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {DIGEST_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPref('digest', opt.value)}
                style={{
                  padding: '10px 16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${prefs.digest === opt.value ? 'var(--gold)' : 'var(--border)'}`,
                  background: prefs.digest === opt.value ? 'rgba(201,168,76,0.12)' : 'var(--navy2)',
                  flex: 1, minWidth: 140,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: prefs.digest === opt.value ? 'var(--gold)' : 'var(--cream)', marginBottom: 2 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Quiet hours */}
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
                🌙 Quiet Hours
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                Suppress push and in-app notifications during these hours.
              </p>
            </div>
            <Toggle
              checked={prefs.quietHoursEnabled}
              onChange={v => setPref('quietHoursEnabled', v)}
            />
          </div>
          {prefs.quietHoursEnabled && (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>FROM</label>
                <input
                  type="time"
                  value={prefs.quietStart}
                  onChange={e => setPref('quietStart', e.target.value)}
                  className="input"
                  style={{ width: 120, fontSize: 14 }}
                />
              </div>
              <span style={{ color: 'var(--text2)', marginTop: 14 }}>—</span>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>UNTIL</label>
                <input
                  type="time"
                  value={prefs.quietEnd}
                  onChange={e => setPref('quietEnd', e.target.value)}
                  className="input"
                  style={{ width: 120, fontSize: 14 }}
                />
              </div>
              <p style={{ fontSize: 11, color: 'var(--text2)', marginTop: 12, alignSelf: 'flex-end' }}>
                Times are in your local timezone. Email notifications are not affected.
              </p>
            </div>
          )}
        </div>

        {/* Category matrix */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24 }}>
          {/* Channel header row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px',
            background: 'var(--navy3)', padding: '12px 20px',
            borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Notification Type
            </div>
            {CHANNELS.map(ch => (
              <div key={ch} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {ch === 'inapp' ? 'In-App' : ch.charAt(0).toUpperCase() + ch.slice(1)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                  <Toggle
                    checked={ch === 'email' ? allEmailOn : ch === 'inapp' ? allInappOn : allPushOn}
                    onChange={v => setAllChannel(ch, v)}
                  />
                </div>
                <div style={{ fontSize: 9, color: 'var(--text2)', marginTop: 2 }}>Toggle all</div>
              </div>
            ))}
          </div>

          {/* Category rows */}
          {CATEGORIES.map((cat, idx) => {
            const catPrefs = prefs.channels[cat.key] || cat.default
            return (
              <div
                key={cat.key}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 90px',
                  padding: '14px 20px', alignItems: 'center',
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                  borderBottom: idx < CATEGORIES.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ paddingRight: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{cat.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{cat.desc}</div>
                </div>
                {CHANNELS.map(ch => (
                  <div key={ch} style={{ display: 'flex', justifyContent: 'center' }}>
                    <Toggle
                      checked={catPrefs[ch] ?? false}
                      onChange={v => setChannel(cat.key, ch, v)}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Channel descriptions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {CHANNELS.map(ch => (
            <div
              key={ch}
              className="card"
              style={{ flex: 1, minWidth: 180, padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}
            >
              <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 4 }}>
                {CHANNEL_LABELS[ch]}
              </div>
              {CHANNEL_DESC[ch]}
            </div>
          ))}
        </div>

        {/* GDPR note */}
        <div style={{
          padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)', fontSize: 11, color: 'var(--text2)',
        }}>
          ⚠️ <strong style={{ color: 'var(--cream)' }}>Transactional emails</strong> (order receipts, payout confirmations, password resets, KYC decisions) are always sent regardless of preferences — they are required for service delivery under GDPR Art. 6(1)(b). You can manage broader data preferences under{' '}
          <a href="/dashboard/data-privacy" style={{ color: 'var(--gold)' }}>Data Privacy</a>.
        </div>

        {/* Save bar (sticky on mobile) */}
        {dirty && (
          <div style={{
            position: 'sticky', bottom: 20, marginTop: 24,
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn"
              style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, padding: '10px 24px' }}
            >
              {saving ? 'Saving…' : '💾 Save Preferences'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
