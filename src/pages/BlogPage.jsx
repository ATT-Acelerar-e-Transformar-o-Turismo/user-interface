import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import categoryService from '../services/categoryService'
import PostCard from '../components/PostCard'
import { useTranslation } from 'react-i18next'

// Fallback for legacy posts that use tags instead of categories
const TAG_KEY_MAP = {
    'Noticias': 'blog.filter_news',
    'Eventos': 'blog.filter_events',
    'Publicações Cientificas': 'blog.filter_scientific_publications',
    'Relatórios': 'blog.filter_reports',
    'Documentos': 'blog.filter_documents',
}

function FeaturedPost({ post: rawPost, catName }) {
    const { t, i18n } = useTranslation()
    if (!rawPost) return null
    const en = i18n.language?.startsWith('en')
    const post = { ...rawPost, title: (en && rawPost.title_en) || rawPost.title, excerpt: (en && rawPost.excerpt_en) || rawPost.excerpt }
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : null

    return (
        <Link
            to={`/news-events/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-8 p-8 rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline h-full"
        >
            {thumbnail && (
                <div className="w-full flex-1 min-h-0 rounded-2xl overflow-hidden relative">
                    <img src={thumbnail} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
                </div>
            )}

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
                {catName && post.categories?.length > 0 && (
                    <div className="ml-auto flex flex-wrap gap-2">
                        {post.categories.map((slug, i) => (
                            <span key={i} className="font-['Onest'] font-medium text-base text-primary bg-[#f3f4f6] rounded-full px-3 py-1">
                                {catName(slug)}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </Link>
    )
}

function MobileFeaturedCard({ post: rawPost, basePath = '/news-events', catName }) {
    const { t, i18n } = useTranslation()
    const en = i18n.language?.startsWith('en')
    const post = { ...rawPost, title: (en && rawPost.title_en) || rawPost.title, excerpt: (en && rawPost.excerpt_en) || rawPost.excerpt }
    const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
    return (
        <Link
            to={`${basePath}/${post.id}`}
            className="w-[calc(100vw-3rem)] shrink-0 snap-start bg-white rounded-2xl p-4 flex flex-col gap-3 no-underline"
        >
            {thumb && (
                <div className="w-full aspect-video rounded-xl overflow-hidden">
                    <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
                </div>
            )}
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
                {catName && post.categories?.map((slug, i) => (
                    <span key={i} className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate">
                        {catName(slug)}
                    </span>
                ))}
            </div>
        </Link>
    )
}

export default function BlogPage() {
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
        categoryService.getByType('news-event').then(cats => setCategories(Array.isArray(cats) ? cats : [])).catch(() => {})
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

    // All news/events posts (unfiltered) — match by post_type OR legacy tags
    const allNewsEvents = posts.filter(post =>
        post.post_type === 'news-event' ||
        post.tags?.some(tag => ['Noticias', 'Eventos'].some(t => t.toLowerCase() === tag.toLowerCase()))
    )
    const featuredPost = allNewsEvents[0] || null
    const sidebarPosts = allNewsEvents.slice(1, 3)

    // Filtered posts for the grid below
    const gridPosts = allNewsEvents.filter(post => {
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
                            {t('blog.header_title')}
                        </h1>
                        <p className="font-['Onest'] text-base sm:text-2xl leading-relaxed text-[#0a0a0a]">
                            {t('blog.header_subtitle')}
                        </p>
                    </div>

                    {/* Featured section */}
                    {featuredPost && (
                        <>
                            {/* Mobile: horizontal scroll of cards */}
                            <div className="sm:hidden flex overflow-x-auto gap-3 mb-6 snap-x snap-mandatory -mx-4 pl-6 pr-4 scroll-pl-6" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                                {[featuredPost, ...sidebarPosts].map(post => (
                                    <MobileFeaturedCard key={post.id} post={post} basePath="/news-events" catName={catName} />
                                ))}
                            </div>
                            {/* Desktop: featured + sidebar */}
                            <div className="hidden sm:flex flex-col lg:flex-row lg:items-stretch gap-6 mb-14">
                                <div className="flex-1 min-h-0">
                                    <FeaturedPost post={featuredPost} catName={catName} />
                                </div>
                                {sidebarPosts.length > 0 && (
                                    <div className="flex flex-col gap-6 lg:w-[334px] shrink-0">
                                        {sidebarPosts.map((post) => (
                                            <PostCard key={post.id} post={post} compact catName={catName} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Section heading — mobile only */}
                    <h2 className="sm:hidden font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-4">
                        {t('blog.all_news', 'Todas as notícias')}
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
                                            layoutId="blogFilterPill"
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
                                <PostCard key={post.id} post={post} catName={catName} />
                            ))}
                        </div>
                    ) : gridPosts.length === 0 && (
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
