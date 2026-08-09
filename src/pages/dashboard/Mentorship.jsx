import { useState, useEffect } from 'react'
import DashLayout from '../../components/DashboardLayout'
import { getMemberMentorship } from '../../api/mlmApi'

const STATUS_COLOR = { active: '#86efac', pending: '#fbbf24', completed: '#93c5fd', declined: '#f87171' }

export default function DashMentorship() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('my-mentor')
  const [showRequest, setShowRequest] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMemberMentorship().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <DashLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Mentorship</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Connect with experienced mentors and guide your downline</p>
          </div>
          <button onClick={() => setShowRequest(true)} style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Request Mentor</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'My Mentor', value: data?.hasMentor ? '1' : '—', color: '#86efac' },
            { label: 'Mentees', value: data?.menteeCount ?? '—', color: '#93c5fd' },
            { label: 'Sessions Done', value: data?.sessionsDone ?? '—', color: '#fbbf24' },
            { label: 'Goals Met', value: data?.goalsMet ? `${data.goalsMet}/${data.goalsTotal}` : '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ key: 'my-mentor', label: 'My Mentor' }, { key: 'mentees', label: 'My Mentees' }, { key: 'goals', label: 'Shared Goals' }, { key: 'history', label: 'Session History' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? '#6366f1' : 'var(--border)', color: tab === t.key ? '#fff' : 'var(--text-muted)' }}>{t.label}</button>
          ))}
        </div>

        {tab === 'my-mentor' && (
          loading ? <div style={{ color: 'var(--text-muted)', padding: 16 }}>Loading…</div> :
          data?.mentor ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div style={card}>
                <div style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>👤</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{data.mentor.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{data.mentor.rank}</div>
                    <div style={{ fontSize: 11, color: '#86efac', fontWeight: 700 }}>Active Mentor</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[
                    { label: 'Experience', value: `${data.mentor.yearsExp} yrs` },
                    { label: 'Mentees', value: data.mentor.menteeCount },
                    { label: 'Speciality', value: data.mentor.speciality },
                    { label: 'Response time', value: data.mentor.responseTime },
                  ].map(k => (
                    <div key={k.label} style={{ padding: '8px 10px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{k.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 14 }}>{data.mentor.bio}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, padding: '8px 0', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Message</button>
                  <button style={{ flex: 1, padding: '8px 0', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Book Session</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Next Session</h3>
                  {data.nextSession ? (
                    <div style={{ padding: '10px 14px', background: '#6366f111', borderRadius: 8, border: '1px solid #6366f133' }}>
                      <div style={{ fontWeight: 600 }}>{data.nextSession.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{data.nextSession.date} · {data.nextSession.duration} min</div>
                      <a href={data.nextSession.link} style={{ fontSize: 12, color: '#6366f1', display: 'block', marginTop: 6 }}>Join meeting →</a>
                    </div>
                  ) : <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No upcoming sessions</div>}
                </div>
                <div style={card}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>Mentor Notes</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(data.mentorNotes || []).map(n => (
                      <div key={n.id} style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 13 }}>{n.note}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{n.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No mentor yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Request a mentor to get personalised guidance from experienced members</div>
              <button onClick={() => setShowRequest(true)} style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Request a Mentor</button>
            </div>
          )
        )}

        {tab === 'mentees' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (data?.mentees || []).map(m => (
              <div key={m.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#6366f122', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.rank} · {m.joinedDate}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[m.status], background: `${STATUS_COLOR[m.status]}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{m.status}</span>
                    <button style={{ padding: '5px 12px', background: 'var(--border)', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Message</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'goals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (data?.sharedGoals || []).map(g => (
              <div key={g.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700 }}>{g.title}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: g.status === 'on_track' ? '#86efac' : '#fbbf24' }}>{g.status.replace('_', ' ')}</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${g.progressPct}%`, background: '#6366f1', borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Due {g.dueDate} · {g.progressPct}% complete</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (data?.sessionHistory || []).map(s => (
              <div key={s.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.date} · {s.duration} min · with {s.with}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#86efac', background: '#86efac22', borderRadius: 5, padding: '2px 7px' }}>Completed</span>
                </div>
                {s.notes && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>{s.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {showRequest && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ ...card, width: 440, maxWidth: '90vw' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>Request a Mentor</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Focus Area</label>
                  <select style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14 }}>
                    <option>Business Growth</option><option>Product Knowledge</option><option>Recruitment</option><option>Wellness</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>What are your goals?</label>
                  <textarea rows={3} placeholder="Describe what you'd like to achieve with a mentor…" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowRequest(false)} style={{ padding: '8px 18px', background: 'var(--border)', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button onClick={() => setShowRequest(false)} style={{ padding: '8px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600 }}>Submit Request</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashLayout>
  )
}
