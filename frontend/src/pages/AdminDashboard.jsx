import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GraduationCap, Users, Video, Clock, BookOpen, 
  Megaphone, Wallet, Settings, Trash2, Plus, 
  LogOut, CheckCircle, Award, Percent, CalendarCheck,
  Pencil, Eye, ChevronLeft, ChevronRight, Search, Filter,
  PlayCircle, Clock3, TriangleAlert, CircleAlert, Wallet as WalletIcon, Trophy,
  Key, RefreshCw, ChevronDown, X, Download, FileText, FileSpreadsheet,
  User, Mail, Phone, Lock, EyeOff, Camera, Save, Shield, Menu,
  Calendar, Timer, Sparkles, FastForward, CheckCheck, History, ArrowUpRight, UserCheck,
  Globe, ArrowLeft, ArrowRight, Upload, Image as ImageIcon, UploadCloud
} from 'lucide-react';
import CustomModal from '../components/Modal';
import FilterBar from '../components/FilterBar';
import NotificationBell from '../components/NotificationBell';
import AcademiaCourseViewer from '../components/AcademiaCourseViewer';
import TrainerAssignmentsView from '../components/TrainerAssignmentsView';
import { uploadUniversalFile, getDownloadUrl } from '../services/apiService';
import levloxLogo from '../assets/levlox-logo.png';
const leveloxIcon = levloxLogo;
import MasterDataPage from './MasterDataPage';
import { useAuth } from '../context/AuthContext';
import {
  listStudents,
  getStudentCount,
  createStudent,
  updateStudent,
  deleteDocument as deleteStudentDoc,
  formatCurrency,
  getStudentFeeDetails,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getTrainers,
  addTrainer,
  updateTrainer,
  deleteTrainer,
  getLiveClasses,
  addLiveClass,
  updateLiveClass,
  deleteLiveClass,
  getRecordedClasses,
  addRecordedClass,
  updateRecordedClass,
  deleteRecordedClass,
  getPlaylists,
  addPlaylist,
  updatePlaylist,
  deletePlaylist,
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  getAttendanceSheet,
  markAttendance,
  updateAttendance,
  getLeaderboard,
  getAllPayments,
  updatePayment,
  getGlobalSettings,
  updateGlobalSettings,
  updateDocumentFields,
  addDocument,
  setDocument,
  getDocuments,
  getDocument,
  classifyFirestoreError,
  getBatches,
  addBatch,
  updateBatch,
  deleteBatch as deleteBatchDoc,
  assignStudentsToBatch,
  getStudentsByBatch,
  getActivityLogs,
  awardActivityScore,
  getActivityPresets,
  addActivityPreset,
  deleteActivityPreset,
  uploadProfileImage,
  getEmailTemplates,
  interpolateEmailTemplate,
  createTrainerProfile,
  generateNextId,
  saveBatchAttendance,
  assignTrainerToBatch,
  getAttendanceByBatchAndDate,
  getAttendanceForStudent,
  uploadFile,
} from '../services/firebaseService';
import { where } from 'firebase/firestore';
import {
  changeOwnPassword,
  validatePasswordStrength,
  describeAuthError,
} from '../services/authService';
import { normalizeMobile, mobileToAuthId, formatMobile } from '../services/phoneIdentity';
import { createAuthUserDetached } from '../firebase';
import { sendTraineeWelcomeEmail, sendTrainerWelcomeEmail, resendVerificationEmail, generateVerificationToken } from '../services/emailService';
import {
  calculateBatchDurationInfo,
  addDaysToDate,
  getDaysBetween,
  formatReadableDate,
  formatLocalDate
} from '../utils/batchUtils';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import { getGoogleDriveFileId, getResolvedThumbnail, parseDurationToSeconds, formatSecondsToDisplay } from '../utils/videoUtils';

