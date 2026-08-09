import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { getMemberNetworkMap } from '../../api/mlmApi'

const RANK_COLOR = { Diamond: '#93c5fd', Platinum: '#e2e8f0', Gold: '#fbbf24', Silver: '#94a3b8', Bronze: '#fb923c', Member: '#86efac' }

function NodeCard({ node, depth = 0, expanded, onToggle }) {
  const hasChildren = (node.children || []).length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <div style={{ marginLeft: depth > 0 ? 28 : 0 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
        marginBottom: 6, cursor: hasChildren ? 'pointer' : 'default',
        borderLeft: `3px solid ${RANK_COLOR[node.rank] || '#818cf8'}`
      }} onClick={() => hasChildren && onToggle(node.id)}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${RANK_COLOR[node.rank] || '#818cf8'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: RANK_COLOR[node.rank] || '#818cf8', flexShrink: 0 }}>{node.initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            {node.name}
            <span style={{ fontSize: 11, fontWeight: 700, color: RANK_COLOR[node.rank] || '#818cf8', background: `${RANK_COLOR[node.rank] || '#818cf8'}22`, borderRadius: 5, padding: '1px 7px' }}>{node.rank}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{node.volume} PV · {node.directCount} direct</div>
        </div>
        {hasChildren && (
          <span style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
            {isExpanded ? '▲' : `▼ ${node.children.length}`}
          </span>
        )}
      </div>
      {isExpanded && hasChildren && (
        <div style={{ borderLeft: '2px solid var(--border)', marginLeft: 18, paddingLeft: 10 }}>
          {node.children.map(child => (
            <NodeCard key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashNetworkMap() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(new Set())
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    getMemberNetworkMap().then(d => {
      setData(d)
      if (d?.root?.id) setExpanded(new Set([d.root.id]))
    }).finally(() => setLoading(false))
  }, [])

  const toggleNode = id => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const card = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }
  const btn = (bg, color = '#fff') => ({ padding: '7px 16px', borderRadius: 7, border: 'none', background: bg, color, cursor: 'pointer', fontSize: 13, fontWeight: 600 })

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Network Map</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>Your downline hierarchy — expand nodes to explore your team structure</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member…" style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)', fontSize: 13, width: 180 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Total Network', value: data?.totalCount || 0, color: '#818cf8' },
            { label: 'Depth', value: data?.maxDepth ? `${data.maxDepth} levels` : '—', color: '#93c5fd' },
            { label: 'Active (30d)', value: data?.activeMtd || 0, color: '#86efac' },
            { label: 'Network PV', value: data?.networkPv || '—', color: '#fbbf24' },
          ].map(k => (
            <div key={k.label} style={card}>
              <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{loading ? '…' : k.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{k.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => {
            const allIds = new Set()
            const collect = node => { allIds.add(node.id); (node.children || []).forEach(collect) }
            if (data?.root) collect(data.root)
            setExpanded(allIds)
          }} style={btn('#6366f111', '#6366f1')}>Expand All</button>
          <button onClick={() => setExpanded(data?.root ? new Set([data.root.id]) : new Set())} style={btn('var(--border)', 'var(--text-muted)')}>Collapse All</button>
        </div>

        {loading ? (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>Loading network map…</div>
        ) : data?.root ? (
          <div>
            <NodeCard node={data.root} expanded={expanded} onToggle={toggleNode} />
          </div>
        ) : (
          <div style={{ ...card, textAlign: 'center', color: 'var(--text-muted)', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🌲</div>
            <div style={{ fontWeight: 700 }}>No downline yet</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Start recruiting to build your network.</div>
          </div>
        )}

        <div style={{ ...card, marginTop: 20 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--text-muted)' }}>Rank Legend</h3>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            {Object.entries(RANK_COLOR).map(([rank, color]) => (
              <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rank}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
