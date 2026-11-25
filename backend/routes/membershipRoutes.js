const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const localDb = require('../localDb');

// Razorpay SDK initialization (with graceful fallback for local testing if keys not provided)
let RazorpayInstance = null;
let cachedKeyId = null;
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id.includes('placeholder')) return null;
  if (RazorpayInstance && cachedKeyId === key_id) return RazorpayInstance;
  try {
    const Razorpay = require('razorpay');
    RazorpayInstance = new Razorpay({ key_id, key_secret });
    cachedKeyId = key_id;
    return RazorpayInstance;
  } catch (e) {
    console.warn('[Membership] Razorpay initialization notice:', e.message);
  }
  return null;
}

// ── DEFAULT PLANS CONFIGURATION ──────────────────────────────────────────────
const PLANS = {
  weekly: {
    id: 'weekly',
    name: 'Weekly Learning Cycle',
    cycleLabel: 'Weekly Learning Cycle',
    listedPrice: 749, // 749 canceled, now ₹113
    promotionalPrice: 113, // Week 1 promotional access
    renewalPrice: 299,   // Week 2+ renewals
    durationDays: 7,
    features: [
      '7 Days Unlocked Portal Access',
      'Python & Advance Python Modules',
      'Machine Learning & SQL Foundations',
      'Recorded Video Streaming in HD',
      '5+ Industry-Level & Portfolio Projects',
      'Weekly Learning Sprints & Assessments'
    ]
  },
  monthly: { // Alias for backward compatibility
    id: 'weekly',
    name: 'Weekly Learning Cycle',
    cycleLabel: 'Weekly Learning Cycle',
    listedPrice: 749,
    promotionalPrice: 113,
    renewalPrice: 299,
    durationDays: 7,
    features: [
      '7 Days Unlocked Portal Access',
      'Python & Advance Python Modules',
      'Machine Learning & SQL Foundations',
      'Recorded Video Streaming in HD',
      '5+ Industry-Level & Portfolio Projects',
      'Weekly Learning Sprints & Assessments'
    ]
  },
  annual: {
    id: 'annual',
    name: 'Machine Learning Engineer Internship (3M Training + 9M Industrial Training)',
    programTitle: 'Machine Learning Engineer Internship with 3 Months Training and 9 Months Industrial Training',
    programNote: 'Finish it sooner to receive one year of internship certificate with industrial experience',
    listedPrice: 35999,
    promotionalPrice: 35999,
    offerHeadline: 'Machine Learning Engineer Internship Program',
    savingsLabel: 'Save ₹24,500 with Score Credits & Enrolly Coupon',
    bonusCreditNotice: 'Score credits ₹20,000 and Enrolly coupon ₹4,500 applicable.',
    durationDays: 365,
    features: [
      'Python & Advance Python Modules',
      'Machine Learning & SQL Foundations',
      'All Recorded Sessions HD Streaming',
      '9+ Industry Level Projects',
      '4+ Portfolio Projects',
      '3 Months Training + 9 Months Industrial Training',
      'One Year Internship Certificate with Experience',
      'Community & Peer Network',
      'Support System (Live Doubt Sessions)',
      'Resume Builder & LinkedIn Optimizer',
      '24 Free IT Interview Resources'
    ]
  }
};

// ── SEED INITIAL COUPONS IF NOT PRESENT ───────────────────────────────────────
function getCoupons() {
  let coupons = localDb.loadCollection('coupons');
  if (!coupons || coupons.length === 0) {
    coupons = [
      { id: 'coup_enroll4500', code: 'ENROLL4500', discount: 4500, minPlan: 'annual', description: '₹4,500 Early Enrolly Discount', expiryDate: '2028-12-31', isActive: true },
      { id: 'coup_enroll', code: 'ENROLL6000', discount: 4500, minPlan: 'annual', description: '₹4,500 Early Enrolly Discount', expiryDate: '2028-12-31', isActive: true },
      { id: 'coup_enrolly', code: 'ENROLLY', discount: 4500, minPlan: 'annual', description: '₹4,500 Enrolly Coupon', expiryDate: '2028-12-31', isActive: true },
      { id: 'coup_1', code: 'LEVLOX400', discount: 400, minPlan: 'weekly', description: '₹400 instant promotional discount', expiryDate: '2027-12-31', isActive: true },
      { id: 'coup_2', code: 'ACADEMY1400', discount: 1400, minPlan: 'annual', description: '₹1,400 special academy discount', expiryDate: '2027-12-31', isActive: true },
      { id: 'coup_3', code: 'TAMILIT1000', discount: 1000, minPlan: 'annual', description: '₹1,000 community credit discount', expiryDate: '2027-12-31', isActive: true },
      { id: 'coup_4', code: 'WELCOME100', discount: 100, minPlan: 'weekly', description: '₹100 welcome coupon', expiryDate: '2027-12-31', isActive: true }
    ];
    localDb.saveCollection('coupons', coupons);
  } else {
    let modified = false;
    // Ensure ENROLL4500 exists
    if (!coupons.find(c => c.code?.toUpperCase() === 'ENROLL4500')) {
      coupons.push({ id: 'coup_enroll4500', code: 'ENROLL4500', discount: 4500, minPlan: 'annual', description: '₹4,500 Early Enrolly Discount', expiryDate: '2028-12-31', isActive: true });
      modified = true;
    }
    // Update ENROLL6000 and ENROLLY to 4500 discount for 11499 net price
    coupons.forEach(c => {
      if (c.code?.toUpperCase() === 'ENROLL6000' || c.code?.toUpperCase() === 'ENROLLY') {
        if (c.discount !== 4500) {
          c.discount = 4500;
          c.description = '₹4,500 Early Enrolly Discount';
          modified = true;
        }
      }
    });
    if (modified) localDb.saveCollection('coupons', coupons);
  }
  return coupons;
}

