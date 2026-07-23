import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
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

const SIDEBAR_W = 220
const MOBILE_BP = 768

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP - 1}px)`)
    const handler = e => {
      setIsMobile(e.matches)
      if (!e.matches) setOpen(false)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  function handleLogout() {
    logout()
    navigate('/')
  }

  const sidebar = (
    <aside style={{
      width: `${SIDEBAR_W}px`,
      flexShrink: 0,
      background: 'var(--navy2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      top: isMobile ? 0 : 0,
      left: isMobile ? (open ? 0 : `-${SIDEBAR_W}px`) : 0,
      height: '100vh',
      zIndex: 300,
      transition: isMobile ? 'left 0.25s ease' : 'none',
    }}>
      {/* Top: branding */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', marginBottom: '2px' }}>
            Nordic Vitals
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px' }}>
            Member Portal
          </div>
        </div>
        {isMobile && (
          <button
            onClick={close}
            style={{
              background: 'none', border: 'none', color: 'var(--text2)',
              fontSize: '20px', lineHeight: 1, cursor: 'pointer', padding: '4px',
            }}
            aria-label="Close menu"
          >
            ✕
          </button>
        )}
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
            onClick={isMobile ? close : undefined}
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
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--navy)' }}>
      {sidebar}

      {/* Overlay on mobile when sidebar open */}
      {isMobile && open && (
        <div
          onClick={close}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.55)',
          }}
        />
      )}

      {/* Main content */}
      <main style={{
        marginLeft: isMobile ? 0 : `${SIDEBAR_W}px`,
        flex: 1,
        padding: isMobile ? '0' : '32px',
        overflowY: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '14px 18px',
            background: 'var(--navy2)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky', top: 0, zIndex: 100,
          }}>
            <button
              onClick={() => setOpen(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--cream)',
                fontSize: '22px', lineHeight: 1, cursor: 'pointer', padding: '2px',
              }}
              aria-label="Open menu"
            >
              ☰
            </button>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>
              Nordic Vitals
            </span>
            <span style={{ fontSize: '11px', color: 'var(--gold)', marginLeft: 'auto' }}>
              {user?.memberId ?? ''}
            </span>
          </div>
        )}

        <div style={{ padding: isMobile ? '20px 16px' : 0, flex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
