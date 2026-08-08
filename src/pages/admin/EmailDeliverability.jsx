import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminEmailDeliverability } from '../../api/mlmApi'

const HEALTH_COLOR = { excellent: '#86efac', good: '#fbbf24', poor: '#f87171' }

function pct(v) { return typeof v === 'number' ? `${v.toFixed(1)}%` : '—' }

export default function AdminEmailDeliverability() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  const load = useCallback(() => {
    setLoading(true)
    getAdminEmailDeliverability().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const domain = data?.domain || {}
  const campaigns = data?.campaigns || []
  const issues = data?.issues || []

  const overviewStats = [
    { label: 'Delivery Rate', value: pct(domain.deliveryRate), color: '#86efac', tip: 'Emails delivered ÷ total sent' },
    { label: 'Open Rate', value: pct(domain.openRate), color: '#fbbf24', tip: 'Unique opens ÷ delivered' },
    { label: 'Click Rate', value: pct(domain.clickRate), color: '#93c5fd', tip: 'Unique clicks ÷ delivered' },
    { label: 'Bounce Rate', value: pct(domain.bounceRate), color: domain.bounceRate > 2 ? '#f87171' : '#86efac', tip: 'Bounced ÷ total sent. Keep below 2%.' },
    { label: 'Spam Rate', value: pct(domain.spamRate), color: domain.spamRate > 0.1 ? '#f87171' : '#86efac', tip: 'Spam complaints ÷ delivered. Keep below 0.1%.' },
    { label: 'Unsubscribe Rate', value: pct(domain.unsubRate), color: domain.unsubRate > 0.5 ? '#f87171' : '#fbbf24', tip: 'Unsubscribes ÷ delivered.' },
  ]

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📬 Email Deliverability</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Monitor bounce rates, spam complaints, and sending reputation for your email domain.</div>
        </div>

        {data?.domain?.health && (
          <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: HEALTH_COLOR[domain.health], flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 700, fontSize: 14, color: HEALTH_COLOR[domain.health], textTransform: 'capitalize' }}>Domain Health: {domain.health}</span>
              <span style={{ color: 'var(--text2)', fontSize: 13, marginLeft: 12 }}>{domain.sendingDomain}</span>
            </div>
            {domain.dkim && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#14532d', color: '#86efac' }}>DKIM ✓</span>}
            {domain.spf && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#14532d', color: '#86efac' }}>SPF ✓</span>}
            {domain.dmarc && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: '#14532d', color: '#86efac' }}>DMARC ✓</span>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['overview', 'campaigns', 'issues'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid var(--border)', background: tab === t ? 'var(--gold)' : 'transparent', color: tab === t ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: tab === t ? 700 : 400, textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : tab === 'overview' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
            {overviewStats.map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>{s.tip}</div>
              </div>
            ))}
          </div>
        ) : tab === 'campaigns' ? (
          <div style={{ ...card, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Campaign', 'Sent', 'Delivered', 'Opens', 'Clicks', 'Bounces', 'Spam', 'Date'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text2)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{c.sent.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: '#86efac' }}>{pct(c.deliveryRate)}</td>
                    <td style={{ padding: '10px 12px', color: '#fbbf24' }}>{pct(c.openRate)}</td>
                    <td style={{ padding: '10px 12px', color: '#93c5fd' }}>{pct(c.clickRate)}</td>
                    <td style={{ padding: '10px 12px', color: c.bounceRate > 2 ? '#f87171' : 'var(--text)' }}>{pct(c.bounceRate)}</td>
                    <td style={{ padding: '10px 12px', color: c.spamRate > 0.1 ? '#f87171' : 'var(--text)' }}>{pct(c.spamRate)}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text2)' }}>{c.sentAt}</td>
                  </tr>
                ))}
                {!campaigns.length && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No campaign data.</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {issues.length === 0 && <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No active deliverability issues. 🎉</div>}
            {issues.map(iss => (
              <div key={iss.id} style={{ ...card, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22 }}>{iss.severity === 'critical' ? '🚨' : iss.severity === 'warning' ? '⚠️' : 'ℹ️'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{iss.title}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{iss.description}</div>
                  {iss.recommendation && <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 7, background: 'var(--bg)', fontSize: 13, color: 'var(--text2)', borderLeft: '3px solid var(--gold)' }}>💡 {iss.recommendation}</div>}
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: iss.severity === 'critical' ? '#7f1d1d' : iss.severity === 'warning' ? '#78350f' : '#1e3a5f', color: iss.severity === 'critical' ? '#f87171' : iss.severity === 'warning' ? '#fbbf24' : '#93c5fd' }}>{iss.severity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
