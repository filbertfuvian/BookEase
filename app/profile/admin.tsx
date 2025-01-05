import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, FlatList } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getAllUsers, updateUser } from '@/hooks/useUser'; // Update sesuai kebutuhan
import { useRouter } from 'expo-router';

export default function AdminScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null); // Untuk menampilkan detail buku
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    }
    fetchUsers();
  }, []);

  const handleBookStatusChange = async (bookId: string, status: string) => {
    if (selectedUser) {
      const updatedBooks = selectedUser.booksToBePickedUp.map((book: any) => {
        if (book.bookId === bookId) {
          return { ...book, status }; // Mengupdate status
        }
        return book;
      });
      
      await updateUser(selectedUser.id, { booksToBePickedUp: updatedBooks });
      setSelectedUser({ ...selectedUser, booksToBePickedUp: updatedBooks });
    }
  };

  const renderBookItem = ({ item }: any) => {
    return (
      <View style={styles.bookItem}>
        <Text style={styles.bookTitle}>{item.bookId}</Text>
        <Text style={styles.bookLibrary}>{item.library}</Text>
        <Text style={styles.bookDueDate}>Due Date: {item.pickupDueDate.toDate().toDateString()}</Text>

        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleBookStatusChange(item.bookId, 'currently')}>
            <Text>Currently</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleBookStatusChange(item.bookId, 'completed')}>
            <Text>Completed</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Panel</Text>
      </View>

      {/* List Users */}
      <FlatList
        data={users}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userCard}
            onPress={() => handleUserClick(item)}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Modal: Detail Buku */}
      <Modal
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        animationType="slide">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setModalVisible(false)}>
            <IconSymbol name="x" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Books Borrowed by {selectedUser?.name}</Text>

          <FlatList
            data={selectedUser?.booksToBePickedUp || []}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.bookId}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userCard: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  bookItem: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookLibrary: {
    fontSize: 14,
    color: '#555',
  },
  bookDueDate: {
    fontSize: 12,
    color: '#888',
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statusButton: {
    backgroundColor: '#e0e0e0',
    padding: 8,
    borderRadius: 6,
    marginRight: 10,
  },
});
