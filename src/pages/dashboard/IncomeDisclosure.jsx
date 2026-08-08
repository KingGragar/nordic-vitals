import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberIncomeDisclosure } from '../../api/mlmApi'

export default function IncomeDisclosure() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [year, setYear] = useState('2025')

  useEffect(() => {
    setLoading(true)
    getMemberIncomeDisclosure(year).then(setData).finally(() => setLoading(false))
  }, [year])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📋 Income Disclosure Statement</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Official earnings data required by FTC regulations. These figures represent actual distributor results.</div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['2023', '2024', '2025'].map(y => (
            <button key={y} onClick={() => setYear(y)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: year === y ? 'var(--gold)' : 'var(--card)', color: year === y ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: year === y ? 700 : 400 }}>
              {y}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !data ? null : (
          <>
            <div style={{ ...card, background: 'linear-gradient(135deg, #1a2c1a 0%, #0d1a0d 100%)', borderColor: '#166534' }}>
              <div style={{ fontSize: 12, color: '#86efac', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Your Rank — {data.myRank}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{data.myAnnualEarnings.toLocaleString()} NOK</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Your {year} earnings</div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800 }}>{data.rankPercentile}%</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Percentile in rank</div>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Earnings Distribution by Rank — {year}</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ color: 'var(--text2)', borderBottom: '2px solid var(--border)' }}>
                      {['Rank', '% of Distributors', 'Avg Annual Earnings', 'Median', 'Top 10%'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.tiers.map((tier, i) => (
                      <tr key={tier.rank} style={{ borderBottom: '1px solid var(--border)', background: tier.rank === data.myRank ? 'rgba(134,239,172,0.06)' : 'transparent' }}>
                        <td style={{ padding: '10px 10px', fontWeight: tier.rank === data.myRank ? 700 : 400, color: tier.rank === data.myRank ? '#86efac' : 'var(--text)' }}>
                          {tier.rank === data.myRank ? '▶ ' : ''}{tier.rank}
                        </td>
                        <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{tier.pctDistributors}%</td>
                        <td style={{ padding: '10px 10px', fontWeight: 600 }}>{tier.avgEarnings.toLocaleString()} NOK</td>
                        <td style={{ padding: '10px 10px', color: 'var(--text2)' }}>{tier.medianEarnings.toLocaleString()} NOK</td>
                        <td style={{ padding: '10px 10px', color: 'var(--gold)' }}>{tier.top10pct.toLocaleString()} NOK</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ ...card, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: 'var(--text)' }}>⚠️ Important Disclosure</div>
              <p>{data.disclaimer}</p>
              <p style={{ marginTop: 8 }}>The figures above represent {year} results for {data.totalDistributors.toLocaleString()} active distributors in Norway. Results are not typical and are provided for informational purposes only. Individual results will vary based on effort, skill, market conditions, and other factors. There is no guarantee of income.</p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
