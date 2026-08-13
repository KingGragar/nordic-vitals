import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getSupplementCycles, saveSupplementCycle, deleteSupplementCycle } from '../../api/mlmApi'

const PRODUCTS = [
  { id: 1, name: 'Omega-3 Arctic Pure',     icon: '🐟', category: 'Omega & Fish Oil' },
  { id: 2, name: 'Nordic Collagen Complex', icon: '✨', category: 'Beauty & Skin' },
  { id: 3, name: 'Vitamin D3 + K2',         icon: '☀️', category: 'Vitamins' },
  { id: 4, name: 'Arctic Shilajit',         icon: '🪨', category: 'Energy' },
  { id: 5, name: 'Nordic Greens Blend',     icon: '🌿', category: 'Greens' },
  { id: 6, name: 'Focus Formula',           icon: '🧠', category: 'Focus' },
]

const PHASE_COLORS = { on: '#16a34a', off: '#6b7280', taper: '#d97706', loading: '#3b82f6' }

function WeekBar({ weeks, onWeeks, offWeeks }) {
  const total = onWeeks + offWeeks
  return (
    <div style={{ display: 'flex', gap: 3, marginTop: 10 }}>
      {Array.from({ length: Math.min(total, 12) }, (_, i) => {
        const isOn = i < onWeeks
        return (
          <div key={i} style={{ flex: 1, height: 24, borderRadius: 4, background: isOn ? '#16a34a44' : '#6b728022', border: `1px solid ${isOn ? '#16a34a' : '#6b7280'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: isOn ? '#16a34a' : '#6b7280', fontWeight: 700 }}>
            W{i + 1}
          </div>
        )
      })}
      {total > 12 && <div style={{ color: 'var(--text2)', fontSize: 11, alignSelf: 'center', paddingLeft: 4 }}>+{total - 12}</div>}
    </div>
  )
}

function CycleModal({ cycle, onClose, onSave }) {
  const isEdit = !!cycle?.id
  const [form, setForm] = useState(cycle || { name: '', products: [], onWeeks: 8, offWeeks: 4, notes: '', goal: 'general wellness' })
  const [saving, setSaving] = useState(false)

  const toggleProduct = (id) => {
    setForm(p => ({
      ...p,
      products: p.products.includes(id) ? p.products.filter(x => x !== id) : [...p.products, id]
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.products.length === 0) return alert('Select at least one supplement')
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  const F = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--card)', borderRadius: 12, padding: 28, width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 20px', color: 'var(--text)' }}>{isEdit ? 'Edit Cycle' : 'Create Cycle Protocol'}</h3>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Protocol Name *</div>
          <input required value={form.name} onChange={e => F('name', e.target.value)} placeholder="e.g. Autumn Energy Stack"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
        </label>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Goal</div>
          <select value={form.goal} onChange={e => F('goal', e.target.value)} style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }}>
            {['general wellness', 'energy & focus', 'recovery & sleep', 'fat loss', 'muscle building', 'immune support', 'skin & beauty', 'adaptogen cycling'].map(g => <option key={g}>{g}</option>)}
          </select>
        </label>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Supplements in this cycle *</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PRODUCTS.map(p => {
              const sel = form.products.includes(p.id)
              return (
                <button key={p.id} type="button" onClick={() => toggleProduct(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${sel ? '#c9a84c' : 'var(--border)'}`, background: sel ? '#c9a84c22' : 'var(--bg)', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 18 }}>{p.icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: sel ? 700 : 400 }}>{p.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <label>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>ON weeks</div>
            <input type="number" min={1} max={52} value={form.onWeeks} onChange={e => F('onWeeks', +e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
          </label>
          <label>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>OFF weeks (rest)</div>
            <input type="number" min={0} max={52} value={form.offWeeks} onChange={e => F('offWeeks', +e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 14 }} />
          </label>
        </div>

        <div style={{ marginBottom: 16, background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>Cycle preview: {form.onWeeks} weeks ON / {form.offWeeks} weeks OFF</div>
          <WeekBar weeks={form.onWeeks + form.offWeeks} onWeeks={form.onWeeks} offWeeks={form.offWeeks} />
        </div>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Notes</div>
          <textarea value={form.notes} onChange={e => F('notes', e.target.value)} rows={2} placeholder="Dosing instructions, timing, or personal notes…"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text)', fontSize: 13, resize: 'vertical' }} />
        </label>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#c9a84c', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Protocol'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SupplementCycle() {
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => { getSupplementCycles().then(setData) }, [])

  async function handleSave(form) {
    const result = await saveSupplementCycle(form)
    setData(p => ({
      ...p,
      cycles: form.id
        ? p.cycles.map(c => c.id === result.id ? result : c)
        : [result, ...p.cycles]
    }))
  }

  async function handleDelete(id) {
    await deleteSupplementCycle(id)
    setData(p => ({ ...p, cycles: p.cycles.filter(c => c.id !== id) }))
    setDeleteId(null)
  }

  if (!data) return <DashboardLayout><div style={{ padding: 32, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>

  const active = data.cycles.find(c => c.isActive)
  const today = new Date()

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text)' }}>🔄 Supplement Cycle Planner</h2>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Plan ON/OFF cycling protocols to maximise long-term supplement effectiveness</div>
          </div>
          <button onClick={() => setModal({})} style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer' }}>
            + New Protocol
          </button>
        </div>

        {active && (
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 20, border: '2px solid #c9a84c44', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: '#c9a84c', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>ACTIVE PROTOCOL</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{active.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                  Goal: <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{active.goal}</span> · {active.onWeeks}w ON / {active.offWeeks}w OFF
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>CURRENT PHASE</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: active.currentPhase === 'on' ? '#16a34a' : '#6b7280', textTransform: 'uppercase' }}>
                  {active.currentPhase === 'on' ? '✅ ON Phase' : '⏸ Rest Phase'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{active.daysLeft} days remaining</div>
              </div>
            </div>
            <WeekBar weeks={active.onWeeks + active.offWeeks} onWeeks={active.onWeeks} offWeeks={active.offWeeks} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              {active.products.map(pid => {
                const p = PRODUCTS.find(x => x.id === pid)
                return p ? (
                  <span key={pid} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: 'var(--text)' }}>
                    {p.icon} {p.name}
                  </span>
                ) : null
              })}
            </div>
          </div>
        )}

        <div style={{ background: 'var(--card)', borderRadius: 10, padding: 16, marginBottom: 20, border: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>Why cycle supplements?</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {[
              { icon: '🔬', title: 'Prevent Adaptation', desc: 'Receptors reset during rest phases, restoring full potency' },
              { icon: '💰', title: 'Reduce Cost', desc: 'Strategic breaks reduce monthly supplement spend' },
              { icon: '⚖️', title: 'Hormonal Balance', desc: 'Especially important for adaptogens like Shilajit' },
              { icon: '📈', title: 'Sustained Results', desc: 'Long-term users report better outcomes with cycling' },
            ].map(item => (
              <div key={item.title} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{item.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 14, fontSize: 16 }}>My Protocols ({data.cycles.length})</div>

        {data.cycles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--card)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
            <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 8 }}>No protocols yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 16 }}>Create your first supplement cycling protocol</div>
            <button onClick={() => setModal({})} style={{ background: '#c9a84c', color: '#000', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 700, cursor: 'pointer' }}>
              + New Protocol
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {data.cycles.map(c => (
              <div key={c.id} style={{ background: 'var(--card)', border: `1px solid ${c.isActive ? '#c9a84c66' : 'var(--border)'}`, borderRadius: 10, padding: 18, position: 'relative' }}>
                {c.isActive && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: '#c9a84c', color: '#000', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>ACTIVE</div>
                )}
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4, paddingRight: c.isActive ? 60 : 0 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, textTransform: 'capitalize' }}>🎯 {c.goal}</div>
                <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>{c.onWeeks}w ON / {c.offWeeks}w OFF · {c.onWeeks + c.offWeeks}w cycle</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {c.products.map(pid => {
                    const p = PRODUCTS.find(x => x.id === pid)
                    return p ? <span key={pid} style={{ fontSize: 16 }} title={p.name}>{p.icon}</span> : null
                  })}
                </div>
                <WeekBar weeks={Math.min(c.onWeeks + c.offWeeks, 12)} onWeeks={c.onWeeks} offWeeks={c.offWeeks} />
                {c.notes && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 10, padding: '8px 10px', background: 'var(--bg)', borderRadius: 6, lineHeight: 1.4 }}>{c.notes}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setModal(c)} style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>✏️ Edit</button>
                  <button onClick={() => setDeleteId(c.id)} style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #dc262644', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && <CycleModal cycle={modal.id ? modal : null} onClose={() => setModal(null)} onSave={handleSave} />}
      {deleteId && (
        <div style={{ position: 'fixed', inset: 0, background: '#0008', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--card)', borderRadius: 12, padding: 28, maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
            <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Delete Protocol?</div>
            <div style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>This will permanently delete your cycling protocol.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
