import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button.tsx';
import type { CreateBookRequest } from '../api/api';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (book: CreateBookRequest) => Promise<void> | void;
}

export function AddBookModal({ isOpen, onClose, onAdd }: AddBookModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedAuthor = author.trim();
    const parsedTotalPages = Number(totalPages);

    if (!trimmedTitle || !trimmedAuthor || !Number.isInteger(parsedTotalPages) || parsedTotalPages < 1) {
      setSubmitError('Enter a title, author, and a total page count of at least 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onAdd({
        title: trimmedTitle,
        author: trimmedAuthor,
        totalPages: parsedTotalPages,
      });
      setTitle('');
      setAuthor('');
      setTotalPages('');
      onClose();
    } catch (error) {
      console.error('Error adding book:', error);
      setSubmitError('Could not add book. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[28px] w-full max-w-md p-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#2C3E50]">Add New Book</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-[#6C757D]" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm text-[#2C3E50] mb-2">
              Book Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
              placeholder="Enter book title"
              required
            />
          </div>
          
          <div>
            <label htmlFor="author" className="block text-sm text-[#2C3E50] mb-2">
              Author
            </label>
            <input
              id="author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
              placeholder="Enter author name"
              required
            />
          </div>
          
          <div>
            <label htmlFor="pages" className="block text-sm text-[#2C3E50] mb-2">
              Total Pages
            </label>
            <input
              id="pages"
              type="number"
              value={totalPages}
              onChange={(e) => setTotalPages(e.target.value)}
              className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#A8E6CF] focus:border-transparent transition-all"
              placeholder="Enter total pages"
              min="1"
              required
            />
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Book'}
            </Button>
          </div>

          {submitError ? (
            <p className="text-sm text-[#FF6B6B] mt-2">{submitError}</p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
