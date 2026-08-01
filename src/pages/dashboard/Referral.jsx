import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getDirectDownline, getMyReferralStats, trackReferralShare } from '../../api/mlmApi'

const SITE_BASE = import.meta.env.VITE_SITE_URL || 'https://nordic-vitals.vercel.app'

const POST_TEMPLATES = [
  {
    id: 'discovery',
    label: '✨ Discovery',
    text: (url, name) =>
      `Just discovered Nordic Vitals — premium Nordic supplements that actually work. If you're serious about your health, check this out: ${url}\n\n#NordicVitals #Supplements #HealthyLiving`,
  },
  {
    id: 'income',
    label: '💰 Earn with us',
    text: (url, name) =>
      `Looking for a side income that fits your lifestyle? I'm building my team with Nordic Vitals — quality supplements + real earning potential. Join me: ${url}\n\n#NordicVitals #MLM #WorkFromAnywhere`,
  },
  {
    id: 'product',
    label: '🐟 Product love',
    text: (url, name) =>
      `Been using Nordic Vitals Omega-3 for 2 months — the quality difference is real. Pure Nordic ingredients, no fillers. Use my link to get started: ${url}\n\n#NordicVitals #Omega3 #CleanSupplements`,
  },
  {
    id: 'team',
    label: '👥 Team building',
    text: (url, name) =>
      `My Nordic Vitals team is growing and I'm looking for motivated people! No experience needed — I'll guide you step by step. DM me or join here: ${url}\n\n#NordicVitals #BusinessOpportunity #TeamWork`,
  },
]

