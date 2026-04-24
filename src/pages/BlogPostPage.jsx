import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import authorService from '../services/authorService'
import hljs from 'highlight.js'
import parse from 'html-react-parser'
import BlogIndicatorWidget from '../components/BlogIndicatorWidget'
import PdfPreview, { PdfCardFill, PdfFillPreview } from '../components/PdfPreview'
import { useTranslation } from 'react-i18next'

function slugify(text) {
    return text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\w\s-]/g, '').replace(/[-\s]+/g, '-').replace(/^-+|-+$/g, '')
}

const TAG_KEY_MAP = {
    'Publicações Cientificas': 'blog.filter_scientific_publications',
    'Relatórios': 'blog.filter_reports',
    'Documentos': 'blog.filter_documents',
    'Noticias': 'blog.filter_news',
    'Eventos': 'blog.filter_events',
}

/** Resolve localized fields on a post object based on current language. */
function localizePost(raw, lang) {
    if (!raw) return null;
    const en = (lang || 'pt').startsWith('en');
    return {
        ...raw,
        title: (en && raw.title_en) || raw.title,
        content: (en && raw.content_en) || raw.content,
        excerpt: (en && raw.excerpt_en) || raw.excerpt,
        publication_link_label: (en && raw.publication_link_label_en) || raw.publication_link_label,
    };
}

