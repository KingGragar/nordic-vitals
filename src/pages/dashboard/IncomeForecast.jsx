import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberIncomeForecast } from '../../api/mlmApi'

const SCENARIO_COLOR = { conservative: '#94a3b8', realistic: '#818cf8', optimistic: '#86efac' }

export default function DashIncomeForecast() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [scenario, setScenario] = useState('realistic')
  const [months, setMonths] = useState(6)

  useEffect(() => {
    setLoading(true)
    getMemberIncomeForecast().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const forecast = data?.scenarios?.[scenario] || {}
  const chartData = (forecast.monthly || []).slice(0, months)
  const maxVal = chartData.length ? Math.max(...chartData.map(m => m.total)) : 1

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Income Forecast</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Personalised commission and earnings projection based on your current rank and activity</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Current Rank', value: data?.currentRank || '—', color: '#818cf8' },
            { label: 'This Month Est.', value: data?.thisMonthEst || '—', color: '#86efac' },
            { label: 'Next Rank Bonus', value: data?.nextRankBonus || '—', color: '#fbbf24' },
            { label: 'Team Volume', value: data?.teamVolume || '—', color: '#93c5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Earnings Projection</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['conservative', 'realistic', 'optimistic'].map(s => (
                <button key={s} onClick={() => setScenario(s)} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', cursor: 'pointer', textTransform: 'capitalize', fontSize: 13, fontWeight: 600, background: scenario === s ? SCENARIO_COLOR[s] : 'var(--border)', color: scenario === s ? '#fff' : 'var(--text-muted)' }}>{s}</button>
              ))}
              <select value={months} onChange={e => setMonths(Number(e.target.value))} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input,var(--card))', color: 'var(--text)', fontSize: 13 }}>
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginBottom: 8 }}>
              {chartData.map((m, i) => {
                const totalPct = maxVal ? (m.total / maxVal) * 100 : 0
                const personalPct = maxVal ? (m.personal / maxVal) * 100 : 0
                const teamPct = totalPct - personalPct
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 140, gap: 2 }}>
                      <div style={{ height: `${teamPct}%`, background: SCENARIO_COLOR[scenario] + '66', borderRadius: '3px 3px 0 0', minHeight: teamPct > 0 ? 3 : 0 }} />
                      <div style={{ height: `${personalPct}%`, background: SCENARIO_COLOR[scenario], borderRadius: '3px 3px 0 0', minHeight: personalPct > 0 ? 3 : 0 }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>{m.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{m.totalFormatted}</div>
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: SCENARIO_COLOR[scenario], display: 'inline-block' }} /> Personal commissions</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: SCENARIO_COLOR[scenario] + '66', display: 'inline-block' }} /> Team overrides</span>
          </div>
        </div>

        {!loading && forecast.assumptions && (
          <div style={{ ...card, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Scenario Assumptions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
              {forecast.assumptions.map((a, i) => (
                <div key={i} style={{ background: 'var(--bg,#f8fafc)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>{a.label}</div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{a.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && data?.milestones && (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Earnings Milestones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.milestones.map((ms, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, width: 90, flexShrink: 0, color: ms.reached ? '#86efac' : 'var(--text-muted)' }}>{ms.amount}</div>
                  <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ms.progress}%`, background: ms.reached ? '#86efac' : SCENARIO_COLOR[scenario], borderRadius: 4 }} />
                  </div>
                  <div style={{ width: 80, fontSize: 12, color: ms.reached ? '#86efac' : 'var(--text-muted)', fontWeight: ms.reached ? 700 : 400, flexShrink: 0, textAlign: 'right' }}>{ms.reached ? 'Reached!' : ms.eta}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
