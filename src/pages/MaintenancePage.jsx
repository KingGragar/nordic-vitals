import { Link } from 'react-router-dom'
import { readMaintenanceMode } from '../api/mlmApi'

export default function MaintenancePage() {
  const { message, returnTime } = readMaintenanceMode()

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🔧</div>

        <h1 style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--cream)',
          marginBottom: 12,
          letterSpacing: '-0.5px',
        }}>
          Under Maintenance
        </h1>

        <p style={{
          fontSize: 16,
          color: 'var(--text2)',
          lineHeight: 1.7,
          marginBottom: returnTime ? 8 : 32,
        }}>
          {message || "We're performing scheduled maintenance and will be back shortly."}
        </p>

        {returnTime && (
          <p style={{
            fontSize: 13,
            color: 'var(--text3)',
            marginBottom: 32,
          }}>
            Expected return: <strong style={{ color: 'var(--gold)' }}>{returnTime}</strong>
          </p>
        )}

        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-gold"
            style={{ minWidth: 140 }}
          >
            Try Again
          </button>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button className="btn btn-outline" style={{ minWidth: 140 }}>
              Admin Login
            </button>
          </Link>
        </div>

        <p style={{ marginTop: 48, fontSize: 12, color: 'var(--text3)' }}>
          © {new Date().getFullYear()} Nordic Vitals AS
        </p>
      </div>
    </div>
  )
}
