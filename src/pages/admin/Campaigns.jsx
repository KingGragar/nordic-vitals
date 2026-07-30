import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getEmailCampaigns, createEmailCampaign, cancelEmailCampaign,
  duplicateEmailCampaign, sendEmailCampaignNow, updateEmailCampaign,
  getEmailTemplates, getAdminMembers,
} from '../../api/mlmApi'

const AUDIENCE_OPTIONS = [
  { value: 'all',                  label: 'All Members' },
  { value: 'rank:bronze',          label: 'Bronze Members Only' },
  { value: 'rank:silver',          label: 'Silver Members Only' },
  { value: 'rank:gold',            label: 'Gold Members Only' },
  { value: 'rank:platinum',        label: 'Platinum Members Only' },
  { value: 'rank:silver,gold,platinum', label: 'Silver, Gold & Platinum' },
  { value: 'status:active',        label: 'Active Members' },
  { value: 'status:paused_autoship', label: 'Paused Autoship Members' },
  { value: 'joined:last_14_days',  label: 'New Members (last 14 days)' },
  { value: 'joined:last_30_days',  label: 'New Members (last 30 days)' },
  { value: 'inactive:30_days',     label: 'Inactive 30+ Days' },
  { value: 'inactive:60_days',     label: 'Inactive 60+ Days' },
]

const STATUS_TABS = ['all', 'draft', 'scheduled', 'sent', 'cancelled']

const STATUS_BADGE = {
  draft:     { bg: '#334155', color: '#94a3b8', label: 'Draft' },
  scheduled: { bg: '#1e3a5f', color: '#60a5fa', label: 'Scheduled' },
  sent:      { bg: '#14532d', color: '#4ade80', label: 'Sent' },
  cancelled: { bg: '#3f1d1d', color: '#f87171', label: 'Cancelled' },
}

