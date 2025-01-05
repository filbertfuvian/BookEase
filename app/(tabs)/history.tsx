import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useState } from 'react';

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState<'waiting' | 'borrowing' | 'completed'>('waiting');

  const waitingBooks = [
    { id: '1', title: 'Book A', libraryName: 'Central Library' },
    { id: '2', title: 'Book B', libraryName: 'Town Library' },
  ];

  const borrowingBooks = [
    { id: '1', title: 'Book C', libraryName: 'Central Library', deadline: '2023-12-01' },
    { id: '2', title: 'Book D', libraryName: 'Town Library', deadline: '2023-12-10' },
  ];

  const completedBooks = [
    { id: '1', title: 'Book E', author: 'Author X' },
    { id: '2', title: 'Book F', author: 'Author Y' },
  ];

  const renderWaiting = () => (
    <FlatList
      data={waitingBooks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.bold}>{item.title}</Text>
          <Text>{item.libraryName}</Text>
        </View>
      )}
    />
  );

  const renderBorrowing = () => (
    <FlatList
      data={borrowingBooks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <View>
            <Text style={styles.bold}>{item.title}</Text>
            <Text>{item.libraryName}</Text>
          </View>
          <Text style={styles.deadline}>{item.deadline}</Text>
        </View>
      )}
    />
  );

  const renderCompleted = () => (
    <FlatList
      data={completedBooks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.bold}>{item.title}</Text>
          <Text>{item.author}</Text>
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
  deadline: { color: 'red' },
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