import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router/routes.ts';
import { AuthProvider } from './features/auth/AuthProvider.tsx';
import { ThemeProvider } from './features/theme/ThemeProvider.tsx';
import { BookTransitionProvider } from './features/bookTransition/BookTransitionContext.tsx';
import './styles/index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BookTransitionProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" closeButton richColors />
        </BookTransitionProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
