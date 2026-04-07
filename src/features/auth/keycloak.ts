import Keycloak from 'keycloak-js';

// Replace these with your actual Keycloak settings
const keycloak = new Keycloak({
  url: 'http://localhost:8080', 
  realm: 'Lexipal_Realm',
  clientId: 'Lexipal_Frontend',
});

export default keycloak;