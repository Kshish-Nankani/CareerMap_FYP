import { Link } from 'react-router-dom'
import { FeatureCard, TestimonialCard, SectionTitle, Button, StatsCard, ProcessStep, PartnerLogo } from '../ui/index.jsx'

export default function GuestHome() {
  return (
    <div className="site">
      <header className="header">
        <div className="container header-inner">
          <div className="logo">CareerMap</div>
          <nav className="nav-actions">
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/signup" className="btn btn-primary">Signup</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <h1 className="hero-title">Your trusted guide for academic and career success</h1>
              <div className="muted" style={{ fontWeight: 700, letterSpacing: '.4px', margin: '6px 0 8px' }}>one platform every student need</div>
              <p className="hero-subtitle">
                Join thousands of students who've discovered their perfect career path. 
                From school leavers to graduates, we're here to guide your journey.
              </p>
              <div className="hero-ctas">
                <Link to="/signup" className="btn btn-primary btn-large">Get Started Free</Link>
                <a href="#features" className="btn btn-ghost btn-large">Watch Demo</a>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <span className="stat-number">50K+</span>
                  <span className="stat-label">Students Helped</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">1,000+</span>
                  <span className="stat-label">Partner Companies</span>
                </div>
                <div className="stat-item">
                  <span className="stat-number">95%</span>
                  <span className="stat-label">Success Rate</span>
                </div>
              </div>
            </div>
            <div className="hero-art" aria-hidden>
              <div className="blob blob-1" />
              <div className="blob blob-2" />
              <div className="card-float shadow float-1">Career Guidance</div>
              <div className="card-float shadow delay float-2">Mentorship</div>
              <div className="card-float shadow delay-2 float-3">University Listings</div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="stats-grid">
              <StatsCard number="50,000+" label="Students Connected" color="blue" />
              <StatsCard number="95%" label="Success Rate" color="purple" />
              <StatsCard number="24/7" label="Support Available" color="orange" />
            </div>
          </div>
        </section>

        <section className="what-we-do" id="what-we-do">
          <div className="container">
            <SectionTitle overline="What we do" title="Empower students to discover and succeed" />
            <div className="grid-3">
              <FeatureCard title="Discover" desc="Find courses, apprenticeships, and roles tailored to your interests and skills" />
              <FeatureCard title="Connect" desc="Mentors, peers, and verified universities at your fingertips" />
              <FeatureCard title="Grow" desc="Build skills and confidence to reach your goals" />
            </div>
          </div>
        </section>

        <section className="process-section">
          <div className="container">
            <SectionTitle overline="How it works" title="Your journey in 3 simple steps" />
            <div className="process-steps">
              <ProcessStep step="1" title="Create Your Profile" desc="Tell us about your interests, skills, and career goals" />
              <ProcessStep step="2" title="Get Matched" desc="Our AI finds perfect opportunities and mentors for you" />
              <ProcessStep step="3" title="Start Your Journey" desc="Connect, learn, and grow with our community" />
            </div>
          </div>
        </section>

        <section className="testimonials" id="testimonials">
          <div className="container">
            <SectionTitle overline="Testimonials" title="Students love CareerMap" />
            <div className="grid-3">
              <TestimonialCard quote="CareerMap helped me find my way when I was getting nowhere with finding a graduate scheme. Within 1 week of reaching out to them, they found me a role that matched what I was looking for!" author="Meekyle" role="Graduate" />
              <TestimonialCard quote="I can't thank CareerMap enough for helping me find the apprenticeship I've always wanted. The mentorship program was incredible!" author="Lauren" role="Apprentice" />
              <TestimonialCard quote="I was unsure what I wanted to do but CareerMap helped me to find careers I never even knew existed. Thank you!" author="Saeed" role="Student" />
              <TestimonialCard quote="The job hunting process was made easy by CareerMap. They showed patience to secure the perfect role for me. I've now been working for the same company for 3 years!" author="Jessy" role="Professional" />
              <TestimonialCard quote="I loved joining CareerMap's National Intern Week with IBM and actually won the StudentUniverse travel voucher which was an added bonus!" author="Molly" role="Intern" />
              <TestimonialCard quote="CareerMap's events connected me with leading employers I never would have met otherwise. Game changer!" author="Alex" role="Graduate" />
            </div>
          </div>
        </section>

        <section className="features" id="features">
          <div className="container">
            <SectionTitle overline="What our app will do for you" title="Everything you need to plan your future" />
            <div className="grid-3">
              <FeatureCard title="Career Guidance" icon="🧭" desc="Personalised recommendations and pathways based on your profile" hover />
              <FeatureCard title="Mentorship" icon="🎓" desc="Connect with industry mentors and career coaches" hover />
              <FeatureCard title="Peer Tutoring" icon="👥" desc="Learn with and from peers in study groups" hover />
              <FeatureCard title="Student Marketplace" icon="🛍️" desc="Buy and sell textbooks, services, and resources" hover />
              <FeatureCard title="Verified Universities" icon="🏛️" desc="Trustworthy listings and detailed information" hover />
              <FeatureCard title="Skill Assessment" icon="📊" desc="Test and improve your professional skills" hover />
            </div>
          </div>
        </section>


        <section className="contact-cta" id="contact">
          <div className="container contact-inner">
            <div className="contact-content">
              <h2>Ready to start your career journey?</h2>
              <p>Join thousands of students who've found their path with CareerMap. Register now to unlock all features and connect with our community.</p>
              <div className="contact-benefits">
                <div className="benefit-item">✓ Free career assessment</div>
                <div className="benefit-item">✓ Access to mentor network</div>
                <div className="benefit-item">✓ Exclusive job opportunities</div>
                <div className="benefit-item">✓ 24/7 community support</div>
              </div>
            </div>
            <div className="contact-actions">
              <Link to="/signup" className="btn btn-primary btn-large">Get Started Free</Link>
              <p className="contact-note">No credit card required • Join 50,000+ students</p>
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
                <a href="#testimonials">Testimonials</a>
                <a href="#features">Features</a>
                <a href="#contact">Contact</a>
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
            <div className="social-links">
              <a href="#" aria-label="Facebook">📘</a>
              <a href="#" aria-label="Twitter">🐦</a>
              <a href="#" aria-label="LinkedIn">💼</a>
              <a href="#" aria-label="YouTube">📺</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
