import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function BookDetail() {
  const router = useRouter();
  const { title, genres } = useLocalSearchParams();

  // Parse genres from JSON string to array
  const parsedGenres = typeof genres === 'string' ? JSON.parse(genres) : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.header}>Book Selection</Text>
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
      <TouchableOpacity style={styles.reserveButton}>
        <Text style={styles.reserveButtonText}>Reserve</Text>
      </TouchableOpacity>
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
});