import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberShareTemplates, trackMemberShare } from '../../api/mlmApi'

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: '📘', color: '#1877f2' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#e1306c' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000' },
  { id: 'whatsapp', label: 'WhatsApp', icon: '💬', color: '#25d366' },
  { id: 'copy', label: 'Copy Link', icon: '🔗', color: '#6b7280' },
]

const CATEGORY_ICONS = { rank: '🏆', earnings: '💰', product: '🌿', recruitment: '👥' }

export default function DashSocialSharing() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [editMsg, setEditMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareResult, setShareResult] = useState(null)

  useEffect(() => {
    getMemberShareTemplates().then(d => { setData(d); if (d.templates?.[0]) { setSelected(d.templates[0]); setEditMsg(d.templates[0].message) } }).finally(() => setLoading(false))
  }, [])

  function selectTemplate(t) {
    setSelected(t)
    setEditMsg(t.message)
    setShareResult(null)
    setCopied(false)
  }

  async function handleShare(platform) {
    await trackMemberShare(selected.id, platform.id)
    const text = editMsg + ' https://nordicvitals.com/ref/me'
    if (platform.id === 'copy') {
      navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    } else {
      setShareResult(`Opened ${platform.label} sharing…`)
    }
    setData(prev => ({
      ...prev,
      stats: { ...prev.stats, clicks: prev.stats.clicks + 1 }
    }))
  }

  const stats = data?.stats
  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📣 Social Sharing</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Share your achievements and referral link across social platforms.</div>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 22 }}>
            {[
              { label: 'Link Clicks', value: stats.clicks },
              { label: 'Conversions', value: stats.conversions },
              { label: 'Conversion Rate', value: stats.conversionRate + '%' },
              { label: 'Top Platform', value: stats.topPlatform },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16, alignItems: 'start' }}>
            {/* Template picker */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Templates</div>
              {(data?.templates || []).map(t => (
                <button key={t.id} onClick={() => selectTemplate(t)} style={{ padding: '12px 14px', background: selected?.id === t.id ? 'var(--gold)' : 'var(--card)', border: `1px solid ${selected?.id === t.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', color: selected?.id === t.id ? '#000' : 'var(--text)', transition: 'all 0.15s' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{CATEGORY_ICONS[t.category]} {t.title}</div>
                  <div style={{ fontSize: 11, color: selected?.id === t.id ? 'rgba(0,0,0,0.6)' : 'var(--text2)', lineHeight: 1.4 }}>{t.message.slice(0, 60)}…</div>
                </button>
              ))}
            </div>

            {/* Compose & share */}
            {selected && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customise Message</div>
                  <textarea value={editMsg} onChange={e => setEditMsg(e.target.value)} rows={5} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 13, lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  {selected.includesLink && (
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>Your referral link will be appended automatically.</div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share On</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {PLATFORMS.map(p => (
                      <button key={p.id} onClick={() => handleShare(p)} style={{ padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        <span>{p.icon}</span>
                        <span>{p.id === 'copy' && copied ? 'Copied!' : p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {shareResult && (
                  <div style={{ padding: '10px 14px', background: '#052e16', border: '1px solid #166534', borderRadius: 8, fontSize: 13, color: '#86efac' }}>
                    ✅ {shareResult}
                  </div>
                )}

                <div style={{ padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text2)' }}>
                  <strong style={{ color: 'var(--text)' }}>Preview:</strong>
                  <div style={{ marginTop: 6, lineHeight: 1.5 }}>{editMsg}{selected.includesLink ? ' https://nordicvitals.com/ref/me' : ''}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
