import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Video, Megaphone, Info, ExternalLink, X, Smartphone } from 'lucide-react';
import { subscribeNotifications, markNotificationRead } from '../services/firebaseService';
import { showDeviceNotification, requestDeviceNotificationPermission } from '../utils/browserNotifications';

/**
 * Format relative time for notifications.
 */
function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

/**
 * Reusable Real-time Notification Bell component.
 *
 * @param {Object} props
 * @param {string} props.userId - Current logged-in user's UID
 * @param {string} [props.userRole] - Role of the user ('admin' | 'trainer' | 'student')
 */
export default function NotificationBell({ userId, userRole = 'student' }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);
  const seenIds = useRef(new Set());
  const initialLoadDone = useRef(false);
  const [devicePerm, setDevicePerm] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeNotifications(
      userId,
      (snapshot) => {
        let items = [];
        if (snapshot && Array.isArray(snapshot.docs)) {
          items = snapshot.docs.map((d) => ({
            id: d.id,
            ...(typeof d.data === 'function' ? d.data() : d),
          }));
        } else if (Array.isArray(snapshot)) {
          items = snapshot;
        }

        // Strictly filter to notifications addressed to this logged-in user
        items = items.filter((n) => !n.userId || String(n.userId) === String(userId));

        // Deduplicate notifications for the same class & type so user never gets spam
        const seenClassTypes = new Set();
        items = items.filter((n) => {
          if (n.data?.classId && n.type) {
            const key = `${n.data.classId}_${n.type}`;
            if (seenClassTypes.has(key)) return false;
            seenClassTypes.add(key);
          }
          return true;
        });

        // Trigger native device notification for new unread live class alerts
        if (initialLoadDone.current) {
          items.forEach((n) => {
            if (!n.read && !seenIds.current.has(n.id)) {
              if (n.type === 'live_class' || n.type === 'live_class_5min' || n.type === 'live_class_10min') {
                showDeviceNotification(n.title || '🚨 Live Class Alert', {
                  body: n.message || 'Live class scheduled. Check your portal for details.',
                  url: '/student/my-courses',
                });
              }
            }
          });
        }

        items.forEach((n) => seenIds.current.add(n.id));
        initialLoadDone.current = true;
        setNotifications(items);
      },
      (err) => {
        console.warn('[NotificationBell] Subscription error:', err.message);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [userId]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (notifId, e) => {
    if (e) e.stopPropagation();
    try {
      await markNotificationRead(notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error('[NotificationBell] Mark read failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    try {
      await Promise.all(unread.map((n) => markNotificationRead(n.id)));
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('[NotificationBell] Mark all read failed:', err);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    // If it's a live class notification, always direct to the Live Classes portal tab
    // NEVER open Google Meet / Zoom directly from the notification so the 5-min unlock rule cannot be bypassed!
    if (notif.type && (notif.type.startsWith('live_class') || notif.type.includes('live_class'))) {
      if (userRole === 'student') {
        navigate('/student/my-courses');
      } else if (userRole === 'trainer') {
        navigate('/trainer/live-classes');
      } else {
        navigate('/admin');
      }
      return;
    }

    if (notif.link) {
      if (notif.link.startsWith('/')) {
        navigate(notif.link);
      } else {
        window.open(notif.link, '_blank');
      }
    }
  };

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getNotifIcon = (type) => {
    switch (type) {
      case 'live_class':
        return <Video size={16} style={{ color: '#0284c7' }} />;
      case 'announcement':
        return <Megaphone size={16} style={{ color: '#f59e0b' }} />;
      default:
        return <Info size={16} style={{ color: '#6366f1' }} />;
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        style={{
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-light, #e2e8f0)',
          borderRadius: '10px',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative',
          color: 'var(--text-secondary, #475569)',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary-color, #4f46e5)')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-light, #e2e8f0)')}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 0 2px #ffffff',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '48px',
            width: '360px',
            maxWidth: '90vw',
            backgroundColor: 'var(--bg-card, #ffffff)',
            borderRadius: '14px',
            border: '1px solid var(--border-light, #e2e8f0)',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
            zIndex: 1000,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-header, #f8fafc)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary, #0f172a)' }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#e0e7ff',
                    color: '#4338ca',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color, #4f46e5)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 6px',
                  borderRadius: '4px',
                }}
                title="Mark all as read"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Mobile / Device Notification Permission Banner */}
          {devicePerm === 'default' && (
            <div
              style={{
                padding: '10px 14px',
                background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
                borderBottom: '1px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#3730A3', fontWeight: 600 }}>
                <Smartphone size={16} />
                <span>Get 10-min live class alerts on this device</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await requestDeviceNotificationPermission();
                  setDevicePerm(res);
                  if (res === 'granted') {
                    showDeviceNotification('🔔 Reminders Enabled!', {
                      body: 'You will receive notifications 10 minutes before your live classes start.',
                    });
                  }
                }}
                style={{
                  background: 'var(--primary-color, #4F46E5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Enable
              </button>
            </div>
          )}

          {/* Quick Filter Bar */}
          <div
            style={{
              padding: '8px 16px',
              display: 'flex',
              gap: '8px',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
              background: '#ffffff',
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                background: filter === 'all' ? 'var(--primary-color, #4f46e5)' : '#f1f5f9',
                color: filter === 'all' ? '#ffffff' : 'var(--text-secondary, #64748b)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                background: filter === 'unread' ? 'var(--primary-color, #4f46e5)' : '#f1f5f9',
                color: filter === 'unread' ? '#ffffff' : 'var(--text-secondary, #64748b)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notification List */}
          <div
            style={{
              maxHeight: '380px',
              overflowY: 'auto',
              padding: '4px 0',
            }}
          >
            {filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 16px',
                  textAlign: 'center',
                  color: 'var(--text-secondary, #94a3b8)',
                  fontSize: '13px',
                }}
              >
                <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ margin: 0 }}>No notifications to display</p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: notif.link ? 'pointer' : 'default',
                    backgroundColor: notif.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                    borderBottom: '1px solid var(--border-light, #f8fafc)',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notif.read
                      ? '#f8fafc'
                      : 'rgba(99, 102, 241, 0.09)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notif.read
                      ? 'transparent'
                      : 'rgba(99, 102, 241, 0.05)';
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: notif.read ? '#f1f5f9' : '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {getNotifIcon(notif.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: notif.read ? 600 : 700,
                          color: 'var(--text-primary, #0f172a)',
                          lineHeight: 1.3,
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '12px',
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </p>

                    {notif.type && String(notif.type).includes('live_class') ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--primary-color, #6C3CF0)',
                        }}
                      >
                        View Classroom in Portal →
                      </div>
                    ) : notif.link ? (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          marginTop: '6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--primary-color, #4f46e5)',
                        }}
                      >
                        Open Link <ExternalLink size={10} />
                      </div>
                    ) : null}
                  </div>

                  {!notif.read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(notif.id, e)}
                      title="Mark as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#4f46e5')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                    >
                      <CheckCheck size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
