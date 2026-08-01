import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getTeamBroadcastRecipients, sendTeamBroadcast, getTeamBroadcasts } from '../../api/mlmApi'

const AUDIENCE_OPTIONS = [
  { value: 'direct', label: 'Direct recruits only', desc: 'People you personally enrolled' },
  { value: 'full',   label: 'Full team (all levels)', desc: 'Everyone in your entire downline' },
]

const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
const RANK_COLORS = { Platinum: '#e5c97e', Gold: '#c9a84c', Silver: '#9ca3af', Bronze: '#b87333', Unranked: '#6b7280' }

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function TeamBroadcast() {
  const { user } = useAuth()
  const [recipients, setRecipients] = useState({ direct: [], full: [] })
  const [broadcasts, setBroadcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(null)
  const [tab, setTab] = useState('compose')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState('direct')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    async function load() {
      try {
        const [r, b] = await Promise.all([
          getTeamBroadcastRecipients(user?.memberId || user?.userId),
          getTeamBroadcasts(user?.memberId || user?.userId),
        ])
        setRecipients(r)
        setBroadcasts(b)
      } catch { /* ignore */ }
      setLoading(false)
    }
    load()
  }, [user])

  const currentList = audience === 'direct' ? recipients.direct : recipients.full
  const activeCount = currentList.filter(m => m.status === 'Active').length

  function validate() {
    const e = {}
    if (!subject.trim()) e.subject = 'Subject is required.'
    if (!body.trim()) e.body = 'Message body is required.'
    if (body.trim().length > 2000) e.body = 'Message must be 2000 characters or fewer.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSend() {
    if (!validate()) return
    if (currentList.length === 0) return
    setSending(true)
    try {
      const result = await sendTeamBroadcast(user?.memberId || user?.userId, { subject: subject.trim(), body: body.trim(), audience })
      setSent(result)
      setBroadcasts(prev => [{ id: result.broadcastId, subject: subject.trim(), body: body.trim(), audience, recipientCount: result.recipientCount, sentAt: new Date().toISOString(), status: 'delivered' }, ...prev])
      setSubject('')
      setBody('')
      setTab('history')
    } catch { /* ignore */ }
    setSending(false)
  }

  const noTeam = !loading && recipients.direct.length === 0

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 60px' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text)' }}>📣 Team Broadcast</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>
            Send a message directly to your downline's notification inbox.
          </p>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Direct Recruits', value: recipients.direct.length },
              { label: 'Full Team Size', value: recipients.full.length },
              { label: 'Active in Team', value: recipients.full.filter(m => m.status === 'Active').length },
              { label: 'Broadcasts Sent', value: broadcasts.length },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card)', borderRadius: 8, padding: 4, border: '1px solid var(--border)', width: 'fit-content' }}>
          {[['compose', '✉️ Compose'], ['recipients', '👥 Recipients'], ['history', '📋 History']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              background: tab === t ? 'var(--gold)' : 'transparent',
              color: tab === t ? '#0a1628' : 'var(--text2)',
              transition: 'all .15s',
            }}>{l}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : noTeam ? (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>👥</div>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>No team members yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>
              Share your referral link to enroll your first recruit, then you can broadcast messages to your team.
            </div>
          </div>
        ) : (
          <>
            {/* Compose tab */}
            {tab === 'compose' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
                {sent && (
                  <div style={{ background: 'rgba(34,197,94,.1)', border: '1px solid #22c55e', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#22c55e', fontSize: 14, fontWeight: 600 }}>
                    ✅ Broadcast sent to {sent.recipientCount} recipient{sent.recipientCount !== 1 ? 's' : ''}!
                  </div>
                )}

                {/* Audience selector */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>AUDIENCE</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    {AUDIENCE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setAudience(opt.value); setSent(null) }} style={{
                        flex: 1, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${audience === opt.value ? 'var(--gold)' : 'var(--border)'}`,
                        background: audience === opt.value ? 'rgba(201,168,76,.08)' : 'var(--bg)',
                        transition: 'all .15s',
                      }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: audience === opt.value ? 'var(--gold)' : 'var(--text)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{opt.desc}</div>
                        <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 6, fontWeight: 600 }}>
                          {opt.value === 'direct' ? recipients.direct.length : recipients.full.length} members
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient preview */}
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: 'var(--text2)' }}>
                  Sending to <strong style={{ color: 'var(--text)' }}>{currentList.length}</strong> member{currentList.length !== 1 ? 's' : ''} &nbsp;·&nbsp; <span style={{ color: '#22c55e' }}>{activeCount} active</span>{activeCount < currentList.length ? <span style={{ color: '#f59e0b' }}> · {currentList.length - activeCount} inactive</span> : null}
                </div>

                {/* Subject */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>SUBJECT</label>
                  <input
                    value={subject}
                    onChange={e => { setSubject(e.target.value); setSent(null); if (errors.subject) setErrors(p => ({ ...p, subject: '' })) }}
                    placeholder="e.g. Team update for July · New product launching soon"
                    maxLength={120}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${errors.subject ? '#ef4444' : 'var(--border)'}`,
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 14,
                    }}
                  />
                  {errors.subject && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.subject}</div>}
                </div>

                {/* Body */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 6 }}>
                    MESSAGE &nbsp;<span style={{ fontWeight: 400, color: 'var(--text2)' }}>({body.length}/2000)</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={e => { setBody(e.target.value); setSent(null); if (errors.body) setErrors(p => ({ ...p, body: '' })) }}
                    placeholder="Write your message here. Share updates, motivation, tips, or product news with your team…"
                    rows={7}
                    maxLength={2000}
                    style={{
                      width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
                      border: `1px solid ${errors.body ? '#ef4444' : 'var(--border)'}`,
                      background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'vertical', lineHeight: 1.6,
                    }}
                  />
                  {errors.body && <div style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.body}</div>}
                </div>

                {/* Tips */}
                <div style={{ background: 'rgba(201,168,76,.07)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--gold)' }}>Tips for effective team messages:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                    <li>Keep it short and actionable — 3–5 sentences is ideal.</li>
                    <li>Celebrate wins (new members, rank advancements, sales milestones).</li>
                    <li>Include one clear call to action (e.g. "Share the referral link this week").</li>
                    <li>Send no more than 1–2 broadcasts per week to avoid notification fatigue.</li>
                  </ul>
                </div>

                <button
                  onClick={handleSend}
                  disabled={sending || currentList.length === 0}
                  style={{
                    padding: '12px 28px', borderRadius: 8, border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                    background: sending ? 'var(--border)' : 'var(--gold)', color: '#0a1628', fontWeight: 700, fontSize: 15,
                  }}
                >
                  {sending ? 'Sending…' : `📣 Send to ${currentList.length} member${currentList.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            )}

            {/* Recipients tab */}
            {tab === 'recipients' && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  {AUDIENCE_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => setAudience(opt.value)} style={{
                      padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      background: audience === opt.value ? 'var(--gold)' : 'var(--bg)',
                      color: audience === opt.value ? '#0a1628' : 'var(--text2)',
                    }}>
                      {opt.label} ({opt.value === 'direct' ? recipients.direct.length : recipients.full.length})
                    </button>
                  ))}
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg)' }}>
                        {['Member', 'ID', 'Rank', 'Status'].map(h => (
                          <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: 12, borderBottom: '1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentList.length === 0 ? (
                        <tr><td colSpan={4} style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text2)' }}>No members in this audience.</td></tr>
                      ) : currentList.map(m => (
                        <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600 }}>{m.name}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: 12 }}>{m.id}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ background: `${RANK_COLORS[m.rank]}22`, color: RANK_COLORS[m.rank], borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                              {m.rank}
                            </span>
                          </td>
                          <td style={{ padding: '10px 16px' }}>
                            <span style={{ color: m.status === 'Active' ? '#22c55e' : '#f59e0b', fontWeight: 600, fontSize: 12 }}>⬤ {m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* History tab */}
            {tab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {broadcasts.length === 0 ? (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '48px 32px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>No broadcasts sent yet</div>
                    <div style={{ color: 'var(--text2)', fontSize: 13 }}>Your sent messages will appear here.</div>
                    <button onClick={() => setTab('compose')} style={{ marginTop: 16, padding: '9px 20px', background: 'var(--gold)', color: '#0a1628', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                      Compose first broadcast
                    </button>
                  </div>
                ) : broadcasts.map(b => (
                  <div key={b.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{b.subject}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{timeAgo(b.sentAt)}</span>
                        <span style={{ background: 'rgba(34,197,94,.12)', color: '#22c55e', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ {b.status}</span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 13, margin: '10px 0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{b.body}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)' }}>
                      <span>👥 {b.recipientCount} recipient{b.recipientCount !== 1 ? 's' : ''}</span>
                      <span>📣 {b.audience === 'direct' ? 'Direct recruits' : 'Full team'}</span>
                      <span>{new Date(b.sentAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
