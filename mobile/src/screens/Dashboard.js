import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar as RNStatusBar,
  Image,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import StudentHome from './StudentHome';
import TransactionHistory from './TransactionHistory';
import BottomNavigation from '../components/BottomNavigation';
import { walletAPI } from '../api/client';

export default function Dashboard({ onLogout, user, initialBalance = 0 }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'transaction'
  const [balance, setBalance] = useState(initialBalance);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  // Function to refresh balance
  const refreshBalance = async () => {
    try {
      const res = await walletAPI.getBalance();
      if (res?.success) {
        setBalance(res.data.balance);
      }
    } catch (e) {
      // Silent fail for now; could show a toast
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  // Auto-refresh balance every 10 seconds when on transaction tab
  useEffect(() => {
    if (activeTab === 'transaction') {
      const interval = setInterval(refreshBalance, 10000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  // Animation effects
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar style="light" backgroundColor="#00BCD4" translucent={false} />
      
      {/* Modern Top Bar */}
      <Animated.View 
        style={[
          styles.topBar,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={styles.topBarLeft}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/mysmclogo.webp')} 
              style={styles.topBarLogo}
              resizeMode="contain"
            />
          </View>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Scrollable content (keeps header/top bar fixed) */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.studentName}>{user ? `${user.first_name} ${user.last_name}` : 'Student'}</Text>
          </View>
        </View>

        {/* Modern Balance Card */}
        <Animated.View 
          style={[
            styles.balanceCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.balanceCardHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet-outline" size={24} color="#00BCD4" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceTitle}>Wallet Balance</Text>
              <Text style={styles.balanceSubtitle}>Available funds</Text>
            </View>
          </View>
          
          <View style={styles.balanceAmountContainer}>
            <Text style={styles.balanceAmount}>₱{Number(balance).toFixed(2)}</Text>
            <TouchableOpacity 
              style={styles.refreshBalanceButton}
              onPress={refreshBalance}
            >
              <Ionicons name="refresh-outline" size={20} color="#00BCD4" />
            </TouchableOpacity>
          </View>

          <View style={styles.studentInfo}>
            <View style={styles.studentInfoRow}>
              <View style={styles.studentInfoItem}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.studentInfoLabel}>Student</Text>
              </View>
              <Text style={styles.studentInfoValue}>
                {user ? `${user.first_name} ${user.last_name}` : '—'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Content Area */}
        <View style={styles.contentContainer}>
          {activeTab === 'home' ? (
            <StudentHome />
          ) : (
            <TransactionHistory onTransactionUpdate={refreshBalance} />
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
    backgroundColor: '#00BCD4',
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  topBarLeft: {
    flex: 1,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  topBarLogo: {
    width: 120,
    height: 32,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  balanceSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  balanceAmountContainer: {
    backgroundColor: 'rgba(0, 188, 212, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00BCD4',
  },
  refreshBalanceButton: {
    padding: 8,
    backgroundColor: 'rgba(0, 188, 212, 0.1)',
    borderRadius: 8,
  },
  studentInfo: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  studentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentInfoLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  studentInfoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
});
