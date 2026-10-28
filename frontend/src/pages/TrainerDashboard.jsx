import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  GraduationCap, Users, Video, Clock, BookOpen, 
  Megaphone, Settings, Plus, LogOut, CheckCircle, Award, 
  Percent, CalendarCheck, Pencil, Eye, Search, Filter, 
  PlayCircle, Clock3, Trophy, Key, ChevronDown, X, Download, 
  FileText, FileSpreadsheet, User, Mail, Phone, Lock, EyeOff, 
  Camera, Save, Shield, Menu, Calendar as CalendarIcon, Check, CheckSquare,
  AlertCircle, ChevronLeft, ChevronRight, ExternalLink, Trash2, UploadCloud, Play, MessageSquare
} from 'lucide-react';
import CustomModal from '../components/Modal';
import NotificationBell from '../components/NotificationBell';
import leveloxIcon from '../assets/levelox-icon-transparent.png';
import { useAuth } from '../context/AuthContext';
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
  classifyFirestoreError 
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
import { getGoogleDriveFileId, getResolvedThumbnail } from '../utils/videoUtils';

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

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentUser, userProfile, logout, refreshProfile, applyProfilePatch } = useAuth();

  // Responsive sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active tab from URL path (e.g. /trainer/batches -> batches)
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
      navigate(`/trainer/${tabKey}`);
    }
  };

  const mustChangePassword = userProfile?.mustChangePassword === true;

  // Toast notification state
  const [toast, setToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
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

  const { data: students = [], isLoading: studentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['trainerStudents', assignedBatchIds],
    queryFn: () => getTrainerStudents(assignedBatchIds),
    enabled: assignedBatchIds.length > 0,
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: liveClasses = [], isLoading: liveLoading, refetch: refetchLive } = useQuery({
    queryKey: ['trainerLiveClasses', trainerUid, assignedBatchIds],
    queryFn: () => getTrainerLiveClasses(trainerUid, assignedBatchIds),
    enabled: !!trainerUid,
    staleTime: 1000 * 30,
    refetchInterval: 60000, // auto-refresh live classes every 1 min
    refetchOnWindowFocus: true,
  });

  const { data: recordedClasses = [], isLoading: recordedLoading, refetch: refetchRecorded } = useQuery({
    queryKey: ['trainerRecordedClasses', assignedBatchIds, assignedCourseIds],
    queryFn: () => getTrainerRecordedClasses(assignedBatchIds, assignedCourseIds),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const { data: announcements = [], isLoading: announcementsLoading, refetch: refetchAnnouncements } = useQuery({
    queryKey: ['trainerAnnouncements', assignedBatchIds],
    queryFn: () => getTrainerAnnouncements(assignedBatchIds),
    staleTime: 1000 * 30,
    refetchInterval: 60000, // auto-refresh announcements every 1 min
    refetchOnWindowFocus: true,
  });

  const { data: attendanceSheets = [], isLoading: sheetsLoading, refetch: refetchSheets } = useQuery({
    queryKey: ['trainerAttendanceSheets', assignedBatchIds],
    queryFn: () => getTrainerAttendanceSheets(assignedBatchIds),
    enabled: assignedBatchIds.length > 0,
    staleTime: 1000 * 30,
    refetchInterval: 60000, // auto-refresh attendance every 1 min
    refetchOnWindowFocus: true,
  });

  // Automatically refresh trainer data whenever user navigates between tabs/pages
  useEffect(() => {
    refetchBatches();
    refetchStudents();
    refetchLive();
    refetchRecorded();
    refetchAnnouncements();
    refetchSheets();
    queryClient.invalidateQueries({ queryKey: ['trainerAssignmentsData'] });
    queryClient.invalidateQueries({ queryKey: ['trainerSubmissionsData'] });
  }, [activeTab, queryClient]);

  // Derived Statistics for Dashboard Cards
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayClassesCount = liveClasses.filter(c => c.date === todayStr).length;
    const upcomingClassesCount = liveClasses.filter(c => (c.date || '') >= todayStr && (c.status || '').toLowerCase() !== 'completed').length;
    
    // Total Activity Points awarded across assigned students
    const totalPoints = students.reduce((acc, s) => acc + (Number(s.activityPoints) || 0), 0);

    // Pending attendance sheets count for today
    const markedTodayBatchIds = new Set(attendanceSheets.filter(s => s.date === todayStr).map(s => s.batchId || s.batch_id));
    const attendancePendingCount = Math.max(0, batches.length - markedTodayBatchIds.size);

    return {
      totalBatches: batches.length,
      totalStudents: students.length,
      todayClassesCount,
      upcomingClassesCount,
      attendancePendingCount,
      totalPoints,
    };
  }, [batches, students, liveClasses, attendanceSheets]);

  // Student Search Query State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // ─── 2. ATTENDANCE MODULE STATES ──────────────────────────────────────────
  const [attCourseFilter, setAttCourseFilter] = useState('');
  const [attBatchId, setAttBatchId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStudentRecords, setAttStudentRecords] = useState({});
  const [attRecordDetails, setAttRecordDetails] = useState({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Selected batch for attendance sheet
  const selectedAttBatch = useMemo(() => batches.find(b => b.id === attBatchId), [batches, attBatchId]);

  // Students belonging to selected attendance batch
  const attBatchStudents = useMemo(() => {
    if (!attBatchId) return [];
    const bCode = selectedAttBatch?.code || selectedAttBatch?.batchId;
    const bName = selectedAttBatch?.name;
    const sIds = Array.isArray(selectedAttBatch?.student_ids) ? selectedAttBatch.student_ids : [];
    return students.filter(s => {
      const sBId = s.batch_id || s.batchId;
      if (sBId && sBId === attBatchId) return true;
      if (bCode && sBId && sBId === bCode) return true;
      if (bName && (s.batch_name === bName || s.batchName === bName)) return true;
      if (sIds.includes(s.id) || sIds.includes(s.uid)) return true;
      return false;
    });
  }, [students, attBatchId, selectedAttBatch]);

  // Load attendance records when batch or date changes
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
      .catch(err => console.error("Error loading attendance:", err))
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

  // Attendance summary metrics
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

    const markedCount = present + absent;
    const rate = markedCount > 0 ? ((present / markedCount) * 100).toFixed(1) : 0;
    return { total, present, absent, notMarked, rate };
  }, [attBatchStudents, attStudentRecords]);

  const handleSaveAttendance = async () => {
    if (!attBatchId || !attDate) {
      alert("Please select a batch and class date.");
      return;
    }
    if (attBatchStudents.length === 0) {
      alert("No students in this batch to mark attendance.");
      return;
    }

    setSavingAttendance(true);
    try {
      const recordsToSave = attBatchStudents.map(s => {
        const detail = attRecordDetails[s.id];
        const status = attStudentRecords[s.id] || 'Absent';
        const isAuto = Boolean(detail?.attendedLive || detail?.attendance_mode === 'Auto') && status === 'Present';
        return {
          studentId: s.id,
          studentName: s.name || 'Student',
          rollNumber: s.rollNumber || s.id,
          course: s.course || selectedAttBatch?.course_name || '',
          status: status,
          attendedLive: isAuto,
          liveClassTitle: detail?.liveClassTitle || '',
          marked_by: isAuto ? (detail?.marked_by || 'Auto-Attendance (Live Class)') : 'Trainer (Manual)',
          attendance_mode: isAuto ? 'Auto' : 'Manual',
          marked_time: isAuto ? detail?.marked_time : new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
      });

      await saveBatchAttendance(attBatchId, attDate, recordsToSave, {
        batchName: selectedAttBatch?.name || '',
        courseName: selectedAttBatch?.course_name || '',
        markedBy: 'Trainer (Manual)',
      });

      // Synchronize student attendance metrics in students collection
      await Promise.all(recordsToSave.map(async (r) => {
        try {
          const allStudentAtt = await getAttendanceForStudent(r.studentId);
          const presentCount = allStudentAtt.filter(rec => (rec.status || '').toLowerCase() === 'present').length;
          const totalDaysCount = allStudentAtt.length;
          const absentCount = totalDaysCount - presentCount;
          const pct = totalDaysCount > 0 ? Math.round((presentCount / totalDaysCount) * 100) : 0;
          await updateStudent(r.studentId, {
            attendance: {
              present: presentCount,
              absent: absentCount,
              total_days: totalDaysCount,
              percentage: pct,
            }
          });
        } catch (syncErr) {
          console.warn('[Trainer] Could not sync student stats:', syncErr);
        }
      }));

      showToast(`Attendance saved for ${selectedAttBatch?.name || 'Batch'} (${attDate}) ✓`);
      refetchSheets();
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['studentAttendance'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingAttendance(false);
    }
  };

  // Calendar date selector & agenda
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(new Date().toISOString().split('T')[0]);

  // ─── 3. BATCH DETAILS MODAL ──────────────────────────────────────────────
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);

  // ─── 4. STUDENT DETAILS MODAL ─────────────────────────────────────────────
  const [selectedStudentDetails, setSelectedStudentDetails] = useState(null);

  // ─── 5. LIVE CLASS MODAL ────────────────────────────────────────────────
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
      alert("Please fill in all required fields.");
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
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSchedulingLive(false);
    }
  };

  const handleDeleteLiveClass = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this live class session?")) return;
    try {
      await deleteDocument('liveClasses', id);
      showToast('Live class deleted successfully ✓');
      refetchLive();
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    }
  };

  // ─── TRAINER UPLOAD RECORDING STATE & HANDLERS ─────────────────────────
  const [trainerUploadClass, setTrainerUploadClass] = useState(null);
  const [trainerRecordingUrl, setTrainerRecordingUrl] = useState('');
  const [trainerRecordingDuration, setTrainerRecordingDuration] = useState('1h 00m');
  const [trainerIsUploadingFile, setTrainerIsUploadingFile] = useState(false);
  const [trainerUploadSaving, setTrainerUploadSaving] = useState(false);
  const [trainerPreviewVideo, setTrainerPreviewVideo] = useState(null);

  const handleOpenTrainerUploadModal = (lc) => {
    setTrainerUploadClass(lc);
    setTrainerRecordingUrl(lc.recording_url || lc.recordingUrl || '');
    setTrainerRecordingDuration(lc.duration || '1h 00m');
  };

  const handleSaveTrainerRecording = async (e) => {
    if (e) e.preventDefault();
    if (!trainerUploadClass) return;
    const targetId = trainerUploadClass.id || trainerUploadClass.uid || trainerUploadClass._id;
    if (!trainerRecordingUrl.trim()) {
      alert('Please enter a valid video link (YouTube, Google Drive, or MP4 URL).');
      return;
    }
    setTrainerUploadSaving(true);
    try {
      await updateDocumentFields('liveClasses', targetId, {
        recording_url: trainerRecordingUrl.trim(),
        recordingUrl: trainerRecordingUrl.trim(),
        duration: trainerRecordingDuration || '1h 00m',
        recording_uploaded_at: new Date().toISOString(),
        status: 'Completed'
      });
      showToast('Recording attached successfully ✓');
      refetchLive();
      setTrainerUploadClass(null);
      setTrainerRecordingUrl('');
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setTrainerUploadSaving(false);
    }
  };

  const handleTrainerVideoFileUpload = async (file) => {
    if (!file) return;
    setTrainerIsUploadingFile(true);
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
        setTrainerRecordingUrl(data.fileUrl);
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Could not upload video file. You can also paste a direct YouTube or Google Drive link.');
    } finally {
      setTrainerIsUploadingFile(false);
    }
  };

  // ─── 6. RECORDED CLASS MODAL ─────────────────────────────────────────────
  const [showRecordedModal, setShowRecordedModal] = useState(false);
  const [trainerRecordedBatchFilter, setTrainerRecordedBatchFilter] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [recTitle, setRecTitle] = useState('');
  const [recCourseName, setRecCourseName] = useState('');
  const [recModule, setRecModule] = useState('Module 1 - Fundamentals');
  const [recBatchId, setRecBatchId] = useState('');
  const [recVideoUrl, setRecVideoUrl] = useState('');
  const [recThumbnailUrl, setRecThumbnailUrl] = useState('');
  const [recDuration, setRecDuration] = useState('1h 30m');
  const [recDescription, setRecDescription] = useState('');
  const [savingRecorded, setSavingRecorded] = useState(false);

  const filteredRecordedClasses = useMemo(() => {
    return recordedClasses.filter(rc => {
      if (!trainerRecordedBatchFilter) return true;
      const bId = String(rc.batch_id || rc.batchId || '').trim();
      return bId === String(trainerRecordedBatchFilter).trim();
    });
  }, [recordedClasses, trainerRecordedBatchFilter]);

  const handleAddRecordedClass = async (e) => {
    e.preventDefault();
    if (!recTitle || !recVideoUrl) {
      alert("Title and Video URL are required.");
      return;
    }
    setSavingRecorded(true);
    try {
      const isCommon = recBatchId === 'common' || !recBatchId;
      const batchObj = batches.find(b => b.id === recBatchId);
      const isDrive = Boolean(getGoogleDriveFileId(recVideoUrl));
      const finalThumb = recThumbnailUrl || getResolvedThumbnail(recVideoUrl, recThumbnailUrl);
      const finalBatchId = isCommon ? 'common' : recBatchId;
      const finalBatchName = isCommon ? 'Common Playlist (All Students)' : (batchObj?.name || 'General Batch');
      const finalCourseName = recCourseName || (isCommon ? 'Levlox Common Curriculum' : (batchObj?.course_name || 'Course Training'));

      await createTrainerRecordedClass({
        title: recTitle,
        module: recModule || 'General Class',
        course_title: finalCourseName,
        course_name: finalCourseName,
        batch_id: finalBatchId,
        batchId: finalBatchId,
        batch_name: finalBatchName,
        batchName: finalBatchName,
        video_url: recVideoUrl,
        thumbnail: finalThumb,
        duration: recDuration || '1h 30m',
        description: recDescription,
        video_source_type: isDrive ? 'drive' : 'link',
        visibility: 'everyone',
        uploadedBy: userProfile?.fullName || 'Trainer',
        created_at: new Date().toISOString()
      });
      showToast('Recorded Lesson added successfully ✓');
      await refetchRecorded();
      queryClient.invalidateQueries({ queryKey: ['trainerRecordedClasses'] });
      queryClient.invalidateQueries({ queryKey: ['recordedClasses'] });
      setShowRecordedModal(false);
      setRecTitle('');
      setRecVideoUrl('');
      setRecThumbnailUrl('');
      setRecDescription('');
      setRecDuration('1h 30m');
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingRecorded(false);
    }
  };

  const handleDeleteRecordedClass = async (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to permanently delete this recorded lesson?")) return;
    try {
      await deleteDocument('recordedClasses', id);
      showToast('Recorded lesson deleted successfully ✓');
      await refetchRecorded();
      queryClient.invalidateQueries({ queryKey: ['trainerRecordedClasses'] });
      queryClient.invalidateQueries({ queryKey: ['recordedClasses'] });
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    }
  };

  // ─── 7. ANNOUNCEMENT MODAL ───────────────────────────────────────────────
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
      alert("Title, Message, and Batch are required.");
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
      showToast('Announcement & notifications broadcasted successfully ✓');
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

  // ─── 8. ACTIVITY SCORES MODAL ───────────────────────────────────────────
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [actStudentId, setActStudentId] = useState('');
  const [actPoints, setActPoints] = useState(10);
  const [actType, setActType] = useState('Participation');
  const [actRemarks, setActRemarks] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);

  const handleAwardPoints = async (e) => {
    e.preventDefault();
    if (!actStudentId || !actPoints) {
      alert("Student and Points are required.");
      return;
    }
    setSavingActivity(true);
    try {
      const targetStudent = students.find(s => s.id === actStudentId);
      await awardActivityScore({
        studentId: actStudentId,
        studentName: targetStudent?.name || 'Student',
        batchId: targetStudent?.batch_id || targetStudent?.batchId || '',
        batchName: targetStudent?.batch_name || targetStudent?.batchName || '',
        date: new Date().toISOString().split('T')[0],
        meeting: 'Trainer Portal Session',
        activityType: actType,
        points: Number(actPoints),
        remarks: actRemarks,
        awardedBy: userProfile?.fullName || 'Trainer'
      });
      showToast(`Awarded +${actPoints} points to ${targetStudent?.name || 'Student'} ✓`);
      refetchStudents();
      setShowActivityModal(false);
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingActivity(false);
    }
  };

  // ─── 9. PROFILE EDIT MODAL & AVATAR UPLOAD ──────────────────────────────
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingPhone, setEditingPhone] = useState(userProfile?.phone || '');
  const [editingName, setEditingName] = useState(userProfile?.fullName || userProfile?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setEditingName(userProfile.fullName || userProfile.name || '');
      setEditingPhone(userProfile.phone || '');
    }
  }, [userProfile]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const photoUrl = await uploadTrainerProfilePic(trainerUid, file);
      applyProfilePatch({ profilePic: photoUrl, profile_pic: photoUrl });
      showToast('Profile photo updated ✓');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateDocumentFields('trainers', trainerUid, {
        fullName: editingName,
        name: editingName,
        phone: editingPhone
      });
      applyProfilePatch({ fullName: editingName, name: editingName, phone: editingPhone });
      showToast('Profile details updated ✓');
    } catch (err) {
      console.error(err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ─── 10. SETTINGS / PASSWORD CHANGE ─────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passError, setPassError] = useState('');

  const passValidation = useMemo(() => validatePasswordStrength(newPassword), [newPassword]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    if (!currentPassword) {
      setPassError('Current password is required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }
    if (!passValidation.isValid) {
      setPassError(passValidation.message);
      return;
    }

    setChangingPass(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      // Set mustChangePassword = false in Firestore
      await updateDocumentFields('trainers', trainerUid, { mustChangePassword: false });
      applyProfilePatch({ mustChangePassword: false });
      showToast('Password updated successfully! Portal access unlocked ✓');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      handleTabChange('dashboard');
    } catch (err) {
      console.error(err);
      setPassError(err.message || 'Failed to update password. Check your current password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, background: '#121118', color: '#fff',
          borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 600, zIndex: 2000,
          boxShadow: '0 16px 32px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 8
        }}>
          <CheckCircle size={16} color="#10B981" /> {toast}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Levlox Nova Signature Brand Card */}
        <div className="srms-sidebar-brand" style={{
          margin: sidebarCollapsed ? '10px 4px 16px' : '10px 14px 16px',
          padding: sidebarCollapsed ? '12px 6px' : '16px 14px',
          position: 'relative'
        }}>
          <div className="srms-sidebar-brand-icon">
            <GraduationCap size={sidebarCollapsed ? 20 : 26} color="#FFFFFF" strokeWidth={2.2} />
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

        <div className="sidebar-section-label">Main Navigation</div>

        <ul className="sidebar-menu">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: GraduationCap },
            { key: 'batches', label: 'My Batches', icon: BookOpen },
            { key: 'students', label: 'My Students', icon: Users },
            { key: 'attendance', label: 'Attendance', icon: CalendarCheck },
            { key: 'live-classes', label: 'Live Classes', icon: Video },
            { key: 'recorded-classes', label: 'Recorded Classes', icon: PlayCircle },
            { key: 'announcements', label: 'Announcements', icon: Megaphone },
            { key: 'assignments', label: 'Assignments', icon: FileText },
            { key: 'chat', label: 'Batch Chat', icon: MessageSquare },
            { key: 'activity-scores', label: 'Activity Scores', icon: Trophy },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <li key={item.key}>
                <button 
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleTabChange(item.key)}
                  disabled={mustChangePassword && item.key !== 'settings'}
                >
                  <Icon size={18} />
                  <span className="sidebar-link-text">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-section-label">Account & Preferences</div>
        <ul className="sidebar-menu">
          <li>
            <button 
              className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => handleTabChange('profile')}
              disabled={mustChangePassword}
            >
              <User size={18} />
              <span className="sidebar-link-text">Profile</span>
            </button>
          </li>
          <li>
            <button 
              className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              <Settings size={18} />
              <span className="sidebar-link-text">Settings</span>
            </button>
          </li>
        </ul>

        <div className="sidebar-footer">
          <button className="sidebar-link" onClick={logout} style={{ color: '#EF4444' }}>
            <LogOut size={18} color="#EF4444" />
            <span className="sidebar-link-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Sticky Topbar */}
        <header className="top-navbar">
          <div className="top-navbar-left">
            <button className="sidebar-toggle-btn mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Levlox Trainer Portal</h1>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                Teaching Management & Student Engagement
              </p>
            </div>
          </div>

          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotificationBell userId={currentUser?.uid} userRole="trainer" />
            <div className="navbar-date-chip">
              <CalendarIcon size={14} />
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 12, borderLeft: '1.5px solid var(--border-color)' }}>
              <img 
                src={userProfile?.profilePic || userProfile?.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                alt="Trainer Profile" 
                style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#121118' }}>
                  {userProfile?.fullName || userProfile?.name || 'Trainer'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--primary-color)', fontWeight: 700 }}>
                  ID: {userProfile?.trainerId || userProfile?.code || 'TRN001001'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* FORCED PASSWORD CHANGE BANNER */}
        {mustChangePassword && activeTab !== 'settings' && (
          <div style={{ background: '#FFFBEB', border: '1.5px solid #FCD34D', borderRadius: 16, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <AlertCircle size={22} color="#D97706" />
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#92400E' }}>Temporary Password Change Required</h4>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#B45309' }}>
                  For security reasons, you must set a new password before navigating the Trainer Portal.
                </p>
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => handleTabChange('settings')}>
              Go to Settings
            </button>
          </div>
        )}

        {/* ─── MODULE 1: DASHBOARD OVERVIEW ─────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 28 }}>
              {[
                { title: 'My Batches', count: stats.totalBatches, icon: LayersIcon, color: '#6C3CF0', bg: 'rgba(108,60,240,0.08)' },
                { title: 'My Students', count: stats.totalStudents, icon: Users, color: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
                { title: "Today's Classes", count: stats.todayClassesCount, icon: Video, color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
                { title: 'Attendance Pending', count: stats.attendancePendingCount, icon: CalendarCheck, color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
                { title: 'Upcoming Classes', count: stats.upcomingClassesCount, icon: Clock, color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)' },
                { title: 'Total Activity Points', count: stats.totalPoints, icon: Trophy, color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>{card.title}</span>
                      <h2 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 0', color: '#121118' }}>{card.count}</h2>
                    </div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={card.color} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions & Assigned Batches Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Assigned Batches Summary</h3>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleTabChange('batches')}>View All</button>
                </div>
                {batches.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>No batches assigned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {batches.slice(0, 4).map(b => (
                      <div key={b.id} style={{ padding: 14, background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#121118' }}>{b.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Course: {b.course_name || 'N/A'} • {b.students_count || 0} Students</div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6 }}>
                          {b.status || 'Active'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 16px' }}>Quick Teaching Tools</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button className="btn btn-outline" style={{ height: 50, flexDirection: 'column', gap: 2, fontSize: 12 }} onClick={() => handleTabChange('attendance')}>
                    <CalendarCheck size={18} color="var(--primary-color)" /> Take Attendance
                  </button>
                  <button className="btn btn-outline" style={{ height: 50, flexDirection: 'column', gap: 2, fontSize: 12 }} onClick={() => setShowLiveModal(true)}>
                    <Video size={18} color="#10B981" /> Schedule Class
                  </button>
                  <button className="btn btn-outline" style={{ height: 50, flexDirection: 'column', gap: 2, fontSize: 12 }} onClick={() => setShowAnnModal(true)}>
                    <Megaphone size={18} color="#F59E0B" /> Announcement
                  </button>
                  <button className="btn btn-outline" style={{ height: 50, flexDirection: 'column', gap: 2, fontSize: 12 }} onClick={() => setShowActivityModal(true)}>
                    <Trophy size={18} color="#EC4899" /> Award Points
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODULE 2: MY BATCHES ─────────────────────────────────────────── */}
        {activeTab === 'batches' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>My Assigned Batches</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {batches.map(b => (
                <div key={b.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(108,60,240,0.1)', color: 'var(--primary-color)', padding: '4px 10px', borderRadius: 6 }}>
                      {b.code || b.batchId || b.id}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6 }}>
                      {b.status || 'Active'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 4px', color: '#121118' }}>{b.name}</h3>
                  <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
                    Course: <strong>{b.course_name || 'N/A'}</strong>
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 12, marginBottom: 16 }}>
                    <span>Students: <strong>{b.students_count || 0}</strong></span>
                    <span>Schedule: <strong>{b.schedule || 'Regular'}</strong></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setSelectedBatchDetails(b)}>
                      <Eye size={14} /> Batch Details
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => { setAttBatchId(b.id); handleTabChange('attendance'); }}>
                      <CalendarCheck size={14} /> Attendance
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MODULE 3: MY STUDENTS ────────────────────────────────────────── */}
        {activeTab === 'students' && (() => {
          const filteredTrainerStudents = students.filter(s => {
            if (!studentSearchQuery.trim()) return true;
            const q = studentSearchQuery.toLowerCase();
            return (
              (s.name || '').toLowerCase().includes(q) ||
              (s.email || '').toLowerCase().includes(q) ||
              (s.rollNumber || s.id || '').toLowerCase().includes(q)
            );
          });

          return (
            <div className="animate-fade-in">
              <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }} className="search-bar-container">
                    <Search size={16} color="var(--text-secondary)" />
                    <input
                      type="text"
                      placeholder="Search student by name or email..."
                      className="search-bar-input"
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
                  <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Student Name</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Student ID</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Course</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Batch</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Activity Points</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrainerStudents.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <img src={s.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                            <div>
                              <div>{s.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>{s.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700 }}>{s.rollNumber || s.id}</td>
                        <td style={{ padding: '14px 20px' }}>{s.course || 'Fullstack'}</td>
                        <td style={{ padding: '14px 20px' }}>{s.batch_name || s.batchName || 'Assigned'}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--primary-color)' }}>{s.activityPoints || 0} pts</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', background: 'rgba(16,185,129,0.1)', color: '#10B981', borderRadius: 6 }}>
                            {s.status || 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {s.email && (
                              <a
                                href={`mailto:${s.email}`}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 8px', textDecoration: 'none', color: 'var(--primary-color)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Send Mail"
                              >
                                <Mail size={14} />
                              </a>
                            )}
                            <button className="btn btn-outline btn-sm" onClick={() => setSelectedStudentDetails(s)}>
                              <Eye size={14} /> Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ─── MODULE 4: ATTENDANCE SHEET & CALENDAR ─────────────────────────── */}
        {activeTab === 'attendance' && (
          <div className="animate-fade-in">
            {/* Top Selectors */}
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 20, marginBottom: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
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
                  <label className="form-label">Class Date *</label>
                  <input type="date" className="form-input" value={attDate} onChange={e => setAttDate(e.target.value)} />
                </div>
              </div>
            </div>

            {attBatchId && (
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 24, marginBottom: 32 }}>
                {/* Left Attendance Sheet */}
                <div>
                  {/* Summary Bar */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 20 }}>
                      <div><span style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 800 }}>Total</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{attSummary.total}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#10B981', textTransform: 'uppercase', fontWeight: 800 }}>Present</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#10B981' }}>{attSummary.present}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#EF4444', textTransform: 'uppercase', fontWeight: 800 }}>Absent</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{attSummary.absent}</h3></div>
                      <div><span style={{ fontSize: 11, color: '#F59E0B', textTransform: 'uppercase', fontWeight: 800 }}>Not Marked</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{attSummary.notMarked}</h3></div>
                      <div><span style={{ fontSize: 11, color: 'var(--primary-color)', textTransform: 'uppercase', fontWeight: 800 }}>Attendance Rate</span><h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--primary-color)' }}>{attSummary.rate}%</h3></div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => handleSelectAll('Present')}>All Present</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleSelectAll('Absent')}>All Absent</button>
                      <button className="btn btn-ghost btn-sm" onClick={handleResetAttendance}>Reset</button>
                      <button className="btn btn-primary btn-sm" onClick={handleSaveAttendance} disabled={savingAttendance}>
                        <Save size={14} /> {savingAttendance ? 'Saving...' : 'Save Attendance'}
                      </button>
                    </div>
                  </div>

                  {/* Attendance Table */}
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                      <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                        <tr>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Student ID</th>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Student Name</th>
                          <th style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--text-secondary)' }}>Attendance Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attBatchStudents.map(s => {
                          const status = attStudentRecords[s.id] || 'Not Marked';
                          const detail = attRecordDetails[s.id];
                          const isAutoAttended = Boolean(detail?.attendedLive || detail?.attendance_mode === 'Auto') && status === 'Present';
                          return (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700 }}>{s.rollNumber || s.id}</td>
                              <td style={{ padding: '14px 20px', fontWeight: 700 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <span>{s.name}</span>
                                  {isAutoAttended ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 750, color: '#065F46', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      ⚡ Auto (Live Class)
                                    </span>
                                  ) : status === 'Present' ? (
                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 12, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      ✍️ Manual
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button 
                                    className={`btn btn-sm ${status === 'Present' ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ background: status === 'Present' ? '#10B981' : '', borderColor: status === 'Present' ? '#10B981' : '' }}
                                    onClick={() => handleMarkStudent(s.id, 'Present')}
                                  >
                                    Present
                                  </button>
                                  <button 
                                    className={`btn btn-sm ${status === 'Absent' ? 'btn-danger' : 'btn-outline'}`}
                                    onClick={() => handleMarkStudent(s.id, 'Absent')}
                                  >
                                    Absent
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Interactive Attendance Calendar & Agenda */}
                <div>
                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-card)', marginBottom: 20 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 12px' }}>Class Calendar</h3>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={selectedCalendarDate} 
                      onChange={e => { setSelectedCalendarDate(e.target.value); setAttDate(e.target.value); }} 
                    />
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }}></span> Green = Attendance Completed</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }}></span> Orange = Pending Sheet</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9499AB' }}></span> Gray = No Schedule</div>
                    </div>
                  </div>

                  <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, padding: 20, boxShadow: 'var(--shadow-card)' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 10px', color: 'var(--primary-color)' }}>AGENDA: {selectedCalendarDate}</h4>
                    {liveClasses.filter(c => c.date === selectedCalendarDate).length === 0 ? (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>No live class scheduled for this date.</p>
                    ) : (
                      liveClasses.filter(c => c.date === selectedCalendarDate).map(lc => (
                        <div key={lc.id} style={{ padding: 10, background: 'var(--surface-alt)', borderRadius: 10, fontSize: 12, marginBottom: 8 }}>
                          <div style={{ fontWeight: 800, color: '#121118' }}>{lc.title || lc.lectureName}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>Batch: {lc.batchName || lc.batchId}</div>
                          <div style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Time: {lc.time}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Attendance History Section */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Attendance History Log</h3>
              <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                    <tr>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Date</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Batch</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Course</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Present</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Absent</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Attendance Rate</th>
                      <th style={{ padding: '12px 18px', fontWeight: 800 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceSheets.map(sh => (
                      <tr key={sh.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 18px', fontWeight: 700 }}>{sh.date}</td>
                        <td style={{ padding: '12px 18px' }}>{sh.batchName || sh.batch_name || sh.batchId}</td>
                        <td style={{ padding: '12px 18px' }}>{sh.courseName || sh.course_name || 'Course'}</td>
                        <td style={{ padding: '12px 18px', color: '#10B981', fontWeight: 800 }}>{sh.presentCount || sh.present_count || 0}</td>
                        <td style={{ padding: '12px 18px', color: '#EF4444', fontWeight: 800 }}>{sh.absentCount || sh.absent_count || 0}</td>
                        <td style={{ padding: '12px 18px', fontWeight: 800, color: 'var(--primary-color)' }}>
                          {sh.attendancePercentage || sh.attendance_percentage || 0}%
                        </td>
                        <td style={{ padding: '12px 18px' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => { setAttBatchId(sh.batchId || sh.batch_id); setAttDate(sh.date); }}>
                            Edit Attendance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODULE 5: LIVE CLASSES ────────────────────────────────────────── */}
        {activeTab === 'live-classes' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Assigned Live Classes</h2>
              <button className="btn btn-primary" onClick={() => setShowLiveModal(true)}>
                <Plus size={16} /> Schedule Live Class
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {liveClasses.map(lc => (
                <div key={lc.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '4px 10px', borderRadius: 6 }}>
                      {lc.status || 'Upcoming'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>{lc.date}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px', color: '#121118' }}>{lc.title || lc.lectureName}</h3>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 14 }}>
                    Batch: <strong>{lc.batchName || lc.batchId}</strong> • Time: <strong>{lc.time}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    {(lc.status || '').toLowerCase() === 'completed' ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#2563EB', borderColor: '#2563EB' }}
                          onClick={() => handleOpenTrainerUploadModal(lc)}
                        >
                          <UploadCloud size={14} /> {lc.recording_url || lc.recordingUrl ? 'Update Recording' : 'Upload Recording'}
                        </button>
                        {Boolean(lc.recording_url || lc.recordingUrl) && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0 10px', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => setTrainerPreviewVideo({
                              id: lc.id || lc.uid,
                              title: lc.title || lc.lectureName,
                              video_url: lc.recording_url || lc.recordingUrl
                            })}
                            title="Preview Recording"
                          >
                            <Play size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <a href={lc.meetLink || lc.meet_url || lc.meet_link} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm" style={{ flex: 1, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <ExternalLink size={14} /> Join Meeting
                        </a>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '0 10px', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => handleOpenTrainerUploadModal(lc)}
                          title="Attach Recording"
                        >
                          <UploadCloud size={14} />
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0 12px', height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleDeleteLiveClass(lc.id || lc.uid)}
                      title="Delete Live Class"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MODULE 6: RECORDED CLASSES ───────────────────────────────────── */}
        {activeTab === 'recorded-classes' && (
          <div className="animate-fade-in" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            background: 'linear-gradient(135deg, rgba(240, 249, 255, 0.65) 0%, rgba(245, 243, 255, 0.75) 45%, rgba(254, 243, 199, 0.35) 80%, rgba(236, 253, 245, 0.65) 100%)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.9)',
            borderRadius: 28,
            padding: '28px 30px',
            boxShadow: '0 20px 45px -10px rgba(99, 102, 241, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255, 255, 255, 0.95)', marginBottom: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366F1' }} />
                  <span style={{ fontSize: 11, fontWeight: 750, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trainer Studio</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.3px' }}>Course Recording Modules</h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0, fontWeight: 500 }}>
                  Upload and manage Google Drive recordings organized by batch with in-portal DRM protection.
                </p>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const targetBId = trainerRecordedBatchFilter || (batches[0]?.id || '');
                  setRecBatchId(targetBId);
                  const bObj = batches.find(b => b.id === targetBId);
                  if (bObj && bObj.course_name) setRecCourseName(bObj.course_name);
                  setShowRecordedModal(true);
                }}
                style={{
                  borderRadius: 999,
                  padding: '9px 20px',
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
                <Plus size={16} /> Add Lesson to Batch
              </button>
            </div>

            {/* Batch Filter Toolbar with frosted glass */}
            <div style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              padding: '12px 18px',
              borderRadius: 18,
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={16} style={{ color: '#4F46E5' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Filter Batch:</span>
              </div>
              <select 
                className="form-select" 
                value={trainerRecordedBatchFilter} 
                onChange={(e) => setTrainerRecordedBatchFilter(e.target.value)}
                style={{
                  minWidth: 240,
                  height: 38,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 12,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                }}
              >
                <option value="">All Batches ({recordedClasses.length} recordings)</option>
                {batches.map(b => {
                  const bId = String(b.id || b.uid);
                  const count = recordedClasses.filter(r => String(r.batch_id || r.batchId) === bId).length;
                  return (
                    <option key={bId} value={bId}>
                      {b.name} ({b.course_name || 'Course'}) — {count} lessons
                    </option>
                  );
                })}
              </select>
              {trainerRecordedBatchFilter && (
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm" 
                  onClick={() => setTrainerRecordedBatchFilter('')}
                  style={{ height: 36, fontSize: 12, borderRadius: 999 }}
                >
                  Clear Filter
                </button>
              )}
              <div style={{ marginLeft: 'auto', fontSize: 12.5, color: '#64748B' }}>
                Showing <strong>{filteredRecordedClasses.length}</strong> of {recordedClasses.length} lessons
              </div>
            </div>

            {filteredRecordedClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: 20, border: '1px solid rgba(255, 255, 255, 0.95)' }}>
                <Video size={48} style={{ color: '#94A3B8', marginBottom: 12, opacity: 0.6 }} />
                <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 750, color: '#0F172A' }}>No Recorded Lessons For This Batch</h4>
                <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Click "Add Lesson to Batch" above to upload a Google Drive video.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 22 }}>
                {filteredRecordedClasses.map((rc, idx) => {
                  const thumb = rc.thumbnail || getResolvedThumbnail(rc.video_url || rc.embedUrl, '');
                  const isDrive = Boolean(getGoogleDriveFileId(rc.video_url || rc.embedUrl));
                  const rcId = rc.id || rc.uid || rc._id;
                  const bName = rc.batchName || rc.batch_name || batches.find(b => String(b.id) === String(rc.batch_id || rc.batchId))?.name || 'All Batches';
                  const theme = PLAYLIST_CARD_THEMES[idx % PLAYLIST_CARD_THEMES.length];

                  return (
                    <div 
                      key={rcId} 
                      style={{ 
                        background: theme.bg, 
                        border: `1.5px solid ${theme.border}`, 
                        borderRadius: 24, 
                        overflow: 'hidden',
                        boxShadow: theme.shadow,
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                        position: 'relative',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                      }}
                      className="clickable-card-hover"
                    >
                      {/* Video Thumbnail Header with Inset */}
                      <div style={{ padding: '12px 12px 0 12px' }}>
                        <div style={{
                          position: 'relative',
                          width: '100%',
                          height: 155,
                          borderRadius: 18,
                          overflow: 'hidden',
                          background: '#0F172A',
                          boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
                        }}>
                          <img 
                            src={thumb} 
                            alt={rc.title} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div 
                            onClick={() => setPreviewVideo(rc)}
                            style={{ 
                              position: 'absolute', 
                              inset: 0, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              background: 'rgba(15, 23, 42, 0.28)',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                          >
                            <div style={{
                              width: 46,
                              height: 46,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                              color: '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.5)',
                            }}>
                              <PlayCircle size={24} />
                            </div>
                          </div>

                          {/* Top Badges */}
                          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                            {isDrive && (
                              <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(16, 185, 129, 0.95)', color: '#FFF', padding: '3px 8px', borderRadius: 999, backdropFilter: 'blur(4px)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                                Drive Protected
                              </span>
                            )}
                            <span style={{ fontSize: 10.5, fontWeight: 700, background: 'rgba(15, 23, 42, 0.85)', color: '#FFF', padding: '3px 8px', borderRadius: 999, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
                              {rc.duration || '1h 30m'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Content with Pastel Theme */}
                      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 11, fontWeight: 750, color: theme.tagColor, background: theme.tagBg, padding: '3px 9px', borderRadius: 6 }}>
                              {bName}
                            </span>
                            <span style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>• {rc.module || 'Class Lesson'}</span>
                          </div>
                          <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px', color: '#0F172A', lineHeight: 1.3 }}>
                            {rc.title}
                          </h3>
                          <p style={{
                            fontSize: 12.5,
                            color: '#475569',
                            margin: 0,
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {rc.description || 'Lesson recording video.'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.8)', paddingTop: 12, marginTop: 4 }}>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm" 
                            style={{
                              flex: 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              height: 36,
                              fontSize: 12.5,
                              borderRadius: 999,
                              fontWeight: 750,
                              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                              border: 'none',
                              boxShadow: '0 3px 10px rgba(99, 102, 241, 0.25)',
                            }}
                            onClick={() => setPreviewVideo(rc)}
                          >
                            <PlayCircle size={15} /> Watch in Portal
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-outline btn-sm" 
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#DC2626',
                              background: 'rgba(254, 226, 226, 0.8)',
                              border: '1px solid #FECACA',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleDeleteRecordedClass(rcId)}
                            title="Delete Recording"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── MODULE 7: ANNOUNCEMENTS ──────────────────────────────────────── */}
        {activeTab === 'announcements' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Batch Announcements</h2>
              <button className="btn btn-primary" onClick={() => setShowAnnModal(true)}>
                <Plus size={16} /> Post Announcement
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {announcements.map(an => (
                <div key={an.id} style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 18, padding: 20, boxShadow: 'var(--shadow-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '4px 10px', borderRadius: 6 }}>
                      Batch: {an.batchName || an.batch_name || an.batchId || 'All Batches'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{an.date}</span>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 6px' }}>{an.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{an.message || an.content}</p>

                  {an.attachmentUrl && (
                    <div style={{ marginTop: 12 }}>
                      <a
                        href={getDownloadUrl(an.attachmentUrl, an.attachmentName || 'Circular.pdf')}
                        download={an.attachmentName || 'Circular.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#2563EB',
                          background: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          padding: '6px 12px',
                          borderRadius: 8,
                          textDecoration: 'none'
                        }}
                      >
                        <Download size={13} />
                        Download Attached Circular ({an.attachmentName || 'PDF Document'})
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── MODULE: ASSIGNMENTS & SUBMISSION EVALUATION ──────────────────── */}
        {activeTab === 'assignments' && (
          <div className="animate-fade-in">
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Course Assignments & Submissions</h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                Assign capstone tasks with downloadable project briefs, review student ZIP/PDF uploads, and evaluate solutions.
              </p>
            </div>
            <TrainerAssignmentsView
              batches={batches}
              students={students}
              trainerUid={trainerUid}
              trainerName={userProfile?.fullName || userProfile?.name || 'Dr. Sarah Jenkins'}
              showToast={showToast}
            />
          </div>
        )}

        {/* ─── BATCH CHAT MODULE ────────────────────────────────────────────── */}
        {activeTab === 'chat' && (
          <div className="animate-fade-in" style={{ width: '100%' }}>
            <BatchChatPage
              user={userProfile}
              userProfile={userProfile}
              batches={batches}
            />
          </div>
        )}

        {/* ─── MODULE 8: ACTIVITY SCORES ────────────────────────────────────── */}
        {activeTab === 'activity-scores' && (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Award Student Activity Points</h2>
              <button className="btn btn-primary" onClick={() => setShowActivityModal(true)}>
                <Plus size={16} /> Award Activity Points
              </button>
            </div>

            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 20, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead style={{ background: 'var(--surface-alt)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '14px 20px', fontWeight: 800 }}>Student Name</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800 }}>Batch</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800 }}>Total Points</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800 }}>Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700 }}>{s.name}</td>
                      <td style={{ padding: '14px 20px' }}>{s.batch_name || s.batchName || 'Assigned'}</td>
                      <td style={{ padding: '14px 20px', fontWeight: 800, color: 'var(--primary-color)' }}>{s.activityPoints || 0} pts</td>
                      <td style={{ padding: '14px 20px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { setActStudentId(s.id); setShowActivityModal(true); }}>
                          + Award Points
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── MODULE 9: PROFILE ────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
                <div style={{ position: 'relative', marginBottom: 16 }}>
                  <img 
                    src={userProfile?.profilePic || userProfile?.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt="Avatar" 
                    style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--primary-color)' }}
                  />
                  <label htmlFor="profile-avatar-input" style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary-color)', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Camera size={16} />
                  </label>
                  <input type="file" id="profile-avatar-input" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploadingAvatar} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{userProfile?.fullName || userProfile?.name}</h2>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary-color)', background: 'rgba(108,60,240,0.1)', padding: '4px 12px', borderRadius: 20, marginTop: 6 }}>
                  Trainer ID: {userProfile?.trainerId || userProfile?.code}
                </span>
              </div>

              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={editingName} onChange={e => setEditingName(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Email Address (Auth ID)</label>
                  <input type="email" className="form-input" value={userProfile?.email || ''} disabled style={{ opacity: 0.7 }} />
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-input" value={editingPhone} onChange={e => setEditingPhone(e.target.value)} placeholder="+91 9876543210" />
                </div>
                <button type="submit" className="btn btn-primary" disabled={savingProfile} style={{ marginTop: 10 }}>
                  <Save size={16} /> {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ─── MODULE 10: SETTINGS (PASSWORD CHANGE) ────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="animate-fade-in" style={{ maxWidth: 540, margin: '0 auto' }}>
            <div style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 24, padding: 32, boxShadow: 'var(--shadow-lg)' }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>Account Settings & Security</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 24px' }}>
                Change your password and manage security preferences.
              </p>

              {passError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 600, marginBottom: 18 }}>
                  {passError}
                </div>
              )}

              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="form-label">Current Password *</label>
                  <input type="password" className="form-input" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">New Password *</label>
                  <input type="password" className="form-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Confirm New Password *</label>
                  <input type="password" className="form-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>

                <button type="submit" className="btn btn-primary" disabled={changingPass} style={{ marginTop: 10 }}>
                  <Lock size={16} /> {changingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ─── MODALS ───────────────────────────────────────────────────────── */}
      {/* Schedule Live Class Modal */}
      {showLiveModal && (
        <CustomModal isOpen={showLiveModal} onClose={() => setShowLiveModal(false)} title="Schedule New Live Class">
          <form onSubmit={handleScheduleLiveClass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="form-label">Lecture Name *</label><input type="text" className="form-input" value={liveLectureName} onChange={e => setLiveLectureName(e.target.value)} required /></div>
            <div>
              <label className="form-label">Assign Batch *</label>
              <select className="form-select" value={liveBatchId} onChange={e => setLiveBatchId(e.target.value)} required>
                <option value="">-- Select Batch --</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
              </select>
            </div>
            <div><label className="form-label">Class Date *</label><input type="date" className="form-input" value={liveDate} onChange={e => setLiveDate(e.target.value)} required /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div><label className="form-label">Start Time</label><input type="time" className="form-input" value={liveStartTime} onChange={e => setLiveStartTime(e.target.value)} /></div>
              <div><label className="form-label">End Time</label><input type="time" className="form-input" value={liveEndTime} onChange={e => setLiveEndTime(e.target.value)} /></div>
            </div>
            <div><label className="form-label">Google Meet Link *</label><input type="url" className="form-input" value={liveMeetLink} onChange={e => setLiveMeetLink(e.target.value)} placeholder="https://meet.google.com/..." required /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowLiveModal(false)}>Cancel</button>
              <button type="submit" disabled={schedulingLive} className="btn btn-primary">{schedulingLive ? 'Scheduling...' : 'Schedule Class'}</button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Add Recorded Lesson Modal */}
      {showRecordedModal && (
        <CustomModal isOpen={showRecordedModal} onClose={() => setShowRecordedModal(false)} title="Add Recorded Class / Drive Lesson">
          <form onSubmit={handleAddRecordedClass} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Recording Title *</label>
              <input 
                type="text" 
                className="form-input" 
                value={recTitle} 
                onChange={e => setRecTitle(e.target.value)} 
                placeholder="e.g. Masterclass on State Management & Hooks" 
                required 
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Course / Module Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={recModule} 
                  onChange={e => setRecModule(e.target.value)} 
                  placeholder="e.g. Module 3 - React Deep Dive" 
                />
              </div>
              <div>
                <label className="form-label">Assign Batch / Target Playlist *</label>
                <select 
                  className="form-select" 
                  value={recBatchId} 
                  onChange={e => {
                    const bId = e.target.value;
                    setRecBatchId(bId);
                    if (bId === 'common') {
                      setRecCourseName('Levlox Common Curriculum');
                    } else {
                      const bObj = batches.find(b => String(b.id) === String(bId));
                      if (bObj && bObj.course_name) {
                        setRecCourseName(bObj.course_name);
                      }
                    }
                  }}
                  required
                >
                  <option value="">-- Choose Batch / Playlist --</option>
                  <option value="common">🌐 Common Playlist (All Students / Universal Access)</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Google Drive Video Link / Video URL *</label>
              <input 
                type="url" 
                className="form-input" 
                value={recVideoUrl} 
                onChange={e => {
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
                  <span><strong>Google Drive link verified:</strong> Video will stream directly inside portal with anti-download protection.</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Thumbnail URL (Optional)</label>
                <input 
                  type="url" 
                  className="form-input" 
                  value={recThumbnailUrl} 
                  onChange={e => setRecThumbnailUrl(e.target.value)} 
                  placeholder="https://... (auto-generated if empty)" 
                />
              </div>
              <div>
                <label className="form-label">Duration</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={recDuration} 
                  onChange={e => setRecDuration(e.target.value)} 
                  placeholder="e.g. 1h 30m" 
                />
              </div>
            </div>

            <div>
              <label className="form-label">Lesson Description</label>
              <textarea 
                className="form-input" 
                value={recDescription} 
                onChange={e => setRecDescription(e.target.value)} 
                placeholder="Detailed outline of topics covered in this recording session..." 
                style={{ minHeight: 70 }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowRecordedModal(false)}>Cancel</button>
              <button type="submit" disabled={savingRecorded} className="btn btn-primary">{savingRecorded ? 'Saving Lesson...' : 'Save & Publish Recording'}</button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Trainer Academia Modern In-Portal Course Viewer */}
      {previewVideo && (() => {
        const previewPlaylistObj = {
          id: previewVideo.playlist_id || previewVideo.batch_id || 'trainer_preview',
          name: previewVideo.course_title || previewVideo.title || 'Course Recordings',
          title: previewVideo.title,
          course_name: previewVideo.course_title,
          batch_name: 'Trainer Course Preview',
          lessons: [previewVideo],
          study_materials: previewVideo.study_materials || []
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
                    Trainer Studio Preview
                  </span>
                  <span style={{ fontSize: 13, color: '#64748B' }}>
                    Student DRM & Protected In-Portal Playback
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
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
                  initialLessonId={previewVideo.id}
                  onBack={() => setPreviewVideo(null)}
                  userRole="trainer"
                  userProfile={userProfile}
                  currentUser={currentUser}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* Create Announcement Modal */}
      {showAnnModal && (
        <CustomModal isOpen={showAnnModal} onClose={() => setShowAnnModal(false)} title="Create Announcement">
          <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label className="form-label">Title *</label><input type="text" className="form-input" value={annTitle} onChange={e => setAnnTitle(e.target.value)} required /></div>
            <div>
              <label className="form-label">Target Batch *</label>
              <select className="form-select" value={annBatchId} onChange={e => setAnnBatchId(e.target.value)} required>
                <option value="">-- Select Batch --</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div><label className="form-label">Message Content *</label><textarea className="form-input" value={annMessage} onChange={e => setAnnMessage(e.target.value)} style={{ minHeight: 80 }} required /></div>
            <div>
              <label className="form-label">Attach File / Circular (Optional)</label>
              <input
                type="file"
                className="form-input"
                onChange={e => setAnnFile(e.target.files[0] || null)}
              />
              <span style={{ fontSize: 11, color: '#64748B' }}>Attach PDF, document, or resources for this circular</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAnnModal(false)}>Cancel</button>
              <button type="submit" disabled={savingAnn} className="btn btn-primary">{savingAnn ? 'Posting...' : 'Post Announcement'}</button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Award Activity Points Modal */}
      {showActivityModal && (
        <CustomModal isOpen={showActivityModal} onClose={() => setShowActivityModal(false)} title="Award Student Activity Points">
          <form onSubmit={handleAwardPoints} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Select Student *</label>
              <select className="form-select" value={actStudentId} onChange={e => setActStudentId(e.target.value)} required>
                <option value="">-- Select Student --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.batch_name || 'Batch'})</option>)}
              </select>
            </div>
            <div><label className="form-label">Points Amount *</label><input type="number" className="form-input" value={actPoints} onChange={e => setActPoints(e.target.value)} required /></div>
            <div>
              <label className="form-label">Activity Type</label>
              <select className="form-select" value={actType} onChange={e => setActType(e.target.value)}>
                <option value="Participation">Class Participation (+5)</option>
                <option value="Quiz Winner">Quiz Winner (+15)</option>
                <option value="Assignment Completed">Assignment (+10)</option>
                <option value="Perfect Attendance">Perfect Attendance (+20)</option>
              </select>
            </div>
            <div><label className="form-label">Remarks</label><input type="text" className="form-input" value={actRemarks} onChange={e => setActRemarks(e.target.value)} placeholder="e.g. Great answer during lecture" /></div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowActivityModal(false)}>Cancel</button>
              <button type="submit" disabled={savingActivity} className="btn btn-primary">{savingActivity ? 'Awarding...' : 'Award Points'}</button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* Batch Details Modal */}
      {selectedBatchDetails && (
        <CustomModal isOpen={!!selectedBatchDetails} onClose={() => setSelectedBatchDetails(null)} title={`Batch Details — ${selectedBatchDetails.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 14, background: 'var(--surface-alt)', borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Batch Code: <strong>{selectedBatchDetails.code || selectedBatchDetails.id}</strong></div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Course: <strong>{selectedBatchDetails.course_name}</strong></div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Schedule: <strong>{selectedBatchDetails.schedule || 'Regular'}</strong></div>
            </div>
            <h4 style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 800 }}>Student Roster ({selectedBatchDetails.students_count || 0})</h4>
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {students.filter(s => s.batch_id === selectedBatchDetails.id || (selectedBatchDetails.student_ids || []).includes(s.id)).map(st => (
                <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: 13 }}>
                  <span>{st.name} ({st.rollNumber || st.id})</span>
                  <span style={{ color: 'var(--text-secondary)' }}>{st.email}</span>
                </div>
              ))}
            </div>
          </div>
        </CustomModal>
      )}

      {/* Student Details Modal */}
      {selectedStudentDetails && (
        <CustomModal isOpen={!!selectedStudentDetails} onClose={() => setSelectedStudentDetails(null)} title={`Student Profile — ${selectedStudentDetails.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <img src={selectedStudentDetails.profile_pic || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{selectedStudentDetails.name}</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {selectedStudentDetails.rollNumber || selectedStudentDetails.id}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Email: {selectedStudentDetails.email}</div>
              </div>
            </div>
            <div style={{ padding: 14, background: 'var(--surface-alt)', borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
              <div>Course: <strong>{selectedStudentDetails.course}</strong></div>
              <div>Batch: <strong>{selectedStudentDetails.batch_name || 'Assigned'}</strong></div>
              <div>Activity Score: <strong>{selectedStudentDetails.activityPoints || 0} pts</strong></div>
              <div>Account Status: <strong>{selectedStudentDetails.status || 'Active'}</strong></div>
            </div>
          </div>
        </CustomModal>
      )}

      {/* ═══ TRAINER UPLOAD CLASS RECORDING MODAL ═════════════════════ */}
      {trainerUploadClass && (
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
                    Publish replay for batch: <strong>{trainerUploadClass.batchName || trainerUploadClass.batch_name || trainerUploadClass.batchId || 'All'}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close-red" onClick={() => setTrainerUploadClass(null)} aria-label="Close modal"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveTrainerRecording}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-alt)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>{trainerUploadClass.title || trainerUploadClass.lectureName}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: 4 }}>
                    Date: <strong>{trainerUploadClass.date}</strong> ({trainerUploadClass.time})
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>
                    Recording Video URL (YouTube / Google Drive / MP4 Link) *
                  </label>
                  <input
                    type="url"
                    required
                    value={trainerRecordingUrl}
                    onChange={(e) => setTrainerRecordingUrl(e.target.value)}
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
                      id="trainer-recording-file-input"
                      disabled={trainerIsUploadingFile}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleTrainerVideoFileUpload(file);
                      }}
                    />
                    <label htmlFor="trainer-recording-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <UploadCloud size={24} color="#2563EB" />
                      <span style={{ fontSize: 12.5, color: 'var(--text-primary)', fontWeight: 650 }}>
                        {trainerIsUploadingFile ? 'Uploading video file to server...' : 'Click to select recorded video file (MP4 / WebM)'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Directly playable with DRM protection</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 700 }}>Recording Duration</label>
                  <input
                    type="text"
                    value={trainerRecordingDuration}
                    onChange={(e) => setTrainerRecordingDuration(e.target.value)}
                    placeholder="e.g. 1h 15m"
                    className="form-input"
                    style={{ height: '40px', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setTrainerUploadClass(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={trainerUploadSaving || trainerIsUploadingFile} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {trainerUploadSaving ? 'Saving...' : <><UploadCloud size={15} /> Save & Attach Recording</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ TRAINER PREVIEW VIDEO MODAL ═════════════════════════════════ */}
      {trainerPreviewVideo && (
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
                Live Replay Preview
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, margin: '2px 0 0', color: '#FFFFFF' }}>
                {trainerPreviewVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setTrainerPreviewVideo(null)}
              style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
          <div style={{ width: '100%', maxWidth: 1040, height: '620px', background: '#000', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)' }}>
            <SecureVideoPlayer
              video={trainerPreviewVideo}
              currentUser={{
                name: userProfile?.fullName || userProfile?.name || 'Trainer',
                email: userProfile?.email || 'trainer@levelox.com',
                rollNumber: userProfile?.trainerId || 'TR-LEVO'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Icon for sidebar menu
const LayersIcon = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

export default TrainerDashboard;
