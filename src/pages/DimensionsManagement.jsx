import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import ActionCard from '../components/ActionCard';
import Pagination from '../components/Pagination';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

// TODO: Create dimensionService when backend is ready
// import dimensionService from '../services/dimensionService';

export default function DimensionsManagement() {
  const [dimensions, setDimensions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    loadDimensions();
  }, [currentPage]);

  const loadDimensions = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call when backend is ready
      // const data = await dimensionService.getAll(currentPage * pageSize, pageSize);
      // setDimensions(data || []);
      // setTotalItems(data.total || 0);

      // Placeholder data for now
      setDimensions([
        { id: '1', name: 'Dimensão Ambiental', description: 'Indicadores relacionados ao meio ambiente', indicatorCount: 45 },
        { id: '2', name: 'Dimensão Social', description: 'Indicadores relacionados à sociedade', indicatorCount: 32 },
        { id: '3', name: 'Dimensão Económica', description: 'Indicadores relacionados à economia', indicatorCount: 28 }
      ]);
      setTotalItems(3);

    } catch (err) {
      setError(err.message || 'Falha ao carregar dimensões');
      console.error('Error loading dimensions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit_dimension/${id}`);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta dimensão?')) {
      return;
    }

    try {
      // TODO: Replace with actual API call
      // await dimensionService.delete(id);
      setDimensions(dimensions.filter(dim => dim.id !== id));
    } catch (err) {
      setError(err.message || 'Falha ao eliminar dimensão');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AdminNavbar />
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <AdminNavbar />
        <ErrorDisplay error={error} onRetry={loadDimensions} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <AdminNavbar />

      <div className="relative px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Edit Panel Link */}
          <div className="absolute top-6 right-6">
            <button className="text-base font-['Inter',sans-serif] font-medium text-black hover:text-gray-600 transition-colors">
              Editar painel
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
            {/* Left Column - Dimensions Table */}
            <div className="bg-[#f1f0f0] rounded-[23px] p-8">
              <h1 className="font-['Onest',sans-serif] font-semibold text-4xl text-black mb-6">
                Dimensões
              </h1>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_3fr_1fr_auto] gap-4 mb-4">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black">Nome</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black">Descrição</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">Indicadores</p>
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-right">Opções</p>
              </div>

              {/* Table Rows */}
              <div className="space-y-3">
                {dimensions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Ainda não existem dimensões
                  </div>
                ) : (
                  dimensions.map((dimension) => (
                    <div
                      key={dimension.id}
                      className="bg-[#d9d9d9] rounded-lg p-4 grid grid-cols-[2fr_3fr_1fr_auto] gap-4 items-center hover:bg-gray-300 transition-colors"
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                          </svg>
                        </div>
                        <span className="font-['Onest',sans-serif] font-normal text-sm text-black">
                          {dimension.name}
                        </span>
                      </div>

                      {/* Description */}
                      <div className="flex items-center">
                        <span className="font-['Onest',sans-serif] font-normal text-sm text-gray-600 truncate">
                          {dimension.description}
                        </span>
                      </div>

                      {/* Indicator Count */}
                      <div className="flex justify-center">
                        <span className="font-['Onest',sans-serif] font-medium text-sm text-black">
                          {dimension.indicatorCount}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(dimension.id)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(dimension.id)}
                          className="p-2 hover:bg-gray-400 rounded transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {dimensions.length > 0 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    hasNextPage={currentPage * pageSize + dimensions.length < totalItems}
                    onPageChange={handlePageChange}
                    loading={loading}
                    showItemCount={true}
                    itemName="dimensões"
                  />
                </div>
              )}
            </div>

            {/* Right Column - Action Cards */}
            <div className="flex flex-col gap-6">
              <ActionCard
                icon={
                  <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
                title={`Adicionar\nDimensão`}
                to="/new_dimension"
                className="w-[210px]"
              />

              <div className="bg-[#f1f0f0] rounded-[23px] p-6 w-[210px]">
                <p className="font-['Onest',sans-serif] font-medium text-sm text-black text-center">
                  Total: {totalItems} dimensões
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
