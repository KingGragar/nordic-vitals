import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPeptideEducation, completePeptideModule } from '../../api/mlmApi'

const CAT_COLOR = { Fundamentals:'#a5b4fc', Growth:'#86efac', Recovery:'#fbbf24', 'Anti-aging':'#f9a8d4', Neuro:'#67e8f9', Advanced:'#fb923c', Practical:'#86efac', Compliance:'#f87171' }
const CATS = ['All','Fundamentals','Growth','Recovery','Anti-aging','Neuro','Advanced','Practical','Compliance']

export default function DashPeptideEducation() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [cat, setCat]       = useState('All')
  const [selected, setSelected] = useState(null)
  const [completing, setCompleting] = useState(false)

  useEffect(() => { getMemberPeptideEducation().then(d => { setData(d); setSelected(d.current_module) }).finally(() => setLoading(false)) }, [])

  async function handleComplete(id) {
    setCompleting(true)
    const res = await completePeptideModule(id)
    if (res.ok) {
      setData(prev => ({
        ...prev,
        progress: { ...prev.progress, modules_completed: prev.progress.modules_completed + 1, xp_earned: prev.progress.xp_earned + res.xp_earned },
        modules: prev.modules.map(m => m.id === id ? { ...m, status: 'completed' } : m.id === id+1 ? { ...m, status: 'in_progress' } : m),
      }))
    }
    setCompleting(false)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign:'center', padding:80, color:'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const filtered = data.modules.filter(m => cat === 'All' || m.category === cat)
  const pct = Math.round((data.progress.modules_completed / data.progress.total_modules) * 100)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🎓 Peptide Education</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Science-backed modules to deepen your peptide knowledge and earn XP.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Completed',        value: `${data.progress.modules_completed}/${data.progress.total_modules}`, color: '#86efac' },
            { label: 'XP Earned',        value: data.progress.xp_earned.toLocaleString(),                           color: '#fbbf24' },
            { label: 'Study Streak',     value: `${data.progress.streak} days`,                                     color: '#a5b4fc' },
            { label: 'Course Progress',  value: `${pct}%`,                                                          color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--border)', borderRadius: 6, height: 8, marginBottom: 24 }}>
          <div style={{ background: '#a5b4fc', width: `${pct}%`, height: '100%', borderRadius: 6, transition: 'width .5s' }} />
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${cat === c ? (CAT_COLOR[c]||'#a5b4fc') : 'var(--border)'}`,
              background: cat === c ? (CAT_COLOR[c]||'#a5b4fc')+'22' : 'transparent',
              color: cat === c ? (CAT_COLOR[c]||'#a5b4fc') : 'var(--text2)',
            }}>{c}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 340px' : '1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(m => (
              <div key={m.id} onClick={() => m.status !== 'locked' && setSelected(m)} style={{
                ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                opacity: m.status === 'locked' ? 0.5 : 1,
                cursor: m.status === 'locked' ? 'not-allowed' : 'pointer',
                outline: selected?.id === m.id ? '2px solid #a5b4fc' : 'none',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: m.status === 'completed' ? '#86efac22' : m.status === 'in_progress' ? '#fbbf2422' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {m.status === 'completed' ? '✓' : m.status === 'in_progress' ? '▶' : '🔒'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{m.title}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                      <span style={{ background: (CAT_COLOR[m.category]||'#a5b4fc')+'22', color: CAT_COLOR[m.category]||'#a5b4fc', padding: '1px 7px', borderRadius: 8, fontWeight: 600 }}>{m.category}</span>
                      <span>⏱ {m.duration_min} min</span>
                      <span>✨ {m.xp} XP</span>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: m.status === 'completed' ? '#86efac' : m.status === 'in_progress' ? '#fbbf24' : 'var(--text2)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {m.status.replace('_',' ')}
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ ...card, alignSelf: 'start' }}>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{selected.title}</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: (CAT_COLOR[selected.category]||'#a5b4fc')+'22', color: CAT_COLOR[selected.category]||'#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{selected.category}</span>
                <span style={{ background: '#fbbf2422', color: '#fbbf24', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>⏱ {selected.duration_min} min</span>
                <span style={{ background: '#a5b4fc22', color: '#a5b4fc', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>✨ {selected.xp} XP</span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 10, padding: '20px', textAlign: 'center', marginBottom: 16, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📖</div>
                Module content would load here — peptide science, research references, dosing guidelines, and safety notes.
              </div>
              {selected.status !== 'locked' && selected.status !== 'completed' && (
                <button onClick={() => handleComplete(selected.id)} disabled={completing} style={{
                  width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: '#a5b4fc', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>{completing ? 'Marking complete…' : `Complete & Earn ${selected.xp} XP`}</button>
              )}
              {selected.status === 'completed' && (
                <div style={{ background: '#86efac22', color: '#86efac', padding: '10px', borderRadius: 8, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>✓ Module Completed</div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
