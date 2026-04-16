import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import authorService from '../services/authorService'
import blogService from '../services/blogService'
import { useTranslation } from 'react-i18next'
import { FaLinkedinIn, FaInstagram, FaFacebookF, FaGithub, FaOrcid } from 'react-icons/fa6'
import { HiOutlineMail, HiOutlineChevronLeft } from 'react-icons/hi'

function slugify(text) {
    return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').replace(/^-+|-+$/g, '')
}

const TAG_KEY_MAP = {
    'Noticias': 'blog.filter_news',
    'Eventos': 'blog.filter_events',
    'Publicações Cientificas': 'blog.filter_scientific_publications',
    'Relatórios': 'blog.filter_reports',
    'Documentos': 'blog.filter_documents',
}

export default function AuthorPage() {
    const { authorSlug } = useParams()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [author, setAuthor] = useState(null)
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeCategory, setActiveCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => { loadAuthor() }, [authorSlug])

    const loadAuthor = async () => {
        try {
            setLoading(true)
            setError(null)
            let authorData
            try {
                authorData = await authorService.getBySlug(authorSlug)
            } catch {
                // Fallback: slug endpoint may not exist yet, find by computing slug from all authors
                const allAuthors = await authorService.getAll()
                const list = Array.isArray(allAuthors) ? allAuthors : (allAuthors?.authors || [])
                authorData = list.find(a => (a.slug || slugify(a.name)) === authorSlug) || null
            }
            if (!authorData) throw new Error('Author not found')
            setAuthor(authorData)
            try {
                const all = await blogService.getPublishedPosts(0, 50)
                const allPosts = Array.isArray(all) ? all : (all?.posts || [])
                setPosts(allPosts.filter(p => p.author_id === authorData.id || p.author === authorData.name))
            } catch { setPosts([]) }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <PageTemplate><div className="py-8"><LoadingSkeleton /></div></PageTemplate>
    if (error) return <PageTemplate><div className="py-8"><ErrorDisplay error={error} /></div></PageTemplate>
    if (!author) {
        return (
            <PageTemplate>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="font-['Onest'] text-2xl font-bold text-[#0a0a0a] mb-4">{t('blog.author_not_found', 'Autor não encontrado')}</h1>
                        <Link to="/news-events" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-[color:var(--color-primary-hover)]">
                            {t('common.back')}
                        </Link>
                    </div>
                </div>
            </PageTemplate>
        )
    }

    const coverUrl = author.cover_url ? blogService.getFileUrl(author.cover_url) : null
    const photoUrl = author.photo_url ? blogService.getFileUrl(author.photo_url) : null
    const featuredPosts = posts.slice(0, 3)
    const socialLinks = [
        { key: 'linkedin', url: author.linkedin, icon: <FaLinkedinIn className="w-4 h-4" /> },
        { key: 'email', url: author.email ? `mailto:${author.email}` : null, icon: <HiOutlineMail className="w-4 h-4" /> },
        { key: 'instagram', url: author.instagram, icon: <FaInstagram className="w-4 h-4" /> },
        { key: 'facebook', url: author.facebook, icon: <FaFacebookF className="w-4 h-4" /> },
        { key: 'github', url: author.github, icon: <FaGithub className="w-4 h-4" /> },
        { key: 'orcid', url: author.orcid, icon: <FaOrcid className="w-4 h-4" /> },
    ].filter(s => s.url)

    // Derive unique tags from the author's posts for filter pills
    const allPostTags = [...new Set(posts.flatMap(p => p.tags || []))]
    const categoryIds = ['all', ...allPostTags]
    const categoryKeys = ['blog.filter_all', ...allPostTags.map(tag => TAG_KEY_MAP[tag] || tag)]

    const normalize = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() || ''

    const filteredPosts = posts.filter(post => {
        const q = normalize(searchQuery)
        const matchesSearch = !searchQuery ||
            normalize(post.title).includes(q) ||
            normalize(post.excerpt).includes(q) ||
            post.tags?.some(tag => normalize(tag).includes(q) || (TAG_KEY_MAP[tag] && normalize(t(TAG_KEY_MAP[tag])).includes(q)))
        const matchesCategory = activeCategory === 'all' ||
            post.tags?.some(tag => tag.toLowerCase() === activeCategory.toLowerCase())
        return matchesSearch && matchesCategory
    })

    const Avatar = () => photoUrl ? (
        <img src={photoUrl} alt={author.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg" />
    ) : (
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-4xl sm:text-5xl font-bold border-4 border-white shadow-lg">
            {(author.name || 'A')[0].toUpperCase()}
        </div>
    )

    return (
        <PageTemplate fullBleed>
            <div className="min-h-screen bg-[#f3f4f6]">

                {/* ===== MOBILE LAYOUT ===== */}
                <div className="sm:hidden">
                    {/* Cover image — behind navbar */}
                    {coverUrl ? (
                        <div className="relative w-full h-[280px]">
                            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                        </div>
                    ) : (
                        <div className="w-full h-[180px] bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)]" />
                    )}

                    {/* Rounded card overlapping the cover */}
                    <div className="relative -mt-10 z-10">
                        <div className="bg-[#f3f4f6] rounded-t-[24px] px-4 pt-6 pb-8">
                            {/* Back button — left aligned */}
                            <button onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1.5 text-sm font-['Onest'] font-medium text-[#0a0a0a] bg-white hover:bg-gray-50 shadow-sm mb-4 cursor-pointer">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                                {t('common.back')}
                            </button>

                            {/* Avatar — overlapping card top edge */}
                            <div className="flex flex-col items-center -mt-28 mb-4">
                                <Avatar />
                            </div>

                            {/* Name + role + socials */}
                            <div className="flex flex-col items-center gap-2">
                                <h1 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight text-center">
                                    {author.name}
                                </h1>
                                {author.role && (
                                    <p className="font-['Onest'] font-medium text-base text-[#737373] text-center">
                                        {author.role}
                                    </p>
                                )}
                                {socialLinks.length > 0 && (
                                    <div className="flex items-center gap-3 mt-2">
                                        {socialLinks.map(s => (
                                            <a key={s.key} href={s.url}
                                                target={s.key === 'email' ? undefined : '_blank'}
                                                rel="noopener noreferrer"
                                                className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm text-[#0a0a0a] hover:text-primary hover:border-primary transition-colors">
                                                {s.icon}
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Featured 3 — swipeable cards */}
                            {featuredPosts.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-4">
                                        {t('blog.publications_featured', 'Publicações em destaque')}
                                    </h2>
                                    <div className="flex overflow-x-auto gap-3 snap-x snap-mandatory -mx-4 pl-6 pr-4 scroll-pl-6" style={{ scrollbarWidth: 'none' }}>
                                        {featuredPosts.map(post => {
                                            const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
                                            return (
                                                <Link key={post.id} to={`/news-events/${post.id}`}
                                                    className="w-[calc(100vw-3rem)] shrink-0 snap-start bg-white rounded-2xl p-4 flex flex-col gap-3 no-underline">
                                                    {thumb && (
                                                        <div className="w-full aspect-video rounded-xl overflow-hidden">
                                                            <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
                                                        </div>
                                                    )}
                                                    <h3 className="font-['Onest'] font-semibold text-lg text-[#0a0a0a] line-clamp-2">{post.title}</h3>
                                                </Link>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* All publications — heading + filters + search + grid */}
                            {posts.length > 0 && (
                                <div className="mt-8">
                                    <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-4">
                                        {t('blog.author_publications', 'Publicações de')} {author.name}
                                    </h2>

                                    {/* Filter pills — single row, horizontally scrollable */}
                                    <div className="flex items-center gap-2 overflow-x-auto flex-nowrap mb-3" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                                        {categoryIds.map((id, index) => (
                                            <button
                                                key={id}
                                                onClick={() => setActiveCategory(id)}
                                                className={`relative font-['Onest'] font-medium text-sm px-3 py-1.5 rounded-full whitespace-nowrap cursor-pointer shrink-0 ${activeCategory !== id ? 'border border-[#e5e5e5]' : ''}`}
                                            >
                                                {activeCategory === id && (
                                                    <motion.div
                                                        layoutId="authorMobileFilterPill"
                                                        className="absolute inset-0 bg-primary rounded-full"
                                                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                                    />
                                                )}
                                                <span className={`relative z-10 transition-colors duration-300 ${activeCategory === id ? 'text-primary-content' : 'text-[#0a0a0a]'}`}>
                                                    {TAG_KEY_MAP[id] ? t(TAG_KEY_MAP[id]) : (id === 'all' ? t(categoryKeys[0]) : id)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Search input */}
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t('blog.search_placeholder')}
                                            className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-9 pl-4 pr-10 w-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>

                                    {/* Grid */}
                                    {filteredPosts.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            {filteredPosts.map(post => {
                                                const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
                                                return (
                                                    <Link key={post.id} to={`/news-events/${post.id}`}
                                                        className="bg-[#fffefc] flex flex-col gap-3 p-4 rounded-lg overflow-hidden shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline">
                                                        {thumb && (
                                                            <div className="w-full aspect-video rounded overflow-hidden">
                                                                <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                        <h3 className="font-['Onest'] font-semibold text-sm leading-snug text-[#0a0a0a] line-clamp-2">{post.title}</h3>
                                                        <div className="flex flex-wrap items-center gap-1 mt-auto">
                                                            <div className="flex items-center gap-1 shrink-0">
                                                                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                                    {post.author_photo ? (
                                                                        <img src={blogService.getFileUrl(post.author_photo)} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white text-[10px] font-bold">
                                                                            {(post.author || 'A')[0].toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] truncate">{post.author}</span>
                                                            </div>
                                                            <span className="font-['Onest'] font-medium text-xs text-[#0a0a0a] whitespace-nowrap">
                                                                {blogService.formatDate(post.published_at || post.created_at)}
                                                            </span>
                                                            {post.tags?.[0] && (
                                                                <span className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate">
                                                                    {TAG_KEY_MAP[post.tags[0]] ? t(TAG_KEY_MAP[post.tags[0]]) : post.tags[0]}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <h3 className="font-['Onest'] text-lg font-medium text-gray-900 mb-1">{t('blog.no_results_title')}</h3>
                                            <p className="text-sm text-gray-600">{t('blog.no_results_hint')}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ===== DESKTOP LAYOUT ===== */}
                <div className="hidden sm:block">
                    {/* Cover image — behind navbar */}
                    {coverUrl ? (
                        <div className="w-full h-72 overflow-hidden">
                            <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)]" style={{ marginTop: 'var(--navbar-height)' }} />
                    )}

                    {/* Rounded card overlapping cover */}
                    <div className={`relative max-w-[1512px] mx-auto px-12 pb-20 ${coverUrl ? '-mt-12 z-10 bg-[#f3f4f6] rounded-t-[32px] pt-6' : ''}`} style={coverUrl ? {} : { paddingTop: 'calc(var(--navbar-height) + 2rem)' }}>
                        {/* Back button */}
                        <div className="mb-4">
                            <button onClick={() => navigate(-1)}
                                className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-4 py-1.5 text-sm font-['Onest'] font-medium text-[#0a0a0a] bg-white hover:bg-gray-50 shadow-sm cursor-pointer">
                                <HiOutlineChevronLeft className="w-4 h-4" />
                                {t('common.back')}
                            </button>
                        </div>

                        {/* Avatar + info */}
                        <div className={`flex flex-col items-center ${coverUrl ? '-mt-32' : ''}`}>
                            <Avatar />
                            <h1 className="font-['Onest'] font-semibold text-4xl text-[#0a0a0a] tracking-tight mt-4 text-center">
                                {author.name}
                            </h1>
                            {author.role && (
                                <p className="font-['Onest'] font-medium text-lg text-[#737373] mt-1 text-center">
                                    {author.role}
                                </p>
                            )}
                            {socialLinks.length > 0 && (
                                <div className="flex items-center gap-3 mt-4">
                                    {socialLinks.map(s => (
                                        <a key={s.key} href={s.url}
                                            target={s.key === 'email' ? undefined : '_blank'}
                                            rel="noopener noreferrer"
                                            className="w-9 h-9 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm text-[#0a0a0a] hover:text-primary hover:border-primary transition-colors">
                                            {s.icon}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Publications section heading */}
                        <h2 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] mt-14 mb-6">
                            {t('blog.author_publications', 'Publicações de')} {author.name}
                        </h2>

                        {/* Filter bar + search */}
                        {posts.length > 0 && (
                            <div className="flex items-center justify-between gap-8 mb-6">
                                {/* Category pills */}
                                <div className="flex items-center bg-[#fffefc] rounded-full p-4">
                                    {categoryIds.map((id, index) => (
                                        <button
                                            key={id}
                                            onClick={() => setActiveCategory(id)}
                                            className="relative font-['Onest'] font-medium text-lg px-3 py-1 rounded-full whitespace-nowrap cursor-pointer"
                                        >
                                            {activeCategory === id && (
                                                <motion.div
                                                    layoutId="authorFilterPill"
                                                    className="absolute inset-0 bg-primary rounded-full"
                                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                                />
                                            )}
                                            <span className={`relative z-10 transition-colors duration-300 ${activeCategory === id ? 'text-primary-content' : 'text-[#0a0a0a]'}`}>
                                                {TAG_KEY_MAP[id] ? t(TAG_KEY_MAP[id]) : (id === 'all' ? t(categoryKeys[0]) : id)}
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
                                        className="font-['Onest'] bg-[#fffefc] border border-[#e5e5e5] rounded-full h-12 pl-4 pr-12 w-80 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Publications grid */}
                        {filteredPosts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredPosts.map(post => {
                                    const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null
                                    return (
                                        <Link key={post.id} to={`/news-events/${post.id}`}
                                            className="bg-[#fffefc] flex flex-col gap-4 p-6 rounded-xl shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline">
                                            {thumb && (
                                                <div className="w-full aspect-video rounded-lg overflow-hidden">
                                                    <img src={thumb} alt={post.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex items-start gap-4">
                                                <h3 className="font-['Onest'] font-semibold text-lg leading-snug text-[#0a0a0a] flex-1 line-clamp-2">{post.title}</h3>
                                                <div className="shrink-0 w-6 h-6 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                                                    <svg className="w-3 h-3 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                                                    </svg>
                                                </div>
                                            </div>
                                            {post.excerpt && (
                                                <p className="font-['Onest'] text-xs text-[#0a0a0a] leading-relaxed line-clamp-3">{post.excerpt}</p>
                                            )}
                                            <div className="flex flex-wrap items-center gap-2 mt-auto min-w-0">
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
                                                {post.tags?.[0] && (
                                                    <span className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate max-w-full">
                                                        {TAG_KEY_MAP[post.tags[0]] ? t(TAG_KEY_MAP[post.tags[0]]) : post.tags[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        ) : posts.length > 0 ? (
                            <div className="text-center py-16">
                                <h3 className="font-['Onest'] text-xl font-medium text-gray-900 mb-2">
                                    {t('blog.no_results_title')}
                                </h3>
                                <p className="text-gray-600">{t('blog.no_results_hint')}</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </PageTemplate>
    )
}
