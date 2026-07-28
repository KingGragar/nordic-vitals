import { useState, useEffect, useRef, useCallback } from 'react'
import Tree from 'react-d3-tree'
import AdminLayout from '../../components/AdminLayout'
import { getAdminMembers } from '../../api/mlmApi'

const RANK_COLOR = {
  Platinum: '#a855f7',
  Gold:     '#c9a84c',
  Silver:   '#94a3b8',
  Bronze:   '#b45309',
  Unranked: '#475569',
}

const PLAN_TYPES = [
  { value: 'binary',        label: 'Binary' },
  { value: 'breakaway',     label: 'Breakaway' },
  { value: 'forced_matrix', label: 'Forced Matrix' },
]

const TREE_MODES = [
  { value: 'sponsor',    label: 'Sponsor Tree' },
  { value: 'placement',  label: 'Placement Tree' },
]

function rankColor(rank) {
  return RANK_COLOR[rank] || RANK_COLOR.Unranked
}

function buildSponsorTree(members, rootId) {
  const byId = {}
  members.forEach(m => { byId[m.id] = { ...m, _children: [] } })
  members.forEach(m => {
    if (m.sponsor && byId[m.sponsor]) {
      byId[m.sponsor]._children.push(byId[m.id])
    }
  })
  const root = byId[rootId]
  if (!root) return null

  function toD3(node) {
    return {
      name: node.name,
      attributes: {
        id:     node.id,
        rank:   node.rank,
        pv:     node.pv,
        gv:     node.gv,
        status: node.status,
        country: node.country,
        joined:  node.joined,
        sponsor: node.sponsor,
      },
      children: node._children.map(toD3),
    }
  }
  return toD3(root)
}

function buildPlacementTree(members, rootId) {
  // For mock: use same sponsor hierarchy (placement tree mirrors sponsor in mock)
  return buildSponsorTree(members, rootId)
}

function countNodes(tree) {
  if (!tree) return 0
  return 1 + (tree.children || []).reduce((sum, c) => sum + countNodes(c), 0)
}

function NodeCard({ nodeDatum, onSelect }) {
  const a = nodeDatum.attributes || {}
  const rc = rankColor(a.rank)
  const active = a.status === 'Active'

  return (
    <foreignObject width={200} height={110} x={-100} y={-55}>
      <div
        onClick={() => onSelect(nodeDatum)}
        style={{
          background: 'var(--navy2)',
          border: `2px solid ${rc}`,
          borderRadius: '10px',
          padding: '9px 12px',
          cursor: 'pointer',
          fontSize: '11px',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          userSelect: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
            {nodeDatum.name}
          </span>
          <span style={{
            background: `${rc}22`, color: rc,
            border: `1px solid ${rc}`,
            borderRadius: '999px', padding: '1px 7px',
            fontSize: '10px', fontWeight: 700, flexShrink: 0,
          }}>
            {a.rank || 'Unranked'}
          </span>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '10px', fontFamily: 'monospace' }}>
          {a.id}
        </div>
        <div style={{ display: 'flex', gap: '10px', fontSize: '10px', color: 'var(--text2)' }}>
          <span>PV <strong style={{ color: 'var(--cream)' }}>{a.pv ?? '—'}</strong></span>
          <span>GV <strong style={{ color: 'var(--cream)' }}>{a.gv ?? '—'}</strong></span>
          {a.country && <span>🌍 {a.country}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: active ? '#22c55e' : '#64748b', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: active ? '#86efac' : 'var(--text2)', fontSize: '10px' }}>{a.status || '—'}</span>
        </div>
      </div>
    </foreignObject>
  )
}

