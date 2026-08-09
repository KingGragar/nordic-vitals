import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSubscriptionBilling, retryAdminBilling } from '../../api/mlmApi'

const ST_COLOR = { active: '#86efac', failed: '#f87171', paused: '#fbbf24', cancelled: '#9ca3af', pending: '#93c5fd' }

export default function AdminSubscriptionBilling() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('failed')
  const [retrying, setRetrying] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getAdminSubscriptionBilling().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleRetry(id) {
    setRetrying(id)
    await retryAdminBilling(id)
    setData(prev => ({
      ...prev,
      failed: prev.failed.map(i => i.id===id ? { ...i, retryAt: new Date(Date.now()+3600000).toISOString(), retryCount: (i.retryCount||0)+1 } : i)
    }))
    setRetrying(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const btn = (bg, fg='#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 13 })

  const list = tab === 'failed' ? (data?.failed||[]) : (data?.upcoming||[])

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Subscription Billing</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Monitor failed billing attempts and upcoming subscription renewals</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Failed Billing', value: data?.failed?.length || 0, color: '#f87171' },
            { label: 'Revenue at Risk', value: `€${(data?.failed||[]).reduce((s,i)=>s+i.amount,0).toLocaleString()}`, color: '#fbbf24' },
            { label: 'Upcoming (7d)', value: data?.upcoming?.length || 0, color: '#93c5fd' },
            { label: 'Success Rate', value: `${data?.successRate||0}%`, color: '#86efac' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['failed','upcoming'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: tab===t ? '#ef4444' : 'var(--card)', color: tab===t ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: 600, fontSize: 14, textTransform: 'capitalize' }}>{t === 'failed' ? 'Failed Billing' : 'Upcoming Renewals'}</button>
          ))}
        </div>

        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {tab === 'failed'
                      ? ['Member','Plan','Amount','Failure Reason','Attempts','Last Tried','Next Retry',''].map(h => <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>)
                      : ['Member','Plan','Amount','Renewal Date','Status','Payment Method'].map(h => <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>)
                    }
                  </tr>
                </thead>
                <tbody>
                  {list.map((item, i) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', background: i%2===0?'transparent':'var(--row-alt,rgba(0,0,0,.03))' }}>
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:600 }}>{item.member}</div>
                        <div style={{ fontSize:11, color:'var(--text-muted)' }}>{item.email}</div>
                      </td>
                      <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:13 }}>{item.plan}</td>
                      <td style={{ padding:'12px 14px', fontWeight:700 }}>€{item.amount.toFixed(2)}</td>
                      {tab === 'failed' ? <>
                        <td style={{ padding:'12px 14px', color:'#f87171', fontSize:13 }}>{item.failureReason}</td>
                        <td style={{ padding:'12px 14px', textAlign:'center' }}>
                          <span style={{ background: item.retryCount>=3?'rgba(239,68,68,.2)':'rgba(251,191,36,.2)', color: item.retryCount>=3?'#f87171':'#fbbf24', borderRadius:5, padding:'2px 8px', fontSize:12 }}>{item.retryCount}</span>
                        </td>
                        <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:12 }}>{new Date(item.lastTriedAt).toLocaleString()}</td>
                        <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:12 }}>{item.retryAt ? new Date(item.retryAt).toLocaleString() : '—'}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <button style={{ ...btn('#6366f1'), padding:'4px 10px', fontSize:12 }} disabled={retrying===item.id} onClick={() => handleRetry(item.id)}>
                            {retrying===item.id ? '…' : 'Retry Now'}
                          </button>
                        </td>
                      </> : <>
                        <td style={{ padding:'12px 14px', fontWeight:600, color:'#93c5fd' }}>{new Date(item.renewalDate).toLocaleDateString()}</td>
                        <td style={{ padding:'12px 14px' }}>
                          <span style={{ color:ST_COLOR[item.status]||'var(--text)', background:'rgba(0,0,0,.2)', borderRadius:5, padding:'2px 8px', fontSize:12, textTransform:'capitalize' }}>{item.status}</span>
                        </td>
                        <td style={{ padding:'12px 14px', color:'var(--text-muted)', fontSize:13 }}>{item.paymentMethod}</td>
                      </>}
                    </tr>
                  ))}
                  {list.length === 0 && <tr><td colSpan={8} style={{ padding:28, textAlign:'center', color:'var(--text-muted)' }}>Nothing to show.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
