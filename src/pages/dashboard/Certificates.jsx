import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { useAuth } from '../../context/AuthContext'
import { getCertificates } from '../../api/mlmApi'

const TYPE_CONFIG = {
  rank:      { label: 'Rank Achievement', color: '#c9a84c', bg: 'rgba(201,168,76,0.12)',  border: 'rgba(201,168,76,0.35)' },
  training:  { label: 'Training',         color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)' },
  milestone: { label: 'Milestone',        color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  border: 'rgba(168,85,247,0.35)' },
}

function Badge({ type }) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.milestone
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 10,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  )
}

function CertCard({ cert, onView }) {
  const cfg = TYPE_CONFIG[cert.type] || TYPE_CONFIG.milestone
  return (
    <div
      onClick={() => onView(cert)}
      style={{
        background: 'var(--navy2)',
        border: `1px solid ${cfg.border}`,
        borderRadius: 14,
        padding: '20px 22px',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.color}22`
        e.currentTarget.style.borderColor = cfg.color
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.borderColor = cfg.border
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontSize: 36, width: 56, height: 56,
          background: cfg.bg, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${cfg.border}`,
        }}>
          {cert.icon}
        </div>
        <Badge type={cert.type} />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: 15, marginBottom: 4 }}>{cert.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{cert.description}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, color: 'var(--text2)' }}>
          Issued {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span style={{ fontSize: 12, color: cfg.color, fontWeight: 600 }}>View →</span>
      </div>
    </div>
  )
}

