import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { getUser, getAllUsers } from '@/hooks/useUser';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getBooks, getBooksByGenres, getBookById } from '@/hooks/useBook';
import { Timestamp } from 'firebase/firestore';

export default function HomeScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [totalDaysSpent, setTotalDaysSpent] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [maybeYouLikeBooks, setMaybeYouLikeBooks] = useState<any[]>([]);
  const [newReleaseBooks, setNewReleaseBooks] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [completedBooks, setCompletedBooks] = useState([]);
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (user) {
        const data = await getUser(user.uid);
        setProfilePicture(data?.profilePicture || null);
        setUserName(data?.name || null);

        // Get total points
        setTotalPoints(data?.totalPoints || 0);

        // Get completed books
        const completedBooks = data?.completed || [];
        setCompletedBooks(completedBooks);
        setTotalBooksRead(completedBooks.length);

        // Calculate total days spent
        if (data?.createdAt) {
          const createdAtTimestamp = data.createdAt.seconds * 1000; // Firestore Timestamp to milliseconds
          const createdAtDate = new Date(createdAtTimestamp);
          const today = new Date();
          const millisecondsPerDay = 1000 * 60 * 60 * 24;
          const daysSpent = Math.ceil((today - createdAtDate) / millisecondsPerDay); 
          setTotalDaysSpent(daysSpent);
        }

        // Calculate user rank
        const allUsers = await getAllUsers();
        const sortedUsers = allUsers.sort((a, b) => b.totalBooksRead - a.totalBooksRead);
        const rank = sortedUsers.findIndex(u => u.id === user.uid) + 1;
        const percentile = ((sortedUsers.length - rank) / sortedUsers.length) * 100;
        setUserRank(percentile);
      }
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    async function fetchBookRecommendations() {
      if (completedBooks.length > 0) {
        // Determine most frequent genres from completed books
        const genreCounts: { [key: string]: number } = {};
        for (const completedBook of completedBooks) {
          const book = await getBookById(completedBook.bookID);
          if (book) {
            book.genres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
          }
        }

        const favoriteGenres = Object.keys(genreCounts)
          .sort((a, b) => genreCounts[b] - genreCounts[a])
          .slice(0, 3); // Limit to top 3 genres
        setFavoriteGenres(favoriteGenres);

        // Fetch books from favorite genres for 'Maybe You Like' section
        const maybeYouLikeBooksData = await getBooksByGenres(favoriteGenres);
        setMaybeYouLikeBooks(maybeYouLikeBooksData);
      }
    }
    fetchBookRecommendations();
  }, [completedBooks]);

  useEffect(() => {
    async function fetchBooksData() {
      const books = await getBooks();
      setNewReleaseBooks(books.slice(0, 10));
    }
    fetchBooksData();
  }, []);

  const checkDueDates = async () => {
    const user = auth.currentUser;
    if (user) {
      const userData = await getUser(user.uid);
      const currentlyBorrowing = userData?.currentlyBorrowing || [];
      
      const now = new Date();
      const dayInMs = 24 * 60 * 60 * 1000;
      
      const dueNotifications = await Promise.all(currentlyBorrowing
        .filter(book => {
          const dueDate = book.dueDate instanceof Timestamp ? 
            book.dueDate.toDate() : 
            new Date(book.dueDate);
          const timeLeft = dueDate.getTime() - now.getTime();
          return timeLeft > 0 && timeLeft <= dayInMs;
        })
        .map(async book => {
          const bookDetails = await getBookById(book.bookID);
          const dueDate = book.dueDate instanceof Timestamp ? book.dueDate.toDate() : new Date(book.dueDate);
          return {
            id: book.bookID,
            message: `Book '${bookDetails?.title}' is due in less than 24 hours!`,
            dueDate: dueDate.toLocaleString() // Convert to readable date string
          };
        }));
  
      setNotifications(dueNotifications);
      setNotificationCount(dueNotifications.length);
    }
  };

  useEffect(() => {
    checkDueDates();
    const interval = setInterval(checkDueDates, 1800000); // Check every 30 minutes
    return () => clearInterval(interval);
  }, []);

  const handleBookPress = (book) => {
    router.push({
      pathname: '../reserve/bookDetail',
      params: {
        bookID: book.id,
        title: book.title,
        genres: JSON.stringify(book.genres)
      }
    });
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity key={item.id} style={styles.card} onPress={() => handleBookPress(item)}>
      <Image source={require('@/assets/images/book-template.png')} style={styles.cardImage} />
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardGenres}>
        {item.genres.slice(0, 3).join(', ')}
      </Text>
    </TouchableOpacity>
  );

  const renderNotifications = () => (
    <View style={styles.notificationPopup}>
      <Text style={styles.notificationTitle}>Notifications</Text>
      {notifications.length > 0 ? (
        notifications.map(notif => (
          <View key={notif.id} style={styles.notificationItem}>
            <Text style={styles.notificationMessage}>{notif.message}</Text>
            <Text style={styles.notificationDate}>
              Due: Tommorow
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.noNotifications}>No notifications</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BookEase</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)}>
              <IconSymbol name="bell.fill" size={32} color="#000" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Link href="/profile" asChild>
              <TouchableOpacity>
                {profilePicture ? (
                  <Image source={{ uri: profilePicture }} style={styles.profilePic} />
                ) : (
                  <Image source={require('@/assets/images/profile.png')} style={styles.profilePic} />
                )}
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Hello User */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hello, {userName}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalBooksRead}</Text>
              <Text style={styles.statLabel}>Books Read</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDaysSpent}</Text>
              <Text style={styles.statLabel}>Days Spent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>Top {userRank.toFixed(2)}%</Text>
              <Text style={styles.statLabel}>of Readers</Text>
            </View>
          </View>
        </View>

        {/* Maybe You Like */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Since You like {favoriteGenres.join(', ')}</Text>
          <FlatList
            horizontal
            data={maybeYouLikeBooks}
            keyExtractor={item => item.id}
            renderItem={renderBookItem}
            contentContainerStyle={styles.flatListContainer}
          />
        </View>

        {/* New Release */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>New Release</Text>
          <FlatList
            horizontal
            data={newReleaseBooks}
            keyExtractor={item => item.id}
            renderItem={renderBookItem}
            contentContainerStyle={styles.flatListContainer}
          />
        </View>

        {/* Notifications Popup */}
        {showNotifications && renderNotifications()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  flatListContainer: {
    paddingLeft: 16,
  },
  card: {
    width: 175,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    marginHorizontal: 5,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardGenres: {
    fontSize: 14,
    color: '#888',
  },
  notificationPopup: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  notificationItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
  },
  noNotifications: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bookItem: {
    marginRight: 15,
  },
  bookCover: {
    width: 100,
    height: 150,
    borderRadius: 5,
  },
  bookTitle: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
});