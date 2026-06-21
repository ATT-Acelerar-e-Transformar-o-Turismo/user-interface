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

// ---------------------------------------------------------------------------
// Apex chart payload adapters.
// ---------------------------------------------------------------------------
// Each chart type expects a different `series` / `labels` shape from
// ApexCharts. Our internal series shape is uniform:
//   [{ name, data: [{x, y}, ...] }, ...]
// The functions below transform that into the apex-flavoured payload for
// every chart type the indicator detail page can pick. Putting the logic
// here (instead of inline in Chart.jsx) lets us unit-test it without a
// browser, and keeps the rendering component free of branching switch-on-
// chartType code.

const isFiniteNumber = (n) => typeof n === 'number' && Number.isFinite(n);

const sortAsc = (arr) => [...arr].sort((a, b) => a - b);

const computeQuartiles = (values) => {
  // Linear-interpolation quartiles. For empty / one-value series we fall
  // back to a degenerate box (all five stats equal) so the chart renders
  // a flat marker instead of erroring out.
  if (!values.length) return null;
  const sorted = sortAsc(values);
  if (sorted.length === 1) return [sorted[0], sorted[0], sorted[0], sorted[0], sorted[0]];
  const at = (q) => {
    const pos = (sorted.length - 1) * q;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  };
  return [sorted[0], at(0.25), at(0.5), at(0.75), sorted[sorted.length - 1]];
};

// Pie / Donut
//   Multi-series indicator → one slice per series, sized by SUM of its y values.
//   Single-series indicator with N>1 points → one slice per data point.
//   Single point → one slice (degenerate but renders).
export const buildPieDonutPayload = (series) => {
  const visible = (series || []).filter((s) => !s.hidden);
  if (visible.length === 0) return { apexSeries: [], apexLabels: [] };

  if (visible.length === 1 && (visible[0].data?.length ?? 0) > 1) {
    const labels = visible[0].data.map((d) => String(d.x));
    const values = visible[0].data.map((d) => Number(d.y) || 0);
    return { apexSeries: values, apexLabels: labels };
  }

  const labels = visible.map((s, i) => s.name || `Series ${i + 1}`);
  const values = visible.map((s) =>
    (s.data || []).reduce((acc, d) => acc + (Number(d.y) || 0), 0),
  );
  return { apexSeries: values, apexLabels: labels };
};

// Treemap
//   Same per-series-or-per-point logic as pie/donut. Apex treemap renders
//   one rectangle per data-point and assigns colours per *series*, so to get
//   a legend with one entry per cell we wrap every cell in its own series.
//   With plotOptions.treemap.distributed=true each series then pulls a
//   distinct colour from `colors` and Apex builds a matching legend.
export const buildTreemapPayload = (series) => {
  const visible = (series || []).filter((s) => !s.hidden);
  let cells;
  if (visible.length === 1 && (visible[0].data?.length ?? 0) > 1) {
    cells = visible[0].data.map((d) => ({ x: String(d.x), y: Number(d.y) || 0 }));
  } else {
    cells = visible.map((s, i) => ({
      x: s.name || `Series ${i + 1}`,
      y: (s.data || []).reduce((acc, d) => acc + (Number(d.y) || 0), 0),
    }));
  }
  // One series per cell → one legend entry per cell.
  return {
    apexSeries: cells.map((c) => ({ name: c.x, data: [c] })),
  };
};

// Heatmap
//   One row per series, each cell at column x (formatted as a label) =
//   y value. Apex heatmap needs the x-axis to be category, so we stringify
//   x here even when the source is datetime.
export const buildHeatmapPayload = (series, xLabel = (x) => String(x)) => {
  const visible = (series || []).filter((s) => !s.hidden);
  return {
    apexSeries: visible.map((s) => ({
      name: s.name,
      data: (s.data || []).map((d) => ({
        x: xLabel(d.x),
        y: Number(d.y) || 0,
      })),
    })),
  };
};

