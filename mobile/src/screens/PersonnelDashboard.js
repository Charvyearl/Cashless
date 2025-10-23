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
  Modal,
  Animated,
} from 'react-native';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import PersonnelHome from './PersonnelHome';
import OrderStatus from './OrderStatus';
import TransactionHistory from './TransactionHistory';
import BottomNavigation from '../components/BottomNavigation';
import { walletAPI, ordersAPI } from '../api/client';

export default function PersonnelDashboard({ onLogout, user, initialBalance = 0 }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'order', 'transaction'
  const [balance, setBalance] = useState(initialBalance);
  const [cart, setCart] = useState([]); // [{ product_id, name, price, quantity }]
  const [showCart, setShowCart] = useState(false);
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
      // Silent
    }
  };

  useEffect(() => {
    refreshBalance();
  }, []);

  // Auto-refresh balance every 10 seconds when on order or transaction tab
  useEffect(() => {
    if (activeTab === 'order' || activeTab === 'transaction') {
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

  const handleMyReservation = () => {
    if (cart.length === 0) {
      Alert.alert('Reservation', 'Your reservation cart is empty');
      return;
    }
    const summary = cart.map(c => `${c.name} x${c.quantity}`).join('\n');
    Alert.alert('Reservation', summary);
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.studentName}>{user ? `${user.first_name} ${user.last_name}` : 'Personnel'}</Text>
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
                <Text style={styles.studentInfoLabel}>Personnel</Text>
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
            <PersonnelHome onAddItem={(item) => {
              setCart((prev) => {
                const idx = prev.findIndex((p) => p.product_id === (item.product_id || item.id));
                const product = {
                  product_id: item.product_id || item.id,
                  name: item.product_name || item.name,
                  price: Number(item.price),
                  quantity: 1,
                };
                if (idx >= 0) {
                  const copy = prev.slice();
                  copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
                  return copy;
                }
                return [...prev, product];
              });
              // brief toast-like feedback
              Alert.alert('Added', `${item.product_name || item.name} added to cart`);
            }} />
          ) : activeTab === 'order' ? (
            <OrderStatus scope="personnel" onOrderUpdate={refreshBalance} />
          ) : (
            <TransactionHistory scope="personnel" onTransactionUpdate={refreshBalance} />
          )}
        </View>
      </ScrollView>

      {/* Modern Floating Action Button - My Reservation (only on home tab) */}
      {activeTab === 'home' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCart(true)}
        >
          <View style={styles.fabContent}>
            <Ionicons name="basket-outline" size={24} color="#FFFFFF" />
            <Text style={styles.fabText}>My Cart ({cart.reduce((a,c)=>a+c.quantity,0)})</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Cart Modal */}
      <Modal
        visible={showCart}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCart(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <Text style={styles.cartTitle}>Reservation Cart</Text>
            {cart.length === 0 ? (
              <Text style={styles.cartEmpty}>Your cart is empty</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 12 }}>
                {cart.map((item) => (
                  <View key={item.product_id} style={styles.cartRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartName}>{item.name}</Text>
                      <Text style={styles.cartPrice}>₱{item.price.toFixed(2)}</Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setCart((prev)=>prev.map(p=>p.product_id===item.product_id?{...p,quantity:Math.max(1,p.quantity-1)}:p))}
                      >
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => setCart((prev)=>prev.map(p=>p.product_id===item.product_id?{...p,quantity:p.quantity+1}:p))}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      onPress={() => setCart((prev)=>prev.filter(p=>p.product_id!==item.product_id))}
                    >
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.cartFooter}>
              <Text style={styles.totalText}>
                Total: ₱{cart.reduce((a,c)=>a + c.price * c.quantity, 0).toFixed(2)}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity style={[styles.modalBtn, styles.secondaryBtn]} onPress={() => setShowCart(false)}>
                  <Text style={styles.modalBtnText}>Hide</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.primaryBtn]}
                  onPress={async () => {
                    if (cart.length === 0) {
                      Alert.alert('Reservation', 'Your reservation cart is empty');
                      return;
                    }
                    try {
                      const payload = cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }));
                      const res = await ordersAPI.createOrder(payload);
                      if (res?.success) {
                        Alert.alert('Reservation', 'Order created successfully');
                        setCart([]);
                        setShowCart(false);
                        // Refresh balance after successful order
                        refreshBalance();
                      } else {
                        Alert.alert('Reservation failed', res?.message || 'Please try again');
                      }
                    } catch (e) {
                      Alert.alert('Reservation failed', e?.response?.data?.message || e?.message || 'Please try again');
                    }
                  }}
                >
                  <Text style={[styles.modalBtnText, { color: 'white' }]}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} showOrderTab={true} />
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
  fab: {
    position: 'absolute',
    bottom: 110, // Above bottom navigation with extra clearance
    right: 20,
    backgroundColor: '#00BCD4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10, // Higher than bottom nav (which has elevation: 8)
    zIndex: 1000, // Ensure it's above bottom nav on iOS
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  cartModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#333',
  },
  cartEmpty: {
    color: '#666',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  cartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cartPrice: {
    fontSize: 12,
    color: '#666',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    backgroundColor: '#f0f0f0',
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  qtyText: {
    minWidth: 20,
    textAlign: 'center',
    color: '#333',
  },
  removeText: {
    color: '#c62828',
    fontWeight: '600',
  },
  cartFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  modalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#87CEEB',
  },
  secondaryBtn: {
    backgroundColor: 'white',
  },
  primaryBtn: {
    backgroundColor: '#87CEEB',
  },
  modalBtnText: {
    color: '#333',
    fontWeight: '600',
  },
});
