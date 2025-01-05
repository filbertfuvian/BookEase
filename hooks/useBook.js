import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

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