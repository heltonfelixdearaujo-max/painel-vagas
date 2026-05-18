const COLORS = { D: '#EF4444', I: '#F59E0B', S: '#10B981', C: '#3B82F6' };
const AXES = [
  { key: 'D', label: 'D', angle: -90 },
  { key: 'I', label: 'I', angle: 0 },
  { key: 'S', label: 'S', angle: 90 },
  { key: 'C', label: 'C', angle: 180 },
];

function toXY(angle, r, cx, cy) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export default function DiscChart({ scores = {}, profile, size = 160 }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.38;
  const steps = [0.25, 0.5, 0.75, 1];
  const dominantColor = COLORS[profile] || '#4F46E5';

  const points = AXES.map(a => {
    const v = (scores[a.key] || 0) / 100;
    return toXY(a.angle, v * maxR, cx, cy);
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Grid rings */}
      {steps.map(s => {
        const ring = AXES.map(a => { const p = toXY(a.angle, s * maxR, cx, cy); return `${p.x},${p.y}`; }).join(' ');
        return <polygon key={s} points={ring} fill="none" stroke="#E5E7EB" strokeWidth={1} />;
      })}
      {/* Axes */}
      {AXES.map(a => {
        const end = toXY(a.angle, maxR, cx, cy);
        return <line key={a.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#E5E7EB" strokeWidth={1} />;
      })}
      {/* Data polygon */}
      <polygon points={polygon} fill={dominantColor} fillOpacity={0.18} stroke={dominantColor} strokeWidth={2} strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={COLORS[AXES[i].key]} />)}
      {/* Labels */}
      {AXES.map(a => {
        const lp = toXY(a.angle, maxR + 14, cx, cy);
        return (
          <text key={a.key} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fontWeight="700" fill={COLORS[a.key]}>
            {a.label} {scores[a.key] || 0}%
          </text>
        );
      })}
    </svg>
  );
}
