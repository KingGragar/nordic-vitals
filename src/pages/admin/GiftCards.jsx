import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminGiftCards, issueGiftCards, voidGiftCard } from '../../api/mlmApi'

const NOK = v => 'NOK ' + Number(v).toLocaleString('nb-NO', { maximumFractionDigits: 0 })

const STATUS_META = {
  active:   { label: 'Active',   color: '#22c55e' },
  partial:  { label: 'Partial',  color: '#f59e0b' },
  redeemed: { label: 'Redeemed', color: '#6b7280' },
  expired:  { label: 'Expired',  color: '#ef4444' },
  voided:   { label: 'Voided',   color: '#9ca3af' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('nb-NO', { day:'2-digit', month:'short', year:'numeric' })
}

function Badge({ status }) {
  const m = STATUS_META[status] || { label: status, color: '#6b7280' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 9px', borderRadius: 20,
      background: m.color + '22', color: m.color, fontSize: 11, fontWeight: 700,
    }}>{m.label}</span>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || 'var(--cream)', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

const overlayStyle = { position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const boxStyle = { background:'var(--navy2)', border:'1px solid var(--border)', borderRadius:16, padding:28, width:'100%', maxWidth:480 }

function IssueModal({ onClose, onIssued }) {
  const [mode, setMode] = useState('single')
  const [form, setForm] = useState({ value: 500, count: 1, issuedTo: '', issuedToName: '', note: '', expiryMonths: 12 })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [issued, setIssued] = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleIssue() {
    if (!form.value || form.value < 1) return setErr('Enter a value of at least 1')
    if (mode === 'batch' && (!form.count || form.count < 1 || form.count > 200)) return setErr('Count must be 1–200')
    setErr(''); setSaving(true)
    try {
      const exp = new Date(); exp.setMonth(exp.getMonth() + Number(form.expiryMonths))
      const res = await issueGiftCards({
        value: Number(form.value),
        expiresAt: exp.toISOString(),
        count: mode === 'batch' ? Number(form.count) : 1,
        issuedTo: form.issuedTo || null,
        issuedToName: form.issuedToName || null,
        note: form.note,
      })
      setIssued(res.cards)
      onIssued()
    } catch { setErr('Failed to issue gift cards') }
    setSaving(false)
  }

  const inp = { width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--cream)', fontSize:14 }
  const lbl = { fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:6, display:'block' }

  if (issued) return (
    <div style={overlayStyle} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={boxStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ color:'var(--gold)', fontSize:17, fontWeight:700, margin:0 }}>✓ Gift Cards Issued</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text2)', fontSize:22, cursor:'pointer' }}>×</button>
        </div>
        <p style={{ color:'var(--text2)', marginBottom:16 }}>{issued.length} gift card{issued.length>1?'s':''} created.</p>
        <div style={{ maxHeight:220, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
          {issued.map(c => (
            <div key={c.id} style={{ background:'var(--navy3)', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontFamily:'monospace', color:'var(--cream)', fontSize:13 }}>{c.code}</span>
              <span style={{ color:'var(--gold)', fontWeight:700 }}>{NOK(c.balance)}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{ width:'100%', padding:'10px 0', borderRadius:8, background:'var(--navy3)', border:'1px solid var(--border)', color:'var(--cream)', cursor:'pointer' }}>Close</button>
      </div>
    </div>
  )

  return (
    <div style={overlayStyle} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={boxStyle}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ color:'var(--cream)', fontSize:17, fontWeight:700, margin:0 }}>Issue Gift Cards</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--text2)', fontSize:22, cursor:'pointer' }}>×</button>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {['single','batch'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:'8px 0', borderRadius:8, border:'1px solid var(--border)', cursor:'pointer', fontWeight:600, fontSize:13, background: mode===m ? 'var(--gold)' : 'var(--navy3)', color: mode===m ? '#0d0d1e' : 'var(--text2)' }}>
              {m === 'single' ? 'Single Card' : 'Batch Issue'}
            </button>
          ))}
        </div>

        <label style={{ display:'block', marginBottom:16 }}>
          <span style={lbl}>Face Value (NOK)</span>
          <input type="number" min="1" style={inp} value={form.value} onChange={e => set('value', e.target.value)} />
        </label>

        {mode === 'batch' && (
          <label style={{ display:'block', marginBottom:16 }}>
            <span style={lbl}>Number of Cards (max 200)</span>
            <input type="number" min="1" max="200" style={inp} value={form.count} onChange={e => set('count', e.target.value)} />
          </label>
        )}

        <label style={{ display:'block', marginBottom:16 }}>
          <span style={lbl}>Expires In</span>
          <select style={inp} value={form.expiryMonths} onChange={e => set('expiryMonths', e.target.value)}>
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={24}>24 months</option>
          </select>
        </label>

        {mode === 'single' && (
          <>
            <label style={{ display:'block', marginBottom:16 }}>
              <span style={lbl}>Assign to Member ID (optional)</span>
              <input type="text" style={inp} placeholder="e.g. NV-10042" value={form.issuedTo} onChange={e => set('issuedTo', e.target.value)} />
            </label>
            <label style={{ display:'block', marginBottom:16 }}>
              <span style={lbl}>Member Name (optional)</span>
              <input type="text" style={inp} placeholder="Full name" value={form.issuedToName} onChange={e => set('issuedToName', e.target.value)} />
            </label>
          </>
        )}

        <label style={{ display:'block', marginBottom:20 }}>
          <span style={lbl}>Internal Note (optional)</span>
          <input type="text" style={inp} placeholder="e.g. Campaign, welcome gift…" value={form.note} onChange={e => set('note', e.target.value)} />
        </label>

        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{err}</div>}

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px 0', borderRadius:8, background:'var(--navy3)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleIssue} disabled={saving} style={{ flex:2, padding:'10px 0', borderRadius:8, background:'var(--gold)', border:'none', color:'#0d0d1e', fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Issuing…' : `Issue ${mode==='batch' ? form.count+' Cards' : 'Card'}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function VoidModal({ card, onClose, onVoided }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  async function handleVoid() {
    setSaving(true)
    try {
      await voidGiftCard(card.id, reason)
      onVoided()
      onClose()
    } catch { setErr('Failed to void card') }
    setSaving(false)
  }

  const inp = { width:'100%', boxSizing:'border-box', padding:'8px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--cream)', fontSize:14 }

  return (
    <div style={overlayStyle} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ ...boxStyle, maxWidth:400 }}>
        <h2 style={{ color:'#ef4444', fontSize:17, fontWeight:700, marginBottom:12 }}>Void Gift Card</h2>
        <p style={{ color:'var(--text2)', marginBottom:16 }}>
          Void <strong style={{ color:'var(--cream)', fontFamily:'monospace' }}>{card.code}</strong> ({NOK(card.balance)} remaining)?
          This cannot be undone.
        </p>
        <label style={{ display:'block', marginBottom:16 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:6 }}>Reason (optional)</div>
          <input type="text" style={inp} placeholder="e.g. Customer request, fraud" value={reason} onChange={e => setReason(e.target.value)} />
        </label>
        {err && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12 }}>{err}</div>}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} style={{ flex:1, padding:'10px 0', borderRadius:8, background:'var(--navy3)', border:'1px solid var(--border)', color:'var(--text2)', cursor:'pointer' }}>Cancel</button>
          <button onClick={handleVoid} disabled={saving} style={{ flex:1, padding:'10px 0', borderRadius:8, background:'#ef4444', border:'none', color:'#fff', fontWeight:700, cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1 }}>
            {saving ? 'Voiding…' : 'Void Card'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GiftCards() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showIssue, setShowIssue] = useState(false)
  const [voidTarget, setVoidTarget] = useState(null)
  const PER_PAGE = 20

  async function load() {
    setLoading(true)
    try {
      const res = await getAdminGiftCards({ status: statusFilter === 'all' ? undefined : statusFilter, search: search || undefined })
      setData(res)
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [statusFilter, search])

  const cards = data?.cards || []
  const stats = data?.stats || {}
  const totalPages = Math.max(1, Math.ceil(cards.length / PER_PAGE))
  const visible = cards.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const statuses = ['all','active','partial','redeemed','expired','voided']

  const th = { padding:'10px 14px', textAlign:'left', fontSize:11, color:'var(--text2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }
  const td = { padding:'10px 14px', fontSize:13, color:'var(--text2)', borderBottom:'1px solid var(--border)' }

  return (
    <AdminLayout>
      {showIssue && <IssueModal onClose={() => setShowIssue(false)} onIssued={load} />}
      {voidTarget && <VoidModal card={voidTarget} onClose={() => setVoidTarget(null)} onVoided={load} />}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--cream)', margin:0 }}>🎁 Gift Cards</h1>
          <p style={{ color:'var(--text2)', fontSize:13, marginTop:4, marginBottom:0 }}>Issue, track, and void gift cards</p>
        </div>
        <button onClick={() => setShowIssue(true)} style={{ padding:'10px 20px', borderRadius:8, background:'var(--gold)', border:'none', color:'#0d0d1e', fontWeight:700, cursor:'pointer', fontSize:14 }}>
          + Issue Gift Card
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:24 }}>
        <KpiCard label="Total Issued" value={stats.totalIssued ?? '—'} sub="all time" />
        <KpiCard label="Face Value" value={stats.totalFaceValue != null ? NOK(stats.totalFaceValue) : '—'} sub="total issued" color="var(--gold)" />
        <KpiCard label="Outstanding Balance" value={stats.outstanding != null ? NOK(stats.outstanding) : '—'} sub="redeemable now" color="#22c55e" />
        <KpiCard label="Redeemed" value={stats.redeemed != null ? NOK(stats.redeemed) : '—'} sub="total spent" />
        <KpiCard label="Expired Value" value={stats.expired != null ? NOK(stats.expired) : '—'} sub="forfeited" color="#ef4444" />
      </div>

      <div style={{ background:'var(--navy2)', borderRadius:12, border:'1px solid var(--border)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
          <input
            placeholder="Search code or member…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ flex:1, minWidth:200, padding:'8px 12px', borderRadius:8, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--cream)', fontSize:13 }}
          />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {statuses.map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} style={{
                padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600, cursor:'pointer', border:'1px solid var(--border)',
                background: statusFilter===s ? 'var(--gold)' : 'var(--navy3)', color: statusFilter===s ? '#0d0d1e' : 'var(--text2)',
              }}>
                {s === 'all' ? 'All' : (STATUS_META[s]?.label || s)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>No gift cards found</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th style={th}>Code</th>
                  <th style={th}>Issued To</th>
                  <th style={{ ...th, textAlign:'right' }}>Face Value</th>
                  <th style={{ ...th, textAlign:'right' }}>Balance</th>
                  <th style={th}>Issued</th>
                  <th style={th}>Expires</th>
                  <th style={th}>Status</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(c => (
                  <tr key={c.id} style={{ transition:'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e => e.currentTarget.style.background=''}>
                    <td style={td}><span style={{ fontFamily:'monospace', color:'var(--cream)', fontSize:13 }}>{c.code}</span></td>
                    <td style={td}>
                      {c.issuedToName
                        ? <><span style={{ color:'var(--cream)' }}>{c.issuedToName}</span><br/><span style={{ fontSize:11 }}>{c.issuedTo}</span></>
                        : <span style={{ color:'var(--navy3)' }}>—</span>}
                    </td>
                    <td style={{ ...td, textAlign:'right', color:'var(--cream)', fontWeight:600 }}>{NOK(c.originalValue)}</td>
                    <td style={{ ...td, textAlign:'right', color: c.balance > 0 ? '#22c55e' : 'var(--text2)', fontWeight:600 }}>{NOK(c.balance)}</td>
                    <td style={td}>{fmtDate(c.issuedAt)}</td>
                    <td style={{ ...td, color: c.status==='expired' ? '#ef4444' : 'var(--text2)' }}>{fmtDate(c.expiresAt)}</td>
                    <td style={td}><Badge status={c.status} /></td>
                    <td style={td}>
                      {(c.status==='active'||c.status==='partial') && (
                        <button onClick={() => setVoidTarget(c)} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid #ef444444', background:'transparent', color:'#ef4444', fontSize:12, cursor:'pointer' }}>
                          Void
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 20px', borderTop:'1px solid var(--border)' }}>
            <span style={{ fontSize:13, color:'var(--text2)' }}>{cards.length} cards</span>
            <div style={{ display:'flex', gap:6 }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--text2)', cursor:'pointer', opacity:page===1?0.4:1 }}>‹</button>
              <span style={{ padding:'6px 14px', color:'var(--text2)', fontSize:13 }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{ padding:'6px 14px', borderRadius:6, border:'1px solid var(--border)', background:'var(--navy3)', color:'var(--text2)', cursor:'pointer', opacity:page===totalPages?0.4:1 }}>›</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
