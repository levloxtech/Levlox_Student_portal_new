import React, { useState, useEffect } from 'react';
import {
  Lock, CheckCircle2, Sparkles, Shield,
  CreditCard, ArrowRight, X, Loader2, Tag, Check, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MembershipRenewalModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const student = userProfile || currentUser || {};

  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Dynamically re-verify coupon when switching plans
  useEffect(() => {
    if (isOpen && couponCode.trim() && couponDiscount > 0) {
      const cleanCode = couponCode.trim().toUpperCase();
      fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=${selectedPlan}&email=${encodeURIComponent(student?.email || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.valid) {
            setCouponDiscount(data.discount);
            setCouponMessage(`Coupon "${cleanCode}" applied! You save ₹${data.discount}.`);
          } else {
            setCouponDiscount(0);
            setCouponMessage('');
          }
        })
        .catch(() => {});
    }
  }, [selectedPlan, isOpen]);

  if (!isOpen) return null;

  const previousPlanName = student.membership?.planName || student.course || 'Weekly Learning Cycle';
  const rawExpiry = student.accessExpiresAt || student.portalExpiresAt || student.membership?.expiresAt;
  const expiredDateFormatted = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recently';

  // Plans Config
  const plans = {
    weekly: {
      id: 'weekly',
      name: 'Weekly Learning Cycle',
      badge: 'RENEWAL SPRINT',
      subtitle: 'Sprint-based access • Automatic lock after 7 days',
      originalPrice: 749,
      offerPrice: 299,
      validity: '7 Days Access',
      finalPayable: Math.max(0, 299 - (couponDiscount || 0)),
      features: [
        '7 Days Unlocked Portal Access',
        'Python & Advanced Python Modules',
        'Machine Learning & SQL Foundations',
        'Recorded Video Streaming in HD',
        '5+ Industry-Level & Portfolio Projects',
        'Weekly Learning Sprint & Assessments'
      ]
    },
    annual: {
      id: 'annual',
      name: 'Machine Learning Engineer Internship',
      badge: '★ BEST VALUE: SAVE UP TO ₹24,500',
      subtitle: '3 Months Training + 9 Months Industrial Training',
      callout: '✨ 1 Year Verified Internship Certificate with Industrial Experience',
      originalPrice: 35999,
      offerPrice: 11499,
      validity: '365 Days (1 Full Year)',
      finalPayable: Math.max(0, 11499 - (couponDiscount || 0)),
      features: [
        '365 Days Uninterrupted All-Access Pass',
        'Python, Machine Learning & SQL Foundations',
        '9+ Industry-Level Projects & 4 Production Portfolios',
        'Verified Industry Internship Certificate',
        'Placement Preparation Kit, Resume Builder & LinkedIn Optimizer',
        'Live Doubt Support Sessions & Community Access'
      ]
    }
  };

  const activePlan = plans[selectedPlan];

  // Apply Coupon Handler
  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (!cleanCode) return;
    setCouponError('');
    setCouponMessage('');
    setCouponLoading(true);

    try {
      const res = await fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=${selectedPlan}&email=${encodeURIComponent(student.email || '')}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponDiscount(data.discount);
        setCouponMessage(`Coupon "${cleanCode}" applied! You save ₹${data.discount}.`);
      } else {
        setCouponDiscount(0);
        setCouponError(data.error || 'Invalid or expired coupon code.');
      }
    } catch {
      setCouponDiscount(0);
      setCouponError('Could not verify coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Payment checkout handler for Weekly Sprint or 1-Year Pass via Razorpay Gateway
  const handleRenewalPayment = async () => {
    setLoading(true);
    try {
      const email = student.email;
      const name = student.name || student.displayName || (student.email ? student.email.split('@')[0] : 'Student');
      const phone = (student.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

      const effectivePlanId = selectedPlan;
      const effectiveCoupon = couponDiscount > 0 ? couponCode.trim() : undefined;

      // 1. Create Razorpay order on backend
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: effectivePlanId,
          email,
          name,
          phone,
          couponCode: effectiveCoupon,
          isRenewal: true
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // If payable amount is 0 (fully covered by discount)
      if (orderData.isZeroPayment) {
        await finalizeVerification({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `zero_pay_${Date.now()}`,
          razorpay_signature: 'zero_amount_free_pass',
          planId: effectivePlanId,
          email,
          name,
          phone,
          couponCode: effectiveCoupon,
          isRenewal: true
        });
        return;
      }

      // 2. Load Razorpay script if not already present
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true);
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Payment gateway script could not be loaded. Please check your internet connection.');
      }

      // 3. Open Razorpay live payment gateway modal
      const options = {
        key: orderData.key || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Levlox Academy',
        description: selectedPlan === 'annual'
          ? 'Machine Learning Engineer Internship (365 Days • 1 Full Year)'
          : 'Weekly Sprint Renewal (7 Days Validity)',
        order_id: orderData.orderId,
        prefill: { name, email, contact: phone },
        theme: { color: selectedPlan === 'annual' ? '#7C3AED' : '#2563EB' },
        handler: async function (response) {
          try {
            await finalizeVerification({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId: effectivePlanId,
              email,
              name,
              phone,
              couponCode: effectiveCoupon,
              isRenewal: true
            });
          } catch (verr) {
            alert('Verification issue: ' + verr.message);
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert('Payment failed: ' + (resp.error?.description || 'Transaction was cancelled or declined.'));
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      alert('Payment initialization failed: ' + err.message);
      setLoading(false);
    }
  };

  const handleSimulatedRenewal = async () => {
    setLoading(true);
    try {
      const email = student.email;
      const name = student.name || student.email?.split('@')[0];
      const phone = student.phone || '';
      const effectivePlanId = selectedPlan;
      const effectiveCoupon = couponDiscount > 0 ? couponCode.trim() : undefined;

      await finalizeVerification({
        razorpay_order_id: `sim_ord_${Date.now()}`,
        razorpay_payment_id: `sim_pay_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
        planId: effectivePlanId,
        email,
        name,
        phone,
        couponCode: effectiveCoupon,
        isSimulatedTest: true,
        isRenewal: true
      });
    } catch (err) {
      alert('Simulated renewal failed: ' + err.message);
      setLoading(false);
    }
  };

  const finalizeVerification = async (verifyPayload) => {
    try {
      const res = await fetch('/api/membership/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verifyPayload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Payment verification failed');

      if (refreshProfile) {
        await refreshProfile();
      }

      setPaymentSuccess(data);
      if (typeof onSuccess === 'function') {
        onSuccess(data);
      }
    } catch (err) {
      alert('Verification error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        maxWidth: 640,
        width: '100%',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.35)',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        position: 'relative',
        margin: 'auto'
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#F1F5F9',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            zIndex: 10,
            transition: 'background 0.15s ease'
          }}
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {paymentSuccess ? (
          /* SUCCESS STATE */
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: '#ECFDF5', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', border: '2px solid #A7F3D0'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Membership Successfully Renewed! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 22px', lineHeight: 1.5 }}>
              Your <strong>{paymentSuccess.planName}</strong> is now fully active. All recorded courses, videos, and modules are immediately unlocked.
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 14,
              padding: '16px 20px',
              textAlign: 'left',
              border: '1px solid #E2E8F0',
              marginBottom: 24,
              fontSize: 13
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748B' }}>Invoice Number:</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>{paymentSuccess.invoiceNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: '#64748B' }}>Validity Duration:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {paymentSuccess.membership?.durationDays ? `${paymentSuccess.membership.durationDays} Days Unlocked` : 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Student Roll ID:</span>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>{student.id || student.rollNumber}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                window.location.reload();
              }}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 12,
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14.5,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
              }}
            >
              Start Learning Now →
            </button>
          </div>
        ) : (
          /* HIGH-CONVERTING RENEWAL CHECKOUT (MATCHING ACADEMY SHOWCASE DESIGN) */
          <div>
            {/* Header Banner */}
            <div style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              padding: '24px 26px 14px',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFE4E6',
                border: '1px solid #FECDD3',
                borderRadius: 20,
                padding: '3px 10px',
                color: '#BE123C',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                marginBottom: 8
              }}>
                <Lock size={12} /> SUBSCRIPTION CYCLE LAPSED
              </div>

              <h2 style={{ fontSize: 21, fontWeight: 800, margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                Renew Your Academy Membership
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Your learning validity period has expired. Select a renewal package below to unlock immediate access.
              </p>
            </div>

            {/* Expired Status Pill */}
            <div style={{
              margin: '12px 24px 14px',
              padding: '9px 14px',
              background: '#FFF5F5',
              border: '1px solid #FED7D7',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12.5
            }}>
              <div>
                <span style={{ color: '#991B1B', fontWeight: 600 }}>Previous Plan: </span>
                <span style={{ color: '#7F1D1D', fontWeight: 700 }}>{previousPlanName}</span>
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#E11D48',
                color: '#FFFFFF',
                borderRadius: 6,
                padding: '2px 8px',
                fontSize: 11,
                fontWeight: 700
              }}>
                Expired On {expiredDateFormatted}
              </div>
            </div>

            {/* Two Selectable Plans */}
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* PLAN 1: Weekly Sprint Renewal (₹299) */}
              <div
                onClick={() => setSelectedPlan('weekly')}
                style={{
                  border: selectedPlan === 'weekly' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                  background: selectedPlan === 'weekly' ? '#F0F7FF' : '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: selectedPlan === 'weekly' ? '5px solid #2563EB' : '2px solid #CBD5E1',
                      background: '#FFFFFF', marginTop: 2, flexShrink: 0
                    }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                          Weekly Learning Cycle
                        </strong>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#2563EB',
                          background: '#EFF6FF', border: '1px solid #BFDBFE',
                          padding: '1px 6px', borderRadius: 4
                        }}>
                          7 DAYS
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>
                        Sprint-based access • Automatic lock after 7 days
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through' }}>₹749</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#2563EB' }}>
                        ₹{plans.weekly.finalPayable}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ 7 days access</span>
                  </div>
                </div>

                {/* Features Checklist */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '4px 12px',
                  margin: '8px 0 0 28px',
                  fontSize: 11.5,
                  color: '#475569'
                }}>
                  {plans.weekly.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown (when selected) */}
                {selectedPlan === 'weekly' && (
                  <div style={{
                    marginTop: 12,
                    marginLeft: 28,
                    background: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: 4 }}>
                      <span>Standard Weekly Fee:</span>
                      <span style={{ textDecoration: 'line-through' }}>₹749</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600, marginBottom: couponDiscount > 0 ? 4 : 0 }}>
                      <span>Weekly Renewal Price:</span>
                      <span>₹299</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                        <span>Coupon Discount ({couponCode}):</span>
                        <span>-₹{couponDiscount}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      borderTop: '1px dashed #CBD5E1', paddingTop: 6, marginTop: 4,
                      fontWeight: 800, color: '#2563EB', fontSize: 13
                    }}>
                      <span>NET PAYABLE (7 DAYS):</span>
                      <span>₹{plans.weekly.finalPayable}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* PLAN 2: 1-Year Machine Learning Engineer Internship (₹11,499) */}
              <div
                onClick={() => setSelectedPlan('annual')}
                style={{
                  border: selectedPlan === 'annual' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
                  background: selectedPlan === 'annual' ? '#FAF5FF' : '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Top Badge */}
                <div style={{
                  position: 'absolute', top: -10, right: 16,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                  padding: '2px 10px', borderRadius: 999, letterSpacing: 0.5,
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.35)'
                }}>
                  BEST VALUE: SAVE UP TO ₹24,500
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: selectedPlan === 'annual' ? '5px solid #7C3AED' : '2px solid #CBD5E1',
                      background: '#FFFFFF', marginTop: 2, flexShrink: 0
                    }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                          Machine Learning Engineer Internship
                        </strong>
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: '#7C3AED',
                          background: '#F5F3FF', border: '1px solid #DDD6FE',
                          padding: '1px 6px', borderRadius: 4
                        }}>
                          1 FULL YEAR
                        </span>
                      </div>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>
                        3 Months Training + 9 Months Industrial Training
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: 4 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8', textDecoration: 'line-through' }}>₹35,999</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: '#7C3AED' }}>
                        ₹{plans.annual.finalPayable}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ 1 full year</span>
                  </div>
                </div>

                {/* Highlight Callout */}
                <div style={{
                  marginLeft: 28,
                  marginBottom: 8,
                  background: '#FEF3C7',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <Sparkles size={12} color="#D97706" /> 1 Year Verified Internship Certificate with Industrial Experience
                </div>

                {/* Features Checklist */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '4px 12px',
                  margin: '4px 0 0 28px',
                  fontSize: 11.5,
                  color: '#475569'
                }}>
                  {plans.annual.features.map((feat, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0 }} />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing Breakdown (when selected) */}
                {selectedPlan === 'annual' && (
                  <div style={{
                    marginTop: 12,
                    marginLeft: 28,
                    background: '#FFFFFF',
                    border: '1px solid #DDD6FE',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 12
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: 4 }}>
                      <span>Standard Annual Package:</span>
                      <span style={{ textDecoration: 'line-through' }}>₹35,999</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginBottom: 4 }}>
                      <span>Academy Scholarship Discount:</span>
                      <span>-₹24,500</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600, marginBottom: couponDiscount > 0 ? 4 : 0 }}>
                      <span>Annual Offer Price:</span>
                      <span>₹11,499</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                        <span>Coupon Discount ({couponCode}):</span>
                        <span>-₹{couponDiscount}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      borderTop: '1px dashed #DDD6FE', paddingTop: 6, marginTop: 4,
                      fontWeight: 800, color: '#7C3AED', fontSize: 13
                    }}>
                      <span>NET PAYABLE (1 FULL YEAR):</span>
                      <span>₹{plans.annual.finalPayable}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Have a Referral / Coupon Code Section */}
            <div style={{ padding: '14px 24px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                Have a Referral / Reference Code or Coupon?
              </div>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 11 }} />
                  <input
                    type="text"
                    placeholder="Enter coupon or referral code (e.g. LVX400 or REF-...)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '8px 10px 8px 30px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      fontSize: 12.5,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={couponLoading || !couponCode.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: couponDiscount > 0 ? '#10B981' : (selectedPlan === 'annual' ? '#7C3AED' : '#2563EB'),
                    border: 'none',
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: couponLoading || !couponCode.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  {couponLoading ? <Loader2 size={13} className="animate-spin" /> : couponDiscount > 0 ? <Check size={14} /> : null}
                  {couponDiscount > 0 ? 'Applied' : 'Apply'}
                </button>
              </form>

              {couponMessage && (
                <div style={{
                  fontSize: 12, color: '#065F46', background: '#ECFDF5',
                  border: '1px solid #A7F3D0', borderRadius: 6,
                  padding: '5px 10px', marginTop: 6, fontWeight: 600,
                  display: 'flex', alignItems: 'center', gap: 5
                }}>
                  <CheckCircle2 size={13} color="#059669" />
                  {couponMessage}
                </div>
              )}
              {couponError && (
                <div style={{
                  fontSize: 12, color: '#991B1B', background: '#FEF2F2',
                  border: '1px solid #FECDD3', borderRadius: 6,
                  padding: '5px 10px', marginTop: 6, fontWeight: 600
                }}>
                  ✕ {couponError}
                </div>
              )}
            </div>

            {/* Instant Payment Trust Bar */}
            <div style={{
              margin: '12px 24px 0',
              padding: '7px 12px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11,
              color: '#64748B'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                <Zap size={12} color="#D97706" /> Instant UPI: PhonePe • Google Pay • Paytm • Cards / NetBanking
              </span>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                ✓ Zero Fee
              </span>
            </div>

            {/* Bottom Actions CTA */}
            <div style={{
              padding: '14px 24px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14
            }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>
                  Total Payable:
                </span>
                <span style={{
                  fontSize: 22, fontWeight: 800,
                  color: selectedPlan === 'annual' ? '#7C3AED' : '#2563EB'
                }}>
                  ₹{activePlan.finalPayable}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRenewalPayment}
                disabled={loading}
                style={{
                  background: selectedPlan === 'annual'
                    ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                    : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  padding: '13px 26px',
                  borderRadius: 12,
                  fontSize: 14.5,
                  fontWeight: 800,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: selectedPlan === 'annual'
                    ? '0 8px 20px rgba(124, 58, 237, 0.35)'
                    : '0 8px 20px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.15s ease'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing Payment...
                  </>
                ) : (
                  <>
                    {selectedPlan === 'annual'
                      ? `Pay ₹${plans.annual.finalPayable} for 1-Year Pass →`
                      : `Pay ₹${plans.weekly.finalPayable} to Renew Weekly Sprint →`}
                  </>
                )}
              </button>
            </div>

            {/* Instant Test Simulated Renewal */}
            <div style={{ textAlign: 'center', paddingBottom: 16 }}>
              <button
                type="button"
                onClick={handleSimulatedRenewal}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', color: '#64748B',
                  fontSize: 11.5, cursor: 'pointer', textDecoration: 'underline'
                }}
              >
                ⚡ Instant Test Renewal (Simulated)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
