import React, { useEffect, useState } from 'react';
import {
  User, Mail, Smartphone, Camera, CheckCircle, Save, Shield, Lock, Eye, EyeOff, TriangleAlert,
  Calendar, MapPin, Users, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatMobile } from '../services/phoneIdentity';
import { updateStudent, uploadProfileImage, classifyFirestoreError } from '../services/firebaseService';
import {
  changeOwnPassword,
  validatePasswordStrength,
  describeAuthError,
} from '../services/authService';
import { compressImage } from '../utils/imageCompressor';

const StudentSettings = ({ user, onProfileUpdate }) => {
  const { uid, userProfile, applyProfilePatch, refreshProfile } = useAuth();
  const profile = userProfile || user || {};

  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [toast, setToast] = useState('');

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [location, setLocation] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Guardian');
  const [pendingAvatar, setPendingAvatar] = useState(null);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const mustChangePassword = Boolean(profile?.mustChangePassword);

  useEffect(() => {
    setName(profile.name || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setProfilePic(profile.profile_pic || profile.profilePhotoUrl || '');
    setDob(profile.dob || profile.date_of_birth || profile.dateOfBirth || '');
    setGender(profile.gender || '');
    setCity(profile.city || '');
    setLocation(profile.current_location || profile.location || '');
    setGuardianName(profile.guardian_name || profile.guardianName || '');
    setGuardianPhone(profile.guardian_phone || profile.guardianPhone || profile.guardianContact || '');
    setGuardianRelation(profile.guardian_relation || profile.guardianRelation || 'Guardian');
    setLoading(false);
    // Re-sync whenever the authoritative profile changes.
  }, [profile.name, profile.email, profile.phone, profile.profile_pic, profile.dob, profile.gender, profile.city, profile.current_location]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  /* ── Avatar selection (uploaded on save, not on pick) ── */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAccountError('Please choose a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setAccountError('');
    try {
      const compressed = await compressImage(file, 900, 0.85);
      setPendingAvatar(compressed);
      setProfilePic(URL.createObjectURL(compressed));
    } catch {
      setPendingAvatar(file);
      setProfilePic(URL.createObjectURL(file));
    }
  };

  /* ── Save account details to Firestore ── */
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountError('');

    if (!name.trim()) {
      setAccountError('Full name is required.');
      return;
    }
    if (!uid) {
      setAccountError('You are not signed in. Please sign in again.');
      return;
    }

    setSavingAccount(true);
    try {
      const patch = {
        name: name.trim(),
        dob: dob.trim(),
        gender: gender.trim(),
        city: city.trim(),
        location: location.trim(),
        current_location: location.trim(),
        guardian_name: guardianName.trim(),
        guardian_phone: guardianPhone.trim(),
        guardian_relation: guardianRelation.trim(),
      };

      // Upload the avatar to self-hosted server local storage
      if (pendingAvatar) {
        const photoUrl = await uploadProfileImage(uid, pendingAvatar);
        patch.profile_pic = photoUrl;
        patch.profilePhotoUrl = photoUrl;
      }

      await updateStudent(uid, patch);

      setProfilePic(patch.profile_pic || profilePic);
      setPendingAvatar(null);
      applyProfilePatch(patch);
      if (onProfileUpdate) onProfileUpdate(patch);
      showToast('Account details updated successfully ✓');
    } catch (err) {
      console.error('[StudentSettings] save failed:', err);
      setAccountError(classifyFirestoreError(err).message);
    } finally {
      setSavingAccount(false);
    }
  };

  /* ── Change password via Firebase Auth ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setPasswordError(strengthError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('Your new password must be different from the current one.');
      return;
    }

    setSavingPassword(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);

      // Clear the temporary-password lock so the rest of the portal unlocks.
      if (mustChangePassword && uid) {
        await updateStudent(uid, { mustChangePassword: false });
        applyProfilePatch({ mustChangePassword: false });
        await refreshProfile();
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully ✓');
    } catch (err) {
      console.error('[StudentSettings] password change failed:', err);
      setPasswordError(describeAuthError(err));
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 350 }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading settings...</p>
      </div>
    );
  }

  const cardStyle = {
    background: '#FFF',
    border: '1.5px solid var(--border-color)',
    borderRadius: 20,
    padding: 28,
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    flexDirection: 'column',
  };

  const errorBoxStyle = {
    background: '#FEF2F2',
    border: '1px solid #FCA5A5',
    color: '#991B1B',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12.5,
    fontWeight: 600,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <div style={{ padding: '4px 0' }} className="animate-fade-in">
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#121118',
          color: '#fff',
          borderRadius: 12,
          padding: '12px 20px',
          fontSize: 13,
          fontWeight: 600,
          zIndex: 2000,
          boxShadow: '0 16px 32px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle size={15} color="#10B981" /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0, color: 'var(--text-primary)', letterSpacing: -0.3 }}>Student Settings</h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          Manage your account profile and password.
        </p>
      </div>

      <div className="dashboard-main-grid" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* CARD 1: ACCOUNT DETAILS */}
        <div className="clickable-card-hover" style={cardStyle}>
          <h3 style={{ fontSize: 14.5, fontWeight: 750, margin: '0 0 18px', display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
            <User size={16} color="var(--primary-color)" /> Account Details
          </h3>

          {accountError && (
            <div style={errorBoxStyle}>
              <TriangleAlert size={15} /> {accountError}
            </div>
          )}

          <form onSubmit={handleSaveAccount}>
            {/* Profile Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ position: 'relative', width: 90, height: 90 }}>
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'var(--primary-light)',
                  border: '3.5px solid white',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {profilePic ? (
                    <img src={profilePic} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--primary-color) 0%, #4c22bc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff' }}>
                      {(name || 'S')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <label style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 28,
                  height: 28,
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  border: '2px solid #fff',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  transition: 'background 0.2s'
                }}
                className="photo-upload-badge"
                >
                  <Camera size={12} />
                  <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo</h4>
                <p style={{ margin: '4px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
                  {pendingAvatar
                    ? 'New photo selected — click Save to upload it.'
                    : 'Upload a square picture (max 3 MB). Click the camera icon.'}
                </p>
              </div>
            </div>

            {/* Editable Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 24 }}>

              {/* Full Name */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={e => { setName(e.target.value); setAccountError(''); }}
                    placeholder="Enter your full name"
                    style={{ paddingLeft: 42 }}
                  />
                  <User size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Mobile number — this is the sign-in identity, so only an
                  administrator can change it. */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Mobile Number (Sign-in ID — managed by Admin)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-input"
                    value={formatMobile(phone)}
                    readOnly
                    disabled
                    style={{ paddingLeft: 42, background: 'var(--surface-alt)', opacity: 0.85, cursor: 'not-allowed' }}
                  />
                  <Smartphone size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Email — contact detail only, not used to sign in. */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address (Managed by Admin)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    placeholder="Not provided"
                    readOnly
                    disabled
                    style={{ paddingLeft: 42, background: 'var(--surface-alt)', opacity: 0.85, cursor: 'not-allowed' }}
                  />
                  <Mail size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* DOB & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Date of Birth</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      className="form-input"
                      value={dob}
                      onChange={e => setDob(e.target.value)}
                      style={{ paddingLeft: 42 }}
                    />
                    <Calendar size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Gender</label>
                  <select
                    className="form-select"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    style={{ height: 44, width: '100%', borderRadius: 10, border: '1.5px solid var(--border-color)', padding: '0 14px', background: '#FFF' }}
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* City & Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">City</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="e.g. Bangalore, Chennai"
                      style={{ paddingLeft: 42 }}
                    />
                    <MapPin size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Current Location / Address</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      placeholder="e.g. Indiranagar, Bangalore"
                      style={{ paddingLeft: 42 }}
                    />
                    <MapPin size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
              </div>

              {/* Guardian Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Guardian Name</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={guardianName}
                      onChange={e => setGuardianName(e.target.value)}
                      placeholder="Parent / Guardian"
                      style={{ paddingLeft: 42 }}
                    />
                    <Users size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Guardian Contact</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="tel"
                      className="form-input"
                      value={guardianPhone}
                      onChange={e => setGuardianPhone(e.target.value)}
                      placeholder="10-digit number"
                      style={{ paddingLeft: 42 }}
                    />
                    <Smartphone size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Relationship</label>
                  <select
                    className="form-select"
                    value={guardianRelation}
                    onChange={e => setGuardianRelation(e.target.value)}
                    style={{ height: 44, width: '100%', borderRadius: 10, border: '1.5px solid var(--border-color)', padding: '0 14px', background: '#FFF' }}
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Save Profile Button */}
            <button
              type="submit"
              disabled={savingAccount}
              className="btn btn-primary btn-block"
              style={{ height: 46 }}
            >
              <Save size={16} /> {savingAccount ? 'Saving Profile...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* CARD 2: SECURITY / PASSWORD */}
        <div className="clickable-card-hover" style={cardStyle}>
          <h3 style={{ fontSize: 14.5, fontWeight: 750, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
            <Shield size={16} color="var(--primary-color)" /> Password & Security
          </h3>
          <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Use at least 8 characters with an uppercase letter, a lowercase letter and a number.
          </p>

          {mustChangePassword && (
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FCD34D',
              color: '#92400E',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              lineHeight: 1.45,
            }}>
              <TriangleAlert size={16} style={{ flexShrink: 0 }} />
              You are using a temporary password. Change it here to unlock the rest of the portal.
            </div>
          )}

          {passwordError && (
            <div style={errorBoxStyle}>
              <TriangleAlert size={15} /> {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 22 }}>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className="form-input"
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Enter your current password"
                    autoComplete="current-password"
                    style={{ paddingLeft: 42 }}
                  />
                  <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    style={{ paddingLeft: 42 }}
                  />
                  <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                    style={{ paddingLeft: 42 }}
                  />
                  <Lock size={16} color="var(--text-secondary)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={showPasswords}
                  onChange={e => setShowPasswords(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                {showPasswords ? <EyeOff size={14} /> : <Eye size={14} />} Show passwords
              </label>
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="btn btn-primary btn-block"
              style={{ height: 46 }}
            >
              <Shield size={16} /> {savingPassword ? 'Updating Password...' : 'Change Password'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default StudentSettings;
