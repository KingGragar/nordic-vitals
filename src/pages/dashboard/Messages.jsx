import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import {
  getConversations, getConversation, sendDirectMessage,
  markConversationRead, startConversation,
} from '../../api/mlmApi'

const GOLD = '#c9a84c'

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function Avatar({ initials, gold }) {
  return (
    <div style={{
      width: 38, height: 38, borderRadius: '50%',
      background: gold ? GOLD : '#1e2d45',
      color: gold ? '#0a1628' : '#c9a84c',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 13, flexShrink: 0,
      border: `1px solid ${gold ? GOLD : '#253b58'}`,
    }}>
      {initials}
    </div>
  )
}

function ComposeModal({ user, onClose, onSent }) {
  const SPONSOR = { id: 'NV-10001', name: 'Anna Bjørnsen', role: 'member' }
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr]         = useState('')

  async function handleSend(e) {
    e.preventDefault()
    if (!subject.trim()) return setErr('Subject is required.')
    if (!body.trim()) return setErr('Message body is required.')
    setSending(true)
    try {
      const conv = await startConversation(
        user.memberId || user.userId,
        user.name || user.email,
        SPONSOR.id,
        SPONSOR.name,
        SPONSOR.role,
        subject.trim(),
        body.trim(),
      )
      onSent(conv)
    } catch {
      setErr('Failed to send. Please try again.')
    }
    setSending(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#0f1e33', border: '1px solid #253b58', borderRadius: 12,
        padding: 28, width: '100%', maxWidth: 500,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#e2e8f0', margin: 0 }}>New Message to Sponsor</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>
          To: <span style={{ color: GOLD }}>{SPONSOR.name}</span> (your sponsor)
        </div>
        <form onSubmit={handleSend}>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Subject"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 10,
              background: '#0a1628', border: '1px solid #253b58', color: '#e2e8f0',
              fontSize: 14, boxSizing: 'border-box',
            }}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={5}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 10,
              background: '#0a1628', border: '1px solid #253b58', color: '#e2e8f0',
              fontSize: 14, resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          {err && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 8 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8, background: 'none',
              border: '1px solid #253b58', color: '#94a3b8', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={sending} style={{
              padding: '8px 18px', borderRadius: 8, background: GOLD,
              border: 'none', color: '#0a1628', fontWeight: 700, cursor: 'pointer',
            }}>{sending ? 'Sending…' : 'Send'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Messages() {
  const { user } = useAuth()
  const myId = user?.memberId || user?.userId || 'NV-10042'
  const myName = user?.name || user?.email || 'You'

  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId]           = useState(null)
  const [thread, setThread]               = useState(null)
  const [reply, setReply]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [showCompose, setShowCompose]     = useState(false)
  const bottomRef = useRef(null)

  async function loadConversations() {
    try {
      const list = await getConversations(myId)
      setConversations(list)
      if (!activeId && list.length) setActiveId(list[0].id)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { loadConversations() }, [myId])

  useEffect(() => {
    if (!activeId) return
    setThread(null)
    getConversation(activeId, myId)
      .then(data => {
        setThread(data)
        markConversationRead(activeId, myId).then(() => {
          setConversations(prev => prev.map(c =>
            c.id === activeId ? { ...c, unread_count: 0 } : c
          ))
        })
      })
      .catch(() => {})
  }, [activeId, myId])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages])

  async function handleSendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const msg = await sendDirectMessage(activeId, myId, myName, reply.trim())
      setThread(prev => ({ ...prev, messages: [...(prev?.messages || []), msg] }))
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, last_message: reply.trim().slice(0, 80), last_message_at: msg.sent_at }
          : c
      ))
      setReply('')
    } catch { /* ignore */ }
    setSending(false)
  }

  const activeConv = conversations.find(c => c.id === activeId)

  const card = {
    background: '#0f1e33', border: '1px solid #253b58',
    borderRadius: 12, overflow: 'hidden',
  }

  return (
    <DashboardLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#e2e8f0', margin: 0, fontSize: 22, fontWeight: 700 }}>Messages</h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
              Conversations with your sponsor and Nordic Vitals
            </p>
          </div>
          <button onClick={() => setShowCompose(true)} style={{
            padding: '9px 18px', borderRadius: 8, background: GOLD,
            border: 'none', color: '#0a1628', fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}>
            ✉️ New Message
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 60 }}>Loading messages…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, minHeight: 520 }}>
            {/* Conversation list */}
            <div style={{ ...card, overflowY: 'auto', maxHeight: 600 }}>
              {conversations.length === 0 && (
                <div style={{ color: '#64748b', padding: 28, textAlign: 'center', fontSize: 14 }}>
                  No conversations yet.<br />
                  <span style={{ color: GOLD, cursor: 'pointer' }} onClick={() => setShowCompose(true)}>
                    Start one with your sponsor →
                  </span>
                </div>
              )}
              {conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  style={{
                    padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid #1a2d45',
                    background: activeId === conv.id ? '#162033' : 'transparent',
                    transition: 'background 0.15s',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                  }}
                >
                  <Avatar initials={conv.partner?.avatar || '?'} gold={conv.unread_count > 0} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        color: conv.unread_count > 0 ? '#e2e8f0' : '#94a3b8',
                        fontWeight: conv.unread_count > 0 ? 700 : 400, fontSize: 14,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
                      }}>
                        {conv.partner?.name || 'Unknown'}
                      </span>
                      <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>
                        {timeAgo(conv.last_message_at)}
                      </span>
                    </div>
                    <div style={{
                      color: '#64748b', fontSize: 12, marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {conv.subject}
                    </div>
                    <div style={{
                      color: '#475569', fontSize: 12, marginTop: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {conv.last_message}
                    </div>
                  </div>
                  {conv.unread_count > 0 && (
                    <div style={{
                      background: GOLD, color: '#0a1628', borderRadius: 10,
                      fontSize: 11, fontWeight: 700, padding: '1px 6px', flexShrink: 0,
                    }}>
                      {conv.unread_count}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Thread view */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', maxHeight: 600 }}>
              {!activeConv ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  Select a conversation
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2d45', flexShrink: 0 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>
                      {activeConv.subject}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
                      With {activeConv.partner?.name}
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!thread && <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>}
                    {thread?.messages?.map(msg => {
                      const mine = msg.sender_id === myId
                      return (
                        <div key={msg.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '72%' }}>
                            {!mine && (
                              <div style={{ color: '#64748b', fontSize: 11, marginBottom: 3 }}>
                                {msg.sender_name} · {timeAgo(msg.sent_at)}
                              </div>
                            )}
                            <div style={{
                              background: mine ? GOLD : '#162033',
                              color: mine ? '#0a1628' : '#cbd5e1',
                              padding: '10px 14px', borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                              fontSize: 14, lineHeight: 1.5,
                            }}>
                              {msg.body}
                            </div>
                            {mine && (
                              <div style={{ color: '#475569', fontSize: 11, marginTop: 3, textAlign: 'right' }}>
                                {timeAgo(msg.sent_at)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={handleSendReply} style={{
                    padding: '12px 16px', borderTop: '1px solid #1a2d45',
                    display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-end',
                  }}>
                    <textarea
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      placeholder="Type a message…"
                      rows={2}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(e) } }}
                      style={{
                        flex: 1, padding: '9px 12px', borderRadius: 8,
                        background: '#0a1628', border: '1px solid #253b58',
                        color: '#e2e8f0', fontSize: 14, resize: 'none',
                      }}
                    />
                    <button type="submit" disabled={sending || !reply.trim()} style={{
                      padding: '9px 16px', borderRadius: 8, background: GOLD,
                      border: 'none', color: '#0a1628', fontWeight: 700,
                      cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                      opacity: sending || !reply.trim() ? 0.5 : 1, flexShrink: 0,
                    }}>
                      {sending ? '…' : 'Send'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {showCompose && (
        <ComposeModal
          user={user}
          onClose={() => setShowCompose(false)}
          onSent={conv => {
            setShowCompose(false)
            loadConversations().then(() => setActiveId(conv.id))
          }}
        />
      )}
    </DashboardLayout>
  )
}
