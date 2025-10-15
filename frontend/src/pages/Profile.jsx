import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="site">
      <header className="header">
        <div className="container header-inner">
          <div className="logo">CareerMap</div>
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-link">Career Map</Link>
            <Link to="/mentorship" className="nav-link">University Mentorship</Link>
            <Link to="/marketplace" className="nav-link">Marketplace</Link>
            <Link to="/profile" className="nav-link active">Profile</Link>
          </nav>
          <div className="nav-actions">
            <div className="user-menu">
              <span className="user-name">Hi, {user?.name}!</span>
              <div className="user-avatar">A</div>
            </div>
            <Link to="/dashboard" className="btn btn-ghost">Back to Dashboard</Link>
          </div>
        </div>
      </header>

      <main style={{ padding: '4rem 0' }}>
        <div className="container">
          <h1>Profile Page</h1>
          <p>This is a placeholder for the profile page. In a real application, this would contain:</p>
          <ul>
            <li>User profile information</li>
            <li>Account settings</li>
            <li>Preferences</li>
            <li>Career goals and interests</li>
            <li>Skills and achievements</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
