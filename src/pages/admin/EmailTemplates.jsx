import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getEmailTemplates, updateEmailTemplate, resetEmailTemplate, sendTestEmail } from '../../api/mlmApi'
import { useAuth } from '../../context/AuthContext'

const CATEGORY_LABELS = {
  onboarding: 'Onboarding',
  transaction: 'Transaction',
  rank:        'Rank',
  autoship:    'Autoship',
  auth:        'Auth',
  support:     'Support',
  referral:    'Referral',
}

const CATEGORY_COLORS = {
  onboarding:  '#22c55e',
  transaction: '#3b82f6',
  rank:        '#c9a84c',
  autoship:    '#8b5cf6',
  auth:        '#64748b',
  support:     '#f97316',
  referral:    '#06b6d4',
}

function badge(cat) {
  return (
    <span style={{
      background: CATEGORY_COLORS[cat] + '22',
      color: CATEGORY_COLORS[cat],
      border: `1px solid ${CATEGORY_COLORS[cat]}44`,
      borderRadius: '12px',
      padding: '2px 8px',
      fontSize: '11px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>
      {CATEGORY_LABELS[cat] || cat}
    </span>
  )
}

const SAMPLE_VARS = {
  member_name:    'Lars Eriksen',
  member_id:      'NV-10042',
  rank:           'Silver',
  amount:         '142',
  period:         'Week 30 2026',
  date:           '2026-07-27',
  method:         'Bank Transfer',
  reference:      'WD-20260727-0042',
  reason:         'Bank account details not verified',
  email:          'lars@example.no',
  dashboard_link: 'https://nordic-vitals.vercel.app/dashboard',
  reset_link:     'https://nordic-vitals.vercel.app/reset-password?token=abc123',
  autoship_link:  'https://nordic-vitals.vercel.app/dashboard/autoship',
  ticket_link:    'https://nordic-vitals.vercel.app/dashboard/support/42',
  ticket_id:      '42',
  ticket_subject: 'Question about commission run',
  agent_reply:    'Hi Lars, thanks for reaching out! Your commission for this week will be credited on Friday after the weekly run.',
  product_name:   'Arctic Omega 3',
  quantity:       '2',
  frequency:      'Monthly',
  price:          '598',
  recruit_name:   'Astrid Dahl',
  leg:            'left',
}

function applyVars(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_VARS[key] || `{{${key}}}`)
}

export default function EmailTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch]       = useState('')
  const [editing, setEditing]     = useState(null)
  const [preview, setPreview]     = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [testTarget, setTestTarget]   = useState(null)
  const [testEmail, setTestEmail]     = useState(user?.email || '')
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState(null)
  const [editForm, setEditForm] = useState({ subject: '', body: '', active: true })

  useEffect(() => {
    getEmailTemplates()
      .then(d => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function openEdit(t) {
    setEditForm({ subject: t.subject, body: t.body, active: t.active })
    setEditing(t)
  }

  async function saveEdit() {
    setSaving(true)
    try {
      await updateEmailTemplate(editing.id, editForm)
      setTemplates(prev => prev.map(t => t.id === editing.id
        ? { ...t, ...editForm, lastEditedAt: new Date().toISOString() }
        : t
      ))
      showToast('Template saved.')
      setEditing(null)
    } catch {
      showToast('Save failed.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(t) {
    const next = !t.active
    try {
      await updateEmailTemplate(t.id, { active: next })
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, active: next } : x))
      showToast(next ? 'Template activated.' : 'Template deactivated.')
    } catch {
      showToast('Failed to update.', 'error')
    }
  }

  async function doReset() {
    try {
      await resetEmailTemplate(resetTarget.id)
      const fresh = await getEmailTemplates()
      setTemplates(fresh.templates || [])
      showToast('Template reset to default.')
      setResetTarget(null)
    } catch {
      showToast('Reset failed.', 'error')
    }
  }

  async function doSendTest() {
    if (!testEmail) return
    try {
      const r = await sendTestEmail(testTarget.id, testEmail)
      showToast(r.message || `Test sent to ${testEmail}`)
      setTestTarget(null)
    } catch {
      showToast('Test send failed.', 'error')
    }
  }

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)]

  const visible = templates.filter(t => {
    if (filterCat !== 'all' && t.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
    }
    return true
  })

  const kpiStyle = {
    background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '12px',
    padding: '18px 22px', minWidth: 0,
  }

  const total   = templates.length
  const active  = templates.filter(t => t.active).length
  const totalSent = templates.reduce((s, t) => s + (t.sentCount || 0), 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100 }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cream)', marginBottom: '6px' }}>
          Email Templates
        </h1>
        <p style={{ color: 'var(--text2)', marginBottom: '28px', fontSize: '14px' }}>
          Manage transactional email templates sent to members. Variables like <code style={{ color: 'var(--gold)' }}>{'{{member_name}}'}</code> are substituted at send time.
        </p>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={kpiStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Total Templates</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--cream)' }}>{total}</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Active</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>{active}</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Disabled</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#f87171' }}>{total - active}</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>All-time Sent</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gold)' }}>{totalSent.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search templates…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '8px',
              color: 'var(--cream)', padding: '8px 14px', fontSize: '13px', width: '220px',
            }}
          />
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  border: filterCat === cat ? '1.5px solid var(--gold)' : '1px solid var(--border)',
                  background: filterCat === cat ? 'var(--gold)22' : 'var(--navy2)',
                  color: filterCat === cat ? 'var(--gold)' : 'var(--text2)',
                  cursor: 'pointer',
                }}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Template cards */}
        {loading ? (
          <p style={{ color: 'var(--text2)' }}>Loading templates…</p>
        ) : visible.length === 0 ? (
          <p style={{ color: 'var(--text2)' }}>No templates match your filters.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {visible.map(t => (
              <div
                key={t.id}
                style={{
                  background: 'var(--navy2)', border: `1px solid ${t.active ? 'var(--border)' : '#f8717133'}`,
                  borderRadius: '12px', padding: '18px 22px',
                  opacity: t.active ? 1 : 0.7,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '14px' }}>{t.name}</span>
                      {badge(t.category)}
                      {!t.active && (
                        <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700 }}>DISABLED</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--text)' }}>Subject:</strong> {t.subject}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text2)', flexWrap: 'wrap' }}>
                      <span>Sent: <strong style={{ color: 'var(--text)' }}>{(t.sentCount || 0).toLocaleString()}</strong></span>
                      <span>Last edited: <strong style={{ color: 'var(--text)' }}>{t.lastEditedAt ? t.lastEditedAt.slice(0, 10) : '—'}</strong></span>
                      <span>Variables: <strong style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: '11px' }}>{(t.variables || []).map(v => `{{${v}}}`).join(' ')}</strong></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setPreview(t)}
                      style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => openEdit(t)}
                      style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: 'var(--gold)22', border: '1px solid var(--gold)66', color: 'var(--gold)', cursor: 'pointer' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setTestTarget(t)}
                      style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#3b82f622', border: '1px solid #3b82f666', color: '#93c5fd', cursor: 'pointer' }}
                    >
                      Send Test
                    </button>
                    <button
                      onClick={() => toggleActive(t)}
                      style={{
                        padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        background: t.active ? '#f8717122' : '#22c55e22',
                        border: `1px solid ${t.active ? '#f8717166' : '#22c55e66'}`,
                        color: t.active ? '#fca5a5' : '#86efac',
                      }}
                    >
                      {t.active ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy2)', borderRadius: '16px', padding: '28px', maxWidth: '640px', width: '100%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '16px', marginBottom: '4px' }}>{preview.name}</div>
                {badge(preview.category)}
              </div>
              <button
                onClick={() => setPreview(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >✕</button>
            </div>
            <div style={{ background: 'var(--navy3)', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</span>
              <div style={{ color: 'var(--cream)', fontWeight: 600, marginTop: '4px', fontSize: '14px' }}>{applyVars(preview.subject)}</div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: '8px', padding: '18px', fontFamily: 'monospace', fontSize: '13px', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {applyVars(preview.body)}
            </div>
            <div style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text2)' }}>
              Preview uses sample data. Real emails will use live member data.
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy2)', borderRadius: '16px', padding: '28px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '16px' }}>Edit: {editing.name}</div>
              <button
                onClick={() => setEditing(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              >✕</button>
            </div>

            <div style={{ marginBottom: '10px', fontSize: '12px', color: 'var(--text2)' }}>
              Available variables:{' '}
              {(editing.variables || []).map(v => (
                <code key={v} style={{ background: 'var(--navy3)', color: 'var(--gold)', borderRadius: '4px', padding: '1px 5px', margin: '2px', fontSize: '11px', display: 'inline-block' }}>{`{{${v}}}`}</code>
              ))}
            </div>

            <label style={{ display: 'block', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subject</div>
              <input
                value={editForm.subject}
                onChange={e => setEditForm(f => ({ ...f, subject: e.target.value }))}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--cream)', padding: '10px 14px', fontSize: '14px',
                }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Body</div>
              <textarea
                value={editForm.body}
                onChange={e => setEditForm(f => ({ ...f, body: e.target.value }))}
                rows={14}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px',
                  color: 'var(--cream)', padding: '10px 14px', fontSize: '13px', fontFamily: 'monospace',
                  resize: 'vertical', lineHeight: 1.6,
                }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={e => setEditForm(f => ({ ...f, active: e.target.checked }))}
              />
              <span style={{ color: 'var(--text)', fontSize: '13px' }}>Active (emails will be sent)</span>
            </label>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setResetTarget(editing); setEditing(null) }}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#f8717122', border: '1px solid #f8717144', color: '#fca5a5', cursor: 'pointer' }}
              >
                Reset to Default
              </button>
              <button
                onClick={() => setEditing(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--gold)', border: 'none', color: '#000', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirm Modal */}
      {resetTarget && (
        <div
          onClick={() => setResetTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy2)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', border: '1px solid var(--border)', textAlign: 'center' }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
            <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '16px', marginBottom: '8px' }}>Reset Template?</div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '22px' }}>
              This will discard all edits to <strong style={{ color: 'var(--cream)' }}>{resetTarget.name}</strong> and restore the original subject and body. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setResetTarget(null)}
                style={{ padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={doReset}
                style={{ padding: '9px 22px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#f87171', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Modal */}
      {testTarget && (
        <div
          onClick={() => setTestTarget(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--navy2)', borderRadius: '16px', padding: '28px', maxWidth: '420px', width: '100%', border: '1px solid var(--border)' }}
          >
            <div style={{ fontWeight: 800, color: 'var(--cream)', fontSize: '16px', marginBottom: '6px' }}>Send Test Email</div>
            <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>
              Send a test of <strong style={{ color: 'var(--cream)' }}>{testTarget.name}</strong> with sample data to:
            </p>
            <input
              type="email"
              value={testEmail}
              onChange={e => setTestEmail(e.target.value)}
              placeholder="recipient@example.com"
              style={{
                width: '100%', boxSizing: 'border-box', marginBottom: '18px',
                background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: '8px',
                color: 'var(--cream)', padding: '10px 14px', fontSize: '14px',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setTestTarget(null)}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: 'var(--navy3)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={doSendTest}
                disabled={!testEmail}
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, background: '#3b82f6', border: 'none', color: '#fff', cursor: testEmail ? 'pointer' : 'not-allowed', opacity: testEmail ? 1 : 0.5 }}
              >
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 2000,
          background: toast.type === 'error' ? '#f87171' : '#22c55e',
          color: '#fff', borderRadius: '10px', padding: '12px 20px',
          fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}>
          {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
