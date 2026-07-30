import { useState, useEffect, useMemo } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getInventory, adjustStock, getStockMovements } from '../../api/mlmApi'

const STATUS_META = {
  in_stock:    { label: 'In Stock',    cls: 'bg-green-900 text-green-300' },
  low_stock:   { label: 'Low Stock',   cls: 'bg-amber-900 text-amber-300' },
  out_of_stock:{ label: 'Out of Stock',cls: 'bg-red-900 text-red-300' },
}

const TYPE_META = {
  sale:       { label: 'Sale',       cls: 'bg-blue-900 text-blue-300',   sign: '-' },
  restock:    { label: 'Restock',    cls: 'bg-green-900 text-green-300', sign: '+' },
  adjustment: { label: 'Adjustment', cls: 'bg-purple-900 text-purple-300',sign: '±' },
  writeoff:   { label: 'Write-off',  cls: 'bg-red-900 text-red-300',    sign: '-' },
}

function Badge({ text, cls }) {
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{text}</span>
}

function Kpi({ label, value, sub, alert }) {
  return (
    <div className={`rounded-xl p-4 border ${alert ? 'border-red-700 bg-red-950' : 'border-white/10 bg-white/5'}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${alert ? 'text-red-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}

function AdjustModal({ item, onClose, onDone }) {
  const [type, setType] = useState('restock')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')
  const [batch, setBatch] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault()
    const n = parseInt(qty, 10)
    if (!n || n <= 0) { setErr('Enter a positive quantity.'); return }
    if (!note.trim()) { setErr('Note is required.'); return }
    setErr(''); setLoading(true)
    try {
      await adjustStock(item.id, type, n, note.trim(), batch.trim() || null)
      onDone()
    } catch(ex) {
      setErr(ex.message || 'Failed to adjust stock.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6">
        <h3 className="text-white font-bold text-lg mb-1">Adjust Stock</h3>
        <p className="text-gray-400 text-sm mb-4">{item.name} · {item.sku} · Current: <span className="text-white font-semibold">{item.stock} units</span></p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1">Adjustment Type</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="restock">Receive Shipment (add stock)</option>
              <option value="adjustment">Manual Adjustment (add or remove)</option>
              <option value="writeoff">Write-Off (damage / expiry)</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1">Quantity (units)</label>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="e.g. 100" />
            {type === 'adjustment' && <p className="text-gray-500 text-xs mt-1">Will be added to stock (use Write-Off to remove).</p>}
          </div>
          {type === 'restock' && (
            <div>
              <label className="block text-gray-400 text-xs mb-1">Batch / Lot Number <span className="text-gray-600">(optional)</span></label>
              <input type="text" value={batch} onChange={e => setBatch(e.target.value)}
                className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                placeholder="e.g. NV-2026-B015" />
            </div>
          )}
          <div>
            <label className="block text-gray-400 text-xs mb-1">Note <span className="text-red-400">*</span></label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
              placeholder="Brief description of reason" />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition disabled:opacity-50">
              {loading ? 'Saving…' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminInventory() {
  const [inventory, setInventory]   = useState([])
  const [movements, setMovements]   = useState([])
  const [tab, setTab]               = useState('stock')
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [productFilter, setProduct] = useState('all')
  const [loading, setLoading]       = useState(true)
  const [adjustItem, setAdjustItem] = useState(null)
  const [page, setPage]             = useState(1)
  const PER_PAGE = 20

  async function load() {
    setLoading(true)
    try {
      const [inv, moves] = await Promise.all([getInventory(), getStockMovements()])
      setInventory(inv)
      setMovements(moves)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const kpis = useMemo(() => {
    const total      = inventory.length
    const lowStock   = inventory.filter(i => i.status === 'low_stock').length
    const outOfStock = inventory.filter(i => i.status === 'out_of_stock').length
    const totalValue = inventory.reduce((s, i) => s + i.stock * i.unitCost, 0)
    return { total, lowStock, outOfStock, totalValue }
  }, [inventory])

  const filteredInv = useMemo(() => {
    return inventory.filter(i => {
      const matchSearch = !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        i.category.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || i.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [inventory, search, statusFilter])

  const filteredMoves = useMemo(() => {
    return movements.filter(m => {
      const matchProduct = productFilter === 'all' || String(m.productId) === productFilter
      const matchType    = typeFilter === 'all' || m.type === typeFilter
      return matchProduct && matchType
    })
  }, [movements, productFilter, typeFilter])

  const movesPage = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filteredMoves.slice(start, start + PER_PAGE)
  }, [filteredMoves, page])

  const totalPages = Math.max(1, Math.ceil(filteredMoves.length / PER_PAGE))

  function exportCSV() {
    const rows = [['SKU','Name','Category','Stock','Reorder Point','Reorder Qty','Unit Cost (NOK)','Total Value (NOK)','Status']]
    filteredInv.forEach(i => rows.push([
      i.sku, i.name, i.category, i.stock, i.reorderPoint, i.reorderQty, i.unitCost, i.stock * i.unitCost, STATUS_META[i.status].label
    ]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = `nv-inventory-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  function exportMovesCSV() {
    const rows = [['Date','SKU','Product','Type','Delta','New Balance','Note']]
    filteredMoves.forEach(m => rows.push([m.date, m.sku, m.productName, m.type, m.delta > 0 ? `+${m.delta}` : m.delta, m.newBalance, `"${m.note}"`]))
    const csv = rows.map(r => r.join(',')).join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}))
    a.download = `nv-stock-movements-${new Date().toISOString().slice(0,10)}.csv`; a.click()
  }

  const stockCellCls = (item) => {
    if (item.status === 'out_of_stock') return 'text-red-400 font-bold'
    if (item.status === 'low_stock')    return 'text-amber-400 font-bold'
    return 'text-white'
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
            <p className="text-gray-400 text-sm mt-1">Stock levels, reorder alerts, and movement log for all products</p>
          </div>
          <button onClick={() => { load() }}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm hover:bg-white/10 transition">
            ↻ Refresh
          </button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Total SKUs"         value={kpis.total}      sub="active product lines" />
          <Kpi label="Low Stock"          value={kpis.lowStock}   sub="below reorder point"  alert={kpis.lowStock > 0} />
          <Kpi label="Out of Stock"       value={kpis.outOfStock} sub="needs restocking now" alert={kpis.outOfStock > 0} />
          <Kpi label="Total Inventory Value" value={`NOK ${kpis.totalValue.toLocaleString()}`} sub="at cost price" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-white/10">
          {[['stock','📦 Stock Levels'],['movements','📋 Movement Log']].map(([id,label]) => (
            <button key={id} onClick={() => { setTab(id); setPage(1) }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${tab === id ? 'bg-white/10 text-white border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Stock Levels Tab */}
        {tab === 'stock' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product or SKU…"
                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm w-56 placeholder-gray-500 focus:outline-none focus:border-teal-500" />
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="all">All Statuses</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
              <button onClick={exportCSV}
                className="ml-auto px-3 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition">
                ⬇ Export CSV
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading inventory…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left py-3 pr-4">Product</th>
                      <th className="text-left py-3 pr-4">SKU</th>
                      <th className="text-right py-3 pr-4">Stock</th>
                      <th className="text-right py-3 pr-4">Reorder At</th>
                      <th className="text-right py-3 pr-4">Reorder Qty</th>
                      <th className="text-right py-3 pr-4">Unit Cost</th>
                      <th className="text-right py-3 pr-4">Total Value</th>
                      <th className="text-center py-3 pr-4">Status</th>
                      <th className="text-center py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInv.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-10 text-gray-500">No products match your filter.</td></tr>
                    )}
                    {filteredInv.map(item => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/3 transition">
                        <td className="py-3 pr-4">
                          <p className="text-white font-medium">{item.name}</p>
                          <p className="text-gray-500 text-xs">{item.category}</p>
                        </td>
                        <td className="py-3 pr-4 text-gray-400 font-mono text-xs">{item.sku}</td>
                        <td className={`py-3 pr-4 text-right font-mono ${stockCellCls(item)}`}>
                          {item.stock}
                          {item.status !== 'in_stock' && (
                            <span className="ml-1">{item.status === 'out_of_stock' ? '⛔' : '⚠️'}</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-400">{item.reorderPoint}</td>
                        <td className="py-3 pr-4 text-right text-gray-400">{item.reorderQty}</td>
                        <td className="py-3 pr-4 text-right text-gray-300">NOK {item.unitCost}</td>
                        <td className="py-3 pr-4 text-right text-gray-300">NOK {(item.stock * item.unitCost).toLocaleString()}</td>
                        <td className="py-3 pr-4 text-center">
                          <Badge text={STATUS_META[item.status].label} cls={STATUS_META[item.status].cls} />
                        </td>
                        <td className="py-3 text-center">
                          <button onClick={() => setAdjustItem(item)}
                            className="px-3 py-1 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-medium transition">
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {filteredInv.length > 0 && (
                    <tfoot>
                      <tr className="border-t border-white/20">
                        <td colSpan={6} className="py-3 text-gray-400 font-medium text-right pr-4">Total (filtered):</td>
                        <td className="py-3 text-white font-bold text-right pr-4">
                          NOK {filteredInv.reduce((s,i) => s + i.stock * i.unitCost, 0).toLocaleString()}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* Low-stock alert box */}
            {!loading && (kpis.lowStock > 0 || kpis.outOfStock > 0) && (
              <div className="rounded-xl border border-amber-700 bg-amber-950/40 p-4">
                <p className="text-amber-300 font-semibold text-sm mb-2">⚠️ Reorder Required</p>
                <ul className="text-sm space-y-1">
                  {inventory.filter(i => i.status !== 'in_stock').map(i => (
                    <li key={i.id} className="text-gray-300 flex items-center gap-2">
                      <Badge text={STATUS_META[i.status].label} cls={STATUS_META[i.status].cls} />
                      <span className="font-medium">{i.name}</span>
                      <span className="text-gray-500">— {i.stock} units left, reorder {i.reorderQty} units</span>
                      <button onClick={() => setAdjustItem(i)}
                        className="ml-auto px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs transition">
                        Receive
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Movement Log Tab */}
        {tab === 'movements' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <select value={productFilter} onChange={e => { setProduct(e.target.value); setPage(1) }}
                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="all">All Products</option>
                {inventory.map(i => (
                  <option key={i.id} value={String(i.productId)}>{i.name}</option>
                ))}
              </select>
              <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
                className="bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
                <option value="all">All Types</option>
                <option value="sale">Sale</option>
                <option value="restock">Restock</option>
                <option value="adjustment">Adjustment</option>
                <option value="writeoff">Write-off</option>
              </select>
              <span className="text-gray-500 text-sm">{filteredMoves.length} entries</span>
              <button onClick={exportMovesCSV}
                className="ml-auto px-3 py-2 rounded-lg border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition">
                ⬇ Export CSV
              </button>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading movements…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left py-3 pr-4">Date</th>
                      <th className="text-left py-3 pr-4">SKU</th>
                      <th className="text-left py-3 pr-4">Product</th>
                      <th className="text-center py-3 pr-4">Type</th>
                      <th className="text-right py-3 pr-4">Delta</th>
                      <th className="text-right py-3 pr-4">Balance After</th>
                      <th className="text-left py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movesPage.length === 0 && (
                      <tr><td colSpan={7} className="text-center py-10 text-gray-500">No movements match your filter.</td></tr>
                    )}
                    {movesPage.map(m => {
                      const tm = TYPE_META[m.type] || { label: m.type, cls: 'bg-gray-700 text-gray-300', sign: '' }
                      const isPositive = m.delta > 0
                      return (
                        <tr key={m.id} className="border-b border-white/5 hover:bg-white/3 transition">
                          <td className="py-3 pr-4 text-gray-400">{m.date}</td>
                          <td className="py-3 pr-4 text-gray-500 font-mono text-xs">{m.sku}</td>
                          <td className="py-3 pr-4 text-white">{m.productName}</td>
                          <td className="py-3 pr-4 text-center"><Badge text={tm.label} cls={tm.cls} /></td>
                          <td className={`py-3 pr-4 text-right font-mono font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{m.delta}
                          </td>
                          <td className="py-3 pr-4 text-right text-gray-300 font-mono">{m.newBalance}</td>
                          <td className="py-3 text-gray-400 text-xs max-w-xs truncate">{m.note}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                  className="px-3 py-1 rounded border border-white/10 text-gray-300 text-sm disabled:opacity-40 hover:bg-white/5 transition">← Prev</button>
                <span className="text-gray-400 text-sm">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                  className="px-3 py-1 rounded border border-white/10 text-gray-300 text-sm disabled:opacity-40 hover:bg-white/5 transition">Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {adjustItem && (
        <AdjustModal
          item={adjustItem}
          onClose={() => setAdjustItem(null)}
          onDone={() => { setAdjustItem(null); load() }}
        />
      )}
    </AdminLayout>
  )
}
