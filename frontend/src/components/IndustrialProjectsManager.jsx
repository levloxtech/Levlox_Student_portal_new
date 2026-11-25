import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2, Video, Image as ImageIcon, Plus, Pencil, Check,
  X, Play, Upload, ExternalLink, RefreshCw, AlertCircle, Eye,
  Tag, Layers, Sparkles, Trash2, ArrowUpRight, Briefcase
} from 'lucide-react';
import {
  getIndustrialProjects,
  updateIndustrialProject,
  getPortfolioProjects,
  updatePortfolioProject
} from '../services/firebaseService';
import { uploadUniversalFile } from '../services/apiService';
import {
  getEmbedVideoUrl as utilGetEmbedVideoUrl,
  getVideoSourceType,
  getGoogleDriveFileId
} from '../utils/videoUtils';

const DEFAULT_INDUSTRIAL_PROJECTS = [
  {
    id: 'proj_py_1',
    category: 'python',
    categoryLabel: 'Python Projects',
    name: 'Login & Multi-Role Authentication System',
    worth: '₹8,500',
    tags: ['Python', 'JWT & Bcrypt', 'File I/O', 'RBAC'],
    outcome: 'Role-based access control, cryptographic password hashing, session tokens, and automated audit logs.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 1
  },
  {
    id: 'proj_py_2',
    category: 'python',
    categoryLabel: 'Python Projects',
    name: 'Smart Retail Billing & Invoicing System',
    worth: '₹9,500',
    tags: ['Python', 'ReportLab Engine', 'CSV / JSON', 'Tax Logic'],
    outcome: 'Dynamic invoice calculation with multi-tier GST logic, barcode lookup, inventory checks, and PDF exports.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 2
  },
  {
    id: 'proj_py_3',
    category: 'python',
    categoryLabel: 'Python Projects',
    name: 'Student Attendance Management Platform',
    worth: '₹9,000',
    tags: ['Python', 'Pandas', 'CSV / JSON', 'Alerts'],
    outcome: 'Daily class batch tracker, absenteeism anomaly flags, attendance percentiles, and CSV export reports.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 3
  },
  {
    id: 'proj_ml_1',
    category: 'ml',
    categoryLabel: 'Machine Learning',
    name: 'Used Car Price Prediction Engine',
    worth: '₹12,500',
    tags: ['Scikit-Learn', 'Pandas', 'Random Forest', 'FastAPI'],
    outcome: 'Regression modeling on multi-attribute real-world automobile pricing datasets with feature pipelines.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 1
  },
  {
    id: 'proj_ml_2',
    category: 'ml',
    categoryLabel: 'Machine Learning',
    name: 'Financial Market Trend Forecasting',
    worth: '₹14,000',
    tags: ['Time Series', 'ARIMA', 'Rolling Windows', 'Matplotlib'],
    outcome: 'Historical pattern recognition, rolling window volatility modeling, and predictive price trajectories.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 2
  },
  {
    id: 'proj_ml_3',
    category: 'ml',
    categoryLabel: 'Machine Learning',
    name: 'Customer Review Sentiment Analysis',
    worth: '₹11,500',
    tags: ['NLP', 'TF-IDF', 'Logistic Regression', 'NLTK'],
    outcome: 'Text tokenization, sentiment classification on user feedback, and consumer opinion categorization.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 3
  },
  {
    id: 'proj_sql_1',
    category: 'sql',
    categoryLabel: 'SQL Projects',
    name: 'Retail Enterprise Data Analysis',
    worth: '₹11,000',
    tags: ['PostgreSQL', 'Window Functions', 'Aggregate Joins'],
    outcome: 'Multi-store monthly revenue trends, customer lifetime value metrics, and product basket analysis.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 1
  },
  {
    id: 'proj_sql_2',
    category: 'sql',
    categoryLabel: 'SQL Projects',
    name: 'UI-Driven Database Management Interface',
    worth: '₹10,500',
    tags: ['SQL', 'CRUD Architecture', 'Triggers', 'Indexing'],
    outcome: 'Dynamic form submission handling, schema integrity constraints, and automated database table indexing.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 2
  },
  {
    id: 'proj_sql_3',
    category: 'sql',
    categoryLabel: 'SQL Projects',
    name: 'Customer Cohort & Retention Analysis',
    worth: '₹13,500',
    tags: ['Advanced SQL', 'Cohort Curves', 'CTEs', 'Windowing'],
    outcome: 'Month-over-month user retention matrices, churn risk factors, and behavioral cohort segmentation analysis.',
    thumbnailUrl: '',
    videoUrl: '',
    order: 3
  }
];

