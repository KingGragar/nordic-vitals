import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/mlmApi'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--navy)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '80px 24px 60px',
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
            ⬡ Nordic Vitals
          </div>
          <h2 style={{ color: 'var(--cream)', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Reset password
          </h2>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          {sent ? (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px',
                background: 'rgba(212,175,55,0.15)',
                border: '2px solid var(--gold)',
                borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '24px',
              }}>
                ✉
              </div>
              <h3 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>
                Check your inbox
              </h3>
              <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                If an account with <strong style={{ color: 'var(--cream)' }}>{email}</strong> exists,
                we've sent a password reset link. It expires in 30 minutes.
              </p>
              <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.5, marginBottom: '24px' }}>
                Didn't receive it? Check your spam folder, or{' '}
                <button
                  onClick={() => { setSent(false); setEmail('') }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--gold)', cursor: 'pointer',
                    fontSize: '13px', fontWeight: '600', padding: 0,
                  }}
                >
                  try a different email
                </button>.
              </p>
              <Link
                to="/login"
                className="btn btn-gold"
                style={{ display: 'inline-flex', justifyContent: 'center', padding: '10px 24px', fontSize: '14px' }}
              >
                Back to Sign In
              </Link>
            </div>
          ) : (
            /* Request form */
            <>
              <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
                Enter the email address on your account and we'll send you a link to reset your password.
              </p>

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
                <div style={{ marginBottom: '20px' }}>
                  <label className="label-text">Email address</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
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
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text2)' }}>
                Remember your password?{' '}
                <Link
                  to="/login"
                  style={{ color: 'var(--gold)', fontWeight: '600' }}
                >
                  Sign in →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
