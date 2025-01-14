import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import {  doc, getDoc, updateDoc, arrayUnion, connectFirestoreEmulator } from "firebase/firestore";
import { IconSymbol } from '@/components/ui/IconSymbol';
import { getBookAvailability, getLibraries } from '../../services/api';
import { auth, db } from '../../firebaseConfig';


export default function BookDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Debug raw params
  console.log('Raw params:', params);
  
  // Safe extraction with defaults
  const bookID = params?.bookID?.toString() || '';
  const title = params?.title?.toString() || '';
  const genres = params?.genres?.toString() || '[]';

  // Debug extracted values
  console.log('Extracted values:', { bookID, title, genres });

  const [modalVisible, setModalVisible] = useState(false);
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [pickupDate, setPickupDate] = useState(new Date());
  const [reserveTime, setReserveTime] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const parsedGenres = typeof genres === 'string' ? JSON.parse(genres) : [];

  // Fetch data on libraries and availability
  useEffect(() => {
    async function fetchData() {
      try {
        const availableLibraryIDs = await getBookAvailability(bookID);
        
        // Pastikan array tidak kosong
        if (availableLibraryIDs.length === 0) {
          console.warn('No available libraries for this book.');
          return;
        }
        
        const libraryDetails = await getLibraries(availableLibraryIDs);
        setLibraries(libraryDetails);
        if (libraryDetails.length > 0) {
          setSelectedLibrary(libraryDetails[0].perpusID)
        }
      } catch (error) {
        console.error("Error fetching libraries:", error);
      }
    }
    fetchData();
  }, [bookID]);

  const handleCompleteReserve = async () => {
    if (!selectedLibrary) {
      Alert.alert('Error', 'Please select a library');
      return;
    }
  
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }
  
      // Check network connection
      const userDocRef = doc(db, 'users', user.uid);
      let retries = 3;
      
      while (retries > 0) {
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            Alert.alert('Error', 'User document not found');
            return;
          }
          break;
        } catch (error) {
          retries--;
          if (retries === 0) {
            Alert.alert(
              'Network Error', 
              'Please check your internet connection and try again'
            );
            return;
          }
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
  
      // Update book availability
      const bookRef = doc(db, 'books', bookID);
      const bookDoc = await getDoc(bookRef);
      
      if (bookDoc.exists()) {
        const bookData = bookDoc.data();
        const perpusList = bookData.perpus || [];
        
        const updatedPerpusList = perpusList.map((p: any) => {
          if (p.perpusID === selectedLibrary) {
            return { ...p, available: false };
          }
          return p;
        });
  
        await updateDoc(bookRef, {
          perpus: updatedPerpusList
        });
  
        // Add reservation data
        await updateDoc(userDocRef, {
          booksToBePickedUp: arrayUnion({
            bookID,
            perpusID: selectedLibrary,
            pickupDate,
            reserveTime,
            bookPoint: 50
          })
        });
        console.log('Reservation completed successfully perrpusID:', selectedLibrary, 'reserveTime:', reserveTime);

  
        setModalVisible(false);
        router.back();
      }
    } catch (error) {
      console.error('Error completing reservation:', error);
      Alert.alert(
        'Error',
        'Failed to complete reservation. Please try again later.'
      );
    }
  };
  
  const renderLibraryPicker = () => {
    if (libraries.length === 0) {
      return <Text style={styles.noLibraryText}>No available libraries</Text>;
    }
  
    return (
      <Picker
        selectedValue={selectedLibrary}
        onValueChange={(value) => setSelectedLibrary(value)}
        style={styles.picker}
      >
        <Picker.Item label="Select a library" value={null} />
        {libraries.map((library) => (
          <Picker.Item 
            key={library.id} 
            label={library.name} 
            value={library.perpusID} 
          />
        ))}
      </Picker>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Book Selection</Text>
        <Text style={styles.bookIdText}>Book ID: {bookID}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Image source={require('@/assets/images/book-template.png')} style={styles.bookImage} />
        <Text style={styles.bookTitle}>{title}</Text>
        <Text style={styles.bookGenres}>{parsedGenres.join(', ')}</Text>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book Information</Text>
          <Text style={styles.synopsis}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.reserveButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.reserveButtonText}>Reserve</Text>
      </TouchableOpacity>

      {/* Reservation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Complete Reservation</Text>
            <Text style={styles.bookIdText}>Book ID: {bookID || 'Not available'}</Text>
            <Text style={styles.label}>Select Library:</Text>
            {renderLibraryPicker()}
            <Text style={styles.label}>Select Pickup Date:</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.dateButton}
            >
              <Text>{pickupDate.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={pickupDate}
                mode="date"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setPickupDate(selectedDate);
                }}
                minimumDate={new Date()}
              />
            )}

            <Text style={styles.label}>Reserve Time (days): {reserveTime}</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={7}
              step={1}
              value={reserveTime}
              onValueChange={(newValue) => setReserveTime(newValue)}
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, libraries.length === 0 && styles.disabledButton]}
                onPress={handleCompleteReserve}
                disabled={libraries.length === 0}
              >
                <Text style={styles.buttonText}>Complete Reserve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  bookImage: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bookGenres: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  synopsis: {
    fontSize: 16,
    color: '#555',
  },
  reserveButton: {
    backgroundColor: '#007BFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginVertical: 8,
  },
  picker: {
    marginBottom: 15,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  slider: {
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#007BFF',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  bookIdText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  noLibraryText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
    padding: 10,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  }
});