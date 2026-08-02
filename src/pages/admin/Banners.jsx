import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive } from '../../api/mlmApi'

const TYPE_OPTS = [
  { value: 'sale',         label: '🏷️ Sale' },
  { value: 'announcement', label: '📣 Announcement' },
  { value: 'warning',      label: '⚠️ Warning' },
  { value: 'info',         label: 'ℹ️ Info' },
]

const TYPE_COLOR = {
  sale:         '#c9a84c',
  announcement: '#3b82f6',
  warning:      '#f59e0b',
  info:         '#6366f1',
}

const PAGE_OPTS = [
  { value: 'all',     label: 'All pages' },
  { value: 'landing', label: 'Landing page only' },
  { value: 'shop',    label: 'Shop page only' },
]

const EMPTY = {
  title: '', message: '', cta_text: '', cta_url: '',
  type: 'sale', pages: ['landing', 'shop'], active: true,
  start_date: '', end_date: '',
}

function Modal({ title, banner, onSave, onClose }) {
  const [form, setForm] = useState(banner || EMPTY)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function setPages(val) {
    if (val === 'all') { setField('pages', ['landing', 'shop']); return }
    setField('pages', [val])
  }

  const pagesVal = (form.pages?.length === 2 || form.pages?.includes('all')) ? 'all'
    : form.pages?.[0] || 'all'

  async function handleSave() {
    if (!form.title.trim()) { setErr('Title is required'); return }
    if (!form.message.trim()) { setErr('Message is required'); return }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch {
      setErr('Failed to save banner')
      setSaving(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:14, padding:28, width:'100%', maxWidth:520 }}>
        <h3 style={{ margin:'0 0 20px', color:'var(--gold)' }}>{title}</h3>

        <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Title *</label>
        <input value={form.title} onChange={e => setField('title', e.target.value)}
          placeholder="e.g. Summer Sale — 20% Off Everything!"
          style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14, marginBottom:14 }} />

        <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Message *</label>
        <textarea value={form.message} onChange={e => setField('message', e.target.value)}
          rows={2} placeholder="Short description shown alongside the title"
          style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14, marginBottom:14, resize:'vertical' }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Type</label>
            <select value={form.type} onChange={e => setField('type', e.target.value)}
              style={{ width:'100%', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }}>
              {TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Show on</label>
            <select value={pagesVal} onChange={e => setPages(e.target.value)}
              style={{ width:'100%', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }}>
              {PAGE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>CTA Button text</label>
            <input value={form.cta_text} onChange={e => setField('cta_text', e.target.value)}
              placeholder="e.g. Shop Now"
              style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>CTA URL</label>
            <input value={form.cta_url} onChange={e => setField('cta_url', e.target.value)}
              placeholder="e.g. /shop"
              style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }} />
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>Start date</label>
            <input type="date" value={form.start_date} onChange={e => setField('start_date', e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text2)', display:'block', marginBottom:4 }}>End date</label>
            <input type="date" value={form.end_date} onChange={e => setField('end_date', e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', background:'var(--navy)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text)', padding:'8px 12px', fontSize:14 }} />
          </div>
        </div>

        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginBottom:18, fontSize:14 }}>
          <input type="checkbox" checked={form.active} onChange={e => setField('active', e.target.checked)} />
          <span style={{ color:'var(--text)' }}>Active immediately</span>
        </label>

        {err && <p style={{ color:'#f87171', fontSize:12, margin:'0 0 12px' }}>{err}</p>}

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text)', cursor:'pointer', fontSize:14 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', background:'var(--gold)', color:'#000', fontWeight:700, cursor:'pointer', fontSize:14, opacity:saving?0.6:1 }}>
            {saving ? 'Saving…' : 'Save Banner'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewBar({ banner }) {
  if (!banner) return null
  const c = TYPE_COLOR[banner.type] || '#6366f1'
  return (
    <div style={{ background: banner.type==='sale'?'#92400e':banner.type==='warning'?'#78350f':banner.type==='announcement'?'#1e3a5f':'#0f3460', borderRadius:8, padding:'10px 16px', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', border:`1px solid ${c}`, marginBottom:16 }}>
      <span style={{ fontWeight:700, color:'#fff', fontSize:13 }}>{banner.title}</span>
      <span style={{ color:'rgba(255,255,255,0.8)', fontSize:13 }}>{banner.message}</span>
      {banner.cta_text && <span style={{ background:c, color:'#000', fontWeight:700, fontSize:11, padding:'3px 12px', borderRadius:6 }}>{banner.cta_text}</span>}
      <span style={{ marginLeft:'auto', color:'rgba(255,255,255,0.5)', fontSize:18 }}>×</span>
    </div>
  )
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [preview, setPreview] = useState(null)

  function load() {
    setLoading(true)
    getAdminBanners().then(d => { if (Array.isArray(d)) setBanners(d) }).catch(() => {}).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function handleSave(form) {
    if (modal.id) {
      await updateBanner(modal.id, form)
    } else {
      await createBanner({ ...form, created_by: 'Gary' })
    }
    load()
  }

  async function handleDelete() {
    await deleteBanner(deleteId)
    setDeleteId(null)
    load()
  }

  async function handleToggle(id, active) {
    await toggleBannerActive(id, !active)
    load()
  }

  const total  = banners.length
  const active = banners.filter(b => b.active).length
  const today  = new Date().toISOString().slice(0, 10)
  const live   = banners.filter(b => b.active && (!b.start_date || b.start_date <= today) && (!b.end_date || b.end_date >= today)).length

  return (
    <AdminLayout>
      <div style={{ padding:'24px 28px', maxWidth:900 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, color:'var(--gold)' }}>📢 Storefront Banners</h1>
            <p style={{ margin:'4px 0 0', color:'var(--text2)', fontSize:13 }}>Promotional banners shown on Landing and Shop pages</p>
          </div>
          <button onClick={() => setModal({})} style={{ padding:'9px 20px', borderRadius:8, border:'none', background:'var(--gold)', color:'#000', fontWeight:700, cursor:'pointer', fontSize:14 }}>
            + New Banner
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Total', val:total },
            { label:'Enabled', val:active },
            { label:'Live Now', val:live },
          ].map(({ label, val }) => (
            <div key={label} style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 18px' }}>
              <div style={{ fontSize:24, fontWeight:800, color:'var(--gold)' }}>{val}</div>
              <div style={{ fontSize:12, color:'var(--text2)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Preview panel */}
        {preview && (
          <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <span style={{ fontSize:12, color:'var(--text2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>Preview</span>
              <button onClick={() => setPreview(null)} style={{ background:'none', border:'none', color:'var(--text2)', cursor:'pointer', fontSize:18 }}>×</button>
            </div>
            <PreviewBar banner={preview} />
            <p style={{ margin:'6px 0 0', fontSize:11, color:'var(--text2)' }}>This is how the banner looks on the storefront (dismissable by visitors).</p>
          </div>
        )}

        {/* Banner list */}
        {loading ? (
          <div style={{ textAlign:'center', color:'var(--text2)', padding:40 }}>Loading banners…</div>
        ) : banners.length === 0 ? (
          <div style={{ textAlign:'center', color:'var(--text2)', padding:60 }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📢</div>
            <div style={{ fontWeight:700, marginBottom:6 }}>No banners yet</div>
            <div style={{ fontSize:13 }}>Create a banner to promote sales, announcements, or warnings on your storefront.</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {banners.map(b => {
              const c = TYPE_COLOR[b.type] || '#6366f1'
              const today2 = new Date().toISOString().slice(0, 10)
              const isLive = b.active && (!b.start_date || b.start_date <= today2) && (!b.end_date || b.end_date >= today2)
              const pagesLabel = (b.pages?.length === 2 || b.pages?.includes('all')) ? 'All pages' : b.pages?.includes('landing') ? 'Landing' : 'Shop'
              return (
                <div key={b.id} style={{ background:'var(--navy2)', border:`1px solid ${b.active ? c + '55' : 'var(--border)'}`, borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'flex-start', gap:14 }}>
                  {/* Color swatch */}
                  <div style={{ width:4, borderRadius:4, alignSelf:'stretch', background:b.active ? c : 'var(--border)', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                      <span style={{ fontWeight:700, fontSize:15, color:'var(--text)' }}>{b.title}</span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, fontWeight:700,
                        background: isLive ? '#16a34a22' : b.active ? '#c9a84c22' : 'var(--navy)',
                        color: isLive ? '#4ade80' : b.active ? 'var(--gold)' : 'var(--text2)',
                      }}>
                        {isLive ? '● Live' : b.active ? '◌ Scheduled' : '○ Inactive'}
                      </span>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:10, background:c+'22', color:c, fontWeight:600 }}>
                        {TYPE_OPTS.find(t => t.value === b.type)?.label || b.type}
                      </span>
                      <span style={{ fontSize:11, color:'var(--text2)' }}>{pagesLabel}</span>
                    </div>
                    <div style={{ fontSize:13, color:'var(--text2)', marginBottom:6 }}>{b.message}</div>
                    <div style={{ display:'flex', gap:16, fontSize:11, color:'var(--text2)', flexWrap:'wrap' }}>
                      {b.cta_text && <span>CTA: <b style={{ color:'var(--text)' }}>{b.cta_text}</b> → {b.cta_url}</span>}
                      {b.start_date && <span>From: {b.start_date}</span>}
                      {b.end_date   && <span>Until: {b.end_date}</span>}
                      <span>{b.impression_count ?? 0} impressions · {b.dismiss_count ?? 0} dismissed</span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                    <button onClick={() => setPreview(b)} title="Preview"
                      style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:'none', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>👁️</button>
                    <button onClick={() => setModal({ ...b })} title="Edit"
                      style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:'none', color:'var(--text2)', cursor:'pointer', fontSize:13 }}>✏️</button>
                    <button onClick={() => handleToggle(b.id, b.active)} title={b.active ? 'Deactivate' : 'Activate'}
                      style={{ padding:'5px 10px', borderRadius:6, border:'1px solid var(--border)', background:b.active?'#991b1b22':'#16653022', color:b.active?'#f87171':'#4ade80', cursor:'pointer', fontSize:13 }}>
                      {b.active ? '⏸' : '▶'}
                    </button>
                    <button onClick={() => setDeleteId(b.id)} title="Delete"
                      style={{ padding:'5px 10px', borderRadius:6, border:'1px solid #7f1d1d', background:'none', color:'#f87171', cursor:'pointer', fontSize:13 }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <Modal
          title={modal.id ? 'Edit Banner' : 'New Banner'}
          banner={modal.id ? modal : null}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:14, padding:28, maxWidth:380, width:'100%' }}>
            <h3 style={{ margin:'0 0 10px', color:'#f87171' }}>Delete Banner?</h3>
            <p style={{ margin:'0 0 20px', color:'var(--text2)', fontSize:14 }}>This banner will be permanently removed from the storefront.</p>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)', background:'none', color:'var(--text)', cursor:'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'#991b1b', color:'#fff', cursor:'pointer', fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
