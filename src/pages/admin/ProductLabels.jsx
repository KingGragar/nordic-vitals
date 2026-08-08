import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminProductLabels, createAdminProductLabel, toggleAdminProductLabel, deleteAdminProductLabel } from '../../api/mlmApi'

const BLANK = { name: '', color: '#f59e0b', textColor: '#000', icon: '🏷️' }
const PRESET_COLORS = ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#f97316']

export default function AdminProductLabels() {
  const [labels, setLabels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    getAdminProductLabels().then(setLabels).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function handleCreate() {
    if (!form.name) return
    setSaving(true)
    const created = await createAdminProductLabel(form)
    setLabels(prev => [created, ...(prev || [])])
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function toggle(id, active) {
    await toggleAdminProductLabel(id, !active)
    setLabels(prev => prev.map(l => l.id === id ? { ...l, active: !active } : l))
  }

  async function remove(id) {
    await deleteAdminProductLabel(id)
    setLabels(prev => prev.filter(l => l.id !== id))
  }

  const active = (labels || []).filter(l => l.active).length
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏷️ Product Labels</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Manage badge labels that appear on product cards — bestseller, new, limited, sale.</div>
          </div>
          <button onClick={() => { setForm(BLANK); setModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            + New Label
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Labels', value: (labels || []).length, color: 'var(--text)' },
            { label: 'Active', value: active, color: '#86efac' },
            { label: 'Inactive', value: (labels || []).length - active, color: '#94a3b8' },
            { label: 'Assigned', value: (labels || []).reduce((s, l) => s + (l.assignedCount || 0), 0), color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !labels?.length ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No labels yet. Create your first product label.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {labels.map(l => (
              <div key={l.id} style={{ ...card, opacity: l.active ? 1 : 0.55 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 28 }}>{l.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{l.assignedCount} products assigned</div>
                  </div>
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: l.color, color: l.textColor }}>{l.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 38, height: 22, borderRadius: 11, background: l.active ? '#166534' : '#334155', position: 'relative', cursor: 'pointer' }} onClick={() => toggle(l.id, l.active)}>
                    <div style={{ position: 'absolute', top: 3, left: l.active ? 18 : 3, width: 16, height: 16, borderRadius: '50%', background: l.active ? '#86efac' : '#94a3b8', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{l.active ? 'Active' : 'Inactive'}</span>
                  <button onClick={() => remove(l.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: '#f87171', fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420 }}>
              <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 20 }}>New Product Label</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Label Name</div>
                <input value={form.name} placeholder="e.g. Bestseller" onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inp} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Icon (emoji)</div>
                <input value={form.icon} onChange={e => setForm(p => ({ ...p, icon: e.target.value }))} style={inp} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Badge Colour</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {PRESET_COLORS.map(c => (
                    <div key={c} onClick={() => setForm(p => ({ ...p, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid var(--text)' : '3px solid transparent' }} />
                  ))}
                </div>
                <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} style={{ width: 40, height: 32, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Text Colour</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['#000000', '#ffffff'].map(c => (
                    <div key={c} onClick={() => setForm(p => ({ ...p, textColor: c }))} style={{ padding: '6px 16px', borderRadius: 6, cursor: 'pointer', background: c, color: c === '#000000' ? '#fff' : '#000', fontSize: 13, fontWeight: 700, border: form.textColor === c ? '2px solid var(--gold)' : '2px solid var(--border)' }}>
                      {c === '#000000' ? 'Dark' : 'Light'}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--bg)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Preview:</span>
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700, background: form.color, color: form.textColor }}>{form.icon} {form.name || 'Label Name'}</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCreate} disabled={saving || !form.name} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Creating…' : 'Create Label'}
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
