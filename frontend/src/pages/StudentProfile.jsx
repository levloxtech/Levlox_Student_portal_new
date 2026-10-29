import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Lock, Edit3, Camera, Save, X,
  GraduationCap, MapPin, Building2, Briefcase, CheckCircle,
  FileText, Calendar, Award, BookOpen, Percent, Users, UserCheck, Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateStudent, uploadProfileImage, getDocument, getDocuments, classifyFirestoreError, formatCurrency, getStudentFeeDetails } from '../services/firebaseService';
import { compressImage } from '../utils/imageCompressor';

const StudentProfile = ({ dashboardData, enrolledCourses = [], onProfileUpdate }) => {
  const { uid, applyProfilePatch } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [saveError, setSaveError] = useState('');
  const [paying, setPaying] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState(null);

  /**
   * Fees are settled with the administrator offline; this only flags the
   * student's intent so an admin can confirm the payment.
   */
  const handlePayNow = async () => {
    if (!uid) return;
    setPaying(true);
    try {
      await updateStudent(uid, { feesStatus: 'Pending Payment' });
      applyProfilePatch({ feesStatus: 'Pending Payment' });
      if (onProfileUpdate) onProfileUpdate({ feesStatus: 'Pending Payment' });
      showToast('Payment request sent — please complete it with the administrator.');
    } catch (e) {
      console.error('[StudentProfile] payment request failed:', e);
      showToast(classifyFirestoreError(e).message);
    } finally {
      setPaying(false);
    }
  };


  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [college, setCollege] = useState('Levlox Technical Institute');
  const [company, setCompany] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('Guardian');

  const isEditingRef = React.useRef(false);
  isEditingRef.current = editing;

  useEffect(() => {
    fetchProfile(true);
  }, [uid]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchProfile = async (isInitial = false) => {
    if (isEditingRef.current) return;
    if (isInitial && !profileData) {
      setLoading(true);
    }
    try {
      let d = dashboardData?.student;
      if (!d && uid) {
        d = await getDocument('students', uid);
      }
      if (d) {
        setProfileData(d);
        if (!isEditingRef.current) {
          setName(d.name || '');
          setEmail(d.email || '');
          setPhone(d.phone || '');
          setCurrentLocation(d.current_location || d.location || '');
          setPermanentAddress(d.permanent_address || '');
          setProfilePic(d.profile_pic || d.profilePhotoUrl || '');
          setCollege(d.college || 'Levlox Technical Institute');
          setCompany(d.company || '');
          setDob(d.dob || d.date_of_birth || d.dateOfBirth || '');
          setGender(d.gender || '');
          setCity(d.city || '');
          setGuardianName(d.guardian_name || d.guardianName || '');
          setGuardianPhone(d.guardian_phone || d.guardianPhone || d.guardianContact || '');
          setGuardianRelation(d.guardian_relation || d.guardianRelation || 'Guardian');
        }

        // Look up assigned batch details from local server database
        const bId = d.batchId || d.batch_id;
        const bName = d.batch_name || d.batch || '';
        try {
          const allBatches = await getDocuments('batches');
          const matched = allBatches.find(b =>
            (bId && (b.id === bId || b.uid === bId || b.batchId === bId)) ||
            (bName && (b.name === bName || b.code === bName || (b.name && bName && b.name.toLowerCase() === bName.toLowerCase())))
          );
          if (matched) {
            setBatchDetails(matched);
          }
        } catch (bErr) {
          console.warn('[StudentProfile] Could not fetch batch details:', bErr.message);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');

    if (!name.trim()) {
      setSaveError('Full name is required.');
      return;
    }
    if (!uid) {
      setSaveError('You are not signed in. Please sign in again.');
      return;
    }

    setSaving(true);
    try {
      const patch = {
        name: name.trim(),
        current_location: currentLocation.trim(),
        location: currentLocation.trim(),
        permanent_address: permanentAddress.trim(),
        college: college.trim(),
        company: company.trim(),
        dob: dob.trim(),
        gender: gender.trim(),
        city: city.trim(),
        guardian_name: guardianName.trim(),
        guardian_phone: guardianPhone.trim(),
        guardian_relation: guardianRelation.trim(),
      };

      // Files go to self-hosted server local storage
      if (pendingAvatar) {
        const photoUrl = await uploadProfileImage(uid, pendingAvatar);
        patch.profile_pic = photoUrl;
        patch.profilePhotoUrl = photoUrl;
      }

      await updateStudent(uid, patch);

      setProfileData(prev => ({ ...(prev || {}), ...patch }));
      if (patch.profile_pic) setProfilePic(patch.profile_pic);
      setPendingAvatar(null);
      applyProfilePatch(patch);
      setEditing(false);
      showToast('Profile updated successfully ✓');
      if (onProfileUpdate) onProfileUpdate(patch);
    } catch (e) {
      console.error('[StudentProfile] save failed:', e);
      setSaveError(classifyFirestoreError(e).message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setName(profileData.name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      setCurrentLocation(profileData.current_location || profileData.location || '');
      setPermanentAddress(profileData.permanent_address || '');
      setProfilePic(profileData.profile_pic || profileData.profilePhotoUrl || '');
      setCollege(profileData.college || 'Levlox Technical Institute');
      setCompany(profileData.company || '');
      setDob(profileData.dob || profileData.date_of_birth || profileData.dateOfBirth || '');
      setGender(profileData.gender || '');
      setCity(profileData.city || '');
      setGuardianName(profileData.guardian_name || profileData.guardianName || '');
      setGuardianPhone(profileData.guardian_phone || profileData.guardianPhone || profileData.guardianContact || '');
      setGuardianRelation(profileData.guardian_relation || profileData.guardianRelation || 'Guardian');
    }
    setPendingAvatar(null);
    setSaveError('');
    setEditing(false);
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('Please choose a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setSaveError('');
    try {
      // Auto-compress high-MB photos smoothly in browser (< 300KB)
      const compressed = await compressImage(file, 900, 0.85);
      setPendingAvatar(compressed);
      const preview = URL.createObjectURL(compressed);
      setProfilePic(preview);

      // If user is in view mode, auto-save and upload to server storage immediately
      if (!editing && uid) {
        setSaving(true);
        const photoUrl = await uploadProfileImage(uid, compressed);
        await updateStudent(uid, { profile_pic: photoUrl, profilePhotoUrl: photoUrl });
        setProfileData(prev => ({ ...(prev || {}), profile_pic: photoUrl, profilePhotoUrl: photoUrl }));
        setProfilePic(photoUrl);
        setPendingAvatar(null);
        applyProfilePatch({ profile_pic: photoUrl, profilePhotoUrl: photoUrl });
        if (onProfileUpdate) onProfileUpdate({ profile_pic: photoUrl, profilePhotoUrl: photoUrl });
        showToast('Profile photo updated successfully ✓');
      }
    } catch (err) {
      console.error('[StudentProfile] upload error:', err);
      setSaveError('Failed to process/upload image. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Loading profile...</p>
      </div>
    );
  }

  const rawAtt = profileData?.attendance ?? dashboardData?.student?.attendance;
  const attendancePct = typeof rawAtt === 'object' ? (rawAtt?.percentage ?? 0) : (typeof rawAtt === 'number' ? rawAtt : 0);
  const isPaid = profileData?.feesStatus === 'Paid' || dashboardData?.student?.feesStatus === 'Paid';
  const studentId = profileData?.rollNumber || dashboardData?.student?.rollNumber || 'LSP-2026-9999';
  const course = profileData?.course || dashboardData?.student?.course || 'Fullstack Engineering';
  const batchName = profileData?.batch_name || 'Not Assigned';
  const trainer = profileData?.trainer || 'Levlox Trainer';
  const admissionDate = profileData?.join_date || dashboardData?.student?.enrollmentDate || 'July 08, 2026';
  
  // Calculate completion % from enrolledCourses or fallback
  const courseCompletionPct = enrolledCourses.length > 0
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress || 0), 0) / enrolledCourses.length)
    : dashboardData?.recordedClasses && dashboardData.recordedClasses.length > 0
      ? Math.round(dashboardData.recordedClasses.reduce((acc, c) => acc + (c.progress || 0), 0) / dashboardData.recordedClasses.length)
      : 78;

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
        <h2 style={{ fontSize: 18, fontWeight: 750, margin: 0, color: 'var(--text-primary)', letterSpacing: -0.3 }}>LMS Student Profile</h2>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
          Manage your personal details and view your locked academic profile.
        </p>
      </div>

      {saveError && (
        <div style={{
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          borderRadius: 10,
          padding: '11px 15px',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 20,
        }}>
          {saveError}
        </div>
      )}

      {/* Clean Two Column Layout */}
      <div className="dashboard-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT CARD - PERSONAL INFORMATION */}
        <div className="clickable-card-hover" style={{
          background: '#FFF',
          border: '1.5px solid var(--border-color)',
          borderRadius: 20,
          padding: 28,
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 750, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
              <User size={16} color="var(--primary-color)" /> Personal Information
            </h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  borderRadius: 8,
                  padding: '7px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  fontFamily: 'inherit',
                  transition: 'all 0.15s'
                }}
              >
                <Edit3 size={12} /> Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background: 'var(--primary-color)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#FFF',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 10px rgba(108,60,240,0.2)',
                    transition: 'all 0.15s'
                  }}
                >
                  <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={handleCancel}
                  style={{
                    background: 'var(--surface-alt)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontFamily: 'inherit',
                    transition: 'all 0.15s'
                  }}
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
          </div>

          {/* Profile Photo Upload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ position: 'relative', width: 90, height: 90 }}>
              <div style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'var(--primary-light)',
                border: '3.5px solid white',
                boxShadow: 'var(--shadow-card)',
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
              <label 
                title="Upload/change profile photo (auto-compressed)"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 30,
                  height: 30,
                  background: 'var(--primary-color)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  border: '2.5px solid #fff',
                  boxShadow: '0 4px 10px rgba(108,60,240,0.3)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Camera size={13} />
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>Profile Photo</h4>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                {saving && pendingAvatar ? 'Compressing & uploading to server...' : 'Accepts JPG, PNG formats. High-MB camera photos auto-compressed.'}
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Full Name</label>
              {editing ? (
                <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={name} onChange={e => setName(e.target.value)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                  <User size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{name || '—'}</span>
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Email Address</label>
              {editing ? (
                <input type="email" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={email} onChange={e => setEmail(e.target.value)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                  <Mail size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{email || '—'}</span>
                </div>
              )}
            </div>

            {/* Phone Number (Read-Only Managed by Admin) */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Phone Number (Managed by Admin)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent', opacity: 0.85 }}>
                <Phone size={15} color="var(--primary-color)" />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{phone || 'Not added'}</span>
              </div>
            </div>

            {/* Date of Birth & Gender Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Date of Birth</label>
                {editing ? (
                  <input type="date" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={dob} onChange={e => setDob(e.target.value)} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <Calendar size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dob || 'Not specified'}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Gender</label>
                {editing ? (
                  <select className="form-select" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none', background: '#FFF' }} value={gender} onChange={e => setGender(e.target.value)}>
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <User size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{gender || 'Not specified'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* City & Location Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>City</label>
                {editing ? (
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Bangalore, Chennai" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <MapPin size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{city || 'Not added'}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Current Location</label>
                {editing ? (
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={currentLocation} onChange={e => setCurrentLocation(e.target.value)} placeholder="e.g. Indiranagar, Bangalore" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <MapPin size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{currentLocation || 'Not added'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Guardian Information Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 0.9fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Guardian Name</label>
                {editing ? (
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={guardianName} onChange={e => setGuardianName(e.target.value)} placeholder="Parent/Guardian name" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <Users size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{guardianName || 'Not added'}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Guardian Contact Phone</label>
                {editing ? (
                  <input type="tel" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={guardianPhone} onChange={e => setGuardianPhone(e.target.value)} placeholder="Guardian phone" />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <Phone size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{guardianPhone || 'Not added'}</span>
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Relationship</label>
                {editing ? (
                  <select className="form-select" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none', background: '#FFF' }} value={guardianRelation} onChange={e => setGuardianRelation(e.target.value)}>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                    <UserCheck size={15} color="var(--primary-color)" />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{guardianRelation || 'Guardian'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Permanent Address</label>
              {editing ? (
                <textarea className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none', minHeight: 60, resize: 'vertical' }} value={permanentAddress} onChange={e => setPermanentAddress(e.target.value)} placeholder="e.g. 123 Main St, New Delhi, India" />
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                  <MapPin size={15} color="var(--primary-color)" style={{ marginTop: 2 }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>{permanentAddress || 'Not added'}</span>
                </div>
              )}
            </div>

            {/* College / Institution */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>College / Institution</label>
              {editing ? (
                <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={college} onChange={e => setCollege(e.target.value)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                  <Building2 size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{college || '—'}</span>
                </div>
              )}
            </div>

            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Company Name</label>
              {editing ? (
                <input type="text" className="form-input" style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border-color)', fontSize: 13.5, fontWeight: 600, outline: 'none' }} value={company} onChange={e => setCompany(e.target.value)} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--surface-alt)', borderRadius: 10, border: '1.5px solid transparent' }}>
                  <Briefcase size={15} color="var(--primary-color)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{company || 'No Company Assigned'}</span>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - STACKED CARDS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* ACADEMIC INFORMATION CARD */}
          <div className="clickable-card-hover" style={{
            background: '#FFF',
            border: '1.5px solid var(--border-color)',
            borderRadius: 20,
            padding: 28,
            boxShadow: 'var(--shadow-card)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ fontSize: 14.5, fontWeight: 750, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
              <GraduationCap size={16} color="var(--primary-color)" /> Academic Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Course', val: batchDetails?.course_name || course, icon: <BookOpen size={15} color="var(--primary-color)" /> },
                { label: 'Batch Name', val: batchDetails?.name || batchName, icon: <Users size={15} color="var(--primary-color)" /> },
                { label: 'Batch Code', val: batchDetails?.code || batchDetails?.batchId || 'BAT-7183', icon: <Award size={15} color="var(--primary-color)" /> },
                { label: 'Assigned Trainer', val: batchDetails?.trainer_name || trainer, icon: <UserCheck size={15} color="var(--primary-color)" /> },
                {
                  label: 'Batch Status',
                  val: batchDetails?.status || profileData?.batch_status || 'Active',
                  valColor: '#16A34A',
                  icon: <CheckCircle size={15} color="#16A34A" />
                },
                { label: 'Schedule / Timing', val: batchDetails?.timing || 'Regular Schedule', icon: <Clock size={15} color="var(--primary-color)" /> },
                { label: 'Start Date', val: batchDetails?.start_date || profileData?.batch_start_date || 'N/A', icon: <Calendar size={15} color="var(--primary-color)" /> },
                { label: 'End Date', val: batchDetails?.end_date || profileData?.batch_end_date || 'N/A', icon: <Calendar size={15} color="var(--primary-color)" /> },
                { label: 'Duration', val: batchDetails?.duration_days ? `${batchDetails.duration_days} Days` : (batchDetails?.start_date && batchDetails?.end_date ? 'Standard Duration' : 'N/A'), icon: <Clock size={15} color="var(--primary-color)" /> },
                { label: 'Attendance %', val: `${attendancePct}%`, icon: <Percent size={15} color="var(--primary-color)" /> }
              ].map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    background: 'var(--surface-alt)',
                    borderRadius: 12,
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {f.icon}
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{f.label}</span>
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: f.valColor || 'var(--text-primary)' }}>{f.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PAYMENT INFORMATION CARD */}
          {(() => {
            const feeInfo = getStudentFeeDetails(profileData || dashboardData?.student);
            const paidPct = Math.round((feeInfo.paid / (feeInfo.total || 1)) * 100);
            return (
              <div id="profile-payment-card" className="clickable-card-hover" style={{
                background: '#FFF',
                border: '1.5px solid var(--border-color)',
                borderRadius: 20,
                padding: 28,
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, color: '#121118' }}>
                  <FileText size={18} color="var(--primary-color)" /> Payment Information
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Fee Status Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Fee Status</span>
                    <span style={{ 
                      fontSize: 11, 
                      fontWeight: 800, 
                      padding: '4px 12px', 
                      borderRadius: 20, 
                      textTransform: 'uppercase',
                      background: feeInfo.isPaid ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', 
                      color: feeInfo.isPaid ? '#10B981' : '#F59E0B'
                    }}>
                      {feeInfo.isPaid ? 'Paid' : 'Pending Payment'}
                    </span>
                  </div>

                  {/* Total Course Fee */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Total Course Fee</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(feeInfo.total)}</span>
                  </div>

                  {/* Progress Summary box */}
                  <div style={{ background: 'var(--surface-alt)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
                      <span style={{ color: 'var(--success-color)' }}>Paid : {formatCurrency(feeInfo.paid)}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>Remaining : {formatCurrency(feeInfo.remaining)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${paidPct}%`, 
                        background: 'var(--primary-color)', 
                        borderRadius: 99 
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span>Progress</span>
                      <span>{paidPct}%</span>
                    </div>
                  </div>

                  {/* Next Due Date Alert */}
                  {!feeInfo.isPaid && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '10px 14px', 
                      background: 'rgba(245,158,11,0.06)', 
                      border: '1.5px solid rgba(245,158,11,0.15)', 
                      borderRadius: 12 
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#D97706' }}>Next Due</span>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 800, 
                        background: '#F59E0B', 
                        color: 'white', 
                        padding: '3px 8px', 
                        borderRadius: 6,
                        textTransform: 'uppercase'
                      }}>
                        {profileData?.feesDueDate || '15 Jul 2026'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
