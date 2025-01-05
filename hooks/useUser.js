import { doc, setDoc, getDoc, getDocs, collection, updateDoc } from 'firebase/firestore';
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

export async function getAllUsers() {
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    querySnapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

export async function updateUser(userId, updatedData) {
  try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updatedData);
      console.log(`User with ID ${userId} has been updated.`);
  } catch (e) {
      console.error('Error updating user data: ', e);
  }
}