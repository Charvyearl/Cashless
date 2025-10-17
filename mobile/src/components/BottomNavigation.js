import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNavigation({ activeTab, onTabPress, showOrderTab = true }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'home' && styles.activeTab]}
        onPress={() => onTabPress('home')}
      >
        <View style={[styles.tabIconContainer, activeTab === 'home' && styles.activeTabIconContainer]}>
          <Ionicons 
            name="home-outline" 
            size={24} 
            color={activeTab === 'home' ? '#FFFFFF' : '#666'} 
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>Home</Text>
      </TouchableOpacity>
      
      {showOrderTab && (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'order' && styles.activeTab]}
          onPress={() => onTabPress('order')}
        >
          <View style={[styles.tabIconContainer, activeTab === 'order' && styles.activeTabIconContainer]}>
            <Ionicons 
              name="receipt-outline" 
              size={24} 
              color={activeTab === 'order' ? '#FFFFFF' : '#666'} 
            />
          </View>
          <Text style={[styles.tabLabel, activeTab === 'order' && styles.activeTabLabel]}>Order</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.tab, activeTab === 'transaction' && styles.activeTab]}
        onPress={() => onTabPress('transaction')}
      >
        <View style={[styles.tabIconContainer, activeTab === 'transaction' && styles.activeTabIconContainer]}>
          <Ionicons 
            name="analytics-outline" 
            size={24} 
            color={activeTab === 'transaction' ? '#FFFFFF' : '#666'} 
          />
        </View>
        <Text style={[styles.tabLabel, activeTab === 'transaction' && styles.activeTabLabel]}>Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#00BCD4',
    transform: [{ scale: 1.05 }],
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeTabIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
