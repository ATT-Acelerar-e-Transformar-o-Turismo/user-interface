import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageTemplate from './PageTemplate';
import { useArea } from '../contexts/AreaContext';
import areaService from '../services/areaService';

export default function NewArea() {
    const [dimensions, setDimensions] = useState([]);
    const [dimensionInput, setDimensionInput] = useState('');
    const [name, setName] = useState('');
    const [color, setColor] = useState('#000000');
    const [image, setImage] = useState('');
    const [icon, setIcon] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();
    const { refreshAreas } = useArea();

    useEffect(() => {
        if (id) {
            const loadArea = async () => {
                try {
                    setLoading(true);
                    const area = await areaService.getById(id);
            if (area) {
                        setName(area.name || '');
                        setColor(area.color || '#000000');
                        setDimensions(Array.isArray(area.dimensions) ? area.dimensions : []);
                        setImage(area.image || '');
                        setIcon(area.icon || '');
            }
                } catch (err) {
                    setError('Failed to load area: ' + (err.userMessage || err.message));
                } finally {
                    setLoading(false);
                }
            };
            loadArea();
        }
    }, [id]);

    const handleAddDimension = () => {
        if (dimensionInput.trim()) {
            setDimensions([...dimensions, dimensionInput.trim()]);
            setDimensionInput('');
        }
    };

    const handleRemoveDimension = (index) => {
        setDimensions(dimensions.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Area name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const areaData = {
                name: name.trim(),
                color: color || '#000000',
                dimensions: dimensions || [],
                image: image || '',
                icon: icon || ''
        };
        

        
        if (id) {
                await areaService.update(id, areaData);
        } else {
                await areaService.create(areaData);
            }
            
            // Refresh areas in context
            await refreshAreas();
        navigate('/admin/indicators-management');
        } catch (err) {
            setError('Failed to save area: ' + (err.userMessage || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddDimension();
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
                        {id ? 'Edit Area' : 'New Area'}
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

                        <div className="mb-6">
                            <label htmlFor="dimensions-input" className="block mb-2 text-sm font-medium text-neutral">Dimensões</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    id="dimensions-input"
                                    value={dimensionInput}
                                    onChange={(e) => setDimensionInput(e.target.value)}
                                    className="input input-bordered flex-1"
                                    placeholder="Nome da dimensão"
                                />
                                <button 
                                    type="button" 
                                    className="btn btn-primary text-white"
                                    onClick={handleAddDimension}
                                    disabled={loading || !dimensionInput.trim()}
                                >
                                    Adicionar
                                </button>
                            </div>
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

                        <div>
                            <label htmlFor="icon-input" className="block mb-2 text-sm font-medium text-neutral">Icon URL</label>
                                <input
                                type="text"
                                    id="icon-input"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                disabled={loading}
                                placeholder="Enter icon URL"
                                className="bg-base-100 border border-base-300 text-neutral text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
                                />
                        </div>

                        <div className="flex justify-end mt-4 space-x-2">
                            <button 
                                type="button" 
                                onClick={() => navigate('/admin/indicators-management')}
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
