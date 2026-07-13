import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Small delay for UX
    await new Promise(r => setTimeout(r, 300))

    const success = login(email, password)
    setLoading(false)

    if (success) {
      // Determine role from the USERS array via the returned context
      // login() sets user in context; we look up the role from email match
      if (email === 'admin@nordic.no') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } else {
      setError('Invalid email or password')
    }
  }

  return (
    <div style={{
      background: 'var(--navy)',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '80px',
      padding: '80px 24px 60px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
      }}>

        {/* Logo */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          <div style={{
            color: 'var(--gold)',
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '8px',
          }}>
            ⬡ Nordic Vitals
          </div>
          <h2 style={{
            color: 'var(--cream)',
            fontSize: '26px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
          }}>
            Welcome back
          </h2>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>

          {/* Error message */}
          {error && (
            <div style={{
              background: 'rgba(229,62,62,0.12)',
              border: '1px solid rgba(229,62,62,0.4)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label-text">Email address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <label className="label-text">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Remember me + Forgot password */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                color: 'var(--text2)',
              }}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: 'var(--gold)',
                    cursor: 'pointer',
                  }}
                />
                Remember me
              </label>
              <a
                href="#"
                onClick={e => e.preventDefault()}
                style={{
                  color: 'var(--gold)',
                  fontSize: '13px',
                  fontWeight: '600',
                  transition: 'opacity 0.18s',
                }}
                onMouseEnter={e => e.target.style.opacity = '0.7'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn-gold"
              disabled={loading}
              style={{
                width: '100%',
                justifyContent: 'center',
                fontSize: '15px',
                padding: '12px',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Join link */}
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            fontSize: '14px',
            color: 'var(--text2)',
          }}>
            Not a member?{' '}
            <Link
              to="/join"
              style={{
                color: 'var(--gold)',
                fontWeight: '600',
                transition: 'opacity 0.18s',
              }}
              onMouseEnter={e => e.target.style.opacity = '0.7'}
              onMouseLeave={e => e.target.style.opacity = '1'}
            >
              Join here →
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          padding: '12px 16px',
          background: 'var(--navy2)',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}>
          <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: 1.6 }}>
            <span style={{ fontWeight: '700', color: '#6b7280' }}>Demo accounts:</span><br />
            member@nordic.no / demo123<br />
            admin@nordic.no / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
