import React, { useState } from 'react';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';
import { useNavigate } from 'react-router-dom';

export default function NewIndicator() {

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        font: '',
        scale: '',
        unit: '',
        periodicity: '',
        category: '',
        domain: '',
        subdomain: '',
    });

    const [selectedDomain, setSelectedDomain] = useState(null);
    const [selectedSubdomain, setSelectedSubdomain] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);

    const navigate = useNavigate();
    
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleDataTypeSelect = (dataType) => {

        const dataToSend = {
            ...formData,
            selectedDataType: dataType,
            selectedDomain: selectedDomain ? selectedDomain.nome : null,
            selectedSubdomain: selectedSubdomain ? selectedSubdomain.nome : null,
            selectedCategory: selectedCategory ? selectedCategory.nome : null,
        };

        console.log(formData);
        navigate('/add_data_resource', { state: { dataToSend } });

    };

    const [isCarryingCapacityChecked, setIsCarryingCapacityChecked] = useState(false);

    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full flex flex-col justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-center mb-6">New Indicator</h1>

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
                            <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                            <textarea
                                id="description"
                                rows="4"
                                value={formData.description}
                                onChange={handleChange}
                                className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"
                            />
                        </div>

                        
                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Unit</label>
                            <input type="text" value={formData.unit} onChange={handleChange} id="unit" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Font</label>
                            <input type="text" value={formData.font} onChange={handleChange} id="font" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scale</label>
                            <input type="text" value={formData.scale} onChange={handleChange} id="scale" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                            <div className="flex items-center">
                                <input type="checkbox" className="checkbox" />
                                <label htmlFor="governance-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Governance Indicator</label>
                            </div>

                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    className="checkbox" 
                                    onChange={(e) => setIsCarryingCapacityChecked(e.target.checked)} 
                                />
                                <label htmlFor="carrying-capacity-checkbox" className="text-sm font-medium text-gray-900 dark:text-white ml-2">Carrying Capacity</label>
                            </div>

                            {isCarryingCapacityChecked && (
                                <div>
                                    <label htmlFor="carrying-capacity-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Carrying Capacity Value</label>
                                    <input 
                                        type="number" 
                                        id="carrying-capacity-input" 
                                        className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                                    />
                                </div>
                            )}

                        </form>
                    </div>
                    <div className='flex justify-end w-full mt-4'>
                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Periodicity</label>
                            <input type="text" value={formData.periodicity} onChange={handleChange} id="periodicity" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>
                    
                    <div className='flex justify-end w-full mt-4'>                    
                        <AddDataDropdown onDataTypeSelect={handleDataTypeSelect}/>
                    </div>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
