import { useState } from 'react'
import Tree from 'react-d3-tree'
import { TREE_DATA } from '../../data/mock'
import DashboardLayout from '../../components/DashboardLayout'

const rankColors = {
  Gold: '#c9a84c',
  Silver: '#c0c8d8',
  Bronze: '#cd7f32',
  Unranked: '#4a5568',
  empty: '#1e3450',
}

function flattenTree(node, acc = []) {
  if (!node) return acc
  acc.push(node)
  if (node.children) node.children.forEach(child => flattenTree(child, acc))
  return acc
}

function CustomNode({ nodeDatum, toggleNode, onSelect }) {
  const attr = nodeDatum.attributes || {}
  const status = attr.status
  const isActive = status === 'active'
  const isInactive = status === 'inactive'
  const isEmpty = status === 'empty'
  const isSpillover = !!attr.spillover
  const rankDotColor = rankColors[attr.rank] || '#4a5568'

  let cardStyle = {
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    userSelect: 'none',
  }

  if (isEmpty) {
    cardStyle = {
      ...cardStyle,
      border: '1.5px dashed #1e3450',
      background: '#0d1b2a',
      color: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }
  } else if (isInactive) {
    cardStyle = {
      ...cardStyle,
      background: '#1a0f0f',
      border: '1px solid #5f2020',
    }
  } else if (isSpillover) {
    cardStyle = {
      ...cardStyle,
      background: '#12243a',
      border: '2px dashed var(--gold)',
    }
  } else {
    cardStyle = {
      ...cardStyle,
      background: '#12243a',
      border: '1px solid #1e3450',
    }
  }

  function handleClick() {
    toggleNode()
    if (!isEmpty) onSelect(nodeDatum)
  }

  return (
    <foreignObject width={180} height={110} x={-90} y={-55}>
      <div style={cardStyle} onClick={handleClick}>
        {isEmpty ? (
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#4a6080' }}>＋ Empty slot</span>
        ) : (
          <>
            {/* Top row: rank dot + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
              <span style={{ color: rankDotColor, fontSize: '10px', lineHeight: 1 }}>●</span>
              <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {nodeDatum.name}
              </span>
            </div>

            {/* Middle: ID + PV */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '11px', color: attr.id ? 'var(--gold)' : '#4a5568' }}>
                {attr.id || '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
                PV: {attr.pv}
              </span>
            </div>

            {/* Bottom: status + spillover */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', color: isActive ? '#38a169' : '#e53e3e' }}>
                ●
              </span>
              <span style={{ fontSize: '10px', color: isActive ? '#38a169' : '#e53e3e' }}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
              {isSpillover && (
                <span style={{ fontSize: '10px', color: 'var(--gold)', marginLeft: 'auto', fontWeight: 700 }}>
                  ↓ spillover
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </foreignObject>
  )
}

export default function TreePage() {
  const [zoom, setZoom] = useState(0.7)
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('tree')
  const [selectedNode, setSelectedNode] = useState(null)
  const [translate] = useState({ x: 400, y: 80 })

  const flatNodes = flattenTree(TREE_DATA)

  const filteredNodes = flatNodes.filter(node => {
    const attr = node.attributes || {}
    if (filter === 'Left Leg' && attr.leg !== 'L' && attr.leg !== null) return false
    if (filter === 'Right Leg' && attr.leg !== 'R' && attr.leg !== null) return false
    if (search && !node.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function handleNodeClick(nodeDatum) {
    if (nodeDatum.attributes?.status !== 'empty') {
      setSelectedNode(nodeDatum)
    }
  }

  return (
    <DashboardLayout>
      <style>{`
        .path-left { stroke: #3b82f6 !important; }
        .path-right { stroke: #10b981 !important; }
        .rd3t-link { stroke-width: 2px !important; fill: none !important; }
        .rd3t-leaf-node circle, .rd3t-branch-node circle { fill: transparent !important; stroke: transparent !important; r: 0; }
      `}</style>

      <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--cream)', marginBottom: '16px' }}>
        My Binary Tree
      </h1>

      {/* Controls bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--navy2)',
        borderRadius: '10px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.min(z + 0.15, 2))}>
          Zoom In ＋
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(z => Math.max(z - 0.15, 0.2))}>
          Zoom Out －
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => setZoom(0.7)}>
          Fit ◎
        </button>

        <select
          className="input"
          style={{ maxWidth: '150px' }}
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="All">Filter: All ▾</option>
          <option value="Left Leg">Left Leg</option>
          <option value="Right Leg">Right Leg</option>
        </select>

        <input
          className="input"
          style={{ maxWidth: '200px' }}
          placeholder="Search members..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          <button
            className={`btn btn-sm ${viewMode === 'tree' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setViewMode('tree')}
          >
            🌳 Tree
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-gold' : 'btn-outline'}`}
            onClick={() => setViewMode('list')}
          >
            📋 List
          </button>
        </div>
      </div>

      {viewMode === 'tree' ? (
        /* Tree canvas */
        <div style={{
          height: 'calc(100vh - 220px)',
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <Tree
            data={TREE_DATA}
            orientation="vertical"
            pathFunc="step"
            translate={translate}
            zoom={zoom}
            separation={{ siblings: 1.5, nonSiblings: 2 }}
            nodeSize={{ x: 220, y: 160 }}
            renderCustomNodeElement={(rd3tProps) => (
              <CustomNode
                {...rd3tProps}
                onSelect={handleNodeClick}
              />
            )}
            pathClassFunc={(linkData) => {
              const target = linkData?.target
              if (!target) return ''
              const leg = target?.data?.attributes?.leg
              if (leg === 'L') return 'path-left'
              if (leg === 'R') return 'path-right'
              return ''
            }}
          />
        </div>
      ) : (
        /* List view */
        <div style={{
          background: 'var(--navy2)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Leg</th>
                <th>Rank</th>
                <th>PV</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map((node, i) => {
                const attr = node.attributes || {}
                return (
                  <tr
                    key={i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => attr.status !== 'empty' && setSelectedNode(node)}
                  >
                    <td style={{ color: 'var(--cream)', fontWeight: 500 }}>{node.name}</td>
                    <td style={{ color: attr.leg === 'L' ? '#3b82f6' : attr.leg === 'R' ? '#10b981' : 'var(--text2)' }}>
                      {attr.leg === 'L' ? 'Left' : attr.leg === 'R' ? 'Right' : '—'}
                    </td>
                    <td style={{ color: rankColors[attr.rank] || 'var(--text2)' }}>{attr.rank || '—'}</td>
                    <td>{attr.pv ?? 0}</td>
                    <td>
                      {attr.status === 'active' && <span className="badge badge-green">Active</span>}
                      {attr.status === 'inactive' && <span className="badge badge-red">Inactive</span>}
                      {attr.status === 'empty' && <span className="badge badge-grey">Empty</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Side drawer */}
      {selectedNode && (
        <>
          {/* Overlay */}
          <div
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.3)', zIndex: 200,
            }}
            onClick={() => setSelectedNode(null)}
          />
          {/* Panel */}
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '320px',
            height: '100vh',
            background: 'var(--navy2)',
            borderLeft: '1px solid var(--border)',
            zIndex: 201,
            padding: '28px 24px',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--cream)' }}>Member Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text2)',
                  fontSize: '20px', cursor: 'pointer', lineHeight: 1, padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>

            {(() => {
              const attr = selectedNode.attributes || {}
              const rankColor = rankColors[attr.rank] || 'var(--text2)'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div className="label-text">Name</div>
                    <div style={{ color: 'var(--cream)', fontWeight: 700, fontSize: '16px' }}>{selectedNode.name}</div>
                  </div>
                  <div>
                    <div className="label-text">Member ID</div>
                    <div style={{ color: 'var(--gold)', fontSize: '14px' }}>{attr.id || '—'}</div>
                  </div>
                  <div>
                    <div className="label-text">Rank</div>
                    <div style={{ color: rankColor, fontWeight: 600, fontSize: '14px' }}>● {attr.rank}</div>
                  </div>
                  <div>
                    <div className="label-text">Leg</div>
                    <div style={{ color: attr.leg === 'L' ? '#3b82f6' : attr.leg === 'R' ? '#10b981' : 'var(--text2)', fontSize: '14px' }}>
                      {attr.leg === 'L' ? '← Left Leg' : attr.leg === 'R' ? '→ Right Leg' : 'Root'}
                    </div>
                  </div>
                  <div>
                    <div className="label-text">Personal Volume</div>
                    <div style={{ color: 'var(--cream)', fontSize: '14px', fontWeight: 600 }}>{attr.pv} PV</div>
                  </div>
                  <div>
                    <div className="label-text">Status</div>
                    <span className={`badge ${attr.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                      {attr.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <div className="label-text">Join Date</div>
                    <div style={{ color: 'var(--text)', fontSize: '14px' }}>2025-03-12</div>
                  </div>
                  <div>
                    <div className="label-text">Sponsor</div>
                    <div style={{ color: 'var(--text)', fontSize: '14px' }}>NV-10042</div>
                  </div>
                  <div>
                    <div className="label-text">Direct Recruits</div>
                    <div style={{ color: 'var(--text)', fontSize: '14px' }}>2</div>
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
