/**
 * Arctico MLM API client.
 * Set VITE_MLM_API_URL and VITE_MLM_API_KEY when the backend is deployed.
 * Until then every call resolves with mock data from src/data/mock.js.
 */
import {
  USERS, COMMISSIONS, WALLET_TXS, TREE_DATA,
  ADMIN_MEMBERS, PAYOUT_QUEUE, ORDERS, COMMISSION_RUNS, PRODUCTS, PRODUCT_REVIEWS, ADMIN_ORDERS,
} from '../data/mock'

const BASE = import.meta.env.VITE_MLM_API_URL || ''
const KEY  = import.meta.env.VITE_MLM_API_KEY  || ''

const MOCK = !BASE

let AUTH_TOKEN = ''
export function setAuthToken(token) { AUTH_TOKEN = token }

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json', 'x-api-key': KEY }
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'API error')
  return json.data
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(email, password) {
  if (MOCK) {
    const found = USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Invalid email or password')
    const { password: _pw, ...safe } = found
    return safe
  }
  const data = await request('POST', '/v1/mlm/auth/login', { email, password })
  if (data.token) setAuthToken(data.token)
  return {
    userId:   data.user_id,
    email:    data.email,
    name:     data.name,
    memberId: data.member_id,
    role:     data.role,
    rank:     data.rank     || 'Bronze',
    pv:       data.pv       || 0,
    leftGV:   data.left_gv  || 0,
    rightGV:  data.right_gv || 0,
  }
}

export async function forgotPassword(email) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 700))
    const found = USERS.find(u => u.email === email)
    if (!found) return { sent: true }
    return { sent: true }
  }
  return request('POST', '/v1/mlm/auth/forgot-password', { email })
}

export async function resetPassword(token, newPassword) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 700))
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/reset-password', { token, password: newPassword })
}

// ── Genealogy ────────────────────────────────────────────────────────────────

export async function enrollMember({ userId, planType = 'binary', sponsorUserId, leg }) {
  if (MOCK) return { node: { id: userId, plan_type: planType, sponsor_user_id: sponsorUserId, leg } }
  return request('POST', '/v1/mlm/genealogy/enroll', { user_id: userId, plan_type: planType, sponsor_user_id: sponsorUserId, leg })
}

export async function getNode(id) {
  if (MOCK) return TREE_DATA
  return request('GET', `/v1/mlm/genealogy/node/${id}`)
}

export async function getNodeByUser(userId) {
  if (MOCK) return { node: { id: userId, user_id: userId, plan_type: 'binary', active: true } }
  return request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
}

export async function getTree(rootNodeId, { tree = 'placement', depth = 10, plan_type = 'binary' } = {}) {
  if (MOCK) return {
    root: rootNodeId, tree, depth, count: 1, plan_type,
    nodes: [{ id: rootNodeId, user_id: 'mock', plan_type, sponsor_id: null, placement_parent_id: null, leg: null, active: false, depth: 0 }]
  }
  return request('GET', `/v1/mlm/genealogy/tree/${rootNodeId}?tree=${tree}&depth=${depth}&plan_type=${plan_type}`)
}

export async function getUpline(id, tree = 'placement') {
  if (MOCK) return { upline: [] }
  return request('GET', `/v1/mlm/genealogy/upline/${id}?tree=${tree}`)
}

// ── Volume ───────────────────────────────────────────────────────────────────

export async function postVolumeEvent({ userId, planType = 'binary', pv, bv, orderId, sourceProject = 'nordic-vitals' }) {
  if (MOCK) return { id: 'mock-vol-' + Date.now(), inserted: true }
  return request('POST', '/v1/mlm/volume/events', {
    user_id: userId, plan_type: planType, pv, bv,
    currency: 'MLMT', source_project: sourceProject, order_id: orderId,
  })
}

// ── Transactions (member) ────────────────────────────────────────────────────

export async function getUserTransactions(userId) {
  if (MOCK) return {
    transactions: WALLET_TXS.map(tx => ({
      event_type: tx.debit ? 'withdrawal' : 'bonus_credit',
      amount: tx.credit || tx.debit,
      direction: tx.debit ? 'debit' : 'credit',
      currency: 'MLMT',
      user_id: userId,
      description: tx.desc,
      created_at: tx.date,
      balance: tx.balance,
    }))
  }
  return request('GET', `/v1/mlm/transactions/user/${userId}`)
}

