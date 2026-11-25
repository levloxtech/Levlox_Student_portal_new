import React, { useState, useEffect } from 'react';
import {
  Share2, Users, IndianRupee, Gift, Check, Copy,
  ExternalLink, Clock, CheckCircle2, AlertCircle, Sparkles,
  MessageCircle, Smartphone, User, ArrowRight, Edit3
} from 'lucide-react';

export default function StudentReferralView({ currentUser, userProfile }) {
  const email = (currentUser?.email || userProfile?.email || '').toLowerCase().trim();
  const defaultName = userProfile?.name || currentUser?.displayName || email.split('@')[0];
  const defaultPhone = userProfile?.phone || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ totalReferred: 0, totalEarned: 0, pendingPayout: 0, completedPayout: 0 });
  const [referrals, setReferrals] = useState([]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: defaultName,
    phone: defaultPhone,
    upiId: ''
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchReferralProfile = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/membership/referral/profile/${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setStats(data.stats || { totalReferred: 0, totalEarned: 0, pendingPayout: 0, completedPayout: 0 });
        setReferrals(data.referrals || []);
        if (data.profile) {
          setFormData({
            name: data.profile.name || defaultName,
            phone: data.profile.phone || defaultPhone,
            upiId: data.profile.upiId || ''
          });
          if (!data.profile.isRegistered || !data.profile.upiId) {
            setIsEditing(true);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch referral profile:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralProfile();
  }, [email]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.upiId.trim()) {
      setErrorMsg('Full Name, Phone Number, and UPI ID are all required for receiving cashback.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/membership/referral/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          upiId: formData.upiId.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save referral registration.');

      setSuccessMsg('✓ Your referral profile is active! Share your code to earn 15% cashback.');
      setProfile(data.profile);
      setIsEditing(false);
      fetchReferralProfile();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const referralCode = profile?.referralCode || 'REF-LEVLOX';
  const shareUrl = `${window.location.origin}/academy?ref=${referralCode}`;
  const whatsappText = encodeURIComponent(
    `🚀 Hey! Join me on Levlox Academy and get an instant 15% discount on the Weekly Sprint (₹113) or 1-Year Machine Learning Internship (₹11,499)!\n\nUse my Referral Code: ${referralCode}\n\nEnrol here: ${shareUrl}`
  );

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
        <div style={{ display: 'inline-block', width: 28, height: 28, border: '3px solid #CBD5E1', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>Loading your Referral & Cashback Hub...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100, margin: '0 auto', width: '100%' }}>
      {/* ══ HERO BANNER ══ */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #31104B 100%)',
        borderRadius: 18,
        padding: '28px 32px',
        color: '#FFFFFF',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 760, position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(234, 179, 8, 0.2)', color: '#FDE047',
            border: '1px solid rgba(234, 179, 8, 0.4)',
            padding: '5px 14px', borderRadius: 24, fontSize: 12.5, fontWeight: 800, marginBottom: 12
          }}>
            <Sparkles size={14} />
            <span>STUDENT REFER & EARN PROGRAM</span>
          </div>

          <h1 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px' }}>
            Earn 15% Money Cashback on Every Referral!
          </h1>
          <p style={{ margin: 0, color: '#CBD5E1', fontSize: 14.5, lineHeight: 1.6 }}>
            Share your unique referral code with friends, classmates, and peers. When they enrol in any program (Weekly Sprint or 1-Year Internship),{' '}
            <strong style={{ color: '#FDE047' }}>you receive 15% cashback transferred directly to your UPI ID within 2 days</strong>, and they get an instant 15% discount!
          </p>
        </div>
      </div>

      {/* ══ REGISTRATION / UPI SETUP CARD ══ */}
      {(!profile?.isRegistered || !profile?.upiId || isEditing) && (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 16,
          padding: '24px 28px',
          border: '1.5px solid #C7D2FE',
          boxShadow: '0 4px 20px rgba(79, 70, 229, 0.08)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Smartphone size={20} color="#4F46E5" />
                {profile?.isRegistered ? 'Update Payout Details (UPI ID)' : 'Activate Your 15% Referral Code'}
              </h2>
              <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>
                Enter your Name, Phone Number, and UPI ID where our finance team will disburse your 15% cashback within 2 days.
              </p>
            </div>
            {profile?.isRegistered && profile?.upiId && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: '#F1F5F9', border: 'none', color: '#475569', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>

          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
              ⚠ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Your Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rishvanth K K"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9876543210"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13.5 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Your UPI ID (For 15% Cashback Transfer) *
              </label>
              <input
                type="text"
                value={formData.upiId}
                onChange={e => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #6366F1', background: '#EEF2FF', fontSize: 13.5, fontWeight: 700, color: '#312E81' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px 24px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)'
                }}
              >
                {saving ? 'Activating...' : (profile?.isRegistered ? 'Update Payout Details' : 'Activate Referral Code & Start Earning →')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ REFERRAL CODE & SHARING BAR ══ */}
      {profile?.isRegistered && profile?.upiId && !isEditing && (
        <div style={{
          background: 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          border: '1.5px solid #C7D2FE',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', marginBottom: 6 }}>
              Your Unique Referral Code
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 900,
                color: '#1E1B4B',
                background: '#FFFFFF',
                padding: '8px 18px',
                borderRadius: 10,
                border: '2px dashed #6366F1',
                letterSpacing: 1
              }}>
                {referralCode}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  background: copiedCode ? '#059669' : '#4F46E5',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '9px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.2s'
                }}
              >
                {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>

              <a
                href={`https://wa.me/?text=${whatsappText}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#25D366',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  padding: '9px 18px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                }}
              >
                <MessageCircle size={16} /> Share on WhatsApp
              </a>
            </div>

            <div style={{ marginTop: 10, fontSize: 12.5, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Payout UPI ID: <strong>{profile.upiId}</strong></span>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 12, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 2 }}
              >
                <Edit3 size={12} /> Change UPI
              </button>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF',
            padding: '14px 18px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            maxWidth: 320,
            fontSize: 12.5,
            color: '#334155',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: 2 }}>⚡ 2-Day Payout Guarantee</strong>
            Once your friend verifies their payment on Levlox Academy, our accounts team dispatches your 15% cashback via UPI within 48 hours.
          </div>
        </div>
      )}

      {/* ══ METRIC STATS ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Friends Enrolled</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{stats.totalReferred}</div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total 15% Earned</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>₹{stats.totalEarned.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending (Within 2 Days)</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>₹{stats.pendingPayout.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F0FDF4', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Transferred to UPI</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D' }}>₹{stats.completedPayout.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* ══ REFERRED PEERS TABLE ══ */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '22px 24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#4F46E5" />
              Friends You Have Referred ({referrals.length})
            </h3>
            <p style={{ margin: '3px 0 0', color: '#64748B', fontSize: 13 }}>
              Live record of everyone who enrolled using your referral code and the status of your 15% cashback.
            </p>
          </div>
        </div>

        {referrals.length === 0 ? (
          <div style={{
            padding: '48px 20px',
            textAlign: 'center',
            background: '#F8FAFC',
            borderRadius: 12,
            border: '1px dashed #CBD5E1'
          }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#EEF2FF', color: '#4F46E5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Share2 size={24} />
            </div>
            <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#0F172A' }}>
              No Referrals Yet
            </h4>
            <p style={{ margin: '0 auto 16px', color: '#64748B', fontSize: 13, maxWidth: 440 }}>
              Share your referral code <strong>{referralCode}</strong> with friends. As soon as they enrol in a weekly sprint or internship, their details and your 15% cashback will appear here!
            </p>
            <a
              href={`https://wa.me/?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#25D366',
                color: '#FFFFFF',
                textDecoration: 'none',
                padding: '9px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <MessageCircle size={16} /> Share on WhatsApp Now
            </a>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 16px' }}>Referred Friend</th>
                  <th style={{ padding: '12px 16px' }}>Course / Program</th>
                  <th style={{ padding: '12px 16px' }}>Friend Paid</th>
                  <th style={{ padding: '12px 16px' }}>Your 15% Cashback</th>
                  <th style={{ padding: '12px 16px' }}>Payout Status</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>{r.studentName}</div>
                      <div style={{ color: '#64748B', fontSize: 12 }}>{r.studentEmail}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>
                      {r.planName || (r.planId === 'weekly' ? 'Weekly Learning Sprint' : '1-Year Internship')}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0F172A' }}>
                      ₹{Number(r.paidAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: '#DCFCE7', color: '#15803D',
                        fontWeight: 900, fontSize: 13.5, padding: '4px 10px',
                        borderRadius: 6
                      }}>
                        + ₹{Number(r.cashbackAmount || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {r.status === 'paid' ? (
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#DCFCE7', color: '#15803D',
                            padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800
                          }}>
                            <CheckCircle2 size={13} /> Sent to UPI
                          </span>
                          {r.utr && (
                            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontFamily: 'monospace' }}>
                              UTR: {r.utr}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#FEF3C7', color: '#92400E',
                            padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800
                          }}>
                            <Clock size={13} /> Processing (Within 2 Days)
                          </span>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                            Disbursing to {profile?.upiId || 'UPI'}
                          </div>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
