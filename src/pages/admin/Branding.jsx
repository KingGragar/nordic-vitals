import { useState, useEffect, useRef } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getBrandingConfig, saveBrandingConfig } from '../../api/mlmApi'

const SECTION = {
  background: 'var(--card)', border: '1px solid var(--border)',
  borderRadius: 10, padding: '24px 28px', marginBottom: 20,
}
const LABEL = { fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }
const INPUT = {
  width: '100%', padding: '9px 12px', borderRadius: 7,
  border: '1px solid var(--border)', background: 'var(--bg2)',
  color: 'var(--text1)', fontSize: 14, boxSizing: 'border-box',
}
const ROW = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={LABEL}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', mono }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...INPUT, fontFamily: mono ? 'monospace' : undefined }}
    />
  )
}

function ColorPicker({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', padding: 2, background: 'var(--bg2)' }} />
      <TextInput value={value} onChange={onChange} placeholder="#c9a84c" mono />
    </div>
  )
}

function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#16a34a', color: '#fff', borderRadius: 8, padding: '12px 20px',
      fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      ✓ {msg}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
    </div>
  )
}

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourbrand' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourbrand' },
  { key: 'telegram', label: 'Telegram', placeholder: 'https://t.me/yourbrand' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/yourbrand' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/yourbrand' },
]

const WHERE_USED = [
  { icon: '🪪', label: 'Member ID Cards', path: '/dashboard/member-card' },
  { icon: '🎖️', label: 'Achievement Certificates', path: '/dashboard/certificates' },
  { icon: '✉️', label: 'Email Campaign Headers', path: '/admin/campaigns' },
  { icon: '🧾', label: 'Tax Summary / Invoices', path: '/dashboard/tax-summary' },
  { icon: '📄', label: 'Commission Statements', path: '/dashboard/commission-statements' },
  { icon: '📊', label: 'PDF / CSV Exports', path: null },
]

