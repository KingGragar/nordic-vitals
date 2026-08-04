import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { getBlogPost, getBlogPosts } from '../api/mlmApi'
import NewsletterWidget from '../components/NewsletterWidget'

function markdownToHtml(text) {
  return text
    .split('\n\n')
    .map(para => {
      if (para.startsWith('**') && para.endsWith('**') && !para.slice(2).includes('**')) {
        return `<h3 style="color:var(--cream);font-size:17px;font-weight:700;margin:0 0 8px">${para.slice(2, -2)}</h3>`
      }
      if (para.startsWith('- ') || para.split('\n').every(l => l.startsWith('- '))) {
        const items = para.split('\n').filter(l => l.startsWith('- ')).map(l => {
          return `<li style="margin-bottom:4px;color:var(--text)">${renderInline(l.slice(2))}</li>`
        }).join('')
        return `<ul style="padding-left:20px;margin:0 0 16px">${items}</ul>`
      }
      return `<p style="margin:0 0 16px;color:var(--text);line-height:1.7;font-size:15px">${renderInline(para)}</p>`
    })
    .join('')
}

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--cream);font-weight:700">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:var(--gold);text-decoration:none">$1</a>')
}

export default function BlogPost() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    getBlogPost(slug)
      .then(p => {
        setPost(p)
        document.title = `${p.title} | Nordic Vitals Blog`
        return getBlogPosts({ category: p.category, limit: 4 })
      })
      .then(all => setRelated(all.filter(p => p.slug !== slug).slice(0, 3)))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + window.location.href)}`, '_blank')
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 24px', color: 'var(--text2)' }}>Loading…</div>
      </>
    )
  }

  if (notFound || !post) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <h1 style={{ color: 'var(--cream)', marginBottom: '12px' }}>Article Not Found</h1>
          <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/blog" className="btn btn-gold">← Back to Blog</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main style={{ maxWidth: '780px', margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', fontSize: '13px', color: 'var(--text2)' }}>
          <Link to="/" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link to="/blog" style={{ color: 'var(--text2)', textDecoration: 'none' }}>Blog</Link>
          <span>›</span>
          <span style={{ color: 'var(--cream)' }}>{post.category}</span>
        </div>

        {/* Category + meta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <Link to={`/blog?category=${post.category}`} style={{ textDecoration: 'none' }}>
            <span style={{
              background: 'rgba(201,168,76,0.15)',
              color: 'var(--gold)',
              borderRadius: '20px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>{post.category}</span>
          </Link>
          <span style={{ color: 'var(--text2)', fontSize: '13px' }}>
            {new Date(post.publishedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span style={{ color: 'var(--text2)', fontSize: '13px' }}>·</span>
          <span style={{ color: 'var(--text2)', fontSize: '13px' }}>{post.readMinutes} min read</span>
        </div>

        {/* Title */}
        <h1 style={{ color: 'var(--cream)', fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '800', lineHeight: '1.25', margin: '0 0 16px' }}>
          {post.title}
        </h1>

        {/* Excerpt */}
        <p style={{ color: 'var(--text2)', fontSize: '17px', lineHeight: '1.6', margin: '0 0 28px', fontStyle: 'italic' }}>
          {post.excerpt}
        </p>

        {/* Author line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: '32px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>
            {post.coverEmoji}
          </div>
          <div>
            <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: '600' }}>{post.author}</div>
            <div style={{ color: 'var(--text2)', fontSize: '12px' }}>Nordic Vitals</div>
          </div>
        </div>

        {/* Post body */}
        <article
          dangerouslySetInnerHTML={{ __html: markdownToHtml(post.body) }}
          style={{ marginBottom: '40px' }}
        />

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {post.tags.map(tag => (
              <span key={tag} style={{
                background: 'var(--navy2)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '12px',
                color: 'var(--text2)',
              }}>#{tag}</span>
            ))}
          </div>
        )}

        {/* Share */}
        <div style={{ background: 'var(--navy2)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: '48px' }}>
          <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>Share this article</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={copyLink} className="btn btn-outline btn-sm">
              {copied ? '✓ Copied!' : '🔗 Copy link'}
            </button>
            <button onClick={shareWhatsApp} className="btn btn-outline btn-sm">
              📱 WhatsApp
            </button>
            <button
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="btn btn-outline btn-sm"
            >
              📘 Facebook
            </button>
            <button
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`, '_blank')}
              className="btn btn-outline btn-sm"
            >
              𝕏 Twitter
            </button>
          </div>
        </div>

        {/* Newsletter widget */}
        <div style={{ marginBottom: '32px' }}>
          <NewsletterWidget source="blog" compact />
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.1), rgba(201,168,76,0.04))', border: '1px solid var(--gold)', borderRadius: '12px', padding: '28px', textAlign: 'center', marginBottom: '56px' }}>
          <div style={{ fontSize: '28px', marginBottom: '12px' }}>⬡</div>
          <div style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Join Nordic Vitals Today</div>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '20px' }}>Access premium supplements at member pricing and build an income alongside your current career.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/join" className="btn btn-gold">Become a Member</Link>
            <Link to="/shop" className="btn btn-outline">Browse Products</Link>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div>
            <h2 style={{ color: 'var(--cream)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Related Articles</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {related.map(p => (
                <Link key={p.id} to={`/blog/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'border-color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    <span style={{ fontSize: '24px' }}>{p.coverEmoji}</span>
                    <div style={{ color: 'var(--cream)', fontSize: '13px', fontWeight: '600', lineHeight: '1.4' }}>{p.title}</div>
                    <div style={{ color: 'var(--text2)', fontSize: '12px' }}>{p.readMinutes} min read →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  )
}
