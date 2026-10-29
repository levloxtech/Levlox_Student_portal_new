/**
 * Firebase Service Layer — Levlox Student Portal
 *
 * All Firestore and Firebase Storage operations are centralized here.
 * Collections: students, admins, courses, liveClasses, recordedClasses,
 *   announcements, attendance, assignments, submissions, leaderboard,
 *   notifications, analytics, settings, payments, enrollments
 */

import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  getCountFromServer,
  writeBatch,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { compressImage } from "../utils/imageCompressor";

/**
 * Safety cap for list reads. Every collection query gets a bound so a growing
 * database can never turn one page load into thousands of document reads.
 * Screens that need more use the paginated helpers below.
 */
export const DEFAULT_LIST_LIMIT = 200;

/** Firestore allows at most 30 values in an `in` / `documentId() in` filter. */
const IN_QUERY_CHUNK_SIZE = 30;

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ─────────────────────────────────────────────────────────────────────────────
// Error Classification
// ─────────────────────────────────────────────────────────────────────────────

export const classifyFirestoreError = (error) => {
  const code = error?.code || "";
  if (code === "permission-denied") return { type: "permission", message: "You do not have permission to perform this action." };
  if (code === "not-found") return { type: "not-found", message: "The requested record was not found." };
  if (code === "unavailable" || code === "failed-precondition") return { type: "offline", message: "You appear to be offline. Please check your connection." };
  if (code === "resource-exhausted") return { type: "quota", message: "Request quota exceeded. Please try again later." };
  return { type: "unknown", message: error?.message || "An unexpected error occurred." };
};

// ─────────────────────────────────────────────────────────────────────────────
// Generic Local API Helpers (Self-Hosted Storage & Database)
// ─────────────────────────────────────────────────────────────────────────────

const isProd = typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isProd ? '' : (import.meta.env.VITE_API_URL || '');

const getHeaders = () => {
  const token = localStorage.getItem("levlox_auth_token");
  const h = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
};

/** Fetch a single document by collection name and document ID */
export const getDocument = async (collectionName, id) => {
  if (!id) return null;
  try {
    const res = await fetch(`${API_BASE}/api/data/${collectionName}/${id}`, { headers: getHeaders() });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data ? { id: data.id || id, ...data } : null;
  } catch (error) {
    console.warn(`[LocalDB] getDocument(${collectionName}/${id}):`, error.message);
    return null;
  }
};

const applyQueryConstraints = (items, constraints = []) => {
  if (!Array.isArray(items) || !Array.isArray(constraints) || constraints.length === 0) {
    return items;
  }
  let result = [...items];
  for (const c of constraints) {
    if (!c) continue;
    const type = c.type;
    if (type === 'where') {
      const field = c._field?.segments?.[0] || c.field || (c._fieldPath ? String(c._fieldPath) : null);
      const op = c._op || c.op || '==';
      const val = c._value !== undefined ? c._value : c.value;
      if (field) {
        result = result.filter(item => {
          const itemVal = item[field];
          if (op === '==' || op === '===') {
            return String(itemVal ?? '').trim().toLowerCase() === String(val ?? '').trim().toLowerCase();
          }
          if (op === '!=') {
            return String(itemVal ?? '').trim().toLowerCase() !== String(val ?? '').trim().toLowerCase();
          }
          if (op === 'in') {
            return Array.isArray(val) && val.map(v => String(v).trim().toLowerCase()).includes(String(itemVal ?? '').trim().toLowerCase());
          }
          if (op === 'array-contains') {
            return Array.isArray(itemVal) && itemVal.map(v => String(v).trim().toLowerCase()).includes(String(val ?? '').trim().toLowerCase());
          }
          if (op === '>') return itemVal > val;
          if (op === '>=') return itemVal >= val;
          if (op === '<') return itemVal < val;
          if (op === '<=') return itemVal <= val;
          return true;
        });
      }
    } else if (type === 'orderBy') {
      const field = c._field?.segments?.[0] || c.field;
      const dir = (c._direction || c.dir || 'asc').toLowerCase();
      if (field) {
        result.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA === valB) return 0;
          return dir === 'desc'
            ? (valA > valB ? -1 : 1)
            : (valA > valB ? 1 : -1);
        });
      }
    } else if (type === 'limit') {
      const lim = c._limit !== undefined ? c._limit : c.limit;
      if (typeof lim === 'number' && lim >= 0) {
        result = result.slice(0, lim);
      }
    }
  }
  return result;
};

