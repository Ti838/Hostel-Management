// Premium SVG Logo Component
export function PremiumLogo({ className = '', size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background gradient */}
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent2)', stopOpacity: 1 }} />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>

      {/* Main building shape */}
      <rect
        x="20"
        y="30"
        width="60"
        height="50"
        rx="8"
        fill="url(#logoGrad)"
        filter="url(#shadow)"
      />

      {/* Windows */}
      <rect x="30" y="40" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />
      <rect x="45" y="40" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />
      <rect x="60" y="40" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />

      <rect x="30" y="55" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />
      <rect x="45" y="55" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />
      <rect x="60" y="55" width="8" height="6" rx="1" fill="rgba(255,255,255,0.9)" />

      {/* Door */}
      <rect x="42" y="65" width="16" height="15" rx="2" fill="#2d3748" />
      <circle cx="46" cy="72" r="1.5" fill="#fbbf24" />

      {/* Roof */}
      <polygon
        points="15,30 50,15 85,30"
        fill="var(--accent2)"
        filter="url(#shadow)"
      />

      {/* Chimney */}
      <rect x="65" y="18" width="6" height="12" rx="1" fill="#4a5568" />

      {/* Stars for premium feel */}
      <circle cx="15" cy="15" r="1.5" fill="#fbbf24" opacity="0.8" />
      <circle cx="85" cy="20" r="1" fill="#fbbf24" opacity="0.6" />
      <circle cx="10" cy="25" r="1" fill="#fbbf24" opacity="0.7" />
    </svg>
  )
}

// Alternative premium logos
export function PremiumLogoMinimal({ className = '', size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="minGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent2)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* Modern geometric design */}
      <rect x="20" y="20" width="60" height="60" rx="8" fill="url(#minGrad)" />
      <rect x="35" y="35" width="30" height="30" rx="4" fill="rgba(255,255,255,0.2)" />
      <rect x="45" y="45" width="10" height="10" rx="2" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

export function PremiumLogoText({ className = '', size = 32 }) {
  return (
    <svg
      width={size * 2}
      height={size}
      viewBox="0 0 200 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: 'var(--accent)', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'var(--accent2)', stopOpacity: 1 }} />
        </linearGradient>
      </defs>

      {/* "DORM" text */}
      <text x="10" y="65" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill="url(#textGrad)">
        DORM
      </text>

      {/* "HQ" text */}
      <text x="140" y="65" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="bold" fill="var(--text)">
        HQ
      </text>

      {/* Decorative line */}
      <line x1="10" y1="75" x2="180" y2="75" stroke="var(--accent)" strokeWidth="2" />
    </svg>
  )
}