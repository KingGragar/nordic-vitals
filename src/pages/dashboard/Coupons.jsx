import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberCoupons } from '../../api/mlmApi'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysLeft(iso) {
  const d = Math.ceil((new Date(iso) - Date.now()) / 86400000)
  return d
}

function CouponCard({ c }) {
  const [copied, setCopied] = useState(false)
  const used = !!c.usedAt
  const expired = !used && c.expiresAt && new Date(c.expiresAt) < Date.now()
  const days = c.expiresAt && !used && !expired ? daysLeft(c.expiresAt) : null

  function copy() {
    navigator.clipboard?.writeText(c.code).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const dimmed = used || expired
  const badge = used
    ? { bg: '#1e1e1e', color: '#888', border: '#333', label: 'Used' }
    : expired
    ? { bg: '#2d0f0f', color: '#fca5a5', border: '#991b1b', label: 'Expired' }
    : days !== null && days <= 7
    ? { bg: '#2d1f00', color: '#fbbf24', border: '#92400e', label: `${days}d left` }
    : { bg: '#052e16', color: '#86efac', border: '#166534', label: 'Active' }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', opacity: dimmed ? 0.6 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`, fontWeight: 600 }}>{badge.label}</span>
            {c.type === 'percent'
              ? <span style={{ fontWeight: 700, fontSize: 18 }}>{c.value}% OFF</span>
              : <span style={{ fontWeight: 700, fontSize: 18 }}>NOK {c.value} OFF</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>{c.description}</div>
        </div>
        {!used && !expired && (
          <button onClick={copy}
            style={{ background: copied ? '#052e16' : 'var(--bg)', border: `1px solid ${copied ? '#166534' : 'var(--border)'}`, borderRadius: 8, padding: '8px 14px', color: copied ? '#86efac' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            {copied ? '✅ Copied!' : '📋 Copy Code'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: '0.15em', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 6, padding: '6px 14px', color: dimmed ? 'var(--text2)' : 'var(--text)' }}>
          {c.code}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {c.minOrderNok > 0 && <span>Min order: NOK {c.minOrderNok.toLocaleString()}</span>}
        {c.maxDiscountNok && <span>Max discount: NOK {c.maxDiscountNok}</span>}
        {c.expiresAt && !used && <span>Expires: {fmtDate(c.expiresAt)}</span>}
        {used && <span>Used: {fmtDate(c.usedAt)}</span>}
        {c.earnedFor && <span>🎁 {c.earnedFor}</span>}
      </div>
    </div>
  )
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('available')

  useEffect(() => { getMemberCoupons().then(setCoupons).finally(() => setLoading(false)) }, [])

  const available = coupons.filter(c => !c.usedAt && (!c.expiresAt || new Date(c.expiresAt) > Date.now()))
  const used = coupons.filter(c => !!c.usedAt)
  const expired = coupons.filter(c => !c.usedAt && c.expiresAt && new Date(c.expiresAt) <= Date.now())
  const visible = tab === 'available' ? available : tab === 'used' ? used : expired

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>🎟️ My Coupons</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Your personal promo codes earned through loyalty, referrals, and promotions.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { icon: '✅', label: 'Available', val: available.length },
            { icon: '✔️', label: 'Used', val: used.length },
            { icon: '⏰', label: 'Expired', val: expired.length },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 22 }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['available', 'Available'], ['used', 'Used'], ['expired', 'Expired']].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ padding: '6px 18px', borderRadius: 20, border: '1px solid var(--border)', background: tab === k ? 'var(--gold)' : 'var(--bg)', color: tab === k ? '#000' : 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: tab === k ? 700 : 400 }}>
              {l}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
            <div>No {tab} coupons.</div>
            {tab === 'available' && <div style={{ fontSize: 13, marginTop: 8 }}>Earn coupons through loyalty milestones, referrals, and special promotions.</div>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {visible.map(c => <CouponCard key={c.id} c={c} />)}
          </div>
        )}

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', marginTop: 28 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>How to earn coupons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { icon: '🌟', text: 'Reach loyalty point milestones' },
              { icon: '🔗', text: 'Refer new members or customers' },
              { icon: '🎂', text: 'Receive birthday month rewards' },
              { icon: '🏆', text: 'Complete challenges and missions' },
              { icon: '📣', text: 'Participate in seasonal promotions' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
