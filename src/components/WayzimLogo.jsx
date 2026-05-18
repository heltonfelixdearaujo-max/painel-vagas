export default function WayzimLogo({ height = 32, white = false, iconOnly = false }) {
  const dark  = white ? '#FFFFFF' : '#1B5299';
  const light = white ? 'rgba(255,255,255,0.55)' : '#5BB8E4';
  const sub   = white ? 'rgba(255,255,255,0.5)' : '#6B7280';
  const gap   = 3;
  const sq    = 22;
  const r     = 2.5;
  const iw    = sq * 2 + gap;
  const ih    = sq * 2 + gap;

  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${iw} ${ih}`}
      height={height}
      width={height}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <rect x="0"       y="0"       width={sq} height={sq} rx={r} fill={dark}  />
      <rect x={sq+gap}  y="0"       width={sq} height={sq} rx={r} fill={light} />
      <rect x="0"       y={sq+gap}  width={sq} height={sq} rx={r} fill={dark}  />
      <rect x={sq+gap}  y={sq+gap}  width={sq} height={sq} rx={r} fill={dark}  />
    </svg>
  );

  if (iconOnly) return icon;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon}
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif",
          fontWeight: 900,
          fontSize: height * 0.55,
          color: dark,
          letterSpacing: '-0.4px',
          lineHeight: 1.1,
        }}>
          Wayzim
        </div>
        <div style={{
          fontSize: height * 0.27,
          color: sub,
          fontWeight: 600,
          letterSpacing: '0.03em',
          lineHeight: 1.3,
          marginTop: 1,
        }}>
          People Report
        </div>
      </div>
    </div>
  );
}
