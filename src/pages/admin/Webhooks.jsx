import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import {
  getAdminWebhooks, createWebhook, updateWebhook, deleteWebhook,
  testWebhook, getWebhookDeliveries, retryWebhookDelivery,
} from '../../api/mlmApi'

const ALL_EVENTS = [
  { key: 'member.enrolled',          label: 'Member Enrolled',         group: 'Members' },
  { key: 'member.rank_change',       label: 'Rank Changed',            group: 'Members' },
  { key: 'member.suspended',         label: 'Member Suspended',        group: 'Members' },
  { key: 'commission.run_complete',  label: 'Commission Run Complete', group: 'Commissions' },
  { key: 'commission.payout_processed', label: 'Payout Processed',    group: 'Commissions' },
  { key: 'order.placed',             label: 'Order Placed',            group: 'Orders' },
  { key: 'order.shipped',            label: 'Order Shipped',           group: 'Orders' },
  { key: 'order.cancelled',          label: 'Order Cancelled',         group: 'Orders' },
  { key: 'gift_card.issued',         label: 'Gift Card Issued',        group: 'Commerce' },
  { key: 'subscription.renewed',     label: 'Subscription Renewed',    group: 'Commerce' },
  { key: 'kyc.approved',             label: 'KYC Approved',            group: 'Compliance' },
  { key: 'kyc.rejected',             label: 'KYC Rejected',            group: 'Compliance' },
]

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '22px', color: color || 'var(--cream)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function EventBadge({ eventKey }) {
  const ev = ALL_EVENTS.find(e => e.key === eventKey)
  const groupColors = {
    Members: { bg: '#1e3a5f', color: '#93c5fd' },
    Commissions: { bg: '#3b2a00', color: '#fcd34d' },
    Orders: { bg: '#0d3320', color: '#86efac' },
    Commerce: { bg: '#2a1a40', color: '#c4b5fd' },
    Compliance: { bg: '#3a1a00', color: '#fdba74' },
  }
  const style = groupColors[ev?.group] || { bg: 'var(--navy2)', color: 'var(--text2)' }
  return (
    <span className="badge" style={{ background: style.bg, color: style.color, fontSize: '10px', marginRight: '4px', marginBottom: '4px' }}>
      {ev?.label || eventKey}
    </span>
  )
}

const BLANK_FORM = { url: '', description: '', events: [], secret: '', enabled: true }

