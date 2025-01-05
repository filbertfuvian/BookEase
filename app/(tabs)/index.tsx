import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { getUser, getAllUsers } from '@/hooks/useUser';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getBooks } from '@/hooks/useBook';

export default function HomeScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [totalPagesRead, setTotalPagesRead] = useState(0);
  const [totalDaysSpent, setTotalDaysSpent] = useState(0);
  const [userRank, setUserRank] = useState(0);
  const [maybeYouLikeBooks, setMaybeYouLikeBooks] = useState([]);
  const [newReleaseBooks, setNewReleaseBooks] = useState([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (user) {
        const data = await getUser(user.uid);
        setProfilePicture(data?.profilePicture || null);
        setUserName(data?.name || null);

        // Menghitung total buku yang telah dibaca dari kolom "completed"
        const completedBooks = data?.completed || [];
        setTotalBooksRead(completedBooks.length);

        // Menghitung total halaman yang telah dibaca dari buku di "completed"
        const books = await getBooks();
        const totalPages = completedBooks.reduce((total, bookId) => {
          const book = books.find(book => book.id === bookId);
          return total + (book ? book.pages : 0);
        }, 0);
        setTotalPagesRead(totalPages);

        // Menghitung total hari yang digunakan dengan pembulatan ke atas
        const createdAt = new Date(data?.createdAt);
        const today = new Date();
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const daysSpent = Math.ceil((today - createdAt) / millisecondsPerDay); 
        setTotalDaysSpent(daysSpent);

        // Menghitung persentil pengguna berdasarkan jumlah buku yang dibaca
        const allUsers = await getAllUsers(); 
        const sortedUsers = allUsers.sort((a, b) => b.totalBooksRead - a.totalBooksRead);
        const rank = sortedUsers.findIndex(u => u.id === user.uid) + 1;
        const percentile = ((sortedUsers.length - rank) / sortedUsers.length) * 100;
        setUserRank(percentile);

        // Menentukan genre yang paling banyak dari buku "completed"
        const genreCounts = {};
        completedBooks.forEach(bookId => {
          const book = books.find(book => book.id === bookId);
          if (book) {
            book.genres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
          }
        });

        const favoriteGenre = completedBooks.length > 0 ? 
          Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b, "") : "";

        // Mendapatkan buku random dari genre yang paling banyak, kecuali buku di "completed"
        const maybeYouLike = completedBooks.length > 0 ? 
          books.filter(book => book.genres.includes(favoriteGenre) && !completedBooks.includes(book.id)).slice(0, 10) :
          books.sort(() => 0.5 - Math.random()).slice(0, 10);
        setMaybeYouLikeBooks(maybeYouLike);
      }
    }
    fetchUserData();
  }, []);

  useEffect(() => {
    async function fetchBooksData() {
      const books = await getBooks();
      setNewReleaseBooks(books.slice(0, 10));
    }
    fetchBooksData();
  }, []);

  const handleBookPress = (book) => {
    router.push({
      pathname: '../reserve/bookDetail',
      params: { title: book.title, genres: JSON.stringify(book.genres) },
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>BookEase</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)}>
              <IconSymbol name="bell.fill" size={32} color="#000" />
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
              <Text style={styles.statValue}>{totalPagesRead}</Text>
              <Text style={styles.statLabel}>Pages Read</Text>
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
          <Text style={styles.sectionTitle}>Maybe You Like</Text>
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
        {showNotifications && (
          <View style={styles.notificationPopup}>
            <Text>Notifications</Text>
          </View>
        )}
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
    top: 60,
    right: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
});
