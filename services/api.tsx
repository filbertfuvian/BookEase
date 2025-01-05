import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';

interface PerpusItem {
  perpusID: number;
  available: boolean;
}

// Fetch available libraries for a specific book
export async function getBookAvailability(bookID: string) {
  try {
    const bookRef = doc(db, 'books', bookID);
    const bookDoc = await getDoc(bookRef);
    
    if (!bookDoc.exists()) {
      return [];
    }

    const bookData = bookDoc.data();
    if (!bookData || !bookData.perpus) {
      return [];
    }

    const perpusList: PerpusItem[] = bookData.perpus;
    return perpusList
      .filter(p => p && p.available)
      .map(p => p.perpusID);

  } catch (error) {
    console.error('Error in getBookAvailability:', error);
    return [];
  }
}

// Fetch library details based on library IDs
export async function getLibraries(libraryIDs: number[]) {
  try {
    if (!libraryIDs?.length) {
      return [];
    }
    
    const libraries = [];
    for (const id of libraryIDs) {
      const perpusRef = doc(db, 'perpus', id.toString());
      const perpusDoc = await getDoc(perpusRef);
      if (perpusDoc.exists()) {
        libraries.push({
          id: Number(perpusDoc.id),
          name: perpusDoc.data().name
        });
      }
    }
    return libraries;
  } catch (error) {
    console.error('Error in getLibraries:', error);
    return [];
  }
}

// Update user reservations
export async function updateUserReservations(reservation: {
  bookID: string;
  perpusID: number;
  pickupDate: Date;
  reserveTime: number;
  bookPoint: number;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    booksToBePickedUp: arrayUnion(reservation)
  });
}