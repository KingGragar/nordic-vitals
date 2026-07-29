import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useAuth } from '../../context/AuthContext'
import DashboardLayout from '../../components/DashboardLayout'

const SITE_BASE = import.meta.env.VITE_SITE_URL || 'https://nordic-vitals.vercel.app'

const RANK_COLOR = {
  Unranked: { bg: '#1f2937', text: '#9ca3af', border: '#374151' },
  Bronze:   { bg: '#451a03', text: '#fb923c', border: '#78350f' },
  Silver:   { bg: '#1e293b', text: '#94a3b8', border: '#334155' },
  Gold:     { bg: '#451a03', text: '#fbbf24', border: '#78350f' },
  Platinum: { bg: '#2e1065', text: '#c4b5fd', border: '#4c1d95' },
}

export default function MemberCard() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const name       = user?.name     ?? 'Member'
  const memberId   = user?.memberId ?? 'NV-10042'
  const rank       = user?.rank     ?? 'Unranked'
  const pv         = user?.pv       ?? 0
  const totalGV    = (user?.leftGV ?? 0) + (user?.rightGV ?? 0)
  const referralUrl = `${SITE_BASE}/join?ref=${memberId}`
  const rc = RANK_COLOR[rank] ?? RANK_COLOR.Gold

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const cardStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '520px',
    aspectRatio: '85.6/54',
    background: 'linear-gradient(135deg, #0d1b2a 0%, #12243a 55%, #1a3050 100%)',
    borderRadius: '16px',
    border: `1px solid ${rc.border}`,
    padding: '22px 24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${rc.border}`,
    overflow: 'hidden',
    fontFamily: 'system-ui, sans-serif',
    cursor: 'default',
    userSelect: 'none',
  }

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          .nv-no-print { display: none !important; }
          .nv-print-only { display: block !important; }
          body { background: white !important; }
          .nv-card-shell { box-shadow: none !important; border: 2px solid #1a3050 !important; }
        }
        .nv-print-only { display: none; }
        .nv-card-shine::before {
          content: '';
          position: absolute;
          top: -40%;
          left: -20%;
          width: 60%;
          height: 180%;
          background: linear-gradient(105deg, transparent 35%, rgba(201,168,76,0.06) 50%, transparent 65%);
          pointer-events: none;
        }
      `}</style>

      <div className="nv-no-print" style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px' }}>
          Member ID Card
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
          Share your QR code to recruit — or print your card for offline networking.
        </p>
      </div>

      {/* Card */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '28px 0' }}>
        <div className="nv-card-shell nv-card-shine" style={cardStyle}>
          {/* Decorative arc */}
          <div style={{
            position: 'absolute', top: -60, right: -60,
            width: 220, height: 220,
            borderRadius: '50%',
            border: `1px solid ${rc.border}`,
            opacity: 0.25,
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 140, height: 140,
            borderRadius: '50%',
            border: `1px solid ${rc.border}`,
            opacity: 0.18,
            pointerEvents: 'none',
          }} />

          {/* Top row: branding + QR */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: '2px' }}>
                Nordic Vitals
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', fontWeight: 500 }}>
                Member Portal
              </div>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: '6px',
              padding: '4px',
              flexShrink: 0,
            }}>
              <QRCodeSVG
                value={referralUrl}
                size={64}
                level="M"
                bgColor="#ffffff"
                fgColor="#0d1b2a"
              />
            </div>
          </div>

          {/* Middle: member info */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)', marginBottom: '4px', letterSpacing: '0.3px' }}>
              {name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--text2)',
                letterSpacing: '1.5px',
                background: 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid var(--border)',
              }}>
                {memberId}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: 700,
                padding: '2px 10px', borderRadius: '999px',
                background: rc.bg, color: rc.text,
                border: `1px solid ${rc.border}`,
                letterSpacing: '0.8px',
              }}>
                ★ {rank.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Bottom row: stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '10px' }}>
            <div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)', marginBottom: '2px' }}>Personal Vol.</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)' }}>{pv.toLocaleString()} PV</div>
            </div>
            <div>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)', marginBottom: '2px' }}>Group Vol.</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cream)' }}>{totalGV.toLocaleString()} GV</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text2)', marginBottom: '2px' }}>Scan to join</div>
              <div style={{ fontSize: '9px', color: 'var(--gold)', fontFamily: 'monospace' }}>nordic-vitals.vercel.app</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="nv-no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '32px' }}>
        <button className="btn btn-gold" onClick={handleCopy}>
          {copied ? '✓ Copied!' : '🔗 Copy Referral Link'}
        </button>
        <button className="btn btn-outline" onClick={() => window.print()}>
          🖨️ Print Card
        </button>
      </div>

      {/* Referral link display */}
      <div className="nv-no-print card" style={{ maxWidth: '520px', marginBottom: '24px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
          Your Referral Link
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            readOnly
            value={referralUrl}
            className="input"
            style={{ flex: 1, fontSize: '13px', color: 'var(--text2)' }}
          />
          <button className="btn btn-outline btn-sm" onClick={handleCopy}>
            {copied ? '✓' : 'Copy'}
          </button>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.6 }}>
          Share this link to earn Sponsor Bonuses when new members join using your referral.
        </div>
      </div>

      {/* Tips */}
      <div className="nv-no-print card" style={{ maxWidth: '520px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600 }}>
          Tips for Using Your Card
        </div>
        <ul style={{ paddingLeft: '0', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            '🖨️ Print and carry the card to events and meetups',
            '📱 Show the QR code on your phone screen to prospects',
            '💬 Share your referral link in messages, emails, and social posts',
            '📊 Each person who joins using your link appears in My Tree',
          ].map(tip => (
            <li key={tip} style={{ fontSize: '13px', color: 'var(--text)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ flexShrink: 0, paddingTop: '1px' }}>{tip.slice(0, 2)}</span>
              <span>{tip.slice(3)}</span>
            </li>
          ))}
        </ul>
      </div>
    </DashboardLayout>
  )
}
