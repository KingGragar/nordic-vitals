import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminAbTests, createAbTest, updateAbTest, deleteAbTest } from '../../api/mlmApi'

const TEST_TYPES = [
  { key: 'all',          label: 'All Types' },
  { key: 'landing_page', label: 'Landing Page' },
  { key: 'email_subject',label: 'Email Subject' },
  { key: 'pricing',      label: 'Pricing' },
  { key: 'onboarding',   label: 'Onboarding' },
]

const STATUSES = [
  { key: 'all',       label: 'All Status' },
  { key: 'draft',     label: 'Draft' },
  { key: 'running',   label: 'Running' },
  { key: 'paused',    label: 'Paused' },
  { key: 'completed', label: 'Completed' },
]

const STATUS_STYLE = {
  draft:     { bg: 'var(--navy3)', color: 'var(--text2)',  border: 'var(--border)' },
  running:   { bg: '#052e16',      color: '#86efac',       border: '#166534' },
  paused:    { bg: '#3b2a00',      color: '#fcd34d',       border: '#854d0e' },
  completed: { bg: '#1e3a5f',      color: '#93c5fd',       border: '#1e40af' },
}

const TYPE_LABELS = {
  landing_page:  '🖥️ Landing Page',
  email_subject: '✉️ Email Subject',
  pricing:       '💰 Pricing',
  onboarding:    '🚀 Onboarding',
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function convRate(v) {
  if (!v || !v.impressions) return 0
  return ((v.conversions / v.impressions) * 100).toFixed(1)
}

function calcSignificance(a, b) {
  if (!a.impressions || !b.impressions) return null
  const ra = a.conversions / a.impressions
  const rb = b.conversions / b.impressions
  const lift = ra > 0 ? ((rb - ra) / ra * 100).toFixed(1) : 0
  const totalN = a.impressions + b.impressions
  const significant = Math.abs(rb - ra) > 0.01 && totalN > 500
  return { lift: parseFloat(lift), significant }
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

function VariantBar({ variants, winnerId }) {
  if (!variants?.length) return null
  const maxRate = Math.max(...variants.map(v => +convRate(v)), 0.1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {variants.map(v => {
        const rate = +convRate(v)
        const isWinner = winnerId === v.id
        const pct = (rate / maxRate * 100).toFixed(0)
        return (
          <div key={v.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text2)', marginBottom: '3px' }}>
              <span style={{ color: isWinner ? '#fcd34d' : 'inherit' }}>{isWinner ? '👑 ' : ''}{v.name}</span>
              <span>{rate}% ({v.conversions?.toLocaleString()} / {v.impressions?.toLocaleString()})</span>
            </div>
            <div style={{ background: 'var(--navy3)', borderRadius: '4px', height: '6px' }}>
              <div style={{ background: isWinner ? '#fcd34d' : '#3b82f6', width: `${pct}%`, height: '100%', borderRadius: '4px', transition: 'width 0.4s' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TestCard({ test, onStatusToggle, onDeclareWinner, onDelete, onSelect }) {
  const sig = test.variants.length >= 2 ? calcSignificance(test.variants[0], test.variants[1]) : null
  const totalImpressions = test.variants.reduce((s, v) => s + (v.impressions || 0), 0)
  const totalConversions = test.variants.reduce((s, v) => s + (v.conversions || 0), 0)
  return (
    <div className="card" style={{ marginBottom: '12px', cursor: 'pointer' }} onClick={() => onSelect(test)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: '2px' }}>{test.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{TYPE_LABELS[test.type] || test.type}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <StatusBadge status={test.status} />
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px', fontStyle: 'italic' }}>
        "{test.hypothesis}"
      </div>

      <VariantBar variants={test.variants} winnerId={test.winnerId} />

      <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '11px', color: 'var(--text2)' }}>
        <span>📊 {totalImpressions.toLocaleString()} impressions</span>
        <span>✅ {totalConversions.toLocaleString()} conversions</span>
        {sig && (
          <span style={{ color: sig.significant ? (sig.lift >= 0 ? '#86efac' : '#fca5a5') : 'var(--text2)' }}>
            {sig.lift >= 0 ? '▲' : '▼'} {Math.abs(sig.lift)}% lift {sig.significant ? '(significant)' : '(not significant yet)'}
          </span>
        )}
        <span>Started {fmtDate(test.startedAt)}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
        {test.status === 'running' && (
          <button className="btn-sm" onClick={() => onStatusToggle(test, 'paused')}>⏸ Pause</button>
        )}
        {test.status === 'paused' && (
          <button className="btn-sm" onClick={() => onStatusToggle(test, 'running')}>▶ Resume</button>
        )}
        {test.status === 'draft' && (
          <button className="btn-sm" style={{ background: '#166534', borderColor: '#166534', color: '#86efac' }}
            onClick={() => onStatusToggle(test, 'running')}>🚀 Launch</button>
        )}
        {(test.status === 'running' || test.status === 'paused') && !test.winnerId && (
          <button className="btn-sm" style={{ background: '#3b2a00', borderColor: '#854d0e', color: '#fcd34d' }}
            onClick={() => onDeclareWinner(test)}>👑 Declare Winner</button>
        )}
        {(test.status === 'draft' || test.status === 'completed') && (
          <button className="btn-sm" style={{ background: '#450a0a', borderColor: '#991b1b', color: '#fca5a5' }}
            onClick={() => onDelete(test.id)}>🗑 Delete</button>
        )}
      </div>
    </div>
  )
}

function CreateModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '', type: 'landing_page', hypothesis: '', status: 'draft',
    startedAt: null, endedAt: null,
    variants: [
      { id: 'a', name: 'Control (A)',   split: 50, impressions: 0, conversions: 0 },
      { id: 'b', name: 'Treatment (B)', split: 50, impressions: 0, conversions: 0 },
    ],
  })
  const [saving, setSaving] = useState(false)

  function setVariant(idx, key, val) {
    setForm(f => {
      const v = [...f.variants]
      v[idx] = { ...v[idx], [key]: val }
      return { ...f, variants: v }
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onCreate(form)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '540px', maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Create A/B Test</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Test Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Hero CTA Button Copy" />
          </div>
          <div>
            <label className="form-label">Test Type</label>
            <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {TEST_TYPES.filter(t => t.key !== 'all').map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Hypothesis</label>
            <textarea className="form-input" rows={3} value={form.hypothesis}
              onChange={e => setForm(f => ({ ...f, hypothesis: e.target.value }))}
              placeholder="We believe that... will result in... because..." />
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Variants</div>
            {form.variants.map((v, i) => (
              <div key={v.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '14px' }}>{v.id.toUpperCase()}:</span>
                <input className="form-input" style={{ flex: 1 }} value={v.name}
                  onChange={e => setVariant(i, 'name', e.target.value)} placeholder={`Variant ${v.id.toUpperCase()} name`} />
                <input className="form-input" style={{ width: '70px' }} type="number" min={1} max={99}
                  value={v.split} onChange={e => setVariant(i, 'split', +e.target.value)} />
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>%</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" className="btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-sm" style={{ background: 'var(--gold)', color: '#000', borderColor: 'var(--gold)' }} disabled={saving}>
              {saving ? 'Creating…' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeclareWinnerModal({ test, onClose, onDeclare }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleDeclare() {
    if (!selected) return
    setSaving(true)
    await onDeclare(test.id, selected)
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ width: '480px', maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>👑 Declare Winner — {test.name}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '14px' }}>
          Declaring a winner will complete the test and permanently record the winning variant.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {test.variants.map(v => (
            <label key={v.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 12px',
              border: `1px solid ${selected === v.id ? 'var(--gold)' : 'var(--border)'}`,
              borderRadius: '8px', cursor: 'pointer', background: selected === v.id ? 'rgba(201,168,76,0.08)' : 'transparent' }}>
              <input type="radio" name="winner" value={v.id} checked={selected === v.id} onChange={() => setSelected(v.id)} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{v.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text2)' }}>{convRate(v)}% conversion ({v.conversions} / {v.impressions})</div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-sm" style={{ background: '#fcd34d', color: '#000', borderColor: '#fcd34d' }}
            disabled={!selected || saving} onClick={handleDeclare}>
            {saving ? 'Saving…' : '👑 Declare Winner'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminAbTests() {
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [declareTarget, setDeclareTarget] = useState(null)
  const [selectedTest, setSelectedTest] = useState(null)

  async function load() {
    setLoading(true)
    const data = await getAdminAbTests({ status: statusFilter, type: typeFilter })
    setTests(data.tests || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter, typeFilter])

  async function handleStatusToggle(test, newStatus) {
    const patch = { status: newStatus }
    if (newStatus === 'running' && !test.startedAt) patch.startedAt = new Date().toISOString()
    await updateAbTest(test.id, patch)
    load()
  }

  async function handleDeclareWinner(testId, variantId) {
    await updateAbTest(testId, { status: 'completed', winnerId: variantId, endedAt: new Date().toISOString() })
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this test?')) return
    await deleteAbTest(id)
    load()
  }

  async function handleCreate(data) {
    await createAbTest(data)
    load()
  }

  const running   = tests.filter(t => t.status === 'running').length
  const completed = tests.filter(t => t.status === 'completed').length
  const totalImp  = tests.reduce((s, t) => s + t.variants.reduce((vs, v) => vs + (v.impressions || 0), 0), 0)
  const hasWinner = tests.filter(t => t.winnerId).length

  return (
    <AdminLayout>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 className="page-title">🧪 A/B Test Manager</h1>
          <p className="page-sub">Run controlled experiments on landing pages, email copy, and pricing</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>+ New Test</button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <KpiCard label="Running Tests"   value={running}   color="#86efac" sub="Active right now" />
        <KpiCard label="Total Impressions" value={totalImp.toLocaleString()} sub="Across all tests" />
        <KpiCard label="Completed Tests" value={completed} color="#93c5fd" sub="All time" />
        <KpiCard label="Winners Declared" value={hasWinner} color="#fcd34d" sub="Tests concluded" />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select className="form-input" style={{ maxWidth: '160px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <select className="form-input" style={{ maxWidth: '180px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {TEST_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>Loading tests…</div>
      ) : tests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
          No tests found. <button className="btn-sm" style={{ marginLeft: '8px' }} onClick={() => setShowCreate(true)}>Create your first test</button>
        </div>
      ) : (
        tests.map(t => (
          <TestCard key={t.id} test={t}
            onStatusToggle={handleStatusToggle}
            onDeclareWinner={t => setDeclareTarget(t)}
            onDelete={handleDelete}
            onSelect={setSelectedTest}
          />
        ))
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {declareTarget && (
        <DeclareWinnerModal test={declareTarget} onClose={() => setDeclareTarget(null)} onDeclare={handleDeclareWinner} />
      )}

      {selectedTest && (
        <div className="modal-overlay" onClick={() => setSelectedTest(null)}>
          <div className="modal" style={{ width: '540px', maxWidth: '96vw' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>🧪 {selectedTest.name}</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <StatusBadge status={selectedTest.status} />
              <span className="badge">{TYPE_LABELS[selectedTest.type]}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text2)', margin: '0 0 14px' }}>"{selectedTest.hypothesis}"</p>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', marginBottom: '14px' }}>
              {selectedTest.variants.map(v => {
                const rate = convRate(v)
                const isWinner = selectedTest.winnerId === v.id
                return (
                  <div key={v.id} style={{ marginBottom: '14px', padding: '12px', background: 'var(--navy3)', borderRadius: '8px',
                    border: isWinner ? '1px solid #fcd34d' : '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, color: isWinner ? '#fcd34d' : 'var(--cream)' }}>{isWinner ? '👑 ' : ''}{v.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text2)' }}>Traffic split: {v.split}%</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--cream)' }}>{v.impressions?.toLocaleString()}</div>
                        <div style={{ color: 'var(--text2)' }}>Impressions</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--cream)' }}>{v.conversions?.toLocaleString()}</div>
                        <div style={{ color: 'var(--text2)' }}>Conversions</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', color: rate > 5 ? '#86efac' : 'var(--cream)' }}>{rate}%</div>
                        <div style={{ color: 'var(--text2)' }}>Conv. Rate</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <span>Started: {fmtDate(selectedTest.startedAt)}</span>
              {selectedTest.endedAt && <span>Ended: {fmtDate(selectedTest.endedAt)}</span>}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-sm" onClick={() => setSelectedTest(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
