import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { getUser } from '@/hooks/useUser';
import { getBooks } from '@/hooks/useBook';
import { getLibraries } from '../../services/api';
import { Timestamp } from 'firebase/firestore';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'borrowing' | 'completed'>('waiting');
  const [waitingBooks, setWaitingBooks] = useState([]);
  const [borrowingBooks, setBorrowingBooks] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [books, setBooks] = useState([]);
  const [libraries, setLibraries] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const user = auth.currentUser;
      if (user) {
        const data = await getUser(user.uid);
        const booksData = await getBooks();
        setBooks(booksData);

        const libraryIDs = [
          ...new Set([
            ...(data?.booksToBePickedUp || []).map(book => book.perpusID),
            ...(data?.currentlyBorrowing || []).map(book => book.perpusID),
            ...(data?.completed || []).map(book => book.perpusID),
          ])
        ];
        
        const librariesData = await getLibraries(libraryIDs);
        if (!librariesData || librariesData.length === 0) {
          setLibraries([]);
        } else {
          setLibraries(librariesData);
        }

        setWaitingBooks(data?.booksToBePickedUp || []);
        setBorrowingBooks(data?.currentlyBorrowing || []);
        setCompletedBooks(data?.completed || []);
      }
    }
    fetchData();
  }, []);

  const calculateTimeLeft = (dueDate) => {
    const now = new Date();
    const due = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);

    const diffInMs = due.getTime() - now.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) {
      return { expired: false, timeLeft: `${diffInDays} days left` };
    } else if (diffInHours > 0) {
      return { expired: false, timeLeft: `${diffInHours} hours left` };
    } else if (diffInMinutes > 0) {
      return { expired: false, timeLeft: `${diffInMinutes} minutes left` };
    } else {
      return { expired: true, timeLeft: 'Less than 1 minute left' };
    }
  };

  const renderWaiting = () => {
    return (
      <FlatList
        data={waitingBooks}
        keyExtractor={(item) => item.bookID.toString()}
        renderItem={({ item }) => {
          const { expired, timeLeft } = calculateTimeLeft(item.pickupDate);
          const timeLeftStyle = expired ? styles.expired : styles.timeLeft;
          const book = books.find(b => b.id === item.bookID);
          const library = libraries.find(l => l.perpusID === item.perpusID);
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.bold}>{book?.title || 'Unknown Title'}</Text>
                <Text>{library?.name || 'Unknown Library'}</Text>
              </View>
              {expired ? (
                <Text style={styles.expired}>Reservation Expired</Text>
              ) : (
                <Text style={timeLeftStyle}>{timeLeft}</Text>
              )}
            </View>
          );
        }}
      />
    );
  };

  const renderBorrowing = () => {
    return (
      <FlatList
        data={borrowingBooks}
        keyExtractor={(item) => item.bookID.toString()}
        renderItem={({ item }) => {
          const { expired, timeLeft } = calculateTimeLeft(item.dueDate);
          const timeLeftStyle = expired ? styles.expired : styles.timeLeft;
          const book = books.find(b => b.id === item.bookID);
          const library = libraries.find(l => l.perpusID === item.perpusID);
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.bold}>{book?.title || 'Unknown Title'}</Text>
                <Text>{library?.name || 'Unknown Library'}</Text>
              </View>
              {expired ? (
                <Text style={styles.expired}>Due Date Passed</Text>
              ) : (
                <Text style={timeLeftStyle}>{timeLeft}</Text>
              )}
            </View>
          );
        }}
      />
    );
  };

  const renderCompleted = () => {
    return (
      <FlatList
        data={completedBooks}
        keyExtractor={(item) => item.bookID.toString()}
        renderItem={({ item }) => {
          const book = books.find(b => b.id === item.bookID);
          const library = libraries.find(l => l.perpusID === item.perpusID);
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.bold}>{book?.title || 'Unknown Title'}</Text>
                <Text>{library?.name || 'Unknown Library'}</Text>
              </View>
              <Text style={styles.completed}>Completed</Text>
            </View>
          );
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('waiting')} 
          style={[styles.tabButton, activeTab === 'waiting' && styles.activeTab]}
        >
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tabText}>
            Waiting
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('borrowing')} 
          style={[styles.tabButton, activeTab === 'borrowing' && styles.activeTab]}
        >
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tabText}>
            Borrowing
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('completed')} 
          style={[styles.tabButton, activeTab === 'completed' && styles.activeTab]}
        >
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tabText}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        {activeTab === 'waiting' && 'Waiting to be Picked Up'}
        {activeTab === 'borrowing' && 'Currently Borrowing'}
        {activeTab === 'completed' && 'Completed'}
      </Text>

      {activeTab === 'waiting' && renderWaiting()}
      {activeTab === 'borrowing' && renderBorrowing()}
      {activeTab === 'completed' && renderCompleted()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 16,
    paddingTop: 40  
  },
  title: { fontSize: 20, marginBottom: 16, fontWeight: 'bold' },
  tabContainer: { 
    flexDirection: 'row',
    marginBottom: 16
  },
  tabButton: { 
    flex: 1, 
    padding: 12, 
    alignItems: 'center', 
    borderBottomWidth: 2, 
    borderBottomColor: 'transparent' 
  },
  activeTab: { 
    borderBottomColor: '#000' 
  },
  tabText: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 16 
  },
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee' 
  },
  bold: { 
    fontWeight: 'bold' 
  },
  expired: { 
    color: 'red' 
  },
  timeLeft: { 
    color: 'green' 
  },
  completed: { 
    color: 'blue' 
  }
});
