import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem('token')
    if (token) {
      // In a real app, you'd validate the token with the server
      // For now, we'll simulate a logged-in user
      setUser({
        id: '1',
        name: 'Ahmad Ali',
        email: 'ahmad.ali@example.com',
        profileComplete: 75
      })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Login failed')
      
      localStorage.setItem('token', data.token)
      setUser({
        id: data.user?.id || '1',
        name: data.user?.name || 'Ahmad Ali',
        email: data.user?.email || email,
        profileComplete: data.user?.profileComplete || 75
      })
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const signup = async (name, email, password) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Signup failed')
      
      // After successful signup, automatically log in
      return await login(email, password)
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    login,
    logout,
    signup,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
