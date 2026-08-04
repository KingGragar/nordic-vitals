import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getBlogPosts } from '../api/mlmApi'
import usePageTitle from '../hooks/usePageTitle'

const CATEGORIES = ['All', 'News', 'Products', 'Success Stories', 'Compliance', 'Training']

function PostCard({ post, featured }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{ textDecoration: 'none' }}
    >
      <div className="card" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: featured ? '28px' : '20px',
        border: `1px solid ${featured ? 'var(--gold)' : 'var(--border)'}`,
        transition: 'border-color 0.2s',
        cursor: 'pointer',
        height: '100%',
      }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = featured ? 'var(--gold)' : 'var(--border)'}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: featured ? '36px' : '28px' }}>{post.coverEmoji}</span>
          <span style={{
            background: 'rgba(201,168,76,0.15)',
            color: 'var(--gold)',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>{post.category}</span>
          {featured && (
            <span style={{
              background: 'rgba(201,168,76,0.25)',
              color: 'var(--gold)',
              borderRadius: '20px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '700',
            }}>Featured</span>
          )}
        </div>

        <h2 style={{
          color: 'var(--cream)',
          fontSize: featured ? '20px' : '16px',
          fontWeight: '700',
          lineHeight: '1.4',
          margin: 0,
        }}>{post.title}</h2>

        <p style={{
          color: 'var(--text2)',
          fontSize: '14px',
          lineHeight: '1.6',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>{post.excerpt}</p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
            {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {' · '}
            <span>{post.readMinutes} min read</span>
          </div>
          <span style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: '600' }}>Read →</span>
        </div>
      </div>
    </Link>
  )
}

export default function Blog() {
  usePageTitle('Blog | Nordic Vitals', 'Health insights, member stories, and science-backed supplement guides from Nordic Vitals.')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    setLoading(true)
    getBlogPosts({ category, search }).then(data => {
      setPosts(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [category, search])

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput)
  }

  const featured = posts.filter(p => p.featured)
  const regular = posts.filter(p => !p.featured)

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '13px', color: 'var(--gold)', fontWeight: '600', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Nordic Vitals Blog
          </div>
          <h1 style={{ color: 'var(--cream)', fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: '800', margin: '0 0 16px' }}>
            Health Insights & Member Stories
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '560px', margin: '0 auto 28px' }}>
            Science-backed guides, compliance updates, and real stories from our Nordic community.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto 28px' }}>
            <input
              type="text"
              placeholder="Search articles…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--navy2)', color: 'var(--cream)', fontSize: '14px' }}
            />
            <button type="submit" className="btn btn-gold btn-sm">Search</button>
            {search && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSearch(''); setSearchInput('') }}>✕</button>
            )}
          </form>

          {/* Category pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`btn btn-sm ${category === cat ? 'btn-gold' : 'btn-outline'}`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px' }}>Loading articles…</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', padding: '60px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📝</div>
            <p>No articles found{search ? ` for "${search}"` : ''}.</p>
            <button className="btn btn-outline btn-sm" onClick={() => { setCategory('All'); setSearch(''); setSearchInput('') }}>
              Clear filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured posts */}
            {featured.length > 0 && category === 'All' && !search && (
              <div style={{ marginBottom: '48px' }}>
                <h2 style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Featured
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {featured.map(p => <PostCard key={p.id} post={p} featured />)}
                </div>
              </div>
            )}

            {/* All / filtered posts */}
            {regular.length > 0 && (
              <div>
                {category === 'All' && !search && (
                  <h2 style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '20px' }}>
                    Latest Articles
                  </h2>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {(category !== 'All' || search ? posts : regular).map(p => <PostCard key={p.id} post={p} />)}
                </div>
              </div>
            )}

            {/* If only featured posts match */}
            {regular.length === 0 && featured.length > 0 && (category !== 'All' || search) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {posts.map(p => <PostCard key={p.id} post={p} />)}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer CTA */}
      <div style={{ background: 'var(--navy2)', borderTop: '1px solid var(--border)', padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text2)', marginBottom: '16px' }}>Ready to become part of the Nordic Vitals story?</p>
        <Link to="/join" className="btn btn-gold">Join Us Today</Link>
      </div>
    </>
  )
}
