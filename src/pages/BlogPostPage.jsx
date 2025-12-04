import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import hljs from 'highlight.js'
import parse from 'html-react-parser'
import BlogIndicatorWidget from '../components/BlogIndicatorWidget'

export default function BlogPostPage() {
    const { postId } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadPost()
    }, [postId])

    useEffect(() => {
        if (post && post.content) {
            // Apply syntax highlighting to code blocks
            // We need a small delay because html-react-parser renders asynchronously in effect? 
            // actually no, it renders in the flow. But useEffect runs after render.
            // So this should still work for standard PRE blocks.
            // For custom components, they are React components.
            document.querySelectorAll('.blog-content pre code').forEach((block) => {
                hljs.highlightElement(block)
            })
        }
    }, [post])

    const loadPost = async () => {
        try {
            setLoading(true)
            setError(null)

            const postData = await blogService.getPost(postId)
            setPost(postData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const parseOptions = {
        replace: (domNode) => {
            if (domNode.name === 'blog-indicator') {
                const { id, type } = domNode.attribs;
                return <BlogIndicatorWidget indicatorId={id} vizType={type} />;
            }
            // Handle new format with div elements
            if (domNode.name === 'div' && domNode.attribs?.class === 'blog-indicator-preview') {
                const { id, type } = domNode.attribs;
                const indicatorId = id || domNode.attribs['data-indicator-id'];
                const vizType = type || 'line';
                return <BlogIndicatorWidget indicatorId={indicatorId} vizType={vizType} />;
            }
        }
    };

    const handleDownload = (attachment) => {
        const link = document.createElement('a')
        link.href = blogService.getFileUrl(attachment.url)
        link.download = attachment.original_filename || attachment.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const getFileIcon = (mimeType) => {
        if (mimeType.startsWith('image/')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )
        } else if (mimeType.includes('pdf')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
            )
        } else if (mimeType.includes('word') || mimeType.includes('document')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m8 21 4-7 4 7M3 7l5 8m6-8l5 8" />
                </svg>
            )
        }
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        )
    }

    if (loading) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </PageTemplate>
        )
    }

    if (error) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </PageTemplate>
        )
    }

    if (!post) {
        return (
            <PageTemplate>
                <div className="min-h-screen py-8 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Post não encontrado</h1>
                        <Link
                            to="/blog"
                            className="text-white px-6 py-2 rounded-full transition-colors"
                            style={{backgroundColor: '#009367'}}
                        >
                            Voltar para o Blog
                        </Link>
                    </div>
                </div>
            </PageTemplate>
        )
    }

    return (
        <PageTemplate>
            <div className="min-h-screen py-8" style={{backgroundColor: '#fffdfb'}}>
                <div className="max-w-4xl mx-auto px-4">
                    {/* Breadcrumb */}
                    <nav className="mb-8">
                        <Link
                            to="/blog"
                            className="inline-flex items-center text-sm transition-colors"
                            style={{color: '#009367'}}
                            onMouseEnter={(e) => e.target.style.color = '#007a5a'}
                            onMouseLeave={(e) => e.target.style.color = '#009367'}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Voltar ao Blog
                        </Link>
                    </nav>

                    {/* Article Header */}
                    <header className="mb-8">
                        <div className="mb-4">
                            <div className="flex items-center gap-2 text-sm mb-4" style={{color: '#084d91'}}>
                                <span>{blogService.formatDate(post.published_at || post.created_at)}</span>
                                <span>•</span>
                                <span>Por {post.author}</span>
                                {post.view_count > 0 && (
                                    <>
                                        <span>•</span>
                                        <span>{post.view_count} visualizações</span>
                                    </>
                                )}
                            </div>

                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                {post.title}
                            </h1>

                            {post.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {post.tags.map((tag, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 text-sm font-medium rounded-full"
                                            style={{backgroundColor: '#e8f5e8', color: '#009367'}}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {post.thumbnail_url && (
                            <div className="aspect-video overflow-hidden rounded-lg mb-8">
                                <img
                                    src={blogService.getFileUrl(post.thumbnail_url)}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </header>

                    {/* Article Content */}
                    <article className="prose prose-lg max-w-none mb-12">
                        <div className="text-gray-800 leading-relaxed blog-content">
                            {parse(post.content, parseOptions)}
                        </div>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                                .blog-content h1 { font-size: 2.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.2; color: #111827; }
                                .blog-content h2 { font-size: 1.875rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.3; color: #1f2937; }
                                .blog-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; line-height: 1.4; color: #374151; }
                                .blog-content h4 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; line-height: 1.4; color: #374151; }
                                .blog-content p { margin-bottom: 1.25rem; }
                                .blog-content ul { list-style-type: disc; padding-left: 1.625rem; margin-bottom: 1.25rem; }
                                .blog-content ol { list-style-type: decimal; padding-left: 1.625rem; margin-bottom: 1.25rem; }
                                .blog-content li { margin-bottom: 0.5rem; }
                                .blog-content blockquote { border-left: 4px solid #009367; padding-left: 1rem; font-style: italic; color: #4b5563; margin: 1.5rem 0; background-color: #f9fafb; padding: 1rem; border-radius: 0.375rem; }
                                .blog-content a { color: #009367; text-decoration: underline; font-weight: 500; }
                                .blog-content a:hover { color: #007a5a; }
                                .blog-content strong { font-weight: 700; color: #111827; }
                                .blog-content em { font-style: italic; }
                                .blog-content img { max-width: 100%; height: auto; border-radius: 0.5rem; margin: 1.5rem 0; }
                                .blog-content hr { border-color: #e5e7eb; margin: 2rem 0; }
                                .blog-content pre { background: #0d0d0d; color: #fff; font-family: monospace; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 1.5rem 0; overflow-x: auto; }
                                .blog-content pre code { color: inherit; padding: 0; background: none; font-size: 0.875rem; }
                                
                                /* Highlight.js styles */
                                .hljs-comment, .hljs-quote { color: #5c6370; font-style: italic; }
                                .hljs-doctag, .hljs-keyword, .hljs-formula { color: #c678dd; }
                                .hljs-section, .hljs-name, .hljs-selector-tag, .hljs-deletion, .hljs-subst { color: #e06c75; }
                                .hljs-literal { color: #56b6c2; }
                                .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #98c379; }
                                .hljs-built_in, .hljs-class .hljs-title { color: #e6c07b; }
                                .hljs-attr, .hljs-variable, .hljs-template-variable, .hljs-type, .hljs-selector-class, .hljs-selector-attr, .hljs-selector-pseudo, .hljs-number { color: #d19a66; }
                                .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-meta, .hljs-selector-id, .hljs-title { color: #61aeee; }
                                .hljs-emphasis { font-style: italic; }
                                .hljs-strong { font-weight: bold; }
                                .hljs-link { text-decoration: underline; }
                            `
                        }} />
                    </article>

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                        <section className="border-t border-gray-200 pt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Arquivos Anexos
                            </h2>
                            <div className="max-w-3xl">
                                <div className="grid grid-cols-1 gap-4">
                                    {post.attachments.map((attachment, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer hover:border-green-200"
                                            onClick={() => handleDownload(attachment)}
                                            style={{backgroundColor: '#fafffe'}}
                                        >
                                            <div className="flex-shrink-0 p-3 rounded-lg" style={{backgroundColor: '#e8f5e8', color: '#009367'}}>
                                                {getFileIcon(attachment.mime_type)}
                                            </div>
                                            <div className="ml-6 flex-1">
                                                <p className="text-base font-semibold text-gray-900 mb-1">
                                                    {attachment.original_filename || attachment.filename}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {formatFileSize(attachment.size)} • Clique para baixar
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 ml-4">
                                                <div className="p-2 rounded-full transition-colors" style={{backgroundColor: '#f0fdf4'}}>
                                                    <svg className="w-5 h-5" style={{color: '#009367'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </PageTemplate>
    )
}