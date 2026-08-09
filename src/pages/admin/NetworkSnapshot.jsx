import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminNetworkSnapshot } from '../../api/mlmApi'

export default function AdminNetworkSnapshot() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showCapture, setShowCapture] = useState(false)
  const [label, setLabel] = useState('')

  useEffect(() => {
    setLoading(true)
    getAdminNetworkSnapshot().then(d => { setData(d); if (d?.snapshots?.length) setSelected(d.snapshots[0]) }).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }
  const delta = (cur, prev) => {
    if (!prev) return null
    const d = cur - prev
    return { d, pct: prev ? ((d / prev) * 100).toFixed(1) : 0, up: d >= 0 }
  }

  const current = selected
  const compare = selected && data?.snapshots?.find(s => s.id !== selected.id)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Network Snapshot</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Point-in-time captures of your network structure — compare periods, export, audit rank changes</p>
          </div>
          <button onClick={() => setShowCapture(true)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Capture Now</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Saved Snapshots</div>
            {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div> : (data?.snapshots || []).map(s => (
              <div key={s.id} onClick={() => setSelected(s)} style={{ ...card, cursor: 'pointer', padding: '12px 14px', outline: selected?.id === s.id ? '2px solid #6366f1' : 'none' }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.capturedAt}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{s.totalMembers} members</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {!current ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Select a snapshot to view details</div>
            ) : (
              <>
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{current.label}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Captured {current.capturedAt}</div>
                    </div>
                    <button style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Export CSV</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
                    {[
                      { label: 'Total Members', value: current.totalMembers, key: 'totalMembers' },
                      { label: 'Active Members', value: current.activeMembers, key: 'activeMembers' },
                      { label: 'New (30d)', value: current.newMembers30d, key: 'newMembers30d' },
                      { label: 'Total Volume', value: `NOK ${(current.totalVolume || 0).toLocaleString()}`, key: 'totalVolume' },
                      { label: 'Avg Depth', value: current.avgDepth, key: 'avgDepth' },
                      { label: 'Rank Promotions', value: current.rankPromotions30d, key: 'rankPromotions30d' },
                    ].map(m => {
                      const d = compare ? delta(current[m.key], compare[m.key]) : null
                      return (
                        <div key={m.label} style={{ background: 'rgba(99,102,241,.06)', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>{m.value}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.label}</div>
                          {d && <div style={{ fontSize: 11, fontWeight: 600, color: d.up ? '#86efac' : '#f87171', marginTop: 4 }}>{d.up ? '▲' : '▼'} {Math.abs(d.pct)}% vs prev</div>}
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={card}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Rank Distribution</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(current.rankDistribution || []).map(r => (
                        <div key={r.rank}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                            <span>{r.rank}</span><span style={{ color: 'var(--text-muted)' }}>{r.count} ({r.pct}%)</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)' }}>
                            <div style={{ height: '100%', borderRadius: 3, background: '#6366f1', width: `${r.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={card}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Top Recruiters in Period</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {(current.topRecruiters || []).map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#818cf8,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.recruited} recruited</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {showCapture && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
            <div style={{ ...card, width: '100%', maxWidth: 400 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 14 }}>Capture Network Snapshot</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 14 }}>A full snapshot of your current network will be saved. This may take a few seconds.</div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Snapshot Label</label>
              <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Pre-launch baseline" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box', marginBottom: 16 }} />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowCapture(false)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={() => { setShowCapture(false); setLabel('') }} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Capture</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
