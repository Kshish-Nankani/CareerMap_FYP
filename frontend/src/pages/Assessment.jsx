
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchWithErrorHandling } from '../utils/api';
import { getAuthToken } from '../utils/authStorage';
import '../styles/Assessment.css'
import '../styles/logoAnimations.css'

const PERSONALITY_QUESTIONS = [
  {
    id: 'interests',
    title: 'Which areas appeal to you the most?',
    subtitle: 'Select all that apply',
    type: 'multiple',
    options: [
      { id: 'technology', label: 'Technology', icon: 'fa-solid fa-laptop-code' },
      { id: 'business', label: 'Business', icon: 'fa-solid fa-briefcase' },
      { id: 'arts', label: 'Arts', icon: 'fa-solid fa-palette' },
      { id: 'medicine', label: 'Medicine', icon: 'fa-solid fa-heart-pulse' },
      { id: 'social-work', label: 'Social Work', icon: 'fa-solid fa-hands-helping' },
      { id: 'engineering', label: 'Engineering', icon: 'fa-solid fa-gears' },
      { id: 'education', label: 'Education', icon: 'fa-solid fa-graduation-cap' },
      { id: 'finance', label: 'Finance', icon: 'fa-solid fa-dollar-sign' }
    ]
  },
  {
    id: 'skills',
    title: 'How confident are you in your current skills?',
    subtitle: 'Choose one that best describes you',
    type: 'single',
    options: [
      { id: 'beginner', label: 'Beginner', description: 'Just starting out, learning the basics' },
      { id: 'intermediate', label: 'Intermediate', description: 'Have some experience and knowledge' },
      { id: 'advanced', label: 'Advanced', description: 'Highly skilled and experienced' }
    ]
  },
  {
    id: 'personality',
    title: 'Which personality style describes you?',
    subtitle: 'Choose one that best fits',
    type: 'single',
    options: [
      { id: 'introvert', label: 'Introvert', description: 'Prefer working alone, quiet environments' },
      { id: 'extrovert', label: 'Extrovert', description: 'Energized by social interactions' },
      { id: 'analytical', label: 'Analytical', description: 'Detail-oriented, logical thinking' },
      { id: 'creative', label: 'Creative', description: 'Innovative, artistic, outside-the-box thinker' }
    ]
  },
  {
    id: 'workStyle',
    title: 'How do you prefer to work?',
    subtitle: 'Choose your preferred work style',
    type: 'single',
    options: [
      { id: 'teamwork', label: 'Teamwork', description: 'Collaborate with others on projects' },
      { id: 'independent', label: 'Independent', description: 'Work alone with minimal supervision' },
      { id: 'leadership', label: 'Leadership', description: 'Lead teams and make decisions' },
      { id: 'research', label: 'Research-oriented', description: 'Investigate and analyze information' }
    ]
  },
  {
    id: 'environment',
    title: 'What kind of work environment suits you best?',
    subtitle: 'Choose your ideal work setting',
    type: 'single',
    options: [
      { id: 'office', label: 'Office-based', description: 'Traditional office setting' },
      { id: 'remote', label: 'Remote', description: 'Work from home or anywhere' },
      { id: 'fieldwork', label: 'Fieldwork', description: 'On-site, outdoor, or travel' },
      { id: 'flexible', label: 'Flexible', description: 'Mix of office and remote' }
    ]
  },
  {
    id: 'subjectTest',
    title: 'Do you want to take subject-related multiple-choice questions?',
    subtitle: 'This will help us provide more accurate career recommendations based on your academic strengths',
    type: 'single',
    options: [
      { id: 'yes', label: 'Yes', description: 'Show me 30 subject-related questions' },
      { id: 'no', label: 'No', description: 'Generate recommendations based on personality only' }
    ]
  }
];


