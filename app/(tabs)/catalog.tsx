import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Image, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { getBooks } from '@/hooks/useBook';

const genresList = [
  'fiction', 'classics', '20th-century', 'non-fiction', 'history', 'literature', 'historical-fiction', 'historical',
  'novels', 'romance', 'short-stories', 'biography', 'adventure', 'fantasy', 'literary-fiction', 'american', 'adult',
  'philosophy', 'school', 'mystery'
];

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(16);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchBooks() {
      const bookList = await getBooks();
      setBooks(bookList);
    }
    fetchBooks();
  }, []);

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = 0;

  // Filter books based on search query and selected genres
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (selectedGenres.length === 0 || selectedGenres.every(genre => book.genres.includes(genre)))
  );

  const currentBooks = filteredBooks.slice(indexOfFirstBook, indexOfLastBook);

  const handleViewMore = () => {
    setBooksPerPage(prevBooksPerPage => prevBooksPerPage + 16);
  };

  interface Book {
    id: string;
    title: string;
    genres: string[];
  }

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prevSelectedGenres: string[]) =>
      prevSelectedGenres.includes(genre)
        ? prevSelectedGenres.filter(g => g !== genre)
        : [...prevSelectedGenres, genre]
    );
  };

  const handleBookPress = (book: Book) => {
    router.push({
      pathname: '../reserve/bookDetail',
      params: {
        bookID: book.id,
        title: book.title,
        genres: JSON.stringify(book.genres)
      }
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Catalog</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton} onPress={() => setModalVisible(true)}>
          <Text>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Book Cards */}
      <ScrollView contentContainerStyle={styles.gridContainer}>
        {currentBooks.map((book) => (
          <TouchableOpacity key={book.id} style={styles.card} onPress={() => handleBookPress(book)}>
            <Image source={require('@/assets/images/book-template.png')} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{book.title}</Text>
            <Text style={styles.cardGenres}>
              {book.genres.slice(0, 3).join(', ')}
            </Text>
          </TouchableOpacity>
        ))}
        {/* View More Button */}
        {indexOfLastBook < filteredBooks.length && (
          <TouchableOpacity style={styles.viewMoreButton} onPress={handleViewMore}>
            <Text style={styles.viewMoreButtonText}>View More</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Genre Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Genres</Text>
            <View style={styles.genresContainer}>
              {genresList.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.genreItem,
                    selectedGenres.includes(item) && styles.genreItemSelected
                  ]}
                  onPress={() => toggleGenre(item)}
                >
                  <Text style={styles.genreText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20
  },
  searchInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 10
  },
  filterButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  card: {
    width: '48%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  cardGenres: {
    fontSize: 14,
    color: '#888'
  },
  viewMoreButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%'
  },
  viewMoreButtonText: {
    color: '#fff',
    fontSize: 16
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  genreItem: {
    padding: 10,
    borderRadius: 8,
    margin: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center'
  },
  genreItemSelected: {
    backgroundColor: '#007BFF'
  },
  genreText: {
    fontSize: 16,
    color: '#000'
  },
  applyButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center'
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16
  }
});