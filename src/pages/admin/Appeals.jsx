import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAppealQueue, addAppealNote, resolveAppeal } from '../../api/mlmApi'

const MLMT = v => `${Number(v).toLocaleString()} MLMT`
const fmtDate = ts => ts ? new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmtTime = ts => ts ? new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'

const STATUS_CFG = {
  open:              { label: 'Open',             bg: '#1e3a5f', color: '#60a5fa' },
  under_review:      { label: 'Under Review',     bg: '#3f2d00', color: '#fbbf24' },
  resolved_upheld:   { label: 'Upheld',           bg: '#1a2f1a', color: '#4ade80' },
  resolved_adjusted: { label: 'Adjusted',         bg: '#2d1a3f', color: '#c084fc' },
  resolved_rejected: { label: 'Rejected',         bg: '#3f1d1d', color: '#f87171' },
}

const PRIORITY_CFG = {
  high:   { label: 'High',   color: '#f87171' },
  medium: { label: 'Medium', color: '#fbbf24' },
  low:    { label: 'Low',    color: '#94a3b8' },
}

const CATEGORY_LABELS = {
  pairing_bonus:    'Pairing Bonus',
  sponsor_bonus:    'Sponsor Bonus',
  level_commission: 'Level Commission',
  pool_bonus:       'Pool Bonus',
}

const VERDICT_OPTIONS = [
  { value: 'upheld',   label: 'Uphold — calculation is correct, no change' },
  { value: 'adjusted', label: 'Adjust — issue found, issue correction payout' },
  { value: 'rejected', label: 'Reject — appeal not valid per plan rules' },
]

const card = { background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 160 }
const inp  = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--navy3)', background: 'var(--navy)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
const btn  = (bg, color = '#000') => ({ padding: '9px 18px', borderRadius: 8, border: 'none', background: bg, color, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

function Badge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.open
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    }}>{cfg.label}</span>
  )
}