// ── Commissions (member) — shape TBD from Arctico; using mock for now ────────

export async function getCommissions() {
  if (MOCK) return { commissions: COMMISSIONS }
  return request('GET', '/v1/mlm/commissions')
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminTransactions({ currency = 'MLMT', limit = 50 } = {}) {
  if (MOCK) return {
    transactions: WALLET_TXS.map(tx => ({
      event_type: tx.debit ? 'withdrawal' : 'bonus_credit',
      amount: tx.credit || tx.debit,
      direction: tx.debit ? 'debit' : 'credit',
      currency,
      user_id: 'NV-10042',
      description: tx.desc,
      created_at: tx.date,
    }))
  }
  return request('GET', `/v1/mlm/admin/transactions?currency=${currency}&limit=${limit}`)
}

export async function getAdminSummary({ currency = 'MLMT' } = {}) {
  if (MOCK) return { total_supply: 100_000_000, holders: 12, total_bonus_paid: 3_133 }
  return request('GET', `/v1/mlm/admin/summary?currency=${currency}`)
}

export async function getAdminMembers() {
  if (MOCK) return { members: ADMIN_MEMBERS }
  return request('GET', '/v1/mlm/admin/members')
}

export async function getPayoutQueue() {
  if (MOCK) return { queue: PAYOUT_QUEUE }
  return request('GET', '/v1/mlm/admin/payouts/queue')
}

// ── Direct Downline (sponsor tree, depth 1) ───────────────────────────────────

export async function getDirectDownline(userId) {
  if (MOCK) return {
    recruits: ADMIN_MEMBERS
      .filter(m => m.sponsor === userId)
      .map(m => ({ id: m.id, name: m.name, joined: m.joined, rank: m.rank, status: m.status }))
  }
  const nodeData = await request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
  const nodeId = nodeData?.node?.id
  if (!nodeId) return { recruits: [] }
  const treeData = await request('GET', `/v1/mlm/genealogy/tree/${nodeId}?tree=sponsor&depth=1`)
  return {
    recruits: (treeData?.nodes || [])
      .filter(n => n.depth === 1)
      .map(n => ({ id: n.user_id, name: n.user_id, joined: n.created_at, rank: n.rank || 'Unranked', status: n.active ? 'Active' : 'Inactive' }))
  }
}

// ── VP Products (storefront catalog) ─────────────────────────────────────────

export async function getVpProducts() {
  if (MOCK) return { products: PRODUCTS }
  return request('GET', '/api/viking-peptides/products')
}

// ── Orders (member product orders that generate PV) ──────────────────────────

export async function getOrders(userId) {
  if (MOCK) return { orders: ORDERS }
  return request('GET', `/api/viking-peptides/orders?user_id=${userId}`)
}

export async function placeOrder({ userId, items, shippingAddress, orderRef }) {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  const pv    = items.reduce((s, i) => s + (i.pv || i.price) * i.qty, 0)
  if (MOCK) return { order: { id: orderRef, status: 'pending', total, pv } }
  return request('POST', '/api/viking-peptides/orders', {
    user_id: userId, items, shipping_address: shippingAddress, order_ref: orderRef, total, pv,
  })
}

// ── Earnings (PENDING — endpoint not yet shipped by Arctico) ─────────────────
// Returns null in mock mode so the caller falls back to its own mock data.
// When GET /v1/mlm/admin/earnings/:userId ships, this will return live data.
export async function getEarnings(userId, { planType = 'binary' } = {}) {
  if (MOCK) return null
  return request('GET', `/v1/mlm/admin/earnings/${userId}?plan_type=${planType}`)
}

// ── Commission Runs ───────────────────────────────────────────────────────────

export async function getCommissionRuns({ limit = 20 } = {}) {
  if (MOCK) return { runs: COMMISSION_RUNS }
  return request('GET', `/v1/mlm/admin/commission-runs?limit=${limit}`)
}

export async function triggerCommissionRun({ type = 'manual' } = {}) {
  if (MOCK) return { run_id: `#mock-${Date.now()}`, status: 'Running', type }
  return request('POST', '/v1/mlm/admin/commission-runs/trigger', { type })
}

// ── Admin Settings ────────────────────────────────────────────────────────────

export async function getAdminSettings() {
  if (MOCK) return {
    company_name: 'Nordic Vitals AS',
    currency: 'NOK',
    timezone: 'Europe/Oslo',
    language: 'Norwegian',
    notifications: { new_member: true, rank_change: true, commission_run: true, sms_withdrawal: false },
  }
  return request('GET', '/v1/mlm/admin/settings')
}

export async function saveAdminSettings(settings) {
  if (MOCK) return { ok: true }
  return request('POST', '/v1/mlm/admin/settings', settings)
}

// ── Plan Config ───────────────────────────────────────────────────────────────

export async function getPlanConfig() {
  if (MOCK) return {
    ranks: [
      { rank: 'Unranked', min_pv: 0,    min_left_gv: 0,     min_right_gv: 0,     pairing_cap: 100,  sponsor_bonus: 5,  x_factor_cap: 35 },
      { rank: 'Bronze',   min_pv: 100,  min_left_gv: 500,   min_right_gv: 500,   pairing_cap: 500,  sponsor_bonus: 7,  x_factor_cap: 35 },
      { rank: 'Silver',   min_pv: 300,  min_left_gv: 2000,  min_right_gv: 2000,  pairing_cap: 1500, sponsor_bonus: 10, x_factor_cap: 35 },
      { rank: 'Gold',     min_pv: 500,  min_left_gv: 5000,  min_right_gv: 5000,  pairing_cap: 3000, sponsor_bonus: 12, x_factor_cap: 35 },
      { rank: 'Platinum', min_pv: 1000, min_left_gv: 15000, min_right_gv: 15000, pairing_cap: 8000, sponsor_bonus: 15, x_factor_cap: 35 },
    ],
    levels: [
      { level: 'L1', rate: 5 }, { level: 'L2', rate: 3 }, { level: 'L3', rate: 2 },
      { level: 'L4', rate: 1 }, { level: 'L5', rate: 0.5 },
    ],
    x_factor_cap: 35,
    cycle_period: 'Weekly',
    payout_day: 'Sunday',
  }
  return request('GET', '/v1/mlm/admin/plan-config')
}

export async function savePlanConfig(config) {
  if (MOCK) return { ok: true }
  return request('POST', '/v1/mlm/admin/plan-config', config)
}

// ── Member Profile ────────────────────────────────────────────────────────────

export async function updateProfile(userId, { name, email, phone, country }) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/users/${userId}/profile`, { name, email, phone, country })
}

export async function updatePassword(userId, { current_password, new_password }) {
  if (MOCK) return { ok: true }
  return request('POST', `/v1/mlm/users/${userId}/password`, { current_password, new_password })
}

// ── Admin Reports ─────────────────────────────────────────────────────────────

export async function getAdminTopEarners({ limit = 5, period = 'monthly' } = {}) {
  if (MOCK) return {
    earners: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  total_commissions: 2340 },
      { user_id: 'NV-10087', name: 'Mia Andersen',  total_commissions: 1890 },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   total_commissions: 1440 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  total_commissions: 980  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     total_commissions: 670  },
    ].slice(0, limit)
  }
  return request('GET', `/v1/mlm/admin/reports/top-earners?limit=${limit}&period=${period}`)
}

export async function getAdminWeeklySignups({ weeks = 8 } = {}) {
  if (MOCK) return {
    weeks: [
      { week: 'May 26', count: 12 },
      { week: 'Jun 2',  count: 18 },
      { week: 'Jun 9',  count: 9  },
      { week: 'Jun 16', count: 24 },
      { week: 'Jun 23', count: 15 },
      { week: 'Jun 30', count: 31 },
      { week: 'Jul 7',  count: 22 },
      { week: 'Jul 13', count: 14 },
    ].slice(-weeks)
  }
  return request('GET', `/v1/mlm/admin/reports/weekly-signups?weeks=${weeks}`)
}

export async function getAdminNetworkVolume() {
  if (MOCK) return { network_pv: 42800, commissions_paid_last_run: 18400 }
  return request('GET', '/v1/mlm/admin/reports/network-volume')
}

// ── Product Reviews ───────────────────────────────────────────────────────────

export async function getProductReviews(productId) {
  if (MOCK) return { reviews: PRODUCT_REVIEWS[productId] || [] }
  return request('GET', `/api/viking-peptides/products/${productId}/reviews`)
}

export async function submitProductReview(productId, { rating, comment }) {
  if (MOCK) return { ok: true }
  return request('POST', `/api/viking-peptides/products/${productId}/reviews`, { rating, comment })
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard({ period = 'monthly' } = {}) {
  if (MOCK) return {
    period,
    earners: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   total_mlmt: 2340, change: 0  },
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   total_mlmt: 1890, change: 1  },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   total_mlmt: 1440, change: -1 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', total_mlmt: 980,  change: 2  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', total_mlmt: 670,  change: 0  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', total_mlmt: 510,  change: 3  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', total_mlmt: 340,  change: -2 },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', total_mlmt: 180,  change: 1  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', total_mlmt: 120,  change: -1 },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', total_mlmt: 75,   change: 0  },
    ],
    recruiters: [
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   recruits: 8,  change: 2  },
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   recruits: 6,  change: 0  },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   recruits: 5,  change: 1  },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', recruits: 4,  change: -1 },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', recruits: 3,  change: 0  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', recruits: 3,  change: 4  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', recruits: 2,  change: 0  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', recruits: 1,  change: -2 },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', recruits: 1,  change: 1  },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', recruits: 0,  change: 0  },
    ],
    network: [
      { user_id: 'NV-10042', name: 'Lars Eriksen',  rank: 'Silver',   gv: 3050, pv: 320 },
      { user_id: 'NV-10087', name: 'Mia Andersen',  rank: 'Bronze',   gv: 1240, pv: 180 },
      { user_id: 'NV-10230', name: 'Sigrid Voss',   rank: 'Bronze',   gv: 340,  pv: 120 },
      { user_id: 'NV-10091', name: 'Erik Solberg',  rank: 'Unranked', gv: 600,  pv: 90  },
      { user_id: 'NV-10241', name: 'Olaf Berg',     rank: 'Unranked', gv: 50,   pv: 50  },
      { user_id: 'NV-10122', name: 'Anna Lund',     rank: 'Unranked', gv: 55,   pv: 30  },
      { user_id: 'NV-10102', name: 'Kari Holm',     rank: 'Unranked', gv: 60,   pv: 60  },
      { user_id: 'NV-10215', name: 'Bjorn Lie',     rank: 'Unranked', gv: 25,   pv: 25  },
      { user_id: 'NV-10201', name: 'Per Nilsen',    rank: 'Unranked', gv: 20,   pv: 20  },
      { user_id: 'NV-10118', name: 'Tor Bakke',     rank: 'Unranked', gv: 45,   pv: 45  },
    ],
  }
  return request('GET', `/v1/mlm/leaderboard?period=${period}`)
}

export async function verifyEmail(token) {
  // POST /v1/mlm/auth/verify-email  { token }
  // Returns { success: true, user_id } or throws
  if (!token) throw new Error('Missing verification token')
  try {
    return await request('POST', '/v1/mlm/auth/verify-email', { token })
  } catch {
    // Mock: any non-empty token succeeds
    if (token === 'INVALID') throw new Error('Invalid or expired token')
    return { success: true }
  }
}

export async function getNotifications(userId) {
  // GET /v1/mlm/members/:userId/notifications
  const MOCK_NOTIFS = [
    { id: 'n1', type: 'rank_up',    read: false, ts: '2026-07-25T08:00:00Z', title: 'Rank upgrade!',            body: 'Congratulations — you\'ve advanced to Silver rank.' },
    { id: 'n2', type: 'commission', read: false, ts: '2026-07-24T15:30:00Z', title: 'Commission credited',      body: '87.50 MLMT pairing bonus added to your wallet.' },
    { id: 'n3', type: 'referral',   read: false, ts: '2026-07-24T11:10:00Z', title: 'New team member',          body: 'Lars Eriksen joined your team on your left leg.' },
    { id: 'n4', type: 'commission', read: true,  ts: '2026-07-23T09:15:00Z', title: 'Weekly commission run',    body: 'Commission run #14 completed. 120.00 MLMT credited.' },
    { id: 'n5', type: 'system',     read: true,  ts: '2026-07-22T14:00:00Z', title: 'Platform maintenance',     body: 'Scheduled maintenance on Jul 23 03:00–04:00 UTC.' },
    { id: 'n6', type: 'referral',   read: true,  ts: '2026-07-21T17:45:00Z', title: 'New team member',          body: 'Mia Andersen joined your team on your right leg.' },
    { id: 'n7', type: 'system',     read: true,  ts: '2026-07-20T10:00:00Z', title: 'New products available',   body: '3 new products added to the Nordic Vitals catalogue.' },
    { id: 'n8', type: 'commission', read: true,  ts: '2026-07-17T09:15:00Z', title: 'Weekly commission run',    body: 'Commission run #13 completed. 95.00 MLMT credited.' },
  ]
  try {
    return await request('GET', `/v1/mlm/members/${userId}/notifications`)
  } catch {
    return MOCK_NOTIFS
  }
}

export async function markNotificationRead(userId, notifId) {
  // PATCH /v1/mlm/members/:userId/notifications/:notifId  { read: true }
  try {
    return await request('PATCH', `/v1/mlm/members/${userId}/notifications/${notifId}`, { read: true })
  } catch {
    return { success: true }
  }
}

export async function markAllNotificationsRead(userId) {
  // POST /v1/mlm/members/:userId/notifications/read-all
  try {
    return await request('POST', `/v1/mlm/members/${userId}/notifications/read-all`, {})
  } catch {
    return { success: true }
  }
}

// ── Admin Product Management ──────────────────────────────────────────────────

let _adminProducts = null

export async function getAdminProducts() {
  if (MOCK) {
    if (!_adminProducts) {
      _adminProducts = PRODUCTS.map(p => ({ ...p, active: true, stock: Math.floor(Math.random() * 200) + 20 }))
    }
    return { products: _adminProducts }
  }
  return request('GET', '/api/viking-peptides/admin/products')
}

export async function createProduct(product) {
  if (MOCK) {
    const newProduct = {
      ...product,
      id: Date.now(),
      active: true,
      stock: product.stock || 0,
    }
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = [newProduct, ..._adminProducts]
    return { product: newProduct }
  }
  return request('POST', '/api/viking-peptides/admin/products', product)
}

export async function updateProduct(id, updates) {
  if (MOCK) {
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = _adminProducts.map(p => p.id === id ? { ...p, ...updates } : p)
    return { product: _adminProducts.find(p => p.id === id) }
  }
  return request('PUT', `/api/viking-peptides/admin/products/${id}`, updates)
}

export async function toggleProductActive(id) {
  if (MOCK) {
    if (!_adminProducts) await getAdminProducts()
    _adminProducts = _adminProducts.map(p => p.id === id ? { ...p, active: !p.active } : p)
    return { product: _adminProducts.find(p => p.id === id) }
  }
  return request('POST', `/api/viking-peptides/admin/products/${id}/toggle`, {})
}

// ── Admin Order Management ────────────────────────────────────────────────────

let _adminOrders = null

export async function getAdminOrders({ status, search, limit = 200 } = {}) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    let result = _adminOrders
    if (status && status !== 'all') result = result.filter(o => o.status === status)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(o =>
        o.id.toLowerCase().includes(q) ||
        o.member.toLowerCase().includes(q) ||
        o.memberId.toLowerCase().includes(q)
      )
    }
    return { orders: result.slice(0, limit) }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  if (limit) params.set('limit', String(limit))
  return request('GET', `/api/viking-peptides/admin/orders?${params}`)
}

export async function updateOrderStatus(orderId, status) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    _adminOrders = _adminOrders.map(o => o.id === orderId ? { ...o, status } : o)
    return { order: _adminOrders.find(o => o.id === orderId) }
  }
  return request('PATCH', `/api/viking-peptides/admin/orders/${orderId}`, { status })
}

// ── Withdrawals ───────────────────────────────────────────────────────────────

let _withdrawalSeq = 91

export async function requestWithdrawal(userId, { amount, method = 'Bank Transfer', address = '' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const id = `W-00${++_withdrawalSeq}`
    return { payout_id: id, status: 'pending', amount, method }
  }
  return request('POST', '/v1/mlm/withdrawals', { user_id: userId, amount, method, address })
}

export async function approveWithdrawal(payoutId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { payout_id: payoutId, status: 'approved' }
  }
  return request('PATCH', `/v1/mlm/withdrawals/${payoutId}/approve`)
}

export async function rejectWithdrawal(payoutId, reason = '') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { payout_id: payoutId, status: 'rejected' }
  }
  return request('PATCH', `/v1/mlm/withdrawals/${payoutId}/reject`, { reason })
}
