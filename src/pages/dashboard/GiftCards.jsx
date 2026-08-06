import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMyGiftCards, checkGiftCardBalance } from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nb-NO', { day:'2-digit', month:'short', year:'numeric' })
}

const STATUS_META = {
  active:   { label:'Active',   color:'#22c55e', bg:'#22c55e22' },
  partial:  { label:'Partial',  color:'#f59e0b', bg:'#f59e0b22' },
  redeemed: { label:'Redeemed', color:'#6b7280', bg:'#6b728022' },
  expired:  { label:'Expired',  color:'#ef4444', bg:'#ef444422' },
  voided:   { label:'Voided',   color:'#9ca3af', bg:'#9ca3af22' },
}

function GiftCardTile({ card }) {
  const m = STATUS_META[card.status] || STATUS_META.active
  const pct = card.originalValue > 0 ? Math.round((card.balance / card.originalValue) * 100) : 0
  const masked = card.code.replace(/^(NVGC-)(....)(-....)$/, '$1****$3')

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e2040 0%, #2a1e45 100%)',
      border: `1px solid ${m.color}44`, borderRadius: 16, padding: 24,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position:'absolute', top:-30, right:-30, width:120, height:120, borderRadius:'50%', background: m.color + '11' }} />
      <div style={{ position:'absolute', bottom:-20, left:-20, width:80, height:80, borderRadius:'50%', background: m.color + '0a' }} />

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Nordic Vitals Gift Card</div>
          <div style={{ fontFamily:'monospace', color:'var(--cream)', fontSize:15, fontWeight:600 }}>{masked}</div>
        </div>
        <span style={{ padding:'3px 10px', borderRadius:20, background: m.bg, color: m.color, fontSize:11, fontWeight:700 }}>{m.label}</span>
      </div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:11, color:'var(--text2)', marginBottom:4 }}>Available Balance</div>
        <div style={{ fontSize:28, fontWeight:800, color: m.color }}>{NOK(card.balance)}</div>
        <div style={{ fontSize:12, color:'var(--text2)' }}>of {NOK(card.originalValue)} original value</div>
      </div>

      {card.status !== 'redeemed' && card.status !== 'voided' && (
        <div style={{ marginBottom:16 }}>
          <div style={{ height:4, borderRadius:2, background:'var(--navy3)', overflow:'hidden' }}>
            <div style={{ width:`${pct}%`, height:'100%', background: m.color, borderRadius:2, transition:'width 0.4s' }} />
          </div>
          <div style={{ fontSize:11, color:'var(--text2)', marginTop:4 }}>{pct}% remaining</div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
        <div>
          <span style={{ color:'var(--text2)' }}>Issued </span>
          <span style={{ color:'var(--cream)' }}>{fmtDate(card.issuedAt)}</span>
        </div>
        <div>
          <span style={{ color:'var(--text2)' }}>Expires </span>
          <span style={{ color: card.status==='expired' ? '#ef4444' : 'var(--cream)' }}>{fmtDate(card.expiresAt)}</span>
        </div>
      </div>
    </div>
  )
}

function CheckCodePanel() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function handleCheck() {
    if (!code.trim()) return setErr('Enter a gift card code')
    setErr(''); setResult(null); setLoading(true)
    try {
      const res = await checkGiftCardBalance(code)
      if (!res.found) setErr('Gift card code not found')
      else setResult(res)
    } catch { setErr('Failed to check code') }
    setLoading(false)
  }

  const m = result ? (STATUS_META[result.status] || STATUS_META.active) : null

  return (
    <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:12, padding:24 }}>
      <div style={{ fontSize:15, fontWeight:700, color:'var(--cream)', marginBottom:4 }}>🔍 Check a Code</div>
      <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>Enter any gift card code to check its balance</div>

      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <input
          type="text"
          placeholder="NVGC-XXXX-XXXX"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setErr(''); setResult(null) }}
          onKeyDown={e => e.key==='Enter' && handleCheck()}
          style={{ flex:1, minWidth:200, padding:'9px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--cream)', fontSize:14, fontFamily:'monospace' }}
        />
        <button onClick={handleCheck} disabled={loading} style={{ padding:'9px 20px', borderRadius:8, background:'var(--gold)', border:'none', color:'#0d0d1e', fontWeight:700, cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1 }}>
          {loading ? '…' : 'Check'}
        </button>
      </div>

      {err && <div style={{ color:'#ef4444', fontSize:13, marginTop:12 }}>{err}</div>}

      {result && (
        <div style={{ marginTop:16, padding:'14px 18px', borderRadius:10, background:'var(--navy3)', border:`1px solid ${m.color}44`, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontFamily:'monospace', color:'var(--cream)', fontWeight:600, marginBottom:4 }}>{result.code}</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>Expires {fmtDate(result.expiresAt)}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:800, color: m.color }}>{NOK(result.balance)}</div>
            <span style={{ padding:'2px 9px', borderRadius:20, background: m.bg, color: m.color, fontSize:11, fontWeight:700 }}>{m.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashGiftCards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyGiftCards().then(res => { setData(res); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const cards = data?.cards || []
  const redemptions = data?.redemptions || []
  const totalBalance = cards.filter(c=>c.status!=='expired'&&c.status!=='voided'&&c.status!=='redeemed').reduce((s,c) => s+c.balance, 0)
  const activeCards = cards.filter(c=>c.status==='active'||c.status==='partial')

  return (
    <DashboardLayout>
      <div style={{ maxWidth:900, margin:'0 auto' }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--cream)', margin:0 }}>🎁 Gift Cards</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4, marginBottom:0 }}>View and use your Nordic Vitals gift cards</p>
        </div>

        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'var(--text2)' }}>Loading…</div>
        ) : (
          <>
            {activeCards.length > 0 && (
              <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:12, padding:20, marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                <div>
                  <div style={{ fontSize:12, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Total Available Balance</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'var(--gold)' }}>{NOK(totalBalance)}</div>
                </div>
                <div style={{ fontSize:13, color:'var(--text2)' }}>
                  {activeCards.length} active card{activeCards.length!==1?'s':''}
                </div>
              </div>
            )}

            {cards.length === 0 ? (
              <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:12, padding:48, textAlign:'center', marginBottom:20 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>🎁</div>
                <div style={{ color:'var(--cream)', fontWeight:600, marginBottom:8 }}>No gift cards yet</div>
                <div style={{ color:'var(--text2)', fontSize:13 }}>Gift cards issued to you will appear here</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16, marginBottom:20 }}>
                {cards.map(c => <GiftCardTile key={c.id} card={c} />)}
              </div>
            )}

            <CheckCodePanel />

            {redemptions.length > 0 && (
              <div style={{ background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:12, marginTop:20 }}>
                <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', fontWeight:700, color:'var(--cream)', fontSize:15 }}>Redemption History</div>
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead>
                      <tr>
                        {['Date','Card Code','Amount Used','Order'].map(h => (
                          <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, color:'var(--text2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {redemptions.map((r,i) => (
                        <tr key={i}>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text2)', borderBottom:'1px solid var(--border)' }}>{fmtDate(r.date)}</td>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'var(--cream)', fontFamily:'monospace', borderBottom:'1px solid var(--border)' }}>{r.code}</td>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'#22c55e', fontWeight:600, borderBottom:'1px solid var(--border)' }}>−{NOK(r.amount)}</td>
                          <td style={{ padding:'10px 16px', fontSize:13, color:'var(--text2)', borderBottom:'1px solid var(--border)' }}>{r.orderId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
