import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'

const RUN_HISTORY = [
  { run: '#041', date: '2026-07-13 02:00 UTC', type: 'Scheduled', members: 847, total: '18,400 MLMT', status: 'Completed' },
  { run: '#040', date: '2026-07-06 02:00 UTC', type: 'Scheduled', members: 844, total: '17,850 MLMT', status: 'Completed' },
  { run: '#039', date: '2026-07-04 14:12 UTC', type: 'Manual',    members: 844, total: '17,850 MLMT', status: 'Completed' },
  { run: '#038', date: '2026-06-29 02:00 UTC', type: 'Scheduled', members: 838, total: '16,990 MLMT', status: 'Completed' },
  { run: '#037', date: '2026-06-22 02:00 UTC', type: 'Scheduled', members: 831, total: '15,740 MLMT', status: 'Completed' },
  { run: '#036', date: '2026-06-15 02:00 UTC', type: 'Scheduled', members: 820, total: '15,210 MLMT', status: 'Completed' },
  { run: '#035', date: '2026-06-08 02:00 UTC', type: 'Scheduled', members: 811, total: '14,630 MLMT', status: 'Failed'    },
  { run: '#034', date: '2026-06-01 02:00 UTC', type: 'Scheduled', members: 799, total: '13,980 MLMT', status: 'Completed' },
]

const BREAKDOWN = [
  { label: 'Pairing Bonus',      amount: '8,280 MLMT' },
  { label: 'Sponsor Bonus',      amount: '4,600 MLMT' },
  { label: 'Level Commission',   amount: '3,310 MLMT' },
  { label: 'Pool Bonus',         amount: '2,210 MLMT' },
]

function Toast({ message, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function BreakdownModal({ onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>
        <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '20px' }}>Run Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Bonus Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {BREAKDOWN.map(row => (
              <tr key={row.label}>
                <td style={{ color: 'var(--cream)' }}>{row.label}</td>
                <td style={{ textAlign: 'right', color: 'var(--gold)', fontWeight: 600 }}>{row.amount}</td>
              </tr>
            ))}
            <tr>
              <td style={{ fontWeight: 700, color: 'var(--cream)' }}>Total</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--gold)' }}>18,400 MLMT</td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function CommissionRuns() {
  // Run modal states
  const [showConfirm, setShowConfirm]   = useState(false)
  const [running, setRunning]           = useState(false)
  const [progress, setProgress]         = useState(0)
  const [runComplete, setRunComplete]   = useState(false)
  const progressRef = useRef(null)

  // Schedule editing
  const [editSchedule, setEditSchedule] = useState(false)
  const [schedDay, setSchedDay]         = useState('Sunday')
  const [schedTime, setSchedTime]       = useState('02:00')

  // Details modal
  const [showBreakdown, setShowBreakdown] = useState(false)

  // Toast
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  function startRun() {
    setShowConfirm(false)
    setRunning(true)
    setProgress(0)
    setRunComplete(false)

    // Animate progress bar over ~2 seconds
    let pct = 0
    progressRef.current = setInterval(() => {
      pct += 2
      setProgress(pct)
      if (pct >= 100) {
        clearInterval(progressRef.current)
        setTimeout(() => {
          setRunning(false)
          setRunComplete(true)
        }, 300)
      }
    }, 40)
  }

  useEffect(() => {
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [])

  function closeRunModal() {
    setRunning(false)
    setRunComplete(false)
    setProgress(0)
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
              2026-07-13 02:00 UTC
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text2)' }}>
              847 members processed · Total payout: 18,400 MLMT · Status:{' '}
              <span style={{ color: '#86efac', fontWeight: 600 }}>✓ Completed</span>
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
        <div style={{ padding: '20px 20px 0', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cream)' }}>Run History</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Run #</th>
              <th>Date</th>
              <th>Type</th>
              <th>Members</th>
              <th>Total Payout</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {RUN_HISTORY.map(row => (
              <tr key={row.run}>
                <td style={{ color: 'var(--text2)', fontFamily: 'monospace', fontSize: '13px' }}>{row.run}</td>
                <td style={{ color: 'var(--text)', fontSize: '13px' }}>{row.date}</td>
                <td>
                  <span className={row.type === 'Manual' ? 'badge badge-blue' : 'badge badge-grey'}>
                    {row.type}
                  </span>
                </td>
                <td>{row.members}</td>
                <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{row.total}</td>
                <td>{statusBadge(row.status)}</td>
                <td>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowBreakdown(true)}
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              This will calculate commissions for all <strong style={{ color: 'var(--cream)' }}>847 active members</strong> and queue{' '}
              <strong style={{ color: 'var(--gold)' }}>~18,400 MLMT</strong> in payouts. This cannot be undone. Continue?
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
                  Processing 847 members. Please wait.
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
                  ✓ Run complete: <strong style={{ color: 'var(--cream)' }}>847 members processed</strong>,{' '}
                  <strong style={{ color: 'var(--gold)' }}>18,420 MLMT</strong> queued for payout.
                </div>
                <button className="btn btn-gold" onClick={closeRunModal}>Close</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Breakdown modal */}
      {showBreakdown && <BreakdownModal onClose={() => setShowBreakdown(false)} />}

      {/* Toast */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </AdminLayout>
  )
}