function PriorityDot({ priority }) {
  const cfg = PRIORITY_CFG[priority] || PRIORITY_CFG.medium
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: cfg.color }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || 'var(--text1)' }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function NoteThread({ notes }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notes.map((n, i) => (
        <div key={i} style={{
          background: n.role === 'admin' ? 'var(--navy3)' : 'var(--navy)',
          border: `1px solid ${n.role === 'admin' ? '#334155' : 'var(--navy3)'}`,
          borderRadius: 8, padding: '10px 14px',
          borderLeft: `3px solid ${n.role === 'admin' ? '#c9a84c' : '#60a5fa'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: n.role === 'admin' ? '#c9a84c' : '#60a5fa' }}>
              {n.author} {n.role === 'admin' ? '(Admin)' : ''}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>{fmtTime(n.ts)}</span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{n.text}</p>
        </div>
      ))}
    </div>
  )
}

function DetailDrawer({ appeal, onClose, onRefresh }) {
  const [note, setNote]         = useState('')
  const [noteLoading, setNL]    = useState(false)
  const [verdict, setVerdict]   = useState('upheld')
  const [adjAmt, setAdjAmt]     = useState('')
  const [corrAmt, setCorrAmt]   = useState('')
  const [resNote, setResNote]   = useState('')
  const [resLoading, setResL]   = useState(false)
  const [showResolve, setShowR] = useState(false)
  const isResolved = appeal.status.startsWith('resolved_')

  async function handleAddNote() {
    if (!note.trim()) return
    setNL(true)
    try { await addAppealNote(appeal.id, note.trim()); setNote(''); onRefresh() }
    finally { setNL(false) }
  }

  async function handleResolve() {
    if (!resNote.trim()) return
    setResL(true)
    try {
      await resolveAppeal(appeal.id, {
        verdict,
        adjustedAmount: verdict === 'adjusted' ? Number(adjAmt) || 0 : null,
        correctionAmount: verdict === 'adjusted' ? Number(corrAmt) || 0 : 0,
        note: resNote.trim(),
      })
      onRefresh()
      onClose()
    } finally { setResL(false) }
  }

  const diff = appeal.expectedAmount - appeal.disputedAmount

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, width: 600,
      background: 'var(--navy2)', borderLeft: '1px solid var(--navy3)',
      zIndex: 1000, overflowY: 'auto', padding: '24px 28px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{appeal.id}</div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{appeal.memberName}</h2>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>{appeal.memberId} · {appeal.memberEmail}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      {/* status + priority */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Badge status={appeal.status} />
        <PriorityDot priority={appeal.priority} />
        <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 'auto' }}>Filed {fmtDate(appeal.filedAt)}</span>
      </div>

      {/* commission info */}
      <div style={{ background: 'var(--navy)', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Commission Details</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
          {[
            ['Run', `${appeal.commissionRunId} (${fmtDate(appeal.commissionRunDate)})`],
            ['Category', CATEGORY_LABELS[appeal.category] || appeal.category],
            ['Amount Received', MLMT(appeal.disputedAmount)],
            ['Amount Expected', MLMT(appeal.expectedAmount)],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{k}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text1)', marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>
        {diff !== 0 && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 7, background: diff > 0 ? '#1a2f1a' : '#3f1d1d', color: diff > 0 ? '#4ade80' : '#f87171', fontSize: 13, fontWeight: 600 }}>
            {diff > 0 ? `Shortfall: ${MLMT(diff)}` : `Overpay claim: ${MLMT(Math.abs(diff))}`}
          </div>
        )}
      </div>

      {/* explanation */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Member Explanation</div>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text)', lineHeight: 1.6, background: 'var(--navy)', padding: '12px 14px', borderRadius: 8, borderLeft: '3px solid #60a5fa' }}>
          {appeal.explanation}
        </p>
      </div>

      {/* resolution summary */}
      {appeal.resolution && (
        <div style={{ background: '#1e2d1e', border: '1px solid #4ade80', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resolution</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginBottom: 8 }}>
            <div><div style={{ fontSize: 11, color: '#86efac' }}>Decision</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)', textTransform: 'capitalize' }}>{appeal.resolution.decision}</div></div>
            {appeal.resolution.correctionAmount > 0 && (
              <div><div style={{ fontSize: 11, color: '#86efac' }}>Correction Payout</div><div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{MLMT(appeal.resolution.correctionAmount)}</div></div>
            )}
            <div><div style={{ fontSize: 11, color: '#86efac' }}>Resolved By</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{appeal.resolution.resolvedBy}</div></div>
            <div><div style={{ fontSize: 11, color: '#86efac' }}>Resolved At</div><div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text1)' }}>{fmtDate(appeal.resolution.resolvedAt)}</div></div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text)' }}>{appeal.resolution.note}</p>
        </div>
      )}

      {/* notes thread */}
      <div>
        <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Thread ({appeal.notes.length})</div>
        <NoteThread notes={appeal.notes} />
      </div>

      {/* add note */}
      {!isResolved && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Add Admin Note</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add an investigation note or request from member…"
            rows={3}
            style={{ ...inp, resize: 'vertical' }}
          />
          <button
            onClick={handleAddNote}
            disabled={!note.trim() || noteLoading}
            style={{ ...btn('#475569', '#fff'), marginTop: 8, opacity: !note.trim() || noteLoading ? 0.5 : 1 }}
          >
            {noteLoading ? 'Saving…' : 'Add Note'}
          </button>
        </div>
      )}

      {/* resolve form */}
      {!isResolved && (
        <div style={{ borderTop: '1px solid var(--navy3)', paddingTop: 16 }}>
          {!showResolve ? (
            <button onClick={() => setShowR(true)} style={btn('#c9a84c')}>Resolve Appeal</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text1)' }}>Resolve Appeal</div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Decision *</label>
                <select value={verdict} onChange={e => setVerdict(e.target.value)} style={inp}>
                  {VERDICT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              {verdict === 'adjusted' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Adjusted Total (MLMT)</label>
                    <input type="number" min={0} value={adjAmt} onChange={e => setAdjAmt(e.target.value)} style={inp} placeholder="e.g. 216" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Correction Payout (MLMT)</label>
                    <input type="number" min={0} value={corrAmt} onChange={e => setCorrAmt(e.target.value)} style={inp} placeholder="e.g. 36" />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Resolution Note (sent to member) *</label>
                <textarea
                  value={resNote}
                  onChange={e => setResNote(e.target.value)}
                  placeholder="Explain the decision clearly. This note is visible to the member."
                  rows={4}
                  style={{ ...inp, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleResolve}
                  disabled={!resNote.trim() || resLoading}
                  style={{ ...btn('#c9a84c'), opacity: !resNote.trim() || resLoading ? 0.5 : 1 }}
                >
                  {resLoading ? 'Resolving…' : 'Confirm Resolution'}
                </button>
                <button onClick={() => setShowR(false)} style={btn('transparent', 'var(--text2)')}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminAppeals() {
  const [appeals, setAppeals]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('all')
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const data = await getAppealQueue({})
      setAppeals(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let rows = appeals
    if (tab !== 'all') {
      if (tab === 'open')          rows = rows.filter(a => a.status === 'open')
      if (tab === 'under_review')  rows = rows.filter(a => a.status === 'under_review')
      if (tab === 'resolved')      rows = rows.filter(a => a.status.startsWith('resolved_'))
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberId.toLowerCase().includes(q) ||
        a.commissionRunId.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    }
    return rows
  }, [appeals, tab, search])

  const kpis = useMemo(() => {
    const open       = appeals.filter(a => a.status === 'open').length
    const review     = appeals.filter(a => a.status === 'under_review').length
    const resolved   = appeals.filter(a => a.status.startsWith('resolved_')).length
    const totalDisp  = appeals.reduce((s, a) => s + (a.expectedAmount - a.disputedAmount), 0)
    const adjusted   = appeals.filter(a => a.status === 'resolved_adjusted').length
    const approvalRate = resolved > 0 ? Math.round((adjusted / resolved) * 100) : 0
    return { open, review, resolved, totalDisp, approvalRate }
  }, [appeals])

  const TABS = [
    { key: 'all',          label: `All (${appeals.length})` },
    { key: 'open',         label: `Open (${kpis.open})` },
    { key: 'under_review', label: `Under Review (${kpis.review})` },
    { key: 'resolved',     label: `Resolved (${kpis.resolved})` },
  ]

  return (
    <AdminLayout>
      <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700 }}>Commission Appeals</h1>
      <p style={{ margin: '0 0 24px', color: 'var(--text2)', fontSize: 14 }}>
        Review and resolve member disputes about commission calculations.
      </p>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <KpiCard label="Open Appeals"    value={kpis.open}   color={kpis.open > 0 ? '#f87171' : 'var(--text1)'} />
        <KpiCard label="Under Review"    value={kpis.review} color={kpis.review > 0 ? '#fbbf24' : 'var(--text1)'} />
        <KpiCard label="Resolved"        value={kpis.resolved} />
        <KpiCard label="Total Disputed"  value={MLMT(kpis.totalDisp)} sub="across all appeals" />
        <KpiCard label="Adjustment Rate" value={`${kpis.approvalRate}%`} sub="of resolved appeals" />
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search member, ID, run…"
          style={{ ...inp, maxWidth: 280 }}
        />
      </div>

      {/* tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--navy3)' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              borderRadius: '6px 6px 0 0', background: tab === t.key ? 'var(--navy2)' : 'transparent',
              color: tab === t.key ? '#c9a84c' : 'var(--text2)',
              borderBottom: tab === t.key ? '2px solid #c9a84c' : '2px solid transparent',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading appeals…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
          No appeals found.
        </div>
      ) : (
        <div style={{ background: 'var(--navy2)', borderRadius: 10, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--navy3)' }}>
                {['ID', 'Member', 'Run', 'Category', 'Received', 'Expected', 'Priority', 'Filed', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{ borderBottom: '1px solid var(--navy3)', cursor: 'pointer' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--navy3)'}
                  onMouseOut={e => e.currentTarget.style.background = ''}
                >
                  <td style={{ padding: '11px 14px', color: 'var(--text2)', fontFamily: 'monospace', fontSize: 12 }}>{a.id}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600 }}>
                    {a.memberName}
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 400 }}>{a.memberId}</div>
                  </td>
                  <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{a.commissionRunId}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{CATEGORY_LABELS[a.category] || a.category}</td>
                  <td style={{ padding: '11px 14px' }}>{a.disputedAmount > 0 ? MLMT(a.disputedAmount) : <span style={{ color: '#f87171' }}>Missing</span>}</td>
                  <td style={{ padding: '11px 14px', color: '#c9a84c' }}>{MLMT(a.expectedAmount)}</td>
                  <td style={{ padding: '11px 14px' }}><PriorityDot priority={a.priority} /></td>
                  <td style={{ padding: '11px 14px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>{fmtDate(a.filedAt)}</td>
                  <td style={{ padding: '11px 14px' }}><Badge status={a.status} /></td>
                  <td style={{ padding: '11px 14px' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(a) }}
                      style={{ ...btn('var(--navy3)', 'var(--text)'), padding: '5px 12px', fontSize: 12 }}
                    >Review →</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* detail drawer */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}
          />
          <DetailDrawer
            appeal={selected}
            onClose={() => setSelected(null)}
            onRefresh={async () => {
              await load()
              const fresh = (await getAppealQueue({})).find(a => a.id === selected.id)
              if (fresh) setSelected(fresh)
            }}
          />
        </>
      )}
    </AdminLayout>
  )
}
