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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PersonnelHome from './PersonnelHome';
import TransactionHistory from './TransactionHistory';
import BottomNavigation from '../components/BottomNavigation';
import { walletAPI, ordersAPI } from '../api/client';

export default function PersonnelDashboard({ onLogout, user, initialBalance = 0 }) {
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'transaction'
  const [balance, setBalance] = useState(initialBalance);
  const [cart, setCart] = useState([]); // [{ product_id, name, price, quantity }]
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const res = await walletAPI.getBalance();
        if (isMounted && res?.success) {
          setBalance(res.data.balance);
        }
      } catch (e) {
        // Silent
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            }
          },
        },
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 130 }} nestedScrollEnabled>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.studentName}>{user ? `${user.first_name} ${user.last_name}` : 'Personnel'}</Text>
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
              <Text style={styles.studentInfoLabel}>Student ID</Text>
              <Text style={styles.studentInfoValue}>{user?.student_id || '—'}</Text>
            </View>
            <View style={styles.studentInfoColumn}>
              <Text style={styles.studentInfoLabel}>Student Name</Text>
              <Text style={styles.studentInfoValue}>{user ? `${user.first_name} ${user.last_name}` : '—'}</Text>
            </View>
          </View>
        </View>

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
          ) : (
            <TransactionHistory scope="personnel" />
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button - My Reservation (only on home tab) */}
      {activeTab === 'home' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setShowCart(true)}
        >
          <Text style={styles.fabIcon}>🧺</Text>
          <Text style={styles.fabText}>My Cart ({cart.reduce((a,c)=>a+c.quantity,0)})</Text>
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
      <BottomNavigation activeTab={activeTab} onTabPress={setActiveTab} />
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
  fab: {
    position: 'absolute',
    bottom: 80, // Above bottom navigation
    right: 20,
    backgroundColor: '#87CEEB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
