import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import { validateRequired, hasErrors } from '../../utils/formValidation';
import domainService from '../../services/domainService';
import indicatorService from '../../services/indicatorService';

// Fetch all indicators for a domain by paginating (backend max limit is 50)
async function fetchAllDomainIndicators(domainId) {
  const all = [];
  let skip = 0;
  const limit = 50;
  while (true) {
    const batch = await indicatorService.getByDomain(domainId, skip, limit);
    all.push(...batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

/**
 * AddDimensionModal - Modal for adding or editing a dimension (subdomain) on a domain
 */
export default function AddDimensionModal({ isOpen, onClose, onSuccess, editDomainId = null, editDimensionName = null }) {
  const isEditing = Boolean(editDomainId && editDimensionName);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [dimensionName, setDimensionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadDomains();
      if (isEditing) {
        setSelectedDomain(editDomainId);
        setDimensionName(editDimensionName);
      }
      if (isEditing) {
        setSelectedDomain(editDomainId);
        setDimensionName(editDimensionName);
      }
    }
  }, [isOpen, editDomainId, editDimensionName]);

  const loadDomains = async () => {
    try {
      const domainsData = await domainService.getAll();
      setDomains(domainsData || []);
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const validate = () => {
    const validationErrors = {};

    const domainError = validateRequired(selectedDomain, 'Domínio');
    if (domainError) validationErrors.domain = domainError;

    const nameError = validateRequired(dimensionName, 'Nome da dimensão');
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

      if (isEditing && selectedDomain !== editDomainId) {
        // Moving to a different domain: remove from old, add to new
        const oldDomain = await domainService.getById(editDomainId);
        const oldSubs = (oldDomain.subdomains || []).filter(s => s !== editDimensionName);
        await domainService.patch(editDomainId, { subdomains: oldSubs });

        const newDomain = await domainService.getById(selectedDomain);
        const newSubs = [...(newDomain.subdomains || []), dimensionName.trim()];
        await domainService.patch(selectedDomain, { subdomains: newSubs });

        // Update all affected indicators: change domain and subdomain name
        const allIndicators = await fetchAllDomainIndicators(editDomainId);
        const affected = allIndicators.filter(ind => ind.subdomain === editDimensionName);
        await Promise.all(affected.map(ind =>
          indicatorService.patch(ind.id, { subdomain: dimensionName.trim(), domain: selectedDomain })
        ));
      } else if (isEditing) {
        // Same domain: rename
        const domain = await domainService.getById(selectedDomain);
        const currentSubdomains = domain.subdomains || [];
        const updatedSubdomains = currentSubdomains.map(s => s === editDimensionName ? dimensionName.trim() : s);
        await domainService.patch(selectedDomain, { subdomains: updatedSubdomains });

        // Update all indicators with the old subdomain name
        if (dimensionName.trim() !== editDimensionName) {
          const allIndicators = await fetchAllDomainIndicators(selectedDomain);
          const affected = allIndicators.filter(ind => ind.subdomain === editDimensionName);
          await Promise.all(affected.map(ind =>
            indicatorService.patch(ind.id, { subdomain: dimensionName.trim() })
          ));
        }
      } else {
        // Add new subdomain
        const domain = await domainService.getById(selectedDomain);
        const currentSubdomains = domain.subdomains || [];
        await domainService.patch(selectedDomain, { subdomains: [...currentSubdomains, dimensionName.trim()] });
      }

      // Reset form
      setSelectedDomain('');
      setDimensionName('');

      // Close and notify success
      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding dimension:', error);
      setErrors({ submit: error.message || 'Falha ao processar dimensão' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedDomain('');
      setDimensionName('');
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  const domainOptions = domains.map(d => ({
    value: d.id,
    label: d.name
  }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          handleClose();
        }
      }}
    >
      <div className="bg-white rounded-[23px] shadow-2xl w-full max-w-md mx-4 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-['Onest',sans-serif] font-semibold text-2xl text-black">
            {isEditing ? 'Editar Dimensão' : 'Adicionar Dimensão'}
            {isEditing ? 'Editar Dimensão' : 'Adicionar Dimensão'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="text-gray-500 hover:text-black transition-colors p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormSelect
            label="Domínio"
            name="domain"
            value={selectedDomain}
            onChange={setSelectedDomain}
            options={domainOptions}
            placeholder="Selecione um domínio"
            required
            error={errors.domain}
            disabled={loading}
          />

          <FormInput
            label="Nome da Dimensão"
            name="name"
            value={dimensionName}
            onChange={setDimensionName}
            placeholder="Ex: Biodiversidade, Recursos Hídricos"
            required
            error={errors.name}
            disabled={loading}
          />

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="font-['Onest',sans-serif] text-sm text-red-600">
                {errors.submit}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="font-['Onest',sans-serif] text-sm font-medium text-gray-700 hover:text-black px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  A processar...
                </>
              ) : (
                isEditing ? 'Guardar' : 'Adicionar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddDimensionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  editDomainId: PropTypes.string,
  editDimensionName: PropTypes.string,
  onSuccess: PropTypes.func,
  editDomainId: PropTypes.string,
  editDimensionName: PropTypes.string,
};
