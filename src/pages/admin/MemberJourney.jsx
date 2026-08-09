import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMemberJourney } from '../../api/mlmApi'

const STAGE_COLOR = { acquisition: '#93c5fd', activation: '#86efac', growth: '#fbbf24', retention: '#818cf8', churn_risk: '#f87171', churned: '#a1a1aa' }
const STAGE_ICON = { acquisition: '🎯', activation: '⚡', growth: '📈', retention: '🔄', churn_risk: '⚠️', churned: '💀' }

export default function AdminMemberJourney() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    getAdminMemberJourney().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Member Journey</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Lifecycle analytics — acquisition through retention and churn</p>
          </div>
          <select value={period} onChange={e => setPeriod(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
            {['7d', '30d', '90d', '12m'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 14, marginBottom: 28 }}>
          {Object.entries(STAGE_COLOR).map(([stage, color]) => {
            const stageData = (data?.stages || {})[stage] || {}
            return (
              <div key={stage} style={card}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{STAGE_ICON[stage]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color }}>{loading ? '…' : (stageData.count || 0).toLocaleString()}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: 2 }}>{stage.replace('_', ' ')}</div>
                <div style={{ fontSize: 11, color: stageData.delta >= 0 ? '#86efac' : '#f87171' }}>
                  {loading ? '' : `${stageData.delta >= 0 ? '+' : ''}${stageData.delta || 0}%`}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Stage Funnel</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(STAGE_COLOR).map(([stage, color]) => {
                  const stageData = (data?.stages || {})[stage] || {}
                  const total = Object.values(data?.stages || {}).reduce((s, v) => s + (v.count || 0), 0) || 1
                  const pct = Math.round(((stageData.count || 0) / total) * 100)
                  return (
                    <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, width: 90, textTransform: 'capitalize', color: 'var(--text-muted)' }}>{stage.replace('_', ' ')}</span>
                      <div style={{ flex: 1, height: 20, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 5, display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                          {pct > 10 && <span style={{ fontSize: 11, fontWeight: 700, color: '#000a' }}>{pct}%</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, width: 40, textAlign: 'right' }}>{(stageData.count || 0).toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Transition Rates</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(data?.transitions || []).map(t => (
                  <div key={`${t.from}-${t.to}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: STAGE_COLOR[t.from] || 'var(--text)' }}>{t.from.replace('_', ' ')}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', color: STAGE_COLOR[t.to] || 'var(--text)', flex: 1 }}>{t.to.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 700, color: t.rate >= 50 ? '#86efac' : t.rate >= 25 ? '#fbbf24' : '#f87171' }}>{t.rate}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Churn Risk — Top Members to Re-engage</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Member', 'Rank', 'Last Active', 'Risk Score', 'Lifetime Value', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 20, color: 'var(--text-muted)', textAlign: 'center' }}>Loading…</td></tr>
                ) : (data?.churnRisk || []).map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{m.rank}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{m.lastActive}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: m.riskScore >= 75 ? '#f87171' : m.riskScore >= 50 ? '#fbbf24' : '#86efac', background: m.riskScore >= 75 ? '#f8717122' : m.riskScore >= 50 ? '#fbbf2422' : '#86efac22', borderRadius: 5, padding: '2px 7px' }}>{m.riskScore}</span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>NOK {m.ltv.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <button style={{ padding: '5px 12px', background: '#6366f122', color: '#6366f1', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Re-engage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
