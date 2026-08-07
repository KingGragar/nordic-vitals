import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import {
  getMemberCommissionStatements,
  getMemberCommissionStatementSummary,
} from '../../api/mlmApi'

const STATUS_STYLE = {
  paid:       { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Paid' },
  pending:    { bg: '#1e3a5f', color: '#93c5fd', border: '#1d4ed8', label: 'Pending' },
  processing: { bg: '#422006', color: '#fcd34d', border: '#b45309', label: 'Processing' },
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 22 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function BreakdownRow({ item }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--text2)' }}>{item.type}</span>
      <span style={{ fontWeight: 600 }}>NOK {item.amountNok.toLocaleString()}</span>
    </div>
  )
}

function DownloadButton({ stmt }) {
  const [status, setStatus] = useState('idle') // idle | generating | done

  function handleDownload() {
    setStatus('generating')
    setTimeout(() => {
      const lines = [
        `NORDIC VITALS — COMMISSION STATEMENT`,
        `Period: ${stmt.label}`,
        ``,
        `EARNINGS BREAKDOWN`,
        ...stmt.breakdown.map(b => `  ${b.type}: NOK ${b.amountNok.toLocaleString()}`),
        ``,
        `Gross Commissions:  NOK ${stmt.grossNok.toLocaleString()}`,
        `Deductions (5%):   -NOK ${stmt.deductionsNok.toLocaleString()}`,
        `Net Payout:         NOK ${stmt.netNok.toLocaleString()}`,
        ``,
        `Status: ${stmt.status.toUpperCase()}`,
        stmt.paidAt ? `Paid: ${new Date(stmt.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}` : '',
      ].filter(Boolean).join('\n')
      const blob = new Blob([lines], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `nordic-vitals-statement-${stmt.period}.txt`; a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    }, 900)
  }

  return (
    <button onClick={handleDownload} disabled={status === 'generating'}
      style={{ padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, color: status === 'done' ? '#86efac' : 'var(--text)', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
      {status === 'generating' ? '⏳ Generating…' : status === 'done' ? '✓ Downloaded' : '⬇ Download'}
    </button>
  )
}

export default function CommissionStatements() {
  const [statements, setStatements] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    Promise.all([getMemberCommissionStatements(), getMemberCommissionStatementSummary()])
      .then(([s, sum]) => {
        setStatements(s.sort((a, b) => b.period.localeCompare(a.period)))
        setSummary(sum)
      })
      .finally(() => setLoading(false))
  }, [])

  const visible = statements.filter(s => filterStatus === 'all' || s.status === filterStatus)

  function toggle(id) { setExpanded(p => p === id ? null : id) }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>📄 Commission Statements</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Monthly earnings summaries you can download for tax records.</div>
        </div>

        {summary && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 12, marginBottom: 28 }}>
            <StatCard icon="📈" label="YTD Gross" value={`NOK ${summary.ytdGrossNok.toLocaleString()}`} sub="before deductions" />
            <StatCard icon="✅" label="YTD Net" value={`NOK ${summary.ytdNetNok.toLocaleString()}`} sub="after deductions" />
            <StatCard icon="🗓️" label="This Month" value={`NOK ${summary.currentMonthNok.toLocaleString()}`} sub="estimated, not yet paid" />
            <StatCard icon="💸" label="Last Month" value={`NOK ${summary.lastMonthNok.toLocaleString()}`} sub="net paid" />
            <StatCard icon="📂" label="Statements" value={summary.statementsAvailable} sub="available to download" />
          </div>
        )}

        <div style={{ background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#93c5fd' }}>
          💡 Statements are generated on the 5th of each month. Deductions cover the 5% platform fee.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'paid', 'pending', 'processing'].map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filterStatus === f ? 'var(--gold)' : 'var(--bg)', color: filterStatus === f ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: filterStatus === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visible.map(stmt => {
              const ss = STATUS_STYLE[stmt.status] || STATUS_STYLE.pending
              const open = expanded === stmt.id
              return (
                <div key={stmt.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    onClick={() => stmt.status !== 'pending' && toggle(stmt.id)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', cursor: stmt.status !== 'pending' ? 'pointer' : 'default', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>{stmt.label}</span>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: ss.bg, color: ss.color, border: `1px solid ${ss.border}` }}>{ss.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--text2)' }}>
                        <span>Gross: <strong style={{ color: 'var(--text)' }}>NOK {stmt.grossNok.toLocaleString()}</strong></span>
                        {stmt.deductionsNok > 0 && <span>Deductions: <strong style={{ color: '#ef4444' }}>-NOK {stmt.deductionsNok.toLocaleString()}</strong></span>}
                        <span>Net: <strong style={{ color: '#86efac' }}>NOK {stmt.netNok.toLocaleString()}</strong></span>
                        {stmt.paidAt && <span>Paid {new Date(stmt.paidAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {stmt.status === 'paid' && <DownloadButton stmt={stmt} />}
                      {stmt.status !== 'pending' && (
                        <span style={{ color: 'var(--text2)', fontSize: 16, userSelect: 'none' }}>{open ? '▲' : '▼'}</span>
                      )}
                    </div>
                  </div>

                  {open && (
                    <div style={{ borderTop: '1px solid var(--border)', padding: '14px 18px', background: 'var(--bg)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Earnings Breakdown</div>
                      {stmt.breakdown.map(b => <BreakdownRow key={b.type} item={b} />)}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, marginTop: 2 }}>
                        <span style={{ fontWeight: 700 }}>Total Net</span>
                        <span style={{ fontWeight: 700, color: '#86efac', fontSize: 16 }}>NOK {stmt.netNok.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            {visible.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No statements found.</div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
