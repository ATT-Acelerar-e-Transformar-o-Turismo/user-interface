export const APP_CONFIG = {
  NAME: 'ATT Platform',
  DEFAULT_ITEMS_PER_PAGE: 10,
  DEFAULT_SORT_ORDER: 'asc',
  DEFAULT_SORT_BY: 'name',
  MIN_SEARCH_QUERY_LENGTH: 2,
  DATE_FORMAT: 'pt-BR',
  DATE_OPTIONS: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  RESOURCES: 'resources',
  THEME: 'theme',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
