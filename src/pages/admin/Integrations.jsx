import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getIntegrations, saveIntegrations, testArccticoConnection,
  getWebhooks, createWebhook, updateWebhook, deleteWebhook, pingWebhook, getWebhookLog,
} from '../../api/mlmApi'

const ALL_EVENTS = [
  { id: 'new_member',           label: 'New Member Signup' },
  { id: 'rank_change',          label: 'Rank Change' },
  { id: 'commission_run',       label: 'Commission Run Complete' },
  { id: 'withdrawal_request',   label: 'Withdrawal Request' },
  { id: 'withdrawal_processed', label: 'Withdrawal Processed' },
  { id: 'order_placed',         label: 'Order Placed' },
  { id: 'autoship_renewal',     label: 'Autoship Renewal' },
  { id: 'support_ticket',       label: 'Support Ticket Created' },
]

function Toast({ message, type = 'success', onClose }) {
  return (
    <div
      className="toast"
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: type === 'error' ? '#7f1d1d' : undefined,
        borderColor: type === 'error' ? '#ef4444' : undefined,
      }}
    >
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function StatusBadge({ status, small }) {
  const map = {
    connected: { bg: '#14532d', color: '#4ade80', text: '✓ Connected' },
    error:     { bg: '#7f1d1d', color: '#f87171', text: '✗ Error' },
    untested:  { bg: 'var(--navy3)', color: 'var(--text2)', text: '— Untested' },
    success:   { bg: '#14532d', color: '#4ade80', text: '✓ 2xx' },
  }
  const s = map[status] || map.untested
  return (
    <span style={{
      display: 'inline-block',
      padding: small ? '2px 8px' : '3px 10px',
      borderRadius: '999px',
      background: s.bg,
      color: s.color,
      fontSize: small ? '11px' : '12px',
      fontWeight: 600,
    }}>{s.text}</span>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)', marginBottom: '18px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function FieldRow({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px' }}>
      <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)' }}>{label}</label>
      {hint && <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '2px' }}>{hint}</div>}
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', mono }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--navy3)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '8px 10px',
        color: 'var(--cream)',
        fontSize: mono ? '12px' : '13px',
        fontFamily: mono ? 'monospace' : undefined,
        width: '100%',
        boxSizing: 'border-box',
      }}
    />
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <div style={{ position: 'relative', width: '36px', height: '20px', flexShrink: 0 }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: checked ? 'var(--green2)' : 'var(--navy3)',
          borderRadius: '999px',
          border: `1px solid ${checked ? 'var(--green2)' : 'var(--border)'}`,
          transition: 'background 0.2s',
        }} />
        <div style={{
          position: 'absolute', top: '3px', left: checked ? '18px' : '3px',
          width: '12px', height: '12px',
          background: '#fff', borderRadius: '50%', transition: 'left 0.2s',
        }} />
      </div>
    </label>
  )
}

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="card" style={{ maxWidth: '420px', width: '100%' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginBottom: '10px' }}>{title}</h2>
        <p style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.6, marginBottom: '20px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger btn-sm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  )
}

