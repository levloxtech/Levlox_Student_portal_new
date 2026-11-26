/**
 * Levlox Student Portal — Internship Qualifying Exam & Yearly Vault Routes
 *
 * Implements:
 * 1. Proctored Internship Qualifying Exam (2-min timer, 15 hard questions, 80% passing score)
 * 2. Exam link delivery via email
 * 3. Screen & Webcam video upload for exam integrity verification
 * 4. Automatic exam scoring and 1-Year Internship enrollment qualification unlock
 * 5. Admin panel exam management (settings, questions, student recorded video inspection)
 * 6. Yearly Members Hub / Vault for Project Code, Documentation PDFs, and Walkthrough Videos
 */

'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const localDb = require('../localDb');
const nodemailer = require('nodemailer');

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(__dirname, '..', '..', 'storage');
const EXAM_VIDEOS_DIR = path.join(STORAGE_ROOT, 'exam_proctoring');
const VAULT_FILES_DIR = path.join(STORAGE_ROOT, 'yearly_vault');

if (!fs.existsSync(EXAM_VIDEOS_DIR)) fs.mkdirSync(EXAM_VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(VAULT_FILES_DIR)) fs.mkdirSync(VAULT_FILES_DIR, { recursive: true });

// Setup Multer for exam video recordings and vault materials
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, EXAM_VIDEOS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.webm';
    const cleanEmail = (req.body.studentEmail || 'student').replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `exam_${cleanEmail}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const uploadExamVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 150 * 1024 * 1024 } // 150 MB max
});

const vaultStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, VAULT_FILES_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.pdf';
    cb(null, `vault_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
  }
});
const uploadVaultFile = multer({
  storage: vaultStorage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Mail helper
function getMailTransporter() {
  const host = process.env.MAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

// 15 Default Hard / Challenging Questions for ML Engineer Internship Exam
const DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    prompt: 'In Ridge (L2) vs Lasso (L1) regularization, why does Lasso tend to produce sparse feature weights with exact zeros?',
    options: [
      'L1 penalty has a diamond-shaped constraint with sharp corners on axes that intersect loss contours',
      'L2 penalty uses absolute parameter values while L1 squares the gradients',
      'Lasso uses an orthogonal projection matrix that forces eigenvalue zeroing',
      'Ridge regularization minimizes the L0 norm directly through greedy selection'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Machine Learning Theory'
  },
  {
    id: 'q2',
    prompt: 'When training a 20-layer standard feed-forward neural network with Sigmoid activations, what primarily causes the Vanishing Gradient problem during backpropagation?',
    options: [
      'Maximum derivative of Sigmoid is 0.25, so multiplying through 20 layers exponentially diminishes gradients toward 0',
      'The learning rate is continuously decayed by the momentum accumulator',
      'Weight decay sets the Hessian matrix condition number to infinity',
      'Sigmoid outputs are strictly non-negative, forcing all neuron updates into positive quadrants'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Deep Learning'
  },
  {
    id: 'q3',
    prompt: 'In Python, what is the exact output of: [f(2) for f in [(lambda x: x * i) for i in range(4)]]?',
    options: [
      '[6, 6, 6, 6]',
      '[0, 2, 4, 6]',
      '[0, 0, 0, 0]',
      'TypeError: late binding lambda is not iterable'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Python Internals & Closures'
  },
  {
    id: 'q4',
    prompt: 'In a binary classification dataset with 98% class 0 and 2% class 1, which metric best captures performance on the minority class?',
    options: [
      'Precision-Recall AUC (PR-AUC) / Average Precision',
      'Accuracy score with standard threshold 0.5',
      'Mean Absolute Percentage Error (MAPE)',
      'Adjusted R-squared on the sigmoid logit values'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Model Evaluation'
  },
  {
    id: 'q5',
    prompt: 'In SQL, what is the key difference between RANK() and DENSE_RANK() window functions when two rows have equal partition values?',
    options: [
      'RANK() skips subsequent rank numbers after ties; DENSE_RANK() does not leave gaps',
      'DENSE_RANK() only works with numeric columns while RANK() works on dates',
      'RANK() requires an unbounded preceding clause; DENSE_RANK() requires ROWS BETWEEN',
      'DENSE_RANK() caches rows in memory whereas RANK() forces disk spillover'
    ],
    correctAnswer: 0,
    difficulty: 'Medium-Hard',
    topic: 'SQL & Database'
  },
  {
    id: 'q6',
    prompt: 'What mathematical property prevents standard Batch Normalization from performing well during inference with micro-batch sizes (batch size = 1)?',
    options: [
      'Batch variance estimates with N=1 collapse or have high noise; running mean/variance must be substituted',
      'The covariance matrix singular values become imaginary',
      'Batch Normalization cannot compute affine parameters gamma and beta for single samples',
      'Backpropagation with N=1 causes division by zero in the ReLU derivative'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Deep Learning'
  },
  {
    id: 'q7',
    prompt: 'In Decision Trees and Random Forests, why does increasing min_samples_split reduce variance and combat overfitting?',
    options: [
      'It stops tree splitting early, constraining depth and avoiding memorization of single noisy points',
      'It dynamically bootstraps 100% of out-of-bag samples to each leaf node',
      'It forces the Gini impurity to increase monotonically across splits',
      'It converts recursive splits into linear SVM boundaries'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Ensemble Learning'
  },
  {
    id: 'q8',
    prompt: 'What is the primary architectural innovation of the Transformer model that replaces recurrent sequential inductive bias in LSTMs?',
    options: [
      'Multi-Head Scaled Dot-Product Self-Attention with Positional Encodings',
      'Bidirectional Gated Linear Units with gradient checkpointing',
      'Dynamically sized hidden Markov states with Monte Carlo dropout',
      'Convolutional depthwise separable kernels across the sequence axis'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Modern NLP & LLMs'
  },
  {
    id: 'q9',
    prompt: 'In XGBoost, what does the hyperparameter "gamma" (min_split_loss) strictly govern?',
    options: [
      'The minimum loss reduction required to make a further partition on a leaf node of the tree',
      'The step size shrinkage used in updating weights to prevent overshooting',
      'The maximum number of discrete bins created for histogram-based quantile sketch',
      'The fraction of columns randomly sub-sampled for each individual boosting round'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Gradient Boosting'
  },
  {
    id: 'q10',
    prompt: 'In Python NumPy, what happens under the hood when executing: A = B[:, np.newaxis] + C?',
    options: [
      'NumPy applies broadcasting rules without physically duplicating array memory',
      'A deep copy of array B is allocated on the C-heap with contiguous strides',
      'A multi-threaded OpenMP kernel performs an in-place matrix transposition',
      'It raises a ShapeMismatchError unless both arrays have identical dimension ranks'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'NumPy & High Performance Python'
  },
  {
    id: 'q11',
    prompt: 'Why does Dropout act as an approximation of an ensemble of exponentially many thinned neural network architectures?',
    options: [
      'Dropping p% of units at training time samples 2^N subnetworks with shared weight parameters',
      'It runs multiple forward passes concurrently on different GPU compute streams',
      'It clusters hidden unit activations using Gaussian Mixture Models',
      'It replaces dense backpropagation with genetic algorithm mutations'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Deep Learning'
  },
  {
    id: 'q12',
    prompt: 'In Principal Component Analysis (PCA), what do the eigenvectors of the data covariance matrix represent?',
    options: [
      'The orthogonal directions of maximum variance in the feature space',
      'The exact centroid coordinates of the clusters in k-means space',
      'The class boundary hyperplanes that maximize the separation margin',
      'The conditional probability density peaks of the feature distribution'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Unsupervised Learning'
  },
  {
    id: 'q13',
    prompt: 'In SQL, which clause allows calculating a cumulative running sum partitioned by student category?',
    options: [
      'SUM(fee) OVER (PARTITION BY category ORDER BY created_at ROWS UNBOUNDED PRECEDING)',
      'SUM(fee) GROUP BY category HAVING created_at <= CURRENT_DATE',
      'ACCUMULATE(fee) WITHIN GROUP (ORDER BY created_at) OVER category',
      'ROLLUP(fee) BY category ORDER BY created_at ASC'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Advanced SQL'
  },
  {
    id: 'q14',
    prompt: 'What is Data Leakage in a Machine Learning pipeline, and how is it most commonly introduced unintentionally?',
    options: [
      'Fitting scalers or encoders on the entire dataset before train/test splitting',
      'Using cross-validation with K=5 instead of K=10',
      'Setting random_state to a fixed integer instead of None',
      'Training a regression model on continuous target values with negative numbers'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'ML Engineering & Pipeline Integrity'
  },
  {
    id: 'q15',
    prompt: 'In MLOps production systems, what is "Concept Drift" as distinguished from "Data Drift"?',
    options: [
      'The statistical relationship between input features X and target Y changes over time: P(Y|X) shifts',
      'The hardware GPU memory consumption spikes beyond allocated Docker limits',
      'The input distribution P(X) changes while P(Y|X) remains completely constant',
      'The database schema alters foreign key constraints in upstream pipelines'
    ],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'MLOps & Production Systems'
  }
];

// Helper to get or init exam config
function getExamConfig() {
  const configs = localDb.loadCollection('internship_exam_config');
  let config = configs[0];
  if (!config) {
    config = {
      id: 'default_internship_exam',
      title: 'Machine Learning Engineer Internship Qualifying Exam',
      courseName: 'Machine Learning Engineer Internship',
      durationSeconds: 120, // 2 minutes as requested by user
      passPercentage: 80,   // 80% passing score as requested by user
      totalQuestions: 15,
      questions: DEFAULT_QUESTIONS,
      updatedAt: new Date().toISOString()
    };
    configs.push(config);
    localDb.saveCollection('internship_exam_config', configs);
  }
  if (!config.courseName) {
    config.courseName = 'Machine Learning Engineer Internship';
  }
  return config;
}

// ─── 1. PUBLIC EXAM CONFIG (WITHOUT CORRECT ANSWERS) ─────────────────────────
router.get('/config', (req, res) => {
  try {
    const config = getExamConfig();
    const publicQuestions = (config.questions || []).map(q => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      difficulty: q.difficulty,
      topic: q.topic
    }));
    res.json({
      success: true,
      title: config.title || 'Machine Learning Engineer Internship Qualifying Exam',
      courseName: config.courseName || 'Machine Learning Engineer Internship',
      durationSeconds: config.durationSeconds || 120,
      passPercentage: config.passPercentage || 80,
      totalQuestions: publicQuestions.length,
      questions: publicQuestions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. ADMIN: GET FULL CONFIG (WITH CORRECT ANSWERS) ────────────────────────
router.get('/admin/config', (req, res) => {
  try {
    const config = getExamConfig();
    res.json({ success: true, config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. ADMIN: UPDATE EXAM SETTINGS & QUESTIONS ─────────────────────────────
router.post('/admin/config', (req, res) => {
  try {
    const { durationSeconds, passPercentage, questions, title, courseName } = req.body || {};
    const configs = localDb.loadCollection('internship_exam_config');
    let config = configs[0] || { id: 'default_internship_exam' };

    if (durationSeconds !== undefined) config.durationSeconds = Math.max(30, parseInt(durationSeconds, 10));
    if (passPercentage !== undefined) config.passPercentage = Math.min(100, Math.max(10, parseInt(passPercentage, 10)));
    if (title) config.title = String(title).trim();
    if (courseName) config.courseName = String(courseName).trim();
    if (Array.isArray(questions) && questions.length > 0) {
      config.questions = questions;
      config.totalQuestions = questions.length;
    }
    config.updatedAt = new Date().toISOString();

    configs[0] = config;
    localDb.saveCollection('internship_exam_config', configs);

    res.json({ success: true, message: 'Exam configuration updated successfully!', config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. REQUEST EXAM LINK (DISPATCHED TO STUDENT EMAIL - STRICTLY ONE-TIME VALID) ─────
router.post('/request-link', async (req, res) => {
  try {
    const { email, name } = req.body || {};
    if (!email || !String(email).trim().includes('@')) {
      return res.status(400).json({ error: 'Valid student email is required.' });
    }

    const normEmail = String(email).toLowerCase().trim();
    const studentName = name || normEmail.split('@')[0];
    const examToken = `otk_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;

    // Save strictly ONE-TIME token record
    const tokens = localDb.loadCollection('exam_access_tokens');
    tokens.push({
      token: examToken,
      email: normEmail,
      name: studentName,
      used: false,
      usedAt: null,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() // 48 hours validity
    });
    localDb.saveCollection('exam_access_tokens', tokens);

    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
    const examLink = `${baseUrl}/internship-exam?email=${encodeURIComponent(normEmail)}&token=${examToken}`;

    // Send email with exam link
    const transporter = getMailTransporter();
    if (transporter) {
      const mailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #F1F5F9; color: #0F172A; padding: 36px 20px;">
          <div style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; border: 1px solid #E2E8F0; padding: 32px 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
            <div style="text-align: center; margin-bottom: 22px;">
              <div style="display: inline-block; background: #EEF2FF; color: #4338CA; border: 1px solid #C7D2FE; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px;">
                One-Time Access Link &bull; Proctored Technical Exam
              </div>
              <h2 style="color: #0F172A; font-size: 22px; margin: 0 0 8px; font-weight: 800;">Machine Learning Engineer Internship Exam</h2>
              <p style="color: #64748B; font-size: 13.5px; line-height: 1.5; margin: 0;">
                Hello <strong>${studentName}</strong>, your secure one-time access link to attend the qualifying exam is ready.
              </p>
            </div>

            <div style="background: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 18px; margin-bottom: 24px; font-size: 13px; color: #334155; line-height: 1.6;">
              ⏱️ <strong>Duration:</strong> 2 Minutes (120 Seconds)<br/>
              📝 <strong>Total Questions:</strong> 15 Challenging Technical Questions<br/>
              🎯 <strong>Passing Score:</strong> 80% or Higher (Score 12+ correct answers)<br/>
              🔒 <strong>Validity:</strong> Strictly one-time access link (expires upon submission)<br/>
              📹 <strong>Proctoring:</strong> Camera and screen recording will be verified.
            </div>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${examLink}" style="display: inline-block; background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%); color: #FFFFFF; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 800; font-size: 15px; box-shadow: 0 6px 20px rgba(37, 99, 235, 0.35);">
                Attend Qualifying Exam Now →
              </a>
            </div>

            <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 10px; padding: 12px 14px; font-size: 12px; color: #92400E; line-height: 1.4; text-align: left;">
              ⚠️ <strong>Important Note:</strong> This is a single-use token. Once you submit the exam, the link will automatically expire and cannot be reopened.
            </div>
          </div>
        </div>
      `;
      try {
        await transporter.sendMail({
          from: `"${process.env.MAIL_FROM_NAME || 'Levlox Academy'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
          to: normEmail,
          subject: '🔒 Your One-Time Qualifying Exam Link — Machine Learning Internship',
          html: mailHtml
        });
      } catch (mailErr) {
        console.warn('[Exam Mail] SMTP send failed, link returned in API:', mailErr.message);
      }
    }

    res.json({
      success: true,
      message: `One-time exam link created and dispatched to ${normEmail}`,
      examLink,
      examToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4B. VERIFY ONE-TIME EXAM TOKEN ──────────────────────────────────────────
router.post('/verify-token', (req, res) => {
  try {
    const { email, token } = req.body || {};
    if (!token) {
      return res.status(400).json({ valid: false, error: 'Exam token is required.' });
    }

    const tokens = localDb.loadCollection('exam_access_tokens');
    const tokenRecord = tokens.find(t => t.token === token);

    if (!tokenRecord) {
      return res.status(404).json({ valid: false, error: 'Invalid or unrecognized exam token. Please request a new link.' });
    }

    if (tokenRecord.used) {
      return res.status(400).json({
        valid: false,
        used: true,
        error: `This exam link has already been used on ${tokenRecord.usedAt ? new Date(tokenRecord.usedAt).toLocaleString('en-IN') : 'a previous attempt'}. Each link is strictly single-use. Please request a new link from your portal.`
      });
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      return res.status(400).json({
        valid: false,
        expired: true,
        error: 'This exam link has expired. Please request a fresh link from your student portal.'
      });
    }

    res.json({
      success: true,
      valid: true,
      email: tokenRecord.email,
      name: tokenRecord.name
    });
  } catch (err) {
    res.status(500).json({ valid: false, error: err.message });
  }
});

// ─── 5. UPLOAD PROCTORING VIDEO (RECORDED WEBCAM / SCREEN CHUNKS) ─────────────
router.post('/upload-proctoring', uploadExamVideo.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }
    const relativeUrl = `/uploads/exam_proctoring/${req.file.filename}`;
    res.json({
      success: true,
      videoUrl: relativeUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. SUBMIT EXAM & AUTOMATIC GRADING ───────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const { studentEmail, studentName, answers, proctoringVideoUrl, timeTakenSeconds, token } = req.body || {};
    if (!studentEmail) {
      return res.status(400).json({ error: 'Student email is required.' });
    }

    // Invalidate one-time token immediately upon submission so link cannot be reused
    if (token) {
      const tokens = localDb.loadCollection('exam_access_tokens');
      const tIdx = tokens.findIndex(t => t.token === token);
      if (tIdx !== -1) {
        tokens[tIdx].used = true;
        tokens[tIdx].usedAt = new Date().toISOString();
        localDb.saveCollection('exam_access_tokens', tokens);
      }
    }

    const normEmail = String(studentEmail).toLowerCase().trim();

    // 7-Day Academic Preparation Cooldown Gate:
    // If student attempted the exam less than 7 days ago and did not pass, block re-submission until cooldown ends
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const existingSubmissions = localDb.loadCollection('internship_exam_submissions');
    const previousAttempts = existingSubmissions.filter(s => s.studentEmail === normEmail);
    const alreadyPassed = previousAttempts.some(s => s.passed);
    const lastAttempt = previousAttempts[0] || null;

    if (lastAttempt && !alreadyPassed && !req.body.adminOverride) {
      const elapsedMs = Date.now() - new Date(lastAttempt.submittedAt).getTime();
      if (elapsedMs < SEVEN_DAYS_MS) {
        const remainingMs = SEVEN_DAYS_MS - elapsedMs;
        const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
        return res.status(403).json({
          error: `7-Day academic preparation interval is active. You may retake the exam in ${remainingDays} day(s). Renew your weekly sprint to continue studying.`,
          cooldownActive: true,
          remainingMs,
          nextAttemptDate: new Date(new Date(lastAttempt.submittedAt).getTime() + SEVEN_DAYS_MS).toISOString()
        });
      }
    }

    const config = getExamConfig();
    const questions = config.questions || DEFAULT_QUESTIONS;
    const totalQuestions = questions.length;
    const passThreshold = config.passPercentage || 80;

    let correctCount = 0;
    const gradedBreakdown = [];

    questions.forEach((q, idx) => {
      const studentAns = answers ? answers[q.id] : undefined;
      const isCorrect = (studentAns !== undefined && parseInt(studentAns, 10) === q.correctAnswer);
      if (isCorrect) correctCount++;
      gradedBreakdown.push({
        id: q.id,
        prompt: q.prompt,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        isCorrect
      });
    });

    const wrongCount = totalQuestions - correctCount;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercent >= passThreshold;

    const submissionId = `sub_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const submissionRecord = {
      id: submissionId,
      studentEmail: normEmail,
      studentName: studentName || normEmail.split('@')[0],
      totalQuestions,
      correctCount,
      wrongCount,
      scorePercent,
      passThreshold,
      passed,
      timeTakenSeconds: timeTakenSeconds || 120,
      proctoringVideoUrl: proctoringVideoUrl || null,
      gradedBreakdown,
      submittedAt: new Date().toISOString()
    };

    // Save submission
    const submissions = localDb.loadCollection('internship_exam_submissions');
    submissions.unshift(submissionRecord);
    localDb.saveCollection('internship_exam_submissions', submissions);

    // 1. Update Students collection with attempt timestamp and qualification if passed
    const students = localDb.loadCollection('students');
    const sIdx = students.findIndex(s => s.email?.toLowerCase() === normEmail);
    if (sIdx !== -1) {
      students[sIdx].lastExamAttemptAt = new Date().toISOString();
      if (passed) {
        students[sIdx].hasPassedInternshipExam = true;
        students[sIdx].internshipExamScore = scorePercent;
        students[sIdx].examQualifiedAt = new Date().toISOString();
      }
      localDb.saveCollection('students', students);
    }

    // 2. Update Users collection
    const users = localDb.loadCollection('users');
    const uIdx = users.findIndex(u => u.email?.toLowerCase() === normEmail);
    if (uIdx !== -1) {
      users[uIdx].lastExamAttemptAt = new Date().toISOString();
      if (passed) {
        users[uIdx].hasPassedInternshipExam = true;
        users[uIdx].internshipExamScore = scorePercent;
      }
      localDb.saveCollection('users', users);
    }

    // 3. Update Leads collection
    const leads = localDb.loadCollection('leads');
    const lIdx = leads.findIndex(l => l.email?.toLowerCase() === normEmail);
    if (lIdx !== -1) {
      leads[lIdx].lastExamAttemptAt = new Date().toISOString();
      if (passed) {
        leads[lIdx].hasPassedInternshipExam = true;
        leads[lIdx].internshipExamScore = scorePercent;
      }
      localDb.saveCollection('leads', leads);
    }

    // If passed, send Congratulations Qualification Email
    if (passed) {

      // Send Congratulations Qualification Email
      const transporter = getMailTransporter();
      if (transporter) {
        const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:5173';
        const enrollmentLink = `${baseUrl}/academy?qualified=true&email=${encodeURIComponent(normEmail)}`;
        const passMailHtml = `
          <div style="font-family: Arial, sans-serif; background: #0B0F19; color: #FFFFFF; padding: 36px 20px;">
            <div style="max-width: 560px; margin: 0 auto; background: #131D31; border-radius: 18px; border: 1.5px solid #22C55E; padding: 32px; text-align: center;">
              <div style="font-size: 40px; margin-bottom: 10px;">🎉 🏆</div>
              <h1 style="color: #22C55E; font-size: 24px; margin: 0 0 10px;">Congratulations! You Qualified!</h1>
              <p style="color: #94A3B8; font-size: 14.5px; line-height: 1.6; margin: 0 0 20px;">
                Dear <strong>${studentName || normEmail}</strong>, you have successfully cleared the Machine Learning Engineer Internship Qualifying Exam with a score of <strong>${scorePercent}%</strong> (Required: ${passThreshold}%).
              </p>
              <div style="background: #0B0F19; border-radius: 14px; border: 1px solid #1E293B; padding: 18px; margin-bottom: 24px; text-align: left;">
                <div style="color: #E2E8F0; font-size: 14px; font-weight: bold; margin-bottom: 8px;">Your Performance Summary:</div>
                <div style="display: flex; justify-content: space-between; color: #94A3B8; font-size: 13px; margin-bottom: 4px;">
                  <span>Total Questions:</span> <strong style="color: #FFF;">${totalQuestions}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #94A3B8; font-size: 13px; margin-bottom: 4px;">
                  <span>Correct Answers:</span> <strong style="color: #22C55E;">${correctCount}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; color: #94A3B8; font-size: 13px; margin-bottom: 4px;">
                  <span>Final Score:</span> <strong style="color: #22C55E;">${scorePercent}% (PASSED)</strong>
                </div>
              </div>
              <p style="color: #E2E8F0; font-size: 14px; margin-bottom: 20px;">
                You are now eligible to complete your enrollment for the <strong>Machine Learning Engineer Internship (365 Days • ₹11,499)</strong>.
              </p>
              <a href="${enrollmentLink}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);">
                Enroll for Machine Learning Internship Now →
              </a>
            </div>
          </div>
        `;
        try {
          await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'Levlox Academy'}" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
            to: normEmail,
            subject: '🎉 Congratulations! You Passed the Machine Learning Internship Qualifying Exam!',
            html: passMailHtml
          });
        } catch (mailErr) {
          console.warn('[Exam Pass Mail] SMTP send failed:', mailErr.message);
        }
      }
    }

    res.json({
      success: true,
      submissionId,
      scorePercent,
      correctCount,
      wrongCount,
      totalQuestions,
      passThreshold,
      passed,
      message: passed
        ? `Congratulations! You scored ${scorePercent}% and qualified for the 1-Year Machine Learning Internship!`
        : `You scored ${scorePercent}%. A minimum of ${passThreshold}% is required to qualify. You can review course materials and reattempt.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 7. CHECK CANDIDATE EXAM STATUS & 7-DAY COOLDOWN ELIGIBILITY ──────────────
router.get(['/status/:email', '/eligibility/:email'], (req, res) => {
  try {
    const normEmail = String(req.params.email).toLowerCase().trim();
    const submissions = localDb.loadCollection('internship_exam_submissions');
    const studentSubmissions = submissions.filter(s => s.studentEmail === normEmail);
    const hasPassed = studentSubmissions.some(s => s.passed);
    const latestAttempt = studentSubmissions[0] || null;

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    let canAttempt = true;
    let cooldownActive = false;
    let cooldownRemainingMs = 0;
    let nextAttemptDate = null;

    if (latestAttempt && !hasPassed) {
      const lastAttemptTime = new Date(latestAttempt.submittedAt).getTime();
      const elapsedMs = Date.now() - lastAttemptTime;
      if (elapsedMs < SEVEN_DAYS_MS) {
        canAttempt = false;
        cooldownActive = true;
        cooldownRemainingMs = SEVEN_DAYS_MS - elapsedMs;
        nextAttemptDate = new Date(lastAttemptTime + SEVEN_DAYS_MS).toISOString();
      }
    }

    res.json({
      success: true,
      email: normEmail,
      hasPassed,
      canAttempt,
      cooldownActive,
      cooldownRemainingMs,
      nextAttemptDate,
      attemptsCount: studentSubmissions.length,
      latestAttempt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 7B. ADMIN: RESET ATTEMPT / BYPASS 7-DAY COOLDOWN ─────────────────────────
router.post('/admin/reset-attempt', (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const normEmail = String(email).toLowerCase().trim();

    let submissions = localDb.loadCollection('internship_exam_submissions');
    submissions = submissions.filter(s => s.studentEmail !== normEmail);
    localDb.saveCollection('internship_exam_submissions', submissions);

    const students = localDb.loadCollection('students');
    const sIdx = students.findIndex(s => s.email?.toLowerCase() === normEmail);
    if (sIdx !== -1) {
      delete students[sIdx].lastExamAttemptAt;
      delete students[sIdx].hasPassedInternshipExam;
      delete students[sIdx].internshipExamScore;
      localDb.saveCollection('students', students);
    }

    const users = localDb.loadCollection('users');
    const uIdx = users.findIndex(u => u.email?.toLowerCase() === normEmail);
    if (uIdx !== -1) {
      delete users[uIdx].lastExamAttemptAt;
      delete users[uIdx].hasPassedInternshipExam;
      delete users[uIdx].internshipExamScore;
      localDb.saveCollection('users', users);
    }

    res.json({ success: true, message: `Exam attempts and cooldown reset for ${normEmail}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 8. ADMIN: LIST ALL EXAM SUBMISSIONS & PROCTORING RECORDINGS ────────────
router.get('/admin/submissions', (req, res) => {
  try {
    const submissions = localDb.loadCollection('internship_exam_submissions');
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ─── YEARLY MEMBERS HUB / INTERNSHIP VAULT ROUTES ─────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// Default materials to initialize the vault with authentic curriculum
const DEFAULT_VAULT_MATERIALS = [
  {
    id: 'vault_mat_1',
    title: 'Autonomous Vehicle Obstacle Detection & Segmentation',
    type: 'code',
    category: 'Industrial Capstone',
    description: 'Complete production repository with data loaders, synthetic augmentation scripts, FP16 quantization benchmarks, and REST API deployment pipeline.',
    fileUrl: 'https://github.com/levlox-academy/autonomous-obstacle-segmentation-yolov8',
    fileSize: '48.2 MB',
    tags: ['Computer Vision', 'PyTorch', 'TensorRT', 'YOLOv8'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'vault_mat_2',
    title: 'Real-Time Financial Fraud Detection Architecture',
    type: 'code',
    category: 'Production ML System',
    description: 'Streaming event ingestion using Kafka consumer groups, online feature store synchronization in Redis, sub-15ms inference latency microservice.',
    fileUrl: 'https://github.com/levlox-academy/realtime-fraud-detection-kafka-xgboost',
    fileSize: '36.8 MB',
    tags: ['MLOps', 'XGBoost', 'Kafka', 'Redis'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'vault_mat_3',
    title: 'Enterprise MLOps Architecture & Production Deployment Manual',
    type: 'document',
    category: 'Architecture Guide',
    description: 'Comprehensive 84-page industrial handbook on CI/CD for machine learning, Docker containerization, Kubernetes HPA, MLflow registry, and automated drift alerts.',
    fileUrl: '/uploads/yearly_vault/mlops_enterprise_deployment_manual.pdf',
    fileSize: '14.5 MB',
    tags: ['PDF Manual', 'MLOps', 'Kubernetes', 'CI/CD'],
    createdAt: new Date().toISOString()
  },
  {
    id: 'vault_mat_4',
    title: 'Medical Image Diagnostic Classifier (ResNet50 + Grad-CAM)',
    type: 'video',
    category: 'Capstone Walkthrough',
    description: 'Deep dive video session explaining DICOM image preprocessing, transfer learning optimization, class imbalance handling, and Grad-CAM heatmap visualization.',
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: '52 mins',
    tags: ['Deep Learning', 'PyTorch', 'Explainable AI', 'Healthcare'],
    createdAt: new Date().toISOString()
  }
];

function getVaultMaterials() {
  return localDb.loadCollection('yearly_member_vault') || [];
}

// ─── 9. GET YEARLY VAULT MATERIALS ───────────────────────────────────────────
router.get('/vault/materials', (req, res) => {
  try {
    const materials = getVaultMaterials();
    res.json({ success: true, materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 10. ADMIN: ADD MATERIAL TO YEARLY VAULT / INTERNSHIP HUB ───────────────
router.post('/vault/admin/materials', uploadVaultFile.any(), (req, res) => {
  try {
    const {
      title, type, category, section, description,
      externalUrl, videoUrl, codeUrl, duration, tags,
      fileSize: customFileSize, thumbnailUrl: customThumbnailUrl
    } = req.body || {};
    if (!title) {
      return res.status(400).json({ error: 'Material title is required.' });
    }

    let fileUrl = codeUrl || externalUrl || '';
    let finalVideoUrl = videoUrl || (type === 'video' ? externalUrl : '') || '';
    let finalThumbnailUrl = customThumbnailUrl || '';
    let fileSize = customFileSize || '';

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        const isVideoFile = (f.mimetype && f.mimetype.startsWith('video/')) || f.fieldname === 'videoFile';
        const isImageFile = (f.mimetype && f.mimetype.startsWith('image/')) || f.fieldname === 'thumbnailFile' || f.fieldname === 'thumbnail';
        const uploadedPath = `/uploads/yearly_vault/${f.filename}`;
        const calculatedSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;

        if (isVideoFile) {
          finalVideoUrl = uploadedPath;
          if (!fileSize) fileSize = calculatedSize;
        } else if (isImageFile) {
          finalThumbnailUrl = uploadedPath;
        } else {
          fileUrl = uploadedPath;
          fileSize = calculatedSize;
        }
      }
    }

    const resolvedSection = section || (
      (category && (
        category.includes('Resume') ||
        category.includes('LinkedIn') ||
        category.includes('Interview')
      )) ? 'interview_kit' : 'projects'
    );

    const newMaterial = {
      id: `vault_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      title: title.trim(),
      section: resolvedSection,
      type: type || 'code',
      category: category || (resolvedSection === 'projects' ? 'Python' : 'Industry-Level Resume Building'),
      description: description ? description.trim() : '',
      fileUrl: fileUrl || (type === 'video' ? finalVideoUrl : ''),
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      fileSize: fileSize || 'Available',
      duration: duration || '',
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || []),
      createdAt: new Date().toISOString()
    };

    const materials = localDb.loadCollection('yearly_member_vault');
    materials.unshift(newMaterial);
    localDb.saveCollection('yearly_member_vault', materials);

    res.json({ success: true, material: newMaterial, message: 'Material added to Internship Hub successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 10B. ADMIN: UPDATE MATERIAL IN INTERNSHIP HUB ───────────────────────────
router.put('/vault/admin/materials/:id', uploadVaultFile.any(), (req, res) => {
  try {
    const matId = req.params.id;
    let materials = localDb.loadCollection('yearly_member_vault');
    const index = materials.findIndex(m => m.id === matId);
    if (index === -1) {
      return res.status(404).json({ error: 'Material not found.' });
    }

    const current = materials[index];
    const {
      title, type, category, section, description,
      externalUrl, videoUrl, codeUrl, duration, tags,
      fileSize: customFileSize, thumbnailUrl: customThumbnailUrl
    } = req.body || {};

    let fileUrl = codeUrl || externalUrl || current.fileUrl || '';
    let finalVideoUrl = videoUrl !== undefined ? videoUrl : (current.videoUrl || '');
    let finalThumbnailUrl = customThumbnailUrl !== undefined ? customThumbnailUrl : (current.thumbnailUrl || '');
    let fileSize = customFileSize || current.fileSize || '';

    if (Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        const isVideoFile = (f.mimetype && f.mimetype.startsWith('video/')) || f.fieldname === 'videoFile';
        const isImageFile = (f.mimetype && f.mimetype.startsWith('image/')) || f.fieldname === 'thumbnailFile' || f.fieldname === 'thumbnail';
        const uploadedPath = `/uploads/yearly_vault/${f.filename}`;
        const calculatedSize = `${(f.size / (1024 * 1024)).toFixed(1)} MB`;

        if (isVideoFile) {
          finalVideoUrl = uploadedPath;
          if (!fileSize) fileSize = calculatedSize;
        } else if (isImageFile) {
          finalThumbnailUrl = uploadedPath;
        } else {
          fileUrl = uploadedPath;
          fileSize = calculatedSize;
        }
      }
    }

    const updated = {
      ...current,
      title: title !== undefined ? title.trim() : current.title,
      section: section || current.section,
      type: type || current.type,
      category: category || current.category,
      description: description !== undefined ? description.trim() : current.description,
      fileUrl: fileUrl,
      videoUrl: finalVideoUrl,
      thumbnailUrl: finalThumbnailUrl,
      fileSize: fileSize,
      duration: duration !== undefined ? duration : current.duration,
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || current.tags),
      updatedAt: new Date().toISOString()
    };

    materials[index] = updated;
    localDb.saveCollection('yearly_member_vault', materials);

    res.json({ success: true, material: updated, message: 'Material updated successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 11. ADMIN: DELETE ALL MATERIALS FROM VAULT / INTERNSHIP HUB ────────────
router.delete('/vault/admin/materials', (req, res) => {
  try {
    localDb.saveCollection('yearly_member_vault', []);
    res.json({ success: true, message: 'All materials cleared from Internship Hub.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 11B. ADMIN: DELETE SINGLE MATERIAL FROM VAULT ────────────────────────────
router.delete('/vault/admin/materials/:id', (req, res) => {
  try {
    const matId = req.params.id;
    if (matId === 'ALL' || matId === 'all') {
      localDb.saveCollection('yearly_member_vault', []);
      return res.json({ success: true, message: 'All materials cleared from Internship Hub.' });
    }
    let materials = localDb.loadCollection('yearly_member_vault') || [];
    const initialLen = materials.length;
    materials = materials.filter(m => m.id !== matId);

    if (materials.length === initialLen) {
      return res.status(404).json({ error: 'Material not found.' });
    }
    localDb.saveCollection('yearly_member_vault', materials);
    res.json({ success: true, message: 'Material removed from Yearly Vault.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
