import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminNotifications, sendNotification, cancelNotification,
} from '../../api/mlmApi'

const TYPE_META = {
  system:     { icon: '📢', label: 'System',      color: '#64748b' },
  commission: { icon: '💰', label: 'Commission',  color: '#22c55e' },
  referral:   { icon: '👥', label: 'Referral',    color: '#6366f1' },
  rank_up:    { icon: '🏅', label: 'Rank Up',     color: '#f59e0b' },
  promo:      { icon: '🎁', label: 'Promotion',   color: '#ec4899' },
}

const AUDIENCE_OPTS = [
  { value: 'all',                  label: 'All Members',              count: 312 },
  { value: 'rank:bronze',          label: 'Bronze & Above',           count: 312 },
  { value: 'rank:silver',          label: 'Silver & Above',           count: 180 },
  { value: 'rank:gold',            label: 'Gold & Above',             count: 74  },
  { value: 'rank:platinum',        label: 'Platinum Only',            count: 18  },
  { value: 'status:active',        label: 'Active Members',           count: 248 },
  { value: 'joined:last_14_days',  label: 'New Members (last 14d)',   count: 31  },
  { value: 'inactive:30_days',     label: 'Inactive 30+ Days',        count: 64  },
]

const STATUS_TABS = ['all', 'sent', 'scheduled', 'cancelled']

const STATUS_BADGE = {
  sent:      { bg: '#14532d', color: '#4ade80', label: 'Sent' },
  scheduled: { bg: '#1e3a5f', color: '#60a5fa', label: 'Scheduled' },
  cancelled: { bg: '#3f1d1d', color: '#f87171', label: 'Cancelled' },
}

