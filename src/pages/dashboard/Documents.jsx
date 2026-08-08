import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberDocs, downloadMemberDoc } from '../../api/mlmApi'

const TYPE_LABELS = {
  '1099-NEC': { icon: '🧾', label: '1099-NEC', color: '#fbbf24' },
  'W-9':      { icon: '📋', label: 'W-9 Form', color: '#93c5fd' },
  contract:   { icon: '📄', label: 'Contract', color: '#86efac' },
  earnings:   { icon: '💰', label: 'Earnings Statement', color: '#c084fc' },
}

export default function DashDocuments() {
  const [docs, setDocs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    getMemberDocs().then(setDocs).finally(() => setLoading(false))
  }, [])

  async function handleDownload(doc) {
    setDownloading(doc.id)
    await downloadMemberDoc(doc.id)
    setDownloading(null)
    // In mock mode just open '#'; in real mode the URL would be opened
    window.open(doc.downloadUrl, '_blank')
  }

  const filtered = !docs ? [] : filter === 'all' ? docs : docs.filter(d => d.type === filter)
  const years = [...new Set((docs || []).map(d => d.year))].sort((a, b) => b - a)

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 4 }}>📁 My Documents</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>Tax documents, contracts, and earnings statements issued to you.</div>
        </div>

        {/* Type filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...Object.keys(TYPE_LABELS)].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border)', background: filter === f ? 'var(--gold)' : 'var(--card)', color: filter === f ? '#000' : 'var(--text)', fontSize: 13, cursor: 'pointer', fontWeight: filter === f ? 700 : 400 }}>
              {f === 'all' ? 'All Documents' : TYPE_LABELS[f]?.label || f}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text2)' }}>No documents found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {years.map(year => {
              const yearDocs = filtered.filter(d => d.year === year)
              if (yearDocs.length === 0) return null
              return (
                <div key={year}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2)', marginBottom: 8 }}>{year}</div>
                  {yearDocs.map(doc => {
                    const t = TYPE_LABELS[doc.type] || { icon: '📄', label: doc.type, color: 'var(--text2)' }
                    return (
                      <div key={doc.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 28, flexShrink: 0 }}>{t.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{doc.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                            <span style={{ color: t.color, fontWeight: 600 }}>{t.label}</span> · Issued {new Date(doc.issuedAt).toLocaleDateString()} · {doc.size}
                          </div>
                        </div>
                        <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id} style={{ padding: '8px 16px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: downloading === doc.id ? 'not-allowed' : 'pointer', opacity: downloading === doc.id ? 0.7 : 1, flexShrink: 0 }}>
                          {downloading === doc.id ? 'Preparing…' : '⬇ Download'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}

        <div style={{ marginTop: 24, padding: '14px 18px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text2)' }}>
          <strong style={{ color: 'var(--text)' }}>Missing a document?</strong> If you believe a document should be here, contact support or your upline. Tax documents are issued annually by the end of January.
        </div>
      </div>
    </DashboardLayout>
  )
}
