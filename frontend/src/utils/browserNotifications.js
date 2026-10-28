/**
 * System and Mobile Device Notification Service for Levlox Portal
 * Uses the Web Notification API and Web Audio API to alert students
 * on their PC or smartphone before live classes begin.
 */

// Synthesize a crisp 2-tone notification chime using Web Audio
export const playNotificationChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // Upbeat 2-tone alert chime (C6 -> G6)
    playTone(1046.5, 0, 0.15);
    playTone(1567.98, 0.12, 0.35);
  } catch (e) {
    // Audio autoplay restrictions or unsupported
  }
};

/**
 * Request notification permission on student's computer or mobile phone.
 */
export const requestDeviceNotificationPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('[Notification] requestPermission failed:', err);
    return Notification.permission;
  }
};

/**
 * Display a native operating system / mobile push notification banner.
 */
export const showDeviceNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return null;

  if (Notification.permission !== 'granted') return null;

  try {
    playNotificationChime();

    const notif = new Notification(title, {
      body: options.body || 'Your live session is starting now.',
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: options.tag || `levlox-live-${Date.now()}`,
      requireInteraction: options.requireInteraction ?? true,
      ...options,
    });

    notif.onclick = () => {
      window.focus();
      if (options.url) {
        window.open(options.url, '_blank', 'noopener,noreferrer');
      }
      notif.close();
    };

    return notif;
  } catch (err) {
    console.warn('[Notification] showDeviceNotification error:', err);
    return null;
  }
};
