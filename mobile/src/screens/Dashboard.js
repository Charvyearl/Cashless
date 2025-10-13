import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import StudentHome from './StudentHome';
import TransactionHistory from './TransactionHistory';
import BottomNavigation from '../components/BottomNavigation';
import { walletAPI } from '../api/client';

export default function Dashboard({ onLogout, user, initialBalance = 0 }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'transaction'
  const [balance, setBalance] = useState(initialBalance);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await walletAPI.getBalance();
        if (isMounted && res?.success) {
          setBalance(res.data.balance);
        }
      } catch (e) {
        // Silent fail for now; could show a toast
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      onLogout && onLogout();
      return;
    }
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => onLogout && onLogout() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Image 
          source={require('../../assets/images/mysmclogo.webp')} 
          style={styles.topBarLogo}
          resizeMode="contain"
        />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Scrollable content (keeps header/top bar fixed) */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.studentName}>{user ? `${user.first_name} ${user.last_name}` : 'Student'}</Text>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceIcon}>💳</Text>
            <Text style={styles.balanceTitle}>Balance</Text>
          </View>
          <Text style={styles.balanceSubtitle}>Your current wallet balance</Text>
          <View style={styles.balanceAmountContainer}>
            <Text style={styles.balanceAmount}>₱{Number(balance).toFixed(2)}</Text>
          </View>
          <View style={styles.studentInfo}>
            <View style={styles.studentInfoColumn}>
              <Text style={styles.studentInfoLabel}>Student Name</Text>
              <Text style={styles.studentInfoValue}>{user ? `${user.first_name} ${user.last_name}` : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {activeTab === 'home' ? (
            <StudentHome />
          ) : (
            <TransactionHistory />
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} showOrderTab={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  topBar: {
    backgroundColor: '#87CEEB',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topBarLogo: {
    width: 100,
    height: 30,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  dashboardHeader: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'flex-end',
  },
  welcomeSection: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  studentName: {
    fontSize: 16,
    color: '#333',
    marginTop: 5,
  },
  balanceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  balanceIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  balanceAmountContainer: {
    backgroundColor: '#e8f5e8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  studentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  studentInfoColumn: {
    flex: 1,
  },
  studentInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  studentInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
});
