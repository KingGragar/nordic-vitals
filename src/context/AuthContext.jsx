import { createContext, useContext, useState } from 'react'
import { loginUser, setAuthToken, verify2FALogin } from '../api/mlmApi'

const AUTH_KEY = 'nv_auth'
const CART_KEY = 'nv_cart'

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const { user, token } = JSON.parse(raw)
    if (token) setAuthToken(token)
    return user || null
  } catch { return null }
}

function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]') } catch { return [] }
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadAuth)
  const [cart, setCart] = useState(loadCart)
  const [pendingTwoFactor, setPendingTwoFactor] = useState(null) // { userId }

  async function login(email, password) {
    const result = await loginUser(email, password)
    if (result.twoFactorRequired) {
      setPendingTwoFactor({ userId: result.userId })
      return result
    }
    setUser(result)
    try { localStorage.setItem(AUTH_KEY, JSON.stringify({ user: result, token: result.token || '' })) } catch {}
    return result
  }

  async function completeTwoFactorLogin(code) {
    if (!pendingTwoFactor) throw new Error('No pending 2FA session')
    const userData = await verify2FALogin(pendingTwoFactor.userId, code)
    setPendingTwoFactor(null)
    setUser(userData)
    try { localStorage.setItem(AUTH_KEY, JSON.stringify({ user: userData, token: userData.token || '' })) } catch {}
    return userData
  }

  function logout() {
    setUser(null)
    setPendingTwoFactor(null)
    setAuthToken('')
    try { localStorage.removeItem(AUTH_KEY) } catch {}
  }

  function addToCart(product) {
    setCart(prev => {
      const next = prev.find(i => i.id === product.id)
        ? prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...product, qty: 1 }]
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function removeFromCart(id) {
    setCart(prev => {
      const next = prev.filter(i => i.id !== id)
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => {
      const next = prev.map(i => i.id === id ? { ...i, qty } : i)
      try { localStorage.setItem(CART_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function clearCart() {
    setCart([])
    try { localStorage.removeItem(CART_KEY) } catch {}
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <AuthContext.Provider value={{ user, login, logout, pendingTwoFactor, completeTwoFactorLogin, cart, addToCart, removeFromCart, updateQty, clearCart, cartTotal, cartCount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
