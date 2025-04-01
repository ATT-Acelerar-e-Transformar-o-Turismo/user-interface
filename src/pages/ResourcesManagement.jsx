import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ManagementTemplate from '../components/ManagementTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import { useResource } from '../contexts/ResourceContext';
import { useDomain } from '../contexts/DomainContext';

export default function ResourcesManagement() {
  const { indicator } = useParams();
  const navigate = useNavigate();
  const { getResourcesByIndicator, deleteResource } = useResource();
  const { getIndicatorById } = useDomain();

  const indicatorData = getIndicatorById(indicator);
  const tableContent = getResourcesByIndicator(parseInt(indicator));

  const handleDelete = (resourceId) => deleteResource(resourceId);
  const handleEdit = (resourceId) => navigate(`/edit_resource/${resourceId}`);
  const handleDataTypeSelect = (dataType) =>
    navigate(`/add_data_resource/${indicator}`, {
      state: {
        dataToSend: {
          ...indicatorData,
          selectedDataType: dataType
        }
      }
    });

  const visibleColumns = ['name', 'start period', 'end period'];
  const actions = [
    { label: 'Edit', className: 'btn-primary', onClick: handleEdit },
    { label: 'Delete', className: 'btn-secondary', onClick: handleDelete }
  ];

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
