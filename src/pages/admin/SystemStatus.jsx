import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getSystemStatus, getIncidentLog, createMaintenanceWindow, resolveIncident } from '../../api/mlmApi'

// ── Styles ────────────────────────────────────────────────────────────────────
const card = {
  background: 'var(--navy2)', borderRadius: 10, padding: '18px 20px',
}
const btnPrimary = {
  padding: '9px 20px', borderRadius: 8, border: 'none',
  background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14,
}
const btnGhost = {
  padding: '7px 14px', borderRadius: 8, border: '1px solid var(--navy3)',
  background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
}
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 7,
  border: '1px solid var(--navy3)', background: 'var(--navy)',
  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
}
const labelSt = {
  fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block', fontWeight: 600,
}

const STATUS_CFG = {
  operational:   { label: 'Operational',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   dot: '#22c55e' },
  degraded:      { label: 'Degraded',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  dot: '#f59e0b' },
  partial_outage:{ label: 'Partial Outage', color: '#f97316', bg: 'rgba(249,115,22,0.12)',  dot: '#f97316' },
  outage:        { label: 'Outage',         color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   dot: '#ef4444' },
  maintenance:   { label: 'Maintenance',    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  dot: '#6366f1' },
}

const INC_CFG = {
  investigating: { label: 'Investigating', color: '#f97316' },
  identified:    { label: 'Identified',    color: '#f59e0b' },
  monitoring:    { label: 'Monitoring',    color: '#6366f1' },
  resolved:      { label: 'Resolved',      color: '#22c55e' },
}

function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.operational
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      color: c.color, background: c.bg, border: `1px solid ${c.color}40`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.dot, display: 'inline-block' }} />
      {c.label}
    </span>
  )
}

function UptimeBar({ history }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 20 }}>
      {history.map((day, i) => (
        <div
          key={i}
          title={`${day.date}: ${day.uptime}%`}
          style={{
            flex: 1, height: '100%', borderRadius: 2,
            background: day.uptime >= 99.9 ? '#22c55e'
              : day.uptime >= 99   ? '#86efac'
              : day.uptime >= 95   ? '#f59e0b'
              : '#ef4444',
          }}
        />
      ))}
    </div>
  )
}

