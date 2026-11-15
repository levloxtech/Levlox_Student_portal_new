import React, { useState } from 'react';
import {
  Lock, CheckCircle2, AlertTriangle, Sparkles, Shield,
  CreditCard, Calendar, Clock, ArrowRight, X, Loader2, Tag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MembershipRenewalModal({
  isOpen,
  onClose,
  onSuccess
}) {
  const { userProfile, currentUser, refreshProfile } = useAuth();
  const student = userProfile || currentUser || {};

  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [couponError, setCouponError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  if (!isOpen) return null;

  const previousPlanName = student.membership?.planName || student.course || 'Academy Monthly Membership';
  const rawExpiry = student.accessExpiresAt || student.portalExpiresAt || student.membership?.expiresAt;
  const expiredDateFormatted = rawExpiry
    ? new Date(rawExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Recently Expired';

  // Plans config
  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Monthly Academy Access',
      validity: '30 Days Access',
      originalPrice: 2999,
      offerPrice: 999,
      storeCreditDeduction: 300,
      couponEligible: 400,
      finalPayable: Math.max(0, 999 - 300 - (couponDiscount || 0)),
      features: [
        '30 Days Unlocked Portal Access',
        'Python, Machine Learning & SQL Modules',
        '5 Industry-Grade Capstone Projects',
        'Recorded Lesson Streaming in HD'
      ]
    },
    annual: {
      id: 'annual',
      name: 'Annual Academy Pass (12 Months)',
      validity: '365 Days (1 Full Year)',
      originalPrice: 17999,
      offerPrice: 17999,
      storeCreditDeduction: 6600, // 3600 credit + 3000 offer
      couponEligible: 1400,
      finalPayable: Math.max(0, 17999 - 6600 - (couponDiscount || 0)),
      badge: 'RECOMMENDED &bull; 6 MONTHS FREE',
      features: [
        '365 Days Uninterrupted All-Access',
        'All Core & Advanced Recorded Modules',
        '24 IT Interview Resources & Questions',
        'Live Doubt Clarifications & Career Mentorship',
        'Verified Industry Completion Certificate'
      ]
    }
  };

  const activePlan = plans[selectedPlan];

  // Apply Coupon Handler
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponError('');
    setCouponMessage('');

    try {
      const res = await fetch(`/api/membership/verify-coupon?code=${encodeURIComponent(couponCode.trim())}&planId=${selectedPlan}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponDiscount(data.discount || (selectedPlan === 'annual' ? 1400 : 400));
        setCouponMessage(`Coupon applied: ₹${data.discount || (selectedPlan === 'annual' ? 1400 : 400)} discount added!`);
      } else {
        setCouponDiscount(0);
        setCouponError(data.error || 'Invalid or expired coupon code.');
      }
    } catch (err) {
      setCouponDiscount(0);
      setCouponError('Could not verify coupon.');
    }
  };

  // Payment checkout handler
  const handleRenewalPayment = async () => {
    setLoading(true);
    try {
      const email = student.email;
      const name = student.name || student.email?.split('@')[0];
      const phone = student.phone || '';

      const creditsToDeduct = selectedPlan === 'annual' ? 6600 : 300;

      // 1. Create Order
      const orderRes = await fetch('/api/membership/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          email,
          name,
          phone,
          couponCode: couponDiscount > 0 ? couponCode : undefined,
          applyCredits: creditsToDeduct,
          isRenewal: true
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create renewal order');

      // 2. Open Razorpay Checkout or Zero-Order Verification
      if (orderData.isZeroPayment) {
        await finalizeVerification({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `free_pay_${Date.now()}`,
          razorpay_signature: 'free_signature',
          planId: selectedPlan,
          email,
          name,
          phone,
          couponCode: couponDiscount > 0 ? couponCode : undefined,
          applyCredits: creditsToDeduct
        });
        return;
      }

      if (typeof window.Razorpay === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      const options = {
        key: orderData.keyId || 'rzp_test_U05ceIQKOouNJu',
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Levlox Academy',
        description: `${activePlan.name} Renewal`,
        order_id: orderData.orderId,
        prefill: {
          name,
          email,
          contact: phone
        },
        theme: { color: '#4568F5' },
        handler: async function (response) {
          await finalizeVerification({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            planId: selectedPlan,
            email,
            name,
            phone,
            couponCode: couponDiscount > 0 ? couponCode : undefined,
            applyCredits: creditsToDeduct
          });
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Renewal failed: ' + err.message);
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
      background: 'rgba(10, 16, 30, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 16px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 22,
        maxWidth: 640,
        width: '100%',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.25)',
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
          <X size={18} />
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
          /* RENEWAL OFFER SELECTION */
          <div>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
              padding: '28px 28px 22px',
              color: '#FFFFFF'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 20,
                padding: '4px 12px',
                color: '#FCA5A5',
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 0.5,
                marginBottom: 10
              }}>
                <Lock size={12} /> SUBSCRIPTION CYCLE LAPSED
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
                Renew Your Academy Membership
              </h2>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                Your learning validity period has expired. Course recorded lessons, code sandboxes, and cohort materials are currently locked. Select a renewal package to unlock access.
              </p>
            </div>

            {/* Expired Status Card */}
            <div style={{
              margin: '18px 24px 14px',
              padding: '12px 16px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
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
                background: '#EF4444',
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
              {/* Monthly Plan */}
              <div
                onClick={() => setSelectedPlan('monthly')}
                style={{
                  border: selectedPlan === 'monthly' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                  background: selectedPlan === 'monthly' ? '#F0F7FF' : '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
                      Monthly Renewal (30 Days Validity)
                    </strong>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      Regular ₹2,999 &bull; Offer ₹999 &minus; ₹300 Store Credit
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>
                      ₹{plans.monthly.finalPayable}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ month</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#10B981" /> Full access to Python, ML, SQL &amp; capstone projects
                </div>
              </div>

              {/* Annual Plan */}
              <div
                onClick={() => setSelectedPlan('annual')}
                style={{
                  border: selectedPlan === 'annual' ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                  background: selectedPlan === 'annual' ? '#F0F7FF' : '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                <div style={{
                  position: 'absolute', top: -10, right: 14,
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF', fontSize: 10, fontWeight: 800,
                  padding: '2px 8px', borderRadius: 999, letterSpacing: 0.5
                }}>
                  BEST VALUE &bull; SAVE ₹8,000
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <strong style={{ fontSize: 14, color: '#0F172A', display: 'block' }}>
                      Annual Renewal (365 Days &bull; 1 Year Pass)
                    </strong>
                    <span style={{ fontSize: 12, color: '#64748B' }}>
                      Buy 6 Months Get 6 Months Free + 3,600 Store Credits
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#059669' }}>
                      ₹{plans.annual.finalPayable}
                    </div>
                    <span style={{ fontSize: 11, color: '#64748B' }}>/ year</span>
                  </div>
                </div>

                <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle2 size={13} color="#10B981" /> 12 Months full access, 24 interview kits, live support &amp; certificate
                </div>
              </div>
            </div>

            {/* Coupon Code Section */}
            <div style={{ padding: '14px 24px 0' }}>
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Tag size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: 11 }} />
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g. LVX400)"
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
              padding: '18px 24px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14
            }}>
              <div>
                <span style={{ fontSize: 11, color: '#64748B', display: 'block' }}>Total Payable:</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
                  ₹{activePlan.finalPayable}
                </span>
              </div>

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
                    <Loader2 size={16} className="animate-spin" /> Processing Renewal...
                  </>
                ) : (
                  <>
                    Renew Membership &bull; Pay ₹{activePlan.finalPayable} →
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

