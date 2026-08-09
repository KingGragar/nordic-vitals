import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCustomerSatisfaction } from '../../api/mlmApi'

const NPS_COLOR = n => n >= 9 ? '#86efac' : n >= 7 ? '#fbbf24' : '#f87171'
const NPS_LABEL = n => n >= 9 ? 'Promoter' : n >= 7 ? 'Passive' : 'Detractor'

export default function AdminCustomerSatisfaction() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('nps')

  useEffect(() => {
    setLoading(true)
    getAdminCustomerSatisfaction().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Customer Satisfaction</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>NPS scores, CSAT surveys, and aggregated member feedback</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'NPS Score', value: data?.npsScore !== undefined ? data.npsScore : '—', color: '#86efac' },
            { label: 'CSAT Score', value: data?.csatScore ? `${data.csatScore}%` : '—', color: '#93c5fd' },
            { label: 'Responses (30d)', value: (data?.responses30d || 0).toLocaleString(), color: '#fbbf24' },
            { label: 'Promoters', value: `${data?.promoterPct || 0}%`, color: '#818cf8' },
            { label: 'Detractors', value: `${data?.detractorPct || 0}%`, color: '#f87171' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ key: 'nps', label: 'NPS Responses' }, { key: 'csat', label: 'CSAT Results' }, { key: 'themes', label: 'Feedback Themes' }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.key ? '#6366f1' : 'var(--border)', color: tab === t.key ? '#fff' : 'var(--text-muted)' }}>{t.label}</button>
          ))}
        </div>

        {tab === 'nps' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
              <div style={card}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>NPS Distribution</h3>
                {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...Array(10)].map((_, i) => {
                      const score = i + 1
                      const count = (data?.npsDistribution || {})[score] || 0
                      const max = Math.max(...Object.values(data?.npsDistribution || { 1: 1 }))
                      const pct = max > 0 ? Math.round((count / max) * 100) : 0
                      return (
                        <div key={score} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: NPS_COLOR(score), width: 18, textAlign: 'right' }}>{score}</span>
                          <div style={{ flex: 1, height: 16, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: NPS_COLOR(score), borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div style={card}>
                <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>NPS Trend (12 months)</h3>
                {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
                  <div>
                    {(() => {
                      const trend = data?.npsTrend || []
                      const max = Math.max(...trend.map(t => Math.abs(t.score)), 50)
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {trend.map(t => (
                            <div key={t.month} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 32 }}>{t.month}</span>
                              <div style={{ flex: 1, height: 18, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'var(--border)' }} />
                                <div style={{
                                  position: 'absolute', top: 0, bottom: 0,
                                  left: t.score >= 0 ? '50%' : `${50 - Math.abs(t.score) / max * 50}%`,
                                  width: `${Math.abs(t.score) / max * 50}%`,
                                  background: t.score >= 0 ? '#86efac' : '#f87171',
                                  borderRadius: t.score >= 0 ? '0 4px 4px 0' : '4px 0 0 4px'
                                }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: t.score >= 0 ? '#86efac' : '#f87171', width: 32, textAlign: 'right' }}>{t.score > 0 ? '+' : ''}{t.score}</span>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(data?.npsResponses || []).map(r => (
                <div key={r.id} style={card}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${NPS_COLOR(r.score)}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: NPS_COLOR(r.score), fontSize: 16, flexShrink: 0 }}>{r.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{r.memberName}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: NPS_COLOR(r.score), background: `${NPS_COLOR(r.score)}22`, borderRadius: 5, padding: '2px 7px' }}>{NPS_LABEL(r.score)}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.date}</span>
                      </div>
                      {r.comment && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{r.comment}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'csat' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(data?.csatCategories || []).map(cat => (
              <div key={cat.name} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{cat.name}</span>
                  <span style={{ fontWeight: 700, color: cat.score >= 80 ? '#86efac' : cat.score >= 60 ? '#fbbf24' : '#f87171', fontSize: 16 }}>{cat.score}%</span>
                </div>
                <div style={{ height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden', marginBottom: 8 }}>
                  <div style={{ height: '100%', width: `${cat.score}%`, background: cat.score >= 80 ? '#86efac' : cat.score >= 60 ? '#fbbf24' : '#f87171', borderRadius: 5 }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat.responses} responses · {cat.trend}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'themes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
            {(data?.themes || []).map(theme => (
              <div key={theme.name} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{theme.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: theme.sentiment === 'positive' ? '#86efac' : theme.sentiment === 'negative' ? '#f87171' : '#fbbf24', background: theme.sentiment === 'positive' ? '#86efac22' : theme.sentiment === 'negative' ? '#f8717122' : '#fbbf2422', borderRadius: 5, padding: '2px 8px', textTransform: 'capitalize' }}>{theme.sentiment}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{theme.mentions} mentions</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>"{theme.topQuote}"</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
