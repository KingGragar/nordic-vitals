import { useState, useEffect } from 'react'
import DashLayout from '../../components/DashboardLayout'
import { getMemberLiveEvents } from '../../api/mlmApi'

const TYPE_COLOR = { webinar: '#93c5fd', product_launch: '#fbbf24', qa: '#86efac', training: '#818cf8', town_hall: '#f0abfc' }
const TYPE_ICON = { webinar: '🎙️', product_launch: '🚀', qa: '❓', training: '📚', town_hall: '🏛️' }
const STATUS_COLOR = { live: '#f87171', upcoming: '#86efac', ended: '#a1a1aa' }

export default function DashLiveEvents() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')
  const [reminderSet, setReminderSet] = useState({})

  useEffect(() => {
    setLoading(true)
    getMemberLiveEvents().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  const events = (data?.events || []).filter(e =>
    tab === 'all' ? true : tab === 'live' ? e.status === 'live' : tab === 'upcoming' ? e.status === 'upcoming' : e.status === 'ended'
  )

  const toggleReminder = id => setReminderSet(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <DashLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Live Events</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Webinars, product launches, Q&A sessions, and team town halls</p>
        </div>

        {data?.liveNow && (
          <div style={{ ...card, marginBottom: 22, borderColor: '#f87171', background: '#f8717108', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f87171' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', animation: 'pulse 1s infinite' }} />
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#f87171', letterSpacing: '0.08em' }}>LIVE NOW</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{data.liveNow.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Host: {data.liveNow.host} · {data.liveNow.viewerCount} watching</div>
                </div>
              </div>
              <button style={{ padding: '10px 24px', background: '#f87171', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Join Now →</button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Registered', value: data?.registeredCount ?? '—', color: '#93c5fd' },
            { label: 'Attended (30d)', value: data?.attendedCount ?? '—', color: '#86efac' },
            { label: 'Upcoming', value: data?.upcomingCount ?? '—', color: '#fbbf24' },
            { label: 'Replays Available', value: data?.replayCount ?? '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ key: 'live', label: '🔴 Live' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'ended', label: 'Past' }, { key: 'all', label: 'All' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? '#6366f1' : 'var(--border)', color: tab === t.key ? '#fff' : 'var(--text-muted)' }}>{t.label}</button>
          ))}
        </div>

        {loading ? <div style={{ color: 'var(--text-muted)', padding: 24 }}>Loading…</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 18 }}>
            {events.length === 0 ? (
              <div style={{ ...card, gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No events in this category</div>
            ) : events.map(e => (
              <div key={e.id} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
                {e.status === 'live' && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: '#f87171' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${TYPE_COLOR[e.type] || '#93c5fd'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{TYPE_ICON[e.type] || '📅'}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{e.title}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[e.type], textTransform: 'replace' }}>{e.type?.replace('_', ' ')}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[e.status], background: `${STATUS_COLOR[e.status]}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize', flexShrink: 0 }}>{e.status === 'live' ? '● LIVE' : e.status}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{e.description}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, flexWrap: 'wrap' }}>
                  <span>📅 {e.date}</span>
                  <span>⏱ {e.duration} min</span>
                  <span>👤 {e.host}</span>
                  {e.registeredCount !== undefined && <span>✅ {e.registeredCount} registered</span>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {e.status === 'live' && <button style={{ flex: 1, padding: '8px 0', background: '#f87171', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 700 }}>Join Live</button>}
                  {e.status === 'upcoming' && (
                    <>
                      <button style={{ flex: 1, padding: '8px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{e.registered ? '✓ Registered' : 'Register'}</button>
                      <button onClick={() => toggleReminder(e.id)} style={{ padding: '8px 14px', background: reminderSet[e.id] ? '#fbbf2422' : 'var(--border)', color: reminderSet[e.id] ? '#fbbf24' : 'var(--text-muted)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>{reminderSet[e.id] ? '🔔' : '🔕'}</button>
                    </>
                  )}
                  {e.status === 'ended' && e.replayUrl && <button style={{ flex: 1, padding: '8px 0', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>▶ Watch Replay</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashLayout>
  )
}
