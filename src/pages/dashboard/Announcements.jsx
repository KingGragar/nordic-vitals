import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAnnouncements } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

const TYPE_META = {
  info:        { label: 'Info',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: 'ℹ️' },
  product:     { label: 'New Product', color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '🛍️' },
  promotion:   { label: 'Promotion',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🎁' },
  system:      { label: 'System',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '⚙️' },
  maintenance: { label: 'Maintenance', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '🔧' },
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.info
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px',
      color: meta.color, background: meta.bg, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {meta.icon} {meta.label}
    </span>
  )
}

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function AnnouncementCard({ ann, isNew }) {
  const [expanded, setExpanded] = useState(false)
  const meta = TYPE_META[ann.type] || TYPE_META.info
  const bodyPreview = ann.body.length > 200 && !expanded ? ann.body.slice(0, 200) + '…' : ann.body

  return (
    <div
      className="card"
      style={{
        marginBottom: '16px',
        borderLeft: `3px solid ${meta.color}`,
        position: 'relative',
        transition: 'box-shadow 0.15s',
      }}
    >
      {isNew && (
        <span style={{
          position: 'absolute', top: '16px', right: '16px',
          fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '99px',
          background: 'var(--gold)', color: '#000', letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          NEW
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <TypeBadge type={ann.type} />
        <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{timeAgo(ann.created_at)}</span>
      </div>

      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
        {ann.title}
      </h3>

      <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
        {bodyPreview}
      </p>

      {ann.body.length > 200 && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: '10px', background: 'none', border: 'none',
            color: 'var(--gold)', fontSize: '13px', cursor: 'pointer', padding: 0,
          }}
        >
          {expanded ? 'Show less ▲' : 'Read more ▼'}
        </button>
      )}

      <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text2)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
        Posted by <strong style={{ color: 'var(--cream)' }}>{ann.sent_by}</strong>
        {' · '}
        {new Date(ann.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
        {' at '}
        {new Date(ann.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
      </div>
    </div>
  )
}

export default function MemberAnnouncements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]             = useState(true)
  const [typeFilter, setTypeFilter]       = useState('all')
  const [lastRead]                        = useState(() => localStorage.getItem('nv_ann_last_read') || '1970-01-01T00:00:00Z')

  useEffect(() => {
    const rank = user?.rank || 'all'
    getMemberAnnouncements(rank)
      .then(d => setAnnouncements(d.announcements || []))
      .catch(() => setAnnouncements([]))
      .finally(() => {
        setLoading(false)
        localStorage.setItem('nv_ann_last_read', new Date().toISOString())
      })
  }, [user?.rank])

  const filtered = typeFilter === 'all'
    ? announcements
    : announcements.filter(a => a.type === typeFilter)

  const unreadCount = announcements.filter(a => a.created_at > lastRead).length
  const typeCounts  = Object.fromEntries(
    Object.keys(TYPE_META).map(k => [k, announcements.filter(a => a.type === k).length])
  )

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
            📣 Company Announcements
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
            Important updates, promotions, and news from Nordic Vitals
          </p>
        </div>
        {unreadCount > 0 && (
          <div style={{
            padding: '8px 16px', borderRadius: '99px',
            background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)',
            fontSize: '13px', fontWeight: 600, color: 'var(--gold)',
          }}>
            {unreadCount} new since your last visit
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Total',   value: announcements.length, active: typeFilter === 'all',       key: 'all' },
          { label: '📣 Info', value: typeCounts.info || 0,  active: typeFilter === 'info',      key: 'info' },
          { label: '🛍️ Products', value: typeCounts.product || 0, active: typeFilter === 'product', key: 'product' },
          { label: '🎁 Promos', value: typeCounts.promotion || 0, active: typeFilter === 'promotion', key: 'promotion' },
          { label: '⚙️ System', value: typeCounts.system || 0, active: typeFilter === 'system', key: 'system' },
        ].map(({ label, value, active, key }) => (
          <button
            key={key}
            onClick={() => setTypeFilter(key)}
            style={{
              padding: '14px 12px', borderRadius: '10px', border: '1px solid var(--border)',
              background: active ? 'rgba(201,168,76,0.1)' : 'var(--card)',
              borderColor: active ? 'var(--gold)' : 'var(--border)',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 700, color: active ? 'var(--gold)' : 'var(--cream)' }}>{value}</div>
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>Loading announcements…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>No announcements</div>
          <div style={{ fontSize: '13px' }}>
            {typeFilter !== 'all'
              ? 'No announcements of this type yet.'
              : 'No company announcements have been posted yet. Check back soon!'}
          </div>
        </div>
      ) : (
        filtered.map(ann => (
          <AnnouncementCard
            key={ann.id}
            ann={ann}
            isNew={ann.created_at > lastRead}
          />
        ))
      )}
    </DashboardLayout>
  )
}
