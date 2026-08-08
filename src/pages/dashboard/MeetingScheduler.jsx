import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberMeetingScheduler, bookMemberMeeting, cancelMemberMeeting } from '../../api/mlmApi'

const TYPE_LABEL = { '1on1': '1-on-1 Call', group: 'Group Call' }
const STATUS_COLOR = { confirmed: '#86efac', pending: '#fbbf24', completed: '#94a3b8', cancelled: '#f87171' }
const STATUS_BG    = { confirmed: '#14532d', pending: '#78350f', completed: '#1e293b', cancelled: '#7f1d1d' }

export default function MemberMeetingScheduler() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [meetingType, setMeetingType] = useState('1on1')
  const [topic, setTopic] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => { getMemberMeetingScheduler().then(setData).finally(() => setLoading(false)) }, [])

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return
    setSaving(true)
    const booked = await bookMemberMeeting({ date: selectedDate, time: selectedSlot, type: meetingType, title: topic || `${TYPE_LABEL[meetingType]} with ${data?.upline?.name}`, with: data?.upline?.name })
    setData(prev => ({ ...prev, upcoming: [booked, ...(prev?.upcoming || [])] }))
    setModal(false)
    setSelectedDate(null)
    setSelectedSlot(null)
    setTopic('')
    setSaving(false)
  }

  async function cancel(id) {
    await cancelMemberMeeting(id)
    setData(prev => ({ ...prev, upcoming: prev.upcoming.filter(m => m.id !== id) }))
  }

  const meetings = tab === 'upcoming' ? (data?.upcoming || []) : (data?.past || [])
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📅 Meeting Scheduler</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Book 1-on-1 or group calls with your upline mentor.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + Book Meeting
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <>
            {data?.upline && (
              <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#000', flexShrink: 0 }}>
                  {data.upline.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{data.upline.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{data.upline.rank} · Your Upline</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>Typical response</div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{data.upline.responseTime}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {['upcoming', 'past'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 20, border: '1px solid var(--border)', background: tab === t ? 'var(--gold)' : 'transparent', color: tab === t ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 700 : 400, textTransform: 'capitalize' }}>
                  {t === 'upcoming' ? `Upcoming (${(data?.upcoming || []).length})` : 'Past'}
                </button>
              ))}
            </div>

            {!meetings.length ? (
              <div style={{ ...card, textAlign: 'center', padding: 50, color: 'var(--text2)' }}>
                {tab === 'upcoming' ? 'No upcoming meetings. Book one with your mentor.' : 'No past meetings yet.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {meetings.map(m => (
                  <div key={m.id} style={card}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
                          📅 {m.date} at {m.time} CET · {m.duration} min · {TYPE_LABEL[m.type] || m.type}
                        </div>
                        {m.notes && (
                          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', marginTop: 10, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
                            <span style={{ fontWeight: 600, color: 'var(--text2)', fontSize: 11 }}>NOTES: </span>{m.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: STATUS_BG[m.status], color: STATUS_COLOR[m.status], textTransform: 'capitalize' }}>{m.status}</span>
                        {(m.status === 'confirmed' || m.status === 'pending') && (
                          <button onClick={() => cancel(m.id)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 500 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>Book a Meeting</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Meeting Type</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1on1', 'group'].map(t => (
                    <button key={t} onClick={() => setMeetingType(t)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `2px solid ${meetingType === t ? 'var(--gold)' : 'var(--border)'}`, background: meetingType === t ? 'rgba(212,175,55,0.15)' : 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: meetingType === t ? 700 : 400 }}>
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Topic / Agenda (optional)</div>
                <input value={topic} placeholder="e.g. Rank promotion strategy" onChange={e => setTopic(e.target.value)} style={inp} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>Available Date & Time</div>
                {(data?.availableSlots || []).map(d => (
                  <div key={d.date} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>{d.date}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {d.slots.map(s => (
                        <button key={s} onClick={() => { setSelectedDate(d.date); setSelectedSlot(s) }} style={{ padding: '5px 12px', borderRadius: 6, border: `2px solid ${selectedDate === d.date && selectedSlot === s ? 'var(--gold)' : 'var(--border)'}`, background: selectedDate === d.date && selectedSlot === s ? 'rgba(212,175,55,0.15)' : 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: selectedDate === d.date && selectedSlot === s ? 700 : 400 }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button onClick={handleBook} disabled={saving || !selectedDate || !selectedSlot} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving || !selectedDate ? 0.6 : 1 }}>
                  {saving ? 'Booking…' : 'Request Meeting'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
