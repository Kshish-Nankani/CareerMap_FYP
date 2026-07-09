import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { FeatureCard, SectionTitle, ProcessStep } from '../ui/index.jsx'
import { useAuth } from '../contexts/AuthContext'
import '../styles/GuestHome.css'
import '../styles/logoAnimations.css'

export default function GuestHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
   
    const handleAnchorClick = (e) => {
      const href = e.target.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    document.addEventListener('click', handleAnchorClick)
    return () => document.removeEventListener('click', handleAnchorClick)
  }, [])


  const featureRoutes = {
    'Career Guidance': '/assessment',
    'Mentorship': '/mentorship',
    'Peer Tutoring': '/mentorship',
    'Student Marketplace': '/marketplace',
    'Verified Universities': '/universities',
    'Skill Assessment': '/assessment'
  }

  const handleFeatureClick = (featureTitle) => {
    if (!user) {
      
      navigate('/login', { state: { from: featureRoutes[featureTitle] || '/dashboard' } })
    } else {
      
      const route = featureRoutes[featureTitle]
      if (route) {
        navigate(route)
      }
    }
  }

  return (
    <div className="site">
      <header className="header">
        <div className="container header-inner">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
            <div className="logo-brand-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
              <span className="logo-text" style={{ fontSize: '30px', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
              <span className="logo-tagline" style={{ fontSize: '11px', fontWeight: '600', color: '#8b6e58', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find Your Way. Own Your Future.</span>
            </div>
          </div>
          <nav className="nav-actions">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero-modern">
          <div className="container">
            <div className="hero-split-layout">
            
              <div className="hero-content-left">
                <h1 className="hero-title-main">
                  Your Future <span className="highlight-text">Our Responsibility</span> 
                </h1>
                <p className="hero-description">
                  Navigate your academic journey with confidence. Get personalized career guidance, connect with mentors, and discover the perfect university match for your goals.
                </p>
                <div className="hero-actions">
                  <Link to="/signup" className="btn btn-primary btn-hero">
                    Get Started Free
                  </Link>
                  <Link to="/login" state={{ from: '/assessment' }} className="btn btn-secondary btn-hero">
                    Take Assessment
                  </Link>
                </div>
              </div>

              
              <div className="hero-images-right">
               
                <div className="hero-circle circle-1">
                  <img src="/images/studnet2.jpg" alt="Student" />
                </div>
                
              
                <div className="hero-circle circle-2">
                  <img src="/images/Careerimage.webp" alt="Student learning" />
                </div>
                <div className="hero-circle circle-3">
                  <img src="/images/student4.jpg" alt="Student with books" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="what-we-do" id="what-we-do">
          <div className="container">
            <SectionTitle overline="What we do" title="Empower students to discover and succeed" />
            <div className="grid-3">
              <FeatureCard 
                title="Discover" 
                icon={<i className="fa-solid fa-magnifying-glass" aria-hidden></i>} 
                desc="Explore opportunities that match your path. Find degrees, courses, and career options tailored to your goals, interests, and skills."
                image="/images/discover.png"
              />
              <FeatureCard 
                title="Connect" 
                icon={<i className="fa-solid fa-hands-helping" aria-hidden></i>} 
                desc="Build your network, grow your guidance. Connect with mentors, peers, and verified universities — all in one trusted platform."
                image="/images/connect.png"
              />
              <FeatureCard 
                title="Grow" 
                icon={<i className="fa-solid fa-chart-line" aria-hidden></i>} 
                desc="Turn ambition into achievement. Develop the skills, experience, and confidence to reach your academic and career goals."
                image="/images/grow.png"
              />
            </div>
          </div>
        </section>

        <section className="process-section" id="how-it-works">
          <div className="container">
            <SectionTitle overline="How it works" title="Your journey in 3 simple steps" />
            <div className="process-steps">
              <ProcessStep step="1" delay={1} title="Create Your Profile" desc="Tell us about your interests, skills, and career goals" />
              <ProcessStep step="2" delay={2} title="Explore" desc="Explore top universities and mentors who guide your journey." />
              <ProcessStep step="3" delay={3} title="Start Your Journey" desc="Connect, learn, and grow with our community" />
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="container">
            <SectionTitle overline="What our app will do for you" title="Everything you need to plan your future" />
            <div className="grid-3">
              <div onClick={() => handleFeatureClick('Career Guidance')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Career Guidance" icon={<i className="fa-solid fa-compass" ></i>} desc="Personalised recommendations and pathways based on your profile" hover />
              </div>
              <div onClick={() => handleFeatureClick('Mentorship')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Mentorship" icon={<i className="fa-solid fa-graduation-cap" aria-hidden></i>} desc="Connect with industry mentors and career coaches" hover />
              </div>
              <div onClick={() => handleFeatureClick('Peer Tutoring')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Peer Tutoring" icon={<i className="fa-solid fa-users" aria-hidden></i>} desc="Learn with and from peers in study groups" hover />
              </div>
              <div onClick={() => handleFeatureClick('Student Marketplace')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Student Marketplace" icon={<i className="fa-solid fa-store" aria-hidden></i>} desc="Buy and sell textbooks, services, and resources" hover />
              </div>
              <div onClick={() => handleFeatureClick('Verified Universities')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Verified Universities" icon={<i className="fa-solid fa-university" aria-hidden></i>} desc="Trustworthy listings and detailed information" hover />
              </div>
              <div onClick={() => handleFeatureClick('Skill Assessment')} style={{ cursor: 'pointer' }}>
                <FeatureCard title="Skill Assessment" icon={<i className="fa-solid fa-chart-simple" aria-hidden></i>} desc="Test and improve your professional skills" hover />
              </div>
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
                <a href="#what-we-do">What we do</a>
                <a href="#how-it-works">How it Works</a>
                <a href="#features">Features</a>
                <a href="#">Contact</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Support</h4>
              <div className="footer-links">
                <a href="#">Help Center</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="muted">© {new Date().getFullYear()} CareerMap Limited. All rights reserved.</div>
            <div className="social-links">
              <a href="#" aria-label="LinkedIn"><i className="fab fa-linkedin"></i></a>
              <a href="#" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
              <a href="#" aria-label="GitHub"><i className="fab fa-github"></i></a>
              <a href="#" aria-label="Twitter"><i className="fab fa-twitter"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
