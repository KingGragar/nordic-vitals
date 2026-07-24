import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        background: 'var(--navy)',
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: '80px',
          fontWeight: '900',
          color: 'var(--border)',
          lineHeight: 1,
          marginBottom: '24px',
          letterSpacing: '-4px',
        }}>
          404
        </div>
        <h1 style={{
          color: 'var(--cream)',
          fontSize: 'clamp(20px, 4vw, 28px)',
          fontWeight: '800',
          marginBottom: '12px',
          letterSpacing: '-0.5px',
        }}>
          Page not found
        </h1>
        <p style={{
          color: 'var(--text2)',
          fontSize: '15px',
          lineHeight: 1.6,
          maxWidth: '360px',
          marginBottom: '36px',
        }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/" className="btn btn-gold" style={{ padding: '12px 24px' }}>
            ← Back to Home
          </Link>
          <Link to="/shop" className="btn btn-outline" style={{ padding: '12px 24px' }}>
            Browse Products
          </Link>
        </div>
      </div>
    </>
  )
}