const PLAYLIST_CARD_THEMES = [
  {
    // Mint / Sage
    bg: 'linear-gradient(165deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.55) 100%)',
    border: 'rgba(167, 243, 208, 0.85)',
    tagBg: 'rgba(16, 185, 129, 0.15)',
    tagColor: '#065F46',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#059669',
    glow: 'rgba(16, 185, 129, 0.15)',
    shadow: '0 10px 25px -4px rgba(16, 185, 129, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  },
  {
    // Sky / Cyan
    bg: 'linear-gradient(165deg, rgba(240, 249, 255, 0.95) 0%, rgba(224, 242, 254, 0.55) 100%)',
    border: 'rgba(186, 230, 253, 0.85)',
    tagBg: 'rgba(14, 165, 233, 0.15)',
    tagColor: '#075985',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#0284C7',
    glow: 'rgba(14, 165, 233, 0.15)',
    shadow: '0 10px 25px -4px rgba(14, 165, 233, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  },
  {
    // Lavender / Violet
    bg: 'linear-gradient(165deg, rgba(245, 243, 255, 0.95) 0%, rgba(237, 233, 254, 0.55) 100%)',
    border: 'rgba(221, 214, 254, 0.85)',
    tagBg: 'rgba(124, 58, 237, 0.15)',
    tagColor: '#5B21B6',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#7C3AED',
    glow: 'rgba(124, 58, 237, 0.15)',
    shadow: '0 10px 25px -4px rgba(124, 58, 237, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  },
  {
    // Slate / Ice
    bg: 'linear-gradient(165deg, rgba(248, 250, 252, 0.95) 0%, rgba(241, 245, 249, 0.55) 100%)',
    border: 'rgba(203, 213, 225, 0.85)',
    tagBg: 'rgba(100, 116, 139, 0.15)',
    tagColor: '#1E293B',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#475569',
    glow: 'rgba(100, 116, 139, 0.15)',
    shadow: '0 10px 25px -4px rgba(100, 116, 139, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  },
  {
    // Warm Amber / Peach
    bg: 'linear-gradient(165deg, rgba(255, 251, 235, 0.95) 0%, rgba(254, 243, 199, 0.55) 100%)',
    border: 'rgba(253, 230, 138, 0.85)',
    tagBg: 'rgba(245, 158, 11, 0.15)',
    tagColor: '#92400E',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#D97706',
    glow: 'rgba(245, 158, 11, 0.15)',
    shadow: '0 10px 25px -4px rgba(245, 158, 11, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  },
  {
    // Emerald / Teal
    bg: 'linear-gradient(165deg, rgba(240, 253, 250, 0.95) 0%, rgba(204, 251, 241, 0.55) 100%)',
    border: 'rgba(153, 246, 228, 0.85)',
    tagBg: 'rgba(20, 184, 166, 0.15)',
    tagColor: '#115E59',
    pillBg: 'rgba(255, 255, 255, 0.85)',
    accent: '#0D9488',
    glow: 'rgba(20, 184, 166, 0.15)',
    shadow: '0 10px 25px -4px rgba(20, 184, 166, 0.12), 0 4px 10px rgba(0,0,0,0.02)'
  }
];


const CustomDropdown = ({ label, value, options, onChange, placeholder, width = '120px' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="custom-dropdown-container" ref={dropdownRef} style={{ width }}>
      <button 
        type="button"
        className="custom-dropdown-trigger" 
        style={{ width: '100%' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder || label}
        </span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }} />
      </button>
      
      {isOpen && (
        <div className="custom-dropdown-menu">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div 
                key={opt.value} 
                className={`custom-dropdown-option ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ExportDropdown = ({ onExportCSV, onExportExcel, onExportPDF }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="export-container-relative" ref={dropdownRef}>
      <button 
        type="button" 
        className="export-btn-premium-gradient"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} />
          <span>Export</span>
        </div>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', marginLeft: '8px' }} />
      </button>
      {isOpen && (
        <div className="export-menu-floating" style={{ right: 0, left: 'auto' }}>
          <button 
            type="button"
            className="export-menu-row" 
            onClick={() => { onExportCSV(); setIsOpen(false); }}
          >
            <FileText size={16} />
            <span>Export CSV</span>
          </button>
          <button 
            type="button"
            className="export-menu-row" 
            onClick={() => { onExportExcel(); setIsOpen(false); }}
          >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
          </button>
          <button 
            type="button"
            className="export-menu-row" 
            onClick={() => { onExportPDF(); setIsOpen(false); }}
          >
            <FileText size={16} style={{ color: '#EF4444' }} />
            <span>Export PDF</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Login URL used in the credential messages an admin sends to a new student.
 * Derived from wherever the dashboard is actually running, so it is correct in
 * local development and on the deployed domain without a hardcoded host.
 */
const loginUrl = `${window.location.origin}/login`;

/** Stable empty array — a fresh `[]` literal would break memo dependencies. */
const EMPTY_LIST = [];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, logout: authLogout, uid, applyProfilePatch } = useAuth();
  const user = userProfile || {};
  const queryClient = useQueryClient();

  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab') || location.state?.tab;
  const [activeTab, setActiveTabState] = useState(tabFromQuery || 'dashboard');

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', tab);
      return p;
    }, { replace: true });
  };

  useEffect(() => {
    const qTab = searchParams.get('tab') || location.state?.tab;
    if (qTab && qTab !== activeTab) {
      setActiveTabState(qTab);
    }
  }, [searchParams, location.state]);
  const [sessionSearch, setSessionSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('Today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Batches are loaded separately so the roster editor and the stats card can
  // refresh independently.
  const { data: firestoreBatches = [], refetch: refetchAdminBatches } = useQuery({
    queryKey: ['adminBatches'],
    queryFn: getBatches,
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // ─── Parallel initial data load from Firestore ────────────────────────────
  const {
    data: adminData = null,
    isPending: adminLoading,
    error: adminError,
    refetch: refetchAdminData,
  } = useQuery({
    queryKey: ['adminDashboardAll'],
    queryFn: async () => {
      const [
        studentList,
        liveClassList,
        recordedList,
        announcementList,
        courseList,
        trainerList,
        leaderboardList,
        paymentList,
        globalSettings,
        playlistList,
      ] = await Promise.all([
        listStudents(),
        getLiveClasses(),
        getRecordedClasses(),
        getAnnouncements(),
        getCourses(),
        getTrainers().catch(() => []),
        getLeaderboard(),
        getAllPayments(),
        getGlobalSettings().catch(() => ({})),
        getPlaylists().catch(() => []),
      ]);

      return {
        studentList,
        liveClassList,
        recordedList,
        announcementList,
        courseList,
        trainerList,
        leaderboardList,
        paymentList,
        globalSettings,
        playlistList: playlistList || [],
      };
    },
    staleTime: 1000 * 30,
    refetchInterval: 60000, // auto-refresh dashboard, attendance, live classes, notice board every 1 min
    refetchOnWindowFocus: true,
  });

  // Automatically refresh all admin data whenever navigating between tabs/pages
  useEffect(() => {
    refetchAdminData();
    refetchAdminBatches();
    queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
    queryClient.invalidateQueries({ queryKey: ['trainerAssignmentsData'] });
    queryClient.invalidateQueries({ queryKey: ['trainerSubmissionsData'] });
  }, [activeTab, queryClient]);

  // Derive named data from adminData
  const liveClasses = adminData?.liveClassList || EMPTY_LIST;
  const recordedClasses = adminData?.recordedList || EMPTY_LIST;
  const customPlaylists = adminData?.playlistList || EMPTY_LIST;
  const announcements = adminData?.announcementList || EMPTY_LIST;
  const courses = adminData?.courseList || EMPTY_LIST;
  const trainers = adminData?.trainerList || EMPTY_LIST;
  const batches = firestoreBatches;
  // Falls back to a module-level constant rather than a fresh `[]` each render,
  // so the students memo below is not invalidated on every render.
  const allStudents = React.useMemo(() => {
    const rawList = adminData?.studentList || EMPTY_LIST;
    const trainerList = adminData?.trainerList || EMPTY_LIST;
    const trainerEmails = new Set(trainerList.map(t => (t.email || '').toLowerCase()).filter(Boolean));
    const trainerIds = new Set(trainerList.map(t => String(t.id || t.uid || '')).filter(Boolean));
    return rawList.filter(s => {
      const email = (s.email || '').toLowerCase();
      const sId = String(s.id || s.uid || '');
      if (trainerEmails.has(email) || trainerIds.has(sId)) return false;
      if (s.role && s.role !== 'student') return false;
      return true;
    });
  }, [adminData?.studentList, adminData?.trainerList]);

  const hasUpcomingLiveClasses = React.useMemo(() => {
    return (liveClasses || []).some(c => {
      const s = (c.status || '').toLowerCase();
      return s === 'live' || s === 'upcoming' || s === 'scheduled';
    });
  }, [liveClasses]);

  // Stats are computed from the data already loaded above — no extra reads.
  const stats = React.useMemo(() => {
    if (!adminData) return null;
    const { studentList, liveClassList, courseList, announcementList } = adminData;

    let paidStudents = 0;
    let totalCollected = 0;
    let totalPending = 0;

    studentList.forEach((s) => {
      const feeInfo = getStudentFeeDetails(s);
      if (feeInfo.isPaid) {
        paidStudents += 1;
      }
      totalCollected += feeInfo.paid;
      totalPending += feeInfo.remaining;
    });

    const pendingStudents = studentList.length - paidStudents;

    return {
      totalStudents: studentList.length,
      totalBatches: firestoreBatches.length,
      liveClassesToday: liveClassList.filter(c => (c.status || '').toLowerCase() === 'live').length,
      recordedCourses: courseList.length,
      feesCollected: totalCollected,
      pendingPaymentsCount: pendingStudents,
      pendingAmount: totalPending,

      recentStudents: studentList.slice(0, 5).map(s => ({
        id: s.id,
        name: s.name,
        profile_pic: s.profile_pic || '',
        course: s.course || 'Fullstack Engineering',
        batch_name: s.batch_name || 'Not Assigned',
        join_date: s.join_date || 'Recently'
      })),
      todayLiveClasses: liveClassList.slice(0, 5),
      recentAnnouncements: announcementList.slice(0, 5),

      feeOverview: {
        totalCollected,
        pendingAmount: totalPending,
        paidStudents,
        pendingStudentsCount: pendingStudents
      },
      recentActivity: []
    };
  }, [adminData, firestoreBatches]);

  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchCourseName, setBatchCourseName] = useState('');
  const [batchTrainerName, setBatchTrainerName] = useState('');
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchStatus, setBatchStatus] = useState('Active');
  const [batchMaxStudents, setBatchMaxStudents] = useState(30);
  const [batchDurationDays, setBatchDurationDays] = useState(50);
  const [batchTiming, setBatchTiming] = useState('10:00 AM - 12:00 PM');
  const [batchLifecycleFilter, setBatchLifecycleFilter] = useState('active_only');
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendingBatch, setExtendingBatch] = useState(null);
  const [extendDays, setExtendDays] = useState(15);
  const [extendTiming, setExtendTiming] = useState('10:00 AM - 12:00 PM');
  const [extendReason, setExtendReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [assigningBatch, setAssigningBatch] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [allStudentsForAssign, setAllStudentsForAssign] = useState([]);

  // Pagination & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [feesFilter, setFeesFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Batch filters
  const [batchSearchQuery, setBatchSearchQuery] = useState('');
  const [batchCourseFilter, setBatchCourseFilter] = useState('');
  const [batchStatusFilter, setBatchStatusFilter] = useState('');
  const [batchTrainerFilter, setBatchTrainerFilter] = useState('');
  const [batchStartDateFilter, setBatchStartDateFilter] = useState('');
  const [batchEndDateFilter, setBatchEndDateFilter] = useState('');

  // Live classes additional filters
  const [liveCourseFilter, setLiveCourseFilter] = useState('');
  const [liveBatchFilter, setLiveBatchFilter] = useState('');
  const [liveStatusFilter, setLiveStatusFilter] = useState('');

  // Recorded classes filters
  const [recordedSearchQuery, setRecordedSearchQuery] = useState('');
  const [recordedCourseFilter, setRecordedCourseFilter] = useState('');
  const [recordedBatchFilter, setRecordedBatchFilter] = useState('');
  const [recordedVisibilityFilter, setRecordedVisibilityFilter] = useState('');
  const [recordedUploadTypeFilter, setRecordedUploadTypeFilter] = useState('');
  const [recordedDateFilter, setRecordedDateFilter] = useState('Today');
  const [recordedStartDateFilter, setRecordedStartDateFilter] = useState('');
  const [recordedEndDateFilter, setRecordedEndDateFilter] = useState('');
  const [selectedPlaylistBatch, setSelectedPlaylistBatch] = useState(null); // null = Playlists Containers view, object/id = Drill-down playlist view

  // Fees page filters
  const [feesSearchQuery, setFeesSearchQuery] = useState('');
  const [feesCourseFilter, setFeesCourseFilter] = useState('');
  const [feesBatchFilter, setFeesBatchFilter] = useState('');
  const [feesStatusFilter, setFeesStatusFilter] = useState('');
  const [feesPaymentMethodFilter, setFeesPaymentMethodFilter] = useState('');
  const [feesStartDateFilter, setFeesStartDateFilter] = useState('');
  const [feesEndDateFilter, setFeesEndDateFilter] = useState('');
  const [feesDateFilter, setFeesDateFilter] = useState('Today');

  /*
   * getCourses() returns course DOCUMENTS ({id, title, ...}). Every dropdown
   * and filter here needs the course *name*, and student records store the
   * course as a title string — so derive a de-duplicated title list once.
   * Rendering the raw objects crashed the admin dashboard.
   */
  const courseTitles = React.useMemo(
    () => {
      const dbTitles = courses.map(c => (typeof c === 'string' ? c : c?.title || c?.name || c?.course_name)).filter(Boolean);
      const batchCourses = batches.map(b => b.course_name).filter(Boolean);
      const recordedCourses = recordedClasses.map(r => r.course_title || r.course_name).filter(Boolean);
      const combined = Array.from(new Set([...dbTitles, ...batchCourses, ...recordedCourses]));
      if (combined.length > 0) return combined;
      return ['Fullstack Engineering', 'Python-FSD', 'Java-FSD', 'Data Science & AI', 'UI/UX Design', 'MERN Stack'];
    },
    [courses, batches, recordedClasses]
  );

  /** Client-side search + filters over the already-loaded roster. */
  const students = React.useMemo(() => {
    const isFeesTab = activeTab === 'fees-management';
    const searchVal = isFeesTab ? feesSearchQuery : searchQuery;
    const statusVal = isFeesTab ? '' : statusFilter;
    const feesVal = isFeesTab ? feesStatusFilter : feesFilter;
    const courseVal = isFeesTab ? feesCourseFilter : courseFilter;
    const batchVal = isFeesTab ? feesBatchFilter : batchFilter;

    let filtered = allStudents;
    if (searchVal) {
      const q = searchVal.toLowerCase().trim();
      const cleanDigits = q.replace(/\D/g, '');
      filtered = filtered.filter(s => {
        const name = (s.name || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const roll = (s.rollNumber || s.id || '').toLowerCase();
        const phone = (s.phone || s.mobile || '').toLowerCase();
        const phoneDigits = (s.phone || s.mobile || '').replace(/\D/g, '');
        return (
          name.includes(q) ||
          email.includes(q) ||
          roll.includes(q) ||
          phone.includes(q) ||
          (cleanDigits.length >= 3 && phoneDigits.includes(cleanDigits))
        );
      });
    }
    if (statusVal) filtered = filtered.filter(s => s.status === statusVal);
    if (feesVal) filtered = filtered.filter(s => s.feesStatus === feesVal);
    if (courseVal) filtered = filtered.filter(s => s.course === courseVal);
    if (batchVal) filtered = filtered.filter(s => s.batch_id === batchVal);
    return filtered;
  }, [
    allStudents, activeTab, searchQuery, statusFilter, feesFilter, courseFilter, batchFilter,
    feesSearchQuery, feesStatusFilter, feesCourseFilter, feesBatchFilter,
  ]);

  useEffect(() => {
    setTotalPages(Math.ceil(students.length / 5) || 1);
  }, [students.length]);


  // Student Date filters
  const [studentDateFilter, setStudentDateFilter] = useState('Today');
  const [studentStartDateFilter, setStudentStartDateFilter] = useState('');
  const [studentEndDateFilter, setStudentEndDateFilter] = useState('');

  // Batch Date filter (quick selector)
  const [batchDateFilter, setBatchDateFilter] = useState('This Year');

  // Activity score filters
  const [activitySearchQuery, setActivitySearchQuery] = useState('');
  const [activityCourseFilter, setActivityCourseFilter] = useState('');
  const [activityBatchFilter, setActivityBatchFilter] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState('');
  const [activityScoreMin, setActivityScoreMin] = useState('');
  const [activityScoreMax, setActivityScoreMax] = useState('');
  const [activityDateFilter, setActivityDateFilter] = useState('Today');
  const [activityStartDateFilter, setActivityStartDateFilter] = useState('');
  const [activityEndDateFilter, setActivityEndDateFilter] = useState('');

  // Attendance filters
  const [attSearchQuery, setAttSearchQuery] = useState('');
  const [attCourseFilter, setAttCourseFilter] = useState('');
  const [attBatchFilter, setAttBatchFilter] = useState('');
  const [attStatusFilter, setAttStatusFilter] = useState('');
  const [attDateFilter, setAttDateFilter] = useState('Today');
  const [attStartDateFilter, setAttStartDateFilter] = useState('');
  const [attEndDateFilter, setAttEndDateFilter] = useState('');

  // Announcements filters
  const [annSearchQuery, setAnnSearchQuery] = useState('');
  const [annCourseFilter, setAnnCourseFilter] = useState('');
  const [annBatchFilter, setAnnBatchFilter] = useState('');
  const [annAudienceFilter, setAnnAudienceFilter] = useState('');
  const [annDateFilter, setAnnDateFilter] = useState('Today');
  const [annStartDateFilter, setAnnStartDateFilter] = useState('');
  const [annEndDateFilter, setAnnEndDateFilter] = useState('');

  // Responsive design width tracking
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  // Separate pagination states
  const [batchesPage, setBatchesPage] = useState(1);
  const [livePage, setLivePage] = useState(1);
  const [attendancePage, setAttendancePage] = useState(1);
  const [recordedPage, setRecordedPage] = useState(1);
  const [announcementsPage, setAnnouncementsPage] = useState(1);
  const [feesPage, setFeesPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  // Student details and management states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createCourse, setCreateCourse] = useState('Fullstack Engineering');
  const [createBatchId, setCreateBatchId] = useState('');
  const [createTempPassword, setCreateTempPassword] = useState('');
  const [createDob, setCreateDob] = useState('');
  const [createGender, setCreateGender] = useState('');
  const [createCity, setCreateCity] = useState('');
  const [createGuardianName, setCreateGuardianName] = useState('');
  const [createGuardianPhone, setCreateGuardianPhone] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);

  const generateRandomPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const numbers = '23456789';
    const all = uppercase + lowercase + numbers;
    let pass = uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
               lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
               numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 3; i < 9; i++) {
      pass += all.charAt(Math.floor(Math.random() * all.length));
    }
    return pass;
  };

  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [studentSessions, setStudentSessions] = useState([]);

  const [resetCredentials, setResetCredentials] = useState(null);
  const [createdTrainerCredentials, setCreatedTrainerCredentials] = useState(null);
  const [sendTrainerMailData, setSendTrainerMailData] = useState(null);
  const [sendMailPassword, setSendMailPassword] = useState('');

  // New modal visibility states
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [trainerName, setTrainerName] = useState('');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [trainerPhone, setTrainerPhone] = useState('');
  const [trainerSpecialization, setTrainerSpecialization] = useState('');
  const [trainerStatus, setTrainerStatus] = useState('Active');
  const [showLiveClassModal, setShowLiveClassModal] = useState(false);
  const [adminUploadClass, setAdminUploadClass] = useState(null);
  const [adminRecordingUrl, setAdminRecordingUrl] = useState('');
  const [adminRecordingDuration, setAdminRecordingDuration] = useState('1h 00m');
  const [adminIsUploadingFile, setAdminIsUploadingFile] = useState(false);
  const [adminUploadSaving, setAdminUploadSaving] = useState(false);
  const [adminPreviewVideo, setAdminPreviewVideo] = useState(null);

  const handleOpenAdminUploadRecordingModal = (classItem) => {
    setAdminUploadClass(classItem);
    setAdminRecordingUrl(classItem.recording_url || classItem.recordingUrl || '');
    setAdminRecordingDuration(classItem.duration || '1h 00m');
  };

  const handleSaveAdminRecording = async (e) => {
    if (e) e.preventDefault();
    if (!adminUploadClass) return;
    const targetId = adminUploadClass.id || adminUploadClass.uid || adminUploadClass._id;
    if (!adminRecordingUrl.trim()) {
      showModal('Missing URL', 'Please enter a valid video link (YouTube, Google Drive, or MP4 URL).', 'warning');
      return;
    }
    setAdminUploadSaving(true);
    try {
      await updateLiveClass(targetId, {
        recording_url: adminRecordingUrl.trim(),
        recordingUrl: adminRecordingUrl.trim(),
        duration: adminRecordingDuration || '1h 00m',
        recording_uploaded_at: new Date().toISOString(),
        status: 'Completed'
      });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
      setAdminUploadClass(null);
      setAdminRecordingUrl('');
      showModal('Recording Attached', `Recording for "${adminUploadClass.title}" has been attached successfully and published to students of ${adminUploadClass.batch_name || 'batch'}.`, 'success');
    } catch (err) {
      console.error('Failed to attach recording:', err);
      showModal('Error', 'Failed to save recording link. Please try again.', 'error');
    } finally {
      setAdminUploadSaving(false);
    }
  };

  const handleAdminVideoFileUpload = async (file) => {
    if (!file) return;
    setAdminIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (data.fileUrl) {
        setAdminRecordingUrl(data.fileUrl);
      }
    } catch (err) {
      console.error('File upload error:', err);
      showModal('Upload Error', 'Could not upload video file. You can also paste a direct YouTube or Google Drive link.', 'error');
    } finally {
      setAdminIsUploadingFile(false);
    }
  };

  const handlePreviewAdminRecording = (item) => {
    if (item.recording_url || item.recordingUrl) {
      setAdminPreviewVideo({
        id: item.id || item.uid,
        title: `${item.title} (Replay)`,
        courseTitle: `${item.batch_name || 'Batch Live Session'} • ${item.date}`,
        video_url: item.recording_url || item.recordingUrl,
        duration: item.duration || '1h 00m'
      });
    } else {
      showModal("Lecture Recording", `No recording uploaded yet for "${item.title}". Click the blue Upload Recording button to attach the recording link or video file.`);
    }
  };
  const [showRecordedClassModal, setShowRecordedClassModal] = useState(false);
  const [previewRecordedClass, setPreviewRecordedClass] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [playlistFormName, setPlaylistFormName] = useState('');
  const [playlistFormCourse, setPlaylistFormCourse] = useState('');
  const [playlistFormDescription, setPlaylistFormDescription] = useState('');
  const [playlistFormAccess, setPlaylistFormAccess] = useState('all');
  const [playlistFormBatchId, setPlaylistFormBatchId] = useState('');
  const [playlistFormThumbnail, setPlaylistFormThumbnail] = useState('');
  const [playlistThumbnailType, setPlaylistThumbnailType] = useState('url');
  const [playlistUploadingThumb, setPlaylistUploadingThumb] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [annFile, setAnnFile] = useState(null);
  const [annUploading, setAnnUploading] = useState(false);
  const [showActivityScoreModal, setShowActivityScoreModal] = useState(false);
  const [activityPresets, setActivityPresets] = useState([]);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [newPresetLabel, setNewPresetLabel] = useState('');
  const [newPresetPoints, setNewPresetPoints] = useState('');

  // Export State and Functions
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutsideExport = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideExport);
    return () => document.removeEventListener('mousedown', handleClickOutsideExport);
  }, []);

  const exportToCSV = () => {
    const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Course', 'Batch', 'Fee Status', 'Status'];
    const rows = students.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.phone || ''}"`,
      `"${s.course || ''}"`,
      `"${s.batch_name || 'Not Assigned'}"`,
      `"${s.feesStatus || ''}"`,
      `"${s.status || ''}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'students_registry_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const headers = ['Roll Number', 'Name', 'Email', 'Phone', 'Course', 'Batch', 'Fee Status', 'Status'];
    const rows = students.map(s => [
      s.rollNumber || '',
      s.name || '',
      s.email || '',
      s.phone || '',
      s.course || '',
      s.batch_name || 'Not Assigned',
      s.feesStatus || '',
      s.status || ''
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'students_registry_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Registry Export</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ccc; padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2 { color: #6C3CF0; }
          </style>
        </head>
        <body>
          <h2>Levlox Student Registry</h2>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Fees</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              \${students.map(s => \`
                <tr>
                  <td>\${s.rollNumber || ''}</td>
                  <td>\${s.name || ''}</td>
                  <td>\${s.email || ''}</td>
                  <td>\${s.phone || ''}</td>
                  <td>\${s.course || ''}</td>
                  <td>\${s.batch_name || 'Not Assigned'}</td>
                  <td>\${s.feesStatus || ''}</td>
                  <td>\${s.status || ''}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportBatchesToCSV = () => {
    const headers = ['Batch Code', 'Batch Name', 'Course Name', 'Instructor', 'Start Date', 'End Date', 'Status', 'Students Count', 'Max Students'];
    const rows = filteredBatches.map(b => [
      `"${b.code || ''}"`,
      `"${b.name || ''}"`,
      `"${b.course_name || ''}"`,
      `"${b.trainer_name || ''}"`,
      `"${b.start_date || ''}"`,
      `"${b.end_date || ''}"`,
      `"${b.status || ''}"`,
      b.students_count || 0,
      b.max_students || 30
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'batches_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBatchesToExcel = () => {
    const headers = ['Batch Code', 'Batch Name', 'Course Name', 'Instructor', 'Start Date', 'End Date', 'Status', 'Students Count', 'Max Students'];
    const rows = filteredBatches.map(b => [
      b.code || '',
      b.name || '',
      b.course_name || '',
      b.trainer_name || '',
      b.start_date || '',
      b.end_date || '',
      b.status || '',
      b.students_count || 0,
      b.max_students || 30
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'batches_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportBatchesToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    filteredBatches.forEach(b => {
      rowsHtml += `
        <tr>
          <td>${b.code || ''}</td>
          <td>${b.name || ''}</td>
          <td>${b.course_name || ''}</td>
          <td>${b.trainer_name || ''}</td>
          <td>${b.start_date || ''}</td>
          <td>${b.end_date || ''}</td>
          <td>${b.status || ''}</td>
          <td>${b.students_count || 0} / ${b.max_students || 30}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Institutional Batches Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #6C3CF0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
            th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Institutional Batches Report</h1>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Batch Name</th>
                <th>Course</th>
                <th>Instructor</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Students Enrolled</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportAttendanceToCSV = () => {
    const headers = ['Roll Number', 'Student Name', 'Attendance Rate', 'Present Classes', 'Absent Sessions'];
    const rows = students.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      `"${s.attendance?.percentage || 0}%"`,
      s.attendance?.present || 0,
      s.attendance?.absent || 0
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_matrix_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendanceToExcel = () => {
    const headers = ['Roll Number', 'Student Name', 'Attendance Rate', 'Present Classes', 'Absent Sessions'];
    const rows = students.map(s => [
      s.rollNumber || '',
      s.name || '',
      `${s.attendance?.percentage || 0}%`,
      s.attendance?.present || 0,
      s.attendance?.absent || 0
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_matrix_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendanceToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    students.forEach(s => {
      rowsHtml += `
        <tr>
          <td>${s.rollNumber || ''}</td>
          <td>${s.name || ''}</td>
          <td>${s.attendance?.percentage || 0}%</td>
          <td>${s.attendance?.present || 0} days</td>
          <td>${s.attendance?.absent || 0} days</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Institution Attendance Matrix Report</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #6C3CF0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
            th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Institution Attendance Matrix Report</h1>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Attendance Rate</th>
                <th>Present Classes</th>
                <th>Absent Sessions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportAttHistoryToCSV = () => {
    const headers = ['Date', 'Batch Name', 'Course Name', 'Present Count', 'Absent Count', 'Attendance Rate'];
    const rows = filteredAttSheets.map(s => [
      `"${s.date || ''}"`,
      `"${s.batch_name || ''}"`,
      `"${s.course_name || ''}"`,
      s.present_count ?? 0,
      s.absent_count ?? 0,
      `"${s.attendance_percentage ?? 100}%"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_history_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttHistoryToExcel = () => {
    const headers = ['Date', 'Batch Name', 'Course Name', 'Present Count', 'Absent Count', 'Attendance Rate'];
    const rows = filteredAttSheets.map(s => [
      s.date || '',
      s.batch_name || '',
      s.course_name || '',
      s.present_count ?? 0,
      s.absent_count ?? 0,
      `${s.attendance_percentage ?? 100}%`
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'attendance_history_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttHistoryToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    filteredAttSheets.forEach(s => {
      rowsHtml += `
        <tr>
          <td>${s.date || ''}</td>
          <td>${s.batch_name || ''}</td>
          <td>${s.course_name || ''}</td>
          <td>${s.present_count ?? 0}</td>
          <td>${s.absent_count ?? 0}</td>
          <td>${s.attendance_percentage ?? 100}%</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance History Logs Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Attendance History Logs Report</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Batch Name</th>
                <th>Course Name</th>
                <th>Present Count</th>
                <th>Absent Count</th>
                <th>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getFilteredLiveClasses = () => {
    const allAvailableClasses = liveClasses.map(c => ({
      ...c,
      batch_name: batches.find(b => b.id === c.batch_id)?.name || 'General Batch',
      students_joined: c.students_joined || 0
    }));

    return allAvailableClasses.filter(c => {
      const query = sessionSearch.toLowerCase();
      const matchesSearch = c.title?.toLowerCase().includes(query) || 
                            c.instructor?.toLowerCase().includes(query) ||
                            c.batch_name?.toLowerCase().includes(query);
      
      if (!matchesSearch) return false;
      
      if (!c.date) return true;
      const classDate = new Date(c.date);
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      if (dateFilter === 'Today') {
        return classDate >= startOfToday && classDate <= endOfToday;
      } else if (dateFilter === 'This Week') {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
        lastDayOfWeek.setHours(23,59,59,999);
        return classDate >= firstDayOfWeek && classDate <= lastDayOfWeek;
      } else if (dateFilter === 'This Month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return classDate >= firstDayOfMonth && classDate <= lastDayOfMonth;
      } else if (dateFilter === 'This Year') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return classDate >= firstDayOfYear && classDate <= lastDayOfYear;
      } else if (dateFilter === 'Custom Range') {
        if (!customStartDate || !customEndDate) return true;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59);
        return classDate >= start && classDate <= end;
      }
      return true;
    });
  };

  const exportLiveClassesToCSV = () => {
    const data = getFilteredLiveClasses();
    const headers = ['Lecture Title', 'Target Batch', 'Lead Faculty', 'Date', 'Time', 'Meet Link', 'Status', 'Students Joined'];
    const rows = data.map(c => [
      `"${c.title || ''}"`,
      `"${c.batch_name || ''}"`,
      `"${c.instructor || ''}"`,
      `"${c.date || ''}"`,
      `"${c.time || ''}"`,
      `"${c.meet_link || ''}"`,
      `"${c.status || ''}"`,
      c.students_joined || 0
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'live_classes_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLiveClassesToExcel = () => {
    const data = getFilteredLiveClasses();
    const headers = ['Lecture Title', 'Target Batch', 'Lead Faculty', 'Date', 'Time', 'Meet Link', 'Status', 'Students Joined'];
    const rows = data.map(c => [
      c.title || '',
      c.batch_name || '',
      c.instructor || '',
      c.date || '',
      c.time || '',
      c.meet_link || '',
      c.status || '',
      c.students_joined || 0
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'live_classes_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLiveClassesToPDF = () => {
    const data = getFilteredLiveClasses();
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    data.forEach(c => {
      rowsHtml += `
        <tr>
          <td>${c.title || ''}</td>
          <td>${c.batch_name || ''}</td>
          <td>${c.instructor || ''}</td>
          <td>${c.date || ''}</td>
          <td>${c.time || ''}</td>
          <td>${c.meet_link || ''}</td>
          <td>${c.status || ''}</td>
          <td>${c.students_joined || 0}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Live Sessions Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Live Sessions Report</h1>
          <table>
            <thead>
              <tr>
                <th>Lecture Title</th>
                <th>Target Batch</th>
                <th>Lead Faculty</th>
                <th>Date</th>
                <th>Time</th>
                <th>Meet Link</th>
                <th>Status</th>
                <th>Students Joined</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportRecordedClassesToCSV = () => {
    const headers = ['Lesson Title', 'Module', 'Course Title', 'Duration', 'Visibility', 'Drive Link', 'Youtube Link'];
    const rows = filteredRecorded.map(c => [
      `"${c.title || ''}"`,
      `"${c.module || ''}"`,
      `"${c.course_title || ''}"`,
      `"${c.duration || ''}"`,
      `"${c.visibility || ''}"`,
      `"${c.drive_link || ''}"`,
      `"${c.youtube_link || ''}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'recorded_classes_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRecordedClassesToExcel = () => {
    const headers = ['Lesson Title', 'Module', 'Course Title', 'Duration', 'Visibility', 'Drive Link', 'Youtube Link'];
    const rows = filteredRecorded.map(c => [
      c.title || '',
      c.module || '',
      c.course_title || '',
      c.duration || '',
      c.visibility || '',
      c.drive_link || '',
      c.youtube_link || ''
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'recorded_classes_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRecordedClassesToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    filteredRecorded.forEach(c => {
      rowsHtml += `
        <tr>
          <td>${c.title || ''}</td>
          <td>${c.module || ''}</td>
          <td>${c.course_title || ''}</td>
          <td>${c.duration || ''}</td>
          <td>${c.visibility || ''}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Recorded Classes Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Recorded Classes Report</h1>
          <table>
            <thead>
              <tr>
                <th>Lesson Title</th>
                <th>Module</th>
                <th>Course Title</th>
                <th>Duration</th>
                <th>Visibility</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportNotesToCSV = () => {
    const headers = ['Note Title', 'Subject', 'Type', 'URL', 'Description'];
    const rows = notes.map(n => [
      `"${n.title || ''}"`,
      `"${n.subject || ''}"`,
      `"${n.type || ''}"`,
      `"${n.url || ''}"`,
      `"${n.description || ''}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'notes_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportNotesToExcel = () => {
    const headers = ['Note Title', 'Subject', 'Type', 'URL', 'Description'];
    const rows = notes.map(n => [
      n.title || '',
      n.subject || '',
      n.type || '',
      n.url || '',
      n.description || ''
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'notes_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportNotesToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    notes.forEach(n => {
      rowsHtml += `
        <tr>
          <td>${n.title || ''}</td>
          <td>${n.subject || ''}</td>
          <td>${n.type || ''}</td>
          <td>${n.url || ''}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Notes & Study Materials Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Notes & Study Materials Report</h1>
          <table>
            <thead>
              <tr>
                <th>Note Title</th>
                <th>Subject</th>
                <th>Type</th>
                <th>URL</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportAnnouncementsToCSV = () => {
    const headers = ['Title', 'Content', 'Priority', 'Pinned', 'Date Created'];
    const rows = announcements.map(a => [
      `"${a.title || ''}"`,
      `"${a.content || ''}"`,
      `"${a.priority || 'Medium'}"`,
      a.pinned ? 'Yes' : 'No',
      `"${a.createdAt || ''}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'announcements_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAnnouncementsToExcel = () => {
    const headers = ['Title', 'Content', 'Priority', 'Pinned', 'Date Created'];
    const rows = announcements.map(a => [
      a.title || '',
      a.content || '',
      a.priority || 'Medium',
      a.pinned ? 'Yes' : 'No',
      a.createdAt || ''
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'announcements_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAnnouncementsToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    announcements.forEach(a => {
      rowsHtml += `
        <tr>
          <td>${a.title || ''}</td>
          <td>${a.content || ''}</td>
          <td>${a.priority || 'Medium'}</td>
          <td>${a.pinned ? 'Yes' : 'No'}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Announcements Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Announcements Report</h1>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Content</th>
                <th>Priority</th>
                <th>Pinned</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportFeesToCSV = () => {
    const headers = ['Roll Number', 'Name', 'Total Package', 'Paid Amount', 'Dues Outstanding', 'Ledger Status', 'Payment Date'];
    const rows = filteredStudentsForFees.map(s => [
      `"${s.rollNumber || ''}"`,
      `"${s.name || ''}"`,
      s.feesTotal || 20000,
      s.feesPaidAmount || 0,
      s.feesRemainingAmount ?? (s.feesTotal || 20000),
      `"${s.feesStatus || 'Pending'}"`,
      `"${s.feesPaymentDate || 'N/A'}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fees_ledger_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFeesToExcel = () => {
    const headers = ['Roll Number', 'Name', 'Total Package', 'Paid Amount', 'Dues Outstanding', 'Ledger Status', 'Payment Date'];
    const rows = filteredStudentsForFees.map(s => [
      s.rollNumber || '',
      s.name || '',
      s.feesTotal || 20000,
      s.feesPaidAmount || 0,
      s.feesRemainingAmount ?? (s.feesTotal || 20000),
      s.feesStatus || 'Pending',
      s.feesPaymentDate || 'N/A'
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fees_ledger_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportFeesToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    filteredStudentsForFees.forEach(s => {
      rowsHtml += `
        <tr>
          <td>${s.rollNumber || ''}</td>
          <td>${s.name || ''}</td>
          <td>₹${s.feesTotal || 20000}</td>
          <td>₹${s.feesPaidAmount || 0}</td>
          <td>₹${s.feesRemainingAmount ?? (s.feesTotal || 20000)}</td>
          <td>${s.feesStatus || 'Pending'}</td>
          <td>${s.feesPaymentDate || 'N/A'}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Financial Ledger Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Student Financial Ledger Report</h1>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Name</th>
                 <th>Total Package</th>
                 <th>Paid Amount</th>
                 <th>Dues Outstanding</th>
                 <th>Ledger Status</th>
                 <th>Payment Date</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportActivityToCSV = () => {
    const headers = ['Date', 'Student Name', 'Batch', 'Meeting', 'Activity Type', 'Points', 'Remarks'];
    const rows = filteredActivityLogs.map(l => [
      `"${l.date || ''}"`,
      `"${l.student_name || ''}"`,
      `"${l.batch_name || ''}"`,
      `"${l.meeting || ''}"`,
      `"${l.activity_type || ''}"`,
      l.points || 0,
      `"${l.remarks || ''}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_logs_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportActivityToExcel = () => {
    const headers = ['Date', 'Student Name', 'Batch', 'Meeting', 'Activity Type', 'Points', 'Remarks'];
    const rows = filteredActivityLogs.map(l => [
      l.date || '',
      l.student_name || '',
      l.batch_name || '',
      l.meeting || '',
      l.activity_type || '',
      l.points || 0,
      l.remarks || ''
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_logs_export.xls');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportActivityToPDF = () => {
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    filteredActivityLogs.forEach(l => {
      rowsHtml += `
        <tr>
          <td>${l.date || ''}</td>
          <td>${l.student_name || ''}</td>
          <td>${l.batch_name || ''}</td>
          <td>${l.meeting || ''}</td>
          <td>${l.activity_type || ''}</td>
          <td>${l.points || 0}</td>
          <td>${l.remarks || ''}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Activity Scores & Points Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Activity Scores & Points Report</h1>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Student Name</th>
                <th>Batch</th>
                <th>Meeting</th>
                <th>Activity Type</th>
                <th>Points</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Custom Delete Modal State
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Sidebar collapsible state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingFeesStudent, setEditingFeesStudent] = useState(null);
  const [attendanceStudent, setAttendanceStudent] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  // Form states for edits
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRollNumber, setEditRollNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCourse, setEditCourse] = useState('Fullstack Engineering');
  const [editBatchId, setEditBatchId] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editProfilePic, setEditProfilePic] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editAccountStatus, setEditAccountStatus] = useState('active');
  const [editFeesStatus, setEditFeesStatus] = useState('Pending Payment');
  const [editTotal, setEditTotal] = useState(1500);
  const [editPaid, setEditPaid] = useState(0);
  const [editStatus, setEditStatus] = useState('Pending Payment');
  const [editPayDate, setEditPayDate] = useState('');

  // Extra form states for creations
  const [createProfilePic, setCreateProfilePic] = useState('');
  const [createCollege, setCreateCollege] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [createLocation, setCreateLocation] = useState('');
  const [createCompany, setCreateCompany] = useState('');
  const [createStatus, setCreateStatus] = useState('active');

  // Attendance Sheet & Calendar States
  const [attCourse, setAttCourse] = useState('');
  const [attBatchId, setAttBatchId] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [attSheetsHistory, setAttSheetsHistory] = useState([]);
  const [viewingHistoryRecord, setViewingHistoryRecord] = useState(null);

  // Form states for creations
  const [liveTitle, setLiveTitle] = useState('');
  const [liveInstructor, setLiveInstructor] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveDescription, setLiveDescription] = useState('');
  const [liveToday, setLiveToday] = useState(false);
  const [livePublished, setLivePublished] = useState(true);
  const [liveStatus, setLiveStatus] = useState('Upcoming'); // Upcoming / Live / Completed
  const [editingLiveClass, setEditingLiveClass] = useState(null);

  // Edit live class form states
  const [editLiveTitle, setEditLiveTitle] = useState('');
  const [editLiveInstructor, setEditLiveInstructor] = useState('');
  const [editLiveMeetLink, setEditLiveMeetLink] = useState('');
  const [editLiveBatchId, setEditLiveBatchId] = useState('');
  const [editLiveDate, setEditLiveDate] = useState('');
  const [editLiveTime, setEditLiveTime] = useState('');
  const [editLiveDescription, setEditLiveDescription] = useState('');
  const [editLiveStatus, setEditLiveStatus] = useState('Upcoming');
  const [editLiveToday, setEditLiveToday] = useState(false);
  const [editLivePublished, setEditLivePublished] = useState(true);

  const [recTitle, setRecTitle] = useState('');
  const [recDuration, setRecDuration] = useState('1h 30m');
  const [recDescription, setRecDescription] = useState('');
  const [recThumbnail, setRecThumbnail] = useState('');
  const [recYoutube, setRecYoutube] = useState('');
  const [recDrive, setRecDrive] = useState('');
  const [recCourseTitle, setRecCourseTitle] = useState('Fullstack Engineering');
  const [recModule, setRecModule] = useState('Module 1 - Python Basics');
  const [recVideoUrl, setRecVideoUrl] = useState('');
  const [recThumbnailUrl, setRecThumbnailUrl] = useState('');
  const [recLessonDescription, setRecLessonDescription] = useState('');
  const [recNotesUrl, setRecNotesUrl] = useState('');
  const [recAssignment, setRecAssignment] = useState('');
  const [recVisibility, setRecVisibility] = useState('everyone');
  const [recSortOrder, setRecSortOrder] = useState('');
  const [editingRecordedClass, setEditingRecordedClass] = useState(null);

  // States for uploading video files and multiple study materials
  const [videoSourceType, setVideoSourceType] = useState('link'); // 'link' or 'upload'
  const [recStudyMaterials, setRecStudyMaterials] = useState([]); // Array of { name, url, type }
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  // Temp form fields to add a study material
  const [newMaterialName, setNewMaterialName] = useState('');
  const [newMaterialSourceType, setNewMaterialSourceType] = useState('link'); // 'link' or 'upload'
  const [newMaterialUrl, setNewMaterialUrl] = useState('');

  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPriority, setAnnPriority] = useState('Medium');
  const [annPinned, setAnnPinned] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);

  // Edit announcements form states
  const [editAnnTitle, setEditAnnTitle] = useState('');
  const [editAnnContent, setEditAnnContent] = useState('');
  const [editAnnPriority, setEditAnnPriority] = useState('Medium');
  const [editAnnPinned, setEditAnnPinned] = useState(false);

  // Portal settings states

  // Admin Profile and settings states
  const [adminProfileData, setAdminProfileData] = useState(null);
  const [loadingAdminProfile, setLoadingAdminProfile] = useState(true);
  const [savingAdminAccount, setSavingAdminAccount] = useState(false);
  const [savingAdminPassword, setSavingAdminPassword] = useState(false);
  const [adminToast, setAdminToast] = useState('');

  // Admin Account Fields
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminProfilePic, setAdminProfilePic] = useState('');

  // Admin Password Fields
  const [adminCurrPassword, setAdminCurrPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminCurrPassword, setShowAdminCurrPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);

  // Avatar file staged locally; uploaded to Storage when the form is saved.
  const [pendingAdminAvatar, setPendingAdminAvatar] = useState(null);

  // Activity score management states
  const [actBatchId, setActBatchId] = useState('');
  const [actStudentId, setActStudentId] = useState('');
  const [actDate, setActDate] = useState(new Date().toISOString().substring(0, 10));
  const [actMeeting, setActMeeting] = useState('');
  const [actType, setActType] = useState('+10 Answered Questions');
  const [isCustomAct, setIsCustomAct] = useState(false);
  const [actPoints, setActPoints] = useState(10);
  const [actRemarks, setActRemarks] = useState('');
  const [batchStudents, setBatchStudents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  // Compute filtered datasets for client-side filtered tabs
  const filteredAttSheets = attSheetsHistory.filter(sheet => {
    const query = attSearchQuery.toLowerCase();
    const matchesSearch = !query || 
      (sheet.batch_name || '').toLowerCase().includes(query) ||
      (sheet.course_name || '').toLowerCase().includes(query);
      
    const matchesCourse = !attCourseFilter || sheet.course_name === attCourseFilter;
    const matchesBatch = !attBatchFilter || sheet.batch_id === attBatchFilter || sheet.batch_name === attBatchFilter;
    
    const pct = sheet.attendance_percentage ?? 100;
    let matchesStatus = true;
    if (attStatusFilter === 'high') matchesStatus = pct >= 80;
    else if (attStatusFilter === 'low') matchesStatus = pct < 80;

    let matchesDate = true;
    if (attDateFilter && sheet.date) {
      const sheetDate = new Date(sheet.date);
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      if (attDateFilter === 'Today') {
        matchesDate = sheetDate >= startOfToday && sheetDate <= endOfToday;
      } else if (attDateFilter === 'This Week') {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
        lastDayOfWeek.setHours(23,59,59,999);
        matchesDate = sheetDate >= firstDayOfWeek && sheetDate <= lastDayOfWeek;
      } else if (attDateFilter === 'This Month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        matchesDate = sheetDate >= firstDayOfMonth && sheetDate <= lastDayOfMonth;
      } else if (attDateFilter === 'This Year') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        matchesDate = sheetDate >= firstDayOfYear && sheetDate <= lastDayOfYear;
      } else if (attDateFilter === 'Custom Range') {
        const start = attStartDateFilter ? new Date(attStartDateFilter) : null;
        const end = attEndDateFilter ? new Date(attEndDateFilter) : null;
        if (end) end.setHours(23, 59, 59);
        if (start && end) {
          matchesDate = sheetDate >= start && sheetDate <= end;
        } else if (start) {
          matchesDate = sheetDate >= start;
        } else if (end) {
          matchesDate = sheetDate <= end;
        }
      }
    }
    
    return matchesSearch && matchesCourse && matchesBatch && matchesStatus && matchesDate;
  });

  const getDateRangeBounds = (filterType, customStart, customEnd) => {
    const now = new Date();
    let start = null;
    let end = null;
    
    if (filterType === 'Today') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (filterType === 'This Week') {
      start = new Date(now);
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
      end.setHours(23,59,59,999);
    } else if (filterType === 'This Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (filterType === 'This Year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else if (filterType === 'Custom Range') {
      if (customStart) {
        start = new Date(customStart);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59);
      }
    }
    
    return {
      startDate: start ? start.toISOString() : '',
      endDate: end ? end.toISOString() : ''
    };
  };

  const filterByDateRange = (dateStr, dateFilterType, customStart, customEnd) => {
    if (!dateStr) return true;
    try {
      const itemDate = new Date(dateStr);
      if (isNaN(itemDate.getTime())) return true;
      const now = new Date();
      
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      
      if (dateFilterType === 'Today') {
        return itemDate >= startOfToday && itemDate <= endOfToday;
      } else if (dateFilterType === 'This Week') {
        const firstDayOfWeek = new Date(now);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
        firstDayOfWeek.setHours(0,0,0,0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
        lastDayOfWeek.setHours(23,59,59,999);
        return itemDate >= firstDayOfWeek && itemDate <= lastDayOfWeek;
      } else if (dateFilterType === 'This Month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return itemDate >= firstDayOfMonth && itemDate <= lastDayOfMonth;
      } else if (dateFilterType === 'This Year') {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        return itemDate >= firstDayOfYear && itemDate <= lastDayOfYear;
      } else if (dateFilterType === 'Custom Range') {
        if (!customStart || !customEnd) return true;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59);
        return itemDate >= start && itemDate <= end;
      }
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  const filteredBatches = batches.filter(b => {
    const query = batchSearchQuery.toLowerCase();
    const matchesSearch = !query || 
      (b.code || '').toLowerCase().includes(query) ||
      (b.name || '').toLowerCase().includes(query) ||
      (b.course_name || '').toLowerCase().includes(query) ||
      (b.trainer_name || '').toLowerCase().includes(query);
    const matchesCourse = !batchCourseFilter || b.course_name === batchCourseFilter;
    const matchesTrainer = !batchTrainerFilter || b.trainer_name === batchTrainerFilter;
    
    // Lifecycle Duration Check (e.g. 50 days active window)
    const durationInfo = calculateBatchDurationInfo(b.start_date, b.end_date, b.duration_days);
    if (batchLifecycleFilter === 'active_only' && !durationInfo.isActive) return false;
    if (batchLifecycleFilter === 'completed' && !durationInfo.isExpired) return false;
    if (batchLifecycleFilter === 'upcoming' && !durationInfo.isUpcoming) return false;

    const matchesStatus = !batchStatusFilter || b.status === batchStatusFilter;
    const matchesDate = filterByDateRange(b.start_date, batchDateFilter, batchStartDateFilter, batchEndDateFilter);
    return matchesSearch && matchesCourse && matchesStatus && matchesTrainer && matchesDate;
  });

  const batchStats = {
    total: batches.length,
    active: batches.filter(b => calculateBatchDurationInfo(b.start_date, b.end_date, b.duration_days).isActive).length,
    completed: batches.filter(b => calculateBatchDurationInfo(b.start_date, b.end_date, b.duration_days).isExpired).length,
    upcoming: batches.filter(b => calculateBatchDurationInfo(b.start_date, b.end_date, b.duration_days).isUpcoming).length,
    totalStudents: batches.reduce((acc, b) => acc + (b.students_count || (Array.isArray(b.student_ids) ? b.student_ids.length : 0)), 0),
  };

  const filteredAnnouncements = announcements.filter(item => {
    const query = annSearchQuery.toLowerCase();
    const matchesSearch = !query || 
      (item.title || '').toLowerCase().includes(query) ||
      (item.content || '').toLowerCase().includes(query);
    const matchesBatch = !annBatchFilter || item.batch_id === annBatchFilter;
    const annBatch = batches.find(b => b.id === item.batch_id);
    const matchesCourse = !annCourseFilter || (annBatch && annBatch.course_name === annCourseFilter);
    let matchesAudience = true;
    if (annAudienceFilter === 'pinned') matchesAudience = item.is_pinned;
    else if (annAudienceFilter === 'high') matchesAudience = item.priority === 'High';
    else if (annAudienceFilter === 'medium') matchesAudience = item.priority === 'Medium';
    else if (annAudienceFilter === 'low') matchesAudience = item.priority === 'Low';
    
    // Apply date filter
    const matchesDate = filterByDateRange(item.date || item.uploaded_at, annDateFilter, annStartDateFilter, annEndDateFilter);
    
    return matchesSearch && matchesBatch && matchesCourse && matchesAudience && matchesDate;
  });

  const filteredRecorded = recordedClasses.filter(c => {
    const query = recordedSearchQuery.toLowerCase();
    const matchesSearch = !query || 
      (c.title || '').toLowerCase().includes(query) ||
      (c.module || '').toLowerCase().includes(query);
    const matchesCourse = !recordedCourseFilter || c.course_title === recordedCourseFilter;
    const matchesBatch = !recordedBatchFilter || c.batch_id === recordedBatchFilter;
    const matchesVisibility = !recordedVisibilityFilter || c.visibility === recordedVisibilityFilter;
    
    let uploadType = 'Google Drive';
    if (c.video_source_type === 'upload') {
      uploadType = 'Uploaded';
    }
    const matchesUploadType = !recordedUploadTypeFilter || uploadType === recordedUploadTypeFilter;
    
    // Apply date filter
    const matchesDate = filterByDateRange(c.created_at || c.date, recordedDateFilter, recordedStartDateFilter, recordedEndDateFilter);
    
    return matchesSearch && matchesCourse && matchesBatch && matchesVisibility && matchesUploadType && matchesDate;
  });

  // Client-side sub-filtering for Fees (since Payment Method & Date Range are client-only)
  const filteredStudentsForFees = students.filter(s => {
    const matchesPaymentMethod = !feesPaymentMethodFilter || (s.paymentMethod || 'Credit Card').toLowerCase() === feesPaymentMethodFilter.toLowerCase();
    
    // Apply date filter
    const matchesDate = filterByDateRange(s.feesPaymentDate, feesDateFilter, feesStartDateFilter, feesEndDateFilter);
    
    return matchesPaymentMethod && matchesDate;
  });

  const filteredActivityLogs = activityLogs.filter(l => {
    const query = activitySearchQuery.toLowerCase();
    const matchesSearch = !query || 
      (l.student_name || '').toLowerCase().includes(query) ||
      (l.student_roll || l.rollNumber || '').toLowerCase().includes(query);
    
    const matchesBatch = !activityBatchFilter || l.batch_id === activityBatchFilter || l.batch_name === activityBatchFilter;
    
    const logBatch = batches.find(b => b.id === l.batch_id || b.name === l.batch_name);
    const matchesCourse = !activityCourseFilter || (logBatch && logBatch.course_name === activityCourseFilter);
    
    const matchesType = !activityTypeFilter || (l.activity_type || '').toLowerCase().includes(activityTypeFilter.toLowerCase());
    
    const points = l.points || 0;
    let matchesScore = true;
    if (activityScoreMin === 'positive') matchesScore = points >= 0;
    else if (activityScoreMin === 'negative') matchesScore = points < 0;
    else if (activityScoreMin === 'high') matchesScore = points > 5;
    
    // Apply date filter
    const matchesDate = filterByDateRange(l.date, activityDateFilter, activityStartDateFilter, activityEndDateFilter);
    
    return matchesSearch && matchesBatch && matchesCourse && matchesType && matchesScore && matchesDate;
  });

  const handleActBatchChange = async (batchId) => {
    setActBatchId(batchId);
    setActStudentId('');
    if (!batchId) {
      setBatchStudents([]);
      return;
    }
    try {
      setBatchStudents(await getStudentsByBatch(batchId));
    } catch (e) {
      console.error('[Admin] load batch students failed:', e);
      showModal('Error', classifyFirestoreError(e).message, 'error');
    }
  };

  const [submittingActivity, setSubmittingActivity] = useState(false);

  const handleAwardActivity = async (e) => {
    e.preventDefault();
    if (!actStudentId || !actBatchId || !actMeeting) {
      showModal("Missing Fields", "Please select Batch, Student, and enter Meeting Title.", "warning");
      return;
    }
    if (submittingActivity) return;
    setSubmittingActivity(true);
    try {
      const student = batchStudents.find(s => s.id === actStudentId);
      const batch = firestoreBatches.find(b => b.id === actBatchId);

      await awardActivityScore({
        studentId: actStudentId,
        studentName: student?.name || '',
        batchId: actBatchId,
        batchName: batch?.name || '',
        date: actDate,
        meeting: actMeeting,
        activityType: actType,
        points: actPoints,
        remarks: actRemarks,
        awardedBy: uid,
      });

      showModal('Success', 'Activity score updated successfully!', 'success');
      setActRemarks('');
      fetchActivityLogs();
      fetchStats();
    } catch (e) {
      console.error('[Admin] award activity failed:', e);
      showModal('Error', e.message || classifyFirestoreError(e).message, 'error');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      setActivityLogs(await getActivityLogs());
    } catch (e) {
      console.error('[Admin] load activity logs failed:', e);
      showModal('Error', classifyFirestoreError(e).message, 'error');
    }
  };

  const fetchActivityPresets = async () => {
    try {
      setActivityPresets(await getActivityPresets());
    } catch (e) {
      console.error('[Admin] load activity presets failed:', e);
    }
  };

  const handleCreatePreset = async () => {
    if (!newPresetLabel || newPresetPoints === '') {
      showModal("Warning", "Please enter preset label and points.", "warning");
      return;
    }
    try {
      await addActivityPreset(newPresetLabel, newPresetPoints);
      showModal('Success', 'Preset created successfully!', 'success');
      setNewPresetLabel('');
      setNewPresetPoints('');
      fetchActivityPresets();
    } catch (e) {
      console.error('[Admin] create preset failed:', e);
      showModal('Error', classifyFirestoreError(e).message, 'error');
    }
  };

  const handleDeletePreset = async (presetId) => {
    try {
      await deleteActivityPreset(presetId);
      showModal('Success', 'Preset deleted successfully!', 'success');
      fetchActivityPresets();
    } catch (e) {
      console.error('[Admin] delete preset failed:', e);
      showModal('Error', classifyFirestoreError(e).message, 'error');
    }
  };

  // Notification Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalText, setModalText] = useState('');
  const [modalType, setModalType] = useState('info');

  const showModal = (title, text, type = 'info') => {
    setModalTitle(title);
    setModalText(text);
    setModalType(type);
    setModalOpen(true);
  };



  const showAdminToast = (msg) => {
    setAdminToast(msg);
    setTimeout(() => setAdminToast(''), 4000);
  };

  const fetchAdminProfile = async () => {
    if (!uid) return;
    setLoadingAdminProfile(true);
    try {
      const d = await getDocument('admins', uid);
      if (d) {
        setAdminProfileData(d);
        setAdminName(d.name || '');
        setAdminEmail(d.email || currentUser?.email || '');
        setAdminProfilePic(d.profile_pic || '');
      } else if (currentUser?.email) {
        setAdminEmail(currentUser.email);
      }
    } catch (e) {
      console.error('[Admin] load profile failed:', e);
      showAdminToast('Error loading profile data.');
    } finally {
      setLoadingAdminProfile(false);
    }
  };

  const handleSaveAdminAccount = async (e) => {
    if (e) e.preventDefault();
    if (!adminName.trim()) {
      showModal('Validation Error', 'Full Name is required.', 'warning');
      return;
    }
    if (!uid) {
      showModal('Error', 'You are not signed in. Please sign in again.', 'error');
      return;
    }

    setSavingAdminAccount(true);
    try {
      const patch = { name: adminName.trim() };

      // Large images belong in Storage; Firestore keeps only the URL.
      if (pendingAdminAvatar) {
        patch.profile_pic = await uploadProfileImage(uid, pendingAdminAvatar);
        setAdminProfilePic(patch.profile_pic);
        setPendingAdminAvatar(null);
      }

      await updateDocumentFields('admins', uid, patch);
      applyProfilePatch(patch);
      showAdminToast('Account details updated successfully ✓');
      fetchAdminProfile();
    } catch (e) {
      console.error('[Admin] save profile failed:', e);
      showModal('Error', classifyFirestoreError(e).message, 'error');
    } finally {
      setSavingAdminAccount(false);
    }
  };

  const handleAdminImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showModal('Invalid File', 'Please choose an image file.', 'warning');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showModal('File Too Large', 'Please choose an image under 3 MB.', 'warning');
      return;
    }
    setPendingAdminAvatar(file);
    setAdminProfilePic(URL.createObjectURL(file)); // preview until saved
  };

  const handleAdminChangePassword = async (e) => {
    if (e) e.preventDefault();
    if (!adminCurrPassword) {
      showModal('Validation Error', 'Please enter your current password.', 'warning');
      return;
    }
    const strengthError = validatePasswordStrength(adminNewPassword);
    if (strengthError) {
      showModal('Validation Error', strengthError, 'warning');
      return;
    }
    if (adminNewPassword !== adminConfirmPassword) {
      showModal('Validation Error', 'New passwords do not match.', 'warning');
      return;
    }

    setSavingAdminPassword(true);
    try {
      // Reauthenticates with the current password, then updates via Firebase Auth.
      await changeOwnPassword(adminCurrPassword, adminNewPassword);
      showModal('Password Updated', 'Your password was changed successfully!', 'success');
      setAdminCurrPassword('');
      setAdminNewPassword('');
      setAdminConfirmPassword('');
    } catch (e) {
      console.error('[Admin] password change failed:', e);
      showModal('Update Failed', describeAuthError(e), 'error');
    } finally {
      setSavingAdminPassword(false);
    }
  };




  // ══════════════════════════════════════════════════════
  // BATCH MANAGEMENT EVENT HANDLERS
  // ══════════════════════════════════════════════════════
  const fetchCourses = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const fetchBatches = () => {
    queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const fetchAllStudentsForAssign = async () => {
    try {
      const list = await listStudents();
      setAllStudentsForAssign(list || []);
    } catch (error) {
      console.error(error);
    }
  };

  const resetBatchForm = () => {
    const today = formatLocalDate(new Date());
    setBatchName('');
    setBatchCourseName('');
    setBatchTrainerName('');
    setBatchStartDate(today);
    setBatchDurationDays(50);
    setBatchEndDate(addDaysToDate(today, 50));
    setBatchTiming('10:00 AM - 12:00 PM');
    setBatchStatus('Active');
    setBatchMaxStudents(30);
  };

  const batchPayload = () => {
    const calculatedDays = Number(batchDurationDays) || getDaysBetween(batchStartDate, batchEndDate) || 50;
    return {
      name: batchName.trim(),
      course_name: batchCourseName.trim(),
      trainer_name: batchTrainerName.trim(),
      trainer_uid: (trainers.find(t => t.name === batchTrainerName.trim() || t.trainer_id === batchTrainerName.trim() || t.trainerId === batchTrainerName.trim())?.id) || '',
      trainer_id: (trainers.find(t => t.name === batchTrainerName.trim() || t.trainer_id === batchTrainerName.trim() || t.trainerId === batchTrainerName.trim())?.trainerId) || '',
      trainer_email: (trainers.find(t => t.name === batchTrainerName.trim() || t.trainer_id === batchTrainerName.trim() || t.trainerId === batchTrainerName.trim())?.email) || '',
      start_date: batchStartDate,
      end_date: batchEndDate,
      duration_days: calculatedDays,
      timing: batchTiming.trim() || '10:00 AM - 12:00 PM',
      status: batchStatus,
      max_students: Number(batchMaxStudents) || 30,
    };
  };

  const validateBatchForm = () => {
    if (!batchName.trim() || !batchCourseName.trim() || !batchTrainerName.trim() || !batchStartDate || !batchEndDate) {
      showModal('Missing Fields', 'Name, course, trainer, start date and end date are all required.', 'warning');
      return false;
    }
    return true;
  };

  const syncBatchTrainer = async (batchId, trainerNameStr) => {
    if (!batchId || !trainerNameStr) return;
    const matchingTrainer = trainers.find(t => t.name === trainerNameStr || t.trainer_id === trainerNameStr || t.trainerId === trainerNameStr);
    if (matchingTrainer) {
      await assignTrainerToBatch(batchId, matchingTrainer.id, {
        trainerId: matchingTrainer.trainerId || matchingTrainer.trainer_id || '',
        trainerName: matchingTrainer.name || '',
      }).catch(err => console.warn('[Admin] Sync trainer assigned_batch_ids failed:', err));
    }
  };

  const createBatch = async (e) => {
    e.preventDefault();
    if (!validateBatchForm()) return;
    try {
      const code = await generateNextId('batch');
      const created = await addBatch({ ...batchPayload(), code });
      if (created?.id) {
        await syncBatchTrainer(created.id, batchTrainerName.trim());
      }
      resetBatchForm();
      setShowBatchModal(false);
      showModal('Success', `New batch (${code}) created successfully!`, 'success');
      fetchBatches();
    } catch (error) {
      console.error('[Admin] createBatch failed:', error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const [trainerTempPassword, setTrainerTempPassword] = useState('');

  const openTrainerModal = (trainer = null) => {
    if (trainer) {
      setEditingTrainer(trainer);
      setTrainerName(trainer.name || '');
      setTrainerEmail(trainer.email || '');
      setTrainerPhone(trainer.phone || '');
      setTrainerSpecialization(trainer.specialization || trainer.course || '');
      setTrainerStatus(trainer.status || 'Active');
      setTrainerTempPassword('');
    } else {
      setEditingTrainer(null);
      setTrainerName('');
      setTrainerEmail('');
      setTrainerPhone('');
      setTrainerSpecialization('');
      setTrainerStatus('Active');
      setTrainerTempPassword(generateRandomPassword());
    }
    setShowTrainerModal(true);
  };

  const openSendTrainerMailModal = (trainerObj) => {
    setSendTrainerMailData(trainerObj);
    setSendMailPassword(trainerObj.tempPassword || trainerObj.password || generateRandomPassword());
  };

  const handleConfirmSendTrainerMail = async () => {
    if (!sendTrainerMailData) return;
    try {
      await sendTrainerWelcomeEmail({
        name: sendTrainerMailData.name,
        email: sendTrainerMailData.email,
        trainerId: sendTrainerMailData.trainerId || sendTrainerMailData.code || sendTrainerMailData.trainer_id,
        openMailClient: true
      }, sendMailPassword);
      showModal("Email Client Opened", `Prepared welcome email with credentials for ${sendTrainerMailData.name}.`, "success");
      setSendTrainerMailData(null);
    } catch (err) {
      console.error('[Admin] Send trainer mail error:', err);
      showModal("Error", err.message || "Failed to prepare mail.", "error");
    }
  };

  const handleSaveTrainer = async (e) => {
    e.preventDefault();
    if (!trainerName.trim() || !trainerEmail.trim()) {
      showModal('Missing Fields', 'Trainer Name and Email are required.', 'warning');
      return;
    }
    try {
      if (editingTrainer) {
        const payload = {
          name: trainerName.trim(),
          email: trainerEmail.trim(),
          phone: trainerPhone.trim(),
          mobile: trainerPhone.trim(),
          specialization: trainerSpecialization.trim(),
          course: trainerSpecialization.trim(),
          status: trainerStatus,
        };
        await updateTrainer(editingTrainer.id, payload);
        showModal('Success', 'Trainer profile updated successfully!', 'success');
        setShowTrainerModal(false);
      } else {
        if (!trainerTempPassword) {
          showModal('Missing Fields', 'Temporary password is required.', 'warning');
          return;
        }

        let uid;
        try {
          uid = await createAuthUserDetached(trainerEmail.trim(), trainerTempPassword, 'trainer', trainerName.trim(), trainerPhone.trim());
        } catch (authErr) {
          if (authErr?.code === 'auth/email-already-in-use') {
            const cleanEmailLower = trainerEmail.trim().toLowerCase();
            const cleanPhone = trainerPhone ? normalizeMobile(trainerPhone) : '';
            
            // 1. Direct Firestore query on 'trainers'
            const trainersByEmail = await getDocuments('trainers', [where('email', '==', cleanEmailLower)]).catch(() => []);
            if (trainersByEmail.length > 0 && trainersByEmail[0].id) {
              uid = trainersByEmail[0].id;
            }

            // 2. Direct Firestore query on 'students'
            if (!uid) {
              const studentsByEmail = await getDocuments('students', [where('email', '==', cleanEmailLower)]).catch(() => []);
              if (studentsByEmail.length > 0 && studentsByEmail[0].id) {
                uid = studentsByEmail[0].id;
              }
            }

            // 3. Direct Firestore query on 'deletedUsers' tracking
            if (!uid) {
              const safeKey = cleanEmailLower.replace(/[^a-zA-Z0-9]/g, '_');
              const deletedDoc = await getDocument('deletedUsers', safeKey).catch(() => null);
              if (deletedDoc && deletedDoc.uid) {
                uid = deletedDoc.uid;
              }
            }

            // 4. Query deletedUsers collection directly by email
            if (!uid) {
              const deletedByEmail = await getDocuments('deletedUsers', [where('email', '==', cleanEmailLower)]).catch(() => []);
              if (deletedByEmail.length > 0 && deletedByEmail[0].uid) {
                uid = deletedByEmail[0].uid;
              }
            }

            // 5. Query attendance / payments records for legacy UID
            if (!uid) {
              const attRecs = await getDocuments('attendance', [where('studentEmail', '==', cleanEmailLower)]).catch(() => []);
              if (attRecs.length > 0 && (attRecs[0].studentId || attRecs[0].student_id)) {
                uid = attRecs[0].studentId || attRecs[0].student_id;
              }
            }

            // 6. Fallback: If UID not found in Firestore records, use trainer code ID
            if (!uid) {
              const fallbackTrainerCode = await generateNextId('trainer');
              uid = `trainer_${fallbackTrainerCode}`;
            }
          } else {
            throw authErr;
          }
        }

        const trainerId = await generateNextId('trainer');

        const payload = {
          name: trainerName.trim(),
          email: trainerEmail.trim(),
          phone: trainerPhone.trim(),
          mobile: trainerPhone.trim(),
          specialization: trainerSpecialization.trim(),
          course: trainerSpecialization.trim(),
          status: trainerStatus,
          trainerId,
          trainer_id: trainerId,
          code: trainerId,
          mustChangePassword: false,
        };

        await createTrainerProfile(uid, payload);
        await deleteDocument('students', uid).catch(() => {});
        
        setShowTrainerModal(false);
        setCreatedTrainerCredentials({
          name: trainerName.trim(),
          email: trainerEmail.trim(),
          trainerId,
          password: trainerTempPassword
        });

        // Trigger welcome email status tracking in Firestore
        sendTrainerWelcomeEmail({ name: trainerName.trim(), email: trainerEmail.trim(), trainerId, openMailClient: false }, trainerTempPassword);
      }
      fetchStats();
    } catch (err) {
      console.error('[Admin] Trainer creation/update failed:', err);
      const msg = err.code === 'auth/email-already-in-use'
        ? 'That email address is already registered in Firebase Authentication.'
        : (describeAuthError(err) || err?.message || 'Unable to create trainer account. Please try again.');
      showModal('Error', msg, 'error');
    }
  };

  const handleDeleteTrainer = async (trainerId) => {
    if (!window.confirm('Are you sure you want to delete this trainer record?')) return;
    try {
      await deleteTrainer(trainerId);
      showModal('Success', 'Trainer deleted successfully.', 'success');
      fetchStats();
    } catch (err) {
      console.error(err);
      showModal('Error', classifyFirestoreError(err).message, 'error');
    }
  };

  const startEditBatch = (batch) => {
    setEditingBatch(batch);
    setBatchName(batch.name || '');
    setBatchCourseName(batch.course_name || '');
    setBatchTrainerName(batch.trainer_name || '');
    const sDate = batch.start_date || formatLocalDate(new Date());
    setBatchStartDate(sDate);
    const dDays = Number(batch.duration_days) || (batch.start_date && batch.end_date ? getDaysBetween(batch.start_date, batch.end_date) : 50);
    setBatchDurationDays(dDays);
    setBatchEndDate(batch.end_date || addDaysToDate(sDate, dDays));
    setBatchTiming(batch.timing || '10:00 AM - 12:00 PM');
    setBatchStatus(batch.status || 'Active');
    setBatchMaxStudents(batch.max_students || 30);
    setShowBatchModal(true);
  };

  const handleOpenExtendModal = (batch) => {
    setExtendingBatch(batch);
    setExtendDays(15);
    setExtendTiming(batch.timing || '10:00 AM - 12:00 PM');
    setExtendReason('');
    setShowExtendModal(true);
  };

  const handleConfirmExtendBatch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!extendingBatch) return;
    try {
      setIsExtending(true);
      const today = formatLocalDate(new Date());
      const currentEnd = extendingBatch.end_date || today;
      // If end date has already passed, extend starting from today; otherwise extend from currentEnd
      const baseDate = (currentEnd < today) ? today : currentEnd;
      const newEndDate = addDaysToDate(baseDate, extendDays);

      const prevDuration = Number(extendingBatch.duration_days) || getDaysBetween(extendingBatch.start_date, extendingBatch.end_date) || 50;
      const newTotalDuration = prevDuration + Number(extendDays);

      const extensionRecord = {
        extendedAt: new Date().toISOString(),
        daysAdded: Number(extendDays),
        previousEndDate: extendingBatch.end_date,
        newEndDate: newEndDate,
        previousTiming: extendingBatch.timing || '10:00 AM - 12:00 PM',
        newTiming: extendTiming.trim() || extendingBatch.timing || '10:00 AM - 12:00 PM',
        reason: extendReason.trim() || 'Batch duration extension',
      };

      const updatedHistory = Array.isArray(extendingBatch.extension_history)
        ? [...extendingBatch.extension_history, extensionRecord]
        : [extensionRecord];

      const patch = {
        end_date: newEndDate,
        duration_days: newTotalDuration,
        timing: extendTiming.trim() || extendingBatch.timing || '10:00 AM - 12:00 PM',
        status: 'Active',
        extension_history: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await updateBatch(extendingBatch.id, patch);
      setShowExtendModal(false);
      setExtendingBatch(null);
      showModal('Batch Extended Successfully', `Batch duration extended by +${extendDays} days! New end date is ${formatReadableDate(newEndDate)}. Status is now Active.`, 'success');
      fetchBatches();
    } catch (err) {
      console.error('[Admin] Extend batch failed:', err);
      showModal('Error Extending Batch', classifyFirestoreError(err).message, 'error');
    } finally {
      setIsExtending(false);
    }
  };

  const saveBatchEdit = async (e) => {
    e.preventDefault();
    if (!validateBatchForm()) return;
    try {
      await updateBatch(editingBatch.id, batchPayload());
      await syncBatchTrainer(editingBatch.id, batchTrainerName.trim());
      setEditingBatch(null);
      resetBatchForm();
      setShowBatchModal(false);
      showModal('Success', 'Batch details updated successfully!', 'success');
      fetchBatches();
    } catch (error) {
      console.error('[Admin] saveBatchEdit failed:', error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const deleteBatch = async (batchId) => {
    if (!batchId) return;
    if (!window.confirm("Are you sure you want to permanently delete this batch? All assigned students will be unlinked and the batch playlist will be removed.")) return;
    try {
      // Unlink the roster first so no student keeps a dangling batch reference.
      await assignStudentsToBatch(batchId, []).catch(() => null);
      await deleteBatchDoc(batchId);
      if (selectedPlaylistBatch?.id === batchId || selectedPlaylistBatch?.uid === batchId) {
        setSelectedPlaylistBatch(null);
      }
      showModal('Success', 'Batch deleted successfully!', 'success');
      fetchBatches();
      fetchStudents();
      await refetchAdminData();
    } catch (error) {
      console.error('[Admin] deleteBatch failed:', error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const startAssignStudents = (batch) => {
    setAssigningBatch(batch);
    const fromBatch = Array.isArray(batch.student_ids) ? batch.student_ids : [];
    const fromStudents = allStudents.filter(s => s.batch_id === batch.id).map(s => s.id);
    const combinedInitial = Array.from(new Set([...fromBatch, ...fromStudents]));
    setSelectedStudentIds(combinedInitial);
    fetchAllStudentsForAssign();
  };

  const toggleStudentAssign = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const saveStudentAssignments = async () => {
    if (!assigningBatch?.id) return;
    const maxCapacity = Number(assigningBatch.max_students) || 30;
    if (selectedStudentIds.length > maxCapacity) {
      showModal(
        'Capacity Exceeded',
        `Cannot assign ${selectedStudentIds.length} students. Batch "${assigningBatch.name}" has a capacity limit of ${maxCapacity} students.`,
        'warning'
      );
      return;
    }

    try {
      await assignStudentsToBatch(assigningBatch.id, selectedStudentIds);
      setAssigningBatch(null);
      setSelectedStudentIds([]);
      showModal('Success', `Student assignments for batch "${assigningBatch.name}" updated successfully!`, 'success');
      fetchBatches();
      fetchStudents();
      fetchStats();
    } catch (error) {
      console.error('[Admin] saveStudentAssignments failed:', error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  /*
   * Students, courses, live classes, recordings and announcements all come
   * from the single `adminDashboardAll` query, so switching between those tabs
   * needs no extra reads. Only tabs backed by their own collections
   * (attendance, activity scores, admin profile) fetch on activation.
   *
   * Deliberately keyed on `activeTab` alone — including search/filter/page
   * state here made every keystroke invalidate the whole dataset.
   */
  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceHistory();
    } else if (activeTab === 'activity-score') {
      fetchActivityLogs();
      fetchActivityPresets();
    } else if (activeTab === 'settings') {
      fetchAdminProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'attendance') {
      if (attBatchId) {
        fetchAttendanceSheetByBatch(attBatchId, attendanceDate);
      } else {
        setAttendanceRecords([]);
      }
    }
  }, [attBatchId, attendanceDate, activeTab]);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };

  const fetchStats = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  /**
   * Refresh the student roster from Firestore.
   *
   * Search and filters are applied client-side over the already-loaded list
   * (see the `students` memo), so typing in the search box costs zero reads —
   * only an explicit refresh or a mutation re-hits the database.
   */
  const fetchStudents = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const fetchLiveClasses = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const fetchRecordedClasses = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const fetchAnnouncements = () => {
    queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
  };

  const toggleFees = async (studentId) => {
    try {
      const student = students.find(s => s.id === studentId);
      const isCurrentlyPaid = student?.feesStatus === 'Paid';
      const newStatus = isCurrentlyPaid ? 'Pending Payment' : 'Paid';
      const totalFee = Number(student?.feesTotal) > 0 ? Number(student.feesTotal) : 20000;
      
      const patch = {
        feesStatus: newStatus,
        feesPaidAmount: !isCurrentlyPaid ? totalFee : 0,
        feesRemainingAmount: !isCurrentlyPaid ? 0 : totalFee,
        feesPaymentDate: !isCurrentlyPaid ? new Date().toISOString().split('T')[0] : '',
      };

      await updateStudent(studentId, patch);
      fetchStudents();
      fetchStats();
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const toggleStatus = async (studentId) => {
    try {
      const studentObj = students.find(s => s.id === studentId);
      const newStatus = studentObj?.status === 'active' ? 'disabled' : 'active';
      await updateStudent(studentId, { status: newStatus });
      fetchStudents();
      fetchStats();
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  const deleteStudent = (studentId) => {
    setStudentToDelete(studentId);
  };

  const executeDeleteStudent = async () => {
    if (!studentToDelete || isDeletingStudent) return;
    setIsDeletingStudent(true);
    try {
      // 1. Unlink student from batch if assigned
      const studentObj = allStudents.find(s => s.id === studentToDelete);
      if (studentObj?.batch_id) {
        const batch = batches.find(b => b.id === studentObj.batch_id);
        if (batch && Array.isArray(batch.student_ids)) {
          const updatedStudentIds = batch.student_ids.filter(id => id !== studentToDelete);
          await assignStudentsToBatch(batch.id, updatedStudentIds).catch(err => console.warn('[Admin] Unlink batch failed:', err));
        }
      }

      // 2. Track deleted user reference so re-creation can re-link existing Firebase Auth UID
      if (studentObj) {
        const emailLower = studentObj.email?.trim().toLowerCase();
        const phoneAuthId = studentObj.phone ? mobileToAuthId(studentObj.phone) : null;
        const keysToSave = [
          emailLower,
          phoneAuthId
        ].filter(Boolean);

        for (const key of keysToSave) {
          const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
          await setDocument('deletedUsers', safeKey, {
            uid: studentToDelete,
            email: studentObj.email || '',
            phone: studentObj.phone || '',
            deletedAt: new Date().toISOString(),
          }).catch(err => console.warn('[Admin] Save deleted user ref failed:', err));
        }
      }

      // 3. Delete student document from database
      await deleteStudentDoc('students', studentToDelete);
      await deleteStudentDoc('users', studentToDelete).catch(() => {});

      // 3. Refresh students & stats
      fetchStudents();
      fetchStats();
      showModal('Deleted', 'Student record deleted successfully.', 'success');
    } catch (error) {
      console.error('[Admin] Delete student error:', error);
      const errInfo = classifyFirestoreError(error);
      showModal('Delete Failed', errInfo.message || 'Could not delete student record from Firestore.', 'error');
    } finally {
      setIsDeletingStudent(false);
      setStudentToDelete(null);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setStudentToDelete(null);
      }
    };
    if (studentToDelete) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [studentToDelete]);

  const fetchStudentSessions = async (studentId) => {
    try {
      setStudentSessions([]);
    } catch (e) {
      console.error("Error fetching sessions:", e);
    }
  };

  const revokeStudentSession = async (sessionId, studentId) => {
    showModal('Info', 'Session management is handled by Firebase Auth. Disable the student account to prevent access.', 'info');
  };

  const handleViewStudentDetails = (studentId) => {
    if (studentId) {
      navigate(`/admin/students/${studentId}`);
    }
  };


  const handleCreateStudentSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = createEmail.trim();
    const cleanPhone = createPhone ? normalizeMobile(createPhone) : '';

    let authEmail = cleanEmail;
    if (!authEmail && cleanPhone) {
      authEmail = mobileToAuthId(cleanPhone);
    }

    if (!createName || !authEmail || !createTempPassword) {
      showModal('Missing Fields', 'Name, a valid Email Address or Mobile Number, and a Temporary Password are required.', 'warning');
      return;
    }

    if (cleanEmail) {
      const existing = allStudents.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail.toLowerCase());
      if (existing) {
        showModal('Duplicate Account', `An account with email address "${cleanEmail}" already exists for student ${existing.name} (${existing.rollNumber || existing.id}). Duplicate accounts are not allowed for the same email address.`, 'warning');
        return;
      }
    }

    const strengthError = validatePasswordStrength(createTempPassword);
    if (strengthError) {
      showModal('Weak Password', strengthError, 'warning');
      return;
    }

    try {
      let targetUid;
      try {
        targetUid = await createAuthUserDetached(
          authEmail,
          createTempPassword
        );
      } catch (authErr) {
        if (authErr?.code === 'auth/email-already-in-use') {
          // Attempt to recover UID from deletedUsers tracking
          const emailLower = cleanEmail.toLowerCase();
          const authEmailLower = authEmail.toLowerCase();
          const lookupKeys = [
            authEmailLower,
            emailLower,
            cleanPhone ? mobileToAuthId(cleanPhone) : null
          ].filter(Boolean);

          for (const key of lookupKeys) {
            const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
            const deletedDoc = await getDocument('deletedUsers', safeKey).catch(() => null);
            if (deletedDoc && deletedDoc.uid) {
              targetUid = deletedDoc.uid;
              break;
            }
          }

          // Check if student profile exists in loaded list
          if (!targetUid) {
            const existingInList = allStudents.find(s => 
              s.email?.trim().toLowerCase() === emailLower || 
              (cleanPhone && s.phone === cleanPhone)
            );
            if (existingInList) targetUid = existingInList.id;
          }

          if (!targetUid) {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      const rollNumber = await generateNextId('student');
      const selectedBatch = batches.find(b => b.id === createBatchId);
      const vToken = generateVerificationToken();
      const vExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

      const studentPayload = {
        name: createName,
        email: cleanEmail || authEmail,
        phone: cleanPhone || '',
        course: createCourse,
        batch_id: createBatchId,
        batch_name: selectedBatch?.name || '',
        rollNumber,
        feesStatus: 'Pending Payment',
        feesTotal: 20000,
        feesPaidAmount: 0,
        feesRemainingAmount: 20000,
        status: 'Pending Email Verification',
        emailVerified: false,
        verificationStatus: 'Pending',
        emailDeliveryStatus: 'Pending',
        verificationToken: vToken,
        verificationTokenExpiresAt: vExpiresAt,
        role: 'student',
        mustChangePassword: true,
        createdBy: uid,
        dob: createDob || '',
        gender: createGender || '',
        city: createCity || '',
        location: createLocation || '',
        current_location: createLocation || '',
        guardian_name: createGuardianName || '',
        guardian_phone: createGuardianPhone || '',
      };

      await createStudent(targetUid, studentPayload);

      if (createBatchId && selectedBatch) {
        const currentStudentIds = Array.isArray(selectedBatch.student_ids) ? selectedBatch.student_ids : [];
        if (!currentStudentIds.includes(targetUid)) {
          const updatedStudentIds = [...currentStudentIds, targetUid];
          await assignStudentsToBatch(createBatchId, updatedStudentIds).catch(err => console.warn('[Admin] Auto-assign batch failed:', err));
        }
      }

      // Automatically send welcome email with activation link
      await sendTraineeWelcomeEmail({
        id: targetUid,
        ...studentPayload,
      }, createTempPassword).catch(err => console.warn('[Admin] Welcome email dispatch:', err));

      setCreatedCredentials({
        username: rollNumber,
        password: createTempPassword,
        name: createName,
        email: cleanEmail || authEmail,
        phone: createPhone ? normalizeMobile(createPhone) : '',
        course: createCourse || 'Fullstack Engineering',
        batch: selectedBatch?.name || '',
      });

      setCreateName(''); setCreateEmail(''); setCreatePhone('');
      setCreateCourse('Fullstack Engineering'); setCreateBatchId('');
      setCreateTempPassword('');
      setCreateDob(''); setCreateGender(''); setCreateCity('');
      setCreateLocation(''); setCreateGuardianName(''); setCreateGuardianPhone('');
      setShowCreateModal(false);
      fetchStudents(); fetchStats();
    } catch (e) {
      console.error('[Admin] create student failed:', e);
      const msg = e.code === 'auth/email-already-in-use'
        ? 'This email or mobile number is registered in Firebase Auth. The profile has been restored, or you can use their existing credentials to sign in.'
        : (describeAuthError(e) || 'Failed to create student account.');
      showModal(e.code === 'auth/email-already-in-use' ? 'Account Exists in Firebase Auth' : 'Error', msg, 'warning');
    }
  };

  const sendStudentWelcomeEmail = async (student, tempPasswordOverride = '') => {
    if (!student) return;
    const emailAddr = student.email;
    if (!emailAddr) {
      showModal("Warning", "No email address registered for this student.", "warning");
      return;
    }

    try {
      await sendTraineeWelcomeEmail(student, tempPasswordOverride);
      showModal("Welcome Email Dispatched", `Welcome email with activation link sent successfully to ${emailAddr}.`, "success");
      fetchStudents();
    } catch (err) {
      console.error('[Admin] Error sending welcome email:', err);
      showModal("Error", err.message || "Failed to send welcome email.", "error");
    }
  };

  /**
   * Password resets are a server-side operation.
   *
   * Sign-in identifiers are derived from the mobile number and are not real
   * mailboxes, so Firebase's "send reset email" flow has nowhere to deliver to.
   * Setting another user's password requires the Admin SDK, which must never be
   * exposed to the browser — so this explains the supported path rather than
   * pretending to do something.
   */
  const handleResetPassword = async (studentId) => {
    const studentObj = students.find(s => s.id === studentId);
    if (!studentObj) return;

    showModal(
      'Reset Password',
      `Students sign in with their mobile number, so password resets are performed by an administrator from a trusted machine:\n\n` +
      `python backend/reset_password.py --mobile ${studentObj.phone || '<mobile>'} --password "<new-temp-password>"\n\n` +
      `The student will be required to choose a new password the next time they sign in.`,
      'info'
    );
  };

  const [editPassword, setEditPassword] = useState('');

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setEditName(student.name || '');
    setEditEmail(student.email || '');
    setEditRollNumber(student.rollNumber || '');
    setEditPhone(student.phone || '');
    setEditPassword('');
    setEditCourse(student.course || 'Fullstack Engineering');
    setEditBatchId(student.batch_id || '');
    setEditCollege(student.college || 'Levlox Technical Institute');
    setEditProfilePic(student.profile_pic || '');
    setEditLocation(student.current_location || '');
    setEditAddress(student.permanent_address || '');
    setEditCompany(student.company || '');
    setEditAccountStatus(student.status || 'active');
    setEditFeesStatus(student.feesStatus || 'Pending Payment');
  };

  const saveStudentEdit = async (e) => {
    e.preventDefault();
    try {
      const selectedBatch = batches.find(b => b.id === editBatchId);
      const payload = {
        name: editName,
        email: editEmail,
        rollNumber: editRollNumber,
        phone: editPhone,
        course: editCourse,
        batch_id: editBatchId,
        batch_name: selectedBatch?.name || '',
        college: editCollege,
        profile_pic: editProfilePic,
        current_location: editLocation,
        permanent_address: editAddress,
        company: editCompany,
        status: editAccountStatus,
        feesStatus: editFeesStatus,
      };
      const oldBatchId = editingStudent?.batch_id;
      const newBatchId = editBatchId;
      await updateStudent(editingStudent.id, payload);

      if (oldBatchId !== newBatchId) {
        if (oldBatchId) {
          const oldBatch = batches.find(b => b.id === oldBatchId);
          if (oldBatch && Array.isArray(oldBatch.student_ids)) {
            const updatedIds = oldBatch.student_ids.filter(id => id !== editingStudent.id);
            await assignStudentsToBatch(oldBatchId, updatedIds).catch(err => console.warn('[Admin] Unlink old batch failed:', err));
          }
        }
        if (newBatchId) {
          const newBatch = batches.find(b => b.id === newBatchId);
          const currentIds = newBatch && Array.isArray(newBatch.student_ids) ? newBatch.student_ids : [];
          if (!currentIds.includes(editingStudent.id)) {
            const updatedIds = [...currentIds, editingStudent.id];
            await assignStudentsToBatch(newBatchId, updatedIds).catch(err => console.warn('[Admin] Link new batch failed:', err));
          }
        }
      }

      setEditingStudent(null);
      fetchStudents();
      fetchStats();
      showModal('Success', 'Student profile updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleEditFeesClick = (student) => {
    setEditingFeesStudent(student);
    setEditTotal(student.feesTotal || 20000);
    setEditPaid(student.feesPaidAmount || 0);
    setEditStatus(student.feesStatus || 'Pending Payment');
    setEditPayDate(student.feesPaymentDate || '');
  };

  const saveFeesEdit = async (e) => {
    e.preventDefault();
    try {
      const totalNum = Number(editTotal) || 0;
      const paidNum = Number(editPaid) || 0;
      const remNum = Math.max(0, totalNum - paidNum);

      await updateStudent(editingFeesStudent.id, {
        feesTotal: totalNum,
        feesPaidAmount: paidNum,
        feesRemainingAmount: remNum,
        feesStatus: editStatus,
        feesPaymentDate: editPayDate,
      });
      setEditingFeesStudent(null);
      fetchStudents();
      fetchStats();
      showModal('Success', 'Fees updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleCourseChange = (e) => {
    const newCourse = e.target.value;
    setAttCourse(newCourse);
    setAttBatchId('');
    setAttendanceRecords([]);
  };

  const handleBatchChange = (e) => {
    const newBatchId = e.target.value;
    setAttBatchId(newBatchId);
    setAttendancePage(1);
    if (newBatchId) {
      fetchAttendanceSheetByBatch(newBatchId, attendanceDate);
    } else {
      setAttendanceRecords([]);
    }
  };

  const fetchAttendanceSheetByBatch = async (batchId, dateVal) => {
    if (!batchId) {
      setAttendanceRecords([]);
      return;
    }
    setLoading(true);
    try {
      const records = await getAttendanceByBatchAndDate(batchId, dateVal);
      // Fetch assigned students for the batch
      let batchStudents = await getStudentsByBatch(batchId).catch(() => []);
      
      const batchObj = batches.find(b => b.id === batchId || b.code === batchId || b.batchId === batchId);
      const bCode = batchObj?.code || batchObj?.batchId;
      const bName = batchObj?.name;
      const sIds = Array.isArray(batchObj?.student_ids) ? batchObj.student_ids : [];

      if (!batchStudents || batchStudents.length === 0) {
        batchStudents = students.filter(s => {
          const sBId = s.batch_id || s.batchId;
          if (sBId && sBId === batchId) return true;
          if (bCode && sBId && sBId === bCode) return true;
          if (bName && (s.batch_name === bName || s.batchName === bName)) return true;
          if (sIds.includes(s.id) || sIds.includes(s.uid)) return true;
          return false;
        });
      }

      const recordMap = {};
      records.forEach(r => {
        const sId = r.studentId || r.student_id;
        if (sId) recordMap[sId] = r;
      });

      const mergedSheet = batchStudents.map(s => {
        const sId = s.id || s.uid;
        const existing = recordMap[sId];
        return {
          id: existing ? existing.id : `${batchId}_${dateVal}_${sId}`,
          studentId: sId,
          student_id: sId,
          studentName: s.name || s.fullName || 'Student',
          student_name: s.name || s.fullName || 'Student',
          rollNumber: s.rollNumber || s.studentId || sId || 'N/A',
          phone: s.phone || s.mobile || '',
          course: s.course_name || s.courseName || s.course || attCourse || '',
          batch_id: batchId,
          batchId: batchId,
          date: dateVal,
          status: existing ? (existing.status || 'Not Marked') : 'Not Marked',
          isExisting: !!existing,
          attendedLive: Boolean(existing?.attendedLive || existing?.attendance_mode === 'Auto'),
          marked_by: existing?.marked_by || '',
          marked_time: existing?.marked_time || '',
          attendance_mode: existing?.attendance_mode || (existing?.attendedLive ? 'Auto' : existing ? 'Manual' : ''),
          liveClassTitle: existing?.liveClassTitle || '',
        };
      });

      setAttendanceRecords(mergedSheet);
    } catch (error) {
      console.error('[Admin] fetchAttendanceSheetByBatch failed:', error);
      setAttendanceRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const { orderBy } = await import('firebase/firestore');
      const { getDocuments } = await import('../services/firebaseService');
      
      // Try attendanceSheets first
      const sheets = await getDocuments('attendanceSheets', [orderBy('date', 'desc')]).catch(() => []);
      if (sheets.length > 0) {
        setAttSheetsHistory(sheets.map(s => ({
          ...s,
          batch_id: s.batch_id || s.batchId,
          batch_name: s.batch_name || s.batchName || 'Batch',
          course_name: s.course_name || s.courseName || '',
          present_count: s.present_count ?? s.presentCount ?? 0,
          absent_count: s.absent_count ?? s.absentCount ?? 0,
          attendance_percentage: s.attendance_percentage ?? s.attendancePercentage ?? 0,
        })));
        return;
      }

      // Fallback grouping directly from attendance collection
      const rawAttendance = await getDocuments('attendance', [orderBy('date', 'desc')]).catch(() => []);
      const grouped = {};
      rawAttendance.forEach(r => {
        const bId = r.batch_id || r.batchId;
        const key = `${bId}_${r.date}`;
        if (!grouped[key]) {
          const batchObj = batches.find(b => b.id === bId);
          grouped[key] = {
            id: key,
            batch_id: bId,
            batchId: bId,
            batch_name: r.batch_name || r.batchName || batchObj?.name || 'Batch',
            course_name: r.course || r.course_name || r.courseName || batchObj?.course_name || '',
            date: r.date,
            present_count: 0,
            absent_count: 0,
            total_students: 0,
            records: [],
          };
        }
        grouped[key].records.push(r);
        grouped[key].total_students += 1;
        const st = (r.status || '').toLowerCase();
        if (st === 'present') grouped[key].present_count += 1;
        else if (st === 'absent') grouped[key].absent_count += 1;
      });

      const historySheets = Object.values(grouped).map(g => {
        const pct = g.total_students > 0 ? Math.round((g.present_count / g.total_students) * 100) : 0;
        return {
          ...g,
          attendance_percentage: pct,
        };
      });

      setAttSheetsHistory(historySheets);
    } catch (error) {
      console.error('[Admin] fetchAttendanceHistory failed:', error);
    }
  };

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceRecords(prev => 
      prev.map(r => (r.student_id === studentId || r.studentId === studentId) ? { ...r, status: newStatus } : r)
    );
  };

  const saveAttendanceSheet = async () => {
    if (!attBatchId) {
      showModal('Warning', 'Please select a batch to mark attendance.', 'warning');
      return;
    }
    if (!attendanceRecords || attendanceRecords.length === 0) {
      showModal('Warning', 'No students assigned to this batch yet.', 'warning');
      return;
    }

    try {
      const selectedBatchObj = batches.find(b => b.id === attBatchId || b.code === attBatchId);
      const batchNameVal = selectedBatchObj?.name || 'Batch';
      const courseNameVal = selectedBatchObj?.course_name || attCourse || '';

      const recordsToSave = attendanceRecords.map(r => {
        const isAuto = Boolean(r.attendedLive) && r.status === 'Present';
        return {
          studentId: r.studentId || r.student_id,
          studentName: r.studentName || r.student_name || r.name,
          rollNumber: r.rollNumber || r.studentIdNumber || 'N/A',
          status: r.status || 'Not Marked',
          course: courseNameVal,
          attendedLive: isAuto,
          liveClassTitle: r.liveClassTitle || '',
          marked_by: isAuto ? (r.marked_by || 'Auto-Attendance (Live Class)') : 'Admin (Manual)',
          attendance_mode: isAuto ? 'Auto' : 'Manual',
          marked_time: isAuto ? r.marked_time : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
      });

      await saveBatchAttendance(attBatchId, attendanceDate, recordsToSave, {
        batchName: batchNameVal,
        courseName: courseNameVal,
        markedBy: 'Admin (Manual)',
      });

      // Sync individual student overall stats
      await Promise.all(recordsToSave.map(async (r) => {
        try {
          const sid = r.studentId;
          const allStudentAtt = await getAttendanceForStudent(sid);
          const presentCount = allStudentAtt.filter(rec => (rec.status || '').toLowerCase() === 'present').length;
          const totalDaysCount = allStudentAtt.length;
          const absentCount = totalDaysCount - presentCount;
          const pct = totalDaysCount > 0 ? Math.round((presentCount / totalDaysCount) * 100) : 0;

          await updateStudent(sid, {
            attendance: {
              present: presentCount,
              absent: absentCount,
              total_days: totalDaysCount,
              percentage: pct,
            }
          });
        } catch (syncErr) {
          console.warn('[Admin] Sync student attendance stats warning:', syncErr);
        }
      }));

      showModal('Success', 'Attendance saved successfully to Firestore!', 'success');
      fetchAttendanceHistory();
      fetchAttendanceSheetByBatch(attBatchId, attendanceDate);
      fetchStats();
    } catch (error) {
      console.error('[Admin] saveAttendanceSheet error:', error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };


  const exportAttendanceCSV = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return;
    const headers = ['Roll Number', 'Student Name', 'Mobile', 'Course', 'Batch', 'Attendance Status'];
    const rows = attendanceRecords.map(r => [
      `"${r.rollNumber || ''}"`,
      `"${r.student_name || ''}"`,
      `"${r.phone || ''}"`,
      `"${r.course || ''}"`,
      `"${r.batch_name || ''}"`,
      `"${r.status || 'Present'}"`
    ]);
    const content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${attBatchId || 'batch'}_${attendanceDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendanceSheetToExcel = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return;
    const headers = ['Roll Number', 'Student Name', 'Mobile', 'Course', 'Batch', 'Attendance Status'];
    const rows = attendanceRecords.map(r => [
      r.rollNumber || '',
      r.student_name || '',
      r.phone || '',
      r.course || '',
      r.batch_name || '',
      r.status || 'Present'
    ]);
    const content = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${attBatchId || 'batch'}_${attendanceDate}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAttendanceSheetToPDF = () => {
    if (!attendanceRecords || attendanceRecords.length === 0) return;
    const printWindow = window.open('', '_blank');
    let rowsHtml = '';
    attendanceRecords.forEach(r => {
      rowsHtml += `
        <tr>
          <td>${r.rollNumber || ''}</td>
          <td>${r.student_name || ''}</td>
          <td>${r.phone || ''}</td>
          <td>${r.course || ''}</td>
          <td>${r.batch_name || ''}</td>
          <td>${r.status || 'Present'}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Sheet - ${attendanceDate}</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6C3CF0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Attendance Sheet - ${attendanceDate}</h1>
          <p>Batch: ${attendanceRecords[0]?.batch_name || 'N/A'}</p>
          <table>
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Student Name</th>
                <th>Mobile</th>
                <th>Course</th>
                <th>Batch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEditHistoryRecord = (record) => {
    const batchObj = batches.find(b => b.id === record.batch_id || b.name === record.batch_name);
    if (batchObj) {
      setAttCourse(batchObj.course_name);
      setAttBatchId(batchObj.id);
    }
    setAttendanceDate(record.date);
    setAttendancePage(1);
  };

  const addLiveClassHandler = async (e) => {
    e.preventDefault();
    try {
      const targetBatch = batches.find(b => b.id === selectedBatchId);
      const liveRef = await addLiveClass({
        title: liveTitle,
        instructor: liveInstructor,
        meet_link: liveUrl,
        meetLink: liveUrl,
        date: liveDate,
        time: liveTime,
        description: liveDescription,
        status: liveStatus,
        is_today: liveToday,
        is_published: livePublished,
        batch_id: selectedBatchId || null,
        batch_name: targetBatch?.name || '',
      });

      // Try broadcasting notification to enrolled students
      try {
        const { notifyLiveClass } = await import('../services/apiService');
        await notifyLiveClass({
          classId: liveRef?.id || null,
          batchId: selectedBatchId,
          batchName: targetBatch?.name || '',
          title: liveTitle,
          date: liveDate,
          time: liveTime,
          meetLink: liveUrl,
        });
      } catch (notifErr) {
        console.warn('[Admin] Live class notification skipped:', notifErr.message);
      }

      setLiveTitle(''); setLiveInstructor(''); setLiveDate('');
      setLiveTime(''); setLiveUrl(''); setLiveDescription('');
      setLiveStatus('Upcoming'); setLiveToday(false);
      setLivePublished(true); setSelectedBatchId('');
      setShowLiveClassModal(false);
      fetchLiveClasses(); fetchStats();
      showModal('Success', 'Live class scheduled successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleEditLiveClick = (item) => {
    setEditingLiveClass(item);
    setEditLiveTitle(item.title || '');
    setEditLiveInstructor(item.instructor || '');
    setEditLiveMeetLink(item.meet_link || item.meetLink || item.join_url || item.meetingLink || '');
    setEditLiveBatchId(item.batch_id || '');
    setEditLiveDate(item.date || '');
    setEditLiveTime(item.time || '');
    setEditLiveDescription(item.description || '');
    setEditLiveStatus(item.status || 'Upcoming');
    setEditLiveToday(item.is_today || false);
    setEditLivePublished(item.is_published !== false);
  };

  const saveLiveClassEdit = async (e) => {
    e.preventDefault();
    try {
      const targetBatch = batches.find(b => b.id === editLiveBatchId);
      await updateLiveClass(editingLiveClass.id, {
        title: editLiveTitle,
        instructor: editLiveInstructor,
        meet_link: editLiveMeetLink,
        meetLink: editLiveMeetLink,
        batch_id: editLiveBatchId || null,
        batch_name: targetBatch?.name || '',
        date: editLiveDate,
        time: editLiveTime,
        description: editLiveDescription,
        status: editLiveStatus,
        is_today: editLiveToday,
        is_published: editLivePublished,
      });
      setEditingLiveClass(null);
      fetchLiveClasses();
      showModal('Success', 'Live class updated successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const deleteLiveClassHandler = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this live class session?')) return;
    try {
      await deleteLiveClass(id);
      fetchLiveClasses();
      fetchStats();
      showModal('Deleted', 'Live class deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleEndLiveClass = async (id) => {
    if (!id) return;
    try {
      await updateLiveClass(id, { status: 'Completed', updatedAt: new Date().toISOString() });
      fetchLiveClasses();
      fetchStats();
      showModal('Class Ended', 'Live session marked as Completed. It has been removed from student views.', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleFileUpload = async (file) => {
    // Upload to Firebase Storage
    try {
      const { uploadFile } = await import('../services/firebaseService');
      const ext = file.name.split('.').pop();
      const path = `uploads/${Date.now()}_${file.name}`;
      const url = await uploadFile(path, file, { contentType: file.type });
      return { url };
    } catch (e) {
      console.error(e);
      showModal('Upload Error', 'Failed to upload file to storage.', 'error');
      return null;
    }
  };

  const addRecordedClassHandler = async (e) => {
    e.preventDefault();
    const isEditing = !!editingRecordedClass;
    const isDrive = Boolean(getGoogleDriveFileId(recVideoUrl));
    const finalThumbnail = recThumbnailUrl || getResolvedThumbnail(recVideoUrl, recThumbnailUrl);
    let targetPlaylistId = selectedBatchId;
    let targetPlaylistName = '';
    let targetBatchId = '';
    let targetBatchName = '';
    let finalCourseTitle = recCourseTitle;

    if (String(selectedBatchId).startsWith('playlist:')) {
      const plId = selectedBatchId.replace('playlist:', '');
      const plObj = customPlaylists.find(p => p.id === plId || p.uid === plId);
      targetPlaylistId = plId;
      targetPlaylistName = plObj?.name || 'Custom Playlist';
      targetBatchId = plObj?.batch_id || '';
      targetBatchName = plObj?.batch_name || '';
      finalCourseTitle = plObj?.course_name || recCourseTitle || 'General Curriculum';
    } else {
      const rawBId = String(selectedBatchId).replace('batch:', '');
      const foundBatch = batches.find(b => b.id === rawBId || b.uid === rawBId);
      targetPlaylistId = rawBId;
      targetPlaylistName = foundBatch ? `Batch: ${foundBatch.name}` : 'Batch Playlist';
      targetBatchId = rawBId;
      targetBatchName = foundBatch?.name || '';
      finalCourseTitle = recCourseTitle || foundBatch?.course_name || 'General Course';
    }

    const payload = {
      title: recTitle,
      module: recModule,
      video_url: recVideoUrl,
      thumbnail: finalThumbnail,
      description: recLessonDescription,
      notes_url: recNotesUrl,
      assignment: recAssignment,
      visibility: recVisibility,
      course_title: finalCourseTitle,
      playlist_id: targetPlaylistId,
      playlist_name: targetPlaylistName,
      batch_id: targetBatchId,
      batch_name: targetBatchName,
      batchId: targetBatchId,
      batchName: targetBatchName,
      sort_order: recSortOrder ? parseInt(recSortOrder) : 999,
      duration: recDuration || '1h 30m',
      video_source_type: isDrive ? 'drive' : videoSourceType,
      study_materials: recStudyMaterials,
    };
    try {
      const recId = editingRecordedClass?.id || editingRecordedClass?.uid || editingRecordedClass?._id;
      if (isEditing && recId) {
        await updateRecordedClass(recId, payload);
      } else {
        await addRecordedClass(payload);
      }
      setRecTitle(''); setRecModule('Module 1 - Python Basics'); setRecVideoUrl('');
      setRecThumbnailUrl(''); setRecLessonDescription(''); setRecNotesUrl('');
      setRecAssignment(''); setRecVisibility('everyone'); setRecSortOrder('');
      setRecDuration('1h 30m'); setVideoSourceType('link'); setRecStudyMaterials([]);
      setEditingRecordedClass(null);
      setShowRecordedClassModal(false);
      await refetchAdminData();
      fetchRecordedClasses(); 
      fetchStats();
      showModal('Success', isEditing ? 'Lesson updated successfully!' : 'New LMS Lesson posted successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const handleSavePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistFormName.trim()) {
      showModal('Validation Error', 'Playlist name is required.', 'error');
      return;
    }
    const isEditing = !!editingPlaylist;
    const targetBatch = batches.find(b => b.id === playlistFormBatchId);
    const payload = {
      name: playlistFormName.trim(),
      course_name: playlistFormCourse.trim() || 'General Curriculum',
      description: playlistFormDescription.trim(),
      thumbnail: playlistFormThumbnail.trim(),
      access_type: playlistFormAccess,
      batch_id: playlistFormAccess === 'batch' ? playlistFormBatchId : '',
      batch_name: playlistFormAccess === 'batch' ? (targetBatch?.name || '') : 'All Students',
      batch_code: playlistFormAccess === 'batch' ? (targetBatch?.code || targetBatch?.batchId || '') : '',
      created_by: 'Admin',
      updatedAt: new Date().toISOString(),
    };
    try {
      if (isEditing) {
        await updatePlaylist(editingPlaylist.id || editingPlaylist.uid, payload);
      } else {
        payload.createdAt = new Date().toISOString();
        await addPlaylist(payload);
      }
      setShowPlaylistModal(false);
      setEditingPlaylist(null);
      setPlaylistFormName('');
      setPlaylistFormCourse('');
      setPlaylistFormDescription('');
      setPlaylistFormThumbnail('');
      setPlaylistThumbnailType('url');
      setPlaylistFormAccess('all');
      setPlaylistFormBatchId('');
      await refetchAdminData();
      showModal('Success', isEditing ? 'Playlist updated successfully!' : 'New playlist created successfully!', 'success');
    } catch (err) {
      console.error(err);
      showModal('Error', classifyFirestoreError(err).message, 'error');
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!playlistId) return;
    if (!window.confirm('Are you sure you want to permanently delete this custom playlist? It will be removed for all students.')) return;
    try {
      await deletePlaylist(playlistId);
      // Unlink any recorded classes attached to this playlist
      const linkedRecordings = (recordedClasses || []).filter(r => String(r.playlist_id) === String(playlistId));
      for (const rec of linkedRecordings) {
        await updateRecordedClass(rec.id || rec.uid, { playlist_id: '', playlist_name: '' }).catch(() => {});
      }
      if (selectedPlaylistBatch?.id === playlistId || selectedPlaylistBatch?.uid === playlistId) {
        setSelectedPlaylistBatch(null);
      }
      setShowPlaylistModal(false);
      setEditingPlaylist(null);
      await refetchAdminData();
      showModal('Deleted', 'Playlist deleted successfully.', 'success');
    } catch (err) {
      console.error(err);
      showModal('Error', classifyFirestoreError(err).message, 'error');
    }
  };

  const toggleRecordedClassVisibility = async (id, currentVisibility) => {
    if (!id) return;
    const newVisibility = currentVisibility === 'everyone' ? 'paid' : 'everyone';
    try {
      await updateRecordedClass(id, { visibility: newVisibility });
      await refetchAdminData();
      fetchRecordedClasses();
      showModal('Success', `Visibility changed to: ${newVisibility === 'everyone' ? 'Everyone' : 'Paid Students Only'}`, 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const deleteRecordedClassHandler = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to permanently delete this recorded class lesson?")) return;
    try {
      await deleteRecordedClass(id);
      await refetchAdminData();
      fetchRecordedClasses(); 
      fetchStats();
      showModal('Deleted', 'Recorded class deleted successfully.', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const addAnnouncementHandler = async (e) => {
    e.preventDefault();
    setAnnUploading(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      if (annFile) {
        const uploaded = await uploadUniversalFile(annFile, 'announcements');
        attachmentUrl = uploaded.url;
        attachmentName = uploaded.originalName || annFile.name;
      }

      await addAnnouncement({
        title: annTitle,
        content: annContent,
        priority: annPriority,
        is_pinned: annPinned,
        batch_id: selectedBatchId,
        attachmentUrl,
        attachmentName,
        date: new Date().toLocaleDateString('en-IN'),
      });
      setAnnTitle(''); setAnnContent(''); setAnnPriority('Medium'); setAnnPinned(false); setAnnFile(null);
      setShowAnnouncementModal(false);
      fetchAnnouncements();
      showModal('Success', 'Announcement & notifications published successfully!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    } finally {
      setAnnUploading(false);
    }
  };

  const handleEditAnnClick = (item) => {
    setEditingAnnouncement(item);
    setEditAnnTitle(item.title);
    setEditAnnContent(item.content);
    setEditAnnPriority(item.priority || 'Medium');
    setEditAnnPinned(item.is_pinned || false);
  };

  const saveAnnouncementEdit = async (e) => {
    e.preventDefault();
    try {
      await updateAnnouncement(editingAnnouncement.id, {
        title: editAnnTitle,
        content: editAnnContent,
        priority: editAnnPriority,
        is_pinned: editAnnPinned,
      });
      setEditingAnnouncement(null);
      fetchAnnouncements();
      showModal('Success', 'Announcement updated!', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  const deleteAnnouncementHandler = async (id) => {
    try {
      await deleteAnnouncement(id);
      fetchAnnouncements();
      showModal('Deleted', 'Announcement deleted.', 'success');
    } catch (error) {
      console.error(error);
      showModal('Error', classifyFirestoreError(error).message, 'error');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Backdrop */}
      <div className={`sidebar-backdrop ${mobileMenuOpen ? 'show' : ''}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Collapsible Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Levlox Nova Signature Brand Card */}
        <div className="srms-sidebar-brand" style={{
          margin: sidebarCollapsed ? '10px 4px 16px' : '10px 14px 16px',
          padding: sidebarCollapsed ? '12px 6px' : '16px 14px',
          position: 'relative'
        }}>
          <div className="srms-sidebar-brand-icon" style={{ background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src={levloxLogo} alt="Levlox" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!sidebarCollapsed && (
            <>
              <h2 className="srms-sidebar-brand-title">
                LEVLOX <span style={{ fontSize: 10, background: 'linear-gradient(135deg, #4568F5, #8B5CF6)', color: '#FFFFFF', padding: '2px 7px', borderRadius: 999, letterSpacing: 0.8, fontWeight: 800 }}>COMMAND</span>
              </h2>
              <span className="srms-sidebar-brand-sub">Admin Operations Center</span>
            </>
          )}
          <button 
            className="sidebar-toggle-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255, 255, 255, 0.18)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Toggle Sidebar"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="sidebar-menu" style={{ overflowY: 'auto' }}>
          <span className="sidebar-section-label">Main Menu</span>
          <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}>
            <Clock size={18} />
            <span className="sidebar-link-text">Dashboard</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => { setActiveTab('students'); setCurrentPage(1); setMobileMenuOpen(false); }}>
            <Users size={18} />
            <span className="sidebar-link-text">Students</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => { setActiveTab('batches'); fetchBatches(); setMobileMenuOpen(false); }}>
            <GraduationCap size={18} />
            <span className="sidebar-link-text">Batch Management</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'live-classes' ? 'active' : ''}`} onClick={() => { setActiveTab('live-classes'); setMobileMenuOpen(false); }}>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <Video size={18} />
              {hasUpcomingLiveClasses && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -3,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: '#EF4444',
                  boxShadow: '0 0 8px #EF4444',
                  animation: 'pulse-dot 1.5s infinite'
                }} />
              )}
            </div>
            <span className="sidebar-link-text" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              Live Classes
              {hasUpcomingLiveClasses && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.15)', padding: '2px 7px', borderRadius: 12 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'pulse-dot 1.5s infinite' }} />
                  LIVE
                </span>
              )}
            </span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => { setActiveTab('attendance'); setCurrentPage(1); setMobileMenuOpen(false); }}>
            <Percent size={18} />
            <span className="sidebar-link-text">Attendance</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'recorded-classes' ? 'active' : ''}`} onClick={() => { setActiveTab('recorded-classes'); setMobileMenuOpen(false); }}>
            <PlayCircle size={18} />
            <span className="sidebar-link-text">Recorded Classes</span>
          </button>

          
          <button className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => { setActiveTab('announcements'); setMobileMenuOpen(false); }}>
            <Megaphone size={18} />
            <span className="sidebar-link-text">Announcements</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => { setActiveTab('assignments'); setMobileMenuOpen(false); }}>
            <FileText size={18} />
            <span className="sidebar-link-text">Assignments</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'fees-management' ? 'active' : ''}`} onClick={() => { setActiveTab('fees-management'); setCurrentPage(1); setMobileMenuOpen(false); }}>
            <Wallet size={18} />
            <span className="sidebar-link-text">Fees Management</span>
          </button>
          
          <button className={`sidebar-link ${activeTab === 'activity-score' ? 'active' : ''}`} onClick={() => { setActiveTab('activity-score'); setMobileMenuOpen(false); }}>
            <Trophy size={18} />
            <span className="sidebar-link-text">Activity Scores</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'trainer-management' ? 'active' : ''}`} onClick={() => { setActiveTab('trainer-management'); setMobileMenuOpen(false); }}>
            <Users size={18} />
            <span className="sidebar-link-text">Trainer Management</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'master-data' ? 'active' : ''}`} onClick={() => { setActiveTab('master-data'); setMobileMenuOpen(false); }}>
            <Shield size={18} />
            <span className="sidebar-link-text">Master Data</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => { setActiveTab('settings'); setMobileMenuOpen(false); }}>
            <Settings size={18} />
            <span className="sidebar-link-text">Settings</span>
          </button>

        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-section-label">Account</span>
          <button className="sidebar-link" onClick={handleLogout} style={{ color: 'rgba(239,68,68,0.7)' }}>
            <LogOut size={20} strokeWidth={1.75} style={{ color: 'rgba(239,68,68,0.7)' }} />
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        
        {/* Top Navbar */}
        <header className="top-navbar">
          <button className="drawer-toggle-btn" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={22} strokeWidth={1.75} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={levloxLogo} alt="Levlox Logo" style={{ height: '38px', width: '38px', objectFit: 'contain', borderRadius: '50%' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', lineHeight: 1 }}>Levlox</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#6B7280', lineHeight: 1 }}>Admin Portal</span>
            </div>
          </div>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NotificationBell userId={currentUser?.uid || uid} userRole="admin" />
            <div className="user-profile-badge">
              <div className="avatar">{user.name ? user.name[0].toUpperCase() : 'A'}</div>
              <div className="profile-info">
                <span className="profile-name">{user.name}</span>
                <span className="profile-role">Portal Administrator</span>
              </div>
            </div>
          </div>
        </header>



        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            {/* Top Statistics Row (4 Cards) */}
            <div className="stats-grid-premium" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              
              {/* Card 1: Total Students */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', borderRadius: '12px' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Students</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(108, 60, 240, 0.08)', color: '#6C3CF0', padding: '6px', borderRadius: '6px' }}>
                    <Users size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0' }}>{stats.totalStudents}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Registered Learners</span>
                </div>
              </div>

              {/* Card 2: Total Batches */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', borderRadius: '12px' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Total Batches</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(108, 60, 240, 0.08)', color: '#6C3CF0', padding: '6px', borderRadius: '6px' }}>
                    <GraduationCap size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0' }}>{stats.totalBatches}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total batches created</span>
                </div>
              </div>

              {/* Card 3: Fees Collected */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', borderRadius: '12px' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Fees Collected</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success-color)', padding: '6px', borderRadius: '6px' }}>
                    <WalletIcon size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '22px', fontWeight: '800', margin: '4px 0' }}>{formatCurrency(stats.feesCollected || 0)}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total Received</span>
                </div>
              </div>

              {/* Card 4: Pending Payments */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px', borderRadius: '12px' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>Pending Payments</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', padding: '6px', borderRadius: '6px' }}>
                    <Clock3 size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '24px', fontWeight: '800', margin: '4px 0' }}>{stats.pendingPaymentsCount}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '10.5px', color: 'var(--danger-color)', fontWeight: '600' }}>
                    Dues: {formatCurrency(stats.pendingAmount || 0)}
                  </span>
                </div>
              </div>

            </div>

            {/* Rearranged Content Grid (2 Columns) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Section 1: Recent Student Registrations */}
                <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 className="section-title-premium" style={{ marginBottom: '16px', fontSize: '15px' }}>
                    <Users size={18} style={{ color: 'var(--primary-color)' }} />
                    Recent Student Registrations
                  </h3>
                  <div className="table-container-premium" style={{ border: 'none', background: 'transparent' }}>
                    <table className="table-premium" style={{ width: '100%' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px', fontSize: '11px' }}>Learner</th>
                          <th style={{ padding: '8px', fontSize: '11px' }}>Course</th>
                          <th style={{ padding: '8px', fontSize: '11px' }}>Batch</th>
                          <th style={{ padding: '8px', fontSize: '11px' }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentStudents && stats.recentStudents.length > 0 ? (
                          stats.recentStudents.map((student) => {
                            const initials = student.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                            return (
                              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => handleViewStudentDetails(student.id)}>
                                <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                                    {(student.profile_pic || student.profilePhotoUrl) ? (
                                      <img src={student.profile_pic || student.profilePhotoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{initials}</span>
                                    )}
                                  </div>
                                  <span style={{ fontWeight: '600', fontSize: '13px' }}>{student.name}</span>
                                </td>
                                <td style={{ padding: '8px', fontSize: '12px' }}>{student.course}</td>
                                <td style={{ padding: '8px', fontSize: '12px' }}>{student.batch_name}</td>
                                <td style={{ padding: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>{student.join_date}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>No student records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Fee Collection Overview */}
                <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h3 className="section-title-premium" style={{ marginBottom: '16px', fontSize: '15px' }}>
                    <WalletIcon size={18} style={{ color: 'var(--primary-color)' }} />
                    Fee Collection Overview
                  </h3>
                  {stats.feeOverview ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Total Collection</span>
                          <strong style={{ fontSize: '18px', color: 'var(--success-color)' }}>{formatCurrency(stats.feeOverview.totalCollected || 0)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Pending Amount</span>
                          <strong style={{ fontSize: '18px', color: 'var(--danger-color)' }}>{formatCurrency(stats.feeOverview.pendingAmount || 0)}</strong>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Paid Students</span>
                          <strong>{stats.feeOverview.paidStudents} students</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Pending Students</span>
                          <strong>{stats.feeOverview.pendingStudentsCount} students</strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No ledger summary found.</div>
                  )}
                </div>

              </div>
              
              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Section 3: Recent Announcements */}
                <div className="dashboard-card-section">
                  <h3 className="section-title-premium" style={{ marginBottom: '16px', fontSize: '15px' }}>
                    <Megaphone size={18} style={{ color: 'var(--primary-color)' }} />
                    Recent Announcements
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {stats.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
                      stats.recentAnnouncements.map((item) => (
                        <div key={item.id} style={{ padding: '10px 12px', background: '#fafafd', borderRadius: '8px', borderLeft: item.is_pinned ? '3px solid var(--primary-color)' : '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{item.title}</strong>
                              {item.is_pinned && <span style={{ fontSize: '9px', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '1px 4px', borderRadius: '4px' }}>Pinned</span>}
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{item.date}</span>
                          </div>
                          <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{item.content}</p>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No announcements published.</div>
                    )}
                  </div>
                </div>

                {/* Section 4: Recent Activity Timeline */}
                <div className="dashboard-card-section">
                  <h3 className="section-title-premium" style={{ marginBottom: '18px', fontSize: '15px' }}>
                    <Clock size={18} style={{ color: 'var(--primary-color)' }} />
                    Recent Activity Timeline
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border-color)' }}>
                    {stats.recentActivity && stats.recentActivity.length > 0 ? (
                      stats.recentActivity.map((act, index) => {
                        let dotColor = 'var(--primary-color)';
                        if (act.type === 'fee') dotColor = 'var(--success-color)';
                        if (act.type === 'recording') dotColor = 'var(--success-color)';
                        if (act.type === 'notes') dotColor = '#3B82F6';
                        if (act.type === 'class') dotColor = 'var(--danger-color)';
                        if (act.type === 'announcement') dotColor = '#F59E0B';
                        if (act.type === 'attendance') dotColor = 'var(--primary-color)';

                        return (
                          <div key={index} style={{ position: 'relative' }}>
                            {/* Timeline point dot */}
                            <div style={{ position: 'absolute', left: '-27px', top: '4px', width: '12px', height: '12px', borderRadius: '50%', background: dotColor, border: '2.5px solid white', boxShadow: '0 0 0 1px var(--border-color)' }} />
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                              <span style={{ fontSize: '13.5px', color: 'var(--text-primary)', fontWeight: '500' }}>{act.message}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: '500' }}>{act.date}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ padding: '10px 0', color: 'var(--text-secondary)', fontSize: '13px' }}>No recorded events in system activity.</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Batches Management Tab */}
        {activeTab === 'batches' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
            
            {/* Top Stat Cards for Batches */}
            <div className="batch-stats-grid">
              <div className="batch-stat-card">
                <div className="batch-stat-icon-wrapper" style={{ background: '#ECFDF5', color: '#10B981' }}>
                  <Timer size={24} />
                </div>
                <div className="batch-stat-info">
                  <span className="batch-stat-label">Active Batches</span>
                  <span className="batch-stat-value">{batchStats.active}</span>
                  <span className="batch-stat-subtext">Currently within running duration</span>
                </div>
              </div>

              <div className="batch-stat-card">
                <div className="batch-stat-icon-wrapper" style={{ background: '#FFFBEB', color: '#F59E0B' }}>
                  <History size={24} />
                </div>
                <div className="batch-stat-info">
                  <span className="batch-stat-label">Needs Extension / Ended</span>
                  <span className="batch-stat-value">{batchStats.completed}</span>
                  <span className="batch-stat-subtext">Completed duration • Ready to extend</span>
                </div>
              </div>

              <div className="batch-stat-card">
                <div className="batch-stat-icon-wrapper" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                  <Calendar size={24} />
                </div>
                <div className="batch-stat-info">
                  <span className="batch-stat-label">Upcoming Cohorts</span>
                  <span className="batch-stat-value">{batchStats.upcoming}</span>
                  <span className="batch-stat-subtext">Scheduled for future dates</span>
                </div>
              </div>

              <div className="batch-stat-card">
                <div className="batch-stat-icon-wrapper" style={{ background: '#F5F3FF', color: '#8B5CF6' }}>
                  <Users size={24} />
                </div>
                <div className="batch-stat-info">
                  <span className="batch-stat-label">Enrolled Students</span>
                  <span className="batch-stat-value">{batchStats.totalStudents}</span>
                  <span className="batch-stat-subtext">Across {batchStats.total} total batch cohorts</span>
                </div>
              </div>
            </div>

            {/* Lifecycle Filter Switcher Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div className="batch-lifecycle-tabs">
                <button
                  type="button"
                  className={`batch-lifecycle-tab ${batchLifecycleFilter === 'active_only' ? 'active' : ''}`}
                  onClick={() => { setBatchLifecycleFilter('active_only'); setBatchesPage(1); }}
                >
                  <Timer size={15} />
                  Active (Within Duration)
                  <span className="batch-tab-count">{batchStats.active}</span>
                </button>

                <button
                  type="button"
                  className={`batch-lifecycle-tab ${batchLifecycleFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => { setBatchLifecycleFilter('completed'); setBatchesPage(1); }}
                >
                  <History size={15} />
                  Duration Ended / Expired
                  <span className="batch-tab-count">{batchStats.completed}</span>
                </button>

                <button
                  type="button"
                  className={`batch-lifecycle-tab ${batchLifecycleFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => { setBatchLifecycleFilter('upcoming'); setBatchesPage(1); }}
                >
                  <Calendar size={15} />
                  Upcoming
                  <span className="batch-tab-count">{batchStats.upcoming}</span>
                </button>

                <button
                  type="button"
                  className={`batch-lifecycle-tab ${batchLifecycleFilter === 'all' ? 'active' : ''}`}
                  onClick={() => { setBatchLifecycleFilter('all'); setBatchesPage(1); }}
                >
                  All Batches
                  <span className="batch-tab-count">{batchStats.total}</span>
                </button>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing <strong>{filteredBatches.length}</strong> batch{filteredBatches.length === 1 ? '' : 'es'}
              </div>
            </div>

            {/* Search & Secondary Filter Bar */}
            <FilterBar
              searchPlaceholder="Search by Batch Name, Code, Course, Trainer..."
              searchValue={batchSearchQuery}
              onSearchChange={(val) => { setBatchSearchQuery(val); setBatchesPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: batchCourseFilter,
                  onChange: (val) => { setBatchCourseFilter(val); setBatchesPage(1); },
                  options: Array.from(new Set(batches.map(b => b.course_name))).filter(Boolean).map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Trainer',
                  value: batchTrainerFilter,
                  onChange: (val) => { setBatchTrainerFilter(val); setBatchesPage(1); },
                  options: Array.from(new Set(batches.map(b => b.trainer_name))).filter(Boolean).map(t => ({ value: t, label: t }))
                },
                {
                  label: 'Status',
                  value: batchStatusFilter,
                  onChange: (val) => { setBatchStatusFilter(val); setBatchesPage(1); },
                  options: [
                    { value: 'Active', label: 'Active' },
                    { value: 'Completed', label: 'Completed' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={batchDateFilter}
              onQuickFilterChange={(pill) => { setBatchDateFilter(pill); setBatchesPage(1); }}
              startDateValue={batchStartDateFilter}
              endDateValue={batchEndDateFilter}
              onStartDateChange={(val) => { setBatchStartDateFilter(val); setBatchesPage(1); }}
              onEndDateChange={(val) => { setBatchEndDateFilter(val); setBatchesPage(1); }}
              onExportCSV={exportBatchesToCSV}
              onExportExcel={exportBatchesToExcel}
              onExportPDF={exportBatchesToPDF}
              actionLabel="+ Create Batch"
              onActionClick={() => {
                setEditingBatch(null);
                resetBatchForm();
                setShowBatchModal(true);
              }}
            />

            {/* Batches Grid Section */}
            <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px', width: '100%', padding: '24px' }}>
              <div className="section-header-premium" style={{ marginBottom: '22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                    {batchLifecycleFilter === 'active_only' ? 'Active Institutional Batches (Within Duration)' :
                     batchLifecycleFilter === 'completed' ? 'Completed & Expired Batches (Eligible for Extension)' :
                     batchLifecycleFilter === 'upcoming' ? 'Scheduled Upcoming Batches' : 'All Institutional Batches'}
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {batchLifecycleFilter === 'active_only' 
                      ? 'Displaying only batches that are currently running within their active duration.' 
                      : 'Manage course cohorts, daily timing schedules, and duration extensions.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, padding: '6px 14px', borderRadius: '20px', background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color)' }} />
                    {filteredBatches.length} {filteredBatches.length === 1 ? 'Cohort' : 'Cohorts'} Found
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '6px 14px', fontSize: '12.5px', height: '36px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['adminBatches'] });
                      queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
                      showToast('Batches refreshed from server ✓');
                    }}
                    title="Refresh batches from local database"
                  >
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>
              </div>

              {filteredBatches.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '50px 20px', textAlign: 'center' }}>
                  <div style={{ width: '84px', height: '84px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary-color)' }}>
                    <GraduationCap size={42} />
                  </div>
                  <h5 style={{ fontSize: '17px', fontWeight: '800', margin: '0 0 6px', color: 'var(--text-primary)' }}>No Batches Found</h5>
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '380px', margin: '0 0 16px', lineHeight: 1.5 }}>
                    {batchLifecycleFilter === 'active_only'
                      ? 'No batches are currently active within their duration window. You can view expired batches to extend them or create a brand new batch.'
                      : 'No batches match your selected search or filter criteria.'}
                  </p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    {batchLifecycleFilter !== 'all' && (
                      <button className="btn btn-outline" onClick={() => setBatchLifecycleFilter('all')}>
                        View All Batches
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingBatch(null);
                        resetBatchForm();
                        setShowBatchModal(true);
                      }}
                    >
                      <Plus size={15} /> Create 50-Day Batch
                    </button>
                  </div>
                </div>
              ) : (() => {
                const batchLimit = 6;
                const totalBatchesPages = Math.ceil(filteredBatches.length / batchLimit) || 1;
                const safeBatchesPage = Math.min(batchesPage, totalBatchesPages);
                const paginatedBatches = filteredBatches.slice((safeBatchesPage - 1) * batchLimit, safeBatchesPage * batchLimit);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div className="batches-cards-grid">
                      {paginatedBatches.map((batch) => {
                        const duration = calculateBatchDurationInfo(batch.start_date, batch.end_date, batch.duration_days);
                        const studentsCount = batch.students_count || (Array.isArray(batch.student_ids) ? batch.student_ids.length : 0);
                        const maxStudents = Number(batch.max_students) || 30;
                        const capacityPct = Math.min(100, Math.round((studentsCount / maxStudents) * 100));
                        const extensions = Array.isArray(batch.extension_history) ? batch.extension_history : [];
                        const totalDaysExtended = extensions.reduce((sum, item) => sum + (Number(item.daysAdded) || 0), 0);

                        let accentClass = 'active';
                        if (duration.isExpired) accentClass = 'completed';
                        else if (duration.isUpcoming) accentClass = 'upcoming';

                        return (
                          <div key={batch.id} className="batch-card-premium">
                            <div className={`batch-card-accent-bar ${accentClass}`} />

                            <div className="batch-card-inner">
                              {/* Header Meta: Code, Course, Status */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' }}>
                                    {batch.code || 'BAT-001'}
                                  </span>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155', background: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <BookOpen size={11} color="var(--primary-color)" />
                                    {batch.course_name}
                                  </span>
                                </div>

                                {/* Dynamic Status Pill with live indicator */}
                                {duration.isActive ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '4px 10px', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)' }} />
                                    Active · Day {duration.currentDay} of {duration.totalDays}
                                  </span>
                                ) : duration.isExpired ? (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#D97706', background: '#FFFBEB', padding: '4px 10px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
                                    <History size={12} />
                                    Duration Ended
                                  </span>
                                ) : (
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                                    <Calendar size={12} />
                                    Upcoming
                                  </span>
                                )}
                              </div>

                              {/* Title & Instructor */}
                              <div>
                                <h5 
                                  style={{ fontWeight: '800', fontSize: '19px', color: 'var(--primary-color)', margin: '0 0 6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                  onClick={() => navigate(`/admin/batches/${batch.id}`)}
                                  title="Click to view Batch Details"
                                  className="batch-title-hover"
                                >
                                  <span>{batch.name}</span>
                                  <ArrowUpRight size={15} style={{ opacity: 0.6 }} />
                                </h5>
                                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <UserCheck size={14} style={{ color: 'var(--primary-color)' }} />
                                  Instructor: <strong style={{ color: 'var(--text-primary)' }}>{batch.trainer_name}</strong>
                                </p>
                              </div>

                              {/* Live Duration Tracking Box */}
                              <div className="batch-duration-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                                  <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
                                    Day {duration.currentDay} of {duration.totalDays} Days ({duration.progressPercent}%)
                                  </span>
                                  <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: 700, 
                                    padding: '2px 8px', 
                                    borderRadius: '6px',
                                    background: duration.isExpired ? '#FEE2E2' : (duration.isActive ? '#D1FAE5' : '#E0E7FF'),
                                    color: duration.isExpired ? '#DC2626' : (duration.isActive ? '#047857' : '#4338CA') 
                                  }}>
                                    {duration.daysNotice}
                                  </span>
                                </div>

                                <div className="batch-duration-track">
                                  <div
                                    className={`batch-duration-fill ${accentClass}`}
                                    style={{ width: `${duration.progressPercent}%` }}
                                  />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                                  <span>Start: <strong style={{ color: 'var(--text-secondary)' }}>{duration.startDateReadable}</strong></span>
                                  <span style={{ color: '#CBD5E1' }}>➔</span>
                                  <span>End: <strong style={{ color: 'var(--text-secondary)' }}>{duration.endDateReadable}</strong></span>
                                </div>
                              </div>

                              {/* Timing & Seats */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <div className="batch-pill-timing">
                                  <Clock size={13} />
                                  {batch.timing || '10:00 AM - 12:00 PM'}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                  <Users size={14} color="var(--primary-color)" />
                                  <strong>{studentsCount}</strong> / {maxStudents} Students
                                  <div style={{ width: '45px', height: '6px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                                    <div style={{ width: `${capacityPct}%`, height: '100%', background: capacityPct > 85 ? '#EF4444' : 'var(--primary-color)', borderRadius: '999px' }} />
                                  </div>
                                  <span style={{ fontSize: '11px', color: (maxStudents - studentsCount) > 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                                    ({(maxStudents - studentsCount) > 0 ? `${maxStudents - studentsCount} open` : 'Full'})
                                  </span>
                                </div>
                              </div>

                              {/* Extensions History Badge */}
                              {totalDaysExtended > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', border: '1px solid #DDD6FE', borderRadius: '8px', padding: '6px 12px', fontSize: '11.5px', color: '#6D28D9', fontWeight: 700 }}>
                                  <Sparkles size={13} color="#7C3AED" />
                                  Extended +{totalDaysExtended} Days total ({extensions.length} extension{extensions.length === 1 ? '' : 's'})
                                </div>
                              )}

                              {/* Action Buttons Toolbar: REMOVED View Roster & Assign */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '16px', marginTop: 'auto', gap: '8px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {/* Extend Batch Button */}
                                  <button
                                    type="button"
                                    className="batch-extend-btn-highlight"
                                    onClick={() => handleOpenExtendModal(batch)}
                                    title="Extend duration days or update daily timing"
                                  >
                                    <FastForward size={14} /> Extend Batch
                                  </button>

                                  {/* Batch Details */}
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '8px 14px', fontSize: '12px', height: '36px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--text-secondary)' }}
                                    onClick={() => navigate(`/admin/batches/${batch.id}`)}
                                    title="View batch cohort details and enrolled students"
                                  >
                                    <Eye size={14} /> Batch Details
                                  </button>
                                </div>

                                <div style={{ display: 'flex', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-outline"
                                    style={{ padding: '8px 12px', fontSize: '12px', height: '36px', borderRadius: '10px' }}
                                    onClick={() => startEditBatch(batch)}
                                    title="Edit Batch Details"
                                  >
                                    <Pencil size={13} />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-danger"
                                    style={{ padding: '8px 12px', fontSize: '12px', height: '36px', borderRadius: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA' }}
                                    onClick={() => deleteBatch(batch.id)}
                                    title="Delete Batch"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Viewing page <strong>{safeBatchesPage}</strong> of {totalBatchesPages} ({filteredBatches.length} total batches)
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '12px', height: '34px', borderRadius: '8px' }}
                          disabled={safeBatchesPage === 1}
                          onClick={() => setBatchesPage(prev => Math.max(prev - 1, 1))}
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '12px', height: '34px', borderRadius: '8px' }}
                          disabled={safeBatchesPage === totalBatchesPages}
                          onClick={() => setBatchesPage(prev => Math.min(prev + 1, totalBatchesPages))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Students Registry Tab */}
        {activeTab === 'students' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Students (Name, Phone, Email, ID)"
              searchValue={searchQuery}
              onSearchChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: courseFilter,
                  onChange: (val) => { setCourseFilter(val); setCurrentPage(1); },
                  options: courseTitles.map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: batchFilter,
                  onChange: (val) => { setBatchFilter(val); setCurrentPage(1); },
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Fee Status',
                  value: feesFilter,
                  onChange: (val) => { setFeesFilter(val); setCurrentPage(1); },
                  options: [
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending Payment', label: 'Pending Payment' }
                  ]
                },
                {
                  label: 'Account Status',
                  value: statusFilter,
                  onChange: (val) => { setStatusFilter(val); setCurrentPage(1); },
                  options: [
                    { value: 'Pending Email Verification', label: 'Pending Email Verification' },
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={studentDateFilter}
              onQuickFilterChange={(pill) => { setStudentDateFilter(pill); setCurrentPage(1); }}
              startDateValue={studentStartDateFilter}
              endDateValue={studentEndDateFilter}
              onStartDateChange={(val) => { setStudentStartDateFilter(val); setCurrentPage(1); }}
              onEndDateChange={(val) => { setStudentEndDateFilter(val); setCurrentPage(1); }}
              onExportCSV={exportToCSV}
              onExportExcel={exportToExcel}
              onExportPDF={exportToPDF}
              actionLabel="+ Create Student"
              onActionClick={() => { setCreateName(''); setCreateEmail(''); setCreatePhone(''); setCreateCourse('Fullstack Engineering'); setCreateBatchId(''); setCreateTempPassword(generateRandomPassword()); setShowCreateModal(true); }}
            />

            <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="section-header-premium" style={{ gap: '16px', flexWrap: 'wrap', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 className="section-title-premium" style={{ margin: 0 }}>Student Accounts Registry</h3>
              </div>
            <div className="table-container-scrollable table-desktop-view">
              <table className="table-premium compact-tablet">
                <thead>
                  <tr>
                    <th className="col-profile">Profile</th>
                    <th className="col-name">Student Name</th>
                    <th className="col-id">Student ID</th>
                    <th className="col-email">Email</th>
                    <th className="col-mobile">Mobile</th>
                    <th className="col-course">Course</th>
                    <th className="col-batch">Batch</th>
                    <th className="col-fee">Fee Status</th>
                    <th className="col-status">Account Status</th>
                    <th className="col-delivery">Delivery & Verification</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const initials = student.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                    const isPendingVerification = student.status === 'Pending Email Verification' || student.status === 'pending_verification';
                    const isActive = student.status === 'active' || student.status === 'Active';

                    return (
                      <tr key={student.id} style={{ cursor: 'pointer' }} onClick={() => handleViewStudentDetails(student.id)}>
                        <td className="col-profile" onClick={(e) => e.stopPropagation()}>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                            {(student.profile_pic || student.profilePhotoUrl) && (student.profile_pic || student.profilePhotoUrl).trim() !== '' ? (
                              <img src={student.profile_pic || student.profilePhotoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{initials}</span>
                            )}
                          </div>
                        </td>
                        <td className="col-name"><strong>{student.name}</strong></td>
                        <td className="col-id"><code>{student.rollNumber}</code></td>
                        <td className="col-email">
                          <div className="col-limit-email" title={student.email}>
                            {student.email}
                          </div>
                        </td>
                        <td className="col-mobile">{student.phone}</td>
                        <td className="col-course">
                          <div className="col-limit-course" title={student.course}>
                            {student.course}
                          </div>
                        </td>
                        <td className="col-batch">
                          <div className="col-limit-batch" title={student.batch_name || 'Not Assigned'}>
                            {student.batch_name || 'Not Assigned'}
                          </div>
                        </td>
                        <td className="col-fee">
                          <span className={`badge-status-fixed ${student.feesStatus === 'Paid' ? 'paid' : 'unpaid'}`} onClick={(e) => { e.stopPropagation(); toggleFees(student.id); }} style={{ cursor: 'pointer' }}>
                            {student.feesStatus === 'Paid' ? 'Paid' : 'Pending'}
                          </span>
                        </td>
                        <td className="col-status">
                          <span
                            className="badge-status-fixed"
                            onClick={(e) => { e.stopPropagation(); toggleStatus(student.id); }}
                            style={{
                              cursor: 'pointer',
                              padding: '4px 10px',
                              borderRadius: 12,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: isPendingVerification ? '#FEF3C7' : (isActive ? '#D1FAE5' : '#F3F4F6'),
                              color: isPendingVerification ? '#D97706' : (isActive ? '#059669' : '#4B5563'),
                              border: '1px solid currentColor',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {isPendingVerification ? 'Pending Email Verification' : (isActive ? 'Active' : 'Inactive')}
                          </span>
                        </td>
                        <td className="col-delivery">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Delivery: <strong style={{ color: student.emailDeliveryStatus === 'Failed' ? '#EF4444' : '#10B981' }}>{student.emailDeliveryStatus || 'Sent'}</strong>
                            </span>
                            <span>
                              Verified: <strong style={{ color: student.emailVerified ? '#10B981' : '#F59E0B' }}>{student.emailVerified ? 'Yes' : 'Pending'}</strong>
                            </span>
                          </div>
                        </td>
                        <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="action-icon-btn"
                              style={{ color: '#6C3CF0' }}
                              data-tooltip="Resend Welcome Email"
                              onClick={(e) => { e.stopPropagation(); sendStudentWelcomeEmail(student); }}
                            >
                              <RefreshCw size={15} />
                            </button>
                            {student.email && (
                              <a
                                href={`mailto:${student.email}`}
                                className="action-icon-btn"
                                style={{ textDecoration: 'none', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                data-tooltip="Send Mail"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Mail size={16} />
                              </a>
                            )}
                            <button className="action-icon-btn btn-view" data-tooltip="View Profile" onClick={() => handleViewStudentDetails(student.id)}>
                              <Eye size={16} />
                            </button>
                            <button className="action-icon-btn btn-edit" data-tooltip="Edit Student" onClick={() => handleEditClick(student)}>
                              <Pencil size={16} />
                            </button>
                            <button className="action-icon-btn btn-delete" data-tooltip="Delete" onClick={() => deleteStudent(student.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile View: Student Cards */}
            <div className="mobile-student-cards">
              {students.map((student) => {
                const initials = student.name ? student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                return (
                  <div key={student.id} className="student-mobile-card" onClick={() => handleViewStudentDetails(student.id)}>
                    <div className="student-card-header">
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                        {(student.profile_pic || student.profilePhotoUrl) && (student.profile_pic || student.profilePhotoUrl).trim() !== '' ? (
                          <img src={student.profile_pic || student.profilePhotoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{initials}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</h4>
                        <code style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{student.rollNumber}</code>
                      </div>
                    </div>
                    <div className="student-card-body">
                      <div>
                        <span className="student-card-label">Email</span>
                        <span className="student-card-value" style={{ wordBreak: 'break-all' }}>{student.email}</span>
                      </div>
                      <div>
                        <span className="student-card-label">Mobile</span>
                        <span className="student-card-value">{student.phone}</span>
                      </div>
                      <div>
                        <span className="student-card-label">Course</span>
                        <span className="student-card-value">{student.course}</span>
                      </div>
                      <div>
                        <span className="student-card-label">Batch</span>
                        <span className="student-card-value">{student.batch_name || 'Not Assigned'}</span>
                      </div>
                      <div>
                        <span className="student-card-label">Fee Status</span>
                        <span className={`badge-status-fixed ${student.feesStatus === 'Paid' ? 'paid' : 'unpaid'}`} onClick={(e) => { e.stopPropagation(); toggleFees(student.id); }} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                          {student.feesStatus === 'Paid' ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="student-card-label">Status</span>
                        <span className={`badge-status-fixed ${student.status === 'active' || student.status === 'Active' ? 'paid' : 'unpaid'}`} onClick={(e) => { e.stopPropagation(); toggleStatus(student.id); }} style={{ cursor: 'pointer', display: 'inline-flex' }}>
                          {student.status === 'active' || student.status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="student-card-actions" onClick={(e) => e.stopPropagation()} style={{ gap: '8px' }}>
                      {student.email && (
                        <a
                          href={`mailto:${student.email}`}
                          className="action-icon-btn"
                          style={{ textDecoration: 'none', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          data-tooltip="Send Mail"
                        >
                          <Mail size={16} />
                        </a>
                      )}
                      <button className="action-icon-btn btn-view" data-tooltip="View Profile" onClick={() => handleViewStudentDetails(student.id)}>
                        <Eye size={16} />
                      </button>
                      <button className="action-icon-btn btn-edit" data-tooltip="Edit Student" onClick={() => handleEditClick(student)}>
                        <Pencil size={16} />
                      </button>
                      <button className="action-icon-btn" data-tooltip="Reset Password" onClick={() => handleResetPassword(student.id)}>
                        <Key size={16} />
                      </button>
                      <button className="action-icon-btn btn-delete" data-tooltip="Delete" onClick={() => deleteStudent(student.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Fixed at bottom of Registry Container */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Viewing page <strong>{currentPage}</strong> of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                  Prev
                </button>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                  Next
                </button>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'live-classes' && (() => {
          const allAvailableClasses = liveClasses.map(c => ({
            ...c,
            batch_name: batches.find(b => b.id === c.batch_id)?.name || c.batch_name || 'General Batch',
            students_joined: c.students_joined || 0
          }));

          const filteredClasses = allAvailableClasses.filter(c => {
            const query = sessionSearch.toLowerCase();
            const matchesSearch = c.title?.toLowerCase().includes(query) || 
                                  c.instructor?.toLowerCase().includes(query) ||
                                  c.batch_name?.toLowerCase().includes(query);
            
            if (!matchesSearch) return false;
            
            const classBatch = batches.find(b => b.id === c.batch_id || b.name === c.batch_name);
            const matchesCourse = !liveCourseFilter || (classBatch && classBatch.course_name === liveCourseFilter);
            const matchesBatch = !liveBatchFilter || c.batch_id === liveBatchFilter || c.batch_name === liveBatchFilter;
            const matchesStatus = !liveStatusFilter || c.status === liveStatusFilter;
            
            if (!matchesCourse || !matchesBatch || !matchesStatus) return false;

            if (!c.date) return true;
            const classDate = new Date(c.date);
            const now = new Date();
            
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            
            if (dateFilter === 'Today') {
              return classDate >= startOfToday && classDate <= endOfToday;
            } else if (dateFilter === 'This Week') {
              const firstDayOfWeek = new Date(now);
              firstDayOfWeek.setDate(firstDayOfWeek.getDate() - firstDayOfWeek.getDay());
              firstDayOfWeek.setHours(0,0,0,0);
              const lastDayOfWeek = new Date(firstDayOfWeek);
              lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
              lastDayOfWeek.setHours(23,59,59,999);
              return classDate >= firstDayOfWeek && classDate <= lastDayOfWeek;
            } else if (dateFilter === 'This Month') {
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
              return classDate >= firstDayOfMonth && classDate <= lastDayOfMonth;
            } else if (dateFilter === 'This Year') {
              const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
              const lastDayOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
              return classDate >= firstDayOfYear && classDate <= lastDayOfYear;
            } else if (dateFilter === 'Custom Range') {
              if (!customStartDate || !customEndDate) return true;
              const start = new Date(customStartDate);
              const end = new Date(customEndDate);
              end.setHours(23, 59, 59);
              return classDate >= start && classDate <= end;
            }
            return true;
          });

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
              <FilterBar
                searchPlaceholder="Search Lecture, Faculty..."
                searchValue={sessionSearch}
                onSearchChange={(val) => { setSessionSearch(val); setLivePage(1); }}
                filters={[
                  {
                    label: 'Course',
                    value: liveCourseFilter,
                    onChange: (val) => { setLiveCourseFilter(val); setLivePage(1); },
                    options: Array.from(new Set(batches.map(b => b.course_name))).filter(Boolean).map(c => ({ value: c, label: c }))
                  },
                  {
                    label: 'Batch',
                    value: liveBatchFilter,
                    onChange: (val) => { setLiveBatchFilter(val); setLivePage(1); },
                    options: batches.map(b => ({ value: b.id, label: b.name }))
                  },
                  {
                    label: 'Live Status',
                    value: liveStatusFilter,
                    onChange: (val) => { setLiveStatusFilter(val); setLivePage(1); },
                    options: [
                      { value: 'Live', label: 'Live' },
                      { value: 'Upcoming', label: 'Upcoming' },
                      { value: 'Completed', label: 'Completed' }
                    ]
                  }
                ]}
                showDateFilter={true}
                activeQuickFilter={dateFilter}
                onQuickFilterChange={(pill) => { setDateFilter(pill); setLivePage(1); }}
                startDateValue={customStartDate}
                endDateValue={customEndDate}
                onStartDateChange={(val) => { setCustomStartDate(val); setLivePage(1); }}
                onEndDateChange={(val) => { setCustomEndDate(val); setLivePage(1); }}
                onExportCSV={exportLiveClassesToCSV}
                onExportExcel={exportLiveClassesToExcel}
                onExportPDF={exportLiveClassesToPDF}
                actionLabel="+ Schedule Live Class"
                onActionClick={() => setShowLiveClassModal(true)}
              />

              {/* Active Sessions Management - Full Width */}
              <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0, width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    Active & Scheduled Sessions
                    {hasUpcomingLiveClasses && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.1)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.2)' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444', animation: 'pulse-dot 1.5s infinite' }} />
                        Upcoming / Live Active
                      </span>
                    )}
                  </h4>
                </div>
                {filteredClasses.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 20px', background: 'var(--surface-alt)', borderRadius: '16px', border: '1.5px dashed var(--border-color)' }}>
                    <div style={{ width: '80px', height: '80px', background: 'rgba(108,60,240,0.06)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary-color)' }}>
                      <CalendarCheck size={40} />
                    </div>
                    <h5 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px' }}>No Live Sessions</h5>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 0 16px' }}>There are currently no sessions matching the active filters.</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowLiveClassModal(true)}>Schedule Session</button>
                  </div>
                ) : (() => {
                  const limit = 5;
                  const totalLivePages = Math.ceil(filteredClasses.length / limit) || 1;
                  const safeLivePage = Math.min(livePage, totalLivePages);
                  const paginatedClasses = filteredClasses.slice((safeLivePage - 1) * limit, safeLivePage * limit);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                      <div>
                        {/* Desktop table view */}
                        <div className="table-container-premium table-desktop-view" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                          <table className="table-premium table-live-classes">
                            <colgroup>
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '15%' }} />
                              <col style={{ width: '10%' }} />
                              <col style={{ width: '12%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '10%' }} />
                              <col style={{ width: '7%' }} />
                              <col style={{ width: '10%' }} />
                            </colgroup>
                            <thead>
                              <tr>
                                <th>Lecture</th>
                                <th>Batch</th>
                                <th>Faculty</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Status</th>
                                <th>Students</th>
                                <th className="col-actions" style={{ textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedClasses.map((item, idx) => {
                                const badgeClass = item.status === 'Live' ? 'badge-status-live' : (item.status === 'Upcoming' ? 'badge-status-upcoming' : 'badge-status-completed');

                                return (
                                  <tr key={item._id || idx}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.title}>
                                        {(item.status === 'Live' || item.status === 'Upcoming') && (
                                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444', animation: 'pulse-dot 1.5s infinite', flexShrink: 0 }} title="Active/Upcoming session" />
                                        )}
                                        <strong style={{ fontSize: '13.5px' }}>{item.title}</strong>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.batch_name}>
                                        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{item.batch_name}</span>
                                      </div>
                                    </td>
                                    <td>
                                      <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={item.instructor}>
                                        <span style={{ fontSize: '12.5px' }}>{item.instructor}</span>
                                      </div>
                                    </td>
                                    <td><span style={{ fontSize: '12.5px' }}>{item.date}</span></td>
                                    <td><span style={{ fontSize: '12.5px' }}>{item.time}</span></td>
                                    <td>
                                      <span className={`badge-status-fixed ${badgeClass}`} style={{ minWidth: '76px', height: '24px', fontSize: '10.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                                        {(item.status === 'Live' || item.status === 'Upcoming') && (
                                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 6px #EF4444', animation: 'pulse-dot 1.5s infinite', flexShrink: 0 }} />
                                        )}
                                        {item.status}
                                      </span>
                                    </td>
                                    <td>
                                      <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                        {item.students_joined || 0}
                                      </span>
                                    </td>
                                    <td className="col-actions" style={{ overflow: 'visible' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                        {item.status === 'Live' && (
                                          <>
                                            <a href={item.meet_link || item.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#10B981', borderColor: '#10B981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Join Class"><Video size={14} /></a>
                                            <button type="button" className="btn btn-outline btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', border: '1px solid #CBD5E1', color: '#1E293B', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleEditLiveClick(item)} title="Edit Session"><Pencil size={14} /></button>
                                            <button type="button" className="btn btn-warning btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#F59E0B', borderColor: '#F59E0B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleEndLiveClass(item.id || item.uid || item._id)} title="End Session (Mark Completed)"><CheckCircle size={14} /></button>
                                            <button type="button" className="btn btn-danger btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#EF4444', borderColor: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)} title="Delete Session"><Trash2 size={14} /></button>
                                          </>
                                        )}
                                        {item.status === 'Upcoming' && (
                                          <>
                                            <button type="button" className="btn btn-outline btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', border: '1px solid #CBD5E1', color: '#1E293B', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => handleEditLiveClick(item)} title="Edit Session"><Pencil size={14} /></button>
                                            <button type="button" className="btn btn-danger btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#EF4444', borderColor: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)} title="Delete Session"><Trash2 size={14} /></button>
                                          </>
                                        )}
                                        {item.status === 'Completed' && (
                                          <>
                                            <button
                                              type="button"
                                              className="btn btn-primary btn-sm"
                                              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                              onClick={() => handleOpenAdminUploadRecordingModal(item)}
                                              title={item.recording_url || item.recordingUrl ? "Update Live Class Recording" : "Upload Live Class Recording"}
                                            >
                                              <UploadCloud size={14} />
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-outline btn-sm"
                                              style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', border: '1px solid #CBD5E1', color: '#1E293B', backgroundColor: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                              onClick={() => handlePreviewAdminRecording(item)}
                                              title={item.recording_url || item.recordingUrl ? "Watch Recording Replay" : "View Recording"}
                                            >
                                              <PlayCircle size={14} />
                                            </button>
                                            <button type="button" className="btn btn-danger btn-sm" style={{ width: '28px', height: '28px', padding: 0, borderRadius: '50%', backgroundColor: '#EF4444', borderColor: '#EF4444', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)} title="Delete Session"><Trash2 size={14} /></button>
                                          </>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile responsive cards list */}
                        <div className="mobile-student-cards" style={{ display: 'none' }}>
                          {paginatedClasses.map((item, idx) => {
                            let badgeClass = 'badge-status-completed';
                            if (item.status === 'Live') badgeClass = 'badge-status-live';
                            else if (item.status === 'Upcoming') badgeClass = 'badge-status-upcoming';

                            return (
                              <div key={item._id || idx} className="student-mobile-card" style={{ padding: '16px' }}>
                                <div className="student-card-header" style={{ justifyContent: 'space-between', paddingBottom: '8px' }}>
                                  <div>
                                    <h5 style={{ fontWeight: '800', fontSize: '14.5px', margin: 0 }}>{item.title}</h5>
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.batch_name}</span>
                                  </div>
                                  <span className={`badge-status-fixed ${badgeClass}`} style={{ minWidth: '70px', height: '22px', fontSize: '10.5px' }}>
                                    {item.status}
                                  </span>
                                </div>
                                <div className="student-card-body" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '4px 0' }}>
                                  <div>
                                    <span className="student-card-label">Faculty</span>
                                    <span className="student-card-value">{item.instructor}</span>
                                  </div>
                                  <div>
                                    <span className="student-card-label">Students Joined</span>
                                    <span className="student-card-value">{item.students_joined}</span>
                                  </div>
                                  <div>
                                    <span className="student-card-label">Date</span>
                                    <span className="student-card-value">{item.date}</span>
                                  </div>
                                  <div>
                                    <span className="student-card-label">Time</span>
                                    <span className="student-card-value">{item.time}</span>
                                  </div>
                                </div>
                                <div className="student-card-actions" style={{ justifyContent: 'flex-start', gap: '8px', paddingTop: '10px' }}>
                                  {item.status === 'Live' && (
                                    <>
                                      <a href={item.meet_link || item.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ height: '32px', backgroundColor: '#10B981', borderColor: '#10B981', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><Video size={14} />Join</a>
                                      <button type="button" className="btn btn-outline btn-sm" style={{ height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleEditLiveClick(item)}><Pencil size={14} />Edit</button>
                                      <button type="button" className="btn btn-warning btn-sm" style={{ height: '32px', backgroundColor: '#F59E0B', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleEndLiveClass(item.id || item.uid || item._id)}>End</button>
                                      <button type="button" className="btn btn-danger btn-sm" style={{ height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)}><Trash2 size={14} />Delete</button>
                                    </>
                                  )}
                                  {item.status === 'Upcoming' && (
                                    <>
                                      <button type="button" className="btn btn-outline btn-sm" style={{ height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleEditLiveClick(item)}><Pencil size={14} />Edit</button>
                                      <button type="button" className="btn btn-danger btn-sm" style={{ height: '32px', backgroundColor: 'var(--danger-color)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)}><Trash2 size={14} />Delete</button>
                                    </>
                                  )}
                                  {item.status === 'Completed' && (
                                    <>
                                      <button type="button" className="btn btn-primary btn-sm" style={{ height: '32px', backgroundColor: '#2563EB', borderColor: '#2563EB', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleOpenAdminUploadRecordingModal(item)}>
                                        <UploadCloud size={14} />Upload Recording
                                      </button>
                                      <button type="button" className="btn btn-outline btn-sm" style={{ height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handlePreviewAdminRecording(item)}>
                                        <PlayCircle size={14} />View Recording
                                      </button>
                                      <button type="button" className="btn btn-danger btn-sm" style={{ height: '32px', backgroundColor: 'var(--danger-color)', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => deleteLiveClassHandler(item.id || item.uid || item._id)}><Trash2 size={14} />Delete</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Pagination */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Viewing page <strong>{safeLivePage}</strong> of {totalLivePages}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeLivePage === 1} onClick={() => setLivePage(prev => Math.max(prev - 1, 1))}>
                            Prev
                          </button>
                          <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeLivePage === totalLivePages} onClick={() => setLivePage(prev => Math.min(prev + 1, totalLivePages))}>
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })()}

        {activeTab === 'attendance' && (() => {
          // Calendar Helper Math
          const year = calendarMonth.getFullYear();
          const month = calendarMonth.getMonth();
          const monthName = calendarMonth.toLocaleString('default', { month: 'long' });
          
          const firstDayOfMonth = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          
          const prevMonthDays = [];
          for (let i = 0; i < firstDayOfMonth; i++) prevMonthDays.push(null);
          
          const daysArray = [];
          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            daysArray.push({ day: d, dateStr });
          }
          
          const calendarGrid = [...prevMonthDays, ...daysArray];

          // Compute summary stats for current sheet
          const totalAttStudents = attendanceRecords.length;
          const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
          const absentCount = attendanceRecords.filter(r => r.status === 'Absent').length;
          const notMarkedCount = attendanceRecords.filter(r => !r.status || r.status === 'Not Marked').length;
          const attendanceRate = totalAttStudents > 0 ? ((presentCount / totalAttStudents) * 100).toFixed(1) : '0.0';

          // Live class agenda match for selected date and batch
          const activeAgendaClass = liveClasses.find(c => {
            const isBatchMatch = !attBatchId || c.batch_id === attBatchId;
            return isBatchMatch && c.date === attendanceDate;
          });

          // Check if attendance is already saved for selected date & batch
          const hasSavedAttendanceForDate = attSheetsHistory.some(s => 
            s.date === attendanceDate && (!attBatchId || s.batch_id === attBatchId || s.batchId === attBatchId)
          );

          // Dates that have saved attendance in history (for calendar indicators)
          const markedDatesSet = new Set(
            attSheetsHistory
              .filter(s => !attBatchId || s.batch_id === attBatchId || s.batchId === attBatchId)
              .map(s => s.date)
          );

          // Filter batches by selected Course dropdown
          const filteredBatchOptions = attCourse 
            ? batches.filter(b => b.course_name === attCourse)
            : batches;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
              <FilterBar
                searchPlaceholder="Search Student in Sheet..."
                searchValue={attSearchQuery}
                onSearchChange={(val) => { setAttSearchQuery(val); setAttendancePage(1); }}
                filters={[
                  {
                    label: 'Course',
                    value: attCourse || attCourseFilter,
                    onChange: (val) => {
                      setAttCourse(val);
                      setAttCourseFilter(val);
                      setAttBatchId('');
                      setAttendanceRecords([]);
                      setAttendancePage(1);
                    },
                    options: Array.from(new Set(batches.map(b => b.course_name))).filter(Boolean).map(c => ({ value: c, label: c }))
                  },
                  {
                    label: 'Batch',
                    value: attBatchId || attBatchFilter,
                    onChange: (val) => {
                      setAttBatchFilter(val);
                      handleBatchChange({ target: { value: val } });
                    },
                    options: (attCourse ? batches.filter(b => b.course_name === attCourse) : batches).map(b => ({ value: b.id, label: b.name }))
                  },
                  {
                    label: 'Attendance Status',
                    value: attStatusFilter,
                    onChange: (val) => { setAttStatusFilter(val); setAttendancePage(1); },
                    options: [
                      { value: 'high', label: 'High Rate (>= 80%)' },
                      { value: 'low', label: 'Low Rate (< 80%)' }
                    ]
                  }
                ]}
                showDateFilter={true}
                activeQuickFilter={attDateFilter}
                onQuickFilterChange={(pill) => { setAttDateFilter(pill); setAttendancePage(1); }}
                startDateValue={attStartDateFilter}
                endDateValue={attEndDateFilter}
                onStartDateChange={(val) => { setAttStartDateFilter(val); setAttendancePage(1); }}
                onEndDateChange={(val) => { setAttEndDateFilter(val); setAttendancePage(1); }}
                onExportCSV={exportAttHistoryToCSV}
                onExportExcel={exportAttHistoryToExcel}
                onExportPDF={exportAttHistoryToPDF}
              />

              {/* Main Workspace Grid: Left Attendance Sheet (Main) | Right Calendar (Side) */}
              <div className="attendance-workspace-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '20px', alignItems: 'start' }}>
                
                {/* LEFT COLUMN: Attendance Sheet & Interactive Roster */}
                <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        Attendance Sheet — {batches.find(b => b.id === attBatchId)?.name || 'Select Batch'}
                      </h3>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        Class Date: <strong style={{ color: 'var(--primary-color)' }}>{attendanceDate}</strong>
                      </span>
                    </div>

                    {/* Batch Selection Controls */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <div style={{ minWidth: '160px' }}>
                        <select 
                          className="form-select" 
                          style={{ height: '38px', fontSize: '13px', width: '100%', background: 'white' }}
                          value={attCourse}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAttCourse(val);
                            setAttCourseFilter(val);
                            setAttBatchId('');
                            setAttendanceRecords([]);
                          }}
                        >
                          <option value="">-- All Courses --</option>
                          {courseTitles.map((c, i) => (
                            <option key={i} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ minWidth: '200px' }}>
                        <select 
                          className="form-select" 
                          style={{ height: '38px', fontSize: '13px', width: '100%', fontWeight: 700, borderColor: 'var(--primary-color)', background: 'white' }}
                          value={attBatchId}
                          onChange={(e) => handleBatchChange(e)}
                        >
                          <option value="">-- Choose Batch --</option>
                          {filteredBatchOptions.map((b) => (
                            <option key={b.id} value={b.id}>{b.name} ({b.code || 'BAT'})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Summary Counters Banner */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px', background: 'var(--surface-alt)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Total Students</span>
                      <strong style={{ fontSize: '18px', color: 'var(--text-primary)' }}>{totalAttStudents}</strong>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--success-color)', fontWeight: 700, display: 'block' }}>Present</span>
                      <strong style={{ fontSize: '18px', color: 'var(--success-color)' }}>{presentCount}</strong>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--danger-color)', fontWeight: 700, display: 'block' }}>Absent</span>
                      <strong style={{ fontSize: '18px', color: 'var(--danger-color)' }}>{absentCount}</strong>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 700, display: 'block' }}>Not Marked</span>
                      <strong style={{ fontSize: '18px', color: '#F59E0B' }}>{notMarkedCount}</strong>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 700, display: 'block' }}>Attendance Rate</span>
                      <strong style={{ fontSize: '18px', color: 'var(--primary-color)' }}>{attendanceRate}%</strong>
                    </div>
                  </div>

                  {/* Student Attendance List / Roster Table */}
                  {!attBatchId ? (
                    <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--surface-alt)', borderRadius: '12px', border: '1.5px dashed var(--border-color)' }}>
                      <GraduationCap size={44} style={{ color: 'var(--primary-color)', marginBottom: '12px', opacity: 0.6 }} />
                      <h4 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 6px' }}>Select a Batch to Take Attendance</h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>Choose a batch from the dropdown above to load the assigned student roster.</p>
                    </div>
                  ) : loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading student roster...</div>
                  ) : attendanceRecords.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'var(--surface-alt)', borderRadius: '12px' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>No students are currently assigned to this batch in Batch Management.</p>
                    </div>
                  ) : (
                    <>
                      {/* Desktop Table View */}
                      <div className="table-container-premium table-desktop-view">
                        <table className="table-premium">
                          <thead>
                            <tr>
                              <th>Roll Number</th>
                              <th>Student Name</th>
                              <th>Mobile</th>
                              <th>Course</th>
                              <th style={{ textAlign: 'center' }}>Mark Attendance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceRecords
                              .filter(r => !attSearchQuery || (r.student_name || '').toLowerCase().includes(attSearchQuery.toLowerCase()) || (r.rollNumber || '').toLowerCase().includes(attSearchQuery.toLowerCase()))
                              .map((rec) => {
                                const sId = rec.student_id || rec.studentId;
                                const isPresent = rec.status === 'Present';
                                const isAbsent = rec.status === 'Absent';

                                return (
                                  <tr key={sId}>
                                    <td><strong style={{ fontSize: '13px', color: 'var(--primary-color)' }}>{rec.rollNumber}</strong></td>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: '13.5px' }}>{rec.student_name}</span>
                                        {rec.attendedLive && isPresent ? (
                                          <span style={{ fontSize: '10.5px', fontWeight: 750, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                            ⚡ Auto (Live Class)
                                          </span>
                                        ) : isPresent ? (
                                          <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                            ✍️ Manual
                                          </span>
                                        ) : null}
                                      </div>
                                    </td>
                                    <td><span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{rec.phone || 'N/A'}</span></td>
                                    <td><span style={{ fontSize: '12.5px' }}>{rec.course}</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                      <div style={{ display: 'inline-flex', gap: '8px', background: 'var(--surface-alt)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(sId, 'Present')}
                                          style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: isPresent ? 'var(--success-color)' : 'transparent',
                                            color: isPresent ? '#FFFFFF' : 'var(--text-secondary)',
                                            boxShadow: isPresent ? '0 2px 4px rgba(16,185,129,0.3)' : 'none',
                                          }}
                                        >
                                          ✓ Present
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(sId, 'Absent')}
                                          style={{
                                            padding: '6px 16px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            fontWeight: 800,
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: isAbsent ? 'var(--danger-color)' : 'transparent',
                                            color: isAbsent ? '#FFFFFF' : 'var(--text-secondary)',
                                            boxShadow: isAbsent ? '0 2px 4px rgba(239,68,68,0.3)' : 'none',
                                          }}
                                        >
                                          ✗ Absent
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Responsive Cards */}
                      <div className="mobile-student-cards" style={{ display: 'none' }}>
                        {attendanceRecords
                          .filter(r => !attSearchQuery || (r.student_name || '').toLowerCase().includes(attSearchQuery.toLowerCase()) || (r.rollNumber || '').toLowerCase().includes(attSearchQuery.toLowerCase()))
                          .map((rec) => {
                            const sId = rec.student_id || rec.studentId;
                            const isPresent = rec.status === 'Present';
                            const isAbsent = rec.status === 'Absent';

                            return (
                              <div key={sId} className="student-mobile-card" style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                  <strong style={{ fontSize: '14px' }}>{rec.student_name}</strong>
                                  <span style={{ fontSize: '11px', color: 'var(--primary-color)', fontWeight: 700 }}>{rec.rollNumber}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                  Course: {rec.course}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(sId, 'Present')}
                                    style={{
                                      padding: '8px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      fontWeight: 800,
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      background: isPresent ? 'var(--success-color)' : 'var(--surface-alt)',
                                      color: isPresent ? '#FFFFFF' : 'var(--text-secondary)',
                                    }}
                                  >
                                    ✓ Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(sId, 'Absent')}
                                    style={{
                                      padding: '8px',
                                      borderRadius: '8px',
                                      border: 'none',
                                      fontWeight: 800,
                                      fontSize: '12px',
                                      cursor: 'pointer',
                                      background: isAbsent ? 'var(--danger-color)' : 'var(--surface-alt)',
                                      color: isAbsent ? '#FFFFFF' : 'var(--text-secondary)',
                                    }}
                                  >
                                    ✗ Absent
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Save Attendance Action Button */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 800, borderRadius: '10px' }}
                          onClick={saveAttendanceSheet}
                        >
                          💾 Save Attendance
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* RIGHT COLUMN: Attendance Interactive Calendar & Agenda */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Calendar Card */}
                  <div className="dashboard-card-section" style={{ padding: '18px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    
                    {/* Month Header & Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {monthName} {year}
                      </h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                          onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                        >
                          &lt;
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px', borderRadius: '6px' }}
                          onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                        >
                          &gt;
                        </button>
                      </div>
                    </div>

                    {/* Day Names Header */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '8px' }}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i} style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>{d}</span>
                      ))}
                    </div>

                    {/* Calendar Days Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                      {calendarGrid.map((item, idx) => {
                        if (!item) {
                          return <div key={idx} style={{ height: '36px' }} />;
                        }

                        const isSelected = item.dateStr === attendanceDate;
                        const isMarked = markedDatesSet.has(item.dateStr);

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setAttendanceDate(item.dateStr);
                              if (attBatchId) {
                                fetchAttendanceSheetByBatch(attBatchId, item.dateStr);
                              }
                            }}
                            style={{
                              height: '36px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid var(--primary-color)' : '1px solid transparent',
                              background: isSelected ? 'var(--primary-color)' : (isMarked ? 'rgba(16,185,129,0.1)' : 'transparent'),
                              color: isSelected ? '#FFFFFF' : (isMarked ? 'var(--success-color)' : 'var(--text-primary)'),
                              fontWeight: (isSelected || isMarked) ? 800 : 500,
                              fontSize: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justify: 'center',
                              position: 'relative',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <span>{item.day}</span>
                            {isMarked && !isSelected && (
                              <span style={{ fontSize: '8px', lineHeight: 1, marginTop: '-2px' }}>✓</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Agenda / Session Details Card */}
                  <div className="dashboard-card-section" style={{ padding: '18px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h5 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '6px' }}>
                      AGENDA: {attendanceDate}
                    </h5>

                    {activeAgendaClass ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                        <div><strong>Class:</strong> {activeAgendaClass.title}</div>
                        <div><strong>Trainer:</strong> {activeAgendaClass.instructor}</div>
                        <div><strong>Time:</strong> {activeAgendaClass.time}</div>
                        <div>
                          <strong>Status:</strong>{' '}
                          <span className={`badge-status ${activeAgendaClass.status === 'Live' ? 'live' : 'completed'}`}>
                            {activeAgendaClass.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: '0 0 10px' }}>
                        No live lecture scheduled for this date.
                      </p>
                    )}

                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '12.5px' }}>
                      <strong>Attendance Status:</strong>{' '}
                      {hasSavedAttendanceForDate ? (
                        <span style={{ color: 'var(--success-color)', fontWeight: 800 }}>✓ Marked & Saved</span>
                      ) : (
                        <span style={{ color: '#F59E0B', fontWeight: 700 }}>Pending Mark</span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Attendance History Section */}
                  <div className="dashboard-card-section" style={{ marginTop: '10px' }}>
                    <h3 className="section-title-premium" style={{ marginBottom: '18px' }}>Attendance History Logs</h3>
                    <div className="table-container-premium">
                      <table className="table-premium">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Batch</th>
                            <th>Present Count</th>
                            <th>Absent Count</th>
                            <th>Attendance Rate</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttSheets.length === 0 ? (
                            <tr>
                              <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                                No attendance logs history found matching the filters.
                              </td>
                            </tr>
                          ) : (
                            filteredAttSheets.map((sheet, idx) => (
                              <tr key={sheet.id || idx}>
                                <td><strong>{sheet.date}</strong></td>
                                <td>{sheet.batch_name}</td>
                                <td style={{ color: 'var(--success-color)', fontWeight: '600' }}>{sheet.present_count ?? 0} students</td>
                                <td style={{ color: 'var(--danger-color)', fontWeight: '600' }}>{sheet.absent_count ?? 0} students</td>
                                <td style={{ color: 'var(--primary-color)', fontWeight: '700' }}>{sheet.attendance_percentage ?? 100}%</td>
                                <td>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button 
                                      type="button" 
                                      className="btn btn-outline" 
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                      onClick={() => {
                                        setViewingHistoryRecord(sheet);
                                      }}
                                    >
                                      View Logs
                                    </button>
                                    <button 
                                      type="button" 
                                      className="btn btn-outline" 
                                      style={{ padding: '6px 12px', fontSize: '12px' }}
                                      onClick={() => handleEditHistoryRecord(sheet)}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Attendance View Detail Modal */}
                  {viewingHistoryRecord && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                      <div style={{ background: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Attendance Logs Detail</h4>
                          <button type="button" className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setViewingHistoryRecord(null)}>Close</button>
                        </div>
                        
                        <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <p style={{ margin: '4px 0' }}><strong>Batch Name:</strong> {viewingHistoryRecord.batch_name}</p>
                          <p style={{ margin: '4px 0' }}><strong>Course:</strong> {viewingHistoryRecord.course_name}</p>
                          <p style={{ margin: '4px 0' }}><strong>Date:</strong> {viewingHistoryRecord.date}</p>
                          <p style={{ margin: '4px 0' }}><strong>Attendance Rate:</strong> {viewingHistoryRecord.attendance_percentage}%</p>
                        </div>

                        <div className="table-container-premium" style={{ border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                          <table className="table-premium" style={{ fontSize: '13px' }}>
                            <thead>
                              <tr>
                                <th>Roll No.</th>
                                <th>Student Name</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(viewingHistoryRecord.records || []).map((rec, idx) => (
                                <tr key={rec.student_id || idx}>
                                  <td>{rec.rollNumber}</td>
                                  <td>{rec.student_name}</td>
                                  <td>
                                    <span className={`badge-status ${rec.status === 'Present' ? 'paid' : 'unpaid'}`} style={{ textTransform: 'capitalize' }}>
                                      {rec.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

            </div>
          );
        })()}

        {/* Recorded Classes View */}
        {activeTab === 'recorded-classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Recorded Class"
              searchValue={recordedSearchQuery}
              onSearchChange={(val) => { setRecordedSearchQuery(val); setRecordedPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: recordedCourseFilter,
                  onChange: (val) => { setRecordedCourseFilter(val); setRecordedPage(1); },
                  options: Array.from(new Set(recordedClasses.map(c => c.course_title))).filter(Boolean).map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: recordedBatchFilter,
                  onChange: (val) => { setRecordedBatchFilter(val); setRecordedPage(1); },
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Status',
                  value: recordedVisibilityFilter,
                  onChange: (val) => { setRecordedVisibilityFilter(val); setRecordedPage(1); },
                  options: [
                    { value: 'everyone', label: 'Everyone' },
                    { value: 'paid', label: 'Paid Only' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={recordedDateFilter}
              onQuickFilterChange={(pill) => { setRecordedDateFilter(pill); setRecordedPage(1); }}
              startDateValue={recordedStartDateFilter}
              endDateValue={recordedEndDateFilter}
              onStartDateChange={(val) => { setRecordedStartDateFilter(val); setRecordedPage(1); }}
              onEndDateChange={(val) => { setRecordedEndDateFilter(val); setRecordedPage(1); }}
              onExportCSV={exportRecordedClassesToCSV}
              onExportExcel={exportRecordedClassesToExcel}
              onExportPDF={exportRecordedClassesToPDF}
              actionLabel="+ Add Recorded Class"
              onActionClick={() => {
                setEditingRecordedClass(null);
                const targetBId = recordedBatchFilter || (batches[0]?.id || '');
                setSelectedBatchId(targetBId);
                const foundBatch = batches.find(b => b.id === targetBId);
                if (foundBatch && foundBatch.course_name) {
                  setRecCourseTitle(foundBatch.course_name);
                }
                setShowRecordedClassModal(true);
              }}
            />

            {/* ─── TWO-LEVEL PLAYLIST CONTAINER SYSTEM ─── */}
            {!selectedPlaylistBatch ? (
              /* LEVEL 1: PLAYLIST CONTAINERS DIRECTORY */
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '520px',
                width: '100%',
                gap: '24px',
                background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.65) 0%, rgba(245, 243, 255, 0.75) 45%, rgba(254, 243, 199, 0.35) 80%, rgba(236, 253, 245, 0.65) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid rgba(255, 255, 255, 0.9)',
                borderRadius: 28,
                padding: '26px 28px',
                boxShadow: '0 20px 45px -10px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255, 255, 255, 0.95)', marginBottom: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1' }} />
                      <span style={{ fontSize: 11, fontWeight: 750, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Curriculum & Recording Studio</span>
                    </div>
                    <h4 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                      Course Playlists & Recording Containers
                    </h4>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: 0, fontWeight: 500 }}>
                      Automatic batch curriculum playlists and custom curated playlists with audience controls.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setEditingPlaylist(null);
                        setPlaylistFormName('');
                        setPlaylistFormCourse('');
                        setPlaylistFormDescription('');
                        setPlaylistFormThumbnail('');
                        setPlaylistThumbnailType('url');
                        setPlaylistFormAccess('all');
                        setPlaylistFormBatchId('');
                        setShowPlaylistModal(true);
                      }}
                      style={{
                        borderRadius: 999,
                        padding: '8px 18px',
                        fontWeight: 750,
                        fontSize: '13px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(203, 213, 225, 0.85)',
                        color: '#0F172A',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={15} /> Create Playlist
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        setEditingRecordedClass(null);
                        setSelectedBatchId(batches[0] ? `batch:${batches[0].id}` : '');
                        setShowRecordedClassModal(true);
                      }}
                      style={{
                        borderRadius: 999,
                        padding: '8px 18px',
                        fontWeight: 750,
                        fontSize: '13px',
                        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Plus size={15} /> Upload Video
                    </button>
                  </div>
                </div>

                {/* PLAYLIST CONTAINERS GRID */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '22px' }}>
                  
                  {/* SECTION A: AUTOMATIC BATCH PLAYLISTS */}
                  {batches.map((batch, idx) => {
                    const bId = String(batch.id || batch.uid);
                    const batchRecordings = recordedClasses.filter(r => String(r.batch_id || r.batchId) === bId || String(r.playlist_id) === bId);
                    const batchDurationSec = batchRecordings.reduce((acc, r) => acc + parseDurationToSeconds(r.duration), 0);
                    const batchThumb = batch.thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=700&auto=format&fit=crop&q=80';
                    const theme = PLAYLIST_CARD_THEMES[idx % PLAYLIST_CARD_THEMES.length];

                    return (
                      <div
                        key={`batch-${bId}`}
                        style={{
                          background: theme.bg,
                          border: `1.5px solid ${theme.border}`,
                          borderRadius: 24,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: theme.shadow,
                          transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                        }}
                        className="clickable-card-hover"
                      >
                        {/* Top Banner with Inset & Image Clarity */}
                        <div style={{ padding: '12px 12px 0 12px' }}>
                          <div style={{
                            height: 145,
                            position: 'relative',
                            borderRadius: 18,
                            overflow: 'hidden',
                            background: '#0F172A',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                          }}>
                            {/* Main Visual Image - Vibrant & Unobscured */}
                            <img
                              src={batchThumb}
                              alt={batch.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease',
                              }}
                            />
                            {/* Gentle glossy gradient overlay for badge readability */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.05) 50%, rgba(15, 23, 42, 0.65) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                            }}>
                              {/* Top Bar on Banner */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 750,
                                  background: 'rgba(255, 255, 255, 0.88)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  color: '#0F172A',
                                  padding: '4px 12px',
                                  borderRadius: 999,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />
                                  {batch.course_name || 'Curriculum Track'}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: 'rgba(99, 102, 241, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#FFFFFF',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                  }}>
                                    🎓 Batch
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEditBatch(batch);
                                    }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: 'rgba(255, 255, 255, 0.88)',
                                      backdropFilter: 'blur(6px)',
                                      border: 'none',
                                      color: '#1E293B',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                    }}
                                    title="Edit Batch Details"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBatch(bId);
                                    }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: '#EF4444',
                                      border: 'none',
                                      color: '#FFFFFF',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    }}
                                    title="Delete Batch & Playlist"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Row on Banner: Elevated Badge Tile + Batch Title */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: '#FFFFFF',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                }}>
                                  <img
                                    src={batchThumb}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                                <h5 style={{
                                  fontSize: '16px',
                                  fontWeight: '800',
                                  margin: 0,
                                  color: '#FFFFFF',
                                  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                                  letterSpacing: '-0.2px',
                                  lineHeight: 1.2,
                                }}>
                                  Batch: {batch.name}
                                </h5>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lower Body with Pastel Glass Styling */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                          {/* Instructor & Cohort Tag */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#475569' }}>
                              <span style={{ fontWeight: 600 }}>Instructor:</span>
                              <strong style={{ color: '#0F172A', fontWeight: 750 }}>{batch.trainer_name || 'Staff Instructor'}</strong>
                            </div>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 750,
                              background: theme.tagBg,
                              color: theme.tagColor,
                              padding: '2px 8px',
                              borderRadius: 6,
                            }}>
                              {batch.code || batch.batchId || 'BAT'}
                            </span>
                          </div>

                          {/* Calculated Metrics Sub-box (Frosted Glass Widget) */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 10,
                            background: 'rgba(255, 255, 255, 0.75)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            padding: '10px 14px',
                            borderRadius: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Videos</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                                {batchRecordings.length} Lessons
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Duration</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                                {formatSecondsToDisplay(batchDurationSec)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Actions */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 4 }}>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => {
                                setSelectedBatchId(`batch:${bId}`);
                                if (batch.course_name) setRecCourseTitle(batch.course_name);
                                setShowRecordedClassModal(true);
                              }}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                fontSize: '12px',
                                borderRadius: 999,
                                fontWeight: 750,
                                background: 'rgba(255, 255, 255, 0.85)',
                                border: '1px solid rgba(203, 213, 225, 0.8)',
                                color: '#1E293B',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                transition: 'all 0.18s ease',
                              }}
                            >
                              <Plus size={13} /> Add Video
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setSelectedPlaylistBatch({ ...batch, isCustom: false })}
                              style={{
                                flex: 1.3,
                                padding: '9px 14px',
                                fontSize: '12px',
                                borderRadius: 999,
                                fontWeight: 750,
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: 'pointer',
                              }}
                            >
                              <span>Open Playlist</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* SECTION B: CUSTOM / MANUALLY CREATED PLAYLISTS */}
                  {customPlaylists.map((playlist, idx) => {
                    const plId = String(playlist.id || playlist.uid);
                    const plRecordings = recordedClasses.filter(r => String(r.playlist_id) === plId || String(r.batch_id) === plId);
                    const plDurationSec = plRecordings.reduce((acc, r) => acc + parseDurationToSeconds(r.duration), 0);
                    const isAll = playlist.access_type === 'all' || !playlist.batch_id;
                    const customThumb = playlist.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=700&auto=format&fit=crop&q=80';
                    const theme = PLAYLIST_CARD_THEMES[(batches.length + idx) % PLAYLIST_CARD_THEMES.length];

                    return (
                      <div
                        key={`custom-${plId}`}
                        style={{
                          background: theme.bg,
                          border: `1.5px solid ${theme.border}`,
                          borderRadius: 24,
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: theme.shadow,
                          transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                          position: 'relative',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                        }}
                        className="clickable-card-hover"
                      >
                        {/* Top Banner with Inset & Image Clarity */}
                        <div style={{ padding: '12px 12px 0 12px' }}>
                          <div style={{
                            height: 145,
                            position: 'relative',
                            borderRadius: 18,
                            overflow: 'hidden',
                            background: '#0F172A',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                          }}>
                            {/* Main Visual Image - Vibrant & Unobscured */}
                            <img
                              src={customThumb}
                              alt={playlist.name}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transition: 'transform 0.3s ease',
                              }}
                            />
                            {/* Gentle glossy gradient overlay for badge readability */}
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.05) 50%, rgba(15, 23, 42, 0.65) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                            }}>
                              {/* Top Bar on Banner */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 750,
                                  background: 'rgba(255, 255, 255, 0.88)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  color: '#0F172A',
                                  padding: '4px 12px',
                                  borderRadius: 999,
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 5,
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: theme.accent }} />
                                  {playlist.course_name || 'Curriculum Track'}
                                </span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    background: isAll ? 'rgba(16, 185, 129, 0.9)' : 'rgba(124, 58, 237, 0.9)',
                                    backdropFilter: 'blur(8px)',
                                    color: '#FFFFFF',
                                    padding: '4px 10px',
                                    borderRadius: 999,
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                  }}>
                                    {isAll ? '🌐 All' : `🔒 ${playlist.batch_name || 'Cohort'}`}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingPlaylist(playlist);
                                      setPlaylistFormName(playlist.name || '');
                                      setPlaylistFormCourse(playlist.course_name || '');
                                      setPlaylistFormDescription(playlist.description || '');
                                      setPlaylistFormThumbnail(playlist.thumbnail || '');
                                      setPlaylistThumbnailType(playlist.thumbnail ? 'url' : 'url');
                                      setPlaylistFormAccess(playlist.access_type || 'all');
                                      setPlaylistFormBatchId(playlist.batch_id || '');
                                      setShowPlaylistModal(true);
                                    }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: 'rgba(255, 255, 255, 0.88)',
                                      backdropFilter: 'blur(6px)',
                                      border: 'none',
                                      color: '#1E293B',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                    }}
                                    title="Edit Playlist"
                                  >
                                    <Pencil size={12} />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePlaylist(plId);
                                    }}
                                    style={{
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      background: '#EF4444',
                                      border: 'none',
                                      color: '#FFFFFF',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                    }}
                                    title="Delete Playlist"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Bottom Row on Banner: Elevated Badge Tile + Playlist Title */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: '#FFFFFF',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                }}>
                                  <img
                                    src={customThumb}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                </div>
                                <h5 style={{
                                  fontSize: '16px',
                                  fontWeight: '800',
                                  margin: 0,
                                  color: '#FFFFFF',
                                  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                                  letterSpacing: '-0.2px',
                                  lineHeight: 1.2,
                                }}>
                                  {playlist.name}
                                </h5>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Lower Body with Pastel Glass Styling */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                          <p style={{
                            fontSize: '12.5px',
                            color: '#475569',
                            margin: 0,
                            lineHeight: 1.45,
                            minHeight: 36,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {playlist.description || 'Custom curated lecture playlist and study materials.'}
                          </p>

                          {/* Calculated Metrics Sub-box (Frosted Glass Widget) */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 10,
                            background: 'rgba(255, 255, 255, 0.75)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.9)',
                            padding: '10px 14px',
                            borderRadius: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                          }}>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Videos</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                                {plRecordings.length} Lessons
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Total Duration</div>
                              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                                {formatSecondsToDisplay(plDurationSec)}
                              </div>
                            </div>
                          </div>

                          {/* Bottom Actions */}
                          <div style={{ display: 'flex', gap: 10, marginTop: 'auto', paddingTop: 4 }}>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => {
                                setSelectedBatchId(`playlist:${plId}`);
                                if (playlist.course_name) setRecCourseTitle(playlist.course_name);
                                setShowRecordedClassModal(true);
                              }}
                              style={{
                                flex: 1,
                                padding: '9px 12px',
                                fontSize: '12px',
                                borderRadius: 999,
                                fontWeight: 750,
                                background: 'rgba(255, 255, 255, 0.85)',
                                border: '1px solid rgba(203, 213, 225, 0.8)',
                                color: '#1E293B',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                transition: 'all 0.18s ease',
                              }}
                            >
                              <Plus size={13} /> Add Video
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setSelectedPlaylistBatch({ ...playlist, isCustom: true })}
                              style={{
                                flex: 1.3,
                                padding: '9px 14px',
                                fontSize: '12px',
                                borderRadius: 999,
                                fontWeight: 750,
                                background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                                color: '#FFFFFF',
                                border: 'none',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                                cursor: 'pointer',
                              }}
                            >
                              <span>Open Playlist</span>
                              <ArrowRight size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* LEVEL 2: DRILL-DOWN VIDEOS WITH TOPICS INSIDE SELECTED PLAYLIST */
              <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px', width: '100%', gap: '16px' }}>
                {/* Back button & Playlist Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, borderBottom: '1.5px solid #F1F5F9', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedPlaylistBatch(null)}
                      style={{
                        background: '#F1F5F9',
                        border: 'none',
                        borderRadius: 999,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#334155',
                      }}
                    >
                      <ArrowLeft size={15} />
                      Back to All Playlists
                    </button>
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 2px', color: '#1E293B' }}>
                        {selectedPlaylistBatch.name}
                      </h4>
                      <span style={{ fontSize: '12.5px', color: '#64748B' }}>
                        {selectedPlaylistBatch.course_name || 'Course Curriculum'} • {selectedPlaylistBatch.isCustom ? 'Custom Playlist' : 'Batch Cohort'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {selectedPlaylistBatch.isCustom ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPlaylist(selectedPlaylistBatch);
                            setPlaylistFormName(selectedPlaylistBatch.name || '');
                            setPlaylistFormCourse(selectedPlaylistBatch.course_name || '');
                            setPlaylistFormDescription(selectedPlaylistBatch.description || '');
                            setPlaylistFormThumbnail(selectedPlaylistBatch.thumbnail || '');
                            setPlaylistThumbnailType(selectedPlaylistBatch.thumbnail ? 'url' : 'url');
                            setPlaylistFormAccess(selectedPlaylistBatch.access_type || 'all');
                            setPlaylistFormBatchId(selectedPlaylistBatch.batch_id || '');
                            setShowPlaylistModal(true);
                          }}
                          className="btn btn-outline"
                          style={{ borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: '13px' }}
                        >
                          <Pencil size={14} /> Edit Playlist
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePlaylist(selectedPlaylistBatch.id || selectedPlaylistBatch.uid)}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 999,
                            padding: '8px 16px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Trash2 size={14} /> Delete Playlist
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditBatch(selectedPlaylistBatch)}
                          className="btn btn-outline"
                          style={{ borderRadius: 999, padding: '8px 16px', fontWeight: 700, fontSize: '13px' }}
                        >
                          <Pencil size={14} /> Edit Batch
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBatch(selectedPlaylistBatch.id || selectedPlaylistBatch.uid)}
                          style={{
                            background: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            borderRadius: 999,
                            padding: '8px 16px',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <Trash2 size={14} /> Delete Batch
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => {
                        const targetVal = selectedPlaylistBatch.isCustom ? `playlist:${selectedPlaylistBatch.id}` : `batch:${selectedPlaylistBatch.id}`;
                        setSelectedBatchId(targetVal);
                        if (selectedPlaylistBatch.course_name) setRecCourseTitle(selectedPlaylistBatch.course_name);
                        setShowRecordedClassModal(true);
                      }}
                      style={{ borderRadius: 999, padding: '8px 18px', fontWeight: 700 }}
                    >
                      <Plus size={15} /> Add Lesson to this Playlist
                    </button>
                  </div>
                </div>

                {/* Filter and List for this Playlist */}
                {(() => {
                  const targetId = String(selectedPlaylistBatch.id || selectedPlaylistBatch.uid);
                  const isCustom = selectedPlaylistBatch.isCustom;
                  const playlistLessons = recordedClasses.filter(r => {
                    if (isCustom) {
                      return String(r.playlist_id) === targetId || String(r.batch_id) === targetId;
                    }
                    return String(r.batch_id || r.batchId) === targetId || String(r.playlist_id) === targetId;
                  });

                  const playlistTotalDuration = playlistLessons.reduce((acc, r) => acc + parseDurationToSeconds(r.duration), 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Metric Banner for the Playlist */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', background: '#F8FAFC', padding: '12px 18px', borderRadius: 14, fontSize: '13px' }}>
                        <span style={{ fontWeight: 700, color: '#1E293B' }}>
                          Playlist Overview:
                        </span>
                        <span style={{ background: '#FFFFFF', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontWeight: 650, color: '#334155' }}>
                          📚 {playlistLessons.length} Lessons Total
                        </span>
                        <span style={{ background: '#FFFFFF', padding: '4px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontWeight: 650, color: '#334155' }}>
                          ⏱ {formatSecondsToDisplay(playlistTotalDuration)} Total Duration
                        </span>
                        {playlistLessons.length > 0 && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                              marginLeft: 'auto',
                              borderRadius: 999,
                              padding: '6px 16px',
                              fontSize: 12.5,
                              fontWeight: 750,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                            }}
                            onClick={() => setPreviewRecordedClass(playlistLessons[0])}
                          >
                            <PlayCircle size={14} />
                            <span>Open Course Player</span>
                          </button>
                        )}
                      </div>

                      {playlistLessons.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
                          <PlayCircle size={44} color="#94A3B8" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                          <h5 style={{ fontSize: '16px', fontWeight: '800', color: '#1E293B', margin: '0 0 6px' }}>No Lessons in this Playlist Yet</h5>
                          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: 360, margin: '0 auto 16px' }}>
                            Upload Google Drive video links to populate this playlist with topics and recordings.
                          </p>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              const targetVal = selectedPlaylistBatch.isCustom ? `playlist:${selectedPlaylistBatch.id}` : `batch:${selectedPlaylistBatch.id}`;
                              setSelectedBatchId(targetVal);
                              if (selectedPlaylistBatch.course_name) setRecCourseTitle(selectedPlaylistBatch.course_name);
                              setShowRecordedClassModal(true);
                            }}
                            style={{ borderRadius: 999 }}
                          >
                            <Plus size={14} /> Upload First Lesson
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {playlistLessons.map((item, idx) => (
                            <div key={item.id || idx} style={{ background: '#FFFFFF', border: '1.5px solid #F1F5F9', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                              <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                {/* Sort # badge */}
                                <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, flexShrink: 0 }}>
                                  {item.sort_order || idx + 1}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                                    <div>
                                      <h5 style={{ fontWeight: '800', fontSize: '15px', margin: '0 0 4px', color: '#1E293B' }}>{item.title}</h5>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '12px', color: '#64748B' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 6 }}>
                                          Topic: {item.module || 'Core Curriculum'}
                                        </span>
                                        <span>·</span>
                                        <span>⏱ Duration: <strong style={{ color: '#334155' }}>{item.duration || '1h 30m'}</strong></span>
                                        <span>·</span>
                                        <span>{item.course_title || selectedPlaylistBatch.course_name}</span>
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                      <button 
                                        type="button"
                                        className="btn btn-outline" 
                                        style={{ padding: '5px 14px', fontSize: 12, height: '32px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: 'var(--primary-color)', borderColor: 'var(--primary-color)', backgroundColor: 'var(--primary-light)', gap: 5 }}
                                        onClick={() => setPreviewRecordedClass(item)}
                                        title="Preview Video in Portal"
                                      >
                                        <PlayCircle size={14} />
                                        Watch
                                      </button>
                                      <button 
                                        type="button"
                                        className="btn btn-outline" 
                                        style={{ padding: '5px 14px', fontSize: 12, height: '32px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#1E293B', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' }}
                                        onClick={() => {
                                          setEditingRecordedClass(item);
                                          setRecTitle(item.title || '');
                                          setRecModule(item.module || '');
                                          setRecCourseTitle(item.course_title || '');
                                          setRecVideoUrl(item.video_url || '');
                                          setRecThumbnailUrl(item.thumbnail || '');
                                          setRecLessonDescription(item.description || '');
                                          setRecNotesUrl(item.notes_url || '');
                                          setRecAssignment(item.assignment || '');
                                          setRecVisibility(item.visibility || 'everyone');
                                          setRecSortOrder(item.sort_order?.toString() || '');
                                          setSelectedBatchId(item.playlist_id ? `playlist:${item.playlist_id}` : (item.batch_id ? `batch:${item.batch_id}` : ''));
                                          setRecDuration(item.duration || '1h 30m');
                                          setVideoSourceType(item.video_source_type || 'link');
                                          setRecStudyMaterials(item.study_materials || []);
                                          setShowRecordedClassModal(true);
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button 
                                        type="button" 
                                        className="btn btn-danger" 
                                        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%', backgroundColor: '#EF4444', color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none' }} 
                                        onClick={() => deleteRecordedClassHandler(item.id || item.uid || item._id)}
                                        title="Delete Recording"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Announcement"
              searchValue={annSearchQuery}
              onSearchChange={(val) => { setAnnSearchQuery(val); setAnnouncementsPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: annCourseFilter,
                  onChange: (val) => { setAnnCourseFilter(val); setAnnouncementsPage(1); },
                  options: courseTitles.map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: annBatchFilter,
                  onChange: (val) => { setAnnBatchFilter(val); setAnnouncementsPage(1); },
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Status',
                  value: annAudienceFilter,
                  onChange: (val) => { setAnnAudienceFilter(val); setAnnouncementsPage(1); },
                  options: [
                    { value: 'pinned', label: 'Pinned Announcements' },
                    { value: 'high', label: 'High Priority Notices' },
                    { value: 'medium', label: 'Medium Priority Notices' },
                    { value: 'low', label: 'Low Priority Notices' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={annDateFilter}
              onQuickFilterChange={(pill) => { setAnnDateFilter(pill); setAnnouncementsPage(1); }}
              startDateValue={annStartDateFilter}
              endDateValue={annEndDateFilter}
              onStartDateChange={(val) => { setAnnStartDateFilter(val); setAnnouncementsPage(1); }}
              onEndDateChange={(val) => { setAnnEndDateFilter(val); setAnnouncementsPage(1); }}
              onExportCSV={exportAnnouncementsToCSV}
              onExportExcel={exportAnnouncementsToExcel}
              onExportPDF={exportAnnouncementsToPDF}
              actionLabel="+ Create Announcement"
              onActionClick={() => setShowAnnouncementModal(true)}
            />

            <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px', width: '100%' }}>
              <div className="section-header-premium" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Broadcast Logs</h4>
              </div>
              
              {filteredAnnouncements.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary-color)' }}>
                    <Megaphone size={40} />
                  </div>
                  <h5 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px' }}>No Announcements</h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', margin: 0 }}>No announcements broadcasted yet.</p>
                </div>
              ) : (() => {
                const limit = 5;
                const totalAnnPages = Math.ceil(filteredAnnouncements.length / limit) || 1;
                const safeAnnPage = Math.min(announcementsPage, totalAnnPages);
                const paginatedAnn = filteredAnnouncements.slice((safeAnnPage - 1) * limit, safeAnnPage * limit);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paginatedAnn.map((item, idx) => {
                        const associatedBatch = batches.find(b => b.id === item.batch_id);
                        return (
                          <div key={idx} className="feed-item-premium" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span className="badge-status paid" style={{ fontSize: '9px' }}>{item.priority}</span>
                                {item.is_pinned && <span style={{ fontSize: '10px', color: 'var(--primary-color)', fontWeight: '700' }}>📌 Pinned</span>}
                              </div>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button type="button" className="btn btn-outline" style={{ padding: '6px', height: '28px' }} onClick={() => handleEditAnnClick(item)}>
                                  <Pencil size={12} />
                                </button>
                                <button type="button" className="btn btn-danger" style={{ padding: '6px', height: '28px', backgroundColor: 'var(--danger-color)', color: 'white' }} onClick={() => deleteAnnouncement(item._id)}>
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                            <h5 style={{ fontWeight: '700', fontSize: '14.5px', margin: 0 }}>{item.title}</h5>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>{item.content}</p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Broadcasted: {item.date}</span>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>•</span>
                              <span style={{ fontSize: '11.5px', fontWeight: '700', color: 'var(--primary-color)' }}>
                                Batch: {associatedBatch ? `${associatedBatch.name} (${associatedBatch.course_name})` : 'All Batches'}
                              </span>
                            </div>
                            {item.attachmentUrl && (
                              <div style={{ marginTop: '6px' }}>
                                <a
                                  href={getDownloadUrl(item.attachmentUrl, item.attachmentName || 'circular.pdf')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={item.attachmentName || 'circular.pdf'}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 12px',
                                    borderRadius: 6,
                                    background: '#EFF6FF',
                                    border: '1px solid #BFDBFE',
                                    color: '#1D4ED8',
                                    fontSize: 11.5,
                                    fontWeight: 700,
                                    textDecoration: 'none'
                                  }}
                                >
                                  <Download size={12} />
                                  <span>{item.attachmentName || 'Download Circular'}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Viewing page <strong>{safeAnnPage}</strong> of {totalAnnPages}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeAnnPage === 1} onClick={() => setAnnouncementsPage(prev => Math.max(prev - 1, 1))}>
                          Prev
                        </button>
                        <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeAnnPage === totalAnnPages} onClick={() => setAnnouncementsPage(prev => Math.min(prev + 1, totalAnnPages))}>
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Assignments Management Tab */}
        {activeTab === 'assignments' && (
          <div style={{ width: '100%' }}>
            <TrainerAssignmentsView
              batches={batches}
              students={students}
              trainerUid={uid || 'admin'}
              trainerName="Administrator"
              showToast={(msg) => showAdminToast(msg)}
              isAdmin={true}
            />
          </div>
        )}

        {/* Fees Management Tab */}
        {activeTab === 'fees-management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Student"
              searchValue={feesSearchQuery}
              onSearchChange={(val) => { setFeesSearchQuery(val); setFeesPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: feesCourseFilter,
                  onChange: (val) => { setFeesCourseFilter(val); setFeesPage(1); },
                  options: courseTitles.map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: feesBatchFilter,
                  onChange: (val) => { setFeesBatchFilter(val); setFeesPage(1); },
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Fee Status',
                  value: feesStatusFilter,
                  onChange: (val) => { setFeesStatusFilter(val); setFeesPage(1); },
                  options: [
                    { value: 'Paid', label: 'Paid' },
                    { value: 'Pending Payment', label: 'Pending Payment' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={feesDateFilter}
              onQuickFilterChange={(pill) => { setFeesDateFilter(pill); setFeesPage(1); }}
              startDateValue={feesStartDateFilter}
              endDateValue={feesEndDateFilter}
              onStartDateChange={(val) => { setFeesStartDateFilter(val); setFeesPage(1); }}
              onEndDateChange={(val) => { setFeesEndDateFilter(val); setFeesPage(1); }}
              onExportCSV={exportFeesToCSV}
              onExportExcel={exportFeesToExcel}
              onExportPDF={exportFeesToPDF}
            />

            <div className="dashboard-card-section">
              <div className="section-header-premium" style={{ marginBottom: '18px' }}>
                <h3 className="section-title-premium" style={{ margin: 0 }}>Student Financial Ledger</h3>
              </div>
              <div className="table-container-premium">
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Roll Number</th>
                      <th>Name</th>
                      <th>Total Package</th>
                      <th>Paid Amount</th>
                      <th>Dues Outstanding</th>
                      <th>Ledger Status</th>
                      <th>Payment Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentsForFees.map((student) => {
                      const feeInfo = getStudentFeeDetails(student);
                      return (
                        <tr key={student.id}>
                          <td><strong>{student.rollNumber}</strong></td>
                          <td>{student.name}</td>
                          <td>{formatCurrency(feeInfo.total)}</td>
                          <td style={{ color: 'var(--success-color)' }}>{formatCurrency(feeInfo.paid)}</td>
                          <td style={{ color: 'var(--danger-color)' }}>{formatCurrency(feeInfo.remaining)}</td>
                          <td>
                            <span className={`badge-status ${feeInfo.isPaid ? 'paid' : 'unpaid'}`}>
                              {student.feesStatus || 'Pending Payment'}
                            </span>
                          </td>
                          <td>{student.feesPaymentDate || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            className={`btn ${student.feesStatus === 'Paid' ? 'btn-outline' : 'btn-primary'}`} 
                            style={{ padding: '6px 10px', fontSize: '11.5px' }}
                            onClick={() => toggleFees(student.id)}
                          >
                            Toggle Status
                          </button>
                          <button className="btn btn-outline" style={{ padding: '6px' }} onClick={() => handleEditFeesClick(student)}>
                            <Pencil size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Viewing page <strong>{feesPage}</strong> of {totalPages}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={feesPage === 1} onClick={() => setFeesPage(prev => Math.max(prev - 1, 1))}>
                  Prev
                </button>
                <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={feesPage === totalPages} onClick={() => setFeesPage(prev => Math.min(prev + 1, totalPages))}>
                  Next
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

        {activeTab === 'activity-score' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Student"
              searchValue={activitySearchQuery}
              onSearchChange={(val) => { setActivitySearchQuery(val); setActivityPage(1); }}
              filters={[
                {
                  label: 'Course',
                  value: activityCourseFilter,
                  onChange: (val) => { setActivityCourseFilter(val); setActivityPage(1); },
                  options: Array.from(new Set(batches.map(b => b.course_name))).filter(Boolean).map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: activityBatchFilter,
                  onChange: (val) => { setActivityBatchFilter(val); setActivityPage(1); },
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Activity Type',
                  value: activityTypeFilter,
                  onChange: (val) => { setActivityTypeFilter(val); setActivityPage(1); },
                  options: [
                    { value: 'Questions', label: 'Questions' },
                    { value: 'Participation', label: 'Participation' },
                    { value: 'Attendance', label: 'Attendance on Time' },
                    { value: 'Helped', label: 'Helped Others' },
                    { value: 'Camera', label: 'Camera On' },
                    { value: 'Penalty', label: 'Deductions' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={activityDateFilter}
              onQuickFilterChange={(pill) => { setActivityDateFilter(pill); setActivityPage(1); }}
              startDateValue={activityStartDateFilter}
              endDateValue={activityEndDateFilter}
              onStartDateChange={(val) => { setActivityStartDateFilter(val); setActivityPage(1); }}
              onEndDateChange={(val) => { setActivityEndDateFilter(val); setActivityPage(1); }}
              onExportCSV={exportActivityToCSV}
              onExportExcel={exportActivityToExcel}
              onExportPDF={exportActivityToPDF}
              actionLabel="+ Add Activity Score"
              onActionClick={() => { setShowActivityScoreModal(true); fetchActivityPresets(); }}
            />

            <div className="dashboard-card-section" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px', width: '100%' }}>
              <div className="section-header-premium" style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>Activity Logs History</h4>
              </div>
              
              {filteredActivityLogs.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px 20px', textAlign: 'center' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: 'var(--primary-color)' }}>
                    <Trophy size={40} />
                  </div>
                  <h5 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px' }}>No Activity Logs</h5>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '280px', margin: 0 }}>No activity logs found matching the filters.</p>
                </div>
              ) : (() => {
                const limit = 5;
                const totalActivityPages = Math.ceil(filteredActivityLogs.length / limit) || 1;
                const safeActivityPage = Math.min(activityPage, totalActivityPages);
                const paginatedActivity = filteredActivityLogs.slice((safeActivityPage - 1) * limit, safeActivityPage * limit);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {paginatedActivity.map((log) => (
                        <div key={log._id} className="feed-item-premium" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="badge-status paid" style={{ fontSize: '10px', background: log.points >= 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: log.points >= 0 ? '#10B981' : '#EF4444' }}>
                              {log.points >= 0 ? `+${log.points}` : log.points} Points
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{log.date}</span>
                          </div>
                          <h5 style={{ fontWeight: '700', fontSize: '14px', margin: 0 }}>
                            {log.student_name}
                          </h5>
                          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
                            <strong>Activity:</strong> {log.activity_type} · <strong>Session:</strong> {log.meeting}
                          </p>
                          {log.remarks && (
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                              "{log.remarks}"
                            </p>
                          )}
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Batch: {log.batch_name}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '15px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Viewing page <strong>{safeActivityPage}</strong> of {totalActivityPages}
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeActivityPage === 1} onClick={() => setActivityPage(prev => Math.max(prev - 1, 1))}>
                          Prev
                        </button>
                        <button type="button" className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }} disabled={safeActivityPage === totalActivityPages} onClick={() => setActivityPage(prev => Math.min(prev + 1, totalActivityPages))}>
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {/* Trainer Management Tab */}
        {activeTab === 'trainer-management' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Trainer Management</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  Create and manage trainers, faculty members, and lead instructors with unique Trainer IDs.
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => openTrainerModal()}>
                <Plus size={16} /> Create Trainer
              </button>
            </div>

            <div className="dashboard-card-section">
              {trainers.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Users size={40} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>No Trainers Found</h4>
                  <p style={{ fontSize: 13, margin: '4px 0 0' }}>Click "+ Create Trainer" to add your first trainer.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
                  {trainers.map((t) => (
                    <div key={t.id} className="feed-item-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 20, background: '#FFF', borderRadius: 16, border: '1px solid var(--border-light)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '3px 8px', borderRadius: 6 }}>
                            {t.trainerId || t.code || 'TRN-001'}
                          </span>
                          <span className={`badge-status ${t.status === 'Active' ? 'paid' : 'unpaid'}`} style={{ fontSize: 10, fontWeight: 700 }}>
                            {t.status || 'Active'}
                          </span>
                        </div>
                        <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800 }}>{t.name}</h4>
                        <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--primary-color)', fontWeight: 700 }}>{t.specialization || 'Instructor'}</p>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span>Email: {t.email ? <a href={`mailto:${t.email}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>{t.email}</a> : '—'}</span>
                          <span>Phone: {t.phone || '—'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid var(--border-light)', paddingTop: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {t.email && (
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }}
                            onClick={() => openSendTrainerMailModal(t)}
                          >
                            <Mail size={14} /> Send Mail
                          </button>
                        )}
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openTrainerModal(t)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: 12, backgroundColor: 'var(--danger-color)', color: 'white' }} onClick={() => handleDeleteTrainer(t.id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Master Data Tab */}
        {activeTab === 'master-data' && (
          <MasterDataPage />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (

          <div style={{ padding: '4px 0' }} className="animate-fade-in">
            {/* Admin Toast Alert */}
            {adminToast && (
              <div style={{
                position: 'fixed',
                top: 24,
                right: 24,
                background: '#121118',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 600,
                zIndex: 2000,
                boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                animation: 'slideIn 0.3s ease'
              }}>
                <CheckCircle size={15} color="#10B981" /> {adminToast}
              </div>
            )}

            {loadingAdminProfile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
                <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading settings...</p>
              </div>
            ) : (
              <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
                
                {/* Left Column: Account details & Portal customization */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* CARD 1: ACCOUNT MODULE */}
                  <div className="clickable-card-hover" style={{
                    background: '#FFF',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 20,
                    padding: 28,
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
                      <User size={18} color="var(--primary-color)" /> Account Details
                    </h3>

                    <form onSubmit={handleSaveAdminAccount}>
                      {/* Profile Photo */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ position: 'relative', width: 90, height: 90 }}>
                          <div style={{
                            width: 90,
                            height: 90,
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: 'var(--primary-light)',
                            border: '3.5px solid white',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {adminProfilePic ? (
                              <img src={adminProfilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-color) 0%, #4c22bc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff' }}>
                                {(adminName || 'A')[0].toUpperCase()}
                              </div>
                            )}
                          </div>
                          <label style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 28,
                            height: 28,
                            background: 'var(--primary-color)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            border: '2px solid #fff',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            transition: 'background 0.2s'
                          }}
                          className="photo-upload-badge"
                          >
                            <Camera size={12} />
                            <input type="file" accept="image/*" onChange={handleAdminImageUpload} style={{ display: 'none' }} />
                          </label>
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo</h4>
                          <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                            Upload a square picture. Click the camera icon.
                          </p>
                        </div>
                      </div>

                      {/* Editable Fields */}
                      <div style={{ display: 'flex', gap: 18, marginBottom: 24, flexDirection: 'column' }}>
                        
                        {/* Full Name */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Full Name</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="text"
                              className="form-input"
                              value={adminName}
                              onChange={e => setAdminName(e.target.value)}
                              placeholder="Enter your full name"
                              style={{ paddingLeft: 42 }}
                            />
                            <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                          </div>
                        </div>

                        {/* Email Address */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Email Address</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type="email"
                              className="form-input"
                              value={adminEmail || currentUser?.email || ''}
                              readOnly
                              style={{ paddingLeft: 42, background: 'var(--surface-alt)', cursor: 'default', opacity: 0.9 }}
                            />
                            <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                          </div>
                        </div>

                      </div>

                      {/* Save Profile Button */}
                      <button
                        type="submit"
                        disabled={savingAdminAccount}
                        className="btn btn-primary btn-block"
                        style={{ height: 46 }}
                      >
                        <Save size={16} /> {savingAdminAccount ? 'Saving Profile...' : 'Save Profile Changes'}
                      </button>
                    </form>
                  </div>

                </div>

                {/* Right Column: Password & Security */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* CARD 3: PASSWORD & SECURITY MODULE */}
                  <div className="clickable-card-hover" style={{
                    background: '#FFF',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 20,
                    padding: 28,
                    boxShadow: 'var(--shadow-card)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
                      <Lock size={18} color="var(--primary-color)" /> Password & Security
                    </h3>

                    <form onSubmit={handleAdminChangePassword}>
                      {/* Current Password */}
                      <div className="form-group">
                        <label className="form-label">Current Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showAdminCurrPassword ? 'text' : 'password'}
                            className="form-input"
                            value={adminCurrPassword}
                            onChange={e => setAdminCurrPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ paddingLeft: 42, paddingRight: 42 }}
                          />
                          <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                          <button
                            type="button"
                            onClick={() => setShowAdminCurrPassword(!showAdminCurrPassword)}
                            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          >
                            {showAdminCurrPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="form-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">New Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showAdminNewPassword ? 'text' : 'password'}
                            className="form-input"
                            value={adminNewPassword}
                            onChange={e => setAdminNewPassword(e.target.value)}
                            placeholder="Min. 8 characters"
                            style={{ paddingLeft: 42, paddingRight: 42 }}
                          />
                          <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                          <button
                            type="button"
                            onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
                            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          >
                            {showAdminNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="form-label">Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showAdminConfirmPassword ? 'text' : 'password'}
                            className="form-input"
                            value={adminConfirmPassword}
                            onChange={e => setAdminConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            style={{ paddingLeft: 42, paddingRight: 42 }}
                          />
                          <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                          <button
                            type="button"
                            onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
                            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                          >
                            {showAdminConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        {adminConfirmPassword && adminNewPassword !== adminConfirmPassword && (
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CircleAlert size={12} /> Passwords do not match.
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <button
                        type="submit"
                        disabled={savingAdminPassword || (adminNewPassword && adminNewPassword !== adminConfirmPassword)}
                        className="btn btn-primary btn-block"
                        style={{ height: 44, marginBottom: 12 }}
                      >
                        <Key size={15} /> {savingAdminPassword ? 'Changing Password...' : 'Change Password'}
                      </button>
                    </form>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}
      </main>

      {/* Trainer Creation / Edit Modal */}
      {showTrainerModal && (
        <CustomModal
          isOpen={showTrainerModal}
          onClose={() => setShowTrainerModal(false)}
          title={editingTrainer ? 'Edit Trainer Profile' : 'Create New Trainer Account'}
        >
          <form onSubmit={handleSaveTrainer} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Full Name *</label>
              <input type="text" className="form-input" value={trainerName} onChange={e => setTrainerName(e.target.value)} placeholder="e.g. Sri Trainer" required />
            </div>

            <div>
              <label className="form-label">Email Address *</label>
              <input type="email" className="form-input" value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} placeholder="e.g. trainer@levlox.com" required />
            </div>

            <div>
              <label className="form-label">Mobile Number</label>
              <input type="text" className="form-input" value={trainerPhone} onChange={e => setTrainerPhone(e.target.value)} placeholder="e.g. +91 9876543210" />
            </div>

            <div>
              <label className="form-label">Course / Expertise</label>
              <input type="text" className="form-input" value={trainerSpecialization} onChange={e => setTrainerSpecialization(e.target.value)} placeholder="e.g. Full Stack Web Development" />
            </div>

            <div>
              <label className="form-label">Account Status</label>
              <select className="form-select" value={trainerStatus} onChange={e => setTrainerStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {!editingTrainer && (
              <div>
                <label className="form-label">Temporary Password *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="text" className="form-input" value={trainerTempPassword} onChange={e => setTrainerTempPassword(e.target.value)} required />
                  <button type="button" className="btn btn-outline" style={{ flexShrink: 0, padding: '0 12px', fontSize: 12 }} onClick={() => setTrainerTempPassword(generateRandomPassword())}>
                    Generate
                  </button>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                  Trainer will be forced to change this password on their first login.
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowTrainerModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingTrainer ? 'Save Changes' : 'Create Trainer'}</button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Created Trainer Credentials Modal */}
      {createdTrainerCredentials && (
        <CustomModal
          isOpen={!!createdTrainerCredentials}
          onClose={() => setCreatedTrainerCredentials(null)}
          title="Trainer Account Created Successfully"
        >
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
              <CheckCircle size={32} />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 20 }}>
              Account created. Share the credentials below or send the welcome email.
            </p>
            <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 2 }}>Trainer ID</span>
                <strong style={{ fontSize: 14, color: 'var(--primary-color)' }}>{createdTrainerCredentials.trainerId}</strong>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 2 }}>Email Address</span>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>{createdTrainerCredentials.email}</strong>
              </div>
              <div>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: 2 }}>Temporary Password</span>
                <strong style={{ fontSize: 14, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{createdTrainerCredentials.password}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-outline" style={{ height: 40, justifyContent: 'center' }} onClick={() => {
                sendTrainerWelcomeEmail({ name: createdTrainerCredentials.name, email: createdTrainerCredentials.email, trainerId: createdTrainerCredentials.trainerId, openMailClient: true }, createdTrainerCredentials.password);
              }}>
                ✉️ Send Welcome Email
              </button>
              <button className="btn btn-outline" style={{ height: 40, justifyContent: 'center' }} onClick={() => {
                navigator.clipboard.writeText(`Trainer ID: ${createdTrainerCredentials.trainerId}\nEmail: ${createdTrainerCredentials.email}\nTemporary Password: ${createdTrainerCredentials.password}`);
                showModal("Copied", "Trainer credentials copied to clipboard!", "success");
              }}>
                📋 Copy Credentials
              </button>
              <button className="btn btn-primary" style={{ height: 40 }} onClick={() => setCreatedTrainerCredentials(null)}>
                ✓ Done
              </button>
            </div>
          </div>
        </CustomModal>
      )}

      {/* Send Trainer Mail with Password Modal */}
      {sendTrainerMailData && (
        <CustomModal
          isOpen={!!sendTrainerMailData}
          onClose={() => setSendTrainerMailData(null)}
          title={`Send Email to Trainer: ${sendTrainerMailData.name}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Prepare and send account credentials email to <strong>{sendTrainerMailData.name}</strong> using the Master Data Email Template.
            </p>

            <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <strong>Recipient Email:</strong> {sendTrainerMailData.email}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                <strong>Trainer ID:</strong> {sendTrainerMailData.trainerId || sendTrainerMailData.code || 'N/A'}
              </div>
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Password to Include in Email *</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-input"
                  value={sendMailPassword}
                  onChange={(e) => setSendMailPassword(e.target.value)}
                  placeholder="Enter temporary password"
                  required
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flexShrink: 0, padding: '0 12px', fontSize: 12 }}
                  onClick={() => setSendMailPassword(generateRandomPassword())}
                >
                  Generate
                </button>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'block' }}>
                This password will be populated into the email template.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setSendTrainerMailData(null)}>Cancel</button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={handleConfirmSendTrainerMail}
              >
                <Mail size={15} /> Open Mail & Send
              </button>
            </div>
          </div>
        </CustomModal>
      )}

      {/* Assign Students Modal */}
      {assigningBatch && (
        <CustomModal
          isOpen={!!assigningBatch}
          onClose={() => { setAssigningBatch(null); setSelectedStudentIds([]); }}
          title={`Assign Students to ${assigningBatch.name}`}
          type="info"
          confirmText="Save Assignments"
          cancelText="Cancel"
          onConfirm={saveStudentAssignments}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '480px', overflowY: 'auto', padding: '6px 2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-alt)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Selected: <strong style={{ color: selectedStudentIds.length > (assigningBatch.max_students || 30) ? '#EF4444' : 'var(--primary-color)' }}>{selectedStudentIds.length}</strong> / {assigningBatch.max_students || 30} max capacity
              </span>
              <button 
                type="button" 
                onClick={() => {
                  if (selectedStudentIds.length === allStudentsForAssign.length) {
                    setSelectedStudentIds([]);
                  } else {
                    setSelectedStudentIds(allStudentsForAssign.map(s => s.id));
                  }
                }}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12.5px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {selectedStudentIds.length === allStudentsForAssign.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Select students to enroll in <strong>{assigningBatch.name}</strong> ({assigningBatch.code || 'Batch'}). Unchecking an enrolled student removes them from this batch.
            </p>

            {allStudentsForAssign.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '24px 0', margin: 0 }}>No registered student accounts found.</p>
            ) : (
              allStudentsForAssign.map(student => {
                const isChecked = selectedStudentIds.includes(student.id);
                return (
                  <div
                    key={student.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      background: isChecked ? 'rgba(108,60,240,0.05)' : 'var(--surface-alt)',
                      borderRadius: '12px',
                      border: `1.5px solid ${isChecked ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onClick={() => toggleStudentAssign(student.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '13.5px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {student.name}
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                        ID: {student.rollNumber || 'N/A'} · {student.email}
                      </span>
                    </div>
                    {student.batch_name && student.batch_id !== assigningBatch.id && (
                      <span style={{ fontSize: '10.5px', background: 'rgba(245,158,11,0.1)', color: '#D97706', padding: '3px 8px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        In: {student.batch_name}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CustomModal>
      )}

      {/* Audit Modal */}
      {attendanceStudent && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Attendance Audit Logs</h3>
              <button className="modal-close-red" onClick={() => setAttendanceStudent(null)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Student: <strong>{attendanceStudent.name}</strong> | 
                Roll Number: <strong>{attendanceStudent.rollNumber}</strong> | Attendance Rate: <strong>{attendanceStudent.attendance?.percentage}%</strong>
              </p>
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '8px' }}>Date</th>
                      <th style={{ padding: '8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((log, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px' }}>{new Date(log.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
                        <td style={{ padding: '8px' }}>
                          <span className={`badge-status ${log.status === 'Present' ? 'paid' : 'unpaid'}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setAttendanceStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Edit Student Account</h3>
              <button className="modal-close-red" onClick={() => setEditingStudent(null)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={saveStudentEdit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="editName">Full Name</label>
                    <input id="editName" type="text" className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editEmail">Email Address</label>
                    <input id="editEmail" type="email" className="form-input" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editPhone">Mobile Number (Login ID)</label>
                    <input id="editPhone" type="text" className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editPassword">Change Password (Optional)</label>
                    <input id="editPassword" type="password" className="form-input" placeholder="Leave blank to keep unchanged" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editRollNumber">Roll Number / Student ID (Read Only)</label>
                    <input id="editRollNumber" type="text" className="form-input" value={editRollNumber} readOnly style={{ cursor: 'default', background: 'var(--surface-alt)', opacity: 0.9 }} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editCourse">Course Name</label>
                    <select id="editCourse" className="form-select" value={editCourse} onChange={(e) => setEditCourse(e.target.value)}>
                      {courseTitles.length === 0 ? (
                        <option value="">No courses available</option>
                      ) : (
                        <>
                          <option value="">-- Select Course --</option>
                          {courseTitles.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editBatch">Assign Batch</label>
                    <select id="editBatch" className="form-select" value={editBatchId} onChange={(e) => setEditBatchId(e.target.value)}>
                      <option value="">-- No Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="editProfilePic">Profile Photo URL (Optional)</label>
                    <input id="editProfilePic" type="text" className="form-input" placeholder="e.g. https://domain.com/photo.jpg" value={editProfilePic} onChange={(e) => setEditProfilePic(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editCollege">College</label>
                    <input id="editCollege" type="text" className="form-input" value={editCollege} onChange={(e) => setEditCollege(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editCompany">Company (Optional)</label>
                    <input id="editCompany" type="text" className="form-input" placeholder="Current employer" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLocation">Current Location</label>
                    <input id="editLocation" type="text" className="form-input" placeholder="e.g. Bangalore, India" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editAddress">Permanent Address</label>
                    <input id="editAddress" type="text" className="form-input" placeholder="Full residential address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editFeesStatus">Fee Ledger Status</label>
                    <select id="editFeesStatus" className="form-select" value={editFeesStatus} onChange={(e) => setEditFeesStatus(e.target.value)}>
                      <option value="Pending Payment">Pending Payment</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editAccountStatus">Account Status</label>
                    <select id="editAccountStatus" className="form-select" value={editAccountStatus} onChange={(e) => setEditAccountStatus(e.target.value)}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fees Modal */}
      {editingFeesStudent && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Edit Fees Details</h3>
              <button className="modal-close-red" onClick={() => setEditingFeesStudent(null)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={saveFeesEdit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="editTotal">Total Fees (₹)</label>
                    <input id="editTotal" type="number" className="form-input" value={editTotal} onChange={(e) => setEditTotal(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editPaid">Paid Amount (₹)</label>
                    <input id="editPaid" type="number" className="form-input" value={editPaid} onChange={(e) => setEditPaid(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editStatus">Payment Status</label>
                    <select id="editStatus" className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                      <option value="Pending Payment">Pending Payment</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editPayDate">Payment Date</label>
                    <input id="editPayDate" type="date" className="form-input" value={editPayDate} onChange={(e) => setEditPayDate(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingFeesStudent(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Ledger Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Live Class Modal */}
      {editingLiveClass && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Edit Live Lecture</h3>
              <button className="modal-close-red" onClick={() => setEditingLiveClass(null)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={saveLiveClassEdit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group grid-col-span-2">
                    <label className="form-label">Target Batch</label>
                    <CustomDropdown
                      label="Target Batch"
                      value={editLiveBatchId}
                      onChange={(val) => {
                        setEditLiveBatchId(val);
                        if (val && !editLiveInstructor) {
                          const chosenBatch = batches.find(b => b.id === val);
                          if (chosenBatch && (chosenBatch.instructor || chosenBatch.trainer_name)) {
                            setEditLiveInstructor(chosenBatch.instructor || chosenBatch.trainer_name);
                          }
                        }
                      }}
                      width="100%"
                      placeholder="-- Select Target Batch --"
                      options={[
                        { value: '', label: '-- General / All Batches --' },
                        ...batches.map(b => ({ value: b.id, label: `${b.name} (${b.code || b.id})` }))
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLiveTitle">Session Title</label>
                    <input id="editLiveTitle" type="text" className="form-input" value={editLiveTitle} onChange={(e) => setEditLiveTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLiveInstructor">Trainer Name</label>
                    <input
                      id="editLiveInstructor"
                      list="editFacultyDatalist"
                      type="text"
                      className="form-input"
                      placeholder="Select trainer or enter name..."
                      value={editLiveInstructor}
                      onChange={(e) => setEditLiveInstructor(e.target.value)}
                      required
                    />
                    <datalist id="editFacultyDatalist">
                      {trainers.map((t, idx) => (
                        <option key={t.id || idx} value={t.name || t.fullName || t.trainer_name}>
                          {t.specialization ? `${t.name || t.fullName} (${t.specialization})` : (t.name || t.fullName)}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLiveDate">Date</label>
                    <input id="editLiveDate" type="date" className="form-input" value={editLiveDate} onChange={(e) => setEditLiveDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLiveTime">Time</label>
                    <input id="editLiveTime" type="time" className="form-input" value={editLiveTime} onChange={(e) => setEditLiveTime(e.target.value)} required />
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="editLiveMeetLink">Meeting Link (Google Meet / Zoom) *</label>
                    <input
                      id="editLiveMeetLink"
                      type="url"
                      className="form-input"
                      placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                      value={editLiveMeetLink}
                      onChange={(e) => setEditLiveMeetLink(e.target.value)}
                      required
                    />
                    {editLiveMeetLink && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        {editLiveMeetLink.toLowerCase().includes('zoom.us') ? (
                          <span style={{ color: '#0b5cff', fontWeight: 600 }}>🔵 Zoom Meeting link detected</span>
                        ) : editLiveMeetLink.toLowerCase().includes('meet.google.com') ? (
                          <span style={{ color: '#00875a', fontWeight: 600 }}>🟢 Google Meet link detected</span>
                        ) : (
                          <span style={{ color: '#6C3CF0', fontWeight: 600 }}>🔗 Meeting link detected</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editLiveStatusSelect">Class Status</label>
                    <select id="editLiveStatusSelect" className="form-select" value={editLiveStatus} onChange={(e) => setEditLiveStatus(e.target.value)}>
                      <option value="Upcoming">Upcoming</option>
                      <option value="Live">Live</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="editLiveDescription">Description</label>
                    <textarea id="editLiveDescription" className="form-input" style={{ height: '100px', resize: 'none' }} value={editLiveDescription} onChange={(e) => setEditLiveDescription(e.target.value)} />
                  </div>
                  <div className="form-group grid-col-span-2" style={{ flexDirection: 'row', gap: '24px', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input id="editLiveToday" type="checkbox" checked={editLiveToday} onChange={(e) => setEditLiveToday(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="editLiveToday" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Happening Today?</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input id="editLivePublished" type="checkbox" checked={editLivePublished} onChange={(e) => setEditLivePublished(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="editLivePublished" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Published?</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingLiveClass(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Live Lecture</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Announcement Modal */}
      {editingAnnouncement && (
        <div className="modal-overlay">
          <div className="modal-content modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Edit Announcement Notice</h3>
              <button className="modal-close-red" onClick={() => setEditingAnnouncement(null)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={saveAnnouncementEdit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="editAnnTitle">Notice Title</label>
                    <input id="editAnnTitle" type="text" className="form-input" value={editAnnTitle} onChange={(e) => setEditAnnTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="editAnnPriority">Priority Level</label>
                    <select id="editAnnPriority" className="form-select" value={editAnnPriority} onChange={(e) => setEditAnnPriority(e.target.value)}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '30px' }}>
                    <input id="editAnnPinned" type="checkbox" checked={editAnnPinned} onChange={(e) => setEditAnnPinned(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="editAnnPinned" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>Pin Announcement?</label>
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="editAnnContent">Message Content</label>
                    <textarea id="editAnnContent" className="form-input" style={{ height: '100px', resize: 'none' }} value={editAnnContent} onChange={(e) => setEditAnnContent(e.target.value)} required />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingAnnouncement(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Announcement</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Student Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Create Student Account</h3>
              <button className="modal-close-red" onClick={() => setShowCreateModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateStudentSubmit}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="createName">Student Name *</label>
                    <input id="createName" type="text" className="form-input" placeholder="e.g. John Doe" value={createName} onChange={(e) => setCreateName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createEmail">Email Address * <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>(used to sign in)</span></label>
                    <input id="createEmail" type="email" className="form-input" placeholder="john.doe@example.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createPhone">Mobile Number <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>(optional contact)</span></label>
                    <input
                      id="createPhone"
                      type="tel"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={createPhone}
                      onChange={(e) => setCreatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      maxLength={10}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createTempPassword">Temporary Password *</label>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input id="createTempPassword" type="text" className="form-input" value={createTempPassword} readOnly required style={{ width: 'calc(100% - 60px)', height: '44px', fontFamily: 'monospace', letterSpacing: '0.5px', background: 'var(--surface-alt)', cursor: 'default', flexGrow: 1 }} />
                      <button type="button" className="btn btn-outline" style={{ width: '44px', height: '44px', marginLeft: '12px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }} onClick={() => setCreateTempPassword(generateRandomPassword())} title="Regenerate Password">
                        <RefreshCw size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createCourse">Course *</label>
                    <select id="createCourse" className="form-select" value={createCourse} onChange={(e) => setCreateCourse(e.target.value)} required>
                      {courseTitles.length === 0 ? (
                        <option value="">No courses available</option>
                      ) : (
                        <>
                          <option value="">-- Select Course --</option>
                          {courseTitles.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createBatch">Batch *</label>
                    <select id="createBatch" className="form-select" value={createBatchId} onChange={(e) => setCreateBatchId(e.target.value)} required>
                      <option value="">-- Select Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createDob">Date of Birth</label>
                    <input id="createDob" type="date" className="form-input" value={createDob} onChange={(e) => setCreateDob(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createGender">Gender</label>
                    <select id="createGender" className="form-select" value={createGender} onChange={(e) => setCreateGender(e.target.value)}>
                      <option value="">-- Select Gender --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createCity">City</label>
                    <input id="createCity" type="text" className="form-input" placeholder="e.g. Bangalore, Chennai" value={createCity} onChange={(e) => setCreateCity(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createLocation">Current Location / Address</label>
                    <input id="createLocation" type="text" className="form-input" placeholder="e.g. Indiranagar, Bangalore" value={createLocation} onChange={(e) => setCreateLocation(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createGuardianName">Guardian Name</label>
                    <input id="createGuardianName" type="text" className="form-input" placeholder="Parent or Guardian name" value={createGuardianName} onChange={(e) => setCreateGuardianName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="createGuardianPhone">Guardian Contact Phone</label>
                    <input id="createGuardianPhone" type="tel" className="form-input" placeholder="e.g. 9876543210" value={createGuardianPhone} onChange={(e) => setCreateGuardianPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} maxLength={10} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Credentials Modal */}
      {createdCredentials && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm">
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>Student Created Successfully</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
                Account created. Share the credentials or send a welcome email to the student below.
              </p>
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Email Address (sign-in)</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{createdCredentials.email}</strong>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Student ID</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{createdCredentials.username}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Temporary Password</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{createdCredentials.password}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-outline" style={{ height: '40px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdCredentials.email}\nStudent ID: ${createdCredentials.username}\nTemporary Password: ${createdCredentials.password}`);
                  showModal("Copied", "Credentials copied to clipboard!", "success");
                }}>
                  📋 Copy Credentials
                </button>

                {createdCredentials.email && (
                  <button className="btn btn-outline" style={{ height: '40px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                    sendStudentWelcomeEmail(createdCredentials, createdCredentials.password);
                  }}>
                    ✉ Resend Welcome Email
                  </button>
                )}

                <button className="btn btn-primary" style={{ height: '40px', marginTop: '4px' }} onClick={() => setCreatedCredentials(null)}>
                  ✓ Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Created Trainer Credentials Modal */}
      {createdTrainerCredentials && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm">
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10B981' }}>
                <CheckCircle size={32} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>Trainer Account Created Successfully</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px' }}>
                Account created. Share the credentials below or send the welcome email to the trainer.
              </p>
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'left', marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Trainer ID</span>
                  <strong style={{ fontSize: '14px', color: 'var(--primary-color)' }}>{createdTrainerCredentials.trainerId}</strong>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Email Address</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{createdTrainerCredentials.email}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>Temporary Password</span>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>{createdTrainerCredentials.password}</strong>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button className="btn btn-outline" style={{ height: '40px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => {
                  navigator.clipboard.writeText(`Email: ${createdTrainerCredentials.email}\nTrainer ID: ${createdTrainerCredentials.trainerId}\nTemporary Password: ${createdTrainerCredentials.password}`);
                  showModal("Copied", "Trainer credentials copied to clipboard!", "success");
                }}>
                  📋 Copy Credentials
                </button>

                {createdTrainerCredentials.email && (
                  <button className="btn btn-outline" style={{ height: '40px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }} onClick={() => {
                    sendTrainerWelcomeEmail(createdTrainerCredentials, createdTrainerCredentials.password);
                  }}>
                    ✉ Send Welcome Email
                  </button>
                )}

                <button className="btn btn-primary" style={{ height: '40px', marginTop: '4px' }} onClick={() => setCreatedTrainerCredentials(null)}>
                  ✓ Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Credentials Modal */}
      {resetCredentials && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content modal-sm">
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(108,60,240,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary-color)' }}>
                <RefreshCw size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px' }}>Temporary Password Generated</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 24px' }}>
                The student's password has been reset. Share this temporary password. They will be forced to change it on their next login.
              </p>
              <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>New Temporary Password</span>
                <strong style={{ fontSize: '18px', color: 'var(--text-primary)', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{resetCredentials.password}</strong>
              </div>
              <button className="btn btn-primary btn-block" style={{ height: '40px' }} onClick={() => {
                navigator.clipboard.writeText(resetCredentials.password);
                showModal("Copied", "Temporary password copied to clipboard!", "success");
                setResetCredentials(null);
              }}>
                Copy & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {showDetailsModal && selectedStudentDetails && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Student Profile Details</h3>
              <button className="modal-close-red" onClick={() => { setShowDetailsModal(false); setSelectedStudentDetails(null); }} aria-label="Close modal"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
                {/* Left Column: Profile Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
                  <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: 'var(--shadow-card)', marginBottom: '12px' }}>
                    {(selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl) && (selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl).trim() !== '' ? (
                      <img src={selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl} alt={selectedStudentDetails.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{selectedStudentDetails.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 4px', color: 'var(--text-primary)' }}>{selectedStudentDetails.name}</h4>
                  <code style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'block', marginBottom: '14px' }}>{selectedStudentDetails.rollNumber}</code>
                  
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px', textAlign: 'left' }}>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Attendance</span>
                      <strong style={{ fontSize: '13px', color: 'var(--primary-color)' }}>{selectedStudentDetails.attendance}% Rate</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Fee Status</span>
                      <span className={`badge-status-fixed ${selectedStudentDetails.feesStatus === 'Paid' ? 'paid' : 'unpaid'}`} style={{ fontSize: '10.5px', marginTop: '3px', display: 'inline-flex' }}>
                        {selectedStudentDetails.feesStatus || 'Pending'}
                      </span>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-outline" 
                      style={{ width: '100%', marginTop: '6px', fontSize: '11.5px', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 700 }}
                      onClick={() => sendStudentWelcomeEmail(selectedStudentDetails)}
                    >
                      ✉ Resend Credentials
                    </button>
                  </div>

                  <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', paddingTop: '14px', textAlign: 'left', marginTop: '14px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Active Devices</span>
                    {studentSessions.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No active devices</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {studentSessions.map(session => (
                          <div key={session._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', background: 'var(--surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {session.device_type === 'mobile' ? '📱 ' : '💻 '}
                                {session.device_label || 'Unknown Device'}
                              </span>
                              <span style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                                Active: {new Date(session.last_active).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => revokeStudentSession(session._id, selectedStudentDetails.id)}
                              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontSize: '9.5px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', cursor: 'pointer' }}
                            >
                              Revoke
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Profile Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Academic & Personal Details</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Student ID / Roll No</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700 }}>{selectedStudentDetails.rollNumber}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Admission Date</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.join_date || 'N/A'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Email Address</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600, wordBreak: 'break-all' }}>{selectedStudentDetails.email}</p>
                        <div style={{ background: '#F1F5F9', padding: '6px 10px', borderRadius: '8px', border: '1px solid #CBD5E1', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>Pass: <strong>{selectedStudentDetails.password || selectedStudentDetails.tempPassword || selectedStudentDetails.initialPassword || selectedStudentDetails.rawPassword || 'Student@123'}</strong></span>
                          <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '11px', color: '#4568F5', fontWeight: 700 }} onClick={() => { navigator.clipboard.writeText(selectedStudentDetails.password || selectedStudentDetails.tempPassword || selectedStudentDetails.initialPassword || selectedStudentDetails.rawPassword || 'Student@123'); showModal('Copied', 'Password copied!', 'info'); }}>Copy</button>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Mobile Number</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.phone || 'None'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Course Enrolled</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.course}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Assigned Batch</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.batch_name || 'Not Assigned'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>College</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.college || 'Levlox Academy'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Company</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.company || 'N/A'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Current Location</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.current_location || 'N/A'}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Permanent Address</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 600 }}>{selectedStudentDetails.permanent_address || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Recorded Lessons Progress</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ flex: 1, height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${selectedStudentDetails.progress?.percentage || 0}%`, height: '100%', background: 'var(--primary-color)', borderRadius: '4px' }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{selectedStudentDetails.progress?.percentage || 0}% ({selectedStudentDetails.progress?.completed}/{selectedStudentDetails.progress?.total})</span>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 10px', borderBottom: '1px solid var(--border-light)', paddingBottom: '4px' }}>Recent Portal Activity</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                      {selectedStudentDetails.recent_activities?.length === 0 ? (
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>No recent activities found.</p>
                      ) : (
                        selectedStudentDetails.recent_activities?.map((act, index) => (
                          <div key={index} style={{ padding: '8px', background: 'var(--surface-alt)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, display: 'block' }}>{act.type}</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{act.title}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{act.date}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
                onClick={() => sendStudentWelcomeEmail(selectedStudentDetails)}
              >
                ✉ Resend Credentials Mail
              </button>
              <button type="button" className="btn btn-primary" onClick={() => { setShowDetailsModal(false); setSelectedStudentDetails(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Global alert/notification modal */}
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

      {/* Custom Delete Confirmation Modal */}
      {studentToDelete && (
        <div 
          className="confirm-modal-overlay" 
          onClick={() => setStudentToDelete(null)}
        >
          <div 
            className="confirm-modal-card" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">
              <TriangleAlert size={28} />
            </div>
            <h3 className="confirm-modal-title">Delete Student</h3>
            <p className="confirm-modal-text">
              Are you sure you want to delete this student?<br />
              This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button 
                type="button"
                className="confirm-modal-btn btn-cancel" 
                disabled={isDeletingStudent}
                onClick={() => setStudentToDelete(null)}
              >
                Cancel
              </button>
              <button 
                type="button"
                className="confirm-modal-btn btn-delete" 
                disabled={isDeletingStudent}
                onClick={executeDeleteStudent}
              >
                {isDeletingStudent ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Creation/Edit Modal */}
      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-color)' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0, fontSize: '18px' }}>
                    {editingBatch ? 'Edit Batch Configuration' : 'Create New Institutional Batch'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Set course duration, daily schedule timing, and cohort seats
                  </p>
                </div>
              </div>
              <button className="modal-close-red" onClick={() => {
                setShowBatchModal(false);
                setEditingBatch(null);
                resetBatchForm();
              }} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={editingBatch ? saveBatchEdit : createBatch}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="modal-form-grid">
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="batchName">Batch Name / Identifier</label>
                    <input id="batchName" type="text" className="form-input" value={batchName} onChange={(e) => setBatchName(e.target.value)} placeholder="e.g. Fullstack MERN Web Dev - Alpha (50 Days)" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchCourseName">Course Title</label>
                    <select id="batchCourseName" className="form-select" value={batchCourseName} onChange={(e) => setBatchCourseName(e.target.value)} required>
                      <option value="">-- Select Course --</option>
                      {courseTitles.map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchTrainerName">Trainer / Instructor</label>
                    <select id="batchTrainerName" className="form-select" value={batchTrainerName} onChange={(e) => setBatchTrainerName(e.target.value)} required>
                      <option value="">-- Select Trainer --</option>
                      {trainers.length > 0 ? (
                        trainers.map((t, i) => (
                          <option key={i} value={t.name}>{t.name} ({t.trainerId || t.code || 'TRN'})</option>
                        ))
                      ) : (
                        ['Aakash', 'Dr. Sarah Jenkins', 'Rajesh Kumar'].map((t, i) => (
                          <option key={i} value={t}>{t}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchStartDate">Batch Start Date</label>
                    <input
                      id="batchStartDate"
                      type="date"
                      className="form-input"
                      value={batchStartDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setBatchStartDate(newStart);
                        if (newStart && batchDurationDays) {
                          setBatchEndDate(addDaysToDate(newStart, batchDurationDays));
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Batch Duration in Days with Quick Presets */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="batchDurationDays">
                      Duration in Days
                    </label>
                    <input
                      id="batchDurationDays"
                      type="number"
                      min="1"
                      max="365"
                      className="form-input"
                      value={batchDurationDays}
                      onChange={(e) => {
                        const days = Math.max(1, parseInt(e.target.value, 10) || 1);
                        setBatchDurationDays(days);
                        if (batchStartDate) {
                          setBatchEndDate(addDaysToDate(batchStartDate, days));
                        }
                      }}
                      placeholder="e.g. 50"
                      required
                    />
                  </div>

                  {/* Duration Presets Row */}
                  <div className="form-group grid-col-span-2" style={{ marginTop: '-6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>Quick Presets:</span>
                      {[30, 45, 50, 60, 90].map((days) => (
                        <button
                          key={days}
                          type="button"
                          className={`duration-preset-pill ${Number(batchDurationDays) === days ? 'active' : ''}`}
                          onClick={() => {
                            setBatchDurationDays(days);
                            if (batchStartDate) {
                              setBatchEndDate(addDaysToDate(batchStartDate, days));
                            }
                          }}
                        >
                          {days} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchEndDate">Calculated End Date</label>
                    <input
                      id="batchEndDate"
                      type="date"
                      className="form-input"
                      value={batchEndDate}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        setBatchEndDate(newEnd);
                        if (batchStartDate && newEnd) {
                          setBatchDurationDays(getDaysBetween(batchStartDate, newEnd));
                        }
                      }}
                      required
                    />
                  </div>

                  {/* Daily Timing Input & Presets */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="batchTimingInput">Daily Class Timing</label>
                    <input
                      id="batchTimingInput"
                      type="text"
                      className="form-input"
                      value={batchTiming}
                      onChange={(e) => setBatchTiming(e.target.value)}
                      placeholder="e.g. 10:00 AM - 12:00 PM"
                      required
                    />
                  </div>

                  <div className="form-group grid-col-span-2" style={{ marginTop: '-6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>Timing Presets:</span>
                      {[
                        '09:00 AM - 11:00 AM',
                        '10:00 AM - 12:00 PM',
                        '11:30 AM - 01:30 PM',
                        '02:00 PM - 04:00 PM',
                        '06:00 PM - 08:00 PM'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={`duration-preset-pill ${batchTiming === preset ? 'active' : ''}`}
                          onClick={() => setBatchTiming(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchStatusSelect">Batch Status</label>
                    <select id="batchStatusSelect" className="form-select" value={batchStatus} onChange={(e) => setBatchStatus(e.target.value)}>
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="batchMaxStudents">Maximum Seats</label>
                    <input id="batchMaxStudents" type="number" className="form-input" value={batchMaxStudents} onChange={(e) => setBatchMaxStudents(e.target.value)} required />
                  </div>
                </div>

                {/* Duration Summary Pill */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Timer size={18} color="var(--primary-color)" />
                  <span style={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                    This batch runs for <strong>{batchDurationDays || 50} days</strong> ({formatReadableDate(batchStartDate)} ➔ {formatReadableDate(batchEndDate)}), scheduled daily at <strong>{batchTiming}</strong>.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowBatchModal(false);
                  setEditingBatch(null);
                  resetBatchForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBatch ? 'Save Batch Changes' : 'Confirm New Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extend Batch Modal */}
      {showExtendModal && extendingBatch && (() => {
        const currentDuration = Number(extendingBatch.duration_days) || (extendingBatch.start_date && extendingBatch.end_date ? getDaysBetween(extendingBatch.start_date, extendingBatch.end_date) : 50);
        const today = formatLocalDate(new Date());
        const currentEnd = extendingBatch.end_date || today;
        const baseDate = (currentEnd < today) ? today : currentEnd;
        const calculatedNewEnd = addDaysToDate(baseDate, extendDays);
        const calculatedTotalDays = currentDuration + Number(extendDays);
        const isPast = currentEnd < today;

        return (
          <div className="modal-overlay">
            <div className="modal-content modal-lg" style={{ maxWidth: '600px' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <FastForward size={22} />
                  </div>
                  <div>
                    <h3 className="modal-title" style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>
                      Extend Batch Duration & Timing
                    </h3>
                    <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {extendingBatch.name} · <strong style={{ color: 'var(--primary-color)' }}>{extendingBatch.code}</strong>
                    </p>
                  </div>
                </div>
                <button className="modal-close-red" onClick={() => { setShowExtendModal(false); setExtendingBatch(null); }} aria-label="Close modal">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleConfirmExtendBatch}>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px', padding: '20px 24px' }}>
                  
                  {/* Current Batch Snapshot */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '14px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                      Current Batch Parameters
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', fontSize: '12.5px' }}>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Course</span>
                        <strong>{extendingBatch.course_name || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current Duration</span>
                        <strong>{currentDuration} Days</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current End Date</span>
                        <strong style={{ color: isPast ? '#ef4444' : '#0f172a' }}>
                          {formatReadableDate(extendingBatch.end_date)} {isPast ? '(Ended)' : ''}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current Timing</span>
                        <strong>{extendingBatch.timing || '10:00 AM - 12:00 PM'}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Duration Extension Options */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                      Extra Duration to Add (in Days)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {[7, 15, 30, 50].map((d) => (
                        <button
                          key={d}
                          type="button"
                          className={`duration-preset-pill ${Number(extendDays) === d ? 'active' : ''}`}
                          onClick={() => setExtendDays(d)}
                        >
                          +{d} Days
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        className="form-input"
                        value={extendDays}
                        onChange={(e) => setExtendDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        placeholder="e.g. 15 or 30"
                        required
                        style={{ paddingLeft: '40px' }}
                      />
                      <Timer size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>

                  {/* Live End Date Preview Banner */}
                  <div style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)', border: '1.5px solid #A7F3D0', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#047857', display: 'block' }}>
                        Projected Extension Outcome
                      </span>
                      <span style={{ fontSize: '13.5px', color: '#065F46', fontWeight: 700 }}>
                        New End Date: <strong>{formatReadableDate(calculatedNewEnd)}</strong> · Total: <strong>{calculatedTotalDays} Days</strong>
                      </span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                        Batch will automatically be reactivated as <strong>Active</strong>.
                      </span>
                    </div>
                  </div>

                  {/* Daily Class Timing Adjustment */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                      Batch Timing (Daily Schedule)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {[
                        '09:00 AM - 11:00 AM',
                        '10:00 AM - 12:00 PM',
                        '11:30 AM - 01:30 PM',
                        '02:00 PM - 04:00 PM',
                        '06:00 PM - 08:00 PM'
                      ].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className={`duration-preset-pill ${extendTiming === preset ? 'active' : ''}`}
                          onClick={() => setExtendTiming(preset)}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={extendTiming}
                        onChange={(e) => setExtendTiming(e.target.value)}
                        placeholder="e.g. 10:00 AM - 12:30 PM"
                        required
                        style={{ paddingLeft: '40px' }}
                      />
                      <Clock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    </div>
                  </div>

                  {/* Extension Reason */}
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '13px' }}>
                      Reason / Note for Extension (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={extendReason}
                      onChange={(e) => setExtendReason(e.target.value)}
                      placeholder="e.g. Additional hands-on project sprint and revision classes"
                    />
                  </div>

                </div>

                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={isExtending}
                    onClick={() => { setShowExtendModal(false); setExtendingBatch(null); }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isExtending}
                    style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', minWidth: '160px' }}
                  >
                    {isExtending ? 'Extending Batch...' : `Confirm +${extendDays} Days Extension`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Schedule Live Class Modal */}
      {showLiveClassModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Schedule Live Lecture</h3>
              <button className="modal-close-red" onClick={() => setShowLiveClassModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={addLiveClassHandler}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group grid-col-span-2">
                    <label className="form-label">Target Batch</label>
                    <CustomDropdown
                      label="Target Batch"
                      value={selectedBatchId}
                      onChange={(val) => {
                        setSelectedBatchId(val);
                        if (val) {
                          const chosenBatch = batches.find(b => b.id === val);
                          if (chosenBatch && (chosenBatch.instructor || chosenBatch.trainer_name) && !liveInstructor) {
                            setLiveInstructor(chosenBatch.instructor || chosenBatch.trainer_name);
                          }
                        }
                      }}
                      width="100%"
                      placeholder="-- Choose Batch --"
                      options={[
                        { value: '', label: '-- Choose Batch --' },
                        ...batches.map(b => ({ value: b.id, label: `${b.name} (${b.code})` }))
                      ]}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="liveTitle">Lecture Title</label>
                    <input id="liveTitle" type="text" className="form-input" placeholder="e.g. Intro to React" value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="liveInstructor">Lead Faculty</label>
                    <input
                      id="liveInstructor"
                      list="facultyDatalist"
                      type="text"
                      className="form-input"
                      placeholder="Select trainer or enter name..."
                      value={liveInstructor}
                      onChange={(e) => setLiveInstructor(e.target.value)}
                      required
                    />
                    <datalist id="facultyDatalist">
                      {trainers.map((t, idx) => (
                        <option key={t.id || idx} value={t.name || t.fullName || t.trainer_name}>
                          {t.specialization ? `${t.name || t.fullName} (${t.specialization})` : (t.name || t.fullName)}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="liveDate">Date</label>
                    <input id="liveDate" type="date" className="form-input" value={liveDate} onChange={(e) => setLiveDate(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="liveTime">Time / Schedule</label>
                    <input id="liveTime" type="time" className="form-input" value={liveTime} onChange={(e) => setLiveTime(e.target.value)} required />
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="liveUrl">Meeting Link (Google Meet / Zoom) *</label>
                    <input
                      id="liveUrl"
                      type="url"
                      className="form-input"
                      placeholder="https://meet.google.com/... or https://zoom.us/j/..."
                      value={liveUrl}
                      onChange={(e) => setLiveUrl(e.target.value)}
                      required
                    />
                    {liveUrl && (
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        {liveUrl.toLowerCase().includes('zoom.us') ? (
                          <span style={{ color: '#0b5cff', fontWeight: 600 }}>🔵 Zoom Meeting link detected</span>
                        ) : liveUrl.toLowerCase().includes('meet.google.com') ? (
                          <span style={{ color: '#00875a', fontWeight: 600 }}>🟢 Google Meet link detected</span>
                        ) : (
                          <span style={{ color: '#6C3CF0', fontWeight: 600 }}>🔗 Meeting link detected</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Class Status</label>
                    <CustomDropdown
                      label="Class Status"
                      value={liveStatus}
                      onChange={(val) => setLiveStatus(val)}
                      width="100%"
                      options={[
                        { value: 'Upcoming', label: 'Upcoming' },
                        { value: 'Live', label: 'Live' },
                        { value: 'Completed', label: 'Completed' }
                      ]}
                    />
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="liveDescription">Description</label>
                    <textarea id="liveDescription" className="form-input" style={{ height: '100px', resize: 'none' }} placeholder="Brief overview of lecture contents..." value={liveDescription} onChange={(e) => setLiveDescription(e.target.value)} />
                  </div>
                  <div className="form-group grid-col-span-2" style={{ flexDirection: 'row', gap: '24px', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input id="liveToday" type="checkbox" checked={liveToday} onChange={(e) => setLiveToday(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="liveToday" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Happening Today?</label>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input id="livePublished" type="checkbox" checked={livePublished} onChange={(e) => setLivePublished(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <label htmlFor="livePublished" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>Publish Stream</label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowLiveClassModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">Confirm Live Lecture</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Edit Custom Playlist Modal */}
      {showPlaylistModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingPlaylist ? 'Edit Custom Playlist' : 'Create Custom Playlist'}
              </h3>
              <button 
                className="modal-close-red" 
                onClick={() => {
                  setShowPlaylistModal(false);
                  setEditingPlaylist(null);
                  setPlaylistFormName('');
                  setPlaylistFormCourse('');
                  setPlaylistFormDescription('');
                  setPlaylistFormAccess('all');
                  setPlaylistFormBatchId('');
                }} 
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSavePlaylist}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Playlist Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={playlistFormName}
                    onChange={(e) => setPlaylistFormName(e.target.value)}
                    placeholder="e.g. Interview Preparation & Mock Interviews"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course / Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={playlistFormCourse}
                    onChange={(e) => setPlaylistFormCourse(e.target.value)}
                    placeholder="e.g. Career & Placements, Fullstack Engineering"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Playlist Description</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={playlistFormDescription}
                    onChange={(e) => setPlaylistFormDescription(e.target.value)}
                    placeholder="Describe what students will learn in this custom playlist..."
                  />
                </div>

                {/* Playlist Thumbnail (Cover Image) */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <label className="form-label" style={{ margin: 0 }}>Playlist Thumbnail (Cover Banner)</label>
                    <span style={{ fontSize: 11, color: '#64748B' }}>Shown with transparent overlay</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="playlistThumbType"
                        value="url"
                        checked={playlistThumbnailType === 'url'}
                        onChange={() => setPlaylistThumbnailType('url')}
                      />
                      <span>Image URL / Link</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="playlistThumbType"
                        value="upload"
                        checked={playlistThumbnailType === 'upload'}
                        onChange={() => setPlaylistThumbnailType('upload')}
                      />
                      <span>Upload Image File</span>
                    </label>
                  </div>

                  {playlistThumbnailType === 'url' ? (
                    <input
                      type="url"
                      className="form-input"
                      value={playlistFormThumbnail}
                      onChange={(e) => setPlaylistFormThumbnail(e.target.value)}
                      placeholder="https://images.unsplash.com/... or image link"
                    />
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-input"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            setPlaylistUploadingThumb(true);
                            const url = await uploadFile(file, 'playlists');
                            if (url) setPlaylistFormThumbnail(url);
                          } catch (err) {
                            showModal('Upload Error', err.message, 'error');
                          } finally {
                            setPlaylistUploadingThumb(false);
                          }
                        }}
                      />
                      {playlistUploadingThumb && (
                        <span style={{ fontSize: 12, color: 'var(--primary-color)', fontWeight: 600 }}>
                          Uploading thumbnail to local storage...
                        </span>
                      )}
                    </div>
                  )}

                  {/* Live Transparent Image Card Preview */}
                  {playlistFormThumbnail ? (
                    <div style={{
                      marginTop: 10,
                      borderRadius: 16,
                      overflow: 'hidden',
                      position: 'relative',
                      height: 110,
                      background: `linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.88) 100%), url(${playlistFormThumbnail}) center / cover no-repeat`,
                      border: '1px solid rgba(226, 232, 240, 0.8)',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      color: '#FFFFFF',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          background: 'rgba(255, 255, 255, 0.25)',
                          backdropFilter: 'blur(8px)',
                          WebkitBackdropFilter: 'blur(8px)',
                          padding: '3px 9px',
                          borderRadius: 999,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                        }}>
                          Transparent Cover Preview
                        </span>
                        <button
                          type="button"
                          onClick={() => setPlaylistFormThumbnail('')}
                          style={{
                            background: 'rgba(239, 68, 68, 0.85)',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 999,
                            padding: '3px 9px',
                            fontSize: 11,
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                          {playlistFormName || 'Your Playlist Title'}
                        </div>
                        <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 1 }}>
                          {playlistFormCourse || 'Curriculum Track'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, display: 'block' }}>
                      Optional: Add a custom cover image or leave blank for dynamic tech gradient.
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Audience & Access Level</label>
                  <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="playlistAccess"
                        value="all"
                        checked={playlistFormAccess === 'all'}
                        onChange={() => setPlaylistFormAccess('all')}
                      />
                      <span>🌐 All Students (Portal-Wide Access)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="playlistAccess"
                        value="batch"
                        checked={playlistFormAccess === 'batch'}
                        onChange={() => setPlaylistFormAccess('batch')}
                      />
                      <span>Cohort / Specific Batch</span>
                    </label>
                  </div>
                </div>

                {playlistFormAccess === 'batch' && (
                  <div className="form-group">
                    <label className="form-label">Select Target Batch *</label>
                    <select
                      className="form-select"
                      value={playlistFormBatchId}
                      onChange={(e) => setPlaylistFormBatchId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.course_name || b.code})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, padding: '16px 24px' }}>
                <div>
                  {editingPlaylist && (
                    <button
                      type="button"
                      onClick={() => {
                        const id = editingPlaylist.id || editingPlaylist.uid;
                        handleDeletePlaylist(id);
                      }}
                      style={{
                        background: '#FEE2E2',
                        color: '#DC2626',
                        border: '1px solid #FECACA',
                        borderRadius: 999,
                        padding: '8px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Trash2 size={14} /> Delete Playlist
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowPlaylistModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Recorded Class Modal */}
      {showRecordedClassModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRecordedClass ? 'Edit Lesson' : 'Upload New Lesson'}
              </h3>
              <button className="modal-close-red" onClick={() => {
                setShowRecordedClassModal(false);
                setEditingRecordedClass(null);
                setRecTitle(''); setRecModule('Module 1 - Python Basics'); setRecVideoUrl(''); setRecThumbnailUrl(''); setRecLessonDescription(''); setRecNotesUrl(''); setRecAssignment(''); setRecVisibility('everyone'); setRecSortOrder(''); setRecDuration('1h 30m'); setVideoSourceType('link'); setRecStudyMaterials([]);
              }} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={addRecordedClassHandler}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label className="form-label" htmlFor="recBatchSelect" style={{ margin: 0 }}>Target Playlist / Batch *</label>
                      <button
                        type="button"
                        onClick={() => setShowPlaylistModal(true)}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      >
                        + New Playlist
                      </button>
                    </div>
                    <select 
                      id="recBatchSelect" 
                      className="form-select" 
                      value={selectedBatchId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedBatchId(val);
                        if (val.startsWith('playlist:')) {
                          const plId = val.replace('playlist:', '');
                          const plObj = customPlaylists.find(p => p.id === plId || p.uid === plId);
                          if (plObj && plObj.course_name) setRecCourseTitle(plObj.course_name);
                        } else {
                          const rawBId = val.replace('batch:', '');
                          const foundB = batches.find(b => b.id === rawBId || b.uid === rawBId);
                          if (foundB && foundB.course_name) {
                            setRecCourseTitle(foundB.course_name);
                          }
                        }
                      }} 
                      required
                    >
                      <option value="">-- Choose Target Playlist --</option>
                      <optgroup label="Automatic Batch Playlists">
                        {batches.map(b => (
                          <option key={b.id} value={`batch:${b.id}`}>Batch: {b.name} ({b.course_name || b.code})</option>
                        ))}
                      </optgroup>
                      {customPlaylists.length > 0 && (
                        <optgroup label="Custom / Manual Playlists">
                          {customPlaylists.map(p => (
                            <option key={p.id} value={`playlist:${p.id}`}>Playlist: {p.name} ({p.course_name || 'General'})</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="recCourseTitle">Course Name</label>
                    <input id="recCourseTitle" type="text" className="form-input" value={recCourseTitle} onChange={(e) => setRecCourseTitle(e.target.value)} placeholder="e.g. Python Full Stack" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="recModule">Module Section</label>
                    <input id="recModule" type="text" className="form-input" value={recModule} onChange={(e) => setRecModule(e.target.value)} placeholder="e.g. Module 1 - Python Basics" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="recTitle">Lesson Title</label>
                    <input id="recTitle" type="text" className="form-input" value={recTitle} onChange={(e) => setRecTitle(e.target.value)} placeholder="e.g. Variables & Data Types" required />
                  </div>

                  {/* Video Source Type */}
                  <div className="form-group grid-col-span-2">
                    <label className="form-label">Video Source</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px', marginBottom: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="videoSourceType" value="link" checked={videoSourceType === 'link'} onChange={() => setVideoSourceType('link')} />
                        Google Drive Link / External Link
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="videoSourceType" value="upload" checked={videoSourceType === 'upload'} onChange={() => setVideoSourceType('upload')} />
                        Upload Video File
                      </label>
                    </div>

                    {videoSourceType === 'link' ? (
                      <div>
                        <input 
                          id="recVideoUrl" 
                          type="url" 
                          className="form-input" 
                          value={recVideoUrl} 
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecVideoUrl(val);
                            if (!recThumbnailUrl) {
                              const autoThumb = getResolvedThumbnail(val, '');
                              if (autoThumb && !autoThumb.includes('unsplash')) {
                                setRecThumbnailUrl(autoThumb);
                              }
                            }
                          }} 
                          placeholder="https://drive.google.com/file/d/... or YouTube link" 
                          required
                        />
                        {getGoogleDriveFileId(recVideoUrl) && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '6px 10px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                            <CheckCircle size={14} />
                            <span><strong>Google Drive link verified:</strong> Video will stream securely inside the portal with anti-download protection.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="form-input" 
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            setUploadingVideo(true);
                            const res = await handleFileUpload(file);
                            setUploadingVideo(false);
                            if (res && res.url) {
                              setRecVideoUrl(res.url);
                            }
                          }} 
                        />
                        {uploadingVideo && <span style={{ fontSize: 12, color: 'var(--primary-color)' }}>Uploading video file... Please wait.</span>}
                        {recVideoUrl && !uploadingVideo && (
                          <span style={{ fontSize: 11, color: '#059669', wordBreak: 'break-all' }}>✓ Video ready: {recVideoUrl}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="recThumbnailUrl">Thumbnail Image URL</label>
                    <input 
                      id="recThumbnailUrl" 
                      type="url" 
                      className="form-input" 
                      value={recThumbnailUrl} 
                      onChange={(e) => setRecThumbnailUrl(e.target.value)} 
                      placeholder="Custom thumbnail URL (optional, auto-generated if blank)" 
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      Leave empty to auto-use Google Drive / YouTube video thumbnail
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="recDuration">Duration</label>
                    <input id="recDuration" type="text" className="form-input" value={recDuration} onChange={(e) => setRecDuration(e.target.value)} placeholder="e.g. 1h 15m" />
                  </div>

                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="recLessonDescription">Lesson Description</label>
                    <textarea id="recLessonDescription" className="form-input" style={{ height: 60, resize: 'none' }} value={recLessonDescription} onChange={(e) => setRecLessonDescription(e.target.value)} placeholder="Brief overview of what students will learn..." />
                  </div>

                  {/* Multiple Study Materials Manager */}
                  <div className="form-group grid-col-span-2" style={{ background: 'var(--bg-secondary)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
                    <label className="form-label" style={{ fontWeight: 800 }}>Study Materials Manager</label>
                    {/* Current Materials List */}
                    {recStudyMaterials.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12, marginTop: 6 }}>
                        {recStudyMaterials.map((mat, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-light)' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                              📄 {mat.name} ({mat.type?.toUpperCase()})
                            </span>
                            <button 
                              type="button" 
                              style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                              onClick={() => setRecStudyMaterials(prev => prev.filter((_, i) => i !== index))}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Material Box */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, borderTop: '1px solid var(--border-light)', paddingTop: 10 }}>
                      <input 
                        type="text" 
                        placeholder="Material Name (e.g. Slide Lecture 1)" 
                        className="form-input" 
                        style={{ height: 36, fontSize: 12.5 }}
                        value={newMaterialName} 
                        onChange={(e) => setNewMaterialName(e.target.value)} 
                      />
                      <div style={{ display: 'flex', gap: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12, cursor: 'pointer' }}>
                          <input type="radio" name="newMaterialSourceType" value="link" checked={newMaterialSourceType === 'link'} onChange={() => setNewMaterialSourceType('link')} />
                          Drive Link
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 12, cursor: 'pointer' }}>
                          <input type="radio" name="newMaterialSourceType" value="upload" checked={newMaterialSourceType === 'upload'} onChange={() => setNewMaterialSourceType('upload')} />
                          Upload File
                        </label>
                      </div>

                      {newMaterialSourceType === 'link' ? (
                        <input 
                          type="url" 
                          placeholder="https://drive.google.com/..." 
                          className="form-input" 
                          style={{ height: 36, fontSize: 12.5 }}
                          value={newMaterialUrl} 
                          onChange={(e) => setNewMaterialUrl(e.target.value)} 
                        />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <input 
                            type="file" 
                            accept=".pdf,.docx,.ppt,.pptx,.zip,.rar,image/*" 
                            className="form-input" 
                            style={{ fontSize: 12 }}
                            onChange={async (e) => {
                              const file = e.target.files[0];
                              if (!file) return;
                              setUploadingMaterial(true);
                              const res = await handleFileUpload(file);
                              setUploadingMaterial(false);
                              if (res && res.url) {
                                setNewMaterialUrl(res.url);
                              }
                            }} 
                          />
                          {uploadingMaterial && <span style={{ fontSize: 11, color: 'var(--primary-color)' }}>Uploading file...</span>}
                        </div>
                      )}

                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ alignSelf: 'flex-start', padding: '5px 12px', fontSize: 12, height: 30 }}
                        onClick={() => {
                          if (!newMaterialName.trim() || !newMaterialUrl.trim()) {
                            showModal("Warning", "Please provide a name and a link/file for the study material.", "warning");
                            return;
                          }
                          const fileExt = newMaterialUrl.split('.').pop()?.split('?')[0]?.toLowerCase() || 'pdf';
                          setRecStudyMaterials(prev => [...prev, {
                            name: newMaterialName.trim(),
                            url: newMaterialUrl.trim(),
                            type: fileExt
                          }]);
                          setNewMaterialName('');
                          setNewMaterialUrl('');
                        }}
                      >
                        + Add Material
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="recAssignment">Assignment Title</label>
                    <input id="recAssignment" type="text" className="form-input" value={recAssignment} onChange={(e) => setRecAssignment(e.target.value)} placeholder="e.g. Variables & Operators Lab" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="recSortOrder">Sort Order</label>
                    <input id="recSortOrder" type="number" className="form-input" value={recSortOrder} onChange={(e) => setRecSortOrder(e.target.value)} placeholder="e.g. 1, 2, 3..." min="1" />
                  </div>

                  <div className="form-group grid-col-span-2">
                    <label className="form-label">Visibility Access</label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                        <input type="radio" name="recVisibility" value="everyone" checked={recVisibility === 'everyone'} onChange={() => setRecVisibility('everyone')} />
                        🌐 Everyone
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13.5px', cursor: 'pointer' }}>
                        <input type="radio" name="recVisibility" value="paid" checked={recVisibility === 'paid'} onChange={() => setRecVisibility('paid')} />
                        🔒 Paid Students Only
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowRecordedClassModal(false);
                  setEditingRecordedClass(null);
                  setRecTitle(''); setRecModule('Module 1 - Python Basics'); setRecVideoUrl(''); setRecThumbnailUrl(''); setRecLessonDescription(''); setRecNotesUrl(''); setRecAssignment(''); setRecVisibility('everyone'); setRecSortOrder(''); setRecDuration('1h 30m'); setVideoSourceType('link'); setRecStudyMaterials([]);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRecordedClass ? 'Update Lesson' : 'Save LMS Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showAnnouncementModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Publish Announcement</h3>
              <button className="modal-close-red" onClick={() => setShowAnnouncementModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={addAnnouncementHandler}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="annBatchSelect">Target Batch</label>
                    <select id="annBatchSelect" className="form-select" value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)} required style={{ height: '44px' }}>
                      <option value="">-- Choose Batch --</option>
                      <option value="all">All Batches (Broadcast to All Students & Faculty)</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="annTitle">Notice Title</label>
                    <input id="annTitle" type="text" className="form-input" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} required style={{ height: '44px' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="annPriority">Priority Level</label>
                    <select id="annPriority" className="form-select" value={annPriority} onChange={(e) => setAnnPriority(e.target.value)} style={{ height: '44px' }}>
                      <option value="Low">Low Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="High">High Priority</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ flexDirection: 'row', gap: '8px', alignItems: 'center', marginTop: '30px' }}>
                    <input id="annPinned" type="checkbox" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                    <label htmlFor="annPinned" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', fontWeight: 600 }}>Pin Announcement?</label>
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="annContent">Message Content</label>
                    <textarea id="annContent" className="form-input" style={{ height: '100px', resize: 'none' }} value={annContent} onChange={(e) => setAnnContent(e.target.value)} required />
                  </div>
                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="annAttachment">Circular / Attachment Document (Optional)</label>
                    <input
                      id="annAttachment"
                      type="file"
                      className="form-input"
                      onChange={(e) => setAnnFile(e.target.files[0] || null)}
                      style={{ padding: '8px' }}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                      Attach PDF, guidelines, syllabus or any project files for this circular
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAnnouncementModal(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={annUploading} className="btn btn-primary">
                  {annUploading ? 'Uploading & Broadcasting...' : 'Broadcast Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Award Activity Points Modal */}
      {showActivityScoreModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">Award Activity Points</h3>
              <button className="modal-close-red" onClick={() => setShowActivityScoreModal(false)} aria-label="Close modal"><X size={18} /></button>
            </div>
            <form onSubmit={handleAwardActivity}>
              <div className="modal-body">
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="actBatchSelect">Target Batch</label>
                    <select id="actBatchSelect" className="form-select" value={actBatchId} onChange={(e) => handleActBatchChange(e.target.value)} required>
                      <option value="">-- Choose Batch --</option>
                      {batches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="actStudentSelect">Select Student</label>
                    <select id="actStudentSelect" className="form-select" value={actStudentId} onChange={(e) => setActStudentId(e.target.value)} required>
                      <option value="">-- Choose Student --</option>
                      {batchStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="actDate">Date</label>
                    <input id="actDate" type="date" className="form-input" value={actDate} onChange={(e) => setActDate(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="actMeeting">Google Meet Session / Lecture Name</label>
                    <input id="actMeeting" type="text" className="form-input" value={actMeeting} onChange={(e) => setActMeeting(e.target.value)} placeholder="e.g. Python Variables Class" required />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="form-label">Activity Preset Type</label>
                      {showPresetManager ? (
                        <button 
                          type="button" 
                          className="text-link-btn" 
                          style={{ fontSize: '11px', color: '#6C3CF0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          onClick={() => setShowPresetManager(false)}
                        >
                          Close Preset Manager
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="text-link-btn" 
                          style={{ fontSize: '11px', color: '#6C3CF0', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          onClick={() => setShowPresetManager(true)}
                        >
                          ⚙️ Manage Presets
                        </button>
                      )}
                    </div>
                    <CustomDropdown
                      label="Activity Preset Type"
                      value={isCustomAct ? 'Custom' : actType}
                      onChange={(val) => {
                        if (val === 'Custom') {
                          setIsCustomAct(true);
                          setActType('');
                          setActPoints(0);
                        } else {
                          setIsCustomAct(false);
                          setActType(val);
                          const preset = activityPresets.find(p => p.label === val);
                          if (preset) {
                            setActPoints(preset.points);
                          }
                        }
                      }}
                      width="100%"
                      options={[
                        ...activityPresets.map(p => ({
                          value: p.label,
                          label: `${p.label} (${p.points > 0 ? `+${p.points}` : p.points} pts)`
                        })),
                        { value: 'Custom', label: 'Custom Activity Type' }
                      ]}
                    />

                    {showPresetManager && (
                      <div className="preset-manager-inline" style={{ marginTop: '10px', padding: '12px', border: '1px solid #E5E7EB', borderRadius: '8px', backgroundColor: '#F9FAFB' }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#374151', fontWeight: 600 }}>Dynamic Presets</h4>
                        <div style={{ maxHeight: '100px', overflowY: 'auto', marginBottom: '10px', border: '1px solid #E5E7EB', borderRadius: '4px', padding: '4px', backgroundColor: '#fff' }}>
                          {activityPresets.length === 0 ? (
                            <div style={{ fontSize: '11px', color: '#9CA3AF', padding: '4px' }}>No presets. Seeding on load...</div>
                          ) : (
                            activityPresets.map(p => (
                              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', fontSize: '11px', borderBottom: '1px solid #F3F4F6' }}>
                                <span>{p.label} ({p.points > 0 ? `+${p.points}` : p.points} pts)</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeletePreset(p.id)} 
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0 }}
                                  title="Delete Preset"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#374151', fontWeight: 600 }}>Create Preset</h4>
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="e.g. Completed Extra Lab Task" 
                            value={newPresetLabel} 
                            onChange={(e) => setNewPresetLabel(e.target.value)} 
                            style={{ flex: 2, height: '32px', fontSize: '11px', padding: '0 8px' }}
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            placeholder="Pts" 
                            value={newPresetPoints} 
                            onChange={(e) => setNewPresetPoints(e.target.value)} 
                            style={{ flex: 1, height: '32px', fontSize: '11px', padding: '0 8px' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            className="btn btn-primary" 
                            style={{ padding: '2px 10px', fontSize: '11px', height: '26px', lineHeight: '22px' }}
                            onClick={handleCreatePreset}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="actPoints">Points</label>
                    <input id="actPoints" type="number" className="form-input" value={actPoints} onChange={(e) => setActPoints(parseInt(e.target.value) || 0)} required />
                  </div>

                  {isCustomAct && (
                    <div className="form-group grid-col-span-2">
                      <label className="form-label" htmlFor="customActType">Custom Activity Title</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          id="customActType" 
                          type="text" 
                          className="form-input" 
                          placeholder="e.g. Completed Extra Lab Task" 
                          value={actType}
                          onChange={(e) => setActType(e.target.value)} 
                          required 
                          style={{ flex: 1 }}
                        />
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          style={{ padding: '0 16px', height: '44px', fontSize: '13px' }}
                          onClick={() => {
                            setIsCustomAct(false);
                            const defaultPreset = activityPresets[0];
                            setActType(defaultPreset ? defaultPreset.label : '');
                            setActPoints(defaultPreset ? defaultPreset.points : 0);
                          }}
                        >
                          Back to Presets
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="form-group grid-col-span-2">
                    <label className="form-label" htmlFor="actRemarks">Remarks</label>
                    <textarea id="actRemarks" className="form-input" style={{ height: '60px', resize: 'none' }} value={actRemarks} onChange={(e) => setActRemarks(e.target.value)} placeholder="Provide context..." />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowActivityScoreModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submittingActivity}>
                  {submittingActivity ? 'Awarding Points...' : 'Award Activity Points'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academia Modern In-Portal Course Viewer */}
      {previewRecordedClass && (() => {
        const previewPlaylistObj = {
          id: previewRecordedClass.playlist_id || selectedPlaylistBatch?.id || 'preview_playlist',
          name: selectedPlaylistBatch?.name || previewRecordedClass.course_title || 'Course Recordings',
          title: selectedPlaylistBatch?.name || previewRecordedClass.title,
          course_name: previewRecordedClass.course_title || selectedPlaylistBatch?.course_name,
          batch_name: selectedPlaylistBatch?.name || 'Academic Batch Recordings',
          lessons: (selectedPlaylistBatch && playlistLessons?.length > 0) ? playlistLessons : [previewRecordedClass],
          study_materials: selectedPlaylistBatch?.study_materials || previewRecordedClass?.study_materials || []
        };

        return (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '24px 20px',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 24,
              maxWidth: 1380,
              width: '100%',
              boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '85vh',
            }}>
              {/* Header Bar */}
              <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#6366F1',
                    background: '#EEF2FF',
                    padding: '4px 10px',
                    borderRadius: 999,
                  }}>
                    Admin Portal Preview
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>
                    Student DRM & Protected In-Portal Playback
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewRecordedClass(null)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 999,
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                  <span>Close Viewer</span>
                </button>
              </div>

              {/* Academia 2-Column Course Viewer Component */}
              <div style={{ padding: '20px 24px 40px', flex: 1, background: '#F8FAFC' }}>
                <AcademiaCourseViewer
                  playlist={previewPlaylistObj}
                  initialLessonId={previewRecordedClass.id}
                  onBack={() => setPreviewRecordedClass(null)}
                  userRole="admin"
                  userProfile={userProfile}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ ADMIN UPLOAD CLASS RECORDING MODAL ═════════════════════ */}
      {adminUploadClass && (
        <div className="modal-overlay" style={{ zIndex: 99998 }}>
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,0.1)', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Video size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ margin: 0 }}>Upload Class Recording</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                    Publish replay for batch: <strong>{adminUploadClass.batch_name || adminUploadClass.batchId || 'All'}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-red" onClick={() => setAdminUploadClass(null)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveAdminRecording}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{adminUploadClass.title}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Faculty: <strong>{adminUploadClass.instructor || 'Faculty Staff'}</strong> • Date: <strong>{adminUploadClass.date}</strong> ({adminUploadClass.time})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Recording Video URL (YouTube / Google Drive / MP4 Link) *
                  </label>
                  <input
                    type="url"
                    required
                    value={adminRecordingUrl}
                    onChange={(e) => setAdminRecordingUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or Google Drive URL"
                    className="form-input"
                    style={{ height: '42px', fontSize: '13px' }}
                  />
                </div>

                {/* Video file direct upload */}
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Or Upload Video File Directly
                  </label>
                  <div style={{
                    border: '1.5px dashed var(--border-color)',
                    borderRadius: 10,
                    padding: '16px',
                    textAlign: 'center',
                    background: 'var(--surface-alt)',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      id="admin-recording-file-input"
                      disabled={adminIsUploadingFile}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAdminVideoFileUpload(file);
                      }}
                    />
                    <label htmlFor="admin-recording-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <UploadCloud size={24} color="#2563EB" />
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 650 }}>
                        {adminIsUploadingFile ? 'Uploading video file to server...' : 'Click to select recorded video file (MP4 / WebM)'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Directly playable with DRM protection</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Recording Duration</label>
                  <input
                    type="text"
                    value={adminRecordingDuration}
                    onChange={(e) => setAdminRecordingDuration(e.target.value)}
                    placeholder="e.g. 1h 15m"
                    className="form-input"
                    style={{ height: '40px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setAdminUploadClass(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={adminUploadSaving || adminIsUploadingFile} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {adminUploadSaving ? 'Saving...' : <><UploadCloud size={15} /> Save & Attach Recording</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ ADMIN PREVIEW VIDEO MODAL ═════════════════════════════════ */}
      {adminPreviewVideo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{ width: '100%', maxWidth: 1040, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, color: '#FFFFFF' }}>
            <div>
              <span style={{ fontSize: 11, color: '#93C5FD', fontWeight: 700, textTransform: 'uppercase' }}>
                {adminPreviewVideo.courseTitle || 'Live Replay'}
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                {adminPreviewVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setAdminPreviewVideo(null)}
              style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: 1040, height: '70vh', borderRadius: 16, overflow: 'hidden', background: '#000', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
            <SecureVideoPlayer
              videoUrl={adminPreviewVideo.video_url || 'https://www.youtube.com/watch?v=rfscVS0vtbw'}
              title={adminPreviewVideo.title}
              lessonId={adminPreviewVideo.id}
              studentId="admin_preview"
              watermarkText="LEVLOX ADMIN PREVIEW"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
