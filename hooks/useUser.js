import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';


export async function addUser(userId, userData) {
    try {
      await setDoc(doc(db, 'users', userId), userData);
      console.log('User data written with ID: ', userId);
    } catch (e) {
      console.error('Error adding user data: ', e);
    }
}


export async function getUser(userId) {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        console.log('No such document!');
        return null;
    }
}