// Box plot
//   One box per indicator series, computed from that series' y values:
//     y = [min, q1, median, q3, max]
//   Each indicator series becomes its OWN apex series so apex's default
//   legend renders one toggleable entry per box (collapsing everything into
//   a single apex series gives just one legend item).
export const buildBoxPlotPayload = (series) => {
  const visible = (series || []).filter((s) => !s.hidden);
  return {
    apexSeries: visible
      .map((s, i) => {
        const ys = (s.data || []).map((d) => Number(d.y)).filter(isFiniteNumber);
        const q = computeQuartiles(ys);
        if (!q) return null;
        const name = s.name || `Series ${i + 1}`;
        return { name, type: 'boxPlot', data: [{ x: name, y: q }] };
      })
      .filter(Boolean),
  };
};

// Range bar / range area
//   One bar/band per indicator series, y = [min, max] across that series.
//   One apex series per item so each gets its own legend entry.
export const buildRangePayload = (series) => {
  const visible = (series || []).filter((s) => !s.hidden);
  return {
    apexSeries: visible
      .map((s, i) => {
        const ys = (s.data || []).map((d) => Number(d.y)).filter(isFiniteNumber);
        if (!ys.length) return null;
        const name = s.name || `Series ${i + 1}`;
        return { name, data: [{ x: name, y: [Math.min(...ys), Math.max(...ys)] }] };
      })
      .filter(Boolean),
  };
};

// Candlestick
//   No "real" OHLC in indicator data, so we fake it from the series' time
//   ordering: open = first y chronologically, close = last y, high = max,
//   low = min. One apex series per indicator series so each candle has its
//   own legend entry.
export const buildCandlestickPayload = (series) => {
  const visible = (series || []).filter((s) => !s.hidden);
  return {
    apexSeries: visible
      .map((s, i) => {
        const sorted = (s.data || [])
          .map((d) => ({ x: d.x, y: Number(d.y) }))
          .filter((d) => isFiniteNumber(d.y))
          .sort((a, b) => {
            const ax = a.x instanceof Date ? a.x.getTime() : Number(a.x);
            const bx = b.x instanceof Date ? b.x.getTime() : Number(b.x);
            return ax - bx;
          });
        if (!sorted.length) return null;
        const ys = sorted.map((d) => d.y);
        const name = s.name || `Series ${i + 1}`;
        return {
          name,
          data: [{
            x: name,
            y: [sorted[0].y, Math.max(...ys), Math.min(...ys), sorted[sorted.length - 1].y],
          }],
        };
      })
      .filter(Boolean),
  };
};

