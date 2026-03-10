import logo from '../assets/logo.png'

// Premium Logo Component using official BCH branding
export function PremiumLogo({ className = '', size = 32 }) {
  return (
    <img
      src={logo}
      alt="BCH Logo"
      className={className}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
    />
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