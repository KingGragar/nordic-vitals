import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberConsultations, bookMemberConsultation } from '../../api/mlmApi'

const TYPE_COLOR = { wellness: '#86efac', business: '#93c5fd', product: '#fbbf24', strategy: '#c4b5fd' }
const TYPE_ICON  = { wellness: '🌿', business: '💼', product: '🧪', strategy: '🎯' }
const ST_COLOR   = { upcoming: '#93c5fd', completed: '#86efac', cancelled: '#9ca3af' }

const BLANK = { expertId: '', type: 'product', date: '', time: '', topic: '' }

export default function DashConsultations() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [booking, setBooking] = useState(false)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    setLoading(true)
    getMemberConsultations().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleBook() {
    if (!form.expertId || !form.date || !form.time || !form.topic) return
    setBooking(true)
    const result = await bookMemberConsultation(form)
    setData(prev => ({ ...prev, sessions: [result, ...(prev?.sessions||[])] }))
    setModal(false)
    setForm(BLANK)
    setBooking(false)
    setTab('upcoming')
  }

  const sessions = (data?.sessions||[]).filter(s => s.status === tab)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, fg='#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })
  const inp = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700 }}>Expert Consultations</h1>
            <p style={{ margin:'4px 0 0', color:'var(--text-muted)', fontSize:14 }}>Book 1:1 sessions with product experts and business coaches</p>
          </div>
          <button style={btn('#6366f1')} onClick={() => setModal(true)}>+ Book Consultation</button>
        </div>

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:22 }}>
          {[
            { label:'Upcoming', value:(data?.sessions||[]).filter(s=>s.status==='upcoming').length, color:'#93c5fd' },
            { label:'Completed', value:(data?.sessions||[]).filter(s=>s.status==='completed').length, color:'#86efac' },
            { label:'Hours Logged', value:`${data?.totalHours||0}h`, color:'#fbbf24' },
            { label:'Credits Remaining', value:data?.credits||0, color:'#c4b5fd' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize:20, fontWeight:700, color:k.color }}>{loading?'…':k.value}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {['upcoming','completed','cancelled'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'7px 18px', borderRadius:7, border:'1px solid var(--border)', background: tab===t ? '#6366f1' : 'var(--card)', color: tab===t ? '#fff' : 'var(--text)', cursor:'pointer', fontSize:13, textTransform:'capitalize' }}>{t}</button>
          ))}
        </div>

        {loading ? <div style={{ ...card, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sessions.map(s => (
              <div key={s.id} style={{ ...card, display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                <div style={{ fontSize:32, flexShrink:0 }}>{TYPE_ICON[s.type]||'👤'}</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontWeight:700, fontSize:16 }}>{s.topic}</span>
                    <span style={{ background:`rgba(0,0,0,.2)`, color:TYPE_COLOR[s.type]||'var(--text)', borderRadius:5, padding:'2px 8px', fontSize:12, textTransform:'capitalize' }}>{s.type}</span>
                    <span style={{ color:ST_COLOR[s.status]||'var(--text)', fontSize:12, marginLeft:'auto' }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize:14, color:'var(--text-muted)', marginBottom:2 }}>with <strong style={{ color:'var(--text)' }}>{s.expertName}</strong> · {s.expertTitle}</div>
                  <div style={{ fontSize:13, color:'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString('en-GB', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} at {s.time}</div>
                  {s.notes && <div style={{ marginTop:8, fontSize:13, color:'var(--text-muted)', background:'var(--bg)', borderRadius:6, padding:'6px 10px' }}>{s.notes}</div>}
                  {s.meetingLink && s.status==='upcoming' && <a href={s.meetingLink} style={{ display:'inline-block', marginTop:8, padding:'6px 14px', background:'#10b981', color:'#fff', borderRadius:6, fontSize:13, fontWeight:600, textDecoration:'none' }}>Join Meeting</a>}
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <div style={{ ...card, textAlign:'center', color:'var(--text-muted)', padding:32 }}>
                No {tab} consultations.{tab==='upcoming' && <> <button style={{ ...btn('#6366f1'), marginLeft:8, padding:'6px 14px', fontSize:13 }} onClick={() => setModal(true)}>Book one now</button></>}
              </div>
            )}
          </div>
        )}

        {modal && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <div style={{ background:'var(--card)', borderRadius:14, padding:28, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,.4)' }}>
              <h2 style={{ margin:'0 0 18px', fontSize:18, fontWeight:700 }}>Book a Consultation</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Expert</label>
                  <select style={inp} value={form.expertId} onChange={e => setForm(f=>({...f,expertId:e.target.value}))}>
                    <option value="">Select an expert…</option>
                    {(data?.experts||[]).map(e => <option key={e.id} value={e.id}>{e.name} — {e.title}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Session Type</label>
                  <select style={inp} value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
                    {['product','wellness','business','strategy'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Date</label>
                    <input style={inp} type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} min={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Time</label>
                    <select style={inp} value={form.time} onChange={e => setForm(f=>({...f,time:e.target.value}))}>
                      <option value="">Pick a time…</option>
                      {['09:00','10:00','11:00','13:00','14:00','15:00','16:00'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Topic / What do you want to discuss?</label>
                  <textarea style={{ ...inp, height:80, resize:'vertical' }} value={form.topic} onChange={e => setForm(f=>({...f,topic:e.target.value}))} placeholder="Briefly describe what you'd like help with…" />
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
                <button style={btn('var(--border)','var(--text)')} onClick={() => { setModal(false); setForm(BLANK) }}>Cancel</button>
                <button style={btn('#6366f1')} onClick={handleBook} disabled={booking}>{booking ? 'Booking…' : 'Book Session'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
