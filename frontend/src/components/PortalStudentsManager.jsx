import React, { useState, useMemo } from 'react';
import {
  Users, BookOpen, Search, ArrowUpRight, GraduationCap,
  Calendar, CheckCircle2, Lock, ShieldCheck, Mail, Phone,
  RefreshCw, Sparkles, Filter, Pencil, Trash2, Key, AlertCircle, X, Check
} from 'lucide-react';
import { updateStudent, deleteDocument } from '../services/firebaseService';

export default function PortalStudentsManager({ allStudents = [], batches = [], refetchStudents, onEditStudent, onDeleteStudent }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferSuccessMsg, setTransferSuccessMsg] = useState('');
  const [transferErrorMsg, setTransferErrorMsg] = useState('');

  // Built-in Edit Student State
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    rollNumber: '',
    planName: '',
    expiresAt: '',
    status: 'active',
    feesStatus: 'Paid',
    password: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState('');

  // Built-in Delete Student State
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('');

  const handleOpenEdit = (st) => {
    setEditingStudent(st);
    const planName = st.membership?.planName || (st.membership?.planId === 'annual' ? 'Annual Membership' : 'Monthly Membership');
    const rawExp = st.membership?.expiresAt || st.accessExpiresAt || '';
    setEditForm({
      name: st.name || '',
      email: st.email || '',
      phone: st.phone || '',
      rollNumber: st.rollNumber || st.id || '',
      planName,
      expiresAt: rawExp ? rawExp.split('T')[0] : '',
      status: st.status || 'active',
      feesStatus: st.feesStatus || 'Paid',
      password: ''
    });
    setEditSuccessMsg('');
    setEditErrorMsg('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);
    setEditErrorMsg('');
    setEditSuccessMsg('');
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.toLowerCase().trim(),
        phone: editForm.phone.trim(),
        rollNumber: editForm.rollNumber.trim(),
        status: editForm.status,
        feesStatus: editForm.feesStatus,
        isDeactivated: editForm.status !== 'active'
      };
      if (editForm.expiresAt) {
        const expDate = new Date(editForm.expiresAt);
        expDate.setHours(23, 59, 59, 999);
        payload.accessExpiresAt = expDate.toISOString();
        payload.validUntil = expDate.toISOString();
        payload.membership = {
          ...(editingStudent.membership || {}),
          planName: editForm.planName,
          expiresAt: expDate.toISOString(),
          status: expDate.getTime() > Date.now() ? 'active' : 'expired'
        };
      }
      if (editForm.password && editForm.password.trim().length >= 6) {
        payload.password = editForm.password.trim();
        payload.tempPassword = editForm.password.trim();
      }
      await updateStudent(editingStudent.id, payload);
      setEditSuccessMsg('Student details updated successfully!');
      if (refetchStudents) refetchStudents();
      setTimeout(() => {
        setEditingStudent(null);
        setEditSuccessMsg('');
      }, 1000);
    } catch (err) {
      setEditErrorMsg(err.message || 'Failed to update student');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenDelete = (st) => {
    setDeletingStudent(st);
    setDeleteErrorMsg('');
  };

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    setDeleteErrorMsg('');
    try {
      const studentEmail = deletingStudent.email || '';
      await deleteDocument('students', deletingStudent.id, studentEmail ? { email: studentEmail } : {});
      if (refetchStudents) refetchStudents();
      setDeletingStudent(null);
    } catch (err) {
      setDeleteErrorMsg(err.message || 'Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // Filter students who belong to Portal Students batch
  const portalStudents = useMemo(() => {
    return allStudents.filter(s => {
      const bName = (s.batch || s.batch_name || '').toLowerCase();
      const bId = s.batch_id || '';
      return bName.includes('portal') || bId === 'batch_portal_students' || s.isPortalOnly;
    });
  }, [allStudents]);

  // Filtered by search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return portalStudents;
    const q = searchQuery.toLowerCase().trim();
    return portalStudents.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.rollNumber || s.id || '').toLowerCase().includes(q)
    );
  }, [portalStudents, searchQuery]);

  // Available live cohorts to transfer into (excluding portal students batch itself)
  const availableLiveBatches = useMemo(() => {
    return batches.filter(b => {
      const bName = (b.name || '').toLowerCase();
      return !bName.includes('portal') && b.id !== 'batch_portal_students';
    });
  }, [batches]);

  // Handle Batch Transfer
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !targetBatchId) return;

    const targetBatch = batches.find(b => String(b.id) === String(targetBatchId));
    if (!targetBatch) {
      setTransferErrorMsg('Please select a valid destination batch.');
      return;
    }

    setTransferring(true);
    setTransferErrorMsg('');
    setTransferSuccessMsg('');

    try {
      const payload = {
        batch: targetBatch.name,
        batch_name: targetBatch.name,
        batch_id: targetBatch.id,
        isPortalOnly: false,
        transferredAt: new Date().toISOString()
      };

      await updateStudent(selectedStudent.id, payload);

      setTransferSuccessMsg(
        `Successfully transferred ${selectedStudent.name} to "${targetBatch.name}"! All live classes, attendance, assignments, and cohort chat are now unlocked.`
      );

      if (refetchStudents) {
        refetchStudents();
      }

      setTimeout(() => {
        setSelectedStudent(null);
        setTargetBatchId('');
        setTransferSuccessMsg('');
      }, 2500);
    } catch (err) {
      setTransferErrorMsg('Failed to transfer student: ' + err.message);
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{ maxWidth: 650 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8
          }}>
            <BookOpen size={14} />
            <span>Dedicated Batch &bull; Portal Students</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
            Self-Paced Portal Enrolled Students
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 13.5, lineHeight: 1.5 }}>
            Students registered through the Levlox Academy Membership. These students have access to Python, Machine Learning, SQL and Project courses. Live classes, attendance, assignments, and batch announcements are locked unless transferred to a live cohort.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 14 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 12,
            padding: '12px 20px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#38BDF8' }}>
              {portalStudents.length}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Portal Students
            </div>
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexGrow: 1, maxWidth: 420 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input
              type="text"
              placeholder="Search by student name, email, roll number..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => refetchStudents && refetchStudents()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: '#F1F5F9', border: '1px solid #E2E8F0',
              padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
              color: '#334155', cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        border: '1px solid #E2E8F0'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700, fontSize: 12 }}>
                <th style={{ padding: '14px 18px' }}>STUDENT ID / ROLL NO</th>
                <th style={{ padding: '14px 18px' }}>STUDENT INFO</th>
                <th style={{ padding: '14px 18px' }}>MEMBERSHIP PLAN</th>
                <th style={{ padding: '14px 18px' }}>FEES / STATUS</th>
                <th style={{ padding: '14px 18px' }}>BATCH RESTRICTIONS</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
                    <BookOpen size={36} color="#CBD5E1" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#475569' }}>
                      No students found in Portal Students batch
                    </div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                      When learners complete payment on the Academy showcase page, they will appear here automatically.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => {
                  const planName = st.membership?.planName || (st.membership?.planId === 'annual' ? 'Annual Membership' : 'Monthly Membership');
                  const expiresAt = st.membership?.expiresAt || st.accessExpiresAt;
                  const expiryFormatted = expiresAt ? new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime';

                  return (
                    <tr key={st.id || st.uid} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1E293B', fontFamily: 'monospace' }}>
                        {st.rollNumber || st.id}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{st.name || 'Student'}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, marginTop: 3 }}>
                          <Mail size={12} /> {st.email}
                        </div>
                        {st.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 12, marginTop: 2 }}>
                            <Phone size={12} /> {st.phone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: '#2563EB' }}>{planName}</div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          Valid until: <span style={{ fontWeight: 600, color: '#0F172A' }}>{expiryFormatted}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          background: '#ECFDF5', color: '#059669',
                          padding: '3px 9px', borderRadius: 12, fontSize: 11.5, fontWeight: 700
                        }}>
                          <CheckCircle2 size={12} /> Paid
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: '#FEF3C7', color: '#B45309',
                          padding: '3px 8px', borderRadius: 6, fontSize: 11.5, fontWeight: 600
                        }}>
                          <Lock size={12} /> Live Classes & Attendance Locked
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => onEditStudent ? onEditStudent(st) : handleOpenEdit(st)}
                            title="Edit Student Profile"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#F1F5F9', color: '#1E293B',
                              border: '1px solid #CBD5E1', padding: '6px 11px', borderRadius: 8,
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Pencil size={13} color="#2563EB" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent ? onDeleteStudent(st) : handleOpenDelete(st)}
                            title="Delete Student Permanently"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#FEF2F2', color: '#DC2626',
                              border: '1px solid #FECACA', padding: '6px 11px', borderRadius: 8,
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(st);
                              setTargetBatchId(availableLiveBatches[0]?.id || '');
                              setTransferSuccessMsg('');
                              setTransferErrorMsg('');
                            }}
                            title="Move to Live Cohort Batch"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#2563EB', color: '#FFFFFF',
                              border: 'none', padding: '6px 12px', borderRadius: 8,
                              fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                            }}
                          >
                            <ArrowUpRight size={14} /> Move to Batch
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer to Live Batch Modal */}
      {selectedStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 18, maxWidth: 500, width: '100%',
            padding: '24px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
              Transfer Student to Live Cohort Batch
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Moving <strong>{selectedStudent.name}</strong> from <em>Portal Students</em> to a live cohort will immediately unlock live classes, cohort attendance, assignments, and cohort chat on their student portal.
            </p>

            {transferSuccessMsg && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
              }}>
                ✓ {transferSuccessMsg}
              </div>
            )}

            {transferErrorMsg && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B',
                padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
              }}>
                ⚠ {transferErrorMsg}
              </div>
            )}

            <form onSubmit={handleTransfer}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Select Destination Live Batch:
                </label>
                <select
                  value={targetBatchId}
                  onChange={e => setTargetBatchId(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF'
                  }}
                >
                  <option value="" disabled>-- Select a Live Cohort Batch --</option>
                  {availableLiveBatches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.course || b.course_name || 'Cohort'})
                    </option>
                  ))}
                </select>
                {availableLiveBatches.length === 0 && (
                  <p style={{ margin: '6px 0 0', fontSize: 11.5, color: '#DC2626' }}>
                    No other live batches found. Create one in Batch Management first.
                  </p>
                )}
              </div>

              <div style={{
                background: '#F8FAFC', padding: '12px 14px', borderRadius: 10,
                border: '1px solid #E2E8F0', marginBottom: 20, fontSize: 12, color: '#475569'
              }}>
                <div><strong>Student:</strong> {selectedStudent.name} ({selectedStudent.email})</div>
                <div><strong>Current Batch:</strong> Portal Students (Self-Paced Only)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  disabled={transferring}
                  style={{
                    background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 16px',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferring || !targetBatchId}
                  style={{
                    background: '#2563EB', border: 'none', padding: '9px 18px',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#FFFFFF',
                    cursor: transferring ? 'not-allowed' : 'pointer'
                  }}
                >
                  {transferring ? 'Transferring...' : 'Confirm Transfer & Unlock All'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT PORTAL STUDENT MODAL */}
      {editingStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 18, maxWidth: 540, width: '100%',
            padding: '24px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            position: 'relative', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pencil size={18} color="#2563EB" /> Edit Portal Student
              </h3>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {editSuccessMsg && (
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                ✓ {editSuccessMsg}
              </div>
            )}
            {editErrorMsg && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                ⚠ {editErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Full Name *</label>
                  <input
                    type="text" required
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Student / Roll ID</label>
                  <input
                    type="text"
                    value={editForm.rollNumber}
                    onChange={e => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Email Address *</label>
                  <input
                    type="email" required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Mobile Number</label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Account Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Payment / Fees Status</label>
                  <select
                    value={editForm.feesStatus}
                    onChange={e => setEditForm({ ...editForm, feesStatus: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending Payment">Pending Payment</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Access Expiration Date</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + 30);
                        setEditForm({ ...editForm, expiresAt: d.toISOString().split('T')[0] });
                      }}
                      style={{ fontSize: 11, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    >
                      +30 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setFullYear(d.getFullYear() + 1);
                        setEditForm({ ...editForm, expiresAt: d.toISOString().split('T')[0] });
                      }}
                      style={{ fontSize: 11, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#2563EB', padding: '2px 6px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                    >
                      +1 Year
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={editForm.expiresAt}
                  onChange={e => setEditForm({ ...editForm, expiresAt: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Set New Password <span style={{ fontSize: 11, fontWeight: 500, color: '#64748B' }}>(Leave blank to keep existing password)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter new portal password"
                  value={editForm.password}
                  onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  disabled={savingEdit}
                  style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  style={{ background: '#2563EB', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: savingEdit ? 'not-allowed' : 'pointer' }}
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingStudent && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 99999, padding: 16
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 18, maxWidth: 460, width: '100%',
            padding: '26px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', textAlign: 'center'
          }}>
            <div style={{
              width: 54, height: 54, borderRadius: '50%', background: '#FEF2F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#DC2626'
            }}>
              <Trash2 size={26} />
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 19, fontWeight: 800, color: '#0F172A' }}>
              Delete Portal Student Permanently?
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{deletingStudent.name}</strong> (<code>{deletingStudent.email}</code>)?
            </p>

            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', textAlign: 'left', fontSize: 12, color: '#991B1B', marginBottom: 20 }}>
              ⚠ This action will completely purge their student account, login user record, and membership history. The email address will immediately become available to re-register.
            </div>

            {deleteErrorMsg && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
                {deleteErrorMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={deleting}
                style={{ flex: 1, background: '#F1F5F9', border: '1px solid #CBD5E1', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{ flex: 1, background: '#DC2626', border: 'none', padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#FFFFFF', cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

