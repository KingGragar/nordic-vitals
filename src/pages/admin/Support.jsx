import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminTickets, getTicket, replyToTicket, updateTicketStatus } from '../../api/mlmApi'

const CATEGORIES = ['all', 'commission', 'payout', 'referral', 'account', 'product', 'technical', 'other']
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

function TicketPane({ ticket, onReply, onStatusChange, onClose }) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ticket.messages.length])

  async function handleReply() {
    if (!reply.trim()) return
    setSending(true)
    try { await onReply(ticket.id, reply); setReply('') }
    finally { setSending(false) }
  }

  async function handleStatus(s) {
    setStatusChanging(true)
    try { await onStatusChange(ticket.id, s) }
    finally { setStatusChanging(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--navy2)', borderRadius: 10, border: '1px solid var(--navy3)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--navy3)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 5 }}>{ticket.subject}</div>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>
            {ticket.memberName} · {ticket.memberEmail} · {ticket.memberId}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span style={{ fontSize: 12, color: '#888', background: 'var(--navy3)', borderRadius: 99, padding: '2px 10px', textTransform: 'capitalize' }}>{ticket.category}</span>
            <span style={{ fontSize: 12, color: '#555' }}>#{ticket.id}</span>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, flexShrink: 0 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ticket.messages.map(msg => (
          <div key={msg.id} style={{ alignSelf: msg.from === 'admin' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{
              padding: '10px 14px', borderRadius: msg.from === 'admin' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              background: msg.from === 'admin' ? '#3b82f622' : 'var(--navy3)',
              border: msg.from === 'admin' ? '1px solid #3b82f644' : '1px solid #ffffff11',
              fontSize: 14, lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
            <div style={{ fontSize: 11, color: '#555', marginTop: 3, textAlign: msg.from === 'admin' ? 'right' : 'left' }}>
              {msg.from === 'member' ? `👤 ${ticket.memberName} · ` : '🛡️ Support Team · '}{fmtDate(msg.ts)}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--navy3)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: '#888' }}>Set status:</span>
        {['open', 'in_progress', 'resolved'].map(s => (
          <button key={s} onClick={() => handleStatus(s)} disabled={statusChanging || ticket.status === s}
            style={{
              padding: '4px 12px', borderRadius: 99, border: `1px solid ${STATUS_COLOR[s]}44`,
              background: ticket.status === s ? STATUS_COLOR[s] + '33' : 'transparent',
              color: STATUS_COLOR[s], cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: statusChanging ? 0.5 : 1,
            }}>
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--navy3)', display: 'flex', gap: 8 }}>
        <textarea value={reply} onChange={e => setReply(e.target.value)}
          rows={2} placeholder="Reply to member…"
          style={{ flex: 1, padding: '8px 10px', background: 'var(--navy)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff', resize: 'none', fontSize: 13 }} />
        <button onClick={handleReply} disabled={sending || !reply.trim()}
          style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer', opacity: (!reply.trim() || sending) ? 0.5 : 1, alignSelf: 'flex-end' }}>
          {sending ? '…' : 'Reply'}
        </button>
      </div>
    </div>
  )
}

const PAGE_SIZE = 15

export default function AdminSupport() {
  const [data, setData] = useState({ items: [], total: 0, open: 0, inProgress: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [status, setStatus] = useState('all')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE))

  function reload() {
    setLoading(true)
    getAdminTickets({ status, category, search, page, pageSize: PAGE_SIZE })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { reload() }, [status, category, search, page])

  async function handleReply(ticketId, text) {
    const updated = await replyToTicket(ticketId, { from: 'admin', text })
    setSelected(updated)
    reload()
  }

  async function handleStatusChange(ticketId, newStatus) {
    const updated = await updateTicketStatus(ticketId, newStatus)
    setSelected(updated)
    reload()
  }

  async function handleSelectTicket(t) {
    const full = await getTicket(t.id)
    setSelected(full)
  }

  return (
    <AdminLayout>
      <div style={{ padding: '24px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 20px', color: 'var(--gold)' }}>🎫 Support Tickets</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Open', value: data.open, color: '#f59e0b' },
            { label: 'In Progress', value: data.inProgress, color: '#3b82f6' },
            { label: 'Resolved', value: data.resolved, color: '#10b981' },
            { label: 'Total', value: data.total, color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--navy2)', borderRadius: 8, padding: '14px 16px', border: '1px solid var(--navy3)', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search subject, name, ID…"
            style={{ flex: '1 1 200px', padding: '7px 10px', background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff', fontSize: 13 }} />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}
            style={{ padding: '7px 10px', background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff' }}>
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
            style={{ padding: '7px 10px', background: 'var(--navy2)', border: '1px solid var(--navy3)', borderRadius: 6, color: '#fff' }}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: '#888', paddingTop: 40 }}>Loading…</div>
            ) : data.items.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', paddingTop: 40 }}>No tickets match your filters.</div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.items.map(t => (
                    <div key={t.id} onClick={() => handleSelectTicket(t)}
                      style={{
                        background: selected?.id === t.id ? 'var(--navy3)' : 'var(--navy2)',
                        border: `1px solid ${selected?.id === t.id ? 'var(--gold)' : 'var(--navy3)'}`,
                        borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                      }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div>
                      <div style={{ fontSize: 12, color: '#888', marginBottom: 5 }}>{t.memberName} · {t.memberId}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <StatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{fmtDate(t.updatedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '4px 12px', border: '1px solid var(--navy3)', borderRadius: 4, background: 'transparent', color: '#aaa', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}>‹</button>
                    <span style={{ color: '#888', fontSize: 13, lineHeight: '28px' }}>Page {page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '4px 12px', border: '1px solid var(--navy3)', borderRadius: 4, background: 'transparent', color: '#aaa', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}>›</button>
                  </div>
                )}
              </>
            )}
          </div>

          {selected && (
            <div style={{ flex: '2 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 480 }}>
              <TicketPane ticket={selected} onReply={handleReply} onStatusChange={handleStatusChange} onClose={() => setSelected(null)} />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