const Assessment = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentPhase, setAssessmentPhase] = useState('personality'); // 'personality' or 'subject'
  const [personalityAnswers, setPersonalityAnswers] = useState({
    interests: [],
    skills: '',
    personality: '',
    workStyle: '',
    environment: '',
    subjectTest: ''
  });
  const [subjectQuestions, setSubjectQuestions] = useState([]);
  const [subjectAnswers, setSubjectAnswers] = useState({});
  const [recommendations, setRecommendations] = useState(null);
  const [subjectAnalysis, setSubjectAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  
  useEffect(() => {
    const fetchSubjectQuestions = async () => {
      try {
        const token = getAuthToken()
        const data = await fetchWithErrorHandling('/assessment/subject-questions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        setSubjectQuestions(data.questions || []);
      } catch (err) {
        console.error('Failed to fetch subject questions:', err);
      }
    };

    fetchSubjectQuestions();
  }, []);


  const getCurrentQuestion = () => {
    if (assessmentPhase === 'personality') {
      return PERSONALITY_QUESTIONS[currentStep];
    } else {
      return subjectQuestions[currentStep];
    }
  };

  const getTotalQuestions = () => {
    if (assessmentPhase === 'personality') {
      return PERSONALITY_QUESTIONS.length;
    } else {
      return subjectQuestions.length;
    }
  };

  const currentQuestion = getCurrentQuestion();
  const totalQuestions = getTotalQuestions();
  const isLastQuestion = currentStep === totalQuestions - 1;

  
  const canProceed = () => {
    if (assessmentPhase === 'personality') {
      if (currentQuestion.type === 'multiple') {
        return personalityAnswers[currentQuestion.id]?.length > 0;
      }
      return personalityAnswers[currentQuestion.id] !== '';
    } else {
      return subjectAnswers[currentQuestion?.id] !== undefined;
    }
  };

  const handleMultipleChoice = (optionId) => {
    if (assessmentPhase === 'personality') {
      setPersonalityAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: prev[currentQuestion.id].includes(optionId)
          ? prev[currentQuestion.id].filter(id => id !== optionId)
          : [...prev[currentQuestion.id], optionId]
      }));
    }
  };

  const handleSingleChoice = (optionId) => {
    if (assessmentPhase === 'personality') {
      setPersonalityAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: optionId
      }));
    } else {
      setSubjectAnswers(prev => ({
        ...prev,
        [currentQuestion.id]: optionId
      }));
    }
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    // Check if we just answered the subject test question
    if (assessmentPhase === 'personality' && currentQuestion.id === 'subjectTest') {
      if (personalityAnswers.subjectTest === 'yes') {
        // Switch to subject questions
        setAssessmentPhase('subject');
        setCurrentStep(0);
      } else {
        // Skip to recommendations
        handleSubmit();
      }
    } else if (isLastQuestion) {
      // Last question - submit assessment
      handleSubmit();
    } else {
      // Move to next question
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (assessmentPhase === 'subject') {
      // Go back to personality questions
      setAssessmentPhase('personality');
      setCurrentStep(PERSONALITY_QUESTIONS.length - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      const token = getAuthToken()
      const body = {
        interests: personalityAnswers.interests,
        skills: personalityAnswers.skills,
        personality: personalityAnswers.personality,
        workStyle: personalityAnswers.workStyle,
        environment: personalityAnswers.environment,
        takeSubjectTest: personalityAnswers.subjectTest === 'yes',
        subjectAnswers: personalityAnswers.subjectTest === 'yes' ? subjectAnswers : null
      };

      const data = await fetchWithErrorHandling('/assessment/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(body)
      });

      setRecommendations(data.recommendations);
      setSubjectAnalysis(data.subjectAnalysis || null);
    } catch (err) {
      setError(err.message || 'Failed to get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setAssessmentPhase('personality');
    setPersonalityAnswers({
      interests: [],
      skills: '',
      personality: '',
      workStyle: '',
      environment: '',
      subjectTest: ''
    });
    setSubjectAnswers({});
    setRecommendations(null);
    setSubjectAnalysis(null);
    setError('');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  return (
    <div className="assessment-layout">
      <header className="assessment-header">
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
            <Link to="/universities" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Universities
            </Link>
            <Link to="/mentorship" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Mentorship
            </Link>
            <Link to="/marketplace" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              MarketPlace
            </Link>
            <Link to="/profile" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              Profile
            </Link>
             <Link to={user?.isAdmin ? "/admin" : "/dashboard"} className="nav-link" onClick={() => setMobileMenuOpen(false)}>
              {user?.isAdmin ? "Admin Dashboard" : "Home"}
            </Link>
          </nav>

          <div className="nav-actions">
            <div className="user-menu">
              <Link to="/profile" className="user-avatar">
                {user?.name?.charAt(0).toUpperCase()}
              </Link>
              <button className="btn-logout" onClick={handleLogout}>
                logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="assessment-main">
        <div className="container">
          {!recommendations ? (
            <div className="assessment-form-container">
              <div className="assessment-header-section">
                <h1 className="assessment-title">
                  {assessmentPhase === 'personality' ? 'Career Assessment' : 'Subject Assessment'}
                </h1>
                <p className="assessment-subtitle">
                  {assessmentPhase === 'personality' 
                    ? 'Answer the following questions honestly based on your interests, skills, personality, and work style. Your responses will help us recommend the best career paths for you.'
                    : 'Now test your knowledge with subject-related questions. Your performance will help us provide more accurate career recommendations based on your academic strengths.'}
                </p>
                
                
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${((currentStep + 1) / totalQuestions) * 100}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {assessmentPhase === 'personality' 
                      ? `Question ${currentStep + 1} of ${PERSONALITY_QUESTIONS.length}`
                      : `Subject Question ${currentStep + 1} of ${subjectQuestions.length}`}
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="loading-container">
                  <i className="fa-solid fa-spinner fa-spin loading-icon"></i>
                  <p>Analyzing your profile and generating recommendations...</p>
                </div>
              ) : (
                currentQuestion && (
                  <div className="question-container">
                    <div className="question-card">
                      {assessmentPhase === 'subject' && currentQuestion.subject && (
                        <div className="subject-badge">{currentQuestion.subject}</div>
                      )}
                      <h2 className="question-title">
                        <span className="question-number">
                          Q{assessmentPhase === 'personality' ? currentStep + 1 : currentStep + 1}.
                        </span>{' '}
                        {currentQuestion.title || currentQuestion.question}
                      </h2>
                      <p className="question-subtitle">{currentQuestion.subtitle}</p>

                      {error && (
                        <div className="error-message">
                          <i className="fa-solid fa-exclamation-circle"></i>
                          {error}
                        </div>
                      )}

                      <div className="options-container">
                        {currentQuestion.type === 'multiple' ? (
                          <div className="options-grid">
                            {currentQuestion.options.map(option => (
                              <button
                                key={option.id}
                                type="button"
                                className={`option-card ${personalityAnswers[currentQuestion.id]?.includes(option.id) ? 'selected' : ''}`}
                                onClick={() => handleMultipleChoice(option.id)}
                              >
                                {option.icon && <i className={option.icon}></i>}
                                <span className="option-label">{option.label}</span>
                                {personalityAnswers[currentQuestion.id]?.includes(option.id) && (
                                  <i className="fa-solid fa-check check-icon"></i>
                                )}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="options-list">
                            {currentQuestion.options.map(option => {
                              const isSelected = assessmentPhase === 'personality'
                                ? personalityAnswers[currentQuestion.id] === option.id
                                : subjectAnswers[currentQuestion.id] === option.id;
                              
                              return (
                                <label
                                  key={option.id}
                                  className={`option-item ${isSelected ? 'selected' : ''}`}
                                >
                                  <input
                                    type="radio"
                                    name={currentQuestion.id}
                                    value={option.id}
                                    checked={isSelected}
                                    onChange={() => handleSingleChoice(option.id)}
                                  />
                                  <div className="option-content">
                                    <span className="option-label">{option.label || option.text}</span>
                                    {option.description && (
                                      <span className="option-description">{option.description}</span>
                                    )}
                                  </div>
                                  {isSelected && (
                                    <i className="fa-solid fa-check-circle check-icon"></i>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="navigation-buttons">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleBack}
                        >
                          <i className="fa-solid fa-arrow-left"></i> Back
                        </button>
                        
                     
                        {assessmentPhase === 'personality' && currentQuestion.id === 'subjectTest' ? (
                          <>
                           
                            {personalityAnswers.subjectTest === 'yes' && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={handleNext}
                              >
                                Next <i className="fa-solid fa-arrow-right"></i>
                              </button>
                            )}
                            
                            
                            {personalityAnswers.subjectTest === 'no' && (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={handleNext}
                              >
                                <i className="fa-solid fa-wand-magic-sparkles"></i> Get Recommendations
                              </button>
                            )}
                            
                            {/* Show disabled button if nothing is selected */}
                            {!personalityAnswers.subjectTest && (
                              <button
                                type="button"
                                className="btn-primary"
                                disabled
                              >
                                Make a selection
                              </button>
                            )}
                          </>
                        ) : (
                          /* Regular button for other questions */
                          <button
                            type="button"
                            className="btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed()}
                          >
                            {isLastQuestion ? (
                              <>
                                <i className="fa-solid fa-wand-magic-sparkles"></i> Get Recommendations
                              </>
                            ) : (
                              <>
                                Next <i className="fa-solid fa-arrow-right"></i>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="recommendations-container">
              <div className="recommendations-header">
                <h1 className="recommendations-title">
                  Your Top Career Recommendations
                </h1>
                <p className="recommendations-subtitle">
                  Based on your assessment, here are the top 3 careers that best match your profile:
                </p>
              </div>

              {/* Subject Analysis Section */}
              {subjectAnalysis && (
                <div className="subject-analysis-section">
                  <h2 className="section-title">
                    <i className="fa-solid fa-chart-bar"></i> Your Academic Performance
                  </h2>
                  <div className="analysis-stats">
                    <div className="stat-card">
                      <div className="stat-value">{subjectAnalysis.overallAccuracy}%</div>
                      <div className="stat-label">Overall Accuracy</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{subjectAnalysis.totalCorrect}/{subjectAnalysis.totalQuestions}</div>
                      <div className="stat-label">Correct Answers</div>
                    </div>
                  </div>
                  
                  {subjectAnalysis.strongSubjects?.length > 0 && (
                    <div className="strong-subjects">
                      <h3>Your Strongest Subjects:</h3>
                      <div className="subjects-list">
                        {subjectAnalysis.strongSubjects.map(subject => (
                          <div key={subject} className="subject-badge-result">
                           
                            {subject} ({subjectAnalysis.subjectScores[subject]}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="all-subjects-scores">
                    <h3>Subject-wise Performance:</h3>
                    <div className="subjects-grid">
                      {Object.entries(subjectAnalysis.subjectScores).map(([subject, score]) => (
                        <div key={subject} className="subject-score-card">
                          <div className="subject-name">{subject}</div>
                          <div className="score-bar">
                            <div 
                              className="score-fill" 
                              style={{ 
                                width: `${score}%`,
                                backgroundColor: score >= 80 ? '#8B6914' : score >= 60 ? '#A78B71' : score >= 40 ? '#C4A57B' : '#8B7355'
                              }}
                            ></div>
                          </div>
                          <div className="score-value">{score}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="recommendations-grid">
                {recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-card">
                    <div className="recommendation-rank">#{index + 1}</div>
                    <div className="recommendation-header">
                      <h3 className="recommendation-title">{rec.title}</h3>
                      <div className="recommendation-score">
                        <span className="score-value">{rec.matchScore}%</span>
                        <span className="score-label">Match</span>
                      </div>
                    </div>
                    <p className="recommendation-description">{rec.reason}</p>
                    
                    <div className="recommendation-details">
                      <div className="detail-item">
                        <i className="fa-solid fa-money-bill-wave"></i>
                        <span>{rec.salary}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fa-solid fa-chart-line"></i>
                        <span>{rec.growth}</span>
                      </div>
                      <div className="detail-item">
                        <i className="fa-solid fa-briefcase"></i>
                        <span>{rec.demand} Demand</span>
                      </div>
                    </div>

                    {rec.requiredSkills && rec.requiredSkills.length > 0 && (
                      <div className="required-skills">
                        <h4>Required Skills:</h4>
                        <div className="skills-tags">
                          {rec.requiredSkills.map((skill, idx) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="recommendations-actions">
                <button className="btn-secondary" onClick={handleReset}>
                  <i className="fa-solid fa-rotate"></i> Retake Assessment
                </button>
                <Link to="/dashboard" className="btn-primary">
                  <i className="fa-solid fa-home"></i> Back to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
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
                <Link to="/profile">Profile</Link>
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

export default Assessment;
