export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  DOMAINS: {
    BASE: '/api/domains',
    BY_ID: (id) => `/api/domains/${id}`,
  },
  INDICATORS: {
    BASE: '/api/indicators',
    BY_ID: (id) => `/api/indicators/${id}`,
    BY_DOMAIN: (domainId) => `/api/indicators/domain/${domainId}`,
    BY_SUBDOMAIN: (domainId, subdomain) => `/api/indicators/domain/${domainId}/subdomain/${encodeURIComponent(subdomain)}`,
    COUNT: '/api/indicators/count',
    COUNT_BY_DOMAIN: (domainId) => `/api/indicators/domain/${domainId}/count`,
    COUNT_BY_SUBDOMAIN: (domainId, subdomain) => `/api/indicators/domain/${domainId}/subdomain/${encodeURIComponent(subdomain)}/count`,
    SEARCH: '/api/indicators/search',
    CREATE: (domainId, subdomain) => `/api/indicators/${domainId}/${encodeURIComponent(subdomain)}/`,
    RESOURCES: (indicatorId) => `/api/indicators/${indicatorId}/resources`,
    RESOURCES_BY_ID: (indicatorId, resourceId) => `/api/indicators/${indicatorId}/resources/${resourceId}`,
    DATA: (indicatorId) => `/api/indicators/${indicatorId}/data`,
    EXPORT_IMAGE: (indicatorId) => `/api/indicators/${indicatorId}/export/image`,
  },
  BLOG: {
    POSTS: '/api/blog/posts',
    POST_BY_ID: (postId) => `/api/blog/posts/${postId}`,
    ADMIN_POSTS: '/api/blog/admin/posts',
    ADMIN_POST_BY_ID: (postId) => `/api/blog/admin/posts/${postId}`,
    THUMBNAIL: (postId) => `/api/blog/admin/posts/${postId}/thumbnail`,
    ATTACHMENTS: (postId) => `/api/blog/admin/posts/${postId}/attachments`,
    ATTACHMENT_BY_NAME: (postId, filename) => `/api/blog/admin/posts/${postId}/attachments/${filename}`,
    UPLOAD_THUMBNAIL: '/api/blog/admin/upload/thumbnail',
    UPLOAD_ATTACHMENT: '/api/blog/admin/upload/attachment',
  },
  RESOURCES: {
    BASE: '/api/resources',
    BY_ID: (id) => `/api/resources/${id}`,
  },
  USERS: {
    BASE: '/api/users',
    BY_ID: (id) => `/api/users/${id}`,
  },
  UPLOADS: {
    DOMAIN_ICONS: '/uploads/domain-icons/upload',
    DOMAIN_IMAGES: '/uploads/domain-images/upload',
  },
};
