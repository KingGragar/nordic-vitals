import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminConversations, getConversation, sendAdminMessage, startAdminConversation,
  markConversationRead, getAdminMembers,
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

function Avatar({ initials }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: '50%',
      background: '#1e2d45', color: GOLD,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 12, flexShrink: 0,
      border: '1px solid #253b58',
    }}>
      {initials}
    </div>
  )
}

function ComposeModal({ members, onClose, onSent }) {
  const [memberId, setMemberId] = useState('')
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [sending, setSending]   = useState(false)
  const [err, setErr]           = useState('')

  async function handleSend(e) {
    e.preventDefault()
    if (!memberId) return setErr('Please select a member.')
    if (!subject.trim()) return setErr('Subject is required.')
    if (!body.trim()) return setErr('Message body is required.')
    setSending(true)
    try {
      const m = members.find(x => x.userId === memberId || x.user_id === memberId)
      const conv = await startAdminConversation(
        memberId,
        m ? m.name : memberId,
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
          <h3 style={{ color: '#e2e8f0', margin: 0 }}>New Message to Member</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>
        <form onSubmit={handleSend}>
          <select
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, marginBottom: 10,
              background: '#0a1628', border: '1px solid #253b58', color: '#e2e8f0',
              fontSize: 14, boxSizing: 'border-box',
            }}
          >
            <option value="">Select member…</option>
            {members.map(m => (
              <option key={m.userId || m.user_id} value={m.userId || m.user_id}>
                {m.name} ({m.userId || m.user_id})
              </option>
            ))}
          </select>
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

export default function AdminMessages() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId]           = useState(null)
  const [thread, setThread]               = useState(null)
  const [reply, setReply]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [members, setMembers]             = useState([])
  const [showCompose, setShowCompose]     = useState(false)
  const bottomRef = useRef(null)

  async function loadConversations(q = '') {
    try {
      const list = await getAdminConversations(q)
      setConversations(list)
      if (!activeId && list.length) setActiveId(list[0].id)
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    loadConversations()
    getAdminMembers().then(data => setMembers(data?.members || data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!search) { loadConversations(); return }
    const t = setTimeout(() => loadConversations(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!activeId) return
    setThread(null)
    getConversation(activeId, 'admin')
      .then(data => {
        setThread(data)
        markConversationRead(activeId, 'admin')
        setConversations(prev => prev.map(c =>
          c.id === activeId ? { ...c, unread_count: 0 } : c
        ))
      })
      .catch(() => {})
  }, [activeId])

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages])

  async function handleSendReply(e) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const msg = await sendAdminMessage(activeId, reply.trim())
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
  const totalUnread = conversations.reduce((s, c) => s + (c.unread_count || 0), 0)

  const kpis = [
    { label: 'Total Threads',  value: conversations.length },
    { label: 'Unread',         value: totalUnread, gold: totalUnread > 0 },
    { label: 'Active Members', value: new Set(conversations.flatMap(c => c.participant_ids || [])).size - 1 },
  ]

  const card = {
    background: '#0f1e33', border: '1px solid #253b58', borderRadius: 12, overflow: 'hidden',
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h1 style={{ color: '#e2e8f0', margin: 0, fontSize: 22, fontWeight: 700 }}>Direct Messages</h1>
            <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
              One-to-one conversations with members
            </p>
          </div>
          <button onClick={() => setShowCompose(true)} style={{
            padding: '9px 18px', borderRadius: 8, background: GOLD,
            border: 'none', color: '#0a1628', fontWeight: 700, cursor: 'pointer', fontSize: 14,
          }}>
            ✉️ Message Member
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ ...card, padding: '16px 20px' }}>
              <div style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</div>
              <div style={{ color: k.gold ? GOLD : '#e2e8f0', fontSize: 28, fontWeight: 700, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: 60 }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, minHeight: 520 }}>
            {/* Conversation list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by member or subject…"
                style={{
                  padding: '9px 12px', borderRadius: 8,
                  background: '#0f1e33', border: '1px solid #253b58',
                  color: '#e2e8f0', fontSize: 13,
                }}
              />
              <div style={{ ...card, overflowY: 'auto', maxHeight: 560 }}>
                {conversations.length === 0 && (
                  <div style={{ color: '#64748b', padding: 24, textAlign: 'center', fontSize: 14 }}>
                    No conversations found.
                  </div>
                )}
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveId(conv.id)}
                    style={{
                      padding: '13px 15px', cursor: 'pointer', borderBottom: '1px solid #1a2d45',
                      background: activeId === conv.id ? '#162033' : 'transparent',
                      display: 'flex', gap: 10, alignItems: 'flex-start',
                    }}
                  >
                    <Avatar initials={(conv.member?.avatar || conv.member?.name?.slice(0,2) || '?').toUpperCase()} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          color: conv.unread_count > 0 ? '#e2e8f0' : '#94a3b8',
                          fontWeight: conv.unread_count > 0 ? 700 : 400, fontSize: 13,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150,
                        }}>
                          {conv.member?.name || 'Member'}
                        </span>
                        <span style={{ color: '#475569', fontSize: 11, flexShrink: 0 }}>
                          {timeAgo(conv.last_message_at)}
                        </span>
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.subject}
                      </div>
                      {conv.unread_count > 0 && (
                        <span style={{
                          display: 'inline-block', marginTop: 4,
                          background: GOLD, color: '#0a1628', borderRadius: 10,
                          fontSize: 10, fontWeight: 700, padding: '1px 6px',
                        }}>
                          {conv.unread_count} new
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thread */}
            <div style={{ ...card, display: 'flex', flexDirection: 'column', maxHeight: 600 }}>
              {!activeConv ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
                  Select a conversation
                </div>
              ) : (
                <>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #1a2d45', flexShrink: 0 }}>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 15 }}>{activeConv.subject}</div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
                      With {activeConv.member?.name} · {activeConv.participant_ids?.join(', ')}
                    </div>
                  </div>

                  <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {!thread && <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>}
                    {thread?.messages?.map(msg => {
                      const mine = msg.sender_id === 'admin'
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
                      placeholder="Reply as Nordic Vitals…"
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
          members={members}
          onClose={() => setShowCompose(false)}
          onSent={conv => {
            setShowCompose(false)
            loadConversations().then(() => setActiveId(conv.id))
          }}
        />
      )}
    </AdminLayout>
  )
}
