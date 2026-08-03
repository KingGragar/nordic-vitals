import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getSocialFeed, reactToSocialEvent } from '../../api/mlmApi'

const TYPE_FILTERS = [
  { key: 'all',        label: 'All Activity' },
  { key: 'rank_up',   label: '🏆 Rank-Ups' },
  { key: 'enrollment', label: '👥 Enrollments' },
  { key: 'milestone',  label: '🏅 Milestones' },
  { key: 'order',      label: '📦 Orders' },
]

const RANK_BADGE = {
  Member:   { bg: '#1e293b', color: '#94a3b8' },
  Bronze:   { bg: '#3d1f0a', color: '#b45309' },
  Silver:   { bg: '#1e2a3a', color: '#94a3b8' },
  Gold:     { bg: '#3a2e00', color: '#fbbf24' },
  Platinum: { bg: '#1e2a2a', color: '#e2e8f0' },
}

const EMOJIS = ['🎉', '👏', '🔥', '❤️']

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function Avatar({ initials, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg, #c9a84c, #7a5c1e)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: '#fff', flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

function EventBody({ event }) {
  const { type, member, data } = event
  const nameStyle = { fontWeight: 600, color: 'var(--gold)' }

  if (type === 'rank_up') {
    const badge = RANK_BADGE[data.new_rank] || RANK_BADGE.Member
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text1)', lineHeight: 1.5 }}>
        <span style={nameStyle}>{member.name}</span>
        {' just reached '}
        <span style={{
          display: 'inline-block', padding: '1px 8px', borderRadius: 10,
          background: badge.bg, color: badge.color, fontWeight: 700, fontSize: 12,
        }}>{data.new_rank}</span>
        {data.prev_rank && <span style={{ color: 'var(--text2)', fontSize: 13 }}> (up from {data.prev_rank})</span>}
        {'! 🏆'}
      </p>
    )
  }

  if (type === 'enrollment') {
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text1)', lineHeight: 1.5 }}>
        <span style={nameStyle}>{member.name}</span>
        {' enrolled '}
        <span style={{ fontWeight: 600 }}>{data.new_member}</span>
        {' into the team'}
        {data.sponsor_bonus ? <span style={{ color: 'var(--text2)', fontSize: 13 }}> · earned {data.sponsor_bonus} MLMT</span> : ''}
        {' 👥'}
      </p>
    )
  }

  if (type === 'milestone') {
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text1)', lineHeight: 1.5 }}>
        <span style={nameStyle}>{member.name}</span>
        {' achieved '}
        <span style={{ fontWeight: 600 }}>"{data.milestone}"</span>
        {data.reward && (
          <span style={{
            display: 'inline-block', marginLeft: 6, padding: '1px 8px', borderRadius: 10,
            background: '#2a1f00', color: '#fbbf24', fontSize: 12, fontWeight: 700,
          }}>+{data.reward}</span>
        )}
        {' 🏅'}
      </p>
    )
  }

  if (type === 'order') {
    return (
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text1)', lineHeight: 1.5 }}>
        <span style={nameStyle}>{member.name}</span>
        {' ordered '}
        <span style={{ fontWeight: 600 }}>{data.product}</span>
        {data.pv && <span style={{ color: 'var(--text2)', fontSize: 13 }}> · {data.pv} PV</span>}
        {' 📦'}
      </p>
    )
  }

  return <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)' }}>{type}</p>
}

function EventCard({ event, onReact }) {
  const totalReactions = Object.values(event.reactions || {}).reduce((s, v) => s + v, 0)

  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <Avatar initials={event.member.avatar} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <EventBody event={event} />
          <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, display: 'block' }}>
            {timeAgo(event.ts)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Reaction counts */}
        {Object.entries(event.reactions || {}).filter(([, v]) => v > 0).map(([emoji, count]) => (
          <span
            key={emoji}
            onClick={() => onReact(event.id, emoji)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
              fontSize: 13,
              background: event.myReaction === emoji ? 'rgba(201,168,76,0.2)' : 'var(--navy3)',
              border: event.myReaction === emoji ? '1px solid rgba(201,168,76,0.5)' : '1px solid var(--border)',
              color: 'var(--text1)',
              transition: 'all 0.15s',
            }}
          >
            {emoji} <span style={{ fontWeight: 600, fontSize: 12 }}>{count}</span>
          </span>
        ))}

        {/* Add reaction picker */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onReact(event.id, emoji)}
              style={{
                background: event.myReaction === emoji ? 'rgba(201,168,76,0.2)' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 8, padding: '3px 6px', cursor: 'pointer',
                fontSize: 15, lineHeight: 1,
                opacity: event.myReaction && event.myReaction !== emoji ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SocialFeed() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [events, setEvents]         = useState([])
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(false)
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadPage = useCallback(async (filter, pg, append = false) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await getSocialFeed({ typeFilter: filter, page: pg, pageSize: 10 })
      setEvents(prev => append ? [...prev, ...res.events] : res.events)
      setHasMore(res.hasMore)
      setTotal(res.total)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadPage(typeFilter, 1, false)
  }, [typeFilter, loadPage])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    loadPage(typeFilter, next, true)
  }

  async function handleReact(eventId, emoji) {
    const res = await reactToSocialEvent(eventId, emoji)
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e
      const newReactions = { ...e.reactions }
      // toggle: remove prev, add new
      if (e.myReaction && e.myReaction !== emoji) {
        newReactions[e.myReaction] = Math.max(0, (newReactions[e.myReaction] || 1) - 1)
      }
      if (res.myReaction) {
        newReactions[emoji] = (newReactions[emoji] || 0) + (e.myReaction === emoji ? -1 : 1)
        if (newReactions[emoji] < 0) newReactions[emoji] = 0
      } else if (e.myReaction === emoji) {
        newReactions[emoji] = Math.max(0, (newReactions[emoji] || 1) - 1)
      }
      return { ...e, reactions: newReactions, myReaction: res.myReaction }
    }))
  }

  const typeCount = {}
  if (!loading) typeCount['all'] = total

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: 'var(--text1)' }}>
            Team Activity Feed
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text2)' }}>
            Celebrate your team's wins — rank-ups, new enrollments, and milestones.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TYPE_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setTypeFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                border: typeFilter === f.key ? '1px solid var(--gold)' : '1px solid var(--border)',
                background: typeFilter === f.key ? 'rgba(201,168,76,0.15)' : 'var(--navy2)',
                color: typeFilter === f.key ? 'var(--gold)' : 'var(--text2)',
                fontWeight: typeFilter === f.key ? 600 : 400,
                transition: 'all 0.15s',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)' }}>
            Loading team activity…
          </div>
        ) : events.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 0', color: 'var(--text2)',
            background: 'var(--navy2)', borderRadius: 12, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌙</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>All quiet right now</div>
            <div style={{ fontSize: 13 }}>No team activity of this type yet. Check back soon!</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map(event => (
              <EventCard key={event.id} event={event} onReact={handleReact} />
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10, cursor: 'pointer',
                  border: '1px solid var(--border)', background: 'var(--navy2)',
                  color: 'var(--text2)', fontSize: 14,
                  opacity: loadingMore ? 0.6 : 1,
                }}
              >
                {loadingMore ? 'Loading…' : `Load more (${total - events.length} remaining)`}
              </button>
            )}

            {!hasMore && events.length > 0 && (
              <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 13, color: 'var(--text3)' }}>
                You've seen all {total} events
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
