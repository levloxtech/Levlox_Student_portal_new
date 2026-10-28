/**
 * Backend API Client Service — Levlox Student Portal
 *
 * Interfaces with the self-hosted Express backend for:
 *   - Server-side email delivery via SMTP
 *   - Local storage uploads & video streaming
 *   - Push notifications
 */

import { auth } from "../firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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
 * Supports ANY file type (pdf, docx, zip, rar, tar, images, code files, etc.) up to 250MB.
 */
export async function uploadUniversalFile(file, folder = "assignments") {
  const headers = await getAuthHeader();
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
    throw new Error(err.error || "File upload failed");
  }

  const data = await res.json();
  const fullUrl = data.url.startsWith("http") ? data.url : `${API_BASE_URL}${data.url}`;
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
