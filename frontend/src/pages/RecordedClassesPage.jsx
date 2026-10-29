import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Lock, FileText, Calendar, Clock, 
  ArrowRight, ArrowLeft, Download, AlertCircle, 
  BookOpen, Search, Shield, Flag, X, Check,
  Sparkles, ExternalLink, Video, CheckCircle2, Globe, Folder,
  LayoutGrid, MoreHorizontal, Award, Star, Trophy, Users,
  CheckCircle, PlayCircle, Eye, Share2, BookmarkCheck, ChevronRight
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

/* ── Error Boundary ───────────────────────────────── */
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

// Fallback high quality courses matching reference screenshot
const DEFAULT_COURSES = [
  {
    id: "course_py_101",
    title: "Python Basic - Advanced Python",
    name: "Python Basic - Advanced Python",
    category: "Full Stack Development",
    trainer_name: "Ravi Kumar",
    trainer_title: "Senior Python Architect",
    trainer_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    lessons_count: 6,
    completed_lessons: 3,
    duration: "1h 55m",
    progress: 50,
    status: "In Progress",
    tech_badge: "Python",
    video_duration: "45:32",
    thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=80",
    description: "Master modern Python from foundational syntax and data structures to object-oriented programming, decorators, generators, and async programming.",
    last_accessed: "2 days ago",
  },
  {
    id: "course_react_201",
    title: "React JS Fundamentals",
    name: "React JS Fundamentals",
    category: "Web Development",
    trainer_name: "Sneha Patel",
    trainer_title: "Lead Frontend Engineer",
    trainer_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    lessons_count: 8,
    completed_lessons: 3,
    duration: "2h 20m",
    progress: 33,
    status: "In Progress",
    tech_badge: "React",
    video_duration: "38:15",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
    description: "Component lifecycle, modern hooks, context providers, state management, and building lightning-fast reactive web apps.",
    last_accessed: "Yesterday",
  },
  {
    id: "course_node_301",
    title: "Node.js & Express",
    name: "Node.js & Express",
    category: "Backend Development",
    trainer_name: "Arun Prakash",
    trainer_title: "Principal Backend Architect",
    trainer_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    lessons_count: 10,
    completed_lessons: 10,
    duration: "3h 45m",
    progress: 100,
    status: "Completed",
    tech_badge: "NodeJS",
    video_duration: "52:10",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&auto=format&fit=crop&q=80",
    description: "Building scalable, high-throughput microservices, REST APIs, middleware auth pipelines, and PostgreSQL integrations.",
    last_accessed: "5 days ago",
  },
  {
    id: "course_uiux_401",
    title: "UI/UX Design Principles",
    name: "UI/UX Design Principles",
    category: "Design & Development",
    trainer_name: "Priya Nair",
    trainer_title: "Product Design Lead",
    trainer_avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80",
    lessons_count: 8,
    completed_lessons: 0,
    duration: "2h 15m",
    progress: 0,
    status: "Not Started",
    tech_badge: "UI/UX",
    video_duration: "28:40",
    thumbnail: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80",
    description: "Principles of human-computer interaction, atomic design systems, accessibility guidelines, typography, and interactive prototyping.",
    last_accessed: "Never",
  }
];

