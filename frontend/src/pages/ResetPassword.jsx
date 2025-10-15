import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  useEffect(() => {
    // If no token or email in URL, redirect to forgot password page
    if (!token || !email) {
      navigate('/forgot')
    }
  }, [token, email, navigate])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password })
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data?.error || 'Failed to reset password')
      
      setSuccess('Password has been reset successfully! Redirecting to login...')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if missing required params (will redirect)
  if (!token || !email) {
    return null
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-left">
            <div className="auth-brand">
              <div className="logo">CareerMap</div>
            </div>
            <div className="back-row">
              <Link to="/login" className="btn btn-ghost back-link" aria-label="Back to login">
                ← Back to login
              </Link>
            </div>
            <div className="auth-card">
              <h1 className="auth-title">Reset your password</h1>
              <p className="auth-subtitle">
                Enter your new password below to complete the reset process.
              </p>
              
              {error && <div className="auth-error" role="alert">{error}</div>}
              {success && <div className="auth-success" role="status">{success}</div>}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="password" className="form-label">New password</label>
                  <input 
                    id="password" 
                    type="password" 
                    className="form-input" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Enter your new password"
                    required 
                    minLength="6"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
                  <input 
                    id="confirmPassword" 
                    type="password" 
                    className="form-input" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Confirm your new password"
                    required 
                    minLength="6"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large" 
                    disabled={loading || !password || !confirmPassword}
                  >
                    {loading ? 'Resetting...' : 'Reset password'}
                  </button>
                  <Link to="/login" className="btn btn-ghost btn-large">
                    Back to sign in
                  </Link>
                </div>
              </form>

              <div className="auth-meta">
                <p className="text-sm text-gray-600">
                  Resetting password for: <strong>{decodeURIComponent(email)}</strong>
                </p>
              </div>
            </div>
          </div>
          <div className="auth-right" aria-hidden>
            <div className="auth-illustration">
              <img 
                src="https://images.pexels.com/photos/7698912/pexels-photo-7698912.jpeg" 
                alt="Professionals collaborating in a modern office" 
                className="auth-image" 
              />
              <div className="illustration-badge">🔑</div>
              <div className="illustration-card">New Password</div>
              <div className="illustration-card delay">Secure Account</div>
              <div className="illustration-card delay-2">Ready to Go</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}