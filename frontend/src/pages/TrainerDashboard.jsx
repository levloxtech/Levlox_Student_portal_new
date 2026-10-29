import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GraduationCap, Users, Video, Clock, BookOpen, 
  Megaphone, Settings, Plus, LogOut, CheckCircle, Award, 
  Percent, CalendarCheck, Pencil, Eye, Search, Filter, 
  PlayCircle, Clock3, Trophy, Key, ChevronDown, X, Download, 
  FileText, FileSpreadsheet, User, Mail, Phone, Lock, EyeOff, 
  Camera, Save, Shield, Menu, Calendar as CalendarIcon, Check, CheckSquare,
  AlertCircle, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, ExternalLink, Trash2, UploadCloud, Play, MessageSquare,
  Copy, Sparkles, Layers as LayersIcon, ArrowUpRight, Wallet as WalletIcon, CheckCheck, Globe,
  Activity
} from 'lucide-react';
import CustomModal from '../components/Modal';
import FilterBar from '../components/FilterBar';
import NotificationBell from '../components/NotificationBell';
import levloxLogo from '../assets/levlox-logo.png';
import { useAuth } from '../context/AuthContext';
import TrainerOnboardingView from '../components/TrainerOnboardingView';
import { 
  getTrainerBatches, 
  getTrainerStudents, 
  getTrainerAttendanceSheets, 
  getTrainerLiveClasses, 
  createTrainerLiveClass,
  getTrainerRecordedClasses, 
  createTrainerRecordedClass,
  getTrainerAnnouncements, 
  createTrainerAnnouncement,
  uploadTrainerProfilePic
} from '../services/trainerService';
import { 
  saveBatchAttendance, 
  getAttendanceByBatchAndDate, 
  getAttendanceForStudent,
  updateStudent,
  awardActivityScore,
  updateDocumentFields,
  deleteDocument,
  classifyFirestoreError,
  getBatches,
  addBatch,
  updateBatch,
  deleteBatch as deleteBatchDoc,
  assignStudentsToBatch,
  assignTrainerToBatch,
  generateNextId,
  getCourses,
  addCourse,
  updateCourse,
  updateTrainer,
  getPlaylists,
  addPlaylist,
  updatePlaylist,
  deletePlaylist,
  uploadProfileImage,
  formatCurrency,
  getStudentFeeDetails
} from '../services/firebaseService';
import { 
  changeOwnPassword, 
  validatePasswordStrength 
} from '../services/authService';
import SecureVideoPlayer from '../components/SecureVideoPlayer';
import AcademiaCourseViewer from '../components/AcademiaCourseViewer';
import TrainerAssignmentsView from '../components/TrainerAssignmentsView';
import BatchChatPage from './BatchChatPage';
import { uploadUniversalFile, getDownloadUrl } from '../services/apiService';
import { getGoogleDriveFileId, getYouTubeVideoId, getResolvedThumbnail, parseDurationToSeconds, formatSecondsToDisplay } from '../utils/videoUtils';
import { addDaysToDate, getDaysBetween, formatReadableDate, formatLocalDate } from '../utils/batchUtils';