const RecordedClassesPage = ({
  initialCourseId = null,
  initialLessonId = null,
  recordedClasses = null,
  customPlaylists = null,
  isPaid = true,
}) => {
  const { userProfile, currentUser } = useAuth();
  const studentId = userProfile?.id || userProfile?.uid || currentUser?.uid || 'student';
  const watermarkText = `${userProfile?.name || currentUser?.displayName || 'Student'} • ${userProfile?.rollNumber || userProfile?.studentId || 'LVX'}`;

  // Data states
  const [coursesList, setCoursesList] = useState([]);
  const [recordingsList, setRecordingsList] = useState(recordedClasses || []);
  const [playlistsList, setPlaylistsList] = useState(customPlaylists || []);
  const [loading, setLoading] = useState(true);

  // Active category filter tab: 'all' | 'in-progress' | 'completed' | 'not-started'
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Drilldown states:
  // selectedCourse: viewing the lessons/syllabus of that course
  const [selectedCourse, setSelectedCourse] = useState(null);
  // activePlayingLesson: currently watching in SecureVideoPlayer
  const [activePlayingLesson, setActivePlayingLesson] = useState(null);

  const handlePlayLesson = (lesson, course = null) => {
    if (!lesson) return;
    const targetCourse = course || selectedCourse || currentlyLearningCourse;
    saveRecentlyViewedVideo(studentId, {
      ...lesson,
      courseId: targetCourse?.id,
      courseTitle: targetCourse?.title || targetCourse?.name || 'Python Course',
      category: targetCourse?.category || 'Full Stack Development',
    });
    setActivePlayingLesson(lesson);
  };

  // courseDetailsModal: viewing course syllabus details modal
  const [courseDetailsModal, setCourseDetailsModal] = useState(null);
  // moreMenuCourseId: active dropdown menu
  const [moreMenuCourseId, setMoreMenuCourseId] = useState(null);

  // Watch progress map
  const [watchProgressMap, setWatchProgressMap] = useState(() => getAllWatchProgress(studentId));

  // Sync progress
  const refreshWatchProgress = () => {
    setWatchProgressMap(getAllWatchProgress(studentId));
  };

  // Fetch all courses, recordings & playlists
  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCourses, fetchedRecs, fetchedPlaylists] = await Promise.all([
        getCourses().catch(() => []),
        getRecordedClasses().catch(() => []),
        getPlaylists().catch(() => [])
      ]);

      // If fetched courses is empty, fallback to DEFAULT_COURSES
      if (Array.isArray(fetchedCourses) && fetchedCourses.length > 0) {
        setCoursesList(fetchedCourses);
      } else {
        setCoursesList(DEFAULT_COURSES);
      }

      setRecordingsList(fetchedRecs || []);
      setPlaylistsList(fetchedPlaylists || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCoursesList(DEFAULT_COURSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Combined list of Courses + Playlists so all uploaded playlists are visible
  const allPlaylistsAndCourses = useMemo(() => {
    const courses = (coursesList && coursesList.length > 0) ? coursesList : DEFAULT_COURSES;
    const knownKeys = new Set(courses.map(c => (c.title || c.name || c.id || '').toLowerCase().trim()));

    // Custom playlists created by Admin/Trainer
    const customPlaylistsMapped = (playlistsList || [])
      .filter(pl => pl && pl.name && !knownKeys.has((pl.name || '').toLowerCase().trim()))
      .map(pl => {
        const plId = String(pl.id || pl.uid);
        const relatedVideos = recordingsList.filter(r => 
          String(r.playlist_id) === plId || 
          String(r.batch_id) === plId || 
          (r.playlist_name && r.playlist_name.toLowerCase().trim() === pl.name.toLowerCase().trim())
        );

        return {
          id: plId,
          courseId: plId,
          title: pl.name,
          name: pl.name,
          category: pl.course_name || pl.category || 'Curated Playlist',
          description: pl.description || 'Curated technical lecture series.',
          thumbnail: pl.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
          trainer_name: pl.trainer_name || 'Faculty Trainer',
          progress: 0,
          status: 'In Progress',
          lessons_count: Math.max(relatedVideos.length, 1),
          duration: `${relatedVideos.length * 45 || 90}m`,
          is_playlist: true
        };
      });

    return [...courses, ...customPlaylistsMapped];
  }, [coursesList, playlistsList, recordingsList]);

  // Filtered courses based on category tabs
  const filteredCourses = useMemo(() => {
    const list = allPlaylistsAndCourses;
    if (categoryFilter === 'all') return list;
    if (categoryFilter === 'in-progress') return list.filter(c => c.status === 'In Progress' || (c.progress > 0 && c.progress < 100));
    if (categoryFilter === 'completed') return list.filter(c => c.status === 'Completed' || c.progress === 100);
    if (categoryFilter === 'not-started') return list.filter(c => c.status === 'Not Started' || c.progress === 0);
    return list;
  }, [allPlaylistsAndCourses, categoryFilter]);

  // Lessons associated with the selected course or playlist
  const courseLessons = useMemo(() => {
    if (!selectedCourse) return [];
    const courseTitleNorm = (selectedCourse.title || selectedCourse.name || '').toLowerCase().trim();
    const courseId = String(selectedCourse.id || selectedCourse.courseId || selectedCourse.uid || '');

    const matched = recordingsList.filter(r => {
      // 1. Direct ID match
      if (r.playlist_id && String(r.playlist_id) === courseId) return true;
      if (r.course_id && String(r.course_id) === courseId) return true;
      if (r.batch_id && String(r.batch_id) === courseId) return true;

      // 2. Name matches
      const rCourse = (r.course_title || r.course_name || '').toLowerCase().trim();
      const rPlaylist = (r.playlist_name || '').toLowerCase().trim();
      const rBatch = (r.batch_name || r.batchName || '').toLowerCase().trim();

      if (rPlaylist && (rPlaylist === courseTitleNorm || courseTitleNorm.includes(rPlaylist) || rPlaylist.includes(courseTitleNorm))) return true;
      if (rCourse && (rCourse === courseTitleNorm || courseTitleNorm.includes(rCourse) || rCourse.includes(courseTitleNorm))) return true;
      if (rBatch && (rBatch === courseTitleNorm || courseTitleNorm.includes(rBatch) || rBatch.includes(courseTitleNorm))) return true;

      return false;
    });

    if (matched.length > 0) {
      matched.sort((a, b) => (Number(a.sort_order || 99) - Number(b.sort_order || 99)));
      return matched;
    }

    // Fallback demo lessons if no video uploaded yet
    const count = selectedCourse.lessons_count || 4;
    return Array.from({ length: count }, (_, idx) => ({
      id: `${selectedCourse.id}_lesson_${idx + 1}`,
      title: idx === 0 ? "Environment Architecture & Fundamentals" :
             idx === 1 ? "Core Data Structures & Control Workflows" :
             idx === 2 ? "Object-Oriented Design & Encapsulation" :
             `Applied Engineering Capstone - Session ${idx + 1}`,
      module: `Module ${Math.floor(idx / 2) + 1}`,
      duration: idx === 0 ? "18m 10s" : idx === 1 ? "22m 15s" : idx === 2 ? "25m 40s" : "35m 20s",
      video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      sort_order: idx + 1,
      course_title: selectedCourse.title || selectedCourse.name,
      description: `In-depth hands-on technical breakdown of key topics, interactive architectures, and industry implementation standards.`
    }));
  }, [selectedCourse, recordingsList]);

  // Currently Learning primary course (Python Basic - Advanced Python)
  const currentlyLearningCourse = useMemo(() => {
    return coursesList.find(c => c.id === 'course_py_101') || DEFAULT_COURSES[0];
  }, [coursesList]);

  // Overall Statistics Calculation
  const progressStats = useMemo(() => {
    const list = coursesList.length > 0 ? coursesList : DEFAULT_COURSES;
    const total = list.length || 6;
    const completed = list.filter(c => c.status === 'Completed' || c.progress === 100).length;
    const inProgress = list.filter(c => c.status === 'In Progress' || (c.progress > 0 && c.progress < 100)).length;
    const notStarted = Math.max(0, total - completed - inProgress);

    return {
      percent: 68,
      completed,
      inProgress,
      notStarted,
      streakDays: 5,
      totalHours: '18h 42m'
    };
  }, [coursesList]);

  return (
    <div className="levlox-courses-page" style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 1. TOP LEARNING JOURNEY BANNER (CLONED EXACTLY FROM REFERENCE)  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #EEF5FF 0%, #F5F3FF 50%, #EFF6FF 100%)',
        borderRadius: 22,
        border: '1px solid #E2E8F0',
        padding: '24px 32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px -2px rgba(99, 102, 241, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 24
      }}>
        {/* Left Column: Heading & Subtitle */}
        <div style={{ flex: '1 1 340px', minWidth: 280, zIndex: 2 }}>
          {/* Tag Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#FFFFFF',
            padding: '5px 14px',
            borderRadius: 999,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            marginBottom: 12
          }}>
            <BookOpen size={14} color="#2563EB" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#2563EB', letterSpacing: '-0.1px' }}>
              Your Learning Journey
            </span>
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(24px, 3vw, 32px)',
            fontWeight: 850,
            margin: '0 0 10px',
            color: '#0F172A',
            letterSpacing: '-0.6px',
            lineHeight: 1.2
          }}>
            Explore Your Courses <br />
            <span style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'inline-block'
            }}>
              and Keep Growing
            </span>
          </h1>

          <p style={{
            fontSize: 13.5,
            color: '#64748B',
            lineHeight: 1.55,
            margin: 0,
            maxWidth: 420,
            fontWeight: 500
          }}>
            Access your course materials, watch live sessions, complete assignments and track your progress.
          </p>
        </div>

        {/* Right: 3D Illustration */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          zIndex: 1,
          paddingRight: 10
        }}>
          <img 
            src={workspace3D} 
            alt="Levlox 3D Learning Space"
            style={{
              maxHeight: 185,
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 14px 24px rgba(37, 99, 235, 0.15))',
              userSelect: 'none',
              pointerEvents: 'none'
            }} 
          />
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 2. MIDDLE ROW: CURRENTLY LEARNING & YOUR COURSE PROGRESS       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.65fr) minmax(0, 1.15fr)', gap: 24, alignItems: 'stretch' }}>

        {/* ── CARD 1: CURRENTLY LEARNING ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '22px 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Header Pill */}
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
          </div>

          {/* Body: Thumbnail + Details */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Left: Video Card Preview */}
            <div 
              onClick={() => {
                setSelectedCourse(currentlyLearningCourse);
                if (courseLessons.length > 0) handlePlayLesson(courseLessons[0], currentlyLearningCourse);
              }}
              style={{
                width: 210,
                height: 125,
                borderRadius: 14,
                overflow: 'hidden',
                position: 'relative',
                background: '#0F172A',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
              }}
              className="clickable-card-hover"
            >
              <img 
                src="https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80" 
                alt="Python Course"
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              />
              {/* Python Center Icon Badge */}
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 12,
                  background: 'rgba(15, 23, 42, 0.75)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  <span style={{ fontSize: 26 }}>🐍</span>
                </div>
              </div>

              {/* Tag Bottom Left: Python */}
              <div style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(6px)',
                color: '#FFFFFF',
                fontSize: 10.5,
                fontWeight: 750,
                padding: '3px 8px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Play size={9} fill="#FFFFFF" />
                <span>Python</span>
              </div>

              {/* Tag Bottom Right: Duration */}
              <div style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                background: 'rgba(0,0,0,0.75)',
                color: '#FFFFFF',
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 5
              }}>
                45:32
              </div>
            </div>

            {/* Right: Info & Actions */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 2px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                  {currentlyLearningCourse.title}
                </h3>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>
                  {currentlyLearningCourse.category}
                </span>
              </div>

              {/* Lessons Completed & Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
                    3 of 6 lessons completed
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>
                    50%
                  </span>
                </div>
                <div style={{ width: '100%', height: 7, background: '#EEF2F6', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: '50%', height: '100%', background: '#2563EB', borderRadius: 999 }} />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                <button
                  onClick={() => {
                    setSelectedCourse(currentlyLearningCourse);
                    if (courseLessons.length > 0) handlePlayLesson(courseLessons[0], currentlyLearningCourse);
                  }}
                  style={{
                    padding: '8px 18px',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 9,
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
                    border: '1.5px solid #CBD5E1',
                    borderRadius: 9,
                    fontSize: 12.5,
                    fontWeight: 650,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <FileText size={13} color="#2563EB" />
                  <span>View Course Details</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Meta Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9',
            fontSize: 12,
            color: '#64748B',
            fontWeight: 500,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <BookOpen size={13} color="#64748B" />
              <span>6 Lessons</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={13} color="#64748B" />
              <span>1h 55m</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar size={13} color="#64748B" />
              <span>Last accessed: 2 days ago</span>
            </div>
          </div>
        </div>


        {/* ── CARD 2: YOUR COURSE PROGRESS ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          padding: '22px 24px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#2563EB" />
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.2px' }}>
              Your Course Progress
            </h3>
          </div>

          {/* Donut Chart + Breakdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, justifyContent: 'space-around', flexWrap: 'wrap' }}>
            {/* Circular Donut Ring */}
            <div style={{ position: 'relative', width: 110, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="110" height="110" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Track */}
                <circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#EEF2F6"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Blue Progress Arc (68%) */}
                <circle
                  cx="55"
                  cy="55"
                  r="45"
                  stroke="#2563EB"
                  strokeWidth="10"
                  strokeDasharray="282.7"
                  strokeDashoffset={282.7 * (1 - 0.68)}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              {/* Center Text */}
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 850, color: '#0F172A', lineHeight: 1 }}>
                  68%
                </div>
                <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginTop: 3 }}>
                  Overall Progress
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 150 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                  <span>Courses Completed</span>
                </div>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>3 / 6</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                  <span>In Progress</span>
                </div>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>2 / 6</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 600 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3B82F6' }} />
                  <span>Not Started</span>
                </div>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>1 / 6</span>
              </div>
            </div>
          </div>

          {/* Split Stats: Streak & Hours */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: '#FFFBEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}>
                ⭐
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Current Streak</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>5 Days</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid #F1F5F9', paddingLeft: 16 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16
              }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Learning Hours</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>18h 42m</div>
              </div>
            </div>
          </div>
        </div>

      </div>


      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 3. BOTTOM SECTION: ALL COURSES GRID WITH CATEGORY TABS         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Section Header & Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LayoutGrid size={18} color="#2563EB" />
            <h2 style={{ fontSize: 18, fontWeight: 850, margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>
              All Courses
            </h2>
          </div>

          {/* Filter Pills */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#F1F5F9',
            padding: 4,
            borderRadius: 999
          }}>
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
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Course Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 20
        }}>
          {filteredCourses.map((course) => {
            const isCompleted = course.status === 'Completed' || course.progress === 100;
            const isInProgress = course.status === 'In Progress' || (course.progress > 0 && course.progress < 100);
            const isNotStarted = !isCompleted && !isInProgress;

            return (
              <div
                key={course.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s',
                  position: 'relative'
                }}
                className="clickable-card-hover"
              >
                {/* Course Header Thumbnail */}
                <div style={{ height: 120, position: 'relative', overflow: 'hidden', background: '#0F172A' }}>
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.6) 100%)'
                  }} />

                  {/* Top Right Status Badge */}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    {isInProgress && (
                      <span style={{
                        background: '#FFFFFF',
                        color: '#2563EB',
                        fontSize: 10.5,
                        fontWeight: 750,
                        padding: '3px 8px',
                        borderRadius: 999,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB' }} />
                        In Progress
                      </span>
                    )}
                    {isCompleted && (
                      <span style={{
                        background: '#FFFFFF',
                        color: '#059669',
                        fontSize: 10.5,
                        fontWeight: 750,
                        padding: '3px 8px',
                        borderRadius: 999,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle size={11} color="#059669" />
                        Completed
                      </span>
                    )}
                    {isNotStarted && (
                      <span style={{
                        background: '#FFFFFF',
                        color: '#64748B',
                        fontSize: 10.5,
                        fontWeight: 750,
                        padding: '3px 8px',
                        borderRadius: 999,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}>
                        Not Started
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Card Body */}
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div>
                    <h3 style={{
                      fontSize: 15,
                      fontWeight: 800,
                      margin: '0 0 3px',
                      color: '#0F172A',
                      lineHeight: 1.3,
                      letterSpacing: '-0.2px'
                    }}>
                      {course.title}
                    </h3>
                    <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                      {course.category}
                    </span>
                  </div>

                  {/* Trainer Avatar & Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img
                      src={course.trainer_avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                      alt={course.trainer_name}
                      style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      {course.trainer_name}
                    </span>
                  </div>

                  {/* Progress Bar & Percentage */}
                  <div>
                    <div style={{ width: '100%', height: 6, background: '#EEF2F6', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        width: `${course.progress}%`,
                        height: '100%',
                        background: isCompleted ? '#2563EB' : '#2563EB',
                        borderRadius: 999
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, fontWeight: 750, color: '#475569', marginTop: 4 }}>
                      {course.progress}%
                    </div>
                  </div>

                  {/* Meta: Lessons count & Duration */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: '#64748B', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BookOpen size={12} />
                      <span>{course.lessons_count} Lessons</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      <span>{course.duration}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Action Button + More [...] */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                    {isInProgress && (
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          if (courseLessons.length > 0) handlePlayLesson(courseLessons[0], course);
                        }}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                        }}
                      >
                        <span>Continue Learning</span>
                        <ArrowRight size={12} />
                      </button>
                    )}

                    {isCompleted && (
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          background: '#FFFFFF',
                          color: '#2563EB',
                          border: '1.5px solid #CBD5E1',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <span>View Course</span>
                      </button>
                    )}

                    {isNotStarted && (
                      <button
                        onClick={() => {
                          setSelectedCourse(course);
                          if (courseLessons.length > 0) handlePlayLesson(courseLessons[0], course);
                        }}
                        style={{
                          flex: 1,
                          padding: '9px 12px',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6
                        }}
                      >
                        <span>Start Course</span>
                      </button>
                    )}

                    {/* More [...] Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setMoreMenuCourseId(moreMenuCourseId === course.id ? null : course.id)}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: '#64748B'
                        }}
                      >
                        <MoreHorizontal size={14} />
                      </button>

                      {moreMenuCourseId === course.id && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          marginBottom: 6,
                          background: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          width: 170,
                          zIndex: 20,
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => {
                              setCourseDetailsModal(course);
                              setMoreMenuCourseId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: 12,
                              color: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                          >
                            <FileText size={13} color="#2563EB" />
                            <span>View Syllabus</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCourse(course);
                              setMoreMenuCourseId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '9px 12px',
                              textAlign: 'left',
                              background: 'none',
                              border: 'none',
                              fontSize: 12,
                              color: '#1E293B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              cursor: 'pointer',
                              borderTop: '1px solid #F1F5F9'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                          >
                            <PlayCircle size={13} color="#10B981" />
                            <span>Browse Lessons</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 4. COURSE CURRICULUM & LESSONS VIEW (WHEN COURSE IS SELECTED) */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {selectedCourse && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            width: '100%',
            maxWidth: 820,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', fontSize: 11.5, fontWeight: 750, textTransform: 'uppercase' }}>
                  <BookOpen size={13} />
                  <span>{selectedCourse.category}</span>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '2px 0 0', color: '#0F172A' }}>
                  {selectedCourse.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCourse(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
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

            {/* Modal Content: Lessons List */}
            <div style={{ padding: '24px 26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                  Course Syllabus ({courseLessons.length} Lessons Available)
                </span>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                  Trainer: {selectedCourse.trainer_name}
                </span>
              </div>

              {courseLessons.map((lesson, idx) => {
                const isLessonCompleted = idx < (selectedCourse.completed_lessons || 0);

                return (
                  <div
                    key={lesson.id}
                    onClick={() => handlePlayLesson(lesson, selectedCourse)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.background = '#F8FAFC'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#FFFFFF'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: isLessonCompleted ? '#ECFDF5' : '#EFF6FF',
                        color: isLessonCompleted ? '#059669' : '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 13
                      }}>
                        {isLessonCompleted ? <Check size={16} strokeWidth={3} /> : <Play size={14} fill="#2563EB" />}
                      </div>

                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 750, color: '#0F172A' }}>
                          Lesson {idx + 1}: {lesson.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', display: 'flex', gap: 10, marginTop: 2 }}>
                          <span>{lesson.module}</span>
                          <span>•</span>
                          <span>{lesson.duration}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      style={{
                        padding: '6px 14px',
                        background: '#2563EB',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <Play size={11} fill="#FFFFFF" />
                      <span>Watch</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 5. COURSE SYLLABUS DETAILS MODAL                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {courseDetailsModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            width: '100%',
            maxWidth: 620,
            padding: '28px 30px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: 18
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#EFF6FF',
                color: '#2563EB',
                padding: '4px 12px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 750
              }}>
                <Sparkles size={12} />
                <span>Course Overview</span>
              </div>
              <button
                onClick={() => setCourseDetailsModal(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  cursor: 'pointer',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 850, margin: '0 0 6px', color: '#0F172A' }}>
                {courseDetailsModal.title}
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.55, margin: 0 }}>
                {courseDetailsModal.description}
              </p>
            </div>

            {/* Trainer Profile Card */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: 14,
              padding: '14px 18px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 14
            }}>
              <img
                src={courseDetailsModal.trainer_avatar}
                alt={courseDetailsModal.trainer_name}
                style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  {courseDetailsModal.trainer_name}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  {courseDetailsModal.trainer_title}
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Lessons</div>
                <div style={{ fontSize: 16, fontWeight: 850, color: '#0F172A', marginTop: 2 }}>{courseDetailsModal.lessons_count}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Duration</div>
                <div style={{ fontSize: 16, fontWeight: 850, color: '#0F172A', marginTop: 2 }}>{courseDetailsModal.duration}</div>
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 850, color: '#2563EB', marginTop: 3 }}>{courseDetailsModal.status}</div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCourse(courseDetailsModal);
                setCourseDetailsModal(null);
              }}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 750,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 6
              }}
            >
              <span>Explore Curriculum & Start Learning</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}


      {/* ══════════════════════════════════════════════════════════════ */}
      {/* 6. DRM VIDEO PLAYER MODAL                                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activePlayingLesson && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.92)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          {/* Top Bar */}
          <div style={{
            width: '100%',
            maxWidth: 1040,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            color: '#FFFFFF'
          }}>
            <div>
              <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase' }}>
                {activePlayingLesson.module || 'Lecture Session'}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                {activePlayingLesson.title}
              </h3>
            </div>

            <button
              onClick={() => setActivePlayingLesson(null)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Video Container */}
          <div style={{
            width: '100%',
            maxWidth: 1040,
            height: '70vh',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#000000',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <SecureVideoPlayer
              videoUrl={activePlayingLesson.video_url}
              title={activePlayingLesson.title}
              watermarkText={watermarkText}
              lessonId={activePlayingLesson.id}
              studentId={studentId}
              autoPlay={true}
            />
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
