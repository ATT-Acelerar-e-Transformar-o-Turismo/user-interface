import * as XLSX from 'xlsx';

// Mapping of indicator IDs to Excel file names
const indicatorFileMapping = {
    70: 'Indicator_39_20250602021534.xlsx',
    71: 'Indicator_34_20250602021844.xlsx', 
    72: 'Indicator_38_20250602021918.xlsx',
    2000: 'Indicator_127_20250602024745.xlsx', // Monthly Precipitation
    2900: 'Indicator_27_20250602025302.xlsx'   // Occupancy Rate
};

export const loadIndicatorData = async (indicatorId) => {
    try {
        const fileName = indicatorFileMapping[indicatorId];
        if (!fileName) {
            console.warn(`No Excel file found for indicator ${indicatorId}`);
            return null;
        }

        // Load the Excel file from public folder
        const response = await fetch(`/${fileName}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        
        // Use the 3rd sheet (index 2) like in AddResource.jsx
        const sheetName = workbook.SheetNames[2];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        return processFileData(sheetData);
    } catch (error) {
        console.error(`Error loading indicator data for ID ${indicatorId}:`, error);
        return null;
    }
};

const processFileData = (data) => {
    if (!data || !data.length) return null;

    const headers = data[0];
    const rows = data.slice(1);

    // Filter out empty rows where either 'x' or 'y' values are missing
    const validRows = rows.filter(row => {
        const xValue = row[0];
        const yValue = row[1];
        return xValue && yValue !== undefined && yValue !== null;
    });

    if (!validRows.length) return null;

    const chartSeries = buildChartSeries(headers, validRows);
    return { series: chartSeries, headers, rows: validRows };
};

const buildChartSeries = (headers, rows) => {
    if (!headers || headers.length <= 1) return [];

    return headers.slice(1).map((colName, index) => ({
        name: colName,
        data: rows.map((row) => {
            const xValue = row[0];
            let formattedX;
            
            // Handle year formatting - keep as simple numeric value
            if (typeof xValue === 'number') {
                formattedX = xValue;
            } else if (typeof xValue === 'string' && /^\d{4}$/.test(xValue)) {
                // If it's a year string, convert to number
                formattedX = parseInt(xValue);
            } else {
                // Try to parse as number or use original value
                formattedX = parseFloat(xValue) || xValue;
            }
            
            return {
                x: formattedX,
                y: parseFloat(row[index + 1]) || null,
            };
        })
    }));
};

// Get chart type based on indicator ID
export const getChartTypeForIndicator = (indicatorId) => {
    const chartTypes = ['line', 'bar', 'area', 'scatter'];
    // Cycle through chart types based on indicator ID
    return chartTypes[indicatorId % 4];
};

// Load multiple indicators for side-by-side display
export const loadMultipleIndicatorData = async (indicatorIds) => {
    try {
        const dataPromises = indicatorIds.map(id => loadIndicatorData(id));
        const results = await Promise.all(dataPromises);
        
        return results.filter(result => result !== null);
    } catch (error) {
        console.error('Error loading multiple indicator data:', error);
        return [];
    }
};

// Fallback sample data for indicators without Excel files
export const getSampleData = () => {
    return {
        series: [{
            name: 'Sample Data',
            data: [
                { x: 2019, y: 10 },
                { x: 2020, y: 15 },
                { x: 2021, y: 12 },
                { x: 2022, y: 18 },
                { x: 2023, y: 14 }
            ]
        }]
    };
}; 