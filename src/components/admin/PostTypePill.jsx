import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

// Derives a post's "type" for the Tipo column / preview drawer.
// News-events are tagged 'Eventos' (event) vs everything else (notícia);
// publications get their own label. Matches Figma node 2903:18787.
export function postTypeKey(post) {
  if ((post?.post_type || 'news-event') === 'publication') return 'publication';
  const tags = Array.isArray(post?.tags) ? post.tags : [];
  return tags.includes('Eventos') ? 'event' : 'news';
}

const STYLES = {
  news: 'bg-[#1d4ed8]',
  event: 'bg-[#92400e]',
  publication: 'bg-[#009368]',
};

export default function PostTypePill({ post }) {
  const { t } = useTranslation();
  const key = postTypeKey(post);
  const label = key === 'event'
    ? t('admin.blog.type_event', 'Evento')
    : key === 'publication'
      ? t('admin.blog.type_publication', 'Publicação')
      : t('admin.blog.type_news', 'Notícia');

  return (
    <span className={`inline-flex items-center justify-center ${STYLES[key]} rounded-full px-3 py-1.5 font-['Onest'] font-medium text-[14px] text-[#fffefc] whitespace-nowrap`}>
      {label}
    </span>
  );
}

PostTypePill.propTypes = {
  post: PropTypes.object.isRequired,
};
