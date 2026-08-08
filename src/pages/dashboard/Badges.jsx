import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberBadges } from '../../api/mlmApi'

const RARITY = {
  common:    { label: 'Common',    color: '#9ca3af', bg: '#1c1c1c', border: '#374151' },
  uncommon:  { label: 'Uncommon',  color: '#86efac', bg: '#052e16', border: '#166534' },
  rare:      { label: 'Rare',      color: '#93c5fd', bg: '#1e3a5f', border: '#1d4ed8' },
  epic:      { label: 'Epic',      color: '#c084fc', bg: '#1a0d2e', border: '#7e22ce' },
  legendary: { label: 'Legendary', color: '#fbbf24', bg: '#2d2200', border: '#92400e' },
}

const CATEGORY_LABELS = { all: 'All', sales: 'Sales', rank: 'Rank', recruitment: 'Recruitment', training: 'Training', special: 'Special' }

export default function DashBadges() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getMemberBadges().then(setData).finally(() => setLoading(false))
  }, [])

  const earned = data?.earned || []
  const locked = data?.locked || []
  const filtered = filter === 'all' ? earned : earned.filter(b => b.category === filter)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>🏅 My Badges</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Achievements earned through your business activity and milestones.</div>
        </div>

        {/* Summary row */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Badges Earned', value: earned.length },
              { label: 'Rare or Higher', value: earned.filter(b => ['rare','epic','legendary'].includes(b.rarity)).length },
              { label: 'Still Locked', value: locked.length },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Category filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === k ? 'var(--gold)' : 'var(--card)', color: filter === k ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === k ? 700 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <>
            {/* Earned badges */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No badges in this category yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 30 }}>
                {filtered.map(b => {
                  const r = RARITY[b.rarity] || RARITY.common
                  return (
                    <div key={b.id} style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 12, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 }}>
                      <div style={{ fontSize: 36 }}>{b.icon}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{b.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{b.description}</div>
                      <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: 'rgba(0,0,0,0.3)', color: r.color, border: `1px solid ${r.border}` }}>{r.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{new Date(b.earnedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Locked badges */}
            {locked.length > 0 && filter === 'all' && (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--text2)' }}>🔒 Locked</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                  {locked.map(b => {
                    const r = RARITY[b.rarity] || RARITY.common
                    return (
                      <div key={b.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8, opacity: 0.5 }}>
                        <div style={{ fontSize: 36, filter: 'grayscale(1)' }}>{b.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{b.description}</div>
                        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Requires: {b.requirement}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, color: r.color, border: `1px solid ${r.border}` }}>{r.label}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
