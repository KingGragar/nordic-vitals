import { useState, useEffect, useCallback, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTeamChatThreads, getMemberTeamChatMessages, sendMemberTeamChatMessage } from '../../api/mlmApi'

export default function DashTeamChat() {
  const [threads, setThreads] = useState(null)
  const [activeThread, setActiveThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const loadThreads = useCallback(() => {
    setLoading(true)
    getMemberTeamChatThreads().then(t => { setThreads(t); if (t.length > 0 && !activeThread) setActiveThread(t[0]) }).finally(() => setLoading(false))
  }, [activeThread])
  useEffect(() => { loadThreads() }, [])

  useEffect(() => {
    if (!activeThread) return
    getMemberTeamChatMessages(activeThread.id).then(setMessages)
  }, [activeThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim() || !activeThread) return
    setSending(true)
    const msg = await sendMemberTeamChatMessage(activeThread.id, text.trim())
    setMessages(prev => [...prev, msg])
    setText('')
    setSending(false)
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', display: 'flex', gap: 14, height: 'calc(100vh - 120px)', minHeight: 500 }}>
        {/* Thread list */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>💬 Team Chat</div>
          {loading ? (
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>Loading…</div>
          ) : (threads || []).map(t => (
            <div
              key={t.id}
              onClick={() => setActiveThread(t)}
              style={{
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: activeThread?.id === t.id ? 'var(--gold)' : 'var(--card)',
                color: activeThread?.id === t.id ? '#000' : 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.lastMessage}</div>
              {t.unread > 0 && (
                <span style={{ display: 'inline-block', marginTop: 4, background: '#991b1b', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{t.unread}</span>
              )}
            </div>
          ))}
        </div>

        {/* Messages panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          {!activeThread ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 15 }}>Select a thread</div>
          ) : (
            <>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
                # {activeThread.name}
                <span style={{ color: 'var(--text2)', fontSize: 12, fontWeight: 400, marginLeft: 10 }}>{activeThread.memberCount} members</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, fontWeight: 700, color: '#93c5fd' }}>
                      {(m.author || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{m.author}</span>
                        <span style={{ color: 'var(--text2)', fontSize: 11 }}>{m.time}</span>
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Message #team… (Enter to send)"
                  rows={2}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, resize: 'none', fontFamily: 'inherit' }}
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: sending ? 'wait' : 'pointer', alignSelf: 'flex-end' }}
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
