import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { Link, useRouter} from 'expo-router';
import { auth } from '../../firebaseConfig';
import { getUser, addUser } from '@/hooks/useUser';
import UpdateModal from '@/components/UpdateModal';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as ImagePicker from 'expo-image-picker';

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
    name: string;
    phoneNumber: string;
    address: string;
  }

  const handleUpdateProfile = async (field: keyof UserData, value: string) => {
    const user = auth.currentUser;
    if (user) {
      const updatedData: UserData = { 
        profilePicture: userData?.profilePicture || '', 
        name: userData?.name || '', 
        phoneNumber: userData?.phoneNumber || '', 
        address: userData?.address || '', 
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      handleUpdateProfile('profilePicture', result.assets[0].uri);
    }
  };

  if (!userData) {
    return <Text>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Image 
          source={{ uri: userData.profilePicture }} 
          style={styles.profilePicture}
        />
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
          onPress={pickImage}
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

      <UpdateModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(value) => handleUpdateProfile(fieldToUpdate, value)}
        title={modalTitle}
        placeholder={modalPlaceholder}
        value={modalValue}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 40
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
    marginBottom: 20
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