export const ROUTES = {
  HOME: '/',
  INDICATORS: '/indicators',
  DOMAIN: (domainName) => `/${domainName.toLowerCase().replace(/\s+/g, '-')}`,
  BLOG: '/news-events',
  BLOG_POST: (postId) => `/news-events/${postId}`,
  ADMIN: {
    DOMAINS: '/admin/domains',
    INDICATORS: '/admin/indicators',
    RESOURCES: '/admin/resources',
    USERS: '/admin/users',
    BLOG: '/admin/news-events',
    BLOG_NEW: '/admin/news-events/create',
    BLOG_EDIT: (postId) => `/admin/news-events/edit/${postId}`,
  },
  FAVORITES: '/favorites',
};
