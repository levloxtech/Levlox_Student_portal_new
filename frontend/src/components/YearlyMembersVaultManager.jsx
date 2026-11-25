import React, { useState, useEffect } from 'react';
import {
  Code, FileText, Play, Download, ExternalLink, Plus, Trash2,
  Sparkles, RefreshCw, X, Shield, Lock, CheckCircle2, Award,
  FolderGit2, Briefcase, FileCode2, Database, BrainCircuit, Building2,
  UserCheck, Pencil, Video
} from 'lucide-react';

const Linkedin = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

import { getEmbedVideoUrl as utilGetEmbedVideoUrl, getGoogleDriveFileId } from '../utils/videoUtils';

// Helper to convert Google Drive / YouTube / Vimeo links to embeddable player URLs
const getEmbedVideoUrl = (rawUrl) => {
  return utilGetEmbedVideoUrl(rawUrl);
};

export default function YearlyMembersVaultManager() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionTab, setActiveSectionTab] = useState('all'); // 'all' | 'projects' | 'interview_kit'

  // Add / Edit Material Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMat, setEditingMat] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [newMat, setNewMat] = useState({
    title: '',
    section: 'projects', // 'projects' | 'interview_kit'
    type: 'code',        // 'code' | 'document' | 'video'
    category: 'Python',  // Python, SQL, ML, Industrial Project OR Interview modules
    description: '',
    externalUrl: '',     // Code repo link or PDF link
    videoUrl: '',        // Google Drive link, YouTube, or MP4 URL
    duration: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Video Preview Modal
  const [previewVideo, setPreviewVideo] = useState(null);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/yearly-vault/vault/materials');
      const data = await res.json();
      if (data.success) {
        setMaterials(data.materials || []);
      }
    } catch (err) {
      console.error('Failed to fetch yearly materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleOpenAddModal = () => {
    setEditingMat(null);
    setNewMat({
      title: '',
      section: 'projects',
      type: 'code',
      category: 'Python',
      description: '',
      externalUrl: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: '',
      tags: ''
    });
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (mat) => {
    setEditingMat(mat);
    setNewMat({
      title: mat.title || '',
      section: mat.section || 'projects',
      type: mat.type || 'code',
      category: mat.category || 'Python',
      description: mat.description || '',
      externalUrl: mat.fileUrl || '',
      videoUrl: mat.videoUrl || (mat.type === 'video' ? mat.fileUrl : '') || '',
      thumbnailUrl: mat.thumbnailUrl || '',
      duration: mat.duration || '',
      tags: Array.isArray(mat.tags) ? mat.tags.join(', ') : (mat.tags || '')
    });
    setSelectedFile(null);
    setShowAddModal(true);
  };

  const handleSectionChange = (section) => {
    if (section === 'projects') {
      setNewMat(prev => ({
        ...prev,
        section: 'projects',
        category: 'Python',
        type: 'code'
      }));
    } else {
      setNewMat(prev => ({
        ...prev,
        section: 'interview_kit',
        category: 'Industry-Level Resume Building',
        type: 'document'
      }));
    }
  };

  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    if (!newMat.title.trim()) return alert('Please enter material title.');

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', newMat.title.trim());
      formData.append('section', newMat.section);
      formData.append('type', newMat.type);
      formData.append('category', newMat.category);
      formData.append('description', newMat.description.trim());
      formData.append('externalUrl', newMat.externalUrl.trim());
      formData.append('videoUrl', newMat.videoUrl.trim());
      formData.append('thumbnailUrl', (newMat.thumbnailUrl || '').trim());
      formData.append('duration', newMat.duration.trim());
      formData.append('tags', newMat.tags);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const url = editingMat
        ? `/api/yearly-vault/vault/admin/materials/${editingMat.id}`
        : '/api/yearly-vault/vault/admin/materials';
      const method = editingMat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save material');

      setShowAddModal(false);
      setEditingMat(null);
      setSelectedFile(null);
      fetchMaterials();
    } catch (err) {
      alert('Error saving material: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Are you sure you want to remove this material from the Internship Hub?')) return;
    try {
      const res = await fetch(`/api/yearly-vault/vault/admin/materials/${matId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete material');
      setMaterials(prev => prev.filter(m => m.id !== matId));
    } catch (err) {
      alert('Error deleting material: ' + err.message);
    }
  };

  const getItemSection = (mat) => {
    if (mat.section) return mat.section;
    const cat = (mat.category || '').toLowerCase();
    const title = (mat.title || '').toLowerCase();
    if (cat.includes('resume') || cat.includes('linkedin') || cat.includes('interview') || title.includes('resume') || title.includes('linkedin') || title.includes('interview')) {
      return 'interview_kit';
    }
    return 'projects';
  };

  const filtered = materials.filter(m => {
    if (activeSectionTab === 'all') return true;
    return getItemSection(m) === activeSectionTab;
  });

  const projectsCount = materials.filter(m => getItemSection(m) === 'projects').length;
  const interviewCount = materials.filter(m => getItemSection(m) === 'interview_kit').length;

  return (
    <div style={{ padding: '24px 28px', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
              color: '#FFF',
              fontSize: 11,
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: 6,
              letterSpacing: '0.04em'
            }}>
              PORTAL HUB REPOSITORIES &amp; VIDEOS
            </span>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              {materials.length} Total Resources
            </span>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>
            Internship Hub Manager
          </h2>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
            Publish project codebases, walkthrough videos (Google Drive / YouTube / MP4), and Interview Kit resources.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={fetchMaterials}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 10,
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              color: '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
              border: 'none',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
            }}
          >
            <Plus size={16} /> Add New Resource
          </button>
        </div>
      </div>

      {/* Section Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1.5px solid #E2E8F0',
        paddingBottom: 12,
        marginBottom: 20
      }}>
        {[
          { id: 'all', label: 'All Resources', count: materials.length },
          { id: 'projects', label: 'Projects Vault', count: projectsCount, icon: <FolderGit2 size={14} /> },
          { id: 'interview_kit', label: 'Interview Kit', count: interviewCount, icon: <Briefcase size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSectionTab(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeSectionTab === tab.id ? '#EDE9FE' : '#F1F5F9',
              color: activeSectionTab === tab.id ? '#6D28D9' : '#475569',
              fontWeight: activeSectionTab === tab.id ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s ease'
            }}
          >
            {tab.icon}
            {tab.label}
            <span style={{
              background: activeSectionTab === tab.id ? '#7C3AED' : '#CBD5E1',
              color: activeSectionTab === tab.id ? '#FFF' : '#334155',
              fontSize: 11,
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: 999
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Materials Grid */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 10px' }} />
          <div>Loading Internship Hub materials...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#F8FAFC',
          borderRadius: 16,
          border: '1.5px dashed #CBD5E1'
        }}>
          <FolderGit2 size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: '0 0 6px' }}>
            No Resources in this Category
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
            Click &quot;Add New Resource&quot; to publish codebases, walkthrough videos, or guides.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#7C3AED',
              color: '#FFF',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            + Add First Resource
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 16
        }}>
          {filtered.map(mat => {
            const isProject = getItemSection(mat) === 'projects';
            const hasVideo = Boolean(mat.videoUrl || mat.type === 'video');
            const videoSource = mat.videoUrl || (mat.type === 'video' ? mat.fileUrl : '');
            const hasRepo = Boolean(mat.fileUrl && mat.type !== 'video');

            return (
              <div
                key={mat.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Header Tag Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: isProject ? '#EFF6FF' : '#FAF5FF',
                      color: isProject ? '#1D4ED8' : '#6D28D9',
                      border: isProject ? '1px solid #BFDBFE' : '1px solid #DDD6FE',
                      textTransform: 'uppercase'
                    }}>
                      {isProject ? 'Project' : 'Interview Kit'}
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 750,
                      padding: '2px 8px',
                      borderRadius: 6,
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #E2E8F0'
                    }}>
                      {mat.category}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      title="Edit Resource"
                      onClick={() => handleOpenEditModal(mat)}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        color: '#2563EB',
                        cursor: 'pointer',
                        padding: '4px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      title="Delete Resource"
                      onClick={() => handleDeleteMaterial(mat.id)}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FECDD3',
                        color: '#EF4444',
                        cursor: 'pointer',
                        padding: '4px 7px',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.35 }}>
                  {mat.title}
                </h3>

                <p style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.45, margin: '0 0 12px', flex: 1 }}>
                  {mat.description}
                </p>

                {/* Tags */}
                {Array.isArray(mat.tags) && mat.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                    {mat.tags.map((t, idx) => (
                      <span key={idx} style={{ background: '#F1F5F9', color: '#475569', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Actions */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>
                    {mat.duration || mat.fileSize || 'Available'}
                  </span>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {hasVideo && (
                      <button
                        type="button"
                        onClick={() => setPreviewVideo({ ...mat, activeVideoUrl: videoSource })}
                        style={{
                          background: '#7C3AED', color: '#FFF', border: 'none',
                          padding: '5px 10px', borderRadius: 6, fontSize: 11,
                          fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Play size={10} fill="#FFF" /> Play Video
                      </button>
                    )}

                    {hasRepo && (
                      <a
                        href={mat.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#EFF6FF', color: '#1D4ED8', textDecoration: 'none',
                          border: '1px solid #BFDBFE',
                          padding: '5px 10px', borderRadius: 6, fontSize: 11,
                          fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4
                        }}
                      >
                        <Download size={11} /> Open Repo
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL: ADD / EDIT MATERIAL IN INTERNSHIP HUB ─── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, maxWidth: 580, width: '100%',
            padding: '28px 26px', border: '1px solid #E2E8F0',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>
                  {editingMat ? 'Edit Internship Hub Resource' : 'Add Resource to Internship Hub'}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  Attach project codebases, Google Drive walkthrough videos, or Interview Kits
                </span>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setEditingMat(null); }}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial}>
              {/* Section Selector: Projects vs Interview Kit */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                  Hub Section *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleSectionChange('projects')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: newMat.section === 'projects' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                      background: newMat.section === 'projects' ? '#EFF6FF' : '#FFFFFF',
                      color: newMat.section === 'projects' ? '#1D4ED8' : '#475569',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <FolderGit2 size={16} /> Projects Vault
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSectionChange('interview_kit')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: newMat.section === 'interview_kit' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                      background: newMat.section === 'interview_kit' ? '#FAF5FF' : '#FFFFFF',
                      color: newMat.section === 'interview_kit' ? '#6D28D9' : '#475569',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <Briefcase size={16} /> Interview Kit
                  </button>
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder={newMat.section === 'projects' ? 'e.g. End-to-End Real-Time ML System' : 'e.g. FAANG ATS-Proof Resume Handbook'}
                  value={newMat.title}
                  onChange={(e) => setNewMat({ ...newMat, title: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* Category & Format Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    {newMat.section === 'projects' ? 'Project Category *' : 'Interview Module *'}
                  </label>
                  {newMat.section === 'projects' ? (
                    <select
                      value={newMat.category}
                      onChange={(e) => setNewMat({ ...newMat, category: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    >
                      <option value="Python">Python</option>
                      <option value="SQL">SQL</option>
                      <option value="ML">Machine Learning (ML)</option>
                      <option value="Industrial Project">Industrial Project</option>
                    </select>
                  ) : (
                    <select
                      value={newMat.category}
                      onChange={(e) => setNewMat({ ...newMat, category: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                    >
                      <option value="Industry-Level Resume Building">Industry-Level Resume Building</option>
                      <option value="LinkedIn Profile Optimization">LinkedIn Profile Optimization</option>
                      <option value="Technical & HR Interview Prep Kit">Technical &amp; HR Interview Prep Kit</option>
                    </select>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Primary Format *
                  </label>
                  <select
                    value={newMat.type}
                    onChange={(e) => setNewMat({ ...newMat, type: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    {newMat.section === 'projects' ? (
                      <>
                        <option value="code">Project Source Code &amp; Walkthrough Video</option>
                        <option value="video">Pure Walkthrough Masterclass Video</option>
                        <option value="document">Architecture Specification (PDF)</option>
                      </>
                    ) : (
                      <>
                        <option value="document">PDF Handbook / Resume Template</option>
                        <option value="video">Video Masterclass / Walkthrough</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Code Repository URL */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Project Code / Repository URL (GitHub, GitLab, or Zip Download)
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/org/project-repo"
                  value={newMat.externalUrl}
                  onChange={(e) => setNewMat({ ...newMat, externalUrl: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* Walkthrough Video URL (Google Drive / YouTube / MP4) */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  <span>Walkthrough Video Link (Google Drive / YouTube / Direct MP4)</span>
                  <span style={{ fontSize: 10, background: '#EFF6FF', color: '#2563EB', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>Drive Supported</span>
                </label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/.../view or https://youtu.be/..."
                  value={newMat.videoUrl}
                  onChange={(e) => setNewMat({ ...newMat, videoUrl: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 4, display: 'block' }}>
                  Paste a public or shareable Google Drive link, and the portal will play it seamlessly in the student dashboard.
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Description / Project Overview
                </label>
                <textarea
                  rows={2}
                  placeholder="Details about what is covered in this resource and video..."
                  value={newMat.description}
                  onChange={(e) => setNewMat({ ...newMat, description: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* Thumbnail Image URL */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  <span>Thumbnail Image URL (or upload image file below)</span>
                  <span style={{ fontSize: 10, background: '#ECFDF5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>Cover</span>
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... or /uploads/..."
                  value={newMat.thumbnailUrl}
                  onChange={(e) => setNewMat({ ...newMat, thumbnailUrl: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              {/* File Upload (PDF Guide, Document, Video, or Thumbnail) */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Direct File Attachment (PDF Handbook, Video MP4, Zip Repo, or Thumbnail Image)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '7px 0', fontSize: 12.5 }}
                />
                <span style={{ fontSize: 11, color: '#64748B', marginTop: 3, display: 'block' }}>
                  Upload PDF documents, project code packages, or custom thumbnail covers directly from your machine.
                </span>
              </div>

              {/* Duration & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Duration / Page Count
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 45 Mins Walkthrough"
                    value={newMat.duration}
                    onChange={(e) => setNewMat({ ...newMat, duration: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Python, FastAPI, Celery"
                    value={newMat.tags}
                    onChange={(e) => setNewMat({ ...newMat, tags: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setEditingMat(null); }}
                  style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: uploading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {uploading ? 'Saving...' : (editingMat ? 'Update Resource' : 'Add Material to Hub')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIDEO PREVIEW MODAL ─── */}
      {previewVideo && (() => {
        const videoSrc = previewVideo.activeVideoUrl || previewVideo.videoUrl || previewVideo.fileUrl;
        const embedUrl = getEmbedVideoUrl(videoSrc);

        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 120,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}>
            <div style={{
              background: '#0F172A', borderRadius: 20, maxWidth: 840, width: '100%',
              overflow: 'hidden', border: '1px solid #334155', boxShadow: '0 25px 65px rgba(0,0,0,0.6)'
            }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFF', margin: '0 0 2px' }}>
                    {previewVideo.title}
                  </h3>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>{previewVideo.category}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  style={{ background: '#1E293B', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={15} />
                </button>
              </div>
              <div style={{ background: '#000' }}>
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={previewVideo.title}
                    style={{ width: '100%', height: '460px', border: 'none', display: 'block' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={videoSrc}
                    controls
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxHeight: 460, display: 'block' }}
                  />
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