const EMPTY_FORM = {
  type: 'system',
  title: '',
  body: '',
  audience: 'all',
  scheduled_at: '',
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function pct(n, total) {
  if (!total || !n) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')
  const [search, setSearch]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [sending, setSending]   = useState(false)
  const [toast, setToast]       = useState(null)
  const [cancelId, setCancelId] = useState(null)
  const [preview, setPreview]   = useState(null)

  useEffect(() => {
    getAdminNotifications().then(data => {
      setNotifications(data)
      setLoading(false)
    })
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const audienceCount = useMemo(() => {
    const opt = AUDIENCE_OPTS.find(o => o.value === form.audience)
    return opt ? opt.count : 0
  }, [form.audience])

  const filtered = useMemo(() => {
    let list = notifications
    if (tab !== 'all') list = list.filter(n => n.status === tab)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
      )
    }
    return list
  }, [notifications, tab, search])

  const kpi = useMemo(() => {
    const sent = notifications.filter(n => n.status === 'sent')
    const scheduled = notifications.filter(n => n.status === 'scheduled')
    const totalRecipients = sent.reduce((s, n) => s + n.recipient_count, 0)
    const totalRead       = sent.reduce((s, n) => s + n.read_count, 0)
    return {
      sentCount: sent.length,
      scheduled: scheduled.length,
      totalRecipients,
      avgRead: totalRecipients ? Math.round((totalRead / totalRecipients) * 100) : 0,
    }
  }, [notifications])

  async function handleSend(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) {
      showToast('Title and message are required', 'error')
      return
    }
    setSending(true)
    try {
      const created = await sendNotification({
        ...form,
        recipient_count: audienceCount,
      })
      setNotifications(prev => [created, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
      showToast(form.scheduled_at ? 'Notification scheduled' : 'Notification sent to ' + audienceCount + ' members')
    } catch (err) {
      showToast(err.message || 'Failed to send', 'error')
    } finally {
      setSending(false)
    }
  }

  async function handleCancel(id) {
    try {
      await cancelNotification(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'cancelled' } : n))
      showToast('Notification cancelled')
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error')
    } finally {
      setCancelId(null)
    }
  }

  const cardStyle = {
    background: 'var(--navy2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '20px 24px',
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>🔔 Notification Broadcast</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text2)' }}>Send in-app notifications to member segments</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowForm(true) }}>
            + New Notification
          </button>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          {[
            { label: 'Sent (all time)',   value: kpi.sentCount },
            { label: 'Scheduled',         value: kpi.scheduled },
            { label: 'Total Recipients',  value: kpi.totalRecipients.toLocaleString() },
            { label: 'Avg Read Rate',     value: kpi.avgRead + '%' },
          ].map(({ label, value }) => (
            <div key={label} style={{ ...cardStyle, padding: '16px 18px' }}>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Compose Form */}
        {showForm && (
          <div style={{ ...cardStyle, marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>Compose Notification</h2>
            <form onSubmit={handleSend}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Type */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)', fontSize: '13px' }}
                  >
                    {Object.entries(TYPE_META).map(([v, m]) => (
                      <option key={v} value={v}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                </div>
                {/* Audience */}
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>
                    Audience <span style={{ color: 'var(--gold)' }}>≈ {audienceCount} members</span>
                  </label>
                  <select
                    value={form.audience}
                    onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                    style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)', fontSize: '13px' }}
                  >
                    {AUDIENCE_OPTS.map(o => (
                      <option key={o.value} value={o.value}>{o.label} ({o.count})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>Title</label>
                <input
                  type="text"
                  maxLength={80}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Short notification title..."
                  style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              {/* Body */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>
                  Message <span style={{ color: 'var(--text2)' }}>(max 200 chars)</span>
                </label>
                <textarea
                  maxLength={200}
                  rows={3}
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  placeholder="Notification body text..."
                  style={{ width: '100%', background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '11px', color: 'var(--text2)', textAlign: 'right' }}>{form.body.length}/200</div>
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text2)', display: 'block', marginBottom: '6px' }}>
                  Schedule (leave blank to send immediately)
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                  style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px 10px', color: 'var(--cream)', fontSize: '13px' }}
                />
              </div>

              {/* Preview pane */}
              <div style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '8px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Preview</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '20px' }}>{TYPE_META[form.type]?.icon || '📢'}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)' }}>{form.title || 'Notification title'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '3px' }}>{form.body || 'Your message will appear here...'}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary" disabled={sending}>
                  {sending ? 'Sending…' : form.scheduled_at ? '📅 Schedule' : '🚀 Send Now'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* History Table */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--cream)', flex: 1 }}>History</h2>
            {/* Search */}
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 12px', color: 'var(--cream)', fontSize: '13px', width: '180px' }}
            />
          </div>

          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            {STATUS_TABS.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: tab === t ? 'var(--gold)' : 'var(--navy3)',
                  color: tab === t ? '#000' : 'var(--text2)',
                  border: 'none', borderRadius: '6px', padding: '5px 14px',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px' }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '40px' }}>No notifications found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Type', 'Title', 'Audience', 'Recipients', 'Read Rate', 'Status', 'Sent / Scheduled', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(n => {
                    const tm = TYPE_META[n.type] || TYPE_META.system
                    const sb = STATUS_BADGE[n.status] || STATUS_BADGE.sent
                    return (
                      <tr key={n.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px' }}>
                          <span title={tm.label} style={{ fontSize: '16px' }}>{tm.icon}</span>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--cream)' }}>{n.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '2px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</div>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text2)' }}>
                          {AUDIENCE_OPTS.find(o => o.value === n.audience)?.label || n.audience}
                        </td>
                        <td style={{ padding: '10px', color: 'var(--cream)' }}>
                          {n.recipient_count.toLocaleString()}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {n.status === 'sent' ? (
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>{pct(n.read_count, n.recipient_count)}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{n.read_count} read</div>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ background: sb.bg, color: sb.color, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                            {sb.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px', color: 'var(--text2)', fontSize: '12px' }}>
                          {fmt(n.sent_at || n.scheduled_at)}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => setPreview(n)}
                            >
                              View
                            </button>
                            {n.status === 'scheduled' && (
                              <button
                                className="btn btn-outline btn-sm"
                                style={{ color: '#f87171', borderColor: '#f87171' }}
                                onClick={() => setCancelId(n.id)}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setPreview(null)}
        >
          <div
            style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', maxWidth: '480px', width: '90%' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '20px' }}>
              <span style={{ fontSize: '28px' }}>{TYPE_META[preview.type]?.icon || '📢'}</span>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>{preview.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px', lineHeight: 1.6 }}>{preview.body}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                ['Type', TYPE_META[preview.type]?.label || preview.type],
                ['Audience', AUDIENCE_OPTS.find(o => o.value === preview.audience)?.label || preview.audience],
                ['Recipients', preview.recipient_count.toLocaleString()],
                ['Read', preview.status === 'sent' ? `${preview.read_count} (${pct(preview.read_count, preview.recipient_count)})` : '—'],
                ['Status', STATUS_BADGE[preview.status]?.label || preview.status],
                ['Sent', fmt(preview.sent_at || preview.scheduled_at)],
              ].map(([k, v]) => (
                <div key={k} style={{ background: 'var(--navy3)', borderRadius: '6px', padding: '10px 12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>{k}</div>
                  <div style={{ fontSize: '13px', color: 'var(--cream)', fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline" onClick={() => setPreview(null)}>Close</button>
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      {cancelId && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setCancelId(null)}
        >
          <div
            style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '90%', textAlign: 'center' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 10px', color: 'var(--cream)' }}>Cancel Notification?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '22px' }}>
              This scheduled notification will not be delivered.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-outline" onClick={() => setCancelId(null)}>Keep</button>
              <button
                className="btn btn-primary"
                style={{ background: '#dc2626', borderColor: '#dc2626' }}
                onClick={() => handleCancel(cancelId)}
              >
                Cancel It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
          background: toast.type === 'error' ? '#dc2626' : '#16a34a',
          color: '#fff', padding: '12px 20px', borderRadius: '8px',
          fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
