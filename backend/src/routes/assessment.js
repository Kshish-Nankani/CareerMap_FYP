import { Router } from 'express';

const router = Router();


const SUBJECT_QUESTIONS = [
  
  {
    id: 'cs1',
    subject: 'Computer Science',
    question: 'What does HTML stand for?',
    options: [
      { id: 'a', text: 'Hyper Text Markup Language', correct: true },
      { id: 'b', text: 'High Tech Modern Language', correct: false },
      { id: 'c', text: 'Home Tool Markup Language', correct: false },
      { id: 'd', text: 'Hyperlinks and Text Markup Language', correct: false }
    ]
  },
  {
    id: 'cs2',
    subject: 'Computer Science',
    question: 'Which data structure uses LIFO (Last In First Out)?',
    options: [
      { id: 'a', text: 'Queue', correct: false },
      { id: 'b', text: 'Stack', correct: true },
      { id: 'c', text: 'Array', correct: false },
      { id: 'd', text: 'Tree', correct: false }
    ]
  },
  {
    id: 'cs3',
    subject: 'Computer Science',
    question: 'What is the primary purpose of an operating system?',
    options: [
      { id: 'a', text: 'To run applications', correct: false },
      { id: 'b', text: 'To manage hardware and software resources', correct: true },
      { id: 'c', text: 'To browse the internet', correct: false },
      { id: 'd', text: 'To create documents', correct: false }
    ]
  },
  {
    id: 'cs4',
    subject: 'Computer Science',
    question: 'Which programming paradigm focuses on objects and classes?',
    options: [
      { id: 'a', text: 'Functional Programming', correct: false },
      { id: 'b', text: 'Procedural Programming', correct: false },
      { id: 'c', text: 'Object-Oriented Programming', correct: true },
      { id: 'd', text: 'Logic Programming', correct: false }
    ]
  },
  {
    id: 'cs5',
    subject: 'Computer Science',
    question: 'What does SQL stand for?',
    options: [
      { id: 'a', text: 'Simple Query Language', correct: false },
      { id: 'b', text: 'Structured Query Language', correct: true },
      { id: 'c', text: 'Standard Question Language', correct: false },
      { id: 'd', text: 'System Query Language', correct: false }
    ]
  },
  {
    id: 'cs6',
    subject: 'Computer Science',
    question: 'Which of the following is a NoSQL database?',
    options: [
      { id: 'a', text: 'MySQL', correct: false },
      { id: 'b', text: 'PostgreSQL', correct: false },
      { id: 'c', text: 'MongoDB', correct: true },
      { id: 'd', text: 'Oracle', correct: false }
    ]
  },

  
  {
    id: 'bus1',
    subject: 'Business',
    question: 'What does ROI stand for in business?',
    options: [
      { id: 'a', text: 'Return on Investment', correct: true },
      { id: 'b', text: 'Rate of Interest', correct: false },
      { id: 'c', text: 'Revenue of Income', correct: false },
      { id: 'd', text: 'Resource Optimization Index', correct: false }
    ]
  },
  {
    id: 'bus2',
    subject: 'Business',
    question: 'Which business model focuses on subscription-based revenue?',
    options: [
      { id: 'a', text: 'B2B', correct: false },
      { id: 'b', text: 'SaaS', correct: true },
      { id: 'c', text: 'E-commerce', correct: false },
      { id: 'd', text: 'Franchise', correct: false }
    ]
  },
  {
    id: 'bus3',
    subject: 'Business',
    question: 'What is a SWOT analysis used for?',
    options: [
      { id: 'a', text: 'Financial forecasting', correct: false },
      { id: 'b', text: 'Marketing campaigns', correct: false },
      { id: 'c', text: 'Strategic planning by analyzing Strengths, Weaknesses, Opportunities, and Threats', correct: true },
      { id: 'd', text: 'Employee evaluation', correct: false }
    ]
  },
  {
    id: 'bus4',
    subject: 'Business',
    question: 'What does B2B stand for?',
    options: [
      { id: 'a', text: 'Business to Business', correct: true },
      { id: 'b', text: 'Bank to Business', correct: false },
      { id: 'c', text: 'Business to Bank', correct: false },
      { id: 'd', text: 'Brand to Business', correct: false }
    ]
  },
  {
    id: 'bus5',
    subject: 'Business',
    question: 'Which of the following is a key component of a business plan?',
    options: [
      { id: 'a', text: 'Market Analysis', correct: true },
      { id: 'b', text: 'Personal Preferences', correct: false },
      { id: 'c', text: 'Entertainment Schedule', correct: false },
      { id: 'd', text: 'Vacation Plans', correct: false }
    ]
  },

  
  {
    id: 'bio1',
    subject: 'Biology',
    question: 'What is the powerhouse of the cell?',
    options: [
      { id: 'a', text: 'Nucleus', correct: false },
      { id: 'b', text: 'Mitochondria', correct: true },
      { id: 'c', text: 'Ribosome', correct: false },
      { id: 'd', text: 'Chloroplast', correct: false }
    ]
  },
  {
    id: 'bio2',
    subject: 'Biology',
    question: 'Which molecule carries genetic information?',
    options: [
      { id: 'a', text: 'RNA', correct: false },
      { id: 'b', text: 'DNA', correct: true },
      { id: 'c', text: 'Protein', correct: false },
      { id: 'd', text: 'Lipid', correct: false }
    ]
  },
  {
    id: 'bio3',
    subject: 'Biology',
    question: 'What is the process by which plants make food?',
    options: [
      { id: 'a', text: 'Respiration', correct: false },
      { id: 'b', text: 'Photosynthesis', correct: true },
      { id: 'c', text: 'Digestion', correct: false },
      { id: 'd', text: 'Fermentation', correct: false }
    ]
  },
  {
    id: 'bio4',
    subject: 'Biology',
    question: 'How many chambers does the human heart have?',
    options: [
      { id: 'a', text: '2', correct: false },
      { id: 'b', text: '3', correct: false },
      { id: 'c', text: '4', correct: true },
      { id: 'd', text: '5', correct: false }
    ]
  },
  {
    id: 'bio5',
    subject: 'Biology',
    question: 'What is the basic unit of life?',
    options: [
      { id: 'a', text: 'Tissue', correct: false },
      { id: 'b', text: 'Organ', correct: false },
      { id: 'c', text: 'Cell', correct: true },
      { id: 'd', text: 'Molecule', correct: false }
    ]
  },

  // Mathematics (5 questions)
  {
    id: 'math1',
    subject: 'Mathematics',
    question: 'What is the derivative of x²?',
    options: [
      { id: 'a', text: 'x', correct: false },
      { id: 'b', text: '2x', correct: true },
      { id: 'c', text: 'x³', correct: false },
      { id: 'd', text: '2', correct: false }
    ]
  },
  {
    id: 'math2',
    subject: 'Mathematics',
    question: 'What is the value of π (pi) approximately?',
    options: [
      { id: 'a', text: '2.14', correct: false },
      { id: 'b', text: '3.14', correct: true },
      { id: 'c', text: '4.14', correct: false },
      { id: 'd', text: '5.14', correct: false }
    ]
  },
  {
    id: 'math3',
    subject: 'Mathematics',
    question: 'What is the sum of angles in a triangle?',
    options: [
      { id: 'a', text: '90 degrees', correct: false },
      { id: 'b', text: '180 degrees', correct: true },
      { id: 'c', text: '270 degrees', correct: false },
      { id: 'd', text: '360 degrees', correct: false }
    ]
  },
  {
    id: 'math4',
    subject: 'Mathematics',
    question: 'What is the Pythagorean theorem?',
    options: [
      { id: 'a', text: 'a + b = c', correct: false },
      { id: 'b', text: 'a² + b² = c²', correct: true },
      { id: 'c', text: 'a × b = c', correct: false },
      { id: 'd', text: 'a / b = c', correct: false }
    ]
  },
  {
    id: 'math5',
    subject: 'Mathematics',
    question: 'What is the square root of 144?',
    options: [
      { id: 'a', text: '10', correct: false },
      { id: 'b', text: '11', correct: false },
      { id: 'c', text: '12', correct: true },
      { id: 'd', text: '13', correct: false }
    ]
  },

  // Physics (4 questions)
  {
    id: 'phy1',
    subject: 'Physics',
    question: 'What is the speed of light in vacuum?',
    options: [
      { id: 'a', text: '3 × 10⁸ m/s', correct: true },
      { id: 'b', text: '3 × 10⁶ m/s', correct: false },
      { id: 'c', text: '3 × 10⁹ m/s', correct: false },
      { id: 'd', text: '3 × 10⁷ m/s', correct: false }
    ]
  },
  {
    id: 'phy2',
    subject: 'Physics',
    question: 'What is Newton\'s second law of motion?',
    options: [
      { id: 'a', text: 'F = ma', correct: true },
      { id: 'b', text: 'E = mc²', correct: false },
      { id: 'c', text: 'V = IR', correct: false },
      { id: 'd', text: 'P = IV', correct: false }
    ]
  },
  {
    id: 'phy3',
    subject: 'Physics',
    question: 'What is the unit of force?',
    options: [
      { id: 'a', text: 'Joule', correct: false },
      { id: 'b', text: 'Newton', correct: true },
      { id: 'c', text: 'Watt', correct: false },
      { id: 'd', text: 'Pascal', correct: false }
    ]
  },
  {
    id: 'phy4',
    subject: 'Physics',
    question: 'What does AC stand for in electricity?',
    options: [
      { id: 'a', text: 'Alternating Current', correct: true },
      { id: 'b', text: 'Active Current', correct: false },
      { id: 'c', text: 'Automatic Current', correct: false },
      { id: 'd', text: 'Applied Current', correct: false }
    ]
  },

  // Chemistry (5 questions)
  {
    id: 'chem1',
    subject: 'Chemistry',
    question: 'What is the chemical symbol for water?',
    options: [
      { id: 'a', text: 'H2O', correct: true },
      { id: 'b', text: 'CO2', correct: false },
      { id: 'c', text: 'O2', correct: false },
      { id: 'd', text: 'HO', correct: false }
    ]
  },
  {
    id: 'chem2',
    subject: 'Chemistry',
    question: 'What is the atomic number of Carbon?',
    options: [
      { id: 'a', text: '4', correct: false },
      { id: 'b', text: '6', correct: true },
      { id: 'c', text: '8', correct: false },
      { id: 'd', text: '12', correct: false }
    ]
  },
  {
    id: 'chem3',
    subject: 'Chemistry',
    question: 'What is the pH of pure water?',
    options: [
      { id: 'a', text: '5', correct: false },
      { id: 'b', text: '7', correct: true },
      { id: 'c', text: '9', correct: false },
      { id: 'd', text: '11', correct: false }
    ]
  },
  {
    id: 'chem4',
    subject: 'Chemistry',
    question: 'Which gas is most abundant in Earth\'s atmosphere?',
    options: [
      { id: 'a', text: 'Oxygen', correct: false },
      { id: 'b', text: 'Nitrogen', correct: true },
      { id: 'c', text: 'Carbon Dioxide', correct: false },
      { id: 'd', text: 'Hydrogen', correct: false }
    ]
  },
  {
    id: 'chem5',
    subject: 'Chemistry',
    question: 'What is the formula for table salt?',
    options: [
      { id: 'a', text: 'NaCl', correct: true },
      { id: 'b', text: 'KCl', correct: false },
      { id: 'c', text: 'CaCl2', correct: false },
      { id: 'd', text: 'MgCl2', correct: false }
    ]
  }
];

