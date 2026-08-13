import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getSmartShoppingList, addShoppingListItem, removeShoppingListItem, clearShoppingList } from '../../api/mlmApi'

const GOALS = [
  { key: 'energy',   label: 'Energy & Focus',   icon: '⚡', recs: [1, 3, 4, 6] },
  { key: 'beauty',   label: 'Skin & Beauty',    icon: '✨', recs: [2, 3, 5] },
  { key: 'wellness', label: 'General Wellness',  icon: '💚', recs: [1, 3, 5, 6] },
  { key: 'muscle',   label: 'Muscle & Recovery', icon: '💪', recs: [1, 4, 5, 6] },
  { key: 'immune',   label: 'Immune Support',    icon: '🛡', recs: [3, 5, 6] },
  { key: 'sleep',    label: 'Sleep & Calm',      icon: '🌙', recs: [3, 5, 6] },
]

const ALL_PRODUCTS = [
  { id: 1, name: 'Omega-3 Arctic Pure',     icon: '🐟', memberPrice: 279, pv: 35, category: 'Omega & Fish Oil' },
  { id: 2, name: 'Nordic Collagen Complex', icon: '✨', memberPrice: 339, pv: 43, category: 'Beauty & Skin' },
  { id: 3, name: 'Vitamin D3 + K2',         icon: '☀️', memberPrice: 199, pv: 25, category: 'Vitamins' },
  { id: 4, name: 'Arctic Shilajit',         icon: '🪨', memberPrice: 479, pv: 60, category: 'Energy' },
  { id: 5, name: 'Nordic Greens Blend',     icon: '🌿', memberPrice: 299, pv: 38, category: 'Greens' },
  { id: 6, name: 'Focus Formula',           icon: '🧠', memberPrice: 369, pv: 46, category: 'Focus' },
]

function ProductCard({ product, qty, onAdd, onRemove, onQtyChange, recommended }) {
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${recommended ? '#c9a84c66' : 'var(--border)'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 32 }}>{product.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>{product.name}</div>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{product.category}</div>
        <div style={{ fontSize: 13, color: '#c9a84c', fontWeight: 700, marginTop: 2 }}>NOK {product.memberPrice} · {product.pv} PV</div>
      </div>
      {qty > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => onRemove(product.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontWeight: 700, color: 'var(--text)', minWidth: 20, textAlign: 'center' }}>{qty}</span>
          <button onClick={() => onAdd(product.id)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        </div>
      ) : (
        <button onClick={() => onAdd(product.id)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
          + Add
        </button>
      )}
    </div>
  )
}

