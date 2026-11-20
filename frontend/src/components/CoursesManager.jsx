import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Plus, Pencil, Trash2, Search, Award, Users,
  GraduationCap, Clock, Check, X, AlertTriangle, RefreshCw,
  Tag, IndianRupee, Layers, ShieldCheck
} from 'lucide-react';
import { addCourse, updateCourse, deleteCourse } from '../services/firebaseService';

const PRESET_CATEGORIES = [
  'Data Science & AI',
  'Programming',
  'Database',
  'Generative AI',
  'Fullstack Engineering',
  'Cloud & DevOps',
  'General Academy'
];

const VALIDITY_PRESETS = [30, 60, 90, 180, 365];

const CoursesManager = ({
  courses = [],
  allStudents = [],
  batches = [],
  onCourseCreated,
}) => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseCategory, setCourseCategory] = useState('Data Science & AI');
  const [customCategory, setCustomCategory] = useState('');
  const [courseValidityDays, setCourseValidityDays] = useState(90);
  const [courseFee, setCourseFee] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirmation Modal State
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setCourseTitle('');
    setCourseCode(`CRS-${String(courses.length + 1).padStart(2, '0')}`);
    setCourseCategory('Data Science & AI');
    setCustomCategory('');
    setCourseValidityDays(90);
    setCourseFee('');
    setCourseDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (c) => {
    setEditingCourse(c);
    setCourseTitle(c.title || c.name || '');
    setCourseCode(c.code || c.courseId || '');
    const isStandardCat = PRESET_CATEGORIES.includes(c.category);
    if (isStandardCat) {
      setCourseCategory(c.category);
      setCustomCategory('');
    } else if (c.category) {
      setCourseCategory('Other');
      setCustomCategory(c.category);
    } else {
      setCourseCategory('Data Science & AI');
      setCustomCategory('');
    }
    setCourseValidityDays(Number(c.validityDays || c.durationDays || c.accessDays) || 90);
    setCourseFee(c.fee || c.standardFee || c.totalFee || '');
    setCourseDescription(c.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save (Create or Update)
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const cleanTitle = courseTitle.trim();
    if (!cleanTitle) {
      setFormError('Course Name / Title is required.');
      return;
    }

    const finalCategory = courseCategory === 'Other' ? (customCategory.trim() || 'General') : courseCategory;

    setIsSubmitting(true);
    setFormError('');

    try {
      const payload = {
        title: cleanTitle,
        name: cleanTitle,
        code: courseCode.trim() || `CRS-${cleanTitle.substring(0, 3).toUpperCase()}`,
        category: finalCategory,
        validityDays: Number(courseValidityDays) || 90,
        durationDays: Number(courseValidityDays) || 90,
        fee: courseFee ? Number(courseFee) : 0,
        description: courseDescription.trim(),
        status: 'Active',
        updatedAt: new Date().toISOString(),
      };

      if (editingCourse) {
        await updateCourse(editingCourse.id, payload);
        showToast(`Course "${cleanTitle}" updated successfully!`);
      } else {
        payload.createdAt = new Date().toISOString();
        await addCourse(payload);
        showToast(`New course "${cleanTitle}" created successfully!`);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] }),
        queryClient.invalidateQueries({ queryKey: ['masterCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);

      if (onCourseCreated) onCourseCreated();
      setIsModalOpen(false);
    } catch (err) {
      console.error('[CoursesManager] Save failed:', err);
      setFormError(err.message || 'Failed to save course. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCourse(courseToDelete.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] }),
        queryClient.invalidateQueries({ queryKey: ['masterCourses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ]);
      showToast(`Course "${courseToDelete.title || courseToDelete.name}" deleted.`);
      setCourseToDelete(null);
    } catch (err) {
      console.error('[CoursesManager] Delete failed:', err);
      alert(`Failed to delete course: ${err.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const title = (c.title || c.name || '').toLowerCase();
      const code = (c.code || c.courseId || '').toLowerCase();
      const cat = (c.category || '').toLowerCase();
      const desc = (c.description || '').toLowerCase();
      const query = searchQuery.trim().toLowerCase();

      const matchesQuery = !query || title.includes(query) || code.includes(query) || cat.includes(query) || desc.includes(query);
      const matchesCat = selectedCategory === 'All' || (c.category || '').toLowerCase() === selectedCategory.toLowerCase();

      return matchesQuery && matchesCat;
    });
  }, [courses, searchQuery, selectedCategory]);

  return (
    <div style={{ padding: '0 0 40px 0' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#0F172A',
          color: '#FFFFFF',
          padding: '12px 22px',
          borderRadius: 14,
          fontSize: 13.5,
          fontWeight: 700,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          border: '1px solid #334155'
        }}>
          <Check size={16} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1.5px solid #E2E8F0',
        padding: '24px 28px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: '#F5F3FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6C3CF0',
            border: '1.5px solid #DDD6FE'
          }}>
            <BookOpen size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>Courses Management</h1>
              <span style={{
                background: '#EDE9FE',
                color: '#6C3CF0',
                fontSize: 12,
                fontWeight: 800,
                padding: '3px 10px',
                borderRadius: 999
              }}>
                {courses.length} {courses.length === 1 ? 'Course' : 'Courses'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              Create, configure, and manage curriculum courses. Courses created here will be selectable across student enrollments and batch assignments.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          style={{
            background: '#6C3CF0',
            color: '#FFFFFF',
            border: 'none',
            padding: '11px 22px',
            borderRadius: 12,
            fontSize: 13.5,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(108, 60, 240, 0.35)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#582BD4'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#6C3CF0'; }}
        >
          <Plus size={17} /> Create New Course
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1.5px solid #E2E8F0',
        padding: '14px 18px',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        {/* Search Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#F8FAFC',
          border: '1px solid #CBD5E1',
          borderRadius: 10,
          padding: '8px 14px',
          flex: '1 1 280px',
          maxWidth: 420
        }}>
          <Search size={16} color="#64748B" />
          <input
            type="text"
            placeholder="Search by course name, code, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              width: '100%',
              color: '#0F172A',
              fontWeight: 500
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {['All', ...PRESET_CATEGORIES.slice(0, 4)].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                border: selectedCategory === cat ? '1.5px solid #6C3CF0' : '1px solid #E2E8F0',
                background: selectedCategory === cat ? '#F5F3FF' : '#FFFFFF',
                color: selectedCategory === cat ? '#6C3CF0' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Cards Grid */}
      {filteredCourses.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1.5px dashed #CBD5E1',
          padding: '60px 20px',
          textAlign: 'center'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: '#F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748B',
            margin: '0 auto 16px'
          }}>
            <BookOpen size={28} />
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            {courses.length === 0 ? 'No Courses Created Yet' : 'No Courses Match Your Search'}
          </h3>
          <p style={{ fontSize: 13.5, color: '#64748B', maxWidth: 440, margin: '0 auto 20px' }}>
            {courses.length === 0
              ? 'Click below to create your first course. Once created, it will be immediately available in student enrollment and batch options.'
              : 'Try clearing your search query or choosing "All" categories to view existing courses.'}
          </p>
          {courses.length === 0 && (
            <button
              type="button"
              onClick={handleOpenCreate}
              style={{
                background: '#6C3CF0',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Plus size={16} /> Create Course
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20
        }}>
          {filteredCourses.map((c) => {
            const courseName = c.title || c.name || 'Untitled Course';
            const enrolledCount = allStudents.filter(
              (s) => (s.course || '').toLowerCase() === courseName.toLowerCase()
            ).length;
            const batchCount = batches.filter(
              (b) => (b.course_name || b.course || '').toLowerCase() === courseName.toLowerCase()
            ).length;

            return (
              <div
                key={c.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: '1.5px solid #E2E8F0',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative'
                }}
              >
                <div>
                  {/* Top Header: Code, Category & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        background: '#EEF2FF',
                        color: '#4F46E5',
                        padding: '3px 9px',
                        borderRadius: 6,
                        letterSpacing: '0.02em',
                        border: '1px solid #C7D2FE'
                      }}>
                        {c.code || 'CRS-01'}
                      </span>
                      {c.category && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          background: '#F1F5F9',
                          color: '#475569',
                          padding: '3px 8px',
                          borderRadius: 6
                        }}>
                          {c.category}
                        </span>
                      )}
                    </div>

                    {/* Action buttons: Edit & Delete */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Course"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          color: '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6C3CF0'; e.currentTarget.style.color = '#6C3CF0'; }}
                        onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setCourseToDelete(c)}
                        title="Delete Course"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: '1px solid #FEE2E2',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = '#FFFFFF'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                    {courseName}
                  </h3>
                  <p style={{
                    fontSize: 12.5,
                    color: '#64748B',
                    margin: '0 0 16px 0',
                    lineHeight: 1.45,
                    minHeight: 36,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {c.description || 'Institutional curriculum & learning module.'}
                  </p>
                </div>

                {/* Metrics / Details Grid */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  padding: '12px 14px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  fontSize: 12
                }}>
                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                      Portal Validity
                    </span>
                    <strong style={{ fontSize: 13, color: '#6C3CF0', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Clock size={13} /> {c.validityDays || c.durationDays || 90} Days
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                      Standard Fee
                    </span>
                    <strong style={{ fontSize: 13, color: '#0F172A', marginTop: 2, display: 'block' }}>
                      {c.fee ? `₹${Number(c.fee).toLocaleString('en-IN')}` : 'Included'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                      Enrolled Students
                    </span>
                    <strong style={{ fontSize: 13, color: '#0F172A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={13} color="#64748B" /> {enrolledCount} {enrolledCount === 1 ? 'student' : 'students'}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', display: 'block' }}>
                      Active Batches
                    </span>
                    <strong style={{ fontSize: 13, color: '#0F172A', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <GraduationCap size={13} color="#64748B" /> {batchCount} {batchCount === 1 ? 'batch' : 'batches'}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT COURSE MODAL ── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 520,
            width: '100%',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: '#EDE9FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6C3CF0'
                }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                    {editingCourse ? 'Edit Course' : 'Create New Course'}
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>
                    {editingCourse ? 'Update course specifications and duration' : 'Configure a new institutional course'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {formError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 12.5,
                fontWeight: 600,
                marginBottom: 16
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCourse}>
              {/* Course Name */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Course Name / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, Python Fullstack, SQL Blueprint"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    color: '#0F172A',
                    outline: 'none',
                    fontWeight: 600,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Code & Category Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Course Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ML-01, PY-101"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13,
                      color: '#0F172A',
                      outline: 'none',
                      fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Category
                  </label>
                  <select
                    value={courseCategory}
                    onChange={(e) => setCourseCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13,
                      color: '#0F172A',
                      outline: 'none',
                      fontWeight: 600,
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                  >
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Other">Other (Custom)...</option>
                  </select>
                </div>
              </div>

              {courseCategory === 'Other' && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Custom Category Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cyber Security, Blockchain"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Portal Validity Duration */}
              <div style={{
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 12,
                padding: '14px',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Default Portal Validity (Days) *
                  </label>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#6C3CF0', background: '#EDE9FE', padding: '2px 8px', borderRadius: 999 }}>
                    Access Duration
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <input
                    type="number"
                    min="1"
                    max="3650"
                    value={courseValidityDays}
                    onChange={(e) => setCourseValidityDays(e.target.value)}
                    required
                    style={{
                      flex: 1,
                      padding: '9px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#0F172A',
                      background: '#FFFFFF'
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>Days</span>
                </div>

                {/* Preset Days Buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {VALIDITY_PRESETS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setCourseValidityDays(d)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11.5,
                        borderRadius: 8,
                        border: Number(courseValidityDays) === d ? '1.5px solid #6C3CF0' : '1px solid #CBD5E1',
                        background: Number(courseValidityDays) === d ? '#EDE9FE' : '#FFFFFF',
                        color: Number(courseValidityDays) === d ? '#6C3CF0' : '#475569',
                        fontWeight: Number(courseValidityDays) === d ? 800 : 600,
                        cursor: 'pointer'
                      }}
                    >
                      {d} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Standard Course Fee */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Standard Course Fee (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={courseFee}
                  onChange={(e) => setCourseFee(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13.5,
                    color: '#0F172A',
                    fontWeight: 600,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Description / Syllabus Highlights
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what students will learn in this course..."
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 13,
                    color: '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 12,
                    border: '1.5px solid #E2E8F0',
                    background: '#FFFFFF',
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
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#6C3CF0',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(108, 60, 240, 0.35)'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </>
                  ) : (
                    editingCourse ? 'Save Changes' : 'Create Course'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      {courseToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 440,
            width: '100%',
            padding: '26px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626'
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>Delete Course</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: 12.5, color: '#64748B' }}>This action cannot be undone.</p>
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5, margin: '14px 0 20px' }}>
              Are you sure you want to permanently delete the course{' '}
              <strong style={{ color: '#0F172A' }}>
                "{courseToDelete.title || courseToDelete.name}"
              </strong>?
              It will be removed from future student enrollments and batch dropdowns.
            </p>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={isDeleting}
                style={{
                  padding: '9px 16px',
                  borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '9px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                }}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Deleting...
                  </>
                ) : (
                  'Confirm Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesManager;