export default function Branding() {
  const [cfg, setCfg] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('identity')

  useEffect(() => {
    getBrandingConfig().then(setCfg)
  }, [])

  function set(key, val) {
    setCfg(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }
  function setSocial(platform, val) {
    setCfg(prev => ({ ...prev, social: { ...prev.social, [platform]: val } }))
    setSaved(false)
  }
  function setDoc(key, val) {
    setCfg(prev => ({ ...prev, documents: { ...prev.documents, [key]: val } }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    await saveBrandingConfig(cfg)
    setSaving(false)
    setSaved(true)
    setToast('Branding configuration saved')
  }

  if (!cfg) return <AdminLayout><div style={{ color: 'var(--text2)', padding: 32 }}>Loading…</div></AdminLayout>

  const TABS = [
    { key: 'identity', label: '🏢 Brand Identity' },
    { key: 'colors', label: '🎨 Colors & Logo' },
    { key: 'docs', label: '📄 Document Branding' },
    { key: 'social', label: '🌐 Social & Links' },
    { key: 'preview', label: '👁️ Preview' },
  ]

  return (
    <AdminLayout>
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text1)', margin: 0 }}>🎨 Branding & White-Label</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, margin: '4px 0 0' }}>
              Configure how your brand name, logo, and identity appear across certificates, member cards, and exported documents.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              background: saving ? 'var(--navy3)' : 'var(--gold)',
              color: saving ? 'var(--text2)' : '#1a0a00',
              border: 'none', borderRadius: 8, padding: '10px 24px',
              fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer',
              flexShrink: 0,
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>

        {/* Where it's used */}
        <div style={{ ...SECTION, background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', marginBottom: 12 }}>📌 Applied across these surfaces</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {WHERE_USED.map(w => (
              <div key={w.label} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '6px 12px', fontSize: 12,
                color: 'var(--text1)', display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span>{w.icon}</span><span>{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '10px 16px', fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
              color: activeTab === t.key ? 'var(--gold)' : 'var(--text2)',
              borderBottom: activeTab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1, whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'identity' && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Company Identity</h3>
            <div style={ROW}>
              <Field label="Brand / Company Name" hint="Shown on all documents and certificates">
                <TextInput value={cfg.company_name} onChange={v => set('company_name', v)} placeholder="Nordic Vitals AS" />
              </Field>
              <Field label="Trading Name / DBA" hint="If different from legal name (e.g. a product brand)">
                <TextInput value={cfg.trading_name} onChange={v => set('trading_name', v)} placeholder="Nordic Vitals" />
              </Field>
            </div>
            <div style={ROW}>
              <Field label="Tagline" hint="Short slogan shown under the brand name">
                <TextInput value={cfg.tagline} onChange={v => set('tagline', v)} placeholder="Powered by Arctico" />
              </Field>
              <Field label="Founder / CEO Name" hint="Shown on certificate signatures and official docs">
                <TextInput value={cfg.ceo_name} onChange={v => set('ceo_name', v)} placeholder="Bjørn Vidar Hauge" />
              </Field>
            </div>
            <div style={ROW}>
              <Field label="Founder Title">
                <TextInput value={cfg.ceo_title} onChange={v => set('ceo_title', v)} placeholder="Founder & CEO" />
              </Field>
              <Field label="Platform / Technology Partner" hint="Shown in tech/partner footer on docs">
                <TextInput value={cfg.tech_partner} onChange={v => set('tech_partner', v)} placeholder="Arctico / Veriton" />
              </Field>
            </div>
            <Field label="Company Tagline (long)" hint="Used in email footers and About sections">
              <textarea
                value={cfg.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Nordic Vitals delivers science-backed supplements through a transparent, fair compensation model powered by Arctico's blockchain infrastructure."
                style={{ ...INPUT, resize: 'vertical' }}
              />
            </Field>
            <div style={ROW}>
              <Field label="Organisation Number (Org.nr.)">
                <TextInput value={cfg.org_number} onChange={v => set('org_number', v)} placeholder="923 456 789" />
              </Field>
              <Field label="MVA Registration Number">
                <TextInput value={cfg.vat_number} onChange={v => set('vat_number', v)} placeholder="923 456 789 MVA" />
              </Field>
            </div>
            <Field label="Registered Address" hint="Appears on invoices, tax documents, and certificates">
              <textarea
                value={cfg.address}
                onChange={e => set('address', e.target.value)}
                rows={2}
                placeholder="Storgata 1, 0155 Oslo, Norway"
                style={{ ...INPUT, resize: 'vertical' }}
              />
            </Field>
            <div style={ROW}>
              <Field label="Customer Support Email">
                <TextInput value={cfg.support_email} onChange={v => set('support_email', v)} placeholder="support@nordicvitals.no" />
              </Field>
              <Field label="Email Sender Name" hint="Appears as 'From:' in outgoing emails">
                <TextInput value={cfg.email_sender_name} onChange={v => set('email_sender_name', v)} placeholder="Nordic Vitals" />
              </Field>
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Colors & Logo</h3>
            <Field label="Logo URL" hint="Shown on certificates, member cards, and email headers. Use a direct image URL.">
              <TextInput value={cfg.logo_url} onChange={v => set('logo_url', v)} placeholder="https://nordicvitals.no/logo.png" />
            </Field>
            {cfg.logo_url && (
              <div style={{ marginBottom: 16, padding: 16, background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={cfg.logo_url} alt="Logo preview" style={{ maxHeight: 48, maxWidth: 200, objectFit: 'contain' }}
                  onError={e => { e.target.style.display = 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>Logo preview (if URL is valid)</span>
              </div>
            )}
            <Field label="Logo Dark / White Version URL" hint="Used on dark backgrounds (certificates, dark-mode emails)">
              <TextInput value={cfg.logo_dark_url} onChange={v => set('logo_dark_url', v)} placeholder="https://nordicvitals.no/logo-white.png" />
            </Field>
            <Field label="Favicon URL">
              <TextInput value={cfg.favicon_url} onChange={v => set('favicon_url', v)} placeholder="https://nordicvitals.no/favicon.ico" />
            </Field>
            <div style={ROW}>
              <Field label="Primary / Gold Color" hint="Used for headers, buttons, certificate borders">
                <ColorPicker value={cfg.color_primary} onChange={v => set('color_primary', v)} />
              </Field>
              <Field label="Accent Color" hint="Used for highlights and secondary elements">
                <ColorPicker value={cfg.color_accent} onChange={v => set('color_accent', v)} />
              </Field>
            </div>
            <div style={ROW}>
              <Field label="Header Background" hint="Certificate and email header background">
                <ColorPicker value={cfg.color_header_bg} onChange={v => set('color_header_bg', v)} />
              </Field>
              <Field label="Header Text Color">
                <ColorPicker value={cfg.color_header_text} onChange={v => set('color_header_text', v)} />
              </Field>
            </div>
            {/* Color preview */}
            <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginTop: 8 }}>
              <div style={{ background: cfg.color_header_bg, color: cfg.color_header_text, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: 16 }}>{cfg.trading_name || cfg.company_name || 'Your Brand'}</span>
                <span style={{ fontSize: 11, opacity: 0.7 }}>Powered by {cfg.tech_partner || 'Arctico'}</span>
              </div>
              <div style={{ padding: 16, background: 'var(--bg2)' }}>
                <div style={{ display: 'inline-block', background: cfg.color_primary, color: '#1a0a00', padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 700 }}>Sample Button</div>
                <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--text2)' }}>← Color preview</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Document & Certificate Branding</h3>
            <Field label="Certificate Issuer Line" hint="Shown under the certificate title — e.g. 'This certificate is awarded by…'">
              <TextInput value={cfg.documents.cert_issuer} onChange={v => setDoc('cert_issuer', v)} placeholder="Nordic Vitals AS, powered by Arctico" />
            </Field>
            <Field label="Certificate Footer Text" hint="Legal / disclaimer line at bottom of certificates">
              <textarea
                value={cfg.documents.cert_footer}
                onChange={e => setDoc('cert_footer', e.target.value)}
                rows={2}
                placeholder="Nordic Vitals AS · Org.nr. 923 456 789 · support@nordicvitals.no · Powered by Arctico/Veriton"
                style={{ ...INPUT, resize: 'vertical' }}
              />
            </Field>
            <div style={ROW}>
              <Field label="Primary Signatory Name" hint="Certificate signature 1">
                <TextInput value={cfg.documents.signer1_name} onChange={v => setDoc('signer1_name', v)} placeholder="Bjørn Vidar Hauge" />
              </Field>
              <Field label="Primary Signatory Title">
                <TextInput value={cfg.documents.signer1_title} onChange={v => setDoc('signer1_title', v)} placeholder="Founder & CEO, Arctico / Veriton" />
              </Field>
            </div>
            <div style={ROW}>
              <Field label="Secondary Signatory Name" hint="Certificate signature 2">
                <TextInput value={cfg.documents.signer2_name} onChange={v => setDoc('signer2_name', v)} placeholder="Gary Granello" />
              </Field>
              <Field label="Secondary Signatory Title">
                <TextInput value={cfg.documents.signer2_title} onChange={v => setDoc('signer2_title', v)} placeholder="Managing Director, Nordic Vitals" />
              </Field>
            </div>
            <Field label="Invoice Legal Footer" hint="Required text on Norwegian tax invoices (faktura)">
              <textarea
                value={cfg.documents.invoice_footer}
                onChange={e => setDoc('invoice_footer', e.target.value)}
                rows={2}
                placeholder="Nordic Vitals AS · Org.nr. 923 456 789 MVA · Storgata 1, 0155 Oslo · support@nordicvitals.no"
                style={{ ...INPUT, resize: 'vertical' }}
              />
            </Field>
            <Field label="Member Card Footer Text" hint="Small print on printed/digital member cards">
              <TextInput value={cfg.documents.member_card_footer} onChange={v => setDoc('member_card_footer', v)} placeholder="nordicvitals.no · Powered by Arctico" />
            </Field>
            <Field label="Email / Document Header Tagline" hint="Shown under logo in email headers">
              <TextInput value={cfg.documents.email_header_tagline} onChange={v => setDoc('email_header_tagline', v)} placeholder="Science-backed supplements. Transparent earnings." />
            </Field>
          </div>
        )}

        {activeTab === 'social' && (
          <div style={SECTION}>
            <h3 style={{ margin: '0 0 20px', fontSize: 15, fontWeight: 700 }}>Website & Social Links</h3>
            <Field label="Main Website URL">
              <TextInput value={cfg.website_url} onChange={v => set('website_url', v)} placeholder="https://nordicvitals.no" />
            </Field>
            <Field label="Platform / Partner Site URL" hint="E.g. arctico.duckdns.org or veriton.io">
              <TextInput value={cfg.platform_url} onChange={v => set('platform_url', v)} placeholder="https://arctico.duckdns.org" />
            </Field>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', margin: '20px 0 12px' }}>SOCIAL MEDIA</h4>
            {SOCIAL_PLATFORMS.map(p => (
              <Field key={p.key} label={p.label}>
                <TextInput
                  value={cfg.social?.[p.key] || ''}
                  onChange={v => setSocial(p.key, v)}
                  placeholder={p.placeholder}
                />
              </Field>
            ))}
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Certificate Preview</h3>
            <div style={{
              border: `4px solid ${cfg.color_primary}`,
              borderRadius: 12, overflow: 'hidden', fontFamily: 'Georgia, serif',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            }}>
              {/* Header */}
              <div style={{
                background: cfg.color_header_bg, color: cfg.color_header_text,
                textAlign: 'center', padding: '24px 32px',
              }}>
                {cfg.logo_url
                  ? <img src={cfg.logo_url} alt="logo" style={{ maxHeight: 40, marginBottom: 8 }} />
                  : <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2 }}>{cfg.trading_name || cfg.company_name || 'NORDIC VITALS'}</div>
                }
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
                  {cfg.documents.email_header_tagline || cfg.tagline || 'Powered by Arctico'}
                </div>
              </div>
              {/* Body */}
              <div style={{ background: '#faf7f0', padding: '32px 48px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, letterSpacing: 4, color: '#9a7a2a', textTransform: 'uppercase', marginBottom: 8 }}>Certificate of Achievement</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#2d1a00', marginBottom: 4 }}>SILVER RANK ACHIEVEMENT</div>
                <div style={{ color: '#666', fontSize: 13, marginBottom: 20 }}>
                  {cfg.documents.cert_issuer || `${cfg.company_name || 'Nordic Vitals'}, powered by ${cfg.tech_partner || 'Arctico'}`}
                </div>
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 24 }}>
                  This certificate is proudly awarded to<br />
                  <strong style={{ fontSize: 18, display: 'block', marginTop: 8 }}>Lars Eriksen</strong>
                  for outstanding achievement in reaching Silver rank
                </div>
                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #ddd', paddingTop: 20, marginTop: 8 }}>
                  {[
                    { name: cfg.documents.signer1_name || 'Bjørn Vidar Hauge', title: cfg.documents.signer1_title || 'Founder & CEO, Arctico' },
                    { name: cfg.documents.signer2_name || 'Gary Granello', title: cfg.documents.signer2_title || 'Managing Director' },
                  ].map((s, i) => (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div style={{ fontFamily: 'cursive', fontSize: 20, color: '#2d1a00', marginBottom: 4 }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: '#888', borderTop: '1px solid #ccc', paddingTop: 4 }}>{s.title}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Footer */}
              <div style={{ background: '#f0ead8', padding: '10px 24px', textAlign: 'center', fontSize: 10, color: '#888' }}>
                {cfg.documents.cert_footer || `${cfg.company_name || 'Nordic Vitals AS'} · Org.nr. ${cfg.org_number || '—'} · ${cfg.support_email || 'support@nordicvitals.no'}`}
              </div>
            </div>

            <h3 style={{ margin: '28px 0 16px', fontSize: 15, fontWeight: 700 }}>Member Card Preview</h3>
            <div style={{
              background: `linear-gradient(135deg, ${cfg.color_header_bg} 0%, #1a0a00 100%)`,
              borderRadius: 12, padding: '24px 28px', color: cfg.color_header_text,
              maxWidth: 360, border: `2px solid ${cfg.color_primary}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>{cfg.trading_name || cfg.company_name || 'NORDIC VITALS'}</div>
                <div style={{ fontSize: 10, opacity: 0.6 }}>MEMBER CARD</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Lars Eriksen</div>
              <div style={{ fontSize: 12, color: cfg.color_primary, marginBottom: 16 }}>🥈 SILVER · ID: NV-00042</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 11, opacity: 0.8 }}>
                <div>PV: <strong style={{ color: cfg.color_primary }}>850</strong></div>
                <div>GV: <strong style={{ color: cfg.color_primary }}>3,420</strong></div>
                <div>Team: <strong style={{ color: cfg.color_primary }}>12</strong></div>
              </div>
              <div style={{ borderTop: `1px solid ${cfg.color_primary}40`, marginTop: 16, paddingTop: 10, fontSize: 10, opacity: 0.5 }}>
                {cfg.documents.member_card_footer || `${cfg.website_url || 'nordicvitals.no'} · Powered by ${cfg.tech_partner || 'Arctico'}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
