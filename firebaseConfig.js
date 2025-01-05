import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: 'AIzaSyDSwR7-zHvNd2VeAw8MGk-530C9vcZEmPk',
  authDomain: 'book-ease-ffa7f.firebaseapp.com',
  projectId: 'book-ease-ffa7f',
  storageBucket: 'book-ease-ffa7f.firebasestorage.app',
  messagingSenderId: '360858297727',
  appId: '1:360858297727:android:84c816f41de078932aa64a',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);