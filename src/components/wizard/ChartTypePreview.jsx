import PropTypes from 'prop-types';
import GChart from '../Chart';

// A small illustrative series used when no real indicator data is available
// yet (e.g., creating a new indicator). Shows enough variance for each chart
// type to be visually distinguishable.
const SAMPLE_DATA = [
  { x: new Date('2024-01-01').getTime(), y: 14 },
  { x: new Date('2024-02-01').getTime(), y: 22 },
  { x: new Date('2024-03-01').getTime(), y: 18 },
  { x: new Date('2024-04-01').getTime(), y: 30 },
  { x: new Date('2024-05-01').getTime(), y: 25 },
  { x: new Date('2024-06-01').getTime(), y: 34 },
];

/**
 * Renders a tiny read-only chart as a visual cue for one chart type.
 * Uses the indicator's real data when provided; falls back to a synthetic
 * series otherwise (so previews work even before any source is connected).
 */
export default function ChartTypePreview({ chartType, data, height = 90 }) {
  const points = Array.isArray(data) && data.length > 0 ? data : SAMPLE_DATA;
  const isStacked = chartType === 'stackedColumn' || chartType === 'stackedBar';
  
  // Stacking only looks like stacking with >1 series.
  const series = isStacked
    ? [
        { name: 'p1', data: points.map(p => ({ ...p, y: Math.round(p.y * 0.6) })) },
        { name: 'p2', data: points.map(p => ({ ...p, y: Math.round(p.y * 0.4) })) },
      ]
    : [{ name: 'preview', data: points }];

  return (
    <div className="pointer-events-none" aria-hidden>
      <GChart
        chartId={`preview-${chartType}`}
        chartType={chartType}
        xaxisType="datetime"
        series={series}
        height={height}
        showLegend={false}
        showToolbar={false}
        showTooltip={false}
        allowUserInteraction={false}
        compact
        disableAnimations
      />
    </div>
  );
}

ChartTypePreview.propTypes = {
  chartType: PropTypes.string.isRequired,
  data: PropTypes.arrayOf(PropTypes.shape({
    x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    y: PropTypes.number,
  })),
  height: PropTypes.number,
};
