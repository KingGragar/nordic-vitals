import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberReferralAnalytics } from '../../api/mlmApi'

const PERIOD_OPTS = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
]

function Bar({ value, max, color = 'var(--gold)' }) {
  return (
    <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{ width: `${max ? (value / max) * 100 : 0}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.4s' }} />
    </div>
  )
}

export default function ReferralAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    getMemberReferralAnalytics(period).then(setData).finally(() => setLoading(false))
  }, [period])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📊 Referral Analytics</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track clicks, conversions, and revenue from your referral links.</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIOD_OPTS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: period === p.value ? 'var(--gold)' : 'var(--card)', color: period === p.value ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: period === p.value ? 700 : 400 }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !data ? null : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Total Clicks', value: data.clicks.toLocaleString() },
                { label: 'Unique Visitors', value: data.uniqueVisitors.toLocaleString() },
                { label: 'Conversions', value: data.conversions.toLocaleString() },
                { label: 'Conv. Rate', value: `${data.conversionRate}%` },
                { label: 'Revenue Attr.', value: `${data.revenueAttributed.toLocaleString()} NOK` },
                { label: 'Avg Order', value: `${data.avgOrderValue.toLocaleString()} NOK` },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{kpi.label}</div>
                </div>
              ))}
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top Performing Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.topLinks.map((link, i) => (
                  <div key={link.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                      <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{link.label}</div>
                      <div style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>{link.clicks} clicks · {link.conversions} conv.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bar value={link.clicks} max={data.topLinks[0]?.clicks} />
                      <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 700, minWidth: 36, textAlign: 'right' }}>{link.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Traffic Sources</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {data.sources.map(s => (
                    <div key={s.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span>{s.name}</span><span style={{ fontWeight: 600 }}>{s.pct}%</span>
                      </div>
                      <Bar value={s.pct} max={100} color={s.color} />
                    </div>
                  ))}
                </div>
              </div>

              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Conversion Funnel</div>
                {data.funnel.map((step, i) => (
                  <div key={step.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>{step.label}</span>
                      <span style={{ fontWeight: 600 }}>{step.count.toLocaleString()}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${(step.count / data.funnel[0].count) * 100}%`, height: '100%', background: `hsl(${140 - i * 30}, 60%, 50%)`, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
