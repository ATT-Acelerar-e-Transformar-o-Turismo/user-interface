import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementTemplate from '../components/ManagementTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
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
            return null; // Return null for failed requests
          })
        );
        
        const resourceDetailsResults = await Promise.all(resourcePromises);
        // Filter out null results (failed requests)
        const validResourceDetails = resourceDetailsResults.filter(resource => resource !== null);
        setResourcesDetails(validResourceDetails);
      } else {
        setResourcesDetails([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resource) => {
    try {
      const resourceId = resource.id;
      
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

  const handleEdit = (resource) => {
    const resourceId = resource.id;
    navigate(`/edit_resource/${resourceId}`);
  };

  const handleDataTypeSelect = (dataType) => {
    navigate(`/add_data_resource/${indicator}`, {
      state: {
        dataToSend: {
          ...indicatorData,
          selectedDataType: dataType
        }
      }
    });
  };

  const visibleColumns = ['name', 'start_period', 'end_period', 'type'];

  const actions = [
    { label: 'Edit', className: 'btn-primary', onClick: handleEdit },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

  // Prepare table content with resource details
  const tableContent = resourcesDetails.map(resource => ({
    ...resource,
    start_period: resource.start_period || resource.startPeriod || 'N/A',
    end_period: resource.end_period || resource.endPeriod || 'N/A',
    type: resource.type || 'Unknown'
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
    <ManagementTemplate
      title={`${indicatorData?.name || 'Unknown Indicator'} - Resources`}
      tableContent={tableContent}
      emptyMessage="There are no resources yet"
      visibleColumns={visibleColumns}
      actions={actions}
      headerActions={<AddDataDropdown onDataTypeSelect={handleDataTypeSelect} />}
    />
  );
}
