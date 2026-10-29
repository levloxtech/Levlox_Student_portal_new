import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Paperclip, Smile, Image as ImageIcon,
  FileText, Video, Trash2, Search, RefreshCw, X, Shield,
  Users, Check, Download, ExternalLink, Sparkles, AlertCircle,
  Ban, Clock, ChevronRight, GraduationCap, Phone, Mail, User,
  CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const isProd = import.meta.env.PROD;
const API_BASE = isProd ? '' : (import.meta.env.VITE_API_URL || '');

const STICKERS = [
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '💡', label: 'Idea' },
  { emoji: '👏', label: 'Applause' },
  { emoji: '💯', label: '100%' },
  { emoji: '💻', label: 'Code' },
  { emoji: '🧠', label: 'Brainy' },
  { emoji: '🎯', label: 'Bullseye' },
  { emoji: '🎉', label: 'Celebrate' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '⭐', label: 'Star' },
  { emoji: '🙋‍♂️', label: 'Doubt' },
  { emoji: '👍', label: 'Thumbs Up' },
  { emoji: '🙌', label: 'High Five' },
  { emoji: '🏆', label: 'Trophy' },
  { emoji: '📚', label: 'Study' },
];

export default function BatchChatPage({ user: propUser, userProfile: propProfile, batches: propBatches = [] }) {
  const navigate = useNavigate();
  const authContext = useAuth();
  const currentUser = propProfile || propUser || authContext?.userProfile || authContext?.currentUser || {};
  const currentUserId = currentUser.id || currentUser.uid || 'anon';
  const currentRole = (currentUser.role || 'student').toLowerCase();
  const isAdminOrTrainer = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'trainer';

  // Dynamic Batch State
  const [allBatches, setAllBatches] = useState(propBatches || []);
  const [batchSearch, setBatchSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  // Fetch all batches dynamically from localDb
  useEffect(() => {
    fetch(`${API_BASE}/api/data/batches`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAllBatches(data);
        }
      })
      .catch(() => {});
  }, []);

  // Determine initial selected batch
  useEffect(() => {
    if (selectedBatchId) return;

    if (!isAdminOrTrainer) {
      // Student: strictly locked to their batch
      const userBatchId = currentUser.batch_id || currentUser.batchId;
      const userBatchName = currentUser.batch_name || currentUser.batch;
      if (userBatchId) {
        setSelectedBatchId(String(userBatchId));
      } else if (userBatchName && allBatches.length > 0) {
        const found = allBatches.find(b => b.name === userBatchName);
        if (found) setSelectedBatchId(String(found.id));
      } else if (allBatches.length > 0) {
        setSelectedBatchId(String(allBatches[0].id));
      }
    } else {
      // Admin / Trainer: select first batch or assigned
      if (allBatches.length > 0) {
        setSelectedBatchId(String(allBatches[0].id));
      }
    }
  }, [allBatches, currentUser, isAdminOrTrainer, selectedBatchId]);

  const activeBatchObj = allBatches.find(b => String(b.id) === String(selectedBatchId) || String(b.uid) === String(selectedBatchId));
  const activeBatchName = activeBatchObj?.name || currentUser.batch_name || currentUser.batch || 'Batch Cohort';
  const activeCourseName = activeBatchObj?.course_name || activeBatchObj?.courseName || activeBatchObj?.course || 'Academic Program';

  // Chat messages state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [attachment, setAttachment] = useState(null); // { file, previewUrl, mediaType, name, size }
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaModal, setSelectedMediaModal] = useState(null);

  // Quick View Student Modal State (Admin / Trainer)
  const [previewStudent, setPreviewStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // WhatsApp-style Delete Modal State
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!selectedBatchId) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/batch/${selectedBatchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('[BatchChat] Fetch error:', err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedBatchId) {
      fetchMessages();
      const interval = setInterval(() => fetchMessages(true), 1500);
      const onFocus = () => fetchMessages(true);
      window.addEventListener('focus', onFocus);
      return () => {
        clearInterval(interval);
        window.removeEventListener('focus', onFocus);
      };
    }
  }, [selectedBatchId]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  // Client-side image compressor (< 2MB)
  const compressImageBelow2MB = async (file) => {
    const MAX_BYTES = 2 * 1024 * 1024;
    if (file.size <= MAX_BYTES) return file;

    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDim = 1920;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.85;
          const tryBlob = () => {
            canvas.toBlob((blob) => {
              if (!blob || blob.size <= MAX_BYTES || quality <= 0.35) {
                const compressedFile = new File([blob || file], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                quality -= 0.15;
                tryBlob();
              }
            }, 'image/jpeg', quality);
          };
          tryBlob();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (e) => {
    let file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    let mediaType = 'document';
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) mediaType = 'image';
    else if (['.mp4', '.webm', '.mov'].includes(ext)) mediaType = 'video';
    else if (ext === '.pdf') mediaType = 'pdf';

    const MAX_BYTES = 2 * 1024 * 1024; // 2MB

    // Handle image auto-compression
    if (mediaType === 'image' && file.size > MAX_BYTES) {
      setUploading(true);
      file = await compressImageBelow2MB(file);
      setUploading(false);
    } else if (file.size > MAX_BYTES) {
      alert(`⚠️ File size exceeds the 2MB limit. (Selected file: ${(file.size / (1024 * 1024)).toFixed(2)} MB)\nPlease choose a document under 2MB.`);
      e.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAttachment({
      file,
      previewUrl,
      mediaType,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB'
    });
    e.target.value = '';
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !attachment && !selectedSticker) return;

    let mediaUrl = null;
    let mediaType = null;
    let fileName = null;
    let fileSize = null;

    if (attachment && attachment.file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', attachment.file);
        const upRes = await fetch(`${API_BASE}/api/messages/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!upRes.ok) throw new Error('File upload failed');
        const upData = await upRes.json();
        mediaUrl = upData.url;
        mediaType = upData.mediaType;
        fileName = upData.fileName;
        fileSize = upData.fileSize;
      } catch (err) {
        console.error('[BatchChat] Upload error:', err);
        alert('Failed to upload attachment.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const senderName = currentUser.fullName || currentUser.displayName || currentUser.name || (currentRole === 'trainer' ? 'Faculty Trainer' : (currentRole === 'admin' ? 'Administrator' : 'Student'));
    const payload = {
      senderId: currentUserId,
      senderName,
      senderRole: currentRole,
      senderAvatar: currentUser.profile_pic || currentUser.profilePhotoUrl || currentUser.avatar || null,
      text: inputText.trim(),
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      sticker: selectedSticker || null,
    };

    try {
      const res = await fetch(`${API_BASE}/api/messages/batch/${selectedBatchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Send failed');
      const savedMsg = await res.json();
      setMessages((prev) => {
        if (prev.some(m => m.id === savedMsg.id)) return prev;
        return [...prev, savedMsg];
      });
      setInputText('');
      setAttachment(null);
      setSelectedSticker(null);
      setShowStickerPicker(false);
      setTimeout(() => scrollToBottom(true), 60);
    } catch (err) {
      console.error('[BatchChat] Send message failed:', err);
      alert('Could not send message. Please try again.');
    }
  };

  // WhatsApp-style Delete for Everyone
  const executeDeleteForEveryone = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/messages/${deleteCandidate.id}?userId=${encodeURIComponent(currentUserId)}&userRole=${encodeURIComponent(currentRole)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');

      // Update message tombstone locally
      setMessages(prev => prev.map(m => {
        if (String(m.id) === String(deleteCandidate.id)) {
          return {
            ...m,
            isDeleted: true,
            text: '🚫 This message was deleted',
            mediaUrl: null,
            sticker: null,
            fileName: null,
            fileSize: null
          };
        }
        return m;
      }));
      setDeleteCandidate(null);
    } catch (err) {
      console.error('[Delete Error]:', err);
      alert(err.message || 'Failed to delete message.');
    } finally {
      setDeleting(false);
    }
  };

  // Quick Student Profile Preview (for Admin & Trainer)
  const openStudentPreview = async (senderId, senderName) => {
    if (!isAdminOrTrainer) return;
    setLoadingStudent(true);
    setPreviewStudent({ name: senderName, id: senderId, loading: true });
    try {
      const res = await fetch(`${API_BASE}/api/data/students/${senderId}`);
      if (res.ok) {
        const studentData = await res.json();
        setPreviewStudent(studentData);
      } else {
        setPreviewStudent({ name: senderName, id: senderId, notFound: true });
      }
    } catch (_) {
      setPreviewStudent({ name: senderName, id: senderId, notFound: true });
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleToggleReaction = async (msgId, emoji) => {
    try {
      const res = await fetch(`${API_BASE}/api/messages/${msgId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji, userId: currentUserId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(msgId) ? { ...m, reactions: data.reactions } : m))
      );
    } catch (err) {
      console.warn('[BatchChat] Reaction toggle error:', err);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (m.text && m.text.toLowerCase().includes(q)) ||
      (m.senderName && m.senderName.toLowerCase().includes(q)) ||
      (m.fileName && m.fileName.toLowerCase().includes(q))
    );
  });

  const filteredBatches = allBatches.filter(b => {
    if (!batchSearch.trim()) return true;
    const q = batchSearch.toLowerCase();
    return (b.name && b.name.toLowerCase().includes(q)) || (b.course_name && b.course_name.toLowerCase().includes(q));
  });

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      minHeight: 650,
      background: '#FFFFFF',
      borderRadius: 16,
      border: '1.5px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      overflow: 'hidden',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      {/* ── LEFT PANEL: BATCH COHORT SELECTOR (ADMIN & TRAINER ONLY) ── */}
      {isAdminOrTrainer && (
        <aside style={{
          width: 320,
          background: '#FAFBFD',
          borderRight: '1.5px solid #E5EAF2',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid #E5EAF2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#6C3CF0" />
                <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 800, color: '#1E293B' }}>Training Batches</h3>
              </div>
              <span style={{ fontSize: 11, background: '#EDE9FE', color: '#6D28D9', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                {allBatches.length} Cohorts
              </span>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search cohorts..."
                value={batchSearch}
                onChange={e => setBatchSearch(e.target.value)}
                style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12.5, outline: 'none', boxSizing: 'border-box' }}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Batches List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
            {filteredBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#94A3B8', fontSize: 12.5 }}>
                No batches found
              </div>
            ) : (
              filteredBatches.map(b => {
                const isSelected = String(b.id) === String(selectedBatchId) || String(b.uid) === String(selectedBatchId);
                return (
                  <button
                    key={b.id || b.uid}
                    onClick={() => setSelectedBatchId(String(b.id || b.uid))}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: 12,
                      border: isSelected ? '1.5px solid #818CF8' : '1px solid transparent',
                      background: isSelected ? '#EEF2FF' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      marginBottom: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13.5, color: isSelected ? '#4338CA' : '#1E293B', fontWeight: 750 }}>
                        {b.name}
                      </strong>
                      {isSelected && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} />
                      )}
                    </div>
                    <span style={{ fontSize: 11.5, color: isSelected ? '#6366F1' : '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {b.course_name || b.courseName || b.course || 'Data Science & AI'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ── RIGHT PANEL: ACTIVE CHAT CONVERSATION ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        
        {/* Top Header */}
        <header style={{
          padding: '14px 20px',
          borderBottom: '1.5px solid #E5EAF2',
          background: '#FAFBFD',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              flexShrink: 0
            }}>
              <MessageSquare size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeBatchName}
                </h3>
                <span style={{ fontSize: 11, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                  Active Cohort
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCourseName} &bull; Official Classroom Discussion Channel
              </p>
            </div>
          </div>

          {/* Search in chat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 170 }}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 26px 6px 28px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
              <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              {searchQuery && (
                <X size={13} color="#94A3B8" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>
            <button
              onClick={() => fetchMessages(false)}
              title="Refresh Messages"
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* Messages Feed */}
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: 14
          }}
        >
          {loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading batch discussions...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Users size={36} color="#94A3B8" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 750, color: '#1E293B' }}>
                {searchQuery ? 'No matching messages found' : `Welcome to ${activeBatchName}!`}
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', maxWidth: 360, margin: '0 auto' }}>
                {searchQuery ? 'Try another keyword.' : 'Say hello to your fellow batch students and instructor.'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg, idx) => {
              const isMe = String(msg.senderId) === String(currentUserId);
              const isSystem = msg.senderRole === 'system';
              const isTrainer = (msg.senderRole || '').toLowerCase() === 'trainer';
              const isAdmin = (msg.senderRole || '').toLowerCase() === 'admin' || (msg.senderRole || '').toLowerCase() === 'super_admin';
              const isStudent = !isAdmin && !isTrainer && !isSystem;

              const msgTime = new Date(msg.createdAt).getTime();
              const isWithin2Hours = (Date.now() - msgTime) <= (2 * 60 * 60 * 1000);
              const canDelete = !msg.isDeleted && (isAdminOrTrainer || (isMe && isWithin2Hours));

              const timeDisplay = msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '';

              if (isSystem) {
                return (
                  <div key={msg.id || idx} style={{ alignSelf: 'center', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '10px 18px', maxWidth: 580, textAlign: 'center', color: '#1E3A8A', fontSize: 12.5, lineHeight: 1.5 }}>
                    <div style={{ fontWeight: 750, marginBottom: 2 }}>{msg.senderName}</div>
                    <div>{msg.text}</div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '78%',
                    flexDirection: isMe ? 'row-reverse' : 'row'
                  }}
                >
                  {/* Avatar */}
                  <div
                    onClick={() => {
                      if (isAdminOrTrainer && isStudent) {
                        openStudentPreview(msg.senderId, msg.senderName);
                      }
                    }}
                    title={isAdminOrTrainer && isStudent ? 'Click to view student details' : msg.senderName}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isAdmin ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : (isTrainer ? 'linear-gradient(135deg, #059669, #10B981)' : (isMe ? '#4F46E5' : '#64748B')),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                      overflow: 'hidden',
                      cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default',
                      border: (isAdminOrTrainer && isStudent) ? '2px solid #818CF8' : 'none',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                    }}
                  >
                    {msg.senderAvatar ? (
                      <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      msg.senderName ? msg.senderName[0].toUpperCase() : 'U'
                    )}
                  </div>

                  {/* Message Bubble Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    {/* Header: Sender Name & Role */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, fontSize: 11.5 }}>
                      <span
                        onClick={() => {
                          if (isAdminOrTrainer && isStudent) openStudentPreview(msg.senderId, msg.senderName);
                        }}
                        style={{
                          fontWeight: 750,
                          color: '#1E293B',
                          cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default',
                          textDecoration: (isAdminOrTrainer && isStudent) ? 'underline' : 'none'
                        }}
                      >
                        {msg.senderName}
                      </span>

                      {isAdmin && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                          🛡️ ADMIN
                        </span>
                      )}
                      {isTrainer && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#D1FAE5', color: '#047857' }}>
                          🎓 TRAINER
                        </span>
                      )}
                      {isStudent && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#E0E7FF', color: '#3730A3' }}>
                          🎒 STUDENT
                        </span>
                      )}

                      <span style={{ color: '#94A3B8', fontSize: 11 }}>{timeDisplay}</span>
                    </div>

                    {/* Bubble */}
                    <div style={{
                      background: msg.isDeleted ? '#F1F5F9' : (isMe ? '#4F46E5' : '#FFFFFF'),
                      color: msg.isDeleted ? '#94A3B8' : (isMe ? '#FFFFFF' : '#0F172A'),
                      padding: '10px 14px',
                      borderRadius: isMe ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                      boxShadow: isMe ? '0 4px 14px rgba(79, 70, 229, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                      border: msg.isDeleted ? '1px dashed #CBD5E1' : (isMe ? 'none' : '1px solid #E2E8F0'),
                      position: 'relative',
                      wordBreak: 'break-word',
                      fontSize: 13.5,
                      lineHeight: 1.5
                    }}>
                      {/* Deleted Tombstone */}
                      {msg.isDeleted ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontStyle: 'italic', fontSize: 13 }}>
                          <Ban size={15} color="#94A3B8" /> This message was deleted
                        </div>
                      ) : (
                        <>
                          {/* Sticker */}
                          {msg.sticker && (
                            <div style={{ fontSize: 44, margin: '2px 0 6px', lineHeight: 1 }}>
                              {msg.sticker}
                            </div>
                          )}

                          {/* Text */}
                          {msg.text && <div>{msg.text}</div>}

                          {/* Media */}
                          {msg.mediaUrl && (
                            <div style={{ marginTop: 8 }}>
                              {msg.mediaType === 'image' && (
                                <img
                                  src={msg.mediaUrl}
                                  alt={msg.fileName || 'Attachment'}
                                  onClick={() => setSelectedMediaModal(msg.mediaUrl)}
                                  style={{ maxWidth: 280, maxHeight: 220, borderRadius: 8, cursor: 'pointer', objectFit: 'cover' }}
                                />
                              )}
                              {msg.mediaType === 'pdf' && (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    background: isMe ? 'rgba(255,255,255,0.2)' : '#F1F5F9',
                                    color: isMe ? '#FFFFFF' : '#1E293B',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: 12.5
                                  }}
                                >
                                  <FileText size={16} /> {msg.fileName || 'Document.pdf'}
                                  <Download size={14} />
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions Row (Reactions & Delete for Everyone) */}
                    {!msg.isDeleted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {/* Reactions button */}
                        <div style={{ display: 'flex', gap: 3 }}>
                          {['👍', '❤️', '🔥', '👏'].map(emoji => {
                            const count = (msg.reactions?.[emoji] || []).length;
                            const hasReacted = (msg.reactions?.[emoji] || []).includes(currentUserId);
                            return (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                style={{
                                  background: hasReacted ? '#EEF2FF' : '#FFFFFF',
                                  border: hasReacted ? '1px solid #818CF8' : '1px solid #E2E8F0',
                                  borderRadius: 12,
                                  padding: '2px 6px',
                                  fontSize: 11.5,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 2
                                }}
                              >
                                {emoji} {count > 0 && <span style={{ fontWeight: 700, fontSize: 10 }}>{count}</span>}
                              </button>
                            );
                          })}
                        </div>

                        {/* WhatsApp Delete for Everyone Button */}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteCandidate(msg)}
                            title={isAdminOrTrainer ? 'Delete for everyone (Moderator)' : 'Delete for everyone (within 2 hours)'}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94A3B8',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Sticker Badge Preview */}
        {selectedSticker && (
          <div style={{ padding: '6px 18px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Sticker attached:</span>
            <span style={{ fontSize: 24, lineHeight: 1 }}>{selectedSticker}</span>
            <button
              onClick={() => setSelectedSticker(null)}
              style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Attachment Preview */}
        {attachment && (
          <div style={{ padding: '8px 18px', background: '#F1F5F9', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {attachment.mediaType === 'image' ? (
                <img src={attachment.previewUrl} alt="Preview" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <FileText size={22} color="#6C3CF0" />
              )}
              <div>
                <strong style={{ fontSize: 13, color: '#1E293B' }}>{attachment.name}</strong>
                <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>({attachment.size}) &bull; Under 2MB ✓</span>
              </div>
            </div>
            <button
              onClick={() => setAttachment(null)}
              style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: 8, padding: '4px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <X size={14} /> Remove
            </button>
          </div>
        )}

        {/* Sticker Picker Popover */}
        {showStickerPicker && (
          <div style={{ padding: '10px 18px', background: '#FFFFFF', borderTop: '1.5px solid #E2E8F0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STICKERS.map(s => (
              <button
                key={s.emoji}
                type="button"
                onClick={() => {
                  setSelectedSticker(s.emoji);
                  setShowStickerPicker(false);
                }}
                style={{
                  background: selectedSticker === s.emoji ? '#EEF2FF' : '#F8FAFC',
                  border: selectedSticker === s.emoji ? '1.5px solid #6366F1' : '1px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 22,
                  padding: '6px 10px',
                  cursor: 'pointer'
                }}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '14px 18px', background: '#FFFFFF', borderTop: '1.5px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sticker Button */}
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            title="Attach Sticker"
            style={{ background: showStickerPicker ? '#EDE9FE' : '#F1F5F9', border: 'none', color: '#6C3CF0', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Smile size={19} />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Image or PDF (Max 2MB)"
            style={{ background: '#F1F5F9', border: 'none', color: '#475569', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Paperclip size={19} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
          />

          {/* Text Input */}
          <input
            type="text"
            className="form-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${activeBatchName}...`}
            style={{ flex: 1, padding: '11px 16px', borderRadius: 12, border: '1.5px solid #CBD5E1', fontSize: 13.5, outline: 'none' }}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={uploading || (!inputText.trim() && !attachment && !selectedSticker)}
            style={{
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: '#FFFFFF',
              border: 'none',
              padding: '11px 20px',
              borderRadius: 12,
              fontWeight: 750,
              fontSize: 13.5,
              cursor: (uploading || (!inputText.trim() && !attachment && !selectedSticker)) ? 'not-allowed' : 'pointer',
              opacity: (uploading || (!inputText.trim() && !attachment && !selectedSticker)) ? 0.6 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Send size={15} />
            {uploading ? 'Uploading...' : 'Send'}
          </button>
        </form>
      </div>

      {/* ── MODAL 1: STUDENT QUICK PREVIEW (FOR ADMIN & TRAINER) ── */}
      {previewStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 26, position: 'relative' }}>
            <button
              onClick={() => setPreviewStudent(null)}
              style={{ position: 'absolute', right: 16, top: 16, background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>

            {loadingStudent ? (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#64748B' }}>Loading student information...</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#4F46E5', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, overflow: 'hidden', border: '3px solid #E0E7FF' }}>
                    {previewStudent.profile_pic || previewStudent.profilePhotoUrl ? (
                      <img src={previewStudent.profile_pic || previewStudent.profilePhotoUrl} alt={previewStudent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      previewStudent.name ? previewStudent.name[0].toUpperCase() : 'S'
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1E293B' }}>{previewStudent.name}</h3>
                    <span style={{ fontSize: 11, background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontFamily: 'monospace' }}>
                      {previewStudent.rollNumber || previewStudent.student_id || 'STU-ACTIVE'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Email:</span>
                    <a href={`mailto:${previewStudent.email}`} style={{ color: '#4F46E5', textDecoration: 'none', fontWeight: 600 }}>{previewStudent.email || '—'}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile:</span>
                    <a href={`tel:${previewStudent.phone || previewStudent.mobile}`} style={{ color: '#1E293B', textDecoration: 'none', fontWeight: 600 }}>{previewStudent.phone || previewStudent.mobile || '—'}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Course:</span>
                    <span style={{ fontWeight: 600, color: '#1E293B' }}>{previewStudent.course || 'Data Science & AI'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Batch:</span>
                    <span style={{ fontWeight: 700, color: '#4F46E5' }}>{previewStudent.batch_name || previewStudent.batch || activeBatchName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Fees Status:</span>
                    <span style={{ fontWeight: 700, color: (previewStudent.feesStatus === 'Paid') ? '#16A34A' : '#D97706' }}>
                      {previewStudent.feesStatus || 'Pending'}
                    </span>
                  </div>
                </div>

                {currentRole === 'admin' && (
                  <button
                    onClick={() => {
                      const sId = previewStudent.id || previewStudent.uid;
                      if (sId) {
                        setPreviewStudent(null);
                        navigate(`/admin/students/${sId}`);
                      }
                    }}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #4F46E5, #6366F1)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '11px',
                      borderRadius: 10,
                      fontWeight: 750,
                      fontSize: 13.5,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <User size={15} /> View Full Profile in Admin Panel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 2: WHATSAPP-STYLE DELETE FOR EVERYONE CONFIRMATION ── */}
      {deleteCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 26 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Trash2 size={22} />
            </div>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, textAlign: 'center', color: '#1E293B' }}>
              Delete Message for Everyone?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 1.5 }}>
              {isAdminOrTrainer
                ? 'As a moderator, you can delete this message for all students and trainers in this batch.'
                : 'This will delete the message for everyone in this batch. (Available within 2 hours of sending).'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDeleteForEveryone}
                style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#DC2626', color: '#FFFFFF', fontWeight: 700, fontSize: 13, cursor: deleting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
              >
                {deleting ? 'Deleting...' : 'Delete for Everyone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: MEDIA ENLARGE PREVIEW ── */}
      {selectedMediaModal && (
        <div onClick={() => setSelectedMediaModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20, cursor: 'zoom-out' }}>
          <img src={selectedMediaModal} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 12, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  );
}
