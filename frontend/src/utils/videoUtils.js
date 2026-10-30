/**
 * Video Utility Helper — Levlox Student Portal
 *
 * Normalizes Google Drive links, YouTube links, and direct video URLs
 * into secure, embeddable preview streams.
 */

/**
 * Extract Google Drive file ID from any Google Drive sharing or view URL.
 */
export const getGoogleDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (matchFileD && matchFileD[1]) return matchFileD[1];

  // Pattern 2: https://drive.google.com/open?id={FILE_ID} or /uc?id={FILE_ID}
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i);
  if (matchIdParam && matchIdParam[1]) return matchIdParam[1];

  // Pattern 3: https://drive.google.com/file/u/{user_number}/d/{FILE_ID}/...
  const matchUserD = trimmed.match(/\/file\/u\/\d+\/d\/([a-zA-Z0-9_-]{10,})/i);
  if (matchUserD && matchUserD[1]) return matchUserD[1];

  // Pattern 4: https://drive.google.com/open?id={FILE_ID}
  const matchOpen = trimmed.match(/open\?id=([a-zA-Z0-9_-]{10,})/i);
  if (matchOpen && matchOpen[1]) return matchOpen[1];

  return null;
};

/**
 * Extract YouTube video ID from various YouTube URL formats
 * (Public, Unlisted, Shorts, Live, Embedded, Mobile).
 */
export const getYouTubeVideoId = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // Pattern 1: youtu.be/{ID}
  const matchShort = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,15})/i);
  if (matchShort && matchShort[1]) return matchShort[1];

  // Pattern 2: ?v={ID} or &v={ID}
  const matchWatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,15})/i);
  if (matchWatch && matchWatch[1]) return matchWatch[1];

  // Pattern 3: /embed/{ID}
  const matchEmbed = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{6,15})/i);
  if (matchEmbed && matchEmbed[1]) return matchEmbed[1];

  // Pattern 4: /shorts/{ID}
  const matchShorts = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{6,15})/i);
  if (matchShorts && matchShorts[1]) return matchShorts[1];

  // Pattern 5: /live/{ID}
  const matchLive = trimmed.match(/\/live\/([a-zA-Z0-9_-]{6,15})/i);
  if (matchLive && matchLive[1]) return matchLive[1];

  // Pattern 6: /v/{ID}
  const matchV = trimmed.match(/\/v\/([a-zA-Z0-9_-]{6,15})/i);
  if (matchV && matchV[1]) return matchV[1];

  return null;
};

/**
 * Detect the type of video source.
 */
export const getVideoSourceType = (url) => {
  if (!url) return 'none';
  const trimmed = typeof url === 'string' ? url.trim() : '';
  if (getGoogleDriveFileId(trimmed)) return 'drive';
  if (getYouTubeVideoId(trimmed)) return 'youtube';
  if (trimmed.includes('/uploads/') || trimmed.match(/\.(mp4|webm|ogg|mov|mkv|m4v)(\?.*)?$/i)) return 'direct';
  if (trimmed.includes('vimeo.com')) return 'vimeo';
  return 'link';
};

/**
 * Transform any supported URL into an embeddable stream URL.
 */
export const getEmbedVideoUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();

  // 1. Google Drive Link -> Preview player
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/file/d/${driveId}/preview`;
  }

  // 2. YouTube Link -> Embed player (privacy-enhanced mode with modest branding)
  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&showinfo=0&controls=1&enablejsapi=1`;
  }

  // 3. Vimeo Link
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
  }

  // 4. Direct video or other embed
  return url;
};

/**
 * Resolve the best thumbnail for a given video URL.
 */
export const resolveDirectImageUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const url = rawUrl.trim();

  // 1. ClipSafari clip page -> direct CDN PNG/SVG
  if (url.includes('clipsafari.com/clips/')) {
    if (url.includes('o248484-python-logo') || url.includes('python-logo')) {
      return 'https://spaces-cdn.clipsafari.com/0xnv8d9ush4m3sh3cjkrglrw2j6n';
    }
    const match = url.match(/clipsafari\.com\/clips\/o\d+-([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) {
      return `https://images.clipsafari.com/nipu4bvfh7gv8qzavtuvnmgrufz2?filename=${match[1]}.svg`;
    }
  }

  // 2. Google Drive preview/view link -> direct thumbnail
  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  }

  // 3. Unsplash photo page -> direct image
  const unsplashMatch = url.match(/unsplash\.com\/photos\/([a-zA-Z0-9_-]+)/i);
  if (unsplashMatch && unsplashMatch[1]) {
    return `https://images.unsplash.com/photo-${unsplashMatch[1]}?w=800&auto=format&fit=crop&q=80`;
  }

  // 4. Imgur page -> direct image
  const imgurMatch = url.match(/imgur\.com\/([a-zA-Z0-9]{5,8})$/i);
  if (imgurMatch && imgurMatch[1]) {
    return `https://i.imgur.com/${imgurMatch[1]}.png`;
  }

  return url;
};

