import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Video, Film, Image as ImageIcon, Upload, Check, AlertCircle,
  Play, Sparkles, ExternalLink, RefreshCw, Eye, EyeOff, ShieldCheck
} from 'lucide-react';
import { getHeroBannerVideo, updateHeroBannerVideo } from '../services/firebaseService';
import { uploadUniversalFile } from '../services/apiService';
import { getEmbedVideoUrl, isEmbeddableVideo } from './IndustrialProjectsManager';

const HeroBannerVideoManager = () => {
  const queryClient = useQueryClient();

  // Fetch Hero Banner Video Data
  const { data: heroData, isLoading, refetch } = useQuery({
    queryKey: ['heroBannerVideo'],
    queryFn: getHeroBannerVideo,
    staleTime: 1000 * 30
  });

  const [formBadge, setFormBadge] = useState('Official Company Overview');
  const [formTitle, setFormTitle] = useState('Welcome to Levlox Academy');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    if (heroData) {
      setFormBadge(heroData.badge || 'Official Company Overview');
      setFormTitle(heroData.title || 'Welcome to Levlox Academy');
      setFormSubtitle(heroData.subtitle || '');
      setFormThumbnailUrl(heroData.thumbnailUrl || '');
      setFormVideoUrl(heroData.videoUrl || '');
      setFormEnabled(heroData.enabled !== false);
    }
  }, [heroData]);

  // Handle Thumbnail File Upload
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsUploadingImage(true);
      const res = await uploadUniversalFile(file, 'hero-banner/thumbnails');
      if (res?.url) {
        setFormThumbnailUrl(res.url);
        showToast('Thumbnail uploaded successfully!');
      }
    } catch (err) {
      console.error('[Upload] Image upload failed:', err);
      alert('Image upload failed: ' + err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Video File Upload
  const handleVideoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Please select a valid video file (MP4, WebM, MOV).');
      return;
    }

    try {
      setIsUploadingVideo(true);
      const res = await uploadUniversalFile(file, 'hero-banner/videos');
      if (res?.url) {
        setFormVideoUrl(res.url);
        showToast('Company video uploaded successfully!');
      }
    } catch (err) {
      console.error('[Upload] Video upload failed:', err);
      alert('Video upload failed: ' + err.message);
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      const payload = {
        badge: formBadge.trim(),
        title: formTitle.trim(),
        subtitle: formSubtitle.trim(),
        thumbnailUrl: formThumbnailUrl.trim(),
        videoUrl: formVideoUrl.trim(),
        enabled: formEnabled
      };

      await updateHeroBannerVideo(payload);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['heroBannerVideo'] }),
        queryClient.invalidateQueries({ queryKey: ['adminDashboardAll'] })
      ]);
      await refetch();
      showToast('Hero banner video updated successfully!');
    } catch (err) {
      console.error('[HeroBanner] Save failed:', err);
      setErrorMessage(err.message || 'Failed to update hero video. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40 }} className="animate-fade-in">
      {/* Toast Notification */}
      {toast && (
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
          <span>{toast}</span>
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
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB',
            border: '1.5px solid #BFDBFE'
          }}>
            <Film size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Hero Banner Video
              </h1>
              <span style={{
                background: formEnabled ? '#ECFDF5' : '#F1F5F9',
                color: formEnabled ? '#059669' : '#94A3B8',
                border: formEnabled ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 10px',
                borderRadius: 999,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: formEnabled ? '#10B981' : '#94A3B8' }} />
                {formEnabled ? 'Active on Showcase' : 'Hidden'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748B' }}>
              Feature your official company overview video directly beneath the main headline on the Levlox Academy showcase.
            </p>
          </div>
        </div>

        <a
          href="/academy"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 10,
            background: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            fontSize: 13,
            fontWeight: 700,
            color: '#475569',
            textDecoration: 'none'
          }}
        >
          <Eye size={15} />
          <span>View on Showcase</span>
        </a>
      </div>

      {/* Main Grid: Live Preview & Configuration */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) 440px', gap: 24, alignItems: 'start' }}>

        {/* LEFT COLUMN: Configuration Form */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1.5px solid #E2E8F0',
          padding: '26px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 18px' }}>
            Video Settings & Media Upload
          </h2>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {errorMessage && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Enable Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0'
            }}>
              <div>
                <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
                  Enable Hero Video Card
                </strong>
                <span style={{ fontSize: 12, color: '#64748B' }}>
                  When enabled, this video card displays prominently under the headline.
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formEnabled}
                  onChange={(e) => setFormEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: formEnabled ? '#2563EB' : '#CBD5E1',
                  borderRadius: 24,
                  transition: 'background-color 0.2s ease'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: 18,
                    width: 18,
                    left: formEnabled ? 23 : 3,
                    bottom: 3,
                    backgroundColor: '#FFFFFF',
                    borderRadius: '50%',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </span>
              </label>
            </div>

            {/* Badge Title */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Badge Label (Top-Left Pill)
              </label>
              <input
                type="text"
                value={formBadge}
                placeholder="e.g. Official Company Overview"
                onChange={(e) => setFormBadge(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#0F172A',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* THUMBNAIL UPLOAD */}
            {/* ───────────────────────────────────────────────────────── */}
            <div style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 14,
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <ImageIcon size={16} color="#2563EB" />
                  <span>Company Video Thumbnail Image</span>
                </label>
                {formThumbnailUrl && (
                  <button
                    type="button"
                    onClick={() => setFormThumbnailUrl('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: isUploadingImage ? 'wait' : 'pointer'
                }}>
                  <Upload size={14} />
                  <span>{isUploadingImage ? 'Uploading Image...' : 'Upload Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={isUploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>

                <span style={{ fontSize: 12, color: '#94A3B8' }}>or paste URL:</span>

                <input
                  type="url"
                  placeholder="https://.../thumbnail.jpg"
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 12.5,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {formThumbnailUrl && (
                <div style={{
                  marginTop: 10,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid #E2E8F0',
                  maxHeight: 120,
                  background: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={formThumbnailUrl}
                    alt="Thumbnail preview"
                    style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {/* ───────────────────────────────────────────────────────── */}
            {/* VIDEO UPLOAD */}
            {/* ───────────────────────────────────────────────────────── */}
            <div style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: 14,
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <Video size={16} color="#7C3AED" />
                  <span>Company Video File or Link</span>
                </label>
                {formVideoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormVideoUrl('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: '#FFFFFF',
                  border: '1.5px solid #CBD5E1',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#334155',
                  cursor: isUploadingVideo ? 'wait' : 'pointer'
                }}>
                  <Upload size={14} />
                  <span>{isUploadingVideo ? 'Uploading Video...' : 'Upload MP4/WebM Video'}</span>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoFileChange}
                    disabled={isUploadingVideo}
                    style={{ display: 'none' }}
                  />
                </label>

                <span style={{ fontSize: 12, color: '#94A3B8' }}>or paste URL:</span>

                <input
                  type="url"
                  placeholder="YouTube, Vimeo, or direct MP4 link"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 12.5,
                    color: '#0F172A',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {formVideoUrl && (
                <div style={{
                  marginTop: 10,
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: '#0F172A',
                  position: 'relative',
                  paddingBottom: '56.25%',
                  height: 0
                }}>
                  {isEmbeddableVideo(formVideoUrl) ? (
                    <iframe
                      src={getEmbedVideoUrl(formVideoUrl)}
                      title="Company Video Preview"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  ) : (
                    <video
                      src={formVideoUrl}
                      controls
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSaving || isUploadingImage || isUploadingVideo}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease'
              }}
            >
              {isSaving ? 'Saving Changes...' : 'Save Hero Video Settings'}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Live Showcase Preview */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1.5px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Live Showcase Preview
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6 }}>
              Student View
            </span>
          </div>

          <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 16px', lineHeight: 1.45 }}>
            This card appears right below the main headline: "Get 24 Resources to Crack Your IT Interviews for Free. in தமிழ்".
          </p>

          {/* Interactive Preview Card Container */}
          <div style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            borderRadius: 16,
            overflow: 'hidden',
            background: '#0B0F19',
            boxShadow: '0 15px 35px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Background Thumbnail or Gradient */}
            {formThumbnailUrl ? (
              <img
                src={formThumbnailUrl}
                alt="Company video thumbnail"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 50% 30%, #1E293B 0%, #0B0F19 100%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                <Film size={34} color="rgba(255, 255, 255, 0.25)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255, 255, 255, 0.45)' }}>
                  Levlox Academy Overview
                </span>
              </div>
            )}

            {/* Dark Gradient Overlay for Contrast */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.65) 100%)',
              pointerEvents: 'none'
            }} />

            {/* Top-Left Badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              left: 12,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              padding: '4px 10px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 800,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              zIndex: 2
            }}>
              <Sparkles size={12} color="#60A5FA" />
              <span>{formBadge || 'Company Video'}</span>
            </div>

            {/* Centered Glowing Play Button */}
            <div style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8
            }}>
              <div style={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 6px rgba(37, 99, 235, 0.28), 0 10px 25px rgba(0,0,0,0.4)',
                paddingLeft: 3
              }}>
                <Play size={22} fill="#FFFFFF" />
              </div>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#FFFFFF',
                textShadow: '0 2px 6px rgba(0,0,0,0.8)'
              }}>
                Watch Company Overview
              </span>
            </div>
          </div>

          {/* Quick info list */}
          <div style={{
            marginTop: 18,
            padding: '14px',
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            fontSize: 12,
            color: '#475569',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>Full screen, auto-play on click, and responsive scaling.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={14} color="#2563EB" />
              <span>Supports uploaded MP4/WebM videos and YouTube / Vimeo embeds.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HeroBannerVideoManager;
