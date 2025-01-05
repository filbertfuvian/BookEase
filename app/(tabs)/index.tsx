import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useState, useEffect } from 'react';
import { Link } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { getUser } from '@/hooks/useUser';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function HomeScreen() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      const user = auth.currentUser;
      if (user) {
        const data = await getUser(user.uid);
        setProfilePicture(data?.profilePicture || null);
      }
    }
    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Body Template */}
      <View style={styles.body}>
        <Text>Body Content</Text>
      </View>

      {/* Notifications Popup */}
      {showNotifications && (
        <View style={styles.notificationPopup}>
          <Text>Notifications</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
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
    fontWeight: 'bold'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16
  },
  body: {
    flex: 1,
    padding: 16
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
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
});