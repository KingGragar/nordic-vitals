import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getMyAppeals, submitAppeal } from '../../api/mlmApi'

const MLMT = v => `${Number(v).toLocaleString()} MLMT`
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtTime = ts => ts ? new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_CFG = {
  open:              { label: 'Open',           bg: '#1e3a5f', color: '#60a5fa', icon: '🕐' },
  under_review:      { label: 'Under Review',   bg: '#3f2d00', color: '#fbbf24', icon: '🔍' },
  resolved_upheld:   { label: 'Upheld',         bg: '#1a2f1a', color: '#4ade80', icon: '✅' },
  resolved_adjusted: { label: 'Adjusted',       bg: '#2d1a3f', color: '#c084fc', icon: '✏️' },
  resolved_rejected: { label: 'Rejected',       bg: '#3f1d1d', color: '#f87171', icon: '❌' },
}

const CATEGORY_OPTIONS = [
  { value: 'pairing_bonus',    label: 'Pairing Bonus' },
  { value: 'sponsor_bonus',    label: 'Sponsor Bonus' },
  { value: 'level_commission', label: 'Level Commission' },
  { value: 'pool_bonus',       label: 'Pool Bonus' },
  { value: 'other',            label: 'Other' },
]

const RECENT_RUNS = [
  { id: '#041', date: '2026-07-13' },
  { id: '#040', date: '2026-07-06' },
  { id: '#039', date: '2026-07-04' },
  { id: '#038', date: '2026-06-29' },
  { id: '#037', date: '2026-06-22' },
]

const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--navy3)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
const label = { fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5 }

