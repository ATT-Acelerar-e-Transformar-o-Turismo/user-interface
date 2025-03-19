import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageTemplate from './PageTemplate';

export default function EditDomain() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [subdomains, setSubdomains] = useState([]);
    const [subdomainInput, setSubdomainInput] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState('');
    const [image, setImage] = useState(null);

    useEffect(() => {
        const domains = JSON.parse(localStorage.getItem('domains')) || [];
        const domainToEdit = domains.find(d => d.id === id);
        console.log(id)
        if (domainToEdit) {
            setName(domainToEdit.name);
            setColor(domainToEdit.color);
            setSubdomains(domainToEdit.subdomains);
            setImage(domainToEdit.image);
        }
    }, [id]);

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
        const updatedDomain = { id, name, color, subdomains, image };
        const domains = JSON.parse(localStorage.getItem('domains')) || [];
        const updatedDomains = domains.map(d => (d.id === id ? updatedDomain : d));
        localStorage.setItem('domains', JSON.stringify(updatedDomains));
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
                    <h1 className="text-xl font-bold text-center mb-6">Edit Domain</h1>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name-input" className="block mb-2 text-sm font-medium text-neutral">Name</label>
                            <input
                                type="text"
                                id="name-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                            />
                        </div>

                        <div>
                            <label htmlFor="color-input" className="block mb-2 text-sm font-medium text-neutral">Color</label>
                            <input
                                type="color"
                                id="color-input"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="p-2 text-neutral border border-base-300 rounded-lg bg-base-100 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <div>
                            <label htmlFor="subdomains-input" className="block mb-2 text-sm font-medium text-neutral">Subdomains</label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    id="subdomains-input"
                                    value={subdomainInput}
                                    onChange={(e) => setSubdomainInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                />
                                <button type="button" onClick={handleAddSubdomain} className="btn btn-primary">Add</button>
                            </div>
                            <ul className="mt-2">
                                {subdomains.map((subdomain, index) => (
                                    <li key={index} className="flex justify-between items-center bg-base-200 p-2 rounded-lg mt-1">
                                        {subdomain}
                                        <button type="button" onClick={() => handleRemoveSubdomain(index)} className="text-error">Remove</button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <label htmlFor="image-input" className="block mb-2 text-sm font-medium text-neutral">Image</label>
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
                            <button type="submit" className="btn btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        </PageTemplate>
    );
}
