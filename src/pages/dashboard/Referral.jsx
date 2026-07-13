import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import DashboardLayout from '../../components/DashboardLayout'

const REFERRAL_URL = 'https://nordicvitals.com/join?ref=NV-10042'

const RECRUITS = [
  { name: 'Mia Andersen', joined: '2025-05-01', pkg: 'Executive', status: 'Active' },
  { name: 'Erik Solberg',  joined: '2025-06-14', pkg: 'Builder',   status: 'Active' },
  { name: 'Anna Lund',     joined: '2025-09-18', pkg: 'Starter',   status: 'Active' },
  { name: 'Olaf Berg',     joined: '2026-03-20', pkg: 'Builder',   status: 'Active' },
  { name: 'Sigrid Voss',   joined: '2026-02-14', pkg: 'Executive', status: 'Active' },
]

const STATS = [
  { label: 'Clicks', value: '124' },
  { label: 'Sign-ups', value: '12' },
  { label: 'Conversion', value: '9.7%' },
  { label: 'Active from link', value: '8' },
]

export default function Referral() {
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function handleCopy() {
    navigator.clipboard.writeText(REFERRAL_URL).then(() => {
      showToast('Copied to clipboard! 📋')
    }).catch(() => {
      showToast('Copied to clipboard! 📋')
    })
  }

  const waLink = `whatsapp://send?text=Join Nordic Vitals! ${REFERRAL_URL}`
  const emailLink = `mailto:?subject=Join me on Nordic Vitals&body=Hey! I think you'd love Nordic Vitals supplements. Join using my link and get started: ${REFERRAL_URL}`

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
              value={REFERRAL_URL}
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
        <div style={{
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
            value={REFERRAL_URL}
            size={180}
            bgColor="#12243a"
            fgColor="#c9a84c"
          />
          <a
            href={`data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg"/>`}
            download="nordic-vitals-qr.svg"
            className="btn btn-outline btn-sm"
            style={{ textAlign: 'center' }}
          >
            Download QR
          </a>
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
        <div style={{ padding: '20px 24px 12px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--cream)' }}>Direct Recruits</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Joined</th>
              <th>Package</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {RECRUITS.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600, color: 'var(--cream)' }}>{r.name}</td>
                <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{r.joined}</td>
                <td>
                  <span className={`badge ${r.pkg === 'Executive' ? 'badge-gold' : r.pkg === 'Builder' ? 'badge-blue' : 'badge-grey'}`}>
                    {r.pkg}
                  </span>
                </td>
                <td>
                  <span className="badge badge-green">{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </DashboardLayout>
  )
}
