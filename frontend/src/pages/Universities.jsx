import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useChatUnreadCount from '../hooks/useChatUnreadCount';
import { getAuthToken } from '../utils/authStorage';
import { API_BASE_URL, SERVER_URL } from '../utils/api';

import ConfirmModal from '../components/ConfirmModal';
import '../styles/Universities.css'
import '../styles/logoAnimations.css';

const Universities = () => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('Karachi');
  const [filterDiscipline, setFilterDiscipline] = useState('');
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [viewDetailsUniversity, setViewDetailsUniversity] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [universityToDelete, setUniversityToDelete] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 9, total: 0, pages: 0 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const chatUnreadCount = useChatUnreadCount(user?.id);

  const [formData, setFormData] = useState({
    name: '',
    location: { city: '', state: '', country: 'Pakistan' },
    description: '',
    establishedYear: new Date().getFullYear(),
    ranking: { national: '', global: '' },
    type: 'Public',
    affiliation: '',
    website: '',
    email: '',
    phone: '',
    admissionProcess: '',
    fees: { min: '', max: '', currency: 'PKR' },
    image: '',
    facilities: [],
    courses: []
  });

  useEffect(() => {
    fetchUniversities();
    fetchStates();
    fetchCities();
    fetchDisciplines();
  }, [pagination.page, searchTerm, filterType, filterState, filterCity, filterDiscipline]);

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterState && { state: filterState }),
        ...(filterCity && { city: filterCity }),
        ...(filterDiscipline && { discipline: filterDiscipline })
      });

      const response = await fetch(`${API_BASE_URL}/universities?${params}`);
      const data = await response.json();
      
      setUniversities(data.universities);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      showToast('Error fetching universities', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/filters/states`);
      const data = await response.json();
      setStates(data);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/filters/cities`);
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchDisciplines = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/universities/filters/disciplines`);
      const data = await response.json();
      setDisciplines(data);
    } catch (error) {
      console.error('Error fetching disciplines:', error);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (type, value) => {
    if (type === 'type') setFilterType(value);
    if (type === 'state') setFilterState(value);
    if (type === 'city') setFilterCity(value);
    if (type === 'discipline') setFilterDiscipline(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterState('');
    setFilterCity('');
    setFilterDiscipline('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const token = getAuthToken()
      const url = editingUniversity 
        ? `${API_BASE_URL}/universities/${editingUniversity._id}`
        : `${API_BASE_URL}/universities`;
      
      const method = editingUniversity ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast(`University ${editingUniversity ? 'updated' : 'created'} successfully`, 'success');
        setShowModal(false);
        resetForm();
        fetchUniversities();
      } else {
        const error = await response.json();
        showToast(error.message || 'Operation failed', 'error');
      }
    } catch (error) {
      showToast('Error saving university', 'error');
      console.error('Error:', error);
    }
  };

  const handleDelete = (id) => {
    setUniversityToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!universityToDelete) return;

    try {
      const token = getAuthToken()
      const response = await fetch(`${API_BASE_URL}/universities/${universityToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showToast('University deleted successfully', 'success');
        fetchUniversities();
      } else {
        const error = await response.json();
        showToast(error.message || 'Delete failed', 'error');
      }
    } catch (error) {
      showToast('Error deleting university', 'error');
      console.error('Error:', error);
    } finally {
      setShowDeleteModal(false);
      setUniversityToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUniversityToDelete(null);
  };

  const handleEdit = (university) => {
    setEditingUniversity(university);
    setFormData({
      name: university.name,
      location: university.location,
      description: university.description,
      establishedYear: university.establishedYear,
      ranking: university.ranking || { national: '', global: '' },
      type: university.type,
      affiliation: university.affiliation || '',
      website: university.website || '',
      email: university.email || '',
      phone: university.phone || '',
      admissionProcess: university.admissionProcess || '',
      fees: university.fees || { min: '', max: '', currency: 'INR' },
      image: university.image || '',
      facilities: university.facilities || [],
      courses: university.courses || []
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: { city: '', state: '', country: 'Pakistan' },
      description: '',
      establishedYear: new Date().getFullYear(),
      ranking: { national: '', global: '' },
      type: 'Public',
      affiliation: '',
      website: '',
      email: '',
      phone: '',
      admissionProcess: '',
      fees: { min: '', max: '', currency: 'PKR' },
      image: '',
      facilities: [],
      courses: []
    });
    setEditingUniversity(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="universities-layout">
      <header className="dashboard-header">
        <div className="container header-inner">
          <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/images/CM.png" alt="CareerMap Logo" className="logo-combined" style={{ width: '128px', height: '128px', objectFit: 'contain' }} />
            <div className="logo-brand-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: '1.15' }}>
              <span className="logo-text" style={{ fontSize: '30px', fontWeight: '800', color: '#5c4a3d', letterSpacing: '-0.5px' }}>CareerMap</span>
              <span className="logo-tagline" style={{ fontSize: '11px', fontWeight: '600', color: '#8b6e58', marginTop: '2px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Find Your Way. Own Your Future.</span>
            </div>
          </div>
          
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
          
          <nav className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
            <Link to="/dashboard" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/universities" className="nav-link active" onClick={() => setMobileMenuOpen(false)}>
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

          <div className="nav-actions">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage.startsWith('http') ? user.profileImage : `${SERVER_URL}${user.profileImage}`} 
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

    
      <section className="universities-hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="hero-title-main">Explore Top Universities</span>
              <span className="hero-title-sub">Find Your Perfect Institution</span>
            </h1>
            <p className="hero-description">
              Discover leading universities across Pakistan and India. Compare programs, facilities, 
              admission requirements, and make informed decisions about your academic future.
            </p>
            <div className="hero-stats">
              <div className="stat-item">
                <div className="stat-number">{pagination.total || 14}+</div>
                <div className="stat-label">Universities</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">100+</div>
                <div className="stat-label">Programs</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50K+</div>
                <div className="stat-label">Students</div>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img 
  src="/images/university image.webp"
  alt="Students studying together"
/>
          </div>
        </div>
      </section>

      <div className="universities-container">
      <div className="universities-header">
        <h1>Universities</h1>
        {user?.isAdmin && (
          <button 
            className="btn-primary" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Add University
          </button>
        )}
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search universities..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filters">
          <select 
            value={filterType} 
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
            <option value="Deemed">Deemed</option>
          </select>

          <select 
            value={filterState} 
            onChange={(e) => handleFilterChange('state', e.target.value)}
            className="filter-select"
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select 
            value={filterCity} 
            onChange={(e) => handleFilterChange('city', e.target.value)}
            className="filter-select"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select 
            value={filterDiscipline} 
            onChange={(e) => handleFilterChange('discipline', e.target.value)}
            className="filter-select"
          >
            <option value="">All Disciplines</option>
            {disciplines.map(discipline => (
              <option key={discipline} value={discipline}>{discipline}</option>
            ))}
          </select>

          {(searchTerm || filterType || filterState || filterCity || filterDiscipline) && (
            <button onClick={resetFilters} className="btn-secondary">
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading universities...</div>
      ) : universities.length === 0 ? (
        <div className="no-results">No universities found</div>
      ) : (
        <>
          <div className="universities-grid">
            {universities.map(university => (
              <div key={university._id} className="university-card">
                <div className="university-image">
                  <img 
                    src={university.image ? `${SERVER_URL}${university.image}` : '/images/university-placeholder.jpg'}
                    alt={university.name}
                    onError={(e) => {
                      e.target.src = `${SERVER_URL}/images/university-placeholder.jpg`;
                    }}
                  />
                  <span className={`university-type ${university.type.toLowerCase()}`}>
                    {university.type}
                  </span>
                </div>

                <div className="university-content">
                  <h3>{university.name}</h3>
                  <p className="location">
                   {university.location.city}, {university.location.state}
                  </p>
                  <p className="description">{university.description.substring(0, 120)}...</p>

                  <div className="university-info">
                    <div className="info-item">
                      <span className="label">Est.</span>
                      <span className="value">{university.establishedYear}</span>
                    </div>
                    {university.ranking?.national && (
                      <div className="info-item">
                        <span className="label">Rank</span>
                        <span className="value">#{university.ranking.national}</span>
                      </div>
                    )}
                    {university.fees?.min && (
                      <div className="info-item">
                        <span className="label">Fees</span>
                        <span className="value">
                          {university.fees.currency === 'PKR' ? 'PKR' : ''}
                          {university.fees.currency === 'PKR' 
                            ? `${(university.fees.min / 1000).toFixed(0)}K - ${(university.fees.max / 1000).toFixed(0)}K`
                            : `${(university.fees.min / 100000).toFixed(1)}L - ${(university.fees.max / 100000).toFixed(1)}L`
                          }
                        </span>
                      </div>
                    )}
                  </div>

                  {university.facilities && university.facilities.length > 0 && (
                    <div className="facilities">
                      {university.facilities.slice(0, 3).map((facility, idx) => (
                        <span key={idx} className="facility-tag">✓ {facility}</span>
                      ))}
                    </div>
                  )}

                  <div className="card-actions">
                    <button 
                      onClick={() => setViewDetailsUniversity(university)} 
                      className="btn-view-details"
                    >
                      View Details
                    </button>
                    
                    
                    {user?.isAdmin && (
                      <>
                        <button 
                          onClick={() => handleEdit(university)} 
                          className="btn-edit"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(university._id)} 
                          className="btn-delete"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn-pagination"
              >
                Previous
              </button>
              <span className="page-info">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button 
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="btn-pagination"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUniversity ? 'Edit University' : 'Add New University'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateOrUpdate} className="university-form">
              <div className="form-group">
                <label>University Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    name="location.city"
                    value={formData.location.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    name="location.state"
                    value={formData.location.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Country *</label>
                <select
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Pakistan">Pakistan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Established Year *</label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                    <option value="Deemed">Deemed</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>National Ranking</label>
                  <input
                    type="number"
                    name="ranking.national"
                    value={formData.ranking.national}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Global Ranking</label>
                  <input
                    type="number"
                    name="ranking.global"
                    value={formData.ranking.global}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Min Fees</label>
                  <input
                    type="number"
                    name="fees.min"
                    value={formData.fees.min}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Max Fees</label>
                  <input
                    type="number"
                    name="fees.max"
                    value={formData.fees.max}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Currency</label>
                <select
                  name="fees.currency"
                  value={formData.fees.currency}
                  onChange={handleInputChange}
                >
                  <option value="PKR">PKR (Pakistani Rupee)</option>
                  <option value="INR">INR (Indian Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Campus Facilities</label>
                <div className="facilities-input-container">
                  <input
                    type="text"
                    placeholder="Enter facility and press Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const value = e.target.value.trim();
                        if (value && !formData.facilities.includes(value)) {
                          setFormData(prev => ({
                            ...prev,
                            facilities: [...prev.facilities, value]
                          }));
                          e.target.value = '';
                        }
                      }
                    }}
                    className="facility-input"
                  />
                  <small className="input-hint">Press Enter to add a facility</small>
                  {formData.facilities.length > 0 && (
                    <div className="facilities-tags">
                      {formData.facilities.map((facility, index) => (
                        <span key={index} className="facility-tag">
                          {facility}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                facilities: prev.facilities.filter((_, i) => i !== index)
                              }));
                            }}
                            className="remove-tag"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>University Cover Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, image: reader.result }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="file-input"
                />
                {formData.image && (
                  <div className="image-preview">
                    <img src={formData.image} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingUniversity ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewDetailsUniversity && (
        <div className="modal-overlay" onClick={() => setViewDetailsUniversity(null)}>
          <div className="modal-content details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{viewDetailsUniversity.name}</h2>
              <button className="modal-close" onClick={() => setViewDetailsUniversity(null)}>
                &times;
              </button>
            </div>
            
            <div className="details-body">
              {/* Basic Information */}
              <section className="details-section">
                <h3><i className="fas fa-info-circle"></i> Basic Information</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <strong>Location:</strong>
                    <span>{viewDetailsUniversity.location.city}, {viewDetailsUniversity.location.state}, {viewDetailsUniversity.location.country}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Established:</strong>
                    <span>{viewDetailsUniversity.establishedYear}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong>
                    <span className={`type-badge ${viewDetailsUniversity.type.toLowerCase()}`}>
                      {viewDetailsUniversity.type}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Affiliation:</strong>
                    <span>{viewDetailsUniversity.affiliation}</span>
                  </div>
                  {viewDetailsUniversity.ranking?.national && (
                    <div className="detail-item">
                      <strong>National Ranking:</strong>
                      <span>#{viewDetailsUniversity.ranking.national}</span>
                    </div>
                  )}
                  {viewDetailsUniversity.ranking?.global && (
                    <div className="detail-item">
                      <strong>Global Ranking:</strong>
                      <span>#{viewDetailsUniversity.ranking.global}</span>
                    </div>
                  )}
                </div>
                <div className="detail-item full-width">
                  <strong>About:</strong>
                  <p>{viewDetailsUniversity.description}</p>
                </div>
              </section>

              {/* Programs/Courses */}
              {viewDetailsUniversity.courses && viewDetailsUniversity.courses.length > 0 && (
                <section className="details-section">
                  <h3><i className="fas fa-graduation-cap"></i> Programs Offered</h3>
                  <div className="courses-grid">
                    {viewDetailsUniversity.courses.map((course, idx) => (
                      <div key={idx} className="course-card">
                        <h4>{course.name}</h4>
                        <p><strong>Degree:</strong> {course.degree}</p>
                        <p><strong>Duration:</strong> {course.duration}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Facilities */}
              {viewDetailsUniversity.facilities && viewDetailsUniversity.facilities.length > 0 && (
                <section className="details-section">
                  <h3><i className="fas fa-building"></i> Campus Facilities</h3>
                  <div className="facilities-grid">
                    {viewDetailsUniversity.facilities.map((facility, idx) => (
                      <div key={idx} className="facility-item">
                        <i className="fas fa-check-circle"></i>
                        <span>{facility}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Admission Process */}
              {viewDetailsUniversity.admissionProcess && (
                <section className="details-section">
                  <h3><i className="fas fa-file-alt"></i> Admission Process</h3>
                  <p className="admission-text">{viewDetailsUniversity.admissionProcess}</p>
                </section>
              )}

              {/* Fees & Scholarships */}
              {viewDetailsUniversity.fees && (
                <section className="details-section">
                  <h3><i className="fas fa-money-bill-wave"></i> Fees & Financial Information</h3>
                  <div className="fees-info">
                    <div className="fee-range">
                      <strong>Annual Fees Range:</strong>
                      <span className="fee-amount">
                        {viewDetailsUniversity.fees.currency} {viewDetailsUniversity.fees.min.toLocaleString()} - {viewDetailsUniversity.fees.max.toLocaleString()}
                      </span>
                    </div>
                    <div className="scholarship-note">
                      <i className="fas fa-info-circle"></i>
                      <span>For scholarship information, please contact the university directly or visit their official website.</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Contact Information */}
              <section className="details-section">
                <h3><i className="fas fa-address-book"></i> Contact Information</h3>
                <div className="contact-info">
                  {viewDetailsUniversity.website && (
                    <div className="contact-item">
                      <i className="fas fa-globe"></i>
                      <a href={viewDetailsUniversity.website} target="_blank" rel="noopener noreferrer">
                        {viewDetailsUniversity.website}
                      </a>
                    </div>
                  )}
                  {viewDetailsUniversity.email && (
                    <div className="contact-item">
                      <i className="fas fa-envelope"></i>
                      <a href={`mailto:${viewDetailsUniversity.email}`}>
                        {viewDetailsUniversity.email}
                      </a>
                    </div>
                  )}
                  {viewDetailsUniversity.phone && (
                    <div className="contact-item">
                      <i className="fas fa-phone"></i>
                      <a href={`tel:${viewDetailsUniversity.phone}`}>
                        {viewDetailsUniversity.phone}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="modal-footer">
              {viewDetailsUniversity.website && (
                <a 
                  href={viewDetailsUniversity.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Visit Official Website
                </a>
              )}
              <button onClick={() => setViewDetailsUniversity(null)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete University"
        message="Are you sure you want to delete this university? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
      </div>

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
    </div>
  );
};

export default Universities;
