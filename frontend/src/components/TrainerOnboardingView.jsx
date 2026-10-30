import React, { useState } from 'react';
import {
  Lock, User, Mail, Phone, GraduationCap, Briefcase, MapPin,
  CheckCircle2, AlertCircle, Eye, EyeOff, Shield, LogOut,
  Sparkles, Award, BookOpen
} from 'lucide-react';
import levloxLogo from '../assets/levlox-logo.png';
import { changeOwnPassword } from '../services/authService';
import { updateTrainer, updateDocumentFields } from '../services/firebaseService';

const TrainerOnboardingView = ({
  userProfile,
  currentUser,
  logout,
  applyProfilePatch,
  refreshProfile,
  showToast
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    name: userProfile?.fullName || userProfile?.name || '',
    phone: userProfile?.phone || userProfile?.mobile || '',
    designation: userProfile?.designation || userProfile?.specialization || 'Faculty Trainer',
    specialization: userProfile?.specialization || 'Fullstack Web Development',
    qualification: userProfile?.qualification || '',
    experience: userProfile?.experience || '',
    skills: userProfile?.skills || '',
    city: userProfile?.city || '',
    gender: userProfile?.gender || 'Male',
    dob: userProfile?.dob || '',
    bio: userProfile?.bio || '',
    linkedin: userProfile?.linkedin || ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Password validation
    if (!newPassword || newPassword.length < 6) {
      setError('Permanent password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    // 2. Details validation
    if (!form.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid 10-digit mobile number.');
      return;
    }
    if (!form.designation.trim()) {
      setError('Please provide your role or faculty title.');
      return;
    }
    if (!form.specialization.trim()) {
      setError('Please specify your primary technical domain / specialization.');
      return;
    }
    if (!form.qualification.trim()) {
      setError('Please provide your highest educational qualification / degree.');
      return;
    }
    if (!form.experience.trim()) {
      setError('Please specify your years of industry / teaching experience.');
      return;
    }
    if (!form.skills.trim()) {
      setError('Please specify your key technical skills (e.g., Python, React, SQL).');
      return;
    }
    if (!form.city.trim()) {
      setError('Please provide your current city / location.');
      return;
    }

    setSaving(true);
    try {
      const trainerUid = userProfile?.id || userProfile?.uid || currentUser?.uid;

      // Step A: Change password on the server
      try {
        await changeOwnPassword(userProfile?.tempPassword || '', newPassword);
      } catch (pwErr) {
        console.warn('[Onboarding] changeOwnPassword warning:', pwErr.message);
      }

      // Step B: Comprehensive profile updates
      const profileUpdates = {
        name: form.name.trim(),
        fullName: form.name.trim(),
        phone: cleanPhone,
        mobile: cleanPhone,
        designation: form.designation.trim(),
        specialization: form.specialization.trim(),
        qualification: form.qualification.trim(),
        experience: form.experience.trim(),
        skills: form.skills.trim(),
        city: form.city.trim(),
        gender: form.gender,
        dob: form.dob,
        bio: form.bio.trim(),
        linkedin: form.linkedin.trim(),
        password: newPassword,
        rawPassword: newPassword,
        tempPassword: newPassword,
        profileCompleted: true,
        mustChangePassword: false,
        passwordChanged: true,
        updatedAt: new Date().toISOString()
      };

      // Step C: Update trainers collection
      await updateTrainer(trainerUid, profileUpdates);

      // Step D: Sync user account in users collection
      try {
        await updateDocumentFields('users', trainerUid, {
          name: form.name.trim(),
          phone: cleanPhone,
          password: newPassword,
          profileCompleted: true,
          mustChangePassword: false,
          passwordChanged: true,
          city: form.city.trim(),
          gender: form.gender,
          dob: form.dob
        });
      } catch (_) {}

      // Step E: Update client state
      if (applyProfilePatch) {
        applyProfilePatch(profileUpdates);
      }
      if (refreshProfile) {
        try {
          await refreshProfile();
        } catch (_) {}
      }

      if (typeof showToast === 'function') {
        showToast('🎉 Welcome to Levlox! Your faculty profile has been activated.');
      }

      // Hard redirect to clear out any stale component memory and load the dashboard cleanly
      setTimeout(() => {
        window.location.href = '/trainer';
      }, 500);
    } catch (err) {
      console.error('[Trainer Onboarding Failure]:', err);
      setError(err?.message || 'Failed to complete setup. Please check your network and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(135deg, #F8FAFC 0%, #EEF2F6 100%)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Top Navbar */}
      <header style={{ background: '#FFFFFF', borderBottom: '1.5px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ background: '#F8FAFC', padding: '6px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <img src={levloxLogo} alt="Levlox" style={{ height: 32, objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              Levlox Faculty Portal
              <span style={{ fontSize: 11, background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                First-Time Faculty Setup
              </span>
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Please set your permanent password and complete your faculty credentials to activate your workspace
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#FFF5F5', color: '#DC2626', border: '1px solid #FCA5A5', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </header>

      {/* Main Form Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 840, background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #E2E8F0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', padding: 36 }}>
          
          {/* Welcome Banner */}
          <div style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0', borderRadius: 14, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#166534' }}>Welcome to Levlox Faculty Portal!</h3>
              <p style={{ margin: '3px 0 0', fontSize: 13, color: '#15803D' }}>
                You are currently signed in with an initial temporary password. To protect your account and unlock batch management, live classes, and student operations, please establish your permanent password and submit your instructor profile details below.
              </p>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1.5px solid #F87171', color: '#991B1B', borderRadius: 12, padding: '12px 18px', marginBottom: 24, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            
            {/* STEP 1: PASSWORD SETTING */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 8 }}>
                <Lock size={18} color="#6C3CF0" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1E293B' }}>1. Set Your Permanent Password</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    New Permanent Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Confirm New Password *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: PERSONAL & CONTACT INFORMATION */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 8 }}>
                <User size={18} color="#6C3CF0" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1E293B' }}>2. Personal & Contact Details</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your full name"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Email Address (Registered)
                  </label>
                  <input
                    type="email"
                    className="form-input"
                    value={userProfile?.email || currentUser?.email || ''}
                    disabled
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#F1F5F9', color: '#64748B', fontWeight: 600, fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Current City / Location *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Chennai, Bangalore, Trichy"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Gender
                  </label>
                  <select
                    className="form-input"
                    value={form.gender}
                    onChange={e => setForm(prev => ({ ...prev, gender: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Date of Birth (Optional)
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.dob}
                    onChange={e => setForm(prev => ({ ...prev, dob: e.target.value }))}
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* STEP 3: ACADEMIC & PROFESSIONAL CREDENTIALS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, borderBottom: '1.5px solid #F1F5F9', paddingBottom: 8 }}>
                <GraduationCap size={18} color="#6C3CF0" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1E293B' }}>3. Academic & Teaching Credentials</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Role / Faculty Title *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.designation}
                    onChange={e => setForm(prev => ({ ...prev, designation: e.target.value }))}
                    placeholder="e.g. Lead Instructor, Senior Technical Faculty"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Primary Domain / Specialization *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.specialization}
                    onChange={e => setForm(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. Fullstack Web Dev, AI & Data Science"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Highest Educational Qualification *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.qualification}
                    onChange={e => setForm(prev => ({ ...prev, qualification: e.target.value }))}
                    placeholder="e.g. M.Tech in Computer Science, B.E. CSE, MCA"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Years of Experience *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.experience}
                    onChange={e => setForm(prev => ({ ...prev, experience: e.target.value }))}
                    placeholder="e.g. 5+ Years Industry & Teaching"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Key Technical Skills & Subjects *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={form.skills}
                    onChange={e => setForm(prev => ({ ...prev, skills: e.target.value }))}
                    placeholder="e.g. Python, React, Node.js, PostgreSQL, Docker, AWS, Machine Learning"
                    required
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    Professional Bio / Instructor Summary
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.bio}
                    onChange={e => setForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief overview of your teaching approach, background, and mentoring philosophy..."
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: 13, display: 'block', marginBottom: 6 }}>
                    LinkedIn Profile URL (Optional)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    value={form.linkedin}
                    onChange={e => setForm(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourprofile"
                    style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1', fontSize: 14, boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* ACTION SUBMIT */}
            <div style={{ borderTop: '1.5px solid #E2E8F0', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #6C3CF0, #4F46E5)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '14px 32px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 8px 24px rgba(108, 60, 240, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <CheckCircle2 size={18} />
                {saving ? 'Activating Account...' : 'Complete Profile & Unlock Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TrainerOnboardingView;

