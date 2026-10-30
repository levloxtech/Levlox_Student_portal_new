import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Paperclip, Smile, Image as ImageIcon,
  FileText, Trash2, Search, RefreshCw, X, Shield,
  Users, CheckCheck, Download, ExternalLink, Sparkles, AlertCircle,
  Ban, Clock, ChevronRight, GraduationCap, Phone, Mail, User,
  CheckCircle2, AlertTriangle, Layers, MoreVertical
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

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);

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
      const res = await fetch(`${API_BASE}/api/messages/batch/${selectedBatchId}?userId=${encodeURIComponent(currentUserId || '')}`);
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
      const interval = setInterval(() => fetchMessages(true), 2000);
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
    setActiveReactionPickerId(null);
    const uidStr = String(currentUserId);
    setMessages(prev => prev.map(m => {
      if (String(m.id) !== String(msgId)) return m;
      const reactions = { ...(m.reactions || {}) };
      const arr = Array.isArray(reactions[emoji]) ? [...reactions[emoji]] : [];
      const idx = arr.indexOf(uidStr);
      if (idx >= 0) {
        arr.splice(idx, 1);
        if (arr.length === 0) delete reactions[emoji];
        else reactions[emoji] = arr;
      } else {
        arr.push(uidStr);
        reactions[emoji] = arr;
      }
      return { ...m, reactions };
    }));
    try {
      setActiveReactionPickerId(null);
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
      height: 'calc(100vh - 120px)',
      maxHeight: 'calc(100vh - 120px)',
      minHeight: 520,
      width: '100%',
      background: '#F0F2F5',
      borderRadius: 16,
      border: '1px solid #D1D7DB',
      boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
      overflow: 'hidden',
      fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* ─── LEFT PANEL: BATCH COHORT SELECTOR (ADMIN & TRAINER ONLY) ─── */}
      {isAdminOrTrainer && (
        <aside style={{
          width: 320,
          background: '#FFFFFF',
          borderRight: '1px solid #E9EDEF',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', background: '#F0F2F5', borderBottom: '1px solid #E9EDEF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} color="#00A884" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111B21' }}>Chats</h3>
              </div>
              <span style={{ fontSize: 11, background: '#00A884', color: '#FFFFFF', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                {allBatches.length} Cohorts
              </span>
            </div>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search or start new chat"
                value={batchSearch}
                onChange={e => setBatchSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px 7px 34px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#FFFFFF',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <Search size={14} color="#8696A0" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Batches List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: '#8696A0', fontSize: 13 }}>
                No cohorts found
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
                      padding: '12px 16px',
                      border: 'none',
                      borderBottom: '1px solid #F0F2F5',
                      borderLeft: isSelected ? '4px solid #00A884' : '4px solid transparent',
                      background: isSelected ? '#F0F2F5' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'background 0.15s ease'
                    }}
                  >
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isSelected ? 'linear-gradient(135deg, #00A884, #059669)' : '#E9EDEF',
                      color: isSelected ? '#FFFFFF' : '#54656F',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      {b.name ? b.name.substring(0, 2).toUpperCase() : 'CO'}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <strong style={{ fontSize: 14, color: '#111B21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {b.name}
                        </strong>
                      </div>
                      <span style={{ fontSize: 12, color: '#667781', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.course_name || b.courseName || b.course || 'Data Science & AI'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      {/* ─── RIGHT PANEL: WHATSAPP ACTIVE CHAT ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%', position: 'relative' }}>
        
        {/* Pinned Top WhatsApp Header */}
        <header style={{
          padding: '10px 18px',
          background: '#F0F2F5',
          borderBottom: '1px solid #D1D7DB',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00A884, #10B981)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(0, 168, 132, 0.25)',
              flexShrink: 0
            }}>
              <MessageSquare size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111B21', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeBatchName}
                </h3>
                <span style={{ fontSize: 10.5, background: '#DCF8C6', color: '#075E54', padding: '1px 7px', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                  Active Cohort
                </span>
              </div>
              <p style={{ margin: '1px 0 0', fontSize: 12, color: '#667781', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeCourseName} &bull; Official Discussion Room
              </p>
            </div>
          </div>

          {/* Search in chat & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ position: 'relative', width: 170 }}>
              <input
                type="text"
                placeholder="Search chat..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '6px 26px 6px 28px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
              />
              <Search size={13} color="#8696A0" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }} />
              {searchQuery && (
                <X size={13} color="#8696A0" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>
            <button
              onClick={() => fetchMessages(false)}
              title="Refresh Messages"
              style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#54656F' }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* WhatsApp Chat Wallpaper & Scrollable Messages Feed (ONLY THIS SCROLLS) */}
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '16px 22px',
            background: '#EFEAE2',
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}
        >
          {/* Welcome Info Banner */}
          <div style={{ alignSelf: 'center', background: '#FFFFFF', border: '1px solid #D1D7DB', borderRadius: 8, padding: '8px 16px', maxWidth: 520, textAlign: 'center', color: '#54656F', fontSize: 12, boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)' }}>
            🔒 <strong>Messages are end-to-end recorded for batch academic learning.</strong> Tap any student name or avatar to view their detailed profile.
          </div>

          {loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading batch discussions...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <Users size={36} color="#8696A0" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 750, color: '#111B21' }}>
                {searchQuery ? 'No matching messages found' : `Welcome to ${activeBatchName}!`}
              </h4>
              <p style={{ margin: 0, fontSize: 12.5, color: '#667781', maxWidth: 360, margin: '0 auto' }}>
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

              const reactionEntries = Object.entries(msg.reactions || {}).filter(([_, uids]) => Array.isArray(uids) && uids.length > 0);
              const hasReactions = reactionEntries.length > 0;
              const isHovered = hoveredMessageId === msg.id;
              const isPickerOpen = activeReactionPickerId === msg.id;

              if (isSystem) {
                return (
                  <div key={msg.id || idx} style={{ alignSelf: 'center', background: '#FFFFFF', border: '1px solid #D1D7DB', borderRadius: 8, padding: '6px 14px', maxWidth: 500, textAlign: 'center', color: '#54656F', fontSize: 12, boxShadow: '0 1px 0.5px rgba(11,20,26,0.13)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{msg.senderName}</div>
                    <div>{msg.text}</div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || idx}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                  style={{
                    display: 'flex',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 10,
                    maxWidth: '82%',
                    position: 'relative',
                    marginBottom: 12
                  }}
                >
                  {/* Avatar for Incoming Messages (Student / Trainer / Admin Profile Pic) */}
                  {!isMe && (
                    <div
                      onClick={() => {
                        if (isAdminOrTrainer && isStudent) openStudentPreview(msg.senderId, msg.senderName);
                      }}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: isAdmin ? '#EDE9FE' : (isTrainer ? '#D1FAE5' : '#E0E7FF'),
                        color: isAdmin ? '#6D28D9' : (isTrainer ? '#047857' : '#3730A3'),
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        overflow: 'hidden'
                      }}
                      title={isAdminOrTrainer && isStudent ? "Click to view student profile" : msg.senderName}
                    >
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (msg.senderName || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                  )}

                  {/* Message Column: Author + Bubble + Bottom Likes/Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '100%' }}>
                    {/* Header: Sender Name & Role & Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11.5 }}>
                      <span
                        onClick={() => {
                          if (isAdminOrTrainer && isStudent) openStudentPreview(msg.senderId, msg.senderName);
                        }}
                        style={{
                          fontWeight: 750,
                          color: isMe ? '#059669' : (isAdmin ? '#7C3AED' : (isTrainer ? '#059669' : '#1E293B')),
                          cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default',
                          textDecoration: (isAdminOrTrainer && isStudent) ? 'underline' : 'none'
                        }}
                      >
                        {isMe ? 'You' : msg.senderName}
                      </span>

                      {isAdmin && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                          🛡️ ADMIN
                        </span>
                      )}
                      {isTrainer && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#D1FAE5', color: '#047857' }}>
                          🎓 TRAINER
                        </span>
                      )}
                      {isStudent && (
                        <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#E0E7FF', color: '#3730A3' }}>
                          🎒 STUDENT
                        </span>
                      )}

                      <span style={{ color: '#8696A0', fontSize: 10.5 }}>{timeDisplay}</span>
                    </div>

                    {/* WhatsApp Message Bubble Container */}
                    <div style={{
                      position: 'relative',
                      background: msg.isDeleted ? '#F0F2F5' : (isMe ? '#D9FDD3' : '#FFFFFF'),
                      color: '#111B21',
                      borderRadius: isMe ? '12px 2px 12px 12px' : '2px 12px 12px 12px',
                      padding: '8px 12px',
                      boxShadow: '0 1px 2px rgba(11,20,26,0.12)',
                      wordBreak: 'break-word',
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      border: msg.isDeleted ? '1px dashed #CBD5E1' : 'none',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Deleted Tombstone */}
                      {msg.isDeleted ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontStyle: 'italic', fontSize: 12.5, color: '#8696A0', padding: '2px 0' }}>
                          <Ban size={14} color="#8696A0" /> This message was deleted
                        </div>
                      ) : (
                        <>
                          {/* Sticker */}
                          {msg.sticker && (
                            <div style={{ fontSize: 44, margin: '2px 0 4px', lineHeight: 1 }}>
                              {msg.sticker}
                            </div>
                          )}

                          {/* Media Attachment */}
                          {msg.mediaUrl && (
                            <div style={{ margin: '4px 0 6px' }}>
                              {msg.mediaType === 'image' && (
                                <img
                                  src={msg.mediaUrl}
                                  alt={msg.fileName || 'Attachment'}
                                  onClick={() => setSelectedMediaModal(msg.mediaUrl)}
                                  style={{ maxWidth: 280, maxHeight: 240, borderRadius: 8, cursor: 'pointer', objectFit: 'cover', display: 'block' }}
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
                                    background: isMe ? 'rgba(0,0,0,0.05)' : '#F0F2F5',
                                    color: '#111B21',
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: 12.5
                                  }}
                                >
                                  <FileText size={18} color="#EF4444" />
                                  <span style={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {msg.fileName || 'Document.pdf'}
                                  </span>
                                  <Download size={14} color="#54656F" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Text & Inline Meta (Checkticks) */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <span style={{ flex: 1, whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                            {isMe && (
                              <span style={{ alignSelf: 'flex-end', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }} title={msg.isAllRead ? "Seen by all batch members" : "Delivered"}>
                                <CheckCheck size={14} color={msg.isAllRead ? "#53BDEB" : "#8696A0"} />
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Bottom Action Row: Direct Like / Emoji Buttons & Delete */}
                    {!msg.isDeleted && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 4,
                        padding: '0 2px'
                      }}>
                        {/* 4 Quick Emoji Reactions / Likes */}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {['👍', '❤️', '🔥', '👏'].map(emoji => {
                            const uids = msg.reactions?.[emoji] || [];
                            const count = uids.length;
                            const hasReacted = uids.includes(String(currentUserId));
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                style={{
                                  background: hasReacted ? '#DCF8C6' : '#FFFFFF',
                                  border: hasReacted ? '1px solid #00A884' : '1px solid #D1D7DB',
                                  borderRadius: 14,
                                  padding: '2px 7px',
                                  fontSize: 12,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                  transition: 'all 0.15s ease'
                                }}
                                title={`React with ${emoji}`}
                              >
                                <span>{emoji}</span>
                                {count > 0 && (
                                  <strong style={{ fontSize: 10, color: hasReacted ? '#075E54' : '#54656F' }}>
                                    {count}
                                  </strong>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* WhatsApp Delete for Everyone Button */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(msg)}
                            title={isAdminOrTrainer ? 'Delete for everyone (Moderator)' : 'Delete for everyone (Within 2 hours)'}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #D1D7DB',
                              color: '#EF4444',
                              borderRadius: 14,
                              padding: '3px 7px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Avatar for Outgoing Messages (Current User) */}
                  {isMe && (
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: '#DCF8C6',
                        color: '#075E54',
                        fontSize: 14,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                        overflow: 'hidden'
                      }}
                      title="You"
                    >
                      {currentUser.profile_pic || currentUser.profilePhotoUrl ? (
                        <img src={currentUser.profile_pic || currentUser.profilePhotoUrl} alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (currentUser.fullName || currentUser.name || 'Y').charAt(0).toUpperCase()
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Sticker Badge Preview */}
        {selectedSticker && (
          <div style={{ padding: '6px 18px', background: '#F0F2F5', borderTop: '1px solid #D1D7DB', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#54656F', fontWeight: 600 }}>Sticker attached:</span>
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
          <div style={{ padding: '8px 18px', background: '#F0F2F5', borderTop: '1px solid #D1D7DB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {attachment.mediaType === 'image' ? (
                <img src={attachment.previewUrl} alt="Preview" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <FileText size={22} color="#EF4444" />
              )}
              <div>
                <strong style={{ fontSize: 13, color: '#111B21' }}>{attachment.name}</strong>
                <span style={{ fontSize: 11, color: '#667781', marginLeft: 8 }}>({attachment.size}) &bull; Under 2MB ✓</span>
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
          <div style={{ padding: '10px 18px', background: '#FFFFFF', borderTop: '1px solid #D1D7DB', display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0, maxHeight: 120, overflowY: 'auto' }}>
            {STICKERS.map(s => (
              <button
                key={s.emoji}
                type="button"
                onClick={() => {
                  setSelectedSticker(s.emoji);
                  setShowStickerPicker(false);
                }}
                style={{
                  background: selectedSticker === s.emoji ? '#DCF8C6' : '#F0F2F5',
                  border: selectedSticker === s.emoji ? '1.5px solid #00A884' : '1px solid #E9EDEF',
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

        {/* Pinned WhatsApp Message Input Bar */}
        <form onSubmit={handleSendMessage} style={{
          padding: '10px 16px',
          background: '#F0F2F5',
          borderTop: '1px solid #D1D7DB',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0
        }}>
          {/* Sticker Button */}
          <button
            type="button"
            onClick={() => setShowStickerPicker(!showStickerPicker)}
            title="Attach Sticker"
            style={{ background: showStickerPicker ? '#DCF8C6' : '#FFFFFF', border: 'none', color: '#54656F', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
          >
            <Smile size={20} />
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Attach Document or Image (Max 2MB)"
            style={{ background: '#FFFFFF', border: 'none', color: '#54656F', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.08)' }}
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

          {/* Rounded Pill Text Input */}
          <input
            type="text"
            className="form-input"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Type a message in ${activeBatchName}...`}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: 24,
              border: 'none',
              background: '#FFFFFF',
              fontSize: 13.5,
              outline: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
            }}
          />

          {/* Circular WhatsApp Send Button */}
          <button
            type="submit"
            disabled={uploading || (!inputText.trim() && !attachment && !selectedSticker)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: '#00A884',
              color: '#FFFFFF',
              border: 'none',
              cursor: (uploading || (!inputText.trim() && !attachment && !selectedSticker)) ? 'not-allowed' : 'pointer',
              opacity: (uploading || (!inputText.trim() && !attachment && !selectedSticker)) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0, 168, 132, 0.4)',
              flexShrink: 0
            }}
          >
            <Send size={17} />
          </button>
        </form>
      </div>

      {/* ─── MODAL 1: RICH STUDENT DETAILS (FOR ADMIN & TRAINER) ─── */}
      {previewStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 20, 26, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 20px 50px rgba(0,0,0,0.25)', padding: 24, position: 'relative' }}>
            <button
              onClick={() => setPreviewStudent(null)}
              style={{ position: 'absolute', right: 16, top: 16, background: '#F0F2F5', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={15} color="#54656F" />
            </button>

            {loadingStudent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#00A884' }} />
                <p style={{ margin: 0, fontSize: 13, color: '#667781' }}>Loading student profile...</p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00A884, #059669)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 800,
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0, 168, 132, 0.25)'
                  }}>
                    {previewStudent.profile_pic || previewStudent.profilePhotoUrl ? (
                      <img src={previewStudent.profile_pic || previewStudent.profilePhotoUrl} alt={previewStudent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      previewStudent.name ? previewStudent.name.substring(0, 2).toUpperCase() : 'ST'
                    )}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111B21' }}>{previewStudent.name}</h3>
                    <code style={{ fontSize: 12, color: '#00A884', fontWeight: 700 }}>{previewStudent.rollNumber || previewStudent.id}</code>
                  </div>
                </div>

                {/* Details Table */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0', fontSize: 13, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Email:</span>
                    <a href={`mailto:${previewStudent.email}`} style={{ color: '#00A884', textDecoration: 'none', fontWeight: 700 }}>{previewStudent.email || '—'}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Mobile:</span>
                    <a href={`tel:${previewStudent.phone || previewStudent.mobile}`} style={{ color: '#111B21', textDecoration: 'none', fontWeight: 700 }}>{previewStudent.phone || previewStudent.mobile || '—'}</a>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Course:</span>
                    <span style={{ fontWeight: 700, color: '#111B21' }}>{previewStudent.course || 'Data Science & AI'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Batch Cohort:</span>
                    <span style={{ fontWeight: 700, color: '#00A884' }}>{previewStudent.batch_name || previewStudent.batch || activeBatchName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Fee Status:</span>
                    <span style={{ fontWeight: 700, color: (previewStudent.feesStatus === 'Paid') ? '#10B981' : '#EF4444' }}>
                      {previewStudent.feesStatus || 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Attendance:</span>
                    <span style={{ fontWeight: 700, color: '#2563EB' }}>
                      {previewStudent.attendance || 0}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 600 }}>Activity Score:</span>
                    <span style={{ fontWeight: 700, color: '#EC4899' }}>
                      {previewStudent.activityPoints || 0} pts
                    </span>
                  </div>
                  {(previewStudent.guardian_phone || previewStudent.guardian_name) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B', fontWeight: 600 }}>Guardian:</span>
                      <span style={{ fontWeight: 600, color: '#111B21' }}>
                        {previewStudent.guardian_name || ''} {previewStudent.guardian_phone ? `(${previewStudent.guardian_phone})` : ''}
                      </span>
                    </div>
                  )}
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
                      background: 'linear-gradient(135deg, #00A884, #059669)',
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
                      gap: 6
                    }}
                  >
                    View Full Student Dossier <ChevronRight size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: WHATSAPP DELETE CONFIRMATION MODAL ─── */}
      {deleteCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(11, 20, 26, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#FFFFFF', borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 22 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 800, color: '#111B21' }}>Delete message?</h4>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#667781', lineHeight: 1.5 }}>
              Delete for everyone will permanently replace this message with a deleted tombstone in the cohort feed.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#54656F', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDeleteForEveryone}
                style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#EF4444', color: '#FFFFFF', fontWeight: 700, fontSize: 12.5, cursor: deleting ? 'not-allowed' : 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete for Everyone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: LIGHTBOX PREVIEW ─── */}
      {selectedMediaModal && (
        <div
          onClick={() => setSelectedMediaModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
        >
          <img
            src={selectedMediaModal}
            alt="Enlarged"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