// ── GET USER STORE CREDITS ───────────────────────────────────────────────────
function getUserCredits(email, planId = 'annual') {
  const normEmail = (email || '').toLowerCase().trim();
  const defaultBalance = (planId === 'annual') ? 20000 : 300;
  if (!normEmail) return { balance: defaultBalance, transactions: [] };

  const storeCredits = localDb.loadCollection('store_credits');
  let userCredit = storeCredits.find(c => c.email?.toLowerCase() === normEmail);
  if (!userCredit) {
    // New lead qualifies for score credit (up to ₹20,000 on annual, or ₹300 on weekly)
    userCredit = {
      id: `sc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: normEmail,
      balance: defaultBalance,
      transactions: [
        {
          id: `tx_${Date.now()}_init`,
          type: 'grant',
          amount: defaultBalance,
          description: planId === 'annual' ? 'Eligible Annual Score Credits' : 'Welcome Academy Store Credit',
          date: new Date().toISOString()
        }
      ]
    };
    storeCredits.push(userCredit);
    localDb.saveCollection('store_credits', storeCredits);
  } else if (planId === 'annual' && (!userCredit.balance || userCredit.balance < 20000)) {
    // For annual registration grant/ensure eligible credit of ₹20,000
    userCredit.balance = 20000;
    localDb.saveCollection('store_credits', storeCredits);
    return { ...userCredit, balance: 20000 };
  }
  return userCredit;
}

// ── ROUTE 0: DYNAMIC EMAIL AVAILABILITY CHECK ──────────────────────────────
router.get('/check-email', (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) {
      return res.json({ available: true, registered: false });
    }

    const users = localDb.loadCollection('users');
    const students = localDb.loadCollection('students');

    const isUser = users.some(u => u.email?.toLowerCase() === email);
    const isStudent = students.some(s => s.email?.toLowerCase() === email);

    if (isUser || isStudent) {
      return res.json({
        available: true,
        registered: false,
        isExistingPortalUser: true,
        message: 'Welcome back! Existing account found. You can proceed to explore Academy courses.'
      });
    }

    return res.json({
      available: true,
      registered: false,
      message: 'Email is available.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify email: ' + err.message });
  }
});

// ── ROUTE 1: REGISTER LEAD (STEP 1 & 2) ──────────────────────────────────────
router.post('/register-lead', (req, res) => {
  const { name, email, phone, userType, password } = req.body || {};

  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Full Name, Email Address, and Phone Number are required.' });
  }

  const normEmail = email.toLowerCase().trim();

  const users = localDb.loadCollection('users');
  const students = localDb.loadCollection('students');
  let leads = localDb.loadCollection('leads');

  const isUser = users.some(u => u.email?.toLowerCase() === normEmail);
  const isStudent = students.some(s => s.email?.toLowerCase() === normEmail);

  let matchedLead = leads.find(l => l.email?.toLowerCase() === normEmail);
  if (matchedLead) {
    matchedLead.name = name.trim();
    matchedLead.phone = phone.trim();
    matchedLead.userType = userType || matchedLead.userType || 'student';
    if (password) matchedLead.password = String(password).trim();
    matchedLead.updatedAt = new Date().toISOString();
  } else {
    matchedLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normEmail,
      phone: phone.trim(),
      userType: userType || 'student',
      password: password ? String(password).trim() : null,
      status: (isUser || isStudent) ? 'existing_member' : 'registered_lead',
      portalAccessGranted: Boolean(isUser || isStudent),
      createdAt: new Date().toISOString()
    };
    leads.push(matchedLead);
  }
  localDb.saveCollection('leads', leads);

  // Ensure initial store credit ledger exists
  const credits = getUserCredits(normEmail);

  res.json({
    success: true,
    message: 'Lead registered successfully.',
    isExistingPortalUser: Boolean(isUser || isStudent),
    lead: {
      id: matchedLead.id,
      name: matchedLead.name,
      email: matchedLead.email,
      phone: matchedLead.phone,
      userType: matchedLead.userType
    },
    credits: {
      balance: credits.balance
    }
  });
});

// ── ROUTE 2: GET CREDITS & PLANS ─────────────────────────────────────────────
const handleConfigGet = (req, res) => {
  const email = req.params.email || req.query.email;
  const planId = req.query.planId || 'annual';
  const credits = email ? getUserCredits(email, planId) : { balance: planId === 'annual' ? 6600 : 300, transactions: [] };
  const coupons = getCoupons().map(c => ({
    id: c.id,
    code: c.code,
    discount: c.discount,
    minPlan: c.minPlan,
    description: c.description,
    expiryDate: c.expiryDate,
    isActive: c.isActive !== false
  }));

  res.json({
    plans: PLANS,
    coupons,
    userCredits: credits,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
  });
};

router.get('/config', handleConfigGet);
router.get('/config/:email', handleConfigGet);

// ── ADMIN COUPON MANAGEMENT ROUTES ──────────────────────────────────────────
// GET /api/membership/coupons
// Helper to calculate coupon discount whether flat ₹ or percentage %
function getCouponDiscountAmount(matchedCoupon, basePrice, planId = 'weekly') {
  if (!matchedCoupon) return 0;
  const isPercent = matchedCoupon.discountType === 'percentage' || matchedCoupon.isPercentage === true;
  const val = Number(matchedCoupon.discount) || 0;
  if (isPercent) {
    // If annual and basePrice is the 35999 list price, calculate percentage on the net offer base (₹11,499)
    const effectiveBase = (planId === 'annual' && basePrice > 11499) ? 11499 : basePrice;
    return Math.min(basePrice, Math.round((effectiveBase * val) / 100));
  }
  return Math.min(basePrice, val);
}

// Helper to generate a clean, unique referral code
function generateReferralCode(name, rollNumber) {
  const cleanName = (name || 'LEVLOX')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8);
  const suffix = rollNumber
    ? rollNumber.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase()
    : Math.floor(100 + Math.random() * 900);
  return `REF-${cleanName}-${suffix}`;
}

// Unified resolver for promotional coupons and student referral codes
function resolveCouponOrReferral(inputCode) {
  if (!inputCode) return null;
  const cleanCode = String(inputCode).trim().toUpperCase();
  const coupons = getCoupons();
  let matched = coupons.find(c => c.code?.toUpperCase() === cleanCode);
  if (!matched && cleanCode.startsWith('REF-')) {
    const referralProfiles = localDb.loadCollection('referral_profiles') || [];
    const prof = referralProfiles.find(p => p.referralCode?.toUpperCase() === cleanCode);
    if (prof) {
      matched = {
        id: `ref_${prof.id}`,
        code: cleanCode,
        discount: 15,
        discountType: 'percentage',
        minPlan: 'all',
        description: `15% Referral Discount by ${prof.name || 'Student'}`,
        isActive: true,
        promoterName: prof.name || '',
        promoterPhone: prof.phone || '',
        promoterEmail: prof.email || '',
        promoterUpiId: prof.upiId || ''
      };
    }
  }
  return matched;
}

// ── GET & POST /api/membership/verify-coupon ─────────────────────────────────
const handleVerifyCoupon = (req, res) => {
  const code = (req.query.code || req.body?.code || '').trim().toUpperCase();
  const planId = req.query.planId || req.body?.planId || 'weekly';
  const email = (req.query.email || req.body?.email || req.user?.email || '').toLowerCase().trim();

  if (!code) {
    return res.status(400).json({ valid: false, error: 'Please enter a coupon code.' });
  }

  const matched = resolveCouponOrReferral(code);
  if (!matched) {
    return res.status(400).json({ valid: false, error: 'Invalid or expired coupon code.' });
  }

  if (matched.isActive === false) {
    return res.status(400).json({ valid: false, error: `Coupon '${code}' is currently inactive.` });
  }

  if (matched.expiryDate) {
    const exp = new Date(matched.expiryDate);
    exp.setHours(23, 59, 59, 999);
    if (new Date() > exp) {
      return res.status(400).json({
        valid: false,
        error: `Coupon '${matched.code}' expired on ${new Date(matched.expiryDate).toLocaleDateString('en-IN')}.`,
        isExpired: true
      });
    }
  }

  // Weekly coupons and student referral codes can be used for weekly AND yearly renewals
  const isPlanMatch = !matched.minPlan || matched.minPlan === 'all' || matched.minPlan === planId ||
    (matched.minPlan === 'weekly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
    (matched.minPlan === 'monthly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
    planId === 'annual';

  if (!isPlanMatch) {
    return res.status(400).json({ valid: false, error: `Coupon '${code}' is not applicable on this plan.` });
  }

  const basePrice = (planId === 'annual') ? 11499 : 299;
  const discountAmount = getCouponDiscountAmount(matched, basePrice, planId);

  return res.json({
    valid: true,
    code: matched.code,
    discount: discountAmount,
    discountType: matched.discountType || 'flat',
    discountValue: matched.discount,
    description: matched.description || `${matched.code} coupon applied`,
    basePrice,
    finalPrice: Math.max(0, basePrice - discountAmount)
  });
};

router.get('/verify-coupon', handleVerifyCoupon);
router.post('/verify-coupon', handleVerifyCoupon);

// ── GET /api/membership/coupons
router.get('/coupons', (req, res) => {
  try {
    const coupons = getCoupons();
    res.json({ success: true, coupons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load coupons: ' + err.message });
  }
});

// POST /api/membership/coupons (Create or Update Coupon with Flat ₹ or % Percentage & Promoter Details)
router.post('/coupons', (req, res) => {
  try {
    const {
      code, discount, discountType, minPlan, expiryDate, description, isActive,
      promoterName, promoterPhone, promoterEmail, promoterWhatsapp, promoterUpiId,
      name, phone, email, whatsapp, upiId
    } = req.body || {};

    if (!code || discount === undefined || discount === null || discount === '') {
      return res.status(400).json({ error: 'Coupon code and discount amount are required.' });
    }

    const cleanCode = String(code).trim().toUpperCase();
    const cleanDiscount = Number(discount);
    if (isNaN(cleanDiscount) || cleanDiscount <= 0) {
      return res.status(400).json({ error: 'Discount must be a valid positive number.' });
    }

    const isPercentage = (discountType === 'percentage');
    if (isPercentage && cleanDiscount > 100) {
      return res.status(400).json({ error: 'Percentage discount cannot exceed 100%.' });
    }

    let coupons = localDb.loadCollection('coupons');
    const existingIndex = coupons.findIndex(c => c.code.toUpperCase() === cleanCode);

    const couponData = {
      id: existingIndex >= 0 ? coupons[existingIndex].id : `coup_${Date.now()}`,
      code: cleanCode,
      discount: cleanDiscount,
      discountType: isPercentage ? 'percentage' : 'fixed',
      minPlan: minPlan || 'all',
      expiryDate: expiryDate || null,
      description: description || (isPercentage ? `${cleanDiscount}% promotional discount` : `₹${cleanDiscount} promotional discount`),
      isActive: isActive !== false,
      // Promoter / Beneficiary / Affiliate details:
      promoterName: (promoterName || name || '').trim(),
      promoterPhone: (promoterPhone || phone || '').trim(),
      promoterEmail: (promoterEmail || email || '').trim().toLowerCase(),
      promoterWhatsapp: (promoterWhatsapp || whatsapp || promoterPhone || phone || '').trim(),
      promoterUpiId: (promoterUpiId || upiId || '').trim(),
      redemptionCount: existingIndex >= 0 ? (coupons[existingIndex].redemptionCount || 0) : 0,
      totalDiscountGiven: existingIndex >= 0 ? (coupons[existingIndex].totalDiscountGiven || 0) : 0,
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      coupons[existingIndex] = { ...coupons[existingIndex], ...couponData };
    } else {
      couponData.createdAt = new Date().toISOString();
      coupons.push(couponData);
    }

    localDb.saveCollection('coupons', coupons);
    res.json({ success: true, message: 'Coupon saved successfully', coupon: couponData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save coupon: ' + err.message });
  }
});

// GET /api/membership/coupon-redemptions (List all redemptions with student & promoter tracking)
router.get('/coupon-redemptions', (req, res) => {
  try {
    const { code } = req.query || {};
    let redemptions = localDb.loadCollection('coupon_redemptions') || [];
    if (code) {
      const filterCode = String(code).trim().toUpperCase();
      redemptions = redemptions.filter(r => r.couponCode?.toUpperCase() === filterCode);
    }
    // Sort newest first
    redemptions.sort((a, b) => new Date(b.redeemedAt || 0) - new Date(a.redeemedAt || 0));
    res.json({ success: true, count: redemptions.length, redemptions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch coupon redemptions: ' + err.message });
  }
});

// DELETE /api/membership/coupons/:code
router.delete('/coupons/:code', (req, res) => {
  try {
    const codeToDelete = String(req.params.code).trim().toUpperCase();
    let coupons = localDb.loadCollection('coupons');
    const initialLen = coupons.length;
    coupons = coupons.filter(c => c.code.toUpperCase() !== codeToDelete);
    if (coupons.length === initialLen) {
      return res.status(404).json({ error: 'Coupon code not found.' });
    }
    localDb.saveCollection('coupons', coupons);
    res.json({ success: true, message: `Coupon ${codeToDelete} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete coupon: ' + err.message });
  }
});

