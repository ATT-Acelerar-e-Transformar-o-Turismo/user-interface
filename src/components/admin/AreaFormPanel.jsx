import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { LuX } from 'react-icons/lu';
import FormInput from '../forms/FormInput';
import FileUpload from '../forms/FileUpload';
import areaService from '../../services/areaService';
import uploadService from '../../services/uploadService';
import useSlideOver from '../../hooks/useSlideOver';
import { useArea } from '../../contexts/AreaContext';

// Right-half create/edit panel for an area (domain) + its dimensions,
// following the same logic as the indicator panels.
const EMPTY = { name: '', name_en: '', color: '#00855d', dimensions: [], image: '', icon: '' };

export default function AreaFormPanel({ areaId = null, onClose, onSaved }) {
  const { t } = useTranslation();
  const { refreshAreas } = useArea();
  const isEdit = !!areaId;

  const [data, setData] = useState(EMPTY);
  const [lang, setLang] = useState('pt');
  const [dimPt, setDimPt] = useState('');
  const [dimEn, setDimEn] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [nameError, setNameError] = useState(null);
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  useEffect(() => {
    let cancelled = false;
    if (!isEdit) { setLoading(false); return; }
    (async () => {
      try {
        const area = await areaService.getById(areaId);
        if (!cancelled && area) {
          setData({
            name: area.name || '', name_en: area.name_en || '',
            color: area.color || '#00855d',
            dimensions: Array.isArray(area.dimensions) ? area.dimensions : (area.subdomains || []),
            image: area.image || '', icon: area.icon || '',
          });
        }
      } catch (err) { if (!cancelled) setError(err.userMessage || err.message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [areaId, isEdit]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = 'unset'; };
  }, [requestClose]);

  const set = (key) => (value) => setData(prev => ({ ...prev, [key]: value }));

  const addDimension = () => {
    if (!dimPt.trim()) return;
    setData(prev => ({ ...prev, dimensions: [...prev.dimensions, { name: dimPt.trim(), name_en: dimEn.trim() }] }));
    setDimPt(''); setDimEn('');
  };
  const removeDimension = (i) => setData(prev => ({ ...prev, dimensions: prev.dimensions.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!data.name.trim()) {
      setNameError(t('validation.required', { field: t('wizard.area.name_pt', 'Nome'), defaultValue: 'Campo obrigatório' }));
      return;
    }
    const payload = {
      name: data.name.trim(), name_en: data.name_en.trim(),
      color: data.color || '#00855d',
      subdomains: data.dimensions || [], dimensions: data.dimensions || [],
      image: data.image || '', icon: data.icon || '',
    };
    try {
      setSaving(true); setError(null);
      const saved = isEdit ? await areaService.update(areaId, payload) : await areaService.create(payload);
      await refreshAreas();
      onSaved?.(saved);
      requestClose();
    } catch (err) {
      setError(err.userMessage || err.message || t('wizard.area.error_generic', 'Ocorreu um erro ao guardar a área'));
    } finally { setSaving(false); }
  };

  const languageTabs = (
    <div className="flex gap-1 p-1 bg-[#f5f5f5] rounded-xl">
      {[{ k: 'pt', l: 'Português' }, { k: 'en', l: 'English' }].map(({ k, l }) => (
        <button key={k} type="button" onClick={() => setLang(k)}
          className={`flex-1 py-2 px-4 rounded-lg font-['Onest'] font-medium text-[14px] transition-colors cursor-pointer ${lang === k ? 'bg-[#fffefc] text-[#0a0a0a] shadow-sm' : 'text-[#404040] hover:text-[#0a0a0a]'}`}>
          {l}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Onest']">
      <div className={backdropClass} onClick={requestClose} aria-hidden />
      <aside className={`relative h-full w-full sm:w-[58%] sm:min-w-[620px] max-w-[880px] bg-[#fffefc] shadow-2xl flex flex-col ${panelClass}`}>
        {/* Header */}
        <div className="bg-[#f3f4f6] border-b border-[#e0e0e0] px-8 pt-10 pb-8 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
              {isEdit ? t('admin.areas.edit_title', 'Editar Área') : t('admin.areas.new_title', 'Nova Área')}
            </h2>
            <button type="button" onClick={requestClose} aria-label={t('common.close', 'Fechar')} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer">
              <LuX className="w-6 h-6" strokeWidth={1.75} />
            </button>
          </div>
          <p className="font-medium text-[18px] leading-6 text-[#0a0a0a]">
            {isEdit
              ? t('admin.areas.edit_subtitle', 'Altere os campos necessários para atualizar a área.')
              : t('admin.areas.new_subtitle', 'Preencha todos os campos obrigatórios para adicionar uma nova área')}
          </p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-8">
          {loading ? (
            <div className="h-full flex items-center justify-center"><span className="loading loading-spinner loading-lg" /></div>
          ) : (
            <div className="flex flex-col gap-8">
              {error && <div className="rounded-xl border border-[#dc2626]/30 bg-[#dc2626]/5 px-4 py-3 text-[#dc2626] text-sm">{error}</div>}

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-[24px] text-[#0a0a0a]">{t('admin.indicators.section_general', 'Informações gerais')}</h3>
                  <div className="h-px w-full bg-[#e5e5e5]" />
                </div>

                {languageTabs}

                {lang === 'pt' ? (
                  <FormInput label={t('wizard.area.name_pt', 'Nome da área')} name="area_name" value={data.name} onChange={(v) => { set('name')(v); setNameError(null); }} placeholder={t('wizard.area.name_pt_placeholder', 'Escreva o nome da área')} required error={nameError} />
                ) : (
                  <FormInput label={t('wizard.area.name_en', 'Area name')} name="area_name_en" value={data.name_en} onChange={set('name_en')} placeholder={t('wizard.area.name_en_placeholder', 'Write the area name')} />
                )}

                <div className="flex flex-col gap-2">
                  <label className="font-medium text-[18px] text-[#0a0a0a]">{t('wizard.area.color', 'Cor')}</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.color} onChange={(e) => set('color')(e.target.value)} className="w-16 h-10 rounded-lg border border-[#e5e5e5] cursor-pointer" />
                    <span className="text-[15px] text-[#737373]">{data.color}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FileUpload label={t('wizard.area.image', 'Imagem')} name="image" value={data.image} onChange={set('image')} onUpload={uploadService.uploadAreaImage} accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" showPreview={true} />
                  <FileUpload label={t('wizard.area.icon', 'Ícone')} name="icon" value={data.icon} onChange={set('icon')} onUpload={uploadService.uploadAreaIcon} accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml" showPreview={true} />
                </div>
              </div>

              {/* Dimensions */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="font-medium text-[24px] text-[#0a0a0a]">{t('wizard.area.dimensions', 'Dimensões')}</h3>
                  <div className="h-px w-full bg-[#e5e5e5]" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="text" value={dimPt} onChange={(e) => setDimPt(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDimension(); } }}
                    placeholder={t('wizard.area.dimension_pt_placeholder', 'Dimensão (PT)')}
                    className="flex-1 bg-[#fffefc] border border-[#e5e5e5] rounded-full px-5 py-3 text-[16px] text-[#0a0a0a] placeholder-[#737373] focus:outline-none focus:border-[#009368]" />
                  <input type="text" value={dimEn} onChange={(e) => setDimEn(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDimension(); } }}
                    placeholder={t('wizard.area.dimension_en_placeholder', 'Dimension (EN)')}
                    className="flex-1 bg-[#fffefc] border border-[#e5e5e5] rounded-full px-5 py-3 text-[16px] text-[#0a0a0a] placeholder-[#737373] focus:outline-none focus:border-[#009368]" />
                  <button type="button" onClick={addDimension}
                    className="inline-flex items-center justify-center h-[50px] px-5 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[16px] text-[#fffefc] cursor-pointer transition-colors">
                    {t('wizard.area.add_dimension', 'Adicionar')}
                  </button>
                </div>

                {data.dimensions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {data.dimensions.map((d, i) => {
                      const namePt = typeof d === 'string' ? d : d.name;
                      const nameEn = typeof d === 'string' ? '' : (d.name_en || '');
                      return (
                        <div key={i} className="flex items-center justify-between bg-[#f9fafb] border border-[#e5e5e5] rounded-xl px-4 py-2.5">
                          <div className="flex flex-col">
                            <span className="text-[15px] text-[#0a0a0a]">{namePt}</span>
                            {nameEn && <span className="text-[13px] text-[#737373]">{nameEn}</span>}
                          </div>
                          <button type="button" onClick={() => removeDimension(i)} className="text-[#dc2626] hover:opacity-75 cursor-pointer" aria-label={t('wizard.area.remove_dimension', 'Remover')}>
                            <LuX className="w-5 h-5" strokeWidth={1.75} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#fafafa] border-t border-[#e0e0e0] px-8 py-6 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={requestClose} disabled={saving}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] disabled:opacity-50 transition-colors cursor-pointer">
            {t('common.cancel', 'Cancelar')}
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[17px] text-[#fafafa] transition-colors disabled:opacity-50 cursor-pointer">
            {saving ? t('common.processing', 'A processar...') : (isEdit ? t('admin.areas.save_changes', 'Guardar alterações') : t('admin.areas.add', 'Adicionar área'))}
          </button>
        </div>
      </aside>
    </div>
  );
}

AreaFormPanel.propTypes = {
  areaId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func,
};
