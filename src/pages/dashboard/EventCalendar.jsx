import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberEventCalendar, registerMemberCalendarEvent } from '../../api/mlmApi'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const TYPE_COLORS = {
  webinar:  '#60a5fa',
  training: '#a78bfa',
  product:  '#34d399',
  rally:    '#f59e0b',
  call:     '#fb7185',
}

function buildCalendarGrid(year, month) {
  const first = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= days; d++) cells.push(d)
  return cells
}

export default function DashEventCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)
  const [registering, setRegistering] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberEventCalendar(year, month + 1).then(setEvents).finally(() => setLoading(false))
  }, [year, month])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  const cells = buildCalendarGrid(year, month)
  const eventsByDay = {}
  ;(events || []).forEach(e => {
    const d = new Date(e.date).getDate()
    if (!eventsByDay[d]) eventsByDay[d] = []
    eventsByDay[d].push(e)
  })

  const dayEvents = selectedDay ? (eventsByDay[selectedDay] || []) : (events || [])

  async function register(eventId) {
    setRegistering(eventId)
    await registerMemberCalendarEvent(eventId)
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, registered: true } : e))
    setRegistering(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📅 Event Calendar</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Upcoming webinars, training sessions, product launches, and team calls.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <button onClick={prevMonth} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>‹</button>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{MONTHS[month]} {year}</div>
              <button onClick={nextMonth} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
              {DAYS.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2)', fontWeight: 600, padding: '4px 0' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {cells.map((d, i) => {
                const hasEvents = d && eventsByDay[d]?.length > 0
                const isSelected = d === selectedDay
                return (
                  <div key={i} onClick={() => d && setSelectedDay(isSelected ? null : d)} style={{ padding: '6px 2px', textAlign: 'center', borderRadius: 6, cursor: d ? 'pointer' : 'default', background: isSelected ? 'var(--gold)' : isToday(d) ? 'var(--border)' : 'transparent', color: isSelected ? '#000' : isToday(d) ? 'var(--text)' : d ? 'var(--text)' : 'transparent', fontWeight: isToday(d) || isSelected ? 700 : 400, fontSize: 13, position: 'relative' }}>
                    {d || ''}
                    {hasEvents && !isSelected && <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)' }} />}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ color: 'var(--text2)', textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text2)' }}>
              {selectedDay ? `Events on ${MONTHS[month]} ${selectedDay}` : `All events — ${MONTHS[month]} ${year}`}
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>Loading…</div>
            ) : dayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>{selectedDay ? 'No events this day.' : 'No events this month.'}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {dayEvents.map(ev => {
                  const tc = TYPE_COLORS[ev.type] || '#94a3b8'
                  return (
                    <div key={ev.id} style={{ ...card, display: 'flex', gap: 14, alignItems: 'flex-start', borderLeft: `3px solid ${tc}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <div style={{ fontWeight: 700 }}>{ev.title}</div>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: tc + '22', color: tc, textTransform: 'capitalize' }}>{ev.type}</span>
                          {ev.registered && <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, background: '#052e16', color: '#86efac' }}>Registered</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', margin: '4px 0' }}>{ev.date} · {ev.time} · {ev.duration}</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{ev.description}</div>
                        {ev.host && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>Host: {ev.host}</div>}
                      </div>
                      {!ev.registered && (
                        <button onClick={() => register(ev.id)} disabled={registering === ev.id} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: tc, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, opacity: registering === ev.id ? 0.6 : 1 }}>
                          {registering === ev.id ? '…' : 'Register'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
