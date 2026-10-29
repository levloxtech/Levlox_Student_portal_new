import React, { useState, useEffect, useRef, lazy, Suspense, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, FileText, Bookmark, LogOut, GraduationCap,
  ClipboardList, Lock, Video, Megaphone, User, DollarSign,
  Download, ExternalLink, Calendar, CalendarCheck, Percent,
  Search, ChevronLeft, ChevronRight, Settings, HelpCircle,
  Clock, CheckCircle, AlertCircle, PlayCircle, Zap, TrendingUp,
  Award, Star, ArrowRight, Plus, X, Eye, Users, Menu,
  Crown, Medal, Flame, Activity, Trophy, TriangleAlert, XCircle, RefreshCw,
  MessageSquare, Sparkles, Play, Shield, Monitor, Laptop, Smartphone, UploadCloud
} from 'lucide-react';

import CustomModal from '../components/Modal';
import NotificationBell from '../components/NotificationBell';
import ErrorBoundary from '../components/ErrorBoundary';
import { CardSkeleton, DashboardSkeleton } from '../components/Skeleton';
import levloxLogo from '../assets/levlox-logo.png';
import levloxWorkspace3D from '../assets/levlox-workspace-3d.png';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import {
  getRecentlyViewedVideos,
  saveRecentlyViewedVideo,
  getResolvedThumbnail,
  getLessonWatchProgress,
  saveWatchProgress
} from '../utils/videoUtils';
import {
  SrmsWelcomeIllustration,
  SrmsHeader,
  SrmsKpiCardsRow,
  SrmsRecentLiveClassesTable,
  SrmsNoticeBoard,
  SrmsCalendarWidget,
  SrmsQuickAccess,
  SrmsPerformanceDonut,
  SrmsFooter,
} from '../components/SrmsDashboardView';
import {
  GlassCalendar3D,
  GlassDocument3D,
  GlassVideo3D,
  GlassFolder3D,
  GlassChat3D,
  GlassCheck3D
} from '../components/Glass3DIcons';
import { useAuth } from '../context/AuthContext';
import {
  getDocuments,
  getEnrollmentsForStudent,
  getCourses,
  getUpcomingLiveClasses,
  getLiveClasses,
  getAttendanceForStudent,
  setDocument,
  updateDocumentFields,
  getRecordedClasses,
  getAnnouncements,
  getLeaderboard,
  getSubmissionsForStudent,
  getAssignments,
  getAssignmentsForCourse,
  submitAssignment as submitAssignmentToFirestore,
  updateStudent,
  classifyFirestoreError,
  getPlaylists,
} from '../services/firebaseService';

import { getDownloadUrl } from '../services/apiService';

// Lazy-load sub-page components for code-splitting and below-the-fold optimization
const StudentProfile = lazy(() => import('./StudentProfile'));
const StudentSettings = lazy(() => import('./StudentSettings'));
const AttendancePage = lazy(() => import('./AttendancePage'));
const RecordedClassesPage = lazy(() => import('./RecordedClassesPage'));
const StudyMaterialsPage = lazy(() => import('./StudyMaterialsPage'));
const LeaderboardPage = lazy(() => import('./LeaderboardPage'));
const BatchChatPage = lazy(() => import('./BatchChatPage'));
const AssignmentsPage = lazy(() => import('./AssignmentsPage'));

/* ─── tiny helpers (Memoized for re-render optimization) ─────────────── */
const CircularProgress = memo(({ pct = 0, size = 80, stroke = 7, color = '#6C3CF0' }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
});

const ProgressBar = memo(({ pct = 0, color = '#6C3CF0', height = 6 }) => (
  <div style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 99, height, overflow: 'hidden', width: '100%' }}>
    <div style={{
      height: '100%', borderRadius: 99, width: `${Math.min(pct, 100)}%`,
      background: `linear-gradient(90deg, ${color}cc, ${color})`,
      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
    }} />
  </div>
));

const FlatIcon = memo(({ children, size = 40 }) => (
  <div style={{
    width: size, height: size, borderRadius: 12, flexShrink: 0,
    background: 'rgba(108, 60, 240, 0.08)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6C3CF0'
  }}>
    {children}
  </div>
));

/* ─── 3D Layered Frosted Glass Icon Badge (Ref: Files, Contact, Gallery) ─── */
const GlassIcon3D = memo(({ icon: Icon, theme = 'violet', size = 48, iconSize = 20, iconColor, style = {} }) => {
  const backdropClasses = {
    emerald: 'glass-backdrop-emerald',
    violet: 'glass-backdrop-violet',
    amber: 'glass-backdrop-amber',
    blue: 'glass-backdrop-blue',
    rose: 'glass-backdrop-rose',
    slate: 'glass-backdrop-slate',
  };
  const defaultColors = {
    emerald: '#065F46',
    violet: '#4F46E5',
    amber: '#92400E',
    blue: '#0369A1',
    rose: '#9F1239',
    slate: '#334155',
  };
  const color = iconColor || defaultColors[theme] || '#4F46E5';

  return (
    <div className="glass-icon-container" style={{ width: size, height: size, ...style }}>
      <div
        className={`glass-icon-backdrop ${backdropClasses[theme] || 'glass-backdrop-violet'}`}
        style={{
          width: Math.round(size * 0.68),
          height: Math.round(size * 0.68),
          borderRadius: Math.round(size * 0.26),
        }}
      />
      <div
        className="glass-icon-plate"
        style={{
          width: Math.round(size * 0.8),
          height: Math.round(size * 0.8),
          borderRadius: Math.round(size * 0.28),
        }}
      >
        <Icon size={iconSize} color={color} strokeWidth={2.2} />
      </div>
    </div>
  );
});

