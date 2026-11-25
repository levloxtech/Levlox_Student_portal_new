import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, Calendar, CheckCircle2, Clock,
  AlertTriangle, ShieldAlert, Sparkles, RefreshCw,
  User, Phone, Mail, MessageCircle, CreditCard, Copy,
  Check, Users, IndianRupee, Eye, ExternalLink, Search
} from 'lucide-react';

export default function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'redemptions'
  const [filterCouponCode, setFilterCouponCode] = useState('');
  const [copiedUpi, setCopiedUpi] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    code: '',
    discount: '',
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

  const fetchCouponsAndRedemptions = async () => {
    setLoading(true);
    try {
      const [resCoupons, resRedemptions] = await Promise.all([
        fetch('/api/membership/coupons'),
        fetch('/api/membership/coupon-redemptions')
      ]);
      const dataCoupons = await resCoupons.json();
      const dataRedemptions = await resRedemptions.json();

      if (dataCoupons.success && Array.isArray(dataCoupons.coupons)) {
        setCoupons(dataCoupons.coupons);
      }
      if (dataRedemptions.success && Array.isArray(dataRedemptions.redemptions)) {
        setRedemptions(dataRedemptions.redemptions);
      }
    } catch (err) {
      console.warn('Failed to fetch coupons/redemptions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponsAndRedemptions();
  }, []);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedUpi(key);
    setTimeout(() => setCopiedUpi(''), 2000);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discount) {
      setErrorMsg('Coupon code and discount amount are required.');
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
          discount: Number(form.discount),
          minPlan: form.minPlan,
          expiryDate: form.expiryDate || null,
          description: form.description.trim() || `₹${form.discount} promotional discount`,
          promoterName: form.promoterName.trim(),
          promoterPhone: form.promoterPhone.trim(),
          promoterWhatsapp: (form.promoterWhatsapp || form.promoterPhone).trim(),
          promoterEmail: form.promoterEmail.trim().toLowerCase(),
          promoterUpiId: form.promoterUpiId.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save coupon');

      setSuccessMsg(`Coupon '${data.coupon.code}' created successfully!`);
      setForm({
        code: '',
        discount: '',
        minPlan: 'all',
        expiryDate: '',
        description: '',
        promoterName: '',
        promoterPhone: '',
        promoterWhatsapp: '',
        promoterEmail: '',
        promoterUpiId: ''
      });
      fetchCouponsAndRedemptions();
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
      fetchCouponsAndRedemptions();
    } catch (err) {
      alert('Error deleting coupon: ' + err.message);
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
            <span>Affiliate & Referral Coupon System</span>
          </div>
          <h2 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800 }}>
            Promotional Coupons & Referral Redemptions
          </h2>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: 13.5, lineHeight: 1.5 }}>
            Create discount coupons with promoter details (Name, Phone, WhatsApp, UPI ID). Track exactly which student redeemed each coupon upon successful payment.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={fetchCouponsAndRedemptions}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255, 255, 255, 0.12)', color: '#FFF',
              border: '1px solid rgba(255, 255, 255, 0.25)', padding: '9px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Coupons</div>
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Redemptions</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>{redemptions.length}</div>
          </div>
        </div>

        <div style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12,
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Discount Saved</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#D97706' }}>₹{totalDiscountGiven.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #E2E8F0', paddingBottom: 10 }}>
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
      </div>

      {/* TAB 1: CREATE COUPONS & ACTIVE COUPONS LIST */}
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
              <Plus size={18} color="#7C3AED" /> Create Affiliate / Referral Coupon
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
              {/* SECTION 1: COUPON DETAILS */}
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
                    placeholder="e.g. RAVI14, LEVLOX100, SPECIAL500"
                    value={form.code}
                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13, textTransform: 'uppercase', fontWeight: 700
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Discount Amount (₹) *
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 14 or 1000"
                      value={form.discount}
                      onChange={e => setForm({ ...form, discount: e.target.value })}
                      min="1"
                      required
                      style={{
                        width: '100%', padding: '9px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700
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
                      <option value="all">All Membership Plans</option>
                      <option value="weekly">Weekly Learning Sprint (Week 1)</option>
                      <option value="monthly">Monthly / Weekly Cycle</option>
                      <option value="annual">Annual Internship (1-Year)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    required
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2: PROMOTER / BENEFICIARY DETAILS */}
              <div style={{ background: '#F5F3FF', padding: '12px 14px', borderRadius: 10, border: '1px solid #DDD6FE', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <User size={13} /> 2. Promoter / Beneficiary Details
                </span>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    Promoter / Person Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ravi Kumar"
                    value={form.promoterName}
                    onChange={e => setForm({ ...form, promoterName: e.target.value })}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: '1px solid #CBD5E1', fontSize: 13
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.promoterPhone}
                      onChange={e => setForm({ ...form, promoterPhone: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={form.promoterWhatsapp}
                      onChange={e => setForm({ ...form, promoterWhatsapp: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. ravi@gmail.com"
                      value={form.promoterEmail}
                      onChange={e => setForm({ ...form, promoterEmail: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                      UPI ID (Payout / Commission)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210@paytm"
                      value={form.promoterUpiId}
                      onChange={e => setForm({ ...form, promoterUpiId: e.target.value })}
                      style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8,
                        border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  Description / Campaign Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Special student partner coupon"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    border: '1px solid #CBD5E1', fontSize: 13
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFF', border: 'none', padding: '12px 18px', borderRadius: 8,
                  fontSize: 14, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                }}
              >
                {saving ? 'Creating...' : 'Create & Activate Coupon'}
              </button>
            </form>
          </div>

          {/* Existing Coupons List */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 14,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Active & Affiliate Coupons</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED', background: '#FAF5FF', padding: '3px 10px', borderRadius: 12 }}>
                {coupons.length} total
              </span>
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', maxHeight: 600 }}>
              {coupons.length === 0 ? (
                <div style={{ padding: '36px 12px', textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
                  No coupon codes created yet. Create one on the left.
                </div>
              ) : (
                coupons.map(c => {
                  const expired = isExpired(c.expiryDate);
                  const expiryText = c.expiryDate
                    ? new Date(c.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'No expiry (Permanent)';

                  const matchedRedemptions = redemptions.filter(r => r.couponCode?.toUpperCase() === c.code?.toUpperCase());
                  const redemptionCount = matchedRedemptions.length || c.redemptionCount || 0;

                  return (
                    <div
                      key={c.code}
                      style={{
                        border: expired ? '1px solid #FECACA' : '1px solid #E2E8F0',
                        background: expired ? '#FFF5F5' : '#FFFFFF',
                        borderRadius: 12,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Top Row: Code, Discount, Expiry & Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 900, fontSize: 15,
                            color: expired ? '#991B1B' : '#4338CA', background: expired ? '#FEE2E2' : '#EDE9FE',
                            padding: '3px 10px', borderRadius: 6, letterSpacing: 0.5
                          }}>
                            {c.code}
                          </span>
                          <span style={{ fontWeight: 800, color: '#16A34A', fontSize: 14 }}>
                            ₹{c.discount} OFF
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
                        Plan: <strong style={{ color: '#334155' }}>{c.minPlan || 'All'}</strong> &bull; Valid Until: <strong style={{ color: expired ? '#DC2626' : '#0F172A' }}>{expiryText}</strong>
                      </div>

                      {/* Promoter / Beneficiary Info Box */}
                      {(c.promoterName || c.promoterUpiId || c.promoterPhone) && (
                        <div style={{
                          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8,
                          padding: '8px 10px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4
                        }}>
                          <div style={{ fontWeight: 700, color: '#4338CA', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <User size={13} /> Owner: {c.promoterName || 'Unnamed Promoter'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#475569', flexWrap: 'wrap' }}>
                            {c.promoterPhone && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Phone size={12} /> {c.promoterPhone}
                              </span>
                            )}
                            {c.promoterWhatsapp && (
                              <a
                                href={`https://wa.me/91${c.promoterWhatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16A34A', textDecoration: 'none', fontWeight: 600 }}
                              >
                                <MessageCircle size={12} /> WhatsApp
                              </a>
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

      {/* TAB 2: WHO REDEEMED / REDEMPTION LOGS */}
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
                      {/* Student info */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 13.5 }}>{r.studentName}</div>
                        <div style={{ color: '#64748B', fontSize: 12 }}>{r.studentEmail}</div>
                        {r.studentPhone && <div style={{ color: '#94A3B8', fontSize: 11.5 }}>📱 {r.studentPhone}</div>}
                      </td>

                      {/* Coupon Used */}
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

                      {/* Promoter / Beneficiary Info */}
                      <td style={{ padding: '14px 16px' }}>
                        {r.promoterName || r.promoterUpiId ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.promoterName || 'Affiliate Partner'}</div>
                            {r.promoterPhone && <div style={{ color: '#64748B', fontSize: 12 }}>📱 {r.promoterPhone}</div>}
                            {r.promoterWhatsapp && (
                              <a
                                href={`https://wa.me/91${r.promoterWhatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#16A34A', fontSize: 11.5, textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                              >
                                <MessageCircle size={11} /> WhatsApp Chat
                              </a>
                            )}
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

                      {/* Plan & Amount */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#334155' }}>{r.planName || (r.planId === 'weekly' ? 'Weekly Sprint' : '1-Year Internship')}</div>
                        <div style={{ color: '#0F172A', fontWeight: 800, fontSize: 14, marginTop: 2 }}>
                          Paid ₹{Number(r.paidAmount || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Date & Invoice */}
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
    </div>
  );
}
