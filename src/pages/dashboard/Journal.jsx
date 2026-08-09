import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberJournal, addMemberJournalEntry, deleteMemberJournalEntry } from '../../api/mlmApi'

const MOOD_OPTIONS = [
  { value: 5, label: '😄 Excellent' },
  { value: 4, label: '🙂 Good' },
  { value: 3, label: '😐 Okay' },
  { value: 2, label: '😔 Low' },
  { value: 1, label: '😞 Rough' },
]
const TAG_OPTIONS = ['product use','business','workout','nutrition','mindset','team','goal progress','other']
const MOOD_C = { 5:'#86efac', 4:'#93c5fd', 3:'#fbbf24', 2:'#fb923c', 1:'#f87171' }

const BLANK = { mood: 3, title: '', body: '', tags: [], productsUsed: [] }

export default function DashJournal() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmId, setConfirmId] = useState(null)

  useEffect(() => {
    setLoading(true)
    getMemberJournal().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!form.body.trim()) return
    setSaving(true)
    const entry = await addMemberJournalEntry(form)
    setData(prev => ({ ...prev, entries: [entry, ...(prev?.entries||[])] }))
    setModal(false)
    setForm(BLANK)
    setSaving(false)
  }

  async function handleDelete(id) {
    await deleteMemberJournalEntry(id)
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
    setConfirmId(null)
  }

  function toggleTag(tag) {
    setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t=>t!==tag) : [...f.tags, tag] }))
  }

  const entries = (data?.entries||[]).filter(e => !search || e.title?.toLowerCase().includes(search.toLowerCase()) || e.body.toLowerCase().includes(search.toLowerCase()))

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, fg='#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  const avgMood = entries.length ? (entries.reduce((s,e)=>s+e.mood,0)/entries.length).toFixed(1) : null

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Progress Journal</h1>
            <p style={{ margin:'4px 0 0', color:'var(--text-muted)', fontSize:14 }}>Track your wellness, business milestones, and daily reflections</p>
          </div>
          <button style={btn('#6366f1')} onClick={() => setModal(true)}>+ New Entry</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:20 }}>
          {[
            { label:'Total Entries', value:entries.length, color:'#93c5fd' },
            { label:'This Month', value:(data?.entries||[]).filter(e=>new Date(e.date).getMonth()===new Date().getMonth()).length, color:'#fbbf24' },
            { label:'Avg Mood', value:avgMood ? `${avgMood}/5` : '—', color:avgMood?MOOD_C[Math.round(avgMood)]:'var(--text-muted)' },
            { label:'Day Streak', value:`${data?.streak||0}d`, color:'#86efac' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{loading?'…':k.value}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom:16 }}>
          <input style={inp} placeholder="Search entries…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div style={{ ...card, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {entries.map(entry => (
              <div key={entry.id} style={card}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:8 }}>
                  <div style={{ fontSize:22 }}>{MOOD_OPTIONS.find(m=>m.value===entry.mood)?.label.split(' ')[0]||'📝'}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700 }}>{entry.title || 'Journal Entry'}</span>
                      <span style={{ fontSize:12, color:MOOD_C[entry.mood], background:'rgba(0,0,0,.2)', borderRadius:5, padding:'1px 7px' }}>mood {entry.mood}/5</span>
                      <span style={{ fontSize:11, color:'var(--text-muted)', marginLeft:'auto' }}>{new Date(entry.date).toLocaleDateString('en-GB',{weekday:'short',month:'short',day:'numeric'})}</span>
                    </div>
                    {entry.tags?.length > 0 && (
                      <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginTop:4 }}>
                        {entry.tags.map(t => <span key={t} style={{ fontSize:11, background:'rgba(99,102,241,.2)', color:'#818cf8', borderRadius:4, padding:'1px 6px' }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ margin:'0 0 8px', fontSize:14, color:'var(--text)', lineHeight:1.6 }}>{entry.body}</p>
                {entry.productsUsed?.length > 0 && (
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>Products used: {entry.productsUsed.join(', ')}</div>
                )}
                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
                  {confirmId===entry.id
                    ? <><button style={{ ...btn('#ef4444'), padding:'4px 10px', fontSize:12 }} onClick={()=>handleDelete(entry.id)}>Confirm delete</button><button style={{ ...btn('transparent','var(--text)'), padding:'4px 10px', fontSize:12 }} onClick={()=>setConfirmId(null)}>Cancel</button></>
                    : <button style={{ ...btn('transparent','var(--text-muted)'), padding:'4px 10px', fontSize:12, border:'1px solid var(--border)' }} onClick={()=>setConfirmId(entry.id)}>Delete</button>
                  }
                </div>
              </div>
            ))}
            {entries.length === 0 && (
              <div style={{ ...card, textAlign:'center', color:'var(--text-muted)', padding:40 }}>
                {search ? 'No entries matching your search.' : 'No journal entries yet. Add your first entry!'}
              </div>
            )}
          </div>
        )}

        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'var(--card)', borderRadius:14, padding:28, width:'100%', maxWidth:560, boxShadow:'0 20px 60px rgba(0,0,0,.4)', maxHeight:'90vh', overflowY:'auto' }}>
              <h2 style={{ margin:'0 0 18px', fontSize:18, fontWeight:700 }}>New Journal Entry</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>How are you feeling today?</label>
                  <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                    {MOOD_OPTIONS.map(m => (
                      <button key={m.value} onClick={() => setForm(f=>({...f,mood:m.value}))}
                        style={{ padding:'7px 12px', borderRadius:8, border:`2px solid ${form.mood===m.value?MOOD_C[m.value]:'var(--border)'}`, background: form.mood===m.value?`${MOOD_C[m.value]}22`:'var(--bg)', cursor:'pointer', fontSize:13, color:'var(--text)', transition:'all .15s' }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Title (optional)</label>
                  <input style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Give this entry a title…" />
                </div>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Your entry *</label>
                  <textarea style={{ ...inp, height:120, resize:'vertical' }} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder="What happened today? How did you feel? Any wins or challenges?" />
                </div>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Tags</label>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {TAG_OPTIONS.map(t => (
                      <button key={t} onClick={()=>toggleTag(t)}
                        style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--border)', background: form.tags.includes(t)?'rgba(99,102,241,.3)':'var(--bg)', color: form.tags.includes(t)?'#818cf8':'var(--text-muted)', cursor:'pointer', fontSize:12 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
                <button style={btn('var(--border)','var(--text)')} onClick={() => { setModal(false); setForm(BLANK) }}>Cancel</button>
                <button style={btn('#6366f1')} onClick={handleSave} disabled={saving||!form.body.trim()}>{saving?'Saving…':'Save Entry'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
