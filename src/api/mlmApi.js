/**
 * Arctico MLM API client.
 * Set VITE_MLM_API_URL and VITE_MLM_API_KEY when the backend is deployed.
 * Until then every call resolves with mock data from src/data/mock.js.
 */
import {
  USERS, COMMISSIONS, WALLET_TXS, TREE_DATA,
  ADMIN_MEMBERS, PAYOUT_QUEUE, ORDERS, COMMISSION_RUNS, PRODUCTS, PRODUCT_REVIEWS, ADMIN_ORDERS, ANNOUNCEMENTS, AUDIT_LOG, SUPPORT_TICKETS, AUTOSHIPS, RESOURCES, PROMO_CODES, REFERRAL_STATS, EMAIL_TEMPLATES,
  TOKEN_STATS, TOKEN_EVENTS, RANK_HISTORY, ANALYTICS_DATA, TRAINING_MODULES, EVENTS, EMAIL_CAMPAIGNS, KYC_SUBMISSIONS, NETWORK_ANALYTICS, LOYALTY_DATA,
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
    const NOK_RATE = 1.15 // 1 MLMT = 1.15 NOK (illustrative)
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
