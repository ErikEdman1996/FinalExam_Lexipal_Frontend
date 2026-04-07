import { useEffect, useState } from 'react';
import { UserProfile } from './components/UserProfile';
import { getBooks, type ApiBook } from './api/api';

function App() {
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [loading, setLoading] = useState(true);

// ... inside the component ...
useEffect(() => {
    getBooks() // Call the function directly
      .then((data) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("API Error:", err);
        setLoading(false);
      });
}, []);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <UserProfile />
      <h1>📚 Lexipal Library</h1>
      
      {loading ? (
        <p>Loading your books...</p>
      ) : (
        <div style={{ display: 'grid', gap: '15px' }}>
          {books.map((book) => (
            <div key={book.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '10px' }}>
              <h3>{book.title}</h3>
              <p>By {book.author}</p>
              <div style={{ background: '#eee', borderRadius: '5px', height: '10px' }}>
                <div style={{ 
                  width: `${(book.readPages / book.totalPages) * 100}%`, 
                  background: '#4caf50', 
                  height: '100%',
                  borderRadius: '5px' 
                }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
