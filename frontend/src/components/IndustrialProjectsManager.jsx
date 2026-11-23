import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FolderGit2, Video, Image as ImageIcon, Plus, Pencil, Check,
  X, Play, Upload, ExternalLink, RefreshCw, AlertCircle, Eye,
  Tag, Layers, Sparkles, Trash2, ArrowUpRight
} from 'lucide-react';
import { getIndustrialProjects, updateIndustrialProject } from '../services/firebaseService';
import { uploadUniversalFile } from '../services/apiService';

const DEFAULT_PROJECTS = [
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

// Helper to format YouTube / Vimeo embeds or direct video URLs
export const getEmbedVideoUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const clean = String(rawUrl).trim();
  // YouTube watch?v=...
  if (clean.includes('youtube.com/watch')) {
    const v = new URL(clean).searchParams.get('v');
    return v ? `https://www.youtube.com/embed/${v}` : clean;
  }
  // YouTube youtu.be/...
  if (clean.includes('youtu.be/')) {
    const v = clean.split('youtu.be/')[1]?.split('?')[0];
    return v ? `https://www.youtube.com/embed/${v}` : clean;
  }
  // Vimeo
  if (clean.includes('vimeo.com/')) {
    const v = clean.split('vimeo.com/')[1]?.split('?')[0];
    return v ? `https://player.vimeo.com/video/${v}` : clean;
  }
  return clean;
};

export const isEmbeddableVideo = (url) => {
  if (!url) return false;
  const c = url.toLowerCase();
  return c.includes('youtube.com') || c.includes('youtu.be') || c.includes('vimeo.com');
};

