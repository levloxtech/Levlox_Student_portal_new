import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckCircle, Shield, Award, BookOpen, Code, Database, Sparkles,
  ChevronDown, ChevronUp, ArrowRight, Star, Gift, Tag,
  Clock, Users, FileText, Briefcase, HelpCircle,
  ExternalLink, Layers, Check, Zap, PlayCircle, Lock, User, Play, Film, X, Maximize2, Laptop,
  ChevronLeft, ChevronRight, Mail, ShieldCheck, AlertCircle, CheckCircle2, RefreshCw, ArrowDown
} from 'lucide-react';
import leveloxLogo from '../assets/levelox-icon-transparent.png';
import studentPortalImg from '../assets/student-portal-interface.png';
import supportHubImg from '../assets/support-hub-interface.png';
import verifiedCertImg from '../assets/verified-certificate.png';
import supportSystemImg from '../assets/support-system-24-7.png';
import levloxCertImg from '../assets/levlox-completion-certificate.png';
import { getResolvedThumbnail, resolveDirectImageUrl, getEmbedVideoUrl } from '../utils/videoUtils';

// Dedicated Authentic Brand Icons for Python, Machine Learning, and SQL
function PythonBrandIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 110 110" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M54.1 3.5C28.2 3.5 29.8 14.7 29.8 14.7L29.9 26.3H54.6V29.8H19.7S3.5 28.3 3.5 54.2C3.5 80.1 17.6 78.4 17.6 78.4H26V66.6S25.2 52.5 39.5 52.5H63.9S76.8 52.9 76.8 40.2V19.4S78.8 3.5 54.1 3.5ZM41 11C43.8 11 46 13.2 46 16C46 18.8 43.8 21 41 21C38.2 21 36 18.8 36 16C36 13.2 38.2 11 41 11Z"
        fill="#387EB8"
      />
      <path
        d="M55.9 106.5C81.8 106.5 80.2 95.3 80.2 95.3L80.1 83.7H55.4V80.2H90.3S106.5 81.7 106.5 55.8C106.5 29.9 92.4 31.6 92.4 31.6H84V43.4S84.8 57.5 70.5 57.5H46.1S33.2 57.1 33.2 69.8V90.6S31.2 106.5 55.9 106.5ZM69 99C66.2 99 64 96.8 64 94C64 91.2 66.2 89 69 89C71.8 89 74 91.2 74 94C74 96.8 71.8 99 69 99Z"
        fill="#FFE873"
      />
    </svg>
  );
}

function MLBrandIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="4" stroke="#7C3AED" strokeWidth="1.8" fill="#F5F3FF" />
      <circle cx="7.5" cy="7.5" r="1.8" fill="#7C3AED" />
      <circle cx="7.5" cy="16.5" r="1.8" fill="#7C3AED" />
      <circle cx="16.5" cy="7.5" r="1.8" fill="#7C3AED" />
      <circle cx="16.5" cy="16.5" r="1.8" fill="#7C3AED" />
      <circle cx="12" cy="12" r="2.4" fill="#A855F7" />
      <line x1="7.5" y1="7.5" x2="12" y2="12" stroke="#7C3AED" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="7.5" y1="16.5" x2="12" y2="12" stroke="#7C3AED" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="16.5" y1="7.5" x2="12" y2="12" stroke="#7C3AED" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="16.5" y1="16.5" x2="12" y2="12" stroke="#7C3AED" strokeWidth="1.4" strokeOpacity="0.75" />
      <line x1="7" y1="0.5" x2="7" y2="2.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="0.5" x2="12" y2="2.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="17" y1="0.5" x2="17" y2="2.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7" y1="21.5" x2="7" y2="23.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="12" y1="21.5" x2="12" y2="23.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="17" y1="21.5" x2="17" y2="23.5" stroke="#7C3AED" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SQLBrandIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <ellipse cx="12" cy="5" rx="8.5" ry="2.8" fill="#ECFDF5" stroke="#059669" strokeWidth="1.8" />
      <path d="M3.5 5V11C3.5 12.5 7.3 13.8 12 13.8C16.7 13.8 20.5 12.5 20.5 11V5" stroke="#059669" strokeWidth="1.8" />
      <path d="M3.5 11V17C3.5 18.5 7.3 19.8 12 19.8C16.7 19.8 20.5 18.5 20.5 17V11" stroke="#059669" strokeWidth="1.8" />
      <rect x="7" y="8" width="10" height="6" rx="2" fill="#059669" />
      <text x="12" y="12.7" textAnchor="middle" fill="#FFFFFF" fontSize="4.8" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.4">SQL</text>
    </svg>
  );
}

const COURSES = [
  {
    id: 'python',
    title: 'Python Programming',
    badge: 'Foundations',
    referenceValue: 7500,
    duration: '40+ Hours',
    description: 'Master complete Python fundamentals, core data structures, object-oriented principles, and modular application development.',
    syllabus: [
      'Python Fundamentals and Syntax',
      'Variables and Data Types',
      'Operators and Conditional Statements',
      'Loops (For, While, Nested)',
      'Lists, Tuples, Sets and Dictionaries',
      'Functions and Modules',
      'File Handling & Streams',
      'Exception Handling & Robust Code',
      'Object-Oriented Programming Fundamentals',
      'Practical Python Exercises & Coding Challenges'
    ]
  },
  {
    id: 'adv-python',
    title: 'Advanced Python',
    badge: 'Architecture',
    referenceValue: 7500,
    duration: '35+ Hours',
    description: 'Deep dive into memory management, comprehensions, custom decorators, generators, virtual environments, and scalable architecture.',
    syllabus: [
      'Advanced Functions & First-Class Objects',
      'Lambda, Map, Filter and Comprehensions',
      'Iterators and Custom Generators',
      'Decorators & Function Wrappers',
      'Object-Oriented Programming in Depth (Polymorphism, Dunder)',
      'Working with Files and Data Formats (JSON, CSV, XML)',
      'Virtual Environments and Package Management',
      'Error Handling, Profiling and Debugging',
      'Writing Reusable and Maintainable Production Code'
    ]
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    badge: 'High Impact',
    referenceValue: 12500,
    duration: '50+ Hours',
    description: 'End-to-end Machine Learning pipeline: Exploratory Data Analysis, feature engineering, regression, classification, clustering, and model evaluation.',
    syllabus: [
      'Introduction to Machine Learning & Data Science',
      'Supervised and Unsupervised Learning',
      'Data Preprocessing & Cleaning Pipelines',
      'Exploratory Data Analysis (EDA) & Visualization',
      'Feature Engineering & Normalization',
      'Regression Algorithms (Linear, Ridge, Lasso)',
      'Classification Algorithms (Logistic, Trees, Forests)',
      'Clustering (K-Means, Hierarchical)',
      'Model Evaluation & Performance Metrics',
      'Train-Test Splitting and Cross-Validation',
      'Overfitting and Underfitting Diagnostics',
      'Practical Model-Building & Deployment Workflow'
    ]
  },
  {
    id: 'sql',
    title: 'SQL & Database Architecture',
    badge: 'Data Core',
    referenceValue: 15000,
    duration: '45+ Hours',
    description: 'Relational database architecture, advanced complex joins, subqueries, indexing, window functions, and real-world analytical queries.',
    syllabus: [
      'Introduction to Relational Databases & RDBMS Architecture',
      'Database and Table Creation with Schemas',
      'SELECT Statements & Expression Filtering',
      'Filtering, Sorting, and Pattern Matching',
      'Aggregate Functions (COUNT, SUM, AVG, MIN, MAX)',
      'GROUP BY and HAVING Clauses',
      'Joins (INNER, LEFT, RIGHT, FULL OUTER, CROSS)',
      'Subqueries & Correlated Subqueries',
      'Constraints, Primary Keys, and Foreign Keys',
      'Data Manipulation Statements (INSERT, UPDATE, DELETE)',
      'Practical SQL Queries for Business Data Analysis'
    ]
  }
];

const PYTHON_PROJECTS = [
  {
    name: 'Login & Multi-Role Authentication System',
    worth: '₹8,500',
    tags: ['Python', 'JWT & Bcrypt', 'File I/O', 'RBAC'],
    outcome: 'Role-based access control, cryptographic password hashing, session tokens, and automated audit logs.'
  },
  {
    name: 'Smart Retail Billing & Invoicing System',
    worth: '₹9,500',
    tags: ['Python', 'ReportLab Engine', 'CSV / JSON', 'Tax Logic'],
    outcome: 'Dynamic invoice calculation with multi-tier GST logic, barcode lookup, inventory checks, and PDF exports.'
  },
  {
    name: 'Student Attendance Management Platform',
    worth: '₹9,000',
    tags: ['Python', 'Pandas', 'CSV / JSON', 'Alerts'],
    outcome: 'Daily class batch tracker, absenteeism anomaly flags, attendance percentiles, and CSV export reports.'
  }
];

const ML_PROJECTS = [
  {
    name: 'Used Car Price Prediction Engine',
    worth: '₹12,500',
    tags: ['Scikit-Learn', 'Pandas', 'Random Forest', 'FastAPI'],
    outcome: 'Regression modeling on multi-attribute real-world automobile pricing datasets with feature pipelines.'
  },
  {
    name: 'Financial Market Trend Forecasting',
    worth: '₹14,000',
    tags: ['Time Series', 'ARIMA', 'Rolling Windows', 'Matplotlib'],
    outcome: 'Historical pattern recognition, rolling window volatility modeling, and predictive price trajectories.'
  },
  {
    name: 'Customer Review Sentiment Analysis',
    worth: '₹11,500',
    tags: ['NLP', 'TF-IDF', 'Logistic Regression', 'NLTK'],
    outcome: 'Text tokenization, sentiment classification on user feedback, and consumer opinion categorization.'
  }
];

const SQL_PROJECTS = [
  {
    name: 'Retail Enterprise Data Analysis',
    worth: '₹11,000',
    tags: ['PostgreSQL', 'Window Functions', 'Aggregate Joins'],
    outcome: 'Multi-store monthly revenue trends, customer lifetime value metrics, and product basket analysis.'
  },
  {
    name: 'UI-Driven Database Management Interface',
    worth: '₹10,500',
    tags: ['SQL', 'CRUD Architecture', 'Triggers', 'Indexing'],
    outcome: 'Dynamic form submission handling, schema integrity constraints, and automated database table indexing.'
  },
  {
    name: 'Customer Cohort & Retention Analysis',
    worth: '₹13,500',
    tags: ['Advanced SQL', 'Cohort Curves', 'CTEs', 'Windowing'],
    outcome: 'Month-over-month user retention matrices, churn risk factors, and behavioral cohort segmentation analysis.'
  }
];

const INTERVIEW_KIT_MODULES = [
  {
    title: 'Industry-Level Resume Building',
    worth: '₹5,500',
    tag: 'ATS-Optimized',
    color: '#2563EB',
    bg: '#EFF6FF',
    topics: [
      'ATS-Compliant Architecture: Zero-rejection formats parsed 100% by enterprise recruitment platforms.',
      'STAR & Metric-Driven Formatting: Transforming project tasks into quantifiable business results with strong action verbs.',
      'Role-Specific Keyword Injection: Keyword clusters optimized for Python Developers, SQL Analysts, and ML Engineers.',
      'Industry-Level Project Showcasing: Best practices for displaying portfolio GitHub repos, live demos, and datasets.',
      '1-on-1 Self-Audit Checklists: Rigorous criteria to ensure error-free formatting, structure, and readability.'
    ]
  },
  {
    title: 'LinkedIn Profile Optimization',
    worth: '₹6,000',
    tag: 'Industry Magnet',
    color: '#0A66C2',
    bg: '#EBF4FF',
    topics: [
      'Algorithmic Headline & Bio Formulation: High-converting headline structures that multiply search appearances by 4x.',
      'Featured Portfolio & Project Showcase: Highlighting live apps, project repos, and verifiable certificate credentials.',
      'Strategic Skill Endorsement Matrix: Keyword placement to rank at the top of LinkedIn Recruiter filter queries.',
      'Personal Branding in Tamil & English: Sharing technical learnings, capstone progress, and industry milestones.',
      'Direct Recruiter Outreach Scripts: High-response DM templates for talent partners, recruiters, and engineering managers.'
    ]
  },
  {
    title: 'Technical & HR Interview Prep Kit',
    worth: '₹7,500',
    tag: 'Comprehensive Q&A',
    color: '#059669',
    bg: '#ECFDF5',
    topics: [
      '500+ Curated IT Interview Questions: Real interview question banks covering Python, SQL, and ML in Tamil & English.',
      'Live Whiteboard & Coding Strategies: Step-by-step methodologies to crack unseen live technical coding rounds.',
      'Scenario-Based Architecture Drills: How to explain database joins, ETL pipelines, and model deployment during rounds.',
      'Behavioral Round Frameworks: Master "Tell me about yourself", career gap explanations, and situational inquiries.',
      'Salary Negotiation & Offer Evaluation: Proven strategies to negotiate compensation and secure optimal starting packages.'
    ]
  }
];

const PORTFOLIO_PROJECTS = [
  {
    name: 'Customer Churn Prediction Engine',
    tech: 'Python, Pandas, XGBoost, Scikit-Learn',
    outcome: 'Identify high-risk churn customers with 92%+ precision, delivering retention insights.',
    value: '₹12,000'
  },
  {
    name: 'Public Transportation Crowding Forecast',
    tech: 'Python, Docker, MySQL, SQLAlchemy, Scikit-Learn, Random Forest',
    outcome: 'Predict commuter volume and transit route crowding across peak hours using containerized Random Forest models and relational database telemetry.',
    value: '₹14,000'
  },
  {
    name: 'Hyper-Local Food Delivery Time Estimator',
    tech: 'Machine Learning, Feature Pipeline, APIs',
    outcome: 'Predict real-time delivery turnaround incorporating weather, distance, and preparation latency.',
    value: '₹15,000'
  },
  {
    name: 'Full-Stack Billing System with Payment Integration',
    tech: 'Python, SQL, Razorpay API, PDF Invoicing',
    outcome: 'Production-ready billing software handling dynamic checkout, secure signatures, and receipts.',
    value: '₹16,000'
  }
];