const PLAYLIST_CARD_THEMES = [
  {
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

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentUser, userProfile, logout, refreshProfile, applyProfilePatch } = useAuth();

  // Responsive sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active tab state from URL path
  const currentPath = location.pathname.replace('/trainer', '').replace('/', '') || 'dashboard';
  const [activeTab, setActiveTab] = useState(currentPath);

  useEffect(() => {
    const tabFromPath = location.pathname.replace('/trainer', '').replace('/', '') || 'dashboard';
    setActiveTab(tabFromPath);
  }, [location.pathname]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setMobileMenuOpen(false);
    if (tabKey === 'dashboard') {
      navigate('/trainer');
    } else {
      navigate('/trainer/' + tabKey);
    }
    try {
      queryClient.invalidateQueries();
    } catch (_) {}
  };

  const mustChangePassword = userProfile?.mustChangePassword === true;

  // Toast / Error state
  const [toast, setToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const isNewTrainer = Boolean(
    userProfile &&
    (userProfile.profileCompleted !== true ||
     userProfile.mustChangePassword === true ||
     userProfile.passwordChanged !== true)
  );

  if (isNewTrainer) {
    return (
      <TrainerOnboardingView
        userProfile={userProfile}
        currentUser={currentUser}
        logout={logout}
        applyProfilePatch={applyProfilePatch}
        refreshProfile={refreshProfile}
        showToast={showToast}
      />
    );
  }

  const [editingTrainerProfile, setEditingTrainerProfile] = useState(false);
  const [trainerProfileName, setTrainerProfileName] = useState('');
  const [trainerProfilePhone, setTrainerProfilePhone] = useState('');
  const [trainerProfileRole, setTrainerProfileRole] = useState('');
  const [trainerProfileSpecialization, setTrainerProfileSpecialization] = useState('');
  const [trainerProfileQualification, setTrainerProfileQualification] = useState('');
  const [trainerProfileExperience, setTrainerProfileExperience] = useState('');
  const [trainerProfileSkills, setTrainerProfileSkills] = useState('');
  const [trainerProfileCity, setTrainerProfileCity] = useState('');
  const [trainerProfileGender, setTrainerProfileGender] = useState('Male');
  const [trainerProfileDob, setTrainerProfileDob] = useState('');
  const [trainerProfileBio, setTrainerProfileBio] = useState('');
  const [trainerProfileLinkedin, setTrainerProfileLinkedin] = useState('');
  const [savingTrainerProfile, setSavingTrainerProfile] = useState(false);

  const startEditTrainerProfile = () => {
    setTrainerProfileName(userProfile?.fullName || userProfile?.name || '');
    setTrainerProfilePhone(userProfile?.phone || userProfile?.mobile || '');
    setTrainerProfileRole(userProfile?.designation || userProfile?.specialization || 'Faculty Trainer');
    setTrainerProfileSpecialization(userProfile?.specialization || 'Fullstack Engineering');
    setTrainerProfileQualification(userProfile?.qualification || '');
    setTrainerProfileExperience(userProfile?.experience || '');
    setTrainerProfileSkills(userProfile?.skills || '');
    setTrainerProfileCity(userProfile?.city || '');
    setTrainerProfileGender(userProfile?.gender || 'Male');
    setTrainerProfileDob(userProfile?.dob || '');
    setTrainerProfileBio(userProfile?.bio || '');
    setTrainerProfileLinkedin(userProfile?.linkedin || '');
    setEditingTrainerProfile(true);
  };

  const handleSaveTrainerProfile = async (e) => {
    if (e) e.preventDefault();
    if (!trainerProfileName.trim()) {
      showToast('Full name cannot be empty.');
      return;
    }
    setSavingTrainerProfile(true);
    try {
      const trainerUid = userProfile?.id || userProfile?.uid || currentUser?.uid;
      const updates = {
        name: trainerProfileName.trim(),
        fullName: trainerProfileName.trim(),
        phone: trainerProfilePhone.trim(),
        mobile: trainerProfilePhone.trim(),
        designation: trainerProfileRole.trim(),
        specialization: trainerProfileSpecialization.trim() || trainerProfileRole.trim(),
        qualification: trainerProfileQualification.trim(),
        experience: trainerProfileExperience.trim(),
        skills: trainerProfileSkills.trim(),
        city: trainerProfileCity.trim(),
        gender: trainerProfileGender,
        dob: trainerProfileDob,
        bio: trainerProfileBio.trim(),
        linkedin: trainerProfileLinkedin.trim(),
        updatedAt: new Date().toISOString()
      };
      await updateTrainer(trainerUid, updates);
      try {
        await updateDocumentFields('users', trainerUid, {
          name: trainerProfileName.trim(),
          phone: trainerProfilePhone.trim(),
          city: trainerProfileCity.trim(),
          gender: trainerProfileGender,
          dob: trainerProfileDob
        });
      } catch (_) {}
      if (applyProfilePatch) applyProfilePatch(updates);
      setEditingTrainerProfile(false);
      showToast('Profile updated successfully ✓');
    } catch (err) {
      console.error('[Trainer] Save profile failed:', err);
      showToast(err?.message || 'Failed to update trainer profile');
    } finally {
      setSavingTrainerProfile(false);
    }
  };

  const trainerUid = currentUser?.uid;
  const assignedBatchIds = useMemo(() => userProfile?.assigned_batch_ids || userProfile?.assignedBatchIds || [], [userProfile]);
  const assignedCourseIds = useMemo(() => userProfile?.assigned_course_ids || userProfile?.assignedCourseIds || [], [userProfile]);

  // ─── 1. FETCH TRAINER DATA ───────────────────────────────────────────────
  const { data: batches = [], isLoading: batchesLoading, refetch: refetchBatches } = useQuery({
    queryKey: ['trainerBatches', trainerUid, assignedBatchIds],
    queryFn: () => getTrainerBatches(trainerUid, assignedBatchIds),
    enabled: !!trainerUid,
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const effectiveBatchIds = useMemo(() => {
    const fromProfile = (assignedBatchIds || []).map(String);
    const fromBatches = (batches || []).map(b => String(b.id || b.uid || '')).filter(Boolean);
    return [...new Set([...fromProfile, ...fromBatches])];
  }, [assignedBatchIds, batches]);

  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['trainerStudents', trainerUid, effectiveBatchIds],
    queryFn: () => getTrainerStudents(effectiveBatchIds, trainerUid),
    enabled: !!trainerUid,
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['trainerCourses'],
    queryFn: () => getCourses(),
    staleTime: 1000 * 60,
  });

  const { data: liveClasses = [], isLoading: liveLoading, refetch: refetchLive } = useQuery({
    queryKey: ['trainerLiveClasses', trainerUid, effectiveBatchIds],
    queryFn: () => getTrainerLiveClasses(trainerUid, effectiveBatchIds),
    enabled: !!trainerUid,
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: recordedClasses = [], isLoading: recordedLoading, refetch: refetchRecorded } = useQuery({
    queryKey: ['trainerRecordedClasses', effectiveBatchIds, assignedCourseIds],
    queryFn: () => getTrainerRecordedClasses(effectiveBatchIds, assignedCourseIds),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: customPlaylists = [], isLoading: playlistsLoading, refetch: refetchPlaylists } = useQuery({
    queryKey: ['trainerPlaylists'],
    queryFn: () => getPlaylists(),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['trainerAnnouncements', effectiveBatchIds],
    queryFn: () => getTrainerAnnouncements(effectiveBatchIds),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: attendanceSheets = [], isLoading: sheetsLoading, refetch: refetchSheets } = useQuery({
    queryKey: ['trainerAttendanceSheets', effectiveBatchIds],
    queryFn: () => getTrainerAttendanceSheets(effectiveBatchIds),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // Automatically refresh trainer data whenever user navigates between tabs
  useEffect(() => {
    refetchBatches();
    refetchStudents();
    refetchLive();
    refetchRecorded();
    refetchPlaylists();
    refetchAnnouncements();
    refetchSheets();
    queryClient.invalidateQueries({ queryKey: ['trainerAssignmentsData'] });
    queryClient.invalidateQueries({ queryKey: ['trainerSubmissionsData'] });
  }, [activeTab, queryClient]);

  // Upcoming live class indicator for pulsing dot
  const hasUpcomingLiveClasses = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return liveClasses.some(c => (c.date || '') >= todayStr && (c.status || '').toLowerCase() !== 'completed');
  }, [liveClasses]);

  // Derived Statistics for Executive Dashboard
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayClassesCount = liveClasses.filter(c => c.date === todayStr).length;
    const upcomingClassesCount = liveClasses.filter(c => (c.date || '') >= todayStr && (c.status || '').toLowerCase() !== 'completed').length;
    const totalPoints = students.reduce((acc, s) => acc + (Number(s.activityPoints) || 0), 0);
    const markedTodayBatchIds = new Set(attendanceSheets.filter(s => s.date === todayStr).map(s => s.batchId || s.batch_id));
    const attendancePendingCount = Math.max(0, batches.length - markedTodayBatchIds.size);

    return {
      totalBatches: batches.length,
      totalStudents: students.length,
      todayClassesCount,
      upcomingClassesCount,
      attendancePendingCount,
      totalPoints,
      activeAssignmentsCount: 4,
    };
  }, [batches, students, liveClasses, attendanceSheets]);

  // ─── 2. BATCH MANAGEMENT (CREATE & EDIT RIGHTS) ──────────────────────────
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [batchName, setBatchName] = useState('');
  const [batchCourseName, setBatchCourseName] = useState('');
  const [batchStartDate, setBatchStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [batchDurationDays, setBatchDurationDays] = useState(50);
  const [batchEndDate, setBatchEndDate] = useState(addDaysToDate(new Date().toISOString().split('T')[0], 50));
  const [batchTiming, setBatchTiming] = useState('10:00 AM - 12:00 PM');
  const [batchStatus, setBatchStatus] = useState('Active');
  const [batchMaxStudents, setBatchMaxStudents] = useState(30);
  const [savingBatch, setSavingBatch] = useState(false);

  const resetBatchForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setBatchName('');
    setBatchCourseName(courses[0]?.title || courses[0]?.name || 'Data Science & AI');
    setBatchStartDate(today);
    setBatchDurationDays(50);
    setBatchEndDate(addDaysToDate(today, 50));
    setBatchTiming('10:00 AM - 12:00 PM');
    setBatchStatus('Active');
    setBatchMaxStudents(30);
    setEditingBatch(null);
  };

  const openCreateBatchModal = () => {
    resetBatchForm();
    setShowBatchModal(true);
  };

  const openEditBatchModal = (batch) => {
    setEditingBatch(batch);
    setBatchName(batch.name || '');
    setBatchCourseName(batch.course_name || batch.courseName || '');
    setBatchStartDate(batch.start_date || new Date().toISOString().split('T')[0]);
    setBatchDurationDays(batch.duration_days || 50);
    setBatchEndDate(batch.end_date || addDaysToDate(batch.start_date || new Date().toISOString().split('T')[0], 50));
    setBatchTiming(batch.timing || '10:00 AM - 12:00 PM');
    setBatchStatus(batch.status || 'Active');
    setBatchMaxStudents(batch.max_students || 30);
    setShowBatchModal(true);
  };

  const handleSaveBatch = async (e) => {
    e.preventDefault();
    if (!batchName.trim() || !batchCourseName.trim()) {
      alert('Batch Name and Course are required.');
      return;
    }
    setSavingBatch(true);
    try {
      const payload = {
        name: batchName.trim(),
        course_name: batchCourseName.trim(),
        trainer_name: userProfile?.fullName || userProfile?.name || 'Faculty Trainer',
        trainer_uid: trainerUid || '',
        trainer_id: userProfile?.trainerId || userProfile?.trainer_id || userProfile?.code || 'TRN',
        trainer_email: userProfile?.email || '',
        start_date: batchStartDate,
        end_date: batchEndDate,
        duration_days: Number(batchDurationDays) || 50,
        timing: batchTiming.trim() || '10:00 AM - 12:00 PM',
        status: batchStatus,
        max_students: Number(batchMaxStudents) || 30,
        updatedAt: new Date().toISOString(),
      };

      if (editingBatch) {
        await updateBatch(editingBatch.id, payload);
        showToast('Batch details updated successfully ✓');
      } else {
        const code = await generateNextId('batch');
        await addBatch({
          ...payload,
          code,
          batchId: code,
          student_ids: [],
          students_count: 0,
          createdAt: new Date().toISOString(),
        });
        showToast('New batch created successfully ✓');
      }

      setShowBatchModal(false);
      resetBatchForm();
      refetchBatches();
      queryClient.invalidateQueries({ queryKey: ['trainerBatches'] });
    } catch (err) {
      console.error('Failed to save batch:', err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingBatch(false);
    }
  };

  const handleDeleteBatch = async (batchId) => {
    if (!batchId) return;
    if (!window.confirm('Are you sure you want to permanently delete this batch? All assigned students will be unlinked.')) return;
    try {
      await assignStudentsToBatch(batchId, []).catch(() => null);
      await deleteBatchDoc(batchId);
      showToast('Batch removed successfully ✓');
      refetchBatches();
      queryClient.invalidateQueries({ queryKey: ['trainerBatches'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    }
  };

  // ─── 3. STUDENT REGISTRY & PROFILE RIGHTS ────────────────────────────────
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentBatchFilter, setStudentBatchFilter] = useState('all');
  const [studentCourseFilter, setStudentCourseFilter] = useState('all');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');

  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState(false);

  // Student Edit Modal State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentCourse, setEditStudentCourse] = useState('');
  const [editStudentBatchId, setEditStudentBatchId] = useState('');
  const [editStudentCollege, setEditStudentCollege] = useState('');
  const [editStudentLocation, setEditStudentLocation] = useState('');
  const [editStudentAddress, setEditStudentAddress] = useState('');
  const [editStudentCompany, setEditStudentCompany] = useState('');
  const [editStudentStatus, setEditStudentStatus] = useState('active');
  const [editStudentProfilePic, setEditStudentProfilePic] = useState('');
  const [savingStudentEdit, setSavingStudentEdit] = useState(false);

  // Award Activity Points Modal State
  const [awardPointsStudent, setAwardPointsStudent] = useState(null);
  const [pointsToAward, setPointsToAward] = useState(10);
  const [awardReason, setAwardReason] = useState('Active Participation in Live Session');
  const [savingPoints, setSavingPoints] = useState(false);

  const filteredTrainerStudents = useMemo(() => {
    return students.filter(s => {
      // Exclude any accidental trainer records
      if (s.role === 'trainer') return false;
      
      // Batch filter
      if (studentBatchFilter !== 'all') {
        const bId = s.batch_id || s.batchId || '';
        const bName = s.batch_name || s.batchName || '';
        if (bId !== studentBatchFilter && bName !== studentBatchFilter) return false;
      }

      // Course filter
      if (studentCourseFilter !== 'all') {
        const c = s.course || s.course_name || '';
        if (c !== studentCourseFilter) return false;
      }

      // Status filter
      if (studentStatusFilter !== 'all') {
        const st = (s.status || 'active').toLowerCase();
        if (st !== studentStatusFilter.toLowerCase()) return false;
      }

      // Search query
      if (studentSearchQuery.trim()) {
        const q = studentSearchQuery.toLowerCase();
        const matchesName = (s.name || '').toLowerCase().includes(q);
        const matchesEmail = (s.email || '').toLowerCase().includes(q);
        const matchesRoll = (s.rollNumber || s.id || '').toLowerCase().includes(q);
        const matchesPhone = (s.phone || '').toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesRoll && !matchesPhone) return false;
      }

      return true;
    });
  }, [students, studentSearchQuery, studentBatchFilter, studentCourseFilter, studentStatusFilter]);

  const openStudentDetails = (student) => {
    setSelectedStudentDetails(student);
    setShowStudentPassword(false);
  };

  const openEditStudentModal = (student) => {
    setEditingStudent(student);
    setEditStudentName(student.name || '');
    setEditStudentEmail(student.email || '');
    setEditStudentPhone(student.phone || '');
    setEditStudentCourse(student.course || '');
    setEditStudentBatchId(student.batch_id || student.batchId || '');
    setEditStudentCollege(student.college || '');
    setEditStudentLocation(student.current_location || student.location || '');
    setEditStudentAddress(student.permanent_address || '');
    setEditStudentCompany(student.company || '');
    setEditStudentStatus(student.status || 'active');
    setEditStudentProfilePic(student.profile_pic || student.profilePhotoUrl || '');
  };

  const handleSaveStudentEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingStudentEdit(true);
    try {
      const selectedBatch = batches.find(b => b.id === editStudentBatchId);
      const payload = {
        name: editStudentName.trim(),
        email: editStudentEmail.trim(),
        phone: editStudentPhone.trim(),
        course: editStudentCourse.trim(),
        batch_id: editStudentBatchId,
        batchId: editStudentBatchId,
        batch_name: selectedBatch?.name || editingStudent.batch_name || '',
        college: editStudentCollege.trim(),
        current_location: editStudentLocation.trim(),
        location: editStudentLocation.trim(),
        permanent_address: editStudentAddress.trim(),
        company: editStudentCompany.trim(),
        status: editStudentStatus,
        profile_pic: editStudentProfilePic,
        profilePhotoUrl: editStudentProfilePic,
        updatedAt: new Date().toISOString(),
      };

      await updateStudent(editingStudent.id, payload);

      // Handle batch roster update if batch changed
      const oldBatchId = editingStudent.batch_id || editingStudent.batchId;
      if (oldBatchId && oldBatchId !== editStudentBatchId) {
        const oldB = batches.find(b => b.id === oldBatchId);
        if (oldB && Array.isArray(oldB.student_ids)) {
          const updatedOld = oldB.student_ids.filter(id => id !== editingStudent.id);
          await assignStudentsToBatch(oldBatchId, updatedOld).catch(() => null);
        }
      }
      if (editStudentBatchId && editStudentBatchId !== oldBatchId) {
        const newB = batches.find(b => b.id === editStudentBatchId);
        if (newB) {
          const existingIds = Array.isArray(newB.student_ids) ? newB.student_ids : [];
          if (!existingIds.includes(editingStudent.id)) {
            await assignStudentsToBatch(editStudentBatchId, [...existingIds, editingStudent.id]).catch(() => null);
          }
        }
      }

      showToast('Student information saved successfully ✓');
      setEditingStudent(null);
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['trainerStudents'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingStudentEdit(false);
    }
  };

  const handleUploadStudentPhoto = async (studentId, file) => {
    if (!file || !studentId) return;
    setUploadingStudentPhoto(true);
    try {
      const photoUrl = await uploadProfileImage(studentId, file);
      await updateStudent(studentId, {
        profile_pic: photoUrl,
        profilePhotoUrl: photoUrl,
        updatedAt: new Date().toISOString(),
      });
      if (selectedStudentDetails?.id === studentId) {
        setSelectedStudentDetails(prev => ({
          ...prev,
          profile_pic: photoUrl,
          profilePhotoUrl: photoUrl
        }));
      }
      if (editingStudent?.id === studentId) {
        setEditStudentProfilePic(photoUrl);
      }
      showToast('Student photo uploaded successfully ✓');
      refetchStudents();
    } catch (err) {
      console.error(err);
      alert('Photo upload failed: ' + err.message);
    } finally {
      setUploadingStudentPhoto(false);
    }
  };

  const handleAwardActivityPoints = async (e) => {
    e.preventDefault();
    if (!awardPointsStudent) return;
    setSavingPoints(true);
    try {
      const currentPts = Number(awardPointsStudent.activityPoints) || 0;
      const newTotal = currentPts + Number(pointsToAward);
      await updateStudent(awardPointsStudent.id, {
        activityPoints: newTotal,
        updatedAt: new Date().toISOString(),
      });
      await awardActivityScore({
        studentId: awardPointsStudent.id,
        studentName: awardPointsStudent.name,
        points: Number(pointsToAward),
        reason: awardReason,
        awardedBy: userProfile?.fullName || 'Faculty Trainer',
        date: new Date().toISOString(),
      }).catch(() => null);

      showToast(`Awarded ${pointsToAward} pts to ${awardPointsStudent.name} ✓`);
      setAwardPointsStudent(null);
      setPointsToAward(10);
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['trainerStudents'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingPoints(false);
    }
  };

  const handleExportStudentsCSV = () => {
    if (filteredTrainerStudents.length === 0) {
      alert('No students to export.');
      return;
    }
    const headers = ['Student ID', 'Full Name', 'Email', 'Mobile', 'Course', 'Batch', 'Attendance %', 'Activity Points', 'Fee Status', 'Account Status'];
    const rows = filteredTrainerStudents.map(s => [
      s.rollNumber || s.id || '',
      s.name || '',
      s.email || '',
      s.phone || '',
      s.course || '',
      s.batch_name || s.batchName || '',
      (s.attendance || 0) + '%',
      s.activityPoints || 0,
      s.feesStatus || 'Pending',
      s.status || 'Active'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.map(i => `"${String(i).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Levlox_Learners_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─── 4. ATTENDANCE MODULE ────────────────────────────────────────────────
  const [attCourseFilter, setAttCourseFilter] = useState('');
  const [attBatchId, setAttBatchId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStudentRecords, setAttStudentRecords] = useState({});
  const [attRecordDetails, setAttRecordDetails] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Automatically select the first batch if none is currently selected
  useEffect(() => {
    if (!attBatchId && batches.length > 0) {
      setAttBatchId(batches[0].id);
    }
  }, [batches, attBatchId]);

  const selectedAttBatch = useMemo(() => batches.find(b => b.id === attBatchId), [batches, attBatchId]);

  const attBatchStudents = useMemo(() => {
    if (!attBatchId) return [];
    const bCode = (selectedAttBatch?.code || selectedAttBatch?.batchId || '').toLowerCase();
    const bName = (selectedAttBatch?.name || '').toLowerCase();
    const sIds = (Array.isArray(selectedAttBatch?.student_ids) ? selectedAttBatch.student_ids : []).map(String);
    return students.filter(s => {
      if (s.role === 'trainer') return false;
      const sBId = String(s.batch_id || s.batchId || '');
      const sBName = String(s.batch_name || s.batchName || s.batch || '').toLowerCase();
      const sId = String(s.id || s.uid || '');

      if (sBId && sBId === String(attBatchId)) return true;
      if (bCode && sBId.toLowerCase() === bCode) return true;
      if (bName && sBName === bName) return true;
      if (sId && sIds.includes(sId)) return true;
      return false;
    });
  }, [students, attBatchId, selectedAttBatch]);

  useEffect(() => {
    if (!attBatchId || !attDate) return;
    let isMounted = true;
    setLoadingAttendance(true);
    getAttendanceByBatchAndDate(attBatchId, attDate)
      .then((records) => {
        if (!isMounted) return;
        const initialMap = {};
        const detailsMap = {};
        records.forEach(r => {
          const sid = r.studentId || r.student_id;
          if (sid) {
            initialMap[sid] = r.status;
            detailsMap[sid] = r;
          }
        });
        setAttStudentRecords(initialMap);
        setAttRecordDetails(detailsMap);
      })
      .catch(err => console.error('Error loading attendance:', err))
      .finally(() => { if (isMounted) setLoadingAttendance(false); });
    return () => { isMounted = false; };
  }, [attBatchId, attDate]);

  const handleMarkStudent = (studentId, status) => {
    setAttStudentRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSelectAll = (status) => {
    const updated = {};
    attBatchStudents.forEach(s => {
      updated[s.id] = status;
    });
    setAttStudentRecords(updated);
  };

  const handleResetAttendance = () => {
    setAttStudentRecords({});
  };

  const attSummary = useMemo(() => {
    let present = 0;
    let absent = 0;
    let notMarked = 0;
    const total = attBatchStudents.length;

    attBatchStudents.forEach(s => {
      const st = attStudentRecords[s.id];
      if (st === 'Present') present += 1;
      else if (st === 'Absent') absent += 1;
      else notMarked += 1;
    });

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, notMarked, rate };
  }, [attBatchStudents, attStudentRecords]);

  const handleSaveAttendance = async () => {
    if (!attBatchId || !attDate) {
      alert('Please choose batch and date first.');
      return;
    }
    setSavingAttendance(true);
    try {
      const recordsToSave = attBatchStudents.map(s => {
        const sStatus = attStudentRecords[s.id] || attStudentRecords[s.uid] || 'Not Marked';
        return {
          studentId: s.id,
          student_id: s.id,
          studentName: s.name,
          student_name: s.name,
          name: s.name,
          rollNumber: s.rollNumber || s.id,
          status: sStatus,
          batchId: attBatchId,
          batch_id: attBatchId,
          batchName: selectedAttBatch?.name || '',
          batch_name: selectedAttBatch?.name || '',
          date: attDate,
          course: selectedAttBatch?.course_name || s.course || '',
          course_name: selectedAttBatch?.course_name || s.course || '',
        };
      });

      await saveBatchAttendance(attBatchId, attDate, recordsToSave, {
        batchId: attBatchId,
        date: attDate,
        batchName: selectedAttBatch?.name || '',
        courseName: selectedAttBatch?.course_name || '',
        markedBy: userProfile?.fullName || 'Faculty Trainer',
        total: attSummary.total,
        present: attSummary.present,
        absent: attSummary.absent,
      });

      // Recalculate each student's overall attendance rate
      await Promise.all(recordsToSave.map(async (r) => {
        try {
          const sid = r.studentId;
          const allStudentAtt = await getAttendanceForStudent(sid);
          const presentDays = allStudentAtt.filter(rec => (rec.status || '').toLowerCase() === 'present').length;
          const totalDays = allStudentAtt.length;
          const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
          await updateStudent(sid, {
            attendance: pct,
            attendanceRate: pct,
            updatedAt: new Date().toISOString()
          });
        } catch (syncErr) {
          console.warn('Sync student attendance failed:', syncErr);
        }
      }));

      showToast('Attendance records saved successfully ✓');
      refetchSheets();
      refetchStudents();
      queryClient.invalidateQueries({ queryKey: ['trainerAttendanceSheets'] });
      queryClient.invalidateQueries({ queryKey: ['trainerStudents'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingAttendance(false);
    }
  };

  // ─── 5. LIVE CLASS MANAGEMENT ────────────────────────────────────────────
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveLectureName, setLiveLectureName] = useState('');
  const [liveCourseName, setLiveCourseName] = useState('');
  const [liveBatchId, setLiveBatchId] = useState('');
  const [liveDate, setLiveDate] = useState('');
  const [liveStartTime, setLiveStartTime] = useState('');
  const [liveEndTime, setLiveEndTime] = useState('');
  const [liveMeetLink, setLiveMeetLink] = useState('');
  const [schedulingLive, setSchedulingLive] = useState(false);

  const handleScheduleLiveClass = async (e) => {
    e.preventDefault();
    if (!liveLectureName || !liveBatchId || !liveDate || !liveMeetLink) {
      alert('Please fill in all required fields.');
      return;
    }
    setSchedulingLive(true);
    try {
      const batchObj = batches.find(b => b.id === liveBatchId);
      await createTrainerLiveClass(trainerUid, userProfile?.fullName || userProfile?.name || 'Trainer', {
        title: liveLectureName,
        lectureName: liveLectureName,
        course: liveCourseName || batchObj?.course_name || '',
        courseId: batchObj?.course_id || '',
        batchId: liveBatchId,
        batch_id: liveBatchId,
        batchName: batchObj?.name || '',
        batch_name: batchObj?.name || '',
        date: liveDate,
        time: `${liveStartTime} - ${liveEndTime}`,
        startTime: liveStartTime,
        endTime: liveEndTime,
        meetLink: liveMeetLink,
        meet_link: liveMeetLink,
        meet_url: liveMeetLink,
        status: 'Upcoming'
      });
      showToast('Live Class scheduled successfully ✓');
      refetchLive();
      setShowLiveModal(false);
      setLiveLectureName('');
      setLiveMeetLink('');
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSchedulingLive(false);
    }
  };

  const handleDeleteLiveClass = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this live class session?')) return;
    try {
      await deleteDocument('liveClasses', id);
      showToast('Live class deleted successfully ✓');
      refetchLive();
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    }
  };

  // ─── 6. RECORDED CLASSES & PLAYLISTS (ADMIN-PARITY SYSTEM) ─────────────────
  const [recordedSearchQuery, setRecordedSearchQuery] = useState('');
  const [recordedCourseFilter, setRecordedCourseFilter] = useState('');
  const [recordedBatchFilter, setRecordedBatchFilter] = useState('');
  const [recordedVisibilityFilter, setRecordedVisibilityFilter] = useState('');
  const [recordedDateFilter, setRecordedDateFilter] = useState('All');
  const [recordedStartDateFilter, setRecordedStartDateFilter] = useState('');
  const [recordedEndDateFilter, setRecordedEndDateFilter] = useState('');
  const [selectedPlaylistBatch, setSelectedPlaylistBatch] = useState(null);

  const [showRecordedClassModal, setShowRecordedClassModal] = useState(false);
  const [editingRecordedClass, setEditingRecordedClass] = useState(null);
  const [recTitle, setRecTitle] = useState('');
  const [recModule, setRecModule] = useState('Module 1 - Python Basics');
  const [recCourseTitle, setRecCourseTitle] = useState('');
  const [recVideoUrl, setRecVideoUrl] = useState('');
  const [recThumbnailUrl, setRecThumbnailUrl] = useState('');
  const [recLessonDescription, setRecLessonDescription] = useState('');
  const [recNotesUrl, setRecNotesUrl] = useState('');
  const [recAssignment, setRecAssignment] = useState('');
  const [recVisibility, setRecVisibility] = useState('everyone');
  const [recSortOrder, setRecSortOrder] = useState('');
  const [recDuration, setRecDuration] = useState('1h 30m');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [videoSourceType, setVideoSourceType] = useState('link');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showModalVideoPreview, setShowModalVideoPreview] = useState(false);
  const [recStudyMaterials, setRecStudyMaterials] = useState([]);
  const [previewRecordedClass, setPreviewRecordedClass] = useState(null);

  // Custom Playlist Modal state
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [playlistFormName, setPlaylistFormName] = useState('');
  const [playlistFormCourse, setPlaylistFormCourse] = useState('');
  const [playlistFormDescription, setPlaylistFormDescription] = useState('');
  const [playlistFormThumbnail, setPlaylistFormThumbnail] = useState('');
  const [playlistThumbnailType, setPlaylistThumbnailType] = useState('url');
  const [playlistUploadingThumb, setPlaylistUploadingThumb] = useState(false);
  const [playlistFormAccess, setPlaylistFormAccess] = useState('all');
  const [playlistFormBatchId, setPlaylistFormBatchId] = useState('');

  const filterByDateRange = (dateStr, dateFilterType, customStart, customEnd) => {
    if (!dateStr || dateFilterType === 'All') return true;
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
        firstDayOfWeek.setHours(0, 0, 0, 0);
        const lastDayOfWeek = new Date(firstDayOfWeek);
        lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 7);
        lastDayOfWeek.setHours(23, 59, 59, 999);
        return itemDate >= firstDayOfWeek && itemDate <= lastDayOfWeek;
      } else if (dateFilterType === 'This Month') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return itemDate >= firstDayOfMonth && itemDate <= lastDayOfMonth;
      } else if (dateFilterType === 'Custom' && customStart && customEnd) {
        const s = new Date(customStart);
        const e = new Date(customEnd);
        e.setHours(23, 59, 59);
        return itemDate >= s && itemDate <= e;
      }
      return true;
    } catch {
      return true;
    }
  };

  const filteredRecorded = useMemo(() => {
    return (recordedClasses || []).filter(c => {
      const query = (recordedSearchQuery || '').toLowerCase().trim();
      const matchesSearch = !query || 
        (c.title || '').toLowerCase().includes(query) ||
        (c.module || '').toLowerCase().includes(query) ||
        (c.course_title || c.course_name || '').toLowerCase().includes(query);
      const matchesCourse = !recordedCourseFilter || (c.course_title || c.course_name) === recordedCourseFilter;
      const matchesBatch = !recordedBatchFilter || String(c.batch_id || c.batchId) === String(recordedBatchFilter);
      const matchesVisibility = !recordedVisibilityFilter || c.visibility === recordedVisibilityFilter;
      const matchesDate = filterByDateRange(c.created_at || c.createdAt || c.date, recordedDateFilter, recordedStartDateFilter, recordedEndDateFilter);
      return matchesSearch && matchesCourse && matchesBatch && matchesVisibility && matchesDate;
    });
  }, [recordedClasses, recordedSearchQuery, recordedCourseFilter, recordedBatchFilter, recordedVisibilityFilter, recordedDateFilter, recordedStartDateFilter, recordedEndDateFilter]);

  const exportRecordedClassesToCSV = () => {
    const headers = ['Lesson Title', 'Module', 'Course Title', 'Duration', 'Visibility', 'Video URL'];
    const rows = filteredRecorded.map(c => [
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.module || '').replace(/"/g, '""')}"`,
      `"${(c.course_title || c.course_name || '').replace(/"/g, '""')}"`,
      `"${c.duration || ''}"`,
      `"${c.visibility || 'everyone'}"`,
      `"${c.video_url || ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'recorded_classes_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRecordedClassesToExcel = () => {
    const headers = ['Lesson Title', 'Module', 'Course Title', 'Duration', 'Visibility', 'Video URL'];
    const rows = filteredRecorded.map(c => [
      c.title || '',
      c.module || '',
      c.course_title || c.course_name || '',
      c.duration || '',
      c.visibility || 'everyone',
      c.video_url || ''
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
    if (!printWindow) return;
    let rowsHtml = '';
    filteredRecorded.forEach(c => {
      rowsHtml += `
        <tr>
          <td>${c.title || ''}</td>
          <td>${c.module || ''}</td>
          <td>${c.course_title || c.course_name || ''}</td>
          <td>${c.duration || ''}</td>
          <td>${c.visibility || 'everyone'}</td>
        </tr>
      `;
    });
    printWindow.document.write(`
      <html>
        <head>
          <title>Recorded Classes Report</title>
          <style>
             body { font-family: sans-serif; padding: 20px; }
             h1 { color: #6366F1; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #E5E7EB; padding: 10px; text-align: left; }
             th { background-color: #F9FAFB; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Recorded Classes Library</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>Lesson Title</th>
                <th>Module</th>
                <th>Course</th>
                <th>Duration</th>
                <th>Visibility</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSaveRecordedClass = async (e) => {
    e.preventDefault();
    if (!recTitle.trim() || !recVideoUrl.trim()) {
      showToast('Lesson title and video source are required.');
      return;
    }
    const isEditing = !!editingRecordedClass;
    const isDrive = Boolean(getGoogleDriveFileId(recVideoUrl));
    const isYouTube = Boolean(getYouTubeVideoId(recVideoUrl));
    const finalSourceType = isDrive ? 'drive' : (isYouTube ? 'youtube' : videoSourceType);
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
      title: recTitle.trim(),
      module: recModule.trim() || 'General Lesson',
      video_url: recVideoUrl.trim(),
      thumbnail: finalThumbnail,
      description: recLessonDescription.trim(),
      notes_url: recNotesUrl.trim(),
      assignment: recAssignment.trim(),
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
      video_source_type: finalSourceType,
      study_materials: recStudyMaterials,
      uploadedBy: userProfile?.fullName || userProfile?.name || 'Trainer',
      trainer_uid: trainerUid,
      updatedAt: new Date().toISOString()
    };

    try {
      const recId = editingRecordedClass?.id || editingRecordedClass?.uid || editingRecordedClass?._id;
      if (isEditing && recId) {
        await updateDocumentFields('recordedClasses', recId, payload);
        showToast('Lesson updated successfully ✓');
      } else {
        payload.createdAt = new Date().toISOString();
        await createTrainerRecordedClass(payload);
        showToast('New LMS Lesson posted successfully ✓');
      }
      setRecTitle('');
      setRecModule('Module 1 - Python Basics');
      setRecVideoUrl('');
      setRecThumbnailUrl('');
      setRecLessonDescription('');
      setRecNotesUrl('');
      setRecAssignment('');
      setRecVisibility('everyone');
      setRecSortOrder('');
      setRecDuration('1h 30m');
      setVideoSourceType('link');
      setRecStudyMaterials([]);
      setShowModalVideoPreview(false);
      setEditingRecordedClass(null);
      setShowRecordedClassModal(false);
      refetchRecorded();
    } catch (err) {
      console.error(err);
      showToast(classifyFirestoreError(err).message);
    }
  };

  const handleSavePlaylist = async (e) => {
    e.preventDefault();
    if (!playlistFormName.trim()) {
      showToast('Playlist name is required.');
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
      created_by: userProfile?.fullName || 'Trainer',
      trainer_uid: trainerUid,
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
      refetchPlaylists();
      showToast(isEditing ? 'Playlist updated successfully ✓' : 'New playlist created successfully ✓');
    } catch (err) {
      console.error(err);
      showToast(classifyFirestoreError(err).message);
    }
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (!playlistId) return;
    if (!window.confirm('Are you sure you want to permanently delete this custom playlist? It will be removed for all students.')) return;
    try {
      await deletePlaylist(playlistId);
      if (selectedPlaylistBatch?.id === playlistId || selectedPlaylistBatch?.uid === playlistId) {
        setSelectedPlaylistBatch(null);
      }
      setShowPlaylistModal(false);
      setEditingPlaylist(null);
      refetchPlaylists();
      showToast('Playlist deleted successfully ✓');
    } catch (err) {
      console.error(err);
      showToast(classifyFirestoreError(err).message);
    }
  };

  const handleDeleteRecordedClass = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to permanently delete this recorded lesson?')) return;
    try {
      await deleteDocument('recordedClasses', id);
      showToast('Recorded lesson deleted successfully ✓');
      refetchRecorded();
    } catch (err) {
      console.error(err);
      showToast(classifyFirestoreError(err).message);
    }
  };

    // ─── 7. ANNOUNCEMENTS ───────────────────────────────────────────────────
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annBatchId, setAnnBatchId] = useState('');
  const [annPriority, setAnnPriority] = useState('Normal');
  const [annFile, setAnnFile] = useState(null);
  const [savingAnn, setSavingAnn] = useState(false);

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle || !annMessage || !annBatchId) {
      alert('Title, Message, and Batch are required.');
      return;
    }
    setSavingAnn(true);
    try {
      let attachmentUrl = null;
      let attachmentName = null;
      if (annFile) {
        const uploaded = await uploadUniversalFile(annFile, 'announcements');
        attachmentUrl = uploaded.url;
        attachmentName = uploaded.originalName || annFile.name;
      }

      const batchObj = batches.find(b => b.id === annBatchId);
      await createTrainerAnnouncement(userProfile?.fullName || 'Trainer', {
        title: annTitle,
        content: annMessage,
        message: annMessage,
        batchId: annBatchId,
        batch_id: annBatchId,
        batchName: batchObj?.name || '',
        batch_name: batchObj?.name || '',
        priority: annPriority,
        attachmentUrl,
        attachmentName,
        date: new Date().toISOString().split('T')[0]
      });
      showToast('Announcement broadcasted successfully ✓');
      refetchAnnouncements();
      setShowAnnModal(false);
      setAnnTitle('');
      setAnnMessage('');
      setAnnFile(null);
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!id) return;
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteDocument('announcements', id);
      showToast('Announcement deleted ✓');
      refetchAnnouncements();
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    }
  };

  // ─── 8. SETTINGS & PROFILE ──────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    const val = validatePasswordStrength(newPassword);
    if (!val.valid) {
      setErrorMessage(val.errors.join(' '));
      return;
    }
    setPasswordSaving(true);
    setErrorMessage('');
    try {
      await changeOwnPassword(currentUser.uid, currentPassword, newPassword);
      showToast('Password changed successfully ✓');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Password update failed.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const photoUrl = await uploadTrainerProfilePic(trainerUid, file);
      if (applyProfilePatch) {
        await applyProfilePatch({ profilePic: photoUrl, profile_pic: photoUrl });
      }
      showToast('Trainer profile picture updated ✓');
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      console.error(err);
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="admin-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--surface-alt)' }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          background: 'linear-gradient(135deg, #10B981, #059669)',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: 12,
          fontWeight: 700,
          boxShadow: '0 10px 25px rgba(16,185,129,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle size={18} /> {toast}
        </div>
      )}

      {/* ─── SIDEBAR NAVIGATION (ADMIN GRADE) ──────────────────────────────── */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Levlox Signature Brand Card */}
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
                LEVLOX <span style={{ fontSize: 10, background: 'linear-gradient(135deg, #4568F5, #8B5CF6)', color: '#FFFFFF', padding: '2px 7px', borderRadius: 999, letterSpacing: 0.8, fontWeight: 800 }}>TRAINER</span>
              </h2>
              <span className="srms-sidebar-brand-sub">Instructor Operations Center</span>
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
          <span className="sidebar-section-label">Main Navigation</span>
          
          <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabChange('dashboard')}>
            <Clock size={18} />
            <span className="sidebar-link-text">Dashboard</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'batches' ? 'active' : ''}`} onClick={() => handleTabChange('batches')}>
            <GraduationCap size={18} />
            <span className="sidebar-link-text">Batch Management</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => handleTabChange('students')}>
            <Users size={18} />
            <span className="sidebar-link-text">My Students</span>
          </button>

          <span className="sidebar-section-label">Academic & Learning</span>

          <button className={`sidebar-link ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => handleTabChange('courses')}>
            <BookOpen size={18} />
            <span className="sidebar-link-text">Courses & Curriculum</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'live-classes' ? 'active' : ''}`} onClick={() => handleTabChange('live-classes')}>
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
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} /> LIVE
                </span>
              )}
            </span>
          </button>

          <button className={`sidebar-link ${activeTab === 'recorded-classes' ? 'active' : ''}`} onClick={() => handleTabChange('recorded-classes')}>
            <PlayCircle size={18} />
            <span className="sidebar-link-text">Recorded Classes</span>
          </button>

          <span className="sidebar-section-label">Student Engagement</span>

          <button className={`sidebar-link ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => handleTabChange('attendance')}>
            <CalendarCheck size={18} />
            <span className="sidebar-link-text">Attendance Sheet</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => handleTabChange('assignments')}>
            <FileText size={18} />
            <span className="sidebar-link-text">Assignments</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => handleTabChange('announcements')}>
            <Megaphone size={18} />
            <span className="sidebar-link-text">Announcements</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => handleTabChange('chat')}>
            <MessageSquare size={18} />
            <span className="sidebar-link-text">Batch Chat</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'activity-scores' ? 'active' : ''}`} onClick={() => handleTabChange('activity-scores')}>
            <Trophy size={18} />
            <span className="sidebar-link-text">Activity Scores</span>
          </button>

          <span className="sidebar-section-label">Account & Settings</span>

          <button className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => handleTabChange('profile')}>
            <User size={18} />
            <span className="sidebar-link-text">Trainer Profile</span>
          </button>

          <button className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabChange('settings')}>
            <Settings size={18} />
            <span className="sidebar-link-text">Settings</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout} style={{ color: '#EF4444' }}>
            <LogOut size={18} color="#EF4444" />
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT BODY ────────────────────────────────────────────── */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`} style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        {/* Sticky Topbar */}
        <header className="top-navbar" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF', padding: '16px 24px', borderRadius: 16, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="top-navbar-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="sidebar-toggle-btn mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Levlox Trainer Portal</h1>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                Teaching Management, Batch Administration & Student Engagement
              </p>
            </div>
          </div>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={openCreateBatchModal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Plus size={15} /> New Batch
            </button>

            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => { setShowLiveModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            >
              <Video size={15} /> Schedule Class
            </button>

            <NotificationBell userId={currentUser?.uid} userRole="trainer" />
            
            <div className="navbar-date-chip" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--surface-alt)', padding: '6px 12px', borderRadius: 20 }}>
              <CalendarIcon size={14} />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1.5px solid var(--border-color)' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)' }}>
                <img 
                  src={userProfile?.profilePic || userProfile?.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt="Trainer Profile" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#121118' }}>
                  {userProfile?.fullName || userProfile?.name || 'Trainer'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--primary-color)', fontWeight: 700 }}>
                  ID: {userProfile?.trainerId || userProfile?.trainer_id || userProfile?.code || 'TRN001013'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Dismissible Password Change Notice */}
        {mustChangePassword && activeTab !== 'settings' && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 16, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={22} color="#D97706" />
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#92400E' }}>Temporary Password Active</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#B45309' }}>
                  For optimal security, you can customize your permanent trainer password anytime in Settings.
                </p>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('settings')}>
              Update in Settings
            </button>
          </div>
        )}

        {/* ─── TAB 1: EXECUTIVE DASHBOARD OVERVIEW ───────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            {/* 6 Executive Stat Cards (Admin-Grade) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {/* Card 1: Assigned Batches */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Assigned Batches</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(108, 60, 240, 0.08)', color: '#6C3CF0', padding: '8px', borderRadius: '8px' }}>
                    <GraduationCap size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#1E293B' }}>{stats.totalBatches}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Active Cohorts</span>
                </div>
              </div>

              {/* Card 2: Enrolled Learners */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>My Students</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3B82F6', padding: '8px', borderRadius: '8px' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#1E293B' }}>{stats.totalStudents}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Enrolled Learners</span>
                </div>
              </div>

              {/* Card 3: Today's Live Sessions */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Today's Classes</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10B981', padding: '8px', borderRadius: '8px' }}>
                    <Video size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#1E293B' }}>{stats.todayClassesCount}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>Scheduled Today</span>
                </div>
              </div>

              {/* Card 4: Attendance Status */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Attendance Pending</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#F59E0B', padding: '8px', borderRadius: '8px' }}>
                    <CalendarCheck size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: stats.attendancePendingCount > 0 ? '#F59E0B' : '#10B981' }}>{stats.attendancePendingCount}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Batches to mark</span>
                </div>
              </div>

              {/* Card 5: Upcoming Sessions */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Upcoming Classes</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#8B5CF6', padding: '8px', borderRadius: '8px' }}>
                    <Clock size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#1E293B' }}>{stats.upcomingClassesCount}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Next 7 days</span>
                </div>
              </div>

              {/* Card 6: Activity Points */}
              <div className="stat-card-premium" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px', borderRadius: '14px', background: '#FFF', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="stat-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="stat-card-label" style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>Points Awarded</span>
                  <div className="stat-card-icon" style={{ background: 'rgba(236, 72, 153, 0.08)', color: '#EC4899', padding: '8px', borderRadius: '8px' }}>
                    <Trophy size={18} />
                  </div>
                </div>
                <div>
                  <h3 className="stat-card-value" style={{ fontSize: '26px', fontWeight: '800', margin: '4px 0', color: '#1E293B' }}>{stats.totalPoints}</h3>
                  <span className="stat-card-footer" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Total activity score</span>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts Bar */}
            <div style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--primary-color)" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1E293B' }}>Quick Teaching Actions:</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button className="btn btn-outline btn-sm" onClick={openCreateBatchModal}>
                  <Plus size={14} /> Create Batch
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowLiveModal(true)}>
                  <Video size={14} /> Schedule Class
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleTabChange('attendance')}>
                  <CalendarCheck size={14} /> Take Attendance
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowAnnModal(true)}>
                  <Megaphone size={14} /> Broadcast Announcement
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => handleTabChange('assignments')}>
                  <FileText size={14} /> Create Assignment
                </button>
              </div>
            </div>

            {/* 2-Column Executive Dashboard */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
              {/* Left Column: Recent Learners (with real pictures!) */}
              <div className="dashboard-card-section" style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="section-title-premium" style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Users size={18} color="var(--primary-color)" /> Enrolled Learners Directory
                  </h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleTabChange('students')}>View All</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="table-premium" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Photo & Name</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Roll No</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Course</th>
                        <th style={{ padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Batch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.slice(0, 5).map(s => {
                        const initials = s.name ? s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                        return (
                          <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }} onClick={() => openStudentDetails(s)}>
                            <td style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--border-color)', flexShrink: 0 }}>
                                {(s.profile_pic || s.profilePhotoUrl) && (s.profile_pic || s.profilePhotoUrl).trim() !== '' ? (
                                  <img src={s.profile_pic || s.profilePhotoUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                ) : (
                                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-color)' }}>{initials}</span>
                                )}
                              </div>
                              <div>
                                <strong style={{ fontSize: 13, color: '#1E293B' }}>{s.name}</strong>
                                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{s.email}</div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700 }}>{s.rollNumber || s.id}</td>
                            <td style={{ padding: '10px 12px' }}>{s.course || 'Data Science & AI'}</td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'rgba(108,60,240,0.08)', color: 'var(--primary-color)', borderRadius: 6 }}>
                                {s.batch_name || s.batchName || 'Assigned'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                            No students registered in assigned batches.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Today's Live Sessions & Announcements */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Section: Live Classes */}
                <div style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Video size={18} color="#10B981" /> Live Teaching Schedules
                    </h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTabChange('live-classes')}>Manage</button>
                  </div>

                  {liveClasses.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-alt)', borderRadius: 12 }}>
                      No live sessions scheduled. Click "Schedule Class" above to set one up.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {liveClasses.slice(0, 3).map(lc => (
                        <div key={lc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1E293B' }}>{lc.title || lc.lectureName}</div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                              📅 {lc.date} • ⏰ {lc.time || lc.startTime} • Batch: <strong>{lc.batchName || lc.batch_name || 'Assigned'}</strong>
                            </div>
                          </div>
                          {lc.meetLink || lc.meet_link ? (
                            <a href={lc.meetLink || lc.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <ExternalLink size={13} /> Join
                            </a>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>No link</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section: Recent Announcements */}
                <div style={{ background: '#FFF', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Megaphone size={18} color="#F59E0B" /> Latest Announcements
                    </h3>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleTabChange('announcements')}>Broadcast</button>
                  </div>

                  {announcements.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--surface-alt)', borderRadius: 12 }}>
                      No announcements posted yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {announcements.slice(0, 3).map(ann => (
                        <div key={ann.id} style={{ padding: '12px 14px', background: 'var(--surface-alt)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <strong style={{ fontSize: 13, color: '#1E293B' }}>{ann.title}</strong>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: ann.priority === 'Urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: ann.priority === 'Urgent' ? '#EF4444' : '#3B82F6' }}>
                              {ann.priority || 'Normal'}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                            {ann.message || ann.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BATCH MANAGEMENT (FULL ADMIN RIGHTS) ──────────────────── */}
        {activeTab === 'batches' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Batch Management Center</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Create, configure, schedule, and oversee student cohorts
                </p>
              </div>
              <button className="btn btn-primary" onClick={openCreateBatchModal} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <Plus size={16} /> Create New Batch
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {batches.map(b => (
                <div key={b.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(108,60,240,0.1)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: 6 }}>
                        {b.code || b.batchId || b.id}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: b.status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: b.status === 'Active' ? '#10B981' : '#F59E0B', borderRadius: 6 }}>
                        {b.status || 'Active'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px', color: '#121118' }}>{b.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                      Course: <strong>{b.course_name || 'Data Science & AI'}</strong>
                    </p>

                    <div style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Daily Timings:</span>
                        <strong>{b.timing || '10:00 AM - 12:00 PM'}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Duration:</span>
                        <strong>{b.duration_days || 50} Days</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Enrolled Learners:</span>
                        <strong>{b.students_count || (Array.isArray(b.student_ids) ? b.student_ids.length : 0)} / {b.max_students || 30}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEditBatchModal(b)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Pencil size={13} /> Edit Batch
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAttBatchId(b.id); handleTabChange('attendance'); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <CalendarCheck size={13} /> Attendance
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setStudentBatchFilter(b.name || b.id); handleTabChange('students'); }} style={{ gridColumn: 'span 2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <Users size={13} /> View Enrolled Students
                    </button>
                  </div>
                </div>
              ))}
              {batches.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <GraduationCap size={48} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ margin: 0, fontWeight: 800 }}>No Batches Assigned or Created</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '6px 0 16px' }}>Click "+ Create New Batch" to set up your first cohort.</p>
                  <button className="btn btn-primary" onClick={openCreateBatchModal}>+ Create New Batch</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: MY STUDENTS (ADMIN-GRADE REGISTRY WITH REAL PICTURES) ──── */}
        {activeTab === 'students' && (
          <div className="animate-fade-in">
            {/* Header & Export Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Student Accounts Registry</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Complete directory of enrolled students across your training batches
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline" onClick={handleExportStudentsCSV} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                  <Download size={15} /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter Bar (Search, Batch, Course, Status) */}
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 16, padding: '16px 20px', marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, alignItems: 'center' }}>
                {/* Search Input */}
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    placeholder="Search by name, email, roll no..."
                    className="form-input"
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    style={{ paddingLeft: 36 }}
                  />
                </div>

                {/* Batch Filter */}
                <div>
                  <select className="form-select" value={studentBatchFilter} onChange={(e) => setStudentBatchFilter(e.target.value)}>
                    <option value="all">-- All Batches ({batches.length}) --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.name}>{b.name} ({b.code || b.batchId})</option>
                    ))}
                  </select>
                </div>

                {/* Course Filter */}
                <div>
                  <select className="form-select" value={studentCourseFilter} onChange={(e) => setStudentCourseFilter(e.target.value)}>
                    <option value="all">-- All Courses --</option>
                    {courses.map(c => (
                      <option key={c.id || c.title} value={c.title || c.name}>{c.title || c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <select className="form-select" value={studentStatusFilter} onChange={(e) => setStudentStatusFilter(e.target.value)}>
                    <option value="all">-- All Account Statuses --</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                <span>Showing <strong>{filteredTrainerStudents.length}</strong> of {students.length} students</span>
                {(studentSearchQuery || studentBatchFilter !== 'all' || studentCourseFilter !== 'all' || studentStatusFilter !== 'all') && (
                  <button 
                    className="btn btn-ghost btn-xs" 
                    onClick={() => {
                      setStudentSearchQuery('');
                      setStudentBatchFilter('all');
                      setStudentCourseFilter('all');
                      setStudentStatusFilter('all');
                    }}
                    style={{ color: 'var(--primary-color)', fontWeight: 700 }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Students Table with Student Photos */}
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                  <thead style={{ background: 'var(--surface-alt)', borderBottom: '1.5px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Learner Profile</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Student ID</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Contact</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Course & Batch</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Attendance</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Activity</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Status</th>
                      <th style={{ padding: '14px 18px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: 11.5 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainerStudents.map(s => {
                      const initials = s.name ? s.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST';
                      const attVal = Number(s.attendance || s.attendanceRate || 0);
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                          {/* Student Picture & Full Name */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid #FFFFFF',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                flexShrink: 0
                              }}>
                                {(s.profile_pic || s.profilePhotoUrl) && (s.profile_pic || s.profilePhotoUrl).trim() !== '' ? (
                                  <img 
                                    src={s.profile_pic || s.profilePhotoUrl} 
                                    alt={s.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                  />
                                ) : (
                                  <span style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5', letterSpacing: 0.5 }}>{initials}</span>
                                )}
                              </div>
                              <div>
                                <div 
                                  style={{ fontWeight: 800, color: '#1E293B', cursor: 'pointer' }}
                                  onClick={() => openStudentDetails(s)}
                                >
                                  {s.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{s.email}</div>
                              </div>
                            </div>
                          </td>

                          {/* Student ID / Roll Number */}
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#4338CA' }}>
                            {s.rollNumber || s.id}
                          </td>

                          {/* Contact Info (Mobile) */}
                          <td style={{ padding: '14px 18px', fontSize: 12.5 }}>
                            {s.phone ? (
                              <a href={`tel:${s.phone}`} style={{ textDecoration: 'none', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} color="var(--primary-color)" /> {s.phone}
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                            )}
                          </td>

                          {/* Course & Batch */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 12.5 }}>{s.course || 'Data Science & AI'}</div>
                            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'rgba(108,60,240,0.08)', color: 'var(--primary-color)', borderRadius: 6 }}>
                              {s.batch_name || s.batchName || 'Assigned'}
                            </span>
                          </td>

                          {/* Attendance Rate */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, minWidth: 50, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${attVal}%`, height: '100%', background: attVal >= 75 ? '#10B981' : attVal >= 50 ? '#F59E0B' : '#EF4444' }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>{attVal}%</span>
                            </div>
                          </td>

                          {/* Activity Score */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: 12.5, color: '#EC4899', background: 'rgba(236,72,153,0.08)', padding: '3px 8px', borderRadius: 6 }}>
                              <Trophy size={13} /> {s.activityPoints || 0} pts
                            </span>
                          </td>

                          {/* Account Status */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: s.status === 'Active' || s.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: s.status === 'Active' || s.status === 'active' ? '#10B981' : '#F59E0B', borderRadius: 6 }}>
                              {s.status || 'Active'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => openStudentDetails(s)} 
                                title="View Full Profile Details"
                                style={{ padding: '5px 8px' }}
                              >
                                <Eye size={14} /> Profile
                              </button>
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => openEditStudentModal(s)} 
                                title="Edit Student Info"
                                style={{ padding: '5px 8px' }}
                              >
                                <Pencil size={14} />
                              </button>
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => { setAwardPointsStudent(s); }} 
                                title="Award Activity Points"
                                style={{ padding: '5px 8px', color: '#EC4899' }}
                              >
                                <Award size={14} />
                              </button>
                              {s.email && (
                                <a
                                  href={`mailto:${s.email}`}
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '5px 8px', textDecoration: 'none', color: 'var(--primary-color)' }}
                                  title="Send Email"
                                >
                                  <Mail size={14} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTrainerStudents.length === 0 && (
                      <tr>
                        <td colSpan="8" style={{ padding: 36, textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No students matching your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: COURSES & CURRICULUM ──────────────────────────────────── */}
        {activeTab === 'courses' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Courses & Academic Curriculum</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Browse course structures, curriculum syllabi, and learning modules
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {courses.map(c => (
                <div key={c.id || c.title} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 22, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(59,130,246,0.1)', color: '#3B82F6', padding: '3px 8px', borderRadius: 6 }}>
                      {c.category || 'Professional Track'}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 800, margin: '10px 0 6px', color: '#1E293B' }}>{c.title || c.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                      {c.description || 'Comprehensive industry curriculum with hands-on capstone projects and mentor-led labs.'}
                    </p>

                    <div style={{ background: 'var(--surface-alt)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span>Modules: <strong>{c.modules?.length || 6} Chapters</strong></span>
                      <span>Duration: <strong>{c.duration || '50 Days'}</strong></span>
                    </div>
                  </div>

                  <button className="btn btn-outline btn-sm" onClick={() => { showToast(`Viewing syllabus for ${c.title || c.name}`); }} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <BookOpen size={14} /> Explore Curriculum
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 5: ATTENDANCE MANAGEMENT ─────────────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Attendance Management</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Take daily class attendance, verify live session attendees, and track consistency
                </p>
              </div>
            </div>

            {/* Selectors */}
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label">Select Assigned Batch *</label>
                  <select className="form-select" value={attBatchId} onChange={e => setAttBatchId(e.target.value)}>
                    <option value="">-- Choose Batch --</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Class Session Date *</label>
                  <input type="date" className="form-input" value={attDate} onChange={e => setAttDate(e.target.value)} />
                </div>
              </div>
            </div>

            {attBatchId && (
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, marginBottom: 32 }}>
                <div>
                  {/* Summary Bar */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div><span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Total</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{attSummary.total}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#10B981', textTransform: 'uppercase', fontWeight: 800 }}>Present</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#10B981' }}>{attSummary.present}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#EF4444', textTransform: 'uppercase', fontWeight: 800 }}>Absent</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{attSummary.absent}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#F59E0B', textTransform: 'uppercase', fontWeight: 800 }}>Not Marked</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{attSummary.notMarked}</h3></div>
                      <div><span style={{ fontSize: 11, color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 800 }}>Rate</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--primary-color)' }}>{attSummary.rate}%</h3></div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => handleSelectAll('Present')}
                        style={{ borderColor: '#10B981', color: '#059669', fontWeight: 800, background: 'rgba(16,185,129,0.06)' }}
                      >
                        ✓ All Present
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm" 
                        onClick={() => handleSelectAll('Absent')}
                        style={{ borderColor: '#EF4444', color: '#DC2626', fontWeight: 800, background: 'rgba(239,68,68,0.06)' }}
                      >
                        ✗ All Absent
                      </button>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={handleResetAttendance}>Reset</button>
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm" 
                        onClick={handleSaveAttendance} 
                        disabled={savingAttendance}
                        style={{ background: 'linear-gradient(135deg, #10B981, #059669)', border: 'none', color: '#FFF', fontWeight: 800, padding: '6px 18px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}
                      >
                        <Save size={14} /> {savingAttendance ? 'Saving...' : 'Save Attendance'}
                      </button>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                      <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Learner</th>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Student ID</th>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attBatchStudents.map(s => {
                          const status = attStudentRecords[s.id] || 'Not Marked';
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                                  {(s.profile_pic || s.profilePhotoUrl) ? (
                                    <img src={s.profile_pic || s.profilePhotoUrl} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-color)' }}>{s.name ? s.name[0] : 'S'}</span>
                                  )}
                                </div>
                                <strong style={{ color: '#1E293B' }}>{s.name}</strong>
                              </td>
                              <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700 }}>{s.rollNumber || s.id}</td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'inline-flex', gap: '8px', background: 'var(--surface-alt)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkStudent(s.id, 'Present')}
                                    style={{
                                      padding: '6px 18px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontWeight: 800,
                                      fontSize: '12.5px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      background: status === 'Present' ? '#10B981' : 'transparent',
                                      color: status === 'Present' ? '#FFFFFF' : 'var(--text-secondary)',
                                      boxShadow: status === 'Present' ? '0 2px 8px rgba(16,185,129,0.45)' : 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    ✓ Present
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkStudent(s.id, 'Absent')}
                                    style={{
                                      padding: '6px 18px',
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontWeight: 800,
                                      fontSize: '12.5px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      background: status === 'Absent' ? '#EF4444' : 'transparent',
                                      color: status === 'Absent' ? '#FFFFFF' : 'var(--text-secondary)',
                                      boxShadow: status === 'Absent' ? '0 2px 8px rgba(239,68,68,0.45)' : 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    ✗ Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {attBatchStudents.length === 0 && (
                          <tr>
                            <td colSpan="3" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>
                              No students found in this batch.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Column: Attendance Calendar / Batches list */}
                <div>
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 18 }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800 }}>Assigned Cohorts</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {batches.map(b => (
                        <div
                          key={b.id}
                          onClick={() => setAttBatchId(b.id)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 10,
                            background: attBatchId === b.id ? 'rgba(108,60,240,0.08)' : 'var(--surface-alt)',
                            border: attBatchId === b.id ? '1.5px solid var(--primary-color)' : '1px solid var(--border-color)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontWeight: 700, fontSize: 13, color: attBatchId === b.id ? 'var(--primary-color)' : '#1E293B' }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.timing || '10:00 AM - 12:00 PM'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 6: LIVE CLASSES ──────────────────────────────────────────── */}
        {activeTab === 'live-classes' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Live Classes & Sessions</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Schedule, broadcast, and launch interactive live classrooms
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowLiveModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <Plus size={16} /> Schedule Live Class
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {liveClasses.map(lc => (
                <div key={lc.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '3px 8px', borderRadius: 6 }}>
                        {lc.status || 'Upcoming'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        📅 {lc.date}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: '#1E293B' }}>{lc.title || lc.lectureName}</h3>
                    <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                      Batch: <strong>{lc.batchName || lc.batch_name || 'Assigned Batch'}</strong>
                    </p>

                    <div style={{ background: 'var(--surface-alt)', borderRadius: 10, padding: '8px 12px', fontSize: 12, marginBottom: 14 }}>
                      ⏰ <strong>{lc.time || `${lc.startTime} - ${lc.endTime}`}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                    {lc.meetLink || lc.meet_link ? (
                      <a href={lc.meetLink || lc.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <ExternalLink size={14} /> Join / Start
                      </a>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No meeting link</span>
                    )}
                    <button className="btn btn-outline btn-sm" onClick={() => handleDeleteLiveClass(lc.id)} style={{ color: '#EF4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {liveClasses.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Video size={48} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ margin: 0, fontWeight: 800 }}>No Live Classes Scheduled</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '6px 0 16px' }}>Click below to create your first Google Meet or Zoom class.</p>
                  <button className="btn btn-primary" onClick={() => setShowLiveModal(true)}>Schedule Live Class</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 7: RECORDED CLASSES (ADMIN-PARITY TWO-LEVEL SYSTEM) ───────── */}
        {activeTab === 'recorded-classes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <FilterBar
              searchPlaceholder="Search Recorded Class"
              searchValue={recordedSearchQuery}
              onSearchChange={(val) => setRecordedSearchQuery(val)}
              filters={[
                {
                  label: 'Course',
                  value: recordedCourseFilter,
                  onChange: (val) => setRecordedCourseFilter(val),
                  options: Array.from(new Set(recordedClasses.map(c => c.course_title || c.course_name))).filter(Boolean).map(c => ({ value: c, label: c }))
                },
                {
                  label: 'Batch',
                  value: recordedBatchFilter,
                  onChange: (val) => setRecordedBatchFilter(val),
                  options: batches.map(b => ({ value: b.id, label: b.name }))
                },
                {
                  label: 'Status',
                  value: recordedVisibilityFilter,
                  onChange: (val) => setRecordedVisibilityFilter(val),
                  options: [
                    { value: 'everyone', label: 'Everyone' },
                    { value: 'paid', label: 'Paid Only' }
                  ]
                }
              ]}
              showDateFilter={true}
              activeQuickFilter={recordedDateFilter}
              onQuickFilterChange={(pill) => setRecordedDateFilter(pill)}
              startDateValue={recordedStartDateFilter}
              endDateValue={recordedEndDateFilter}
              onStartDateChange={(val) => setRecordedStartDateFilter(val)}
              onEndDateChange={(val) => setRecordedEndDateFilter(val)}
              onExportCSV={exportRecordedClassesToCSV}
              onExportExcel={exportRecordedClassesToExcel}
              onExportPDF={exportRecordedClassesToPDF}
              actionLabel="+ Add Recorded Class"
              onActionClick={() => {
                setEditingRecordedClass(null);
                const targetBId = recordedBatchFilter || (batches[0]?.id || '');
                setSelectedBatchId(targetBId ? `batch:${targetBId}` : '');
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
                    const batchRecordings = (recordedClasses || []).filter(r => String(r.batch_id || r.batchId) === bId || String(r.playlist_id) === bId);
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
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.05) 50%, rgba(15, 23, 42, 0.65) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                            }}>
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
                              </div>

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

                        {/* Lower Body */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#475569' }}>
                              <span style={{ fontWeight: 600 }}>Instructor:</span>
                              <strong style={{ color: '#0F172A', fontWeight: 750 }}>{batch.trainer_name || userProfile?.fullName || 'Instructor'}</strong>
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

                  {/* SECTION B: CUSTOM PLAYLISTS */}
                  {customPlaylists.map((playlist, idx) => {
                    const plId = String(playlist.id || playlist.uid);
                    const plRecordings = (recordedClasses || []).filter(r => String(r.playlist_id) === plId || String(r.batch_id) === plId);
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
                        <div style={{ padding: '12px 12px 0 12px' }}>
                          <div style={{
                            height: 145,
                            position: 'relative',
                            borderRadius: 18,
                            overflow: 'hidden',
                            background: '#0F172A',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                          }}>
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
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0.05) 50%, rgba(15, 23, 42, 0.65) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              padding: '12px 14px',
                            }}>
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

                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', color: '#475569' }}>
                              <span style={{ fontWeight: 600 }}>Access:</span>
                              <strong style={{ color: '#0F172A', fontWeight: 750 }}>{isAll ? 'All Portal Trainees' : (playlist.batch_name || 'Cohort')}</strong>
                            </div>
                          </div>

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
                    {selectedPlaylistBatch.isCustom && (
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
                  const playlistLessons = (recordedClasses || []).filter(r => {
                    if (isCustom) {
                      return String(r.playlist_id) === targetId || String(r.batch_id) === targetId;
                    }
                    return String(r.batch_id || r.batchId) === targetId || String(r.playlist_id) === targetId;
                  });

                  const playlistTotalDuration = playlistLessons.reduce((acc, r) => acc + parseDurationToSeconds(r.duration), 0);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                                        onClick={() => handleDeleteRecordedClass(item.id || item.uid || item._id)}
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

        {/* ─── TAB 8: ASSIGNMENTS (POWERED BY TRAINER ASSIGNMENTS VIEW) ──────── */}
        {activeTab === 'assignments' && (
          <div className="animate-fade-in">
            <TrainerAssignmentsView
              batches={batches}
              students={students}
              trainerUid={trainerUid}
              trainerName={userProfile?.fullName || 'Faculty Trainer'}
              showToast={showToast}
              isAdmin={false}
            />
          </div>
        )}

        {/* ─── TAB 9: ANNOUNCEMENTS ─────────────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Announcements & Broadcasts</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Send urgent notices, syllabus updates, and reminders to learners
                </p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowAnnModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                <Plus size={16} /> New Announcement
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {announcements.map(ann => (
                <div key={ann.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: ann.priority === 'Urgent' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: ann.priority === 'Urgent' ? '#EF4444' : '#3B82F6' }}>
                        {ann.priority || 'Normal'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>📅 {ann.date}</span>
                    </div>

                    <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px', color: '#1E293B' }}>{ann.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                      {ann.message || ann.content}
                    </p>

                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Target: <strong>{ann.batchName || ann.batch_name || 'All Students'}</strong>
                    </div>

                    {ann.attachmentUrl && (
                      <a href={ann.attachmentUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 700 }}>
                        <Download size={13} /> {ann.attachmentName || 'Download Attachment'}
                      </a>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => handleDeleteAnnouncement(ann.id)} style={{ color: '#EF4444' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', background: '#FFF', borderRadius: 16, border: '1px solid var(--border-color)' }}>
                  <Megaphone size={48} color="var(--primary-color)" style={{ margin: '0 auto 12px' }} />
                  <h3 style={{ margin: 0, fontWeight: 800 }}>No Announcements Broadcasted</h3>
                  <p style={{ color: 'var(--text-secondary)', margin: '6px 0 16px' }}>Click below to post an announcement to your students.</p>
                  <button className="btn btn-primary" onClick={() => setShowAnnModal(true)}>New Announcement</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 10: BATCH CHAT ───────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in">
            <BatchChatPage user={currentUser} userProfile={userProfile} batches={batches} />
          </div>
        )}

        {/* ─── TAB 11: ACTIVITY SCORES ──────────────────────────────────────── */}
        {activeTab === 'activity-scores' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Learner Gamification & Leaderboard</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Recognize active participation, punctuality, and project excellence
                </p>
              </div>
            </div>

            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 15, color: '#1E293B' }}>Class Leaderboard Rankings</strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sorted by total activity points</span>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Rank</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Learner</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Batch</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Points</th>
                    <th style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--text-secondary)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[...students].sort((a, b) => (Number(b.activityPoints) || 0) - (Number(a.activityPoints) || 0)).map((s, idx) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 800 }}>
                        {idx === 0 ? '🥇 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                      </td>
                      <td style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {(s.profile_pic || s.profilePhotoUrl) ? (
                            <img src={s.profile_pic || s.profilePhotoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-color)' }}>{s.name ? s.name[0] : 'S'}</span>
                          )}
                        </div>
                        <strong>{s.name}</strong>
                      </td>
                      <td style={{ padding: '12px 18px' }}>{s.batch_name || s.batchName || 'Assigned'}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 800, color: '#EC4899' }}>
                        {s.activityPoints || 0} pts
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <button className="btn btn-outline btn-xs" onClick={() => setAwardPointsStudent(s)} style={{ color: '#EC4899', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Award size={13} /> Award Points
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)' }}>No learners to display.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 12: TRAINER PROFILE ──────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: 750 }}>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: '#1E293B' }}>Trainer Faculty Profile</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>View and manage your professional instructor profile</p>
                </div>
                {!editingTrainerProfile ? (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={startEditTrainerProfile}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                  >
                    <Pencil size={14} /> Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleSaveTrainerProfile}
                      disabled={savingTrainerProfile}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                    >
                      <Save size={14} /> {savingTrainerProfile ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingTrainerProfile(false)}
                      disabled={savingTrainerProfile}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ position: 'relative', width: 85, height: 85, borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--primary-color)' }}>
                  <img 
                    src={userProfile?.profilePic || userProfile?.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt="Trainer Avatar" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Camera size={14} /> {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploadingAvatar} />
                  </label>
                  <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>JPG, PNG or WEBP (Max 5MB)</p>
                </div>
              </div>

              {!editingTrainerProfile ? (
                /* View Mode */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</span>
                    <strong style={{ fontSize: 15, color: '#1E293B' }}>{userProfile?.fullName || userProfile?.name || '—'}</strong>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Faculty ID</span>
                    <strong style={{ fontSize: 15, fontFamily: 'monospace', color: 'var(--primary-color)' }}>{userProfile?.trainerId || userProfile?.code || 'TRN001013'}</strong>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Email Address</span>
                    <span style={{ fontSize: 14, color: '#334155' }}>{userProfile?.email || '—'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Mobile Number</span>
                    <span style={{ fontSize: 14, color: '#334155' }}>{userProfile?.phone || userProfile?.mobile || 'Not provided'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Role / Designation</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.designation || userProfile?.specialization || 'Faculty Trainer'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Domain / Specialization</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.specialization || 'Fullstack Engineering'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Highest Qualification</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.qualification || 'Not provided'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Experience</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.experience || 'Not provided'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Technical Skills & Subjects</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.skills || 'Not specified'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current City</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.city || 'Not specified'}</span>
                  </div>
                  <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gender</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{userProfile?.gender || 'Not specified'}</span>
                  </div>
                  {userProfile?.bio && (
                    <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Bio / Summary</span>
                      <p style={{ margin: '4px 0 0', fontSize: 13.5, color: '#334155', lineHeight: 1.5 }}>{userProfile.bio}</p>
                    </div>
                  )}
                  {userProfile?.linkedin && (
                    <div style={{ padding: 14, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
                      <span style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>LinkedIn Profile</span>
                      <a href={userProfile.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 13.5, color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>
                        {userProfile.linkedin}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <form onSubmit={handleSaveTrainerProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Full Name *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileName}
                      onChange={e => setTrainerProfileName(e.target.value)}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Faculty ID (Fixed)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={userProfile?.trainerId || userProfile?.code || 'TRN001013'}
                      readOnly
                      style={{ fontFamily: 'monospace', fontWeight: 700, background: '#F1F5F9' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Email Address (Fixed)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={userProfile?.email || ''}
                      readOnly
                      style={{ background: '#F1F5F9' }}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Mobile Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfilePhone}
                      onChange={e => setTrainerProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Role / Designation *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileRole}
                      onChange={e => setTrainerProfileRole(e.target.value)}
                      placeholder="e.g. Lead Instructor, Senior Faculty"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Domain / Specialization *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileSpecialization}
                      onChange={e => setTrainerProfileSpecialization(e.target.value)}
                      placeholder="e.g. Fullstack Web Dev, AI & Data Science"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Highest Qualification / Degree</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileQualification}
                      onChange={e => setTrainerProfileQualification(e.target.value)}
                      placeholder="e.g. M.Tech in CSE, B.E., MCA"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Years of Experience</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileExperience}
                      onChange={e => setTrainerProfileExperience(e.target.value)}
                      placeholder="e.g. 5+ Years"
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Key Technical Skills</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileSkills}
                      onChange={e => setTrainerProfileSkills(e.target.value)}
                      placeholder="e.g. Python, React, Node.js, SQL, AWS, Docker"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Current City</label>
                    <input
                      type="text"
                      className="form-input"
                      value={trainerProfileCity}
                      onChange={e => setTrainerProfileCity(e.target.value)}
                      placeholder="e.g. Chennai, Bangalore"
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600 }}>Gender</label>
                    <select
                      className="form-input"
                      value={trainerProfileGender}
                      onChange={e => setTrainerProfileGender(e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Bio / Summary</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={trainerProfileBio}
                      onChange={e => setTrainerProfileBio(e.target.value)}
                      placeholder="Brief overview of your teaching approach..."
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={trainerProfileLinkedin}
                      onChange={e => setTrainerProfileLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditingTrainerProfile(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={savingTrainerProfile}>
                      {savingTrainerProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 13: SETTINGS ─────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{ maxWidth: 650 }}>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 28, boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#1E293B' }}>Security & Credentials</h2>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                Update your login password and manage account security
              </p>

              {errorMessage && (
                <div style={{ background: '#FEE2E2', border: '1px solid #F87171', color: '#B91C1C', padding: '10px 14px', borderRadius: 10, fontSize: 13, marginBottom: 18 }}>
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="form-label">Current Password *</label>
                  <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">New Password *</label>
                  <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 6 characters" required />
                </div>
                <div>
                  <label className="form-label">Confirm New Password *</label>
                  <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={passwordSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                    <Lock size={15} /> {passwordSaving ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODAL 1: BATCH CREATION & EDIT MODAL ──────────────────────────── */}
      {showBatchModal && (
        <CustomModal 
          isOpen={showBatchModal} 
          onClose={() => { setShowBatchModal(false); resetBatchForm(); }} 
          title={editingBatch ? `Edit Batch — ${editingBatch.name}` : 'Create New Training Batch'}
        >
          <form onSubmit={handleSaveBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Batch Name / Identifier *</label>
              <input 
                type="text" 
                className="form-input" 
                value={batchName} 
                onChange={e => setBatchName(e.target.value)} 
                placeholder="e.g. Gen AI & Data Science - Alpha" 
                required 
              />
            </div>

            <div>
              <label className="form-label">Course Title *</label>
              <select className="form-select" value={batchCourseName} onChange={e => setBatchCourseName(e.target.value)} required>
                <option value="">-- Choose Course --</option>
                {courses.map(c => (
                  <option key={c.id || c.title} value={c.title || c.name}>{c.title || c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Start Date *</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={batchStartDate} 
                  onChange={e => {
                    const d = e.target.value;
                    setBatchStartDate(d);
                    if (d && batchDurationDays) setBatchEndDate(addDaysToDate(d, batchDurationDays));
                  }} 
                  required 
                />
              </div>
              <div>
                <label className="form-label">Duration (Days) *</label>
                <input 
                  type="number" 
                  min="1" 
                  max="365" 
                  className="form-input" 
                  value={batchDurationDays} 
                  onChange={e => {
                    const days = Math.max(1, parseInt(e.target.value, 10) || 1);
                    setBatchDurationDays(days);
                    if (batchStartDate) setBatchEndDate(addDaysToDate(batchStartDate, days));
                  }} 
                  required 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Calculated End Date</label>
                <input type="date" className="form-input" value={batchEndDate} readOnly style={{ background: 'var(--surface-alt)' }} />
              </div>
              <div>
                <label className="form-label">Daily Timing *</label>
                <input type="text" className="form-input" value={batchTiming} onChange={e => setBatchTiming(e.target.value)} placeholder="10:00 AM - 12:00 PM" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Max Students Capacity</label>
                <input type="number" min="5" max="100" className="form-input" value={batchMaxStudents} onChange={e => setBatchMaxStudents(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Cohort Status</label>
                <select className="form-select" value={batchStatus} onChange={e => setBatchStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => { setShowBatchModal(false); resetBatchForm(); }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingBatch}>
                <Save size={14} /> {savingBatch ? 'Saving...' : editingBatch ? 'Update Batch' : 'Create Batch'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ─── MODAL 2: STUDENT DETAILS (ADMIN LEVEL PERFECTION WITH REAL PHOTO & PASSWORD) ── */}
      {selectedStudentDetails && (
        <CustomModal 
          isOpen={!!selectedStudentDetails} 
          onClose={() => setSelectedStudentDetails(null)} 
          title={`Student Profile Details — ${selectedStudentDetails.name}`}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
            {/* Left Column: Avatar & Quick Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 20 }}>
              <div style={{
                width: 96,
                height: 96,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #FFFFFF',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.15)',
                marginBottom: 10
              }}>
                {(selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl) && (selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl).trim() !== '' ? (
                  <img 
                    src={selectedStudentDetails.profile_pic || selectedStudentDetails.profilePhotoUrl} 
                    alt={selectedStudentDetails.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                ) : (
                  <span style={{ fontSize: 32, fontWeight: 800, color: '#4F46E5' }}>
                    {selectedStudentDetails.name ? selectedStudentDetails.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'ST'}
                  </span>
                )}
              </div>

              <label className="btn btn-outline btn-xs" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 12, fontSize: 11, padding: '4px 10px' }}>
                <Camera size={13} /> {uploadingStudentPhoto ? 'Uploading...' : 'Change Photo'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleUploadStudentPhoto(selectedStudentDetails.id, e.target.files[0])}
                  disabled={uploadingStudentPhoto}
                />
              </label>

              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{selectedStudentDetails.name}</h3>
              <code style={{ fontSize: 11.5, color: '#4338CA', display: 'block', marginBottom: 14 }}>{selectedStudentDetails.rollNumber || selectedStudentDetails.id}</code>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 14, textAlign: 'left' }}>
                <div>
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Attendance Rate</span>
                  <strong style={{ fontSize: 13, color: 'var(--primary-color)' }}>{selectedStudentDetails.attendance || 0}% Rate</strong>
                </div>
                <div>
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Fee Status</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: selectedStudentDetails.feesStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: selectedStudentDetails.feesStatus === 'Paid' ? '#10B981' : '#EF4444' }}>
                    {selectedStudentDetails.feesStatus || 'Pending'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block' }}>Activity Points</span>
                  <strong style={{ fontSize: 13, color: '#EC4899' }}>{selectedStudentDetails.activityPoints || 0} pts</strong>
                </div>
              </div>
            </div>

            {/* Right Column: Credentials & Personal Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Student Login Password Card (Eye Toggle & 1-Click Copy) */}
              <div style={{ background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)', border: '1.5px solid #C7D2FE', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    🔑 Student Login Credentials
                  </span>
                  <span style={{ fontSize: 10, background: '#E0E7FF', color: '#4338CA', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                    Trainer Access
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                  <span style={{ color: '#64748B' }}>Login Email:</span>
                  <code style={{ fontWeight: 700, color: '#1E293B' }}>{selectedStudentDetails.email}</code>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: '#64748B' }}>Password:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <code style={{ fontWeight: 800, color: '#4F46E5', fontSize: 13 }}>
                      {showStudentPassword 
                        ? (selectedStudentDetails.password || selectedStudentDetails.tempPassword || selectedStudentDetails.initialPassword || selectedStudentDetails.rawPassword || 'Student@123') 
                        : '••••••••••••'}
                    </code>
                    <button 
                      type="button" 
                      onClick={() => setShowStudentPassword(!showStudentPassword)} 
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
                      title={showStudentPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showStudentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        const pwd = selectedStudentDetails.password || selectedStudentDetails.tempPassword || selectedStudentDetails.initialPassword || selectedStudentDetails.rawPassword || 'Student@123';
                        navigator.clipboard.writeText(pwd);
                        showToast('Student password copied to clipboard!');
                      }}
                      style={{ border: 'none', background: '#E0E7FF', color: '#4338CA', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Academic & Contact Details Grid */}
              <div>
                <h4 style={{ fontSize: 12.5, textTransform: 'uppercase', color: 'var(--primary-color)', fontWeight: 800, margin: '0 0 10px', borderBottom: '1px solid var(--border-light)', paddingBottom: 4 }}>
                  Academic & Contact Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Mobile Number</span>
                    <strong>{selectedStudentDetails.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Course Enrolled</span>
                    <strong>{selectedStudentDetails.course || 'Data Science & AI'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Assigned Batch</span>
                    <strong>{selectedStudentDetails.batch_name || selectedStudentDetails.batchName || 'Assigned'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>College / Institute</span>
                    <strong>{selectedStudentDetails.college || 'Levlox Academy'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Location</span>
                    <strong>{selectedStudentDetails.current_location || selectedStudentDetails.location || 'N/A'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: 11 }}>Guardian Contact</span>
                    <strong>{selectedStudentDetails.guardian_phone || selectedStudentDetails.guardian_name || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => {
                    const s = selectedStudentDetails;
                    setSelectedStudentDetails(null);
                    openEditStudentModal(s);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Pencil size={13} /> Edit Student Details
                </button>
                <button 
                  className="btn btn-outline btn-sm" 
                  onClick={() => {
                    const s = selectedStudentDetails;
                    setSelectedStudentDetails(null);
                    setAwardPointsStudent(s);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#EC4899' }}
                >
                  <Award size={13} /> Award Points
                </button>
                {selectedStudentDetails.email && (
                  <a 
                    href={`mailto:${selectedStudentDetails.email}`} 
                    className="btn btn-outline btn-sm" 
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Mail size={13} /> Send Email
                  </a>
                )}
              </div>
            </div>
          </div>
        </CustomModal>
      )}

      {/* ─── MODAL 3: EDIT STUDENT INFO & PHOTO (NO STUDENT CREATION) ──────── */}
      {editingStudent && (
        <CustomModal 
          isOpen={!!editingStudent} 
          onClose={() => setEditingStudent(null)} 
          title={`Edit Student Account — ${editingStudent.name}`}
        >
          <form onSubmit={handleSaveStudentEdit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Full Name *</label>
                <input type="text" className="form-input" value={editStudentName} onChange={e => setEditStudentName(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Roll Number / Student ID (Read Only)</label>
                <input type="text" className="form-input" value={editingStudent.rollNumber || editingStudent.id} readOnly style={{ background: 'var(--surface-alt)', fontFamily: 'monospace' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-input" value={editStudentEmail} onChange={e => setEditStudentEmail(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">Mobile Number *</label>
                <input type="text" className="form-input" value={editStudentPhone} onChange={e => setEditStudentPhone(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Course Title</label>
                <select className="form-select" value={editStudentCourse} onChange={e => setEditStudentCourse(e.target.value)}>
                  {courses.map(c => (
                    <option key={c.id || c.title} value={c.title || c.name}>{c.title || c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Assign Batch</label>
                <select className="form-select" value={editStudentBatchId} onChange={e => setEditStudentBatchId(e.target.value)}>
                  <option value="">-- No Batch Assigned --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">College / Institute</label>
                <input type="text" className="form-input" value={editStudentCollege} onChange={e => setEditStudentCollege(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Current Location / City</label>
                <input type="text" className="form-input" value={editStudentLocation} onChange={e => setEditStudentLocation(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="form-label">Permanent Address</label>
              <input type="text" className="form-input" value={editStudentAddress} onChange={e => setEditStudentAddress(e.target.value)} />
            </div>

            <div>
              <label className="form-label">Account Status</label>
              <select className="form-select" value={editStudentStatus} onChange={e => setEditStudentStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending Verification</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditingStudent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingStudentEdit}>
                <Save size={14} /> {savingStudentEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ─── MODAL 4: AWARD ACTIVITY POINTS ────────────────────────────────── */}
      {awardPointsStudent && (
        <CustomModal 
          isOpen={!!awardPointsStudent} 
          onClose={() => setAwardPointsStudent(null)} 
          title={`Award Points — ${awardPointsStudent.name}`}
        >
          <form onSubmit={handleAwardActivityPoints} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Points to Award</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {[5, 10, 15, 20, 25].map(pts => (
                  <button 
                    key={pts} 
                    type="button" 
                    className={`btn btn-sm ${pointsToAward === pts ? 'btn-primary' : 'btn-outline'}`} 
                    onClick={() => setPointsToAward(pts)}
                  >
                    +{pts} pts
                  </button>
                ))}
              </div>
              <input 
                type="number" 
                min="1" 
                max="100" 
                className="form-input" 
                value={pointsToAward} 
                onChange={e => setPointsToAward(parseInt(e.target.value, 10) || 1)} 
                required 
              />
            </div>

            <div>
              <label className="form-label">Reason / Commendation</label>
              <input 
                type="text" 
                className="form-input" 
                value={awardReason} 
                onChange={e => setAwardReason(e.target.value)} 
                placeholder="e.g. Completed milestone project with top score" 
                required 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setAwardPointsStudent(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingPoints}>
                <Award size={14} /> {savingPoints ? 'Awarding...' : 'Award Score'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ─── MODAL 5: SCHEDULE LIVE CLASS ──────────────────────────────────── */}
      {showLiveModal && (
        <CustomModal isOpen={showLiveModal} onClose={() => setShowLiveModal(false)} title="Schedule Live Teaching Class">
          <form onSubmit={handleScheduleLiveClass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Lecture Title *</label>
              <input type="text" className="form-input" value={liveLectureName} onChange={e => setLiveLectureName(e.target.value)} placeholder="e.g. Deep Learning & Transformers - Part 1" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Target Batch *</label>
                <select className="form-select" value={liveBatchId} onChange={e => setLiveBatchId(e.target.value)} required>
                  <option value="">-- Choose Batch --</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Date *</label>
                <input type="date" className="form-input" value={liveDate} onChange={e => setLiveDate(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Start Time *</label>
                <input type="time" className="form-input" value={liveStartTime} onChange={e => setLiveStartTime(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">End Time *</label>
                <input type="time" className="form-input" value={liveEndTime} onChange={e => setLiveEndTime(e.target.value)} required />
              </div>
            </div>

            <div>
              <label className="form-label">Google Meet or Zoom URL *</label>
              <input type="url" className="form-input" value={liveMeetLink} onChange={e => setLiveMeetLink(e.target.value)} placeholder="https://meet.google.com/..." required />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowLiveModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={schedulingLive}>
                <Video size={14} /> {schedulingLive ? 'Scheduling...' : 'Schedule Class'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ─── MODAL 6: CUSTOM PLAYLIST MODAL ─────────────────────────────── */}
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
                            const res = await uploadUniversalFile(file, 'playlists');
                            if (res && res.url) setPlaylistFormThumbnail(res.url);
                          } catch (err) {
                            showToast(err.message);
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

                  {playlistFormThumbnail && (
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
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowPlaylistModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  <Save size={14} /> {editingPlaylist ? 'Save Changes' : 'Create Playlist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6B: FULL LMS LESSON UPLOAD & EDIT MODAL ─────────────────── */}
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
            <form onSubmit={handleSaveRecordedClass}>
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
                          placeholder="Paste YouTube Link (Public/Unlisted) or Google Drive Link or MP4 URL" 
                          required
                        />
                        {/* Dynamic Verification Banners */}
                        {getYouTubeVideoId(recVideoUrl) && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#991B1B', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Video size={16} color="#DC2626" />
                              <span>
                                <strong>YouTube Video Detected (ID: {getYouTubeVideoId(recVideoUrl)}):</strong> Dynamic playback & HD thumbnail ready. <span style={{ opacity: 0.9 }}>(For privacy, set video to <strong>Unlisted</strong> in YouTube Studio)</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowModalVideoPreview(!showModalVideoPreview)}
                              style={{ background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                            >
                              <PlayCircle size={13} />
                              {showModalVideoPreview ? 'Hide Preview' : 'Test Preview'}
                            </button>
                          </div>
                        )}
                        {getGoogleDriveFileId(recVideoUrl) && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#065F46', background: '#ECFDF5', padding: '8px 12px', borderRadius: 8, border: '1px solid #A7F3D0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <CheckCircle size={16} color="#059669" />
                              <span>
                                <strong>Google Drive Verified (ID: {getGoogleDriveFileId(recVideoUrl)}):</strong> Protected stream active with anti-download DRM shield. <span style={{ opacity: 0.9 }}>(Ensure file sharing is 'Anyone with link can view')</span>
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowModalVideoPreview(!showModalVideoPreview)}
                              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                            >
                              <PlayCircle size={13} />
                              {showModalVideoPreview ? 'Hide Preview' : 'Test Preview'}
                            </button>
                          </div>
                        )}
                        {recVideoUrl && !getYouTubeVideoId(recVideoUrl) && !getGoogleDriveFileId(recVideoUrl) && (
                          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 12, color: '#1E40AF', background: '#EFF6FF', padding: '8px 12px', borderRadius: 8, border: '1px solid #BFDBFE' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Globe size={16} color="#2563EB" />
                              <span><strong>Web Video / Direct Stream Link:</strong> Will play directly in player.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowModalVideoPreview(!showModalVideoPreview)}
                              style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
                            >
                              <PlayCircle size={13} />
                              {showModalVideoPreview ? 'Hide Preview' : 'Test Preview'}
                            </button>
                          </div>
                        )}

                        {/* Inline Test Video Player */}
                        {showModalVideoPreview && recVideoUrl && (
                          <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', border: '2px solid #E2E8F0', height: 260, background: '#000' }}>
                            <SecureVideoPlayer
                              videoUrl={recVideoUrl}
                              title={recTitle || 'Preview Lesson'}
                              watermarkText="Levlox Instructor Test"
                              autoPlay={true}
                              height="260px"
                            />
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
                            try {
                              const res = await uploadUniversalFile(file, 'recorded-classes');
                              if (res && res.url) {
                                setRecVideoUrl(res.url);
                              }
                            } catch (err) {
                              showToast(err.message || 'Video upload failed');
                            } finally {
                              setUploadingVideo(false);
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

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <input 
                        type="file" 
                        id="recMaterialFile" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          try {
                            const res = await uploadUniversalFile(file, 'study-materials');
                            if (res && res.url) {
                              setRecStudyMaterials(prev => [
                                ...prev,
                                {
                                  name: res.originalName || file.name,
                                  url: res.url,
                                  type: res.fileType || 'pdf',
                                  size: res.sizeDisplay || '1.2 MB'
                                }
                              ]);
                              showToast('Study material attached ✓');
                            }
                          } catch (err) {
                            showToast('Material upload failed: ' + err.message);
                          }
                          e.target.value = '';
                        }} 
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline" 
                        style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        onClick={() => document.getElementById('recMaterialFile').click()}
                      >
                        <UploadCloud size={14} /> Attach PDF / Resource File
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>PDF, slides, source code archives, datasets</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="recVisibility">Audience Access</label>
                    <select id="recVisibility" className="form-select" value={recVisibility} onChange={(e) => setRecVisibility(e.target.value)}>
                      <option value="everyone">Everyone (Open Access)</option>
                      <option value="paid">Paid Students Only (VIP Protected)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="recSortOrder">Curriculum Order #</label>
                    <input id="recSortOrder" type="number" className="form-input" value={recSortOrder} onChange={(e) => setRecSortOrder(e.target.value)} placeholder="e.g. 1, 2, 3..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => {
                  setShowRecordedClassModal(false);
                  setEditingRecordedClass(null);
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} /> {editingRecordedClass ? 'Update Lesson' : 'Upload Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 7: BROADCAST ANNOUNCEMENT ───────────────────────────────── */}
      {showAnnModal && (
        <CustomModal isOpen={showAnnModal} onClose={() => setShowAnnModal(false)} title="Broadcast Announcement">
          <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Announcement Title *</label>
              <input type="text" className="form-input" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="e.g. Schedule Update for Tomorrow's Session" required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Target Cohort *</label>
                <select className="form-select" value={annBatchId} onChange={e => setAnnBatchId(e.target.value)} required>
                  <option value="">-- Choose Batch --</option>
                  <option value="all">All Batches</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Priority Tag</label>
                <select className="form-select" value={annPriority} onChange={e => setAnnPriority(e.target.value)}>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Announcement Message *</label>
              <textarea rows={4} className="form-input" value={annMessage} onChange={e => setAnnMessage(e.target.value)} placeholder="Write announcement details..." required />
            </div>

            <div>
              <label className="form-label">Attach File (Optional PDF, Document or Slide)</label>
              <input type="file" className="form-input" onChange={e => setAnnFile(e.target.files[0])} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAnnModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={savingAnn}>
                <Megaphone size={14} /> {savingAnn ? 'Broadcasting...' : 'Broadcast Announcement'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ─── FULL COURSE ACADEMIA VIEWER PLAYER MODAL ────────────────────── */}
      {previewRecordedClass && (() => {
        const targetId = String(selectedPlaylistBatch?.id || previewRecordedClass.playlist_id || previewRecordedClass.batch_id || 'preview_playlist');
        const isCustom = selectedPlaylistBatch?.isCustom;
        const currentLessons = (selectedPlaylistBatch)
          ? (recordedClasses || []).filter(r => isCustom ? (String(r.playlist_id) === targetId || String(r.batch_id) === targetId) : (String(r.batch_id || r.batchId) === targetId || String(r.playlist_id) === targetId))
          : (recordedClasses || []).filter(r => String(r.playlist_id || r.batch_id) === targetId);

        const playerPlaylist = {
          id: targetId,
          name: selectedPlaylistBatch?.name || previewRecordedClass.course_title || 'Course Recordings',
          title: selectedPlaylistBatch?.name || previewRecordedClass.title,
          course_name: previewRecordedClass.course_title || selectedPlaylistBatch?.course_name,
          description: selectedPlaylistBatch?.description || previewRecordedClass.description || '',
          lessons: currentLessons.length > 0 ? currentLessons : [previewRecordedClass],
          study_materials: selectedPlaylistBatch?.study_materials || previewRecordedClass?.study_materials || []
        };
        return (
          <AcademiaCourseViewer
            playlist={playerPlaylist}
            onClose={() => setPreviewRecordedClass(null)}
            initialLessonId={previewRecordedClass.id}
          />
        );
      })()}
    </div>
  );
};

export default TrainerDashboard;
