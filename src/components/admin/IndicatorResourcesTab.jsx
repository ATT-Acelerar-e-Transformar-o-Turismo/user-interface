import { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuEye, LuRefreshCw, LuScrollText, LuSquarePen, LuTrash2 } from 'react-icons/lu';
import indicatorService from '../../services/indicatorService';
import resourceService from '../../services/resourceService';
import ResourceWizard from '../wizard/ResourceWizard';
import SourcePill from './SourcePill';
import { sourceFromType } from '../../utils/resourceSource';
import { confirmAction } from '../../utils/confirm';
import { useWrapper } from '../../contexts/WrapperContext';

// Coerce any value to a safe string for rendering (some backend fields can be
// objects, e.g. localized names — rendering those raw crashes React).
function toText(v, fallback = '—') {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') return v.pt || v.en || v.name || v.label || v.value || JSON.stringify(v);
  return String(v);
}

// Full resource manager for a single indicator — list, add, view details,
// regenerate wrappers and delete. Replaces the standalone resources page;
// lives inside the indicator detail panel's "Recursos" tab.
export default function IndicatorResourcesTab({ indicatorId }) {
  const { t } = useTranslation();
  const [resources, setResources] = useState(null);
  const [error, setError] = useState(null);
  const [wizard, setWizard] = useState({ open: false, resourceId: null });
  const [details, setDetails] = useState(null); // the resource being inspected
  // Live wrapper run/logs modal: mode 'regenerate' kicks off a regeneration
  // and streams its logs; mode 'logs' just views the current logs.
  const [runModal, setRunModal] = useState(null); // { wrapperId, mode }

  const load = useCallback(async () => {
    try {
      setError(null);
      const ind = await indicatorService.getById(indicatorId);
      const ids = Array.isArray(ind?.resources) ? ind.resources : [];
      const detailObjs = (await Promise.all(ids.map(rid => resourceService.getById(rid).catch(() => null)))).filter(Boolean);
      const enriched = await Promise.all(detailObjs.map(async (r) => {
        let wrapper = null;
        if (r.wrapper_id) {
          try { wrapper = await resourceService.getWrapper(r.wrapper_id); } catch { /* ignore */ }
        }
        // Fall back to the resource's own denormalised `source_type` (set by
        // resource-service) if the wrapper lookup didn't return one — that
        // way a transient wrapper fetch failure doesn't surface as "—".
        const source = sourceFromType(wrapper?.source_type)
          || sourceFromType(r.source_type)
          || sourceFromType(r.type);
        return { ...r, _wrapper: wrapper, _source: source, _status: wrapper?.status || (r.wrapper_id ? 'unknown' : '—') };
      }));
      setResources(enriched);
    } catch (err) {
      setError(err.userMessage || err.message);
      setResources([]);
    }
  }, [indicatorId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (resource) => {
    const ok = await confirmAction({
      title: t('admin.resources.confirm_delete_title', 'Eliminar recurso?'),
      message: t('admin.resources.confirm_delete', { name: resource.name || resource.id, defaultValue: `Tem a certeza que deseja eliminar o recurso "${resource.name || resource.id}"?` }),
    });
    if (!ok) return;
    try {
      await resourceService.delete(resource.id);
      setResources(prev => (prev || []).filter(r => r.id !== resource.id));
    } catch (err) {
      setError(err.userMessage || err.message);
    }
  };

  const openRegenerate = async (resource) => {
    if (!resource.wrapper_id) return;
    const ok = await confirmAction({
      title: t('wizard.resource.regenerate_confirm_title', 'Regenerar wrapper?'),
      message: t('wizard.resource.regenerate_confirm_body', 'Regenerar irá descartar os dados existentes e voltar a obtê-los da fonte.'),
    });
    if (!ok) return;
    setRunModal({ wrapperId: resource.wrapper_id, mode: 'regenerate' });
  };

  const statusBadge = (status) => {
    const map = {
      completed: 'bg-[#16a34a]/10 text-[#16a34a]',
      executing: 'bg-[#eab308]/15 text-[#a16207]',
      pending: 'bg-[#eab308]/15 text-[#a16207]',
      error: 'bg-[#dc2626]/10 text-[#dc2626]',
    };
    return map[status] || 'bg-[#e5e7eb] text-[#404040]';
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => setWizard({ open: true, resourceId: null })}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[15px] text-[#fffefc] cursor-pointer transition-colors">
          <LuPlus className="w-4 h-4" strokeWidth={2} />
          {t('admin.resources.add', 'Adicionar recurso')}
        </button>
      </div>

      {error && <div className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm">{error}</div>}

      {resources === null ? (
        <div className="py-8 flex justify-center"><span className="loading loading-spinner loading-md" /></div>
      ) : resources.length === 0 ? (
        <p className="text-[#737373] py-6">{t('admin.resources.empty', 'Ainda não existem recursos.')}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#e5e5e5]">
          <table className="w-full text-left">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th className="px-4 py-3 font-semibold text-[15px] text-[#0a0a0a]">{t('admin.resources.col_name', 'Nome')}</th>
                <th className="px-4 py-3 font-semibold text-[15px] text-[#0a0a0a]">{t('admin.indicators.col_source', 'Fonte')}</th>
                <th className="px-4 py-3 font-semibold text-[15px] text-[#0a0a0a]">{t('admin.resources.col_status', 'Estado')}</th>
                <th className="px-4 py-3 font-semibold text-[15px] text-[#0a0a0a] text-right">{t('admin.indicators.col_options', 'Opções')}</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="border-t border-[#e5e5e5]">
                  <td className="px-4 py-3 text-[15px] text-[#0a0a0a]">{toText(r.name)}</td>
                  <td className="px-4 py-3"><SourcePill source={r._source} /></td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-medium ${statusBadge(r._status)}`}>{toText(r._status)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button type="button" onClick={() => setDetails(r)} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" aria-label={t('admin.resources.details', 'Detalhes')} title={t('admin.resources.details', 'Detalhes')}>
                        <LuEye className="w-5 h-5" strokeWidth={1.75} />
                      </button>
                      {r.wrapper_id && (
                        <>
                          <button type="button" onClick={() => setRunModal({ wrapperId: r.wrapper_id, mode: 'logs' })} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" aria-label={t('admin.resources.view_logs', 'Ver logs')} title={t('admin.resources.view_logs', 'Ver logs')}>
                            <LuScrollText className="w-5 h-5" strokeWidth={1.75} />
                          </button>
                          <button type="button" onClick={() => openRegenerate(r)} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" aria-label={t('wizard.resource.regenerate_wrapper', 'Regenerar')} title={t('wizard.resource.regenerate_wrapper', 'Regenerar')}>
                            <LuRefreshCw className="w-5 h-5" strokeWidth={1.75} />
                          </button>
                        </>
                      )}
                      <button type="button" onClick={() => setWizard({ open: true, resourceId: r.id })} className="text-[#0a0a0a] hover:text-[#009368] cursor-pointer" aria-label={t('common.edit', 'Editar')} title={t('common.edit', 'Editar')}>
                        <LuSquarePen className="w-5 h-5" strokeWidth={1.75} />
                      </button>
                      <button type="button" onClick={() => handleDelete(r)} className="text-[#dc2626] hover:opacity-75 cursor-pointer" aria-label={t('common.delete', 'Eliminar')} title={t('common.delete', 'Eliminar')}>
                        <LuTrash2 className="w-5 h-5" strokeWidth={1.75} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resource wizard (add / edit) */}
      {wizard.open && (
        <ResourceWizard
          isOpen={wizard.open}
          indicatorId={indicatorId}
          resourceId={wizard.resourceId}
          onClose={() => setWizard({ open: false, resourceId: null })}
          onSuccess={() => { setWizard({ open: false, resourceId: null }); load(); }}
        />
      )}

      {/* Resource details modal */}
      {details && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) setDetails(null); }}>
          <div className="bg-[#fffefc] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold text-[20px] text-[#0a0a0a]">{toText(details.name, t('admin.resources.details', 'Detalhes'))}</h3>
              <button type="button" onClick={() => setDetails(null)} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer text-2xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[14px]">
              <div><span className="text-[#737373]">{t('admin.resources.col_type', 'Tipo')}:</span> {toText(details.type)}</div>
              <div><span className="text-[#737373]">{t('admin.indicators.col_source', 'Fonte')}:</span> {toText(details._source)}</div>
              <div><span className="text-[#737373]">{t('admin.resources.col_period', 'Período')}:</span> {toText(details.start_period || details.startPeriod)}{(details.end_period || details.endPeriod) ? ` – ${toText(details.end_period || details.endPeriod, '')}` : ''}</div>
              <div><span className="text-[#737373]">{t('admin.resources.col_status', 'Estado')}:</span> {toText(details._status)}</div>
            </div>
            {details._wrapper && (
              <div className="rounded-xl bg-[#f9fafb] border border-[#e5e5e5] p-4 flex flex-col gap-2 text-[14px]">
                <h4 className="font-semibold text-[15px] text-[#0a0a0a]">{t('admin.resources.wrapper_info', 'Wrapper')}</h4>
                <div><span className="text-[#737373]">source_type:</span> {toText(details._wrapper.source_type)}</div>
                {details._wrapper.source_config?.location && (
                  <div className="break-all"><span className="text-[#737373]">URL:</span> {toText(details._wrapper.source_config.location)}</div>
                )}
                {details._wrapper.error_message && (
                  <div className="text-[#dc2626]"><span className="text-[#737373]">{t('admin.resources.error', 'Erro')}:</span> {toText(details._wrapper.error_message)}</div>
                )}
              </div>
            )}
            {details.wrapper_id && (
              <div className="flex justify-end">
                <button type="button" onClick={() => { const wid = details.wrapper_id; setDetails(null); setRunModal({ wrapperId: wid, mode: 'logs' }); }}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[15px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] cursor-pointer">
                  <LuScrollText className="w-4 h-4" strokeWidth={1.75} />
                  {t('admin.resources.view_logs', 'Ver logs')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wrapper run / logs modal */}
      {runModal && (
        <WrapperRunModal
          wrapperId={runModal.wrapperId}
          mode={runModal.mode}
          onClose={() => setRunModal(null)}
          onDone={() => load()}
        />
      )}
    </div>
  );
}

// Modal that streams a wrapper's logs. In 'regenerate' mode it first re-queues
// the wrapper, shows a running animation, polls the status, and streams the
// produced logs until the run completes or errors. In 'logs' mode it just
// shows the current logs.
function WrapperRunModal({ wrapperId, mode, onClose, onDone }) {
  const { t } = useTranslation();
  const { regenerateWrapper, startPolling, stopPolling } = useWrapper();
  const [status, setStatus] = useState(mode === 'regenerate' ? 'executing' : null);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(mode === 'regenerate');
  const [error, setError] = useState(null);
  const logsBoxRef = useRef(null);
  const logTimerRef = useRef(null);
  const doneRef = useRef(false);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await resourceService.getWrapperLogs(wrapperId, 300);
      setLogs(Array.isArray(res?.logs) ? res.logs : []);
    } catch { /* keep previous logs */ }
  }, [wrapperId]);

  useEffect(() => {
    let active = true;
    const stopLogTimer = () => { if (logTimerRef.current) { clearInterval(logTimerRef.current); logTimerRef.current = null; } };

    (async () => {
      try {
        if (mode === 'regenerate') {
          const w = await regenerateWrapper(wrapperId);
          if (active && w?.status) setStatus(w.status);
        } else {
          try { const w = await resourceService.getWrapper(wrapperId); if (active) setStatus(w?.status || null); } catch { /* ignore */ }
        }
      } catch (err) {
        if (active) { setError(err?.userMessage || err?.message || t('wizard.resource.generation_failed', 'Falha ao gerar.')); setRunning(false); }
      }

      await fetchLogs();

      // Poll status; stream logs while it runs.
      startPolling(wrapperId, 2000, (w) => {
        if (!active) return;
        setStatus(w.status);
        if (w.status === 'completed' || w.status === 'error') {
          setRunning(false);
          stopLogTimer();
          fetchLogs();
          if (!doneRef.current) { doneRef.current = true; onDone?.(); }
        }
      });

      if (mode === 'regenerate') {
        logTimerRef.current = setInterval(fetchLogs, 2500);
      }
    })();

    return () => {
      active = false;
      stopPolling(wrapperId);
      stopLogTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrapperId, mode]);

  useEffect(() => {
    if (logsBoxRef.current) logsBoxRef.current.scrollTop = logsBoxRef.current.scrollHeight;
  }, [logs]);

  const statusColor = status === 'completed' ? 'text-[#16a34a]' : status === 'error' ? 'text-[#dc2626]' : 'text-[#a16207]';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-[#fffefc] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e5e5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-[20px] text-[#0a0a0a]">
              {mode === 'regenerate' ? t('admin.resources.regenerating', 'A regenerar wrapper') : t('admin.resources.wrapper_logs', 'Logs do wrapper')}
            </h3>
            {running && <LuRefreshCw className="w-5 h-5 text-[#009368] animate-spin" strokeWidth={2} aria-hidden />}
          </div>
          <button type="button" onClick={onClose} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer text-2xl leading-none">×</button>
        </div>

        {/* Status */}
        <div className="px-6 pt-4 flex items-center gap-2 text-[14px]">
          <span className="text-[#737373]">{t('admin.resources.col_status', 'Estado')}:</span>
          <span className={`font-medium ${statusColor}`}>{status || '—'}</span>
          {error && <span className="text-[#dc2626] ml-2">{error}</span>}
        </div>

        {/* Logs */}
        <div ref={logsBoxRef} className="m-6 flex-1 overflow-y-auto rounded-xl bg-[#0d0d0d] text-[#e5e5e5] font-mono text-[12.5px] leading-relaxed p-4 whitespace-pre-wrap min-h-[240px]">
          {logs.length === 0 ? (
            <span className="text-[#737373]">{running ? t('admin.resources.waiting_logs', 'A aguardar logs…') : t('admin.resources.no_logs', 'Sem logs.')}</span>
          ) : (
            logs.map((line, i) => <div key={i}>{typeof line === 'string' ? line : JSON.stringify(line)}</div>)
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e5e5] flex justify-end">
          <button type="button" onClick={onClose}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[15px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] cursor-pointer">
            {t('common.close', 'Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}

WrapperRunModal.propTypes = {
  wrapperId: PropTypes.string.isRequired,
  mode: PropTypes.oneOf(['regenerate', 'logs']).isRequired,
  onClose: PropTypes.func.isRequired,
  onDone: PropTypes.func,
};

IndicatorResourcesTab.propTypes = {
  indicatorId: PropTypes.string.isRequired,
};
