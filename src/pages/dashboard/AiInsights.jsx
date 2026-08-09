import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAiInsights } from '../../api/mlmApi'

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#86efac' }
const TYPE_ICON = { growth: '📈', retention: '🔄', recruitment: '👥', product: '💊', income: '💰', wellness: '🌿' }

export default function DashAiInsights() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(new Set())
  const [refreshing, setRefreshing] = useState(false)

  const load = () => {
    setLoading(true)
    getMemberAiInsights().then(setData).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const refresh = () => { setRefreshing(true); setTimeout(() => { setRefreshing(false) }, 1500) }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const insights = (data?.insights || []).filter(i => !dismissed.has(i.id))

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>AI Insights</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Personalised analysis of your business patterns, trends, and next-best actions</p>
          </div>
          <button onClick={refresh} disabled={refreshing} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600, opacity: refreshing ? 0.6 : 1 }}>
            {refreshing ? 'Analysing…' : '⟳ Refresh'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Insights Ready', value: insights.length, color: '#818cf8' },
            { label: 'High Priority', value: insights.filter(i => i.priority === 'high').length, color: '#f87171' },
            { label: 'Est. Impact', value: `+${data?.estImpactPct || 0}%`, color: '#86efac' },
            { label: 'Last Analysed', value: data?.lastAnalysed || '—', color: '#93c5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {!loading && data?.performanceSummary && (
          <div style={{ ...card, marginBottom: 18, background: 'linear-gradient(135deg,rgba(99,102,241,.08),rgba(129,140,248,.04))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Your Business at a Glance</div>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--text)' }}>{data.performanceSummary}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Analysing your data…</div> : insights.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>✨</div>
              <div style={{ fontWeight: 700 }}>You're all caught up!</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>No new insights right now. Check back after your next activity.</div>
            </div>
          ) : insights.map(ins => (
            <div key={ins.id} style={{ ...card, borderLeft: `3px solid ${PRIORITY_COLOR[ins.priority]}` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{TYPE_ICON[ins.type] || '💡'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{ins.title}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: PRIORITY_COLOR[ins.priority], background: `${PRIORITY_COLOR[ins.priority]}22`, borderRadius: 5, padding: '2px 7px', textTransform: 'capitalize' }}>{ins.priority}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{ins.type}</span>
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>{ins.body}</p>
                  {ins.action && (
                    <div style={{ background: 'rgba(99,102,241,.06)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#818cf8', marginBottom: 3 }}>Recommended Action</div>
                      <div style={{ fontSize: 13 }}>{ins.action}</div>
                    </div>
                  )}
                  {ins.metric && (
                    <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current: <strong style={{ color: 'var(--text)' }}>{ins.metric.current}</strong></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: <strong style={{ color: '#86efac' }}>{ins.metric.target}</strong></div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Potential gain: <strong style={{ color: '#818cf8' }}>{ins.metric.gain}</strong></div>
                    </div>
                  )}
                </div>
                <button onClick={() => setDismissed(d => new Set([...d, ins.id]))} style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 6, border: 'none', background: '#94a3b822', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }} title="Dismiss">×</button>
              </div>
            </div>
          ))}
        </div>

        {!loading && data?.trendChart && (
          <div style={{ ...card, marginTop: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>30-Day Performance Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {(data.trendChart.values || []).map((v, i) => {
                const max = Math.max(...data.trendChart.values)
                const pct = max ? (v / max) * 100 : 0
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: '100%', height: `${pct}%`, minHeight: 4, background: pct > 70 ? '#86efac' : pct > 40 ? '#818cf8' : '#94a3b8', borderRadius: '3px 3px 0 0' }} />
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>30 days ago</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Today</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
