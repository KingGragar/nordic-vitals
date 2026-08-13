import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPeptideDiary, logPeptideDiaryEntry, deletePeptideDiaryEntry } from '../../api/mlmApi'

const TIMING_COLOR = { morning: '#fbbf24', pre_workout: '#f87171', post_workout: '#86efac', evening: '#a5b4fc', bedtime: '#67e8f9' }
const ROUTE_OPTS = ['subcutaneous','intramuscular','oral','topical','intranasal']

export default function DashPeptideDiary() {
  const [data, setData]    = useState(null)
  const [loading, setLoad] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]    = useState({ peptide: '', dose_mcg: '', route: 'subcutaneous', timing: 'morning', note: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { getMemberPeptideDiary().then(setData).finally(() => setLoad(false)) }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  async function handleLog() {
    setSaving(true)
    const entry = await logPeptideDiaryEntry(form)
    setData(prev => ({ ...prev, entries: [{ ...entry, id: Date.now(), logged_at: new Date().toISOString(), ...form }, ...prev.entries] }))
    setForm({ peptide: '', dose_mcg: '', route: 'subcutaneous', timing: 'morning', note: '' })
    setShowAdd(false); setSaving(false)
  }

  async function handleDelete(id) {
    await deletePeptideDiaryEntry(id)
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const grouped = data.entries.reduce((acc, e) => {
    const day = e.logged_at.slice(0,10)
    ;(acc[day] = acc[day] || []).push(e)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🧬 Peptide Diary</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>Log your daily peptide doses, timing, and notes.</div>
          </div>
          <button onClick={() => setShowAdd(true)} style={{
            padding: '9px 18px', borderRadius: 9, border: 'none', background: '#a5b4fc', color: '#1e1b4b',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>+ Log Dose</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total Logs',     value: data.stats.total_logs,                color: '#a5b4fc' },
            { label: 'This Week',      value: data.stats.week_logs,                 color: '#86efac' },
            { label: 'Streak (days)',  value: data.stats.streak,                    color: '#fbbf24' },
            { label: 'Peptides Used',  value: data.stats.unique_peptides,           color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {Object.entries(grouped).map(([day, entries]) => (
          <div key={day} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {new Date(day).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {entries.map(e => (
                <div key={e.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: TIMING_COLOR[e.timing] || '#a5b4fc',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{e.peptide}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 12, marginTop: 2 }}>
                      <span>{e.dose_mcg} mcg</span>
                      <span style={{ textTransform: 'capitalize' }}>{e.route.replace('_',' ')}</span>
                      <span style={{ color: TIMING_COLOR[e.timing]||'#a5b4fc', textTransform: 'capitalize' }}>{e.timing.replace('_',' ')}</span>
                      <span>{new Date(e.logged_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                    {e.note && <div style={{ fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginTop: 4 }}>{e.note}</div>}
                  </div>
                  <button onClick={() => handleDelete(e.id)} style={{
                    padding: '4px 10px', borderRadius: 6, border: '1px solid #f87171', background: 'transparent',
                    color: '#f87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {data.entries.length === 0 && (
          <div style={{ ...card, textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            No diary entries yet. Log your first dose above.
          </div>
        )}

        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '95vw' }}>
              <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 18 }}>Log Peptide Dose</div>
              {[
                { label: 'Peptide Name', key: 'peptide', type: 'text', placeholder: 'e.g. BPC-157' },
                { label: 'Dose (mcg)',   key: 'dose_mcg', type: 'number', placeholder: 'e.g. 250' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{f.label}</div>
                  <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Route</div>
                  <select value={form.route} onChange={e => setForm(p=>({...p,route:e.target.value}))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                    {ROUTE_OPTS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Timing</div>
                  <select value={form.timing} onChange={e => setForm(p=>({...p,timing:e.target.value}))}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}>
                    {Object.keys(TIMING_COLOR).map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>Note (optional)</div>
                <input value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} placeholder="Any observations…"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleLog} disabled={saving || !form.peptide || !form.dose_mcg} style={{ flex: 2, padding: 10, borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#1e1b4b', fontWeight: 700, cursor: 'pointer', opacity: (!form.peptide||!form.dose_mcg)?0.5:1 }}>
                  {saving ? 'Logging…' : 'Log Dose'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
