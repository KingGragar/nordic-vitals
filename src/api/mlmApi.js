/**
 * Arctico MLM API client.
 * Set VITE_MLM_API_URL and VITE_MLM_API_KEY when the backend is deployed.
 * Until then every call resolves with mock data from src/data/mock.js.
 */
import {
  USERS, COMMISSIONS, WALLET_TXS, TREE_DATA,
  ADMIN_MEMBERS, PAYOUT_QUEUE, ORDERS, COMMISSION_RUNS, PRODUCTS, PRODUCT_REVIEWS, ADMIN_ORDERS, ANNOUNCEMENTS, AUDIT_LOG, SUPPORT_TICKETS, AUTOSHIPS, RESOURCES, PROMO_CODES, REFERRAL_STATS, EMAIL_TEMPLATES,
  TOKEN_STATS, TOKEN_EVENTS, RANK_HISTORY, ANALYTICS_DATA, TRAINING_MODULES, EVENTS, EMAIL_CAMPAIGNS, KYC_SUBMISSIONS, NETWORK_ANALYTICS, LOYALTY_DATA,
  INVENTORY, STOCK_MOVEMENTS, ADMIN_NOTIFICATIONS, FINANCIAL_DATA, ACTIVITY_LOG, ACTIVITY_GOALS,
  BUNDLES,
  PRODUCT_LOOKUP, ADMIN_ORDER_NOTES,
  CHALLENGES, CHALLENGE_LEADERBOARDS,
  EXCHANGE_RATES,
  BANNERS,
  CONVERSATIONS,
  DIRECT_MESSAGES,
  SOCIAL_EVENTS,
  SYSTEM_STATUS,
  INCIDENT_LOG,
  CERTIFICATES,
  RETAIL_CUSTOMERS,
  RETAIL_CUSTOMER_ORDERS,
  PAYMENT_METHODS,
  FAST_START_TIERS,
  FAST_START_PROGRESS,
  FAST_START_LEADERBOARD,
  COMMISSION_APPEALS,
  RETURN_REQUESTS,
  GDPR_REQUESTS,
  BLOG_POSTS,
} from '../data/mock'

const MEMBER_STATUS_OVERRIDE = {}

const BASE = import.meta.env.VITE_MLM_API_URL || ''
const KEY  = import.meta.env.VITE_MLM_API_KEY  || ''

const MOCK = !BASE

let AUTH_TOKEN = ''
export function setAuthToken(token) { AUTH_TOKEN = token }

// Tracks 2FA enabled state per userId in mock mode
const _mock2FA = {}
// Tracks pending login (userId awaiting 2FA) in mock mode
let _mock2FAPendingUser = null

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
    if (_mock2FA[found.userId]) {
      _mock2FAPendingUser = found
      return { twoFactorRequired: true, userId: found.userId }
    }
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

// ── Two-Factor Authentication ─────────────────────────────────────────────────

const MOCK_2FA_SECRET = 'JBSWY3DPEHPK3PXP'

export async function setup2FA(userId, email) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const label = encodeURIComponent(`Nordic Vitals:${email || 'member@nordic.no'}`)
    const issuer = encodeURIComponent('Nordic Vitals')
    return {
      secret: MOCK_2FA_SECRET,
      qr_uri: `otpauth://totp/${label}?secret=${MOCK_2FA_SECRET}&issuer=${issuer}`,
    }
  }
  return request('POST', '/v1/mlm/auth/2fa/setup', { user_id: userId })
}

export async function enable2FA(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    _mock2FA[userId] = true
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/2fa/enable', { code })
}

export async function disable2FA(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    _mock2FA[userId] = false
    return { ok: true }
  }
  return request('POST', '/v1/mlm/auth/2fa/disable', { code })
}

export async function verify2FALogin(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    if (!/^\d{6}$/.test(code)) throw new Error('Enter a valid 6-digit code')
    if (code === '000000') throw new Error('Invalid code — try again')
    const found = _mock2FAPendingUser
    _mock2FAPendingUser = null
    if (!found || found.userId !== userId) throw new Error('Session expired — please log in again')
    const { password: _pw, ...safe } = found
    return safe
  }
  return request('POST', '/v1/mlm/auth/2fa/verify', { user_id: userId, code })
}

export function isMock2FAEnabled(userId) {
  return !!_mock2FA[userId]
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

export async function getOrderDetail(orderId) {
  if (MOCK) {
    const order = ORDERS.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const lineItems = order.items.map(str => {
      const m = str.match(/^(.+?)\s*[×x](\d+)$/)
      const name = m ? m[1].trim() : str.trim()
      const qty  = m ? parseInt(m[2]) : 1
      const lk   = PRODUCT_LOOKUP[name] || { price: Math.round(order.total / order.items.length), pv: 0 }
      return { name, qty, unitPrice: lk.price, pv: lk.pv, total: lk.price * qty }
    })
    const subtotalExMva = Math.round(order.total / 1.25)
    const mvaAmount     = order.total - subtotalExMva
    return {
      ...order,
      lineItems,
      subtotalExMva,
      mvaAmount,
      mvaRate: 25,
      payment: { method: 'Bankoverføring', ref: `BT-${order.id.replace('NV-ORD-', '')}` },
      shipping: { name: 'Lars Eriksen', address: 'Storgata 14', city: 'Oslo', postalCode: '0182', country: 'Norge' },
      billing:  { name: 'Lars Eriksen', memberId: 'NV-10042', address: 'Storgata 14', city: 'Oslo', postalCode: '0182', country: 'Norge' },
      company: {
        name: 'Nordic Vitals AS', orgNo: '925 812 456',
        address: 'Drammensveien 40', city: 'Oslo', postalCode: '0255', country: 'Norge',
        email: 'support@nordicvitals.no', vatNo: 'NO 925 812 456 MVA',
      },
    }
  }
  return request('GET', `/api/viking-peptides/orders/${orderId}`)
}

export async function placeOrder({ userId, items, shippingAddress, orderRef, promoCode, discount, total: orderTotal }) {
  const total = orderTotal ?? items.reduce((s, i) => s + i.price * i.qty, 0)
  const pv    = items.reduce((s, i) => s + (i.pv || i.price) * i.qty, 0)
  if (MOCK) return { order: { id: orderRef, status: 'pending', total, pv } }
  return request('POST', '/api/viking-peptides/orders', {
    user_id: userId, items, shipping_address: shippingAddress, order_ref: orderRef,
    promo_code: promoCode, discount, total, pv,
  })
}

export async function processPayment({ orderRef, method, amount, currency = 'NOK', paymentDetails }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    return { success: true, transactionId: 'TXN-' + Math.random().toString(36).slice(2,10).toUpperCase(), method, amount }
  }
  return request('POST', '/api/viking-peptides/payments', {
    order_ref: orderRef, method, amount, currency, payment_details: paymentDetails,
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

const SETTINGS_DEFAULTS = {
  company_name: 'Nordic Vitals AS',
  currency: 'NOK',
  timezone: 'Europe/Oslo',
  language: 'Norwegian',
  notifications: { new_member: true, rank_change: true, commission_run: true, sms_withdrawal: false },
  maintenance_mode: false,
  maintenance_message: "We're performing scheduled maintenance. Back soon!",
  maintenance_return: '',
}

export async function getAdminSettings() {
  if (MOCK) {
    try {
      const saved = localStorage.getItem('nv_admin_settings')
      return saved ? { ...SETTINGS_DEFAULTS, ...JSON.parse(saved) } : { ...SETTINGS_DEFAULTS }
    } catch { return { ...SETTINGS_DEFAULTS } }
  }
  return request('GET', '/v1/mlm/admin/settings')
}

export async function saveAdminSettings(settings) {
  if (MOCK) {
    try { localStorage.setItem('nv_admin_settings', JSON.stringify(settings)) } catch {}
    return { ok: true }
  }
  return request('POST', '/v1/mlm/admin/settings', settings)
}

export function readMaintenanceMode() {
  try {
    const saved = localStorage.getItem('nv_admin_settings')
    if (!saved) return { active: false, message: '', returnTime: '' }
    const s = JSON.parse(saved)
    return { active: !!s.maintenance_mode, message: s.maintenance_message || '', returnTime: s.maintenance_return || '' }
  } catch { return { active: false, message: '', returnTime: '' } }
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

const REVIEWS_KEY = 'nv_reviews'

function _getReviewStore() {
  try {
    const d = localStorage.getItem(REVIEWS_KEY)
    if (d) return JSON.parse(d)
  } catch (_) {}
  const flat = []
  Object.entries(PRODUCT_REVIEWS).forEach(([pid, reviews]) => {
    reviews.forEach(r => flat.push({ ...r, productId: Number(pid) }))
  })
  return flat
}

function _saveReviewStore(data) {
  try { localStorage.setItem(REVIEWS_KEY, JSON.stringify(data)) } catch (_) {}
}

export async function getProductReviews(productId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const store = _getReviewStore()
    const reviews = store.filter(r => r.productId === Number(productId) && r.status !== 'rejected')
    return { reviews }
  }
  return request('GET', `/api/viking-peptides/products/${productId}/reviews`)
}

export async function submitProductReview(productId, { rating, comment, reviewer, userId }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const store = _getReviewStore()
    const newReview = {
      id: `r${productId}-${Date.now()}`,
      productId: Number(productId),
      reviewer: reviewer || 'Anonymous',
      userId: userId || null,
      rating,
      comment,
      date: new Date().toISOString().slice(0, 10),
      verified: true,
      status: 'pending',
    }
    store.push(newReview)
    _saveReviewStore(store)
    return { ok: true }
  }
  return request('POST', `/api/viking-peptides/products/${productId}/reviews`, { rating, comment })
}

export async function getMyReviews(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const mine = store.filter(r =>
      r.userId === userId || r.reviewer?.toLowerCase().startsWith('lars e')
    ).sort((a, b) => b.date.localeCompare(a.date))
    return { reviews: mine }
  }
  return request('GET', `/v1/mlm/reviews/my?userId=${userId}`)
}

export async function updateMyReview(reviewId, { rating, comment }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const idx = store.findIndex(r => r.id === reviewId)
    if (idx !== -1) {
      store[idx] = { ...store[idx], rating, comment, status: 'pending' }
      _saveReviewStore(store)
    }
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/reviews/${reviewId}`, { rating, comment })
}

export async function deleteMyReview(reviewId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    _saveReviewStore(_getReviewStore().filter(r => r.id !== reviewId))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/reviews/${reviewId}`)
}

export async function getAdminReviews({ status = 'all', productId = null, search = '', limit = 50, offset = 0 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    let store = _getReviewStore()
    if (status !== 'all') store = store.filter(r => r.status === status)
    if (productId) store = store.filter(r => r.productId === Number(productId))
    if (search) {
      const q = search.toLowerCase()
      store = store.filter(r =>
        r.reviewer.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
      )
    }
    store = [...store].sort((a, b) => b.date.localeCompare(a.date))
    return { reviews: store.slice(offset, offset + limit), total: store.length }
  }
  const params = new URLSearchParams({ status, limit, offset })
  if (productId) params.set('productId', productId)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/reviews?${params}`)
}

export async function moderateReview(reviewId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getReviewStore()
    const idx = store.findIndex(r => r.id === reviewId)
    if (idx !== -1) store[idx].status = status
    _saveReviewStore(store)
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/admin/reviews/${reviewId}`, { status })
}

export async function deleteAdminReview(reviewId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    _saveReviewStore(_getReviewStore().filter(r => r.id !== reviewId))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/reviews/${reviewId}`)
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

export async function getAdminOrderDetail(orderId) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    const order = _adminOrders.find(o => o.id === orderId)
    if (!order) throw new Error('Order not found')
    const member = ADMIN_MEMBERS.find(m => m.id === order.memberId) || {}
    const cityByCountry = { Norway: 'Oslo', Sweden: 'Stockholm', Denmark: 'Copenhagen', Finland: 'Helsinki' }
    const postalByCountry = { Norway: '0150', Sweden: '111 20', Denmark: '1050', Finland: '00100' }
    const streetsByMember = {
      'NV-10042': 'Karl Johans gate 12', 'NV-10087': 'Drottninggatan 34', 'NV-10091': 'Storgata 8',
      'NV-10102': 'Nordre gate 5', 'NV-10118': 'Bergstien 21', 'NV-10122': 'Vasagatan 17',
      'NV-10201': 'Lillestrøm vei 3', 'NV-10208': 'Tverrveien 7', 'NV-10210': 'Bredgade 22',
      'NV-10215': 'Drammensveien 44', 'NV-10230': 'Majorstuen 19', 'NV-10241': 'Frognerveien 56',
    }
    const shipping = {
      name: order.member,
      address1: streetsByMember[order.memberId] || 'Storgata 1',
      city: cityByCountry[order.shippingCountry] || 'Oslo',
      postalCode: postalByCountry[order.shippingCountry] || '0150',
      country: order.shippingCountry || 'Norway',
    }
    const lineItems = order.items.map(str => {
      const m = str.match(/^(.+?)\s*[×x](\d+)$/)
      const name = m ? m[1].trim() : str
      const qty = m ? parseInt(m[2]) : 1
      const product = PRODUCT_LOOKUP[name] || { price: 0, pv: 0 }
      return { name, qty, unitPrice: product.price, pv: product.pv, subtotal: product.price * qty, pvSubtotal: product.pv * qty }
    })
    const statusOrder = ['Pending', 'Processing', 'Shipped', 'Delivered']
    const statusIdx = Math.max(0, statusOrder.indexOf(order.status))
    const baseDate = new Date(order.date + 'T10:00:00Z')
    const events = statusOrder.slice(0, statusIdx + 1).map((s, i) => {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + i)
      return { status: s, timestamp: d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC', note: s === 'Shipped' ? 'Carrier: Posten Norge / PostNord' : '' }
    })
    if (order.status === 'Cancelled') {
      const d = new Date(baseDate)
      d.setDate(d.getDate() + 1)
      events.push({ status: 'Cancelled', timestamp: d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC', note: 'Cancelled by customer request' })
    }
    const notes = ADMIN_ORDER_NOTES[orderId] || []
    return {
      ...order,
      email: member.email || '',
      phone: member.phone || '',
      memberRank: member.rank || '',
      lineItems,
      shipping,
      paymentMethod: order.method || 'Bank Transfer',
      paymentRef: 'BT-' + orderId.replace('NV-ORD-', '') + '00',
      events,
      notes,
    }
  }
  return request('GET', `/api/viking-peptides/admin/orders/${orderId}`)
}

export async function addOrderNote(orderId, note) {
  if (MOCK) {
    if (!ADMIN_ORDER_NOTES[orderId]) ADMIN_ORDER_NOTES[orderId] = []
    const entry = { note, author: 'Admin', timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC' }
    ADMIN_ORDER_NOTES[orderId] = [entry, ...ADMIN_ORDER_NOTES[orderId]]
    return { note: entry }
  }
  return request('POST', `/api/viking-peptides/admin/orders/${orderId}/notes`, { note })
}

export async function createManualOrder({ memberId, memberName, items, shippingAddress, paymentMethod }) {
  if (MOCK) {
    if (!_adminOrders) _adminOrders = [...ADMIN_ORDERS]
    const maxNum = _adminOrders.reduce((m, o) => Math.max(m, parseInt(o.id.replace('NV-ORD-', '')) || 1000), 1000)
    const orderId = `NV-ORD-${maxNum + 1}`
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    const pv    = items.reduce((s, i) => s + i.pv   * i.qty, 0)
    const order = {
      id: orderId,
      memberId,
      member: memberName,
      date: new Date().toISOString().slice(0, 10),
      items: items.map(i => `${i.name} ×${i.qty}`),
      total,
      pv,
      status: 'Pending',
      method: paymentMethod,
      shippingCountry: shippingAddress.country,
      _shipping: shippingAddress,
    }
    _adminOrders = [order, ..._adminOrders]
    return { order }
  }
  return request('POST', '/api/viking-peptides/admin/orders', { memberId, memberName, items, shippingAddress, paymentMethod })
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

// ── Announcements ──────────────────────────────────────────────────────────────

let _announcements = null
let _annSeq = 6

export async function getAnnouncements() {
  if (MOCK) {
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    return { announcements: _announcements }
  }
  return request('GET', '/v1/mlm/admin/announcements')
}

export async function createAnnouncement({ title, body, audience = 'all', type = 'info' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    const ann = {
      id: `ann-00${++_annSeq}`,
      title,
      body,
      audience,
      type,
      created_at: new Date().toISOString(),
      sent_by: 'Admin',
      recipient_count: Math.floor(900 + Math.random() * 300),
    }
    _announcements = [ann, ..._announcements]
    return { announcement: ann }
  }
  return request('POST', '/v1/mlm/admin/announcements', { title, body, audience, type })
}

export async function deleteAnnouncement(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    _announcements = _announcements.filter(a => a.id !== id)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/announcements/${id}`)
}

export async function getMemberAnnouncements(memberRank = 'all') {
  if (MOCK) {
    if (!_announcements) _announcements = [...ANNOUNCEMENTS].reverse()
    const RANK_ORDER = ['all', 'bronze', 'silver', 'gold', 'platinum']
    const memberIdx = RANK_ORDER.indexOf(memberRank)
    const visible = _announcements.filter(a => {
      const audIdx = RANK_ORDER.indexOf(a.audience)
      return audIdx <= memberIdx || a.audience === 'all'
    })
    return { announcements: visible }
  }
  return request('GET', '/v1/mlm/announcements', { rank: memberRank })
}

// ── Audit Log ──────────────────────────────────────────────────────────────────

export async function getAuditLog({ category, result, search, limit = 100 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...AUDIT_LOG].reverse()
    if (category && category !== 'all') rows = rows.filter(r => r.category === category)
    if (result   && result   !== 'all') rows = rows.filter(r => r.result   === result)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(r =>
        r.action.toLowerCase().includes(q) ||
        r.detail.toLowerCase().includes(q) ||
        r.actor.toLowerCase().includes(q) ||
        r.target.toLowerCase().includes(q)
      )
    }
    return { entries: rows.slice(0, limit), total: rows.length }
  }
  const params = new URLSearchParams()
  if (category && category !== 'all') params.set('category', category)
  if (result   && result   !== 'all') params.set('result',   result)
  if (search)   params.set('q',        search)
  params.set('limit', limit)
  return request('GET', `/v1/mlm/admin/audit-log?${params}`)
}

// ── Admin Member Detail ────────────────────────────────────────────────────────

