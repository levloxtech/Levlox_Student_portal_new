import React, { useState, useEffect, useRef } from 'react';
import { Video, Plus, Trash2, Eye, CheckCircle, Upload, Link as LinkIcon, Play, Film, User, UploadCloud, Loader2 } from 'lucide-react';
import CustomModal from './Modal';
import { getResolvedThumbnail, resolveDirectImageUrl } from '../utils/videoUtils';

export default function AcademyTestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Mode toggles for video & thumbnail
  const [videoMode, setVideoMode] = useState('link'); // 'link' | 'upload'
  const [thumbMode, setThumbMode] = useState('link'); // 'link' | 'upload'
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const videoFileInputRef = useRef(null);
  const thumbFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    studentName: '',
    role: '',
    linkedinUrl: '',
    rating: 5,
    videoUrl: '',
    thumbnailUrl: '',
    feedback: '',
    active: true
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/membership/testimonials');
      const data = await res.json();
      if (data.success) {
        setTestimonials(data.testimonials || []);
      }
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Video file upload handler
  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'testimonials/videos');

    setUploadingVideo(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to upload video');

      setFormData(prev => ({ ...prev, videoUrl: result.relativePath || result.url }));
      showToast('Video file uploaded successfully!');
    } catch (err) {
      alert('Video upload error: ' + err.message);
    } finally {
      setUploadingVideo(false);
    }
  };

  // Thumbnail file upload handler
  const handleThumbFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);
    data.append('folder', 'testimonials/thumbnails');

    setUploadingThumb(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to upload thumbnail');

      setFormData(prev => ({ ...prev, thumbnailUrl: result.relativePath || result.url }));
      showToast('Thumbnail uploaded successfully!');
    } catch (err) {
      alert('Thumbnail upload error: ' + err.message);
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.studentName.trim()) {
      alert('Please provide the Student Name.');
      return;
    }
    if (!formData.videoUrl.trim()) {
      alert('Please provide a Video URL or upload a video file.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/membership/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save testimonial');

      showToast('Video Testimonial added successfully!');
      setShowAddModal(false);
      setFormData({
        studentName: '',
        role: '',
        linkedinUrl: '',
        rating: 5,
        videoUrl: '',
        thumbnailUrl: '',
        feedback: '',
        active: true
      });
      fetchTestimonials();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial for "${name}"?`)) return;

    try {
      const res = await fetch(`/api/membership/testimonials/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');
      showToast('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (item) => {
    try {
      const res = await fetch(`/api/membership/testimonials/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      fetchTestimonials();
    } catch (err) {
      alert(err.message);
    }
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    }
    const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch) {
      return `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    }
    return url;
  };

  return (
    <div style={{ padding: '24px 0' }} className="animate-fade-in">
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24,
          background: '#101B33', color: '#FFF',
          borderRadius: 12, padding: '12px 20px',
          fontSize: 13, fontWeight: 600, zIndex: 2000,
          boxShadow: '0 16px 32px rgba(16, 27, 51, 0.25)',
          display: 'flex', alignItems: 'center', gap: 8,
          border: '1px solid #4568F5'
        }}>
          <CheckCircle size={16} color="#10B981" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, marginBottom: 24
      }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px' }}>
            Academy Testimonials & Video Proofs
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Manage student review videos that appear publicly on the Levlox Academy Showcase page.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, fontWeight: 700 }}
        >
          <Plus size={16} /> Add Video Testimonial
        </button>
      </div>

      {/* Grid of testimonials */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          Loading testimonials...
        </div>
      ) : testimonials.length === 0 ? (
        <div style={{
          background: 'var(--surface-color)',
          border: '1px dashed var(--border-color)',
          borderRadius: 16, padding: '60px 20px', textAlign: 'center'
        }}>
          <Film size={44} color="var(--primary-color)" style={{ marginBottom: 16, opacity: 0.6 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            No Video Testimonials Added Yet
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 460, margin: '0 auto 20px' }}>
            Click the button below to add your first student review video.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} /> Add Testimonial Now
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 250px))',
          gap: 24
        }}>
          {testimonials.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'relative',
                height: 340,
                borderRadius: 22,
                overflow: 'hidden',
                background: '#0F172A',
                boxShadow: '0 8px 24px rgba(16, 27, 51, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              {/* Fallback Stylized Avatar (always rendered underneath) */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 30%, #1E2B4D 0%, #0D1424 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingBottom: 60
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #4568F5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  fontSize: 24,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(69, 104, 245, 0.4)',
                  marginBottom: 8
                }}>
                  {item.studentName ? item.studentName.charAt(0).toUpperCase() : 'L'}
                </div>
                <span style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600 }}>
                  Video Story
                </span>
              </div>

              {/* Background Thumbnail Image (auto-derived & auto-hides if broken/404) */}
              {(() => {
                const resolved = getResolvedThumbnail(item.videoUrl, item.thumbnailUrl);
                if (!resolved) return null;
                return (
                  <img
                    src={resolved}
                    alt=""
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      zIndex: 1
                    }}
                  />
                );
              })()}

              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(10,15,30,0.5) 50%, rgba(10,15,30,0.96) 100%)',
                pointerEvents: 'none'
              }} />

              {/* Top Controls: Status Badge */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '14px 14px 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: item.active ? 'rgba(16, 185, 129, 0.9)' : 'rgba(100, 116, 139, 0.9)',
                  color: '#FFF',
                  backdropFilter: 'blur(4px)'
                }}>
                  {item.active ? '● Active' : '○ Hidden'}
                </span>

                <button
                  type="button"
                  onClick={() => setPreviewVideo(item)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
                  }}
                  title="Play / Preview Video"
                >
                  <Play size={14} fill="#101B33" color="#101B33" style={{ marginLeft: 2 }} />
                </button>
              </div>

              {/* Bottom Content Area */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                padding: '14px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                {/* Student Name */}
                <h4 style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  margin: 0,
                  letterSpacing: '-0.3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.studentName}
                </h4>

                {/* Role */}
                {item.role && (
                  <p style={{
                    fontSize: 12,
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {item.role}
                  </p>
                )}

                {/* Stars & LinkedIn */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {[...Array(5)].map((_, si) => (
                      <span key={si} style={{ color: si < (item.rating || 5) ? '#FBBF24' : 'rgba(255, 255, 255, 0.25)', fontSize: 12 }}>
                        ★
                      </span>
                    ))}
                    <span style={{ color: '#FBBF24', fontSize: 10, fontWeight: 700, marginLeft: 3 }}>
                      {(item.rating || 5)}.0
                    </span>
                  </div>

                  {item.linkedinUrl && (
                    <a
                      href={item.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#FFFFFF',
                        background: 'rgba(10, 102, 194, 0.85)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 6px',
                        borderRadius: 4,
                        textDecoration: 'none'
                      }}
                    >
                      <svg fill="#FFFFFF" viewBox="0 0 24 24" style={{ width: 10, height: 10 }}>
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
                      </svg>
                      LinkedIn
                    </a>
                  )}
                </div>

                {/* Feedback / Review Text right at the bottom of the stars */}
                {item.feedback ? (
                  <p style={{
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                    margin: '3px 0 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    "{item.feedback}"
                  </p>
                ) : (
                  <p style={{
                    fontSize: 11,
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontStyle: 'italic',
                    margin: '3px 0 0'
                  }}>
                    "No feedback text added yet"
                  </p>
                )}

                {/* Action Buttons Toolbar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 8,
                  marginTop: 4,
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)'
                }}>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      cursor: 'pointer'
                    }}
                  >
                    {item.active ? 'Hide' : 'Show'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.studentName)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#FDA4AF',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ADD TESTIMONIAL MODAL */}
      {showAddModal && (
        <CustomModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Add Academy Video Testimonial"
        >
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Student Name & Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Student Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sanjay Kumar"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Role / Company</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Software Engineer @ Zoho"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
              </div>
            </div>

            {/* LinkedIn Profile & Rating */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Student LinkedIn Profile URL</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.linkedin.com/in/student-username"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Rating (Stars) *</label>
                <select
                  className="form-input"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                  style={{ cursor: 'pointer' }}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                  <option value={2}>★★☆☆☆ (2 Stars)</option>
                  <option value={1}>★☆☆☆☆ (1 Star)</option>
                </select>
              </div>
            </div>

            {/* Video Input: Option to Paste Link OR Upload File */}
            <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Video (Upload or Link) *</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setVideoMode('link')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: videoMode === 'link' ? '1px solid #4568F5' : '1px solid var(--border-color)',
                      background: videoMode === 'link' ? '#EEF2FE' : '#FFF',
                      color: videoMode === 'link' ? '#4568F5' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <LinkIcon size={12} /> Paste Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('upload')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: videoMode === 'upload' ? '1px solid #4568F5' : '1px solid var(--border-color)',
                      background: videoMode === 'upload' ? '#EEF2FE' : '#FFF',
                      color: videoMode === 'upload' ? '#4568F5' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Upload size={12} /> Upload File
                  </button>
                </div>
              </div>

              {videoMode === 'link' ? (
                <div>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://www.youtube.com/watch?v=... or direct MP4 link"
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    Paste any YouTube or video link. YouTube thumbnails are retrieved automatically.
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={videoFileInputRef}
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={uploadingVideo}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{
                      width: '100%', padding: '12px', border: '1px dashed #4568F5',
                      borderRadius: 8, background: '#FFF', color: '#4568F5',
                      fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {uploadingVideo ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Uploading Video File...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} /> Choose Video File to Upload (MP4 / WebM)
                      </>
                    )}
                  </button>
                  {formData.videoUrl && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} /> Video Uploaded: <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{formData.videoUrl}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Thumbnail Input: Option to Paste Link OR Upload File */}
            <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label className="form-label" style={{ fontWeight: 700, margin: 0 }}>Thumbnail Image</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => setThumbMode('link')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: thumbMode === 'link' ? '1px solid #4568F5' : '1px solid var(--border-color)',
                      background: thumbMode === 'link' ? '#EEF2FE' : '#FFF',
                      color: thumbMode === 'link' ? '#4568F5' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <LinkIcon size={12} /> Image URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setThumbMode('upload')}
                    style={{
                      padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      border: thumbMode === 'upload' ? '1px solid #4568F5' : '1px solid var(--border-color)',
                      background: thumbMode === 'upload' ? '#EEF2FE' : '#FFF',
                      color: thumbMode === 'upload' ? '#4568F5' : 'var(--text-secondary)',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                    }}
                  >
                    <Upload size={12} /> Upload Image
                  </button>
                </div>
              </div>

              {thumbMode === 'link' ? (
                <div>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://... image link (optional if YouTube link is used)"
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                    Leave empty to auto-extract high-res thumbnail for YouTube videos.
                  </span>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={thumbFileInputRef}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    onChange={handleThumbFileUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    disabled={uploadingThumb}
                    onClick={() => thumbFileInputRef.current?.click()}
                    className="btn btn-outline"
                    style={{
                      width: '100%', padding: '12px', border: '1px dashed #4568F5',
                      borderRadius: 8, background: '#FFF', color: '#4568F5',
                      fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}
                  >
                    {uploadingThumb ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Uploading Thumbnail Image...
                      </>
                    ) : (
                      <>
                        <UploadCloud size={16} /> Choose Image File to Upload (PNG / JPG)
                      </>
                    )}
                  </button>
                  {formData.thumbnailUrl && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={formData.thumbnailUrl}
                        alt="Preview"
                        style={{ width: 50, height: 35, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border-color)' }}
                      />
                      <span style={{ fontSize: 12, color: '#10B981' }}>✓ Thumbnail selected</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Student Review / Feedback Quote */}
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Student Review / Feedback Quote</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Share the student's learning experience, interview transition story, or feedback..."
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                style={{ resize: 'vertical' }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, display: 'block' }}>
                This review text appears directly under the star rating on the showcase card.
              </span>
            </div>

            {/* Visibility checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="activeTestimonial"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: 'var(--primary-color)', cursor: 'pointer' }}
              />
              <label htmlFor="activeTestimonial" style={{ fontSize: 13, color: 'var(--text-primary)', cursor: 'pointer' }}>
                Show publicly on Levlox Academy Showcase page immediately
              </label>
            </div>

            {/* Submit buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || uploadingVideo || uploadingThumb}
                className="btn btn-primary"
                style={{ fontWeight: 700 }}
              >
                {submitting ? 'Saving Testimonial...' : 'Save & Publish Testimonial'}
              </button>
            </div>
          </form>
        </CustomModal>
      )}

      {/* VIDEO PREVIEW MODAL */}
      {previewVideo && (
        <CustomModal
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
          title={`${previewVideo.studentName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              position: 'relative', width: '100%', paddingBottom: '56.25%',
              borderRadius: 12, overflow: 'hidden', background: '#000'
            }}>
              {getEmbedUrl(previewVideo.videoUrl).includes('youtube.com/embed') || getEmbedUrl(previewVideo.videoUrl).includes('drive.google.com') ? (
                <iframe
                  src={getEmbedUrl(previewVideo.videoUrl)}
                  title={previewVideo.studentName}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', border: 'none'
                  }}
                />
              ) : (
                <video
                  src={previewVideo.videoUrl}
                  controls
                  autoPlay
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%'
                  }}
                />
              )}
            </div>

            {previewVideo.feedback && (
              <div style={{
                padding: '12px 14px',
                background: 'var(--surface-alt)',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                lineHeight: 1.5
              }}>
                "{previewVideo.feedback}"
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {previewVideo.studentName} {previewVideo.role ? `• ${previewVideo.role}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 2, color: '#F59E0B', fontSize: 12, marginTop: 4 }}>
                  {[...Array(5)].map((_, si) => (
                    <span key={si} style={{ color: si < (previewVideo.rating || 5) ? '#F59E0B' : '#CBD5E1' }}>★</span>
                  ))}
                </div>
              </div>

              {previewVideo.linkedinUrl && (
                <a
                  href={previewVideo.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 700, color: '#0A66C2',
                    background: '#EDF3F8', padding: '4px 10px', borderRadius: 6,
                    textDecoration: 'none', border: '1px solid #D0E1F0'
                  }}
                >
                  <svg fill="#0A66C2" viewBox="0 0 24 24" style={{ width: 12, height: 12 }}>
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.53 1.53 0 1 0 0-3.06 1.53 1.53 0 0 0 0 3.06m1.39 9.74v-8.37H5.07v8.37h2.78Z" />
                  </svg>
                  <span>Connect on LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        </CustomModal>
      )}

    </div>
  );
}
