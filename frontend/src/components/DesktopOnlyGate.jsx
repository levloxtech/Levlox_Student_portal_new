import React from 'react';
import { Laptop, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import leveloxLogo from '../assets/levelox-icon-transparent.png';

export default function DesktopOnlyGate() {
  const { logout } = useAuth();

  const handleSignOut = () => {
    try {
      if (typeof logout === 'function') logout();
    } catch (_) {}
    try {
      localStorage.removeItem('levlox_auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (_) {}
    window.location.replace('/login');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100dvh',
      background: 'radial-gradient(circle at 50% 20%, #172038 0%, #0B101D 70%, #060911 100%)',
      zIndex: 99999999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      color: '#FFFFFF',
      textAlign: 'center',
      boxSizing: 'border-box'
    }}>
      <div style={{ maxWidth: 440, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Levlox Brand Icon */}
        <div style={{ marginBottom: 16 }}>
          <img src={leveloxLogo} alt="Levlox" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Laptop Icon Badge */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '2px solid rgba(239, 68, 68, 0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
          boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
        }}>
          <Laptop size={36} color="#F87171" />
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 20,
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#F87171', fontSize: 11, fontWeight: 800,
          letterSpacing: 0.5, marginBottom: 14
        }}>
          LAPTOP ACCESS REQUIRED
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px', color: '#FFFFFF' }}>
          Please Log In Through Your Laptop
        </h2>

        <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 20px' }}>
          Portal access for students, trainers, and administrators is strictly restricted to laptop and desktop workstations. Please access the portal through your laptop to view classes, assignments, and your dashboard.
        </p>

        {/* Mobile Note */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 14,
          padding: '14px 18px',
          width: '100%',
          marginBottom: 24,
          textAlign: 'center',
          fontSize: 12.5,
          color: '#CBD5E1',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontWeight: 700, color: '#93C5FD', marginBottom: 4 }}>
            Mobile Supported Services:
          </div>
          <div>
            You can explore Academy plans, view course curriculum, and register online anytime on your mobile phone.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <a
            href="/academy"
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: '#FFFFFF',
              padding: '12px 18px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
            }}
          >
            <ArrowLeft size={16} /> Explore Academy Showcase
          </a>

          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#CBD5E1',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              padding: '12px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxSizing: 'border-box'
            }}
          >
            <LogOut size={15} /> Return to Login Screen
          </button>
        </div>
      </div>
    </div>
  );
}

