import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminBundleBuilder } from '../../api/mlmApi'

export default function AdminBundleBuilder() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [bundleName, setBundleName] = useState('')
  const [discount, setDiscount] = useState(10)
  const [tab, setTab] = useState('build')

  useEffect(() => {
    setLoading(true)
    getAdminBundleBuilder().then(d => { setData(d); setLoading(false) })
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const discounted = total * (1 - discount / 100)
  const margin = items.reduce((s, i) => s + (i.price - i.cost) * i.qty, 0)

  const addItem = (prod) => {
    setItems(prev => {
      const ex = prev.find(p => p.id === prod.id)
      if (ex) return prev.map(p => p.id === prod.id ? { ...p, qty: p.qty + 1 } : p)
      return [...prev, { ...prod, qty: 1 }]
    })
  }

  const removeItem = (id) => setItems(prev => prev.filter(p => p.id !== id))

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Bundle Builder</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Compose product bundles, set discounts, and publish to the store</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['build', 'saved'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 7, border: '1px solid var(--border)', background: tab === t ? '#6366f1' : 'transparent', color: tab === t ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: 600, textTransform: 'capitalize' }}>{t === 'build' ? 'Build New' : 'Saved Bundles'}</button>
            ))}
          </div>
        </div>

        {tab === 'build' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Bundle Details</div>
                <input value={bundleName} onChange={e => setBundleName(e.target.value)} placeholder="Bundle Name (e.g. Starter Pack Pro)" style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--input)', color: 'var(--text)', marginBottom: 10, boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)' }}>Bundle Discount:</label>
                  <input type="range" min={0} max={50} value={discount} onChange={e => setDiscount(+e.target.value)} style={{ flex: 1 }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#818cf8', minWidth: 36 }}>{discount}%</span>
                </div>
              </div>

              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Add Products</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 10 }}>
                  {loading ? <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading products…</div> : (data?.products || []).map(p => (
                    <div key={p.id} onClick={() => addItem(p)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: '#818cf8' }}>NOK {p.price}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Stock: {p.stock}</div>
                      <button style={{ marginTop: 6, padding: '4px 10px', borderRadius: 6, border: 'none', background: '#6366f122', color: '#818cf8', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Bundle Contents</div>
                {items.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>Click products on the left to add them</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {items.map(it => (
                      <div key={it.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>NOK {it.price} × {it.qty}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => setItems(p => p.map(x => x.id === it.id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>−</button>
                          <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{it.qty}</span>
                          <button onClick={() => setItems(p => p.map(x => x.id === it.id ? { ...x, qty: x.qty + 1 } : x))} style={{ width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', color: 'var(--text)' }}>+</button>
                          <button onClick={() => removeItem(it.id)} style={{ marginLeft: 4, width: 24, height: 24, borderRadius: 6, border: 'none', background: '#f8717122', color: '#f87171', cursor: 'pointer' }}>×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.length > 0 && (
                <div style={card}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Pricing Summary</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Full Price</span><span>NOK {total.toFixed(0)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span style={{ color: 'var(--text-muted)' }}>Discount ({discount}%)</span><span style={{ color: '#f87171' }}>−NOK {(total - discounted).toFixed(0)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px solid var(--border)', paddingTop: 8 }}><span>Bundle Price</span><span style={{ color: '#86efac' }}>NOK {discounted.toFixed(0)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}><span>Est. Margin</span><span>NOK {margin.toFixed(0)}</span></div>
                  </div>
                  <button style={{ width: '100%', marginTop: 14, padding: '10px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>Publish Bundle</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (data?.savedBundles || []).map(b => (
              <div key={b.id} style={card}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{b.items} items · {b.discount}% off · NOK {b.price}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: b.active ? '#86efac' : '#94a3b8', background: b.active ? '#86efac22' : '#94a3b822', borderRadius: 5, padding: '2px 8px' }}>{b.active ? 'Active' : 'Draft'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.sold} sold</span>
                    <button style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12 }}>Edit</button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(b.productNames || []).map((n, i) => <span key={i} style={{ fontSize: 11, background: 'rgba(99,102,241,.1)', color: '#818cf8', borderRadius: 5, padding: '2px 8px' }}>{n}</span>)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
