import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

const LineChartIcon = ({ size }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21H6.2C5.07989 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V3M7 15L12 9L16 13L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}

const ColumnChartIcon = ({ size }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 10V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M16 7V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M8 14L8 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M4 5V19C4 19.5523 4.44772 20 5 20H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
    )
}

const BarChartIcon = ({ size }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(90) matrix(-1, 0, 0, 1, 0, 0)">
            <path d="M21 21H6.2C5.07989 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V3M7 10.5V17.5M11.5 5.5V17.5M16 10.5V17.5M20.5 5.5V17.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
            </path>
        </svg>
    )
}

const ScatterChartIcon = ({ size }) => {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V3M9.5 8.5H9.51M19.5 7.5H19.51M14.5 12.5H14.51M8.5 15.5H8.51M18.5 15.5H18.51"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
            </path>
        </svg>
    )
}

const Views = ({ size, activeView, onViewChange }) => {
    const [iconSize, setIconSize] = useState('24px') // Initialize with a proper pixel value
    const [buttonClasses, setButtonClasses] = useState({
        line: '',
        column: '',
        bar: '',
        scatter: ''
    })

    useEffect(() => {
        const sizes = {
            'xs': 16,
            'sm': 24,
            'md': 28,
            'lg': 32,
            'xl': 36
        }
        const pixelSize = sizes[size] || 24; // Default to 24px if size is not found
        setIconSize(pixelSize + 'px')
    }, [size])

    useEffect(() => {
        const baseClass = `btn btn-neutral p-1 aspect-square ${size ? `btn-${size}` : ''}`

        setButtonClasses({
            line: `${baseClass} ${activeView === 'line' ? '' : 'btn-outline'}`,
            column: `${baseClass} ${activeView === 'column' ? '' : 'btn-outline'}`,
            bar: `${baseClass} ${activeView === 'bar' ? '' : 'btn-outline'}`,
            scatter: `${baseClass} ${activeView === 'scatter' ? '' : 'btn-outline'}`
        })
    }, [activeView, size])

    return (
        <>
            <div
                className={buttonClasses.line}
                onClick={() => onViewChange('line')}
            >
                <LineChartIcon size={iconSize} />
            </div>
            <div
                className={buttonClasses.column}
                onClick={() => onViewChange('column')}
            >
                <ColumnChartIcon size={iconSize} />
            </div>
            <div
                className={buttonClasses.bar}
                onClick={() => onViewChange('bar')}
            >
                <BarChartIcon size={iconSize} />
            </div>
            <div
                className={buttonClasses.scatter}
                onClick={() => onViewChange('scatter')}
            >
                <ScatterChartIcon size={iconSize} />
            </div>
        </>
    )
}

// PropTypes for icon components
LineChartIcon.propTypes = { size: PropTypes.string };
ColumnChartIcon.propTypes = { size: PropTypes.string };
BarChartIcon.propTypes = { size: PropTypes.string };
ScatterChartIcon.propTypes = { size: PropTypes.string };

Views.propTypes = {
  size: PropTypes.string,
  activeView: PropTypes.string,
  onViewChange: PropTypes.func.isRequired,
};

export default Views
