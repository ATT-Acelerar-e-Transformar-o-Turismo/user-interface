import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import { useTranslation } from 'react-i18next'

const CATEGORY_IDS = ['all', 'Publicações Cientificas', 'Relatórios', 'Documentos']
const CATEGORY_KEYS = ['blog.filter_all', 'blog.filter_scientific_publications', 'blog.filter_reports', 'blog.filter_documents']
const ALL_TAGS = ['Publicações Cientificas', 'Relatórios', 'Documentos']
const TAG_KEY_MAP = {
    'Publicações Cientificas': 'blog.filter_scientific_publications',
    'Relatórios': 'blog.filter_reports',
    'Documentos': 'blog.filter_documents',
}

function PublicationCard({ post }) {
    const { t } = useTranslation()
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : null

    return (
        <Link
            to={`/publications/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-4 p-6 rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline"
        >
            {thumbnail && (
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100">
                    <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                </div>
            )}

            <div className="flex items-start gap-4">
                <h3 className="font-['Onest'] font-semibold text-lg leading-snug text-[#0a0a0a] flex-1 line-clamp-2">
                    {post.title}
                </h3>
                <div className="shrink-0 w-6 h-6 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                    <svg className="w-3 h-3 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                </div>
            </div>

            {post.excerpt && (
                <p className="font-['Onest'] text-xs text-[#0a0a0a] leading-relaxed line-clamp-3">
                    {post.excerpt}
                </p>
            )}

            <div className="flex flex-wrap items-center gap-2 mt-auto min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0">
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

export default function PublicationsPage() {
    const { t } = useTranslation()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const filterRef = useRef(null)

    useEffect(() => {
        loadPosts()
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

    const normalize = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() || ''

    const filteredPosts = posts.filter(post => {
        // Only publications
        if (!post.tags?.some(tag => ALL_TAGS.some(t => t.toLowerCase() === tag.toLowerCase()))) return false
        const q = normalize(searchQuery)
        const matchesSearch = !searchQuery ||
            normalize(post.title).includes(q) ||
            normalize(post.excerpt).includes(q) ||
            normalize(post.content?.replace(/<[^>]*>/g, '')).includes(q) ||
            normalize(post.author).includes(q) ||
            post.tags?.some(tag => normalize(tag).includes(q) || (TAG_KEY_MAP[tag] && normalize(t(TAG_KEY_MAP[tag])).includes(q)))
        const matchesCategory = activeCategory === 'all' ||
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
                            {t('blog.publications_title', 'Publicações ROOTS')}
                        </h1>
                        <p className="font-['Onest'] text-base sm:text-2xl leading-relaxed text-[#0a0a0a]">
                            {t('blog.publications_subtitle', 'Fique a par das novidades: histórias, dados e projetos ROOTS')}
                        </p>
                    </div>

                    {/* Filter bar */}
                    <div ref={filterRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-8 mb-6" style={{ scrollMarginTop: 'calc(var(--navbar-height) + 6rem)' }}>
                        {/* Category pills */}
                        <div className="bg-[#fffefc] flex items-center gap-0 rounded-full p-2 sm:p-4 overflow-x-auto">
                            {CATEGORY_IDS.map((id, index) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveCategory(id)}
                                    className={`font-['Onest'] font-medium text-sm sm:text-lg px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
                                        activeCategory === id
                                            ? 'bg-primary text-primary-content'
                                            : 'text-[#0a0a0a] hover:bg-gray-100'
                                    }`}
                                >
                                    {t(CATEGORY_KEYS[index])}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('blog.search_placeholder')}
                                className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-10 sm:h-12 pl-4 pr-12 w-full sm:w-80 text-sm sm:text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Cards grid */}
                    {filteredPosts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                            {filteredPosts.map((post) => (
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
