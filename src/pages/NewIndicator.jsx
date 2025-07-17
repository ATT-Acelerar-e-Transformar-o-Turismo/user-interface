import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import indicatorService from '../services/indicatorService';
import domainService from '../services/domainService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

export default function NewIndicator() {
  const { indicatorId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [domains, setDomains] = useState([]);
  
  const [isCarryingCapacityChecked, setIsCarryingCapacityChecked] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    font: '',
    scale: '',
    unit: '',
    periodicity: '',
    domain: null,
    subdomain: '',
    governance: false,
    carrying_capacity: false,
  });

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [indicatorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load domains for selection
      const domainsData = await domainService.getAll();
      setDomains(domainsData || []);
      
      // If editing, load the indicator data
      if (indicatorId) {
        const indicator = await indicatorService.getById(indicatorId);
        if (indicator) {
          setFormData({
            name: indicator.name || '',
            description: indicator.description || '',
            font: indicator.font || '',
            scale: indicator.scale || '',
            unit: indicator.unit || '',
            periodicity: indicator.periodicity || '',
            domain: indicator.domain || null,
            subdomain: indicator.subdomain || '',
            governance: indicator.governance || false,
            carrying_capacity: indicator.carrying_capacity || false,
          });
          
          if (indicator.carrying_capacity) {
            setIsCarryingCapacityChecked(true);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedDomain = (domain) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      domain: domain,
      subdomain: ''
    }));
  };

  const setSelectedSubdomain = (subdomain) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      subdomain: subdomain
    }));
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleGovernanceChange = (e) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      governance: e.target.checked
    }));
  };

  const handleCarryingCapacityChange = (e) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      carrying_capacity: e.target.checked ? formData.carrying_capacity || '' : false
    }));
    setIsCarryingCapacityChecked(e.target.checked);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error('Name is required');
    }
    if (!formData.domain) {
      throw new Error('Domain is required');
    }
    if (!formData.subdomain.trim()) {
      throw new Error('Subdomain is required');
    }
    return true;
  };

  const saveIndicator = async () => {
    try {
      setSaving(true);
      setError(null);
      
      validateForm();

      const indicatorData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        font: formData.font.trim(),
        scale: formData.scale.trim(),
        unit: formData.unit.trim(),
        periodicity: formData.periodicity.trim(),
        governance: formData.governance,
        carrying_capacity: isCarryingCapacityChecked ? formData.carrying_capacity : false,
        favourites: formData.favourites || 0,
      };

      let result;
      if (indicatorId) {
        // Update existing indicator
        result = await indicatorService.update(indicatorId, indicatorData);
      } else {
        // Create new indicator
        const domainId = formData.domain.id || formData.domain._id;
        result = await indicatorService.create(domainId, formData.subdomain, indicatorData);
      }
      
      return result;
    } catch (err) {
      setError(err.message || 'Failed to save indicator');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      await saveIndicator();
      navigate('/indicators-management');
    } catch (err) {
      // Error is already set in saveIndicator
      console.error('Error saving indicator:', err);
    }
  };

  const handleAddData = async () => {
    try {
      const result = await saveIndicator();
      const id = result.id || result._id;
      navigate(`/add_data_resource/${id}`);
    } catch (err) {
      // Error is already set in saveIndicator
      console.error('Error saving indicator:', err);
    }
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !domains.length) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  return (
    <PageTemplate>
      <div className="flex justify-center">
        <div className="p-8 rounded-lg shadow-lg w-full ">
          <h1 className="text-xl font-bold text-center mb-6">
            {indicatorId ? 'Edit Indicator' : 'New Indicator'}
          </h1>
          
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name *</label>
              <input 
                type="text" 
                id="name" 
                onChange={handleChange} 
                value={formData.name} 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required
              />
            </div>

            <div className='border border-bg-50 w-fit dark:border-gray-600 rounded-lg'>
              <SelectDomain
                setSelectedDomain={setSelectedDomain}
                setSelectedSubdomain={setSelectedSubdomain}
                domains={domains}
                selectedDomain={formData.domain}
                selectedSubdomain={formData.subdomain}
              />
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-sm font-medium text-neutral">Description</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                className="block w-full p-4 text-neutral border border-base-300 rounded-lg bg-base-100 text-base focus:ring-primary focus:border-primary resize-none"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Unit</label>
              <input 
                type="text" 
                value={formData.unit} 
                onChange={handleChange} 
                id="unit" 
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              />
            </div>

            <div>
              <label htmlFor="font" className="block mb-2 text-sm font-medium text-neutral">Source</label>
              <input 
                type="text" 
                id="font" 
                value={formData.font} 
                onChange={handleChange} 
                className="block w-full p-2 text-neutral border border-base-300 rounded-lg bg-base-100 text-xs focus:ring-primary focus:border-primary" 
              />
            </div>

            <div>
              <label htmlFor="scale" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scale</label>
              <input 
                type="text" 
                value={formData.scale} 
                onChange={handleChange} 
                id="scale" 
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="checkbox"
                id='governance'
                checked={formData.governance}
                onChange={handleGovernanceChange}
              />
              <label htmlFor="governance" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Governance Indicator</label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                className="checkbox"
                checked={isCarryingCapacityChecked}
                onChange={handleCarryingCapacityChange}
              />
              <label htmlFor="carrying-capacity" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Carrying Capacity</label>
            </div>

            {isCarryingCapacityChecked && (
              <div>
                <label htmlFor="carrying_capacity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Carrying Capacity Limit Value</label>
                <input
                  type="text"
                  onChange={handleChange}
                  id="carrying_capacity"
                  value={formData.carrying_capacity || ''}
                  className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                />
              </div>
            )}

            <div>
              <label htmlFor="periodicity" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Periodicity</label>
              <input 
                type="text" 
                value={formData.periodicity} 
                onChange={handleChange} 
                id="periodicity" 
                className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              />
            </div>
          </form>
        </div>
      </div>
      <div className='flex justify-end w-full mt-4'>
        <button 
          onClick={handleSave} 
          className="btn btn-primary m-1"
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            indicatorId ? 'Update' : 'Save'
          )}
        </button>
        <button 
          onClick={handleAddData} 
          className='btn m-1'
          disabled={saving}
        >
          {saving ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            'Add Data'
          )}
        </button>
      </div>
    </PageTemplate>
  );
}
