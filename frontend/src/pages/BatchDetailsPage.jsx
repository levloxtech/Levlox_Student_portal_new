import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Users, ChevronLeft, UserPlus, Trash2, Search, CheckCircle,
  Calendar, BookOpen, UserCheck, AlertCircle, Eye, RefreshCw, X,
  Clock, FastForward, Timer, Sparkles
} from 'lucide-react';
import {
  getDocument,
  getStudentsByBatch,
  listStudents,
  assignStudentsToBatch,
  unassignStudentFromBatch,
  updateBatch,
  classifyFirestoreError
} from '../services/firebaseService';
import {
  calculateBatchDurationInfo,
  addDaysToDate,
  getDaysBetween,
  formatReadableDate,
  formatLocalDate
} from '../utils/batchUtils';
import CustomModal from '../components/Modal';

const BatchDetailsPage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [toast, setToast] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Extend Batch Modal State
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState(15);
  const [extendTiming, setExtendTiming] = useState('');
  const [extendReason, setExtendReason] = useState('');
  const [isExtending, setIsExtending] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // 1. Query Batch document from Firestore
  const {
    data: batch,
    isLoading: batchLoading,
    error: batchError,
    refetch: refetchBatch
  } = useQuery({
    queryKey: ['adminBatchDetails', batchId],
    queryFn: () => getDocument('batches', batchId),
    enabled: !!batchId,
  });

  // 2. Query Students in this batch
  const {
    data: batchStudents = [],
    isLoading: studentsLoading,
    refetch: refetchBatchStudents
  } = useQuery({
    queryKey: ['adminBatchStudents', batchId],
    queryFn: async () => {
      // First try resolving via getStudentsByBatch (student_ids array)
      const list = await getStudentsByBatch(batchId);
      if (list && list.length > 0) return list;
      // Fallback: list all students where batch_id === batchId
      const all = await listStudents();
      return all.filter(s => s.batch_id === batchId);
    },
    enabled: !!batchId,
  });

  // 3. Query ALL students for Assign Modal
  const { data: allStudents = [] } = useQuery({
    queryKey: ['allStudentsForAssign'],
    queryFn: () => listStudents(),
  });

  // Modal State for Assign Students
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const openAssignModal = () => {
    setErrorMessage('');
    setAssignSearch('');
    // Pre-select students currently in this batch
    const currentIds = (batch?.student_ids && batch.student_ids.length > 0)
      ? batch.student_ids
      : batchStudents.map(s => s.id);
    setSelectedStudentIds(currentIds);
    setShowAssignModal(true);
  };

  const handleCheckboxToggle = (studentId) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSaveAssignment = async () => {
    setAssigning(true);
    setErrorMessage('');
    try {
      await assignStudentsToBatch(batchId, selectedStudentIds);
      showToast('Batch roster updated successfully in Firestore ✓');
      queryClient.invalidateQueries(['adminBatchDetails', batchId]);
      queryClient.invalidateQueries(['adminBatchStudents', batchId]);
      queryClient.invalidateQueries(['adminBatches']);
      queryClient.invalidateQueries(['adminDashboardAll']);
      setShowAssignModal(false);
    } catch (err) {
      console.error('[BatchDetailsPage] assign failed:', err);
      setErrorMessage(classifyFirestoreError(err).message);
    } finally {
      setAssigning(false);
    }
  };

  // Unassign student action
  const handleUnassignStudent = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to remove "${studentName}" from this batch?`)) return;
    try {
      await unassignStudentFromBatch(batchId, studentId);
      showToast(`Removed ${studentName} from batch ✓`);
      queryClient.invalidateQueries(['adminBatchDetails', batchId]);
      queryClient.invalidateQueries(['adminBatchStudents', batchId]);
      queryClient.invalidateQueries(['adminBatches']);
      queryClient.invalidateQueries(['adminDashboardAll']);
    } catch (err) {
      console.error('[BatchDetailsPage] unassign failed:', err);
      alert(classifyFirestoreError(err).message);
    }
  };

  const handleOpenExtendModal = () => {
    setExtendDays(15);
    setExtendTiming(batch?.timing || '10:00 AM - 12:00 PM');
    setExtendReason('');
    setShowExtendModal(true);
  };

  const handleConfirmExtendBatch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!batch) return;
    try {
      setIsExtending(true);
      const today = formatLocalDate(new Date());
      const currentEnd = batch.end_date || today;
      const baseDate = (currentEnd < today) ? today : currentEnd;
      const newEndDate = addDaysToDate(baseDate, extendDays);

      const prevDuration = Number(batch.duration_days) || getDaysBetween(batch.start_date, batch.end_date) || 50;
      const newTotalDuration = prevDuration + Number(extendDays);

      const extensionRecord = {
        extendedAt: new Date().toISOString(),
        daysAdded: Number(extendDays),
        previousEndDate: batch.end_date,
        newEndDate: newEndDate,
        previousTiming: batch.timing || '10:00 AM - 12:00 PM',
        newTiming: extendTiming.trim() || batch.timing || '10:00 AM - 12:00 PM',
        reason: extendReason.trim() || 'Batch duration extension',
      };

      const updatedHistory = Array.isArray(batch.extension_history)
        ? [...batch.extension_history, extensionRecord]
        : [extensionRecord];

      const patch = {
        end_date: newEndDate,
        duration_days: newTotalDuration,
        timing: extendTiming.trim() || batch.timing || '10:00 AM - 12:00 PM',
        status: 'Active',
        extension_history: updatedHistory,
        updatedAt: new Date().toISOString()
      };

      await updateBatch(batchId, patch);
      setShowExtendModal(false);
      showToast(`Batch extended +${extendDays} days! New end date is ${formatReadableDate(newEndDate)} ✓`);
      refetchBatch();
      queryClient.invalidateQueries(['adminBatches']);
      queryClient.invalidateQueries(['adminDashboardAll']);
    } catch (err) {
      console.error('[BatchDetailsPage] extend failed:', err);
      alert(classifyFirestoreError(err).message);
    } finally {
      setIsExtending(false);
    }
  };

  if (batchLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p style={{ fontWeight: 600 }}>Loading batch details...</p>
      </div>
    );
  }

  if (batchError || !batch) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 16, padding: 32, maxWidth: 500, margin: '0 auto' }}>
          <AlertCircle size={40} style={{ marginBottom: 12 }} />
          <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800 }}>Batch Not Found</h3>
          <p style={{ margin: '0 0 20px', fontSize: 13.5 }}>
            {batchError ? classifyFirestoreError(batchError).message : `No batch found with ID: ${batchId}`}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/admin?tab=batches', { state: { tab: 'batches' } })}>
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  const maxCapacity = Number(batch.max_students) || 30;
  const currentCount = batchStudents.length;
  const duration = calculateBatchDurationInfo(batch.start_date, batch.end_date, batch.duration_days);
  const extensions = Array.isArray(batch.extension_history) ? batch.extension_history : [];
  const totalDaysExtended = extensions.reduce((sum, item) => sum + (Number(item.daysAdded) || 0), 0);

  // Filter available students for assign modal
  const filteredStudentsForAssign = allStudents.filter(s => {
    const q = assignSearch.toLowerCase();
    const name = (s.name || '').toLowerCase();
    const email = (s.email || '').toLowerCase();
    const roll = (s.rollNumber || s.id || '').toLowerCase();
    return name.includes(q) || email.includes(q) || roll.includes(q);
  });

  return (
    <div style={{ padding: '4px 0' }} className="animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24, right: 24,
          background: '#121118', color: '#fff',
          borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, zIndex: 2000,
          boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle size={15} color="#10B981" /> {toast}
        </div>
      )}

      {/* Back Button & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/admin?tab=batches', { state: { tab: 'batches' } })}
            style={{
              background: '#FFF', border: '1.5px solid var(--border-color)',
              borderRadius: 12, padding: '8px 14px', fontSize: 13,
              fontWeight: 700, cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: 6, color: 'var(--text-primary)'
            }}
          >
            <ChevronLeft size={16} /> Back to Batches
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{batch.name}</h2>
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary-color)', background: 'var(--primary-light)', padding: '2px 8px', borderRadius: 6 }}>
                {batch.code || 'BAT-001'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
              Course: <strong>{batch.course_name}</strong> · Instructor: <strong>{batch.trainer_name}</strong>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            className="batch-extend-btn-highlight"
            onClick={handleOpenExtendModal}
            title="Extend batch duration or adjust daily timing"
          >
            <FastForward size={15} /> Extend Batch
          </button>

          <button className="btn btn-primary" onClick={openAssignModal}>
            <UserPlus size={16} /> Assign Students
          </button>
        </div>
      </div>

      {/* BATCH INFORMATION CARD */}
      <div style={{
        background: '#FFF', border: '1.5px solid var(--border-color)',
        borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)',
        marginBottom: 24
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color="var(--primary-color)" /> Batch Information & Duration Status
          </h3>
          {totalDaysExtended > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 8, padding: '4px 10px', fontSize: 12, color: '#6D28D9', fontWeight: 700 }}>
              <Sparkles size={13} color="#7C3AED" /> Extended +{totalDaysExtended} Days ({extensions.length} extension{extensions.length === 1 ? '' : 's'})
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>COURSE</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{batch.course_name || 'Fullstack Engineering'}</span>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>TRAINER / INSTRUCTOR</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{batch.trainer_name || 'Assigned Instructor'}</span>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>DAILY CLASS TIMING</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Clock size={14} /> {batch.timing || '10:00 AM - 12:00 PM'}
            </span>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>BATCH STATUS</span>
            <span style={{
              fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, display: 'inline-block', marginTop: 2,
              background: duration.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
              color: duration.isActive ? '#10B981' : '#F59E0B'
            }}>
              {duration.isActive ? `Active · Day ${duration.currentDay} of ${duration.totalDays}` : (duration.isExpired ? 'Duration Ended' : 'Upcoming')}
            </span>
          </div>

          <div style={{ background: 'var(--surface-alt)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block' }}>STUDENTS ENROLLED</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary-color)' }}>
              {currentCount} / {maxCapacity}
            </span>
          </div>
        </div>

        {/* Live Duration Tracking Banner */}
        <div className="batch-duration-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>
              Duration Lifecycle: Day {duration.currentDay} of {duration.totalDays} Days ({duration.progressPercent}% Elapsed)
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: duration.isExpired ? '#DC2626' : '#059669' }}>
              {duration.daysNotice}
            </span>
          </div>

          <div className="batch-duration-track">
            <div
              className={`batch-duration-fill ${duration.isExpired ? 'completed' : (duration.isUpcoming ? 'upcoming' : 'active')}`}
              style={{ width: `${duration.progressPercent}%` }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
            <span>Start Date: <strong style={{ color: 'var(--text-secondary)' }}>{duration.startDateReadable}</strong></span>
            <span>Allotted Duration: <strong style={{ color: 'var(--text-secondary)' }}>{duration.totalDays} Days</strong></span>
            <span>End Date: <strong style={{ color: 'var(--text-secondary)' }}>{duration.endDateReadable}</strong></span>
          </div>
        </div>
      </div>

      {/* STUDENTS IN THIS BATCH TABLE */}
      <div style={{
        background: '#FFF', border: '1.5px solid var(--border-color)',
        borderRadius: 20, padding: 24, boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--primary-color)" /> Students Enrolled in this Batch ({batchStudents.length})
          </h3>
        </div>

        {studentsLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading roster...</div>
        ) : batchStudents.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', background: 'var(--surface-alt)', borderRadius: 14 }}>
            <Users size={32} color="var(--text-tertiary)" style={{ marginBottom: 8 }} />
            <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-secondary)' }}>No students assigned to this batch yet.</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={openAssignModal}>
              <UserPlus size={14} /> Assign Students Now
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px' }}>Student</th>
                  <th style={{ padding: '12px 14px' }}>Student ID</th>
                  <th style={{ padding: '12px 14px' }}>Course</th>
                  <th style={{ padding: '12px 14px' }}>Fee Status</th>
                  <th style={{ padding: '12px 14px' }}>Account Status</th>
                  <th style={{ padding: '12px 14px' }}>Attendance %</th>
                  <th style={{ padding: '12px 14px' }}>Activity Pts</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batchStudents.map((s) => {
                  const photo = s.profilePhotoUrl || s.profile_pic || '';
                  const sName = s.name || 'Unnamed Student';
                  const attPct = typeof s.attendance === 'object' ? (s.attendance?.percentage ?? 0) : (typeof s.attendance === 'number' ? s.attendance : 0);
                  const pts = s.activityPoints || 0;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                            background: 'var(--primary-light)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0
                          }}>
                            {photo ? (
                              <img src={photo} alt={sName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontWeight: 800, color: 'var(--primary-color)', fontSize: 14 }}>
                                {(sName)[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/admin/students/${s.id}`}
                              style={{ fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none' }}
                            >
                              {sName}
                            </Link>
                            <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-secondary)' }}>{s.email || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {s.rollNumber || s.id}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {s.course || batch.course_name || 'Fullstack Engineering'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                          background: s.feesStatus === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                          color: s.feesStatus === 'Paid' ? '#10B981' : '#F59E0B'
                        }}>
                          {s.feesStatus || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 6, textTransform: 'capitalize',
                          background: s.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: s.status === 'active' ? '#10B981' : '#EF4444'
                        }}>
                          {s.status || 'active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--primary-color)' }}>
                        {attPct}%
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#F59E0B' }}>
                        {pts} pts
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => navigate(`/admin/students/${s.id}`)}
                            title="View Details"
                            style={{ border: 'none', background: 'var(--surface-alt)', padding: 6, borderRadius: 6, cursor: 'pointer' }}
                          >
                            <Eye size={15} color="var(--primary-color)" />
                          </button>
                          <button
                            onClick={() => handleUnassignStudent(s.id, sName)}
                            title="Remove from Batch"
                            style={{ border: 'none', background: 'rgba(239,68,68,0.1)', padding: 6, borderRadius: 6, cursor: 'pointer' }}
                          >
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSIGN STUDENTS MODAL */}
      {showAssignModal && (
        <CustomModal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign Students to ${batch.name}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {errorMessage && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: 8, padding: 10, fontSize: 12.5, fontWeight: 600 }}>
                {errorMessage}
              </div>
            )}

            {/* Search */}
            <div className="search-bar-container" style={{ width: '100%' }}>
              <Search size={16} color="var(--text-tertiary)" />
              <input
                type="text"
                className="search-bar-input"
                placeholder="Search students by name, email, or roll..."
                value={assignSearch}
                onChange={(e) => setAssignSearch(e.target.value)}
              />
            </div>

            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
              Selected: <strong style={{ color: 'var(--primary-color)' }}>{selectedStudentIds.length}</strong> / {maxCapacity} capacity
            </p>

            {/* Student list checkboxes */}
            <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {filteredStudentsForAssign.map((st) => {
                const isSelected = selectedStudentIds.includes(st.id);
                return (
                  <label
                    key={st.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, background: isSelected ? 'var(--primary-light)' : 'var(--surface-alt)',
                      cursor: 'pointer', border: isSelected ? '1px solid var(--primary-border)' : '1px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCheckboxToggle(st.id)}
                        style={{ width: 16, height: 16, accentColor: 'var(--primary-color)' }}
                      />
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 13, display: 'block' }}>{st.name}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                          {st.course || 'No course'} • {st.batch_name ? `Current: ${st.batch_name}` : 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveAssignment} disabled={assigning}>
                {assigning ? 'Saving to Firestore...' : 'Assign Selected'}
              </button>
            </div>
          </div>
        </CustomModal>
      )}

      {/* EXTEND BATCH MODAL */}
      {showExtendModal && batch && (() => {
        const currentDuration = Number(batch.duration_days) || (batch.start_date && batch.end_date ? getDaysBetween(batch.start_date, batch.end_date) : 50);
        const today = formatLocalDate(new Date());
        const currentEnd = batch.end_date || today;
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
                      {batch.name} · <strong style={{ color: 'var(--primary-color)' }}>{batch.code}</strong>
                    </p>
                  </div>
                </div>
                <button className="modal-close-red" onClick={() => setShowExtendModal(false)} aria-label="Close modal">
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
                        <strong>{batch.course_name || 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current Duration</span>
                        <strong>{currentDuration} Days</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current End Date</span>
                        <strong style={{ color: isPast ? '#ef4444' : '#0f172a' }}>
                          {formatReadableDate(batch.end_date)} {isPast ? '(Ended)' : ''}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', display: 'block', fontSize: '11px' }}>Current Timing</span>
                        <strong>{batch.timing || '10:00 AM - 12:00 PM'}</strong>
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
                    onClick={() => setShowExtendModal(false)}
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
    </div>
  );
};

export default BatchDetailsPage;
