import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import categoryService from '../services/categoryService'
import { PdfThumbnail } from '../components/PdfPreview'
import { useTranslation } from 'react-i18next'

function getDocUrl(post) {
    const att = post.attachments?.find(a =>
        /\.(pdf|doc|docx)$/i.test(a.filename || a.original_filename || '')
    )
    return att ? blogService.getFileUrl(att.url) : null
}

const TAG_KEY_MAP = {
    'Publicações Cientificas': 'blog.filter_scientific_publications',
    'Relatórios': 'blog.filter_reports',
    'Documentos': 'blog.filter_documents',
}

function PublicationCard({ post, compact = false }) {
    const { t } = useTranslation()
    const docUrl = getDocUrl(post)
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : null

    return (
        <Link
            to={`/publications/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline"
        >
            <div className="w-full flex items-center justify-center bg-[#f3f4f6] rounded sm:rounded-lg overflow-hidden min-h-[120px]">
                {docUrl && docUrl.endsWith('.pdf') ? (
                    <PdfThumbnail url={docUrl} width={160} />
                ) : thumbnail ? (
                    <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="py-6 flex flex-col items-center text-[#737373]">
                        <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-['Onest'] text-xs">{t('blog.document', 'Documento')}</span>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-4">
                <h3 className="font-['Onest'] font-semibold text-sm sm:text-lg leading-snug text-[#0a0a0a] flex-1 line-clamp-2">
                    {post.title}
                </h3>
                <div className="shrink-0 w-6 h-6 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                </div>
            </div>

            {!compact && post.excerpt && (
                <p className="font-['Onest'] text-xs text-[#0a0a0a] leading-relaxed line-clamp-3">
                    {post.excerpt}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-auto min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {post.author_photo ? (
                            <img src={blogService.getFileUrl(post.author_photo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-xs font-bold">
                                {(post.author || 'A')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] truncate">
                        {post.author || t('blog.default_author')}
                    </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <div className="w-5 h-5 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                        <svg className="w-2.5 h-2.5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] whitespace-nowrap">
                        {blogService.formatDate(post.published_at || post.created_at)}
                    </span>
                </div>
                {post.tags && post.tags[0] && TAG_KEY_MAP[post.tags[0]] && (
                    <span className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate max-w-full">
                        {t(TAG_KEY_MAP[post.tags[0]])}
                    </span>
                )}
            </div>
        </Link>
    )
}

function FeaturedPublication({ post }) {
    const { t } = useTranslation()
    if (!post) return null
    const docUrl = getDocUrl(post)
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : null

    return (
        <Link
            to={`/publications/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-8 p-8 rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline h-full"
        >
            <div className="w-full flex-1 min-h-[300px] rounded-2xl overflow-hidden flex items-center justify-center bg-[#f3f4f6]">
                {docUrl && docUrl.endsWith('.pdf') ? (
                    <PdfThumbnail url={docUrl} width={280} />
                ) : thumbnail ? (
                    <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-16 h-16 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                )}
            </div>

            <div className="flex items-start gap-4">
                <div className="flex-1 flex flex-col gap-4">
                    <h2 className="font-['Onest'] font-semibold text-3xl leading-none text-[#0a0a0a]">
                        {post.title}
                    </h2>
                    {post.excerpt && (
                        <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a] leading-normal line-clamp-3">
                            {post.excerpt}
                        </p>
                    )}
                </div>
                <div className="shrink-0 w-12 h-12 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                    <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {post.author_photo ? (
                            <img src={blogService.getFileUrl(post.author_photo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-sm font-bold">
                                {(post.author || 'A')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">
                        {post.author || t('blog.default_author')}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                        <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">
                        {blogService.formatDate(post.published_at || post.created_at)}
                    </span>
                </div>
                {post.tags && post.tags[0] && TAG_KEY_MAP[post.tags[0]] && (
                    <span className="ml-auto font-['Onest'] font-medium text-base text-primary bg-[#f3f4f6] rounded-full px-3 py-1">
                        {t(TAG_KEY_MAP[post.tags[0]])}
                    </span>
                )}
            </div>
        </Link>
    )
}

function MobileFeaturedCard({ post }) {
    const { t } = useTranslation()
    const docUrl = getDocUrl(post)
    const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
    return (
        <Link
            to={`/publications/${post.id}`}
            className="w-[calc(100vw-3rem)] shrink-0 snap-start bg-white rounded-2xl p-4 flex flex-col gap-3 no-underline"
        >
            <div className="w-full rounded-xl overflow-hidden flex items-center justify-center bg-[#f3f4f6] min-h-[140px]">
                {docUrl && docUrl.endsWith('.pdf') ? (
                    <PdfThumbnail url={docUrl} width={180} />
                ) : thumb ? (
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
                ) : (
                    <svg className="w-10 h-10 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                )}
            </div>
            <div className="flex items-start justify-between gap-3">
                <h3 className="font-['Onest'] font-semibold text-lg text-[#0a0a0a] line-clamp-2 flex-1">{post.title}</h3>
                <div className="shrink-0 w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-auto">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {post.author_photo ? (
                            <img src={blogService.getFileUrl(post.author_photo)} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-[10px] font-bold">
                                {(post.author || 'A')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] truncate">{post.author || t('blog.default_author')}</span>
                </div>
                <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] whitespace-nowrap">
                    {blogService.formatDate(post.published_at || post.created_at)}
                </span>
                {post.tags?.[0] && TAG_KEY_MAP[post.tags[0]] && (
                    <span className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate">
                        {t(TAG_KEY_MAP[post.tags[0]])}
                    </span>
                )}
            </div>
        </Link>
    )
}

export default function PublicationsPage() {
    const { t, i18n } = useTranslation()
    const lang = i18n.language?.startsWith('en') ? 'en' : 'pt'
    const [posts, setPosts] = useState([])
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const filterRef = useRef(null)

    useEffect(() => {
        loadPosts()
        categoryService.getByType('publication').then(cats => setCategories(Array.isArray(cats) ? cats : [])).catch(() => {})
    }, [])

    const loadPosts = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await blogService.getPublishedPosts(0, 50)
            const newPosts = Array.isArray(response) ? response : (response?.posts || [])
            setPosts(newPosts)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const catName = (slug) => {
        const cat = categories.find(c => c.slug === slug)
        return cat ? (lang === 'en' ? cat.name_en : cat.name_pt) : slug
    }
    const catSlugs = categories.map(c => c.slug)

    const normalize = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() || ''

    // All publications (unfiltered) — match by post_type OR legacy tags
    const allPublications = posts.filter(post =>
        post.post_type === 'publication' ||
        post.tags?.some(tag => ['Publicações Cientificas', 'Relatórios', 'Documentos'].some(t => t.toLowerCase() === tag.toLowerCase()))
    )
    const featuredPost = allPublications[0] || null
    const sidebarPosts = allPublications.slice(1, 3)

    // Filtered publications for the grid below
    const gridPosts = allPublications.filter(post => {
        const q = normalize(searchQuery)
        const matchesSearch = !searchQuery ||
            normalize(lang === 'en' && post.title_en ? post.title_en : post.title).includes(q) ||
            normalize(post.excerpt).includes(q) ||
            normalize(post.content?.replace(/<[^>]*>/g, '')).includes(q) ||
            normalize(post.author).includes(q) ||
            post.tags?.some(tag => normalize(tag).includes(q) || (TAG_KEY_MAP[tag] && normalize(t(TAG_KEY_MAP[tag])).includes(q)))
        const matchesCategory = activeCategory === 'all' ||
            post.categories?.includes(activeCategory) ||
            post.tags?.some(tag => tag.toLowerCase() === activeCategory.toLowerCase())
        return matchesSearch && matchesCategory
    })

    if (loading && posts.length === 0) {
        return (
            <PageTemplate>
                <div className="py-8"><LoadingSkeleton /></div>
            </PageTemplate>
        )
    }

    if (error && posts.length === 0) {
        return (
            <PageTemplate>
                <div className="py-8"><ErrorDisplay error={error} /></div>
            </PageTemplate>
        )
    }

    return (
        <PageTemplate>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="max-w-[1512px] mx-auto px-4 sm:px-12 pb-20">
                    {/* Header */}
                    <div className="flex flex-col gap-2 sm:gap-4 mb-8 sm:mb-14">
                        <h1 className="font-['Onest'] font-semibold text-3xl sm:text-5xl leading-none text-[#0a0a0a] tracking-tight">
                            {t('blog.publications_featured', 'Publicações em destaque')}
                        </h1>
                        <p className="hidden sm:block font-['Onest'] text-2xl leading-relaxed text-[#0a0a0a]">
                            {t('blog.publications_subtitle', 'Fique a par das novidades: histórias, dados e projetos ROOTS')}
                        </p>
                    </div>

                    {/* Featured section */}
                    {featuredPost && (
                        <>
                            {/* Mobile: horizontal scroll of cards */}
                            <div className="sm:hidden flex overflow-x-auto gap-3 mb-6 snap-x snap-mandatory -mx-4 pl-6 pr-4 scroll-pl-6" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                                {[featuredPost, ...sidebarPosts].map(post => (
                                    <MobileFeaturedCard key={post.id} post={post} />
                                ))}
                            </div>
                            {/* Desktop: featured + sidebar */}
                            <div className="hidden sm:flex flex-col lg:flex-row gap-6 mb-14">
                                <div className="flex-1">
                                    <FeaturedPublication post={featuredPost} />
                                </div>
                                {sidebarPosts.length > 0 && (
                                    <div className="flex flex-col gap-6 lg:w-[334px] shrink-0">
                                        {sidebarPosts.map((post) => (
                                            <PublicationCard key={post.id} post={post} compact />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Section heading — mobile only */}
                    <h2 className="sm:hidden font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-4">
                        {t('blog.all_publications', 'Todas as publicações')}
                    </h2>

                    {/* Filter bar */}
                    <div ref={filterRef} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8 mb-6" style={{ scrollMarginTop: 'calc(var(--navbar-height) + 6rem)' }}>
                        {/* Category pills — standalone on mobile, white container on desktop */}
                        <div className="flex items-center gap-2 sm:gap-0 sm:bg-[#fffefc] sm:rounded-full sm:p-4 overflow-x-auto flex-nowrap shrink-0" style={{ scrollbarWidth: 'none' }}>
                            {['all', ...catSlugs].map((id) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveCategory(id)}
                                    className={`relative font-['Onest'] font-medium text-sm sm:text-lg px-3 py-1.5 sm:py-1 rounded-full whitespace-nowrap cursor-pointer shrink-0 ${activeCategory !== id ? 'border border-[#e5e5e5] sm:border-0' : 'sm:border-0'}`}
                                >
                                    {activeCategory === id && (
                                        <motion.div
                                            layoutId="pubFilterPill"
                                            className="absolute inset-0 bg-primary rounded-full"
                                            transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    <span className={`relative z-10 transition-colors duration-300 ${activeCategory === id ? 'text-primary-content' : 'text-[#0a0a0a]'}`}>
                                        {id === 'all' ? t('blog.filter_all') : catName(id)}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('blog.search_placeholder')}
                                className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-9 sm:h-12 pl-4 pr-10 sm:pr-12 w-full sm:w-80 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <svg className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Cards grid */}
                    {gridPosts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
                            {gridPosts.map((post) => (
                                <PublicationCard key={post.id} post={post} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <h3 className="font-['Onest'] text-xl font-medium text-gray-900 mb-2">
                                {t('blog.no_results_title')}
                            </h3>
                            <p className="text-gray-600">{t('blog.no_results_hint')}</p>
                        </div>
                    )}
                </div>
            </div>
        </PageTemplate>
    )
}
