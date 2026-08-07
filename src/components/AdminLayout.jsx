import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getAdminKycQueue, getAdminTickets, getInventory,
  getWebhookLog, getPayoutQueue, getAdminReviews,
} from '../api/mlmApi'
import AdminGlobalSearch from './AdminGlobalSearch'

const navLinks = [
  { to: '/admin/overview',  label: '📋 Overview' },
  { to: '/admin',           label: '👥 Members',         end: true },
  { to: '/admin/customers', label: '🛒 Retail Customers' },
  { to: '/admin/network',   label: '🌐 Network Tree' },
  { to: '/admin/products',   label: '🛍️ Products' },
  { to: '/admin/bundles',    label: '📦 Starter Packs' },
  { to: '/admin/inventory',  label: '🗃️ Inventory' },
  { to: '/admin/orders',     label: '📦 Orders' },
  { to: '/admin/shipping',   label: '🚚 Shipping Config' },
  { to: '/admin/tax',        label: '🧾 Tax / VAT Config' },
  { to: '/admin/membership-fees', label: '🎫 Membership Fees' },
  { to: '/admin/subscriptions',  label: '📑 Subscription Plans' },
  { to: '/admin/returns',    label: '↩️ Returns & Refunds' },
  { to: '/admin/autoships',  label: '♻️ Autoships' },
  { to: '/admin/runs',               label: '⚡ Commission Runs' },
  { to: '/admin/commission-preview', label: '🧮 Commission Preview' },
  { to: '/admin/payouts',            label: '💸 Payout Queue' },
  { to: '/admin/reports',   label: '📊 Reports' },
  { to: '/admin/analytics',  label: '📈 Analytics' },
  { to: '/admin/financials', label: '💰 Financial P&L' },
  { to: '/admin/retention',  label: '📉 Retention & Churn' },
  { to: '/admin/forecast',   label: '🔮 Revenue Forecast' },
  { to: '/admin/plan',      label: '⚙️ Plan Config' },
  { to: '/admin/promos',           label: '🏷️ Promo Codes' },
  { to: '/admin/gift-cards',      label: '🎁 Gift Cards' },
  { to: '/admin/abandoned-carts', label: '🛒 Abandoned Carts' },
  { to: '/admin/banners',       label: '📢 Storefront Banners' },
  { to: '/admin/challenges',    label: '🏅 Challenges' },
  { to: '/admin/reviews',       label: '⭐ Product Reviews' },
  { to: '/admin/referrals',     label: '🔗 Referrals' },
  { to: '/admin/announcements', label: '📣 Announcements' },
  { to: '/admin/audit-log',       label: '🔍 Audit Log' },
  { to: '/admin/appeals',         label: '⚖️ Commission Appeals' },
  { to: '/admin/support',         label: '🎫 Support' },
  { to: '/admin/messages',        label: '💬 Direct Messages' },
  { to: '/admin/email-templates', label: '✉️ Email Templates' },
  { to: '/admin/segments',        label: '🎯 Smart Segments' },
  { to: '/admin/campaigns',       label: '📧 Email Campaigns' },
  { to: '/admin/notifications',   label: '🔔 Notification Broadcast' },
  { to: '/admin/tokens',          label: '🪙 Token Management' },
  { to: '/admin/exchange-rates',  label: '💱 Exchange Rates' },
  { to: '/admin/roles',           label: '🔐 Roles & Permissions' },
  { to: '/admin/compliance',      label: '⚖️ Compliance' },
  { to: '/admin/kyc',             label: '🔏 KYC Queue' },
  { to: '/admin/gdpr',            label: '🛡️ GDPR Requests' },
  { to: '/admin/blog',            label: '📝 Blog' },
  { to: '/admin/newsletter',      label: '📨 Newsletter Subscribers' },
  { to: '/admin/events',          label: '🎙️ Events' },
  { to: '/admin/ranks',           label: '🏅 Rank Manager' },
  { to: '/admin/fraud',           label: '🛡️ Fraud & Risk' },
  { to: '/admin/ab-tests',       label: '🧪 A/B Tests' },
  { to: '/admin/surveys',        label: '📋 Surveys' },
  { to: '/admin/content',        label: '📁 Content Library' },
  { to: '/admin/integrations',    label: '🔌 Integrations' },
  { to: '/admin/webhooks',        label: '📡 Webhooks' },
  { to: '/admin/import',          label: '📥 Bulk Import' },
  { to: '/admin/settings',        label: '🔧 Settings' },
  { to: '/admin/system-status',  label: '🖥️ System Status' },
  { to: '/admin/launch',          label: '🚀 Launch Checklist' },
]

