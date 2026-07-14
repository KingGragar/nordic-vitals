/**
 * Tree.jsx — Interactive binary tree visualization
 * Uses react-d3-tree with live node data from Arctico MLM API.
 * TODO: swap hardcoded children to GET /v1/mlm/genealogy/tree/:root when live
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Tree from 'react-d3-tree'
import { getNode } from '../../api/mlmApi'
import DashboardLayout from '../../components/DashboardLayout'

// ── Known demo tree (hardcoded until /tree/:root ships) ───────────────────────
// Root: efbb8d0e (user 20790ace, no parent, leg=null)
// Children fetched from GET /v1/mlm/genealogy/node/:id
const ROOT_ID = 'efbb8d0e-b5a5-4a15-bcc6-2f07b980ca64'

const KNOWN_NODES = [
  { id: 'efbb8d0e-b5a5-4a15-bcc6-2f07b980ca64', user_id: '20790ace-0000-0000-0000-000000000000', leg: null,  active: false, plan_type: 'binary' },
  { id: '1fa2c990-e9ba-4cdf-8dcd-e2743da9b955', user_id: 'd548d377-0000-0000-0000-000000000000', leg: null,  active: false, plan_type: 'binary' },
  { id: '73e768de-4d17-4c4d-8a5a-67187d1cfec9', user_id: '6c63524b-0000-0000-0000-000000000000', leg: 'L',   active: false, plan_type: 'binary' },
  { id: 'e24bc3e3-e45f-4dd7-bc0c-cc44c1bd3418', user_id: '2b5563f4-0000-0000-0000-000000000000', leg: 'L',   active: false, plan_type: 'binary' },
  { id: '55b4652a-62df-4e49-b96d-c354f0f7dc01', user_id: 'cdf8a1ce-0000-0000-0000-000000000000', leg: 'L',   active: false, plan_type: 'binary' },
]

function short(id) {
  return id ? id.slice(0, 8) : '—'
}

// Build react-d3-tree compatible data from flat known nodes
function buildTreeData(nodes, liveRoot) {
  const root = liveRoot || nodes[0]
  const children = nodes.slice(1).map(n => ({
    name: `usr-${short(n.user_id)}`,
    attributes: { id: n.id, user_id: n.user_id, leg: n.leg, active: n.active, plan_type: n.plan_type },
    children: [],
  }))
  return {
    name: `usr-${short(root.user_id)}`,
    attributes: { id: root.id, user_id: root.user_id, leg: root.leg, active: root.active, plan_type: root.plan_type },
    children,
  }
}

// ── Leg colour helper ──────────────────────────────────────────────────────────
function legBorderColor(leg) {
  if (leg === 'L') return '#3b82f6'
  if (leg === 'R') return '#22c55e'
  return '#c9a84c' // root / no-leg → gold
}

function legLabel(leg) {
  if (leg === 'L') return { text: 'L', color: '#3b82f6' }
  if (leg === 'R') return { text: 'R', color: '#22c55e' }
  return { text: 'ROOT', color: '#c9a84c' }
}

// ── Custom node renderer ───────────────────────────────────────────────────────
function CustomNode({ nodeDatum, onSelect }) {
  const attr = nodeDatum.attributes || {}
  const border = legBorderColor(attr.leg)
  const badge = legLabel(attr.leg)

  return (
    <foreignObject width={180} height={120} x={-90} y={-60}>
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
        {/* Row 1: user short ID + leg badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--cream)', letterSpacing: '0.02em' }}>
            usr-{short(attr.user_id)}
          </span>
          <span style={{
            background: `${border}22`,
            color: badge.color,
            border: `1px solid ${badge.color}`,
            borderRadius: '999px',
            padding: '1px 7px',
            fontSize: '10px',
            fontWeight: 700,
          }}>
            {badge.text}
          </span>
        </div>

        {/* Row 2: node ID (truncated) */}
        <div style={{ color: 'var(--text2)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {attr.id ? attr.id.slice(0, 20) + '…' : '—'}
        </div>

        {/* Row 3: active dot + plan type */}
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
            {attr.plan_type}
          </span>
        </div>
      </div>
    </foreignObject>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TreePage() {
  const [treeData, setTreeData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [zoom, setZoom] = useState(0.72)
  const [translate, setTranslate] = useState({ x: 440, y: 100 })
  const [selectedNode, setSelectedNode] = useState(null)
  const containerRef = useRef(null)

  // Centre translate on window resize
  const centre = useCallback(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect()
      setTranslate({ x: width / 2, y: 100 })
    }
  }, [])

  useEffect(() => {
    centre()
    window.addEventListener('resize', centre)
    return () => window.removeEventListener('resize', centre)
  }, [centre])

  // Fetch live root node, build tree
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getNode(ROOT_ID)
      .then(liveRoot => {
        if (cancelled) return
        // Merge live root with known children
        const root = liveRoot || KNOWN_NODES[0]
        const data = buildTreeData(KNOWN_NODES, root)
        setTreeData(data)
      })
      .catch(err => {
        if (cancelled) return
        // Fall back to hardcoded data so the page still renders
        setTreeData(buildTreeData(KNOWN_NODES, null))
        setError(err.message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout>
      <style>{`
        .rd3t-link { stroke: var(--border) !important; stroke-width: 1.5px !important; fill: none !important; }
        .rd3t-leaf-node circle,
        .rd3t-branch-node circle { fill: transparent !important; stroke: transparent !important; r: 0 !important; }
      `}</style>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '3px' }}>
            Binary Tree
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text2)' }}>
            Live data · binary engine · /tree/:root endpoint coming (will auto-update)
          </p>
        </div>
        {error && (
          <span className="badge badge-yellow" style={{ fontSize: '11px' }}>
            API fallback — {error}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap',
        background: 'var(--navy2)', border: '1px solid var(--border)',
        borderRadius: '10px', padding: '10px 14px', marginBottom: '12px',
      }}>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}>
          + Zoom In
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.15))}>
          − Zoom Out
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => { setZoom(0.72); centre() }}>
          ◎ Centre
        </button>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto', alignItems: 'center' }}>
          {[
            { color: '#c9a84c', label: 'Root / no leg' },
            { color: '#3b82f6', label: 'Left leg' },
            { color: '#22c55e', label: 'Right leg' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text2)' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color, display: 'inline-block' }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          height: 'calc(100vh - 240px)',
          minHeight: '460px',
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {loading && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: 'rgba(13,27,42,0.7)', zIndex: 10,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', marginBottom: '10px', opacity: 0.6 }}>◌</div>
              <div style={{ color: 'var(--text2)', fontSize: '14px' }}>Loading tree…</div>
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
            renderCustomNodeElement={(rd3tProps) => (
              <CustomNode {...rd3tProps} onSelect={setSelectedNode} />
            )}
          />
        )}
      </div>

      {/* Side drawer overlay */}
      {selectedNode && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200,
            }}
            onClick={() => setSelectedNode(null)}
          />
          <div style={{
            position: 'fixed', top: 0, right: 0,
            width: '340px', height: '100vh',
            background: 'var(--navy2)',
            borderLeft: '1px solid var(--border)',
            zIndex: 201, padding: '28px 24px', overflowY: 'auto',
          }}>
            {/* Drawer header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)' }}>Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {(() => {
              const attr = selectedNode.attributes || {}
              const border = legBorderColor(attr.leg)
              const badge = legLabel(attr.leg)
              const rows = [
                { label: 'Display name', value: selectedNode.name, color: 'var(--cream)', weight: 700 },
                { label: 'Node ID (full)', value: attr.id || '—', color: 'var(--gold)', mono: true },
                { label: 'User ID (full)', value: attr.user_id || '—', color: 'var(--text2)', mono: true },
                { label: 'Plan type', value: attr.plan_type || '—', color: 'var(--text)' },
              ]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {rows.map(({ label, value, color, weight, mono }) => (
                    <div key={label}>
                      <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                      <div style={{
                        color, fontWeight: weight || 400,
                        fontSize: mono ? '11px' : '14px',
                        fontFamily: mono ? 'monospace' : 'inherit',
                        wordBreak: 'break-all',
                      }}>{value}</div>
                    </div>
                  ))}

                  {/* Leg */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leg position</div>
                    <span style={{
                      background: `${border}22`, color: badge.color,
                      border: `1px solid ${badge.color}`,
                      borderRadius: '999px', padding: '3px 12px',
                      fontSize: '12px', fontWeight: 700,
                    }}>
                      {badge.text === 'ROOT' ? 'Root — no parent' : badge.text === 'L' ? 'Left leg (L)' : 'Right leg (R)'}
                    </span>
                  </div>

                  {/* Active status */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '9px', height: '9px', borderRadius: '50%',
                        background: attr.active ? '#22c55e' : '#64748b',
                        display: 'inline-block',
                      }} />
                      <span style={{ color: attr.active ? '#86efac' : 'var(--text2)', fontSize: '14px', fontWeight: 500 }}>
                        {attr.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Sponsor_id note */}
                  <div style={{
                    background: 'var(--navy3)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '12px', fontSize: '12px', color: 'var(--text2)', marginTop: '4px',
                  }}>
                    Sponsor ID and rank data will populate when GET /v1/mlm/genealogy/tree/:root ships full node payloads.
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
