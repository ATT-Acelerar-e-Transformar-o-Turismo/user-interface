// Tests for the pure helpers in chartSeries.js. Run with:
//   node --test src/utils/chartSeries.test.js
//
// No JSX, no React — just pure functions exercising the Phase 1+2 transforms
// the indicator detail page and resource wizard depend on.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  pickDefaultTimeColumn,
  defaultColumnSelectionForFile,
  buildChartSeries,
  normaliseHeader,
  buildPieDonutPayload,
  buildTreemapPayload,
  buildHeatmapPayload,
  buildBoxPlotPayload,
  buildRangePayload,
  buildCandlestickPayload,
} from './chartSeries.js';

// --- pickDefaultTimeColumn -------------------------------------------------

test('pickDefaultTimeColumn: hits the obvious Portuguese time header', () => {
  assert.equal(pickDefaultTimeColumn(['Anos', 'Total', 'Algarve']), 'Anos');
});

test('pickDefaultTimeColumn: case- and accent-insensitive', () => {
  // "Período" should match "periodo" in TIME_COLUMN_HINTS via NFKD strip.
  assert.equal(pickDefaultTimeColumn(['Período', 'Visitantes']), 'Período');
});

test('pickDefaultTimeColumn: falls back to first column when nothing matches', () => {
  assert.equal(pickDefaultTimeColumn(['ColA', 'ColB']), 'ColA');
});

test('pickDefaultTimeColumn: returns null on empty input', () => {
  assert.equal(pickDefaultTimeColumn([]), null);
  assert.equal(pickDefaultTimeColumn(null), null);
});

test('normaliseHeader: strips diacritics and casefolds', () => {
  assert.equal(normaliseHeader('Período'), 'periodo');
  assert.equal(normaliseHeader('  Año '), 'ano');
});

// --- defaultColumnSelectionForFile ----------------------------------------

test('defaultColumnSelectionForFile (XLSX): picks the largest sheet, not the first', () => {
  // Mirrors the user's actual file: sheets 1+2 are tiny info tabs (1 row),
  // sheet 3 "Dados" has 30 rows of real data.
  const parsed = {
    kind: 'xlsx',
    sheets: [
      { name: 'Ficha do indicador', columns: ['Descrição', 'Unidade'], rowCount: 1 },
      { name: 'Metadados', columns: ['Fonte primária'], rowCount: 1 },
      {
        name: 'Dados',
        columns: ['Anos', 'Total', 'Protecção da qualidade do ar e clima', 'Gestão de águas residuais'],
        rowCount: 30,
      },
    ],
  };
  const sel = defaultColumnSelectionForFile(parsed);
  assert.equal(sel.sheetName, 'Dados');
  assert.equal(sel.timeColumn, 'Anos');
  assert.deepEqual(sel.valueColumns, [
    'Total',
    'Protecção da qualidade do ar e clima',
    'Gestão de águas residuais',
  ]);
});

test('defaultColumnSelectionForFile (CSV): no sheet, headers become value cols', () => {
  const sel = defaultColumnSelectionForFile({
    kind: 'csv',
    columns: ['Year', 'Visitors', 'Revenue'],
    rowCount: 100,
  });
  assert.equal(sel.sheetName, null);
  assert.equal(sel.timeColumn, 'Year');
  assert.deepEqual(sel.valueColumns, ['Visitors', 'Revenue']);
});

test('defaultColumnSelectionForFile: handles empty / missing input', () => {
  assert.deepEqual(defaultColumnSelectionForFile(null), {
    sheetName: null,
    timeColumn: null,
    valueColumns: [],
  });
  assert.deepEqual(defaultColumnSelectionForFile({ kind: 'csv', columns: [] }), {
    sheetName: null,
    timeColumn: null,
    valueColumns: [],
  });
});

test('defaultColumnSelectionForFile (XLSX): no time-column match → first col is X, rest are values', () => {
  const sel = defaultColumnSelectionForFile({
    kind: 'xlsx',
    sheets: [{ name: 'S1', columns: ['Foo', 'Bar', 'Baz'], rowCount: 5 }],
  });
  assert.equal(sel.timeColumn, 'Foo');
  assert.deepEqual(sel.valueColumns, ['Bar', 'Baz']);
});

// --- buildChartSeries ------------------------------------------------------

test('buildChartSeries: returns null when there is no data', () => {
  assert.equal(buildChartSeries(null, []), null);
  assert.equal(buildChartSeries([], []), null);
});