const SIDEBAR_W = 220
const MOBILE_BP = 768
const BANNER_H = 33
const ALERT_POLL_MS = 60_000

async function fetchOpsAlerts() {
  const [kycRes, ticketsRes, invRes, whRes, payoutsRes, reviewsRes] = await Promise.allSettled([
    getAdminKycQueue({ status: 'pending' }),
    getAdminTickets({ status: 'open' }),
    getInventory(),
    getWebhookLog(),
    getPayoutQueue(),
    getAdminReviews({ status: 'pending' }),
  ])
  const kycCount = kycRes.status === 'fulfilled' ? (kycRes.value || []).length : 0
  const ticketCount = ticketsRes.status === 'fulfilled' ? (ticketsRes.value || []).length : 0
  const lowStockCount = invRes.status === 'fulfilled'
    ? (invRes.value || []).filter(i => i.stock <= i.reorder_point).length : 0
  const webhookFails = whRes.status === 'fulfilled'
    ? (whRes.value || []).filter(w => w.status === 'failed').length : 0
  const pendingPayouts = payoutsRes.status === 'fulfilled'
    ? (payoutsRes.value || []).filter(p => p.status === 'pending').length : 0
  const pendingReviews = reviewsRes.status === 'fulfilled'
    ? (reviewsRes.value?.total || 0) : 0
  return [
    { label: 'KYC pending review', count: kycCount, link: '/admin/kyc', icon: '🔏' },
    { label: 'Open support tickets', count: ticketCount, link: '/admin/support', icon: '🎫' },
    { label: 'Reviews pending moderation', count: pendingReviews, link: '/admin/reviews', icon: '⭐' },
    { label: 'Low / out-of-stock SKUs', count: lowStockCount, link: '/admin/inventory', icon: '🗃️' },
    { label: 'Failed webhook deliveries', count: webhookFails, link: '/admin/integrations', icon: '🔌' },
    { label: 'Pending payouts', count: pendingPayouts, link: '/admin/payouts', icon: '💸' },
  ]
}

function OpsAlertBell({ navigate }) {
  const [alerts, setAlerts] = useState([])
  const [open, setOpen] = useState(false)
  const dropRef = useRef(null)
  const total = alerts.reduce((s, a) => s + a.count, 0)

  const refresh = useCallback(async () => {
    try { setAlerts(await fetchOpsAlerts()) } catch (_) {}
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, ALERT_POLL_MS)
    return () => clearInterval(id)
  }, [refresh])

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={dropRef} style={{ position: 'relative', marginLeft: 'auto' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title={total ? `${total} items need attention` : 'No alerts'}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#e9d5ff', fontSize: '18px', lineHeight: 1,
          padding: '2px 6px', position: 'relative', display: 'flex', alignItems: 'center',
        }}
      >
        🔔
        {total > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-2px',
            background: '#ef4444', color: '#fff',
            fontSize: '10px', fontWeight: 700, lineHeight: 1,
            borderRadius: '999px', padding: '2px 5px',
            minWidth: '16px', textAlign: 'center',
          }}>
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '280px', background: '#1e1b4b', borderRadius: '10px',
          border: '1px solid #4338ca', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 9999, overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: '1px solid #312e81',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.8px', color: '#a5b4fc',
          }}>
            OPS ALERTS
          </div>
          {alerts.map(a => (
            <button
              key={a.link}
              onClick={() => { setOpen(false); navigate(a.link) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid #312e81', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#312e81'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{a.icon}</span>
              <span style={{ flex: 1, fontSize: '12px', color: '#c7d2fe' }}>{a.label}</span>
              <span style={{
                fontSize: '12px', fontWeight: 700,
                color: a.count > 0 ? '#f87171' : '#6ee7b7',
                flexShrink: 0,
              }}>
                {a.count > 0 ? a.count : '✓'}
              </span>
            </button>
          ))}
          {alerts.length === 0 && (
            <div style={{ padding: '16px 14px', fontSize: '12px', color: '#6ee7b7', textAlign: 'center' }}>
              All clear — no alerts
            </div>
          )}
          <div style={{
            padding: '8px 14px', fontSize: '10px', color: '#6b7280', textAlign: 'right',
          }}>
            Refreshes every 60s
          </div>
        </div>
      )}
    </div>
  )
}

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
        <AdminGlobalSearch />
        <OpsAlertBell navigate={navigate} />
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
