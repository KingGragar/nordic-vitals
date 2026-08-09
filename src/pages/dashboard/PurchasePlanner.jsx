import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberPurchasePlanner, saveMemberPurchasePlan } from '../../api/mlmApi'

export default function DashPurchasePlanner() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [budget, setBudget] = useState('')
  const [saving, setSaving] = useState(false)
  const [planned, setPlanned] = useState({})

  useEffect(() => {
    setLoading(true)
    getMemberPurchasePlanner().then(d => {
      setData(d)
      setBudget(String(d?.monthlyBudget || ''))
      const init = {}
      d?.items?.forEach(i => { init[i.id] = i.plannedQty })
      setPlanned(init)
    }).finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    await saveMemberPurchasePlan({ monthlyBudget: Number(budget), items: planned })
    setSaving(false)
  }

  const totalPlanned = (data?.items||[]).reduce((s, i) => s + (planned[i.id]||0) * i.price, 0)
  const totalPV = (data?.items||[]).reduce((s, i) => s + (planned[i.id]||0) * i.pv, 0)
  const budgetNum = Number(budget) || 0
  const remaining = budgetNum - totalPlanned

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, fg='#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })
  const inp = { padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, width: '100%', boxSizing: 'border-box' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Purchase Planner</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Plan your monthly product orders and track PV targets</p>
        </div>

        {/* Budget header */}
        <div style={{ ...card, display:'flex', gap:24, alignItems:'center', flexWrap:'wrap', marginBottom:20 }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:13, color:'var(--text-muted)', display:'block', marginBottom:5 }}>Monthly Budget (€)</label>
            <input style={{ ...inp, width:160 }} type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)} placeholder="0.00" />
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Planned Spend</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#93c5fd' }}>€{totalPlanned.toFixed(2)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Remaining</div>
            <div style={{ fontSize:22, fontWeight:700, color: remaining<0?'#f87171':'#86efac' }}>€{remaining.toFixed(2)}</div>
          </div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>Planned PV</div>
            <div style={{ fontSize:22, fontWeight:700, color:'#fbbf24' }}>{totalPV}</div>
          </div>
          <button style={btn('#6366f1')} onClick={handleSave} disabled={saving}>{saving?'Saving…':'Save Plan'}</button>
        </div>

        {/* Budget bar */}
        {budgetNum > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>
              <span>Budget used: {Math.round((totalPlanned/budgetNum)*100)}%</span>
              <span>€{totalPlanned.toFixed(2)} / €{budgetNum.toFixed(2)}</span>
            </div>
            <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(100,(totalPlanned/budgetNum)*100)}%`, height:'100%', background: totalPlanned>budgetNum?'#f87171':'#6366f1', borderRadius:4, transition:'width .3s' }} />
            </div>
          </div>
        )}

        {/* PV target progress */}
        {data?.pvTarget > 0 && (
          <div style={{ ...card, marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
              <span style={{ fontWeight:600 }}>PV Target Progress</span>
              <span style={{ color: totalPV >= data.pvTarget ? '#86efac' : 'var(--text-muted)' }}>{totalPV} / {data.pvTarget} PV</span>
            </div>
            <div style={{ height:10, background:'var(--border)', borderRadius:5, overflow:'hidden' }}>
              <div style={{ width:`${Math.min(100,(totalPV/data.pvTarget)*100)}%`, height:'100%', background: totalPV>=data.pvTarget?'#86efac':'#fbbf24', borderRadius:5, transition:'width .3s' }} />
            </div>
            {totalPV >= data.pvTarget && <div style={{ marginTop:8, fontSize:12, color:'#86efac', fontWeight:600 }}>PV target met!</div>}
          </div>
        )}

        {/* Product list */}
        {loading ? <div style={{ ...card, textAlign:'center', color:'var(--text-muted)' }}>Loading…</div> : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {(data?.items||[]).map(item => (
              <div key={item.id} style={{ ...card, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                <div style={{ fontSize:28, flexShrink:0 }}>{item.emoji||'🧪'}</div>
                <div style={{ flex:1, minWidth:150 }}>
                  <div style={{ fontWeight:600 }}>{item.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>€{item.price.toFixed(2)} · {item.pv} PV · {item.category}</div>
                </div>
                {item.recommended && <span style={{ fontSize:11, background:'rgba(99,102,241,.2)', color:'#818cf8', borderRadius:5, padding:'2px 8px' }}>Recommended</span>}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', cursor:'pointer', fontSize:16, fontWeight:700 }}
                    onClick={() => setPlanned(p => ({ ...p, [item.id]: Math.max(0,(p[item.id]||0)-1) }))}>−</button>
                  <span style={{ minWidth:28, textAlign:'center', fontWeight:700, fontSize:16 }}>{planned[item.id]||0}</span>
                  <button style={{ width:30, height:30, borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', cursor:'pointer', fontSize:16, fontWeight:700 }}
                    onClick={() => setPlanned(p => ({ ...p, [item.id]: (p[item.id]||0)+1 }))}>+</button>
                </div>
                <div style={{ textAlign:'right', minWidth:80 }}>
                  <div style={{ fontWeight:700, color:'#93c5fd' }}>€{((planned[item.id]||0)*item.price).toFixed(2)}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>{(planned[item.id]||0)*item.pv} PV</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