/**
 * Resolve the best thumbnail for a given video URL.
 */
export const getResolvedThumbnail = (url, thumbnail) => {
  if (thumbnail && thumbnail.trim()) {
    return resolveDirectImageUrl(thumbnail.trim());
  }

  const ytId = getYouTubeVideoId(url);
  if (ytId) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  const driveId = getGoogleDriveFileId(url);
  if (driveId) {
    // Google Drive thumbnail endpoint
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
  }

  return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80';
};

/**
 * Parse human duration strings like "1h 45m", "45m", "2h", "90 mins", "01:30:00" into seconds.
 */
export const parseDurationToSeconds = (durationStr) => {
  if (!durationStr) return 3600; // default 1 hour (3600s) if unspecified
  if (typeof durationStr === 'number') return Math.max(60, Math.round(durationStr));
  
  const s = String(durationStr).toLowerCase().trim();
  let totalSec = 0;

  const hourMatch = s.match(/(\d+)\s*h(?:ours?|r)?/);
  if (hourMatch) totalSec += parseInt(hourMatch[1], 10) * 3600;

  const minMatch = s.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
  if (minMatch) totalSec += parseInt(minMatch[1], 10) * 60;

  const secMatch = s.match(/(\d+)\s*s(?:ec(?:ond)?s?)?/);
  if (secMatch) totalSec += parseInt(secMatch[1], 10);

  // Colon format hh:mm:ss or mm:ss
  if (totalSec === 0 && s.includes(':')) {
    const parts = s.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      totalSec = parts[0] * 60 + parts[1];
    }
  }

  // Pure digits (e.g. "90" -> assume minutes)
  if (totalSec === 0 && /^\d+$/.test(s)) {
    const num = parseInt(s, 10);
    totalSec = num > 300 ? num : num * 60; // if > 300 probably seconds, else minutes
  }

  return totalSec > 0 ? totalSec : 3600;
};

/**
 * Format total seconds into human string: "1h 45m", "45m", or "2h"
 */
