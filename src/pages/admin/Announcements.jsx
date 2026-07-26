import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../../api/mlmApi'

const TYPE_META = {
  info:        { label: 'Info',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  product:     { label: 'Product',     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  promotion:   { label: 'Promotion',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  system:      { label: 'System',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  maintenance: { label: 'Maintenance', color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
}

const AUDIENCE_OPTIONS = [
  { value: 'all',      label: 'All Members' },
  { value: 'bronze',   label: 'Bronze & Above' },
  { value: 'silver',   label: 'Silver & Above' },
  { value: 'gold',     label: 'Gold & Above' },
  { value: 'platinum', label: 'Platinum Only' },
]

function Toast({ msg, isError, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: isError ? '#7f1d1d' : undefined }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
    </div>
  )
}

function TypeBadge({ type }) {
  const meta = TYPE_META[type] || TYPE_META.info
  return (
    <span style={{
      fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '99px',
      color: meta.color, background: meta.bg, letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {meta.label}
    </span>
  )
}

function ComposeModal({ onClose, onSent }) {
  const [form, setForm] = useState({ title: '', body: '', audience: 'all', type: 'info' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.body.trim())  return setError('Message body is required.')
    setSending(true)
    setError('')
    try {
      const { announcement } = await createAnnouncement(form)
      onSent(announcement)
    } catch {
      setError('Failed to send announcement. Please try again.')
      setSending(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)',
    background: 'var(--card)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', display: 'block' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget && !sending) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '580px', position: 'relative' }}>
        <button
          onClick={onClose}
          disabled={sending}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', lineHeight: 1, cursor: 'pointer' }}
        >
          ×
        </button>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
          📣 New Announcement
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input
              style={inputStyle}
              placeholder="e.g. July Commission Run Complete"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={120}
              disabled={sending}
            />
          </div>

          <div>
            <label style={labelStyle}>Message *</label>
            <textarea
              style={{ ...inputStyle, minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="Write your announcement to members…"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              maxLength={2000}
              disabled={sending}
            />
            <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px', textAlign: 'right' }}>
              {form.body.length}/2000
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Audience</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.audience}
                onChange={e => setForm(f => ({ ...f, audience: e.target.value }))}
                disabled={sending}
              >
                {AUDIENCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                disabled={sending}
              >
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '14px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !form.title.trim() || !form.body.trim()}
              style={{
                padding: '10px 24px', borderRadius: '8px', border: 'none',
                background: sending ? 'var(--gold-dim)' : 'var(--gold)', color: '#000',
                fontSize: '14px', fontWeight: 700, cursor: sending ? 'default' : 'pointer',
              }}
            >
              {sending ? 'Sending…' : '📣 Send Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AnnouncementCard({ ann, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const date = new Date(ann.created_at)
  const dateStr = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const audienceMeta = AUDIENCE_OPTIONS.find(o => o.value === ann.audience)

  async function handleDelete() {
    if (!confirming) return setConfirming(true)
    setDeleting(true)
    try {
      await deleteAnnouncement(ann.id)
      onDelete(ann.id)
    } catch {
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <TypeBadge type={ann.type} />
            <span style={{ fontSize: '12px', color: 'var(--text2)' }}>
              👥 {audienceMeta?.label ?? ann.audience} · {ann.recipient_count?.toLocaleString()} recipients
            </span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>{ann.title}</h3>
          <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{ann.body}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px', flexShrink: 0 }}>
          <div style={{ fontSize: '12px', color: 'var(--text2)', textAlign: 'right' }}>
            <div>{dateStr}</div>
            <div>{timeStr} UTC</div>
            <div style={{ marginTop: '4px' }}>by {ann.sent_by}</div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {confirming ? (
              <>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: deleting ? 'default' : 'pointer' }}
                >
                  {deleting ? 'Deleting…' : 'Confirm Delete'}
                </button>
              </>
            ) : (
              <button
                onClick={handleDelete}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.4)', background: 'transparent', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading]             = useState(true)
  const [showCompose, setShowCompose]     = useState(false)
  const [toast, setToast]                 = useState(null)
  const [typeFilter, setTypeFilter]       = useState('all')

  useEffect(() => {
    getAnnouncements()
      .then(d => setAnnouncements(d.announcements))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false))
  }, [])

  function showMsg(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3500)
  }

  function handleSent(ann) {
    setAnnouncements(prev => [ann, ...prev])
    setShowCompose(false)
    showMsg(`Announcement sent to ${ann.recipient_count?.toLocaleString()} members ✓`)
  }

  function handleDelete(id) {
    setAnnouncements(prev => prev.filter(a => a.id !== id))
    showMsg('Announcement deleted.')
  }

  const filtered = typeFilter === 'all'
    ? announcements
    : announcements.filter(a => a.type === typeFilter)

  const totalRecipients = announcements.reduce((s, a) => s + (a.recipient_count ?? 0), 0)

  return (
    <AdminLayout>
      {toast && <Toast msg={toast.msg} isError={toast.isError} onClose={() => setToast(null)} />}
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSent={handleSent} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>📣 Announcements</h1>
        <button
          onClick={() => setShowCompose(true)}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'var(--gold)', color: '#000', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
        >
          + New Announcement
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Sent', value: announcements.length },
          { label: 'This Month', value: announcements.filter(a => a.created_at >= new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()).length },
          { label: 'Total Reach', value: totalRecipients.toLocaleString() + ' sends' },
        ].map(({ label, value }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[['all', 'All'], ...Object.entries(TYPE_META).map(([k, v]) => [k, v.label])].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTypeFilter(k)}
            style={{
              padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--border)',
              background: typeFilter === k ? 'var(--gold)' : 'transparent',
              color: typeFilter === k ? '#000' : 'var(--text2)',
              fontSize: '13px', fontWeight: typeFilter === k ? 700 : 400, cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>No announcements yet</div>
          <div style={{ fontSize: '13px' }}>Use the button above to send your first announcement to members.</div>
        </div>
      ) : (
        filtered.map(ann => (
          <AnnouncementCard key={ann.id} ann={ann} onDelete={handleDelete} />
        ))
      )}
    </AdminLayout>
  )
}
