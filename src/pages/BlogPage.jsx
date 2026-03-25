import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import { useTranslation } from 'react-i18next'

// Fallback thumbnails when posts don't have uploaded images
const FALLBACK_THUMBS = [
    '/assets/figma/hero-rect-1.png',
    '/assets/figma/hero-rect-2.png',
    '/assets/figma/hero-rect-3.png',
    '/assets/figma/about-rect-1.png',
    '/assets/figma/about-rect-2.png',
    '/assets/figma/about-rect-3.png',
    '/assets/figma/about-rect-4.png',
    '/assets/figma/blog-thumb-1.png',
    '/assets/figma/blog-thumb-2.png',
    '/assets/figma/blog-thumb-3.png',
]

const getFallbackThumb = (index) => FALLBACK_THUMBS[index % FALLBACK_THUMBS.length]

const CATEGORIES = [
    { id: 'all', label: 'Todos' },
    { id: 'Publicações Cientificas', label: 'Publicações Cientificas' },
    { id: 'Relatórios', label: 'Relatórios' },
    { id: 'Documentos', label: 'Documentos' },
    { id: 'Noticias', label: 'Noticias' },
    { id: 'Eventos', label: 'Eventos' },
]

function PostCard({ post, compact = false, index = 0 }) {
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : getFallbackThumb(index)

    return (
        <Link
            to={`/news-events/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-4 p-6 rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline"
        >
            {/* Thumbnail */}
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
            </div>

            {/* Title + arrow */}
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

            {/* Excerpt */}
            {!compact && post.excerpt && (
                <p className="font-['Onest'] text-xs text-[#0a0a0a] leading-relaxed line-clamp-4">
                    {post.excerpt}
                </p>
            )}

            {/* Author + date + badge */}
            <div className="flex flex-wrap items-center gap-2 mt-auto min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden shrink-0">
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#009368] to-[#00855d] flex items-center justify-center text-white text-xs font-bold">
                                {(post.author || 'A')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] truncate">
                        {post.author || 'Autor'}
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
                {post.tags && post.tags[0] && (
                    <span className="font-['Onest'] font-medium text-xs text-[#009368] bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate max-w-full">
                        {post.tags[0]}
                    </span>
                )}
            </div>
        </Link>
    )
}

function FeaturedPost({ post, index = 0 }) {
    if (!post) return null
    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : getFallbackThumb(index)

    return (
        <Link
            to={`/news-events/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-8 p-8 rounded-2xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline h-full"
        >
            {/* Large thumbnail */}
            <div className="w-full flex-1 min-h-[300px] rounded-2xl overflow-hidden bg-gray-100">
                <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
            </div>

            {/* Title + arrow */}
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

            {/* Author + date + badge */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                        {post.author_avatar ? (
                            <img src={post.author_avatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#009368] to-[#00855d] flex items-center justify-center text-white text-sm font-bold">
                                {(post.author || 'A')[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">
                        {post.author || 'Autor'}
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
                {post.tags && post.tags[0] && (
                    <span className="ml-auto font-['Onest'] font-medium text-base text-[#009368] bg-[#f3f4f6] rounded-full px-3 py-1">
                        {post.tags[0]}
                    </span>
                )}
            </div>
        </Link>
    )
}

export default function BlogPage() {
    const { t } = useTranslation()
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const filterRef = useRef(null)
    const wasSearching = useRef(false)

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

    // Normalize: remove diacritics (accents) and lowercase
    const normalize = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() || ''

    // Filter posts by search and category
    const filteredPosts = posts.filter(post => {
        const q = normalize(searchQuery)
        const matchesSearch = !searchQuery ||
            normalize(post.title).includes(q) ||
            normalize(post.excerpt).includes(q) ||
            normalize(post.content?.replace(/<[^>]*>/g, '')).includes(q) ||
            normalize(post.author).includes(q)
        const matchesCategory = activeCategory === 'all' ||
            post.tags?.some(tag => tag.toLowerCase() === activeCategory.toLowerCase())
        return matchesSearch && matchesCategory
    })

    const isSearching = searchQuery.trim().length > 0 || activeCategory !== 'all'

    // Keep filter bar in view when featured section disappears/appears
    useEffect(() => {
        if (isSearching && !wasSearching.current && filterRef.current) {
            filterRef.current.scrollIntoView({ behavior: 'instant', block: 'start' })
        }
        wasSearching.current = isSearching
    }, [isSearching])
    const featuredPost = isSearching ? null : filteredPosts[0]
    const sidebarPosts = isSearching ? [] : filteredPosts.slice(1, 3)
    const gridPosts = isSearching ? filteredPosts : filteredPosts.slice(3)

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
                <div className="max-w-[1512px] mx-auto px-12 pb-20">
                    {/* Header */}
                    <div className="flex flex-col gap-4 mb-14">
                        <h1 className="font-['Onest'] font-semibold text-5xl leading-none text-[#0a0a0a] tracking-tight">
                            Noticias e Eventos
                        </h1>
                        <p className="font-['Onest'] text-2xl leading-relaxed text-[#0a0a0a]">
                            Fique a par das novidades: histórias, dados e projetos ROOTS
                        </p>
                    </div>

                    {/* Featured section: only when not searching */}
                    {!isSearching && featuredPost && (
                        <div className="flex flex-col lg:flex-row gap-6 mb-14">
                            <div className="flex-1">
                                <FeaturedPost post={featuredPost} index={0} />
                            </div>
                            {sidebarPosts.length > 0 && (
                                <div className="flex flex-col gap-6 lg:w-[334px] shrink-0">
                                    {sidebarPosts.map((post, i) => (
                                        <PostCard key={post.id} post={post} index={i + 1} compact />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Filter bar */}
                    <div ref={filterRef} className="flex items-center justify-between gap-8 mb-6 flex-wrap" style={{ scrollMarginTop: 'calc(var(--navbar-height) + 6rem)' }}>
                        {/* Category pills */}
                        <div className="bg-[#fffefc] flex items-center gap-0 rounded-full p-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`font-['Onest'] font-medium text-lg px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                                        activeCategory === cat.id
                                            ? 'bg-[#00855d] text-white'
                                            : 'text-[#0a0a0a] hover:bg-gray-100'
                                    }`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Search input */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Pesquisar..."
                                className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-12 pl-4 pr-12 w-80 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-[#009368]/30"
                            />
                            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Cards grid — 4 columns */}
                    {gridPosts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {gridPosts.map((post, i) => (
                                <PostCard key={post.id} post={post} index={i + 3} />
                            ))}
                        </div>
                    ) : filteredPosts.length === 0 && (
                        <div className="text-center py-16">
                            <h3 className="font-['Onest'] text-xl font-medium text-gray-900 mb-2">
                                Nenhum resultado encontrado
                            </h3>
                            <p className="text-gray-600">Tente ajustar os filtros ou a pesquisa.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageTemplate>
    )
}
