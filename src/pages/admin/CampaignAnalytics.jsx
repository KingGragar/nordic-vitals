import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminCampaignAnalytics } from '../../api/mlmApi'

const CHANNEL_COLOR = { Email:'#a5b4fc', SMS:'#86efac', Push:'#fbbf24', Social:'#f9a8d4', Affiliate:'#67e8f9' }

function Bar({ pct, color }) {
  return (
    <div style={{ background: 'var(--border)', borderRadius: 4, height: 8, width: '100%' }}>
      <div style={{ background: color, width: `${pct}%`, height: '100%', borderRadius: 4, transition: 'width .4s' }} />
    </div>
  )
}

export default function AdminCampaignAnalytics() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { getAdminCampaignAnalytics().then(setData).finally(() => setLoading(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const fmt  = n => n >= 1000 ? `NOK ${(n/1000).toFixed(1)}k` : `NOK ${n}`

  if (loading) return <AdminLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const maxRevenue = Math.max(...data.monthly.map(m => m.revenue), 1)
  const maxChannelRevenue = Math.max(...data.channels.map(c => c.revenue), 1)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📊 Campaign Analytics</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Multi-channel campaign ROI — spend, revenue, ROAS and conversions.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Spend',    value: fmt(data.summary.total_spend),   color: '#f87171' },
            { label: 'Total Revenue',  value: fmt(data.summary.total_revenue), color: '#86efac' },
            { label: 'ROAS',           value: `${data.summary.roas}×`,         color: '#a5b4fc' },
            { label: 'Conversions',    value: data.summary.conversions.toLocaleString(), color: '#fbbf24' },
            { label: 'CPA',            value: `NOK ${data.summary.cpa.toFixed(2)}`,      color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Channel performance */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Channel Performance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.channels.map(c => (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: CHANNEL_COLOR[c.name] || '#a5b4fc', fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>ROAS {c.roas}× · CTR {c.ctr}%</span>
                  </div>
                  <Bar pct={(c.revenue / maxChannelRevenue) * 100} color={CHANNEL_COLOR[c.name] || '#a5b4fc'} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11, color: 'var(--text2)' }}>
                    <span>Spend: {fmt(c.spend)}</span>
                    <span>Revenue: {fmt(c.revenue)}</span>
                    <span>{c.conversions.toLocaleString()} conv.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly trend */}
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Monthly Revenue Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140 }}>
              {data.monthly.map(m => {
                const revPct = (m.revenue / maxRevenue) * 100
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--text2)', fontWeight: 600 }}>{fmt(m.revenue)}</div>
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 100 }}>
                      <div style={{ background: '#a5b4fc', borderRadius: '4px 4px 0 0', height: `${revPct}%`, minHeight: 4 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>{m.month}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Top campaigns */}
        <div style={card}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Top Campaigns</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Campaign','Channel','ROAS','Revenue','Status'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text2)', fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.top_campaigns.map((c, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: (CHANNEL_COLOR[c.channel]||'#a5b4fc')+'22', color: CHANNEL_COLOR[c.channel]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{c.channel}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#86efac', fontWeight: 700 }}>{c.roas}×</td>
                    <td style={{ padding: '10px 12px' }}>{fmt(c.revenue)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: c.status === 'active' ? '#86efac22' : '#a5b4fc22', color: c.status === 'active' ? '#86efac' : '#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>{c.status}</span>
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