export default function Referral() {
  const { user } = useAuth()
  const [toast, setToast]           = useState(null)
  const [recruits, setRecruits]     = useState([])
  const [stats, setStats]           = useState(null)
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [customText, setCustomText] = useState('')
  const qrRef = useRef(null)

  const memberId    = user?.memberId ?? 'NV-10042'
  const memberName  = user?.name ?? 'member'
  const referralUrl = `${SITE_BASE}/ref/${memberId}`

  useEffect(() => {
    getDirectDownline(memberId)
      .then(d => { if (d?.recruits?.length) setRecruits(d.recruits) })
      .catch(() => {})
    getMyReferralStats(memberId)
      .then(s => setStats(s))
      .catch(() => {})
  }, [memberId])

  function handleDownloadQr() {
    const svgEl = qrRef.current?.querySelector('svg')
    if (!svgEl) return
    const serialized = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'nordic-vitals-qr.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  function handleCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Copied to clipboard!')
    }).catch(() => {
      showToast('Copied to clipboard!')
    })
  }

  function handleShare(platform) {
    trackReferralShare(memberId, platform).catch(() => {})
    const enc = encodeURIComponent
    const shareText = `Join me on Nordic Vitals — premium supplements with real earning potential: ${referralUrl}`
    const urls = {
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${enc(referralUrl)}`,
      twitter:   `https://twitter.com/intent/tweet?text=${enc(shareText)}`,
      linkedin:  `https://www.linkedin.com/sharing/share-offsite/?url=${enc(referralUrl)}`,
      telegram:  `https://t.me/share/url?url=${enc(referralUrl)}&text=${enc('Join Nordic Vitals!')}`,
      whatsapp:  `https://wa.me/?text=${enc(shareText)}`,
      email:     `mailto:?subject=Join me on Nordic Vitals&body=${enc(`Hey!\n\nI think you'd love Nordic Vitals supplements. Join using my link:\n${referralUrl}`)}`,
    }
    if (urls[platform]) window.open(urls[platform], '_blank', 'noopener,noreferrer')
  }

  function openTemplate(tpl) {
    setActiveTemplate(tpl)
    setCustomText(tpl.text(referralUrl, memberName))
  }

  const displayStats = stats
    ? [
        { label: 'Total Clicks',   value: stats.totalClicks },
        { label: 'Sign-ups',       value: stats.totalSignups },
        { label: 'Conversion',     value: `${stats.conversionRate}%` },
        { label: 'Active Members', value: stats.activeFromLink },
      ]
    : [
        { label: 'Total Clicks',   value: '—' },
        { label: 'Sign-ups',       value: '—' },
        { label: 'Conversion',     value: '—' },
        { label: 'Active Members', value: '—' },
      ]

  const socialButtons = [
    { id: 'whatsapp',  label: 'WhatsApp',  bg: '#25D366', icon: '📱' },
    { id: 'facebook',  label: 'Facebook',  bg: '#1877F2', icon: '👍' },
    { id: 'twitter',   label: 'X / Twitter', bg: '#14171A', icon: '🐦' },
    { id: 'telegram',  label: 'Telegram',  bg: '#0088cc', icon: '✈️' },
    { id: 'linkedin',  label: 'LinkedIn',  bg: '#0A66C2', icon: '💼' },
    { id: 'email',     label: 'Email',     bg: '#475569', icon: '✉️' },
  ]

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Your Referral Link
      </h1>

      {/* Link card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <label className="label-text" style={{ marginBottom: '8px', display: 'block' }}>Your personal referral link</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            readOnly
            value={referralUrl}
            onFocus={e => e.target.select()}
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button className="btn btn-gold" onClick={() => handleCopy(referralUrl)} style={{ whiteSpace: 'nowrap' }}>
            📋 Copy Link
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '14px',
        marginBottom: '28px',
      }}>
        {displayStats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value">{stats ? s.value : <span style={{ opacity: 0.4 }}>—</span>}</div>
          </div>
        ))}
        {stats && (
          <div className="stat-card">
            <div className="label">This Month</div>
            <div className="value">{stats.thisMonthSignups} new</div>
          </div>
        )}
        {stats && (
          <div className="stat-card">
            <div className="label">Lifetime Earned</div>
            <div className="value" style={{ color: 'var(--gold)' }}>{stats.lifetimeEarned} MLMT</div>
          </div>
        )}
      </div>

      {/* Social sharing */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px' }}>
          Share on Social Media
        </h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {socialButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => handleShare(btn.id)}
              style={{
                background: btn.bg,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'opacity 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <span>{btn.icon}</span> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Post templates */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)', marginBottom: '6px' }}>
          Ready-made Post Templates
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>
          Pick a template, customise it, then copy or share directly.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {POST_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              className={`btn ${activeTemplate?.id === tpl.id ? 'btn-gold' : 'btn-outline'}`}
              onClick={() => openTemplate(tpl)}
              style={{ fontSize: '13px' }}
            >
              {tpl.label}
            </button>
          ))}
        </div>

        {activeTemplate && (
          <div>
            <textarea
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              rows={5}
              style={{
                width: '100%',
                background: 'var(--navy)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--cream)',
                padding: '12px',
                fontSize: '13px',
                lineHeight: 1.6,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-gold" onClick={() => handleCopy(customText)}>
                📋 Copy Post
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  trackReferralShare(memberId, 'twitter').catch(() => {})
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(customText)}`,
                    '_blank', 'noopener,noreferrer'
                  )
                }}
                style={{ fontSize: '13px' }}
              >
                🐦 Tweet this
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  trackReferralShare(memberId, 'whatsapp').catch(() => {})
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(customText)}`,
                    '_blank', 'noopener,noreferrer'
                  )
                }}
                style={{ fontSize: '13px' }}
              >
                📱 WhatsApp this
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setActiveTemplate(null)}
                style={{ fontSize: '13px' }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* QR Code */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>QR Code</h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)', margin: 0 }}>
          Print on flyers or business cards — anyone who scans it lands on your personal referral page.
        </p>
        <div ref={qrRef} style={{
          background: '#12243a',
          borderRadius: '12px',
          padding: '20px',
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          border: '1px solid var(--border)',
        }}>
          <QRCodeSVG value={referralUrl} size={180} bgColor="#12243a" fgColor="#c9a84c" />
          <span style={{ fontSize: '11px', color: 'var(--gold)', letterSpacing: '0.5px' }}>{referralUrl}</span>
          <button onClick={handleDownloadQr} className="btn btn-outline btn-sm">
            ⬇ Download QR
          </button>
        </div>
      </div>

      {/* Direct recruits table */}
      <div style={{
        background: 'var(--navy2)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>Direct Recruits</h2>
          <span style={{ fontSize: '12px', color: 'var(--text2)' }}>{recruits.length} total</span>
        </div>
        {recruits.length === 0 ? (
          <div style={{ padding: '28px 24px', color: 'var(--text2)', fontSize: '13px', textAlign: 'center' }}>
            No direct recruits yet — share your link above to start building your team.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Joined</th>
                <th>Rank</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recruits.map((r, i) => (
                <tr key={r.id || i}>
                  <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{r.name}</td>
                  <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{r.joined}</td>
                  <td>
                    <span className={`badge ${r.rank === 'Gold' || r.rank === 'Platinum' ? 'badge-gold' : r.rank === 'Silver' || r.rank === 'Bronze' ? 'badge-blue' : 'badge-grey'}`}>
                      {r.rank}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'Active' ? 'badge-green' : 'badge-grey'}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </DashboardLayout>
  )
}
