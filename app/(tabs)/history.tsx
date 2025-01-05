import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseConfig';
import { getUser } from '@/hooks/useUser';
import { getBooks } from '@/hooks/useBook';
import { getLibraries } from '../../services/api';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'borrowing' | 'completed'>('waiting');
  const [waitingBooks, setWaitingBooks] = useState([]);
  const [borrowingBooks, setBorrowingBooks] = useState([]);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [books, setBooks] = useState([]);
  const [libraries, setLibraries] = useState([]);

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
          console.error("Tidak ada data perpustakaan yang ditemukan.");
          return;
        }

        const formatBookData = (bookArray) => {
          return bookArray.map(book => {
            const bookInfo = booksData.find(b => b.id === book.bookID);
            const libraryInfo = librariesData.find(l => l.perpusID === book.perpusID);
            return {
              ...book,
              title: bookInfo?.title || 'Unknown Title',
              libraryName: libraryInfo?.name || 'Unknown Library'
            };
          });
        };

        setWaitingBooks(formatBookData(data?.booksToBePickedUp || []));
        setBorrowingBooks(formatBookData(data?.currentlyBorrowing || []));
        setCompletedBooks(formatBookData(data?.completed || []));
      }
    }
    fetchData();
  }, [libraries]);

  const calculateTimeLeft = (pickupDate) => {
    const now = new Date();
    const diff = new Date(pickupDate) - now;

    if (diff <= 0) {
      return {
        expired: true,
        timeLeft: 'Expired'
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 1) {
      return { expired: false, timeLeft: `${days} days left` };
    } else if (hours > 1) {
      return { expired: false, timeLeft: `${hours} hours left` };
    } else if (minutes >= 1) {
      return { expired: false, timeLeft: `${minutes} minutes left` };
    } else {
      return { expired: false, timeLeft: 'Less than 1 minute left' };
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
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.bold}>{item.title}</Text>
                <Text>{item.libraryName}</Text>
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
          const { expired, timeLeft } = calculateTimeLeft(item.pickupDate);
          const timeLeftStyle = expired ? styles.warning : styles.timeLeft;
          return (
            <View style={styles.item}>
              <View>
                <Text style={styles.bold}>{item.title}</Text>
                <Text>{item.libraryName}</Text>
              </View>
              {expired ? (
                <Text style={styles.warning}>Warning</Text>
              ) : (
                <Text style={timeLeftStyle}>{timeLeft}</Text>
              )}
            </View>
          );
        }}
      />
    );
  };

  const renderCompleted = () => (
    <FlatList
      data={completedBooks}
      keyExtractor={(item) => item.bookID.toString()}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View>
            <Text style={styles.bold}>{item.title}</Text>
            <Text>{item.libraryName}</Text>
          </View>
          <Text>{item.bookPoint} points</Text>
        </View>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          onPress={() => setActiveTab('waiting')} 
          style={[styles.tabButton, activeTab === 'waiting' && styles.activeTab]}
        >
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tabText}>
            Waiting to be Picked Up
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('borrowing')} 
          style={[styles.tabButton, activeTab === 'borrowing' && styles.activeTab]}
        >
          <Text numberOfLines={1} ellipsizeMode="tail" style={styles.tabText}>
            Currently Borrowing
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
    marginBottom: 16, 
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  tabButton: { 
    width: '32%',
    padding: 8, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 8,
    alignItems: 'center'
  },
  activeTab: { backgroundColor: '#ddd' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  bold: { fontWeight: 'bold' },
  timeLeft: { color: 'black' },
  expired: { color: 'red', fontWeight: 'bold' },
  warning: { color: 'red', fontWeight: 'bold' },
  tabText: {
    fontSize: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4
  }
});
