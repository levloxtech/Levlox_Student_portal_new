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

// Persistent token storage
function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  const session = {
    token,
    userId: user.id || user.uid,
    email: user.email,
    role: user.role,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  const sessions = loadCollection('sessions');
  sessions.push(session);
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
