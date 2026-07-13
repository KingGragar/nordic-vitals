import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/admin',          label: '👥 Members',         end: true },
  { to: '/admin/runs',     label: '⚡ Commission Runs' },
  { to: '/admin/payouts',  label: '💸 Payout Queue' },
  { to: '/admin/reports',  label: '📊 Reports' },
  { to: '/admin/plan',     label: '⚙️ Plan Config' },
  { to: '/admin/settings', label: '🔧 Settings' },
]

export default function AdminLayout({ children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--navy)' }}>
      {/* Top banner */}
      <div style={{
        background: '#3b0764',
        color: '#e9d5ff',
        padding: '8px 32px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '1px',
        flexShrink: 0,
        zIndex: 200,
        position: 'sticky',
        top: 0,
      }}>
        ⚙ ADMIN PANEL — Nordic Vitals
      </div>

      {/* Below banner: sidebar + main */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: '220px',
          flexShrink: 0,
          background: 'var(--navy2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: '33px',
          height: 'calc(100vh - 33px)',
          overflowY: 'auto',
        }}>
          {/* Branding */}
          <div style={{ padding: '20px 20px 14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', marginBottom: '2px' }}>
              Nordic Vitals
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px' }}>
              Admin Portal
            </div>
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
              ← Back to shop
            </Link>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Log out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main style={{
          flex: 1,
          padding: '32px',
          overflowY: 'auto',
          minHeight: 'calc(100vh - 33px)',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
