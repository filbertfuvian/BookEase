import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, FlatList, Alert } from 'react-native';
import { getAllUsers, updateUser } from '@/hooks/useUser';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

interface Book {
  bookID: string;
  perpusID: number;
  pickupDate?: Date;      // for booksToBePickedUp
  reserveTime?: number;   // for booksToBePickedUp
  bookPoint: number;
  dueDate?: Date;         // for currentlyBorrowing
}

interface User {
  id: string;
  name: string;
  email: string;
  booksToBePickedUp?: Book[];
  currentlyBorrowing?: Book[];
  completed?: Book[];
  createdAt: Date;
  totalPoints?: number;
}

export default function AdminScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    const allUsers = await getAllUsers();
    const processedUsers = allUsers.map((u: User) => {
      const booksToBePickedUp = u.booksToBePickedUp?.map((b) => ({
        ...b,
        pickupDate: b.pickupDate instanceof Timestamp ? b.pickupDate.toDate() : new Date(b.pickupDate),
      }));
      const currentlyBorrowing = u.currentlyBorrowing?.map((b) => ({
        ...b,
        dueDate: b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate),
      }));
      const completed = u.completed?.map((b) => ({
        ...b,
        dueDate: b.dueDate instanceof Timestamp ? b.dueDate.toDate() : new Date(b.dueDate),
      }));
      return { ...u, booksToBePickedUp, currentlyBorrowing, completed };
    });
    setUsers(processedUsers);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const refreshPage = async () => {
    await fetchUsers();
  };

  const handleBookPickedUp = async (user: User, book: Book) => {
    if (!user.booksToBePickedUp) return;

    try {
      // Update book availability first
      const bookRef = doc(db, 'books', book.bookID);
      const bookDoc = await getDoc(bookRef);
      
      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        const perpusList = bookData.perpus || [];
        
        // Update availability for matching perpusID
        const updatedPerpusList = perpusList.map((p: any) => {
          if (p.perpusID === book.perpusID) {
            return { ...p, available: false };
          }
          return p;
        });

        // Update book document
        await updateDoc(bookRef, {
          perpus: updatedPerpusList
        });

        // Remove from booksToBePickedUp
        const newBooksToBePickedUp = user.booksToBePickedUp.filter(
          (b) => b.bookID !== book.bookID
        );

        // Add to currentlyBorrowing with validated data
        const borrowingBook = {
          bookID: book.bookID,
          perpusID: book.perpusID,
          bookPoint: book.bookPoint || 0,
          dueDate: new Date(Date.now() + (book.reserveTime || 7) * 24 * 60 * 60 * 1000)
        };

        // Update user data
        const updatedUser = {
          ...user,
          booksToBePickedUp: newBooksToBePickedUp,
          currentlyBorrowing: [...(user.currentlyBorrowing || []), borrowingBook]
        };

        await updateUser(user.id, updatedUser);
        await refreshPage();
      }
    } catch (error) {
      console.error('Error picking up book:', error);
      Alert.alert('Error', 'Failed to pick up book. Please try again.');
    }
  };

  const handleBookReturned = async (user: User, book: Book) => {
    if (!user.currentlyBorrowing) return;

    try {
      // Update book availability first
      const bookRef = doc(db, 'books', book.bookID);
      const bookDoc = await getDoc(bookRef);
      
      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        const perpusList = bookData.perpus || [];
        
        // Update availability for matching perpusID
        const updatedPerpusList = perpusList.map((p: any) => {
          if (p.perpusID === book.perpusID) {
            return { ...p, available: true };
          }
          return p;
        });

        // Update book document
        await updateDoc(bookRef, {
          perpus: updatedPerpusList
        });
      }

      // Continue with existing book return logic
      const newCurrentlyBorrowing = user.currentlyBorrowing.filter((b) => b.bookID !== book.bookID);
      const newCompleted = [
        ...(user.completed || []),
        {
          bookID: book.bookID,
          perpusID: book.perpusID,
          dueDate: book.dueDate instanceof Date ? book.dueDate : new Date(book.dueDate),
          bookPoint: book.bookPoint,
        },
      ];

      const updatedUser = {
        ...user,
        currentlyBorrowing: newCurrentlyBorrowing,
        completed: newCompleted,
        totalPoints: (user.totalPoints || 0) + book.bookPoint,
      };

      await updateUser(user.id, updatedUser);
      await refreshPage();
    } catch (error) {
      console.error('Error returning book:', error);
      Alert.alert('Error', 'Failed to return book. Please try again.');
    }
  };

  const renderBooksToBePickedUp = (user: User) => (
    <FlatList
      data={user.booksToBePickedUp}
      keyExtractor={(item) => item.bookID}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.bookInfo}>
            <Text style={styles.bookText}>Book ID: {item.bookID}</Text>
            <Text style={styles.bookText}>Perpus ID: {item.perpusID}</Text>
            <Text style={styles.bookText}>Pickup Due Date: {item.pickupDate instanceof Date ? item.pickupDate.toLocaleDateString() : 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.pickupButton} onPress={() => handleBookPickedUp(user, item)}>
            <Text style={styles.buttonText}>Picked Up</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const renderCurrentlyBorrowing = (user: User) => (
    <FlatList
      data={user.currentlyBorrowing}
      keyExtractor={(item) => item.bookID}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.bookInfo}>
            <Text style={styles.bookText}>Book ID: {item.bookID}</Text>
            <Text style={styles.bookText}>Perpus ID: {item.perpusID}</Text>
            <Text style={styles.bookText}>Due Date: {item.dueDate instanceof Date ? item.dueDate.toLocaleDateString() : 'N/A'}</Text>
          </View>
          <TouchableOpacity style={styles.returnedButton} onPress={() => handleBookReturned(user, item)}>
            <Text style={styles.buttonText}>Returned</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );

  const renderCompleted = (user: User) => (
    <FlatList
      data={user.completed}
      keyExtractor={(item) => item.bookID}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.bookInfo}>
            <Text style={styles.bookText}>Book ID: {item.bookID}</Text>
            <Text style={styles.bookText}>Perpus ID: {item.perpusID}</Text>
            <Text style={styles.bookText}>Total Points: {item.bookPoint}</Text>
          </View>
        </View>
      )}
    />
  );

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedUser(item);
        setModalVisible(true);
      }}
      style={styles.userItem}
    >
      <Text style={styles.userName}>{item.name}</Text>
      <Text style={styles.userEmail}>{item.email}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Screen</Text>
      </View>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUserItem}
      />
      <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
          {selectedUser && (
            <View style={styles.modalContent}>
              <Text style={styles.userName}>{selectedUser.name}</Text>

              <Text style={styles.sectionTitle}>Books to Be Picked Up</Text>
              {renderBooksToBePickedUp(selectedUser)}

              <Text style={styles.sectionTitle}>Currently Borrowing</Text>
              {renderCurrentlyBorrowing(selectedUser)}

              <Text style={styles.sectionTitle}>Completed</Text>
              {renderCompleted(selectedUser)}
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    marginBottom: 20
  },
  backButton: {
    marginRight: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a'
  },
  userItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4
  },
  userEmail: {
    fontSize: 14,
    color: '#666'
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  bookInfo: {
    flex: 1
  },
  bookText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#333'
  },
  pickupButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  returnedButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    paddingTop: 40
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 40,
    padding: 8
  },
  closeText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600'
  },
  modalContent: {
    marginTop: 50
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginVertical: 16,
    color: '#1a1a1a'
  }
});