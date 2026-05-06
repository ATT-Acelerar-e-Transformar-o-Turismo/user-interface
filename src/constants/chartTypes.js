// Canonical chart type identifiers. Values match the backend ChartType enum
// and ApexCharts chart.type values (so they can be passed through mostly
// unchanged; Chart.jsx handles the few type-name translations).
export const CHART_TYPES = [
  'line',
  'area',
  'bar',
  'column',
  'stackedColumn',
  'stackedBar',
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

// i18n keys for user-facing labels. Keys live under `chart_types.*` in the
// translation files.
export const CHART_TYPE_LABEL_KEYS = {
  line: 'chart_types.line',
  area: 'chart_types.area',
  bar: 'chart_types.bar',
  column: 'chart_types.column',
  stackedColumn: 'chart_types.stackedColumn',
  stackedBar: 'chart_types.stackedBar',
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

export const DEFAULT_CHART_TYPES = ['line', 'column', 'bar', 'stackedColumn', 'stackedBar', 'scatter'];
export const DEFAULT_CHART_TYPE = 'line';
