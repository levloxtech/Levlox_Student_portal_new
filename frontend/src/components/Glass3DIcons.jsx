import React, { memo } from 'react';

/**
 * 3D Frosted Glassmorphism Icons
 * Replicating the exact aesthetic of layered translucent glassmorphism:
 * - Vibrant gradient solid back element
 * - Translucent frosted glass front layer with specular highlight and inner glow
 * - Soft drop shadows and tactile 3D depth
 */

// 1. Calendar Icon (Ref: Top-right icon with red header and calendar number)
export const GlassCalendar3D = memo(({ size = 46, day = '22', month = 'OCT' }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 14px rgba(225, 29, 72, 0.22))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="calHeaderGrad" x1="0" y1="0" x2="54" y2="20" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF4B4B" />
            <stop offset="1" stopColor="#E11D48" />
          </linearGradient>
          <linearGradient id="calBodyGrad" x1="0" y1="16" x2="0" y2="52" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="1" stopColor="#F1F5F9" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="0" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E2E8F0" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>
          <filter id="calShadow" x="0" y="2" width="54" height="52" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Binder Rings at the top */}
        <rect x="14" y="2" width="4.5" height="9" rx="2.25" fill="url(#ringGrad)" />
        <rect x="35.5" y="2" width="4.5" height="9" rx="2.25" fill="url(#ringGrad)" />

        {/* Main Calendar Body */}
        <g filter="url(#calShadow)">
          {/* Base Card */}
          <rect x="6" y="7" width="42" height="42" rx="12" fill="url(#calBodyGrad)" />
          {/* Red Header Bar */}
          <path
            d="M6 19V19C6 12.3726 11.3726 7 18 7H36C42.6274 7 48 12.3726 48 19V20H6V19Z"
            fill="url(#calHeaderGrad)"
          />
          {/* Subtle separator highlight */}
          <line x1="6" y1="20.5" x2="48" y2="20.5" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1" />
          {/* Frosted Specular Border */}
          <rect x="6.5" y="7.5" width="41" height="41" rx="11.5" stroke="#FFFFFF" strokeOpacity="0.9" strokeWidth="1" />
        </g>

        {/* Header Month / Day text */}
        <text
          x="27"
          y="16.5"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="0.8"
        >
          {month}
        </text>

        {/* Big Date Number */}
        <text
          x="27"
          y="37.5"
          textAnchor="middle"
          fill="#0F172A"
          fontSize="17"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {day}
        </text>
      </svg>
    </div>
  );
});

// 2. Document / Attendance Icon (Ref: Middle-right icon with solid blue back sheet & frosted front sheet with lines)
export const GlassDocument3D = memo(({ size = 46, color = 'blue' }) => {
  const isEmerald = color === 'emerald';
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: isEmerald
          ? 'drop-shadow(0 6px 14px rgba(16, 185, 129, 0.25))'
          : 'drop-shadow(0 6px 14px rgba(2, 132, 199, 0.25))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`backSheetGrad_${color}`} x1="0" y1="0" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            {isEmerald ? (
              <>
                <stop stopColor="#34D399" />
                <stop offset="1" stopColor="#059669" />
              </>
            ) : (
              <>
                <stop stopColor="#38BDF8" />
                <stop offset="1" stopColor="#0284C7" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`frontSheetGrad_${color}`} x1="0" y1="0" x2="36" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="1" stopColor={isEmerald ? '#ECFDF5' : '#E0F2FE'} stopOpacity="0.55" />
          </linearGradient>
          <filter id={`sheetShadow_${color}`} x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Back Solid Vibrant Sheet (offset right & up) */}
        <rect
          x="16"
          y="4"
          width="32"
          height="40"
          rx="10"
          fill={`url(#backSheetGrad_${color})`}
          transform="rotate(3 16 4)"
        />

        {/* Front Frosted Glass Sheet (offset left & down) */}
        <g filter={`url(#sheetShadow_${color})`}>
          <rect
            x="6"
            y="9"
            width="34"
            height="41"
            rx="11"
            fill={`url(#frontSheetGrad_${color})`}
          />
          {/* Specular Highlight Border */}
          <rect
            x="6.5"
            y="9.5"
            width="33"
            height="40"
            rx="10.5"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="1.2"
          />

          {/* Document Content Stripes (White embossed lines) */}
          <rect x="13" y="19" width="16" height="3" rx="1.5" fill={isEmerald ? '#059669' : '#0284C7'} />
          <rect x="13" y="26" width="20" height="2.5" rx="1.25" fill="#FFFFFF" fillOpacity="0.95" />
          <rect x="13" y="32" width="18" height="2.5" rx="1.25" fill="#FFFFFF" fillOpacity="0.95" />
          <rect x="13" y="38" width="12" height="2.5" rx="1.25" fill="#FFFFFF" fillOpacity="0.8" />
        </g>
      </svg>
    </div>
  );
});

