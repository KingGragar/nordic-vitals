/**
 * Tree.jsx — Interactive binary tree visualization
 * Data source: GET /v1/mlm/genealogy/tree/:root?tree=placement&depth=10
 * Returns flat nodes[]; we nest via placement_parent_id client-side.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Tree from 'react-d3-tree'
import { getTree } from '../../api/mlmApi'
import DashboardLayout from '../../components/DashboardLayout'

const ROOT_ID = 'efbb8d0e-b5a5-4a15-bcc6-2f07b980ca64'

const PLAN_TYPES = [
  { value: 'binary',         label: 'Binary' },
  { value: 'breakaway',      label: 'Breakaway' },
  { value: 'forced_matrix',  label: 'Forced Matrix' },
]

function short(id) { return id ? id.slice(0, 8) : '—' }

// Build react-d3-tree nested structure from flat nodes[] using placement_parent_id
function buildTree(nodes) {
  const byId = {}
  nodes.forEach(n => { byId[n.id] = { ...n, _children: [] } })
  let root = null
  nodes.forEach(n => {
    if (n.placement_parent_id && byId[n.placement_parent_id]) {
      byId[n.placement_parent_id]._children.push(byId[n.id])
    } else {
      root = byId[n.id]
    }
  })
  function toD3(node) {
    return {
      name: `usr-${short(node.user_id)}`,
      attributes: {
        id: node.id,
        user_id: node.user_id,
        leg: node.leg,
        active: node.active,
        plan_type: node.plan_type,
        depth: node.depth,
      },
      children: node._children.map(toD3),
    }
  }
  return root ? toD3(root) : null
}

function legColor(leg) {
  if (leg === 'L') return '#3b82f6'
  if (leg === 'R') return '#22c55e'
  return '#c9a84c'
}

function CustomNode({ nodeDatum, onSelect }) {
  const attr = nodeDatum.attributes || {}
  const border = legColor(attr.leg)
  const legText = attr.leg === 'L' ? 'L' : attr.leg === 'R' ? 'R' : 'ROOT'

  return (
    <foreignObject width={180} height={116} x={-90} y={-58}>
      <div
        onClick={() => onSelect(nodeDatum)}
        style={{
          background: 'var(--navy2)',
          border: `2px solid ${border}`,
          borderRadius: '10px',
          padding: '10px 12px',
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
          <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--cream)' }}>
            usr-{short(attr.user_id)}
          </span>
          <span style={{
            background: `${border}22`, color: border,
            border: `1px solid ${border}`,
            borderRadius: '999px', padding: '1px 7px',
            fontSize: '10px', fontWeight: 700,
          }}>
            {legText}
          </span>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attr.id ? attr.id.slice(0, 22) + '…' : '—'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: attr.active ? '#22c55e' : '#64748b',
            display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ color: attr.active ? '#86efac' : 'var(--text2)', fontSize: '10px' }}>
            {attr.active ? 'Active' : 'Inactive'}
          </span>
          <span style={{ marginLeft: 'auto', color: 'var(--text2)', fontSize: '10px' }}>
            depth {attr.depth ?? '—'}
          </span>
        </div>
      </div>
    </foreignObject>
  )
}

export default function TreePage() {
  const [treeData, setTreeData]   = useState(null)
  const [nodeCount, setNodeCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [apiError, setApiError]   = useState(null)
  const [zoom, setZoom]           = useState(0.72)
  const [translate, setTranslate] = useState({ x: 440, y: 80 })
  const [selected, setSelected]   = useState(null)
  const [planType, setPlanType]   = useState('binary')
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
    let cancelled = false
    setLoading(true)
    setApiError(null)
    setTreeData(null)
    getTree(ROOT_ID, { tree: 'placement', depth: 10, plan_type: planType })
      .then(data => {
        if (cancelled) return
        const built = buildTree(data.nodes || [])
        setTreeData(built)
        setNodeCount(data.count || (data.nodes || []).length)
      })
      .catch(err => {
        if (cancelled) return
        setApiError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [planType])

  return (
    <DashboardLayout>
      <style>{`
        .rd3t-link { stroke: var(--border) !important; stroke-width: 1.5px !important; fill: none !important; }
        .rd3t-leaf-node circle, .rd3t-branch-node circle { fill: transparent !important; stroke: transparent !important; r: 0 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '3px' }}>
            Genealogy Tree
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
            Live · GET /v1/mlm/genealogy/tree/:root · {nodeCount} node{nodeCount !== 1 ? 's' : ''} · placement tree · {planType}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {apiError
            ? <span className="badge badge-yellow">API error: {apiError}</span>
            : <span className="badge badge-green">Live</span>
          }
        </div>
      </div>

      {/* Plan type selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '10px',
      }}>
        <span style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '4px' }}>
          Plan type
        </span>
        {PLAN_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPlanType(value)}
            style={{
              padding: '4px 14px',
              borderRadius: '999px',
              border: planType === value ? '1px solid #c9a84c' : '1px solid var(--border)',
              background: planType === value ? '#c9a84c22' : 'transparent',
              color: planType === value ? '#c9a84c' : 'var(--text2)',
              fontSize: '12px',
              fontWeight: planType === value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Controls + legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
      }}>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}>+ Zoom In</button>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.15))}>− Zoom Out</button>
        <button className="btn btn-outline btn-sm" onClick={() => { setZoom(0.72); centre() }}>◎ Centre</button>
        <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto', alignItems: 'center' }}>
          {[
            { color: '#c9a84c', label: 'Root' },
            { color: '#3b82f6', label: 'Left (L)' },
            { color: '#22c55e', label: 'Right (R)' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{
        height: 'calc(100vh - 240px)', minHeight: '460px',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '12px', overflow: 'hidden', position: 'relative',
      }}>
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(13,27,42,0.7)', zIndex: 10,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '10px', opacity: 0.5 }}>◌</div>
              <div style={{ color: 'var(--text2)', fontSize: '14px' }}>Fetching tree from /tree/:root…</div>
            </div>
          </div>
        )}
        {treeData && (
          <Tree
            data={treeData}
            orientation="vertical"
            pathFunc="step"
            translate={translate}
            zoom={zoom}
            separation={{ siblings: 1.8, nonSiblings: 2.2 }}
            nodeSize={{ x: 220, y: 180 }}
            renderCustomNodeElement={rd3tProps => (
              <CustomNode {...rd3tProps} onSelect={setSelected} />
            )}
          />
        )}
        {!loading && !treeData && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text2)', fontSize: '14px' }}>No tree data returned from API.</div>
          </div>
        )}
      </div>

      {/* Side drawer */}
      {selected && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} onClick={() => setSelected(null)} />
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: '340px', height: '100vh',
            background: 'var(--navy2)', borderLeft: '1px solid var(--border)',
            zIndex: 201, padding: '28px 24px', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)' }}>Node Details</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </div>
            {(() => {
              const a = selected.attributes || {}
              const bc = legColor(a.leg)
              const legText = a.leg === 'L' ? 'Left leg (L)' : a.leg === 'R' ? 'Right leg (R)' : 'Root — no parent'
              const rows = [
                { label: 'Node ID', value: a.id || '—', mono: true, color: '#c9a84c' },
                { label: 'User ID', value: a.user_id || '—', mono: true, color: 'var(--text2)' },
                { label: 'Plan type', value: a.plan_type || '—', color: 'var(--text)' },
                { label: 'Depth', value: a.depth != null ? `${a.depth}` : '—', color: 'var(--text2)' },
              ]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rows.map(({ label, value, mono, color }) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{ color, fontSize: mono ? '11px' : '14px', fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
                    </div>
                  ))}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leg</div>
                    <span style={{ background: `${bc}22`, color: bc, border: `1px solid ${bc}`, borderRadius: '999px', padding: '3px 12px', fontSize: '12px', fontWeight: 700 }}>
                      {legText}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: a.active ? '#22c55e' : '#64748b', display: 'inline-block' }} />
                      <span style={{ color: a.active ? '#86efac' : 'var(--text2)', fontSize: '14px', fontWeight: 500 }}>
                        {a.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
