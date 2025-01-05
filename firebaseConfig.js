import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyDiJDhbyiG2S4XUFKsqaMHnU5T0No8hC9M',
  authDomain: 'bookease3.firebaseapp.com',
  projectId: 'bookease3',
  storageBucket: 'bookease3.firebasestorage.app',
  messagingSenderId: '93846558641',
  appId: '1:93846558641:android:5fe7d850726927051a8f90',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
