import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Alert } from 'react-native';
import { useState } from 'react';
import { useRewards } from '@/hooks/useRewards';

export default function RewardsScreen() {
  const { rewards, totalPoints, pointsHistory, updatePoints } = useRewards();
  const [showHistory, setShowHistory] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);  // State for selected reward
  const [confirmVisible, setConfirmVisible] = useState(false);  // State for confirmation modal

  const confirmRedeem = (reward) => {
    setSelectedReward(reward);
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (selectedReward && totalPoints >= selectedReward.points) {
      try {
        await updatePoints(selectedReward.points, `Redeemed ${selectedReward.name}`, 'deduction');
        Alert.alert('Success', 'Reward redeemed successfully!');
      } catch (error) {
        Alert.alert('Error', 'Failed to redeem reward. Please try again.');
      } finally {
        setConfirmVisible(false);
        setSelectedReward(null);
      }
    } else {
      Alert.alert('Insufficient Points', 'Not enough points to redeem this reward.');
      setConfirmVisible(false);
    }
  };

  const handleCancel = () => {
    setConfirmVisible(false);
    setSelectedReward(null);
  };

  const renderReward = ({ item }) => (
    <TouchableOpacity onPress={() => confirmRedeem(item)} style={styles.rewardItem}>
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
        <Text style={styles.pointsText}>Total Points: {totalPoints}</Text>
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

      <Modal
        visible={confirmVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Redemption</Text>
            {selectedReward && (
              <>
                <Text style={styles.rewardDetail}>Reward: {selectedReward.name}</Text>
                <Text style={styles.rewardDetail}>Points: {selectedReward.points}</Text>
              </>
            )}
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
                <Text style={styles.buttonText}>Redeem</Text>
              </TouchableOpacity>
            </View>
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
  },
  rewardDetail: {
    fontSize: 16,
    marginBottom: 8
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16
  },
  cancelButton: {
    backgroundColor: '#ddd',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center'
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 14,
    color: '#fff'
  }
});
