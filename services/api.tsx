import { db, auth } from '../firebaseConfig';
import { doc, updateDoc, arrayUnion, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface PerpusItem {
  perpusID: number;
  available: boolean;
}

// Fetch available libraries for a specific book
const getBookAvailability = async (bookID: string) => {
  try {
    if (!bookID) {
      console.error("bookID tidak valid");
      return [];  // Menghentikan fungsi jika bookID tidak valid dan mengembalikan array kosong
    }

    console.log("Mencari ketersediaan buku untuk ID:", bookID);
    const bookDocRef = doc(db, "books", bookID);  // Ambil dokumen buku berdasarkan bookID
    const bookDoc = await getDoc(bookDocRef);

    if (bookDoc.exists()) {
      const bookData = bookDoc.data();  // Ambil data buku
      console.log("Data Buku:", bookData);

      // Pastikan bookData dan bookData.perpus adalah objek yang valid
      if (bookData && Array.isArray(bookData.perpus)) {
        console.log("Data Perpus:", bookData.perpus);

        // Filter pustaka yang tersedia berdasarkan perpusID
        const availableLibraries = bookData.perpus.filter((perpus: PerpusItem) => perpus.available && perpus.perpusID);
        if (availableLibraries.length === 0) {
          console.error("Tidak ada pustaka yang tersedia");
          return [];  // Kembalikan array kosong jika tidak ada pustaka yang tersedia
        } else {
          console.log("Pustaka yang tersedia:", availableLibraries);
          return availableLibraries.map(perpus => perpus.perpusID);  // Kembalikan hanya ID pustaka yang tersedia
        }
      } else {
        console.error("Data perpus tidak ditemukan atau tidak dalam format yang benar");
        return [];  // Kembalikan array kosong jika format data perpus tidak valid
      }
    } else {
      console.error("Buku tidak ditemukan");
      return [];  // Kembalikan array kosong jika buku tidak ditemukan
    }
  } catch (error) {
    console.error("Error in getBookAvailability:", error);
    return [];  // Kembalikan array kosong jika terjadi error
  }
};

// Fetch library details based on library IDs
export async function getLibraries(libraryIDs: number[]) {
  try {
    if (!libraryIDs || libraryIDs.length === 0) {
      console.warn('No library IDs provided.');
      return [];  // Kembalikan array kosong jika tidak ada library ID
    }

    const libraries: any[] = [];
    const perpusRef = collection(db, 'perpus');
    const q = query(perpusRef, where('perpusID', 'in', libraryIDs));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
      libraries.push({
        id: doc.id,
        name: doc.data().name,
        perpusID: doc.data().perpusID,
      });
    });

    return libraries;
  } catch (error) {
    console.error('Error in getLibraries:', error);
    return [];  // Kembalikan array kosong jika terjadi error
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

export { getBookAvailability };
