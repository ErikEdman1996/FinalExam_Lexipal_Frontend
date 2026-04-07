import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import keycloak from './features/auth/keycloak.ts'
import { router } from './router/routes.ts'
import './styles/index.css'

keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).then((authenticated) => {
  if (authenticated) {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    )
  } else {
    window.location.reload();
  }
}).catch(() => {
  console.error("Authenticated Failed");
});