export const formatSecondsToDisplay = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${Math.max(1, m)}m`;
};

/**
 * Format total seconds into digital clock style "01:24" or "1:02:40"
 */
export const formatSecondsToClock = (seconds) => {
  if (!seconds || seconds <= 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
};

/**
 * Local Watch-Time Progress Storage
 */
const getStorageKey = (studentId) => `levlox_video_watch_progress_${studentId || 'default'}`;

export const getAllWatchProgress = (studentId) => {
  try {
    const raw = localStorage.getItem(getStorageKey(studentId));
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('Error loading watch progress:', err);
    return {};
  }
};

export const getLessonWatchProgress = (studentId, lessonId) => {
  if (!lessonId) return { watchedSeconds: 0, totalSeconds: 3600, percentage: 0, completed: false };
  const all = getAllWatchProgress(studentId);
  return all[lessonId] || { watchedSeconds: 0, totalSeconds: 3600, percentage: 0, completed: false };
};

export const saveWatchProgress = (studentId, lessonId, watchedSeconds, totalSeconds) => {
  if (!lessonId) return null;
  try {
    const all = getAllWatchProgress(studentId);
    const existing = all[lessonId] || { watchedSeconds: 0 };
    // Always advance, don't regress watchedSeconds
    const newWatched = Math.max(existing.watchedSeconds || 0, Math.round(watchedSeconds));
    const total = Math.max(60, Math.round(totalSeconds || existing.totalSeconds || 3600));
    const percentage = Math.min(100, Math.round((newWatched / total) * 100));
    // Marked completed strictly when student has actively viewed at least 85%
    const completed = percentage >= 85;

    all[lessonId] = {
      watchedSeconds: newWatched,
      totalSeconds: total,
      percentage,
      completed,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(getStorageKey(studentId), JSON.stringify(all));

    // Also sync to recently viewed videos list
    try {
      const recentKey = getRecentlyViewedKey(studentId);
      const recentList = JSON.parse(localStorage.getItem(recentKey) || '[]');
      let updated = false;
      const mapped = recentList.map(item => {
        if (String(item.id || item.uid) === String(lessonId)) {
          updated = true;
          return {
            ...item,
            watchedSeconds: newWatched,
            totalSeconds: total,
            percentage,
            completed,
            lastViewedAt: new Date().toISOString()
          };
        }
        return item;
      });
      if (updated) {
        localStorage.setItem(recentKey, JSON.stringify(mapped));
      }
    } catch (_) {}

    return all[lessonId];
  } catch (err) {
    console.error('Error saving watch progress:', err);
    return null;
  }
};

export const toggleLessonCompletion = (studentId, lessonId, forceStatus = null) => {
  if (!lessonId) return null;
  try {
    const all = getAllWatchProgress(studentId);
    const existing = all[lessonId] || { watchedSeconds: 0, totalSeconds: 3600, percentage: 0 };
    const newCompleted = forceStatus !== null ? Boolean(forceStatus) : !existing.completed;
    all[lessonId] = {
      ...existing,
      completed: newCompleted,
      percentage: newCompleted ? 100 : (existing.percentage || 0),
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(getStorageKey(studentId), JSON.stringify(all));
    return all[lessonId];
  } catch (err) {
    console.error('Error toggling completion:', err);
    return null;
  }
};

export const savePlaybackPosition = (studentId, lessonId, currentSec, playlistId = null) => {
  if (!lessonId) return;
  try {
    const all = getAllWatchProgress(studentId);
    const existing = all[lessonId] || { watchedSeconds: 0, totalSeconds: 3600, completed: false };
    const pos = Math.max(0, Math.round(currentSec));
    all[lessonId] = {
      ...existing,
      currentPosition: pos,
      lastUpdated: new Date().toISOString()
    };
    if (playlistId) {
      all[`playlist_last_watched_${playlistId}`] = {
        lessonId,
        position: pos,
        updatedAt: new Date().toISOString()
      };
    }
    localStorage.setItem(getStorageKey(studentId), JSON.stringify(all));
  } catch (err) {
    console.error('Error saving playback position:', err);
  }
};

export const getPlaybackPosition = (studentId, lessonId) => {
  if (!lessonId) return 0;
  const all = getAllWatchProgress(studentId);
  return all[lessonId]?.currentPosition || 0;
};

export const getLastWatchedLesson = (studentId, playlistId, lessons = []) => {
  if (!lessons || lessons.length === 0) return { lesson: null, position: 0 };
  const all = getAllWatchProgress(studentId);
  const saved = all[`playlist_last_watched_${playlistId}`];
  if (saved && saved.lessonId) {
    const found = lessons.find(l => String(l.id || l.uid) === String(saved.lessonId));
    if (found) return { lesson: found, position: saved.position || 0 };
  }
  // Find first uncompleted lesson
  const uncompleted = lessons.find(l => !all[String(l.id || l.uid)]?.completed);
  if (uncompleted) {
    const pos = all[String(uncompleted.id || uncompleted.uid)]?.currentPosition || 0;
    return { lesson: uncompleted, position: pos };
  }
  return { lesson: lessons[0], position: 0 };
};

/**
 * Recently Viewed Videos Tracking
 */
const getRecentlyViewedKey = (studentId) => `levlox_recently_viewed_${studentId || 'default'}`;

export const getRecentlyViewedVideos = (studentId) => {
  try {
    const raw = localStorage.getItem(getRecentlyViewedKey(studentId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Error loading recently viewed videos:', err);
    return [];
  }
};

export const saveRecentlyViewedVideo = (studentId, videoItem) => {
  if (!videoItem || (!videoItem.id && !videoItem.uid)) return [];
  try {
    const current = getRecentlyViewedVideos(studentId);
    const id = videoItem.id || videoItem.uid;
    const existingIndex = current.findIndex(v => String(v.id || v.uid) === String(id));
    const progress = getLessonWatchProgress(studentId, id);
    const updatedItem = {
      ...videoItem,
      id,
      title: videoItem.title || videoItem.lesson_title || 'Class Video Session',
      courseTitle: videoItem.courseTitle || videoItem.course_title || videoItem.courseName || 'Python Masterclass',
      thumbnail: videoItem.thumbnail || getResolvedThumbnail(videoItem.video_url || videoItem.videoUrl),
      duration: videoItem.duration || '45 mins',
      percentage: progress?.percentage ?? (videoItem.percentage ?? 0),
      watchedSeconds: progress?.watchedSeconds ?? (videoItem.watchedSeconds ?? 0),
      totalSeconds: progress?.totalSeconds ?? (videoItem.totalSeconds ?? 3600),
      completed: progress?.completed ?? (videoItem.completed ?? false),
      lastViewedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      current.splice(existingIndex, 1);
    }
    const updatedList = [updatedItem, ...current].slice(0, 8); // Keep top 8 recently viewed
    localStorage.setItem(getRecentlyViewedKey(studentId), JSON.stringify(updatedList));

    // Dispatch global event so dashboard updates instantly without full reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('levlox_video_viewed', { detail: updatedItem }));
    }

    return updatedList;
  } catch (err) {
    console.error('Error saving recently viewed video:', err);
    return [];
  }
};
