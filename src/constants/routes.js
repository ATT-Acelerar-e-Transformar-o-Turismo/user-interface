export const ROUTES = {
  HOME: '/',
  INDICATORS: '/indicators',
  DOMAIN: (domainName) => `/${domainName.toLowerCase().replace(/\s+/g, '-')}`,
  BLOG: '/blog',
  BLOG_POST: (postId) => `/blog/${postId}`,
  ADMIN: {
    DOMAINS: '/admin/domains',
    INDICATORS: '/admin/indicators',
    RESOURCES: '/admin/resources',
    USERS: '/admin/users',
    BLOG: '/admin/blog',
    BLOG_NEW: '/admin/blog/new',
    BLOG_EDIT: (postId) => `/admin/blog/edit/${postId}`,
  },
  FAVORITES: '/favorites',
};
