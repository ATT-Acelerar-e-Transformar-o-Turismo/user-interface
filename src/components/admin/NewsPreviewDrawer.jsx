import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import parse from 'html-react-parser';
import { LuX, LuShare2, LuSquarePen } from 'react-icons/lu';
import blogService from '../../services/blogService';
import InitialsAvatar from './InitialsAvatar';
import PostTypePill from './PostTypePill';
import useSlideOver from '../../hooks/useSlideOver';

// Right-side preview drawer to visualize a news item without leaving the
// management list (Figma node 3212:10812). Opened from the eye action.
const drawerStyles = `
  .news-preview-content p { font-size: 15px; line-height: 24px; margin: 0 0 0.75rem 0; white-space: pre-wrap; }
  .news-preview-content h1, .news-preview-content h2, .news-preview-content h3 { font-weight: 600; margin: 1rem 0 0.5rem; }
  .news-preview-content ul { list-style: disc; padding-left: 1.25rem; margin-bottom: 0.75rem; }
  .news-preview-content ol { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
  .news-preview-content img { max-width: 100%; height: auto; border-radius: 0.75rem; margin: 0.75rem 0; }
  .news-preview-content a { color: var(--color-primary); text-decoration: underline; }
`;

export default function NewsPreviewDrawer({ post, onClose, onEdit, onShare }) {
  const { t } = useTranslation();
  const { requestClose, backdropClass, panelClass } = useSlideOver(onClose);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = 'unset';
    };
  }, [requestClose]);

  if (!post) return null;

  const thumb = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className={backdropClass} onClick={requestClose} aria-hidden />

      {/* Panel */}
      <aside className={`relative h-full w-full max-w-[440px] bg-[#fffefc] shadow-2xl flex flex-col font-['Onest'] ${panelClass}`}>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="flex justify-end">
            <button type="button" onClick={requestClose} aria-label={t('common.close', 'Fechar')} className="text-[#404040] hover:text-[#0a0a0a] cursor-pointer">
              <LuX className="w-5 h-5" strokeWidth={1.75} />
            </button>
          </div>

          {thumb && (
            <div className="w-full rounded-2xl overflow-hidden">
              <img src={thumb} alt={post.title} className="w-full h-auto object-cover" />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <InitialsAvatar name={post.author} photoUrl={post.author_photo ? blogService.getFileUrl(post.author_photo) : null} size="sm" />
              <span className="font-medium text-[14px] text-[#0a0a0a]">{post.author}</span>
            </div>
            <span className="text-[14px] text-[#737373]">{blogService.formatDate(post.published_at || post.created_at)}</span>
            <PostTypePill post={post} />
          </div>

          <h2 className="font-semibold text-[22px] leading-[1.2] text-[#0a0a0a] tracking-[-0.3px]">
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="font-medium text-[15px] leading-6 text-[#404040] whitespace-pre-line">{post.excerpt}</p>
          )}

          {post.content && (
            <div className="news-preview-content text-[#0a0a0a]">
              {parse(post.content)}
              <style dangerouslySetInnerHTML={{ __html: drawerStyles }} />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#e5e5e5] p-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex items-center justify-center h-10 px-5 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[15px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer"
          >
            {t('common.close', 'Fechar')}
          </button>
          <div className="flex items-center gap-3">
            {onShare && (
              <button
                type="button"
                onClick={onShare}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[#d4d4d4] bg-[#fffefc] font-medium text-[15px] text-[#0a0a0a] shadow-sm hover:bg-black/[0.03] transition-colors cursor-pointer"
              >
                <LuShare2 className="w-4 h-4" strokeWidth={1.75} />
                {t('admin.blog.share', 'Partilhar notícia')}
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#009368] hover:bg-[#007d57] font-medium text-[15px] text-[#fffefc] transition-colors cursor-pointer"
            >
              <LuSquarePen className="w-4 h-4" strokeWidth={1.75} />
              {t('admin.blog.edit_news', 'Editar notícia')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

NewsPreviewDrawer.propTypes = {
  post: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onShare: PropTypes.func,
};