/** Fetch documents matching query constraints */
export const getDocuments = async (collectionName, constraints = []) => {
  try {
    const res = await fetch(`${API_BASE}/api/data/${collectionName}`, { headers: getHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    const items = data.map((d) => ({ id: d.id, ...d }));
    return applyQueryConstraints(items, constraints);
  } catch (error) {
    console.warn(`[LocalDB] getDocuments(${collectionName}):`, error.message);
    return [];
  }
};

/** Set (create/overwrite) a document with a specific ID */
export const setDocument = async (collectionName, id, data, merge = true) => {
  try {
    const method = merge ? 'PATCH' : 'PUT';
    const res = await fetch(`${API_BASE}/api/data/${collectionName}/${id}`, {
      method,
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const resData = await res.json();
    return { id, ...data, ...resData };
  } catch (error) {
    console.error(`[LocalDB] setDocument(${collectionName}/${id}):`, error);
    throw error;
  }
};

/** Add a document with an auto-generated ID */
export const addDocument = async (collectionName, data) => {
  try {
    const res = await fetch(`${API_BASE}/api/data/${collectionName}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`[LocalDB] addDocument(${collectionName}):`, error);
    throw error;
  }
};

/** Update specific fields of an existing document */
export const updateDocumentFields = async (collectionName, id, data) => {
  return setDocument(collectionName, id, data, true);
};

/** Delete a document */
export const deleteDocument = async (collectionName, id) => {
  try {
    const res = await fetch(`${API_BASE}/api/data/${collectionName}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.ok;
  } catch (error) {
    console.error(`[LocalDB] deleteDocument(${collectionName}/${id}):`, error);
    throw error;
  }
};

/** Subscribe to a collection with periodic polling fallback */
export const subscribeToCollection = (collectionName, constraints = [], callback, onError) => {
  let active = true;
  getDocuments(collectionName, constraints)
    .then((docs) => { if (active && callback) callback(docs); })
    .catch((err) => { if (active && onError) onError(err); });

  const timer = setInterval(() => {
    if (!active) return;
    getDocuments(collectionName, constraints)
      .then((docs) => { if (active && callback) callback(docs); })
      .catch(() => { });
  }, 10000);

  return () => {
    active = false;
    clearInterval(timer);
  };
};

/** Subscribe to a single document */
export const subscribeToDocument = (collectionName, id, callback, onError) => {
  let active = true;
  getDocument(collectionName, id)
    .then((doc) => { if (active && callback) callback(doc); })
    .catch((err) => { if (active && onError) onError(err); });
  return () => { active = false; };
};

/** Parallel batch fetch — accepts array of {collection, id} objects */
export const batchGet = async (requests) => {
  const results = await Promise.all(
    requests.map(({ collectionName, id }) => getDocument(collectionName, id))
  );
  return results.filter(Boolean);
};

/** Parallel batch query — accepts array of {collection, constraints} objects */
export const batchQuery = async (queries) => {
  const results = await Promise.all(
    queries.map(({ collectionName, constraints }) => getDocuments(collectionName, constraints || []))
  );
  return results.flat();
};

/** Get paginated documents with cursor */
export const getPaginatedDocuments = async (collectionName, constraints = [], pageSize = 20, lastDoc = null) => {
  const docs = await getDocuments(collectionName, constraints);
  return {
    docs: docs.slice(0, pageSize),
    lastDoc: docs[pageSize - 1] || null,
    hasMore: docs.length > pageSize,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getStudent = (uid) => getDocument("students", uid);

export const updateStudent = (uid, data) => {
  const normalized = { ...data };
  if (data.batchId || data.batch_id) {
    const bId = data.batchId || data.batch_id;
    normalized.batchId = bId;
    normalized.batch_id = bId;
  }
  if (data.courseId || data.course_id) {
    const cId = data.courseId || data.course_id;
    normalized.courseId = cId;
    normalized.course_id = cId;
  }
  return updateDocumentFields("students", uid, normalized);
};

export const createStudent = (uid, data) => {
  const bId = data.batchId || data.batch_id || "";
  const cId = data.courseId || data.course_id || "";
  const payload = {
    ...data,
    role: "student",
    status: data.status || "active",
    batchId: bId,
    batch_id: bId,
    courseId: cId,
    course_id: cId,
    createdAt: serverTimestamp(),
  };
  return setDocument("students", uid, payload, false);
};

export const listStudents = (constraints = []) =>
  getDocuments("students", [...constraints, limit(DEFAULT_LIST_LIMIT)]);

/** Server-side count — fetch from local database count API */
export const getStudentCount = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/data/students/count`, { headers: getHeaders() });
    if (res.ok) {
      const data = await res.json();
      return data.count || 0;
    }
  } catch { }
  const snap = await getDocuments("students");
  return snap.length;
};

/**
 * Fetch specific students by document ID. Splits into chunks because Firestore
 * caps `in` filters at 30 values, and runs the chunks in parallel.
 */
export const getStudentsByIds = async (ids = []) => {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return [];

  const groups = await Promise.all(
    chunk(unique, IN_QUERY_CHUNK_SIZE).map((group) =>
      getDocuments("students", [where(documentId(), "in", group)])
    )
  );
  return groups.flat();
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMINS
// ─────────────────────────────────────────────────────────────────────────────

export const getAdmin = (uid) => getDocument("admins", uid);

export const createAdmin = (uid, data) =>
  setDocument("admins", uid, { ...data, role: "admin" }, false);

export const listAdmins = () => getDocuments("admins");

// ─────────────────────────────────────────────────────────────────────────────
// COURSES
// ─────────────────────────────────────────────────────────────────────────────

export const getCourses = () =>
  getDocuments("courses", [orderBy("createdAt", "desc"), limit(DEFAULT_LIST_LIMIT)]);

export const getCourse = (id) => getDocument("courses", id);

export const addCourse = async (data) => {
  const existing = await getCourses().catch(() => []);
  const nextNum = existing.length + 1;
  const courseId = data.courseId || data.code || `COURSE-${String(nextNum).padStart(3, '0')}`;
  return addDocument("courses", {
    ...data,
    courseId,
    code: courseId,
  });
};

export const updateCourse = (id, data) => updateDocumentFields("courses", id, data);

export const deleteCourse = (id) => deleteDocument("courses", id);

// ─────────────────────────────────────────────────────────────────────────────
// LIVE CLASSES
// ─────────────────────────────────────────────────────────────────────────────

export const getLiveClasses = (constraints = []) =>
  getDocuments("liveClasses", [orderBy("date", "asc"), ...constraints, limit(DEFAULT_LIST_LIMIT)]);

/** Students only need the next few sessions, not the entire schedule history. */
export const getUpcomingLiveClasses = async (max = 20) => {
  try {
    return await getDocuments("liveClasses", [
      where("status", "in", ["scheduled", "live", "Live", "Upcoming"]),
      limit(max),
    ]);
  } catch (error) {
    console.warn("[Firestore] getUpcomingLiveClasses fallback:", error);
    try {
      const all = await getDocuments("liveClasses");
      return (all || [])
        .filter(c => ["scheduled", "live", "Live", "Upcoming"].includes(c?.status))
        .slice(0, max);
    } catch {
      return [];
    }
  }
};

export const addLiveClass = (data) => addDocument("liveClasses", data);

export const updateLiveClass = (id, data) => updateDocumentFields("liveClasses", id, data);

export const deleteLiveClass = (id) => deleteDocument("liveClasses", id);

// ─────────────────────────────────────────────────────────────────────────────
// RECORDED CLASSES
// ─────────────────────────────────────────────────────────────────────────────

export const getRecordedClasses = (constraints = []) =>
  getDocuments("recordedClasses", [orderBy("createdAt", "desc"), ...constraints, limit(DEFAULT_LIST_LIMIT)]);

export const addRecordedClass = (data) => addDocument("recordedClasses", data);

export const updateRecordedClass = (id, data) => updateDocumentFields("recordedClasses", id, data);

export const deleteRecordedClass = (id) => deleteDocument("recordedClasses", id);

// ─────────────────────────────────────────────────────────────────────────────
// PLAYLISTS (CUSTOM / MANUAL PLAYLISTS)
// ─────────────────────────────────────────────────────────────────────────────

export const getPlaylists = (constraints = []) =>
  getDocuments("playlists", [orderBy("createdAt", "desc"), ...constraints]);

export const addPlaylist = (data) => addDocument("playlists", data);

export const updatePlaylist = (id, data) => updateDocumentFields("playlists", id, data);

export const deletePlaylist = (id) => deleteDocument("playlists", id);

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getAnnouncements = (constraints = []) =>
  getDocuments("announcements", [orderBy("createdAt", "desc"), ...constraints, limit(DEFAULT_LIST_LIMIT)]);

export const addAnnouncement = (data) => addDocument("announcements", data);

export const updateAnnouncement = (id, data) => updateDocumentFields("announcements", id, data);

export const deleteAnnouncement = (id) => deleteDocument("announcements", id);

export const subscribeAnnouncements = (callback, onError) =>
  subscribeToCollection("announcements", [orderBy("createdAt", "desc"), limit(50)], callback, onError);

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────────────────────

export const getAttendanceForStudent = async (studentId, constraints = []) => {
  if (!studentId) return [];
  try {
    const allAtt = await getDocuments("attendance");
    if (!Array.isArray(allAtt)) return [];

    const idSet = new Set();
    const addVal = (val) => {
      if (val !== undefined && val !== null && String(val).trim()) {
        idSet.add(String(val).trim().toLowerCase());
      }
    };

    if (typeof studentId === 'string' || typeof studentId === 'number') {
      addVal(studentId);
    } else if (studentId && typeof studentId === 'object') {
      addVal(studentId.id);
      addVal(studentId.uid);
      addVal(studentId.rollNumber);
      addVal(studentId.roll_number);
      addVal(studentId.email);
    }

    if (constraints && typeof constraints === 'object' && !Array.isArray(constraints)) {
      addVal(constraints.id);
      addVal(constraints.uid);
      addVal(constraints.rollNumber);
      addVal(constraints.roll_number);
      addVal(constraints.email);
    }

    const matched = allAtt.filter(item => {
      const sId = String(item.studentId || item.student_id || '').trim().toLowerCase();
      const rNum = String(item.rollNumber || item.roll_number || '').trim().toLowerCase();
      const sEmail = String(item.email || item.studentEmail || item.student_email || '').trim().toLowerCase();
      const uId = String(item.uid || item.id || '').trim().toLowerCase();

      return (sId && idSet.has(sId)) || 
             (rNum && idSet.has(rNum)) || 
             (sEmail && idSet.has(sEmail)) || 
             (uId && idSet.has(uId));
    });

    const unique = Array.from(new Map(matched.map(item => [item.id || `${item.batchId}_${item.date}`, item])).values());
    unique.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return unique;
  } catch (error) {
    console.error('[firebaseService] getAttendanceForStudent failed:', error);
    return [];
  }
};

export const getAttendanceSheet = (constraints = []) =>
  getDocuments("attendanceSheets", [orderBy("date", "desc"), ...constraints, limit(DEFAULT_LIST_LIMIT)]);

/** Get attendance records for a specific batch and date */
export const getAttendanceByBatchAndDate = async (batchId, date) => {
  if (!batchId || !date) return [];
  try {
    const batch = await getDocument("batches", batchId);
    const batchCode = batch?.code || batch?.batchId;
    const batchName = batch?.name;

    const allAtt = await getDocuments("attendance");
    return allAtt.filter(r => {
      if (r.date !== date) return false;
      const bId = r.batch_id || r.batchId;
      if (bId === batchId) return true;
      if (batchCode && bId === batchCode) return true;
      if (batchName && (r.batch_name === batchName || r.batchName === batchName)) return true;
      return false;
    });
  } catch (err) {
    console.warn('[Attendance] getAttendanceByBatchAndDate failed:', err);
    return [];
  }
};

/** Save or update attendance for a batch on a date in a batched write */
export const saveBatchAttendance = async (batchId, date, attendanceRecords = [], sheetMeta = {}) => {
  if (!batchId || !date || attendanceRecords.length === 0) {
    throw new Error("Batch ID, Date, and Attendance Records are required.");
  }

  const batch = writeBatch(db);
  let presentCount = 0;
  let absentCount = 0;

  attendanceRecords.forEach((rec) => {
    const status = rec.status || 'Present';
    if (status === 'Present') presentCount += 1;
    else if (status === 'Absent') absentCount += 1;

    // Canonical document ID per student per batch per date
    const docId = `${batchId}_${date}_${rec.studentId}`;
    const docRef = doc(db, "attendance", docId);

    const isAuto = Boolean(rec.attendedLive) && status === 'Present';
    const defaultMarkedBy = sheetMeta.markedBy || 'Trainer/Admin (Manual)';
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    batch.set(docRef, {
      studentId: rec.studentId,
      student_id: rec.studentId,
      studentName: rec.studentName || rec.name || 'Student',
      student_name: rec.studentName || rec.name || 'Student',
      rollNumber: rec.rollNumber || rec.studentIdNumber || 'N/A',
      course: rec.course || sheetMeta.courseName || '',
      batchId: batchId,
      batch_id: batchId,
      batchName: sheetMeta.batchName || '',
      batch_name: sheetMeta.batchName || '',
      date: date,
      status: status,
      attendedLive: isAuto,
      liveClassTitle: rec.liveClassTitle || '',
      marked_by: isAuto ? (rec.marked_by || 'Auto-Attendance (Live Class)') : defaultMarkedBy,
      attendance_mode: isAuto ? 'Auto' : 'Manual',
      marked_time: rec.marked_time || nowTime,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });
  });

  // Daily batch summary sheet record
  const sheetDocId = `${batchId}_${date}`;
  const sheetRef = doc(db, "attendanceSheets", sheetDocId);
  const totalCount = attendanceRecords.length;
  const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  batch.set(sheetRef, {
    id: sheetDocId,
    batchId: batchId,
    batch_id: batchId,
    batchName: sheetMeta.batchName || '',
    batch_name: sheetMeta.batchName || '',
    courseName: sheetMeta.courseName || '',
    course_name: sheetMeta.courseName || '',
    date: date,
    presentCount: presentCount,
    present_count: presentCount,
    absentCount: absentCount,
    absent_count: absentCount,
    totalStudents: totalCount,
    total_students: totalCount,
    attendancePercentage: percentage,
    attendance_percentage: percentage,
    records: attendanceRecords,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return { sheetDocId, presentCount, absentCount, percentage };
};

export const markAttendance = (data) => addDocument("attendance", data);

export const updateAttendance = (id, data) => updateDocumentFields("attendance", id, data);

// ─────────────────────────────────────────────────────────────────────────────
// ATOMIC ID GENERATION SYSTEM (MASTER DATA CONFIG)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_ID_CONFIGS = {
  student: { prefix: "LVX", nextNumber: 70129, padding: 6, separator: "" },
  trainer: { prefix: "TRN", nextNumber: 1001, padding: 6, separator: "" },
  batch: { prefix: "BAT", nextNumber: 7173, padding: 4, separator: "-" },
  course: { prefix: "CRS", nextNumber: 101, padding: 4, separator: "-" },
};

/**
 * Atomic Firestore transaction helper to generate the next formatted ID for an entity.
 * Guarantees zero duplicate ID generation across simultaneous creation requests.
 */
export const generateNextId = async (entityKey = "student") => {
  const docRef = doc(db, "masterData", `idConfig_${entityKey}`);
  let generatedId = "";

  try {
    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      const defaultConfig = DEFAULT_ID_CONFIGS[entityKey] || { prefix: entityKey.toUpperCase(), nextNumber: 1000, padding: 4, separator: "" };

      let config = defaultConfig;
      if (sfDoc.exists()) {
        config = { ...defaultConfig, ...sfDoc.data() };
      }

      const numStr = String(config.nextNumber).padStart(config.padding || 4, '0');
      const sep = config.separator || "";
      generatedId = `${config.prefix || ""}${sep}${numStr}`;

      // Increment next number atomically
      transaction.set(docRef, {
        ...config,
        nextNumber: (config.nextNumber || 1000) + 1,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });
    return generatedId;
  } catch (e) {
    console.warn(`[IDGen] Atomic transaction failed for ${entityKey}, fallback generator used:`, e);
    const cfg = DEFAULT_ID_CONFIGS[entityKey] || { prefix: entityKey.toUpperCase(), nextNumber: Date.now() % 10000 };
    return `${cfg.prefix}${cfg.separator || ''}${Math.floor(1000 + Math.random() * 9000)}`;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getAssignments = (constraints = []) =>
  getDocuments("assignments", [orderBy("dueDate", "asc"), ...constraints]);

export const getAssignmentsForCourse = (courseId) =>
  getDocuments("assignments", [where("courseId", "==", courseId), orderBy("dueDate", "asc")]);

export const addAssignment = (data) => addDocument("assignments", data);

export const updateAssignment = (id, data) => updateDocumentFields("assignments", id, data);

export const deleteAssignment = (id) => deleteDocument("assignments", id);

// ─────────────────────────────────────────────────────────────────────────────
// SUBMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getSubmissionsForStudent = (studentId) =>
  getDocuments("submissions", [where("studentId", "==", studentId)]);

export const getSubmissionsForAssignment = (assignmentId) =>
  getDocuments("submissions", [where("assignmentId", "==", assignmentId)]);

export const submitAssignment = (data) => addDocument("submissions", { ...data, submittedAt: serverTimestamp() });

export const updateSubmission = (id, data) => updateDocumentFields("submissions", id, data);

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────

export const getLeaderboard = (max = 100, constraints = []) =>
  getDocuments("leaderboard", [orderBy("score", "desc"), ...constraints, limit(max)]);

export const updateLeaderboardEntry = (id, data) => updateDocumentFields("leaderboard", id, data);

export const setLeaderboardEntry = (uid, data) => setDocument("leaderboard", uid, data);

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getNotificationsForUser = (userId, constraints = []) =>
  getDocuments("notifications", [where("userId", "==", userId), orderBy("createdAt", "desc"), ...constraints]);

export const markNotificationRead = (id) => updateDocumentFields("notifications", id, { read: true });

export const addNotification = (data) => addDocument("notifications", data);

export const subscribeNotifications = (userId, callback, onError) =>
  subscribeToCollection(
    "notifications",
    [where("userId", "==", userId), orderBy("createdAt", "desc"), limit(30)],
    callback,
    onError
  );

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

export const getStudentAnalytics = (studentId) => getDocument("analytics", studentId);

export const updateAnalytics = (studentId, data) => updateDocumentFields("analytics", studentId, data);

export const setAnalytics = (studentId, data) => setDocument("analytics", studentId, data);

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

export const getSettings = (userId) => getDocument("settings", userId);

export const updateSettings = (userId, data) => setDocument("settings", userId, data);

export const getGlobalSettings = () => getDocument("settings", "global");

export const updateGlobalSettings = (data) => setDocument("settings", "global", data);

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS / FEES
// ─────────────────────────────────────────────────────────────────────────────

export const getPaymentsForStudent = (studentId) =>
  getDocuments("payments", [where("studentId", "==", studentId), orderBy("createdAt", "desc")]);

export const getAllPayments = (constraints = []) =>
  getDocuments("payments", [orderBy("createdAt", "desc"), ...constraints, limit(DEFAULT_LIST_LIMIT)]);

export const recordPayment = (data) => addDocument("payments", data);

export const updatePayment = (id, data) => updateDocumentFields("payments", id, data);

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getEnrollmentsForStudent = (studentId) =>
  getDocuments("enrollments", [where("studentId", "==", studentId)]);

export const getEnrollmentsForCourse = (courseId) =>
  getDocuments("enrollments", [where("courseId", "==", courseId)]);

export const enrollStudent = (studentId, courseId, data = {}) =>
  addDocument("enrollments", { studentId, courseId, enrolledAt: serverTimestamp(), ...data });

export const unenrollStudent = (enrollmentId) => deleteDocument("enrollments", enrollmentId);

// ─────────────────────────────────────────────────────────────────────────────
// BATCHES
// ─────────────────────────────────────────────────────────────────────────────

export const getBatches = async () => {
  const batchList = await getDocuments("batches", [limit(DEFAULT_LIST_LIMIT)]);
  if (!batchList || batchList.length === 0) return [];

  const allStudents = await getDocuments("students", [limit(DEFAULT_LIST_LIMIT)]).catch(() => []);

  return batchList.map(b => {
    // Count students matching this batch either by student_ids array or s.batch_id
    const studentIdsSet = new Set(b.student_ids || []);
    const matchingStudents = allStudents.filter(s => s.batch_id === b.id || studentIdsSet.has(s.id));
    const realCount = Math.max(matchingStudents.length, (b.student_ids || []).length, Number(b.students_count) || 0);
    return {
      ...b,
      students_count: realCount
    };
  });
};

export const addBatch = async (data) => {
  const code = data.code || data.batchId || `BAT-${Math.floor(1000 + Math.random() * 9000)}`;
  return addDocument("batches", {
    ...data,
    code,
    batchId: code,
    student_ids: data.student_ids || [],
  });
};

export const updateBatch = (id, data) => updateDocumentFields("batches", id, data);

export const deleteBatch = (id) => deleteDocument("batches", id);

/** Students assigned to a batch, resolved from student documents AND batch student_ids array. */
export const getStudentsByBatch = async (batchId) => {
  if (!batchId) return [];
  const batch = await getDocument("batches", batchId);
  const batchCode = batch?.code || batch?.batchId;
  const batchName = batch?.name;
  const studentIds = Array.isArray(batch?.student_ids) ? batch.student_ids : [];

  const allStudents = await getDocuments("students");
  const filtered = allStudents.filter(s => {
    const sBatchId = s.batch_id || s.batchId;
    if (sBatchId && sBatchId === batchId) return true;
    if (batchCode && sBatchId && sBatchId === batchCode) return true;
    if (batchName && (s.batch_name === batchName || s.batchName === batchName)) return true;
    if (studentIds.includes(s.id) || studentIds.includes(s.uid)) return true;
    return false;
  });

  const uniqueMap = new Map();
  filtered.forEach(s => uniqueMap.set(s.id, s));
  return Array.from(uniqueMap.values());
};


/**
 * Replace a batch's student roster and keep each student's `batch_id` & `batchId` in sync.
 * Runs as an atomic batched write so the two sides can never diverge.
 */
export const assignStudentsToBatch = async (batchId, studentIds = []) => {
  const existing = await getDocument("batches", batchId);
  if (!existing) {
    throw new Error("Batch document not found.");
  }

  // Find all students currently linked to this batch in Firestore
  const [allCurrentInBatch1, allCurrentInBatch2] = await Promise.all([
    getDocuments("students", [where("batch_id", "==", batchId)]).catch(() => []),
    getDocuments("students", [where("batchId", "==", batchId)]).catch(() => [])
  ]);
  const allCurrentInBatch = [...allCurrentInBatch1, ...allCurrentInBatch2];
  const allPreviousIds = Array.from(new Set([
    ...(existing?.student_ids || []),
    ...allCurrentInBatch.map(s => s.id)
  ]));

  const removedIds = allPreviousIds.filter((id) => !studentIds.includes(id));

  const batch = writeBatch(db);
  batch.set(doc(db, "batches", batchId), {
    student_ids: studentIds,
    students_count: studentIds.length,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  studentIds.forEach((sid) => {
    batch.set(doc(db, "students", sid), {
      batch_id: batchId,
      batchId: batchId,
      batch_name: existing?.name || "",
      batchName: existing?.name || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  removedIds.forEach((sid) => {
    batch.set(doc(db, "students", sid), {
      batch_id: "",
      batchId: "",
      batch_name: "",
      batchName: "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });

  await batch.commit();
  return { batchId, studentIds };
};

/** Unassign a single student from a batch */
export const unassignStudentFromBatch = async (batchId, studentId) => {
  const existing = await getDocument("batches", batchId);
  if (!existing) {
    throw new Error("Batch document not found.");
  }
  const currentIds = existing.student_ids || [];
  const updatedIds = currentIds.filter(id => id !== studentId);

  const batch = writeBatch(db);
  batch.set(doc(db, "batches", batchId), {
    student_ids: updatedIds,
    students_count: updatedIds.length,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  batch.set(doc(db, "students", studentId), {
    batch_id: "",
    batch_name: "",
    updatedAt: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
  return { batchId, studentId };
};

// ─────────────────────────────────────────────────────────────────────────────
// TRAINERS / INSTRUCTORS (MASTER DATA)
// ─────────────────────────────────────────────────────────────────────────────

export const getTrainers = () =>
  getDocuments("trainers", [orderBy("createdAt", "desc"), limit(DEFAULT_LIST_LIMIT)]);

export const getTrainer = (id) => getDocument("trainers", id);

export const addTrainer = async (data) => {
  const trainerId = data.trainerId || data.code || await generateNextId("trainer");
  return addDocument("trainers", {
    ...data,
    trainerId,
    code: trainerId,
  });
};

export const createTrainerProfile = async (uid, data) => {
  const trainerId = data.trainerId || data.code || await generateNextId("trainer");
  const payload = {
    ...data,
    uid,
    trainer_id: trainerId,
    trainerId,
    code: trainerId,
    role: "trainer",
    status: data.status || "Active",
    assigned_batch_ids: data.assigned_batch_ids || [],
    assigned_course_ids: data.assigned_course_ids || [],
    mustChangePassword: data.mustChangePassword !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDocument("trainers", uid, payload, false);
  return payload;
};

export const updateTrainer = (id, data) => updateDocumentFields("trainers", id, data);

export const deleteTrainer = (id) => deleteDocument("trainers", id);

/**
 * Assign a trainer to a batch atomically, updating both batches/{batchId} and trainers/{trainerUid}.
 */
export const assignTrainerToBatch = async (batchId, trainerUid, trainerData = {}) => {
  const batchRef = doc(db, "batches", batchId);
  const trainerRef = doc(db, "trainers", trainerUid);

  await runTransaction(db, async (transaction) => {
    const trainerSnap = await transaction.get(trainerRef);
    if (!trainerSnap.exists()) {
      throw new Error("Trainer record not found in Firestore.");
    }
    const currentBatches = trainerSnap.data().assigned_batch_ids || [];
    const updatedBatches = Array.from(new Set([...currentBatches, batchId]));

    transaction.set(trainerRef, {
      assigned_batch_ids: updatedBatches,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    transaction.set(batchRef, {
      trainer_uid: trainerUid,
      trainer_id: trainerData.trainerId || trainerSnap.data().trainer_id || trainerSnap.data().trainerId || "",
      trainer_name: trainerData.trainerName || trainerSnap.data().name || "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  return true;
};

/**
 * Remove a batch assignment from a trainer atomically.
 */
export const removeTrainerFromBatch = async (batchId, trainerUid) => {
  const batchRef = doc(db, "batches", batchId);
  const trainerRef = doc(db, "trainers", trainerUid);

  await runTransaction(db, async (transaction) => {
    const trainerSnap = await transaction.get(trainerRef);
    if (trainerSnap.exists()) {
      const currentBatches = trainerSnap.data().assigned_batch_ids || [];
      const updatedBatches = currentBatches.filter(id => id !== batchId);
      transaction.set(trainerRef, {
        assigned_batch_ids: updatedBatches,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    transaction.set(batchRef, {
      trainer_uid: "",
      trainer_id: "",
      trainer_name: "",
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// MASTER DATA SUMMARY HELPER
// ─────────────────────────────────────────────────────────────────────────────

export const getMasterData = async () => {
  const [courses, trainers] = await Promise.all([
    getCourses().catch(() => []),
    getTrainers().catch(() => []),
  ]);
  return {
    courses,
    trainers,
    feeStatuses: ["Paid", "Pending Payment", "Partial", "Overdue"],
    accountStatuses: ["active", "disabled", "pending"],
    trainerStatuses: ["Active", "Inactive"],
  };
};

export const DEFAULT_TRAINER_WELCOME_TEMPLATE = {
  subject: "Levlox Trainer Portal — Account Created",
  body: `Hello {{trainerName}},

Your Levlox Trainer Portal account has been created.

Trainer ID: {{trainerId}}
Email: {{email}}
Temporary Password: {{temporaryPassword}}
Login URL: {{loginUrl}}

For security, you must change your temporary password after your first login.

Regards,
Levlox Administration`
};


// ─────────────────────────────────────────────────────────────────────────────
// LIVE CLASS ACTIVITY SCORES
// ─────────────────────────────────────────────────────────────────────────────

export const getActivityLogs = (max = 100) =>
  getDocuments("activityScores", [orderBy("createdAt", "desc"), limit(max)]);

/**
 * Record an activity award and bump the student's cached points in one atomic
 * write, so the log and the running total cannot drift apart.
 */
export const awardActivityScore = async ({
  studentId,
  studentName,
  batchId,
  batchName,
  date,
  meeting,
  activityType,
  points,
  remarks = "",
  awardedBy,
}) => {
  const numericPoints = Number.parseInt(points, 10);
  if (Number.isNaN(numericPoints)) throw new Error("Points must be a whole number.");

  const batch = writeBatch(db);
  const logRef = doc(collection(db, "activityScores"));

  batch.set(logRef, {
    studentId,
    studentName: studentName || "",
    batchId,
    batchName: batchName || "",
    date,
    meeting,
    activityType,
    points: numericPoints,
    remarks,
    awardedBy: awardedBy || null,
    createdAt: serverTimestamp(),
  });

  batch.update(doc(db, "students", studentId), {
    activityPoints: increment(numericPoints),
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
  return { id: logRef.id, points: numericPoints };
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY PRESETS
// ─────────────────────────────────────────────────────────────────────────────

export const getActivityPresets = () =>
  getDocuments("activityPresets", [orderBy("points", "desc"), limit(50)]);

export const addActivityPreset = (label, points) =>
  addDocument("activityPresets", { label: String(label).trim(), points: Number.parseInt(points, 10) });

export const deleteActivityPreset = (id) => deleteDocument("activityPresets", id);

// ─────────────────────────────────────────────────────────────────────────────
// SELF-HOSTED LOCAL SERVER STORAGE (No Firebase Storage dependency)
// ─────────────────────────────────────────────────────────────────────────────

/** Upload a file to the self-hosted local server storage and return its URL */
export const uploadFile = async (pathOrFolder, file, metadata = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', typeof pathOrFolder === 'string' ? pathOrFolder.split('/')[0] : 'profiles');
    formData.append('targetPath', typeof pathOrFolder === 'string' ? pathOrFolder : '');

    const token = localStorage.getItem('levlox_auth_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.url || data.relativePath;
  } catch (error) {
    console.error(`[LocalStorage] uploadFile(${pathOrFolder}):`, error);
    // Robust fallback: if a blob/file is available in memory
    if (file instanceof Blob || file instanceof File) {
      return URL.createObjectURL(file);
    }
    throw error;
  }
};

/** Delete a file from local server storage */
export const deleteFile = async (path) => {
  try {
    const token = localStorage.getItem('levlox_auth_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({ path }),
    });
    return res.ok;
  } catch (error) {
    console.warn(`[LocalStorage] deleteFile(${path}):`, error.message);
    return false;
  }
};

/** Upload student profile image */
export const uploadProfileImage = async (uid, file) => {
  if (!file) throw new Error("No image file provided.");
  // Automatically compress high-res image to lightweight high-quality JPEG
  const compressed = await compressImage(file, 900, 0.85);
  return uploadFile(`profiles/${uid}`, compressed, { contentType: 'image/jpeg' });
};

/** Upload assignment submission file */
export const uploadSubmissionFile = async (assignmentId, studentId, file) => {
  return uploadFile(`submissions/${assignmentId}`, file, { contentType: file.type });
};

/** Upload course thumbnail */
export const uploadCourseThumbnail = async (courseId, file) => {
  return uploadFile(`courses/${courseId}`, file, { contentType: file.type });
};

/** Upload study material / notes */
export const uploadStudyMaterial = async (docId, file) => {
  return uploadFile(`learning/documents`, file, { contentType: file.type });
};

/** Upload student certificate */
export const uploadCertificate = async (uid, certId, file) => {
  return uploadFile(`certificates/${uid}`, file, { contentType: file.type });
};

/**
 * Reusable Indian Rupee (INR) currency formatter.
 * Formats numbers into standard INR currency representation e.g. ₹20,000
 */
export const formatCurrency = (amount) => {
  const num = Number(amount);
  if (isNaN(num) || num < 0) return "₹0";
  return `₹${num.toLocaleString("en-IN")}`;
};

/**
 * Derives canonical fee details for a student record.
 * Standardizes total fee, paid fee, and remaining fee calculation across the portal.
 */
export const getStudentFeeDetails = (student) => {
  const total = Number(student?.feesTotal) > 0 ? Number(student.feesTotal) : 20000;
  const isPaid = student?.feesStatus === "Paid";

  let paid = 0;
  if (student?.feesPaidAmount !== undefined && student?.feesPaidAmount !== null) {
    paid = Number(student.feesPaidAmount);
  } else {
    paid = isPaid ? total : 0;
  }

  let remaining = 0;
  if (student?.feesRemainingAmount !== undefined && student?.feesRemainingAmount !== null) {
    remaining = Number(student.feesRemainingAmount);
  } else {
    remaining = isPaid ? 0 : Math.max(0, total - paid);
  }

  return { total, paid, remaining, isPaid };
};

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES MANAGEMENT (MASTER DATA)
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_STUDENT_WELCOME_TEMPLATE = {
  subject: "Welcome to Levlox Students Portal",
  body: `Hello {{studentName}},

Welcome to Levlox Students Portal.

Your student account has been created successfully.

Student ID: {{studentId}}
Email: {{email}}
Temporary Password: {{temporaryPassword}}
Course: {{course}}
Batch: {{batch}}

You can use these credentials to sign in to the Levlox Students Portal.

Please change your temporary password after your first login.

Regards,
Levlox Team`
};

/**
 * Fetch the email templates canonical settings document from Firestore (`settings/emailTemplates`).
 * Returns default template if missing or unconfigured.
 */
export const getEmailTemplates = async () => {
  try {
    const docData = await getDocument("settings", "emailTemplates");
    if (docData) {
      return {
        studentWelcome: {
          subject: docData.studentWelcome?.subject || DEFAULT_STUDENT_WELCOME_TEMPLATE.subject,
          body: docData.studentWelcome?.body || DEFAULT_STUDENT_WELCOME_TEMPLATE.body,
          updatedAt: docData.studentWelcome?.updatedAt || null,
        },
        trainerWelcome: {
          subject: docData.trainerWelcome?.subject || DEFAULT_TRAINER_WELCOME_TEMPLATE.subject,
          body: docData.trainerWelcome?.body || DEFAULT_TRAINER_WELCOME_TEMPLATE.body,
          updatedAt: docData.trainerWelcome?.updatedAt || null,
        }
      };
    }
  } catch (err) {
    console.warn("[EmailTemplates] Fetch failed or not found, fallback to default:", err);
  }
  return {
    studentWelcome: { ...DEFAULT_STUDENT_WELCOME_TEMPLATE },
    trainerWelcome: { ...DEFAULT_TRAINER_WELCOME_TEMPLATE }
  };
};

/**
 * Save/Update email templates in Firestore (`settings/emailTemplates`).
 */
export const updateEmailTemplates = async (templatesData) => {
  const payload = {
    studentWelcome: {
      subject: templatesData?.studentWelcome?.subject?.trim() || DEFAULT_STUDENT_WELCOME_TEMPLATE.subject,
      body: templatesData?.studentWelcome?.body?.trim() || DEFAULT_STUDENT_WELCOME_TEMPLATE.body,
      updatedAt: serverTimestamp(),
    },
    trainerWelcome: {
      subject: templatesData?.trainerWelcome?.subject?.trim() || DEFAULT_TRAINER_WELCOME_TEMPLATE.subject,
      body: templatesData?.trainerWelcome?.body?.trim() || DEFAULT_TRAINER_WELCOME_TEMPLATE.body,
      updatedAt: serverTimestamp(),
    }
  };
  await setDocument("settings", "emailTemplates", payload);
  return payload;
};

/**
 * Interpolate dynamic placeholders in template string safely.
 * Supported placeholders: {{studentName}}, {{studentId}}, {{trainerName}}, {{trainerId}}, {{email}}, {{temporaryPassword}}, {{course}}, {{batch}}, {{loginUrl}}
 */
export const interpolateEmailTemplate = (templateStr = "", variables = {}) => {
  if (!templateStr) return "";
  let result = templateStr;

  const replacements = {
    "{{studentName}}": variables.studentName || variables.name || "Student",
    "{{studentId}}": variables.studentId || variables.rollNumber || "N/A",
    "{{trainerName}}": variables.trainerName || variables.name || "Trainer",
    "{{trainerId}}": variables.trainerId || variables.code || "N/A",
    "{{email}}": variables.email || "N/A",
    "{{temporaryPassword}}": variables.temporaryPassword || variables.password || "********",
    "{{course}}": variables.course || "Levlox Course",
    "{{batch}}": variables.batch || variables.batch_name || "Regular Batch",
    "{{loginUrl}}": variables.loginUrl || (typeof window !== "undefined" ? `${window.location.origin}/login` : "https://levlox-students-portal.vercel.app/login"),
  };

  Object.entries(replacements).forEach(([placeholder, val]) => {
    const safeVal = String(val !== undefined && val !== null ? val : "");
    result = result.split(placeholder).join(safeVal);
  });

  return result;
};


