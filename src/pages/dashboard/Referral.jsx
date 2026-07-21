import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getDirectDownline } from '../../api/mlmApi'

const SITE_BASE = import.meta.env.VITE_SITE_URL || 'https://nordic-vitals.vercel.app'

const STATS = [
  { label: 'Clicks', value: '124' },
  { label: 'Sign-ups', value: '12' },
  { label: 'Conversion', value: '9.7%' },
  { label: 'Active from link', value: '8' },
]

export default function Referral() {
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [recruits, setRecruits] = useState([])
  const qrRef = useRef(null)

  const memberId    = user?.memberId ?? 'NV-10042'
  const referralUrl = `${SITE_BASE}/join?ref=${memberId}`

  useEffect(() => {
    getDirectDownline(memberId)
      .then(d => { if (d?.recruits?.length) setRecruits(d.recruits) })
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
    setTimeout(() => setToast(null), 2000)
  }

  function handleCopy() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      showToast('Copied to clipboard! 📋')
    }).catch(() => {
      showToast('Copied to clipboard! 📋')
    })
  }

  const waLink    = `whatsapp://send?text=Join Nordic Vitals! ${referralUrl}`
  const emailLink = `mailto:?subject=Join me on Nordic Vitals&body=Hey! I think you'd love Nordic Vitals supplements. Join using my link and get started: ${referralUrl}`

  return (
    <DashboardLayout>
      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '24px' }}>
        Your Referral Link
      </h1>

      {/* Big link card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label className="label-text">Your personal referral link</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="input"
              readOnly
              value={referralUrl}
              onFocus={e => e.target.select()}
            />
            <button
              className="btn btn-gold"
              onClick={handleCopy}
              style={{ whiteSpace: 'nowrap' }}
            >
              Copy Link
            </button>
          </div>
        </div>

        {/* Share row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
          <a href={waLink} className="btn btn-outline">
            📱 WhatsApp
          </a>
          <a href={emailLink} className="btn btn-outline">
            ✉️ Email
          </a>
          <button className="btn btn-outline" onClick={handleCopy}>
            📋 Copy
          </button>
        </div>
      </div>

      {/* QR Code */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>QR Code</h2>
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
          <QRCodeSVG
            value={referralUrl}
            size={180}
            bgColor="#12243a"
            fgColor="#c9a84c"
          />
          <button
            onClick={handleDownloadQr}
            className="btn btn-outline btn-sm"
            style={{ textAlign: 'center' }}
          >
            Download QR
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {STATS.map(s => (
          <div key={s.label} className="stat-card">
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
          </div>
        ))}
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
            No direct recruits yet — share your link to start building your team.
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
