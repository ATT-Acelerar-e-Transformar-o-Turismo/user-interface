import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import { useNavigate } from 'react-router-dom';

export default function NewIndicator() {

    const [isCarryingCapacityChecked, setIsCarryingCapacityChecked] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        font: '',
        scale: '',
        unit: '',
        periodicity: '',
        domain: '',
        subdomain: '',
        governance: false,
        carrying_capacity: '',
    });

    const [selectedDomain, setSelectedDomain] = useState(null);
    const [selectedSubdomain, setSelectedSubdomain] = useState(null);

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
        const { id, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [id]: value
        }));
    };

    const handleGovernanceChange = (e) => {
        setFormData({ ...formData, governance: e.target.checked });
    };

    const handleCarryingCapacityChange = (e) => {
        setFormData({ ...formData, carrying_capacity: '' });  // Reset carrying capacity value when unchecked
        setIsCarryingCapacityChecked(e.target.checked);
    };

    const handleDataTypeSelect = (dataType) => {

        const dataToSend = {
            ...formData,
            selectedDataType: dataType,
            selectedDomain: selectedDomain ? selectedDomain.nome : null,
            selectedSubdomain: selectedSubdomain ? selectedSubdomain.nome : null,
        };

        console.log(formData);
        navigate('/add_data_resource', { state: { dataToSend } });

    };

    const { indicatorId } = useParams();

    useEffect(() => {
        if (indicatorId) {
            const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
            const indicator = indicators.find(ind => ind.id === parseInt(indicatorId));
            if (indicator) {
                setFormData(indicator);
            }
        }
    }, [indicatorId]);

    const handleSave = () => {
        const indicators = JSON.parse(localStorage.getItem('indicators')) || [];
        if (indicatorId) {
            const index = indicators.findIndex(ind => ind.id === parseInt(indicatorId));
            if (index !== -1) {
                indicators[index] = formData;
            }
        } else {
            formData.id = indicators.length ? indicators[indicators.length - 1].id + 1 : 1;
            indicators.push(formData);
        }
        localStorage.setItem('indicators', JSON.stringify(indicators));
    };

    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full ">
                    <h1 className="text-xl font-bold text-center mb-6">
                        {indicatorId ? 'Edit Indicator' : 'New Indicator'}
                    </h1>
                    <form className="space-y-5">
                        <div>
                            <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                            <input type="text" id="name" onChange={handleChange} value={formData.name} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div className='border border-bg-50 w-fit dark:border-gray-600 rounded-lg'>
                            <SelectDomain
                                setSelectedDomain={setSelectedDomain}
                                setSelectedSubdomain={setSelectedSubdomain}
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
                            <label htmlFor="font" className="block mb-2 text-sm font-medium text-neutral">Font</label>
                            <input type="text" id="font" value={formData.font} onChange={handleChange} className="block w-full p-2 text-neutral border border-base-300 rounded-lg bg-base-100 text-xs focus:ring-primary focus:border-primary" />
                        </div>

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scale</label>
                            <input type="text" value={formData.scale} onChange={handleChange} id="scale" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="checkbox"
                                id='governance'
                                checked={formData.governance}
                                onChange={handleGovernanceChange}
                            />
                            <label htmlFor="governance-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Governance Indicator</label>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                className="checkbox"
                                checked={isCarryingCapacityChecked}
                                onChange={handleCarryingCapacityChange}
                            />
                            <label htmlFor="carrying-capacity-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Carrying Capacity</label>
                        </div>

                        {isCarryingCapacityChecked && (
                            <div>
                                <label htmlFor="carrying-capacity-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Carrying Capacity Value</label>
                                <input
                                    type="text"
                                    onChange={handleChange}
                                    id="carrying_capacity"
                                    className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                            </div>
                        )}

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Periodicity</label>
                            <input type="text" value={formData.periodicity} onChange={handleChange} id="periodicity" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>
                    </form>
                </div>
            </div>
            <div className='flex justify-end w-full mt-4'>
                <button onClick={handleSave} className="btn btn-primary">
                    {indicatorId ? 'Update' : 'Save'}
                </button>
                <AddDataDropdown onDataTypeSelect={handleDataTypeSelect} />
            </div>
        </PageTemplate >
    );
}
