import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import SuccessModal from './SuccessModal';
import useSlideOver from '../../hooks/useSlideOver';
import { validateRequired, hasErrors } from '../../utils/formValidation';
import areaService from '../../services/areaService';
import indicatorService from '../../services/indicatorService';

// Fetch all indicators for a area by paginating (backend max limit is 50)
async function fetchAllAreaIndicators(areaId) {
  const all = [];
  let skip = 0;
  const limit = 50;
  while (true) {
    const batch = await indicatorService.getByArea(areaId, skip, limit);
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

/**
 * AddDimensionModal - Modal for adding or editing a dimension (dimension) on a area
 */
export default function AddDimensionModal({ onClose, onSuccess, editAreaId = null, editDimensionName = null, editDimensionNameEn = null }) {
  const { t } = useTranslation();
  const isEditing = Boolean(editAreaId && editDimensionName);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [dimensionName, setDimensionName] = useState('');
  const [dimensionNameEn, setDimensionNameEn] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  useEffect(() => {
    loadAreas();
    if (isEditing) {
      setSelectedArea(editAreaId);
      setDimensionName(editDimensionName);
      setDimensionNameEn(editDimensionNameEn || '');
    }
  }, [editAreaId, editDimensionName, editDimensionNameEn, isEditing]);

  const loadAreas = async () => {
    try {
      const areasData = await areaService.getAll();
      setAreas(areasData || []);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  const validate = () => {
    const validationErrors = {};

    const areaError = validateRequired(selectedArea, t('validation.required', { field: t('wizard.dimension.area') }));
    if (areaError) validationErrors.area = areaError;

    const nameError = validateRequired(dimensionName, t('validation.required', { field: t('wizard.dimension.name_pt') }));
    if (nameError) validationErrors.name = nameError;

    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }
    try {
      setLoading(true);
      setErrors({});

      const getSubName = (s) => typeof s === 'string' ? s : s.name;
      const newSubObj = { name: dimensionName.trim(), name_en: dimensionNameEn.trim() };

      // Backend field names: Domain.subdomains and Indicator.subdomain /
      // Indicator.domain. The UI-level `dimensions` / `dimension` / `area`
      // rename is display-only; PATCH bodies must use the backend names or
      // pydantic silently drops them (making the save appear successful
      // while nothing actually changes).
      const matchesEditDimension = (ind) =>
        (ind.subdomain || ind.dimension) === editDimensionName;

      if (isEditing && selectedArea !== editAreaId) {
        // Moving to a different area: remove from old, add to new
        const oldArea = await areaService.getById(editAreaId);
        const oldSubs = (oldArea.subdomains || oldArea.dimensions || [])
          .filter(s => getSubName(s) !== editDimensionName);
        await areaService.patch(editAreaId, { subdomains: oldSubs });

        const newArea = await areaService.getById(selectedArea);
        const newSubs = [...(newArea.subdomains || newArea.dimensions || []), newSubObj];
        await areaService.patch(selectedArea, { subdomains: newSubs });

        // Update all affected indicators: change area and dimension name
        const allIndicators = await fetchAllAreaIndicators(editAreaId);
        const affected = allIndicators.filter(matchesEditDimension);
        await Promise.all(affected.map(ind =>
          indicatorService.patch(ind.id, { subdomain: dimensionName.trim(), domain: selectedArea })
        ));
      } else if (isEditing) {
        // Same area: rename
        const area = await areaService.getById(selectedArea);
        const currentDimensions = area.subdomains || area.dimensions || [];
        const updatedDimensions = currentDimensions.map(s => getSubName(s) === editDimensionName ? newSubObj : s);
        await areaService.patch(selectedArea, { subdomains: updatedDimensions });

        // Update all indicators with the old dimension name
        if (dimensionName.trim() !== editDimensionName) {
          const allIndicators = await fetchAllAreaIndicators(selectedArea);
          const affected = allIndicators.filter(matchesEditDimension);
          await Promise.all(affected.map(ind =>
            indicatorService.patch(ind.id, { subdomain: dimensionName.trim() })
          ));
        }
      } else {
        // Add new dimension
        const area = await areaService.getById(selectedArea);
        const currentDimensions = area.subdomains || area.dimensions || [];
        await areaService.patch(selectedArea, { subdomains: [...currentDimensions, newSubObj] });
      }

      // Reset form
      setSelectedArea('');
      setDimensionName('');
      setDimensionNameEn('');

      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error adding dimension:', error);
      setErrors({ submit: error.message || t('wizard.dimension.error') });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setErrors({});
      requestClose();
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
    if (onSuccess) onSuccess();
  };

  if (showSuccessModal) {
    return (
      <SuccessModal
        isOpen={true}
        onClose={handleSuccessClose}
        title={isEditing ? t('wizard.dimension.success_updated') : t('wizard.dimension.success_added')}
        message={t('wizard.dimension.success_message')}
        primaryAction={{
          label: t('common.continue'),
          onClick: handleSuccessClose
        }}
      />
    );
  }

  const areaOptions = areas.map(d => ({
    value: d.id,
    label: d.name
  }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-['Onest']">
      <div className={backdropClass} onClick={() => !loading && handleClose()} aria-hidden />
      <aside className={`relative h-full w-full sm:w-[48%] sm:min-w-[520px] max-w-[720px] bg-[#fffefc] shadow-2xl flex flex-col ${panelClass}`}>
        {/* Header */}
        <div className="bg-[#f3f4f6] border-b border-[#e0e0e0] px-8 pt-10 pb-8 flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
              {isEditing ? t('wizard.dimension.title_edit') : t('wizard.dimension.title_add')}
            </h2>
            <button type="button" onClick={handleClose} disabled={loading} aria-label={t('wizard.dimension.close')}
              className="text-[#404040] hover:text-[#0a0a0a] disabled:opacity-50 cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="font-medium text-[18px] leading-6 text-[#0a0a0a]">
            {isEditing
              ? t('wizard.dimension.subtitle_edit', 'Altere os campos necessários para atualizar a dimensão.')
              : t('wizard.dimension.subtitle_add', 'Preencha os campos obrigatórios para adicionar uma nova dimensão.')}
          </p>
        </div>

        {/* Form body */}
        <form id="dimension-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
          <FormSelect
            label={t('wizard.dimension.area')}
            name="area"
            value={selectedArea}
            onChange={setSelectedArea}
            options={areaOptions}
            placeholder={t('wizard.dimension.area_placeholder')}
            required
            error={errors.area}
            disabled={loading}
          />
          <FormInput
            label={t('wizard.dimension.name_pt')}
            name="name"
            value={dimensionName}
            onChange={setDimensionName}
            placeholder={t('wizard.dimension.name_pt_placeholder')}
            required
            error={errors.name}
            disabled={loading}
          />
          <FormInput
            label={t('wizard.dimension.name_en')}
            name="name_en"
            value={dimensionNameEn}
            onChange={setDimensionNameEn}
            placeholder={t('wizard.dimension.name_en_placeholder')}
            disabled={loading}
          />
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="bg-[#fafafa] border-t border-[#e0e0e0] px-8 py-6 flex items-center justify-between gap-3 shrink-0">
          <button type="button" onClick={handleClose} disabled={loading}
            className="inline-flex items-center justify-center h-11 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[17px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] disabled:opacity-50 transition-colors cursor-pointer">
            {t('wizard.dimension.cancel')}
          </button>
          <button type="submit" form="dimension-form" disabled={loading}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[17px] text-[#fafafa] transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? t('wizard.dimension.processing') : (isEditing ? t('wizard.dimension.save') : t('wizard.dimension.add'))}
          </button>
        </div>
      </aside>
    </div>
  );
}

AddDimensionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  editAreaId: PropTypes.string,
  editDimensionName: PropTypes.string,
  editDimensionNameEn: PropTypes.string,
};
