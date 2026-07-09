import { createContext, useContext, useState, useEffect } from 'react'
import { fetchWithErrorHandling } from '../utils/api'
import { clearAuthToken, getAuthToken, migrateLegacyTokenToSession, setAuthToken } from '../utils/authStorage'

const AuthContext = createContext()

const mapProfileToAuthUser = (data = {}) => ({
  id: data._id || data.id,
  name: data.fullName || data.name,
  fullName: data.fullName || data.name,
  email: data.email,
  phone: data.phone,
  city: data.city,
  gender: data.gender,
  dateofbirth: data.dateofbirth,
  careerInterest: data.careerInterest,
  profileImage: data.profileImage,
  schoolUniversity: data.schoolUniversity,
  degreeGradeType: data.degreeGradeType,
  department: data.department,
  currentSemesterYear: data.currentSemesterYear,
  cgpaPercentage: data.cgpaPercentage,
  careerPathStages: data.careerPathStages,
  isAdmin: data.isAdmin || false,
  isTutor: data.isTutor || false,
  isSeller: data.isSeller || false,
  tutorBio: data.tutorBio || '',
  tutorOfferings: Array.isArray(data.tutorOfferings) ? data.tutorOfferings : []
})

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

  const fetchProfileWithToken = async (token) => {
    const data = await fetchWithErrorHandling('/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    return mapProfileToAuthUser(data)
  }

  const applyTokenToUserState = async (token) => {
    const normalizedToken = String(token || '').trim()
    if (!normalizedToken) {
      setUser(null)
      return { ok: true }
    }

    try {
      const mappedUser = await fetchProfileWithToken(normalizedToken)
      setUser(mappedUser)
      return { ok: true }
    } catch (err) {
      if (getAuthToken() === normalizedToken) {
        clearAuthToken()
      }
      setUser(null)
      return { ok: false, error: err }
    }
  }

  useEffect(() => {
    let isMounted = true

    const bootstrapAuth = async () => {
      setLoading(true)
      const token = migrateLegacyTokenToSession() || getAuthToken()

      if (token) {
        const result = await applyTokenToUserState(token)
        if (!result.ok) {
          console.error('Auth check failed:', result.error?.message)
        }
      } else {
        setUser(null)
      }

      if (isMounted) {
        setLoading(false)
      }
    }

    bootstrapAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email, password) => {
    try {
      const data = await fetchWithErrorHandling('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },  
        body: JSON.stringify({ email, password })
      });
      
      setAuthToken(data.token)

      const result = await applyTokenToUserState(data.token)
      if (!result.ok) {
        return { success: false, error: result.error?.message || 'Failed to load user profile' }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  const logout = () => {
    clearAuthToken()
    setUser(null)
  }

  const signup = async (name, email, password) => {
    try {
      await fetchWithErrorHandling('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      // If signup returns that verification is required, inform caller
      return { success: true, needsVerification: true, email };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Accept a token returned from verification to complete login
  const completeLoginWithToken = async (token) => {
    try {
      setAuthToken(token)

      const result = await applyTokenToUserState(token)
      if (!result.ok) {
        return { success: false, error: result.error?.message || 'Failed to load user profile' }
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  }

  const value = {
    user,
    login,
    logout,
    signup,
    completeLoginWithToken,
    updateUser,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
