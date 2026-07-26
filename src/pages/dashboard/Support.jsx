import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyTickets, createTicket, replyToTicket } from '../../api/mlmApi'

const CATEGORIES = ['commission', 'payout', 'referral', 'account', 'product', 'technical', 'other']
const STATUS_COLOR = { open: '#f59e0b', in_progress: '#3b82f6', resolved: '#10b981' }
const STATUS_LABEL = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' }
const PRIORITY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  return (
    <span style={{
      background: STATUS_COLOR[status] + '22', color: STATUS_COLOR[status],
      borderRadius: 99, padding: '2px 10px', fontSize: 12, fontWeight: 600,
      border: `1px solid ${STATUS_COLOR[status]}44`,
    }}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }) {
  return (
    <span style={{
      background: PRIORITY_COLOR[priority] + '22', color: PRIORITY_COLOR[priority],
      borderRadius: 99, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      border: `1px solid ${PRIORITY_COLOR[priority]}44`,
      textTransform: 'capitalize',
    }}>
      {priority}
    </span>
  )
}

function NewTicketModal({ onClose, onSubmit, memberName, memberEmail }) {
  const [form, setForm] = useState({ category: 'commission', subject: '', message: '', priority: 'medium' })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.subject.trim() || !form.message.trim()) { setErr('Please fill in subject and message.'); return }
    setLoading(true); setErr('')
    try {
      await onSubmit(form)
      onClose()
    } catch (ex) { setErr(ex.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 520, border: '1px solid var(--navy3)' }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--gold)' }}>Open New Support Ticket</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff' }}>
                {CATEGORIES.map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff' }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>Subject</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Brief description of your issue"
              style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#aaa', marginBottom: 4 }}>Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={5} placeholder="Describe your issue in detail..."
              style={{ width: '100%', padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff', resize: 'vertical', boxSizing: 'border-box' }} />
          </div>
          {err && <div style={{ color: '#ef4444', fontSize: 13 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 18px', border: '1px solid var(--navy3)', borderRadius: 6, background: 'transparent', color: '#aaa', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              style={{ padding: '8px 18px', background: 'var(--gold)', color: '#0a0e1a', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Submitting…' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TicketThread({ ticket, onReply, onClose }) {
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket.messages.length])

  async function handleReply() {
    if (!reply.trim()) return
    setLoading(true)
    try {
      await onReply(ticket.id, reply)
      setReply('')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--navy2)', borderRadius: 10, border: '1px solid var(--navy3)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--navy3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{ticket.subject}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span style={{ fontSize: 12, color: '#888', background: 'var(--navy3)', borderRadius: 99, padding: '2px 10px', textTransform: 'capitalize' }}>{ticket.category}</span>
            <span style={{ fontSize: 12, color: '#666' }}>#{ticket.id}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ticket.messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.from === 'member' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
          }}>
            <div style={{
              padding: '10px 14px', borderRadius: msg.from === 'member' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.from === 'member' ? 'var(--gold)22' : 'var(--navy3)',
              border: msg.from === 'member' ? '1px solid var(--gold)44' : '1px solid #ffffff11',
              fontSize: 14, lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3, textAlign: msg.from === 'member' ? 'right' : 'left' }}>
              {msg.from === 'admin' ? '🛡️ Support Team · ' : ''}{fmtDate(msg.ts)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== 'resolved' && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--navy3)', display: 'flex', gap: 8 }}>
          <textarea value={reply} onChange={e => setReply(e.target.value)}
            rows={2} placeholder="Write a reply…"
            style={{ flex: 1, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff', resize: 'none', fontSize: 13 }} />
          <button onClick={handleReply} disabled={loading || !reply.trim()}
            style={{ padding: '8px 16px', background: 'var(--gold)', color: '#0a0e1a', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', opacity: (!reply.trim() || loading) ? 0.5 : 1, alignSelf: 'flex-end' }}>
            Send
          </button>
        </div>
      )}
      {ticket.status === 'resolved' && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--navy3)', textAlign: 'center', color: '#10b981', fontSize: 13 }}>
          ✅ This ticket has been resolved.
        </div>
      )}
    </div>
  )
}

export default function Support() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!user) return
    setLoading(true)
    getMyTickets(user.memberId).then(data => { setTickets(data); setLoading(false) }).catch(() => setLoading(false))
  }, [user])

  async function handleCreate(form) {
    const ticket = await createTicket({ memberId: user.memberId, memberName: user.name, memberEmail: user.email, ...form })
    setTickets(prev => [ticket, ...prev])
    setSelected(ticket)
  }

  async function handleReply(ticketId, text) {
    const updated = await replyToTicket(ticketId, { from: 'member', text })
    setTickets(prev => prev.map(t => t.id === ticketId ? updated : t))
    setSelected(updated)
  }

  const filtered = filter === 'all' ? tickets : tickets.filter(t => t.status === filter)
  const open = tickets.filter(t => t.status === 'open').length
  const inProgress = tickets.filter(t => t.status === 'in_progress').length
  const resolved = tickets.filter(t => t.status === 'resolved').length

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0, color: 'var(--gold)' }}>🎫 Support</h2>
          <button onClick={() => setShowNew(true)}
            style={{ padding: '8px 18px', background: 'var(--gold)', color: '#0a0e1a', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>
            + New Ticket
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Open', value: open, color: '#f59e0b' },
            { label: 'In Progress', value: inProgress, color: '#3b82f6' },
            { label: 'Resolved', value: resolved, color: '#10b981' },
            { label: 'Total', value: tickets.length, color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--navy2)', borderRadius: 8, padding: '14px 16px', border: '1px solid var(--navy3)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{
                padding: '5px 14px', borderRadius: 99, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                background: filter === s ? 'var(--gold)' : 'var(--navy2)',
                color: filter === s ? '#0a0e1a' : '#aaa',
              }}>
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 280px', minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>Loading tickets…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎫</div>
                <div>No tickets yet. Open one if you need help!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(t => (
                  <div key={t.id} onClick={() => setSelected(t)}
                    style={{
                      background: selected?.id === t.id ? 'var(--navy3)' : 'var(--navy2)',
                      border: `1px solid ${selected?.id === t.id ? 'var(--gold)' : 'var(--navy3)'}`,
                      borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                    }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                      <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{fmtDate(t.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div style={{ flex: '2 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 440 }}>
              <TicketThread ticket={selected} onReply={handleReply} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewTicketModal onClose={() => setShowNew(false)} onSubmit={handleCreate} memberName={user?.name} memberEmail={user?.email} />
      )}
    </DashboardLayout>
  )
}
