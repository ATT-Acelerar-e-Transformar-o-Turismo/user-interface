import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react'
import PropTypes from 'prop-types'
import ApexCharts from 'apexcharts'
import {
    buildPieDonutPayload,
    buildTreemapPayload,
    buildHeatmapPayload,
    buildBoxPlotPayload,
    buildRangePayload,
    buildCandlestickPayload,
} from '../utils/chartSeries'

const DEFAULT_ANNOTATIONS = { xaxis: [], yaxis: [] }

// Re-anchor every treemap cell label to its rect's center. Apex only offers
// `dataLabels.offsetX/Y` (a single global value) and no "center" mode for
// treemap, so we walk the rendered SVG and rewrite each <text>'s attributes.
// Multi-line labels (the formatter returns [name, value]) are emitted as
// <tspan>s; we redistribute their y so the whole block is vertically centred.
// Apex's treemap label renderer is unhelpful: top-left anchored, small font,
// pulls a background rect that leaves "empty tags" if you reposition the
// text, and re-paints during animations so any in-place fix gets undone.
// Easier to disable apex labels entirely (`dataLabels.enabled: false` for
// treemap) and draw our own centred labels post-mount. This function does
// that — it removes anything we added previously and re-injects fresh
// <text> nodes at each cell's center.
const SVG_NS = 'http://www.w3.org/2000/svg';
const CUSTOM_TREEMAP_CLASS = 'roots-treemap-label';

// Approximate width of a string at a given font size for SVG sans-serif.
// 0.55 is the rough average advance / em for Onest / Inter-style fonts.
const approxTextWidth = (text, fontSize) => (text || '').length * fontSize * 0.55;

// Trim text with an ellipsis until estimateWidth(text) ≤ maxWidth. Returns
// '' if even a single char + '…' doesn't fit.
const truncateToFit = (text, maxWidth, fontSize) => {
    if (!text) return '';
    if (approxTextWidth(text, fontSize) <= maxWidth) return text;
    const ellipsisW = approxTextWidth('…', fontSize);
    if (maxWidth < ellipsisW) return '';
    let lo = 0, hi = text.length;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        const candidate = text.slice(0, mid) + '…';
        if (approxTextWidth(candidate, fontSize) <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    return lo === 0 ? '' : text.slice(0, lo) + '…';
};

function injectTreemapLabels(rootEl, seriesArr, formatY) {
    if (!rootEl) return;
    const treemapRoot = rootEl.querySelector('.apexcharts-treemap');
    if (!treemapRoot) return;

    // Drop any labels we injected on previous runs (mounted, animationEnd,
    // etc. all call this — must be idempotent).
    treemapRoot.querySelectorAll('.' + CUSTOM_TREEMAP_CLASS).forEach((el) => el.remove());

    // Each apex series is one cell (the user's setup). seriesArr[i].name and
    // sum of data.y match cell i.
    const cells = treemapRoot.querySelectorAll('g.apexcharts-series');
    cells.forEach((cell, i) => {
        const shape = cell.querySelector('rect, path');
        if (!shape) return;
        let bbox;
        try { bbox = shape.getBBox(); } catch (_) { return; }
        // Skip tiny cells where any label would overflow.
        if (bbox.width < 32 || bbox.height < 18) return;
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;

        const s = seriesArr?.[i];
        if (!s) return;
        const value = (s.data || []).reduce((acc, d) => acc + (Number(d.y) || 0), 0);
        const name = s.name || `Series ${i + 1}`;
        const valueStr = typeof formatY === 'function' ? formatY(value) : String(value);

        // Pick a font size that scales with the cell's smaller dimension so
        // big cells get big labels and modest cells stay readable.
        const baseFontSize = Math.max(10, Math.min(20, Math.round(Math.min(bbox.width, bbox.height) / 7)));
        const valueFontSize = Math.max(9, Math.round(baseFontSize * 0.8));
        const lineHeight = baseFontSize * 1.15;
        const valueLineHeight = valueFontSize * 1.15;

        // Reserve a bit of horizontal padding so labels don't touch the
        // cell edge. Truncate to fit; skip a line entirely if even the
        // ellipsis won't fit.
        const innerWidth = Math.max(0, bbox.width - 8);
        const innerHeight = Math.max(0, bbox.height - 6);
        const nameFitted = truncateToFit(name, innerWidth, baseFontSize);
        const valueFitted = truncateToFit(valueStr, innerWidth, valueFontSize);

        // Need vertical room for both lines. If the cell is too short, drop
        // the value (less informative than the name).
        const showValue = valueFitted && (lineHeight + valueLineHeight) <= innerHeight;
        if (!nameFitted && !showValue) return;

        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('class', CUSTOM_TREEMAP_CLASS);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', 'Onest, sans-serif');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', '#ffffff');
        text.setAttribute('pointer-events', 'none');
        text.style.textShadow = '0 1px 2px rgba(0,0,0,0.4)';

        if (nameFitted && showValue) {
            const totalH = lineHeight + valueLineHeight;
            const topY = cy - totalH / 2 + baseFontSize * 0.85;
            const nameSpan = document.createElementNS(SVG_NS, 'tspan');
            nameSpan.setAttribute('x', String(cx));
            nameSpan.setAttribute('y', String(topY));
            nameSpan.setAttribute('font-size', String(baseFontSize));
            nameSpan.textContent = nameFitted;
            text.appendChild(nameSpan);

            const valueSpan = document.createElementNS(SVG_NS, 'tspan');
            valueSpan.setAttribute('x', String(cx));
            valueSpan.setAttribute('y', String(topY + lineHeight));
            valueSpan.setAttribute('font-weight', '500');
            valueSpan.setAttribute('font-size', String(valueFontSize));
            valueSpan.textContent = valueFitted;
            text.appendChild(valueSpan);
        } else if (nameFitted) {
            const span = document.createElementNS(SVG_NS, 'tspan');
            span.setAttribute('x', String(cx));
            span.setAttribute('y', String(cy + baseFontSize * 0.35));
            span.setAttribute('font-size', String(baseFontSize));
            span.textContent = nameFitted;
            text.appendChild(span);
        } else {
            // Only value fits.
            const span = document.createElementNS(SVG_NS, 'tspan');
            span.setAttribute('x', String(cx));
            span.setAttribute('y', String(cy + valueFontSize * 0.35));
            span.setAttribute('font-weight', '500');
            span.setAttribute('font-size', String(valueFontSize));
            span.textContent = valueFitted;
            text.appendChild(span);
        }

        cell.appendChild(text);
    });
}