function MetricTile({ label, value, unit, sub, highlight }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: highlight || 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>
        {value}<span style={{ fontSize: 13, marginLeft: 3, fontWeight: 500, color: 'var(--text2)' }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

// ── Modal: Schedule Maintenance ───────────────────────────────────────────────
function MaintenanceModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: '', component: 'API', starts_at: '', ends_at: '', description: '',
  })
  const [saving, setSaving] = useState(false)
  const COMPONENTS = ['Frontend', 'API', 'Database', 'Email Service', 'Webhooks', 'Payment Gateway', 'All Services']

  async function handleSave() {
    if (!form.title || !form.starts_at || !form.ends_at) return
    setSaving(true)
    try { await onSave(form); onClose() }
    finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0009', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--navy2)', borderRadius: 12, padding: '28px 32px', width: 480, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Schedule Maintenance Window</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelSt}>Title</label>
            <input style={inputStyle} placeholder="e.g. Database migration — schema v2" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={labelSt}>Affected Component</label>
            <select style={inputStyle} value={form.component}
              onChange={e => setForm(f => ({ ...f, component: e.target.value }))}>
              {COMPONENTS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>Start</label>
              <input style={inputStyle} type="datetime-local" value={form.starts_at}
                onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelSt}>End</label>
              <input style={inputStyle} type="datetime-local" value={form.ends_at}
                onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={labelSt}>Description (optional)</label>
            <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} placeholder="Brief description for members…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={onClose} style={btnGhost}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !form.title || !form.starts_at || !form.ends_at}
              style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SystemStatus() {
  const [status, setStatus]       = useState(null)
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [maintenanceModal, setMaintenanceModal] = useState(false)
  const [toast, setToast]         = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [s, i] = await Promise.all([getSystemStatus(), getIncidentLog()])
      setStatus(s)
      setIncidents(i)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 30_000)
    return () => clearInterval(interval)
  }, [load])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleResolveBtnClick(incidentId) {
    await resolveIncident(incidentId)
    showToast('Incident marked resolved ✓')
    load(true)
  }

  async function handleMaintSave(form) {
    await createMaintenanceWindow(form)
    showToast('Maintenance window scheduled ✓')
    load(true)
  }

  const overallStatus = status
    ? (status.components.some(c => c.status === 'outage')          ? 'outage'
     : status.components.some(c => c.status === 'partial_outage')  ? 'partial_outage'
     : status.components.some(c => c.status === 'degraded')        ? 'degraded'
     : status.components.some(c => c.status === 'maintenance')     ? 'maintenance'
     : 'operational')
    : 'operational'

  if (loading) return (
    <AdminLayout>
      <div style={{ padding: 40, color: 'var(--text2)', textAlign: 'center' }}>
        Loading system status…
      </div>
    </AdminLayout>
  )

  const cfg = STATUS_CFG[overallStatus]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 960 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🖥️ System Status</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 13 }}>
              Real-time health of all Nordic Vitals platform components.
              {lastRefresh && ` Last refreshed ${lastRefresh.toLocaleTimeString('en-GB')}.`}
              {refreshing && ' Refreshing…'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => load(true)} style={btnGhost} disabled={refreshing}>
              🔄 Refresh
            </button>
            <button onClick={() => setMaintenanceModal(true)} style={btnPrimary}>
              + Schedule Maintenance
            </button>
          </div>
        </div>

        {/* Overall status banner */}
        <div style={{
          background: cfg.bg, border: `1px solid ${cfg.color}40`,
          borderRadius: 12, padding: '18px 24px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 32 }}>
            {overallStatus === 'operational' ? '✅'
             : overallStatus === 'maintenance' ? '🔧'
             : overallStatus === 'degraded' ? '⚠️'
             : '🚨'}
          </span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
              {overallStatus === 'operational'
                ? 'All systems are operating normally.'
                : overallStatus === 'maintenance'
                ? 'Scheduled maintenance is in progress. Some services may be unavailable.'
                : overallStatus === 'degraded'
                ? 'Some services are experiencing degraded performance.'
                : 'A service disruption is in progress. Our team is investigating.'}
            </div>
          </div>
        </div>

        {/* Metrics strip */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
          <MetricTile label="API Response (P50)" value={status.metrics.api_p50_ms} unit="ms" sub="50th percentile latency" />
          <MetricTile label="API Response (P99)" value={status.metrics.api_p99_ms} unit="ms" sub="99th percentile latency"
            highlight={status.metrics.api_p99_ms > 800 ? '#f59e0b' : undefined} />
          <MetricTile label="Error Rate (1h)" value={status.metrics.error_rate_1h} unit="%" sub="HTTP 5xx / total"
            highlight={status.metrics.error_rate_1h > 1 ? '#ef4444' : '#22c55e'} />
          <MetricTile label="Requests / min" value={status.metrics.rpm} unit="rpm" sub="Last 5 minutes" />
          <MetricTile label="Active Sessions" value={status.metrics.active_sessions} unit="" sub="Right now" />
        </div>

        {/* Component grid */}
        <div style={{ ...card, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Component Status</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {status.components.map((comp, i) => (
              <div key={comp.name} style={{
                display: 'flex', alignItems: 'center', gap: 16,
                padding: '14px 0', borderBottom: i < status.components.length - 1 ? '1px solid var(--navy3)' : 'none',
                flexWrap: 'wrap', rowGap: 8,
              }}>
                <div style={{ flex: '0 0 200px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{comp.icon}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{comp.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{comp.description}</div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>
                    90-day uptime · {comp.uptime_90d}%
                  </div>
                  <UptimeBar history={comp.uptime_history} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text2)' }}>
                    {comp.latency_ms != null && <div>{comp.latency_ms}ms</div>}
                    <div>{comp.last_checked}</div>
                  </div>
                  <StatusBadge status={comp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active incidents */}
        {incidents.filter(i => i.status !== 'resolved').length > 0 && (
          <div style={{ ...card, marginBottom: 24, border: '1px solid rgba(239,68,68,0.35)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#ef4444' }}>🚨 Active Incidents</div>
            {incidents.filter(i => i.status !== 'resolved').map(inc => (
              <div key={inc.id} style={{ background: 'var(--navy)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{inc.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                      Affects: <strong>{inc.affected_components.join(', ')}</strong> · Started {inc.started_at}
                    </div>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                      color: INC_CFG[inc.status]?.color, background: `${INC_CFG[inc.status]?.color}18`,
                      border: `1px solid ${INC_CFG[inc.status]?.color}40`,
                    }}>
                      {INC_CFG[inc.status]?.label}
                    </span>
                  </div>
                  <button onClick={() => handleResolveBtnClick(inc.id)} style={{ ...btnGhost, fontSize: 12, padding: '5px 12px' }}>
                    Mark Resolved
                  </button>
                </div>
                {inc.updates && inc.updates.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--navy3)' }}>
                    {inc.updates.map((u, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: 12 }}>
                        <span style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>{u.time}</span>
                        <span>{u.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Maintenance windows */}
        {status.maintenance_windows && status.maintenance_windows.length > 0 && (
          <div style={{ ...card, marginBottom: 24, border: '1px solid rgba(99,102,241,0.35)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#6366f1' }}>🔧 Scheduled Maintenance</div>
            {status.maintenance_windows.map(w => (
              <div key={w.id} style={{ background: 'var(--navy)', borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{w.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Component: <strong>{w.component}</strong> · {w.starts_at} → {w.ends_at}
                </div>
                {w.description && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{w.description}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Incident history */}
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📋 Recent Incident History</div>
          {incidents.length === 0 ? (
            <div style={{ color: 'var(--text2)', fontSize: 13, padding: '12px 0' }}>No incidents recorded.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {incidents.map((inc, i) => (
                <div key={inc.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  padding: '14px 0', borderBottom: i < incidents.length - 1 ? '1px solid var(--navy3)' : 'none',
                  flexWrap: 'wrap', rowGap: 6,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{inc.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      {inc.affected_components.join(', ')} · {inc.started_at}
                      {inc.resolved_at && ` → ${inc.resolved_at}`}
                      {inc.duration_min != null && ` · ${inc.duration_min} min`}
                    </div>
                  </div>
                  <span style={{
                    display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    color: INC_CFG[inc.status]?.color, background: `${INC_CFG[inc.status]?.color}18`,
                    border: `1px solid ${INC_CFG[inc.status]?.color}40`, whiteSpace: 'nowrap', alignSelf: 'center',
                  }}>
                    {INC_CFG[inc.status]?.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uptime summary */}
        <div style={{ ...card, marginTop: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>📊 30-Day Uptime Summary</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {status.components.map(c => (
              <div key={c.name} style={{ flex: 1, minWidth: 160, background: 'var(--navy)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{c.icon} {c.name}</div>
                <div style={{
                  fontSize: 22, fontWeight: 700,
                  color: c.uptime_90d >= 99.9 ? '#22c55e' : c.uptime_90d >= 99 ? '#f59e0b' : '#ef4444',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {c.uptime_90d}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>90-day SLA</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {maintenanceModal && (
        <MaintenanceModal onClose={() => setMaintenanceModal(false)} onSave={handleMaintSave} />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#16a34a', color: '#fff',
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, zIndex: 999,
          boxShadow: '0 4px 12px #0004',
        }}>
          {toast}
        </div>
      )}
    </AdminLayout>
  )
}
