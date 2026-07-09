
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useChatUnreadCount from '../hooks/useChatUnreadCount';
import { getAuthToken } from '../utils/authStorage';
import ConfirmModal from '../components/ConfirmModal';
import '../styles/Dashboard.css';
import '../styles/logoAnimations.css';

const journeySteps = [
  
  {
    step: "1",
    title: "Explore",
    description: "Discover diverse career opportunities, university programs, and industries that match your interests and goals.",
    icon: "fa-solid fa-compass"
  },
  {
    step: "2",
    title: "Plan",
    description: "Create a personalized career roadmap with guidance from mentors, assessments, and curated resources.",
    icon: "fa-solid fa-map"
  },
  {
    step: "3",
    title: "Learn",
    description: "Develop new skills through recommended courses, peer learning, and interactive assessments to grow your potential.",
    icon: "fa-solid fa-graduation-cap"
  },
  {
    step: "4",
    title: "Experience",
    description: "Gain real-world exposure through internships, projects, and mentorship to strengthen your professional journey.",
    icon: "fa-solid fa-briefcase"
  },
  {
    step: "5",
    title: "Achieve",
    description: "Apply your skills, connect with opportunities, and take confident steps toward achieving your dream career.",
    icon: "fa-solid fa-trophy"
  }
];
const featureCards = [
  {
    title: "Universities",
    description: "Explore verified universities across Pakistan to find the right program that fits your career goals. Compare courses, admission details, and connect directly with university representatives.",
    icon: "fa-solid fa-university",
    image: 'images/universities.png',
    link: "/universities",
    color: "blue"
  },
  {
    title: "Mentorship & Peer Support",
    description: "Connect with experienced mentors and peers who can guide you through academic challenges, career planning, and skill-building — because learning is better together.",
    icon: "fa-solid fa-users",
    image: 'images/mentorship.png',
    link: "/mentorship",
    color: "purple"
  },
  {
    title: "Student Marketplace",
    description: "A trusted space for students to buy, sell, or exchange books, gadgets, and essentials within the campus community — safe, simple, and student-focused.",
    icon: "fa-solid fa-store",
    image: 'images/marketplace.png',
    link: "/marketplace",
    color: "green"
  },
  {
    title: "Take an Assessment",
    description: "Discover your strengths and interests through personalized assessments that help you choose the right career path and academic direction.",
    icon: "fa-solid fa-clipboard-check",
    image: 'images/Assessment.png',
    link: "/assessment",
    color: "orange"
  },
  {
    title: "Sell Your Items",
    description: "Got unused books or accessories? List and sell your items easily to other students and earn while decluttering — quick, safe, and campus-based.",
    icon: "fa-solid fa-tag",
    image: 'images/selling.png',
    link: "/marketplace/sell",
    color: "pink"
  },
  {
    title: "Apply for Tutor",
    description: "Need help mastering a subject? Browse verified tutors, view ratings, and apply for personalized learning support from fellow students or professionals.",
    icon: "fa-solid fa-chalkboard-teacher",
    image: 'images/tutor.png',
    link: "/tutor/apply",
    color: "teal"
  }
];
const Dashboard = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const chatUnreadCount = useChatUnreadCount(user?.id);
  const [trendingCareers, setTrendingCareers] = useState([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Admin career management states
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [careerModalMode, setCareerModalMode] = useState('create'); // 'create', 'edit'
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [careerToDelete, setCareerToDelete] = useState(null);
  const [careerFormData, setCareerFormData] = useState({
    title: '',
    icon: '',
    salary: '',
    demand: '',
    growth: '',
    description: '',
    skills: '',
    companies: ''
  });

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    reveals.forEach((el, i) => {
      el.classList.add('reveal-visible');
    });
    
    // Fetch career recommendations from API
    fetchCareerRecommendations();
  }, []);

  const fetchCareerRecommendations = async () => {
    try {
      setLoadingCareers(true);
      const response = await fetch('http://localhost:5000/api/careers');
      const data = await response.json();
      
      if (data.success) {
        setTrendingCareers(data.data);
      } else {
        console.error('Failed to fetch career recommendations');
      }
    } catch (error) {
      console.error('Error fetching career recommendations:', error);
    } finally {
      setLoadingCareers(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Career CRUD handlers (Admin only)
  const handleCreateCareer = () => {
    setCareerModalMode('create');
    setCareerFormData({
      title: '',
      icon: 'fa-solid fa-briefcase',
      salary: '',
      demand: '',
      growth: '',
      description: '',
      skills: '',
      companies: ''
    });
    setShowCareerModal(true);
  };

  const handleEditCareer = (career) => {
    setCareerModalMode('edit');
    setSelectedCareer(career);
    setCareerFormData({
      title: career.title,
      icon: career.icon || 'fa-solid fa-briefcase',
      salary: career.salary,
      demand: career.demand,
      growth: career.growth || '',
      description: career.description,
      skills: career.skills ? career.skills.join(', ') : '',
      companies: career.companies ? career.companies.join(', ') : ''
    });
    setShowCareerModal(true);
  };

  const handleDeleteCareer = (careerId) => {
    setCareerToDelete(careerId);
    setShowDeleteModal(true);
  };

  const confirmDeleteCareer = async () => {
    if (!careerToDelete) return;

    try {
      const token = getAuthToken()
      const response = await fetch(`http://localhost:5000/api/admin/careers/${careerToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete career');
      }

      showToast('Career deleted successfully', 'success');
      fetchCareerRecommendations();
    } catch (error) {
      showToast('Failed to delete career: ' + error.message, 'error');
    } finally {
      setShowDeleteModal(false);
      setCareerToDelete(null);
    }
  };

  const cancelDeleteCareer = () => {
    setShowDeleteModal(false);
    setCareerToDelete(null);
  };

  const handleCloseCareerModal = () => {
    setShowCareerModal(false);
    setSelectedCareer(null);
    setCareerFormData({
      title: '',
      icon: '',
      salary: '',
      demand: '',
      growth: '',
      description: '',
      skills: '',
      companies: ''
    });
  };

  const handleCareerInputChange = (e) => {
    const { name, value } = e.target;
    setCareerFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitCareer = async (e) => {
    e.preventDefault();

    try {
      const token = getAuthToken()
      const careerData = {
        title: careerFormData.title,
        icon: careerFormData.icon,
        salary: careerFormData.salary,
        demand: careerFormData.demand,
        growth: careerFormData.growth,
        description: careerFormData.description,
        skills: careerFormData.skills ? careerFormData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        companies: careerFormData.companies ? careerFormData.companies.split(',').map(c => c.trim()).filter(c => c) : []
      };

      const url = careerModalMode === 'create' 
        ? 'http://localhost:5000/api/admin/careers'
        : `http://localhost:5000/api/admin/careers/${selectedCareer._id}`;

      const method = careerModalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(careerData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save career');
      }

      showToast(`Career ${careerModalMode === 'create' ? 'created' : 'updated'} successfully`, 'success');
      handleCloseCareerModal();
      fetchCareerRecommendations();
    } catch (error) {
      console.error('Career save error:', error);
      showToast('Failed to save career: ' + error.message, 'error');
    }
  };


  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="container header-inner">
          <div className="logo-container">
            <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" />
            <div className="logo-brand-group">
              <span className="logo-text">CareerMap</span>
              <span className="logo-tagline">Find Your Way. Own Your Future.</span>
            </div>
          </div>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          
          <nav className={`nav-links reveal ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/dashboard" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/universities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
               Universities
            </Link>
            <Link to="/mentorship" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Mentorship
            </Link>
            <Link to="/marketplace" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
             MarketPlace
            </Link>
            {user?.isAdmin && (
              <Link to="/admin" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                Admin Dashboard
              </Link>
            )}
          </nav>

          <div className="nav-actions reveal">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name || 'User'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  />
                ) : (
                  user?.name?.charAt(0).toUpperCase()
                )}
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                <span className="hero-title-main">Your Journey to Academic Success Starts Here</span>
              </h1>
              <p className="hero-description">  Discover your ideal career path through personalized guidance and career assessments.
                Connect with mentors, explore universities, and unlock your full potential.
              </p>
              <div className="hero-buttons">
                <Link to="/assessment" className="btn-hero-primary">
                  Get Started
                  <i className="fa-solid fa-arrow-right"></i>
                </Link>
                <Link to="/assessment" className="btn-hero-secondary">
                  Take Assessment
                </Link>
              </div>
             
            </div>
            <div className="hero-image">
             <img 
  src="public\images\dashbored image.webp"
  alt="Students studying together"
/>
            </div>
          </div>
        </section>

      
        <section className="section career-journey">
          <div className="container">
            <h2 className="section-title">Your Career Journey</h2>
            <p className="section-subtitle">Follow these steps to achieve your career goals</p>
            
            <div className="journey-cards-grid">
              {journeySteps.map((step, index) => (
                <div key={index} className="journey-card">
                  <div className="journey-card-header">
                    <div className="journey-card-icon-wrapper">
                      <i className={step.icon}></i>
                    </div>
                    <div className="journey-card-number">{step.step}</div>
                  </div>
                  <h3 className="journey-card-title">{step.title}</h3>
                  <p className="journey-card-description">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

   
        <section className="section feature-cards-section">
          <div className="container">
            <h2 className="section-title">Explore Our Features</h2>
            <p className="section-subtitle">Everything you need to plan and achieve your career goals</p>
            
            <div className="grid-3 feature-cards-grid">
              {featureCards.map((feature, index) => (
                <Link 
                  key={index} 
                  to={feature.link} 
                  className="feature-card"
                >
                  {feature.image && (
                    <div className="feature-card-media">
                      <img src={feature.image} alt={feature.title} onError={(e)=>{e.currentTarget.src='https://picsum.photos/600/400'}} />
                    </div>
                  )}
                  <div className={`feature-card-icon ${feature.color}`}>
                    <i className={feature.icon}></i>
                  </div>
                  <h3 className="feature-card-title">{feature.title}</h3>
                  <p className="feature-card-description">{feature.description}</p>
                  <div className="feature-card-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <div className="feature-cards-spacer"></div>
        </section>

      
        <section className="section recommended-careers">
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '0.5rem' }}>Recommended Career Paths in Pakistan</h2>
            <p className="section-subtitle">High-demand and trending career fields in the current market</p>
            
            {user?.isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                <button onClick={handleCreateCareer} className="btn-create">
                  <i className="fa-solid fa-plus"></i> Add Career
                </button>
              </div>
            )}
            
            {loadingCareers ? (
              <div className="careers-grid">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="trending-card skeleton-loader">
                    <div className="skeleton-header"></div>
                    <div className="skeleton-title"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text"></div>
                  </div>
                ))}
              </div>
            ) : trendingCareers.length === 0 ? (
              <div className="no-careers-message">
                <i className="fas fa-info-circle"></i>
                <p>No career recommendations available at the moment.</p>
              </div>
            ) : (
              <div className="careers-grid">
                {trendingCareers.map((career, index) => (
                  <div key={career._id || index} className="trending-card">
                    {user?.isAdmin && (
                      <div className="career-admin-actions">
                        <button onClick={() => handleEditCareer(career)} className="btn-icon btn-edit" title="Edit">
                          <i className="fa-solid fa-pen"></i>
                        </button>
                        <button onClick={() => handleDeleteCareer(career._id)} className="btn-icon btn-delete" title="Delete">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    )}
                    <div className="trending-header">
                      <i className={career.icon}></i>
                    </div>
                    <h3 className="trending-title">{career.title}</h3>
                    <div className="trending-stats">
                      <div className="stat">
                        <i className="fas fa-money-bill-wave"></i>
                        <span>{career.salary}</span>
                      </div>
                      <div className="stat">
                        <i className="fas fa-chart-line"></i>
                        <span>{career.demand}</span>
                      </div>
                    </div>
                    <p className="trending-description">{career.description}</p>
                    {career.skills && career.skills.length > 0 && (
                      <div className="skills-tags">
                        {career.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    )}
                    {career.companies && career.companies.length > 0 && (
                      <div className="companies-hiring">
                        <small>Top Companies Hiring:</small>
                        <div className="company-tags">
                          {career.companies.map((company, i) => (
                            <span key={i} className="company-tag">{company}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                <Link to="/help">Help Center</Link>
                <Link to="/privacy">Privacy Policy</Link>
                <Link to="/terms">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="muted">© {new Date().getFullYear()} CareerMap Limited. All rights reserved.</div>
          </div>
        </div>
      </footer>

      {/* Career Modal for Admin */}
      {showCareerModal && (
        <div className="modal-overlay" onClick={handleCloseCareerModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{careerModalMode === 'create' ? 'Add New Career' : 'Edit Career'}</h2>
              <button onClick={handleCloseCareerModal} className="modal-close">
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitCareer} className="modal-body">
              <div className="form-group">
                <label htmlFor="title">Career Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={careerFormData.title}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., Software Engineer"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="icon">Icon Class</label>
                <input
                  type="text"
                  id="icon"
                  name="icon"
                  value={careerFormData.icon}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., fa-solid fa-code"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>Use Font Awesome icon classes</small>
              </div>

              <div className="form-group">
                <label htmlFor="salary">Salary Range *</label>
                <input
                  type="text"
                  id="salary"
                  name="salary"
                  value={careerFormData.salary}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., PKR 80K-150K"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="demand">Demand Level *</label>
                <input
                  type="text"
                  id="demand"
                  name="demand"
                  value={careerFormData.demand}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., Very High"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="growth">Growth Rate</label>
                <input
                  type="text"
                  id="growth"
                  name="growth"
                  value={careerFormData.growth}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., +25%"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={careerFormData.description}
                  onChange={handleCareerInputChange}
                  placeholder="Brief description of the career"
                  required
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills (comma-separated)</label>
                <input
                  type="text"
                  id="skills"
                  name="skills"
                  value={careerFormData.skills}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., JavaScript, Python, Cloud"
                />
              </div>

              <div className="form-group">
                <label htmlFor="companies">Top Companies (comma-separated)</label>
                <input
                  type="text"
                  id="companies"
                  name="companies"
                  value={careerFormData.companies}
                  onChange={handleCareerInputChange}
                  placeholder="e.g., Systems Ltd, NETSOL, Arbisoft"
                />
              </div>

              <div className="modal-footer">
                <button type="button" onClick={handleCloseCareerModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {careerModalMode === 'create' ? 'Create Career' : 'Update Career'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Career Recommendation"
        message="Are you sure you want to delete this career recommendation? This action cannot be undone."
        onConfirm={confirmDeleteCareer}
        onCancel={cancelDeleteCareer}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default Dashboard;