export default function AcademyShowcase() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Lead details for the active session (starts as null for unauthenticated visitors so registration is prompted during checkout)
  const [lead, setLead] = useState(() => {
    // Only load lead if currently authenticated
    return null;
  });

  // Sync logged-in user as lead if authenticated
  useEffect(() => {
    if (currentUser?.email) {
      const authLead = {
        name: currentUser.name || currentUser.displayName || 'Member',
        email: currentUser.email,
        phone: currentUser.phone || '',
        userType: currentUser.role || 'student',
        credits: 3600
      };
      setLead(authLead);
    }
  }, [currentUser]);

  // State for Weekly Prerequisite Gate Modal (first-time members must start with Week 1 sprint)
  const [showWeeklyGateModal, setShowWeeklyGateModal] = useState(false);

  // Modal for collecting lead if visiting directly without registering first
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [modalForm, setModalForm] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'student',
    password: '',
    confirmPassword: ''
  });
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Course Expand State
  const [expandedCourse, setExpandedCourse] = useState('python');

  // Membership & Pricing State
  const [selectedPlan, setSelectedPlan] = useState('weekly'); // 'weekly' | 'annual'
  const [couponInputs, setCouponInputs] = useState({ weekly: '', annual: '' });
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [appliedCouponPlan, setAppliedCouponPlan] = useState(''); // 'weekly' | 'annual'
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponStatus, setCouponStatus] = useState({ plan: '', message: '', isSuccess: false });
  const [calcLoading, setCalcLoading] = useState(false);

  // Dynamic calculations for both plans
  // Weekly Learning Cycle: Standard ₹749 cut to ₹99 for Week 1 (Auto-locks after 7 days; ₹299/week for Week 2+)
  const weeklyBase = 99;
  const isWeeklyCouponApplied = appliedCouponPlan === 'weekly' && !!appliedCoupon;
  const weeklyCouponDiscount = isWeeklyCouponApplied ? couponDiscount : 0;
  const weeklyPayable = Math.max(0, weeklyBase - weeklyCouponDiscount);

  // Machine Learning Engineer Internship Program: Standard package ₹35,999.
  // Apply Score Credits (₹20,000) and Enrolly Coupon (₹6,000) -> Net fee ₹9,999!
  // Once applied, discounts are fixed (no remove option).
  const [isAnnualCreditsApplied, setIsAnnualCreditsApplied] = useState(false);
  const [isAnnualCouponApplied, setIsAnnualCouponApplied] = useState(false);

  const annualBase = 35999;
  const annualCreditsAmount = 20000;
  const annualCouponAmount = 6000;

  const annualCreditsDeduction = isAnnualCreditsApplied ? annualCreditsAmount : 0;
  const annualEnrollyDeduction = isAnnualCouponApplied ? annualCouponAmount : 0;
  const isAnnualCustomCouponApplied = appliedCouponPlan === 'annual' && !!appliedCoupon;
  const customAnnualCouponDiscount = isAnnualCustomCouponApplied ? couponDiscount : 0;

  const annualPayable = Math.max(0, annualBase - annualCreditsDeduction - annualEnrollyDeduction - customAnnualCouponDiscount);

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
  };

  // Payment Execution State
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  // Auto-detect exam qualification from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('qualified') === 'true' || params.get('plan') === 'annual') {
      setSelectedPlan('annual');
      setIsAnnualCreditsApplied(true);
      setIsAnnualCouponApplied(true);
    }
  }, []);

  // Email OTP Verification State Before Payment
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmailInput, setOtpEmailInput] = useState('');
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isEmailOtpVerified, setIsEmailOtpVerified] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(null); // { isSimulated, targetPlan }
  const otpInputRef = useRef(null);

  // Auto-focus OTP input when modal appears
  useEffect(() => {
    if (showOtpModal) {
      const timer = setTimeout(() => {
        otpInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [showOtpModal]);

  const handleOtpInputChange = (val) => {
    const sanitized = val.replace(/\D/g, '').slice(0, 6);
    setOtpCodeInput(sanitized);
    if (otpError) setOtpError('');
  };

  // OTP Countdown Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Video Testimonials from Admin Panel
  const [testimonials, setTestimonials] = useState([]);
  const [activeVideoModal, setActiveVideoModal] = useState(null);
  const [testimonialVideoOrientation, setTestimonialVideoOrientation] = useState('portrait');
  const testimonialsScrollRef = useRef(null);

  const scrollTestimonials = (direction) => {
    if (testimonialsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -310 : 310;
      testimonialsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Lightbox for Previewing Screenshots & Certificate
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    fetch('/api/membership/testimonials')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials.filter(t => t.active !== false));
        }
      })
      .catch(err => console.error('Failed to load testimonials:', err));
  }, []);

  // Industrial Projects from Database with fallback to DEFAULT_PROJECTS
  const [industrialProjectsList, setIndustrialProjectsList] = useState([]);
  const [portfolioProjectsList, setPortfolioProjectsList] = useState([]);
  const [selectedProjectVideoModal, setSelectedProjectVideoModal] = useState(null);

  useEffect(() => {
    fetch('/api/data/industrial_projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setIndustrialProjectsList(data);
        }
      })
      .catch(err => console.error('Failed to load industrial projects:', err));

    fetch('/api/data/portfolio_projects')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPortfolioProjectsList(data);
        }
      })
      .catch(err => console.error('Failed to load portfolio projects:', err));

    fetch('/api/data/hero_banner')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHeroBannerData(data[0]);
        }
      })
      .catch(err => console.error('Failed to load hero banner:', err));
  }, []);

  // Hero Banner Company Video
  const [heroBannerData, setHeroBannerData] = useState(null);
  const [isPlayingHeroVideo, setIsPlayingHeroVideo] = useState(false);
  const heroVideoRef = useRef(null);
  const heroVideoContainerRef = useRef(null);

  const handlePlayHeroVideo = () => {
    if (!heroBannerData?.videoUrl) return;
    setIsPlayingHeroVideo(true);

    const isIframe =
      getEmbedUrl(heroBannerData.videoUrl).includes('youtube.com/embed') ||
      getEmbedUrl(heroBannerData.videoUrl).includes('drive.google.com');

    const videoEl = heroVideoRef.current;
    const containerEl = heroVideoContainerRef.current;

    if (!isIframe && videoEl) {
      const playPromise = videoEl.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => console.log('Autoplay handled:', err));
      }

      // Automatically launch fullscreen for optimal mobile phone and desktop viewing
      if (videoEl.requestFullscreen) {
        videoEl.requestFullscreen().catch(() => {});
      } else if (videoEl.webkitEnterFullscreen) {
        // iOS Safari native fullscreen on HTMLVideoElement
        try {
          videoEl.webkitEnterFullscreen();
        } catch (e) {
          console.warn('webkitEnterFullscreen error:', e);
        }
      } else if (videoEl.webkitRequestFullscreen) {
        try {
          videoEl.webkitRequestFullscreen();
        } catch (e) {}
      } else if (videoEl.mozRequestFullScreen) {
        try {
          videoEl.mozRequestFullScreen();
        } catch (e) {}
      } else if (videoEl.msRequestFullscreen) {
        try {
          videoEl.msRequestFullscreen();
        } catch (e) {}
      } else if (containerEl && containerEl.requestFullscreen) {
        containerEl.requestFullscreen().catch(() => {});
      }
    } else if (containerEl) {
      if (containerEl.requestFullscreen) {
        containerEl.requestFullscreen().catch(() => {});
      } else if (containerEl.webkitRequestFullscreen) {
        try {
          containerEl.webkitRequestFullscreen();
        } catch (e) {}
      }
    }
  };

  const pythonProjectsData = industrialProjectsList.filter(p => p.category === 'python').length > 0
    ? industrialProjectsList.filter(p => p.category === 'python')
    : PYTHON_PROJECTS;

  const mlProjectsData = industrialProjectsList.filter(p => p.category === 'ml').length > 0
    ? industrialProjectsList.filter(p => p.category === 'ml')
    : ML_PROJECTS;

  const sqlProjectsData = industrialProjectsList.filter(p => p.category === 'sql').length > 0
    ? industrialProjectsList.filter(p => p.category === 'sql')
    : SQL_PROJECTS;

  const portfolioProjectsData = portfolioProjectsList.length > 0
    ? portfolioProjectsList
    : PORTFOLIO_PROJECTS;

  const getEmbedUrl = (url) => {
    if (!url) return '';
    return getEmbedVideoUrl(url);
  };

  // Dynamic Coupon Validation against Admin-configured Coupons
  const handleApplyCoupon = async (targetPlan, inputCode) => {
    const code = (inputCode || '').trim().toUpperCase();
    if (!code) {
      setCouponStatus({
        plan: targetPlan,
        message: 'Please enter a coupon code.',
        isSuccess: false
      });
      return;
    }
    setCalcLoading(true);
    setCouponStatus({ plan: targetPlan, message: 'Validating coupon...', isSuccess: false });
    try {
      const creditToSend = 0;
      const res = await fetch('/api/membership/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan,
          email: lead?.email || '',
          couponCode: code,
          applyCredits: creditToSend
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.couponDiscount) {
        setCouponStatus({
          plan: targetPlan,
          message: data.error || 'Invalid or expired coupon code.',
          isSuccess: false
        });
        if (appliedCouponPlan === targetPlan) {
          setAppliedCoupon('');
          setAppliedCouponPlan('');
          setCouponDiscount(0);
        }
      } else {
        setSelectedPlan(targetPlan);
        setAppliedCoupon(code);
        setAppliedCouponPlan(targetPlan);
        setCouponDiscount(data.couponDiscount);
        setCouponStatus({
          plan: targetPlan,
          message: `✓ Coupon "${code}" applied! You save ₹${data.couponDiscount.toLocaleString('en-IN')}.`,
          isSuccess: true
        });
      }
    } catch {
      setCouponStatus({
        plan: targetPlan,
        message: 'Failed to validate coupon. Please check connection.',
        isSuccess: false
      });
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRemoveCoupon = (targetPlan) => {
    if (appliedCouponPlan === targetPlan) {
      setAppliedCoupon('');
      setAppliedCouponPlan('');
      setCouponDiscount(0);
      setCouponStatus({ plan: '', message: '', isSuccess: false });
      setCouponInputs(prev => ({ ...prev, [targetPlan]: '' }));
    }
  };

  // Lead modal submit handler for visitors who bypassed /register
  const handleModalLeadSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    if (!modalForm.name || !modalForm.email || !modalForm.phone) {
      setModalError('Please fill in all fields.');
      return;
    }
    if (!modalForm.password || modalForm.password.length < 6) {
      setModalError('Please create a portal password (min 6 characters).');
      return;
    }
    if (modalForm.password !== modalForm.confirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }
    setModalLoading(true);
    try {
      const res = await fetch('/api/membership/register-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modalForm.name.trim(),
          email: modalForm.email.toLowerCase().trim(),
          phone: modalForm.phone.trim(),
          userType: modalForm.userType,
          password: modalForm.password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit registration');

      const leadPayload = {
        name: modalForm.name.trim(),
        email: modalForm.email.toLowerCase().trim(),
        phone: modalForm.phone.trim(),
        userType: modalForm.userType,
        password: modalForm.password,
        credits: data.credits?.balance || 300
      };
      localStorage.setItem('levlox_academy_lead', JSON.stringify(leadPayload));
      setLead(leadPayload);
      setShowLeadModal(false);
      // Trigger OTP verification for newly registered lead
      setPendingCheckout(prev => prev || { isSimulated: false, targetPlan: selectedPlan });
      setOtpEmailInput(leadPayload.email);
      setOtpCodeInput('');
      setOtpError('');
      setShowOtpModal(true);
      await sendPaymentOtp(leadPayload.email, leadPayload.name, (pendingCheckout?.targetPlan || selectedPlan));
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  // Send Payment OTP Function
  const sendPaymentOtp = async (targetEmail, targetName, targetPlan) => {
    const toEmail = (targetEmail || otpEmailInput || lead?.email || '').trim().toLowerCase();
    if (!toEmail || !toEmail.includes('@')) {
      setOtpError('Please enter a valid registered email address.');
      setOtpSuccessMsg('');
      return false;
    }
    setOtpLoading(true);
    setOtpError('');
    setOtpSuccessMsg('');
    try {
      const res = await fetch('/api/membership/send-payment-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: toEmail,
          name: targetName || lead?.name || 'Student',
          planId: targetPlan || selectedPlan
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code.');
      }
      setOtpSuccessMsg(`Security verification code sent to ${toEmail}`);
      setOtpError('');
      setOtpTimer(60);
      return true;
    } catch (err) {
      setOtpError(err.message);
      setOtpSuccessMsg('');
      return false;
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify Payment OTP Function
  const handleVerifyPaymentOtp = async (e) => {
    if (e) e.preventDefault();
    const toEmail = (otpEmailInput || lead?.email || '').trim().toLowerCase();
    const cleanOtp = otpCodeInput.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setOtpError('Please enter the complete 6-digit verification code.');
      setOtpSuccessMsg('');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('/api/membership/verify-payment-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: toEmail,
          otp: cleanOtp
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code.');
      }
      // Successfully verified!
      setIsEmailOtpVerified(true);
      setShowOtpModal(false);
      setOtpError('');
      setOtpSuccessMsg('');

      // If user modified email in OTP modal, sync with lead state
      let currentEffectiveLead = lead;
      if (toEmail && lead && lead.email !== toEmail) {
        currentEffectiveLead = { ...lead, email: toEmail };
        setLead(currentEffectiveLead);
        localStorage.setItem('levlox_academy_lead', JSON.stringify(currentEffectiveLead));
      }

      // Automatically launch checkout with preserved plan and simulation flag
      const target = pendingCheckout || { isSimulated: false, targetPlan: selectedPlan };
      initiateCheckoutWithLead(currentEffectiveLead, target.isSimulated, target.targetPlan);
    } catch (err) {
      setOtpError(err.message);
      setOtpSuccessMsg('');
    } finally {
      setOtpLoading(false);
    }
  };

  // Trigger Checkout
  const handleCheckout = async (isSimulated = false, planOverride) => {
    const targetPlan = planOverride || selectedPlan;
    if (planOverride && planOverride !== selectedPlan) {
      handleSelectPlan(planOverride);
    }

    // FIRST-TIME MEMBER SPRINT-FIRST POLICY:
    // If attempting to purchase the 1-Year Machine Learning Engineer Internship,
    // verify that user has previous weekly enrollment or completed Week 1!
    if (targetPlan === 'annual') {
      const params = new URLSearchParams(window.location.search);
      const isParamQualified = params.get('qualified') === 'true';
      const hasWeeklyHistory = Boolean(
        isParamQualified ||
        currentUser?.hasPassedInternshipExam ||
        currentUser?.membership?.planId ||
        currentUser?.role === 'student' ||
        lead?.hasPassedInternshipExam ||
        lead?.isRenewal ||
        lead?.hasWeeklyAccess
      );
      if (!hasWeeklyHistory) {
        setShowWeeklyGateModal(true);
        return;
      }
    }

    // Registration Check: If visitor has not provided their details, open registration modal
    const currentLead = lead || (currentUser ? {
      name: currentUser.name || currentUser.displayName,
      email: currentUser.email,
      phone: currentUser.phone || ''
    } : null);

    if (!currentLead || !currentLead.email || !currentLead.name || !currentLead.phone) {
      setPendingCheckout({ isSimulated, targetPlan });
      setShowLeadModal(true);
      return;
    }

    // Email OTP Authorization Gate
    if (!isEmailOtpVerified) {
      setPendingCheckout({ isSimulated, targetPlan });
      setOtpEmailInput(currentLead.email);
      setOtpCodeInput('');
      setOtpError('');
      setOtpSuccessMsg('');
      setShowOtpModal(true);
      await sendPaymentOtp(currentLead.email, currentLead.name, targetPlan);
      return;
    }

    // Once email is OTP-verified, proceed to Checkout
    initiateCheckoutWithLead(currentLead, isSimulated, targetPlan);
  };

  // Initiate Razorpay order or simulated test payment
  const initiateCheckoutWithLead = async (currentLead, isSimulated, targetPlan = selectedPlan) => {
    setPaymentLoading(true);
    try {
      let activeCoupon = '';
      let creditToSend = 0;
      if (targetPlan === 'annual') {
        creditToSend = isAnnualCreditsApplied ? 20000 : 0;
        if (appliedCouponPlan === 'annual' && appliedCoupon) {
          activeCoupon = appliedCoupon;
        } else if (isAnnualCouponApplied) {
          activeCoupon = 'ENROLL6000';
        }
      } else {
        activeCoupon = (appliedCouponPlan === 'weekly') ? appliedCoupon : '';
      }
      // 1. Create Order on Backend
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan,
          email: currentLead.email,
          name: currentLead.name,
          phone: currentLead.phone,
          couponCode: activeCoupon,
          applyCredits: creditToSend
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize order');

      // 2. Check if Zero Payment or Simulated Test
      if (orderData.isZeroPayment || isSimulated) {
        const verifyRes = await fetch('/api/membership/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId || `sim_ord_${Date.now()}`,
            razorpay_payment_id: `pay_sim_${Date.now()}`,
            razorpay_signature: 'simulated_valid_signature',
            planId: targetPlan,
            email: currentLead.email,
            name: currentLead.name,
            phone: currentLead.phone,
            password: currentLead.password,
            couponCode: activeCoupon,
            applyCredits: creditToSend,
            isSimulatedTest: isSimulated
          })
        });
        const verifyData = await verifyRes.json();
        if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');
        setPaymentSuccessData(verifyData);
        setPaymentLoading(false);
        return;
      }

      // 3. Load Razorpay Checkout Script if not present
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        console.warn('Razorpay script unavailable; running test fallback.');
        return initiateCheckoutWithLead(currentLead, true);
      }

      // 4. Open Razorpay Checkout Modal (with Full UPI: GPay, PhonePe, Paytm, QR + Cards & NetBanking)
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Levlox Academy',
        description: orderData.planName,
        image: 'https://levloxstudent.com/favicon.ico',
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/membership/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: targetPlan,
                email: currentLead.email,
                name: currentLead.name,
                phone: currentLead.phone,
                password: currentLead.password,
                couponCode: activeCoupon,
                applyCredits: creditToSend
              })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || 'Payment verification failed');
            setPaymentSuccessData(verifyData);
          } catch (verr) {
            alert('Payment verification issue: ' + verr.message);
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: currentLead.name,
          email: currentLead.email,
          contact: (currentLead.phone || '').replace(/\D/g, '').slice(-10)
        },
        notes: {
          planId: targetPlan,
          studentEmail: currentLead.email,
          studentName: currentLead.name,
          studentPhone: currentLead.phone
        },
        theme: {
          color: '#4568F5'
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert('Payment failed: ' + (resp.error?.description || 'Transaction cancelled.'));
        setPaymentLoading(false);
      });
      rzp.open();
    } catch (err) {
      alert(err.message);
      setPaymentLoading(false);
    }
  };



  return (
    <div style={{ background: '#F5F7FC', minHeight: '100vh', color: '#172033', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>

      {/* Global Embedded Styles for Mobile Responsiveness & Testimonials Carousel */}
      <style>{`
        .academy-top-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: #FFFFFF;
          border-bottom: 1px solid #E3E9F4;
          box-shadow: 0 1px 3px rgba(16, 27, 51, 0.04);
          padding: 14px 24px;
        }
        .testimonials-carousel-row {
          display: flex;
          flex-direction: row;
          flex-wrap: nowrap;
          justify-content: flex-start;
          align-items: stretch;
          gap: 20px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 8px 4px 18px;
          margin: 0 -4px;
        }
        .testimonials-carousel-row::-webkit-scrollbar {
          display: none;
          height: 0;
          width: 0;
        }
        .carousel-nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 4px 18px rgba(16, 27, 51, 0.16);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 20;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          color: #1E293B;
          padding: 0;
          outline: none;
        }
        .carousel-nav-btn:hover {
          background: #FFFFFF;
          border-color: #4568F5;
          color: #4568F5;
          box-shadow: 0 8px 24px rgba(69, 104, 245, 0.28);
          transform: translateY(-50%) scale(1.1);
        }
        .carousel-nav-btn:active {
          transform: translateY(-50%) scale(0.95);
        }
        .carousel-nav-prev {
          left: -18px;
        }
        .carousel-nav-next {
          right: -18px;
        }
        @media (max-width: 900px) {
          .carousel-nav-prev {
            left: -8px;
          }
          .carousel-nav-next {
            right: -8px;
          }
          .carousel-nav-btn {
            width: 38px;
            height: 38px;
            box-shadow: 0 4px 14px rgba(16, 27, 51, 0.22);
          }
        }
        @media (max-width: 640px) {
          .carousel-nav-btn {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          .academy-top-header {
            padding: 10px 12px !important;
          }
          .academy-brand-badge {
            display: none !important;
          }
          .academy-lead-label {
            display: none !important;
          }
          .academy-lead-chip {
            padding: 4px 8px !important;
            font-size: 11.5px !important;
            max-width: 120px !important;
          }
          .academy-login-btn {
            padding: 5px 10px !important;
            font-size: 11.5px !important;
          }
          .testimonials-carousel-row {
            gap: 14px !important;
            padding: 4px 0 16px !important;
          }
        }
        @media (max-width: 480px) {
          .academy-lead-chip {
            max-width: 95px !important;
          }
        }
      `}</style>

      {/* TOP NAVIGATION BAR */}
      <header className="academy-top-header">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <img
              src={leveloxLogo}
              alt="Levlox"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px', color: '#101B33' }}>LEVLOX</span>
              <span className="academy-brand-badge" style={{ fontSize: 11, fontWeight: 700, color: '#4568F5', background: '#EEF2FE', padding: '2px 7px', borderRadius: 6 }}>ACADEMY</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 1, minWidth: 0, justifyContent: 'flex-end' }}>
            {lead ? (
              <span
                className="academy-lead-chip"
                title={lead.name}
                style={{
                  fontSize: 12, color: '#4568F5', background: '#EEF2FE',
                  padding: '5px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 5,
                  border: '1px solid #C7D4FD', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}
              >
                <User size={13} style={{ flexShrink: 0 }} />
                <span className="academy-lead-label" style={{ opacity: 0.8, marginRight: 2 }}>Registered:</span>
                <strong style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleEnrollClick(null)}
                className="academy-login-btn"
                style={{
                  fontSize: 12.5, fontWeight: 700, color: '#4568F5',
                  background: '#EEF2FE', padding: '6px 14px', borderRadius: 20, border: '1px solid #C7D4FD', whiteSpace: 'nowrap', cursor: 'pointer'
                }}
              >
                Enroll Now
              </button>
            )}
            <Link
              to="/login"
              className="academy-login-btn"
              style={{
                fontSize: 12.5, fontWeight: 700, color: '#1E293B', textDecoration: 'none',
                background: '#F1F5F9', padding: '6px 12px', borderRadius: 20, border: '1px solid #CBD5E1', whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* SHOWCASE HERO BANNER */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        padding: '60px 24px 70px',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F7FC 100%)',
        borderBottom: '1px solid #E3E9F4',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          {/* Top Subheading - Exactly Matching Register Page */}
          <div style={{
            fontSize: 'clamp(18px, 2.5vw, 24px)',
            fontWeight: 800,
            color: '#101B33',
            letterSpacing: '-0.3px',
            marginBottom: 16
          }}>
            Become a <span style={{ color: '#2563EB' }}>Levlox</span> <span style={{ color: '#7C3AED' }}>Academy</span> Member
          </div>

          {/* Main Headline - Exactly Matching Register Page Colors & "in தமிழ்" Badge */}
          <h1 style={{
            fontSize: 'clamp(32px, 4.8vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.25,
            color: '#0F172A',
            letterSpacing: '-0.8px',
            margin: '0 0 22px'
          }}>
            Get <span style={{ color: '#2563EB', fontWeight: 800 }}>24 Resources</span> to Crack Your IT Interviews for <span style={{ color: '#16A34A', fontWeight: 800 }}>Free.</span>{' '}
            <span style={{
              background: '#059669',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 14,
              boxShadow: '0 3px 10px rgba(5, 150, 105, 0.35)',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              lineHeight: 1.2,
              verticalAlign: 'middle',
              position: 'relative',
              top: -3
            }}>
              <span>in</span>
              <span style={{ letterSpacing: '0.4px' }}>தமிழ்</span>
            </span>
          </h1>

          {/* HERO BANNER COMPANY VIDEO CARD */}
          {heroBannerData?.enabled !== false && (
            <div style={{
              maxWidth: 820,
              margin: '28px auto 0',
              borderRadius: 22,
              background: '#0B0F19',
              boxShadow: '0 24px 60px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.9)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Aspect Ratio Container (16:9) */}
              <div
                ref={heroVideoContainerRef}
                style={{
                  position: 'relative',
                  width: '100%',
                  paddingBottom: '56.25%',
                  background: '#090D16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}
              >
                {/* Direct Video Element - Pre-mounted so requestFullscreen & play trigger synchronously on user tap */}
                {heroBannerData?.videoUrl &&
                  !getEmbedUrl(heroBannerData.videoUrl).includes('youtube.com/embed') &&
                  !getEmbedUrl(heroBannerData.videoUrl).includes('drive.google.com') && (
                    <video
                      ref={heroVideoRef}
                      src={heroBannerData.videoUrl}
                      controls
                      playsInline
                      onEnded={() => setIsPlayingHeroVideo(false)}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        zIndex: isPlayingHeroVideo ? 2 : 0,
                        opacity: isPlayingHeroVideo ? 1 : 0,
                        pointerEvents: isPlayingHeroVideo ? 'auto' : 'none',
                        background: '#000000'
                      }}
                    />
                )}

                {/* If it's an iframe (YouTube or Google Drive embed), render when playing */}
                {isPlayingHeroVideo && heroBannerData?.videoUrl &&
                  (getEmbedUrl(heroBannerData.videoUrl).includes('youtube.com/embed') ||
                   getEmbedUrl(heroBannerData.videoUrl).includes('drive.google.com')) && (
                    <iframe
                      src={getEmbedUrl(heroBannerData.videoUrl)}
                      title="Levlox Academy Company Overview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                      allowFullScreen
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        border: 'none',
                        zIndex: 2
                      }}
                    />
                )}

                {/* Cover Thumbnail Overlay with Play Button - Hidden when playing */}
                {!isPlayingHeroVideo && (
                  <div
                    onClick={handlePlayHeroVideo}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      cursor: heroBannerData?.videoUrl ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 3
                    }}
                  >
                    {/* Background Thumbnail Image or Stylized Modern Tech Canvas */}
                    {heroBannerData?.thumbnailUrl ? (
                      <img
                        src={heroBannerData.thumbnailUrl}
                        alt="Levlox Academy Overview"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at 50% 35%, #1E293B 0%, #090D16 100%)'
                      }} />
                    )}

                    {/* Centered Transparent Frosted Glass Play Button */}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 3,
                        width: 72,
                        height: 72,
                        borderRadius: '50%',
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '2.5px solid rgba(255, 255, 255, 0.9)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                        paddingLeft: 4,
                        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = 'rgba(37, 99, 235, 0.6)';
                        e.currentTarget.style.borderColor = '#FFFFFF';
                        e.currentTarget.style.boxShadow = '0 12px 36px rgba(37, 99, 235, 0.5), 0 0 0 6px rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.45)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      <Play size={28} fill="#FFFFFF" color="#FFFFFF" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Separate Explore the Program Button (Outside & Below Video Container) */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 32,
            marginBottom: 8
          }}>
            <button
              type="button"
              onClick={() => {
                const target = document.getElementById('courses') || document.getElementById('pricing');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px 38px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                fontSize: 15.5,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -4px rgba(37, 99, 235, 0.45), 0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 30px -4px rgba(37, 99, 235, 0.55), 0 6px 16px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(37, 99, 235, 0.45), 0 4px 12px rgba(0, 0, 0, 0.08)';
              }}
            >
              <span>Explore the Program</span>
              <ArrowDown size={18} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </section>

      {/* CAN I BECOME A DEVELOPER? (VIDEO STORIES & REVIEWS) */}
      {testimonials.length > 0 && (
        <section style={{ padding: '54px 20px 60px', background: '#FFFFFF', borderBottom: '1px solid #E3E9F4' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            {/* Centered Heading without subtext or arrow buttons */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                fontWeight: 800,
                color: '#101B33',
                margin: 0,
                letterSpacing: '-0.5px'
              }}>
                Can I Become a Developer?
              </h2>
            </div>

            {/* Carousel Container with Floating Side Navigation Buttons */}
            <div style={{ position: 'relative' }}>
              {/* Left Arrow Button (Only if multiple testimonials exist) */}
              {testimonials.length > 1 && (
                <button
                  type="button"
                  onClick={() => scrollTestimonials('left')}
                  className="carousel-nav-btn carousel-nav-prev"
                  aria-label="Previous Testimonials"
                  title="Scroll left"
                >
                  <ChevronLeft size={22} strokeWidth={2.4} />
                </button>
              )}

              {/* Single Row with Side Movement Scroll (Horizontal Carousel) */}
              <div
                ref={testimonialsScrollRef}
                className="testimonials-carousel-row"
                style={{
                  justifyContent: testimonials.length <= 3 ? 'center' : 'flex-start'
                }}
              >
                {testimonials.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveVideoModal(item)}
                  style={{
                    position: 'relative',
                    width: 'min(280px, calc(100vw - 48px))',
                    minWidth: 'min(280px, calc(100vw - 48px))',
                    maxWidth: 300,
                    height: 385,
                    borderRadius: 22,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    boxShadow: '0 12px 32px rgba(16, 27, 51, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.7)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    background: '#0B0F19',
                    flexShrink: 0,
                    scrollSnapAlign: 'center',
                    margin: '0 auto'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 27, 51, 0.2)';
                    const playBtn = e.currentTarget.querySelector('.story-play-btn');
                    if (playBtn) playBtn.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(16, 27, 51, 0.12), 0 0 0 1px rgba(226, 232, 240, 0.7)';
                    const playBtn = e.currentTarget.querySelector('.story-play-btn');
                    if (playBtn) playBtn.style.transform = 'scale(1)';
                  }}
                >
                  {/* Fallback Stylized Avatar (always rendered underneath) */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(circle at 50% 25%, #1E2B4D 0%, #0D1424 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingBottom: 110
                  }}>
                    <div style={{
                      width: 68,
                      height: 68,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4568F5 0%, #7C3AED 100%)',
                      color: '#FFFFFF',
                      fontSize: 26,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 24px rgba(69, 104, 245, 0.4)',
                      marginBottom: 8
                    }}>
                      {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600, letterSpacing: '0.3px' }}>
                      Video Review
                    </span>
                  </div>

                  {/* Background Thumbnail Image (auto-derived & auto-hides if broken/404) */}
                  {(() => {
                    const resolved = getResolvedThumbnail(item.videoUrl, item.thumbnailUrl);
                    if (!resolved) return null;
                    return (
                      <img
                        src={resolved}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          zIndex: 1
                        }}
                      />
                    );
                  })()}

                  {/* Gradient Overlay for high-contrast legibility */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(10,15,30,0.5) 40%, rgba(10,15,30,0.96) 80%)',
                    pointerEvents: 'none'
                  }} />

                  {/* Card Bottom Content */}
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16px 16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2
                  }}>
                    {/* Top Row: Name, Role & Play Button */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{
                          color: '#FFFFFF',
                          fontSize: 16,
                          fontWeight: 700,
                          margin: '0 0 2px',
                          letterSpacing: '-0.3px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.studentName}
                        </h3>

                        {item.role && (
                          <p style={{
                            color: 'rgba(255, 255, 255, 0.82)',
                            fontSize: 12,
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {item.role}
                          </p>
                        )}
                      </div>

                      {/* Floating Round White Play Button */}
                      <div
                        className="story-play-btn"
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.35)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <Play size={15} fill="#101B33" color="#101B33" style={{ marginLeft: 2 }} />
                      </div>
                    </div>

                    {/* Star Rating */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, margin: '6px 0 4px' }}>
                      {[...Array(5)].map((_, si) => (
                        <span
                          key={si}
                          style={{
                            color: si < (item.rating || 5) ? '#FBBF24' : 'rgba(255, 255, 255, 0.3)',
                            fontSize: 13,
                            lineHeight: 1
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span style={{ color: '#FBBF24', fontSize: 11, fontWeight: 700, marginLeft: 4 }}>
                        {(item.rating || 5)}.0
                      </span>
                    </div>

                    {/* Feedback / Review Text right at the bottom of the stars */}
                    {item.feedback ? (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.92)',
                        fontSize: 12,
                        lineHeight: 1.45,
                        margin: '2px 0 8px',
                        fontStyle: 'italic',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        "{item.feedback}"
                      </p>
                    ) : (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: 12,
                        lineHeight: 1.4,
                        margin: '2px 0 8px',
                        fontStyle: 'italic'
                      }}>
                        "Cracked IT interview successfully with Levlox Academy."
                      </p>
                    )}

                    {/* LinkedIn Button at the bottom */}
                    {item.linkedinUrl && (
                      <div style={{ marginTop: 2 }}>
                        <a
                          href={item.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`Verify ${item.studentName} on LinkedIn`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#FFFFFF',
                            background: 'rgba(10, 102, 194, 0.85)',
                            backdropFilter: 'blur(4px)',
                            padding: '3px 8px',
                            borderRadius: 4,
                            textDecoration: 'none'
                          }}
                        >
                          <svg fill="#FFFFFF" viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
                          </svg>
                          LinkedIn
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>

              {/* Right Arrow Button (Only if multiple testimonials exist) */}
              {testimonials.length > 1 && (
                <button
                  type="button"
                  onClick={() => scrollTestimonials('right')}
                  className="carousel-nav-btn carousel-nav-next"
                  aria-label="Next Testimonials"
                  title="Scroll right"
                >
                  <ChevronRight size={22} strokeWidth={2.4} />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 4 LEARNING COURSES WITH INTERACTIVE EXPANDABLE SYLLABUS */}
      <section id="courses" style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Responsive Syllabus / Agenda Styles */}
        <style>{`
          .courses-showcase-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 20px;
            align-items: stretch;
          }
          @media (min-width: 900px) {
            .courses-showcase-grid {
              grid-template-columns: repeat(4, 1fr) !important;
              gap: 20px !important;
            }
            .course-card-item {
              cursor: default !important;
              border: 1px solid #E3E9F4 !important;
              box-shadow: 0 4px 16px rgba(16, 27, 51, 0.04) !important;
            }
            .course-card-item:hover {
              border-color: #2563EB !important;
              box-shadow: 0 12px 28px rgba(37, 99, 235, 0.1) !important;
            }
            /* Agenda is open by default for everyone on system/desktop */
            .course-agenda-container {
              display: block !important;
            }
            /* Hide toggle button on system/desktop */
            .course-mobile-toggle-btn {
              display: none !important;
            }
            .course-desktop-status {
              display: flex !important;
            }
          }
          @media (max-width: 899px) {
            .courses-showcase-grid {
              grid-template-columns: 1fr !important;
            }
            .course-card-item {
              cursor: pointer !important;
            }
            .course-agenda-container {
              display: none;
            }
            .course-agenda-container.mobile-expanded {
              display: block !important;
            }
            .course-mobile-toggle-btn {
              display: flex !important;
            }
            .course-desktop-status {
              display: none !important;
            }
          }
        `}</style>

        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4568F5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            ACADEMY CURRICULUM OVERVIEW
          </span>
          <h2 style={{
            fontSize: 'clamp(24px, 3.2vw, 34px)',
            fontWeight: 800,
            color: '#101B33',
            margin: '8px 0 0',
            letterSpacing: '-0.5px',
            lineHeight: 1.25
          }}>
            <span style={{ color: '#2563EB' }}>24 Resources</span> to Crack Your IT Interviews for <span style={{ color: '#16A34A' }}>Free</span> in Tamil
          </h2>
          <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '6px 16px', borderRadius: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
              Total Curriculum Value: <strong>₹42,500</strong> (4 Comprehensive Course Modules)
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 10 }}>
              Free for Academy Members
            </span>
          </div>
        </div>

        <div className="courses-showcase-grid">
          {COURSES.map((course) => {
            const isExpanded = expandedCourse === course.id;
            return (
              <div
                key={course.id}
                className="course-card-item"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  border: isExpanded ? '2px solid #4568F5' : '1px solid #E3E9F4',
                  boxShadow: isExpanded ? '0 12px 32px rgba(69, 104, 245, 0.12)' : '0 4px 16px rgba(16, 27, 51, 0.04)',
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 900) {
                    setExpandedCourse(isExpanded ? null : course.id);
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: '#4568F5', background: '#EEF2FE',
                    padding: '3px 10px', borderRadius: 20, border: '1px solid #C7D4FD'
                  }}>
                    {course.badge}
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: '#64748B' }}>Standalone Value</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#059669' }}>₹{course.referenceValue.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#101B33', margin: '0 0 8px' }}>
                  {course.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px', flexGrow: 1 }}>
                  {course.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #EEF2F8' }}>
                  <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} color="#4568F5" /> {course.duration}
                  </span>
                  {/* Mobile Toggle Button */}
                  <span className="course-mobile-toggle-btn" style={{ fontSize: 12, color: '#4568F5', fontWeight: 600, alignItems: 'center', gap: 4 }}>
                    {isExpanded ? 'Hide Syllabus' : 'View Syllabus'} {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                  {/* Desktop Status Badge */}
                  <span className="course-desktop-status" style={{ fontSize: 11, color: '#059669', fontWeight: 700, alignItems: 'center', gap: 4 }}>
                    Curriculum Agenda ✓
                  </span>
                </div>

                {/* Syllabus & Agenda Box: Always open on system/desktop, expandable on mobile */}
                <div
                  className={`course-agenda-container ${isExpanded ? 'mobile-expanded' : ''}`}
                  style={{
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: '1px solid #E3E9F4',
                    background: '#F8FAFD',
                    padding: 14,
                    borderRadius: 10,
                    flexGrow: 1
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 10 }}>
                    Course Modules & Topics:
                  </div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {course.syllabus.map((topic, tidx) => (
                      <li key={tidx} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span style={{ color: '#10B981', fontWeight: 700, flexShrink: 0 }}>•</span>
                        <span style={{ lineHeight: 1.4 }}>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INDUSTRIAL PROJECT EXPERIENCE */}
      <section style={{ padding: '60px 24px', background: '#FFFFFF', borderTop: '1px solid #E3E9F4', borderBottom: '1px solid #E3E9F4' }}>
        <style>{`
          .industrial-projects-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            align-items: stretch;
          }
          .industrial-category-col {
            background: #F8FAFC;
            border-radius: 16px;
            padding: 22px;
            border: 1px solid #E2E8F0;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
          }
          .industrial-cards-container {
            display: grid;
            grid-template-rows: repeat(3, 1fr);
            gap: 16px;
            flex-grow: 1;
          }
          .industrial-project-card {
            background: #FFFFFF;
            padding: 16px 18px;
            border-radius: 14px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 12px;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            height: 100%;
            box-sizing: border-box;
          }
          .industrial-project-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
            transform: translateY(-2px);
          }
          .project-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 10px;
            min-height: 40px;
          }
          .project-card-title {
            font-size: 14px;
            font-weight: 700;
            color: #0F172A;
            line-height: 1.35;
            margin: 0;
          }
          .project-card-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            align-content: flex-start;
            min-height: 48px;
          }
          .project-media-slot {
            position: relative;
            width: 100%;
            aspect-ratio: 16 / 9;
            border-radius: 10px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0B0F19;
            border: 1px solid #E2E8F0;
            transition: all 0.2s ease;
          }
          .project-media-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.35s ease;
          }
          .industrial-project-card:hover .project-media-img {
            transform: scale(1.04);
          }
          .project-card-outcome {
            font-size: 12px;
            color: #64748B;
            line-height: 1.48;
            margin: 0;
            min-height: 36px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .project-video-badge {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 23, 42, 0.38);
            transition: background 0.2s ease;
          }
          .project-video-badge:hover {
            background: rgba(15, 23, 42, 0.55);
          }
          .project-play-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.95);
            color: #0F172A;
            font-size: 11.5px;
            font-weight: 700;
            border-radius: 20px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            transition: transform 0.18s ease;
          }
          .project-video-badge:hover .project-play-pill {
            transform: scale(1.05);
          }
          @media (max-width: 1080px) {
            .industrial-projects-grid {
              grid-template-columns: 1fr !important;
              gap: 24px !important;
            }
            .industrial-cards-container {
              grid-template-rows: auto !important;
            }
          }
          @media (max-width: 640px) {
            .industrial-category-col {
              padding: 16px 14px !important;
              border-radius: 14px !important;
            }
            .industrial-project-card {
              padding: 14px 14px !important;
              gap: 10px !important;
            }
            .project-card-header {
              min-height: auto !important;
            }
            .project-card-tags {
              min-height: auto !important;
            }
            .project-card-outcome {
              min-height: auto !important;
            }
          }
        `}</style>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Section Title only, without description */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{
              fontSize: 'clamp(26px, 3.5vw, 36px)',
              fontWeight: 800,
              color: '#101B33',
              textAlign: 'center',
              margin: '0 0 10px',
              letterSpacing: '-0.5px'
            }}>
              Industrial Project Experience
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 16px', borderRadius: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#166534' }}>
                Total Industrial Projects Value: <strong>₹1,00,000</strong> (9 Real Enterprise Capstones)
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 10 }}>
                Free for Academy Members
              </span>
            </div>
          </div>

          <div className="industrial-projects-grid">
            {/* Python Category Column */}
            <div className="industrial-category-col">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1.5px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PythonBrandIcon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A', fontWeight: 800 }}>Python Projects</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Backend & Core Systems</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#2563EB',
                  background: '#EFF6FF',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #BFDBFE'
                }}>
                  3 Projects
                </span>
              </div>

              <div className="industrial-cards-container">
                {pythonProjectsData.map((p, i) => (
                  <div key={p.id || i} className="industrial-project-card" style={{ borderLeft: '3.5px solid #2563EB' }}>
                    <div className="project-card-header">
                      <div className="project-card-title">
                        {i + 1}. {p.name}
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        Worth {p.worth}
                      </span>
                    </div>

                    <div className="project-card-tags">
                      {(p.tags || []).map((tag, tIdx) => (
                        <span key={tIdx} style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#334155',
                          background: '#F1F5F9',
                          padding: '2px 7px',
                          borderRadius: 4
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Media Slot (Thumbnail / Video Preview) */}
                    {(p.thumbnailUrl || p.videoUrl) ? (
                      <div
                        className="project-media-slot"
                        onClick={() => {
                          if (p.videoUrl) {
                            setSelectedProjectVideoModal({
                              name: p.name,
                              videoUrl: p.videoUrl,
                              thumbnailUrl: p.thumbnailUrl,
                              worth: p.worth,
                              categoryLabel: 'Python Projects',
                              outcome: p.outcome
                            });
                          }
                        }}
                        style={{ cursor: p.videoUrl ? 'pointer' : 'default' }}
                      >
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt={p.name} className="project-media-img" />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 6
                          }}>
                            <PythonBrandIcon size={26} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#2563EB' }}>
                              Python Project Walkthrough
                            </span>
                          </div>
                        )}
                        {p.videoUrl && (
                          <div className="project-video-badge">
                            <div className="project-play-pill">
                              <Play size={13} fill="#0F172A" />
                              <span>Watch Demo Video</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="project-media-slot"
                        style={{
                          background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)',
                          border: '1px dashed #BFDBFE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '8px 12px'
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: '#EFF6FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <PythonBrandIcon size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1E40AF', lineHeight: 1.2 }}>
                            Production Architecture & RBAC
                          </span>
                          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                            Full-stack Python implementation
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="project-card-outcome">
                      {p.outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ML Category Column */}
            <div className="industrial-category-col">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1.5px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#F5F3FF',
                    border: '1px solid #EDE9FE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MLBrandIcon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A', fontWeight: 800 }}>Machine Learning</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Predictive & NLP Models</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#7C3AED',
                  background: '#F5F3FF',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #DDD6FE'
                }}>
                  3 Projects
                </span>
              </div>

              <div className="industrial-cards-container">
                {mlProjectsData.map((p, i) => (
                  <div key={p.id || i} className="industrial-project-card" style={{ borderLeft: '3.5px solid #7C3AED' }}>
                    <div className="project-card-header">
                      <div className="project-card-title">
                        {i + 1}. {p.name}
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        Worth {p.worth}
                      </span>
                    </div>

                    <div className="project-card-tags">
                      {(p.tags || []).map((tag, tIdx) => (
                        <span key={tIdx} style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#334155',
                          background: '#F1F5F9',
                          padding: '2px 7px',
                          borderRadius: 4
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Media Slot (Thumbnail / Video Preview) */}
                    {(p.thumbnailUrl || p.videoUrl) ? (
                      <div
                        className="project-media-slot"
                        onClick={() => {
                          if (p.videoUrl) {
                            setSelectedProjectVideoModal({
                              name: p.name,
                              videoUrl: p.videoUrl,
                              thumbnailUrl: p.thumbnailUrl,
                              worth: p.worth,
                              categoryLabel: 'Machine Learning',
                              outcome: p.outcome
                            });
                          }
                        }}
                        style={{ cursor: p.videoUrl ? 'pointer' : 'default' }}
                      >
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt={p.name} className="project-media-img" />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 6
                          }}>
                            <MLBrandIcon size={26} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#7C3AED' }}>
                              ML Model Walkthrough
                            </span>
                          </div>
                        )}
                        {p.videoUrl && (
                          <div className="project-video-badge">
                            <div className="project-play-pill">
                              <Play size={13} fill="#0F172A" />
                              <span>Watch Demo Video</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="project-media-slot"
                        style={{
                          background: 'linear-gradient(135deg, #F8FAFC 0%, #F5F3FF 100%)',
                          border: '1px dashed #DDD6FE',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '8px 12px'
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: '#F5F3FF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <MLBrandIcon size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#6D28D9', lineHeight: 1.2 }}>
                            Predictive Pipeline & API
                          </span>
                          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                            Feature engineering & model weights
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="project-card-outcome">
                      {p.outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SQL Category Column */}
            <div className="industrial-category-col">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 16,
                marginBottom: 16,
                borderBottom: '1.5px solid #E2E8F0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#ECFDF5',
                    border: '1px solid #D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SQLBrandIcon size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: '#0F172A', fontWeight: 800 }}>SQL Projects</h3>
                    <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Data Warehousing & Queries</span>
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#059669',
                  background: '#ECFDF5',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #A7F3D0'
                }}>
                  3 Projects
                </span>
              </div>

              <div className="industrial-cards-container">
                {sqlProjectsData.map((p, i) => (
                  <div key={p.id || i} className="industrial-project-card" style={{ borderLeft: '3.5px solid #059669' }}>
                    <div className="project-card-header">
                      <div className="project-card-title">
                        {i + 1}. {p.name}
                      </div>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '2px 8px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}>
                        Worth {p.worth}
                      </span>
                    </div>

                    <div className="project-card-tags">
                      {(p.tags || []).map((tag, tIdx) => (
                        <span key={tIdx} style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#334155',
                          background: '#F1F5F9',
                          padding: '2px 7px',
                          borderRadius: 4
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Media Slot (Thumbnail / Video Preview) */}
                    {(p.thumbnailUrl || p.videoUrl) ? (
                      <div
                        className="project-media-slot"
                        onClick={() => {
                          if (p.videoUrl) {
                            setSelectedProjectVideoModal({
                              name: p.name,
                              videoUrl: p.videoUrl,
                              thumbnailUrl: p.thumbnailUrl,
                              worth: p.worth,
                              categoryLabel: 'SQL Projects',
                              outcome: p.outcome
                            });
                          }
                        }}
                        style={{ cursor: p.videoUrl ? 'pointer' : 'default' }}
                      >
                        {p.thumbnailUrl ? (
                          <img src={p.thumbnailUrl} alt={p.name} className="project-media-img" />
                        ) : (
                          <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: 6
                          }}>
                            <SQLBrandIcon size={26} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                              SQL Database Walkthrough
                            </span>
                          </div>
                        )}
                        {p.videoUrl && (
                          <div className="project-video-badge">
                            <div className="project-play-pill">
                              <Play size={13} fill="#0F172A" />
                              <span>Watch Demo Video</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        className="project-media-slot"
                        style={{
                          background: 'linear-gradient(135deg, #F8FAFC 0%, #ECFDF5 100%)',
                          border: '1px dashed #A7F3D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: '8px 12px'
                        }}
                      >
                        <div style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          background: '#ECFDF5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <SQLBrandIcon size={18} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46', lineHeight: 1.2 }}>
                            Enterprise Schema & Warehousing
                          </span>
                          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                            Windowing queries & CTE pipelines
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="project-card-outcome">
                      {p.outcome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INDUSTRY-LEVEL & PORTFOLIO PROJECTS */}
      <section style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            HIGH-VALUE PORTFOLIO ASSETS
          </span>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#101B33', margin: '8px 0 8px' }}>
            Industry-Level & Portfolio Projects
          </h2>
          <div style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, background: '#FEF3C7', border: '1px solid #FDE68A', padding: '6px 16px', borderRadius: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
              Total Portfolio Value: <strong>₹57,000</strong> (4 Production-Grade Portfolios)
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 10 }}>
              Free for Academy Members
            </span>
          </div>
          <p style={{ color: '#64748B', fontSize: 15, maxWidth: 640, margin: '0 auto' }}>
            Stand out in tech interviews by demonstrating real production experience on complex enterprise systems.
          </p>
        </div>

        {/* Portfolio Projects Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
          {portfolioProjectsData.map((proj, idx) => (
            <div key={proj.id || idx} style={{
              background: '#FFFFFF',
              borderRadius: 14, padding: 22,
              border: '1px solid #E3E9F4',
              boxShadow: '0 4px 16px rgba(16, 27, 51, 0.04)',
              display: 'flex', flexDirection: 'column',
              gap: 12,
              transition: 'all 0.2s ease'
            }}
            className="portfolio-project-card"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#D97706', background: '#FEF3C7', border: '1px solid #FDE68A', padding: '3px 8px', borderRadius: 6 }}>
                  PORTFOLIO #{idx + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>{proj.value}</span>
              </div>
              <h4 style={{ fontSize: 17, fontWeight: 700, color: '#101B33', margin: 0, lineHeight: 1.35 }}>{proj.name}</h4>
              <div style={{ fontSize: 12, color: '#64748B' }}><strong>Tech Stack:</strong> {proj.tech}</div>

              {/* Media Slot (Thumbnail / Video Preview) */}
              {(proj.thumbnailUrl || proj.videoUrl) ? (
                <div
                  className="project-media-slot"
                  onClick={() => {
                    if (proj.videoUrl) {
                      setSelectedProjectVideoModal({
                        name: proj.name,
                        videoUrl: proj.videoUrl,
                        thumbnailUrl: proj.thumbnailUrl,
                        worth: proj.value,
                        categoryLabel: `Portfolio Project #${idx + 1}`,
                        outcome: proj.outcome
                      });
                    }
                  }}
                  style={{ cursor: proj.videoUrl ? 'pointer' : 'default' }}
                >
                  {proj.thumbnailUrl ? (
                    <img src={proj.thumbnailUrl} alt={proj.name} className="project-media-img" />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      <Briefcase size={24} color="#D97706" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#B45309' }}>
                        Portfolio Project Demo
                      </span>
                    </div>
                  )}
                  {proj.videoUrl && (
                    <div className="project-video-badge">
                      <div className="project-play-pill">
                        <Play size={13} fill="#0F172A" />
                        <span>Watch Demo Video</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="project-media-slot"
                  style={{
                    background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                    border: '1px dashed #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '8px 12px'
                  }}
                >
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: '#FEF3C7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Briefcase size={16} color="#D97706" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', lineHeight: 1.2 }}>
                      Enterprise Solution Architecture
                    </span>
                    <span style={{ fontSize: 10, color: '#64748B', fontWeight: 500 }}>
                      Production pipeline & verified deployment
                    </span>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 12, color: '#475569', flexGrow: 1, lineHeight: 1.45 }}>{proj.outcome}</div>
            </div>
          ))}
        </div>

        {/* INTERVIEW KIT */}
        <div style={{ marginTop: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4568F5', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                CAREER LAUNCHPAD
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 800, color: '#101B33', margin: 0 }}>
                Interview Kit
              </h3>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', gap: 8, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '6px 16px', borderRadius: 20 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>
                Total Kit Value: <strong>₹19,000</strong> (ATS Resume, LinkedIn & 500+ Interview Q&A)
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 10 }}>
                Free for Academy Members
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {INTERVIEW_KIT_MODULES.map((item, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: 24,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 4px 16px rgba(16, 27, 51, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  borderTop: `4px solid ${item.color}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: item.color,
                      background: item.bg,
                      padding: '3px 8px',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      display: 'inline-block',
                      marginBottom: 8
                    }}>
                      {item.tag}
                    </span>
                    <h4 style={{ margin: 0, fontSize: 18, color: '#0F172A', fontWeight: 800 }}>
                      {item.title}
                    </h4>
                  </div>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 9px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap'
                  }}>
                    Worth {item.worth}
                  </span>
                </div>

                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
                  Key Modules & Deliverables:
                </div>

                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, flexGrow: 1 }}>
                  {item.topics.map((t, tidx) => (
                    <li key={tidx} style={{ fontSize: 12.5, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 8, lineHeight: 1.45 }}>
                      <span style={{ color: item.color, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ONLINE INTERNSHIP SYSTEM & CAREER FEATURES WITH REAL INTERFACE SHOWCASES */}
      <section style={{ padding: '60px 24px', background: '#FFFFFF', borderTop: '1px solid #E3E9F4' }}>
        <style>{`
          .career-showcase-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            align-items: stretch;
          }
          .career-showcase-card {
            background: #FFFFFF;
            border-radius: 16px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: all 0.25s ease;
          }
          .career-showcase-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
            transform: translateY(-3px);
          }
          .mockup-preview-wrap {
            position: relative;
            background: #F1F5F9;
            overflow: hidden;
            cursor: pointer;
            border-bottom: 1px solid #E2E8F0;
          }
          .mockup-header-bar {
            background: #F8FAFC;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid #E2E8F0;
          }
          .mockup-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .mockup-preview-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            display: block;
            transition: transform 0.3s ease;
          }
          .mockup-preview-wrap:hover .mockup-preview-img {
            transform: scale(1.03);
          }
          .mockup-zoom-overlay {
            position: absolute;
            inset: 0;
            background: rgba(15, 23, 42, 0.35);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            color: #FFFFFF;
            font-size: 12px;
            font-weight: 700;
            opacity: 0;
            transition: opacity 0.2s ease;
            backdrop-filter: blur(2px);
          }
          .mockup-preview-wrap:hover .mockup-zoom-overlay {
            opacity: 1;
          }
          @media (max-width: 980px) {
            .career-showcase-grid {
              grid-template-columns: 1fr !important;
              gap: 28px !important;
            }
          }
        `}</style>

        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4568F5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              CAREER ACCELERATION SUITE
            </span>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: 800, color: '#101B33', margin: '8px 0 0', letterSpacing: '-0.5px' }}>
              Online Internship & Career Development
            </h2>
          </div>

          {/* The 3 Core Visual Feature Cards */}
          <div className="career-showcase-grid">

            {/* 1. Student Learning Portal */}
            <div className="career-showcase-card">
              <div
                className="mockup-preview-wrap"
                onClick={() => setLightboxImg({
                  src: studentPortalImg,
                  title: 'Levlox Student Portal Interface',
                  desc: 'Personalized student dashboard with user account access to Python, Machine Learning, SQL courses, and projects.'
                })}
              >
                <div className="mockup-header-bar">
                  <div className="mockup-dot" style={{ background: '#EF4444' }} />
                  <div className="mockup-dot" style={{ background: '#F59E0B' }} />
                  <div className="mockup-dot" style={{ background: '#10B981' }} />
                  <div style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: '#64748B',
                    background: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid #E2E8F0',
                    fontFamily: 'monospace'
                  }}>
                    portal.levlox.in
                  </div>
                </div>
                <img
                  src={studentPortalImg}
                  alt="Levlox Student Portal Interface"
                  className="mockup-preview-img"
                />
                <div className="mockup-zoom-overlay">
                  <Maximize2 size={16} /> Click to View Full Interface
                </div>
              </div>

              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#2563EB',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase'
                  }}>
                    Portal Access
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  Student Portal
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4, margin: '0 0 14px' }}>
                  Get your user account with complete access to Python, Machine Learning, SQL courses & projects.
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Personalized student login credentials with full dashboard access</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Complete course modules for Python, Machine Learning, and SQL</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Assignments, recorded session archives & live progress tracking</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. Course & Internship Certification */}
            <div className="career-showcase-card">
              <div
                className="mockup-preview-wrap"
                onClick={() => setLightboxImg({
                  src: levloxCertImg,
                  title: 'Levlox Academy Course Completion Certificate',
                  desc: 'Official accredited certificate verifying mastery of Python, Machine Learning, SQL, and practical industry capstones.'
                })}
              >
                <div className="mockup-header-bar">
                  <div className="mockup-dot" style={{ background: '#EF4444' }} />
                  <div className="mockup-dot" style={{ background: '#F59E0B' }} />
                  <div className="mockup-dot" style={{ background: '#10B981' }} />
                  <div style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: '#64748B',
                    background: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid #E2E8F0',
                    fontFamily: 'monospace'
                  }}>
                    credentials.levlox.in/verify
                  </div>
                </div>
                <img
                  src={levloxCertImg}
                  alt="Levlox Academy Course Completion Certificate"
                  className="mockup-preview-img"
                />
                <div className="mockup-zoom-overlay">
                  <Maximize2 size={16} /> Click to View Certificate
                </div>
              </div>

              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#D97706',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase'
                  }}>
                    Recognized Credential
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  Course & Internship Certification
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4, margin: '0 0 14px' }}>
                  Industry-recognized dual certification validating coursework and live project experience.
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Unique Verifiable Credential ID with online authenticity check</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Validates Python, Machine Learning & SQL project competencies</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Direct 1-click addition to LinkedIn Licenses & Certifications</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3. 24/7 Support System */}
            <div className="career-showcase-card">
              <div
                className="mockup-preview-wrap"
                onClick={() => setLightboxImg({
                  src: supportSystemImg,
                  title: '24/7 Support System & Community',
                  desc: 'Round-the-clock mentor assistance, active learner community, and real-time doubt clearing.'
                })}
              >
                <div className="mockup-header-bar">
                  <div className="mockup-dot" style={{ background: '#EF4444' }} />
                  <div className="mockup-dot" style={{ background: '#F59E0B' }} />
                  <div className="mockup-dot" style={{ background: '#10B981' }} />
                  <div style={{
                    marginLeft: 8,
                    fontSize: 10,
                    color: '#64748B',
                    background: '#FFFFFF',
                    padding: '2px 10px',
                    borderRadius: 4,
                    border: '1px solid #E2E8F0',
                    fontFamily: 'monospace'
                  }}>
                    support.levlox.in/24-7
                  </div>
                </div>
                <img
                  src={supportSystemImg}
                  alt="24/7 Support System"
                  className="mockup-preview-img"
                />
                <div className="mockup-zoom-overlay">
                  <Maximize2 size={16} /> Click to View Support System
                </div>
              </div>

              <div style={{ padding: 22, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 8px',
                    borderRadius: 6,
                    textTransform: 'uppercase'
                  }}>
                    24/7 Guidance
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  24/7 Support System
                </h3>
                <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.4, margin: '0 0 14px' }}>
                  Round-the-clock mentor assistance, live doubt resolution, and active community help.
                </p>
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, flexGrow: 1, borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Dedicated senior instructor query resolution within hours</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>Peer cohort discussion groups for collaborative coding</span>
                  </li>
                  <li style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <CheckCircle size={14} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>24/7 live assistance on code bugs, doubts, and project execution</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MEMBERSHIP PLANS & PRICING CALCULATOR */}
      <section id="pricing" style={{ padding: '70px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <style>{`
          @keyframes rollingBorder {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes rollShimmerSweep {
            0% { transform: translateX(-150%) skewX(-20deg); }
            35%, 100% { transform: translateX(350%) skewX(-20deg); }
          }
          @keyframes certHighlightPulse {
            0%, 100% {
              box-shadow: 0 4px 14px rgba(245, 158, 11, 0.25), 0 0 0 1.5px #F59E0B;
            }
            50% {
              box-shadow: 0 6px 20px rgba(245, 158, 11, 0.45), 0 0 0 2.5px #D97706;
            }
          }
        `}</style>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Designer Professional Value Showcase Card */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '12px 20px',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            padding: '12px 26px',
            boxShadow: '0 10px 30px -10px rgba(15, 23, 42, 0.08), 0 2px 6px rgba(0, 0, 0, 0.02)',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Standalone Value of All Resources:
              </span>
              <span style={{
                fontSize: 25,
                fontWeight: 900,
                color: '#475569',
                textDecoration: 'line-through',
                textDecorationColor: '#EF4444',
                textDecorationThickness: '3.5px',
                letterSpacing: '-0.5px',
                display: 'inline-block'
              }}>
                ₹2,18,500
              </span>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 800,
              padding: '6px 16px',
              borderRadius: 999,
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}>
              <Sparkles size={13} color="#FFF" />
              100% Free with Membership
            </div>
          </div>

          <h2 style={{
            fontSize: 'clamp(28px, 3.6vw, 38px)',
            fontWeight: 850,
            color: '#0F172A',
            margin: '0',
            lineHeight: 1.25,
            letterSpacing: '-0.5px'
          }}>
            Become a <span style={{ color: '#2563EB' }}>Levlox Academy Member</span> and <span style={{ color: '#059669' }}>Get Everything for Free</span>
          </h2>
        </div>

        {/* Plan Cards Toggle Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 24,
          marginBottom: 36,
          alignItems: 'stretch'
        }}>

          {/* Weekly Learning Cycle Plan */}
          <div
            onClick={() => handleSelectPlan('weekly')}
            style={{
              background: '#FFFFFF',
              border: selectedPlan === 'weekly' ? '2.5px solid #2563EB' : '1px solid #E2E8F0',
              borderRadius: 18, padding: '24px 22px', cursor: 'pointer',
              position: 'relative', transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: selectedPlan === 'weekly' ? '0 12px 35px rgba(37, 99, 235, 0.15)' : '0 2px 8px rgba(16, 27, 51, 0.04)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, color: '#0F172A', fontWeight: 800 }}>Weekly Learning Cycle</h3>
                  <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, marginTop: 3 }}>
                    Sprint-based access &bull; Automatic lock after 7 days
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: selectedPlan === 'weekly' ? '6px solid #2563EB' : '2px solid #CBD5E1',
                  background: '#FFF'
                }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through', marginRight: 8 }}>₹749</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>₹99</span>
                <span style={{ fontSize: 13, color: '#64748B' }}> / Week 1 access</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '2px 8px', borderRadius: 4, marginLeft: 8 }}>
                  FIRST WEEK SPECIAL
                </span>
              </div>

              {/* Core Features List */}
              <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {[
                  '7 Days Unlocked Portal Access',
                  'Python & Advance Python Modules',
                  'Machine Learning & SQL Foundations',
                  'Recorded Video Streaming in HD',
                  '5+ Industry-Level & Portfolio Projects',
                  'Weekly Learning Sprint & Assessments'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                    <Check size={16} color="#10B981" /> {f}
                  </li>
                ))}
              </ul>

              {/* Official Pricing & Savings Breakdown */}
              <div style={{
                background: '#F8FAFC',
                borderRadius: 14,
                padding: '16px 18px',
                border: '1px solid #E2E8F0',
                marginTop: 14
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottom: '1px solid #E2E8F0',
                  marginBottom: 10
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Weekly Cycle Breakdown
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#16A34A',
                    background: '#DCFCE7',
                    padding: '2px 8px',
                    borderRadius: 12
                  }}>
                    Week 1 Access: ₹99
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                    <span>Standard Weekly Fee</span>
                    <span style={{ textDecoration: 'line-through' }}>₹749</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600 }}>
                    <span>Week 1 Promotional Price</span>
                    <span>₹99</span>
                  </div>

                  {/* Dynamic Workshop Coupon Line */}
                  {isWeeklyCouponApplied ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Gift size={13} /> Workshop Coupon ({appliedCoupon})
                      </span>
                      <span>- ₹{weeklyCouponDiscount.toLocaleString('en-IN')}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Gift size={13} /> Workshop Coupon
                      </span>
                      <span>₹0 <span style={{ fontSize: 11 }}>(Enter code below)</span></span>
                    </div>
                  )}

                  <div style={{
                    borderTop: '1.5px dashed #CBD5E1',
                    paddingTop: 10,
                    marginTop: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                        Net Payable (Week 1)
                      </div>
                      <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 600 }}>
                        7 Days Unlocked Access
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: '#0F172A',
                        background: isWeeklyCouponApplied ? '#DCFCE7' : '#FEF08A',
                        padding: '3px 10px',
                        borderRadius: 8,
                        transition: 'all 0.2s ease'
                      }}>
                        ₹{weeklyPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Payment Action for Weekly */}
            <div style={{
              marginTop: 18, paddingTop: 16, borderTop: '1px solid #E2E8F0',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              {/* Dynamic Coupon Input row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={isWeeklyCouponApplied ? appliedCoupon : couponInputs.weekly}
                  disabled={isWeeklyCouponApplied}
                  onChange={(e) => {
                    handleSelectPlan('weekly');
                    setCouponInputs(prev => ({ ...prev, weekly: e.target.value.toUpperCase() }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isWeeklyCouponApplied) {
                      e.preventDefault();
                      handleApplyCoupon('weekly', couponInputs.weekly);
                    }
                  }}
                  style={{
                    flexGrow: 1, padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 12.5, textTransform: 'uppercase',
                    letterSpacing: '0.5px', background: isWeeklyCouponApplied ? '#F1F5F9' : '#FFFFFF'
                  }}
                />
                {isWeeklyCouponApplied ? (
                  <span
                    style={{
                      padding: '8px 14px', borderRadius: 8, background: '#DCFCE7',
                      color: '#15803D', fontSize: 12, fontWeight: 700, border: '1px solid #86EFAC',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    ✓ Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan('weekly');
                      handleApplyCoupon('weekly', couponInputs.weekly);
                    }}
                    disabled={calcLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 8, background: '#2563EB',
                      color: '#FFF', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    {calcLoading && selectedPlan === 'weekly' ? 'Checking...' : 'Apply'}
                  </button>
                )}
              </div>

              {/* Dynamic Coupon Status Feedback */}
              {couponStatus.plan === 'weekly' && couponStatus.message && (
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: couponStatus.isSuccess ? '#15803D' : '#DC2626',
                  background: couponStatus.isSuccess ? '#DCFCE7' : '#FEE2E2',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: couponStatus.isSuccess ? '1px solid #BBF7D0' : '1px solid #FECACA'
                }}>
                  {couponStatus.message}
                </div>
              )}

              {/* UPI & Payment Options Banner */}
              <div style={{
                background: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                borderRadius: 8,
                padding: '8px 10px',
                marginTop: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  <span>⚡ Instant UPI Payment:</span>
                  <span style={{ color: '#16A34A', fontSize: 10.5 }}>✓ Zero Fee</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5B21B6', background: '#EDE9FE', padding: '2px 6px', borderRadius: 4 }}>PhonePe</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '2px 6px', borderRadius: 4 }}>Google Pay</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '2px 6px', borderRadius: 4 }}>Paytm</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>BHIM UPI</span>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>• Cards / NetBanking</span>
                </div>
              </div>

              {/* Dynamic Razorpay Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout(false, 'weekly');
                }}
                disabled={paymentLoading}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFF', fontSize: 15, fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 20px rgba(37, 99, 235, 0.25)',
                  marginTop: 6
                }}
              >
                {paymentLoading && selectedPlan === 'weekly'
                  ? 'Connecting to UPI & Payment...'
                  : `Pay ₹${weeklyPayable.toLocaleString('en-IN')} to Unlock Week 1 →`}
              </button>

              {/* Instant Test Checkout */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(true, 'weekly');
                  }}
                  disabled={paymentLoading}
                  style={{
                    background: 'none', border: 'none', color: '#64748B',
                    fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  ⚡ Instant Test Checkout (Simulated)
                </button>
              </div>
            </div>
          </div>

          {/* Annual Membership Plan (Featured) */}
          <div
            onClick={() => handleSelectPlan('annual')}
            style={{
              background: '#FFFFFF',
              border: selectedPlan === 'annual' ? '2.5px solid #7C3AED' : '1px solid #E2E8F0',
              borderRadius: 18, padding: '24px 22px', cursor: 'pointer',
              position: 'relative', transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: selectedPlan === 'annual' ? '0 16px 40px rgba(124, 58, 237, 0.2)' : '0 2px 8px rgba(16, 27, 51, 0.04)'
            }}
          >
            <div style={{
              position: 'absolute', top: -12, right: 24,
              background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
              color: '#FFF', fontSize: 11, fontWeight: 800, padding: '4px 12px',
              borderRadius: 20, letterSpacing: '0.4px', textTransform: 'uppercase'
            }}>
              ⭐ BEST VALUE: SAVE UP TO ₹26,000
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ flex: 1, paddingRight: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: '#6D28D9',
                      background: '#EDE9FE',
                      padding: '2px 8px',
                      borderRadius: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px'
                    }}>
                      ⭐ Flagship 1-Year Program
                    </span>
                  </div>
                  <h3 style={{ margin: 0, fontSize: 18.5, color: '#0F172A', fontWeight: 800, lineHeight: 1.35 }}>
                    Machine Learning Engineer Internship
                  </h3>
                  <div style={{ fontSize: 13, color: '#7C3AED', fontWeight: 700, marginTop: 4, lineHeight: 1.35 }}>
                    3 Months Training + 9 Months Industrial Training
                  </div>
                  {/* Designer-Grade Highlighted Internship Certificate Banner (Matching Image 3) */}
                  <div style={{
                    marginTop: 10,
                    padding: '10px 14px',
                    background: '#FFFBEB',
                    borderRadius: 12,
                    border: '2px solid #F59E0B',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}>
                    <Sparkles size={20} color="#D97706" style={{ flexShrink: 0 }} />
                    <div style={{
                      fontSize: 12.5,
                      color: '#92400E',
                      lineHeight: 1.45,
                      fontWeight: 700
                    }}>
                      Finish it sooner to receive{' '}
                      <u style={{
                        fontWeight: 800,
                        color: '#78350F',
                        textUnderlineOffset: '3px',
                        textDecorationThickness: '2px'
                      }}>
                        one year of internship certificate with industrial experience
                      </u>
                    </div>
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  border: selectedPlan === 'annual' ? '6px solid #7C3AED' : '2px solid #CBD5E1',
                  background: '#FFF', flexShrink: 0, marginTop: 4
                }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through', marginRight: 8 }}>₹35,999</span>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#0F172A' }}>₹{annualPayable.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 13, color: '#64748B' }}> / 1 full year</span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: (isAnnualCreditsApplied && isAnnualCouponApplied) ? '#059669' : '#7C3AED',
                  background: (isAnnualCreditsApplied && isAnnualCouponApplied) ? '#D1FAE5' : '#EDE9FE',
                  padding: '2px 8px',
                  borderRadius: 4,
                  marginLeft: 8
                }}>
                  {(isAnnualCreditsApplied && isAnnualCouponApplied) ? '₹26,000 SAVINGS APPLIED' : 'APPLY DISCOUNTS BELOW'}
                </span>
              </div>

              {/* Core Features List (2 Columns) */}
              <ul style={{
                margin: '0 0 16px', padding: 0, listStyle: 'none',
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '9px 12px', fontSize: 13
              }}>
                {[
                  'Python & Advance Python',
                  'Machine Learning & SQL',
                  'All Recorded Sessions HD Streaming',
                  '9+ Industry Level Projects',
                  '4+ Portfolio Projects',
                  'Community & Peer Network',
                  'Support System (Live Doubt Sessions)',
                  'Online Internship & Experience',
                  'Verified Industry Certificate',
                  'Resume Builder & LinkedIn Optimizer',
                  '24 Free IT Interview Resources'
                ].map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155' }}>
                    <Check size={16} color="#8B5CF6" /> {f}
                  </li>
                ))}
              </ul>

              {/* Official Annual Pricing & Savings Breakdown */}
              <div style={{
                background: '#FAF5FF',
                borderRadius: 14,
                padding: '16px 18px',
                border: '1px solid #E9D5FF',
                marginTop: 14
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottom: '1px solid #E9D5FF',
                  marginBottom: 10
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Internship Pricing Breakdown
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#7C3AED',
                    background: '#EDE9FE',
                    padding: '2px 8px',
                    borderRadius: 12
                  }}>
                    1 Full Year Program
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6B21A8', opacity: 0.85 }}>
                    <span>Standard Annual Package</span>
                    <span style={{ fontWeight: 600 }}>₹35,999</span>
                  </div>

                  {/* Score Credits ₹20,000 Row with Fixed Applied State & Shining Apply Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isAnnualCreditsApplied ? '#DCFCE7' : '#FFFFFF',
                    border: isAnnualCreditsApplied ? '1px solid #86EFAC' : '1px dashed #CBD5E1',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: isAnnualCreditsApplied ? '#15803D' : '#334155', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Tag size={13} color={isAnnualCreditsApplied ? '#16A34A' : '#7C3AED'} />
                        Score Credits (₹20,000)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {isAnnualCreditsApplied ? '✓ ₹20,000 score credits deducted' : 'Eligible score credits available'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isAnnualCreditsApplied ? (
                        <>
                          <span style={{ fontWeight: 800, color: '#16A34A', fontSize: 13 }}>- ₹20,000</span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid #86EFAC',
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#DCFCE7',
                            color: '#15803D'
                          }}>
                            ✓ Applied
                          </span>
                        </>
                      ) : (
                        <div style={{
                          position: 'relative',
                          borderRadius: 8,
                          padding: '2px',
                          background: 'linear-gradient(90deg, #2563EB, #60A5FA, #38BDF8, #2563EB)',
                          backgroundSize: '300% 300%',
                          animation: 'rollingBorder 2.5s linear infinite',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPlan('annual');
                              setIsAnnualCreditsApplied(true);
                            }}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 11.5,
                              fontWeight: 800,
                              background: '#2563EB',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '45%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent)',
                              animation: 'rollShimmerSweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                              pointerEvents: 'none'
                            }} />
                            <Sparkles size={12} color="#FFF" />
                            <span style={{ position: 'relative', zIndex: 1 }}>Apply</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Enrolly Coupon ₹6,000 Row with Fixed Applied State & Shining Apply Button */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    background: isAnnualCouponApplied ? '#DCFCE7' : '#FFFFFF',
                    border: isAnnualCouponApplied ? '1px solid #86EFAC' : '1px dashed #CBD5E1',
                    transition: 'all 0.2s ease'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, color: isAnnualCouponApplied ? '#15803D' : '#334155', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Gift size={13} color={isAnnualCouponApplied ? '#16A34A' : '#7C3AED'} />
                        Enrolly Coupon (₹6,000)
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>
                        {isAnnualCouponApplied ? '✓ ₹6,000 coupon discount applied' : 'Special enrollment voucher'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isAnnualCouponApplied ? (
                        <>
                          <span style={{ fontWeight: 800, color: '#16A34A', fontSize: 13 }}>- ₹6,000</span>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: 6,
                            border: '1px solid #86EFAC',
                            fontSize: 11,
                            fontWeight: 700,
                            background: '#DCFCE7',
                            color: '#15803D'
                          }}>
                            ✓ Applied
                          </span>
                        </>
                      ) : (
                        <div style={{
                          position: 'relative',
                          borderRadius: 8,
                          padding: '2px',
                          background: 'linear-gradient(90deg, #7C3AED, #C084FC, #EC4899, #7C3AED)',
                          backgroundSize: '300% 300%',
                          animation: 'rollingBorder 2.5s linear infinite',
                          boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
                          overflow: 'hidden'
                        }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectPlan('annual');
                              setIsAnnualCouponApplied(true);
                            }}
                            style={{
                              position: 'relative',
                              overflow: 'hidden',
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 11.5,
                              fontWeight: 800,
                              background: '#7C3AED',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '45%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent)',
                              animation: 'rollShimmerSweep 2.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                              pointerEvents: 'none'
                            }} />
                            <Sparkles size={12} color="#FFF" />
                            <span style={{ position: 'relative', zIndex: 1 }}>Apply</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Separate Custom Coupon (if applied via promo input) */}
                  {isAnnualCustomCouponApplied && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 8,
                      background: '#DCFCE7',
                      border: '1px solid #86EFAC'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#15803D', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Gift size={13} color="#16A34A" />
                          Promo Code ({appliedCoupon})
                        </div>
                        <div style={{ fontSize: 11, color: '#15803D' }}>
                          ✓ Additional discount applied
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#16A34A', fontSize: 13 }}>
                          - ₹{customAnnualCouponDiscount.toLocaleString('en-IN')}
                        </span>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid #86EFAC',
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#DCFCE7',
                          color: '#15803D'
                        }}>
                          ✓ Applied
                        </span>
                      </div>
                    </div>
                  )}

                  <div style={{
                    borderTop: '1.5px dashed #D8B4FE',
                    paddingTop: 10,
                    marginTop: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B21A8', textTransform: 'uppercase' }}>
                        Net Payable Amount
                      </div>
                      <div style={{ fontSize: 11, color: (isAnnualCreditsApplied && isAnnualCouponApplied) ? '#16A34A' : '#7C3AED', fontWeight: 600 }}>
                        {(isAnnualCreditsApplied && isAnnualCouponApplied)
                          ? '✓ Score Credits + Enrolly Coupon Applied'
                          : (isAnnualCreditsApplied || isAnnualCouponApplied)
                            ? 'Discount Applied'
                            : 'Press Apply above to reduce to ₹9,999'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: '#0F172A',
                        background: (isAnnualCreditsApplied && isAnnualCouponApplied) ? '#DCFCE7' : '#FEF08A',
                        padding: '3px 10px',
                        borderRadius: 8,
                        transition: 'all 0.2s ease'
                      }}>
                        ₹{annualPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Payment Action for Annual */}
            <div style={{
              marginTop: 18, paddingTop: 16, borderTop: '1px solid #E2E8F0',
              display: 'flex', flexDirection: 'column', gap: 10
            }}>
              {/* Separate Promo / Coupon Code Input row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="Enter separate coupon code"
                  value={isAnnualCustomCouponApplied ? appliedCoupon : couponInputs.annual}
                  disabled={isAnnualCustomCouponApplied}
                  onChange={(e) => {
                    handleSelectPlan('annual');
                    setCouponInputs(prev => ({ ...prev, annual: e.target.value.toUpperCase() }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAnnualCustomCouponApplied) {
                      e.preventDefault();
                      handleApplyCoupon('annual', couponInputs.annual);
                    }
                  }}
                  style={{
                    flexGrow: 1, padding: '9px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 12.5, textTransform: 'uppercase',
                    letterSpacing: '0.5px', background: isAnnualCustomCouponApplied ? '#F1F5F9' : '#FFFFFF'
                  }}
                />
                {isAnnualCustomCouponApplied ? (
                  <span
                    style={{
                      padding: '8px 14px', borderRadius: 8, background: '#DCFCE7',
                      color: '#15803D', fontSize: 12, fontWeight: 700, border: '1px solid #86EFAC',
                      display: 'flex', alignItems: 'center', gap: 4
                    }}
                  >
                    ✓ Applied
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan('annual');
                      handleApplyCoupon('annual', couponInputs.annual);
                    }}
                    disabled={calcLoading}
                    style={{
                      padding: '8px 16px', borderRadius: 8, background: '#7C3AED',
                      color: '#FFF', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer'
                    }}
                  >
                    {calcLoading && selectedPlan === 'annual' ? 'Checking...' : 'Apply'}
                  </button>
                )}
              </div>

              {/* Dynamic Coupon Status Feedback */}
              {couponStatus.plan === 'annual' && couponStatus.message && (
                <div style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: couponStatus.isSuccess ? '#15803D' : '#DC2626',
                  background: couponStatus.isSuccess ? '#DCFCE7' : '#FEE2E2',
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: couponStatus.isSuccess ? '1px solid #BBF7D0' : '1px solid #FECACA'
                }}>
                  {couponStatus.message}
                </div>
              )}

              {/* UPI & Payment Options Banner */}
              <div style={{
                background: '#FDF4FF',
                border: '1px dashed #E879F9',
                borderRadius: 8,
                padding: '8px 10px',
                marginTop: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: '#6B21A8', fontWeight: 700 }}>
                  <span>⚡ Instant UPI Payment:</span>
                  <span style={{ color: '#16A34A', fontSize: 10.5 }}>✓ Zero Fee</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#5B21B6', background: '#EDE9FE', padding: '2px 6px', borderRadius: 4 }}>PhonePe</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1E40AF', background: '#DBEAFE', padding: '2px 6px', borderRadius: 4 }}>Google Pay</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '2px 6px', borderRadius: 4 }}>Paytm</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: '#15803D', background: '#DCFCE7', padding: '2px 6px', borderRadius: 4 }}>BHIM UPI</span>
                  <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>• Cards / NetBanking</span>
                </div>
              </div>

              {/* Dynamic Razorpay Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckout(false, 'annual');
                }}
                disabled={paymentLoading}
                style={{
                  width: '100%', padding: '14px 18px', borderRadius: 10,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)',
                  color: '#FFF', fontSize: 15, fontWeight: 800,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 8px 20px rgba(124, 58, 237, 0.3)',
                  marginTop: 6
                }}
              >
                {paymentLoading && selectedPlan === 'annual'
                  ? 'Connecting to UPI & Payment...'
                  : `Pay ₹${annualPayable.toLocaleString('en-IN')} for Machine Learning Engineer Internship →`}
              </button>

              {/* Instant Test Checkout */}
              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCheckout(true, 'annual');
                  }}
                  disabled={paymentLoading}
                  style={{
                    background: 'none', border: 'none', color: '#64748B',
                    fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline'
                  }}
                >
                  ⚡ Instant Test Checkout (Simulated)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL: EMAIL OTP VERIFICATION BEFORE PAYMENT GATEWAY */}
      {showOtpModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'rgba(15, 23, 42, 0.72)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 24, maxWidth: 440, width: '100%',
            padding: '32px 26px', border: '1px solid rgba(226, 232, 240, 0.8)',
            boxShadow: '0 25px 65px -12px rgba(15, 23, 42, 0.35)',
            position: 'relative',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowOtpModal(false);
                setOtpError('');
                setOtpSuccessMsg('');
              }}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', color: '#64748B',
                fontSize: 16, transition: 'all 0.15s'
              }}
              title="Close"
            >
              <X size={16} strokeWidth={2.2} />
            </button>

            {/* Shield Icon Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 58, height: 58, borderRadius: 18,
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1.5px solid #C7D2FE',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 10px 22px rgba(79, 70, 229, 0.16)',
                marginBottom: 14
              }}>
                <ShieldCheck size={30} color="#3B82F6" strokeWidth={2.2} />
              </div>
              <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                Verify Registered Email
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                A 6-digit authorization code was sent to your email. Enter it below to unlock payment checkout.
              </p>
            </div>

            {/* Email Confirmation Card */}
            <div style={{
              background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
              border: '1.5px solid #E2E8F0', borderRadius: 14,
              padding: '12px 14px', marginBottom: 14,
              textAlign: 'left',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748B', letterSpacing: '0.06em' }}>
                  Registered Email
                </span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 700, color: '#059669',
                  background: '#ECFDF5', border: '1px solid #A7F3D0',
                  padding: '2px 8px', borderRadius: 999
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  Verified Registration
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: '#EFF6FF', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: '#2563EB', flexShrink: 0
                }}>
                  <Mail size={15} strokeWidth={2.2} />
                </div>
                <input
                  type="email"
                  value={otpEmailInput}
                  onChange={(e) => {
                    setOtpEmailInput(e.target.value);
                    if (otpError) setOtpError('');
                  }}
                  placeholder="name@example.com"
                  style={{
                    flex: 1, border: 'none', background: 'transparent',
                    fontSize: 14, fontWeight: 700, color: '#0F172A',
                    outline: 'none', padding: 0
                  }}
                />
              </div>
            </div>

            {/* Status Notifications: Mutually Exclusive Banner */}
            {otpError ? (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA',
                color: '#B91C1C', padding: '10px 14px', borderRadius: 12,
                fontSize: 12.5, fontWeight: 600, marginBottom: 14,
                display: 'flex', alignItems: 'flex-start', gap: 8,
                textAlign: 'left', lineHeight: 1.45
              }}>
                <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
                <span>{otpError}</span>
              </div>
            ) : otpSuccessMsg ? (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                color: '#065F46', padding: '10px 14px', borderRadius: 12,
                fontSize: 12.5, fontWeight: 600, marginBottom: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                textAlign: 'left', lineHeight: 1.45
              }}>
                <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0 }} />
                <span>{otpSuccessMsg}</span>
              </div>
            ) : null}

            {/* Split 6-Digit OTP Box Grid Form */}
            <form onSubmit={handleVerifyPaymentOtp}>
              <div
                onClick={() => otpInputRef.current?.focus()}
                style={{
                  position: 'relative',
                  margin: '18px 0 14px',
                  cursor: 'text'
                }}
              >
                {/* Hidden input capturing typing, pasting, and mobile number keyboard */}
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCodeInput}
                  onChange={(e) => handleOtpInputChange(e.target.value)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'text',
                    zIndex: 10
                  }}
                />

                <label style={{
                  display: 'block', fontSize: 11, fontWeight: 800,
                  color: '#475569', letterSpacing: '0.08em', textTransform: 'uppercase',
                  marginBottom: 10, textAlign: 'center'
                }}>
                  Enter 6-Digit Code
                </label>

                {/* 6 Visual Digit Cells */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const char = otpCodeInput[index] || '';
                    const isCurrentActive = otpCodeInput.length === index || (otpCodeInput.length === 6 && index === 5);
                    const isFilled = !!char;
                    return (
                      <div
                        key={index}
                        style={{
                          width: 48,
                          height: 56,
                          borderRadius: 12,
                          background: isCurrentActive ? '#FFFFFF' : isFilled ? '#F8FAFC' : '#F8FAFC',
                          border: otpError
                            ? '2px solid #EF4444'
                            : isCurrentActive
                            ? '2px solid #2563EB'
                            : isFilled
                            ? '1.5px solid #94A3B8'
                            : '1.5px solid #CBD5E1',
                          boxShadow: isCurrentActive
                            ? '0 0 0 4px rgba(37, 99, 235, 0.12), 0 2px 8px rgba(37, 99, 235, 0.08)'
                            : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                          fontWeight: 800,
                          color: '#0F172A',
                          fontFamily: "'Courier New', monospace, sans-serif",
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {char ? (
                          char
                        ) : isCurrentActive ? (
                          <span style={{
                            display: 'inline-block',
                            width: 2,
                            height: 22,
                            background: '#2563EB',
                            borderRadius: 1
                          }} />
                        ) : (
                          <span style={{ color: '#CBD5E1', fontSize: 16 }}>•</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Countdown / Resend Option */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '12px 0 22px',
                fontSize: 12.5
              }}>
                <span style={{ color: '#64748B', fontWeight: 500 }}>Didn't receive code?</span>
                {otpTimer > 0 ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    color: '#2563EB', fontWeight: 700, background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    padding: '4px 10px', borderRadius: 8, fontSize: 12
                  }}>
                    <Clock size={13} strokeWidth={2.2} />
                    <span>Resend in {otpTimer}s</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => sendPaymentOtp(otpEmailInput, lead?.name, pendingCheckout?.targetPlan || selectedPlan)}
                    disabled={otpLoading}
                    style={{
                      background: 'none', border: 'none', color: '#2563EB',
                      fontWeight: 700, cursor: 'pointer', padding: 0,
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      fontSize: 12.5
                    }}
                  >
                    <RefreshCw size={13} strokeWidth={2.2} className={otpLoading ? 'spin-anim' : ''} />
                    <span>Resend Code Now</span>
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpError('');
                    setOtpSuccessMsg('');
                  }}
                  style={{
                    flex: 1, padding: '13px 16px', borderRadius: 12,
                    background: '#F1F5F9', color: '#475569',
                    fontWeight: 700, border: '1px solid #E2E8F0',
                    cursor: 'pointer', fontSize: 13.5,
                    transition: 'all 0.15s'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otpCodeInput.length !== 6}
                  style={{
                    flex: 2, padding: '13px 18px', borderRadius: 12,
                    background: (otpLoading || otpCodeInput.length !== 6)
                      ? '#E2E8F0'
                      : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: (otpLoading || otpCodeInput.length !== 6) ? '#94A3B8' : '#FFFFFF',
                    fontWeight: 800, border: 'none',
                    cursor: (otpLoading || otpCodeInput.length !== 6) ? 'not-allowed' : 'pointer',
                    fontSize: 13.5, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                    boxShadow: (otpLoading || otpCodeInput.length !== 6)
                      ? 'none'
                      : '0 8px 20px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {otpLoading ? (
                    <>
                      <div style={{
                        width: 15, height: 15, border: '2px solid rgba(255,255,255,0.4)',
                        borderTopColor: '#FFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite'
                      }} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Proceed to Pay</span>
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Trust Footer */}
            <div style={{
              marginTop: 18, paddingTop: 14,
              borderTop: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontSize: 11.5, color: '#94A3B8', fontWeight: 600
            }}>
              <Lock size={12} strokeWidth={2.2} color="#64748B" />
              <span>Protected by 256-Bit SSL Encrypted Verification</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WEEKLY SPRINT PREREQUISITE GATE FOR FIRST-TIME ENROLLMENT */}
      {showWeeklyGateModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'rgba(15, 23, 42, 0.76)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 24, maxWidth: 500, width: '100%',
            padding: '34px 28px', border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow: '0 25px 65px -12px rgba(15, 23, 42, 0.35)', position: 'relative'
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowWeeklyGateModal(false)}
              style={{
                position: 'absolute', top: 18, right: 18, background: '#F1F5F9',
                border: 'none', width: 34, height: 34, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748B'
              }}
            >
              <X size={18} />
            </button>

            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
              border: '1.5px solid #BFDBFE',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563EB', margin: '0 auto 18px',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.15)'
            }}>
              <Lock size={26} color="#2563EB" strokeWidth={2.4} />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#2563EB', background: '#EFF6FF',
                border: '1px solid #BFDBFE', padding: '3px 10px', borderRadius: 12,
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                Sprint-First Learning Policy
              </span>
              <h3 style={{ fontSize: 22, fontWeight: 850, color: '#0F172A', margin: '10px 0 6px', lineHeight: 1.3 }}>
                Start with Week 1 Sprint First
              </h3>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55, margin: '0 auto', maxWidth: 420 }}>
                To guarantee student success, Levlox requires all new members to first experience <strong>Week 1 (7-Day Sprint for ₹99)</strong>. Once you try Week 1, the full <strong>1-Year Machine Learning Engineer Internship</strong> unlocks in your portal!
              </p>
            </div>

            {/* 2-Step Progression Visual */}
            <div style={{
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 14,
              padding: '14px 16px', marginBottom: 22, display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#2563EB', color: '#FFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0
                }}>
                  1
                </div>
                <div style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>
                  <span style={{ color: '#2563EB', fontWeight: 800 }}>Week 1 Sprint (₹99):</span> Hands-on Python, ML, SQL &amp; capstone projects.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', background: '#EDE9FE', color: '#7C3AED',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0
                }}>
                  2
                </div>
                <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
                  <span style={{ color: '#7C3AED', fontWeight: 800 }}>Yearly Internship Upgrade:</span> Unlocks seamlessly in your dashboard!
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                setShowWeeklyGateModal(false);
                handleSelectPlan('weekly');
                handleCheckout(false, 'weekly');
              }}
              style={{
                width: '100%', padding: '13px 18px', borderRadius: 10,
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFF', fontSize: 14.5, fontWeight: 800, border: 'none',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 8, boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
              }}
            >
              Unlock Week 1 Sprint for ₹99 Now →
            </button>
          </div>
        </div>
      )}

      {/* MODAL: PROSPECTIVE STUDENT SIGNUP & REGISTRATION BEFORE PAYMENT */}
      {showLeadModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(16, 27, 51, 0.65)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, maxWidth: 470, width: '100%',
            padding: '32px 28px', border: '1px solid #E3E9F4',
            boxShadow: '0 25px 50px rgba(16, 27, 51, 0.25)',
            position: 'relative'
          }}>
            {/* Step Indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#EFF6FF', color: '#2563EB',
              padding: '4px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.5px', marginBottom: 12
            }}>
              <User size={13} strokeWidth={2.4} /> Step 1 of 2 &bull; Student Registration
            </div>

            <h3 style={{ fontSize: 21, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Create Your Portal Account
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 18px', lineHeight: 1.5 }}>
              Register your student details below. We'll verify your email via a 6-digit OTP before unlocking payment checkout.
            </p>

            {modalError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#E11D48', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalLeadSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Full Name *</label>
                <input
                  type="text" required placeholder="e.g. Hariharan M"
                  value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Email Address *</label>
                <input
                  type="email" required placeholder="name@example.com"
                  value={modalForm.email} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Mobile Number *</label>
                <input
                  type="tel" required placeholder="e.g. 9876543210"
                  value={modalForm.phone} onChange={(e) => setModalForm({ ...modalForm, phone: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>User Type *</label>
                <select
                  value={modalForm.userType} onChange={(e) => setModalForm({ ...modalForm, userType: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                >
                  <option value="student">Student</option>
                  <option value="working_professional">Working Professional</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Create Password *</label>
                  <input
                    type="password" required minLength={6} placeholder="Min 6 chars"
                    value={modalForm.password} onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>Confirm Password *</label>
                  <input
                    type="password" required minLength={6} placeholder="Repeat password"
                    value={modalForm.confirmPassword} onChange={(e) => setModalForm({ ...modalForm, confirmPassword: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, background: '#F8FAFD', border: '1px solid #CBD5E1', color: '#101B33', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button" onClick={() => setShowLeadModal(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 8, background: '#FFFFFF', color: '#64748B', border: '1px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={modalLoading}
                  style={{
                    flex: 2, padding: '11px', borderRadius: 8,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFF', fontWeight: 700, border: 'none', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {modalLoading ? 'Registering...' : 'Register & Verify Email (OTP) →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT VERIFIED & MEMBERSHIP ACTIVATION MODAL (STEPS 8 & 9) */}
      {paymentSuccessData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(16, 27, 51, 0.7)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, maxWidth: 520, width: '100%',
            padding: '36px 30px', border: '1px solid #E3E9F4',
            boxShadow: '0 25px 50px rgba(16, 27, 51, 0.2)', textAlign: 'center'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px'
            }}>
              <CheckCircle size={36} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#101B33', margin: '0 0 8px' }}>
              Membership Activated! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
              Your <strong>{paymentSuccessData.planName}</strong> has been successfully confirmed and your portal login account is now active.
            </p>

            <div style={{ background: '#F8FAFD', padding: 18, borderRadius: 12, textAlign: 'left', marginBottom: 24, border: '1px solid #E3E9F4' }}>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Student / Roll ID:</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#4568F5', marginBottom: 12 }}>{paymentSuccessData.studentId}</div>

              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Invoice Number:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#101B33', marginBottom: 12 }}>{paymentSuccessData.invoiceNumber}</div>

              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>Registered Email:</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#101B33' }}>{paymentSuccessData.email}</div>
            </div>

            <div style={{ background: '#EEF2FE', padding: '12px 16px', borderRadius: 10, fontSize: 13, color: '#4568F5', marginBottom: 16, border: '1px solid #C7D4FD' }}>
              ✉️ Your login credentials and invoice have been dispatched to your email address.
            </div>

            {/* LAPTOP ACCESS NOTICE */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 12,
              padding: '12px 16px',
              textAlign: 'left',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <Laptop size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#991B1B', marginBottom: 2 }}>
                  Laptop Access Required for Student Portal
                </strong>
                <span style={{ fontSize: 12, color: '#B91C1C', lineHeight: 1.45, display: 'block' }}>
                  Your student dashboard, live classes, DRM videos, and assignments are exclusively supported on laptop and desktop computers. Please open your laptop browser to log in with your credentials.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                navigate('/login');
              }}
              style={{
                width: '100%', padding: '14px 20px', borderRadius: 10,
                background: 'linear-gradient(135deg, #4568F5 0%, #3554D8 100%)',
                color: '#FFF', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(69, 104, 245, 0.35)'
              }}
            >
              Proceed to Student Login →
            </button>
          </div>
        </div>
      )}

      {/* TESTIMONIAL VIDEO PLAYER MODAL */}
      {activeVideoModal && (
        <div
          onClick={() => setActiveVideoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 120,
            background: 'rgba(10, 15, 30, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 22,
              maxWidth: testimonialVideoOrientation === 'portrait' ? 430 : 720,
              width: '100%',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 70px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              position: 'relative',
              transition: 'max-width 0.25s ease'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: '1px solid #E2E8F0',
              background: '#FFFFFF',
              flexShrink: 0,
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0 }}>
                {/* Student Avatar Initial */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontSize: 16,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 3px 10px rgba(37, 99, 235, 0.28)'
                }}>
                  {activeVideoModal.studentName ? activeVideoModal.studentName.charAt(0).toUpperCase() : 'L'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      letterSpacing: '-0.3px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {activeVideoModal.studentName}
                    </h3>
                    <ShieldCheck size={16} color="#10B981" style={{ flexShrink: 0 }} />
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 3
                  }}>
                    {activeVideoModal.role && (
                      <span style={{
                        fontSize: 11,
                        color: '#2563EB',
                        fontWeight: 700,
                        background: '#EFF6FF',
                        border: '1px solid #DBEAFE',
                        padding: '1.5px 7px',
                        borderRadius: 4
                      }}>
                        {activeVideoModal.role}
                      </span>
                    )}

                    {/* Star Rating */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      {[...Array(5)].map((_, si) => (
                        <span
                          key={si}
                          style={{
                            color: si < (activeVideoModal.rating || 5) ? '#F59E0B' : '#E2E8F0',
                            fontSize: 12,
                            lineHeight: 1
                          }}
                        >
                          ★
                        </span>
                      ))}
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginLeft: 2 }}>
                        {(activeVideoModal.rating || 5)}.0
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons (LinkedIn & Close) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {activeVideoModal.linkedinUrl && (
                  <a
                    href={activeVideoModal.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0A66C2',
                      background: '#EDF3F8',
                      padding: '5px 10px',
                      borderRadius: 6,
                      textDecoration: 'none',
                      border: '1px solid #D0E1F0'
                    }}
                  >
                    <svg fill="#0A66C2" viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
                    </svg>
                    <span>LinkedIn</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setActiveVideoModal(null)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    color: '#475569'
                  }}
                  aria-label="Close modal"
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>
            </div>

            {/* Video Player Container */}
            <div style={{
              position: 'relative',
              width: '100%',
              background: '#090D16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              ...(testimonialVideoOrientation === 'portrait'
                ? { height: 'min(62vh, 520px)' }
                : { paddingBottom: '56.25%', height: 0 }
              )
            }}>
              {/* Subtle ambient blurred glow */}
              {(() => {
                const glowThumb = getResolvedThumbnail(activeVideoModal.videoUrl, activeVideoModal.thumbnailUrl);
                if (!glowThumb) return null;
                return (
                  <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    backgroundImage: `url(${glowThumb})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(30px) brightness(0.35)',
                    opacity: 0.7,
                    pointerEvents: 'none'
                  }} />
                );
              })()}

              {getEmbedUrl(activeVideoModal.videoUrl).includes('youtube.com/embed') || getEmbedUrl(activeVideoModal.videoUrl).includes('drive.google.com') ? (
                <iframe
                  src={getEmbedUrl(activeVideoModal.videoUrl)}
                  title={activeVideoModal.studentName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: testimonialVideoOrientation === 'portrait' ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    zIndex: 1
                  }}
                />
              ) : (
                <video
                  src={activeVideoModal.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    const w = e.target.videoWidth;
                    const h = e.target.videoHeight;
                    if (w && h) {
                      setTestimonialVideoOrientation(h >= w ? 'portrait' : 'landscape');
                    }
                  }}
                  style={{
                    position: testimonialVideoOrientation === 'portrait' ? 'relative' : 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    zIndex: 1,
                    maxHeight: testimonialVideoOrientation === 'portrait' ? 'min(62vh, 520px)' : 'none'
                  }}
                />
              )}
            </div>

            {/* Student Feedback Quote under Video in Modal */}
            {activeVideoModal.feedback && (
              <div style={{
                padding: '14px 18px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                overflowY: 'auto',
                maxHeight: '120px'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{ fontSize: 20, lineHeight: 1, color: '#2563EB', fontWeight: 800, flexShrink: 0 }}>“</span>
                  <p style={{
                    margin: 0,
                    fontSize: 12.5,
                    color: '#334155',
                    lineHeight: 1.5,
                    fontStyle: 'normal',
                    fontWeight: 500
                  }}>
                    {activeVideoModal.feedback}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 6,
                  borderTop: '1px solid #EDF2F7',
                  fontSize: 11,
                  color: '#64748B'
                }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: '#059669' }}>
                    <CheckCircle2 size={13} color="#059669" />
                    Verified Career Review
                  </span>
                  <span style={{ fontWeight: 600, color: '#64748B' }}>
                    Levlox Academy Alumni
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INDUSTRIAL PROJECT VIDEO MODAL */}
      {selectedProjectVideoModal && (
        <div
          onClick={() => setSelectedProjectVideoModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 130,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 14
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 18,
              maxWidth: 720,
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E2E8F0',
              background: '#FFFFFF',
              flexShrink: 0,
              gap: 12
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#2563EB',
                    background: '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {selectedProjectVideoModal.categoryLabel || 'Industrial Project'}
                  </span>
                  {selectedProjectVideoModal.worth && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#047857',
                      background: '#ECFDF5',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}>
                      Worth {selectedProjectVideoModal.worth}
                    </span>
                  )}
                </div>
                <h3 style={{
                  fontSize: 16.5,
                  fontWeight: 800,
                  color: '#0F172A',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {selectedProjectVideoModal.name}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProjectVideoModal(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  color: '#475569'
                }}
                aria-label="Close modal"
              >
                <X size={17} strokeWidth={2.4} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%',
              background: '#0F172A',
              flexShrink: 0
            }}>
              {getEmbedUrl(selectedProjectVideoModal.videoUrl).includes('youtube') ||
              getEmbedUrl(selectedProjectVideoModal.videoUrl).includes('drive.google.com') ||
              getEmbedUrl(selectedProjectVideoModal.videoUrl).includes('vimeo') ? (
                <iframe
                  src={getEmbedUrl(selectedProjectVideoModal.videoUrl)}
                  title={selectedProjectVideoModal.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              ) : (
                <video
                  src={selectedProjectVideoModal.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              )}
            </div>

            {/* Project Outcome Footer */}
            {selectedProjectVideoModal.outcome && (
              <div style={{
                padding: '14px 20px',
                background: '#F8FAFC',
                borderTop: '1px solid #E2E8F0',
                fontSize: 12.5,
                color: '#334155',
                lineHeight: 1.5
              }}>
                <strong style={{ color: '#0F172A' }}>Industry Deliverable: </strong>
                {selectedProjectVideoModal.outcome}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 960,
              width: '100%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
          >
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                  {lightboxImg.title}
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                  {lightboxImg.desc}
                </p>
              </div>
              <button
                onClick={() => setLightboxImg(null)}
                style={{
                  background: '#E2E8F0',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#475569',
                  transition: 'background 0.15s ease'
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 12, overflowY: 'auto', background: '#0F172A', display: 'flex', justifyContent: 'center' }}>
              <img
                src={lightboxImg.src}
                alt={lightboxImg.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: 8
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #E3E9F4', background: '#FFFFFF', padding: '30px 24px', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
        <p style={{ margin: '0 0 6px' }}>&copy; {new Date().getFullYear()} Levlox Academy &bull; Intelligent Learning Experience Platform</p>
        <p style={{ margin: 0 }}>Support inquiries: <a href="mailto:sales@levlox.in" style={{ color: '#4568F5', textDecoration: 'none' }}>sales@levlox.in</a></p>
      </footer>

    </div>
  );
}