function EndpointModal({ mode, initial, onSave, onClose, saving, error }) {
  const [form, setForm] = useState(initial || BLANK_FORM)

  function toggleEvent(key) {
    setForm(f => ({
      ...f,
      events: f.events.includes(key) ? f.events.filter(e => e !== key) : [...f.events, key],
    }))
  }

  const groups = [...new Set(ALL_EVENTS.map(e => e.group))]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '28px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <h3 style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: '20px' }}>
          {mode === 'create' ? 'Add Webhook Endpoint' : 'Edit Webhook Endpoint'}
        </h3>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>Endpoint URL *</label>
          <input className="input" placeholder="https://your-server.com/webhook"
            value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
            style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>Description</label>
          <input className="input" placeholder="e.g. Zapier — member events"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            style={{ width: '100%' }} />
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>Signing Secret</label>
          <input className="input" placeholder="whsec_… (leave blank to auto-generate)"
            value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))}
            style={{ width: '100%' }} />
          <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '4px' }}>
            We sign every payload with HMAC-SHA256. Verify the <code>X-NV-Signature</code> header on your end.
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '10px' }}>Events to Subscribe *</label>
          {groups.map(group => (
            <div key={group} style={{ marginBottom: '12px' }}>
              <div style={{ color: 'var(--text2)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{group}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ALL_EVENTS.filter(e => e.group === group).map(ev => (
                  <label key={ev.key} style={{
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    background: form.events.includes(ev.key) ? 'var(--navy3)' : 'var(--navy)',
                    border: `1px solid ${form.events.includes(ev.key) ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '6px', padding: '5px 10px', fontSize: '12px', color: 'var(--cream)',
                  }}>
                    <input type="checkbox" checked={form.events.includes(ev.key)} onChange={() => toggleEvent(ev.key)}
                      style={{ accentColor: 'var(--gold)' }} />
                    {ev.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))}
              style={{ accentColor: 'var(--gold)', width: '16px', height: '16px' }} />
            <span style={{ color: 'var(--cream)', fontSize: '13px' }}>Endpoint enabled</span>
          </label>
        </div>

        {error && (
          <div style={{ background: '#7f1d1d', color: '#fca5a5', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', marginBottom: '14px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-gold btn-sm" onClick={() => onSave(form)} disabled={saving}>
            {saving ? 'Saving…' : mode === 'create' ? 'Add Endpoint' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EndpointsTab({ endpoints, onRefresh, onToast }) {
  const [modal, setModal] = useState(null) // null | { mode, initial }
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [testing, setTesting] = useState(null)
  const [testResult, setTestResult] = useState({}) // id -> result

  async function handleSave(form) {
    setModalError('')
    if (!form.url.trim()) { setModalError('Endpoint URL is required.'); return }
    if (!form.url.startsWith('http')) { setModalError('URL must start with https://'); return }
    if (form.events.length === 0) { setModalError('Select at least one event.'); return }
    setSaving(true)
    try {
      if (modal.mode === 'create') {
        const secret = form.secret || `whsec_${Math.random().toString(36).slice(2,12)}`
        await createWebhook({ ...form, secret })
        onToast('Webhook endpoint added ✓')
      } else {
        await updateWebhook(modal.initial.id, form)
        onToast('Endpoint updated ✓')
      }
      setModal(null)
      onRefresh()
    } catch (e) {
      setModalError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteWebhook(deleteTarget.id)
      onToast('Endpoint deleted')
      onRefresh()
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  async function handleToggle(ep) {
    await updateWebhook(ep.id, { ...ep, enabled: !ep.enabled })
    onToast(ep.enabled ? 'Endpoint disabled' : 'Endpoint enabled ✓')
    onRefresh()
  }

  async function handleTest(ep) {
    setTesting(ep.id)
    setTestResult(r => ({ ...r, [ep.id]: null }))
    try {
      const res = await testWebhook(ep.id)
      setTestResult(r => ({ ...r, [ep.id]: res }))
      onToast(res.ok ? `Test ping succeeded (${res.durationMs}ms) ✓` : `Test ping failed: ${res.error}`)
    } catch (e) {
      setTestResult(r => ({ ...r, [ep.id]: { ok: false, error: e.message } }))
    } finally {
      setTesting(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button className="btn btn-gold btn-sm" onClick={() => { setModalError(''); setModal({ mode: 'create', initial: null }) }}>
          + Add Endpoint
        </button>
      </div>

      {endpoints.length === 0 ? (
        <div style={{
          background: 'var(--navy2)', border: '1px dashed var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📡</div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '8px' }}>No webhook endpoints configured</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px' }}>
            Add an endpoint to start receiving real-time events from Nordic Vitals.
          </div>
          <button className="btn btn-gold" onClick={() => { setModalError(''); setModal({ mode: 'create', initial: null }) }}>
            + Add First Endpoint
          </button>
        </div>
      ) : endpoints.map(ep => (
        <div key={ep.id} style={{
          background: 'var(--navy2)', border: `1px solid ${ep.enabled ? 'var(--border)' : '#374151'}`,
          borderRadius: '12px', padding: '18px 20px', marginBottom: '12px',
          opacity: ep.enabled ? 1 : 0.65,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ fontSize: '22px', marginTop: '2px' }}>📡</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, color: 'var(--cream)', fontSize: '14px' }}>{ep.description || 'Unnamed endpoint'}</span>
                <span className={`badge ${ep.enabled ? 'badge-green' : ''}`} style={!ep.enabled ? { background: '#374151', color: 'var(--text2)' } : {}}>
                  {ep.enabled ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gold)', fontFamily: 'monospace', marginBottom: '8px', wordBreak: 'break-all' }}>
                {ep.url}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0' }}>
                {ep.events.map(e => <EventBadge key={e} eventKey={e} />)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text2)', marginTop: '6px' }}>
                Secret: <span style={{ fontFamily: 'monospace' }}>{ep.secret.slice(0, 14)}…</span>
                {' · '}Created {fmtDate(ep.createdAt)}
              </div>
              {testResult[ep.id] && (
                <div style={{
                  marginTop: '8px', padding: '6px 10px', borderRadius: '6px', fontSize: '12px',
                  background: testResult[ep.id].ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  color: testResult[ep.id].ok ? '#22c55e' : '#fca5a5',
                  border: `1px solid ${testResult[ep.id].ok ? '#22c55e' : '#ef4444'}`,
                }}>
                  {testResult[ep.id].ok
                    ? `✓ Test ping succeeded · ${testResult[ep.id].durationMs}ms · HTTP ${testResult[ep.id].httpCode}`
                    : `✗ Test failed: ${testResult[ep.id].error}`}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => handleTest(ep)} disabled={testing === ep.id}>
                {testing === ep.id ? 'Testing…' : '⚡ Test'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => handleToggle(ep)}>
                {ep.enabled ? 'Disable' : 'Enable'}
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => { setModalError(''); setModal({ mode: 'edit', initial: ep }) }}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(ep)}>×</button>
            </div>
          </div>
        </div>
      ))}

      {modal && (
        <EndpointModal
          mode={modal.mode}
          initial={modal.initial}
          onSave={handleSave}
          onClose={() => setModal(null)}
          saving={saving}
          error={modalError}
        />
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%' }}>
            <h3 style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '12px' }}>Delete Webhook Endpoint</h3>
            <p style={{ color: 'var(--cream)', fontSize: '14px', marginBottom: '20px' }}>
              Delete <strong>{deleteTarget.description || deleteTarget.url}</strong>? All delivery history for this endpoint will also be removed.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Endpoint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DeliveryLogTab({ endpoints, onToast }) {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterEndpoint, setFilterEndpoint] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [retrying, setRetrying] = useState(null)

  async function load() {
    setLoading(true)
    const ds = await getWebhookDeliveries({ endpointId: filterEndpoint, status: filterStatus })
    setDeliveries(ds)
    setLoading(false)
  }

  useEffect(() => { load() }, [filterEndpoint, filterStatus])

  async function handleRetry(delivery) {
    setRetrying(delivery.id)
    try {
      await retryWebhookDelivery(delivery.id)
      onToast('Delivery retried ✓')
      load()
    } catch (e) {
      onToast(`Retry failed: ${e.message}`)
    } finally {
      setRetrying(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="input" value={filterEndpoint} onChange={e => setFilterEndpoint(e.target.value)} style={{ minWidth: '200px' }}>
          <option value="all">All endpoints</option>
          {endpoints.map(ep => (
            <option key={ep.id} value={ep.id}>{ep.description || ep.url}</option>
          ))}
        </select>
        <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ minWidth: '140px' }}>
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading…</div>
      ) : deliveries.length === 0 ? (
        <div style={{
          background: 'var(--navy2)', border: '1px dashed var(--border)', borderRadius: '12px',
          padding: '48px', textAlign: 'center', color: 'var(--text2)',
        }}>No deliveries found for the selected filters.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Event', 'Endpoint', 'Date / Time', 'Status', 'HTTP', 'Duration', 'Attempt', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <EventBadge eventKey={d.event} />
                  </td>
                  <td style={{ padding: '10px 12px', maxWidth: '180px' }}>
                    <div style={{ color: 'var(--text2)', fontSize: '11px', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.url}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)', whiteSpace: 'nowrap', fontSize: '12px' }}>{fmtDate(d.at)}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className={`badge ${d.status === 'success' ? 'badge-green' : ''}`}
                      style={d.status === 'failed' ? { background: '#7f1d1d', color: '#fca5a5' } : {}}>
                      {d.status === 'success' ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: d.httpCode >= 200 && d.httpCode < 300 ? 'var(--green-ok)' : '#fca5a5', fontFamily: 'monospace', fontSize: '12px' }}>
                    {d.httpCode}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {d.durationMs >= 1000 ? `${(d.durationMs/1000).toFixed(1)}s` : `${d.durationMs}ms`}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: '12px', textAlign: 'center' }}>
                    #{d.attempt || 1}
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    {d.status === 'failed' && (
                      <button className="btn btn-outline btn-sm" style={{ fontSize: '11px', padding: '3px 10px' }}
                        onClick={() => handleRetry(d)} disabled={retrying === d.id}>
                        {retrying === d.id ? '…' : '↩ Retry'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function Webhooks() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('endpoints')
  const [toast, setToast] = useState(null)

  async function load() {
    const d = await getAdminWebhooks()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }

  const endpoints = data?.endpoints || []
  const stats = data?.stats || {}

  return (
    <AdminLayout>
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: 'var(--green2)', color: '#fff', padding: '12px 20px',
          borderRadius: '10px', fontWeight: 600, fontSize: '14px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>{toast}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>Webhook Manager</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px' }}>
            Configure outbound webhooks to notify your integrations of real-time events from Nordic Vitals.
          </p>
        </div>
      </div>

      {/* KPI strip */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px,1fr))', gap: '14px', marginBottom: '28px' }}>
          <KpiCard label="Total Endpoints" value={stats.total ?? 0} sub="Configured" color="var(--gold)" />
          <KpiCard label="Active Endpoints" value={stats.active ?? 0} sub="Receiving events" color="var(--green-ok)" />
          <KpiCard label="Events (24h)" value={stats.events24h ?? 0} sub="Total deliveries" color="var(--cream)" />
          <KpiCard label="Failed (24h)" value={stats.failed24h ?? 0} sub={stats.failed24h > 0 ? 'Needs attention' : 'All healthy'} color={stats.failed24h > 0 ? 'var(--red)' : 'var(--green-ok)'} />
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {[
          { key: 'endpoints', label: '📡 Endpoints' },
          { key: 'deliveries', label: '📋 Delivery Log' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '8px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '13px',
            color: tab === t.key ? 'var(--gold)' : 'var(--text2)',
            borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)', padding: '40px', textAlign: 'center' }}>Loading…</div>
      ) : (
        <>
          {tab === 'endpoints' && <EndpointsTab endpoints={endpoints} onRefresh={load} onToast={showToast} />}
          {tab === 'deliveries' && <DeliveryLogTab endpoints={endpoints} onToast={showToast} />}
        </>
      )}

      {/* Documentation block */}
      {tab === 'endpoints' && !loading && (
        <div style={{
          marginTop: '32px', background: 'var(--navy2)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '20px 24px',
        }}>
          <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: '14px', marginBottom: '12px' }}>📚 Integration Guide</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '16px', fontSize: '13px', color: 'var(--text2)' }}>
            <div>
              <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '4px' }}>Signature Verification</div>
              Every POST includes <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>X-NV-Signature: sha256=&lt;hmac&gt;</code>.
              Compute HMAC-SHA256 of the raw body with your secret and compare using a timing-safe function.
            </div>
            <div>
              <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '4px' }}>Retries</div>
              Failed deliveries are retried up to 3 times with exponential backoff (2s, 8s, 32s). After all retries fail the delivery is marked as permanently failed — use the Delivery Log to retry manually.
            </div>
            <div>
              <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '4px' }}>Payload Format</div>
              <code style={{ background: '#0d1117', padding: '2px 6px', borderRadius: '4px' }}>{'{"event":"member.enrolled","data":{...},"ts":"ISO8601"}'}</code>
              — always return HTTP 200 quickly; process async to avoid timeouts.
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