export default function ShoppingList() {
  const [data, setData] = useState(null)
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [shareText, setShareText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { getSmartShoppingList().then(setData) }, [])

  async function handleAdd(productId) {
    const item = await addShoppingListItem(productId)
    setData(p => {
      const existing = p.items.find(i => i.productId === productId)
      if (existing) return { ...p, items: p.items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i) }
      return { ...p, items: [...p.items, item] }
    })
  }

  async function handleRemove(productId) {
    const existing = data.items.find(i => i.productId === productId)
    if (!existing) return
    if (existing.qty <= 1) {
      await removeShoppingListItem(productId)
      setData(p => ({ ...p, items: p.items.filter(i => i.productId !== productId) }))
    } else {
      setData(p => ({ ...p, items: p.items.map(i => i.productId === productId ? { ...i, qty: i.qty - 1 } : i) }))
    }
  }

  async function handleClear() {
    await clearShoppingList()
    setData(p => ({ ...p, items: [] }))
  }

  function buildShareText() {
    const lines = data.items.map(i => {
      const p = ALL_PRODUCTS.find(x => x.id === i.productId)
      return p ? `• ${p.name} ×${i.qty} (NOK ${p.memberPrice * i.qty})` : ''
    }).filter(Boolean)
    const total = data.items.reduce((s, i) => { const p = ALL_PRODUCTS.find(x => x.id === i.productId); return s + (p ? p.memberPrice * i.qty : 0) }, 0)
    const text = `My Nordic Vitals Shopping List:\n${lines.join('\n')}\nTotal: NOK ${total.toLocaleString()}\n\nhttps://nordic-vitals.vercel.app`
    setShareText(text)
  }

  function copyList() {
    navigator.clipboard.writeText(shareText).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!data) return <DashboardLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>

  const totalNok = data.items.reduce((s, i) => { const p = ALL_PRODUCTS.find(x => x.id === i.productId); return s + (p ? p.memberPrice * i.qty : 0) }, 0)
  const totalPv = data.items.reduce((s, i) => { const p = ALL_PRODUCTS.find(x => x.id === i.productId); return s + (p ? p.pv * i.qty : 0) }, 0)
  const totalItems = data.items.reduce((s, i) => s + i.qty, 0)

  const recIds = selectedGoal ? (GOALS.find(g => g.key === selectedGoal)?.recs || []) : []
  const getQty = (id) => data.items.find(i => i.productId === id)?.qty || 0

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text)' }}>🛒 Smart Shopping List</h2>
        <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>Build your optimal supplement order — get AI goal recommendations or browse all products</div>

        {totalItems > 0 && (
          <div style={{ background: 'var(--card)', border: '2px solid #c9a84c44', borderRadius: 12, padding: 18, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>ITEMS</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{totalItems}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>TOTAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#c9a84c' }}>NOK {totalNok.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>PV EARNED</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>{totalPv} PV</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { buildShareText(); setShareText(p => p || ' ') }} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                  📋 Share List
                </button>
                <button onClick={handleClear} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #dc262644', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>
                  🗑 Clear All
                </button>
                <a href="/shop" style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  Shop Now →
                </a>
              </div>
            </div>
            {data.items.map(item => {
              const p = ALL_PRODUCTS.find(x => x.id === item.productId)
              if (!p) return null
              return (
                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, color: 'var(--text)' }}>{p.icon} {p.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>×{item.qty}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>NOK {(p.memberPrice * item.qty).toLocaleString()}</span>
                    <button onClick={() => handleRemove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>×</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {shareText && (
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8, fontSize: 13 }}>📋 Share your list</div>
            <textarea readOnly value={shareText} rows={6} style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 12, resize: 'none' }} />
            <button onClick={copyList} style={{ marginTop: 8, padding: '6px 16px', borderRadius: 7, border: '1px solid var(--border)', background: copied ? '#16a34a' : 'var(--bg)', color: copied ? '#fff' : 'var(--text)', cursor: 'pointer', fontWeight: copied ? 700 : 400 }}>
              {copied ? '✅ Copied!' : 'Copy to clipboard'}
            </button>
          </div>
        )}

        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12, fontSize: 15 }}>Goal-Based Recommendations</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {GOALS.map(g => (
            <button key={g.key} onClick={() => setSelectedGoal(selectedGoal === g.key ? null : g.key)}
              style={{ padding: '8px 14px', borderRadius: 20, border: `1px solid ${selectedGoal === g.key ? '#c9a84c' : 'var(--border)'}`, background: selectedGoal === g.key ? '#c9a84c22' : 'var(--card)', color: selectedGoal === g.key ? '#c9a84c' : 'var(--text)', cursor: 'pointer', fontWeight: selectedGoal === g.key ? 700 : 400, fontSize: 13 }}>
              {g.icon} {g.label}
            </button>
          ))}
        </div>

        {selectedGoal && (
          <div style={{ background: 'var(--card)', borderRadius: 10, padding: 14, marginBottom: 20, border: '1px solid #c9a84c44' }}>
            <div style={{ fontSize: 12, color: '#c9a84c', fontWeight: 700, marginBottom: 10 }}>
              ✨ Recommended for {GOALS.find(g => g.key === selectedGoal)?.label}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {recIds.map(id => {
                const p = ALL_PRODUCTS.find(x => x.id === id)
                return p ? <span key={id} style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid #c9a84c44', borderRadius: 8, padding: '4px 10px', color: 'var(--text)' }}>{p.icon} {p.name}</span> : null
              })}
            </div>
            <button onClick={() => { recIds.forEach(id => { if (!getQty(id)) handleAdd(id) }) }} style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Add All Recommended
            </button>
          </div>
        )}

        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 12, fontSize: 15 }}>All Products</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
          {ALL_PRODUCTS.map(p => (
            <ProductCard key={p.id} product={p} qty={getQty(p.id)} onAdd={handleAdd} onRemove={handleRemove} recommended={recIds.includes(p.id)} />
          ))}
        </div>

        {totalPv >= 100 && (
          <div style={{ marginTop: 20, background: '#16a34a11', border: '1px solid #16a34a44', borderRadius: 10, padding: 14, textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: '#16a34a', fontSize: 15 }}>🎉 You qualify for autoship PV this month!</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{totalPv} PV in cart · Autoship threshold is 100 PV</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