// 3. Live Video / Camera Icon (Ref: Layered frosted glass with vibrant purple/indigo glow)
export const GlassVideo3D = memo(({ size = 46, platform = 'default' }) => {
  const isMeet = platform === 'meet';
  const isZoom = platform === 'zoom';

  const grad1 = isMeet ? '#10B981' : isZoom ? '#0B5CFF' : '#8B5CF6';
  const grad2 = isMeet ? '#059669' : isZoom ? '#0043C7' : '#6C3CF0';
  const shadowColor = isMeet ? 'rgba(16, 185, 129, 0.28)' : isZoom ? 'rgba(11, 92, 255, 0.28)' : 'rgba(108, 60, 240, 0.28)';

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: `drop-shadow(0 6px 14px ${shadowColor})`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`camBackGrad_${platform}`} x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor={grad1} />
            <stop offset="1" stopColor={grad2} />
          </linearGradient>
          <linearGradient id={`camGlassGrad_${platform}`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.45" />
          </linearGradient>
          <filter id={`camShadow_${platform}`} x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Vibrant Solid Back Element (Camera body & lens cone) */}
        <rect x="10" y="10" width="30" height="30" rx="10" fill={`url(#camBackGrad_${platform})`} />
        {/* Lens projector cone */}
        <path
          d="M38 21.5L46.5 16C47.8 15.2 49 16.1 49 17.6V34.4C49 35.9 47.8 36.8 46.5 36L38 30.5V21.5Z"
          fill={`url(#camBackGrad_${platform})`}
        />

        {/* Front Frosted Glass Plate */}
        <g filter={`url(#camShadow_${platform})`}>
          <rect
            x="6"
            y="13"
            width="34"
            height="28"
            rx="9"
            fill={`url(#camGlassGrad_${platform})`}
          />
          {/* Specular Edge Border */}
          <rect
            x="6.5"
            y="13.5"
            width="33"
            height="27"
            rx="8.5"
            stroke="#FFFFFF"
            strokeOpacity="0.95"
            strokeWidth="1.2"
          />

          {/* Glossy Center Lens Circle */}
          <circle cx="23" cy="27" r="7.5" fill="#FFFFFF" fillOpacity="0.9" />
          <circle cx="23" cy="27" r="4.5" fill={grad2} />
          {/* Tiny specular glare on lens */}
          <circle cx="24.5" cy="25.5" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>
    </div>
  );
});

