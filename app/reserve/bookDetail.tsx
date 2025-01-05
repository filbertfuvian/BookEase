import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import {  doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
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
          setSelectedLibrary(libraryDetails[0].perpusID); // Sesuaikan dengan field yang benar
        }
      } catch (error) {
        console.error("Error fetching libraries:", error);
      }
    }
    fetchData();
  }, [bookID]);

  const handleCompleteReserve = async () => {
    try {
      const user = auth.currentUser;
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        console.error("Dokumen pengguna tidak ada");
        return;
      }
  
      // Cek data yang akan digunakan
      console.log("Data Reservasi:", {
        bookID,
        selectedLibrary,
        pickupDate,
        reserveTime
      });
  
      if (!bookID || !selectedLibrary || !pickupDate || !reserveTime) {
        console.error("Data tidak lengkap atau tidak valid:", {
          bookID,
          selectedLibrary,
          pickupDate,
          reserveTime
        });
        return;
      }
  
      // Mendapatkan bookPoint (perhitungan acak)
      const bookPoint = Math.floor(Math.random() * 6) * 10 + 50;
      console.log("Book Point:", bookPoint);
  
      // Update dokumen pengguna di Firestore
      await updateDoc(userDocRef, {
        reservations: arrayUnion({
          bookID,
          perpusID: selectedLibrary,
          pickupDate: pickupDate.toISOString(),
          reserveTime,
          bookPoint,
        }),
      });
  
      setModalVisible(false);
      router.back();
    } catch (error) {
      console.error("Gagal melakukan reservasi:", error);
    }
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
            <Picker
              selectedValue={selectedLibrary}
              onValueChange={(itemValue) => setSelectedLibrary(itemValue)}
              style={styles.picker}
            >
              {libraries.map((library) => (
                <Picker.Item key={library.id} label={library.name} value={library.perpusID} />
              ))}
            </Picker>
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
                style={[styles.button, styles.confirmButton]}
                onPress={handleCompleteReserve}
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
});