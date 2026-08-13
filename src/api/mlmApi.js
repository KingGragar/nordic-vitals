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
  NEWSLETTER_SUBSCRIBERS,
  MEMBER_SEGMENTS,
  SHIPPING_ZONES,
  MEMBERSHIP_FEE_CONFIG,
  SUBSCRIPTION_PLANS,
  MEMBER_SUBSCRIPTIONS,
  PRICE_LISTS,
  PRICE_OVERRIDES,
  SMS_CAMPAIGNS,
  SMS_STATS,
  MEMBER_VOUCHERS,
  MEMBER_WEBINARS,
  MEMBER_WEBINAR_RECORDINGS,
  PUSH_CAMPAIGNS,
  PUSH_STATS,
  MEMBER_PAYOUTS,
  API_KEYS,
  API_KEY_SCOPES,
  API_KEY_STATS,
  TERRITORIES,
  MEMBER_REFERRAL_LINKS,
  MEMBER_REFERRAL_LINK_STATS,
  MEMBER_ACHIEVEMENTS,
  INFLUENCERS,
  INFLUENCER_STATS,
  INFLUENCER_TIERS,
  INFLUENCER_PLATFORMS,
  COMMISSION_STATEMENTS,
  COMMISSION_STATEMENT_SUMMARY,
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

// ─── Newsletter Subscribers ───────────────────────────────────────────────────

const NL_KEY = 'nv_newsletter_subscribers'
function loadSubs() {
  try { return JSON.parse(localStorage.getItem(NL_KEY)) || [...NEWSLETTER_SUBSCRIBERS] } catch { return [...NEWSLETTER_SUBSCRIBERS] }
}
function saveSubs(data) { try { localStorage.setItem(NL_KEY, JSON.stringify(data)) } catch {} }

export async function subscribeNewsletter({ email, name = '', source = 'landing', segments = ['blog'], consent = true }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    const all = loadSubs()
    const existing = all.find(s => s.email.toLowerCase() === email.toLowerCase())
    if (existing) {
      if (existing.status === 'unsubscribed') {
        existing.status = 'active'
        existing.unsubscribed_at = null
        existing.consented_at = new Date().toISOString()
        saveSubs(all)
        return { ok: true, resubscribed: true }
      }
      return { ok: true, already: true }
    }
    const next = {
      id: `ns-${String(all.length + 1).padStart(3, '0')}`,
      email, name, source, status: 'active', segments,
      consented_at: consent ? new Date().toISOString() : null,
      unsubscribed_at: null, opens: 0, clicks: 0,
    }
    all.push(next)
    saveSubs(all)
    return { ok: true, resubscribed: false, already: false }
  }
  return request('POST', '/v1/newsletter/subscribe', { email, name, source, segments, consent })
}

export async function getNewsletterSubscribers({ status, source, segment, search, page = 1, limit = 20 } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let rows = loadSubs()
    if (status && status !== 'all') rows = rows.filter(s => s.status === status)
    if (source && source !== 'all') rows = rows.filter(s => s.source === source)
    if (segment && segment !== 'all') rows = rows.filter(s => s.segments.includes(segment))
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(s => s.email.toLowerCase().includes(q) || (s.name || '').toLowerCase().includes(q))
    }
    rows = [...rows].sort((a, b) => new Date(b.consented_at) - new Date(a.consented_at))
    const total = rows.length
    const items = rows.slice((page - 1) * limit, page * limit)
    const allSubs = loadSubs()
    const active = allSubs.filter(s => s.status === 'active').length
    const thisMonth = allSubs.filter(s => {
      const d = new Date(s.consented_at)
      const now = new Date()
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    return { items, total, page, pages: Math.ceil(total / limit), stats: { total: allSubs.length, active, unsubscribed: allSubs.length - active, thisMonth } }
  }
  return request('GET', '/v1/newsletter/subscribers', { status, source, segment, search, page, limit })
}

export async function updateSubscriberStatus(id, status) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadSubs()
    const idx = all.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Subscriber not found')
    all[idx].status = status
    if (status === 'unsubscribed') all[idx].unsubscribed_at = new Date().toISOString()
    else all[idx].unsubscribed_at = null
    saveSubs(all)
    return all[idx]
  }
  return request('PATCH', `/v1/newsletter/subscribers/${id}`, { status })
}

export async function deleteNewsletterSubscriber(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = loadSubs().filter(s => s.id !== id)
    saveSubs(all)
    return { ok: true }
  }
  return request('DELETE', `/v1/newsletter/subscribers/${id}`)
}

export async function unsubscribeNewsletter(token) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const all = loadSubs()
    const decoded = atob(token || '')
    const idx = all.findIndex(s => s.email === decoded)
    if (idx === -1) return { ok: false, error: 'invalid_token' }
    all[idx].status = 'unsubscribed'
    all[idx].unsubscribed_at = new Date().toISOString()
    saveSubs(all)
    return { ok: true, email: all[idx].email }
  }
  return request('POST', `/v1/newsletter/unsubscribe`, { token })
}

export async function addNewsletterSubscriberManual({ email, name, source = 'manual', segments = ['blog'] }) {
  return subscribeNewsletter({ email, name, source, segments, consent: true })
}

// ── Smart Segments ─────────────────────────────────────────────────────────────
const SEGMENTS_KEY = 'nv_member_segments'
function loadSegments() {
  try { const s = localStorage.getItem(SEGMENTS_KEY); return s ? JSON.parse(s) : [...MEMBER_SEGMENTS] } catch { return [...MEMBER_SEGMENTS] }
}
function saveSegments(segs) {
  try { localStorage.setItem(SEGMENTS_KEY, JSON.stringify(segs)) } catch {}
}

function applySegmentRules(members, rules, logic) {
  return members.filter(m => {
    const results = rules.map(rule => {
      const mv = m[rule.field]
      switch (rule.op) {
        case 'equals':   return String(mv).toLowerCase() === String(rule.value).toLowerCase()
        case 'not_equals': return String(mv).toLowerCase() !== String(rule.value).toLowerCase()
        case 'gte':      return Number(mv) >= Number(rule.value)
        case 'lte':      return Number(mv) <= Number(rule.value)
        case 'in':       return Array.isArray(rule.value) ? rule.value.map(v => v.toLowerCase()).includes(String(mv).toLowerCase()) : false
        case 'not_in':   return Array.isArray(rule.value) ? !rule.value.map(v => v.toLowerCase()).includes(String(mv).toLowerCase()) : true
        case 'joined_after':  return new Date(m.joined) >= new Date(rule.value)
        case 'joined_before': return new Date(m.joined) <= new Date(rule.value)
        default: return true
      }
    })
    return logic === 'ANY' ? results.some(Boolean) : results.every(Boolean)
  })
}

export async function getSegments() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return loadSegments()
  }
  return request('GET', '/v1/mlm/admin/segments')
}

export async function previewSegment({ rules, logic }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const members = ADMIN_MEMBERS
    const matched = rules.length === 0 ? members : applySegmentRules(members, rules, logic || 'ALL')
    return { memberCount: matched.length, members: matched.slice(0, 5) }
  }
  return request('POST', '/v1/mlm/admin/segments/preview', { rules, logic })
}

export async function createSegment({ name, description, rules, logic }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const segs = loadSegments()
    const matched = rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, rules, logic || 'ALL')
    const seg = {
      id: `seg-${Date.now()}`,
      name,
      description: description || '',
      rules,
      logic: logic || 'ALL',
      memberCount: matched.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    segs.unshift(seg)
    saveSegments(segs)
    return seg
  }
  return request('POST', '/v1/mlm/admin/segments', { name, description, rules, logic })
}

export async function updateSegment(id, updates) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const segs = loadSegments()
    const idx = segs.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Segment not found')
    const rules = updates.rules || segs[idx].rules
    const logic = updates.logic || segs[idx].logic
    const matched = rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, rules, logic)
    segs[idx] = { ...segs[idx], ...updates, memberCount: matched.length, updatedAt: new Date().toISOString() }
    saveSegments(segs)
    return segs[idx]
  }
  return request('PUT', `/v1/mlm/admin/segments/${id}`, updates)
}

export async function deleteSegment(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const segs = loadSegments().filter(s => s.id !== id)
    saveSegments(segs)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/segments/${id}`)
}

export async function getSegmentMembers(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const segs = loadSegments()
    const seg = segs.find(s => s.id === id)
    if (!seg) throw new Error('Segment not found')
    const matched = seg.rules.length === 0 ? ADMIN_MEMBERS : applySegmentRules(ADMIN_MEMBERS, seg.rules, seg.logic)
    return matched
  }
  return request('GET', `/v1/mlm/admin/segments/${id}/members`)
}

// ─── Shipping Zones ──────────────────────────────────────────────────────────
function loadShippingZones() {
  const stored = localStorage.getItem('nv_shipping_zones')
  return stored ? JSON.parse(stored) : SHIPPING_ZONES.map(z => ({ ...z }))
}
function saveShippingZones(zones) {
  localStorage.setItem('nv_shipping_zones', JSON.stringify(zones))
}

export async function getShippingZones() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    return loadShippingZones()
  }
  return request('GET', '/v1/mlm/admin/shipping-zones')
}

export async function createShippingZone(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const zones = loadShippingZones()
    const zone = { ...data, id: `zone-${Date.now()}` }
    saveShippingZones([...zones, zone])
    return zone
  }
  return request('POST', '/v1/mlm/admin/shipping-zones', data)
}

export async function updateShippingZone(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const zones = loadShippingZones()
    const updated = zones.map(z => z.id === id ? { ...z, ...data } : z)
    saveShippingZones(updated)
    return updated.find(z => z.id === id)
  }
  return request('PUT', `/v1/mlm/admin/shipping-zones/${id}`, data)
}

export async function deleteShippingZone(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    saveShippingZones(loadShippingZones().filter(z => z.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/shipping-zones/${id}`)
}

export function getShippingRateForCountry(country, cartTotal, zones) {
  const zone = (zones || []).find(z => z.active && z.countries.includes(country))
  if (!zone) {
    return { rate: 0, free: true, carrier: '', estimatedDays: '', zoneName: '' }
  }
  const free = cartTotal >= zone.freeOver
  return {
    rate: free ? 0 : zone.rate,
    free,
    carrier: zone.carrier,
    estimatedDays: zone.estimatedDays,
    zoneName: zone.name,
    freeOver: zone.freeOver,
  }
}

// ── Tax / VAT Configuration ──────────────────────────────────────────────────
const TAX_CONFIG_KEY = 'nv_tax_config'

const DEFAULT_TAX_CONFIG = {
  enabled: true,
  pricesIncludeTax: true,
  mvaRegistrationNumber: 'NO 987 654 321 MVA',
  defaultRate: 25,
  productCategoryRates: [
    { id: 'supplements', label: 'Nutritional Supplements & Health Products', rate: 25, isDefault: true },
    { id: 'food',        label: 'Food & Beverages',                          rate: 15 },
    { id: 'transport',   label: 'Transport & Freight Services',              rate: 12 },
    { id: 'exempt',      label: 'Exempt (Financial services, education)',    rate: 0  },
  ],
  countryOverrides: [
    { id: 'co-001', country: 'United Kingdom',  rate: 20, enabled: true,  note: 'Post-Brexit UK VAT' },
    { id: 'co-002', country: 'Germany',         rate: 19, enabled: true,  note: 'German MwSt'        },
    { id: 'co-003', country: 'Sweden',          rate: 25, enabled: true,  note: 'Swedish MOMS'       },
    { id: 'co-004', country: 'Denmark',         rate: 25, enabled: true,  note: 'Danish MOMS'        },
    { id: 'co-005', country: 'Netherlands',     rate: 21, enabled: true,  note: 'Dutch BTW'          },
    { id: 'co-006', country: 'France',          rate: 20, enabled: false, note: 'French TVA'         },
  ],
  vatCollectedMTD:   87_420,
  vatCollectedYTD:  612_800,
  taxableRevenueMTD: 349_680,
  taxableRevenueYTD: 2_451_200,
  ossThresholdEUR: 10_000,
  ossEnrolled: false,
}

function _loadTaxConfig() {
  try { const d = localStorage.getItem(TAX_CONFIG_KEY); if (d) return JSON.parse(d) } catch {}
  return { ...DEFAULT_TAX_CONFIG }
}
function _saveTaxConfig(cfg) {
  try { localStorage.setItem(TAX_CONFIG_KEY, JSON.stringify(cfg)) } catch {}
}

export async function getTaxConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _loadTaxConfig() }
  return request('GET', '/v1/mlm/admin/tax-config')
}

export async function saveTaxConfig(patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const cfg = { ..._loadTaxConfig(), ...patch }
    _saveTaxConfig(cfg)
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/tax-config', patch)
}

export async function addCountryTaxOverride(override) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadTaxConfig()
    const newItem = { ...override, id: 'co-' + Date.now(), enabled: true }
    cfg.countryOverrides = [...cfg.countryOverrides, newItem]
    _saveTaxConfig(cfg)
    return newItem
  }
  return request('POST', '/v1/mlm/admin/tax-config/country-overrides', override)
}

export async function updateCountryTaxOverride(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadTaxConfig()
    cfg.countryOverrides = cfg.countryOverrides.map(o => o.id === id ? { ...o, ...patch } : o)
    _saveTaxConfig(cfg)
    return cfg.countryOverrides.find(o => o.id === id) || null
  }
  return request('PATCH', `/v1/mlm/admin/tax-config/country-overrides/${id}`, patch)
}

export async function deleteCountryTaxOverride(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _loadTaxConfig()
    cfg.countryOverrides = cfg.countryOverrides.filter(o => o.id !== id)
    _saveTaxConfig(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/tax-config/country-overrides/${id}`)
}

export function computeTaxForCountry(country, subtotal, taxConfig) {
  if (!taxConfig?.enabled) return { vatAmount: 0, rate: 0, label: '' }
  const override = (taxConfig.countryOverrides || []).find(o => o.enabled && o.country === country)
  const rate = override ? override.rate : (taxConfig.defaultRate || 25)
  const vatAmount = taxConfig.pricesIncludeTax
    ? Math.round(subtotal - subtotal / (1 + rate / 100))
    : Math.round(subtotal * rate / 100)
  return { vatAmount, rate, label: `MVA ${rate}%` }
}

// ─── Membership Fees ──────────────────────────────────────────────────────────
const MEMBERSHIP_FEE_KEY = 'nv_membership_fee_config'

function _loadFeeConfig() {
  try { const d = localStorage.getItem(MEMBERSHIP_FEE_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(MEMBERSHIP_FEE_CONFIG))
}
function _saveFeeConfig(cfg) {
  try { localStorage.setItem(MEMBERSHIP_FEE_KEY, JSON.stringify(cfg)) } catch {}
}

export async function getMembershipFeeConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _loadFeeConfig() }
  return request('GET', '/v1/mlm/admin/membership-fees')
}

export async function saveMembershipFeeConfig(patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const cfg = { ..._loadFeeConfig() }
    for (const key of Object.keys(patch)) {
      if (patch[key] !== null && typeof patch[key] === 'object' && !Array.isArray(patch[key])) {
        cfg[key] = { ...(cfg[key] || {}), ...patch[key] }
      } else {
        cfg[key] = patch[key]
      }
    }
    _saveFeeConfig(cfg)
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/membership-fees', patch)
}

export async function createMembershipFeePaymentPlan(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadFeeConfig()
    const plan = { ...data, id: 'pp-' + Date.now() }
    cfg.paymentPlans = [...(cfg.paymentPlans || []), plan]
    _saveFeeConfig(cfg)
    return plan
  }
  return request('POST', '/v1/mlm/admin/membership-fees/payment-plans', data)
}

export async function updateMembershipFeePaymentPlan(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const cfg = _loadFeeConfig()
    cfg.paymentPlans = (cfg.paymentPlans || []).map(p => p.id === id ? { ...p, ...patch } : p)
    _saveFeeConfig(cfg)
    return cfg.paymentPlans.find(p => p.id === id) || null
  }
  return request('PATCH', `/v1/mlm/admin/membership-fees/payment-plans/${id}`, patch)
}

export async function deleteMembershipFeePaymentPlan(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _loadFeeConfig()
    cfg.paymentPlans = (cfg.paymentPlans || []).filter(p => p.id !== id)
    _saveFeeConfig(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/membership-fees/payment-plans/${id}`)
}

// ─── Subscription Plans ───────────────────────────────────────────────────────
const SUBS_PLANS_KEY = 'nv_subscription_plans'
const SUBS_MEMBERS_KEY = 'nv_member_subscriptions'

function _loadSubsPlans() {
  try { const d = localStorage.getItem(SUBS_PLANS_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(SUBSCRIPTION_PLANS))
}
function _saveSubsPlans(plans) {
  try { localStorage.setItem(SUBS_PLANS_KEY, JSON.stringify(plans)) } catch {}
}

function _loadMemberSubs() {
  try { const d = localStorage.getItem(SUBS_MEMBERS_KEY); if (d) return JSON.parse(d) } catch {}
  return JSON.parse(JSON.stringify(MEMBER_SUBSCRIPTIONS))
}
function _saveMemberSubs(subs) {
  try { localStorage.setItem(SUBS_MEMBERS_KEY, JSON.stringify(subs)) } catch {}
}

export async function getSubscriptionPlans() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _loadSubsPlans() }
  return request('GET', '/v1/mlm/admin/subscriptions/plans')
}

export async function createSubscriptionPlan(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const plans = _loadSubsPlans()
    const plan = { ...data, id: 'sp-' + Date.now(), memberCount: 0, mrr: 0 }
    plans.push(plan)
    _saveSubsPlans(plans)
    return plan
  }
  return request('POST', '/v1/mlm/admin/subscriptions/plans', data)
}

export async function updateSubscriptionPlan(id, patch) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const plans = _loadSubsPlans()
    const idx = plans.findIndex(p => p.id === id)
    if (idx >= 0) { plans[idx] = { ...plans[idx], ...patch }; _saveSubsPlans(plans) }
    return plans[idx] || null
  }
  return request('PATCH', `/v1/mlm/admin/subscriptions/plans/${id}`, patch)
}

export async function deleteSubscriptionPlan(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const plans = _loadSubsPlans().filter(p => p.id !== id)
    _saveSubsPlans(plans)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/subscriptions/plans/${id}`)
}

export async function getMemberSubscriptions() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return _loadMemberSubs() }
  return request('GET', '/v1/mlm/admin/subscriptions/members')
}

export async function assignMemberPlan(memberId, planId, billingCycle) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const subs = _loadMemberSubs()
    const plans = _loadSubsPlans()
    const plan = plans.find(p => p.id === planId)
    const idx = subs.findIndex(s => s.memberId === memberId)
    const today = new Date().toISOString().slice(0, 10)
    const renewal = new Date(Date.now() + (billingCycle === 'annual' ? 365 : 30) * 86400000).toISOString().slice(0, 10)
    const sub = {
      memberId,
      memberName: idx >= 0 ? subs[idx].memberName : memberId,
      planId,
      planName: plan?.name || '',
      billingCycle,
      status: 'active',
      mrr: billingCycle === 'annual' ? Math.round((plan?.annualPrice || 0) / 12) : (plan?.monthlyPrice || 0),
      startDate: idx >= 0 ? subs[idx].startDate : today,
      nextRenewal: renewal,
    }
    if (idx >= 0) subs[idx] = sub; else subs.push(sub)
    _saveMemberSubs(subs)
    return sub
  }
  return request('POST', `/v1/mlm/admin/subscriptions/members/${memberId}/assign`, { planId, billingCycle })
}

export async function cancelMemberSubscription(memberId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const subs = _loadMemberSubs()
    const idx = subs.findIndex(s => s.memberId === memberId)
    if (idx >= 0) { subs[idx] = { ...subs[idx], status: 'cancelled', mrr: 0, nextRenewal: null }; _saveMemberSubs(subs) }
    return subs[idx] || null
  }
  return request('DELETE', `/v1/mlm/admin/subscriptions/members/${memberId}`)
}

export async function getMySubscription(userId = 'NV-10042') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const subs = _loadMemberSubs()
    const plans = _loadSubsPlans()
    const sub = subs.find(s => s.memberId === userId) || null
    if (!sub) return null
    const plan = plans.find(p => p.id === sub.planId) || null
    return { ...sub, plan }
  }
  return request('GET', '/v1/mlm/subscriptions/my')
}

export async function changeMyPlan(planId, billingCycle) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const plans = _loadSubsPlans()
    const plan = plans.find(p => p.id === planId)
    return { ok: true, planId, billingCycle, planName: plan?.name || '', effectiveDate: new Date().toISOString().slice(0, 10) }
  }
  return request('POST', '/v1/mlm/subscriptions/my/change', { planId, billingCycle })
}

/* ── Gift Cards ──────────────────────────────────────────────────────── */
const _GC_KEY = 'nv_gift_cards'
function _gcLoad() { try { return JSON.parse(localStorage.getItem(_GC_KEY) || 'null') } catch { return null } }
function _gcSave(c) { localStorage.setItem(_GC_KEY, JSON.stringify(c)) }
function _gcInit() {
  const s = _gcLoad(); if (s) return s
  const far = '2027-08-06T00:00:00Z'
  const seed = [
    { id:'gc-001', code:'NVGC-XKPT-2291', originalValue:500,  balance:500,  issuedTo:null,       issuedToName:null,                issuedAt:'2026-07-15T09:00:00Z', expiresAt:far, status:'active',   note:'Bulk batch A' },
    { id:'gc-002', code:'NVGC-MTRQ-7741', originalValue:500,  balance:0,    issuedTo:null,       issuedToName:null,                issuedAt:'2026-07-15T09:00:00Z', expiresAt:far, status:'redeemed', note:'Bulk batch A', redeemedAt:'2026-07-28T14:22:00Z' },
    { id:'gc-003', code:'NVGC-PLVN-4490', originalValue:1000, balance:350,  issuedTo:'NV-10042', issuedToName:'Sarah Hansen',      issuedAt:'2026-07-20T11:30:00Z', expiresAt:far, status:'partial',  note:'' },
    { id:'gc-004', code:'NVGC-BNRK-8812', originalValue:200,  balance:200,  issuedTo:'NV-10051', issuedToName:'Erik Larsen',       issuedAt:'2026-07-22T08:00:00Z', expiresAt:'2026-08-01T00:00:00Z', status:'expired', note:'Promo expired' },
    { id:'gc-005', code:'NVGC-ZQTM-3310', originalValue:750,  balance:750,  issuedTo:'NV-10065', issuedToName:'Anna Nilsen',       issuedAt:'2026-08-01T10:00:00Z', expiresAt:far, status:'active',   note:'New member welcome' },
    { id:'gc-006', code:'NVGC-VKRJ-5521', originalValue:1500, balance:1500, issuedTo:null,       issuedToName:null,                issuedAt:'2026-08-03T14:00:00Z', expiresAt:far, status:'active',   note:'Influencer campaign' },
    { id:'gc-007', code:'NVGC-HSTD-9901', originalValue:300,  balance:0,    issuedTo:'NV-10088', issuedToName:'Mia Christoffersen',issuedAt:'2026-07-10T09:00:00Z', expiresAt:far, status:'redeemed', note:'', redeemedAt:'2026-07-25T16:44:00Z' },
    { id:'gc-008', code:'NVGC-YMLQ-6640', originalValue:250,  balance:250,  issuedTo:null,       issuedToName:null,                issuedAt:'2026-08-05T08:00:00Z', expiresAt:far, status:'active',   note:'' },
  ]
  _gcSave(seed); return seed
}
function _gcNewCode() {
  const s = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4).padEnd(4,'X')
  return `NVGC-${s()}-${s()}`
}
function _gcNextId(cards) {
  const max = cards.reduce((m,c) => Math.max(m, parseInt(c.id.replace('gc-',''))||0), 0)
  return 'gc-' + String(max+1).padStart(3,'0')
}

export async function getAdminGiftCards({ status, search } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const all = _gcInit()
    let cards = [...all]
    if (status && status !== 'all') cards = cards.filter(c => c.status === status)
    if (search) {
      const q = search.toLowerCase()
      cards = cards.filter(c => c.code.toLowerCase().includes(q) || (c.issuedToName||'').toLowerCase().includes(q) || (c.issuedTo||'').toLowerCase().includes(q))
    }
    const totalFaceValue = all.reduce((s,c) => s + c.originalValue, 0)
    const outstanding    = all.filter(c=>c.status!=='voided'&&c.status!=='expired').reduce((s,c) => s + c.balance, 0)
    const redeemed       = all.reduce((s,c) => s + (c.originalValue - c.balance), 0)
    const expired        = all.filter(c=>c.status==='expired').reduce((s,c) => s + c.balance, 0)
    return { cards, stats: { totalIssued: all.length, totalFaceValue, outstanding, redeemed, expired } }
  }
  return request('GET', '/v1/mlm/admin/gift-cards', { status, search })
}

export async function issueGiftCards({ value, expiresAt, issuedTo, issuedToName, note, count = 1 }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    const cards = _gcInit()
    const now = new Date().toISOString()
    const newCards = []
    for (let i = 0; i < Math.min(count, 200); i++) {
      newCards.push({
        id: _gcNextId([...cards, ...newCards]),
        code: _gcNewCode(),
        originalValue: value,
        balance: value,
        issuedTo: issuedTo || null,
        issuedToName: issuedToName || null,
        issuedAt: now,
        expiresAt,
        status: 'active',
        note: note || '',
      })
    }
    _gcSave([...cards, ...newCards])
    return { ok: true, cards: newCards }
  }
  return request('POST', '/v1/mlm/admin/gift-cards/issue', { value, expiresAt, issuedTo, issuedToName, note, count })
}

export async function voidGiftCard(id, reason) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _gcSave(_gcInit().map(c => c.id === id ? { ...c, status:'voided', voidedAt: new Date().toISOString(), voidReason: reason||'' } : c))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/gift-cards/${id}/void`, { reason })
}

export async function getMyGiftCards(userId = 'NV-10042') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const cards = _gcInit().filter(c => c.issuedTo === userId)
    const redemptions = [
      { date:'2026-07-25T16:44:00Z', code:'NVGC-HSTD-9901', amount:300, orderId:'ORD-8754' },
      { date:'2026-06-14T11:10:00Z', code:'NVGC-DEMO-0001', amount:150, orderId:'ORD-8201' },
    ]
    return { cards, redemptions }
  }
  return request('GET', '/v1/mlm/gift-cards/my')
}

export async function checkGiftCardBalance(code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const card = _gcInit().find(c => c.code.toUpperCase() === code.trim().toUpperCase())
    if (!card) return { found: false }
    return { found: true, code: card.code, balance: card.balance, status: card.status, expiresAt: card.expiresAt }
  }
  return request('GET', '/v1/mlm/gift-cards/check', { code })
}

// ── Security (member) ─────────────────────────────────────────────────────────

const _SEC_KEY = 'nv_security_profile'
function _secLoad() { try { return JSON.parse(localStorage.getItem(_SEC_KEY)) } catch { return null } }
function _secSave(d) { localStorage.setItem(_SEC_KEY, JSON.stringify(d)) }
function _secInit(userId) {
  const s = _secLoad(); if (s && s.userId === userId) return s
  const seed = {
    userId,
    passwordChangedAt: '2026-06-15T08:30:00Z',
    twoFactorEnabled: false,
    recoveryCodes: [],
    activeSessions: [
      { id: 'sess-001', device: 'MacBook Pro', browser: 'Chrome 126', os: 'macOS 14', ip: '88.93.12.44', location: 'Oslo, NO', lastActive: '2026-08-06T13:55:00Z', isCurrent: true },
      { id: 'sess-002', device: 'iPhone 15 Pro', browser: 'Safari Mobile', os: 'iOS 17', ip: '88.93.12.44', location: 'Oslo, NO', lastActive: '2026-08-05T22:10:00Z', isCurrent: false },
      { id: 'sess-003', device: 'Windows PC', browser: 'Firefox 128', os: 'Windows 11', ip: '194.63.109.21', location: 'Bergen, NO', lastActive: '2026-07-28T09:00:00Z', isCurrent: false },
    ],
    loginHistory: [
      { id: 'lh-001', at: '2026-08-06T13:55:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
      { id: 'lh-002', at: '2026-08-05T22:10:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'iPhone 15 / Safari', success: true },
      { id: 'lh-003', at: '2026-08-04T08:45:00Z', ip: '102.0.88.5', location: 'Lagos, NG', device: 'Unknown / Chrome', success: false },
      { id: 'lh-004', at: '2026-08-03T14:20:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
      { id: 'lh-005', at: '2026-07-28T09:00:00Z', ip: '194.63.109.21', location: 'Bergen, NO', device: 'Windows PC / Firefox', success: true },
      { id: 'lh-006', at: '2026-07-20T18:35:00Z', ip: '88.93.12.44', location: 'Oslo, NO', device: 'MacBook Pro / Chrome', success: true },
    ],
  }
  _secSave(seed); return seed
}

export async function getSecurityProfile(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return _secInit(userId)
  }
  return request('GET', '/v1/mlm/security/profile')
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    if (!currentPassword || currentPassword.length < 4) throw new Error('Current password is incorrect.')
    const profile = _secInit(userId)
    _secSave({ ...profile, passwordChangedAt: new Date().toISOString() })
    return { ok: true }
  }
  return request('POST', '/v1/mlm/security/change-password', { currentPassword, newPassword })
}

export async function setupTwoFactor(userId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    return {
      manualKey: 'JBSWY3DPEHPK3PXP',
      qrDataUrl: null,
    }
  }
  return request('POST', '/v1/mlm/security/2fa/setup')
}

export async function verifyAndEnableTwoFactor(userId, code) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    if (code.replace(/\s/g,'').length !== 6) throw new Error('Enter a valid 6-digit code.')
    const recoveryCodes = Array.from({ length: 8 }, (_, i) => `NV-${String(i+1).padStart(2,'0')}-${Math.random().toString(36).toUpperCase().slice(2,10)}`)
    const profile = _secInit(userId)
    _mock2FA[userId] = true
    _secSave({ ...profile, twoFactorEnabled: true, recoveryCodes })
    return { ok: true, recoveryCodes }
  }
  return request('POST', '/v1/mlm/security/2fa/verify', { code })
}

export async function disableTwoFactor(userId, password) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    if (!password || password.length < 4) throw new Error('Password is required to disable 2FA.')
    const profile = _secInit(userId)
    delete _mock2FA[userId]
    _secSave({ ...profile, twoFactorEnabled: false, recoveryCodes: [] })
    return { ok: true }
  }
  return request('POST', '/v1/mlm/security/2fa/disable', { password })
}

export async function revokeSession(userId, sessionId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const profile = _secInit(userId)
    const updated = { ...profile, activeSessions: profile.activeSessions.filter(s => s.id !== sessionId) }
    _secSave(updated)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/security/sessions/${sessionId}`)
}

// ── Webhooks (admin) ──────────────────────────────────────────────────────────

const _WH_KEY = 'nv_admin_webhooks'
const _WHD_KEY = 'nv_webhook_deliveries'
const WEBHOOK_EVENTS = [
  'member.enrolled', 'member.rank_change', 'member.suspended',
  'commission.run_complete', 'commission.payout_processed',
  'order.placed', 'order.shipped', 'order.cancelled',
  'gift_card.issued', 'subscription.renewed', 'kyc.approved', 'kyc.rejected',
]
function _whLoad() { try { return JSON.parse(localStorage.getItem(_WH_KEY)) } catch { return null } }
function _whSave(d) { localStorage.setItem(_WH_KEY, JSON.stringify(d)) }
function _whdLoad() { try { return JSON.parse(localStorage.getItem(_WHD_KEY)) } catch { return null } }
function _whdSave(d) { localStorage.setItem(_WHD_KEY, JSON.stringify(d)) }
function _whInit() {
  const s = _whLoad(); if (s) return s
  const seed = [
    { id: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', description: 'Zapier — member events', events: ['member.enrolled','member.rank_change'], secret: 'whsec_zap123abc', enabled: true, createdAt: '2026-07-01T10:00:00Z' },
    { id: 'wh-002', url: 'https://erp.example.no/webhook/orders', description: 'ERP — order sync', events: ['order.placed','order.shipped','order.cancelled'], secret: 'whsec_erp456def', enabled: true, createdAt: '2026-07-10T14:00:00Z' },
    { id: 'wh-003', url: 'https://analytics.example.com/ingest', description: 'Analytics — commissions', events: ['commission.run_complete','commission.payout_processed'], secret: 'whsec_ana789ghi', enabled: false, createdAt: '2026-07-20T09:00:00Z' },
  ]
  _whSave(seed); return seed
}
function _whdInit() {
  const s = _whdLoad(); if (s) return s
  const seed = [
    { id: 'whd-001', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.enrolled', at: '2026-08-06T12:30:00Z', status: 'success', httpCode: 200, durationMs: 142, attempt: 1 },
    { id: 'whd-002', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.rank_change', at: '2026-08-06T11:15:00Z', status: 'success', httpCode: 200, durationMs: 188, attempt: 1 },
    { id: 'whd-003', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.placed', at: '2026-08-06T10:45:00Z', status: 'failed', httpCode: 503, durationMs: 5021, attempt: 3, error: 'Service Unavailable' },
    { id: 'whd-004', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.shipped', at: '2026-08-05T18:20:00Z', status: 'success', httpCode: 200, durationMs: 95, attempt: 1 },
    { id: 'whd-005', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.enrolled', at: '2026-08-05T09:00:00Z', status: 'success', httpCode: 200, durationMs: 161, attempt: 1 },
    { id: 'whd-006', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.cancelled', at: '2026-08-04T14:35:00Z', status: 'failed', httpCode: 500, durationMs: 4998, attempt: 3, error: 'Internal Server Error' },
    { id: 'whd-007', endpointId: 'wh-001', url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/', event: 'member.rank_change', at: '2026-08-03T11:00:00Z', status: 'success', httpCode: 200, durationMs: 203, attempt: 1 },
    { id: 'whd-008', endpointId: 'wh-002', url: 'https://erp.example.no/webhook/orders', event: 'order.placed', at: '2026-08-02T16:45:00Z', status: 'success', httpCode: 201, durationMs: 87, attempt: 1 },
  ]
  _whdSave(seed); return seed
}
function _whNextId(whs) {
  const max = whs.reduce((m,w) => Math.max(m, parseInt(w.id.replace('wh-',''))||0), 0)
  return 'wh-' + String(max+1).padStart(3,'0')
}
function _whdNextId(ds) {
  const max = ds.reduce((m,d) => Math.max(m, parseInt(d.id.replace('whd-',''))||0), 0)
  return 'whd-' + String(max+1).padStart(3,'0')
}

export async function getAdminWebhooks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const endpoints = _whInit()
    const deliveries = _whdInit()
    const now = Date.now()
    const h24 = now - 86400000
    const recent = deliveries.filter(d => new Date(d.at).getTime() > h24)
    return {
      endpoints,
      stats: {
        total: endpoints.length,
        active: endpoints.filter(e => e.enabled).length,
        events24h: recent.length,
        failed24h: recent.filter(d => d.status === 'failed').length,
      },
    }
  }
  return request('GET', '/v1/mlm/admin/webhooks')
}

export async function createWebhook(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const whs = _whInit()
    const endpoint = { id: _whNextId(whs), ...data, createdAt: new Date().toISOString() }
    _whSave([...whs, endpoint])
    return { ok: true, endpoint }
  }
  return request('POST', '/v1/mlm/admin/webhooks', data)
}

export async function updateWebhook(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _whSave(_whInit().map(w => w.id === id ? { ...w, ...data } : w))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/webhooks/${id}`, data)
}

export async function deleteWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _whSave(_whInit().filter(w => w.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/webhooks/${id}`)
}

export async function testWebhook(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 800))
    const wh = _whInit().find(w => w.id === id)
    const ok = wh && wh.enabled && !wh.url.includes('example.no')
    const delivery = {
      id: _whdNextId(_whdInit()),
      endpointId: id,
      url: wh?.url || '',
      event: 'ping',
      at: new Date().toISOString(),
      status: ok ? 'success' : 'failed',
      httpCode: ok ? 200 : 503,
      durationMs: ok ? Math.floor(Math.random() * 200 + 80) : 5000,
      attempt: 1,
      error: ok ? undefined : 'Connection refused',
    }
    _whdSave([delivery, ..._whdInit()])
    return { ok, httpCode: delivery.httpCode, durationMs: delivery.durationMs, error: delivery.error }
  }
  return request('POST', `/v1/mlm/admin/webhooks/${id}/test`)
}

export async function getWebhookDeliveries({ endpointId, status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    let ds = _whdInit()
    if (endpointId && endpointId !== 'all') ds = ds.filter(d => d.endpointId === endpointId)
    if (status && status !== 'all') ds = ds.filter(d => d.status === status)
    return ds.sort((a, b) => new Date(b.at) - new Date(a.at))
  }
  return request('GET', '/v1/mlm/admin/webhooks/deliveries', { endpointId, status })
}

export async function retryWebhookDelivery(deliveryId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const ds = _whdInit()
    const orig = ds.find(d => d.id === deliveryId)
    if (!orig) throw new Error('Delivery not found.')
    const retry = {
      ...orig,
      id: _whdNextId(ds),
      at: new Date().toISOString(),
      status: 'success',
      httpCode: 200,
      durationMs: Math.floor(Math.random() * 200 + 80),
      attempt: (orig.attempt || 1) + 1,
      error: undefined,
    }
    _whdSave([retry, ...ds])
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/webhooks/deliveries/${deliveryId}/retry`)
}

// ─── RANK MANAGER ─────────────────────────────────────────────────────────────

const SEED_RANKS = [
  { id: 'rank_1', name: 'Starter',   slug: 'starter',   color: '#9ca3af', icon: '⭐', order: 1, pvRequired: 0,    gvRequired: 0,      activeLegsRequired: 0, legVolRequired: 0,    monthlyBonus: 0,     retailDiscount: 20, qualifyingPeriod: 'month', active: true,  memberCount: 412 },
  { id: 'rank_2', name: 'Bronze',    slug: 'bronze',    color: '#cd7f32', icon: '🥉', order: 2, pvRequired: 100,  gvRequired: 500,    activeLegsRequired: 1, legVolRequired: 100,  monthlyBonus: 0,     retailDiscount: 25, qualifyingPeriod: 'month', active: true,  memberCount: 187 },
  { id: 'rank_3', name: 'Silver',    slug: 'silver',    color: '#c0c0c0', icon: '🥈', order: 3, pvRequired: 150,  gvRequired: 1500,   activeLegsRequired: 2, legVolRequired: 200,  monthlyBonus: 500,   retailDiscount: 30, qualifyingPeriod: 'month', active: true,  memberCount: 94  },
  { id: 'rank_4', name: 'Gold',      slug: 'gold',      color: '#ffd700', icon: '🥇', order: 4, pvRequired: 200,  gvRequired: 5000,   activeLegsRequired: 3, legVolRequired: 500,  monthlyBonus: 1500,  retailDiscount: 35, qualifyingPeriod: 'month', active: true,  memberCount: 41  },
  { id: 'rank_5', name: 'Platinum',  slug: 'platinum',  color: '#e5e4e2', icon: '💎', order: 5, pvRequired: 300,  gvRequired: 15000,  activeLegsRequired: 4, legVolRequired: 1000, monthlyBonus: 4000,  retailDiscount: 40, qualifyingPeriod: 'month', active: true,  memberCount: 18  },
  { id: 'rank_6', name: 'Diamond',   slug: 'diamond',   color: '#b9f2ff', icon: '💠', order: 6, pvRequired: 500,  gvRequired: 50000,  activeLegsRequired: 5, legVolRequired: 3000, monthlyBonus: 10000, retailDiscount: 45, qualifyingPeriod: 'month', active: true,  memberCount: 6   },
  { id: 'rank_7', name: 'Blue Diamond', slug: 'blue_diamond', color: '#3b82f6', icon: '🔷', order: 7, pvRequired: 500, gvRequired: 150000, activeLegsRequired: 6, legVolRequired: 10000, monthlyBonus: 25000, retailDiscount: 50, qualifyingPeriod: 'month', active: true, memberCount: 2 },
]

function _rankKey() { return 'nv_admin_ranks' }
function _rankInit() {
  try { return JSON.parse(localStorage.getItem(_rankKey())) || SEED_RANKS } catch { return SEED_RANKS }
}
function _rankSave(r) { localStorage.setItem(_rankKey(), JSON.stringify(r)) }
function _rankNextId(r) { return 'rank_' + (Math.max(0, ...r.map(x => parseInt(x.id.replace('rank_', '')) || 0)) + 1) }

export async function getAdminRanks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return { ranks: _rankInit() }
  }
  return request('GET', '/v1/mlm/admin/ranks')
}

export async function createRank(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const ranks = _rankInit()
    const rank = { id: _rankNextId(ranks), ...data, memberCount: 0, createdAt: new Date().toISOString() }
    _rankSave([...ranks, rank].sort((a, b) => a.order - b.order))
    return { ok: true, rank }
  }
  return request('POST', '/v1/mlm/admin/ranks', data)
}

export async function updateRank(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _rankSave(_rankInit().map(r => r.id === id ? { ...r, ...data } : r).sort((a, b) => a.order - b.order))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/ranks/${id}`, data)
}

export async function deleteRank(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _rankSave(_rankInit().filter(r => r.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/ranks/${id}`)
}

// ─── FRAUD & RISK CENTER ──────────────────────────────────────────────────────

const SEED_FRAUD_FLAGS = [
  { id: 'ff_1',  memberId: 'u_009', memberName: 'Erik Hansen',      type: 'duplicate_account',  severity: 'high',     description: '3 accounts sharing the same IP address (185.220.101.14)', detectedAt: '2026-08-06T08:12:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_2',  memberId: 'u_017', memberName: 'Kari Andersen',    type: 'referral_abuse',     severity: 'high',     description: 'Self-referral loop detected — member enrolled by their own sub-account', detectedAt: '2026-08-05T22:44:00Z', status: 'investigating', investigator: 'Admin',   resolvedAt: null, notes: 'Reached out to member for explanation.' },
  { id: 'ff_3',  memberId: 'u_023', memberName: 'Lars Nilsen',      type: 'unusual_volume',     severity: 'medium',   description: 'PV jumped 4,200% MoM with no corresponding retail sales', detectedAt: '2026-08-05T14:30:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_4',  memberId: 'u_031', memberName: 'Ingrid Berg',      type: 'payment_fraud',      severity: 'critical', description: 'Chargeback filed on 4 orders within 30 days totalling NOK 8,200', detectedAt: '2026-08-05T09:05:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
  { id: 'ff_5',  memberId: 'u_044', memberName: 'Ole Johansen',     type: 'suspicious_signup',  severity: 'low',      description: 'Signup from high-risk country proxy (Tor exit node)', detectedAt: '2026-08-04T16:22:00Z', status: 'dismissed',    investigator: 'Admin',   resolvedAt: '2026-08-04T18:00:00Z', notes: 'Member verified by phone. Legitimate VPN user.' },
  { id: 'ff_6',  memberId: 'u_052', memberName: 'Sigrid Vik',       type: 'referral_abuse',     severity: 'medium',   description: 'Enrolled 12 members in 48 hours, all using the same device fingerprint', detectedAt: '2026-08-04T11:15:00Z', status: 'investigating', investigator: 'Admin',   resolvedAt: null, notes: '' },
  { id: 'ff_7',  memberId: 'u_061', memberName: 'Tor Magnusson',    type: 'unusual_volume',     severity: 'medium',   description: 'Autoship orders placed and immediately returned in a commission-gaming pattern', detectedAt: '2026-08-03T20:08:00Z', status: 'resolved',     investigator: 'Admin',   resolvedAt: '2026-08-05T09:00:00Z', notes: 'Account suspended. Commissions reversed.' },
  { id: 'ff_8',  memberId: 'u_073', memberName: 'Astrid Dahl',      type: 'payment_fraud',      severity: 'high',     description: 'Card number used belongs to a different cardholder name', detectedAt: '2026-08-03T13:44:00Z', status: 'resolved',     investigator: 'Admin',   resolvedAt: '2026-08-04T10:30:00Z', notes: 'Account frozen, reported to payment processor.' },
  { id: 'ff_9',  memberId: 'u_081', memberName: 'Bjarne Solberg',   type: 'duplicate_account',  severity: 'low',      description: 'Possible duplicate of member u_043 (same name variant + DOB)', detectedAt: '2026-08-02T09:30:00Z', status: 'dismissed',    investigator: 'Admin',   resolvedAt: '2026-08-02T14:00:00Z', notes: 'Different people. Common Norwegian name.' },
  { id: 'ff_10', memberId: 'u_092', memberName: 'Hilde Thorvaldsen', type: 'suspicious_signup', severity: 'low',      description: 'Account created with disposable email domain', detectedAt: '2026-08-01T17:55:00Z', status: 'open',         investigator: null,      resolvedAt: null, notes: '' },
]

const FRAUD_RULES_SEED = [
  { id: 'fr_1', name: 'IP Sharing Threshold',        trigger: 'Same IP > N accounts',         threshold: 3,  action: 'flag',    enabled: true  },
  { id: 'fr_2', name: 'Rapid Referral Burst',        trigger: 'N referrals within 48h',       threshold: 10, action: 'flag',    enabled: true  },
  { id: 'fr_3', name: 'Chargeback Alert',            trigger: 'N chargebacks within 30d',     threshold: 2,  action: 'suspend', enabled: true  },
  { id: 'fr_4', name: 'Volume Spike',                trigger: 'PV increase > N% MoM',         threshold: 300, action: 'flag',   enabled: true  },
  { id: 'fr_5', name: 'Tor / Proxy Signup',          trigger: 'Signup from known proxy IP',   threshold: 1,  action: 'flag',    enabled: false },
  { id: 'fr_6', name: 'Disposable Email',            trigger: 'Signup with throwaway email',  threshold: 1,  action: 'flag',    enabled: true  },
  { id: 'fr_7', name: 'Return Gaming',               trigger: 'Return rate > N% of orders',   threshold: 50, action: 'flag',    enabled: true  },
]

function _ffKey() { return 'nv_fraud_flags' }
function _ffInit() {
  try { return JSON.parse(localStorage.getItem(_ffKey())) || SEED_FRAUD_FLAGS } catch { return SEED_FRAUD_FLAGS }
}
function _ffSave(f) { localStorage.setItem(_ffKey(), JSON.stringify(f)) }
function _frKey() { return 'nv_fraud_rules' }
function _frInit() {
  try { return JSON.parse(localStorage.getItem(_frKey())) || FRAUD_RULES_SEED } catch { return FRAUD_RULES_SEED }
}
function _frSave(r) { localStorage.setItem(_frKey(), JSON.stringify(r)) }

export async function getAdminFraudFlags({ status, type, severity } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let flags = _ffInit()
    if (status && status !== 'all') flags = flags.filter(f => f.status === status)
    if (type   && type   !== 'all') flags = flags.filter(f => f.type === type)
    if (severity && severity !== 'all') flags = flags.filter(f => f.severity === severity)
    return { flags: flags.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt)) }
  }
  return request('GET', '/v1/mlm/admin/fraud/flags', { status, type, severity })
}

export async function updateFraudFlag(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _ffSave(_ffInit().map(f => f.id === id ? { ...f, ...data } : f))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/fraud/flags/${id}`, data)
}

export async function getAdminFraudRules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    return { rules: _frInit() }
  }
  return request('GET', '/v1/mlm/admin/fraud/rules')
}

export async function updateFraudRule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _frSave(_frInit().map(r => r.id === id ? { ...r, ...data } : r))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/fraud/rules/${id}`, data)
}

// ── A/B Tests ──────────────────────────────────────────────────────────────
const AB_SEED = [
  {
    id: 'abt-001', name: 'Landing Page Hero CTA', type: 'landing_page',
    hypothesis: 'A stronger CTA ("Start Earning Today") will lift signups vs "Join Now".',
    status: 'running',
    startedAt: '2026-07-20T09:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Control — "Join Now"',          split: 50, impressions: 4812, conversions: 241 },
      { id: 'b', name: 'Treatment — "Start Earning"',   split: 50, impressions: 4835, conversions: 314 },
    ],
  },
  {
    id: 'abt-002', name: 'Welcome Email Subject Line', type: 'email_subject',
    hypothesis: 'Personalised subject line will increase open rate.',
    status: 'completed',
    startedAt: '2026-07-01T00:00:00Z', endedAt: '2026-07-15T23:59:59Z', winnerId: 'b',
    variants: [
      { id: 'a', name: '"Welcome to Nordic Vitals!"',         split: 50, impressions: 2100, conversions: 441 },
      { id: 'b', name: '"Hi {{first_name}}, your journey begins"', split: 50, impressions: 2100, conversions: 567 },
    ],
  },
  {
    id: 'abt-003', name: 'Starter Pack Pricing', type: 'pricing',
    hypothesis: '€199 anchor price will perform better than €149 for starter kit.',
    status: 'paused',
    startedAt: '2026-07-28T08:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Control — €149 pack',   split: 60, impressions: 980, conversions: 78 },
      { id: 'b', name: 'Treatment — €199 pack', split: 40, impressions: 650, conversions: 61 },
    ],
  },
  {
    id: 'abt-004', name: 'Onboarding Step Count', type: 'onboarding',
    hypothesis: 'Shorter 3-step onboarding reduces drop-off vs current 6-step flow.',
    status: 'draft',
    startedAt: null, endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: '6-step onboarding (control)',   split: 50, impressions: 0, conversions: 0 },
      { id: 'b', name: '3-step onboarding (treatment)', split: 50, impressions: 0, conversions: 0 },
    ],
  },
  {
    id: 'abt-005', name: 'Commission Calculator Placement', type: 'landing_page',
    hypothesis: 'Moving the commission calculator above the fold lifts qualified signups.',
    status: 'running',
    startedAt: '2026-08-01T06:00:00Z', endedAt: null, winnerId: null,
    variants: [
      { id: 'a', name: 'Below fold (control)',   split: 50, impressions: 1240, conversions: 74 },
      { id: 'b', name: 'Above fold (treatment)', split: 50, impressions: 1238, conversions: 98 },
    ],
  },
]
let _abTests = null
function _abInit() { if (!_abTests) _abTests = JSON.parse(JSON.stringify(AB_SEED)); return _abTests }
function _abSave(t) { _abTests = t }

export async function getAdminAbTests({ status, type } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 170))
    let tests = _abInit()
    if (status && status !== 'all') tests = tests.filter(t => t.status === status)
    if (type   && type   !== 'all') tests = tests.filter(t => t.type === type)
    return { tests }
  }
  return request('GET', '/v1/mlm/admin/ab-tests', null, { status, type })
}

export async function createAbTest(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const t = { id: `abt-${Date.now()}`, winnerId: null, ...data }
    _abSave([..._abInit(), t])
    return { test: t }
  }
  return request('POST', '/v1/mlm/admin/ab-tests', data)
}

export async function updateAbTest(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _abSave(_abInit().map(t => t.id === id ? { ...t, ...data } : t))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/ab-tests/${id}`, data)
}

export async function deleteAbTest(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _abSave(_abInit().filter(t => t.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/ab-tests/${id}`)
}

// ── Member Goals ────────────────────────────────────────────────────────────
const GOALS_SEED = [
  { id: 'g-001', title: 'Reach Gold Rank',           category: 'rank',        target: 1,   current: 0,   unit: 'rank tier',  deadline: '2026-09-30', status: 'active',    createdAt: '2026-07-01' },
  { id: 'g-002', title: 'Recruit 10 Members',         category: 'recruitment', target: 10,  current: 7,   unit: 'members',    deadline: '2026-08-31', status: 'active',    createdAt: '2026-07-05' },
  { id: 'g-003', title: 'Generate 5000 PV this month',category: 'volume',      target: 5000,current: 3820,unit: 'PV',         deadline: '2026-08-31', status: 'active',    createdAt: '2026-08-01' },
  { id: 'g-004', title: 'Earn €1000 in commissions', category: 'earnings',    target: 1000,current: 1000,unit: '€',          deadline: '2026-07-31', status: 'completed', createdAt: '2026-07-01' },
  { id: 'g-005', title: 'Complete Fast Start Bonus',  category: 'activity',   target: 1,   current: 1,   unit: 'bonus',      deadline: '2026-07-15', status: 'completed', createdAt: '2026-07-01' },
  { id: 'g-006', title: 'Build 3-leg network',        category: 'recruitment', target: 3,   current: 2,   unit: 'active legs',deadline: '2026-08-15', status: 'active',    createdAt: '2026-07-10' },
  { id: 'g-007', title: '€500 monthly residual',      category: 'earnings',   target: 500, current: 310, unit: '€',          deadline: '2026-10-31', status: 'active',    createdAt: '2026-07-20' },
  { id: 'g-008', title: 'Log in every day for 30 days',category: 'activity',  target: 30,  current: 22,  unit: 'days',       deadline: '2026-08-20', status: 'active',    createdAt: '2026-07-22' },
  { id: 'g-009', title: 'Hit Diamond rank',           category: 'rank',       target: 1,   current: 0,   unit: 'rank tier',  deadline: '2026-06-30', status: 'missed',    createdAt: '2026-04-01' },
]
let _memberGoals = null
function _gInit() { if (!_memberGoals) _memberGoals = JSON.parse(JSON.stringify(GOALS_SEED)); return _memberGoals }
function _gSave(g) { _memberGoals = g }

export async function getMemberGoals({ category, status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let goals = _gInit()
    if (category && category !== 'all') goals = goals.filter(g => g.category === category)
    if (status   && status   !== 'all') goals = goals.filter(g => g.status   === status)
    return { goals }
  }
  return request('GET', '/v1/mlm/member/goals', null, { category, status })
}

export async function createMemberGoal(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const g = { id: `g-${Date.now()}`, current: 0, status: 'active', createdAt: new Date().toISOString().slice(0, 10), ...data }
    _gSave([..._gInit(), g])
    return { goal: g }
  }
  return request('POST', '/v1/mlm/member/goals', data)
}

export async function updateMemberGoal(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _gSave(_gInit().map(g => g.id === id ? { ...g, ...data } : g))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/member/goals/${id}`, data)
}

export async function deleteMemberGoal(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _gSave(_gInit().filter(g => g.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/goals/${id}`)
}

// ── Abandoned Carts (admin) ─────────────────────────────────────────────────
const ABANDONED_CARTS_SEED = [
  {
    id: 'ac-001', email: 'lars.berg@example.com', memberName: 'Lars Berg',
    abandonedAt: new Date(Date.now() - 2 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 2, price: 49.90 },
      { name: 'Nordic Collagen Boost', sku: 'NCB-60', qty: 1, price: 64.90 },
    ],
  },
  {
    id: 'ac-002', email: 'ingrid.hall@example.com', memberName: 'Ingrid Hall',
    abandonedAt: new Date(Date.now() - 26 * 3600000).toISOString(), status: 'emailed',
    recoveryEmails: [{ sentAt: new Date(Date.now() - 20 * 3600000).toISOString(), template: 'Standard Recovery' }],
    items: [
      { name: 'Viking Vitality Stack', sku: 'VVS-30', qty: 1, price: 119.00 },
    ],
  },
  {
    id: 'ac-003', email: 'erik.storm@example.com', memberName: 'Erik Storm',
    abandonedAt: new Date(Date.now() - 52 * 3600000).toISOString(), status: 'recovered',
    recoveryEmails: [{ sentAt: new Date(Date.now() - 48 * 3600000).toISOString(), template: 'Standard Recovery' }],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 3, price: 49.90 },
      { name: 'Immune Shield Pro', sku: 'ISP-120', qty: 1, price: 39.90 },
    ],
  },
  {
    id: 'ac-004', email: 'sofia.lund@example.com', memberName: null,
    abandonedAt: new Date(Date.now() - 6 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Nordic Collagen Boost', sku: 'NCB-60', qty: 2, price: 64.90 },
    ],
  },
  {
    id: 'ac-005', email: 'magnus.ore@example.com', memberName: 'Magnus Øre',
    abandonedAt: new Date(Date.now() - 72 * 3600000).toISOString(), status: 'lost',
    recoveryEmails: [
      { sentAt: new Date(Date.now() - 68 * 3600000).toISOString(), template: 'Standard Recovery' },
      { sentAt: new Date(Date.now() - 50 * 3600000).toISOString(), template: '10% Off Recovery' },
    ],
    items: [
      { name: 'Starter Bundle Alpha', sku: 'SBA-01', qty: 1, price: 189.00 },
    ],
  },
  {
    id: 'ac-006', email: 'anna.svenson@example.com', memberName: 'Anna Svensson',
    abandonedAt: new Date(Date.now() - 14 * 3600000).toISOString(), status: 'new',
    recoveryEmails: [],
    items: [
      { name: 'Arctic Omega-3 Complex', sku: 'AOC-90', qty: 1, price: 49.90 },
      { name: 'Viking Vitality Stack', sku: 'VVS-30', qty: 1, price: 119.00 },
      { name: 'Immune Shield Pro', sku: 'ISP-120', qty: 2, price: 39.90 },
    ],
  },
]
let _abandonedCarts = null
function _acInit() { if (!_abandonedCarts) _abandonedCarts = JSON.parse(JSON.stringify(ABANDONED_CARTS_SEED)); return _abandonedCarts }
function _acSave(c) { _abandonedCarts = c }

export async function getAbandonedCarts({ status } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    let carts = _acInit()
    if (status && status !== 'all') carts = carts.filter(c => c.status === status)
    return { carts }
  }
  return request('GET', '/v1/mlm/admin/abandoned-carts', null, { status })
}

export async function sendCartRecoveryEmail(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    _acSave(_acInit().map(c => c.id === id ? {
      ...c,
      status: 'emailed',
      recoveryEmails: [...(c.recoveryEmails || []), { sentAt: new Date().toISOString(), template: 'Standard Recovery' }]
    } : c))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/abandoned-carts/${id}/recover`, data)
}

export async function deleteAbandonedCart(id, newStatus) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _acSave(_acInit().map(c => c.id === id ? { ...c, status: newStatus } : c))
    return { ok: true }
  }
  return request('PATCH', `/v1/mlm/admin/abandoned-carts/${id}`, { status: newStatus })
}

// ── Member Address Book ─────────────────────────────────────────────────────
const ADDRESS_SEED = [
  {
    id: 'addr-001', label: 'Home', firstName: 'Gary', lastName: 'Granello',
    company: '', line1: 'Storgata 12', line2: '', city: 'Oslo',
    state: '', postcode: '0182', country: 'Norway', phone: '+47 912 34 567',
    isDefault: true,
  },
  {
    id: 'addr-002', label: 'Work', firstName: 'Gary', lastName: 'Granello',
    company: 'Nordic Vitals AS', line1: 'Karl Johans gate 25', line2: '3rd floor',
    city: 'Oslo', state: '', postcode: '0159', country: 'Norway', phone: '',
    isDefault: false,
  },
]
let _memberAddresses = null
function _maInit() { if (!_memberAddresses) _memberAddresses = JSON.parse(JSON.stringify(ADDRESS_SEED)); return _memberAddresses }
function _maSave(a) { _memberAddresses = a }

export async function getMemberAddresses() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    return { addresses: _maInit() }
  }
  return request('GET', '/v1/mlm/member/addresses')
}

export async function createMemberAddress(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const address = { id: `addr-${Date.now()}`, isDefault: _maInit().length === 0, ...data }
    _maSave([..._maInit(), address])
    return { address }
  }
  return request('POST', '/v1/mlm/member/addresses', data)
}

export async function updateMemberAddress(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _maSave(_maInit().map(a => a.id === id ? { ...a, ...data } : a))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/member/addresses/${id}`, data)
}

export async function deleteMemberAddress(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const remaining = _maInit().filter(a => a.id !== id)
    if (remaining.length > 0 && !remaining.some(a => a.isDefault)) {
      remaining[0].isDefault = true
    }
    _maSave(remaining)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/addresses/${id}`)
}

export async function setDefaultAddress(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _maSave(_maInit().map(a => ({ ...a, isDefault: a.id === id })))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/member/addresses/${id}/set-default`)
}

// ── Surveys (admin + member) ─────────────────────────────────────────────────
const SURVEYS_SEED = [
  {
    id: 'sv-001',
    title: 'Product Satisfaction Q3 2026',
    description: 'Help us improve our product line by sharing your experience.',
    status: 'active',
    pointsReward: 50,
    createdAt: '2026-07-01',
    closesAt: '2026-08-31',
    targetSegment: 'all',
    responseCount: 142,
    completionRate: 78,
    avgTimeMinutes: 3,
    questions: [
      { id: 'q1', type: 'rating', text: 'How satisfied are you with our products overall?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which product do you use most often?', options: ['Arctic Omega-3', 'Nordic Collagen', 'Viking Vitality Stack', 'Immune Shield Pro', 'Other'] },
      { id: 'q3', type: 'text', text: 'What improvement would you most like to see?' },
      { id: 'q4', type: 'rating', text: 'How likely are you to recommend us to a friend?', scale: 5 },
    ],
  },
  {
    id: 'sv-002',
    title: 'Onboarding Experience Feedback',
    description: 'Tell us about your first 30 days as a Nordic Vitals member.',
    status: 'active',
    pointsReward: 30,
    createdAt: '2026-07-15',
    closesAt: '2026-09-15',
    targetSegment: 'new_members',
    responseCount: 58,
    completionRate: 91,
    avgTimeMinutes: 2,
    questions: [
      { id: 'q1', type: 'rating', text: 'How easy was it to get started?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which resource helped you most?', options: ['Training videos', 'Onboarding guide', 'My sponsor', 'Customer support', 'Community forum'] },
      { id: 'q3', type: 'text', text: 'What would have made your onboarding smoother?' },
    ],
  },
  {
    id: 'sv-003',
    title: 'MLM Compensation Plan Clarity',
    description: 'We want to ensure our compensation plan is clear and motivating.',
    status: 'active',
    pointsReward: 75,
    createdAt: '2026-08-01',
    closesAt: '2026-09-01',
    targetSegment: 'active_members',
    responseCount: 34,
    completionRate: 65,
    avgTimeMinutes: 5,
    questions: [
      { id: 'q1', type: 'rating', text: 'How clearly do you understand the compensation plan?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which aspect is most confusing?', options: ['Rank advancement thresholds', 'Commission calculation', 'Bonus qualifications', 'Binary/unilevel structure', 'Nothing – it is clear'] },
      { id: 'q3', type: 'rating', text: 'How motivating is the current plan for you?', scale: 5 },
      { id: 'q4', type: 'text', text: 'What one change would make the plan more attractive?' },
    ],
  },
  {
    id: 'sv-004',
    title: 'Platform UX Audit 2026',
    description: 'Rate the usability of our member dashboard and tools.',
    status: 'draft',
    pointsReward: 60,
    createdAt: '2026-08-05',
    closesAt: null,
    targetSegment: 'all',
    responseCount: 0,
    completionRate: 0,
    avgTimeMinutes: 4,
    questions: [
      { id: 'q1', type: 'rating', text: 'How easy is it to navigate the member dashboard?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which feature do you use most?', options: ['Network tree', 'Earnings tracker', 'Leaderboard', 'Training', 'Shop'] },
      { id: 'q3', type: 'text', text: 'Describe a feature you wish existed.' },
    ],
  },
  {
    id: 'sv-005',
    title: 'Event Satisfaction – Nordic Summit 2026',
    description: 'Feedback on the July Nordic Summit event.',
    status: 'closed',
    pointsReward: 40,
    createdAt: '2026-07-20',
    closesAt: '2026-08-05',
    targetSegment: 'event_attendees',
    responseCount: 89,
    completionRate: 95,
    avgTimeMinutes: 3,
    questions: [
      { id: 'q1', type: 'rating', text: 'How satisfied were you with the event overall?', scale: 5 },
      { id: 'q2', type: 'multiple', text: 'Which session was most valuable?', options: ['Keynote', 'Product deep-dive', 'MLM strategy workshop', 'Networking dinner', 'Training academy'] },
      { id: 'q3', type: 'text', text: 'What would you improve for next year?' },
    ],
  },
]

const MEMBER_SURVEY_RESPONSES_SEED = [
  { surveyId: 'sv-005', completedAt: '2026-08-02', pointsEarned: 40, answers: { q1: 4, q2: 'Keynote', q3: 'More networking time' } },
]

let _surveys = null
let _memberSurveyResponses = null
function _svInit() { if (!_surveys) _surveys = JSON.parse(JSON.stringify(SURVEYS_SEED)); return _surveys }
function _svSave(s) { _surveys = s }
function _msrInit() { if (!_memberSurveyResponses) _memberSurveyResponses = JSON.parse(JSON.stringify(MEMBER_SURVEY_RESPONSES_SEED)); return _memberSurveyResponses }

export async function getAdminSurveys({ status, segment } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let surveys = _svInit()
    if (status && status !== 'all') surveys = surveys.filter(s => s.status === status)
    if (segment && segment !== 'all') surveys = surveys.filter(s => s.targetSegment === segment)
    return { surveys }
  }
  return request('GET', '/v1/mlm/admin/surveys', null, { status, segment })
}

export async function createSurvey(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const s = { id: `sv-${Date.now()}`, responseCount: 0, completionRate: 0, avgTimeMinutes: 0, createdAt: new Date().toISOString().slice(0, 10), ...data }
    _svSave([..._svInit(), s])
    return { survey: s }
  }
  return request('POST', '/v1/mlm/admin/surveys', data)
}

export async function updateSurvey(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _svSave(_svInit().map(s => s.id === id ? { ...s, ...data } : s))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/surveys/${id}`, data)
}

export async function deleteSurvey(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _svSave(_svInit().filter(s => s.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/surveys/${id}`)
}

export async function getSurveyResponses(surveyId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const survey = _svInit().find(s => s.id === surveyId)
    if (!survey) return { responses: [], summary: {} }
    const mockSummary = {}
    survey.questions.forEach(q => {
      if (q.type === 'rating') {
        mockSummary[q.id] = { avg: (Math.random() * 1.5 + 3.2).toFixed(1), distribution: { 1: 2, 2: 5, 3: 18, 4: 45, 5: 30 } }
      } else if (q.type === 'multiple') {
        const dist = {}
        q.options.forEach((opt, i) => { dist[opt] = Math.floor(Math.random() * 40 + 5 + (i === 0 ? 20 : 0)) })
        mockSummary[q.id] = { distribution: dist }
      } else {
        mockSummary[q.id] = { sampleAnswers: ['Great product overall', 'Love the omega-3', 'Better packaging please', 'More subscription options', 'Faster shipping'] }
      }
    })
    return { survey, summary: mockSummary, totalResponses: survey.responseCount }
  }
  return request('GET', `/v1/mlm/admin/surveys/${surveyId}/responses`)
}

export async function getAvailableSurveys() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const completed = new Set(_msrInit().map(r => r.surveyId))
    const available = _svInit().filter(s => s.status === 'active' && !completed.has(s.id))
    const done = _svInit()
      .filter(s => completed.has(s.id))
      .map(s => ({ ...s, response: _msrInit().find(r => r.surveyId === s.id) }))
    return { available, completed: done }
  }
  return request('GET', '/v1/mlm/member/surveys')
}

export async function submitSurveyResponse(surveyId, answers) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    const survey = _svInit().find(s => s.id === surveyId)
    if (!survey) throw new Error('Survey not found')
    const resp = { surveyId, completedAt: new Date().toISOString(), pointsEarned: survey.pointsReward, answers }
    _msrInit().push(resp)
    _svSave(_svInit().map(s => s.id === surveyId ? { ...s, responseCount: s.responseCount + 1 } : s))
    return { ok: true, pointsEarned: survey.pointsReward }
  }
  return request('POST', `/v1/mlm/member/surveys/${surveyId}/respond`, { answers })
}

// ── Content Library ───────────────────────────────────────────────────────────
const CONTENT_SEED = [
  { id: 'ca-001', title: 'Nordic Vitals Brand Guidelines', category: 'brand', fileType: 'pdf', fileSizeMb: 4.2, access: 'all', downloads: 312, active: true, addedAt: '2026-06-01', description: 'Official brand colours, logos, typography, and usage rules.' },
  { id: 'ca-002', title: 'Compensation Plan PDF 2026', category: 'training', fileType: 'pdf', fileSizeMb: 1.8, access: 'all', downloads: 874, active: true, addedAt: '2026-06-10', description: 'Full comp plan breakdown with rank thresholds and bonus tables.' },
  { id: 'ca-003', title: 'Product Line Overview (Slides)', category: 'product', fileType: 'pptx', fileSizeMb: 7.6, access: 'all', downloads: 541, active: true, addedAt: '2026-06-15', description: 'Slide deck covering all product lines, key ingredients, and benefits.' },
  { id: 'ca-004', title: 'Omega-3 Clinical Study Summary', category: 'product', fileType: 'pdf', fileSizeMb: 0.9, access: 'silver', downloads: 203, active: true, addedAt: '2026-06-20', description: 'Summarised third-party clinical data on bioavailability.' },
  { id: 'ca-005', title: 'Prospect Outreach Scripts (EN)', category: 'marketing', fileType: 'docx', fileSizeMb: 0.4, access: 'all', downloads: 1024, active: true, addedAt: '2026-07-01', description: 'Proven cold-outreach scripts for social media and direct messaging.' },
  { id: 'ca-006', title: 'Social Media Content Pack Q3', category: 'marketing', fileType: 'zip', fileSizeMb: 38.5, access: 'all', downloads: 687, active: true, addedAt: '2026-07-05', description: '60 pre-sized social images for Instagram, Facebook, and TikTok.' },
  { id: 'ca-007', title: 'Leadership Academy — Module 1', category: 'training', fileType: 'mp4', fileSizeMb: 124.0, access: 'silver', downloads: 156, active: true, addedAt: '2026-07-10', description: 'Building your first 3 legs. 45-minute video walkthrough by top earners.' },
  { id: 'ca-008', title: 'Leadership Academy — Module 2', category: 'training', fileType: 'mp4', fileSizeMb: 98.0, access: 'gold', downloads: 89, active: true, addedAt: '2026-07-12', description: 'Rank advancement strategies and team duplication techniques.' },
  { id: 'ca-009', title: 'GDPR Compliance Checklist', category: 'compliance', fileType: 'pdf', fileSizeMb: 0.3, access: 'all', downloads: 94, active: true, addedAt: '2026-07-20', description: 'Step-by-step GDPR checklist for members operating in the EU.' },
  { id: 'ca-010', title: 'Autoship & Loyalty Explainer', category: 'product', fileType: 'pdf', fileSizeMb: 1.1, access: 'all', downloads: 258, active: true, addedAt: '2026-07-25', description: 'How autoship tiers, loyalty points, and bonus products work.' },
  { id: 'ca-011', title: 'Event Promo Kit – NordicSummit 2026', category: 'marketing', fileType: 'zip', fileSizeMb: 52.0, access: 'all', downloads: 143, active: true, addedAt: '2026-08-01', description: 'Banners, flyers, and email templates for the upcoming annual event.' },
  { id: 'ca-012', title: 'Diamond Circle Strategy Guide', category: 'training', fileType: 'pdf', fileSizeMb: 2.3, access: 'diamond', downloads: 31, active: true, addedAt: '2026-08-03', description: 'Advanced strategies shared exclusively with Diamond rank and above.' },
]

let _content = null
function _caInit() { if (!_content) _content = JSON.parse(JSON.stringify(CONTENT_SEED)); return _content }
function _caSave(c) { _content = c }

const MEMBER_DOWNLOADS_SEED = [
  { assetId: 'ca-001', downloadedAt: '2026-07-15T10:22:00Z' },
  { assetId: 'ca-002', downloadedAt: '2026-07-20T14:05:00Z' },
  { assetId: 'ca-005', downloadedAt: '2026-08-01T09:11:00Z' },
  { assetId: 'ca-006', downloadedAt: '2026-08-03T16:44:00Z' },
]

let _memberDownloads = null
function _mdInit() { if (!_memberDownloads) _memberDownloads = JSON.parse(JSON.stringify(MEMBER_DOWNLOADS_SEED)); return _memberDownloads }

export async function getAdminContent({ category, access } = {}) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    let assets = _caInit()
    if (category && category !== 'all') assets = assets.filter(a => a.category === category)
    if (access && access !== 'all') assets = assets.filter(a => a.access === access)
    return { assets }
  }
  return request('GET', '/v1/mlm/admin/content', null, { category, access })
}

export async function createContentAsset(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    const asset = { id: `ca-${Date.now()}`, downloads: 0, addedAt: new Date().toISOString().slice(0, 10), active: true, ...data }
    _caSave([..._caInit(), asset])
    return { asset }
  }
  return request('POST', '/v1/mlm/admin/content', data)
}

export async function updateContentAsset(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    _caSave(_caInit().map(a => a.id === id ? { ...a, ...data } : a))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/content/${id}`, data)
}

export async function deleteContentAsset(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _caSave(_caInit().filter(a => a.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/content/${id}`)
}

export async function getMemberDownloads() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 170))
    const memberRank = 'silver'
    const rankOrder = ['all', 'silver', 'gold', 'platinum', 'diamond']
    const memberRankIdx = rankOrder.indexOf(memberRank)
    const available = _caInit().filter(a => {
      if (!a.active) return false
      const reqIdx = rankOrder.indexOf(a.access)
      return memberRankIdx >= reqIdx
    })
    const downloaded = _mdInit()
    const downloadedSet = new Set(downloaded.map(d => d.assetId))
    return {
      available: available.map(a => ({ ...a, alreadyDownloaded: downloadedSet.has(a.id) })),
      history: downloaded.map(d => {
        const asset = _caInit().find(a => a.id === d.assetId)
        return { ...d, asset }
      }).filter(d => d.asset),
    }
  }
  return request('GET', '/v1/mlm/member/downloads')
}

export async function logDownload(assetId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 100))
    if (!_mdInit().find(d => d.assetId === assetId)) {
      _mdInit().push({ assetId, downloadedAt: new Date().toISOString() })
    }
    _caSave(_caInit().map(a => a.id === assetId ? { ...a, downloads: a.downloads + 1 } : a))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/member/downloads/${assetId}/log`, {})
}

// ── Admin Training Manager ────────────────────────────────────────────────────

const _tmKey = 'nv_admin_training_modules'

function _tmInit() {
  try {
    const s = localStorage.getItem(_tmKey)
    if (s) return JSON.parse(s)
  } catch {}
  const seed = TRAINING_MODULES.map((m, i) => ({
    ...m,
    status: 'active',
    requiredRank: ['all', 'bronze', 'silver', 'gold', 'platinum'][i % 5],
    completions: [38, 31, 24, 17, 11][i % 5],
    avgCompletionRate: [82, 74, 61, 49, 38][i % 5],
    createdAt: '2026-01-15',
    updatedAt: '2026-07-01',
  }))
  localStorage.setItem(_tmKey, JSON.stringify(seed))
  return seed
}
function _tmSave(d) { localStorage.setItem(_tmKey, JSON.stringify(d)) }

export async function getAdminTrainingModules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    return _tmInit()
  }
  return request('GET', '/v1/mlm/admin/training')
}

export async function createAdminTrainingModule(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const mod = {
      ...data,
      id: `module-${Date.now()}`,
      lessons: [],
      completions: 0,
      avgCompletionRate: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString().slice(0, 10),
    }
    _tmSave([..._tmInit(), mod])
    return mod
  }
  return request('POST', '/v1/mlm/admin/training', data)
}

export async function updateAdminTrainingModule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    _tmSave(_tmInit().map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString().slice(0, 10) } : m))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/training/${id}`, data)
}

export async function deleteAdminTrainingModule(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _tmSave(_tmInit().filter(m => m.id !== id))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/training/${id}`)
}

export async function addAdminTrainingLesson(moduleId, lesson) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: [...m.lessons, { ...lesson, id: `l-${Date.now()}` }], updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/training/${moduleId}/lessons`, lesson)
}

export async function updateAdminTrainingLesson(moduleId, lessonId, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...data } : l), updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/training/${moduleId}/lessons/${lessonId}`, data)
}

export async function deleteAdminTrainingLesson(moduleId, lessonId) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    _tmSave(_tmInit().map(m => {
      if (m.id !== moduleId) return m
      return { ...m, lessons: m.lessons.filter(l => l.id !== lessonId), updatedAt: new Date().toISOString().slice(0, 10) }
    }))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/training/${moduleId}/lessons/${lessonId}`)
}

// ── Admin Loyalty Config ──────────────────────────────────────────────────────

const _lcKey = 'nv_admin_loyalty_config'

const _lcSeed = {
  earnRules: [
    { id: 'er-purchase',   activity: 'Purchase',         description: 'Points per NOK spent on shop orders', rate: 1,    unit: 'pts / NOK', enabled: true },
    { id: 'er-autoship',   activity: 'Autoship Order',   description: '1.5× multiplier on autoship purchases', rate: 1.5, unit: 'multiplier', enabled: true },
    { id: 'er-recruit',    activity: 'New Recruit',       description: 'Flat bonus when a direct recruit activates', rate: 500, unit: 'pts flat', enabled: true },
    { id: 'er-training',   activity: 'Training Module',   description: 'Bonus on completing a training module (varies per module)', rate: 100, unit: 'pts base', enabled: true },
    { id: 'er-rank',       activity: 'Rank Advancement',  description: 'Flat bonus awarded on rank promotion', rate: 1000, unit: 'pts flat', enabled: true },
    { id: 'er-review',     activity: 'Product Review',    description: 'Bonus for submitting a verified product review', rate: 50,  unit: 'pts flat', enabled: true },
    { id: 'er-referral',   activity: 'Referral Conversion', description: 'Points when a referred lead makes their first purchase', rate: 200, unit: 'pts flat', enabled: true },
    { id: 'er-birthday',   activity: 'Birthday Bonus',    description: 'Annual birthday surprise (scales with tier)', rate: 250, unit: 'pts (Silver)', enabled: true },
    { id: 'er-challenge',  activity: 'Challenge Completion', description: 'Bonus on completing a monthly challenge', rate: 300, unit: 'pts flat', enabled: true },
    { id: 'er-survey',     activity: 'Survey Completion', description: 'Small bonus for completing platform surveys', rate: 25,  unit: 'pts flat', enabled: false },
  ],
  tiers: [
    { id: 'tier-bronze',   name: 'Bronze',   minPoints: 0,     maxPoints: 2499,  earnMultiplier: 1.0,  color: '#cd7f32', perks: ['1× earn rate', 'Birthday bonus 100 pts'] },
    { id: 'tier-silver',   name: 'Silver',   minPoints: 2500,  maxPoints: 7499,  earnMultiplier: 1.25, color: '#94a3b8', perks: ['1.25× earn rate', 'Free shipping >500 NOK', 'Birthday bonus 250 pts'] },
    { id: 'tier-gold',     name: 'Gold',     minPoints: 7500,  maxPoints: 19999, earnMultiplier: 1.5,  color: '#f59e0b', perks: ['1.5× earn rate', 'Free shipping always', 'Exclusive product access', 'Birthday bonus 500 pts'] },
    { id: 'tier-platinum', name: 'Platinum', minPoints: 20000, maxPoints: null,  earnMultiplier: 2.0,  color: '#a855f7', perks: ['2× earn rate', 'Free shipping always', 'Priority support', 'VIP product previews', 'Birthday bonus 1000 pts'] },
  ],
  expiryPolicy: {
    enabled: true,
    monthsToExpiry: 12,
    warningDaysBeforeExpiry: 30,
    expiryType: 'rolling',
  },
  redemptionOptions: LOYALTY_DATA.redeemOptions.map(o => ({ ...o, enabled: true })),
  stats: {
    totalActiveMembers: 312,
    totalPointsOutstanding: 1_248_500,
    totalPointsEarnedLastMonth: 87_400,
    totalPointsRedeemedLastMonth: 23_100,
    avgPointsPerMember: 4002,
    silverPct: 34,
    goldPct: 18,
    platinumPct: 6,
  },
}

function _lcInit() {
  try {
    const s = localStorage.getItem(_lcKey)
    if (s) return JSON.parse(s)
  } catch {}
  localStorage.setItem(_lcKey, JSON.stringify(_lcSeed))
  return _lcSeed
}
function _lcSave(d) { localStorage.setItem(_lcKey, JSON.stringify(d)) }

export async function getAdminLoyaltyConfig() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 190))
    return _lcInit()
  }
  return request('GET', '/v1/mlm/admin/loyalty/config')
}

export async function updateEarnRule(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _lcInit()
    cfg.earnRules = cfg.earnRules.map(r => r.id === id ? { ...r, ...data } : r)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/earn-rules/${id}`, data)
}

export async function updateLoyaltyTier(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const cfg = _lcInit()
    cfg.tiers = cfg.tiers.map(t => t.id === id ? { ...t, ...data } : t)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/tiers/${id}`, data)
}

export async function updateExpiryPolicy(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 130))
    const cfg = _lcInit()
    cfg.expiryPolicy = { ...cfg.expiryPolicy, ...data }
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', '/v1/mlm/admin/loyalty/expiry', data)
}

export async function createLoyaltyRedemptionOption(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 160))
    const cfg = _lcInit()
    const opt = { ...data, id: `opt-${Date.now()}`, enabled: true }
    cfg.redemptionOptions = [...cfg.redemptionOptions, opt]
    _lcSave(cfg)
    return opt
  }
  return request('POST', '/v1/mlm/admin/loyalty/redemption-options', data)
}

export async function updateLoyaltyRedemptionOption(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    const cfg = _lcInit()
    cfg.redemptionOptions = cfg.redemptionOptions.map(o => o.id === id ? { ...o, ...data } : o)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/loyalty/redemption-options/${id}`, data)
}

export async function deleteLoyaltyRedemptionOption(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const cfg = _lcInit()
    cfg.redemptionOptions = cfg.redemptionOptions.filter(o => o.id !== id)
    _lcSave(cfg)
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/loyalty/redemption-options/${id}`)
}

// ── Price Lists ────────────────────────────────────────────────────────────────
const _plKey = 'nv_price_lists'
const _poKey = 'nv_price_overrides'
function _plInit() { try { const s = localStorage.getItem(_plKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_plKey, JSON.stringify(PRICE_LISTS)); return PRICE_LISTS }
function _plSave(d) { localStorage.setItem(_plKey, JSON.stringify(d)) }
function _poInit() { try { const s = localStorage.getItem(_poKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_poKey, JSON.stringify(PRICE_OVERRIDES)); return PRICE_OVERRIDES }
function _poSave(d) { localStorage.setItem(_poKey, JSON.stringify(d)) }

export async function getAdminPriceLists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _plInit() }
  return request('GET', '/v1/mlm/admin/price-lists')
}
export async function createAdminPriceList(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); const pl = _plInit(); const n = { ...data, id: `pl-${Date.now()}`, memberCount: 0 }; pl.push(n); _plSave(pl); return n }
  return request('POST', '/v1/mlm/admin/price-lists', data)
}
export async function updateAdminPriceList(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); const pl = _plInit().map(x => x.id === id ? { ...x, ...data } : x); _plSave(pl); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/price-lists/${id}`, data)
}
export async function deleteAdminPriceList(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _plSave(_plInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/price-lists/${id}`)
}
export async function getAdminPriceOverrides() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _poInit() }
  return request('GET', '/v1/mlm/admin/price-overrides')
}
export async function setAdminPriceOverride(productId, listId, price) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 140))
    const rows = _poInit().map(r => {
      if (r.productId !== productId) return r
      const overrides = { ...r.overrides }
      if (price == null) delete overrides[listId]
      else overrides[listId] = price
      return { ...r, overrides }
    })
    _poSave(rows); return { ok: true }
  }
  return request('PUT', `/v1/mlm/admin/price-overrides/${productId}/${listId}`, { price })
}

// ── SMS / WhatsApp Campaigns ───────────────────────────────────────────────────
const _smsKey = 'nv_sms_campaigns'
function _smsInit() { try { const s = localStorage.getItem(_smsKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_smsKey, JSON.stringify(SMS_CAMPAIGNS)); return SMS_CAMPAIGNS }
function _smsSave(d) { localStorage.setItem(_smsKey, JSON.stringify(d)) }

export async function getAdminSmsCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 190)); return _smsInit() }
  return request('GET', '/v1/mlm/admin/sms-campaigns')
}
export async function getAdminSmsStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return SMS_STATS }
  return request('GET', '/v1/mlm/admin/sms-campaigns/stats')
}
export async function createAdminSmsCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const campaigns = _smsInit()
    const n = { ...data, id: `sms-${Date.now()}`, status: data.sendNow ? 'sent' : (data.scheduledAt ? 'scheduled' : 'draft'), sentAt: data.sendNow ? new Date().toISOString() : null, stats: data.sendNow ? { sent: 0, delivered: 0, clicked: 0, optOut: 0 } : undefined }
    campaigns.unshift(n); _smsSave(campaigns); return n
  }
  return request('POST', '/v1/mlm/admin/sms-campaigns', data)
}
export async function updateAdminSmsCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _smsSave(_smsInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/sms-campaigns/${id}`, data)
}
export async function deleteAdminSmsCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _smsSave(_smsInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/sms-campaigns/${id}`)
}
export async function sendAdminSmsCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 800)); _smsSave(_smsInit().map(x => x.id === id ? { ...x, status: 'sent', sentAt: new Date().toISOString(), stats: { sent: Math.floor(Math.random() * 2000) + 200, delivered: Math.floor(Math.random() * 1900) + 190, clicked: Math.floor(Math.random() * 400) + 20, optOut: Math.floor(Math.random() * 20) } } : x)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/sms-campaigns/${id}/send`)
}

// ── Member Vouchers ────────────────────────────────────────────────────────────
export async function getMemberVouchers() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_VOUCHERS }
  return request('GET', '/v1/mlm/member/vouchers')
}
export async function claimMemberVoucher(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('POST', `/v1/mlm/member/vouchers/${id}/claim`)
}

// ── Member Webinars ────────────────────────────────────────────────────────────
export async function getMemberWebinars() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_WEBINARS }
  return request('GET', '/v1/mlm/member/webinars')
}
export async function getMemberWebinarRecordings() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return MEMBER_WEBINAR_RECORDINGS }
  return request('GET', '/v1/mlm/member/webinars/recordings')
}
export async function registerMemberWebinar(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/mlm/member/webinars/${id}/register`)
}

// ── Admin Push Notifications ─────────────────────────────────────────────────
const _pushKey = 'nv_push_campaigns'
function _pushInit() { try { const s = localStorage.getItem(_pushKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_pushKey, JSON.stringify(PUSH_CAMPAIGNS)); return PUSH_CAMPAIGNS }
function _pushSave(d) { localStorage.setItem(_pushKey, JSON.stringify(d)) }

export async function getAdminPushCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _pushInit() }
  return request('GET', '/v1/mlm/admin/push-campaigns')
}
export async function getAdminPushStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return PUSH_STATS }
  return request('GET', '/v1/mlm/admin/push-campaigns/stats')
}
export async function createAdminPushCampaign(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _pushInit()
    const n = { ...data, id: `push-${Date.now()}`, status: data.sendNow ? 'sent' : (data.scheduledAt ? 'scheduled' : 'draft'), sentAt: data.sendNow ? new Date().toISOString() : null, stats: data.sendNow ? { sent: 0, delivered: 0, clicked: 0, dismissed: 0 } : undefined }
    list.unshift(n); _pushSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/push-campaigns', data)
}
export async function updateAdminPushCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _pushSave(_pushInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/push-campaigns/${id}`, data)
}
export async function deleteAdminPushCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _pushSave(_pushInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/push-campaigns/${id}`)
}
export async function sendAdminPushCampaign(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const subs = Math.floor(Math.random() * 1500) + 500
    _pushSave(_pushInit().map(x => x.id === id ? { ...x, status: 'sent', sentAt: new Date().toISOString(), stats: { sent: subs, delivered: Math.floor(subs * 0.97), clicked: Math.floor(subs * 0.25), dismissed: Math.floor(subs * 0.18) } } : x))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/push-campaigns/${id}/send`)
}

// ── Member Payout Requests ───────────────────────────────────────────────────
const _payoutsKey = 'nv_member_payouts'
function _payoutsInit() { try { const s = localStorage.getItem(_payoutsKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_payoutsKey, JSON.stringify(MEMBER_PAYOUTS)); return MEMBER_PAYOUTS }
function _payoutsSave(d) { localStorage.setItem(_payoutsKey, JSON.stringify(d)) }

export async function getMemberPayouts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return _payoutsInit() }
  return request('GET', '/v1/mlm/member/payouts')
}
export async function requestMemberPayout(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const list = _payoutsInit()
    const n = { ...data, id: `po-${Date.now()}`, status: 'processing', requestedAt: new Date().toISOString(), processedAt: null, ref: null }
    list.unshift(n); _payoutsSave(list); return n
  }
  return request('POST', '/v1/mlm/member/payouts', data)
}

// ── Admin API Keys ────────────────────────────────────────────────────────────
const _keysKey = 'nv_api_keys'
function _keysInit() { try { const s = localStorage.getItem(_keysKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_keysKey, JSON.stringify(API_KEYS)); return API_KEYS }
function _keysSave(d) { localStorage.setItem(_keysKey, JSON.stringify(d)) }

export async function getAdminApiKeys() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _keysInit() }
  return request('GET', '/v1/mlm/admin/api-keys')
}
export async function getAdminApiKeyStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return API_KEY_STATS }
  return request('GET', '/v1/mlm/admin/api-keys/stats')
}
export async function getAdminApiKeyScopes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 100)); return API_KEY_SCOPES }
  return request('GET', '/v1/mlm/admin/api-keys/scopes')
}
export async function createAdminApiKey(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 250))
    const list = _keysInit()
    const raw = `nv_live_sk_${Math.random().toString(36).slice(2,8)}...${Math.random().toString(36).slice(2,6)}`
    const n = { ...data, id: `key-${Date.now()}`, preview: raw, status: 'active', createdAt: new Date().toISOString(), lastUsedAt: null, callsThisMonth: 0, _fullKey: raw }
    list.unshift(n); _keysSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/api-keys', data)
}
export async function revokeAdminApiKey(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); _keysSave(_keysInit().map(x => x.id === id ? { ...x, status: 'revoked' } : x)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/api-keys/${id}/revoke`)
}
export async function deleteAdminApiKey(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _keysSave(_keysInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/api-keys/${id}`)
}

// ── Admin Territories ─────────────────────────────────────────────────────────
const _terKey = 'nv_territories'
function _terInit() { try { const s = localStorage.getItem(_terKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_terKey, JSON.stringify(TERRITORIES)); return TERRITORIES }
function _terSave(d) { localStorage.setItem(_terKey, JSON.stringify(d)) }

export async function getAdminTerritories() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _terInit() }
  return request('GET', '/v1/mlm/admin/territories')
}
export async function createAdminTerritory(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _terInit()
    const n = { ...data, id: `ter-${Date.now()}`, memberCount: 0, revenue: 0, status: 'open', createdAt: new Date().toISOString() }
    list.push(n); _terSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/territories', data)
}
export async function updateAdminTerritory(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _terSave(_terInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/territories/${id}`, data)
}
export async function deleteAdminTerritory(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _terSave(_terInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/territories/${id}`)
}

// ── Member Referral Links ─────────────────────────────────────────────────────
const _rlKey = 'nv_referral_links'
function _rlInit() { try { const s = localStorage.getItem(_rlKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_rlKey, JSON.stringify(MEMBER_REFERRAL_LINKS)); return MEMBER_REFERRAL_LINKS }
function _rlSave(d) { localStorage.setItem(_rlKey, JSON.stringify(d)) }

export async function getMemberReferralLinks() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _rlInit() }
  return request('GET', '/v1/mlm/member/referral-links')
}
export async function getMemberReferralLinkStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return MEMBER_REFERRAL_LINK_STATS }
  return request('GET', '/v1/mlm/member/referral-links/stats')
}
export async function createMemberReferralLink(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const list = _rlInit()
    const n = { ...data, id: `rl-${Date.now()}`, url: `https://nordic-vitals.vercel.app/ref/${data.slug}`, clicks: 0, signups: 0, conversions: 0, revenueNok: 0, createdAt: new Date().toISOString(), lastClickAt: null }
    list.unshift(n); _rlSave(list); return n
  }
  return request('POST', '/v1/mlm/member/referral-links', data)
}
export async function deleteMemberReferralLink(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _rlSave(_rlInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/referral-links/${id}`)
}

// ── Member Achievements ───────────────────────────────────────────────────────
export async function getMemberAchievements() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return MEMBER_ACHIEVEMENTS }
  return request('GET', '/v1/mlm/member/achievements')
}

// ── Admin Influencer Program ──────────────────────────────────────────────────
const _infKey = 'nv_influencers'
function _infInit() { try { const s = localStorage.getItem(_infKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_infKey, JSON.stringify(INFLUENCERS)); return INFLUENCERS }
function _infSave(d) { localStorage.setItem(_infKey, JSON.stringify(d)) }

export async function getAdminInfluencers() {
  if (MOCK) { await new Promise(r => setTimeout(r, 170)); return _infInit() }
  return request('GET', '/v1/mlm/admin/influencers')
}
export async function getAdminInfluencerStats() {
  if (MOCK) { await new Promise(r => setTimeout(r, 120)); return INFLUENCER_STATS }
  return request('GET', '/v1/mlm/admin/influencers/stats')
}
export async function getAdminInfluencerMeta() {
  if (MOCK) { await new Promise(r => setTimeout(r, 80)); return { tiers: INFLUENCER_TIERS, platforms: INFLUENCER_PLATFORMS } }
  return request('GET', '/v1/mlm/admin/influencers/meta')
}
export async function createAdminInfluencer(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 220))
    const list = _infInit()
    const n = { ...data, id: `inf-${Date.now()}`, totalSalesNok: 0, status: 'pending', joinedAt: new Date().toISOString(), lastPostAt: null, pendingPosts: 0 }
    list.unshift(n); _infSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/influencers', data)
}
export async function updateAdminInfluencer(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); _infSave(_infInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/influencers/${id}`, data)
}
export async function deleteAdminInfluencer(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); _infSave(_infInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/influencers/${id}`)
}

// ── Member Commission Statements ──────────────────────────────────────────────
export async function getMemberCommissionStatements() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return COMMISSION_STATEMENTS }
  return request('GET', '/v1/mlm/member/commission-statements')
}
export async function getMemberCommissionStatementSummary() {
  if (MOCK) { await new Promise(r => setTimeout(r, 100)); return COMMISSION_STATEMENT_SUMMARY }
  return request('GET', '/v1/mlm/member/commission-statements/summary')
}

// ── Admin Product Categories ──────────────────────────────────────────────────
const PRODUCT_CATEGORIES = [
  { id: 'cat-1', name: 'Omega & Fish Oils', slug: 'omega-fish-oils', parentId: null, productCount: 8, sortOrder: 1, active: true, description: 'High-grade omega-3 and fish oil supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-2', name: 'Vitamins & Minerals', slug: 'vitamins-minerals', parentId: null, productCount: 14, sortOrder: 2, active: true, description: 'Essential vitamins and mineral supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-3', name: 'Protein & Amino Acids', slug: 'protein-amino', parentId: null, productCount: 6, sortOrder: 3, active: true, description: 'Protein powders and amino acid supplements', createdAt: '2025-09-01T00:00:00Z' },
  { id: 'cat-4', name: 'Weight Management', slug: 'weight-management', parentId: null, productCount: 5, sortOrder: 4, active: true, description: 'Supplements supporting healthy weight management', createdAt: '2025-09-10T00:00:00Z' },
  { id: 'cat-5', name: 'Immune Support', slug: 'immune-support', parentId: null, productCount: 7, sortOrder: 5, active: true, description: 'Supplements for immune system support', createdAt: '2025-09-10T00:00:00Z' },
  { id: 'cat-6', name: 'Vitamin D3 Variants', slug: 'vitamin-d3-variants', parentId: 'cat-2', productCount: 3, sortOrder: 1, active: true, description: 'Vitamin D3 in various forms and potencies', createdAt: '2025-10-01T00:00:00Z' },
  { id: 'cat-7', name: 'B-Complex Range', slug: 'b-complex', parentId: 'cat-2', productCount: 4, sortOrder: 2, active: true, description: 'Full spectrum B-vitamin complexes', createdAt: '2025-10-01T00:00:00Z' },
  { id: 'cat-8', name: 'Arctic Krill Oil', slug: 'arctic-krill', parentId: 'cat-1', productCount: 3, sortOrder: 1, active: true, description: 'Sustainably sourced Norwegian krill oil', createdAt: '2025-10-15T00:00:00Z' },
  { id: 'cat-9', name: 'Sports Performance', slug: 'sports-performance', parentId: null, productCount: 4, sortOrder: 6, active: false, description: 'Performance supplements for active lifestyles', createdAt: '2025-11-01T00:00:00Z' },
  { id: 'cat-10', name: 'Bundles & Kits', slug: 'bundles-kits', parentId: null, productCount: 5, sortOrder: 7, active: true, description: 'Curated supplement bundles and starter kits', createdAt: '2025-11-01T00:00:00Z' },
]
const _catKey = 'nv_categories'
function _catInit() { try { const s = localStorage.getItem(_catKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_catKey, JSON.stringify(PRODUCT_CATEGORIES)); return PRODUCT_CATEGORIES }
function _catSave(d) { localStorage.setItem(_catKey, JSON.stringify(d)) }

export async function getAdminCategories() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return _catInit() }
  return request('GET', '/v1/mlm/admin/categories')
}
export async function createAdminCategory(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = _catInit()
    const n = { ...data, id: `cat-${Date.now()}`, productCount: 0, createdAt: new Date().toISOString() }
    list.push(n); _catSave(list); return n
  }
  return request('POST', '/v1/mlm/admin/categories', data)
}
export async function updateAdminCategory(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); _catSave(_catInit().map(x => x.id === id ? { ...x, ...data } : x)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/categories/${id}`, data)
}
export async function deleteAdminCategory(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); _catSave(_catInit().filter(x => x.id !== id)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/categories/${id}`)
}

// ── Admin Co-Op Advertising ───────────────────────────────────────────────────
const COOP_CLAIMS = [
  { id: 'coop-1', memberId: 'm-101', memberName: 'Ingrid Solvang', channel: 'instagram', amount: 2500, status: 'pending', description: 'Instagram story campaign for Omega-3 launch', submittedAt: '2026-07-28T10:00:00Z', reviewedAt: null, reviewedBy: null, rejectReason: null },
  { id: 'coop-2', memberId: 'm-102', memberName: 'Erik Thorvaldsen', channel: 'facebook', amount: 1800, status: 'approved', description: 'Facebook boosted post targeting 35-55 health-conscious', submittedAt: '2026-07-20T09:15:00Z', reviewedAt: '2026-07-22T11:30:00Z', reviewedBy: 'Admin', rejectReason: null },
  { id: 'coop-3', memberId: 'm-103', memberName: 'Lena Bergstrom', channel: 'google', amount: 4200, status: 'approved', description: 'Google Ads search campaign for vitamin D3', submittedAt: '2026-07-15T14:20:00Z', reviewedAt: '2026-07-17T09:00:00Z', reviewedBy: 'Admin', rejectReason: null },
  { id: 'coop-4', memberId: 'm-104', memberName: 'Lars Nygaard', channel: 'tiktok', amount: 3000, status: 'rejected', description: 'TikTok influencer partnership', submittedAt: '2026-07-10T16:45:00Z', reviewedAt: '2026-07-12T10:00:00Z', reviewedBy: 'Admin', rejectReason: 'Content did not comply with brand guidelines' },
  { id: 'coop-5', memberId: 'm-105', memberName: 'Anna Lindqvist', channel: 'instagram', amount: 1500, status: 'pending', description: 'Instagram reel series for weight management', submittedAt: '2026-08-01T08:30:00Z', reviewedAt: null, reviewedBy: null, rejectReason: null },
  { id: 'coop-6', memberId: 'm-106', memberName: 'Bjorn Haugen', channel: 'print', amount: 6500, status: 'approved', description: 'Local newspaper ad in Bergen and Stavanger', submittedAt: '2026-07-05T12:00:00Z', reviewedAt: '2026-07-07T15:00:00Z', reviewedBy: 'Admin', rejectReason: null },
]
const COOP_CONFIG = { totalBudgetNok: 500000, spentNok: 248600, pendingNok: 19000, matchRate: 50, maxClaimNok: 10000, minSalesRequiredNok: 20000, eligibleRanks: ['Silver', 'Gold', 'Platinum', 'Diamond'] }
const _coopKey = 'nv_coop_claims'
function _coopInit() { try { const s = localStorage.getItem(_coopKey); if (s) return JSON.parse(s) } catch {} localStorage.setItem(_coopKey, JSON.stringify(COOP_CLAIMS)); return COOP_CLAIMS }
function _coopSave(d) { localStorage.setItem(_coopKey, JSON.stringify(d)) }

export async function getAdminCoopClaims() {
  if (MOCK) { await new Promise(r => setTimeout(r, 160)); return _coopInit() }
  return request('GET', '/v1/mlm/admin/co-op/claims')
}
export async function getAdminCoopConfig() {
  if (MOCK) { await new Promise(r => setTimeout(r, 80)); return COOP_CONFIG }
  return request('GET', '/v1/mlm/admin/co-op/config')
}
export async function reviewAdminCoopClaim(id, decision) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    _coopSave(_coopInit().map(x => x.id === id ? { ...x, status: decision.approve ? 'approved' : 'rejected', reviewedAt: new Date().toISOString(), reviewedBy: 'Admin', rejectReason: decision.reason || null } : x))
    return { ok: true }
  }
  return request('POST', `/v1/mlm/admin/co-op/claims/${id}/review`, decision)
}
export async function updateAdminCoopConfig(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('PUT', '/v1/mlm/admin/co-op/config', data)
}

// ── Member My Coupons ─────────────────────────────────────────────────────────
const MEMBER_COUPONS = [
  { id: 'coup-1', code: 'WELCOME20', type: 'percent', value: 20, description: 'Welcome bonus — 20% off your next order', minOrderNok: 0, maxDiscountNok: null, expiresAt: '2026-12-31T23:59:59Z', usedAt: null, earnedFor: 'Onboarding completion' },
  { id: 'coup-2', code: 'LOYAL100', type: 'fixed', value: 100, description: 'Loyalty reward — NOK 100 off', minOrderNok: 500, maxDiscountNok: 100, expiresAt: '2026-09-30T23:59:59Z', usedAt: null, earnedFor: 'Loyalty milestone 500 pts' },
  { id: 'coup-3', code: 'BDAY15', type: 'percent', value: 15, description: 'Birthday month gift', minOrderNok: 0, maxDiscountNok: 200, expiresAt: '2026-08-31T23:59:59Z', usedAt: null, earnedFor: 'Birthday reward' },
  { id: 'coup-4', code: 'REFER50', type: 'fixed', value: 50, description: 'Referral reward coupon', minOrderNok: 300, maxDiscountNok: 50, expiresAt: '2026-10-15T23:59:59Z', usedAt: null, earnedFor: 'Referred Maja Strand' },
  { id: 'coup-5', code: 'SUMMER25', type: 'percent', value: 25, description: 'Summer campaign discount — used', minOrderNok: 0, maxDiscountNok: 500, expiresAt: '2026-07-31T23:59:59Z', usedAt: '2026-07-10T14:30:00Z', earnedFor: 'Summer promotion' },
]
export async function getMemberCoupons() {
  if (MOCK) { await new Promise(r => setTimeout(r, 140)); return MEMBER_COUPONS }
  return request('GET', '/v1/mlm/member/coupons')
}

// ── Member Co-Op Advertising ──────────────────────────────────────────────────
const MEMBER_COOP_SUMMARY = { balance: 4750, lifetimeEarned: 7250, lifetimeClaimed: 2500, pendingApproval: 800, eligibilityStatus: 'eligible', currentRank: 'Gold', matchRate: 50, maxClaimNok: 5000, nextLevelUnlocks: 'Platinum: 75% match rate' }
const MEMBER_COOP_CLAIMS = [
  { id: 'mcc-1', channel: 'instagram', amount: 1500, matched: 750, description: 'Instagram stories campaign for Omega-3', status: 'approved', submittedAt: '2026-07-01T10:00:00Z', reviewedAt: '2026-07-03T09:00:00Z' },
  { id: 'mcc-2', channel: 'facebook', amount: 1000, matched: 500, description: 'Boosted Facebook post — health supplements', status: 'approved', submittedAt: '2026-06-15T10:00:00Z', reviewedAt: '2026-06-17T10:00:00Z' },
  { id: 'mcc-3', channel: 'tiktok', amount: 800, matched: null, description: 'TikTok video about vitamins', status: 'pending', submittedAt: '2026-08-02T15:00:00Z', reviewedAt: null },
]
export async function getMemberCoopSummary() {
  if (MOCK) { await new Promise(r => setTimeout(r, 130)); return MEMBER_COOP_SUMMARY }
  return request('GET', '/v1/mlm/member/co-op/summary')
}
export async function getMemberCoopClaims() {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return MEMBER_COOP_CLAIMS }
  return request('GET', '/v1/mlm/member/co-op/claims')
}
export async function submitMemberCoopClaim(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { id: `mcc-${Date.now()}`, ...data, status: 'pending', submittedAt: new Date().toISOString(), reviewedAt: null, matched: null } }
  return request('POST', '/v1/mlm/member/co-op/claims', data)
}

// ── Branding & White-Label Config ─────────────────────────────────────────────
const BRANDING_DEFAULTS = {
  company_name: 'Nordic Vitals AS',
  trading_name: 'Nordic Vitals',
  tagline: 'Powered by Arctico',
  ceo_name: 'Bjørn Vidar Hauge',
  ceo_title: 'Founder & CEO',
  tech_partner: 'Arctico / Veriton',
  description: 'Nordic Vitals delivers science-backed supplements through a transparent, fair compensation model powered by Arctico\'s blockchain infrastructure.',
  org_number: '',
  vat_number: '',
  address: '',
  support_email: 'support@nordicvitals.no',
  email_sender_name: 'Nordic Vitals',
  logo_url: '',
  logo_dark_url: '',
  favicon_url: '',
  color_primary: '#c9a84c',
  color_accent: '#3b82f6',
  color_header_bg: '#0a0600',
  color_header_text: '#f5e6c8',
  website_url: 'https://nordic-vitals.vercel.app',
  platform_url: 'https://arctico.duckdns.org',
  social: { facebook: '', instagram: '', telegram: '', linkedin: '', twitter: '' },
  documents: {
    cert_issuer: 'Nordic Vitals AS, powered by Arctico / Veriton',
    cert_footer: 'Nordic Vitals AS · support@nordicvitals.no · Powered by Arctico / Veriton',
    signer1_name: 'Bjørn Vidar Hauge',
    signer1_title: 'Founder & CEO, Arctico / Veriton',
    signer2_name: 'Gary Granello',
    signer2_title: 'Managing Director, Nordic Vitals',
    invoice_footer: 'Nordic Vitals AS · support@nordicvitals.no',
    member_card_footer: 'nordicvitals.no · Powered by Arctico / Veriton',
    email_header_tagline: 'Science-backed supplements. Transparent earnings.',
  },
}

export async function getBrandingConfig() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 120))
    const stored = localStorage.getItem('nv_branding_config')
    return stored ? { ...BRANDING_DEFAULTS, ...JSON.parse(stored) } : { ...BRANDING_DEFAULTS }
  }
  return request('GET', '/v1/mlm/admin/branding')
}

export async function saveBrandingConfig(cfg) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    localStorage.setItem('nv_branding_config', JSON.stringify(cfg))
    return cfg
  }
  return request('PUT', '/v1/mlm/admin/branding', cfg)
}

// ── Flash Sales ──────────────────────────────────────────────────────────────
const FLASH_SALES_SEED = [
  { id: 'fs1', title: 'Summer Protein Blast', discount: 25, discountType: 'percent', products: ['Whey Pro 1kg', 'BCAA Matrix'], stockLimit: 200, sold: 147, startsAt: '2026-08-07T08:00:00Z', endsAt: '2026-08-07T20:00:00Z', status: 'active' },
  { id: 'fs2', title: 'Collagen Bundle Deal', discount: 150, discountType: 'fixed', products: ['Marine Collagen 300g'], stockLimit: 100, sold: 98, startsAt: '2026-08-06T10:00:00Z', endsAt: '2026-08-06T22:00:00Z', status: 'expired' },
  { id: 'fs3', title: 'Back to Basics Omega', discount: 30, discountType: 'percent', products: ['Omega-3 Gold', 'Vitamin D3 5000IU'], stockLimit: 500, sold: 0, startsAt: '2026-08-10T09:00:00Z', endsAt: '2026-08-10T23:59:00Z', status: 'scheduled' },
  { id: 'fs4', title: 'New Member Welcome Pack', discount: 20, discountType: 'percent', products: ['Starter Bundle'], stockLimit: 300, sold: 0, startsAt: '2026-08-15T00:00:00Z', endsAt: '2026-08-15T23:59:00Z', status: 'draft' },
]
export async function getAdminFlashSales() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED)) }
  return request('GET', '/v1/mlm/admin/flash-sales')
}
export async function createAdminFlashSale(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    const item = { ...data, id: 'fs' + Date.now(), sold: 0, status: data.status || 'draft' }
    localStorage.setItem('nv_flash_sales', JSON.stringify([...list, item]))
    return item
  }
  return request('POST', '/v1/mlm/admin/flash-sales', data)
}
export async function updateAdminFlashSale(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    const updated = list.map(s => s.id === id ? { ...s, ...data } : s)
    localStorage.setItem('nv_flash_sales', JSON.stringify(updated))
    return updated.find(s => s.id === id)
  }
  return request('PUT', `/v1/mlm/admin/flash-sales/${id}`, data)
}
export async function deleteAdminFlashSale(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const list = JSON.parse(localStorage.getItem('nv_flash_sales') || JSON.stringify(FLASH_SALES_SEED))
    localStorage.setItem('nv_flash_sales', JSON.stringify(list.filter(s => s.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/flash-sales/${id}`)
}

// ── Admin Digital Products ────────────────────────────────────────────────────
const DIGITAL_PRODUCTS_SEED = [
  { id: 'dp1', title: 'Nordic Nutrition Guide 2026', type: 'ebook', fileSize: '4.2 MB', format: 'PDF', price: 0, accessLevel: 'all', downloads: 1240, status: 'active', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'dp2', 'title': 'MLM Success Masterclass (12 videos)', type: 'course', fileSize: '1.8 GB', format: 'MP4', price: 499, accessLevel: 'member', downloads: 387, status: 'active', createdAt: '2026-02-20T10:00:00Z' },
  { id: 'dp3', title: 'Peptide Science Deep Dive', type: 'ebook', fileSize: '6.1 MB', format: 'PDF', price: 0, accessLevel: 'silver', downloads: 892, status: 'active', createdAt: '2026-03-10T10:00:00Z' },
  { id: 'dp4', title: 'Business Builder Toolkit', type: 'bundle', fileSize: '120 MB', format: 'ZIP', price: 299, accessLevel: 'member', downloads: 204, status: 'active', createdAt: '2026-04-05T10:00:00Z' },
  { id: 'dp5', title: 'Leadership Training Series (Q1)', type: 'course', fileSize: '2.4 GB', format: 'MP4', price: 0, accessLevel: 'gold', downloads: 134, status: 'draft', createdAt: '2026-07-01T10:00:00Z' },
]
export async function getAdminDigitalProducts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED)) }
  return request('GET', '/v1/mlm/admin/digital-products')
}
export async function createAdminDigitalProduct(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 200))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    const item = { ...data, id: 'dp' + Date.now(), downloads: 0, createdAt: new Date().toISOString() }
    localStorage.setItem('nv_digital_products', JSON.stringify([...list, item]))
    return item
  }
  return request('POST', '/v1/mlm/admin/digital-products', data)
}
export async function updateAdminDigitalProduct(id, data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 180))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    const updated = list.map(p => p.id === id ? { ...p, ...data } : p)
    localStorage.setItem('nv_digital_products', JSON.stringify(updated))
    return updated.find(p => p.id === id)
  }
  return request('PUT', `/v1/mlm/admin/digital-products/${id}`, data)
}
export async function deleteAdminDigitalProduct(id) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 150))
    const list = JSON.parse(localStorage.getItem('nv_digital_products') || JSON.stringify(DIGITAL_PRODUCTS_SEED))
    localStorage.setItem('nv_digital_products', JSON.stringify(list.filter(p => p.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/digital-products/${id}`)
}

// ── Member Digital Products ───────────────────────────────────────────────────
const MEMBER_DIGITAL_SEED = [
  { id: 'mdp1', title: 'Nordic Nutrition Guide 2026', type: 'ebook', fileSize: '4.2 MB', format: 'PDF', accessLevel: 'all', downloadedAt: null, purchasedAt: '2026-01-20T10:00:00Z', price: 0 },
  { id: 'mdp2', title: 'MLM Success Masterclass (12 videos)', type: 'course', fileSize: '1.8 GB', format: 'MP4', accessLevel: 'member', downloadedAt: '2026-03-15T14:00:00Z', purchasedAt: '2026-02-25T10:00:00Z', price: 499 },
  { id: 'mdp3', title: 'Peptide Science Deep Dive', type: 'ebook', fileSize: '6.1 MB', format: 'PDF', accessLevel: 'silver', downloadedAt: null, purchasedAt: '2026-04-10T10:00:00Z', price: 0 },
]
export async function getMemberDigitalProducts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return MEMBER_DIGITAL_SEED }
  return request('GET', '/v1/mlm/member/digital-products')
}
export async function downloadMemberDigitalProduct(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { url: '#', expires: new Date(Date.now() + 600000).toISOString() } }
  return request('POST', `/v1/mlm/member/digital-products/${id}/download`)
}

// ── Member Team Goals ─────────────────────────────────────────────────────────
const TEAM_GOALS_SEED = {
  teamName: 'Team Nordic Alpha',
  goals: [
    { id: 'tg1', title: 'August Recruiting Drive', metric: 'new_members', target: 50, current: 31, unit: 'members', deadline: '2026-08-31', status: 'on_track' },
    { id: 'tg2', title: 'Q3 Team Volume', metric: 'team_volume', target: 500000, current: 342180, unit: 'NOK', deadline: '2026-09-30', status: 'on_track' },
    { id: 'tg3', title: 'Gold Rank Promotions', metric: 'rank_ups', target: 5, current: 2, deadline: '2026-08-31', unit: 'members', status: 'behind' },
    { id: 'tg4', title: 'Customer Retention Rate', metric: 'retention', target: 80, current: 74, unit: '%', deadline: '2026-08-31', status: 'behind' },
    { id: 'tg5', title: 'Training Completion', metric: 'training', target: 100, current: 100, unit: '%', deadline: '2026-07-31', status: 'completed' },
  ],
  topContributors: [
    { name: 'Anna Berg', recruits: 8, volume: 68400, rank: 'Gold' },
    { name: 'Lars Eriksen', recruits: 6, volume: 52100, rank: 'Silver' },
    { name: 'Mia Svensson', recruits: 5, volume: 47800, rank: 'Silver' },
    { name: 'Tor Halvorsen', recruits: 4, volume: 39200, rank: 'Bronze' },
  ],
}
export async function getMemberTeamGoals() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return TEAM_GOALS_SEED }
  return request('GET', '/v1/mlm/member/team-goals')
}

// ─── Admin Waitlists ──────────────────────────────────────────────────────────
const ADMIN_WAITLISTS_SEED = [
  { productId: 'p1', productName: 'Arctic Omega-3 Ultra (300 caps)', sku: 'AO3-300', entries: 47, oldestEntry: '2026-07-01T08:00:00Z', status: 'out_of_stock', restockEta: '2026-08-15' },
  { productId: 'p2', productName: 'Viking Collagen Peptides 1kg', sku: 'VCP-1KG', entries: 23, oldestEntry: '2026-07-12T10:30:00Z', status: 'out_of_stock', restockEta: '2026-08-10' },
  { productId: 'p3', productName: 'Nordic Vitals Starter Kit', sku: 'NV-START', entries: 88, oldestEntry: '2026-06-20T14:00:00Z', status: 'notified', restockEta: null },
  { productId: 'p4', productName: 'Bjornberry Antioxidant Complex', sku: 'BAC-60', entries: 12, oldestEntry: '2026-07-28T09:15:00Z', status: 'out_of_stock', restockEta: '2026-09-01' },
  { productId: 'p5', productName: 'Arctic Magnesium Night Formula', sku: 'AMN-90', entries: 34, oldestEntry: '2026-07-05T16:45:00Z', status: 'out_of_stock', restockEta: null },
]
const ADMIN_WAITLIST_ENTRIES_SEED = [
  { id: 'we1', name: 'Anna Berg', email: 'anna.berg@email.no', joinedAt: '2026-07-01T08:00:00Z', notified: false },
  { id: 'we2', name: 'Lars Eriksen', email: 'lars.eriksen@email.no', joinedAt: '2026-07-03T11:20:00Z', notified: false },
  { id: 'we3', name: 'Mia Svensson', email: 'mia.svensson@email.se', joinedAt: '2026-07-09T14:50:00Z', notified: false },
  { id: 'we4', name: 'Tor Halvorsen', email: 'tor.h@email.no', joinedAt: '2026-07-15T09:30:00Z', notified: false },
  { id: 'we5', name: 'Ingrid Olsen', email: 'ingrid.o@email.no', joinedAt: '2026-07-22T16:00:00Z', notified: false },
]
export async function getAdminWaitlists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_WAITLISTS_SEED }
  return request('GET', '/v1/mlm/admin/waitlists')
}
export async function getAdminWaitlistEntries(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return ADMIN_WAITLIST_ENTRIES_SEED }
  return request('GET', `/v1/mlm/admin/waitlists/${productId}/entries`)
}
export async function notifyAdminWaitlist(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { notified: ADMIN_WAITLIST_ENTRIES_SEED.length } }
  return request('POST', `/v1/mlm/admin/waitlists/${productId}/notify`)
}
export async function removeAdminWaitlistEntry(productId, entryId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/waitlists/${productId}/entries/${entryId}`)
}

// ─── Admin Seasonal Campaigns ─────────────────────────────────────────────────
const SEASONAL_CAMPAIGNS_SEED = [
  { id: 'sc1', name: 'Viking Summer Solstice', season: 'summer', startsAt: '2026-06-21T00:00:00Z', endsAt: '2026-06-28T23:59:00Z', discountPct: 20, targetAudience: 'all', promoCode: 'SOLSTICE20', status: 'completed', revenue: 184200 },
  { id: 'sc2', name: 'Arctic Midnight Sun Sale', season: 'summer', startsAt: '2026-07-15T00:00:00Z', endsAt: '2026-07-22T23:59:00Z', discountPct: 15, targetAudience: 'members', promoCode: 'MIDNIGHT15', status: 'completed', revenue: 127400 },
  { id: 'sc3', name: 'Back to Vitality (Autumn)', season: 'autumn', startsAt: '2026-09-01T00:00:00Z', endsAt: '2026-09-14T23:59:00Z', discountPct: 25, targetAudience: 'all', promoCode: 'AUTUMN25', status: 'scheduled', revenue: 0 },
  { id: 'sc4', name: 'Nordic Winter Warrior', season: 'winter', startsAt: '2026-12-01T00:00:00Z', endsAt: '2026-12-31T23:59:00Z', discountPct: 30, targetAudience: 'vip', promoCode: 'WARRIOR30', status: 'draft', revenue: 0 },
  { id: 'sc5', name: 'New Year New You 2027', season: 'winter', startsAt: '2027-01-01T00:00:00Z', endsAt: '2027-01-14T23:59:00Z', discountPct: 20, targetAudience: 'all', promoCode: 'NEWYOU27', status: 'draft', revenue: 0 },
]
export async function getAdminSeasonalCampaigns() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return SEASONAL_CAMPAIGNS_SEED }
  return request('GET', '/v1/mlm/admin/seasonal-campaigns')
}
export async function createAdminSeasonalCampaign(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id: 'sc_new', ...data } }
  return request('POST', '/v1/mlm/admin/seasonal-campaigns', data)
}
export async function updateAdminSeasonalCampaign(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/seasonal-campaigns/${id}`, data)
}
export async function deleteAdminSeasonalCampaign(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/seasonal-campaigns/${id}`)
}

// ─── Member Waitlists ─────────────────────────────────────────────────────────
const MEMBER_WAITLISTS_SEED = [
  { productId: 'p1', productName: 'Arctic Omega-3 Ultra (300 caps)', sku: 'AO3-300', imgUrl: null, joinedAt: '2026-07-10T09:00:00Z', position: 8, totalWaiting: 47, restockEta: '2026-08-15', notifyMe: true },
  { productId: 'p4', productName: 'Bjornberry Antioxidant Complex', sku: 'BAC-60', imgUrl: null, joinedAt: '2026-07-28T09:15:00Z', position: 3, totalWaiting: 12, restockEta: '2026-09-01', notifyMe: true },
  { productId: 'p5', productName: 'Arctic Magnesium Night Formula', sku: 'AMN-90', imgUrl: null, joinedAt: '2026-07-18T11:30:00Z', position: 14, totalWaiting: 34, restockEta: null, notifyMe: false },
]
export async function getMemberWaitlists() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_WAITLISTS_SEED }
  return request('GET', '/v1/mlm/member/waitlists')
}
export async function removeMemberWaitlist(productId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/waitlists/${productId}`)
}
export async function toggleMemberWaitlistNotify(productId, notify) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/waitlists/${productId}`, { notifyMe: notify })
}

// ─── Member Rank History ──────────────────────────────────────────────────────
const MEMBER_RANK_HISTORY_SEED = {
  currentRank: 'Gold',
  currentPoints: 42800,
  nextRank: 'Platinum',
  nextPoints: 75000,
  history: [
    { month: '2025-10', rank: 'Bronze', points: 8200, commissions: 4100, recruits: 2 },
    { month: '2025-11', rank: 'Bronze', points: 11400, commissions: 5700, recruits: 1 },
    { month: '2025-12', rank: 'Silver', points: 16800, commissions: 8400, recruits: 3 },
    { month: '2026-01', rank: 'Silver', points: 21300, commissions: 10650, recruits: 2 },
    { month: '2026-02', rank: 'Silver', points: 25900, commissions: 12950, recruits: 2 },
    { month: '2026-03', rank: 'Silver', points: 28400, commissions: 14200, recruits: 1 },
    { month: '2026-04', rank: 'Gold', points: 33100, commissions: 16550, recruits: 4 },
    { month: '2026-05', rank: 'Gold', points: 36700, commissions: 18350, recruits: 2 },
    { month: '2026-06', rank: 'Gold', points: 39200, commissions: 19600, recruits: 3 },
    { month: '2026-07', rank: 'Gold', points: 42800, commissions: 21400, recruits: 2 },
  ],
  milestones: [
    { date: '2025-12-01', event: 'Reached Silver', icon: '🥈' },
    { date: '2026-04-01', event: 'Reached Gold', icon: '🥇' },
    { date: '2026-04-15', event: 'First 5-figure commission month', icon: '💰' },
  ],
}
export async function getMemberRankHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return MEMBER_RANK_HISTORY_SEED }
  return request('GET', '/v1/mlm/member/rank-history')
}

// ─── Admin Vendor Management ──────────────────────────────────────────────────
const ADMIN_VENDORS_SEED = [
  { id: 'v1', name: 'Arctic Naturals Supply Co.', contact: 'procurement@arcticnaturals.no', country: 'Norway', products: 12, status: 'active', paymentTerms: 'Net 30', leadDays: 14, createdAt: '2025-01-10' },
  { id: 'v2', name: 'Nordic BioLab AS', contact: 'orders@nordicbiolab.no', country: 'Norway', products: 7, status: 'active', paymentTerms: 'Net 45', leadDays: 21, createdAt: '2025-03-15' },
  { id: 'v3', name: 'FjordFarm Organics', contact: 'trade@fjordfarm.no', country: 'Norway', products: 5, status: 'active', paymentTerms: 'Net 30', leadDays: 10, createdAt: '2025-06-01' },
  { id: 'v4', name: 'Boreal Ingredients Ltd', contact: 'sales@borealIngr.uk', country: 'United Kingdom', products: 3, status: 'inactive', paymentTerms: 'Net 60', leadDays: 28, createdAt: '2024-11-20' },
  { id: 'v5', name: 'Scandinavian Herbs GmbH', contact: 'einkauf@scanherbs.de', country: 'Germany', products: 9, status: 'active', paymentTerms: 'Net 30', leadDays: 18, createdAt: '2025-02-08' },
]
export async function getAdminVendors() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_VENDORS_SEED }
  return request('GET', '/v1/mlm/admin/vendors')
}
export async function createAdminVendor(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 350)); return { id: 'v_new', ...data, products: 0, createdAt: new Date().toISOString().slice(0,10) } }
  return request('POST', '/v1/mlm/admin/vendors', data)
}
export async function updateAdminVendor(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/vendors/${id}`, data)
}
export async function deleteAdminVendor(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/vendors/${id}`)
}

// ─── Admin Live Streams ────────────────────────────────────────────────────────
const ADMIN_LIVE_STREAMS_SEED = [
  { id: 'ls1', title: 'August Product Launch — New Omega-3 Line', host: 'Bjørn Håkon', scheduledAt: '2026-08-12T18:00:00Z', status: 'scheduled', viewers: 0, platform: 'YouTube', registrations: 312 },
  { id: 'ls2', title: 'Weekly Business Opportunity Webinar', host: 'Ingrid Solberg', scheduledAt: '2026-08-08T15:00:00Z', status: 'live', viewers: 847, platform: 'Zoom', registrations: 920 },
  { id: 'ls3', title: 'July Flash Sale — Members Only', host: 'Erik Nygård', scheduledAt: '2026-07-25T12:00:00Z', status: 'ended', viewers: 1204, platform: 'YouTube', registrations: 1350 },
  { id: 'ls4', title: 'Training: Advanced Network Building', host: 'Bjørn Håkon', scheduledAt: '2026-07-18T17:00:00Z', status: 'ended', viewers: 689, platform: 'Zoom', registrations: 740 },
  { id: 'ls5', title: 'Q3 Results & Recognition Ceremony', host: 'Ingrid Solberg', scheduledAt: '2026-08-20T19:00:00Z', status: 'scheduled', viewers: 0, platform: 'YouTube', registrations: 204 },
]
export async function getAdminLiveStreams() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_LIVE_STREAMS_SEED }
  return request('GET', '/v1/mlm/admin/live-streams')
}
export async function createAdminLiveStream(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 380)); return { id: 'ls_new', ...data, viewers: 0, registrations: 0 } }
  return request('POST', '/v1/mlm/admin/live-streams', data)
}
export async function updateAdminLiveStream(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...data } }
  return request('PUT', `/v1/mlm/admin/live-streams/${id}`, data)
}
export async function deleteAdminLiveStream(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/live-streams/${id}`)
}

// ─── Admin Tax Documents ───────────────────────────────────────────────────────
const ADMIN_TAX_DOCS_SEED = [
  { id: 'td1', memberId: 'm1', memberName: 'Sigrid Andersen', type: '1099-NEC', taxYear: 2025, amount: 48200, status: 'sent', sentAt: '2026-01-31', downloaded: true },
  { id: 'td2', memberId: 'm2', memberName: 'Lars Eriksen', type: '1099-NEC', taxYear: 2025, amount: 29700, status: 'sent', sentAt: '2026-01-31', downloaded: false },
  { id: 'td3', memberId: 'm3', memberName: 'Marte Johansen', type: 'W-9', taxYear: 2025, amount: null, status: 'pending', sentAt: null, downloaded: false },
  { id: 'td4', memberId: 'm4', memberName: 'Petter Dahl', type: '1099-NEC', taxYear: 2025, amount: 81500, status: 'sent', sentAt: '2026-01-31', downloaded: true },
  { id: 'td5', memberId: 'm5', memberName: 'Hanne Kristiansen', type: '1099-NEC', taxYear: 2025, amount: 15400, status: 'draft', sentAt: null, downloaded: false },
  { id: 'td6', memberId: 'm6', memberName: 'Olav Berg', type: 'W-9', taxYear: 2025, amount: null, status: 'sent', sentAt: '2026-01-15', downloaded: true },
]
export async function getAdminTaxDocs(year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_TAX_DOCS_SEED.filter(d => !year || d.taxYear === year) }
  return request('GET', `/v1/mlm/admin/tax-docs${year ? `?year=${year}` : ''}`)
}
export async function generateAdminTaxDoc(memberId, type, year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { ok: true, id: 'td_new' } }
  return request('POST', '/v1/mlm/admin/tax-docs/generate', { memberId, type, year })
}
export async function sendAdminTaxDoc(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/tax-docs/${id}/send`)
}
export async function bulkSendAdminTaxDocs(year, type) {
  if (MOCK) { await new Promise(r => setTimeout(r, 900)); return { sent: 4, failed: 0 } }
  return request('POST', '/v1/mlm/admin/tax-docs/bulk-send', { year, type })
}

// ─── Admin Payout Schedule ─────────────────────────────────────────────────────
const ADMIN_PAYOUT_SCHEDULE_SEED = {
  frequency: 'biweekly',
  dayOfWeek: 5,
  cutoffDays: 3,
  minPayoutAmount: 50,
  maxPayoutAmount: 50000,
  processingBankDays: 2,
  currencies: ['NOK', 'EUR', 'USD'],
  upcomingRuns: [
    { id: 'pr1', scheduledDate: '2026-08-15', cutoffDate: '2026-08-12', estimatedTotal: 284700, memberCount: 187, status: 'scheduled' },
    { id: 'pr2', scheduledDate: '2026-08-29', cutoffDate: '2026-08-26', estimatedTotal: 0, memberCount: 0, status: 'pending' },
    { id: 'pr3', scheduledDate: '2026-07-31', cutoffDate: '2026-07-28', estimatedTotal: 271300, memberCount: 172, status: 'completed' },
    { id: 'pr4', scheduledDate: '2026-07-17', cutoffDate: '2026-07-14', estimatedTotal: 259800, memberCount: 165, status: 'completed' },
  ],
}
export async function getAdminPayoutSchedule() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_PAYOUT_SCHEDULE_SEED }
  return request('GET', '/v1/mlm/admin/payout-schedule')
}
export async function updateAdminPayoutSchedule(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 350)); return { ok: true } }
  return request('PUT', '/v1/mlm/admin/payout-schedule', data)
}
export async function triggerAdminPayoutRun(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/payout-schedule/runs/${id}/trigger`)
}

// ─── Member My Badges ──────────────────────────────────────────────────────────
const MEMBER_BADGES_SEED = [
  { id: 'b1', name: 'First Sale', category: 'sales', icon: '🏷️', earnedAt: '2025-11-02', description: 'Made your first product sale.', rarity: 'common' },
  { id: 'b2', name: 'Silver Rank', category: 'rank', icon: '🥈', earnedAt: '2025-12-01', description: 'Achieved Silver rank.', rarity: 'uncommon' },
  { id: 'b3', name: 'Team Builder', category: 'recruitment', icon: '👥', earnedAt: '2026-01-14', description: 'Recruited 5 active members.', rarity: 'uncommon' },
  { id: 'b4', name: 'Gold Rank', category: 'rank', icon: '🥇', earnedAt: '2026-04-01', description: 'Achieved Gold rank.', rarity: 'rare' },
  { id: 'b5', name: 'Top Seller', category: 'sales', icon: '⭐', earnedAt: '2026-05-31', description: 'Ranked #1 in monthly sales.', rarity: 'rare' },
  { id: 'b6', name: 'Training Champion', category: 'training', icon: '🎓', earnedAt: '2026-06-15', description: 'Completed all onboarding modules.', rarity: 'common' },
  { id: 'b7', name: 'Fast Start', category: 'sales', icon: '🚀', earnedAt: '2025-11-30', description: 'Hit Fast Start bonus in first month.', rarity: 'uncommon' },
  { id: 'b8', name: 'Community Leader', category: 'special', icon: '🌟', earnedAt: '2026-07-01', description: 'Recognised for outstanding community contribution.', rarity: 'epic' },
  { id: 'b9', name: 'Perfect Month', category: 'sales', icon: '💎', earnedAt: '2026-07-31', description: 'Hit personal sales target every week for a full month.', rarity: 'epic' },
]
const MEMBER_BADGES_LOCKED = [
  { id: 'bl1', name: 'Platinum Rank', category: 'rank', icon: '💎', description: 'Achieve Platinum rank.', rarity: 'legendary', requirement: 'Reach 75,000 PV' },
  { id: 'bl2', name: 'Century Recruiter', category: 'recruitment', icon: '🏆', description: 'Recruit 100 active members.', rarity: 'legendary', requirement: '100 active downline' },
]
export async function getMemberBadges() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { earned: MEMBER_BADGES_SEED, locked: MEMBER_BADGES_LOCKED } }
  return request('GET', '/v1/mlm/member/badges')
}

// ─── Member Business Analytics ─────────────────────────────────────────────────
const MEMBER_BIZ_ANALYTICS_SEED = {
  period: '2026-07',
  kpis: [
    { key: 'conversionRate', label: 'Conversion Rate', value: 18.4, unit: '%', trend: +2.1, trendDir: 'up' },
    { key: 'avgOrderValue', label: 'Avg Order Value', value: 1247, unit: 'NOK', trend: +84, trendDir: 'up' },
    { key: 'teamGrowthRate', label: 'Team Growth Rate', value: 8.3, unit: '%', trend: -1.2, trendDir: 'down' },
    { key: 'retentionRate', label: 'Customer Retention', value: 74.2, unit: '%', trend: +3.5, trendDir: 'up' },
    { key: 'earningsPerMember', label: 'Earnings / Team Member', value: 4820, unit: 'NOK', trend: +310, trendDir: 'up' },
    { key: 'activeRatio', label: 'Active Member Ratio', value: 61.7, unit: '%', trend: -0.8, trendDir: 'down' },
  ],
  earningsTrend: [
    { month: '2026-02', personal: 12400, team: 8900 },
    { month: '2026-03', personal: 14800, team: 10200 },
    { month: '2026-04', personal: 16550, team: 13100 },
    { month: '2026-05', personal: 18350, team: 15600 },
    { month: '2026-06', personal: 19600, team: 17400 },
    { month: '2026-07', personal: 21400, team: 19800 },
  ],
  topProducts: [
    { name: 'Arctic Omega-3 Ultra', sales: 47, revenue: 58280 },
    { name: 'Nordic Collagen Plus', sales: 31, revenue: 27590 },
    { name: 'Bjornberry Complex', sales: 28, revenue: 19880 },
    { name: 'Vitamin D3+K2', sales: 22, revenue: 14300 },
  ],
}
export async function getMemberBizAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return MEMBER_BIZ_ANALYTICS_SEED }
  return request('GET', `/v1/mlm/member/business-analytics${period ? `?period=${period}` : ''}`)
}

// ─── Member My Documents ───────────────────────────────────────────────────────
const MEMBER_DOCS_SEED = [
  { id: 'md1', name: '1099-NEC 2025', type: '1099-NEC', year: 2025, size: '84 KB', issuedAt: '2026-01-31', downloadUrl: '#' },
  { id: 'md2', name: 'W-9 Form on file', type: 'W-9', year: 2025, size: '32 KB', issuedAt: '2025-11-05', downloadUrl: '#' },
  { id: 'md3', name: 'Distributor Agreement', type: 'contract', year: 2025, size: '124 KB', issuedAt: '2025-10-28', downloadUrl: '#' },
  { id: 'md4', name: 'Annual Earnings Statement 2025', type: 'earnings', year: 2025, size: '48 KB', issuedAt: '2026-02-15', downloadUrl: '#' },
  { id: 'md5', name: 'Annual Earnings Statement 2024', type: 'earnings', year: 2024, size: '44 KB', issuedAt: '2025-02-12', downloadUrl: '#' },
  { id: 'md6', name: '1099-NEC 2024', type: '1099-NEC', year: 2024, size: '79 KB', issuedAt: '2025-01-31', downloadUrl: '#' },
]
export async function getMemberDocs() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_DOCS_SEED }
  return request('GET', '/v1/mlm/member/documents')
}
export async function downloadMemberDoc(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { url: '#' } }
  return request('GET', `/v1/mlm/member/documents/${id}/download`)
}

// ─── Member Social Sharing ─────────────────────────────────────────────────────
const MEMBER_SHARE_TEMPLATES_SEED = [
  { id: 'st1', category: 'rank', title: 'Rank Achievement', message: "I just reached {rank} rank at Nordic Vitals! 🎉 Building a health business that creates real results. Join me:", includesLink: true },
  { id: 'st2', category: 'earnings', title: 'Milestone Earnings', message: "Just hit a new personal earnings record with Nordic Vitals! 💪 Health + wealth — discover how:", includesLink: true },
  { id: 'st3', category: 'product', title: 'Product Recommendation', message: "Loving the Arctic Omega-3 Ultra from Nordic Vitals — 3 months of consistent use, noticeable difference. 🌊 Try it:", includesLink: true },
  { id: 'st4', category: 'recruitment', title: 'Team Growth', message: "My team just hit {teamSize} members! So proud of everyone. There's still room — let's grow together:", includesLink: true },
]
const MEMBER_SHARE_STATS_SEED = { clicks: 214, conversions: 18, conversionRate: 8.4, topPlatform: 'Facebook' }
export async function getMemberShareTemplates() {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { templates: MEMBER_SHARE_TEMPLATES_SEED, stats: MEMBER_SHARE_STATS_SEED } }
  return request('GET', '/v1/mlm/member/social-sharing')
}
export async function trackMemberShare(templateId, platform) {
  if (MOCK) { await new Promise(r => setTimeout(r, 150)); return { ok: true } }
  return request('POST', '/v1/mlm/member/social-sharing/track', { templateId, platform })
}

// ─── Admin Commission Disputes ──────────────────────────────────────────────────
const ADMIN_DISPUTES_SEED = [
  { id: 'cd1', memberName: 'Erik Solberg', runLabel: 'June 2026 Run', claimedAmount: '12,480 NOK', paidAmount: '9,320 NOK', reason: 'My downline volume was not counted correctly — three of my direct referrals placed orders on the last day of the period.', filedAt: '2026-07-08', status: 'open' },
  { id: 'cd2', memberName: 'Astrid Berge', runLabel: 'June 2026 Run', claimedAmount: '6,750 NOK', paidAmount: '5,100 NOK', reason: 'Fast Start bonus was not applied — I enrolled 4 members in my first 30 days.', filedAt: '2026-07-05', status: 'reviewing' },
  { id: 'cd3', memberName: 'Lars Christiansen', runLabel: 'May 2026 Run', claimedAmount: '3,200 NOK', paidAmount: '2,950 NOK', reason: 'Loyalty multiplier not applied to my subscription orders.', filedAt: '2026-06-10', status: 'resolved' },
  { id: 'cd4', memberName: 'Silje Dahl', runLabel: 'May 2026 Run', claimedAmount: '8,100 NOK', paidAmount: '8,100 NOK', reason: 'Rank bonus missing for reaching Gold tier mid-period.', filedAt: '2026-06-07', status: 'denied' },
  { id: 'cd5', memberName: 'Mads Holm', runLabel: 'July 2026 Run', claimedAmount: '4,560 NOK', paidAmount: '3,100 NOK', reason: 'Team volume from my Silver leg was incorrectly capped.', filedAt: '2026-08-02', status: 'open' },
]
export async function getAdminCommissionDisputes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_DISPUTES_SEED }
  return request('GET', '/v1/mlm/admin/commission-disputes')
}
export async function resolveAdminCommissionDispute(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, ...payload } }
  return request('PUT', `/v1/mlm/admin/commission-disputes/${id}/resolve`, payload)
}

// ─── Admin Loyalty Ledger ───────────────────────────────────────────────────────
const ADMIN_LOYALTY_LEDGER_SEED = [
  { id: 'll1', date: '2026-08-07', memberName: 'Erik Solberg', type: 'purchase', delta: 1250, balanceAfter: 8430, reason: 'Order #NV-20845 — Arctic Omega-3 Ultra x2' },
  { id: 'll2', date: '2026-08-07', memberName: 'Astrid Berge', type: 'referral', delta: 500, balanceAfter: 3110, reason: 'Referral bonus — Lars Christiansen joined' },
  { id: 'll3', date: '2026-08-06', memberName: 'Lars Christiansen', type: 'bonus', delta: 2000, balanceAfter: 5200, reason: 'Gold rank achievement bonus' },
  { id: 'll4', date: '2026-08-06', memberName: 'Silje Dahl', type: 'redemption', delta: -1500, balanceAfter: 640, reason: '150 NOK voucher redeemed — Order #NV-20811' },
  { id: 'll5', date: '2026-08-05', memberName: 'Mads Holm', type: 'manual', delta: 300, balanceAfter: 2300, reason: 'Manual compensation — delayed shipment on Order #NV-20790' },
  { id: 'll6', date: '2026-08-05', memberName: 'Anna Hanssen', type: 'expiry', delta: -800, balanceAfter: 0, reason: 'Points expired — 12-month inactivity policy' },
  { id: 'll7', date: '2026-08-04', memberName: 'Erik Solberg', type: 'purchase', delta: 620, balanceAfter: 7180, reason: 'Order #NV-20778 — Nordic Collagen Plus' },
  { id: 'll8', date: '2026-08-03', memberName: 'Astrid Berge', type: 'purchase', delta: 890, balanceAfter: 2610, reason: 'Order #NV-20751 — Bjornberry Complex x3' },
]
export async function getAdminLoyaltyLedger() {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return ADMIN_LOYALTY_LEDGER_SEED }
  return request('GET', '/v1/mlm/admin/loyalty-ledger')
}
export async function adjustAdminLoyaltyPoints(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 280))
    return { id: `ll${Date.now()}`, date: new Date().toISOString().slice(0,10), memberName: payload.memberName, type: 'manual', delta: payload.delta, balanceAfter: Math.abs(payload.delta) * 2, reason: payload.reason }
  }
  return request('POST', '/v1/mlm/admin/loyalty-ledger/adjust', payload)
}

// ─── Admin Feature Flags ────────────────────────────────────────────────────────
const ADMIN_FEATURE_FLAGS_SEED = [
  { id: 'ff1', key: 'mlm.token_wallet', description: 'Enable the member token wallet and tARCTX display.', enabled: true, rolloutPercent: 100, environment: 'production', lastModified: '2026-07-15', modifiedBy: 'bjorn@arctico' },
  { id: 'ff2', key: 'mlm.digital_products', description: 'Allow members to purchase and download digital products.', enabled: true, rolloutPercent: 100, environment: 'production', lastModified: '2026-08-01', modifiedBy: 'gary' },
  { id: 'ff3', key: 'mlm.live_streams', description: 'Show Live Streams section in admin and event calendar.', enabled: true, rolloutPercent: 50, environment: 'production', lastModified: '2026-08-07', modifiedBy: 'gary' },
  { id: 'ff4', key: 'mlm.vip_tiers', description: 'Enable VIP tier system (Silver/Gold/Platinum/Diamond).', enabled: true, rolloutPercent: 100, environment: 'all', lastModified: '2026-07-20', modifiedBy: 'bjorn@arctico' },
  { id: 'ff5', key: 'mlm.crypto_payouts', description: 'Allow members to receive commission payouts in ARCTX token.', enabled: false, rolloutPercent: 0, environment: 'staging', lastModified: '2026-06-30', modifiedBy: 'bjorn@arctico' },
  { id: 'ff6', key: 'shop.buy_now', description: 'Show Buy Now button on product pages for faster checkout.', enabled: true, rolloutPercent: 80, environment: 'production', lastModified: '2026-08-03', modifiedBy: 'gary' },
  { id: 'ff7', key: 'mlm.co_op_advertising', description: 'Enable Co-Op advertising module for members.', enabled: true, rolloutPercent: 100, environment: 'all', lastModified: '2026-08-05', modifiedBy: 'gary' },
  { id: 'ff8', key: 'admin.ai_fraud_detection', description: 'Experimental AI-based fraud scoring in the Fraud & Risk panel.', enabled: false, rolloutPercent: 0, environment: 'staging', lastModified: '2026-07-28', modifiedBy: 'bjorn@arctico' },
]
export async function getAdminFeatureFlags() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return ADMIN_FEATURE_FLAGS_SEED }
  return request('GET', '/v1/mlm/admin/feature-flags')
}
export async function updateAdminFeatureFlag(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return payload }
  return request('PUT', `/v1/mlm/admin/feature-flags/${id}`, payload)
}

// ─── Admin Coupons ──────────────────────────────────────────────────────────────
const ADMIN_COUPONS_SEED = [
  { id: 'cp1', code: 'NORDIC20', type: 'percent', value: 20, scope: 'all', minOrder: 500, maxUses: null, uses: 214, totalSavings: 89400, expiresAt: '2026-12-31', status: 'active' },
  { id: 'cp2', code: 'NEWMEMBER100', type: 'fixed', value: 100, scope: 'new', minOrder: 300, maxUses: 500, uses: 87, totalSavings: 8700, expiresAt: '2026-09-30', status: 'active' },
  { id: 'cp3', code: 'FREESHIP', type: 'free_shipping', value: 0, scope: 'members', minOrder: 0, maxUses: null, uses: 1203, totalSavings: 72180, expiresAt: null, status: 'active' },
  { id: 'cp4', code: 'SUMMER15', type: 'percent', value: 15, scope: 'all', minOrder: 0, maxUses: 1000, uses: 1000, totalSavings: 94500, expiresAt: '2026-07-31', status: 'expired' },
  { id: 'cp5', code: 'VIP30', type: 'percent', value: 30, scope: 'members', minOrder: 1000, maxUses: 200, uses: 43, totalSavings: 38700, expiresAt: '2026-10-15', status: 'paused' },
]
export async function getAdminCoupons() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return ADMIN_COUPONS_SEED }
  return request('GET', '/v1/mlm/admin/coupons')
}
export async function createAdminCoupon(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `cp${Date.now()}`, uses: 0, totalSavings: 0, ...payload } }
  return request('POST', '/v1/mlm/admin/coupons', payload)
}
export async function updateAdminCoupon(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return payload }
  return request('PUT', `/v1/mlm/admin/coupons/${id}`, payload)
}
export async function deleteAdminCoupon(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/coupons/${id}`)
}

// ─── Member Income Disclosure ────────────────────────────────────────────────────
const INCOME_DISCLOSURE_SEED = {
  '2025': {
    myRank: 'Gold',
    myAnnualEarnings: 187400,
    rankPercentile: 68,
    totalDistributors: 1842,
    disclaimer: 'These income figures are before taxes and business expenses. The earnings shown represent gross commissions paid by Nordic Vitals AS. Distributor results vary significantly based on individual effort, market conditions, and time commitment.',
    tiers: [
      { rank: 'Starter', pctDistributors: 38.2, avgEarnings: 4100, medianEarnings: 1800, top10pct: 12400 },
      { rank: 'Bronze', pctDistributors: 24.1, avgEarnings: 18700, medianEarnings: 14200, top10pct: 48000 },
      { rank: 'Silver', pctDistributors: 18.6, avgEarnings: 54200, medianEarnings: 46900, top10pct: 112000 },
      { rank: 'Gold', pctDistributors: 12.4, avgEarnings: 142800, medianEarnings: 124000, top10pct: 290000 },
      { rank: 'Platinum', pctDistributors: 5.2, avgEarnings: 348000, medianEarnings: 310000, top10pct: 680000 },
      { rank: 'Diamond', pctDistributors: 1.5, avgEarnings: 820000, medianEarnings: 720000, top10pct: 1840000 },
    ],
  },
}
export async function getMemberIncomeDisclosure(year) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return INCOME_DISCLOSURE_SEED[year] || INCOME_DISCLOSURE_SEED['2025'] }
  return request('GET', `/v1/mlm/member/income-disclosure?year=${year}`)
}

// ─── Member Referral Analytics ───────────────────────────────────────────────────
const REFERRAL_ANALYTICS_SEED = {
  clicks: 847,
  uniqueVisitors: 614,
  conversions: 38,
  conversionRate: 6.2,
  revenueAttributed: 112400,
  avgOrderValue: 2958,
  topLinks: [
    { id: 'rl1', label: 'Main referral link', clicks: 412, conversions: 22, rate: 5.3 },
    { id: 'rl2', label: 'Instagram bio link', clicks: 228, conversions: 10, rate: 4.4 },
    { id: 'rl3', label: 'Facebook share — Omega-3 post', clicks: 114, conversions: 4, rate: 3.5 },
    { id: 'rl4', label: 'WhatsApp group share', clicks: 93, conversions: 2, rate: 2.2 },
  ],
  sources: [
    { name: 'Direct / Unknown', pct: 34, color: '#6366f1' },
    { name: 'Instagram', pct: 27, color: '#ec4899' },
    { name: 'Facebook', pct: 18, color: '#3b82f6' },
    { name: 'WhatsApp', pct: 12, color: '#22c55e' },
    { name: 'Other', pct: 9, color: '#f59e0b' },
  ],
  funnel: [
    { label: 'Link clicks', count: 847 },
    { label: 'Landing page views', count: 614 },
    { label: 'Shop visits', count: 320 },
    { label: 'Add to cart', count: 88 },
    { label: 'Purchases', count: 38 },
  ],
}
export async function getMemberReferralAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return REFERRAL_ANALYTICS_SEED }
  return request('GET', `/v1/mlm/member/referral-analytics?period=${period}`)
}

// ─── Member VIP Benefits ─────────────────────────────────────────────────────────
const VIP_BENEFITS_SEED = {
  currentTier: 'Gold',
  currentTierPv: 8420,
  nextTier: { name: 'Platinum', requiredPv: 12000, remaining: 3580, progress: 70 },
  tiers: [
    { name: 'Silver', icon: '🥈', requirement: '3,000+ PV/month', perks: ['5% product discount', 'Priority email support', 'Early access to new products', 'Monthly newsletter with tips'] },
    { name: 'Gold', icon: '🥇', requirement: '7,500+ PV/month', perks: ['10% product discount', 'Dedicated account manager', '2x loyalty points on purchases', 'Exclusive Gold webinars', 'Free shipping on all orders'] },
    { name: 'Platinum', icon: '💎', requirement: '12,000+ PV/month', perks: ['15% product discount', 'VIP phone support line', '3x loyalty points', 'Platinum retreat invite (annual)', 'Custom branded materials', 'Beta feature access'] },
    { name: 'Diamond', icon: '💠', requirement: '25,000+ PV/month', perks: ['20% product discount', 'Personal business coach', '5x loyalty points', 'Diamond gala invitation', 'Revenue share on company growth', 'Co-branded product line option'] },
  ],
  exclusiveOffers: [
    { id: 'eo1', title: 'Gold Members: 25% off Omega Bundle', description: 'Save 25% on the Arctic Omega-3 + D3/K2 bundle. Limited stock.', discount: '25% OFF', tier: 'Gold', expiresAt: '2026-08-15' },
    { id: 'eo2', title: 'Double Points Weekend', description: 'Earn 2x loyalty points on all purchases this weekend only.', discount: '2× Points', tier: 'Gold', expiresAt: '2026-08-11' },
  ],
}
export async function getMemberVipBenefits() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return VIP_BENEFITS_SEED }
  return request('GET', '/v1/mlm/member/vip-benefits')
}

// ─── Member Enrollment Center ─────────────────────────────────────────────────────
const MEMBER_ENROLLMENTS_SEED = {
  totalEnrolled: 47,
  enrolledThisMonth: 3,
  enrollments: [
    { id: 'en1', name: 'Hanne Olsen', email: 'hanne@example.com', invitedAt: '2026-08-05', joinedAt: '2026-08-06', status: 'onboarding', onboardingStep: 3, onboardingTotal: 6 },
    { id: 'en2', name: 'Kristian Berg', email: 'kristian@example.com', invitedAt: '2026-08-03', joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null },
    { id: 'en3', name: 'Tone Elstad', email: 'tone@example.com', invitedAt: '2026-07-28', joinedAt: '2026-07-30', status: 'active', onboardingStep: null, onboardingTotal: null },
    { id: 'en4', name: 'Rune Hauge', email: 'rune@example.com', invitedAt: '2026-07-15', joinedAt: '2026-07-16', status: 'active', onboardingStep: null, onboardingTotal: null },
    { id: 'en5', name: 'Marit Vold', email: 'marit@example.com', invitedAt: '2026-06-01', joinedAt: null, status: 'expired', onboardingStep: null, onboardingTotal: null },
    { id: 'en6', name: 'Sven Aas', email: 'sven@example.com', invitedAt: '2026-08-08', joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null },
  ],
}
export async function getMemberEnrollments() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return MEMBER_ENROLLMENTS_SEED }
  return request('GET', '/v1/mlm/member/enrollments')
}
export async function createMemberEnrollmentInvite(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { id: `en${Date.now()}`, name: payload.name, email: payload.email, invitedAt: new Date().toISOString().slice(0,10), joinedAt: null, status: 'pending', onboardingStep: null, onboardingTotal: null }
  }
  return request('POST', '/v1/mlm/member/enrollments/invite', payload)
}

// ─── Admin Order Disputes ─────────────────────────────────────────────────────
const ADMIN_ORDER_DISPUTES_SEED = [
  { id: 'od1', orderId: 'ORD-10482', memberName: 'Lena Thorvaldsen', reason: 'wrong_item', description: 'Received Vitamin D instead of Omega-3 2000mg.', claimedRefund: 'NOK 449', status: 'open', filedAt: '2026-08-07', priority: 'high' },
  { id: 'od2', orderId: 'ORD-10394', memberName: 'Mads Eriksen', reason: 'damaged', description: 'Packaging crushed, capsules spilled out.', claimedRefund: 'NOK 299', status: 'reviewing', filedAt: '2026-08-06', priority: 'medium' },
  { id: 'od3', orderId: 'ORD-10311', memberName: 'Astrid Haugen', reason: 'not_received', description: 'Order marked delivered but nothing arrived.', claimedRefund: 'NOK 748', status: 'open', filedAt: '2026-08-05', priority: 'high' },
  { id: 'od4', orderId: 'ORD-10270', memberName: 'Petter Lindgren', reason: 'quality_issue', description: 'Strong unusual smell, different from previous batches.', claimedRefund: 'NOK 349', status: 'resolved', filedAt: '2026-08-04', priority: 'low' },
  { id: 'od5', orderId: 'ORD-10211', memberName: 'Silje Bakke', reason: 'wrong_item', description: 'Missing item: Collagen Peptides not included in order.', claimedRefund: 'NOK 599', status: 'denied', filedAt: '2026-08-02', priority: 'medium' },
  { id: 'od6', orderId: 'ORD-10188', memberName: 'Jonas Wiig', reason: 'damaged', description: 'Bottle seal broken on arrival.', claimedRefund: 'NOK 249', status: 'resolved', filedAt: '2026-08-01', priority: 'low' },
]
export async function getAdminOrderDisputes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return ADMIN_ORDER_DISPUTES_SEED }
  return request('GET', '/v1/admin/order-disputes')
}
export async function resolveAdminOrderDispute(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/admin/order-disputes/${id}/resolve`, payload)
}

// ─── Admin Partner Portal ─────────────────────────────────────────────────────
const ADMIN_PARTNERS_SEED = [
  { id: 'pp1', name: 'HealthHub AS', type: 'wholesale', contact: 'anders@healthhub.no', country: 'NO', joinedAt: '2026-01-15', status: 'active', totalOrders: 84, totalRevenue: 'NOK 412,000', discountPct: 20 },
  { id: 'pp2', name: 'VitaLife Sweden', type: 'reseller', contact: 'eva.lund@vitalife.se', country: 'SE', joinedAt: '2026-03-08', status: 'active', totalOrders: 37, totalRevenue: 'NOK 198,000', discountPct: 15 },
  { id: 'pp3', name: 'Nordic Wellbeing GmbH', type: 'wholesale', contact: 'frank.bauer@nordicwellbeing.de', country: 'DE', joinedAt: '2026-05-22', status: 'active', totalOrders: 21, totalRevenue: 'NOK 134,000', discountPct: 18 },
  { id: 'pp4', name: 'Fit & Fresh DK', type: 'brand_ambassador', contact: 'camilla@fitfresh.dk', country: 'DK', joinedAt: '2026-06-10', status: 'pending', totalOrders: 0, totalRevenue: 'NOK 0', discountPct: 10 },
  { id: 'pp5', name: 'Glacier Nutrition UK', type: 'reseller', contact: 'james.k@glacier-nutrition.co.uk', country: 'GB', joinedAt: '2026-04-18', status: 'inactive', totalOrders: 12, totalRevenue: 'NOK 71,000', discountPct: 15 },
]
export async function getAdminPartners() {
  if (MOCK) { await new Promise(r => setTimeout(r, 230)); return ADMIN_PARTNERS_SEED }
  return request('GET', '/v1/admin/partners')
}
export async function createAdminPartner(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `pp${Date.now()}`, ...payload, status: 'pending', totalOrders: 0, totalRevenue: 'NOK 0', joinedAt: new Date().toISOString().slice(0,10) } }
  return request('POST', '/v1/admin/partners', payload)
}
export async function updateAdminPartner(id, payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { ok: true } }
  return request('PATCH', `/v1/admin/partners/${id}`, payload)
}

// ─── Admin Subscription Analytics ────────────────────────────────────────────
const ADMIN_SUB_ANALYTICS_SEED = {
  mrr: 847200,
  arr: 10166400,
  activeSubscriptions: 2140,
  newThisMonth: 138,
  cancelledThisMonth: 41,
  netGrowth: 97,
  churnRate: 1.9,
  avgRevenuePerSub: 396,
  planBreakdown: [
    { plan: 'Starter Monthly', count: 820, mrr: 246000, pct: 29.1 },
    { plan: 'Essential Quarterly', count: 640, mrr: 256000, pct: 30.2 },
    { plan: 'Premium Monthly', count: 480, mrr: 288000, pct: 34.0 },
    { plan: 'Elite Annual', count: 200, mrr: 57200, pct: 6.7 },
  ],
  cohortRetention: [
    { cohort: 'Jan 2026', m1: 100, m2: 88, m3: 79, m4: 73, m5: 68, m6: 64 },
    { cohort: 'Feb 2026', m1: 100, m2: 90, m3: 82, m4: 76, m5: 71, m6: null },
    { cohort: 'Mar 2026', m1: 100, m2: 87, m3: 80, m4: 74, m5: null, m6: null },
    { cohort: 'Apr 2026', m1: 100, m2: 91, m3: 83, m4: null, m5: null, m6: null },
    { cohort: 'May 2026', m1: 100, m2: 89, m3: null, m4: null, m5: null, m6: null },
    { cohort: 'Jun 2026', m1: 100, m2: null, m3: null, m4: null, m5: null, m6: null },
  ],
  mrrTrend: [
    { month: 'Feb', mrr: 712000 }, { month: 'Mar', mrr: 748000 }, { month: 'Apr', mrr: 778000 },
    { month: 'May', mrr: 803000 }, { month: 'Jun', mrr: 828000 }, { month: 'Jul', mrr: 847200 },
  ],
}
export async function getAdminSubscriptionAnalytics(period) {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return ADMIN_SUB_ANALYTICS_SEED }
  return request('GET', `/v1/admin/subscription-analytics?period=${period || 'month'}`)
}

// ─── Admin Social Proof ───────────────────────────────────────────────────────
const ADMIN_SOCIAL_PROOF_SEED = [
  { id: 'sp1', type: 'testimonial', author: 'Hilde R.', location: 'Bergen, Norway', text: 'I have been taking the Omega-3 for 4 months and my joints feel incredible. My doctor is impressed!', product: 'Arctic Omega-3 2000mg', rating: 5, status: 'featured', submittedAt: '2026-08-06', source: 'email' },
  { id: 'sp2', type: 'testimonial', author: 'Lars O.', location: 'Stockholm, Sweden', text: 'Lost 4kg in 6 weeks while taking the protein series. Energy is through the roof.', product: 'Nordic Protein Blend', rating: 5, status: 'approved', submittedAt: '2026-08-05', source: 'web' },
  { id: 'sp3', type: 'ugc', author: '@fitness_ingrid', location: 'Oslo, Norway', text: 'My morning stack just got an upgrade 💪 #NordicVitals #Wellness', product: null, rating: null, status: 'pending', submittedAt: '2026-08-07', source: 'instagram' },
  { id: 'sp4', type: 'testimonial', author: 'Bjarne T.', location: 'Trondheim, Norway', text: 'Finally a Norwegian supplement brand that delivers what it promises.', product: 'Arctic Omega-3 2000mg', rating: 4, status: 'approved', submittedAt: '2026-08-03', source: 'review' },
  { id: 'sp5', type: 'ugc', author: '@healthyvibes_no', location: 'Stavanger, Norway', text: 'Loving my new routine! These vitamins are game changers.', product: null, rating: null, status: 'pending', submittedAt: '2026-08-07', source: 'tiktok' },
  { id: 'sp6', type: 'testimonial', author: 'Maria K.', location: 'Copenhagen, Denmark', text: 'Spammy email tactics. Would not recommend signing up for newsletter.', product: null, rating: 1, status: 'rejected', submittedAt: '2026-08-02', source: 'web' },
]
export async function getAdminSocialProof() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return ADMIN_SOCIAL_PROOF_SEED }
  return request('GET', '/v1/admin/social-proof')
}
export async function updateAdminSocialProofStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('PATCH', `/v1/admin/social-proof/${id}`, { status })
}

// ─── Member Subscription History ─────────────────────────────────────────────
const MEMBER_SUB_HISTORY_SEED = [
  { id: 'sh1', type: 'plan_change', fromPlan: 'Starter Monthly', toPlan: 'Premium Monthly', at: '2026-07-01', note: 'Upgraded for 2× loyalty points benefit' },
  { id: 'sh2', type: 'renewal', plan: 'Starter Monthly', at: '2026-06-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh3', type: 'renewal', plan: 'Starter Monthly', at: '2026-05-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh4', type: 'pause', plan: 'Starter Monthly', at: '2026-04-10', resumedAt: '2026-05-01', note: 'Paused for 3 weeks (travel)' },
  { id: 'sh5', type: 'renewal', plan: 'Starter Monthly', at: '2026-04-01', amount: 'NOK 299', note: 'Auto-renewed' },
  { id: 'sh6', type: 'started', plan: 'Starter Monthly', at: '2026-03-14', amount: 'NOK 299', note: 'First subscription — joined Nordic Vitals' },
]
export async function getMemberSubscriptionHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_SUB_HISTORY_SEED }
  return request('GET', '/v1/mlm/member/subscription-history')
}

// ─── Member Partner Links ─────────────────────────────────────────────────────
const MEMBER_PARTNER_LINKS_SEED = [
  { id: 'pl1', label: 'Gym chain B2B link', url: 'https://nordic-vitals.no/partner/gary-001', clicks: 142, conversions: 8, revenue: 'NOK 34,200', createdAt: '2026-06-10', active: true },
  { id: 'pl2', label: 'Corporate wellness pitch', url: 'https://nordic-vitals.no/partner/gary-002', clicks: 78, conversions: 3, revenue: 'NOK 18,900', createdAt: '2026-07-02', active: true },
  { id: 'pl3', label: 'Pharmacy network', url: 'https://nordic-vitals.no/partner/gary-003', clicks: 12, conversions: 0, revenue: 'NOK 0', createdAt: '2026-08-01', active: true },
]
export async function getMemberPartnerLinks() {
  if (MOCK) { await new Promise(r => setTimeout(r, 210)); return MEMBER_PARTNER_LINKS_SEED }
  return request('GET', '/v1/mlm/member/partner-links')
}
export async function createMemberPartnerLink(payload) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 300))
    return { id: `pl${Date.now()}`, ...payload, url: `https://nordic-vitals.no/partner/gary-${Date.now()}`, clicks: 0, conversions: 0, revenue: 'NOK 0', createdAt: new Date().toISOString().slice(0,10), active: true }
  }
  return request('POST', '/v1/mlm/member/partner-links', payload)
}
export async function deleteMemberPartnerLink(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/partner-links/${id}`)
}

// ─── Member Health Tracker ────────────────────────────────────────────────────
const MEMBER_HEALTH_LOG_SEED = [
  { id: 'hl1', date: '2026-08-07', mood: 4, energy: 4, sleep: 7.5, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Good workout, joint flexibility noticeably better.' },
  { id: 'hl2', date: '2026-08-06', mood: 3, energy: 3, sleep: 6.0, products: ['Omega-3 2000mg'], notes: 'Skipped D3 this morning. Tired by afternoon.' },
  { id: 'hl3', date: '2026-08-05', mood: 5, energy: 5, sleep: 8.5, products: ['Omega-3 2000mg', 'D3/K2 Complex', 'Collagen Peptides'], notes: 'Best energy day in weeks. Full stack taken.' },
  { id: 'hl4', date: '2026-08-04', mood: 4, energy: 4, sleep: 7.0, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Consistent routine, feeling stable.' },
  { id: 'hl5', date: '2026-08-03', mood: 3, energy: 2, sleep: 5.5, products: ['Omega-3 2000mg'], notes: 'Poor sleep, stressed about work deadline.' },
  { id: 'hl6', date: '2026-08-02', mood: 4, energy: 4, sleep: 7.0, products: ['Omega-3 2000mg', 'D3/K2 Complex'], notes: 'Weekend hike — supplements packed.' },
]
export async function getMemberHealthLog() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return MEMBER_HEALTH_LOG_SEED }
  return request('GET', '/v1/mlm/member/health-log')
}
export async function addMemberHealthLog(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `hl${Date.now()}`, ...payload } }
  return request('POST', '/v1/mlm/member/health-log', payload)
}
export async function deleteMemberHealthLog(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/health-log/${id}`)
}

// ─── Member Habit Tracker ─────────────────────────────────────────────────────
const MEMBER_HABITS_SEED = {
  habits: [
    { id: 'hb1', name: 'Take morning supplements', icon: '💊', streak: 12, target: 7, completedDates: ['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb2', name: 'Drink 2L water', icon: '💧', streak: 5, target: 7, completedDates: ['2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb3', name: 'Exercise 30 min', icon: '🏋️', streak: 3, target: 5, completedDates: ['2026-08-05','2026-08-06','2026-08-07'] },
    { id: 'hb4', name: 'Sleep by 23:00', icon: '😴', streak: 2, target: 7, completedDates: ['2026-08-06','2026-08-07'] },
    { id: 'hb5', name: 'Contact 1 new prospect', icon: '📞', streak: 0, target: 5, completedDates: [] },
  ],
  weekDates: ['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05','2026-08-06','2026-08-07'],
}
export async function getMemberHabits() {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return MEMBER_HABITS_SEED }
  return request('GET', '/v1/mlm/member/habits')
}
export async function logMemberHabit(habitId, date) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('POST', '/v1/mlm/member/habits/log', { habitId, date })
}
export async function createMemberHabit(payload) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { id: `hb${Date.now()}`, ...payload, streak: 0, completedDates: [] } }
  return request('POST', '/v1/mlm/member/habits', payload)
}

// ── Stock Alerts ─────────────────────────────────────────────────────────────
const STOCK_ALERTS_SEED = [
  { id: 'sa1', name: 'BPC-157 5mg', sku: 'BPC-157-5MG', stock: 3, threshold: 10, level: 'critical', lastUpdated: '2026-08-08 09:14' },
  { id: 'sa2', name: 'TB-500 2mg', sku: 'TB500-2MG', stock: 8, threshold: 15, level: 'low', lastUpdated: '2026-08-08 07:30' },
  { id: 'sa3', name: 'Semax 30mg', sku: 'SEMAX-30MG', stock: 0, threshold: 5, level: 'critical', lastUpdated: '2026-08-07 22:00' },
  { id: 'sa4', name: 'CJC-1295 2mg', sku: 'CJC-2MG', stock: 42, threshold: 10, level: 'ok', lastUpdated: '2026-08-08 06:00' },
  { id: 'sa5', name: 'Ipamorelin 2mg', sku: 'IPA-2MG', stock: 18, threshold: 20, level: 'low', lastUpdated: '2026-08-08 08:00' },
  { id: 'sa6', name: 'PT-141 10mg', sku: 'PT141-10MG', stock: 55, threshold: 10, level: 'ok', lastUpdated: '2026-08-07 18:00' },
]
export async function getAdminStockAlerts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return [...STOCK_ALERTS_SEED] }
  return request('GET', '/v1/mlm/admin/stock-alerts')
}
export async function updateAdminStockAlertThreshold(id, threshold) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/stock-alerts/${id}/threshold`, { threshold })
}
export async function dismissAdminStockAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/stock-alerts/${id}/dismiss`)
}

// ── Payment Gateways ──────────────────────────────────────────────────────────
const PAYMENT_GATEWAYS_SEED = [
  { id: 'gw1', name: 'Stripe', provider: 'stripe', enabled: true, mode: 'live', feePercent: 2.9, feeFixed: '$0.30', currencies: ['USD', 'EUR', 'GBP', 'NOK'], webhookOk: true, volume30d: '$24,320' },
  { id: 'gw2', name: 'PayPal', provider: 'paypal', enabled: true, mode: 'live', feePercent: 3.49, feeFixed: '$0.49', currencies: ['USD', 'EUR'], webhookOk: false, volume30d: '$4,110' },
  { id: 'gw3', name: 'Crypto (USDC)', provider: 'crypto', enabled: false, mode: 'test', feePercent: 1.0, feeFixed: '$0.00', currencies: ['USDC', 'ETH'], webhookOk: false, volume30d: '$0' },
  { id: 'gw4', name: 'Klarna', provider: 'klarna', enabled: true, mode: 'live', feePercent: 3.29, feeFixed: '$0.35', currencies: ['EUR', 'NOK', 'SEK'], webhookOk: true, volume30d: '$6,890' },
  { id: 'gw5', name: 'Apple Pay', provider: 'applepay', enabled: true, mode: 'live', feePercent: 2.9, feeFixed: '$0.30', currencies: ['USD', 'EUR'], webhookOk: true, volume30d: '$3,200' },
]
export async function getAdminPaymentGateways() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...PAYMENT_GATEWAYS_SEED] }
  return request('GET', '/v1/mlm/admin/payment-gateways')
}
export async function toggleAdminPaymentGateway(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/payment-gateways/${id}/toggle`)
}
export async function testAdminPaymentGateway(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 900)); return { ok: id !== 'gw2', error: id === 'gw2' ? 'Webhook not configured' : null } }
  return request('POST', `/v1/mlm/admin/payment-gateways/${id}/test`)
}

// ── Customer Groups ───────────────────────────────────────────────────────────
const CUSTOMER_GROUPS_SEED = [
  { id: 'cg1', name: 'Retail', description: 'Standard retail customers', icon: '🛒', color: '#1e3a5f', priceMultiplier: 1.0, minOrderValue: null, welcomeEmail: true, memberCount: 1240, members: [{id:'m1',name:'Anna S.'},{id:'m2',name:'Mark T.'}] },
  { id: 'cg2', name: 'Wholesale', description: 'Bulk buyers with discounted pricing', icon: '📦', color: '#052e16', priceMultiplier: 0.75, minOrderValue: 200, welcomeEmail: true, memberCount: 88, members: [{id:'m3',name:'Nordic Health AS'},{id:'m4',name:'FitStore AB'}] },
  { id: 'cg3', name: 'VIP', description: 'Top-tier members and high-value customers', icon: '👑', color: '#3b1f00', priceMultiplier: 0.85, minOrderValue: null, welcomeEmail: true, memberCount: 34, members: [{id:'m5',name:'Erik B.'},{id:'m6',name:'Sofia L.'}] },
  { id: 'cg4', name: 'Staff', description: 'Internal team accounts', icon: '🏢', color: '#2d1515', priceMultiplier: 0.50, minOrderValue: null, welcomeEmail: false, memberCount: 5, members: [{id:'m7',name:'Gary G.'},{id:'m8',name:'Bjørn H.'}] },
]
export async function getAdminCustomerGroups() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...CUSTOMER_GROUPS_SEED] }
  return request('GET', '/v1/mlm/admin/customer-groups')
}
export async function createAdminCustomerGroup(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 280)); return { id: `cg${Date.now()}`, ...data, memberCount: 0, members: [], icon: '👤', color: '#1e3a5f' } }
  return request('POST', '/v1/mlm/admin/customer-groups', data)
}
export async function updateAdminCustomerGroup(id, data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/customer-groups/${id}`, data)
}
export async function deleteAdminCustomerGroup(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/customer-groups/${id}`)
}

// ── Quality Control ───────────────────────────────────────────────────────────
const QC_BATCHES_SEED = [
  { id: 'qc1', batchNo: 'B2608-001', product: 'BPC-157 5mg', lot: 'L-8801', quantity: 500, mfgDate: '2026-07-01', expiryDate: '2028-07-01', daysToExpiry: 700, status: 'pass', coaUrl: '#' },
  { id: 'qc2', batchNo: 'B2608-002', product: 'TB-500 2mg', lot: 'L-8802', quantity: 300, mfgDate: '2026-07-15', expiryDate: '2026-10-15', daysToExpiry: 68, status: 'review', coaUrl: '#' },
  { id: 'qc3', batchNo: 'B2608-003', product: 'Semax 30mg', lot: 'L-8803', quantity: 200, mfgDate: '2026-08-01', expiryDate: '2028-08-01', daysToExpiry: 723, status: 'pending', coaUrl: null },
  { id: 'qc4', batchNo: 'B2607-005', product: 'CJC-1295 2mg', lot: 'L-8790', quantity: 400, mfgDate: '2026-06-20', expiryDate: '2026-09-30', daysToExpiry: 53, status: 'fail', coaUrl: '#' },
  { id: 'qc5', batchNo: 'B2608-004', product: 'Ipamorelin 2mg', lot: 'L-8810', quantity: 600, mfgDate: '2026-08-05', expiryDate: '2028-08-05', daysToExpiry: 727, status: 'pass', coaUrl: '#' },
]
export async function getAdminQcBatches() {
  if (MOCK) { await new Promise(r => setTimeout(r, 260)); return [...QC_BATCHES_SEED] }
  return request('GET', '/v1/mlm/admin/qc-batches')
}
export async function createAdminQcBatch(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id: `qc${Date.now()}`, ...data, status: 'pending', daysToExpiry: 730, coaUrl: null } }
  return request('POST', '/v1/mlm/admin/qc-batches', data)
}
export async function updateAdminQcBatchStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return { ok: true } }
  return request('PUT', `/v1/mlm/admin/qc-batches/${id}/status`, { status })
}

// ── Price Alerts ──────────────────────────────────────────────────────────────
const MEMBER_PRICE_ALERTS_SEED = [
  { id: 'pa1', productName: 'BPC-157 5mg', type: 'price_drop', targetPrice: '$48.00', currentPrice: '$52.00', active: true, image: null },
  { id: 'pa2', productName: 'TB-500 2mg', type: 'back_in_stock', active: true, image: null },
  { id: 'pa3', productName: 'PT-141 10mg', type: 'low_stock', active: false, currentPrice: '$65.00', image: null },
]
export async function getMemberPriceAlerts() {
  if (MOCK) { await new Promise(r => setTimeout(r, 230)); return [...MEMBER_PRICE_ALERTS_SEED] }
  return request('GET', '/v1/mlm/member/price-alerts')
}
export async function deleteMemberPriceAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/price-alerts/${id}`)
}
export async function toggleMemberPriceAlert(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 180)); return { ok: true } }
  return request('POST', `/v1/mlm/member/price-alerts/${id}/toggle`)
}

// ── Team Chat ─────────────────────────────────────────────────────────────────
const TEAM_CHAT_THREADS = [
  { id: 'tc1', name: 'team-general', memberCount: 24, lastMessage: 'Great week everyone! 🎉', unread: 3 },
  { id: 'tc2', name: 'team-leaders', memberCount: 8, lastMessage: 'New rank campaign starting Monday', unread: 0 },
  { id: 'tc3', name: 'product-updates', memberCount: 24, lastMessage: 'BPC-157 restock confirmed', unread: 1 },
]
const TEAM_CHAT_MESSAGES = {
  tc1: [
    { id: 'm1', author: 'Bjørn H.', text: 'Welcome to the team chat! 👋', time: '08:00' },
    { id: 'm2', author: 'Anna S.', text: 'Thanks! Excited to be here', time: '08:14' },
    { id: 'm3', author: 'Mark T.', text: 'Great week everyone! 🎉', time: '08:30' },
  ],
  tc2: [
    { id: 'm4', author: 'Gary G.', text: 'New rank campaign starting Monday — target is Gold+', time: '09:00' },
    { id: 'm5', author: 'Bjørn H.', text: 'Commission rates updated in the doc', time: '09:15' },
  ],
  tc3: [
    { id: 'm6', author: 'Gary G.', text: 'BPC-157 restock confirmed for next week', time: '07:45' },
    { id: 'm7', author: 'Sofia L.', text: 'Great, my team was asking about this 🙌', time: '07:52' },
  ],
}
export async function getMemberTeamChatThreads() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return [...TEAM_CHAT_THREADS] }
  return request('GET', '/v1/mlm/member/team-chat/threads')
}
export async function getMemberTeamChatMessages(threadId) {
  if (MOCK) { await new Promise(r => setTimeout(r, 200)); return [...(TEAM_CHAT_MESSAGES[threadId] || [])] }
  return request('GET', `/v1/mlm/member/team-chat/threads/${threadId}/messages`)
}
export async function sendMemberTeamChatMessage(threadId, text) {
  if (MOCK) { await new Promise(r => setTimeout(r, 250)); return { id: `m${Date.now()}`, author: 'You', text, time: new Date().toTimeString().slice(0,5) } }
  return request('POST', `/v1/mlm/member/team-chat/threads/${threadId}/messages`, { text })
}

// ── Wallet History ────────────────────────────────────────────────────────────
const WALLET_HISTORY_SEED = [
  { id: 'wh1', type: 'commission', description: 'July commission payout', amount: 420.00, balance: 1240.50, date: '2026-08-01', ref: 'RUN-0801' },
  { id: 'wh2', type: 'bonus', description: 'Fast Start bonus', amount: 100.00, balance: 820.50, date: '2026-07-28', ref: 'BONUS-FS-24' },
  { id: 'wh3', type: 'purchase', description: 'Autoship order #A-3901', amount: -89.90, balance: 720.50, date: '2026-07-25', ref: 'ORD-3901' },
  { id: 'wh4', type: 'withdrawal', description: 'Bank withdrawal', amount: -500.00, balance: 810.40, date: '2026-07-20', ref: 'PAY-7821' },
  { id: 'wh5', type: 'commission', description: 'Team override commission', amount: 185.00, balance: 1310.40, date: '2026-07-15', ref: 'RUN-0715' },
  { id: 'wh6', type: 'referral', description: 'Referral bonus — Erik B.', amount: 25.00, balance: 1125.40, date: '2026-07-12', ref: 'REF-EB' },
  { id: 'wh7', type: 'loyalty', description: 'Loyalty points redemption', amount: 15.00, balance: 1100.40, date: '2026-07-10', ref: 'LP-450' },
  { id: 'wh8', type: 'adjustment', description: 'Correction — June run', amount: -12.50, balance: 1085.40, date: '2026-07-08', ref: 'ADJ-JUN' },
  { id: 'wh9', type: 'refund', description: 'Return — order #3822', amount: 49.90, balance: 1097.90, date: '2026-07-05', ref: 'RET-3822' },
  { id: 'wh10', type: 'commission', description: 'June commission payout', amount: 380.00, balance: 1048.00, date: '2026-07-01', ref: 'RUN-0701' },
]
export async function getMemberWalletHistory() {
  if (MOCK) { await new Promise(r => setTimeout(r, 240)); return [...WALLET_HISTORY_SEED] }
  return request('GET', '/v1/mlm/member/wallet/history')
}

// ── Two-Factor Authentication ─────────────────────────────────────────────────
export async function getMemberTwoFactorStatus() {
  if (MOCK) { await new Promise(r => setTimeout(r, 220)); return { enabled: false, verifiedAt: null, unusedBackupCodes: 0 } }
  return request('GET', '/v1/mlm/member/2fa/status')
}
export async function enableMemberTwoFactor() {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { qrCode: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzAwMCI+W1FSXSA8L3RleHQ+PC9zdmc+', secret: 'JBSWY3DPEHPK3PXP' } }
  return request('POST', '/v1/mlm/member/2fa/enable')
}
export async function verifyMemberTwoFactor(code) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return code === '123456' || code.length === 6 ? { success: true, backupCodes: ['A1B2-C3D4','E5F6-G7H8','I9J0-K1L2','M3N4-O5P6','Q7R8-S9T0','U1V2-W3X4','Y5Z6-A7B8','C9D0-E1F2'] } : { success: false } }
  return request('POST', '/v1/mlm/member/2fa/verify', { code })
}
export async function disableMemberTwoFactor(code) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { success: true } }
  return request('POST', '/v1/mlm/member/2fa/disable', { code })
}
export async function regenerateMemberBackupCodes() {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return ['AA11-BB22','CC33-DD44','EE55-FF66','GG77-HH88','II99-JJ00','KK11-LL22','MM33-NN44','OO55-PP66'] }
  return request('POST', '/v1/mlm/member/2fa/backup-codes/regenerate')
}

// ── Admin: Supplier Orders ──────────────────────────────────────────────────
export async function getAdminSupplierOrders() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 's1', poNumber: '1042', vendorName: 'Nordic Pharma AS', status: 'ordered', itemCount: 12, totalValue: 18400, expectedDate: '2026-08-15', lastUpdated: '2026-08-06' },
      { id: 's2', poNumber: '1041', vendorName: 'BioActive Labs', status: 'received', itemCount: 8, totalValue: 9200, expectedDate: '2026-08-05', lastUpdated: '2026-08-05' },
      { id: 's3', poNumber: '1043', vendorName: 'PeptideCore GmbH', status: 'pending', itemCount: 5, totalValue: 6750, expectedDate: '2026-08-20', lastUpdated: '2026-08-07' },
      { id: 's4', poNumber: '1044', vendorName: 'Arctic Nutrients', status: 'draft', itemCount: 3, totalValue: 3100, expectedDate: '2026-08-25', lastUpdated: '2026-08-08' },
    ]
  }
  return request('GET', '/v1/mlm/admin/supplier-orders')
}
export async function createAdminSupplierOrder(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 's' + Date.now(), poNumber: String(1045 + Math.floor(Math.random() * 100)), status: 'draft', itemCount: 0, totalValue: 0, lastUpdated: new Date().toISOString().slice(0,10), ...data }
  }
  return request('POST', '/v1/mlm/admin/supplier-orders', data)
}
export async function updateAdminSupplierOrderStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, status } }
  return request('PATCH', `/v1/mlm/admin/supplier-orders/${id}/status`, { status })
}
export async function deleteAdminSupplierOrder(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/supplier-orders/${id}`)
}

// ── Admin: Automation Rules ─────────────────────────────────────────────────
export async function getAdminAutomationRules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ar1', name: 'Welcome email on signup', trigger: 'Member registers', action: 'Send email', delay: '0', active: true, runCount: 1842, lastRun: '2026-08-08 14:22' },
      { id: 'ar2', name: 'Rank promotion badge', trigger: 'Rank promoted', action: 'Award badge', delay: '0', active: true, runCount: 234, lastRun: '2026-08-07 09:10' },
      { id: 'ar3', name: 'Re-engagement SMS', trigger: 'Inactivity 30 days', action: 'Send SMS', delay: '0', active: false, runCount: 87, lastRun: '2026-08-01 11:00' },
      { id: 'ar4', name: 'Birthday loyalty bonus', trigger: 'Birthday', action: 'Add loyalty points', delay: '0', active: true, runCount: 412, lastRun: '2026-08-08 00:01' },
      { id: 'ar5', name: 'Post-purchase coupon', trigger: 'Order completed', action: 'Apply coupon', delay: '24', active: true, runCount: 3201, lastRun: '2026-08-08 16:05' },
    ]
  }
  return request('GET', '/v1/mlm/admin/automation-rules')
}
export async function createAdminAutomationRule(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 'ar' + Date.now(), active: true, runCount: 0, lastRun: null, ...data }
  }
  return request('POST', '/v1/mlm/admin/automation-rules', data)
}
export async function toggleAdminAutomationRule(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/automation-rules/${id}/toggle`, { active })
}
export async function deleteAdminAutomationRule(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/automation-rules/${id}`)
}

// ── Admin: Data Exports ─────────────────────────────────────────────────────
export async function getAdminDataExports() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ex1', name: 'Monthly Commissions Aug 2026', template: 'Commissions', format: 'CSV', schedule: 'once', status: 'completed', rowCount: 2140, fileSize: '1.2 MB', downloadUrl: '#', createdAt: '2026-08-01' },
      { id: 'ex2', name: 'Weekly Member Export', template: 'Members', format: 'Excel (XLSX)', schedule: 'weekly', status: 'completed', rowCount: 8920, fileSize: '4.8 MB', downloadUrl: '#', createdAt: '2026-08-05' },
      { id: 'ex3', name: 'Product Inventory Snapshot', template: 'Inventory', format: 'CSV', schedule: 'once', status: 'running', rowCount: null, fileSize: null, downloadUrl: null, createdAt: '2026-08-08' },
      { id: 'ex4', name: 'Tax Summary Q2', template: 'Tax Summary', format: 'Excel (XLSX)', schedule: 'once', status: 'failed', rowCount: null, fileSize: null, downloadUrl: null, createdAt: '2026-07-30' },
    ]
  }
  return request('GET', '/v1/mlm/admin/data-exports')
}
export async function createAdminDataExport(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    return { id: 'ex' + Date.now(), status: 'pending', rowCount: null, fileSize: null, downloadUrl: null, createdAt: new Date().toISOString().slice(0,10), ...data }
  }
  return request('POST', '/v1/mlm/admin/data-exports', data)
}
export async function deleteAdminDataExport(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/data-exports/${id}`)
}

// ── Admin: Chat Support ─────────────────────────────────────────────────────
export async function getAdminChatSupport() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ch1', memberName: 'Lars Andersen', status: 'open', waitTime: '12 min', lastMessage: 'Hi, I have a question about my commission payout this month', startedAt: '14:08', messageCount: 3, assignedTo: null, messages: [{ role: 'member', text: 'Hi, I have a question about my commission payout this month' }, { role: 'member', text: 'It says pending since 3 days' }] },
      { id: 'ch2', memberName: 'Ingrid Svensson', status: 'assigned', waitTime: '4 min', lastMessage: "Thanks for your help!", startedAt: '14:22', messageCount: 8, assignedTo: 'Alice K.', messages: [{ role: 'member', text: 'I cannot log in to the portal' }, { role: 'agent', text: 'Let me help you reset your password' }, { role: 'member', text: "Thanks for your help!" }] },
      { id: 'ch3', memberName: 'Bjørn Olsen', status: 'open', waitTime: '28 min', lastMessage: 'How do I upgrade my membership plan?', startedAt: '13:48', messageCount: 1, assignedTo: null, messages: [{ role: 'member', text: 'How do I upgrade my membership plan?' }] },
      { id: 'ch4', memberName: 'Astrid Hansen', status: 'resolved', waitTime: '—', lastMessage: 'Issue resolved, thank you!', startedAt: '11:30', messageCount: 12, assignedTo: 'Bruno T.', messages: [{ role: 'member', text: 'My order never arrived' }, { role: 'agent', text: 'I can see it was dispatched on Aug 3' }, { role: 'member', text: 'Issue resolved, thank you!' }] },
    ]
  }
  return request('GET', '/v1/mlm/admin/chat-support')
}
export async function assignAdminChatConversation(id, agent) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, agent } }
  return request('POST', `/v1/mlm/admin/chat-support/${id}/assign`, { agent })
}
export async function closeAdminChatConversation(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/chat-support/${id}/resolve`)
}

// ── Member: Learning Path ───────────────────────────────────────────────────
export async function getMemberLearningPath() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      completedCount: 7, inProgressCount: 2, certifications: 3, totalXp: 4200,
      modules: [
        { id: 'lp1', title: 'Business Foundations', category: 'foundation', icon: '🏗️', description: 'Core MLM concepts, compensation plan overview, and ethics.', totalLessons: 8, completedLessons: 8, duration: '2h 15m', xp: 500, status: 'completed', certified: true },
        { id: 'lp2', title: 'Product Mastery', category: 'product', icon: '🧬', description: 'Deep dive into peptide science and all Viking Peptides products.', totalLessons: 12, completedLessons: 12, duration: '3h 40m', xp: 750, status: 'completed', certified: true },
        { id: 'lp3', title: 'Sales Techniques', category: 'sales', icon: '🎯', description: 'Proven sales scripts, objection handling, and closing strategies.', totalLessons: 10, completedLessons: 6, duration: '2h 30m', xp: 600, status: 'in_progress', certified: false },
        { id: 'lp4', title: 'Team Leadership', category: 'leadership', icon: '👑', description: 'Building and motivating your downline for long-term success.', totalLessons: 9, completedLessons: 0, duration: '2h 00m', xp: 600, status: 'locked', certified: false },
        { id: 'lp5', title: 'Digital Marketing', category: 'sales', icon: '📱', description: 'Social media, content creation, and online prospecting.', totalLessons: 11, completedLessons: 4, duration: '3h 10m', xp: 700, status: 'in_progress', certified: false },
        { id: 'lp6', title: 'Compliance & Legal', category: 'compliance', icon: '⚖️', description: 'FTC guidelines, income disclosure rules, and ethical selling.', totalLessons: 6, completedLessons: 6, duration: '1h 45m', xp: 400, status: 'completed', certified: true },
        { id: 'lp7', title: 'Advanced Leadership', category: 'leadership', icon: '🌟', description: 'Advanced strategies for building a 6-figure organisation.', totalLessons: 14, completedLessons: 0, duration: '4h 00m', xp: 1000, status: 'locked', certified: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/learning-path')
}

// ── Member: Team Performance ────────────────────────────────────────────────
export async function getMemberTeamPerformance(period) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      teamVolume: 48200, teamOrders: 312, newRecruits: 8, activeMembers: 24, totalMembers: 31,
      members: [
        { id: 'm1', name: 'Lars Andersen', rank: 'Silver', volume: 8400, orders: 54, recruits: 3, active: true, joinedAt: 'Jan 2025' },
        { id: 'm2', name: 'Ingrid Svensson', rank: 'Gold', volume: 7200, orders: 48, recruits: 2, active: true, joinedAt: 'Mar 2025' },
        { id: 'm3', name: 'Erik Johansen', rank: 'Bronze', volume: 5100, orders: 33, recruits: 0, active: true, joinedAt: 'Jun 2025' },
        { id: 'm4', name: 'Astrid Hansen', rank: 'Silver', volume: 4800, orders: 31, recruits: 1, active: true, joinedAt: 'Feb 2025' },
        { id: 'm5', name: 'Olaf Berg', rank: 'Bronze', volume: 3200, orders: 21, recruits: 0, active: true, joinedAt: 'Sep 2025' },
        { id: 'm6', name: 'Freya Larsen', rank: 'Member', volume: 1800, orders: 12, recruits: 1, active: true, joinedAt: 'Nov 2025' },
        { id: 'm7', name: 'Sigrid Nielsen', rank: 'Member', volume: 900, orders: 6, recruits: 0, active: false, joinedAt: 'Dec 2025' },
      ]
    }
  }
  return request('GET', `/v1/mlm/member/team-performance?period=${period}`)
}

// ── Member: Product Comparison ──────────────────────────────────────────────
export async function getMemberProductCatalogForComparison() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'p1', name: 'BPC-157 Standard', category: 'Peptides', price: 89, memberPrice: 71.20, pv: 70, servings: 30, form: 'Capsule', peptides: 'BPC-157 500mcg', storage: 'Refrigerate', vegan: true, glutenFree: true, inStock: true, rating: 4.8 },
      { id: 'p2', name: 'BPC-157 Pro Blend', category: 'Peptides', price: 129, memberPrice: 103.20, pv: 100, servings: 30, form: 'Capsule', peptides: 'BPC-157 1000mcg + TB-500', storage: 'Refrigerate', vegan: true, glutenFree: true, inStock: true, rating: 4.9 },
      { id: 'p3', name: 'TB-500 Thymosin', category: 'Peptides', price: 109, memberPrice: 87.20, pv: 85, servings: 30, form: 'Powder', peptides: 'TB-500 2mg', storage: 'Freeze', vegan: false, glutenFree: true, inStock: true, rating: 4.7 },
      { id: 'p4', name: 'GHK-Cu Skin Complex', category: 'Cosmetic', price: 79, memberPrice: 63.20, pv: 60, servings: 60, form: 'Serum', peptides: 'GHK-Cu 50mg', storage: 'Cool & Dark', vegan: true, glutenFree: true, inStock: false, rating: 4.6 },
      { id: 'p5', name: 'CJC-1295 Growth', category: 'Peptides', price: 149, memberPrice: 119.20, pv: 120, servings: 20, form: 'Powder', peptides: 'CJC-1295 2mg', storage: 'Freeze', vegan: false, glutenFree: true, inStock: true, rating: 4.5 },
    ]
  }
  return request('GET', '/v1/mlm/member/products/comparison-catalog')
}

// ── Member: Event Calendar ──────────────────────────────────────────────────
export async function getMemberEventCalendar(year, month) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    const base = `${year}-${String(month).padStart(2, '0')}`
    return [
      { id: 'ev1', title: 'Weekly Team Call', type: 'call', date: `${base}-09`, time: '18:00 CET', duration: '1h', description: 'Weekly check-in with your upline. Bring questions and wins.', host: 'Gary G.', registered: true },
      { id: 'ev2', title: 'Product Science Webinar', type: 'webinar', date: `${base}-12`, time: '19:00 CET', duration: '1.5h', description: 'Deep dive into BPC-157 peptide mechanisms with our R&D team.', host: 'Dr. Larsson', registered: false },
      { id: 'ev3', title: 'Sales Mastery Training', type: 'training', date: `${base}-14`, time: '10:00 CET', duration: '3h', description: 'Hands-on workshop covering objection handling and closing.', host: 'Ingrid S.', registered: false },
      { id: 'ev4', title: 'Nordic Vitals Launch Event', type: 'product', date: `${base}-20`, time: '15:00 CET', duration: '2h', description: 'Official launch of our new GHK-Cu serum line. Attendees get first access.', host: 'Bjørn V.', registered: true },
      { id: 'ev5', title: 'Leadership Rally Oslo', type: 'rally', date: `${base}-22`, time: '09:00 CET', duration: 'Full day', description: 'Annual leadership summit. Silver+ ranks only.', host: 'Arctico Team', registered: false },
      { id: 'ev6', title: 'Monthly Business Review', type: 'webinar', date: `${base}-28`, time: '17:00 CET', duration: '1h', description: 'August performance recap, top earners spotlight, September preview.', host: 'Gary G.', registered: false },
    ]
  }
  return request('GET', `/v1/mlm/member/events/calendar?year=${year}&month=${month}`)
}
export async function registerMemberCalendarEvent(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true } }
  return request('POST', `/v1/mlm/member/events/${id}/register`)
}

// ── Admin: Geo Blocking ─────────────────────────────────────────────────────
export async function getAdminGeoBlocking() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      defaultPolicy: 'allow',
      rules: [
        { id: 'gb1', country: 'United States', code: 'US', flag: '🇺🇸', scope: 'all', status: 'allowed', reason: 'Primary market' },
        { id: 'gb2', country: 'Norway', code: 'NO', flag: '🇳🇴', scope: 'all', status: 'allowed', reason: 'HQ country' },
        { id: 'gb3', country: 'Germany', code: 'DE', flag: '🇩🇪', scope: 'all', status: 'allowed', reason: 'EU market' },
        { id: 'gb4', country: 'North Korea', code: 'KP', flag: '🇰🇵', scope: 'all', status: 'blocked', reason: 'Sanctions compliance' },
        { id: 'gb5', country: 'Iran', code: 'IR', flag: '🇮🇷', scope: 'all', status: 'blocked', reason: 'Sanctions compliance' },
        { id: 'gb6', country: 'Russia', code: 'RU', flag: '🇷🇺', scope: 'membership', status: 'blocked', reason: 'Payment restrictions' },
        { id: 'gb7', country: 'China', code: 'CN', flag: '🇨🇳', scope: 'membership', status: 'restricted', reason: 'Regulatory review pending' },
        { id: 'gb8', country: 'Brazil', code: 'BR', flag: '🇧🇷', scope: 'all', status: 'allowed', reason: 'Active market' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/geo-blocking')
}
export async function createAdminGeoRule(rule) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `gb${Date.now()}`, ...rule } }
  return request('POST', '/v1/mlm/admin/geo-blocking', rule)
}
export async function updateAdminGeoRule(id, patch) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, ...patch } }
  return request('PATCH', `/v1/mlm/admin/geo-blocking/${id}`, patch)
}
export async function deleteAdminGeoRule(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/geo-blocking/${id}`)
}

// ── Admin: Product Labels ───────────────────────────────────────────────────
export async function getAdminProductLabels() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'pl1', name: 'Bestseller', color: '#f59e0b', textColor: '#000', icon: '🏆', assignedCount: 4, active: true },
      { id: 'pl2', name: 'New', color: '#10b981', textColor: '#fff', icon: '✨', assignedCount: 2, active: true },
      { id: 'pl3', name: 'Limited Edition', color: '#8b5cf6', textColor: '#fff', icon: '⏳', assignedCount: 1, active: true },
      { id: 'pl4', name: 'Sale', color: '#ef4444', textColor: '#fff', icon: '🔥', assignedCount: 3, active: true },
      { id: 'pl5', name: 'Staff Pick', color: '#3b82f6', textColor: '#fff', icon: '⭐', assignedCount: 2, active: true },
      { id: 'pl6', name: 'Out of Season', color: '#64748b', textColor: '#fff', icon: '❄️', assignedCount: 0, active: false },
    ]
  }
  return request('GET', '/v1/mlm/admin/product-labels')
}
export async function createAdminProductLabel(label) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `pl${Date.now()}`, assignedCount: 0, active: true, ...label } }
  return request('POST', '/v1/mlm/admin/product-labels', label)
}
export async function toggleAdminProductLabel(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/product-labels/${id}`, { active })
}
export async function deleteAdminProductLabel(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/product-labels/${id}`)
}

// ── Admin: Sales Scripts ────────────────────────────────────────────────────
export async function getAdminSalesScripts() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'ss1', title: 'Cold Outreach — Social Media DM', category: 'prospecting', stage: 'outreach', views: 1284, downloads: 342, rating: 4.7, updatedAt: '2026-07-20', content: "Hey [Name]! I noticed you're interested in health and fitness. I'm part of an exciting brand called Nordic Vitals — we make science-backed peptide supplements. Would you be open to a quick chat about what we do?" },
      { id: 'ss2', title: 'Product Presentation — BPC-157', category: 'product', stage: 'presentation', views: 987, downloads: 256, rating: 4.8, updatedAt: '2026-07-18', content: "BPC-157 is a naturally occurring peptide that supports tissue repair, gut health, and recovery. Clinical studies show remarkable results for joint and muscle regeneration..." },
      { id: 'ss3', title: 'Handling Objection — "It\'s too expensive"', category: 'objection', stage: 'closing', views: 756, downloads: 198, rating: 4.6, updatedAt: '2026-07-15', content: "I totally understand. Let me put it in perspective — a single physiotherapy session costs the same as a month's supply. Our members report they've saved thousands in medical bills..." },
      { id: 'ss4', title: 'Team Recruitment — Initial Invite', category: 'recruitment', stage: 'outreach', views: 654, downloads: 167, rating: 4.5, updatedAt: '2026-07-10', content: "I'm building a health and wellness business and looking for motivated people to partner with. The opportunity allows you to earn both retail commissions and team bonuses..." },
      { id: 'ss5', title: 'Follow-Up After Presentation', category: 'prospecting', stage: 'follow_up', views: 543, downloads: 143, rating: 4.4, updatedAt: '2026-07-05', content: "Hi [Name], just checking in after our conversation last week. Have you had a chance to look over the information I sent? I'd love to answer any questions..." },
      { id: 'ss6', title: 'Closing — Membership Sign-Up', category: 'recruitment', stage: 'closing', views: 432, downloads: 112, rating: 4.9, updatedAt: '2026-06-28', content: "Based on everything you've shared with me, I think this is a perfect fit for your goals. Let me walk you through the simple sign-up process — it only takes about 5 minutes..." },
    ]
  }
  return request('GET', '/v1/mlm/admin/sales-scripts')
}
export async function createAdminSalesScript(script) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `ss${Date.now()}`, views: 0, downloads: 0, rating: null, updatedAt: new Date().toISOString().slice(0,10), ...script } }
  return request('POST', '/v1/mlm/admin/sales-scripts', script)
}
export async function deleteAdminSalesScript(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/sales-scripts/${id}`)
}

// ── Admin: Member Marketplace ───────────────────────────────────────────────
export async function getAdminMemberMarketplace() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return [
      { id: 'mk1', title: 'BPC-157 Standard x3 (unopened)', seller: 'Lars Andersen', price: 210, originalPrice: 267, condition: 'new', category: 'products', status: 'active', postedAt: '2026-08-05', views: 43, expiresAt: '2026-08-19' },
      { id: 'mk2', title: 'Nordic Vitals Starter Kit', seller: 'Ingrid Svensson', price: 85, originalPrice: 120, condition: 'new', category: 'kits', status: 'active', postedAt: '2026-08-04', views: 71, expiresAt: '2026-08-18' },
      { id: 'mk3', title: 'Marketing Flyers — 200 pack printed', seller: 'Erik Johansen', price: 25, originalPrice: 40, condition: 'used', category: 'materials', status: 'active', postedAt: '2026-08-03', views: 18, expiresAt: '2026-08-17' },
      { id: 'mk4', title: 'GHK-Cu Skin Complex x2', seller: 'Astrid Hansen', price: 130, originalPrice: 158, condition: 'new', category: 'products', status: 'pending', postedAt: '2026-08-07', views: 9, expiresAt: '2026-08-21' },
      { id: 'mk5', title: 'Business Builder Bundle', seller: 'Olaf Berg', price: 0, originalPrice: 0, condition: 'new', category: 'kits', status: 'sold', postedAt: '2026-07-28', views: 124, expiresAt: '2026-08-11' },
    ]
  }
  return request('GET', '/v1/mlm/admin/marketplace')
}
export async function approveAdminMarketplaceListing(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/marketplace/${id}/approve`)
}
export async function removeAdminMarketplaceListing(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/marketplace/${id}`)
}

// ── Member: Quick Order ─────────────────────────────────────────────────────
export async function getMemberQuickOrderCatalog() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      favorites: [
        { id: 'q1', name: 'BPC-157 Standard', sku: 'VP-BPC-500', price: 89, memberPrice: 71.20, pv: 70, inStock: true, stock: 48, lastOrdered: '2026-07-15', timesOrdered: 8 },
        { id: 'q2', name: 'TB-500 Thymosin', sku: 'VP-TB500-2', price: 109, memberPrice: 87.20, pv: 85, inStock: true, stock: 23, lastOrdered: '2026-07-20', timesOrdered: 5 },
        { id: 'q3', name: 'BPC-157 Pro Blend', sku: 'VP-BPC-PRO', price: 129, memberPrice: 103.20, pv: 100, inStock: true, stock: 31, lastOrdered: '2026-06-30', timesOrdered: 3 },
      ],
      recentOrders: [
        { orderId: 'ORD-7823', date: '2026-07-20', items: [{ id: 'q1', name: 'BPC-157 Standard', qty: 2, memberPrice: 71.20, pv: 70, inStock: true }, { id: 'q2', name: 'TB-500 Thymosin', qty: 1, memberPrice: 87.20, pv: 85, inStock: true }] },
        { orderId: 'ORD-7654', date: '2026-07-03', items: [{ id: 'q3', name: 'BPC-157 Pro Blend', qty: 1, memberPrice: 103.20, pv: 100, inStock: true }] },
      ],
      allProducts: [
        { id: 'q1', name: 'BPC-157 Standard', sku: 'VP-BPC-500', memberPrice: 71.20, pv: 70, inStock: true },
        { id: 'q2', name: 'TB-500 Thymosin', sku: 'VP-TB500-2', memberPrice: 87.20, pv: 85, inStock: true },
        { id: 'q3', name: 'BPC-157 Pro Blend', sku: 'VP-BPC-PRO', memberPrice: 103.20, pv: 100, inStock: true },
        { id: 'q4', name: 'GHK-Cu Skin Complex', sku: 'VP-GHK-50', memberPrice: 63.20, pv: 60, inStock: false },
        { id: 'q5', name: 'CJC-1295 Growth', sku: 'VP-CJC-2', memberPrice: 119.20, pv: 120, inStock: true },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/quick-order')
}
export async function submitMemberQuickOrder(items) {
  if (MOCK) { await new Promise(r => setTimeout(r, 800)); return { orderId: `ORD-${Math.floor(Math.random()*1000)+8000}`, status: 'confirmed' } }
  return request('POST', '/v1/mlm/member/quick-order', { items })
}

// ── Member: Meeting Scheduler ───────────────────────────────────────────────
export async function getMemberMeetingScheduler() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      upline: { name: 'Bjørn Vesterinen', rank: 'Diamond', avatar: 'BV', responseTime: '< 4 hours' },
      upcoming: [
        { id: 'mt1', title: '1:1 Strategy Call', type: '1on1', date: '2026-08-12', time: '15:00 CET', duration: 30, status: 'confirmed', with: 'Bjørn Vesterinen' },
        { id: 'mt2', title: 'Team Onboarding — New Recruits', type: 'group', date: '2026-08-15', time: '18:00 CET', duration: 60, status: 'pending', with: 'Bjørn Vesterinen' },
      ],
      past: [
        { id: 'mt3', title: 'Monthly Business Review', type: '1on1', date: '2026-07-30', time: '14:00 CET', duration: 30, status: 'completed', with: 'Bjørn Vesterinen', notes: 'Discussed rank promotion strategy. Action: recruit 2 members by Aug 15.' },
        { id: 'mt4', title: 'Product Training', type: 'group', date: '2026-07-22', time: '19:00 CET', duration: 60, status: 'completed', with: 'Bjørn Vesterinen', notes: 'Covered BPC-157 science and sales positioning.' },
      ],
      availableSlots: [
        { date: '2026-08-10', slots: ['10:00', '11:00', '14:00'] },
        { date: '2026-08-11', slots: ['09:00', '15:00', '16:00'] },
        { date: '2026-08-13', slots: ['10:00', '13:00'] },
        { date: '2026-08-14', slots: ['11:00', '14:00', '17:00'] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/meetings')
}
export async function bookMemberMeeting(slot) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `mt${Date.now()}`, status: 'pending', ...slot } }
  return request('POST', '/v1/mlm/member/meetings', slot)
}
export async function cancelMemberMeeting(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/meetings/${id}`)
}

// ── Member: Knowledge Base ──────────────────────────────────────────────────
export async function getMemberKnowledgeBase(query) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const articles = [
      { id: 'kb1', title: 'How does the commission structure work?', category: 'compensation', views: 3842, helpful: 94, lastUpdated: '2026-07-15', excerpt: 'Our binary matrix pays out on two legs. Personal commissions are 20% on retail sales, with team commissions up to 10% on your downline volume...' },
      { id: 'kb2', title: 'What are PV points and how are they calculated?', category: 'compensation', views: 2914, helpful: 91, lastUpdated: '2026-07-10', excerpt: 'PV (Personal Volume) points are assigned to every product. 1 PV ≈ €1 of wholesale price. Each month, your PV total determines...' },
      { id: 'kb3', title: 'How to use BPC-157 safely', category: 'products', views: 5821, helpful: 97, lastUpdated: '2026-07-20', excerpt: 'BPC-157 is generally well-tolerated. Recommended dosage is 200–500mcg per day. Always store refrigerated and consult your physician...' },
      { id: 'kb4', title: 'How do I qualify for autoship discounts?', category: 'orders', views: 1823, helpful: 88, lastUpdated: '2026-06-28', excerpt: 'Members on active autoship with a minimum order of 50 PV receive an additional 5% discount on all products in their autoship order...' },
      { id: 'kb5', title: 'How to recruit your first team member', category: 'recruitment', views: 4312, helpful: 92, lastUpdated: '2026-07-18', excerpt: 'Start with your warm market — friends, family, and colleagues who already trust you. Share your personal story first before presenting the business...' },
      { id: 'kb6', title: 'Rank qualifications explained', category: 'compensation', views: 2103, helpful: 89, lastUpdated: '2026-07-05', excerpt: 'Each rank requires a combination of personal PV and team PV. Bronze requires 100 personal PV + 500 team PV. Silver requires 150 personal PV + 2,000 team PV...' },
      { id: 'kb7', title: 'What is the Fast Start bonus?', category: 'compensation', views: 1654, helpful: 90, lastUpdated: '2026-06-20', excerpt: 'New members who achieve 200 PV in their first 30 days earn a €100 Fast Start bonus. This stacks with regular commissions and is paid in the monthly run...' },
      { id: 'kb8', title: 'How to request a payout', category: 'payments', views: 1432, helpful: 87, lastUpdated: '2026-07-12', excerpt: 'Payouts are processed on the 15th of each month for the previous month\'s commissions. Minimum payout is €50. To request early payout...' },
      { id: 'kb9', title: 'Storage and handling of peptide products', category: 'products', views: 2876, helpful: 96, lastUpdated: '2026-07-22', excerpt: 'Most peptides require refrigeration (2–8°C). Powder forms should be stored in a freezer until reconstituted. Never expose to direct sunlight...' },
      { id: 'kb10', title: 'GDPR and data privacy for EU members', category: 'compliance', views: 876, helpful: 85, lastUpdated: '2026-06-15', excerpt: 'As a GDPR-compliant business, we never sell member data. You can request a full data export or deletion from your Data Privacy page in the dashboard...' },
    ]
    if (query) {
      const q = query.toLowerCase()
      return articles.filter(a => a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q) || a.category.includes(q))
    }
    return articles
  }
  return request('GET', `/v1/mlm/member/knowledge-base${query ? `?q=${encodeURIComponent(query)}` : ''}`)
}
export async function markKbArticleHelpful(id, helpful) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('POST', `/v1/mlm/member/knowledge-base/${id}/feedback`, { helpful })
}

// ── Member: Product Samples ─────────────────────────────────────────────────
export async function getMemberProductSamples() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      allowanceUsed: 2, allowanceTotal: 4, resetDate: '2026-09-01',
      history: [
        { id: 'sm1', product: 'BPC-157 Standard (7-day sample)', requestedAt: '2026-08-01', status: 'delivered', trackingCode: 'NO12345678', deliveredAt: '2026-08-04' },
        { id: 'sm2', product: 'GHK-Cu Skin Complex (trial size)', requestedAt: '2026-07-15', status: 'delivered', trackingCode: 'NO98765432', deliveredAt: '2026-07-18' },
        { id: 'sm3', product: 'TB-500 Thymosin (7-day sample)', requestedAt: '2026-08-06', status: 'processing', trackingCode: null, deliveredAt: null },
      ],
      availableSamples: [
        { id: 'sp1', name: 'BPC-157 Standard (7-day sample)', description: '7-day supply of BPC-157 500mcg capsules', pv: 0, value: '€15', available: true },
        { id: 'sp2', name: 'TB-500 Thymosin (7-day sample)', description: '7-day supply of TB-500 2mg powder', pv: 0, value: '€18', available: false },
        { id: 'sp3', name: 'GHK-Cu Skin Complex (trial size)', description: '5ml trial serum — 2 week supply', pv: 0, value: '€12', available: true },
        { id: 'sp4', name: 'CJC-1295 Growth (5-day sample)', description: '5-day supply of CJC-1295 2mg', pv: 0, value: '€20', available: true },
        { id: 'sp5', name: 'Nordic Starter Pack (multi-sample)', description: 'Small samples of 4 bestsellers in one box', pv: 0, value: '€35', available: true },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/samples')
}
export async function requestMemberProductSample(sampleId, address) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `sm${Date.now()}`, status: 'processing', product: sampleId } }
  return request('POST', '/v1/mlm/member/samples', { sampleId, address })
}

// ── Admin: Credit Notes ─────────────────────────────────────────────────────
export async function getAdminCreditNotes() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      notes: [
        { id: 'CN-1042', memberId: 'M-1042', memberName: 'Anna Svensson', amount: 45, currency: 'EUR', type: 'refund', reason: 'Damaged product — order #8821', status: 'active', issuedAt: '2026-08-05', expiresAt: '2026-11-05' },
        { id: 'CN-1038', memberId: 'M-1038', memberName: 'Erik Lindgren', amount: 20, currency: 'EUR', type: 'goodwill', reason: 'Delayed delivery — goodwill gesture', status: 'used', issuedAt: '2026-07-28', expiresAt: null, usedAt: '2026-08-02' },
        { id: 'CN-1031', memberId: 'M-1031', memberName: 'Maja Karlsson', amount: 120, currency: 'EUR', type: 'correction', reason: 'Overcharge correction — invoice error', status: 'active', issuedAt: '2026-07-20', expiresAt: '2026-10-20' },
        { id: 'CN-1019', memberId: 'M-1019', memberName: 'Lars Andersen', amount: 30, currency: 'EUR', type: 'loyalty', reason: 'Loyalty reward — 1 year anniversary', status: 'expired', issuedAt: '2026-05-01', expiresAt: '2026-07-31' },
        { id: 'CN-1008', memberId: 'M-1008', memberName: 'Ingrid Berg', amount: 60, currency: 'EUR', type: 'refund', reason: 'Returned goods — order #7654', status: 'void', issuedAt: '2026-06-15', expiresAt: null },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/credit-notes')
}
export async function createAdminCreditNote(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 700)); return { id: `CN-${Date.now()}`, ...data, status: 'active', issuedAt: new Date().toISOString().slice(0,10), expiresAt: null } }
  return request('POST', '/v1/mlm/admin/credit-notes', data)
}
export async function voidAdminCreditNote(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', `/v1/mlm/admin/credit-notes/${id}/void`)
}

// ── Admin: Recruitment Pipeline ─────────────────────────────────────────────
export async function getAdminRecruitmentPipeline() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      avgDaysToEnroll: 18,
      prospects: [
        { id: 'rp1', name: 'Hanna Olsen', email: 'hanna@email.no', recruiter: 'Anna Svensson', stage: 'enrolled', dayInFunnel: 22, source: 'referral', addedAt: '2026-07-17' },
        { id: 'rp2', name: 'Tor Bakke', email: 'tor@email.no', recruiter: 'Erik Lindgren', stage: 'trial', dayInFunnel: 9, source: 'social media', addedAt: '2026-07-30' },
        { id: 'rp3', name: 'Silje Nygård', email: 'silje@email.no', recruiter: 'Maja Karlsson', stage: 'interested', dayInFunnel: 5, source: 'event', addedAt: '2026-08-03' },
        { id: 'rp4', name: 'Olav Haugen', email: 'olav@email.no', recruiter: 'Anna Svensson', stage: 'contacted', dayInFunnel: 3, source: 'personal', addedAt: '2026-08-05' },
        { id: 'rp5', name: 'Kristin Moe', email: 'kristin@email.no', recruiter: 'Lars Andersen', stage: 'lead', dayInFunnel: 1, source: 'online ad', addedAt: '2026-08-08' },
        { id: 'rp6', name: 'Jonas Vik', email: 'jonas@email.no', recruiter: 'Erik Lindgren', stage: 'interested', dayInFunnel: 11, source: 'referral', addedAt: '2026-07-28' },
        { id: 'rp7', name: 'Maria Dahl', email: 'maria@email.no', recruiter: 'Maja Karlsson', stage: 'dropped', dayInFunnel: 30, source: 'social media', addedAt: '2026-07-09' },
        { id: 'rp8', name: 'Bjørn Strand', email: 'bstrand@email.no', recruiter: 'Anna Svensson', stage: 'trial', dayInFunnel: 14, source: 'event', addedAt: '2026-07-25' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/recruitment-pipeline')
}

// ── Admin: Email Deliverability ─────────────────────────────────────────────
export async function getAdminEmailDeliverability() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      domain: {
        health: 'excellent', sendingDomain: 'mail.nordicvitals.no',
        deliveryRate: 98.7, openRate: 34.2, clickRate: 6.8,
        bounceRate: 0.8, spamRate: 0.03, unsubRate: 0.12,
        dkim: true, spf: true, dmarc: true,
      },
      campaigns: [
        { id: 'ec1', name: 'August Product Launch', sent: 4821, deliveryRate: 99.1, openRate: 38.4, clickRate: 8.2, bounceRate: 0.6, spamRate: 0.02, sentAt: '2026-08-01' },
        { id: 'ec2', name: 'Summer Sale Newsletter', sent: 5103, deliveryRate: 98.4, openRate: 31.7, clickRate: 5.9, bounceRate: 1.1, spamRate: 0.04, sentAt: '2026-07-15' },
        { id: 'ec3', name: 'New Member Welcome', sent: 312, deliveryRate: 99.7, openRate: 72.4, clickRate: 44.2, bounceRate: 0.3, spamRate: 0.0, sentAt: '2026-07-01' },
        { id: 'ec4', name: 'Commission Run Notification', sent: 2894, deliveryRate: 99.2, openRate: 61.3, clickRate: 28.9, bounceRate: 0.4, spamRate: 0.01, sentAt: '2026-08-05' },
      ],
      issues: []
    }
  }
  return request('GET', '/v1/mlm/admin/email-deliverability')
}

// ── Admin: Affiliate Network ────────────────────────────────────────────────
export async function getAdminAffiliateNetwork() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      affiliates: [
        { id: 'af1', name: 'PeptideBlogNO', email: 'editor@peptideblog.no', website: 'peptideblog.no', commissionPct: 12, tier: 'gold', status: 'active', clicks: 8412, conversions: 84, revenue: 9240, pendingPayout: 1108.80 },
        { id: 'af2', name: 'NordicHealthReview', email: 'contact@nordichealthreview.se', website: 'nordichealthreview.se', commissionPct: 10, tier: 'silver', status: 'active', clicks: 4230, conversions: 38, revenue: 4180, pendingPayout: 418 },
        { id: 'af3', name: 'FitnessFreaks DK', email: 'collab@fitnessfreaks.dk', website: 'fitnessfreaks.dk', commissionPct: 10, tier: 'standard', status: 'paused', clicks: 1820, conversions: 12, revenue: 1320, pendingPayout: 0 },
        { id: 'af4', name: 'BioHackingPodcast', email: 'sponsor@biohackpodcast.com', website: 'biohackpodcast.com', commissionPct: 15, tier: 'platinum', status: 'active', clicks: 14200, conversions: 212, revenue: 23320, pendingPayout: 3498 },
        { id: 'af5', name: 'SportSupplementHub', email: 'partners@sshub.eu', website: 'sshub.eu', commissionPct: 8, tier: 'standard', status: 'pending', clicks: 0, conversions: 0, revenue: 0, pendingPayout: 0 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/affiliate-network')
}
export async function createAdminAffiliate(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `af${Date.now()}`, ...data, status: 'pending', clicks: 0, conversions: 0, revenue: 0, pendingPayout: 0 } }
  return request('POST', '/v1/mlm/admin/affiliate-network', data)
}
export async function updateAdminAffiliateStatus(id, status) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/affiliate-network/${id}`, { status })
}

// ── Member: Credit Notes ────────────────────────────────────────────────────
export async function getMemberCreditNotes() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      notes: [
        { id: 'CN-1042', amount: 45, currency: 'EUR', type: 'refund', reason: 'Damaged product — order #8821', status: 'active', issuedAt: '2026-08-05', expiresAt: '2026-11-05' },
        { id: 'CN-1031', amount: 120, currency: 'EUR', type: 'correction', reason: 'Overcharge correction — invoice error', status: 'active', issuedAt: '2026-07-20', expiresAt: '2026-10-20' },
        { id: 'CN-1008', amount: 20, currency: 'EUR', type: 'goodwill', reason: 'Goodwill gesture — late delivery', status: 'used', issuedAt: '2026-06-01', usedAt: '2026-06-10' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/credit-notes')
}

// ── Member: Autoship History ────────────────────────────────────────────────
export async function getMemberAutoshipHistory() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 500))
    return {
      stats: { total: 14, delivered: 13, totalPv: 1820, totalSpent: 2548 },
      runs: [
        { id: 'as14', orderRef: 'ORD-9201', status: 'delivered', processedAt: '2026-08-01', pv: 150, total: 198, trackingCode: 'NO44123456', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
        { id: 'as13', orderRef: 'ORD-8844', status: 'delivered', processedAt: '2026-07-01', pv: 150, total: 198, trackingCode: 'NO44098765', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
        { id: 'as12', orderRef: 'ORD-8501', status: 'skipped', processedAt: '2026-06-01', pv: 0, total: 0, trackingCode: null, items: [] },
        { id: 'as11', orderRef: 'ORD-8102', status: 'delivered', processedAt: '2026-05-01', pv: 180, total: 248, trackingCode: 'NO43987654', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'GHK-Cu Serum 30ml', qty: 1, price: 89 }, { name: 'Shipping', qty: 1, price: 30 }] },
        { id: 'as10', orderRef: 'ORD-7832', status: 'delivered', processedAt: '2026-04-01', pv: 150, total: 198, trackingCode: 'NO43112233', items: [{ name: 'BPC-157 500mcg (60 caps)', qty: 1, price: 129 }, { name: 'TB-500 2mg', qty: 1, price: 69 }] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/autoship-history')
}

// ── Member: Recruitment Pipeline ────────────────────────────────────────────
export async function getMemberRecruitmentPipeline() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      prospects: [
        { id: 'mp1', name: 'Hanna Olsen', email: 'hanna@email.no', phone: '+47 912 34 567', stage: 'enrolled', dayInFunnel: 22, source: 'referral', notes: 'Very motivated, loves fitness.' },
        { id: 'mp2', name: 'Tor Bakke', email: 'tor@email.no', phone: '', stage: 'trial', dayInFunnel: 9, source: 'social media', notes: 'Trying BPC-157 starter pack.' },
        { id: 'mp3', name: 'Silje Nygård', email: 'silje@email.no', phone: '+47 900 11 222', stage: 'interested', dayInFunnel: 5, source: 'event', notes: 'Met at Oslo wellness fair.' },
        { id: 'mp4', name: 'Olav Haugen', email: '', phone: '+47 955 44 321', stage: 'contacted', dayInFunnel: 3, source: 'personal', notes: 'Old colleague.' },
        { id: 'mp5', name: 'Kristin Moe', email: 'kristin@email.no', phone: '', stage: 'lead', dayInFunnel: 1, source: 'online ad', notes: '' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/recruitment-pipeline')
}
export async function addMemberProspect(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `mp${Date.now()}`, ...data, stage: 'lead', dayInFunnel: 0 } }
  return request('POST', '/v1/mlm/member/recruitment-pipeline', data)
}
export async function updateMemberProspectStage(id, stage) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/recruitment-pipeline/${id}`, { stage })
}

// ── Member: SMART Goals ─────────────────────────────────────────────────────
export async function getMemberSmartGoals() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      goals: [
        { id: 'sg1', title: 'Reach Silver rank by September', category: 'rank', specific: 'Achieve Silver rank by accumulating 2,000 team PV in Q3.', measurable: 'Check team PV weekly in the dashboard.', target: 2000, current: 1240, unit: 'team PV', deadline: '2026-09-30', status: 'on_track', milestones: [{ label: '500 team PV', dueDate: '2026-07-31', done: true }, { label: '1,000 team PV', dueDate: '2026-08-15', done: true }, { label: '1,500 team PV', dueDate: '2026-08-31', done: false }, { label: '2,000 team PV', dueDate: '2026-09-30', done: false }] },
        { id: 'sg2', title: 'Recruit 3 new members in August', category: 'recruitment', specific: 'Personally enroll 3 new members at any starter tier.', measurable: 'Track via recruitment pipeline.', target: 3, current: 1, unit: 'members', deadline: '2026-08-31', status: 'behind', milestones: [] },
        { id: 'sg3', title: 'Complete all Q3 training modules', category: 'learning', specific: 'Finish 8 assigned training modules by end of Q3.', measurable: 'Track in My Learning Path.', target: 8, current: 8, unit: 'modules', deadline: '2026-09-30', status: 'completed', milestones: [] },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/smart-goals')
}
export async function createMemberSmartGoal(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: `sg${Date.now()}`, ...data, current: 0, status: 'on_track', milestones: [] } }
  return request('POST', '/v1/mlm/member/smart-goals', data)
}
export async function updateMemberSmartGoalProgress(id, current) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/smart-goals/${id}`, { current })
}
export async function deleteMemberSmartGoal(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/smart-goals/${id}`)
}

// ── Admin Bulk Messaging ──────────────────────────────────────────────────────
export async function getAdminBulkMessages() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      segments: ['All Members','Active Members','Gold+ Rank','New Members (30d)','Inactive (90d)','Custom Segment A'],
      templates: [
        { id: 't1', name: 'Monthly Newsletter', channel: 'email', subject: 'Your Monthly Update' },
        { id: 't2', name: 'Promo Alert', channel: 'email', subject: 'Special Offer Inside' },
        { id: 't3', name: 'SMS Activation', channel: 'sms', subject: '' },
        { id: 't4', name: 'Push Bonus', channel: 'push', subject: '' },
      ],
      history: [
        { id: 'bm1', subject: 'Summer Sale Blast', channel: 'email', segment: 'All Members', sent: 3420, opened: 1840, clicked: 312, status: 'sent', sentAt: '2026-08-07T10:15:00Z' },
        { id: 'bm2', subject: 'Rank Up Reminder', channel: 'sms', segment: 'Active Members', sent: 1100, opened: 1100, clicked: 0, status: 'sent', sentAt: '2026-08-06T14:00:00Z' },
        { id: 'bm3', subject: 'New Product Drop', channel: 'push', segment: 'Gold+ Rank', sent: 540, opened: 390, clicked: 87, status: 'sent', sentAt: '2026-08-05T09:30:00Z' },
        { id: 'bm4', subject: 'August Newsletter', channel: 'email', segment: 'All Members', sent: 0, opened: 0, clicked: 0, status: 'scheduled', sentAt: '2026-08-10T08:00:00Z' },
        { id: 'bm5', subject: 'Team Broadcast', channel: 'email', segment: 'New Members (30d)', sent: 0, opened: 0, clicked: 0, status: 'draft', sentAt: '' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/bulk-messages')
}
export async function sendAdminBulkMessage(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id: 'bm_new', status: 'scheduled', ...data } }
  return request('POST', '/v1/mlm/admin/bulk-messages/send', data)
}
export async function deleteAdminBulkMessage(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/bulk-messages/${id}`)
}

// ── Admin Network Health ──────────────────────────────────────────────────────
export async function getAdminNetworkHealth() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 450))
    return {
      kpis: [
        { label: 'Total Members', value: 3847, delta: '+142', trend: 'up' },
        { label: 'Active (30d)', value: 2104, delta: '+38', trend: 'up' },
        { label: 'Churn Rate', value: '4.2%', delta: '-0.3%', trend: 'down' },
        { label: 'Avg Team Size', value: 7.4, delta: '+0.6', trend: 'up' },
      ],
      rankDistribution: [
        { rank: 'Starter', count: 1240, pct: 32 },
        { rank: 'Bronze', count: 980, pct: 25 },
        { rank: 'Silver', count: 720, pct: 19 },
        { rank: 'Gold', count: 510, pct: 13 },
        { rank: 'Platinum', count: 280, pct: 7 },
        { rank: 'Diamond', count: 117, pct: 4 },
      ],
      monthlyGrowth: [
        { month: 'Mar', new: 210, churned: 88 },
        { month: 'Apr', new: 198, churned: 72 },
        { month: 'May', new: 234, churned: 91 },
        { month: 'Jun', new: 188, churned: 68 },
        { month: 'Jul', new: 256, churned: 84 },
        { month: 'Aug', new: 142, churned: 31 },
      ],
      dormant: [
        { id: 'd1', name: 'Jonas Larsson', rank: 'Silver', lastActive: '2026-05-12', teamSize: 8 },
        { id: 'd2', name: 'Eva Kristiansen', rank: 'Bronze', lastActive: '2026-04-28', teamSize: 3 },
        { id: 'd3', name: 'Mikkel Andersen', rank: 'Gold', lastActive: '2026-05-01', teamSize: 14 },
        { id: 'd4', name: 'Astrid Holm', rank: 'Starter', lastActive: '2026-04-10', teamSize: 1 },
        { id: 'd5', name: 'Ragnar Bjørnstad', rank: 'Silver', lastActive: '2026-05-20', teamSize: 6 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/network-health')
}

// ── Admin Reward Programs ─────────────────────────────────────────────────────
export async function getAdminRewardPrograms() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      programs: [
        { id: 'rp1', name: 'Summer Bonus Blast', type: 'multiplier', multiplier: 2.0, segment: 'All Members', startDate: '2026-07-01', endDate: '2026-08-31', active: true, enrolledCount: 1842, totalAwarded: 48200 },
        { id: 'rp2', name: 'Rank Up Milestone', type: 'milestone', milestone: 'Reach Silver', reward: '€50 store credit', segment: 'Bronze Members', startDate: '2026-06-01', endDate: '2026-12-31', active: true, enrolledCount: 980, totalAwarded: 12400 },
        { id: 'rp3', name: 'Referral Booster', type: 'bonus', bonusPct: 25, segment: 'Active Members', startDate: '2026-08-01', endDate: '2026-09-30', active: true, enrolledCount: 2104, totalAwarded: 8750 },
        { id: 'rp4', name: 'Winter Loyalty Drive', type: 'multiplier', multiplier: 1.5, segment: 'Gold+ Rank', startDate: '2026-01-01', endDate: '2026-03-31', active: false, enrolledCount: 907, totalAwarded: 31600 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/reward-programs')
}
export async function createAdminRewardProgram(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { id: `rp_${Date.now()}`, active: true, enrolledCount: 0, totalAwarded: 0, ...data } }
  return request('POST', '/v1/mlm/admin/reward-programs', data)
}
export async function toggleAdminRewardProgram(id, active) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, active } }
  return request('PATCH', `/v1/mlm/admin/reward-programs/${id}`, { active })
}
export async function deleteAdminRewardProgram(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/reward-programs/${id}`)
}

// ── Admin Pending Approvals ───────────────────────────────────────────────────
export async function getAdminPendingApprovals() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      counts: { kyc: 8, payouts: 14, marketplace: 5, appeals: 3, coOp: 2 },
      items: [
        { id: 'pa1', type: 'kyc', member: 'Ingrid Solberg', detail: 'Passport + proof of address', submittedAt: '2026-08-08T07:10:00Z', priority: 'high' },
        { id: 'pa2', type: 'payout', member: 'Lars Eriksson', detail: '€820.00 SEPA withdrawal', submittedAt: '2026-08-08T06:45:00Z', priority: 'normal' },
        { id: 'pa3', type: 'payout', member: 'Sigrid Dahl', detail: '€1,250.00 SEPA withdrawal', submittedAt: '2026-08-07T22:00:00Z', priority: 'high' },
        { id: 'pa4', type: 'marketplace', member: 'Bjørn Haugen', detail: 'Listing: NV Starter Kit (used)', submittedAt: '2026-08-08T05:20:00Z', priority: 'normal' },
        { id: 'pa5', type: 'kyc', member: 'Freya Magnusson', detail: 'National ID upload', submittedAt: '2026-08-07T18:30:00Z', priority: 'normal' },
        { id: 'pa6', type: 'appeal', member: 'Erik Thorvald', detail: 'Commission dispute #CD-2281', submittedAt: '2026-08-07T15:00:00Z', priority: 'high' },
        { id: 'pa7', type: 'co-op', member: 'Helga Nilsen', detail: 'Co-Op ad campaign: €400 request', submittedAt: '2026-08-07T10:00:00Z', priority: 'normal' },
        { id: 'pa8', type: 'marketplace', member: 'Olav Brekke', detail: 'Listing: Peptide Sample Pack', submittedAt: '2026-08-06T20:00:00Z', priority: 'normal' },
        { id: 'pa9', type: 'payout', member: 'Kristin Vik', detail: '€340.00 SEPA withdrawal', submittedAt: '2026-08-06T19:00:00Z', priority: 'normal' },
        { id: 'pa10', type: 'kyc', member: 'Ragnar Bjørnstad', detail: 'Driver licence scan', submittedAt: '2026-08-06T14:00:00Z', priority: 'normal' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/pending-approvals')
}
export async function resolveAdminApproval(id, action, note) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, action, note } }
  return request('POST', `/v1/mlm/admin/pending-approvals/${id}/resolve`, { action, note })
}

// ── Member My Promotions ──────────────────────────────────────────────────────
export async function getMemberPromotions() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      materials: [
        { id: 'mp1', name: 'NV Summer Banner 1200×628', type: 'banner', format: 'PNG', product: 'Viking Peptides', size: '1200×628', language: 'EN', downloads: 84, previewUrl: '', updatedAt: '2026-08-01' },
        { id: 'mp2', name: 'NV Instagram Story', type: 'social', format: 'PNG', product: 'Nordic Vitals', size: '1080×1920', language: 'EN', downloads: 212, previewUrl: '', updatedAt: '2026-07-28' },
        { id: 'mp3', name: 'Product Flyer A4', type: 'flyer', format: 'PDF', product: 'Viking Peptides', size: 'A4', language: 'NO', downloads: 56, previewUrl: '', updatedAt: '2026-07-20' },
        { id: 'mp4', name: 'Facebook Ad 1200×630', type: 'banner', format: 'PNG', product: 'Nordic Vitals', size: '1200×630', language: 'EN', downloads: 147, previewUrl: '', updatedAt: '2026-07-15' },
        { id: 'mp5', name: 'TikTok Video Script EN', type: 'script', format: 'TXT', product: 'Viking Peptides', size: '—', language: 'EN', downloads: 38, previewUrl: '', updatedAt: '2026-07-10' },
        { id: 'mp6', name: 'Business Card Template', type: 'print', format: 'PDF', product: 'Nordic Vitals', size: '85×55mm', language: 'EN', downloads: 91, previewUrl: '', updatedAt: '2026-07-05' },
        { id: 'mp7', name: 'NV LinkedIn Banner', type: 'social', format: 'PNG', product: 'Nordic Vitals', size: '1584×396', language: 'EN', downloads: 67, previewUrl: '', updatedAt: '2026-06-30' },
        { id: 'mp8', name: 'Produktark Norsk A4', type: 'flyer', format: 'PDF', product: 'Viking Peptides', size: 'A4', language: 'NO', downloads: 29, previewUrl: '', updatedAt: '2026-06-20' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/promotions')
}

// ── Member Training Planner ───────────────────────────────────────────────────
export async function getMemberTrainingPlanner() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const now = new Date('2026-08-08')
    return {
      upcoming: [
        { id: 'tp1', title: 'Advanced Peptide Science', type: 'webinar', host: 'Dr. Erik Thorvald', date: '2026-08-12T18:00:00Z', duration: 60, registered: true, seats: 200, enrolled: 142 },
        { id: 'tp2', title: 'MLM Compliance Basics', type: 'video', host: 'NV Academy', date: '2026-08-14T10:00:00Z', duration: 45, registered: false, seats: null, enrolled: null },
        { id: 'tp3', title: 'Social Selling Masterclass', type: 'live', host: 'Astrid Holm', date: '2026-08-20T17:00:00Z', duration: 90, registered: false, seats: 50, enrolled: 31 },
        { id: 'tp4', title: 'Rank Qualification Strategy', type: 'webinar', host: 'NV Leadership Team', date: '2026-08-27T18:00:00Z', duration: 75, registered: true, seats: 500, enrolled: 318 },
      ],
      past: [
        { id: 'tp5', title: 'Onboarding Fast Start', type: 'video', host: 'NV Academy', date: '2026-07-28T10:00:00Z', duration: 30, completed: true, score: 92 },
        { id: 'tp6', title: 'Product Knowledge 101', type: 'video', host: 'NV Academy', date: '2026-07-22T09:00:00Z', duration: 40, completed: true, score: 88 },
        { id: 'tp7', title: 'Team Building Fundamentals', type: 'webinar', host: 'Bjørn Haugen', date: '2026-07-15T17:00:00Z', duration: 60, completed: true, score: 95 },
      ],
      streakDays: 14,
      totalHours: 12.5,
    }
  }
  return request('GET', '/v1/mlm/member/training-planner')
}
export async function registerMemberTraining(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { id, registered: true } }
  return request('POST', `/v1/mlm/member/training-planner/${id}/register`)
}

// ── Member My Tokens ──────────────────────────────────────────────────────────
export async function getMemberTokens() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      balance: 2840,
      pendingBalance: 120,
      lifetimeEarned: 8420,
      lifetimeRedeemed: 5580,
      transactions: [
        { id: 'tk1', type: 'earn', source: 'Commission Q3 bonus', amount: 400, date: '2026-08-08T00:00:00Z', status: 'confirmed' },
        { id: 'tk2', type: 'earn', source: 'Referral bonus — Ingrid S.', amount: 120, date: '2026-08-07T14:00:00Z', status: 'pending' },
        { id: 'tk3', type: 'redeem', source: 'Store credit redemption', amount: -500, date: '2026-08-05T10:00:00Z', status: 'confirmed' },
        { id: 'tk4', type: 'earn', source: 'Rank milestone: Gold', amount: 1000, date: '2026-07-30T00:00:00Z', status: 'confirmed' },
        { id: 'tk5', type: 'earn', source: 'Monthly activity bonus', amount: 200, date: '2026-07-01T00:00:00Z', status: 'confirmed' },
        { id: 'tk6', type: 'redeem', source: 'Training course unlock', amount: -300, date: '2026-06-20T00:00:00Z', status: 'confirmed' },
        { id: 'tk7', type: 'earn', source: 'Team volume bonus', amount: 350, date: '2026-06-01T00:00:00Z', status: 'confirmed' },
      ],
      redemptionOptions: [
        { id: 'ro1', name: 'Store Credit', rate: '100 tokens = €1', minTokens: 500, icon: '🛒' },
        { id: 'ro2', name: 'Commission Boost', rate: '500 tokens = +5% for 30d', minTokens: 500, icon: '📈' },
        { id: 'ro3', name: 'Training Unlock', rate: '300 tokens = 1 premium course', minTokens: 300, icon: '🎓' },
        { id: 'ro4', name: 'Event Ticket', rate: '1000 tokens = 1 VIP event pass', minTokens: 1000, icon: '🎟️' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/tokens')
}
export async function redeemMemberTokens(optionId, amount) {
  if (MOCK) { await new Promise(r => setTimeout(r, 500)); return { ok: true, remaining: 2840 - amount } }
  return request('POST', '/v1/mlm/member/tokens/redeem', { optionId, amount })
}

// ── Member Team Leaderboard ───────────────────────────────────────────────────
export async function getMemberTeamLeaderboard(period, metric) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    const entries = [
      { rank: 1, name: 'Astrid Holm', rankTitle: 'Diamond', volume: 48200, recruits: 12, commissions: 6840, trend: 'up', isMe: false },
      { rank: 2, name: 'Lars Eriksson', rankTitle: 'Platinum', volume: 41500, recruits: 9, commissions: 5920, trend: 'up', isMe: false },
      { rank: 3, name: 'Ingrid Solberg', rankTitle: 'Gold', volume: 34800, recruits: 7, commissions: 4970, trend: 'stable', isMe: false },
      { rank: 4, name: 'Bjørn Haugen', rankTitle: 'Gold', volume: 29100, recruits: 6, commissions: 4150, trend: 'down', isMe: false },
      { rank: 5, name: 'You', rankTitle: 'Silver', volume: 24600, recruits: 4, commissions: 3510, trend: 'up', isMe: true },
      { rank: 6, name: 'Freya Magnusson', rankTitle: 'Silver', volume: 21300, recruits: 5, commissions: 3040, trend: 'up', isMe: false },
      { rank: 7, name: 'Erik Thorvald', rankTitle: 'Silver', volume: 18900, recruits: 3, commissions: 2700, trend: 'stable', isMe: false },
      { rank: 8, name: 'Sigrid Dahl', rankTitle: 'Bronze', volume: 14200, recruits: 4, commissions: 2030, trend: 'up', isMe: false },
      { rank: 9, name: 'Olav Brekke', rankTitle: 'Bronze', volume: 11800, recruits: 2, commissions: 1680, trend: 'down', isMe: false },
      { rank: 10, name: 'Helga Nilsen', rankTitle: 'Bronze', volume: 9400, recruits: 3, commissions: 1340, trend: 'stable', isMe: false },
    ]
    return { entries, period, metric, myRank: 5, totalParticipants: 248 }
  }
  return request('GET', `/v1/mlm/member/team-leaderboard?period=${period}&metric=${metric}`)
}

// ── Admin Chargebacks ─────────────────────────────────────────────────────────
export async function getAdminChargebacks() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      items: [
        { id: 'cb1', caseId: 'CB-2024-001', member: 'Lars Eriksson', email: 'lars.e@example.com', amount: 149.99, reason: 'fraudulent', gateway: 'Stripe', status: 'open', deadline: '2026-08-20T00:00:00Z', orderRef: 'ORD-7821' },
        { id: 'cb2', caseId: 'CB-2024-002', member: 'Ingrid Solberg', email: 'ingrid.s@example.com', amount: 89.00, reason: 'unrecognized', gateway: 'Stripe', status: 'pending', deadline: '2026-08-18T00:00:00Z', orderRef: 'ORD-7690' },
        { id: 'cb3', caseId: 'CB-2024-003', member: 'Bjørn Haugen', email: 'bjorn.h@example.com', amount: 210.50, reason: 'product_not_received', gateway: 'PayPal', status: 'won', deadline: '2026-07-30T00:00:00Z', orderRef: 'ORD-7402' },
        { id: 'cb4', caseId: 'CB-2024-004', member: 'Freya Magnusson', email: 'freya.m@example.com', amount: 59.90, reason: 'duplicate', gateway: 'Klarna', status: 'lost', deadline: '2026-07-15T00:00:00Z', orderRef: 'ORD-7210' },
        { id: 'cb5', caseId: 'CB-2024-005', member: 'Erik Thorvald', email: 'erik.t@example.com', amount: 320.00, reason: 'subscription_canceled', gateway: 'Stripe', status: 'open', deadline: '2026-08-25T00:00:00Z', orderRef: 'ORD-7901' },
        { id: 'cb6', caseId: 'CB-2024-006', member: 'Astrid Holm', email: 'astrid.h@example.com', amount: 74.95, reason: 'fraudulent', gateway: 'Stripe', status: 'won', deadline: '2026-07-01T00:00:00Z', orderRef: 'ORD-7050' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/chargebacks')
}
export async function updateAdminChargeback(id, action, note) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { id, action, note } }
  return request('PATCH', `/v1/mlm/admin/chargebacks/${id}`, { action, note })
}

// ── Admin Product Performance ─────────────────────────────────────────────────
export async function getAdminProductPerformance(period = 'month') {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 450))
    return {
      totalRevenue: 148200,
      totalUnits: 3840,
      avgMargin: 62,
      products: [
        { id: 'pp1', name: 'BPC-157 Complex', sku: 'NV-BPC-10', category: 'Peptides', revenue: 42100, units: 840, margin: 68, conversionRate: 4.2, returns: 3, pv: 80, trend: 'up' },
        { id: 'pp2', name: 'TB-500 Recovery', sku: 'NV-TB5-10', category: 'Peptides', revenue: 38700, units: 620, margin: 71, conversionRate: 3.8, returns: 2, pv: 95, trend: 'up' },
        { id: 'pp3', name: 'GHK-Cu Serum', sku: 'NV-GHK-30', category: 'Skincare', revenue: 21400, units: 710, margin: 55, conversionRate: 5.1, returns: 8, pv: 45, trend: 'stable' },
        { id: 'pp4', name: 'Viking Starter Kit', sku: 'NV-KIT-01', category: 'Bundles', revenue: 18900, units: 189, margin: 60, conversionRate: 6.4, returns: 4, pv: 150, trend: 'up' },
        { id: 'pp5', name: 'Collagen Boost+', sku: 'NV-COL-30', category: 'Supplements', revenue: 14200, units: 472, margin: 58, conversionRate: 4.7, returns: 6, pv: 40, trend: 'down' },
        { id: 'pp6', name: 'Epitalon 10mg', sku: 'NV-EPI-10', category: 'Peptides', revenue: 8900, units: 148, margin: 74, conversionRate: 2.9, returns: 1, pv: 90, trend: 'up' },
        { id: 'pp7', name: 'Nordic Sleep Formula', sku: 'NV-SLP-60', category: 'Supplements', revenue: 4000, units: 267, margin: 49, conversionRate: 3.2, returns: 12, pv: 22, trend: 'down' },
      ]
    }
  }
  return request('GET', `/v1/mlm/admin/product-performance?period=${period}`)
}

// ── Admin Subscription Billing ────────────────────────────────────────────────
export async function getAdminSubscriptionBilling() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      successRate: 94.2,
      failed: [
        { id: 'sb1', member: 'Jonas Larsson', email: 'jonas.l@example.com', plan: 'Viking Pro Monthly', amount: 89.99, failureReason: 'Card declined', retryCount: 1, lastTriedAt: '2026-08-08T06:00:00Z', retryAt: '2026-08-09T06:00:00Z' },
        { id: 'sb2', member: 'Eva Kristiansen', email: 'eva.k@example.com', plan: 'Nordic Essential', amount: 49.99, failureReason: 'Insufficient funds', retryCount: 2, lastTriedAt: '2026-08-07T18:00:00Z', retryAt: '2026-08-10T18:00:00Z' },
        { id: 'sb3', member: 'Mikkel Andersen', email: 'mikkel.a@example.com', plan: 'Viking Pro Monthly', amount: 89.99, failureReason: 'Card expired', retryCount: 3, lastTriedAt: '2026-08-06T12:00:00Z', retryAt: null },
        { id: 'sb4', member: 'Sigrid Dahl', email: 'sigrid.d@example.com', plan: 'Team Builder', amount: 199.00, failureReason: 'Card declined', retryCount: 1, lastTriedAt: '2026-08-08T10:00:00Z', retryAt: '2026-08-09T10:00:00Z' },
      ],
      upcoming: [
        { id: 'up1', member: 'Astrid Holm', email: 'astrid.h@example.com', plan: 'Viking Pro Monthly', amount: 89.99, renewalDate: '2026-08-10T00:00:00Z', status: 'active', paymentMethod: 'Visa •••• 4242' },
        { id: 'up2', member: 'Lars Eriksson', email: 'lars.e@example.com', plan: 'Team Builder', amount: 199.00, renewalDate: '2026-08-11T00:00:00Z', status: 'active', paymentMethod: 'Mastercard •••• 8888' },
        { id: 'up3', member: 'Bjørn Haugen', email: 'bjorn.h@example.com', plan: 'Nordic Essential', amount: 49.99, renewalDate: '2026-08-12T00:00:00Z', status: 'active', paymentMethod: 'Visa •••• 1234' },
        { id: 'up4', member: 'Freya Magnusson', email: 'freya.m@example.com', plan: 'Viking Pro Monthly', amount: 89.99, renewalDate: '2026-08-13T00:00:00Z', status: 'paused', paymentMethod: 'PayPal' },
        { id: 'up5', member: 'Helga Nilsen', email: 'helga.n@example.com', plan: 'Nordic Essential', amount: 49.99, renewalDate: '2026-08-15T00:00:00Z', status: 'active', paymentMethod: 'Klarna' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/subscription-billing')
}
export async function retryAdminBilling(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 600)); return { id, retried: true } }
  return request('POST', `/v1/mlm/admin/subscription-billing/${id}/retry`)
}

// ── Admin Inventory Forecasting ───────────────────────────────────────────────
export async function getAdminInventoryForecasting() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 450))
    return {
      avgDaysCover: 38,
      items: [
        { id: 'if1', name: 'BPC-157 Complex', sku: 'NV-BPC-10', category: 'Peptides', currentStock: 42, reorderPoint: 100, forecastUnits30d: 210, reorderQty: 500, leadTimeDays: 21, risk: 'critical', stockoutDate: '2026-08-15T00:00:00Z', daysCover: 6 },
        { id: 'if2', name: 'TB-500 Recovery', sku: 'NV-TB5-10', category: 'Peptides', currentStock: 88, reorderPoint: 120, forecastUnits30d: 180, reorderQty: 400, leadTimeDays: 21, risk: 'high', stockoutDate: '2026-08-22T00:00:00Z', daysCover: 14 },
        { id: 'if3', name: 'Viking Starter Kit', sku: 'NV-KIT-01', category: 'Bundles', currentStock: 215, reorderPoint: 50, forecastUnits30d: 60, reorderQty: 100, leadTimeDays: 10, risk: 'low', stockoutDate: null, daysCover: 107 },
        { id: 'if4', name: 'Collagen Boost+', sku: 'NV-COL-30', category: 'Supplements', currentStock: 390, reorderPoint: 200, forecastUnits30d: 310, reorderQty: 600, leadTimeDays: 14, risk: 'medium', stockoutDate: '2026-09-07T00:00:00Z', daysCover: 37 },
        { id: 'if5', name: 'GHK-Cu Serum', sku: 'NV-GHK-30', category: 'Skincare', currentStock: 160, reorderPoint: 80, forecastUnits30d: 95, reorderQty: 200, leadTimeDays: 28, risk: 'medium', stockoutDate: '2026-09-11T00:00:00Z', daysCover: 50 },
        { id: 'if6', name: 'Epitalon 10mg', sku: 'NV-EPI-10', category: 'Peptides', currentStock: 310, reorderPoint: 60, forecastUnits30d: 45, reorderQty: 150, leadTimeDays: 21, risk: 'low', stockoutDate: null, daysCover: 206 },
        { id: 'if7', name: 'Nordic Sleep Formula', sku: 'NV-SLP-60', category: 'Supplements', currentStock: 74, reorderPoint: 100, forecastUnits30d: 130, reorderQty: 300, leadTimeDays: 14, risk: 'high', stockoutDate: '2026-08-25T00:00:00Z', daysCover: 17 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/inventory-forecasting')
}

// ── Member Consultations ──────────────────────────────────────────────────────
export async function getMemberConsultations() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      totalHours: 4.5,
      credits: 3,
      experts: [
        { id: 'ex1', name: 'Dr. Erik Thorvald', title: 'Peptide Science Expert' },
        { id: 'ex2', name: 'Astrid Holm', title: 'Business Coach & Diamond Leader' },
        { id: 'ex3', name: 'Ragnar Bjørnstad', title: 'Wellness & Nutrition Advisor' },
        { id: 'ex4', name: 'Ingrid Solberg', title: 'MLM Strategy Coach' },
      ],
      sessions: [
        { id: 'cs1', expertName: 'Dr. Erik Thorvald', expertTitle: 'Peptide Science Expert', type: 'product', topic: 'BPC-157 protocol optimisation', date: '2026-08-14T00:00:00Z', time: '14:00', status: 'upcoming', meetingLink: 'https://meet.example.com/abc' },
        { id: 'cs2', expertName: 'Astrid Holm', expertTitle: 'Business Coach', type: 'business', topic: 'Team building strategy for Q3', date: '2026-08-20T00:00:00Z', time: '10:00', status: 'upcoming', meetingLink: 'https://meet.example.com/def' },
        { id: 'cs3', expertName: 'Ragnar Bjørnstad', expertTitle: 'Wellness Advisor', type: 'wellness', topic: 'Recovery protocol review', date: '2026-07-28T00:00:00Z', time: '15:00', status: 'completed', notes: 'Great session — adjust sleep stack timing and add GHK-Cu topical post-workout.' },
        { id: 'cs4', expertName: 'Ingrid Solberg', expertTitle: 'MLM Strategy Coach', type: 'strategy', topic: 'Reaching Gold rank before Sep', date: '2026-07-15T00:00:00Z', time: '11:00', status: 'completed', notes: 'Focus on 3 strong legs, leverage the Fast Start bonus window in August.' },
        { id: 'cs5', expertName: 'Dr. Erik Thorvald', expertTitle: 'Peptide Science Expert', type: 'product', topic: 'Initial intake consultation', date: '2026-07-01T00:00:00Z', time: '09:00', status: 'cancelled' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/consultations')
}
export async function bookMemberConsultation(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 600))
    const expert = { ex1: { name:'Dr. Erik Thorvald', title:'Peptide Science Expert' }, ex2: { name:'Astrid Holm', title:'Business Coach' }, ex3: { name:'Ragnar Bjørnstad', title:'Wellness Advisor' }, ex4: { name:'Ingrid Solberg', title:'MLM Strategy Coach' } }
    const e = expert[data.expertId] || { name: 'Expert', title: 'Advisor' }
    return { id: `cs_${Date.now()}`, expertName: e.name, expertTitle: e.title, type: data.type, topic: data.topic, date: new Date(data.date).toISOString(), time: data.time, status: 'upcoming', meetingLink: 'https://meet.example.com/new' }
  }
  return request('POST', '/v1/mlm/member/consultations', data)
}

// ── Member Purchase Planner ───────────────────────────────────────────────────
export async function getMemberPurchasePlanner() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      monthlyBudget: 250,
      pvTarget: 200,
      items: [
        { id: 'ppi1', name: 'BPC-157 Complex', emoji: '🧪', price: 149.99, pv: 80, category: 'Peptides', recommended: true, plannedQty: 1 },
        { id: 'ppi2', name: 'TB-500 Recovery', emoji: '💪', price: 124.99, pv: 95, category: 'Peptides', recommended: true, plannedQty: 0 },
        { id: 'ppi3', name: 'GHK-Cu Serum', emoji: '✨', price: 59.99, pv: 45, category: 'Skincare', recommended: false, plannedQty: 1 },
        { id: 'ppi4', name: 'Collagen Boost+', emoji: '🌟', price: 44.99, pv: 40, category: 'Supplements', recommended: false, plannedQty: 0 },
        { id: 'ppi5', name: 'Nordic Sleep Formula', emoji: '🌙', price: 34.99, pv: 22, category: 'Supplements', recommended: false, plannedQty: 1 },
        { id: 'ppi6', name: 'Epitalon 10mg', emoji: '⚗️', price: 189.99, pv: 90, category: 'Peptides', recommended: false, plannedQty: 0 },
        { id: 'ppi7', name: 'Viking Starter Kit', emoji: '🛡️', price: 299.99, pv: 150, category: 'Bundles', recommended: false, plannedQty: 0 },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/purchase-planner')
}
export async function saveMemberPurchasePlan(data) {
  if (MOCK) { await new Promise(r => setTimeout(r, 400)); return { ok: true } }
  return request('POST', '/v1/mlm/member/purchase-planner', data)
}

// ── Member Journal ────────────────────────────────────────────────────────────
export async function getMemberJournal() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      streak: 5,
      entries: [
        { id: 'jn1', mood: 5, title: 'New personal best!', body: 'Hit a new PR at the gym today — definitely feeling the BPC-157 working. Energy levels through the roof. Also had a great call with a new prospect who is very interested in joining.', tags: ['product use','workout','business'], productsUsed: ['BPC-157 Complex'], date: '2026-08-08T07:00:00Z' },
        { id: 'jn2', mood: 4, title: 'Team check-in day', body: 'Weekly team call went well. Three members are close to rank advancement — gave them a push with some strategy tips from my Ingrid consultation. Sleep was great again using the Nordic formula.', tags: ['team','mindset'], productsUsed: ['Nordic Sleep Formula'], date: '2026-08-07T20:00:00Z' },
        { id: 'jn3', mood: 3, title: '', body: 'Slower day. Still a bit tired from the event last weekend but stayed consistent with my product stack. One prospect went quiet — will follow up tomorrow.', tags: ['business','product use'], productsUsed: ['BPC-157 Complex', 'GHK-Cu Serum'], date: '2026-08-06T21:00:00Z' },
        { id: 'jn4', mood: 4, title: 'Gold rank in sight', body: 'Two new sign-ups from the Instagram reel. Sales volume this week is tracking ahead of plan. If things keep going I could hit Gold before end of August — a month early!', tags: ['business','goal progress'], productsUsed: [], date: '2026-08-05T19:00:00Z' },
        { id: 'jn5', mood: 5, title: 'Recovery is unreal', body: 'Finished a tough 5-day training block and feeling completely recovered. The TB-500 + BPC stack is working better than I expected. Will mention this in my product testimonial post.', tags: ['workout','product use'], productsUsed: ['TB-500 Recovery', 'BPC-157 Complex'], date: '2026-08-04T18:00:00Z' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/journal')
}
export async function addMemberJournalEntry(data) {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return { id: `jn_${Date.now()}`, ...data, date: new Date().toISOString() }
  }
  return request('POST', '/v1/mlm/member/journal', data)
}
export async function deleteMemberJournalEntry(id) {
  if (MOCK) { await new Promise(r => setTimeout(r, 300)); return { ok: true } }
  return request('DELETE', `/v1/mlm/member/journal/${id}`)
}

// ── Member Referral Contests ──────────────────────────────────────────────────
export async function getMemberReferralContests() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      myActiveRank: 3,
      monthlyReferrals: 7,
      totalPrizesWon: 2,
      contests: [
        {
          id: 'rc1', name: 'August Recruitment Sprint', status: 'active',
          startDate: '2026-08-01T00:00:00Z', endDate: '2026-08-31T23:59:59Z',
          description: 'Refer the most new members in August and win exclusive prizes plus bonus PV.',
          myRank: 3, myReferrals: 7,
          prizes: [
            { place: '1st', prize: '€500 store credit + Diamond trip', minReferrals: 20 },
            { place: '2nd', prize: '€200 store credit + Gold badge', minReferrals: 12 },
            { place: '3rd', prize: '€100 store credit', minReferrals: 7 },
          ],
          leaderboard: [
            { rank: 1, name: 'Astrid Holm', referrals: 18, isMe: false },
            { rank: 2, name: 'Lars Eriksson', referrals: 12, isMe: false },
            { rank: 3, name: 'You', referrals: 7, isMe: true },
            { rank: 4, name: 'Freya Magnusson', referrals: 6, isMe: false },
            { rank: 5, name: 'Bjørn Haugen', referrals: 5, isMe: false },
          ]
        },
        {
          id: 'rc2', name: 'Nordic Summer Dash', status: 'upcoming',
          startDate: '2026-09-01T00:00:00Z', endDate: '2026-09-30T23:59:59Z',
          description: 'A fresh contest for September — highest referrers win exclusive NV merchandise and cash bonuses.',
          myRank: null, myReferrals: 0,
          prizes: [
            { place: '1st', prize: '€300 + NV Merchandise Pack', minReferrals: 15 },
            { place: '2nd', prize: '€150 store credit', minReferrals: 8 },
            { place: '3rd', prize: '€75 store credit', minReferrals: 5 },
          ],
          leaderboard: []
        },
        {
          id: 'rc3', name: 'Summer Launch Blitz', status: 'ended',
          startDate: '2026-07-01T00:00:00Z', endDate: '2026-07-31T23:59:59Z',
          description: 'The kickoff contest for the summer season.',
          myRank: 2, myReferrals: 11,
          prizes: [
            { place: '1st', prize: '€400 store credit', minReferrals: 15 },
            { place: '2nd', prize: '€150 store credit', minReferrals: 8 },
            { place: '3rd', prize: '€75 store credit', minReferrals: 5 },
          ],
          leaderboard: [
            { rank: 1, name: 'Astrid Holm', referrals: 21, isMe: false },
            { rank: 2, name: 'You', referrals: 11, isMe: true },
            { rank: 3, name: 'Freya Magnusson', referrals: 8, isMe: false },
          ]
        },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/referral-contests')
}

// ── Admin Back Orders ─────────────────────────────────────────────────────────
export async function getAdminBackOrders() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      customersWaiting: 34,
      avgWaitDays: 12,
      orders: [
        { id: 'bo1', orderId: 'ORD-7821', customerName: 'Astrid Holm', customerEmail: 'astrid@example.com', productName: 'BPC-157 Complex', sku: 'NV-BPC-250', qty: 2, orderDate: '2026-07-28T10:00:00Z', estRestock: '2026-08-15T00:00:00Z', status: 'pending' },
        { id: 'bo2', orderId: 'ORD-7845', customerName: 'Lars Eriksson', customerEmail: 'lars@example.com', productName: 'TB-500 Recovery', sku: 'NV-TB5-500', qty: 1, orderDate: '2026-07-30T14:00:00Z', estRestock: '2026-08-20T00:00:00Z', status: 'notified' },
        { id: 'bo3', orderId: 'ORD-7901', customerName: 'Freya Magnusson', customerEmail: 'freya@example.com', productName: 'Epitalon Longevity', sku: 'NV-EPT-10', qty: 3, orderDate: '2026-08-01T09:00:00Z', estRestock: null, status: 'pending' },
        { id: 'bo4', orderId: 'ORD-7912', customerName: 'Magnus Strand', customerEmail: 'magnus@example.com', productName: 'BPC-157 Complex', sku: 'NV-BPC-250', qty: 1, orderDate: '2026-08-03T11:00:00Z', estRestock: '2026-08-15T00:00:00Z', status: 'fulfilled' },
        { id: 'bo5', orderId: 'ORD-7950', customerName: 'Ingrid Dahl', customerEmail: 'ingrid@example.com', productName: 'GHK-Cu Serum', sku: 'NV-GHK-50', qty: 2, orderDate: '2026-08-05T16:00:00Z', estRestock: '2026-08-25T00:00:00Z', status: 'notified' },
        { id: 'bo6', orderId: 'ORD-7980', customerName: 'Bjørn Hagen', customerEmail: 'bjorn@example.com', productName: 'Selank Peptide', sku: 'NV-SEL-5', qty: 1, orderDate: '2026-08-07T08:00:00Z', estRestock: null, status: 'cancelled' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/back-orders')
}

// ── Admin Upsell Rules ────────────────────────────────────────────────────────
export async function getAdminUpsellRules() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    return {
      triggeredCount: 1842,
      conversions: 312,
      revenueAttributed: 18640,
      rules: [
        { id: 'ur1', name: 'BPC-157 → TB-500 Cross-sell', type: 'crosssell', triggerProduct: 'BPC-157 Complex', recommendProduct: 'TB-500 Recovery', placement: 'Product page', impressions: 620, conversions: 98, cvr: 15.8, active: true },
        { id: 'ur2', name: 'Single dose → Bundle upsell', type: 'bundle', triggerProduct: 'BPC-157 Complex (1 vial)', recommendProduct: 'BPC-157 Starter Bundle', placement: 'Cart', impressions: 445, conversions: 67, cvr: 15.1, active: true },
        { id: 'ur3', name: 'GHK-Cu → Epitalon upsell', type: 'upsell', triggerProduct: 'GHK-Cu Serum', recommendProduct: 'Epitalon Longevity', placement: 'Checkout', impressions: 310, conversions: 41, cvr: 13.2, active: true },
        { id: 'ur4', name: 'Any peptide → Nordic Stack bundle', type: 'bundle', triggerProduct: 'Any peptide product', recommendProduct: 'Nordic Full Stack', placement: 'Post-purchase', impressions: 280, conversions: 28, cvr: 10.0, active: false },
        { id: 'ur5', name: 'KPV → Selank cross-sell', type: 'crosssell', triggerProduct: 'KPV Anti-Inflammatory', recommendProduct: 'Selank Peptide', placement: 'Product page', impressions: 187, conversions: 18, cvr: 9.6, active: true },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/upsell-rules')
}

// ── Admin Reward Catalog ──────────────────────────────────────────────────────
export async function getAdminRewardCatalog() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      redemptions30d: 47,
      pointsRedeemed30d: 186400,
      items: [
        { id: 'rc1', name: 'Nordic Vitals Branded Hoodie', category: 'physical', description: 'Premium organic cotton hoodie with NV logo', pointsCost: 5000, stock: 50, redeemCount: 12, active: true, emoji: '👕' },
        { id: 'rc2', name: '€50 Store Credit', category: 'digital', description: 'Instant store credit added to your account', pointsCost: 4000, stock: null, redeemCount: 31, active: true, emoji: '💳' },
        { id: 'rc3', name: 'Nordic Wellness Retreat (2 nights)', category: 'experience', description: 'Two nights at a partner wellness spa in Norway', pointsCost: 25000, stock: 5, redeemCount: 2, active: true, emoji: '🌿' },
        { id: 'rc4', name: 'Shaker Bottle Set', category: 'physical', description: 'Premium stainless steel NV shaker + storage', pointsCost: 2000, stock: 120, redeemCount: 18, active: true, emoji: '🥤' },
        { id: 'rc5', name: 'Advanced Peptide Course', category: 'digital', description: 'Full access to the Advanced Peptide Science e-learning course', pointsCost: 6000, stock: null, redeemCount: 8, active: true, emoji: '🎓' },
        { id: 'rc6', name: 'Copenhagen Conference Ticket', category: 'travel', description: 'Complimentary ticket to NV Annual Conference in Copenhagen', pointsCost: 40000, stock: 20, redeemCount: 1, active: false, emoji: '✈️' },
        { id: 'rc7', name: 'NV Notebook + Pen Set', category: 'physical', description: 'Luxury branded stationery for business and journaling', pointsCost: 1500, stock: 200, redeemCount: 22, active: true, emoji: '📓' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/reward-catalog')
}

// ── Admin Retention Offers ────────────────────────────────────────────────────
export async function getAdminRetentionOffers() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 380))
    return {
      shown30d: 84,
      saved30d: 31,
      saveRate: 36.9,
      offers: [
        { id: 'ro1', name: 'Cancel — 25% discount', trigger: 'cancel', offerType: 'discount', headline: "Wait! We'd hate to see you go.", description: "Stay for the next 3 months and get 25% off your subscription — no commitment after that.", offerValue: '25% off 3 months', expiresAfterDays: 2, priority: 1, shown: 42, accepted: 16, saveRate: 38.1, active: true },
        { id: 'ro2', name: 'Cancel — €30 store credit', trigger: 'cancel', offerType: 'credit', headline: 'A gift, just for staying.', description: '€30 store credit added instantly to your account when you keep your subscription active.', offerValue: '€30 credit', expiresAfterDays: 1, priority: 2, shown: 28, accepted: 9, saveRate: 32.1, active: true },
        { id: 'ro3', name: 'Pause — 1-month pause offer', trigger: 'pause', offerType: 'extension', headline: 'Life happens — take a break instead.', description: 'Pause your subscription for 30 days at no charge. Resume whenever you\'re ready.', offerValue: 'Free 30-day pause', expiresAfterDays: null, priority: 1, shown: 14, accepted: 6, saveRate: 42.9, active: true },
        { id: 'ro4', name: 'Expire — win-back free gift', trigger: 'expire', offerType: 'gift', headline: 'Come back — we miss you!', description: 'Renew today and receive a free NV Shaker Bottle with your next order.', offerValue: 'Free Shaker Bottle', expiresAfterDays: 7, priority: 1, shown: 0, accepted: 0, saveRate: 0, active: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/retention-offers')
}

// ── Member Body Measurements ──────────────────────────────────────────────────
export async function getMemberBodyMeasurements() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 380))
    return {
      history: [
        { date: '2026-08-09T07:00:00Z', weight: 83.2, waist: 88, hips: 97, chest: 104, bodyFat: 18.1, muscle: 68.2, note: 'Week 8 check-in' },
        { date: '2026-07-26T07:00:00Z', weight: 84.0, waist: 89, hips: 98, chest: 105, bodyFat: 18.8, muscle: 67.9, note: 'Week 6 check-in' },
        { date: '2026-07-12T07:00:00Z', weight: 85.1, waist: 91, hips: 99, chest: 105, bodyFat: 19.4, muscle: 67.5, note: '' },
        { date: '2026-06-28T07:00:00Z', weight: 85.8, waist: 92, hips: 100, chest: 106, bodyFat: 20.1, muscle: 67.2, note: 'Start of peptide protocol' },
        { date: '2026-06-14T07:00:00Z', weight: 86.4, waist: 93, hips: 101, chest: 107, bodyFat: 20.8, muscle: 67.0, note: 'Baseline' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/body-measurements')
}

// ── Member Supplement Stack ───────────────────────────────────────────────────
export async function getMemberSupplementStack() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 350))
    return {
      protocolActive: true,
      daysRunning: 58,
      stack: [
        { id: 'ss1', productName: 'BPC-157 Complex', dosage: '250mcg', dosesPerDay: 2, timing: 'Morning', notes: 'Subcutaneous injection, fasted', emoji: '💉' },
        { id: 'ss2', productName: 'BPC-157 Complex', dosage: '250mcg', dosesPerDay: 2, timing: 'Evening', notes: 'Before meal', emoji: '💉' },
        { id: 'ss3', productName: 'TB-500 Recovery', dosage: '2.5mg', dosesPerDay: 1, timing: 'Morning', notes: 'Weekly dose — inject Monday morning', emoji: '🩹' },
        { id: 'ss4', productName: 'GHK-Cu Serum', dosage: '1 pump', dosesPerDay: 1, timing: 'Morning', notes: 'Apply to face and neck post-shower', emoji: '🧴' },
        { id: 'ss5', productName: 'KPV Anti-Inflammatory', dosage: '500mcg', dosesPerDay: 1, timing: 'Pre-workout', notes: 'Mix with 1ml bacteriostatic water', emoji: '💊' },
        { id: 'ss6', productName: 'Epitalon Longevity', dosage: '5mg', dosesPerDay: 1, timing: 'Before bed', notes: '10-day cycle, repeat monthly', emoji: '⭐' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/supplement-stack')
}

// ── Member Progress Photos ────────────────────────────────────────────────────
export async function getMemberProgressPhotos() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 400))
    return {
      streakWeeks: 8,
      entries: [
        { id: 'pp1', date: '2026-08-09T08:00:00Z', view: 'front', week: 8, weight: 83.2, notes: 'Visible change in midsection' },
        { id: 'pp2', date: '2026-07-26T08:00:00Z', view: 'front', week: 6, weight: 84.0, notes: 'Arms looking more defined' },
        { id: 'pp3', date: '2026-07-12T08:00:00Z', view: 'front', week: 4, weight: 85.1, notes: '' },
        { id: 'pp4', date: '2026-06-28T08:00:00Z', view: 'front', week: 2, weight: 85.8, notes: 'Start of protocol' },
        { id: 'pp5', date: '2026-08-09T08:10:00Z', view: 'side', week: 8, weight: 83.2, notes: 'Posture also improved' },
        { id: 'pp6', date: '2026-07-26T08:10:00Z', view: 'side', week: 6, weight: 84.0, notes: '' },
        { id: 'pp7', date: '2026-08-09T08:15:00Z', view: 'back', week: 8, weight: 83.2, notes: '' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/progress-photos')
}

// ── Member Goal Buddy ─────────────────────────────────────────────────────────
export async function getMemberGoalBuddy() {
  if (MOCK) {
    await new Promise(r => setTimeout(r, 420))
    return {
      buddy: {
        id: 'b1', name: 'Freya Magnusson', rank: 'Gold', location: 'Bergen, NO',
        checkins: 8, goalsMet: 3,
      },
      sharedGoals: [
        { id: 'sg1', title: 'Reach Silver rank by Sep 1', deadline: '2026-09-01T00:00:00Z', myProgress: 72, buddyProgress: 85, status: 'on_track' },
        { id: 'sg2', title: 'Recruit 5 new members in August', deadline: '2026-08-31T00:00:00Z', myProgress: 60, buddyProgress: 40, status: 'on_track' },
        { id: 'sg3', title: 'Complete Peptide Science course', deadline: '2026-08-15T00:00:00Z', myProgress: 100, buddyProgress: 100, status: 'completed' },
        { id: 'sg4', title: 'Hit €2,000 monthly volume', deadline: '2026-08-31T00:00:00Z', myProgress: 38, buddyProgress: 55, status: 'behind' },
      ],
      checkins: [
        { date: '2026-08-08T09:00:00Z', status: 'on_track', mood: 'good', author: 'me' },
        { date: '2026-08-07T11:00:00Z', status: 'on_track', mood: 'ok', author: 'buddy' },
        { date: '2026-08-01T09:00:00Z', status: 'on_track', mood: 'good', author: 'me' },
        { date: '2026-07-25T10:00:00Z', status: 'behind', mood: 'ok', author: 'me' },
      ],
      messages: [
        { text: 'Great work hitting the course goal! 🎉', date: '2026-08-08T10:15:00Z', author: 'buddy' },
        { text: 'Thanks! You too — your recruit count is impressive 💪', date: '2026-08-08T10:22:00Z', author: 'me' },
        { text: 'Volume goal is going to be tough this month. How are you sourcing leads?', date: '2026-08-07T14:00:00Z', author: 'buddy' },
        { text: 'Mostly Instagram Reels and local gym partnerships. DM me and I\'ll share the script.', date: '2026-08-07T14:30:00Z', author: 'me' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/goal-buddy')
}

export async function getAdminOrderRouting() {
  if (USE_MOCK) {
    return {
      routed7d: 1243, fallbackRate: 4.2, fallbackWarehouse: 'Oslo Central',
      warehouses: [
        { id: 1, name: 'Oslo Central', location: 'Norway', active: true, pendingOrders: 38 },
        { id: 2, name: 'Stockholm Hub', location: 'Sweden', active: true, pendingOrders: 22 },
        { id: 3, name: 'Hamburg EU', location: 'Germany', active: true, pendingOrders: 17 },
        { id: 4, name: 'UK Fulfilment', location: 'United Kingdom', active: false, pendingOrders: 0 },
      ],
      rules: [
        { id: 1, name: 'Nordic Countries', status: 'active', priority: 'high', warehouse: 'Oslo Central', conditions: ['country=NO,SE,DK,FI'], ordersRouted: 621, avgFulfillHours: 18 },
        { id: 2, name: 'EU Zone', status: 'active', priority: 'medium', warehouse: 'Hamburg EU', conditions: ['country=DE,NL,BE,FR,AT'], ordersRouted: 289, avgFulfillHours: 28 },
        { id: 3, name: 'UK Orders', status: 'inactive', priority: 'high', warehouse: 'UK Fulfilment', conditions: ['country=GB'], ordersRouted: 0, avgFulfillHours: 0 },
        { id: 4, name: 'Heavy Shipments', status: 'active', priority: 'high', warehouse: 'Oslo Central', conditions: ['weight>10kg', 'country=NO'], ordersRouted: 54, avgFulfillHours: 22 },
        { id: 5, name: 'Express Peptide', status: 'draft', priority: 'high', warehouse: 'Oslo Central', conditions: ['product_type=peptide', 'shipping=express'], ordersRouted: 0, avgFulfillHours: 0 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/order-routing')
}

export async function getAdminBundleBuilder() {
  if (USE_MOCK) {
    return {
      products: [
        { id: 1, name: 'BPC-157 10mg', price: 490, cost: 120, pv: 25, stock: 142 },
        { id: 2, name: 'Collagen Peptide 500g', price: 395, cost: 90, pv: 20, stock: 88 },
        { id: 3, name: 'TB-500 5mg', price: 620, cost: 150, pv: 30, stock: 67 },
        { id: 4, name: 'Sermorelin 2mg', price: 540, cost: 130, pv: 27, stock: 55 },
        { id: 5, name: 'AOD-9604 5mg', price: 480, cost: 110, pv: 24, stock: 99 },
        { id: 6, name: 'CJC-1295 2mg', price: 510, cost: 125, pv: 26, stock: 73 },
        { id: 7, name: 'Marine Collagen 300g', price: 320, cost: 75, pv: 16, stock: 120 },
        { id: 8, name: 'Ipamorelin 5mg', price: 530, cost: 128, pv: 26, stock: 61 },
      ],
      savedBundles: [
        { id: 1, name: 'Starter Pack Pro', items: 3, discount: 15, price: 1162, active: true, sold: 87, productNames: ['BPC-157', 'Collagen', 'TB-500'] },
        { id: 2, name: 'Recovery Bundle', items: 2, discount: 10, price: 980, active: true, sold: 45, productNames: ['BPC-157', 'TB-500'] },
        { id: 3, name: 'Anti-Age Stack', items: 4, discount: 20, price: 1496, active: false, sold: 12, productNames: ['Sermorelin', 'AOD-9604', 'Collagen', 'Marine Collagen'] },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/bundle-builder')
}

export async function getAdminReferralCampaigns() {
  if (USE_MOCK) {
    return {
      totalReferrals: 312, bonusesPaid: 48600, conversionRate: 34.2,
      campaigns: [
        { id: 1, name: 'Summer Boost 2026', status: 'active', type: 'bonus_cash', description: 'Earn NOK 300 for every new member enrolled this summer.', startDate: '2026-06-01', endDate: '2026-08-31', eligibility: 'All members', enrolled: 182, referred: 89, converted: 31, bonusPerRef: 300 },
        { id: 2, name: 'Double-Up July', status: 'ended', type: 'double_points', description: 'All referral points doubled for the month of July.', startDate: '2026-07-01', endDate: '2026-07-31', eligibility: 'Gold+ members', enrolled: 94, referred: 62, converted: 18, bonusPerRef: 0 },
        { id: 3, name: 'Fall Launch Blast', status: 'scheduled', type: 'gift', description: 'Refer 3+ members and receive an exclusive Nordic Vitals gift box.', startDate: '2026-09-01', endDate: '2026-09-30', eligibility: 'All members', enrolled: 0, referred: 0, converted: 0, bonusPerRef: 0 },
        { id: 4, name: 'VIP Tier Skip', status: 'draft', type: 'tier_skip', description: 'Top recruiter of the month jumps directly to the next rank tier.', startDate: '2026-10-01', endDate: '2026-10-31', eligibility: 'Silver+ members', enrolled: 0, referred: 0, converted: 0, bonusPerRef: 0 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/referral-campaigns')
}

export async function getAdminNetworkSnapshot() {
  if (USE_MOCK) {
    const makeSnapshot = (id, label, date, memberBase, volBase) => ({
      id, label, capturedAt: date,
      totalMembers: memberBase,
      activeMembers: Math.round(memberBase * 0.61),
      newMembers30d: Math.round(memberBase * 0.04),
      totalVolume: volBase,
      avgDepth: 4.2,
      rankPromotions30d: Math.round(memberBase * 0.012),
      rankDistribution: [
        { rank: 'Starter', count: Math.round(memberBase * 0.42), pct: 42 },
        { rank: 'Bronze', count: Math.round(memberBase * 0.28), pct: 28 },
        { rank: 'Silver', count: Math.round(memberBase * 0.16), pct: 16 },
        { rank: 'Gold', count: Math.round(memberBase * 0.09), pct: 9 },
        { rank: 'Platinum', count: Math.round(memberBase * 0.04), pct: 4 },
        { rank: 'Diamond', count: Math.round(memberBase * 0.01), pct: 1 },
      ],
      topRecruiters: [
        { name: 'Ingrid H.', recruited: 14 },
        { name: 'Lars M.', recruited: 11 },
        { name: 'Sofia K.', recruited: 9 },
        { name: 'Erik B.', recruited: 7 },
        { name: 'Anna W.', recruited: 6 },
      ]
    })
    return {
      snapshots: [
        makeSnapshot(1, 'August 2026 (latest)', '2026-08-09', 2847, 4218000),
        makeSnapshot(2, 'July 2026', '2026-07-01', 2704, 3980000),
        makeSnapshot(3, 'Q2 End (June)', '2026-06-30', 2531, 3621000),
        makeSnapshot(4, 'Pre-launch baseline', '2026-05-01', 1892, 2210000),
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/network-snapshot')
}

export async function getMemberKitBuilder() {
  if (USE_MOCK) {
    return {
      products: [
        { id: 1, name: 'BPC-157 10mg', price: 490, pv: 25 },
        { id: 2, name: 'Collagen Peptide 500g', price: 395, pv: 20 },
        { id: 3, name: 'TB-500 5mg', price: 620, pv: 30 },
        { id: 4, name: 'Sermorelin 2mg', price: 540, pv: 27 },
        { id: 5, name: 'AOD-9604 5mg', price: 480, pv: 24 },
        { id: 6, name: 'Marine Collagen 300g', price: 320, pv: 16 },
        { id: 7, name: 'Ipamorelin 5mg', price: 530, pv: 26 },
        { id: 8, name: 'CJC-1295 2mg', price: 510, pv: 26 },
      ],
      savedKits: [
        { id: 1, name: 'My Starter Rec', items: 3, total: 1505 },
        { id: 2, name: 'Recovery Stack', items: 2, total: 1110 },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/kit-builder')
}

export async function getMemberWinLog() {
  if (USE_MOCK) {
    return {
      thisMonth: 4, streak: 7, sharedCount: 3,
      wins: [
        { id: 1, emoji: '🏆', tag: 'recruitment', text: 'Enrolled my first customer today — she bought the Collagen + BPC-157 starter pack. Paid for itself in one week!', impact: '+1 customer, NOK 885 volume', date: '2026-08-09', shared: false },
        { id: 2, emoji: '💰', tag: 'income', text: 'Commission cheque cleared this morning — NOK 3,200 from team volume. Best month yet!', impact: '+NOK 3,200', date: '2026-08-05', shared: true },
        { id: 3, emoji: '📈', tag: 'sales', text: 'Hit Silver rank for the first time. The system updated instantly — seeing the badge in my profile feels incredible.', impact: 'Rank up to Silver', date: '2026-08-02', shared: true },
        { id: 4, emoji: '👥', tag: 'recruitment', text: 'My downline grew to 10 active members. Six months ago I had zero. Consistency compounds!', impact: '+10 team members', date: '2026-07-28', shared: false },
        { id: 5, emoji: '🌿', tag: 'wellness', text: 'Week 4 of BPC-157 protocol. Knee inflammation down significantly — personal win that fuels how I sell this.', impact: 'Personal wellness milestone', date: '2026-07-20', shared: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/win-log')
}

export async function getMemberAiInsights() {
  if (USE_MOCK) {
    return {
      estImpactPct: 22, lastAnalysed: 'Today 06:12',
      performanceSummary: 'Your sales volume is up 18% vs last month and your recruitment pace is on track for a Gold rank by October. One area to watch: 3 of your team members have been dormant for 14+ days — a quick check-in could reactivate them before end-of-month cutoff.',
      trendChart: { values: [12,15,11,18,14,19,22,17,24,26,21,28,25,30,27,32,29,35,31,36,33,38,35,40,37,42,38,44,41,46] },
      insights: [
        { id: 1, priority: 'high', type: 'retention', title: 'Dormant Team Risk', body: '3 of your 10 frontline members haven\'t logged in for 14+ days. Based on past patterns, members dormant for 21+ days churn at 68%. A check-in now could save your month-end volume.', action: 'Send a personal message to Lars M., Ingrid H., and Sofia K. using the Team Chat tool.', metric: { current: '3 dormant', target: '0 dormant', gain: '+NOK 1,200 volume' } },
        { id: 2, priority: 'high', type: 'income', title: 'Rank Promotion Window', body: 'You are NOK 4,200 in personal volume away from Gold rank this month. With 22 days left, reaching this target requires NOK 191/day — very achievable based on your recent pace.', action: 'Focus on personal orders or 2-3 additional customer sales before month end.', metric: { current: 'NOK 9,800 PV', target: 'NOK 14,000 PV', gain: '+25% commission rate' } },
        { id: 3, priority: 'medium', type: 'product', title: 'BPC-157 Reorder Pattern', body: 'Customers who buy BPC-157 tend to reorder within 28 days. 4 of your customers are now past day 25. A timely reminder could capture these reorders before they go elsewhere.', action: 'Use the Team Broadcast tool to send a reorder reminder to qualifying customers.', metric: { current: '4 customers at-risk', target: '4 reorders secured', gain: 'NOK 1,960 volume' } },
        { id: 4, priority: 'medium', type: 'recruitment', title: 'Referral Campaign Momentum', body: 'The Summer Boost campaign ends in 22 days. Your current referral conversion rate (34%) is above team average (28%). Doubling down now could earn an additional NOK 2,100 in bonuses.', action: 'Share your referral link via the Content Planner with 3 posts this week.', metric: { current: '3 referrals', target: '10 referrals', gain: 'NOK 2,100 bonus' } },
        { id: 5, priority: 'low', type: 'growth', title: 'Profile Completeness', body: 'Your member profile is 72% complete. Members with complete profiles get 2.4× more inbound inquiries via the referral landing page.', action: 'Add your bio, product testimonial, and profile photo in the Profile section.', metric: null },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/ai-insights')
}

export async function getMemberContentPlanner() {
  if (USE_MOCK) {
    return {
      streak: 5,
      posts: [
        { id: 1, platform: 'instagram', type: 'product', caption: 'Starting my BPC-157 protocol today — 4 weeks, daily updates. Who else is on a peptide journey? 💊', hashtags: '#BPC157 #peptides #nordicvitals #wellness', day: 1, published: true },
        { id: 2, platform: 'tiktok', type: 'education', caption: 'What is BPC-157 and why is everyone talking about it? Quick explainer 👇', hashtags: '#peptidescience #healthtips #nordicvitals', day: 3, published: true },
        { id: 3, platform: 'facebook', type: 'testimonial', caption: 'Week 2 update — knee inflammation noticeably down. Here\'s what I\'ve been doing...', hashtags: '#peptidetherapy #recovery', day: 7, published: false },
        { id: 4, platform: 'instagram', type: 'recruitment', caption: 'Want to earn while helping people with their health goals? DM me "VITALS" 🌿', hashtags: '#mlm #healthbusiness #nordicvitals', day: 10, published: false },
        { id: 5, platform: 'tiktok', type: 'personal', caption: 'My morning protocol — collagen, BPC-157, and 10 minutes of sunlight. Simple but powerful.', hashtags: '#morningroutine #wellness', day: 14, published: false },
        { id: 6, platform: 'instagram', type: 'promo', caption: '🚨 LAST CHANCE: Summer Boost referral campaign ends this month. Earn NOK 300 per new member!', hashtags: '#nordicvitals #referral #summer', day: 20, published: false },
        { id: 7, platform: 'youtube', type: 'education', caption: 'Full video: 30 days on peptides — honest results, bloodwork, and what I\'d change', hashtags: '#peptides30days #biohacking', day: 28, published: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/content-planner')
}

export async function getAdminLocalization() {
  if (USE_MOCK) {
    return {
      defaultLocale: 'nb-NO',
      languages: [
        { code: 'nb', name: 'Norwegian Bokmål', nativeName: 'Norsk Bokmål', flag: '🇳🇴', active: true, isDefault: true, coverage: 100 },
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', active: true, isDefault: false, coverage: 98 },
        { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', active: true, isDefault: false, coverage: 82 },
        { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', active: true, isDefault: false, coverage: 75 },
        { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', active: false, isDefault: false, coverage: 40 },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', active: false, isDefault: false, coverage: 20 },
      ],
      currencies: [
        { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 1, decimals: 2, active: true, isDefault: true, rateUpdated: '2026-08-09' },
        { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.087, decimals: 2, active: true, isDefault: false, rateUpdated: '2026-08-09' },
        { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 0.96, decimals: 2, active: true, isDefault: false, rateUpdated: '2026-08-09' },
        { code: 'DKK', name: 'Danish Krone', symbol: 'kr', rate: 0.65, decimals: 2, active: true, isDefault: false, rateUpdated: '2026-08-09' },
        { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.093, decimals: 2, active: false, isDefault: false, rateUpdated: '2026-08-08' },
        { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.073, decimals: 2, active: false, isDefault: false, rateUpdated: '2026-08-08' },
      ],
      timezones: [
        { id: 'tz1', label: 'Europe/Oslo', offset: 'UTC+2', region: 'Northern Europe', memberCount: 1842, isDefault: true },
        { id: 'tz2', label: 'Europe/Stockholm', offset: 'UTC+2', region: 'Northern Europe', memberCount: 341, isDefault: false },
        { id: 'tz3', label: 'Europe/Copenhagen', offset: 'UTC+2', region: 'Northern Europe', memberCount: 198, isDefault: false },
        { id: 'tz4', label: 'Europe/Helsinki', offset: 'UTC+3', region: 'Northern Europe', memberCount: 74, isDefault: false },
        { id: 'tz5', label: 'Europe/London', offset: 'UTC+1', region: 'Western Europe', memberCount: 53, isDefault: false },
        { id: 'tz6', label: 'America/New_York', offset: 'UTC-4', region: 'North America', memberCount: 21, isDefault: false },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/localization')
}

export async function getAdminOnboardingFlows() {
  if (USE_MOCK) {
    return {
      avgCompletion: 71,
      inProgress: 234,
      completed30d: 189,
      flows: [
        {
          id: 'flow1', name: 'Standard Member Onboarding', description: 'Default 6-step flow for new members', active: true, completionRate: 74,
          steps: [
            { id: 's1', title: 'Profile Setup', type: 'welcome', description: 'Complete basic profile info, photo, and bio', required: true, completionRate: 98, avgMinutes: 5, skipAllowed: false },
            { id: 's2', title: 'KYC Verification', type: 'kyc', description: 'Upload ID and verify identity for compliance', required: true, completionRate: 82, avgMinutes: 12, skipAllowed: false },
            { id: 's3', title: 'Welcome Training Module', type: 'training', description: 'Watch intro video and complete knowledge check', required: false, completionRate: 71, avgMinutes: 20, skipAllowed: true },
            { id: 's4', title: 'Product Exploration', type: 'product', description: 'Browse catalog, add favourites, learn about peptides', required: false, completionRate: 68, avgMinutes: 8, skipAllowed: true },
            { id: 's5', title: 'First Autoship Setup', type: 'activation', description: 'Configure monthly autoship for recurring orders', required: false, completionRate: 55, avgMinutes: 6, skipAllowed: true },
            { id: 's6', title: 'Referral Link Activation', type: 'activation', description: 'Generate and share your unique referral link', required: false, completionRate: 49, avgMinutes: 3, skipAllowed: true },
          ]
        },
        {
          id: 'flow2', name: 'VIP Fast-Track', description: 'Streamlined 3-step flow for high-intent members', active: true, completionRate: 91,
          steps: [
            { id: 's1', title: 'Profile + KYC Combined', type: 'kyc', description: 'Single-step profile and identity verification', required: true, completionRate: 97, avgMinutes: 8, skipAllowed: false },
            { id: 's2', title: 'VIP Welcome Call Booking', type: 'welcome', description: 'Book 1:1 onboarding call with your upline', required: false, completionRate: 88, avgMinutes: 3, skipAllowed: true },
            { id: 's3', title: 'Starter Kit Order', type: 'product', description: 'Order your recommended starter kit at VIP discount', required: false, completionRate: 79, avgMinutes: 5, skipAllowed: true },
          ]
        },
        {
          id: 'flow3', name: 'Distributor Activation', description: 'Extended flow for members applying for distributor status', active: false, completionRate: 62,
          steps: [
            { id: 's1', title: 'Standard Onboarding', type: 'welcome', description: 'Complete standard member onboarding first', required: true, completionRate: 74, avgMinutes: 54, skipAllowed: false },
            { id: 's2', title: 'Business Plan Submission', type: 'training', description: 'Submit your 90-day business plan', required: true, completionRate: 58, avgMinutes: 30, skipAllowed: false },
          ]
        }
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/onboarding-flows')
}

export async function getAdminMemberTags() {
  if (USE_MOCK) {
    return {
      taggedMembers: 1654,
      avgTagsPerMember: 3.2,
      tags: [
        { id: 't1', name: 'high-value', description: 'Members with LTV > NOK 20,000', category: 'behavioral', color: '#86efac', autoAssign: true, rule: 'LTV > 20000', memberCount: 312, createdAt: '2026-02-10' },
        { id: 't2', name: 'at-risk-churn', description: 'No purchase in 60+ days on active subscription', category: 'risk', color: '#f87171', autoAssign: true, rule: 'days_since_order > 60 AND has_subscription', memberCount: 87, createdAt: '2026-03-01' },
        { id: 't3', name: 'top-recruiter', description: 'Added 5+ members in last 90 days', category: 'behavioral', color: '#93c5fd', autoAssign: true, rule: 'recruits_90d >= 5', memberCount: 44, createdAt: '2026-01-15' },
        { id: 't4', name: 'peptide-enthusiast', description: 'Purchased 3+ different peptide SKUs', category: 'product', color: '#818cf8', autoAssign: true, rule: 'distinct_peptide_skus >= 3', memberCount: 531, createdAt: '2026-02-20' },
        { id: 't5', name: 'new-member', description: 'Joined in last 30 days', category: 'lifecycle', color: '#fbbf24', autoAssign: true, rule: 'days_since_join <= 30', memberCount: 189, createdAt: '2026-01-01' },
        { id: 't6', name: 'autoship-active', description: 'Currently on an active autoship plan', category: 'lifecycle', color: '#86efac', autoAssign: true, rule: 'has_active_autoship', memberCount: 876, createdAt: '2026-01-01' },
        { id: 't7', name: 'vip-prospect', description: 'Manually tagged by upline as VIP candidate', category: 'custom', color: '#c4b5fd', autoAssign: false, rule: null, memberCount: 23, createdAt: '2026-04-05' },
        { id: 't8', name: 'wellness-focus', description: 'Primarily purchases wellness/recovery products', category: 'product', color: '#86efac', autoAssign: false, rule: null, memberCount: 298, createdAt: '2026-03-12' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/member-tags')
}

export async function getAdminSmartNotifications() {
  if (USE_MOCK) {
    return {
      openRate: 38,
      clickRate: 12,
      sent30d: 14820,
      rules: [
        { id: 'r1', name: 'Cart Abandonment Rescue', triggerType: 'behavioral', triggerCondition: 'Member adds to cart but does not checkout within 2 hours', messagePreview: 'You left something behind! Your cart is saved — complete your order and get free shipping.', channels: ['email', 'push'], active: true, sent30d: 2340, openRate: 44, clickRate: 18, unsubRate: 0.4, delay: '2 hours' },
        { id: 'r2', name: 'Rank-Up Congratulations', triggerType: 'milestone', triggerCondition: 'Member achieves a new rank', messagePreview: 'Congratulations on reaching {{rank}}! Here\'s what unlocks at your new level.', channels: ['email', 'inApp', 'push'], active: true, sent30d: 156, openRate: 81, clickRate: 42, unsubRate: 0.1, delay: 'immediate' },
        { id: 'r3', name: 'Autoship Upcoming Reminder', triggerType: 'time', triggerCondition: '7 days before next autoship renewal', messagePreview: 'Your autoship order of {{products}} ships in 7 days. Want to adjust?', channels: ['email', 'sms'], active: true, sent30d: 1890, openRate: 62, clickRate: 28, unsubRate: 0.2, delay: 'on trigger' },
        { id: 'r4', name: 'Inactivity Win-Back', triggerType: 'inactivity', triggerCondition: 'No login for 45 days', messagePreview: 'We miss you! Here\'s what\'s new in your business dashboard + a 10% welcome back voucher.', channels: ['email'], active: true, sent30d: 423, openRate: 29, clickRate: 8, unsubRate: 1.1, delay: 'on trigger' },
        { id: 'r5', name: 'First Purchase Thank-You', triggerType: 'purchase', triggerCondition: 'Member places their very first order', messagePreview: 'Thank you for your first order! Here\'s your quick-start guide to peptides.', channels: ['email', 'inApp'], active: true, sent30d: 189, openRate: 74, clickRate: 35, unsubRate: 0.0, delay: '1 hour' },
        { id: 'r6', name: 'Birthday Reward', triggerType: 'time', triggerCondition: 'Member\'s birthday (date of birth in profile)', messagePreview: 'Happy Birthday from Nordic Vitals! Enjoy 15% off your next order — gift from us.', channels: ['email', 'push'], active: false, sent30d: 0, openRate: 0, clickRate: 0, unsubRate: 0, delay: 'morning of' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/smart-notifications')
}

export async function getMemberIncomeForecast() {
  if (USE_MOCK) {
    return {
      currentRank: 'Silver',
      thisMonthEst: 'NOK 4,200',
      nextRankBonus: 'NOK 2,500',
      teamVolume: 'NOK 38,400',
      scenarios: {
        conservative: {
          monthly: [
            { label: 'Aug', personal: 2100, team: 1800, total: 3900, totalFormatted: 'kr 3.9k' },
            { label: 'Sep', personal: 2200, team: 2000, total: 4200, totalFormatted: 'kr 4.2k' },
            { label: 'Oct', personal: 2300, team: 2100, total: 4400, totalFormatted: 'kr 4.4k' },
            { label: 'Nov', personal: 2400, team: 2200, total: 4600, totalFormatted: 'kr 4.6k' },
            { label: 'Dec', personal: 2500, team: 2400, total: 4900, totalFormatted: 'kr 4.9k' },
            { label: 'Jan', personal: 2400, team: 2300, total: 4700, totalFormatted: 'kr 4.7k' },
          ],
          assumptions: [
            { label: 'Personal Volume Growth', value: '5% / month' },
            { label: 'Team Recruit Rate', value: '0.5 / month' },
            { label: 'Retention Rate', value: '85%' },
            { label: 'Autoship Compliance', value: '70%' },
          ]
        },
        realistic: {
          monthly: [
            { label: 'Aug', personal: 2600, team: 2200, total: 4800, totalFormatted: 'kr 4.8k' },
            { label: 'Sep', personal: 2900, team: 2600, total: 5500, totalFormatted: 'kr 5.5k' },
            { label: 'Oct', personal: 3200, team: 3000, total: 6200, totalFormatted: 'kr 6.2k' },
            { label: 'Nov', personal: 3500, team: 3500, total: 7000, totalFormatted: 'kr 7.0k' },
            { label: 'Dec', personal: 4000, team: 4200, total: 8200, totalFormatted: 'kr 8.2k' },
            { label: 'Jan', personal: 3600, team: 3800, total: 7400, totalFormatted: 'kr 7.4k' },
          ],
          assumptions: [
            { label: 'Personal Volume Growth', value: '12% / month' },
            { label: 'Team Recruit Rate', value: '1.5 / month' },
            { label: 'Retention Rate', value: '90%' },
            { label: 'Autoship Compliance', value: '80%' },
          ]
        },
        optimistic: {
          monthly: [
            { label: 'Aug', personal: 3200, team: 3000, total: 6200, totalFormatted: 'kr 6.2k' },
            { label: 'Sep', personal: 3800, team: 3800, total: 7600, totalFormatted: 'kr 7.6k' },
            { label: 'Oct', personal: 4500, team: 5000, total: 9500, totalFormatted: 'kr 9.5k' },
            { label: 'Nov', personal: 5200, team: 6500, total: 11700, totalFormatted: 'kr 11.7k' },
            { label: 'Dec', personal: 6000, team: 8000, total: 14000, totalFormatted: 'kr 14k' },
            { label: 'Jan', personal: 5500, team: 7000, total: 12500, totalFormatted: 'kr 12.5k' },
          ],
          assumptions: [
            { label: 'Personal Volume Growth', value: '22% / month' },
            { label: 'Team Recruit Rate', value: '3+ / month' },
            { label: 'Retention Rate', value: '95%' },
            { label: 'Autoship Compliance', value: '90%' },
          ]
        }
      },
      milestones: [
        { amount: 'NOK 5,000/mo', progress: 84, reached: false, eta: '~1 month' },
        { amount: 'NOK 10,000/mo', progress: 42, reached: false, eta: '~3 months' },
        { amount: 'NOK 25,000/mo', progress: 17, reached: false, eta: '~9 months' },
        { amount: 'NOK 50,000/mo', progress: 8, reached: false, eta: '~18 months' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/income-forecast')
}

export async function getMemberSavingsTracker() {
  if (USE_MOCK) {
    return {
      totalSaved: 'NOK 14,820',
      avgDiscount: 28,
      totalOrders: 34,
      retailEquivalent: 'NOK 52,900',
      byCategory: [
        { name: 'Peptides', saved: 'NOK 9,240', pct: 62 },
        { name: 'Collagen', saved: 'NOK 2,810', pct: 19 },
        { name: 'Supplements', saved: 'NOK 1,680', pct: 11 },
        { name: 'Accessories', saved: 'NOK 1,090', pct: 8 },
      ],
      periods: {
        allTime: { chart: [800, 1200, 900, 1400, 1800, 1100, 2000, 1600, 2200, 1900, 2400, 2800], startLabel: 'Jan 2025', endLabel: 'Now' },
        thisYear: { chart: [1100, 2000, 1600, 2200, 1900, 2400, 2800, 2100], startLabel: 'Jan 2026', endLabel: 'Now' },
        last90: { chart: [700, 650, 820, 900, 780, 860, 1100, 980, 1200, 1050, 1300, 1400], startLabel: 'May', endLabel: 'Now' },
        last30: { chart: [280, 320, 190, 450, 380, 290, 340, 410], startLabel: '2 Jul', endLabel: 'Now' },
      },
      topSavings: [
        { id: 1, orderId: '38291', date: '2026-07-28', retailValue: 'NOK 3,200', paid: 'NOK 2,100', saved: 'NOK 1,100', discountPct: 34 },
        { id: 2, orderId: '37841', date: '2026-06-14', retailValue: 'NOK 2,800', paid: 'NOK 1,960', saved: 'NOK 840', discountPct: 30 },
        { id: 3, orderId: '36990', date: '2026-05-03', retailValue: 'NOK 2,600', paid: 'NOK 1,820', saved: 'NOK 780', discountPct: 30 },
        { id: 4, orderId: '35420', date: '2026-03-18', retailValue: 'NOK 4,100', paid: 'NOK 3,200', saved: 'NOK 900', discountPct: 22 },
        { id: 5, orderId: '34012', date: '2026-01-22', retailValue: 'NOK 1,900', paid: 'NOK 1,290', saved: 'NOK 610', discountPct: 32 },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/savings-tracker')
}

export async function getMemberTeamActivities() {
  if (USE_MOCK) {
    return {
      activeMembers: 38,
      rankUps30d: 5,
      recruits30d: 12,
      activities: [
        { type: 'rank', memberName: 'Anna K.', description: 'Achieved Gold rank!', detail: null, timeAgo: '2h ago', value: '⭐ Gold' },
        { type: 'recruit', memberName: 'Marte S.', description: 'Recruited a new member', detail: 'Erik J. joined the team', timeAgo: '4h ago', value: '+1 member' },
        { type: 'order', memberName: 'Thomas B.', description: 'Placed an autoship order', detail: 'BPC-157 + TB-500 — NOK 2,840', timeAgo: '5h ago', value: 'NOK 2,840' },
        { type: 'milestone', memberName: 'Ingrid P.', description: 'Hit 100 PV personal volume this month!', detail: null, timeAgo: '8h ago', value: '100 PV' },
        { type: 'training', memberName: 'Lars N.', description: 'Completed Peptide Science module', detail: 'Score: 92/100', timeAgo: '1d ago', value: '92 pts' },
        { type: 'challenge', memberName: 'Sofia A.', description: 'Won the Weekly Referral Challenge', detail: '3 new sign-ups this week', timeAgo: '1d ago', value: '1st place' },
        { type: 'order', memberName: 'Jon M.', description: 'First ever order placed!', detail: 'Starter Kit — NOK 1,490', timeAgo: '2d ago', value: 'NOK 1,490' },
        { type: 'recruit', memberName: 'Hanne L.', description: 'Recruited 2 new members this week', detail: null, timeAgo: '2d ago', value: '+2 members' },
        { type: 'milestone', memberName: 'Bjørn C.', description: 'Reached 500 PV team volume', detail: null, timeAgo: '3d ago', value: '500 PV team' },
        { type: 'rank', memberName: 'Marie T.', description: 'Promoted to Silver rank', detail: null, timeAgo: '4d ago', value: '⭐ Silver' },
      ],
      topPerformers: [
        { name: 'Anna K.', metric: '340 PV', category: 'volume' },
        { name: 'Marte S.', metric: '3 recruits', category: 'recruitment' },
        { name: 'Thomas B.', metric: 'NOK 14,200', category: 'revenue' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/team-activities')
}

export async function getMemberProductFeedback() {
  if (USE_MOCK) {
    return {
      avgRating: 4.6,
      helpfulVotes: 84,
      productsReviewed: 6,
      purchasedProducts: ['BPC-157 (5mg vials)', 'TB-500 (2mg vials)', 'GHK-Cu Topical', 'Sermorelin', 'Collagen Peptide Blend', 'IGF-1 LR3'],
      feedback: [
        { id: 'f1', productName: 'BPC-157 (5mg vials)', rating: 5, date: '2026-07-18', verified: true, title: 'Remarkable recovery results', body: 'Used for knee tendon issue after 6 months of chronic pain. After 4 weeks on 250mcg/day, pain reduced by about 70%. Still ongoing but very impressed with the quality and consistency of these vials.', effects: ['Pain reduction', 'Tendon healing', 'Anti-inflammatory'], helpfulCount: 32, adminReply: 'Thank you for sharing your experience with BPC-157! We\'re thrilled to hear about your recovery progress. Please remember to consult with a healthcare professional for dosing guidance.', status: 'approved' },
        { id: 'f2', productName: 'TB-500 (2mg vials)', rating: 5, date: '2026-06-02', verified: true, title: 'Excellent for muscle recovery', body: 'Combined with BPC-157 over an 8-week cycle. Significant improvement in post-workout recovery. Soreness down by at least half. Purity seems spot-on based on expected effects and no adverse reactions.', effects: ['Muscle recovery', 'Flexibility', 'Reduced soreness'], helpfulCount: 18, adminReply: null, status: 'approved' },
        { id: 'f3', productName: 'GHK-Cu Topical', rating: 4, date: '2026-05-15', verified: true, title: 'Good for skin but takes time', body: 'Been using topically on face and neck for 2 months. Skin texture has improved, pores look smaller. The results are subtle compared to injected peptides but consistent. The formulation absorbs well.', effects: ['Skin texture', 'Anti-aging', 'Collagen stimulation'], helpfulCount: 11, adminReply: null, status: 'approved' },
        { id: 'f4', productName: 'Sermorelin', rating: 4, date: '2026-03-28', verified: true, title: 'Good sleep quality improvement', body: 'Sleep quality noticeably better within 2 weeks. More vivid dreams, waking up feeling more rested. Haven\'t noticed dramatic body composition changes yet but the sleep alone makes it worthwhile.', effects: ['Sleep quality', 'Recovery', 'GH stimulation'], helpfulCount: 23, adminReply: null, status: 'approved' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/product-feedback')
}

export async function getAdminTaxRules() {
  if (USE_MOCK) {
    return {
      countryCount: 18,
      avgRate: 21.4,
      collectedMtd: 'NOK 284,920',
      rules: [
        { id: 'tr1', flag: '🇳🇴', country: 'Norway', region: null, category: 'All Products', type: 'standard', rate: 25, appliesTo: 'B2C sales', effectiveDate: '2024-01-01' },
        { id: 'tr2', flag: '🇳🇴', country: 'Norway', region: null, category: 'Digital Products', type: 'standard', rate: 25, appliesTo: 'Electronic services', effectiveDate: '2024-01-01' },
        { id: 'tr3', flag: '🇸🇪', country: 'Sweden', region: null, category: 'All Products', type: 'standard', rate: 25, appliesTo: 'B2C sales', effectiveDate: '2024-01-01' },
        { id: 'tr4', flag: '🇸🇪', country: 'Sweden', region: null, category: 'Supplements', type: 'reduced', rate: 12, appliesTo: 'Food supplements', effectiveDate: '2024-01-01' },
        { id: 'tr5', flag: '🇩🇰', country: 'Denmark', region: null, category: 'All Products', type: 'standard', rate: 25, appliesTo: 'B2C sales', effectiveDate: '2024-01-01' },
        { id: 'tr6', flag: '🇩🇪', country: 'Germany', region: null, category: 'All Products', type: 'standard', rate: 19, appliesTo: 'B2C sales', effectiveDate: '2024-01-01' },
        { id: 'tr7', flag: '🇩🇪', country: 'Germany', region: null, category: 'Supplements', type: 'reduced', rate: 7, appliesTo: 'Food-classified supplements', effectiveDate: '2024-01-01' },
        { id: 'tr8', flag: '🇬🇧', country: 'United Kingdom', region: null, category: 'All Products', type: 'standard', rate: 20, appliesTo: 'B2C sales', effectiveDate: '2021-01-01' },
        { id: 'tr9', flag: '🇬🇧', country: 'United Kingdom', region: null, category: 'Peptides', type: 'zero', rate: 0, appliesTo: 'Research chemicals', effectiveDate: '2021-01-01' },
        { id: 'tr10', flag: '🇺🇸', country: 'United States', region: 'California', category: 'All Products', type: 'standard', rate: 10.25, appliesTo: 'B2C sales', effectiveDate: '2023-01-01' },
        { id: 'tr11', flag: '🇺🇸', country: 'United States', region: 'Texas', category: 'All Products', type: 'standard', rate: 8.25, appliesTo: 'B2C sales', effectiveDate: '2023-01-01' },
        { id: 'tr12', flag: '🇦🇺', country: 'Australia', region: null, category: 'All Products', type: 'standard', rate: 10, appliesTo: 'GST', effectiveDate: '2024-01-01' },
        { id: 'tr13', flag: '🇨🇭', country: 'Switzerland', region: null, category: 'All Products', type: 'standard', rate: 8.1, appliesTo: 'B2C sales', effectiveDate: '2024-01-01' },
        { id: 'tr14', flag: '🇪🇺', country: 'EU (default)', region: null, category: 'Digital Products', type: 'standard', rate: 23, appliesTo: 'OSS registered', effectiveDate: '2021-07-01' },
        { id: 'tr15', flag: '🌐', country: 'B2B (all)', region: null, category: 'All Products', type: 'exempt', rate: 0, appliesTo: 'Valid VAT number', effectiveDate: '2024-01-01' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/tax-rules')
}

export async function getAdminLogViewer() {
  if (USE_MOCK) {
    return {
      errorsLastHour: 3,
      warnsLastHour: 14,
      requestsLastHour: 8_420,
      p95Latency: '182ms',
      services: ['api-gateway', 'auth-service', 'order-service', 'payment-service', 'notification-service', 'mlm-engine'],
      logs: [
        { id: 'l1', severity: 'error', timestamp: '2026-08-09 12:43:17 UTC', service: 'payment-service', message: 'Stripe webhook signature verification failed: invalid signature', requestId: 'req_9fKm2aB', userId: null, method: 'POST', path: '/webhooks/stripe', statusCode: 400, latency: 22, stack: 'Error: Webhook signature verification failed\n  at verifyStripeWebhook (/app/webhooks/stripe.js:48)\n  at handler (/app/routes/webhooks.js:12)' },
        { id: 'l2', severity: 'error', timestamp: '2026-08-09 11:18:04 UTC', service: 'mlm-engine', message: 'Commission calculation overflow: member_id=14892 exceeded max tree depth', requestId: 'req_7pNx1cD', userId: '14892', method: 'POST', path: '/v1/mlm/admin/commission-run', statusCode: 500, latency: 3840, stack: 'RangeError: Maximum call stack size exceeded\n  at calculateDownlineBonus (/app/mlm/commissions.js:204)' },
        { id: 'l3', severity: 'warn', timestamp: '2026-08-09 12:51:38 UTC', service: 'api-gateway', message: 'Rate limit approaching for IP 185.220.101.44: 89/100 requests/min', requestId: null, userId: null, method: null, path: null, statusCode: null, latency: null },
        { id: 'l4', severity: 'error', timestamp: '2026-08-09 10:02:55 UTC', service: 'auth-service', message: 'JWT refresh token expired and not rotated: token_id=tok_aB3k9', requestId: 'req_4qRs8eF', userId: '28371', method: 'POST', path: '/v1/auth/refresh', statusCode: 401, latency: 8 },
        { id: 'l5', severity: 'warn', timestamp: '2026-08-09 12:49:02 UTC', service: 'order-service', message: 'Inventory level critical: SKU=NV-BPC157-5MG stock=3 below threshold=10', requestId: null, userId: null, method: null, path: null, statusCode: null, latency: null },
        { id: 'l6', severity: 'info', timestamp: '2026-08-09 12:52:00 UTC', service: 'api-gateway', message: 'GET /v1/mlm/member/dashboard 200 OK', requestId: 'req_2mLt5gH', userId: '30214', method: 'GET', path: '/v1/mlm/member/dashboard', statusCode: 200, latency: 94 },
        { id: 'l7', severity: 'warn', timestamp: '2026-08-09 12:47:18 UTC', service: 'notification-service', message: 'SMS delivery failed for member_id=19284: carrier timeout after 3 retries', requestId: 'req_6vPw3jK', userId: '19284', method: null, path: null, statusCode: null, latency: null },
        { id: 'l8', severity: 'info', timestamp: '2026-08-09 12:50:33 UTC', service: 'payment-service', message: 'Payout batch initiated: batch_id=pay_2026080901, 48 members, NOK 284,920', requestId: 'req_8nQy7mL', userId: null, method: 'POST', path: '/v1/mlm/admin/payouts/batch', statusCode: 200, latency: 1240 },
        { id: 'l9', severity: 'debug', timestamp: '2026-08-09 12:51:55 UTC', service: 'mlm-engine', message: 'Cache miss for network_tree:member_id=30214, rebuilding from DB', requestId: 'req_2mLt5gH', userId: '30214', method: null, path: null, statusCode: null, latency: 340 },
        { id: 'l10', severity: 'warn', timestamp: '2026-08-09 12:44:22 UTC', service: 'order-service', message: 'Autoship order skipped for member_id=22093: payment method expired', requestId: 'req_3kMu6nN', userId: '22093', method: null, path: null, statusCode: null, latency: null },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/logs')
}

export async function getAdminAttribution() {
  if (USE_MOCK) {
    return {
      totalConversions: 1_284,
      totalRevenue: 'NOK 3,840,200',
      avgCac: 'NOK 890',
      roas: 4.3,
      channels: [
        { name: 'Organic Search', key: 'organic', revenue: 1_382_472, revenueFormatted: 'NOK 1.38M', sessions: 28_400, conversions: 482, cvr: 1.7, cac: 'NOK 680' },
        { name: 'Email', key: 'email', revenue: 922_848, revenueFormatted: 'NOK 922k', sessions: 14_200, conversions: 310, cvr: 2.2, cac: 'NOK 410' },
        { name: 'Paid Search', key: 'paid', revenue: 691_236, revenueFormatted: 'NOK 691k', sessions: 9_800, conversions: 218, cvr: 2.2, cac: 'NOK 1,820' },
        { name: 'Referral', key: 'referral', revenue: 460_824, revenueFormatted: 'NOK 461k', sessions: 6_400, conversions: 163, cvr: 2.5, cac: 'NOK 220' },
        { name: 'Social', key: 'social', revenue: 268_014, revenueFormatted: 'NOK 268k', sessions: 8_200, conversions: 87, cvr: 1.1, cac: 'NOK 940' },
        { name: 'Direct', key: 'direct', revenue: 114_806, revenueFormatted: 'NOK 115k', sessions: 3_100, conversions: 24, cvr: 0.8, cac: 'NOK 180' },
      ],
      campaigns: [
        { id: 'c1', name: 'Summer Peptide Launch', channel: 'Paid Search', channelKey: 'paid', spend: 'NOK 84,000', conversions: 112, revenue: 'NOK 380,000', roas: 4.5 },
        { id: 'c2', name: 'BPC-157 Email Drip', channel: 'Email', channelKey: 'email', spend: 'NOK 12,000', conversions: 98, revenue: 'NOK 290,000', roas: 24.2 },
        { id: 'c3', name: 'Influencer – Nordic Recovery', channel: 'Social', channelKey: 'social', spend: 'NOK 38,000', conversions: 54, revenue: 'NOK 162,000', roas: 4.3 },
        { id: 'c4', name: 'Referral Partner Q2', channel: 'Referral', channelKey: 'referral', spend: 'NOK 22,000', conversions: 87, revenue: 'NOK 261,000', roas: 11.9 },
        { id: 'c5', name: 'Google Shopping – Collagen', channel: 'Paid Search', channelKey: 'paid', spend: 'NOK 41,000', conversions: 63, revenue: 'NOK 184,000', roas: 4.5 },
        { id: 'c6', name: 'Win-Back Reactivation', channel: 'Email', channelKey: 'email', spend: 'NOK 8,000', conversions: 41, revenue: 'NOK 118,000', roas: 14.8 },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/attribution')
}

export async function getAdminCustomerSatisfaction() {
  if (USE_MOCK) {
    return {
      npsScore: 58,
      csatScore: 84,
      responses30d: 412,
      promoterPct: 68,
      detractorPct: 10,
      npsDistribution: { 1: 4, 2: 3, 3: 8, 4: 12, 5: 14, 6: 10, 7: 38, 8: 64, 9: 128, 10: 131 },
      npsTrend: [
        { month: 'Sep', score: 44 }, { month: 'Oct', score: 48 }, { month: 'Nov', score: 51 },
        { month: 'Dec', score: 46 }, { month: 'Jan', score: 53 }, { month: 'Feb', score: 55 },
        { month: 'Mar', score: 52 }, { month: 'Apr', score: 57 }, { month: 'May', score: 60 },
        { month: 'Jun', score: 58 }, { month: 'Jul', score: 62 }, { month: 'Aug', score: 58 },
      ],
      npsResponses: [
        { id: 'n1', memberName: 'Anna K.', score: 10, date: '2026-08-07', comment: 'The product quality is exceptional and shipping was faster than expected. Will absolutely continue ordering.' },
        { id: 'n2', memberName: 'Lars N.', score: 9, date: '2026-08-06', comment: 'Very happy with results from BPC-157 protocol. Customer support helped me select the right stack.' },
        { id: 'n3', memberName: 'Marte S.', score: 7, date: '2026-08-05', comment: 'Good products but wish there were more bundle options at mid-price range.' },
        { id: 'n4', memberName: 'Thomas B.', score: 5, date: '2026-08-04', comment: 'Had an issue with my autoship that took 3 contacts to resolve. Products are fine, service needs work.' },
        { id: 'n5', memberName: 'Sofia A.', score: 10, date: '2026-08-03', comment: 'Nordic Vitals has completely changed my recovery routine. Referring everyone I know.' },
      ],
      csatCategories: [
        { name: 'Product Quality', score: 91, responses: 340, trend: '↑ +3 pts vs last month' },
        { name: 'Shipping Speed', score: 82, responses: 310, trend: '→ No change' },
        { name: 'Customer Support', score: 74, responses: 188, trend: '↑ +5 pts vs last month' },
        { name: 'Website Experience', score: 88, responses: 220, trend: '↑ +2 pts vs last month' },
        { name: 'Value for Money', score: 79, responses: 295, trend: '↓ -1 pt vs last month' },
      ],
      themes: [
        { name: 'Fast recovery results', sentiment: 'positive', mentions: 124, topQuote: 'Noticed results within 2 weeks, much faster than expected' },
        { name: 'Premium packaging', sentiment: 'positive', mentions: 88, topQuote: 'The vials are pharmaceutical grade, very professional' },
        { name: 'Shipping cost', sentiment: 'negative', mentions: 54, topQuote: 'International shipping fees are high relative to order value' },
        { name: 'Product range', sentiment: 'positive', mentions: 72, topQuote: 'Love the growing catalog, keeps adding relevant peptides' },
        { name: 'Customer support wait', sentiment: 'negative', mentions: 38, topQuote: 'Took 2 days to get a response on my order issue' },
        { name: 'Educational content', sentiment: 'positive', mentions: 61, topQuote: 'The dosing guides and research summaries are excellent' },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/customer-satisfaction')
}

export async function getMemberProtocolBuilder() {
  if (USE_MOCK) {
    return {
      protocols: [
        {
          id: 'p1', name: 'Recovery Stack', goal: 'Tendon & joint healing', cycle: '12 weeks', dailyCost: 'NOK 89',
          items: [
            { id: 'pi1', peptide: 'BPC-157', dosage: '250 mcg', route: 'Subcutaneous', timing: 'morning', frequency: 'Daily', notes: 'Inject near injury site when possible' },
            { id: 'pi2', peptide: 'TB-500', dosage: '2 mg', route: 'Subcutaneous', timing: 'morning', frequency: '2x/week', notes: 'Saturate first 2 weeks, then maintenance' },
            { id: 'pi3', peptide: 'Sermorelin', dosage: '200 mcg', route: 'Subcutaneous', timing: 'bedtime', frequency: 'Daily', notes: 'Take on empty stomach for best GH pulse' },
          ]
        },
        {
          id: 'p2', name: 'Performance Stack', goal: 'Muscle growth & body composition', cycle: '8 weeks', dailyCost: 'NOK 112',
          items: [
            { id: 'pi4', peptide: 'IGF-1 LR3', dosage: '50 mcg', route: 'Subcutaneous', timing: 'postworkout', frequency: 'Daily', notes: 'Inject immediately post-workout' },
            { id: 'pi5', peptide: 'CJC-1295', dosage: '100 mcg', route: 'Subcutaneous', timing: 'bedtime', frequency: 'Daily', notes: 'Combined with GH pulse for synergy' },
            { id: 'pi6', peptide: 'GHK-Cu', dosage: '2 mg', route: 'Topical', timing: 'morning', frequency: 'Daily', notes: 'Apply to target areas for skin benefit' },
          ]
        }
      ]
    }
  }
  return request('GET', '/v1/mlm/member/protocol-builder')
}

export async function getMemberNetworkMap() {
  if (USE_MOCK) {
    return {
      totalCount: 84,
      maxDepth: 5,
      activeMtd: 52,
      networkPv: '4,820 PV',
      root: {
        id: 'u0', name: 'You', initials: 'ME', rank: 'Gold', volume: '340 PV', directCount: 6,
        children: [
          {
            id: 'u1', name: 'Anna K.', initials: 'AK', rank: 'Gold', volume: '280 PV', directCount: 4,
            children: [
              { id: 'u4', name: 'Petter H.', initials: 'PH', rank: 'Silver', volume: '120 PV', directCount: 2, children: [
                { id: 'u8', name: 'Lise B.', initials: 'LB', rank: 'Member', volume: '80 PV', directCount: 0, children: [] },
                { id: 'u9', name: 'Knut R.', initials: 'KR', rank: 'Member', volume: '60 PV', directCount: 0, children: [] },
              ] },
              { id: 'u5', name: 'Marie T.', initials: 'MT', rank: 'Bronze', volume: '90 PV', directCount: 1, children: [
                { id: 'u10', name: 'Erik L.', initials: 'EL', rank: 'Member', volume: '40 PV', directCount: 0, children: [] },
              ] },
              { id: 'u6', name: 'Jon E.', initials: 'JE', rank: 'Member', volume: '55 PV', directCount: 0, children: [] },
              { id: 'u7', name: 'Hege S.', initials: 'HS', rank: 'Member', volume: '45 PV', directCount: 0, children: [] },
            ]
          },
          {
            id: 'u2', name: 'Lars N.', initials: 'LN', rank: 'Silver', volume: '180 PV', directCount: 3,
            children: [
              { id: 'u11', name: 'Siv K.', initials: 'SK', rank: 'Bronze', volume: '90 PV', directCount: 1, children: [
                { id: 'u14', name: 'Tor A.', initials: 'TA', rank: 'Member', volume: '50 PV', directCount: 0, children: [] },
              ] },
              { id: 'u12', name: 'Mads J.', initials: 'MJ', rank: 'Member', volume: '60 PV', directCount: 0, children: [] },
              { id: 'u13', name: 'Nina P.', initials: 'NP', rank: 'Member', volume: '50 PV', directCount: 0, children: [] },
            ]
          },
          { id: 'u3', name: 'Sofia A.', initials: 'SA', rank: 'Bronze', volume: '95 PV', directCount: 2, children: [
            { id: 'u15', name: 'Carl M.', initials: 'CM', rank: 'Member', volume: '40 PV', directCount: 0, children: [] },
            { id: 'u16', name: 'Ida R.', initials: 'IR', rank: 'Member', volume: '38 PV', directCount: 0, children: [] },
          ] },
        ]
      }
    }
  }
  return request('GET', '/v1/mlm/member/network-map')
}

export async function getMemberAgreements() {
  if (USE_MOCK) {
    return {
      agreements: [
        {
          id: 'a1', title: 'Distributor Agreement', type: 'distributor', category: 'Core', version: '3.2',
          status: 'signed', signedDate: '2025-03-14', expiryDate: '2027-03-14',
          summary: 'This agreement outlines your rights and responsibilities as an independent distributor of Nordic Vitals products, including commission structure, territory rights, and conduct guidelines.'
        },
        {
          id: 'a2', title: 'Privacy & Data Processing Consent', type: 'compliance', category: 'GDPR', version: '2.1',
          status: 'signed', signedDate: '2025-03-14', expiryDate: null,
          summary: 'Consent for processing your personal data in accordance with GDPR. Covers usage for commission calculations, marketing communications, and regulatory reporting.'
        },
        {
          id: 'a3', title: '2026 Annual Compliance Attestation', type: 'compliance', category: 'Regulatory', version: '1.0',
          status: 'pending', sentDate: '2026-08-01', expiryDate: null,
          summary: 'Annual attestation confirming adherence to MLM regulations, income claim guidelines, and product marketing standards for the current year.'
        },
        {
          id: 'a4', title: 'Tax Withholding Form (W-8BEN)', type: 'tax', category: 'Tax', version: '2.0',
          status: 'signed', signedDate: '2025-01-08', expiryDate: '2028-01-08',
          summary: 'Certificate of foreign status for US tax withholding purposes. Required for international members receiving US-sourced income.'
        },
        {
          id: 'a5', title: 'Co-Op Advertising Agreement', type: 'amendment', category: 'Marketing', version: '1.0',
          status: 'signed', signedDate: '2026-04-22', expiryDate: '2027-04-22',
          summary: 'Agreement governing participation in co-operative advertising programs, cost-sharing ratios, approved materials, and reporting requirements.'
        },
        {
          id: 'a6', title: 'Q3 2026 Terms Amendment', type: 'amendment', category: 'Core', version: '3.3',
          status: 'pending', sentDate: '2026-07-28', expiryDate: null,
          summary: 'Amendment to your distributor agreement updating commission rates for the Platinum and Diamond tiers effective Q3 2026, reflecting new plan changes.'
        },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/agreements')
}

export async function getMemberLoyaltyTiers() {
  if (USE_MOCK) {
    return {
      currentTier: 'Gold',
      pointsBalance: 12_840,
      pointsToNext: 7_160,
      progressPct: 64,
      tiers: [
        {
          name: 'Bronze', minPoints: 0, monthlyPv: 50, directCount: null, multiplier: 1.0,
          benefits: [
            { name: 'Member discount', description: '10% off all products' },
            { name: 'Free shipping', description: 'On orders over NOK 1,500' },
            { name: 'Monthly newsletter', description: 'Exclusive research updates' },
          ]
        },
        {
          name: 'Silver', minPoints: 2_500, monthlyPv: 100, directCount: 2, multiplier: 1.5,
          benefits: [
            { name: 'Member discount', description: '15% off all products' },
            { name: 'Free shipping', description: 'On all orders' },
            { name: 'Priority support', description: 'Dedicated support queue' },
            { name: 'Early access', description: 'New product launches 48h early' },
          ]
        },
        {
          name: 'Gold', minPoints: 7_500, monthlyPv: 200, directCount: 5, multiplier: 2.0,
          benefits: [
            { name: 'Member discount', description: '20% off all products' },
            { name: 'Free express shipping', description: 'On all orders' },
            { name: 'Dedicated account manager', description: 'Personal support contact' },
            { name: 'Quarterly bonus', description: 'NOK 500 credit each quarter' },
            { name: 'Exclusive bundles', description: 'Gold-only product bundles' },
          ]
        },
        {
          name: 'Platinum', minPoints: 20_000, monthlyPv: 500, directCount: 10, multiplier: 2.5,
          benefits: [
            { name: 'Member discount', description: '25% off all products' },
            { name: 'Free express shipping', description: 'All orders, priority pick' },
            { name: 'Annual retreat invite', description: 'Platinum summit invitation' },
            { name: 'Co-branding rights', description: 'Use Nordic Vitals logo in marketing' },
            { name: 'Custom autoship', description: 'Build your own autoship bundle' },
            { name: 'Revenue share bonus', description: '0.5% of team volume each month' },
          ]
        },
        {
          name: 'Diamond', minPoints: 50_000, monthlyPv: 1_000, directCount: 20, multiplier: 3.0,
          benefits: [
            { name: 'Maximum discount', description: '30% off all products' },
            { name: 'White-glove support', description: '24/7 dedicated line' },
            { name: 'Advisory board seat', description: 'Influence product roadmap' },
            { name: 'Unlimited free shipping', description: 'All tiers, all regions' },
            { name: 'Exclusive product collab', description: 'Co-develop limited edition items' },
            { name: 'Revenue share bonus', description: '1% of total network volume' },
          ]
        },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/loyalty-tiers')
}

export async function getAdminEmailSequences() {
  if (USE_MOCK) {
    return {
      totalSequences: 12, activeCount: 8, emailsSent30d: 47_320, avgOpenRate: 38.4, avgClickRate: 9.2,
      sequences: [
        { id: 'seq1', name: 'New Member Welcome', trigger: 'signup', status: 'active', stepCount: 5, enrolled: 1_240, completed: 892,  unsubscribed: 44, steps: [
            { id: 's1', subject: 'Welcome to Nordic Vitals 🎉', delayDays: 0,  openRate: 72.1, clickRate: 31.4, unsubRate: 0.2 },
            { id: 's2', subject: 'Your starter guide to peptides',  delayDays: 2,  openRate: 61.3, clickRate: 22.8, unsubRate: 0.4 },
            { id: 's3', subject: 'How to earn your first commission', delayDays: 5, openRate: 55.7, clickRate: 18.2, unsubRate: 0.6 },
            { id: 's4', subject: 'Meet your upline team',            delayDays: 10, openRate: 48.9, clickRate: 14.6, unsubRate: 0.5 },
            { id: 's5', subject: 'Ready to level up?',              delayDays: 21, openRate: 42.3, clickRate: 12.1, unsubRate: 0.8 },
          ]
        },
        { id: 'seq2', name: 'Rank-Up Celebration', trigger: 'rank_up', status: 'active', stepCount: 3, enrolled: 320, completed: 285, unsubscribed: 8, steps: [
            { id: 's1', subject: 'Congratulations on your promotion!', delayDays: 0, openRate: 84.2, clickRate: 41.0, unsubRate: 0.1 },
            { id: 's2', subject: 'New perks unlocked at your rank',   delayDays: 1, openRate: 68.3, clickRate: 27.5, unsubRate: 0.2 },
            { id: 's3', subject: 'Your next milestone: here\'s the path', delayDays: 7, openRate: 52.1, clickRate: 19.8, unsubRate: 0.3 },
          ]
        },
        { id: 'seq3', name: 'Win-Back Inactive', trigger: 'inactivity', status: 'active', stepCount: 4, enrolled: 680, completed: 210, unsubscribed: 92, steps: [
            { id: 's1', subject: 'We miss you, {first_name}',      delayDays: 30, openRate: 28.4, clickRate: 8.2,  unsubRate: 2.1 },
            { id: 's2', subject: 'Special offer just for you',     delayDays: 35, openRate: 22.1, clickRate: 11.4, unsubRate: 1.8 },
            { id: 's3', subject: 'Your team needs you',            delayDays: 42, openRate: 18.7, clickRate: 6.9,  unsubRate: 2.4 },
            { id: 's4', subject: 'Last chance — exclusive bundle', delayDays: 50, openRate: 15.2, clickRate: 9.1,  unsubRate: 3.1 },
          ]
        },
        { id: 'seq4', name: 'Birthday Series', trigger: 'birthday', status: 'paused', stepCount: 2, enrolled: 450, completed: 430, unsubscribed: 6, steps: [
            { id: 's1', subject: '🎂 Happy Birthday from Nordic Vitals!', delayDays: 0, openRate: 81.3, clickRate: 38.7, unsubRate: 0.1 },
            { id: 's2', subject: 'Your birthday gift expires soon',       delayDays: 3, openRate: 62.4, clickRate: 44.2, unsubRate: 0.2 },
          ]
        },
        { id: 'seq5', name: 'Post-Purchase Care', trigger: 'purchase', status: 'draft', stepCount: 4, enrolled: 0, completed: 0, unsubscribed: 0, steps: [
            { id: 's1', subject: 'Your order is on its way',           delayDays: 0,  openRate: 0, clickRate: 0, unsubRate: 0 },
            { id: 's2', subject: 'How to use your new peptides',       delayDays: 5,  openRate: 0, clickRate: 0, unsubRate: 0 },
            { id: 's3', subject: 'Share your results with the community', delayDays: 21, openRate: 0, clickRate: 0, unsubRate: 0 },
            { id: 's4', subject: 'Time to reorder? Here\'s a discount', delayDays: 28, openRate: 0, clickRate: 0, unsubRate: 0 },
          ]
        },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/email-sequences')
}

export async function getAdminCommissionTiers() {
  if (USE_MOCK) {
    return {
      totalTiers: 6, avgPersonalRate: 14.2, avgTeamRate: 6.8, membersOnPlans: 3_847,
      tiers: [
        { id: 't1', rankName: 'Associate',  type: 'personal', personalPct: 10, teamPct: 3, minPv: 50,    minGroupPv: 0,      memberCount: 1_240 },
        { id: 't2', rankName: 'Manager',    type: 'personal', personalPct: 12, teamPct: 5, minPv: 150,   minGroupPv: 500,    memberCount: 890   },
        { id: 't3', rankName: 'Director',   type: 'team',     personalPct: 14, teamPct: 7, minPv: 300,   minGroupPv: 2_000,  memberCount: 520   },
        { id: 't4', rankName: 'Executive',  type: 'team',     personalPct: 16, teamPct: 9, minPv: 500,   minGroupPv: 6_000,  memberCount: 148   },
        { id: 't5', rankName: 'Diamond',    type: 'bonus',    personalPct: 18, teamPct: 11, minPv: 1_000, minGroupPv: 15_000, memberCount: 38    },
        { id: 't6', rankName: 'Crown',      type: 'bonus',    personalPct: 20, teamPct: 13, minPv: 2_000, minGroupPv: 40_000, memberCount: 11    },
      ],
      overrideRules: [
        { id: 'r1', description: 'Fast Start Bonus',      condition: 'First 90 days active',       rate: 5  },
        { id: 'r2', description: 'Leadership Pool',       condition: 'Director+ rank',             rate: 2  },
        { id: 'r3', description: 'Infinity Bonus',        condition: 'Diamond+ unlimited depth',   rate: 1  },
        { id: 'r4', description: 'Generation Match',      condition: '3 generations of Directors', rate: 4  },
        { id: 'r5', description: 'Customer Acquisition',  condition: 'Per qualifying retail order', rate: 8  },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/commission-tiers')
}

export async function getAdminProductReviews() {
  if (USE_MOCK) {
    const reviews = [
      { id: 'r1', productName: 'BPC-157 10mg',       memberName: 'Anna K.',   rating: 5, status: 'pending',  body: 'Remarkable recovery after my knee surgery. 6 weeks in and I can jog again. Will reorder.',       date: '2026-08-09', verified: true  },
      { id: 'r2', productName: 'TB-500 2mg',          memberName: 'Jonas S.',  rating: 4, status: 'pending',  body: 'Good quality, noticed improved flexibility after 3 weeks. Packaging could be better.',            date: '2026-08-08', verified: true  },
      { id: 'r3', productName: 'Sermorelin 2mg',      memberName: 'Maria L.',  rating: 5, status: 'approved', body: 'Better sleep quality within 10 days. My recovery from workouts has been significantly faster.',  date: '2026-08-07', verified: true  },
      { id: 'r4', productName: 'PT-141 10mg',         memberName: 'Erik T.',   rating: 3, status: 'pending',  body: 'Decent product but effects were mild for me. May work better at higher doses.',                  date: '2026-08-07', verified: false },
      { id: 'r5', productName: 'Ipamorelin 2mg',      memberName: 'Sofia B.',  rating: 5, status: 'featured', body: 'The best peptide I have tried. My GH levels were confirmed improved at my last blood test.',    date: '2026-08-06', verified: true  },
      { id: 'r6', productName: 'Melanotan II 10mg',   memberName: 'Lukas R.',  rating: 2, status: 'rejected', body: 'Product arrived damaged. The vial was cracked. Customer service resolved it eventually.',        date: '2026-08-05', verified: true  },
    ]
    return {
      pendingCount: 3, approvedCount: 18, featuredCount: 4, totalReviews: 124, avgRating: 4.3,
      ratingBreakdown: { 5: 68, 4: 32, 3: 14, 2: 6, 1: 4 },
      reviews
    }
  }
  return request('GET', '/v1/mlm/admin/product-reviews')
}

export async function getAdminMemberJourney() {
  if (USE_MOCK) {
    return {
      stages: {
        acquisition: { count: 2_840, delta: 12  },
        activation:  { count: 1_920, delta: 8   },
        growth:      { count: 1_140, delta: 15  },
        retention:   { count: 890,   delta: -3  },
        churn_risk:  { count: 340,   delta: 22  },
        churned:     { count: 210,   delta: -5  },
      },
      transitions: [
        { from: 'acquisition', to: 'activation',  rate: 68 },
        { from: 'activation',  to: 'growth',       rate: 59 },
        { from: 'growth',      to: 'retention',    rate: 78 },
        { from: 'retention',   to: 'churn_risk',   rate: 15 },
        { from: 'churn_risk',  to: 'churned',      rate: 38 },
        { from: 'churn_risk',  to: 'retention',    rate: 41 },
      ],
      churnRisk: [
        { id: 'm1', name: 'Katarina V.',  rank: 'Director',  lastActive: '48 days ago', riskScore: 84, ltv: 42_800 },
        { id: 'm2', name: 'Thomas H.',   rank: 'Manager',   lastActive: '61 days ago', riskScore: 78, ltv: 28_400 },
        { id: 'm3', name: 'Anna P.',     rank: 'Executive', lastActive: '35 days ago', riskScore: 71, ltv: 91_200 },
        { id: 'm4', name: 'Magnus R.',   rank: 'Manager',   lastActive: '55 days ago', riskScore: 67, ltv: 19_600 },
        { id: 'm5', name: 'Ingrid K.',   rank: 'Associate', lastActive: '72 days ago', riskScore: 62, ltv: 8_900  },
      ]
    }
  }
  return request('GET', '/v1/mlm/admin/member-journey')
}

export async function getMemberReadingList() {
  if (USE_MOCK) {
    return {
      savedCount: 24, readCount: 18, inProgressCount: 3, streak: 7,
      articles: [
        { id: 'a1', title: 'BPC-157: Mechanisms of Action and Clinical Applications', author: 'Dr. Sarah Chen', category: 'peptides', readTime: 12, status: 'in_progress', progressPct: 65, summary: 'A comprehensive review of BPC-157 research, covering gut healing, tendon repair, and neuroprotection.', publishedDate: '2026-07-28' },
        { id: 'a2', title: 'Building a Sustainable MLM Business in 2026',            author: 'Marcus J.',        category: 'business', readTime: 8,  status: 'read',        progressPct: 100, summary: 'Strategies for long-term success in network marketing with a focus on customer retention.', publishedDate: '2026-07-15' },
        { id: 'a3', title: 'Sleep Optimization: The Peptide Approach',               author: 'Nordic Vitals HQ', category: 'wellness', readTime: 6,  status: 'unread',      progressPct: 0,  summary: 'How Ipamorelin and CJC-1295 can work synergistically with sleep hygiene to optimize recovery.', publishedDate: '2026-08-01' },
        { id: 'a4', title: 'Mastering Cold Calling for Supplement Sales',            author: 'Sales Academy',    category: 'business', readTime: 10, status: 'in_progress', progressPct: 30, summary: 'Practical scripts and objection handling for new member recruitment conversations.', publishedDate: '2026-07-20' },
        { id: 'a5', title: 'Protein Synthesis and Peptide Timing',                  author: 'NutriScience',     category: 'nutrition', readTime: 7, status: 'read',        progressPct: 100, summary: 'Understanding how timing your peptide protocols around workouts maximises anabolic signaling.', publishedDate: '2026-06-30' },
        { id: 'a6', title: 'The Mindset of a Top Earner',                           author: 'Peak Performance',  category: 'mindset', readTime: 5,  status: 'unread',      progressPct: 0,  summary: 'Interviews with Diamond-rank Nordic Vitals distributors on the beliefs that drive their success.', publishedDate: '2026-08-05' },
      ],
      recommended: [
        { id: 'r1', title: 'TB-500 vs BPC-157: Which is Right for You?',       category: 'peptides',  readTime: 9,  author: 'Dr. Sarah Chen'    },
        { id: 'r2', title: 'Social Media Strategies for Wellness Brands',       category: 'business',  readTime: 11, author: 'Growth Academy'     },
        { id: 'r3', title: 'Intermittent Fasting + Peptide Synergy',            category: 'nutrition', readTime: 6,  author: 'NutriScience'       },
        { id: 'r4', title: 'Overcoming Rejection in Network Marketing',          category: 'mindset',   readTime: 4,  author: 'Peak Performance'   },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/reading-list')
}

export async function getMemberCommunityFeed() {
  if (USE_MOCK) {
    return {
      myPostCount: 12, likesReceived: 248, commentCount: 74, onlineCount: 83,
      posts: [
        {
          id: 'p1', type: 'win', authorName: 'Sofia B.', rank: 'Director', timeAgo: '2h ago', liked: true, likeCount: 47, commentCount: 12,
          body: 'Just hit Diamond rank! 🏆 4 years of consistent work and it finally clicked. The key was focusing on 3 people who were truly coachable rather than recruiting everyone. Thank you to my incredible upline team!',
          comments: [
            { id: 'c1', authorName: 'Anna K.', body: 'Congratulations Sofia!! You deserve this 🎉' },
            { id: 'c2', authorName: 'Marcus L.', body: 'Absolutely inspiring — you\'ve been a great mentor to so many' },
          ]
        },
        {
          id: 'p2', type: 'tip', authorName: 'Jonas E.', rank: 'Executive', timeAgo: '5h ago', liked: false, likeCount: 31, commentCount: 8,
          body: '💡 Pro tip for BPC-157 protocol: split your daily dose into AM and PM administrations rather than a single injection. I\'ve seen significantly better results with twice-daily dosing — consistent plasma levels seem to matter more than peak levels.',
          comments: [
            { id: 'c1', authorName: 'Erik T.', body: 'This matches what I\'ve been reading in the research. Great share!' },
          ]
        },
        {
          id: 'p3', type: 'question', authorName: 'Lukas M.', rank: 'Manager', timeAgo: '8h ago', liked: false, likeCount: 14, commentCount: 21,
          body: 'Anyone had experience combining Sermorelin with Ipamorelin? I\'ve heard the synergy is excellent but I want to hear real experiences before starting. What dosing split worked for you?',
          comments: [
            { id: 'c1', authorName: 'Sofia B.', body: 'I ran that stack for 3 months. 100mcg Ipamorelin + 200mcg Sermorelin before bed — great sleep and noticeable body comp changes.' },
          ]
        },
        {
          id: 'p4', type: 'review', authorName: 'Maria K.', rank: 'Manager', timeAgo: '1d ago', liked: true, likeCount: 22, commentCount: 5,
          body: '⭐⭐⭐⭐⭐ Nordic Vitals TB-500 — just finished my 8-week protocol for a chronic shoulder injury. The improvement is remarkable. Range of motion fully restored. Product quality is consistently excellent.',
          comments: []
        },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/community-feed')
}

export async function getMemberMentorship() {
  if (USE_MOCK) {
    return {
      hasMentor: true, menteeCount: 3, sessionsDone: 14, goalsMet: 4, goalsTotal: 6,
      mentor: {
        name: 'Sofia Bergström', rank: 'Diamond', yearsExp: 6, menteeCount: 8,
        speciality: 'Business Growth', responseTime: '< 4 hours',
        bio: 'Reached Diamond in 3 years by focusing on product expertise and deep customer relationships. Happy to help you build a business that aligns with your values.'
      },
      nextSession: { title: 'Monthly Goal Review', date: '2026-08-14 at 15:00', duration: 45, link: 'https://meet.example.com/sofia-gary' },
      mentorNotes: [
        { id: 'n1', note: 'Focus on warm market outreach this week — Gary has 3 strong prospects to follow up.', date: '2026-08-07' },
        { id: 'n2', note: 'Review the income disclosure script before the next prospect meeting.', date: '2026-07-31' },
      ],
      mentees: [
        { id: 'm1', name: 'Lukas M.',  rank: 'Associate', joinedDate: '2026-06-12', status: 'active'  },
        { id: 'm2', name: 'Anna P.',   rank: 'Associate', joinedDate: '2026-07-03', status: 'active'  },
        { id: 'm3', name: 'Erik T.',   rank: 'Associate', joinedDate: '2026-07-28', status: 'pending' },
      ],
      sharedGoals: [
        { id: 'g1', title: 'Reach Manager rank by October',      progressPct: 72, dueDate: '2026-10-01', status: 'on_track' },
        { id: 'g2', title: 'Recruit 2 qualified members in Q3',  progressPct: 50, dueDate: '2026-09-30', status: 'on_track' },
        { id: 'g3', title: 'Complete peptide certification course', progressPct: 30, dueDate: '2026-09-01', status: 'behind' },
      ],
      sessionHistory: [
        { id: 's1', title: 'Q3 Strategy Session',    date: '2026-08-01', duration: 45, with: 'Sofia B.', notes: 'Agreed to double down on Instagram content. Sofia will share her top 10 posts.' },
        { id: 's2', title: 'Objection Handling',     date: '2026-07-18', duration: 30, with: 'Sofia B.', notes: 'Practiced the three main objections: cost, time, and product trust.' },
        { id: 's3', title: 'Monthly Check-in — Jul', date: '2026-07-03', duration: 30, with: 'Sofia B.', notes: 'June was strong. 1 new recruit qualified. Set July targets.' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/mentorship')
}

export async function getMemberLiveEvents() {
  if (USE_MOCK) {
    return {
      registeredCount: 8, attendedCount: 14, upcomingCount: 4, replayCount: 22,
      liveNow: { title: 'Peptide Science: BPC-157 Deep Dive', host: 'Dr. Sarah Chen', viewerCount: 247 },
      events: [
        { id: 'e1', title: 'Peptide Science: BPC-157 Deep Dive',            type: 'webinar',        status: 'live',     host: 'Dr. Sarah Chen',      date: 'Today, 15:00',       duration: 60, registeredCount: 312, registered: true,  replayUrl: null,          description: 'Advanced mechanisms, dosing protocols, and real case studies from clinical practice.' },
        { id: 'e2', title: 'Q3 Earnings & Network Growth Webinar',           type: 'town_hall',      status: 'upcoming', host: 'Nordic Vitals CEO',   date: '2026-08-12 at 18:00', duration: 90, registeredCount: 1_840, registered: true, replayUrl: null,       description: 'Quarterly business update, new product pipeline, and compensation plan enhancements.' },
        { id: 'e3', title: 'New Product Launch: Nordic Stack Pro',           type: 'product_launch', status: 'upcoming', host: 'Product Team',        date: '2026-08-15 at 14:00', duration: 45, registeredCount: 924, registered: false, replayUrl: null,        description: 'Live reveal of our new flagship peptide stack with exclusive founding-member pricing.' },
        { id: 'e4', title: 'Live Q&A: Building Your Downline in 90 Days',   type: 'qa',             status: 'upcoming', host: 'Sofia B., Diamond',   date: '2026-08-18 at 19:00', duration: 60, registeredCount: 184, registered: false, replayUrl: null,        description: 'Diamond-rank distributor shares her exact 90-day recruitment and activation system.' },
        { id: 'e5', title: 'Social Selling Masterclass',                    type: 'training',       status: 'upcoming', host: 'Marketing Academy',   date: '2026-08-22 at 16:00', duration: 120, registeredCount: 431, registered: true, replayUrl: null,        description: 'Instagram and TikTok strategies for wellness brands. Includes live content creation.' },
        { id: 'e6', title: 'Sermorelin Protocol: Science & Results',         type: 'webinar',        status: 'ended',    host: 'Dr. Lars Peterson',   date: '2026-08-05 at 15:00', duration: 60, registeredCount: 287, registered: true, replayUrl: 'https://replay.example.com/e6', description: 'In-depth exploration of Sermorelin for anti-aging and GH optimization.' },
        { id: 'e7', title: 'New Member Onboarding — August Cohort',         type: 'training',       status: 'ended',    host: 'Onboarding Team',     date: '2026-08-03 at 10:00', duration: 90, registeredCount: 68,  registered: false, replayUrl: 'https://replay.example.com/e7', description: 'Step-by-step onboarding covering the back office, compensation plan, and first steps.' },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/live-events')
}

// ── Run 165 ─────────────────────────────────────────────────────────────────

export async function getAdminCallCenter() {
  if (USE_MOCK) {
    return {
      queueLength: 7, avgWaitSec: 94, slaBreached: 2, agentsOnline: 5,
      queue: [
        { id: 'q1', ticket: 'TK-9041', member: 'Lars Eriksson',  issue: 'Payout not received',     waitSec: 210, priority: 'high',   assignedTo: null },
        { id: 'q2', ticket: 'TK-9042', member: 'Ingrid H.',       issue: 'Order refund question',   waitSec: 145, priority: 'medium', assignedTo: 'Agent A' },
        { id: 'q3', ticket: 'TK-9043', member: 'Bjørn T.',        issue: 'KYC document rejected',   waitSec: 88,  priority: 'high',   assignedTo: null },
        { id: 'q4', ticket: 'TK-9044', member: 'Maria L.',        issue: 'Autoship not processing', waitSec: 62,  priority: 'medium', assignedTo: 'Agent B' },
        { id: 'q5', ticket: 'TK-9045', member: 'Erik N.',         issue: 'Commission discrepancy',  waitSec: 34,  priority: 'low',    assignedTo: 'Agent A' },
      ],
      agents: [
        { id: 'a1', name: 'Agent A (Sara M.)',  status: 'busy',    ticketsToday: 14, avgResolveSec: 420, satisfaction: 4.7 },
        { id: 'a2', name: 'Agent B (Kim T.)',   status: 'busy',    ticketsToday: 11, avgResolveSec: 510, satisfaction: 4.5 },
        { id: 'a3', name: 'Agent C (Olav P.)',  status: 'available', ticketsToday: 9, avgResolveSec: 380, satisfaction: 4.8 },
        { id: 'a4', name: 'Agent D (Frida L.)', status: 'break',   ticketsToday: 8,  avgResolveSec: 460, satisfaction: 4.4 },
        { id: 'a5', name: 'Agent E (Nils R.)',  status: 'offline', ticketsToday: 6,  avgResolveSec: 490, satisfaction: 4.3 },
      ],
      recentResolved: [
        { id: 'r1', ticket: 'TK-9038', member: 'Anna K.',    issue: 'Wrong product received',       resolvedBy: 'Sara M.',  resolveSec: 390, rating: 5 },
        { id: 'r2', ticket: 'TK-9037', member: 'Petter V.',  issue: 'Subscription upgrade query',   resolvedBy: 'Kim T.',   resolveSec: 520, rating: 4 },
        { id: 'r3', ticket: 'TK-9035', member: 'Hanne L.',   issue: 'Referral link not tracking',   resolvedBy: 'Olav P.',  resolveSec: 300, rating: 5 },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/call-center')
}

export async function assignAdminCallCenterTicket(ticketId, agentId) {
  if (USE_MOCK) { await delay(300); return { ok: true } }
  return request('POST', '/v1/mlm/admin/call-center/assign', { ticketId, agentId })
}

export async function getAdminPriceHistory(skuFilter = '') {
  if (USE_MOCK) {
    const rows = [
      { id: 'ph1', sku: 'NV-BPC-5',   name: 'BPC-157 5mg',            oldPrice: 42.00, newPrice: 47.00, changedBy: 'admin@nordicvitals.com', changedAt: '2026-08-07T09:14:00Z', reason: 'Cost increase' },
      { id: 'ph2', sku: 'NV-SERM-2',  name: 'Sermorelin 2mg',          oldPrice: 68.00, newPrice: 64.00, changedBy: 'admin@nordicvitals.com', changedAt: '2026-08-05T14:30:00Z', reason: 'Promotional markdown' },
      { id: 'ph3', sku: 'NV-TB4-1',   name: 'TB-500 / Thymosin Beta-4',oldPrice: 55.00, newPrice: 59.00, changedBy: 'pricing@nordicvitals.com',changedAt: '2026-07-28T11:00:00Z', reason: 'Quarterly review' },
      { id: 'ph4', sku: 'NV-GHK-1',   name: 'GHK-Cu Peptide Cream',    oldPrice: 38.00, newPrice: 38.00, changedBy: 'pricing@nordicvitals.com',changedAt: '2026-07-20T08:00:00Z', reason: 'No change (audit)' },
      { id: 'ph5', sku: 'NV-IGFLR3-1',name: 'IGF-1 LR3 0.1mg',         oldPrice: 85.00, newPrice: 91.00, changedBy: 'admin@nordicvitals.com', changedAt: '2026-07-15T16:45:00Z', reason: 'Supplier cost' },
      { id: 'ph6', sku: 'NV-BPC-5',   name: 'BPC-157 5mg',             oldPrice: 39.00, newPrice: 42.00, changedBy: 'system',                  changedAt: '2026-07-01T00:00:00Z', reason: 'Scheduled Q3 adjustment' },
      { id: 'ph7', sku: 'NV-STACK-1', name: 'Nordic Stack Pro',         oldPrice: 120.00,newPrice: 115.00,changedBy: 'admin@nordicvitals.com', changedAt: '2026-06-25T10:00:00Z', reason: 'Launch promo' },
    ]
    const filtered = skuFilter ? rows.filter(r => r.sku.toLowerCase().includes(skuFilter.toLowerCase()) || r.name.toLowerCase().includes(skuFilter.toLowerCase())) : rows
    return filtered
  }
  return request('GET', `/v1/mlm/admin/price-history?sku=${encodeURIComponent(skuFilter)}`)
}

export async function getAdminMobileApp() {
  if (USE_MOCK) {
    return {
      iosVersion: '3.4.1', iosForceUpdate: false, iosBuildDate: '2026-08-01',
      androidVersion: '3.4.2', androidForceUpdate: false, androidBuildDate: '2026-08-03',
      pushStats: { sent: 18420, opened: 7310, openRate: '39.7%', optedIn: 3_241 },
      maintenanceMode: false,
      featureFlags: [
        { id: 'ff1', key: 'peptide_scanner',    label: 'Peptide QR Scanner',    enabledIos: true,  enabledAndroid: true,  rolloutPct: 100 },
        { id: 'ff2', key: 'ai_coach',           label: 'AI Wellness Coach',      enabledIos: true,  enabledAndroid: false, rolloutPct: 50  },
        { id: 'ff3', key: 'biometric_login',    label: 'Biometric Login',        enabledIos: true,  enabledAndroid: true,  rolloutPct: 100 },
        { id: 'ff4', key: 'dark_mode_v2',       label: 'Dark Mode v2',           enabledIos: false, enabledAndroid: false, rolloutPct: 0   },
        { id: 'ff5', key: 'token_wallet_ui',    label: 'Token Wallet UI',        enabledIos: true,  enabledAndroid: true,  rolloutPct: 75  },
      ],
      appStoreLinks: { ios: 'https://apps.apple.com/app/nordic-vitals', android: 'https://play.google.com/store/apps/nordic-vitals' },
    }
  }
  return request('GET', '/v1/mlm/admin/mobile-app')
}

export async function toggleAdminMobileFlag(id, platform, enabled) {
  if (USE_MOCK) { await delay(250); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/mobile-app/flags/${id}`, { platform, enabled })
}

export async function getAdminComplianceWatchlist() {
  if (USE_MOCK) {
    return {
      total: 12, highRisk: 3, reviewing: 5, cleared: 4,
      members: [
        { id: 'cw1', name: 'Marcus B.',    memberId: 'NV-2201', risk: 'high',   trigger: 'Chargebacks × 3 in 30d',           reviewer: 'compliance@nordicvitals.com', flaggedAt: '2026-08-06', notes: 'Dispute pattern under review.' },
        { id: 'cw2', name: 'Petra K.',     memberId: 'NV-1844', risk: 'high',   trigger: 'Income claim on public social',     reviewer: 'compliance@nordicvitals.com', flaggedAt: '2026-08-04', notes: 'Facebook post removed. Awaiting signed compliance cert.' },
        { id: 'cw3', name: 'Sven A.',      memberId: 'NV-3017', risk: 'high',   trigger: 'KYC docs unverified > 60d',         reviewer: null,                          flaggedAt: '2026-07-31', notes: '' },
        { id: 'cw4', name: 'Heidi M.',     memberId: 'NV-0922', risk: 'medium', trigger: 'Rapid downline expansion (31 in 7d)',reviewer: 'kyc@nordicvitals.com',       flaggedAt: '2026-08-01', notes: 'Looks like a team transfer. Investigating.' },
        { id: 'cw5', name: 'Rolf T.',      memberId: 'NV-4102', risk: 'medium', trigger: 'Payout address changed 3 times',    reviewer: 'kyc@nordicvitals.com',        flaggedAt: '2026-07-29', notes: 'Member confirmed via phone.' },
        { id: 'cw6', name: 'Ingeborg F.',  memberId: 'NV-0310', risk: 'low',    trigger: 'Unusual login location',            reviewer: null,                          flaggedAt: '2026-08-08', notes: '' },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/compliance-watchlist')
}

export async function updateAdminComplianceWatchlist(id, { risk, notes, cleared }) {
  if (USE_MOCK) { await delay(300); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/compliance-watchlist/${id}`, { risk, notes, cleared })
}

export async function getMemberWellnessGoals() {
  if (USE_MOCK) {
    return {
      streak: 14, goalsHit: 3, goalsTotal: 5,
      goals: [
        { id: 'wg1', title: 'Daily steps',         unit: 'steps',   target: 10000, current: 8420,  pct: 84, category: 'activity',  trend: 'up' },
        { id: 'wg2', title: 'Body weight',          unit: 'kg',      target: 82.0,  current: 85.4,  pct: 60, category: 'weight',    trend: 'down' },
        { id: 'wg3', title: 'Sleep hours',          unit: 'h/night', target: 8.0,   current: 7.2,   pct: 90, category: 'sleep',     trend: 'stable' },
        { id: 'wg4', title: 'Water intake',         unit: 'L/day',   target: 3.0,   current: 2.4,   pct: 80, category: 'nutrition', trend: 'up' },
        { id: 'wg5', title: 'Resting heart rate',   unit: 'bpm',     target: 60,    current: 66,    pct: 73, category: 'health',    trend: 'down' },
      ],
      weeklyCheckIns: [
        { week: 'Jul 28', achieved: 3 }, { week: 'Aug 4', achieved: 4 }, { week: 'Aug 11', achieved: 3 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/wellness-goals')
}

export async function updateMemberWellnessGoal(id, current) {
  if (USE_MOCK) { await delay(250); return { ok: true } }
  return request('PATCH', `/v1/mlm/member/wellness-goals/${id}`, { current })
}

export async function getMemberOrderTracking() {
  if (USE_MOCK) {
    return {
      orders: [
        {
          id: 'ot1', orderNo: 'NV-20260808-5512', status: 'in_transit', placedAt: '2026-08-08T10:15:00Z',
          items: [{ name: 'BPC-157 5mg × 2', qty: 2 }, { name: 'Nordic Stack Pro × 1', qty: 1 }],
          carrier: 'DHL Express', trackingNo: '1234567890123', estimatedDelivery: '2026-08-11',
          steps: [
            { label: 'Order placed',       done: true,  ts: '2026-08-08 10:15' },
            { label: 'Payment confirmed',  done: true,  ts: '2026-08-08 10:18' },
            { label: 'Picking & packing',  done: true,  ts: '2026-08-08 14:30' },
            { label: 'Shipped',            done: true,  ts: '2026-08-09 08:00' },
            { label: 'Out for delivery',   done: false, ts: null },
            { label: 'Delivered',          done: false, ts: null },
          ],
        },
        {
          id: 'ot2', orderNo: 'NV-20260730-4891', status: 'delivered', placedAt: '2026-07-30T09:00:00Z',
          items: [{ name: 'Sermorelin 2mg × 1', qty: 1 }],
          carrier: 'PostNord', trackingNo: '9876543210987', estimatedDelivery: '2026-08-02',
          steps: [
            { label: 'Order placed',      done: true, ts: '2026-07-30 09:00' },
            { label: 'Payment confirmed', done: true, ts: '2026-07-30 09:02' },
            { label: 'Picking & packing', done: true, ts: '2026-07-30 15:00' },
            { label: 'Shipped',           done: true, ts: '2026-07-31 07:30' },
            { label: 'Out for delivery',  done: true, ts: '2026-08-02 09:00' },
            { label: 'Delivered',         done: true, ts: '2026-08-02 12:45' },
          ],
        },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/order-tracking')
}

export async function getMemberSubscriptionUpgrade() {
  if (USE_MOCK) {
    return {
      current: 'starter',
      plans: [
        { id: 'starter',    name: 'Starter',     price: 29,  pv: 50,  features: ['Product discounts 10%', 'Basic training', 'Email support', '1 referral link'] },
        { id: 'pro',        name: 'Pro',          price: 59,  pv: 100, features: ['Product discounts 20%', 'Full training library', 'Priority support', '5 referral links', 'Commission reports', 'Custom landing page'] },
        { id: 'elite',      name: 'Elite',        price: 99,  pv: 200, features: ['Product discounts 30%', 'All Pro features', 'Dedicated coach', 'Unlimited referral links', 'Co-op ad credits €50/mo', 'Early product access', 'Leadership events'] },
        { id: 'enterprise', name: 'Enterprise',   price: 199, pv: 400, features: ['Product discounts 40%', 'All Elite features', 'White-label tools', 'API access', 'Custom commissions', 'Account manager'] },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/subscription-upgrade')
}

export async function upgradeMemberSubscription(planId) {
  if (USE_MOCK) { await delay(600); return { ok: true, newPlan: planId } }
  return request('POST', '/v1/mlm/member/subscription-upgrade', { planId })
}

export async function getMemberNutritionLog() {
  if (USE_MOCK) {
    return {
      today: { calories: 1840, protein: 142, carbs: 180, fat: 62, targetCalories: 2200, targetProtein: 160 },
      entries: [
        { id: 'nl1', meal: 'Breakfast', food: 'Oatmeal + protein shake',         calories: 520, protein: 42, carbs: 68, fat: 8,  time: '07:30', linkedProduct: 'Nordic Whey Pro' },
        { id: 'nl2', meal: 'Lunch',     food: 'Grilled salmon + sweet potato',   calories: 680, protein: 54, carbs: 72, fat: 18, time: '12:15', linkedProduct: null },
        { id: 'nl3', meal: 'Pre-workout',food: 'BPC-157 injection + banana',     calories: 90,  protein: 2,  carbs: 23, fat: 0,  time: '16:00', linkedProduct: 'BPC-157 5mg' },
        { id: 'nl4', meal: 'Dinner',    food: 'Chicken breast + salad',          calories: 550, protein: 44, carbs: 17, fat: 36, time: '19:30', linkedProduct: null },
      ],
      weeklyAvg: [
        { day: 'Mon', calories: 2100 }, { day: 'Tue', calories: 1950 }, { day: 'Wed', calories: 2050 },
        { day: 'Thu', calories: 1840 }, { day: 'Fri', calories: 0 }, { day: 'Sat', calories: 0 }, { day: 'Sun', calories: 0 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/nutrition-log')
}

export async function addMemberNutritionEntry(data) {
  if (USE_MOCK) { await delay(300); return { ok: true, id: 'nl' + Date.now() } }
  return request('POST', '/v1/mlm/member/nutrition-log', data)
}

// ── Run 166: Smart Pricing, Member Feedback, Fulfillment Centers, Gamification ──
// ── Sleep Tracker, Challenges History, Invoice History, Team Map ──────────────

export async function getAdminSmartPricing() {
  if (USE_MOCK) {
    await delay(350)
    return {
      stats: { activeRules: 12, pendingRules: 3, avgDiscount: 8.4, revenueImpact: '+€4,210' },
      rules: [
        { id: 'sp1', name: 'VIP Flash Discount',    trigger: 'member_tier=VIP',        action: 'discount', value: 15, unit: '%', floor: 29.99, ceiling: null, status: 'active',   hits: 342 },
        { id: 'sp2', name: 'Bulk Order Markdown',   trigger: 'cart_qty>=10',            action: 'discount', value: 10, unit: '%', floor: null,  ceiling: null, status: 'active',   hits: 89  },
        { id: 'sp3', name: 'Loyalty Cashback',      trigger: 'loyalty_tier=gold',       action: 'cashback', value: 5,  unit: '%', floor: null,  ceiling: 50,   status: 'active',   hits: 210 },
        { id: 'sp4', name: 'First Order Promo',     trigger: 'order_count=0',           action: 'discount', value: 20, unit: '%', floor: 19.99, ceiling: 30,   status: 'active',   hits: 527 },
        { id: 'sp5', name: 'Reactivation Offer',    trigger: 'inactive_days>=90',       action: 'discount', value: 25, unit: '%', floor: null,  ceiling: 40,   status: 'paused',   hits: 66  },
        { id: 'sp6', name: 'High PV Reward',        trigger: 'monthly_pv>=500',         action: 'discount', value: 12, unit: '%', floor: null,  ceiling: null, status: 'active',   hits: 134 },
        { id: 'sp7', name: 'Weekend Boost',         trigger: 'day_of_week=sat,sun',     action: 'discount', value: 5,  unit: '%', floor: null,  ceiling: null, status: 'pending',  hits: 0   },
        { id: 'sp8', name: 'Peptide Stack Bundle',  trigger: 'product_category=bundle', action: 'discount', value: 8,  unit: '%', floor: 49.99, ceiling: null, status: 'active',   hits: 441 },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/smart-pricing')
}

export async function toggleAdminSmartPricingRule(id, status) {
  if (USE_MOCK) { await delay(200); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/smart-pricing/${id}`, { status })
}

export async function getAdminMemberFeedback() {
  if (USE_MOCK) {
    await delay(320)
    return {
      stats: { total: 1842, npsScore: 67, avgRating: 4.2, pendingReview: 38 },
      sentiment: { positive: 61, neutral: 24, negative: 15 },
      categories: [
        { name: 'Product Quality', count: 512, avgRating: 4.6 },
        { name: 'Shipping Speed',  count: 334, avgRating: 3.8 },
        { name: 'Support',         count: 289, avgRating: 4.1 },
        { name: 'App UX',          count: 267, avgRating: 3.9 },
        { name: 'Pricing',         count: 244, avgRating: 3.5 },
        { name: 'Training',        count: 196, avgRating: 4.4 },
      ],
      entries: [
        { id: 'mf1', member: 'Elin Sørensen',    type: 'nps',     score: 9, comment: 'Fantastic peptide quality, fast delivery!',         status: 'reviewed',  ts: '2026-08-08T14:22:00Z' },
        { id: 'mf2', member: 'Jonas Karlsson',   type: 'feature', score: null, comment: 'Please add a dark-mode mobile app.',              status: 'pending',   ts: '2026-08-09T08:10:00Z' },
        { id: 'mf3', member: 'Maja Andersen',    type: 'product', score: 5, comment: 'BPC-157 worked wonders for my knee recovery.',       status: 'featured',  ts: '2026-08-07T19:45:00Z' },
        { id: 'mf4', member: 'Lars Lindqvist',   type: 'nps',     score: 4, comment: 'Shipping took 10 days, expected 5.',                 status: 'pending',   ts: '2026-08-09T10:05:00Z' },
        { id: 'mf5', member: 'Sigrid Olsen',     type: 'support', score: 4, comment: 'Support was helpful but slow to respond.',           status: 'reviewed',  ts: '2026-08-08T11:30:00Z' },
        { id: 'mf6', member: 'Björn Eriksson',   type: 'feature', score: null, comment: 'Bulk ordering discount should be automatic.',      status: 'pending',   ts: '2026-08-09T09:00:00Z' },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/member-feedback')
}

export async function reviewAdminMemberFeedback(id, status) {
  if (USE_MOCK) { await delay(200); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/member-feedback/${id}`, { status })
}

export async function getAdminFulfillmentCenters() {
  if (USE_MOCK) {
    await delay(300)
    return {
      stats: { centers: 4, activeOrders: 2841, avgPickTime: '4.2h', onTimeRate: 97.3 },
      centers: [
        { id: 'fc1', name: 'Oslo Hub',         country: 'NO', status: 'operational', capacity: 85, activeOrders: 1102, staff: 24, pendingStock: 0,   lastSync: '2026-08-09T12:00:00Z' },
        { id: 'fc2', name: 'Stockholm Depot',  country: 'SE', status: 'operational', capacity: 72, activeOrders: 894,  staff: 18, pendingStock: 3,   lastSync: '2026-08-09T11:45:00Z' },
        { id: 'fc3', name: 'Hamburg Center',   country: 'DE', status: 'operational', capacity: 60, activeOrders: 645,  staff: 15, pendingStock: 0,   lastSync: '2026-08-09T11:30:00Z' },
        { id: 'fc4', name: 'Copenhagen Store', country: 'DK', status: 'maintenance', capacity: 0,  activeOrders: 200,  staff: 8,  pendingStock: 12,  lastSync: '2026-08-09T08:00:00Z' },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/fulfillment-centers')
}

export async function getAdminGamification() {
  if (USE_MOCK) {
    await delay(310)
    return {
      stats: { activeBadges: 48, activeRules: 22, challengesRunning: 5, totalXPAwarded: 284920 },
      badgeCategories: [
        { id: 'bc1', name: 'Sales',        badges: 12, color: '#fbbf24' },
        { id: 'bc2', name: 'Recruitment',  badges: 8,  color: '#86efac' },
        { id: 'bc3', name: 'Wellness',     badges: 10, color: '#a5b4fc' },
        { id: 'bc4', name: 'Training',     badges: 9,  color: '#f9a8d4' },
        { id: 'bc5', name: 'Loyalty',      badges: 9,  color: '#fcd34d' },
      ],
      pointsRules: [
        { id: 'pr1', event: 'First order',          points: 500,  active: true  },
        { id: 'pr2', event: 'Recruit a member',      points: 250,  active: true  },
        { id: 'pr3', event: 'Monthly PV target hit', points: 200,  active: true  },
        { id: 'pr4', event: 'Complete training',     points: 100,  active: true  },
        { id: 'pr5', event: 'Leave product review',  points: 50,   active: true  },
        { id: 'pr6', event: 'Daily login',           points: 10,   active: false },
        { id: 'pr7', event: 'Share on social',       points: 30,   active: true  },
        { id: 'pr8', event: 'Refer a purchase',      points: 150,  active: true  },
      ],
      leaderboardConfig: { period: 'monthly', metric: 'xp', topN: 20, resetDay: 1 },
    }
  }
  return request('GET', '/v1/mlm/admin/gamification')
}

export async function toggleAdminGamificationRule(id, active) {
  if (USE_MOCK) { await delay(200); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/gamification/rules/${id}`, { active })
}

// ── Member pages ──

export async function getMemberSleepTracker() {
  if (USE_MOCK) {
    await delay(300)
    return {
      stats: { avgDuration: 7.1, avgQuality: 3.8, streak: 12, bestNight: 9.0 },
      entries: [
        { id: 'sl1', date: '2026-08-08', bedtime: '22:30', wakeTime: '06:15', duration: 7.75, quality: 4, wakeUps: 1, note: 'Felt rested', products: ['Sermorelin 2mg'] },
        { id: 'sl2', date: '2026-08-07', bedtime: '23:15', wakeTime: '06:45', duration: 7.5,  quality: 3, wakeUps: 2, note: '',           products: [] },
        { id: 'sl3', date: '2026-08-06', bedtime: '22:00', wakeTime: '06:00', duration: 8.0,  quality: 5, wakeUps: 0, note: 'Best sleep in weeks', products: ['Sermorelin 2mg'] },
        { id: 'sl4', date: '2026-08-05', bedtime: '00:00', wakeTime: '07:30', duration: 7.5,  quality: 3, wakeUps: 3, note: 'Late night', products: [] },
        { id: 'sl5', date: '2026-08-04', bedtime: '22:45', wakeTime: '06:30', duration: 7.75, quality: 4, wakeUps: 1, note: '',           products: [] },
        { id: 'sl6', date: '2026-08-03', bedtime: '23:30', wakeTime: '07:00', duration: 7.5,  quality: 4, wakeUps: 1, note: '',           products: [] },
        { id: 'sl7', date: '2026-08-02', bedtime: '22:15', wakeTime: '05:45', duration: 7.5,  quality: 5, wakeUps: 0, note: 'Peptide effect noticed', products: ['Sermorelin 2mg'] },
      ],
      weekChart: [
        { day: 'Mon', duration: 7.5 }, { day: 'Tue', duration: 7.5 }, { day: 'Wed', duration: 8.0 },
        { day: 'Thu', duration: 7.5 }, { day: 'Fri', duration: 7.75 }, { day: 'Sat', duration: 7.5 }, { day: 'Sun', duration: 7.75 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/sleep-tracker')
}

export async function addMemberSleepEntry(data) {
  if (USE_MOCK) { await delay(300); return { ok: true, id: 'sl' + Date.now() } }
  return request('POST', '/v1/mlm/member/sleep-tracker', data)
}

export async function getMemberChallengesHistory() {
  if (USE_MOCK) {
    await delay(290)
    return {
      stats: { participated: 18, won: 6, totalPrizeValue: '€840', currentStreak: 3 },
      history: [
        { id: 'ch1', title: '30-Day Recruitment Sprint', type: 'recruitment', startDate: '2026-07-01', endDate: '2026-07-31', result: 'won',    rank: 2,  prize: '€150 store credit', participants: 142 },
        { id: 'ch2', title: 'August PV Blitz',           type: 'sales',       startDate: '2026-08-01', endDate: '2026-08-31', result: 'active', rank: 7,  prize: 'Top 10: trip',      participants: 211 },
        { id: 'ch3', title: 'Summer Wellness Challenge', type: 'wellness',    startDate: '2026-06-01', endDate: '2026-06-30', result: 'won',    rank: 1,  prize: '€200 cash',         participants: 89  },
        { id: 'ch4', title: 'Peptide Protocol Month',    type: 'wellness',    startDate: '2026-05-01', endDate: '2026-05-31', result: 'missed', rank: null, prize: '€100 voucher',    participants: 67  },
        { id: 'ch5', title: 'Nordic Top Earners Q1',     type: 'sales',       startDate: '2026-01-01', endDate: '2026-03-31', result: 'won',    rank: 3,  prize: '€250 bonus',        participants: 318 },
        { id: 'ch6', title: 'Social Share Blitz',        type: 'social',      startDate: '2026-07-15', endDate: '2026-07-22', result: 'participated', rank: 14, prize: 'Gift pack', participants: 224 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/challenges-history')
}

export async function getMemberInvoiceHistory() {
  if (USE_MOCK) {
    await delay(280)
    return {
      stats: { totalInvoices: 24, totalAmount: '€6,842', ytdAmount: '€3,210', pending: 1 },
      invoices: [
        { id: 'inv1', invoiceNo: 'NV-INV-2026-0024', date: '2026-08-08', description: 'Order NV-20260808-5512', amount: 218.50, currency: 'EUR', status: 'paid',    type: 'order'      },
        { id: 'inv2', invoiceNo: 'NV-INV-2026-0023', date: '2026-08-01', description: 'Monthly Membership Fee', amount: 59.00,  currency: 'EUR', status: 'paid',    type: 'membership' },
        { id: 'inv3', invoiceNo: 'NV-INV-2026-0022', date: '2026-07-28', description: 'Order NV-20260728-4812', amount: 342.00, currency: 'EUR', status: 'paid',    type: 'order'      },
        { id: 'inv4', invoiceNo: 'NV-INV-2026-0021', date: '2026-07-15', description: 'Order NV-20260715-4420', amount: 128.00, currency: 'EUR', status: 'paid',    type: 'order'      },
        { id: 'inv5', invoiceNo: 'NV-INV-2026-0020', date: '2026-07-01', description: 'Monthly Membership Fee', amount: 59.00,  currency: 'EUR', status: 'paid',    type: 'membership' },
        { id: 'inv6', invoiceNo: 'NV-INV-2026-0019', date: '2026-09-01', description: 'Monthly Membership Fee', amount: 59.00,  currency: 'EUR', status: 'pending', type: 'membership' },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/invoice-history')
}

export async function getMemberTeamMap() {
  if (USE_MOCK) {
    await delay(310)
    return {
      stats: { countries: 8, cities: 24, totalMembers: 184, topCountry: 'Norway' },
      countries: [
        { code: 'NO', name: 'Norway',      members: 62, active: 54, flag: '🇳🇴' },
        { code: 'SE', name: 'Sweden',      members: 41, active: 37, flag: '🇸🇪' },
        { code: 'DK', name: 'Denmark',     members: 28, active: 24, flag: '🇩🇰' },
        { code: 'FI', name: 'Finland',     members: 19, active: 16, flag: '🇫🇮' },
        { code: 'DE', name: 'Germany',     members: 14, active: 11, flag: '🇩🇪' },
        { code: 'NL', name: 'Netherlands', members: 9,  active: 7,  flag: '🇳🇱' },
        { code: 'GB', name: 'UK',          members: 7,  active: 5,  flag: '🇬🇧' },
        { code: 'ES', name: 'Spain',       members: 4,  active: 4,  flag: '🇪🇸' },
      ],
      topCities: [
        { city: 'Oslo',        country: 'NO', members: 28 },
        { city: 'Stockholm',   country: 'SE', members: 22 },
        { city: 'Bergen',      country: 'NO', members: 14 },
        { city: 'Copenhagen',  country: 'DK', members: 13 },
        { city: 'Gothenburg',  country: 'SE', members: 11 },
        { city: 'Helsinki',    country: 'FI', members: 10 },
        { city: 'Trondheim',   country: 'NO', members: 9  },
        { city: 'Malmö',       country: 'SE', members: 8  },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/team-map')
}

// ── Admin: Media Library ──────────────────────────────────────────────────────
export async function getAdminMediaLibrary() {
  if (USE_MOCK) {
    await delay(310)
    return {
      stats: { totalAssets: 284, storageUsed: '1.4 GB', byType: { image: 198, video: 31, document: 42, audio: 13 } },
      assets: [
        { id: 'ma1',  name: 'hero-banner-summer.jpg',     type: 'image',    size: '2.1 MB', uploadedAt: '2026-08-07', uploadedBy: 'Admin',   folder: 'banners',    usedIn: 3,  tags: ['banner', 'summer', 'hero'] },
        { id: 'ma2',  name: 'product-tb500-front.jpg',    type: 'image',    size: '840 KB', uploadedAt: '2026-08-06', uploadedBy: 'Admin',   folder: 'products',   usedIn: 12, tags: ['product', 'tb500', 'peptide'] },
        { id: 'ma3',  name: 'welcome-webinar-aug.mp4',    type: 'video',    size: '148 MB', uploadedAt: '2026-08-05', uploadedBy: 'Admin',   folder: 'videos',     usedIn: 1,  tags: ['webinar', 'onboarding'] },
        { id: 'ma4',  name: 'compensation-plan-v3.pdf',   type: 'document', size: '3.2 MB', uploadedAt: '2026-07-30', uploadedBy: 'Admin',   folder: 'documents',  usedIn: 8,  tags: ['comp-plan', 'pdf', 'mlm'] },
        { id: 'ma5',  name: 'logo-dark.svg',              type: 'image',    size: '18 KB',  uploadedAt: '2026-07-15', uploadedBy: 'Admin',   folder: 'branding',   usedIn: 22, tags: ['logo', 'branding'] },
        { id: 'ma6',  name: 'peptide-guide-2026.pdf',     type: 'document', size: '5.6 MB', uploadedAt: '2026-07-10', uploadedBy: 'Admin',   folder: 'documents',  usedIn: 4,  tags: ['guide', 'peptides', 'science'] },
        { id: 'ma7',  name: 'social-template-ig.jpg',     type: 'image',    size: '420 KB', uploadedAt: '2026-08-01', uploadedBy: 'Admin',   folder: 'social',     usedIn: 0,  tags: ['social', 'instagram', 'template'] },
        { id: 'ma8',  name: 'intro-jingle.mp3',           type: 'audio',    size: '2.8 MB', uploadedAt: '2026-06-20', uploadedBy: 'Admin',   folder: 'audio',      usedIn: 2,  tags: ['audio', 'jingle'] },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/media-library')
}

export async function deleteAdminMediaAsset(id) {
  if (USE_MOCK) { await delay(250); return { ok: true } }
  return request('DELETE', `/v1/mlm/admin/media-library/${id}`)
}

// ── Admin: Customer Journey Builder ──────────────────────────────────────────
export async function getAdminCustomerJourneys() {
  if (USE_MOCK) {
    await delay(320)
    return {
      journeys: [
        {
          id: 'jny1', name: 'New Member Onboarding', status: 'active', touchpoints: 7, enrolled: 1842, converted: 1520, conversionRate: 82.5, avgDays: 14,
          stages: [
            { id: 's1', name: 'Welcome Email',      type: 'awareness',     trigger: 'account_created',  delayDays: 0,  actions: ['Email: Welcome', 'Push: App Download'], completed: 1842, dropOff: 0   },
            { id: 's2', name: 'First Purchase Push', type: 'consideration', trigger: 'welcome_opened',   delayDays: 2,  actions: ['Email: First Order Offer', 'SMS: Discount Code'], completed: 1730, dropOff: 6   },
            { id: 's3', name: 'Onboarding Call CTA', type: 'decision',     trigger: 'browsed_products', delayDays: 4,  actions: ['Email: Book a Call', 'In-App: Banner'], completed: 1620, dropOff: 6.4 },
            { id: 's4', name: 'Kit Setup Guide',     type: 'onboarding',   trigger: 'first_purchase',   delayDays: 1,  actions: ['Email: Getting Started', 'Video: Protocol Guide'], completed: 1580, dropOff: 2.5 },
            { id: 's5', name: 'Day 14 Check-In',     type: 'retention',    trigger: 'day_14',           delayDays: 14, actions: ['Email: Progress Check', 'Survey: NPS'], completed: 1540, dropOff: 2.5 },
            { id: 's6', name: 'Referral Invite',     type: 'advocacy',     trigger: 'nps_9_10',         delayDays: 1,  actions: ['Email: Share & Earn', 'Push: Referral Link'], completed: 1520, dropOff: 1.3 },
          ],
        },
        {
          id: 'jny2', name: 'Churn Recovery',         status: 'active', touchpoints: 4, enrolled: 312, converted: 87,  conversionRate: 27.9, avgDays: 21,
          stages: [
            { id: 's1', name: 'Lapsed Alert',        type: 'awareness',    trigger: '30_days_inactive', delayDays: 0,  actions: ['Email: We miss you!', 'SMS: Come back offer'], completed: 312, dropOff: 0   },
            { id: 's2', name: 'Win-Back Offer',      type: 'consideration', trigger: 'email_opened',     delayDays: 3,  actions: ['Email: 20% Off', 'Push: Exclusive Deal'], completed: 180, dropOff: 42  },
            { id: 's3', name: 'Personal Outreach',   type: 'decision',     trigger: 'no_response_7d',   delayDays: 7,  actions: ['Task: Upline Call', 'Email: Check-in'], completed: 120, dropOff: 33  },
            { id: 's4', name: 'Final Offer',         type: 'retention',    trigger: 'still_inactive',   delayDays: 14, actions: ['Email: Last Chance', 'SMS: Gift Code'], completed: 87,  dropOff: 27  },
          ],
        },
        {
          id: 'jny3', name: 'Rank Advancement',       status: 'draft',  touchpoints: 5, enrolled: 0,   converted: 0,   conversionRate: 0,    avgDays: 0,
          stages: [],
        },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/customer-journeys')
}

// ── Admin: Commission Clawbacks ───────────────────────────────────────────────
export async function getAdminCommissionClawbacks() {
  if (USE_MOCK) {
    await delay(290)
    return {
      stats: { pending: 4, thisMonth: 1840, ytdRecovered: 12480, avgResolutionDays: 4 },
      clawbacks: [
        { id: 'cb1', memberName: 'Ingrid Solberg',   orderId: 'NV-5501', reason: 'return',     amount: 128.00, date: '2026-08-08', status: 'pending',    note: null                    },
        { id: 'cb2', memberName: 'Lars Bakken',      orderId: 'NV-5420', reason: 'chargeback', amount: 242.50, date: '2026-08-07', status: 'pending',    note: null                    },
        { id: 'cb3', memberName: 'Sofia Lindqvist',  orderId: 'NV-5308', reason: 'fraud',      amount: 480.00, date: '2026-08-05', status: 'processing', note: 'Under investigation'   },
        { id: 'cb4', memberName: 'Erik Andersen',    orderId: 'NV-5210', reason: 'cancel',     amount: 64.00,  date: '2026-08-03', status: 'completed',  note: 'Auto-processed'        },
        { id: 'cb5', memberName: 'Maja Kristiansen', orderId: 'NV-5190', reason: 'policy',     amount: 95.00,  date: '2026-08-02', status: 'waived',     note: 'First-time violation'  },
        { id: 'cb6', memberName: 'Tobias Nilsson',   orderId: 'NV-5130', reason: 'return',     amount: 186.00, date: '2026-07-30', status: 'completed',  note: null                    },
        { id: 'cb7', memberName: 'Astrid Holm',      orderId: 'NV-5080', reason: 'chargeback', amount: 312.00, date: '2026-07-25', status: 'disputed',   note: 'Member contesting'     },
        { id: 'cb8', memberName: 'Per Hansen',       orderId: 'NV-4960', reason: 'cancel',     amount: 48.00,  date: '2026-07-18', status: 'pending',    note: null                    },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/commission-clawbacks')
}

export async function processAdminClawback(id, action, note) {
  if (USE_MOCK) { await delay(300); return { ok: true } }
  return request('POST', `/v1/mlm/admin/commission-clawbacks/${id}/process`, { action, note })
}

// ── Admin: Address Validation ─────────────────────────────────────────────────
export async function getAdminAddressValidation() {
  if (USE_MOCK) {
    await delay(280)
    return {
      stats: { activeRules: 8, validatedToday: 214, failedRate: 2.8, autoCorrected: 41 },
      rules: [
        { id: 'ar1', name: 'Required Fields Check',   type: 'required', description: 'Ensure street, city, postcode, and country are present.',                      active: true,  countries: [] },
        { id: 'ar2', name: 'Postcode Format — EU',    type: 'format',   description: 'Validate postcode against country-specific regex patterns for EU countries.',  active: true,  countries: ['NO', 'SE', 'DK', 'FI', 'DE', 'NL'] },
        { id: 'ar3', name: 'Geocode Lookup',          type: 'geocode',  description: 'Resolve address to lat/lng coordinates for shipping zone assignment.',         active: true,  countries: [] },
        { id: 'ar4', name: 'PO Box Restriction',      type: 'restrict', description: 'Block PO Box addresses for physical product orders.',                           active: true,  countries: [] },
        { id: 'ar5', name: 'Address Auto-Correction', type: 'format',   description: 'Attempt auto-correction of minor typos via address normalisation service.',    active: true,  countries: ['NO', 'SE', 'DK'] },
        { id: 'ar6', name: 'Forwarding Address Block',type: 'restrict', description: 'Flag known mail-forwarding service addresses for manual review.',               active: false, countries: ['GB', 'US'] },
        { id: 'ar7', name: 'Apartment/Unit Required', type: 'required', description: 'Require apartment or unit number for high-rise postal codes.',                  active: false, countries: ['NO'] },
        { id: 'ar8', name: 'Phone Cross-Check',       type: 'geocode',  description: 'Verify phone country code matches shipping address country.',                   active: true,  countries: [] },
      ],
      failures: [
        { id: 'af1', memberName: 'Ingrid Solberg',  address: 'Gateveien 1, 9999 Ukjentby, NO',     reason: 'Invalid Postcode',    date: '2026-08-09' },
        { id: 'af2', memberName: 'Lars Bakken',     address: 'PO Box 420, Stockholm, SE',           reason: 'PO Box Restricted',   date: '2026-08-09' },
        { id: 'af3', memberName: 'Sofia Lindqvist', address: 'Hauptstrasse 5, , DE',                reason: 'Missing City',        date: '2026-08-08' },
        { id: 'af4', memberName: 'Erik Andersen',   address: 'Torvet 12, 1000 Kobenhavn, DK',       reason: 'Geocode Failed',      date: '2026-08-08' },
        { id: 'af5', memberName: 'Maja Kristiansen',address: 'Fjordgate 7, 5020 Bergan, NO',        reason: 'Auto-Corrected',      date: '2026-08-07' },
      ],
      countries: [
        { code: 'NO', name: 'Norway',      flag: '🇳🇴', postcodeFormat: '#####',    geocodeEnabled: true,  failRate: 1.8 },
        { code: 'SE', name: 'Sweden',      flag: '🇸🇪', postcodeFormat: '### ##',   geocodeEnabled: true,  failRate: 2.1 },
        { code: 'DK', name: 'Denmark',     flag: '🇩🇰', postcodeFormat: '####',     geocodeEnabled: true,  failRate: 1.4 },
        { code: 'FI', name: 'Finland',     flag: '🇫🇮', postcodeFormat: '#####',    geocodeEnabled: true,  failRate: 2.9 },
        { code: 'DE', name: 'Germany',     flag: '🇩🇪', postcodeFormat: '#####',    geocodeEnabled: true,  failRate: 3.2 },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱', postcodeFormat: '#### XX',  geocodeEnabled: false, failRate: 5.1 },
        { code: 'GB', name: 'UK',          flag: '🇬🇧', postcodeFormat: 'AN# #AA',  geocodeEnabled: false, failRate: 6.7 },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/address-validation')
}

export async function toggleAdminAddressRule(id, active) {
  if (USE_MOCK) { await delay(200); return { ok: true } }
  return request('PATCH', `/v1/mlm/admin/address-validation/rules/${id}`, { active })
}

// ── Member: XP History ────────────────────────────────────────────────────────
export async function getMemberXpHistory() {
  if (USE_MOCK) {
    await delay(300)
    return {
      stats: { totalXp: 18420, thisMonth: 1240, redeemedYtd: 5800, expiringSoon: 600, nextTierXp: 25000, nextTierName: 'Platinum' },
      transactions: [
        { id: 'xp1',  type: 'earn',       description: 'Purchase — Order NV-5501',         source: 'Purchase',     date: '2026-08-08', xp: 218,  balance: 18420 },
        { id: 'xp2',  type: 'bonus',      description: 'August Loyalty Bonus',              source: 'System',       date: '2026-08-01', xp: 500,  balance: 18202 },
        { id: 'xp3',  type: 'earn',       description: 'Daily Check-In Streak (30 days)',   source: 'Check-In',     date: '2026-08-01', xp: 150,  balance: 17702 },
        { id: 'xp4',  type: 'earn',       description: 'Referral — Ingrid joined',          source: 'Referral',     date: '2026-07-29', xp: 300,  balance: 17552 },
        { id: 'xp5',  type: 'redeem',     description: 'Redeemed for €10 store credit',    source: 'Redemption',   date: '2026-07-25', xp: 1000, balance: 17252 },
        { id: 'xp6',  type: 'earn',       description: 'Purchase — Order NV-5420',         source: 'Purchase',     date: '2026-07-22', xp: 186,  balance: 18252 },
        { id: 'xp7',  type: 'earn',       description: 'Training Module Completed',        source: 'Training',     date: '2026-07-18', xp: 75,   balance: 18066 },
        { id: 'xp8',  type: 'expire',     description: 'Points expiry — July 2025 batch', source: 'System',       date: '2026-07-01', xp: 600,  balance: 17991 },
        { id: 'xp9',  type: 'bonus',      description: 'Rank Promotion Bonus — Gold',      source: 'MLM',          date: '2026-06-15', xp: 1000, balance: 18591 },
        { id: 'xp10', type: 'adjustment', description: 'Manual Adjustment — Support',      source: 'Admin',        date: '2026-06-10', xp: 50,   balance: 17591 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/xp-history')
}

// ── Member: Daily Check-In ────────────────────────────────────────────────────
export async function getMemberDailyCheckin() {
  if (USE_MOCK) {
    await delay(260)
    return {
      checkedInToday: false,
      streak: 12,
      longestStreak: 31,
      xpEarned: 1080,
      totalCheckins: 84,
      dailyXp: 10,
      history: [
        { date: '2026-08-08', mood: 5, xp: 10, note: 'Great training session today!' },
        { date: '2026-08-07', mood: 4, xp: 10, note: null },
        { date: '2026-08-06', mood: 3, xp: 10, note: 'Tired but pushed through.' },
        { date: '2026-08-05', mood: 4, xp: 10, note: null },
        { date: '2026-08-04', mood: 5, xp: 10, note: 'New personal record!' },
        { date: '2026-08-03', mood: 2, xp: 10, note: 'Rough day.' },
        { date: '2026-08-02', mood: 4, xp: 10, note: null },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/daily-checkin')
}

export async function postMemberCheckin(data) {
  if (USE_MOCK) { await delay(280); return { ok: true, xpEarned: 10 } }
  return request('POST', '/v1/mlm/member/daily-checkin', data)
}

// ── Member: Fitness Tracker ───────────────────────────────────────────────────
export async function getMemberFitnessTracker() {
  if (USE_MOCK) {
    await delay(290)
    return {
      stats: { sessionsThisMonth: 14, totalMinutes: 1020, caloriesBurned: 8400, activeStreak: 5 },
      weekChart: [
        { day: 'Mon', minutes: 45 }, { day: 'Tue', minutes: 0 }, { day: 'Wed', minutes: 60 },
        { day: 'Thu', minutes: 30 }, { day: 'Fri', minutes: 50 }, { day: 'Sat', minutes: 75 }, { day: 'Sun', minutes: 0 },
      ],
      sessions: [
        { id: 'fs1', type: 'running',      date: '2026-08-09', duration: 50, intensity: 'high',   calories: 480, notes: 'Morning 8k run' },
        { id: 'fs2', type: 'weightlifting', date: '2026-08-07', duration: 75, intensity: 'high',   calories: 420, notes: 'Push day' },
        { id: 'fs3', type: 'cycling',      date: '2026-08-06', duration: 60, intensity: 'medium', calories: 380, notes: null },
        { id: 'fs4', type: 'yoga',         date: '2026-08-04', duration: 45, intensity: 'low',    calories: 120, notes: 'Recovery session' },
        { id: 'fs5', type: 'running',      date: '2026-08-02', duration: 35, intensity: 'medium', calories: 310, notes: null },
        { id: 'fs6', type: 'hiit',         date: '2026-08-01', duration: 30, intensity: 'high',   calories: 350, notes: 'Tabata protocol' },
        { id: 'fs7', type: 'swimming',     date: '2026-07-30', duration: 45, intensity: 'medium', calories: 290, notes: null },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/fitness-tracker')
}

export async function addMemberFitnessSession(data) {
  if (USE_MOCK) { await delay(280); return { ok: true } }
  return request('POST', '/v1/mlm/member/fitness-tracker', data)
}

// ── Member: Recipe Library ────────────────────────────────────────────────────
export async function getMemberRecipeLibrary() {
  if (USE_MOCK) {
    await delay(310)
    return {
      recipes: [
        {
          id: 'rc1', emoji: '🥤', name: 'Nordic Recovery Shake', category: 'smoothies', prepMinutes: 5, calories: 320, rating: 4.8,
          tags: ['protein', 'post-workout', 'peptide'], macros: { protein: 42, carbs: 28, fat: 6 },
          ingredients: ['2 scoops Nordic Whey', '200ml oat milk', '1 banana', '1 tsp collagen peptides', '5 ice cubes'],
          steps: ['Add all ingredients to blender.', 'Blend on high for 30 seconds.', 'Pour and consume within 30 minutes post-workout.'],
          productLinks: ['Nordic Whey Protein', 'Collagen Peptide Complex'],
        },
        {
          id: 'rc2', emoji: '🥗', name: 'Peptide Power Salad', category: 'meals', prepMinutes: 15, calories: 480, rating: 4.6,
          tags: ['high-protein', 'lunch', 'anti-inflammatory'], macros: { protein: 38, carbs: 32, fat: 18 },
          ingredients: ['200g grilled salmon', '100g quinoa (cooked)', 'Cucumber, tomato, spinach', '1 tbsp olive oil', 'Lemon juice, salt, pepper'],
          steps: ['Cook quinoa per package instructions.', 'Grill salmon 4 min per side.', 'Toss greens with olive oil and lemon.', 'Plate quinoa base, top with salmon and salad.'],
          productLinks: ['Omega-3 Complex'],
        },
        {
          id: 'rc3', emoji: '🍌', name: 'GH-Support Smoothie Bowl', category: 'smoothies', prepMinutes: 8, calories: 390, rating: 4.7,
          tags: ['gh-support', 'breakfast', 'peptide'], macros: { protein: 28, carbs: 52, fat: 8 },
          ingredients: ['1 frozen banana', '150ml almond milk', '1 scoop BPC-157 blend', 'Blueberries, granola, chia seeds for topping'],
          steps: ['Blend banana and almond milk until thick.', 'Pour into bowl.', 'Top with blueberries, granola, chia seeds.', 'Serve immediately.'],
          productLinks: ['BPC-157 Blend', 'Nordic Greens'],
        },
        {
          id: 'rc4', emoji: '🍳', name: 'High-Protein Nordic Omelette', category: 'meals', prepMinutes: 12, calories: 420, rating: 4.5,
          tags: ['breakfast', 'keto-friendly', 'quick'], macros: { protein: 34, carbs: 8, fat: 28 },
          ingredients: ['4 eggs', '50g smoked salmon', '30g cream cheese', 'Fresh dill, chives', '1 tsp butter', 'Salt and pepper'],
          steps: ['Whisk eggs with salt and pepper.', 'Melt butter in non-stick pan over medium heat.', 'Pour eggs, cook until edges set.', 'Add salmon, cream cheese, herbs.', 'Fold and serve.'],
          productLinks: [],
        },
        {
          id: 'rc5', emoji: '🧁', name: 'Collagen Protein Balls', category: 'snacks', prepMinutes: 20, calories: 180, rating: 4.9,
          tags: ['snack', 'no-bake', 'collagen'], macros: { protein: 12, carbs: 18, fat: 7 },
          ingredients: ['1 cup rolled oats', '2 scoops collagen peptides', '3 tbsp honey', '2 tbsp peanut butter', '1 tsp vanilla'],
          steps: ['Mix all ingredients in a bowl until combined.', 'Refrigerate 15 minutes.', 'Roll into 12 balls.', 'Store refrigerated up to 1 week.'],
          productLinks: ['Collagen Peptide Complex'],
        },
        {
          id: 'rc6', emoji: '☕', name: 'Nootropic Morning Coffee', category: 'supplements', prepMinutes: 5, calories: 80, rating: 4.4,
          tags: ['morning', 'focus', 'nootropic'], macros: { protein: 2, carbs: 4, fat: 5 },
          ingredients: ['250ml freshly brewed coffee', '1 tsp MCT oil', '1/2 scoop Nordic Focus blend', '1 tsp collagen peptides', 'Optional: splash of oat milk'],
          steps: ['Brew coffee.', 'Add MCT oil and Nordic Focus blend.', 'Blend 15 seconds or use a frother.', 'Add collagen, stir, drink immediately.'],
          productLinks: ['Nordic Focus Blend', 'Collagen Peptide Complex'],
        },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/recipe-library')
}

// ── Admin: Heat Maps ──────────────────────────────────────────────────────────
export async function getAdminHeatMaps() {
  if (USE_MOCK) {
    await delay(340)
    return {
      summary: { avgDepth: '67%', topConverting: 'Pricing', deadZones: 3, sessions: '18,420' },
      matrix: {
        Landing: {
          all:     { header: 8200, hero: 14600, products: 11300, testimonials: 6800, pricing: 9400, footer: 2100 },
          desktop: { header: 4900, hero: 9200, products: 7100, testimonials: 4100, pricing: 6200, footer: 1400 },
          mobile:  { header: 2800, hero: 4200, products: 3400, testimonials: 2100, pricing: 2600, footer: 600 },
          tablet:  { header: 500, hero: 1200, products: 800, testimonials: 600, pricing: 600, footer: 100 },
        },
        Shop: {
          all:     { header: 6100, hero: 4200, products: 18900, testimonials: 2100, pricing: 7600, footer: 1800 },
          desktop: { header: 3600, hero: 2600, products: 12400, testimonials: 1200, pricing: 4900, footer: 1100 },
          mobile:  { header: 2100, hero: 1400, products: 5400, testimonials: 700, pricing: 2200, footer: 600 },
          tablet:  { header: 400, hero: 200, products: 1100, testimonials: 200, pricing: 500, footer: 100 },
        },
        'Product Detail': {
          all:     { header: 3100, hero: 9800, products: 12600, testimonials: 7200, pricing: 14800, footer: 2400 },
          desktop: { header: 1900, hero: 6200, products: 8100, testimonials: 4600, pricing: 9600, footer: 1500 },
          mobile:  { header: 1000, hero: 2900, products: 3700, testimonials: 2200, pricing: 4400, footer: 700 },
          tablet:  { header: 200, hero: 700, products: 800, testimonials: 400, pricing: 800, footer: 200 },
        },
        Join: {
          all:     { header: 2800, hero: 9400, products: 3200, testimonials: 5600, pricing: 12400, footer: 1600 },
          desktop: { header: 1700, hero: 5900, products: 1900, testimonials: 3500, pricing: 8100, footer: 1000 },
          mobile:  { header: 900, hero: 2800, products: 1000, testimonials: 1700, pricing: 3600, footer: 500 },
          tablet:  { header: 200, hero: 700, products: 300, testimonials: 400, pricing: 700, footer: 100 },
        },
        Dashboard: {
          all:     { header: 9200, hero: 6100, products: 4800, testimonials: 1200, pricing: 2400, footer: 3600 },
          desktop: { header: 6100, hero: 4200, products: 3300, testimonials: 800, pricing: 1600, footer: 2400 },
          mobile:  { header: 2600, hero: 1600, products: 1200, testimonials: 300, pricing: 700, footer: 1000 },
          tablet:  { header: 500, hero: 300, products: 300, testimonials: 100, pricing: 100, footer: 200 },
        },
        Checkout: {
          all:     { header: 1800, hero: 3200, products: 2600, testimonials: 800, pricing: 6800, footer: 900 },
          desktop: { header: 1100, hero: 2100, products: 1700, testimonials: 500, pricing: 4400, footer: 600 },
          mobile:  { header: 600, hero: 900, products: 700, testimonials: 200, pricing: 2000, footer: 250 },
          tablet:  { header: 100, hero: 200, products: 200, testimonials: 100, pricing: 400, footer: 50 },
        },
      },
      pageRankings: [
        { page: 'Product Detail', engagementScore: 82 },
        { page: 'Checkout',       engagementScore: 76 },
        { page: 'Join',           engagementScore: 71 },
        { page: 'Landing',        engagementScore: 64 },
        { page: 'Shop',           engagementScore: 58 },
        { page: 'Dashboard',      engagementScore: 49 },
      ],
      dropoffs: [
        { section: 'hero → products',       dropPct: 22 },
        { section: 'products → testimonials', dropPct: 38 },
        { section: 'pricing → checkout',    dropPct: 61 },
        { section: 'cart → payment',        dropPct: 44 },
      ],
      scrollDepth: { 25: 91, 50: 74, 75: 52, 90: 34, 100: 18 },
    }
  }
  return request('GET', '/v1/mlm/admin/heat-maps')
}

// ── Admin: Error Tracking ─────────────────────────────────────────────────────
export async function getAdminErrorTracking() {
  if (USE_MOCK) {
    await delay(310)
    const makeStack = (fn, file) => `Error: ${fn}\n  at ${fn} (${file}:42:18)\n  at processRequest (middleware/auth.js:88:12)\n  at Layer.handle (express/lib/router/layer.js:95:5)`
    return {
      stats: { open: 14, critical: 3, usersHit: '2,841', resolved7d: 29, mttr: '4.2h' },
      errors: [
        { id: 'e1', message: 'Cannot read properties of undefined (reading \'token\')', location: 'src/auth/tokenRefresh.js:42', severity: 'critical', status: 'open', occurrences: 1842, firstSeen: '2026-08-07', lastSeen: '2026-08-09 14:32', usersAffected: '342', browser: 'Chrome 126', stackTrace: makeStack("Cannot read properties of undefined (reading 'token')", 'src/auth/tokenRefresh.js') },
        { id: 'e2', message: 'Failed to fetch: Network request to /v1/mlm/member/commissions failed', location: 'src/api/mlmApi.js:1204', severity: 'high', status: 'open', occurrences: 612, firstSeen: '2026-08-08', lastSeen: '2026-08-09 13:48', usersAffected: '128', browser: 'Safari 17', stackTrace: makeStack('Failed to fetch', 'src/api/mlmApi.js') },
        { id: 'e3', message: 'ChunkLoadError: Loading chunk 14 failed', location: 'webpack/runtime/chunk loading:34', severity: 'high', status: 'open', occurrences: 409, firstSeen: '2026-08-06', lastSeen: '2026-08-09 12:11', usersAffected: '89', browser: 'Firefox 128', stackTrace: makeStack('ChunkLoadError', 'webpack/runtime/chunk') },
        { id: 'e4', message: 'RangeError: Maximum call stack size exceeded', location: 'src/pages/dashboard/Tree.jsx:188', severity: 'critical', status: 'open', occurrences: 38, firstSeen: '2026-08-09', lastSeen: '2026-08-09 11:54', usersAffected: '12', browser: 'Chrome 126', stackTrace: makeStack('Maximum call stack size exceeded', 'src/pages/dashboard/Tree.jsx') },
        { id: 'e5', message: 'TypeError: cart.items.reduce is not a function', location: 'src/pages/Checkout.jsx:76', severity: 'medium', status: 'open', occurrences: 212, firstSeen: '2026-08-05', lastSeen: '2026-08-09 10:22', usersAffected: '44', browser: 'Edge 124', stackTrace: makeStack('cart.items.reduce is not a function', 'src/pages/Checkout.jsx') },
        { id: 'e6', message: 'SyntaxError: Unexpected token < in JSON at position 0', location: 'src/api/mlmApi.js:44', severity: 'medium', status: 'resolved', occurrences: 88, firstSeen: '2026-08-03', lastSeen: '2026-08-08 09:14', usersAffected: '18', browser: 'Chrome 125', stackTrace: makeStack('Unexpected token < in JSON', 'src/api/mlmApi.js') },
        { id: 'e7', message: 'Warning: Each child in a list should have a unique "key" prop', location: 'src/pages/Shop.jsx:211', severity: 'low', status: 'ignored', occurrences: 3280, firstSeen: '2026-08-01', lastSeen: '2026-08-09 08:00', usersAffected: '0', browser: 'All', stackTrace: 'Warning in Shop.jsx:211\n  in ProductCard\n  in ul\n  in Shop' },
        { id: 'e8', message: 'Unhandled Promise Rejection: Request timeout after 30000ms', location: 'src/api/mlmApi.js:28', severity: 'critical', status: 'open', occurrences: 94, firstSeen: '2026-08-08', lastSeen: '2026-08-09 09:41', usersAffected: '31', browser: 'Chrome 126', stackTrace: makeStack('Request timeout', 'src/api/mlmApi.js') },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/error-tracking')
}

export async function resolveAdminError(id) {
  if (USE_MOCK) { await delay(240); return { ok: true } }
  return request('POST', `/v1/mlm/admin/error-tracking/${id}/resolve`)
}

// ── Admin: Content Performance ────────────────────────────────────────────────
export async function getAdminContentPerformance() {
  if (USE_MOCK) {
    await delay(320)
    return {
      stats: { totalViews: '142,800', avgTime: '3m 24s', convAssists: '2,140', topCategory: 'Peptides', bounceRate: '52%' },
      content: [
        { id: 'c1', title: 'BPC-157: The Complete Guide for Nordic Members', type: 'blog', views: 28400, avgTime: '6m 12s', convAssists: 380, shares: 1240, bounceRate: 38, publishedAt: '2026-07-14' },
        { id: 'c2', title: 'How to Build Your First MLM Team: Step-by-Step', type: 'resource', views: 21600, avgTime: '8m 45s', convAssists: 610, shares: 890, bounceRate: 29, publishedAt: '2026-06-22' },
        { id: 'c3', title: 'Nordic Vitals Compensation Plan Explained', type: 'video', views: 18900, avgTime: '12m 30s', convAssists: 540, shares: 620, bounceRate: 22, publishedAt: '2026-07-01' },
        { id: 'c4', title: 'Peptides for Recovery: What the Science Says', type: 'blog', views: 14200, avgTime: '4m 58s', convAssists: 210, shares: 480, bounceRate: 44, publishedAt: '2026-07-28' },
        { id: 'c5', title: 'Join Page — Scandinavia Edition', type: 'landing', views: 12800, avgTime: '1m 42s', convAssists: 820, shares: 140, bounceRate: 71, publishedAt: '2026-05-15' },
        { id: 'c6', title: 'GHK-Cu Copper Peptide: Member FAQ', type: 'resource', views: 9400, avgTime: '5m 14s', convAssists: 160, shares: 310, bounceRate: 41, publishedAt: '2026-08-01' },
        { id: 'c7', title: 'Social Media Playbook for Nordic Distributors', type: 'resource', views: 8100, avgTime: '7m 22s', convAssists: 290, shares: 560, bounceRate: 33, publishedAt: '2026-06-10' },
        { id: 'c8', title: 'Nordic Vitals Product Range Overview', type: 'video', views: 7600, avgTime: '9m 44s', convAssists: 180, shares: 240, bounceRate: 28, publishedAt: '2026-07-18' },
        { id: 'c9', title: 'MLM Income Myths Debunked', type: 'blog', views: 6800, avgTime: '3m 52s', convAssists: 88, shares: 420, bounceRate: 62, publishedAt: '2026-08-04' },
        { id: 'c10', title: 'Autoship Setup Landing Page — NO', type: 'landing', views: 5200, avgTime: '2m 08s', convAssists: 340, shares: 60, bounceRate: 58, publishedAt: '2026-06-30' },
      ],
      categoryBreakdown: [
        { category: 'peptides',    views: 52000 },
        { category: 'business',    views: 38400 },
        { category: 'recruitment', views: 28800 },
        { category: 'wellness',    views: 14200 },
        { category: 'compliance',  views: 9400 },
      ],
      trafficSources: [
        { source: 'Organic Search', pct: 38 },
        { source: 'Direct',         pct: 24 },
        { source: 'Social Media',   pct: 19 },
        { source: 'Email',          pct: 12 },
        { source: 'Referral',       pct: 7 },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/content-performance')
}

// ── Admin: Regulatory Reports ─────────────────────────────────────────────────
export async function getAdminRegulatoryReports() {
  if (USE_MOCK) {
    await delay(290)
    return {
      stats: { total: 28, overdue: 1, dueSoon: 3, jurisdictions: 6 },
      reports: [
        { id: 'r1', name: 'Norway Income Disclosure 2025', type: 'income_disclosure',     jurisdiction: 'Norway', period: '2025 Annual', dueDate: '2026-03-31', status: 'current' },
        { id: 'r2', name: 'EU Business Opportunity Disclosure', type: 'business_opportunity', jurisdiction: 'EU',     period: 'Q1 2026',    dueDate: '2026-04-30', status: 'current' },
        { id: 'r3', name: 'Sweden Annual Compliance Filing', type: 'annual_compliance',   jurisdiction: 'Sweden', period: '2025 Annual', dueDate: '2026-04-01', status: 'current' },
        { id: 'r4', name: 'US FTC Earnings Disclosure',     type: 'ftc_disclosure',       jurisdiction: 'US',     period: 'Q2 2026',    dueDate: '2026-09-30', status: 'due_soon' },
        { id: 'r5', name: 'Denmark Earnings Claim Review',  type: 'earnings_claim',       jurisdiction: 'Denmark', period: 'Q2 2026',   dueDate: '2026-09-15', status: 'due_soon' },
        { id: 'r6', name: 'Finland MLM Compliance Report',  type: 'annual_compliance',   jurisdiction: 'Finland', period: '2025 Annual', dueDate: '2026-03-15', status: 'overdue' },
        { id: 'r7', name: 'Norway Q1 Earnings Statement',   type: 'earnings_claim',       jurisdiction: 'Norway', period: 'Q1 2026',    dueDate: '2026-05-30', status: 'current' },
        { id: 'r8', name: 'EU GDPR Income Data Disclosure', type: 'income_disclosure',    jurisdiction: 'EU',     period: '2025 Annual', dueDate: '2026-05-25', status: 'current' },
        { id: 'r9', name: 'Sweden Income Disclosure 2025',  type: 'income_disclosure',    jurisdiction: 'Sweden', period: '2025 Annual', dueDate: '2026-04-30', status: 'current' },
        { id: 'r10', name: 'US FTC Business Opportunity',   type: 'business_opportunity', jurisdiction: 'US',     period: 'Q3 2026',    dueDate: '2026-10-30', status: 'draft' },
      ],
      upcomingDeadlines: [
        { id: 'd1', name: 'US FTC Earnings Disclosure',    jurisdiction: 'US',      type: 'FTC', day: '30', month: 'SEP', status: 'due_soon', daysLeft: 52 },
        { id: 'd2', name: 'Denmark Earnings Claim',        jurisdiction: 'Denmark', type: 'Earnings', day: '15', month: 'SEP', status: 'due_soon', daysLeft: 37 },
        { id: 'd3', name: 'Norway Q3 Earnings Statement',  jurisdiction: 'Norway',  type: 'Earnings', day: '31', month: 'OCT', status: 'due_soon', daysLeft: 83 },
      ],
      incomeDisclosure: [
        { rank: 'Starter',     avg: 'kr 0',      pct: 31 },
        { rank: 'Bronze',      avg: 'kr 4,200',   pct: 28 },
        { rank: 'Silver',      avg: 'kr 18,600',  pct: 22 },
        { rank: 'Gold',        avg: 'kr 64,800',  pct: 13 },
        { rank: 'Platinum',    avg: 'kr 180,000', pct: 5 },
        { rank: 'Diamond',     avg: 'kr 480,000', pct: 1 },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/regulatory-reports')
}

// ── Member: Water Tracker ─────────────────────────────────────────────────────
export async function getMemberWaterTracker() {
  if (USE_MOCK) {
    await delay(280)
    return {
      today: { intake: 1400, goal: 2500 },
      stats: { weekAvg: '2,180 ml', streak: 9, best: '3,200 ml' },
      hourly: { 7: 250, 8: 0, 9: 350, 10: 0, 11: 250, 12: 300, 13: 0, 14: 250, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0 },
      log: [
        { id: 'w1', time: '14:22', ml: 250, source: 'water' },
        { id: 'w2', time: '12:08', ml: 300, source: 'water' },
        { id: 'w3', time: '11:45', ml: 250, source: 'water' },
        { id: 'w4', time: '09:30', ml: 350, source: 'nordic_shake' },
        { id: 'w5', time: '07:15', ml: 250, source: 'water' },
      ],
      tip: 'Peptide supplementation works best when you are well-hydrated. Aim for 35ml per kg of bodyweight. If you weigh 70kg, that is 2,450ml per day — water, herbal teas, and nutrient drinks all count.',
    }
  }
  return request('GET', '/v1/mlm/member/water-tracker')
}

export async function logMemberWaterIntake(data) {
  if (USE_MOCK) { await delay(200); return { ok: true } }
  return request('POST', '/v1/mlm/member/water-tracker', data)
}

// ── Member: Mindfulness ───────────────────────────────────────────────────────
export async function getMemberMindfulness() {
  if (USE_MOCK) {
    await delay(300)
    return {
      stats: { streak: 12, monthSessions: 24, totalMinutes: 860, avgMoodLift: 1.4 },
      sessions: [
        { id: 'm1', type: 'meditation',   duration: 15, mood: 5, date: 'Today',     notes: null },
        { id: 'm2', type: 'breathing',    duration: 10, mood: 4, date: 'Yesterday', notes: 'Box breathing before the team call' },
        { id: 'm3', type: 'body_scan',    duration: 20, mood: 4, date: '2026-08-07', notes: null },
        { id: 'm4', type: 'visualization', duration: 10, mood: 5, date: '2026-08-06', notes: 'Visualized closing a new recruit' },
        { id: 'm5', type: 'meditation',   duration: 15, mood: 3, date: '2026-08-05', notes: 'Distracted — tried anyway' },
        { id: 'm6', type: 'journaling',   duration: 10, mood: 4, date: '2026-08-04', notes: null },
        { id: 'm7', type: 'breathing',    duration: 5,  mood: 5, date: '2026-08-03', notes: 'Quick reset mid-afternoon' },
        { id: 'm8', type: 'meditation',   duration: 20, mood: 5, date: '2026-08-02', notes: null },
      ],
      moodByType: [
        { type: 'visualization', avg: 4.7 },
        { type: 'meditation',    avg: 4.4 },
        { type: 'breathing',     avg: 4.2 },
        { type: 'journaling',    avg: 4.0 },
        { type: 'body_scan',     avg: 3.8 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/mindfulness')
}

export async function logMemberMindfulnessSession(data) {
  if (USE_MOCK) { await delay(250); return { ok: true } }
  return request('POST', '/v1/mlm/member/mindfulness', data)
}

// ── Member: Mood Journal ──────────────────────────────────────────────────────
export async function getMemberMoodJournal() {
  if (USE_MOCK) {
    await delay(290)
    return {
      stats: { avgMood: '3.9', bestFactor: 'exercise', totalEntries: 62, trend: '+0.3' },
      entries: [
        { id: 'mj1', date: 'Today',      mood: 4, energy: 4, factors: ['exercise', 'nutrition'], note: 'Great morning run. Energy high after the Nordic shake.' },
        { id: 'mj2', date: 'Yesterday',  mood: 3, energy: 3, factors: ['work', 'stress'], note: 'Long calls. Needed more water.' },
        { id: 'mj3', date: '2026-08-07', mood: 5, energy: 5, factors: ['exercise', 'social', 'products'], note: 'Team event was amazing!' },
        { id: 'mj4', date: '2026-08-06', mood: 4, energy: 3, factors: ['sleep', 'nutrition'], note: null },
        { id: 'mj5', date: '2026-08-05', mood: 2, energy: 2, factors: ['sleep', 'stress'], note: 'Poor sleep night before.' },
        { id: 'mj6', date: '2026-08-04', mood: 4, energy: 4, factors: ['exercise', 'products'], note: null },
        { id: 'mj7', date: '2026-08-03', mood: 5, energy: 5, factors: ['social', 'exercise'], note: 'Hit my monthly volume target!' },
        { id: 'mj8', date: '2026-08-02', mood: 4, energy: 3, factors: ['nutrition'], note: null },
        { id: 'mj9', date: '2026-08-01', mood: 3, energy: 3, factors: ['work'], note: 'Back-to-back calls.' },
        { id: 'mj10', date: '2026-07-31', mood: 5, energy: 5, factors: ['exercise', 'social', 'products'], note: null },
      ],
      factorCorrelation: [
        { factor: 'products',  avgMood: 4.5 },
        { factor: 'exercise',  avgMood: 4.3 },
        { factor: 'social',    avgMood: 4.2 },
        { factor: 'nutrition', avgMood: 3.9 },
        { factor: 'sleep',     avgMood: 3.6 },
        { factor: 'work',      avgMood: 3.1 },
        { factor: 'stress',    avgMood: 2.4 },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/mood-journal')
}

export async function addMemberMoodEntry(data) {
  if (USE_MOCK) { await delay(240); return { ok: true } }
  return request('POST', '/v1/mlm/member/mood-journal', data)
}

// ── Member: Business Resources ────────────────────────────────────────────────
export async function getMemberBusinessResources() {
  if (USE_MOCK) {
    await delay(310)
    const resources = [
      { id: 'br1', title: 'New Recruit Welcome Script', category: 'scripts', format: 'PDF', size: '240 KB', description: 'Word-for-word onboarding script for your first call with a new team member.', downloads: 2840, addedAt: '2026-07-01', updatedAt: '2026-08-01', tags: ['onboarding', 'script', 'recruits'] },
      { id: 'br2', title: 'Monthly Business Planner', category: 'templates', format: 'XLSX', size: '180 KB', description: 'Plan your monthly PV goals, call schedule, recruitment targets, and income projection.', downloads: 2210, addedAt: '2026-06-15', updatedAt: '2026-07-20', tags: ['planning', 'goals', 'template'] },
      { id: 'br3', title: 'Nordic Vitals Compensation Deep-Dive', category: 'guides', format: 'PDF', size: '1.2 MB', description: 'Comprehensive breakdown of all commission types, rank requirements, and bonus pools.', downloads: 1980, addedAt: '2026-05-20', updatedAt: '2026-08-05', tags: ['commissions', 'ranks', 'compensation'] },
      { id: 'br4', title: 'Social Media Content Templates Pack', category: 'templates', format: 'PPT', size: '4.8 MB', description: '40 ready-to-post social media slides for Instagram, TikTok, and Facebook.', downloads: 1760, addedAt: '2026-07-10', updatedAt: '2026-07-10', tags: ['social', 'instagram', 'tiktok'] },
      { id: 'br5', title: 'Peptide Product Knowledge Guide', category: 'guides', format: 'PDF', size: '3.4 MB', description: 'Everything you need to know to answer customer questions about our peptide range.', downloads: 1540, addedAt: '2026-06-01', updatedAt: '2026-08-03', tags: ['peptides', 'products', 'knowledge'] },
      { id: 'br6', title: 'Follow-Up Call Script Pack', category: 'scripts', format: 'PDF', size: '310 KB', description: '5 follow-up scripts for leads at different stages: curious, interested, hesitant, ready.', downloads: 1320, addedAt: '2026-07-18', updatedAt: '2026-07-18', tags: ['follow-up', 'leads', 'scripts'] },
      { id: 'br7', title: 'Income Tax Guide for Distributors (NO)', category: 'legal', format: 'PDF', size: '890 KB', description: 'Norway-specific tax guide: what to declare, deductions available, and quarterly deadlines.', downloads: 980, addedAt: '2026-01-15', updatedAt: '2026-01-15', tags: ['tax', 'norway', 'legal'] },
      { id: 'br8', title: 'ROI Calculator Tool', category: 'tools', format: 'XLSX', size: '220 KB', description: 'Interactive spreadsheet to calculate your return on investment and break-even point by rank.', downloads: 860, addedAt: '2026-07-22', updatedAt: '2026-08-06', tags: ['roi', 'calculator', 'tool'] },
      { id: 'br9', title: 'Team Meeting Agenda Template', category: 'templates', format: 'DOCX', size: '95 KB', description: 'Structured agenda for weekly team meetings: wins, training slot, and accountability check-in.', downloads: 740, addedAt: '2026-06-28', updatedAt: '2026-06-28', tags: ['team', 'meeting', 'template'] },
      { id: 'br10', title: 'Distributor Agreement Summary (EN)', category: 'legal', format: 'PDF', size: '420 KB', description: 'Plain-language summary of the distributor agreement — what you can and cannot do.', downloads: 680, addedAt: '2026-04-01', updatedAt: '2026-04-01', tags: ['legal', 'agreement', 'compliance'] },
      { id: 'br11', title: 'Peptide Protocol Advisor Script', category: 'scripts', format: 'PDF', size: '280 KB', description: 'Guide customers through selecting the right peptide protocol based on their goals.', downloads: 620, addedAt: '2026-08-02', updatedAt: '2026-08-02', tags: ['peptides', 'protocol', 'sales'] },
      { id: 'br12', title: 'Rank Advancement Tracker', category: 'tools', format: 'XLSX', size: '160 KB', description: 'Track your weekly PV, team volume, and recruits needed to hit your next rank.', downloads: 580, addedAt: '2026-07-28', updatedAt: '2026-08-07', tags: ['rank', 'tracker', 'goals'] },
    ]
    return {
      stats: { total: resources.length, downloaded: 14, newThisMonth: 4, favourites: 3 },
      resources,
      recentlyAdded: resources.sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 5),
      topDownloaded: [...resources].sort((a, b) => b.downloads - a.downloads).slice(0, 5),
    }
  }
  return request('GET', '/v1/mlm/member/business-resources')
}

// ── Admin: Resellers ──────────────────────────────────────────────────────────
export async function getAdminResellers() {
  if (USE_MOCK) {
    await delay(320)
    const { RESELLERS, RESELLER_STATS } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_resellers') || 'null')
    return { resellers: stored || RESELLERS, stats: RESELLER_STATS }
  }
  return request('GET', '/v1/mlm/admin/resellers')
}
export async function createReseller(data) {
  if (USE_MOCK) {
    await delay(260)
    const { RESELLERS } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_resellers') || 'null') || RESELLERS
    const newR = { ...data, id: 'rs-' + Date.now(), totalOrders: 0, totalNok: 0, lastOrderDate: null, status: 'pending' }
    localStorage.setItem('nv_resellers', JSON.stringify([newR, ...stored]))
    return newR
  }
  return request('POST', '/v1/mlm/admin/resellers', data)
}
export async function updateReseller(data) {
  if (USE_MOCK) {
    await delay(220)
    const { RESELLERS } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_resellers') || 'null') || RESELLERS
    const updated = stored.map(r => r.id === data.id ? { ...r, ...data } : r)
    localStorage.setItem('nv_resellers', JSON.stringify(updated))
    return { ...data }
  }
  return request('PUT', `/v1/mlm/admin/resellers/${data.id}`, data)
}
export async function deleteReseller(id) {
  if (USE_MOCK) {
    await delay(180)
    const { RESELLERS } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_resellers') || 'null') || RESELLERS
    localStorage.setItem('nv_resellers', JSON.stringify(stored.filter(r => r.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/resellers/${id}`)
}
export async function getResellerOrders(resellerId) {
  if (USE_MOCK) {
    await delay(200)
    const { RESELLER_ORDERS } = await import('../data/mock.js')
    return RESELLER_ORDERS[resellerId] || []
  }
  return request('GET', `/v1/mlm/admin/resellers/${resellerId}/orders`)
}

// ── Admin: AI Content Tools ───────────────────────────────────────────────────
export async function getAiContentTemplates() {
  if (USE_MOCK) {
    await delay(180)
    const { AI_CONTENT_TEMPLATES } = await import('../data/mock.js')
    return AI_CONTENT_TEMPLATES
  }
  return request('GET', '/v1/mlm/admin/ai-content/templates')
}
export async function generateAiContent({ platform, tone, goal, product, customHint }) {
  if (USE_MOCK) {
    await delay(1400)
    const templates = {
      'Omega-3 Arctic Pure': { emoji: '🐟', benefit: 'heart and brain health', nordic: 'cold Arctic waters' },
      'Nordic Collagen Complex': { emoji: '✨', benefit: 'glowing skin and joint support', nordic: 'Nordic cloudberry extract' },
      'Vitamin D3 + K2': { emoji: '☀️', benefit: 'bone strength and immune defence', nordic: 'Scandinavian winter formula' },
      'Arctic Shilajit': { emoji: '🪨', benefit: 'sustained energy and vitality', nordic: 'pure Himalayan resin' },
      'Nordic Greens Blend': { emoji: '🌿', benefit: 'daily nutrition and gut health', nordic: '22 Nordic organic greens' },
      'Focus Formula': { emoji: '🧠', benefit: 'mental clarity and calm focus', nordic: "Lion's Mane and Nordic adaptogens" },
    }
    const t = templates[product] || { emoji: '💚', benefit: 'optimal wellness', nordic: 'the Nordic tradition' }
    const toneMap = {
      Inspirational: `Imagine waking up every morning with the energy to live life fully. ✨ That's what ${t.emoji} ${product} does for me. Sourced from ${t.nordic}, it supports ${t.benefit} — naturally and purely.`,
      Educational: `Did you know? ${product} is specifically formulated for ${t.benefit}. The secret is ${t.nordic}, which sets it apart from conventional supplements. Science-backed, Nordic-approved. 🔬`,
      Conversational: `Okay, I have to share this. I've been using ${product} for 6 weeks and the difference is real. ${t.benefit.charAt(0).toUpperCase() + t.benefit.slice(1)} — I feel it every single day. ${t.emoji}`,
      Professional: `At Nordic Vitals, we're committed to evidence-based nutrition. ${product} supports ${t.benefit} through our premium ${t.nordic} formulation — third-party tested and purity guaranteed.`,
      Playful: `Plot twist: taking care of yourself is actually the coolest thing you can do 😎 ${t.emoji} ${product} → ${t.benefit} → feeling like your best Nordic self. Who's in?`,
      'Nordic/Nature': `From the heart of the North 🏔 ${product} carries the purity of ${t.nordic}. In Scandinavia, we believe wellness is a connection — to nature, to science, to ourselves.`,
    }
    const content = (toneMap[tone] || toneMap.Inspirational) + (customHint ? `\n\n${customHint}` : '')
    const goalTags = {
      'Product awareness': `#NordicVitals #${product.replace(/\s+/g, '')} #Supplements #NordicHealth`,
      'Recruitment': '#NordicVitals #WorkFromAnywhere #MLM #HealthBusiness #JoinUs',
      'Team motivation': '#NordicVitals #TeamNordic #MLMSuccess #TogetherWeGrow',
      'Health education': `#NordicVitals #NaturalHealth #WellnessTips #${product.replace(/\s+/g, '')}`,
    }
    return {
      content,
      hashtags: (goalTags[goal] || '#NordicVitals #NordicHealth') + ' #Norway #Wellness #Supplements',
      caption_ideas: [
        `The Nordic way to ${t.benefit.split(' ')[0]} 🌿`,
        `Pure. Natural. Nordic. ${t.emoji}`,
        `This is what ${t.benefit} feels like →`,
      ],
    }
  }
  return request('POST', '/v1/mlm/admin/ai-content/generate', { platform, tone, goal, product, customHint })
}
export async function saveGeneratedContent(data) {
  if (USE_MOCK) {
    await delay(180)
    const stored = JSON.parse(localStorage.getItem('nv_ai_drafts') || '[]')
    const draft = { ...data, id: 'draft-' + Date.now(), savedAt: new Date().toLocaleDateString('no-NO') }
    localStorage.setItem('nv_ai_drafts', JSON.stringify([draft, ...stored]))
    return draft
  }
  return request('POST', '/v1/mlm/admin/ai-content/drafts', data)
}
export async function getContentDrafts() {
  if (USE_MOCK) {
    await delay(200)
    return JSON.parse(localStorage.getItem('nv_ai_drafts') || '[]')
  }
  return request('GET', '/v1/mlm/admin/ai-content/drafts')
}
export async function deleteContentDraft(id) {
  if (USE_MOCK) {
    await delay(150)
    const stored = JSON.parse(localStorage.getItem('nv_ai_drafts') || '[]')
    localStorage.setItem('nv_ai_drafts', JSON.stringify(stored.filter(d => d.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/admin/ai-content/drafts/${id}`)
}

// ── Member: Supplement Cycles ─────────────────────────────────────────────────
export async function getSupplementCycles() {
  if (USE_MOCK) {
    await delay(280)
    const { SUPPLEMENT_CYCLES } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_supplement_cycles') || 'null')
    return { cycles: stored || SUPPLEMENT_CYCLES }
  }
  return request('GET', '/v1/mlm/member/supplement-cycles')
}
export async function saveSupplementCycle(data) {
  if (USE_MOCK) {
    await delay(220)
    const { SUPPLEMENT_CYCLES } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_supplement_cycles') || 'null') || SUPPLEMENT_CYCLES
    if (data.id) {
      const updated = stored.map(c => c.id === data.id ? { ...c, ...data } : c)
      localStorage.setItem('nv_supplement_cycles', JSON.stringify(updated))
      return { ...data }
    }
    const created = { ...data, id: 'cyc-' + Date.now(), isActive: false, currentPhase: 'on', daysLeft: data.onWeeks * 7, startedAt: null }
    localStorage.setItem('nv_supplement_cycles', JSON.stringify([created, ...stored]))
    return created
  }
  return request('POST', '/v1/mlm/member/supplement-cycles', data)
}
export async function deleteSupplementCycle(id) {
  if (USE_MOCK) {
    await delay(160)
    const { SUPPLEMENT_CYCLES } = await import('../data/mock.js')
    const stored = JSON.parse(localStorage.getItem('nv_supplement_cycles') || 'null') || SUPPLEMENT_CYCLES
    localStorage.setItem('nv_supplement_cycles', JSON.stringify(stored.filter(c => c.id !== id)))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/supplement-cycles/${id}`)
}

// ── Member: Shopping List ─────────────────────────────────────────────────────
export async function getSmartShoppingList() {
  if (USE_MOCK) {
    await delay(200)
    const items = JSON.parse(localStorage.getItem('nv_shopping_list') || '[]')
    return { items }
  }
  return request('GET', '/v1/mlm/member/shopping-list')
}
export async function addShoppingListItem(productId) {
  if (USE_MOCK) {
    await delay(120)
    const items = JSON.parse(localStorage.getItem('nv_shopping_list') || '[]')
    const existing = items.find(i => i.productId === productId)
    if (existing) {
      const updated = items.map(i => i.productId === productId ? { ...i, qty: i.qty + 1 } : i)
      localStorage.setItem('nv_shopping_list', JSON.stringify(updated))
      return updated.find(i => i.productId === productId)
    }
    const newItem = { productId, qty: 1 }
    localStorage.setItem('nv_shopping_list', JSON.stringify([...items, newItem]))
    return newItem
  }
  return request('POST', '/v1/mlm/member/shopping-list', { productId })
}
export async function removeShoppingListItem(productId) {
  if (USE_MOCK) {
    await delay(100)
    const items = JSON.parse(localStorage.getItem('nv_shopping_list') || '[]')
    const updated = items.filter(i => i.productId !== productId)
    localStorage.setItem('nv_shopping_list', JSON.stringify(updated))
    return { ok: true }
  }
  return request('DELETE', `/v1/mlm/member/shopping-list/${productId}`)
}
export async function clearShoppingList() {
  if (USE_MOCK) {
    await delay(100)
    localStorage.setItem('nv_shopping_list', '[]')
    return { ok: true }
  }
  return request('DELETE', '/v1/mlm/member/shopping-list')
}

// ── Run 169: Admin Peptide Database ──────────────────────────────
export async function getAdminPeptideDatabase() {
  if (MOCK) {
    const compounds = ['BPC-157','TB-500','CJC-1295','Ipamorelin','Sermorelin','GHK-Cu','AOD-9604','Epithalon','Selank','Semax','PT-141','DSIP','GHRP-6','Hexarelin','MK-677']
    return {
      total: compounds.length, active: 11, pending_review: 2, restricted: 2,
      compounds: compounds.map((name, i) => ({
        id: i+1, name,
        mw: (400 + i*37.3).toFixed(1),
        sequence: ['GEPPGIPPA','LKKTETQ','HAEGTFTSDVSSYLEGQ','AIBG','YGADFKDNMAQY'][i % 5],
        class: ['Growth Factor','Peptide Hormone','Neuropeptide','Antimicrobial'][i % 4],
        status: i < 11 ? 'active' : i < 13 ? 'pending_review' : 'restricted',
        jurisdictions: { us: i < 13, eu: i < 12, au: i < 11, ca: i < 10 },
        references: Math.floor(8 + i * 3.7),
        last_updated: `2026-0${(i%8)+1}-${String((i*3+1)%28+1).padStart(2,'0')}`,
      }))
    }
  }
  return request('GET', '/v1/mlm/admin/peptide-database')
}
export async function updatePeptideStatus(id, status) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/admin/peptide-database/${id}/status`, { status })
}

// ── Run 169: Admin Dropship Partners ─────────────────────────────
export async function getAdminDropshipPartners() {
  if (MOCK) {
    const names = ['NordicFulfill','VikingLogistics','ArcticDist','PolarShip','FjordFulfilment']
    return {
      summary: { total: 5, active: 3, on_hold: 1, inactive: 1, avg_lead_days: 3.8, avg_margin: 28 },
      partners: names.map((name, i) => ({
        id: i+1, name,
        contact: `ops@${name.toLowerCase().replace(' ','')}.no`,
        country: ['NO','SE','DK','FI','NO'][i],
        status: ['active','active','active','on_hold','inactive'][i],
        margin_pct: [24,28,31,27,22][i],
        lead_days: [2,3,4,5,3][i],
        reliability_pct: [98,95,93,88,91][i],
        skus_count: [145,89,212,67,34][i],
        orders_30d: [1240,876,432,210,89][i],
        revenue_30d: [248000,175200,86400,42000,17800][i],
      }))
    }
  }
  return request('GET', '/v1/mlm/admin/dropship-partners')
}
export async function updateDropshipPartnerStatus(id, status) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/admin/dropship-partners/${id}/status`, { status })
}

// ── Run 169: Admin Campaign Analytics ────────────────────────────
export async function getAdminCampaignAnalytics() {
  if (MOCK) {
    const months = ['Feb','Mar','Apr','May','Jun','Jul','Aug']
    return {
      summary: { total_spend: 84200, total_revenue: 621000, roas: 7.37, conversions: 3841, cpa: 21.92 },
      channels: [
        { name: 'Email',    spend: 8400,  revenue: 210000, conversions: 1820, roas: 25.0, ctr: 4.2 },
        { name: 'SMS',      spend: 12600, revenue: 189000, conversions: 940,  roas: 15.0, ctr: 8.7 },
        { name: 'Push',     spend: 3200,  revenue: 84000,  conversions: 520,  roas: 26.3, ctr: 3.1 },
        { name: 'Social',   spend: 42000, revenue: 98000,  conversions: 410,  roas: 2.33, ctr: 1.8 },
        { name: 'Affiliate',spend: 18000, revenue: 40000,  conversions: 151,  roas: 2.22, ctr: 2.9 },
      ],
      monthly: months.map((m, i) => ({
        month: m,
        spend: 9000 + i*1200 + Math.round(Math.sin(i)*800),
        revenue: 68000 + i*9000 + Math.round(Math.cos(i)*5000),
      })),
      top_campaigns: [
        { name: 'Summer Peptide Launch', channel: 'Email', roas: 31.2, revenue: 89400, status: 'ended' },
        { name: 'Rank-Up Push Blast',    channel: 'Push',  roas: 28.7, revenue: 42100, status: 'ended' },
        { name: 'BPC-157 Bundle SMS',    channel: 'SMS',   roas: 22.4, revenue: 67800, status: 'ended' },
        { name: 'IG Influencer Wave',    channel: 'Social',roas: 4.1,  revenue: 32000, status: 'active' },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/campaign-analytics')
}

// ── Run 169: Admin Ticket Escalations ────────────────────────────
export async function getAdminTicketEscalations() {
  if (MOCK) {
    const reasons = ['SLA breach','Repeat contact','Sentiment: angry','No-resolution 48h','High-value member']
    const agents = ['Astrid K.','Lars M.','Ingrid B.','Erik T.']
    return {
      summary: { open: 12, breach_risk: 4, resolved_today: 7, avg_resolution_h: 6.2 },
      tickets: Array.from({length:12},(_,i)=>({
        id: 10300+i, subject: ['Wrong order received','Commission not paid','Account locked','Autoship failed','Refund delay'][i%5],
        member: `member_${1000+i*37}`, priority: ['urgent','high','medium'][i%3],
        reason: reasons[i%reasons.length], assigned_to: agents[i%agents.length],
        opened_at: `2026-08-1${2-Math.floor(i/4)}T${String(8+i*1.5|0).padStart(2,'0')}:00:00Z`,
        sla_due_at: `2026-08-13T${String(10+i).padStart(2,'0')}:00:00Z`,
        status: i < 2 ? 'breach_risk' : 'open',
        contact_count: 1 + (i % 5),
      }))
    }
  }
  return request('GET', '/v1/mlm/admin/ticket-escalations')
}
export async function resolveEscalation(id, decision, note) {
  if (MOCK) return { ok: true }
  return request('POST', `/v1/mlm/admin/ticket-escalations/${id}/resolve`, { decision, note })
}

// ── Run 169: Member Before & After Gallery ───────────────────────
export async function getMemberBeforeAfterGallery() {
  if (MOCK) {
    return {
      my_entries: [
        { id: 1, weeks: 12, product: 'BPC-157 + TB-500', goal: 'Recovery', status: 'published', likes: 48, created_at: '2026-06-01' },
      ],
      community: Array.from({length:18},(_,i)=>({
        id: 100+i, username: `member_${1000+i*41}`,
        weeks: [4,8,12,16,20,24][i%6], product: ['BPC-157','GHK-Cu','TB-500','CJC-1295','Ipamorelin'][i%5],
        goal: ['Recovery','Anti-aging','Performance','Weight loss','Muscle growth'][i%5],
        likes: Math.floor(10 + i*8.3), comments: Math.floor(2+i*1.7),
        created_at: `2026-0${(i%8)+1}-${String((i*3+1)%28+1).padStart(2,'0')}`,
      })),
      stats: { total_entries: 2847, avg_weeks: 13.4, goals: {Recovery:34, Performance:28, 'Anti-aging':21, Other:17} }
    }
  }
  return request('GET', '/v1/mlm/member/before-after-gallery')
}
export async function submitBeforeAfterEntry(data) {
  if (MOCK) return { ok: true, id: Date.now() }
  return request('POST', '/v1/mlm/member/before-after-gallery', data)
}

// ── Run 169: Member Peptide Education ────────────────────────────
export async function getMemberPeptideEducation() {
  if (MOCK) {
    return {
      progress: { modules_completed: 4, total_modules: 12, xp_earned: 1200, streak: 5 },
      current_module: { id: 5, title: 'BPC-157: The Healing Peptide', duration_min: 18, xp: 300 },
      modules: [
        {id:1,title:'What Are Peptides?',             category:'Fundamentals', duration_min:10,xp:150,status:'completed'},
        {id:2,title:'Peptide Delivery Methods',       category:'Fundamentals', duration_min:12,xp:150,status:'completed'},
        {id:3,title:'GH Peptides Overview',           category:'Growth',       duration_min:15,xp:200,status:'completed'},
        {id:4,title:'Recovery Peptides',              category:'Recovery',     duration_min:14,xp:200,status:'completed'},
        {id:5,title:'BPC-157: The Healing Peptide',   category:'Recovery',     duration_min:18,xp:300,status:'in_progress'},
        {id:6,title:'TB-500 Deep Dive',               category:'Recovery',     duration_min:16,xp:250,status:'locked'},
        {id:7,title:'Anti-Aging Peptides',            category:'Anti-aging',   duration_min:20,xp:350,status:'locked'},
        {id:8,title:'Cognitive Enhancing Peptides',   category:'Neuro',        duration_min:22,xp:350,status:'locked'},
        {id:9,title:'Stacking Protocols',             category:'Advanced',     duration_min:25,xp:400,status:'locked'},
        {id:10,title:'Dosing & Timing',               category:'Advanced',     duration_min:20,xp:300,status:'locked'},
        {id:11,title:'Peptide Storage & Handling',    category:'Practical',    duration_min:12,xp:200,status:'locked'},
        {id:12,title:'Legal & Safety Overview',       category:'Compliance',   duration_min:15,xp:200,status:'locked'},
      ]
    }
  }
  return request('GET', '/v1/mlm/member/peptide-education')
}
export async function completePeptideModule(id) {
  if (MOCK) return { ok: true, xp_earned: 200 }
  return request('POST', `/v1/mlm/member/peptide-education/${id}/complete`)
}

// ── Run 169: Member AutoOrder Templates ──────────────────────────
export async function getMemberAutoOrderTemplates() {
  if (MOCK) {
    return {
      templates: [
        { id:1, name:'Monthly Stack', frequency:'monthly', day:1,  total_pv:120, total_price:189, items:[{name:'BPC-157 2mg',qty:2},{name:'TB-500 2mg',qty:1},{name:'GHK-Cu Serum',qty:1}], active:true,  next_order:'2026-09-01', orders_placed:7 },
        { id:2, name:'Weekly Basics', frequency:'weekly',  day:1,  total_pv:40,  total_price:62,  items:[{name:'Ipamorelin 2mg',qty:1},{name:'CJC-1295 2mg',qty:1}],                       active:false, next_order:null,          orders_placed:3 },
      ],
      summary: { active: 1, total_saved: 4.8, pv_per_month: 160 }
    }
  }
  return request('GET', '/v1/mlm/member/autoorder-templates')
}
export async function toggleAutoOrderTemplate(id, active) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/member/autoorder-templates/${id}/toggle`, { active })
}
export async function deleteAutoOrderTemplate(id) {
  if (MOCK) return { ok: true }
  return request('DELETE', `/v1/mlm/member/autoorder-templates/${id}`)
}

// ── Run 169: Member Wellness Challenges ──────────────────────────
export async function getMemberWellnessChallenges() {
  if (MOCK) {
    return {
      my_stats: { completed: 8, in_progress: 2, streak: 14, xp_earned: 3200 },
      active: [
        { id:1,  title:'30-Day Hydration',        category:'Hydration',   days:30, day:14, goal:'2.5L/day',      xp:500, participants:1842, my_pct:47, prize:'💧 Hydration Badge' },
        { id:2,  title:'Peptide Protocol Week',   category:'Peptides',    days:7,  day:3,  goal:'7 days on stack',xp:300, participants:924,  my_pct:43, prize:'🧬 Protocol Badge' },
      ],
      upcoming: [
        { id:3,  title:'Sleep Optimisation',      category:'Sleep',       days:21, starts:'2026-08-20', xp:400, prize:'😴 Sleep Master' },
        { id:4,  title:'Mindfulness Month',       category:'Mindfulness', days:30, starts:'2026-09-01', xp:600, prize:'🧘 Zen Badge' },
      ],
      completed: [
        { id:5,  title:'Step Counter August',     category:'Fitness',     completed_at:'2026-08-08', xp_earned:250, rank:247 },
        { id:6,  title:'Recovery Sprint',         category:'Recovery',    completed_at:'2026-08-01', xp_earned:300, rank:89  },
      ]
    }
  }
  return request('GET', '/v1/mlm/member/wellness-challenges')
}
export async function joinWellnessChallenge(id) {
  if (MOCK) return { ok: true }
  return request('POST', `/v1/mlm/member/wellness-challenges/${id}/join`)
}

// ── Run 170: Admin SKU Manager ────────────────────────────────────
export async function getAdminSkuManager() {
  if (MOCK) {
    const skus = [
      { id:1,  sku:'NV-BPC157-2MG',  name:'BPC-157 2mg',           barcode:'5901234123457', category:'Peptides',     price:49.99,  stock:342,  status:'active' },
      { id:2,  sku:'NV-TB500-2MG',   name:'TB-500 2mg',            barcode:'5901234123458', category:'Peptides',     price:54.99,  stock:218,  status:'active' },
      { id:3,  sku:'NV-GHKCU-SRM',   name:'GHK-Cu Serum 30ml',     barcode:'',             category:'Topicals',     price:39.99,  stock:89,   status:'active' },
      { id:4,  sku:'NV-IPAM-2MG',    name:'Ipamorelin 2mg',        barcode:'5901234123460', category:'Peptides',     price:44.99,  stock:155,  status:'active' },
      { id:5,  sku:'NV-CJC1295-2MG', name:'CJC-1295 2mg',          barcode:'5901234123461', category:'Peptides',     price:47.99,  stock:201,  status:'active' },
      { id:6,  sku:'NV-SELANK-5MG',  name:'Selank 5mg',            barcode:'',             category:'Peptides',     price:59.99,  stock:12,   status:'active' },
      { id:7,  sku:'NV-NAD-250MG',   name:'NAD+ 250mg',            barcode:'5901234123463', category:'Supplements',  price:34.99,  stock:445,  status:'active' },
      { id:8,  sku:'NV-COLLPOW-300G',name:'Collagen Powder 300g',  barcode:'5901234123464', category:'Supplements',  price:29.99,  stock:6,    status:'active' },
      { id:9,  sku:'NV-EPITALON-10', name:'Epithalon 10mg',        barcode:'5901234123465', category:'Peptides',     price:69.99,  stock:0,    status:'discontinued' },
      { id:10, sku:'NV-THYMOS-1MG',  name:'Thymosin Alpha-1 1mg',  barcode:'',             category:'Peptides',     price:74.99,  stock:78,   status:'draft' },
      { id:11, sku:'NV-XMAS-BUNDLE', name:'Winter Recovery Bundle', barcode:'5901234123467', category:'Bundles',     price:129.99, stock:35,   status:'seasonal' },
      { id:12, sku:'NV-HEXAMORELIN', name:'Hexarelin 2mg',         barcode:'',             category:'Peptides',     price:52.99,  stock:44,   status:'active' },
    ]
    return {
      summary: { total: skus.length, active: skus.filter(s=>s.status==='active').length, no_barcode: skus.filter(s=>!s.barcode).length, discontinued: skus.filter(s=>s.status==='discontinued').length },
      skus,
    }
  }
  return request('GET', '/v1/mlm/admin/sku-manager')
}
export async function updateSkuBarcode(id, barcode) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/admin/sku-manager/${id}/barcode`, { barcode })
}

// ── Run 170: Admin Translation Manager ───────────────────────────
export async function getAdminTranslations() {
  if (MOCK) {
    const keys = [
      { key:'nav.dashboard',     en:'Dashboard',        translations:{ nb:'Dashbord', sv:'Instrumentpanel', da:'Instrumentbræt', fi:'Hallintapaneeli', de:'Armaturenbrett' } },
      { key:'nav.commissions',   en:'Commissions',      translations:{ nb:'Provisjoner', sv:'Provisioner', da:'Provisioner', fi:'Provisiot', de:'' } },
      { key:'nav.orders',        en:'Orders',           translations:{ nb:'Bestillinger', sv:'Beställningar', da:'Ordrer', fi:'Tilaukset', de:'Bestellungen' } },
      { key:'nav.leaderboard',   en:'Leaderboard',      translations:{ nb:'Ledertavle', sv:'Topplista', da:'Rangliste', fi:'', de:'' } },
      { key:'btn.join_now',      en:'Join Now',         translations:{ nb:'Bli med nå', sv:'Gå med nu', da:'Tilmeld dig', fi:'Liity nyt', de:'Jetzt beitreten' } },
      { key:'btn.get_started',   en:'Get Started',      translations:{ nb:'Kom i gang', sv:'Kom igång', da:'Kom i gang', fi:'Aloita', de:'' } },
      { key:'label.rank',        en:'Rank',             translations:{ nb:'Rang', sv:'Rang', da:'Rang', fi:'Taso', de:'Rang' } },
      { key:'label.pv',          en:'Personal Volume',  translations:{ nb:'Personlig volum', sv:'Personlig volym', da:'Personlig volumen', fi:'', de:'' } },
      { key:'msg.welcome_back',  en:'Welcome back!',    translations:{ nb:'Velkommen tilbake!', sv:'Välkommen tillbaka!', da:'Velkommen tilbage!', fi:'Tervetuloa takaisin!', de:'Willkommen zurück!' } },
      { key:'msg.no_results',    en:'No results found', translations:{ nb:'Ingen resultater funnet', sv:'', da:'', fi:'', de:'Keine Ergebnisse gefunden' } },
      { key:'page.home.hero',    en:'Transform Your Health & Wealth', translations:{ nb:'', sv:'', da:'', fi:'', de:'' } },
      { key:'page.home.subhero', en:'Premium peptides + proven MLM opportunity', translations:{ nb:'', sv:'', da:'', fi:'', de:'' } },
    ]
    const locales = [
      { code:'nb', name:'Norwegian', flag:'🇳🇴', translated: keys.filter(k=>!!k.translations.nb).length, total: keys.length },
      { code:'sv', name:'Swedish',   flag:'🇸🇪', translated: keys.filter(k=>!!k.translations.sv).length, total: keys.length },
      { code:'da', name:'Danish',    flag:'🇩🇰', translated: keys.filter(k=>!!k.translations.da).length, total: keys.length },
      { code:'fi', name:'Finnish',   flag:'🇫🇮', translated: keys.filter(k=>!!k.translations.fi).length, total: keys.length },
      { code:'de', name:'German',    flag:'🇩🇪', translated: keys.filter(k=>!!k.translations.de).length, total: keys.length },
    ]
    return { locales, keys }
  }
  return request('GET', '/v1/mlm/admin/translations')
}
export async function saveTranslationKey(key, locale, value) {
  if (MOCK) return { ok: true }
  return request('PUT', '/v1/mlm/admin/translations', { key, locale, value })
}

// ── Run 170: Admin Dynamic Discounts ──────────────────────────────
export async function getAdminDynamicDiscounts() {
  if (MOCK) {
    return {
      summary: { active: 4, total_discounted: 28450, orders_affected: 1243, avg_discount_pct: 12 },
      rules: [
        { id:1, name:'New Member Welcome',     type:'percentage',    condition:'first_order',          value:'15%', min_order:0,   times_applied:412,  target_uses:1000, status:'active',  expires_at:null },
        { id:2, name:'$100+ Cart Discount',    type:'fixed',         condition:'cart_total > $100',     value:'$10', min_order:100, times_applied:287,  target_uses:500,  status:'active',  expires_at:'2026-12-31' },
        { id:3, name:'Summer Free Shipping',   type:'free_shipping', condition:'any',                  value:'Free', min_order:50, times_applied:634,  target_uses:2000, status:'active',  expires_at:'2026-08-31' },
        { id:4, name:'BOGO Collagen',          type:'bogo',          condition:'buy 2 collagen items', value:'1 free', min_order:0, times_applied:89,  target_uses:200,  status:'active',  expires_at:'2026-08-20' },
        { id:5, name:'Loyalty Tier Discount',  type:'percentage',    condition:'member_tier = Gold+',  value:'10%', min_order:75,  times_applied:156,  target_uses:300,  status:'paused',  expires_at:null },
        { id:6, name:'Flash Sale -20%',        type:'percentage',    condition:'any',                  value:'20%', min_order:0,   times_applied:0,    target_uses:500,  status:'draft',   expires_at:'2026-09-15' },
      ],
    }
  }
  return request('GET', '/v1/mlm/admin/dynamic-discounts')
}
export async function toggleDynamicDiscount(id, status) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/admin/dynamic-discounts/${id}/status`, { status })
}
export async function deleteDynamicDiscount(id) {
  if (MOCK) return { ok: true }
  return request('DELETE', `/v1/mlm/admin/dynamic-discounts/${id}`)
}

// ── Run 170: Admin Marketplace Analytics ──────────────────────────
export async function getAdminMarketplaceAnalytics(period = '30d') {
  if (MOCK) {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    return {
      summary: { gmv: 18420, listings: 342, active_sellers: 89, transactions: 521, avg_sale_price: 35.40, pending_review: 14 },
      category_breakdown: [
        { name:'Peptide Kits',     gmv:7840, listings:102, sellers:41 },
        { name:'Supplements',      gmv:4320, listings:87,  sellers:29 },
        { name:'Training Resources',gmv:2950,listings:68,  sellers:33 },
        { name:'Starter Bundles',  gmv:1980, listings:51,  sellers:22 },
        { name:'Digital Products', gmv:1330, listings:34,  sellers:18 },
      ],
      top_sellers: [
        { name:'member_4821', listings:18, sales:67, gmv:2340 },
        { name:'member_3302', listings:14, sales:51, gmv:1890 },
        { name:'member_7701', listings:22, sales:43, gmv:1540 },
        { name:'member_1994', listings:9,  sales:38, gmv:1320 },
        { name:'member_5560', listings:11, sales:29, gmv:980  },
      ],
      daily_transactions: Array.from({length:days},(_,i)=>({ date:`2026-${String(7+Math.floor((i+13)/31)).padStart(2,'0')}-${String(((i+13)%31)+1).padStart(2,'0')}`, count: Math.floor(8+Math.sin(i/3)*6+Math.random()*5) })),
    }
  }
  return request('GET', `/v1/mlm/admin/marketplace-analytics?period=${period}`)
}

// ── Run 170: Member Peptide Diary ─────────────────────────────────
export async function getMemberPeptideDiary() {
  if (MOCK) {
    return {
      stats: { total_logs: 87, week_logs: 14, streak: 6, unique_peptides: 5 },
      entries: [
        { id:1,  peptide:'BPC-157',    dose_mcg:250, route:'subcutaneous', timing:'morning',     note:'Felt great, no injection site issues', logged_at:'2026-08-13T07:30:00Z' },
        { id:2,  peptide:'Ipamorelin', dose_mcg:200, route:'subcutaneous', timing:'bedtime',     note:'', logged_at:'2026-08-13T22:00:00Z' },
        { id:3,  peptide:'BPC-157',    dose_mcg:250, route:'subcutaneous', timing:'morning',     note:'', logged_at:'2026-08-12T07:25:00Z' },
        { id:4,  peptide:'TB-500',     dose_mcg:500, route:'subcutaneous', timing:'post_workout',note:'Week 2, knee feeling better', logged_at:'2026-08-12T18:00:00Z' },
        { id:5,  peptide:'Ipamorelin', dose_mcg:200, route:'subcutaneous', timing:'bedtime',     note:'', logged_at:'2026-08-12T22:00:00Z' },
        { id:6,  peptide:'BPC-157',    dose_mcg:250, route:'subcutaneous', timing:'morning',     note:'', logged_at:'2026-08-11T07:30:00Z' },
        { id:7,  peptide:'GHK-Cu',     dose_mcg:0,   route:'topical',      timing:'evening',     note:'Applied to face and neck', logged_at:'2026-08-11T20:00:00Z' },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/peptide-diary')
}
export async function logPeptideDiaryEntry(data) {
  if (MOCK) return { ok: true, id: Date.now() }
  return request('POST', '/v1/mlm/member/peptide-diary', data)
}
export async function deletePeptideDiaryEntry(id) {
  if (MOCK) return { ok: true }
  return request('DELETE', `/v1/mlm/member/peptide-diary/${id}`)
}

// ── Run 170: Member Body Composition ──────────────────────────────
export async function getMemberBodyComposition() {
  if (MOCK) {
    return {
      current:  { weight_kg: 82.4, body_fat_pct: 18.2, muscle_kg: 38.1, waist_cm: 88, bmi: 24.8, height_m: 1.82 },
      baseline: { weight_kg: 87.0, body_fat_pct: 22.5, muscle_kg: 35.4, waist_cm: 95, bmi: 26.3 },
      history: [
        { date:'2026-08-13', weight_kg:'82.4', body_fat_pct:'18.2', muscle_kg:'38.1', waist_cm:'88', bmi:'24.8' },
        { date:'2026-08-06', weight_kg:'83.1', body_fat_pct:'18.8', muscle_kg:'37.8', waist_cm:'89', bmi:'25.1' },
        { date:'2026-07-30', weight_kg:'83.9', body_fat_pct:'19.4', muscle_kg:'37.5', waist_cm:'90', bmi:'25.4' },
        { date:'2026-07-23', weight_kg:'84.7', body_fat_pct:'20.1', muscle_kg:'37.0', waist_cm:'91', bmi:'25.6' },
        { date:'2026-07-16', weight_kg:'85.2', body_fat_pct:'20.8', muscle_kg:'36.5', waist_cm:'92', bmi:'25.7' },
        { date:'2026-07-09', weight_kg:'85.9', body_fat_pct:'21.2', muscle_kg:'36.2', waist_cm:'93', bmi:'25.9' },
        { date:'2026-07-02', weight_kg:'86.5', body_fat_pct:'21.9', muscle_kg:'35.7', waist_cm:'94', bmi:'26.1' },
        { date:'2026-06-25', weight_kg:'87.0', body_fat_pct:'22.5', muscle_kg:'35.4', waist_cm:'95', bmi:'26.3' },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/body-composition')
}
export async function logBodyCompositionEntry(data) {
  if (MOCK) return { ok: true }
  return request('POST', '/v1/mlm/member/body-composition', data)
}

// ── Run 170: Member Financial Summary ─────────────────────────────
export async function getMemberFinancialSummary(year = 2026) {
  if (MOCK) {
    return {
      summary: { total_earned: 14820.50, paid_out: 12400.00, pending: 2420.50, tax_withheld: 0 },
      breakdown: [
        { type:'Personal Commissions', amount: 6240.00 },
        { type:'Team Override',        amount: 4980.50 },
        { type:'Rank Bonuses',         amount: 2100.00 },
        { type:'Leadership Pool',      amount: 1500.00 },
      ],
      monthly: [
        { month:'Jan', earned:800   }, { month:'Feb', earned:920   }, { month:'Mar', earned:1050 },
        { month:'Apr', earned:1180  }, { month:'May', earned:1240  }, { month:'Jun', earned:1380 },
        { month:'Jul', earned:1520  }, { month:'Aug', earned:1730  }, { month:'Sep', earned:0    },
        { month:'Oct', earned:0     }, { month:'Nov', earned:0     }, { month:'Dec', earned:0    },
      ].slice(0, year === 2025 ? 12 : 8),
      payouts: [
        { id:1, date:'2026-08-01', amount:1730.00, method:'Bank Transfer', reference:'PAY-20260801', status:'paid'    },
        { id:2, date:'2026-07-01', amount:1520.00, method:'Bank Transfer', reference:'PAY-20260701', status:'paid'    },
        { id:3, date:'2026-06-01', amount:1380.00, method:'Bank Transfer', reference:'PAY-20260601', status:'paid'    },
        { id:4, date:'2026-05-01', amount:1240.00, method:'Bank Transfer', reference:'PAY-20260501', status:'paid'    },
        { id:5, date:'2026-04-01', amount:1180.00, method:'Bank Transfer', reference:'PAY-20260401', status:'paid'    },
        { id:6, date:'2026-03-01', amount:1050.00, method:'Bank Transfer', reference:'PAY-20260301', status:'paid'    },
        { id:7, date:'2026-02-01', amount:920.00,  method:'Bank Transfer', reference:'PAY-20260201', status:'paid'    },
        { id:8, date:'2026-01-01', amount:800.00,  method:'Bank Transfer', reference:'PAY-20260101', status:'paid'    },
        { id:9, date:'2026-09-01', amount:2420.50, method:'Bank Transfer', reference:'PAY-20260901', status:'pending' },
      ],
    }
  }
  return request('GET', `/v1/mlm/member/financial-summary?year=${year}`)
}

// ── Run 170: Member Team Messages ─────────────────────────────────
export async function getMemberTeamMessages() {
  if (MOCK) {
    return {
      unread: 2,
      messages: [
        { id:1, subject:'🚀 August Rank Push — Let\'s Go!', type:'broadcast', from:'Sarah D. (Diamond)', preview:'Team, we\'re 12% behind last August\'s volume. Here\'s the plan...', body:'Team — we\'re 12% behind last August\'s volume target. Here\'s the 3-week push plan:\n\n1. Every active leg submits a $75+ order by Aug 20.\n2. Refer one new customer this month — even a trial order counts.\n3. Use the team resources folder for social media assets.\n\nI\'ll be hosting a live call Thursday 8pm CET. Link in the events tab. Let\'s smash this together! 💪', sent_at:'2026-08-13T08:00:00Z', read:false },
        { id:2, subject:'New Training: Advanced Recruitment Scripts', type:'training', from:'Nordic Vitals HQ', preview:'A new training module has been added to your learning path...', body:'We\'ve just published a new advanced training module: "Closing Techniques for the Modern Network Marketer."\n\nYou\'ll find it in your Learning Path under the Business Development category. It covers:\n- Objection handling for the top 10 rejections\n- The 3-question close\n- Following up without being pushy\n\nExpected completion time: 22 minutes. Worth 350 XP.', sent_at:'2026-08-12T14:30:00Z', read:false },
        { id:3, subject:'Congratulations — Team Volume Milestone!', type:'recognition', from:'Sarah D. (Diamond)', preview:'Your team crossed 10,000 PV for the month — incredible...', body:'I just had to send this message personally.\n\nYour team crossed the 10,000 PV milestone for July — that\'s a team record! Every single one of you contributed to this result.\n\nSpecial shoutout to the top three performers:\n🥇 member_4821 — 1,240 PV\n🥈 member_3302 — 980 PV\n🥉 member_7701 — 840 PV\n\nKeep it up. August target: 11,500 PV. I believe in every one of you.', sent_at:'2026-08-01T16:00:00Z', read:true },
        { id:4, subject:'⚠ Policy Update: Income Claims', type:'alert', from:'Nordic Vitals Compliance', preview:'Effective immediately: updated guidance on income claims in social media...', body:'Effective immediately, please review the updated income claim guidelines before posting on social media.\n\nKey changes:\n- All earnings screenshots must include the full income disclosure statement or a link to it.\n- Terms like "financial freedom" or "replace your salary" are no longer permitted without substantiation.\n- Testimonials showing specific dollar amounts require the member\'s consent form.\n\nThe updated compliance guide is in your Business Resources section. Violations may result in account suspension.', sent_at:'2026-07-28T09:00:00Z', read:true },
        { id:5, subject:'Weekly Update — Rank Advancements', type:'update', from:'Sarah D. (Diamond)', preview:'Two members on your team advanced rank this week...', body:'Quick weekly update from your upline:\n\n✅ member_1994 advanced to Silver — welcome to the team leadership!\n✅ member_5560 hit their first 100 PV month — great start!\n\nReminder: the team call is every Thursday at 8pm CET. Attendance is tracked and counts toward your mentorship badge.\n\nHave a great week everyone.', sent_at:'2026-07-21T12:00:00Z', read:true },
      ],
    }
  }
  return request('GET', '/v1/mlm/member/team-messages')
}
export async function markTeamMessageRead(id) {
  if (MOCK) return { ok: true }
  return request('PUT', `/v1/mlm/member/team-messages/${id}/read`)
}
