import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import blogService from '../../services/blogService';
import { useTranslation } from 'react-i18next';

const defaultAvatar = "/assets/figma/blog-avatar-1.png";
const defaultThumbnail = "/assets/figma/blog-thumb-1.png";

function BlogPostCard({ post, delay = 0 }) {
    const navigate = useNavigate();
    const { i18n } = useTranslation();
    const image = post.thumbnail_url ? blogService.getFileUrl(post.thumbnail_url) : defaultThumbnail;
    const avatar = defaultAvatar;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(i18n.language === 'pt' ? 'pt-PT' : 'en-GB', { month: 'short', year: 'numeric' });
    };

    const handleClick = () => {
        navigate(`/news-events/${post.id}`);
    };

    return (
        <div className="bg-white rounded-[16px] p-6 md:p-8 shadow-sm flex flex-col gap-4 md:gap-6 h-full min-w-[300px] md:min-w-[350px] max-w-[456px]" data-aos="fade-up" data-aos-delay={delay} data-aos-offset="-50">
            <div className="h-[200px] md:h-[240px] rounded-[8px] overflow-hidden">
                <img src={image} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>

            <div className="flex items-start justify-between gap-4">
                <h3 className="font-['Onest'] font-semibold text-[20px] lg:text-[24px] leading-tight text-[#0a0a0a] line-clamp-2">{post.title}</h3>
                <button
                    onClick={handleClick}
                    className="bg-gray-100 rounded-full p-2 w-[32px] h-[32px] md:w-[36px] md:h-[36px] flex items-center justify-center hover:bg-gray-200 shrink-0"
                >
                    <i className="fa-solid fa-arrow-up-right-from-square text-[#0a0a0a] text-xs md:text-sm"></i>
                </button>
            </div>

            <p className="font-['Onest'] font-normal text-[14px] leading-relaxed text-[#0a0a0a] line-clamp-3">
                {post.excerpt}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={post.author} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover" />
                    <span className="font-['Onest'] font-medium text-[14px] text-[#0a0a0a]">{post.author}</span>
                </div>
                <span className="font-['Onest'] font-medium text-[14px] text-[#0a0a0a]">{formatDate(post.published_at)}</span>
            </div>
        </div>
    );
}

BlogPostCard.propTypes = {
    post: PropTypes.shape({
        id: PropTypes.number.isRequired,
        title: PropTypes.string.isRequired,
        excerpt: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        published_at: PropTypes.string.isRequired,
        thumbnail_url: PropTypes.string,
    }).isRequired,
    delay: PropTypes.number,
};

export default function BlogSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const data = await blogService.getPublishedPosts(0, 3);
        setPosts(data);
      } catch (err) {
        setError(err.message);
        console.error('Failed to load blog posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleViewAll = () => {
    navigate('/news-events');
  };

  return (
    <div className="relative w-full pt-16 pb-20 md:pb-32">
      <div className="max-w-[1512px] mx-auto px-6 md:px-12">
        <div className="text-center mb-12 md:mb-16" data-aos="fade-down" data-aos-offset="-50">
            <h2 className="font-['Onest'] font-semibold text-[32px] md:text-[40px] lg:text-[48px] text-[#0a0a0a] mb-4">
            {t('blog.section_title')}
            </h2>
            <p className="font-['Onest'] font-normal text-[16px] md:text-[20px] lg:text-[24px] text-[#0a0a0a] max-w-4xl mx-auto">
            {t('blog.section_subtitle')}
            </p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}

        {error && (
          <div className="text-center py-12 text-red-600">
            <p>{t('blog.error_loading', { error })}</p>
          </div>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="flex overflow-x-auto pb-12 gap-6 md:gap-8 snap-x">
            {posts.map((post, index) => (
              <BlogPostCard
                key={post.id}
                post={post}
                delay={100 + (index * 150)}
              />
            ))}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>{t('blog.no_posts_published')}</p>
          </div>
        )}

        <div className="flex justify-center mt-4 md:mt-8" data-aos="fade-up" data-aos-delay="500" data-aos-offset="-500">
             <button
               onClick={handleViewAll}
               className="bg-transparent border-2 border-[#d4d4d4] text-[#0a0a0a] px-6 py-3 md:px-8 md:py-3 rounded-full hover:bg-white hover:border-transparent hover:shadow-md transition-all"
             >
              <span className="font-['Onest'] font-medium text-[18px] lg:text-[24px]">{t('blog.view_all_articles')}</span>
            </button>
        </div>
      </div>
    </div>
  );
}
