import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getResources, trackResourceDownload } from '../../api/mlmApi'

const CATEGORIES = ['All', 'Marketing', 'Products', 'Training', 'Compliance']

const TYPE_COLORS = {
  PDF: { bg: '#1e3a5f', color: '#60a5fa' },
  ZIP: { bg: '#1a3a2a', color: '#4ade80' },
  MP4: { bg: '#3a1a2a', color: '#f472b6' },
}

const CATEGORY_DESC = {
  All:        'All downloadable materials for Nordic Vitals members.',
  Marketing:  'Brand assets, product images, social templates, and outreach scripts.',
  Products:   'Product data sheets, ingredient breakdowns, and the full catalog.',
  Training:   'Guides, roadmaps, and scripts to grow your business faster.',
  Compliance: 'Policies, income disclosure, and approved claim language.',
}

export default function Resources() {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch]     = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [downloading, setDownloading] = useState(null)
  const [toast, setToast]       = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setLoading(true)
    getResources({ category, search: debouncedSearch })
      .then(d => setItems(d.resources || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [category, debouncedSearch])

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDownload(res) {
    setDownloading(res.id)
    try {
      await trackResourceDownload(res.id)
      setItems(prev => prev.map(r => r.id === res.id ? { ...r, downloads: r.downloads + 1 } : r))
      showToast(`"${res.title}" download started!`)
    } catch {
      showToast('Download failed — please try again.')
    } finally {
      setDownloading(null)
    }
  }

  const typeStyle = (ft) => TYPE_COLORS[ft] || { bg: '#2a2a3a', color: '#a0aec0' }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 960 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>
            📂 Resources & Downloads
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            {CATEGORY_DESC[category]}
          </p>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => { setCategory(c); setSearch('') }}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                background: category === c ? 'var(--gold)' : 'var(--navy2)',
                color:      category === c ? '#0a0f1e'    : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text2)', fontSize: 16, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px 10px 40px',
              background: 'var(--navy2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              color: 'var(--cream)',
              fontSize: 14,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'var(--text2)',
                cursor: 'pointer', fontSize: 18, lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        {/* Count */}
        {!loading && (
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
            {items.length} resource{items.length !== 1 ? 's' : ''}{debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div style={{ color: 'var(--text2)', padding: '40px 0', textAlign: 'center' }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--navy2)', borderRadius: 12, border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ color: 'var(--cream)', fontWeight: 600, marginBottom: 6 }}>No resources found</div>
            <div style={{ color: 'var(--text2)', fontSize: 13 }}>
              {search ? `No results for "${search}" — try a different keyword.` : 'Check back soon for new materials.'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {items.map(res => {
              const ts = typeStyle(res.fileType)
              const isDownloading = downloading === res.id
              return (
                <div
                  key={res.id}
                  style={{
                    background: 'var(--navy2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {/* Icon + type badge */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 28 }}>{res.icon}</span>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.5px',
                      background: ts.bg,
                      color: ts.color,
                    }}>
                      {res.fileType}
                    </span>
                  </div>

                  {/* Title + desc */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--cream)', fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>
                      {res.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                      {res.desc}
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {res.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          background: 'var(--navy3)',
                          color: 'var(--text2)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Meta + download */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: 10, borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      <div>{res.fileSize} · {res.downloads.toLocaleString()} downloads</div>
                      <div style={{ marginTop: 2 }}>Updated {res.updatedAt}</div>
                    </div>
                    <button
                      onClick={() => handleDownload(res)}
                      disabled={isDownloading}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: isDownloading ? 'var(--navy3)' : 'var(--gold)',
                        color: isDownloading ? 'var(--text2)' : '#0a0f1e',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {isDownloading ? '…' : '↓ Download'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'var(--navy2)', border: '1px solid var(--gold)',
          color: 'var(--cream)', padding: '12px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          zIndex: 1000, boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast}
        </div>
      )}
    </DashboardLayout>
  )
}