const DEFAULT_PORTFOLIO_PROJECTS = [
  {
    id: 'portfolio_1',
    name: 'Customer Churn Prediction Engine',
    tech: 'Python, Pandas, XGBoost, Scikit-Learn',
    outcome: 'Identify high-risk churn customers with 92%+ precision, delivering retention insights.',
    value: '₹12,000',
    thumbnailUrl: '',
    videoUrl: '',
    order: 1
  },
  {
    id: 'portfolio_2',
    name: 'Public Transportation Crowding Forecast',
    tech: 'Python, Docker, MySQL, SQLAlchemy, Scikit-Learn, Random Forest',
    outcome: 'Predict commuter volume and transit route crowding across peak hours using containerized Random Forest models and relational database telemetry.',
    value: '₹14,000',
    thumbnailUrl: '',
    videoUrl: '',
    order: 2
  },
  {
    id: 'portfolio_3',
    name: 'Hyper-Local Food Delivery Time Estimator',
    tech: 'Machine Learning, Feature Pipeline, APIs',
    outcome: 'Predict real-time delivery turnaround incorporating weather, distance, and preparation latency.',
    value: '₹15,000',
    thumbnailUrl: '',
    videoUrl: '',
    order: 3
  },
  {
    id: 'portfolio_4',
    name: 'Full-Stack Billing System with Payment Integration',
    tech: 'Python, SQL, Razorpay API, PDF Invoicing',
    outcome: 'Production-ready billing software handling dynamic checkout, secure signatures, and receipts.',
    value: '₹16,000',
    thumbnailUrl: '',
    videoUrl: '',
    order: 4
  }
];

// Helper to format Google Drive / YouTube / Vimeo embeds or direct video URLs
export const getEmbedVideoUrl = (rawUrl) => {
  return utilGetEmbedVideoUrl(rawUrl);
};

export const isEmbeddableVideo = (url) => {
  if (!url) return false;
  const srcType = getVideoSourceType(url);
  return srcType === 'drive' || srcType === 'youtube' || srcType === 'vimeo';
};

