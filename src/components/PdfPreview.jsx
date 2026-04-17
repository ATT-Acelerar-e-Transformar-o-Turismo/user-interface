import { useState, useEffect, useRef } from 'react'
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

/**
 * Renders PDF pages filling the container width — use on desktop publication view.
 */
export function PdfFillPreview({ url, pages = 2, className = '' }) {
    const [containerWidth, setContainerWidth] = useState(null)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(entries => {
            setContainerWidth(Math.floor(entries[0].contentRect.width))
        })
        observer.observe(containerRef.current)
        setContainerWidth(Math.floor(containerRef.current.getBoundingClientRect().width))
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={containerRef} className={`w-full ${className}`}>
            {containerWidth ? (
                <PdfPreview url={url} pages={pages} width={containerWidth} />
            ) : (
                <div className="animate-pulse bg-gray-200 rounded-lg w-full h-[500px]" />
            )}
        </div>
    )
}

/**
 * Renders the first PDF page filling its container width (clip height via overflow-hidden on parent).
 * Use when you want the PDF to behave like a cover image on a card.
 */
export function PdfCardFill({ url, className = '' }) {
    const [containerWidth, setContainerWidth] = useState(null)
    const [error, setError] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        if (!containerRef.current) return
        const observer = new ResizeObserver(entries => {
            setContainerWidth(Math.floor(entries[0].contentRect.width))
        })
        observer.observe(containerRef.current)
        setContainerWidth(Math.floor(containerRef.current.getBoundingClientRect().width))
        return () => observer.disconnect()
    }, [])

    if (!url || error) return null

    return (
        <div ref={containerRef} className={`w-full h-full overflow-hidden ${className}`}>
            {containerWidth ? (
                <Document
                    file={url}
                    onLoadError={() => setError(true)}
                    loading={<div className="animate-pulse bg-gray-200 w-full h-full" />}
                >
                    <Page
                        pageNumber={1}
                        width={containerWidth}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            ) : (
                <div className="w-full h-full animate-pulse bg-gray-200" />
            )}
        </div>
    )
}
