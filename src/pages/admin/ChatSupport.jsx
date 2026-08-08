import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminChatSupport, assignAdminChatConversation, closeAdminChatConversation } from '../../api/mlmApi'

const STATUS_COLORS = {
  open:     { bg: '#0a1628', color: '#60a5fa', border: '#1d4ed8' },
  assigned: { bg: '#2a2010', color: '#fbbf24', border: '#d97706' },
  resolved: { bg: '#052e16', color: '#86efac', border: '#166534' },
}

const AGENTS = ['Alice K.', 'Bruno T.', 'Celine M.', 'David R.', 'Eva S.']

export default function AdminChatSupport() {
  const [chats, setChats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('open')
  const [selected, setSelected] = useState(null)
  const [assigning, setAssigning] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminChatSupport().then(setChats).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = !chats ? [] : filter === 'all' ? chats : chats.filter(c => c.status === filter)
  const counts = {
    open: (chats || []).filter(c => c.status === 'open').length,
    assigned: (chats || []).filter(c => c.status === 'assigned').length,
    resolved: (chats || []).filter(c => c.status === 'resolved').length,
  }

  async function assign(id, agent) {
    await assignAdminChatConversation(id, agent)
    setChats(prev => prev.map(c => c.id === id ? { ...c, status: 'assigned', assignedTo: agent } : c))
    setAssigning(null)
  }

  async function close(id) {
    await closeAdminChatConversation(id)
    setChats(prev => prev.map(c => c.id === id ? { ...c, status: 'resolved' } : c))
    setSelected(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  const selectedChat = selected ? (chats || []).find(c => c.id === selected) : null

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💬 Chat Support</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage live chat conversations and agent assignments.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Open', value: counts.open, color: '#60a5fa' },
            { label: 'Assigned', value: counts.assigned, color: '#fbbf24' },
            { label: 'Resolved', value: counts.resolved, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'open', 'assigned', 'resolved'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedChat ? '1fr 380px' : '1fr', gap: 16 }}>
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No conversations.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(c => {
                  const sc = STATUS_COLORS[c.status] || STATUS_COLORS.open
                  return (
                    <div key={c.id} onClick={() => setSelected(selected === c.id ? null : c.id)} style={{ ...card, cursor: 'pointer', border: selected === c.id ? '1px solid var(--gold)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                        {c.memberName?.[0] || '?'}
                      </div>
                      <div style={{ flex: '1 1 180px' }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.memberName}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>{c.lastMessage}</div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text2)', minWidth: 70 }}>
                        <div>{c.waitTime}</div>
                        {c.assignedTo && <div style={{ marginTop: 2 }}>{c.assignedTo}</div>}
                      </div>
                      <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, textTransform: 'capitalize' }}>{c.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {selectedChat && (
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selectedChat.memberName}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Started {selectedChat.startedAt} · {selectedChat.messageCount} messages</div>
              <div style={{ flex: 1, maxHeight: 260, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, padding: '8px 0' }}>
                {(selectedChat.messages || []).map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.role === 'agent' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 10, background: m.role === 'agent' ? '#1d4ed8' : 'var(--border)', fontSize: 13 }}>{m.text}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>Assign to agent</div>
                {assigning === selectedChat.id ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {AGENTS.map(a => (
                      <button key={a} onClick={() => assign(selectedChat.id, a)} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer' }}>{a}</button>
                    ))}
                    <button onClick={() => setAssigning(null)} style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer' }}>✗</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setAssigning(selectedChat.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>Assign Agent</button>
                    {selectedChat.status !== 'resolved' && (
                      <button onClick={() => close(selectedChat.id)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', background: '#166534', color: '#86efac', fontSize: 13, cursor: 'pointer' }}>Resolve</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
