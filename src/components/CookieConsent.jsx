import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'nv_cookie_consent'

const CATEGORIES = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Required for the website to function. Cannot be disabled.',
    required: true,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Help us understand how visitors use the site (page views, session duration). No personal data is sold.',
    required: false,
  },
  {
    id: 'marketing',
    label: 'Marketing',
    description: 'Used to show relevant promotions and track referral attribution.',
    required: false,
  },
  {
    id: 'personalization',
    label: 'Personalization',
    description: 'Remember your preferences (language, display settings) across visits.',
    required: false,
  },
]

function loadConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveConsent(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prefs, savedAt: new Date().toISOString() }))
  } catch (_) {}
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [prefs, setPrefs] = useState({
    essential: true, analytics: false, marketing: false, personalization: false,
  })

  useEffect(() => {
    const stored = loadConsent()
    if (!stored) {
      setTimeout(() => setVisible(true), 1200)
    }
  }, [])

  function acceptAll() {
    const all = { essential: true, analytics: true, marketing: true, personalization: true }
    saveConsent(all)
    setVisible(false)
    setShowModal(false)
  }

  function rejectAll() {
    const minimal = { essential: true, analytics: false, marketing: false, personalization: false }
    saveConsent(minimal)
    setVisible(false)
    setShowModal(false)
  }

  function saveCustom() {
    saveConsent(prefs)
    setVisible(false)
    setShowModal(false)
  }

  if (!visible) return null

  const btnBase = {
    padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', border: 'none', transition: 'opacity .15s',
  }

  return (
    <>
      {/* Main banner */}
      {!showModal && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
          background: 'var(--navy2)', borderTop: '1px solid var(--border)',
          padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'center',
          flexWrap: 'wrap', boxShadow: '0 -4px 24px rgba(0,0,0,.4)',
        }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, margin: 0 }}>
              🍪 We use cookies to provide essential site functions, analyse performance, and personalise your experience.
              By clicking <strong>"Accept All"</strong> you consent to all cookies. See our{' '}
              <Link to="/privacy" style={{ color: 'var(--gold)' }}>Privacy Policy</Link>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowModal(true)}
              style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              Manage Preferences
            </button>
            <button
              onClick={rejectAll}
              style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              Reject All
            </button>
            <button
              onClick={acceptAll}
              style={{ ...btnBase, background: 'var(--gold)', color: 'var(--navy)' }}
            >
              Accept All
            </button>
          </div>
        </div>
      )}

      {/* Preferences modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{
            background: 'var(--navy2)', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: 560,
            padding: 28, borderTop: '1px solid var(--border)', maxHeight: '80vh', overflowY: 'auto',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--cream)', marginBottom: 8 }}>Cookie Preferences</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
              Choose which cookies you allow. Essential cookies are always active. Your choice is stored locally and
              can be changed at any time from your <Link to="/dashboard/data-privacy" style={{ color: 'var(--gold)' }}>Data Privacy</Link> settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {CATEGORIES.map(cat => (
                <div key={cat.id} style={{
                  background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 10,
                  padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, cursor: cat.required ? 'default' : 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cream)' }}>{cat.label}</span>
                      {cat.required && (
                        <span style={{ fontSize: 10, background: 'var(--navy3)', color: 'var(--text2)', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>
                          Always On
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{cat.description}</span>
                  </label>
                  <div
                    onClick={() => !cat.required && setPrefs(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                    style={{
                      width: 42, height: 24, borderRadius: 12, flexShrink: 0, marginTop: 2,
                      background: (cat.required || prefs[cat.id]) ? 'var(--gold)' : 'var(--border)',
                      position: 'relative', cursor: cat.required ? 'default' : 'pointer', transition: 'background .2s',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3,
                      left: (cat.required || prefs[cat.id]) ? 'calc(100% - 21px)' : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s',
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={rejectAll} style={{ ...btnBase, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', flex: 1 }}>
                Reject All
              </button>
              <button onClick={saveCustom} style={{ ...btnBase, background: 'var(--navy3)', color: 'var(--cream)', border: '1px solid var(--border)', flex: 1 }}>
                Save My Choices
              </button>
              <button onClick={acceptAll} style={{ ...btnBase, background: 'var(--gold)', color: 'var(--navy)', flex: 1 }}>
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function useCookieConsent() {
  const stored = loadConsent()
  return stored || { essential: true, analytics: false, marketing: false, personalization: false }
}
