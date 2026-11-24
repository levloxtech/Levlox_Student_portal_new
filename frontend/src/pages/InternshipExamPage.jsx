import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, CheckCircle2, AlertTriangle, Clock, Camera, Monitor,
  Sparkles, Award, ArrowRight, ArrowLeft, RefreshCw, X, Play,
  Check, HelpCircle, FileText, Lock, ChevronRight, Mail, Video, Laptop
} from 'lucide-react';
import leveloxLogo from '../assets/levelox-icon-transparent.png';

export default function InternshipExamPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  const localStoredUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || localStorage.getItem('student_profile') || '{}');
    } catch { return {}; }
  })();

  const student = userProfile || currentUser || localStoredUser || {};
  const queryEmail = searchParams.get('email') || '';
  const queryToken = searchParams.get('token') || '';

  const effectiveEmail = (
    queryEmail ||
    student.email ||
    currentUser?.email ||
    userProfile?.email ||
    localStoredUser?.email ||
    ''
  ).toLowerCase().trim();
  const effectiveName = student.name || student.displayName || localStoredUser.name || effectiveEmail.split('@')[0] || 'Candidate';

  // Exam Configuration State
  const [examConfig, setExamConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Token Validation State (Strict Single-Use Link)
  const [tokenChecking, setTokenChecking] = useState(Boolean(queryToken));
  const [tokenError, setTokenError] = useState('');

  // Proctoring Stream & Hardware Setup
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [setupError, setSetupError] = useState('');

  const webcamVideoRef = useRef(null);
  const pipWebcamRef = useRef(null);
  const screenPreviewRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Exam Running State
  const [examState, setExamState] = useState('setup'); // 'setup' | 'running' | 'submitting' | 'result'
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionIndex }
  const selectedAnswersRef = useRef(selectedAnswers);
  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  const [timeLeft, setTimeLeft] = useState(120); // 120 seconds default (2 mins)
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const timerIntervalRef = useRef(null);

  // Submission & Results State
  const [submissionResult, setSubmissionResult] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Eligibility & 7-Day Cooldown State
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityChecking, setEligibilityChecking] = useState(true);

  // Check student eligibility & 7-day cooldown
  useEffect(() => {
    if (authLoading && !effectiveEmail) return;
    if (!effectiveEmail) {
      setEligibilityChecking(false);
      return;
    }
    setEligibilityChecking(true);
    fetch(`/api/internship-exam/eligibility/${encodeURIComponent(effectiveEmail)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEligibilityData(data);
        }
      })
      .catch(err => {
        console.warn('Could not check eligibility:', err);
      })
      .finally(() => setEligibilityChecking(false));
  }, [effectiveEmail, authLoading]);

  // 1. Verify One-Time Token (if present)
  useEffect(() => {
    if (!queryToken) {
      setTokenChecking(false);
      return;
    }

    fetch('/api/internship-exam/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: effectiveEmail, token: queryToken })
    })
      .then(res => res.json())
      .then(data => {
        if (!data.valid) {
          setTokenError(data.error || 'This one-time exam link is invalid or has already been used.');
        }
      })
      .catch(err => {
        setTokenError('Could not verify exam token. Please try again.');
      })
      .finally(() => setTokenChecking(false));
  }, [queryToken, effectiveEmail]);

  // 2. Load Exam Config from Backend
  useEffect(() => {
    fetch('/api/internship-exam/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setExamConfig(data);
          setTimeLeft(data.durationSeconds || 120);
        }
      })
      .catch(err => {
        console.error('Failed to load exam config:', err);
      })
      .finally(() => setLoadingConfig(false));
  }, []);

  // Sync webcam stream to video element
  useEffect(() => {
    if (webcamVideoRef.current && cameraStream) {
      webcamVideoRef.current.srcObject = cameraStream;
    }
    if (pipWebcamRef.current && cameraStream) {
      pipWebcamRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, examState]);

  // Sync screen stream to video element
  useEffect(() => {
    if (screenPreviewRef.current && screenStream) {
      screenPreviewRef.current.srcObject = screenStream;
    }
  }, [screenStream, examState]);

  // Enable Camera
  const handleEnableCamera = async () => {
    setSetupError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      setSetupError('Camera/Microphone access was denied. Please allow permissions in your browser bar.');
    }
  };

  // Enable Screen Share
  const handleEnableScreen = async () => {
    setSetupError('');
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false
      });
      setScreenStream(stream);
      setScreenActive(true);

      stream.getVideoTracks()[0].onended = () => {
        setScreenActive(false);
        setScreenStream(null);
      };
    } catch (err) {
      setSetupError('Screen sharing was cancelled or denied. Entire screen share is recommended for proctoring.');
    }
  };

  // Start Exam & Begin Recording
  const handleStartExam = () => {
    if (eligibilityData?.cooldownActive) {
      setSetupError('A 7-day academic cooling interval is active. You must wait before retaking the qualifying challenge.');
      return;
    }
    if (!cameraActive) {
      setSetupError('Please enable your camera before starting the proctored exam.');
      return;
    }

    setSetupError('');
    setExamState('running');

    // Start MediaRecorder on active stream
    try {
      recordedChunksRef.current = [];
      const recordStream = screenStream || cameraStream;
      if (recordStream && typeof MediaRecorder !== 'undefined') {
        const recorder = new MediaRecorder(recordStream, { mimeType: 'video/webm' });
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      }
    } catch (recErr) {
      console.warn('MediaRecorder init failed, continuing without recording:', recErr);
    }

    // Start 2-Minute Timer
    const duration = examConfig?.durationSeconds || 120;
    setTimeLeft(duration);

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto Submit when Timer hits 0
  const handleAutoSubmit = () => {
    handleSubmitExam(true);
  };

  // Retake Exam Action
  const handleRetakeExam = () => {
    setSelectedAnswers({});
    selectedAnswersRef.current = {};
    setCurrentQIndex(0);
    setTimeLeft(examConfig?.durationSeconds || 120);
    timeLeftRef.current = examConfig?.durationSeconds || 120;
    setSubmissionResult(null);
    setExamState('setup');
    setCameraActive(false);
    setScreenActive(false);
    setSetupError('');
  };

  // Select Option
  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers(prev => {
      const updated = {
        ...prev,
        [qId]: optionIdx
      };
      selectedAnswersRef.current = updated;
      return updated;
    });
  };

  // Submit Exam
  const handleSubmitExam = async (isAuto = false) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setExamState('submitting');
    setUploadingVideo(true);

    let uploadedVideoUrl = null;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        await new Promise(resolve => {
          mediaRecorderRef.current.onstop = resolve;
          mediaRecorderRef.current.stop();
        });
      }

      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const formData = new FormData();
        formData.append('video', blob, `exam_${effectiveEmail || 'student'}.webm`);
        formData.append('studentEmail', effectiveEmail);

        const uploadRes = await fetch('/api/internship-exam/upload-proctoring', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          uploadedVideoUrl = uploadData.videoUrl;
        }
      }
    } catch (e) {
      console.warn('Video upload error:', e);
    } finally {
      setUploadingVideo(false);
    }

    if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    if (screenStream) screenStream.getTracks().forEach(t => t.stop());

    const finalAnswers = selectedAnswersRef.current || selectedAnswers;
    const finalTimeLeft = typeof timeLeftRef.current === 'number' ? timeLeftRef.current : timeLeft;
    const totalDuration = examConfig?.durationSeconds || 120;
    const timeTaken = Math.max(1, totalDuration - finalTimeLeft);

    try {
      const submitRes = await fetch('/api/internship-exam/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentEmail: effectiveEmail || 'student@levlox.com',
          studentName: effectiveName,
          token: queryToken,
          answers: finalAnswers,
          proctoringVideoUrl: uploadedVideoUrl,
          timeTakenSeconds: timeTaken
        })
      });
      const submitData = await submitRes.json();
      setSubmissionResult(submitData);
      setExamState('result');
    } catch (err) {
      alert('Error submitting exam: ' + err.message);
      setExamState('running');
    }
  };

  const questions = examConfig?.questions || [];
  const totalQCount = questions.length || 15;
  const passThreshold = examConfig?.passPercentage || 80;
  const durationSecs = examConfig?.durationSeconds || 120;

  // Format Duration dynamically (e.g. 120s -> "2 Minutes", 180s -> "3 Minutes", 90s -> "1m 30s")
  const formatDurationDisplay = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0 && secs === 0) {
      return `${mins} Minute${mins > 1 ? 's' : ''}`;
    }
    if (mins > 0 && secs > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${totalSecs} Seconds`;
  };

  const durationDisplay = formatDurationDisplay(durationSecs);
  const durationPill = `${durationSecs}s Limit`;
  const minPassCount = Math.ceil((passThreshold / 100) * totalQCount);

  const currentQ = questions[currentQIndex] || null;
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC',
      backgroundImage: 'radial-gradient(at 50% 0%, rgba(99, 102, 241, 0.06) 0px, transparent 60%), radial-gradient(at 100% 100%, rgba(37, 99, 235, 0.04) 0px, transparent 50%)',
      color: '#0F172A',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* Top Navbar */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src={leveloxLogo} alt="Levlox" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
              LEVLOX <span style={{ color: '#2563EB', fontWeight: 700 }}>ACADEMY</span>
            </span>
          </Link>
          <div style={{ height: 18, width: 1, background: '#CBD5E1', margin: '0 4px' }} />
          <div style={{
            background: '#EEF2FF',
            color: '#4338CA',
            border: '1px solid #C7D2FE',
            padding: '4px 11px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.4px',
            textTransform: 'uppercase'
          }}>
            Internship Qualifying Exam
          </div>
        </div>

        {/* Candidate Info Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{effectiveName}</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{effectiveEmail || 'Candidate'}</div>
          </div>
          {examState === 'running' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 12px',
              borderRadius: 999,
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              color: '#059669',
              fontSize: 11.5,
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} className="animate-pulse" />
              Proctored Live
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '36px 20px' }}>

        {/* ─── STATE 0: TOKEN CHECKING OR ELIGIBILITY CHECKING ─── */}
        {tokenChecking || eligibilityChecking ? (
          <div style={{
            maxWidth: 480,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            padding: '42px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.08)'
          }}>
            <RefreshCw size={38} color="#2563EB" className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 19, color: '#0F172A', fontWeight: 850, margin: '0 0 6px' }}>
              Checking Exam Eligibility...
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: 0 }}>
              Retrieving your assessment history and cooldown status.
            </p>
          </div>
        ) : eligibilityData?.hasPassed ? (
          /* ─── ALREADY QUALIFIED CARD ─── */
          <div style={{
            maxWidth: 600,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #A7F3D0',
            padding: '40px 36px',
            textAlign: 'center',
            boxShadow: '0 25px 70px -15px rgba(16, 185, 129, 0.15)'
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 16px 36px -6px rgba(16, 185, 129, 0.4)', marginBottom: 18
            }}>
              <Award size={38} strokeWidth={2.2} />
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ECFDF5', border: '1px solid #A7F3D0',
              padding: '4px 12px', borderRadius: 999, color: '#059669',
              fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', marginBottom: 14
            }}>
              ✓ Official Qualification Recorded
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
              You Have Already Qualified!
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: '0 0 24px', lineHeight: 1.55 }}>
              You previously passed the Qualifying Exam with a score of <strong style={{ color: '#059669' }}>{eligibilityData.latestAttempt?.scorePercent || 100}%</strong> and unlocked the 1-Year {examConfig?.courseName || 'Machine Learning Engineer Internship'} for ₹9,999.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/academy?plan=annual&qualified=true')}
                style={{
                  width: '100%',
                  padding: '14px 22px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 850,
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <Award size={18} /> Activate 1-Year Pass • Pay ₹9,999 Now →
              </button>
              <button
                type="button"
                onClick={() => navigate('/student')}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: '6px 0' }}
              >
                Return to Student Dashboard
              </button>
            </div>
          </div>
        ) : eligibilityData?.cooldownActive ? (
          /* ─── 7-DAY ACADEMIC COOLDOWN SCREEN ─── */
          <div style={{
            maxWidth: 640,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1.5px solid #E2E8F0',
            padding: '40px 36px',
            textAlign: 'center',
            boxShadow: '0 25px 70px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.7)'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              borderRadius: 999,
              padding: '5px 14px',
              color: '#B45309',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              marginBottom: 18
            }}>
              <Clock size={14} color="#D97706" /> 7-Day Academic Preparation Interval Active
            </div>

            <div style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 36px -6px rgba(217, 119, 6, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.3) inset',
              marginBottom: 16
            }}>
              <Clock size={36} strokeWidth={2.4} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.4px' }}>
              Next Exam Unlocks in {Math.floor((eligibilityData.cooldownRemainingMs || 0) / (24 * 60 * 60 * 1000))} Days {Math.floor(((eligibilityData.cooldownRemainingMs || 0) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))} Hours
            </h2>

            <p style={{ fontSize: 14, color: '#64748B', margin: '0 auto 24px', maxWidth: 500, lineHeight: 1.55 }}>
              To maintain academic integrity, candidates have a mandatory <strong>1-week study interval</strong> between qualifying exam attempts. Use this period to sharpen your machine learning and Python skills.
            </p>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '16px 20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              marginBottom: 24
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, marginBottom: 2 }}>Last Score</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#D97706' }}>
                  {eligibilityData.latestAttempt?.scorePercent ?? 0}%
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Required: {passThreshold}%</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, marginBottom: 2 }}>Attempted On</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                  {eligibilityData.latestAttempt?.submittedAt ? new Date(eligibilityData.latestAttempt.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Recorded</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, marginBottom: 2 }}>Retake Date</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#2563EB', marginTop: 4 }}>
                  {eligibilityData.nextAttemptDate ? new Date(eligibilityData.nextAttemptDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'In 7 days'}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Automatic Unlock</div>
              </div>
            </div>

            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 12,
              padding: '14px 18px',
              fontSize: 13,
              color: '#1E40AF',
              textAlign: 'left',
              lineHeight: 1.55,
              marginBottom: 24
            }}>
              💡 <strong>Next Steps:</strong> Renew your Weekly Learning Sprint (₹299/week) to unlock full course lectures, recorded classes, and code sandboxes to study thoroughly before your retake.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={() => navigate('/student')}
                style={{
                  width: '100%',
                  padding: '14px 22px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  fontWeight: 850,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Sparkles size={16} /> Renew Weekly Sprint (₹299) &amp; Continue Learning →
              </button>

              <button
                type="button"
                onClick={() => navigate('/student')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 0'
                }}
              >
                Return to Student Dashboard
              </button>
            </div>
          </div>
        ) : tokenError ? (
          <div style={{
            maxWidth: 520,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #FECDD3',
            padding: '38px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 45px -10px rgba(225, 29, 72, 0.08)'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#FFF1F2', color: '#E11D48',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #FECDD3', marginBottom: 18
            }}>
              <Lock size={28} />
            </div>

            <h2 style={{ fontSize: 21, fontWeight: 900, color: '#0F172A', margin: '0 0 8px' }}>
              One-Time Exam Link Already Used
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 24px', lineHeight: 1.55 }}>
              {tokenError}
            </p>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '14px 18px',
              fontSize: 12.5,
              color: '#475569',
              textAlign: 'left',
              marginBottom: 24,
              lineHeight: 1.55
            }}>
              🔒 <strong>Single-Use Policy:</strong> To protect exam integrity, each assessment link can only be used once. Please visit your student portal to request a new link if eligible.
            </div>

            <button
              type="button"
              onClick={() => navigate('/student')}
              style={{
                width: '100%',
                padding: '13px 20px',
                borderRadius: 12,
                background: '#2563EB',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
              }}
            >
              Go to Student Dashboard →
            </button>
          </div>
        ) : examState === 'setup' ? (
          /* ─── STATE 1: DESIGNER-GRADE SYSTEM & HARDWARE PROCTORING SETUP ─── */
          <div style={{
            maxWidth: 780,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            padding: '36px 36px 32px',
            boxShadow: '0 25px 70px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.7)'
          }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                border: '1px solid #C7D2FE',
                borderRadius: 999,
                padding: '5px 14px',
                color: '#4338CA',
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                marginBottom: 16,
                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.08)'
              }}>
                <Sparkles size={14} color="#4F46E5" /> Official Qualifying Challenge
              </div>

              {/* Ultra-Premium 3D Layered Frosted Icon Badge */}
              <div style={{
                width: 76,
                height: 76,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 45%, #8B5CF6 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.5), 0 0 0 1.5px rgba(255, 255, 255, 0.4) inset, 0 1px 3px rgba(0, 0, 0, 0.12)',
                margin: '0 auto 18px',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: 28,
                  border: '1.5px solid rgba(99, 102, 241, 0.25)',
                  pointerEvents: 'none'
                }} />
                <Award size={40} strokeWidth={2.2} />
              </div>

              <h1 style={{ fontSize: 25, fontWeight: 900, margin: '0 0 8px', color: '#0F172A', letterSpacing: '-0.5px' }}>
                {examConfig?.title || 'Machine Learning Engineer Internship Exam'}
              </h1>
              <p style={{ fontSize: 14.5, color: '#64748B', margin: 0, lineHeight: 1.55 }}>
                Score <strong style={{ color: '#0F172A' }}>{passThreshold}% or higher ({minPassCount}/{totalQCount} correct)</strong> to qualify and unlock the 1-Year {examConfig?.courseName || 'Machine Learning Engineer Internship'} with certification.
              </p>
            </div>

            {/* Unified 4-Metric Grid (Designer Polish - 100% Dynamic from Admin Panel) */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 14,
              marginBottom: 28
            }}>
              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9.5, fontWeight: 800, padding: '2px 7px',
                  borderRadius: 999, background: '#EFF6FF', color: '#2563EB',
                  border: '1px solid #DBEAFE'
                }}>{durationPill}</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 11, background: '#EFF6FF', color: '#2563EB', marginBottom: 8, boxShadow: '0 2px 6px rgba(37, 99, 235, 0.15)' }}>
                  <Clock size={19} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: 2 }}>Duration</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>{durationDisplay}</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Auto Countdown</div>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9.5, fontWeight: 800, padding: '2px 7px',
                  borderRadius: 999, background: '#EEF2FF', color: '#6366F1',
                  border: '1px solid #E0E7FF'
                }}>Technical</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 11, background: '#EEF2FF', color: '#6366F1', marginBottom: 8, boxShadow: '0 2px 6px rgba(99, 102, 241, 0.15)' }}>
                  <FileText size={19} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: 2 }}>Questions</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.2px' }}>{totalQCount} MCQs</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Single Choice</div>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9.5, fontWeight: 800, padding: '2px 7px',
                  borderRadius: 999, background: '#ECFDF5', color: '#059669',
                  border: '1px solid #A7F3D0'
                }}>Min Cutoff</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 11, background: '#ECFDF5', color: '#10B981', marginBottom: 8, boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)' }}>
                  <Award size={19} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: 2 }}>Pass Score</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#059669', letterSpacing: '-0.2px' }}>{passThreshold}% ({minPassCount}/{totalQCount})</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Required to Enroll</div>
              </div>

              <div style={{
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                borderRadius: 16,
                padding: '16px 14px',
                textAlign: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                position: 'relative'
              }}>
                <span style={{
                  position: 'absolute', top: 10, right: 10,
                  fontSize: 9.5, fontWeight: 800, padding: '2px 7px',
                  borderRadius: 999, background: '#FFFBEB', color: '#D97706',
                  border: '1px solid #FDE68A'
                }}>AI Verified</span>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 11, background: '#FFFBEB', color: '#D97706', marginBottom: 8, boxShadow: '0 2px 6px rgba(217, 119, 6, 0.15)' }}>
                  <Shield size={19} strokeWidth={2.4} />
                </div>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px', marginBottom: 2 }}>Integrity</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#B45309', letterSpacing: '-0.2px' }}>Proctored</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Webcam & Desktop</div>
              </div>
            </div>

            {/* Hardware & Proctoring Verification Studio */}
            <div style={{
              background: '#FAFAFC',
              borderRadius: 18,
              border: '1px solid #E2E8F0',
              padding: '20px',
              marginBottom: 24
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                  <Camera size={16} color="#2563EB" /> Proctoring Hardware Verification
                </div>
                <span style={{ fontSize: 11.5, color: '#64748B' }}>
                  Webcam required &bull; Screen share recommended
                </span>
              </div>

              {setupError && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECDD3',
                  color: '#B91C1C',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  marginBottom: 14
                }}>
                  {setupError}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {/* 1. Camera Card */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: cameraActive ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>Webcam Feed</span>
                    {cameraActive ? (
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Connected
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>Not connected</span>
                    )}
                  </div>

                  {/* Video Viewport with Soft Styling */}
                  <div style={{
                    width: '100%',
                    height: 155,
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    background: cameraActive ? '#000000' : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: cameraActive ? 'none' : '1.5px dashed #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {cameraActive ? (
                      <>
                        <video
                          ref={webcamVideoRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div style={{
                          position: 'absolute', top: 6, left: 6,
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: '#FFFFFF', fontSize: 9, fontWeight: 800,
                          padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFF' }} /> LIVE
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0 12px' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: '#FFFFFF', color: '#64748B',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: 6
                        }}>
                          <Camera size={18} />
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
                          Camera is inactive
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                          Click below to allow access
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleEnableCamera}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: cameraActive ? '1px solid #A7F3D0' : 'none',
                      background: cameraActive ? '#ECFDF5' : '#2563EB',
                      color: cameraActive ? '#059669' : '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: cameraActive ? 'none' : '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    {cameraActive ? <><Check size={14} /> Camera Verified</> : <><Camera size={14} /> Enable Camera *</>}
                  </button>
                </div>

                {/* 2. Screen Share Card */}
                <div style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: screenActive ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>Screen Share (Desktop)</span>
                    {screenActive ? (
                      <span style={{ color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Active
                      </span>
                    ) : (
                      <span style={{ color: '#94A3B8' }}>Not sharing</span>
                    )}
                  </div>

                  {/* Video Viewport with Soft Styling */}
                  <div style={{
                    width: '100%',
                    height: 155,
                    borderRadius: 10,
                    overflow: 'hidden',
                    position: 'relative',
                    background: screenActive ? '#000000' : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                    border: screenActive ? 'none' : '1.5px dashed #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {screenActive ? (
                      <>
                        <video
                          ref={screenPreviewRef}
                          autoPlay
                          playsInline
                          muted
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                        <div style={{
                          position: 'absolute', top: 6, left: 6,
                          background: 'rgba(79, 70, 229, 0.9)',
                          color: '#FFFFFF', fontSize: 9, fontWeight: 800,
                          padding: '2px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFF' }} /> DESKTOP
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '0 12px' }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10,
                          background: '#FFFFFF', color: '#64748B',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)', marginBottom: 6
                        }}>
                          <Monitor size={18} />
                        </div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
                          Screen share is optional
                        </div>
                        <div style={{ fontSize: 10.5, color: '#94A3B8' }}>
                          Share full desktop for proctoring
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleEnableScreen}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: screenActive ? '1px solid #A7F3D0' : 'none',
                      background: screenActive ? '#ECFDF5' : '#4F46E5',
                      color: screenActive ? '#059669' : '#FFFFFF',
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: screenActive ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.25)'
                    }}
                  >
                    {screenActive ? <><Check size={14} /> Screen Sharing Active</> : <><Monitor size={14} /> Share Full Screen</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Button */}
            <button
              type="button"
              onClick={handleStartExam}
              disabled={!cameraActive}
              style={{
                width: '100%',
                height: 52,
                borderRadius: 14,
                border: 'none',
                background: cameraActive
                  ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)'
                  : '#F1F5F9',
                color: cameraActive ? '#FFFFFF' : '#94A3B8',
                fontSize: 15,
                fontWeight: 850,
                cursor: cameraActive ? 'pointer' : 'not-allowed',
                boxShadow: cameraActive ? '0 10px 25px rgba(37, 99, 235, 0.35)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s ease',
                marginBottom: 16
              }}
            >
              {cameraActive ? (
                <>
                  Start {durationDisplay} Recorded Exam Now <ArrowRight size={17} />
                </>
              ) : (
                <>
                  <Lock size={15} /> Enable Camera Above to Unlock Exam
                </>
              )}
            </button>

            {/* Trust and Integrity Micro-Badges */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 18,
              fontSize: 11.5,
              color: '#64748B',
              flexWrap: 'wrap'
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Shield size={13} color="#10B981" /> Encrypted Session
              </span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} color="#2563EB" /> {durationSecs}s Auto Countdown
              </span>
              <span>&bull;</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Award size={13} color="#7C3AED" /> 1-Year Certificate on {passThreshold}%+
              </span>
            </div>
          </div>
        ) : examState === 'running' && currentQ ? (
          /* ─── STATE 2: ACTIVE PROCTORED EXAM (DESIGNER-GRADE MASTER CONSOLE) ─── */
          <div style={{
            maxWidth: 960,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 25px 70px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.6)',
            overflow: 'hidden'
          }}>

            {/* Top Control Bar: BIG WEBCAM ON LEFT, TIME ON RIGHT, PROGRESS IN CENTER */}
            <div style={{
              background: 'linear-gradient(180deg, #FFFFFF 0%, #FAFAFC 100%)',
              borderBottom: '1px solid #E2E8F0',
              padding: '18px 26px 14px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 20,
                marginBottom: 14
              }}>
                {/* 1. LEFT SIDE: BIG LIVE PROCTORING RECORDING FEED */}
                <div style={{
                  width: 200,
                  height: 125,
                  borderRadius: 16,
                  background: '#0B0F17',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2.5px solid #10B981',
                  boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.4)',
                  flexShrink: 0
                }}>
                  <video
                    ref={pipWebcamRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {/* Top-Left Live Recording Badge */}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: 'rgba(225, 29, 72, 0.95)',
                    color: '#FFFFFF', fontSize: 9, fontWeight: 900,
                    padding: '2.5px 7px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                    letterSpacing: '0.4px'
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF' }} className="animate-pulse" /> LIVE PROCTOR
                  </div>
                  {/* Bottom Candidate Watermark */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)',
                    color: '#F1F5F9', fontSize: 10, fontWeight: 750,
                    padding: '10px 8px 4px', textAlign: 'center',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {effectiveName} &bull; Recorded
                  </div>
                </div>

                {/* 2. CENTER: QUESTION COUNTER, TOPIC, DIFFICULTY BADGES & PROGRESS */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.3px' }}>
                      Question {currentQIndex + 1} of {questions.length}
                    </span>
                    <span style={{
                      background: '#EEF2FF',
                      border: '1px solid #C7D2FE',
                      color: '#4338CA',
                      padding: '3px 11px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '0.3px'
                    }}>
                      {currentQ.topic || 'Machine Learning'}
                    </span>
                    <span style={{
                      background: '#FFF1F2',
                      border: '1px solid #FECDD3',
                      color: '#E11D48',
                      padding: '3px 11px',
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 800,
                      letterSpacing: '0.3px'
                    }}>
                      {currentQ.difficulty || 'Hard'}
                    </span>
                    <span style={{
                      background: '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#059669',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 750
                    }}>
                      1 Mark
                    </span>
                  </div>

                  <div style={{ fontSize: 12.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Progress: <strong style={{ color: '#0F172A' }}>{answeredCount}</strong> of <strong style={{ color: '#0F172A' }}>{questions.length}</strong> Answered</span>
                    <span>&bull;</span>
                    <span style={{ color: '#2563EB', fontWeight: 800 }}>{Math.round(((currentQIndex + 1) / questions.length) * 100)}% Complete</span>
                  </div>
                </div>

                {/* 3. RIGHT SIDE: PROMINENT LIVE RUNNING TIME COUNTDOWN */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: 4,
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#64748B' }}>
                    Time Remaining
                  </span>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    borderRadius: 14,
                    background: timeLeft < 30
                      ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                      : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: 21,
                    letterSpacing: '0.8px',
                    boxShadow: timeLeft < 30
                      ? '0 6px 20px rgba(220, 38, 38, 0.45)'
                      : '0 4px 14px rgba(15, 23, 42, 0.2)',
                    minWidth: 125,
                    justifyContent: 'center'
                  }}>
                    <Clock size={20} className={timeLeft < 30 ? 'animate-pulse' : ''} />
                    <span>{formatTime(timeLeft)}</span>
                  </div>
                  {timeLeft < 30 && (
                    <span style={{ fontSize: 11, color: '#DC2626', fontWeight: 850 }} className="animate-pulse">
                      Auto-Submitting Soon!
                    </span>
                  )}
                </div>
              </div>

              {/* Seamless Linear Progress Bar */}
              <div style={{
                height: 4,
                background: '#E2E8F0',
                borderRadius: 999,
                overflow: 'hidden',
                width: '100%'
              }}>
                <div style={{
                  height: '100%',
                  width: `${((currentQIndex + 1) / questions.length) * 100}%`,
                  background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)',
                  borderRadius: 999,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Question Card Content */}
            <div style={{ padding: '32px 32px 24px' }}>
              <div style={{
                fontSize: 11.5,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: '#6366F1',
                marginBottom: 8
              }}>
                Question {currentQIndex + 1}
              </div>

              <h2 style={{
                fontSize: 18.5,
                color: '#0F172A',
                fontWeight: 750,
                lineHeight: 1.55,
                margin: '0 0 24px'
              }}>
                {currentQ.prompt}
              </h2>

              {/* Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                {currentQ.options.map((optionText, idx) => {
                  const isSelected = selectedAnswers[currentQ.id] === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectOption(currentQ.id, idx)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: 14,
                        background: isSelected ? 'linear-gradient(135deg, #F0F7FF 0%, #EFF6FF 100%)' : '#FFFFFF',
                        border: isSelected ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                        boxShadow: isSelected ? '0 6px 16px -2px rgba(37, 99, 235, 0.14)' : '0 1px 3px rgba(0, 0, 0, 0.02)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 14,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                        <div style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          border: isSelected ? 'none' : '1.5px solid #CBD5E1',
                          background: isSelected ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#F1F5F9',
                          color: isSelected ? '#FFFFFF' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 850,
                          flexShrink: 0,
                          boxShadow: isSelected ? '0 3px 8px rgba(37, 99, 235, 0.35)' : 'none'
                        }}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div style={{
                          fontSize: 14.5,
                          color: isSelected ? '#1E3A8A' : '#334155',
                          lineHeight: 1.5,
                          fontWeight: isSelected ? 650 : 450
                        }}>
                          {optionText}
                        </div>
                      </div>

                      {isSelected && (
                        <span style={{
                          background: '#DBEAFE',
                          color: '#1D4ED8',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: 999,
                          flexShrink: 0
                        }}>
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Navigation Action Bar: ON QUESTIONS 1-14 ONLY 'NEXT QUESTION', ON LAST QUESTION SHOW 'SUBMIT EXAM' */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                paddingTop: 16,
                borderTop: '1px solid #F1F5F9'
              }}>
                <button
                  type="button"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  style={{
                    padding: '11px 20px',
                    borderRadius: 11,
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: currentQIndex === 0 ? '#94A3B8' : '#334155',
                    cursor: currentQIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13.5,
                    fontWeight: 750,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <ArrowLeft size={15} /> Previous
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {currentQIndex < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
                      style={{
                        padding: '11px 24px',
                        borderRadius: 11,
                        background: '#2563EB',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 850,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 3px 10px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      Next Question <ArrowRight size={16} />
                    </button>
                  ) : (
                    /* ONLY SHOWN ON THE LAST QUESTION */
                    <button
                      type="button"
                      onClick={() => handleSubmitExam(false)}
                      style={{
                        padding: '12px 28px',
                        borderRadius: 11,
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 850,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      Submit Exam ({answeredCount}/{questions.length}) ✓
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Integrated Question Matrix Palette Strip */}
            <div style={{
              background: '#FAFAFC',
              borderTop: '1px solid #E2E8F0',
              padding: '18px 28px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 12
              }}>
                <span style={{ fontSize: 12, color: '#0F172A', fontWeight: 800 }}>
                  Question Navigator
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: '#64748B' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} /> Current
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} /> Answered ({answeredCount})
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1' }} /> Remaining ({questions.length - answeredCount})
                  </span>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: questions.length <= 15 ? `repeat(${Math.max(1, questions.length)}, 1fr)` : 'repeat(auto-fill, minmax(44px, 1fr))',
                gap: 8
              }}>
                {questions.map((q, idx) => {
                  const isCurrent = currentQIndex === idx;
                  const isAnswered = selectedAnswers[q.id] !== undefined;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQIndex(idx)}
                      style={{
                        height: 34,
                        borderRadius: 8,
                        border: isCurrent
                          ? '2px solid #2563EB'
                          : isAnswered
                          ? '1px solid #A7F3D0'
                          : '1px solid #E2E8F0',
                        background: isCurrent
                          ? '#EFF6FF'
                          : isAnswered
                          ? '#ECFDF5'
                          : '#FFFFFF',
                        color: isCurrent
                          ? '#1D4ED8'
                          : isAnswered
                          ? '#047857'
                          : '#64748B',
                        fontWeight: 850,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: isCurrent ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : examState === 'submitting' ? (
          /* ─── STATE 3: SUBMITTING / PROCTORING UPLOAD LOADER ─── */
          <div style={{
            maxWidth: 440,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            padding: '44px 32px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.1)'
          }}>
            <RefreshCw size={40} color="#2563EB" className="animate-spin" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 21, color: '#0F172A', fontWeight: 850, margin: '0 0 8px' }}>
              Submitting &amp; Grading Exam...
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: 0, lineHeight: 1.55 }}>
              Uploading proctoring recording and computing your score against the {passThreshold}% passing threshold.
            </p>
          </div>
        ) : examState === 'result' && submissionResult ? (
          /* ─── STATE 4: DESIGNER-GRADE RESULTS & PERFORMANCE STUDIO ─── */
          <div style={{
            maxWidth: 680,
            width: '100%',
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #E2E8F0',
            padding: '40px 36px 36px',
            textAlign: 'center',
            boxShadow: '0 25px 70px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.6)'
          }}>
            {/* Top Status Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: submissionResult.passed ? '#ECFDF5' : '#FFF1F2',
              border: `1px solid ${submissionResult.passed ? '#A7F3D0' : '#FECDD3'}`,
              borderRadius: 999,
              padding: '4px 14px',
              color: submissionResult.passed ? '#059669' : '#E11D48',
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              marginBottom: 16
            }}>
              {submissionResult.passed ? (
                <><CheckCircle2 size={14} color="#059669" /> Qualifying Challenge Passed</>
              ) : (
                <><Shield size={14} color="#E11D48" /> Assessment Report Generated</>
              )}
            </div>

            {/* Emblem Squircle Badge */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              background: submissionResult.passed
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
              color: '#FFF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: submissionResult.passed
                ? '0 16px 36px -6px rgba(16, 185, 129, 0.45)'
                : '0 16px 36px -6px rgba(234, 88, 12, 0.35)',
              marginBottom: 18
            }}>
              {submissionResult.passed ? <Award size={38} strokeWidth={2.2} /> : <FileText size={36} strokeWidth={2.2} />}
            </div>

            <h1 style={{
              fontSize: 25,
              fontWeight: 900,
              color: '#0F172A',
              margin: '0 0 8px',
              letterSpacing: '-0.4px'
            }}>
              {submissionResult.passed
                ? '🎉 Congratulations! You Qualified!'
                : 'Qualifying Attempt Completed'}
            </h1>

            <p style={{ fontSize: 14.5, color: '#64748B', margin: '0 auto 28px', maxWidth: 520, lineHeight: 1.55 }}>
              {submissionResult.passed
                ? `You successfully met the ${passThreshold}% passing criteria for the 1-Year ${examConfig?.courseName || 'Machine Learning Engineer Internship'} with certification.`
                : `A minimum score of ${passThreshold}% is required to unlock the 1-Year ${examConfig?.courseName || 'Machine Learning Internship'}. Brush up on key concepts and try again.`}
            </p>

            {/* Designer Performance Scorecard Strip */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: 18,
              border: '1.5px solid #E2E8F0',
              padding: '20px 22px',
              marginBottom: 26,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', marginBottom: 2 }}>Your Score</div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: submissionResult.passed ? '#059669' : '#D97706',
                  letterSpacing: '-0.3px'
                }}>
                  {submissionResult.scorePercent}%
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Accuracy</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', marginBottom: 2 }}>Correct</div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.3px'
                }}>
                  {submissionResult.correctCount}/{submissionResult.totalQuestions}
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Answers</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', marginBottom: 2 }}>Pass Cutoff</div>
                <div style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: '#2563EB',
                  letterSpacing: '-0.3px'
                }}>
                  {submissionResult.passThreshold}%
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {Math.ceil(((submissionResult.passThreshold || passThreshold) / 100) * (submissionResult.totalQuestions || totalQCount))}/{submissionResult.totalQuestions || totalQCount} Minimum
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.4px', marginBottom: 2 }}>Integrity</div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 900,
                  color: '#059669',
                  marginTop: 6
                }}>
                  Verified ✓
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Proctor Video</div>
              </div>
            </div>

            {/* Next Steps & Action Buttons */}
            {submissionResult.passed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  padding: '12px 18px',
                  borderRadius: 12,
                  color: '#065F46',
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}>
                  <CheckCircle2 size={16} color="#059669" />
                  Your qualification is officially recorded! You can now activate your 1-Year Pass.
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/academy?plan=annual&qualified=true');
                  }}
                  style={{
                    width: '100%',
                    padding: '15px 22px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 850,
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                >
                  <Award size={18} /> Enroll in 1-Year {examConfig?.courseName || 'ML Internship'} for ₹9,999 Now →
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/student')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 6
                  }}
                >
                  Return to Student Dashboard
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  background: '#FFFBEB',
                  border: '1.5px solid #FDE68A',
                  padding: '14px 18px',
                  borderRadius: 14,
                  color: '#92400E',
                  fontSize: 13,
                  lineHeight: 1.55,
                  textAlign: 'left'
                }}>
                  <div style={{ fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: '#B45309' }}>
                    <Clock size={15} color="#D97706" /> 7-Day Academic Preparation Interval Activated
                  </div>
                  Your attempt has been recorded. Your next qualifying exam attempt unlocks on <strong>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</strong>. Renew your Weekly Sprint below to continue studying lectures and working on hands-on code sandboxes.
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/student')}
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontSize: 14.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Sparkles size={16} /> Renew Weekly Sprint (₹299) &amp; Continue Learning →
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/student')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#64748B',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 4
                  }}
                >
                  Return to Student Dashboard
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