// Inject "ghost" entries for pie / donut slices the user has toggled off.
// We can't append into apex's own legend — apex calculates the legend's
// height when laying out the chart, so growing it after the fact pushes
// the rows on top of the slice. Instead we mount the ghosts in a dedicated
// container at the bottom of the chart wrapper, outside apex's layout.
const PIE_GHOST_CONTAINER_CLASS = 'roots-pie-ghost-container';
function injectHiddenSliceGhosts(chart, hiddenLabels, setHiddenLabels) {
    const root = chart?.el;
    if (!root) return;
    let container = root.querySelector('.' + PIE_GHOST_CONTAINER_CLASS);
    if (hiddenLabels.size === 0) {
        if (container) container.remove();
        return;
    }
    if (!container) {
        container = document.createElement('div');
        container.className = PIE_GHOST_CONTAINER_CLASS;
        Object.assign(container.style, {
            position: 'absolute',
            left: '8px',
            right: '8px',
            bottom: '4px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px 10px',
            justifyContent: 'center',
            fontFamily: 'Onest, sans-serif',
            fontSize: '11px',
            zIndex: '5',
            pointerEvents: 'auto',
        });
        // Position relative on the wrapper so absolute children land
        // inside it (apex's wrapper is already positioned).
        if (getComputedStyle(root).position === 'static') {
            root.style.position = 'relative';
        }
        root.appendChild(container);
    }
    // Idempotent: replace contents on every call.
    container.innerHTML = '';
    hiddenLabels.forEach((label) => {
        const chip = document.createElement('span');
        chip.style.cursor = 'pointer';
        chip.style.padding = '2px 8px';
        chip.style.borderRadius = '999px';
        chip.style.background = '#f3f4f6';
        chip.style.color = '#737373';
        chip.style.border = '1px solid #e5e5e5';
        chip.style.textDecoration = 'line-through';
        chip.style.userSelect = 'none';
        chip.title = label;
        chip.textContent = label;
        chip.addEventListener('click', () => {
            setHiddenLabels((prev) => {
                const next = new Set(prev);
                next.delete(label);
                return next;
            });
        });
        container.appendChild(chip);
    });
}