export async function getMemberDetail(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const base = ADMIN_MEMBERS.find(m => m.id === memberId)
    if (!base) throw new Error('Member not found')
    const member = { ...base, ...MEMBER_STATUS_OVERRIDE[memberId] }
    const downline = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const commissions = COMMISSIONS.filter((_, i) => i % Math.max(1, Math.floor(COMMISSIONS.length / 4)) === 0).slice(0, 6)
    const orders = ADMIN_ORDERS.filter(o => o.memberId === memberId).slice(0, 5)
    return { member, downline, commissions, orders }
  }
  return request('GET', `/v1/mlm/admin/members/${memberId}`)
}

export async function updateMemberStatus(memberId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), status }
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/members/${memberId}`, { status })
}

export async function setMemberRank(memberId, rank) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), rank }
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/members/${memberId}`, { rank })
}

export async function addMemberNote(memberId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    MEMBER_STATUS_OVERRIDE[memberId] = { ...(MEMBER_STATUS_OVERRIDE[memberId] || {}), notes: note }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/members/${memberId}/notes`, { note })
}

// ── Support Tickets ────────────────────────────────────────────────────────────

const TICKET_STORE = SUPPORT_TICKETS.map(t => ({ ...t, messages: [...t.messages] }))

export async function getMyTickets(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return TICKET_STORE.filter(t => t.memberId === memberId)
  }
  return request('GET', `/v1/mlm/support/tickets?member_id=${memberId}`)
}

export async function getTicket(ticketId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    return t
  }
  return request('GET', `/v1/mlm/support/tickets/${ticketId}`)
}

export async function createTicket({ memberId, memberName, memberEmail, category, subject, message, priority = 'medium' }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const newTicket = {
      id: `tkt-${String(TICKET_STORE.length + 1).padStart(3, '0')}`,
      memberId, memberName, memberEmail, category, subject, priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{ id: 'm1', from: 'member', text: message, ts: new Date().toISOString() }],
    }
    TICKET_STORE.push(newTicket)
    return newTicket
  }
  return request('POST', '/v1/mlm/support/tickets', { member_id: memberId, member_name: memberName, member_email: memberEmail, category, subject, message, priority })
}

export async function replyToTicket(ticketId, { from, text }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    const msg = { id: `m${t.messages.length + 1}`, from, text, ts: new Date().toISOString() }
    t.messages.push(msg)
    t.updatedAt = new Date().toISOString()
    if (from === 'admin' && t.status === 'open') t.status = 'in_progress'
    return t
  }
  return request('POST', `/v1/mlm/support/tickets/${ticketId}/messages`, { from, text })
}

export async function updateTicketStatus(ticketId, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const t = TICKET_STORE.find(t => t.id === ticketId)
    if (!t) throw new Error('Ticket not found')
    t.status = status
    t.updatedAt = new Date().toISOString()
    return t
  }
  return request('PATCH', `/v1/mlm/support/tickets/${ticketId}`, { status })
}

export async function getAdminTickets({ status, category, search, page = 1, pageSize = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...TICKET_STORE]
    if (status && status !== 'all') rows = rows.filter(t => t.status === status)
    if (category && category !== 'all') rows = rows.filter(t => t.category === category)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(t =>
        t.subject.toLowerCase().includes(q) ||
        t.memberName.toLowerCase().includes(q) ||
        t.memberId.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    const total = rows.length
    const items = rows.slice((page - 1) * pageSize, page * pageSize)
    const open = TICKET_STORE.filter(t => t.status === 'open').length
    const inProgress = TICKET_STORE.filter(t => t.status === 'in_progress').length
    const resolved = TICKET_STORE.filter(t => t.status === 'resolved').length
    return { items, total, open, inProgress, resolved }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (category && category !== 'all') params.set('category', category)
  if (search) params.set('q', search)
  params.set('page', page)
  params.set('page_size', pageSize)
  return request('GET', `/v1/mlm/support/tickets/admin?${params}`)
}

// ── Autoship ──────────────────────────────────────────────────────────────────

let AUTOSHIP_STORE = [...AUTOSHIPS]

export async function getAutoships(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const rows = AUTOSHIP_STORE.filter(a => a.memberId === userId || a.memberId === 'usr-001')
    const activePv = rows.filter(a => a.status === 'active').reduce((s, a) => s + a.totalPv, 0)
    return { items: rows, activePv }
  }
  return request('GET', `/v1/mlm/autoship?user_id=${userId}`)
}

export async function createAutoship(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const product = PRODUCTS.find(p => p.id === data.productId)
    if (!product) throw new Error('Product not found')
    const next = new Date()
    next.setDate(next.getDate() + 30)
    const entry = {
      id: `as-${Date.now()}`,
      memberId: data.userId || 'usr-001',
      memberName: 'Ingrid Larsen',
      memberEmail: 'ingrid@example.com',
      productId: product.id,
      productName: product.name,
      qty: data.qty || 1,
      frequency: data.frequency || 'monthly',
      memberPrice: product.memberPrice,
      pv: product.pv,
      totalPv: product.pv * (data.qty || 1),
      status: 'active',
      nextShipDate: next.toISOString().split('T')[0],
      lastShipDate: null,
      shippingAddress: data.shippingAddress || '',
      createdAt: new Date().toISOString(),
    }
    AUTOSHIP_STORE.push(entry)
    return entry
  }
  return request('POST', '/v1/mlm/autoship', data)
}

export async function updateAutoship(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    const product = data.productId ? PRODUCTS.find(p => p.id === data.productId) : null
    const updated = {
      ...AUTOSHIP_STORE[idx],
      ...data,
      ...(product ? { productName: product.name, memberPrice: product.memberPrice, pv: product.pv } : {}),
      totalPv: (product ? product.pv : AUTOSHIP_STORE[idx].pv) * (data.qty || AUTOSHIP_STORE[idx].qty),
    }
    AUTOSHIP_STORE[idx] = updated
    return updated
  }
  return request('PATCH', `/v1/mlm/autoship/${id}`, data)
}

export async function pauseAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'paused', nextShipDate: null }
    return AUTOSHIP_STORE[idx]
  }
  return request('POST', `/v1/mlm/autoship/${id}/pause`)
}

export async function resumeAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    const next = new Date()
    next.setDate(next.getDate() + 30)
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'active', nextShipDate: next.toISOString().split('T')[0] }
    return AUTOSHIP_STORE[idx]
  }
  return request('POST', `/v1/mlm/autoship/${id}/resume`)
}

export async function cancelAutoship(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const idx = AUTOSHIP_STORE.findIndex(a => a.id === id)
    if (idx < 0) throw new Error('Autoship not found')
    AUTOSHIP_STORE[idx] = { ...AUTOSHIP_STORE[idx], status: 'cancelled', nextShipDate: null }
    return AUTOSHIP_STORE[idx]
  }
  return request('DELETE', `/v1/mlm/autoship/${id}`)
}

export async function getAdminAutoships({ status, search, page = 1, pageSize = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = [...AUTOSHIP_STORE]
    if (status && status !== 'all') rows = rows.filter(a => a.status === status)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberId.toLowerCase().includes(q) ||
        a.productName.toLowerCase().includes(q)
      )
    }
    rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    const total = rows.length
    const items = rows.slice((page - 1) * pageSize, page * pageSize)
    const active = AUTOSHIP_STORE.filter(a => a.status === 'active').length
    const paused = AUTOSHIP_STORE.filter(a => a.status === 'paused').length
    const cancelled = AUTOSHIP_STORE.filter(a => a.status === 'cancelled').length
    const monthlyPv = AUTOSHIP_STORE.filter(a => a.status === 'active').reduce((s, a) => s + a.totalPv, 0)
    const monthlyRevenue = AUTOSHIP_STORE.filter(a => a.status === 'active').reduce((s, a) => s + a.memberPrice * a.qty, 0)
    return { items, total, active, paused, cancelled, monthlyPv, monthlyRevenue }
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('q', search)
  params.set('page', page)
  params.set('page_size', pageSize)
  return request('GET', `/v1/mlm/autoship/admin?${params}`)
}

// ── Milestones & Achievements ──────────────────────────────────────────────────

const MOCK_MILESTONES = [
  // Getting Started
  { id: 'm-gs-1', category: 'Getting Started', icon: '🎉', title: 'Welcome to Nordic Vitals!', desc: 'Your account has been created. Your journey starts now.', reward: '25 MLMT', rewardValue: 25, status: 'completed', completedAt: '2026-01-15T10:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-gs-2', category: 'Getting Started', icon: '✉️', title: 'Email Verified',             desc: 'Verify your email address to unlock all features.',    reward: '10 MLMT', rewardValue: 10, status: 'completed', completedAt: '2026-01-15T10:05:00Z', progress: null, target: null, cta: null },
  { id: 'm-gs-3', category: 'Getting Started', icon: '👤', title: 'Profile Complete',           desc: 'Fill in your name, phone, and country in your profile.', reward: '15 MLMT', rewardValue: 15, status: 'completed', completedAt: '2026-01-20T14:00:00Z', progress: null, target: null, cta: { label: 'Go to Profile', href: '/dashboard/profile' } },
  { id: 'm-gs-4', category: 'Getting Started', icon: '🛍️', title: 'First Order',               desc: 'Place your first order from the Nordic Vitals shop.',     reward: '50 MLMT', rewardValue: 50, status: 'completed', completedAt: '2026-05-20T08:00:00Z', progress: null, target: null, cta: { label: 'Shop Now', href: '/shop' } },
  { id: 'm-gs-5', category: 'Getting Started', icon: '♻️', title: 'Autoship Activated',         desc: 'Set up your first recurring autoship subscription.',       reward: '30 MLMT', rewardValue: 30, status: 'completed', completedAt: '2026-06-01T09:00:00Z', progress: null, target: null, cta: { label: 'Manage Autoship', href: '/dashboard/autoship' } },
  // Sales Champion
  { id: 'm-sc-1', category: 'Sales Champion', icon: '💊', title: 'First 100 PV',     desc: 'Generate 100 Personal Volume — your first real milestone.',     reward: '75 MLMT',  rewardValue: 75,  status: 'completed',   completedAt: '2026-06-15T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-sc-2', category: 'Sales Champion', icon: '🔥', title: '300 PV Achiever',  desc: 'Reach 300 PV in a single month — unlock Silver rank eligibility.', reward: '150 MLMT', rewardValue: 150, status: 'completed',   completedAt: '2026-07-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-sc-3', category: 'Sales Champion', icon: '⭐', title: '500 PV Star',       desc: 'Reach 500 PV — required for Gold rank advancement.',             reward: '300 MLMT', rewardValue: 300, status: 'in_progress', completedAt: null, progress: 320, target: 500, progressLabel: '320 / 500 PV', cta: { label: 'View Earnings', href: '/dashboard/earnings' } },
  { id: 'm-sc-4', category: 'Sales Champion', icon: '📝', title: 'Review Pioneer',   desc: 'Submit your first product review to help the community.',         reward: '20 MLMT',  rewardValue: 20,  status: 'claimable',   completedAt: '2026-07-10T00:00:00Z', progress: null, target: null, cta: null },
  // Team Builder
  { id: 'm-tb-1', category: 'Team Builder', icon: '🤝', title: 'First Recruit',    desc: 'Personally sponsor your first new member.',                    reward: '100 MLMT', rewardValue: 100, status: 'completed',   completedAt: '2026-02-10T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-2', category: 'Team Builder', icon: '👥', title: 'Growing Team',     desc: 'Grow your personally sponsored team to 3 members.',             reward: '200 MLMT', rewardValue: 200, status: 'completed',   completedAt: '2026-04-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-3', category: 'Team Builder', icon: '🧑‍🤝‍🧑', title: 'Squad of 5',  desc: 'Personally recruit 5 active members into your team.',            reward: '350 MLMT', rewardValue: 350, status: 'claimable',  completedAt: '2026-07-05T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-tb-4', category: 'Team Builder', icon: '🌐', title: 'Network of 10',    desc: 'Build a personally recruited team of 10 active members.',        reward: '750 MLMT', rewardValue: 750, status: 'in_progress', completedAt: null, progress: 6, target: 10, progressLabel: '6 / 10 members', cta: { label: 'View Referrals', href: '/dashboard/referral' } },
  // Leadership
  { id: 'm-ld-1', category: 'Leadership', icon: '🥉', title: 'Bronze Rank',          desc: 'Achieve Bronze rank — you are officially on your way up.',       reward: '100 MLMT', rewardValue: 100, status: 'completed', completedAt: '2026-03-15T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-2', category: 'Leadership', icon: '🥈', title: 'Silver Rank',          desc: 'Advance to Silver rank — you are now a team leader.',            reward: '500 MLMT', rewardValue: 500, status: 'completed', completedAt: '2026-07-01T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-3', category: 'Leadership', icon: '🥇', title: 'Gold Rank',            desc: 'Reach Gold rank — requires 500 PV and 5,000 GV each leg.',       reward: '1500 MLMT', rewardValue: 1500, status: 'locked', completedAt: null, progress: 320, target: 500, progressLabel: '320 / 500 PV needed', cta: { label: 'See Calculator', href: '/dashboard/calculator' } },
  { id: 'm-ld-4', category: 'Leadership', icon: '💰', title: 'First Commission',     desc: 'Earn your very first commission from the Arctico MLM engine.',    reward: '25 MLMT', rewardValue: 25,  status: 'completed', completedAt: '2026-02-16T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-5', category: 'Leadership', icon: '💎', title: '1,000 MLMT Earned',   desc: 'Accumulate 1,000 MLMT in total commissions.',                     reward: '100 MLMT', rewardValue: 100, status: 'completed', completedAt: '2026-06-30T00:00:00Z', progress: null, target: null, cta: null },
  { id: 'm-ld-6', category: 'Leadership', icon: '🏆', title: 'Top 10 Leaderboard',  desc: 'Appear in the Top 10 Earners on the monthly leaderboard.',        reward: '250 MLMT', rewardValue: 250, status: 'completed', completedAt: '2026-07-13T00:00:00Z', progress: null, target: null, cta: { label: 'View Leaderboard', href: '/dashboard/leaderboard' } },
]

const _claimedMilestones = new Set()

export async function getMilestones(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const milestones = MOCK_MILESTONES.map(m => ({
      ...m,
      status: _claimedMilestones.has(m.id) ? 'completed' : m.status,
    }))
    const claimed = milestones.filter(m => m.status === 'completed')
    const totalRewardClaimed = claimed.reduce((s, m) => s + (m.rewardValue || 0), 0)
    return { milestones, totalRewardClaimed }
  }
  return request('GET', `/v1/mlm/members/${userId}/milestones`)
}

export async function claimMilestone(userId, milestoneId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const m = MOCK_MILESTONES.find(m => m.id === milestoneId)
    if (!m) throw new Error('Milestone not found')
    if (m.status !== 'claimable') throw new Error('Milestone is not claimable')
    _claimedMilestones.add(milestoneId)
    m.status = 'completed'
    m.completedAt = new Date().toISOString()
    return { milestoneId, reward: m.rewardValue || 0, newBalance: 1150 + (m.rewardValue || 0) }
  }
  return request('POST', `/v1/mlm/members/${userId}/milestones/${milestoneId}/claim`, {})
}

const _resourceDownloads = {}

export async function getResources(filters = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let items = RESOURCES.map(r => ({
      ...r,
      downloads: r.downloads + (_resourceDownloads[r.id] || 0),
    }))
    if (filters.category && filters.category !== 'All') {
      items = items.filter(r => r.category === filters.category)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q))
      )
    }
    return { resources: items, total: items.length }
  }
  const params = new URLSearchParams()
  if (filters.category && filters.category !== 'All') params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  return request('GET', `/v1/mlm/resources?${params}`)
}

export async function trackResourceDownload(resourceId) {
  if (MOCK) {
    _resourceDownloads[resourceId] = (_resourceDownloads[resourceId] || 0) + 1
    return { ok: true }
  }
  return request('POST', `/v1/mlm/resources/${resourceId}/download`, {})
}

// --- Promo Codes ---
const _mockPromos = PROMO_CODES.map(p => ({ ...p }))

export async function validatePromoCode(code, subtotal) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const promo = _mockPromos.find(p => p.code.toUpperCase() === code.toUpperCase() && p.active)
    if (!promo) return { valid: false, error: 'Invalid or expired promo code.' }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) return { valid: false, error: 'This promo code has reached its usage limit.' }
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return { valid: false, error: 'This promo code has expired.' }
    if (subtotal < promo.minOrder) return { valid: false, error: `Minimum order of NOK ${promo.minOrder} required for this code.` }
    const discount = promo.type === 'percent'
      ? Math.round(subtotal * promo.value / 100)
      : Math.min(promo.value, subtotal)
    return { valid: true, promo, discount }
  }
  return request('POST', '/v1/mlm/promos/validate', { code, subtotal })
}

export async function getAdminPromos() {
  if (MOCK) return { promos: _mockPromos }
  return request('GET', '/v1/mlm/admin/promos')
}

export async function createPromoCode(data) {
  if (MOCK) {
    const newPromo = {
      id: 'promo-' + Date.now(),
      code: data.code.toUpperCase(),
      description: data.description || '',
      type: data.type,
      value: Number(data.value),
      minOrder: Number(data.minOrder) || 0,
      maxUses: data.maxUses ? Number(data.maxUses) : null,
      usedCount: 0,
      active: true,
      expiresAt: data.expiresAt || null,
      createdAt: new Date().toISOString(),
      totalSaved: 0,
    }
    _mockPromos.push(newPromo)
    return { promo: newPromo }
  }
  return request('POST', '/v1/mlm/admin/promos', data)
}

export async function togglePromoCode(id, active) {
  if (MOCK) {
    const p = _mockPromos.find(x => x.id === id)
    if (p) p.active = active
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/promos/${id}`, { active })
}

