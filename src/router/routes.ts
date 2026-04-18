import { createBrowserRouter } from 'react-router-dom';
import Library from '../pages/Library.tsx';
import BookDetails from '../pages/BookDetails.tsx';
import ReadingSession from '../pages/ReadingSession.tsx';
import Codex from '../pages/Codex.tsx';
import Challenge from '../pages/Challenge.tsx';
import Flashcard from '../pages/Flashcard.tsx';
import Profile from '../pages/Profile.tsx';
import Landing from '../pages/Landing.tsx';
import { ProtectedRoute } from '../features/auth/ProtectedRoute.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Landing,
  },
  {
    Component: ProtectedRoute,
    children: [
      { path: '/library', Component: Library },
      { path: '/book/:bookId', Component: BookDetails },
      { path: '/book/:bookId/session/new', Component: ReadingSession },
      { path: '/codex', Component: Codex },
      { path: '/codex/page/:pageNumber', Component: Codex },
      { path: '/challenges', Component: Challenge },
      { path: '/challenges/flashcard', Component: Flashcard },
      { path: '/profile', Component: Profile },
      { path: '*', Component: Library },
    ],
  },
]);
