import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminRegulatoryReports } from '../../api/mlmApi'

const JURISDICTIONS = ['all', 'Norway', 'Sweden', 'Denmark', 'Finland', 'EU', 'US']
const REPORT_TYPES = ['income_disclosure', 'business_opportunity', 'earnings_claim', 'annual_compliance', 'ftc_disclosure']
const STATUS_COLORS = { current: '#86efac', due_soon: '#fbbf24', overdue: '#ef4444', draft: '#a5b4fc' }
const TYPE_LABELS = {
  income_disclosure: 'Income Disclosure', business_opportunity: 'Business Opportunity',
  earnings_claim: 'Earnings Claim', annual_compliance: 'Annual Compliance', ftc_disclosure: 'FTC Disclosure',
}

export default function AdminRegulatoryReports() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [jurisdiction, setJurisdiction] = useState('all')
  const [showGenerate, setShowGenerate] = useState(false)
  const [genType, setGenType] = useState('income_disclosure')

  useEffect(() => { getAdminRegulatoryReports().then(setData).finally(() => setLoading(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = data.reports.filter(r => jurisdiction === 'all' || r.jurisdiction === jurisdiction)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📋 Regulatory Reports</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Income disclosures, compliance filings, and jurisdiction-specific regulatory documents.</div>
          </div>
          <button onClick={() => setShowGenerate(s => !s)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
            + Generate Report
          </button>
        </div>

        {showGenerate && (
          <div style={{ ...card, marginBottom: 20, borderColor: 'var(--gold)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Generate New Regulatory Report</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end', flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Report Type</label>
                <select value={genType} onChange={e => setGenType(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                  {REPORT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Jurisdiction</label>
                <select style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                  {JURISDICTIONS.filter(j => j !== 'all').map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>Period</label>
                <select style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                  <option>2025 Annual</option><option>2024 Annual</option><option>Q2 2026</option><option>Q1 2026</option>
                </select>
              </div>
              <button onClick={() => setShowGenerate(false)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Generate
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Reports',  value: data.stats.total,     color: '#a5b4fc' },
            { label: 'Overdue',        value: data.stats.overdue,   color: '#ef4444' },
            { label: 'Due This Month', value: data.stats.dueSoon,   color: '#fbbf24' },
            { label: 'Jurisdictions',  value: data.stats.jurisdictions, color: '#86efac' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {JURISDICTIONS.map(j => (
            <button key={j} onClick={() => setJurisdiction(j)} style={{
              padding: '6px 14px', borderRadius: 20, border: `1px solid ${jurisdiction === j ? 'var(--gold)' : 'var(--border)'}`,
              background: jurisdiction === j ? '#fbbf2422' : 'transparent',
              color: jurisdiction === j ? '#fbbf24' : 'var(--text2)', fontWeight: 600, fontSize: 12, cursor: 'pointer',
            }}>{j}</button>
          ))}
        </div>

        <div style={card}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Report Name', 'Type', 'Jurisdiction', 'Period', 'Due Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--bg)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)', fontSize: 12 }}>{TYPE_LABELS[r.type] || r.type}</td>
                    <td style={{ padding: '10px 12px' }}>{r.jurisdiction}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{r.period}</td>
                    <td style={{ padding: '10px 12px', color: r.status === 'overdue' ? '#ef4444' : r.status === 'due_soon' ? '#fbbf24' : 'var(--text)' }}>{r.dueDate}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                        background: (STATUS_COLORS[r.status] || '#888') + '22', color: STATUS_COLORS[r.status] || '#888',
                        textTransform: 'capitalize',
                      }}>{r.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 11, cursor: 'pointer' }}>View</button>
                        <button style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: 'var(--gold)', color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>PDF</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Compliance Calendar</div>
            {data.upcomingDeadlines.map(d => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{d.day}</div>
                  <div style={{ fontSize: 9, color: 'var(--text2)', textTransform: 'uppercase' }}>{d.month}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{d.jurisdiction} · {d.type}</div>
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                  background: (STATUS_COLORS[d.status] || '#888') + '22', color: STATUS_COLORS[d.status] || '#888',
                }}>{d.daysLeft}d</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Income Disclosure Summary</div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 14 }}>Average annual income by distributor rank — most recent filed period.</div>
            {data.incomeDisclosure.map(r => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 70, fontSize: 12, color: 'var(--text2)' }}>{r.rank}</span>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                  <div style={{ width: `${(r.avg / data.incomeDisclosure[data.incomeDisclosure.length - 1].avg) * 100}%`, height: '100%', background: '#a5b4fc', borderRadius: 3 }} />
                </div>
                <span style={{ width: 90, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{r.avg}</span>
                <span style={{ width: 40, textAlign: 'right', fontSize: 11, color: 'var(--text2)' }}>{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
