import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageTemplate from './PageTemplate'
import LoadingSkeleton from '../components/LoadingSkeleton'
import ErrorDisplay from '../components/ErrorDisplay'
import blogService from '../services/blogService'
import hljs from 'highlight.js'
import parse from 'html-react-parser'
import BlogIndicatorWidget from '../components/BlogIndicatorWidget'

const FALLBACK_THUMBS = [
    '/assets/figma/hero-rect-1.png',
    '/assets/figma/hero-rect-2.png',
    '/assets/figma/hero-rect-3.png',
    '/assets/figma/about-rect-1.png',
    '/assets/figma/about-rect-2.png',
]

export default function BlogPostPage() {
    const { postId } = useParams()
    const [post, setPost] = useState(null)
    const [relatedPosts, setRelatedPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

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
            setPost(postData)
            // Load related posts
            try {
                const all = await blogService.getPublishedPosts(0, 10)
                const posts = Array.isArray(all) ? all : (all?.posts || [])
                setRelatedPosts(posts.filter(p => p.id !== postId).slice(0, 3))
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
                        <h1 className="font-['Onest'] text-2xl font-bold text-[#0a0a0a] mb-4">Post não encontrado</h1>
                        <Link to="/news-events" className="bg-[#009368] text-white px-6 py-2 rounded-full hover:bg-[#007a56]">
                            Voltar
                        </Link>
                    </div>
                </div>
            </PageTemplate>
        )
    }

    const thumbnail = post.thumbnail_url
        ? blogService.getFileUrl(post.thumbnail_url)
        : FALLBACK_THUMBS[Math.abs(postId?.charCodeAt(0) || 0) % FALLBACK_THUMBS.length]

    return (
        <PageTemplate>
            <div className="min-h-screen bg-[#f3f4f6]">
                <div className="max-w-[1512px] mx-auto px-12 pb-20">
                    {/* Back button */}
                    <Link
                        to="/news-events"
                        className="inline-flex items-center gap-2 border border-[#d4d4d4] rounded-full px-3 py-1 text-sm font-['Onest'] font-medium text-[#0a0a0a] hover:bg-white/60 shadow-sm mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar
                    </Link>

                    {/* Breadcrumbs */}
                    <nav className="flex items-center gap-2 text-base font-['Onest'] text-[#0a0a0a] mb-6">
                        <Link to="/news-events" className="hover:underline">Noticias e Eventos</Link>
                        <span className="text-gray-400">/</span>
                        <span className="underline underline-offset-4">{post.title}</span>
                    </nav>

                    {/* Two-column layout */}
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main content */}
                        <div className="flex-1 bg-[#fffefc] rounded-2xl p-8 flex flex-col gap-14">
                            {/* Header: title, excerpt, meta */}
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
                                {/* Author + date + tag */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#009368] to-[#00855d] flex items-center justify-center text-white font-bold">
                                                {(post.author || 'A')[0].toUpperCase()}
                                            </div>
                                            <span className="font-['Onest'] font-medium text-sm text-[#0a0a0a]">{post.author}</span>
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
                                    </div>
                                    {post.tags?.[0] && (
                                        <span className="font-['Onest'] font-medium text-base text-[#009368] bg-[#f3f4f6] rounded-full px-3 py-1">
                                            {post.tags[0]}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Hero image */}
                            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-[0_0_3px_2px_rgba(0,0,0,0.05)]">
                                <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                            </div>

                            {/* Article body */}
                            <article className="blog-content font-['Onest'] text-[#0a0a0a]">
                                {parse(post.content, parseOptions)}
                                <style dangerouslySetInnerHTML={{ __html: `
                                    .blog-content h1 { font-size: 2rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; line-height: 1; letter-spacing: -0.32px; }
                                    .blog-content h2 { font-size: 2rem; font-weight: 600; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1; letter-spacing: -0.32px; }
                                    .blog-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; line-height: 1.2; }
                                    .blog-content p { font-size: 18px; font-weight: 500; line-height: 24px; margin-bottom: 1rem; }
                                    .blog-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
                                    .blog-content ol { list-style-type: decimal; padding-left: 3rem; margin-bottom: 1rem; }
                                    .blog-content ol > li { font-size: 2rem; font-weight: 600; line-height: 1; letter-spacing: -0.32px; margin-bottom: 1.5rem; }
                                    .blog-content li { margin-bottom: 0.5rem; }
                                    .blog-content blockquote { border-left: 4px solid #009368; padding-left: 1rem; font-style: italic; color: #4b5563; margin: 1.5rem 0; background-color: #f3f4f6; padding: 1rem; border-radius: 0.375rem; }
                                    .blog-content a { color: #009368; text-decoration: underline; font-weight: 500; }
                                    .blog-content img { max-width: 100%; height: auto; border-radius: 1rem; margin: 1.5rem 0; }
                                    .blog-content pre { background: #0d0d0d; color: #fff; font-family: monospace; padding: 0.75rem 1rem; border-radius: 0.5rem; margin: 1.5rem 0; overflow-x: auto; }
                                    .blog-content pre code { color: inherit; padding: 0; background: none; font-size: 0.875rem; }
                                `}} />
                            </article>

                            {/* Attachments */}
                            {post.attachments?.length > 0 && (
                                <section className="border-t border-gray-200 pt-8">
                                    <h2 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] mb-6">Arquivos Anexos</h2>
                                    <div className="flex flex-col gap-4">
                                        {post.attachments.map((att, i) => (
                                            <a
                                                key={i}
                                                href={blogService.getFileUrl(att.url)}
                                                download={att.original_filename || att.filename}
                                                className="flex items-center gap-4 p-4 bg-[#f3f4f6] rounded-lg hover:bg-gray-200 transition-colors"
                                            >
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
                        <div className="lg:w-[456px] shrink-0 flex flex-col gap-6">
                            {/* Author card */}
                            <div className="bg-[#fffefc] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-[0_0_3px_rgba(0,0,0,0.05)]">
                                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-[#009368] to-[#00855d] flex items-center justify-center text-white text-5xl font-bold">
                                    {(post.author || 'A')[0].toUpperCase()}
                                </div>
                                <div className="text-center flex flex-col gap-2">
                                    <h3 className="font-['Onest'] font-semibold text-3xl text-[#0a0a0a] tracking-tight">{post.author}</h3>
                                    <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a]">Investigador ROOTS</p>
                                </div>
                            </div>

                            {/* Keywords */}
                            {post.tags?.length > 0 && (
                                <div className="bg-[#fffefc] rounded-2xl px-8 py-6 flex flex-col gap-4">
                                    <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">Keywords</h3>
                                    <p className="font-['Onest'] font-medium text-lg text-[#0a0a0a]">
                                        {post.tags.join(', ')}
                                    </p>
                                </div>
                            )}

                            {/* Related publications */}
                            {relatedPosts.length > 0 && (
                                <div className="bg-[#fffefc] rounded-2xl px-8 py-6 flex flex-col gap-8 shadow-[0_0_3px_rgba(0,0,0,0.05)]">
                                    <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">Publicações Relacionadas</h3>
                                    <div className="flex flex-col gap-4">
                                        {relatedPosts.map((rp, i) => (
                                            <Link
                                                key={rp.id}
                                                to={`/news-events/${rp.id}`}
                                                className="flex gap-5 items-start no-underline hover:opacity-80 transition-opacity"
                                            >
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                    <img
                                                        src={rp.thumbnail_url ? blogService.getFileUrl(rp.thumbnail_url) : FALLBACK_THUMBS[i % FALLBACK_THUMBS.length]}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-['Onest'] font-medium text-lg text-[#0a0a0a] line-clamp-1">{rp.title}</span>
                                                    <span className="font-['Onest'] text-sm text-[#0a0a0a]">{rp.excerpt ? `${rp.excerpt.slice(0, 60)}...` : ''}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Share */}
                            <div className="bg-[#fffefc] rounded-2xl px-8 py-6 flex flex-col gap-4">
                                <h3 className="font-['Onest'] font-semibold text-2xl text-[#0a0a0a] tracking-tight">Partilhar Publicação</h3>
                                <div className="flex flex-col gap-4">
                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 no-underline text-[#0a0a0a] hover:text-[#009368] transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                                        </div>
                                        <span className="font-['Onest'] font-medium text-lg">Facebook</span>
                                    </a>
                                    <a
                                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 no-underline text-[#0a0a0a] hover:text-[#009368] transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
                                        </div>
                                        <span className="font-['Onest'] font-medium text-lg">Linkedin</span>
                                    </a>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(post.title + ' ' + shareUrl)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-4 no-underline text-[#0a0a0a] hover:text-[#009368] transition-colors"
                                    >
                                        <div className="w-9 h-9 rounded-lg border border-[#e5e5e5] flex items-center justify-center shadow-sm">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
                                        </div>
                                        <span className="font-['Onest'] font-medium text-lg">Whatsapp</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTemplate>
    )
}
