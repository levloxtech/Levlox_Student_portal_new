/**
 * Batch Lifecycle & Duration Utility
 * Handles duration calculation, automatic expiration after N days (e.g. 50 days),
 * day progress tracking, and batch extension math.
 */

export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length < 3) return new Date(dateStr);
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
};

export const formatLocalDate = (dateObj) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const addDaysToDate = (dateStr, days) => {
  if (!dateStr) return '';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(days));
  return formatLocalDate(d);
};

export const getDaysBetween = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const d1 = parseLocalDate(startStr);
  const d2 = parseLocalDate(endStr);
  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
  const diff = d2.getTime() - d1.getTime();
  return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
};

export const formatReadableDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = parseLocalDate(dateStr);
  if (!d || isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Calculates real-time lifecycle and progress for a batch.
 * @param {string} startDateStr - YYYY-MM-DD
 * @param {string} endDateStr - YYYY-MM-DD
 * @param {number} durationDays - configured duration in days (e.g. 50)
 * @returns {object} Lifecycle metadata
 */
export const calculateBatchDurationInfo = (startDateStr, endDateStr, durationDays) => {
  if (!startDateStr) {
    return {
      totalDays: Number(durationDays) || 50,
      elapsedDays: 0,
      remainingDays: Number(durationDays) || 50,
      currentDay: 1,
      progressPercent: 0,
      isUpcoming: false,
      isActive: true,
      isExpired: false,
      computedStatus: 'Active',
      statusLabel: 'Active',
      daysNotice: 'Active batch'
    };
  }

  const start = parseLocalDate(startDateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let end;
  if (endDateStr) {
    end = parseLocalDate(endDateStr);
  } else if (durationDays) {
    end = parseLocalDate(addDaysToDate(startDateStr, durationDays));
  } else {
    end = parseLocalDate(addDaysToDate(startDateStr, 50));
  }

  const totalTime = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.round(totalTime / (1000 * 60 * 60 * 24)));

  const elapsedTime = today.getTime() - start.getTime();
  const elapsedDays = Math.round(elapsedTime / (1000 * 60 * 60 * 24));

  const remainingTime = end.getTime() - today.getTime();
  const remainingDays = Math.round(remainingTime / (1000 * 60 * 60 * 24));

  const isUpcoming = today.getTime() < start.getTime();
  const isExpired = today.getTime() > end.getTime();
  const isActive = !isUpcoming && !isExpired;

  const currentDay = isUpcoming 
    ? 0 
    : (isExpired ? totalDays : Math.min(Math.max(1, elapsedDays + 1), totalDays));
    
  const progressPercent = isUpcoming 
    ? 0 
    : (isExpired ? 100 : Math.min(100, Math.max(0, Math.round(((elapsedDays + 1) / totalDays) * 100))));

  let statusLabel = 'Active';
  let daysNotice = '';

  if (isUpcoming) {
    const daysUntilStart = Math.abs(elapsedDays);
    statusLabel = 'Upcoming';
    daysNotice = `Starts in ${daysUntilStart} day${daysUntilStart === 1 ? '' : 's'}`;
  } else if (isExpired) {
    const daysPast = Math.abs(remainingDays);
    statusLabel = 'Completed';
    daysNotice = `Duration Ended (${daysPast} day${daysPast === 1 ? '' : 's'} ago) — Extension Available`;
  } else {
    statusLabel = 'Active';
    daysNotice = `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`;
  }

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    currentDay,
    progressPercent,
    isUpcoming,
    isActive,
    isExpired,
    computedStatus: isExpired ? 'Completed' : (isUpcoming ? 'Upcoming' : 'Active'),
    statusLabel,
    daysNotice,
    startDateReadable: formatReadableDate(startDateStr),
    endDateReadable: formatReadableDate(endDateStr || formatLocalDate(end))
  };
};
