import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getEvents, registerForEvent, unregisterFromEvent } from '../../api/mlmApi'

const TYPE_LABELS = {
  webinar: 'Webinar',
  training: 'Training',
  'team-call': 'Team Call',
  'product-launch': 'Product Launch',
  conference: 'Conference',
}

const TYPE_COLORS = {
  webinar: '#3b82f6',
  training: '#22c55e',
  'team-call': '#a855f7',
  'product-launch': '#f59e0b',
  conference: '#ec4899',
}

const FILTERS = [
  { value: 'all', label: 'All Events' },
  { value: 'webinar', label: 'Webinars' },
  { value: 'training', label: 'Training' },
  { value: 'team-call', label: 'Team Calls' },
  { value: 'product-launch', label: 'Product Launches' },
]

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })
}

function formatDuration(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function TypeBadge({ type }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      background: (TYPE_COLORS[type] || '#6b7280') + '25',
      color: TYPE_COLORS[type] || '#6b7280',
      border: `1px solid ${TYPE_COLORS[type] || '#6b7280'}40`,
    }}>
      {TYPE_LABELS[type] || type}
    </span>
  )
}

function CapacityBar({ registered, capacity }) {
  const pct = Math.min(100, Math.round((registered / capacity) * 100))
  const color = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : '#22c55e'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text2)', marginBottom: '4px' }}>
        <span>{registered.toLocaleString()} registered</span>
        <span>{pct}% full</span>
      </div>
      <div style={{ height: '4px', background: 'var(--navy3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function EventCard({ event, onRegister, onUnregister, loading }) {
  const isPast = event.status === 'past'
  const isFull = event.registered >= event.capacity

  return (
    <div style={{
      background: 'var(--navy2)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      padding: '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      opacity: isPast ? 0.85 : 1,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <TypeBadge type={event.type} />
            {event.mlmt_reward > 0 && (
              <span style={{ fontSize: '11px', color: '#c9a84c', fontWeight: 600 }}>
                +{event.mlmt_reward} MLMT
              </span>
            )}
            {isPast && (
              <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Past Event</span>
            )}
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', margin: 0, lineHeight: 1.3 }}>
            {event.title}
          </h3>
        </div>
      </div>

      {/* Speaker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'var(--navy3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>
          🎤
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{event.speaker}</div>
          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{event.speakerRole}</div>
        </div>
      </div>

      {/* Date / Duration */}
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>Date</div>
          <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{formatDate(event.date)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>Time</div>
          <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{formatTime(event.date)}</div>
        </div>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>Duration</div>
          <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{formatDuration(event.duration_min)}</div>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0, lineHeight: 1.6 }}>
        {event.description}
      </p>

      {/* Tags */}
      {event.tags && event.tags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {event.tags.map(t => (
            <span key={t} style={{
              fontSize: '10px', color: 'var(--text2)',
              background: 'var(--navy3)', border: '1px solid var(--border)',
              borderRadius: '4px', padding: '2px 7px',
            }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Capacity */}
      {!isPast && (
        <CapacityBar registered={event.registered} capacity={event.capacity} />
      )}
      {isPast && (
        <div style={{ fontSize: '11px', color: 'var(--text2)' }}>
          {event.registered.toLocaleString()} members attended
        </div>
      )}

      {/* Action */}
      {isPast ? (
        event.recording_url ? (
          <a
            href={event.recording_url}
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline btn-sm"
            style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ▶ Watch Recording
          </a>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>Recording not yet available</span>
        )
      ) : event.isRegistered ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600 }}>✓ You're registered</span>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => onUnregister(event.id)}
            disabled={loading === event.id}
            style={{ fontSize: '12px', color: 'var(--text2)' }}
          >
            {loading === event.id ? 'Cancelling…' : 'Cancel Registration'}
          </button>
        </div>
      ) : (
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onRegister(event.id)}
          disabled={loading === event.id || isFull}
          style={{ alignSelf: 'flex-start' }}
        >
          {loading === event.id ? 'Registering…' : isFull ? 'Event Full' : 'Register →'}
        </button>
      )}
    </div>
  )
}

export default function Events() {
  const [events, setEvents] = useState([])
  const [filter, setFilter] = useState('all')
  const [tab, setTab] = useState('upcoming')
  const [loading, setLoading] = useState(null)
  const [toast, setToast] = useState(null)
  const [fetching, setFetching] = useState(true)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  async function fetchEvents() {
    setFetching(true)
    try {
      const { events: list } = await getEvents({ type: filter === 'all' ? undefined : filter })
      setEvents(list)
    } catch {
      // keep previous state on error
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { fetchEvents() }, [filter])

  async function handleRegister(id) {
    setLoading(id)
    try {
      await registerForEvent(id)
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isRegistered: true, registered: e.registered + 1 } : e))
      showToast('You\'re registered! Check your email for details.')
    } catch (err) {
      showToast(err.message || 'Registration failed', false)
    } finally {
      setLoading(null)
    }
  }

  async function handleUnregister(id) {
    setLoading(id)
    try {
      await unregisterFromEvent(id)
      setEvents(prev => prev.map(e => e.id === id ? { ...e, isRegistered: false, registered: Math.max(0, e.registered - 1) } : e))
      showToast('Registration cancelled.')
    } catch (err) {
      showToast(err.message || 'Could not cancel', false)
    } finally {
      setLoading(null)
    }
  }

  const upcomingEvents = events.filter(e => e.status === 'upcoming')
  const pastEvents = events.filter(e => e.status === 'past')
  const shown = tab === 'upcoming' ? upcomingEvents : pastEvents

  const myUpcoming = upcomingEvents.filter(e => e.isRegistered).length

  return (
    <DashboardLayout>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 999,
          background: toast.ok ? '#166534' : '#7f1d1d',
          border: `1px solid ${toast.ok ? '#22c55e' : '#ef4444'}`,
          color: '#fff', borderRadius: '10px', padding: '12px 20px',
          fontSize: '13px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', margin: '0 0 6px' }}>
          Events & Webinars
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text2)', margin: 0 }}>
          Live training sessions, product launches, and team calls
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Upcoming Events', value: upcomingEvents.length, icon: '📅' },
          { label: 'My Registrations', value: myUpcoming, icon: '✅' },
          { label: 'Past Recordings', value: pastEvents.filter(e => e.recording_url).length, icon: '▶' },
          { label: 'MLMT Available', value: upcomingEvents.reduce((s, e) => s + (e.mlmt_reward || 0), 0), icon: '🪙', suffix: ' MLMT' },
        ].map(({ label, value, icon, suffix }) => (
          <div key={label} style={{
            background: 'var(--navy2)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>
              {value}{suffix || ''}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '7px 14px', borderRadius: '8px', fontSize: '13px',
              fontWeight: filter === f.value ? 700 : 500,
              background: filter === f.value ? 'var(--gold)' : 'var(--navy2)',
              color: filter === f.value ? '#0a0f1a' : 'var(--text)',
              border: `1px solid ${filter === f.value ? 'var(--gold)' : 'var(--border)'}`,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Upcoming / Past tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
        {[
          { key: 'upcoming', label: `Upcoming (${upcomingEvents.length})` },
          { key: 'past', label: `Past (${pastEvents.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              fontSize: '14px', fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? 'var(--gold)' : 'var(--text2)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      {fetching ? (
        <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px 0' }}>Loading events…</div>
      ) : shown.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontSize: '15px', color: 'var(--cream)', marginBottom: '6px' }}>
            {tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            {tab === 'upcoming' ? 'Check back soon — new events are added regularly.' : 'Past recordings will appear here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {shown.map(ev => (
            <EventCard
              key={ev.id}
              event={ev}
              onRegister={handleRegister}
              onUnregister={handleUnregister}
              loading={loading}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
