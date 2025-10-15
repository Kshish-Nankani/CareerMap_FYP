import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    const result = await signup(name, email, password)
    
    if (result.success) {
      // Automatically redirected to dashboard after successful signup
      navigate('/dashboard', { replace: true })
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-layout">
          <div className="auth-left">
            <div className="auth-brand">
              <div className="logo">CareerMap</div>
            </div>
            <div className="back-row"><Link to="/" className="btn btn-ghost back-link" aria-label="Back to home">← Back to home</Link></div>
            <div className="auth-card">
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Join CareerMap and start your journey</p>
              {error && <div className="auth-error" role="alert">{error}</div>}
              <form onSubmit={onSubmit} className="auth-form" noValidate>
                <div className="form-field">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input id="name" type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="form-field">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-large" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
                  <Link to="/login" className="btn btn-ghost btn-large">Sign in</Link>
                </div>
              </form>
            </div>
          </div>
          <div className="auth-right" aria-hidden>
            <div className="auth-illustration">
              <img src="https://images.pexels.com/photos/7698912/pexels-photo-7698912.jpeg" alt="Professionals collaborating in a modern office" className="auth-image" />
              <div className="illustration-badge">★</div>
              <div className="illustration-card">Learn & Grow</div>
              <div className="illustration-card delay">Connect & Mentor</div>
              <div className="illustration-card delay-2">Find Opportunities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
