import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      
      // Debug logging
      console.log('Forgot password response:', data)
      
      if (!res.ok) throw new Error(data?.error || 'Failed to send reset email')
      
      // Only show success message - no reset link on page
      setSuccess('Password reset instructions have been sent to your email.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
              <h1 className="auth-title">Forgot your password?</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
              
              {error && <div className="auth-error" role="alert">{error}</div>}
              {success && <div className="auth-success" role="status">{success}</div>}
              
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input 
                    id="email" 
                    type="email" 
                    className="form-input" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Enter your email address"
                    required 
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-large" 
                    disabled={loading || !email}
                  >
                    {loading ? 'Sending...' : 'Send reset instructions'}
                  </button>
                  <Link to="/login" className="btn btn-ghost btn-large">
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
          <div className="auth-right" aria-hidden>
            <div className="auth-illustration">
              <img 
                src="https://images.pexels.com/photos/7698912/pexels-photo-7698912.jpeg" 
                alt="Professionals collaborating in a modern office" 
                className="auth-image" 
              />
              <div className="illustration-badge">🔐</div>
              <div className="illustration-card">Secure Reset</div>
              <div className="illustration-card delay">Email Verification</div>
              <div className="illustration-card delay-2">Account Recovery</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}