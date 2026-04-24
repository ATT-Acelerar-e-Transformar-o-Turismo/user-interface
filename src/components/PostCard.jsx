import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import blogService from '../services/blogService';
import { PdfCardFill } from './PdfPreview';

export default function PostCard({ post: rawPost, compact = false, catName, basePath }) {
    const { t, i18n } = useTranslation();
    const en = i18n.language?.startsWith('en');
    const post = { ...rawPost, title: (en && rawPost.title_en) || rawPost.title, excerpt: (en && rawPost.excerpt_en) || rawPost.excerpt };
    const isPublication = post.post_type === 'publication';
    const resolvedBase = basePath || (isPublication ? '/publications' : '/news-events');
    const thumbnail = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null;
    const primaryDoc = !thumbnail && post.attachments
        ? post.attachments.find(a => /\.pdf$/i.test(a.filename || a.original_filename || ''))
        : null;
    const primaryDocUrl = primaryDoc ? blogService.getFileUrl(primaryDoc.url) : null;

    return (
        <Link
            to={`${resolvedBase}/${post.id}`}
            className="bg-[#fffefc] flex flex-col gap-4 p-4 sm:p-6 rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_3px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow no-underline h-full"
        >
            <div className="w-full h-[160px] sm:h-[200px] rounded sm:rounded-lg overflow-hidden bg-gray-100">
                {thumbnail ? (
                    <img src={thumbnail} alt={post.title} className="w-full h-full object-cover" />
                ) : primaryDocUrl ? (
                    <PdfCardFill url={primaryDocUrl} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#737373] bg-[#f3f4f6]">
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
                <p className="font-['Onest'] text-xs text-[#0a0a0a] leading-relaxed line-clamp-3 sm:line-clamp-4">
                    {post.excerpt}
                </p>
            )}

            <div className="flex items-center justify-between gap-2 mt-auto min-w-0">
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
            </div>
            {catName && post.categories?.length > 0 && (
                <div className="flex flex-wrap gap-2 min-w-0">
                    {post.categories.map((slug, i) => (
                        <span key={i} className="font-['Onest'] font-medium text-xs text-primary bg-[#f3f4f6] rounded-full px-2 py-0.5 truncate max-w-full">
                            {catName(slug)}
                        </span>
                    ))}
                </div>
            )}
        </Link>
    );
}

PostCard.propTypes = {
    post: PropTypes.object.isRequired,
    compact: PropTypes.bool,
    catName: PropTypes.func,
    basePath: PropTypes.string,
};
