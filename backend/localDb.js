/**
 * Levlox Student Portal — Self-Hosted Local Database Engine
 *
 * Stores all portal collections locally on the server filesystem in storage/data/*.json
 * Eliminates external Firebase dependency entirely.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(__dirname, '..', 'storage');
const DATA_DIR = path.join(STORAGE_ROOT, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache for fast reads
const cache = {};

function getCollectionFilePath(name) {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(DATA_DIR, `${safeName}.json`);
}

const mtimes = {};

function loadCollection(name, forceReload = false) {
  const filePath = getCollectionFilePath(name);
  if (!fs.existsSync(filePath)) {
    cache[name] = [];
    return cache[name];
  }
  try {
    const stat = fs.statSync(filePath);
    if (!forceReload && cache[name] && mtimes[name] === stat.mtimeMs) {
      return cache[name];
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    cache[name] = Array.isArray(parsed) ? parsed : [];
    mtimes[name] = stat.mtimeMs;
  } catch (err) {
    console.error(`[LocalDb] Failed to read collection ${name}:`, err.message);
    if (!cache[name]) cache[name] = [];
  }
  return cache[name];
}

function saveCollection(name, data) {
  if (data !== undefined) {
    cache[name] = data;
  }
  const filePath = getCollectionFilePath(name);
  const toSave = cache[name] || [];
  try {
    const tempPath = `${filePath}.tmp_${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(toSave, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
  } catch (err) {
    console.error(`[LocalDb] Failed to write collection ${name}:`, err.message);
  }
}

// Password helpers
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const verify = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return verify === hash;
}

// Database operations
function getDocuments(name, filterFn) {
  const items = loadCollection(name);
  if (typeof filterFn === 'function') {
    return items.filter(filterFn);
  }
  return [...items];
}

function getDocument(name, id) {
  const items = loadCollection(name);
  if (!id) return null;
  const cleanId = String(id).trim();

  // 1. Exact match by id, uid, or _id
  let found = items.find((item) => String(item.id) === cleanId || String(item.uid) === cleanId || String(item._id) === cleanId);
  if (found) return found;

  // 2. Case-insensitive or prefix/suffix match (handles trailing typo or appended chars)
  found = items.find((item) => {
    const itemId = String(item.id || item.uid || item._id || '').trim();
    if (!itemId) return false;
    if (itemId.toLowerCase() === cleanId.toLowerCase()) return true;
    if (itemId.length >= 6 && cleanId.length >= 6) {
      if (cleanId.startsWith(itemId) || itemId.startsWith(cleanId)) return true;
    }
    return false;
  });

  return found || null;
}

function addDocument(name, data) {
  const items = loadCollection(name);
  const id = data.id || data.uid || `doc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const now = new Date().toISOString();
  const doc = {
    ...data,
    id,
    uid: id,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };
  items.push(doc);
  saveCollection(name);
  return doc;
}

function setDocument(name, id, data, merge = true) {
  const items = loadCollection(name);
  const now = new Date().toISOString();
  const cleanId = String(id || '').trim();
  let index = items.findIndex((item) => String(item.id) === cleanId || String(item.uid) === cleanId || String(item._id) === cleanId);
  if (index === -1 && cleanId.length >= 6) {
    index = items.findIndex((item) => {
      const itemId = String(item.id || item.uid || item._id || '').trim();
      return itemId.length >= 6 && (cleanId.startsWith(itemId) || itemId.startsWith(cleanId));
    });
  }

  let finalDoc;
  if (index !== -1) {
    const existingId = items[index].id || items[index].uid || cleanId;
    if (merge) {
      finalDoc = { ...items[index], ...data, id: existingId, uid: existingId, updatedAt: now };
    } else {
      finalDoc = { ...data, id: existingId, uid: existingId, updatedAt: now };
    }
    items[index] = finalDoc;
  } else {
    finalDoc = { ...data, id: cleanId, uid: cleanId, createdAt: data.createdAt || now, updatedAt: now };
    items.push(finalDoc);
  }
  saveCollection(name);
  return finalDoc;
}

function updateDocument(name, id, patch) {
  return setDocument(name, id, patch, true);
}

function deleteDocument(name, id) {
  const items = loadCollection(name);
  const initialLength = items.length;
  const targetId = String(id || '').trim();
  if (!targetId) return false;
  cache[name] = items.filter((item) => {
    const iId = String(item.id || '').trim();
    const iUid = String(item.uid || '').trim();
    const iUnderscoreId = String(item._id || '').trim();
    return iId !== targetId && iUid !== targetId && iUnderscoreId !== targetId;
  });
  if (cache[name].length !== initialLength) {
    saveCollection(name);
    return true;
  }
  return false;
}

// User & Super Admin Initialization
const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'levloxtech@gmail.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Root@123';

function ensureSuperAdmin() {
  const users = loadCollection('users');
  const adminEmails = [
    DEFAULT_ADMIN_EMAIL.toLowerCase(),
  ].filter(Boolean);

  const { salt, hash } = hashPassword(DEFAULT_ADMIN_PASSWORD);

  adminEmails.forEach((email) => {
    let adminUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    const adminId = 'super_admin_001';

    if (!adminUser) {
      adminUser = {
        id: adminId,
        uid: adminId,
        email: email.toLowerCase(),
        name: 'Levlox Admin',
        role: 'admin',
        status: 'active',
        salt,
        passwordHash: hash,
        createdAt: new Date().toISOString(),
      };
      users.push(adminUser);
      console.log(`[LocalDb] Created Admin account: ${email}`);
    } else {
      adminUser.role = 'admin';
      adminUser.status = 'active';
      adminUser.salt = salt;
      adminUser.passwordHash = hash;
    }

    setDocument('admins', adminUser.id, {
      id: adminUser.id,
      uid: adminUser.id,
      name: adminUser.name || 'Levlox Admin',
      email: adminUser.email,
      role: 'admin',
      status: 'active',
    }, true);
  });

  saveCollection('users');
  saveCollection('admins');
}

// Persistent token storage with Single-Device Concurrent Session Enforcement
function createSession(user) {
  const targetId = user.id || user.uid;
  const targetEmail = (user.email || '').toLowerCase().trim();

  // SINGLE DEVICE POLICY:
  // Revoke all prior active sessions for this user so only one device can access the portal at a time.
  const sessions = loadCollection('sessions');
  const filtered = sessions.filter((s) => {
    if (targetId && (String(s.userId) === String(targetId) || String(s.uid) === String(targetId))) return false;
    if (targetEmail && (s.email || '').toLowerCase().trim() === targetEmail) return false;
    return true;
  });

  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    token,
    userId: targetId,
    email: targetEmail,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  filtered.push(session);
  cache['sessions'] = filtered;
  saveCollection('sessions');
  return token;
}

function verifySession(token) {
  if (!token) return null;
  const sessions = loadCollection('sessions');
  const session = sessions.find((s) => s.token === token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    revokeSession(token);
    return null;
  }
  // Verify user still exists in users collection
  const users = loadCollection('users');
  const user = users.find((u) =>
    (session.userId && (String(u.id) === String(session.userId) || String(u.uid) === String(session.userId))) ||
    (session.email && (u.email || '').toLowerCase() === (session.email || '').toLowerCase())
  );
  if (!user) {
    revokeSession(token);
    return null;
  }
  return session;
}

function revokeSession(token) {
  const sessions = loadCollection('sessions');
  const filtered = sessions.filter((s) => s.token !== token);
  cache['sessions'] = filtered;
  saveCollection('sessions');
}

function revokeUserSessions(userId, email) {
  const sessions = loadCollection('sessions');
  const targetId = userId ? String(userId).trim() : null;
  const targetEmail = email ? String(email).trim().toLowerCase() : null;
  const filtered = sessions.filter((s) => {
    if (targetId && (String(s.userId) === targetId || String(s.uid) === targetId)) return false;
    if (targetEmail && (s.email || '').toLowerCase().trim() === targetEmail) return false;
    return true;
  });
  cache['sessions'] = filtered;
  saveCollection('sessions');
}

function purgeUserCompletely(identifier, explicitEmail) {
  const emailsToPurge = new Set();
  const idsToPurge = new Set();

  if (explicitEmail && typeof explicitEmail === 'string' && explicitEmail.trim()) {
    emailsToPurge.add(explicitEmail.trim().toLowerCase());
  }

  const idStr = identifier ? String(identifier).trim() : null;
  if (idStr) {
    if (idStr.includes('@')) {
      emailsToPurge.add(idStr.toLowerCase());
    } else {
      idsToPurge.add(idStr);
    }
  }

  // 1. Scan students to discover linked email and IDs
  try {
    const students = loadCollection('students');
    students.forEach((s) => {
      const matchId = (s.id && idsToPurge.has(String(s.id))) || (s.uid && idsToPurge.has(String(s.uid))) || (s.rollNumber && idsToPurge.has(String(s.rollNumber)));
      const matchEmail = s.email && emailsToPurge.has(String(s.email).trim().toLowerCase());
      if (matchId || matchEmail) {
        if (s.id) idsToPurge.add(String(s.id));
        if (s.uid) idsToPurge.add(String(s.uid));
        if (s.rollNumber) idsToPurge.add(String(s.rollNumber));
        if (s.email) emailsToPurge.add(String(s.email).trim().toLowerCase());
      }
    });
  } catch (_) {}

  // 2. Scan users
  try {
    const users = loadCollection('users');
    users.forEach((u) => {
      const matchId = (u.id && idsToPurge.has(String(u.id))) || (u.uid && idsToPurge.has(String(u.uid)));
      const matchEmail = u.email && emailsToPurge.has(String(u.email).trim().toLowerCase());
      if (matchId || matchEmail) {
        if (u.id) idsToPurge.add(String(u.id));
        if (u.uid) idsToPurge.add(String(u.uid));
        if (u.email) emailsToPurge.add(String(u.email).trim().toLowerCase());
      }
    });
  } catch (_) {}

  // 3. Scan leads
  try {
    const leads = loadCollection('leads');
    leads.forEach((l) => {
      const matchId = (l.id && idsToPurge.has(String(l.id))) || (l.studentId && idsToPurge.has(String(l.studentId)));
      const matchEmail = l.email && emailsToPurge.has(String(l.email).trim().toLowerCase());
      if (matchId || matchEmail) {
        if (l.id) idsToPurge.add(String(l.id));
        if (l.studentId) idsToPurge.add(String(l.studentId));
        if (l.email) emailsToPurge.add(String(l.email).trim().toLowerCase());
      }
    });
  } catch (_) {}

  // 4. Scan memberships
  try {
    const memberships = loadCollection('memberships');
    memberships.forEach((m) => {
      const matchId = (m.id && idsToPurge.has(String(m.id))) || (m.studentId && idsToPurge.has(String(m.studentId)));
      const matchEmail = m.email && emailsToPurge.has(String(m.email).trim().toLowerCase());
      if (matchId || matchEmail) {
        if (m.id) idsToPurge.add(String(m.id));
        if (m.studentId) idsToPurge.add(String(m.studentId));
        if (m.email) emailsToPurge.add(String(m.email).trim().toLowerCase());
      }
    });
  } catch (_) {}

  // Perform permanent cleanups across collections:
  // students
  try {
    const students = loadCollection('students');
    const filtered = students.filter(s => {
      if (s.id && idsToPurge.has(String(s.id))) return false;
      if (s.uid && idsToPurge.has(String(s.uid))) return false;
      if (s.rollNumber && idsToPurge.has(String(s.rollNumber))) return false;
      if (s.email && emailsToPurge.has(String(s.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['students'] = filtered;
    saveCollection('students');
  } catch (_) {}

  // users
  try {
    const users = loadCollection('users');
    const filtered = users.filter(u => {
      if (u.id && idsToPurge.has(String(u.id))) return false;
      if (u.uid && idsToPurge.has(String(u.uid))) return false;
      if (u.email && emailsToPurge.has(String(u.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['users'] = filtered;
    saveCollection('users');
  } catch (_) {}

  // leads
  try {
    const leads = loadCollection('leads');
    const filtered = leads.filter(l => {
      if (l.id && idsToPurge.has(String(l.id))) return false;
      if (l.studentId && idsToPurge.has(String(l.studentId))) return false;
      if (l.email && emailsToPurge.has(String(l.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['leads'] = filtered;
    saveCollection('leads');
  } catch (_) {}

  // memberships
  try {
    const memberships = loadCollection('memberships');
    const filtered = memberships.filter(m => {
      if (m.id && idsToPurge.has(String(m.id))) return false;
      if (m.studentId && idsToPurge.has(String(m.studentId))) return false;
      if (m.email && emailsToPurge.has(String(m.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['memberships'] = filtered;
    saveCollection('memberships');
  } catch (_) {}

  // store_credits
  try {
    const credits = loadCollection('store_credits');
    const filtered = credits.filter(c => {
      if (c.email && emailsToPurge.has(String(c.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['store_credits'] = filtered;
    saveCollection('store_credits');
  } catch (_) {}

  // deletedUsers
  try {
    const deleted = loadCollection('deletedUsers');
    const filtered = deleted.filter(d => {
      if (d.uid && idsToPurge.has(String(d.uid))) return false;
      if (d.email && emailsToPurge.has(String(d.email).trim().toLowerCase())) return false;
      return true;
    });
    cache['deletedUsers'] = filtered;
    saveCollection('deletedUsers');
  } catch (_) {}

  // batches - remove from student_ids list
  try {
    const batches = loadCollection('batches');
    let batchesChanged = false;
    batches.forEach(b => {
      if (Array.isArray(b.student_ids)) {
        const origLen = b.student_ids.length;
        b.student_ids = b.student_ids.filter(sid => !idsToPurge.has(String(sid)));
        if (b.student_ids.length !== origLen) batchesChanged = true;
      }
    });
    if (batchesChanged) {
      cache['batches'] = batches;
      saveCollection('batches');
    }
  } catch (_) {}

  // Revoke sessions
  for (const email of emailsToPurge) {
    revokeUserSessions(null, email);
  }
  for (const id of idsToPurge) {
    revokeUserSessions(id, null);
  }

  return {
    purgedEmails: Array.from(emailsToPurge),
    purgedIds: Array.from(idsToPurge)
  };
}

ensureSuperAdmin();

module.exports = {
  loadCollection,
  saveCollection,
  getDocuments,
  getDocument,
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  purgeUserCompletely,
  hashPassword,
  verifyPassword,
  ensureSuperAdmin,
  createSession,
  verifySession,
  revokeSession,
  revokeUserSessions,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
};
