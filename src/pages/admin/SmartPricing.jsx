import { useState, useEffect, useCallback } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminSmartPricing, toggleAdminSmartPricingRule } from '../../api/mlmApi'

const STATUS_COLORS = {
  active:  { bg: '#052e16', color: '#86efac', border: '#166534' },
  paused:  { bg: '#1c1917', color: '#fbbf24', border: '#92400e' },
  pending: { bg: '#1e1b4b', color: '#a5b4fc', border: '#3730a3' },
}

export default function AdminSmartPricing() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    getAdminSmartPricing().then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  async function toggle(rule) {
    const next = rule.status === 'active' ? 'paused' : 'active'
    setToggling(rule.id)
    await toggleAdminSmartPricingRule(rule.id, next)
    setData(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === rule.id ? { ...r, status: next } : r),
    }))
    setToggling(null)
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }

  if (loading) return <AdminLayout><div style={{ textAlign: 'center', padding: 80, color: 'var(--text2)' }}>Loading…</div></AdminLayout>
  if (!data) return null

  const filtered = filter === 'all' ? data.rules : data.rules.filter(r => r.status === filter)

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>💰 Smart Pricing</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Dynamic pricing rules engine — triggers, discounts, floors, and ceilings.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Active Rules',    value: data.stats.activeRules,    color: '#86efac' },
            { label: 'Pending',         value: data.stats.pendingRules,   color: '#a5b4fc' },
            { label: 'Avg Discount',    value: `${data.stats.avgDiscount}%`, color: '#fbbf24' },
            { label: 'Revenue Impact',  value: data.stats.revenueImpact,  color: '#f9a8d4' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {['all', 'active', 'paused', 'pending'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, fontWeight: filter === f ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(rule => {
            const sc = STATUS_COLORS[rule.status] || STATUS_COLORS.pending
            return (
              <div key={rule.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 220px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{rule.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: 12 }}>Trigger: <code style={{ background: 'var(--border)', padding: '1px 6px', borderRadius: 4 }}>{rule.trigger}</code></div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>
                    {rule.action === 'discount' ? `−${rule.value}${rule.unit}` : `+${rule.value}${rule.unit} back`}
                  </span>
                  {rule.floor && <span style={{ fontSize: 11, color: 'var(--text2)' }}>Floor: €{rule.floor}</span>}
                  {rule.ceiling && <span style={{ fontSize: 11, color: 'var(--text2)' }}>Cap: €{rule.ceiling}</span>}
                  <span style={{ fontSize: 11, color: 'var(--text2)' }}>{rule.hits} hits</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px', textTransform: 'capitalize' }}>
                  {rule.status}
                </span>
                {rule.status !== 'pending' && (
                  <button
                    disabled={toggling === rule.id}
                    onClick={() => toggle(rule)}
                    style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {toggling === rule.id ? '…' : rule.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
