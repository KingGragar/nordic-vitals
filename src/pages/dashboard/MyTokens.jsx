import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberTokens, redeemMemberTokens } from '../../api/mlmApi'

const TX_COLOR = { earn: '#86efac', redeem: '#f87171' }

export default function DashMyTokens() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [redeemModal, setRedeemModal] = useState(null)
  const [redeemAmt, setRedeemAmt] = useState('')
  const [redeeming, setRedeeming] = useState(false)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMemberTokens().then(setData).finally(() => setLoading(false))
  }, [])

  async function handleRedeem() {
    if (!redeemModal || !redeemAmt) return
    const amt = parseInt(redeemAmt)
    if (isNaN(amt) || amt < redeemModal.minTokens) return
    setRedeeming(true)
    const result = await redeemMemberTokens(redeemModal.id, amt)
    setData(prev => ({ ...prev, balance: result.remaining }))
    setRedeemModal(null)
    setRedeemAmt('')
    setRedeeming(false)
  }

  const txs = (data?.transactions || []).filter(t => filter === 'all' || t.type === filter)

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const inp  = { width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, boxSizing: 'border-box' }
  const btn  = (bg, fg = '#fff') => ({ padding: '8px 18px', borderRadius: 7, border: 'none', background: bg, color: fg, fontWeight: 600, cursor: 'pointer', fontSize: 14 })

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>My Tokens</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Earn tokens through commissions and referrals; redeem for store credit, courses, and events</p>
        </div>

        {/* Balance hero */}
        <div style={{ ...card, background: 'linear-gradient(135deg, rgba(99,102,241,.25), rgba(168,85,247,.15))', marginBottom: 22, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Available Balance</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: '#818cf8' }}>{loading ? '…' : (data?.balance ?? 0).toLocaleString()}<span style={{ fontSize: 18, marginLeft: 4 }}>tokens</span></div>
            {data?.pendingBalance > 0 && <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 4 }}>+ {data.pendingBalance} pending</div>}
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#86efac' }}>{loading ? '…' : (data?.lifetimeEarned ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lifetime Earned</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f87171' }}>{loading ? '…' : (data?.lifetimeRedeemed ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Lifetime Redeemed</div>
            </div>
          </div>
        </div>

        {/* Redemption options */}
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Redeem Tokens</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12, marginBottom: 26 }}>
          {(data?.redemptionOptions || Array(4).fill(null)).map((opt, i) => (
            <div key={opt?.id ?? i} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{opt?.icon ?? '…'}</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{loading ? '…' : opt?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{loading ? '' : opt?.rate}</div>
              {!loading && opt && (
                <button
                  style={{ ...btn((data?.balance ?? 0) >= opt.minTokens ? '#6366f1' : 'var(--border)'), padding: '6px 14px', fontSize: 12, color: (data?.balance ?? 0) >= opt.minTokens ? '#fff' : 'var(--text-muted)' }}
                  onClick={() => { setRedeemModal(opt); setRedeemAmt(String(opt.minTokens)) }}
                  disabled={(data?.balance ?? 0) < opt.minTokens}
                >
                  {(data?.balance ?? 0) >= opt.minTokens ? 'Redeem' : `Need ${opt.minTokens}`}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Transaction history */}
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Token History</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['all','earn','redeem'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--border)', background: filter === f ? '#6366f1' : 'var(--card)', color: filter === f ? '#fff' : 'var(--text)', cursor: 'pointer', fontSize: 13, textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {loading ? <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Source','Amount','Status','Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {txs.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--row-alt, rgba(0,0,0,.03))' }}>
                    <td style={{ padding: '10px 16px' }}>{t.source}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 700, color: TX_COLOR[t.type] }}>{t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: 12, borderRadius: 5, padding: '2px 8px', background: t.status === 'confirmed' ? 'rgba(34,197,94,.15)' : 'rgba(251,191,36,.15)', color: t.status === 'confirmed' ? '#86efac' : '#fbbf24' }}>{t.status}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>{new Date(t.date).toLocaleDateString()}</td>
                  </tr>
                ))}
                {txs.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>No transactions.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        {/* Redeem modal */}
        {redeemModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--card)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{redeemModal.icon} {redeemModal.name}</h2>
              <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: 13 }}>{redeemModal.rate}</p>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 5 }}>Token Amount (min {redeemModal.minTokens})</label>
              <input style={{ ...inp, marginBottom: 18 }} type="number" min={redeemModal.minTokens} step={redeemModal.minTokens} value={redeemAmt} onChange={e => setRedeemAmt(e.target.value)} />
              <div style={{ display: 'flex', gap: 10 }}>
                <button style={btn('var(--border)', 'var(--text)')} onClick={() => setRedeemModal(null)}>Cancel</button>
                <button style={{ ...btn('#6366f1'), flex: 1 }} onClick={handleRedeem} disabled={redeeming}>{redeeming ? 'Redeeming…' : 'Confirm Redemption'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
