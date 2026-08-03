import { useState, useEffect, useCallback } from 'react'
import { getGdprRequests, getGdprRequestDetail, processGdprRequest, generateDataExport } from '../../api/mlmApi'

const TYPE_LABELS = {
  erasure:       { label: 'Erasure',       icon: '🗑️', color: '#ef4444' },
  export:        { label: 'Data Export',   icon: '📦', color: '#3b82f6' },
  access:        { label: 'Access',        icon: '👁️', color: '#8b5cf6' },
  rectification: { label: 'Rectification', icon: '✏️', color: '#f59e0b' },
  restriction:   { label: 'Restriction',   icon: '🔒', color: '#ec4899' },
  objection:     { label: 'Objection',     icon: '✋', color: '#6b7280' },
}

const STATUS_CONFIG = {
  pending:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Pending' },
  processing: { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Processing' },
  fulfilled:  { color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  label: 'Fulfilled' },
  denied:     { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: 'Denied' },
  overdue:    { color: '#ef4444', bg: 'rgba(239,68,68,0.15)',  label: 'Overdue' },
}

const DENY_REASONS = [
  { value: 'legitimate_interest',      label: 'Legitimate interest (Art. 6(1)(f))' },
  { value: 'legal_obligation',         label: 'Legal obligation (Art. 6(1)(c))' },
  { value: 'contract_performance',     label: 'Contract performance (Art. 6(1)(b))' },
  { value: 'public_task',              label: 'Public task / vital interests' },
  { value: 'manifestly_unfounded',     label: 'Manifestly unfounded / excessive' },
]

function daysUntilDeadline(deadline, extended) {
  const d = extended || deadline
  const diff = new Date(d) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function DeadlineChip({ deadline, extended, status }) {
  if (status === 'fulfilled' || status === 'denied') return null
  const days = daysUntilDeadline(deadline, extended)
  const color = days < 0 ? '#ef4444' : days <= 5 ? '#f59e0b' : '#22c55e'
  const label = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`
  return (
    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${color}22`, color, border: `1px solid ${color}55`, fontWeight: 600 }}>
      {extended ? '⏰ Extended · ' : ''}{label}
    </span>
  )
}

function TypeBadge({ type }) {
  const cfg = TYPE_LABELS[type] || { label: type, icon: '📋', color: '#6b7280' }
  return (
    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}55`, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: '#6b7280', bg: 'rgba(107,114,128,0.15)', label: status }
  return (
    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}55`, fontWeight: 600 }}>
      {cfg.label}
    </span>
  )
}