export async function deletePromoCode(id) {
  if (MOCK) {
    const idx = _mockPromos.findIndex(x => x.id === id)
    if (idx !== -1) _mockPromos.splice(idx, 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/promos/${id}`, {})
}

// ── Referral Tracking ────────────────────────────────────────────────────────

export async function getAdminReferrals({ rank, status, search } = {}) {
  if (MOCK) {
    let data = [...REFERRAL_STATS]
    if (rank && rank !== 'all')    data = data.filter(r => r.rank === rank)
    if (status && status !== 'all') data = data.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(r =>
        r.memberName.toLowerCase().includes(q) ||
        r.memberId.toLowerCase().includes(q) ||
        r.referralCode.toLowerCase().includes(q)
      )
    }
    return { referrals: data }
  }
  const params = new URLSearchParams()
  if (rank && rank !== 'all')    params.set('rank', rank)
  if (status && status !== 'all') params.set('status', status)
  if (search)                     params.set('search', search)
  return request('GET', `/v1/mlm/admin/referrals?${params}`)
}

// ── Email Templates ───────────────────────────────────────────────────────────

let _mockTemplates = EMAIL_TEMPLATES.map(t => ({ ...t }))

export async function getEmailTemplates() {
  if (MOCK) return { templates: _mockTemplates }
  return request('GET', '/v1/mlm/admin/email-templates')
}

export async function updateEmailTemplate(id, { subject, body, active }) {
  if (MOCK) {
    const idx = _mockTemplates.findIndex(t => t.id === id)
    if (idx !== -1) {
      if (subject !== undefined) _mockTemplates[idx].subject = subject
      if (body    !== undefined) _mockTemplates[idx].body    = body
      if (active  !== undefined) _mockTemplates[idx].active  = active
      _mockTemplates[idx].lastEditedAt = new Date().toISOString()
    }
    return { ok: true, template: _mockTemplates[idx] }
  }
  return request('PUT', `/v1/mlm/admin/email-templates/${id}`, { subject, body, active })
}

export async function resetEmailTemplate(id) {
  if (MOCK) {
    const orig = EMAIL_TEMPLATES.find(t => t.id === id)
    if (orig) {
      const idx = _mockTemplates.findIndex(t => t.id === id)
      _mockTemplates[idx] = { ...orig, lastEditedAt: new Date().toISOString() }
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/email-templates/${id}/reset`, {})
}

export async function sendTestEmail(id, toEmail) {
  if (MOCK) return { ok: true, message: `Test email sent to ${toEmail}` }
  return request('POST', `/v1/mlm/admin/email-templates/${id}/test`, { to: toEmail })
}

// ── Token Management ──────────────────────────────────────────────────────────

let _mockTokenStats = { ...TOKEN_STATS }
let _mockTokenEvents = TOKEN_EVENTS.map(e => ({ ...e }))

export async function getTokenStats() {
  if (MOCK) return { stats: { ..._mockTokenStats } }
  return request('GET', '/v1/mlm/admin/tokens/stats')
}

export async function getTokenEvents({ type, search, limit = 50, offset = 0 } = {}) {
  if (MOCK) {
    let data = [..._mockTokenEvents].sort((a, b) => b.ts.localeCompare(a.ts))
    if (type && type !== 'all') data = data.filter(e => e.type === type)
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(e =>
        e.memo.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q) ||
        (e.recipient || '').toLowerCase().includes(q)
      )
    }
    return { events: data.slice(offset, offset + limit), total: data.length }
  }
  const params = new URLSearchParams({ limit, offset })
  if (type && type !== 'all') params.set('type', type)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/tokens/events?${params}`)
}

export async function mintTokens({ amount, recipient, memo }) {
  if (MOCK) {
    const event = {
      id: `te${Date.now()}`,
      type: 'mint',
      amount,
      actor: 'admin@nordicvitals.com',
      recipient: recipient || 'platform-reserve',
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.totalSupply += amount
    _mockTokenStats.reservedPlatform += amount
    _mockTokenStats.lastMintAt = event.ts
    return { ok: true, event }
  }
  return request('POST', '/v1/mlm/admin/tokens/mint', { amount, recipient, memo })
}

export async function airdropTokens({ amount, target, memo }) {
  if (MOCK) {
    const memberCount = target === 'all-members' ? ADMIN_MEMBERS.length
      : target.startsWith('rank:') ? ADMIN_MEMBERS.filter(m => m.rank.toLowerCase() === target.split(':')[1]).length
      : 1
    const totalAmount = amount * memberCount
    const event = {
      id: `te${Date.now()}`,
      type: 'airdrop',
      amount: totalAmount,
      actor: 'admin@nordicvitals.com',
      recipient: target,
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.circulatingSupply += totalAmount
    _mockTokenStats.memberWallets += totalAmount
    _mockTokenStats.reservedPlatform -= totalAmount
    return { ok: true, event, memberCount, totalAmount }
  }
  return request('POST', '/v1/mlm/admin/tokens/airdrop', { amount, target, memo })
}

export async function burnTokens({ amount, memo }) {
  if (MOCK) {
    const event = {
      id: `te${Date.now()}`,
      type: 'burn',
      amount,
      actor: 'system',
      recipient: null,
      memo,
      ts: new Date().toISOString(),
    }
    _mockTokenEvents.unshift(event)
    _mockTokenStats.totalSupply -= amount
    _mockTokenStats.burnedTotal += amount
    _mockTokenStats.reservedPlatform -= amount
    _mockTokenStats.lastBurnAt = event.ts
    return { ok: true, event }
  }
  return request('POST', '/v1/mlm/admin/tokens/burn', { amount, memo })
}

// ── Rank Progress ─────────────────────────────────────────────────────────────
export async function getRankProgress(userId) {
  if (MOCK) {
    const u = USERS.find(x => x.userId === userId) || USERS[0]
    const joinedAt = RANK_HISTORY.length > 0 ? RANK_HISTORY[RANK_HISTORY.length - 1].achievedAt : null
    const currentEntry = RANK_HISTORY.find(h => h.rank === u.rank)
    const achievedAt = currentEntry ? currentEntry.achievedAt : joinedAt
    const daysAtRank = achievedAt
      ? Math.floor((Date.now() - new Date(achievedAt).getTime()) / 86_400_000)
      : 0
    const activeRecruits = ADMIN_MEMBERS.filter(m => m.sponsor === u.name && m.status === 'active').length
    return {
      currentRank: u.rank,
      pv: u.pv,
      leftGV: u.leftGV,
      rightGV: u.rightGV,
      activeRecruits,
      daysAtRank,
      history: RANK_HISTORY,
    }
  }
  return request('GET', `/v1/mlm/members/${userId}/rank-progress`)
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getAdminAnalytics() {
  if (MOCK) return ANALYTICS_DATA
  return request('GET', '/v1/mlm/admin/analytics')
}

// ── Training ──────────────────────────────────────────────────────────────────
export async function getTrainingModules(userId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    return TRAINING_MODULES.map(mod => ({
      ...mod,
      lessons: mod.lessons.map(l => ({ ...l, completed: completed.includes(l.id) })),
      completedCount: mod.lessons.filter(l => completed.includes(l.id)).length,
      rewardClaimed: completed.includes(`reward_${mod.id}`),
    }))
  }
  return request('GET', `/v1/mlm/members/${userId}/training`)
}

export async function completeTrainingLesson(userId, lessonId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    if (!completed.includes(lessonId)) {
      completed = [...completed, lessonId]
      localStorage.setItem(key, JSON.stringify(completed))
    }
    return { ok: true, completed }
  }
  return request('POST', `/v1/mlm/members/${userId}/training/complete`, { lessonId })
}

export async function claimTrainingReward(userId, moduleId) {
  if (MOCK) {
    const key = `nv_training_${userId || 'guest'}`
    let completed = []
    try { completed = JSON.parse(localStorage.getItem(key) || '[]') } catch {}
    const rewardKey = `reward_${moduleId}`
    if (!completed.includes(rewardKey)) {
      completed = [...completed, rewardKey]
      localStorage.setItem(key, JSON.stringify(completed))
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/members/${userId}/training/claim-reward`, { moduleId })
}

export async function getAdminUsers() {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    return ADMIN_USERS
  }
  return request('GET', '/v1/mlm/admin/users')
}

export async function inviteAdminUser(payload) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const newUser = {
      id: 'au-' + Date.now(),
      name: payload.email.split('@')[0],
      email: payload.email,
      role: payload.role,
      status: 'invited',
      lastLogin: null,
      joinedAt: new Date().toISOString().slice(0, 10),
      mfaEnabled: false,
      note: payload.note || '',
    }
    ADMIN_USERS.push(newUser)
    return newUser
  }
  return request('POST', '/v1/mlm/admin/users/invite', payload)
}

export async function updateAdminUserRole(userId, role) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const u = ADMIN_USERS.find(x => x.id === userId)
    if (u) u.role = role
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/users/${userId}/role`, { role })
}

export async function deactivateAdminUser(userId) {
  if (MOCK) {
    const { ADMIN_USERS } = await import('../data/mock.js')
    const u = ADMIN_USERS.find(x => x.id === userId)
    if (u) u.status = u.status === 'inactive' ? 'active' : 'inactive'
    return { ok: true, status: u?.status }
  }
  return request('PATCH', `/v1/mlm/admin/users/${userId}/status`)
}

export async function getRolePermissions() {
  if (MOCK) {
    const { ROLE_PERMISSIONS, PERMISSION_LABELS } = await import('../data/mock.js')
    return { roles: ROLE_PERMISSIONS, labels: PERMISSION_LABELS }
  }
  return request('GET', '/v1/mlm/admin/roles/permissions')
}

export async function getComplianceStats() {
  if (MOCK) {
    const { COMPLIANCE_STATS } = await import('../data/mock.js')
    return COMPLIANCE_STATS
  }
  return request('GET', '/v1/mlm/admin/compliance/stats')
}

export async function getComplianceChecklist() {
  if (MOCK) {
    const { COMPLIANCE_CHECKLIST } = await import('../data/mock.js')
    return [...COMPLIANCE_CHECKLIST]
  }
  return request('GET', '/v1/mlm/admin/compliance/checklist')
}

export async function updateChecklistItem(id, updates) {
  if (MOCK) {
    const { COMPLIANCE_CHECKLIST } = await import('../data/mock.js')
    const item = COMPLIANCE_CHECKLIST.find(i => i.id === id)
    if (item) Object.assign(item, updates)
    return item
  }
  return request('PATCH', `/v1/mlm/admin/compliance/checklist/${id}`, updates)
}

export async function getComplianceDocs() {
  if (MOCK) {
    const { COMPLIANCE_DOCS } = await import('../data/mock.js')
    return [...COMPLIANCE_DOCS]
  }
  return request('GET', '/v1/mlm/admin/compliance/docs')
}

export async function deleteComplianceDoc(id) {
  if (MOCK) {
    const { COMPLIANCE_DOCS } = await import('../data/mock.js')
    const idx = COMPLIANCE_DOCS.findIndex(d => d.id === id)
    if (idx !== -1) COMPLIANCE_DOCS.splice(idx, 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/compliance/docs/${id}`)
}

// Build a flat list of all members in a user's downline (BFS from sponsor chain)
export async function getMyTeam(userId) {
  if (MOCK) {
    // Compute levels via BFS from sponsor chain
    const all = ADMIN_MEMBERS
    const levelMap = {}
    const queue = [{ id: userId, level: 0 }]
    while (queue.length) {
      const { id, level } = queue.shift()
      const directs = all.filter(m => m.sponsor === id)
      directs.forEach(m => {
        if (levelMap[m.id] === undefined) {
          levelMap[m.id] = level + 1
          queue.push({ id: m.id, level: level + 1 })
        }
      })
    }
    const LAST_ACTIVITY = {
      'NV-10042': '2026-07-25', 'NV-10087': '2026-07-20', 'NV-10091': '2026-07-18',
      'NV-10102': '2026-07-15', 'NV-10118': '2026-06-30', 'NV-10122': '2026-07-22',
      'NV-10201': '2026-07-10', 'NV-10208': '2026-06-15', 'NV-10210': '2026-05-28',
      'NV-10215': '2026-07-24', 'NV-10230': '2026-07-19', 'NV-10241': '2026-07-12',
    }
    const members = all
      .filter(m => levelMap[m.id] !== undefined)
      .map(m => ({ ...m, level: levelMap[m.id], lastActivity: LAST_ACTIVITY[m.id] ?? m.joined }))
    return { members, totalGV: members.reduce((s, m) => s + m.gv, 0) }
  }
  // Live: use genealogy tree with depth=10 to get flat nodes list
  const rootNode = await request('GET', `/v1/mlm/genealogy/node-by-user/${userId}`)
  const tree = await request('GET', `/v1/mlm/genealogy/tree/${rootNode.id}?tree=placement&depth=10`)
  const nodes = (tree.nodes ?? []).filter(n => n.user_id !== userId)
  const members = nodes.map(n => ({
    id: n.user_id, name: n.name ?? n.user_id, email: n.email ?? '',
    sponsor: n.sponsor_user_id ?? '', rank: n.rank ?? 'Unranked',
    pv: n.pv ?? 0, gv: n.gv ?? 0, status: n.status ?? 'Active',
    level: n.depth ?? 1, joined: n.created_at?.slice(0, 10) ?? '',
    lastActivity: n.last_activity?.slice(0, 10) ?? '',
  }))
  return { members, totalGV: members.reduce((s, m) => s + m.gv, 0) }
}

// ── Events & Webinars ──────────────────────────────────────────────────────────

let _events = null
const _registeredEvents = new Set()
let _evtSeq = 9

function _initEvents() {
  if (!_events) _events = EVENTS.map(e => ({ ...e }))
}

export async function getEvents({ type, status } = {}) {
  if (MOCK) {
    _initEvents()
    let list = [..._events]
    if (type && type !== 'all') list = list.filter(e => e.type === type)
    if (status && status !== 'all') list = list.filter(e => e.status === status)
    list.sort((a, b) => new Date(a.date) - new Date(b.date))
    return { events: list.map(e => ({ ...e, isRegistered: _registeredEvents.has(e.id) })) }
  }
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type)
  if (status && status !== 'all') params.set('status', status)
  return request('GET', `/v1/mlm/events?${params}`)
}

export async function registerForEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const ev = _events.find(e => e.id === eventId)
    if (!ev) throw new Error('Event not found')
    if (ev.status !== 'upcoming') throw new Error('Event is not open for registration')
    if (_registeredEvents.has(eventId)) throw new Error('Already registered')
    if (ev.registered >= ev.capacity) throw new Error('Event is full')
    _registeredEvents.add(eventId)
    ev.registered += 1
    return { ok: true, event_id: eventId }
  }
  return request('POST', `/v1/mlm/events/${eventId}/register`)
}

export async function unregisterFromEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const ev = _events.find(e => e.id === eventId)
    if (!ev) throw new Error('Event not found')
    if (!_registeredEvents.has(eventId)) throw new Error('Not registered')
    _registeredEvents.delete(eventId)
    ev.registered = Math.max(0, ev.registered - 1)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/events/${eventId}/register`)
}

export async function getAdminEvents({ type, status } = {}) {
  if (MOCK) {
    _initEvents()
    let list = [..._events]
    if (type && type !== 'all') list = list.filter(e => e.type === type)
    if (status && status !== 'all') list = list.filter(e => e.status === status)
    list.sort((a, b) => new Date(a.date) - new Date(b.date))
    return { events: list }
  }
  const params = new URLSearchParams()
  if (type && type !== 'all') params.set('type', type)
  if (status && status !== 'all') params.set('status', status)
  return request('GET', `/v1/mlm/admin/events?${params}`)
}

export async function createAdminEvent(data) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 500))
    const ev = {
      id: `evt-0${String(++_evtSeq).padStart(2, '0')}`,
      title: data.title,
      type: data.type || 'webinar',
      description: data.description || '',
      speaker: data.speaker || '',
      speakerRole: data.speakerRole || '',
      date: data.date,
      duration_min: Number(data.duration_min) || 60,
      capacity: Number(data.capacity) || 100,
      registered: 0,
      status: new Date(data.date) > new Date() ? 'upcoming' : 'past',
      tags: data.tags || [],
      mlmt_reward: Number(data.mlmt_reward) || 0,
      recording_url: data.recording_url || null,
    }
    _events = [ev, ..._events]
    return { event: ev }
  }
  return request('POST', '/v1/mlm/admin/events', data)
}

export async function updateAdminEvent(eventId, data) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 400))
    const idx = _events.findIndex(e => e.id === eventId)
    if (idx === -1) throw new Error('Event not found')
    _events[idx] = { ..._events[idx], ...data }
    return { event: _events[idx] }
  }
  return request('PATCH', `/v1/mlm/admin/events/${eventId}`, data)
}

export async function deleteAdminEvent(eventId) {
  if (MOCK) {
    _initEvents()
    await new Promise(r => setTimeout(r, 300))
    _events = _events.filter(e => e.id !== eventId)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/events/${eventId}`)
}

export async function getCommissionPreview() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    const { ADMIN_MEMBERS } = await import('../data/mock.js')
    const members = ADMIN_MEMBERS

    const memberMap = {}
    members.forEach(m => { memberMap[m.id] = m })

    const directDownline = {}
    members.forEach(m => {
      if (!directDownline[m.sponsor]) directDownline[m.sponsor] = []
      directDownline[m.sponsor].push(m.id)
    })

    const rows = members.filter(m => m.status === 'Active').map(m => {
      const directSalesBonus = Math.round(m.pv * 0.20)
      const directs = (directDownline[m.id] || []).map(id => memberMap[id]).filter(Boolean)
      const sponsorBonus = Math.round(directs.reduce((s, d) => s + (d.pv || 0), 0) * 0.10)
      const l2 = directs.flatMap(d => (directDownline[d.id] || []).map(id => memberMap[id]).filter(Boolean))
      const l3 = l2.flatMap(d => (directDownline[d.id] || []).map(id => memberMap[id]).filter(Boolean))
      const levelCommission =
        Math.round(l2.reduce((s, d) => s + (d.pv || 0), 0) * 0.05) +
        Math.round(l3.reduce((s, d) => s + (d.pv || 0), 0) * 0.03)
      const leftGV  = Math.round(m.gv * 0.45)
      const rightGV = m.gv - leftGV
      const weakLeg = Math.min(leftGV, rightGV)
      const pairingBonus = m.rank === 'Silver' || m.rank === 'Gold' || m.rank === 'Platinum'
        ? Math.round(weakLeg * 0.08)
        : Math.round(weakLeg * 0.05)
      const total = directSalesBonus + sponsorBonus + levelCommission + pairingBonus
      return {
        id: m.id,
        name: m.name,
        rank: m.rank,
        pv: m.pv,
        gv: m.gv,
        directSalesBonus,
        sponsorBonus,
        levelCommission,
        pairingBonus,
        total,
      }
    })

    rows.sort((a, b) => b.total - a.total)

    const totals = rows.reduce((acc, r) => ({
      directSalesBonus:  acc.directSalesBonus  + r.directSalesBonus,
      sponsorBonus:      acc.sponsorBonus      + r.sponsorBonus,
      levelCommission:   acc.levelCommission   + r.levelCommission,
      pairingBonus:      acc.pairingBonus      + r.pairingBonus,
      grandTotal:        acc.grandTotal        + r.total,
    }), { directSalesBonus: 0, sponsorBonus: 0, levelCommission: 0, pairingBonus: 0, grandTotal: 0 })

    return { rows, totals, members_in_preview: rows.length, currency: 'MLMT', generated_at: new Date().toISOString() }
  }
  return request('POST', '/v1/mlm/admin/commission-preview', { dry_run: true })
}

