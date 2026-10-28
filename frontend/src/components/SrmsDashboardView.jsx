import React, { useMemo } from 'react';
import { 
  FileText, GraduationCap, ClipboardCheck, Trophy, CalendarCheck, 
  ArrowRight, Search, Bell, ChevronDown, CheckCircle, 
  Calendar, Download, MessageSquare, BookOpen, Clock, 
  Percent, Award, Users, Video, Megaphone, Shield, Sparkles, Play
} from 'lucide-react';

/**
 * Levlox Nova Ambient Graphic Illustration — Electric Indigo & Violet Glow
 */
export const SrmsWelcomeIllustration = () => (
  <div style={{ position: 'relative', width: 170, height: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <svg width="170" height="110" viewBox="0 0 170 110" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="novaGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4568F5" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#101B33" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4568F5" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Ambient Radial Radiance */}
      <circle cx="85" cy="55" r="50" fill="url(#novaGlow)" />

      {/* Floating Modern Isometric Knowledge Platform */}
      <g transform="translate(15, 8)">
        {/* Foundation Glass Plinth */}
        <polygon points="70,72 125,52 70,32 15,52" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
        <polygon points="15,52 70,72 70,78 15,58" fill="rgba(69, 104, 245, 0.25)" />
        <polygon points="70,72 125,52 125,58 70,78" fill="rgba(139, 92, 246, 0.2)" />

        {/* Central Core Emblem — Hex Shield */}
        <rect x="52" y="24" width="36" height="36" rx="10" transform="rotate(45 52 24)" fill="url(#shieldGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
        
        {/* Floating Rings & Dots */}
        <circle cx="28" cy="28" r="4" fill="#10B981" />
        <circle cx="28" cy="28" r="7" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" />

        <circle cx="112" cy="30" r="3" fill="#F59E0B" />
        <circle cx="112" cy="30" r="6" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="1" />

        <circle cx="98" cy="74" r="3.5" fill="#4568F5" />
        <circle cx="98" cy="74" r="6.5" stroke="rgba(69, 104, 245, 0.4)" strokeWidth="1" />

        {/* Inner Nova Star */}
        <path d="M70 30 L73 40 L83 43 L73 46 L70 56 L67 46 L57 43 L67 40 Z" fill="#FFFFFF" />
      </g>
    </svg>
  </div>
);

/**
 * Redesigned Shared Header — Levlox Nova
 */
export const SrmsHeader = ({
  title = "Dashboard",
  userName = "Abhishek Verma",
  userRole = "B.Tech CSE - 3rd Year",
  userAvatar = null,
  unreadCount = 0,
  notificationComponent = null,
  onSearch = () => {},
  onToggleSidebar = () => {},
  onNotificationClick = () => {},
  onProfileClick = () => {},
}) => (
  <header className="srms-topbar">
    <div className="srms-topbar-left">
      <button className="srms-hamburger-btn" onClick={onToggleSidebar} title="Toggle Navigation">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h1 className="srms-topbar-title">{title}</h1>
      </div>
    </div>

    <div className="srms-topbar-right">
      {/* Functional Search Bar */}
      <div className="srms-search-pill">
        <Search size={15} color="#94A3B8" />
        <input 
          type="text" 
          placeholder="Search anything..." 
          className="srms-search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Notification Bell */}
      {notificationComponent ? (
        notificationComponent
      ) : (
        <button className="srms-bell-btn" onClick={onNotificationClick} title="Notifications">
          <Bell size={17} />
          {unreadCount > 0 && <span className="srms-bell-badge">{unreadCount}</span>}
        </button>
      )}

      {/* User Avatar Chip */}
      <div className="srms-user-chip" onClick={onProfileClick} title="Account Menu">
        <div className="srms-user-avatar">
          {userAvatar ? (
            <img src={userAvatar} alt={userName} />
          ) : (
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#4568F5' }}>
              {userName ? userName[0].toUpperCase() : 'U'}
            </span>
          )}
        </div>
        <div className="srms-user-info">
          <span className="srms-user-name">{userName}</span>
          <span className="srms-user-role">{userRole}</span>
        </div>
        <ChevronDown size={14} color="#64748B" style={{ marginLeft: 2 }} />
      </div>
    </div>
  </header>
);

/**
 * 5 KPI Cards Row — Levlox Nova
/**
 * 5 KPI Cards Row — AquaAdmin Theme (Circular Colorful Badges)
 */
export const SrmsKpiCardsRow = ({ cards = [] }) => {
  return (
    <div className="srms-kpi-grid">
      {cards.map((c, idx) => (
        <div key={idx} className="srms-kpi-card" onClick={c.onClick} style={{ cursor: c.onClick ? 'pointer' : 'default' }}>
          <div 
            className="srms-kpi-icon-box" 
            style={{ 
              background: c.bg || '#4568F5', 
              color: c.iconColor || '#FFFFFF',
              boxShadow: c.shadow || '0 4px 12px rgba(0, 0, 0, 0.08)' 
            }}
          >
            <c.icon size={22} color={c.iconColor || '#FFFFFF'} strokeWidth={2.2} />
          </div>
          <div className="srms-kpi-info">
            <span className="srms-kpi-label">{c.label}</span>
            <h3 className="srms-kpi-value">{c.value}</h3>
            {c.subtext && (
              <span className="srms-kpi-sub" style={{ color: c.subtextColor || c.bg || '#4568F5' }}>
                {c.subtext}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Recent Live Classes Table Component (Replacing Recent Exam Results)
 */
export const SrmsRecentLiveClassesTable = ({
  liveClasses = [],
  onViewAll = () => {},
  onJoin = () => {},
  onReplay = () => {}
}) => {
  return (
    <div className="srms-card">
      <div className="srms-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <h3 className="srms-card-title">Recent Live Classes</h3>
        </div>
        <button className="srms-card-link" onClick={onViewAll}>
          View All Classes <ArrowRight size={13} />
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="srms-table">
          <thead>
            <tr>
              <th>Class Topic</th>
              <th>Instructor</th>
              <th>Date & Time</th>
              <th>Batch</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {liveClasses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B' }}>
                  No recent live classes scheduled.
                </td>
              </tr>
            ) : (
              liveClasses.slice(0, 5).map((c, i) => {
                const status = (c.status || 'Completed').toLowerCase();
                const isLive = status === 'live';
                const isCompleted = status === 'completed';
                return (
                  <tr key={c.id || i}>
                    <td style={{ fontWeight: 700, color: '#172033' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Video size={16} color="#4568F5" />
                        <span>{c.title || 'Interactive Session'}</span>
                      </div>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>
                      {c.instructor || 'Lead Trainer'}
                    </td>
                    <td style={{ color: '#64748B', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {c.date ? `${c.date} ${c.time ? `• ${c.time}` : ''}` : 'Scheduled'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        fontSize: 11, 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 6, 
                        background: '#F1F5F9', 
                        color: '#475569',
                        border: '1px solid #E2E8F0',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        {c.batch_name || 'All Batches'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {isLive ? (
                        <span className="nova-live-badge" style={{ whiteSpace: 'nowrap' }}>
                          <span className="nova-live-dot" /> Live Now
                        </span>
                      ) : isCompleted ? (
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          padding: '3px 9px', 
                          borderRadius: 999, 
                          background: '#F1F5F9', 
                          color: '#64748B',
                          border: '1px solid #CBD5E1',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          Completed
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: 11, 
                          fontWeight: 700, 
                          padding: '3px 9px', 
                          borderRadius: 999, 
                          background: '#EFF6FF', 
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          whiteSpace: 'nowrap',
                          display: 'inline-block'
                        }}>
                          Upcoming
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isLive ? (
                        <button 
                          onClick={() => onJoin(c)}
                          style={{
                            padding: '5px 12px',
                            background: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <Play size={12} fill="#FFFFFF" /> Join Live
                        </button>
                      ) : !isCompleted ? (
                        <button 
                          onClick={() => onJoin(c)}
                          style={{
                            padding: '5px 12px',
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          <Video size={12} /> View Room
                        </button>
                      ) : (
                        <button 
                          onClick={() => (onReplay ? onReplay(c) : onViewAll())}
                          style={{
                            padding: '5px 12px',
                            background: '#F8FAFD',
                            color: '#4568F5',
                            border: '1px solid #C7D4FD',
                            borderRadius: 7,
                            fontSize: 11.5,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5
                          }}
                        >
                          Watch Replay
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Notice Board Component (Official Announcements from Admin & Trainers)
 */
export const SrmsNoticeBoard = ({
  notices = [],
  onViewAll = () => {}
}) => (
  <div className="srms-card">
    <div className="srms-card-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Megaphone size={17} color="#4568F5" />
        <h3 className="srms-card-title">Notice Board</h3>
      </div>
      <button className="srms-card-link" onClick={onViewAll}>
        View All Notices <ArrowRight size={13} />
      </button>
    </div>

    <div className="srms-notice-list">
      {notices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#64748B', fontSize: 13 }}>
          No announcements posted for your batch yet.
        </div>
      ) : (
        notices.slice(0, 3).map((n, i) => {
          const isTrainer = (n.senderRole || '').toLowerCase() === 'trainer';
          const isAdmin = (n.senderRole || '').toLowerCase() === 'admin' || !n.senderRole;
          return (
            <div key={i} className="srms-notice-item" onClick={n.onClick} style={{ cursor: n.onClick ? 'pointer' : 'default' }}>
              <div 
                className="srms-notice-icon-box"
                style={{
                  background: isTrainer ? '#F5F3FF' : '#EFF6FF',
                  borderColor: isTrainer ? '#DDD6FE' : '#BFDBFE',
                  color: isTrainer ? '#7C3AED' : '#2563EB'
                }}
              >
                {isTrainer ? <GraduationCap size={18} /> : <Shield size={18} />}
              </div>
              <div className="srms-notice-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: isTrainer ? '#EDE9FE' : '#DBEAFE',
                    color: isTrainer ? '#6D28D9' : '#1D4ED8'
                  }}>
                    {isTrainer ? `Trainer • ${n.senderName || 'Instructor'}` : `Admin • ${n.senderName || 'Super Admin'}`}
                  </span>

                  {n.batch_name && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: '#F1F5F9',
                      color: '#475569'
                    }}>
                      {n.batch_name}
                    </span>
                  )}
                </div>

                <h4 className="srms-notice-title">{n.title}</h4>
                <p className="srms-notice-desc">{n.description || n.content}</p>
                <span className="srms-notice-date">{n.date}</span>
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
);

/**
 * Interactive Academic Calendar Widget
 */
export const SrmsCalendarWidget = ({
  onViewCalendar = () => {}
}) => {
  const now = new Date();
  const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const activeDay = now.getDate();

  // Days matrix for demonstration (matching reference May 2024 grid)
  const daysHeader = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Generating calendar days matrix
  const weeks = useMemo(() => {
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon is 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells = [];
    // Previous month filler
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isCurrent: false });
    }
    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      cells.push({ day: d, isCurrent: true, isActive: d === activeDay });
    }
    // Next month filler
    const remaining = 35 - cells.length;
    for (let n = 1; n <= (remaining > 0 ? remaining : 42 - cells.length); n++) {
      cells.push({ day: n, isCurrent: false });
    }

    // Split into weeks of 7
    const result = [];
    for (let w = 0; w < cells.length; w += 7) {
      result.push(cells.slice(w, w + 7));
    }
    return result.slice(0, 5); // 5 rows
  }, [activeDay]);

  return (
    <div className="srms-card">
      <div className="srms-card-header">
        <h3 className="srms-card-title">Academic Calendar</h3>
        <button className="srms-card-link" onClick={onViewCalendar}>
          View Calendar
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 12, fontWeight: 750, fontSize: 13, color: '#0F172A' }}>
        {monthName}
      </div>

      <table className="srms-calendar-table">
        <thead>
          <tr>
            {daysHeader.map(d => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                const isWeekend = cIdx >= 5;
                let className = '';
                if (cell.isActive) className = 'srms-calendar-active-day';
                else if (!cell.isCurrent) className = 'srms-calendar-muted';
                else if (isWeekend) className = 'srms-calendar-weekend';

                return (
                  <td key={cIdx} className={className}>
                    {cell.day}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Quick Access 2x3 Grid Component
 */
export const SrmsQuickAccess = ({ items = [] }) => {
  return (
    <div className="srms-card">
      <div className="srms-card-header">
        <h3 className="srms-card-title">Quick Access</h3>
      </div>

      <div className="srms-quick-access-grid">
        {items.map((item, idx) => (
          <div key={idx} className="srms-quick-btn" onClick={item.onClick}>
            <div className="srms-quick-btn-icon" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
              <item.icon size={20} color={item.color} strokeWidth={2} />
            </div>
            <span className="srms-quick-btn-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Performance Overview Donut Chart Component — Levlox Nova
 */
export const SrmsPerformanceDonut = ({
  score = 84,
  label = "Overall Performance",
  legend = [
    { label: "Excellent", val: "60%", color: "#10B981" },
    { label: "Good", val: "20%", color: "#4568F5" },
    { label: "Average", val: "12%", color: "#F59E0B" },
    { label: "Needs Work", val: "8%", color: "#F43F5E" }
  ],
  onViewDetails = () => {}
}) => {
  const radius = 54;
  const strokeWidth = 13;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  return (
    <div className="srms-card">
      <div className="srms-card-header">
        <h3 className="srms-card-title">Performance Overview</h3>
        <button className="srms-card-link" onClick={onViewDetails}>
          View Details
        </button>
      </div>

      <div className="srms-donut-container">
        {/* SVG Donut Chart with Electric Indigo / Violet Gradient */}
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="donutNovaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4568F5" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            {/* Background circle track */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="#EEF2F8"
              strokeWidth={strokeWidth}
            />
            {/* Active progress */}
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="transparent"
              stroke="url(#donutNovaGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 850, color: '#172033', lineHeight: 1 }}>{score}%</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginTop: 4, maxWidth: 64, lineHeight: 1.2 }}>{label}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="srms-donut-legend">
          {legend.map((item, idx) => (
            <div key={idx} className="srms-legend-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="srms-legend-dot" style={{ background: item.color }} />
                <span className="srms-legend-label">{item.label}</span>
              </div>
              <span className="srms-legend-val">{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Minimal Footer — Levlox Nova
 */
export const SrmsFooter = () => (
  <footer className="srms-footer">
    <span>© {new Date().getFullYear()} Levlox — Intelligent Learning Experience. All rights reserved.</span>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      Enterprise Training Platform
    </span>
  </footer>
);

export const SrmsRecentResultsTable = SrmsRecentLiveClassesTable;

export default {
  SrmsWelcomeIllustration,
  SrmsHeader,
  SrmsKpiCardsRow,
  SrmsRecentLiveClassesTable,
  SrmsRecentResultsTable,
  SrmsNoticeBoard,
  SrmsCalendarWidget,
  SrmsQuickAccess,
  SrmsPerformanceDonut,
  SrmsFooter,
};
