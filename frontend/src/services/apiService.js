/**
 * Backend API Client Service — Levlox Student Portal
 *
 * Interfaces with the self-hosted Express backend for:
 *   - Server-side email delivery via SMTP
 *   - Local storage uploads & video streaming
 *   - Push notifications
 */

import { auth } from "../firebase";

const isProd = typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE_URL = isProd ? '' : (import.meta.env.VITE_API_URL || '');

/**
 * Get current Firebase Auth ID Token for authenticated API calls.
 */
export async function getAuthHeader() {
  try {
    const localToken = localStorage.getItem("levlox_auth_token");
    if (localToken) {
      return { Authorization: `Bearer ${localToken}` };
    }
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      return { Authorization: `Bearer ${token}` };
    }
  } catch (err) {
    console.warn("[API] Could not get auth token:", err.message);
  }
  return {};
}

/**
 * Check backend health status.
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { online: false };
    const data = await res.json();
    return { online: true, ...data };
  } catch {
    return { online: false };
  }
}

/**
 * Send an email via the backend SMTP transporter.
 */
export async function sendBackendEmail({
  to,
  subject,
  text,
  html,
  recipientUid,
  recipientType = "student",
  templateName = "custom",
}) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/api/email/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      to,
      subject,
      text,
      html,
      recipientUid,
      recipientType,
      templateName,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Email failed with status ${res.status}`);
  }

  return await res.json();
}

/**
 * Upload a video to self-hosted storage.
 */
export async function uploadVideoToBackend(file) {
  const headers = await getAuthHeader();
  const formData = new FormData();
  formData.append("video", file);

  const res = await fetch(`${API_BASE_URL}/api/storage/video/upload`, {
    method: "POST",
    headers: { ...headers },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Video upload failed");
  }

  const data = await res.json();
  // Construct absolute streaming URL if returned relative
  const streamUrl = data.streamUrl.startsWith("http")
    ? data.streamUrl
    : `${API_BASE_URL}${data.streamUrl}`;

  return {
    ...data,
    streamUrl,
    url: streamUrl,
  };
}

/**
 * Upload a thumbnail image to self-hosted storage.
 */
export async function uploadThumbnailToBackend(file) {
  const headers = await getAuthHeader();
  const formData = new FormData();
  formData.append("thumbnail", file);

  const res = await fetch(`${API_BASE_URL}/api/storage/thumbnail/upload`, {
    method: "POST",
    headers: { ...headers },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Thumbnail upload failed");
  }

  const data = await res.json();
  const fullUrl = data.url.startsWith("http") ? data.url : `${API_BASE_URL}${data.url}`;
  return { ...data, url: fullUrl };
}

/**
 * Upload a document to self-hosted storage.
 */
export async function uploadDocumentToBackend(file) {
  const headers = await getAuthHeader();
  const formData = new FormData();
  formData.append("document", file);

  const res = await fetch(`${API_BASE_URL}/api/storage/document/upload`, {
    method: "POST",
    headers: { ...headers },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Document upload failed");
  }

  const data = await res.json();
  const fullUrl = data.url.startsWith("http") ? data.url : `${API_BASE_URL}${data.url}`;
  return { ...data, url: fullUrl };
}

/**
 * Upload profile photo to self-hosted storage.
 */
export async function uploadProfilePhotoToBackend(file) {
  const headers = await getAuthHeader();
  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch(`${API_BASE_URL}/api/storage/profile/upload`, {
    method: "POST",
    headers: { ...headers },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Profile photo upload failed");
  }

  const data = await res.json();
  const fullUrl = data.url.startsWith("http") ? data.url : `${API_BASE_URL}${data.url}`;
  return { ...data, url: fullUrl };
}

/**
 * Send notification for a newly scheduled live class.
 */
export async function notifyLiveClass({
  classId,
  batchId,
  trainerId,
  title,
  date,
  time,
  meetLink,
}) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/api/notifications/live-class`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      classId,
      batchId,
      trainerId,
      title,
      date,
      time,
      meetLink,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Live class notification broadcast failed");
  }

  return await res.json();
}

/**
 * Broadcast notifications to multiple users.
 */
export async function broadcastNotification({
  userIds,
  title,
  message,
  type = "system",
  data = {},
  link = null,
}) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_BASE_URL}/api/notifications/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      userIds,
      title,
      message,
      type,
      data,
      link,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Notification creation failed");
  }

  return await res.json();
}

