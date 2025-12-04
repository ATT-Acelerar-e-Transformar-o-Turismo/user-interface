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

            const newPosts = await blogService.getPublishedPosts(currentPage * limit, limit)

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
        <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {post.thumbnail_url && (
                <div className="aspect-video overflow-hidden">
                    <img
                        src={blogService.getFileUrl(post.thumbnail_url)}
                        alt={post.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                </div>
            )}
            <div className="p-6">
                <div className="flex items-center gap-2 text-sm mb-3" style={{color: '#084d91'}}>
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

                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                </h2>

                {post.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                    </p>
                )}

                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 text-xs font-medium rounded-full"
                                style={{backgroundColor: '#fffdfb', color: '#009367'}}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <Link
                    to={`/blog/${post.id}`}
                    className="inline-flex items-center font-medium transition-colors"
                    style={{color: '#009367'}}
                    onMouseEnter={(e) => e.target.style.color = '#007a5a'}
                    onMouseLeave={(e) => e.target.style.color = '#009367'}
                >
                    Ler mais
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
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
            <div className="min-h-screen py-8 px-4" style={{backgroundColor: '#fffdfb'}}>
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Blog
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Insights, análises e novidades sobre sustentabilidade e indicadores ambientais
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
                                        className="px-8 py-3 text-white font-medium rounded-full transition-colors disabled:opacity-50"
                                        style={{backgroundColor: '#009367'}}
                                        onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#007a5a')}
                                        onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#009367')}
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