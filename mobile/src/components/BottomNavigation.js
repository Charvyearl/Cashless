import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';

export default function BottomNavigation({ activeTab, onTabPress, showOrderTab = true }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'home' && styles.activeTab]}
        onPress={() => onTabPress('home')}
      >
        <Text style={[styles.tabIcon, activeTab === 'home' && styles.activeTabIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, activeTab === 'home' && styles.activeTabLabel]}>Home</Text>
      </TouchableOpacity>
      
      {showOrderTab && (
        <TouchableOpacity
          style={[styles.tab, activeTab === 'order' && styles.activeTab]}
          onPress={() => onTabPress('order')}
        >
          <Text style={[styles.tabIcon, activeTab === 'order' && styles.activeTabIcon]}>🧾</Text>
          <Text style={[styles.tabLabel, activeTab === 'order' && styles.activeTabLabel]}>Order</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.tab, activeTab === 'transaction' && styles.activeTab]}
        onPress={() => onTabPress('transaction')}
      >
        <Text style={[styles.tabIcon, activeTab === 'transaction' && styles.activeTabIcon]}>📊</Text>
        <Text style={[styles.tabLabel, activeTab === 'transaction' && styles.activeTabLabel]}>Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#f0f8ff',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  activeTabIcon: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeTabLabel: {
    color: '#87CEEB',
    fontWeight: '600',
  },
});
