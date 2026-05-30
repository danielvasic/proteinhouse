import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AdminCtx = createContext(null)

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(null)   // null = loading, false = not auth, object = user
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAdmin(isAdminUser(session?.user) ? session.user : false)
      setLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAdmin(isAdminUser(session?.user) ? session.user : false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!isAdminUser(data.user)) {
      await supabase.auth.signOut()
      throw new Error('Nemate admin pristup.')
    }
    return data.user
  }

  const signOut = () => supabase.auth.signOut()

  return (
    <AdminCtx.Provider value={{ admin, loading, signIn, signOut }}>
      {children}
    </AdminCtx.Provider>
  )
}

export function useAdmin() {
  return useContext(AdminCtx)
}

function isAdminUser(user) {
  if (!user) return false
  return user.user_metadata?.role === 'admin'
}