// ─── Integrations & Webhooks ──────────────────────────────────────────────────
export async function getIntegrations() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const { INTEGRATIONS } = await import('../data/mock.js')
    return JSON.parse(JSON.stringify(INTEGRATIONS))
  }
  return request('GET', '/v1/mlm/admin/integrations')
}

export async function saveIntegrations(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return { ok: true }
  }
  return request('PUT', '/v1/mlm/admin/integrations', payload)
}

export async function testArccticoConnection(base_url, api_key) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 1200))
    // Simulate: if url contains 'arctico.duckdns.org' return unreachable
    if (!base_url) return { ok: false, error: 'No base URL configured' }
    if (base_url.includes('arctico.duckdns.org')) return { ok: false, error: 'Connection refused (403 from egress proxy)' }
    return { ok: true, latency_ms: 142, version: 'arctico-mlm v1.4.2' }
  }
  return request('POST', '/v1/mlm/admin/integrations/test-arctico', { base_url, api_key })
}

export async function getWebhooks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const { WEBHOOKS } = await import('../data/mock.js')
    return JSON.parse(JSON.stringify(WEBHOOKS))
  }
  return request('GET', '/v1/mlm/admin/webhooks')
}

export async function createWebhook(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { id: `wh-${Date.now()}`, ...payload, created_at: new Date().toISOString(), last_delivery: null }
  }
  return request('POST', '/v1/mlm/admin/webhooks', payload)
}

export async function updateWebhook(id, payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/webhooks/${id}`, payload)
}

export async function deleteWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/webhooks/${id}`)
}

export async function pingWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { ok: true, http_code: 200, duration_ms: 145 }
  }
  return request('POST', `/v1/mlm/admin/webhooks/${id}/ping`)
}

export async function getWebhookLog() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const { WEBHOOK_LOG, WEBHOOKS } = await import('../data/mock.js')
    const wmap = {}
    WEBHOOKS.forEach(w => { wmap[w.id] = w.label })
    return WEBHOOK_LOG.map(l => ({ ...l, webhook_label: wmap[l.webhook_id] || l.webhook_id }))
  }
  return request('GET', '/v1/mlm/admin/webhooks/log')
}

export async function getTaxSummary(userId, year) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const NOK_RATE = readCurrentMlmtToNok()
    const allYears = {
      2024: [
        { type: 'Pairing Bonus',        count: 18, amount: 5850 },
        { type: 'Sponsor Bonus',         count: 9,  amount: 1575 },
        { type: 'Level Commission L1',   count: 14, amount: 1260 },
        { type: 'Level Commission L2',   count: 8,  amount: 480  },
        { type: 'Level Commission L3',   count: 4,  amount: 112  },
        { type: 'Override Bonus',        count: 6,  amount: 210  },
        { type: 'Pool Bonus',            count: 3,  amount: 620  },
      ],
      2025: [
        { type: 'Pairing Bonus',        count: 24, amount: 9000 },
        { type: 'Sponsor Bonus',         count: 14, amount: 2450 },
        { type: 'Level Commission L1',   count: 19, amount: 1710 },
        { type: 'Level Commission L2',   count: 11, amount: 660  },
        { type: 'Level Commission L3',   count: 7,  amount: 196  },
        { type: 'Override Bonus',        count: 9,  amount: 315  },
        { type: 'Pool Bonus',            count: 5,  amount: 1050 },
        { type: 'Rank Bonus',            count: 2,  amount: 500  },
      ],
      2026: [
        { type: 'Pairing Bonus',        count: 9,  amount: 3600 },
        { type: 'Sponsor Bonus',         count: 5,  amount: 875  },
        { type: 'Level Commission L1',   count: 7,  amount: 630  },
        { type: 'Level Commission L2',   count: 4,  amount: 240  },
        { type: 'Level Commission L3',   count: 2,  amount: 56   },
        { type: 'Override Bonus',        count: 3,  amount: 105  },
        { type: 'Pool Bonus',            count: 2,  amount: 440  },
      ],
    }
    const rows = allYears[year] || []
    const totalMlmt = rows.reduce((s, r) => s + r.amount, 0)
    const withdrawals = year === 2024 ? 3200 : year === 2025 ? 6400 : 1300
    return {
      year,
      memberId: userId || 'NV-10042',
      memberName: 'Lars Eriksen',
      nok_rate: NOK_RATE,
      rows: rows.map(r => ({ ...r, nok: Math.round(r.amount * NOK_RATE) })),
      totalMlmt,
      totalNok: Math.round(totalMlmt * NOK_RATE),
      withdrawalsNok: Math.round(withdrawals * NOK_RATE),
      pendingMlmt: year === 2026 ? 280 : 0,
    }
  }
  return request('GET', `/v1/mlm/tax-summary?user_id=${userId}&year=${year}`)
}

export async function importMembers(rows) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 900 + rows.length * 8))
    const imported = []
    const skipped  = []
    const failed   = []
    rows.forEach(row => {
      // Simulate ~5% conflict rate (already exists) based on email hash
      const code = row.email.charCodeAt(0) + row.email.charCodeAt(row.email.length - 1)
      if (code % 20 === 0) {
        skipped.push(row)
      } else {
        imported.push(row)
      }
    })
    return { imported: imported.length, skipped: skipped.length, failed: 0, failedRows: [] }
  }
  return request('POST', '/v1/mlm/admin/members/import', { rows })
}

let CAMPAIGNS_STATE = EMAIL_CAMPAIGNS.map(c => ({ ...c }))

export async function getEmailCampaigns({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    let list = [...CAMPAIGNS_STATE]
    if (status && status !== 'all') list = list.filter(c => c.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q))
    }
    return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/campaigns?${params}`)
}

export async function createEmailCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    const newCamp = {
      id: `camp-${Date.now()}`,
      ...data,
      created_at: now,
      created_by: 'gary@nordic',
      stats: null,
      sent_at: data.status === 'sent' ? now : null,
    }
    CAMPAIGNS_STATE = [newCamp, ...CAMPAIGNS_STATE]
    return newCamp
  }
  return request('POST', '/v1/mlm/admin/campaigns', data)
}

export async function updateEmailCampaign(id, updates) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c => c.id === id ? { ...c, ...updates } : c)
    return CAMPAIGNS_STATE.find(c => c.id === id)
  }
  return request('PATCH', `/v1/mlm/admin/campaigns/${id}`, updates)
}

export async function cancelEmailCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c => c.id === id ? { ...c, status: 'cancelled', scheduled_at: null } : c)
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/cancel`)
}

export async function duplicateEmailCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const source = CAMPAIGNS_STATE.find(c => c.id === id)
    if (!source) throw new Error('Campaign not found')
    const copy = {
      ...source,
      id: `camp-${Date.now()}`,
      name: `Copy of ${source.name}`,
      status: 'draft',
      scheduled_at: null,
      sent_at: null,
      stats: null,
      created_at: new Date().toISOString(),
    }
    CAMPAIGNS_STATE = [copy, ...CAMPAIGNS_STATE]
    return copy
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/duplicate`)
}

export async function sendEmailCampaignNow(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    const camp = CAMPAIGNS_STATE.find(c => c.id === id)
    if (!camp) throw new Error('Campaign not found')
    const now = new Date().toISOString()
    const delivered = camp.recipient_count - Math.floor(camp.recipient_count * 0.01)
    const opened = Math.floor(delivered * (0.45 + Math.random() * 0.25))
    const clicked = Math.floor(opened * (0.35 + Math.random() * 0.2))
    CAMPAIGNS_STATE = CAMPAIGNS_STATE.map(c =>
      c.id === id
        ? { ...c, status: 'sent', sent_at: now, scheduled_at: null, stats: { delivered, opened, clicked, unsubscribed: Math.floor(delivered * 0.005) } }
        : c
    )
    return CAMPAIGNS_STATE.find(c => c.id === id)
  }
  return request('POST', `/v1/mlm/admin/campaigns/${id}/send`)
}

// ── KYC / Identity Verification ──────────────────────────────────────────────

let KYC_STATE = KYC_SUBMISSIONS.map(k => ({ ...k, docs: k.docs.map(d => ({ ...d })) }))

export async function getMyKyc(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const submission = KYC_STATE.find(k => k.userId === userId)
    return submission || { userId, status: 'unverified', submitted_at: null, docs: [] }
  }
  return request('GET', `/v1/mlm/kyc/my`)
}

export async function submitKycDocument(userId, docType, filename) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const now = new Date().toISOString()
    const existing = KYC_STATE.find(k => k.userId === userId)
    const newDoc = { type: docType, label: filename, filename, size_kb: Math.floor(200 + Math.random() * 400), uploaded_at: now, verified: false }
    if (existing) {
      existing.docs = existing.docs.filter(d => d.type !== docType)
      existing.docs.push(newDoc)
      if (existing.status === 'rejected') existing.status = 'draft'
    } else {
      KYC_STATE.push({ id: `kyc-${Date.now()}`, userId, memberId: 'NV-NEW', name: 'Member', email: '', country: '', status: 'draft', submitted_at: null, reviewed_at: null, reviewed_by: null, review_notes: '', docs: [newDoc] })
    }
    return { ok: true }
  }
  return request('POST', '/v1/mlm/kyc/upload', { doc_type: docType, filename })
}

export async function submitKycForReview(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const now = new Date().toISOString()
    const existing = KYC_STATE.find(k => k.userId === userId)
    if (existing) {
      existing.status = 'pending'
      existing.submitted_at = now
    }
    return { ok: true }
  }
  return request('POST', '/v1/mlm/kyc/submit')
}

export async function getAdminKycQueue({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let list = [...KYC_STATE]
    if (status && status !== 'all') list = list.filter(k => k.status === status)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(k => k.name.toLowerCase().includes(q) || k.memberId.toLowerCase().includes(q) || k.email.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const order = { pending: 0, rejected: 1, draft: 2, approved: 3, unverified: 4 }
      return (order[a.status] ?? 5) - (order[b.status] ?? 5)
    })
    return list
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/kyc?${params}`)
}

export async function approveKyc(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'approved', reviewed_at: now, reviewed_by: 'Admin', review_notes: notes || 'Verified.', docs: k.docs.map(d => ({ ...d, verified: true })) }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/approve`, { notes })
}

export async function rejectKyc(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const now = new Date().toISOString()
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'rejected', reviewed_at: now, reviewed_by: 'Admin', review_notes: notes }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/reject`, { notes })
}

export async function requestKycResubmission(id, notes) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    KYC_STATE = KYC_STATE.map(k =>
      k.id === id
        ? { ...k, status: 'rejected', review_notes: notes }
        : k
    )
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/kyc/${id}/resubmit`, { notes })
}

// ── Public affiliate profile (no auth required) ──────────────────────────────
export async function getPublicMemberProfile(refCode) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const m = ADMIN_MEMBERS.find(x => x.id === refCode) || ADMIN_MEMBERS[0]
    // Compute a stable team size from the mock downline tree
    const directCount = ADMIN_MEMBERS.filter(x => x.sponsor === m.id).length
    const totalCount  = ADMIN_MEMBERS.filter(x => x.sponsor === m.id || ADMIN_MEMBERS.some(s => s.id === m.id && x.sponsor === s.id)).length
    return {
      name:       m.name,
      memberId:   m.id,
      rank:       m.rank,
      country:    m.country,
      joinedDate: m.joined,
      directTeam: directCount,
      totalTeam:  Math.max(directCount, totalCount),
      bio:        null,
    }
  }
  return request('GET', `/v1/mlm/public/member/${encodeURIComponent(refCode)}`)
}

// ── Retention & Churn Analytics ───────────────────────────────────────────────
export async function getRetentionStats() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const members = ADMIN_MEMBERS
    const now = new Date()

    // Compute per-member activity score (mock: based on id hash + joined recency)
    const scored = members.map(m => {
      const daysSince = Math.floor((now - new Date(m.joined)) / 86400000)
      const base = ((m.id.charCodeAt(0) * 37 + m.id.charCodeAt(m.id.length - 1) * 13) % 60) + 20
      const recencyBonus = m.rank === 'platinum' ? 25 : m.rank === 'gold' ? 18 : m.rank === 'silver' ? 10 : 0
      const score = Math.min(100, Math.max(0, base + recencyBonus - (daysSince > 180 ? 15 : 0)))
      const lastActive = new Date(now - Math.floor(((100 - score) / 100) * 90 * 86400000)).toISOString().slice(0, 10)
      return { ...m, activityScore: score, lastActive, daysSinceActive: Math.floor((100 - score) / 100 * 90) }
    })

    const activeRate = Math.round((scored.filter(m => m.activityScore >= 40).length / scored.length) * 100)
    const avgScore = Math.round(scored.reduce((s, m) => s + m.activityScore, 0) / scored.length)
    const atRisk = scored.filter(m => m.activityScore < 35).length
    const retention30 = Math.round((scored.filter(m => m.activityScore >= 50).length / scored.length) * 100)

    // Cohort retention data: 4 cohorts, 8 weeks
    const cohorts = ['Jan', 'Feb', 'Mar', 'Apr'].map((month, ci) => {
      const base = 100 - ci * 3
      return { month, weeks: Array.from({ length: 8 }, (_, w) => Math.max(30, Math.round(base - w * (7 + ci))) ) }
    })
    const cohortChart = Array.from({ length: 8 }, (_, w) => {
      const obj = { week: `Wk ${w + 1}` }
      cohorts.forEach(c => { obj[c.month] = c.weeks[w] })
      return obj
    })

    // Activity distribution buckets
    const buckets = [
      { range: '0–20',  count: 0, color: '#ef4444' },
      { range: '21–40', count: 0, color: '#f97316' },
      { range: '41–60', count: 0, color: '#eab308' },
      { range: '61–80', count: 0, color: '#22c55e' },
      { range: '81–100',count: 0, color: '#3b82f6' },
    ]
    scored.forEach(m => {
      if (m.activityScore <= 20) buckets[0].count++
      else if (m.activityScore <= 40) buckets[1].count++
      else if (m.activityScore <= 60) buckets[2].count++
      else if (m.activityScore <= 80) buckets[3].count++
      else buckets[4].count++
    })

    const atRiskMembers = scored
      .filter(m => m.activityScore < 40)
      .sort((a, b) => a.activityScore - b.activityScore)
      .slice(0, 20)
      .map(m => ({
        id: m.id, name: m.name, email: m.email, rank: m.rank,
        activityScore: m.activityScore, lastActive: m.lastActive,
        daysSinceActive: m.daysSinceActive, country: m.country,
        churnRisk: m.activityScore < 20 ? 'High' : m.activityScore < 30 ? 'Medium' : 'Low',
      }))

    const topEngaged = scored
      .filter(m => m.activityScore >= 75)
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10)
      .map(m => ({ id: m.id, name: m.name, rank: m.rank, activityScore: m.activityScore, lastActive: m.lastActive }))

    return { activeRate, retention30, avgScore, atRisk, cohortChart, activityDistribution: buckets, atRiskMembers, topEngaged, totalMembers: members.length }
  }
  return request('GET', '/v1/mlm/admin/retention')
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
const NV_WISHLIST_KEY = 'nv_wishlist'
function _loadWishlistIds() { try { return JSON.parse(localStorage.getItem(NV_WISHLIST_KEY) || '[]') } catch { return [] } }
function _saveWishlistIds(ids) { localStorage.setItem(NV_WISHLIST_KEY, JSON.stringify(ids)) }

export async function getWishlist(userId) {
  if (MOCK) {
    const ids = _loadWishlistIds()
    return { productIds: ids, products: PRODUCTS.filter(p => ids.includes(p.id)) }
  }
  return request('GET', `/v1/mlm/wishlist/${userId}`)
}

export async function addToWishlist(userId, productId) {
  if (MOCK) {
    const ids = _loadWishlistIds()
    if (!ids.includes(productId)) { ids.push(productId); _saveWishlistIds(ids) }
    return { productIds: ids }
  }
  return request('POST', `/v1/mlm/wishlist/${userId}`, { productId })
}

export async function removeFromWishlist(userId, productId) {
  if (MOCK) {
    const ids = _loadWishlistIds().filter(id => id !== productId)
    _saveWishlistIds(ids)
    return { productIds: ids }
  }
  return request('DELETE', `/v1/mlm/wishlist/${userId}/${productId}`)
}

// ── Network Analytics ─────────────────────────────────────────────────────────

export async function getNetworkAnalytics(userId) {
  if (MOCK) return NETWORK_ANALYTICS
  const [summary, levels, growth, contributors, activity] = await Promise.all([
    request('GET', `/v1/mlm/network/${userId}/summary`),
    request('GET', `/v1/mlm/network/${userId}/levels`),
    request('GET', `/v1/mlm/network/${userId}/growth?weeks=12`),
    request('GET', `/v1/mlm/network/${userId}/top-contributors`),
    request('GET', `/v1/mlm/network/${userId}/activity`),
  ])
  return { summary, levelBreakdown: levels, growthWeekly: growth, topContributors: contributors, recentActivity: activity, legBalance: summary.legBalance }
}

// ── Prospect Tracker ──────────────────────────────────────────────────────────

const NV_PROSPECTS_KEY = 'nv_prospects'

function _loadProspects() {
  try { return JSON.parse(localStorage.getItem(NV_PROSPECTS_KEY) || 'null') } catch { return null }
}
function _saveProspects(list) {
  localStorage.setItem(NV_PROSPECTS_KEY, JSON.stringify(list))
}

const MOCK_PROSPECTS = [
  { id: 'p1', name: 'Ingrid Solberg',    contact: 'WhatsApp', stage: 'Interested', phone: '+47 900 11 222', lastContact: '2026-07-28', followUp: '2026-08-01', notes: 'Interested in omega-3 products. Has 3 kids.' },
  { id: 'p2', name: 'Lars Bjørnstad',    contact: 'In Person', stage: 'New',       phone: '+47 901 33 444', lastContact: '2026-07-29', followUp: '2026-07-31', notes: 'Met at gym. Curious about income opportunity.' },
  { id: 'p3', name: 'Marte Haugen',      contact: 'Email',    stage: 'Presented',  phone: '+47 902 55 666', lastContact: '2026-07-25', followUp: '2026-08-03', notes: 'Sent product catalog and comp plan PDF. Awaiting reply.' },
  { id: 'p4', name: 'Kristoffer Dahl',   contact: 'Instagram', stage: 'Enrolled',  phone: '+47 903 77 888', lastContact: '2026-07-20', followUp: null, notes: 'Enrolled Jul 20. Ordered starter pack.' },
  { id: 'p5', name: 'Silje Andreassen',  contact: 'WhatsApp', stage: 'Declined',   phone: '+47 904 99 000', lastContact: '2026-07-15', followUp: null, notes: 'Not interested at this time. Follow up in 3 months.' },
  { id: 'p6', name: 'Tor Eriksen',       contact: 'Phone',    stage: 'Interested', phone: '+47 905 12 345', lastContact: '2026-07-27', followUp: '2026-08-02', notes: 'Wants to try products first before committing.' },
  { id: 'p7', name: 'Anette Moen',       contact: 'Facebook', stage: 'New',        phone: '+47 906 23 456', lastContact: '2026-07-30', followUp: '2026-08-05', notes: 'Reached out via FB group. Interested in health.' },
  { id: 'p8', name: 'Henrik Vold',       contact: 'Email',    stage: 'Presented',  phone: '+47 907 34 567', lastContact: '2026-07-22', followUp: '2026-07-31', notes: 'Had 30-min call. Sharing comp plan with spouse.' },
]

export async function getProspects(userId) {
  if (MOCK) {
    const stored = _loadProspects()
    return stored || MOCK_PROSPECTS
  }
  return request('GET', `/v1/mlm/prospects/${userId}`)
}

export async function createProspect(userId, data) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const newP = { ...data, id: 'p' + Date.now(), stage: data.stage || 'New' }
    const updated = [newP, ...stored]
    _saveProspects(updated)
    return newP
  }
  return request('POST', `/v1/mlm/prospects/${userId}`, data)
}

export async function updateProspect(userId, prospectId, updates) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const updated = stored.map(p => p.id === prospectId ? { ...p, ...updates } : p)
    _saveProspects(updated)
    return updated.find(p => p.id === prospectId)
  }
  return request('PATCH', `/v1/mlm/prospects/${userId}/${prospectId}`, updates)
}

export async function deleteProspect(userId, prospectId) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    _saveProspects(stored.filter(p => p.id !== prospectId))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/prospects/${userId}/${prospectId}`)
}