const CAREER_DATABASE = [
  {
    id: 'software-engineer',
    title: 'Software Engineer',
    interests: ['technology', 'engineering'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'introvert', 'creative'],
    workStyle: ['independent', 'teamwork', 'research'],
    environment: ['office', 'remote', 'flexible'],
    subjectAffinity: ['Computer Science', 'Mathematics', 'Physics'],
    salary: 'PKR 80K-150K',
    growth: '+25%',
    demand: 'Very High',
    requiredSkills: ['JavaScript', 'Python', 'React', 'Problem Solving']
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    interests: ['technology', 'engineering', 'finance'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'introvert'],
    workStyle: ['research', 'independent', 'teamwork'],
    environment: ['office', 'remote', 'flexible'],
    subjectAffinity: ['Computer Science', 'Mathematics', 'Business'],
    salary: 'PKR 100K-200K',
    growth: '+35%',
    demand: 'Very High',
    requiredSkills: ['Python', 'Machine Learning', 'Statistics', 'Data Analysis']
  },
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    interests: ['technology', 'arts'],
    skills: ['beginner', 'intermediate', 'advanced'],
    personality: ['creative', 'analytical', 'extrovert'],
    workStyle: ['teamwork', 'independent'],
    environment: ['office', 'remote', 'flexible'],
    subjectAffinity: ['Computer Science'],
    salary: 'PKR 45K-90K',
    growth: '+40%',
    demand: 'High',
    requiredSkills: ['Figma', 'UX Research', 'Prototyping', 'Visual Design']
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    interests: ['business', 'technology', 'finance'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'extrovert'],
    workStyle: ['teamwork', 'leadership', 'research'],
    environment: ['office', 'flexible'],
    subjectAffinity: ['Business', 'Mathematics'],
    salary: 'PKR 60K-120K',
    growth: '+22%',
    demand: 'High',
    requiredSkills: ['Excel', 'SQL', 'Business Intelligence', 'Communication']
  },
  {
    id: 'doctor',
    title: 'Medical Doctor',
    interests: ['medicine', 'social-work'],
    skills: ['advanced'],
    personality: ['analytical', 'extrovert', 'introvert'],
    workStyle: ['independent', 'teamwork', 'leadership'],
    environment: ['fieldwork', 'office'],
    subjectAffinity: ['Biology', 'Chemistry'],
    salary: 'PKR 80K-200K',
    growth: '+18%',
    demand: 'Very High',
    requiredSkills: ['Medical Knowledge', 'Patient Care', 'Diagnosis', 'Communication']
  },
  {
    id: 'teacher',
    title: 'Teacher / Educator',
    interests: ['education', 'social-work'],
    skills: ['beginner', 'intermediate', 'advanced'],
    personality: ['extrovert', 'creative', 'analytical'],
    workStyle: ['leadership', 'independent'],
    environment: ['office', 'fieldwork'],
    subjectAffinity: ['Mathematics', 'Biology', 'Physics', 'Chemistry'],
    salary: 'PKR 40K-80K',
    growth: '+15%',
    demand: 'High',
    requiredSkills: ['Teaching', 'Communication', 'Curriculum Development', 'Mentoring']
  },
  {
    id: 'social-worker',
    title: 'Social Worker',
    interests: ['social-work', 'medicine', 'education'],
    skills: ['beginner', 'intermediate'],
    personality: ['extrovert', 'creative'],
    workStyle: ['teamwork', 'fieldwork', 'independent'],
    environment: ['fieldwork', 'office', 'flexible'],
    subjectAffinity: ['Biology'],
    salary: 'PKR 30K-60K',
    growth: '+12%',
    demand: 'Medium',
    requiredSkills: ['Counseling', 'Communication', 'Empathy', 'Case Management']
  },
  {
    id: 'financial-analyst',
    title: 'Financial Analyst',
    interests: ['finance', 'business'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'introvert'],
    workStyle: ['independent', 'research', 'teamwork'],
    environment: ['office', 'remote', 'flexible'],
    subjectAffinity: ['Mathematics', 'Business'],
    salary: 'PKR 60K-120K',
    growth: '+20%',
    demand: 'High',
    requiredSkills: ['Financial Modeling', 'Excel', 'Risk Analysis', 'Forecasting']
  },
  {
    id: 'civil-engineer',
    title: 'Civil Engineer',
    interests: ['engineering', 'technology'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'introvert'],
    workStyle: ['teamwork', 'leadership', 'fieldwork'],
    environment: ['fieldwork', 'office'],
    subjectAffinity: ['Mathematics', 'Physics'],
    salary: 'PKR 50K-100K',
    growth: '+18%',
    demand: 'High',
    requiredSkills: ['CAD', 'Project Management', 'Structural Design', 'Site Supervision']
  },
  {
    id: 'graphic-designer',
    title: 'Graphic Designer',
    interests: ['arts', 'technology'],
    skills: ['beginner', 'intermediate', 'advanced'],
    personality: ['creative', 'introvert'],
    workStyle: ['independent', 'teamwork'],
    environment: ['remote', 'office', 'flexible'],
    subjectAffinity: ['Computer Science'],
    salary: 'PKR 35K-70K',
    growth: '+25%',
    demand: 'Medium',
    requiredSkills: ['Adobe Creative Suite', 'Illustration', 'Branding', 'Typography']
  },
  {
    id: 'marketing-manager',
    title: 'Marketing Manager',
    interests: ['business', 'arts'],
    skills: ['intermediate', 'advanced'],
    personality: ['extrovert', 'creative'],
    workStyle: ['leadership', 'teamwork'],
    environment: ['office', 'flexible'],
    subjectAffinity: ['Business'],
    salary: 'PKR 70K-140K',
    growth: '+28%',
    demand: 'High',
    requiredSkills: ['Digital Marketing', 'Strategy', 'Analytics', 'Content Creation']
  },
  {
    id: 'architect',
    title: 'Architect',
    interests: ['engineering', 'arts'],
    skills: ['advanced'],
    personality: ['creative', 'analytical'],
    workStyle: ['independent', 'teamwork', 'leadership'],
    environment: ['office', 'fieldwork'],
    subjectAffinity: ['Mathematics', 'Physics'],
    salary: 'PKR 60K-150K',
    growth: '+20%',
    demand: 'Medium',
    requiredSkills: ['AutoCAD', '3D Modeling', 'Design', 'Project Management']
  },
  {
    id: 'accountant',
    title: 'Accountant',
    interests: ['finance', 'business'],
    skills: ['beginner', 'intermediate', 'advanced'],
    personality: ['analytical', 'introvert'],
    workStyle: ['independent', 'teamwork'],
    environment: ['office', 'remote'],
    subjectAffinity: ['Mathematics', 'Business'],
    salary: 'PKR 40K-90K',
    growth: '+15%',
    demand: 'High',
    requiredSkills: ['Accounting Software', 'Tax Knowledge', 'Financial Reporting', 'Auditing']
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    interests: ['technology', 'business'],
    skills: ['advanced'],
    personality: ['extrovert', 'analytical', 'creative'],
    workStyle: ['leadership', 'teamwork'],
    environment: ['office', 'flexible'],
    subjectAffinity: ['Computer Science', 'Business'],
    salary: 'PKR 90K-180K',
    growth: '+30%',
    demand: 'Very High',
    requiredSkills: ['Product Strategy', 'Agile', 'Analytics', 'Stakeholder Management']
  },
  {
    id: 'content-writer',
    title: 'Content Writer',
    interests: ['arts', 'education', 'business'],
    skills: ['beginner', 'intermediate', 'advanced'],
    personality: ['creative', 'introvert'],
    workStyle: ['independent'],
    environment: ['remote', 'office', 'flexible'],
    subjectAffinity: [],
    salary: 'PKR 30K-70K',
    growth: '+22%',
    demand: 'Medium',
    requiredSkills: ['Writing', 'SEO', 'Research', 'Creativity']
  },
  {
    id: 'mechanical-engineer',
    title: 'Mechanical Engineer',
    interests: ['engineering', 'technology'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'creative'],
    workStyle: ['teamwork', 'independent', 'research'],
    environment: ['office', 'fieldwork'],
    subjectAffinity: ['Physics', 'Mathematics'],
    salary: 'PKR 50K-110K',
    growth: '+17%',
    demand: 'High',
    requiredSkills: ['CAD', 'Thermodynamics', 'Manufacturing', 'Design']
  },
  {
    id: 'pharmacist',
    title: 'Pharmacist',
    interests: ['medicine', 'social-work'],
    skills: ['intermediate', 'advanced'],
    personality: ['analytical', 'extrovert'],
    workStyle: ['independent', 'teamwork'],
    environment: ['office', 'fieldwork'],
    subjectAffinity: ['Chemistry', 'Biology'],
    salary: 'PKR 50K-90K',
    growth: '+16%',
    demand: 'High',
    requiredSkills: ['Pharmaceutical Knowledge', 'Patient Counseling', 'Drug Information', 'Healthcare']
  },
  {
    id: 'research-scientist',
    title: 'Research Scientist',
    interests: ['technology', 'medicine', 'engineering'],
    skills: ['advanced'],
    personality: ['analytical', 'introvert'],
    workStyle: ['research', 'independent', 'teamwork'],
    environment: ['office', 'fieldwork'],
    subjectAffinity: ['Biology', 'Chemistry', 'Physics', 'Mathematics'],
    salary: 'PKR 70K-150K',
    growth: '+20%',
    demand: 'High',
    requiredSkills: ['Research Methods', 'Data Analysis', 'Laboratory Skills', 'Scientific Writing']
  }
];



