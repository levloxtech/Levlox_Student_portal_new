import React, { useState, useEffect } from 'react';
import {
  Code, FileText, Play, Download, Lock, Sparkles, Award,
  CheckCircle2, ExternalLink, RefreshCw, X, Shield, ArrowRight, ArrowLeft,
  FolderGit2, Briefcase, FileCode2, Database, BrainCircuit,
  Building2, UserCheck, HelpCircle, Video
} from 'lucide-react';
import SecureVideoPlayer from './SecureVideoPlayer';

const Linkedin = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function StudentYearlyVaultView({
  isYearlyMember = false,
  onOpenRenewal,
  userProfile = null,
  currentUser = null
}) {
  const [materials, setMaterials] = useState([]);
  const [examConfig, setExamConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  // Top Section Switcher: 'projects' | 'interview_kit'
  const [activeSection, setActiveSection] = useState('projects');

  // Sub-Filters
  const [projectFilter, setProjectFilter] = useState('all'); // 'all' | 'Python' | 'SQL' | 'ML' | 'Industrial Project'
  const [interviewFilter, setInterviewFilter] = useState('all'); // 'all' | 'Resume' | 'LinkedIn' | 'Prep'
  const [interviewTypeFilter, setInterviewTypeFilter] = useState('all'); // 'all' | 'video' | 'document'

  // Theater Walkthrough Learning State (Identical to RecordedClassesPage & AcademiaCourseViewer)
  const [activePlayingMaterial, setActivePlayingMaterial] = useState(null);

  const studentName = userProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Student';
  const studentRoll = userProfile?.rollNumber || userProfile?.studentId || 'LVX';
  const watermarkText = `${studentName} • ${studentRoll}`;

  // Fetch live exam config for dynamic threshold and track name
  useEffect(() => {
    fetch('/api/internship-exam/config')
      .then(r => r.json())
      .then(d => { if (d.success) setExamConfig(d); })
      .catch(() => { });
  }, []);

  // Fetch live materials from backend (syncs instantly with Admin additions)
  const fetchMaterials = () => {
    setLoading(true);
    fetch('/api/yearly-vault/vault/materials')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setMaterials(data.materials || []);
        }
      })
      .catch(err => {
        console.error('Failed to load vault materials:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Helper to resolve section for legacy or new items
  const getItemSection = (mat) => {
    if (mat.section) return mat.section;
    const cat = (mat.category || '').toLowerCase();
    const title = (mat.title || '').toLowerCase();
    if (cat.includes('resume') || cat.includes('linkedin') || cat.includes('interview') || title.includes('resume') || title.includes('linkedin') || title.includes('interview')) {
      return 'interview_kit';
    }
    return 'projects';
  };

  // Filter materials based on section and sub-filters
  const sectionMaterials = materials.filter(m => getItemSection(m) === activeSection);

  const filteredMaterials = sectionMaterials.filter(mat => {
    if (activeSection === 'projects') {
      if (projectFilter === 'all') return true;
      const cat = (mat.category || '').toLowerCase();
      const tags = (Array.isArray(mat.tags) ? mat.tags.join(' ') : '').toLowerCase();
      const title = (mat.title || '').toLowerCase();

      if (projectFilter === 'Python') {
        return cat.includes('python') || tags.includes('python') || title.includes('python');
      }
      if (projectFilter === 'SQL') {
        return cat.includes('sql') || tags.includes('sql') || title.includes('sql') || cat.includes('database');
      }
      if (projectFilter === 'ML') {
        return cat.includes('ml') || cat.includes('machine learning') || tags.includes('machine learning') || tags.includes('xgboost') || tags.includes('fraud');
      }
      if (projectFilter === 'Industrial Project') {
        return cat.includes('industrial') || cat.includes('capstone') || tags.includes('industrial') || tags.includes('autonomous');
      }
      return true;
    } else {
      // Interview Kit Filters
      let matchesCat = true;
      const cat = (mat.category || '').toLowerCase();
      const title = (mat.title || '').toLowerCase();

      if (interviewFilter === 'Resume') {
        matchesCat = cat.includes('resume') || title.includes('resume');
      } else if (interviewFilter === 'LinkedIn') {
        matchesCat = cat.includes('linkedin') || title.includes('linkedin');
      } else if (interviewFilter === 'Prep') {
        matchesCat = cat.includes('technical') || cat.includes('hr') || cat.includes('prep') || title.includes('question') || title.includes('interview');
      }

      let matchesType = true;
      if (interviewTypeFilter === 'video') matchesType = mat.type === 'video' || mat.format === 'video';
      if (interviewTypeFilter === 'document') matchesType = mat.type === 'document' || mat.type === 'pdf' || mat.format === 'pdf' || mat.format === 'document';

      return matchesCat && matchesType;
    }
  });

  const totalProjectsCount = materials.filter(m => getItemSection(m) === 'projects').length;
  const totalInterviewCount = materials.filter(m => getItemSection(m) === 'interview_kit').length;

  // ═══════════════════════════════════════════════════════════════════════════
  // THEATER MODE: CINEMATIC WALKTHROUGH LEARNING VIEW (MATCHING RECORDED CLASSES)
  // ═══════════════════════════════════════════════════════════════════════════
  if (activePlayingMaterial) {
    const videoSource = activePlayingMaterial.videoUrl || (activePlayingMaterial.type === 'video' ? activePlayingMaterial.fileUrl : '');
    const isCurrentProject = getItemSection(activePlayingMaterial) === 'projects';
    const relatedMaterials = materials.filter(m => getItemSection(m) === getItemSection(activePlayingMaterial));

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#0F172A',
        width: '100%',
        animation: 'fadeIn 0.2s ease-in-out'
      }}>
        {/* ── BREADCRUMB & BACK NAVIGATION ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActivePlayingMaterial(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 12,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#4F46E5',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 13,
                boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
                transition: 'all 0.18s ease'
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Hub</span>
            </button>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
              <span
                onClick={() => setActivePlayingMaterial(null)}
                style={{ color: '#6366F1', fontWeight: 700, cursor: 'pointer' }}
              >
                Internship Hub
              </span>
              <span style={{ color: '#94A3B8' }}>›</span>
              <span style={{ color: '#64748B', fontWeight: 600 }}>
                {isCurrentProject ? 'Projects Vault' : 'Interview Kit'}
              </span>
              <span style={{ color: '#94A3B8' }}>›</span>
              <span style={{ color: '#0F172A', fontWeight: 700, maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activePlayingMaterial.title}
              </span>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activePlayingMaterial.fileUrl && activePlayingMaterial.type !== 'video' && (
              <a
                href={activePlayingMaterial.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 750,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                }}
              >
                <FolderGit2 size={15} /> Open Repository Code
              </a>
            )}

            <button
              type="button"
              onClick={() => setActivePlayingMaterial(null)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFFFFF',
                color: '#475569',
                border: '1.5px solid #E2E8F0',
                padding: '7px 14px',
                borderRadius: 999,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
              }}
            >
              <X size={14} />
              <span>Close Player</span>
            </button>
          </div>
        </div>

        {/* ── MAIN 2-COLUMN THEATER LAYOUT ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.9fr) minmax(320px, 1fr)',
          gap: 24,
          alignItems: 'start'
        }}>
          {/* LEFT COLUMN: 16:9 SECURE CINEMA VIDEO PLAYER + DETAILS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* 16:9 Cinema Container */}
            <div style={{
              background: '#09090B',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 16px 40px -10px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              aspectRatio: '16/9',
              border: '1px solid #1E293B',
              width: '100%'
            }}>
              {videoSource ? (
                <SecureVideoPlayer
                  key={activePlayingMaterial.id}
                  videoUrl={videoSource}
                  title={activePlayingMaterial.title}
                  watermarkText={watermarkText}
                  autoPlay={true}
                  height="100%"
                  aspectRatio="16/9"
                />
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 12,
                  color: '#94A3B8'
                }}>
                  <Video size={48} opacity={0.5} />
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No video attached to this resource yet.</p>
                </div>
              )}
            </div>

            {/* Under-Player Metadata & Actions */}
            <div style={{
              background: '#FFFFFF',
              borderRadius: 18,
              border: '1px solid #E2E8F0',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 6,
                    background: isCurrentProject ? '#EFF6FF' : '#FAF5FF',
                    color: isCurrentProject ? '#1D4ED8' : '#6D28D9',
                    border: isCurrentProject ? '1px solid #BFDBFE' : '1px solid #DDD6FE',
                    textTransform: 'uppercase'
                  }}>
                    {activePlayingMaterial.category}
                  </span>

                  {activePlayingMaterial.duration && (
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      background: '#F1F5F9',
                      padding: '3px 10px',
                      borderRadius: 6
                    }}>
                      ⏱ {activePlayingMaterial.duration}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {activePlayingMaterial.fileUrl && (
                    <a
                      href={activePlayingMaterial.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#EFF6FF',
                        color: '#1D4ED8',
                        border: '1px solid #BFDBFE',
                        padding: '6px 14px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 750,
                        textDecoration: 'none'
                      }}
                    >
                      <Download size={13} /> Open Repository
                    </a>
                  )}
                </div>
              </div>

              <div>
                <h1 style={{ fontSize: 20, fontWeight: 850, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.35 }}>
                  {activePlayingMaterial.title}
                </h1>
                <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                  {activePlayingMaterial.description || 'Step-by-step project build, architecture design, and code walkthrough.'}
                </p>
              </div>

              {/* Tech Stack Chips */}
              {Array.isArray(activePlayingMaterial.tags) && activePlayingMaterial.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6, borderTop: '1px solid #F1F5F9' }}>
                  {activePlayingMaterial.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: '#F8FAFC',
                        color: '#334155',
                        fontSize: 11,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontWeight: 700,
                        border: '1px solid #E2E8F0'
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: WALKTHROUGH PLAYLIST SIDEBAR */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 160px)',
            position: 'sticky',
            top: 20
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1.5px solid #F1F5F9',
              background: '#F8FAFC'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {isCurrentProject ? 'Projects Walkthroughs' : 'Interview Kit Modules'}
                </h3>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  padding: '2px 8px',
                  borderRadius: 999
                }}>
                  {relatedMaterials.length} Items
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>
                Click any card to play the walkthrough video
              </p>
            </div>

            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '10px' }}>
              {relatedMaterials.map((item, index) => {
                const isSelected = item.id === activePlayingMaterial.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActivePlayingMaterial(item)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: isSelected ? '#EFF6FF' : 'transparent',
                      border: isSelected ? '1.5px solid #3B82F6' : '1px solid transparent',
                      cursor: 'pointer',
                      marginBottom: 6,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: isSelected ? '#2563EB' : '#F1F5F9',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      flexShrink: 0
                    }}>
                      {isSelected ? <Play size={13} fill="#FFF" /> : (index + 1)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#6366F1', textTransform: 'uppercase' }}>
                          {item.category}
                        </span>
                        {item.duration && (
                          <span style={{ fontSize: 10.5, color: '#94A3B8' }}>• {item.duration}</span>
                        )}
                      </div>
                      <h4 style={{
                        fontSize: 13,
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? '#1E3A8A' : '#1E293B',
                        margin: 0,
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT GRID VIEW: PROJECTS VAULT & INTERVIEW KIT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, fontFamily: "'Inter', sans-serif" }}>

      {/* ─── 1. TOP HERO HEADER (CLEAN STANDARD PORTAL THEME) ─── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '22px 28px',
        color: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 18
      }}>
        <div style={{ maxWidth: 640 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            <Sparkles size={12} color="#4F46E5" />
            <span>1-Year Program • Flagship Hub</span>
          </div>

          <h1 style={{
            fontSize: 22,
            fontWeight: 850,
            margin: '0 0 6px',
            color: '#0F172A',
            letterSpacing: '-0.3px',
            lineHeight: 1.25
          }}>
            Internship Hub
          </h1>

          <p style={{
            fontSize: 13,
            color: '#64748B',
            margin: 0,
            lineHeight: 1.5
          }}>
            Production repositories, step-by-step project creation videos, ATS resume handbooks, and interview preparation kits.
          </p>
        </div>

        <div>
          {isYearlyMember ? (
            <div style={{
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              color: '#059669',
              padding: '7px 16px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <CheckCircle2 size={15} color="#059669" /> Hub Access Active • Unlocked
            </div>
          ) : (
            <div style={{
              background: '#FEF2F2',
              border: '1.5px solid #FECDD3',
              color: '#DC2626',
              padding: '7px 16px',
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <Lock size={14} color="#DC2626" /> 1-Year Pass Required
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. LOCKED SHOWCASE BANNER (WHEN NOT YEARLY OR HUB ENABLED) ─── */}
      {!isYearlyMember && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 45%, #FEF3C7 100%)',
          border: '1.5px solid #FDE68A',
          borderRadius: 18,
          padding: '20px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 18,
          boxShadow: '0 8px 24px -4px rgba(217, 119, 6, 0.12), 0 2px 6px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 280, flex: '1 1 450px' }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: 15,
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 6px 18px rgba(217, 119, 6, 0.3)'
            }}>
              <Lock size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 850,
                  color: '#92400E',
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  padding: '2px 8px',
                  borderRadius: 999,
                  textTransform: 'uppercase'
                }}>
                  Exclusive 1-Year Membership Content
                </span>
              </div>
              <h3 style={{ fontSize: 16.5, fontWeight: 850, color: '#78350F', margin: '0 0 4px' }}>
                Internship Hub is Locked for Your Account
              </h3>
              <p style={{ fontSize: 12.5, color: '#92400E', margin: 0, lineHeight: 1.45 }}>
                Unlock all <strong>Projects (Python, SQL, ML, Industrial)</strong> and <strong>Interview Kits</strong> with the 1-Year Pass or score {examConfig?.passingScore || 80}%+ on the Qualifying Exam.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onOpenRenewal && (
              <button
                type="button"
                onClick={onOpenRenewal}
                style={{
                  background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 22px',
                  borderRadius: 12,
                  fontWeight: 850,
                  fontSize: 13.5,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>Activate 1-Year Pass</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. PRIMARY SECTION TABS: "Projects Vault" vs "Interview Kit" ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        background: '#F1F5F9',
        padding: 6,
        borderRadius: 16
      }}>
        {/* Tab 1: Projects */}
        <button
          type="button"
          onClick={() => setActiveSection('projects')}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeSection === 'projects' ? '#FFFFFF' : 'transparent',
            color: activeSection === 'projects' ? '#0F172A' : '#64748B',
            fontWeight: 850,
            fontSize: 14.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: activeSection === 'projects' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <FolderGit2 size={18} color={activeSection === 'projects' ? '#2563EB' : '#94A3B8'} strokeWidth={2.4} />
          <span>Projects Vault</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 999,
            background: activeSection === 'projects' ? '#EFF6FF' : '#E2E8F0',
            color: activeSection === 'projects' ? '#2563EB' : '#64748B'
          }}>
            {totalProjectsCount}
          </span>
        </button>

        {/* Tab 2: Interview Kit */}
        <button
          type="button"
          onClick={() => setActiveSection('interview_kit')}
          style={{
            padding: '12px 18px',
            borderRadius: 12,
            border: 'none',
            background: activeSection === 'interview_kit' ? '#FFFFFF' : 'transparent',
            color: activeSection === 'interview_kit' ? '#0F172A' : '#64748B',
            fontWeight: 850,
            fontSize: 14.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: activeSection === 'interview_kit' ? '0 4px 14px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Briefcase size={18} color={activeSection === 'interview_kit' ? '#7C3AED' : '#94A3B8'} strokeWidth={2.4} />
          <span>Interview Kit</span>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 999,
            background: activeSection === 'interview_kit' ? '#FAF5FF' : '#E2E8F0',
            color: activeSection === 'interview_kit' ? '#7C3AED' : '#64748B'
          }}>
            {totalInterviewCount}
          </span>
        </button>
      </div>

      {/* ─── 4. SECONDARY CATEGORY FILTERS ─── */}
      {activeSection === 'projects' ? (
        /* PROJECTS SUB-FILTERS: Python, SQL, ML, Industrial Project */
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Projects', icon: <Code size={13} /> },
              { id: 'Python', label: 'Python Projects', icon: <FileCode2 size={13} color="#2563EB" /> },
              { id: 'SQL', label: 'SQL Analytics', icon: <Database size={13} color="#059669" /> },
              { id: 'ML', label: 'Machine Learning (ML)', icon: <BrainCircuit size={13} color="#7C3AED" /> },
              { id: 'Industrial Project', label: 'Industrial Projects', icon: <Building2 size={13} color="#D97706" /> }
            ].map(tab => {
              const isActive = projectFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setProjectFilter(tab.id)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: isActive ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                    background: isActive ? '#EFF6FF' : '#FFFFFF',
                    color: isActive ? '#1D4ED8' : '#475569',
                    fontWeight: 750,
                    fontSize: 12.5,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 2px 6px rgba(37, 99, 235, 0.12)' : 'none'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Showing {filteredMaterials.length} of {totalProjectsCount} projects
          </div>
        </div>
      ) : (
        /* INTERVIEW KIT SUB-FILTERS: Resume, LinkedIn, Tech/HR Prep */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'All Interview Kits', icon: <Briefcase size={13} /> },
                { id: 'Resume', label: 'Industry-Level Resume Building', icon: <FileText size={13} color="#2563EB" /> },
                { id: 'LinkedIn', label: 'LinkedIn Profile Optimization', icon: <Linkedin size={13} color="#0A66C2" /> },
                { id: 'Prep', label: 'Technical & HR Interview Prep Kit', icon: <UserCheck size={13} color="#059669" /> }
              ].map(tab => {
                const isActive = interviewFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setInterviewFilter(tab.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: isActive ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                      background: isActive ? '#FAF5FF' : '#FFFFFF',
                      color: isActive ? '#6D28D9' : '#475569',
                      fontWeight: 750,
                      fontSize: 12.5,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? '0 2px 6px rgba(124, 58, 237, 0.12)' : 'none'
                    }}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Media Format Filter: Videos vs PDFs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'all', label: 'All Formats' },
                { id: 'video', label: '🎬 Videos' },
                { id: 'document', label: '📄 PDFs / Guides' }
              ].map(fmt => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setInterviewTypeFilter(fmt.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: interviewTypeFilter === fmt.id ? '#1E293B' : '#FFFFFF',
                    color: interviewTypeFilter === fmt.id ? '#FFFFFF' : '#64748B',
                    fontSize: 11.5,
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. RESOURCES CARDS GRID ─── */}
      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={26} className="spin" style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 600 }}>Loading exclusive materials...</div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#F8FAFC',
          borderRadius: 16,
          border: '1.5px dashed #CBD5E1'
        }}>
          <FolderGit2 size={40} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#334155', margin: '0 0 6px' }}>
            No Materials Found in this Category
          </h3>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Materials uploaded via the Admin Portal will automatically appear here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 18
        }}>
          {filteredMaterials.map(mat => {
            const isCode = mat.type === 'code';
            const isDoc = mat.type === 'document' || mat.type === 'pdf';
            const isVid = mat.type === 'video';
            const hasWalkthroughVideo = Boolean(mat.videoUrl || mat.type === 'video');
            const hasRepoCode = Boolean(mat.fileUrl && mat.type !== 'video');

            return (
              <div
                key={mat.id}
                onClick={() => {
                  if (!isYearlyMember && onOpenRenewal) {
                    onOpenRenewal();
                  }
                }}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: isYearlyMember ? '1.5px solid #E2E8F0' : '1.5px solid #E2E8F0',
                  padding: '22px 22px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  boxShadow: '0 4px 14px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                  cursor: !isYearlyMember ? 'pointer' : 'default'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(15, 23, 42, 0.09)';
                  e.currentTarget.style.borderColor = isYearlyMember ? '#C7D2FE' : '#FCD34D';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px -2px rgba(15, 23, 42, 0.04)';
                  e.currentTarget.style.borderColor = '#E2E8F0';
                }}
              >
                {/* Header Badge Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {/* Category Track Tag */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      background: '#F1F5F9',
                      color: '#334155',
                      border: '1px solid #E2E8F0',
                      textTransform: 'uppercase'
                    }}>
                      {mat.category || (activeSection === 'projects' ? 'Project' : 'Interview Kit')}
                    </span>

                    {/* Media Type Tag (Code vs PDF vs Video) */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      borderRadius: 6,
                      fontSize: 10.5,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      background: isCode ? '#EFF6FF' : (isDoc ? '#FEF3C7' : '#FAF5FF'),
                      color: isCode ? '#1D4ED8' : (isDoc ? '#92400E' : '#7C3AED'),
                      border: isCode ? '1px solid #BFDBFE' : (isDoc ? '1px solid #FDE68A' : '1px solid #DDD6FE')
                    }}>
                      {isCode && <Code size={11} strokeWidth={2.4} />}
                      {isDoc && <FileText size={11} strokeWidth={2.4} />}
                      {isVid && <Play size={11} strokeWidth={2.4} />}
                      {isCode ? 'Codebase & Walkthrough' : (isDoc ? 'PDF Guide' : 'Video')}
                    </span>
                  </div>

                  {/* Status Indicator */}
                  {isYearlyMember ? (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      padding: '2px 8px',
                      borderRadius: 999
                    }}>
                      <CheckCircle2 size={12} color="#059669" /> Unlocked
                    </span>
                  ) : (
                    /* ── LOCKED FORMAT BADGE ── */
                    <span style={{
                      fontSize: 11,
                      fontWeight: 850,
                      color: '#DC2626',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: '#FEF2F2',
                      border: '1px solid #FECDD3',
                      padding: '2px 8px',
                      borderRadius: 999
                    }}>
                      <Lock size={11} color="#DC2626" /> 1-Year Locked
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 style={{
                  fontSize: 15.5,
                  fontWeight: 850,
                  color: '#0F172A',
                  margin: '0 0 8px',
                  lineHeight: 1.35
                }}>
                  {mat.title}
                </h3>
                <p style={{
                  fontSize: 12.5,
                  color: '#64748B',
                  lineHeight: 1.55,
                  margin: '0 0 16px',
                  flex: 1
                }}>
                  {mat.description}
                </p>

                {/* Tech Tags */}
                {Array.isArray(mat.tags) && mat.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 16 }}>
                    {mat.tags.map((t, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#F8FAFC',
                          color: '#475569',
                          fontSize: 10.5,
                          padding: '2px 8px',
                          borderRadius: 5,
                          fontWeight: 700,
                          border: '1px solid #E2E8F0'
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap'
                }}>
                  <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>
                    {mat.duration || mat.fileSize || (hasWalkthroughVideo ? 'HD Walkthrough' : (isDoc ? 'PDF Manual' : 'Full Repo'))}
                  </span>

                  {isYearlyMember ? (
                    /* ── UNLOCKED ACTIONS FOR YEARLY MEMBERS ── */
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {hasWalkthroughVideo && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlayingMaterial(mat);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '7px 13px',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                          }}
                        >
                          <Play size={11} fill="#FFF" /> Watch Video
                        </button>
                      )}

                      {hasRepoCode && (
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: '#EFF6FF',
                            color: '#1D4ED8',
                            border: '1.5px solid #BFDBFE',
                            textDecoration: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 750,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Download size={11} /> Open Repo
                        </a>
                      )}

                      {isDoc && (
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                            textDecoration: 'none',
                            padding: '7px 14px',
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                          }}
                        >
                          <FileText size={12} /> Open PDF Guide
                        </a>
                      )}
                    </div>
                  ) : (
                    /* ── LOCKED FORMAT ACTION FOR NON-YEARLY STUDENTS ── */
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenRenewal) onOpenRenewal();
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.18)',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Lock size={12} color="#FBBF24" /> Unlock with 1-Year Pass →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
