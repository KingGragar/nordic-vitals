import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { getSegments, createSegment, updateSegment, deleteSegment, previewSegment, getSegmentMembers } from '../../api/mlmApi'

const RANK_OPTIONS   = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
const STATUS_OPTIONS = ['Active', 'Inactive']
const COUNTRY_OPTIONS = ['Norway', 'Sweden', 'Denmark', 'Finland', 'Germany', 'Netherlands', 'UK']

const FIELD_DEFS = [
  { key: 'rank',         label: 'Rank',          ops: ['in', 'not_in'],           type: 'multiselect', options: RANK_OPTIONS },
  { key: 'status',       label: 'Status',         ops: ['equals', 'not_equals'],   type: 'select',      options: STATUS_OPTIONS },
  { key: 'pv',           label: 'PV (Personal Volume)', ops: ['gte', 'lte'],       type: 'number' },
  { key: 'gv',           label: 'GV (Group Volume)',    ops: ['gte', 'lte'],       type: 'number' },
  { key: 'country',      label: 'Country',        ops: ['in', 'not_in'],           type: 'multiselect', options: COUNTRY_OPTIONS },
  { key: 'joined_after', label: 'Joined After',   ops: ['gte'],                    type: 'date' },
  { key: 'joined_before',label: 'Joined Before',  ops: ['lte'],                    type: 'date' },
]

const OP_LABELS = {
  equals: 'is', not_equals: 'is not',
  gte: '≥', lte: '≤',
  in: 'is one of', not_in: 'is not one of',
}

const LOGIC_BADGE = { ALL: { bg: '#1e3a5f', color: '#7dd3fc', text: 'ALL rules' }, ANY: { bg: '#3b1f2b', color: '#f9a8d4', text: 'ANY rule' } }

const kpiStyle = { background: 'var(--navy2)', borderRadius: 10, padding: '16px 20px', flex: 1, minWidth: 140 }

function ruleDisplay(rule) {
  const fd = FIELD_DEFS.find(f => f.key === rule.field)
  const fieldLabel = fd ? fd.label : rule.field
  const opLabel = OP_LABELS[rule.op] || rule.op
  const valLabel = Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)
  return `${fieldLabel} ${opLabel} ${valLabel}`
}

function RuleRow({ rule, index, onChange, onRemove }) {
  const fd = FIELD_DEFS.find(f => f.key === rule.field) || FIELD_DEFS[0]
  const validOps = fd.ops

  function handleFieldChange(e) {
    const newFd = FIELD_DEFS.find(f => f.key === e.target.value) || FIELD_DEFS[0]
    onChange(index, { field: newFd.key, op: newFd.ops[0], value: newFd.type === 'multiselect' ? [] : '' })
  }

  function handleOpChange(e) {
    onChange(index, { ...rule, op: e.target.value })
  }

  function handleValueChange(val) {
    onChange(index, { ...rule, value: val })
  }

  const inp = { background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text)', padding: '6px 10px', fontSize: 13 }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', background: 'var(--navy)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
      <select value={rule.field} onChange={handleFieldChange} style={inp}>
        {FIELD_DEFS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
      </select>
      <select value={rule.op} onChange={handleOpChange} style={inp}>
        {validOps.map(op => <option key={op} value={op}>{OP_LABELS[op]}</option>)}
      </select>
      {fd.type === 'select' && (
        <select value={rule.value} onChange={e => handleValueChange(e.target.value)} style={inp}>
          {fd.options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )}
      {fd.type === 'multiselect' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {fd.options.map(o => {
            const selected = Array.isArray(rule.value) && rule.value.includes(o)
            return (
              <button key={o} onClick={() => {
                const cur = Array.isArray(rule.value) ? rule.value : []
                handleValueChange(selected ? cur.filter(v => v !== o) : [...cur, o])
              }} style={{
                padding: '3px 9px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 12, cursor: 'pointer',
                background: selected ? 'var(--gold)' : 'var(--navy2)', color: selected ? '#000' : 'var(--text)',
              }}>{o}</button>
            )
          })}
        </div>
      )}
      {fd.type === 'number' && (
        <input type="number" min={0} value={rule.value} onChange={e => handleValueChange(Number(e.target.value))} style={{ ...inp, width: 80 }} />
      )}
      {fd.type === 'date' && (
        <input type="date" value={rule.value} onChange={e => handleValueChange(e.target.value)} style={inp} />
      )}
      <button onClick={() => onRemove(index)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}>✕</button>
    </div>
  )
}

function SegmentModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [desc, setDesc] = useState(initial?.description || '')
  const [logic, setLogic] = useState(initial?.logic || 'ALL')
  const [rules, setRules] = useState(initial?.rules || [])
  const [preview, setPreview] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function addRule() {
    const fd = FIELD_DEFS[0]
    setRules(r => [...r, { field: fd.key, op: fd.ops[0], value: '' }])
  }

  function updateRule(i, updated) {
    setRules(r => r.map((rule, idx) => idx === i ? updated : rule))
  }

  function removeRule(i) {
    setRules(r => r.filter((_, idx) => idx !== i))
  }

  async function runPreview() {
    setPreviewing(true)
    try {
      const res = await previewSegment({ rules, logic })
      setPreview(res)
    } catch {}
    setPreviewing(false)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Segment name is required'); return }
    setSaving(true)
    try {
      await onSave({ name: name.trim(), description: desc.trim(), rules, logic })
      onClose()
    } catch (e) {
      setError(e.message || 'Save failed')
    }
    setSaving(false)
  }

  const inp = { width: '100%', background: 'var(--navy)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 12px', fontSize: 14, boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--navy2)', borderRadius: 14, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ color: 'var(--gold)', marginBottom: 20 }}>{initial ? 'Edit Segment' : 'New Smart Segment'}</h3>

        <label style={{ display: 'block', color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Segment Name *</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. High-PV Active Members" style={{ ...inp, marginBottom: 14 }} />

        <label style={{ display: 'block', color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Description</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="What is this segment used for?" style={{ ...inp, resize: 'vertical', marginBottom: 18 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>Match:</span>
          {['ALL', 'ANY'].map(l => (
            <button key={l} onClick={() => setLogic(l)} style={{
              padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: logic === l ? 700 : 400,
              background: logic === l ? LOGIC_BADGE[l].bg : 'var(--navy)', color: logic === l ? LOGIC_BADGE[l].color : 'var(--text)',
            }}>{l} rules</button>
          ))}
          <span style={{ color: 'var(--text2)', fontSize: 12 }}>{logic === 'ALL' ? 'Member must match every rule' : 'Member matches at least one rule'}</span>
        </div>

        <div style={{ marginBottom: 12 }}>
          {rules.map((rule, i) => <RuleRow key={i} rule={rule} index={i} onChange={updateRule} onRemove={removeRule} />)}
          <button onClick={addRule} style={{ background: 'transparent', border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--gold)', cursor: 'pointer', padding: '8px 16px', fontSize: 13, width: '100%' }}>
            + Add Rule
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <button onClick={runPreview} disabled={previewing} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', cursor: 'pointer', fontSize: 13 }}>
            {previewing ? 'Previewing…' : '👁 Preview'}
          </button>
          {preview !== null && (
            <span style={{ color: 'var(--text2)', fontSize: 13 }}>
              <strong style={{ color: 'var(--gold)' }}>{preview.memberCount}</strong> member{preview.memberCount !== 1 ? 's' : ''} match
              {preview.members?.length > 0 && `: ${preview.members.map(m => m.name).join(', ')}${preview.memberCount > 5 ? ` +${preview.memberCount - 5} more` : ''}`}
            </span>
          )}
        </div>

        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: '8px 22px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Segment'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MembersDrawer({ segment, onClose }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSegmentMembers(segment.id).then(setMembers).catch(() => setMembers([])).finally(() => setLoading(false))
  }, [segment.id])

  const rankColors = { Platinum: '#e5e4e2', Gold: '#c9a84c', Silver: '#a0a0a0', Bronze: '#cd7f32', Unranked: '#6b7280' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 900, display: 'flex', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 420, background: 'var(--navy2)', height: '100%', overflowY: 'auto', padding: 24 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ color: 'var(--gold)', margin: 0 }}>{segment.name}</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 16 }}>{members.length} member{members.length !== 1 ? 's' : ''} in this segment</p>
        {loading ? <div style={{ color: 'var(--text2)' }}>Loading…</div> : members.map(m => (
          <div key={m.id} style={{ background: 'var(--navy)', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>{m.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: rankColors[m.rank] || '#888' }}>{m.rank}</span>
            </div>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>
              {m.id} · {m.country} · PV {m.pv} · GV {m.gv}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Segments() {
  const navigate = useNavigate()
  const [segments, setSegments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewTarget, setViewTarget] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    getSegments().then(setSegments).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(data) {
    if (editTarget) await updateSegment(editTarget.id, data)
    else await createSegment(data)
    load()
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteSegment(deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const filtered = segments.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalMembers = segments.reduce((acc, s) => acc + s.memberCount, 0)
  const avgSize = segments.length ? Math.round(totalMembers / segments.length) : 0

  const rankColors = { Platinum: '#e5e4e2', Gold: '#c9a84c', Silver: '#a0a0a0', Bronze: '#cd7f32', Unranked: '#6b7280' }

  return (
    <AdminLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ color: 'var(--gold)', margin: 0 }}>🎯 Smart Segments</h2>
            <p style={{ color: 'var(--text2)', fontSize: 13, margin: '4px 0 0' }}>Rule-based member lists for targeted campaigns and announcements</p>
          </div>
          <button onClick={() => { setEditTarget(null); setShowModal(true) }} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#000', fontWeight: 700, cursor: 'pointer' }}>
            + New Segment
          </button>
        </div>

        {/* KPI Strip */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={kpiStyle}>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Total Segments</div>
            <div style={{ color: 'var(--gold)', fontSize: 28, fontWeight: 700 }}>{segments.length}</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Total Member Slots</div>
            <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 700 }}>{totalMembers.toLocaleString()}</div>
            <div style={{ color: 'var(--text2)', fontSize: 11 }}>across all segments (may overlap)</div>
          </div>
          <div style={kpiStyle}>
            <div style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 4 }}>Avg Segment Size</div>
            <div style={{ color: 'var(--text)', fontSize: 28, fontWeight: 700 }}>{avgSize}</div>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search segments…"
            style={{ width: '100%', maxWidth: 360, background: 'var(--navy2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '8px 14px', fontSize: 14, boxSizing: 'border-box' }}
          />
        </div>

        {loading ? (
          <div style={{ color: 'var(--text2)', textAlign: 'center', padding: 60 }}>Loading segments…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div style={{ color: 'var(--text)', fontSize: 16, fontWeight: 600 }}>No segments yet</div>
            <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 6 }}>Create your first smart segment to target campaigns.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(seg => {
              const lb = LOGIC_BADGE[seg.logic] || LOGIC_BADGE.ALL
              return (
                <div key={seg.id} style={{ background: 'var(--navy2)', borderRadius: 12, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 16 }}>{seg.name}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: lb.bg, color: lb.color, fontSize: 11, fontWeight: 700 }}>{lb.text}</span>
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: 'var(--navy3)', color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>
                          {seg.memberCount} member{seg.memberCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {seg.description && <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 8 }}>{seg.description}</div>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(seg.rules || []).map((rule, i) => (
                          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--navy)', color: 'var(--text2)', border: '1px solid var(--border)' }}>
                            {ruleDisplay(rule)}
                          </span>
                        ))}
                        {(!seg.rules || seg.rules.length === 0) && (
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>No rules (matches all members)</span>
                        )}
                      </div>
                      <div style={{ color: 'var(--text2)', fontSize: 11, marginTop: 8 }}>
                        Updated {new Date(seg.updatedAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => setViewTarget(seg)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                        👥 Members
                      </button>
                      <button onClick={() => navigate('/admin/campaigns')} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13 }}>
                        📧 Campaign
                      </button>
                      <button onClick={() => { setEditTarget(seg); setShowModal(true) }} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--gold)', cursor: 'pointer', fontSize: 13 }}>
                        ✏️ Edit
                      </button>
                      <button onClick={() => setDeleteTarget(seg)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #f87171', background: 'transparent', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Create / Edit Modal */}
        {showModal && (
          <SegmentModal
            initial={editTarget}
            onSave={handleSave}
            onClose={() => { setShowModal(false); setEditTarget(null) }}
          />
        )}

        {/* Delete Confirm */}
        {deleteTarget && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <div style={{ background: 'var(--navy2)', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%' }}>
              <h3 style={{ color: '#f87171', marginBottom: 12 }}>Delete Segment?</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
                "{deleteTarget.name}" will be permanently deleted. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setDeleteTarget(null)} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDelete} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Members Drawer */}
        {viewTarget && <MembersDrawer segment={viewTarget} onClose={() => setViewTarget(null)} />}
      </div>
    </AdminLayout>
  )
}
