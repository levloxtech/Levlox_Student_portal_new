import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play, Pause, CheckCircle2, Check, Clock, ArrowLeft, ArrowRight,
  Download, Upload, Plus, Trash2, Bookmark, Star, FileText,
  Folder, Share2, Shield, ExternalLink, Sparkles, RotateCcw,
  Heart, Paperclip, X, AlertCircle, FileCode, Presentation, Video, Search
} from 'lucide-react';
import SecureVideoPlayer from './SecureVideoPlayer';
import {
  getLessonWatchProgress,
  saveWatchProgress,
  savePlaybackPosition,
  getPlaybackPosition,
  getLastWatchedLesson,
  toggleLessonCompletion,
  formatSecondsToDisplay,
  formatSecondsToClock,
  parseDurationToSeconds,
  getResolvedThumbnail
} from '../utils/videoUtils';
import { updatePlaylist, updateBatch } from '../services/firebaseService';

/**
 * AcademiaCourseViewer — High-Aesthetic 2-Column Course Learning Experience
 * Inspired by Academia modern LMS course view.
 */
const AcademiaCourseViewer = ({
  playlist,
  initialLessonId = null,
  onBack,
  onClose,
  userRole = 'student', // 'student' | 'admin' | 'trainer'
  userProfile = null,
  currentUser = null,
  onEditLesson = null,
  onDeleteLesson = null,
  onAddLesson = null,
}) => {
  const studentId = userProfile?.id || userProfile?.uid || currentUser?.uid || 'student';
  const watermarkText = `${userProfile?.fullName || userProfile?.name || currentUser?.displayName || 'Student'} • ${userProfile?.rollNumber || userProfile?.studentId || 'LVX'}`;

  const handleBack = () => {
    if (typeof onBack === 'function') {
      onBack();
    } else if (typeof onClose === 'function') {
      onClose();
    }
  };

  // Lessons list sorted strictly in sequential curriculum order (1, 2, 3...)
  const lessons = useMemo(() => {
    const list = [...(playlist?.lessons || [])];
    return list.sort((a, b) => {
      const orderA = a.sort_order ?? a.order ?? 999;
      const orderB = b.sort_order ?? b.order ?? 999;
      if (orderA !== orderB) return Number(orderA) - Number(orderB);
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [playlist]);

  // Determine initial lesson to play:
  const initialData = useMemo(() => {
    if (initialLessonId && lessons.length > 0) {
      const match = lessons.find(l => String(l.id || l.uid) === String(initialLessonId));
      if (match) return match;
    }
    return lessons[0] || null;
  }, [initialLessonId, lessons]);

  const [activeLesson, setActiveLesson] = useState(initialData || lessons[0] || null);
  const [sidebarTab, setSidebarTab] = useState('videos'); // 'videos' | 'resources'
  const [isFavourite, setIsFavourite] = useState(false);

  // Order-wise and module filter states (User requirement)
  const [videoSearchQuery, setVideoSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState('all');
  const [videoStatusFilter, setVideoStatusFilter] = useState('all'); // 'all' | 'in-progress' | 'completed'
  const [videoSortOption, setVideoSortOption] = useState('sequence'); // 'sequence' | 'alphabetical'

  // Playback & completion state for active lesson
  const [activeProgress, setActiveProgress] = useState(() => {
    if (!activeLesson) return { watchedSeconds: 0, completed: false, percentage: 0 };
    return getLessonWatchProgress(studentId, activeLesson.id || activeLesson.uid);
  });

  // Track all lesson completions for live sidebar re-rendering
  const [progressTick, setProgressTick] = useState(0);

  // Materials state (playlist-level + lesson-level)
  const computeAllMaterials = () => {
    const list = [];
    const seenUrls = new Set();

    const addMat = (m) => {
      if (!m) return;
      const url = m.file_url || m.url;
      if (!url) return;
      const key = `${url}_${m.title || m.name || ''}`;
      if (seenUrls.has(key)) return;
      seenUrls.add(key);
      list.push({
        id: m.id || `mat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        title: m.title || m.name || 'Resource Document',
        name: m.title || m.name || 'Resource Document',
        file_url: url,
        url: url,
        type: m.type || 'file',
        size: m.size || 'Resource Document',
        uploaded_at: m.uploaded_at || m.createdAt || null
      });
    };

    // 1. From playlist.study_materials
    const pMats = playlist?.study_materials || playlist?.studyMaterials || [];
    if (Array.isArray(pMats)) {
      pMats.forEach(addMat);
    }

    // 2. From lessons
    (lessons || []).forEach(l => {
      const noteUrl = l.notes_url || l.notesUrl;
      if (noteUrl) {
        addMat({
          id: `note_${l.id || l.uid}`,
          title: `${l.title || 'Lecture'} — Lecture Notes`,
          name: `${l.title || 'Lecture'} — Lecture Notes`,
          file_url: noteUrl,
          url: noteUrl,
          type: 'notes',
          size: 'Lecture Notes',
          uploaded_at: l.created_at || l.createdAt || null
        });
      }
      const lessonMats = l.study_materials || l.studyMaterials;
      if (Array.isArray(lessonMats)) {
        lessonMats.forEach(sm => {
          if (sm) {
            addMat({
              ...sm,
              title: sm.title || sm.name || `${l.title || 'Lecture'} Resource`,
              name: sm.title || sm.name || `${l.title || 'Lecture'} Resource`,
              file_url: sm.file_url || sm.url,
              url: sm.file_url || sm.url
            });
          }
        });
      }
      if (l.assignment) {
        const assignStr = String(l.assignment);
        if (assignStr.startsWith('http')) {
          addMat({
            id: `assign_${l.id || l.uid}`,
            title: `${l.title || 'Lecture'} — Assignment Task`,
            name: `${l.title || 'Lecture'} — Assignment Task`,
            file_url: assignStr,
            url: assignStr,
            type: 'task',
            size: 'Assignment Doc'
          });
        }
      }
    });

    return list;
  };

  const [materials, setMaterials] = useState(computeAllMaterials);

  // Sync materials when playlist or lessons update
  useEffect(() => {
    setMaterials(computeAllMaterials());
  }, [playlist, lessons]);

  // Material upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Sync active lesson progress when activeLesson changes
  useEffect(() => {
    if (!activeLesson) return;
    const p = getLessonWatchProgress(studentId, activeLesson.id || activeLesson.uid);
    setActiveProgress(p);
  }, [activeLesson, studentId]);

  // Switch active lesson
  const handleSelectLesson = (lesson) => {
    setActiveLesson(lesson);
  };

  // Distinct modules for filtering
  const availableModules = useMemo(() => {
    const set = new Set();
    lessons.forEach(l => {
      if (l.module) set.add(l.module);
    });
    return Array.from(set);
  }, [lessons]);

  // Filtered lessons in proper sequential order
  const filteredLessons = useMemo(() => {
    let list = [...lessons];
    if (selectedModuleFilter !== 'all') {
      list = list.filter(l => l.module === selectedModuleFilter);
    }
    if (videoStatusFilter === 'completed') {
      list = list.filter(l => {
        const p = getLessonWatchProgress(studentId, l.id || l.uid);
        return p.completed || l.isCompleted;
      });
    } else if (videoStatusFilter === 'in-progress') {
      list = list.filter(l => {
        const p = getLessonWatchProgress(studentId, l.id || l.uid);
        return (p.percentage || 0) > 0 && !(p.completed || l.isCompleted);
      });
    }
    if (videoSearchQuery.trim()) {
      const q = videoSearchQuery.toLowerCase();
      list = list.filter(l => 
        (l.title || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.module || '').toLowerCase().includes(q)
      );
    }
    if (videoSortOption === 'alphabetical') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => {
        const orderA = a.sort_order ?? a.order ?? 999;
        const orderB = b.sort_order ?? b.order ?? 999;
        if (orderA !== orderB) return Number(orderA) - Number(orderB);
        return (a.title || '').localeCompare(b.title || '');
      });
    }
    return list;
  }, [lessons, selectedModuleFilter, videoStatusFilter, videoSearchQuery, videoSortOption, studentId, progressTick]);

  // Progress update callback from SecureVideoPlayer
  const handleProgressUpdate = (result) => {
    if (result) {
      setActiveProgress(result);
      setProgressTick(prev => prev + 1);
    }
  };

  // Toggle completion button in main player
  const handleToggleCompletion = () => {
    if (!activeLesson) return;
    const lessonKey = activeLesson.id || activeLesson.uid;
    const updated = toggleLessonCompletion(studentId, lessonKey, !activeProgress.completed);
    if (updated) {
      setActiveProgress(updated);
      setProgressTick(prev => prev + 1);
    }
  };

  // Handle uploading study material to this playlist
  const handleMaterialUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a title for this material.');
      return;
    }
    if (!uploadFile && !uploadLink.trim()) {
      setUploadError('Please select a file to upload or enter an external document URL.');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = uploadLink.trim();
      let fileSize = null;
      let detectedType = 'document';

      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('folder', 'playlist_materials');

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload document file');
        }

        const data = await res.json();
        finalUrl = data.url || data.relativePath;
        fileSize = uploadFile.size ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : '1.2 MB';
        const name = uploadFile.name.toLowerCase();
        if (name.endsWith('.pdf')) detectedType = 'pdf';
        else if (name.endsWith('.ppt') || name.endsWith('.pptx')) detectedType = 'slides';
        else if (name.endsWith('.zip') || name.endsWith('.rar')) detectedType = 'archive';
        else if (name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.html')) detectedType = 'code';
      }

      const newMaterial = {
        id: `mat_${Date.now()}`,
        title: uploadTitle.trim(),
        file_url: finalUrl,
        type: detectedType,
        size: fileSize || 'Document Link',
        uploaded_at: new Date().toISOString(),
        uploaded_by: userProfile?.fullName || userRole
      };

      const updatedMaterials = [newMaterial, ...materials];
      setMaterials(updatedMaterials);

      // Persist to Firestore playlist document
      if (playlist?.id) {
        if (playlist.isBatch) {
          await updateBatch(playlist.id, { study_materials: updatedMaterials }).catch(console.warn);
        } else {
          await updatePlaylist(playlist.id, { study_materials: updatedMaterials }).catch(console.warn);
        }
      }

      // Reset form
      setUploadTitle('');
      setUploadLink('');
      setUploadFile(null);
      setShowUploadModal(false);
    } catch (err) {
      console.error('Error uploading material:', err);
      setUploadError(err.message || 'Error occurred while saving material.');
    } finally {
      setUploading(false);
    }
  };

  // Delete material (admin/trainer)
  const handleDeleteMaterial = async (matId) => {
    if (!window.confirm('Delete this study material from the playlist?')) return;
    const updated = materials.filter(m => m.id !== matId);
    setMaterials(updated);
    if (playlist?.id) {
      if (playlist.isBatch) {
        await updateBatch(playlist.id, { study_materials: updated }).catch(console.warn);
      } else {
        await updatePlaylist(playlist.id, { study_materials: updated }).catch(console.warn);
      }
    }
  };

  // Calculate overall completed lessons
  const completedCount = useMemo(() => {
    return lessons.filter(l => {
      const p = getLessonWatchProgress(studentId, l.id || l.uid);
      return p.completed || l.isCompleted;
    }).length;
  }, [lessons, studentId, progressTick]);

  const activeIndex = lessons.findIndex(l => String(l.id || l.uid) === String(activeLesson?.id || activeLesson?.uid));

  // Instructor profile fallback
  const instructorName = playlist?.instructor || playlist?.trainer_name || 'Senior Academic Faculty';
  const instructorAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

  return (
    <div style={{
      maxWidth: 1440,
      margin: '0 auto',
      padding: '16px 24px 60px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#0F172A',
    }}>

      {/* ── BREADCRUMB & BACK NAVIGATION (Image 2 style) ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleBack}
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
              transition: 'all 0.18s ease',
            }}
            title="Back to Playlists"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5 }}>
            <span
              onClick={handleBack}
              style={{ color: '#6366F1', fontWeight: 700, cursor: 'pointer' }}
            >
              Courses
            </span>
            <span style={{ color: '#94A3B8' }}>›</span>
            <span style={{ color: '#64748B', fontWeight: 600 }}>
              {playlist?.name || playlist?.title || 'Course Playlist'}
            </span>
            {activeLesson && (
              <>
                <span style={{ color: '#94A3B8' }}>›</span>
                <span style={{ color: '#0F172A', fontWeight: 700, maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeLesson.title}
                </span>
              </>
            )}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Status pill badge on top right */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            fontSize: 12.5,
            fontWeight: 650,
          }}>
            <span style={{ color: '#64748B' }}>Course Progress:</span>
            <span style={{ color: completedCount === lessons.length && lessons.length > 0 ? '#059669' : '#6366F1', fontWeight: 800 }}>
              {completedCount} / {lessons.length} Completed
            </span>
            <div style={{ width: 60, height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                width: `${lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                borderRadius: 999,
              }} />
            </div>
          </div>

          {(onBack || onClose) && (
            <button
              type="button"
              onClick={handleBack}
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
                boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
                transition: 'all 0.15s ease',
              }}
              title="Close Course Player"
            >
              <X size={14} />
              <span>Close Player</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN ACADEMIA THEATER LAYOUT ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.9fr) minmax(320px, 1fr)',
        gap: 28,
        alignItems: 'start',
      }}>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: PLAYER + UNDER-BAR + TITLE + SYLLABUS + INSTRUCTOR */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* 1. Large Embedded Video Player */}
          <div style={{
            background: '#09090B',
            borderRadius: 22,
            overflow: 'hidden',
            boxShadow: '0 16px 40px -10px rgba(15, 23, 42, 0.18)',
            position: 'relative',
            aspectRatio: '16/9',
            border: '1px solid rgba(226, 232, 240, 0.8)',
          }}>
            {activeLesson ? (
              <SecureVideoPlayer
                key={activeLesson.id || activeLesson.uid}
                videoUrl={activeLesson.video_url || activeLesson.url || ''}
                title={activeLesson.title}
                watermarkText={watermarkText}
                lessonId={activeLesson.id || activeLesson.uid}
                studentId={studentId}
                playlistId={playlist?.id}
                totalDurationSeconds={activeLesson.durationSeconds || parseDurationToSeconds(activeLesson.duration)}
                onProgressUpdate={handleProgressUpdate}
                autoPlay={true}
                height="100%"
              />
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 12,
                color: '#94A3B8',
              }}>
                <Video size={48} opacity={0.5} />
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>No video selected</p>
              </div>
            )}
          </div>

          {/* 2. Under-Player Meta & Action Bar (Image 2 style) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            padding: '14px 20px',
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            {/* Left Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {activeLesson?.module || playlist?.course_name || 'Core Module'}
              </span>

              <span style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {playlist?.batch_name || 'Live Class Replay'}
              </span>

              <span style={{
                padding: '5px 12px',
                borderRadius: 999,
                background: '#F1F5F9',
                color: '#475569',
                fontSize: 12,
                fontWeight: 700,
              }}>
                {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
              </span>
            </div>

            {/* Right Action: Pure Active Watch Percentage + Mark Completed (User's Exact Requirement) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {/* Active Watch Rate & Time Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 999,
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#1D4ED8',
                fontSize: 12.5,
                fontWeight: 750,
              }}>
                <Clock size={14} color="#2563EB" />
                <span>
                  Watched: {formatSecondsToClock(activeProgress?.watchedSeconds || 0)} / {formatSecondsToDisplay(activeLesson?.durationSeconds || parseDurationToSeconds(activeLesson?.duration))} ({activeProgress?.percentage || 0}%)
                </span>
                <div style={{ width: 48, height: 6, background: '#DBEAFE', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${activeProgress?.percentage || 0}%`, height: '100%', background: '#2563EB', borderRadius: 999 }} />
                </div>
              </div>

              {/* Action 2: Mark as Completed Toggle */}
              <button
                type="button"
                onClick={handleToggleCompletion}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: activeProgress.completed ? 'none' : '1.5px solid #CBD5E1',
                  background: activeProgress.completed
                    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                    : '#FFFFFF',
                  color: activeProgress.completed ? '#FFFFFF' : '#334155',
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: 'pointer',
                  boxShadow: activeProgress.completed
                    ? '0 4px 14px rgba(16, 185, 129, 0.3)'
                    : 'none',
                  transition: 'all 0.18s ease',
                }}
                title="Toggle Video Completed status"
              >
                <CheckCircle2 size={15} color={activeProgress.completed ? '#FFFFFF' : '#10B981'} />
                <span>{activeProgress.completed ? '✓ Completed' : 'Mark as Completed'}</span>
              </button>

              {/* Add to Favourite (Heart pill) */}
              <button
                type="button"
                onClick={() => setIsFavourite(!isFavourite)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 999,
                  border: '1.5px solid #E2E8F0',
                  background: isFavourite ? '#FFF1F2' : '#FFFFFF',
                  color: isFavourite ? '#E11D48' : '#64748B',
                  fontSize: 13,
                  fontWeight: 650,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                }}
              >
                <Heart size={14} fill={isFavourite ? '#E11D48' : 'none'} />
                <span>{isFavourite ? 'Favourited' : 'Add to Favourite'}</span>
              </button>
            </div>
          </div>

          {/* 3. Course / Lesson Title & Comprehensive Overview */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '24px 28px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}>
            <h1 style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 12px',
              letterSpacing: '-0.3px',
              lineHeight: 1.3,
            }}>
              {activeLesson?.title || playlist?.title || 'Interactive Course Lesson'}
            </h1>

            <p style={{
              fontSize: 14,
              color: '#475569',
              lineHeight: 1.7,
              margin: '0 0 18px',
            }}>
              {activeLesson?.description || playlist?.description ||
                'In this comprehensive session, we delve into foundational concepts, practical architecture patterns, and live coding exercises designed to prepare you for real-world enterprise engineering.'}
            </p>

            {/* Syllabus highlight points (matching Academia overview) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              paddingTop: 16,
              borderTop: '1px solid #F1F5F9',
            }}>
              <div>
                <strong style={{ fontSize: 13.5, color: '#1E293B' }}>
                  {activeLesson?.module || 'Module Curriculum'}:
                </strong>
                <span style={{ fontSize: 13.5, color: '#64748B', marginLeft: 6 }}>
                  Learn systematic methods, industry best practices, and practical debugging workflows through instructor-led demonstrations and real-world code walkthroughs.
                </span>
              </div>

              <div>
                <strong style={{ fontSize: 13.5, color: '#1E293B' }}>
                  Interactive Practice:
                </strong>
                <span style={{ fontSize: 13.5, color: '#64748B', marginLeft: 6 }}>
                  Refer to the resources tab on the right to download project files, slides, and supplementary lecture notes.
                </span>
              </div>
            </div>
          </div>

        </div>


        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: TABS (ALL VIDEOS | RESOURCES) + PLAYLIST SIDEBAR */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 22,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>

          {/* Top Pill Tabs Switcher (Image 2 style: All Videos | Resources | Support) */}
          <div style={{
            padding: '16px 18px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{
              display: 'inline-flex',
              background: '#F1F5F9',
              padding: 4,
              borderRadius: 999,
              gap: 4,
              width: '100%',
            }}>
              <button
                type="button"
                onClick={() => setSidebarTab('videos')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: sidebarTab === 'videos' ? 750 : 600,
                  background: sidebarTab === 'videos' ? '#FFFFFF' : 'transparent',
                  color: sidebarTab === 'videos' ? '#6366F1' : '#64748B',
                  boxShadow: sidebarTab === 'videos' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>All Videos</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 800,
                  background: sidebarTab === 'videos' ? '#EEF2FF' : 'rgba(0,0,0,0.05)',
                  color: sidebarTab === 'videos' ? '#4F46E5' : '#64748B',
                }}>
                  {lessons.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('resources')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12.5,
                  fontWeight: sidebarTab === 'resources' ? 750 : 600,
                  background: sidebarTab === 'resources' ? '#FFFFFF' : 'transparent',
                  color: sidebarTab === 'resources' ? '#6366F1' : '#64748B',
                  boxShadow: sidebarTab === 'resources' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.18s ease',
                }}
              >
                <span>Resources</span>
                <span style={{
                  padding: '1px 6px',
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 800,
                  background: sidebarTab === 'resources' ? '#EEF2FF' : 'rgba(0,0,0,0.05)',
                  color: sidebarTab === 'resources' ? '#4F46E5' : '#64748B',
                }}>
                  {materials.length}
                </span>
              </button>
            </div>
          </div>

          {/* ── TAB 1: ALL VIDEOS PLAYLIST ── */}
          {sidebarTab === 'videos' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 680,
              overflowY: 'auto',
              padding: '12px 14px',
              gap: 10,
            }}>
              {/* Order-Wise Search & Filter Toolbar (User requirement) */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingBottom: 10,
                borderBottom: '1px solid #F1F5F9',
              }}>
                {/* Search Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '6px 10px',
                  gap: 8,
                }}>
                  <Search size={14} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Search lessons..."
                    value={videoSearchQuery}
                    onChange={(e) => setVideoSearchQuery(e.target.value)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: 12,
                      width: '100%',
                      color: '#0F172A',
                    }}
                  />
                  {videoSearchQuery && (
                    <button
                      onClick={() => setVideoSearchQuery('')}
                      style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, color: '#94A3B8' }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Controls: Module Filter + Status Tabs */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
                  {availableModules.length > 0 && (
                    <select
                      value={selectedModuleFilter}
                      onChange={(e) => setSelectedModuleFilter(e.target.value)}
                      style={{
                        padding: '5px 8px',
                        borderRadius: 8,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: '#475569',
                        outline: 'none',
                        cursor: 'pointer',
                        maxWidth: 160,
                      }}
                    >
                      <option value="all">All Modules ({lessons.length})</option>
                      {availableModules.map(mod => (
                        <option key={mod} value={mod}>{mod}</option>
                      ))}
                    </select>
                  )}

                  <div style={{ display: 'inline-flex', gap: 3, background: '#F1F5F9', padding: 2, borderRadius: 8 }}>
                    <button
                      type="button"
                      onClick={() => setVideoStatusFilter('all')}
                      style={{
                        padding: '3px 8px',
                        border: 'none',
                        borderRadius: 6,
                        background: videoStatusFilter === 'all' ? '#FFFFFF' : 'transparent',
                        color: videoStatusFilter === 'all' ? '#2563EB' : '#64748B',
                        fontSize: 11,
                        fontWeight: videoStatusFilter === 'all' ? 750 : 600,
                        cursor: 'pointer',
                        boxShadow: videoStatusFilter === 'all' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoStatusFilter('in-progress')}
                      style={{
                        padding: '3px 8px',
                        border: 'none',
                        borderRadius: 6,
                        background: videoStatusFilter === 'in-progress' ? '#FFFFFF' : 'transparent',
                        color: videoStatusFilter === 'in-progress' ? '#2563EB' : '#64748B',
                        fontSize: 11,
                        fontWeight: videoStatusFilter === 'in-progress' ? 750 : 600,
                        cursor: 'pointer',
                        boxShadow: videoStatusFilter === 'in-progress' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      In Progress
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoStatusFilter('completed')}
                      style={{
                        padding: '3px 8px',
                        border: 'none',
                        borderRadius: 6,
                        background: videoStatusFilter === 'completed' ? '#FFFFFF' : 'transparent',
                        color: videoStatusFilter === 'completed' ? '#059669' : '#64748B',
                        fontSize: 11,
                        fontWeight: videoStatusFilter === 'completed' ? 750 : 600,
                        cursor: 'pointer',
                        boxShadow: videoStatusFilter === 'completed' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Items */}
              {filteredLessons.length === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94A3B8' }}>
                  <Video size={32} opacity={0.4} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No videos match your filter</p>
                </div>
              ) : (
                filteredLessons.map((lesson, idx) => {
                  const lessonKey = lesson.id || lesson.uid;
                  const isActive = String(activeLesson?.id || activeLesson?.uid) === String(lessonKey);
                  const p = getLessonWatchProgress(studentId, lessonKey);
                  const isLessonCompleted = p.completed || lesson.isCompleted;
                  const progressPct = p?.percentage || 0;

                  return (
                    <div
                      key={lessonKey || idx}
                      onClick={() => handleSelectLesson(lesson)}
                      style={{
                        padding: '11px 13px',
                        borderRadius: 14,
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        background: isActive
                          ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                          : '#FFFFFF',
                        border: isActive ? '1px solid transparent' : '1px solid #F1F5F9',
                        boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.25)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = '#F8FAFC';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = '#FFFFFF';
                      }}
                    >
                      {/* Play / Status Icon Box */}
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: isActive ? 'rgba(255, 255, 255, 0.2)' : isLessonCompleted ? '#ECFDF5' : '#EFF6FF',
                        color: isActive ? '#FFFFFF' : isLessonCompleted ? '#059669' : '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {isLessonCompleted ? (
                          <Check size={16} strokeWidth={3} />
                        ) : (
                          <Play size={13} fill={isActive ? '#FFFFFF' : '#2563EB'} style={{ marginLeft: 2 }} />
                        )}
                      </div>

                      {/* Title & Active Watch Percentage Rate (User requirement) */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: isActive ? 750 : 650,
                          color: isActive ? '#FFFFFF' : '#1E293B',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.3,
                        }}>
                          {idx + 1}. {lesson.title}
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginTop: 3,
                          fontSize: 11,
                          color: isActive ? 'rgba(255, 255, 255, 0.85)' : '#64748B',
                        }}>
                          <span>{lesson.duration || '45m'}</span>
                          <span>•</span>
                          <span style={{ color: isActive ? '#FFFFFF' : isLessonCompleted ? '#059669' : '#2563EB', fontWeight: 700 }}>
                            {isLessonCompleted ? '100% Watched' : `${progressPct}% active`}
                          </span>
                        </div>
                      </div>

                      {/* ── THE EXPLICIT VIDEO COMPLETED TAG ── */}
                      {isLessonCompleted && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 8px',
                          borderRadius: 999,
                          fontSize: 10.5,
                          fontWeight: 800,
                          background: isActive ? 'rgba(255, 255, 255, 0.25)' : '#ECFDF5',
                          color: isActive ? '#FFFFFF' : '#059669',
                          border: isActive ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid #A7F3D0',
                          flexShrink: 0,
                        }}>
                          <Check size={11} strokeWidth={3} />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB 2: RESOURCES & PLAYLIST STUDY MATERIALS (User's Requirement) ── */}
          {sidebarTab === 'resources' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 640,
              overflowY: 'auto',
              padding: '14px',
              gap: 12,
            }}>
              {/* Upload Material Action Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 10,
                borderBottom: '1px solid #F1F5F9',
              }}>
                <span style={{ fontSize: 12.5, fontWeight: 750, color: '#1E293B' }}>
                  Study Attachments
                </span>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: 'none',
                    background: '#6366F1',
                    color: '#FFFFFF',
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(99, 102, 241, 0.25)',
                  }}
                >
                  <Plus size={13} />
                  <span>Upload Material</span>
                </button>
              </div>

              {/* Inline Upload Form Dialog */}
              {showUploadModal && (
                <form
                  onSubmit={handleMaterialUploadSubmit}
                  style={{
                    background: '#F8FAFC',
                    borderRadius: 14,
                    padding: 14,
                    border: '1.5px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12.5, fontWeight: 750, color: '#0F172A' }}>
                      Add Playlist Resource
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {uploadError && (
                    <div style={{ fontSize: 11.5, color: '#EF4444', background: '#FEF2F2', padding: '6px 10px', borderRadius: 8 }}>
                      {uploadError}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Document Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Module 1 Cheat Sheet & Cheats"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Attach File (PDF, PPT, Code, Zip)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setUploadFile(e.target.files[0] || null)}
                      style={{
                        width: '100%',
                        fontSize: 11.5,
                        color: '#475569',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Or External Google Drive / Doc URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://drive.google.com/..."
                      value={uploadLink}
                      onChange={(e) => setUploadLink(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 12,
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => setShowUploadModal(false)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#6366F1',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {uploading ? 'Uploading...' : 'Save Material'}
                    </button>
                  </div>
                </form>
              )}

              {/* Materials List */}
              {materials.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                  <FileText size={36} opacity={0.4} style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>No study materials yet</p>
                  <p style={{ fontSize: 11.5, color: '#94A3B8', margin: 0 }}>
                    Click "Upload Material" above to add documents, PDFs, or lecture notes.
                  </p>
                </div>
              ) : (
                materials.map((mat, idx) => (
                  <div
                    key={mat.id || idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#EEF2FF',
                        color: '#6366F1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {mat.type === 'slides' ? (
                          <Presentation size={16} />
                        ) : mat.type === 'code' ? (
                          <FileCode size={16} />
                        ) : (
                          <FileText size={16} />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}>
                          {mat.title || mat.name || 'Resource File'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          {mat.size || 'Resource Document'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <a
                        href={mat.file_url || mat.url}
                        target="_blank"
                        rel="noreferrer"
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '6px 10px',
                          borderRadius: 8,
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          color: '#0F172A',
                          fontSize: 11.5,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <Download size={12} />
                        <span>Open</span>
                      </a>

                      {(userRole === 'admin' || userRole === 'trainer') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(mat.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: 4,
                            borderRadius: 6,
                          }}
                          title="Remove material"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AcademiaCourseViewer;