const WeeklyLineChart = memo(({ data = [0, 0, 0, 0, 0, 0, 0] }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxVal = Math.max(...data, 8);
  const width = 380;
  const height = 150;
  const padding = 20;

  const points = data.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / 6;
    const y = height - padding - (val * (height - padding * 2)) / maxVal;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  const areaD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '') + ` L ${points[6].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C3CF0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6C3CF0" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
          );
        })}
        <path d={areaD} fill="url(#chartGlow)" />
        <path d={pathD} fill="none" stroke="#6C3CF0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#6C3CF0" stroke="#FFF" strokeWidth="2" style={{ transition: 'all 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.setAttribute('r', '6')}
              onMouseLeave={e => e.currentTarget.setAttribute('r', '4')}
            />
            <text x={p.x} y={height - 2} fontSize="9" fontWeight="700" fill="#9499AB" textAnchor="middle">{days[idx]}</text>
          </g>
        ))}
      </svg>
    </div>
  );
});

const MockBarChart = memo(({ data = [0, 0, 0, 0] }) => {
  const width = 280;
  const height = 150;
  const padding = 20;
  const maxVal = 100;

  const barWidth = 32;
  const gap = (width - padding * 2 - barWidth * data.length) / (data.length - 1);

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C3CF0" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - padding * 2);
          return (
            <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(0,0,0,0.04)" strokeDasharray="3 3" />
          );
        })}
        {data.map((val, idx) => {
          const x = padding + idx * (barWidth + gap);
          const barHeight = (val * (height - padding * 2)) / maxVal;
          const y = height - padding - barHeight;
          return (
            <g key={idx}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="url(#barGrad)" rx="6" style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.setAttribute('opacity', '0.85')}
                onMouseLeave={e => e.currentTarget.setAttribute('opacity', '1')}
              />
              <text x={x + barWidth / 2} y={y - 6} fontSize="9" fontWeight="800" fill="#6C3CF0" textAnchor="middle">{val}%</text>
              <text x={x + barWidth / 2} y={height - 2} fontSize="9" fontWeight="700" fill="#9499AB" textAnchor="middle">Int {idx + 1}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
});

/** Stable fallbacks — fresh literals would break memo dependencies. */
const EMPTY_PROFILE = {};

/* ─── Main Component ───────────────────────────────── */
const StudentDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout: authLogout, uid, refreshProfile } = useAuth();
  // AuthContext already loaded students/{uid}; reuse it instead of re-reading.
  // Stable fallback — a fresh `{}` each render would invalidate every memo
  // and query key that depends on `user`.
  const user = userProfile || EMPTY_PROFILE;
  const [activeTab, setActiveTab] = useState('dashboard');
  const queryClient = useQueryClient();

  // Modal and dropdown states
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalText, setModalText] = useState('');
  const [modalType, setModalType] = useState('info');
  const [showLockModal, setShowLockModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [replayTarget, setReplayTarget] = useState(null);
  const [liveClassSubTab, setLiveClassSubTab] = useState('upcoming'); // 'upcoming' | 'completed'
  const [dashboardActiveVideo, setDashboardActiveVideo] = useState(null);
  const [recentlyViewedVideos, setRecentlyViewedVideos] = useState(() => getRecentlyViewedVideos(uid));
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });
  const [bypassDesktopGate, setBypassDesktopGate] = useState(false);

  useEffect(() => {
    const handleSyncRecent = () => {
      setRecentlyViewedVideos(getRecentlyViewedVideos(uid));
    };
    window.addEventListener('levlox_video_viewed', handleSyncRecent);
    window.addEventListener('storage', handleSyncRecent);
    return () => {
      window.removeEventListener('levlox_video_viewed', handleSyncRecent);
      window.removeEventListener('storage', handleSyncRecent);
    };
  }, [uid]);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobileScreen(window.innerWidth < 1024 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const profileRef = useRef(null);

  const showModal = (title, text, type = 'info') => {
    setModalTitle(title);
    setModalText(text);
    setModalType(type);
    setModalOpen(true);
  };

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const handleProfileUpdate = (updatedData) => {
    if (updatedData.name) setProfileName(updatedData.name);
    const photo = updatedData.profile_pic || updatedData.profilePhotoUrl;
    if (photo) setProfilePic(photo);
    queryClient.invalidateQueries({ queryKey: ['studentDashboardCore', uid] });
    queryClient.invalidateQueries({ queryKey: ['studentDashboardExtras', uid] });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /*
   * Dashboard data is split into two independent queries so the main content
   * paints as soon as the essentials arrive, instead of waiting on every
   * secondary widget. Both start together on mount — this is a split, not a
   * waterfall.
   */

  useEffect(() => {
    if (user?.mustChangePassword) {
      setActiveTab('settings');
      showModal('Welcome to Levlox Student Portal!', 'You are logged in with a temporary password. Please update your password below to activate and unlock your student portal.', 'info');
    }
  }, [user?.mustChangePassword]);

  // CORE — what the dashboard shell and the primary cards need (live dynamic database sync).
  const {
    data: coreData,
    isPending: coreLoading,
    error: coreError,
    refetch: refetchCore,
  } = useQuery({
    queryKey: ['studentDashboardCore', uid],
    queryFn: async () => {
      const [allStudents, enrollments, courses, liveClasses, announcements, attendanceRecords] = await Promise.all([
        getDocuments("students").catch(() => []),
        getEnrollmentsForStudent(uid).catch(() => []),
        getCourses().catch(() => []),
        getLiveClasses().catch(() => []),
        getAnnouncements().catch(() => []),
        getAttendanceForStudent(uid).catch(() => []),
      ]);

      const studentDoc = (allStudents || []).find(s => 
        s.id === uid || 
        s.uid === uid || 
        (userProfile?.rollNumber && s.rollNumber === userProfile.rollNumber) ||
        (user?.rollNumber && s.rollNumber === user.rollNumber) ||
        (userProfile?.email && s.email === userProfile.email)
      ) || null;

      const studentCourseName = studentDoc?.course || studentDoc?.course_name || userProfile?.course || user?.course;
      const enrolledCourseIds = new Set((enrollments || []).map(e => e.courseId || e.course_id));

      const enrolledCourses = (courses || []).filter(c => {
        if (enrolledCourseIds.has(c.id) || enrolledCourseIds.has(c.uid)) return true;
        if (studentCourseName) {
          const cName = String(c.name || c.title || '').trim().toLowerCase();
          const sName = String(studentCourseName).trim().toLowerCase();
          if (cName === sName || cName.includes(sName) || sName.includes(cName)) return true;
        }
        return false;
      });

      return {
        studentDoc,
        courses: courses || [],
        enrolledCourses: enrolledCourses.length > 0 ? enrolledCourses : (courses || []).slice(0, 1),
        allLiveClasses: liveClasses || [],
        announcements: announcements || [],
        attendanceRecords: attendanceRecords || [],
      };
    },
    enabled: !!uid,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // ATTENDANCE — reactive cache to immediately mirror attendance marks across pages
  const { data: attendanceHistory = [], refetch: refetchAttendance } = useQuery({
    queryKey: ['studentAttendance', uid],
    queryFn: () => getAttendanceForStudent(uid),
    enabled: Boolean(uid),
    staleTime: 1000 * 30,
    refetchInterval: 60000, // auto-refresh attendance every 1 min
    refetchOnWindowFocus: true,
  });

  // SECONDARY — ranking, replays and submissions. A failure here degrades a
  // widget, it does not blank the dashboard.
  const {
    data: extrasData,
    isPending: extrasLoading,
    error: extrasError,
    refetch: refetchExtras,
  } = useQuery({
    queryKey: ['studentDashboardExtras', uid],
    queryFn: async () => {
      const [recordings, leaderboard, submissions, playlists] = await Promise.all([
        getRecordedClasses().catch(() => []),
        getLeaderboard().catch(() => []),
        getSubmissionsForStudent(uid).catch(() => []),
        getPlaylists().catch(() => []),
      ]);

      const safeLeaderboard = leaderboard || [];
      const myIndex = safeLeaderboard.findIndex(e => e.id === uid);
      const topPerformers = safeLeaderboard.slice(0, 3).map(p => ({ ...p, is_current: p.id === uid }));
      const currentStudent = myIndex >= 0 ? { ...safeLeaderboard[myIndex], rank: myIndex + 1 } : null;

      return {
        recordings: recordings || [],
        playlists: playlists || [],
        leaderboard: safeLeaderboard,
        submissions: submissions || [],
        learningRanking: { topPerformers, currentStudent },
      };
    },
    enabled: !!uid,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 60000, // auto-refresh extras every 1 min
    refetchOnWindowFocus: true,
  });

  const refetchAll = React.useCallback(() => {
    refetchCore();
    refetchExtras();
    refetchAttendance();
  }, [refetchCore, refetchExtras, refetchAttendance]);

  // Immediately refresh all data when navigating between tabs/pages
  useEffect(() => {
    refetchCore();
    refetchAttendance();
    refetchExtras();
    queryClient.invalidateQueries({ queryKey: ['studentBatchAssignments'] });
    queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
    queryClient.invalidateQueries({ queryKey: ['studentDashboardCore'] });
  }, [activeTab, queryClient]);

  // Real-time ticker to auto-unlock live classes 5 minutes before scheduled start and auto-close after 1 hour
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);

  const getClassLockStatus = (c, nowMs) => {
    if (!c) return { isUnlocked: false, isEnded: true, label: 'Live Class Over' };
    const status = String(c?.status || 'Upcoming').toLowerCase();
    if (status === 'completed' || status === 'ended' || status === 'cancelled') {
      return {
        isUnlocked: false,
        label: 'Live Class Over',
        badgeBg: 'rgba(100,116,139,0.12)',
        badgeColor: '#64748B',
        isEnded: true,
        isLocked: true,
      };
    }
    if (status === 'live') {
      return {
        isUnlocked: true,
        label: 'Live Now',
        badgeBg: 'rgba(239,68,68,0.12)',
        badgeColor: '#ef4444',
        isLive: true,
      };
    }

    if (!c?.date) {
      return { isUnlocked: true, label: 'Available', badgeBg: 'rgba(108,60,240,0.08)', badgeColor: '#6C3CF0' };
    }

    let hours = 10;
    let minutes = 0;
    if (c.time) {
      const firstTime = String(c.time).split('-')[0].trim();
      const match12 = firstTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match12) {
        hours = parseInt(match12[1], 10);
        minutes = parseInt(match12[2], 10);
        const meridian = (match12[3] || '').toUpperCase();
        if (meridian === 'PM' && hours < 12) hours += 12;
        if (meridian === 'AM' && hours === 12) hours = 0;
      }
    }

    const [y, m, d] = String(c.date).split('-').map(Number);
    if (!y || !m || !d) {
      return { isUnlocked: true, label: 'Available', badgeBg: 'rgba(108,60,240,0.08)', badgeColor: '#6C3CF0' };
    }

    const classStartTime = new Date(y, m - 1, d, hours, minutes, 0, 0);
    const unlockTime = new Date(classStartTime.getTime() - 5 * 60 * 1000);
    const unlockTimeDisplay = unlockTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const now = new Date(nowMs);
    const diffMs = classStartTime.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (60 * 1000));

    // After 1 hour (diffMinutes < -60): The meeting link is permanently closed and class is over
    if (diffMinutes < -60) {
      return {
        isUnlocked: false,
        diffMinutes,
        label: 'Live Class Over',
        badgeBg: 'rgba(100,116,139,0.12)',
        badgeColor: '#64748B',
        isEnded: true,
        isLocked: true,
        unlockTimeDisplay,
      };
    }

    // Active & Unlocked window: 5 minutes before scheduled start time up to 60 minutes after start time
    if (diffMinutes <= 5 && diffMinutes >= -60) {
      return {
        isUnlocked: true,
        diffMinutes,
        label: diffMinutes <= 0 ? 'Live Now' : `Starts in ${diffMinutes}m (Unlocked)`,
        badgeBg: diffMinutes <= 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
        badgeColor: diffMinutes <= 0 ? '#ef4444' : '#10b981',
        isLive: diffMinutes <= 0,
        unlockTimeDisplay,
      };
    }

    // Locked! Starts > 5 minutes in future
    let remainingStr = '';
    if (diffMinutes >= 60) {
      const hrs = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      remainingStr = `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
    } else {
      remainingStr = `${diffMinutes} mins`;
    }

    return {
      isUnlocked: false,
      diffMinutes,
      remainingStr,
      label: `Starts in ${remainingStr}`,
      badgeBg: 'rgba(245,158,11,0.12)',
      badgeColor: '#d97706',
      isLocked: true,
      unlockTimeDisplay,
    };
  };

  // Student live document, cohort & course identifier
  const studentDoc = coreData?.studentDoc || null;
  const currentStudent = studentDoc || userProfile || user || EMPTY_PROFILE;

  const studentBatchId = studentDoc?.batch_id || studentDoc?.batchId || user?.batch_id || user?.batchId || userProfile?.batch_id || userProfile?.batchId || '';
  const studentBatchName = (studentDoc?.batch || studentDoc?.batch_name || user?.batch_name || user?.batchName || userProfile?.batch_name || userProfile?.batchName || '').trim().toLowerCase();
  const studentCourseName = studentDoc?.course || studentDoc?.course_name || user?.course || userProfile?.course || 'Data Science & AI';

  // Live dynamic fee calculations from database
  const dynamicFeesTotal = Number(studentDoc?.feesTotal ?? user?.feesTotal ?? userProfile?.feesTotal ?? 25000);
  const dynamicFeesPaid = Number(studentDoc?.feesPaidAmount ?? user?.feesPaidAmount ?? userProfile?.feesPaidAmount ?? 0);
  const dynamicFeesRemaining = Number(studentDoc?.feesRemainingAmount ?? Math.max(0, dynamicFeesTotal - dynamicFeesPaid));
  const dynamicFeesStatus = studentDoc?.feesStatus || user?.feesStatus || userProfile?.feesStatus || (dynamicFeesRemaining === 0 ? 'Paid' : (dynamicFeesPaid > 0 ? 'Partially Paid' : 'Pending Payment'));
  const isPaid = dynamicFeesStatus === 'Paid';
  const isPartial = dynamicFeesStatus === 'Partially Paid';

  // Helper to parse class date/time into timestamp for sorting
  const getClassTimestamp = (item) => {
    if (!item?.date) return 0;
    let h = 10, m = 0;
    if (item.time) {
      const match = String(item.time).split('-')[0].trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (match) {
        h = parseInt(match[1], 10);
        m = parseInt(match[2], 10);
        if ((match[3] || '').toUpperCase() === 'PM' && h < 12) h += 12;
        if ((match[3] || '').toUpperCase() === 'AM' && h === 12) h = 0;
      }
    }
    const [y, mon, d] = String(item.date).split('-').map(Number);
    return new Date(y, mon - 1, d, h, m).getTime();
  };

  // Single merged shape so child pages keep their existing props contract.
  const dashboardData = React.useMemo(() => {
    if (!coreData && !extrasData) return null;
    const rawLive = coreData?.allLiveClasses || [];
    const studentRecords = attendanceHistory?.length ? attendanceHistory : (coreData?.attendanceRecords || []);

    // Filter live classes strictly by student's enrolled batch
    const batchLiveClasses = rawLive.filter(c => {
      if (!c) return false;
      const classBatchId = c.batch_id || c.batchId;
      const classBatchName = (c.batch_name || c.batchName || '').trim().toLowerCase();

      // If scheduled for a specific batch, verify student enrollment
      if (classBatchId || classBatchName) {
        const idMatches = studentBatchId && classBatchId && String(studentBatchId).trim() === String(classBatchId).trim();
        const nameMatches = studentBatchName && classBatchName && studentBatchName === classBatchName;
        return Boolean(idMatches || nameMatches);
      }

      // General class (no batch restriction)
      return true;
    });

    // Helper: checks whether this student has attended a specific live class
    const isAttended = (c) => {
      const classId = c.id || c.uid || c._id;
      return studentRecords.some(a => {
        const idMatch = a.liveClassId && (String(a.liveClassId) === String(classId));
        const dateMatch = a.date && a.date === c.date && (a.status === 'Present' || a.attendedLive);
        return Boolean(idMatch || dateMatch);
      });
    };

    const upcomingLiveClasses = [];
    const completedLiveClasses = [];

    batchLiveClasses.forEach(c => {
      const lock = getClassLockStatus(c, currentTime);
      const isCompleted = lock.isEnded || (c.status || '').toLowerCase() === 'completed';
      if (isCompleted) {
        completedLiveClasses.push(c);
      } else {
        upcomingLiveClasses.push(c);
      }
    });

    upcomingLiveClasses.sort((a, b) => getClassTimestamp(a) - getClassTimestamp(b));
    completedLiveClasses.sort((a, b) => getClassTimestamp(b) - getClassTimestamp(a));

    const totalCompleted = completedLiveClasses.length;
    const attendedCount = completedLiveClasses.filter(isAttended).length;
    const liveAttendanceRate = totalCompleted > 0
      ? Math.round((attendedCount / totalCompleted) * 100)
      : 100;

    const allCustomPlaylists = Array.isArray(extrasData?.playlists) ? extrasData.playlists : [];
    const accessiblePlaylistIds = new Set(
      allCustomPlaylists
        .filter(pl => pl.access_type === 'all' || !pl.batch_id || (studentBatchId && String(pl.batch_id) === String(studentBatchId)))
        .map(pl => String(pl.id || pl.uid))
    );

    const allRecordings = Array.isArray(extrasData?.recordings) ? extrasData.recordings : [];
    const rawRecordings = allRecordings.filter(r => {
      if (r.playlist_id && accessiblePlaylistIds.has(String(r.playlist_id))) return true;
      const rBatchId = String(r.batch_id || r.batchId || '').trim().toLowerCase();
      if (!studentBatchId && !studentBatchName) return true;
      if (studentBatchId && rBatchId && rBatchId === String(studentBatchId).trim().toLowerCase()) return true;
      if (studentBatchName && r.batch_name && String(r.batch_name).trim().toLowerCase() === studentBatchName) return true;
      return !rBatchId || rBatchId === 'all' || rBatchId === 'global';
    });

    // Sequential curriculum order (1, 2, 3...)
    rawRecordings.sort((a, b) => {
      const orderA = a.sort_order ?? a.order ?? 999;
      const orderB = b.sort_order ?? b.order ?? 999;
      if (orderA !== orderB) return Number(orderA) - Number(orderB);
      return (a.title || '').localeCompare(b.title || '');
    });

    return {
      student: currentStudent,
      courses: coreData?.courses || [],
      enrolledCourses: coreData?.enrolledCourses || [],
      announcements: coreData?.announcements || [],
      batchLiveClasses,
      upcomingLiveClasses,
      completedLiveClasses,
      todayLiveClass: upcomingLiveClasses[0] || null,
      liveStats: {
        totalCompleted,
        attendedCount,
        attendanceRate: liveAttendanceRate,
        totalScheduled: batchLiveClasses.length,
      },
      isAttended,
      recordedClasses: rawRecordings,
      latestReplays: rawRecordings.slice(0, 6).map(r => ({ ...(r || {}), access: isPaid })),
      leaderboard: Array.isArray(extrasData?.leaderboard) ? extrasData.leaderboard : [],
      learningRanking: extrasData?.learningRanking || null,
      submissions: Array.isArray(extrasData?.submissions) ? extrasData.submissions : [],
    };
  }, [coreData, extrasData, attendanceHistory, user, userProfile, studentBatchId, studentBatchName, isPaid, currentTime]);

  const courses = dashboardData?.courses || [];
  const enrolledCourses = dashboardData?.enrolledCourses || [];
  const submissions = dashboardData?.submissions || [];
  const recordedClasses = dashboardData?.recordedClasses || [];
  const latestReplays = dashboardData?.latestReplays || [];
  const batchLiveClasses = dashboardData?.batchLiveClasses || [];
  const liveClassesList = dashboardData?.upcomingLiveClasses || [];
  const upcomingLiveList = dashboardData?.upcomingLiveClasses || [];
  const completedLiveList = dashboardData?.completedLiveClasses || [];
  const liveStats = dashboardData?.liveStats || { totalCompleted: 0, attendedCount: 0, attendanceRate: 100, totalScheduled: 0 };
  const isClassAttended = dashboardData?.isAttended || (() => false);
  const learningRanking = dashboardData?.learningRanking ?? null;

  // Real-time dynamic attendance metrics computed from actual student records
  const studentAttendanceRecords = attendanceHistory?.length ? attendanceHistory : (coreData?.attendanceRecords || []);
  const totalAttendanceCount = studentAttendanceRecords.length;
  const presentCount = studentAttendanceRecords.filter(a => a.status === 'Present' || a.attendedLive).length;
  const actualAttendanceRate = totalAttendanceCount > 0 ? Math.round((presentCount / totalAttendanceCount) * 100) : 100;

  // Real-time dynamic course progress metrics
  const totalCoursesCount = courses.length || 4;
  const completedCoursesCount = courses.filter(c => c.status === 'Completed' || c.progress === 100).length;
  const inProgressCoursesCount = courses.filter(c => c.status === 'In Progress' || (c.progress > 0 && c.progress < 100)).length;
  const inProgressCourse = courses.find(c => c.status === 'In Progress') || courses[0] || null;

  const mustChangePassword = Boolean(user?.mustChangePassword);

  const [selectedCourse, setSelectedCourse] = useState(null);

  // Assignments load only once a course is opened — never on the initial paint.
  const { data: assignments = [] } = useQuery({
    queryKey: ['assignments', selectedCourse?.id],
    queryFn: () => getAssignmentsForCourse(selectedCourse.id),
    enabled: !!selectedCourse?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Batch Assignments for Student Submission Portal
  const { 
    data: batchAssignments = [],
    refetch: refetchBatchAssignments 
  } = useQuery({
    queryKey: ['studentBatchAssignments', studentBatchId, studentBatchName, studentCourseName],
    queryFn: async () => {
      const allAsg = await getAssignments().catch(() => []);
      if (!allAsg || allAsg.length === 0) return [];
      return allAsg.filter(a => {
        if (!a) return false;
        const bId = String(a.batch_id || a.batchId || '').trim();
        const bName = String(a.batch_name || a.batchName || '').trim().toLowerCase();
        const cTitle = String(a.course_name || a.course || a.course_title || '').trim().toLowerCase();
        if (bId === 'all' || !bId) return true;
        if (studentBatchId && bId === String(studentBatchId).trim()) return true;
        if (studentBatchName && bName && bName === studentBatchName) return true;
        if (studentCourseName && cTitle && cTitle === studentCourseName.toLowerCase()) return true;
        return false;
      });
    },
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [activeAssignmentForSubmit, setActiveAssignmentForSubmit] = useState(null);
  const [submissionUrlInput, setSubmissionUrlInput] = useState('');
  const [submissionNotesInput, setSubmissionNotesInput] = useState('');
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);

  // Compute approved submissions count
  const approvedSubmissions = (submissions || []).filter(
    s => String(s.status || '').toLowerCase() === 'approved' || String(s.status || '').toLowerCase() === 'accepted'
  );
  const approvedSubmissionsCount = approvedSubmissions.length;
  const assignmentScore = batchAssignments.length > 0 ? Math.round((approvedSubmissionsCount / batchAssignments.length) * 100) : 100;
  const overallPerformanceScore = Math.round((actualAttendanceRate * 0.5) + (assignmentScore * 0.5));

  const handleAssignmentSubmit = async (e) => {
    e?.preventDefault();
    if (!submissionUrlInput.trim()) {
      showModal('Missing URL', 'Please enter your project repository URL, hosted demo, or submission drive link.', 'warning');
      return;
    }
    if (!activeAssignmentForSubmit) return;

    setIsSubmittingAssignment(true);
    try {
      await submitAssignmentToFirestore({
        assignmentId: activeAssignmentForSubmit.id,
        assignmentTitle: activeAssignmentForSubmit.title,
        studentId: uid,
        studentName: profileName || user?.name || 'Student',
        studentEmail: user?.email || '',
        batch_id: studentBatchId || user?.batch_id || '',
        batch_name: studentBatchName || user?.batch_name || '',
        submissionUrl: submissionUrlInput.trim(),
        notes: submissionNotesInput.trim(),
        status: 'Submitted', // Awaiting trainer/admin review
        submittedAt: new Date().toISOString()
      });
      showModal('Assignment Submitted!', 'Your solution has been submitted successfully and is now pending review by your trainer and admin.', 'success');
      setAssignmentModalOpen(false);
      setSubmissionUrlInput('');
      setSubmissionNotesInput('');
      setActiveAssignmentForSubmit(null);
      refetchExtras();
      refetchBatchAssignments();
    } catch (err) {
      showModal('Submission Failed', err.message || 'Could not submit assignment. Please try again.', 'error');
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [submitModalAssignment, setSubmitModalAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [vidQuery, setVidQuery] = useState('');
  const [vidCourse, setVidCourse] = useState('');
  const [matQuery, setMatQuery] = useState('');

  // Header/avatar values, seeded from the authenticated profile and kept in
  // sync when a child page saves a change.
  const initialPic = userProfile?.profile_pic || userProfile?.profilePhotoUrl || user?.profile_pic || user?.profilePhotoUrl || dashboardData?.student?.profile_pic || dashboardData?.student?.profilePhotoUrl || '';
  const [profileName, setProfileName] = useState(userProfile?.name || user?.name || '');
  const [profileCourse, setProfileCourse] = useState(userProfile?.course || user?.course || '');
  const [profilePic, setProfilePic] = useState(initialPic);

  useEffect(() => {
    setProfileName(userProfile?.name || user?.name || '');
    setProfileCourse(userProfile?.course || user?.course || '');
    const currentPic = userProfile?.profile_pic || userProfile?.profilePhotoUrl || user?.profile_pic || user?.profilePhotoUrl || dashboardData?.student?.profile_pic || dashboardData?.student?.profilePhotoUrl || '';
    if (currentPic) setProfilePic(currentPic);
  }, [user?.name, user?.course, user?.profile_pic, user?.profilePhotoUrl, userProfile?.profile_pic, userProfile?.profilePhotoUrl, dashboardData?.student?.profile_pic, dashboardData?.student?.profilePhotoUrl]);

  const fetchLiveClasses = refetchCore;
  const replaysLoading = extrasLoading;

  const handleJoinLiveClass = async (liveClass) => {
    const lock = getClassLockStatus(liveClass, currentTime);
    if (!lock.isUnlocked) {
      if (lock.isEnded) {
        showModal(
          'Live Class Over',
          `This live class for "${liveClass?.title}" has concluded (over 1 hour from start). Access is closed. Check Recorded Classes for session replays.`,
          'info'
        );
      } else {
        showModal(
          'Live Room Locked',
          `This live session is scheduled for ${liveClass?.time || 'today'} on ${liveClass?.date || ''}. The room unlocks automatically 5 minutes before start time (${lock.unlockTimeDisplay || '5m prior'}) so everyone can join together.`,
          'info'
        );
      }
      return;
    }

    let meetLink = liveClass?.meet_link || liveClass?.meetLink || liveClass?.join_url || liveClass?.meetingLink || liveClass?.link;
    if (!meetLink) {
      showModal('Link Unavailable', 'The meeting link has not been provided yet. Please contact your instructor.', 'warning');
      return;
    }

    meetLink = meetLink.trim();
    if (!/^https?:\/\//i.test(meetLink)) {
      meetLink = 'https://' + meetLink;
    }

    // ── AUTOMATIC ATTENDANCE RECORDING ──
    try {
      const studentId = uid || user?.id || userProfile?.id;
      const batchId = liveClass?.batch_id || liveClass?.batchId || studentBatchId || 'general';
      const batchName = liveClass?.batch_name || liveClass?.batchName || user?.batch_name || userProfile?.batch_name || 'Batch';
      const classId = liveClass?.id || liveClass?.uid || liveClass?._id;
      const classDate = liveClass?.date || new Date().toISOString().split('T')[0];
      const docId = `${batchId}_${classDate}_${studentId}`;

      const now = new Date();
      const attendanceRecord = {
        id: docId,
        uid: docId,
        studentId: studentId,
        student_id: studentId,
        studentName: user?.name || userProfile?.name || 'Student',
        student_name: user?.name || userProfile?.name || 'Student',
        rollNumber: user?.rollNumber || user?.studentIdNumber || userProfile?.rollNumber || 'N/A',
        email: user?.email || userProfile?.email || '',
        course: user?.course || userProfile?.course || liveClass?.course || '',
        batchId: batchId,
        batch_id: batchId,
        batchName: batchName,
        batch_name: batchName,
        date: classDate,
        status: 'Present',
        liveClassId: classId,
        liveClassTitle: liveClass.title || 'Live Class',
        joinTime: now.toISOString(),
        marked_by: 'Auto-Attendance (Live Class)',
        marked_time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        attendance_mode: 'Auto',
        attendedLive: true,
        updatedAt: now.toISOString(),
        createdAt: now.toISOString(),
      };

      // Write attendance record into attendance collection
      await setDocument('attendance', docId, attendanceRecord, true);

      // Increment joined count on live class if present
      if (classId) {
        const currentJoined = Number(liveClass.students_joined || liveClass.studentsJoined || 0) + 1;
        updateDocumentFields('liveClasses', classId, {
          students_joined: currentJoined,
          studentsJoined: currentJoined,
          last_joined_at: now.toISOString(),
        }).catch(() => {});
      }

      // Automatically recalculate aggregate attendance for the student profile
      try {
        const studentHistory = await getAttendanceForStudent(studentId);
        const presentCount = studentHistory.filter(h => (h.status || '').toLowerCase() === 'present').length;
        const totalCount = studentHistory.length;
        const absentCount = totalCount - presentCount;
        const pct = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;
        await updateStudent(studentId, {
          attendance: {
            present: presentCount,
            absent: absentCount,
            total_days: totalCount,
            percentage: pct,
          }
        });
      } catch (aggErr) {
        console.warn('[Auto-Attendance] Non-critical: could not sync student aggregate stats:', aggErr);
      }

      // Immediately invalidate queries so Attendance page, live stats, and student dashboard update in real-time
      queryClient.invalidateQueries({ queryKey: ['studentAttendance', studentId] });
      queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardCore', uid] });
      queryClient.invalidateQueries({ queryKey: ['studentDashboardExtras', uid] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSheets'] });

      console.info(`[Auto-Attendance] Recorded Present for student ${studentId} on class ${classId}`);
    } catch (attErr) {
      console.warn('[Auto-Attendance] Error recording attendance:', attErr.message);
    }

    // Launch live classroom link
    window.open(meetLink, '_blank', 'noopener,noreferrer');
  };

  // Open Course Player for a specific lesson from the Dashboard
  const openReplayInPlayer = (replay) => {
    if (!replay.access) return; // locked — handled in UI
    setReplayTarget({ courseId: replay.course_id, lessonId: replay.id });
    setActiveTab('recorded-classes-tab');
  };

  const payFeesMutation = useMutation({
    mutationFn: () => updateStudent(uid, { feesStatus: 'Pending Payment' }),
    onSuccess: () => {
      showModal('Payment Initiated', 'Please complete your payment with the administrator. Your status will be updated shortly.', 'info');
      // The student record lives in AuthContext — refresh it so the fee badge updates.
      refreshProfile();
    },
    onError: (err) => showModal('Error', classifyFirestoreError(err).message, 'error'),
  });

  const payFees = () => payFeesMutation.mutate();
  const paying = payFeesMutation.isPending;

  const submitAssignmentMutation = useMutation({
    mutationFn: async ({ assignmentId, submissionText }) => {
      return submitAssignmentToFirestore({
        assignmentId,
        studentId: uid,
        submissionText,
        studentName: user?.name || '',
      });
    },
    onSuccess: () => {
      setSubmitModalAssignment(null);
      setSubmissionText('');
      queryClient.invalidateQueries({ queryKey: ['studentDashboardExtras', uid] });
      showModal('Submitted!', 'Your assignment has been submitted successfully.', 'success');
    },
    onError: (err) => {
      const { message } = classifyFirestoreError(err);
      showModal('Submission Failed', message, 'error');
    },
  });

  const submitAssignment = (e) => {
    e.preventDefault();
    submitAssignmentMutation.mutate({ assignmentId: submitModalAssignment.id || submitModalAssignment._id, submissionText });
  };

  const navigateToPaymentDetails = () => {
    setActiveTab('profile');
    setTimeout(() => {
      const el = document.getElementById('profile-payment-card');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.style.transition = 'all 0.5s ease';
        el.style.transform = 'scale(1.03)';
        el.style.boxShadow = '0 0 25px rgba(108,60,240,0.5)';
        el.style.borderColor = 'var(--primary-color)';

        setTimeout(() => {
          el.style.transform = 'none';
          el.style.boxShadow = 'var(--shadow-card)';
          el.style.borderColor = 'var(--border-color)';
        }, 1500);
      }
    }, 200);
  };

  /* ── Greeting ── */
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  /* ── Quick action items ── */
  const quickActions = [
    { label: 'Courses', icon: <BookOpen size={18} />, action: () => setActiveTab('recorded-classes-tab') },
    { label: 'Live Classes', icon: <Video size={18} />, action: () => setActiveTab('my-courses') },
    { label: 'Batch Chat', icon: <MessageSquare size={18} />, action: () => setActiveTab('batch-chat-tab') },
    { label: 'Assignments', icon: <FileText size={18} />, action: () => setActiveTab('assignments-tab') },
    { label: 'Attendance', icon: <CalendarCheck size={18} />, action: () => setActiveTab('attendance-tab') },
    { label: 'Notice Board', icon: <Megaphone size={18} />, action: () => setActiveTab('announcements-tab') },
  ];

  /* ── SIDEBAR ITEMS (LEVLOX CLEAN DESIGN SYSTEM) ── */
  const navItems = [
    { id: 'dashboard', icon: <Bookmark size={18} strokeWidth={2} />, label: 'Dashboard' },
    { id: 'recorded-classes-tab', icon: <BookOpen size={18} strokeWidth={2} />, label: 'Courses' },
    { id: 'my-courses', icon: <Video size={18} strokeWidth={2} />, label: 'Live Classes' },
    { id: 'batch-chat-tab', icon: <MessageSquare size={18} strokeWidth={2} />, label: 'Batch Chat' },
    { id: 'assignments-tab', icon: <FileText size={18} strokeWidth={2} />, label: 'Assignments' },
    { id: 'attendance-tab', icon: <CalendarCheck size={18} strokeWidth={2} />, label: 'Attendance' },
    { id: 'announcements-tab', icon: <Megaphone size={18} strokeWidth={2} />, label: 'Notice Board' },
    { id: 'profile', icon: <User size={18} strokeWidth={2} />, label: 'Profile' },
  ];

  // ═══ DESKTOP-ONLY ACCESS GATE (ENFORCED SYSTEM ACCESS) ════════
  if (isMobileScreen && !bypassDesktopGate) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        background: 'radial-gradient(circle at 50% 25%, #151D36 0%, #0B101D 70%, #060911 100%)',
        zIndex: 9999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 20px',
        color: '#FFFFFF',
        textAlign: 'center',
        boxSizing: 'border-box',
        overflowY: 'auto',
        overflowX: 'hidden',
        margin: 0
      }}>
        <div style={{
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* Brand Logo with Glow */}
          <div style={{
            width: 76,
            height: 76,
            borderRadius: '50%',
            background: 'rgba(69, 104, 245, 0.14)',
            border: '2px solid rgba(69, 104, 245, 0.35)',
            boxShadow: '0 0 35px rgba(69, 104, 245, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20
          }}>
            <img 
              src={levloxLogo} 
              alt="Levlox" 
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'contain' }} 
            />
          </div>

          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            padding: '6px 14px',
            borderRadius: 999,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.6,
            marginBottom: 16,
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <Monitor size={14} /> SYSTEM ACCESS MANDATORY &bull; DESKTOP ONLY
          </div>

          <h2 style={{
            fontSize: 'clamp(20px, 5.5vw, 24px)',
            fontWeight: 800,
            margin: '0 0 12px',
            color: '#FFFFFF',
            letterSpacing: -0.4,
            lineHeight: 1.3,
            textAlign: 'center',
            width: '100%'
          }}>
            Desktop or Laptop System Required
          </h2>

          <p style={{
            fontSize: 13.5,
            color: '#94A3B8',
            maxWidth: 380,
            lineHeight: 1.6,
            margin: '0 0 22px',
            textAlign: 'center',
            width: '100%'
          }}>
            The Levlox Student Portal is strictly designed for PC and Laptop workstations. Full DRM stream protection, live code sandboxes, and proctored assignment verification require computer access.
          </p>

          {/* System Spec Pill */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 14,
            padding: '16px 20px',
            width: '100%',
            maxWidth: 380,
            marginBottom: 22,
            textAlign: 'left',
            boxSizing: 'border-box'
          }}>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#93C5FD',
              marginBottom: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              textAlign: 'center'
            }}>
              Required System Configuration
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: '#CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Laptop size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
                <span>Windows PC, Mac, or Linux Computer</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Monitor size={16} color="#60A5FA" style={{ flexShrink: 0 }} />
                <span>Minimum Resolution: 1024 &times; 768 pixels</span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 18, textAlign: 'center' }}>
            Please login from your desktop computer browser to continue.
          </div>

          <button
            onClick={() => setBypassDesktopGate(true)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#94A3B8',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 650,
              cursor: 'pointer',
              transition: 'all 0.18s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
          >
            Preview in Desktop Mode Anyway (Bypass)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Backdrop */}
      <div className={`sidebar-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* ═══ AQUAADMIN / LEVLOX NOVA CLEAN WHITE SIDEBAR ═════════════ */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-end', padding: '0 4px 10px' }}>
          <button className="sidebar-toggle-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)} title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}>
            {sidebarCollapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronLeft size={15} strokeWidth={2} />}
          </button>
        </div>

        {/* Levlox Official Brand Card */}
        <div className="srms-sidebar-brand">
          <div className="srms-sidebar-brand-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none', width: 'auto', height: 'auto', marginBottom: 8 }}>
            <img 
              src={levloxLogo} 
              alt="Levlox" 
              style={{ 
                width: sidebarCollapsed ? 32 : 46, 
                height: sidebarCollapsed ? 32 : 46, 
                borderRadius: '50%',
                objectFit: 'contain',
                boxShadow: '0 4px 14px rgba(45, 27, 160, 0.28)',
                transition: 'all 0.2s ease'
              }} 
            />
          </div>
          {!sidebarCollapsed && (
            <>
              <h2 className="srms-sidebar-brand-title">
                LEVLOX
              </h2>
              <span className="srms-sidebar-brand-sub">Intelligent Learning Experience</span>
            </>
          )}
        </div>

        <nav className="sidebar-menu" style={{ overflowY: 'auto' }}>
          {navItems.map(item => {
            const isDisabled = mustChangePassword && item.id !== 'settings';
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.label}
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => {
                  if (isDisabled) {
                    showModal('Security Alert', 'You are logged in with a temporary password. Please change your password to unlock the student portal.', 'warning');
                    return;
                  }
                  setActiveTab(item.id);
                  setSelectedCourse(null);
                  setMobileMenuOpen(false);
                  try {
                    refetchAll();
                  } catch (_) {}
                }}
                style={isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
              >
                {item.icon}
                <span className="sidebar-link-text">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid #E5EAF2', paddingTop: 12 }}>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: '#F43F5E', fontWeight: 650 }} title={sidebarCollapsed ? "Logout" : undefined}>
            <LogOut size={18} strokeWidth={2} color="#F43F5E" />
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ═══════════════════════════════════ */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>

        {/* ── SRMS TOP NAVBAR (MATCHING REFERENCE SCREENSHOT) ── */}
        <SrmsHeader
          title={
            activeTab === 'dashboard' ? 'Dashboard' :
            activeTab === 'recorded-classes-tab' ? 'Courses' :
            activeTab === 'my-courses' ? 'Live Classes' :
            activeTab === 'batch-chat-tab' ? 'Batch Chat' :
            activeTab === 'assignments-tab' ? 'Assignments' :
            activeTab === 'attendance-tab' ? 'Attendance' :
            activeTab === 'announcements-tab' ? 'Notice Board' :
            activeTab === 'profile' ? 'Profile' : 'Dashboard'
          }
          userName={profileName || user.name || 'Abhishek Verma'}
          userRole={`${profileCourse || user.course || 'B.Tech CSE'} - ${user?.batch_name || userProfile?.batch_name || '3rd Year'}`}
          userAvatar={profilePic}
          notificationComponent={<NotificationBell userId={uid} userRole="student" />}
          onSearch={() => {}}
          onToggleSidebar={() => {
            if (window.innerWidth <= 768) setMobileMenuOpen(true);
            else setSidebarCollapsed(!sidebarCollapsed);
          }}
          onProfileClick={() => setShowProfileDropdown(!showProfileDropdown)}
        />

        {/* Profile Dropdown Floating Menu */}
        {showProfileDropdown && (
          <div style={{ position: 'fixed', right: 32, top: 76, width: 230, background: 'white', border: '1.5px solid var(--border-color)', borderRadius: 14, boxShadow: 'var(--shadow-lg)', padding: '8px', zIndex: 1000, animation: 'fadeInUp 0.18s ease' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: 6 }}>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)' }}>{profileName || user.name || 'Student'}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>{user.email}</p>
            </div>
            <button
              onClick={() => {
                setActiveTab('profile');
                setShowProfileDropdown(false);
              }}
              style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 600 }}
            >
              <User size={15} color="var(--text-secondary)" /> View Profile
            </button>
            <button
              onClick={handleLogout}
              style={{ width: '100%', padding: '9px 12px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, color: '#EF4444', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', fontWeight: 600, marginTop: 2 }}
            >
              <LogOut size={15} /> Logout
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════
            DASHBOARD TAB — PREMIUM LAYOUT
        ═══════════════════════════════════════════ */}
        {/* Core data still loading — show the shell with placeholders rather
            than an empty content area. */}
        {activeTab === 'dashboard' && coreLoading && <DashboardSkeleton />}

        {/* Core load failed — explain it and offer a retry instead of a blank page. */}
        {activeTab === 'dashboard' && !coreLoading && coreError && (
          <div style={{
            background: '#FFF',
            border: '1.5px solid #FCA5A5',
            borderRadius: 18,
            padding: '32px 28px',
            textAlign: 'center',
          }}>
            <TriangleAlert size={26} color="#EF4444" style={{ marginBottom: 10 }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>
              Could not load your dashboard
            </h3>
            <p style={{ margin: '0 0 18px', fontSize: 13.5, color: 'var(--text-secondary)' }}>
              {classifyFirestoreError(coreError).message}
            </p>
            <button className="btn btn-primary" onClick={() => refetchCore()} style={{ padding: '9px 20px' }}>
              Try again
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && !coreLoading && !coreError && dashboardData && (
          <div className="animate-fade-in">
            {/* 1. ULTRA-PREMIUM LEVLOX HERO WELCOME BANNER (MATCHING USER REFERENCE) */}
            <div className="levlox-welcome-banner">
              {/* Left Column: Greeting, Meta & Action Buttons */}
              <div className="levlox-banner-left">
                <div className="levlox-banner-badge">
                  <GraduationCap size={14} color="#2563EB" strokeWidth={2.4} />
                  <span>Welcome Back</span>
                </div>

                <h1 className="levlox-banner-title">
                  {greeting()},<br />
                  <span className="levlox-banner-name">{profileName || currentStudent?.name || user.name || 'Student'}</span> <span className="levlox-wave">👋</span>
                </h1>

                <p className="levlox-banner-sub">
                  Keep learning. Keep growing. Your future is built here.
                </p>

                {/* 2-Column Meta Stats */}
                <div className="levlox-banner-meta-grid">
                  <div className="levlox-banner-meta-item">
                    <div className="levlox-banner-meta-icon">
                      <GraduationCap size={19} color="#172033" strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="levlox-meta-main">{studentCourseName}</div>
                      <div className="levlox-meta-tag">Current Batch &bull; {studentDoc?.batch || studentDoc?.batch_name || user?.batch_name || userProfile?.batch_name || 'Active'}</div>
                    </div>
                  </div>

                  <div className="levlox-banner-meta-divider" />

                  <div className="levlox-banner-meta-item">
                    <div className="levlox-banner-meta-icon">
                      <Calendar size={18} color="#172033" strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="levlox-meta-main">Next Live Session</div>
                      <div className="levlox-meta-tag">
                        {upcomingLiveList.length > 0
                          ? `${upcomingLiveList[0].date || 'Today'}, ${upcomingLiveList[0].time || '10:00 AM'}`
                          : 'Today, 10:00 AM'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="levlox-banner-actions">
                  <button 
                    className="levlox-btn-primary"
                    onClick={() => setActiveTab('recorded-classes-tab')}
                  >
                    <Play size={13} fill="#FFFFFF" /> Continue Learning &rarr;
                  </button>
                  <button 
                    className="levlox-btn-secondary"
                    onClick={() => setActiveTab('attendance-tab')}
                  >
                    <CalendarCheck size={14} color="#172033" /> View Attendance
                  </button>
                </div>
              </div>

              {/* Center Floating Progress Card */}
              <div className="levlox-progress-card">
                <div className="levlox-progress-header">
                  <RefreshCw size={13} color="#2563EB" strokeWidth={2.5} />
                  <span>Your Progress</span>
                </div>

                <div className="levlox-progress-body">
                  {/* Circular Donut Ring */}
                  <div className="levlox-progress-donut-wrap">
                    <svg width="74" height="74" viewBox="0 0 74 74">
                      <circle cx="37" cy="37" r="30" fill="none" stroke="#E2E8F0" strokeWidth="6.5" />
                      <circle 
                        cx="37" cy="37" r="30" fill="none" stroke="#2563EB" strokeWidth="6.5"
                        strokeDasharray={188.5}
                        strokeDashoffset={188.5 - (188.5 * actualAttendanceRate) / 100}
                        strokeLinecap="round"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.8s ease' }}
                      />
                    </svg>
                    <span className="levlox-progress-donut-num">{actualAttendanceRate}%</span>
                  </div>

                  {/* Stat Breakdown Rows */}
                  <div className="levlox-progress-list">
                    <div className="levlox-progress-row">
                      <div className="levlox-progress-row-left">
                        <span className="levlox-progress-dot" style={{ background: '#2563EB' }} />
                        <span>Courses Completed</span>
                      </div>
                      <span className="levlox-progress-val">{completedCoursesCount} / {totalCoursesCount}</span>
                    </div>

                    <div className="levlox-progress-row">
                      <div className="levlox-progress-row-left">
                        <span className="levlox-progress-dot" style={{ background: '#7C3AED' }} />
                        <span>Assignments</span>
                      </div>
                      <span className="levlox-progress-val">{approvedSubmissionsCount} / {batchAssignments.length || 1}</span>
                    </div>

                    <div className="levlox-progress-row">
                      <div className="levlox-progress-row-left">
                        <span className="levlox-progress-dot" style={{ background: '#10B981' }} />
                        <span>Attendance</span>
                      </div>
                      <span className="levlox-progress-val">{actualAttendanceRate}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: 3D Workspace Scene */}
              <div className="levlox-banner-graphic">
                <img 
                  src={levloxWorkspace3D} 
                  alt="Levlox 3D Workspace" 
                  className="levlox-banner-img"
                />
              </div>
            </div>

            {/* GENUINE ACTIVE LIVE CLASS ALERT (Rendered only when session is genuinely live) */}
            {upcomingLiveList.length > 0 && getClassLockStatus(upcomingLiveList[0], currentTime).isLive && (
              <div style={{
                background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)',
                border: '1px solid #059669',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.2)',
                color: '#FFFFFF'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={22} color="#A7F3D0" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span className="nova-live-badge"><span className="nova-live-dot" /> LIVE SESSION ACTIVE NOW</span>
                      <span style={{ fontSize: 12, color: '#A7F3D0' }}>{upcomingLiveList[0].time || 'Now'}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>{upcomingLiveList[0].title}</h3>
                  </div>
                </div>
                <button
                  onClick={() => handleJoinLiveClass(upcomingLiveList[0])}
                  style={{
                    background: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 9,
                    fontWeight: 750,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  Join Live Room &rarr;
                </button>
              </div>
            )}

            {/* RECENTLY VIEWED VIDEOS & FEE STATUS HIGHLIGHT ROW */}
            {(() => {
              const allRecordings = recordedClasses || dashboardData?.recordedClasses || [];
              const relevantRecordings = allRecordings.filter(r => {
                if (!r) return false;
                if (r.visibility === 'everyone') return true;
                const rbId = String(r.batch_id || r.batchId || '').trim().toLowerCase();
                if (studentBatchId && rbId === String(studentBatchId).trim().toLowerCase()) return true;
                if (studentBatchName && r.batch_name && String(r.batch_name).trim().toLowerCase() === studentBatchName.toLowerCase()) return true;
                return !rbId || rbId === 'all';
              });

              const primaryRecent = (recentlyViewedVideos && recentlyViewedVideos.length > 0)
                ? recentlyViewedVideos[0]
                : (relevantRecordings.length > 0
                    ? {
                        id: relevantRecordings[0].id || relevantRecordings[0].uid,
                        title: relevantRecordings[0].title,
                        courseTitle: relevantRecordings[0].course_title || relevantRecordings[0].course_name || studentCourseName,
                        category: relevantRecordings[0].module || 'Core Lecture',
                        thumbnail: relevantRecordings[0].thumbnail || getResolvedThumbnail(relevantRecordings[0].video_url),
                        duration: relevantRecordings[0].duration || '1h 30m',
                        percentage: 0,
                        video_url: relevantRecordings[0].video_url,
                      }
                    : null
                  );

              return (
                <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 20, marginBottom: 22 }}>
                  {/* Recently Viewed Videos Widget */}
                  <div className="srms-card" style={{ padding: '18px 20px' }}>
                    <div className="srms-card-header" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <PlayCircle size={18} color="#4568F5" />
                        <h3 className="srms-card-title">Recently Viewed Videos</h3>
                      </div>
                      <button className="srms-card-link" onClick={() => setActiveTab('recorded-classes-tab')}>
                        Browse All Courses <ArrowRight size={13} />
                      </button>
                    </div>

                    {primaryRecent ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        background: '#F8FAFD',
                        padding: '12px 14px',
                        borderRadius: 14,
                        border: '1px solid #EEF2F8',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                      }}>
                        {/* Video Thumbnail with Play Button Overlay */}
                        <div
                          onClick={() => setDashboardActiveVideo(primaryRecent)}
                          style={{
                            width: 110,
                            height: 68,
                            borderRadius: 10,
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#0F172A',
                            cursor: 'pointer',
                            flexShrink: 0,
                            boxShadow: '0 3px 10px rgba(0,0,0,0.1)'
                          }}
                          title="Click to resume video"
                        >
                          <img 
                            src={primaryRecent.thumbnail || 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80'} 
                            alt={primaryRecent.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }} 
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: '#4568F5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(69, 104, 245, 0.6)'
                            }}>
                              <Play size={13} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: 2 }} />
                            </div>
                          </div>
                          <span style={{
                            position: 'absolute',
                            bottom: 4,
                            right: 4,
                            background: 'rgba(0,0,0,0.75)',
                            color: '#FFFFFF',
                            fontSize: 9.5,
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: 4
                          }}>
                            {primaryRecent.duration || '45m'}
                          </span>
                        </div>

                        {/* Video Details */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{
                              fontSize: 10,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '1px 6px',
                              borderRadius: 4,
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              whiteSpace: 'nowrap'
                            }}>
                              {primaryRecent.courseTitle || studentCourseName}
                            </span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>&bull;</span>
                            <span style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap' }}>
                              {primaryRecent.percentage ? `${primaryRecent.percentage}% completed` : 'Up next'}
                            </span>
                          </div>

                          <h4 style={{
                            margin: '0 0 6px',
                            fontSize: 13.5,
                            fontWeight: 750,
                            color: '#172033',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {primaryRecent.title}
                          </h4>

                          <div style={{ width: '100%', height: 5, background: '#E2E8F0', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, Math.max(10, primaryRecent.percentage || 20))}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #4568F5, #6366F1)',
                              borderRadius: 999
                            }} />
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => setDashboardActiveVideo(primaryRecent)}
                          style={{
                            background: '#4568F5',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 15px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 2px 8px rgba(69, 104, 245, 0.3)'
                          }}
                        >
                          <Play size={12} fill="#FFFFFF" /> Resume
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B', background: '#F8FAFD', borderRadius: 12 }}>
                        <PlayCircle size={28} color="#94A3B8" style={{ marginBottom: 6 }} />
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>No video lessons posted for your batch yet.</p>
                      </div>
                    )}

                    {/* Chips for other recent or available batch videos */}
                    {((recentlyViewedVideos && recentlyViewedVideos.length > 1) || relevantRecordings.length > 1) && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 2 }}>
                        {(recentlyViewedVideos && recentlyViewedVideos.length > 1 
                          ? recentlyViewedVideos.slice(1, 5) 
                          : relevantRecordings.slice(1, 5).map(r => ({
                              id: r.id || r.uid,
                              title: r.title,
                              percentage: 0,
                              video_url: r.video_url,
                              thumbnail: r.thumbnail || getResolvedThumbnail(r.video_url),
                              courseTitle: r.course_title || studentCourseName
                            }))
                        ).map((v, vi) => (
                          <div
                            key={v.id || vi}
                            onClick={() => setDashboardActiveVideo(v)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 10px',
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: 8,
                              cursor: 'pointer',
                              fontSize: 11.5,
                              color: '#475569',
                              whiteSpace: 'nowrap',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4568F5'; e.currentTarget.style.color = '#4568F5'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                          >
                            <PlayCircle size={12} color="#4568F5" />
                            <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</span>
                            {v.percentage > 0 && <span style={{ fontSize: 10, color: '#94A3B8' }}>({v.percentage}%)</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fee & Enrollment Quick Ledger (100% Dynamic from Database) */}
                  <div className="srms-card" style={{ padding: '18px 20px' }}>
                    <div className="srms-card-header" style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Shield size={17} color="#10B981" />
                        <h3 className="srms-card-title">Fees & Enrollment</h3>
                      </div>
                      <span 
                        className="srms-badge" 
                        style={{ 
                          background: isPaid ? '#ECFDF5' : (isPartial ? '#FFFBEB' : '#FEF2F2'), 
                          color: isPaid ? '#059669' : (isPartial ? '#D97706' : '#DC2626'), 
                          border: `1px solid ${isPaid ? '#A7F3D0' : (isPartial ? '#FDE68A' : '#FECACA')}` 
                        }}
                      >
                        {dynamicFeesStatus}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: '#F8FAFD', padding: '12px 14px', borderRadius: 12, border: '1px solid #EEF2F8' }}>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Fee</span>
                        <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#172033' }}>
                          ₹{dynamicFeesTotal.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Paid</span>
                        <p style={{ margin: '2px 0 0', fontSize: 16, fontWeight: 800, color: '#10B981' }}>
                          ₹{dynamicFeesPaid.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div>
                        <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Due Balance</span>
                        <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 800, color: dynamicFeesRemaining > 0 ? '#DC2626' : '#10B981' }}>
                          {dynamicFeesRemaining > 0 ? `₹${dynamicFeesRemaining.toLocaleString('en-IN')}` : 'Nil (Clear)'}
                        </p>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, color: '#64748B', borderTop: '1px dashed #E2E8F0', paddingTop: 8 }}>
                      <span>Batch: <strong style={{ color: '#1E293B' }}>{studentDoc?.batch || studentDoc?.batch_name || user?.batch_name || userProfile?.batch_name || 'Assigned Cohort'}</strong></span>
                      <span>Course: <strong style={{ color: '#2563EB' }}>{studentCourseName}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. FIVE COMPACT KPI STAT CARDS IN A SINGLE ROW (AquaAdmin Style) */}
            <SrmsKpiCardsRow
              cards={[
                {
                  icon: FileText,
                  label: 'Assignments Completed',
                  value: `${approvedSubmissionsCount} Completed`,
                  subtext: `${batchAssignments.length} Total Assigned`,
                  bg: '#7C3AED',
                  iconColor: '#FFFFFF',
                  color: '#7C3AED',
                  onClick: () => setActiveTab('assignments-tab'),
                },
                {
                  icon: GraduationCap,
                  label: 'Courses Enrolled',
                  value: enrolledCourses.length || 1,
                  subtext: `${inProgressCoursesCount} In Progress`,
                  bg: '#3B82F6',
                  iconColor: '#FFFFFF',
                  color: '#3B82F6',
                  onClick: () => setActiveTab('recorded-classes-tab'),
                },
                {
                  icon: ClipboardList,
                  label: 'Completed Sessions',
                  value: completedLiveList.length,
                  subtext: `${batchLiveClasses.length} Scheduled`,
                  bg: '#EF4444',
                  iconColor: '#FFFFFF',
                  color: '#EF4444',
                  onClick: () => setActiveTab('recorded-classes-tab'),
                },
                {
                  icon: Trophy,
                  label: 'Batch Rank',
                  value: learningRanking?.currentStudent?.rank ? `#${learningRanking.currentStudent.rank}` : '#1',
                  subtext: 'Cohort Performance',
                  bg: '#F59E0B',
                  iconColor: '#FFFFFF',
                  color: '#F59E0B',
                  onClick: () => setActiveTab('assignments-tab'),
                },
                {
                  icon: CalendarCheck,
                  label: 'Attendance',
                  value: `${actualAttendanceRate}%`,
                  subtext: `${presentCount} of ${totalAttendanceCount} Present`,
                  bg: '#10B981',
                  iconColor: '#FFFFFF',
                  color: '#10B981',
                  onClick: () => setActiveTab('attendance-tab'),
                },
              ]}
            />

            {/* 3. MIDDLE 2-COLUMN ROW (RECENT LIVE CLASSES TABLE + NOTICE BOARD) */}
            <div className="srms-middle-grid">
              <SrmsRecentLiveClassesTable
                liveClasses={batchLiveClasses || []}
                onViewAll={() => setActiveTab('my-courses')}
                onJoin={handleJoinLiveClass}
                onReplay={(c) => {
                  setReplayTarget(c);
                  setActiveTab('my-courses');
                }}
              />

              <SrmsNoticeBoard
                notices={
                  (coreData?.announcements || []).filter(a => {
                    if (!a) return false;
                    const target = String(a.target || '').toLowerCase();
                    const batchId = String(a.batch_id || a.batchId || '').trim();
                    if (target === 'all' || batchId === 'all') return true;
                    if (studentBatchId && batchId === String(studentBatchId).trim()) return true;
                    if (studentBatchName && a.batch_name && String(a.batch_name).trim().toLowerCase() === studentBatchName) return true;
                    return false;
                  }).map(a => ({
                    title: a.title,
                    description: a.content || a.message || '',
                    date: a.date || 'Today',
                    senderRole: a.senderRole || 'admin',
                    senderName: a.senderName || 'Super Admin',
                    batch_name: a.batch_name || (a.batch_id === 'all' ? 'All Batches' : ''),
                    onClick: () => setActiveTab('announcements-tab'),
                  }))
                }
                onViewAll={() => setActiveTab('announcements-tab')}
              />
            </div>

            {/* 4. BOTTOM 3-COLUMN ROW (CALENDAR + QUICK ACCESS + DONUT CHART) */}
            <div className="srms-bottom-grid">
              <SrmsCalendarWidget onViewCalendar={() => setActiveTab('attendance-tab')} />

              <SrmsQuickAccess
                items={[
                  { label: 'My Courses', icon: BookOpen, color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0', onClick: () => setActiveTab('recorded-classes-tab') },
                  { label: 'Assignments', icon: FileText, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', onClick: () => setActiveTab('assignments-tab') },
                  { label: 'Attendance', icon: CalendarCheck, color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A', onClick: () => setActiveTab('attendance-tab') },
                  { label: 'Notice Board', icon: Megaphone, color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', onClick: () => setActiveTab('announcements-tab') },
                  { label: 'My Profile', icon: User, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', onClick: () => setActiveTab('profile') },
                ]}
              />

              <SrmsPerformanceDonut
                score={overallPerformanceScore}
                label="Overall Performance"
                legend={[
                  { label: "Attendance", val: `${actualAttendanceRate}%`, color: "#10B981" },
                  { label: "Assignments", val: `${assignmentScore}%`, color: "#4568F5" },
                  { label: "Curriculum", val: `${Math.round((completedCoursesCount / Math.max(1, totalCoursesCount)) * 100)}%`, color: "#8B5CF6" },
                ]}
                onViewDetails={() => setActiveTab('assignments-tab')}
              />
            </div>

            {/* 5. MINIMAL CLEAN FOOTER */}
            <SrmsFooter />
          </div>
        )}

        {/* ═══ SUBMIT ASSIGNMENT TAB (AQUAADMIN STYLE) ═══ */}
        {activeTab === 'assignments-tab' && (
          <div className="dashboard-card-section">
            {/* Section Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 24,
              padding: '2px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7C3AED, #9333EA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                }}>
                  <FileText size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#172033', letterSpacing: -0.3 }}>
                      Submit Assignment
                    </h2>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 750,
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #E2E8F0',
                      padding: '2px 9px',
                      borderRadius: 16,
                    }}>
                      Batch: {user?.batch_name || userProfile?.batch_name || 'LEV-AI-05'}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                    Submit practical projects for review by Trainer & Admin. Approved submissions count towards your progress.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  padding: '6px 12px',
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#059669',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 750,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <CheckCircle size={15} /> {approvedSubmissionsCount} Approved
                </span>
                <span style={{
                  padding: '6px 12px',
                  background: '#EEF2FE',
                  border: '1px solid #C7D4FD',
                  color: '#4568F5',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 750
                }}>
                  {batchAssignments.length} Assigned
                </span>
              </div>
            </div>

            {/* Assignments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {batchAssignments.length === 0 ? (
                <div style={{
                  padding: 40,
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E5EAF2',
                  textAlign: 'center',
                  color: '#64748B'
                }}>
                  <FileText size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#172033' }}>No Assignments Available</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 13 }}>Your trainers have not posted any assignments for this batch yet.</p>
                </div>
              ) : (
                batchAssignments.map(asg => {
                  const sub = (submissions || []).find(s => s.assignmentId === asg.id);
                  const isApproved = sub && (String(sub.status || '').toLowerCase() === 'approved' || String(sub.status || '').toLowerCase() === 'accepted');
                  const isSubmitted = sub && !isApproved;

                  return (
                    <div 
                      key={asg.id}
                      style={{
                        background: '#FFFFFF',
                        border: '1px solid #E5EAF2',
                        borderRadius: 14,
                        padding: '22px 24px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 750,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#F1F5F9',
                              color: '#475569',
                              border: '1px solid #E2E8F0'
                            }}>
                              Due: {asg.dueDate || 'Flexible'}
                            </span>
                            <span style={{
                              fontSize: 10.5,
                              fontWeight: 750,
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE'
                            }}>
                              Max Marks: {asg.totalMarks || 100}
                            </span>
                            {asg.createdBy && (
                              <span style={{
                                fontSize: 10.5,
                                fontWeight: 750,
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#F5F3FF',
                                color: '#7C3AED',
                                border: '1px solid #DDD6FE'
                              }}>
                                Assigned by: {asg.createdBy}
                              </span>
                            )}
                          </div>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#172033' }}>
                            {asg.title}
                          </h3>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isApproved ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: '#ECFDF5',
                              border: '1px solid #A7F3D0',
                              color: '#059669',
                              fontSize: 12,
                              fontWeight: 800
                            }}>
                              <CheckCircle size={15} /> Approved & Accepted
                            </span>
                          ) : isSubmitted ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: '#FFFBEB',
                              border: '1px solid #FDE68A',
                              color: '#D97706',
                              fontSize: 12,
                              fontWeight: 800
                            }}>
                              <Clock size={15} /> Submitted — Under Review
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 999,
                              background: '#F1F5F9',
                              border: '1px solid #E2E8F0',
                              color: '#64748B',
                              fontSize: 12,
                              fontWeight: 800
                            }}>
                              Pending Submission
                            </span>
                          )}
                        </div>
                      </div>

                      <p style={{ margin: '0 0 16px', fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
                        {asg.description}
                      </p>

                      {/* If student has already submitted */}
                      {sub && (
                        <div style={{
                          background: isApproved ? '#F0FDF4' : '#F8FAFC',
                          border: `1px solid ${isApproved ? '#BBF7D0' : '#E2E8F0'}`,
                          borderRadius: 10,
                          padding: '14px 16px',
                          marginBottom: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#172033' }}>
                              <span>Repository / Demo Link:</span>
                              <a href={sub.submissionUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#4568F5', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                {sub.submissionUrl} <ExternalLink size={12} />
                              </a>
                            </div>
                            {sub.grade && (
                              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#059669', background: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                                Grade: {sub.grade} ({sub.marks || 95}/100)
                              </span>
                            )}
                          </div>
                          {sub.notes && (
                            <div style={{ fontSize: 12, color: '#64748B' }}>
                              <span style={{ fontWeight: 650, color: '#334155' }}>Your Notes:</span> {sub.notes}
                            </div>
                          )}
                          {sub.feedback && (
                            <div style={{ fontSize: 12, color: '#059669', marginTop: 2, background: '#ECFDF5', padding: '6px 10px', borderRadius: 6 }}>
                              <span style={{ fontWeight: 750 }}>Reviewer Feedback:</span> {sub.feedback}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        {isApproved ? (
                          <button
                            onClick={() => {
                              setActiveAssignmentForSubmit(asg);
                              setSubmissionUrlInput(sub?.submissionUrl || '');
                              setSubmissionNotesInput(sub?.notes || '');
                              setAssignmentModalOpen(true);
                            }}
                            style={{
                              padding: '8px 16px',
                              background: '#F8FAFD',
                              border: '1px solid #CBD5E1',
                              borderRadius: 8,
                              color: '#475569',
                              fontSize: 12.5,
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Update Submission
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveAssignmentForSubmit(asg);
                              setSubmissionUrlInput(sub?.submissionUrl || '');
                              setSubmissionNotesInput(sub?.notes || '');
                              setAssignmentModalOpen(true);
                            }}
                            style={{
                              padding: '9px 18px',
                              background: '#4568F5',
                              border: 'none',
                              borderRadius: 8,
                              color: '#FFFFFF',
                              fontSize: 13,
                              fontWeight: 750,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              boxShadow: '0 2px 8px rgba(69, 104, 245, 0.25)'
                            }}
                          >
                            <FileText size={15} /> {isSubmitted ? 'Resubmit Solution' : 'Submit Solution'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Submit Assignment Modal */}
            {assignmentModalOpen && activeAssignmentForSubmit && (
              <div 
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 2000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 16
                }}
                onClick={() => setAssignmentModalOpen(false)}
              >
                <div 
                  style={{
                    background: '#FFFFFF',
                    borderRadius: 16,
                    padding: 24,
                    width: '100%',
                    maxWidth: 540,
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                    border: '1px solid #E5EAF2'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #EEF2F8', paddingBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#172033' }}>
                        Submit Assignment
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
                        {activeAssignmentForSubmit.title}
                      </p>
                    </div>
                    <button 
                      onClick={() => setAssignmentModalOpen(false)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleAssignmentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Project / Repository URL <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input 
                        type="url"
                        placeholder="e.g. https://github.com/username/project or hosted demo URL"
                        value={submissionUrlInput}
                        onChange={e => setSubmissionUrlInput(e.target.value)}
                        required
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 13,
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Implementation Notes / Summary (Optional)
                      </label>
                      <textarea 
                        rows={4}
                        placeholder="Brief explanation of your solution, libraries used, and how to test..."
                        value={submissionNotesInput}
                        onChange={e => setSubmissionNotesInput(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          fontSize: 13,
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>

                    <div style={{
                      padding: '10px 14px',
                      background: '#F8FAFD',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      fontSize: 12,
                      color: '#64748B',
                      lineHeight: 1.4
                    }}>
                      <strong>Note:</strong> Once submitted, your trainer and administrator will review your work, assign marks, and approve it. Approved assignments directly increment your <strong>Assignments Completed</strong> count.
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                      <button
                        type="button"
                        onClick={() => setAssignmentModalOpen(false)}
                        style={{
                          padding: '9px 16px',
                          background: '#F1F5F9',
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
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
                        disabled={isSubmittingAssignment}
                        style={{
                          padding: '9px 20px',
                          background: '#4568F5',
                          border: 'none',
                          borderRadius: 8,
                          color: '#FFFFFF',
                          fontWeight: 750,
                          fontSize: 13,
                          cursor: isSubmittingAssignment ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {isSubmittingAssignment ? 'Submitting...' : 'Confirm Submission'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENROLLED / LIVE CLASSES TAB */}
        {activeTab === 'my-courses' && (
          <div className="dashboard-card-section">
            {/* ── TOP SECTION HEADER WITH 3D GLASS ACCENT ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 20,
              padding: '2px 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <GlassVideo3D size={42} platform="default" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: '#0F172A', letterSpacing: -0.3 }}>
                      Live Classes
                    </h3>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #E2E8F0',
                      padding: '2px 8px',
                      borderRadius: 16,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      <Users size={11} color="#64748B" />
                      Batch: {user?.batch_name || userProfile?.batch_name || 'LEV-AI-05'}
                    </span>
                  </div>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748B', fontWeight: 450 }}>
                    Scheduled live interactive lectures. Links unlock 5 minutes before class.
                  </p>
                </div>
              </div>

              <button
                className="btn btn-outline"
                style={{
                  padding: '7px 13px',
                  fontSize: 11.5,
                  fontWeight: 650,
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#FFFFFF',
                  borderColor: '#E2E8F0',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                  transition: 'all 0.2s ease',
                }}
                onClick={fetchLiveClasses}
              >
                <RefreshCw size={13} color="#64748B" />
                Refresh Schedule
              </button>
            </div>

            {/* ── 3D FROSTED GLASS BENTO KPI CARDS ── */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: 14,
              marginBottom: 20,
            }}>
              {/* CARD 1: ATTENDANCE */}
              <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GlassDocument3D size={38} color="emerald" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                        Attendance
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        Completed Lectures
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: liveStats.attendanceRate >= 75 ? '#065F46' : '#9A3412',
                    background: liveStats.attendanceRate >= 75 ? '#ECFDF5' : '#FFF7ED',
                    padding: '3px 8px',
                    borderRadius: 14,
                  }}>
                    {liveStats.attendanceRate >= 75 ? 'Good Standing' : 'Needs Attention'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1 }}>
                    {liveStats.attendanceRate}%
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 550, color: '#64748B' }}>
                    overall rate
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 450 }}>
                  {liveStats.attendedCount} of {liveStats.totalCompleted} finished session{liveStats.totalCompleted !== 1 ? 's' : ''} attended
                </div>
              </div>

              {/* CARD 2: UPCOMING CLASSES */}
              <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GlassCalendar3D size={38} day={new Date().getDate().toString()} month="OCT" />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                        Upcoming Classes
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        Scheduled Live
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: upcomingLiveList.length > 0 ? '#1D4ED8' : '#64748B',
                    background: upcomingLiveList.length > 0 ? '#EFF6FF' : '#F1F5F9',
                    padding: '3px 8px',
                    borderRadius: 14,
                  }}>
                    {upcomingLiveList.length > 0 ? 'Active' : 'None'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1 }}>
                    {upcomingLiveList.length}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 550, color: '#64748B' }}>
                    session{upcomingLiveList.length !== 1 ? 's' : ''} scheduled
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 450 }}>
                  Rooms unlock 5 minutes prior to class
                </div>
              </div>

              {/* CARD 3: COMPLETED CLASSES */}
              <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <GlassFolder3D size={38} />
                    <div>
                      <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                        Completed Classes
                      </h4>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                        Concluded Sessions
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: '#475569',
                    background: '#F1F5F9',
                    padding: '3px 8px',
                    borderRadius: 14,
                  }}>
                    Archived
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1 }}>
                    {completedLiveList.length}
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 550, color: '#64748B' }}>
                    past session{completedLiveList.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 450 }}>
                  Links close 1 hour after class start
                </div>
              </div>
            </div>

            {/* ── HIGH-END SEGMENTED PILL CAPSULE SWITCHER ── */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 10,
            }}>
              <div className="glass-segmented-capsule" style={{ padding: '3px' }}>
                <button
                  type="button"
                  className={`glass-segment-btn ${liveClassSubTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setLiveClassSubTab('upcoming')}
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  <Video size={14} color={liveClassSubTab === 'upcoming' ? 'var(--primary-color)' : '#64748B'} strokeWidth={2.2} />
                  <span>Active & Upcoming</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 8,
                    background: liveClassSubTab === 'upcoming' ? 'var(--primary-light)' : 'rgba(0,0,0,0.05)',
                    color: liveClassSubTab === 'upcoming' ? 'var(--primary-color)' : '#64748B',
                  }}>
                    {upcomingLiveList.length}
                  </span>
                  {upcomingLiveList.some(c => getClassLockStatus(c, currentTime).isUnlocked) && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse-dot 1.5s infinite' }} />
                  )}
                </button>

                <button
                  type="button"
                  className={`glass-segment-btn ${liveClassSubTab === 'completed' ? 'active' : ''}`}
                  onClick={() => setLiveClassSubTab('completed')}
                  style={{ padding: '6px 14px', fontSize: 12 }}
                >
                  <Lock size={13} color={liveClassSubTab === 'completed' ? '#0F172A' : '#64748B'} strokeWidth={2.2} />
                  <span>Completed Classes</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 8,
                    background: liveClassSubTab === 'completed' ? '#F1F5F9' : 'rgba(0,0,0,0.05)',
                    color: liveClassSubTab === 'completed' ? '#0F172A' : '#64748B',
                  }}>
                    {completedLiveList.length}
                  </span>
                </button>
              </div>
            </div>

            {/* ── VIEW 1: ACTIVE & UPCOMING CLASSES ── */}
            {liveClassSubTab === 'upcoming' && (
              <>
                {upcomingLiveList.length === 0 ? (
                  <div className="glass-card-elevated" style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    background: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                  }}>
                    <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                      <GlassCalendar3D size={52} day={new Date().getDate().toString()} month="OCT" />
                    </div>

                    <h4 style={{ fontWeight: 750, fontSize: 15, margin: '0 0 6px', color: '#0F172A' }}>
                      No Upcoming Classes
                    </h4>
                    <p style={{ color: '#64748B', fontSize: 12, maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.5, fontWeight: 450 }}>
                      No lectures scheduled right now. Rooms unlock automatically 5 minutes before class start time.
                    </p>
                    {completedLiveList.length > 0 && (
                      <button
                        className="btn btn-outline"
                        style={{
                          padding: '8px 14px',
                          fontSize: 11.5,
                          fontWeight: 650,
                          borderRadius: 10,
                          background: '#FFFFFF',
                          borderColor: '#CBD5E1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                        onClick={() => setLiveClassSubTab('completed')}
                      >
                        <Lock size={13} color="#64748B" />
                        View {completedLiveList.length} Concluded Class{completedLiveList.length > 1 ? 'es' : ''}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
                    {upcomingLiveList.map((c, i) => {
                      const lock = getClassLockStatus(c, currentTime);
                      const rawLink = (c.meet_link || c.meetLink || c.join_url || c.meetingLink || c.link || '').toLowerCase();
                      const isZoom = rawLink.includes('zoom.us');
                      const isGoogleMeet = rawLink.includes('meet.google.com');
                      const platformName = isZoom ? 'Zoom' : isGoogleMeet ? 'Google Meet' : 'Live Class';

                      return (
                        <div
                          key={c._id || c.id || i}
                          className="glass-card-elevated"
                          style={{
                            padding: '18px 20px',
                            borderRadius: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            background: '#FFFFFF',
                            border: lock.isLive
                              ? '1.5px solid rgba(239, 68, 68, 0.35)'
                              : lock.isUnlocked
                              ? '1.5px solid rgba(16, 185, 129, 0.35)'
                              : '1px solid #E2E8F0',
                            boxShadow: lock.isLive
                              ? '0 10px 24px rgba(239, 68, 68, 0.06)'
                              : '0 3px 12px rgba(15, 23, 42, 0.03)',
                          }}
                        >
                          <div>
                            {/* Top row: 3D Frosted Icon & Live/Lock Pill */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 6, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GlassVideo3D size={36} platform={isZoom ? 'zoom' : isGoogleMeet ? 'meet' : 'default'} />
                                <div>
                                  <span style={{ fontSize: 12.5, fontWeight: 750, color: '#0F172A', display: 'block', lineHeight: 1.1 }}>
                                    {platformName}
                                  </span>
                                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#64748B' }}>
                                    Live Classroom
                                  </span>
                                </div>
                              </div>

                              {lock.isLive ? (
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 16,
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'pulse-dot 1.5s infinite' }} />
                                  Live Now
                                </span>
                              ) : lock.isUnlocked ? (
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 16,
                                  background: '#ECFDF5',
                                  color: '#059669',
                                  border: '1px solid #A7F3D0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <Zap size={11} color="#059669" />
                                  Unlocked
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 16,
                                  background: '#F8FAFC',
                                  color: '#64748B',
                                  border: '1px solid #E2E8F0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <Lock size={11} color="#64748B" />
                                  Unlocks {lock.unlockTimeDisplay}
                                </span>
                              )}
                            </div>

                            <h4 style={{ fontSize: 14.5, fontWeight: 750, margin: '10px 0 6px', color: '#0F172A', lineHeight: 1.35 }}>
                              {c.title}
                            </h4>

                            {/* Batch tag pill */}
                            {(c.batch_name || c.batch_id) && (
                              <div style={{ marginBottom: 10 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={11} color="var(--primary-color)" /> Batch: <strong>{c.batch_name || c.batch_id}</strong>
                                </span>
                              </div>
                            )}

                            {c.description && (
                              <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45, marginBottom: 10 }}>
                                {c.description}
                              </p>
                            )}

                            {/* Clean Details list */}
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px', margin: '10px 0', display: 'grid', gridTemplateColumns: '1fr', gap: 6, border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={13} color="#64748B" />
                                <span>Trainer: <strong>{c.instructor || 'Faculty Staff'}</strong></span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} color="#64748B" />
                                <span>Date: <strong>{c.date}</strong></span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={13} color="#64748B" />
                                <span>Time: <strong>{c.time}</strong> (1h duration)</span>
                              </div>
                            </div>
                          </div>

                          {/* Action button */}
                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 4 }}>
                            {lock.isUnlocked ? (
                              <button
                                onClick={() => handleJoinLiveClass(c)}
                                className="btn btn-primary"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  width: '100%',
                                  padding: '10px 16px',
                                  borderRadius: 10,
                                  fontWeight: 700,
                                  fontSize: 12.5,
                                  background: 'linear-gradient(135deg, #6C3CF0 0%, #4F25C7 100%)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 14px rgba(108, 60, 240, 0.22)',
                                }}
                              >
                                <Video size={15} />
                                Join Class & Mark Attendance
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  width: '100%',
                                  padding: '10px 16px',
                                  borderRadius: 10,
                                  fontWeight: 600,
                                  fontSize: 12,
                                  background: '#F8FAFC',
                                  color: '#94A3B8',
                                  border: '1px solid #E2E8F0',
                                  cursor: 'not-allowed',
                                }}
                              >
                                <Lock size={13} />
                                Room Locked • Unlocks 5m Prior
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── VIEW 2: COMPLETED CLASSES ── */}
            {liveClassSubTab === 'completed' && (
              <>
                {completedLiveList.length === 0 ? (
                  <div className="glass-card-elevated" style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    background: '#FFFFFF',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                  }}>
                    <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
                      <GlassFolder3D size={52} />
                    </div>
                    <h4 style={{ fontWeight: 750, fontSize: 15, margin: '0 0 6px', color: '#0F172A' }}>
                      No Concluded Classes Yet
                    </h4>
                    <p style={{ color: '#64748B', fontSize: 12, maxWidth: 400, margin: '0 auto', lineHeight: 1.5, fontWeight: 450 }}>
                      When a live lecture concludes (1 hour after scheduled start), the link closes and moves here with your verified attendance audit.
                    </p>
                  </div>
                ) : (
                  <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 }}>
                    {completedLiveList.map((c, i) => {
                      const attended = isClassAttended(c);
                      const rawLink = (c.meet_link || c.meetLink || c.join_url || c.meetingLink || c.link || '').toLowerCase();
                      const isZoom = rawLink.includes('zoom.us');
                      const isGoogleMeet = rawLink.includes('meet.google.com');
                      const platformName = isZoom ? 'Zoom' : isGoogleMeet ? 'Google Meet' : 'Live Class';
                      const recordingUrl = c.recording_url || c.recordingUrl || c.video_url || c.videoUrl || '';
                      const hasRecording = Boolean(recordingUrl);

                      return (
                        <div
                          key={c._id || c.id || i}
                          className="glass-card-elevated"
                          style={{
                            padding: '18px 20px',
                            borderRadius: 16,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            background: '#FFFFFF',
                            border: attended ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #E2E8F0',
                            boxShadow: '0 3px 12px rgba(15, 23, 42, 0.025)',
                          }}
                        >
                          <div>
                            {/* Top header: 3D Folder Icon & Concluded status */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 6, flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <GlassFolder3D size={36} />
                                <div>
                                  <span style={{ fontSize: 12.5, fontWeight: 750, color: '#0F172A', display: 'block', lineHeight: 1.1 }}>
                                    {platformName}
                                  </span>
                                  <span style={{ fontSize: 10.5, fontWeight: 500, color: '#64748B' }}>
                                    Concluded Session
                                  </span>
                                </div>
                              </div>

                              {hasRecording ? (
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 16,
                                  background: '#EFF6FF',
                                  color: '#1D4ED8',
                                  border: '1px solid #BFDBFE',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <Video size={11} color="#2563EB" />
                                  Recording Ready
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  padding: '3px 9px',
                                  borderRadius: 16,
                                  background: '#F8FAFC',
                                  color: '#64748B',
                                  border: '1px solid #E2E8F0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <Lock size={11} color="#64748B" />
                                  Class Concluded
                                </span>
                              )}
                            </div>

                            {/* Attendance Status Ribbon */}
                            {attended ? (
                              <div style={{
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: 10,
                                padding: '8px 12px',
                                margin: '10px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                                <GlassCheck3D size={26} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12, color: '#065F46' }}>
                                    Attended • Marked Present
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#047857' }}>
                                    Verified and recorded in your attendance history.
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{
                                background: '#FEF2F2',
                                border: '1px solid #FECACA',
                                borderRadius: 10,
                                padding: '8px 12px',
                                margin: '10px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}>
                                <XCircle size={18} color="#DC2626" />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 12, color: '#991B1B' }}>
                                    Missed • Marked Absent
                                  </div>
                                  <div style={{ fontSize: 10.5, color: '#B91C1C' }}>
                                    No join record detected during the session.
                                  </div>
                                </div>
                              </div>
                            )}

                            <h4 style={{ fontSize: 14.5, fontWeight: 750, margin: '10px 0 6px', color: '#0F172A', lineHeight: 1.35 }}>
                              {c.title}
                            </h4>

                            {/* Batch tag pill */}
                            {(c.batch_name || c.batch_id) && (
                              <div style={{ marginBottom: 10 }}>
                                <span style={{ fontSize: 10.5, fontWeight: 600, color: '#475569', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={11} color="var(--primary-color)" /> Batch: <strong>{c.batch_name || c.batch_id}</strong>
                                </span>
                              </div>
                            )}

                            {c.description && (
                              <p style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.45, marginBottom: 10 }}>
                                {c.description}
                              </p>
                            )}

                            {/* Details grid */}
                            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 12px', margin: '10px 0', display: 'grid', gridTemplateColumns: '1fr', gap: 6, border: '1px solid #F1F5F9' }}>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={13} color="#64748B" />
                                <span>Trainer: <strong>{c.instructor || 'Faculty Staff'}</strong></span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Calendar size={13} color="#64748B" />
                                <span>Date: <strong>{c.date}</strong></span>
                              </div>
                              <div style={{ fontSize: 11.5, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Clock size={13} color="#64748B" />
                                <span>Time: <strong>{c.time}</strong> (1h duration)</span>
                              </div>
                            </div>
                          </div>

                          {/* Action button row with Session Over & View Recording */}
                          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, marginTop: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => showModal(
                                'Live Class Concluded',
                                `This live session for "${c.title}" on ${c.date} (${c.time}) has concluded. Attendance is recorded. Replays can be viewed using the View Recording option.`,
                                'info'
                              )}
                              style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                padding: '10px 12px',
                                borderRadius: 10,
                                fontWeight: 650,
                                fontSize: 12,
                                background: '#F8FAFC',
                                color: '#64748B',
                                border: '1px solid #E2E8F0',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = '#F1F5F9'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = '#F8FAFC'; }}
                            >
                              <Lock size={13} color="#64748B" />
                              Session Over
                            </button>

                            {/* View / Watch Recording button right beside Session Over (Student view) */}
                            {hasRecording ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDashboardActiveVideo({
                                    id: c.id || c.uid,
                                    title: `${c.title} • Live Replay`,
                                    courseTitle: `${c.batch_name || 'Batch Live Class'} • ${c.date}`,
                                    video_url: recordingUrl,
                                    duration: c.duration || '1h 00m'
                                  });
                                }}
                                style={{
                                  flex: 1.25,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '10px 14px',
                                  borderRadius: 10,
                                  fontWeight: 700,
                                  fontSize: 12,
                                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  cursor: 'pointer',
                                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.18s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(37, 99, 235, 0.38)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.28)'; }}
                              >
                                <Play size={13} fill="#FFFFFF" />
                                View Recording
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => showModal(
                                  'Recording Processing',
                                  `The recording for "${c.title}" is currently being prepared and uploaded by the faculty/trainer. It will be available for you to replay shortly.`,
                                  'info'
                                )}
                                style={{
                                  flex: 1.25,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: '10px 12px',
                                  borderRadius: 10,
                                  fontWeight: 650,
                                  fontSize: 11.5,
                                  background: '#F8FAFC',
                                  color: '#94A3B8',
                                  border: '1px dashed #CBD5E1',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <Clock size={13} color="#94A3B8" />
                                Recording Processing
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Loading content...
          </div>
        }>
          {/* BATCH CHAT TAB */}
          {activeTab === 'batch-chat-tab' && (
            <BatchChatPage user={user} userProfile={userProfile} />
          )}

          {/* RECORDED CLASSES TAB */}
          {activeTab === 'recorded-classes-tab' && (
            <RecordedClassesPage
              recordedClasses={dashboardData?.recordedClasses || null}
              customPlaylists={extrasData?.playlists || null}
              isPaid={isPaid}
              initialCourseId={replayTarget?.courseId || null}
              initialLessonId={replayTarget?.lessonId || null}
            />
          )}

          {/* ASSIGNMENTS & CAPSTONE PROJECTS TAB */}
          {activeTab === 'assignments-tab' && (
            <AssignmentsPage
              batchAssignments={batchAssignments}
              submissions={submissions}
              user={user}
              studentBatchId={studentBatchId}
              studentBatchName={studentBatchName}
              refetchAssignments={refetchBatchAssignments}
              refetchSubmissions={refetchExtras}
              showModal={showModal}
            />
          )}

          {/* ATTENDANCE TAB */}
          {activeTab === 'attendance-tab' && dashboardData && (
            <AttendancePage dashboardData={dashboardData} />
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements-tab' && dashboardData && (
            <div className="dashboard-card-section">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563EB, #4F46E5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}>
                    <Megaphone size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: -0.3 }}>
                      Notice Board
                    </h2>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748B' }}>
                      Official circulars, batch notifications, and academic schedules from Admin and Trainers.
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: 999,
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 750
                }}>
                  <span>{dashboardData.announcements?.length || 0} Official Notices</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {dashboardData.announcements?.map((a, i) => {
                  const isHighPriority = a.priority === 'High';
                  const isPinned = a.is_pinned;

                  return (
                    <div 
                      key={a.id || i} 
                      style={{ 
                        padding: '20px 24px', 
                        borderRadius: 16, 
                        background: '#FFFFFF',
                        border: isPinned ? '1.5px solid #C7D2FE' : '1px solid #E2E8F0',
                        boxShadow: isPinned ? '0 4px 18px rgba(99, 102, 241, 0.08)' : '0 2px 8px rgba(0,0,0,0.02)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10
                      }}
                      className="clickable-card-hover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ 
                            fontSize: 10.5, 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            padding: '3px 9px', 
                            borderRadius: 6, 
                            background: isHighPriority ? '#FEE2E2' : '#EFF6FF', 
                            color: isHighPriority ? '#DC2626' : '#2563EB' 
                          }}>
                            {a.priority || 'Normal'}
                          </span>

                          {isPinned && (
                            <span style={{ 
                              fontSize: 11, 
                              color: '#4F46E5', 
                              fontWeight: 750,
                              background: '#EEF2FF',
                              padding: '3px 8px',
                              borderRadius: 6
                            }}>
                              📌 Pinned Notice
                            </span>
                          )}

                          <span style={{
                            fontSize: 11,
                            color: '#475569',
                            fontWeight: 600,
                            background: '#F1F5F9',
                            padding: '3px 8px',
                            borderRadius: 6
                          }}>
                            {a.target === 'batch' ? `Batch: ${a.batch_name || 'Your Batch'}` : 'All Students'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, fontWeight: 500 }}>
                          <Calendar size={13} color="#64748B" />
                          <span>{a.date}</span>
                        </div>
                      </div>

                      <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: -0.2 }}>
                        {a.title}
                      </h3>

                      <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                        {a.content}
                      </p>

                      {/* Official Attached Circular (PDF) */}
                      {a.attachmentUrl && (
                        <div style={{ marginTop: 4 }}>
                          <a
                            href={getDownloadUrl(a.attachmentUrl, a.attachmentName || 'Official_Circular.pdf')}
                            download={a.attachmentName || 'Official_Circular.pdf'}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              border: '1px solid #BFDBFE',
                              padding: '7px 14px',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: 'none',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)'
                            }}
                          >
                            <Download size={13} />
                            Download Official Circular ({a.attachmentName || 'PDF Document'})
                          </a>
                        </div>
                      )}

                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        paddingTop: 10, 
                        borderTop: '1px solid #F1F5F9',
                        fontSize: 11.5,
                        color: '#64748B'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={13} color="#2563EB" />
                          <span>Posted by: <strong>{a.senderName || 'Admin Academic Office'}</strong> ({a.senderRole || 'Admin'})</span>
                        </div>
                        <span style={{ color: '#10B981', fontWeight: 650 }}>● Verified Levlox Notice</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LEADERBOARD TAB */}
          {activeTab === 'leaderboard-tab' && (
            <LeaderboardPage
              user={user}
              currentUid={uid}
              leaderboard={dashboardData?.leaderboard || null}
            />
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <StudentProfile
              dashboardData={dashboardData}
              enrolledCourses={enrolledCourses}
              onProfileUpdate={handleProfileUpdate}
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div>
              {mustChangePassword && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                  color: '#991B1B',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <TriangleAlert size={18} color="#ef4444" />
                  <span>Security Notice: You are logged in with a temporary password. You must change your password immediately to unlock portal access.</span>
                </div>
              )}
              <StudentSettings
                user={user}
                onProfileUpdate={handleProfileUpdate}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* SUBMISSION MODAL */}
      {submitModalAssignment && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Submit: {submitModalAssignment.title}</h3>
              <button className="navbar-action-btn" onClick={() => setSubmitModalAssignment(null)}><X size={18} /></button>
            </div>
            <form onSubmit={submitAssignment}>
              <div className="form-group">
                <label className="form-label">Response / Link</label>
                <textarea className="form-input" style={{ height: 150, resize: 'none' }} value={submissionText} onChange={e => setSubmissionText(e.target.value)} placeholder="Type your response or paste GitHub/Drive links…" required />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Confirm Submission</button>
            </form>
          </div>
        </div>
      )}

      {/* ACCESS RESTRICTED MODAL */}
      {showLockModal && (
        <CustomModal
          isOpen={showLockModal}
          onClose={() => setShowLockModal(false)}
          title="Access Restricted"
          type="error"
          confirmText="OK"
          onConfirm={() => setShowLockModal(false)}
        >
          <div style={{ textAlign: 'center', padding: '10px 6px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--danger-color)', margin: '0 0 8px' }}>
              Your course fees are still pending.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px' }}>
              Please contact the Levlox Admin to activate your account and access Live Classes.
            </p>
          </div>
        </CustomModal>
      )}

      {/* GLOBAL TOAST/NOTIFICATION MODAL */}
      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        type={modalType}
        confirmText="Dismiss"
        onConfirm={() => setModalOpen(false)}
      >
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)' }}>{modalText}</p>
      </CustomModal>

      {/* ═══ DASHBOARD SECURE VIDEO PLAYER MODAL ═════════════════════ */}
      {dashboardActiveVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          {/* Header */}
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
                {dashboardActiveVideo.courseTitle || 'Interactive Video Lesson'}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                {dashboardActiveVideo.title}
              </h3>
            </div>

            <button
              onClick={() => setDashboardActiveVideo(null)}
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
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; }}
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
              videoUrl={dashboardActiveVideo.video_url || dashboardActiveVideo.videoUrl || dashboardActiveVideo.url || 'https://www.youtube.com/watch?v=rfscVS0vtbw'}
              title={dashboardActiveVideo.title}
              lessonId={dashboardActiveVideo.id}
              studentId={uid}
              watermarkText={`${profileName || user.name || 'Student'} | ${user.roll_number || user.student_id || 'LEV-STU'} | LEVLOX DRM`}
              onProgress={(sec, total, pct) => {
                saveWatchProgress(uid, dashboardActiveVideo.id, sec, total);
              }}
              onComplete={() => {
                saveWatchProgress(uid, dashboardActiveVideo.id, 3600, 3600);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