export async function logProspectInteraction(userId, prospectId, { note, date }) {
  if (MOCK) {
    const stored = _loadProspects() || MOCK_PROSPECTS
    const updated = stored.map(p =>
      p.id === prospectId
        ? { ...p, lastContact: date, notes: note ? `${date}: ${note}\n${p.notes || ''}`.trim() : p.notes }
        : p
    )
    _saveProspects(updated)
    return { ok: true }
  }
  return request('POST', `/v1/mlm/prospects/${userId}/${prospectId}/interactions`, { note, date })
}

// ── Loyalty Points ────────────────────────────────────────────────────────────

const _loyaltyKey = uid => `nv_loyalty_${uid}`

export async function getLoyaltyPoints(userId) {
  if (MOCK) {
    try {
      const raw = localStorage.getItem(_loyaltyKey(userId))
      if (raw) return JSON.parse(raw)
    } catch (_) {}
    return LOYALTY_DATA
  }
  return request('GET', `/v1/mlm/loyalty/${userId}`)
}

export async function redeemLoyaltyPoints(userId, optionId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const option = LOYALTY_DATA.redeemOptions.find(o => o.id === optionId)
    if (!option) throw new Error('Invalid redemption option')
    let data
    try {
      const raw = localStorage.getItem(_loyaltyKey(userId))
      data = raw ? JSON.parse(raw) : { ...LOYALTY_DATA, history: [...LOYALTY_DATA.history] }
    } catch (_) {
      data = { ...LOYALTY_DATA, history: [...LOYALTY_DATA.history] }
    }
    if (data.currentPoints < option.pointsCost) throw new Error('Insufficient points')
    data.currentPoints -= option.pointsCost
    const today = new Date().toISOString().slice(0, 10)
    data.history = [
      { id: `lp-r-${Date.now()}`, date: today, type: 'redeemed', category: option.category, description: `Redeemed: ${option.name}`, points: -option.pointsCost },
      ...data.history,
    ]
    localStorage.setItem(_loyaltyKey(userId), JSON.stringify(data))
    return { success: true, newBalance: data.currentPoints, redemptionCode: `NV-LPR-${Math.random().toString(36).slice(2,8).toUpperCase()}` }
  }
  return request('POST', `/v1/mlm/loyalty/${userId}/redeem`, { optionId })
}

// ── Inventory ─────────────────────────────────────────────────────────────────

const _inventoryKey = 'nv_admin_inventory'
const _movementsKey = 'nv_admin_stock_movements'

function _getInvStore() {
  try { const r = localStorage.getItem(_inventoryKey); if (r) return JSON.parse(r) } catch (_) {}
  return [...INVENTORY]
}
function _getMoveStore() {
  try { const r = localStorage.getItem(_movementsKey); if (r) return JSON.parse(r) } catch (_) {}
  return [...STOCK_MOVEMENTS]
}

export async function getInventory() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return _getInvStore()
  }
  return request('GET', '/v1/mlm/admin/inventory')
}

export async function adjustStock(productId, type, delta, note, batch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const inv = _getInvStore()
    const moves = _getMoveStore()
    const item = inv.find(i => i.id === productId)
    if (!item) throw new Error('Product not found in inventory')
    const appliedDelta = type === 'sale' || type === 'writeoff' ? -Math.abs(delta) : Math.abs(delta)
    item.stock = Math.max(0, item.stock + appliedDelta)
    item.status = item.stock === 0 ? 'out_of_stock' : item.stock <= item.reorderPoint ? 'low_stock' : 'in_stock'
    const today = new Date().toISOString().slice(0, 10)
    moves.unshift({
      id: `sm-${Date.now()}`,
      date: today,
      productId: item.productId,
      productName: item.name,
      sku: item.sku,
      type,
      delta: appliedDelta,
      newBalance: item.stock,
      note: batch ? `${note} (batch: ${batch})` : note,
    })
    try {
      localStorage.setItem(_inventoryKey, JSON.stringify(inv))
      localStorage.setItem(_movementsKey, JSON.stringify(moves))
    } catch (_) {}
    return { success: true, newStock: item.stock }
  }
  return request('POST', `/v1/mlm/admin/inventory/${productId}/adjust`, { type, delta, note, batch })
}

export async function getStockMovements({ productId, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let moves = _getMoveStore()
    if (productId) moves = moves.filter(m => m.productId === productId)
    if (type)      moves = moves.filter(m => m.type === type)
    return moves
  }
  const qs = new URLSearchParams()
  if (productId) qs.set('product_id', productId)
  if (type)      qs.set('type', type)
  return request('GET', `/v1/mlm/admin/inventory/movements?${qs}`)
}

// GDPR / Data Privacy
export async function getMyDataSummary(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      categories: [
        { name: 'Account & Profile', items: ['Name', 'Email', 'Phone', 'Country', 'Password hash'], retained: 'Duration of membership + 5 years' },
        { name: 'Transaction Records', items: ['Orders', 'Commission history', 'Wallet transactions', 'Withdrawals'], retained: '10 years (accounting law)' },
        { name: 'Network & Referrals', items: ['Sponsor ID', 'Downline structure', 'Referral links used'], retained: 'Duration of membership' },
        { name: 'Activity Logs', items: ['Login timestamps', 'Page views (anonymised)', 'Support ticket history'], retained: '12 months' },
        { name: 'Communications', items: ['Email opt-in/out status', 'Notification preferences', 'Announcement reads'], retained: '24 months' },
      ],
      lastExport: null,
      pendingDeletion: false,
    }
  }
  return request('GET', `/v1/mlm/privacy/my-data/${userId}`)
}

export async function requestDataExport(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return { requestId: `exp-${Date.now()}`, estimatedReadyAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString() }
  }
  return request('POST', `/v1/mlm/privacy/export`, { userId })
}

export async function requestAccountDeletion(userId, reason) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { requestId: `del-${Date.now()}`, scheduledAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(), gracePeriodDays: 30 }
  }
  return request('POST', `/v1/mlm/privacy/delete-account`, { userId, reason })
}

export async function updateConsentPreferences(userId, prefs) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { success: true }
  }
  return request('PUT', `/v1/mlm/privacy/consent/${userId}`, prefs)
}

// Admin Notifications
let _mockNotifications = null
function _getNotifStore() {
  if (_mockNotifications) return _mockNotifications
  _mockNotifications = [...ADMIN_NOTIFICATIONS]
  return _mockNotifications
}

export async function getAdminNotifications() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    return [..._getNotifStore()].sort((a, b) => {
      const da = a.sent_at || a.scheduled_at || ''
      const db = b.sent_at || b.scheduled_at || ''
      return db.localeCompare(da)
    })
  }
  return request('GET', '/v1/mlm/admin/notifications')
}

export async function sendNotification({ type, title, body, audience, recipient_count, scheduled_at }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const isScheduled = !!scheduled_at
    const notif = {
      id: `notif-${Date.now()}`,
      type,
      title,
      body,
      audience,
      recipient_count,
      read_count: 0,
      status: isScheduled ? 'scheduled' : 'sent',
      sent_at:      isScheduled ? undefined  : new Date().toISOString(),
      scheduled_at: isScheduled ? scheduled_at : undefined,
    }
    _getNotifStore().unshift(notif)
    return notif
  }
  return request('POST', '/v1/mlm/admin/notifications', { type, title, body, audience, scheduled_at })
}

export async function cancelNotification(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const store = _getNotifStore()
    const idx = store.findIndex(n => n.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], status: 'cancelled' }
    return { success: true }
  }
  return request('POST', `/v1/mlm/admin/notifications/${id}/cancel`)
}

export async function getAdminFinancials() {
  if (MOCK) return FINANCIAL_DATA
  return request('GET', '/v1/mlm/admin/financials')
}

// Daily Activity Tracker
const ACTIVITY_STORAGE_KEY = 'nv_activity_log'
function _getActivityStore(userId) {
  try {
    const raw = localStorage.getItem(`${ACTIVITY_STORAGE_KEY}_${userId}`)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* ignore */ }
  return [...ACTIVITY_LOG]
}
function _saveActivityStore(userId, store) {
  try { localStorage.setItem(`${ACTIVITY_STORAGE_KEY}_${userId}`, JSON.stringify(store)) } catch (_) { /* ignore */ }
}

export async function getActivityLog(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return { log: _getActivityStore(userId), goals: ACTIVITY_GOALS }
  }
  return request('GET', `/v1/mlm/activity/${userId}`)
}

export async function saveActivityDay(userId, date, counts) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getActivityStore(userId)
    const idx = store.findIndex(d => d.date === date)
    if (idx !== -1) {
      store[idx] = { ...store[idx], ...counts }
    } else {
      store.unshift({ date, calls: 0, presentations: 0, followUps: 0, prospectsAdded: 0, enrollments: 0, shares: 0, ...counts })
    }
    _saveActivityStore(userId, store)
    return { success: true }
  }
  return request('POST', `/v1/mlm/activity/${userId}`, { date, ...counts })
}

export async function getActivityGoals(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const raw = localStorage.getItem(`nv_activity_goals_${userId}`)
    return raw ? JSON.parse(raw) : { ...ACTIVITY_GOALS }
  }
  return request('GET', `/v1/mlm/activity/${userId}/goals`)
}

export async function saveActivityGoals(userId, goals) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    try { localStorage.setItem(`nv_activity_goals_${userId}`, JSON.stringify(goals)) } catch (_) { /* ignore */ }
    return { success: true }
  }
  return request('PUT', `/v1/mlm/activity/${userId}/goals`, goals)
}

// ─── Launch Checklist ────────────────────────────────────────────────────────
const LAUNCH_STORAGE_KEY = 'nv_launch_checklist'

const DEFAULT_CHECKLIST = [
  // Infrastructure
  { id: 'infra-1', category: 'infrastructure', label: 'Vercel production deployment configured', description: 'Project connected to GitHub, auto-deploy on main branch push', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'infra-2', category: 'infrastructure', label: 'Custom domain connected', description: 'e.g. nordicvitals.no — add to Vercel + DNS records updated', owner: 'both', status: 'not_started', notes: '', link: null },
  { id: 'infra-3', category: 'infrastructure', label: 'Environment variables set in Vercel', description: 'VITE_MLM_API_URL, VITE_MLM_API_KEY, VITE_SITE_URL', owner: 'gary', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'infra-4', category: 'infrastructure', label: 'SSL/HTTPS verified on live domain', description: 'Check that https:// is active and no mixed-content warnings', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'infra-5', category: 'infrastructure', label: 'PWA service worker active on production', description: 'Visit live site → DevTools → Application → Service Workers', owner: 'gary', status: 'not_started', notes: '', link: null },

  // API & Integrations
  { id: 'api-1', category: 'api', label: 'Arctico API base URL configured', description: 'Enter base URL in Admin → Integrations → Arctico API section', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-2', category: 'api', label: 'Arctico API key entered and connection tested', description: 'Use the "Test Connection" button — must return green status badge', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-3', category: 'api', label: 'Payment gateway enabled (Stripe/Klarna/Vipps)', description: 'At least one gateway active with live credentials', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-4', category: 'api', label: 'Outgoing webhooks configured for key events', description: 'commission_run, member_enrolled, payout_processed at minimum', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },
  { id: 'api-5', category: 'api', label: 'Transactional email delivery verified', description: 'Send test email from Email Templates for welcome + commission_run', owner: 'gary', status: 'not_started', notes: '', link: '/admin/email-templates' },

  // Legal & Compliance
  { id: 'legal-1', category: 'legal', label: 'Privacy Policy reviewed and approved', description: 'Legal review of /privacy page content — Bjørn to sign off', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'legal-2', category: 'legal', label: 'Terms & Conditions reviewed and approved', description: 'Legal review of /terms page content — Bjørn to sign off', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'legal-3', category: 'legal', label: 'Income Disclosure Statement (IDS) published', description: 'Verify IDS tab in Compliance Center is accurate before launch', owner: 'both', status: 'not_started', notes: '', link: '/admin/compliance' },
  { id: 'legal-4', category: 'legal', label: 'GDPR cookie consent banner active', description: 'Verify banner appears on first visit at /. nv_cookie_consent in localStorage', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'legal-5', category: 'legal', label: 'Compliance checklist completed', description: 'All 19 items in Compliance Center → Checklist tab marked Done', owner: 'both', status: 'not_started', notes: '', link: '/admin/compliance' },

  // Products & Inventory
  { id: 'prod-1', category: 'products', label: 'Product catalog finalized', description: 'Descriptions, taglines and categories approved for all 6 SKUs', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-2', category: 'products', label: 'Pricing confirmed (retail + member prices)', description: 'NOK retail and member prices set and margin reviewed', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-3', category: 'products', label: 'Product images uploaded and approved', description: 'High-res images for all 6 products in shop + product detail pages', owner: 'gary', status: 'not_started', notes: '', link: '/admin/products' },
  { id: 'prod-4', category: 'products', label: 'Initial inventory stock entered', description: 'Opening stock counts in Admin → Inventory for all SKUs', owner: 'gary', status: 'not_started', notes: '', link: '/admin/inventory' },

  // Commission & Payouts
  { id: 'comm-1', category: 'commission', label: 'MLM plan type selected and configured', description: 'Binary/Unilevel/Breakaway — rates and rank thresholds set', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/plan' },
  { id: 'comm-2', category: 'commission', label: 'Dry-run commission preview completed', description: 'Run a preview with test members — verify per-member payouts look correct', owner: 'both', status: 'not_started', notes: '', link: '/admin/commission-preview' },
  { id: 'comm-3', category: 'commission', label: 'Minimum payout threshold set', description: 'Confirm minimum withdrawal amount in Settings', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/settings' },
  { id: 'comm-4', category: 'commission', label: 'Withdrawal methods configured', description: 'Bank Transfer / SEPA / Crypto options confirmed active', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/integrations' },

  // Member Experience
  { id: 'mem-1', category: 'member', label: 'Admin accounts created for Gary + Bjørn', description: 'Both admins can log in with correct roles in Roles & Permissions', owner: 'bjorn', status: 'not_started', notes: '', link: '/admin/roles' },
  { id: 'mem-2', category: 'member', label: 'Onboarding wizard tested end-to-end', description: 'Create a test member account and complete the 7-step wizard', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'mem-3', category: 'member', label: 'KYC verification workflow enabled', description: 'Submit a test KYC doc and approve it through admin queue', owner: 'gary', status: 'not_started', notes: '', link: '/admin/kyc' },
  { id: 'mem-4', category: 'member', label: 'At least 5 test member accounts enrolled', description: 'Creates realistic data for tree, commission preview, and leaderboard', owner: 'both', status: 'not_started', notes: '', link: '/admin/import' },

  // Marketing
  { id: 'mkt-1', category: 'marketing', label: 'Landing page copy approved', description: 'Product claims, testimonials, and CTAs reviewed by Bjørn', owner: 'bjorn', status: 'not_started', notes: '', link: null },
  { id: 'mkt-2', category: 'marketing', label: 'Social media accounts ready', description: 'Instagram/Facebook/TikTok for Nordic Vitals — bios + profile pics set', owner: 'gary', status: 'not_started', notes: '', link: null },
  { id: 'mkt-3', category: 'marketing', label: 'Launch announcement drafted', description: 'First broadcast to members created in Admin → Announcements', owner: 'both', status: 'not_started', notes: '', link: '/admin/announcements' },
  { id: 'mkt-4', category: 'marketing', label: 'Referral campaign active', description: 'Test a full referral: /ref/<memberId> → /join?ref= → enrolled', owner: 'gary', status: 'not_started', notes: '', link: '/admin/referrals' },
]

function _getLaunchStore() {
  try {
    const raw = localStorage.getItem(LAUNCH_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) { /* ignore */ }
  return DEFAULT_CHECKLIST.map(i => ({ ...i }))
}
function _saveLaunchStore(store) {
  try { localStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(store)) } catch (_) { /* ignore */ }
}

// ── Product Bundles ──────────────────────────────────────────────────────
const BUNDLES_KEY = 'nv_bundles'
function _getBundleStore() {
  try { const d = localStorage.getItem(BUNDLES_KEY); if (d) return JSON.parse(d) } catch {}
  return BUNDLES.map(b => ({ ...b }))
}
function _saveBundleStore(data) {
  try { localStorage.setItem(BUNDLES_KEY, JSON.stringify(data)) } catch {}
}

export async function getBundles({ activeOnly = false } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getBundleStore()
    return activeOnly ? store.filter(b => b.active) : store
  }
  return request('GET', `/v1/mlm/admin/bundles${activeOnly ? '?active=true' : ''}`)
}

export async function createBundle(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const store = _getBundleStore()
    const newBundle = { ...data, id: Date.now(), totalSold: 0, createdAt: new Date().toISOString().slice(0,10), active: true }
    store.push(newBundle)
    _saveBundleStore(store)
    return newBundle
  }
  return request('POST', '/v1/mlm/admin/bundles', data)
}

export async function updateBundle(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getBundleStore()
    const idx = store.findIndex(b => b.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...patch }
    _saveBundleStore(store)
    return idx !== -1 ? store[idx] : null
  }
  return request('PATCH', `/v1/mlm/admin/bundles/${id}`, patch)
}

export async function deleteBundle(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _saveBundleStore(_getBundleStore().filter(b => b.id !== id))
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/bundles/${id}`)
}

export async function toggleBundleActive(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const store = _getBundleStore()
    const idx = store.findIndex(b => b.id === id)
    if (idx !== -1) store[idx].active = !store[idx].active
    _saveBundleStore(store)
    return { active: idx !== -1 ? store[idx].active : false }
  }
  return request('POST', `/v1/mlm/admin/bundles/${id}/toggle`)
}

export async function getLaunchChecklist() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return _getLaunchStore()
  }
  return request('GET', '/v1/mlm/admin/launch-checklist')
}

export async function updateLaunchItem(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    const store = _getLaunchStore()
    const idx = store.findIndex(i => i.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...patch }
    _saveLaunchStore(store)
    return { success: true }
  }
  return request('PATCH', `/v1/mlm/admin/launch-checklist/${id}`, patch)
}

export async function getMyReferralStats(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return {
      totalClicks: 124,
      totalSignups: 12,
      conversionRate: 9.7,
      activeFromLink: 8,
      thisMonthClicks: 37,
      thisMonthSignups: 3,
      topReferralCountry: 'Norway',
      lifetimeEarned: 840,
    }
  }
  return request('GET', `/v1/mlm/referrals/stats/${userId}`)
}

export async function trackReferralShare(userId, platform) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    return { success: true }
  }
  return request('POST', `/v1/mlm/referrals/share`, { userId, platform })
}

const _NOTIF_PREFS_KEY = 'nv_notification_prefs'

function _getNotifPrefsStore(userId) {
  try {
    const raw = localStorage.getItem(`${_NOTIF_PREFS_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function _saveNotifPrefsStore(userId, prefs) {
  try { localStorage.setItem(`${_NOTIF_PREFS_KEY}_${userId}`, JSON.stringify(prefs)) } catch {}
}

export async function getNotificationPrefs(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return _getNotifPrefsStore(userId) || null
  }
  return request('GET', `/v1/mlm/members/${userId}/notification-prefs`)
}

export async function saveNotificationPrefs(userId, prefs) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _saveNotifPrefsStore(userId, prefs)
    return { success: true }
  }
  return request('PUT', `/v1/mlm/members/${userId}/notification-prefs`, prefs)
}

