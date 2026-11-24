import React, { useState, useEffect } from 'react';
import {
  Award, Clock, Shield, CheckCircle2, XCircle, Play, Eye,
  Trash2, Plus, Edit2, Save, RefreshCw, X, AlertCircle, FileText, Check
} from 'lucide-react';

export default function InternshipExamManager() {
  const [activeSubTab, setActiveSubTab] = useState('submissions'); // 'submissions' | 'questions'
  const [loading, setLoading] = useState(true);

  // Exam Config State
  const [config, setConfig] = useState(null);
  const [durationSecs, setDurationSecs] = useState(120);
  const [passThreshold, setPassThreshold] = useState(80);
  const [questions, setQuestions] = useState([]);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [examTitle, setExamTitle] = useState('Machine Learning Engineer Internship Qualifying Exam');
  const [courseName, setCourseName] = useState('Machine Learning Engineer Internship');

  // Submissions State
  const [submissions, setSubmissions] = useState([]);
  const [selectedVideoModal, setSelectedVideoModal] = useState(null);

  // New Question Form State
  const [showAddQModal, setShowAddQModal] = useState(false);
  const [newQ, setNewQ] = useState({
    prompt: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'Hard',
    topic: 'Machine Learning'
  });

  // Fetch Config and Submissions
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cfgRes, subsRes] = await Promise.all([
        fetch('/api/internship-exam/admin/config'),
        fetch('/api/internship-exam/admin/submissions')
      ]);
      const cfgData = await cfgRes.json();
      const subsData = await subsRes.json();

      if (cfgData.success && cfgData.config) {
        setConfig(cfgData.config);
        setDurationSecs(cfgData.config.durationSeconds || 120);
        setPassThreshold(cfgData.config.passPercentage || 80);
        setQuestions(cfgData.config.questions || []);
        setExamTitle(cfgData.config.title || 'Machine Learning Engineer Internship Qualifying Exam');
        setCourseName(cfgData.config.courseName || 'Machine Learning Engineer Internship');
      }
      if (subsData.success) {
        setSubmissions(subsData.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load exam data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Reset student cooldown
  const handleResetCooldown = async (email) => {
    if (!window.confirm(`Reset exam attempt and 7-day cooldown for ${email}? This will allow the student to retake the exam immediately.`)) return;
    try {
      const res = await fetch('/api/internship-exam/admin/reset-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message || 'Cooldown reset successfully');
      fetchData();
    } catch (err) {
      alert('Error resetting cooldown: ' + err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Save Settings & Questions
  const handleSaveConfig = async () => {
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/internship-exam/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          courseName,
          durationSeconds: durationSecs,
          passPercentage: passThreshold,
          questions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save config');
      setSaveSuccessMsg('✓ Exam settings and questions saved successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      alert('Error saving config: ' + err.message);
    }
  };

  // Add Question
  const handleAddQuestion = () => {
    if (!newQ.prompt.trim()) return alert('Please enter question prompt.');
    if (newQ.options.some(opt => !opt.trim())) return alert('Please fill in all 4 options.');

    const newQuestionObj = {
      id: `q_${Date.now()}`,
      prompt: newQ.prompt.trim(),
      options: newQ.options.map(o => o.trim()),
      correctAnswer: parseInt(newQ.correctAnswer, 10),
      difficulty: newQ.difficulty,
      topic: newQ.topic
    };

    setQuestions(prev => [...prev, newQuestionObj]);
    setShowAddQModal(false);
    setNewQ({
      prompt: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'Hard',
      topic: 'Machine Learning'
    });
  };

  // Delete Question
  const handleDeleteQuestion = (qId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      setQuestions(prev => prev.filter(q => q.id !== qId));
    }
  };

  return (
    <div style={{ padding: '24px 28px', color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        paddingBottom: 20,
        borderBottom: '1px solid #E2E8F0'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EDE9FE', color: '#7C3AED', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            <Award size={13} /> {courseName || 'Machine Learning Engineer Internship'}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 850, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
            Internship Qualifying Exam Manager
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
            Configure exam questions, timer rules, and review proctoring recordings of students who attempted the test.
          </p>
        </div>

        {/* Sub-tabs Switcher */}
        <div style={{ display: 'flex', gap: 8, background: '#F1F5F9', padding: 4, borderRadius: 12 }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('submissions')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeSubTab === 'submissions' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'submissions' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeSubTab === 'submissions' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Submissions &amp; Proctoring Videos ({submissions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('questions')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: activeSubTab === 'questions' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'questions' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeSubTab === 'questions' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Settings &amp; Question Bank ({questions.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
          Loading exam data...
        </div>
      ) : activeSubTab === 'submissions' ? (

        /* ─── SUB-TAB 1: STUDENT SUBMISSIONS & PROCTORING VIDEOS ─── */
        <div>
          {submissions.length === 0 ? (
            <div style={{
              background: '#F8FAFC',
              borderRadius: 16,
              border: '1.5px dashed #CBD5E1',
              padding: '50px 20px',
              textAlign: 'center'
            }}>
              <Award size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, color: '#334155', fontWeight: 700, margin: '0 0 6px' }}>
                No Exam Submissions Yet
              </h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
                When students attempt the proctored exam to qualify for the 1-Year Internship, their scores and video recordings will appear here.
              </p>
            </div>
          ) : (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '14px 18px' }}>Student Candidate</th>
                      <th style={{ padding: '14px 18px' }}>Score &amp; Accuracy</th>
                      <th style={{ padding: '14px 18px' }}>Qualification Status</th>
                      <th style={{ padding: '14px 18px' }}>Time Taken</th>
                      <th style={{ padding: '14px 18px' }}>Date &amp; Time</th>
                      <th style={{ padding: '14px 18px', textAlign: 'center' }}>Proctoring Video</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub, i) => (
                      <tr key={sub.id || i} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{sub.studentName}</div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>{sub.studentEmail}</div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: sub.passed ? '#059669' : '#DC2626' }}>
                            {sub.scorePercent}%
                          </div>
                          <div style={{ fontSize: 11.5, color: '#64748B' }}>
                            {sub.correctCount} of {sub.totalQuestions} Correct
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {sub.passed ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0',
                              padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700
                            }}>
                              <CheckCircle2 size={13} /> QUALIFIED (Passed)
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECDD3',
                              padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700
                            }}>
                              <XCircle size={13} /> FAILED (&lt;{sub.passThreshold || passThreshold}%)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748B' }}>
                          {sub.timeTakenSeconds || 120}s
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748B', fontSize: 12 }}>
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          }) : 'Recent'}
                        </td>
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            {sub.proctoringVideoUrl ? (
                              <button
                                type="button"
                                onClick={() => setSelectedVideoModal(sub)}
                                style={{
                                  background: '#7C3AED',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  boxShadow: '0 2px 6px rgba(124, 58, 237, 0.25)'
                                }}
                              >
                                <Play size={13} fill="#FFF" /> Watch Video
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => handleResetCooldown(sub.studentEmail)}
                              title="Reset 7-day cooldown so student can retake exam immediately"
                              style={{
                                background: '#F1F5F9',
                                color: '#475569',
                                border: '1px solid #CBD5E1',
                                padding: '6px 10px',
                                borderRadius: 8,
                                fontSize: 11.5,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <RefreshCw size={12} /> Reset Cooldown
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (

        /* ─── SUB-TAB 2: EXAM SETTINGS & QUESTION BANK ─── */
        <div>
          {/* Settings Bar */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1.5px solid #E2E8F0',
            padding: '22px 24px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
          }}>
            {/* Row 1: Exam Title & Track / Course Name */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                  Exam Title (Dynamic Header)
                </label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer Internship Qualifying Exam"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, color: '#0F172A', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                  Target Course / Track Name
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="e.g. Machine Learning Engineer Internship"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, color: '#0F172A', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Row 2: Duration, Passing Score, Questions count & Actions */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              paddingTop: 14,
              borderTop: '1px solid #F1F5F9'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                {/* Duration Limit */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                    Time Limit (Seconds)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min={30}
                      max={600}
                      value={durationSecs}
                      onChange={(e) => setDurationSecs(parseInt(e.target.value, 10) || 120)}
                      style={{ width: 85, padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[
                        { label: '2 Min (120s)', val: 120 },
                        { label: '3 Min (180s)', val: 180 },
                        { label: '5 Min (300s)', val: 300 }
                      ].map(p => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => setDurationSecs(p.val)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: durationSecs === p.val ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
                            background: durationSecs === p.val ? '#EFF6FF' : '#F8FAFC',
                            color: durationSecs === p.val ? '#1D4ED8' : '#64748B',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pass Cutoff */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 5 }}>
                    Passing Score Cutoff (%)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      min={40}
                      max={100}
                      value={passThreshold}
                      onChange={(e) => setPassThreshold(parseInt(e.target.value, 10) || 80)}
                      style={{ width: 75, padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[70, 80, 85, 90].map(pt => (
                        <button
                          key={pt}
                          type="button"
                          onClick={() => setPassThreshold(pt)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: passThreshold === pt ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                            background: passThreshold === pt ? '#ECFDF5' : '#F8FAFC',
                            color: passThreshold === pt ? '#059669' : '#64748B',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {pt}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Question Bank Count Badge */}
                <div style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#0F172A'
                }}>
                  Bank: <span style={{ color: '#2563EB' }}>{questions.length} MCQs</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddQModal(true)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Plus size={15} /> Add New Question
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Save size={15} /> Save Settings &amp; Questions
                </button>
              </div>
            </div>
          </div>

          {saveSuccessMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#059669',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 16
            }}>
              {saveSuccessMsg}
            </div>
          )}

          {/* Question Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {questions.map((q, idx) => (
              <div
                key={q.id || idx}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  padding: '18px 22px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: '#EFF6FF', color: '#2563EB', fontWeight: 800,
                      fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <strong style={{ fontSize: 14.5, color: '#0F172A' }}>
                      {q.prompt}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#EDE9FE', color: '#7C3AED', padding: '2px 8px', borderRadius: 6 }}>
                      {q.topic || 'ML'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                      title="Delete Question"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 4 Options Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 8 }}>
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correctAnswer === oIdx;
                    return (
                      <div
                        key={oIdx}
                        style={{
                          padding: '8px 12px',
                          borderRadius: 8,
                          background: isCorrect ? '#ECFDF5' : '#F8FAFC',
                          border: isCorrect ? '1.5px solid #10B981' : '1px solid #E2E8F0',
                          color: isCorrect ? '#065F46' : '#334155',
                          fontSize: 12.5,
                          fontWeight: isCorrect ? 700 : 400,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}
                      >
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: isCorrect ? '#10B981' : '#CBD5E1',
                          color: '#FFF', fontSize: 11, fontWeight: 800,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt}</span>
                        {isCorrect && <Check size={14} color="#10B981" style={{ marginLeft: 'auto' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODAL: ADD NEW QUESTION ─── */}
      {showAddQModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20, maxWidth: 560, width: '100%',
            padding: '28px 26px', border: '1px solid #E2E8F0',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Add New Exam Question
              </h3>
              <button
                type="button"
                onClick={() => setShowAddQModal(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                Question Statement *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. In Ridge vs Lasso regression, why does Lasso produce exact zero weights?"
                value={newQ.prompt}
                onChange={(e) => setNewQ({ ...newQ, prompt: e.target.value })}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning"
                  value={newQ.topic}
                  onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>Difficulty</label>
                <select
                  value={newQ.difficulty}
                  onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                >
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Options (Select the radio of the correct answer) *
              </label>
              {newQ.options.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input
                    type="radio"
                    name="correctOptionRadio"
                    checked={newQ.correctAnswer === i}
                    onChange={() => setNewQ({ ...newQ, correctAnswer: i })}
                    style={{ width: 18, height: 18, accentColor: '#10B981', cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    value={opt}
                    onChange={(e) => {
                      const updated = [...newQ.options];
                      updated[i] = e.target.value;
                      setNewQ({ ...newQ, options: updated });
                    }}
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5 }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowAddQModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddQuestion}
                style={{ flex: 2, padding: '10px', borderRadius: 8, background: '#2563EB', border: 'none', color: '#FFF', fontWeight: 800, cursor: 'pointer' }}
              >
                Add Question to Exam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: WATCH CANDIDATE EXAM PROCTORING VIDEO ─── */}
      {selectedVideoModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 120,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#0F172A', borderRadius: 20, maxWidth: 760, width: '100%',
            overflow: 'hidden', border: '1px solid #334155',
            boxShadow: '0 25px 65px rgba(0,0,0,0.6)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFF', margin: '0 0 2px' }}>
                  Proctoring Session: {selectedVideoModal.studentName}
                </h3>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  {selectedVideoModal.studentEmail} &bull; Score: {selectedVideoModal.scorePercent}% ({selectedVideoModal.passed ? 'PASSED' : 'FAILED'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoModal(null)}
                style={{ background: '#1E293B', border: 'none', color: '#FFF', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#000', padding: 0 }}>
              <video
                src={selectedVideoModal.proctoringVideoUrl}
                controls
                autoPlay
                playsInline
                style={{ width: '100%', maxHeight: 440, display: 'block' }}
              />
            </div>

            <div style={{ padding: '14px 20px', background: '#131D31', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5, color: '#94A3B8' }}>
              <span>Exam Duration: {selectedVideoModal.timeTakenSeconds || 120}s</span>
              <a
                href={selectedVideoModal.proctoringVideoUrl}
                download
                style={{ color: '#38BDF8', fontWeight: 700, textDecoration: 'none' }}
              >
                Download Recording WebM ↓
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