// Build the chart-ready series for the indicator page. Each entry from
// /api/indicators/{id}/series identifies a line by (resource_id, series_label)
// — a multi-column file produces several series under one resource_id, each
// with a different series_label (the column name).
//
// Naming preference (highest first):
//   1. seriesTranslations[series_label][lang] when set — admin-curated label.
//   2. series_label (column name) when present — most informative raw value.
//   3. resource.name when there's only one series for that resource.
//   4. resource_id as a last-resort fallback (resource list still loading).
//
//   rawSeries: [{resource_id, series_label, points:[{x:isoString|number, y:number}]}, ...]
//   indicatorResources: [{id, name, ...}]
//   seriesTranslations: { [series_label]: { pt, en } } — optional
//   lang: 'pt' | 'en' — optional, defaults to 'pt'
// Returns: {series:[{name, resource_id, series_label, data:[{x:ms|number, y}]}]} | null
export const buildChartSeries = (
  rawSeries,
  indicatorResources,
  seriesTranslations = null,
  lang = 'pt',
) => {
  if (!Array.isArray(rawSeries) || rawSeries.length === 0) return null;
  const resById = new Map((indicatorResources || []).map((r) => [r.id, r]));
  const trans = seriesTranslations && typeof seriesTranslations === 'object'
    ? seriesTranslations
    : null;
  // Count how many rawSeries each resource contributes. A multi-column file
  // emits one rawSeries per column, all under the same resource_id; for
  // those we prefer the column name in the legend so the user can tell the
  // lines apart. Single-column resources fall back to the file name.
  const seriesCountByResource = new Map();
  for (const s of rawSeries) {
    if (s?.resource_id) {
      seriesCountByResource.set(s.resource_id, (seriesCountByResource.get(s.resource_id) || 0) + 1);
    }
  }
  // Resource names are stored as "<indicator name> - <file.ext>" by the
  // upload flow (ResourceWizard). Extract the trailing file name as the
  // friendly default legend.
  const extractFileName = (resourceName) => {
    if (!resourceName || typeof resourceName !== 'string') return null;
    const idx = resourceName.lastIndexOf(' - ');
    if (idx < 0) return resourceName.trim() || null;
    const tail = resourceName.slice(idx + 3).trim();
    return tail || null;
  };
  // Composed indicators: when the response contains lines from more than one
  // source indicator we prefix each line's name with the source indicator's
  // localized name so the user can tell them apart. For a non-composed
  // indicator every line shares the same source and the prefix is omitted.
  const distinctSources = new Set(
    rawSeries
      .map(s => s.source_indicator_id)
      .filter(id => id != null && id !== ''),
  );
  const showSourcePrefix = distinctSources.size > 1;
  const pickSourceName = (s) => {
    if (lang === 'en') return s.source_indicator_name_en || s.source_indicator_name || '';
    return s.source_indicator_name || s.source_indicator_name_en || '';
  };
  // Merge rawSeries entries that represent the same logical line. Two
  // entries are considered the same line when they come from the same source
  // indicator AND share the same (non-empty) series label — that's the
  // typical "one indicator, one column, two resources covering different
  // year ranges" case. Without this the chart would render two disjoint
  // segments and double up the legend; users expect a single continuous
  // line under the column's name.
  //
  // When the series_label is absent the rawSeries entries can't be matched
  // on column identity, so we fall back to one line per resource — the
  // legacy "different files = different streams" behavior.
  const pickLabel = (s) => (lang === 'en' && s.series_label_en) ? s.series_label_en : s.series_label;
  const groups = new Map();
  for (const s of rawSeries) {
    const label = pickLabel(s);
    const groupKey = label
      ? `${s.source_indicator_id || ''}|${label}`
      : `r:${s.resource_id}|${s.source_indicator_id || ''}`;
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(s);
  }
  return {
    series: Array.from(groups.values()).map((entries) => {
      const first = entries[0];
      const label = pickLabel(first);
      const localized = label && trans && trans[label]
        ? (trans[label][lang] || trans[label][lang === 'pt' ? 'en' : 'pt'])
        : null;
      const sourceName = pickSourceName(first);
      // Only fall back to the file name when (a) the group represents a
      // single rawSeries entry (no resources were merged) AND (b) that
      // resource contributes a single column overall. Either condition
      // failing means we'd be arbitrarily picking one file's name for what
      // is really many — defer to the column label instead.
      const singleEntry = entries.length === 1;
      const resourceSeriesCount = seriesCountByResource.get(first.resource_id) || 0;
      // Admin-curated legend set on the resource itself. Only honoured when the
      // line maps to a single resource contributing a single column — for
      // multi-column resources one legend can't label every line distinctly.
      const resourceLegend = (singleEntry && resourceSeriesCount === 1)
        ? ((resById.get(first.resource_id)?.legend || '').trim() || null)
        : null;
      const fileName = (singleEntry && resourceSeriesCount === 1)
        ? extractFileName(resById.get(first.resource_id)?.name)
        : null;
      const baseName = resourceLegend
        || (localized && localized.trim())
        || fileName
        || label
        || sourceName
        || first.resource_id;
      const name = showSourcePrefix && sourceName && baseName !== sourceName
        ? `${sourceName} — ${baseName}`
        : baseName;
      // Concatenate every entry's points, normalise x to ms, then sort
      // ascending so two resources covering adjacent year ranges render as
      // one continuous line with no internal gap.
      const data = entries
        .flatMap((s) => (s.points || []).map((p) => ({
          x: typeof p.x === 'string' ? new Date(p.x).getTime() : p.x,
          y: Number(p.y),
        })))
        .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y))
        .sort((a, b) => a.x - b.x);
      return {
        name,
        // Carry through the *first* resource_id so existing per-series
        // hooks (export, hidden_series filter) still match by it. The full
        // resource list is preserved on `resource_ids` for callers that
        // need to know every contributor.
        resource_id: first.resource_id,
        resource_ids: entries.map((s) => s.resource_id).filter(Boolean),
        series_label: label || null,
        source_indicator_id: first.source_indicator_id || null,
        source_indicator_name: sourceName || null,
        data,
      };
    }),
  };
};