export default function GdprRequests() {
  const [all, setAll]           = useState([])
  const [loading, setLoading]   = useState(true)
  const [tabStatus, setTabStatus] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [actionModal, setActionModal] = useState(null)
  const [actionNote, setActionNote]   = useState('')
  const [denyReason, setDenyReason]   = useState('legitimate_interest')
  const [extDate, setExtDate]         = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportResult, setExportResult]   = useState(null)
  const [toastMsg, setToastMsg]           = useState('')

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000) }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try { setAll(await getGdprRequests()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openDetail = async (req) => {
    setSelected(req)
    setDetail(null)
    setExportResult(null)
    setDetailLoading(true)
    try { setDetail(await getGdprRequestDetail(req.id)) } finally { setDetailLoading(false) }
  }

  const filtered = all.filter(r => {
    if (tabStatus !== 'all' && r.status !== tabStatus) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!r.memberName.toLowerCase().includes(q) && !r.memberEmail.toLowerCase().includes(q) && !r.memberId.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false
    }
    return true
  })

  const kpiPending    = all.filter(r => r.status === 'pending').length
  const kpiProcessing = all.filter(r => r.status === 'processing').length
  const kpiOverdue    = all.filter(r => r.status === 'overdue' || (r.status !== 'fulfilled' && r.status !== 'denied' && daysUntilDeadline(r.deadline, r.extendedDeadline) < 0)).length
  const kipFulfilledMonth = all.filter(r => r.status === 'fulfilled' && r.processedAt && new Date(r.processedAt) >= new Date(new Date().setDate(1))).length

  const exportData = async () => {
    if (!detail) return
    setExportLoading(true)
    try {
      const res = await generateDataExport(detail.memberId)
      setExportResult(res)
      const next = { ...detail, auditTrail: [...(detail.auditTrail || []), { ts: new Date().toISOString(), actor: 'Admin', action: `Data export package generated: ${res.fileName} (${res.sizeKb}KB).` }] }
      setDetail(next)
      toast('Data export generated!')
    } catch { toast('Export failed — try again.') }
    finally { setExportLoading(false) }
  }

  const submitAction = async () => {
    if (!actionModal || !detail) return
    setActionLoading(true)
    try {
      const updated = await processGdprRequest(detail.id, {
        action: actionModal,
        adminNote: actionNote || undefined,
        denyReason: actionModal === 'deny' ? denyReason : undefined,
        extendedDeadline: actionModal === 'extend' ? extDate : undefined,
      })
      setDetail(updated)
      setAll(prev => prev.map(r => r.id === updated.id ? updated : r))
      toast(actionModal === 'fulfill' ? 'Request fulfilled ✓' : actionModal === 'deny' ? 'Request denied.' : actionModal === 'extend' ? 'Deadline extended.' : 'Status updated.')
      setActionModal(null)
      setActionNote('')
    } catch (e) { toast(`Error: ${e.message}`) }
    finally { setActionLoading(false) }
  }

  const exportCsv = () => {
    const rows = [['ID','Type','Member','Email','Submitted','Deadline','Status']]
    filtered.forEach(r => rows.push([r.id, r.type, r.memberName, r.memberEmail, r.submittedAt, r.extendedDeadline || r.deadline, r.status]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `gdpr-requests-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const TAB_STATUSES = ['all','pending','processing','fulfilled','denied','overdue']

  return (
    <div style={{ padding: '28px 28px 60px', maxWidth: 1200, margin: '0 auto', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>🛡️ GDPR Data Subject Requests</h1>
        <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: 14 }}>
          Manage member data subject requests per GDPR Art. 12–22. Respond within 30 days (extensible to 90 for complex cases).
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 26 }}>
        {[
          { label: 'Total Requests', value: all.length, color: '#c9a84c' },
          { label: 'Pending',        value: kpiPending,    color: '#f59e0b' },
          { label: 'Processing',     value: kpiProcessing, color: '#3b82f6' },
          { label: 'Overdue',        value: kpiOverdue,    color: '#ef4444' },
          { label: 'Fulfilled (MTD)',value: kipFulfilledMonth, color: '#22c55e' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* GDPR Deadline Notice */}
      {kpiOverdue > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>⚠️</span>
          <div>
            <strong style={{ color: '#ef4444' }}>Action Required:</strong>
            <span style={{ color: 'var(--text)', fontSize: 14 }}> {kpiOverdue} request{kpiOverdue > 1 ? 's are' : ' is'} overdue. GDPR Art. 12 requires response within 30 days. Non-compliance may attract Datatilsynet fines up to €20M / 4% global turnover.</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
          {TAB_STATUSES.map(s => (
            <button key={s} onClick={() => setTabStatus(s)} style={{ padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tabStatus === s ? 'var(--gold)' : 'var(--navy3)', color: tabStatus === s ? '#000' : 'var(--muted)' }}>
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
              {s !== 'all' && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>({all.filter(r => r.status === s).length})</span>}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member, email, ID…" style={{ flex: 1, minWidth: 200, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14 }} />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14 }}>
            <option value="all">All Types</option>
            {Object.entries(TYPE_LABELS).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
          </select>
          <button onClick={exportCsv} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>📥 CSV</button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: 'var(--navy3)' }}>
                {['ID','Type','Member','Submitted','Deadline','Status','Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No requests found.</td></tr>
              ) : filtered.map(req => {
                const days = daysUntilDeadline(req.deadline, req.extendedDeadline)
                const isUrgent = req.status !== 'fulfilled' && req.status !== 'denied' && days < 5
                return (
                  <tr key={req.id} style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', background: isUrgent ? 'rgba(239,68,68,0.05)' : 'transparent' }}
                    onClick={() => openDetail(req)}>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{req.id}</td>
                    <td style={{ padding: '10px 14px' }}><TypeBadge type={req.type} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{req.memberName}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{req.memberEmail} · {req.memberId}</div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--muted)', whiteSpace: 'nowrap', fontSize: 12 }}>{new Date(req.submittedAt).toLocaleDateString('nb-NO')}</td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(req.extendedDeadline || req.deadline).toLocaleDateString('nb-NO')}</div>
                      <DeadlineChip deadline={req.deadline} extended={req.extendedDeadline} status={req.status} />
                    </td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={req.status} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={e => { e.stopPropagation(); openDetail(req) }} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Review →</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selected && (
        <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, background: 'var(--navy2)', borderLeft: '1px solid var(--border)', zIndex: 900, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12, position: 'sticky', top: 0, background: 'var(--navy2)', zIndex: 1 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <TypeBadge type={selected.type} />
                <StatusBadge status={detail?.status || selected.status} />
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--muted)' }}>{selected.id}</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>{selected.memberName}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{selected.memberEmail} · {selected.memberId}</div>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22 }}>✕</button>
          </div>

          <div style={{ padding: '20px 24px', flex: 1 }}>
            {detailLoading || !detail ? (
              <div style={{ color: 'var(--muted)', textAlign: 'center', padding: 40 }}>Loading…</div>
            ) : (
              <>
                {/* Deadline / urgency */}
                <div style={{ background: 'var(--navy3)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Submitted</div>
                      <div style={{ fontSize: 13 }}>{new Date(detail.submittedAt).toLocaleString('nb-NO')}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>GDPR Deadline</div>
                      <div style={{ fontSize: 13 }}>
                        {new Date(detail.extendedDeadline || detail.deadline).toLocaleString('nb-NO')}
                        {detail.extendedDeadline && <span style={{ fontSize: 11, color: '#f59e0b', marginLeft: 6 }}>(extended)</span>}
                      </div>
                    </div>
                    <div>
                      <DeadlineChip deadline={detail.deadline} extended={detail.extendedDeadline} status={detail.status} />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Member Statement</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, background: 'var(--navy3)', padding: '12px 14px', borderRadius: 8 }}>{detail.description}</div>
                </div>

                {/* Admin Note */}
                {detail.adminNote && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Admin Note</div>
                    <div style={{ fontSize: 14, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', padding: '10px 14px', borderRadius: 8 }}>{detail.adminNote}</div>
                  </div>
                )}

                {/* Deny reason */}
                {detail.denyReason && (
                  <div style={{ marginBottom: 20, background: 'rgba(107,114,128,0.1)', border: '1px solid rgba(107,114,128,0.3)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>Denial Basis</div>
                    <div style={{ fontSize: 13 }}>{DENY_REASONS.find(d => d.value === detail.denyReason)?.label || detail.denyReason}</div>
                  </div>
                )}

                {/* Data Export Result */}
                {exportResult && (
                  <div style={{ marginBottom: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e', marginBottom: 4 }}>✓ Data Export Ready</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{exportResult.fileName} · {exportResult.sizeKb}KB</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Generated {new Date(exportResult.generatedAt).toLocaleTimeString('nb-NO')} — send to member email manually.</div>
                  </div>
                )}

                {/* Action Buttons */}
                {(detail.status === 'pending' || detail.status === 'processing') && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Actions</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {detail.status === 'pending' && (
                        <button onClick={() => { setActionModal('start_processing'); setActionNote('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #3b82f6', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>▶ Start Processing</button>
                      )}
                      {detail.type === 'export' && (
                        <button onClick={exportData} disabled={exportLoading} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #8b5cf6', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                          {exportLoading ? 'Generating…' : '📦 Generate Export'}
                        </button>
                      )}
                      <button onClick={() => { setActionModal('fulfill'); setActionNote('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #22c55e', background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✓ Mark Fulfilled</button>
                      <button onClick={() => { setActionModal('extend'); setActionNote(''); setExtDate('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>⏰ Extend Deadline</button>
                      <button onClick={() => { setActionModal('deny'); setActionNote('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy3)', color: 'var(--muted)', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>✗ Deny Request</button>
                    </div>
                  </div>
                )}

                {/* Audit Trail */}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Audit Trail</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(detail.auditTrail || []).map((entry, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: entry.actor === 'system' ? '#6b7280' : entry.actor === 'Admin' ? '#c9a84c' : '#3b82f6', flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1 }}>
                          <span style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(entry.ts).toLocaleString('nb-NO')} · <strong style={{ color: entry.actor === 'Admin' ? '#c9a84c' : 'var(--muted)' }}>{entry.actor}</strong></span>
                          <div>{entry.action}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Backdrop for drawer */}
      {selected && <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 899 }} />}

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '90vw' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>
              {actionModal === 'fulfill' ? '✓ Mark Request Fulfilled' : actionModal === 'deny' ? '✗ Deny Request' : actionModal === 'extend' ? '⏰ Extend Deadline' : '▶ Start Processing'}
            </h3>

            {actionModal === 'deny' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Legal Basis for Denial</label>
                <select value={denyReason} onChange={e => setDenyReason(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', fontSize: 13 }}>
                  {DENY_REASONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
            )}

            {actionModal === 'extend' && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>New Deadline (max 90 days from submission)</label>
                <input type="date" value={extDate} onChange={e => setExtDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Admin Note {actionModal === 'deny' ? '(required — sent to member)' : '(optional)'}</label>
              <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3} placeholder={actionModal === 'deny' ? 'Explain the legal basis to the member…' : 'Add an internal note…'} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--text)', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setActionModal(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--muted)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitAction} disabled={actionLoading || (actionModal === 'deny' && !actionNote) || (actionModal === 'extend' && !extDate)}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: actionModal === 'fulfill' ? '#22c55e' : actionModal === 'deny' ? '#6b7280' : '#c9a84c', color: actionModal === 'fulfill' || actionModal === 'deny' ? '#fff' : '#000', cursor: 'pointer', fontWeight: 600 }}>
                {actionLoading ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e2a3a', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, zIndex: 2000, color: 'var(--text)', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
          {toastMsg}
        </div>
      )}
    </div>
  )
}
