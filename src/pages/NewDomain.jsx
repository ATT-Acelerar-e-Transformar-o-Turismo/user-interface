import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageTemplate from './PageTemplate';
import { useDomain } from '../contexts/DomainContext';
import domainService from '../services/domainService';

export default function NewDomain() {
    const [subdomains, setSubdomains] = useState([]);
    const [subdomainInput, setSubdomainInput] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState('#000000');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const { refreshDomains } = useDomain();

    useEffect(() => {
        if (id) {
            const loadDomain = async () => {
                try {
                    setLoading(true);
                    const domain = await domainService.getById(id);
            if (domain) {
                        setName(domain.name || '');
                        setColor(domain.color || '#000000');
                        setSubdomains(Array.isArray(domain.subdomains) ? domain.subdomains : []);
                        setImage(domain.image || '');
            }
                } catch (err) {
                    setError('Failed to load domain: ' + (err.userMessage || err.message));
                } finally {
                    setLoading(false);
                }
            };
            loadDomain();
        }
    }, [id]);

    const handleAddSubdomain = () => {
        if (subdomainInput.trim()) {
            setSubdomains([...subdomains, subdomainInput.trim()]);
            setSubdomainInput('');
        }
    };

    const handleRemoveSubdomain = (index) => {
        setSubdomains(subdomains.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!name.trim()) {
            setError('Domain name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const domainData = { 
                name: name.trim(), 
                color: color || '#000000', 
                subdomains: subdomains || [],
                image: image || ''
        };
        

        
        if (id) {
                await domainService.update(id, domainData);
        } else {
                await domainService.create(domainData);
            }
            
            // Refresh domains in context
            await refreshDomains();
        navigate('/indicators-management');
        } catch (err) {
            setError('Failed to save domain: ' + (err.userMessage || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubdomain();
        }
    };



    if (loading && id) {
        return (
            <PageTemplate>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full ">
                    <h1 className="text-xl font-bold text-center mb-6">
                        {id ? 'Edit Domain' : 'New Domain'}
                    </h1>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <span>{error}</span>
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="name-input" className="block mb-2 text-sm font-medium text-neutral">Name *</label>
                            <input
                                type="text"
                                id="name-input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={loading}
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
                                disabled={loading}
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
                                    disabled={loading}
                                    className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                    placeholder="Enter subdomain name"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddSubdomain} 
                                    disabled={loading || !subdomainInput.trim()}
                                    className="btn btn-primary"
                                >
                                    Add
                                </button>
                            </div>
                            <ul className="mt-2">
                                {subdomains.map((subdomain, index) => (
                                    <li key={index} className="flex justify-between items-center bg-base-200 p-2 rounded-lg mt-1">
                                        {subdomain}
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveSubdomain(index)} 
                                            disabled={loading}
                                            className="text-error btn btn-sm btn-ghost"
                                        >
                                            Remove
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <label htmlFor="image-input" className="block mb-2 text-sm font-medium text-neutral">Image URL</label>
                                <input
                                type="text"
                                    id="image-input"
                                value={image}
                                onChange={(e) => setImage(e.target.value)}
                                disabled={loading}
                                placeholder="Enter image URL"
                                className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                />
                        </div>
                        
                        <div className="flex justify-end mt-4 space-x-2">
                            <button 
                                type="button" 
                                onClick={() => navigate('/indicators-management')}
                                disabled={loading}
                                className="btn btn-ghost"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={loading || !name.trim()}
                                className="btn btn-primary"
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </PageTemplate>
    );
}
