import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

/**
 * Fetches all books from the Firestore 'books' collection.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of book data.
 */

export async function getBooks() {
  try {
    const booksCol = collection(db, 'books');
    const bookSnapshot = await getDocs(booksCol);
    const bookList = bookSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return bookList;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
}

export const getBookById = async (bookID) => {
  const bookRef = doc(db, 'books', bookID);
  const bookDoc = await getDoc(bookRef);
  if (bookDoc.exists()) {
    return bookDoc.data();
  }
  return null;
};

export const getBooksByGenres = async (genres) => {
  const booksRef = collection(db, 'books');
  const q = query(booksRef, where('genres', 'array-contains-any', genres));
  const querySnapshot = await getDocs(q);
  const books = [];
  querySnapshot.forEach((doc) => {
    books.push({ ...doc.data(), id: doc.id });
  });
  return books;
};