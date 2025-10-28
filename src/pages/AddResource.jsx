import { useState, useEffect } from 'react';
import { faChevronLeft, faSpinner, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageTemplate from './PageTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import APIConfigForm from '../components/APIConfigForm';
import GChart from '../components/Chart';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useWrapper } from '../contexts/WrapperContext';
import indicatorService from '../services/indicatorService';
import resourceService from '../services/resourceService';

export default function AddResource() {
    const location = useLocation();
    const { indicator: indicatorIdParam, resourceId } = useParams();
    const navigate = useNavigate();
    const { uploadFile, generateWrapper, startPolling, wrappers } = useWrapper();

    const isEditMode = !!resourceId;
    const indicatorId = isEditMode ? location.state?.indicatorId : indicatorIdParam;

    const [indicator, setIndicator] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [uploadedData, setUploadedData] = useState([]);
    const [combinedHeaders, setCombinedHeaders] = useState([]);
    const [combinedRows, setCombinedRows] = useState([]);
    const [chartSeries, setChartSeries] = useState([]);
    const [wrapperStatus, setWrapperStatus] = useState(null);
    const [wrapperId, setWrapperId] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [dataType, setDataType] = useState('');
    const [apiConfig, setApiConfig] = useState(null);
    const [existingResource, setExistingResource] = useState(null);
    const [existingWrapper, setExistingWrapper] = useState(null);

    useEffect(() => {
        loadIndicator();
        if (isEditMode) {
            loadExistingResource();
        }
    }, [indicatorId, resourceId]);

    const loadIndicator = async () => {
        try {
            setLoading(true);
            const indicatorData = await indicatorService.getById(indicatorId);
            setIndicator(indicatorData);
        } catch (err) {
            setError(err.userMessage || err.message || 'Failed to load indicator');
        } finally {
            setLoading(false);
        }
    };

    const loadExistingResource = async () => {
        try {
            setLoading(true);
            const resource = await resourceService.getById(resourceId);
            setExistingResource(resource);

            if (resource.wrapper_id) {
                const wrapper = await resourceService.getWrapper(resource.wrapper_id);
                setExistingWrapper(wrapper);
                setWrapperId(wrapper.wrapper_id);
                setWrapperStatus(wrapper.status);

                if (wrapper.source_config) {
                    const sourceType = wrapper.source_config.source_type;
                    setDataType(sourceType);

                    if (sourceType === 'API') {
                        setApiConfig({
                            location: wrapper.source_config.location || '',
                            auth_type: wrapper.source_config.auth_type || 'none',
                            api_key: wrapper.source_config.api_key || '',
                            api_key_header: wrapper.source_config.api_key_header || 'X-API-Key',
                            bearer_token: wrapper.source_config.bearer_token || '',
                            username: wrapper.source_config.username || '',
                            password: wrapper.source_config.password || '',
                            rate_limit_per_minute: wrapper.source_config.rate_limit_per_minute || 60,
                            timeout_seconds: wrapper.source_config.timeout_seconds || 30,
                            retry_attempts: wrapper.source_config.retry_attempts || 3,
                            custom_headers: wrapper.source_config.custom_headers || {},
                            query_params: wrapper.source_config.query_params || {}
                        });
                    }
                }
            }
        } catch (err) {
            setError(err.userMessage || err.message || 'Failed to load resource');
        } finally {
            setLoading(false);
        }
    };

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
        if (!indicator) {
            setError('Indicator data not loaded');
            return;
        }

        if (dataType === 'API') {
            if (!apiConfig || !apiConfig.location) {
                setError('Please configure API endpoint');
                return;
            }
        } else {
            if (!uploadedFiles.length || !uploadedFiles[0]) {
                setError('Please upload at least one file');
                return;
            }
        }

        try {
            setIsGenerating(true);
            setError(null);

            let sourceConfig;

            if (dataType === 'API') {
                sourceConfig = {
                    source_type: 'API',
                    location: apiConfig.location,
                    auth_type: apiConfig.auth_type,
                    api_key: apiConfig.api_key,
                    api_key_header: apiConfig.api_key_header,
                    bearer_token: apiConfig.bearer_token,
                    username: apiConfig.username,
                    password: apiConfig.password,
                    rate_limit_per_minute: apiConfig.rate_limit_per_minute,
                    timeout_seconds: apiConfig.timeout_seconds,
                    retry_attempts: apiConfig.retry_attempts,
                    date_field: apiConfig.date_field,
                    value_field: apiConfig.value_field,
                    custom_headers: apiConfig.custom_headers,
                    query_params: apiConfig.query_params
                };
            } else {
                const fileToUpload = uploadedFiles[0];
                const uploadResponse = await uploadFile(fileToUpload);
                const fileExtension = fileToUpload.name.split('.').pop().toLowerCase();
                const sourceType = fileExtension === 'csv' ? 'CSV' : 'XLSX';

                sourceConfig = {
                    source_type: sourceType,
                    file_id: uploadResponse.file_id,
                };
            }

            const wrapperRequest = {
                metadata: {
                    name: indicator.name,
                    domain: indicator.domain?.name || indicator.domain,
                    subdomain: indicator.subdomain,
                    description: indicator.description || '',
                    unit: indicator.unit || '',
                    source: indicator.font || '',
                    scale: indicator.scale || '',
                    governance_indicator: indicator.governance || false,
                    carrying_capacity: indicator.carrying_capacity || null,
                    periodicity: indicator.periodicity || '',
                },
                source_config: sourceConfig,
                auto_create_resource: true,
            };

            const wrapper = await generateWrapper(wrapperRequest);
            setWrapperId(wrapper.wrapper_id);
            setWrapperStatus(wrapper.status);

            startPolling(wrapper.wrapper_id, 2000, (updatedWrapper) => {
                setWrapperStatus(updatedWrapper.status);

                if (updatedWrapper.status === 'completed' || updatedWrapper.status === 'executing') {
                    if (updatedWrapper.resource_id) {
                        const targetIndicatorId = indicatorId || indicatorIdParam;

                        const linkResourcePromise = isEditMode
                            ? Promise.resolve()
                            : indicatorService.addResource(targetIndicatorId, updatedWrapper.resource_id);

                        linkResourcePromise
                            .then(() => {
                                if (isEditMode && existingResource) {
                                    return indicatorService.removeResource(targetIndicatorId, existingResource.id)
                                        .then(() => resourceService.delete(existingResource.id));
                                }
                            })
                            .then(() => {
                                if (isEditMode) {
                                    return indicatorService.addResource(targetIndicatorId, updatedWrapper.resource_id);
                                }
                            })
                            .then(() => {
                                if (sourceConfig.source_type === 'API') {
                                    return indicatorService.insertFakeApiData(targetIndicatorId);
                                } else {
                                    return indicatorService.insertFakeCsvData(targetIndicatorId);
                                }
                            })
                            .then(() => {
                                navigate(`/resources-management/${targetIndicatorId}`);
                            })
                            .catch(err => {
                                setError(`Wrapper ${updatedWrapper.status} but failed to update resource: ${err.userMessage || err.message}`);
                                setIsGenerating(false);
                            });
                    } else {
                        navigate(`/resources-management/${indicatorId || indicatorIdParam}`);
                    }
                } else if (updatedWrapper.status === 'error') {
                    setError(updatedWrapper.error_message || 'Wrapper generation failed');
                    setIsGenerating(false);
                }
            });

        } catch (err) {
            setError(err.userMessage || err.message || 'Failed to generate wrapper');
            setIsGenerating(false);
        }
    };

    return (
        <PageTemplate showSearchBox={false}>
            <div className="flex justify-center ">
                <div className="p-8 rounded-lg shadow-lg w-full max-w-4xl">
                    <h1 className="text-xl font-bold text-center mb-6">
                        {isEditMode ? 'Edit Data Resource' : 'Upload Data Resource'}
                    </h1>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : indicator ? (
                        <>
                            <div className="border p-4 rounded-lg bg-gray-100">
                                <h2 className="font-bold">Indicator Metadata</h2>
                                <p><strong>Name:</strong> {indicator.name || "N/A"}</p>
                                <p><strong>Description:</strong> {indicator.description || "N/A"}</p>
                                <p><strong>Source:</strong> {indicator.font || "N/A"}</p>
                                <p><strong>Scale:</strong> {indicator.scale || "N/A"}</p>
                                <p><strong>Units:</strong> {indicator.unit || "N/A"}</p>
                                <p><strong>Periodicity:</strong> {indicator.periodicity || "N/A"}</p>
                                <p><strong>Domain:</strong> {indicator.domain?.name || indicator.domain || "N/A"}</p>
                                <p><strong>Subdomain:</strong> {indicator.subdomain || "N/A"}</p>
                                <p><strong>Governance:</strong> {indicator.governance ? "Yes" : "No"}</p>
                                <p><strong>Carrying Capacity:</strong> {indicator.carrying_capacity || "N/A"}</p>
                            </div>

                            {error && (
                                <div className="alert alert-error mt-4">
                                    <FontAwesomeIcon icon={faExclamationCircle} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {wrapperStatus && (
                                <div className={`alert mt-4 ${
                                    wrapperStatus === 'completed' ? 'alert-success' :
                                    wrapperStatus === 'error' ? 'alert-error' :
                                    'alert-info'
                                }`}>
                                    {wrapperStatus === 'pending' && (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Wrapper queued for generation...</span>
                                        </>
                                    )}
                                    {wrapperStatus === 'generating' && (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Generating AI wrapper...</span>
                                        </>
                                    )}
                                    {wrapperStatus === 'creating_resource' && (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Creating resource...</span>
                                        </>
                                    )}
                                    {wrapperStatus === 'executing' && (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin />
                                            <span>Executing wrapper...</span>
                                        </>
                                    )}
                                    {wrapperStatus === 'completed' && (
                                        <>
                                            <FontAwesomeIcon icon={faCheckCircle} />
                                            <span>Wrapper generation completed successfully!</span>
                                        </>
                                    )}
                                    {wrapperStatus === 'error' && (
                                        <>
                                            <FontAwesomeIcon icon={faExclamationCircle} />
                                            <span>Wrapper generation failed</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="alert alert-warning">
                            <span>No indicator data found</span>
                        </div>
                    )}

                    <div className="mt-6 space-y-5">

                        {dataType === 'API' ? (
                            <APIConfigForm onConfigChange={setApiConfig} />
                        ) : (
                            <>
                        {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
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

                        {/* Preview Table for combined data */}
                        {combinedRows.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="table-auto border-collapse border w-full text-sm text-left">
                                    <thead className="bg-gray-100">
                                        <tr className="border">
                                            {combinedHeaders.map((header, headerIndex) => (
                                                <th key={headerIndex} className="border p-2">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {combinedRows.slice(-10).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border">
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
                        )}

                        {/* Chart Display */}
                        {chartSeries.length > 0 && (
                            <div className="mt-6">
                                <GChart
                                    title="CSV/XLSX Data Visualization"
                                    chartId="file-chart"
                                    chartType="line"
                                    xaxisType="datetime"
                                    series={chartSeries}
                                    height={400}
                                />
                            </div>
                        )}
                            </>
                        )}
                        <div className='flex mt-8'>
                            <div className="flex justify-start w-full ">
                                <button className="btn" onClick={handleBack}>
                                <FontAwesomeIcon icon={faChevronLeft} className="mr-2" />
                                Back
                                </button>
                            </div>
                            <div className="flex justify-center w-full ">
                                <button
                                    className="btn btn-success"
                                    onClick={handleSave}
                                    disabled={isGenerating || (dataType !== 'API' && !uploadedFiles.length)}
                                >
                                    {isGenerating ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Generating Wrapper...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                            <div className="flex justify-end w-full">
                                <AddDataDropdown text={"Select Data Type"} onDataTypeSelect={setDataType} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
