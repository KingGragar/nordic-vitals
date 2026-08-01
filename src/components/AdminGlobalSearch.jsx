import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ADMIN_MEMBERS, ADMIN_ORDERS, PRODUCTS } from '../data/mock'

const PAGES = [
  { label: 'Overview',              to: '/admin/overview',          icon: '📋' },
  { label: 'Members',               to: '/admin',                    icon: '👥' },
  { label: 'Network Tree',          to: '/admin/network',            icon: '🌐' },
  { label: 'Products',              to: '/admin/products',           icon: '🛍️' },
  { label: 'Starter Packs',         to: '/admin/bundles',            icon: '📦' },
  { label: 'Inventory',             to: '/admin/inventory',          icon: '🗃️' },
  { label: 'Orders',                to: '/admin/orders',             icon: '📦' },
  { label: 'Autoships',             to: '/admin/autoships',          icon: '♻️' },
  { label: 'Commission Runs',       to: '/admin/runs',               icon: '⚡' },
  { label: 'Commission Preview',    to: '/admin/commission-preview', icon: '🧮' },
  { label: 'Payout Queue',          to: '/admin/payouts',            icon: '💸' },
  { label: 'Reports',               to: '/admin/reports',            icon: '📊' },
  { label: 'Analytics',             to: '/admin/analytics',          icon: '📈' },
  { label: 'Financial P&L',         to: '/admin/financials',         icon: '💰' },
  { label: 'Retention & Churn',     to: '/admin/retention',          icon: '📉' },
  { label: 'Plan Config',           to: '/admin/plan',               icon: '⚙️' },
  { label: 'Promo Codes',           to: '/admin/promos',             icon: '🏷️' },
  { label: 'Product Reviews',       to: '/admin/reviews',            icon: '⭐' },
  { label: 'Referrals',             to: '/admin/referrals',          icon: '🔗' },
  { label: 'Announcements',         to: '/admin/announcements',      icon: '📣' },
  { label: 'Audit Log',             to: '/admin/audit-log',          icon: '🔍' },
  { label: 'Support Tickets',       to: '/admin/support',            icon: '🎫' },
  { label: 'Email Templates',       to: '/admin/email-templates',    icon: '✉️' },
  { label: 'Email Campaigns',       to: '/admin/campaigns',          icon: '📧' },
  { label: 'Notification Broadcast',to: '/admin/notifications',      icon: '🔔' },
  { label: 'Token Management',      to: '/admin/tokens',             icon: '🪙' },
  { label: 'Roles & Permissions',   to: '/admin/roles',              icon: '🔐' },
  { label: 'Compliance',            to: '/admin/compliance',         icon: '⚖️' },
  { label: 'KYC Queue',             to: '/admin/kyc',                icon: '🔏' },
  { label: 'Events & Webinars',     to: '/admin/events',             icon: '🎙️' },
  { label: 'Integrations',          to: '/admin/integrations',       icon: '🔌' },
  { label: 'Bulk Import',           to: '/admin/import',             icon: '📥' },
  { label: 'Settings',              to: '/admin/settings',           icon: '🔧' },
  { label: 'Launch Checklist',      to: '/admin/launch',             icon: '🚀' },
]

function normalize(s) {
  return String(s).toLowerCase()
}

function search(query) {
  const q = normalize(query.trim())
  if (!q) return []

  const results = []

  // Pages
  const pages = PAGES.filter(p => normalize(p.label).includes(q) || normalize(p.to).includes(q))
    .slice(0, 4)
    .map(p => ({ type: 'page', icon: p.icon, label: p.label, sub: p.to, to: p.to }))
  if (pages.length) results.push({ group: 'Pages', items: pages })

  // Members
  const members = ADMIN_MEMBERS.filter(m =>
    normalize(m.name).includes(q) ||
    normalize(m.id).includes(q) ||
    normalize(m.email).includes(q)
  ).slice(0, 4).map(m => ({
    type: 'member',
    icon: '👤',
    label: m.name,
    sub: `${m.id} · ${m.rank} · ${m.status}`,
    to: '/admin',
    state: { openMemberId: m.id },
  }))
  if (members.length) results.push({ group: 'Members', items: members })

  // Orders
  const orders = ADMIN_ORDERS.filter(o =>
    normalize(o.id).includes(q) ||
    normalize(o.member).includes(q)
  ).slice(0, 3).map(o => ({
    type: 'order',
    icon: '🛒',
    label: o.id,
    sub: `${o.member} · ${o.total} MLMT · ${o.status}`,
    to: '/admin/orders',
  }))
  if (orders.length) results.push({ group: 'Orders', items: orders })

  // Products
  const prods = PRODUCTS.filter(p =>
    normalize(p.name).includes(q) ||
    normalize(p.category || '').includes(q)
  ).slice(0, 3).map(p => ({
    type: 'product',
    icon: '🛍️',
    label: p.name,
    sub: `${p.category || ''} · NOK ${p.price}`,
    to: '/admin/products',
  }))
  if (prods.length) results.push({ group: 'Products', items: prods })

  return results
}

