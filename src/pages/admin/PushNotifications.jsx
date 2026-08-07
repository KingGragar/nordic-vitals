import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminPushCampaigns,
  getAdminPushStats,
  createAdminPushCampaign,
  updateAdminPushCampaign,
  deleteAdminPushCampaign,
  sendAdminPushCampaign,
} from '../../api/mlmApi'

const STATUS_STYLE = {
  draft:     { bg: '#1c1c1c', color: '#a3a3a3', border: '#404040' },
  scheduled: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  sent:      { bg: '#052e16', color: '#86efac', border: '#166534' },
}

const SEGMENTS = ['All Members', 'Active Members', 'Bronze Rank', 'Silver Rank', 'Gold Rank', 'Platinum+', 'New (< 30d)', 'Inactive (> 60d)']

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 22 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
    </div>
  )
}

function CampaignModal({ campaign, onSave, onClose }) {
  const [form, setForm] = useState(campaign
    ? { title: campaign.title, body: campaign.body, icon: campaign.icon ?? '/logo.svg', actionUrl: campaign.actionUrl ?? '', segment: campaign.segment, scheduledAt: campaign.scheduledAt ?? '', sendNow: false }
    : { title: '', body: '', icon: '/logo.svg', actionUrl: '', segment: 'All Members', scheduledAt: '', sendNow: false })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  const inp = { width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{campaign ? 'Edit Campaign' : 'New Push Notification'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        {/* Preview */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ fontSize: 28 }}>🔔</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{form.title || 'Notification title'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{form.body || 'Notification message will appear here…'}</div>
            {form.actionUrl && <div style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>→ {form.actionUrl}</div>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', whiteSpace: 'nowrap' }}>now</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. New product launch 🚀" style={inp} maxLength={60} />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, textAlign: 'right' }}>{form.title.length}/60</div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Message * <span style={{ fontWeight: 400 }}>(merge: {'{{firstName}}'}, {'{{rank}}'})</span></label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={3} maxLength={120}
              placeholder="Short, punchy message that drives action…"
              style={{ ...inp, resize: 'vertical' }} />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, textAlign: 'right' }}>{form.body.length}/120</div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Target Segment</label>
              <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} style={inp}>
                {SEGMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Action URL (optional)</label>
              <input value={form.actionUrl} onChange={e => setForm(f => ({ ...f, actionUrl: e.target.value }))} placeholder="/shop" style={inp} />
            </div>
          </div>
          {!form.sendNow && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Schedule (optional)</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} style={inp} />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
            <input type="checkbox" checked={form.sendNow} onChange={e => setForm(f => ({ ...f, sendNow: e.target.checked, scheduledAt: e.target.checked ? '' : f.scheduledAt }))} />
            Send immediately
          </label>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.body.trim()}
            style={{ flex: 1, background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 0', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : (campaign ? 'Save Changes' : (form.sendNow ? 'Send Now' : 'Save Campaign'))}
          </button>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function PushNotifications() {
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | campaign obj
  const [sending, setSending] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([getAdminPushCampaigns(), getAdminPushStats()])
      .then(([c, s]) => { setCampaigns(c); setStats(s) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    if (modal === 'new') {
      const n = await createAdminPushCampaign(form)
      setCampaigns(p => [n, ...p])
    } else {
      await updateAdminPushCampaign(modal.id, form)
      setCampaigns(p => p.map(x => x.id === modal.id ? { ...x, ...form } : x))
    }
    setModal(null)
  }

  async function handleSend(id) {
    setSending(id)
    await sendAdminPushCampaign(id)
    const updated = await getAdminPushCampaigns()
    setCampaigns(updated)
    setSending(null)
  }

  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminPushCampaign(id)
    setCampaigns(p => p.filter(x => x.id !== id))
    setDeleting(null)
  }

  return (
    <AdminLayout>
      {modal && (
        <CampaignModal
          campaign={modal === 'new' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 22 }}>🔔 Push Notifications</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Send web push notifications to members and customers.</div>
          </div>
          <button onClick={() => setModal('new')}
            style={{ background: 'var(--gold)', color: '#000', fontWeight: 700, border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}>
            + New Campaign
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="📲" label="Subscribers" value={stats.subscribers.toLocaleString()} sub={`${stats.optInRate}% opt-in rate`} />
            <StatCard icon="📤" label="Sent This Month" value={stats.sentThisMonth.toLocaleString()} sub={`${stats.delivered.toLocaleString()} delivered`} />
            <StatCard icon="👆" label="Avg. CTR" value={`${stats.avgCtr}%`} sub={`${stats.clicked.toLocaleString()} clicked`} />
            <StatCard icon="🔇" label="Dismissed" value={stats.dismissed.toLocaleString()} sub="this month" />
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {campaigns.map(c => {
              const ss = STATUS_STYLE[c.status] || STATUS_STYLE.draft
              const ctr = c.stats ? ((c.stats.clicked / Math.max(1, c.stats.delivered)) * 100).toFixed(1) : null
              return (
                <div key={c.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{c.title}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{c.body}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text2)', flexWrap: 'wrap' }}>
                        <span>🎯 {c.segment}</span>
                        {c.actionUrl && <span>🔗 {c.actionUrl}</span>}
                        {c.sentAt && <span>📅 Sent {new Date(c.sentAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                        {c.scheduledAt && !c.sentAt && <span>⏰ Scheduled {new Date(c.scheduledAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      {(c.status === 'draft' || c.status === 'scheduled') && (
                        <>
                          <button onClick={() => handleSend(c.id)} disabled={sending === c.id}
                            style={{ padding: '7px 14px', background: '#166534', color: '#86efac', border: '1px solid #166534', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                            {sending === c.id ? 'Sending…' : '▶ Send'}
                          </button>
                          <button onClick={() => setModal(c)}
                            style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                            Edit
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                        style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
                        {deleting === c.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>

                  {c.stats && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                        {[
                          { label: 'Sent', val: c.stats.sent, color: '#6366f1' },
                          { label: 'Delivered', val: c.stats.delivered, color: '#10b981' },
                          { label: 'Clicked', val: c.stats.clicked, color: '#f59e0b' },
                          { label: 'Dismissed', val: c.stats.dismissed, color: '#6b7280' },
                        ].map(({ label, val, color }) => (
                          <div key={label}>
                            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                              <span>{label}</span>
                              <span style={{ color }}>{val.toLocaleString()}</span>
                            </div>
                            <MiniBar value={val} max={c.stats.sent} color={color} />
                          </div>
                        ))}
                      </div>
                      {ctr !== null && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 10 }}>
                          CTR <strong style={{ color: 'var(--text)' }}>{ctr}%</strong>
                          {'  ·  '}
                          Delivery rate <strong style={{ color: 'var(--text)' }}>{((c.stats.delivered / Math.max(1, c.stats.sent)) * 100).toFixed(1)}%</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            {campaigns.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
                No push campaigns yet. Create your first one!
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