function WebhookModal({ initial, onSave, onClose }) {
  const [label, setLabel]   = useState(initial?.label || '')
  const [url, setUrl]       = useState(initial?.url || '')
  const [secret, setSecret] = useState(initial?.secret || '')
  const [enabled, setEnabled] = useState(initial?.enabled ?? true)
  const [events, setEvents] = useState(initial?.events || [])
  const [saving, setSaving] = useState(false)

  function toggleEvent(id) {
    setEvents(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!url) return
    setSaving(true)
    await onSave({ label: label || url, url, secret, enabled, events })
    setSaving(false)
    onClose()
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px', overflowY: 'auto' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>{initial ? 'Edit Webhook' : 'Add Webhook'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>
        </div>

        <FieldRow label="Label" hint="Friendly name for this endpoint">
          <TextInput value={label} onChange={setLabel} placeholder="e.g. CRM Sync" />
        </FieldRow>
        <FieldRow label="Endpoint URL *" hint="POST requests will be sent here on each event">
          <TextInput value={url} onChange={setUrl} placeholder="https://hooks.example.com/nv" mono />
        </FieldRow>
        <FieldRow label="Signing Secret" hint="Optional HMAC-SHA256 secret for payload verification">
          <TextInput value={secret} onChange={setSecret} placeholder="whsec_…" mono type="password" />
        </FieldRow>

        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--cream)', marginBottom: '8px' }}>Events to send</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {ALL_EVENTS.map(ev => (
              <label key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 8px', borderRadius: '6px', background: events.includes(ev.id) ? 'rgba(201,168,76,0.12)' : 'var(--navy3)', border: `1px solid ${events.includes(ev.id) ? 'var(--gold)' : 'var(--border)'}`, transition: 'all 0.15s' }}>
                <input type="checkbox" checked={events.includes(ev.id)} onChange={() => toggleEvent(ev.id)} style={{ accentColor: 'var(--gold)', width: '14px', height: '14px', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.3 }}>{ev.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Toggle checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          <span style={{ fontSize: '13px', color: 'var(--text)' }}>Enabled</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !url}>
            {saving ? 'Saving…' : 'Save Webhook'}
          </button>
        </div>
      </div>
    </div>
  )
}

function formatTs(ts) {
  if (!ts) return '—'
  try { return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return ts }
}