// Global guard: ApexCharts has several internal promise chains (animations,
// zoom, updates) whose rejections we cannot intercept from the caller. A
// rejected internal promise becomes an "Uncaught (in promise)" and pollutes
// the console, and in some browsers counts as an app-level error. Swallow
// anything that originates from within Apex so a single bad chart can't make
// the whole page look broken; still log loudly enough to diagnose.
if (typeof window !== 'undefined' && !window.__apexUnhandledGuardInstalled) {
    window.__apexUnhandledGuardInstalled = true;
    window.addEventListener('unhandledrejection', (event) => {
        const err = event.reason;
        const stack = err && err.stack ? String(err.stack) : '';
        const msg = err && err.message ? String(err.message) : String(err);
        // Heuristic match: errors originating inside the apexcharts bundle
        // either reference 'apexcharts' or have the minified 'r.value' frames
        // we've seen at the top of the stack.
        const looksLikeApex = /apexcharts|apexcharts\.js|r\.value \(/.test(stack) || /apexcharts/i.test(msg);
        if (looksLikeApex) {
            console.warn('[Chart] Suppressed ApexCharts internal rejection:', err);
            event.preventDefault();
            return;
        }
        // Everything else: surface to the user as a toast so runtime errors
        // aren't silent. Axios errors already fire their own toast from the
        // response interceptor, so skip those.
        const isAxios = err && (err.isAxiosError || err.config || err.response);
        if (isAxios) return;
        try {
            // Lazy-require to avoid a circular import chain at module init.
            import('../utils/toast').then(({ showError }) => {
                showError(`Erro: ${msg}`, 7000);
            });
        } catch (_) { /* swallow */ }
    });

    window.addEventListener('error', (event) => {
        const msg = event?.error?.message || event?.message || '';
        if (!msg) return;
        try {
            import('../utils/toast').then(({ showError }) => {
                showError(`Erro: ${msg}`, 7000);
            });
        } catch (_) { /* swallow */ }
    });
}

const GChart = forwardRef(({ title, chartId, chartType, xaxisType, annotations = DEFAULT_ANNOTATIONS, log, series, group, height, themeMode = 'light', showLegend = true, showToolbar = true, showTooltip = true, allowUserInteraction = true, compact = false, minimalAxis = false, activeTool = 'pan', disableAnimations = false, onViewportChange, xaxisRange, xaxisTitle = '', yaxisTitle = '' }, ref) => {
    const [labelColor, setLabelColor] = useState('var(--color-base-content)')
    const [options, setOptions] = useState({})
    const chartRef = useRef(null)
    const chartContainerRef = useRef(null)
    const onViewportChangeRef = useRef(onViewportChange)
    // Click-to-pin annotations. Map<id, annotationConfig> so we can re-apply
    // every pin after each chart rebuild (apex destroys annotations when the
    // chart is destroyed; the user expects pins to stick across re-renders).
    const pinnedPointsRef = useRef(new Map())
    // Stored reference to the annotation click handler so we can remove the
    // old one before attaching a new one on each chart rebuild — the chart
    // container DOM element is reused across rebuilds, so without this the
    // handler accumulates and a single click fires it multiple times.
    const annotClickHandlerRef = useRef(null)
    // Pie / donut legend (or slice) click: apex's default toggle for
    // categorical aggregates is select/deselect (cosmetic), not hide. Track
    // hidden labels here and filter them out before building the apex
    // payload — that's the only way to make a slice actually disappear.
    const [hiddenSliceLabels, setHiddenSliceLabels] = useState(new Set())

    // Reset hidden slices when the underlying series shape changes — labels
    // may have been added/removed and any stale entry would be a no-op.
    useEffect(() => {
        setHiddenSliceLabels(new Set())
    }, [chartType, chartId])

    useImperativeHandle(ref, () => ({
        chart: chartRef.current
    }));

    useEffect(() => {
        onViewportChangeRef.current = onViewportChange;
    }, [onViewportChange]);


    useEffect(() => {
        const computedStyle = getComputedStyle(document.documentElement)
        const baseContentColor = computedStyle.getPropertyValue('--color-base-content').trim()

        if (baseContentColor) {
            setLabelColor(baseContentColor)
        }
    }, [themeMode])

    // ApexCharts uses these internal type names; a few of our selectable
    // values map onto them.
    const apexChartType = (
        chartType === 'column' || chartType === 'stackedColumn' || chartType === 'stackedBar' ? 'bar'
        : chartType === 'donut' ? 'donut'
        : chartType === 'pie' ? 'pie'
        : chartType === 'treemap' ? 'treemap'
        : chartType === 'heatmap' ? 'heatmap'
        : chartType === 'boxPlot' ? 'boxPlot'
        : chartType === 'candlestick' ? 'candlestick'
        : chartType === 'rangeBar' ? 'rangeBar'
        : chartType === 'rangeArea' ? 'rangeArea'
        : chartType
    );
    const isCategoricalAggregate = chartType === 'pie' || chartType === 'donut';
    const isStacked = chartType === 'stackedColumn' || chartType === 'stackedBar';
    const isHorizontal = chartType === 'bar' || chartType === 'stackedBar';
    const isTreemap = chartType === 'treemap';
    const isHeatmap = chartType === 'heatmap';
    const isBoxPlot = chartType === 'boxPlot';
    const isRange = chartType === 'rangeBar' || chartType === 'rangeArea';
    const isCandlestick = chartType === 'candlestick';
    // Zoom / pan / selection only make sense for axes the user can scrub
    // along. Pie / donut / treemap have no axis; box-plot, candlestick and
    // range charts collapse the data into one item per series. Line, area,
    // scatter, bar and column all support x-axis zoom — including bar /
    // column on a category axis (Apex maps the drag to category indices).
    const supportsZoomPan = ['line', 'area', 'scatter', 'bar', 'column', 'stackedColumn', 'stackedBar'].includes(chartType);

    // Apply xaxisRange (viewport zoom/pan) imperatively. Calling
    // `chart.updateOptions(..., false, false)` lets apex update its internal
    // min/max without redrawing the whole chart and without animating, which
    // is critical: during a pan gesture, apex fires `scrolled` on every
    // tick, the parent stores the new viewport, and a full rebuild here
    // would tear the chart down mid-drag — making pan look completely
    // broken even though apex has wired all the events up correctly.
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart || typeof chart.updateOptions !== 'function') return;
        if (!supportsZoomPan) return;
        // Only apply an explicit, non-null range. When the parent clears its
        // viewport (no zoom / no pan history), apex's own min/max recompute
        // from the data range is what we want — calling updateOptions here
        // with undefined values forces an unnecessary rebuild and can reset
        // pan state set up in `mounted`.
        if (xaxisRange?.min == null || xaxisRange?.max == null) return;
        const min = xaxisRange.min;
        const max = xaxisRange.max;
        // Apex already mutates its own xaxis as the user pans, then fires
        // `scrolled` which the parent reflects back into `xaxisRange`. If the
        // values match what apex already has, skip — re-applying them via
        // updateOptions during an active drag yanks the chart out from under
        // the gesture and the pan visibly stops moving.
        const curMin = chart?.w?.config?.xaxis?.min;
        const curMax = chart?.w?.config?.xaxis?.max;
        if (curMin === min && curMax === max) return;
        try {
            chart.updateOptions({ xaxis: { min, max } }, false, false);
        } catch (_) { /* swallow */ }
    }, [xaxisRange?.min, xaxisRange?.max, supportsZoomPan]);

    const detectGranularity = (xs) => {
        const dates = (xs || []).map(v => new Date(v)).filter(d => !isNaN(d));
        if (!dates.length) return 'day';
        const allYearStart = dates.every(d => d.getUTCMonth() === 0 && d.getUTCDate() === 1 && d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
        if (allYearStart) return 'year';
        const allMonthStart = dates.every(d => d.getUTCDate() === 1 && d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
        if (allMonthStart) return 'month';
        const allDayStart = dates.every(d => d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0);
        if (allDayStart) return 'day';
        const allMinuteStart = dates.every(d => d.getUTCSeconds() === 0);
        if (allMinuteStart) return 'minute';
        return 'second';
    }

    const dateGranularity = (xaxisType === 'datetime')
        ? detectGranularity((series || []).flatMap(s => (s.data || []).map(d => d.x)))
        : 'day';

    const formatDate = (value) => {
        const d = new Date(value);
        if (isNaN(d)) return value;
        if (dateGranularity === 'year') return String(d.getUTCFullYear());
        if (dateGranularity === 'month') {
            return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        }
        return d.toLocaleDateString('pt-PT', { timeZone: 'UTC' });
    }

    // Tooltip formatter — when the data has sub-day timestamps (e.g. APIs that
    // emit a point every 30 minutes), show the exact time alongside the date
    // so the user can disambiguate same-day points. Axis labels still use the
    // coarser `formatDate` to avoid clutter.
    const formatDateTooltip = (value) => {
        const d = new Date(value);
        if (isNaN(d)) return value;
        if (dateGranularity === 'year') return String(d.getUTCFullYear());
        if (dateGranularity === 'month') {
            return d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric', timeZone: 'UTC' });
        }
        if (dateGranularity === 'day') {
            return d.toLocaleDateString('pt-PT', { timeZone: 'UTC' });
        }
        const datePart = d.toLocaleDateString('pt-PT', { timeZone: 'UTC' });
        const timeOpts = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC', hour12: false };
        if (dateGranularity === 'second') timeOpts.second = '2-digit';
        const timePart = d.toLocaleTimeString('pt-PT', timeOpts);
        return `${datePart} ${timePart}`;
    }

    const formatValue = (value) => {
        if (xaxisType === 'datetime') {
            return formatDate(value);
        } else if (typeof value === 'number') {
            return value.toFixed(2)
        } else {
            return value
        }
    }

    const formatTooltipX = (value) => {
        if (xaxisType === 'datetime') return formatDateTooltip(value);
        return formatValue(value);
    }

    const formatYValue = (value) => {
        if (typeof value !== 'number' || !isFinite(value)) return value;
        const abs = Math.abs(value);
        const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : abs >= 1 ? 2 : 3;
        return value.toLocaleString('pt-PT', { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
    }

    useEffect(() => {
        const shape = series.map(s => s.shape)
        const _series = series.filter(s => {
            if (s.hidden) return false;
            if (isStacked) {
                const name = (s.name || '').toLowerCase();
                // Filter out common "total" labels when stacked to avoid double-counting
                // (the stack already represents the total of its parts).
                if (name === 'total' || name === 'totais') return false;
            }
            return true;
        });

        // Resolve CSS custom properties and modern color functions (oklch, etc.) to
        // plain rgb(...) so the chart exports cleanly to PNG.
        const resolveColor = (input) => {
            if (!input) return input;
            try {
                const probe = document.createElement('div');
                probe.style.color = 'transparent';
                probe.style.color = input;
                if (!probe.style.color || probe.style.color === 'transparent') return input;
                document.body.appendChild(probe);
                const resolved = getComputedStyle(probe).color;
                document.body.removeChild(probe);
                return resolved || input;
            } catch (_) {
                return input;
            }
        };

        // Series palette. Picked so adjacent indices land on hues that are
        // unambiguously different — composition routinely produces N distinct
        // sources at the same time, so the first few colors must be very
        // distinct, not "different shades of brand blue". Earlier the palette
        // started with primary (navy ~254°) followed by primary-hover (also
        // navy) which made two-series composed charts look like one line; we
        // also drop --color-info (sky ~232°) for the same reason. Hues
        // chosen below span the wheel: blue, orange, green, red, purple,
        // teal, yellow, magenta.
        const brandColors = [
            'var(--color-primary)',         // navy blue (brand) ~254°
            'oklch(70% 0.17 50)',           // orange ~50°
            'var(--color-secondary)',       // green (brand) ~163°
            'oklch(65% 0.2 25)',            // red ~25°
            'var(--color-accent)',          // teal (brand) ~182°
            'oklch(60% 0.2 290)',           // purple ~290°
            'oklch(80% 0.17 90)',           // yellow ~90°
            'oklch(65% 0.2 350)',           // magenta ~350°
        ].map(resolveColor)

        // Treemap renders one apex series per cell so the legend can show one
        // entry per cell. With more cells than brand colours, the palette
        // would loop and adjacent cells would clash; pad it with HSL-spaced
        // hues for any extras.
        const seriesCount = (_series || []).length;
        const extendedColors = isTreemap && seriesCount > brandColors.length
            ? [
                ...brandColors,
                ...Array.from({ length: seriesCount - brandColors.length }, (_, i) => {
                    const hue = ((i + brandColors.length) * 47) % 360;
                    return `hsl(${hue}, 65%, 55%)`;
                }),
            ]
            : brandColors;

        let axisRangeMin = undefined;
        let axisRangeMax = undefined;

        // viewport (and therefore xaxisRange) is in raw x units — milliseconds
        // for datetime, numbers for numeric. Applying ms values to a category
        // axis (boxPlot, heatmap, treemap…) makes ApexCharts try to pre-allocate
        // an array of length ~ms-since-epoch and crash with "Invalid array
        // length". Only feed it back to charts that share the source x type.
        if (xaxisRange?.min != null && xaxisRange?.max != null && supportsZoomPan) {
            axisRangeMin = xaxisRange.min;
            axisRangeMax = xaxisRange.max;
        }

        // Build the series / labels payload for this chart type. Each adapter
        // lives in utils/chartSeries.js so the per-type shape rules can be
        // unit-tested without spinning up a chart.
        let apexSeries;
        let apexLabels;
        if (isCategoricalAggregate) {
            const payload = buildPieDonutPayload(_series);
            // Strip user-hidden slices from apex's payload — apex pie
            // crashes when a slice has value 0 (path becomes degenerate
            // and `elPath.node` ends up undefined). The hidden labels are
            // re-added to the rendered legend as struck-through ghost
            // entries by `injectHiddenSliceGhosts` in the mounted hook,
            // so the user can still click them to re-enable.
            if (hiddenSliceLabels.size > 0 && Array.isArray(payload.apexLabels)) {
                const keptIndices = payload.apexLabels
                    .map((label, i) => (hiddenSliceLabels.has(label) ? -1 : i))
                    .filter(i => i >= 0);
                apexSeries = keptIndices.map(i => payload.apexSeries[i]);
                apexLabels = keptIndices.map(i => payload.apexLabels[i]);
            } else {
                apexSeries = payload.apexSeries;
                apexLabels = payload.apexLabels;
            }
        } else if (isTreemap) {
            apexSeries = buildTreemapPayload(_series).apexSeries;
        } else if (isHeatmap) {
            // Apex heatmap forces categorical x. Reuse the chart's date
            // formatter so labels match what the line chart shows.
            const xLabel = xaxisType === 'datetime' ? formatDate : (v) => String(v);
            apexSeries = buildHeatmapPayload(_series, xLabel).apexSeries;
        } else if (isBoxPlot) {
            apexSeries = buildBoxPlotPayload(_series).apexSeries;
        } else if (isRange) {
            apexSeries = buildRangePayload(_series).apexSeries;
        } else if (isCandlestick) {
            apexSeries = buildCandlestickPayload(_series).apexSeries;
        } else {
            apexSeries = _series.map(s => {
                let sortedData = xaxisType === 'datetime'
                    ? [...s.data].sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime())
                    : xaxisType === 'numeric'
                        ? [...s.data].sort((a, b) => a.x - b.x)
                        : [...s.data];
                // For horizontal bars, ApexCharts uses data.x values as literal
                // category labels on the visual Y axis without running them through
                // any formatter. Pre-convert timestamps/numbers to display strings
                // so the Y axis shows "2020" instead of a raw timestamp.
                if (isHorizontal) {
                    sortedData = sortedData.map(d => ({ ...d, x: formatValue(d.x) }));
                }
                return { ...s, data: sortedData };
            });
        }

        // Numeric axis (Y for column/line, X for bar) needs a "nice" min/max to 
        // prevent clipping and provide a clean 0-baseline where appropriate.
        const calculateNiceMin = () => {
            if (log) return undefined;
            const ys = (_series || []).flatMap(s => (s.data || []).map(d => parseFloat(d.y))).filter(v => isFinite(v));
            if (!ys.length) return undefined;
            return Math.min(...ys) >= 0 ? 0 : undefined;
        };

        const calculateNiceMax = () => {
            if (log) return undefined;
            
            let dataMax;
            if (isStacked) {
                // For stacked charts, max is the highest SUM across all 
                // series at any single X point.
                const sums = new Map();
                (_series || []).forEach(s => {
                    (s.data || []).forEach(d => {
                        const x = String(d.x);
                        sums.set(x, (sums.get(x) || 0) + (parseFloat(d.y) || 0));
                    });
                });
                dataMax = Math.max(...Array.from(sums.values()), 0);
            } else {
                const ys = (_series || []).flatMap(s => (s.data || []).map(d => parseFloat(d.y))).filter(v => isFinite(v));
                if (!ys.length) return undefined;
                dataMax = Math.max(...ys);
            }
            
            if (dataMax <= 0) return undefined;
            const padded = dataMax * 1.1;
            const mag = Math.pow(10, Math.floor(Math.log10(padded)));
            const normalized = padded / mag;
            const niceSteps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
            const niceStep = niceSteps.find(s => s >= normalized) || 10;
            return niceStep * mag;
        };

        const chartOptions = {
            colors: extendedColors,
            chart: {
                type: apexChartType,
                stacked: isStacked,
                id: chartId,
                group: group,
                background: 'transparent',
                animations: {
                    enabled: !disableAnimations,
                    easing: 'easeinout',
                    speed: disableAnimations ? 0 : 500,
                    animateGradually: {
                        enabled: !disableAnimations,
                        delay: disableAnimations ? 0 : 100
                    },
                    dynamicAnimation: {
                        enabled: !disableAnimations,
                        speed: disableAnimations ? 0 : 150
                    }
                },
                height: height,
                redrawOnParentResize: true,
                zoom: {
                    type: 'x',
                    enabled: allowUserInteraction && supportsZoomPan,
                    autoScaleYaxis: allowUserInteraction && supportsZoomPan,
                },
                pan: {
                    enabled: allowUserInteraction && supportsZoomPan,
                    type: 'x',
                    rangeX: undefined
                },
                selection: {
                    enabled: allowUserInteraction && supportsZoomPan,
                    type: 'x'
                },
                toolbar: {
                    show: showToolbar,
                    tools: {
                        // Must be truthy so ApexCharts builds the download menu DOM —
                        // chart.dataURI() reads .style on it internally. The toolbar
                        // is hidden offscreen via CSS, so this is invisible to users.
                        download: true,
                        selection: allowUserInteraction && supportsZoomPan,
                        zoom: allowUserInteraction && supportsZoomPan,
                        zoomin: allowUserInteraction && supportsZoomPan,
                        zoomout: allowUserInteraction && supportsZoomPan,
                        pan: allowUserInteraction && supportsZoomPan,
                        reset: allowUserInteraction && supportsZoomPan,
                    },
                    autoSelected: allowUserInteraction && supportsZoomPan ? activeTool : undefined,
                },
                events: {
                    beforeMount: function (chart) {
                        if (document.getElementById('roots-apexcharts-theme')) return;
                        const style = document.createElement('style');
                        style.id = 'roots-apexcharts-theme';
                        style.innerHTML = `
                            .apexcharts-toolbar {
                                position: absolute !important;
                                left: -10000px !important;
                                top: -10000px !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }
                            /* The annotation label (value tag) is clickable
                               to remove its pin — see the chart.el click
                               delegation in the mounted handler. The cursor
                               cue makes that affordance discoverable. */
                            .apexcharts-point-annotation-label {
                                cursor: pointer;
                            }
                        `;
                        document.head.appendChild(style);
                    },
                    animationEnd: function(chart) {
                        if (isTreemap) injectTreemapLabels(chart?.el, _series, formatYValue);
                    },
                    zoomed: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current) {
                            if (xaxis) onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    },
                    updated: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current) {
                            if (xaxis) onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                        if (isTreemap) {
                            requestAnimationFrame(() => injectTreemapLabels(chartContext?.el, _series, formatYValue));
                        }
                    },
                    scrolled: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current) {
                            if (xaxis) onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                        }
                    },
                    selection: function(chartContext, { xaxis }) {
                        if (onViewportChangeRef.current) {
                            if (xaxis && xaxis.min != null && xaxis.max != null && xaxis.min < xaxis.max) {
                                onViewportChangeRef.current({ min: xaxis.min, max: xaxis.max });
                            }
                        }
                    },
                    legendClick: function(_chartContext, seriesIndex, w) {
                        // Pie / donut: legend click toggles the slice's
                        // visibility ourselves because apex's default for
                        // these chart types is select-only (cosmetic, no
                        // hide). For axis charts we don't enter this branch
                        // and apex's built-in toggleDataSeries handles it.
                        if (!isCategoricalAggregate) return;
                        const labels = w?.config?.labels || [];
                        const label = labels[seriesIndex];
                        if (!label) return;
                        setHiddenSliceLabels(prev => {
                            const next = new Set(prev);
                            if (next.has(label)) next.delete(label);
                            else next.add(label);
                            return next;
                        });
                    },
                    dataPointSelection: function(_event, chartContext, opts) {
                        // Pin-on-click only makes sense for chart types with
                        // an x/y axis. Pie / donut / treemap / heatmap /
                        // box-plot / range / candlestick crash inside apex's
                        // annotation renderer when point annotations are
                        // added. For pie/donut, slice-click toggling via
                        // chartContext.toggleSeries also recurses (apex
                        // re-dispatches a click which re-fires this event)
                        // so the legend click is the supported way to hide
                        // a slice — see legend.onItemClick below.
                        if (isCategoricalAggregate || isTreemap || isHeatmap
                            || isBoxPlot || isRange || isCandlestick) return;
                        // Self-heal: an HMR session that started before the
                        // ref switched from `Set` to `Map` will still hold a
                        // Set in `.current`. Replace it before any `.set`/
                        // `.has` call so dev sessions don't crash.
                        if (!(pinnedPointsRef.current instanceof Map)) {
                            pinnedPointsRef.current = new Map();
                        }
                        const seriesIndex = opts?.seriesIndex;
                        const dataPointIndex = opts?.dataPointIndex;
                        if (seriesIndex == null || seriesIndex < 0 || dataPointIndex == null || dataPointIndex < 0) return;
                        const point = _series?.[seriesIndex]?.data?.[dataPointIndex];
                        if (!point || point.x == null || point.y == null) return;
                        const id = `pinned-${seriesIndex}-${dataPointIndex}`;
                        if (pinnedPointsRef.current.has(id)) {
                            // Toggle off — remove from chart and from our store.
                            try { chartContext.removeAnnotation(id); } catch (_) { /* swallow */ }
                            pinnedPointsRef.current.delete(id);
                            return;
                        }
                        const xValue = xaxisType === 'datetime'
                            ? (point.x instanceof Date ? point.x.getTime() : new Date(point.x).getTime())
                            : point.x;
                        const seriesName = _series?.[seriesIndex]?.name || `Série ${seriesIndex + 1}`;
                        // Persist the full annotation config so we can replay
                        // it on every chart rebuild without losing pins.
                        // No `marker` here on purpose: an annotation marker
                        // is drawn ON TOP of the original data point and
                        // visually replaces it. We just want the label to
                        // pin the point — the existing chart marker stays
                        // visible and unmodified.
                        const cfg = {
                            x: xValue,
                            y: point.y,
                            seriesIndex,
                            label: {
                                borderColor: 'var(--color-primary)',
                                offsetY: 0,
                                style: {
                                    color: 'var(--color-primary-content)',
                                    background: 'var(--color-primary)',
                                    fontFamily: 'Onest, sans-serif',
                                    fontSize: '12px',
                                    padding: { left: 6, right: 6, top: 2, bottom: 2 },
                                },
                                text: `${seriesName}: ${formatYValue(point.y)}`,
                            },
                        };
                        // pushToMemory:true so apex persists the annotation
                        // through internal re-renders (zoom, pan, viewport
                        // updates). Without it the pin is dropped on zoom.
                        chartContext.addPointAnnotation({ id, ...cfg }, true);
                        pinnedPointsRef.current.set(id, cfg);
                    },
                    mounted: function(chart) {
                        // Treemap labels: apex paints in stages and the
                        // first frame may not have final rect dimensions.
                        // Inject on the next frame and again after a beat
                        // to cover the slow path.
                        if (isTreemap) {
                            const el = chart?.el;
                            requestAnimationFrame(() => injectTreemapLabels(el, _series, formatYValue));
                            setTimeout(() => injectTreemapLabels(el, _series, formatYValue), 80);
                            setTimeout(() => injectTreemapLabels(el, _series, formatYValue), 320);
                        }
                        // Pie / donut: re-inject struck-through legend entries
                        // for the slices the user has toggled off. Apex's own
                        // legend only contains the visible labels (we strip
                        // hidden ones from the payload to avoid the 0-value
                        // crash), so this is the only way the user can find
                        // and re-enable a hidden slice.
                        if (isCategoricalAggregate && hiddenSliceLabels.size > 0) {
                            requestAnimationFrame(() =>
                                injectHiddenSliceGhosts(chart, hiddenSliceLabels, setHiddenSliceLabels)
                            );
                        }
                        // Replay click-pinned annotations. Apex destroys
                        // annotations on every rebuild, so without replay
                        // pins would vanish whenever the chart re-renders
                        // (filter change, chart-type switch, even some
                        // internal apex updates).
                        if (!(pinnedPointsRef.current instanceof Map)) {
                            pinnedPointsRef.current = new Map();
                        }
                        if (pinnedPointsRef.current.size > 0) {
                            requestAnimationFrame(() => {
                                pinnedPointsRef.current.forEach((cfg, id) => {
                                    try { chart.addPointAnnotation({ id, ...cfg }, true); } catch (_) { /* swallow */ }
                                });
                            });
                        }

                        // Click delegation: clicking the annotation label
                        // removes the pin. Apex stamps the annotation id as a
                        // CSS class on the label rect AND text, but clicking
                        // the text element won't walk up to the rect sibling —
                        // so we use two strategies:
                        // 1. composedPath walk: catches direct class matches.
                        // 2. Coordinate fallback: if the click landed inside
                        //    .apexcharts-point-annotations without matching a
                        //    class, query every pin's annotation element by
                        //    class and check click proximity. This handles the
                        //    text/rect sibling case.
                        const chartEl = chart?.el;
                        if (chartEl) {
                            if (annotClickHandlerRef.current) {
                                chartEl.removeEventListener('click', annotClickHandlerRef.current);
                            }
                            annotClickHandlerRef.current = (e) => {
                                if (pinnedPointsRef.current.size === 0) return;
                                const path = e.composedPath ? e.composedPath() : [];
                                let matchId = null;

                                // Strategy 1: walk composedPath checking classList
                                for (const node of path) {
                                    if (node === chartEl) break;
                                    if (node.classList) {
                                        for (const cls of node.classList) {
                                            if (pinnedPointsRef.current.has(cls)) {
                                                matchId = cls;
                                                break;
                                            }
                                        }
                                    }
                                    if (matchId) break;
                                }

                                // Strategy 2: coordinate proximity within annotations group
                                if (!matchId) {
                                    const annotContainer = chartEl.querySelector('.apexcharts-point-annotations');
                                    // `composedPath()` includes Window at the
                                    // end, which isn't a Node; calling
                                    // `Node.contains(window)` throws. Restrict
                                    // the check to actual Node entries.
                                    const inAnnotations = annotContainer && path.some(n => (
                                        n === annotContainer
                                        || (n instanceof Node && annotContainer.contains(n))
                                    ));
                                    if (inAnnotations) {
                                        for (const [id] of pinnedPointsRef.current) {
                                            const el = annotContainer.querySelector(`.${id}`);
                                            if (!el) continue;
                                            const r = el.getBoundingClientRect();
                                            const pad = 8;
                                            if (e.clientX >= r.left - pad && e.clientX <= r.right + pad &&
                                                e.clientY >= r.top - pad && e.clientY <= r.bottom + pad) {
                                                matchId = id;
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (!matchId) return;
                                try { chart.removeAnnotation(matchId); } catch (_) { /* swallow */ }
                                pinnedPointsRef.current.delete(matchId);
                            };
                            chartEl.addEventListener('click', annotClickHandlerRef.current);
                        }
                    },
                }
            },
            states: {
                active: { filter: { type: 'none' } }
            },
            plotOptions: {
                bar: {
                    horizontal: isHorizontal,
                    barHeight: isHorizontal ? '60%' : '85%',
                    columnWidth: '85%',
                },
                // Heatmap defaults to a single colour shade with no gradient,
                // making every cell look identical (the user reported "always
                // gray"). Hardcode a 4-stop blue→red colour ramp; the brand
                // palette resolves via CSS vars to several similar greens
                // and isn't useful for ordinal magnitude.
                heatmap: {
                    radius: 4,
                    useFillColorAsStroke: false,
                    enableShades: false,
                    distributed: false,
                    colorScale: (() => {
                        const ys = (_series || []).flatMap(s => (s.data || []).map(d => parseFloat(d.y))).filter(v => isFinite(v));
                        if (!ys.length) return undefined;
                        const min = Math.min(...ys);
                        const max = Math.max(...ys);
                        // Degenerate case (all values equal): give the whole
                        // range one colour so the chart isn't gray.
                        if (min === max) {
                            return { ranges: [{ from: min - 1, to: max + 1, color: '#60A5FA' }] };
                        }
                        const span = max - min;
                        const stop = (frac) => min + span * frac;
                        return {
                            ranges: [
                                { from: min,           to: stop(0.25), color: '#DBEAFE', name: 'low' },
                                { from: stop(0.25),    to: stop(0.5),  color: '#60A5FA' },
                                { from: stop(0.5),     to: stop(0.75), color: '#F59E0B' },
                                { from: stop(0.75),    to: max,        color: '#DC2626', name: 'high' },
                            ],
                        };
                    })(),
                },
                // Each treemap cell is its own apex series (so the legend
                // can show one entry per cell), so DON'T set distributed —
                // distributed picks colors by data-point index, and with
                // 1 cell per series every cell ends up at index 0 and they
                // all share colors[0]. Without distributed, apex falls back
                // to colors[seriesIndex], which is what we want here.
                treemap: {
                    distributed: false,
                    enableShades: false,
                },
                // Centre the pie/donut both vertically and horizontally in
                // its allotted area. Apex would otherwise pull the chart
                // upward when the legend is on the right, since it reserves
                // space for the (empty) title region at the top.
                pie: {
                    offsetX: 0,
                    offsetY: 0,
                    expandOnClick: false,
                },
            },
            dataLabels: {
                // Pie / donut rely on apex's in-slice labels. Treemap doesn't
                // — apex draws them at the top-left with a background rect
                // that's hard to remove without losing the text. We disable
                // apex labels for treemap and inject our own centred ones in
                // the mounted/animationEnd events (see injectTreemapLabels).
                enabled: isCategoricalAggregate,
                textAnchor: isCategoricalAggregate ? 'middle' : undefined,
                style: {
                    fontFamily: 'Onest, sans-serif',
                    fontSize: '12px',
                    fontWeight: 600,
                },
            },
            stroke: {
                width: compact ? 1.5 : 2,
                curve: compact ? 'monotoneCubic' : 'smooth'
            },
            fill: {
                opacity: 0.8
            },
            grid: {
                borderColor: 'var(--color-base-300)',
                strokeDashArray: 0,
                padding: compact ? {
                    top: -20,
                    right: 0,
                    bottom: 0,
                    left: 0
                } : {
                    top: 0,
                    right: 10,
                    bottom: 20,
                    left: 10
                },
                xaxis: {
                    lines: {
                        show: true
                    }
                },
                yaxis: {
                    lines: {
                        show: true
                    }
                }
            },
            series: apexSeries,
            ...(apexLabels ? { labels: apexLabels } : {}),
            title: {
                text: '',
                style: {
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: labelColor
                }
            },
            xaxis: {
                // These chart types collapse data into one item per series,
                // Categorical special cases (heatmap etc.) always use 'category'.
                // Horizontal bars need a numeric xaxis for the value scale on the
                // visual-X (bottom) — ApexCharts always puts xaxis on visual-X
                // regardless of orientation, so the swap is unavoidable.
                // All other charts use xaxisType so zoom/pan work correctly.
                type: (isHeatmap || isBoxPlot || isRange || isCandlestick || isTreemap)
                    ? 'category'
                    : isHorizontal ? 'numeric' : xaxisType,
                min: isHorizontal ? calculateNiceMin() : axisRangeMin,
                max: isHorizontal ? calculateNiceMax() : axisRangeMax,
                labels: {
                    show: !minimalAxis,
                    style: {
                        colors: '#737373',
                        fontSize: compact ? '11px' : isHorizontal ? '10px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    formatter: isHorizontal ? formatYValue : formatValue
                },
                axisBorder: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                title: {
                    text: (xaxisTitle && !minimalAxis) ? xaxisTitle : '',
                    style: {
                        color: '#000000',
                        fontSize: compact ? '11px' : '12px',
                        fontFamily: 'Onest, sans-serif',
                        fontWeight: 500,
                    }
                },
                tooltip: {
                    enabled: false
                }
            },
            yaxis: {
                forceNiceScale: true,
                min: calculateNiceMin(),
                max: calculateNiceMax(),
                labels: {
                    show: !minimalAxis,
                    style: {
                        colors: '#000000',
                        fontSize: compact ? '8px' : '12px',
                        fontFamily: 'Onest, sans-serif'
                    },
                    offsetX: compact ? -8 : 0,
                    formatter: formatYValue
                },
                axisBorder: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                axisTicks: {
                    show: !compact && !minimalAxis,
                    color: '#000000'
                },
                title: {
                    text: (yaxisTitle && !minimalAxis) ? yaxisTitle : '',
                    style: {
                        color: '#000000',
                        fontSize: compact ? '11px' : '12px',
                        fontFamily: 'Onest, sans-serif',
                        fontWeight: 500,
                    }
                },
                logarithmic: !!log,
                logBase: log || 10
            },
            annotations: {
                xaxis: annotations.xaxis.map(annotation => ({
                    x: annotation.value,
                    strokeDashArray: 8,
                    borderColor: 'var(--color-base-content)',
                    opacity: 0.1,
                    label: {
                        text: annotation.label,
                    }
                })),
                yaxis: annotations.yaxis.map(annotation => ({
                    y: annotation.value,
                    borderColor: 'var(--color-primary)',
                    label: {
                        borderColor: "var(--color-primary)",
                        text: annotation.label,
                        style: {
                            color: 'var(--color-primary-content)',
                            background: 'var(--color-primary)'
                        }
                    },
                }))
            },
            markers: {
                ...((shape || []).some(s => s) ? { shape } : {}),
                // Visible markers on every data point. Apex needs an actual
                // hit area (size > 0) for `tooltip.intersect:true` to work,
                // and intersect:true is the only way to make multi-line
                // tooltips track WHICH line the cursor is on (intersect:
                // false picks by x only and always returns series 0). We
                // keep them small so the line still reads cleanly.
                // In compact mode (previews), we hide markers to show only
                // a smooth curve.
                // Bar/column charts have no individual point markers — Apex
                // tries to call screenCTM() on them during zoom/pan updates
                // and crashes when the elements are null.
                size: compact || isHorizontal || chartType === 'column' || chartType === 'stackedColumn' ? 0 : 4,
                strokeWidth: 1,
                strokeColors: '#ffffff',
                hover: { size: isHorizontal || chartType === 'column' || chartType === 'stackedColumn' ? 0 : 7, sizeOffset: 3 },
            },
            legend: {
                show: showLegend,
                showForSingleSeries: showLegend,
                // Pie / donut: legend on the right by default so the slice
                // gets the full vertical space. The `responsive` block at
                // the chart level moves it underneath on narrow screens to
                // give the chart more room. For other chart types we let
                // apex use its default ('top') by omitting the keys —
                // passing `undefined` triggers the "Legend position not
                // supported" error from apex's validator.
                ...(isCategoricalAggregate ? { position: 'right', horizontalAlign: 'center' } : {}),
                // Click a legend label to toggle the corresponding series.
                // For axis charts apex's default toggleDataSeries does the
                // right thing. For pie/donut we run our own hide path via
                // the `legendClick` event — keeping apex's default enabled
                // there crashes when it tries to manipulate slice DOM that
                // we've already removed from the payload.
                onItemClick: { toggleDataSeries: !isCategoricalAggregate },
                // Pie / donut: turn off apex's hover-highlight on legend
                // items. Apex installs a capturing `mousemove` listener
                // when this is enabled, and our injected ghost rows have
                // no `rel` attribute — apex reads NaN from it and ends up
                // calling `escapeString(undefined).toString()` which
                // throws. The highlight is also pointless for pie/donut
                // since the slice sits right next to its legend label.
                ...(isCategoricalAggregate ? { onItemHover: { highlightDataSeries: false } } : {}),
                labels: {
                    colors: labelColor
                },
                markers: {
                    offsetX: -3,
                    size: 5,
                    strokeWidth: 0
                },
                itemMargin: {
                    horizontal: 15
                },
            },
            // Pie / donut: drop the legend below the chart on narrow screens
            // so the slice itself can use the full width. Apex applies these
            // overrides whenever its layout breakpoint matches. Note: apex
            // reads `responsive.length` unconditionally, so for non-pie
            // charts we pass an empty array (NOT undefined — that would
            // crash inside apex's Responsive module).
            responsive: isCategoricalAggregate ? [
                {
                    breakpoint: 768,
                    options: {
                        legend: {
                            position: 'bottom',
                            horizontalAlign: 'center',
                        },
                    },
                },
            ] : [],
            tooltip: {
                theme: themeMode,
                enabled: showTooltip,
                // Single-point tooltip: the cursor must land on a marker,
                // and only that one point's series shows up. apex's
                // `intersect:false` finds dataPointIndex by x but can't
                // disambiguate seriesIndex when multiple lines share that
                // x (it picks 0), which is what made the user see only the
                // first line's value. `intersect:true` + visible markers
                // (above) lets you target any specific line's point.
                shared: false,
                intersect: true,
                custom: showTooltip ? ({
                    series,
                    seriesIndex,
                    dataPointIndex,
                    w
                }) => {
                    // Pie / donut / treemap: one value per "series" (slice).
                    if (isCategoricalAggregate) {
                        const label = w?.config?.labels?.[seriesIndex] ?? `Série ${seriesIndex + 1}`;
                        const value = Array.isArray(series) ? series[seriesIndex] : undefined;
                        return `<div class="bg-base-100">
                            <div class="bg-base-200 p-2 font-bold text-base-content">${label}</div>
                            <div class="p-2"><span>${value ?? ''}</span></div>
                        </div>`;
                    }
                    // Heatmap: x value is the column, y is the cell value.
                    if (isHeatmap) {
                        const point = _series?.[seriesIndex]?.data?.[dataPointIndex];
                        const name = _series?.[seriesIndex]?.name || `Série ${seriesIndex + 1}`;
                        const xLabel = point ? formatTooltipX(point.x) : '';
                        const yValue = point ? point.y : '';
                        return `<div class="bg-base-100">
                            <div class="bg-base-200 p-2 font-bold text-base-content">${xLabel}</div>
                            <div class="p-2"><span class="font-semibold">${name}:</span> <span>${yValue}</span></div>
                        </div>`;
                    }
                    // Default {x, y} charts: show only the hovered series, not
                    // every line at this x.
                    const point = _series?.[seriesIndex]?.data?.[dataPointIndex];
                    if (!point) return '';
                    const seriesConfig = w?.config?.series?.[seriesIndex];
                    const seriesName = (seriesConfig && typeof seriesConfig === 'object' ? seriesConfig.name : null)
                        || _series?.[seriesIndex]?.name
                        || `Série ${seriesIndex + 1}`;
                    const value = Array.isArray(series?.[seriesIndex])
                        ? series[seriesIndex][dataPointIndex]
                        : series?.[seriesIndex];
                    return `<div class="bg-base-100">
                        <div class="bg-base-200 p-2 font-bold text-base-content">${formatTooltipX(point.x)}</div>
                        <div class="p-2">
                            <span class="font-semibold">${seriesName}:</span>
                            <span>${formatYValue(value)}</span>
                        </div>
                    </div>`;
                } : undefined
            }
        }

        if (chartRef.current) {
            try { chartRef.current.destroy() } catch (_) { /* swallow */ }
            // Null the ref so a subsequent effect run / unmount doesn't try
            // to destroy a half-torn-down chart, which crashes inside apex
            // (clearDomElements dereferences `Paper.node`, and Paper has
            // already been set to null by the first destroy).
            chartRef.current = null
        }
        // NOTE: do NOT reset pinnedPointsRef here — pins are intentionally
        // sticky across rebuilds. Apex destroys the annotations along with
        // the chart, but the `mounted` event above replays them onto the
        // new chart instance from this ref.

        try {
            const chart = new ApexCharts(chartContainerRef.current, chartOptions)
            // render() returns a promise; catch rejections so a chart-specific
            // failure (bad data shape for the chosen type) doesn't become an
            // unhandled promise rejection that tanks the page.
            chart.render().catch((err) => {
                console.error('ApexCharts render failed:', err, { chartType, chartId, seriesPreview: Array.isArray(apexSeries) ? apexSeries.slice(0, 2) : apexSeries });
                if (chartContainerRef.current) {
                    chartContainerRef.current.innerHTML = `
                        <div class="flex items-center justify-center w-full h-full text-xs text-base-content/60 text-center px-4">
                            Could not render this chart type with the current data.
                        </div>
                    `;
                }
            });
            chartRef.current = chart
        } catch (err) {
            console.error('ApexCharts construction failed:', err, { chartType, chartId });
        }

        return () => {
            if (chartRef.current) {
                // Wrap destroy in try/catch — apex's clearDomElements throws
                // when Paper is null (e.g. after a failed render or a prior
                // destroy), and an unhandled exception in a useEffect cleanup
                // bubbles up to React's error boundary.
                try { chartRef.current.destroy() } catch (_) { /* swallow */ }
                chartRef.current = null
            }
        }
        // `xaxisRange` is intentionally excluded from the dep list. Including
        // it destroys and rebuilds the chart on every pan tick (because
        // `scrolled` -> `onViewportChange` -> parent state -> new `xaxisRange`
        // prop), interrupting the drag and making pan look broken. Viewport
        // updates are applied imperatively via `chart.updateOptions` instead.
    }, [title, chartId, chartType, xaxisType, annotations, log, series, group, height, themeMode, labelColor, showLegend, showToolbar, showTooltip, allowUserInteraction, minimalAxis, activeTool, hiddenSliceLabels, xaxisTitle, yaxisTitle])


    return <div ref={chartContainerRef} className="w-full h-full" />
})

GChart.propTypes = {
    title: PropTypes.string,
    chartId: PropTypes.string.isRequired,
    chartType: PropTypes.oneOf([
        'line', 'area', 'bar', 'column', 'scatter',
        'pie', 'donut', 'treemap', 'heatmap',
        'boxPlot', 'candlestick', 'rangeBar', 'rangeArea',
    ]).isRequired,
    xaxisType: PropTypes.oneOf(['datetime', 'category', 'numeric']).isRequired,
    annotations: PropTypes.shape({
        xaxis: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            label: PropTypes.string
        })),
        yaxis: PropTypes.arrayOf(PropTypes.shape({
            value: PropTypes.number,
            label: PropTypes.string
        }))
    }),
    log: PropTypes.number,
    series: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        hidden: PropTypes.bool,
        data: PropTypes.arrayOf(PropTypes.shape({
            x: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            y: PropTypes.number
        }))
    })).isRequired,
    group: PropTypes.string,
    height: PropTypes.number,
    themeMode: PropTypes.oneOf(['light', 'dark']),
    showLegend: PropTypes.bool,
    showToolbar: PropTypes.bool,
    showTooltip: PropTypes.bool,
    allowUserInteraction: PropTypes.bool,
    compact: PropTypes.bool,
    minimalAxis: PropTypes.bool,
    activeTool: PropTypes.oneOf(['zoom', 'pan', 'selection', null]),
    disableAnimations: PropTypes.bool,
    onViewportChange: PropTypes.func,
    xaxisRange: PropTypes.shape({
        min: PropTypes.number,
        max: PropTypes.number
    }),
    xaxisTitle: PropTypes.string,
    yaxisTitle: PropTypes.string,
}

GChart.defaultProps = {
    annotations: { xaxis: [], yaxis: [] },
    themeMode: 'light',
    showLegend: true,
    showToolbar: true,
    showTooltip: true,
    allowUserInteraction: true,
    compact: false,
    disableAnimations: false
}

export default GChart