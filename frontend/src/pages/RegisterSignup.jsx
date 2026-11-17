import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Briefcase, GraduationCap, AlertCircle, CheckCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react';
import leveloxLogo from '../assets/levelox-icon-transparent.png';

export default function RegisterSignup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: 'student',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState({
    checking: false,
    checked: false,
    registered: null,
    isExisting: false,
    message: ''
  });

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  };

  const checkEmailAvailability = async (emailToCheck) => {
    const cleanEmail = (emailToCheck || '').trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setEmailStatus({ checking: false, checked: false, registered: null, isExisting: false, message: '' });
      return null;
    }

    setEmailStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch(`/api/membership/check-email?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();
      if (data.isExistingPortalUser) {
        setEmailStatus({
          checking: false,
          checked: true,
          registered: false,
          isExisting: true,
          message: data.message || 'Welcome back! Existing account found.'
        });
        return true;
      } else {
        setEmailStatus({
          checking: false,
          checked: true,
          registered: false,
          isExisting: false,
          message: 'Email is available'
        });
        return true;
      }
    } catch (err) {
      setEmailStatus({
        checking: false,
        checked: false,
        registered: null,
        isExisting: false,
        message: ''
      });
      return null;
    }
  };

  // Debounced dynamic email check as user types
  useEffect(() => {
    const clean = formData.email.trim();
    if (!clean || !isValidEmail(clean)) {
      setEmailStatus({ checking: false, checked: false, registered: null, isExisting: false, message: '' });
      return;
    }

    const timer = setTimeout(() => {
      checkEmailAvailability(clean);
    }, 200);

    return () => clearTimeout(timer);
  }, [formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanName = (formData.name || '').trim();
    const cleanEmail = (formData.email || '').trim().toLowerCase();
    const cleanPhone = (formData.phone || '').trim();

    if (!cleanName || !cleanEmail || !cleanPhone) {
      setError('Please provide your Full Name, Email Address, and Mobile Number.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError('Portal password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Submit lead details to backend - stores in leads.json
      const res = await fetch('/api/membership/register-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          userType: formData.userType,
          password: formData.password
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit registration');
      }

      // 2. Save lead context locally for showcase page
      const leadPayload = {
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        userType: formData.userType,
        password: formData.password,
        credits: data.credits?.balance || 3600
      };
      localStorage.setItem('levlox_academy_lead', JSON.stringify(leadPayload));

      // 3. Redirect user to the Academy Showcase Page
      navigate('/academy');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(120% 90% at 85% 15%, #EEF2FF 0%, #F6F8FE 45%, #E9EEFA 100%)',
      color: '#101B33',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Decorative subtle ambient wave in bottom left */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '45vw',
          maxWidth: 550,
          height: 'auto',
          pointerEvents: 'none',
          opacity: 0.55,
          zIndex: 0
        }}
        viewBox="0 0 600 350"
        fill="none"
      >
        <path
          d="M-50 350 C 150 330, 220 240, 260 160 C 300 80, 420 50, 520 80 L 600 0 L 0 0 Z"
          fill="url(#waveGrad)"
          transform="rotate(180 300 175)"
        />
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0E7FF" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Embedded Responsive Styles */}
      <style>{`
        .register-container {
          padding: 60px 24px 80px;
          position: relative;
          z-index: 1;
        }
        .register-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 56px;
          align-items: center;
          width: 100%;
          max-width: 1100px;
          margin: 0 auto;
        }
        .register-card-wrapper {
          position: relative;
          width: 100%;
        }
        .register-card {
          background: #FFFFFF;
          padding: 38px 36px 32px;
          border-radius: 24px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 20px 60px rgba(79, 70, 229, 0.08), 0 2px 8px rgba(0, 0, 0, 0.02);
          box-sizing: border-box;
          width: 100%;
        }
        .register-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }
        .register-input:focus {
          border-color: #2563EB;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
        }
        .register-credit-badge {
          position: absolute;
          top: -20px;
          right: 28px;
          background: linear-gradient(135deg, #4338CA 0%, #6D28D9 55%, #7C3AED 100%);
          border-radius: 14px;
          padding: 8px 14px 8px 10px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 10px 25px rgba(109, 40, 217, 0.4);
          z-index: 5;
        }
        @media (max-width: 860px) {
          .register-container {
            padding: 24px 14px 40px !important;
          }
          .register-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 28px !important;
          }
          .register-card {
            padding: 26px 18px 22px !important;
            border-radius: 18px !important;
          }
          .register-credit-badge {
            top: -14px !important;
            right: 10px !important;
            padding: 5px 10px 5px 8px !important;
            font-size: 11px !important;
          }
        }
        @media (max-width: 480px) {
          .register-container {
            padding: 16px 10px 36px !important;
          }
          .register-card {
            padding: 22px 14px 18px !important;
            border-radius: 16px !important;
          }
          .register-input {
            font-size: 15px !important;
            padding: 11px 12px !important;
          }
          .register-credit-badge {
            top: -12px !important;
            right: 8px !important;
            padding: 4px 8px !important;
            border-radius: 8px !important;
            font-size: 10.5px !important;
          }
        }
      `}</style>

      {/* HEADER */}
      <header style={{
        padding: '16px 24px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(227, 233, 244, 0.8)',
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src={leveloxLogo}
              alt="Levlox"
              style={{ width: 32, height: 32, objectFit: 'contain' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#101B33', letterSpacing: '-0.3px' }}>LEVLOX</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4568F5', background: '#EEF2FE', padding: '2px 8px', borderRadius: 6 }}>ACADEMY</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="register-container">
        <div className="register-grid">

          {/* Left Column: Exactly matches the layout in reference image */}
          <div>
            {/* Top Subheading with colored brand words */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 'clamp(20px, 2.4vw, 23px)',
                fontWeight: 800,
                color: '#101B33',
                letterSpacing: '-0.3px',
                margin: 0
              }}>
                Become a <span style={{ color: '#2563EB' }}>Levlox</span> <span style={{ color: '#7C3AED' }}>Academy</span> Member
              </div>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(32px, 4.3vw, 46px)',
              fontWeight: 800,
              lineHeight: 1.3,
              color: '#0F172A',
              letterSpacing: '-0.8px',
              margin: 0
            }}>
              <div>
                Get <span style={{ color: '#2563EB', fontWeight: 800 }}>24 Resources</span> to
              </div>
              <div style={{ marginTop: 2 }}>
                Crack Your IT Interviews
              </div>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span>for&nbsp;</span>
                <span style={{ color: '#16A34A', fontWeight: 800 }}>Free.</span>
                {/* "in தமிழ்" badge with proper inline flow so it never overflows viewport */}
                <span style={{
                  background: '#059669',
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 14,
                  boxShadow: '0 3px 10px rgba(5, 150, 105, 0.35)',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  lineHeight: 1.2,
                  verticalAlign: 'middle'
                }}>
                  <span>in</span>
                  <span style={{ letterSpacing: '0.4px' }}>தமிழ்</span>
                </span>
              </div>
            </h1>
          </div>

          {/* Right Column: Clean Registration Card */}
          <div className="register-card-wrapper">

            {/* Floating Top-Right 3600 Credits Tag with sparkle rays */}
            <div className="register-credit-badge">
              {/* Sparkle rays at the top-right of the badge */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -8,
                  overflow: 'visible',
                  pointerEvents: 'none'
                }}
              >
                <line x1="2" y1="14" x2="0" y2="8" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="8" y1="14" x2="8" y2="4" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
                <line x1="14" y1="14" x2="17" y2="8" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" />
              </svg>

              {/* 3D Gift Box Icon */}
              <div style={{
                fontSize: 22,
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
              }}>
                🎁
              </div>

              {/* Tag Text Lines */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                  color: '#FFFFFF',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1px',
                  lineHeight: 1.2
                }}>
                  Sign up for First Time to get
                </span>
                <span style={{
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  lineHeight: 1.3
                }}>
                  <span style={{
                    color: '#FDE047',
                    fontWeight: 800,
                    fontSize: 13,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    <span style={{ fontSize: 10, opacity: 0.9 }}>🪙</span> 3600
                  </span>
                  <span>Academy Credits</span>
                </span>
              </div>
            </div>

            {/* Registration Card Body */}
            <div className="register-card">
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  Get Started
                </h2>
                <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                  Fill in your details below to explore the academy.
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: '#E11D48',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  marginBottom: 16
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Full Name <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hariharan M"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="register-input"
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                      Email Address <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    {emailStatus.checking && (
                      <span style={{ fontSize: 11, color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Loader2 size={12} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> Checking...
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      onBlur={() => {
                        if (isValidEmail(formData.email)) {
                          checkEmailAvailability(formData.email);
                        }
                      }}
                      className="register-input"
                      style={{
                        borderColor: emailStatus.isExisting
                          ? '#3B82F6'
                          : emailStatus.registered === false
                          ? '#10B981'
                          : undefined,
                        background: emailStatus.isExisting
                          ? '#EFF6FF'
                          : undefined
                      }}
                    />
                  </div>

                  {/* Existing Account Notice Banner with Login Shortcut */}
                  {emailStatus.isExisting && (
                    <div style={{
                      marginTop: 8,
                      padding: '10px 12px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>
                        <CheckCircle size={15} style={{ flexShrink: 0 }} />
                        <span>Welcome back! Existing account found.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 2 }}>
                        <span style={{ fontSize: 11, color: '#1E40AF' }}>
                          You can continue to explore Academy courses or sign in.
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate('/login')}
                          style={{
                            background: '#2563EB',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          Sign In Here →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Available Confirmation */}
                  {emailStatus.registered === false && !emailStatus.isExisting && (
                    <div style={{
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      color: '#059669',
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      <CheckCircle size={14} />
                      <span>Email is available.</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Mobile Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="register-input"
                  />
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    I am a <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'student' })}
                      style={{
                        padding: '11px 10px',
                        borderRadius: 10,
                        border: formData.userType === 'student' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: formData.userType === 'student' ? '#EFF6FF' : '#FFFFFF',
                        color: formData.userType === 'student' ? '#2563EB' : '#64748B',
                        fontSize: 13,
                        fontWeight: formData.userType === 'student' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 44,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <GraduationCap size={16} /> Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, userType: 'working_professional' })}
                      style={{
                        padding: '11px 10px',
                        borderRadius: 10,
                        border: formData.userType === 'working_professional' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                        background: formData.userType === 'working_professional' ? '#EFF6FF' : '#FFFFFF',
                        color: formData.userType === 'working_professional' ? '#2563EB' : '#64748B',
                        fontSize: 13,
                        fontWeight: formData.userType === 'working_professional' ? 700 : 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        minHeight: 44,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Briefcase size={16} /> Working Pro
                    </button>
                  </div>
                </div>

                {/* Create Portal Password */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Create Portal Password <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Create password (min 6 characters)"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="register-input"
                      style={{ paddingRight: 44 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4
                      }}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 6 }}>
                    Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Re-enter password to confirm"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="register-input"
                      style={{
                        paddingRight: 44,
                        borderColor: formData.confirmPassword && formData.password !== formData.confirmPassword ? '#EF4444' : undefined
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4
                      }}
                      aria-label="Toggle confirm password visibility"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p style={{ margin: '6px 0 0', fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || emailStatus.checking}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    padding: '14px 22px',
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFF',
                    fontSize: 15,
                    fontWeight: 700,
                    border: 'none',
                    cursor: (loading || emailStatus.checking) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {emailStatus.checking
                    ? 'Verifying Email...'
                    : loading
                    ? 'Submitting...'
                    : 'Explore Levlox Academy →'}
                </button>
              </form>

              <div style={{
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                color: '#64748B',
                lineHeight: 1.4
              }}>
                <Shield size={15} color="#10B981" style={{ flexShrink: 0 }} />
                <span>Exploring is free. Portal login credentials are provided once membership is activated.</span>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(227, 233, 244, 0.8)',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(8px)',
        padding: '20px 16px',
        textAlign: 'center',
        color: '#64748B',
        fontSize: 12,
        position: 'relative',
        zIndex: 2
      }}>
        &copy; {new Date().getFullYear()} Levlox Academy. All rights reserved.
      </footer>

    </div>
  );
}

