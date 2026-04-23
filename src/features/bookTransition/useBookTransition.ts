import { useContext } from 'react';
import { BookTransitionContext } from './BookTransitionStore';

export function useBookTransition() {
  const context = useContext(BookTransitionContext);

  if (!context) {
    throw new Error('useBookTransition must be used within BookTransitionProvider.');
  }

  return context;
}
