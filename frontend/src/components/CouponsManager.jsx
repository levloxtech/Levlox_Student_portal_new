import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, Calendar, CheckCircle2, Clock,
  AlertTriangle, ShieldAlert, Sparkles, RefreshCw,
  User, Phone, Mail, MessageCircle, CreditCard, Copy,
  Check, Users, IndianRupee, Eye, ExternalLink, Search,
  Percent, Share2, ArrowRight, X, CheckCheck
} from 'lucide-react';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [referralData, setReferralData] = useState({ stats: {}, payouts: [], profiles: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'redemptions' | 'referrals'
  const [filterCouponCode, setFilterCouponCode] = useState('');
  const [copiedUpi, setCopiedUpi] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [referralSearch, setReferralSearch] = useState('');

  // Payout confirmation modal state
  const [payoutModal, setPayoutModal] = useState({
    isOpen: false,
    payout: null,
    utr: '',
    note: '',
    saving: false,
    error: ''
  });

  const [form, setForm] = useState({
    code: '',
    discount: '',
    discountType: 'fixed', // 'fixed' | 'percentage'
    minPlan: 'all',
    expiryDate: '',
    description: '',
    promoterName: '',
    promoterPhone: '',
    promoterWhatsapp: '',
    promoterEmail: '',
    promoterUpiId: ''
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [resCoupons, resRedemptions, resReferrals] = await Promise.all([
        fetch('/api/membership/coupons'),
        fetch('/api/membership/coupon-redemptions'),
        fetch('/api/membership/referrals/admin-list')
      ]);
      const dataCoupons = await resCoupons.json();
      const dataRedemptions = await resRedemptions.json();
      const dataReferrals = await resReferrals.json();

      if (dataCoupons.success && Array.isArray(dataCoupons.coupons)) {
        setCoupons(dataCoupons.coupons);
      }
      if (dataRedemptions.success && Array.isArray(dataRedemptions.redemptions)) {
        setRedemptions(dataRedemptions.redemptions);
      }
      if (dataReferrals.success) {
        setReferralData({
          stats: dataReferrals.stats || {},
          payouts: dataReferrals.payouts || [],
          profiles: dataReferrals.profiles || []
        });
      }
    } catch (err) {
      console.warn('Failed to fetch coupons/referrals:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUpi(key);
    setTimeout(() => setCopiedUpi(''), 2000);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!form.code || form.discount === '') {
      setErrorMsg('Coupon code and discount amount are required.');
      return;
    }
    const cleanDiscount = Number(form.discount);
    if (form.discountType === 'percentage' && (cleanDiscount <= 0 || cleanDiscount > 100)) {
      setErrorMsg('Percentage discount must be between 1% and 100%.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/membership/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          discount: cleanDiscount,
          discountType: form.discountType,
          minPlan: form.minPlan,
          expiryDate: form.expiryDate || null,
          description: form.description.trim() || (form.discountType === 'percentage' ? `${cleanDiscount}% promotional discount` : `₹${cleanDiscount} promotional discount`),
          promoterName: form.promoterName.trim(),
          promoterPhone: form.promoterPhone.trim(),
          promoterWhatsapp: (form.promoterWhatsapp || form.promoterPhone).trim(),
          promoterEmail: form.promoterEmail.trim().toLowerCase(),
          promoterUpiId: form.promoterUpiId.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coupon');

      setSuccessMsg(`Coupon '${data.coupon.code}' (${form.discountType === 'percentage' ? cleanDiscount + '%' : '₹' + cleanDiscount}) created successfully!`);
      setForm({
        code: '',
        discount: '',
        discountType: 'fixed',
        minPlan: 'all',
        expiryDate: '',
        description: '',
        promoterName: '',
        promoterPhone: '',
        promoterWhatsapp: '',
        promoterEmail: '',
        promoterUpiId: ''
      });
      fetchAllData();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (code) => {
    if (!window.confirm(`Are you sure you want to delete coupon '${code}'?`)) return;
    try {
      const res = await fetch(`/api/membership/coupons/${code}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete coupon');
      fetchAllData();
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
    }
  };

  // Submit Payout Mark Paid via UPI
  const submitPayoutPaid = async () => {
    if (!payoutModal.payout) return;
    setPayoutModal(prev => ({ ...prev, saving: true, error: '' }));
    try {
      const res = await fetch('/api/membership/referrals/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payoutId: payoutModal.payout.id,
          utr: payoutModal.utr.trim(),
          note: payoutModal.note.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to mark payout as paid.');

      setPayoutModal({ isOpen: false, payout: null, utr: '', note: '', saving: false, error: '' });
      fetchAllData();
    } catch (err) {
      setPayoutModal(prev => ({ ...prev, saving: false, error: err.message }));
    }
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    exp.setHours(23, 59, 59, 999);
    return new Date() > exp;
  };

  // Redemptions filtered by search or code
  const filteredRedemptions = redemptions.filter(r => {
    const matchesFilterCode = !filterCouponCode || r.couponCode?.toUpperCase() === filterCouponCode.toUpperCase();
    if (!matchesFilterCode) return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.studentName?.toLowerCase().includes(term) ||
      r.studentEmail?.toLowerCase().includes(term) ||
      r.studentPhone?.includes(term) ||
      r.couponCode?.toLowerCase().includes(term) ||
      r.promoterName?.toLowerCase().includes(term) ||
      r.promoterUpiId?.toLowerCase().includes(term)
    );
  });

  // Filtered Referral Payouts
  const filteredPayouts = (referralData.payouts || []).filter(p => {
    if (!referralSearch) return true;
    const term = referralSearch.toLowerCase();
    return (
      p.referrerName?.toLowerCase().includes(term) ||
      p.referrerEmail?.toLowerCase().includes(term) ||
      p.referrerPhone?.includes(term) ||
      p.referrerUpiId?.toLowerCase().includes(term) ||
      p.studentName?.toLowerCase().includes(term) ||
      p.studentEmail?.toLowerCase().includes(term) ||
      p.referralCode?.toLowerCase().includes(term) ||
      p.utr?.toLowerCase().includes(term)
    );
  });

  const totalDiscountGiven = redemptions.reduce((acc, r) => acc + (Number(r.discount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 60%, #172554 100%)',
        borderRadius: 16,
        padding: '24px 28px',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{ maxWidth: 680 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(168, 85, 247, 0.25)', color: '#C084FC',
            padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8
          }}>
            <Tag size={14} />
            <span>Dual Coupon Discount (₹ & %) + Student 15% Cashback Hub</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
            Coupons, Referral Program & Cashback Payouts
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 13.5, lineHeight: 1.5 }}>
            Create coupons with Fixed ₹ Amount or Percentage % discounts. Track student referrals, view referrer UPI IDs, and disburse 15% cashback payouts directly.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchAllData}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255, 255, 255, 0.12)', color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.25)', padding: '9px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh All
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Coupons</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>{coupons.length}</div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Coupon Redemptions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{redemptions.length}</div>
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
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending 15% UPI Payouts</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>
              ₹{(referralData.stats?.pendingCashback || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F0FDF4', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Paid via UPI</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#15803D' }}>
              ₹{(referralData.stats?.paidCashback || 0).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 10, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('coupons'); setFilterCouponCode(''); }}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 800,
            border: 'none', cursor: 'pointer',
            background: activeTab === 'coupons' ? '#2563EB' : '#F1F5F9',
            color: activeTab === 'coupons' ? '#FFFFFF' : '#475569',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}
        >
          <Tag size={15} /> All Coupons ({coupons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('redemptions')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 800,
            border: 'none', cursor: 'pointer',
            background: activeTab === 'redemptions' ? '#2563EB' : '#F1F5F9',
            color: activeTab === 'redemptions' ? '#FFFFFF' : '#475569',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}
        >
          <Users size={15} /> Who Redeemed ({redemptions.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('referrals')}
          style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13.5, fontWeight: 800,
            border: 'none', cursor: 'pointer',
            background: activeTab === 'referrals' ? '#7C3AED' : '#F1F5F9',
            color: activeTab === 'referrals' ? '#FFFFFF' : '#475569',
            display: 'inline-flex', alignItems: 'center', gap: 6
          }}
        >
          <Share2 size={15} /> Student Referrals & 15% Cashback ({referralData.payouts?.length || 0})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 1: CREATE COUPONS & ACTIVE COUPONS LIST
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'coupons' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {/* Create Coupon Form Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={18} color="#7C3AED" /> Create Promotional Coupon (₹ or %)
            </h3>

            {errorMsg && (
              <div style={{
                background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B',
                padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
              }}>
                ⚠ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46',
                padding: '10px 14px', borderRadius: 8, fontSize: 12.5, marginBottom: 14
              }}>
                ✓ {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* SECTION 1: COUPON DETAILS & DISCOUNT TYPE */}
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#4338CA', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  1. Coupon & Discount Rule
                </span>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DISCOUNT15, SPECIAL500, LEVLOX14"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13, textTransform: 'uppercase', fontWeight: 700
                    }}
                  />
                </div>

                {/* DISCOUNT TYPE SWITCHER (₹ FLAT VS % PERCENTAGE) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Discount Calculation Type *
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, discountType: 'fixed' })}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 700,
                        border: form.discountType === 'fixed' ? '1.5px solid #2563EB' : '1px solid #CBD5E1',
                        background: form.discountType === 'fixed' ? '#EFF6FF' : '#FFF',
                        color: form.discountType === 'fixed' ? '#1D4ED8' : '#475569',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                      }}
                    >
                      <IndianRupee size={14} /> Fixed ₹ Amount
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, discountType: 'percentage' })}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 7, fontSize: 12.5, fontWeight: 700,
                        border: form.discountType === 'percentage' ? '1.5px solid #7C3AED' : '1px solid #CBD5E1',
                        background: form.discountType === 'percentage' ? '#F5F3FF' : '#FFF',
                        color: form.discountType === 'percentage' ? '#6D28D9' : '#475569',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5
                      }}
                    >
                      <Percent size={14} /> Percentage % Discount
                    </button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      {form.discountType === 'percentage' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      placeholder={form.discountType === 'percentage' ? 'e.g. 15 (for 15%)' : 'e.g. 500, 1000'}
                      value={form.discount}
                      onChange={e => setForm({ ...form, discount: e.target.value })}
                      min="1"
                      max={form.discountType === 'percentage' ? 100 : 50000}
                      required
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1.5px solid #CBD5E1', fontSize: 13, fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Target Plan *
                    </label>
                    <select
                      value={form.minPlan}
                      onChange={e => setForm({ ...form, minPlan: e.target.value })}
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13, background: '#FFF'
                      }}
                    >
                      <option value="all">All Plans (Weekly & Annual)</option>
                      <option value="weekly">Weekly Sprint Only (₹113)</option>
                      <option value="annual">Annual Internship Only (₹11,499)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder={form.discountType === 'percentage' ? 'e.g. 15% Special Discount' : 'e.g. ₹500 instant discount'}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                  />
                </div>
              </div>

              {/* SECTION 2: PROMOTER / AFFILIATE DETAILS */}
              <div style={{ background: '#F8FAFC', padding: '12px 14px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  2. Promoter / Affiliate Information (Optional)
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      Promoter Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Student / Partner"
                      value={form.promoterName}
                      onChange={e => setForm({ ...form, promoterName: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.promoterPhone}
                      onChange={e => setForm({ ...form, promoterPhone: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="promoter@email.com"
                      value={form.promoterEmail}
                      onChange={e => setForm({ ...form, promoterEmail: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 3 }}>
                      UPI ID (For Cashback)
                    </label>
                    <input
                      type="text"
                      placeholder="name@okaxis"
                      value={form.promoterUpiId}
                      onChange={e => setForm({ ...form, promoterUpiId: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #CBD5E1', fontSize: 12.5, fontWeight: 600 }}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '11px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Plus size={16} />
                {saving ? 'Creating Coupon...' : 'Save & Publish Coupon'}
              </button>
            </form>
          </div>

          {/* Active Coupons List Card */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Active Coupons ({coupons.length})</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Live on Levlox Academy</span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}>
              {coupons.length === 0 ? (
                <div style={{ padding: '36px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5 }}>
                  No coupons found. Create your first discount coupon above.
                </div>
              ) : (
                coupons.map((c) => {
                  const expired = isExpired(c.expiryDate);
                  const isPct = (c.discountType === 'percentage');
                  const redemptionCount = c.redemptionCount || 0;
                  const expiryText = c.expiryDate
                    ? new Date(c.expiryDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                    : 'Lifetime (No Expiry)';

                  return (
                    <div
                      key={c.id || c.code}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        padding: '14px 16px',
                        background: expired ? '#FFF7F7' : '#FFFFFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'monospace', fontSize: 15, fontWeight: 900,
                            letterSpacing: 0.5, color: '#1E1B4B',
                            background: '#EEF2FF', padding: '3px 8px', borderRadius: 6
                          }}>
                            {c.code}
                          </span>
                          <span style={{
                            fontWeight: 800,
                            color: isPct ? '#7C3AED' : '#16A34A',
                            background: isPct ? '#F5F3FF' : '#DCFCE7',
                            padding: '2px 8px', borderRadius: 5, fontSize: 12.5
                          }}>
                            {isPct ? `${c.discount}% OFF` : `₹${c.discount} OFF`}
                          </span>
                          {expired ? (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '1px 6px', borderRadius: 4 }}>
                              EXPIRED
                            </span>
                          ) : (
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4 }}>
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteCoupon(c.code)}
                          title="Delete coupon"
                          style={{
                            background: 'none', border: 'none', color: '#EF4444',
                            cursor: 'pointer', padding: 6, borderRadius: 6
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Plan & Expiry Details */}
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Plan: <strong style={{ color: '#334155' }}>{c.minPlan || 'All'}</strong> &bull; Valid: <strong style={{ color: expired ? '#DC2626' : '#0F172A' }}>{expiryText}</strong>
                      </div>

                      {/* Promoter / Beneficiary Info Box */}
                      {(c.promoterName || c.promoterUpiId || c.promoterPhone) && (
                        <div style={{
                          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                          padding: '8px 10px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4
                        }}>
                          <div style={{ fontWeight: 700, color: '#4338CA', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={13} /> Owner: {c.promoterName || 'Affiliate Partner'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', flexWrap: 'wrap' }}>
                            {c.promoterPhone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} /> {c.promoterPhone}
                              </span>
                            )}
                            {c.promoterUpiId && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0F172A', fontWeight: 700, background: '#FEF3C7', padding: '1px 6px', borderRadius: 4 }}>
                                <CreditCard size={12} /> {c.promoterUpiId}
                                <button
                                  type="button"
                                  onClick={() => handleCopy(c.promoterUpiId, c.code)}
                                  title="Copy UPI ID"
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 2 }}
                                >
                                  {copiedUpi === c.code ? <Check size={12} color="#16A34A" /> : <Copy size={12} color="#475569" />}
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Redemptions count & Quick link to view redemptions */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px dashed #E2E8F0' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: redemptionCount > 0 ? '#16A34A' : '#94A3B8' }}>
                          {redemptionCount} Student{redemptionCount === 1 ? '' : 's'} Redeemed
                        </span>

                        {redemptionCount > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setFilterCouponCode(c.code);
                              setActiveTab('redemptions');
                            }}
                            style={{
                              background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA',
                              padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Eye size={12} /> View {redemptionCount} Redeemed Students →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 2: WHO REDEEMED / REDEMPTION LOGS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'redemptions' && (
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
          {/* Header & Filter Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={20} color="#2563EB" /> Who Redeemed Coupons
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
                Live record of students who applied and completed payments using promotional & affiliate coupons.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {filterCouponCode && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA',
                  padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700
                }}>
                  <span>Filtering: {filterCouponCode}</span>
                  <button
                    onClick={() => setFilterCouponCode('')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4338CA', fontWeight: 900 }}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div style={{ position: 'relative', minWidth: 240 }}>
                <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search student, coupon, or promoter..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 12.5
                  }}
                />
              </div>
            </div>
          </div>

          {/* Redemptions Table */}
          {filteredRedemptions.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
              {filterCouponCode
                ? `No redemptions found for coupon '${filterCouponCode}'.`
                : 'No students have completed payments with coupons yet.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Student (Who Redeemed)</th>
                    <th style={{ padding: '12px 16px' }}>Coupon Used</th>
                    <th style={{ padding: '12px 16px' }}>Coupon Owner / Promoter</th>
                    <th style={{ padding: '12px 16px' }}>Plan & Amount Paid</th>
                    <th style={{ padding: '12px 16px' }}>Date & Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRedemptions.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>{r.studentName}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{r.studentEmail}</div>
                        {r.studentPhone && <div style={{ color: '#94A3B8', fontSize: 11.5 }}>📱 {r.studentPhone}</div>}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontFamily: 'monospace', fontWeight: 900,
                          color: '#4338CA', background: '#EDE9FE',
                          padding: '3px 8px', borderRadius: 6, fontSize: 13
                        }}>
                          {r.couponCode}
                        </span>
                        <div style={{ color: '#16A34A', fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                          - ₹{r.discount} Discount
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        {r.promoterName || r.promoterUpiId ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.promoterName || 'Affiliate Partner'}</div>
                            {r.promoterPhone && <div style={{ color: '#64748B', fontSize: 12 }}>📱 {r.promoterPhone}</div>}
                            {r.promoterUpiId && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  background: '#FEF3C7', color: '#92400E', padding: '2px 6px',
                                  borderRadius: 4, fontSize: 11.5, fontWeight: 700
                                }}>
                                  UPI: {r.promoterUpiId}
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(r.promoterUpiId, r.id)}
                                    title="Copy UPI ID"
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                  >
                                    {copiedUpi === r.id ? <Check size={11} color="#16A34A" /> : <Copy size={11} color="#92400E" />}
                                  </button>
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: 12, fontStyle: 'italic' }}>
                            Standard Academy Voucher
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{r.planName || (r.planId === 'weekly' ? 'Weekly Sprint' : '1-Year Internship')}</div>
                        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 14, marginTop: 2 }}>
                          Paid ₹{Number(r.paidAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: '#475569', fontSize: 12.5 }}>
                          {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Recent'}
                        </div>
                        {r.invoiceNumber && (
                          <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            {r.invoiceNumber}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          TAB 3: STUDENT REFERRALS & 15% CASHBACK PAYOUTS
      ══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'referrals' && (
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
          {/* Header & Search */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Share2 size={20} color="#7C3AED" /> Student Referrals & 15% Cashback Payouts
              </h3>
              <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 13 }}>
                List of referring students, their UPI IDs, referred peers who paid, and 15% cashback disbursement status.
              </p>
            </div>

            <div style={{ position: 'relative', minWidth: 260 }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search referrer, UPI, friend, or code..."
                value={referralSearch}
                onChange={e => setReferralSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8,
                  border: '1px solid #CBD5E1', fontSize: 12.5
                }}
              />
            </div>
          </div>

          {filteredPayouts.length === 0 ? (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94A3B8', fontSize: 14 }}>
              No referral payouts found. As students refer friends using their referral code, payouts will appear here.
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontSize: 12, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px' }}>Referring Student (Send 15% Cashback Here)</th>
                    <th style={{ padding: '12px 16px' }}>Referred Friend (Who Paid)</th>
                    <th style={{ padding: '12px 16px' }}>Friend's Payment</th>
                    <th style={{ padding: '12px 16px' }}>15% Cashback Due</th>
                    <th style={{ padding: '12px 16px' }}>Payout Status & Action</th>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayouts.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      {/* Referrer Details with 1-click Copy UPI */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>{p.referrerName}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{p.referrerEmail}</div>
                        {p.referrerPhone && <div style={{ color: '#64748B', fontSize: 11.5 }}>📱 {p.referrerPhone}</div>}
                        <div style={{ marginTop: 5 }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            background: '#FEF3C7', color: '#92400E', padding: '3px 8px',
                            borderRadius: 5, fontSize: 12, fontWeight: 800, border: '1px solid #FDE68A'
                          }}>
                            UPI: {p.referrerUpiId || 'Not registered'}
                            {p.referrerUpiId && (
                              <button
                                type="button"
                                onClick={() => handleCopy(p.referrerUpiId, p.id)}
                                title="Copy UPI ID"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                {copiedUpi === p.id ? <Check size={13} color="#16A34A" /> : <Copy size={13} color="#92400E" />}
                              </button>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Referred Friend */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{p.studentName}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{p.studentEmail}</div>
                        {p.studentPhone && <div style={{ color: '#94A3B8', fontSize: 11.5 }}>📱 {p.studentPhone}</div>}
                        <div style={{ marginTop: 4 }}>
                          <span style={{ background: '#F1F5F9', color: '#475569', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            {p.planName || (p.planId === 'weekly' ? 'Weekly Sprint' : '1-Year Internship')}
                          </span>
                        </div>
                      </td>

                      {/* Paid Amount */}
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F172A', fontSize: 14 }}>
                        ₹{Number(p.paidAmount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* 15% Cashback Amount */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          background: '#DCFCE7', color: '#15803D',
                          fontWeight: 900, fontSize: 14, padding: '4px 10px',
                          borderRadius: 6, border: '1px solid #86EFAC'
                        }}>
                          ₹{Number(p.cashbackAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 4 }}>
                          (15% of payment)
                        </div>
                      </td>

                      {/* Payout Status & Action Button */}
                      <td style={{ padding: '14px 16px' }}>
                        {p.status === 'paid' ? (
                          <div>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: '#DCFCE7', color: '#15803D',
                              padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800
                            }}>
                              <CheckCircle2 size={13} /> Paid via UPI
                            </span>
                            {p.utr && (
                              <div style={{ fontSize: 11, color: '#64748B', marginTop: 3, fontFamily: 'monospace' }}>
                                Ref: {p.utr}
                              </div>
                            )}
                            {p.paidAt && (
                              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                                {new Date(p.paidAt).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              background: '#FEF3C7', color: '#92400E',
                              padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 800, width: 'fit-content'
                            }}>
                              <Clock size={13} /> Pending Transfer
                            </span>
                            <button
                              type="button"
                              onClick={() => setPayoutModal({
                                isOpen: true,
                                payout: p,
                                utr: '',
                                note: '',
                                saving: false,
                                error: ''
                              })}
                              style={{
                                background: '#16A34A', color: '#FFFFFF', border: 'none',
                                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 800,
                                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Check size={12} /> Mark Paid via UPI
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PAYOUT CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════════ */}
      {payoutModal.isOpen && payoutModal.payout && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 16, padding: '24px 28px',
            maxWidth: 480, width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={20} color="#16A34A" /> Confirm 15% Cashback UPI Payout
              </h3>
              <button
                type="button"
                onClick={() => setPayoutModal({ isOpen: false, payout: null, utr: '', note: '', saving: false, error: '' })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {payoutModal.error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '8px 12px', borderRadius: 8, fontSize: 12.5 }}>
                ⚠ {payoutModal.error}
              </div>
            )}

            <div style={{ background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div><strong>Referrer:</strong> {payoutModal.payout.referrerName} ({payoutModal.payout.referrerPhone || payoutModal.payout.referrerEmail})</div>
              <div>
                <strong>Pay to UPI:</strong>{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0F172A', background: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>
                  {payoutModal.payout.referrerUpiId || 'Not provided'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(payoutModal.payout.referrerUpiId, 'modal')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 6, verticalAlign: 'middle' }}
                >
                  {copiedUpi === 'modal' ? <Check size={13} color="#16A34A" /> : <Copy size={13} color="#475569" />}
                </button>
              </div>
              <div><strong>15% Cashback Amount:</strong> <span style={{ color: '#16A34A', fontWeight: 900, fontSize: 15 }}>₹{Number(payoutModal.payout.cashbackAmount || 0).toLocaleString('en-IN')}</span></div>
              <div><strong>Referred Student:</strong> {payoutModal.payout.studentName}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                UPI Transaction / UTR Reference ID (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 432109876543 or UPI/4321..."
                value={payoutModal.utr}
                onChange={e => setPayoutModal({ ...payoutModal, utr: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Sent via Google Pay"
                value={payoutModal.note}
                onChange={e => setPayoutModal({ ...payoutModal, note: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={() => setPayoutModal({ isOpen: false, payout: null, utr: '', note: '', saving: false, error: '' })}
                style={{ background: '#F1F5F9', border: 'none', color: '#475569', padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={payoutModal.saving}
                onClick={submitPayoutPaid}
                style={{
                  background: '#16A34A', color: '#FFFFFF', border: 'none',
                  padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                }}
              >
                {payoutModal.saving ? 'Confirming...' : '✓ Confirm Transferred via UPI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