const IndustrialProjectsManager = () => {
  const queryClient = useQueryClient();

  // Query database projects
  const { data: dbProjects = [], isLoading, refetch } = useQuery({
    queryKey: ['industrialProjects'],
    queryFn: async () => {
      const res = await getIndustrialProjects().catch(() => []);
      if (Array.isArray(res) && res.length > 0) return res;
      return DEFAULT_PROJECTS;
    },
    staleTime: 1000 * 30,
  });

  const projects = useMemo(() => {
    if (dbProjects && dbProjects.length > 0) {
      // Merge with defaults so any missing fields are safely fallback-protected
      const map = new Map(dbProjects.map(p => [p.id, p]));
      return DEFAULT_PROJECTS.map(def => {
        const found = map.get(def.id);
        return found ? { ...def, ...found } : def;
      });
    }
    return DEFAULT_PROJECTS;
  }, [dbProjects]);

  const [activeCategory, setActiveCategory] = useState('all');

  // Edit/Upload Modal State
  const [editingProject, setEditingProject] = useState(null);
  const [formName, setFormName] = useState('');
  const [formWorth, setFormWorth] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formOutcome, setFormOutcome] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
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
  const handleOpenEdit = (p) => {
    setEditingProject(p);
    setFormName(p.name || '');
    setFormWorth(p.worth || '');
    setFormTags(Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''));
    setFormOutcome(p.outcome || '');
    setFormThumbnailUrl(p.thumbnailUrl || '');
    setFormVideoUrl(p.videoUrl || '');
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
      const res = await uploadUniversalFile(file, 'industrial-projects/thumbnails');
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
      const res = await uploadUniversalFile(file, 'industrial-projects/videos');
      if (res?.url) {
        setFormVideoUrl(res.url);
        showToast('Project video uploaded successfully!');
      }
    } catch (err) {
      console.error('[Upload] Video upload failed:', err);
      alert('Video upload failed: ' + err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Save Project Handler
  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    setIsSaving(true);
    setErrorMessage('');

    try {
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

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['industrialProjects'] }),
        queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] }),
      ]);
      await refetch();

      showToast(`Project "${formName}" updated successfully!`);
      setEditingProject(null);
    } catch (err) {
      console.error('[IndustrialProjects] Update error:', err);
      setErrorMessage(err.message || 'Failed to save project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProjects = useMemo(() => {
    if (activeCategory === 'all') return projects;
    return projects.filter(p => p.category === activeCategory);
  }, [projects, activeCategory]);

  const categories = [
    { key: 'all', label: 'All Projects (9)', color: '#6C3CF0', bg: '#F5F3FF' },
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
            background: '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6C3CF0',
            border: '1.5px solid #DDD6FE'
          }}>
            <FolderGit2 size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Industrial Projects Experience
              </h1>
              <span style={{
                background: '#EDE9FE',
                color: '#6C3CF0',
                fontSize: 12,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 999
              }}>
                9 Capstones
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              Upload video walkthroughs, thumbnail images, and manage details for student portfolio capstone projects.
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
          <Sparkles size={14} color="#6C3CF0" />
          <span>Click any project to upload its video demo or thumbnail</span>
        </div>
      </div>

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

      {/* Projects Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 20
      }}>
        {filteredProjects.map((p, index) => {
          const isPython = p.category === 'python';
          const isML = p.category === 'ml';
          const isSQL = p.category === 'sql';
          const categoryColor = isPython ? '#2563EB' : isML ? '#7C3AED' : '#059669';
          const categoryBg = isPython ? '#EFF6FF' : isML ? '#F5F3FF' : '#ECFDF5';
          const categoryBorder = isPython ? '#BFDBFE' : isML ? '#DDD6FE' : '#A7F3D0';

          return (
            <div
              key={p.id}
              onClick={() => handleOpenEdit(p)}
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
                      {p.categoryLabel || p.category}
                    </span>
                    <h3 style={{
                      fontSize: 15.5,
                      fontWeight: 800,
                      color: '#0F172A',
                      margin: 0,
                      lineHeight: 1.35
                    }}>
                      {p.name}
                    </h3>
                  </div>

                  <span style={{
                    fontSize: 11,
                    fontWeight: 750,
                    color: '#047857',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '3px 9px',
                    borderRadius: 6,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}>
                    Worth {p.worth}
                  </span>
                </div>

                {/* Media Preview Slot (Thumbnail / Video Indicator) */}
                <div style={{
                  height: 145,
                  borderRadius: 12,
                  overflow: 'hidden',
                  margin: '12px 0',
                  position: 'relative',
                  border: '1px solid #E2E8F0',
                  background: p.thumbnailUrl ? '#0F172A' : categoryBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {p.thumbnailUrl ? (
                    <img
                      src={p.thumbnailUrl}
                      alt={p.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: '#FFFFFF',
                        color: categoryColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 8px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                      }}>
                        {p.videoUrl ? <Video size={22} /> : <ImageIcon size={22} />}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: categoryColor, display: 'block' }}>
                        {p.videoUrl ? 'Video Attached (Click to Watch)' : '+ Click to Upload Video / Image'}
                      </span>
                    </div>
                  )}

                  {/* Play Overlay if video exists */}
                  {p.videoUrl && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveVideoModal(p);
                      }}
                      title="Play Project Video Demo"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(2px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.45)'; }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: '#6C3CF0',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(108, 60, 240, 0.45)'
                      }}>
                        <Play size={20} fill="#FFFFFF" style={{ marginLeft: 3 }} />
                      </div>
                      <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.3 }}>
                        Watch Video Demo
                      </span>
                    </div>
                  )}

                  {/* Status badges */}
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 5
                  }}>
                    {p.videoUrl && (
                      <span style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Video size={11} color="#A78BFA" /> Video Ready
                      </span>
                    )}
                    {p.thumbnailUrl && (
                      <span style={{
                        background: 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <ImageIcon size={11} color="#60A5FA" /> Image
                      </span>
                    )}
                  </div>
                </div>

                {/* Tech Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {(p.tags || []).map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: '#334155',
                        background: '#F1F5F9',
                        padding: '3px 8px',
                        borderRadius: 6
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Description */}
                <p style={{
                  fontSize: 12.5,
                  color: '#475569',
                  lineHeight: 1.45,
                  margin: '0 0 16px 0',
                  minHeight: 36
                }}>
                  {p.outcome}
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(p);
                }}
                style={{
                  width: '100%',
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#0F172A',
                  fontSize: 12.5,
                  fontWeight: 750,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#F5F3FF';
                  e.currentTarget.style.borderColor = '#DDD6FE';
                  e.currentTarget.style.color = '#6C3CF0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#F8FAFC';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#0F172A';
                }}
              >
                <Pencil size={13} /> Upload Video / Image & Edit
              </button>
            </div>
          );
        })}
      </div>

      {/* ── UPLOAD VIDEO & THUMBNAIL MODAL ── */}
      {editingProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 580,
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#F5F3FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6C3CF0',
                  border: '1px solid #DDD6FE'
                }}>
                  <Video size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                    Upload Media & Edit Project
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                    {editingProject.categoryLabel} &bull; {editingProject.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingProject(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSaveProject}>
              {/* Project Title */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Project Title *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Worth & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Worth Label
                  </label>
                  <input
                    type="text"
                    value={formWorth}
                    onChange={(e) => setFormWorth(e.target.value)}
                    placeholder="e.g. ₹12,500"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#0F172A',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Category
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingProject.categoryLabel || editingProject.category}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #E2E8F0',
                      background: '#F1F5F9',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#64748B',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* ── THUMBNAIL IMAGE SECTION ── */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 18
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ImageIcon size={15} color="#2563EB" /> Project Thumbnail Image
                  </label>
                  {formThumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setFormThumbnailUrl('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Remove Image
                    </button>
                  )}
                </div>

                {/* Thumbnail Preview if present */}
                {formThumbnailUrl && (
                  <div style={{
                    width: '100%',
                    height: 140,
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 10,
                    border: '1px solid #CBD5E1',
                    position: 'relative'
                  }}>
                    <img
                      src={formThumbnailUrl}
                      alt="Thumbnail Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Upload or URL */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    flex: '1 1 180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1.5px dashed #CBD5E1',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#2563EB',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <Upload size={14} />
                    <span>{isUploadingImage ? 'Uploading Image...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      disabled={isUploadingImage}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>OR URL:</span>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={formThumbnailUrl}
                    onChange={(e) => setFormThumbnailUrl(e.target.value)}
                    style={{
                      flex: '2 1 200px',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 12.5,
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              {/* ── PROJECT VIDEO SECTION ── */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 14,
                padding: '16px',
                marginBottom: 18
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Video size={15} color="#7C3AED" /> Project Walkthrough Video
                  </label>
                  {formVideoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormVideoUrl('')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#DC2626',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Remove Video
                    </button>
                  )}
                </div>

                {/* Video Preview Player if present */}
                {formVideoUrl && (
                  <div style={{
                    width: '100%',
                    borderRadius: 10,
                    overflow: 'hidden',
                    marginBottom: 10,
                    border: '1px solid #CBD5E1',
                    background: '#000000',
                    aspectRatio: '16/9'
                  }}>
                    {isEmbeddableVideo(formVideoUrl) ? (
                      <iframe
                        src={getEmbedVideoUrl(formVideoUrl)}
                        title="Video Preview"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={formVideoUrl}
                        controls
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    )}
                  </div>
                )}

                {/* Upload or URL */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{
                    flex: '1 1 180px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1.5px dashed #CBD5E1',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#7C3AED',
                    cursor: isUploadingVideo ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease'
                  }}>
                    <Upload size={14} />
                    <span>{isUploadingVideo ? 'Uploading Video...' : 'Upload Video File (MP4)'}</span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                      disabled={isUploadingVideo}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>OR URL:</span>

                  <input
                    type="url"
                    placeholder="YouTube link, Vimeo, or direct MP4 URL"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    style={{
                      flex: '2 1 200px',
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #CBD5E1',
                      fontSize: 12.5,
                      background: '#FFFFFF'
                    }}
                  />
                </div>
              </div>

              {/* Tech Tags */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Technical Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="e.g. Python, FastApi, PostgreSQL"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Outcome / Description */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Project Outcome / Summary Highlights
                </label>
                <textarea
                  rows={3}
                  value={formOutcome}
                  onChange={(e) => setFormOutcome(e.target.value)}
                  placeholder="Key real-world deliverables, engineering architecture, and metrics..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  disabled={isSaving}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#6C3CF0',
                    color: '#FFFFFF',
                    fontWeight: 750,
                    fontSize: 13,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(108, 60, 240, 0.35)'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving Project...
                    </>
                  ) : (
                    'Save Project Media & Details'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIDEO PLAYER MODAL ── */}
      {activeVideoModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: '#0F172A',
            borderRadius: 20,
            maxWidth: 820,
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155'
          }}>
            <div style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #1E293B',
              color: '#FFFFFF'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#A78BFA', textTransform: 'uppercase' }}>
                  {activeVideoModal.categoryLabel} &bull; Video Demo
                </span>
                <h3 style={{ margin: '2px 0 0 0', fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>
                  {activeVideoModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveVideoModal(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: '#1E293B',
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Player */}
            <div style={{ width: '100%', aspectRatio: '16/9', background: '#000000' }}>
              {isEmbeddableVideo(activeVideoModal.videoUrl) ? (
                <iframe
                  src={getEmbedVideoUrl(activeVideoModal.videoUrl)}
                  title={activeVideoModal.name}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={activeVideoModal.videoUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndustrialProjectsManager;