test('buildChartSeries: legacy single-stream — uses resource name', () => {
  // Two resources, neither tagged with a series_label: each resource is one
  // line, named after the resource (e.g. file name).
  const raw = [
    { resource_id: 'r1', series_label: null, points: [{ x: '2020-01-01T00:00:00', y: 10 }] },
    { resource_id: 'r2', series_label: null, points: [{ x: '2020-01-01T00:00:00', y: 20 }] },
  ];
  const resources = [
    { id: 'r1', name: 'INE 2020.xlsx' },
    { id: 'r2', name: 'INE 2021.xlsx' },
  ];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series.length, 2);
  assert.equal(out.series[0].name, 'INE 2020.xlsx');
  assert.equal(out.series[1].name, 'INE 2021.xlsx');
  assert.equal(out.series[0].resource_id, 'r1');
});

test('buildChartSeries: multi-column file — series_label takes priority over resource name', () => {
  // The user's case: one file (one resource) emits N series, one per column.
  const raw = [
    { resource_id: 'r1', series_label: 'Total', points: [{ x: '2020-01-01T00:00:00', y: 100 }] },
    { resource_id: 'r1', series_label: 'Gestão de águas residuais', points: [{ x: '2020-01-01T00:00:00', y: 50 }] },
    { resource_id: 'r1', series_label: 'Protecção contra radiações', points: [{ x: '2020-01-01T00:00:00', y: 5 }] },
  ];
  const resources = [{ id: 'r1', name: 'Indicator_1.xlsx' }];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series.length, 3);
  assert.deepEqual(
    out.series.map((s) => s.name),
    ['Total', 'Gestão de águas residuais', 'Protecção contra radiações'],
  );
  // Every series traces back to the same resource — the file is still ONE resource.
  assert.deepEqual(new Set(out.series.map((s) => s.resource_id)), new Set(['r1']));
});

test('buildChartSeries: resource legend overrides file name and column label for a single series', () => {
  // One resource, one column → the admin-curated legend wins over both the
  // file name and the raw column label.
  const raw = [
    { resource_id: 'r1', series_label: 'Total', points: [{ x: '2020-01-01T00:00:00', y: 100 }] },
  ];
  const resources = [{ id: 'r1', name: 'INE 2020.xlsx', legend: 'Visitantes totais' }];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series.length, 1);
  assert.equal(out.series[0].name, 'Visitantes totais');
});

test('buildChartSeries: resource legend is ignored for multi-column resources', () => {
  // One resource emitting several columns: a single legend can't label every
  // line distinctly, so each series keeps its column name.
  const raw = [
    { resource_id: 'r1', series_label: 'Total', points: [{ x: '2020-01-01T00:00:00', y: 100 }] },
    { resource_id: 'r1', series_label: 'Águas residuais', points: [{ x: '2020-01-01T00:00:00', y: 50 }] },
  ];
  const resources = [{ id: 'r1', name: 'Indicator_1.xlsx', legend: 'Não deve aparecer' }];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series.length, 2);
  assert.deepEqual(out.series.map((s) => s.name), ['Total', 'Águas residuais']);
});

test('buildChartSeries: blank/whitespace resource legend falls back to the default name', () => {
  const raw = [
    { resource_id: 'r1', series_label: null, points: [{ x: '2020-01-01T00:00:00', y: 10 }] },
  ];
  const resources = [{ id: 'r1', name: 'INE 2020.xlsx', legend: '   ' }];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series[0].name, 'INE 2020.xlsx');
});

test('buildChartSeries: complementary year ranges — merges resources sharing a series label', () => {
  // Two resources covering different time windows for the SAME column collapse
  // into one continuous line. Without merging the chart used to render two
  // disjoint segments with both filenames in the legend; users expect a single
  // series under the column name.
  const raw = [
    {
      resource_id: 'r-old',
      series_label: 'Valor',
      points: [
        { x: '2020-01-01T00:00:00', y: 10 },
        { x: '2021-01-01T00:00:00', y: 11 },
        { x: '2022-01-01T00:00:00', y: 12 },
      ],
    },
    {
      resource_id: 'r-new',
      series_label: 'Valor',
      points: [
        { x: '2023-01-01T00:00:00', y: 13 },
        { x: '2024-01-01T00:00:00', y: 14 },
      ],
    },
  ];
  const resources = [
    { id: 'r-old', name: 'Indicator - INE-2020-2022.xlsx' },
    { id: 'r-new', name: 'Indicator - INE-2023-2024.xlsx' },
  ];
  const out = buildChartSeries(raw, resources);
  assert.equal(out.series.length, 1);
  assert.equal(out.series[0].name, 'Valor');
  assert.equal(out.series[0].data.length, 5);
  // Sorted ascending so the line is continuous across the boundary.
  assert.deepEqual(out.series[0].data.map((d) => d.y), [10, 11, 12, 13, 14]);
  assert.deepEqual(out.series[0].resource_ids, ['r-old', 'r-new']);
});

