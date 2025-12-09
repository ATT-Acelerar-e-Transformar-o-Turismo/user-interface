import { useState, useEffect } from 'react';
import indicatorService from '../services/indicatorService';

export default function IndicatorSelectorModal({ isOpen, onClose, onSelect }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [vizType, setVizType] = useState('line'); // Default to line chart

    useEffect(() => {
        if (isOpen && searchQuery.length > 2) {
            searchIndicators();
        } else if (isOpen && searchQuery.length === 0) {
            loadRecentIndicators();
        }
    }, [searchQuery, isOpen]);

    const loadRecentIndicators = async () => {
        try {
            setLoading(true);
            // Just get top 10 indicators
            const data = await indicatorService.getAll(0, 10);
            setResults(data);
        } catch (err) {
            console.error("Error loading indicators", err);
        } finally {
            setLoading(false);
        }
    };

    const searchIndicators = async () => {
        try {
            setLoading(true);
            const data = await indicatorService.search(searchQuery);
            setResults(data);
        } catch (err) {
            console.error("Error searching indicators", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectIndicator = (indicator) => {
        setSelectedIndicator(indicator);
    };

    const handleConfirm = () => {
        if (selectedIndicator) {
            onSelect(selectedIndicator, vizType);
            handleClose();
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSelectedIndicator(null);
        setVizType('line');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">Inserir Indicador</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    {!selectedIndicator ? (
                        <>
                            <div className="mb-4">
                                <input
                                    type="text"
                                    placeholder="Buscar indicador..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-gray-500">Carregando...</div>
                            ) : (
                                <div className="space-y-2">
                                    {results.map(ind => (
                                        <div 
                                            key={ind.id} 
                                            onClick={() => handleSelectIndicator(ind)}
                                            className="p-3 border border-gray-100 rounded hover:bg-green-50 cursor-pointer transition-colors flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-medium text-gray-900">{ind.name}</div>
                                                <div className="text-xs text-gray-500">{ind.subdomain} • {ind.periodicity}</div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    ))}
                                    {results.length === 0 && searchQuery.length > 2 && (
                                        <div className="text-center py-8 text-gray-500">Nenhum indicador encontrado</div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-green-900">{selectedIndicator.name}</h3>
                                    <p className="text-sm text-green-700">{selectedIndicator.domain} / {selectedIndicator.subdomain}</p>
                                </div>
                                <button 
                                    onClick={() => setSelectedIndicator(null)}
                                    className="text-green-600 hover:text-green-800 text-sm underline"
                                >
                                    Alterar
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">Escolha a Visualização</label>
                                <div className="grid grid-cols-3 gap-4">
                                    <div 
                                        onClick={() => setVizType('value')}
                                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${vizType === 'value' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <div className="text-2xl font-bold text-gray-400 mb-2">123</div>
                                        <div className="text-sm font-medium">Último Valor</div>
                                    </div>
                                    <div 
                                        onClick={() => setVizType('line')}
                                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${vizType === 'line' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                        </svg>
                                        <div className="text-sm font-medium">Linha</div>
                                    </div>
                                    <div 
                                        onClick={() => setVizType('bar')}
                                        className={`cursor-pointer p-4 rounded-lg border-2 text-center transition-all ${vizType === 'bar' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        <div className="text-sm font-medium">Barras</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
                    <button 
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!selectedIndicator}
                        className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Inserir Indicador
                    </button>
                </div>
            </div>
        </div>
    );
}
