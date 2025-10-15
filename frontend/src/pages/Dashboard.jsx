import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FeatureCard, SectionTitle, Button, StatsCard, ProcessStep } from '../ui/index.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const careerRecommendations = [
    {
      category: "Tech",
      percentage: 85,
      icon: "💻",
      color: "blue",
      description: "Strong match for software development, data science, and AI roles"
    },
    {
      category: "Business",
      percentage: 72,
      icon: "💼",
      color: "purple",
      description: "Excellent potential for management, consulting, and entrepreneurship"
    },
    {
      category: "Medicine",
      percentage: 45,
      icon: "🏥",
      color: "green",
      description: "Moderate interest in healthcare and medical sciences"
    },
    {
      category: "Arts",
      percentage: 38,
      icon: "🎨",
      color: "pink",
      description: "Creative fields like design, media, and fine arts"
    }
  ]

  const journeySteps = [
    {
      step: "1",
      title: "Explore Career Paths",
      description: "Discover diverse career opportunities across different industries and sectors",
      icon: "🔍",
      status: "completed"
    },
    {
      step: "2", 
      title: "Self-Assessment",
      description: "Complete personality and skills assessments for personalized recommendations",
      icon: "📋",
      status: "in-progress"
    },
    {
      step: "3",
      title: "Skill Development",
      description: "Build essential skills through courses, workshops, and practical experience",
      icon: "📚",
      status: "pending"
    },
    {
      step: "4",
      title: "Network Building",
      description: "Connect with mentors, peers, and industry professionals",
      icon: "🤝",
      status: "pending"
    },
    {
      step: "5",
      title: "Career Launch",
      description: "Apply for opportunities and start your professional journey",
      icon: "🚀",
      status: "pending"
    }
  ]

  const trendingCareers = [
    {
      title: "Software Engineer",
      growth: "+25%",
      salary: "PKR 80K-150K",
      demand: "Very High",
      icon: "👨‍💻",
      description: "High demand in Pakistan's growing tech sector"
    },
    {
      title: "Data Scientist",
      growth: "+35%",
      salary: "PKR 100K-200K", 
      demand: "Very High",
      icon: "📊",
      description: "AI and analytics roles expanding rapidly"
    },
    {
      title: "Digital Marketing",
      growth: "+30%",
      salary: "PKR 50K-100K",
      demand: "High",
      icon: "📱",
      description: "Essential for businesses going digital"
    },
    {
      title: "Financial Analyst",
      growth: "+20%",
      salary: "PKR 60K-120K",
      demand: "High", 
      icon: "📈",
      description: "Growing finance sector opportunities"
    },
    {
      title: "UI/UX Designer",
      growth: "+40%",
      salary: "PKR 45K-90K",
      demand: "Very High",
      icon: "🎨",
      description: "Critical for user-focused digital products"
    },
    {
      title: "Project Manager",
      growth: "+18%",
      salary: "PKR 70K-130K",
      demand: "High",
      icon: "📋",
      description: "Leadership roles in expanding companies"
    }
  ]

  const quickActions = [
    { title: "Complete Profile", icon: "👤", link: "/profile", color: "blue" },
    { title: "Find Mentors", icon: "🎓", link: "/mentorship", color: "purple" },
    { title: "Browse Jobs", icon: "💼", link: "/marketplace", color: "green" },
    { title: "Skill Assessment", icon: "📊", link: "/assessment", color: "orange" }
  ]

  return (
    <div className="site">
      {/* Header for authenticated users */}
      <header className="header">
        <div className="container header-inner">
          <div className="logo">CareerMap</div>
          <nav className="nav-links">
            <Link to="/dashboard" className="nav-link active">Career Map</Link>
            <Link to="/mentorship" className="nav-link">University Mentorship</Link>
            <Link to="/marketplace" className="nav-link">Marketplace</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
          </nav>
          <div className="nav-actions">
            <div className="user-menu">
              <span className="user-name">Hi, {user.name}!</span>
              <div className="user-avatar">A</div>
            </div>
            <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main>
        {/* Welcome Section */}
        <section className="dashboard-hero">
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">Welcome back, {user.name}! 👋</h1>
              <p className="hero-subtitle">
                Ready to continue your career journey? Let's explore new opportunities and track your progress.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary btn-large assessment-btn">
                  <span className="btn-text">Take Assessment</span>
                  <span className="btn-icon">📊</span>
                  <span className="btn-pulse"></span>
                </button>
                <p className="assessment-note">Get personalized career recommendations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="container">
            <SectionTitle title="Quick Actions" />
            <div className="actions-grid">
              {quickActions.map((action, index) => (
                <Link key={index} to={action.link} className="action-card">
                  <div className={`action-icon action-icon-${action.color}`}>{action.icon}</div>
                  <div className="action-title">{action.title}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Career Recommendations */}
        <section className="career-recommendations">
          <div className="container">
            <SectionTitle 
              overline="Personalized Insights" 
              title="Your Career Recommendation Summary" 
            />
            <div className="recommendations-grid">
              {careerRecommendations.map((rec, index) => (
                <div key={index} className={`recommendation-card recommendation-${rec.color}`}>
                  <div className="rec-header">
                    <div className="rec-icon">{rec.icon}</div>
                    <div className="rec-category">{rec.category}</div>
                  </div>
                  <div className="rec-percentage">{rec.percentage}%</div>
                  <div className="rec-description">{rec.description}</div>
                  <div className="rec-progress">
                    <div 
                      className="rec-progress-bar" 
                      style={{ width: `${rec.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Career Journey */}
        <section className="career-journey">
          <div className="container">
            <SectionTitle 
              overline="Your Journey" 
              title="5-Step Career Development Process" 
            />
            <div className="journey-steps">
              {journeySteps.map((step, index) => (
                <div key={index} className={`journey-step journey-${step.status}`}>
                  <div className="step-indicator">
                    <div className="step-number">{step.step}</div>
                    <div className="step-icon">{step.icon}</div>
                  </div>
                  <div className="step-content">
                    <h3 className="step-title">{step.title}</h3>
                    <p className="step-description">{step.description}</p>
                    <div className="step-status">
                      <span className={`status-badge status-${step.status}`}>
                        {step.status === 'completed' ? '✓ Completed' : 
                         step.status === 'in-progress' ? '⏳ In Progress' : 
                         '⏸ Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trending Careers in Pakistan */}
        <section className="trending-careers">
          <div className="container">
            <SectionTitle 
              overline="Market Insights" 
              title="Trending Careers in Pakistan's Job Market" 
            />
            <div className="careers-grid">
              {trendingCareers.map((career, index) => (
                <div key={index} className="career-card">
                  <div className="career-header">
                    <div className="career-icon">{career.icon}</div>
                    <div className="career-meta">
                      <div className="career-title">{career.title}</div>
                      <div className="career-growth growth-positive">{career.growth}</div>
                    </div>
                  </div>
                  <div className="career-details">
                    <div className="career-salary">💰 {career.salary}</div>
                    <div className="career-demand">
                      <span className={`demand-badge demand-${career.demand.toLowerCase().replace(' ', '-')}`}>
                        {career.demand} Demand
                      </span>
                    </div>
                  </div>
                  <p className="career-description">{career.description}</p>
                  <Button variant="ghost" className="career-action">
                    Learn More →
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Progress Stats */}
        <section className="progress-stats">
          <div className="container">
            <SectionTitle title="Your Progress Overview" />
            <div className="stats-grid">
              <StatsCard number="3" label="Skills Developed" color="blue" />
              <StatsCard number="12" label="Courses Completed" color="purple" />
              <StatsCard number="5" label="Connections Made" color="green" />
              <StatsCard number="85%" label="Profile Complete" color="orange" />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="footer-content">
            <div className="footer-section">
              <h4>CareerMap</h4>
              <p>Your trusted guide for academic and career success.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <div className="footer-links">
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/mentorship">Mentorship</Link>
                <Link to="/marketplace">Marketplace</Link>
                <Link to="/profile">Profile</Link>
              </div>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <div className="footer-links">
                <a href="/help">Help Center</a>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="muted">© {new Date().getFullYear()} CareerMap Limited. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
