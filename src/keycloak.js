import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: '/auth',
  realm: 'att',
  clientId: 'att-frontend'
})

let initPromise = null

const TOKEN_KEYS = {
  token: 'kc_token',
  refreshToken: 'kc_refreshToken',
  idToken: 'kc_idToken',
}

export function storeTokens(accessToken, refreshToken, idToken) {
  sessionStorage.setItem(TOKEN_KEYS.token, accessToken)
  sessionStorage.setItem(TOKEN_KEYS.refreshToken, refreshToken)
  if (idToken) sessionStorage.setItem(TOKEN_KEYS.idToken, idToken)
}

export function clearStoredTokens() {
  sessionStorage.removeItem(TOKEN_KEYS.token)
  sessionStorage.removeItem(TOKEN_KEYS.refreshToken)
  sessionStorage.removeItem(TOKEN_KEYS.idToken)
}

export function initKeycloak() {
  if (!initPromise) {
    const initOptions = {
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    }

    const storedToken = sessionStorage.getItem(TOKEN_KEYS.token)
    const storedRefreshToken = sessionStorage.getItem(TOKEN_KEYS.refreshToken)
    const storedIdToken = sessionStorage.getItem(TOKEN_KEYS.idToken)

    if (storedToken && storedRefreshToken) {
      initOptions.token = storedToken
      initOptions.refreshToken = storedRefreshToken
      initOptions.idToken = storedIdToken
    }

    initPromise = keycloak.init(initOptions)
  }
  return initPromise
}

export default keycloak