// ── Team Broadcast ───────────────────────────────────────────────────────────
const _BROADCAST_KEY = 'nv_team_broadcasts'

function _getBroadcastStore(userId) {
  try {
    const raw = localStorage.getItem(`${_BROADCAST_KEY}_${userId}`)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}
function _saveBroadcastStore(userId, data) {
  try { localStorage.setItem(`${_BROADCAST_KEY}_${userId}`, JSON.stringify(data)) } catch {}
}

function _getFullDownline(sponsorId, all, depth = 0, maxDepth = 10) {
  if (depth >= maxDepth) return []
  const directs = all.filter(m => m.sponsor === sponsorId)
  return directs.flatMap(m => [m, ..._getFullDownline(m.id, all, depth + 1, maxDepth)])
}

export async function getTeamBroadcastRecipients(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const memberId = ADMIN_MEMBERS.find(m => m.id === userId) ? userId
      : (ADMIN_MEMBERS.find(m => m.id === 'NV-10042') ? 'NV-10042' : null)
    const direct = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const full = _getFullDownline(memberId, ADMIN_MEMBERS)
    return {
      direct: direct.map(m => ({ id: m.id, name: m.name, rank: m.rank, status: m.status })),
      full: full.map(m => ({ id: m.id, name: m.name, rank: m.rank, status: m.status })),
    }
  }
  return request('GET', `/v1/mlm/team/${userId}/broadcast-recipients`)
}

export async function sendTeamBroadcast(userId, { subject, body, audience }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const store = _getBroadcastStore(userId)
    const memberId = ADMIN_MEMBERS.find(m => m.id === userId) ? userId : 'NV-10042'
    const all = _getFullDownline(memberId, ADMIN_MEMBERS)
    const direct = ADMIN_MEMBERS.filter(m => m.sponsor === memberId)
    const recipients = audience === 'direct' ? direct : all
    const entry = {
      id: `bcast-${Date.now()}`,
      subject,
      body,
      audience,
      recipientCount: recipients.length,
      sentAt: new Date().toISOString(),
      status: 'delivered',
    }
    store.unshift(entry)
    _saveBroadcastStore(userId, store)
    return { success: true, recipientCount: recipients.length, broadcastId: entry.id }
  }
  return request('POST', `/v1/mlm/team/${userId}/broadcast`, { subject, body, audience })
}

export async function getTeamBroadcasts(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return _getBroadcastStore(userId)
  }
  return request('GET', `/v1/mlm/team/${userId}/broadcasts`)
}

export async function getSocialProofEvents() {
  if (MOCK) {
    const { SOCIAL_PROOF_EVENTS } = await import('../data/mock.js')
    return SOCIAL_PROOF_EVENTS
  }
  return request('GET', '/v1/mlm/public/social-proof')
}

const _CHALLENGES_KEY = 'nv_challenges'
function _getChallengeStore() {
  try { return JSON.parse(localStorage.getItem(_CHALLENGES_KEY)) || [...CHALLENGES] } catch { return [...CHALLENGES] }
}
function _saveChallengeStore(data) {
  try { localStorage.setItem(_CHALLENGES_KEY, JSON.stringify(data)) } catch {}
}

export async function getChallenges() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    return _getChallengeStore()
  }
  return request('GET', '/v1/mlm/admin/challenges')
}

export async function createChallenge(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const store = _getChallengeStore()
    const entry = { ...data, id: `chal-${Date.now()}`, participant_count: 0, winner_announced: false, winner_id: null, created_at: new Date().toISOString() }
    store.unshift(entry)
    _saveChallengeStore(store)
    return entry
  }
  return request('POST', '/v1/mlm/admin/challenges', data)
}

export async function updateChallenge(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const store = _getChallengeStore()
    const idx = store.findIndex(c => c.id === id)
    if (idx !== -1) store[idx] = { ...store[idx], ...data }
    _saveChallengeStore(store)
    return store[idx]
  }
  return request('PATCH', `/v1/mlm/admin/challenges/${id}`, data)
}

export async function deleteChallenge(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const store = _getChallengeStore().filter(c => c.id !== id)
    _saveChallengeStore(store)
    return { success: true }
  }
  return request('DELETE', `/v1/mlm/admin/challenges/${id}`)
}

export async function getChallengeLeaderboard(challengeId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    return CHALLENGE_LEADERBOARDS[challengeId] || []
  }
  return request('GET', `/v1/mlm/challenges/${challengeId}/leaderboard`)
}

export async function getMyChallenges(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    const store = _getChallengeStore()
    const active = store.filter(c => c.status === 'active' || c.status === 'upcoming')
    const IS_LARS = !userId || userId === 'NV-10002'
    return active.map(c => {
      const lb = CHALLENGE_LEADERBOARDS[c.id] || []
      const myEntry = IS_LARS ? lb.find(e => e.member_id === 'NV-10002') : null
      const myValue = myEntry ? myEntry.value : 0
      const myRank  = myEntry ? myEntry.rank : null
      const myPct   = myEntry ? myEntry.progress_pct : 0
      return { ...c, my_value: myValue, my_rank: myRank, my_progress_pct: myPct }
    })
  }
  return request('GET', `/v1/mlm/member/${userId}/challenges`)
}

// ── Exchange Rates ────────────────────────────────────────────────────────────
const RATES_KEY = 'nv_exchange_rates'