function Badge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open
  return (
    <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function NoteThread({ notes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
      {notes.map((n, i) => (
        <div key={i} style={{
          background: n.role === 'admin' ? 'var(--navy3)' : 'var(--navy)',
          borderRadius: 8, padding: '9px 13px',
          borderLeft: `3px solid ${n.role === 'admin' ? '#c9a84c' : '#60a5fa'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: n.role === 'admin' ? '#c9a84c' : '#60a5fa' }}>
              {n.role === 'admin' ? '🛡️ Nordic Vitals Support' : '👤 You'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtTime(n.ts)}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{n.text}</p>
        </div>
      ))}
    </div>
  )
}

function AppealCard({ appeal, expanded, onToggle }) {
  const cfg = STATUS_CFG[appeal.status] || STATUS_CFG.open
  const diff = appeal.expectedAmount - appeal.disputedAmount

  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'hidden', border: `1px solid var(--navy3)` }}>
      {/* header */}
      <div
        onClick={onToggle}
        style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text2)' }}>{appeal.id}</span>
            <Badge status={appeal.status} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Run {appeal.commissionRunId} · {CATEGORY_OPTIONS.find(c => c.value === appeal.category)?.label || appeal.category}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
            Received: {appeal.disputedAmount > 0 ? MLMT(appeal.disputedAmount) : <span style={{ color: '#f87171' }}>Missing</span>} &nbsp;·&nbsp;
            Expected: <span style={{ color: '#c9a84c' }}>{MLMT(appeal.expectedAmount)}</span> &nbsp;·&nbsp;
            Filed {fmtDate(appeal.filedAt)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {diff > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>−{MLMT(diff)}</span>}
          {appeal.resolution?.correctionAmount > 0 && (
            <span style={{ fontSize: 12, color: '#4ade80' }}>+{MLMT(appeal.resolution.correctionAmount)} correction</span>
          )}
          <span style={{ color: 'var(--text2)', fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* expanded body */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--navy3)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Explanation</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{appeal.explanation}</p>
          </div>

          {appeal.resolution && (
            <div style={{ background: '#1e2d1e', border: '1px solid #4ade80', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Resolution · {appeal.resolution.decision.charAt(0).toUpperCase() + appeal.resolution.decision.slice(1)}
              </div>
              {appeal.resolution.correctionAmount > 0 && (
                <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>
                  Correction payout: {MLMT(appeal.resolution.correctionAmount)}
                </div>
              )}
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{appeal.resolution.note}</p>
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Conversation</div>
            <NoteThread notes={appeal.notes} />
          </div>
        </div>
      )}
    </div>
  )
}

function SubmitModal({ onClose, onSubmitted }) {
  const { user } = useAuth()
  const [runId,    setRunId]    = useState('#041')
  const [category, setCat]      = useState('pairing_bonus')
  const [received, setReceived] = useState('')
  const [expected, setExpected] = useState('')
  const [explain,  setExplain]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit() {
    if (!explain.trim() || explain.trim().length < 40) {
      setError('Please provide a detailed explanation (at least 40 characters).')
      return
    }
    setError('')
    setLoading(true)
    try {
      const run = RECENT_RUNS.find(r => r.id === runId)
      await submitAppeal(user?.userId, {
        commissionRunId: runId,
        commissionRunDate: run?.date,
        category,
        disputedAmount: Number(received) || 0,
        expectedAmount: Number(expected) || 0,
        explanation: explain.trim(),
      })
      onSubmitted()
    } finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'var(--navy2)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>File Commission Appeal</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
          If you believe your commission was calculated incorrectly, submit an appeal. Our team reviews all appeals within 5 business days. Frivolous appeals may affect future eligibility.
        </p>

        <div>
          <label style={label}>Commission Run *</label>
          <select value={runId} onChange={e => setRunId(e.target.value)} style={inp}>
            {RECENT_RUNS.map(r => <option key={r.id} value={r.id}>{r.id} · {r.date}</option>)}
          </select>
        </div>

        <div>
          <label style={label}>Commission Category *</label>
          <select value={category} onChange={e => setCat(e.target.value)} style={inp}>
            {CATEGORY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={label}>Amount Received (MLMT)</label>
            <input type="number" min={0} value={received} onChange={e => setReceived(e.target.value)} style={inp} placeholder="0 if missing" />
          </div>
          <div>
            <label style={label}>Amount Expected (MLMT) *</label>
            <input type="number" min={0} value={expected} onChange={e => setExpected(e.target.value)} style={inp} placeholder="e.g. 1200" />
          </div>
        </div>

        <div>
          <label style={label}>Detailed Explanation * (min 40 characters)</label>
          <textarea
            value={explain}
            onChange={e => setExplain(e.target.value)}
            rows={5}
            placeholder="Explain why you believe the calculation is incorrect. Include your expected calculation method, your leg volumes, recruit counts, or any other relevant details."
            style={{ ...inp, resize: 'vertical' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{explain.length} characters</div>
        </div>

        {error && <div style={{ background: '#3f1d1d', color: '#f87171', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid var(--navy3)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!explain.trim() || loading}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer', opacity: !explain.trim() || loading ? 0.6 : 1 }}
          >
            {loading ? 'Submitting…' : 'Submit Appeal'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashAppeals() {
  const { user } = useAuth()
  const [appeals,   setAppeals]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [expanded,  setExpanded]  = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [success,   setSuccess]   = useState(false)

  async function load() {
    setLoading(true)
    try { setAppeals(await getMyAppeals(user?.userId)) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const open    = appeals.filter(a => a.status === 'open').length
  const review  = appeals.filter(a => a.status === 'under_review').length
  const resolved = appeals.filter(a => a.status.startsWith('resolved_')).length
  const corrections = appeals
    .filter(a => a.resolution?.correctionAmount > 0)
    .reduce((s, a) => s + (a.resolution.correctionAmount || 0), 0)

  async function handleSubmitted() {
    setShowModal(false)
    setSuccess(true)
    await load()
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Commission Appeals</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: 14 }}>Dispute a commission calculation you believe is incorrect.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
        >
          + File New Appeal
        </button>
      </div>

      {/* success banner */}
      {success && (
        <div style={{ background: '#1e2d1e', border: '1px solid #4ade80', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#4ade80', fontSize: 14 }}>
          ✅ Your appeal has been submitted. We'll review it within 5 business days and update you here and by email.
        </div>
      )}

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Open',         value: open,     color: open > 0 ? '#f87171' : 'var(--text1)' },
          { label: 'Under Review', value: review,   color: review > 0 ? '#fbbf24' : 'var(--text1)' },
          { label: 'Resolved',     value: resolved, color: 'var(--text1)' },
          { label: 'Corrections Earned', value: corrections > 0 ? MLMT(corrections) : '0 MLMT', color: corrections > 0 ? '#4ade80' : 'var(--text1)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--navy2)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* how it works */}
      <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)', marginBottom: 10 }}>How Appeals Work</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            ['1', 'File an appeal explaining the discrepancy in your commission.'],
            ['2', 'Our team reviews your case within 5 business days.'],
            ['3', 'You receive a decision: Upheld (correct), Adjusted (corrected), or Rejected (not valid).'],
            ['4', 'If adjusted, a correction payout is issued in the next commission run.'],
          ].map(([num, text]) => (
            <div key={num} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: '1 1 220px' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#c9a84c', color: '#000', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</div>
              <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading appeals…</div>
      ) : appeals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'var(--navy2)', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>⚖️</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No Appeals Filed</div>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
            If you believe a commission was calculated incorrectly, file an appeal.
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer' }}
          >File Your First Appeal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {appeals.map(a => (
            <AppealCard
              key={a.id}
              appeal={a}
              expanded={expanded === a.id}
              onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
            />
          ))}
        </div>
      )}

      {/* policy note */}
      <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--navy2)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--text1)' }}>Appeals Policy:</strong> Appeals must be filed within 30 days of the commission run date. Each appeal is reviewed by the finance team. Decisions are final unless a material error is discovered. This process complies with Forbrukerrådet guidelines and Norwegian consumer law.
      </div>

      {showModal && <SubmitModal onClose={() => setShowModal(false)} onSubmitted={handleSubmitted} />}
    </DashboardLayout>
  )
}
