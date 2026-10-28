import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Paperclip, Smile, Image as ImageIcon,
  FileText, Video, Trash2, Search, RefreshCw, X, Shield,
  Users, Check, Download, ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
];

export default function BatchChatPage({ user, userProfile, batches = [] }) {
  const currentUser = userProfile || user || {};
  const currentUserId = currentUser.id || currentUser.uid;
  const currentRole = (currentUser.role || 'student').toLowerCase();
  const isAdminOrTrainer = currentRole === 'admin' || currentRole === 'super_admin' || currentRole === 'trainer';

  const defaultBatchId = currentUser.batch_id || currentUser.batchId || (batches[0]?.id) || 'doc_1792663077641_40688aea';
  const [selectedBatchId, setSelectedBatchId] = useState(defaultBatchId);
  const batchId = selectedBatchId;
  const activeBatchObj = batches.find(b => String(b.id) === String(batchId));
  const batchName = activeBatchObj?.name || currentUser.batch_name || currentUser.batchName || 'lev-ai-05';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [attachment, setAttachment] = useState(null); // { file, previewUrl, mediaType, name, size }
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMediaModal, setSelectedMediaModal] = useState(null);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatScrollRef = useRef(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/messages/batch/${batchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.warn('[BatchChat] Fetch error:', err.message);
      if (!silent) setError('Unable to load batch messages.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 1-second active polling so messages arrive immediately
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 1000);

    const onFocus = () => fetchMessages(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [batchId]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    let mediaType = 'document';
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) mediaType = 'image';
    else if (['.mp4', '.webm', '.mov'].includes(ext)) mediaType = 'video';
    else if (ext === '.pdf') mediaType = 'pdf';

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
      const res = await fetch(`${API_BASE}/api/messages/batch/${batchId}`, {
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
      setTimeout(() => scrollToBottom(true), 80);
    } catch (err) {
      console.error('[BatchChat] Send message failed:', err);
      alert('Could not send message. Please try again.');
    }
  };

  const handleDeleteMessage = async (msgId, senderId) => {
    const isOwner = String(senderId) === String(currentUserId);
    if (!isAdminOrTrainer && !isOwner) {
      alert('You can only delete your own messages.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/messages/${msgId}?userId=${encodeURIComponent(currentUserId)}&userRole=${encodeURIComponent(currentRole)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Delete rejected');
      setMessages((prev) => prev.filter((m) => String(m.id) !== String(msgId)));
    } catch (err) {
      console.error('[BatchChat] Delete failed:', err);
      alert('Could not delete message.');
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

  return (
    <div className="batch-chat-layout" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      background: '#FFFFFF',
      borderRadius: 16,
      border: '1px solid #E2E8F0',
      boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      overflow: 'hidden'
    }}>
      {/* ── CHAT TOP HEADER ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #E5EAF2',
        background: '#FAFBFD',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4568F5 0%, #6366F1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(69, 104, 245, 0.28)'
          }}>
            <MessageSquare size={22} color="#FFFFFF" strokeWidth={2.2} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#172033' }}>
                Batch Discussion
              </h3>
              {batches && batches.length > 1 ? (
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    border: '1px solid #C7D2FE',
                    padding: '3px 10px',
                    borderRadius: 999,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.course_name || 'Batch'})</option>
                  ))}
                </select>
              ) : (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE',
                  padding: '2px 8px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
                  {batchName}
                </span>
              )}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
              Official classroom channel for students & trainers &bull; All batch discussions appear here
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '5px 10px',
            width: 180
          }}>
            <Search size={14} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                fontSize: 12,
                width: '100%',
                background: 'transparent'
              }}
            />
            {searchQuery && (
              <X size={13} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          <button
            onClick={() => fetchMessages(false)}
            title="Refresh Messages"
            style={{
              padding: '7px 11px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#475569'
            }}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── MESSAGES SCROLLABLE FEED ── */}
      <div
        ref={chatScrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
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
              {searchQuery ? 'No matching messages found' : 'Welcome to your Batch Chat!'}
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
            const canDelete = isAdminOrTrainer || isMe;

            const timeDisplay = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : '';

            if (isSystem) {
              return (
                <div
                  key={msg.id || idx}
                  style={{
                    alignSelf: 'center',
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 12,
                    padding: '10px 18px',
                    maxWidth: 580,
                    textAlign: 'center',
                    color: '#1E3A8A',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
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
                  gap: 12,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  flexDirection: isMe ? 'row-reverse' : 'row'
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: isTrainer ? '#3B82F6' : isAdmin ? '#8B5CF6' : isMe ? '#4568F5' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 13,
                  flexShrink: 0,
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}>
                  {msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt={msg.senderName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    msg.senderName ? msg.senderName[0].toUpperCase() : 'U'
                  )}
                </div>

                {/* Message Bubble Container */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  {/* Sender Name & Role Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11.5 }}>
                    <span style={{ fontWeight: 750, color: '#1E293B' }}>{msg.senderName}</span>
                    {isAdmin && (
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#EDE9FE', color: '#6D28D9' }}>
                        ADMIN
                      </span>
                    )}
                    {isTrainer && (
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 5px', borderRadius: 4, background: '#DBEAFE', color: '#1D4ED8' }}>
                        TRAINER
                      </span>
                    )}
                    <span style={{ color: '#94A3B8', fontSize: 11 }}>{timeDisplay}</span>
                  </div>

                  {/* Main Bubble Card */}
                  <div style={{
                    background: isMe ? '#4568F5' : '#FFFFFF',
                    color: isMe ? '#FFFFFF' : '#0F172A',
                    padding: '10px 14px',
                    borderRadius: isMe ? '14px 2px 14px 14px' : '2px 14px 14px 14px',
                    boxShadow: isMe ? '0 4px 14px rgba(69, 104, 245, 0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                    border: isMe ? 'none' : '1px solid #E2E8F0',
                    position: 'relative',
                    wordBreak: 'break-word',
                    fontSize: 13.5,
                    lineHeight: 1.5
                  }}>
                    {/* Sticker if present */}
                    {msg.sticker && (
                      <div style={{ fontSize: 44, margin: '2px 0 6px', lineHeight: 1 }}>
                        {msg.sticker}
                      </div>
                    )}

                    {/* Text Message */}
                    {msg.text && <div>{msg.text}</div>}

                    {/* Media Attachments */}
                    {msg.mediaUrl && (
                      <div style={{ marginTop: 8 }}>
                        {/* Image Preview */}
                        {msg.mediaType === 'image' && (
                          <div
                            onClick={() => setSelectedMediaModal({ url: `${API_BASE}${msg.mediaUrl}`, type: 'image', name: msg.fileName })}
                            style={{
                              borderRadius: 10,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              maxWidth: 320,
                              maxHeight: 240,
                              background: '#0F172A'
                            }}
                          >
                            <img
                              src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_BASE}${msg.mediaUrl}`}
                              alt={msg.fileName || 'Attachment'}
                              style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                          </div>
                        )}

                        {/* Video Player */}
                        {msg.mediaType === 'video' && (
                          <div style={{ borderRadius: 10, overflow: 'hidden', maxWidth: 360, background: '#000000' }}>
                            <video
                              controls
                              src={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_BASE}${msg.mediaUrl}`}
                              style={{ width: '100%', display: 'block' }}
                            />
                          </div>
                        )}

                        {/* PDF / Document Attachment */}
                        {msg.mediaType === 'pdf' || msg.mediaType === 'document' ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            background: isMe ? 'rgba(255,255,255,0.15)' : '#F1F5F9',
                            padding: '8px 12px',
                            borderRadius: 10,
                            maxWidth: 320
                          }}>
                            <FileText size={24} color={isMe ? '#FFFFFF' : '#EF4444'} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {msg.fileName || 'Document File'}
                              </div>
                              <div style={{ fontSize: 10.5, opacity: 0.8 }}>
                                {msg.fileSize || 'PDF File'}
                              </div>
                            </div>
                            <a
                              href={msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${API_BASE}${msg.mediaUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: isMe ? '#FFFFFF' : '#2563EB',
                                padding: 6,
                                borderRadius: 6,
                                background: isMe ? 'rgba(255,255,255,0.2)' : '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Download / View"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Reactions & Actions Row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                    flexWrap: 'wrap'
                  }}>
                    {/* Active reactions */}
                    {msg.reactions && Object.entries(msg.reactions).map(([emoji, userIds]) => {
                      if (!Array.isArray(userIds) || userIds.length === 0) return null;
                      const hasReacted = userIds.includes(currentUserId);
                      return (
                        <button
                          key={emoji}
                          onClick={() => handleToggleReaction(msg.id, emoji)}
                          style={{
                            border: hasReacted ? '1px solid #4568F5' : '1px solid #E2E8F0',
                            background: hasReacted ? '#EEF2FF' : '#FFFFFF',
                            borderRadius: 12,
                            padding: '2px 6px',
                            fontSize: 11,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <span>{emoji}</span>
                          <span style={{ fontWeight: 700, color: hasReacted ? '#4568F5' : '#64748B' }}>{userIds.length}</span>
                        </button>
                      );
                    })}

                    {/* Quick Reaction buttons */}
                    <div style={{ display: 'inline-flex', gap: 3, opacity: 0.7 }}>
                      {['👍', '🔥', '💡'].map((em) => (
                        <button
                          key={em}
                          onClick={() => handleToggleReaction(msg.id, em)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: 12,
                            padding: '1px 3px'
                          }}
                          title={`React with ${em}`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    {/* Delete button: Author OR Admin/Trainer */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id, msg.senderId)}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          color: '#EF4444',
                          cursor: 'pointer',
                          padding: '2px 4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          opacity: 0.7,
                          transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
                        title="Delete Message"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── ATTACHMENT PREVIEW TRAY ── */}
      {attachment && (
        <div style={{
          padding: '8px 16px',
          background: '#F1F5F9',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {attachment.mediaType === 'image' && (
              <img src={attachment.previewUrl} alt="Preview" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
            )}
            {attachment.mediaType === 'video' && <Video size={24} color="#3B82F6" />}
            {attachment.mediaType === 'pdf' && <FileText size={24} color="#EF4444" />}
            {attachment.mediaType === 'document' && <FileText size={24} color="#64748B" />}

            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1E293B', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {attachment.name}
              </div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{attachment.size}</div>
            </div>
          </div>

          <button
            onClick={() => setAttachment(null)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── STICKER PICKER POPUP ── */}
      {showStickerPicker && (
        <div style={{
          padding: '12px 16px',
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' }}>
            Choose Sticker:
          </span>
          {STICKERS.map((st) => (
            <button
              key={st.emoji}
              onClick={() => {
                setSelectedSticker(st.emoji);
                setShowStickerPicker(false);
              }}
              style={{
                fontSize: 24,
                border: selectedSticker === st.emoji ? '2px solid #4568F5' : '1px solid #E2E8F0',
                background: '#F8FAFC',
                borderRadius: 10,
                padding: '4px 8px',
                cursor: 'pointer',
                transition: 'transform 0.1s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              title={st.label}
            >
              {st.emoji}
            </button>
          ))}
          <button
            onClick={() => setShowStickerPicker(false)}
            style={{ border: 'none', background: 'transparent', color: '#64748B', cursor: 'pointer', marginLeft: 'auto' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ── MESSAGE INPUT TOOLBAR ── */}
      <form onSubmit={handleSendMessage} style={{
        padding: '12px 18px',
        borderTop: '1px solid #E2E8F0',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*,video/*,application/pdf,.docx,.txt"
          onChange={handleFileSelect}
        />

        {/* Paperclip Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: 'none',
            background: '#F1F5F9',
            width: 38,
            height: 38,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#475569',
            transition: 'all 0.15s ease'
          }}
          title="Attach Image, Video, or PDF Document"
        >
          <Paperclip size={18} />
        </button>

        {/* Sticker Picker Button */}
        <button
          type="button"
          onClick={() => setShowStickerPicker(!showStickerPicker)}
          style={{
            border: 'none',
            background: selectedSticker ? '#EEF2FF' : '#F1F5F9',
            color: selectedSticker ? '#4568F5' : '#475569',
            width: 38,
            height: 38,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: selectedSticker ? 18 : 15,
            transition: 'all 0.15s ease'
          }}
          title="Send Quick Sticker"
        >
          {selectedSticker || <Smile size={18} />}
        </button>

        {/* Text Input */}
        <input
          type="text"
          placeholder={`Message #${batchName}... (Press Enter to send)`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={uploading}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: 10,
            border: '1.5px solid #E2E8F0',
            outline: 'none',
            fontSize: 13.5,
            color: '#1E293B',
            background: '#F8FAFC'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4568F5'; e.currentTarget.style.background = '#FFFFFF'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={uploading || (!inputText.trim() && !attachment && !selectedSticker)}
          style={{
            background: 'linear-gradient(135deg, #4568F5 0%, #6366F1 100%)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: (inputText.trim() || attachment || selectedSticker) ? 'pointer' : 'default',
            opacity: (inputText.trim() || attachment || selectedSticker) ? 1 : 0.6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: '0 2px 8px rgba(69, 104, 245, 0.3)'
          }}
        >
          {uploading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Send size={14} /> Send
            </>
          )}
        </button>
      </form>

      {/* ── IMAGE LIGHTBOX MODAL ── */}
      {selectedMediaModal && (
        <div
          onClick={() => setSelectedMediaModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <div style={{ maxWidth: '90vw', maxHeight: '90vh', position: 'relative' }}>
            <img
              src={selectedMediaModal.url}
              alt="Full Preview"
              style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 8, display: 'block' }}
            />
            <button
              onClick={() => setSelectedMediaModal(null)}
              style={{
                position: 'absolute',
                top: -12,
                right: -12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#EF4444',
                color: '#FFF',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
