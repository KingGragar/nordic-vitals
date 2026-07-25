import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

const TYPE_META = {
  rank_up:    { icon: '🏅', label: 'Rank',       color: '#f59e0b' },
  commission: { icon: '💰', label: 'Commission',  color: '#22c55e' },
  referral:   { icon: '👥', label: 'Referral',    color: '#6366f1' },
  system:     { icon: '📢', label: 'System',      color: '#64748b' },
}

const TABS = ['All', 'Unread', 'Commission', 'Referral', 'Rank', 'System']

function relativeTime(ts) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    if (!user) return
    getNotifications(user.userId || user.id)
      .then(setNotifs)
      .finally(() => setLoading(false))
  }, [user])

  const unreadCount = notifs.filter(n => !n.read).length

  function filterNotifs() {
    if (tab === 'All')        return notifs
    if (tab === 'Unread')     return notifs.filter(n => !n.read)
    const typeKey = tab.toLowerCase().replace(' ', '_')
    return notifs.filter(n => n.type === typeKey || (tab === 'Rank' && n.type === 'rank_up'))
  }

  async function handleRead(id) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await markNotificationRead(user?.userId || user?.id, id).catch(() => {})
  }

  async function handleMarkAll() {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    await markAllNotificationsRead(user?.userId || user?.id).catch(() => {})
  }

  const filtered = filterNotifs()

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--cream)', margin: 0 }}>
              Notifications {unreadCount > 0 && (
                <span style={{ fontSize: 13, background: '#ef4444', color: '#fff',
                               borderRadius: 999, padding: '2px 8px', marginLeft: 8, verticalAlign: 'middle' }}>
                  {unreadCount}
                </span>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', margin: '4px 0 0' }}>
              Commission alerts, rank-ups, and platform updates
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
                       background: 'transparent', color: 'var(--text2)', fontSize: 13,
                       cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: tab === t ? 'none' : '1px solid var(--border)',
              background: tab === t ? 'var(--gold)' : 'transparent',
              color: tab === t ? '#0a1628' : 'var(--text2)',
            }}>
              {t}{t === 'Unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Loading notifications…</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)', fontSize: 14 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔔</div>
            No {tab !== 'All' ? tab.toLowerCase() + ' ' : ''}notifications yet
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(n => {
              const meta = TYPE_META[n.type] || TYPE_META.system
              return (
                <div
                  key={n.id}
                  onClick={() => !n.read && handleRead(n.id)}
                  style={{
                    display: 'flex', gap: 14, padding: '16px 18px', borderRadius: 12,
                    background: n.read ? 'var(--navy2)' : 'rgba(99,102,241,0.08)',
                    border: `1px solid ${n.read ? 'var(--border)' : 'rgba(99,102,241,0.3)'}`,
                    cursor: n.read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Icon bubble */}
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: meta.color + '22', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18,
                  }}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: n.read ? 500 : 700, color: 'var(--cream)' }}>
                        {n.title}
                      </span>
                      {!n.read && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%',
                                       background: '#6366f1', flexShrink: 0 }} />
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0, lineHeight: 1.5 }}>
                      {n.body}
                    </p>
                  </div>

                  {/* Time + type badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                                gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--text2)' }}>{relativeTime(n.ts)}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                                   background: meta.color + '22', color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
