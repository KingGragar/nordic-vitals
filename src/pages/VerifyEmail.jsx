import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { verifyEmail } from '../api/mlmApi'

const S = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--navy1)', padding: '24px' },
  card: { maxWidth: 440, width: '100%', background: 'var(--navy2)', borderRadius: 16,
          border: '1px solid var(--border)', padding: '40px 36px', textAlign: 'center' },
  icon: { fontSize: 48, marginBottom: 16, display: 'block' },
  h1:   { fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: '0 0 10px' },
  sub:  { fontSize: 14, color: 'var(--text2)', margin: '0 0 28px', lineHeight: 1.6 },
  btn:  { display: 'inline-block', padding: '11px 28px', borderRadius: 8, fontWeight: 600,
          fontSize: 14, textDecoration: 'none', background: 'var(--gold)', color: '#0a1628',
          border: 'none', cursor: 'pointer' },
  spin: { display: 'inline-block', width: 32, height: 32, border: '3px solid var(--border)',
          borderTop: '3px solid var(--gold)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', marginBottom: 16 },
}

const style = document.createElement('style')
style.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
document.head.appendChild(style)

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  if (status === 'loading') return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.spin} />
        <h1 style={S.h1}>Verifying your email…</h1>
        <p style={S.sub}>Just a moment.</p>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div style={S.wrap}>
      <div style={S.card}>
        <span style={S.icon}>✅</span>
        <h1 style={S.h1}>Email verified!</h1>
        <p style={S.sub}>
          Your Nordic Vitals account is now active. Sign in to access your dashboard.
        </p>
        <Link to="/login" style={S.btn}>Go to Login</Link>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <span style={S.icon}>⚠️</span>
        <h1 style={S.h1}>Verification failed</h1>
        <p style={S.sub}>
          This link is invalid or has expired. Please{' '}
          {token ? 're-register or request a new verification email' : 'check the link in your inbox'}.
        </p>
        <Link to="/join" style={S.btn}>Back to Sign Up</Link>
      </div>
    </div>
  )
}
