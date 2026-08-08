import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberAutoshipHistory } from '../../api/mlmApi'

const STATUS_COLOR = { delivered: '#86efac', processing: '#93c5fd', cancelled: '#f87171', skipped: '#fbbf24', failed: '#f87171' }
const STATUS_BG    = { delivered: '#14532d', processing: '#1e3a5f', cancelled: '#7f1d1d', skipped: '#78350f', failed: '#7f1d1d' }

export default function DashAutoshipHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    getMemberAutoshipHistory().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const runs = (data?.runs || []).filter(r => filter === 'all' || r.status === filter)
  const stats = data?.stats || {}

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📦 Autoship History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Complete history of all your recurring autoship orders.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Orders', value: stats.total ?? '—', color: 'var(--text)' },
            { label: 'Delivered', value: stats.delivered ?? '—', color: '#86efac' },
            { label: 'Total PV', value: stats.totalPv ?? '—', color: '#fbbf24' },
            { label: 'Total Spent', value: stats.totalSpent ? `€${stats.totalSpent.toLocaleString()}` : '—', color: '#93c5fd' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {['all', 'delivered', 'processing', 'skipped', 'cancelled', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 13px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'transparent', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !runs.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No autoship orders found.</div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 19, top: 0, bottom: 0, width: 2, background: 'var(--border)', zIndex: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {runs.map((run, i) => (
                <div key={run.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', paddingBottom: 16, position: 'relative', zIndex: 1 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: STATUS_BG[run.status] || 'var(--bg)', border: `2px solid ${STATUS_COLOR[run.status] || 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>
                    {run.status === 'delivered' ? '✅' : run.status === 'processing' ? '🔄' : run.status === 'skipped' ? '⏭️' : run.status === 'cancelled' ? '❌' : '⚠️'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ ...card, cursor: 'pointer' }} onClick={() => setExpanded(expanded === run.id ? null : run.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>Autoship #{run.orderRef || run.id}</div>
                          <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{run.processedAt} · {run.items?.length ?? 0} items</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>€{run.total?.toLocaleString()}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>{run.pv} PV</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                        <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: STATUS_BG[run.status], color: STATUS_COLOR[run.status], textTransform: 'capitalize' }}>{run.status}</span>
                        {run.trackingCode && <span style={{ fontSize: 12, color: 'var(--text2)' }}>📦 {run.trackingCode}</span>}
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{expanded === run.id ? '▲' : '▼'}</span>
                      </div>
                      {expanded === run.id && run.items?.length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Order items</div>
                          {run.items.map((item, j) => (
                            <div key={j} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                              <span>{item.name} <span style={{ color: 'var(--text2)' }}>×{item.qty}</span></span>
                              <span style={{ color: 'var(--text2)' }}>€{item.price}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