export default function Integrations() {
  // ── Arctico state ────────────────────────────────────────────────────────────
  const [arUrl, setArUrl]     = useState('')
  const [arKey, setArKey]     = useState('')
  const [arStatus, setArStatus]   = useState('untested')
  const [arMsg, setArMsg]         = useState('')
  const [arTesting, setArTesting] = useState(false)
  const [arSaving, setArSaving]   = useState(false)

  // ── Gateways state ───────────────────────────────────────────────────────────
  const [gw, setGw] = useState({
    stripe: { enabled: false, publishable_key: '', secret_key: '' },
    klarna: { enabled: false, username: '', password: '' },
    vipps:  { enabled: false, client_id: '', client_secret: '' },
  })
  const [gwSaving, setGwSaving] = useState(false)

  // ── Webhooks state ───────────────────────────────────────────────────────────
  const [webhooks, setWebhooks]       = useState([])
  const [showModal, setShowModal]     = useState(false)
  const [editTarget, setEditTarget]   = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [pinging, setPinging]         = useState({})
  const [whLog, setWhLog]             = useState([])
  const [logLoading, setLogLoading]   = useState(true)

  const [toast, setToast]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getIntegrations(), getWebhooks(), getWebhookLog()]).then(([intg, whs, log]) => {
      if (intg) {
        setArUrl(intg.arctico?.base_url || '')
        setArKey(intg.arctico?.api_key || '')
        setArStatus(intg.arctico?.last_status || 'untested')
        if (intg.gateways) setGw(intg.gateways)
      }
      if (whs) setWebhooks(whs)
      if (log) setWhLog(log)
      setLoading(false)
      setLogLoading(false)
    })
  }, [])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Arctico test + save ──────────────────────────────────────────────────────
  async function handleTestArctico() {
    setArTesting(true)
    setArMsg('')
    const res = await testArccticoConnection(arUrl, arKey)
    setArStatus(res.ok ? 'connected' : 'error')
    setArMsg(res.ok ? `Latency: ${res.latency_ms}ms · ${res.version}` : res.error)
    setArTesting(false)
  }

  async function handleSaveArctico() {
    setArSaving(true)
    await saveIntegrations({ arctico: { base_url: arUrl, api_key: arKey, last_status: arStatus } })
    setArSaving(false)
    showToast('Arctico settings saved.')
  }

  // ── Gateways save ────────────────────────────────────────────────────────────
  async function handleSaveGateways() {
    setGwSaving(true)
    await saveIntegrations({ gateways: gw })
    setGwSaving(false)
    showToast('Payment gateway settings saved.')
  }

  function setGwField(name, field, value) {
    setGw(prev => ({ ...prev, [name]: { ...prev[name], [field]: value } }))
  }

  // ── Webhook CRUD ─────────────────────────────────────────────────────────────
  async function handleSaveWebhook(payload) {
    if (editTarget) {
      await updateWebhook(editTarget.id, payload)
      setWebhooks(prev => prev.map(w => w.id === editTarget.id ? { ...w, ...payload } : w))
      showToast('Webhook updated.')
    } else {
      const created = await createWebhook(payload)
      setWebhooks(prev => [...prev, created])
      showToast('Webhook created.')
    }
    setEditTarget(null)
  }

  async function handleDelete() {
    await deleteWebhook(deleteTarget.id)
    setWebhooks(prev => prev.filter(w => w.id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Webhook deleted.')
  }

  async function handlePing(wh) {
    setPinging(p => ({ ...p, [wh.id]: true }))
    const res = await pingWebhook(wh.id)
    setPinging(p => ({ ...p, [wh.id]: false }))
    if (res.ok) {
      showToast(`Ping to "${wh.label}" succeeded (HTTP ${res.http_code}, ${res.duration_ms}ms).`)
    } else {
      showToast(`Ping to "${wh.label}" failed.`, 'error')
    }
  }

  async function handleToggleWebhook(wh) {
    const updated = { ...wh, enabled: !wh.enabled }
    await updateWebhook(wh.id, { enabled: updated.enabled })
    setWebhooks(prev => prev.map(w => w.id === wh.id ? updated : w))
  }

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--cream)' }}>Integrations & Webhooks</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '4px' }}>Connect external services and configure outgoing event webhooks.</p>
        </div>
      </div>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {loading ? (
        <div style={{ color: 'var(--text2)', fontSize: '14px', padding: '40px 0', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {/* ── Arctico API ────────────────────────────────────────────────────── */}
          <SectionCard title="🔌 Arctico API Connection">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FieldRow label="API Base URL" hint="e.g. https://arctico.duckdns.org">
                <TextInput value={arUrl} onChange={setArUrl} placeholder="https://arctico.duckdns.org" mono />
              </FieldRow>
              <FieldRow label="API Key" hint="VITE_MLM_API_KEY — set in Vercel env vars too">
                <TextInput value={arKey} onChange={setArKey} placeholder="arc_live_…" mono type="password" />
              </FieldRow>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
              <StatusBadge status={arStatus} />
              {arMsg && <span style={{ fontSize: '12px', color: arStatus === 'connected' ? '#4ade80' : '#f87171' }}>{arMsg}</span>}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline btn-sm" onClick={handleTestArctico} disabled={arTesting}>
                  {arTesting ? 'Testing…' : '⚡ Test Connection'}
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSaveArctico} disabled={arSaving}>
                  {arSaving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
            <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--gold)' }}>Note:</strong> The API URL and key are also used by the frontend via <code>VITE_MLM_API_URL</code> and <code>VITE_MLM_API_KEY</code> environment variables. Set those in your Vercel project settings for the live app to connect. When <code>VITE_MLM_API_URL</code> is empty the app falls back to mock data automatically.
            </div>
          </SectionCard>

          {/* ── Payment Gateways ──────────────────────────────────────────────── */}
          <SectionCard title="💳 Payment Gateways">
            {[
              { name: 'stripe', label: 'Stripe',  fields: [{ key: 'publishable_key', label: 'Publishable Key', ph: 'pk_live_…' }, { key: 'secret_key', label: 'Secret Key', ph: 'sk_live_…', pw: true }] },
              { name: 'klarna', label: 'Klarna',  fields: [{ key: 'username', label: 'Username', ph: 'K…' }, { key: 'password', label: 'Password', ph: '…', pw: true }] },
              { name: 'vipps',  label: 'Vipps',   fields: [{ key: 'client_id', label: 'Client ID', ph: 'vipps-…' }, { key: 'client_secret', label: 'Client Secret', ph: '…', pw: true }] },
            ].map(gway => (
              <div key={gway.name} style={{ marginBottom: '20px', paddingBottom: '18px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Toggle
                    checked={gw[gway.name]?.enabled || false}
                    onChange={e => setGwField(gway.name, 'enabled', e.target.checked)}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cream)' }}>{gway.label}</span>
                  {gw[gway.name]?.enabled && <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>Active</span>}
                </div>
                {gw[gway.name]?.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', paddingLeft: '44px' }}>
                    {gway.fields.map(f => (
                      <FieldRow key={f.key} label={f.label}>
                        <TextInput
                          value={gw[gway.name][f.key] || ''}
                          onChange={v => setGwField(gway.name, f.key, v)}
                          placeholder={f.ph}
                          type={f.pw ? 'password' : 'text'}
                          mono
                        />
                      </FieldRow>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary btn-sm" onClick={handleSaveGateways} disabled={gwSaving}>
                {gwSaving ? 'Saving…' : 'Save Gateway Settings'}
              </button>
            </div>
          </SectionCard>

          {/* ── Outgoing Webhooks ─────────────────────────────────────────────── */}
          <SectionCard title="📡 Outgoing Webhooks">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <p style={{ color: 'var(--text2)', fontSize: '13px', margin: 0 }}>
                POST events to external endpoints (CRMs, Slack, custom APIs).
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => { setEditTarget(null); setShowModal(true) }}>
                + Add Webhook
              </button>
            </div>

            {webhooks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text2)', fontSize: '13px' }}>
                No webhooks configured yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {webhooks.map(wh => (
                  <div
                    key={wh.id}
                    style={{
                      background: 'var(--navy3)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cream)' }}>{wh.label}</span>
                          {wh.enabled
                            ? <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 600 }}>Enabled</span>
                            : <span style={{ fontSize: '11px', color: 'var(--text2)', fontWeight: 600 }}>Disabled</span>
                          }
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', fontFamily: 'monospace', marginBottom: '6px', wordBreak: 'break-all' }}>{wh.url}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(wh.events || []).map(ev => (
                            <span key={ev} style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '999px', background: 'rgba(201,168,76,0.12)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)' }}>
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: '100px' }}>
                        {wh.last_delivery && (
                          <div style={{ textAlign: 'right' }}>
                            <StatusBadge status={wh.last_delivery.status} small />
                            <div style={{ fontSize: '10px', color: 'var(--text2)', marginTop: '3px' }}>{formatTs(wh.last_delivery.ts)}</div>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Toggle checked={wh.enabled} onChange={() => handleToggleWebhook(wh)} />
                          <button className="btn btn-outline btn-sm" onClick={() => handlePing(wh)} disabled={pinging[wh.id]}>
                            {pinging[wh.id] ? '…' : 'Ping'}
                          </button>
                          <button className="btn btn-outline btn-sm" onClick={() => { setEditTarget(wh); setShowModal(true) }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(wh)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* ── Delivery Log ──────────────────────────────────────────────────── */}
          <SectionCard title="📋 Recent Delivery Log">
            {logLoading ? (
              <div style={{ color: 'var(--text2)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>Loading…</div>
            ) : whLog.length === 0 ? (
              <div style={{ color: 'var(--text2)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>No delivery records yet.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr>
                      {['Webhook', 'Event', 'Timestamp', 'HTTP', 'Duration', 'Status'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text2)', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {whLog.map(row => (
                      <tr key={row.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 10px', color: 'var(--cream)', fontWeight: 600 }}>{row.webhook_label || row.webhook_id}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text2)', fontFamily: 'monospace' }}>{row.event}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{formatTs(row.ts)}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: row.http_code < 300 ? '#4ade80' : '#f87171', fontFamily: 'monospace', fontWeight: 600 }}>{row.http_code}</span>
                        </td>
                        <td style={{ padding: '8px 10px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{row.duration_ms}ms</td>
                        <td style={{ padding: '8px 10px' }}><StatusBadge status={row.status} small /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {showModal && (
        <WebhookModal
          initial={editTarget}
          onSave={handleSaveWebhook}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Webhook"
          message={`Permanently delete "${deleteTarget.label}"? All delivery history for this endpoint will also be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AdminLayout>
  )
}