export default function AdminNetwork() {
  const [members, setMembers]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [treeData, setTreeData]   = useState(null)
  const [nodeCount, setNodeCount] = useState(0)
  const [rootId, setRootId]       = useState(null)
  const [planType, setPlanType]   = useState('binary')
  const [treeMode, setTreeMode]   = useState('sponsor')
  const [selected, setSelected]   = useState(null)
  const [search, setSearch]       = useState('')
  const [zoom, setZoom]           = useState(0.65)
  const [translate, setTranslate] = useState({ x: 500, y: 80 })
  const containerRef = useRef(null)

  const centre = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect()
      setTranslate({ x: width / 2, y: 80 })
    }
  }, [])

  useEffect(() => {
    centre()
    window.addEventListener('resize', centre)
    return () => window.removeEventListener('resize', centre)
  }, [centre])

  useEffect(() => {
    setLoading(true)
    getAdminMembers()
      .then(data => {
        const list = data.members || []
        setMembers(list)
        // Default root: member with no matching sponsor (top of sponsor hierarchy)
        const ids = new Set(list.map(m => m.id))
        const topLevel = list.find(m => !m.sponsor || !ids.has(m.sponsor))
        if (topLevel) setRootId(topLevel.id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!rootId || members.length === 0) return
    const tree = treeMode === 'placement'
      ? buildPlacementTree(members, rootId)
      : buildSponsorTree(members, rootId)
    setTreeData(tree)
    setNodeCount(countNodes(tree))
  }, [rootId, members, treeMode])

  const searchResults = search.trim().length >= 2
    ? members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.id.toLowerCase().includes(search.toLowerCase())
      )
    : []

  return (
    <AdminLayout>
      <style>{`
        .rd3t-link { stroke: var(--border) !important; stroke-width: 1.5px !important; fill: none !important; }
        .rd3t-leaf-node circle, .rd3t-branch-node circle { fill: transparent !important; stroke: transparent !important; r: 0 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '3px' }}>
            Network Tree
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
            Full {treeMode} view · {nodeCount} node{nodeCount !== 1 ? 's' : ''} · {planType} plan
            {rootId && <span style={{ marginLeft: 8, fontFamily: 'monospace', fontSize: '10px', opacity: 0.6 }}>root: {rootId}</span>}
          </p>
        </div>
        {/* Member search / jump to root */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Jump to member…"
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'var(--navy2)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '7px 12px',
              color: 'var(--cream)', fontSize: '13px',
            }}
          />
          {searchResults.length > 0 && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: 'var(--navy2)', border: '1px solid var(--border)',
              borderRadius: '8px', marginTop: '4px',
              maxHeight: '220px', overflowY: 'auto',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            }}>
              {searchResults.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setRootId(m.id); setSearch(''); centre() }}
                  style={{
                    padding: '8px 14px', cursor: 'pointer', fontSize: '13px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#ffffff12'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ color: 'var(--cream)' }}>{m.name}</span>
                  <span style={{ fontSize: '11px', color: rankColor(m.rank), fontWeight: 600 }}>{m.id} · {m.rank}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '10px',
      }}>
        {/* Tree mode */}
        <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '2px' }}>Mode</span>
        {TREE_MODES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setTreeMode(value)}
            style={{
              padding: '4px 13px', borderRadius: '999px',
              border: treeMode === value ? '1px solid var(--gold)' : '1px solid var(--border)',
              background: treeMode === value ? '#c9a84c22' : 'transparent',
              color: treeMode === value ? 'var(--gold)' : 'var(--text2)',
              fontSize: '12px', fontWeight: treeMode === value ? 700 : 400,
              cursor: 'pointer',
            }}
          >{label}</button>
        ))}

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 6px' }} />

        {/* Plan type */}
        <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '2px' }}>Plan</span>
        {PLAN_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPlanType(value)}
            style={{
              padding: '4px 13px', borderRadius: '999px',
              border: planType === value ? '1px solid var(--gold)' : '1px solid var(--border)',
              background: planType === value ? '#c9a84c22' : 'transparent',
              color: planType === value ? 'var(--gold)' : 'var(--text2)',
              fontSize: '12px', fontWeight: planType === value ? 700 : 400,
              cursor: 'pointer',
            }}
          >{label}</button>
        ))}

        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}>+ In</button>
          <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.15))}>− Out</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setZoom(0.65); centre() }}>◎ Centre</button>
          {rootId && members.length > 0 && (() => {
            const ids = new Set(members.map(m => m.id))
            const top = members.find(m => !m.sponsor || !ids.has(m.sponsor))
            return top && rootId !== top.id
              ? <button className="btn btn-outline btn-sm" onClick={() => { setRootId(top.id); setZoom(0.65); centre() }}>↑ Reset Root</button>
              : null
          })()}
        </div>
      </div>

      {/* Rank legend */}
      <div style={{
        display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '8px 14px', marginBottom: '12px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Rank</span>
        {Object.entries(RANK_COLOR).map(([rank, color]) => (
          <div key={rank} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, display: 'inline-block', border: `1px solid ${color}` }} />
            {rank}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text2)' }}>
          Click a node to view member details
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{
        height: 'calc(100vh - 260px)', minHeight: '460px',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden', position: 'relative',
      }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,27,42,0.7)', zIndex: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.5 }}>◌</div>
              <div style={{ color: 'var(--text2)', fontSize: '14px' }}>Loading network…</div>
            </div>
          </div>
        )}
        {!loading && treeData && (
          <Tree
            data={treeData}
            orientation="vertical"
            pathFunc="step"
            translate={translate}
            zoom={zoom}
            separation={{ siblings: 2.0, nonSiblings: 2.5 }}
            nodeSize={{ x: 240, y: 170 }}
            renderCustomNodeElement={rd3tProps => (
              <NodeCard {...rd3tProps} onSelect={setSelected} />
            )}
          />
        )}
        {!loading && !treeData && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text2)', fontSize: '14px' }}>No network data available.</div>
          </div>
        )}
      </div>

      {/* Side detail drawer */}
      {selected && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} onClick={() => setSelected(null)} />
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: '360px', height: '100vh',
            background: 'var(--navy2)', borderLeft: '1px solid var(--border)',
            zIndex: 201, padding: '28px 24px', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)' }}>Member Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            {(() => {
              const a = selected.attributes || {}
              const rc = rankColor(a.rank)
              const active = a.status === 'Active'
              const rows = [
                { label: 'Name',     value: selected.name, bold: true },
                { label: 'ID',       value: a.id,      mono: true, color: '#c9a84c' },
                { label: 'Sponsor',  value: a.sponsor || 'None (root)', mono: true, color: 'var(--text2)' },
                { label: 'Country',  value: a.country || '—' },
                { label: 'Joined',   value: a.joined || '—' },
                { label: 'PV',       value: a.pv != null ? String(a.pv) : '—', color: 'var(--cream)' },
                { label: 'GV',       value: a.gv != null ? String(a.gv) : '—', color: 'var(--cream)' },
              ]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Rank badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ background: `${rc}22`, color: rc, border: `1px solid ${rc}`, borderRadius: '999px', padding: '4px 14px', fontSize: '13px', fontWeight: 700 }}>
                      {a.rank || 'Unranked'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: active ? '#22c55e' : '#64748b', display: 'inline-block' }} />
                      <span style={{ color: active ? '#86efac' : 'var(--text2)', fontSize: '13px', fontWeight: 500 }}>{a.status || '—'}</span>
                    </div>
                  </div>

                  {rows.map(({ label, value, mono, color, bold }) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{
                        color: color || 'var(--text)',
                        fontSize: mono ? '12px' : '14px',
                        fontFamily: mono ? 'monospace' : 'inherit',
                        fontWeight: bold ? 700 : 400,
                        wordBreak: 'break-all',
                      }}>{value}</div>
                    </div>
                  ))}

                  {/* Downline quick count */}
                  {(() => {
                    const directCount = members.filter(m => m.sponsor === a.id).length
                    return directCount > 0 ? (
                      <div style={{ background: '#ffffff08', borderRadius: '8px', padding: '12px 14px', marginTop: '4px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>Direct Recruits</div>
                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--cream)' }}>{directCount}</div>
                        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {members.filter(m => m.sponsor === a.id).map(m => (
                            <div
                              key={m.id}
                              onClick={() => { setRootId(m.id); setSelected(null); centre() }}
                              style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '5px 8px', background: '#ffffff06', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#ffffff12'}
                              onMouseLeave={e => e.currentTarget.style.background = '#ffffff06'}
                            >
                              <span style={{ color: 'var(--cream)' }}>{m.name}</span>
                              <span style={{ color: rankColor(m.rank), fontWeight: 600, fontSize: '11px' }}>{m.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: 'var(--text2)', background: '#ffffff06', borderRadius: '8px', padding: '10px 14px' }}>
                        No direct recruits under this member.
                      </div>
                    )
                  })()}

                  {/* Jump to subtree */}
                  <button
                    className="btn btn-outline"
                    style={{ marginTop: '6px' }}
                    onClick={() => { setRootId(a.id); setSelected(null); setZoom(0.65); centre() }}
                  >
                    View {selected.name}'s Subtree
                  </button>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
