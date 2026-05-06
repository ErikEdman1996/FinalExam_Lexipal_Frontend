import Keycloak from 'keycloak-js';
import { getViteStringEnv } from '../../utils/env';

const keycloak = new Keycloak({
  url: getViteStringEnv('VITE_KEYCLOAK_URL', 'http://localhost:8080'),
  realm: getViteStringEnv('VITE_KEYCLOAK_REALM', 'Lexipal_Realm'),
  clientId: getViteStringEnv('VITE_KEYCLOAK_CLIENT_ID', 'Lexipal_Frontend'),
});

export default keycloak;