function analyzeSubjectPerformance(subjectAnswers) {
  if (!subjectAnswers || Object.keys(subjectAnswers).length === 0) {
    return { subjectScores: {}, strongSubjects: [], overallAccuracy: 0 };
  }

  const subjectScores = {};
  const subjectCounts = {};

  
  SUBJECT_QUESTIONS.forEach(question => {
    const userAnswer = subjectAnswers[question.id];
    if (userAnswer) {
      const subject = question.subject;
      const isCorrect = question.options.find(opt => opt.id === userAnswer)?.correct || false;
      
      if (!subjectScores[subject]) {
        subjectScores[subject] = 0;
        subjectCounts[subject] = 0;
      }
      
      subjectCounts[subject]++;
      if (isCorrect) {
        subjectScores[subject]++;
      }
    }
  });

  
  const subjectPercentages = {};
  Object.keys(subjectScores).forEach(subject => {
    subjectPercentages[subject] = Math.round((subjectScores[subject] / subjectCounts[subject]) * 100);
  });

  
  const strongSubjects = Object.entries(subjectPercentages)
    .filter(([_, score]) => score >= 60)
    .sort(([_, a], [__, b]) => b - a)
    .map(([subject, _]) => subject);

  
  const totalCorrect = Object.values(subjectScores).reduce((sum, score) => sum + score, 0);
  const totalQuestions = Object.values(subjectCounts).reduce((sum, count) => sum + count, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return {
    subjectScores: subjectPercentages,
    strongSubjects,
    overallAccuracy,
    totalCorrect,
    totalQuestions
  };
}


function enhancedCareerRecommendation(userAnswers, subjectPerformance) {
  const { interests, skills, personality, workStyle, environment } = userAnswers;
  const { strongSubjects = [], overallAccuracy = 0 } = subjectPerformance;

  const trees = [
    
    (career) => {
      let score = 0;
      const interestMatches = career.interests.filter(i => interests.includes(i)).length;
      score += (interestMatches / Math.max(career.interests.length, interests.length)) * 100;
      return score;
    },
    
    
    (career) => {
      return career.skills.includes(skills) ? 100 : 50;
    },
    
    
    (career) => {
      return career.personality.includes(personality) ? 100 : 40;
    },
    
    (career) => {
      return career.workStyle.includes(workStyle) ? 100 : 45;
    },
    
    
    (career) => {
      return career.environment.includes(environment) ? 100 : 50;
    },
    
    
    (career) => {
      let score = 0;
      const interestMatches = career.interests.filter(i => interests.includes(i)).length;
      const personalityMatch = career.personality.includes(personality);
      score += (interestMatches / interests.length) * 60;
      score += personalityMatch ? 40 : 0;
      return score;
    },
    
    
    (career) => {
      let score = 0;
      const skillMatch = career.skills.includes(skills);
      const workStyleMatch = career.workStyle.includes(workStyle);
      score += skillMatch ? 50 : 25;
      score += workStyleMatch ? 50 : 25;
      return score;
    },
    
    
    (career) => {
      let score = 0;
      const interestMatches = career.interests.filter(i => interests.includes(i)).length;
      const skillMatch = career.skills.includes(skills);
      const personalityMatch = career.personality.includes(personality);
      const workStyleMatch = career.workStyle.includes(workStyle);
      const environmentMatch = career.environment.includes(environment);
      
      score += (interestMatches / interests.length) * 30;
      score += skillMatch ? 20 : 10;
      score += personalityMatch ? 20 : 10;
      score += workStyleMatch ? 15 : 5;
      score += environmentMatch ? 15 : 5;
      return score;
    }
  ];

  
  if (strongSubjects.length > 0) {
    trees.push((career) => {
      const subjectMatches = career.subjectAffinity.filter(s => strongSubjects.includes(s)).length;
      const baseScore = (subjectMatches / Math.max(career.subjectAffinity.length, 1)) * 100;
     
      const accuracyBoost = (overallAccuracy / 100) * 20;
      return Math.min(baseScore + accuracyBoost, 100);
    });
  }
  
  
  const careerScores = CAREER_DATABASE.map(career => {
    
    const treeScores = trees.map(tree => tree(career));
    
  
    const finalScore = treeScores.reduce((sum, score) => sum + score, 0) / trees.length;
    
    return {
      ...career,
      matchScore: Math.round(finalScore)
    };
  });
  
  
  const topCareers = careerScores
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
  
  return topCareers;
}


function generateDetailedReason(career, userAnswers, subjectPerformance) {
  const reasons = [];
  const { strongSubjects = [], overallAccuracy = 0, subjectScores = {} } = subjectPerformance;
  
 
  const interestMatches = career.interests.filter(i => userAnswers.interests.includes(i));
  if (interestMatches.length > 0) {
    reasons.push(`your strong interest in ${interestMatches.join(' and ')}`);
  }
  
  
  if (career.skills.includes(userAnswers.skills)) {
    reasons.push(`your ${userAnswers.skills} skill level`);
  }
  
  
  if (career.personality.includes(userAnswers.personality)) {
    reasons.push(`your ${userAnswers.personality} personality`);
  }
  
  
  if (career.workStyle.includes(userAnswers.workStyle)) {
    reasons.push(`your preference for ${userAnswers.workStyle} work`);
  }
  
  
  if (career.environment.includes(userAnswers.environment)) {
    reasons.push(`your desire for ${userAnswers.environment} work environment`);
  }
  
  
  if (strongSubjects.length > 0) {
    const matchingSubjects = career.subjectAffinity.filter(s => strongSubjects.includes(s));
    if (matchingSubjects.length > 0) {
      const subjectScoreDetails = matchingSubjects.map(s => `${s} (${subjectScores[s]}%)`).join(', ');
      reasons.push(`your excellent performance in ${subjectScoreDetails}`);
    }
  }
  
  let explanation = `This career matches ${reasons.join(', ')}.`;
  
  
  if (overallAccuracy > 0) {
    if (overallAccuracy >= 80) {
      explanation += ` Your exceptional ${overallAccuracy}% accuracy in the subject assessment demonstrates strong academic abilities that are crucial for this field.`;
    } else if (overallAccuracy >= 60) {
      explanation += ` With ${overallAccuracy}% accuracy in the subject assessment, you've shown solid foundational knowledge relevant to this career.`;
    } else {
      explanation += ` Your ${overallAccuracy}% accuracy in the subject assessment shows potential, and with focused learning, you can excel in this field.`;
    }
  }
  

  const strengthAnalysis = [];
  if (interestMatches.includes('technology') && strongSubjects.includes('Computer Science')) {
    strengthAnalysis.push('strong technical aptitude');
  }
  if (interestMatches.includes('medicine') && (strongSubjects.includes('Biology') || strongSubjects.includes('Chemistry'))) {
    strengthAnalysis.push('scientific knowledge base');
  }
  if (interestMatches.includes('engineering') && (strongSubjects.includes('Mathematics') || strongSubjects.includes('Physics'))) {
    strengthAnalysis.push('engineering mindset');
  }
  if (interestMatches.includes('business') && (strongSubjects.includes('Business') || strongSubjects.includes('Mathematics'))) {
    strengthAnalysis.push('business acumen');
  }
  
  if (strengthAnalysis.length > 0) {
    explanation += ` Your ${strengthAnalysis.join(' and ')} make you well-suited for this path.`;
  }
  
  return explanation;
}



router.get('/subject-questions', (req, res) => {
  try {
    
    const questionsForClient = SUBJECT_QUESTIONS.map(q => ({
      id: q.id,
      subject: q.subject,
      question: q.question,
      options: q.options.map(opt => ({ id: opt.id, text: opt.text }))
    }));
    
    return res.json({
      success: true,
      questions: questionsForClient,
      totalQuestions: questionsForClient.length
    });
  } catch (err) {
    console.error('Error fetching subject questions:', err);
    return res.status(500).json({ error: 'Failed to fetch subject questions' });
  }
});


router.post('/recommendations', async (req, res) => {
  try {
    const { interests, skills, personality, workStyle, environment, subjectAnswers, takeSubjectTest } = req.body;
    
    
    if (!interests || !Array.isArray(interests) || interests.length === 0) {
      return res.status(400).json({ error: 'Please select at least one area of interest' });
    }
    
    if (!skills) {
      return res.status(400).json({ error: 'Please select your skill level' });
    }
    
    if (!personality) {
      return res.status(400).json({ error: 'Please select your personality type' });
    }
    
    if (!workStyle) {
      return res.status(400).json({ error: 'Please select your work style preference' });
    }
    
    if (!environment) {
      return res.status(400).json({ error: 'Please select your preferred work environment' });
    }
    
    const userAnswers = { interests, skills, personality, workStyle, environment };
    
  
    let subjectPerformance = { subjectScores: {}, strongSubjects: [], overallAccuracy: 0 };
    if (takeSubjectTest && subjectAnswers) {
      subjectPerformance = analyzeSubjectPerformance(subjectAnswers);
    }
    
    
    const topCareers = enhancedCareerRecommendation(userAnswers, subjectPerformance);
    
  
    const recommendations = topCareers.map(career => ({
      title: career.title,
      matchScore: career.matchScore,
      reason: generateDetailedReason(career, userAnswers, subjectPerformance),
      salary: career.salary,
      growth: career.growth,
      demand: career.demand,
      requiredSkills: career.requiredSkills
    }));
    
  
    const response = {
      success: true,
      recommendations,
      userProfile: userAnswers,
      algorithm: 'Enhanced Random Forest Classifier'
    };
    
    
    if (takeSubjectTest && subjectPerformance.overallAccuracy > 0) {
      response.subjectAnalysis = {
        overallAccuracy: subjectPerformance.overallAccuracy,
        totalCorrect: subjectPerformance.totalCorrect,
        totalQuestions: subjectPerformance.totalQuestions,
        subjectScores: subjectPerformance.subjectScores,
        strongSubjects: subjectPerformance.strongSubjects
      };
    }
    
    return res.json(response);
  } catch (err) {
    console.error('Recommendation error:', err);
    return res.status(500).json({ error: 'Server error while generating recommendations' });
  }
});

export default router;
