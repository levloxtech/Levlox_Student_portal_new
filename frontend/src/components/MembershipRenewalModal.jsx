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

  // Independent Coupon State for Weekly and Annual Cards
  const [weeklyCoupon, setWeeklyCoupon] = useState('');
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [weeklyMsg, setWeeklyMsg] = useState('');
  const [weeklyErr, setWeeklyErr] = useState('');
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  const [annualCoupon, setAnnualCoupon] = useState('');
  const [annualDiscount, setAnnualDiscount] = useState(0);
  const [annualMsg, setAnnualMsg] = useState('');
  const [annualErr, setAnnualErr] = useState('');
  const [annualLoading, setAnnualLoading] = useState(false);

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  if (!isOpen) return null;

  const previousPlanName = student.membership?.planName || student.course || 'Weekly Learning Cycle';
  const rawExpiry = student.accessExpiresAt || student.portalExpiresAt || student.membership?.expiresAt;
  const expiredDateFormatted = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recently';

  const weeklyFinalPayable = Math.max(0, 299 - weeklyDiscount);
  const annualFinalPayable = Math.max(0, 11499 - annualDiscount);

  // Apply Coupon for Weekly Card
  const handleApplyWeeklyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = weeklyCoupon.trim().toUpperCase();
    if (!cleanCode) return;
    setWeeklyErr('');
    setWeeklyMsg('');
    setWeeklyLoading(true);

    try {
      const res = await fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=weekly&email=${encodeURIComponent(student.email || '')}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setWeeklyDiscount(data.discount);
        setWeeklyMsg(`Coupon "${cleanCode}" applied! You save ₹${data.discount}.`);
      } else {
        setWeeklyDiscount(0);
        setWeeklyErr(data.error || 'Invalid or expired coupon code.');
      }
    } catch {
      setWeeklyDiscount(0);
      setWeeklyErr('Could not verify coupon.');
    } finally {
      setWeeklyLoading(false);
    }
  };

  // Apply Coupon for Annual Card
  const handleApplyAnnualCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanCode = annualCoupon.trim().toUpperCase();
    if (!cleanCode) return;
    setAnnualErr('');
    setAnnualMsg('');
    setAnnualLoading(true);

    try {
      const res = await fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=annual&email=${encodeURIComponent(student.email || '')}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setAnnualDiscount(data.discount);
        setAnnualMsg(`Coupon "${cleanCode}" applied! You save ₹${data.discount}.`);
      } else {
        setAnnualDiscount(0);
        setAnnualErr(data.error || 'Invalid or expired coupon code.');
      }
    } catch {
      setAnnualDiscount(0);
      setAnnualErr('Could not verify coupon.');
    } finally {
      setAnnualLoading(false);
    }
  };

  // Live Gateway Checkout
  const handleRenewalPayment = async (planId) => {
    setLoadingPlan(planId);
    try {
      const email = student.email;
      const name = student.name || student.displayName || (student.email ? student.email.split('@')[0] : 'Student');
      const phone = (student.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

      const effectiveCoupon = planId === 'annual'
        ? (annualDiscount > 0 ? annualCoupon.trim() : undefined)
        : (weeklyDiscount > 0 ? weeklyCoupon.trim() : undefined);

      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
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

      if (orderData.isZeroPayment) {
        await finalizeVerification({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `zero_pay_${Date.now()}`,
          razorpay_signature: 'zero_amount_free_pass',
          planId,
          email,
          name,
          phone,
          couponCode: effectiveCoupon,
          isRenewal: true
        });
        return;
      }

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

      const options = {
        key: orderData.key || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Levlox Academy',
        description: planId === 'annual'
          ? 'Machine Learning Engineer Internship (365 Days • 1 Full Year)'
          : 'Weekly Sprint Renewal (7 Days Validity)',
        order_id: orderData.orderId,
        prefill: { name, email, contact: phone },
        theme: { color: planId === 'annual' ? '#7C3AED' : '#2563EB' },
        handler: async function (response) {
          try {
            await finalizeVerification({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              email,
              name,
              phone,
              couponCode: effectiveCoupon,
              isRenewal: true
            });
          } catch (verr) {
            alert('Verification issue: ' + verr.message);
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        alert('Payment failed: ' + (resp.error?.description || 'Transaction was cancelled or declined.'));
        setLoadingPlan(null);
      });
      rzp.open();
    } catch (err) {
      alert('Payment initialization failed: ' + err.message);
      setLoadingPlan(null);
    }
  };

  // Simulated Test Checkout
  const handleSimulatedRenewal = async (planId) => {
    setLoadingPlan(planId);
    try {
      const email = student.email;
      const name = student.name || student.email?.split('@')[0];
      const phone = student.phone || '';
      const effectiveCoupon = planId === 'annual'
        ? (annualDiscount > 0 ? annualCoupon.trim() : undefined)
        : (weeklyDiscount > 0 ? weeklyCoupon.trim() : undefined);

      await finalizeVerification({
        razorpay_order_id: `sim_ord_${Date.now()}`,
        razorpay_payment_id: `sim_pay_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
        planId,
        email,
        name,
        phone,
        couponCode: effectiveCoupon,
        isSimulatedTest: true,
        isRenewal: true
      });
    } catch (err) {
      alert('Simulated renewal failed: ' + err.message);
      setLoadingPlan(null);
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
      setLoadingPlan(null);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 999999,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 14px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#F8FAFC',
        borderRadius: 24,
        maxWidth: 960,
        width: '100%',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.4)',
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
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748B',
            zIndex: 10,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
          }}
          title="Close dialog"
        >
          <X size={17} />
        </button>

        {paymentSuccess ? (
          /* SUCCESS STATE */
          <div style={{ padding: '48px 32px', textAlign: 'center', background: '#FFFFFF' }}>
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
              Your <strong>{paymentSuccess.planName}</strong> is now active. All recorded courses, videos, and modules are immediately unlocked.
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 14,
              padding: '16px 20px',
              textAlign: 'left',
              border: '1px solid #E2E8F0',
              marginBottom: 24,
              fontSize: 13,
              maxWidth: 460,
              margin: '0 auto 24px'
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
                padding: '13px 32px',
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
          /* TWO SEPARATE SIDE-BY-SIDE CARDS (MIRRORING ACADEMY SHOWCASE CARDS) */
          <div>
            {/* Top Header Banner */}
            <div style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              padding: '20px 28px 16px',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFE4E6',
                border: '1px solid #FECDD3',
                borderRadius: 20,
                padding: '3px 12px',
                color: '#BE123C',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                marginBottom: 8
              }}>
                <Lock size={12} /> SUBSCRIPTION CYCLE LAPSED
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#0F172A', letterSpacing: '-0.3px' }}>
                Renew Your Academy Membership
              </h2>
            </div>

            {/* TWO SEPARATE CARDS GRID */}
            <div style={{
              padding: '20px 22px 24px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: 20,
              alignItems: 'stretch'
            }}>
              {/* ─────────────────────────────────────────────────────────── */}
              {/* CARD 1: WEEKLY LEARNING CYCLE (₹299)                         */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 18,
                border: '2px solid #3B82F6',
                boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.1)',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                <div>
                  {/* Card Title & Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                        Weekly Learning Cycle
                      </h3>
                      <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginTop: 2 }}>
                        Sprint-based access • Automatic lock after 7 days
                      </span>
                    </div>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '5px solid #2563EB', background: '#FFFFFF', flexShrink: 0
                    }} />
                  </div>

                  {/* Pricing Header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '14px 0 16px' }}>
                    <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through' }}>₹749</span>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#0F172A' }}>
                      ₹{weeklyFinalPayable}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>/ 7 days access</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#047857',
                      background: '#ECFDF5', border: '1px solid #A7F3D0',
                      padding: '2px 7px', borderRadius: 4, marginLeft: 'auto'
                    }}>
                      RENEWAL SPECIAL
                    </span>
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                    {[
                      '7 Days Unlocked Portal Access',
                      'Python & Advance Python Modules',
                      'Machine Learning & SQL Foundations',
                      'Recorded Video Streaming in HD',
                      '5+ Industry-Level & Portfolio Projects',
                      'Weekly Learning Sprint & Assessments'
                    ].map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
                        <CheckCircle2 size={14} color="#059669" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Weekly Pricing Breakdown Box */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 12,
                    marginBottom: 16
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10.5, fontWeight: 800, color: '#475569',
                      letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase'
                    }}>
                      <span>Weekly Cycle Breakdown</span>
                      <span style={{ color: '#2563EB', background: '#EFF6FF', padding: '1px 6px', borderRadius: 4 }}>
                        Renewal: ₹299
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: 4 }}>
                      <span>Standard Weekly Fee</span>
                      <span style={{ textDecoration: 'line-through' }}>₹749</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600, marginBottom: weeklyDiscount > 0 ? 4 : 0 }}>
                      <span>Weekly Renewal Price</span>
                      <span>₹299</span>
                    </div>
                    {weeklyDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                        <span>Coupon ({weeklyCoupon})</span>
                        <span>- ₹{weeklyDiscount}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      borderTop: '1px dashed #CBD5E1', paddingTop: 8, marginTop: 6,
                      fontWeight: 800, color: '#0F172A', fontSize: 13
                    }}>
                      <span>NET PAYABLE (7 DAYS)</span>
                      <span style={{ color: '#2563EB', fontSize: 17 }}>₹{weeklyFinalPayable}</span>
                    </div>
                  </div>

                  {/* Coupon Input Section */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Have a Referral / Reference Code or Coupon?
                    </div>
                    <form onSubmit={handleApplyWeeklyCoupon} style={{ display: 'flex', gap: 6 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Tag size={13} color="#94A3B8" style={{ position: 'absolute', left: 9, top: 10 }} />
                        <input
                          type="text"
                          placeholder="e.g. LVX400 or REF-..."
                          value={weeklyCoupon}
                          onChange={(e) => setWeeklyCoupon(e.target.value.toUpperCase())}
                          style={{
                            width: '100%',
                            padding: '7px 8px 7px 28px',
                            borderRadius: 7,
                            border: '1px solid #CBD5E1',
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={weeklyLoading || !weeklyCoupon.trim()}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 7,
                          background: weeklyDiscount > 0 ? '#10B981' : '#2563EB',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: weeklyLoading || !weeklyCoupon.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {weeklyLoading ? <Loader2 size={12} className="animate-spin" /> : weeklyDiscount > 0 ? <Check size={13} /> : null}
                        {weeklyDiscount > 0 ? 'Applied' : 'Apply'}
                      </button>
                    </form>

                    {weeklyMsg && (
                      <div style={{
                        fontSize: 11.5, color: '#065F46', background: '#ECFDF5',
                        border: '1px solid #A7F3D0', borderRadius: 6,
                        padding: '4px 8px', marginTop: 5, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <CheckCircle2 size={12} color="#059669" />
                        {weeklyMsg}
                      </div>
                    )}
                    {weeklyErr && (
                      <div style={{
                        fontSize: 11.5, color: '#991B1B', background: '#FEF2F2',
                        border: '1px solid #FECDD3', borderRadius: 6,
                        padding: '4px 8px', marginTop: 5, fontWeight: 600
                      }}>
                        ✕ {weeklyErr}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 10.5, color: '#64748B', marginBottom: 8
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={11} color="#D97706" /> Instant UPI: PhonePe • GPay • Cards
                    </span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ Zero Fee</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRenewalPayment('weekly')}
                    disabled={loadingPlan === 'weekly'}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      padding: '12px 18px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 800,
                      border: 'none',
                      cursor: loadingPlan === 'weekly' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      boxShadow: '0 6px 18px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    {loadingPlan === 'weekly' ? (
                      <><Loader2 size={15} className="animate-spin" /> Processing...</>
                    ) : (
                      <>Pay ₹{weeklyFinalPayable} to Renew Weekly Sprint →</>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSimulatedRenewal('weekly')}
                      disabled={loadingPlan === 'weekly'}
                      style={{
                        background: 'none', border: 'none', color: '#64748B',
                        fontSize: 11, cursor: 'pointer', textDecoration: 'underline'
                      }}
                    >
                      ⚡ Instant Test Checkout (Simulated)
                    </button>
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────── */}
              {/* CARD 2: 1-YEAR MACHINE LEARNING INTERNSHIP (₹11,499)        */}
              {/* ─────────────────────────────────────────────────────────── */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 18,
                border: '2px solid #7C3AED',
                boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.15)',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}>
                {/* Floating Top Value Badge */}
                <div style={{
                  position: 'absolute', top: -11, right: 18,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                  padding: '3px 11px', borderRadius: 999, letterSpacing: 0.5,
                  boxShadow: '0 3px 10px rgba(124, 58, 237, 0.35)'
                }}>
                  ★ BEST VALUE: SAVE UP TO ₹24,500
                </div>

                <div>
                  {/* Card Title & Tag */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: '#7C3AED',
                        letterSpacing: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <Sparkles size={11} /> FLAGSHIP 1-YEAR PROGRAM
                      </span>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '3px 0 0' }}>
                        Machine Learning Engineer Internship
                      </h3>
                      <span style={{ fontSize: 11.5, color: '#64748B', display: 'block', marginTop: 2 }}>
                        3 Months Training + 9 Months Industrial Training
                      </span>
                    </div>
                    <span style={{
                      width: 18, height: 18, borderRadius: '50%',
                      border: '5px solid #7C3AED', background: '#FFFFFF', flexShrink: 0
                    }} />
                  </div>

                  {/* Verified Certificate Callout */}
                  <div style={{
                    margin: '10px 0 12px',
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 7,
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    color: '#92400E',
                    fontWeight: 700
                  }}>
                    <Sparkles size={13} color="#D97706" style={{ flexShrink: 0 }} />
                    <span>One year of verified internship certificate with industrial experience</span>
                  </div>

                  {/* Pricing Header */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 14px' }}>
                    <span style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'line-through' }}>₹35,999</span>
                    <span style={{ fontSize: 30, fontWeight: 900, color: '#0F172A' }}>
                      ₹{annualFinalPayable}
                    </span>
                    <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>/ 1 full year</span>
                    <span style={{
                      fontSize: 10, fontWeight: 800, color: '#7C3AED',
                      background: '#FAF5FF', border: '1px solid #DDD6FE',
                      padding: '2px 7px', borderRadius: 4, marginLeft: 'auto'
                    }}>
                      APPLY DISCOUNTS
                    </span>
                  </div>

                  {/* Feature Checklist (2-Column Compact Grid) */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '6px 10px',
                    marginBottom: 16
                  }}>
                    {[
                      'Python & Advance Python',
                      'Machine Learning & SQL',
                      'All Recorded Sessions HD',
                      '9+ Industry Level Projects',
                      '4+ Portfolio Projects',
                      'Community & Peer Network',
                      'Verified Industry Certificate',
                      'Resume Builder & Optimizer'
                    ].map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#334155' }}>
                        <CheckCircle2 size={13} color="#059669" style={{ flexShrink: 0 }} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* Annual Pricing Breakdown Box */}
                  <div style={{
                    background: '#FAF5FF',
                    border: '1px solid #E9D5FF',
                    borderRadius: 12,
                    padding: '12px 14px',
                    fontSize: 12,
                    marginBottom: 16
                  }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      fontSize: 10.5, fontWeight: 800, color: '#6B21A8',
                      letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase'
                    }}>
                      <span>Internship Pricing Breakdown</span>
                      <span style={{ color: '#7C3AED', background: '#FFFFFF', padding: '1px 6px', borderRadius: 4, border: '1px solid #DDD6FE' }}>
                        1 Full Year Program
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', marginBottom: 4 }}>
                      <span>Standard Annual Package</span>
                      <span style={{ textDecoration: 'line-through' }}>₹35,999</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600, marginBottom: 4 }}>
                      <span>Academy Scholarship Discount</span>
                      <span>- ₹24,500</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600, marginBottom: annualDiscount > 0 ? 4 : 0 }}>
                      <span>Annual Package Net Offer</span>
                      <span>₹11,499</span>
                    </div>
                    {annualDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700, marginBottom: 4 }}>
                        <span>Coupon ({annualCoupon})</span>
                        <span>- ₹{annualDiscount}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      borderTop: '1px dashed #DDD6FE', paddingTop: 8, marginTop: 6,
                      fontWeight: 800, color: '#0F172A', fontSize: 13
                    }}>
                      <span>NET PAYABLE (1 FULL YEAR)</span>
                      <span style={{ color: '#7C3AED', fontSize: 17 }}>₹{annualFinalPayable}</span>
                    </div>
                  </div>

                  {/* Coupon Input Section */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                      Have a Referral / Reference Code or Coupon?
                    </div>
                    <form onSubmit={handleApplyAnnualCoupon} style={{ display: 'flex', gap: 6 }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <Tag size={13} color="#94A3B8" style={{ position: 'absolute', left: 9, top: 10 }} />
                        <input
                          type="text"
                          placeholder="e.g. LVX400 or REF-..."
                          value={annualCoupon}
                          onChange={(e) => setAnnualCoupon(e.target.value.toUpperCase())}
                          style={{
                            width: '100%',
                            padding: '7px 8px 7px 28px',
                            borderRadius: 7,
                            border: '1px solid #CBD5E1',
                            fontSize: 12,
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={annualLoading || !annualCoupon.trim()}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 7,
                          background: annualDiscount > 0 ? '#10B981' : '#7C3AED',
                          border: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: annualLoading || !annualCoupon.trim() ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        {annualLoading ? <Loader2 size={12} className="animate-spin" /> : annualDiscount > 0 ? <Check size={13} /> : null}
                        {annualDiscount > 0 ? 'Applied' : 'Apply'}
                      </button>
                    </form>

                    {annualMsg && (
                      <div style={{
                        fontSize: 11.5, color: '#065F46', background: '#ECFDF5',
                        border: '1px solid #A7F3D0', borderRadius: 6,
                        padding: '4px 8px', marginTop: 5, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4
                      }}>
                        <CheckCircle2 size={12} color="#059669" />
                        {annualMsg}
                      </div>
                    )}
                    {annualErr && (
                      <div style={{
                        fontSize: 11.5, color: '#991B1B', background: '#FEF2F2',
                        border: '1px solid #FECDD3', borderRadius: 6,
                        padding: '4px 8px', marginTop: 5, fontWeight: 600
                      }}>
                        ✕ {annualErr}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 10.5, color: '#64748B', marginBottom: 8
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={11} color="#D97706" /> Instant UPI: PhonePe • GPay • Cards
                    </span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>✓ Zero Fee</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRenewalPayment('annual')}
                    disabled={loadingPlan === 'annual'}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#FFFFFF',
                      padding: '12px 18px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 800,
                      border: 'none',
                      cursor: loadingPlan === 'annual' ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      boxShadow: '0 6px 18px rgba(124, 58, 237, 0.35)'
                    }}
                  >
                    {loadingPlan === 'annual' ? (
                      <><Loader2 size={15} className="animate-spin" /> Processing...</>
                    ) : (
                      <>Pay ₹{annualFinalPayable} for 1-Year ML Internship →</>
                    )}
                  </button>

                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleSimulatedRenewal('annual')}
                      disabled={loadingPlan === 'annual'}
                      style={{
                        background: 'none', border: 'none', color: '#64748B',
                        fontSize: 11, cursor: 'pointer', textDecoration: 'underline'
                      }}
                    >
                      ⚡ Instant Test Checkout (Simulated)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
