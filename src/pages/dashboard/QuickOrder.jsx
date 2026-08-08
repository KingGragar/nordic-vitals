import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberQuickOrderCatalog, submitMemberQuickOrder } from '../../api/mlmApi'

export default function MemberQuickOrder() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState({})
  const [tab, setTab] = useState('favorites')
  const [submitting, setSubmitting] = useState(false)
  const [confirmed, setConfirmed] = useState(null)

  useEffect(() => { getMemberQuickOrderCatalog().then(setData).finally(() => setLoading(false)) }, [])

  function setQty(id, qty) {
    setCart(prev => {
      if (qty <= 0) { const n = { ...prev }; delete n[id]; return n }
      return { ...prev, [id]: qty }
    })
  }

  async function handleSubmit() {
    const items = Object.entries(cart).map(([id, qty]) => ({ id, qty }))
    if (!items.length) return
    setSubmitting(true)
    const res = await submitMemberQuickOrder(items)
    setConfirmed(res)
    setCart({})
    setSubmitting(false)
  }

  const totalItems = Object.values(cart).reduce((s, q) => s + q, 0)
  const allProducts = [...(data?.favorites || []), ...(data?.allProducts || []).filter(p => !(data?.favorites || []).some(f => f.id === p.id))]
  const listItems = tab === 'favorites' ? (data?.favorites || []) : tab === 'recent' ? (data?.recentOrders || []).flatMap(o => o.items) : allProducts

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inCart = Object.keys(cart).length

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⚡ Quick Order</div>
        <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 22 }}>Reorder your favourite products fast — no browsing required.</div>

        {confirmed && (
          <div style={{ ...card, background: '#14532d', border: '1px solid #86efac', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 28 }}>✅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#86efac', fontSize: 15 }}>Order confirmed — {confirmed.orderId}</div>
              <div style={{ color: '#86efac', fontSize: 13, marginTop: 2, opacity: 0.8 }}>You'll receive an email confirmation shortly.</div>
            </div>
            <button onClick={() => setConfirmed(null)} style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, border: '1px solid #86efac', background: 'transparent', color: '#86efac', fontSize: 12, cursor: 'pointer' }}>Dismiss</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {[{ id: 'favorites', label: '⭐ Favourites' }, { id: 'recent', label: '🕓 Recent Orders' }, { id: 'all', label: '📦 All Products' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 18px', borderRadius: 20, border: '1px solid var(--border)', background: tab === t.id ? 'var(--gold)' : 'transparent', color: tab === t.id ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {tab === 'recent' ? (
                (data?.recentOrders || []).map(ord => (
                  <div key={ord.orderId} style={card}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: 'var(--text2)' }}>
                      Order {ord.orderId} · {ord.date}
                    </div>
                    {ord.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)' }}>€{item.memberPrice?.toFixed(2)} · {item.pv} PV</div>
                        </div>
                        {item.inStock ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => setQty(item.id, (cart[item.id] || 0) - 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700 }}>{cart[item.id] || 0}</span>
                            <button onClick={() => setQty(item.id, (cart[item.id] || 0) + 1)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--gold)', color: '#000', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#f87171', padding: '3px 8px', borderRadius: 20, background: '#7f1d1d' }}>Out of stock</span>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                listItems.map(p => (
                  <div key={p.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: p.inStock === false ? 0.5 : 1 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                        €{p.memberPrice?.toFixed(2)} member · {p.pv} PV
                        {p.timesOrdered ? <span style={{ marginLeft: 10 }}>Ordered {p.timesOrdered}× · Last: {p.lastOrdered}</span> : null}
                      </div>
                    </div>
                    {p.inStock === false ? (
                      <span style={{ fontSize: 11, color: '#f87171', padding: '3px 8px', borderRadius: 20, background: '#7f1d1d' }}>Out of stock</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button onClick={() => setQty(p.id, (cart[p.id] || 0) - 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{cart[p.id] || 0}</span>
                        <button onClick={() => setQty(p.id, (cart[p.id] || 0) + 1)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'var(--gold)', color: '#000', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ position: 'sticky', top: 80 }}>
              <div style={card}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Order Summary</div>
                {inCart === 0 ? (
                  <div style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No items added yet.</div>
                ) : (
                  <>
                    {Object.entries(cart).map(([id, qty]) => {
                      const prod = allProducts.find(p => p.id === id)
                      if (!prod) return null
                      return (
                        <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                          <span style={{ color: 'var(--text2)' }}>{prod.name} × {qty}</span>
                          <span style={{ fontWeight: 600 }}>€{(prod.memberPrice * qty).toFixed(2)}</span>
                        </div>
                      )
                    })}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15 }}>
                      <span>Total</span>
                      <span>€{Object.entries(cart).reduce((s, [id, qty]) => {
                        const p = allProducts.find(x => x.id === id)
                        return s + (p?.memberPrice || 0) * qty
                      }, 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', textAlign: 'right', marginBottom: 14 }}>
                      {Object.entries(cart).reduce((s, [id, qty]) => {
                        const p = allProducts.find(x => x.id === id)
                        return s + (p?.pv || 0) * qty
                      }, 0)} PV total
                    </div>
                  </>
                )}
                <button onClick={handleSubmit} disabled={submitting || inCart === 0} style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: inCart > 0 ? 'var(--gold)' : 'var(--border)', color: inCart > 0 ? '#000' : 'var(--text2)', fontWeight: 700, fontSize: 14, cursor: inCart > 0 ? 'pointer' : 'default', opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Placing Order…' : inCart > 0 ? `Place Order (${totalItems} item${totalItems !== 1 ? 's' : ''})` : 'Add items to order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
