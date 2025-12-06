import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'

export default function BlogPage() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const limit = 6

    useEffect(() => {
        loadPosts()
    }, [currentPage])

    const loadPosts = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await blogService.getPublishedPosts(currentPage * limit, limit)

            // Handle both array response and object with posts array
            const newPosts = Array.isArray(response) ? response : (response?.posts || [])

            if (currentPage === 0) {
                setPosts(newPosts)
            } else {
                setPosts(prevPosts => [...prevPosts, ...newPosts])
            }

            setHasMore(newPosts.length === limit)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const loadMore = () => {
        setCurrentPage(prev => prev + 1)
    }

    const renderPostCard = (post) => (
        <article
            key={post.id}
            className="bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 group"
            style={{
                boxShadow: '0 8px 32px hsla(from var(--color-primary) h s l / 0.08)',
                minHeight: '400px'
            }}
        >
            {/* Image Section */}
            {post.thumbnail_url ? (
                <Link to={`/blog/${post.id}`} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                    <img
                        src={blogService.getFileUrl(post.thumbnail_url)}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </Link>
            ) : (
                <Link to={`/blog/${post.id}`} className="block aspect-[16/9] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </Link>
            )}

            {/* Content Section */}
            <div className="p-8">
                {/* Metadata */}
                <div className="mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                        <time className="text-sm font-medium text-primary">
                            {blogService.formatDate(post.published_at || post.created_at)}
                        </time>
                        {post.view_count > 0 && (
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {post.view_count}
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-gray-500">
                        <span>Por {post.author}</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold mb-4 leading-tight">
                    <Link
                        to={`/blog/${post.id}`}
                        className="text-gray-900 hover:text-primary transition-colors duration-200 line-clamp-2"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '3rem'
                        }}
                    >
                        {post.title}
                    </Link>
                </h2>

                {/* Excerpt */}
                <div className="mb-6">
                    {post.excerpt ? (
                        <p
                            className="text-gray-600 leading-relaxed text-sm"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: '3.75rem'
                            }}
                        >
                            {post.excerpt}
                        </p>
                    ) : (
                        <div style={{minHeight: '3.75rem'}} />
                    )}
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6 min-h-[2rem]">
                        {post.tags.slice(0, 2).map((tag, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap"
                                style={{
                                    backgroundColor: 'var(--color-base-200)',
                                    color: 'var(--color-primary)',
                                    borderColor: 'var(--color-base-300)'
                                }}
                            >
                                {tag.length > 12 ? `${tag.substring(0, 12)}...` : tag}
                            </span>
                        ))}
                        {post.tags.length > 2 && (
                            <span className="px-3 py-1 text-xs font-medium text-gray-400 whitespace-nowrap">
                                +{post.tags.length - 2}
                            </span>
                        )}
                    </div>
                )}

                {/* CTA Button */}
                <div className="pt-4 border-t border-gray-50">
                    <Link
                        to={`/blog/${post.id}`}
                        className="inline-flex items-center font-semibold text-sm transition-all duration-200 group-hover:translate-x-1 text-primary hover:text-primary-content"
                    >
                        Ler artigo completo
                        <svg
                            className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </article>
    )

    if (loading && posts.length === 0) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </PageTemplate>
        )
    }

    if (error && posts.length === 0) {
        return (
            <PageTemplate>
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </PageTemplate>
        )
    }

    return (
        <PageTemplate>
            <div className="min-h-screen py-8 px-4 bg-base-100">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Blog
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Insights, análises e novidades sobre sustentabilidade e indicadores
                        </p>
                    </div>

                    {/* Blog Posts Grid */}
                    {posts.length === 0 && !loading ? (
                        <div className="text-center py-12">
                            <div className="mx-auto w-24 h-24 mb-4">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
                            <p className="text-gray-600">Volte em breve para conferir nossos novos conteúdos!</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map(renderPostCard)}
                            </div>

                            {/* Load More Button */}
                            {hasMore && (
                                <div className="text-center mt-12">
                                    <button
                                        onClick={loadMore}
                                        disabled={loading}
                                        className="px-8 py-3 bg-primary text-primary-content font-medium rounded-full transition-colors disabled:opacity-50 hover:bg-primary/90"
                                    >
                                        {loading ? 'Carregando...' : 'Carregar Mais'}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PageTemplate>
    )
}