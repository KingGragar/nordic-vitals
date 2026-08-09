import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberXpHistory } from '../../api/mlmApi'

const TYPE_COLORS = { earn: '#86efac', redeem: '#f9a8d4', bonus: '#fbbf24', expire: '#f87171', adjustment: '#a5b4fc' }
const TYPE_ICONS  = { earn: '⬆️', redeem: '⬇️', bonus: '🎁', expire: '💨', adjustment: '✏️' }

export default function DashXpHistory() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    getMemberXpHistory().then(setData).finally(() => setLoading(false))
  }, [])

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }

  if (loading) return <DashboardLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></DashboardLayout>
  if (!data) return null

  const types = ['all', 'earn', 'redeem', 'bonus', 'expire', 'adjustment']
  const filtered = data.transactions.filter(t => typeFilter === 'all' || t.type === typeFilter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>⚡ XP & Points History</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Full ledger of all your XP earnings, redemptions, bonuses, and expirations.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total XP',      value: data.stats.totalXp.toLocaleString(),    color: '#fbbf24' },
            { label: 'This Month',    value: `+${data.stats.thisMonth.toLocaleString()}`, color: '#86efac' },
            { label: 'Redeemed YTD', value: data.stats.redeemedYtd.toLocaleString(), color: '#f9a8d4' },
            { label: 'Expiring Soon', value: data.stats.expiringSoon.toLocaleString(), color: '#f87171' },
          ].map(s => (
            <div key={s.label} style={{ ...card, textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 20, padding: '12px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>Progress to Next Tier</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{data.stats.totalXp.toLocaleString()} / {data.stats.nextTierXp.toLocaleString()} XP</span>
          </div>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, Math.round((data.stats.totalXp / data.stats.nextTierXp) * 100))}%`, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', borderRadius: 5 }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>{(data.stats.nextTierXp - data.stats.totalXp).toLocaleString()} XP to <strong style={{ color: 'var(--gold)' }}>{data.stats.nextTierName}</strong></div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {types.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') : 'var(--border)'}`,
              background: typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') + '22' : 'transparent',
              color: typeFilter === t ? (TYPE_COLORS[t] || 'var(--gold)') : 'var(--text2)',
              fontWeight: 600, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
            }}>{t}</button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(t => (
            <div key={t.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px' }}>
              <span style={{ fontSize: 20 }}>{TYPE_ICONS[t.type] || '•'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.description}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{t.source} · {t.date}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16, color: t.type === 'earn' || t.type === 'bonus' ? '#86efac' : t.type === 'expire' ? '#f87171' : '#f9a8d4' }}>
                  {t.type === 'earn' || t.type === 'bonus' ? '+' : '−'}{t.xp.toLocaleString()} XP
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>Balance: {t.balance.toLocaleString()}</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)', fontSize: 14 }}>No transactions for this type.</div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
