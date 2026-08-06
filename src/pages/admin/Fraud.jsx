import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminFraudFlags, updateFraudFlag, getAdminFraudRules, updateFraudRule } from '../../api/mlmApi'

const FLAG_TYPES = [
  { key: 'all',               label: 'All Types' },
  { key: 'duplicate_account', label: 'Duplicate Account' },
  { key: 'referral_abuse',    label: 'Referral Abuse' },
  { key: 'unusual_volume',    label: 'Unusual Volume' },
  { key: 'payment_fraud',     label: 'Payment Fraud' },
  { key: 'suspicious_signup', label: 'Suspicious Signup' },
]

const STATUSES = [
  { key: 'all',          label: 'All Status' },
  { key: 'open',         label: 'Open' },
  { key: 'investigating', label: 'Investigating' },
  { key: 'resolved',     label: 'Resolved' },
  { key: 'dismissed',    label: 'Dismissed' },
]

const SEVERITIES = [
  { key: 'all',      label: 'All Severity' },
  { key: 'critical', label: 'Critical' },
  { key: 'high',     label: 'High' },
  { key: 'medium',   label: 'Medium' },
  { key: 'low',      label: 'Low' },
]

const SEV_STYLE = {
  critical: { bg: '#450a0a', color: '#fca5a5', border: '#991b1b' },
  high:     { bg: '#431407', color: '#fdba74', border: '#9a3412' },
  medium:   { bg: '#3b2a00', color: '#fcd34d', border: '#854d0e' },
  low:      { bg: '#052e16', color: '#86efac', border: '#166534' },
}

const STATUS_STYLE = {
  open:          { bg: '#1e3a5f', color: '#93c5fd', border: '#1e40af' },
  investigating: { bg: '#3b2a00', color: '#fcd34d', border: '#92400e' },
  resolved:      { bg: '#052e16', color: '#86efac', border: '#166534' },
  dismissed:     { bg: 'var(--navy3)', color: 'var(--text2)', border: 'var(--border)' },
}

const TYPE_LABELS = {
  duplicate_account: '👥 Duplicate Account',
  referral_abuse:    '🔗 Referral Abuse',
  unusual_volume:    '📈 Unusual Volume',
  payment_fraud:     '💳 Payment Fraud',
  suspicious_signup: '🚨 Suspicious Signup',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function SevBadge({ sev }) {
  const s = SEV_STYLE[sev] || {}
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize', fontSize: '10px' }}>
      {sev}
    </span>
  )
}

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || {}
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, textTransform: 'capitalize', fontSize: '10px' }}>
      {status}
    </span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value" style={{ fontSize: '22px', color: color || 'var(--cream)' }}>{value}</div>
      {sub && <div className="sub">{sub}</div>}
    </div>
  )
}