function fmt(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function pct(n, total) {
  if (!total || !n) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

const EMPTY_FORM = {
  name: '',
  subject: '',
  audience: 'all',
  recipient_count: 312,
  body: '',
  status: 'draft',
  scheduled_at: '',
  schedule_type: 'now',
}

function estimateRecipients(audience, members) {
  if (!members.length) return 0
  if (audience === 'all') return members.length
  if (audience.startsWith('rank:')) {
    const ranks = audience.replace('rank:', '').split(',')
    return members.filter(m => ranks.includes(m.rank)).length
  }
  if (audience === 'status:active') return members.filter(m => m.status === 'active').length
  if (audience === 'joined:last_14_days') return Math.max(1, Math.floor(members.length * 0.06))
  if (audience === 'joined:last_30_days') return Math.max(1, Math.floor(members.length * 0.12))
  if (audience === 'inactive:30_days') return Math.max(1, Math.floor(members.length * 0.15))
  if (audience === 'inactive:60_days') return Math.max(1, Math.floor(members.length * 0.1))
  if (audience === 'status:paused_autoship') return Math.max(1, Math.floor(members.length * 0.09))
  return members.length
}

export default function Campaigns() {
  const [campaigns, setCampaigns]   = useState([])
  const [members, setMembers]       = useState([])
  const [templates, setTemplates]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [statusTab, setStatusTab]   = useState('all')
  const [search, setSearch]         = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [showConfirmSend, setShowConfirmSend] = useState(null)
  const [showConfirmCancel, setShowConfirmCancel] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [sending, setSending]       = useState(false)
  const [formError, setFormError]   = useState('')

  useEffect(() => {
    Promise.all([
      getEmailCampaigns(),
      getAdminMembers().catch(() => []),
      getEmailTemplates().catch(() => []),
    ]).then(([c, m, t]) => {
      setCampaigns(c)
      setMembers(m)
      setTemplates(t)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    let list = campaigns
    if (statusTab !== 'all') list = list.filter(c => c.status === statusTab)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
    }
    return list
  }, [campaigns, statusTab, search])

  const kpi = useMemo(() => {
    const sent      = campaigns.filter(c => c.status === 'sent')
    const scheduled = campaigns.filter(c => c.status === 'scheduled')
    const totalDelivered = sent.reduce((s, c) => s + (c.stats?.delivered || 0), 0)
    const totalOpened    = sent.reduce((s, c) => s + (c.stats?.opened    || 0), 0)
    const totalClicked   = sent.reduce((s, c) => s + (c.stats?.clicked   || 0), 0)
    return {
      total:      campaigns.length,
      sent:       sent.length,
      scheduled:  scheduled.length,
      avgOpen:    totalDelivered ? pct(totalOpened, totalDelivered) : '—',
      avgClick:   totalOpened   ? pct(totalClicked, totalOpened)   : '—',
      totalEmails: totalDelivered,
    }
  }, [campaigns])

  function setField(k, v) {
    setForm(f => {
      const updated = { ...f, [k]: v }
      if (k === 'audience') updated.recipient_count = estimateRecipients(v, members)
      return updated
    })
  }

  function openCompose(prefill = null) {
    setForm(prefill || { ...EMPTY_FORM, recipient_count: estimateRecipients('all', members) })
    setFormError('')
    setShowCompose(true)
  }

  async function handleDuplicate(campaign) {
    try {
      const copy = await duplicateEmailCampaign(campaign.id)
      setCampaigns(prev => [copy, ...prev])
    } catch {}
  }

  async function handleSave(sendNow) {
    if (!form.name.trim()) { setFormError('Campaign name is required'); return }
    if (!form.subject.trim()) { setFormError('Subject line is required'); return }
    if (!form.body.trim()) { setFormError('Email body is required'); return }
    if (form.schedule_type === 'later' && !form.scheduled_at) { setFormError('Scheduled date/time is required'); return }

    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: form.name,
        subject: form.subject,
        audience: form.audience,
        audience_label: AUDIENCE_OPTIONS.find(a => a.value === form.audience)?.label || form.audience,
        recipient_count: form.recipient_count,
        body: form.body,
        status: sendNow ? 'sent' : (form.schedule_type === 'later' ? 'scheduled' : 'draft'),
        scheduled_at: form.schedule_type === 'later' ? new Date(form.scheduled_at).toISOString() : null,
      }
      const created = await createEmailCampaign(payload)
      setCampaigns(prev => [created, ...prev])
      setShowCompose(false)
    } catch (e) {
      setFormError(e.message || 'Failed to save campaign')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendNow(campaign) {
    setSending(true)
    try {
      const updated = await sendEmailCampaignNow(campaign.id)
      setCampaigns(prev => prev.map(c => c.id === updated.id ? updated : c))
      setShowConfirmSend(null)
    } catch {} finally {
      setSending(false)
    }
  }

  async function handleCancel(campaign) {
    try {
      await cancelEmailCampaign(campaign.id)
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'cancelled', scheduled_at: null } : c))
      setShowConfirmCancel(null)
    } catch {}
  }

  const estRecipients = useMemo(() => estimateRecipients(form.audience, members), [form.audience, members])

  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, color: 'var(--gold)' }}>📧 Email Campaigns</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
              Create and send targeted email blasts to member segments
            </p>
          </div>
          <button
            onClick={() => openCompose()}
            style={{ background: 'var(--gold)', color: '#0a0e1a', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
          >
            + New Campaign
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Campaigns', value: kpi.total },
            { label: 'Sent',            value: kpi.sent },
            { label: 'Scheduled',       value: kpi.scheduled },
            { label: 'Emails Delivered',value: kpi.totalEmails.toLocaleString() },
            { label: 'Avg Open Rate',   value: kpi.avgOpen },
            { label: 'Avg Click Rate',  value: kpi.avgClick },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {STATUS_TABS.map(s => (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, border: '1px solid var(--border)',
                  background: statusTab === s ? 'var(--gold)' : 'var(--navy2)',
                  color: statusTab === s ? '#0a0e1a' : 'var(--text2)',
                  cursor: 'pointer', fontWeight: statusTab === s ? 700 : 400, textTransform: 'capitalize',
                }}
              >{s}</button>
            ))}
          </div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaigns…"
            style={{ marginLeft: 'auto', padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--text)', fontSize: 13, minWidth: 220 }}
          />
        </div>

        {/* Campaign table */}
        <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading campaigns…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No campaigns found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text2)', fontSize: 11, textTransform: 'uppercase' }}>
                  {['Campaign', 'Audience', 'Status', 'Delivered', 'Open Rate', 'Click Rate', 'Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const badge = STATUS_BADGE[c.status] || STATUS_BADGE.draft
                  const delivered = c.stats?.delivered || 0
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{c.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.subject}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: 12 }}>{c.audience_label}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: badge.bg, color: badge.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)' }}>
                        {c.stats ? `${delivered.toLocaleString()} / ${c.recipient_count}` : c.recipient_count}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {c.stats ? (
                          <span style={{ color: '#4ade80', fontWeight: 600 }}>{pct(c.stats.opened, delivered)}</span>
                        ) : <span style={{ color: 'var(--text2)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {c.stats ? (
                          <span style={{ color: '#60a5fa', fontWeight: 600 }}>{pct(c.stats.clicked, c.stats.opened)}</span>
                        ) : <span style={{ color: 'var(--text2)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text2)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {c.status === 'scheduled' ? `⏰ ${fmt(c.scheduled_at)}` : fmt(c.sent_at || c.created_at)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => setShowPreview(c)} style={btnStyle('#1e3a5f', '#60a5fa')}>Preview</button>
                          {(c.status === 'draft' || c.status === 'scheduled') && (
                            <button onClick={() => setShowConfirmSend(c)} style={btnStyle('#14532d', '#4ade80')}>Send Now</button>
                          )}
                          {c.status === 'scheduled' && (
                            <button onClick={() => setShowConfirmCancel(c)} style={btnStyle('#3f1d1d', '#f87171')}>Cancel</button>
                          )}
                          <button onClick={() => handleDuplicate(c)} style={btnStyle('#2d1f5e', '#a78bfa')}>Duplicate</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Compose modal */}
      {showCompose && (
        <div style={overlayStyle} onClick={() => setShowCompose(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: 'var(--gold)' }}>New Campaign</h2>
              <button onClick={() => setShowCompose(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gap: 14 }}>
              <label style={labelStyle}>
                Campaign name
                <input
                  value={form.name}
                  onChange={e => setField('name', e.target.value)}
                  placeholder="e.g. August Rank Challenge"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Subject line
                <input
                  value={form.subject}
                  onChange={e => setField('subject', e.target.value)}
                  placeholder="e.g. 🏅 Your August mission starts now"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Audience
                <select value={form.audience} onChange={e => setField('audience', e.target.value)} style={inputStyle}>
                  {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <span style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4 }}>
                  Estimated recipients: ~{estRecipients}
                </span>
              </label>

              {templates.length > 0 && (
                <label style={labelStyle}>
                  Load from template (optional)
                  <select
                    defaultValue=""
                    onChange={e => {
                      const t = templates.find(x => x.id === e.target.value)
                      if (t) { setField('subject', t.subject); setField('body', t.body) }
                    }}
                    style={inputStyle}
                  >
                    <option value="">— choose template —</option>
                    {templates.filter(t => t.active).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>
              )}

              <label style={labelStyle}>
                Email body
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                  Use {'{{member_name}}'} for personalisation
                </div>
                <textarea
                  value={form.body}
                  onChange={e => setField('body', e.target.value)}
                  rows={10}
                  placeholder="Write your email here…"
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 }}
                />
              </label>

              <label style={labelStyle}>
                Schedule
                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  {['now', 'later', 'draft'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>
                      <input type="radio" name="schedule_type" value={s} checked={form.schedule_type === s} onChange={() => setField('schedule_type', s)} />
                      {s === 'now' ? 'Send now' : s === 'later' ? 'Schedule for later' : 'Save as draft'}
                    </label>
                  ))}
                </div>
                {form.schedule_type === 'later' && (
                  <input
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={e => setField('scheduled_at', e.target.value)}
                    style={{ ...inputStyle, marginTop: 10 }}
                  />
                )}
              </label>

              {formError && <div style={{ color: '#f87171', fontSize: 13 }}>{formError}</div>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCompose(false)} style={btnStyle('var(--navy3)', 'var(--text2)')}>Cancel</button>
                <button
                  onClick={() => handleSave(form.schedule_type === 'now')}
                  disabled={saving}
                  style={{ ...btnStyle('#14532d', '#4ade80'), padding: '8px 18px', fontWeight: 700 }}
                >
                  {saving ? 'Saving…' : form.schedule_type === 'now' ? 'Send Now' : form.schedule_type === 'later' ? 'Schedule' : 'Save Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div style={overlayStyle} onClick={() => setShowPreview(null)}>
          <div style={{ ...modalStyle, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, color: 'var(--gold)' }}>Campaign Preview</h2>
              <button onClick={() => setShowPreview(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'var(--navy3)', borderRadius: 8, padding: 16, marginBottom: 14, fontSize: 13 }}>
              <div style={{ color: 'var(--text2)', marginBottom: 4 }}>To: <span style={{ color: 'var(--text)' }}>{showPreview.audience_label} ({showPreview.recipient_count} recipients)</span></div>
              <div style={{ color: 'var(--text2)' }}>Subject: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{showPreview.subject.replace('{{member_name}}', 'Lars Nielsen')}</span></div>
            </div>
            <div style={{ background: '#fff', color: '#111', borderRadius: 8, padding: '20px 24px', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {showPreview.body.replace(/\{\{member_name\}\}/g, 'Lars Nielsen').replace(/\{\{member_id\}\}/g, 'NV-001234')}
            </div>
            {showPreview.stats && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Delivered', value: showPreview.stats.delivered },
                  { label: 'Opened',    value: `${showPreview.stats.opened} (${pct(showPreview.stats.opened, showPreview.stats.delivered)})` },
                  { label: 'Clicked',   value: `${showPreview.stats.clicked} (${pct(showPreview.stats.clicked, showPreview.stats.opened)})` },
                  { label: 'Unsubs',    value: showPreview.stats.unsubscribed },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--navy3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm send modal */}
      {showConfirmSend && (
        <div style={overlayStyle} onClick={() => setShowConfirmSend(null)}>
          <div style={{ ...modalStyle, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, color: 'var(--gold)' }}>Send Campaign Now?</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '0 0 16px' }}>
              This will immediately send <strong style={{ color: 'var(--text)' }}>{showConfirmSend.name}</strong> to
              approximately <strong style={{ color: 'var(--text)' }}>{showConfirmSend.recipient_count}</strong> recipients
              and cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmSend(null)} style={btnStyle('var(--navy3)', 'var(--text2)')}>Cancel</button>
              <button
                onClick={() => handleSendNow(showConfirmSend)}
                disabled={sending}
                style={{ ...btnStyle('#14532d', '#4ade80'), fontWeight: 700 }}
              >
                {sending ? 'Sending…' : 'Confirm — Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm cancel modal */}
      {showConfirmCancel && (
        <div style={overlayStyle} onClick={() => setShowConfirmCancel(null)}>
          <div style={{ ...modalStyle, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 12px', fontSize: 17, color: '#f87171' }}>Cancel Scheduled Campaign?</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '0 0 16px' }}>
              <strong style={{ color: 'var(--text)' }}>{showConfirmCancel.name}</strong> scheduled for{' '}
              <strong style={{ color: 'var(--text)' }}>{fmt(showConfirmCancel.scheduled_at)}</strong> will be cancelled.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowConfirmCancel(null)} style={btnStyle('var(--navy3)', 'var(--text2)')}>Keep Scheduled</button>
              <button onClick={() => handleCancel(showConfirmCancel)} style={{ ...btnStyle('#3f1d1d', '#f87171'), fontWeight: 700 }}>
                Cancel Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function btnStyle(bg, color) {
  return {
    background: bg, color, border: `1px solid ${color}33`, borderRadius: 6,
    padding: '5px 10px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap',
  }
}

const overlayStyle = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
}

const modalStyle = {
  background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14,
  padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
}

const labelStyle = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--text2)' }

const inputStyle = {
  padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--navy3)', color: 'var(--text)', fontSize: 13, outline: 'none',
}
