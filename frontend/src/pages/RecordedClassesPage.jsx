import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Lock, FileText, Calendar, Clock, 
  ArrowRight, ArrowLeft, Download, AlertCircle, 
  BookOpen, Search, Shield, Flag, X, Check,
  Sparkles, ExternalLink, Video, CheckCircle2, Globe, Folder,
  LayoutGrid, MoreHorizontal, Award, Star, Trophy, Users,
  CheckCircle, PlayCircle, Eye, Share2, BookmarkCheck, ChevronRight,
  GraduationCap, Flame, PlaySquare
} from 'lucide-react';
import { getRecordedClasses, getPlaylists, getCourses, classifyFirestoreError } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import workspace3D from '../assets/levlox-workspace-3d.png';
import levloxLogo from '../assets/levlox-logo.png';
import { 
  getResolvedThumbnail,
  parseDurationToSeconds,
  formatSecondsToDisplay,
  formatSecondsToClock,
  getAllWatchProgress,
  getLessonWatchProgress,
  saveWatchProgress,
  saveRecentlyViewedVideo
} from '../utils/videoUtils';

/* ── Error Boundary ─────────────────────────────────────────────────────────── */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('RecordedClassesPage error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 640, margin: '40px auto', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: '#1E293B' }}>Playback Service Unavailable</h3>
          <p style={{ fontSize: 13.5, color: '#64748B', marginBottom: 16 }}>An error occurred while loading your courses.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 24px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 999, cursor: 'pointer', fontWeight: 700 }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const RecordedClassesPage = ({
  initialCourseId = null,
  initialLessonId = null,
  recordedClasses = null,
  customPlaylists = null,
  isPaid = true,
}) => {
  const { userProfile, currentUser } = useAuth();
  const studentId = userProfile?.id || userProfile?.uid || currentUser?.uid || 'student';
  const studentBatchId = userProfile?.batch_id || userProfile?.batchId || currentUser?.batch_id || currentUser?.batchId || '';
  const studentBatchName = userProfile?.batch_name || userProfile?.batch || currentUser?.batch_name || currentUser?.batch || '';
  const watermarkText = `${userProfile?.name || currentUser?.displayName || 'Student'} • ${userProfile?.rollNumber || userProfile?.studentId || 'LVX'}`;

  // Data states
  const [coursesList, setCoursesList] = useState([]);
  const [recordingsList, setRecordingsList] = useState(recordedClasses || []);
  const [playlistsList, setPlaylistsList] = useState(customPlaylists || []);
  const [loading, setLoading] = useState(true);

  // Active category filter tab: 'all' | 'in-progress' | 'completed' | 'not-started'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drilldown states:
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activePlayingLesson, setActivePlayingLesson] = useState(null);
  const [courseDetailsModal, setCourseDetailsModal] = useState(null);
  const [moreMenuCourseId, setMoreMenuCourseId] = useState(null);

  // Watch progress map
  const [watchProgressMap, setWatchProgressMap] = useState(() => getAllWatchProgress(studentId));

  const refreshWatchProgress = () => {
    setWatchProgressMap(getAllWatchProgress(studentId));
  };

  // Fetch all real courses, recordings & playlists from localDb/backend
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCourses, fetchedRecs, fetchedPlaylists] = await Promise.all([
        getCourses().catch(() => []),
        getRecordedClasses().catch(() => []),
        getPlaylists().catch(() => [])
      ]);

      setCoursesList(Array.isArray(fetchedCourses) ? fetchedCourses : []);
      setRecordingsList(Array.isArray(fetchedRecs) ? fetchedRecs : []);
      setPlaylistsList(Array.isArray(fetchedPlaylists) ? fetchedPlaylists : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCoursesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePlayLesson = (lesson, course = null) => {
    if (!lesson) return;
    const targetCourse = course || selectedCourse;
    saveRecentlyViewedVideo(studentId, {
      ...lesson,
      courseId: targetCourse?.id,
      courseTitle: targetCourse?.title || targetCourse?.name || 'Class Lecture',
      category: targetCourse?.category || 'Curriculum',
    });
    setActivePlayingLesson(lesson);
  };

  // 100% Dynamic Playlists & Courses mapped with Real Progress & Batch Filtering
  const dynamicCourses = useMemo(() => {
    const list = [];
    const normalizedBatchId = String(studentBatchId || '').trim().toLowerCase();
    const normalizedBatchName = String(studentBatchName || '').trim().toLowerCase();

    // 1. Process custom Playlists
    (playlistsList || []).forEach((pl) => {
      if (!pl || !pl.name) return;
      const plId = String(pl.id || pl.uid);
      const plBatchId = String(pl.batch_id || pl.batchId || '').trim().toLowerCase();
      const plBatchName = String(pl.batch_name || pl.batchName || '').trim().toLowerCase();
      const isBatchRestricted = pl.access_type === 'batch' || (plBatchId && plBatchId !== 'all' && pl.visibility !== 'everyone');

      // Visibility check: If batch-restricted, student MUST belong to that batch
      if (isBatchRestricted) {
        const matchesBatch = (normalizedBatchId && plBatchId === normalizedBatchId) ||
                             (normalizedBatchName && plBatchName === normalizedBatchName) ||
                             (normalizedBatchName && plBatchId === normalizedBatchName);
        if (!matchesBatch) return; // Hide from this student!
      }

      // Find all lessons for this playlist
      const relatedVideos = (recordingsList || []).filter((r) => {
        const rPlId = String(r.playlist_id || r.playlistId || '');
        const rBatchId = String(r.batch_id || r.batchId || '');
        const rPlName = (r.playlist_name || r.playlistName || '').toLowerCase().trim();
        return rPlId === plId || (rBatchId === plId) || (rPlName && rPlName === pl.name.toLowerCase().trim());
      });

      // Calculate real dynamic progress for this playlist
      let completedLessonsCount = 0;
      let totalWatchedSeconds = 0;
      relatedVideos.forEach((v) => {
        const vId = v.id || v.uid;
        const prog = watchProgressMap[vId];
        if (prog?.completed || (prog?.progress && prog.progress >= 90)) {
          completedLessonsCount++;
        }
        if (prog?.currentTime) {
          totalWatchedSeconds += prog.currentTime;
        }
      });

      const totalLessons = relatedVideos.length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
      const status = progressPercent === 100 ? 'Completed' : (progressPercent > 0 ? 'In Progress' : 'Not Started');

      list.push({
        id: plId,
        courseId: plId,
        title: pl.name,
        name: pl.name,
        category: pl.course_name || pl.category || 'Curated Series',
        description: pl.description || 'Comprehensive cohort curriculum and lecture recordings.',
        thumbnail: pl.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        trainer_name: pl.trainer_name || 'Faculty Trainer',
        trainer_avatar: pl.trainer_avatar || null,
        lessons: relatedVideos,
        lessons_count: totalLessons,
        completed_lessons: completedLessonsCount,
        progress: progressPercent,
        status: status,
        duration: pl.duration || (totalLessons > 0 ? `${totalLessons * 45} mins` : 'Flexible'),
        is_playlist: true,
        batch_name: pl.batch_name || (isBatchRestricted ? 'Cohort Exclusive' : 'Open Access'),
        updatedAt: pl.updatedAt || pl.createdAt || null
      });
    });

    // 2. Process Courses from coursesList (if distinct from playlists)
    (coursesList || []).forEach((c) => {
      if (!c || (!c.title && !c.name)) return;
      const cId = String(c.id || c.uid);
      const cTitle = c.title || c.name;
      // Skip if already represented by playlist with same name
      if (list.some(item => item.title.toLowerCase().trim() === cTitle.toLowerCase().trim())) return;

      const cBatchId = String(c.batch_id || c.batchId || '').trim().toLowerCase();
      const isBatchRestricted = c.access_type === 'batch' || (cBatchId && cBatchId !== 'all' && c.visibility !== 'everyone');
      if (isBatchRestricted) {
        const matchesBatch = (normalizedBatchId && cBatchId === normalizedBatchId);
        if (!matchesBatch) return;
      }

      const relatedVideos = (recordingsList || []).filter((r) => {
        const rCourseId = String(r.course_id || r.courseId || '');
        const rCourseTitle = (r.course_title || r.course_name || '').toLowerCase().trim();
        return rCourseId === cId || (rCourseTitle && rCourseTitle === cTitle.toLowerCase().trim());
      });

      let completedLessonsCount = 0;
      relatedVideos.forEach((v) => {
        const vId = v.id || v.uid;
        const prog = watchProgressMap[vId];
        if (prog?.completed || (prog?.progress && prog.progress >= 90)) completedLessonsCount++;
      });

      const totalLessons = relatedVideos.length;
      const progressPercent = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
      const status = progressPercent === 100 ? 'Completed' : (progressPercent > 0 ? 'In Progress' : 'Not Started');

      list.push({
        id: cId,
        courseId: cId,
        title: cTitle,
        name: cTitle,
        category: c.category || 'Specialization',
        description: c.description || 'Industry-standard technical modules and recorded sessions.',
        thumbnail: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80',
        trainer_name: c.trainer_name || 'Levlox Instructor',
        trainer_avatar: null,
        lessons: relatedVideos,
        lessons_count: totalLessons,
        completed_lessons: completedLessonsCount,
        progress: progressPercent,
        status: status,
        duration: c.duration || (totalLessons > 0 ? `${totalLessons * 45} mins` : 'Flexible'),
        is_playlist: false,
        batch_name: c.batch_name || 'Open Access',
        updatedAt: c.updatedAt || c.createdAt || null
      });
    });

    return list;
  }, [playlistsList, coursesList, recordingsList, watchProgressMap, studentBatchId, studentBatchName]);

  // Dynamic Currently Learning Course:
  // Pick the course the student is actively progressing in, or the one with lessons, or null
  const currentlyLearningCourse = useMemo(() => {
    if (dynamicCourses.length === 0) return null;
    // Prefer one with progress > 0 and < 100
    const inProgress = dynamicCourses.find(c => c.progress > 0 && c.progress < 100);
    if (inProgress) return inProgress;
    // Else prefer one with lessons
    const hasLessons = dynamicCourses.find(c => c.lessons_count > 0);
    if (hasLessons) return hasLessons;
    // Fallback to first course in list
    return dynamicCourses[0];
  }, [dynamicCourses]);

  // Overall Dynamic Statistics
  const progressStats = useMemo(() => {
    if (dynamicCourses.length === 0) {
      return { percent: 0, completed: 0, inProgress: 0, notStarted: 0, totalCourses: 0, totalLessons: 0, completedLessons: 0, totalHours: '0h 0m' };
    }
    const totalCourses = dynamicCourses.length;
    const completed = dynamicCourses.filter(c => c.status === 'Completed').length;
    const inProgress = dynamicCourses.filter(c => c.status === 'In Progress').length;
    const notStarted = dynamicCourses.filter(c => c.status === 'Not Started').length;

    let totalLessonsAll = 0;
    let totalCompletedLessonsAll = 0;
    let totalSecondsWatched = 0;

    dynamicCourses.forEach(c => {
      totalLessonsAll += (c.lessons_count || 0);
      totalCompletedLessonsAll += (c.completed_lessons || 0);
      (c.lessons || []).forEach(l => {
        const prog = watchProgressMap[l.id || l.uid];
        if (prog?.currentTime) totalSecondsWatched += prog.currentTime;
      });
    });

    const percent = totalLessonsAll > 0 ? Math.round((totalCompletedLessonsAll / totalLessonsAll) * 100) : 0;
    const hours = Math.floor(totalSecondsWatched / 3600);
    const mins = Math.floor((totalSecondsWatched % 3600) / 60);

    return {
      percent,
      completed,
      inProgress,
      notStarted,
      totalCourses,
      totalLessons: totalLessonsAll,
      completedLessons: totalCompletedLessonsAll,
      totalHours: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    };
  }, [dynamicCourses, watchProgressMap]);

  // Filtered Courses based on Category Tabs and Search
  const filteredCourses = useMemo(() => {
    return dynamicCourses.filter(c => {
      if (categoryFilter === 'in-progress' && c.status !== 'In Progress') return false;
      if (categoryFilter === 'completed' && c.status !== 'Completed') return false;
      if (categoryFilter === 'not-started' && c.status !== 'Not Started') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (c.title || '').toLowerCase().includes(q);
        const matchCat = (c.category || '').toLowerCase().includes(q);
        const matchTrainer = (c.trainer_name || '').toLowerCase().includes(q);
        if (!matchTitle && !matchCat && !matchTrainer) return false;
      }
      return true;
    });
  }, [dynamicCourses, categoryFilter, searchQuery]);

  // Active Course Lessons for Drilldown
  const activeCourseLessons = useMemo(() => {
    if (!selectedCourse) return [];
    return (selectedCourse.lessons || []).map((v, idx) => ({
      ...v,
      id: v.id || v.uid || `lesson_${idx + 1}`,
      title: v.title || v.topic || `Lecture ${idx + 1}`,
      sort_order: v.sort_order || idx + 1,
      duration: v.duration || '45m',
      video_url: v.video_url || v.videoUrl || v.url,
      thumbnail: v.thumbnail || selectedCourse.thumbnail,
      notes_url: v.notes_url || v.notesUrl || null,
      study_materials: v.study_materials || v.studyMaterials || []
    }));
  }, [selectedCourse]);

  return (
    <div className="levlox-courses-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── 1. TOP LEARNING BANNER (UDEMY-INSPIRED EXPERIENCE) ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #1E293B 100%)',
        borderRadius: 20,
        padding: '24px 30px',
        color: '#FFFFFF',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(30, 27, 75, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div style={{ zIndex: 2, maxWidth: 580 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.12)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, marginBottom: 12 }}>
            <Sparkles size={13} color="#FBBF24" />
            <span>Welcome to Your Learning Campus</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 850, margin: '0 0 8px', letterSpacing: '-0.4px', lineHeight: 1.25 }}>
            Accelerate Your Technical Career
          </h1>
          <p style={{ fontSize: 13.5, color: '#C7D2FE', margin: 0, lineHeight: 1.5 }}>
            Explore on-demand lectures, practical code walkthroughs, and recorded sessions assigned to your batch.
          </p>
        </div>

        {/* Right side quick count */}
        <div style={{ zIndex: 2, display: 'flex', gap: 14 }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 14, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 850, color: '#A5B4FC' }}>{progressStats.totalCourses}</div>
            <div style={{ fontSize: 11, color: '#E0E7FF', fontWeight: 600 }}>Active Courses</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 14, padding: '12px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 850, color: '#34D399' }}>{progressStats.completed}</div>
            <div style={{ fontSize: 11, color: '#E0E7FF', fontWeight: 600 }}>Completed</div>
          </div>
        </div>
      </div>

      {/* ─── 2. MIDDLE ROW: DYNAMIC CURRENTLY LEARNING & REAL COURSE PROGRESS ─── */}
      {/* ONLY RENDER WHEN REAL COURSES EXIST FOR THE STUDENT */}
      {dynamicCourses.length > 0 && currentlyLearningCourse && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1.15fr)', gap: 20, alignItems: 'stretch' }}>

          {/* ── CARD 1: DYNAMIC CURRENTLY LEARNING ── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#EFF6FF',
                padding: '4px 12px',
                borderRadius: 999,
                color: '#2563EB',
                fontSize: 11.5,
                fontWeight: 750
              }}>
                <Play size={11} fill="#2563EB" />
                <span>Currently Learning</span>
              </div>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                {currentlyLearningCourse.batch_name}
              </span>
            </div>

            {/* Content: Thumbnail + Info */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
              <div 
                onClick={() => {
                  setSelectedCourse(currentlyLearningCourse);
                  if (currentlyLearningCourse.lessons?.length > 0) {
                    handlePlayLesson(currentlyLearningCourse.lessons[0], currentlyLearningCourse);
                  }
                }}
                style={{
                  width: 200,
                  height: 120,
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#0F172A',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <img 
                  src={currentlyLearningCourse.thumbnail} 
                  alt={currentlyLearningCourse.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <Play size={20} fill="#2563EB" style={{ marginLeft: 2 }} />
                  </div>
                </div>
                <div style={{ position: 'absolute', bottom: 6, right: 8, background: 'rgba(0,0,0,0.75)', color: '#FFFFFF', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                  {currentlyLearningCourse.duration}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                    {currentlyLearningCourse.title}
                  </h3>
                  <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                    {currentlyLearningCourse.category} • Instructor: {currentlyLearningCourse.trainer_name}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      {currentlyLearningCourse.completed_lessons} of {currentlyLearningCourse.lessons_count} lessons completed
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#2563EB' }}>
                      {currentlyLearningCourse.progress}%
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 7, background: '#EEF2F6', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${currentlyLearningCourse.progress}%`, height: '100%', background: '#2563EB', borderRadius: 999, transition: 'width 0.3s ease' }} />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  <button
                    onClick={() => {
                      setSelectedCourse(currentlyLearningCourse);
                      if (currentlyLearningCourse.lessons?.length > 0) {
                        handlePlayLesson(currentlyLearningCourse.lessons[0], currentlyLearningCourse);
                      }
                    }}
                    style={{
                      padding: '8px 18px',
                      background: '#2563EB',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <span>Continue Learning</span>
                    <ArrowRight size={13} />
                  </button>

                  <button
                    onClick={() => setCourseDetailsModal(currentlyLearningCourse)}
                    style={{
                      padding: '8px 16px',
                      background: '#FFFFFF',
                      color: '#2563EB',
                      border: '1px solid #CBD5E1',
                      borderRadius: 8,
                      fontSize: 12.5,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <FileText size={13} />
                    <span>View Curriculum</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12, borderTop: '1px solid #F1F5F9', fontSize: 12, color: '#64748B', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={13} />
                <span>{currentlyLearningCourse.lessons_count} Lectures</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} />
                <span>{currentlyLearningCourse.duration}</span>
              </div>
            </div>
          </div>

          {/* ── CARD 2: DYNAMIC REAL COURSE PROGRESS ── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            padding: '22px 24px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} color="#2563EB" />
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0F172A' }}>
                Your Course Progress
              </h3>
            </div>

            {/* Donut Progress Ring + Real Breakdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: 'space-around', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: 104, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="104" height="104" viewBox="0 0 104 104" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="52" cy="52" r="42" stroke="#EEF2F6" strokeWidth="9" fill="transparent" />
                  <circle
                    cx="52"
                    cy="52"
                    r="42"
                    stroke="#2563EB"
                    strokeWidth="9"
                    strokeDasharray="263.89"
                    strokeDashoffset={263.89 * (1 - (progressStats.percent / 100))}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div style={{ position: 'absolute', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 850, color: '#0F172A', lineHeight: 1 }}>
                    {progressStats.percent}%
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
                    Overall
                  </div>
                </div>
              </div>

              {/* Dynamic Counts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                    <span>Completed</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{progressStats.completed} / {progressStats.totalCourses}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                    <span>In Progress</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{progressStats.inProgress} / {progressStats.totalCourses}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8' }} />
                    <span>Not Started</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>{progressStats.notStarted} / {progressStats.totalCourses}</span>
                </div>
              </div>
            </div>

            {/* Bottom Real Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                  <BookOpen size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Total Lectures</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{progressStats.totalLessons}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderLeft: '1px solid #F1F5F9', paddingLeft: 14 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748B', fontWeight: 600 }}>Time Watched</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{progressStats.totalHours}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── 3. BOTTOM SECTION: ALL COURSES CATALOG (UDEMY TEMPLATE STYLE) ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Catalog Header & Filter Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayoutGrid size={20} color="#2563EB" />
            <h2 style={{ fontSize: 19, fontWeight: 850, margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>
              All Courses & Playlists
            </h2>
            <span style={{ fontSize: 11.5, background: '#E0E7FF', color: '#4338CA', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
              {filteredCourses.length} {filteredCourses.length === 1 ? 'Course' : 'Courses'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', width: 220 }}>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '7px 12px 7px 32px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', background: '#FFFFFF', boxSizing: 'border-box' }}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              {searchQuery && (
                <X size={14} color="#94A3B8" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#F1F5F9', padding: 3, borderRadius: 999 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'in-progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
                { id: 'not-started', label: 'Not Started' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCategoryFilter(tab.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: categoryFilter === tab.id ? '#2563EB' : 'transparent',
                    color: categoryFilter === tab.id ? '#FFFFFF' : '#64748B',
                    boxShadow: categoryFilter === tab.id ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* If loading */}
        {loading ? (
          <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
            <div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid #2563EB', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px' }} />
            <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Loading your cohort courses...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          /* ── UDEMY EMPTY STATE: NO COURSES FOUND ── */
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1.5px dashed #CBD5E1',
            padding: '60px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12
          }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB', marginBottom: 4 }}>
              <BookOpen size={32} />
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
              {searchQuery ? 'No matching courses found' : 'No Courses or Playlists Available Yet'}
            </h3>
            <p style={{ margin: 0, fontSize: 13.5, color: '#64748B', maxWidth: 440, lineHeight: 1.5 }}>
              {searchQuery ? 'Try clearing your search query or choosing another filter.' : 'Your instructors haven\'t published any course playlists for your cohort yet. Once added, you will see your curriculum and video lectures here.'}
            </p>
          </div>
        ) : (
          /* ── UDEMY TEMPLATE COURSE CARDS GRID ── */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 22
          }}>
            {filteredCourses.map((course) => {
              const isCompleted = course.status === 'Completed';
              const isInProgress = course.status === 'In Progress';

              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    if (course.lessons?.length > 0) handlePlayLesson(course.lessons[0], course);
                  }}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative'
                  }}
                  className="clickable-card-hover"
                >
                  {/* 16:9 Thumbnail with Overlay */}
                  <div style={{ height: 140, position: 'relative', overflow: 'hidden', background: '#0F172A' }}>
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)'
                    }} />

                    {/* Top Right Status Badge */}
                    <div style={{ position: 'absolute', top: 10, right: 10 }}>
                      {isCompleted ? (
                        <span style={{ background: '#10B981', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={11} /> Completed
                        </span>
                      ) : isInProgress ? (
                        <span style={{ background: '#2563EB', color: '#FFFFFF', fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Play size={10} fill="#FFFFFF" /> In Progress
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(255,255,255,0.9)', color: '#475569', fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999 }}>
                          Not Started
                        </span>
                      )}
                    </div>

                    {/* Duration badge bottom right */}
                    <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(0,0,0,0.75)', color: '#FFFFFF', fontSize: 10.5, fontWeight: 700, padding: '2px 7px', borderRadius: 4 }}>
                      {course.duration}
                    </div>

                    {/* Category pill bottom left */}
                    <div style={{ position: 'absolute', bottom: 8, left: 10, background: 'rgba(255,255,255,0.92)', color: '#1E293B', fontSize: 10.5, fontWeight: 750, padding: '2px 8px', borderRadius: 4 }}>
                      {course.category}
                    </div>
                  </div>

                  {/* Card Content (Udemy Layout) */}
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#0F172A', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {course.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748B', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.45 }}>
                        {course.description}
                      </p>
                    </div>

                    <div>
                      {/* Instructor info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#475569', fontWeight: 600, marginBottom: 8 }}>
                        <Users size={13} color="#64748B" />
                        <span>{course.trainer_name}</span>
                        <span style={{ color: '#CBD5E1' }}>•</span>
                        <span style={{ color: '#2563EB', fontWeight: 700 }}>{course.lessons_count} Lectures</span>
                      </div>

                      {/* Progress bar if started */}
                      {course.progress > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 4 }}>
                            <span>Progress</span>
                            <span style={{ color: isCompleted ? '#10B981' : '#2563EB' }}>{course.progress}%</span>
                          </div>
                          <div style={{ width: '100%', height: 5, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${course.progress}%`, height: '100%', background: isCompleted ? '#10B981' : '#2563EB', borderRadius: 999 }} />
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course);
                          if (course.lessons?.length > 0) handlePlayLesson(course.lessons[0], course);
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 12px',
                          borderRadius: 8,
                          border: 'none',
                          background: isCompleted ? '#ECFDF5' : (isInProgress ? '#EFF6FF' : '#F8FAFC'),
                          color: isCompleted ? '#059669' : (isInProgress ? '#2563EB' : '#1E293B'),
                          fontWeight: 750,
                          fontSize: 12.5,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          border: isCompleted ? '1px solid #A7F3D0' : (isInProgress ? '1px solid #BFDBFE' : '1px solid #E2E8F0')
                        }}
                      >
                        <Play size={12} fill={isCompleted ? '#059669' : (isInProgress ? '#2563EB' : '#1E293B')} />
                        {isCompleted ? 'Review Lectures' : (isInProgress ? 'Continue Learning' : 'Start Course')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 4. UDEMY DRILLDOWN: ACTIVE LESSON PLAYER & CURRICULUM VIEW ─── */}
      {selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            width: '100%',
            maxWidth: 1100,
            maxHeight: '92vh',
            background: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ padding: '16px 24px', background: '#0F172A', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, color: '#A5B4FC', fontWeight: 700, textTransform: 'uppercase' }}>
                  {selectedCourse.category}
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800 }}>
                  {selectedCourse.title}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedCourse(null);
                  setActivePlayingLesson(null);
                  refreshWatchProgress();
                }}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFFFFF', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Main Interactive Grid: Video Player + Curriculum Syllabus */}
            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', overflow: 'hidden' }}>
              
              {/* Left Column: Secure Video Player */}
              <div style={{ background: '#000000', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                {activePlayingLesson ? (
                  <div style={{ width: '100%', position: 'relative' }}>
                    <SecureVideoPlayer
                      videoUrl={activePlayingLesson.video_url || activePlayingLesson.videoUrl || activePlayingLesson.url}
                      watermarkText={watermarkText}
                      videoId={activePlayingLesson.id}
                      studentId={studentId}
                      lessonTitle={activePlayingLesson.title}
                      onProgressUpdate={(p) => {
                        saveWatchProgress(studentId, activePlayingLesson.id, p);
                        refreshWatchProgress();
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: 10 }}>
                    <PlayCircle size={48} color="#6366F1" />
                    <p style={{ margin: 0, fontSize: 14 }}>Select a lecture on the right to start watching.</p>
                  </div>
                )}

                {/* Lesson Description & Resources Row */}
                {activePlayingLesson && (
                  <div style={{ padding: '18px 20px', background: '#0F172A', color: '#FFFFFF', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 750 }}>
                      {activePlayingLesson.title}
                    </h4>
                    <p style={{ margin: '0 0 12px', fontSize: 12.5, color: '#94A3B8', lineHeight: 1.5 }}>
                      {activePlayingLesson.description || 'Hands-on lecture breakdown and practical implementations.'}
                    </p>

                    {/* Resources */}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {activePlayingLesson.notes_url && (
                        <a
                          href={activePlayingLesson.notes_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            padding: '6px 12px',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          <FileText size={14} /> Download Lecture Notes
                        </a>
                      )}
                      {(activePlayingLesson.study_materials || []).map((m, mIdx) => (
                        <a
                          key={mIdx}
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            background: '#2563EB',
                            color: '#FFFFFF',
                            padding: '6px 12px',
                            borderRadius: 6,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600
                          }}
                        >
                          <Download size={14} /> {m.name || `Material ${mIdx + 1}`}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Udemy Syllabus List */}
              <div style={{ background: '#F8FAFC', borderLeft: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ padding: '14px 18px', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#1E293B' }}>
                    Course Curriculum
                  </h4>
                  <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>
                    {activeCourseLessons.length} Lectures
                  </span>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activeCourseLessons.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 10px', color: '#94A3B8', fontSize: 13 }}>
                      No video lectures uploaded to this playlist yet.
                    </div>
                  ) : (
                    activeCourseLessons.map((lesson, idx) => {
                      const isCurrent = activePlayingLesson?.id === lesson.id;
                      const prog = watchProgressMap[lesson.id];
                      const isDone = prog?.completed || (prog?.progress && prog.progress >= 90);

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => handlePlayLesson(lesson, selectedCourse)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: isCurrent ? '#EEF2FF' : '#FFFFFF',
                            border: isCurrent ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            background: isDone ? '#10B981' : (isCurrent ? '#6366F1' : '#F1F5F9'),
                            color: isDone || isCurrent ? '#FFFFFF' : '#64748B',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {isDone ? <Check size={14} /> : (idx + 1)}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: isCurrent ? 800 : 650, color: isCurrent ? '#4338CA' : '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {lesson.title}
                            </div>
                            <span style={{ fontSize: 11, color: '#64748B' }}>
                              ⏱ {lesson.duration}
                            </span>
                          </div>

                          {isCurrent && (
                            <span style={{ fontSize: 11, background: '#6366F1', color: '#FFFFFF', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              Playing
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── 5. COURSE OVERVIEW / DETAILS MODAL ─── */}
      {courseDetailsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#FFFFFF', borderRadius: 20, padding: 24, position: 'relative' }}>
            <button
              onClick={() => setCourseDetailsModal(null)}
              style={{ position: 'absolute', right: 16, top: 16, background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 850, color: '#0F172A' }}>
              {courseDetailsModal.title}
            </h3>
            <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 700, display: 'block', marginBottom: 12 }}>
              {courseDetailsModal.category} • {courseDetailsModal.batch_name}
            </span>

            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 18 }}>
              {courseDetailsModal.description}
            </p>

            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Instructor:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{courseDetailsModal.trainer_name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Total Lectures:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{courseDetailsModal.lessons_count} Lectures</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Duration:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{courseDetailsModal.duration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Your Progress:</span>
                <span style={{ fontWeight: 800, color: courseDetailsModal.progress === 100 ? '#10B981' : '#2563EB' }}>
                  {courseDetailsModal.progress}% ({courseDetailsModal.completed_lessons} / {courseDetailsModal.lessons_count} completed)
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                const target = courseDetailsModal;
                setCourseDetailsModal(null);
                setSelectedCourse(target);
                if (target.lessons?.length > 0) handlePlayLesson(target.lessons[0], target);
              }}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 10,
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 750,
                fontSize: 13.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Play size={14} fill="#FFFFFF" /> Open Course Lessons
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default function RecordedClassesPageWrapper(props) {
  return (
    <ErrorBoundary>
      <RecordedClassesPage {...props} />
    </ErrorBoundary>
  );
}
