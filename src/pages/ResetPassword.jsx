import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { resetPassword } from '../api/mlmApi'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  if (!token) {
    return (
      <div style={{
        background: 'var(--navy)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '80px 24px 60px',
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
              ⬡ Nordic Vitals
            </div>
          </div>
          <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚠</div>
            <h3 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
              Invalid reset link
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              This password reset link is invalid or missing. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-gold"
              style={{ display: 'inline-flex', justifyContent: 'center', padding: '10px 24px', fontSize: '14px' }}>
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0
    : password.length < 8 ? 1
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
    : 2
  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e']

  return (
    <div style={{
      background: 'var(--navy)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '80px 24px 60px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            ⬡ Nordic Vitals
          </div>
          <h2 style={{ color: 'var(--cream)', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Choose a new password
          </h2>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px',
                background: 'rgba(34,197,94,0.12)',
                border: '2px solid #22c55e',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', fontSize: '24px',
              }}>
                ✓
              </div>
              <h3 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                Password updated
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Your password has been changed. Redirecting you to Sign In…
              </p>
              <Link to="/login" className="btn btn-gold"
                style={{ display: 'inline-flex', justifyContent: 'center', padding: '10px 24px', fontSize: '14px' }}>
                Sign In now →
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div style={{
                  background: 'rgba(229,62,62,0.12)',
                  border: '1px solid rgba(229,62,62,0.4)',
                  borderRadius: '8px', padding: '12px 16px',
                  color: '#fca5a5', fontSize: '14px', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* New password */}
                <div style={{ marginBottom: '16px' }}>
                  <label className="label-text">New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="input"
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="new-password"
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: '12px', top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        color: 'var(--text2)', cursor: 'pointer',
                        fontSize: '13px', padding: '0',
                      }}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{
                        display: 'flex', gap: '4px', marginBottom: '4px',
                      }}>
                        {[1, 2, 3].map(i => (
                          <div key={i} style={{
                            flex: 1, height: '3px', borderRadius: '2px',
                            background: i <= strength ? strengthColor[strength] : 'var(--border)',
                            transition: 'background 0.2s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: strengthColor[strength] }}>
                        {strengthLabel[strength]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div style={{ marginBottom: '24px' }}>
                  <label className="label-text">Confirm password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="input"
                    placeholder="Repeat new password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    style={{
                      borderColor: confirm && confirm !== password
                        ? 'rgba(229,62,62,0.5)' : undefined,
                    }}
                  />
                  {confirm && confirm !== password && (
                    <p style={{ color: '#fca5a5', fontSize: '12px', marginTop: '4px' }}>
                      Passwords don't match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-gold"
                  disabled={loading}
                  style={{
                    width: '100%', justifyContent: 'center',
                    fontSize: '15px', padding: '12px',
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  {loading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text2)' }}>
                <Link to="/login" style={{ color: 'var(--gold)', fontWeight: '600' }}>
                  ← Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
