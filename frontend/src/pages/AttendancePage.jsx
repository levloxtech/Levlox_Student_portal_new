import React, { useState, useMemo, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getAttendanceForStudent, classifyFirestoreError } from '../services/firebaseService';
import {
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Circle,
  TrendingUp,
  Award,
  Zap,
  Clock,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

/* ─── 3D Layered Frosted Glass Icon Badge ────────────────────────────── */
const GlassIcon3D = memo(({ icon: Icon, theme = 'violet', size = 44, iconSize = 19, iconColor, style = {} }) => {
  const backdropClasses = {
    emerald: 'glass-backdrop-emerald',
    violet: 'glass-backdrop-violet',
    amber: 'glass-backdrop-amber',
    blue: 'glass-backdrop-blue',
    rose: 'glass-backdrop-rose',
    slate: 'glass-backdrop-slate',
  };
  const defaultColors = {
    emerald: '#065F46',
    violet: '#4F46E5',
    amber: '#92400E',
    blue: '#0369A1',
    rose: '#9F1239',
    slate: '#334155',
  };
  const color = iconColor || defaultColors[theme] || '#4F46E5';

  return (
    <div className="glass-icon-container" style={{ width: size, height: size, ...style }}>
      <div
        className={`glass-icon-backdrop ${backdropClasses[theme] || 'glass-backdrop-violet'}`}
        style={{
          width: Math.round(size * 0.68),
          height: Math.round(size * 0.68),
          borderRadius: Math.round(size * 0.26),
        }}
      />
      <div
        className="glass-icon-plate"
        style={{
          width: Math.round(size * 0.8),
          height: Math.round(size * 0.8),
          borderRadius: Math.round(size * 0.28),
        }}
      >
        <Icon size={iconSize} color={color} strokeWidth={2.2} />
      </div>
    </div>
  );
});

/* ─── Circular Progress Ring ────────────────────────── */
const RingProgress = ({ pct = 0, size = 68, stroke = 7 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(pct, 100) / 100) * circ;
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
};

/* ─── Day Cell Tooltip ─────────────────────────────── */
const DayTooltip = ({ day }) => (
  <div style={{
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#0F172A',
    color: '#fff',
    borderRadius: 9,
    padding: '7px 11px',
    fontSize: 11,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    zIndex: 100,
    boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
    lineHeight: 1.5,
    pointerEvents: 'none',
  }}>
    <div style={{ fontWeight: 800, marginBottom: 2 }}>{day.dateStr}</div>
    <div>Status: <span style={{ fontWeight: 700, color: day.status === 'Present' ? '#34D399' : day.status === 'Absent' ? '#F87171' : day.status === 'Holiday' ? '#FBBF24' : '#94A3B8' }}>{day.status}</span></div>
    {day.mode && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
        <span style={{
          fontSize: 9.5,
          fontWeight: 800,
          background: day.isAuto ? 'rgba(52,211,153,0.2)' : 'rgba(167,139,250,0.25)',
          color: day.isAuto ? '#34D399' : '#C084FC',
          padding: '1px 6px',
          borderRadius: 4,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}>
          {day.isAuto ? '⚡ Auto (Live Class)' : '✍️ Manual Entry'}
        </span>
      </div>
    )}
    {day.liveClassTitle && <div style={{ fontSize: 10, opacity: 0.85 }}>Class: {day.liveClassTitle}</div>}
    {day.markedTime && <div style={{ fontSize: 10, opacity: 0.85 }}>Time: {day.markedTime}</div>}
    {/* Tooltip arrow */}
    <div style={{
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      borderLeft: '5px solid transparent',
      borderRight: '5px solid transparent',
      borderTop: '5px solid #0F172A',
    }} />
  </div>
);

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
const EMPTY_HISTORY = [];

const AttendancePage = ({ dashboardData }) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);
  const [hoveredDay, setHoveredDay] = useState(null);
  const { uid, userProfile, authLoading } = useAuth();

  const student = dashboardData?.student || userProfile || {};
  const attendance = student.attendance || {};
  const studentIdentifier = student.id || student.uid || uid;

  const {
    data: fetchedHistory,
    isLoading: historyFetching,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: ['studentAttendance', studentIdentifier],
    queryFn: () => getAttendanceForStudent(studentIdentifier, student),
    enabled: Boolean(studentIdentifier),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
  });

  const historyLoading = authLoading || (Boolean(studentIdentifier) && historyFetching);

  const history = fetchedHistory?.length
    ? fetchedHistory
    : (student.attendanceHistory || EMPTY_HISTORY);

  /* ─── Build date → record map ─── */
  const attendanceMap = useMemo(() => {
    const map = {};
    history.forEach(item => {
      if (item.date) {
        const dateKey = String(item.date).split('T')[0];
        map[dateKey] = item;
      }
    });
    return map;
  }, [history]);

  /* ─── Calendar calculations ─── */
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startDayIndex = new Date(year, month, 1).getDay();

  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < startDayIndex; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = attendanceMap[dateString];
      const isAuto = Boolean(record?.attendedLive || record?.attendance_mode === 'Auto' || record?.marked_by?.includes('Auto'));
      days.push({
        dayNum: d,
        dateStr: dateString,
        status: record?.status || 'No Class',
        isAuto,
        mode: isAuto ? 'Auto' : record ? 'Manual' : '',
        liveClassTitle: record?.liveClassTitle || '',
        markedBy: isAuto ? (record?.marked_by || 'Auto-Attendance (Live Class)') : (record?.marked_by || (record ? 'Trainer/Admin (Manual)' : '')),
        markedTime: record?.marked_time || '',
        isToday: dateString === todayStr,
      });
    }
    return days;
  }, [year, month, totalDays, startDayIndex, attendanceMap, todayStr]);

  /* ─── Overall history counts ─── */
  const historyPresent = useMemo(() => history.filter(h => (h.status || '').toLowerCase() === 'present').length, [history]);
  const historyAbsent = useMemo(() => history.filter(h => (h.status || '').toLowerCase() === 'absent').length, [history]);
  const historyTotal = historyPresent + historyAbsent;
  const historyPercentage = historyTotal > 0 ? Math.round((historyPresent / historyTotal) * 100) : 0;

  /* ─── Auto vs Manual counts ─── */
  const autoAttendedCount = useMemo(() => history.filter(h => (h.status || '').toLowerCase() === 'present' && Boolean(h.attendedLive || h.attendance_mode === 'Auto' || h.marked_by?.includes('Auto'))).length, [history]);
  const manualAttendedCount = useMemo(() => history.filter(h => (h.status || '').toLowerCase() === 'present' && !Boolean(h.attendedLive || h.attendance_mode === 'Auto' || h.marked_by?.includes('Auto'))).length, [history]);

  /* ─── Verification log filter ─── */
  const [logFilter, setLogFilter] = useState('all');

  const filteredHistory = useMemo(() => {
    if (logFilter === 'auto') {
      return history.filter(h => Boolean(h.attendedLive || h.attendance_mode === 'Auto' || h.marked_by?.includes('Auto')));
    }
    if (logFilter === 'manual') {
      return history.filter(h => !Boolean(h.attendedLive || h.attendance_mode === 'Auto' || h.marked_by?.includes('Auto')));
    }
    return history;
  }, [history, logFilter]);

  /* ─── Monthly counts ─── */
  const monthPresent = useMemo(() => calendarDays.filter(d => d && (d.status || '').toLowerCase() === 'present').length, [calendarDays]);
  const monthAbsent = useMemo(() => calendarDays.filter(d => d && (d.status || '').toLowerCase() === 'absent').length, [calendarDays]);
  const monthWorkingDays = monthPresent + monthAbsent;

  /* ─── Aggregated stats ─── */
  const totalPresent = history.length > 0 ? historyPresent : (attendance.present ?? monthPresent);
  const totalAbsent = history.length > 0 ? historyAbsent : (attendance.absent ?? monthAbsent);
  const totalWorking = history.length > 0 ? historyTotal : ((attendance.total_days) ?? (totalPresent + totalAbsent));
  const percentage = history.length > 0 ? historyPercentage : (attendance.percentage ?? (totalWorking > 0 ? Math.round((totalPresent / totalWorking) * 100) : 0));

  /* ─── Month nav ─── */
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const monthLabel = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  /* ─── Selected Date Details ─── */
  const selectedDayRecord = useMemo(() => {
    return attendanceMap[selectedDateStr] || null;
  }, [attendanceMap, selectedDateStr]);

  const selectedDateLabel = useMemo(() => {
    if (!selectedDateStr) return '';
    try {
      const [y, m, d] = selectedDateStr.split('-');
      const dt = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
      return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const pctLabel = percentage >= 75 ? 'Exemplary' : percentage >= 60 ? 'Average' : 'Needs Attention';

  if (historyLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>
        Loading your attendance…
      </div>
    );
  }

  if (historyError) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p style={{ margin: '0 0 14px', fontWeight: 600, color: '#991B1B' }}>
          {classifyFirestoreError(historyError).message}
        </p>
        <button type="button" onClick={() => refetchHistory()} className="btn btn-primary" style={{ padding: '9px 20px' }}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ═══════════════════════════════════════════
          1. HEADER BANNER (Consistent with Live Classes)
      ═══════════════════════════════════════════ */}
      <div className="card-premium" style={{
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        background: '#FFFFFF',
        borderRadius: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <GlassIcon3D icon={CalendarCheck} theme="violet" size={44} iconSize={20} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 750, color: 'var(--text-primary)' }}>
                Attendance & Academic Ledger
              </h2>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                background: '#F5F3FF',
                color: '#6C3CF0',
                border: '1px solid #DDD6FE',
                padding: '2px 8px',
                borderRadius: 12,
              }}>
                Batch: {student.batch_name || student.batchName || 'Assigned'}
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Official biometric and session attendance records • Synchronized daily with batch lectures.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetchHistory()}
          className="btn btn-outline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 650,
            padding: '7px 14px',
            borderRadius: 10,
            background: '#FFF',
          }}
        >
          <RefreshCw size={13} /> Refresh Ledger
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          2. 3D FROSTED GLASS BENTO KPI CARDS
      ═══════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 14,
      }}>
        {/* CARD 1: COMPLETED ATTENDANCE */}
        <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GlassIcon3D icon={CheckCircle2} theme="emerald" size={40} iconSize={18} />
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', display: 'block' }}>
                  VERIFIED PRESENCE
                </span>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  Completed Attendance
                </h4>
              </div>
            </div>
            <span style={{
              fontSize: 10.5,
              fontWeight: 750,
              color: '#065F46',
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              padding: '3px 8px',
              borderRadius: 14,
            }}>
              {percentage}% Rate
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1 }}>
              {totalPresent}
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 550, color: '#64748B' }}>
              / {totalWorking} sessions attended
            </span>
          </div>

          <div style={{ fontSize: 11, color: '#059669', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
            Synchronized with official student ledger
          </div>
        </div>

        {/* CARD 2: COMPLIANCE STANDING */}
        <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GlassIcon3D icon={TrendingUp} theme="amber" size={40} iconSize={18} />
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', display: 'block' }}>
                  COMPLIANCE STANDING
                </span>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  Attendance Health
                </h4>
              </div>
            </div>
            <span style={{
              fontSize: 10.5,
              fontWeight: 750,
              color: percentage >= 75 ? '#065F46' : '#9A3412',
              background: percentage >= 75 ? '#ECFDF5' : '#FFF7ED',
              border: `1px solid ${percentage >= 75 ? '#A7F3D0' : '#FED7AA'}`,
              padding: '3px 8px',
              borderRadius: 14,
            }}>
              • {pctLabel}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, lineHeight: 1 }}>
              {percentage}%
            </span>
            <span style={{ fontSize: 11.5, fontWeight: 550, color: '#64748B' }}>
              overall attendance
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
            <div style={{
              height: '100%',
              width: `${Math.min(percentage, 100)}%`,
              background: percentage >= 75 ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #F59E0B, #DC2626)',
              borderRadius: 99,
              transition: 'width 0.8s ease',
            }} />
          </div>

          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 450 }}>
            {percentage >= 75 ? 'Exceeds standard 75% institutional threshold' : 'Maintain at least 75% for certificate qualification'}
          </div>
        </div>

        {/* CARD 3: VERIFICATION BREAKDOWN */}
        <div className="glass-card-elevated" style={{ padding: '16px 18px', background: '#FFFFFF', borderRadius: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <GlassIcon3D icon={Zap} theme="violet" size={40} iconSize={18} />
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B', display: 'block' }}>
                  SESSION BREAKDOWN
                </span>
                <h4 style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  Lecture Verification
                </h4>
              </div>
            </div>
            <span style={{
              fontSize: 10.5,
              fontWeight: 750,
              color: '#1D4ED8',
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              padding: '3px 8px',
              borderRadius: 14,
            }}>
              Auto-Sync Active
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#065F46' }}>{autoAttendedCount}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>⚡ Auto Live</span>
            </div>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#1D4ED8' }}>{manualAttendedCount}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>✍️ Manual</span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: totalAbsent > 0 ? '#DC2626' : '#64748B', fontWeight: 450 }}>
            {totalAbsent > 0 ? `${totalAbsent} absence record${totalAbsent !== 1 ? 's' : ''} on file` : 'Perfect record — 0 absences logged'}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          3. COMPACT CALENDAR (SMALLER & REFINED) + SESSION INSPECTOR
      ═══════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 360px) 1fr',
        gap: 16,
        alignItems: 'stretch',
      }}>
        {/* ── COMPACT CALENDAR CARD ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: '18px 20px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Calendar Header with mini controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={15} color="var(--primary-color)" />
              <h3 style={{ fontSize: 14, fontWeight: 750, margin: 0, color: 'var(--text-primary)' }}>
                {monthLabel}
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => {
                  setCurrentDate(new Date());
                  setSelectedDateStr(todayStr);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontSize: 10.5,
                  fontWeight: 650,
                  color: '#64748B',
                  cursor: 'pointer',
                }}
              >
                Today
              </button>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#F8F9FC', border: '1px solid #E2E8F0', borderRadius: 8,
                  cursor: 'pointer', color: '#475569', transition: 'all 0.15s',
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#F8F9FC', border: '1px solid #E2E8F0', borderRadius: 8,
                  cursor: 'pointer', color: '#475569', transition: 'all 0.15s',
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4,
            marginBottom: 8,
            textAlign: 'center',
          }}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
              <span key={idx} style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: '#94A3B8',
                paddingBottom: 4,
              }}>
                {d}
              </span>
            ))}
          </div>

          {/* Compact 36px Day Cells Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 5,
          }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} style={{ height: 36 }} />;
              const isSelected = selectedDateStr === day.dateStr;
              const isHovered = hoveredDay === i;
              const isPresent = (day.status || '').toLowerCase() === 'present';
              const isAbsent = (day.status || '').toLowerCase() === 'absent';

              let cellBg = 'transparent';
              let cellBorder = '1px solid transparent';
              let cellColor = '#334155';

              if (isPresent) {
                cellBg = '#ECFDF5';
                cellBorder = '1px solid #A7F3D0';
                cellColor = '#065F46';
              } else if (isAbsent) {
                cellBg = '#FEF2F2';
                cellBorder = '1px solid #FECACA';
                cellColor = '#991B1B';
              } else if (day.status === 'Holiday') {
                cellBg = '#FFFBEB';
                cellBorder = '1px solid #FDE68A';
                cellColor = '#92400E';
              }

              if (day.isToday) {
                cellBorder = '1.5px solid var(--primary-color)';
              }

              if (isSelected) {
                cellBorder = '2px solid var(--primary-color)';
                cellBg = isPresent ? '#D1FAE5' : 'rgba(108,60,240,0.12)';
              }

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(null)}
                  style={{
                    position: 'relative',
                    height: 36,
                    borderRadius: 9,
                    background: cellBg,
                    border: cellBorder,
                    color: cellColor,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    transform: isHovered ? 'scale(1.06)' : 'none',
                    zIndex: isHovered ? 10 : 1,
                  }}
                >
                  {/* Tooltip on hover */}
                  {isHovered && day.status !== 'No Class' && <DayTooltip day={day} />}

                  <span style={{ fontSize: 11.5, fontWeight: day.isToday || isSelected ? 800 : 600, lineHeight: 1 }}>
                    {day.dayNum}
                  </span>

                  {/* Tiny status dot */}
                  {(isPresent || isAbsent) && (
                    <span style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isPresent ? '#059669' : '#DC2626',
                      marginTop: 2,
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Compact Inline Legend */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #F1F5F9',
            fontSize: 10.5,
            color: '#64748B',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
              Present ({monthPresent})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
              Absent ({monthAbsent})
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6C3CF0' }} />
              Today
            </span>
          </div>
        </div>

        {/* ── DAY & MONTHLY INSPECTOR CARD (Right Side) ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: '20px 22px',
          boxShadow: 'var(--shadow-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: 16,
        }}>
          {/* Selected Date Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748B' }}>
                SESSION INSPECTOR
              </span>
              {selectedDayRecord ? (
                <span style={{
                  fontSize: 10.5,
                  fontWeight: 750,
                  color: (selectedDayRecord.status || '').toLowerCase() === 'present' ? '#065F46' : '#991B1B',
                  background: (selectedDayRecord.status || '').toLowerCase() === 'present' ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${(selectedDayRecord.status || '').toLowerCase() === 'present' ? '#A7F3D0' : '#FECACA'}`,
                  padding: '2px 8px',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  {(selectedDayRecord.status || '').toLowerCase() === 'present' ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                  {selectedDayRecord.status || 'Present'}
                </span>
              ) : (
                <span style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>No lecture record</span>
              )}
            </div>

            <h4 style={{ margin: '0 0 10px', fontSize: 14.5, fontWeight: 750, color: '#0F172A' }}>
              {selectedDateLabel}
            </h4>

            {selectedDayRecord ? (
              <div style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '12px 14px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Lecture / Session:</span>
                  <strong style={{ color: '#1E293B', textAlign: 'right' }}>
                    {selectedDayRecord.liveClassTitle || selectedDayRecord.course || student.course || 'Live Lecture'}
                  </strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Verification Mode:</span>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 750,
                    color: selectedDayRecord.attendedLive || selectedDayRecord.attendance_mode === 'Auto' ? '#065F46' : '#1D4ED8',
                    background: selectedDayRecord.attendedLive || selectedDayRecord.attendance_mode === 'Auto' ? '#ECFDF5' : '#EFF6FF',
                    padding: '2px 8px',
                    borderRadius: 10,
                  }}>
                    {selectedDayRecord.attendedLive || selectedDayRecord.attendance_mode === 'Auto' ? '⚡ Auto (Live Class)' : '✍️ Manual Entry'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>Verified By:</span>
                  <span style={{ color: '#334155', fontWeight: 600 }}>
                    {selectedDayRecord.marked_by || (selectedDayRecord.attendedLive ? 'Auto-Attendance (Live Class)' : 'Trainer (Manual)')}
                  </span>
                </div>
                {selectedDayRecord.marked_time && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B', fontWeight: 500 }}>Recorded Time:</span>
                    <span style={{ color: '#64748B' }}>{selectedDayRecord.marked_time}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                background: '#F8FAFC',
                borderRadius: 12,
                padding: '14px 16px',
                border: '1px dashed #E2E8F0',
                color: '#64748B',
                fontSize: 12,
                textAlign: 'center',
              }}>
                No lecture scheduled or attendance logged for this date.
              </div>
            )}
          </div>

          {/* Monthly Performance Gauge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: 'rgba(108,60,240,0.03)',
            border: '1px solid rgba(108,60,240,0.12)',
            borderRadius: 12,
            padding: '12px 16px',
          }}>
            <RingProgress pct={monthWorkingDays > 0 ? Math.round((monthPresent / monthWorkingDays) * 100) : 0} size={58} stroke={6} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: 12.5, fontWeight: 750, color: '#1E293B' }}>
                  {monthLabel} Rate
                </span>
                <strong style={{ fontSize: 13, color: monthPresent / (monthWorkingDays || 1) >= 0.75 ? '#059669' : '#DC2626' }}>
                  {monthWorkingDays > 0 ? Math.round((monthPresent / monthWorkingDays) * 100) : 0}%
                </strong>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#64748B' }}>
                {monthPresent} present · {monthAbsent} absent · {monthWorkingDays} total classes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          4. ATTENDANCE VERIFICATION & HISTORY LOG
      ═══════════════════════════════════════════ */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: 'var(--shadow-card)',
      }}>
        {/* Header & Filter Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
          borderBottom: '1px solid #F1F5F9',
          paddingBottom: 14,
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 750, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={17} color="var(--primary-color)" /> Attendance Verification & History Log
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: 11.5, color: 'var(--text-secondary)' }}>
              Complete audit ledger of all sessions attended via Live Class auto-attendance or marked manually by faculty.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: 5, background: '#F8FAFC', padding: 3, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              {[
                { id: 'all', label: `All (${history.length})` },
                { id: 'auto', label: `⚡ Auto Live (${autoAttendedCount})` },
                { id: 'manual', label: `✍️ Manual (${manualAttendedCount})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setLogFilter(tab.id)}
                  style={{
                    border: 'none',
                    borderRadius: 8,
                    padding: '4px 10px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: logFilter === tab.id ? '#FFFFFF' : 'transparent',
                    color: logFilter === tab.id ? 'var(--primary-color)' : '#64748B',
                    boxShadow: logFilter === tab.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => refetchHistory()}
              className="btn btn-outline"
              style={{
                fontSize: 11,
                fontWeight: 650,
                padding: '5px 10px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#FFF',
              }}
            >
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </div>

        {/* Verification Roster Table */}
        {filteredHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-secondary)' }}>
            <Circle size={28} color="#CBD5E1" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 12.5, margin: 0, fontWeight: 550 }}>No attendance records found for this view.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #F1F5F9', color: '#64748B', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Session / Live Lecture</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Attendance Mode</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700 }}>Verified By & Timestamp</th>
                  <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((rec, i) => {
                  const isAuto = Boolean(rec.attendedLive || rec.attendance_mode === 'Auto' || rec.marked_by?.includes('Auto'));
                  const isPresent = (rec.status || '').toLowerCase() === 'present';
                  return (
                    <tr
                      key={rec.id || i}
                      style={{
                        borderBottom: i === filteredHistory.length - 1 ? 'none' : '1px solid #F8FAFC',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FBFBFE'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '10px 12px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' }}>
                        {rec.date}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#334155', fontWeight: 600 }}>
                        {rec.liveClassTitle || rec.course || student.course || 'Live Course Lecture'}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        {isAuto ? (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 750,
                            color: '#065F46',
                            background: '#ECFDF5',
                            border: '1px solid #A7F3D0',
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            <Zap size={10} color="#059669" /> Auto (Live Class)
                          </span>
                        ) : (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: '#1D4ED8',
                            background: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            padding: '2px 8px',
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                          }}>
                            ✍️ Manual Entry
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748B', fontSize: 11 }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 650, color: '#475569' }}>
                            {rec.marked_by || (isAuto ? 'Auto-Attendance (Live Class)' : 'Faculty (Manual)')}
                          </span>
                          {rec.marked_time && (
                            <span style={{ fontSize: 10, color: '#94A3B8' }}>
                              Time: {rec.marked_time}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          color: isPresent ? '#065F46' : '#991B1B',
                          background: isPresent ? '#ECFDF5' : '#FEF2F2',
                          border: `1px solid ${isPresent ? '#A7F3D0' : '#FECACA'}`,
                          padding: '2px 8px',
                          borderRadius: 16,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}>
                          {isPresent ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {rec.status || 'Present'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
