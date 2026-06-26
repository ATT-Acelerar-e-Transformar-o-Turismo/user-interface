import PropTypes from 'prop-types';

// Lightweight pure-SVG preview for a chart type. Replaces live ApexCharts
// previews in the indicator form: mounting ~15 chart engines (even lazily)
// wedges the main thread, so these static glyphs give the admin a visual cue
// of each chart shape with zero runtime cost and no chance of crashing.
//
// `currentColor` is the accent (set by the parent); a muted secondary is used
// for stacked/secondary elements.
const A = 'currentColor';
const B = 'currentColor';

export default function ChartTypeGlyph({ type, className = '' }) {
  const common = {
    viewBox: '0 0 64 40',
    className: `w-full h-[64px] ${className}`,
    fill: 'none',
    role: 'img',
    'aria-hidden': true,
  };

  switch (type) {
    case 'line':
      return (
        <svg {...common}><polyline points="2,32 16,18 30,24 44,8 62,14" stroke={A} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /></svg>
      );
    case 'area':
      return (
        <svg {...common}>
          <path d="M2,32 16,18 30,24 44,10 62,16 62,38 2,38 Z" fill={A} fillOpacity="0.2" />
          <polyline points="2,32 16,18 30,24 44,10 62,16" stroke={A} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case 'scatter':
      return (
        <svg {...common}>
          {[[8, 28], [20, 16], [30, 22], [40, 10], [52, 18], [58, 26]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill={A} />
          ))}
        </svg>
      );
    case 'column':
      return (
        <svg {...common}>
          {[[8, 14], [22, 26], [36, 10], [50, 20]].map(([x, h], i) => (
            <rect key={i} x={x} y={38 - h} width="8" height={h} rx="1" fill={A} />
          ))}
        </svg>
      );
    case 'bar':
      return (
        <svg {...common}>
          {[[6, 0, 40], [6, 13, 26], [6, 26, 50]].map(([x, y, w], i) => (
            <rect key={i} x={x} y={y + 3} width={w} height="8" rx="1" fill={A} />
          ))}
        </svg>
      );
    case 'stackedColumn':
      return (
        <svg {...common}>
          {[[8, 12, 8], [22, 18, 10], [36, 10, 6], [50, 16, 12]].map(([x, hb, ht], i) => (
            <g key={i}>
              <rect x={x} y={38 - hb} width="8" height={hb} rx="1" fill={A} />
              <rect x={x} y={38 - hb - ht} width="8" height={ht} rx="1" fill={B} fillOpacity="0.4" />
            </g>
          ))}
        </svg>
      );
    case 'stackedBar':
      return (
        <svg {...common}>
          {[[0, 22, 14], [13, 18, 18], [26, 26, 10]].map(([y, w1, w2], i) => (
            <g key={i}>
              <rect x="6" y={y + 3} width={w1} height="8" rx="1" fill={A} />
              <rect x={6 + w1} y={y + 3} width={w2} height="8" rx="1" fill={B} fillOpacity="0.4" />
            </g>
          ))}
        </svg>
      );
    case 'pie':
      return (
        <svg {...common}>
          <circle cx="32" cy="20" r="15" fill={A} fillOpacity="0.25" />
          <path d="M32,20 L32,5 A15,15 0 0,1 45,27 Z" fill={A} />
        </svg>
      );
    case 'donut':
      return (
        <svg {...common}>
          <circle cx="32" cy="20" r="14" stroke={A} strokeOpacity="0.25" strokeWidth="6" />
          <circle cx="32" cy="20" r="14" stroke={A} strokeWidth="6" strokeDasharray="40 88" strokeLinecap="round" transform="rotate(-90 32 20)" />
        </svg>
      );
    case 'treemap':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="34" height="20" rx="1.5" fill={A} />
          <rect x="38" y="4" width="24" height="20" rx="1.5" fill={A} fillOpacity="0.55" />
          <rect x="2" y="26" width="20" height="12" rx="1.5" fill={A} fillOpacity="0.4" />
          <rect x="24" y="26" width="38" height="12" rx="1.5" fill={A} fillOpacity="0.7" />
        </svg>
      );
    case 'heatmap':
      return (
        <svg {...common}>
          {[0.2, 0.5, 0.8, 0.35, 0.65, 0.9, 0.45, 0.25].map((o, i) => (
            <rect key={i} x={2 + (i % 4) * 15} y={6 + Math.floor(i / 4) * 15} width="13" height="13" rx="1.5" fill={A} fillOpacity={o} />
          ))}
        </svg>
      );
    case 'boxPlot':
      return (
        <svg {...common}>
          {[[16, 8, 30], [40, 12, 26]].map(([cx, top, bot], i) => (
            <g key={i} stroke={A} strokeWidth="2">
              <line x1={cx} y1={top - 4} x2={cx} y2={bot + 4} />
              <rect x={cx - 8} y={top} width="16" height={bot - top} rx="1" fill={A} fillOpacity="0.25" />
              <line x1={cx - 8} y1={(top + bot) / 2} x2={cx + 8} y2={(top + bot) / 2} />
            </g>
          ))}
        </svg>
      );
    case 'candlestick':
      return (
        <svg {...common}>
          {[[12, 6, 30, 12, 24], [28, 10, 34, 16, 28], [44, 4, 28, 10, 22]].map(([cx, hi, lo, t, b], i) => (
            <g key={i} stroke={A} strokeWidth="2">
              <line x1={cx} y1={hi} x2={cx} y2={lo} />
              <rect x={cx - 5} y={t} width="10" height={b - t} fill={A} fillOpacity="0.3" />
            </g>
          ))}
        </svg>
      );
    case 'rangeBar':
      return (
        <svg {...common}>
          {[[4, 10, 28], [13, 6, 20], [22, 16, 24]].map(([y, x, w], i) => (
            <rect key={i} x={x} y={y + 4} width={w} height="8" rx="2" fill={A} />
          ))}
        </svg>
      );
    case 'rangeArea':
      return (
        <svg {...common}>
          <path d="M2,12 18,8 34,14 50,9 62,13 62,24 50,20 34,26 18,20 2,24 Z" fill={A} fillOpacity="0.25" />
          <polyline points="2,12 18,8 34,14 50,9 62,13" stroke={A} strokeWidth="2" strokeLinejoin="round" />
          <polyline points="2,24 18,20 34,26 50,20 62,24" stroke={A} strokeWidth="2" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}><polyline points="2,32 16,18 30,24 44,8 62,14" stroke={A} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /></svg>
      );
  }
}

ChartTypeGlyph.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
};
