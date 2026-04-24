import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PropTypes from 'prop-types'
import AdminPageTemplate from './AdminPageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import SuccessModal from '../components/wizard/SuccessModal'
import blogService from '../services/blogService'
import { PdfCardFill } from '../components/PdfPreview'
import { confirmAction } from '../utils/confirm'
import { ptCompare } from '../utils/sort'

const DOC_RE = /\.(pdf|doc|docx|xlsx|txt|csv)$/i
const firstDocAttachment = (post) =>
    Array.isArray(post?.attachments)
        ? post.attachments.find(a => DOC_RE.test(a?.filename || a?.original_filename || a?.url || ''))
        : null

function PostThumb({ post }) {
    const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
    const doc = firstDocAttachment(post)
    const docUrl = doc ? blogService.getFileUrl(doc.url || `/attachments/${doc.filename}`) : null
    const isPdf = doc && /\.pdf$/i.test(doc.filename || doc.url || '')

    return (
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-[#f3f4f6] border border-[#e5e5e5] shrink-0 flex items-center justify-center">
            {thumb ? (
                <img src={thumb} alt="" className="w-full h-full object-cover" />
            ) : isPdf && docUrl ? (
                <PdfCardFill url={docUrl} />
            ) : doc ? (
                <svg className="w-6 h-6 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ) : (
                <svg className="w-6 h-6 text-[#d4d4d4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            )}
        </div>
    )
}

const PAGE_SIZE = 10

/**
 * Admin management list for blog posts, filtered to a single `post_type`.
 * Layout and visual language follow the ROOTS admin Figma design (node
 * 2544:10214): heading + right-side pill actions ("Rascunhos" / "New"),
 * a filter bar (sort / category / search) and a white rounded card with
 * Title | Status | Author | Date | Options columns + pagination.
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

    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState('created_desc')
    const [statusFilter, setStatusFilter] = useState('all') // all | published | draft
    const [showDraftsOnly, setShowDraftsOnly] = useState(false)
    const [page, setPage] = useState(1)

    useEffect(() => {
        loadPosts()
    }, [postType])

    const loadPosts = async () => {
        try {
            setLoading(true)
            setError(null)
            // Backend caps limit at 50; paginate until a short page arrives.
            const pageSize = 50
            const maxPages = 20 // hard safety stop (1000 posts)
            const collected = []
            for (let i = 0; i < maxPages; i++) {
                const batch = await blogService.getAllPosts(i * pageSize, pageSize)
                if (!Array.isArray(batch) || batch.length === 0) break
                collected.push(...batch)
                if (batch.length < pageSize) break
            }
            const filtered = collected.filter(p =>
                (p.post_type || 'news-event') === postType
            )
            setPosts(filtered)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePost = async (postId, postTitle) => {
        const ok = await confirmAction({
            title: t('common.confirm_title'),
            message: t(`${i18nNamespace}.confirm_delete`, {
                name: postTitle,
                defaultValue: t('admin.blog.confirm_delete'),
            }),
        })
        if (!ok) return
        try {
            await blogService.deletePost(postId)
            // Functional update so fast consecutive deletes or an in-flight
            // reload can't clobber each other.
            setPosts(prev => prev.filter(p => p.id !== postId))
            setSuccessMessage(t(`${i18nNamespace}.deleted_success`, {
                defaultValue: t('admin.blog.deleted_success'),
            }))
        } catch (err) {
            setError(t('admin.blog.delete_error', { error: err.message }))
        }
    }

    const visiblePosts = useMemo(() => {
        let list = [...posts]
        if (showDraftsOnly) list = list.filter(p => p.status === 'draft')
        else if (statusFilter !== 'all') list = list.filter(p => p.status === statusFilter)
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase()
            list = list.filter(p =>
                (p.title || '').toLowerCase().includes(q) ||
                (p.author || '').toLowerCase().includes(q),
            )
        }
        list.sort((a, b) => {
            switch (sortBy) {
                case 'title_asc':
                    return ptCompare(a.title, b.title)
                case 'title_desc':
                    return ptCompare(b.title, a.title)
                case 'created_asc':
                    return new Date(a.created_at) - new Date(b.created_at)
                case 'created_desc':
                default:
                    return new Date(b.created_at) - new Date(a.created_at)
            }
        })
        return list
    }, [posts, searchQuery, sortBy, statusFilter, showDraftsOnly])

    const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE))
    const pagePosts = visiblePosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    useEffect(() => {
        if (page > totalPages) setPage(totalPages)
    }, [page, totalPages])

    const statusLabel = (status) => {
        switch (status) {
            case 'published': return t('admin.blog.status_published')
            case 'draft': return t('admin.blog.status_draft')
            default: return status
        }
    }

    const publicViewPath = (postId) =>
        postType === 'publication' ? `/publications/${postId}` : `/news-events/${postId}`

    const pillBase =
        'inline-flex items-center gap-2 h-10 px-4 rounded-full border transition-colors font-[\'Onest\'] font-medium text-[17px] text-[#0a0a0a] whitespace-nowrap cursor-pointer shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]'
    const pillOutline = `${pillBase} bg-white border-[#d4d4d4] hover:bg-gray-50`
    const pillOutlineActive = `${pillBase} bg-[#009368]/10 border-[#009368] text-[#009368]`

    if (loading) {
        return (
            <AdminPageTemplate>
                <div className="py-8 px-4 md:px-12"><LoadingSkeleton /></div>
            </AdminPageTemplate>
        )
    }
    if (error) {
        return (
            <AdminPageTemplate>
                <div className="py-8 px-4 md:px-12"><ErrorDisplay error={error} /></div>
            </AdminPageTemplate>
        )
    }

    return (
        <AdminPageTemplate>
            <div className="min-h-screen bg-[#f3f4f6] px-4 md:px-12 pb-12 pt-8">
                <div className="max-w-[1416px] mx-auto flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h1 className="font-['Onest'] font-semibold text-[32px] leading-none tracking-[-0.32px] text-[#0a0a0a]">
                            {t(`${i18nNamespace}.title`, { defaultValue: t('admin.blog.title') })}
                        </h1>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setShowDraftsOnly(v => !v)}
                                className={showDraftsOnly ? pillOutlineActive : pillOutline}
                                aria-pressed={showDraftsOnly}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                {t(`${i18nNamespace}.drafts`, { defaultValue: 'Rascunhos' })}
                            </button>
                            <Link
                                to={`${basePath}/create`}
                                className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#009368] hover:bg-[#007d57] text-white font-['Onest'] font-medium text-[17px] whitespace-nowrap transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                {t(`${i18nNamespace}.new_post`, { defaultValue: t('admin.blog.new_post') })}
                            </Link>
                        </div>
                    </div>

                    {/* Filter / sort / search bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`${pillOutline} pr-9 appearance-none`}
                                    aria-label={t('admin.blog.sort_by', 'Ordenar por')}
                                >
                                    <option value="created_desc">{t('admin.blog.sort_newest', 'Mais recentes')}</option>
                                    <option value="created_asc">{t('admin.blog.sort_oldest', 'Mais antigos')}</option>
                                    <option value="title_asc">{t('admin.blog.sort_title_asc', 'Título A→Z')}</option>
                                    <option value="title_desc">{t('admin.blog.sort_title_desc', 'Título Z→A')}</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className={`${pillOutline} pr-9 appearance-none`}
                                    aria-label={t('admin.blog.col_status', 'Estado')}
                                    disabled={showDraftsOnly}
                                >
                                    <option value="all">{t('admin.blog.filter_all', 'Todas')}</option>
                                    <option value="published">{t('admin.blog.status_published')}</option>
                                    <option value="draft">{t('admin.blog.status_draft')}</option>
                                </select>
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                        <div className="relative w-full sm:w-[388px]">
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                                placeholder={t(`${i18nNamespace}.search_placeholder`, { defaultValue: t('admin.blog.search_placeholder', 'Pesquisar') })}
                                className="w-full h-11 pl-4 pr-10 rounded-full border border-[#e5e5e5] bg-[#fffefc] font-['Onest'] text-[15px] text-[#0a0a0a] placeholder:text-[#737373] focus:outline-none focus:border-[#009368] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                            />
                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
                        </div>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-2xl shadow-[0px_0px_3px_2px_rgba(0,0,0,0.05)] p-8">
                        {pagePosts.length === 0 ? (
                            <div className="text-center py-12 text-[#737373] font-['Onest']">
                                {t(`${i18nNamespace}.empty_title`, { defaultValue: t('admin.blog.empty_title') })}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left">
                                            <th className="pb-4 pr-6 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a]">{t('admin.blog.col_title')}</th>
                                            <th className="pb-4 px-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a] text-center">{t('admin.blog.col_status')}</th>
                                            <th className="pb-4 px-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a] text-center">{t('admin.blog.col_author')}</th>
                                            <th className="pb-4 px-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a] text-center">{t('admin.blog.col_date')}</th>
                                            <th className="pb-4 pl-4 font-['Onest'] font-semibold text-[24px] tracking-[-0.48px] text-[#0a0a0a] text-center">{t('admin.blog.col_actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagePosts.map(post => (
                                            <tr key={post.id} className="align-middle">
                                                <td className="py-3 pr-6 font-['Onest'] font-medium text-[18px] text-[#0a0a0a]">
                                                    <Link to={`${basePath}/edit/${post.id}`} className="flex items-center gap-3 hover:underline">
                                                        <PostThumb post={post} />
                                                        <span>{post.title}</span>
                                                    </Link>
                                                </td>
                                                <td className="py-3 px-4 font-['Onest'] font-medium text-[18px] text-[#0a0a0a] text-center">
                                                    {statusLabel(post.status)}
                                                </td>
                                                <td className="py-3 px-4 font-['Onest'] font-medium text-[18px] text-[#0a0a0a] text-center">
                                                    {post.author}
                                                </td>
                                                <td className="py-3 px-4 font-['Onest'] font-medium text-[18px] text-[#0a0a0a] text-center">
                                                    {blogService.formatDate(post.created_at)}
                                                </td>
                                                <td className="py-3 pl-4">
                                                    <div className="flex items-center justify-center gap-4">
                                                        {post.status === 'published' && (
                                                            <Link to={publicViewPath(post.id)} className="text-[#0a0a0a] hover:text-[#009368]" aria-label={t('admin.blog.action_view')}>
                                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </Link>
                                                        )}
                                                        <Link to={`${basePath}/edit/${post.id}`} className="text-[#0a0a0a] hover:text-[#009368]" aria-label={t('common.edit')}>
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        </Link>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeletePost(post.id, post.title)}
                                                            className="text-[#dc2626] hover:opacity-75"
                                                            aria-label={t('common.delete')}
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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

                    {/* Pagination */}
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[#404040] font-['Onest'] font-medium text-sm disabled:opacity-40"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            {t('common.previous', 'Anterior')}
                        </button>
                        <div className="flex items-center gap-2 font-['Onest'] text-[17px] text-[#0a0a0a]">
                            {t('admin.blog.page_label', 'Página')}
                            <span className="inline-flex items-center justify-center min-w-[34px] h-[34px] px-2 rounded-lg border border-[#d4d4d4] bg-white shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1)]">
                                {page}
                            </span>
                            {t('admin.blog.page_of', { total: totalPages, defaultValue: 'de {{total}}' })}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-[#404040] font-['Onest'] font-medium text-sm disabled:opacity-40"
                        >
                            {t('common.next', 'Próximo')}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
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
