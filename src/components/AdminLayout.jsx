import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  { to: '/admin/overview', label: '📋 Overview' },
  { to: '/admin',          label: '👥 Members',         end: true },
  { to: '/admin/runs',     label: '⚡ Commission Runs' },
  { to: '/admin/payouts',  label: '💸 Payout Queue' },
  { to: '/admin/reports',  label: '📊 Reports' },
  { to: '/admin/plan',     label: '⚙️ Plan Config' },
  { to: '/admin/settings', label: '🔧 Settings' },
]

const SIDEBAR_W = 220
const MOBILE_BP = 768
const BANNER_H = 33

export default function AdminLayout({ children }) {
  const { logout } = useAuth()
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
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        {isMobile && (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: 'none', border: 'none', color: '#e9d5ff',
              fontSize: '18px', lineHeight: 1, cursor: 'pointer', padding: '2px',
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
        )}
        ⚙ ADMIN PANEL — Nordic Vitals
      </div>

      {/* Below banner: sidebar + main */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Sidebar */}
        <aside style={{
          width: `${SIDEBAR_W}px`,
          flexShrink: 0,
          background: 'var(--navy2)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? 0 : `${BANNER_H}px`,
          left: isMobile ? (open ? 0 : `-${SIDEBAR_W}px`) : 0,
          height: isMobile ? '100vh' : `calc(100vh - ${BANNER_H}px)`,
          overflowY: 'auto',
          zIndex: isMobile ? 300 : 100,
          transition: isMobile ? 'left 0.25s ease' : 'none',
        }}>
          {/* Branding + close btn on mobile */}
          <div style={{ padding: '20px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)', marginBottom: '2px' }}>
                Nordic Vitals
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', letterSpacing: '0.5px' }}>
                Admin Portal
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
          flex: 1,
          padding: isMobile ? '20px 16px' : '32px',
          overflowY: 'auto',
          minHeight: `calc(100vh - ${BANNER_H}px)`,
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
