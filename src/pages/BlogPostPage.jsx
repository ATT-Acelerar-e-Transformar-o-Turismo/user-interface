import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'

export default function BlogPostPage() {
    const { postId } = useParams()
    const [post, setPost] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadPost()
    }, [postId])

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

                            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
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
                        <div
                            className="text-gray-800 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />
                    </article>

                    {/* Attachments */}
                    {post.attachments && post.attachments.length > 0 && (
                        <section className="border-t border-gray-200 pt-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                Arquivos Anexos
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {post.attachments.map((attachment, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleDownload(attachment)}
                                    >
                                        <div className="flex-shrink-0 p-2 rounded" style={{backgroundColor: '#e8f5e8', color: '#009367'}}>
                                            {getFileIcon(attachment.mime_type)}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {attachment.original_filename || attachment.filename}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatFileSize(attachment.size)}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </PageTemplate>
    )
}