function CertModal({ cert, onClose }) {
  const printRef = useRef()
  const cfg = TYPE_CONFIG[cert.type] || TYPE_CONFIG.milestone

  function handlePrint() {
    const win = window.open('', '_blank')
    if (!win) return
    const html = printRef.current.outerHTML
    win.document.write(`<!DOCTYPE html><html><head><title>${cert.title}</title>
      <style>
        body { margin: 0; font-family: 'Georgia', serif; background: #fff; color: #1a1a2e; }
        @page { size: A4 landscape; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>${html}</body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 500)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={handlePrint} className="btn-gold" style={{ padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14 }}>
            🖨️ Print / Save PDF
          </button>
          <button onClick={onClose} className="btn-outline" style={{ padding: '8px 18px', borderRadius: 8, fontSize: 14 }}>
            Close
          </button>
        </div>

        {/* The Certificate */}
        <div ref={printRef} style={{
          background: '#fffef9',
          border: `8px double ${cfg.color}`,
          borderRadius: 8,
          padding: '52px 64px',
          fontFamily: "'Georgia', serif",
          color: '#1a1a2e',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}>
          {/* Corner decorations */}
          {[
            { top: 12, left: 12 },
            { top: 12, right: 12 },
            { bottom: 12, left: 12 },
            { bottom: 12, right: 12 },
          ].map((pos, i) => (
            <div key={i} style={{
              position: 'absolute', ...pos, width: 28, height: 28,
              border: `2px solid ${cfg.color}`,
              opacity: 0.5,
            }} />
          ))}

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>❄️ 🌿</div>
            <div style={{ fontSize: 13, letterSpacing: 5, textTransform: 'uppercase', color: cfg.color, fontWeight: 700, marginBottom: 4 }}>
              Nordic Vitals
            </div>
            <div style={{ width: 80, height: 1, background: cfg.color, margin: '0 auto 12px', opacity: 0.4 }} />
            <h1 style={{
              fontSize: 30, fontWeight: 400, margin: 0,
              letterSpacing: 2, color: '#1a1a2e',
              fontStyle: 'italic',
            }}>
              Certificate of Achievement
            </h1>
          </div>

          {/* Body */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 14, color: '#555', margin: '0 0 16px', letterSpacing: 1 }}>This certifies that</p>
            <div style={{
              fontSize: 34, fontWeight: 700, letterSpacing: 1.5,
              color: cfg.color, margin: '0 0 20px',
              borderBottom: `2px solid ${cfg.color}44`,
              paddingBottom: 12, display: 'inline-block', minWidth: 280,
            }}>
              {cert.recipient_name}
            </div>
            <p style={{ fontSize: 14, color: '#555', margin: '16px 0 8px', letterSpacing: 1 }}>has earned the</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, margin: '8px 0 20px' }}>
              <span style={{ fontSize: 36 }}>{cert.icon}</span>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', letterSpacing: 1 }}>
                {cert.title}
              </div>
            </div>
            <p style={{ fontSize: 13, color: '#666', maxWidth: 480, margin: '0 auto', lineHeight: 1.6, fontStyle: 'italic' }}>
              {cert.description}
            </p>
          </div>

          {/* Date & cert number */}
          <div style={{ textAlign: 'center', margin: '0 0 28px' }}>
            <span style={{ fontSize: 13, color: '#888', letterSpacing: 1 }}>
              Issued on {new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span style={{ margin: '0 16px', color: '#ccc' }}>·</span>
            <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{cert.cert_number}</span>
          </div>

          {/* Signatures */}
          <div style={{
            display: 'flex', justifyContent: 'space-around',
            borderTop: `1px solid ${cfg.color}33`, paddingTop: 24,
          }}>
            {[
              { name: cert.signer_1_name, title: cert.signer_1_title },
              { name: cert.signer_2_name, title: cert.signer_2_title },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{
                  height: 36, borderBottom: `1px solid #888`, marginBottom: 6,
                  fontFamily: 'cursive', fontSize: 18, color: '#333',
                  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                  paddingBottom: 4, minWidth: 180,
                }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 12, color: '#555', letterSpacing: 0.5 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{s.title}</div>
              </div>
            ))}
          </div>

          {/* Seal */}
          <div style={{
            position: 'absolute', bottom: 28, right: 40,
            width: 72, height: 72, borderRadius: '50%',
            border: `3px solid ${cfg.color}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: cfg.color, opacity: 0.45,
            background: `${cfg.color}08`,
          }}>
            <div style={{ fontSize: 18 }}>❄️</div>
            <div style={{ fontSize: 8, letterSpacing: 1, fontWeight: 700, textAlign: 'center', marginTop: 2, lineHeight: 1.2 }}>
              NORDIC<br />VITALS
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'rank', label: '🥇 Rank' },
  { key: 'training', label: '🎓 Training' },
  { key: 'milestone', label: '⭐ Milestones' },
]

export default function Certificates() {
  const { user } = useAuth()
  const [certs, setCerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewing, setViewing] = useState(null)

  useEffect(() => {
    setLoading(true)
    getCertificates(user?.userId).then(data => {
      setCerts(data)
      setLoading(false)
    })
  }, [user?.userId])

  const displayed = filter === 'all' ? certs : certs.filter(c => c.type === filter)
  const counts = { all: certs.length, rank: certs.filter(c => c.type === 'rank').length, training: certs.filter(c => c.type === 'training').length, milestone: certs.filter(c => c.type === 'milestone').length }

  return (
    <DashboardLayout>
      <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--cream)' }}>🎖️ Achievement Certificates</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text2)', fontSize: 14 }}>
            Your official Nordic Vitals certificates — printable and shareable.
          </p>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Earned', value: counts.all, color: 'var(--gold)', icon: '🏅' },
            { label: 'Rank Certs', value: counts.rank, color: '#c9a84c', icon: '🥇' },
            { label: 'Training Certs', value: counts.training, color: '#3b82f6', icon: '🎓' },
            { label: 'Milestones', value: counts.milestone, color: '#a855f7', icon: '⭐' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ textAlign: 'center', padding: '18px 16px' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: filter === f.key ? 'var(--gold)' : 'transparent',
                color: filter === f.key ? 'var(--navy)' : 'var(--text2)',
                borderColor: filter === f.key ? 'var(--gold)' : 'var(--border)',
                transition: 'all 0.15s',
              }}
            >
              {f.label} {counts[f.key] > 0 && <span style={{ opacity: 0.7 }}>({counts[f.key]})</span>}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading certificates…</div>
        ) : displayed.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--navy2)', borderRadius: 14, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 42, marginBottom: 12 }}>🎖️</div>
            <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>No certificates yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 14 }}>
              {filter === 'all'
                ? 'Achieve rank milestones, complete training, and earn milestones to unlock certificates.'
                : `No ${filter} certificates earned yet.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {displayed.map(cert => (
              <CertCard key={cert.id} cert={cert} onView={setViewing} />
            ))}
          </div>
        )}

        {/* Info footer */}
        <div style={{
          marginTop: 32, padding: '16px 20px', borderRadius: 10,
          background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)',
          fontSize: 13, color: 'var(--text2)',
        }}>
          💡 <strong style={{ color: 'var(--gold)' }}>Tip:</strong> Click any certificate to view it full-size, then use "Print / Save PDF" to download a high-quality copy suitable for framing or sharing on social media.
        </div>
      </div>

      {viewing && <CertModal cert={viewing} onClose={() => setViewing(null)} />}
    </DashboardLayout>
  )
}