function loadRates() {
  try {
    const stored = localStorage.getItem(RATES_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return EXCHANGE_RATES
}

function saveRates(data) {
  try { localStorage.setItem(RATES_KEY, JSON.stringify(data)) } catch {}
}

export async function getExchangeRates() {
  await delay(200)
  if (!MOCK) return request('GET', '/v1/mlm/admin/exchange-rates')
  return loadRates()
}

export async function updateExchangeRate({ mlmt_nok, mlmt_eur, mlmt_usd, note, effective_date }) {
  await delay(300)
  if (!MOCK) return request('POST', '/v1/mlm/admin/exchange-rates', { mlmt_nok, mlmt_eur, mlmt_usd, note, effective_date })
  const stored = loadRates()
  const now = new Date().toISOString()
  const id = `er-${Date.now()}`
  const newEntry = {
    id,
    effective_date: effective_date || now.slice(0, 10),
    mlmt_nok: parseFloat(mlmt_nok),
    mlmt_eur: parseFloat(mlmt_eur),
    mlmt_usd: parseFloat(mlmt_usd),
    changed_by: 'Gary',
    note: note || '',
  }
  const updated = {
    current: {
      mlmt_nok: parseFloat(mlmt_nok),
      mlmt_eur: parseFloat(mlmt_eur),
      mlmt_usd: parseFloat(mlmt_usd),
      updated_at: now,
      updated_by: 'Gary',
      source: 'manual',
    },
    history: [newEntry, ...stored.history].slice(0, 20),
  }
  saveRates(updated)
  return updated
}

export function readCurrentMlmtToNok() {
  try {
    const stored = localStorage.getItem(RATES_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.current?.mlmt_nok ?? 1.15
    }
  } catch {}
  return 1.15
}

// ── Storefront Banners ────────────────────────────────────────────────────────
const BANNERS_KEY = 'nv_banners'

function _loadBanners() {
  try {
    const s = localStorage.getItem(BANNERS_KEY)
    if (s) return JSON.parse(s)
  } catch {}
  return BANNERS
}

function _saveBanners(data) {
  try { localStorage.setItem(BANNERS_KEY, JSON.stringify(data)) } catch {}
}

export async function getAdminBanners() {
  await delay(180)
  if (!MOCK) return request('GET', '/v1/mlm/admin/banners')
  return _loadBanners()
}

export async function getActiveBanners(page) {
  await delay(100)
  if (!MOCK) return request('GET', `/v1/mlm/banners/active?page=${page}`)
  const today = new Date().toISOString().slice(0, 10)
  const all = _loadBanners()
  return all.filter(b =>
    b.active &&
    (!b.start_date || b.start_date <= today) &&
    (!b.end_date   || b.end_date   >= today) &&
    (b.pages.includes('all') || b.pages.includes(page))
  )
}

export async function createBanner(data) {
  await delay(250)
  if (!MOCK) return request('POST', '/v1/mlm/admin/banners', data)
  const banners = _loadBanners()
  const newBanner = {
    id: `ban-${Date.now()}`,
    created_at: new Date().toISOString(),
    dismiss_count: 0,
    impression_count: 0,
    ...data,
  }
  _saveBanners([newBanner, ...banners])
  return newBanner
}

export async function updateBanner(id, data) {
  await delay(220)
  if (!MOCK) return request('PATCH', `/v1/mlm/admin/banners/${id}`, data)
  const banners = _loadBanners().map(b => b.id === id ? { ...b, ...data } : b)
  _saveBanners(banners)
  return banners.find(b => b.id === id)
}

export async function deleteBanner(id) {
  await delay(200)
  if (!MOCK) return request('DELETE', `/v1/mlm/admin/banners/${id}`)
  const banners = _loadBanners().filter(b => b.id !== id)
  _saveBanners(banners)
  return { ok: true }
}

export async function toggleBannerActive(id, active) {
  return updateBanner(id, { active })
}

// ── Revenue & Growth Forecast ─────────────────────────────────────────────────
export async function getAdminForecast({ horizon = 6, recruitRate = 8, avgOrder = 950 } = {}) {
  if (!MOCK) return request('GET', `/v1/mlm/admin/forecast?horizon=${horizon}&recruit_rate=${recruitRate}&avg_order=${avgOrder}`)

  // Historical actuals (last 3 months, fixed)
  const HISTORICAL = [
    { month: 'May 26', members: 38, revenue: 28500,  commission: 8700,  cogs: 11400 },
    { month: 'Jun 26', members: 44, revenue: 33200,  commission: 10100, cogs: 13280 },
    { month: 'Jul 26', members: 52, revenue: 41600,  commission: 12650, cogs: 16640 },
  ]

  // Project forward from current state
  const MULTIPLIERS = { conservative: 0.6, base: 1.0, optimistic: 1.6 }
  const COGS_RATE   = 0.40  // 40% of revenue = COGS
  const COMM_RATE   = { conservative: 0.28, base: 0.31, optimistic: 0.34 } // scaling with size

  let cumulativeProfit = { conservative: -5000, base: -5000, optimistic: -5000 }

  const months = []

  // Include last 3 historical months
  HISTORICAL.forEach(h => {
    const scenarios = {}
    Object.keys(MULTIPLIERS).forEach(sc => {
      const commission = h.commission
      const revenue    = h.revenue
      const cogs       = h.cogs
      const netProfit  = revenue - commission - cogs
      cumulativeProfit[sc] += netProfit
      scenarios[sc] = {
        members:    h.members,
        revenue,
        commission,
        cogs,
        netProfit,
        commRatio:  (commission / revenue) * 100,
        cumProfit:  cumulativeProfit[sc],
      }
    })
    months.push({ month: h.month, projected: false, scenarios })
  })

  // Generate projected months
  let baseMembers = HISTORICAL[HISTORICAL.length - 1].members
  const MONTH_NAMES = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  let monthIdx = 0

  for (let i = 0; i < horizon; i++) {
    const label = MONTH_NAMES[monthIdx % 12] + ' ' + (26 + Math.floor((7 + monthIdx) / 12))
    monthIdx++

    const scenarios = {}
    Object.entries(MULTIPLIERS).forEach(([sc, mult]) => {
      const newMembers = Math.round(recruitRate * mult)
      const scMembers  = baseMembers + newMembers * (sc === 'conservative' ? 0.6 : sc === 'optimistic' ? 1.6 : 1.0)
      const ordersPerMember = 0.65 // avg orders per member per month
      const revenue    = Math.round(scMembers * ordersPerMember * avgOrder * mult)
      const cogs       = Math.round(revenue * COGS_RATE)
      const commRateVal = COMM_RATE[sc] + (i * 0.003) // ratio grows slightly as team deepens
      const commission = Math.round(revenue * Math.min(commRateVal, 0.55))
      const netProfit  = revenue - commission - cogs
      cumulativeProfit[sc] += netProfit
      scenarios[sc] = {
        members:   Math.round(scMembers),
        revenue,
        commission,
        cogs,
        netProfit,
        commRatio: (commission / revenue) * 100,
        cumProfit: cumulativeProfit[sc],
      }
    })

    if (scenarios.base) baseMembers = scenarios.base.members

    months.push({ month: label, projected: true, scenarios })
  }

  // KPI summary per scenario
  const kpi = {}
  Object.keys(MULTIPLIERS).forEach(sc => {
    const projRows = months.filter(m => m.projected)
    const totalRevenue    = projRows.reduce((s, m) => s + m.scenarios[sc].revenue, 0)
    const totalCommission = projRows.reduce((s, m) => s + m.scenarios[sc].commission, 0)
    const totalCogs       = projRows.reduce((s, m) => s + m.scenarios[sc].cogs, 0)
    const avgCommRatio    = projRows.length ? projRows.reduce((s, m) => s + m.scenarios[sc].commRatio, 0) / projRows.length : 0
    const startMembers    = HISTORICAL[0].members
    const endMembers      = projRows.length ? projRows[projRows.length - 1].scenarios[sc].members : startMembers

    // Find break-even month (cumulative profit turns positive)
    let breakEvenMonth = null
    let cum = HISTORICAL.reduce((s, h) => s + h.revenue - h.commission - h.cogs, -5000)
    for (const m of projRows) {
      cum += m.scenarios[sc].netProfit
      if (cum >= 0 && !breakEvenMonth) { breakEvenMonth = m.month; break }
    }

    kpi[sc] = { totalRevenue, totalCommission, totalCogs, avgCommRatio, startMembers, endMembers, breakEvenMonth }
  })

  return { months, kpi }
}

// ── Team Performance Report ───────────────────────────────────────────────────

export async function getTeamReport(userId, period = 'month') {
  if (MOCK) {
    const all = ADMIN_MEMBERS
    // Build downline via BFS from sponsor chain
    const levelMap = {}
    const queue = [{ id: userId, level: 0 }]
    while (queue.length) {
      const { id, level } = queue.shift()
      const directs = all.filter(m => m.sponsor === id)
      directs.forEach(m => {
        if (levelMap[m.id] === undefined) {
          levelMap[m.id] = level + 1
          queue.push({ id: m.id, level: level + 1 })
        }
      })
    }
    const teamMembers = all
      .filter(m => levelMap[m.id] !== undefined)
      .map(m => ({ ...m, level: levelMap[m.id] }))

    // Simulate period-based data deterministically
    const PERIOD_MULT = { week: 0.25, month: 1, last_month: 0.9 }
    const mult = PERIOD_MULT[period] ?? 1

    // Team commissions: ~18% of team GV
    const totalTeamGV = teamMembers.reduce((s, m) => s + m.gv, 0)
    const teamCommissions = Math.round(totalTeamGV * 0.18 * mult)

    // New recruits this period (simulate based on period)
    const newRecruits = period === 'week' ? 1 : period === 'last_month' ? 3 : 2
    const recruitNames = ['Ingrid Bakken', 'Tor Gresseth', 'Camilla Neset']
    const recentRecruits = recruitNames.slice(0, newRecruits).map((name, i) => ({
      id: `NV-10${300 + i}`, name,
      joinedAgo: period === 'week' ? `${i + 2} days ago` : `${6 + i * 5} days ago`,
      sponsor: teamMembers[i % teamMembers.length]?.name ?? 'Unknown',
    }))

    // Rank-ups this period
    const rankUps = period === 'week' ? [] : [
      { name: 'Mia Andersen', from: 'Unranked', to: 'Bronze', daysAgo: 8 },
      ...(period === 'month' ? [{ name: 'Sigrid Voss', from: 'Bronze', to: 'Silver', daysAgo: 22 }] : []),
    ]

    // At-risk members (inactive or low PV)
    const atRisk = teamMembers.filter(m => m.status === 'Inactive' || m.pv < 50)

    // Top performers by GV
    const topPerformers = [...teamMembers]
      .sort((a, b) => b.gv - a.gv)
      .slice(0, 5)
      .map(m => ({
        id: m.id, name: m.name, rank: m.rank, gv: Math.round(m.gv * mult),
        pv: Math.round(m.pv * mult), level: m.level,
        commEarned: Math.round(m.gv * 0.05 * mult),
      }))

    // Commission breakdown by bonus type
    const commBreakdown = [
      { type: 'Sponsor Bonus',       amount: Math.round(teamCommissions * 0.28), color: '#c9a84c' },
      { type: 'Pairing Bonus',       amount: Math.round(teamCommissions * 0.38), color: '#3b82f6' },
      { type: 'Level Commission',    amount: Math.round(teamCommissions * 0.22), color: '#22c55e' },
      { type: 'Override / Pool',     amount: Math.round(teamCommissions * 0.12), color: '#a78bfa' },
    ]

    // Weekly sparkline (8 weeks of commission flow, ending now)
    const weeklyData = Array.from({ length: 8 }, (_, i) => ({
      week: `W${i + 1}`,
      commissions: Math.round((teamCommissions / 4) * (0.6 + Math.sin(i * 0.9) * 0.4 + i * 0.05)),
      recruits: i === 3 ? 1 : i === 6 ? 1 : 0,
    }))

    return {
      period,
      teamSize: teamMembers.length,
      activeCount: teamMembers.filter(m => m.status === 'Active').length,
      totalTeamGV: Math.round(totalTeamGV * mult),
      totalTeamPV: Math.round(teamMembers.reduce((s, m) => s + m.pv, 0) * mult),
      teamCommissions,
      newRecruits: recentRecruits.length,
      recentRecruits,
      rankUps,
      atRisk,
      topPerformers,
      commBreakdown,
      weeklyData,
    }
  }
  const params = new URLSearchParams({ period })
  return request('GET', `/v1/mlm/team-report/${userId}?${params}`)
}

// ── Member Earnings Forecast ──────────────────────────────────────────────────

export async function getMemberForecast(userId, { horizon = 6, recruitsPerMonth = null } = {}) {
  if (!MOCK) {
    const params = new URLSearchParams({ horizon, ...(recruitsPerMonth != null && { recruits_per_month: recruitsPerMonth }) })
    return request('GET', `/v1/mlm/forecast/${userId}?${params}`)
  }

  const me = ADMIN_MEMBERS.find(m => m.id === userId) || ADMIN_MEMBERS[0]
  const RANK_ORDER = ['Unranked', 'Bronze', 'Silver', 'Gold', 'Platinum']
  const RANK_REQS = {
    Unranked: { pv: 0,   leftGV: 0,    rightGV: 0,   recruits: 0 },
    Bronze:   { pv: 100, leftGV: 500,  rightGV: 500,  recruits: 2 },
    Silver:   { pv: 200, leftGV: 1500, rightGV: 1500, recruits: 5 },
    Gold:     { pv: 300, leftGV: 4000, rightGV: 4000, recruits: 10 },
    Platinum: { pv: 500, leftGV: 10000,rightGV: 10000,recruits: 20 },
  }
  const COMM_RATES = { Unranked: 0.10, Bronze: 0.14, Silver: 0.18, Gold: 0.22, Platinum: 0.27 }

  const currentRankIdx = RANK_ORDER.indexOf(me.rank) === -1 ? 0 : RANK_ORDER.indexOf(me.rank)
  const nextRankIdx    = Math.min(currentRankIdx + 1, RANK_ORDER.length - 1)
  const nextRank       = RANK_ORDER[nextRankIdx]

  // Historical actuals (last 3 months, synthetic from member stats)
  const basePV    = me.pv   || 150
  const baseGV    = me.gv   || 1200
  const baseComm  = Math.round(baseGV * COMM_RATES[me.rank || 'Bronze'])
  const HISTORICAL = [
    { month: 'May 26', pv: Math.round(basePV * 0.82), gv: Math.round(baseGV * 0.78), commission: Math.round(baseComm * 0.76), recruits: 1 },
    { month: 'Jun 26', pv: Math.round(basePV * 0.91), gv: Math.round(baseGV * 0.89), commission: Math.round(baseComm * 0.88), recruits: 1 },
    { month: 'Jul 26', pv: basePV,                    gv: baseGV,                    commission: baseComm,                    recruits: 2 },
  ]

  // Default recruit rate from historical avg
  const defaultRecruits = recruitsPerMonth != null ? recruitsPerMonth : 2
  const SCENARIOS = {
    current:     { recruitMult: 1.0, pvMult: 1.03, label: 'Current Pace',   color: '#3b82f6' },
    accelerated: { recruitMult: 1.8, pvMult: 1.08, label: 'Accelerated',    color: '#c9a84c' },
  }

  const MONTH_NAMES = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

  // Track running state per scenario for rank progression
  const state = {
    current:     { pv: basePV, gv: baseGV, recruits: me.recruits || 3, rank: me.rank || 'Bronze' },
    accelerated: { pv: basePV, gv: baseGV, recruits: me.recruits || 3, rank: me.rank || 'Bronze' },
  }

  const months = []

  // Include historical
  HISTORICAL.forEach(h => {
    months.push({ month: h.month, projected: false, current: h.commission, accelerated: h.commission, pv: h.pv, gv: h.gv })
  })

  let rankUpMonth = { current: null, accelerated: null }
  let nextRankReqs = RANK_REQS[nextRank] || RANK_REQS['Platinum']

  // Project forward
  for (let i = 0; i < horizon; i++) {
    const label = MONTH_NAMES[i % 12] + ' ' + (26 + Math.floor((7 + i) / 12))
    const row = { month: label, projected: true }

    Object.entries(SCENARIOS).forEach(([sc, cfg]) => {
      const newRecruits = Math.round(defaultRecruits * cfg.recruitMult)
      state[sc].recruits += newRecruits
      state[sc].pv       = Math.round(state[sc].pv * cfg.pvMult)
      state[sc].gv       = Math.round(state[sc].gv * cfg.pvMult * (1 + newRecruits * 0.05))

      // Check rank-up
      if (state[sc].rank !== 'Platinum') {
        const req = RANK_REQS[nextRank]
        if (
          state[sc].pv >= req.pv &&
          state[sc].gv * 0.45 >= req.leftGV &&
          state[sc].gv * 0.55 >= req.rightGV &&
          state[sc].recruits >= req.recruits
        ) {
          if (!rankUpMonth[sc]) rankUpMonth[sc] = label
          state[sc].rank = nextRank
        }
      }

      const commRate = COMM_RATES[state[sc].rank]
      row[sc] = Math.round(state[sc].gv * commRate)
    })

    months.push(row)
  }

  // KPIs
  const projMonths = months.filter(m => m.projected)
  const nextMonthEarnings = {
    current:     projMonths[0]?.current     || 0,
    accelerated: projMonths[0]?.accelerated || 0,
  }
  const sixMonthTotal = {
    current:     projMonths.reduce((s, m) => s + (m.current || 0), 0),
    accelerated: projMonths.reduce((s, m) => s + (m.accelerated || 0), 0),
  }

  // Rank progress toward next rank (current scenario, end of horizon)
  const endState = state.current
  const progressToNext = nextRank === 'Platinum' && me.rank === 'Platinum' ? null : {
    rank:     nextRank,
    pvPct:    Math.min(100, Math.round((endState.pv / nextRankReqs.pv) * 100)),
    gvPct:    Math.min(100, Math.round(((endState.gv * 0.45) / nextRankReqs.leftGV) * 100)),
    recPct:   Math.min(100, Math.round((endState.recruits / nextRankReqs.recruits) * 100)),
    pvNeed:   Math.max(0, nextRankReqs.pv - endState.pv),
    gvNeed:   Math.max(0, nextRankReqs.leftGV - Math.round(endState.gv * 0.45)),
    recNeed:  Math.max(0, nextRankReqs.recruits - endState.recruits),
    rankUpMonthCurrent:     rankUpMonth.current,
    rankUpMonthAccelerated: rankUpMonth.accelerated,
  }

  // Action recommendations
  const actions = []
  if (me.pv < 200)  actions.push({ icon: '📦', text: `Add ${200 - me.pv} PV of personal orders this month to reach Silver PV threshold` })
  if ((me.recruits || 3) < 5) actions.push({ icon: '👥', text: `Recruit ${5 - (me.recruits || 3)} more direct members to qualify for Silver rank` })
  actions.push({ icon: '🔗', text: 'Share your referral link on 3 social platforms to boost sign-up rate' })
  actions.push({ icon: '🎯', text: 'Re-engage 1–2 inactive downline members to increase group volume' })
  if (me.rank === 'Bronze' || me.rank === 'Unranked') {
    actions.push({ icon: '🛒', text: 'Set up an Autoship subscription to lock in consistent monthly PV' })
  }

  return {
    months,
    nextMonthEarnings,
    sixMonthTotal,
    progressToNext,
    currentRank: me.rank || 'Bronze',
    nextRank,
    currentPV:      basePV,
    currentGV:      baseGV,
    currentRecruits: me.recruits || 3,
    defaultRecruits,
    actions,
    scenarios: SCENARIOS,
  }
}

// ── Direct Messages ───────────────────────────────────────────────────────────

let _convState = null
let _msgState  = null

function initMsgState() {
  if (_convState) return
  const saved = localStorage.getItem('nv_conversations')
  const savedMsgs = localStorage.getItem('nv_direct_messages')
  _convState = saved     ? JSON.parse(saved)     : JSON.parse(JSON.stringify(CONVERSATIONS))
  _msgState  = savedMsgs ? JSON.parse(savedMsgs) : JSON.parse(JSON.stringify(DIRECT_MESSAGES))
}

function saveMsgState() {
  localStorage.setItem('nv_conversations', JSON.stringify(_convState))
  localStorage.setItem('nv_direct_messages', JSON.stringify(_msgState))
}

export async function getConversations(userId) {
  if (MOCK) {
    initMsgState()
    const convs = _convState
      .filter(c => c.participant_ids.includes(userId) || c.participant_ids.includes('admin'))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
    return convs.map(c => ({
      ...c,
      unread_count: (c.unread_by && c.unread_by[userId]) || 0,
      partner: c.participants.find(p => p.id !== userId) || c.participants[0],
    }))
  }
  return request('GET', `/v1/mlm/messages/${userId}/conversations`)
}

export async function getConversation(conversationId, userId) {
  if (MOCK) {
    initMsgState()
    const conv = _convState.find(c => c.id === conversationId)
    const messages = (_msgState[conversationId] || []).sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    )
    return { conv, messages }
  }
  return request('GET', `/v1/mlm/messages/${userId}/conversations/${conversationId}`)
}

export async function sendDirectMessage(conversationId, senderId, senderName, body) {
  if (MOCK) {
    initMsgState()
    const msg = {
      id:              `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id:       senderId,
      sender_name:     senderName,
      body,
      sent_at:         new Date().toISOString(),
      read_by:         [senderId],
    }
    if (!_msgState[conversationId]) _msgState[conversationId] = []
    _msgState[conversationId].push(msg)
    const conv = _convState.find(c => c.id === conversationId)
    if (conv) {
      conv.last_message    = body.slice(0, 80)
      conv.last_message_at = msg.sent_at
      conv.participant_ids.forEach(pid => {
        if (pid !== senderId) {
          conv.unread_by = conv.unread_by || {}
          conv.unread_by[pid] = (conv.unread_by[pid] || 0) + 1
        }
      })
    }
    saveMsgState()
    return msg
  }
  return request('POST', `/v1/mlm/messages/${senderId}/conversations/${conversationId}/send`, { body })
}

export async function markConversationRead(conversationId, userId) {
  if (MOCK) {
    initMsgState()
    const conv = _convState.find(c => c.id === conversationId)
    if (conv && conv.unread_by) conv.unread_by[userId] = 0
    const msgs = _msgState[conversationId] || []
    msgs.forEach(m => { if (!m.read_by.includes(userId)) m.read_by.push(userId) })
    saveMsgState()
    return { ok: true }
  }
  return request('POST', `/v1/mlm/messages/${userId}/conversations/${conversationId}/read`)
}

export async function startConversation(userId, userName, partnerId, partnerName, partnerRole, subject, body) {
  if (MOCK) {
    initMsgState()
    const convId = `conv-${Date.now()}`
    const newConv = {
      id:   convId,
      participant_ids: [userId, partnerId],
      participants: [
        { id: userId,    name: userName,    role: 'member',     avatar: userName.split(' ').map(w => w[0]).join('').slice(0,2) },
        { id: partnerId, name: partnerName, role: partnerRole,  avatar: partnerName.split(' ').map(w => w[0]).join('').slice(0,2) },
      ],
      subject,
      last_message:    body.slice(0, 80),
      last_message_at: new Date().toISOString(),
      unread_by:       { [partnerId]: 1 },
      created_at:      new Date().toISOString(),
    }
    _convState.unshift(newConv)
    _msgState[convId] = [{
      id:              `msg-${Date.now()}`,
      conversation_id: convId,
      sender_id:       userId,
      sender_name:     userName,
      body,
      sent_at:         new Date().toISOString(),
      read_by:         [userId],
    }]
    saveMsgState()
    return newConv
  }
  return request('POST', `/v1/mlm/messages/${userId}/conversations`, { partner_id: partnerId, subject, body })
}

// Admin messaging
export async function getAdminConversations(search = '') {
  if (MOCK) {
    initMsgState()
    let convs = JSON.parse(JSON.stringify(_convState))
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
    if (search) {
      const q = search.toLowerCase()
      convs = convs.filter(c =>
        c.participants.some(p => p.name.toLowerCase().includes(q)) ||
        c.subject.toLowerCase().includes(q)
      )
    }
    return convs.map(c => ({
      ...c,
      unread_count: Object.values(c.unread_by || {}).reduce((s, v) => s + v, 0),
      member: c.participants.find(p => p.role === 'member') || c.participants[0],
    }))
  }
  return request('GET', '/v1/mlm/admin/messages')
}

export async function sendAdminMessage(conversationId, body) {
  return sendDirectMessage(conversationId, 'admin', 'Nordic Vitals', body)
}

export async function startAdminConversation(memberId, memberName, subject, body) {
  return startConversation('admin', 'Nordic Vitals', memberId, memberName, 'member', subject, body)
}

// ── Social Activity Feed ──────────────────────────────────────────────────────

const SOCIAL_STORAGE_KEY = 'nv_social_reactions'

function loadReactions() {
  try { return JSON.parse(localStorage.getItem(SOCIAL_STORAGE_KEY) || '{}') } catch { return {} }
}

function saveReactions(data) {
  localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(data))
}

export async function getSocialFeed({ typeFilter = 'all', page = 1, pageSize = 10 } = {}) {
  if (MOCK) {
    const myReactions = loadReactions()
    let events = JSON.parse(JSON.stringify(SOCIAL_EVENTS))
    if (typeFilter !== 'all') events = events.filter(e => e.type === typeFilter)
    const total = events.length
    const slice = events.slice((page - 1) * pageSize, page * pageSize)
    return {
      events: slice.map(e => ({
        ...e,
        reactions: { ...e.reactions, ...(myReactions[e.id] ? {} : {}) },
        myReaction: myReactions[e.id] || null,
      })),
      total,
      hasMore: page * pageSize < total,
    }
  }
  const params = new URLSearchParams({ type: typeFilter, page, page_size: pageSize })
  return request('GET', `/v1/mlm/social/feed?${params}`)
}

export async function reactToSocialEvent(eventId, emoji) {
  if (MOCK) {
    const myReactions = loadReactions()
    const prev = myReactions[eventId]
    if (prev === emoji) {
      delete myReactions[eventId]
    } else {
      myReactions[eventId] = emoji
    }
    saveReactions(myReactions)
    return { eventId, myReaction: myReactions[eventId] || null }
  }
  return request('POST', `/v1/mlm/social/feed/${eventId}/react`, { emoji })
}

// ── System Status ──────────────────────────────────────────────────────────────

const _systemStatusState = {
  data: JSON.parse(JSON.stringify(SYSTEM_STATUS)),
  incidents: JSON.parse(JSON.stringify(INCIDENT_LOG)),
}

export async function getSystemStatus() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return JSON.parse(JSON.stringify(_systemStatusState.data))
  }
  return request('GET', '/v1/mlm/admin/system-status')
}

export async function getIncidentLog() {
  if (MOCK) {
    return JSON.parse(JSON.stringify(_systemStatusState.incidents))
  }
  return request('GET', '/v1/mlm/admin/incidents')
}

export async function resolveIncident(incidentId) {
  if (MOCK) {
    const inc = _systemStatusState.incidents.find(i => i.id === incidentId)
    if (inc) {
      inc.status = 'resolved'
      inc.resolved_at = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    }
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/incidents/${incidentId}/resolve`, {})
}

export async function createMaintenanceWindow(form) {
  if (MOCK) {
    const window = {
      id: `mw-${Date.now()}`,
      title: form.title,
      component: form.component,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      description: form.description || '',
    }
    _systemStatusState.data.maintenance_windows.push(window)
    return window
  }
  return request('POST', '/v1/mlm/admin/maintenance-windows', form)
}

// ── Achievement Certificates ──────────────────────────────────────────────────

export async function getCertificates(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return CERTIFICATES.map(c => ({ ...c, recipient_name: userId ? c.recipient_name : c.recipient_name }))
  }
  return request('GET', `/v1/mlm/certificates/${userId}`)
}

// ── Retail Customers ──────────────────────────────────────────────────────────

let _retailCustomers = RETAIL_CUSTOMERS.map(c => ({ ...c, notes: [] }))

export async function getRetailCustomers({ search = '', tag = 'all' } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    let list = _retailCustomers
    if (tag !== 'all') list = list.filter(c => c.tags.includes(tag))
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    }
    return list
  }
  return request('GET', '/v1/mlm/admin/retail-customers', { search, tag })
}

