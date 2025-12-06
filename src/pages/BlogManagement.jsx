import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'

export default function BlogManagement() {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [editingPost, setEditingPost] = useState(null)

    useEffect(() => {
        loadPosts()
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            setError(null)
            const allPosts = await blogService.getAllPosts(0, 50)
            setPosts(allPosts)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePost = async (postId) => {
        if (!window.confirm('Tem certeza que deseja excluir este post?')) {
            return
        }

        try {
            await blogService.deletePost(postId)
            setPosts(posts.filter(post => post.id !== postId))
        } catch (err) {
            alert('Erro ao excluir post: ' + err.message)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'published':
                return 'bg-green-100 text-green-800'
            case 'draft':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-blue-100 text-blue-800'
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'published':
                return 'Publicado'
            case 'draft':
                return 'Rascunho'
            default:
                return status
        }
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

    return (
        <PageTemplate>
            <div className="min-h-screen py-8 px-4" style={{backgroundColor: '#fffdfb'}}>
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gerar Blog
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Crie, edite e gere posts do blog
                            </p>
                        </div>
                        <Link
                            to="/admin/blog/create"
                            className="px-6 py-3 text-white font-medium rounded-lg transition-colors"
                            style={{backgroundColor: '#009367'}}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#007a5a'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#009367'}
                        >
                            Novo Post
                        </Link>
                    </div>

                    {/* Posts Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {posts.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="mx-auto w-24 h-24 mb-4">
                                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum post encontrado</h3>
                                <p className="text-gray-600 mb-6">Comece criando seu primeiro post do blog!</p>
                                <Link
                                    to="/admin/blog/create"
                                    className="inline-block px-6 py-2 text-white font-medium rounded-lg transition-colors"
                                    style={{backgroundColor: '#009367'}}
                                >
                                    Criar Primeiro Post
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Título
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Autor
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Visualizações
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Data
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {posts.map((post) => (
                                            <tr key={post.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {post.thumbnail_url && (
                                                            <div className="flex-shrink-0 h-10 w-10 mr-4">
                                                                <img
                                                                    src={blogService.getFileUrl(post.thumbnail_url)}
                                                                    alt=""
                                                                    className="h-10 w-10 rounded object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                                                {post.title}
                                                            </div>
                                                            {post.tags && Array.isArray(post.tags) && post.tags.length > 0 && (
                                                                <div className="text-xs text-gray-500">
                                                                    {post.tags.slice(0, 2).join(', ')}
                                                                    {post.tags.length > 2 && '...'}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{post.author}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                                                        {getStatusText(post.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {post.view_count}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {blogService.formatDate(post.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        {post.status === 'published' && (
                                                            <Link
                                                                to={`/blog/${post.id}`}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                Ver
                                                            </Link>
                                                        )}
                                                        <Link
                                                            to={`/admin/blog/edit/${post.id}`}
                                                            style={{color: '#009367'}}
                                                            className="hover:underline"
                                                        >
                                                            Editar
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageTemplate>
    )
}