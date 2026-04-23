// Canonical chart type identifiers. Values match the backend ChartType enum
// and ApexCharts chart.type values (so they can be passed through mostly
// unchanged; Chart.jsx handles the few type-name translations).
export const CHART_TYPES = [
  'line',
  'area',
  'bar',
  'column',
  'scatter',
  'pie',
  'donut',
  'treemap',
  'heatmap',
  'boxPlot',
  'candlestick',
  'rangeBar',
  'rangeArea',
];

// Types that require specially-shaped series data (OHLC, [low,high], etc.).
// These are still selectable, but Chart.jsx renders a placeholder when the
// available data is flat {x, y}.
export const SHAPE_SPECIFIC_CHART_TYPES = new Set([
  'boxPlot',
  'candlestick',
  'rangeBar',
  'rangeArea',
]);

// i18n keys for user-facing labels. Keys live under `chart_types.*` in the
// translation files.
export const CHART_TYPE_LABEL_KEYS = {
  line: 'chart_types.line',
  area: 'chart_types.area',
  bar: 'chart_types.bar',
  column: 'chart_types.column',
  scatter: 'chart_types.scatter',
  pie: 'chart_types.pie',
  donut: 'chart_types.donut',
  treemap: 'chart_types.treemap',
  heatmap: 'chart_types.heatmap',
  boxPlot: 'chart_types.boxPlot',
  candlestick: 'chart_types.candlestick',
  rangeBar: 'chart_types.rangeBar',
  rangeArea: 'chart_types.rangeArea',
};

export const DEFAULT_CHART_TYPES = ['line', 'column', 'bar', 'scatter'];
export const DEFAULT_CHART_TYPE = 'line';
