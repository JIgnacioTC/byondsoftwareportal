import React from 'react';

/**
 * Official TORREN Brand Logo Component
 * Variants:
 * - 'horizontal': Isotipo TR + Wordmark TORREN inline (ideal for Navbar, Header, Footer)
 * - 'mark': Just Isotipo TR
 * - 'wordmark': Just Wordmark TORREN
 * - 'full': Stacked Isotipo + Wordmark + Tagline
 * 
 * Theme:
 * - 'crema': #E6DACA (for dark backgrounds like #0F1E2D, #1A2E44)
 * - 'abisal': #0F1E2D (for light backgrounds)
 * - 'arena': #C4B49F (beige secondary)
 */
export function TorrenMark({ size = 32, color = '#E6DACA', className = '', style = {} }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-label="TORREN Isotipo"
    >
      <g fill={color}>
        <path d="M16 16H76V27H58L42 43L58 59L76 77V94L34 52V88L23 98V27H16Z" />
      </g>
    </svg>
  );
}

export function TorrenWordmark({ height = 24, color = '#E6DACA', className = '', style = {} }) {
  const width = Math.round(height * 5); // 600x120 aspect ratio is 5:1
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 600 120"
      width={width}
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-label="TORREN"
    >
      <g fill="none" stroke={color} strokeWidth="8" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M30 35H90M60 35V85" />
        <rect x="125" y="35" width="60" height="50" rx="8" />
        <path d="M225 85V35H275L285 45L275 58H225M255 58L286 85" />
        <path d="M325 85V35H375L385 45L375 58H325M355 58L386 85" />
        <path d="M425 35H480M425 60H475M425 85H480" />
        <path d="M520 85V35L575 85V35" />
      </g>
    </svg>
  );
}

export default function TorrenLogo({
  variant = 'horizontal',
  theme = 'crema',
  height = 28,
  subtitle = false,
  className = '',
  style = {},
}) {
  const colors = {
    crema: '#E6DACA',
    abisal: '#0F1E2D',
    arena: '#C4B49F',
  };
  const primaryColor = colors[theme] || theme;
  const secondaryColor = theme === 'abisal' ? '#1A2E44' : '#C4B49F';

  if (variant === 'mark') {
    return <TorrenMark size={height} color={primaryColor} className={className} style={style} />;
  }

  if (variant === 'wordmark') {
    return <TorrenWordmark height={height} color={primaryColor} className={className} style={style} />;
  }

  if (variant === 'full') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          ...style,
        }}
      >
        <TorrenMark size={height * 1.6} color={primaryColor} />
        <TorrenWordmark height={height} color={primaryColor} />
        {subtitle && (
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: Math.max(10, Math.round(height * 0.42)),
              fontWeight: 600,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: secondaryColor,
            }}
          >
            DESARROLLO DE SOFTWARE
          </span>
        )}
      </div>
    );
  }

  // Default: 'horizontal'
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: Math.round(height * 0.45),
        textDecoration: 'none',
        ...style,
      }}
    >
      <TorrenMark size={height} color={primaryColor} />
      <TorrenWordmark height={Math.round(height * 0.78)} color={primaryColor} />
    </div>
  );
}
