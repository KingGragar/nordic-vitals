import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberFinancialSummary } from '../../api/mlmApi'

export default function DashFinancialSummary() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [year, setYear]    = useState(new Date().getFullYear())

  useEffect(() => { getMemberFinancialSummary(year).then(setData).finally(() => setLoad(false)) }, [year])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const fmt  = n => `$${(+n || 0).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const maxMonth = Math.max(...data.monthly.map(m => m.earned), 1)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💰 Financial Summary</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Your income overview — commissions, payouts, and tax estimate.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[year-1, year].map(y => (
              <button key={y} onClick={() => setYear(y)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${year===y ? '#86efac' : 'var(--border)'}`,
                background: year===y ? '#86efac22' : 'transparent',
                color: year===y ? '#86efac' : 'var(--text2)',
              }}>{y}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Earned',       value: fmt(data.summary.total_earned),       color: '#86efac' },
            { label: 'Paid Out',           value: fmt(data.summary.paid_out),           color: '#a5b4fc' },
            { label: 'Pending Payout',     value: fmt(data.summary.pending),            color: '#fbbf24' },
            { label: 'Tax Withheld',       value: fmt(data.summary.tax_withheld),       color: '#f87171' },
            { label: 'Tax Estimate (20%)', value: fmt(data.summary.total_earned * 0.20), color: '#94a3b8' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Monthly Earnings {year}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {data.monthly.map((m, i) => {
                const h = Math.max(4, Math.round((m.earned / maxMonth) * 80))
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div title={`${m.month}: ${fmt(m.earned)}`} style={{ width: '100%', height: h, background: m.earned > 0 ? '#86efac' : 'var(--border)', borderRadius: '3px 3px 0 0' }} />
                    <span style={{ fontSize: 9, color: 'var(--text2)', writingMode: 'unset' }}>{m.month.slice(0,3)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Income Breakdown</div>
            {data.breakdown.map(b => (
              <div key={b.type} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: 'var(--text2)' }}>{b.type}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(b.amount)}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(b.amount/data.summary.total_earned)*100}%`, background: '#86efac', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Payout History</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Date','Amount','Method','Reference','Status'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text2)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.payouts.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px' }}>{new Date(p.date).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 700, color: '#86efac' }}>{fmt(p.amount)}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--text2)' }}>{p.method}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--text2)' }}>{p.reference}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{ background: p.status==='paid'?'#86efac22':'#fbbf2422', color: p.status==='paid'?'#86efac':'#fbbf24', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {data.payouts.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: 'var(--text2)' }}>No payouts this year.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...card, marginTop: 16, fontSize: 12, color: 'var(--text2)', borderLeft: '3px solid #fbbf24' }}>
          ⚠ Tax estimates are for informational purposes only and do not constitute tax advice. Consult a qualified tax professional for your jurisdiction.
        </div>
      </div>
    </DashboardLayout>
  )
}
