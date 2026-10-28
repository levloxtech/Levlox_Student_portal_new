/**
 * Levlox Student Portal — Trainer Service
 *
 * 100% Local Database Engine — No external Firebase dependency.
 * Persists all trainer data locally via http://localhost:4000/api/data/*
 */

import { 
  getDocuments, 
  getDocument,
  addDocument,
  updateDocumentFields,
  deleteDocument,
  uploadProfileImage
} from './firebaseService';

/**
 * Fetch all batches assigned to a trainer.
 * Combines query by trainer_uid and assigned_batch_ids array.
 */
export const getTrainerBatches = async (trainerUid, assignedBatchIds = []) => {
  if (!trainerUid) return [];

  try {
    const allBatches = await getDocuments("batches");
    const assignedSet = new Set((assignedBatchIds || []).map(String));

    const matchedBatches = allBatches.filter(b => {
      const bId = String(b.id || b.uid || '');
      const isOwner = String(b.trainer_uid || '') === String(trainerUid);
      const isAssigned = assignedSet.has(bId);
      return isOwner || isAssigned;
    });

    // Enrich with accurate student counts
    const allStudents = await getDocuments("students").catch(() => []);
    return matchedBatches.map(b => {
      const bId = String(b.id || b.uid || '');
      const studentIdsSet = new Set(b.student_ids || []);
      const matchingStudents = allStudents.filter(s => 
        String(s.batch_id || s.batchId || '') === bId || 
        studentIdsSet.has(s.id) || 
        studentIdsSet.has(s.uid)
      );
      const realCount = Math.max(matchingStudents.length, (b.student_ids || []).length, Number(b.students_count) || 0);
      return {
        ...b,
        students_count: realCount
      };
    });
  } catch (err) {
    console.error("[trainerService] getTrainerBatches error:", err);
    return [];
  }
};

/**
 * Fetch all students belonging to the trainer's assigned batches.
 */
export const getTrainerStudents = async (assignedBatchIds = []) => {
  if (!assignedBatchIds || assignedBatchIds.length === 0) return [];

  try {
    const allStudents = await getDocuments("students");
    const assignedSet = new Set((assignedBatchIds || []).map(String));

    return allStudents.filter(s => {
      const bId = String(s.batch_id || s.batchId || '');
      return assignedSet.has(bId);
    });
  } catch (err) {
    console.error("[trainerService] getTrainerStudents error:", err);
    return [];
  }
};

/**
 * Fetch attendance sheets / history for trainer's assigned batches.
 */
export const getTrainerAttendanceSheets = async (assignedBatchIds = []) => {
  if (!assignedBatchIds || assignedBatchIds.length === 0) return [];

  try {
    const allSheets = await getDocuments("attendanceSheets");
    const assignedSet = new Set((assignedBatchIds || []).map(String));

    const filtered = allSheets.filter(sheet => {
      const bId = String(sheet.batchId || sheet.batch_id || '');
      return assignedSet.has(bId);
    });

    filtered.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    return filtered;
  } catch (err) {
    console.error("[trainerService] getTrainerAttendanceSheets error:", err);
    return [];
  }
};

/**
 * Fetch live classes scheduled for trainer's assigned batches or created by trainer.
 */
export const getTrainerLiveClasses = async (trainerUid, assignedBatchIds = []) => {
  try {
    const allLive = await getDocuments("liveClasses");
    const assignedSet = new Set((assignedBatchIds || []).map(String));

    const filtered = allLive.filter(lc => {
      const isOwner = trainerUid && String(lc.trainer_uid || '') === String(trainerUid);
      const bId = String(lc.batchId || lc.batch_id || '');
      const isBatchMatch = assignedSet.has(bId);
      return isOwner || isBatchMatch;
    });

    filtered.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
    return filtered;
  } catch (err) {
    console.error("[trainerService] getTrainerLiveClasses error:", err);
    return [];
  }
};

/**
 * Schedule a new live class.
 */
export const createTrainerLiveClass = async (trainerUid, trainerName, data) => {
  const now = new Date().toISOString();
  const payload = {
    ...data,
    trainer_uid: trainerUid,
    trainer_name: trainerName,
    status: data.status || "Upcoming",
    createdAt: now,
    updatedAt: now,
  };
  return addDocument("liveClasses", payload);
};

/**
 * Fetch recorded classes for assigned courses/batches.
 */
export const getTrainerRecordedClasses = async (assignedBatchIds = [], assignedCourseIds = []) => {
  try {
    const list = await getDocuments("recordedClasses");
    if (!assignedBatchIds.length && !assignedCourseIds.length) return list;

    const batchSet = new Set((assignedBatchIds || []).map(String));
    const courseSet = new Set((assignedCourseIds || []).map(String));

    return list.filter(item => {
      const bId = String(item.batch_id || item.batchId || '');
      const cId = String(item.course_id || item.courseId || '');
      // If the recording has no specific batch assigned, it's global for all batches
      if (!bId && !cId) return true;
      const bMatch = bId ? batchSet.has(bId) : false;
      const cMatch = cId ? courseSet.has(cId) : false;
      return bMatch || cMatch;
    });
  } catch (err) {
    console.error("[trainerService] getTrainerRecordedClasses error:", err);
    return [];
  }
};

/**
 * Add a recorded class / video lesson.
 */
export const createTrainerRecordedClass = async (data) => {
  const now = new Date().toISOString();
  return addDocument("recordedClasses", {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
};

/**
 * Fetch announcements for trainer's assigned batches.
 */
export const getTrainerAnnouncements = async (assignedBatchIds = []) => {
  try {
    const list = await getDocuments("announcements");
    if (!assignedBatchIds || assignedBatchIds.length === 0) return list;

    const assignedSet = new Set(assignedBatchIds.map(String));

    return list.filter(item => {
      const bId = String(item.batchId || item.batch_id || '');
      if (!bId) return true; // global
      return assignedSet.has(bId);
    });
  } catch (err) {
    console.error("[trainerService] getTrainerAnnouncements error:", err);
    return [];
  }
};

/**
 * Create announcement for assigned batch.
 */
export const createTrainerAnnouncement = async (trainerName, data) => {
  const now = new Date().toISOString();
  const payload = {
    ...data,
    author: trainerName,
    createdAt: now,
    updatedAt: now,
  };
  return addDocument("announcements", payload);
};

/**
 * Upload trainer profile photo to local server storage and update trainers/{uid}.
 */
export const uploadTrainerProfilePic = async (uid, file) => {
  if (!file) throw new Error("No image file selected.");
  const downloadUrl = await uploadProfileImage(uid, file);
  await updateDocumentFields("trainers", uid, {
    profilePic: downloadUrl,
    profile_pic: downloadUrl,
    updatedAt: new Date().toISOString(),
  });
  return downloadUrl;
};
