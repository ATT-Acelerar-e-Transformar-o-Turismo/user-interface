import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import AdminPageTemplate from './AdminPageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import SuccessModal from '../components/wizard/SuccessModal'
import blogService from '../services/blogService'
import { confirmAction } from '../utils/confirm'

/**
 * Admin management list for blog posts, filtered to a single `post_type`.
 * Mounted twice via the routes:
 *   /admin/news-events   → postType="news-event"  (base path /admin/news-events)
 *   /admin/publications  → postType="publication" (base path /admin/publications)
 *
 * The create/edit links and translation namespace are driven by `basePath`
 * and `i18nNamespace` so each variant has its own URLs and copy.
 */
export default function BlogManagement({
    postType = 'news-event',
    basePath = '/admin/news-events',
    i18nNamespace = 'admin.news_events',
}) {
    const { t } = useTranslation()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successMessage, setSuccessMessage] = useState(null)

    useEffect(() => {
        loadPosts()
    }, [postType])

    const loadPosts = async () => {
        try {
            setLoading(true)
            setError(null)
            const allPosts = await blogService.getAllPosts(0, 50)
            // Backend doesn't filter by post_type yet, so do it client-side.
            // Treat missing post_type as "news-event" (the historical default).
            const filtered = (allPosts || []).filter(p =>
                (p.post_type || 'news-event') === postType
            )
            setPosts(filtered)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePost = async (postId) => {
        const ok = await confirmAction({
            title: t('common.confirm_title'),
            message: t(`${i18nNamespace}.confirm_delete`, {
                defaultValue: t('admin.blog.confirm_delete'),
            }),
        })
        if (!ok) return

        try {
            await blogService.deletePost(postId)
            setPosts(posts.filter(post => post.id !== postId))
            setSuccessMessage(t(`${i18nNamespace}.deleted_success`, {
                defaultValue: t('admin.blog.deleted_success'),
            }))
        } catch (err) {
            setError(t('admin.blog.delete_error', { error: err.message }))
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
                return t('admin.blog.status_published')
            case 'draft':
                return t('admin.blog.status_draft')
            default:
                return status
        }
    }

    // Published-post view URL: news/events live under /news-events/:id,
    // publications under /publications/:id (already routed on the public side).
    const publicViewPath = (postId) =>
        postType === 'publication' ? `/publications/${postId}` : `/news-events/${postId}`

    if (loading) {
        return (
            <AdminPageTemplate>
                <div className="py-8">
                    <LoadingSkeleton />
                </div>
            </AdminPageTemplate>
        )
    }

    if (error) {
        return (
            <AdminPageTemplate>
                <div className="py-8">
                    <ErrorDisplay error={error} />
                </div>
            </AdminPageTemplate>
        )
    }

    return (
        <AdminPageTemplate>
            <div className="min-h-screen py-8 px-4 bg-base-100">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {t(`${i18nNamespace}.title`, { defaultValue: t('admin.blog.title') })}
                            </h1>
                            <p className="text-gray-600 mt-2">
                                {t(`${i18nNamespace}.subtitle`, { defaultValue: t('admin.blog.subtitle') })}
                            </p>
                        </div>
                        <Link
                            to={`${basePath}/create`}
                            className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg transition-colors hover:bg-gray-800"
                        >
                            {t(`${i18nNamespace}.new_post`, { defaultValue: t('admin.blog.new_post') })}
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
                                <h3 className="text-xl font-medium text-gray-900 mb-2">
                                    {t(`${i18nNamespace}.empty_title`, { defaultValue: t('admin.blog.empty_title') })}
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    {t(`${i18nNamespace}.empty_subtitle`, { defaultValue: t('admin.blog.empty_subtitle') })}
                                </p>
                                <Link
                                    to={`${basePath}/create`}
                                    className="inline-block px-6 py-2 bg-gray-900 text-white font-medium rounded-lg transition-colors hover:bg-gray-800"
                                >
                                    {t(`${i18nNamespace}.create_first`, { defaultValue: t('admin.blog.create_first') })}
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_title')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_author')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_status')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_views')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_date')}
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('admin.blog.col_actions')}
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
                                                                to={publicViewPath(post.id)}
                                                                className="text-blue-600 hover:text-blue-900"
                                                            >
                                                                {t('admin.blog.action_view')}
                                                            </Link>
                                                        )}
                                                        <Link
                                                            to={`${basePath}/edit/${post.id}`}
                                                            className="text-primary hover:text-primary/80 hover:underline"
                                                        >
                                                            {t('common.edit')}
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            {t('common.delete')}
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
            <SuccessModal
                isOpen={!!successMessage}
                onClose={() => setSuccessMessage(null)}
                title={t('common.success')}
                message={successMessage}
                primaryAction={{ label: t('common.continue'), onClick: () => setSuccessMessage(null) }}
            />
        </AdminPageTemplate>
    )
}

BlogManagement.propTypes = {
    postType: PropTypes.oneOf(['news-event', 'publication']),
    basePath: PropTypes.string,
    i18nNamespace: PropTypes.string,
}
