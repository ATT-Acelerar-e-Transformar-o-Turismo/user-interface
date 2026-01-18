import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import Wizard from './Wizard';
import WizardStep from './WizardStep';
import SuccessModal from './SuccessModal';
import FormInput from '../forms/FormInput';
import useWizard from '../../hooks/useWizard';
import { validateRequired, hasErrors } from '../../utils/formValidation';
import domainService from '../../services/domainService';
import { useDomain } from '../../contexts/DomainContext';

/**
 * DomainWizard - Single-step wizard for creating/editing domains
 * Fields: name, color, subdomains, image URL
 */
export default function DomainWizard({ isOpen, onClose, domainId = null, onSuccess = null }) {
  const navigate = useNavigate();
  const { refreshDomains } = useDomain();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subdomainInput, setSubdomainInput] = useState('');

  const steps = ['Informações do Domínio'];

  const initialData = {
    name: '',
    color: '#00855d',
    subdomains: [],
    image: '',
    icon: ''
  };

  const wizard = useWizard(steps.length, initialData, handleSubmit);

  // Load domain data if editing
  useEffect(() => {
    if (isOpen && domainId) {
      loadDomain();
    }
  }, [isOpen, domainId]);

  const loadDomain = async () => {
    try {
      setLoading(true);
      const domain = await domainService.getById(domainId);
      if (domain) {
        wizard.updateMultipleFields({
          name: domain.name || '',
          color: domain.color || '#00855d',
          subdomains: Array.isArray(domain.subdomains) ? domain.subdomains : [],
          image: domain.image || '',
          icon: domain.icon || ''
        });
      }
    } catch (error) {
      console.error('Error loading domain:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubdomain = () => {
    if (subdomainInput.trim()) {
      const updatedSubdomains = [...wizard.formData.subdomains, subdomainInput.trim()];
      wizard.updateFormData('subdomains', updatedSubdomains);
      setSubdomainInput('');
    }
  };

  const handleRemoveSubdomain = (index) => {
    const updatedSubdomains = wizard.formData.subdomains.filter((_, i) => i !== index);
    wizard.updateFormData('subdomains', updatedSubdomains);
  };

  const handleSubdomainKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubdomain();
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      const nameError = validateRequired(wizard.formData.name, 'Nome do domínio');
      if (nameError) errors.name = nameError;
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(wizard.currentStep);
    if (hasErrors(errors)) {
      wizard.setValidationErrors(errors);
      return;
    }

    wizard.nextStep();
  };

  async function handleSubmit(data) {
    try {
      const domainData = {
        name: data.name.trim(),
        color: data.color || '#00855d',
        subdomains: data.subdomains || [],
        image: data.image || '',
        icon: data.icon || ''
      };

      if (domainId) {
        await domainService.update(domainId, domainData);
      } else {
        await domainService.create(domainData);
      }

      // Refresh domains in context
      await refreshDomains();

      setShowSuccessModal(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error saving domain:', error);
      throw error;
    }
  }

  const handleFinish = () => {
    setShowSuccessModal(false);
    onClose();
    wizard.reset();
  };

  const handleWizardClose = () => {
    if (!wizard.isSubmitting) {
      wizard.reset();
      setSubdomainInput('');
      onClose();
    }
  };

  return (
    <>
      <Wizard
        isOpen={isOpen && !showSuccessModal}
        onClose={handleWizardClose}
        title={domainId ? 'Editar Domínio' : 'Novo Domínio'}
        steps={steps}
        currentStep={wizard.currentStep}
        onPrevious={wizard.previousStep}
        onNext={handleNext}
        onSubmit={wizard.handleSubmit}
        isSubmitting={wizard.isSubmitting}
        disableNext={loading}
        showProgress={false}
      >
        {/* Single Step: Domain Information */}
        {wizard.currentStep === 0 && (
          <WizardStep
            title="Informações do Domínio"
            description="Configure o nome, cor e subdomínios"
          >
            <FormInput
              label="Nome do Domínio"
              name="name"
              value={wizard.formData.name}
              onChange={(value) => wizard.updateFormData('name', value)}
              placeholder="Ex: Ambiente, Sociedade, Economia"
              required
              error={wizard.errors.name}
            />

            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                Cor do Domínio
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={wizard.formData.color}
                  onChange={(e) => wizard.updateFormData('color', e.target.value)}
                  className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                />
                <span className="font-['Onest',sans-serif] text-sm text-gray-600">
                  {wizard.formData.color}
                </span>
              </div>
            </div>

            <FormInput
              label="URL da Imagem"
              name="image"
              value={wizard.formData.image}
              onChange={(value) => wizard.updateFormData('image', value)}
              placeholder="https://exemplo.com/imagem.png"
              type="url"
            />

            <FormInput
              label="URL do Ícone"
              name="icon"
              value={wizard.formData.icon}
              onChange={(value) => wizard.updateFormData('icon', value)}
              placeholder="https://exemplo.com/icone.png"
              type="url"
            />

            {/* Subdomains Management */}
            <div className="flex flex-col gap-2">
              <label className="font-['Onest',sans-serif] font-medium text-sm text-black">
                Subdomínios (Dimensões)
              </label>

              {/* Subdomain Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subdomainInput}
                  onChange={(e) => setSubdomainInput(e.target.value)}
                  onKeyPress={handleSubdomainKeyPress}
                  placeholder="Digite um subdomínio e pressione Enter"
                  className="font-['Onest',sans-serif] text-sm text-black bg-[#f1f0f0] rounded-lg px-4 py-3 border-2 border-transparent focus:border-[#00855d] focus:outline-none focus:ring-2 focus:ring-[#00855d]/20 flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddSubdomain}
                  className="font-['Onest',sans-serif] text-sm font-medium text-white bg-[#00855d] hover:bg-[#007550] px-4 py-3 rounded-lg transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Subdomain List */}
              {wizard.formData.subdomains.length > 0 && (
                <div className="bg-[#f1f0f0] rounded-lg p-4 space-y-2">
                  {wizard.formData.subdomains.map((subdomain, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white rounded-lg px-3 py-2"
                    >
                      <span className="font-['Onest',sans-serif] text-sm text-black">
                        {subdomain}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubdomain(index)}
                        className="text-red-600 hover:text-red-700 transition-colors"
                        title="Remover"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </WizardStep>
        )}
      </Wizard>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleFinish}
        title={domainId ? 'Domínio Atualizado!' : 'Domínio Adicionado!'}
        message="O domínio foi guardado com sucesso"
        primaryAction={{
          label: 'Continuar',
          onClick: handleFinish
        }}
      />
    </>
  );
}

DomainWizard.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  domainId: PropTypes.string,
  onSuccess: PropTypes.func
};
