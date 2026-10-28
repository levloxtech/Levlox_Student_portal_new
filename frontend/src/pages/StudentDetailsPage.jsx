import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Mail, Phone, GraduationCap, MapPin, Building2, Briefcase,
  CheckCircle2, Calendar, Award, BookOpen, Percent, Users, UserCheck,
  ChevronLeft, FileText, Clock, AlertCircle, Video, PlayCircle, Megaphone,
  CreditCard, ShieldCheck, DollarSign, Trash2, Copy, Check, ExternalLink,
  ChevronRight, ArrowLeft, RefreshCw, XCircle, AlertTriangle, Pencil, Lock,
  Eye, EyeOff, Save, X, Camera
} from 'lucide-react';
import {
  getStudent,
  getAttendanceForStudent,
  getPaymentsForStudent,
  getDocuments,
  classifyFirestoreError,
  formatCurrency,
  getStudentFeeDetails,
  deleteDocument as deleteStudentDoc,
  updateStudent,
  uploadProfileImage
} from '../services/firebaseService';
import { sendStudentProfileUpdatedEmail } from '../services/emailService';
import { compressImage } from '../utils/imageCompressor';
import { where, limit } from 'firebase/firestore';

const StudentDetailsPage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [copiedId, setCopiedId] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState(null);

  const [pendingAvatar, setPendingAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    course: '',
    batch_name: '',
    status: 'active',
    dob: '',
    gender: '',
    city: '',
    location: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_relation: 'Guardian',
  });

  // Fetch Student document
  const {
    data: student,
    isLoading: studentLoading,
    error: studentError,
    refetch: refetchStudent
  } = useQuery({
    queryKey: ['adminStudentDetails', studentId],
    queryFn: () => getStudent(studentId),
    enabled: !!studentId,
  });

  // Fetch Attendance records for student
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ['studentAttendance', studentId],
    queryFn: () => getAttendanceForStudent(studentId),
    enabled: !!studentId,
  });

  // Fetch Payments for student
  const { data: paymentRecords = [] } = useQuery({
    queryKey: ['studentPayments', studentId],
    queryFn: () => getPaymentsForStudent(studentId),
    enabled: !!studentId,
  });

  // Fetch Activity Scores for student
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['studentActivityScores', studentId],
    queryFn: () => getDocuments('activityScores', [where('studentId', '==', studentId), limit(50)]).catch(() => []),
    enabled: !!studentId,
  });

  // Populate edit form when student data loads
  useEffect(() => {
    if (student) {
      setEditForm({
        name: student.name || '',
        phone: student.phone || student.mobile || '',
        email: student.email || '',
        password: '',
        course: student.course || 'Fullstack Engineering',
        batch_name: student.batch_name || student.batch || '',
        status: student.status || 'active',
        dob: student.dob || student.date_of_birth || student.dateOfBirth || '',
        gender: student.gender || '',
        city: student.city || '',
        location: student.current_location || student.location || '',
        guardian_name: student.guardian_name || student.guardianName || '',
        guardian_phone: student.guardian_phone || student.guardianPhone || student.guardianContact || '',
        guardian_relation: student.guardian_relation || student.guardianRelation || 'Guardian',
      });
      setAvatarPreview(student.profilePhotoUrl || student.profile_pic || '');
      setPendingAvatar(null);
    }
  }, [student]);

  // Calculate attendance summary
  const attendanceStats = React.useMemo(() => {
    if (attendanceRecords.length > 0) {
      const present = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'present').length;
      const absent = attendanceRecords.filter(r => (r.status || '').toLowerCase() === 'absent').length;
      const total = attendanceRecords.length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      return { present, absent, total, pct };
    }
    const pct = typeof student?.attendance?.percentage === 'number'
      ? student.attendance.percentage
      : (typeof student?.attendance === 'number' ? student.attendance : 0);
    const present = student?.attendance?.present || (pct > 0 ? Math.round((pct / 100) * 40) : 0);
    const absent = student?.attendance?.absent || 0;
    return { present, absent, total: present + absent, pct };
  }, [attendanceRecords, student]);

  const handleCopyRollNo = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleBackToStudents = () => {
    navigate('/admin?tab=students', { state: { tab: 'students' } });
  };

  const executeDeleteStudent = async () => {
    if (!studentId || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteStudentDoc('students', studentId);
      await deleteStudentDoc('users', studentId).catch(() => {});
      queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
      navigate('/admin?tab=students', { state: { tab: 'students' } });
    } catch (err) {
      console.error('Delete student failed:', err);
      setDeleteError(err.message || 'Failed to delete student.');
      setIsDeleting(false);
    }
  };

  const handleSaveStudentProfile = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setSaveErrorMessage('Name and Email are required.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);
    setSaveSuccessMessage(null);

    try {
      const patch = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim().toLowerCase(),
        course: editForm.course.trim(),
        batch_name: editForm.batch_name.trim(),
        status: editForm.status,
        dob: editForm.dob.trim(),
        gender: editForm.gender,
        city: editForm.city.trim(),
        current_location: editForm.location.trim(),
        location: editForm.location.trim(),
        guardian_name: editForm.guardian_name.trim(),
        guardian_phone: editForm.guardian_phone.trim(),
        guardian_relation: editForm.guardian_relation,
        updatedAt: new Date().toISOString()
      };

      if (pendingAvatar) {
        const photoUrl = await uploadProfileImage(studentId, pendingAvatar);
        patch.profile_pic = photoUrl;
        patch.profilePhotoUrl = photoUrl;
      }

      if (editForm.password && editForm.password.trim()) {
        patch.password = editForm.password.trim();
      }

      // Update student document in database (server.js automatically syncs credentials to users.json)
      await updateStudent(studentId, patch);

      // Automatically dispatch update email to the student's email address
      const studentPayload = { ...student, ...patch, id: studentId, uid: studentId };
      await sendStudentProfileUpdatedEmail(
        studentPayload,
        editForm.password && editForm.password.trim() ? editForm.password.trim() : null
      );

      // Invalidate React Query caches
      await queryClient.invalidateQueries({ queryKey: ['adminStudentDetails', studentId] });
      await queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] });
      refetchStudent();

      setSaveSuccessMessage('Profile updated & notification email sent successfully!');
      setTimeout(() => {
        setSaveSuccessMessage(null);
        setShowEditModal(false);
      }, 1800);
    } catch (err) {
      console.error('[StudentDetails] Save profile error:', err);
      setSaveErrorMessage(err.message || 'Failed to update student profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (studentLoading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 48,
          height: 48,
          border: '3px solid #E2E8F0',
          borderTopColor: '#6C3CF0',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: 16
        }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', margin: 0 }}>Loading Student Record...</h3>
        <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 4 }}>Retrieving enrollment, academic, and attendance data</p>
      </div>
    );
  }

  if (studentError || !student) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', color: '#9B2C2C', borderRadius: 20, padding: 36, maxWidth: 520, margin: '40px auto', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} style={{ color: '#E53E3E', marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800 }}>Student Record Not Found</h3>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: '#742A2A', lineHeight: 1.5 }}>
            {studentError ? classifyFirestoreError(studentError).message : `Could not locate a student account matching ID: ${studentId}`}
          </p>
          <button
            onClick={handleBackToStudents}
            style={{
              background: '#6C3CF0',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(108, 60, 240, 0.3)'
            }}
          >
            <ArrowLeft size={16} /> Return to Students Panel
          </button>
        </div>
      </div>
    );
  }

  const profilePhoto = student.profilePhotoUrl || student.profile_pic || '';
  const fullName = student.name || 'Unnamed Student';
  const rollNo = student.rollNumber || student.student_id || studentId;
  const course = student.course || 'Fullstack Engineering';
  const batchName = student.batch_name || student.batch || 'Not Assigned';
  const feeInfo = getStudentFeeDetails(student);
  const feesStatus = feeInfo.isPaid ? 'Paid' : (student.feesStatus || 'Pending Payment');
  const isPaid = feesStatus.toLowerCase() === 'paid';
  const accountStatus = (student.status || 'active').toLowerCase();
  const isActive = accountStatus === 'active';
  const isVerified = Boolean(student.emailVerified);
  const totalFee = feeInfo.total || 20000;
  const paidFee = feeInfo.paid || 0;
  const remainingFee = feeInfo.remaining ?? (totalFee - paidFee);
  const feePaidPct = totalFee > 0 ? Math.min(100, Math.round((paidFee / totalFee) * 100)) : 0;

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '16px 20px 48px' }} className="animate-fade-in">
      
      {/* ── BREADCRUMB & TOP NAV ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleBackToStudents}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: 12,
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6C3CF0'; e.currentTarget.style.color = '#6C3CF0'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
          >
            <ChevronLeft size={16} /> Back to Students
          </button>

          {/* Breadcrumb links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748B' }}>
            <span
              style={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={() => navigate('/admin?tab=dashboard', { state: { tab: 'dashboard' } })}
              onMouseOver={(e) => e.target.style.color = '#6C3CF0'}
              onMouseOut={(e) => e.target.style.color = '#64748B'}
            >
              Portal
            </span>
            <ChevronRight size={14} color="#94A3B8" />
            <span
              style={{ cursor: 'pointer', fontWeight: 600 }}
              onClick={handleBackToStudents}
              onMouseOver={(e) => e.target.style.color = '#6C3CF0'}
              onMouseOut={(e) => e.target.style.color = '#64748B'}
            >
              Students
            </span>
            <ChevronRight size={14} color="#94A3B8" />
            <span style={{ fontWeight: 700, color: '#1E293B' }}>{fullName}</span>
          </div>
        </div>

        {/* Top Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Edit Profile Button */}
          <button
            onClick={() => {
              setShowEditModal(true);
              setSaveSuccessMessage(null);
              setSaveErrorMessage(null);
            }}
            style={{
              background: '#6C3CF0',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 3px 10px rgba(108, 60, 240, 0.25)',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#582BD6'}
            onMouseOut={(e) => e.currentTarget.style.background = '#6C3CF0'}
          >
            <Pencil size={15} /> Edit Student
          </button>

          {/* Send Email Link */}
          {student.email && (
            <a
              href={`mailto:${student.email}`}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #6C3CF0',
                color: '#6C3CF0',
                padding: '8px 16px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#F3EEFF'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
            >
              <Mail size={15} /> Send Email
            </a>
          )}

          {/* Delete Student Button */}
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              background: '#FFF5F5',
              border: '1.5px solid #FED7D7',
              color: '#E53E3E',
              padding: '8px 16px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#FED7D7'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = '#FFF5F5'; }}
          >
            <Trash2 size={15} /> Delete Student
          </button>
        </div>
      </div>

      {/* ── HERO PROFILE CARD ── */}
      <div style={{
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF8FF 100%)',
        border: '1.5px solid #EDE9FE',
        borderRadius: 24,
        padding: '28px 32px',
        boxShadow: '0 10px 30px -10px rgba(108, 60, 240, 0.08), 0 4px 6px -2px rgba(0,0,0,0.02)',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108, 60, 240, 0.08) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          {/* Left Avatar & Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {/* Avatar with status indicator */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #6C3CF0 0%, #4F46E5 100%)',
                boxShadow: '0 8px 20px -4px rgba(108, 60, 240, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid #FFFFFF',
                flexShrink: 0
              }}>
                {profilePhoto ? (
                  <img src={profilePhoto} alt={fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>
                    {(fullName || 'S')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div
                title={isActive ? 'Active Account' : 'Inactive Account'}
                style={{
                  position: 'absolute',
                  bottom: 4,
                  right: 4,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: isActive ? '#10B981' : '#94A3B8',
                  border: '3px solid #FFFFFF',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </div>

            {/* Student Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>{fullName}</h1>
                
                {/* Account Status Pill */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 20,
                  background: isActive ? '#DCFCE7' : '#F1F5F9',
                  color: isActive ? '#15803D' : '#64748B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? '#16A34A' : '#94A3B8' }} />
                  {isActive ? 'Active' : 'Inactive'}
                </span>

                {/* Email Verification Pill */}
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 12px',
                  borderRadius: 20,
                  background: isVerified ? '#E0F2FE' : '#FEF3C7',
                  color: isVerified ? '#0369A1' : '#B45309',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  {isVerified ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  {isVerified ? 'Verified' : 'Email Pending'}
                </span>
              </div>

              {/* Roll number & tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div
                  onClick={() => handleCopyRollNo(rollNo)}
                  title="Click to copy ID"
                  style={{
                    background: '#EDE9FE',
                    color: '#5B21B6',
                    padding: '3px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {rollNo} {copiedId ? <Check size={12} color="#16A34A" /> : <Copy size={12} />}
                </div>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>•</span>
                <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{course}</span>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>•</span>
                <span style={{ fontSize: 13, color: '#6C3CF0', fontWeight: 700 }}>{batchName}</span>
              </div>

              {/* Contact Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="#6C3CF0" />
                  {student.email ? (
                    <a href={`mailto:${student.email}`} style={{ color: '#475569', textDecoration: 'none' }}>
                      {student.email}
                    </a>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>No email provided</span>
                  )}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="#6C3CF0" />
                  {student.phone ? (
                    <a href={`tel:${student.phone}`} style={{ color: '#475569', textDecoration: 'none' }}>
                      {student.phone}
                    </a>
                  ) : (
                    <span style={{ color: '#94A3B8' }}>No phone recorded</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Right Highlights */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '12px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 120
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                Fee Status
              </span>
              <span style={{
                fontSize: 15,
                fontWeight: 800,
                color: isPaid ? '#16A34A' : '#D97706',
                display: 'block',
                marginTop: 2
              }}>
                {feesStatus}
              </span>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 16,
              padding: '12px 20px',
              textAlign: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              minWidth: 120
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block' }}>
                Attendance
              </span>
              <span style={{
                fontSize: 16,
                fontWeight: 800,
                color: '#6C3CF0',
                display: 'block',
                marginTop: 2
              }}>
                {attendanceStats.pct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI STATS CARDS ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Attendance Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 18,
          padding: '20px 22px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Attendance Track</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#EDE9FE', color: '#6C3CF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>{attendanceStats.pct}%</span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>overall rate</span>
          </div>
          {/* Progress bar */}
          <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${attendanceStats.pct}%`, height: '100%', background: '#6C3CF0', borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#16A34A' }}>Present: {attendanceStats.present}</span>
            <span style={{ color: '#DC2626' }}>Absent: {attendanceStats.absent}</span>
          </div>
        </div>

        {/* Fees Financial Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 18,
          padding: '20px 22px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fee Collection</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: isPaid ? '#16A34A' : '#0F172A' }}>{formatCurrency(paidFee)}</span>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>of {formatCurrency(totalFee)}</span>
          </div>
          {/* Fee Progress Bar */}
          <div style={{ width: '100%', height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${feePaidPct}%`, height: '100%', background: isPaid ? '#16A34A' : '#F59E0B', borderRadius: 99 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600 }}>
            <span style={{ color: '#64748B' }}>Remaining:</span>
            <span style={{ color: remainingFee > 0 ? '#D97706' : '#16A34A', fontWeight: 700 }}>{formatCurrency(remainingFee)}</span>
          </div>
        </div>

        {/* Activity & Performance Points */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 18,
          padding: '20px 22px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Activity Score</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#0F172A' }}>{student.activityPoints || 0}</span>
            <span style={{ fontSize: 12, color: '#D97706', fontWeight: 700 }}>Total Points</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#64748B', lineHeight: 1.4 }}>
            Performance ranking & participation metrics in cohort.
          </p>
        </div>

        {/* Verification Status Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 18,
          padding: '20px 22px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>Enrollment Status</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: isVerified ? '#16A34A' : '#D97706' }}>
              {isVerified ? 'Verified Account' : 'Pending Action'}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            <span>Email Delivery: </span>
            <strong style={{ color: student.emailDeliveryStatus === 'Failed' ? '#DC2626' : '#16A34A' }}>
              {student.emailDeliveryStatus || 'Sent'}
            </strong>
          </div>
        </div>

      </div>

      {/* ── TWO COLUMN MAIN DETAILS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
        
        {/* COLUMN 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Academic & Batch Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <GraduationCap size={18} color="#6C3CF0" /> Academic & Enrollment Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Enrolled Course</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4, display: 'block' }}>{course}</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Assigned Batch</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#6C3CF0', marginTop: 4, display: 'block' }}>{batchName}</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Student ID / Roll Number</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginTop: 4, display: 'block' }}>{rollNo}</span>
              </div>
              <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'block' }}>Registration Date</span>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginTop: 4, display: 'block' }}>
                  {student.createdAt && typeof student.createdAt === 'string' ? student.createdAt.split('T')[0] : (student.join_date || 'Standard Entry')}
                </span>
              </div>
            </div>
          </div>

          {/* Personal & Contact Details Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="#6C3CF0" /> Personal & Contact Profile
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Email Address</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.email || 'Not Provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Primary Mobile</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.phone || 'Not Provided'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Date of Birth</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.dob || student.date_of_birth || 'Not Specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Gender</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.gender || 'Not Specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Current Location / City</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.current_location || student.location || student.city || 'Not Specified'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Guardian Info</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                  {student.guardian_name || student.guardianName ? `${student.guardian_name || student.guardianName} (${student.guardian_relation || student.guardianRelation || 'Guardian'})` : 'Not Specified'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#F8FAFC', borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Guardian Contact</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{student.guardian_phone || student.guardianPhone || student.guardianContact || student.parent_phone || 'Not Specified'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMN 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Fee & Payment Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CreditCard size={18} color="#6C3CF0" /> Fee Status & Payment Ledger
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>Total Course Tuition</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{formatCurrency(totalFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>Amount Paid to Date</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#16A34A' }}>{formatCurrency(paidFee)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13.5, color: '#64748B', fontWeight: 600 }}>Outstanding Balance</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: remainingFee > 0 ? '#D97706' : '#16A34A' }}>
                  {formatCurrency(remainingFee)}
                </span>
              </div>
            </div>

            {/* Payment history list */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <h4 style={{ fontSize: 12.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
                Payment History
              </h4>
              {paymentRecords.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {paymentRecords.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{p.date || 'Payment Received'}</span>
                      <span style={{ fontWeight: 800, color: '#16A34A' }}>+ ₹{p.amount || 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0', color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>
                  No payment transactions recorded yet.
                </div>
              )}
            </div>
          </div>

          {/* Activity Logs & Achievements */}
          <div style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Award size={18} color="#6C3CF0" /> Activity Points & Achievements
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'linear-gradient(135deg, #FAF8FF 0%, #EDE9FE 100%)', borderRadius: 14, border: '1.5px solid #DDD6FE', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#6C3CF0', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cohort Activity Score</span>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#5B21B6', marginTop: 2 }}>{student.activityPoints || 0} Points</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(108, 60, 240, 0.15)' }}>
                <Award size={24} color="#6C3CF0" />
              </div>
            </div>

            {activityLogs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activityLogs.slice(0, 5).map((log) => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '10px 12px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{log.activityType || 'Participation'}</span>
                    <span style={{ fontWeight: 800, color: '#6C3CF0' }}>+{log.points} pts</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: '#94A3B8', fontSize: 13, fontStyle: 'italic' }}>
                No specific activity records logged yet.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* ── EDIT STUDENT PROFILE MODAL ── */}
      {showEditModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            maxWidth: 520,
            width: '100%',
            padding: '28px 32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            animation: 'fadeInScale 0.2s ease-out',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EDE9FE', color: '#6C3CF0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pencil size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Edit Student Profile</h3>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748B' }}>Update credentials & details for {rollNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {saveSuccessMessage && (
              <div style={{ padding: '10px 14px', background: '#DCFCE7', border: '1px solid #86EFAC', color: '#15803D', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={16} /> {saveSuccessMessage}
              </div>
            )}

            {saveErrorMessage && (
              <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} /> {saveErrorMessage}
              </div>
            )}

            <form onSubmit={handleSaveStudentProfile} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile Avatar Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 14px', background: '#F8FAFC', borderRadius: 14, border: '1px solid #E2E8F0' }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: '#6C3CF0',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 20,
                  flexShrink: 0
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span>{(editForm.name || 'S')[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Student Photo (Stored on Server)
                  </label>
                  <label style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer'
                  }}>
                    <Camera size={14} /> Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file, 900, 0.85);
                            setPendingAvatar(compressed);
                            setAvatarPreview(URL.createObjectURL(compressed));
                          } catch {
                            setPendingAvatar(file);
                            setAvatarPreview(URL.createObjectURL(file));
                          }
                        }
                      }}
                    />
                  </label>
                  {pendingAvatar && (
                    <span style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 600, marginLeft: 8 }}>
                      Ready to upload ({pendingAvatar.name})
                    </span>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Student full name"
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Mobile Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Mobile Number (Login ID)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="10-digit mobile number"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 13.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="student@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 14px 10px 38px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 13.5,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                    New Password
                  </label>
                  <span style={{ fontSize: 11, color: '#64748B' }}>Leave blank to keep unchanged</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter new password (optional)"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 38px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: 10,
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* DOB & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Gender
                  </label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* City & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Bangalore, Chennai"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Current Location / Address
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Indiranagar, Bangalore"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Guardian Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Guardian Name
                  </label>
                  <input
                    type="text"
                    value={editForm.guardian_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, guardian_name: e.target.value }))}
                    placeholder="Parent / Guardian name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Guardian Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={editForm.guardian_phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, guardian_phone: e.target.value }))}
                    placeholder="Guardian phone"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Relationship
                  </label>
                  <select
                    value={editForm.guardian_relation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, guardian_relation: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Course & Batch */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Course
                  </label>
                  <input
                    type="text"
                    value={editForm.course}
                    onChange={(e) => setEditForm(prev => ({ ...prev, course: e.target.value }))}
                    placeholder="Course name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Batch Name
                  </label>
                  <input
                    type="text"
                    value={editForm.batch_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, batch_name: e.target.value }))}
                    placeholder="Batch name"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Account Status */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Account Status
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13.5,
                    background: '#FFFFFF',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending_verification">Pending Email Verification</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: '1.5px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  style={{
                    flex: 1,
                    padding: '12px 18px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#6C3CF0',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(108, 60, 240, 0.3)'
                  }}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving & Emailing...
                    </>
                  ) : (
                    <>
                      <Save size={15} /> Save & Send Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CUSTOM DELETE CONFIRMATION MODAL ── */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            maxWidth: 440,
            width: '100%',
            padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            textAlign: 'center',
            border: '1px solid #E2E8F0',
            animation: 'fadeInScale 0.2s ease-out'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#FEE2E2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Delete Student Account?
            </h3>
            <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, margin: '0 0 24px' }}>
              Are you sure you want to delete <strong>{fullName}</strong> ({rollNo})?<br />
              This will remove all associated enrollment and authentication records. This action cannot be undone.
            </p>

            {deleteError && (
              <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 12,
                  border: '1.5px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDeleteStudent}
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 12,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Confirm Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentDetailsPage;
