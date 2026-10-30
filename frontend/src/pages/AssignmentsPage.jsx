import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText, Download, ExternalLink, Calendar, Clock,
  CheckCircle, AlertCircle, RefreshCw, UploadCloud,
  Search, Filter, Sparkles, Award, FileCode, FileArchive,
  ChevronRight, ArrowRight, X, User, MessageSquare, AlertTriangle
} from 'lucide-react';
import { uploadUniversalFile, getDownloadUrl } from '../services/apiService';
import { submitAssignment as submitAssignmentToDb } from '../services/firebaseService';

const CATEGORY_COLORS = {
  'Capstone Project': { bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
  'Practical Lab': { bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE' },
  'Backend Microservice': { bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
  'Frontend Project': { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  'default': { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' },
};

export default function AssignmentsPage({
  batchAssignments = [],
  submissions = [],
  user = {},
  studentBatchId = '',
  studentBatchName = '',
  refetchAssignments,
  refetchSubmissions,
  showModal = () => {}
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'submitted' | 'approved' | 'revision'
  const [activeModalTask, setActiveModalTask] = useState(null);
  const [feedbackViewSubmission, setFeedbackViewSubmission] = useState(null);

  // Form states for submission modal
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Auto-refresh assignments and submissions on page load and every 1 minute
  useEffect(() => {
    refetchAssignments?.();
    refetchSubmissions?.();
    const timer = setInterval(() => {
      refetchAssignments?.();
      refetchSubmissions?.();
    }, 60000);
    return () => clearInterval(timer);
  }, [refetchAssignments, refetchSubmissions]);

  // Map submissions by assignmentId
  const submissionsMap = useMemo(() => {
    const map = {};
    (submissions || []).forEach(sub => {
      const aId = String(sub.assignmentId || sub.assignment_id || '');
      if (aId) map[aId] = sub;
    });
    return map;
  }, [submissions]);

  // Combined statistics
  const stats = useMemo(() => {
    const total = batchAssignments.length;
    let approved = 0;
    let submitted = 0;
    let revision = 0;
    let totalScore = 0;
    let gradedCount = 0;

    batchAssignments.forEach(asg => {
      const sub = submissionsMap[asg.id];
      if (sub) {
        const st = String(sub.status || '').toLowerCase();
        if (st === 'approved' || st === 'accepted') {
          approved++;
          if (typeof sub.marks === 'number') {
            totalScore += (sub.marks / (sub.totalMarks || asg.totalMarks || 100)) * 100;
            gradedCount++;
          }
        } else if (st === 'changes requested' || st === 'revision') {
          revision++;
        } else {
          submitted++;
        }
      }
    });

    const pending = Math.max(0, total - (approved + submitted + revision));
    const avgScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : (approved > 0 ? 100 : 0);

    return { total, approved, submitted, revision, pending, avgScore };
  }, [batchAssignments, submissionsMap]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return batchAssignments.filter(asg => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        asg.title?.toLowerCase().includes(q) ||
        asg.description?.toLowerCase().includes(q) ||
        asg.category?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const sub = submissionsMap[asg.id];
      const subStatus = sub ? String(sub.status || '').toLowerCase() : 'not_submitted';

      if (statusFilter === 'all') return true;
      if (statusFilter === 'pending') return !sub;
      if (statusFilter === 'submitted') return sub && subStatus !== 'approved' && subStatus !== 'changes requested';
      if (statusFilter === 'approved') return sub && (subStatus === 'approved' || subStatus === 'accepted');
      if (statusFilter === 'revision') return sub && subStatus === 'changes requested';
      return true;
    });
  }, [batchAssignments, searchQuery, statusFilter, submissionsMap]);

  // Open submission modal
  const openSubmissionModal = (assignment) => {
    const existing = submissionsMap[assignment.id];
    setActiveModalTask(assignment);
    setSubmissionFile(null);
    setSubmissionUrl(existing?.submissionUrl || '');
    setSubmissionNotes(existing?.notes || '');
  };

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 250 * 1024 * 1024) {
      showModal('File Too Large', 'Maximum file upload size is 250 MB.', 'warning');
      return;
    }
    setSubmissionFile(file);
  };

  // Submit project solution
  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!activeModalTask) return;

    const existing = submissionsMap[activeModalTask.id];
    const hasExistingFile = Boolean(existing?.fileUrl);

    if (!submissionFile && !submissionUrl.trim() && !hasExistingFile) {
      showModal(
        'Upload Required',
        'Please upload your project file (ZIP, PDF, code file) or provide a repository/demo link.',
        'warning'
      );
      return;
    }

    setIsUploading(true);
    setUploadProgressText('Processing submission...');

    try {
      let fileData = null;
      if (submissionFile) {
        setUploadProgressText(`Uploading ${submissionFile.name} (${(submissionFile.size / (1024 * 1024)).toFixed(2)} MB)...`);
        fileData = await uploadUniversalFile(submissionFile, 'submissions');
      }

      const payload = {
        assignmentId: activeModalTask.id,
        assignmentTitle: activeModalTask.title,
        studentId: user?.id || user?.uid || '',
        studentName: user?.name || user?.fullName || 'Student',
        studentRoll: user?.rollNumber || user?.roll_number || 'LVX',
        studentEmail: user?.email || '',
        batch_id: studentBatchId || user?.batch_id || activeModalTask.batch_id || '',
        batch_name: studentBatchName || user?.batch_name || activeModalTask.batch_name || '',
        submissionUrl: submissionUrl.trim() || existing?.submissionUrl || '',
        notes: submissionNotes.trim() || existing?.notes || '',
        fileUrl: fileData?.url || existing?.fileUrl || null,
        fileName: fileData?.originalName || fileData?.fileName || existing?.fileName || null,
        fileSize: fileData?.sizeDisplay || existing?.fileSize || null,
        fileType: fileData?.fileType || existing?.fileType || null,
        status: 'Submitted', // Awaiting faculty review
        submittedAt: new Date().toISOString(),
        totalMarks: activeModalTask.totalMarks || 100,
      };

      setUploadProgressText('Recording submission...');
      await submitAssignmentToDb(payload);

      showModal(
        'Assignment Submitted! 🎉',
        `Your solution for "${activeModalTask.title}" has been uploaded successfully. Your faculty instructor and admin will review your code and assign your grade.`,
        'success'
      );

      setActiveModalTask(null);
      setSubmissionFile(null);
      setSubmissionUrl('');
      setSubmissionNotes('');

      if (refetchAssignments) refetchAssignments();
      if (refetchSubmissions) refetchSubmissions();
    } catch (err) {
      console.error('[AssignmentSubmit] Error:', err);
      showModal('Submission Failed', err.message || 'Could not complete upload. Please try again.', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
      {/* ── TOP HERO BANNER (CLEAN MODERN WHITE/LIGHT BLUE PALETTE) ── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        padding: '24px 28px',
        color: '#0F172A',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: '#EEF2FF',
              border: '1px solid #C7D2FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={24} color="#4F46E5" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A', letterSpacing: -0.3 }}>
                  Assignments & Capstone Projects
                </h2>
                <span style={{
                  fontSize: 11,
                  fontWeight: 800,
                  background: '#EEF2FF',
                  color: '#4338CA',
                  border: '1px solid #C7D2FE',
                  padding: '3px 9px',
                  borderRadius: 999,
                  letterSpacing: 0.3
                }}>
                  {studentBatchName ? `Batch: ${studentBatchName}` : 'All Assigned Tasks'}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B', maxWidth: 620 }}>
                Review project briefs, download PDF specifications, complete implementation, and upload your ZIP or code packages for faculty grading.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (refetchAssignments) refetchAssignments();
              if (refetchSubmissions) refetchSubmissions();
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              color: '#334155',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <RefreshCw size={14} /> Refresh Tasks
          </button>
        </div>

        {/* METRICS ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid #F1F5F9'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>TOTAL ASSIGNED</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: '#0F172A' }}>{stats.total}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>APPROVED / GRADED</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: '#059669' }}>{stats.approved}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>UNDER REVIEW</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: '#D97706' }}>{stats.submitted}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>PENDING ACTION</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: '#DC2626' }}>{stats.pending}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>OVERALL GRADE</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: '#4F46E5' }}>{stats.avgScore}%</div>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH CONTROLS ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14,
        background: '#FFFFFF',
        padding: '14px 18px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        {/* Status Pill Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All Tasks (${stats.total})` },
            { id: 'pending', label: `Pending (${stats.pending})` },
            { id: 'submitted', label: `Under Review (${stats.submitted})` },
            { id: 'approved', label: `Approved (${stats.approved})` },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === tab.id ? '#2563EB' : '#F1F5F9',
                color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 34px',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              fontSize: 12.5,
              outline: 'none',
              background: '#F8FAFC'
            }}
          />
        </div>
      </div>

      {/* ── ASSIGNMENTS LIST / GRID ────────────────────────────────────── */}
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
          <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
            {searchQuery ? 'No tasks matched your search query.' : 'There are no tasks assigned to your batch yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filteredAssignments.map((asg) => {
            const submission = submissionsMap[asg.id];
            const isApproved = submission && (String(submission.status).toLowerCase() === 'approved' || String(submission.status).toLowerCase() === 'accepted');
            const isUnderReview = submission && !isApproved && String(submission.status).toLowerCase() !== 'changes requested';
            const isChangesRequested = submission && String(submission.status).toLowerCase() === 'changes requested';
            const isPending = !submission;

            const categoryStyle = CATEGORY_COLORS[asg.category] || CATEGORY_COLORS['default'];
            const downloadUrl = asg.fileUrl ? getDownloadUrl(asg.fileUrl, asg.fileName || `${asg.title}.pdf`) : null;

            return (
              <div
                key={asg.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: isApproved ? '1.5px solid #A7F3D0' : isUnderReview ? '1.5px solid #FDE68A' : '1px solid #E2E8F0',
                  boxShadow: isApproved ? '0 4px 18px rgba(16, 185, 129, 0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
                  padding: 22,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
              >
                <div>
                  {/* Top Badges Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: categoryStyle.bg,
                        color: categoryStyle.text,
                        border: `1px solid ${categoryStyle.border}`
                      }}>
                        {asg.category || 'Practical Project'}
                      </span>
                      <span style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 6,
                        background: '#F1F5F9',
                        color: '#475569'
                      }}>
                        Batch: {asg.batch_name || studentBatchName || 'All'}
                      </span>
                    </div>

                    {/* Status Pill */}
                    {isApproved ? (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#047857',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        padding: '3px 9px',
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <CheckCircle size={12} color="#059669" /> Approved ({submission.marks ?? 100}/{asg.totalMarks || 100})
                      </span>
                    ) : isUnderReview ? (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#B45309',
                        background: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        padding: '3px 9px',
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <Clock size={12} color="#D97706" /> In Review
                      </span>
                    ) : isChangesRequested ? (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#DC2626',
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                        padding: '3px 9px',
                        borderRadius: 999,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <AlertTriangle size={12} color="#EF4444" /> Revision Needed
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#2563EB',
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        padding: '3px 9px',
                        borderRadius: 999
                      }}>
                        Pending Submission
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#0F172A', margin: '0 0 6px', lineHeight: 1.35 }}>
                    {asg.title}
                  </h3>

                  <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, margin: '0 0 14px' }}>
                    {asg.description}
                  </p>

                  {/* Due Date & Creator Info Box */}
                  <div style={{
                    background: '#F8FAFC',
                    borderRadius: 12,
                    padding: '10px 12px',
                    border: '1px solid #F1F5F9',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    fontSize: 11.5,
                    color: '#475569',
                    marginBottom: 14
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={13} color="#2563EB" />
                      <span>Due: <strong style={{ color: '#0F172A' }}>{asg.dueDate || 'Open'}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Award size={13} color="#D97706" />
                      <span>Marks: <strong style={{ color: '#0F172A' }}>{asg.totalMarks || 100} Pts</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: 'span 2' }}>
                      <User size={13} color="#64748B" />
                      <span>Assigned by: <strong style={{ color: '#0F172A' }}>{asg.createdBy || 'Course Instructor'}</strong> ({asg.creatorRole || 'Faculty'})</span>
                    </div>
                  </div>

                  {/* Attached Specification Document (PDF/DOCX) */}
                  {asg.fileUrl && (
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: '#F0F9FF',
                      border: '1px solid #BAE6FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      marginBottom: 14
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: '#0284C7',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <FileText size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 750, color: '#0369A1', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {asg.fileName || 'Project_Brief_Specification.pdf'}
                          </span>
                          <span style={{ fontSize: 10.5, color: '#0284C7' }}>
                            {asg.fileSize || 'Attached Briefing Document'}
                          </span>
                        </div>
                      </div>

                      <a
                        href={downloadUrl}
                        download={asg.fileName || 'assignment_spec.pdf'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          background: '#0284C7',
                          color: '#FFFFFF',
                          padding: '6px 12px',
                          borderRadius: 8,
                          fontSize: 11.5,
                          fontWeight: 700,
                          textDecoration: 'none',
                          boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
                          flexShrink: 0
                        }}
                      >
                        <Download size={13} />
                        Download PDF
                      </a>
                    </div>
                  )}

                  {/* If Approved or Graded: Show Feedback Box */}
                  {isApproved && (
                    <div style={{
                      padding: '12px 14px',
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      borderRadius: 12,
                      marginBottom: 12,
                      fontSize: 12
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontWeight: 800, color: '#065F46' }}>
                          Score: {submission.marks ?? 100} / {asg.totalMarks || 100} ({submission.grade || 'A+'})
                        </span>
                        <span style={{ fontSize: 10.5, color: '#047857' }}>
                          Reviewed by {submission.reviewedBy || 'Trainer'}
                        </span>
                      </div>
                      {submission.feedback && (
                        <p style={{ margin: '4px 0 0', color: '#047857', fontStyle: 'italic', lineHeight: 1.45 }}>
                          "{submission.feedback}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* If Submission Under Review: Show details */}
                  {isUnderReview && (
                    <div style={{
                      padding: '10px 14px',
                      background: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: 12,
                      marginBottom: 12,
                      fontSize: 11.5,
                      color: '#92400E'
                    }}>
                      <span>Submitted on {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'recently'}. Solution is queued for faculty grading.</span>
                    </div>
                  )}
                </div>

                {/* Bottom Action Buttons */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 14 }}>
                  {submission?.fileUrl && (
                    <a
                      href={getDownloadUrl(submission.fileUrl, submission.fileName || 'my_submission.zip')}
                      download={submission.fileName || 'my_submission.zip'}
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        textDecoration: 'none'
                      }}
                      title="Download your previously submitted work"
                    >
                      <Download size={13} />
                      My File
                    </a>
                  )}

                  {submission?.submissionUrl && (
                    <a
                      href={submission.submissionUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: '9px 12px',
                        borderRadius: 10,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: '#F1F5F9',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        textDecoration: 'none'
                      }}
                      title="Open submitted project link"
                    >
                      <ExternalLink size={13} />
                      Repo / Demo
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => openSubmissionModal(asg)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      borderRadius: 10,
                      fontWeight: 750,
                      fontSize: 12.5,
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: isApproved
                        ? '#F1F5F9'
                        : isUnderReview
                        ? '#FEF3C7'
                        : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: isApproved ? '#334155' : isUnderReview ? '#92400E' : '#FFFFFF',
                      boxShadow: (!isApproved && !isUnderReview) ? '0 4px 12px rgba(37, 99, 235, 0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <UploadCloud size={15} />
                    {isApproved ? 'Resubmit Solution' : isUnderReview ? 'Update Submission' : 'Submit Solution'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── SUBMISSION MODAL ───────────────────────────────────────────── */}
      {activeModalTask && (
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
            maxWidth: 580,
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#F8FAFC'
            }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#2563EB' }}>
                  Project Submission Portal
                </span>
                <h3 style={{ margin: '2px 0 0', fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                  {activeModalTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTask(null)}
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

            {/* Modal Body */}
            <form onSubmit={handleSubmitSolution} style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Task Brief reminder */}
              <div style={{ padding: '10px 14px', background: '#EFF6FF', borderRadius: 10, border: '1px solid #BFDBFE', fontSize: 12, color: '#1E40AF' }}>
                Total Points: <strong>{activeModalTask.totalMarks || 100} Pts</strong> • Due Date: <strong>{activeModalTask.dueDate || 'None'}</strong>
              </div>

              {/* 1. File Upload Dropzone (ZIP, RAR, PDF, code files) */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#334155', marginBottom: 6 }}>
                  Upload Project File / Archive <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <div style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: 14,
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: submissionFile ? '#F0FDF4' : '#F8FAFC',
                  borderColor: submissionFile ? '#86EFAC' : '#CBD5E1',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: submissionFile ? '#DCFCE7' : '#EFF6FF',
                      color: submissionFile ? '#16A34A' : '#2563EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <UploadCloud size={24} />
                    </div>
                    {submissionFile ? (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>
                          ✓ {submissionFile.name}
                        </div>
                        <div style={{ fontSize: 11, color: '#16A34A' }}>
                          {(submissionFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          Drag & drop or browse project file
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>
                          Supports ZIP, RAR, TAR, PDF, DOCX, IPYNB, PY, JS, HTML & more (up to 250 MB)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Project Link / Repo (optional) */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#334155', marginBottom: 6 }}>
                  Live Web Demo / GitHub Repository URL <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>(Optional)</span>
                </label>
                <input
                  type="url"
                  placeholder="https://github.com/username/project or https://myproject.vercel.app"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 12.5,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 3. Student Notes / Reflection */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 750, color: '#334155', marginBottom: 6 }}>
                  Student Notes & How to Run / Test
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your implementation approach, key algorithms used, accuracy or test metrics, and instructions to run your project..."
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 12.5,
                    outline: 'none',
                    resize: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Progress message if uploading */}
              {isUploading && (
                <div style={{
                  padding: '10px 14px',
                  background: '#EEF2FF',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 650,
                  color: '#4338CA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>{uploadProgressText}</span>
                </div>
              )}

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveModalTask(null)}
                  disabled={isUploading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 750,
                    cursor: isUploading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <UploadCloud size={15} />
                  {isUploading ? 'Uploading & Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
