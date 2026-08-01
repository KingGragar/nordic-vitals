import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { PRODUCTS } from '../../data/mock'
import { getBundles, createBundle, updateBundle, deleteBundle, toggleBundleActive } from '../../api/mlmApi'

const EMOJIS = ['🌊','✨','⚡','🏆','🌿','🧠','❤️','🔥','💎','🎯','🍃','🌸']

function pct(orig, sale) {
  if (!orig || !sale) return 0
  return Math.round((1 - sale / orig) * 100)
}

function BundleModal({ bundle, onClose, onSave }) {
  const [form, setForm] = useState(bundle ? { ...bundle } : {
    name: '', tagline: '', description: '', emoji: '🌊', badge: '',
    productIds: [], retailPrice: 0, bundlePrice: 0, memberBundlePrice: 0, totalPv: 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function toggleProduct(pid) {
    setForm(f => {
      const ids = f.productIds.includes(pid) ? f.productIds.filter(x => x !== pid) : [...f.productIds, pid]
      const selected = PRODUCTS.filter(p => ids.includes(p.id))
      return {
        ...f,
        productIds: ids,
        retailPrice: selected.reduce((s, p) => s + p.price, 0),
        totalPv: selected.reduce((s, p) => s + p.pv, 0),
      }
    })
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Bundle name is required.'); return }
    if (form.productIds.length < 2) { setError('Select at least 2 products.'); return }
    if (!form.bundlePrice || form.bundlePrice >= form.retailPrice) { setError('Bundle price must be less than retail total.'); return }
    setSaving(true); setError('')
    try {
      await onSave(form)
      onClose()
    } catch {
      setError('Save failed. Please try again.')
      setSaving(false)
    }
  }

  const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:'20px' }
  const modal = { background:'var(--navy2)',border:'1px solid var(--border)',borderRadius:'14px',padding:'28px',maxWidth:'640px',width:'100%',maxHeight:'90vh',overflowY:'auto' }
  const row = { marginBottom:'18px' }
  const label = { display:'block',fontSize:'12px',color:'var(--text2)',fontWeight:'600',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.5px' }
  const inp = { width:'100%',padding:'10px 14px',background:'var(--navy)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--cream)',fontSize:'14px',outline:'none',boxSizing:'border-box' }

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px' }}>
          <h3 style={{ color:'var(--cream)',fontSize:'18px',fontWeight:'700',margin:0 }}>
            {bundle ? 'Edit Bundle' : 'Create Bundle'}
          </h3>
          <button onClick={onClose} style={{ background:'none',border:'none',color:'var(--text2)',fontSize:'20px',cursor:'pointer' }}>✕</button>
        </div>

        {/* Emoji picker */}
        <div style={row}>
          <span style={label}>Emoji Icon</span>
          <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
            {EMOJIS.map(e => (
              <button key={e} onClick={() => set('emoji', e)} style={{
                width:'38px',height:'38px',fontSize:'20px',cursor:'pointer',borderRadius:'8px',
                border: form.emoji === e ? '2px solid var(--gold)' : '1px solid var(--border)',
                background: form.emoji === e ? 'rgba(196,148,41,0.15)' : 'var(--navy)',
              }}>{e}</button>
            ))}
          </div>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'18px' }}>
          <div>
            <span style={label}>Bundle Name *</span>
            <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nordic Starter Pack" />
          </div>
          <div>
            <span style={label}>Badge (optional)</span>
            <input style={inp} value={form.badge || ''} onChange={e => set('badge', e.target.value)} placeholder="Most Popular" />
          </div>
        </div>

        <div style={row}>
          <span style={label}>Tagline</span>
          <input style={inp} value={form.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Short selling line" />
        </div>

        <div style={row}>
          <span style={label}>Description</span>
          <textarea style={{ ...inp, minHeight:'72px', resize:'vertical' }} value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Describe what makes this bundle great..." />
        </div>

        {/* Product selector */}
        <div style={row}>
          <span style={label}>Include Products * (select 2+)</span>
          <div style={{ display:'flex',flexDirection:'column',gap:'8px' }}>
            {PRODUCTS.map(p => (
              <label key={p.id} style={{ display:'flex',alignItems:'center',gap:'10px',cursor:'pointer',padding:'10px 14px',background:'var(--navy)',borderRadius:'8px',border: form.productIds.includes(p.id) ? '1px solid var(--gold)' : '1px solid var(--border)' }}>
                <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} style={{ accentColor:'var(--gold)' }} />
                <span style={{ flex:1,color:'var(--cream)',fontSize:'13px',fontWeight:'600' }}>{p.name}</span>
                <span style={{ color:'var(--text2)',fontSize:'12px' }}>NOK {p.price} · {p.pv} PV</span>
              </label>
            ))}
          </div>
          {form.productIds.length > 0 && (
            <div style={{ marginTop:'10px',fontSize:'12px',color:'var(--gold)',fontWeight:'600' }}>
              Retail total: NOK {form.retailPrice} · Total PV: {form.totalPv}
            </div>
          )}
        </div>

        {/* Pricing */}
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'18px' }}>
          <div>
            <span style={label}>Bundle Price (NOK) *</span>
            <input style={inp} type="number" value={form.bundlePrice || ''} onChange={e => set('bundlePrice', Number(e.target.value))} placeholder="e.g. 499" />
          </div>
          <div>
            <span style={label}>Member Price (NOK)</span>
            <input style={inp} type="number" value={form.memberBundlePrice || ''} onChange={e => set('memberBundlePrice', Number(e.target.value))} placeholder="e.g. 399" />
          </div>
        </div>
        {form.bundlePrice > 0 && form.retailPrice > 0 && (
          <div style={{ fontSize:'12px',color:'#22c55e',fontWeight:'600',marginBottom:'18px' }}>
            Saves NOK {form.retailPrice - form.bundlePrice} ({pct(form.retailPrice, form.bundlePrice)}% off retail)
          </div>
        )}

        {error && <div style={{ color:'#f87171',fontSize:'13px',marginBottom:'14px' }}>{error}</div>}

        <div style={{ display:'flex',gap:'10px',justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 20px',background:'var(--navy)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text2)',fontSize:'14px',cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding:'10px 24px',background:'var(--gold)',border:'none',borderRadius:'8px',color:'#000',fontSize:'14px',fontWeight:'700',cursor:'pointer',opacity:saving?0.6:1 }}>
            {saving ? 'Saving…' : (bundle ? 'Save Changes' : 'Create Bundle')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ bundle, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  async function go() { setDeleting(true); await onConfirm(); onClose() }
  const overlay = { position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }
  const modal = { background:'var(--navy2)',border:'1px solid #f87171',borderRadius:'14px',padding:'28px',maxWidth:'400px',width:'100%',margin:'20px' }
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:'32px',textAlign:'center',marginBottom:'16px' }}>🗑️</div>
        <h3 style={{ color:'var(--cream)',fontSize:'18px',fontWeight:'700',textAlign:'center',margin:'0 0 10px' }}>Delete Bundle?</h3>
        <p style={{ color:'var(--text2)',fontSize:'14px',textAlign:'center',margin:'0 0 24px' }}>
          "{bundle.name}" will be permanently removed. Members won't be able to purchase it.
        </p>
        <div style={{ display:'flex',gap:'10px' }}>
          <button onClick={onClose} style={{ flex:1,padding:'10px',background:'var(--navy)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--text2)',cursor:'pointer',fontSize:'14px' }}>Cancel</button>
          <button onClick={go} disabled={deleting} style={{ flex:1,padding:'10px',background:'#dc2626',border:'none',borderRadius:'8px',color:'#fff',cursor:'pointer',fontSize:'14px',fontWeight:'700',opacity:deleting?0.6:1 }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Bundles() {
  const [bundles, setBundles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [delModal, setDelModal] = useState(null)
  const [toast, setToast] = useState(null)

  function showToast(msg, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    getBundles()
      .then(d => { if (Array.isArray(d)) setBundles(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(form) {
    if (modal?.bundle) {
      const updated = await updateBundle(modal.bundle.id, form)
      setBundles(bs => bs.map(b => b.id === modal.bundle.id ? { ...b, ...updated } : b))
      showToast('Bundle updated.')
    } else {
      const created = await createBundle(form)
      setBundles(bs => [...bs, created])
      showToast('Bundle created.')
    }
  }

  async function handleDelete(bundle) {
    await deleteBundle(bundle.id)
    setBundles(bs => bs.filter(b => b.id !== bundle.id))
    showToast('Bundle deleted.')
  }

  async function handleToggle(bundle) {
    const res = await toggleBundleActive(bundle.id).catch(() => null)
    if (res != null) {
      setBundles(bs => bs.map(b => b.id === bundle.id ? { ...b, active: res.active } : b))
      showToast(res.active ? 'Bundle activated.' : 'Bundle deactivated.')
    }
  }

  const active = bundles.filter(b => b.active).length
  const totalSold = bundles.reduce((s, b) => s + (b.totalSold || 0), 0)
  const avgDiscount = bundles.length
    ? Math.round(bundles.reduce((s, b) => s + pct(b.retailPrice, b.bundlePrice), 0) / bundles.length)
    : 0

  const kpiStyle = { background:'var(--navy2)',border:'1px solid var(--border)',borderRadius:'12px',padding:'18px 22px' }
  const kpiVal = { fontSize:'28px',fontWeight:'800',color:'var(--cream)',marginBottom:'4px' }
  const kpiLbl = { fontSize:'12px',color:'var(--text2)',fontWeight:'600',textTransform:'uppercase',letterSpacing:'0.5px' }

  return (
    <AdminLayout>
      <div style={{ maxWidth:'1100px',margin:'0 auto',padding:'28px 24px 60px' }}>

        {/* Header */}
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'28px',flexWrap:'wrap',gap:'12px' }}>
          <div>
            <h1 style={{ fontSize:'clamp(22px,4vw,32px)',fontWeight:'800',color:'var(--cream)',margin:0,letterSpacing:'-0.5px' }}>
              📦 Starter Packs & Bundles
            </h1>
            <p style={{ color:'var(--text2)',fontSize:'14px',margin:'6px 0 0' }}>
              Curated product bundles — shown on the Shop page with savings badges
            </p>
          </div>
          <button
            onClick={() => setModal({ bundle: null })}
            style={{ padding:'10px 22px',background:'var(--gold)',border:'none',borderRadius:'8px',color:'#000',fontSize:'14px',fontWeight:'700',cursor:'pointer' }}
          >
            + New Bundle
          </button>
        </div>

        {/* KPI cards */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'16px',marginBottom:'32px' }}>
          <div style={kpiStyle}><div style={kpiVal}>{bundles.length}</div><div style={kpiLbl}>Total Bundles</div></div>
          <div style={kpiStyle}><div style={kpiVal}>{active}</div><div style={kpiLbl}>Active on Shop</div></div>
          <div style={kpiStyle}><div style={kpiVal}>{totalSold}</div><div style={kpiLbl}>Total Sold</div></div>
          <div style={kpiStyle}><div style={kpiVal}>{avgDiscount}%</div><div style={kpiLbl}>Avg Discount</div></div>
        </div>

        {/* Bundle cards */}
        {loading ? (
          <div style={{ textAlign:'center',padding:'60px',color:'var(--text2)' }}>Loading bundles…</div>
        ) : bundles.length === 0 ? (
          <div style={{ textAlign:'center',padding:'80px',color:'var(--text2)' }}>
            <div style={{ fontSize:'48px',marginBottom:'16px' }}>📦</div>
            <p style={{ fontSize:'16px',marginBottom:'12px' }}>No bundles yet.</p>
            <button onClick={() => setModal({ bundle: null })} style={{ padding:'10px 22px',background:'var(--gold)',border:'none',borderRadius:'8px',color:'#000',fontSize:'14px',fontWeight:'700',cursor:'pointer' }}>
              Create your first bundle
            </button>
          </div>
        ) : (
          <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'20px' }}>
            {bundles.map(b => {
              const included = PRODUCTS.filter(p => b.productIds?.includes(p.id))
              const discount = pct(b.retailPrice, b.bundlePrice)
              return (
                <div key={b.id} style={{ background:'var(--navy2)',border:'1px solid var(--border)',borderRadius:'14px',overflow:'hidden',opacity: b.active ? 1 : 0.55 }}>
                  {/* Banner */}
                  <div style={{ background:'linear-gradient(135deg,#1e3a5f,#1a1a2e)',padding:'20px',position:'relative' }}>
                    <span style={{ fontSize:'40px' }}>{b.emoji}</span>
                    {b.badge && (
                      <span style={{ position:'absolute',top:'12px',right:'12px',background:'var(--gold)',color:'#000',fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'12px' }}>
                        {b.badge}
                      </span>
                    )}
                    {!b.active && (
                      <span style={{ position:'absolute',top:'12px',left:'12px',background:'#374151',color:'#9ca3af',fontSize:'11px',fontWeight:'700',padding:'3px 10px',borderRadius:'12px' }}>
                        INACTIVE
                      </span>
                    )}
                  </div>

                  <div style={{ padding:'18px 20px' }}>
                    <div style={{ fontSize:'11px',color:'var(--gold)',fontWeight:'700',textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'4px' }}>{b.tagline}</div>
                    <h3 style={{ color:'var(--cream)',fontSize:'17px',fontWeight:'800',margin:'0 0 8px' }}>{b.name}</h3>
                    <p style={{ color:'var(--text2)',fontSize:'12px',lineHeight:1.5,margin:'0 0 14px' }}>{b.description}</p>

                    {/* Included products */}
                    <div style={{ marginBottom:'14px' }}>
                      {included.map(p => (
                        <div key={p.id} style={{ display:'flex',justifyContent:'space-between',fontSize:'12px',color:'var(--text2)',padding:'3px 0',borderBottom:'1px solid var(--border)' }}>
                          <span>{p.name}</span>
                          <span>NOK {p.price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing */}
                    <div style={{ marginBottom:'16px' }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'baseline' }}>
                        <span style={{ color:'var(--text2)',fontSize:'12px',textDecoration:'line-through' }}>NOK {b.retailPrice}</span>
                        <span style={{ background:'rgba(34,197,94,0.15)',color:'#22c55e',fontSize:'12px',fontWeight:'700',padding:'2px 8px',borderRadius:'10px' }}>
                          Save {discount}%
                        </span>
                      </div>
                      <div style={{ fontSize:'22px',fontWeight:'800',color:'var(--cream)' }}>NOK {b.bundlePrice}</div>
                      {b.memberBundlePrice && (
                        <div style={{ fontSize:'12px',color:'var(--gold)',fontWeight:'600' }}>
                          ★ Members: NOK {b.memberBundlePrice}
                        </div>
                      )}
                      <div style={{ fontSize:'11px',color:'var(--text2)',marginTop:'2px' }}>{b.totalPv} PV · {b.totalSold || 0} sold</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display:'flex',gap:'8px',flexWrap:'wrap' }}>
                      <button
                        onClick={() => setModal({ bundle: b })}
                        style={{ flex:1,padding:'8px',background:'var(--navy)',border:'1px solid var(--border)',borderRadius:'8px',color:'var(--cream)',fontSize:'13px',cursor:'pointer',fontWeight:'600' }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleToggle(b)}
                        style={{ flex:1,padding:'8px',background: b.active ? 'rgba(251,191,36,0.1)' : 'rgba(34,197,94,0.1)',border:'1px solid var(--border)',borderRadius:'8px',color: b.active ? '#fbbf24' : '#22c55e',fontSize:'13px',cursor:'pointer',fontWeight:'600' }}
                      >
                        {b.active ? '⏸ Deactivate' : '▶ Activate'}
                      </button>
                      <button
                        onClick={() => setDelModal(b)}
                        style={{ padding:'8px 12px',background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'8px',color:'#f87171',fontSize:'13px',cursor:'pointer',fontWeight:'600' }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <BundleModal
          bundle={modal.bundle}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {delModal && (
        <DeleteModal
          bundle={delModal}
          onClose={() => setDelModal(null)}
          onConfirm={() => handleDelete(delModal)}
        />
      )}

      {toast && (
        <div style={{
          position:'fixed',bottom:'28px',right:'28px',
          background: toast.ok ? '#166534' : '#7f1d1d',
          border:`1px solid ${toast.ok ? '#22c55e' : '#f87171'}`,
          color:'#fff',padding:'12px 20px',borderRadius:'10px',fontSize:'14px',fontWeight:'600',zIndex:9999,
        }}>
          {toast.ok ? '✅' : '❌'} {toast.msg}
        </div>
      )}
    </AdminLayout>
  )
}
