import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, CheckCircle2, AlertTriangle, Sparkles, Shield,
  CreditCard, Calendar, Clock, ArrowRight, X, Loader2, Tag, Mail, ExternalLink, Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MembershipRenewalModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const navigate = useNavigate();
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const student = userProfile || currentUser || {};

  const [selectedPlan, setSelectedPlan] = useState('weekly');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Internship Exam State
  const [examStatus, setExamStatus] = useState(null);
  const [examConfig, setExamConfig] = useState(null);
  const [examLinkSending, setExamLinkSending] = useState(false);
  const [examLinkSentMsg, setExamLinkSentMsg] = useState('');

  // Fetch live exam configuration (dynamic duration, pass score, question count, course name)
  useEffect(() => {
    fetch('/api/internship-exam/config')
      .then(r => r.json())
      .then(d => { if (d.success) setExamConfig(d); })
      .catch(() => {});
  }, [isOpen]);

  // Format exam duration (e.g. 120s -> "2-minute", 180s -> "3-minute")
  const formatExamDurationDisplay = (secs) => {
    const s = Number(secs) || 120;
    const mins = Math.floor(s / 60);
    const rem = s % 60;
    if (mins > 0 && rem === 0) return `${mins}-minute`;
    if (mins > 0) return `${mins}m ${rem}s`;
    return `${s}-second`;
  };

  // Fetch student exam qualification status
  useEffect(() => {
    if (student?.email) {
      fetch(`/api/internship-exam/status/${encodeURIComponent(student.email)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) setExamStatus(d);
        })
        .catch(() => {});
    }
  }, [student?.email, isOpen]);

  const hasPassedExam = Boolean(student?.hasPassedInternshipExam || examStatus?.hasPassed);

  // Action: Attend Exam Immediately directly on portal (no email link required)
  const handleGoToExam = () => {
    if (!student?.email) {
      window.location.href = '/internship-exam';
      return;
    }
    window.location.href = `/internship-exam?email=${encodeURIComponent(student.email)}`;
  };

  if (!isOpen) return null;

  const previousPlanName = student.membership?.planName || student.course || 'Weekly Learning Cycle';
  const rawExpiry = student.accessExpiresAt || student.portalExpiresAt || student.membership?.expiresAt;
  const expiredDateFormatted = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '23 Nov 2026';

  // Plans config
  const plans = {
    weekly: {
      id: 'weekly',
      name: 'Weekly Sprint Renewal',
      validity: '7 Days Access',
      originalPrice: 749,
      offerPrice: 299,
      finalPayable: Math.max(0, 299 - (couponDiscount || 0)),
      features: [
        'Continue learning for the internship exam',
        '7 Days Unlocked Portal Access',
        'Python, Machine Learning & SQL Modules',
        'Recorded Lesson Streaming in HD',
        '5+ Industry-Level & Portfolio Projects'
      ]
    },
    annual: {
      id: 'annual',
      name: `${examConfig?.courseName || 'Machine Learning Engineer Internship'} (365 Days • 1 Full Year)`,
      validity: '365 Days (1 Full Year)',
      originalPrice: 35999,
      offerPrice: 11499,
      finalPayable: Math.max(0, 11499 - (couponDiscount || 0)),
      badge: 'SAVE OVER ₹24,500 • 1 FULL YEAR',
      features: [
        `Attend exam to enroll ${examConfig?.courseName || 'Machine Learning Internship'} with certification`,
        '365 Days uninterrupted access',
        'All 9+ industry level projects',
        '4+ portfolio projects & verified certificate',
        'Live Doubt Support & MLOps Project Vault'
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

    try {
      const res = await fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=${selectedPlan}&email=${encodeURIComponent(student.email || '')}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponDiscount(data.discount);
        setCouponMessage(`✓ Coupon "${cleanCode}" applied! ₹${data.discount} discount deducted.`);
      } else {
        setCouponDiscount(0);
        setCouponError(data.error || 'Invalid or expired coupon code.');
      }
    } catch {
      setCouponDiscount(0);
      setCouponError('Could not verify coupon.');
    }
  };

  // Dynamically re-verify coupon when toggling between weekly and annual
  useEffect(() => {
    if (couponCode.trim() && couponDiscount > 0) {
      const cleanCode = couponCode.trim().toUpperCase();
      fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(cleanCode)}&planId=${selectedPlan}&email=${encodeURIComponent(student.email || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.valid) {
            setCouponDiscount(data.discount);
            setCouponMessage(`✓ Coupon "${cleanCode}" applied! ₹${data.discount} discount deducted.`);
          }
        })
        .catch(() => {});
    }
  }, [selectedPlan]);

  // Payment checkout handler for Weekly Sprint (Continue Learning) or Qualified 1-Year Pass via Real Razorpay Gateway
  const handleRenewalPayment = async () => {
    setLoading(true);
    try {
      const email = student.email;
      const name = student.name || student.displayName || (student.email ? student.email.split('@')[0] : 'Student');
      const phone = (student.phone || '9876543210').replace(/\D/g, '').slice(-10) || '9876543210';

      const effectivePlanId = selectedPlan === 'monthly' ? 'weekly' : selectedPlan;
      const creditsToApply = selectedPlan === 'annual' ? 20000 : 0;
      const effectiveCoupon = selectedPlan === 'annual' ? (couponCode.trim() || 'ENROLL4500') : (couponDiscount > 0 ? couponCode : undefined);

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
          applyCredits: creditsToApply,
          isRenewal: true
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
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
        throw new Error('Razorpay payment gateway script could not be loaded. Please check your internet connection.');
      }

      // 3. Open Razorpay live payment gateway modal (UPI, Cards, NetBanking, Wallets)
      const options = {
        key: orderData.key || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Levlox Academy',
        description: selectedPlan === 'annual'
          ? 'Machine Learning Engineer Internship (365 Days • 1 Full Year)'
          : 'Weekly Sprint Renewal (7 Days Validity)',
        order_id: orderData.orderId,
        prefill: {
          name,
          email,
          contact: phone
        },
        theme: { color: '#2563EB' },
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
              applyCredits: creditsToApply,
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
      const effectivePlanId = selectedPlan === 'monthly' ? 'weekly' : selectedPlan;
      const creditsToDeduct = selectedPlan === 'annual' ? 20000 : 0;
      const effectiveCoupon = selectedPlan === 'annual' ? (couponCode.trim() || 'ENROLL4500') : (couponDiscount > 0 ? couponCode : undefined);

      await finalizeVerification({
        razorpay_order_id: `sim_ord_${Date.now()}`,
        razorpay_payment_id: `sim_pay_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
        planId: effectivePlanId,
        email,
        name,
        phone,
        couponCode: effectiveCoupon,
        applyCredits: creditsToDeduct,
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
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        maxWidth: 600,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
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
            top: 16,
            right: 16,
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
            zIndex: 10
          }}
          title="Close dialog"
        >
          <X size={16} />
        </button>

        {paymentSuccess ? (
          /* SUCCESS STATE */
          <div style={{ padding: '42px 32px', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#ECFDF5', color: '#10B981',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px', border: '2px solid #A7F3D0'
            }}>
              <CheckCircle2 size={36} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Membership Successfully Renewed! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 20px', lineHeight: 1.5 }}>
              Your <strong>{paymentSuccess.planName}</strong> is now active. All recorded courses, videos, and modules are immediately unlocked.
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
                padding: '13px 20px',
                borderRadius: 12,
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Start Learning Now →
            </button>
          </div>
        ) : (
          /* RENEWAL OFFER SELECTION (CLEAN PORTAL LIGHT THEME) */
          <div>
            {/* Header Banner */}
            <div style={{
              background: '#FFFFFF',
              borderBottom: '1px solid #F1F5F9',
              padding: '24px 26px 16px',
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

              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px', color: '#0F172A', letterSpacing: '-0.3px' }}>
                Renew Your Academy Membership
              </h2>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                Your learning validity period has expired. Select a renewal package below to unlock access.
              </p>
            </div>

            {/* Expired Status Card */}
            <div style={{
              margin: '14px 24px 10px',
              padding: '11px 16px',
              background: '#FFF5F5',
              border: '1px solid #FED7D7',
              borderRadius: 12,
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
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 700
              }}>
                Expired On {expiredDateFormatted}
              </div>
            </div>

            {/* Plan Selector Grid */}
            <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Option 1: Weekly Sprint Renewal (Continue Learning - Payment Option) */}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
                      Weekly Sprint Renewal (7 Days Validity)
                    </strong>
                    <span style={{ fontSize: 12, color: '#2563EB', fontWeight: 600 }}>
                      Continue learning for the internship exam • ₹299 / week
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#2563EB' }}>
                      ₹{plans.weekly.finalPayable}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ 7 days</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#10B981" /> Full Python, ML, SQL course modules &amp; capstone projects
                </div>
              </div>

              {/* Option 2: Machine Learning Engineer Internship (Attend Exam Option) */}
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
                <div style={{
                  position: 'absolute', top: -10, right: 14,
                  background: hasPassedExam ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                  color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                  padding: '2px 9px', borderRadius: 999, letterSpacing: 0.5
                }}>
                  {hasPassedExam ? 'QUALIFIED ✓ SAVE ₹26,000' : 'SAVE OVER ₹26,000 • 1 FULL YEAR'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
                      {examConfig?.courseName || 'Machine Learning Engineer Internship'} (365 Days • 1 Full Year)
                    </strong>
                    <span style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600 }}>
                      Verified internship certification &amp; placement interview kit
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 19, fontWeight: 800, color: '#7C3AED' }}>
                      ₹{plans.annual.finalPayable}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ 365 days</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginBottom: selectedPlan === 'annual' ? 8 : 0 }}>
                  <CheckCircle2 size={13} color="#10B981" /> 365 Days access to all 9+ industry projects, 4 portfolios &amp; certificate
                </div>

                {/* Exam Requirement Callout when Annual Plan is selected */}
                {selectedPlan === 'annual' && (
                  <div style={{
                    marginTop: 10,
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: '#F5F3FF',
                    border: '1.5px solid #DDD6FE'
                  }}>
                    <div style={{ fontSize: 13, color: '#5B21B6', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Sparkles size={16} color="#7C3AED" />
                      Attend Exam to Enroll in 1-Year {examConfig?.courseName || 'ML Internship'}
                    </div>
                    <p style={{ margin: '0 0 12px', fontSize: 12, color: '#6D28D9', lineHeight: 1.5 }}>
                      To enroll in the 1-Year {examConfig?.courseName || 'Machine Learning Engineer Internship'} with verified certification, candidates must score <strong>{examConfig?.passPercentage || 80}% or higher</strong> on the {formatExamDurationDisplay(examConfig?.durationSeconds || 120)} technical exam ({examConfig?.totalQuestions || examConfig?.questions?.length || 15} MCQs).
                    </p>

                    {hasPassedExam && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#ECFDF5',
                        border: '1px solid #A7F3D0',
                        borderRadius: 8,
                        padding: '8px 12px',
                        marginBottom: 12,
                        fontSize: 12,
                        color: '#065F46'
                      }}>
                        <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={15} color="#059669" /> Qualified on previous exam ({student.internshipExamScore || examStatus?.latestAttempt?.scorePercent || '100'}%)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenewalPayment();
                          }}
                          style={{
                            background: '#059669',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Activate Pass (₹11,499) →
                        </button>
                      </div>
                    )}

                    {examStatus?.cooldownActive ? (
                      <div>
                        <div style={{
                          background: '#FFFBEB',
                          border: '1.5px solid #FDE68A',
                          borderRadius: 10,
                          padding: '10px 14px',
                          fontSize: 12,
                          color: '#92400E',
                          lineHeight: 1.45,
                          marginBottom: 10
                        }}>
                          <div style={{ fontWeight: 800, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Clock size={14} color="#D97706" /> 7-Day Academic Preparation Interval Active
                          </div>
                          <div>
                            Next qualifying attempt unlocks on <strong>{examStatus.nextAttemptDate ? new Date(examStatus.nextAttemptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '7 days'}</strong>. Renew your Weekly Sprint to continue studying course lectures and prepare for your next attempt.
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlan('weekly');
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '9px 18px',
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                          }}
                        >
                          <Sparkles size={14} /> Renew Weekly Sprint (₹299) to Prepare →
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToExam();
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '10px 22px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 850,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 7,
                            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)'
                          }}
                        >
                          <Sparkles size={15} /> Attend Internship Exam Now 🏆 →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Coupon Code Section */}
            <div style={{ padding: '14px 24px 0' }}>
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
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </form>
              {couponMessage && (
                <div style={{ fontSize: 11.5, color: '#059669', fontWeight: 600, marginTop: 4 }}>
                  ✓ {couponMessage}
                </div>
              )}
              {couponError && (
                <div style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600, marginTop: 4 }}>
                  ✕ {couponError}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{
              padding: '16px 24px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap'
            }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>
                  {selectedPlan === 'annual' ? 'Program Requirement:' : 'Total Payable:'}
                </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  {selectedPlan === 'annual' ? (
                    <span style={{ fontSize: 15, color: '#7C3AED', fontWeight: 800 }}>Attend Exam Required</span>
                  ) : (
                    `₹${activePlan.finalPayable}`
                  )}
                </span>
              </div>

              {/* When Yearly Plan is selected -> ALWAYS Provide Attend Exam Option */}
              {selectedPlan === 'annual' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleGoToExam}
                    disabled={examLinkSending}
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                      color: '#FFFFFF',
                      padding: '12px 24px',
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 800,
                      border: 'none',
                      cursor: examLinkSending ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 20px rgba(124, 58, 237, 0.35)'
                    }}
                  >
                    {examLinkSending ? (
                      <><Loader2 size={16} className="animate-spin" /> Opening Exam...</>
                    ) : (
                      <><Sparkles size={16} /> Attend Exam Now →</>
                    )}
                  </button>

                  {hasPassedExam && (
                    <button
                      type="button"
                      onClick={handleRenewalPayment}
                      disabled={loading}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        color: '#FFFFFF',
                        padding: '12px 20px',
                        borderRadius: 12,
                        fontSize: 13.5,
                        fontWeight: 800,
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        boxShadow: '0 8px 20px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      {loading ? (
                        <><Loader2 size={15} className="animate-spin" /> Processing...</>
                      ) : (
                        <><CheckCircle2 size={15} /> Pay ₹{activePlan.finalPayable} (Qualified) →</>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                /* When Weekly Plan is selected -> Continue Learning Payment Option */
                <button
                  type="button"
                  onClick={handleRenewalPayment}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    padding: '12px 24px',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Processing Payment...
                    </>
                  ) : (
                    <>
                      Continue Learning • Pay ₹{activePlan.finalPayable} →
                    </>
                  )}
                </button>
              )}
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
