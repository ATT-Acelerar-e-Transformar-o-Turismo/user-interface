import { useState } from 'react';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageTemplate from './PageTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import GChart from '../components/Chart';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDomain } from '../contexts/DomainContext';
import { useResource } from '../contexts/ResourceContext';

export default function AddResource() {
    const location = useLocation();
    const { indicator: indicatorIdParam } = useParams();
    const navigate = useNavigate();
    const { indicators } = useDomain();
    const { addResource } = useResource();

    const formData = location.state?.dataToSend || 
                    indicators.find(ind => ind.id === parseInt(indicatorIdParam)) || {};

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

    const handleSave = () => {
        const newResource = {
            id: Math.floor(Math.random() * 10000 + 200),
            name: uploadedFiles.length > 0 ? uploadedFiles[0].name : "uploaded_data.csv",
            'start period': combinedRows.length > 0 ? combinedRows[0][0] : '',
            'end period': combinedRows.length > 0 ? combinedRows[combinedRows.length - 1][0] : '',
            indicator: formData.id,
            data: combinedRows,
            headers: combinedHeaders,
            edit: true,
        };
        
        addResource(newResource);
        navigate(`/resources-management/${formData.id}`);
    };

    return (
        <PageTemplate showSearchBox={false}>
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
                        <p><strong>Domain:</strong> {formData.domain || "N/A"}</p>
                        <p><strong>Subdomain:</strong> {formData.subdomain || "N/A"}</p>
                        <p><strong>Governance:</strong> {formData.governance ? "Yes" : "No"}</p>
                        <p><strong>Carrying Capacity:</strong> {formData.carrying_capacity || "N/A"}</p>
                    </div>

                    <div className="mt-6 space-y-5">

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
            </div>
        </PageTemplate>
    );
}
