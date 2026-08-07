import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminSmsCampaigns,
  createAdminSmsCampaign,
  updateAdminSmsCampaign,
  deleteAdminSmsCampaign,
  sendAdminSmsCampaign,
  getAdminSmsStats,
} from '../../api/mlmApi'

const CHANNEL_COLOR = { sms: '#10b981', whatsapp: '#25d366' }
const STATUS_STYLE = {
  draft:     { bg: '#1c1c1c', color: '#a3a3a3', border: '#404040' },
  scheduled: { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8' },
  sent:      { bg: '#052e16', color: '#86efac', border: '#166534' },
  failed:    { bg: '#450a0a', color: '#fca5a5', border: '#991b1b' },
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

function Bar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
    </div>
  )
}

function CampaignModal({ campaign, onSave, onClose }) {
  const now = new Date().toISOString().slice(0, 16)
  const [form, setForm] = useState(campaign
    ? { name: campaign.name, channel: campaign.channel, message: campaign.message, segment: campaign.segment, scheduledAt: campaign.scheduledAt ?? '', sendNow: false }
    : { name: '', channel: 'sms', message: '', segment: 'All Members', scheduledAt: '', sendNow: false })
  const [saving, setSaving] = useState(false)
  const charLimit = form.channel === 'sms' ? 160 : 1024
  const msgLen = form.message.length
  const smsCount = form.channel === 'sms' ? Math.ceil(msgLen / 160) : 1

  async function handleSave() {
    if (!form.name.trim() || !form.message.trim()) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{campaign ? 'Edit Campaign' : 'New Campaign'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Campaign Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Summer Flash Sale"
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Channel</label>
              <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                <option value="sms">📱 SMS</option>
                <option value="whatsapp">💬 WhatsApp</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Target Segment</label>
              <select value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }}>
                {SEGMENTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)' }}>Message *</label>
              <span style={{ fontSize: 11, color: msgLen > charLimit ? '#ef4444' : 'var(--text2)' }}>
                {msgLen}/{charLimit}{form.channel === 'sms' && smsCount > 1 ? ` (${smsCount} SMS)` : ''}
              </span>
            </div>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={4}
              placeholder="Hi {firstName}, ..."
              style={{ width: '100%', background: 'var(--bg)', border: `1px solid ${msgLen > charLimit ? '#ef4444' : 'var(--border)'}`, borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Use {'{{firstName}}'}, {'{{rank}}'}, {'{{code}}'} as merge tags.</div>
          </div>
          {!form.sendNow && (
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Schedule Send (optional)</label>
              <input type="datetime-local" min={now} value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
          )}
          {!campaign && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.sendNow} onChange={e => setForm(f => ({ ...f, sendNow: e.target.checked, scheduledAt: '' }))} />
              Send immediately after saving
            </label>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim() || !form.message.trim() || msgLen > charLimit}
            style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : form.sendNow ? 'Save & Send' : 'Save Draft'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.draft
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{status}</span>
}

function ChannelBadge({ channel }) {
  const c = CHANNEL_COLOR[channel] || '#6b7280'
  return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', background: c + '22', color: c, border: `1px solid ${c}44` }}>{channel === 'whatsapp' ? '💬 WhatsApp' : '📱 SMS'}</span>
}

export default function AdminSmsCampaigns() {
  const [campaigns, setCampaigns] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [filter, setFilter] = useState('all')
  const [sending, setSending] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([getAdminSmsCampaigns(), getAdminSmsStats()]).then(([c, s]) => {
      setCampaigns(c)
      setStats(s)
      setLoading(false)
    })
  }, [])

  async function handleCreate(form) {
    const created = await createAdminSmsCampaign(form)
    setCampaigns(c => [created, ...c])
    if (form.sendNow) setSending(null)
  }
  async function handleEdit(id, form) {
    await updateAdminSmsCampaign(id, form)
    setCampaigns(c => c.map(x => x.id === id ? { ...x, ...form } : x))
  }
  async function handleDelete(id) {
    setDeleting(id)
    await deleteAdminSmsCampaign(id)
    setCampaigns(c => c.filter(x => x.id !== id))
    setDeleting(null)
  }
  async function handleSend(id) {
    setSending(id)
    await sendAdminSmsCampaign(id)
    setCampaigns(c => c.map(x => x.id === id ? { ...x, status: 'sent', sentAt: new Date().toISOString() } : x))
    setSending(null)
  }

  const filtered = filter === 'all' ? campaigns : campaigns.filter(c => c.status === filter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>📱 SMS & WhatsApp Campaigns</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Broadcast text messages and WhatsApp notifications to member segments.</p>
        </div>

        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="📤" label="Sent This Month" value={stats.sentThisMonth.toLocaleString()} />
            <StatCard icon="✅" label="Delivery Rate" value={`${stats.deliveryRate}%`} />
            <StatCard icon="👆" label="Click-Through" value={`${stats.ctrRate}%`} />
            <StatCard icon="🚫" label="Opt-Outs" value={stats.optOuts.toLocaleString()} sub="this month" />
          </div>
        )}

        {stats && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Delivery Breakdown — Last 30 Days</div>
            {[
              { label: 'Delivered', value: stats.delivered, max: stats.sentThisMonth, color: '#10b981' },
              { label: 'Failed', value: stats.failed, max: stats.sentThisMonth, color: '#ef4444' },
              { label: 'Pending', value: stats.pending, max: stats.sentThisMonth, color: '#f59e0b' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 70, fontSize: 12, color: 'var(--text2)' }}>{row.label}</div>
                <Bar value={row.value} max={row.max} color={row.color} />
                <div style={{ width: 60, fontSize: 12, textAlign: 'right' }}>{row.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['all', 'draft', 'scheduled', 'sent', 'failed'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)', background: filter === f ? '#6366f1' : 'none', color: filter === f ? '#fff' : 'var(--text2)', cursor: 'pointer', fontSize: 12, textTransform: 'capitalize' }}>{f}</button>
            ))}
          </div>
          <button onClick={() => setModal('new')} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>+ New Campaign</button>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No campaigns found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</span>
                      <ChannelBadge channel={c.channel} />
                      <StatusBadge status={c.status} />
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Segment: {c.segment}</div>
                    <div style={{ fontSize: 13, background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', border: '1px solid var(--border)', maxWidth: 480 }}>{c.message}</div>
                    {c.scheduledAt && c.status === 'scheduled' && (
                      <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 6 }}>⏰ Scheduled: {new Date(c.scheduledAt).toLocaleString()}</div>
                    )}
                    {c.sentAt && (
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>Sent: {new Date(c.sentAt).toLocaleString()}</div>
                    )}
                  </div>
                  {c.status === 'sent' && c.stats && (
                    <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                      {[
                        { label: 'Sent', value: c.stats.sent, color: 'var(--text)' },
                        { label: 'Delivered', value: c.stats.delivered, color: '#10b981' },
                        { label: 'Clicked', value: c.stats.clicked, color: '#6366f1' },
                        { label: 'Opt-out', value: c.stats.optOut, color: '#ef4444' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, fontSize: 17, color: s.color }}>{s.value.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {c.status === 'draft' && (
                    <>
                      <button onClick={() => setModal(c)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Edit</button>
                      <button onClick={() => handleSend(c.id)} disabled={sending === c.id}
                        style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, opacity: sending === c.id ? 0.7 : 1 }}>
                        {sending === c.id ? 'Sending…' : '📤 Send Now'}
                      </button>
                    </>
                  )}
                  {c.status === 'scheduled' && (
                    <button onClick={() => setModal(c)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>Edit Schedule</button>
                  )}
                  {(c.status === 'draft' || c.status === 'failed') && (
                    <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                      style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ef4444', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, opacity: deleting === c.id ? 0.5 : 1 }}>
                      {deleting === c.id ? '…' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <CampaignModal
            campaign={modal === 'new' ? null : modal}
            onSave={async form => {
              if (modal === 'new') await handleCreate(form)
              else await handleEdit(modal.id, form)
              setModal(null)
            }}
            onClose={() => setModal(null)}
          />
        )}
      </div>
    </AdminLayout>
  )
}
