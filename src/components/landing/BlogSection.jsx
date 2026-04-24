import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import blogService from '../../services/blogService';
import { useTranslation } from 'react-i18next';
import PostCard from '../PostCard';

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
      <div className="max-w-[1512px] mx-auto px-4 md:px-12">
        <div className="text-left lg:text-center mb-8 md:mb-16" data-aos="fade-down" data-aos-offset="-50">
            <h2 className="font-['Onest'] font-semibold text-[32px] md:text-[40px] lg:text-[48px] text-[#0a0a0a] mb-2 lg:mb-4">
            {t('blog.section_title')}
            </h2>
            <p className="font-['Onest'] font-normal text-[16px] md:text-[20px] lg:text-[24px] text-[#0a0a0a] max-w-4xl lg:mx-auto">
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
          <>
            {/* Mobile: single card */}
            <div className="sm:hidden flex justify-center pb-12">
              <div className="w-full max-w-[400px]" data-aos="fade-up" data-aos-delay={100}>
                <PostCard post={posts[0]} />
              </div>
            </div>
            {/* Desktop: horizontal scroll */}
            <div className="hidden sm:block overflow-x-auto pb-12 snap-x">
              <div className="flex items-stretch gap-6 md:gap-8 w-max mx-auto">
                {posts.map((post, index) => (
                  <div
                    key={post.id}
                    className="w-[350px] md:w-[400px] shrink-0 snap-start"
                    data-aos="fade-up"
                    data-aos-delay={100 + (index * 150)}
                  >
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            </div>
          </>
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