test('buildChartSeries: falls back to resource_id when both name and series_label are missing', () => {
  // Race condition: /series response arrives before resources are loaded.
  const out = buildChartSeries(
    [{ resource_id: 'r1', series_label: null, points: [{ x: '2020-01-01T00:00:00', y: 1 }] }],
    [],
  );
  assert.equal(out.series[0].name, 'r1');
});

test('buildChartSeries: converts ISO x to ms and coerces y to number', () => {
  const out = buildChartSeries(
    [{ resource_id: 'r1', points: [{ x: '2020-01-01T00:00:00', y: '42.5' }] }],
    [{ id: 'r1', name: 'A' }],
  );
  const point = out.series[0].data[0];
  assert.equal(point.x, new Date('2020-01-01T00:00:00').getTime());
  assert.equal(point.y, 42.5);
});

test('buildChartSeries: keeps numeric x values intact', () => {
  // Some wrappers emit numeric x (e.g. category indices, not timestamps).
  const out = buildChartSeries(
    [{ resource_id: 'r1', points: [{ x: 7, y: 1 }] }],
    [{ id: 'r1', name: 'A' }],
  );
  assert.equal(out.series[0].data[0].x, 7);
});

test('buildChartSeries: drops malformed points instead of crashing', () => {
  const out = buildChartSeries(
    [{
      resource_id: 'r1',
      points: [
        { x: '2020-01-01T00:00:00', y: 1 },
        { x: 'not a date', y: 2 },     // → NaN x, dropped
        { x: '2021-01-01T00:00:00', y: 'bad' },  // → NaN y, dropped
      ],
    }],
    [{ id: 'r1', name: 'A' }],
  );
  assert.equal(out.series[0].data.length, 1);
  assert.equal(out.series[0].data[0].y, 1);
});

// ---------------------------------------------------------------------------
// Apex per-chart-type payloads.
// ---------------------------------------------------------------------------
// These adapters fix the "Could not render this chart type with the current
// data" / "requires multi-valued data" messages the user reported. Each
// chart type needs a different shape; the tests pin down what comes out.

const indicatorSeries = [
  { name: 'Total', data: [{ x: 100, y: 30 }, { x: 200, y: 40 }, { x: 300, y: 50 }] },
  { name: 'Águas residuais', data: [{ x: 100, y: 5 }, { x: 200, y: 6 }, { x: 300, y: 7 }] },
];

test('buildPieDonutPayload: multi-series → one slice per series, value = sum', () => {
  const out = buildPieDonutPayload(indicatorSeries);
  assert.deepEqual(out.apexLabels, ['Total', 'Águas residuais']);
  assert.deepEqual(out.apexSeries, [120, 18]);
});

test('buildPieDonutPayload: single series with many points → slice per point', () => {
  // One nationality with 3 years of data — pie shows one slice per year.
  const out = buildPieDonutPayload([{
    name: 'Hotel guests',
    data: [{ x: 2019, y: 100 }, { x: 2020, y: 30 }, { x: 2021, y: 80 }],
  }]);
  assert.deepEqual(out.apexLabels, ['2019', '2020', '2021']);
  assert.deepEqual(out.apexSeries, [100, 30, 80]);
});

test('buildPieDonutPayload: hidden series excluded', () => {
  const out = buildPieDonutPayload([
    { name: 'A', data: [{ x: 1, y: 10 }] },
    { name: 'B', data: [{ x: 1, y: 20 }], hidden: true },
  ]);
  assert.deepEqual(out.apexLabels, ['A']);
  assert.deepEqual(out.apexSeries, [10]);
});

test('buildPieDonutPayload: empty input → empty arrays (no crash)', () => {
  assert.deepEqual(buildPieDonutPayload([]), { apexSeries: [], apexLabels: [] });
});

