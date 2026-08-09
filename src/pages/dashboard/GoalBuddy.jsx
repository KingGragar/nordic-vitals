import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberGoalBuddy } from '../../api/mlmApi'

const STATUS_COLOR = { on_track: '#86efac', behind: '#f87171', completed: '#93c5fd', pending: '#fbbf24' }
const STATUS_LABEL = { on_track: 'On Track', behind: 'Behind', completed: 'Completed', pending: 'Pending' }

export default function DashGoalBuddy() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [msgInput, setMsgInput] = useState('')
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMemberGoalBuddy().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const buddy = data?.buddy
  const goals = data?.sharedGoals || []
  const checkins = data?.checkins || []
  const messages = data?.messages || []

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Goal Buddy</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Pair with an accountability partner — share goals, check in weekly, and motivate each other</p>
        </div>

        {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : !buddy ? (
          <div style={{ ...card, textAlign: 'center', padding: 52 }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🤝</div>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>No Goal Buddy Yet</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>Invite a teammate to become your accountability partner and work toward shared goals together.</div>
            <button onClick={() => setShowInvite(true)} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Invite a Buddy</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,1fr) minmax(300px,2fr)', gap: 20, alignItems: 'start' }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Buddy card */}
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 12px', color: '#fff' }}>
                  {buddy.name[0]}
                </div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{buddy.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{buddy.rank} · {buddy.location}</div>
                <div style={{ fontSize: 11, color: '#86efac', background: '#86efac22', borderRadius: 6, padding: '3px 10px', display: 'inline-block', marginBottom: 12 }}>Your Buddy</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  {[{ label: 'Check-ins', value: buddy.checkins }, { label: 'Goals met', value: buddy.goalsMet }].map(k => (
                    <div key={k.label} style={{ background: 'rgba(0,0,0,.15)', borderRadius: 8, padding: '8px 6px' }}>
                      <div style={{ fontWeight: 700, fontSize: 17 }}>{k.value}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{k.label}</div>
                    </div>
                  ))}
                </div>
                <button style={{ width: '100%', padding: '7px 0', borderRadius: 7, border: '1px solid #f87171', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>Remove Buddy</button>
              </div>

              {/* Recent check-ins */}
              <div style={card}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Weekly Check-Ins</div>
                {checkins.length === 0 ? <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No check-ins yet.</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {checkins.slice(0, 4).map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <span style={{ fontWeight: 600, color: STATUS_COLOR[c.status] || 'var(--text)' }}>{STATUS_LABEL[c.status] || c.status}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.mood === 'good' ? '😊' : c.mood === 'ok' ? '😐' : '😔'} {c.author === 'me' ? 'You' : buddy.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button style={{ marginTop: 12, width: '100%', padding: '7px 0', borderRadius: 7, border: '1px solid #6366f1', background: 'transparent', color: '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Log This Week's Check-In</button>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Shared goals */}
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontWeight: 600 }}>Shared Goals</span>
                  <button style={{ fontSize: 12, padding: '4px 12px', borderRadius: 6, border: '1px solid #6366f1', background: 'transparent', color: '#818cf8', cursor: 'pointer' }}>+ Add Goal</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {goals.map(goal => (
                    <div key={goal.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{goal.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Due {new Date(goal.deadline).toLocaleDateString()}</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[goal.status], background: `${STATUS_COLOR[goal.status]}22`, borderRadius: 5, padding: '2px 8px' }}>{STATUS_LABEL[goal.status]}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[{ name: 'You', pct: goal.myProgress }, { name: buddy.name, pct: goal.buddyProgress }].map(p => (
                          <div key={p.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                              <span>{p.name}</span><span style={{ fontWeight: 600 }}>{p.pct}%</span>
                            </div>
                            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
                              <div style={{ width: `${p.pct}%`, height: '100%', background: p.name === 'You' ? '#818cf8' : '#34d399', borderRadius: 3 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {goals.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: 10 }}>No shared goals yet. Add one to get started!</div>}
                </div>
              </div>

              {/* Messages */}
              <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>Messages with {buddy.name}</div>
                <div style={{ maxHeight: 220, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: msg.author === 'me' ? 'row-reverse' : 'row', gap: 8, alignItems: 'flex-end' }}>
                      <div style={{ maxWidth: '72%', background: msg.author === 'me' ? '#6366f1' : 'var(--border)', color: msg.author === 'me' ? '#fff' : 'var(--text)', borderRadius: msg.author === 'me' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 13 }}>
                        {msg.text}
                        <div style={{ fontSize: 10, opacity: .65, marginTop: 3 }}>{new Date(msg.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: 16 }}>No messages yet. Say hi!</div>}
                </div>
                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input value={msgInput} onChange={e => setMsgInput(e.target.value)} placeholder="Send a message…" style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 13 }} />
                  <button onClick={() => setMsgInput('')} style={{ padding: '8px 14px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Send</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInvite && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowInvite(false)}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 420, width: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 14px' }}>Invite a Goal Buddy</h3>
              <p style={{ margin: '0 0 18px', fontSize: 14, color: 'var(--text-muted)' }}>Enter your teammate's email or member ID. They'll receive an invitation to pair with you.</p>
              <input placeholder="Email or member ID" style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowInvite(false)} style={{ padding: '8px 18px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => setShowInvite(false)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Send Invite</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
