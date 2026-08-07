import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberVouchers, claimMemberVoucher } from '../../api/mlmApi'

const TYPE_STYLE = {
  discount:    { icon: '🏷️', color: '#f59e0b', label: 'Discount' },
  cashback:    { icon: '💵', color: '#10b981', label: 'Cashback' },
  shipping:    { icon: '📦', color: '#6366f1', label: 'Free Shipping' },
  points:      { icon: '⭐', color: '#ec4899', label: 'Bonus Points' },
  product:     { icon: '🎁', color: '#14b8a6', label: 'Free Product' },
}

function VoucherCard({ voucher, onCopy }) {
  const [copied, setCopied] = useState(false)
  const type = TYPE_STYLE[voucher.type] || TYPE_STYLE.discount
  const expired = voucher.expiresAt && new Date(voucher.expiresAt) < new Date()
  const daysLeft = voucher.expiresAt
    ? Math.max(0, Math.ceil((new Date(voucher.expiresAt) - new Date()) / 86400000))
    : null

  function copyCode() {
    navigator.clipboard.writeText(voucher.code).catch(() => {})
    setCopied(true)
    onCopy && onCopy(voucher.code)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${voucher.used ? 'var(--border)' : type.color + '44'}`, borderRadius: 12, padding: '18px 20px', opacity: voucher.used || expired ? 0.6 : 1, position: 'relative', overflow: 'hidden' }}>
      {(voucher.used || expired) && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: voucher.used ? '#1c1c1c' : '#450a0a', color: voucher.used ? '#a3a3a3' : '#fca5a5', border: `1px solid ${voucher.used ? '#404040' : '#991b1b'}` }}>
          {voucher.used ? 'USED' : 'EXPIRED'}
        </div>
      )}
      {!voucher.used && !expired && daysLeft !== null && daysLeft <= 7 && (
        <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: '#451a03', color: '#fcd34d', border: '1px solid #92400e' }}>
          {daysLeft === 0 ? 'EXPIRES TODAY' : `${daysLeft}d left`}
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 48, height: 48, borderRadius: 10, background: type.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{type.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>{voucher.title}</span>
            <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 4, background: type.color + '22', color: type.color, border: `1px solid ${type.color}44`, fontWeight: 600 }}>{type.label}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: type.color, marginBottom: 4 }}>{voucher.valueLabel}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10 }}>
            {voucher.description}
            {voucher.minOrder && <span> · Min. order NOK {voucher.minOrder.toLocaleString()}</span>}
          </div>
          {!voucher.used && !expired && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', color: type.color }}>{voucher.code}</code>
              <button onClick={copyCode} style={{ padding: '6px 14px', borderRadius: 6, border: `1px solid ${type.color}`, background: copied ? type.color : 'none', color: copied ? '#fff' : type.color, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.15s' }}>
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
          )}
          {voucher.usedAt && (
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 6 }}>Used on {new Date(voucher.usedAt).toLocaleDateString()}{voucher.usedOnOrder ? ` · Order #${voucher.usedOnOrder}` : ''}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function HowToEarnCard({ icon, title, desc }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{desc}</div>
    </div>
  )
}

export default function MemberVouchers() {
  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('available')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getMemberVouchers().then(v => { setVouchers(v); setLoading(false) })
  }, [])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  const available = vouchers.filter(v => !v.used && (!v.expiresAt || new Date(v.expiresAt) >= new Date()))
  const used = vouchers.filter(v => v.used || (v.expiresAt && new Date(v.expiresAt) < new Date()))

  const displayList = tab === 'available' ? available : used

  const total = vouchers.length
  const totalSaved = used.filter(v => v.used && v.savedAmount).reduce((s, v) => s + v.savedAmount, 0)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>🎟️ My Vouchers</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>Your discount codes, cashback vouchers, and special offers.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 12, marginBottom: 28 }}>
          {[
            { icon: '🎟️', label: 'Total Vouchers', value: total },
            { icon: '✅', label: 'Available', value: available.length },
            { icon: '💵', label: 'Total Saved', value: `NOK ${totalSaved.toLocaleString()}` },
            { icon: '⏳', label: 'Expiring Soon', value: available.filter(v => v.expiresAt && Math.ceil((new Date(v.expiresAt) - new Date()) / 86400000) <= 7).length },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
          {[['available', `Available (${available.length})`], ['used', `Used / Expired (${used.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ padding: '8px 18px', border: 'none', background: 'none', color: tab === key ? '#6366f1' : 'var(--text2)', fontWeight: tab === key ? 700 : 400, borderBottom: `2px solid ${tab === key ? '#6366f1' : 'transparent'}`, cursor: 'pointer', fontSize: 14, marginBottom: -1 }}>{label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading…</div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎟️</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{tab === 'available' ? 'No available vouchers' : 'No used vouchers yet'}</div>
            <div style={{ fontSize: 13 }}>{tab === 'available' ? 'Earn vouchers by hitting milestones, referring friends, or completing training.' : 'Vouchers you use will appear here.'}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {displayList.map(v => <VoucherCard key={v.id} voucher={v} onCopy={code => showToast(`Code "${code}" copied!`)} />)}
          </div>
        )}

        {tab === 'available' && (
          <div style={{ marginTop: 36 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>How to Earn Vouchers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              <HowToEarnCard icon="🏅" title="Hit Milestones" desc="Unlock discount vouchers automatically when you reach rank milestones." />
              <HowToEarnCard icon="👥" title="Refer Friends" desc="Get cashback vouchers for every qualified referral that places their first order." />
              <HowToEarnCard icon="🎓" title="Complete Training" desc="Finish training modules to earn bonus points vouchers redeemable in the shop." />
              <HowToEarnCard icon="⭐" title="Loyalty Points" desc="Redeem your loyalty points for vouchers in the Loyalty section." />
              <HowToEarnCard icon="🎙️" title="Attend Events" desc="Exclusive vouchers are distributed to event attendees." />
            </div>
          </div>
        )}

        {toast && (
          <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#1e1e1e', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, zIndex: 2000, boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>{toast}</div>
        )}
      </div>
    </DashboardLayout>
  )
}
