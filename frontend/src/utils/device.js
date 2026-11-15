/**
 * Device detection utilities for responsive gating
 */
export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS/i.test(ua);
  const isSmallTouch = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  return isMobileUA || isSmallTouch;
};

