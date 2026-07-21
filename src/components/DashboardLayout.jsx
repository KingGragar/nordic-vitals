import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/dashboard',             label: '🏠 Dashboard',   end: true },
  { to: '/dashboard/tree',        label: '🌳 My Tree' },
  { to: '/dashboard/commissions', label: '💰 Commissions' },
  { to: '/dashboard/earnings',    label: '📈 Earnings' },
  { to: '/dashboard/wallet',      label: '💳 Wallet' },
  { to: '/dashboard/referral',    label: '🔗 Referral' },
  { to: '/dashboard/orders',      label: '📦 My Orders' },
  { to: '/dashboard/profile',     label: '👤 Profile' },
]

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy)' }}>
      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: 'var(--navy2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: 100,
      }}>
        {/* Top: branding */}
        <div style={{ padding: '24px 20px 16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', marginBottom: '2px' }}>
            Nordic Vitals
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px' }}>
            Member Portal
          </div>
        </div>

        {/* Member info */}
        <div style={{
          margin: '0 12px 16px',
          background: 'var(--navy3)',
          borderRadius: '10px',
          padding: '14px 14px',
          border: '1px solid var(--border)',
        }}>
          <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '14px', marginBottom: '2px' }}>
            {user?.name ?? 'Member'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--gold)', marginBottom: '6px' }}>
            {user?.memberId ?? '—'}
          </div>
          <span className="badge badge-grey" style={{ color: '#c0c8d8', fontSize: '10px' }}>
            ★ {user?.rank ?? 'Unranked'}
          </span>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 8px', overflowY: 'auto' }}>
          {navLinks.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '2px',
                fontSize: '13px',
                fontWeight: 500,
                color: isActive ? 'var(--gold)' : 'var(--text)',
                background: isActive ? 'var(--navy3)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar bottom */}
        <div style={{
          padding: '16px 16px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          <Link
            to="/"
            style={{
              fontSize: '13px',
              color: 'var(--text2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--cream)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text2)'}
          >
            ← Shop
          </Link>
          <button className="btn btn-outline btn-sm" onClick={handleLogout} style={{ width: '100%', justifyContent: 'center' }}>
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        marginLeft: '220px',
        flex: 1,
        padding: '32px',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  )
}
