import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useState } from 'react';

export default function RewardsScreen() {
  const [points, setPoints] = useState(1200);
  const [showHistory, setShowHistory] = useState(false);

  const rewards = [
    { id: '1', title: 'Free Coffee', points: 200 },
    { id: '2', title: 'Discount Voucher', points: 500 },
    { id: '3', title: 'Free Book', points: 1000 },
  ];

  const renderReward = ({ item }: { item: { id: string; title: string; points: number } }) => (
    <View style={styles.rewardItem}>
      <Text style={styles.rewardTitle}>{item.title}</Text>
      <Text style={styles.rewardPoints}>{item.points} points</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rewards</Text>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>Points: {points}</Text>
        <TouchableOpacity style={styles.historyButton} onPress={() => setShowHistory(true)}>
          <Text style={styles.historyButtonText}>Points History</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rewards}
        keyExtractor={(item) => item.id}
        renderItem={renderReward}
        contentContainerStyle={styles.rewardsList}
      />

      <Modal
        visible={showHistory}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHistory(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Points History</Text>
            <Text>History details...</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  pointsText: {
    fontSize: 16
  },
  historyButton: {
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 8
  },
  historyButtonText: {
    fontSize: 14
  },
  rewardsList: {
    paddingBottom: 16
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  rewardTitle: {
    fontSize: 16
  },
  rewardPoints: {
    fontSize: 16,
    color: 'green'
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 14
  }
});