function FlagDetailModal({ flag, onClose, onUpdate, saving }) {
  const [status, setStatus]  = useState(flag.status)
  const [notes, setNotes]    = useState(flag.notes || '')

  function handleSave() {
    const resolved = status === 'resolved' || status === 'dismissed'
    onUpdate(flag.id, {
      status,
      notes,
      investigator: 'Admin',
      resolvedAt: resolved ? new Date().toISOString() : null,
    })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: '14px',
        padding: '28px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ color: 'var(--gold)', fontWeight: 700 }}>Flag Details</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <SevBadge sev={flag.severity} />
            <span className="badge" style={{ background: 'var(--navy3)', color: 'var(--cream)', fontSize: '10px' }}>
              {TYPE_LABELS[flag.type] || flag.type}
            </span>
          </div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: '4px' }}>{flag.memberName}</div>
          <div style={{ color: 'var(--text2)', fontSize: '12px', marginBottom: '10px' }}>Member ID: {flag.memberId}</div>
          <div style={{
            background: 'var(--navy)', borderRadius: '8px', padding: '12px',
            color: 'var(--cream)', fontSize: '13px', lineHeight: '1.5',
          }}>{flag.description}</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '3px' }}>Detected</div>
            <div style={{ color: 'var(--cream)', fontSize: '12px' }}>{fmtDate(flag.detectedAt)}</div>
          </div>
          {flag.resolvedAt && (
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '3px' }}>Resolved</div>
              <div style={{ color: 'var(--cream)', fontSize: '12px' }}>{fmtDate(flag.resolvedAt)}</div>
            </div>
          )}
          {flag.investigator && (
            <div>
              <div style={{ color: 'var(--text2)', fontSize: '11px', marginBottom: '3px' }}>Investigator</div>
              <div style={{ color: 'var(--cream)', fontSize: '12px' }}>{flag.investigator}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>Update Status</label>
          <select className="input" value={status} onChange={e => setStatus(e.target.value)} style={{ width: '100%' }}>
            {STATUSES.filter(s => s.key !== 'all').map(s => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', color: 'var(--text2)', fontSize: '11px', marginBottom: '6px' }}>Investigation Notes</label>
          <textarea className="input" rows={4} value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this flag…"
            style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button className="btn-outline" onClick={onClose} disabled={saving}>Close</button>
          <button className="btn" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  )
}

export default function Fraud() {
  const [flags, setFlags]       = useState([])
  const [rules, setRules]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('flags')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [sevFilter, setSevFilter]         = useState('all')
  const [search, setSearch]               = useState('')
  const [selected, setSelected]           = useState(null)
  const [saving, setSaving]               = useState(false)
  const [page, setPage]                   = useState(1)
  const PER_PAGE = 10

  useEffect(() => { load() }, [statusFilter, typeFilter, sevFilter])

  async function load() {
    setLoading(true)
    try {
      const [fRes, rRes] = await Promise.all([
        getAdminFraudFlags({ status: statusFilter, type: typeFilter, severity: sevFilter }),
        getAdminFraudRules(),
      ])
      setFlags(fRes.flags || [])
      setRules(rRes.rules || [])
    } catch {}
    setLoading(false)
    setPage(1)
  }

  async function handleFlagUpdate(id, data) {
    setSaving(true)
    try {
      await updateFraudFlag(id, data)
      await load()
      setSelected(null)
    } catch {}
    setSaving(false)
  }

  async function toggleRule(rule) {
    try {
      await updateFraudRule(rule.id, { enabled: !rule.enabled })
      setRules(r => r.map(x => x.id === rule.id ? { ...x, enabled: !x.enabled } : x))
    } catch {}
  }

  const searched = flags.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return f.memberName.toLowerCase().includes(q) || f.memberId.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
  })

  const totalPages = Math.max(1, Math.ceil(searched.length / PER_PAGE))
  const visible    = searched.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const openFlags     = flags.filter(f => f.status === 'open').length
  const criticalFlags = flags.filter(f => f.severity === 'critical').length
  const resolvedFlags = flags.filter(f => f.status === 'resolved').length
  const rulesActive   = rules.filter(r => r.enabled).length

  return (
    <AdminLayout>
      <div style={{ padding: '28px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontWeight: 700, fontSize: '22px', color: 'var(--cream)', marginBottom: '4px' }}>🛡️ Fraud & Risk Center</h1>
          <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Monitor suspicious activity, investigate flagged accounts, and configure detection rules.</p>
        </div>

        <div className="stat-grid" style={{ marginBottom: '28px' }}>
          <KpiCard label="Open Flags" value={openFlags} color={openFlags > 0 ? '#fdba74' : 'var(--cream)'} sub="require action" />
          <KpiCard label="Critical" value={criticalFlags} color={criticalFlags > 0 ? '#fca5a5' : 'var(--cream)'} sub="highest severity" />
          <KpiCard label="Resolved (all time)" value={resolvedFlags} color="#86efac" />
          <KpiCard label="Active Detection Rules" value={`${rulesActive}/${rules.length}`} color="var(--gold)" />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {[{ key: 'flags', label: '🚨 Flagged Accounts' }, { key: 'rules', label: '⚙️ Detection Rules' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              color: tab === t.key ? 'var(--gold)' : 'var(--text2)',
              borderBottom: tab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              fontWeight: tab === t.key ? 700 : 400, fontSize: '13px',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'flags' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <input className="input" placeholder="Search member, ID, description…" value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                style={{ minWidth: '200px', flex: '2' }} />
              <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ flex: '1', minWidth: '130px' }}>
                {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
              <select className="input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ flex: '1', minWidth: '150px' }}>
                {FLAG_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
              <select className="input" value={sevFilter} onChange={e => setSevFilter(e.target.value)} style={{ flex: '1', minWidth: '120px' }}>
                {SEVERITIES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading flags…</div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text2)' }}>No flags match the current filters.</div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Severity', 'Member', 'Type', 'Description', 'Detected', 'Status', ''].map(h => (
                          <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text2)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map(flag => (
                        <tr key={flag.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                          onClick={() => setSelected(flag)}>
                          <td style={{ padding: '10px' }}><SevBadge sev={flag.severity} /></td>
                          <td style={{ padding: '10px' }}>
                            <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: '13px' }}>{flag.memberName}</div>
                            <div style={{ color: 'var(--text2)', fontSize: '11px' }}>{flag.memberId}</div>
                          </td>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--text2)', fontSize: '11px' }}>{TYPE_LABELS[flag.type] || flag.type}</span>
                          </td>
                          <td style={{ padding: '10px', maxWidth: '260px' }}>
                            <div style={{ color: 'var(--cream)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{flag.description}</div>
                          </td>
                          <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--text2)', fontSize: '12px' }}>{fmtDate(flag.detectedAt)}</span>
                          </td>
                          <td style={{ padding: '10px' }}><StatusBadge status={flag.status} /></td>
                          <td style={{ padding: '10px' }}>
                            <button className="btn-outline" style={{ fontSize: '11px', padding: '4px 10px' }}
                              onClick={e => { e.stopPropagation(); setSelected(flag) }}>Review</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
                    <button className="btn-outline" style={{ padding: '4px 12px' }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
                    <span style={{ color: 'var(--text2)', alignSelf: 'center', fontSize: '12px' }}>{page} / {totalPages}</span>
                    <button className="btn-outline" style={{ padding: '4px 12px' }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next ›</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'rules' && (
          <div>
            <div style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px' }}>
              Automated detection rules. When a trigger fires, the configured action is applied automatically.
              Toggle rules to enable or disable each one.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rules.map(rule => (
                <div key={rule.id} style={{
                  background: 'var(--navy2)', border: `1px solid ${rule.enabled ? 'var(--gold)33' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '16px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
                  opacity: rule.enabled ? 1 : 0.6,
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '3px' }}>{rule.name}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{rule.trigger} · threshold: <strong style={{ color: 'var(--cream)' }}>{rule.threshold}</strong></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="badge" style={{
                      background: rule.action === 'suspend' ? '#450a0a' : '#1e3a5f',
                      color: rule.action === 'suspend' ? '#fca5a5' : '#93c5fd',
                      border: '1px solid transparent', fontSize: '10px', textTransform: 'capitalize',
                    }}>Action: {rule.action}</span>
                    <button onClick={() => toggleRule(rule)} style={{
                      padding: '5px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600,
                      background: rule.enabled ? '#052e16' : 'var(--navy3)',
                      color: rule.enabled ? '#86efac' : 'var(--text2)',
                      border: `1px solid ${rule.enabled ? '#166534' : 'var(--border)'}`,
                    }}>{rule.enabled ? 'Enabled' : 'Disabled'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selected && (
          <FlagDetailModal
            flag={selected}
            onClose={() => setSelected(null)}
            onUpdate={handleFlagUpdate}
            saving={saving}
          />
        )}
      </div>
    </AdminLayout>
  )
}