// ── STUDENT REFERRAL & 15% CASHBACK PAYOUT ROUTES ───────────────────────────

// GET /api/membership/referral/profile/:email
router.get('/referral/profile/:email', (req, res) => {
  try {
    const rawEmail = req.params.email || '';
    const normEmail = rawEmail.toLowerCase().trim();
    if (!normEmail) {
      return res.status(400).json({ error: 'Student email is required.' });
    }

    const referralProfiles = localDb.loadCollection('referral_profiles') || [];
    let profile = referralProfiles.find(p => p.email?.toLowerCase() === normEmail);

    // Look up existing student / user record to prefill data
    const students = localDb.loadCollection('students') || [];
    const users = localDb.loadCollection('users') || [];
    const student = students.find(s => s.email?.toLowerCase() === normEmail) ||
                    users.find(u => u.email?.toLowerCase() === normEmail);

    if (!profile) {
      const generatedCode = generateReferralCode(student?.name, student?.rollNumber);
      profile = {
        id: `refp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: normEmail,
        name: student?.name || normEmail.split('@')[0],
        phone: student?.phone || '',
        upiId: '',
        referralCode: generatedCode,
        isRegistered: false,
        createdAt: new Date().toISOString()
      };
      referralProfiles.push(profile);
      localDb.saveCollection('referral_profiles', referralProfiles);
    }

    // Load referral payouts for this student
    const allPayouts = localDb.loadCollection('referral_payouts') || [];
    const studentReferrals = allPayouts.filter(p =>
      p.referrerEmail?.toLowerCase() === normEmail ||
      (profile.referralCode && p.referralCode?.toUpperCase() === profile.referralCode.toUpperCase())
    );

    // Sort newest first
    studentReferrals.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalEarned = studentReferrals.reduce((sum, r) => sum + (Number(r.cashbackAmount) || 0), 0);
    const pendingPayout = studentReferrals
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (Number(r.cashbackAmount) || 0), 0);
    const completedPayout = studentReferrals
      .filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + (Number(r.cashbackAmount) || 0), 0);

    res.json({
      success: true,
      profile,
      stats: {
        totalReferred: studentReferrals.length,
        totalEarned,
        pendingPayout,
        completedPayout
      },
      referrals: studentReferrals
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch referral profile: ' + err.message });
  }
});

// POST /api/membership/referral/register (Save Name, Phone, and UPI ID for 15% cashback payout)
router.post('/referral/register', (req, res) => {
  try {
    const { email, name, phone, upiId } = req.body || {};
    const normEmail = (email || '').toLowerCase().trim();
    if (!normEmail || !name || !phone || !upiId) {
      return res.status(400).json({ error: 'Full Name, Phone Number, and UPI ID are required to activate referral cashback.' });
    }

    let referralProfiles = localDb.loadCollection('referral_profiles') || [];
    let profile = referralProfiles.find(p => p.email?.toLowerCase() === normEmail);

    if (!profile) {
      const generatedCode = generateReferralCode(name);
      profile = {
        id: `refp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        email: normEmail,
        name: String(name).trim(),
        phone: String(phone).trim(),
        upiId: String(upiId).trim(),
        referralCode: generatedCode,
        isRegistered: true,
        createdAt: new Date().toISOString()
      };
      referralProfiles.push(profile);
    } else {
      profile.name = String(name).trim();
      profile.phone = String(phone).trim();
      profile.upiId = String(upiId).trim();
      profile.isRegistered = true;
      profile.updatedAt = new Date().toISOString();
    }
    localDb.saveCollection('referral_profiles', referralProfiles);

    // Sync referral code to coupons collection so friends get 15% discount when using it
    let coupons = localDb.loadCollection('coupons') || [];
    const codeUpper = profile.referralCode.toUpperCase();
    let coupon = coupons.find(c => c.code.toUpperCase() === codeUpper);
    if (!coupon) {
      coupon = {
        id: `coup_ref_${Date.now()}`,
        code: codeUpper,
        discountType: 'percentage',
        discount: 15,
        minPlan: 'all',
        expiryDate: '2030-12-31',
        description: `15% Referral Discount by ${profile.name}`,
        isActive: true,
        promoterName: profile.name,
        promoterPhone: profile.phone,
        promoterWhatsapp: profile.phone,
        promoterEmail: profile.email,
        promoterUpiId: profile.upiId,
        redemptionCount: 0,
        totalDiscountGiven: 0,
        createdAt: new Date().toISOString()
      };
      coupons.push(coupon);
    } else {
      coupon.discountType = 'percentage';
      coupon.discount = 15;
      coupon.promoterName = profile.name;
      coupon.promoterPhone = profile.phone;
      coupon.promoterWhatsapp = profile.phone;
      coupon.promoterEmail = profile.email;
      coupon.promoterUpiId = profile.upiId;
      coupon.isActive = true;
      coupon.updatedAt = new Date().toISOString();
    }
    localDb.saveCollection('coupons', coupons);

    res.json({
      success: true,
      message: 'Referral profile activated successfully! Your unique 15% referral code is ready to share.',
      profile
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register referral: ' + err.message });
  }
});

// GET /api/membership/referrals/admin-list (Admin: all student referrers and cashback payouts)
router.get('/referrals/admin-list', (req, res) => {
  try {
    const payouts = localDb.loadCollection('referral_payouts') || [];
    const profiles = localDb.loadCollection('referral_profiles') || [];

    payouts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const totalReferrals = payouts.length;
    const totalCashback = payouts.reduce((s, p) => s + (Number(p.cashbackAmount) || 0), 0);
    const pendingCashback = payouts
      .filter(p => p.status === 'pending')
      .reduce((s, p) => s + (Number(p.cashbackAmount) || 0), 0);
    const paidCashback = payouts
      .filter(p => p.status === 'paid')
      .reduce((s, p) => s + (Number(p.cashbackAmount) || 0), 0);

    res.json({
      success: true,
      stats: {
        totalReferrers: profiles.filter(p => p.isRegistered).length,
        totalReferrals,
        totalCashback,
        pendingCashback,
        paidCashback
      },
      payouts,
      profiles
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin referral list: ' + err.message });
  }
});

// POST /api/membership/referrals/mark-paid (Admin: Mark 15% cashback as paid via UPI with UTR)
router.post('/referrals/mark-paid', (req, res) => {
  try {
    const { payoutId, utr, note } = req.body || {};
    if (!payoutId) {
      return res.status(400).json({ error: 'payoutId is required.' });
    }

    let payouts = localDb.loadCollection('referral_payouts') || [];
    const payout = payouts.find(p => p.id === payoutId);
    if (!payout) {
      return res.status(404).json({ error: 'Payout record not found.' });
    }

    payout.status = 'paid';
    payout.utr = (utr || '').trim();
    payout.note = (note || '').trim();
    payout.paidAt = new Date().toISOString();

    localDb.saveCollection('referral_payouts', payouts);

    res.json({
      success: true,
      message: 'Referral cashback payout marked as Paid via UPI.',
      payout
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark payout as paid: ' + err.message });
  }
});

// ── ROUTE 3: CALCULATE PRICE (SERVER-SIDE VALIDATION) ────────────────────────
router.post('/calculate-price', (req, res) => {
  const { planId, email, couponCode, applyCredits = 0, isRenewal: reqRenewal } = req.body || {};

  const plan = PLANS[planId];
  if (!plan) {
    return res.status(400).json({ error: 'Invalid membership plan selected.' });
  }

  const normEmail = (email || '').toLowerCase().trim();
  const isWeekly = (planId === 'weekly' || planId === 'monthly');
  let isRenewal = Boolean(reqRenewal);
  if (!isRenewal && normEmail) {
    const users = localDb.loadCollection('users');
    const students = localDb.loadCollection('students');
    const existingUser = users.find(u => u.email?.toLowerCase() === normEmail);
    const existingStudent = students.find(s => s.email?.toLowerCase() === normEmail);
    if (existingUser?.membership?.planId || existingStudent?.membership?.planId) {
      isRenewal = true;
    }
  }

  let basePrice = isWeekly
    ? (isRenewal ? (plan.renewalPrice || 299) : (plan.promotionalPrice || 113))
    : (plan.listedPrice || 35999);

  if (planId === 'annual') {
    const usersCheck = localDb.loadCollection('users');
    const studentsCheck = localDb.loadCollection('students');
    const existingUser = normEmail ? usersCheck.find(u => u.email?.toLowerCase() === normEmail) : null;
    const existingStudent = normEmail ? studentsCheck.find(s => s.email?.toLowerCase() === normEmail) : null;
    const isQualified = Boolean(existingUser?.hasPassedInternshipExam || existingStudent?.hasPassedInternshipExam || req.query.isQualified === 'true' || req.query.qualified === 'true' || req.body.isQualified);
    if (isQualified) {
      basePrice = 11499;
    }
  }

  let couponDiscount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const matched = resolveCouponOrReferral(couponCode);
    if (matched) {
      if (matched.isActive === false) {
        return res.status(400).json({ error: `Coupon ${couponCode} is currently inactive.` });
      }
      if (matched.expiryDate) {
        const exp = new Date(matched.expiryDate);
        exp.setHours(23, 59, 59, 999);
        if (new Date() > exp) {
          return res.status(400).json({
            error: `Coupon '${matched.code}' expired on ${new Date(matched.expiryDate).toLocaleDateString('en-IN')}.`,
            isExpired: true
          });
        }
      }
      const isPlanMatch = !matched.minPlan || matched.minPlan === 'all' || matched.minPlan === planId ||
        (matched.minPlan === 'weekly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
        (matched.minPlan === 'monthly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
        planId === 'annual';

      if (isPlanMatch) {
        couponDiscount = getCouponDiscountAmount(matched, basePrice, planId);
        appliedCoupon = matched.code;
      } else {
        return res.status(400).json({ error: `Coupon ${couponCode} is not applicable on this plan.` });
      }
    } else {
      return res.status(400).json({ error: 'Invalid or expired coupon code.' });
    }
  }

  // Check store credits
  const userCredits = getUserCredits(email, planId);
  const maxUsableCredits = Math.min(Number(applyCredits) || 0, userCredits.balance, basePrice - couponDiscount);
  const creditsDeducted = Math.max(0, maxUsableCredits);

  const payableAmount = Math.max(0, basePrice - couponDiscount - creditsDeducted);

  res.json({
    success: true,
    planId,
    planName: plan.name,
    listedPrice: plan.listedPrice,
    basePrice,
    isRenewal,
    couponDiscount,
    appliedCoupon,
    creditsDeducted,
    availableCredits: userCredits.balance,
    payableAmount
  });
});

// ── PAYMENT EMAIL OTP VERIFICATION SYSTEM ──────────────────────────────────
const paymentOtpCache = new Map();

function getMailTransporter() {
  try {
    const nodemailer = require('nodemailer');
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER) {
      console.log('[Membership] Mail config missing in .env');
      return null;
    }
    return nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    });
  } catch (err) {
    console.error('[Membership] Mail transporter error:', err.message);
    return null;
  }
}

// POST /api/membership/send-payment-otp
router.post('/send-payment-otp', async (req, res) => {
  try {
    const { email, name, planId } = req.body || {};
    if (!email || !String(email).trim() || !String(email).includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const normEmail = String(email).toLowerCase().trim();
    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    paymentOtpCache.set(normEmail, {
      code: otpCode,
      expiresAt,
      verified: false,
      createdAt: Date.now()
    });

    console.log(`[Payment OTP] Generated for ${normEmail}: ${otpCode}`);

    // Send real email via SMTP
    const transporter = getMailTransporter();
    if (transporter) {
      const planName = PLANS[planId]?.name || 'Levlox Academy Membership';
      const mailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px; }
            .card { max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 10px 30px rgba(16, 27, 51, 0.06); }
            .header { background: linear-gradient(135deg, #101B33 0%, #1E293B 100%); padding: 28px 24px; text-align: center; color: #FFFFFF; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px; }
            .header p { margin: 6px 0 0; font-size: 13px; color: #94A3B8; }
            .body { padding: 32px 28px; color: #334155; }
            .otp-box { text-align: center; margin: 28px 0; }
            .otp-code { display: inline-block; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563EB; background: #EFF6FF; padding: 14px 28px; border-radius: 10px; border: 2px dashed #93C5FD; font-family: 'Courier New', monospace; }
            .footer { padding: 20px 24px; background: #F8FAFC; border-top: 1px solid #E2E8F0; font-size: 11.5px; color: #94A3B8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>LEVLOX ACADEMY</h1>
              <p>Email Authorization & Payment Security</p>
            </div>
            <div class="body">
              <h2 style="font-size: 18px; color: #0F172A; margin: 0 0 12px;">Authorize Your Payment</h2>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
                Hello <strong>${name || 'Student'}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px; color: #475569;">
                Please enter the verification code below on the Levlox Academy checkout window to verify your registered email (<strong>${normEmail}</strong>) and proceed to the payment gateway:
              </p>
              
              <div class="otp-box">
                <span class="otp-code">${otpCode}</span>
              </div>

              <div style="background: #F1F5F9; border-left: 4px solid #2563EB; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12.5px; color: #475569;">
                  ⏱️ This verification code expires in <strong>10 minutes</strong>. For your security, never share this code with anyone.
                </p>
              </div>

              <p style="font-size: 13px; color: #64748B; margin: 0;">
                Enrolling in: <strong>${planName}</strong>
              </p>
            </div>
            <div class="footer">
              &copy; ${new Date().getFullYear()} Levlox Tech Private Limited. All rights reserved.<br />
              Need assistance? Email us at <a href="mailto:sales@levlox.in" style="color: #2563EB;">sales@levlox.in</a>
            </div>
          </div>
        </body>
        </html>
      `;

      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'Levlox Academy'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
        to: normEmail,
        subject: `Your Levlox Academy Payment Verification Code: ${otpCode}`,
        html: mailHtml
      });
    }

    res.json({
      success: true,
      message: `Verification code sent to ${normEmail}`
    });
  } catch (err) {
    console.error('[Membership] send-payment-otp error:', err);
    res.status(500).json({ error: 'Failed to send verification email: ' + err.message });
  }
});

// POST /api/membership/verify-payment-otp
router.post('/verify-payment-otp', (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const normEmail = String(email).toLowerCase().trim();
    const cleanOtp = String(otp).trim();
    const cached = paymentOtpCache.get(normEmail);

    if (!cached) {
      return res.status(400).json({ error: 'No verification code found. Please request a new code.' });
    }

    if (Date.now() > cached.expiresAt) {
      paymentOtpCache.delete(normEmail);
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    if (cached.code !== cleanOtp) {
      return res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.' });
    }

    // Mark as verified
    cached.verified = true;
    paymentOtpCache.set(normEmail, cached);

    res.json({
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed: ' + err.message });
  }
});

// ── ROUTE 4: CREATE RAZORPAY ORDER ───────────────────────────────────────────
router.post('/create-order', async (req, res) => {
  try {
    const { planId, email, name, phone, couponCode, applyCredits = 0, isRenewal: reqRenewal } = req.body || {};

    const normEmail = email ? String(email).toLowerCase().trim() : '';
    if (!normEmail || !name || !phone) {
      return res.status(400).json({ error: 'Full registration with name, email, and phone number is required to make a payment.' });
    }

    const isWeekly = (planId === 'weekly' || planId === 'monthly');
    let isRenewal = Boolean(reqRenewal);
    if (!isRenewal && normEmail) {
      const users = localDb.loadCollection('users');
      const students = localDb.loadCollection('students');
      const existingUser = users.find(u => u.email?.toLowerCase() === normEmail);
      const existingStudent = students.find(s => s.email?.toLowerCase() === normEmail);
      if (existingUser?.membership?.planId || existingStudent?.membership?.planId) {
        isRenewal = true;
      }
    }

    const otpRecord = paymentOtpCache.get(normEmail);
    if (!isRenewal && (!otpRecord || !otpRecord.verified)) {
      return res.status(403).json({ error: 'Email authorization required. Please verify the 6-digit OTP sent to your registered email before initiating payment.' });
    }

    const plan = PLANS[planId];
    if (!plan) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    // First-Time Weekly Requirement Gate:
    // Any member attempting to purchase the full annual plan must have previously enrolled in or completed a weekly cycle.
    if (planId === 'annual' && !isRenewal && !req.body.bypassWeeklyRequirement) {
      const usersCheck = localDb.loadCollection('users');
      const studentsCheck = localDb.loadCollection('students');
      const existingUser = usersCheck.find(u => u.email?.toLowerCase() === normEmail);
      const existingStudent = studentsCheck.find(s => s.email?.toLowerCase() === normEmail);
      const hasWeeklyAccess = Boolean(existingUser?.membership?.planId || existingStudent?.membership?.planId);
      if (!hasWeeklyAccess) {
        return res.status(403).json({
          error: 'First-time members must start with the Weekly Learning Sprint (Week 1 for ₹113) before unlocking the full 1-Year Machine Learning Engineer Internship.',
          requiresWeeklyFirst: true
        });
      }
    }

    let basePrice = isWeekly
      ? (isRenewal ? (plan.renewalPrice || 299) : (plan.promotionalPrice || 113))
      : 11499;

    let couponDiscount = 0;
    if (couponCode) {
      const matched = resolveCouponOrReferral(couponCode);
      if (matched && matched.isActive !== false) {
        let isExpired = false;
        if (matched.expiryDate) {
          const exp = new Date(matched.expiryDate);
          exp.setHours(23, 59, 59, 999);
          if (new Date() > exp) isExpired = true;
        }
        const isPlanMatch = !matched.minPlan || matched.minPlan === 'all' || matched.minPlan === planId ||
          (matched.minPlan === 'weekly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
          (matched.minPlan === 'monthly' && (planId === 'weekly' || planId === 'monthly' || planId === 'annual')) ||
          planId === 'annual';

        if (!isExpired && isPlanMatch) {
          couponDiscount = getCouponDiscountAmount(matched, basePrice, planId);
        }
      }
    }

    const payableAmount = Math.max(0, basePrice - couponDiscount);

    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If payable amount is 0 (100% covered by credits/coupons), bypass Razorpay and return mock zero-order
    if (payableAmount === 0) {
      return res.json({
        success: true,
        isZeroPayment: true,
        orderId: `order_free_${Date.now()}`,
        amount: 0,
        currency: 'INR',
        receipt,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder'
      });
    }

    // Amount in Paise for Razorpay
    const amountInPaise = Math.round(payableAmount * 100);

    let order = null;
    const rzp = getRazorpay();
    if (rzp) {
      order = await rzp.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes: {
          planId,
          email,
          name,
          phone
        }
      });
    } else {
      // Local development test mode
      order = {
        id: `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        status: 'created'
      };
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      payableAmount,
      currency: order.currency || 'INR',
      receipt,
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      planName: plan.name,
      customer: { name, email, phone }
    });
  } catch (err) {
    console.error('[Membership] Order creation error:', err);
    res.status(500).json({ error: 'Failed to create payment order. ' + err.message });
  }
});

// ── ROUTE 5: VERIFY PAYMENT & ACTIVATE STUDENT ACCOUNT (STEPS 8 & 9) ─────────
router.post('/verify-payment', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      email,
      name,
      phone,
      couponCode,
      applyCredits = 0,
      isSimulatedTest = false
    } = req.body || {};

    if (!email || !planId) {
      return res.status(400).json({ error: 'Email and membership plan are required.' });
    }

    const normEmail = email.toLowerCase().trim();
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan selected.' });

    // 1. Signature Verification
    const isLiveKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_ID.includes('placeholder');
    const isSimulated = Boolean(isSimulatedTest) ||
      (razorpay_signature === 'signature_valid') ||
      (razorpay_signature === 'simulated_valid_signature') ||
      (razorpay_payment_id && String(razorpay_payment_id).startsWith('sim_'));

    if (isLiveKeys && !isSimulated && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment signature verification failed. Untrusted payment.' });
      }
    }

    // 2. Prevent Duplicate Payment Activations
    const memberships = localDb.loadCollection('memberships');
    const existingPayment = memberships.find(m => m.paymentId === razorpay_payment_id && razorpay_payment_id);
    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Membership already activated for this transaction.',
        membership: existingPayment,
        studentId: existingPayment.studentId
      });
    }

    // 3. Recalculate Final Amounts on Server
    const isWeekly = (planId === 'weekly' || planId === 'monthly');
    let isRenewal = Boolean(req.body.isRenewal);
    if (!isRenewal && normEmail) {
      const usersCheck = localDb.loadCollection('users');
      const studentsCheck = localDb.loadCollection('students');
      const existingUser = usersCheck.find(u => u.email?.toLowerCase() === normEmail);
      const existingStudent = studentsCheck.find(s => s.email?.toLowerCase() === normEmail);
      if (existingUser?.membership?.planId || existingStudent?.membership?.planId) {
        isRenewal = true;
      }
    }

    if (planId === 'annual' && !isRenewal && !isSimulatedTest && !req.body.bypassWeeklyRequirement) {
      const usersCheck = localDb.loadCollection('users');
      const studentsCheck = localDb.loadCollection('students');
      const existingUser = usersCheck.find(u => u.email?.toLowerCase() === normEmail);
      const existingStudent = studentsCheck.find(s => s.email?.toLowerCase() === normEmail);
      const hasWeeklyAccess = Boolean(existingUser?.membership?.planId || existingStudent?.membership?.planId);
      if (!hasWeeklyAccess) {
        return res.status(403).json({
          error: 'First-time members must start with the Weekly Learning Sprint (Week 1 for ₹113) before unlocking the full 1-Year Machine Learning Engineer Internship.',
          requiresWeeklyFirst: true
        });
      }
    }
    let basePrice = isWeekly
      ? (isRenewal ? (plan.renewalPrice || 299) : (plan.promotionalPrice || 113))
      : (plan.listedPrice || 35999);

    if (planId === 'annual') {
      const usersCheck = localDb.loadCollection('users');
      const studentsCheck = localDb.loadCollection('students');
      const existingUser = usersCheck.find(u => u.email?.toLowerCase() === normEmail);
      const existingStudent = studentsCheck.find(s => s.email?.toLowerCase() === normEmail);
      const isQualified = Boolean(existingUser?.hasPassedInternshipExam || existingStudent?.hasPassedInternshipExam || req.body.isQualified);
      if (isQualified) {
        basePrice = 11499;
      }
    }
    let couponDiscount = 0;
    let matchedCoupon = null;
    if (couponCode) {
      const coupons = getCoupons();
      matchedCoupon = coupons.find(c => c.code.toUpperCase() === String(couponCode).trim().toUpperCase());
      if (matchedCoupon) couponDiscount = getCouponDiscountAmount(matchedCoupon, basePrice, planId);
    }

    const storeCreditsList = localDb.loadCollection('store_credits');
    let userCredit = storeCreditsList.find(c => c.email?.toLowerCase() === normEmail);
    if (!userCredit) {
      userCredit = getUserCredits(normEmail, planId);
    }

    const creditsDeducted = Math.max(0, Math.min(Number(applyCredits) || 0, userCredit.balance, basePrice - couponDiscount));
    const paidAmount = Math.max(0, basePrice - couponDiscount - creditsDeducted);

    // Deduct credits if applied
    if (creditsDeducted > 0) {
      userCredit.balance = Math.max(0, userCredit.balance - creditsDeducted);
      userCredit.transactions.push({
        id: `tx_${Date.now()}_redeem`,
        type: 'deduct',
        amount: creditsDeducted,
        description: `Applied to ${plan.name}`,
        orderId: razorpay_order_id || 'free_order',
        date: new Date().toISOString()
      });
      localDb.saveCollection('store_credits', storeCreditsList);
    }

    // 4. Generate Unique Invoice Number
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const invoices = localDb.loadCollection('invoices');
    const invoiceRecord = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      customerName: name || normEmail.split('@')[0],
      customerEmail: normEmail,
      customerPhone: phone || '',
      planId,
      planName: plan.name,
      basePrice,
      couponDiscount,
      couponCode: couponCode || null,
      promoterName: matchedCoupon?.promoterName || null,
      promoterUpiId: matchedCoupon?.promoterUpiId || null,
      creditsDeducted,
      paidAmount,
      currency: 'INR',
      paymentId: razorpay_payment_id || `sim_pay_${Date.now()}`,
      orderId: razorpay_order_id || `sim_ord_${Date.now()}`,
      status: 'paid',
      createdAt: new Date().toISOString()
    };
    invoices.push(invoiceRecord);
    localDb.saveCollection('invoices', invoices);

    // 4b. Log Coupon Redemption with student and promoter tracking
    if (couponCode && couponDiscount > 0) {
      try {
        const cleanCouponCode = String(couponCode).trim().toUpperCase();
        let allCoupons = localDb.loadCollection('coupons');
        let targetCoupon = allCoupons.find(c => c.code?.toUpperCase() === cleanCouponCode) || matchedCoupon;
        if (targetCoupon) {
          targetCoupon.redemptionCount = (targetCoupon.redemptionCount || 0) + 1;
          targetCoupon.totalDiscountGiven = (targetCoupon.totalDiscountGiven || 0) + couponDiscount;
          localDb.saveCollection('coupons', allCoupons);
        }

        const redemptions = localDb.loadCollection('coupon_redemptions');
        const redemptionEntry = {
          id: `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          couponCode: cleanCouponCode,
          couponId: targetCoupon?.id || null,
          discount: couponDiscount,
          // Promoter / Beneficiary Info (who owns this coupon):
          promoterName: targetCoupon?.promoterName || '',
          promoterPhone: targetCoupon?.promoterPhone || '',
          promoterEmail: targetCoupon?.promoterEmail || '',
          promoterWhatsapp: targetCoupon?.promoterWhatsapp || targetCoupon?.promoterPhone || '',
          promoterUpiId: targetCoupon?.promoterUpiId || '',
          // Student / User Info (who redeemed):
          studentName: name || normEmail.split('@')[0],
          studentEmail: normEmail,
          studentPhone: phone || '',
          planId,
          planName: plan.name,
          basePrice,
          paidAmount,
          invoiceNumber,
          orderId: razorpay_order_id || `sim_ord_${Date.now()}`,
          paymentId: razorpay_payment_id || `sim_pay_${Date.now()}`,
          redeemedAt: new Date().toISOString()
        };
        redemptions.push(redemptionEntry);
        localDb.saveCollection('coupon_redemptions', redemptions);
      } catch (redErr) {
        console.warn('[Membership] Failed to log coupon redemption:', redErr.message);
      }
    }

    // 4c. Log 15% Student Referral Cashback if coupon used has promoter details / UPI ID
    if (matchedCoupon && (matchedCoupon.promoterUpiId || matchedCoupon.code?.startsWith('REF-'))) {
      try {
        const referralPayouts = localDb.loadCollection('referral_payouts') || [];
        const alreadyLogged = referralPayouts.some(p => p.paymentId === (razorpay_payment_id || '') && p.paymentId);
        if (!alreadyLogged) {
          const cashbackAmt = Math.max(0, Math.round(paidAmount * 0.15));
          referralPayouts.push({
            id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            referralCode: String(couponCode).trim().toUpperCase(),
            referrerName: matchedCoupon.promoterName || '',
            referrerPhone: matchedCoupon.promoterPhone || '',
            referrerEmail: matchedCoupon.promoterEmail || '',
            referrerUpiId: matchedCoupon.promoterUpiId || '',
            studentName: name || normEmail.split('@')[0],
            studentEmail: normEmail,
            studentPhone: phone || '',
            planId,
            planName: plan.name,
            basePrice,
            paidAmount,
            cashbackPercent: 15,
            cashbackAmount: cashbackAmt,
            status: 'pending',
            invoiceNumber,
            orderId: razorpay_order_id || `sim_ord_${Date.now()}`,
            paymentId: razorpay_payment_id || `sim_pay_${Date.now()}`,
            createdAt: new Date().toISOString(),
            paidAt: null,
            utr: null,
            note: null
          });
          localDb.saveCollection('referral_payouts', referralPayouts);
        }
      } catch (refErr) {
        console.warn('[Membership] Failed to record referral payout:', refErr.message);
      }
    }

    // 5. Create or Activate Student Account in students.json & users.json
    const users = localDb.loadCollection('users');
    const students = localDb.loadCollection('students');

    let user = users.find(u => u.email?.toLowerCase() === normEmail);
    let student = students.find(s => s.email?.toLowerCase() === normEmail);

    let tempPassword = null;
    let studentId = student?.id || student?.uid || user?.id || `LVX-STD-${Math.floor(10000 + Math.random() * 90000)}`;

    let baseStartTime = Date.now();
    const existingExpiry = student?.accessExpiresAt || user?.portalExpiresAt;
    if (existingExpiry && new Date(existingExpiry).getTime() > Date.now()) {
      baseStartTime = new Date(existingExpiry).getTime();
    }
    const startDate = new Date();
    const expiresAt = new Date(baseStartTime + plan.durationDays * 24 * 60 * 60 * 1000);

    // Ensure dedicated "Portal Students" batch exists in database
    const batches = localDb.loadCollection('batches');
    let portalBatch = batches.find(b => b.name === 'Portal Students' || b.id === 'batch_portal_students');
    if (!portalBatch) {
      portalBatch = {
        id: 'batch_portal_students',
        uid: 'batch_portal_students',
        name: 'Portal Students',
        code: 'PORTAL-STD',
        course: 'Levlox Academy',
        course_name: 'Levlox Academy Membership',
        status: 'active',
        description: 'Dedicated batch for self-paced portal students with access to Python, Machine Learning, SQL and Project recorded sessions.',
        isPortalOnly: true,
        createdAt: new Date().toISOString()
      };
      batches.push(portalBatch);
      localDb.saveCollection('batches', batches);
    }

    const leads = localDb.loadCollection('leads');
    const matchedLead = leads.find(l => l.email?.toLowerCase() === normEmail);
    const chosenPassword = req.body.password || matchedLead?.password || null;

    if (!user) {
      if (chosenPassword) {
        tempPassword = chosenPassword;
      } else {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        tempPassword = `Levlox@${randomSuffix}`;
      }

      const { salt, hash } = localDb.hashPassword(tempPassword);
      user = {
        id: studentId,
        uid: studentId,
        email: normEmail,
        name: name || normEmail.split('@')[0],
        role: 'student',
        phone: phone || '',
        status: 'active',
        isDeactivated: false,
        requiresPasswordChange: !chosenPassword,
        customPasswordSet: Boolean(chosenPassword),
        batch: 'Portal Students',
        batch_name: 'Portal Students',
        batch_id: 'batch_portal_students',
        isPortalOnly: true,
        salt,
        passwordHash: hash,
        tempPassword,
        rawPassword: tempPassword,
        portalExpiresAt: expiresAt.toISOString(),
        membership: {
          planId,
          planName: plan.name,
          status: 'active',
          startDate: startDate.toISOString(),
          expiresAt: expiresAt.toISOString(),
          invoiceNumber
        },
        internshipHubAccess: planId === 'annual',
        hasInternshipHubAccess: planId === 'annual',
        createdAt: new Date().toISOString()
      };
      users.push(user);
    } else {
      // Reactivate existing account and renew membership
      if (chosenPassword) {
        const { salt, hash } = localDb.hashPassword(chosenPassword);
        user.salt = salt;
        user.passwordHash = hash;
        user.tempPassword = chosenPassword;
        user.rawPassword = chosenPassword;
        user.customPasswordSet = true;
        user.requiresPasswordChange = false;
        tempPassword = chosenPassword;
      }
      user.status = 'active';
      user.isDeactivated = false;
      user.isMembershipExpired = false;
      user.role = 'student';
      if (!user.batch) {
        user.batch = 'Portal Students';
        user.batch_name = 'Portal Students';
        user.batch_id = 'batch_portal_students';
        user.isPortalOnly = true;
      }
      user.portalExpiresAt = expiresAt.toISOString();
      user.membership = {
        planId,
        planName: plan.name,
        status: 'active',
        startDate: startDate.toISOString(),
        expiresAt: expiresAt.toISOString(),
        invoiceNumber
      };
      if (planId === 'annual') {
        user.internshipHubAccess = true;
        user.hasInternshipHubAccess = true;
      }
      user.updatedAt = new Date().toISOString();
      tempPassword = chosenPassword || user.tempPassword || user.rawPassword || 'Your chosen password';
    }
    localDb.saveCollection('users', users);

    if (!student) {
      student = {
        id: studentId,
        uid: studentId,
        rollNumber: studentId,
        name: name || normEmail.split('@')[0],
        email: normEmail,
        phone: phone || '',
        status: 'active',
        isDeactivated: false,
        isMembershipExpired: false,
        tempPassword,
        rawPassword: tempPassword,
        password: tempPassword,
        course: 'Levlox Academy',
        course_name: 'Levlox Academy Membership',
        batch: 'Portal Students',
        batch_name: 'Portal Students',
        batch_id: 'batch_portal_students',
        isPortalOnly: true,
        feesStatus: 'Paid',
        accessExpiresAt: expiresAt.toISOString(),
        membership: {
          planId,
          planName: plan.name,
          invoiceNumber,
          expiresAt: expiresAt.toISOString()
        },
        internshipHubAccess: planId === 'annual',
        hasInternshipHubAccess: planId === 'annual',
        createdAt: new Date().toISOString()
      };
      students.push(student);
    } else {
      student.status = 'active';
      student.isDeactivated = false;
      student.isMembershipExpired = false;
      if (chosenPassword) {
        student.password = chosenPassword;
        student.tempPassword = chosenPassword;
        student.rawPassword = chosenPassword;
      }
      if (!student.batch) {
        student.batch = 'Portal Students';
        student.batch_name = 'Portal Students';
        student.batch_id = 'batch_portal_students';
        student.isPortalOnly = true;
      }
      student.feesStatus = 'Paid';
      student.accessExpiresAt = expiresAt.toISOString();
      student.membership = {
        planId,
        planName: plan.name,
        invoiceNumber,
        expiresAt: expiresAt.toISOString()
      };
      if (planId === 'annual') {
        student.internshipHubAccess = true;
        student.hasInternshipHubAccess = true;
      }
      student.updatedAt = new Date().toISOString();
    }
    localDb.saveCollection('students', students);

    // 6. Record Membership
    const membershipRecord = {
      id: `mem_${Date.now()}`,
      studentId,
      email: normEmail,
      name: name || normEmail.split('@')[0],
      phone: phone || '',
      planId,
      planName: plan.name,
      durationDays: plan.durationDays,
      startDate: startDate.toISOString(),
      expiresAt: expiresAt.toISOString(),
      paymentId: razorpay_payment_id || `sim_${Date.now()}`,
      orderId: razorpay_order_id || `sim_${Date.now()}`,
      amountPaid: paidAmount,
      invoiceNumber,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    memberships.push(membershipRecord);
    localDb.saveCollection('memberships', memberships);

    // 7. Update Lead status to converted
    const freshLeads = localDb.loadCollection('leads');
    const lead = freshLeads.find(l => l.email === normEmail);
    if (lead) {
      lead.status = 'converted_member';
      lead.portalAccessGranted = true;
      lead.studentId = studentId;
      localDb.saveCollection('leads', freshLeads);
    }

    // 8. Send Confirmation & Welcome Email
    sendWelcomeEmail({
      studentName: name || normEmail.split('@')[0],
      email: normEmail,
      studentId,
      tempPassword,
      membershipName: plan.name,
      validUntil: expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      invoiceNumber,
      paidAmount,
      paymentId: razorpay_payment_id || 'Direct Payment'
    }).catch(e => console.warn('[Membership] Welcome email send error:', e.message));

    res.json({
      success: true,
      message: 'Payment verified and Levlox Academy membership activated!',
      studentId,
      invoiceNumber,
      email: normEmail,
      planName: plan.name,
      expiresAt: expiresAt.toISOString(),
      loginUrl: 'https://levloxstudent.com/login'
    });
  } catch (err) {
    console.error('[Membership] Payment verification error:', err);
    res.status(500).json({ error: 'Failed to verify payment and activate membership: ' + err.message });
  }
});

// ── EMAIL SENDER HELPER ───────────────────────────────────────────────────────
async function sendWelcomeEmail({ studentName, email, studentId, tempPassword, membershipName, validUntil, invoiceNumber, paidAmount, paymentId }) {
  try {
    const nodemailer = require('nodemailer');
    if (!process.env.MAIL_HOST || !process.env.MAIL_USER) {
      console.log('[Membership] Mail config missing in .env, skipping real email dispatch.');
      return;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT) || 587,
      secure: Number(process.env.MAIL_PORT) === 465,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    });

    const emailHtml = `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #0E1726; color: #FFFFFF; border-radius: 16px; overflow: hidden; border: 1px solid #1E293B;">
        <div style="background: linear-gradient(135deg, #101B33 0%, #1E2248 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #4568F5;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">LEVLOX ACADEMY</h1>
          <p style="margin: 8px 0 0; color: #94A3B8; font-size: 14px;">Intelligent Learning Experience & IT Career Accelerator</p>
        </div>
        
        <div style="padding: 32px 30px; background: #0F172A;">
          <h2 style="margin: 0 0 16px; font-size: 20px; color: #38BDF8;">Welcome to Levlox Academy, ${studentName}! 🎉</h2>
          <p style="color: #CBD5E1; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
            Your payment has been successfully verified, and your <strong>${membershipName}</strong> is now officially active! You now have full access to our premium courses, hands-on projects, online internships, and interview acceleration resources.
          </p>

          <div style="background: #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #334155;">
            <h3 style="margin: 0 0 14px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #818CF8;">🔐 Your Student Portal Login Credentials</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #94A3B8; width: 40%;">Portal URL:</td>
                <td style="padding: 6px 0; color: #FFFFFF;"><a href="https://levloxstudent.com/login" style="color: #38BDF8; text-decoration: none; font-weight: 600;">https://levloxstudent.com/login</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8;">Student ID / Email:</td>
                <td style="padding: 6px 0; color: #FFFFFF; font-weight: 600;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8;">Roll Number:</td>
                <td style="padding: 6px 0; color: #38BDF8; font-weight: 600;">${studentId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8;">Portal Password:</td>
                <td style="padding: 6px 0; color: #34D399; font-weight: 700; font-family: monospace; font-size: 16px;">${tempPassword}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94A3B8;">Valid Until:</td>
                <td style="padding: 6px 0; color: #FBBF24; font-weight: 600;">${validUntil}</td>
              </tr>
            </table>
          </div>

          <div style="background: #131E33; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #23335A;">
            <h3 style="margin: 0 0 14px; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #93C5FD;">📄 Payment & Invoice Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 5px 0; color: #94A3B8;">Invoice Number:</td>
                <td style="padding: 5px 0; color: #FFFFFF; font-weight: 600;">${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #94A3B8;">Amount Paid:</td>
                <td style="padding: 5px 0; color: #10B981; font-weight: 700;">₹${paidAmount.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding: 5px 0; color: #94A3B8;">Payment Ref ID:</td>
                <td style="padding: 5px 0; color: #E2E8F0;">${paymentId}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin-bottom: 28px;">
            <a href="https://levloxstudent.com/login" style="display: inline-block; background: linear-gradient(135deg, #4568F5 0%, #3554D8 100%); color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 14px 36px; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 14px rgba(69, 104, 245, 0.4);">
              Go to Student Portal Login →
            </a>
          </div>

          <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
            Need help or have questions? Contact support anytime at <a href="mailto:sales@levlox.in" style="color: #60A5FA;">sales@levlox.in</a>.
          </p>
        </div>
        
        <div style="background: #0B1120; padding: 16px; text-align: center; font-size: 12px; color: #475569;">
          &copy; ${new Date().getFullYear()} Levlox Technologies. All rights reserved.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${process.env.MAIL_FROM_NAME || 'Levlox Academy'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to: email,
      subject: 'Welcome to Levlox Academy – Your Membership is Activated!',
      html: emailHtml
    });

    console.log(`[Membership] Welcome email successfully sent to ${email} (Invoice: ${invoiceNumber})`);

    // Notify Admin (levloxtech@gmail.com)
    try {
      await transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME || 'Levlox Academy'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
        to: 'levloxtech@gmail.com',
        subject: `[New Student Payment] ${studentName} enrolled in ${membershipName} (₹${paidAmount})`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; color: #1e293b;">
            <h2 style="color: #2563eb;">New Academy Membership Enrolled! 🎉</h2>
            <p>A new student has completed payment and activated their account in <strong>Portal Students</strong> batch.</p>
            <ul>
              <li><strong>Student Name:</strong> ${studentName}</li>
              <li><strong>Email:</strong> ${email}</li>
              <li><strong>Student ID / Roll No:</strong> ${studentId}</li>
              <li><strong>Membership Plan:</strong> ${membershipName}</li>
              <li><strong>Amount Paid:</strong> ₹${paidAmount}</li>
              <li><strong>Invoice Number:</strong> ${invoiceNumber}</li>
              <li><strong>Payment ID:</strong> ${paymentId}</li>
              <li><strong>Batch Assigned:</strong> Portal Students</li>
              <li><strong>Valid Until:</strong> ${validUntil}</li>
            </ul>
          </div>
        `
      });
      console.log(`[Membership] Admin alert sent to levloxtech@gmail.com for student ${studentId}`);
    } catch (admErr) {
      console.warn('[Membership] Failed to send admin notification email:', admErr.message);
    }
  } catch (err) {
    console.error('[Membership] Email sending failed:', err.message);
  }
}

// ── ROUTE 6: RAZORPAY WEBHOOK HANDLER ─────────────────────────────────────────
router.post('/webhook', (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (signature !== expected) {
      return res.status(400).send('Invalid webhook signature');
    }
  }

  const event = req.body.event;
  console.log(`[Membership Webhook] Received Razorpay event: ${event}`);

  // Safely acknowledge receipt to prevent Razorpay retries
  res.status(200).json({ received: true });
});

// ── TESTIMONIALS & VIDEO PROOF API (ADMIN + SHOWCASE) ─────────────────────────

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

function extractDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]{10,})/i) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]{10,})/i) ||
    url.match(/\/file\/u\/\d+\/d\/([a-zA-Z0-9_-]{10,})/i);
  return match ? match[1] : null;
}

function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();

  // Strip localhost / 127.0.0.1 host from /uploads/
  clean = clean.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/uploads\/)/i, '');

  const driveId = extractDriveId(clean);
  if (driveId) {
    return `https://lh3.googleusercontent.com/d/${driveId}`;
  }

  const ytId = extractYouTubeId(clean);
  if (ytId && !clean.includes('watch') && !clean.includes('embed')) {
    return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  }

  return clean;
}

// GET /api/membership/testimonials - Fetch all testimonials (public)
router.get('/testimonials', (req, res) => {
  try {
    let items = localDb.getDocuments('academy_testimonials');
    if (!items || items.length === 0) {
      // Provide an initial sample if collection is empty
      const initial = [
        {
          id: 'testi_sample_1',
          title: 'Career Switch to Python Developer in 90 Days',
          studentName: 'Sanjay Kumar',
          role: 'Junior Software Engineer @ Zoho',
          linkedinUrl: 'https://www.linkedin.com/in/sanjay-kumar',
          rating: 5,
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnailUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          feedback: 'Learning complex backend concepts in Tamil gave me the confidence to clear my technical interviews on the first attempt.',
          active: true,
          createdAt: new Date().toISOString()
        }
      ];
      items = initial;
      initial.forEach(t => localDb.setDocument('academy_testimonials', t.id, t));
    }
    const cleaned = (items || []).map(t => {
      let thumb = normalizeMediaUrl(t.thumbnailUrl);
      if (!thumb && t.videoUrl) {
        const ytId = extractYouTubeId(t.videoUrl);
        if (ytId) thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
        const driveId = extractDriveId(t.videoUrl);
        if (driveId) thumb = `https://lh3.googleusercontent.com/d/${driveId}`;
      }
      return {
        ...t,
        thumbnailUrl: thumb || t.thumbnailUrl || '',
        videoUrl: t.videoUrl ? t.videoUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/uploads\/)/i, '') : ''
      };
    });
    res.json({ success: true, testimonials: cleaned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch testimonials: ' + err.message });
  }
});

// POST /api/membership/testimonials - Add testimonial (admin)
router.post('/testimonials', (req, res) => {
  try {
    const { title, studentName, role, linkedinUrl, rating = 5, videoUrl, thumbnailUrl, feedback, active = true } = req.body;
    if (!studentName || !videoUrl) {
      return res.status(400).json({ error: 'Student Name and Video URL are required.' });
    }

    let resolvedThumb = normalizeMediaUrl(thumbnailUrl);
    if (!resolvedThumb && videoUrl) {
      const ytId = extractYouTubeId(videoUrl);
      if (ytId) resolvedThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      const driveId = extractDriveId(videoUrl);
      if (driveId) resolvedThumb = `https://lh3.googleusercontent.com/d/${driveId}`;
    }

    const cleanVideo = videoUrl.trim().replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/uploads\/)/i, '');

    const newDoc = {
      id: `testi_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      title: title ? title.trim() : `${studentName.trim()} - Review`,
      studentName: studentName.trim(),
      role: role?.trim() || 'Levlox Academy Student',
      linkedinUrl: linkedinUrl?.trim() || '',
      rating: Math.max(1, Math.min(5, Number(rating) || 5)),
      videoUrl: cleanVideo,
      thumbnailUrl: resolvedThumb,
      feedback: feedback?.trim() || '',
      active: active !== false,
      createdAt: new Date().toISOString()
    };

    localDb.setDocument('academy_testimonials', newDoc.id, newDoc);
    res.json({ success: true, testimonial: newDoc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add testimonial: ' + err.message });
  }
});

// PUT /api/membership/testimonials/:id - Update testimonial (admin)
router.put('/testimonials/:id', (req, res) => {
  try {
    const id = req.params.id;
    const existing = localDb.getDocument('academy_testimonials', id);
    if (!existing) {
      return res.status(404).json({ error: 'Testimonial not found.' });
    }

    const { title, studentName, role, linkedinUrl, rating, videoUrl, thumbnailUrl, feedback, active } = req.body;
    let resolvedThumb = thumbnailUrl !== undefined ? normalizeMediaUrl(thumbnailUrl) : normalizeMediaUrl(existing.thumbnailUrl);
    const effectiveUrl = videoUrl ? videoUrl.trim() : existing.videoUrl;
    if (!resolvedThumb && effectiveUrl) {
      const ytId = extractYouTubeId(effectiveUrl);
      if (ytId) resolvedThumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      const driveId = extractDriveId(effectiveUrl);
      if (driveId) resolvedThumb = `https://lh3.googleusercontent.com/d/${driveId}`;
    }

    const cleanVideo = effectiveUrl.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?=\/uploads\/)/i, '');

    const updated = {
      ...existing,
      title: title !== undefined ? title.trim() : existing.title,
      studentName: studentName !== undefined ? studentName.trim() : existing.studentName,
      role: role !== undefined ? role.trim() : existing.role,
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl.trim() : (existing.linkedinUrl || ''),
      rating: rating !== undefined ? Math.max(1, Math.min(5, Number(rating) || 5)) : (existing.rating || 5),
      videoUrl: cleanVideo,
      thumbnailUrl: resolvedThumb,
      feedback: feedback !== undefined ? feedback.trim() : (existing.feedback || ''),
      active: active !== undefined ? Boolean(active) : (existing.active !== false),
      updatedAt: new Date().toISOString()
    };

    localDb.setDocument('academy_testimonials', id, updated);
    res.json({ success: true, testimonial: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update testimonial: ' + err.message });
  }
});

// DELETE /api/membership/testimonials/:id - Delete testimonial (admin)
router.delete('/testimonials/:id', (req, res) => {
  try {
    const id = req.params.id;
    const deleted = localDb.deleteDocument('academy_testimonials', id);
    if (!deleted) {
      return res.status(404).json({ error: 'Testimonial not found or already deleted.' });
    }
    res.json({ success: true, message: 'Testimonial deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete testimonial: ' + err.message });
  }
});

module.exports = router;
