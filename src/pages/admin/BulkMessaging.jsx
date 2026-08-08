import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminBulkMessages, sendAdminBulkMessage, deleteAdminBulkMessage } from '../../api/mlmApi'

const CH_COLOR = { email: '#93c5fd', sms: '#86efac', push: '#fbbf24' }
const ST_COLOR = { sent: '#86efac', scheduled: '#93c5fd', draft: '#9ca3af', failed: '#f87171' }
const CH_ICON  = { email: '✉️', sms: '📱', push: '🔔' }
const BLANK = { subject: '', body: '', segment: '', channel: 'email', scheduleAt: '' }

export default function AdminBulkMessaging() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('all')
  const [confirmId, setConfirmId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminBulkMessages().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleSend() {
    if (!form.subject || !form.segment || !form.channel) return
    setSending(true)
    const result = await sendAdminBulkMessage(form)
    setData(prev => ({ ...prev, history: [result, ...(prev?.history || [])] }))
    setModal(false)
    setForm(BLANK)
    setSending(false)
  }

  async function handleDelete(id) {
    await deleteAdminBulkMessage(id)
    setData(prev => ({ ...prev, history: prev.history.filter(m => m.id !== id) }))
    setConfirmId(null)
  }

  const msgs = (data?.history || []).filter(m => filter === 'all' || m.status === filter)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const btn  = (bg, fg = '#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

  const totalSent   = (data?.history || []).reduce((s, m) => s + (m.sent || 0), 0)
  const totalOpened = (data?.history || []).reduce((s, m) => s + (m.opened || 0), 0)
  const avgOpenRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '—'
  const scheduled   = (data?.history || []).filter(m => m.status === 'scheduled').length

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Bulk Messaging</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Send mass email, SMS, and push notifications to member segments</p>
          </div>
          <button style={btn('#6366f1')} onClick={() => setModal(true)}>+ Compose Message</button>
        </div>

        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Sent', value: totalSent.toLocaleString(), color: '#86efac' },
            { label: 'Avg Open Rate', value: `${avgOpenRate}%`, color: '#fbbf24' },
            { label: 'Scheduled', value: scheduled, color: '#93c5fd' },
            { label: 'Segments', value: data?.segments?.length ?? '—', color: '#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all','sent','scheduled','draft'].map(s => (
            <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: filter === s ? '#6366f1' : 'var(--card)', color: filter === s ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>

        {/* Message history table */}
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Subject','Channel','Segment','Sent','Opened','Clicked','Status','Sent At',''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {msgs.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt, rgba(0,0,0,.03))' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{m.subject}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ background: 'rgba(0,0,0,.2)', color: CH_COLOR[m.channel], borderRadius: 5, padding: '2px 8px', fontSize: 12 }}>{CH_ICON[m.channel]} {m.channel}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 13 }}>{m.segment}</td>
                      <td style={{ padding: '10px 14px' }}>{m.sent.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>{m.opened.toLocaleString()}{m.sent > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 4 }}>({((m.opened/m.sent)*100).toFixed(0)}%)</span>}</td>
                      <td style={{ padding: '10px 14px' }}>{m.clicked.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ color: ST_COLOR[m.status], background: 'rgba(0,0,0,.2)', borderRadius: 5, padding: '2px 8px', fontSize: 12, textTransform: 'capitalize' }}>{m.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: 12 }}>{m.sentAt ? new Date(m.sentAt).toLocaleString() : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        {(m.status === 'draft' || m.status === 'scheduled') && (
                          confirmId === m.id
                            ? <><button style={{ ...btn('#ef4444'), padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(m.id)}>Confirm</button><button style={{ ...btn('transparent', 'var(--text)'), padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmId(null)}>Cancel</button></>
                            : <button style={{ ...btn('transparent', '#f87171'), padding: '4px 10px', fontSize: 12 }} onClick={() => setConfirmId(m.id)}>Delete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {msgs.length === 0 && <tr><td colSpan={9} style={{ padding: 28, textAlign: 'center', color: 'var(--text-muted)' }}>No messages in this filter.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Compose modal */}
        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 540, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
              <h2 style={{ margin: '0 0 18px', fontSize: 18, fontWeight: 700 }}>Compose Bulk Message</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Channel</label>
                  <select style={inp} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Target Segment</label>
                  <select style={inp} value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                    <option value="">Select segment…</option>
                    {(data?.segments || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Subject / Title</label>
                  <input style={inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Enter subject…" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Message Body</label>
                  <textarea style={{ ...inp, height: 100, resize: 'vertical' }} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Write your message…" />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Schedule At (leave empty to send now)</label>
                  <input style={inp} type="datetime-local" value={form.scheduleAt} onChange={e => setForm(f => ({ ...f, scheduleAt: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button style={btn('var(--border)', 'var(--text)')} onClick={() => { setModal(false); setForm(BLANK) }}>Cancel</button>
                <button style={btn('#6366f1')} onClick={handleSend} disabled={sending}>{sending ? 'Sending…' : form.scheduleAt ? 'Schedule' : 'Send Now'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
