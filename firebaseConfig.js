import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyACuDOqVel6OdBSEE6HSQ1092nSMfPZm4Y',
  authDomain: 'bookease2-1d725.firebaseapp.com',
  projectId: 'bookease2-1d725',
  storageBucket: 'bookease2-1d725.firebasestorage.app',
  messagingSenderId: '221878713212',
  appId: '1:221878713212:android:5383e8fe71110dddce42f9',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
