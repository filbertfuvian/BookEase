import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc, updateDoc, arrayUnion, FieldValue } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

const db = getFirestore();

export function useRewards() {
  const [rewards, setRewards] = useState([]);
  const [points, setPoints] = useState(0);
  const [pointsHistory, setPointsHistory] = useState([]);

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const userData = docSnap.data();
          const history = userData.pointsHistory || [];
          setPointsHistory(history);

          const totalPoints = history.reduce((total, entry) => {
            return entry.type === 'addition' ? total + entry.points : total - entry.points;
          }, 0);

          setPoints(totalPoints);
        }
      }
    }
    
    async function fetchRewards() {
      const querySnapshot = await getDocs(collection(db, 'rewards'));
      const rewardsData = [];
      querySnapshot.forEach(doc => {
        rewardsData.push({ id: doc.id, ...doc.data() });
      });
      setRewards(rewardsData);
    }

    fetchUserData();
    fetchRewards();
  }, []);

  const updatePoints = async (amount, description, type) => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const transaction = {
        type: type,
        points: amount,
        activity: description,
        date: new Date().toISOString()
      };

      if (type === 'addition') {
        await updateDoc(userRef, {
          totalPoints: FieldValue.increment(amount),
          pointsHistory: arrayUnion(transaction)
        });
        setPoints(prevPoints => prevPoints + amount);
      } else if (type === 'deduction') {
        await updateDoc(userRef, {
          totalPoints: FieldValue.increment(-amount),
          pointsHistory: arrayUnion(transaction)
        });
        setPoints(prevPoints => prevPoints - amount);
      }

      setPointsHistory(prevHistory => [
        ...prevHistory,
        transaction
      ]);
    }
  };

  return { rewards, points, pointsHistory, updatePoints };
}
