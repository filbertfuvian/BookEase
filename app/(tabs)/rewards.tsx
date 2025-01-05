import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal } from 'react-native';
import { useState } from 'react';
import { useRewards } from '@/hooks/useRewards';

export default function RewardsScreen() {
  const { rewards, points, pointsHistory, updatePoints } = useRewards();
  const [showHistory, setShowHistory] = useState(false);

  const handleRedeem = async (reward) => {
    if (points >= reward.points) {
      await updatePoints(reward.points, `Redeemed ${reward.name}`, 'deduction');
      alert('Reward redeemed successfully!');
    } else {
      alert('Not enough points to redeem this reward.');
    }
  };

  const renderReward = ({ item }) => (
    <TouchableOpacity onPress={() => handleRedeem(item)} style={styles.rewardItem}>
      <Text style={styles.rewardTitle}>{item.name}</Text>
      <Text style={styles.rewardPoints}>{item.points} points</Text>
    </TouchableOpacity>
  );

  const renderHistory = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyActivity}>{item.activity}</Text>
      <Text style={styles.historyPoints}>{item.type === 'addition' ? '+' : '-'}{item.points} points</Text>
      <Text style={styles.historyDate}>{new Date(item.date).toLocaleString()}</Text>
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
            <FlatList
              data={pointsHistory}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderHistory}
              contentContainerStyle={styles.historyList}
            />
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
  historyList: {
    paddingBottom: 16
  },
  historyItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8
  },
  historyActivity: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  historyPoints: {
    fontSize: 16,
    color: 'blue',
    marginVertical: 4
  },
  historyDate: {
    fontSize: 14,
    color: '#666'
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
