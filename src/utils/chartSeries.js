// Pure transforms shared between the indicator detail page and the tests.
// Keeping them out of the component lets us exercise them with `node --test`
// without spinning up a JSX runtime.

// Heuristic: column names that almost always represent the time/X axis. We
// strip diacritics and lower-case before comparing so "Anos" / "anos" / "Año"
// all hit.
export const TIME_COLUMN_HINTS = [
  'anos', 'ano', 'year', 'data', 'date',
  'time', 'timestamp', 'periodo', 'period',
  'mes', 'month',
];

export const normaliseHeader = (s) =>
  String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

export const pickDefaultTimeColumn = (columns) => {
  if (!columns || columns.length === 0) return null;
  for (const col of columns) {
    if (TIME_COLUMN_HINTS.includes(normaliseHeader(col))) return col;
  }
  return columns[0];
};

// Pick sensible per-file defaults given parsed metadata. Used both when files
// first arrive and when the user changes the sheet.
//   parsed: {kind:'xlsx', sheets:[{name, columns, rowCount}]}
//        or {kind:'csv', columns, rowCount}
// Returns: {sheetName, timeColumn, valueColumns}
export const defaultColumnSelectionForFile = (parsed) => {
  if (!parsed) return { sheetName: null, timeColumn: null, valueColumns: [] };
  if (parsed.kind === 'xlsx') {
    const sheets = parsed.sheets || [];
    // Largest sheet is almost always the data sheet — small "info" tabs (1–2
    // rows of metadata) shouldn't be defaulted into.
    const dataSheet = sheets.reduce(
      (best, s) => (s.rowCount > (best?.rowCount ?? -1) ? s : best),
      null,
    );
    const columns = dataSheet?.columns || [];
    const timeColumn = pickDefaultTimeColumn(columns);
    return {
      sheetName: dataSheet?.name || sheets[0]?.name || null,
      timeColumn,
      valueColumns: columns.filter((c) => c !== timeColumn),
    };
  }
  const columns = parsed.columns || [];
  const timeColumn = pickDefaultTimeColumn(columns);
  return {
    sheetName: null,
    timeColumn,
    valueColumns: columns.filter((c) => c !== timeColumn),
  };
};

// Build the chart-ready series for the indicator page. Each entry from
// /api/indicators/{id}/series identifies a line by (resource_id, series_label)
// — a multi-column file produces several series under one resource_id, each
// with a different series_label (the column name).
//
// Naming preference:
//   1. series_label (column name) when present — most informative.
//   2. resource.name when there's only one series for that resource.
//   3. resource_id as a last-resort fallback (resource list still loading).
//
//   rawSeries: [{resource_id, series_label, points:[{x:isoString|number, y:number}]}, ...]
//   indicatorResources: [{id, name, ...}]
// Returns: {series:[{name, resource_id, series_label, data:[{x:ms|number, y}]}]} | null
export const buildChartSeries = (rawSeries, indicatorResources) => {
  if (!Array.isArray(rawSeries) || rawSeries.length === 0) return null;
  const resById = new Map((indicatorResources || []).map((r) => [r.id, r]));
  return {
    series: rawSeries.map((s) => {
      const resource = resById.get(s.resource_id);
      const label = s.series_label;
      const name = label || resource?.name || s.resource_id;
      return {
        name,
        resource_id: s.resource_id,
        series_label: label || null,
        data: (s.points || [])
          .map((p) => ({
            // Backend serialises datetime x as ISO; numeric x stays numeric.
            x: typeof p.x === 'string' ? new Date(p.x).getTime() : p.x,
            y: Number(p.y),
          }))
          .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y)),
      };
    }),
  };
};
