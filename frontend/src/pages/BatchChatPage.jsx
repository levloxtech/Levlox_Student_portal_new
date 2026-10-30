import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Send, Paperclip, Smile, Image as ImageIcon,
  FileText, Trash2, Search, RefreshCw, X, Shield,
  Users, CheckCheck, Download, ExternalLink, Sparkles, AlertCircle,
  Ban, Clock, ChevronRight, GraduationCap, Phone, Mail, User,
  CheckCircle2, AlertTriangle, Layers, MoreVertical, Heart, Folder,
  Link as LinkIcon, ChevronDown, Check, Eye
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

  // Right sidebar view mode: 'chat_only' | 'shared_files' | 'participants'
  const [activeRightTab, setActiveRightTab] = useState('shared_files');
  const [showRightSidebar, setShowRightSidebar] = useState(true);

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
  const activeCourseName = activeBatchObj?.course_name || activeBatchObj?.courseName || activeBatchObj?.course || 'Data Science & AI';

  // Chat messages state
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaModal, setSelectedMediaModal] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [activeReactionPickerId, setActiveReactionPickerId] = useState(null);

  // Quick View Student Modal State (Admin / Trainer)
  const [previewStudent, setPreviewStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Delete Modal State
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
      const interval = setInterval(() => fetchMessages(true), 2500);
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
      alert(`⚠️ File size exceeds the 2MB limit. (Selected file: ${(file.size / (1024 * 1024)).toFixed(2)} MB)\nPlease choose a file under 2MB.`);
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
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUserId, userRole: currentRole })
        }
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

  // Instant Reaction Toggle (with optimistic update)
  const handleToggleReaction = async (msgId, emoji) => {
    setActiveReactionPickerId(null);
    const uidStr = String(currentUserId);

    // Optimistic UI update
    setMessages(prev => prev.map(m => {
      if (String(m.id) !== String(msgId)) return m;
      const currentReactions = { ...(m.reactions || {}) };
      const list = [...(currentReactions[emoji] || [])];
      const idx = list.indexOf(uidStr);
      if (idx >= 0) {
        list.splice(idx, 1);
        if (list.length === 0) delete currentReactions[emoji];
        else currentReactions[emoji] = list;
      } else {
        list.push(uidStr);
        currentReactions[emoji] = list;
      }
      return { ...m, reactions: currentReactions };
    }));

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

  // Calculate dynamic stats for right sidebar
  const sharedDocs = messages.filter(m => m.mediaType === 'pdf' || m.mediaType === 'document');
  const sharedImages = messages.filter(m => m.mediaType === 'image');
  const allSharedCount = sharedDocs.length + sharedImages.length;

  const currentUserName = currentUser.fullName || currentUser.name || currentUser.displayName || (isAdminOrTrainer ? (currentRole === 'trainer' ? 'Instructor' : 'Admin Director') : 'Student Scholar');

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 120px)',
      maxHeight: 'calc(100vh - 120px)',
      minHeight: 560,
      width: '100%',
      background: '#F8FAFC',
      borderRadius: 24,
      border: '1px solid #E2E8F0',
      boxShadow: '0 10px 35px -5px rgba(0,0,0,0.05)',
      overflow: 'hidden',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* ─── LEFT PANEL: PROFILE + SEARCH + COHORTS LIST ─── */}
      <aside style={{
        width: 290,
        background: '#FFFFFF',
        borderRight: '1px solid #EEF2F6',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Top Header Card: User Avatar + Name + Available Status */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 750, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={16} color="#0D9488" /> Chat
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#F0FDFA',
              color: '#0D9488',
              border: '1px solid #CCFBF1'
            }}>
              {allBatches.length} Cohorts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '4px 0 8px' }}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)',
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                overflow: 'hidden'
              }}>
                {currentUser.profile_pic || currentUser.profilePhotoUrl ? (
                  <img src={currentUser.profile_pic || currentUser.profilePhotoUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  currentUserName.charAt(0).toUpperCase()
                )}
              </div>
              <span style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #FFFFFF'
              }} />
            </div>

            <h4 style={{ margin: '0 0 4px', fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
              {currentUserName}
            </h4>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#DCFCE7',
              color: '#15803D',
              padding: '2px 9px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700
            }}>
              available <ChevronDown size={11} />
            </div>
          </div>

          {/* Search Cohorts Input */}
          <div style={{ position: 'relative', marginTop: 12 }}>
            <input
              type="text"
              placeholder="Search..."
              value={batchSearch}
              onChange={e => setBatchSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 999,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                fontSize: 12.5,
                outline: 'none',
                color: '#1E293B',
                boxSizing: 'border-box'
              }}
            />
            <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>

        {/* Cohort List Header */}
        <div style={{ padding: '10px 18px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 750, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
            Last chats
          </span>
          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{filteredBatches.length} active</span>
        </div>

        {/* Cohort Scrollable List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filteredBatches.map(b => {
            const isSelected = String(b.id) === String(selectedBatchId) || String(b.uid) === String(selectedBatchId);
            return (
              <div
                key={b.id || b.uid}
                onClick={() => {
                  if (isAdminOrTrainer) setSelectedBatchId(String(b.id || b.uid));
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 14,
                  cursor: isAdminOrTrainer ? 'pointer' : 'default',
                  background: isSelected ? '#F1F5F9' : 'transparent',
                  borderLeft: isSelected ? '4px solid #0D9488' : '4px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Cohort Avatar */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: isSelected ? '#CCFBF1' : '#F1F5F9',
                  color: isSelected ? '#0D9488' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0
                }}>
                  {b.name ? b.name.charAt(0).toUpperCase() : 'B'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? '#0F172A' : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {b.name || 'Cohort Batch'}
                    </h5>
                    <span style={{ fontSize: 10.5, color: '#94A3B8', flexShrink: 0, marginLeft: 6 }}>
                      {b.lastActive || '11:15'}
                    </span>
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: 11.5,
                    color: isSelected ? '#0D9488' : '#64748B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: isSelected ? 600 : 500
                  }}>
                    {b.course_name || 'Academic Batch Discussion'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ─── CENTER PANEL: GROUP CHAT FEED ─── */}
      <section style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#FFFFFF',
        position: 'relative'
      }}>
        {/* Top Chat Header */}
        <header style={{
          height: 64,
          padding: '0 24px',
          borderBottom: '1px solid #EEF2F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeBatchName}
            </h3>
            <span style={{ fontSize: 12, color: '#64748B' }}>
              {activeCourseName} &bull; Official Discussion
            </span>
          </div>

          {/* Right Header Navigation Pill Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Messages / Shared Files Toggle Tabs */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F1F5F9',
              padding: 3,
              borderRadius: 999
            }}>
              <button
                type="button"
                onClick={() => { setActiveRightTab('chat_only'); setShowRightSidebar(false); }}
                style={{
                  border: 'none',
                  background: activeRightTab === 'chat_only' && !showRightSidebar ? '#0D9488' : 'transparent',
                  color: activeRightTab === 'chat_only' && !showRightSidebar ? '#FFFFFF' : '#64748B',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Messages
              </button>
              <button
                type="button"
                onClick={() => { setActiveRightTab('shared_files'); setShowRightSidebar(true); }}
                style={{
                  border: 'none',
                  background: showRightSidebar && activeRightTab === 'shared_files' ? '#0D9488' : 'transparent',
                  color: showRightSidebar && activeRightTab === 'shared_files' ? '#FFFFFF' : '#64748B',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Shared Files
              </button>
              <button
                type="button"
                onClick={() => { setActiveRightTab('participants'); setShowRightSidebar(true); }}
                style={{
                  border: 'none',
                  background: showRightSidebar && activeRightTab === 'participants' ? '#0D9488' : 'transparent',
                  color: showRightSidebar && activeRightTab === 'participants' ? '#FFFFFF' : '#64748B',
                  padding: '5px 14px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Participants
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchMessages(false)}
              title="Refresh Messages"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid #E2E8F0',
                background: '#FFFFFF',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </header>

        {/* Chat Message Scrollable Stream */}
        <div
          ref={chatScrollRef}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '24px 28px',
            background: '#F8FAFC',
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {loading && messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0D9488' }} />
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading cohort discussion...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: '#64748B' }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#F0FDFA',
                color: '#0D9488',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px'
              }}>
                <MessageSquare size={24} />
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                {searchQuery ? 'No matching messages found' : `Welcome to ${activeBatchName}`}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                {searchQuery ? 'Try another keyword.' : 'Start the conversation with your instructor and cohort peers.'}
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
                ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                : '';

              const reactionEntries = Object.entries(msg.reactions || {}).filter(([_, uids]) => Array.isArray(uids) && uids.length > 0);
              const hasReactions = reactionEntries.length > 0;
              const isHovered = hoveredMessageId === msg.id;
              const isPickerOpen = activeReactionPickerId === msg.id;

              const hasLiked = (msg.reactions?.['❤️'] || []).includes(String(currentUserId));

              if (isSystem) {
                return (
                  <div key={msg.id || idx} style={{ alignSelf: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 999, padding: '6px 16px', color: '#64748B', fontSize: 12, fontWeight: 600 }}>
                    {msg.text}
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
                    maxWidth: '78%',
                    position: 'relative',
                    marginBottom: hasReactions ? 10 : 2
                  }}
                >
                  {/* Left Avatar for Incoming Messages */}
                  {!isMe && (
                    <div
                      onClick={() => {
                        if (isAdminOrTrainer && isStudent) openStudentPreview(msg.senderId, msg.senderName);
                      }}
                      title={isAdminOrTrainer && isStudent ? "Click to view student profile" : msg.senderName}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: isAdmin ? '#F5F3FF' : (isTrainer ? '#ECFDF5' : '#EEF2FF'),
                        color: isAdmin ? '#7C3AED' : (isTrainer ? '#059669' : '#4F46E5'),
                        fontSize: 13,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 18,
                        cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                        overflow: 'hidden'
                      }}
                    >
                      {msg.senderAvatar ? (
                        <img src={msg.senderAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (msg.senderName || 'U').charAt(0).toUpperCase()
                      )}
                    </div>
                  )}

                  {/* Main Bubble + Header Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                    {/* Header: Author Name + Timestamp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11.5 }}>
                      {isMe ? (
                        <span style={{ color: '#94A3B8', fontWeight: 600 }}>You, {timeDisplay}</span>
                      ) : (
                        <>
                          <span
                            onClick={() => {
                              if (isAdminOrTrainer && isStudent) openStudentPreview(msg.senderId, msg.senderName);
                            }}
                            style={{
                              fontWeight: 750,
                              color: '#0F172A',
                              cursor: (isAdminOrTrainer && isStudent) ? 'pointer' : 'default'
                            }}
                          >
                            {msg.senderName}
                          </span>
                          {isAdmin && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                              ADMIN
                            </span>
                          )}
                          {isTrainer && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#D1FAE5', color: '#047857' }}>
                              TRAINER
                            </span>
                          )}
                          {isStudent && (
                            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 6px', borderRadius: 4, background: '#E0E7FF', color: '#3730A3' }}>
                              STUDENT
                            </span>
                          )}
                          <span style={{ color: '#94A3B8' }}>{timeDisplay}</span>
                        </>
                      )}
                    </div>

                    {/* Bubble Container */}
                    <div style={{
                      position: 'relative',
                      background: msg.isDeleted ? '#F1F5F9' : (isMe ? '#EEF2FF' : '#FFFFFF'),
                      color: '#0F172A',
                      borderRadius: isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      padding: '10px 14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      border: msg.isDeleted ? '1px dashed #CBD5E1' : (isMe ? '1px solid #E0E7FF' : '1px solid #EEF2F6'),
                      wordBreak: 'break-word',
                      fontSize: 13.5,
                      lineHeight: 1.5,
                      minWidth: 60
                    }}>
                      {/* Deleted Tombstone */}
                      {msg.isDeleted ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontStyle: 'italic', fontSize: 12.5, color: '#94A3B8' }}>
                          <Ban size={14} color="#94A3B8" /> This message was deleted
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
                                  style={{ maxWidth: 320, maxHeight: 260, borderRadius: 12, cursor: 'pointer', objectFit: 'cover', display: 'block' }}
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
                                    background: isMe ? '#FFFFFF' : '#F8FAFC',
                                    color: '#0F172A',
                                    padding: '8px 12px',
                                    borderRadius: 10,
                                    border: '1px solid #E2E8F0',
                                    textDecoration: 'none',
                                    fontWeight: 600,
                                    fontSize: 12.5
                                  }}
                                >
                                  <FileText size={18} color="#EF4444" />
                                  <span style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {msg.fileName || 'Document.pdf'}
                                  </span>
                                  <Download size={14} color="#64748B" />
                                </a>
                              )}
                            </div>
                          )}

                          {/* Message Text */}
                          {msg.text && (
                            <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                          )}

                          {/* Read Receipts for Outgoing messages */}
                          {isMe && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                              <span title={msg.isAllRead ? "Seen by all cohort members" : "Delivered"}>
                                <CheckCheck size={14} color={msg.isAllRead ? "#0284C7" : "#94A3B8"} />
                              </span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Attached Reactions Badge */}
                      {hasReactions && !msg.isDeleted && (
                        <div
                          onClick={() => setActiveReactionPickerId(isPickerOpen ? null : msg.id)}
                          style={{
                            position: 'absolute',
                            bottom: -11,
                            [isMe ? 'right' : 'left']: 8,
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: 999,
                            padding: '1px 7px',
                            fontSize: 11,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            zIndex: 2,
                            cursor: 'pointer'
                          }}
                        >
                          {reactionEntries.map(([emoji, uids]) => (
                            <span key={emoji} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                              {emoji} {uids.length > 1 && <strong style={{ fontSize: 10, color: '#64748B' }}>{uids.length}</strong>}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ─── ACTION TOOLBAR (LIKE, REACT, DELETE, INFO) ─── */}
                    {!msg.isDeleted && (
                      <div style={{
                        position: 'absolute',
                        top: -12,
                        [isMe ? 'left' : 'right']: -8,
                        transform: isMe ? 'translateX(-100%)' : 'translateX(100%)',
                        display: (isHovered || isPickerOpen) ? 'flex' : 'none',
                        alignItems: 'center',
                        gap: 3,
                        background: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 999,
                        padding: '2px 5px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        zIndex: 10
                      }}>
                        {/* 1-Click Instant Like / Heart Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleReaction(msg.id, '❤️')}
                          title={hasLiked ? "Unlike" : "Like with Heart"}
                          style={{
                            background: hasLiked ? '#FEE2E2' : 'transparent',
                            border: 'none',
                            color: hasLiked ? '#DC2626' : '#64748B',
                            cursor: 'pointer',
                            padding: '3px 4px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Heart size={13} fill={hasLiked ? "#DC2626" : "none"} />
                        </button>

                        {/* Reaction Picker Popover Trigger */}
                        <button
                          type="button"
                          onClick={() => setActiveReactionPickerId(isPickerOpen ? null : msg.id)}
                          title="More reactions"
                          style={{
                            background: isPickerOpen ? '#F1F5F9' : 'transparent',
                            border: 'none',
                            color: '#64748B',
                            cursor: 'pointer',
                            padding: '3px 4px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <Smile size={13} />
                        </button>

                        {/* Admin/Trainer: View Student Dossier */}
                        {isAdminOrTrainer && isStudent && (
                          <button
                            type="button"
                            onClick={() => openStudentPreview(msg.senderId, msg.senderName)}
                            title="View Student Profile"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#0D9488',
                              cursor: 'pointer',
                              padding: '3px 4px',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Eye size={13} />
                          </button>
                        )}

                        {/* Delete For Everyone Button */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(msg)}
                            title={isAdminOrTrainer ? "Delete for everyone (Moderator)" : "Delete for everyone (Within 2 hrs)"}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#EF4444',
                              cursor: 'pointer',
                              padding: '3px 4px',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    )}

                    {/* Quick Reactions Strip Popover */}
                    {isPickerOpen && !msg.isDeleted && (
                      <div style={{
                        position: 'absolute',
                        top: -38,
                        [isMe ? 'right' : 'left']: 0,
                        background: '#FFFFFF',
                        borderRadius: 999,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 8px',
                        zIndex: 20
                      }}>
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleToggleReaction(msg.id, emoji)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              fontSize: 16,
                              cursor: 'pointer',
                              padding: '2px 4px',
                              transition: 'transform 0.1s ease'
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Selected Sticker Badge */}
        {selectedSticker && (
          <div style={{ padding: '6px 20px', background: '#F8FAFC', borderTop: '1px solid #EEF2F6', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Sticker attached:</span>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{selectedSticker}</span>
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
          <div style={{ padding: '8px 20px', background: '#F8FAFC', borderTop: '1px solid #EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {attachment.mediaType === 'image' ? (
                <img src={attachment.previewUrl} alt="Preview" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
              ) : (
                <FileText size={22} color="#EF4444" />
              )}
              <div>
                <strong style={{ fontSize: 13, color: '#0F172A' }}>{attachment.name}</strong>
                <span style={{ fontSize: 11, color: '#64748B', marginLeft: 8 }}>({attachment.size}) &bull; &lt;2MB ✓</span>
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

        {/* Sticker Picker Drawer */}
        {showStickerPicker && (
          <div style={{ padding: '10px 18px', background: '#FFFFFF', borderTop: '1px solid #EEF2F6', display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0, maxHeight: 110, overflowY: 'auto' }}>
            {STICKERS.map(s => (
              <button
                key={s.emoji}
                type="button"
                onClick={() => {
                  setSelectedSticker(s.emoji);
                  setShowStickerPicker(false);
                }}
                style={{
                  background: selectedSticker === s.emoji ? '#CCFBF1' : '#F8FAFC',
                  border: selectedSticker === s.emoji ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                  borderRadius: 8,
                  fontSize: 20,
                  padding: '5px 8px',
                  cursor: 'pointer'
                }}
                title={s.label}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        )}

        {/* ─── BOTTOM INPUT BAR: PILL DESIGN (MATCHING REFERENCE IMAGE) ─── */}
        <div style={{ padding: '14px 20px', background: '#FFFFFF', borderTop: '1px solid #EEF2F6', flexShrink: 0 }}>
          <form
            onSubmit={handleSendMessage}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 999,
              padding: '6px 8px 6px 18px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}
          >
            <input
              type="text"
              placeholder="Write your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13.5,
                color: '#0F172A'
              }}
            />

            {/* Sticker Button */}
            <button
              type="button"
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              style={{
                background: showStickerPicker ? '#CCFBF1' : 'transparent',
                border: 'none',
                color: showStickerPicker ? '#0D9488' : '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Smile size={18} />
            </button>

            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.zip"
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Paperclip size={18} />
            </button>

            {/* Solid Teal Send Button */}
            <button
              type="submit"
              disabled={uploading || (!inputText.trim() && !attachment && !selectedSticker)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                border: 'none',
                background: (inputText.trim() || attachment || selectedSticker) ? '#0D9488' : '#CBD5E1',
                color: '#FFFFFF',
                cursor: (inputText.trim() || attachment || selectedSticker) ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: (inputText.trim() || attachment || selectedSticker) ? '0 2px 8px rgba(13, 148, 136, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Send size={15} style={{ marginLeft: 2 }} />
            </button>
          </form>
        </div>
      </section>

      {/* ─── RIGHT PANEL: "SHARED FILES" & BATCH PARTICIPANTS (MATCHING REFERENCE IMAGE) ─── */}
      {showRightSidebar && (
        <aside style={{
          width: 280,
          background: '#FFFFFF',
          borderLeft: '1px solid #EEF2F6',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0
        }}>
          {/* Header */}
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              {activeRightTab === 'participants' ? 'Participants' : 'Shared files'}
            </span>
            <button
              onClick={() => setShowRightSidebar(false)}
              style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Cohort Banner Card */}
            <div style={{ textAlign: 'center', padding: '6px 0 12px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}>
                {activeBatchName.charAt(0).toUpperCase()}
              </div>
              <h4 style={{ margin: '0 0 3px', fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                {activeBatchName}
              </h4>
              <span style={{ fontSize: 12, color: '#64748B' }}>
                {activeBatchObj?.students?.length || 10} members
              </span>
            </div>

            {/* Quick Metrics Cards (Green & Blue) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{
                background: '#F0FDFA',
                border: '1px solid #CCFBF1',
                borderRadius: 14,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0D9488', marginBottom: 6 }}>
                  <Folder size={16} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>All files</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  {allSharedCount}
                </div>
              </div>

              <div style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 14,
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569', marginBottom: 6 }}>
                  <LinkIcon size={16} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Resources</span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>
                  {messages.filter(m => m.mediaUrl).length}
                </div>
              </div>
            </div>

            {/* File Types Breakdown */}
            <div>
              <span style={{ fontSize: 11.5, fontWeight: 750, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: 10 }}>
                File type
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Documents */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#F8FAFC', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF2FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 750, color: '#0F172A' }}>Documents</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>{sharedDocs.length} files</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="#94A3B8" />
                </div>

                {/* Photos */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: '#F8FAFC', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 750, color: '#0F172A' }}>Photos</div>
                      <div style={{ fontSize: 10.5, color: '#64748B' }}>{sharedImages.length} files</div>
                    </div>
                  </div>
                  <ChevronRight size={14} color="#94A3B8" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* ─── MODAL 1: STUDENT PROFILE DOSSIER (ADMIN & TRAINER) ─── */}
      {previewStudent && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#FFFFFF', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', background: '#0F172A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <GraduationCap size={18} color="#A7F3D0" />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Student Dossier</h4>
              </div>
              <button onClick={() => setPreviewStudent(null)} style={{ background: 'transparent', border: 'none', color: '#CBD5E1', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0D9488', color: '#FFFFFF', fontSize: 18, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(previewStudent.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 2px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{previewStudent.name}</h4>
                  <span style={{ fontSize: 12, color: '#64748B' }}>ID: {previewStudent.student_id || previewStudent.id || 'N/A'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, background: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Enrolled Course:</span>
                  <strong style={{ color: '#0F172A' }}>{previewStudent.course || activeCourseName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Batch Cohort:</span>
                  <strong style={{ color: '#0D9488' }}>{previewStudent.batch || activeBatchName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Fee Clearance:</span>
                  <strong style={{ color: previewStudent.feesStatus === 'Paid' ? '#059669' : '#D97706' }}>
                    {previewStudent.feesStatus || 'Clearance Active'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: DELETE CONFIRMATION MODAL ─── */}
      {deleteCandidate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 380, background: '#FFFFFF', borderRadius: 18, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: 22 }}>
            <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Delete message?</h4>
            <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
              This message will be removed for everyone in the cohort and marked with a deleted tombstone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#64748B', fontWeight: 600, fontSize: 12.5, cursor: 'pointer' }}
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
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
}
