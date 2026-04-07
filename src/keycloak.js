import Keycloak from 'keycloak-js'

const keycloak = new Keycloak({
  url: '/auth',
  realm: 'att',
  clientId: 'att-frontend'
})

let initPromise = null

export function initKeycloak() {
  if (!initPromise) {
    initPromise = keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
      pkceMethod: 'S256'
    })
  }
  return initPromise
}

export default keycloak
