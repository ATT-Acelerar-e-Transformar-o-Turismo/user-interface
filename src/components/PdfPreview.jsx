import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

/**
 * Renders PDF page(s) as preview images.
 * @param {string} url - URL to the PDF file
 * @param {number} pages - Number of pages to render (default 1)
 * @param {number} width - Width of each rendered page
 * @param {string} className - Additional class for the wrapper
 */
export default function PdfPreview({ url, pages = 1, width = 300, className = '' }) {
    const [numPages, setNumPages] = useState(null)
    const [error, setError] = useState(false)

    if (!url || error) return null

    return (
        <div className={`flex flex-col gap-3 items-center ${className}`}>
            <Document
                file={url}
                onLoadSuccess={({ numPages: n }) => setNumPages(n)}
                onLoadError={() => setError(true)}
                loading={
                    <div className="animate-pulse bg-gray-200 rounded-lg" style={{ width, height: width * 1.4 }} />
                }
            >
                {Array.from({ length: Math.min(pages, numPages || 1) }, (_, i) => (
                    <Page
                        key={i + 1}
                        pageNumber={i + 1}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="rounded-lg overflow-hidden shadow-sm border border-[#e5e5e5]"
                    />
                ))}
            </Document>
        </div>
    )
}

/**
 * Renders just the first page as a thumbnail (for cards).
 */
export function PdfThumbnail({ url, width = 200, className = '' }) {
    return <PdfPreview url={url} pages={1} width={width} className={className} />
}
