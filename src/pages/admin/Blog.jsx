import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost, toggleBlogPostStatus } from '../../api/mlmApi'

const CATEGORIES = ['News', 'Products', 'Success Stories', 'Compliance', 'Training']
const EMPTY_FORM = { title: '', slug: '', excerpt: '', body: '', category: 'News', tags: '', author: 'Nordic Vitals Team', coverEmoji: '📝', status: 'draft', featured: false }

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function Toast({ msg, onClose }) {
  return (
    <div className="toast" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '16px', cursor: 'pointer' }}>×</button>
    </div>
  )
}

function PostModal({ post, onSave, onClose }) {
  const isEdit = !!post?.id
  const [form, setForm] = useState(() => isEdit ? { ...post, tags: (post.tags || []).join(', ') } : { ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(f => {
      const next = { ...f, [field]: val }
      if (field === 'title' && !isEdit) next.slug = slugify(val)
      return next
    })
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.slug.trim()) { setError('Slug is required.'); return }
    if (!form.excerpt.trim()) { setError('Excerpt is required.'); return }
    if (!form.body.trim()) { setError('Body is required.'); return }
    setSaving(true)
    try {
      const data = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }
      if (isEdit) await updateBlogPost(post.id, data)
      else await createBlogPost(data)
      onSave()
    } catch (e) {
      setError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', fontSize: '20px', cursor: 'pointer' }}>×</button>
        <h2 style={{ color: 'var(--cream)', fontSize: '17px', fontWeight: '700', marginBottom: '20px' }}>
          {isEdit ? 'Edit Post' : 'New Blog Post'}
        </h2>

        {error && <div style={{ color: '#f87171', fontSize: '13px', marginBottom: '14px' }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Title *</label>
            <input
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Post title…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Slug *</label>
            <input
              value={form.slug}
              onChange={e => set('slug', slugify(e.target.value))}
              placeholder="url-slug"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Category</label>
            <select
              value={form.category}
              onChange={e => set('category', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box' }}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Author</label>
            <input
              value={form.author}
              onChange={e => set('author', e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Cover Emoji</label>
            <input
              value={form.coverEmoji}
              onChange={e => set('coverEmoji', e.target.value)}
              maxLength={4}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '20px', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="omega-3, health, Norway"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Excerpt * (shown on blog list)</label>
            <textarea
              value={form.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              rows={3}
              placeholder="One or two compelling sentences…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
              Body * <span style={{ color: 'var(--text2)', fontWeight: '400' }}>(Markdown: **bold**, *italic*, [link](url), bullet lists with "- ")</span>
            </label>
            <textarea
              value={form.body}
              onChange={e => set('body', e.target.value)}
              rows={12}
              placeholder="Write the full article here…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy)', color: 'var(--cream)', fontSize: '13px', resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text)', fontSize: '14px' }}>
              <input type="checkbox" checked={form.status === 'published'} onChange={e => set('status', e.target.checked ? 'published' : 'draft')} />
              Publish immediately
            </label>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text)', fontSize: '14px' }}>
              <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
              Featured post
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCat, setFilterCat] = useState('All')
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  async function load() {
    setLoading(true)
    try { setPosts(await getAdminBlogPosts()) } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  async function handleToggle(id) {
    try {
      const updated = await toggleBlogPostStatus(id)
      setPosts(ps => ps.map(p => p.id === id ? updated : p))
      showToast(`Post ${updated.status === 'published' ? 'published' : 'set to draft'}.`)
    } catch { showToast('Failed to update status.') }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await deleteBlogPost(confirmDelete.id)
      setPosts(ps => ps.filter(p => p.id !== confirmDelete.id))
      showToast('Post deleted.')
    } catch { showToast('Delete failed.') }
    setConfirmDelete(null)
  }

  const filtered = posts.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    if (filterCat !== 'All' && p.category !== filterCat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.author.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const published = posts.filter(p => p.status === 'published').length
  const drafts = posts.filter(p => p.status === 'draft').length
  const featured = posts.filter(p => p.featured).length

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 0 60px' }}>
        {toast && <Toast msg={toast} onClose={() => setToast('')} />}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--cream)', fontSize: '22px', fontWeight: '700', margin: 0 }}>📝 Blog Manager</h1>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/blog" target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View Blog →</a>
            <button className="btn btn-gold btn-sm" onClick={() => setModal({})}>+ New Post</button>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Posts', value: posts.length, icon: '📝' },
            { label: 'Published', value: published, icon: '✅' },
            { label: 'Drafts', value: drafts, icon: '📋' },
            { label: 'Featured', value: featured, icon: '⭐' },
          ].map(k => (
            <div key={k.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '22px', marginBottom: '4px' }}>{k.icon}</div>
              <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: '800' }}>{k.value}</div>
              <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search posts…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: '180px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--cream)', fontSize: '14px' }}
          />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--cream)', fontSize: '14px' }}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--cream)', fontSize: '14px' }}>
            <option>All</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '40px' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            No posts match your filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ textAlign: 'center', fontSize: '20px' }}>{p.coverEmoji}</td>
                    <td>
                      <div style={{ color: 'var(--cream)', fontWeight: '600', fontSize: '14px', maxWidth: '300px' }}>
                        {p.featured && <span style={{ color: 'var(--gold)', marginRight: '6px' }}>⭐</span>}
                        {p.title}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: '12px' }}>/{p.slug}</div>
                    </td>
                    <td>
                      <span style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: '600' }}>
                        {p.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: '13px' }}>{p.author}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                        background: p.status === 'published' ? 'rgba(34,197,94,0.15)' : 'rgba(156,163,175,0.15)',
                        color: p.status === 'published' ? '#4ade80' : 'var(--text2)',
                      }}>
                        {p.status === 'published' ? '● Published' : '◌ Draft'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text2)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {new Date(p.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">View</a>
                        <button className="btn btn-outline btn-sm" onClick={() => setModal(p)}>Edit</button>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleToggle(p.id)}
                          style={{ color: p.status === 'published' ? '#f87171' : '#4ade80' }}
                        >
                          {p.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: '#f87171' }}
                          onClick={() => setConfirmDelete(p)}
                        >Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modal !== null && (
        <PostModal
          post={modal?.id ? modal : null}
          onSave={() => { setModal(null); load(); showToast('Post saved.') }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '28px' }}>
            <h3 style={{ color: 'var(--cream)', fontSize: '16px', fontWeight: '700', marginBottom: '10px' }}>Delete Post?</h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>
              "{confirmDelete.title}" will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn btn-sm" style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer' }} onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
