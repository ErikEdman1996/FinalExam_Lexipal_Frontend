import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCard, type BookData } from '../components/BookCard.tsx';
import { BottomNav } from '../components/BottomNav.tsx';
import { AddBookModal } from '../components/AddBookModal.tsx';
import { Plus } from 'lucide-react';
import { createBook, getBooks, type ApiBook, type CreateBookRequest } from '../api/api';

type BookStatus = 'active' | 'completed' | 'archived';

interface LibraryBook extends BookData {
  status: BookStatus;
}

function mapApiStatusToUiStatus(status: ApiBook['status']): BookStatus {
  if (status === 'COMPLETED') {
    return 'completed';
  }

  if (status === 'ARCHIVED') {
    return 'archived';
  }

  return 'active';
}

function mapBackendBookToLibraryBook(book: ApiBook): LibraryBook {
  const safeTotalPages = book.totalPages > 0 ? book.totalPages : 1;
  const safeReadPages = Math.max(0, Math.min(book.readPages, safeTotalPages));
  const sessionCount = typeof book.sessionCount === 'number'
    ? Math.max(0, Math.floor(book.sessionCount))
    : Array.isArray(book.sessions)
      ? book.sessions.length
      : 0;

  return {
    id: String(book.id),
    title: book.title,
    author: book.author,
    pagesRead: safeReadPages,
    totalPages: safeTotalPages,
    sessions: sessionCount,
    status: mapApiStatusToUiStatus(book.status),
  };
}

export default function Library() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<BookStatus>('active');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBooks = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const apiBooks = await getBooks();

        if (isMounted) {
          setBooks(apiBooks.map(mapBackendBookToLibraryBook));
        }
      } catch (error) {
        console.error('Error loading books:', error);
        if (isMounted) {
          setErrorMessage('Could not load books from backend.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadBooks();

    return () => {
      isMounted = false;
    };
  }, []);
  
  const handleAddBook = async (newBook: CreateBookRequest) => {
    const createdBook = await createBook(newBook);
    setBooks((previousBooks) => [...previousBooks, mapBackendBookToLibraryBook(createdBook)]);
    setActiveTab('active');
  };
  
  const tabs: { id: BookStatus; label: string }[] = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'archived', label: 'Archived' },
  ];
  
  const filteredBooks = books.filter((book) => book.status === activeTab);
  
  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-[rgba(0,0,0,0.08)] sticky top-0 z-10">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#2C3E50]">My Library</h1>
            <p className="text-sm text-[#6C757D] mt-1">Keep reading! 📚</p>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-[12px] transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[#A8E6CF] text-[#2C3E50] font-medium shadow-[0_2px_8px_rgba(168,230,207,0.3)]'
                    : 'bg-transparent text-[#6C757D] hover:bg-[#F0F2F5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Books Grid */}
      <div className="max-w-[480px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-[#6C757D] text-lg">Loading books...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-16">
            <p className="text-[#FF6B6B] text-lg">{errorMessage}</p>
            <p className="text-sm text-[#6C757D] mt-2">Check backend connection and try again.</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6C757D] text-lg">No books in {activeTab} list</p>
            <p className="text-sm text-[#6C757D] mt-2">Add a new book to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} onClick={() => navigate(`/book/${book.id}`)} />
            ))}
          </div>
        )}
      </div>
      
      {/* FAB - Add Book */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#FFD3B6] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(255,211,182,0.4)] hover:shadow-[0_6px_20px_rgba(255,211,182,0.5)] active:scale-95 transition-all duration-200 z-40"
      >
        <Plus size={28} className="text-[#2C3E50]" strokeWidth={2.5} />
      </button>
      
      {/* Bottom Navigation */}
      <BottomNav />
      
      {/* Add Book Modal */}
      <AddBookModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddBook} />
    </div>
  );
}