test('buildTreemapPayload: one apex series per cell so the legend shows each cell', () => {
  const out = buildTreemapPayload(indicatorSeries);
  // Each cell becomes its own apex series → apex builds a legend entry per
  // cell (with `distributed: true`, each series gets its own colour).
  assert.equal(out.apexSeries.length, 2);
  assert.equal(out.apexSeries[0].name, 'Total');
  assert.deepEqual(out.apexSeries[0].data, [{ x: 'Total', y: 120 }]);
  assert.equal(out.apexSeries[1].name, 'Águas residuais');
  assert.deepEqual(out.apexSeries[1].data, [{ x: 'Águas residuais', y: 18 }]);
});

test('buildTreemapPayload: single series with many points → one apex series per data point', () => {
  // Single-series indicator with N points → N cells, N legend entries.
  const out = buildTreemapPayload([{
    name: 'Indicator',
    data: [{ x: 2019, y: 100 }, { x: 2020, y: 30 }, { x: 2021, y: 80 }],
  }]);
  assert.deepEqual(out.apexSeries.map((s) => s.name), ['2019', '2020', '2021']);
  assert.deepEqual(out.apexSeries[0].data, [{ x: '2019', y: 100 }]);
});

test('buildHeatmapPayload: each series → one row, x is stringified category', () => {
  const out = buildHeatmapPayload(indicatorSeries, (x) => `Y${x}`);
  assert.equal(out.apexSeries.length, 2);
  assert.equal(out.apexSeries[0].name, 'Total');
  assert.deepEqual(out.apexSeries[0].data[0], { x: 'Y100', y: 30 });
  assert.equal(out.apexSeries[1].name, 'Águas residuais');
});

test('buildBoxPlotPayload: y = [min, q1, median, q3, max] per series', () => {
  const out = buildBoxPlotPayload([
    { name: 'A', data: [1, 2, 3, 4, 5].map((y, i) => ({ x: i, y })) },
  ]);
  // Five-value series: linear quartiles → [1, 2, 3, 4, 5]
  assert.deepEqual(out.apexSeries[0].data[0].y, [1, 2, 3, 4, 5]);
  assert.equal(out.apexSeries[0].data[0].x, 'A');
});

test('buildBoxPlotPayload: degenerate single-value series → flat box', () => {
  const out = buildBoxPlotPayload([{ name: 'A', data: [{ x: 1, y: 7 }] }]);
  assert.deepEqual(out.apexSeries[0].data[0].y, [7, 7, 7, 7, 7]);
});

test('buildBoxPlotPayload: empty series filtered out (no NaN box)', () => {
  const out = buildBoxPlotPayload([
    { name: 'A', data: [{ x: 1, y: 10 }] },
    { name: 'B', data: [] },
  ]);
  assert.equal(out.apexSeries[0].data.length, 1);
  assert.equal(out.apexSeries[0].data[0].x, 'A');
});

test('buildRangePayload: y = [min, max] — one apex series per indicator series', () => {
  const out = buildRangePayload(indicatorSeries);
  assert.equal(out.apexSeries.length, 2);
  assert.equal(out.apexSeries[0].name, 'Total');
  assert.deepEqual(out.apexSeries[0].data, [{ x: 'Total', y: [30, 50] }]);
  assert.equal(out.apexSeries[1].name, 'Águas residuais');
  assert.deepEqual(out.apexSeries[1].data, [{ x: 'Águas residuais', y: [5, 7] }]);
});

test('buildCandlestickPayload: y = [open, high, low, close] from chrono order', () => {
  // Out-of-order points should still produce open=earliest, close=latest.
  const out = buildCandlestickPayload([{
    name: 'A',
    data: [
      { x: 200, y: 5 },
      { x: 100, y: 1 },
      { x: 300, y: 9 },
      { x: 250, y: 7 },
    ],
  }]);
  // open = y at x=100 → 1, close = y at x=300 → 9
  // high = max(1,5,9,7) = 9, low = min = 1
  assert.deepEqual(out.apexSeries[0].data[0].y, [1, 9, 1, 9]);
});

test('buildCandlestickPayload: skips empty series', () => {
  const out = buildCandlestickPayload([
    { name: 'A', data: [{ x: 1, y: 10 }] },
    { name: 'B', data: [] },
  ]);
  assert.equal(out.apexSeries[0].data.length, 1);
});
