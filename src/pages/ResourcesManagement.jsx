import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementTemplate from '../components/ManagementTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import ResourceWizard from '../components/wizard/ResourceWizard';
import indicatorService from '../services/indicatorService';
import resourceService from '../services/resourceService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorDisplay from '../components/ErrorDisplay';

export default function ResourcesManagement() {
  const { indicator } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [indicatorData, setIndicatorData] = useState(null);
  const [resources, setResources] = useState([]);
  const [resourcesDetails, setResourcesDetails] = useState([]);
  const [wrappersStatus, setWrappersStatus] = useState({});
  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedWrapper, setSelectedWrapper] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAdvancedLogs, setShowAdvancedLogs] = useState(false);
  const [wrapperLogs, setWrapperLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Resource wizard state
  const [isResourceWizardOpen, setIsResourceWizardOpen] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState(null);

  // Load data on component mount
  useEffect(() => {
    if (indicator) {
      loadData();
    }
  }, [indicator]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load indicator data
      const indicatorResponse = await indicatorService.getById(indicator);
      setIndicatorData(indicatorResponse);
      
      // Get resource IDs associated with this indicator
      const resourceIds = indicatorResponse.resources || [];
      setResources(resourceIds);
      
      // Load detailed resource information for each resource ID
      if (resourceIds.length > 0) {
        const resourcePromises = resourceIds.map(resourceId =>
          resourceService.getById(resourceId).catch(err => {
            console.warn(`Failed to load resource ${resourceId}:`, err);
            return null;
          })
        );

        const resourceDetailsResults = await Promise.all(resourcePromises);
        const validResourceDetails = resourceDetailsResults.filter(resource => resource !== null);
        setResourcesDetails(validResourceDetails);

        // Load wrapper status for each resource
        const statusMap = {};
        const wrapperPromises = validResourceDetails.map(async (resource) => {
          if (resource.wrapper_id) {
            try {
              const wrapperData = await resourceService.getWrapper(resource.wrapper_id);
              statusMap[resource.id] = wrapperData.status || 'unknown';
            } catch (err) {
              console.warn(`Failed to load wrapper status for ${resource.wrapper_id}:`, err);
              statusMap[resource.id] = 'error';
            }
          } else {
            statusMap[resource.id] = 'no wrapper';
          }
        });

        await Promise.all(wrapperPromises);
        setWrappersStatus(statusMap);
      } else {
        setResourcesDetails([]);
        setWrappersStatus({});
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      if (!resourceId || resourceId === 'undefined') {
        setError('Invalid resource ID. Cannot delete.');
        return;
      }

      // Delete the resource
      await resourceService.delete(resourceId);

      // Remove resource from indicator's resource list
      await indicatorService.removeResource(indicator, resourceId);

      // Update local state
      setResources(resources.filter(id => id !== resourceId));
      setResourcesDetails(resourcesDetails.filter(r => r.id !== resourceId));
    } catch (err) {
      setError(err.message || 'Failed to delete resource');
      console.error('Error deleting resource:', err);
    }
  };

  const handleViewDetails = (resourceId) => {
    if (!resourceId || resourceId === 'undefined') {
      setError('Invalid resource ID.');
      return;
    }
    const resource = resourcesDetails.find(r => r.id === resourceId);
    if (resource && resource.wrapper_id) {
      resourceService.getWrapper(resource.wrapper_id)
        .then(wrapper => {
          setSelectedResource(resource);
          setSelectedWrapper(wrapper);
          setShowDetailsModal(true);
        })
        .catch(err => {
          setError('Failed to load wrapper details');
        });
    } else {
      setSelectedResource(resource);
      setSelectedWrapper(null);
      setShowDetailsModal(true);
    }
  };

  const handleDataTypeSelect = (dataType) => {
    // Open ResourceWizard modal instead of navigating
    setEditingResourceId(null);
    setIsResourceWizardOpen(true);
  };

  const handleEditResource = (resourceId) => {
    setEditingResourceId(resourceId);
    setIsResourceWizardOpen(true);
  };

  const handleDataTypeSelect_OLD = (dataType) => {
    navigate(`/add_data_resource/${indicator}`, {
      state: {
        dataToSend: {
          ...indicatorData,
          selectedDataType: dataType
        }
      }
    });
  };

  const fetchWrapperLogs = async (wrapperId) => {
    if (!wrapperId) return;

    try {
      setLogsLoading(true);
      const response = await resourceService.getWrapperLogs(wrapperId, 200);
      setWrapperLogs(response.logs || []);
    } catch (err) {
      console.error('Failed to fetch wrapper logs:', err);
      setWrapperLogs(['Error fetching logs: ' + err.message]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleToggleAdvancedLogs = () => {
    if (!showAdvancedLogs && selectedWrapper) {
      fetchWrapperLogs(selectedWrapper.wrapper_id);
    }
    setShowAdvancedLogs(!showAdvancedLogs);
  };

  const visibleColumns = ['name', 'start_period', 'end_period', 'type', 'status'];

  const actions = [
    { label: 'Details', className: 'btn-primary', onClick: handleViewDetails },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

  // Prepare table content with resource details
  const tableContent = resourcesDetails.map(resource => ({
    ...resource,
    start_period: resource.start_period || resource.startPeriod || 'N/A',
    end_period: resource.end_period || resource.endPeriod || 'N/A',
    type: resource.type || 'Unknown',
    status: wrappersStatus[resource.id] || 'loading...'
  }));

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={loadData} />;
  }

  if (!indicatorData) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Indicator Not Found</h2>
          <p className="text-gray-600 mb-4">The requested indicator could not be found.</p>
          <button 
            onClick={() => navigate('/indicators-management')} 
            className="btn btn-primary"
          >
            Back to Indicators
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ManagementTemplate
        title={`${indicatorData?.name || 'Unknown Indicator'} - Resources`}
        tableContent={tableContent}
        emptyMessage="There are no resources yet"
        visibleColumns={visibleColumns}
        actions={actions}
        headerActions={<AddDataDropdown onDataTypeSelect={handleDataTypeSelect} />}
        showSearchBox={false}
      />

      {showDetailsModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">Resource Details</h3>

            {selectedResource && (
              <div className="space-y-4">
                <div className="bg-base-200 p-4 rounded">
                  <h4 className="font-semibold mb-2">Resource Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Name:</strong> {selectedResource.name}</div>
                    <div><strong>Type:</strong> {selectedResource.type}</div>
                    <div><strong>Start Period:</strong> {selectedResource.startPeriod || selectedResource.start_period || 'N/A'}</div>
                    <div><strong>End Period:</strong> {selectedResource.endPeriod || selectedResource.end_period || 'N/A'}</div>
                    <div><strong>Resource ID:</strong> {selectedResource.id}</div>
                    <div><strong>Wrapper ID:</strong> {selectedResource.wrapper_id || 'N/A'}</div>
                  </div>
                </div>

                {selectedWrapper && (
                  <>
                    <div className="bg-base-200 p-4 rounded">
                      <h4 className="font-semibold mb-2">Wrapper Status</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><strong>Status:</strong> <span className={`badge ${selectedWrapper.status === 'completed' ? 'badge-success' : selectedWrapper.status === 'error' ? 'badge-error' : 'badge-warning'}`}>{selectedWrapper.status}</span></div>
                        <div><strong>Created:</strong> {new Date(selectedWrapper.created_at).toLocaleString()}</div>
                        {selectedWrapper.completed_at && (
                          <div><strong>Completed:</strong> {new Date(selectedWrapper.completed_at).toLocaleString()}</div>
                        )}
                        {selectedWrapper.error_message && (
                          <div className="col-span-2"><strong>Error:</strong> {selectedWrapper.error_message}</div>
                        )}
                      </div>
                    </div>

                    {selectedWrapper.source_config && (
                      <div className="bg-base-200 p-4 rounded">
                        <h4 className="font-semibold mb-2">Source Configuration</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Source Type:</strong> {selectedWrapper.source_type}</div>
                          {selectedWrapper.source_config.location && (
                            <div className="col-span-2"><strong>API URL:</strong> <span className="text-xs break-all">{selectedWrapper.source_config.location}</span></div>
                          )}
                          {selectedWrapper.source_config.date_field && (
                            <div><strong>Date Field:</strong> {selectedWrapper.source_config.date_field}</div>
                          )}
                          {selectedWrapper.source_config.value_field && (
                            <div><strong>Value Field:</strong> {selectedWrapper.source_config.value_field}</div>
                          )}
                          {selectedWrapper.source_config.auth_type && selectedWrapper.source_config.auth_type !== 'none' && (
                            <div><strong>Auth Type:</strong> {selectedWrapper.source_config.auth_type}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedWrapper.metadata && (
                      <div className="bg-base-200 p-4 rounded">
                        <h4 className="font-semibold mb-2">Metadata</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><strong>Domain:</strong> {selectedWrapper.metadata.domain}</div>
                          <div><strong>Subdomain:</strong> {selectedWrapper.metadata.subdomain}</div>
                          <div><strong>Unit:</strong> {selectedWrapper.metadata.unit || 'N/A'}</div>
                          <div><strong>Periodicity:</strong> {selectedWrapper.metadata.periodicity}</div>
                        </div>
                      </div>
                    )}
                    {/* Advanced Logs Section */}
                    {selectedWrapper && (
                      <div className="mt-4">
                        <div className="collapse collapse-plus bg-base-300">
                          <input
                            type="checkbox"
                            checked={showAdvancedLogs}
                            onChange={handleToggleAdvancedLogs}
                          />
                          <div className="collapse-title text-sm font-medium">
                            Advanced: View Wrapper Logs (Last 200 lines)
                          </div>
                          <div className="collapse-content">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-500">
                                Real-time wrapper execution logs
                              </span>
                              <button
                                className="btn btn-xs btn-outline"
                                onClick={() => fetchWrapperLogs(selectedWrapper.wrapper_id)}
                                disabled={logsLoading}
                              >
                                {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
                              </button>
                            </div>

                            <div className="bg-black text-green-400 p-3 rounded-lg text-xs font-mono max-h-96 overflow-y-auto">
                              {logsLoading ? (
                                <div className="text-center text-gray-500">Loading logs...</div>
                              ) : wrapperLogs.length > 0 ? (
                                wrapperLogs.map((line, index) => (
                                  <div key={index} className="mb-1">
                                    {line}
                                  </div>
                                ))
                              ) : (
                                <div className="text-gray-500">No logs available</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setShowDetailsModal(false);
                  setShowAdvancedLogs(false);
                  setWrapperLogs([]);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Wizard Modal */}
      {indicator && (
        <ResourceWizard
          isOpen={isResourceWizardOpen}
          onClose={() => {
            setIsResourceWizardOpen(false);
            setEditingResourceId(null);
          }}
          indicatorId={indicator}
          resourceId={editingResourceId}
          onSuccess={() => {
            // Reload resources after successful add/edit
            loadData();
          }}
        />
      )}
    </>
  );
}
