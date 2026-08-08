import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSalesScripts, createAdminSalesScript, deleteAdminSalesScript } from '../../api/mlmApi'

const CATEGORIES = ['prospecting', 'product', 'objection', 'recruitment']
const STAGES = ['outreach', 'presentation', 'follow_up', 'closing']
const BLANK = { title: '', category: CATEGORIES[0], stage: STAGES[0], content: '' }
const CAT_COLOR = { prospecting: '#3b82f6', product: '#10b981', objection: '#f59e0b', recruitment: '#8b5cf6' }

export default function AdminSalesScripts() {
  const [scripts, setScripts] = useState(null)
  const [loading, setLoading] = useState(true)
  const [catFilter, setCatFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminSalesScripts().then(d => { setScripts(d); if (d?.length) setSelected(d[0]) }).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.title || !form.content) return
    setSaving(true)
    const created = await createAdminSalesScript(form)
    setScripts(prev => [created, ...(prev || [])])
    setSelected(created)
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function remove(id) {
    await deleteAdminSalesScript(id)
    setScripts(prev => {
      const next = prev.filter(s => s.id !== id)
      setSelected(next[0] || null)
      return next
    })
  }

  const allScripts = scripts || []
  const filtered = catFilter === 'all' ? allScripts : allScripts.filter(s => s.category === catFilter)
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📝 Sales Scripts</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Library of approved sales scripts for member training and field use.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Script
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Scripts', value: allScripts.length, color: 'var(--text)' },
            { label: 'Total Views', value: allScripts.reduce((s, x) => s + (x.views || 0), 0).toLocaleString(), color: '#60a5fa' },
            { label: 'Total Downloads', value: allScripts.reduce((s, x) => s + (x.downloads || 0), 0).toLocaleString(), color: '#86efac' },
            { label: 'Avg Rating', value: allScripts.length ? (allScripts.reduce((s, x) => s + (x.rating || 0), 0) / allScripts.length).toFixed(1) : '—', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: catFilter === c ? 'var(--gold)' : 'transparent', color: catFilter === c ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: catFilter === c ? 700 : 400, textTransform: 'capitalize' }}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(s => (
                <div key={s.id} onClick={() => setSelected(s)} style={{ ...card, cursor: 'pointer', border: selected?.id === s.id ? '1px solid var(--gold)' : '1px solid var(--border)', background: selected?.id === s.id ? 'var(--card)' : 'var(--bg)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{s.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: CAT_COLOR[s.category] + '33', color: CAT_COLOR[s.category], textTransform: 'capitalize' }}>{s.category}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{s.stage.replace('_', ' ')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'var(--text2)' }}>
                    <span>👁 {s.views?.toLocaleString()}</span>
                    <span>⬇ {s.downloads?.toLocaleString()}</span>
                    {s.rating && <span>⭐ {s.rating}</span>}
                  </div>
                </div>
              ))}
            </div>

            {selected ? (
              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 6 }}>{selected.title}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: CAT_COLOR[selected.category] + '33', color: CAT_COLOR[selected.category], textTransform: 'capitalize' }}>{selected.category}</span>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, background: 'var(--bg)', color: 'var(--text2)', border: '1px solid var(--border)', textTransform: 'capitalize' }}>{selected.stage.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <button onClick={() => remove(selected.id)} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
                <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '16px 18px', lineHeight: 1.7, fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-wrap', marginBottom: 14 }}>{selected.content}</div>
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text2)' }}>
                  <span>👁 {selected.views?.toLocaleString()} views</span>
                  <span>⬇ {selected.downloads?.toLocaleString()} downloads</span>
                  {selected.rating && <span>⭐ {selected.rating} / 5.0</span>}
                  <span>Updated: {selected.updatedAt}</span>
                </div>
                <button onClick={() => navigator.clipboard?.writeText(selected.content)} style={{ marginTop: 14, padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                  📋 Copy Script
                </button>
              </div>
            ) : (
              <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Select a script to preview it.</div>
            )}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 540 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Sales Script</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Title</div>
                <input value={form.title} placeholder="e.g. Cold Outreach — Instagram DM" onChange={e => setForm(p => ({ ...p, title: e.target.value }))} style={inp} />
              </div>
              {[
                { label: 'Category', key: 'category', opts: CATEGORIES },
                { label: 'Stage', key: 'stage', opts: STAGES },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} style={inp}>
                    {f.opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Script Content</div>
                <textarea value={form.content} rows={8} placeholder="Write the full sales script here. Use [Name] for personalisation placeholders." onChange={e => setForm(p => ({ ...p, content: e.target.value }))} style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={handleCreate} disabled={saving || !form.title || !form.content} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create Script'}
                </button>
                <button onClick={() => setModal(false)} style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
