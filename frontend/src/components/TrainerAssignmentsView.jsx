import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText, Plus, Download, ExternalLink, Calendar,
  Clock, CheckCircle, AlertCircle, Trash2, Pencil,
  UploadCloud, Search, Award, User, RefreshCw, X,
  Check, AlertTriangle, Eye, ArrowRight
} from 'lucide-react';
import { getDocuments, addDocument, updateDocumentFields, deleteDocument } from '../services/firebaseService';
import { uploadUniversalFile, getDownloadUrl } from '../services/apiService';
import CustomModal from './Modal';

export default function TrainerAssignmentsView({
  batches = [],
  students = [],
  trainerUid = '',
  trainerName = 'Faculty Trainer',
  showToast = () => {},
  isAdmin = false
}) {
  const queryClient = useQueryClient();
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [reviewingAssignment, setReviewingAssignment] = useState(null);

  // Create Assignment Form State
  const [asgTitle, setAsgTitle] = useState('');
  const [asgBatchId, setAsgBatchId] = useState('');
  const [asgCategory, setAsgCategory] = useState('Capstone Project');
  const [asgDueDate, setAsgDueDate] = useState('');
  const [asgTotalMarks, setAsgTotalMarks] = useState(100);
  const [asgDescription, setAsgDescription] = useState('');
  const [asgBriefFile, setAsgBriefFile] = useState(null);
  const [isSavingAsg, setIsSavingAsg] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Submissions Grading Form State (inside review drawer)
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState(null);
  const [gradeMarks, setGradeMarks] = useState(100);
  const [gradeLetter, setGradeLetter] = useState('A+');
  const [gradeStatus, setGradeStatus] = useState('Approved');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // Fetch all assignments
  const { data: allAssignments = [], isLoading: loadingAsg, refetch: refetchAsg } = useQuery({
    queryKey: ['trainerAssignmentsData'],
    queryFn: () => getDocuments('assignments'),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // Fetch all submissions
  const { data: allSubmissions = [], isLoading: loadingSub, refetch: refetchSub } = useQuery({
    queryKey: ['trainerSubmissionsData'],
    queryFn: () => getDocuments('submissions'),
    staleTime: 1000 * 30,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  const assignedBatchIds = useMemo(() => new Set(batches.map(b => String(b.id || b.uid))), [batches]);

  // Filter assignments for this trainer's assigned batches, or all if admin
  const trainerAssignments = useMemo(() => {
    return allAssignments.filter(a => {
      if (isAdmin) return true;
      const bId = String(a.batch_id || a.batchId || '');
      if (bId === 'all') return true;
      if (assignedBatchIds.has(bId)) return true;
      if (a.createdBy && a.createdBy.toLowerCase() === trainerName.toLowerCase()) return true;
      return false;
    });
  }, [allAssignments, assignedBatchIds, trainerName, isAdmin]);

  // Group submissions by assignmentId
  const submissionsByAsg = useMemo(() => {
    const map = {};
    allSubmissions.forEach(sub => {
      const aId = String(sub.assignmentId || sub.assignment_id || '');
      if (!map[aId]) map[aId] = [];
      map[aId].push(sub);
    });
    return map;
  }, [allSubmissions]);

  // Filtered view by batch and search query
  const filteredAssignments = useMemo(() => {
    return trainerAssignments.filter(a => {
      if (selectedBatchFilter !== 'all' && String(a.batch_id) !== String(selectedBatchFilter)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [trainerAssignments, selectedBatchFilter, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    const totalTasks = trainerAssignments.length;
    let totalSubs = 0;
    let pendingReviews = 0;
    let approvedSubs = 0;

    trainerAssignments.forEach(asg => {
      const subs = submissionsByAsg[asg.id] || [];
      totalSubs += subs.length;
      subs.forEach(s => {
        const st = String(s.status || '').toLowerCase();
        if (st === 'approved' || st === 'accepted') approvedSubs++;
        else pendingReviews++;
      });
    });

    return { totalTasks, totalSubs, pendingReviews, approvedSubs };
  }, [trainerAssignments, submissionsByAsg]);

  // Reset create form
  const resetForm = () => {
    setAsgTitle('');
    setAsgBatchId(batches[0]?.id || '');
    setAsgCategory('Capstone Project');
    setAsgDueDate('');
    setAsgTotalMarks(100);
    setAsgDescription('');
    setAsgBriefFile(null);
    setEditingAssignment(null);
  };

  // Open Edit Task Modal
  const openEditModal = (asg) => {
    setEditingAssignment(asg);
    setAsgTitle(asg.title || '');
    setAsgBatchId(asg.batch_id || batches[0]?.id || '');
    setAsgCategory(asg.category || 'Capstone Project');
    setAsgDueDate(asg.dueDate || '');
    setAsgTotalMarks(asg.totalMarks || 100);
    setAsgDescription(asg.description || '');
    setAsgBriefFile(null);
    setShowCreateModal(true);
  };

  // Handle Save Assignment (Create or Edit)
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!asgTitle || !asgBatchId) {
      alert('Title and Target Batch are required.');
      return;
    }

    setIsSavingAsg(true);
    setUploadProgressText('Processing task specification...');

    try {
      const isGlobal = asgBatchId === 'all';
      const selectedBatch = isGlobal ? null : batches.find(b => String(b.id) === String(asgBatchId));
      let uploadedFile = null;

      if (asgBriefFile) {
        setUploadProgressText(`Uploading ${asgBriefFile.name} (${(asgBriefFile.size / (1024 * 1024)).toFixed(2)} MB)...`);
        uploadedFile = await uploadUniversalFile(asgBriefFile, 'assignments');
      }

      const payload = {
        title: asgTitle.trim(),
        batch_id: asgBatchId,
        batch_name: isGlobal ? 'All Batches' : (selectedBatch?.name || 'Batch'),
        category: asgCategory,
        dueDate: asgDueDate || '',
        totalMarks: Number(asgTotalMarks) || 100,
        description: asgDescription.trim(),
        createdBy: isAdmin ? 'Administrator' : trainerName,
        creatorRole: isAdmin ? 'admin' : 'trainer',
        creatorId: trainerUid || (isAdmin ? 'admin' : ''),
        fileUrl: uploadedFile?.url || editingAssignment?.fileUrl || null,
        fileName: uploadedFile?.originalName || uploadedFile?.fileName || editingAssignment?.fileName || null,
        fileSize: uploadedFile?.sizeDisplay || editingAssignment?.fileSize || null,
        fileType: uploadedFile?.fileType || editingAssignment?.fileType || null,
        updatedAt: new Date().toISOString(),
      };

      if (editingAssignment) {
        await updateDocumentFields('assignments', editingAssignment.id, payload);
        showToast('Assignment updated successfully ✓');
      } else {
        payload.createdAt = new Date().toISOString();
        await addDocument('assignments', payload);
        showToast('New assignment created & broadcasted to students ✓');
      }

      setShowCreateModal(false);
      resetForm();
      refetchAsg();
      queryClient.invalidateQueries({ queryKey: ['trainerAssignmentsData'] });
    } catch (err) {
      console.error('[TrainerAssignment] Save error:', err);
      alert('Failed to save assignment: ' + err.message);
    } finally {
      setIsSavingAsg(false);
      setUploadProgressText('');
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (asgId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? Existing submissions will remain recorded.')) return;
    try {
      await deleteDocument('assignments', asgId);
      showToast('Assignment deleted ✓');
      refetchAsg();
    } catch (err) {
      console.error(err);
      alert('Failed to delete: ' + err.message);
    }
  };

  // Open Submissions Review Drawer
  const openSubmissionsReview = (asg) => {
    setReviewingAssignment(asg);
    setSelectedSubmissionToGrade(null);
  };

  // Select Submission to Grade
  const handleSelectSubmissionToGrade = (sub) => {
    setSelectedSubmissionToGrade(sub);
    setGradeMarks(sub.marks !== undefined ? sub.marks : (reviewingAssignment?.totalMarks || 100));
    setGradeLetter(sub.grade || 'A+');
    setGradeStatus(sub.status || 'Approved');
    setGradeFeedback(sub.feedback || '');
  };

  // Save Student Grade
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmissionToGrade) return;

    setIsSavingGrade(true);
    try {
      const payload = {
        marks: Number(gradeMarks),
        grade: gradeLetter,
        status: gradeStatus,
        feedback: gradeFeedback.trim(),
        reviewedBy: trainerName,
        reviewedAt: new Date().toISOString(),
        totalMarks: reviewingAssignment?.totalMarks || 100,
      };

      await updateDocumentFields('submissions', selectedSubmissionToGrade.id, payload);
      showToast(`Grade saved & notification sent to ${selectedSubmissionToGrade.studentName} ✓`);

      setSelectedSubmissionToGrade(null);
      refetchSub();
      queryClient.invalidateQueries({ queryKey: ['trainerSubmissionsData'] });
    } catch (err) {
      console.error('[SaveGrade] Error:', err);
      alert('Failed to save evaluation: ' + err.message);
    } finally {
      setIsSavingGrade(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── TOP STATS BAR ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16
      }}>
        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Assigned Tasks</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{stats.totalTasks}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Across your assigned batches</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Submissions Received</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>{stats.totalSubs}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Student solution uploads</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Awaiting Review</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>{stats.pendingReviews}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Ready for grading & critique</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 16, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Graded & Approved</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{stats.approvedSubs}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Completed evaluations</div>
        </div>
      </div>

      {/* ── CONTROLS ROW ─────────────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        padding: '16px 20px',
        border: '1px solid #E2E8F0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Batch Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#475569' }}>Batch:</span>
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: '1px solid #CBD5E1',
                fontSize: 12.5,
                fontWeight: 650,
                outline: 'none',
                background: '#F8FAFC',
                color: '#1E293B'
              }}
            >
              <option value="all">All My Batches ({trainerAssignments.length})</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px 7px 30px',
                borderRadius: 999,
                border: '1px solid #CBD5E1',
                fontSize: 12,
                outline: 'none',
                background: '#F8FAFC'
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => { resetForm(); setShowCreateModal(true); }}
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            padding: '9px 18px',
            fontWeight: 750,
            fontSize: 13,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
          }}
        >
          <Plus size={16} /> Assign New Task
        </button>
      </div>

      {/* ── ASSIGNMENTS LIST ─────────────────────────────────────────── */}
      {filteredAssignments.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #E2E8F0'
        }}>
          <FileText size={48} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
          <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
            No Assignments Found
          </h4>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B' }}>
            Create your first capstone project or lab assignment for your assigned students.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            style={{ borderRadius: 999 }}
          >
            <Plus size={15} /> Assign First Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 18 }}>
          {filteredAssignments.map((asg) => {
            const subs = submissionsByAsg[asg.id] || [];
            const pendingCount = subs.filter(s => {
              const st = String(s.status || '').toLowerCase();
              return st !== 'approved' && st !== 'accepted';
            }).length;

            const downloadBriefUrl = asg.fileUrl ? getDownloadUrl(asg.fileUrl, asg.fileName || 'spec.pdf') : null;

            return (
              <div
                key={asg.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  padding: 22,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  {/* Top Tags */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, background: '#EFF6FF', color: '#1D4ED8', padding: '3px 8px', borderRadius: 6 }}>
                        Batch: {asg.batch_name || 'All'}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: 6 }}>
                        {asg.category || 'Capstone Project'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(asg)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: '#F1F5F9',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#475569'
                        }}
                        title="Edit Task"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignment(asg.id)}
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: '50%',
                          background: '#FEE2E2',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#DC2626'
                        }}
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.35 }}>
                    {asg.title}
                  </h3>

                  <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: '0 0 12px' }}>
                    {asg.description}
                  </p>

                  {/* Meta pill row */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} color="#2563EB" /> Due: <strong>{asg.dueDate || 'Open'}</strong>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Award size={13} color="#D97706" /> Total: <strong>{asg.totalMarks || 100} Marks</strong>
                    </span>
                  </div>

                  {/* Attached Specification Document */}
                  {asg.fileUrl && (
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      marginBottom: 12,
                      fontSize: 11.5
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                        <FileText size={15} color="#0284C7" />
                        <span style={{ fontWeight: 700, color: '#0369A1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asg.fileName || 'Specification.pdf'}
                        </span>
                      </div>
                      <a
                        href={downloadBriefUrl}
                        download={asg.fileName || 'specification.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: '#0284C7',
                          fontWeight: 750,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0
                        }}
                      >
                        <Download size={12} /> Download
                      </a>
                    </div>
                  )}
                </div>

                {/* Bottom Row with Submissions Review Button */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 750,
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: pendingCount > 0 ? '#FEF3C7' : '#EFF6FF',
                      color: pendingCount > 0 ? '#92400E' : '#1D4ED8'
                    }}>
                      {subs.length} Submissions {pendingCount > 0 && `(${pendingCount} Pending Review)`}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openSubmissionsReview(asg)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 14px',
                      fontSize: 12.5,
                      fontWeight: 750,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <span>Review Work</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT ASSIGNMENT MODAL ──────────────────────────── */}
      {showCreateModal && (
        <CustomModal
          isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); resetForm(); }}
          title={editingAssignment ? 'Edit Task / Assignment' : 'Assign New Task / Capstone Project'}
        >
          <form onSubmit={handleSaveAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="form-label">Task Title *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. End-to-End Machine Learning Pipeline"
                value={asgTitle}
                onChange={e => setAsgTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Target Batch *</label>
                <select
                  className="form-select"
                  value={asgBatchId}
                  onChange={e => setAsgBatchId(e.target.value)}
                  required
                >
                  <option value="">-- Select Batch --</option>
                  <option value="all">All Batches (Global Academy Task)</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.course_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Task Category</label>
                <select
                  className="form-select"
                  value={asgCategory}
                  onChange={e => setAsgCategory(e.target.value)}
                >
                  <option value="Capstone Project">Capstone Project</option>
                  <option value="Practical Lab">Practical Lab</option>
                  <option value="Backend Microservice">Backend Microservice</option>
                  <option value="Frontend Project">Frontend Project</option>
                  <option value="Research & Case Study">Research & Case Study</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={asgDueDate}
                  onChange={e => setAsgDueDate(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Total Marks / Points</label>
                <input
                  type="number"
                  className="form-input"
                  value={asgTotalMarks}
                  onChange={e => setAsgTotalMarks(e.target.value)}
                  min="10"
                  max="500"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Detailed Brief & Requirements *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Provide project objectives, rubric, evaluation criteria, and instructions..."
                value={asgDescription}
                onChange={e => setAsgDescription(e.target.value)}
                style={{ resize: 'none' }}
                required
              />
            </div>

            {/* Attach Project Specification Document (PDF/DOCX/ZIP) */}
            <div>
              <label className="form-label">
                Attach Specification / Rubric File (PDF, DOCX, ZIP)
              </label>
              <div style={{
                border: '1.5px dashed #CBD5E1',
                borderRadius: 12,
                padding: '14px 16px',
                background: asgBriefFile ? '#F0FDF4' : '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <UploadCloud size={22} color={asgBriefFile ? '#16A34A' : '#64748B'} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {asgBriefFile ? asgBriefFile.name : (editingAssignment?.fileName || 'No briefing document attached yet')}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {asgBriefFile ? `${(asgBriefFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload` : 'PDF, Word, or ZIP file up to 250MB'}
                    </div>
                  </div>
                </div>

                <label style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  color: '#1E293B',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  Browse
                  <input
                    type="file"
                    onChange={e => setAsgBriefFile(e.target.files?.[0] || null)}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>

            {uploadProgressText && (
              <div style={{ fontSize: 12, color: '#2563EB', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={13} className="spin-animation" />
                <span>{uploadProgressText}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => { setShowCreateModal(false); resetForm(); }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingAsg}
                className="btn btn-primary"
              >
                {isSavingAsg ? 'Saving...' : (editingAssignment ? 'Save Changes' : 'Publish Assignment')}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* ── SUBMISSIONS REVIEW DRAWER / MODAL ───────────────────────── */}
      {reviewingAssignment && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            width: '100%',
            maxWidth: 900,
            maxHeight: '90vh',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              background: '#F8FAFC',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#2563EB' }}>
                  Submission Review Center • {reviewingAssignment.batch_name || 'Batch'}
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                  {reviewingAssignment.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setReviewingAssignment(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#E2E8F0',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body: Split View (Submissions Table on Left, Grading Panel on Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedSubmissionToGrade ? '1.2fr 1fr' : '1fr', flex: 1, overflowY: 'auto' }}>
              {/* Left Column: Submissions Roster */}
              <div style={{ padding: '20px 24px', borderRight: selectedSubmissionToGrade ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#1E293B' }}>
                    Student Submissions ({(submissionsByAsg[reviewingAssignment.id] || []).length})
                  </h4>
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    Click a student to view files and award marks
                  </span>
                </div>

                {(!submissionsByAsg[reviewingAssignment.id] || submissionsByAsg[reviewingAssignment.id].length === 0) ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
                    <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>No submissions yet</div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Students in this batch haven't uploaded their solutions yet.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {submissionsByAsg[reviewingAssignment.id].map(sub => {
                      const isGraded = String(sub.status || '').toLowerCase() === 'approved';
                      const isSelected = selectedSubmissionToGrade?.id === sub.id;
                      const subDownloadUrl = sub.fileUrl ? getDownloadUrl(sub.fileUrl, sub.fileName || 'submission.zip') : null;

                      return (
                        <div
                          key={sub.id}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 14,
                            background: isSelected ? '#EFF6FF' : '#FFFFFF',
                            border: isSelected ? '1.5px solid #3B82F6' : '1px solid #E2E8F0',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                                {sub.studentName}
                              </div>
                              <div style={{ fontSize: 11.5, color: '#64748B' }}>
                                Roll: {sub.studentRoll || 'LVX'} • Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Recent'}
                              </div>
                            </div>

                            <span style={{
                              fontSize: 11,
                              fontWeight: 800,
                              padding: '3px 8px',
                              borderRadius: 999,
                              background: isGraded ? '#ECFDF5' : '#FEF3C7',
                              color: isGraded ? '#059669' : '#B45309',
                              border: isGraded ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                            }}>
                              {isGraded ? `Approved (${sub.marks ?? 100}/${reviewingAssignment.totalMarks || 100})` : 'Awaiting Grade'}
                            </span>
                          </div>

                          {/* Student's files and links */}
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {sub.fileUrl && (
                              <a
                                href={subDownloadUrl}
                                download={sub.fileName || 'student_project.zip'}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  background: '#0284C7',
                                  color: '#FFFFFF',
                                  fontSize: 11.5,
                                  fontWeight: 750,
                                  textDecoration: 'none'
                                }}
                              >
                                <Download size={12} />
                                Download Project ({sub.fileName || 'ZIP File'})
                              </a>
                            )}

                            {sub.submissionUrl && (
                              <a
                                href={sub.submissionUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  background: '#F1F5F9',
                                  color: '#2563EB',
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  border: '1px solid #CBD5E1'
                                }}
                              >
                                <ExternalLink size={12} />
                                GitHub / Demo
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleSelectSubmissionToGrade(sub)}
                              style={{
                                marginLeft: 'auto',
                                padding: '6px 14px',
                                borderRadius: 8,
                                background: isSelected ? '#2563EB' : '#F1F5F9',
                                color: isSelected ? '#FFFFFF' : '#334155',
                                border: 'none',
                                fontSize: 12,
                                fontWeight: 750,
                                cursor: 'pointer'
                              }}
                            >
                              {isGraded ? 'Review / Re-grade' : 'Grade Solution ✍️'}
                            </button>
                          </div>

                          {sub.notes && (
                            <div style={{ fontSize: 11.5, color: '#475569', background: '#F8FAFC', padding: '6px 10px', borderRadius: 8, fontStyle: 'italic' }}>
                              Notes: "{sub.notes}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Grading Panel (visible when a student submission is selected) */}
              {selectedSubmissionToGrade && (
                <div style={{ padding: '20px 24px', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                      Evaluate: {selectedSubmissionToGrade.studentName}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedSubmissionToGrade(null)}
                      style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="form-label">Marks Awarded (out of {reviewingAssignment.totalMarks || 100}) *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={gradeMarks}
                          onChange={e => setGradeMarks(e.target.value)}
                          min="0"
                          max={reviewingAssignment.totalMarks || 100}
                          required
                        />
                      </div>

                      <div>
                        <label className="form-label">Grade</label>
                        <select
                          className="form-select"
                          value={gradeLetter}
                          onChange={e => setGradeLetter(e.target.value)}
                        >
                          <option value="A+">A+ (Exemplary)</option>
                          <option value="A">A (Excellent)</option>
                          <option value="B+">B+ (Very Good)</option>
                          <option value="B">B (Good)</option>
                          <option value="C">C (Pass)</option>
                          <option value="Needs Revision">Needs Revision</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label">Review Status</label>
                      <select
                        className="form-select"
                        value={gradeStatus}
                        onChange={e => setGradeStatus(e.target.value)}
                      >
                        <option value="Approved">Approved (Grade Finalized)</option>
                        <option value="Changes Requested">Changes Requested (Resubmit)</option>
                        <option value="Under Review">Under Review</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Faculty Feedback & Rubric Critique *</label>
                      <textarea
                        className="form-input"
                        rows={4}
                        placeholder="Provide detailed feedback on code quality, model accuracy, architectural decisions, and praise/improvements..."
                        value={gradeFeedback}
                        onChange={e => setGradeFeedback(e.target.value)}
                        style={{ resize: 'none' }}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingGrade}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: 6 }}
                    >
                      {isSavingGrade ? 'Saving Grade...' : 'Save Grade & Broadcast Notification'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
