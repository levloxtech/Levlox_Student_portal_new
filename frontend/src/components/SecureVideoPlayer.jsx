import React, { useState, useEffect, useRef } from 'react';
import { Lock, Shield, AlertTriangle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { 
  getEmbedVideoUrl, 
  getVideoSourceType, 
  getGoogleDriveFileId,
  getLessonWatchProgress, 
  saveWatchProgress, 
  savePlaybackPosition,
  getPlaybackPosition,
  formatSecondsToDisplay, 
  formatSecondsToClock 
} from '../utils/videoUtils';

/**
 * SecureVideoPlayer — Institutional DRM Protected Player
 *
 * Prevents unauthorized downloading and external sharing of Google Drive
 * and course lesson videos by:
 * 1. Blocking Google Drive's top-right "Open in new window / popout" trigger.
 * 2. Disabling context menu (right click) and download shortcuts.
 * 3. Overlaying a dynamic watermark with the student's name & roll number.
 * 4. Embedding via secure sandboxed iframe / protected HTML5 video.
 * 5. Automatically tracking active viewing time & resume playback position!
 */
const SecureVideoPlayer = ({
  videoUrl = '',
  title = 'Lesson Video',
  watermarkText = '',
  style = {},
  aspectRatio = '16/9',
  height = '100%',
  autoPlay = false,
  lessonId = null,
  studentId = null,
  playlistId = null,
  initialTimeSeconds = 0,
  seekToSeconds = null,
  totalDurationSeconds = 3600,
  onProgressUpdate = null,
}) => {
  const [shieldHovered, setShieldHovered] = useState(false);
  const [useIframeFallback, setUseIframeFallback] = useState(false);
  const videoRef = useRef(null);
  const sourceType = getVideoSourceType(videoUrl);
  const driveId = getGoogleDriveFileId(videoUrl);

  // Resume position
  const savedPos = getPlaybackPosition(studentId, lessonId);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(() => {
    if (typeof seekToSeconds === 'number' && seekToSeconds > 0) return seekToSeconds;
    if (initialTimeSeconds > 0) return initialTimeSeconds;
    return savedPos > 5 ? savedPos : 0;
  });

  // Embed URL with timestamp if supported (declared BEFORE streamSrc)
  let embedUrl = getEmbedVideoUrl(videoUrl);
  if (sourceType === 'youtube' && currentPlaybackTime > 0 && embedUrl && !embedUrl.includes('start=')) {
    embedUrl += `${embedUrl.includes('?') ? '&' : '?'}start=${Math.floor(currentPlaybackTime)}&autoplay=1`;
  }

  const isDirectVideo = sourceType === 'direct';
  const isHtml5Video = isDirectVideo || (sourceType === 'drive' && !useIframeFallback && Boolean(driveId));
  const streamSrc = (sourceType === 'drive' && !useIframeFallback && driveId)
    ? `/api/stream/drive/${driveId}`
    : (embedUrl || '');

  // Dynamically seek whenever seekToSeconds changes
  useEffect(() => {
    if (typeof seekToSeconds === 'number' && seekToSeconds >= 0) {
      setCurrentPlaybackTime(seekToSeconds);
      setWatchedSec(seekToSeconds);
      savePlaybackPosition(studentId, lessonId, seekToSeconds, playlistId);

      if (isHtml5Video && videoRef.current) {
        try {
          videoRef.current.currentTime = seekToSeconds;
          videoRef.current.play().catch(() => {});
        } catch (e) {
          console.warn('HTML5 video seek error:', e);
        }
      }
    }
  }, [seekToSeconds, isHtml5Video, studentId, lessonId, playlistId]);


  // Watch time state
  const [watchedSec, setWatchedSec] = useState(() => {
    if (!lessonId) return 0;
    const p = getLessonWatchProgress(studentId, lessonId);
    return Math.max(p.watchedSeconds || 0, currentPlaybackTime);
  });

  const [isCompleted, setIsCompleted] = useState(() => {
    if (!lessonId) return false;
    const p = getLessonWatchProgress(studentId, lessonId);
    return Boolean(p.completed);
  });

  const [hasResumedAlert, setHasResumedAlert] = useState(currentPlaybackTime > 5);

  // Handle HTML5 video seeking on initial load or change
  useEffect(() => {
    if (isHtml5Video && videoRef.current && currentPlaybackTime > 0) {
      const v = videoRef.current;
      const doSeek = () => {
        try {
          if (Math.abs(v.currentTime - currentPlaybackTime) > 1) {
            v.currentTime = currentPlaybackTime;
            if (autoPlay) v.play().catch(() => {});
          }
        } catch (e) {}
      };

      if (v.readyState >= 1) {
        doSeek();
      } else {
        v.addEventListener('loadedmetadata', doSeek, { once: true });
        v.addEventListener('canplay', doSeek, { once: true });
      }
    }
  }, [isHtml5Video, currentPlaybackTime, autoPlay]);

  // Track HTML5 video timeupdate to continuously save exact second & on pause/leave
  useEffect(() => {
    if (isHtml5Video && videoRef.current && lessonId) {
      const v = videoRef.current;
      const onTimeUpdate = () => {
        const cur = Math.floor(v.currentTime);
        if (cur > 0 && cur % 2 === 0) {
          savePlaybackPosition(studentId, lessonId, cur, playlistId);
          setWatchedSec(cur);
          saveWatchProgress(studentId, lessonId, cur, totalDurationSeconds);
        }
      };

      const onPauseOrEnded = () => {
        const cur = Math.floor(v.currentTime);
        if (cur > 0) {
          savePlaybackPosition(studentId, lessonId, cur, playlistId);
          setWatchedSec(cur);
          saveWatchProgress(studentId, lessonId, cur, totalDurationSeconds);
        }
      };

      v.addEventListener('timeupdate', onTimeUpdate);
      v.addEventListener('pause', onPauseOrEnded);
      v.addEventListener('ended', onPauseOrEnded);

      const onBeforeUnload = () => {
        if (v && v.currentTime > 0) {
          savePlaybackPosition(studentId, lessonId, Math.floor(v.currentTime), playlistId);
        }
      };
      window.addEventListener('beforeunload', onBeforeUnload);

      return () => {
        v.removeEventListener('timeupdate', onTimeUpdate);
        v.removeEventListener('pause', onPauseOrEnded);
        v.removeEventListener('ended', onPauseOrEnded);
        window.removeEventListener('beforeunload', onBeforeUnload);
      };
    }
  }, [isHtml5Video, lessonId, studentId, playlistId, totalDurationSeconds]);

  // Track active viewing time for iframes every 2 seconds
  useEffect(() => {
    if (!lessonId) return;

    let active = true;
    const interval = setInterval(() => {
      if (document.hidden || !active) return;

      setWatchedSec((prev) => {
        const next = prev + 2;
        const result = saveWatchProgress(studentId, lessonId, next, totalDurationSeconds);
        // Persist resume position
        savePlaybackPosition(studentId, lessonId, next, playlistId);

        if (result && result.completed && !isCompleted) {
          setIsCompleted(true);
        }
        if (onProgressUpdate && result) {
          onProgressUpdate(result);
        }
        return next;
      });
    }, 2000);

    const onVisibilityChange = () => {
      active = !document.hidden;
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [lessonId, studentId, playlistId, totalDurationSeconds, isCompleted, onProgressUpdate]);

  // Prevent keyboard shortcuts (Ctrl+S, Ctrl+U, Ctrl+P) while focused
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['s', 'u', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const progressPercent = Math.min(100, Math.round((watchedSec / Math.max(60, totalDurationSeconds)) * 100));

  return (
    <div
      className="secure-player-container"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        aspectRatio: isDirectVideo ? 'auto' : aspectRatio,
        background: '#0B0A10',
        borderRadius: 14,
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        ...style,
      }}
    >
      {/* ── VIDEO RENDERER ── */}
      {isHtml5Video ? (
        <video
          ref={videoRef}
          src={streamSrc}
          controls
          controlsList="nodownload noplaybackrate"
          disablePictureInPicture
          autoPlay={autoPlay}
          onError={() => {
            if (sourceType === 'drive') {
              console.warn('Drive direct stream failed, falling back to Google Drive preview iframe');
              setUseIframeFallback(true);
            }
          }}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      ) : embedUrl ? (
        <iframe
          key={`${lessonId}_${Math.floor(currentPlaybackTime)}`}
          src={embedUrl}
          title={title}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <div style={{ textAlign: 'center', color: '#94A3B8', padding: 24 }}>
          <AlertTriangle size={36} color="#F59E0B" style={{ marginBottom: 8 }} />
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Video source link is missing or invalid.</p>
        </div>
      )}

      {/* ── GOOGLE DRIVE ANTI-POPOUT SHIELD (Top Right Mask) ── */}
      {sourceType === 'drive' && (
        <div
          onMouseEnter={() => setShieldHovered(true)}
          onMouseLeave={() => setShieldHovered(false)}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 70,
            height: 60,
            zIndex: 12,
            cursor: 'default',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: '8px 10px',
            background: 'transparent',
          }}
        >
          {shieldHovered && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: 'rgba(15,23,42,0.92)',
                color: '#38BDF8',
                padding: '3px 7px',
                borderRadius: 6,
                border: '1px solid rgba(56,189,248,0.3)',
                whiteSpace: 'nowrap',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                pointerEvents: 'none',
              }}
            >
              <Lock size={10} /> In-Portal Stream
            </span>
          )}
        </div>
      )}

      {/* ── DYNAMIC SECURITY WATERMARK OVERLAY ── */}
      {watermarkText && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 18,
            zIndex: 11,
            pointerEvents: 'none',
            color: 'rgba(255, 255, 255, 0.28)',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Shield size={11} /> {watermarkText} • Academic DRM Protected
        </div>
      )}

      {/* ── LIVE TIME-BASED WATCH COMPLETION TRACKER PILL ── */}
      {lessonId && (
        <div
          style={{
            position: 'absolute',
            bottom: 14,
            left: 16,
            zIndex: 11,
            pointerEvents: 'none',
            background: isCompleted ? 'rgba(16, 185, 129, 0.92)' : 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            border: isCompleted ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '5px 12px',
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: isCompleted ? '#A7F3D0' : '#38BDF8', animation: isCompleted ? 'none' : 'pulse 1.5s infinite' }} />
          <span>
            {isCompleted ? (
              <>Course Requirement Complete: 100%</>
            ) : (
              <>Watched {formatSecondsToClock(watchedSec)} / {formatSecondsToDisplay(totalDurationSeconds)} ({progressPercent}%)</>
            )}
          </span>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
