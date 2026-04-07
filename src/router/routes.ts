import { createBrowserRouter } from 'react-router-dom';
import Library from '../pages/Library.tsx';
import BookDetails from '../pages/BookDetails.tsx';
import ReadingSession from '../pages/ReadingSession.tsx';
import Codex from '../pages/Codex.tsx';
import Profile from '../pages/Profile.tsx';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [
      { index: true, Component: Library },
      { path: 'library', Component: Library },
      { path: 'book/:bookId', Component: BookDetails },
      { path: 'book/:bookId/session/new', Component: ReadingSession },
      { path: 'codex', Component: Codex },
      { path: 'challenges', Component: Library },
      { path: 'profile', Component: Profile },
      { path: '*', Component: Library },
    ],
  },
]);