/**
 * Universal file upload to self-hosted storage.
 * Supports ANY file type (pdf, docx, zip, rar, tar, images, code files, etc.) up to 500MB.
 * Automatically slices files > 2.5MB into 2MB chunks to guarantee 0 payload errors across Vercel, Cloudflare, and ISPs.
 */
export async function uploadUniversalFile(file, folder = "assignments", onProgress = null) {
  const headers = await getAuthHeader();

  // If file <= 2.5MB, upload directly in one quick request
  if (!file || file.size <= 2.5 * 1024 * 1024) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const res = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: { ...headers },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `File upload failed with status ${res.status}`);
    }

    const data = await res.json();
    const cleanPath = data.url ? data.url.replace(/^https?:\/\/[^\/]+/, '') : '';
    const fullUrl = cleanPath ? `${API_BASE_URL}${cleanPath}` : data.url;
    if (onProgress) onProgress(100);
    return {
      ...data,
      url: fullUrl,
      originalName: data.originalName || file.name,
      fileName: data.filename || file.name,
      size: data.size || file.size,
      sizeDisplay: data.sizeDisplay || (file.size / (1024 * 1024)).toFixed(2) + " MB",
      fileType: file.name.split(".").pop()?.toLowerCase() || "file",
    };
  }

  // For files > 2.5MB (videos & large assets), use robust 2MB chunking
  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk size strictly under Vercel's 4.5MB limit
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let finalResult = null;

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    const chunkFormData = new FormData();
    chunkFormData.append("chunkIndex", String(i));
    chunkFormData.append("totalChunks", String(totalChunks));
    chunkFormData.append("uploadId", uploadId);
    chunkFormData.append("fileName", file.name);
    chunkFormData.append("folder", folder);
    chunkFormData.append("file", chunk, `${i}.part`);

    let chunkOk = false;
    let lastErr = null;

    // Retry up to 3 times per chunk
    for (let retry = 0; retry < 3; retry++) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/upload-chunk`, {
          method: "POST",
          headers: { ...headers },
          body: chunkFormData
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.assembled) {
            finalResult = resData;
          }
          chunkOk = true;
          if (onProgress) {
            const pct = Math.min(99, Math.round(((i + 1) / totalChunks) * 100));
            onProgress(pct);
          }
          break;
        } else {
          const errBody = await res.json().catch(() => ({}));
          lastErr = new Error(errBody.error || `Chunk ${i + 1}/${totalChunks} failed (HTTP ${res.status})`);
        }
      } catch (netErr) {
        lastErr = netErr;
      }
      await new Promise(r => setTimeout(r, 800));
    }

    if (!chunkOk) {
      throw lastErr || new Error(`Upload failed on chunk ${i + 1} of ${totalChunks}`);
    }
  }

  if (!finalResult) {
    throw new Error("File upload could not be finalized on server.");
  }

  if (onProgress) onProgress(100);

  const cleanPath = finalResult.url ? finalResult.url.replace(/^https?:\/\/[^\/]+/, '') : '';
  const fullUrl = cleanPath ? `${API_BASE_URL}${cleanPath}` : finalResult.url;
  return {
    ...finalResult,
    url: fullUrl,
    originalName: finalResult.originalName || file.name,
    fileName: finalResult.filename || file.name,
    size: finalResult.size || file.size,
    sizeDisplay: finalResult.sizeDisplay || (file.size / (1024 * 1024)).toFixed(2) + " MB",
    fileType: file.name.split(".").pop()?.toLowerCase() || "file",
  };
}

/**
 * Generate direct download link for an uploaded file with Content-Disposition header.
 */
export function getDownloadUrl(filePathOrUrl, originalName = "") {
  if (!filePathOrUrl) return "";
  let clean = filePathOrUrl;
  if (clean.startsWith("http")) {
    try {
      const u = new URL(clean);
      clean = u.pathname;
    } catch {
      // ignore
    }
  }
  const params = new URLSearchParams({ path: clean });
  if (originalName) params.append("name", originalName);
  return `${API_BASE_URL}/api/download?${params.toString()}`;
}

export default {
  API_BASE_URL,
  checkBackendHealth,
  sendBackendEmail,
  uploadVideoToBackend,
  uploadThumbnailToBackend,
  uploadDocumentToBackend,
  uploadProfilePhotoToBackend,
  uploadUniversalFile,
  getDownloadUrl,
  notifyLiveClass,
  broadcastNotification,
};
