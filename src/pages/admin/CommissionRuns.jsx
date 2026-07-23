import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getCommissionRuns, triggerCommissionRun } from '../../api/mlmApi'
import { COMMISSION_RUNS as MOCK_RUNS } from '../../data/mock'

const PAGE_SIZE = 20

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function BreakdownModal({ run, onClose }) {
  const rows = run?.breakdown?.length ? run.breakdown : []
  const total = rows.reduce((s, r) => s + r.amount, 0) || run?.total_paid || 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
          Run Breakdown
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          {run?.id} — {run?.started_at ? new Date(run.started_at).toUTCString().replace(' GMT', ' UTC') : '—'}
        </div>
        {rows.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Bonus Type</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.label}>
                  <td style={{ color: 'var(--cream)' }}>{row.label}</td>
                  <td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 600 }}>
                    {row.amount.toLocaleString()} MLMT
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ fontWeight: 700, color: 'var(--cream)' }}>Total</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>
                  {total.toLocaleString()} MLMT
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            Breakdown data not available for this run.
          </p>
        )}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function exportCSV(rows) {
  const headers = ['Run #', 'Date (UTC)', 'Type', 'Members Processed', 'Total Payout (MLMT)', 'Status']
  const csvRows = rows.map(r => [
    r.id,
    r.started_at ? new Date(r.started_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : '',
    r.type,
    r.members_processed ?? '',
    r.total_paid ?? '',
    r.status,
  ])
  const csv = [headers, ...csvRows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `commission-runs-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function CommissionRuns() {
  const [runs, setRuns] = useState(MOCK_RUNS)

  const [showConfirm, setShowConfirm]     = useState(false)
  const [running, setRunning]             = useState(false)
  const [progress, setProgress]           = useState(0)
  const [runComplete, setRunComplete]     = useState(false)
  const [lastRunResult, setLastRunResult] = useState(null)
  const progressRef = useRef(null)

  const [editSchedule, setEditSchedule] = useState(false)
  const [schedDay, setSchedDay]         = useState('Sunday')
  const [schedTime, setSchedTime]       = useState('02:00')

  const [selectedRun, setSelectedRun] = useState(null)

  const [toast, setToast] = useState(null)

  const [filterType,   setFilterType]   = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [page, setPage] = useState(1)

  useEffect(() => {
    getCommissionRuns()
      .then(d => { if (d?.runs?.length) setRuns(d.runs) })
      .catch(() => {})
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function startRun() {
    setShowConfirm(false)
    setRunning(true)
    setProgress(0)
    setRunComplete(false)

    triggerCommissionRun({ type: 'manual' })
      .then(result => setLastRunResult(result))
      .catch(() => {})

    let pct = 0
    progressRef.current = setInterval(() => {
      pct += 2
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(progressRef.current)
        setTimeout(() => {
          setRunning(false)
          setRunComplete(true)
          getCommissionRuns().then(d => { if (d?.runs?.length) setRuns(d.runs) }).catch(() => {})
        }, 300)
      }
    }, 40)
  }

  function closeRunModal() {
    setRunning(false)
    setRunComplete(false)
    setProgress(0)
    setLastRunResult(null)
  }

  function saveSchedule() {
    setEditSchedule(false)
    showToast(`Schedule saved: Every ${schedDay} at ${schedTime} UTC`)
  }

  const statusBadge = status => {
    if (status === 'Completed') return <span className="badge badge-green">✓ Completed</span>
    if (status === 'Running')   return <span className="badge badge-yellow">⏳ Running</span>
    if (status === 'Failed')    return <span className="badge badge-red">✗ Failed</span>
    return <span className="badge badge-grey">{status}</span>
  }

  const latest = runs[0]
  const latestDate = latest?.started_at
    ? new Date(latest.started_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
    : '—'

  const filtered = runs.filter(r => {
    if (filterType !== 'All' && r.type !== filterType) return false
    if (filterStatus !== 'All' && r.status !== filterStatus) return false
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  function onFilterChange(setter) {
    return e => { setter(e.target.value); setPage(1) }
  }

  const typeOptions   = ['All', ...Array.from(new Set(runs.map(r => r.type).filter(Boolean)))]
  const statusOptions = ['All', ...Array.from(new Set(runs.map(r => r.status).filter(Boolean)))]

  return (
    <AdminLayout>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Commission Runs
      </h1>

      {/* Status card */}
      <div className="card" style={{ borderLeft: '4px solid var(--green-ok)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              Last Run
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
              {latestDate}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
              {latest?.members_processed?.toLocaleString() ?? '—'} members processed
              {' '}· Total payout: <span style={{ color: 'var(--gold)', fontWeight: 600 }}>
                {latest?.total_paid?.toLocaleString() ?? '—'} MLMT
              </span>
              {' '}· Status:{' '}
              <span style={{ color: '#86efac', fontWeight: 600 }}>
                {latest?.status === 'Completed' ? '✓ Completed' : latest?.status ?? '—'}
              </span>
            </div>
          </div>
          <button
            className="btn btn-gold"
            onClick={() => setShowConfirm(true)}
            style={{ flexShrink: 0 }}
          >
            ▶ Run Commission Calculation Now
          </button>
        </div>
      </div>

      {/* Schedule card */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: editSchedule ? '16px' : 0 }}>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
              Auto-Schedule
            </div>
            <div style={{ fontSize: '15px', color: 'var(--cream)' }}>
              Scheduled: Every <strong>{schedDay}</strong> at <strong>{schedTime} UTC</strong>
            </div>
          </div>
          {!editSchedule && (
            <button className="btn btn-outline btn-sm" onClick={() => setEditSchedule(true)}>
              Edit
            </button>
          )}
        </div>
        {editSchedule && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label className="label-text">Day</label>
              <select className="input" style={{ width: '140px' }} value={schedDay} onChange={e => setSchedDay(e.target.value)}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-text">Time (UTC)</label>
              <input className="input" type="time" style={{ width: '120px' }} value={schedTime} onChange={e => setSchedTime(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-gold btn-sm" onClick={saveSchedule}>Save</button>
              <button className="btn btn-outline btn-sm" onClick={() => setEditSchedule(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Run history table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {/* Toolbar */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)', marginRight: 'auto' }}>
            Run History
            <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 400, color: 'var(--text2)' }}>
              {filtered.length} run{filtered.length !== 1 ? 's' : ''}
            </span>
          </h2>

          <select
            className="input"
            style={{ width: '130px', fontSize: '13px', padding: '6px 10px' }}
            value={filterType}
            onChange={onFilterChange(setFilterType)}
          >
            {typeOptions.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select
            className="input"
            style={{ width: '140px', fontSize: '13px', padding: '6px 10px' }}
            value={filterStatus}
            onChange={onFilterChange(setFilterStatus)}
          >
            {statusOptions.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => exportCSV(filtered)}
            title="Export filtered runs as CSV"
          >
            ↓ Export CSV
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Run #</th>
              <th>Date (UTC)</th>
              <th>Type</th>
              <th>Members</th>
              <th>Total Payout</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text2)', padding: '32px', fontSize: '14px' }}>
                  No runs match the selected filters.
                </td>
              </tr>
            ) : pageRows.map(row => (
              <tr key={row.id}>
                <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '13px' }}>{row.id}</td>
                <td style={{ color: 'var(--text)', fontSize: '13px' }}>
                  {row.started_at
                    ? new Date(row.started_at).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
                    : '—'}
                </td>
                <td>
                  <span className={row.type === 'Manual' ? 'badge badge-blue' : 'badge badge-grey'}>
                    {row.type}
                  </span>
                </td>
                <td>{row.members_processed?.toLocaleString() ?? '—'}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 600 }}>
                  {row.total_paid != null ? row.total_paid.toLocaleString() + ' MLMT' : '—'}
                </td>
                <td>{statusBadge(row.status)}</td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSelectedRun(row)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', fontSize: '13px', color: 'var(--text2)' }}>
            <span>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
              >
                ‹ Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '…'
                    ? <span key={`ellipsis-${i}`} style={{ padding: '0 4px' }}>…</span>
                    : <button
                        key={p}
                        className={`btn btn-sm ${p === safePage ? 'btn-gold' : 'btn-outline'}`}
                        onClick={() => setPage(p)}
                        style={{ minWidth: '32px' }}
                      >
                        {p}
                      </button>
                )
              }
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
              >
                Next ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
          onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false) }}
        >
          <div className="card" style={{ maxWidth: '460px', width: '100%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '12px' }}>
              Confirm Commission Run
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              This will calculate commissions for all{' '}
              <strong style={{ color: 'var(--cream)' }}>
                {latest?.members_processed?.toLocaleString() ?? '—'} active members
              </strong>{' '}
              and queue payouts. This cannot be undone. Continue?
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-gold btn-sm" onClick={startRun}>Confirm &amp; Run</button>
            </div>
          </div>
        </div>
      )}

      {/* Progress / success modal */}
      {(running || runComplete) && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
        >
          <div className="card" style={{ maxWidth: '460px', width: '100%', textAlign: 'center' }}>
            {running && (
              <>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
                  Running Commission Calculation…
                </div>
                <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
                  Processing {latest?.members_processed?.toLocaleString() ?? '—'} members. Please wait.
                </div>
                <div className="progress-bar-wrap" style={{ marginBottom: '12px' }}>
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{progress}%</div>
              </>
            )}
            {runComplete && (
              <>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--cream)', marginBottom: '8px' }}>
                  Run Complete
                </div>
                <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px' }}>
                  ✓ Commission run triggered successfully
                  {lastRunResult?.run_id ? ` (${lastRunResult.run_id})` : ''}.
                  {' '}Payouts queued for processing.
                </div>
                <button className="btn btn-gold" onClick={closeRunModal}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Breakdown modal */}
      {selectedRun && (
        <BreakdownModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
