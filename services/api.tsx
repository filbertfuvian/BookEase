import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

// Fetch available libraries for a specific book
export async function getBookAvailability(bookID: string) {
  const snapshot = await db
    .collection('bookAvailability')
    .where('bookID', '==', bookID)
    .where('available', '==', true)
    .get();

  // Collect array of perpusIDs that are available for this book
  return snapshot.docs.map((doc) => doc.data().perpusID);
}

export async function getLibraries(libraryIDs: number[]) {
  // Fetch only the library documents matching the available IDs from 'perpus' collection
  const snapshot = await db
    .collection('perpus')
    .where('id', 'in', libraryIDs)
    .get();

  return snapshot.docs.map((doc) => ({ ...doc.data() }));
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