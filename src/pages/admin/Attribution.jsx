import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminAttribution } from '../../api/mlmApi'

const CHANNEL_COLOR = { organic: '#86efac', paid: '#93c5fd', email: '#fbbf24', referral: '#818cf8', social: '#fb923c', direct: '#f87171' }

export default function AdminAttribution() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [model, setModel] = useState('lastTouch')
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    getAdminAttribution().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  const channels = data?.channels || []
  const totalRevenue = channels.reduce((s, c) => s + (c.revenue || 0), 0)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Marketing Attribution</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Track which channels and campaigns drive conversions and revenue</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['7d', '30d', '90d', 'YTD'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ ...btn(period === p ? '#6366f1' : 'var(--border)', period === p ? '#fff' : 'var(--text-muted)') }}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Total Conversions', value: (data?.totalConversions || 0).toLocaleString(), color: '#93c5fd' },
            { label: 'Total Revenue', value: data?.totalRevenue || '—', color: '#86efac' },
            { label: 'Avg CAC', value: data?.avgCac || '—', color: '#fbbf24' },
            { label: 'ROAS', value: data?.roas ? `${data.roas}x` : '—', color: '#818cf8' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Attribution model:</span>
          {['lastTouch', 'firstTouch', 'linear', 'timeDecay'].map(m => (
            <button key={m} onClick={() => setModel(m)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: model === m ? '#6366f1' : 'var(--border)', color: model === m ? '#fff' : 'var(--text-muted)', textTransform: 'capitalize' }}>
              {m === 'lastTouch' ? 'Last Touch' : m === 'firstTouch' ? 'First Touch' : m === 'timeDecay' ? 'Time Decay' : 'Linear'}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Revenue by Channel</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {channels.map(ch => {
                  const pct = totalRevenue > 0 ? Math.round((ch.revenue / totalRevenue) * 100) : 0
                  return (
                    <div key={ch.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: CHANNEL_COLOR[ch.key] || '#93c5fd', display: 'inline-block', flexShrink: 0 }} />
                          {ch.name}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{ch.revenueFormatted} <strong style={{ color: CHANNEL_COLOR[ch.key] || '#93c5fd' }}>{pct}%</strong></span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: CHANNEL_COLOR[ch.key] || '#93c5fd', borderRadius: 4, transition: 'width .3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Channel Performance</h3>
            {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Channel', 'Sessions', 'Conversions', 'CVR', 'CAC'].map(h => (
                        <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {channels.map(ch => (
                      <tr key={ch.name} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: CHANNEL_COLOR[ch.key] || '#93c5fd', display: 'inline-block', flexShrink: 0 }} />
                          {ch.name}
                        </td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{(ch.sessions || 0).toLocaleString()}</td>
                        <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{ch.conversions || 0}</td>
                        <td style={{ padding: '8px', color: '#86efac', fontWeight: 700 }}>{ch.cvr || 0}%</td>
                        <td style={{ padding: '8px', color: '#fbbf24', fontWeight: 700 }}>{ch.cac || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Top Campaigns</h3>
          {loading ? <div style={{ color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Campaign', 'Channel', 'Spend', 'Conversions', 'Revenue', 'ROAS'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data?.campaigns || []).map((c, i) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--border)08' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: CHANNEL_COLOR[c.channelKey] || '#93c5fd', background: `${CHANNEL_COLOR[c.channelKey] || '#93c5fd'}22`, borderRadius: 5, padding: '2px 8px' }}>{c.channel}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.spend}</td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.conversions}</td>
                      <td style={{ padding: '10px 12px', color: '#86efac', fontWeight: 700 }}>{c.revenue}</td>
                      <td style={{ padding: '10px 12px', color: '#fbbf24', fontWeight: 700 }}>{c.roas}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
