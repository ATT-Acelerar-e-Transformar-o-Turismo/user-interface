export const APP_CONFIG = {
  NAME: 'ROOTS Platform',
  DEFAULT_ITEMS_PER_PAGE: 10,
  DEFAULT_SORT_ORDER: 'asc',
  DEFAULT_SORT_BY: 'name',
  MIN_SEARCH_QUERY_LENGTH: 1,
  DATE_FORMAT: 'pt-BR',
  DATE_OPTIONS: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
};

// Feature toggles. FAVORITES hides the heart button on indicator cards, the
// /favorites route and the "sort by favourites" options — flip to true to
// bring the whole feature back.
export const FEATURES = {
  FAVORITES: false,
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
