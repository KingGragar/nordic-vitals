import { useState, useEffect } from 'react'
import { getActiveBanners } from '../api/mlmApi'

const TYPE_STYLES = {
  sale:         { bg: '#92400e', border: '#c9a84c', icon: '🏷️' },
  announcement: { bg: '#1e3a5f', border: '#3b82f6', icon: '📣' },
  warning:      { bg: '#78350f', border: '#f59e0b', icon: '⚠️' },
  info:         { bg: '#0f3460', border: '#6366f1', icon: 'ℹ️' },
}

const DISMISS_KEY = 'nv_dismissed_banners'

function getDismissed() {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || '[]')) } catch { return new Set() }
}

function saveDismissed(set) {
  try { sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...set])) } catch {}
}

export default function PromoBanner({ page }) {
  const [banners, setBanners] = useState([])
  const [dismissed, setDismissed] = useState(() => getDismissed())

  useEffect(() => {
    getActiveBanners(page).then(d => { if (Array.isArray(d)) setBanners(d) }).catch(() => {})
  }, [page])

  const visible = banners.filter(b => !dismissed.has(b.id))
  if (!visible.length) return null

  function dismiss(id) {
    setDismissed(prev => {
      const next = new Set([...prev, id])
      saveDismissed(next)
      return next
    })
  }

  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      {visible.map(b => {
        const s = TYPE_STYLES[b.type] || TYPE_STYLES.info
        return (
          <div key={b.id} style={{
            background: s.bg,
            borderBottom: `1px solid ${s.border}`,
            padding: '10px 48px 10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            position: 'relative',
            flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 13, marginRight: 6 }}>{b.title}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>{b.message}</span>
            </div>
            {b.cta_text && b.cta_url && (
              <a
                href={b.cta_url}
                style={{
                  background: s.border,
                  color: '#000',
                  fontWeight: 700,
                  fontSize: 12,
                  padding: '4px 14px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {b.cta_text}
              </a>
            )}
            <button
              onClick={() => dismiss(b.id)}
              title="Dismiss"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                fontSize: 18,
                cursor: 'pointer',
                lineHeight: 1,
                padding: 0,
              }}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}