// 4. Folder / Concluded Archive Icon (Ref: Bottom-left icon with blue back tab & frosted front pocket)
export const GlassFolder3D = memo(({ size = 46 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 14px rgba(2, 132, 199, 0.22))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="folderBackGrad" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#38BDF8" />
            <stop offset="1" stopColor="#0284C7" />
          </linearGradient>
          <linearGradient id="folderPocketGrad" x1="0" y1="18" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.88" />
            <stop offset="1" stopColor="#BAE6FD" stopOpacity="0.55" />
          </linearGradient>
          <filter id="folderShadow" x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.14" />
          </filter>
        </defs>

        {/* Back Tab + Back Folder Wall */}
        <path
          d="M7 16C7 12.6863 9.68629 10 13 10H22.5C24.3 10 26 11 27 12.5L29 15H41C44.3137 15 47 17.6863 47 21V41C47 44.3137 44.3137 47 41 47H13C9.68629 47 7 44.3137 7 41V16Z"
          fill="url(#folderBackGrad)"
        />

        {/* Front Frosted Glass Pocket */}
        <g filter="url(#folderShadow)">
          <rect
            x="6"
            y="20"
            width="42"
            height="27"
            rx="10"
            fill="url(#folderPocketGrad)"
          />
          {/* Specular Rim */}
          <rect
            x="6.5"
            y="20.5"
            width="41"
            height="26"
            rx="9.5"
            stroke="#FFFFFF"
            strokeOpacity="0.95"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  );
});

// 5. Chat / Message Bubble Icon (Ref: Bottom-middle icon with purple solid bubble + frosted lilac bubble with 3 dots)
export const GlassChat3D = memo(({ size = 46 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 14px rgba(168, 85, 247, 0.22))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chatBackGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D946EF" />
            <stop offset="1" stopColor="#7E22CE" />
          </linearGradient>
          <linearGradient id="chatFrontGrad" x1="0" y1="14" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.88" />
            <stop offset="1" stopColor="#F3E8FF" stopOpacity="0.6" />
          </linearGradient>
          <filter id="chatShadow" x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Back Vibrant Magenta/Purple Bubble */}
        <path
          d="M26 12C35 12 42 18 42 25.5C42 29.2 40.2 32.5 37.2 34.8C37.8 37 39 39 41 40C38 40.5 35 39.5 33.2 38.3C31 38.8 28.5 39 26 39C17 39 10 33 10 25.5C10 18 17 12 26 12Z"
          fill="url(#chatBackGrad)"
        />

        {/* Front Frosted Lilac Bubble with Tail and 3 Dots */}
        <g filter="url(#chatShadow)">
          <path
            d="M20 20C28.8 20 36 25.4 36 32C36 38.6 28.8 44 20 44C17.5 44 15.2 43.6 13.2 42.8C10.5 44.5 8 45 6 45C7.2 43 7.8 41 7.5 39.2C6 37.2 5 34.7 5 32C5 25.4 12.2 20 20 20Z"
            fill="url(#chatFrontGrad)"
            stroke="#FFFFFF"
            strokeOpacity="0.9"
            strokeWidth="1.2"
          />

          {/* 3 White Dots */}
          <circle cx="14" cy="32" r="2" fill="#7E22CE" fillOpacity="0.75" />
          <circle cx="20" cy="32" r="2" fill="#7E22CE" fillOpacity="0.75" />
          <circle cx="26" cy="32" r="2" fill="#7E22CE" fillOpacity="0.75" />
        </g>
      </svg>
    </div>
  );
});

// 6. Verified Presence / Checkmark Medal (Frosted Glass Badge)
export const GlassCheck3D = memo(({ size = 46 }) => {
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 14px rgba(16, 185, 129, 0.25))',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 54 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="checkBackGrad" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="checkFrontGrad" x1="0" y1="6" x2="0" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="1" stopColor="#D1FAE5" stopOpacity="0.65" />
          </linearGradient>
          <filter id="checkShadow" x="0" y="0" width="54" height="54" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0F172A" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Back Vibrant Green Orb */}
        <circle cx="27" cy="27" r="20" fill="url(#checkBackGrad)" />

        {/* Front Frosted Glass Plate with Check */}
        <g filter="url(#checkShadow)">
          <rect
            x="9"
            y="9"
            width="36"
            height="36"
            rx="12"
            fill="url(#checkFrontGrad)"
          />
          <rect
            x="9.5"
            y="9.5"
            width="35"
            height="35"
            rx="11.5"
            stroke="#FFFFFF"
            strokeOpacity="0.95"
            strokeWidth="1.2"
          />

          {/* Verified Checkmark */}
          <path
            d="M20 27L25 32L34 22"
            stroke="#059669"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
});