export default function AdminGlobalSearch() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef(null)
  const overlayRef = useRef(null)

  const allItems = groups.flatMap(g => g.items)

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    setGroups([])
    setSelectedIdx(0)
  }, [])

  const openSearch = useCallback(() => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [])

  // Ctrl+K / Cmd+K global shortcut
  useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        if (open) close()
        else openSearch()
      }
      if (e.key === 'Escape' && open) close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, close, openSearch])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (overlayRef.current === e.target) close()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    setGroups(search(val))
    setSelectedIdx(0)
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx(i => Math.min(i + 1, allItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      const item = allItems[selectedIdx]
      if (item) { navigate(item.to, item.state ? { state: item.state } : undefined); close() }
    }
  }

  function handleItemClick(item) {
    navigate(item.to, item.state ? { state: item.state } : undefined)
    close()
  }

  let flatIdx = 0

  return (
    <>
      {/* Trigger button in top banner */}
      <button
        onClick={openSearch}
        title="Search (Ctrl+K)"
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '6px', color: '#e9d5ff', cursor: 'pointer',
          fontSize: '12px', padding: '4px 10px',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      >
        🔍 <span style={{ opacity: 0.8 }}>Search</span>
        <span style={{
          marginLeft: '6px', fontSize: '10px', opacity: 0.55,
          background: 'rgba(255,255,255,0.12)', borderRadius: '4px', padding: '1px 5px',
          letterSpacing: '0.5px',
        }}>
          Ctrl K
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          ref={overlayRef}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            paddingTop: '80px',
          }}
        >
          <div style={{
            background: '#1e1b4b', borderRadius: '12px',
            border: '1px solid #4338ca',
            boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            width: '100%', maxWidth: '560px',
            maxHeight: '70vh', display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Input row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px 16px',
              borderBottom: groups.length ? '1px solid #312e81' : 'none',
            }}>
              <span style={{ fontSize: '18px', opacity: 0.6 }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                placeholder="Search pages, members, orders, products…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#e0e7ff', fontSize: '15px',
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(''); setGroups([]); inputRef.current?.focus() }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#6b7280', fontSize: '16px', lineHeight: 1, padding: '2px',
                  }}
                >
                  ✕
                </button>
              )}
              <kbd style={{
                fontSize: '11px', color: '#6b7280',
                background: '#312e81', borderRadius: '4px', padding: '2px 6px',
              }}>
                Esc
              </kbd>
            </div>

            {/* Results */}
            {groups.length > 0 && (
              <div style={{ overflowY: 'auto', padding: '8px 0' }}>
                {groups.map(group => (
                  <div key={group.group}>
                    <div style={{
                      padding: '6px 16px 4px',
                      fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
                      color: '#6366f1', textTransform: 'uppercase',
                    }}>
                      {group.group}
                    </div>
                    {group.items.map(item => {
                      const idx = flatIdx++
                      const active = idx === selectedIdx
                      return (
                        <button
                          key={item.label + item.sub}
                          onMouseEnter={() => setSelectedIdx(idx)}
                          onClick={() => handleItemClick(item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            width: '100%', padding: '10px 16px',
                            background: active ? '#312e81' : 'none',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.1s',
                          }}
                        >
                          <span style={{ fontSize: '16px', flexShrink: 0, opacity: 0.85 }}>{item.icon}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{
                              display: 'block', fontSize: '13px', fontWeight: 500,
                              color: active ? '#e0e7ff' : '#c7d2fe',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.label}
                            </span>
                            <span style={{
                              display: 'block', fontSize: '11px', color: '#6b7280', marginTop: '1px',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {item.sub}
                            </span>
                          </span>
                          {active && (
                            <kbd style={{
                              fontSize: '11px', color: '#6b7280',
                              background: '#1e1b4b', borderRadius: '4px',
                              padding: '2px 6px', flexShrink: 0,
                              border: '1px solid #4338ca',
                            }}>
                              ↵
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Empty state when query typed but no results */}
            {query && groups.length === 0 && (
              <div style={{
                padding: '32px 16px', textAlign: 'center',
                color: '#6b7280', fontSize: '13px',
              }}>
                No results for "<strong style={{ color: '#a5b4fc' }}>{query}</strong>"
              </div>
            )}

            {/* Hint bar */}
            {!query && (
              <div style={{
                padding: '10px 16px',
                display: 'flex', gap: '16px',
                fontSize: '11px', color: '#6b7280',
                borderTop: '1px solid #312e81',
              }}>
                <span>↑↓ navigate</span>
                <span>↵ open</span>
                <span>Esc close</span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