export async function getRetailCustomerDetail(customerId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    const orders = RETAIL_CUSTOMER_ORDERS[customerId] || []
    return { ...customer, orders }
  }
  return request('GET', `/v1/mlm/admin/retail-customers/${customerId}`)
}

export async function addRetailCustomerNote(customerId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    const entry = { id: `note-${Date.now()}`, text: note, created_at: new Date().toISOString(), author: 'Admin' }
    customer.notes = [entry, ...(customer.notes || [])]
    return entry
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/notes`, { note })
}

export async function convertCustomerToMember(customerId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const customer = _retailCustomers.find(c => c.id === customerId)
    if (!customer) throw new Error('Customer not found')
    customer.tags = [...new Set([...customer.tags, 'converted'])]
    const newMemberId = `NV-${Math.floor(10000 + Math.random() * 90000)}`
    return { ok: true, member_id: newMemberId, email: customer.email }
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/convert`, {})
}

export async function sendCustomerEmail(customerId, { subject, body }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { ok: true, sent_at: new Date().toISOString() }
  }
  return request('POST', `/v1/mlm/admin/retail-customers/${customerId}/email`, { subject, body })
}

// ── Payment Methods (saved withdrawal accounts + payment cards) ───────────────
const PM_KEY = 'nv_payment_methods'

function loadPM(userId) {
  try {
    const stored = localStorage.getItem(`${PM_KEY}_${userId}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { withdrawalAccounts: [...PAYMENT_METHODS.withdrawalAccounts], paymentCards: [...PAYMENT_METHODS.paymentCards] }
}

function savePM(userId, data) {
  try { localStorage.setItem(`${PM_KEY}_${userId}`, JSON.stringify(data)) } catch {}
  return data
}

export async function getPaymentMethods(userId) {
  if (MOCK) return loadPM(userId)
  return request('GET', `/v1/mlm/payment-methods/${userId}`)
}

export async function addPaymentMethod(userId, { tab, ...fields }) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    const id = `${tab === 'withdrawal' ? 'wa' : 'pc'}-${Date.now()}`
    const list = data[listKey]
    const isDefault = list.length === 0
    list.push({ ...fields, id, isDefault, addedAt: new Date().toISOString().slice(0, 10) })
    return savePM(userId, data)
  }
  return request('POST', `/v1/mlm/payment-methods/${userId}`, { tab, ...fields })
}

export async function updatePaymentMethod(userId, methodId, { tab, ...fields }) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    data[listKey] = data[listKey].map(m => m.id === methodId ? { ...m, ...fields, id: methodId } : m)
    return savePM(userId, data)
  }
  return request('PATCH', `/v1/mlm/payment-methods/${userId}/${methodId}`, { tab, ...fields })
}

export async function deletePaymentMethod(userId, methodId, tab) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    const list = data[listKey].filter(m => m.id !== methodId)
    if (list.length > 0 && !list.some(m => m.isDefault)) list[0] = { ...list[0], isDefault: true }
    data[listKey] = list
    return savePM(userId, data)
  }
  return request('DELETE', `/v1/mlm/payment-methods/${userId}/${methodId}?tab=${tab}`)
}

export async function setDefaultPaymentMethod(userId, methodId, tab) {
  if (MOCK) {
    const data = loadPM(userId)
    const listKey = tab === 'withdrawal' ? 'withdrawalAccounts' : 'paymentCards'
    data[listKey] = data[listKey].map(m => ({ ...m, isDefault: m.id === methodId }))
    return savePM(userId, data)
  }
  return request('POST', `/v1/mlm/payment-methods/${userId}/${methodId}/set-default`, { tab })
}

// ── Fast Start Bonus ──────────────────────────────────────────────────────────
const FS_KEY = 'nv_fast_start'

function loadFS(userId) {
  try {
    const stored = localStorage.getItem(`${FS_KEY}_${userId}`)
    if (stored) return JSON.parse(stored)
  } catch {}
  return JSON.parse(JSON.stringify(FAST_START_PROGRESS))
}

function saveFS(userId, data) {
  try { localStorage.setItem(`${FS_KEY}_${userId}`, JSON.stringify(data)) } catch {}
  return data
}

export async function getFastStartProgress(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return { tiers: FAST_START_TIERS, progress: loadFS(userId) }
  }
  return request('GET', `/v1/mlm/fast-start/${userId}`)
}

export async function claimFastStartBonus(userId, tierId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const data = loadFS(userId)
    data.tiers = data.tiers.map(t =>
      t.tierId === tierId ? { ...t, status: 'claimed', claimedAt: new Date().toISOString().slice(0, 10) } : t
    )
    saveFS(userId, data)
    const tier = FAST_START_TIERS.find(t => t.id === tierId)
    return { ok: true, bonusMlmt: tier?.bonusMlmt ?? 0 }
  }
  return request('POST', `/v1/mlm/fast-start/${userId}/claim`, { tierId })
}

export async function getFastStartLeaderboard() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return FAST_START_LEADERBOARD
  }
  return request('GET', '/v1/mlm/fast-start/leaderboard')
}

// ── Commission Appeals ────────────────────────────────────────────────────────
const APPEALS_KEY = 'nv_commission_appeals'

function loadAppeals() {
  try {
    const stored = localStorage.getItem(APPEALS_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return JSON.parse(JSON.stringify(COMMISSION_APPEALS))
}

function saveAppeals(data) {
  try { localStorage.setItem(APPEALS_KEY, JSON.stringify(data)) } catch {}
  return data
}

export async function getAppealQueue(filters = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let appeals = loadAppeals()
    if (filters.status && filters.status !== 'all') {
      appeals = appeals.filter(a => a.status === filters.status)
    }
    if (filters.search) {
      const q = filters.search.toLowerCase()
      appeals = appeals.filter(a =>
        a.memberName.toLowerCase().includes(q) ||
        a.memberId.toLowerCase().includes(q) ||
        a.commissionRunId.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    }
    return appeals.sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))
  }
  const params = new URLSearchParams(filters).toString()
  return request('GET', `/v1/mlm/admin/appeals?${params}`)
}

export async function getMyAppeals(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const appeals = loadAppeals()
    return appeals
      .filter(a => a.memberId === 'NV-10042')
      .sort((a, b) => new Date(b.filedAt) - new Date(a.filedAt))
  }
  return request('GET', `/v1/mlm/appeals/${userId}`)
}

export async function submitAppeal(userId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const appeals = loadAppeals()
    const newId = `APP-${String(100 + appeals.length).padStart(3, '0')}`
    const newAppeal = {
      id: newId,
      memberId: 'NV-10042',
      memberName: 'Lars Eriksen',
      memberEmail: 'lars.eriksen@example.no',
      commissionRunId: data.commissionRunId,
      commissionRunDate: data.commissionRunDate || new Date().toISOString().slice(0, 10),
      category: data.category,
      disputedAmount: Number(data.disputedAmount) || 0,
      expectedAmount: Number(data.expectedAmount) || 0,
      explanation: data.explanation,
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'open',
      priority: 'medium',
      notes: [{ author: 'Lars Eriksen', role: 'member', text: data.explanation, ts: new Date().toISOString() }],
      resolution: null,
    }
    appeals.unshift(newAppeal)
    saveAppeals(appeals)
    return newAppeal
  }
  return request('POST', `/v1/mlm/appeals/${userId}`, data)
}

export async function addAppealNote(appealId, note) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const appeals = loadAppeals()
    const idx = appeals.findIndex(a => a.id === appealId)
    if (idx === -1) throw new Error('Appeal not found')
    appeals[idx].notes.push({ author: 'Admin', role: 'admin', text: note, ts: new Date().toISOString() })
    appeals[idx].updatedAt = new Date().toISOString()
    if (appeals[idx].status === 'open') appeals[idx].status = 'under_review'
    saveAppeals(appeals)
    return appeals[idx]
  }
  return request('POST', `/v1/mlm/admin/appeals/${appealId}/note`, { note })
}

export async function resolveAppeal(appealId, decision) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const appeals = loadAppeals()
    const idx = appeals.findIndex(a => a.id === appealId)
    if (idx === -1) throw new Error('Appeal not found')
    const statusMap = { upheld: 'resolved_upheld', adjusted: 'resolved_adjusted', rejected: 'resolved_rejected' }
    appeals[idx].status = statusMap[decision.verdict] || 'resolved_upheld'
    appeals[idx].resolution = {
      decision: decision.verdict,
      adjustedAmount: decision.adjustedAmount || null,
      correctionAmount: decision.correctionAmount || 0,
      resolvedAt: new Date().toISOString(),
      resolvedBy: 'Admin',
      note: decision.note,
    }
    appeals[idx].notes.push({
      author: 'Admin',
      role: 'admin',
      text: `Appeal resolved (${decision.verdict}): ${decision.note}`,
      ts: new Date().toISOString(),
    })
    appeals[idx].updatedAt = new Date().toISOString()
    saveAppeals(appeals)
    return appeals[idx]
  }
  return request('POST', `/v1/mlm/admin/appeals/${appealId}/resolve`, decision)
}

// ── Returns & Refunds ────────────────────────────────────────────────────────

const RETURNS_KEY = 'nv_return_requests'

function loadReturns() {
  try {
    const stored = JSON.parse(localStorage.getItem(RETURNS_KEY) || 'null')
    if (stored) return stored
  } catch {}
  return [...RETURN_REQUESTS]
}

function saveReturns(list) {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(list))
}

export async function getAdminReturns({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    let items = loadReturns()
    if (status && status !== 'all') items = items.filter(r => r.status === status)
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(r =>
        r.memberName.toLowerCase().includes(q) ||
        r.orderId.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    }
    return items
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (search) params.set('search', search)
  return request('GET', `/v1/mlm/admin/returns?${params}`)
}

export async function getMyReturns(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadReturns()
    return all.filter(r => r.memberId === userId)
  }
  return request('GET', `/v1/mlm/returns/${userId}`)
}

export async function submitReturn(userId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadReturns()
    const id = `RET-${String(all.length + 1).padStart(4, '0')}`
    const newReturn = {
      id,
      orderId: data.orderId,
      memberId: userId,
      memberName: data.memberName || 'Member',
      memberEmail: data.memberEmail || '',
      items: data.items || [],
      orderTotal: data.orderTotal || 0,
      refundAmount: null,
      reason: data.reason,
      description: data.description,
      status: 'pending',
      filedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pvDeducted: null,
      adminNote: '',
      resolvedAt: null,
      resolvedBy: null,
    }
    all.unshift(newReturn)
    saveReturns(all)
    return newReturn
  }
  return request('POST', `/v1/mlm/returns/${userId}`, data)
}

export async function cancelReturn(returnId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadReturns()
    const idx = all.findIndex(r => r.id === returnId)
    if (idx === -1) throw new Error('Return not found')
    all[idx].status = 'cancelled'
    all[idx].updatedAt = new Date().toISOString()
    saveReturns(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/returns/${returnId}/cancel`)
}

export async function reviewReturn(returnId, { action, adminNote, refundAmount }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadReturns()
    const idx = all.findIndex(r => r.id === returnId)
    if (idx === -1) throw new Error('Return not found')
    const statusMap = { approve: 'approved', reject: 'rejected', review: 'under_review' }
    all[idx].status = statusMap[action] || action
    all[idx].adminNote = adminNote || ''
    if (action === 'approve') {
      all[idx].refundAmount = refundAmount ?? all[idx].orderTotal
      all[idx].resolvedAt = new Date().toISOString()
      all[idx].resolvedBy = 'Admin'
    } else if (action === 'reject') {
      all[idx].refundAmount = 0
      all[idx].resolvedAt = new Date().toISOString()
      all[idx].resolvedBy = 'Admin'
    }
    all[idx].updatedAt = new Date().toISOString()
    saveReturns(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/admin/returns/${returnId}/review`, { action, adminNote, refundAmount })
}

// ── GDPR Data Subject Requests ───────────────────────────────────────────────

const GDPR_KEY = 'nv_gdpr_requests'
function loadGdpr() {
  try { return JSON.parse(localStorage.getItem(GDPR_KEY)) || GDPR_REQUESTS } catch { return GDPR_REQUESTS }
}
function saveGdpr(data) {
  try { localStorage.setItem(GDPR_KEY, JSON.stringify(data)) } catch {}
}

export async function getGdprRequests({ status, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    let all = loadGdpr()
    if (status && status !== 'all') all = all.filter(r => r.status === status)
    if (type && type !== 'all') all = all.filter(r => r.type === type)
    return all
  }
  const params = new URLSearchParams()
  if (status && status !== 'all') params.set('status', status)
  if (type && type !== 'all') params.set('type', type)
  return request('GET', `/v1/mlm/admin/gdpr?${params}`)
}

export async function getGdprRequestDetail(requestId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const all = loadGdpr()
    return all.find(r => r.id === requestId) || null
  }
  return request('GET', `/v1/mlm/admin/gdpr/${requestId}`)
}

export async function processGdprRequest(requestId, { action, adminNote, denyReason, extendedDeadline }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadGdpr()
    const idx = all.findIndex(r => r.id === requestId)
    if (idx === -1) throw new Error('Request not found')
    const statusMap = {
      fulfill: 'fulfilled',
      deny: 'denied',
      start_processing: 'processing',
      extend: all[idx].status,
    }
    const now = new Date().toISOString()
    const prev = all[idx]
    const entry = {
      ts: now,
      actor: 'Admin',
      action: action === 'fulfill'
        ? 'Request marked fulfilled.'
        : action === 'deny'
          ? `Request denied. Reason: ${denyReason || 'not specified'}.`
          : action === 'start_processing'
            ? 'Status updated to Processing.'
            : `Deadline extended to ${extendedDeadline}.`,
    }
    all[idx] = {
      ...prev,
      status: statusMap[action] || prev.status,
      adminNote: adminNote ?? prev.adminNote,
      processedAt: action === 'fulfill' || action === 'deny' ? now : prev.processedAt,
      processedBy: action === 'fulfill' || action === 'deny' ? 'Admin' : prev.processedBy,
      denyReason: action === 'deny' ? (denyReason || 'not_specified') : prev.denyReason,
      extendedDeadline: action === 'extend' ? extendedDeadline : prev.extendedDeadline,
      auditTrail: [...prev.auditTrail, entry],
    }
    saveGdpr(all)
    return all[idx]
  }
  return request('POST', `/v1/mlm/admin/gdpr/${requestId}/process`, { action, adminNote, denyReason, extendedDeadline })
}

export async function generateDataExport(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    return {
      downloadUrl: `#mock-export-${memberId}-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      sizeKb: Math.floor(Math.random() * 200) + 50,
      fileName: `nordic-vitals-data-${memberId}-${new Date().toISOString().slice(0, 10)}.zip`,
    }
  }
  return request('POST', `/v1/mlm/admin/gdpr/export`, { memberId })
}

export async function submitMemberGdprRequest(userId, { type, description }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const all = loadGdpr()
    const now = new Date().toISOString()
    const deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const newReq = {
      id: `GDPR-${String(all.length + 1).padStart(4, '0')}`,
      type,
      memberName: 'Member',
      memberId: userId,
      memberEmail: '',
      submittedAt: now,
      deadline,
      status: 'pending',
      description,
      adminNote: '',
      processedAt: null,
      processedBy: null,
      denyReason: null,
      extendedDeadline: null,
      auditTrail: [
        { ts: now, actor: 'member', action: 'Request submitted via Data Privacy Centre.' },
      ],
    }
    all.unshift(newReq)
    saveGdpr(all)
    return newReq
  }
  return request('POST', `/v1/mlm/gdpr/${userId}`, { type, description })
}

// ─── Blog API ───────────────────────────────────────────────────────────────

const BLOG_KEY = 'nv_blog_posts'
function loadBlog() {
  try { return JSON.parse(localStorage.getItem(BLOG_KEY)) || BLOG_POSTS } catch { return [...BLOG_POSTS] }
}
function saveBlog(posts) { try { localStorage.setItem(BLOG_KEY, JSON.stringify(posts)) } catch {} }

export async function getBlogPosts({ category, search, limit } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let posts = loadBlog().filter(p => p.status === 'published')
    if (category && category !== 'All') posts = posts.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    posts = posts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    if (limit) posts = posts.slice(0, limit)
    return posts
  }
  const params = new URLSearchParams()
  if (category && category !== 'All') params.set('category', category)
  if (search) params.set('search', search)
  if (limit) params.set('limit', limit)
  return request('GET', `/v1/blog?${params}`)
}

export async function getBlogPost(slug) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const post = loadBlog().find(p => p.slug === slug && p.status === 'published')
    if (!post) throw new Error('Post not found')
    return post
  }
  return request('GET', `/v1/blog/${slug}`)
}

export async function getAdminBlogPosts() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    return loadBlog().sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  }
  return request('GET', '/v1/admin/blog')
}

export async function createBlogPost(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadBlog()
    const newPost = {
      ...data,
      id: `bp-${String(all.length + 1).padStart(3, '0')}`,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readMinutes: Math.max(1, Math.ceil(data.body.split(' ').length / 200)),
    }
    all.unshift(newPost)
    saveBlog(all)
    return newPost
  }
  return request('POST', '/v1/admin/blog', data)
}

export async function updateBlogPost(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const all = loadBlog()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Post not found')
    all[idx] = { ...all[idx], ...data, updatedAt: new Date().toISOString(), readMinutes: Math.max(1, Math.ceil((data.body || all[idx].body).split(' ').length / 200)) }
    saveBlog(all)
    return all[idx]
  }
  return request('PUT', `/v1/admin/blog/${id}`, data)
}

export async function deleteBlogPost(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadBlog().filter(p => p.id !== id)
    saveBlog(all)
    return { ok: true }
  }
  return request('DELETE', `/v1/admin/blog/${id}`)
}

export async function toggleBlogPostStatus(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadBlog()
    const idx = all.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Post not found')
    all[idx] = { ...all[idx], status: all[idx].status === 'published' ? 'draft' : 'published', updatedAt: new Date().toISOString() }
    saveBlog(all)
    return all[idx]
  }
  return request('PATCH', `/v1/admin/blog/${id}/toggle`)
}
