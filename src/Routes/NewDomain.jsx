import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTemplate from './PageTemplate';

export default function NewDomain() {
    const [subdomains, setSubdomains] = useState([]);
    const [subdomainInput, setSubdomainInput] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState('');
    const [image, setImage] = useState(null);
    const navigate = useNavigate();

    const handleAddSubdomain = () => {
        if (subdomainInput) {
            setSubdomains([...subdomains, subdomainInput]);
            setSubdomainInput('');
        }
    };

    const handleRemoveSubdomain = (index) => {
        setSubdomains(subdomains.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newDomain = { name, color, subdomains, image };
        const domains = JSON.parse(localStorage.getItem('domains')) || [];
        domains.push(newDomain);
        localStorage.setItem('domains', JSON.stringify(domains));
        navigate('/indicators-management');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubdomain();
        }
    };

    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full ">
                    <h1 className="text-xl font-bold text-center mb-6">New Domain</h1>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Name</label>
                            <input
                                type="text"
                                id="name-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="color-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Color</label>
                            <input
                                type="color"
                                id="color-input"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="subdomains-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Subdomains</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    id="subdomains-input"
                                    value={subdomainInput}
                                    onChange={(e) => setSubdomainInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                />
                                <button type="button" onClick={handleAddSubdomain} className="btn btn-primary">Add</button>
                            </div>
                            <ul className="mt-2">
                                {subdomains.map((subdomain, index) => (
                                    <li key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mt-1">
                                        {subdomain}
                                        <button type="button" onClick={() => handleRemoveSubdomain(index)} className="text-red-500">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <label htmlFor="image-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Image</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    id="image-input"
                                    onChange={(e) => setImage(e.target.files[0])}
                                    className="file-input file-input-ghost"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <button type="submit" className="btn btn-primary">Confirm</button>
                        </div>
                    </form>
                </div>
            </div>
        </PageTemplate>
    );
}
