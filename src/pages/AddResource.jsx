import { useState, useEffect } from 'react';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageTemplate from './PageTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import GChart from '../components/Chart';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useResource } from '../contexts/ResourceContext';
import { useIndicator } from '../contexts/IndicatorContext';
import indicatorService from '../services/indicatorService';
import resourceService from '../services/resourceService';

export default function AddResource() {
    const location = useLocation();
    const { indicator: indicatorIdParam } = useParams();
    const navigate = useNavigate();
    const { indicators, loading: indicatorsLoading } = useIndicator();
    const { addResource } = useResource();

    const [indicatorData, setIndicatorData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [existingResources, setExistingResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);

    // Try to get indicator data from multiple sources
    const formData = location.state?.dataToSend || 
                    indicatorData || 
                    (indicators && Array.isArray(indicators) ? indicators.find(ind => ind.id === indicatorIdParam) : null) || {};

    // If no data found and we have an indicator ID, fetch from API
    useEffect(() => {
        const fetchIndicatorData = async () => {
            if (!indicatorIdParam || indicatorsLoading) return;
            if (location.state?.dataToSend) return; // Already have data from navigation state
            if (indicators && indicators.find(ind => ind.id === indicatorIdParam)) return; // Found in context

            console.log('Fetching indicator data from API for ID:', indicatorIdParam);
            try {
                setLoading(true);
                const data = await indicatorService.getById(indicatorIdParam);
                console.log('Fetched indicator data:', data);
                setIndicatorData(data);
            } catch (err) {
                console.error('Failed to fetch indicator:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchIndicatorData();
    }, [indicatorIdParam, indicators, indicatorsLoading, location.state?.dataToSend]);

    // Function to load existing resources (reusable)
    const loadExistingResources = async () => {
        if (!indicatorIdParam) return;
        
        try {
            setLoadingResources(true);
            console.log('Loading existing resources for indicator:', indicatorIdParam);
            
            // Get resources associated with this indicator
            const resources = await indicatorService.getResources(indicatorIdParam);
            console.log('Found existing resources:', resources);
            
            // Get detailed resource information for each resource
            if (resources && resources.length > 0) {
                const resourceDetailsPromises = resources.map(async (resource) => {
                    try {
                        // If resource is just an ID string, fetch the full resource data
                        if (typeof resource === 'string') {
                            return await resourceService.getById(resource);
                        }
                        // If resource is already a full object, return as is
                        return resource;
                    } catch (err) {
                        console.warn(`Failed to load resource details:`, err);
                        return null;
                    }
                });
                
                const resourceDetails = await Promise.all(resourceDetailsPromises);
                const validResources = resourceDetails.filter(resource => resource !== null);
                setExistingResources(validResources);
            } else {
                setExistingResources([]);
            }
        } catch (err) {
            console.error('Failed to load existing resources:', err);
            setExistingResources([]);
        } finally {
            setLoadingResources(false);
        }
    };

    // Load existing resources for this indicator
    useEffect(() => {
        loadExistingResources();
    }, [indicatorIdParam]);
    
    // Debug logging to see what data we're receiving
    console.log('AddResource debug:');
    console.log('location.state:', location.state);
    console.log('indicatorIdParam:', indicatorIdParam);
    console.log('indicatorsLoading:', indicatorsLoading);
    console.log('indicators length:', indicators?.length);
    console.log('indicators:', indicators);
    if (indicators?.length > 0) {
        console.log('Sample indicator:', indicators[0]);
        console.log('Looking for indicator with ID:', indicatorIdParam);
        const found = indicators.find(ind => ind.id === indicatorIdParam);
        console.log('Found indicator:', found);
    }
    console.log('formData:', formData);

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadedData, setUploadedData] = useState([]);
    const [combinedHeaders, setCombinedHeaders] = useState([]);
    const [combinedRows, setCombinedRows] = useState([]);
    const [chartSeries, setChartSeries] = useState([]);

    const handleAddFileSlot = () => {
        setUploadedFiles([...uploadedFiles, null]);
    };

    const handleRemoveFile = (index) => {
        const newUploadedFiles = [...uploadedFiles];
        newUploadedFiles.splice(index, 1);
        setUploadedFiles(newUploadedFiles);

        const newUploadedData = [...uploadedData];
        newUploadedData.splice(index, 1);
        setUploadedData(newUploadedData);

        combineAllData(newUploadedData);
    };

    const handleFileChange = (event, index) => {
        const file = event.target.files[0];
        if (!file) return;

        const newUploadedFiles = [...uploadedFiles];
        newUploadedFiles[index] = file;
        setUploadedFiles(newUploadedFiles);

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            parseCSV(file, index);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            parseXLSX(file, index);
        } else {
            alert('Unsupported file format. Please upload a CSV or Excel file.');
        }
    };

    const parseCSV = (file, index) => {
        Papa.parse(file, {
            complete: (result) => {
                processFileData(result.data, index);
            },
            header: false,
            skipEmptyLines: true,
        });
    };

    const parseXLSX = (file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const sheetName = workbook.SheetNames[2];  // 3rd sheet
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

            processFileData(sheetData, index);
        };
        reader.readAsArrayBuffer(file);
    };

    const processFileData = (data, index) => {
        if (!data || !data.length) return;

        const headers = data[0];
        const rows = data.slice(1);

        // Filter out empty rows where either 'x' or 'y' values are missing
        const validRows = rows.filter(row => {
            const xValue = row[0];
            const yValue = row[1];
            return xValue && yValue !== undefined && yValue !== null;
        });

        const newUploadedData = [...uploadedData];
        newUploadedData[index] = { headers, rows: validRows };
        setUploadedData(newUploadedData);

        combineAllData(newUploadedData);
    };

    const combineAllData = (allData) => {
        if (!allData.length) {
            setCombinedHeaders([]);
            setCombinedRows([]);
            setChartSeries([]);
            return;
        }

        const baseHeaders = allData[0].headers || [];

        let allRows = [];
        for (const dataObj of allData) {
            if (dataObj?.rows?.length) {
                allRows = allRows.concat(dataObj.rows);
            }
        }

        setCombinedHeaders(baseHeaders);
        setCombinedRows(allRows);

        const newSeries = buildChartSeries(baseHeaders, allRows);
        setChartSeries(newSeries);
    };

    const buildChartSeries = (headers, rows) => {
        if (!headers || headers.length <= 1) return [];

        return headers.slice(1).map((colName, index) => ({
            name: colName,
            data: rows.map((row) => ({
                x: row[0], // e.g. 2004
                y: parseFloat(row[index + 1]) || null,
            }))
        }));
    };

    const handleBack = () => {
        navigate(-1);
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            
            // Ensure we have valid data arrays
            const safeRows = Array.isArray(combinedRows) ? combinedRows : [];
            const safeHeaders = Array.isArray(combinedHeaders) ? combinedHeaders : [];
            const safeFiles = Array.isArray(uploadedFiles) ? uploadedFiles : [];
            
            const newResource = {
                wrapper_id: `wrapper_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
                name: safeFiles.length > 0 ? safeFiles[0].name : "uploaded_data.csv",
                type: formData.selectedDataType || 'CSV',
                start_period: safeRows.length > 0 ? String(safeRows[0][0] || '') : '',
                end_period: safeRows.length > 0 ? String(safeRows[safeRows.length - 1][0] || '') : '',
                indicator: formData.id || null,
                data: safeRows,
                headers: safeHeaders,
                file_metadata: {
                    original_filename: safeFiles.length > 0 ? safeFiles[0].name : null,
                    file_count: safeFiles.length,
                    rows_count: safeRows.length,
                    columns_count: safeHeaders.length
                }
            };
            
            // Add resource through API
            console.log('Sending resource data:', JSON.stringify(newResource, null, 2));
            const createdResource = await addResource(newResource);
            
            // Add resource to indicator
            if (createdResource && formData.id) {
                await indicatorService.addResource(formData.id, createdResource.id);
            }
            
            // Refresh existing resources to show the newly added resource
            await loadExistingResources();
            
            navigate(`/resources-management/${formData.id}`);
        } catch (error) {
            console.error('Error saving resource:', error);
            alert('Failed to save resource. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading || indicatorsLoading) {
        return (
            <PageTemplate>
                <div className="flex justify-center items-center min-h-64">
                    <div className="text-center">
                        <div className="loading loading-spinner loading-lg"></div>
                        <p className="mt-4">Loading indicator data...</p>
                    </div>
                </div>
            </PageTemplate>
        );
    }

    return (
        <PageTemplate>
            <div className="flex justify-center ">
                <div className="p-8 rounded-lg shadow-lg w-full max-w-4xl">
                    <h1 className="text-xl font-bold text-center mb-6">
                        Upload {formData.selectedDataType || "Data"}
                    </h1>

                    <div className="border p-4 rounded-lg bg-gray-100">
                        <h2 className="font-bold">Indicator Metadata</h2>
                        <p><strong>Name:</strong> {formData.name || "N/A"}</p>
                        <p><strong>Description:</strong> {formData.description || "N/A"}</p>
                        <p><strong>Source:</strong> {formData.font || "N/A"}</p>
                        <p><strong>Scale:</strong> {formData.scale || "N/A"}</p>
                        <p><strong>Units:</strong> {formData.unit || "N/A"}</p>
                        <p><strong>Periodicity:</strong> {formData.periodicity || "N/A"}</p>
                        <p><strong>Domain:</strong> {formData.domain?.name || formData.domain || "N/A"}</p>
                        <p><strong>Subdomain:</strong> {formData.subdomain || "N/A"}</p>
                        <p><strong>Governance:</strong> {formData.governance ? "Yes" : "No"}</p>
                        <p><strong>Favourites:</strong> {formData.favourites || 0}</p>
                    </div>

                    {/* Existing Resources Section */}
                    <div className="mt-6 border p-4 rounded-lg bg-blue-50">
                        <div className="flex justify-between items-center mb-3">
                            <h2 className="font-bold text-lg text-blue-800">
                                Existing Resources ({existingResources.length})
                            </h2>
                            <button 
                                onClick={loadExistingResources}
                                disabled={loadingResources}
                                className="btn btn-sm btn-outline btn-blue-600"
                            >
                                {loadingResources ? 'Refreshing...' : 'Refresh'}
                            </button>
                        </div>
                        
                        {loadingResources ? (
                            <div className="flex justify-center items-center py-4">
                                <div className="loading loading-spinner loading-md"></div>
                                <span className="ml-2">Loading existing resources...</span>
                            </div>
                        ) : existingResources.length > 0 ? (
                            <div className="space-y-3">
                                {existingResources.map((resource, index) => (
                                    <div key={resource.id || index} className="border border-blue-200 p-3 rounded-lg bg-white">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-blue-900">{resource.name || 'Unnamed Resource'}</h3>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <p><strong>Type:</strong> {resource.type || 'Unknown'}</p>
                                                    <p><strong>Period:</strong> {resource.start_period || resource.startPeriod || 'N/A'} - {resource.end_period || resource.endPeriod || 'N/A'}</p>
                                                    {resource.file_metadata && (
                                                        <p><strong>Rows:</strong> {resource.file_metadata.rows_count || 0}, <strong>Columns:</strong> {resource.file_metadata.columns_count || 0}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <button 
                                                    onClick={() => navigate(`/edit_resource/${resource.id}`)}
                                                    className="btn btn-sm btn-outline btn-primary"
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                <p>No existing resources found for this indicator.</p>
                                <p className="text-sm">Upload your first resource below!</p>
                            </div>
                        )}
                    </div>

                    {/* Add New Resource Section */}
                    <div className="mt-8 border p-4 rounded-lg bg-green-50">
                        <h2 className="font-bold text-lg mb-3 text-green-800">
                            Add New Resource
                        </h2>
                        <div className="space-y-5">

                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    accept={
                                        formData.selectedDataType === 'CSV'
                                            ? '.csv'
                                            : '.xlsx,.xls'
                                    }
                                    onChange={(e) => handleFileChange(e, index)}
                                    className="file-input border p-2 rounded-lg w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveFile(index)}
                                    className="btn btn-secondary"
                                >
                                    x
                                </button>
                            </div>
                        ))}

                        <div>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddFileSlot}
                            >
                                + Add Resource
                            </button>
                        </div>

                        {/* Data Preview Section */}
                        {combinedRows.length > 0 && (
                            <div className="mt-6 border-2 border-purple-300 rounded-lg p-4 bg-purple-50">
                                <h3 className="font-bold text-lg mb-4 text-purple-800 flex items-center">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Data Preview
                                </h3>
                                
                                {/* Summary Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-white p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600">Total Rows</p>
                                        <p className="text-2xl font-bold text-purple-700">{combinedRows.length}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600">Columns</p>
                                        <p className="text-2xl font-bold text-purple-700">{combinedHeaders.length}</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg shadow">
                                        <p className="text-sm text-gray-600">Time Period</p>
                                        <p className="text-lg font-bold text-purple-700">
                                            {combinedRows[0]?.[0]} - {combinedRows[combinedRows.length - 1]?.[0]}
                                        </p>
                                    </div>
                                </div>

                                {/* Chart Display */}
                                {chartSeries.length > 0 && (
                                    <div className="mb-6 bg-white p-4 rounded-lg shadow">
                                        <h4 className="font-semibold text-purple-800 mb-3">Chart Visualization</h4>
                                        <GChart
                                            title="Data Preview"
                                            chartId="file-chart"
                                            chartType="line"
                                            xaxisType="datetime"
                                            series={chartSeries}
                                            height={350}
                                        />
                                    </div>
                                )}

                                {/* Table Preview */}
                                <div className="bg-white p-4 rounded-lg shadow">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-purple-800">Data Table</h4>
                                        <span className="text-sm text-gray-600">
                                            Showing {Math.min(10, combinedRows.length)} of {combinedRows.length} rows
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                        <table className="table-auto border-collapse border w-full text-sm text-left">
                                            <thead className="bg-purple-100 sticky top-0">
                                                <tr className="border">
                                                    {combinedHeaders.map((header, headerIndex) => (
                                                        <th key={headerIndex} className="border p-2 font-semibold text-purple-900">
                                                            {header}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {combinedRows.slice(-10).map((row, rowIndex) => (
                                                    <tr key={rowIndex} className="border hover:bg-purple-50">
                                                        {row.map((cell, cellIndex) => (
                                                            <td key={cellIndex} className="border p-2">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div> {/* End Add New Resource Section */}
                    </div>

                    <div className='flex mt-8'>
                        <div className="flex justify-start w-full ">
                                <button className="btn" onClick={handleBack}>
                                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                                Back
                                </button>
                            </div>
                            <div className="flex justify-center w-full ">
                                <button className="btn btn-success" onClick={handleSave}>
                                Save
                                </button>
                            </div>
                            <div className="flex justify-end w-full">
                                <AddDataDropdown text={"Select Data Type"} />
                            </div>
                        </div>
                    </div>
                </div>
        </PageTemplate>
    );
}
