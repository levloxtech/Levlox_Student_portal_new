import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getStudent, getAdmin, getDocument } from '../services/firebaseService';

const AuthContext = createContext(null);

const TOKEN_KEY = 'levlox_auth_token';
const USER_KEY = 'levlox_auth_user';
const PROFILE_KEY = 'levlox_profile_cache';
const isProd = typeof window !== 'undefined' && window.location && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const API_BASE = isProd ? '' : (import.meta.env.VITE_API_URL || '');

const readSavedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const readSavedProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const initialUser = readSavedUser();
  const initialProfile = readSavedProfile();

  const [currentUser, setCurrentUser] = useState(initialUser);
  const [userProfile, setUserProfile] = useState(initialProfile || initialUser);
  const [userRole, setUserRole] = useState(initialUser?.role || null);
  const [authLoading, setAuthLoading] = useState(!initialUser);
  const [authError, setAuthError] = useState(null);

  const loadedUidRef = useRef(initialUser?.id || initialUser?.uid || null);

  // Validate session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setCurrentUser(null);
      setUserProfile(null);
      setUserRole(null);
      setAuthLoading(false);
      return;
    }

    // Verify token with backend
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Session expired');
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          const userObj = { ...data.user, uid: data.user.id || data.user.uid };
          const profileObj = data.profile || userObj;
          setCurrentUser(userObj);
          setUserProfile(profileObj);
          setUserRole(userObj.role);
          localStorage.setItem(USER_KEY, JSON.stringify(userObj));
          localStorage.setItem(PROFILE_KEY, JSON.stringify(profileObj));
        }
      })
      .catch(() => {
        // Clear invalid session
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(PROFILE_KEY);
        setCurrentUser(null);
        setUserProfile(null);
        setUserRole(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, []);

  const loginWithCredentials = useCallback(async (identifier, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      const token = data.token;
      const user = { ...data.user, uid: data.user.id || data.user.uid };
      const profile = data.profile || user;

      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

      loadedUidRef.current = user.uid;
      setCurrentUser(user);
      setUserProfile(profile);
      setUserRole(user.role);

      return { user, profile, role: user.role };
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PROFILE_KEY);
    loadedUidRef.current = null;
    setCurrentUser(null);
    setUserProfile(null);
    setUserRole(null);
    setAuthError(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.profile) {
        setUserProfile(data.profile);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
        return data.profile;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const applyProfilePatch = useCallback((patch) => {
    setUserProfile((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      userProfile,
      userRole,
      authLoading,
      authError,
      loginWithCredentials,
      logout,
      refreshProfile,
      applyProfilePatch,
      isAdmin: userRole === 'admin',
      isTrainer: userRole === 'trainer',
      isStudent: userRole === 'student',
      uid: currentUser?.uid || currentUser?.id || null,
    }),
    [currentUser, userProfile, userRole, authLoading, authError, loginWithCredentials, logout, refreshProfile, applyProfilePatch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default AuthContext;
