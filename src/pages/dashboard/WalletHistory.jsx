import { useState, useEffect, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberWalletHistory } from '../../api/mlmApi'

const TYPE_META = {
  commission:  { icon: '💰', color: '#86efac', label: 'Commission' },
  bonus:       { icon: '🎁', color: '#fbbf24', label: 'Bonus' },
  withdrawal:  { icon: '🏦', color: '#fca5a5', label: 'Withdrawal' },
  purchase:    { icon: '🛒', color: '#fca5a5', label: 'Purchase' },
  refund:      { icon: '↩️', color: '#86efac', label: 'Refund' },
  adjustment:  { icon: '⚙️', color: '#93c5fd', label: 'Adjustment' },
  referral:    { icon: '🔗', color: '#86efac', label: 'Referral' },
  loyalty:     { icon: '⭐', color: '#fbbf24', label: 'Loyalty' },
}

export default function DashWalletHistory() {
  const [txs, setTxs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getMemberWalletHistory().then(setTxs).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = (txs || []).filter(t => {
    const matchType = filter === 'all' || t.type === filter
    const matchSearch = !search || t.description?.toLowerCase().includes(search.toLowerCase()) || t.ref?.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const totalIn  = (txs || []).filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOut = (txs || []).filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const balance  = txs?.length ? txs[0].balance : 0

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📒 Wallet History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Full transaction ledger for your wallet.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Current Balance', value: `$${balance?.toFixed(2)}`, color: 'var(--gold)' },
            { label: 'Total Received', value: `+$${totalIn.toFixed(2)}`, color: '#86efac' },
            { label: 'Total Spent', value: `-$${totalOut.toFixed(2)}`, color: '#fca5a5' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search description or ref…"
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13, flex: '1 1 180px', minWidth: 0 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {['all', 'commission', 'bonus', 'withdrawal', 'purchase', 'refund'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 12, cursor: 'pointer', fontWeight: filter === f ? 700 : 400, textTransform: 'capitalize' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No transactions found.</div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            {filtered.map((tx, i) => {
              const meta = TYPE_META[tx.type] || { icon: '💵', color: 'var(--text)', label: tx.type }
              const positive = tx.amount >= 0
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', flexWrap: 'wrap' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.description || meta.label}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 2 }}>
                      {tx.date}{tx.ref && ` · Ref: ${tx.ref}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: positive ? '#86efac' : '#fca5a5' }}>
                      {positive ? '+' : ''}{tx.amount?.toFixed(2)}
                    </div>
                    <div style={{ color: 'var(--text2)', fontSize: 11 }}>Bal: ${tx.balance?.toFixed(2)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