const IndustrialProjectsManager = ({ initialSection = 'industrial' }) => {
  const queryClient = useQueryClient();

  // Active Main Section: 'industrial' | 'portfolio'
  const [activeSection, setActiveSection] = useState(initialSection);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  // Query Industrial Projects
  const { data: dbIndustrial = [], refetch: refetchIndustrial } = useQuery({
    queryKey: ['industrialProjects'],
    queryFn: async () => {
      const res = await getIndustrialProjects().catch(() => []);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEFAULT_INDUSTRIAL_PROJECTS;
    },
    staleTime: 1000 * 30,
  });

  const industrialProjects = useMemo(() => {
    if (dbIndustrial && dbIndustrial.length > 0) {
      const map = new Map(dbIndustrial.map(p => [p.id, p]));
      return DEFAULT_INDUSTRIAL_PROJECTS.map(def => {
        const found = map.get(def.id);
        return found ? { ...def, ...found } : def;
      });
    }
    return DEFAULT_INDUSTRIAL_PROJECTS;
  }, [dbIndustrial]);

  // Query Portfolio Projects
  const { data: dbPortfolio = [], refetch: refetchPortfolio } = useQuery({
    queryKey: ['portfolioProjects'],
    queryFn: async () => {
      const res = await getPortfolioProjects().catch(() => []);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEFAULT_PORTFOLIO_PROJECTS;
    },
    staleTime: 1000 * 30,
  });

  const portfolioProjects = useMemo(() => {
    if (dbPortfolio && dbPortfolio.length > 0) {
      const map = new Map(dbPortfolio.map(p => [p.id, p]));
      return DEFAULT_PORTFOLIO_PROJECTS.map(def => {
        const found = map.get(def.id);
        return found ? { ...def, ...found } : def;
      });
    }
    return DEFAULT_PORTFOLIO_PROJECTS;
  }, [dbPortfolio]);

  const [activeCategory, setActiveCategory] = useState('all');

  // Edit/Upload Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [editingType, setEditingType] = useState('industrial'); // 'industrial' | 'portfolio'
  const [formName, setFormName] = useState('');
  const [formWorth, setFormWorth] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [showExternalVideo, setShowExternalVideo] = useState(false);
  const [showExternalThumbnail, setShowExternalThumbnail] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Video Preview Modal (for testing playback)
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  // Toast State
  const [toast, setToast] = useState('');
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // Open modal for project
  const handleOpenEdit = (p, type = 'industrial') => {
    setEditingProject(p);
    setEditingType(type);
    setFormName(p.name || '');
    setFormWorth(type === 'portfolio' ? (p.value || p.worth || '') : (p.worth || ''));
    setFormTags(type === 'portfolio'
      ? (p.tech || (Array.isArray(p.tags) ? p.tags.join(', ') : ''))
      : (Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''))
    );
    setFormOutcome(p.outcome || '');
    setFormThumbnailUrl(p.thumbnailUrl || '');
    setFormVideoUrl(p.videoUrl || '');
    setShowExternalVideo(false);
    setShowExternalThumbnail(false);
    setVideoUploadProgress(0);
    setErrorMessage('');
  };

  // Upload Thumbnail Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsUploadingImage(true);
      const res = await uploadUniversalFile(file, `${editingType}-projects/thumbnails`);
      if (res?.url) {
        setFormThumbnailUrl(res.url);
        showToast('Thumbnail uploaded successfully!');
      }
    } catch (err) {
      console.error('[Upload] Image upload failed:', err);
      alert('Image upload failed: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Upload Video Handler
  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    try {
      setIsUploadingVideo(true);
      setVideoUploadProgress(0);
      const res = await uploadUniversalFile(file, `${editingType}-projects/videos`, (pct) => {
        setVideoUploadProgress(pct);
      });
      if (res?.url) {
        setFormVideoUrl(res.url);
        showToast('Project video uploaded to server successfully!');
      }
    } catch (err) {
      console.error('[Upload] Video upload failed:', err);
      alert('Video upload failed: ' + err.message);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
    }
  };

  // Save Project Handler
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    // When adding a video, a thumbnail image is required as the cover
    if (formVideoUrl.trim() && !formThumbnailUrl.trim()) {
      setErrorMessage('A thumbnail image is required when adding a video, so the project card has a cover image. Please upload a thumbnail image.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      if (editingType === 'portfolio') {
        const payload = {
          name: formName.trim(),
          value: formWorth.trim(),
          tech: formTags.trim(),
          outcome: formOutcome.trim(),
          thumbnailUrl: formThumbnailUrl.trim(),
          videoUrl: formVideoUrl.trim(),
          updatedAt: new Date().toISOString()
        };

        await updatePortfolioProject(editingProject.id, payload);
        await queryClient.invalidateQueries({ queryKey: ['portfolioProjects'] });
        await refetchPortfolio();
      } else {
        const tagsArray = formTags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);

        const payload = {
          name: formName.trim(),
          worth: formWorth.trim(),
          tags: tagsArray,
          outcome: formOutcome.trim(),
          thumbnailUrl: formThumbnailUrl.trim(),
          videoUrl: formVideoUrl.trim(),
          updatedAt: new Date().toISOString()
        };

        await updateIndustrialProject(editingProject.id, payload);
        await queryClient.invalidateQueries({ queryKey: ['industrialProjects'] });
        await refetchIndustrial();
      }

      await queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
      showToast(`Project "${formName}" updated successfully!`);
      setEditingProject(null);
    } catch (err) {
      console.error('[ProjectsManager] Update error:', err);
      setErrorMessage(err.message || 'Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredIndustrial = useMemo(() => {
    if (activeCategory === 'all') return industrialProjects;
    return industrialProjects.filter(p => p.category === activeCategory);
  }, [industrialProjects, activeCategory]);

  const categories = [
    { key: 'all', label: `All Projects (${industrialProjects.length})`, color: '#6C3CF0', bg: '#F5F3FF' },
    { key: 'python', label: 'Python Projects (3)', color: '#2563EB', bg: '#EFF6FF' },
    { key: 'ml', label: 'Machine Learning (3)', color: '#7C3AED', bg: '#F5F3FF' },
    { key: 'sql', label: 'SQL Projects (3)', color: '#059669', bg: '#ECFDF5' }
  ];

  return (
    <div style={{ paddingBottom: 40 }} className="animate-fade-in">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 22px',
          borderRadius: 14,
          fontSize: 13.5,
          fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #334155'
        }}>
          <Check size={16} color="#10B981" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Segmented Navigation Switcher */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '6px',
        border: '1.5px solid #E2E8F0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 20
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('industrial')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeSection === 'industrial' ? '#6C3CF0' : 'transparent',
            color: activeSection === 'industrial' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.2s ease',
            boxShadow: activeSection === 'industrial' ? '0 4px 12px rgba(108, 60, 240, 0.28)' : 'none'
          }}
        >
          <FolderGit2 size={16} />
          <span>Industrial Experience ({industrialProjects.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('portfolio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 800,
            cursor: 'pointer',
            border: 'none',
            background: activeSection === 'portfolio' ? '#D97706' : 'transparent',
            color: activeSection === 'portfolio' ? '#FFFFFF' : '#64748B',
            transition: 'all 0.2s ease',
            boxShadow: activeSection === 'portfolio' ? '0 4px 12px rgba(217, 119, 6, 0.28)' : 'none'
          }}
        >
          <Briefcase size={16} />
          <span>Portfolio Projects ({portfolioProjects.length})</span>
        </button>
      </div>

      {/* Header Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1.5px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: activeSection === 'portfolio' ? '#FEF3C7' : '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: activeSection === 'portfolio' ? '#D97706' : '#6C3CF0',
            border: activeSection === 'portfolio' ? '1.5px solid #FDE68A' : '1.5px solid #DDD6FE'
          }}>
            {activeSection === 'portfolio' ? <Briefcase size={24} /> : <FolderGit2 size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {activeSection === 'portfolio'
                  ? 'Industry-Level & Portfolio Projects'
                  : 'Industrial Projects Experience'}
              </h1>
              <span style={{
                background: activeSection === 'portfolio' ? '#FEF3C7' : '#EDE9FE',
                color: activeSection === 'portfolio' ? '#D97706' : '#6C3CF0',
                fontSize: 12,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 999
              }}>
                {activeSection === 'portfolio' ? `${portfolioProjects.length} Portfolio Assets` : `${industrialProjects.length} Capstones`}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              {activeSection === 'portfolio'
                ? 'Upload project video walkthroughs, thumbnail images, and manage tech stack for high-value portfolio assets.'
                : 'Upload video walkthroughs, thumbnail images, and manage details for student portfolio capstone projects.'}
            </p>
          </div>
        </div>

        {/* Quick Instructions badge */}
        <div style={{
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          padding: '8px 14px',
          borderRadius: 12,
          fontSize: 12,
          color: '#475569',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <Sparkles size={14} color={activeSection === 'portfolio' ? '#D97706' : '#6C3CF0'} />
          <span>Click any project to upload its video demo or thumbnail</span>
        </div>
      </div>

      {/* SECTION 1: INDUSTRIAL EXPERIENCE PROJECTS */}
      {activeSection === 'industrial' && (
        <>
          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 24
          }}>
            {categories.map((c) => {
              const isActive = activeCategory === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setActiveCategory(c.key)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 750,
                    cursor: 'pointer',
                    border: isActive ? `1.5px solid ${c.color}` : '1.5px solid #E2E8F0',
                    background: isActive ? c.bg : '#FFFFFF',
                    color: isActive ? c.color : '#475569',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none'
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Industrial Projects Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20
          }}>
            {filteredIndustrial.map((p) => {
              const isPython = p.category === 'python';
              const isML = p.category === 'ml';
              const categoryColor = isPython ? '#2563EB' : isML ? '#7C3AED' : '#059669';
              const categoryBg = isPython ? '#EFF6FF' : isML ? '#F5F3FF' : '#ECFDF5';
              const categoryBorder = isPython ? '#BFDBFE' : isML ? '#DDD6FE' : '#A7F3D0';

              return (
                <div
                  key={p.id}
                  onClick={() => handleOpenEdit(p, 'industrial')}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 18,
                    border: '1.5px solid #E2E8F0',
                    borderLeft: `4px solid ${categoryColor}`,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                  }}
                >
                  <div>
                    {/* Project Cover Thumbnail Preview */}
                    {p.thumbnailUrl && (
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '52%',
                        borderRadius: 12,
                        overflow: 'hidden',
                        marginBottom: 12,
                        background: '#0F172A',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                      }}>
                        <img
                          src={p.thumbnailUrl}
                          alt={p.name}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        {p.videoUrl && (
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: '#2563EB',
                              color: '#FFFFFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.5)'
                            }}>
                              <Play size={15} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Header: Title & Worth Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <div>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: categoryColor,
                          background: categoryBg,
                          border: `1px solid ${categoryBorder}`,
                          padding: '2px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                          display: 'inline-block',
                          marginBottom: 6
                        }}>
                          {p.categoryLabel || 'Industrial Project'}
                        </span>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.35 }}>
                          {p.name}
                        </h3>
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#059669',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '3px 10px',
                        borderRadius: 8,
                        whiteSpace: 'nowrap'
                      }}>
                        Worth {p.worth}
                      </span>
                    </div>

                    {/* Tags */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '10px 0 14px' }}>
                      {(p.tags || []).map((t, idx) => (
                        <span key={idx} style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#475569',
                          background: '#F1F5F9',
                          padding: '2px 8px',
                          borderRadius: 6
                        }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Deliverable Outcome */}
                    <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
                      {p.outcome}
                    </p>
                  </div>

                  {/* Media Status Pill Badges */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 14,
                    borderTop: '1px solid #F1F5F9'
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: p.thumbnailUrl ? '#ECFDF5' : '#F1F5F9',
                        color: p.thumbnailUrl ? '#059669' : '#94A3B8'
                      }}>
                        <ImageIcon size={12} />
                        {p.thumbnailUrl ? 'Image Added' : 'No Image'}
                      </span>

                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: p.videoUrl ? '#EFF6FF' : '#F1F5F9',
                        color: p.videoUrl ? '#2563EB' : '#94A3B8'
                      }}>
                        <Video size={12} />
                        {p.videoUrl ? 'Video Ready' : 'No Video'}
                      </span>
                    </div>

                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#6C3CF0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      Edit / Upload <Pencil size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* SECTION 2: INDUSTRY-LEVEL & PORTFOLIO PROJECTS */}
      {activeSection === 'portfolio' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20
        }}>
          {portfolioProjects.map((proj, idx) => (
            <div
              key={proj.id}
              onClick={() => handleOpenEdit(proj, 'portfolio')}
              style={{
                background: '#FFFFFF',
                borderRadius: 18,
                border: '1.5px solid #E2E8F0',
                borderLeft: '4px solid #D97706',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
              }}
            >
              <div>
                {/* Project Cover Thumbnail Preview */}
                {proj.thumbnailUrl && (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '52%',
                    borderRadius: 12,
                    overflow: 'hidden',
                    marginBottom: 12,
                    background: '#0F172A',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <img
                      src={proj.thumbnailUrl}
                      alt={proj.name}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {proj.videoUrl && (
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.5)'
                        }}>
                          <Play size={15} fill="#FFFFFF" style={{ marginLeft: 2 }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Header: Portfolio Badge & Worth */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#D97706',
                    background: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    padding: '3px 9px',
                    borderRadius: 6
                  }}>
                    PORTFOLIO #{idx + 1}
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#059669',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 10px',
                    borderRadius: 8
                  }}>
                    {proj.value || '₹12,000'}
                  </span>
                </div>

                <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', lineHeight: 1.35 }}>
                  {proj.name}
                </h3>

                {/* Tech Stack */}
                <div style={{
                  fontSize: 12,
                  color: '#475569',
                  marginBottom: 10,
                  background: '#F8FAFC',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #E2E8F0'
                }}>
                  <strong style={{ color: '#0F172A' }}>Tech Stack: </strong>
                  {proj.tech}
                </div>

                {/* Outcome */}
                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
                  {proj.outcome}
                </p>
              </div>

              {/* Media Status Pill Badges */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 14,
                borderTop: '1px solid #F1F5F9'
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: proj.thumbnailUrl ? '#ECFDF5' : '#F1F5F9',
                    color: proj.thumbnailUrl ? '#059669' : '#94A3B8'
                  }}>
                    <ImageIcon size={12} />
                    {proj.thumbnailUrl ? 'Image Added' : 'No Image'}
                  </span>

                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: proj.videoUrl ? '#EFF6FF' : '#F1F5F9',
                    color: proj.videoUrl ? '#2563EB' : '#94A3B8'
                  }}>
                    <Video size={12} />
                    {proj.videoUrl ? 'Video Ready' : 'No Video'}
                  </span>
                </div>

                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  Edit / Upload <Pencil size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT / UPLOAD MODAL */}
      {editingProject && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              maxWidth: 680,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1.5px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              background: '#FFFFFF',
              zIndex: 10
            }}>
              <div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: editingType === 'portfolio' ? '#D97706' : '#6C3CF0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.4px'
                }}>
                  {editingType === 'portfolio' ? 'Industry-Level & Portfolio Project' : 'Industrial Capstone'}
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '2px 0 0 0' }}>
                  Manage Project Media & Info
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingProject(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveProject} style={{ padding: '24px' }}>
              {errorMessage && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 13,
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Title & Worth */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: '#0F172A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Market Worth *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ₹12,000"
                    value={formWorth}
                    onChange={(e) => setFormWorth(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#059669',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Tech Stack / Tags */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  {editingType === 'portfolio' ? 'Tech Stack (comma separated) *' : 'Tags / Architecture (comma separated) *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python, Pandas, XGBoost, Scikit-Learn"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Deliverable Outcome */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Industry Deliverable & Real-World Outcome *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* MEDIA SECTION: THUMBNAIL UPLOAD */}
              {/* ───────────────────────────────────────────────────────── */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 18
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                      <ImageIcon size={16} color="#2563EB" />
                      <span>Cover Thumbnail Image</span>
                      {formVideoUrl.trim() ? (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: '#DC2626',
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          padding: '1px 7px',
                          borderRadius: 5
                        }}>
                          Required with Video
                        </span>
                      ) : (
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: '#64748B',
                          background: '#F1F5F9',
                          border: '1px solid #CBD5E1',
                          padding: '1px 7px',
                          borderRadius: 5
                        }}>
                          Card Cover Image
                        </span>
                      )}
                    </label>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                      {formVideoUrl.trim()
                        ? 'A thumbnail image is required to display as the video cover on the project card.'
                        : 'Upload an image directly to the server to display on the project card.'}
                    </p>
                  </div>
                  {formThumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setFormThumbnailUrl('')}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Upload Thumbnail Button */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 18px',
                    borderRadius: 9,
                    background: isUploadingImage ? '#E2E8F0' : '#2563EB',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: isUploadingImage ? 'wait' : 'pointer',
                    boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                  }}>
                    <Upload size={14} />
                    <span>{isUploadingImage ? 'Uploading Image to Server...' : 'Upload Thumbnail to Server'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isUploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {formThumbnailUrl && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#ECFDF5',
                      color: '#059669',
                      border: '1px solid #A7F3D0',
                      padding: '5px 10px',
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      <Check size={13} />
                      <span>Thumbnail Ready</span>
                    </span>
                  )}
                </div>

                {/* Thumbnail Preview */}
                {formThumbnailUrl && (
                  <div style={{
                    marginTop: 10,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1.5px solid #CBD5E1',
                    maxHeight: 140,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0F172A'
                  }}>
                    <img
                      src={formThumbnailUrl}
                      alt="Thumbnail Preview"
                      style={{ maxWidth: '100%', maxHeight: 140, objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                )}

                {/* Collapsible External Image URL */}
                <div style={{ marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowExternalThumbnail(!showExternalThumbnail)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: '#64748B',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showExternalThumbnail ? '− Hide external image URL' : '+ Or paste external image URL'}
                  </button>
                  {showExternalThumbnail && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="url"
                        placeholder="https://example.com/thumbnail.png"
                        value={formThumbnailUrl}
                        onChange={(e) => setFormThumbnailUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #CBD5E1',
                          fontSize: 12.5,
                          color: '#0F172A',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* MEDIA SECTION: DEMO VIDEO UPLOAD */}
              {/* ───────────────────────────────────────────────────────── */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px 18px',
                marginBottom: 24
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <Video size={16} color="#7C3AED" />
                      <span>Project Demo Video (Fast Server Upload or Drive Link)</span>
                    </label>
                    <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B' }}>
                      Upload directly to server for fastest loading, or enter a Google Drive / YouTube link.
                    </p>
                  </div>
                  {formVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormVideoUrl('')}
                      style={{
                        background: '#FEE2E2',
                        border: '1px solid #FECACA',
                        color: '#DC2626',
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      Remove Video
                    </button>
                  )}
                </div>

                {/* Upload File Button */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 9,
                    background: isUploadingVideo ? '#E2E8F0' : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    cursor: isUploadingVideo ? 'wait' : 'pointer',
                    boxShadow: '0 3px 10px rgba(124, 58, 237, 0.25)'
                  }}>
                    <Upload size={15} />
                    <span>
                      {isUploadingVideo
                        ? (videoUploadProgress > 0 ? `Uploading Video: ${videoUploadProgress}%` : 'Uploading Video...')
                        : 'Upload Video File to Server'}
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={isUploadingVideo}
                      style={{ display: 'none' }}
                    />
                  </label>

                  {formVideoUrl && !isUploadingVideo && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: isEmbeddableVideo(formVideoUrl) ? '#EFF6FF' : '#ECFDF5',
                      color: isEmbeddableVideo(formVideoUrl) ? '#1D4ED8' : '#059669',
                      border: isEmbeddableVideo(formVideoUrl) ? '1px solid #BFDBFE' : '1px solid #A7F3D0',
                      padding: '5px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700
                    }}>
                      <Check size={13} />
                      <span>
                        {getGoogleDriveFileId(formVideoUrl)
                          ? 'Google Drive Video Linked (Ready)'
                          : isEmbeddableVideo(formVideoUrl)
                            ? 'External Video Linked'
                            : 'Video Uploaded to Server (Ready)'}
                      </span>
                    </span>
                  )}
                </div>

                {/* Cover Thumbnail Required Warning */}
                {formVideoUrl.trim() && !formThumbnailUrl.trim() && (
                  <div style={{
                    marginTop: 8,
                    marginBottom: 10,
                    background: '#FFFBEB',
                    border: '1.5px solid #FDE68A',
                    color: '#B45309',
                    padding: '10px 14px',
                    borderRadius: 9,
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
                    <span><strong>Cover Thumbnail Required:</strong> A thumbnail image is required when adding a video walkthrough. Please upload a thumbnail image above before saving.</span>
                  </div>
                )}

                {/* Upload Progress Bar */}
                {isUploadingVideo && (
                  <div style={{ marginTop: 8, marginBottom: 10 }}>
                    <div style={{
                      width: '100%',
                      height: 7,
                      background: '#E2E8F0',
                      borderRadius: 999,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${videoUploadProgress}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #7C3AED 0%, #2563EB 100%)',
                        transition: 'width 0.2s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginTop: 3 }}>
                      Fast chunked video upload in progress... {videoUploadProgress}%
                    </span>
                  </div>
                )}

                {/* Video In-Modal Preview Player */}
                {formVideoUrl && (
                  <div style={{
                    marginTop: 10,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: '1px solid #CBD5E1',
                    background: '#0F172A',
                    position: 'relative',
                    paddingBottom: '56.25%',
                    height: 0,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.18)'
                  }}>
                    {isEmbeddableVideo(formVideoUrl) ? (
                      <iframe
                        src={getEmbedVideoUrl(formVideoUrl)}
                        title="Demo Video Preview"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      />
                    ) : (
                      <video
                        src={formVideoUrl}
                        controls
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      />
                    )}
                  </div>
                )}

                {/* Collapsible External Video Link */}
                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowExternalVideo(!showExternalVideo)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      color: '#64748B',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {showExternalVideo ? '− Hide external video link input' : '+ Or use Google Drive / YouTube link instead'}
                  </button>
                  {showExternalVideo && (
                    <div style={{ marginTop: 8 }}>
                      <input
                        type="url"
                        placeholder="https://drive.google.com/file/d/... or https://youtube.com/..."
                        value={formVideoUrl}
                        onChange={(e) => setFormVideoUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #CBD5E1',
                          fontSize: 12.5,
                          color: '#0F172A',
                          boxSizing: 'border-box'
                        }}
                      />
                      <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                        Supports Google Drive sharing links (any view/open format), YouTube, and Vimeo. Streams seamlessly inside the portal.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage || isUploadingVideo}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 10,
                    border: 'none',
                    background: editingType === 'portfolio' ? '#D97706' : '#6C3CF0',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: isSaving ? 'wait' : 'pointer',
                    boxShadow: editingType === 'portfolio'
                      ? '0 4px 14px rgba(217, 119, 6, 0.35)'
                      : '0 4px 14px rgba(108, 60, 240, 0.35)'
                  }}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustrialProjectsManager;
