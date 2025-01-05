import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useRouter} from 'expo-router';
import { auth } from '../../firebaseConfig';
import { getUser, addUser } from '@/hooks/useUser';
import UpdateModal from '@/components/UpdateModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalPlaceholder, setModalPlaceholder] = useState('');
  const [modalValue, setModalValue] = useState('');
  const [fieldToUpdate, setFieldToUpdate] = useState<keyof UserData>('profilePicture');
  const router = useRouter();

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (user) {
        const data = await getUser(user.uid) as UserData;
        setUserData(data);
      }
    }
    fetchUserData();
  }, []);

  interface UserData {
    profilePicture: string;
    email: string;
    name: string;
    phoneNumber: string;
    address: string;
    createdAt: Date;
    totalPoints: number;
    booksToBePickedUp: any[];
    completed: any[];
    currentlyBorrowing: any[];
  }

  const handleUpdateProfile = async (field: keyof UserData, value: string) => {
    const user = auth.currentUser;
    if (user) {
      const updatedData: UserData = { 
        profilePicture: userData?.profilePicture || '', 
        email: userData?.email || '',
        name: userData?.name || '', 
        phoneNumber: userData?.phoneNumber || '', 
        address: userData?.address || '', 
        createdAt: userData?.createdAt || new Date(),
        totalPoints: userData?.totalPoints || 0,
        booksToBePickedUp: userData?.booksToBePickedUp || [],
        completed: userData?.completed || [],
        currentlyBorrowing: userData?.currentlyBorrowing || [],
        [field]: value 
      };
      await addUser(user.uid, updatedData);
      setUserData(updatedData);
    }
  };

  const openModal = (title: string, placeholder: string, value: string, field: keyof UserData) => {
    setModalTitle(title);
    setModalPlaceholder(placeholder);
    setModalValue(value);
    setFieldToUpdate(field);
    setModalVisible(true);
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.length < 4) return phoneNumber;
    const lastFourDigits = phoneNumber.slice(-4);
    const maskedDigits = phoneNumber.slice(0, -4).replace(/./g, '*');
    return `${maskedDigits}${lastFourDigits}`;
  };

  const handleProfilePictureChange = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to change profile picture.');
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
  
      if (!result.canceled) {
        const user = auth.currentUser;
        if (!user) return;
  
        // Get base64 string directly from ImagePicker
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
  
        // Update user document with base64 string
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          profilePicture: base64Image
        });
  
        // Update local state
        setUserData(prev => prev ? ({
          ...prev,
          profilePicture: base64Image
        }) : null);
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      alert('Failed to update profile picture');
    }
  };
  if (!userData) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <IconSymbol name="chevron.left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <TouchableOpacity onPress={handleProfilePictureChange}>
            <Image 
              source={userData.profilePicture ? { uri: userData.profilePicture } : require('@/assets/images/default-avatar.png')}
              style={styles.profilePicture} 
            />
          </TouchableOpacity>
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.email}>{auth.currentUser?.email}</Text>
        </View>

        <View style={styles.section}>
          <Link href="/(tabs)/history" asChild>
            <TouchableOpacity style={styles.sectionButton}>
              <IconSymbol name="clock.fill" size={24} color="#000" style={styles.icon} />
              <Text style={styles.sectionButtonText}>View History</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/rewards" asChild>
            <TouchableOpacity style={styles.sectionButton}>
              <IconSymbol name="gift.fill" size={24} color="#000" style={styles.icon} />
              <Text style={styles.sectionButtonText}>View Rewards</Text>
            </TouchableOpacity>
          </Link>
        </View>

        {/* Edit Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={handleProfilePictureChange}
          >
            <IconSymbol name="pencil" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Customize Profile Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => openModal('Change Username', 'Username', userData.name, 'name')}
          >
            <IconSymbol name="pencil" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Change Username</Text>
          </TouchableOpacity>
        </View>

        {/* Account Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => openModal('Change Phone Number', 'New Phone Number', userData.phoneNumber, 'phoneNumber')}
          >
            <IconSymbol name="phone.fill" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Change Phone Number</Text>
            <Text style={styles.previewText}>{formatPhoneNumber(userData.phoneNumber)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => openModal('Change Address', 'New Address', userData.address, 'address')}
          >
            <IconSymbol name="house.fill" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Change Address</Text>
            <Text style={styles.previewText}>{userData.address}</Text>
          </TouchableOpacity>
        </View>

        {/* Others Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Others</Text>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => router.push('/profile/admin')}
          >
            <IconSymbol name="person.fill" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Admin Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => auth.signOut()}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={24} color="#000" style={styles.icon} />
            <Text style={styles.sectionButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <UpdateModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={(value) => handleUpdateProfile(fieldToUpdate, value)}
          title={modalTitle}
          placeholder={modalPlaceholder}
          value={modalValue}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  backButton: {
    marginRight: 10
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  email: {
    fontSize: 16,
    color: '#888',
    marginTop: 5
  },
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  sectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    position: 'relative'
  },
  sectionButtonText: {
    fontSize: 16,
    marginLeft: 10
  },
  icon: {
    width: 24,
    height: 24
  },
  previewText: {
    position: 'absolute',
    right: 10,
    top: 10,
    fontSize: 14,
    color: '#888'
  }
});
