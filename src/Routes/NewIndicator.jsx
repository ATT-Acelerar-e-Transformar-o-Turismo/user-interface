import React from 'react';
import CategoryDropdown from '../components/CategoryDropdown';
import AddDataDropdown from '../components/AddDataDropdown';
import SelectDomain from '../components/SelectDomain';
import PageTemplate from './PageTemplate';

export default function NewIndicator() {
    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full ">
                    <h1 className="text-xl font-bold text-center mb-6">New Indicator</h1>

                    <form className="space-y-5">
                        <div>
                            <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                            <input type="text" id="base-input" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div className='border border-bg-50 w-fit dark:border-gray-600 rounded-lg'>
                            <SelectDomain />
                        </div>

                        <div className='border border-bg-50 w-fit dark:border-gray-600 rounded-lg'>
                            <CategoryDropdown />
                        </div>

                        <div>
                            <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Description</label>
                            <textarea
                                id="large-input"
                                rows="4"
                                className="block w-full p-4 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 resize-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Font</label>
                            <input type="text" id="small-input" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                        <div>
                            <label htmlFor="small-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Scale</label>
                            <input type="text" id="small-input" className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-xs focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" />
                        </div>

                    </form>
                    <div className='flex justify-end w-full mt-4'>                    
                        <AddDataDropdown />
                    </div>

                </div>

            </div>
        </PageTemplate>
    );
}