export default function BlogPostPage() {
    const { postId } = useParams()
    const { t, i18n } = useTranslation()
    const navigate = useNavigate()
    const [rawPost, setRawPost] = useState(null)
    const post = localizePost(rawPost, i18n.language)
    const [authorSlug, setAuthorSlug] = useState(null)
    const [relatedPosts, setRelatedPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [imageExpanded, setImageExpanded] = useState(false)
    const [shareOpen, setShareOpen] = useState(false)

    useEffect(() => { loadPost() }, [postId])

    useEffect(() => {
        if (post?.content) {
            document.querySelectorAll('.blog-content pre code').forEach((block) => {
                hljs.highlightElement(block)
            })
        }
    }, [post])

    const loadPost = async () => {
        try {
            setLoading(true)
            setError(null)
            const postData = await blogService.getPost(postId)
            // Resolve author slug for profile link
            try {
                if (postData.author_id) {
                    const author = await authorService.getById(postData.author_id)
                    if (author) setAuthorSlug(author.slug || slugify(author.name))
                }
            } catch { /* silent */ }
            setRawPost(postData)
            // Load related posts
            try {
                const all = await blogService.getPublishedPosts(0, 10)
                const posts = Array.isArray(all) ? all : (all?.posts || [])
                setRelatedPosts(posts.filter(p => String(p.id) !== String(postId)).slice(0, 3))
            } catch { setRelatedPosts([]) }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const parseOptions = {
        replace: (domNode) => {
            if (domNode.name === 'blog-indicator') {
                const { id, type } = domNode.attribs
                return <BlogIndicatorWidget indicatorId={id} vizType={type} />
            }
            if (domNode.name === 'div' && domNode.attribs?.class === 'blog-indicator-preview') {
                const indicatorId = domNode.attribs.id || domNode.attribs['data-indicator-id']
                return <BlogIndicatorWidget indicatorId={indicatorId} vizType={domNode.attribs.type || 'line'} />
            }
        }
    }

    const location = useLocation()
    const backPath = location.pathname.startsWith('/publications') ? '/publications' : '/news-events'
    const shareUrl = typeof window !== 'undefined' ? window.location.href : ''

    if (loading) {
        return <PageTemplate><div className="py-8"><LoadingSkeleton /></div></PageTemplate>
    }
    if (error) {
        return <PageTemplate><div className="py-8"><ErrorDisplay error={error} /></div></PageTemplate>
    }
    if (!post) {
        return (
            <PageTemplate>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="font-['Onest'] text-2xl font-bold text-[#0a0a0a] mb-4">{t('blog.post_not_found')}</h1>
                        <Link to="/news-events" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-[color:var(--color-primary-hover)]">
                            {t('common.back')}
                        </Link>
                    </div>
                </div>
            </PageTemplate>
        )
    }

    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : null

    const authorLink = authorSlug ? `/author/${authorSlug}` : null
    const isPublication = post.post_type === 'publication' || location.pathname.startsWith('/publications')
    const primaryDoc = post.attachments?.find(a => /\.(pdf|doc|docx)$/i.test(a.filename || a.original_filename || ''))
    const primaryDocUrl = primaryDoc ? blogService.getFileUrl(primaryDoc.url) : null

    const articleStyles = `
        .blog-content h1 { font-size: 2rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; line-height: 1; letter-spacing: -0.32px; }
        .blog-content h2 { font-size: 2rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1; letter-spacing: -0.32px; }
        .blog-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; line-height: 1.2; }
        .blog-content p { font-size: 18px; font-weight: 500; line-height: 24px; margin-bottom: 1rem; }
        .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .blog-content ol { list-style-type: decimal; padding-left: 3rem; margin-bottom: 1rem; }
        .blog-content ol > li { font-size: 2rem; font-weight: 600; line-height: 1; letter-spacing: -0.32px; margin-bottom: 1.5rem; }
        .blog-content li { margin-bottom: 0.5rem; }
        .blog-content blockquote { border-left: 4px solid var(--color-primary); padding-left: 1rem; font-style: italic; color: #4b5563; margin: 1.5rem 0; background-color: #f3f4f6; padding: 1rem; border-radius: 0.375rem; }
        .blog-content a { color: var(--color-primary); text-decoration: underline; font-weight: 500; }
        .blog-content img { max-width: 100%; height: auto; border-radius: 1rem; margin: 1.5rem 0; }
        .blog-content pre { background: #0d0d0d; color: #fff; font-family: monospace; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 1.5rem 0; overflow-x: auto; }
        .blog-content pre code { color: inherit; padding: 0; background: none; font-size: 0.875rem; }
    `

    const AuthorAvatar = ({ size = 'sm' }) => {
        const cls = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-40 h-40 text-5xl'
        return post.author_photo ? (
            <img src={blogService.getFileUrl(post.author_photo)} alt={post.author} className={`${cls} rounded-full object-cover`} />
        ) : (
            <div className={`${cls} rounded-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)] flex items-center justify-center text-white font-bold shrink-0`}>
                {(post.author || 'A')[0].toUpperCase()}
            </div>
        )
    }

    const SidebarCards = ({ mobile = false }) => (
        <>
            {/* Author card — desktop sidebar only */}
            {!mobile && (
                authorLink ? (
                    <Link to={authorLink} className="bg-[#fffefc] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)] no-underline hover:shadow-md transition-shadow">
                        <AuthorAvatar size="lg" />
                        <div className="text-center flex flex-col gap-2">
                            <h3 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">{post.author}</h3>
                            <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a]">{post.author_role || t('blog.researcher_role')}</p>
                        </div>
                    </Link>
                ) : (
                    <div className="bg-[#fffefc] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)]">
                        <AuthorAvatar size="lg" />
                        <div className="text-center flex flex-col gap-2">
                            <h3 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">{post.author}</h3>
                            <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a]">{post.author_role || t('blog.researcher_role')}</p>
                        </div>
                    </div>
                )
            )}

            {/* Publication link */}
            {post.publication_link && (
                <div className={`bg-[#fffefc] rounded-2xl flex flex-col gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)] ${mobile ? 'p-4' : 'px-8 py-6'}`}>
                    <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">{t('blog.publication_link', 'Link para a Publicação')}</h3>
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a] truncate">
                                {post.publication_link_label || post.publication_link}
                            </span>
                        </div>
                        <a href={post.publication_link} target="_blank" rel="noopener noreferrer"
                            className="w-10 h-10 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0 hover:bg-black/[0.03] transition-colors">
                            <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                </div>
            )}

            {/* Keywords */}
            {post.keywords?.length > 0 && (
                <div className={`bg-[#fffefc] rounded-2xl flex flex-col gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)] ${mobile ? 'p-4' : 'px-8 py-6'}`}>
                    <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">{t('blog.keywords_title')}</h3>
                    <div className="flex flex-wrap gap-2">
                        {post.keywords.map((kw, i) => (
                            <span key={i} className="font-['Onest'] text-sm text-primary bg-[#f3f4f6] rounded-full px-3 py-1">
                                {kw}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Related publications */}
            {relatedPosts.length > 0 && (
                <div className={`bg-[#fffefc] rounded-2xl flex flex-col gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)] ${mobile ? 'p-4' : 'px-8 py-6'}`}>
                    <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">{t('blog.related_publications')}</h3>
                    <div className="flex flex-col gap-4">
                        {relatedPosts.map((rp) => (
                            <Link key={rp.id} to={`${backPath}/${rp.id}`}
                                className="flex gap-4 items-start no-underline hover:opacity-80 transition-opacity">
                                <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                                    {rp.thumbnail_url ? (
                                        <img src={blogService.getFileUrl(rp.thumbnail_url)} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="font-['Onest'] font-bold text-lg text-gray-400">{(rp.title || '?')[0]}</span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="font-['Onest'] font-medium text-lg text-[#0a0a0a] line-clamp-1">{rp.title}</span>
                                    <span className="font-['Onest'] text-xs text-[#737373] line-clamp-2">{rp.excerpt}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Share */}
            <div className={`bg-[#fffefc] rounded-2xl flex flex-col gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)] ${mobile ? 'p-4' : 'px-8 py-6'}`}>
                <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">{t('blog.share_post')}</h3>
                <div className="flex flex-col gap-4">
                    {[
                        { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
                        { label: 'Linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, icon: <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 110-4 2 2 0 010 4z"/> },
                        { label: 'Whatsapp', href: `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`, icon: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/> },
                    ].map(({ label, href, icon }) => (
                        <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-4 no-underline text-[#0a0a0a] hover:text-primary transition-colors">
                            <div className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                            </div>
                            <span className="font-['Onest'] font-medium text-lg">{label}</span>
                        </a>
                    ))}
                </div>
            </div>
        </>
    )

    return (
        <PageTemplate fullBleed>
            <div className="min-h-screen bg-[#f3f4f6]">

                {/* Image lightbox */}
                {imageExpanded && thumbnail && (
                    <div
                        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
                        onClick={() => setImageExpanded(false)}
                    >
                        <button
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                            onClick={() => setImageExpanded(false)}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <img src={thumbnail} alt={post.title} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()} />
                    </div>
                )}

                {/* ===== MOBILE LAYOUT ===== */}
                <div className="sm:hidden">
                    {isPublication ? (
                        /* --- Publication mobile: cover + white card + sections --- */
                        <div className="relative min-h-screen">
                            {/* Cover image / PDF behind content */}
                            <div className="absolute inset-x-0 top-0 h-[320px] overflow-hidden">
                                {thumbnail ? (
                                    <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                                ) : primaryDocUrl?.endsWith('.pdf') ? (
                                    <PdfCardFill url={primaryDocUrl} />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)]" />
                                )}
                                <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                            </div>

                            {/* Scrollable content */}
                            <div className="relative pt-[280px] flex flex-col gap-4 pb-24">
                                {/* Main white card */}
                                <div className="bg-[#fffefc] rounded-[24px] px-4 pt-6 pb-6 flex flex-col gap-6">
                                    {/* Back button */}
                                    <button onClick={() => navigate(-1)}
                                        className="inline-flex items-center gap-2 border border-[#d4d4d4] bg-white/80 backdrop-blur rounded-full px-3 py-1.5 text-sm font-['Onest'] font-medium text-[#0a0a0a] shadow-sm w-fit cursor-pointer">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        {t('common.back')}
                                    </button>

                                    {/* Title + author */}
                                    <div className="flex flex-col gap-2">
                                        <h1 className="font-['Onest'] font-semibold text-[30px] leading-[1.2] text-[#0a0a0a] tracking-[-0.6px]">
                                            {post.title}
                                        </h1>
                                        {authorLink ? (
                                            <Link to={authorLink} className="flex items-center gap-2 no-underline w-fit">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* PDF page previews */}
                                    {primaryDocUrl?.endsWith('.pdf') && (
                                        <div className="flex flex-col gap-2 items-center">
                                            <PdfPreview url={primaryDocUrl} pages={2} width={Math.min(window.innerWidth - 32, 358)} />
                                        </div>
                                    )}

                                    {/* Download hint + button */}
                                    {primaryDocUrl && (
                                        <div className="flex flex-col gap-4 items-center">
                                            <p className="font-['Onest'] text-sm text-[#0a0a0a] text-center">
                                                {t('blog.download_hint', 'Descarregue o ficheiro para ler o conteúdo completo.')}
                                            </p>
                                            <a href={primaryDocUrl} download={primaryDoc?.original_filename || primaryDoc?.filename}
                                                className="inline-flex items-center gap-2 border border-[#d4d4d4] font-['Onest'] font-medium text-sm text-[#0a0a0a] px-5 py-2.5 rounded-full shadow-sm hover:bg-[#f3f4f6] transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {t('blog.download_cta', 'Descarregar')}
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Sections below the card */}
                                <div className="px-4 flex flex-col gap-4">
                                    {/* Descrição */}
                                    {post.excerpt && (
                                        <div className="bg-[#fffefc] rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                            <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-[-0.48px]">
                                                {t('blog.description_section', 'Descrição')}
                                            </h2>
                                            <p className="font-['Onest'] font-medium text-sm text-[#0a0a0a] leading-[1.5]">
                                                {post.excerpt}
                                            </p>
                                        </div>
                                    )}

                                    {/* Palavras-Chave */}
                                    {post.keywords?.length > 0 && (
                                        <div className="bg-[#fffefc] rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                            <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-[-0.48px]">
                                                {t('blog.keywords_title', 'Palavras-Chave')}
                                            </h2>
                                            <div className="flex flex-wrap gap-2">
                                                {post.keywords.map((kw, i) => (
                                                    <span key={i} className="font-['Onest'] text-sm text-primary bg-[#f3f4f6] rounded-full px-3 py-1">
                                                        {kw}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Publication link */}
                                    {post.publication_link && (
                                        <div className="bg-[#fffefc] rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                            <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-[-0.48px]">
                                                {t('blog.publication_link', 'Link para a Publicação')}
                                            </h2>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                        <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a] truncate">
                                                        {post.publication_link_label || post.publication_link}
                                                    </span>
                                                </div>
                                                <a href={post.publication_link} target="_blank" rel="noopener noreferrer"
                                                    className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0 hover:bg-black/[0.03] transition-colors">
                                                    <svg className="w-4 h-4 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Opções */}
                                    <div className="bg-[#fffefc] rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                        <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-[-0.48px]">
                                            {t('blog.options_section', 'Opções')}
                                        </h2>
                                        <div className="flex flex-col gap-4">
                                            {primaryDocUrl && (
                                                <a href={primaryDocUrl} download={primaryDoc?.original_filename || primaryDoc?.filename}
                                                    className="flex items-center gap-4 no-underline text-[#0a0a0a]">
                                                    <div className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-['Onest'] font-medium text-lg">{t('blog.download_file', 'Descarregar ficheiro')}</span>
                                                </a>
                                            )}
                                            <div className="flex flex-col gap-0">
                                                <button
                                                    onClick={() => setShareOpen(v => !v)}
                                                    className="flex items-center gap-4 text-[#0a0a0a] cursor-pointer bg-transparent border-0 p-0 text-left w-full"
                                                >
                                                    <div className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </div>
                                                    <span className="font-['Onest'] font-medium text-lg flex-1">{t('blog.share_file', 'Partilhar ficheiro')}</span>
                                                    <svg
                                                        className={`w-4 h-4 text-[#737373] transition-transform duration-300 ${shareOpen ? 'rotate-180' : ''}`}
                                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {/* Accordion */}
                                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${shareOpen ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                                    <div className="flex flex-col gap-3 pl-12">
                                                        {[
                                                            { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, icon: <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/> },
                                                            { label: 'Linkedin', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, icon: <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 110-4 2 2 0 010 4z"/> },
                                                            { label: 'Whatsapp', href: `https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`, icon: <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/> },
                                                        ].map(({ label, href, icon }) => (
                                                            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                                                                className="flex items-center gap-3 no-underline text-[#0a0a0a] hover:text-primary transition-colors">
                                                                <div className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                                                                </div>
                                                                <span className="font-['Onest'] font-medium text-base">{label}</span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ficheiros Anexados */}
                                    {post.attachments?.filter(a => a !== primaryDoc).length > 0 && (
                                        <div className="bg-[#fffefc] rounded-2xl p-4 flex flex-col gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                            <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-[-0.48px]">
                                                {t('blog.attachments_title')}
                                            </h2>
                                            <div className="flex flex-col gap-3">
                                                {post.attachments.filter(a => a !== primaryDoc).map((att, i) => (
                                                    <a key={i} href={blogService.getFileUrl(att.url)} download={att.original_filename || att.filename}
                                                        className="flex items-center justify-between gap-3 no-underline text-[#0a0a0a] hover:opacity-70 transition-opacity">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                </svg>
                                                            </div>
                                                            <span className="font-['Onest'] font-medium text-sm truncate">{att.original_filename || att.filename}</span>
                                                        </div>
                                                        <div className="w-7 h-7 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Author profile */}
                                    {authorLink ? (
                                        <Link to={authorLink} className="bg-[#fffefc] rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)] no-underline hover:shadow-md transition-shadow">
                                            <AuthorAvatar size="sm" />
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <span className="font-['Onest'] font-semibold text-lg text-[#0a0a0a]">{post.author}</span>
                                                <span className="font-['Onest'] text-sm text-[#737373]">{post.author_role || t('blog.researcher_role')}</span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-[#e5e5e5] flex items-center justify-center shadow-sm shrink-0">
                                                <svg className="w-3.5 h-3.5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7v10" />
                                                </svg>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="bg-[#fffefc] rounded-2xl p-4 flex items-center gap-4 shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                            <AuthorAvatar size="sm" />
                                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                                <span className="font-['Onest'] font-semibold text-lg text-[#0a0a0a]">{post.author}</span>
                                                <span className="font-['Onest'] text-sm text-[#737373]">{post.author_role || t('blog.researcher_role')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* --- News-Events mobile: hero image + content card --- */
                        <>
                            {thumbnail ? (
                                <div className="relative w-full">
                                    <img src={thumbnail} alt={post.title} className="w-full h-auto block" />
                                    <div className="absolute inset-0 bg-black/20 pointer-events-none" />
                                    <button
                                        onClick={() => setImageExpanded(true)}
                                        className="absolute bottom-12 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full h-32 bg-gradient-to-br from-primary to-[color:var(--color-primary-hover)]" style={{ marginTop: 'var(--navbar-height)' }} />
                            )}

                            <div className="relative z-10 -mt-8">
                                <div className="bg-[#f3f4f6] rounded-t-[24px] px-4 pt-6 pb-8 flex flex-col gap-6">
                                    <button onClick={() => navigate(-1)}
                                        className="inline-flex items-center gap-2 border border-[#d4d4d4] bg-white/80 backdrop-blur rounded-full px-3 py-1.5 text-sm font-['Onest'] font-medium text-[#0a0a0a] shadow-sm w-fit cursor-pointer">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        {t('common.back')}
                                    </button>

                                    <div className="flex flex-col gap-2">
                                        <h1 className="font-['Onest'] font-semibold text-[30px] leading-[1.2] text-[#0a0a0a] tracking-[-0.6px]">
                                            {post.title}
                                        </h1>
                                        {authorLink ? (
                                            <Link to={authorLink} className="flex items-center gap-2 no-underline w-fit">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </div>
                                        )}
                                    </div>

                                    {post.content && (
                                        <article className="blog-content font-['Onest'] text-[#0a0a0a]">
                                            {parse(post.content, parseOptions)}
                                            <style dangerouslySetInnerHTML={{ __html: articleStyles }} />
                                        </article>
                                    )}

                                    {post.attachments?.filter(a => a !== primaryDoc).length > 0 && (
                                        <section className="border-t border-gray-200 pt-6 flex flex-col gap-4">
                                            <h2 className="font-['Onest'] font-semibold text-xl text-[#0a0a0a]">{t('blog.attachments_title')}</h2>
                                            {post.attachments.filter(a => a !== primaryDoc).map((att, i) => (
                                                <a key={i} href={blogService.getFileUrl(att.url)} download={att.original_filename || att.filename}
                                                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                                                    <svg className="w-5 h-5 text-[#0a0a0a] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{att.original_filename || att.filename}</span>
                                                </a>
                                            ))}
                                        </section>
                                    )}
                                </div>

                                <div className="px-4 pt-6 pb-24 flex flex-col gap-4">
                                    <SidebarCards mobile />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ===== DESKTOP LAYOUT ===== */}
                <div className="hidden sm:block max-w-[1512px] mx-auto px-12 pb-20" style={{ paddingTop: 'calc(var(--navbar-height) + 6rem)' }}>
                    {/* Back button + breadcrumbs */}
                    <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1.5 text-sm font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm shrink-0 cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            {t('common.back')}
                        </button>
                        <nav className="flex items-center gap-2 text-base font-['Onest'] text-[#0a0a0a]">
                            <Link to={backPath} className="hover:underline text-[#737373]">{isPublication ? t('nav.publications') : t('blog.header_title')}</Link>
                            <span className="text-gray-400">/</span>
                            <span className="line-clamp-1">{post.title}</span>
                        </nav>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main content */}
                        <div className="flex-1 min-w-0 bg-[#fffefc] rounded-2xl p-8 flex flex-col gap-14">
                            {/* Header — title, excerpt, meta */}
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                    <h1 className="font-['Onest'] font-semibold text-3xl leading-none text-[#0a0a0a] tracking-tight">
                                        {post.title}
                                    </h1>
                                    {post.excerpt && (
                                        <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a] leading-normal">
                                            {post.excerpt}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        {authorLink ? (
                                            <Link to={authorLink} className="flex items-center gap-3 no-underline">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </Link>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <AuthorAvatar size="sm" />
                                                <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
                                            </div>
                                        )}
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
                                    </div>
                                    {post.tags?.[0] && (
                                        <span className="font-['Onest'] font-medium text-base text-primary bg-[#f3f4f6] rounded-full px-3 py-1">
                                            {TAG_KEY_MAP[post.tags[0]] ? t(TAG_KEY_MAP[post.tags[0]]) : post.tags[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Publication: document preview + download */}
                            {isPublication && primaryDocUrl && (
                                <div className="flex flex-col gap-6 items-center w-full">
                                    {primaryDocUrl.endsWith('.pdf') && (
                                        <PdfFillPreview url={primaryDocUrl} pages={2} />
                                    )}
                                    <p className="font-['Onest'] text-sm text-[#0a0a0a] text-center">
                                        {t('blog.download_hint', 'Descarregue o ficheiro para ler o conteúdo completo.')}
                                    </p>
                                    <a href={primaryDocUrl} download={primaryDoc.original_filename || primaryDoc.filename}
                                        className="inline-flex items-center gap-2 border border-[#d4d4d4] font-['Onest'] font-medium text-base text-[#0a0a0a] px-6 py-3 rounded-full shadow-sm hover:bg-[#f3f4f6] transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        {t('blog.download_cta', 'Descarregar')}
                                    </a>
                                </div>
                            )}

                            {/* Hero image (news-events only) */}
                            {!isPublication && thumbnail && (
                                <div className="w-full rounded-2xl overflow-hidden shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                    <img src={thumbnail} alt={post.title} className="w-full h-auto" />
                                </div>
                            )}

                            {/* Article body — hidden for publications (PDF preview is the content) */}
                            {!isPublication && (
                                <article className="blog-content font-['Onest'] text-[#0a0a0a]">
                                    {parse(post.content, parseOptions)}
                                    <style dangerouslySetInnerHTML={{ __html: articleStyles }} />
                                </article>
                            )}

                            {/* Attachments — exclude primary doc (already shown as PDF preview) */}
                            {post.attachments?.filter(a => a !== primaryDoc).length > 0 && (
                                <section className="border-t border-gray-200 pt-8">
                                    <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-6">{t('blog.attachments_title')}</h2>
                                    <div className="flex flex-col gap-4">
                                        {post.attachments.filter(a => a !== primaryDoc).map((att, i) => (
                                            <a key={i} href={blogService.getFileUrl(att.url)} download={att.original_filename || att.filename}
                                                className="flex items-center gap-4 p-4 bg-[#f3f4f6] rounded-lg hover:bg-gray-200 transition-colors">
                                                <svg className="w-5 h-5 text-[#0a0a0a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="font-['Onest'] font-medium text-[#0a0a0a]">{att.original_filename || att.filename}</span>
                                            </a>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
                            <SidebarCards />
                        </div>
                    </div>
                </div>

            </div>
        </PageTemplate>
    )
}
