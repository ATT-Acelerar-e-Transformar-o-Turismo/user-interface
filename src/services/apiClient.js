import axios from 'axios';
import keycloak, { storeTokens, clearStoredTokens } from '../keycloak';
import { showError } from '../utils/toast';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Use relative URLs since nginx handles routing
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
    // Let the browser set Content-Type with boundary for FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (keycloak.authenticated) {
      try {
        await keycloak.updateToken(30);
        storeTokens(keycloak.token, keycloak.refreshToken, keycloak.idToken);
      } catch {
        clearStoredTokens();
        window.location.href = '/admin/login';
        return Promise.reject(new Error('Token refresh failed'));
      }
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      requestData: error.config?.data
    });

    // FastAPI/Pydantic return `detail` as a string, or — for 422 validation
    // errors — an array of { type, loc, msg, input } objects. Callers drop
    // userMessage straight into JSX, so coerce to a string here to avoid
    // React error #31 ("objects are not valid as a React child").
    const rawDetail = error.response?.data?.detail;
    let derived;
    if (typeof rawDetail === 'string') {
      derived = rawDetail;
    } else if (Array.isArray(rawDetail)) {
      derived = rawDetail
        .map(e => {
          if (!e || typeof e !== 'object') return String(e);
          const loc = Array.isArray(e.loc) ? e.loc.join('.') : e.loc;
          return loc ? `${loc}: ${e.msg || 'invalid'}` : (e.msg || JSON.stringify(e));
        })
        .join('; ');
    } else if (rawDetail && typeof rawDetail === 'object') {
      derived = rawDetail.msg || JSON.stringify(rawDetail);
    }

    error.userMessage = derived ||
                        error.response?.data?.message ||
                        error.message ||
                        'An unexpected error occurred';

    // Surface the error to the user via a global toast so failures don't go
    // silently unnoticed. Callers that show their own modal/banner still see
    // the rejected promise and can dedupe — the toast is an extra safety net.
    //
    // Skip:
    //  - 401: auth layer redirects to login; a toast would be confusing.
    //  - Requests explicitly opted out via `{ suppressErrorToast: true }`.
    //  - Canceled requests (navigation, aborted fetches).
    const status = error.response?.status;
    const suppressed = error.config?.suppressErrorToast;
    const canceled = axios.isCancel ? axios.isCancel(error) : error.code === 'ERR_CANCELED';
    if (!suppressed && !canceled && status !== 401) {
      const method = (error.config?.method || 'request').toUpperCase();
      const url = error.config?.url || '';
      const prefix = status ? `${status} ${method} ${url}` : `${method} ${url}`;
      showError(`${prefix} — ${error.userMessage}`, 7000);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
