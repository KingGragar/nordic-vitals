import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getTaxSummary } from '../../api/mlmApi'

const YEARS = [2026, 2025, 2024]
const CURRENT_YEAR = new Date().getFullYear()

const TYPE_COLORS = {
  'Pairing Bonus':       '#4a9eff',
  'Sponsor Bonus':       '#34d399',
  'Level Commission L1': '#a78bfa',
  'Level Commission L2': '#c084fc',
  'Level Commission L3': '#e879f9',
  'Override Bonus':      '#fb923c',
  'Pool Bonus':          '#f59e0b',
  'Rank Bonus':          '#22d3ee',
}

const pill = (label, color) => (
  <span style={{
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 12, padding: '2px 8px', fontSize: 12, fontWeight: 600,
  }}>{label}</span>
)

export default function TaxSummary() {
  const { user } = useAuth()
  const [year, setYear] = useState(CURRENT_YEAR)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    setLoading(true)
    getTaxSummary(user?.userId, year)
      .then(r => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [year, user?.userId])

  const handlePrint = () => window.print()

  const card = (label, value, sub) => (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--navy3)',
      borderRadius: 10, padding: '14px 18px', minWidth: 140,
    }}>
      <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{value}</div>
      {sub && <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #tax-print-area, #tax-print-area * { visibility: visible !important; }
          #tax-print-area { position: fixed; inset: 0; padding: 32px; background: #fff; color: #000; }
          #tax-print-area table { width: 100%; border-collapse: collapse; }
          #tax-print-area th, #tax-print-area td { border: 1px solid #ccc; padding: 6px 10px; }
          #tax-print-area .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ padding: '24px 24px 40px', maxWidth: 860 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 22, color: 'var(--text1)' }}>🧾 Tax Summary</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text2)', fontSize: 14 }}>
              Annual earnings statement for your Skattemeldingen / tax return
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              style={{
                background: 'var(--navy2)', border: '1px solid var(--navy3)',
                color: 'var(--text1)', padding: '7px 12px', borderRadius: 7, fontSize: 14,
              }}
            >
              {YEARS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              className="no-print"
              onClick={handlePrint}
              style={{
                background: 'var(--gold)', color: '#000', border: 'none',
                borderRadius: 7, padding: '7px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 14,
              }}
            >
              🖨 Print / Save PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text2)', padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : !data ? (
          <div style={{ color: 'var(--text2)', padding: 40, textAlign: 'center' }}>Could not load tax data.</div>
        ) : (
          <div ref={printRef} id="tax-print-area">
            {/* Print header (only visible in print) */}
            <div style={{ marginBottom: 16, display: 'none' }} className="print-only">
              <div style={{ fontSize: 20, fontWeight: 700 }}>Nordic Vitals MLM — Annual Earnings Statement {data.year}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>Member: {data.memberName} · ID: {data.memberId}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Exchange rate used: 1 MLMT = {data.nok_rate} NOK (illustrative — use Skatteetaten's official rate for filing)
              </div>
              <hr style={{ margin: '12px 0' }} />
            </div>

            {/* KPI cards */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
              {card('Total Earned', `${data.totalMlmt.toLocaleString()} MLMT`, `≈ ${data.totalNok.toLocaleString()} NOK`)}
              {card('Withdrawn / Paid', `${data.withdrawalsNok.toLocaleString()} NOK`, 'to bank account')}
              {card('Pending MLMT', `${data.pendingMlmt.toLocaleString()} MLMT`, 'commissions not yet paid')}
              {card('Earnings Sources', data.rows.length, `commission types`)}
            </div>

            {/* Commission breakdown table */}
            <div style={{
              background: 'var(--navy2)', border: '1px solid var(--navy3)',
              borderRadius: 10, overflow: 'hidden', marginBottom: 24,
            }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--navy3)', fontWeight: 600, fontSize: 15 }}>
                Commission Breakdown — {data.year}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--navy3)' }}>
                      {['Commission Type', 'No. of Payments', 'Amount (MLMT)', '≈ NOK (illustrative)'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={row.type} style={{ borderTop: '1px solid var(--navy3)', background: i % 2 === 0 ? 'transparent' : 'var(--navy3)11' }}>
                        <td style={{ padding: '10px 14px' }}>
                          {pill(row.type, TYPE_COLORS[row.type] || '#94a3b8')}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{row.count}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{row.amount.toLocaleString()} MLMT</td>
                        <td style={{ padding: '10px 14px', color: 'var(--gold)' }}>{row.nok.toLocaleString()} NOK</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid var(--navy3)', background: 'var(--navy3)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>Total</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text2)' }}>{data.rows.reduce((s, r) => s + r.count, 0)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{data.totalMlmt.toLocaleString()} MLMT</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--gold)' }}>{data.totalNok.toLocaleString()} NOK</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual bar chart */}
            <div style={{
              background: 'var(--navy2)', border: '1px solid var(--navy3)',
              borderRadius: 10, padding: '18px', marginBottom: 24,
            }}>
              <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 15 }}>Earnings Distribution</div>
              {data.rows.map(row => {
                const pct = data.totalMlmt > 0 ? (row.amount / data.totalMlmt) * 100 : 0
                const color = TYPE_COLORS[row.type] || '#94a3b8'
                return (
                  <div key={row.type} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                      <span style={{ color }}>{row.type}</span>
                      <span style={{ color: 'var(--text2)' }}>{row.amount.toLocaleString()} MLMT ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ background: 'var(--navy3)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* NOK exchange note */}
            <div style={{
              background: '#f59e0b11', border: '1px solid #f59e0b44',
              borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 13,
            }}>
              <strong style={{ color: '#f59e0b' }}>⚠️ Important — for tax filing</strong>
              <p style={{ margin: '6px 0 0', color: 'var(--text2)', lineHeight: 1.5 }}>
                The NOK equivalents above use an <strong>illustrative</strong> rate of 1 MLMT = {data.nok_rate} NOK.
                For your actual Skattemeldingen (Norwegian tax return), you must use the official exchange rate
                published by <strong>Skatteetaten</strong> or <strong>Norges Bank</strong> for the date of each payment.
                Only <em>withdrawn / paid-out</em> amounts are reportable as income; reinvested or pending MLMT
                may be treated differently — consult a tax adviser if unsure.
              </p>
            </div>

            {/* Member info for print */}
            <div style={{
              background: 'var(--navy2)', border: '1px solid var(--navy3)',
              borderRadius: 8, padding: '12px 16px', fontSize: 13, color: 'var(--text2)',
            }}>
              <span style={{ marginRight: 24 }}><strong>Member:</strong> {data.memberName}</span>
              <span style={{ marginRight: 24 }}><strong>ID:</strong> {data.memberId}</span>
              <span style={{ marginRight: 24 }}><strong>Tax year:</strong> {data.year}</span>
              <span><strong>Generated:</strong> {new Date().toLocaleDateString('en-GB')}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
