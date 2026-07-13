import { createContext, useContext, useState } from 'react'
import { USERS } from '../data/mock'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])

  function login(email, password) {
    const found = USERS.find(u => u.email === email && u.password === password)
    if (found) { setUser(found); return true }
    return false
  }

  function logout() { setUser(null) }

  function addToCart(product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...product, qty: 1 }]
    })
  }

  function removeFromCart(id) { setCart(prev => prev.filter(i => i.id !== id)) }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id)
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  return (
    <AuthContext.Provider value={{ user, login, logout, cart, addToCart, removeFromCart, updateQty, cartTotal, cartCount }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
