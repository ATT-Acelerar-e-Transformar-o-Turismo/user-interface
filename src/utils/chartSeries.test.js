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
