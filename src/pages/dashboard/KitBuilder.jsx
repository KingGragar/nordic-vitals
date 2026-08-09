import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberKitBuilder } from '../../api/mlmApi'

export default function DashKitBuilder() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [kitName, setKitName] = useState('My Starter Kit')
  const [search, setSearch] = useState('')
  const [shared, setShared] = useState(false)

  useEffect(() => {
    setLoading(true)
    getMemberKitBuilder().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const pv = items.reduce((s, i) => s + i.pv * i.qty, 0)

  const addItem = (prod) => setItems(prev => {
    const ex = prev.find(p => p.id === prod.id)
    if (ex) return prev.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p)
    return [...prev, { ...prod, qty: 1 }]
  })

  const filtered = (data?.products || []).filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Kit Builder</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Assemble your own starter kit — share the link with prospects or place an order directly</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Kit Name</div>
              <input value={kitName} onChange={e => setKitName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', boxSizing: 'border-box' }} />
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Add Products</div>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', marginBottom: 12, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading products…</div> : filtered.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#6366f122,#818cf822)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💊</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>NOK {p.price} · {p.pv} PV</div>
                    </div>
                    <button onClick={() => addItem(p)} style={{ padding: '5px 12px', borderRadius: 7, border: 'none', background: '#6366f122', color: '#818cf8', cursor: 'pointer', fontWeight: 600, fontSize: 12 }}>+ Add</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>{kitName}</div>
              {items.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>Add products to build your kit</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {items.map(it => (
                    <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>NOK {it.price} · {it.pv} PV</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <button onClick={() => setItems(p => p.map(x => x.id === it.id && x.qty > 1 ? { ...x, qty: x.qty - 1 } : x))} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: 12 }}>−</button>
                        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 14, textAlign: 'center' }}>{it.qty}</span>
                        <button onClick={() => setItems(p => p.map(x => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 22, height: 22, borderRadius: 5, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)', fontSize: 12 }}>+</button>
                        <button onClick={() => setItems(p => p.filter(x => x.id !== it.id))} style={{ marginLeft: 3, width: 22, height: 22, borderRadius: 5, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>×</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {items.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total</span><span style={{ fontWeight: 700 }}>NOK {total.toFixed(0)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Total PV</span><span>{pv.toFixed(0)} PV</span>
                  </div>
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Actions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Order This Kit</button>
                  <button onClick={() => setShared(true)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>
                    {shared ? '✓ Link Copied!' : 'Share Kit Link'}
                  </button>
                  <button style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontWeight: 600 }}>Save for Later</button>
                </div>
              </div>
            )}

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Saved Kits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>…</div> : (data?.savedKits || []).map(k => (
                  <div key={k.id} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{k.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k.items} items · NOK {k.total}</div>
                    </div>
                    <button style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 11 }}>Load</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
