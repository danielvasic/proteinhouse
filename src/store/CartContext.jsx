import { createContext, useContext, useReducer, useEffect, useState } from 'react'
import { trackEvent } from '../lib/analytics'

const CartContext = createContext(null)

// --- Reducer ---
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      // Cijena ulazi u ključ jer isti proizvod može biti u korpi po redovnoj
      // cijeni i po add-on promo cijeni — to su dvije zasebne stavke.
      const idx = state.items.findIndex((x) =>
        x.id === action.payload.id &&
        x.price === action.payload.price &&
        (x.selectedFlavor ?? null) === (action.payload.selectedFlavor ?? null) &&
        (x.selectedSize   ?? null) === (action.payload.selectedSize   ?? null)
      )
      if (idx >= 0) {
        return {
          ...state,
          items: state.items.map((x, i) =>
            i === idx ? { ...x, qty: x.qty + 1 } : x
          ),
        }
      }
      return { ...state, items: [...state.items, { ...action.payload, qty: 1 }] }
    }
    case 'REMOVE':
      return {
        ...state,
        items: state.items.filter((_, i) => i !== action.index),
      }
    case 'SET_QTY':
      return {
        ...state,
        items: state.items.map((x, i) =>
          i === action.index ? { ...x, qty: Math.max(1, action.qty) } : x
        ),
      }
    case 'CLEAR':
      return { ...state, items: [] }
    case 'HYDRATE':
      return { ...state, items: action.items }
    case 'OPEN_DRAWER':
      return { ...state, drawerOpen: true }
    case 'CLOSE_DRAWER':
      return { ...state, drawerOpen: false }
    default:
      return state
  }
}

const initialState = {
  items: [],
  drawerOpen: false,
}

// SSR-safe localStorage helpers
function loadCart() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('ph_cart')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('ph_cart', JSON.stringify(items))
  } catch {}
}

// --- Provider ---
export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on client mount only (SSR-safe)
  useEffect(() => {
    const saved = loadCart()
    if (saved.length) {
      dispatch({ type: 'HYDRATE', items: saved })
    }
    setHydrated(true)
  }, [])

  // Persist cart to localStorage
  useEffect(() => {
    if (hydrated) {
      saveCart(state.items)
    }
  }, [state.items, hydrated])

  const totalItems = state.items.reduce((s, i) => s + i.qty, 0)
  const totalPrice = state.items.reduce((s, i) => s + i.price * i.qty, 0)

  const value = {
    items: state.items,
    drawerOpen: state.drawerOpen,
    totalItems,
    totalPrice,
    addItem: (product) => {
      dispatch({ type: 'ADD', payload: product })
      dispatch({ type: 'OPEN_DRAWER' })
      trackEvent('add_to_cart', {
        ecommerce: {
          currency: 'BAM',
          value: product.price,
          items: [{ item_id: product.id, item_name: product.title, item_brand: product.brand, price: product.price, quantity: 1 }],
        },
      })
    },
    removeItem: (index) => dispatch({ type: 'REMOVE', index }),
    setQty: (index, qty) => dispatch({ type: 'SET_QTY', index, qty }),
    clearCart: () => dispatch({ type: 'CLEAR' }),
    openDrawer: () => dispatch({ type: 'OPEN_DRAWER' }),
    closeDrawer: () => dispatch({ type: 'CLOSE_DRAWER' }),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
