import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { unsubscribeNewsletter } from '../api/mlmApi'

export default function Unsubscribe() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState('pending') // pending | loading | done | error
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setError('No unsubscribe token found. Please use the link from your email.')
    }
  }, [token])

  async function handleUnsubscribe() {
    setState('loading')
    try {
      const res = await unsubscribeNewsletter(token)
      if (res.ok) {
        setEmail(res.email || '')
        setState('done')
      } else {
        setError('This unsubscribe link is invalid or has already been used.')
        setState('error')
      }
    } catch {
      setError('Something went wrong. Please try again or contact support@nordicvitals.no.')
      setState('error')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: 'var(--gold)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: '#0a0a0f', fontSize: '18px' }}>N</div>
          <span style={{ color: 'var(--cream)', fontWeight: '700', fontSize: '18px' }}>Nordic Vitals</span>
        </div>
      </Link>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', maxWidth: '480px', width: '100%', textAlign: 'center' }}>

        {state === 'pending' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
            <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>Unsubscribe from Newsletter</h1>
            <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px' }}>
              You are about to unsubscribe from the Nordic Vitals newsletter. You won't receive blog updates, product news, or health tips anymore.
            </p>
            <button
              onClick={handleUnsubscribe}
              style={{ padding: '12px 32px', background: '#dc2626', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%', marginBottom: '16px' }}>
              Yes, Unsubscribe Me
            </button>
            <Link to="/" style={{ color: 'var(--text2)', fontSize: '13px', textDecoration: 'none' }}>
              Changed your mind? Go back to the site →
            </Link>
          </>
        )}

        {state === 'loading' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
            <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>Processing…</h1>
            <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Removing you from the list.</p>
          </>
        )}

        {state === 'done' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>You're Unsubscribed</h1>
            <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px' }}>
              {email ? <><strong style={{ color: 'var(--cream)' }}>{email}</strong><br /></> : ''}
              We've removed you from the Nordic Vitals newsletter. You won't receive any more marketing emails from us.
            </p>
            <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 24px', lineHeight: '1.5' }}>
              Note: You'll still receive essential transactional emails (order confirmations, shipping updates) if you're a customer.
            </p>
            <Link to="/blog"
              style={{ display: 'block', padding: '11px', background: 'var(--gold)', borderRadius: '10px', color: '#0a0a0f', fontWeight: '700', fontSize: '14px', textDecoration: 'none', marginBottom: '12px' }}>
              Still enjoy reading? Visit our Blog
            </Link>
            <Link to="/" style={{ color: 'var(--text2)', fontSize: '13px', textDecoration: 'none' }}>← Back to Nordic Vitals</Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700', margin: '0 0 12px' }}>Something Went Wrong</h1>
            <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: '1.6', margin: '0 0 28px' }}>{error}</p>
            <Link to="/contact"
              style={{ display: 'block', padding: '11px', background: 'none', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--cream)', fontSize: '14px', textDecoration: 'none', marginBottom: '12px' }}>
              Contact Support
            </Link>
            <Link to="/" style={{ color: 'var(--text2)', fontSize: '13px', textDecoration: 'none' }}>← Back to Nordic Vitals</Link>
          </>
        )}
      </div>

      <p style={{ color: 'var(--text2)', fontSize: '12px', marginTop: '24px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
        Nordic Vitals AS · Oslo, Norway · <Link to="/privacy" style={{ color: 'var(--text2)' }}>Privacy Policy</Link>
        <br />GDPR Art. 7(3): You have the right to withdraw consent at any time.
      </p>
    </div>
  )
}
