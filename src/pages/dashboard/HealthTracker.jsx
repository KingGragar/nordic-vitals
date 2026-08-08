import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberHealthLog, addMemberHealthLog, deleteMemberHealthLog } from '../../api/mlmApi'

const EMOJI = { 1: '😞', 2: '😐', 3: '🙂', 4: '😊', 5: '😄' }
const PRODUCTS = ['Omega-3 2000mg', 'D3/K2 Complex', 'Collagen Peptides', 'Nordic Protein Blend', 'Magnesium Complex', 'B12 + Folate']

function AddLogModal({ onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ date: today, mood: 4, energy: 4, sleep: 7, products: [], notes: '' })
  const [saving, setSaving] = useState(false)
  const set = k => v => setForm(f => ({ ...f, [k]: v }))
  const inp = { width: '100%', padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }
  const lbl = { fontSize: 12, color: 'var(--text2)', marginBottom: 4, display: 'block' }

  function toggleProduct(p) {
    setForm(f => ({ ...f, products: f.products.includes(p) ? f.products.filter(x => x !== p) : [...f.products, p] }))
  }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Log Today's Check-In</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Date</label>
            <input type="date" value={form.date} onChange={e => set('date')(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Mood {EMOJI[form.mood]}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set('mood')(n)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `2px solid ${form.mood === n ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--bg)', fontSize: 18, cursor: 'pointer' }}>
                  {EMOJI[n]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Energy {EMOJI[form.energy]}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" onClick={() => set('energy')(n)} style={{ flex: 1, padding: '8px 0', borderRadius: 7, border: `2px solid ${form.energy === n ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--bg)', fontSize: 18, cursor: 'pointer' }}>
                  {EMOJI[n]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Sleep (hours): {form.sleep}h</label>
            <input type="range" min={3} max={12} step={0.5} value={form.sleep} onChange={e => set('sleep')(parseFloat(e.target.value))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={lbl}>Products Taken Today</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRODUCTS.map(p => (
                <button key={p} type="button" onClick={() => toggleProduct(p)} style={{ padding: '5px 12px', borderRadius: 20, border: `1px solid ${form.products.includes(p) ? 'var(--gold)' : 'var(--border)'}`, background: form.products.includes(p) ? 'rgba(212,175,55,0.15)' : 'transparent', color: form.products.includes(p) ? 'var(--gold)' : 'var(--text)', fontSize: 12, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes')(e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} placeholder="How are you feeling? Any notable changes?" />
          </div>
          <button type="submit" disabled={saving} style={{ padding: 10, background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function HealthTracker() {
  const [log, setLog] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    getMemberHealthLog().then(setLog).finally(() => setLoading(false))
  }, [])

  async function handleAdd(entry) {
    const created = await addMemberHealthLog(entry)
    setLog(l => [created, ...(l || [])])
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    await deleteMemberHealthLog(id)
    setLog(l => l.filter(x => x.id !== id))
  }

  const avgMood = log && log.length ? (log.reduce((s, e) => s + e.mood, 0) / log.length).toFixed(1) : '—'
  const avgEnergy = log && log.length ? (log.reduce((s, e) => s + e.energy, 0) / log.length).toFixed(1) : '—'
  const avgSleep = log && log.length ? (log.reduce((s, e) => s + e.sleep, 0) / log.length).toFixed(1) : '—'

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>❤️ Health Tracker</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Track your mood, energy, sleep, and product usage over time.</div>
          </div>
          <button onClick={() => setModal(true)} style={{ padding: '9px 18px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            + Log Today
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Entries', value: (log || []).length },
            { label: 'Avg Mood', value: `${avgMood}/5` },
            { label: 'Avg Energy', value: `${avgEnergy}/5` },
            { label: 'Avg Sleep', value: `${avgSleep}h` },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : !log || log.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No entries yet. Log your first check-in.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {log.map(entry => (
              <div key={entry.id} style={{ ...card, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>📅 {entry.date}</div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <span title="Mood">{EMOJI[entry.mood]} <span style={{ color: 'var(--text2)', fontSize: 11 }}>mood</span></span>
                    <span title="Energy">⚡ {entry.energy}/5 <span style={{ color: 'var(--text2)', fontSize: 11 }}>energy</span></span>
                    <span title="Sleep">😴 {entry.sleep}h <span style={{ color: 'var(--text2)', fontSize: 11 }}>sleep</span></span>
                  </div>
                  <button onClick={() => handleDelete(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14, padding: 2 }}>✕</button>
                </div>
                {entry.products && entry.products.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.products.map(p => (
                      <span key={p} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--gold)', fontSize: 11 }}>
                        💊 {p}
                      </span>
                    ))}
                  </div>
                )}
                {entry.notes && <div style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.5 }}>{entry.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
      {modal && <AddLogModal onSave={handleAdd} onClose={() => setModal(false)} />}
    </DashboardLayout>
  )
}
