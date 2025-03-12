import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import PageTemplate from './PageTemplate';
import AddDataDropdown from '../components/AddDataDropdown';
import GChart from '../components/chart';

export default function AddResource() {
    const [fileData, setFileData] = useState([]);
    const [chartSeries, setChartSeries] = useState([]);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'csv') {
            parseCSV(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            parseXLSX(file);
        } else {
            alert('Unsupported file format. Please upload a CSV or Excel file.');
        }
    };

    // Parse CSV Files
    const parseCSV = (file) => {
        Papa.parse(file, {
            complete: (result) => {
                processFileData(result.data);
            },
            header: false,
            skipEmptyLines: true
        });
    };

    // Parse XLSX Files
    const parseXLSX = (file) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
            const sheetName = workbook.SheetNames[0]; // Read first sheet
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            processFileData(sheetData);
        };
        reader.readAsArrayBuffer(file);
    };

    // Process Data into Table & Chart Format
    const processFileData = (data) => {
        if (!data.length) return;

        const headers = data[0];
        const rows = data.slice(1).filter(row => row.length === headers.length);
        setFileData(rows);

        // Generate chart data
        const series = headers.slice(1).map((name, index) => ({
            name: name,
            data: rows.map(row => ({
                x: row[0],  // First column as x-axis
                y: parseFloat(row[index + 1]) || 0  // Convert to number
            }))
        }));

        setChartSeries(series);
    };

    return (
        <PageTemplate>
            <div className="flex justify-center min-h-screen">
                <div className="p-8 rounded-lg shadow-lg w-full max-w-4xl">
                    <h1 className="text-xl font-bold text-center mb-6">Upload CSV/XLSX</h1>

                    {/* File Upload */}
                    <div className="space-y-5">
                        <div>
                            <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                                Upload a File
                            </label>
                            <input 
                                type="file" 
                                accept=".csv,.xlsx,.xls" 
                                onChange={handleFileUpload} 
                                className="file-input border p-2 rounded-lg w-full"
                            />
                        </div>
                        
                        {/* Preview Table */}
                        {fileData.length > 0 && (
                            <div className="overflow-x-auto">
                                <table className="table-auto border-collapse border w-full text-sm text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            {fileData[0].map((header, index) => (
                                                <th key={index} className="border p-2">{header}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {fileData.slice(1).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="border">
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="border p-2">{cell}</td>
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
                                    xaxisType="category"
                                    series={chartSeries}
                                    height={400}
                                />
                            </div>
                        )}

                        <div className="flex justify-end w-full mt-4">                    
                            <AddDataDropdown />
                        </div>
                    </div>
                </div>
            </div>
        </PageTemplate>
    );
}
