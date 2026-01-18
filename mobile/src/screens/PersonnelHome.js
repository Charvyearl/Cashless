import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { menuAPI } from '../api/client';

export default function PersonnelHome({ onAddItem }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const cats = await menuAPI.getCategories().catch(()=>null);
        if (isMounted && cats?.success) setCategories(cats.data || []);
        const res = await menuAPI.getProducts({ available_only: true, limit: 20 });
        if (isMounted && res?.success && Array.isArray(res.data) && res.data.length > 0) {
          // Filter out products with 0 stock
          const filteredItems = res.data.filter(item => (item.stock_quantity || 0) > 0);
          setItems(filteredItems);
        } else {
          const res2 = await menuAPI.getItems({ available_only: true, limit: 20 });
          if (isMounted && res2?.success) {
            // Filter out items with 0 stock
            const filteredItems = (res2.data.items || []).filter(item => (item.stock_quantity || 0) > 0);
            setItems(filteredItems);
          }
        }
      } catch (e) {
        try {
          const res2 = await menuAPI.getItems({ available_only: true, limit: 20 });
          if (isMounted && res2?.success) {
            // Filter out items with 0 stock
            const filteredItems = (res2.data.items || []).filter(item => (item.stock_quantity || 0) > 0);
            setItems(filteredItems);
          }
        } catch (_) {}
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadByCategory = async () => {
      setLoading(true);
      try {
        const params = { available_only: true, limit: 20 };
        if (selectedCategoryId) params.category_id = selectedCategoryId;
        const res = await menuAPI.getProducts(params);
        if (isMounted && res?.success) {
          // Filter out products with 0 stock
          const filteredItems = (res.data || []).filter(item => (item.stock_quantity || 0) > 0);
          setItems(filteredItems);
        }
      } catch (_) {}
      finally { if (isMounted) setLoading(false); }
    };
    if (categories.length > 0) loadByCategory();
    return () => { isMounted = false; };
  }, [selectedCategoryId, categories.length]);

  const handleAddToReservation = (itemName) => {
    Alert.alert(
      'Add to Reservation',
      `Add "${itemName}" to your reservation?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Add',
          onPress: () => {
            Alert.alert('Success', `${itemName} added to reservation!`);
          },
        },
      ]
    );
  };

  // Filter items based on search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (item.name || item.product_name || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    return name.includes(query) || description.includes(query);
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <View style={styles.searchContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.categoryChip, selectedCategoryId === null && styles.categoryChipActive]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text style={[styles.categoryChipText, selectedCategoryId === null && styles.categoryChipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.categoryChip, selectedCategoryId === c.id && styles.categoryChipActive]}
              onPress={() => setSelectedCategoryId(c.id)}
            >
              <Text style={[styles.categoryChipText, selectedCategoryId === c.id && styles.categoryChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <Text>Loading...</Text>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery.trim() ? `No products found for "${searchQuery}"` : 'No items available'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 180, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {filteredItems.map((item) => (
            <View key={item.id || item.product_id} style={styles.menuItemCard}>
              <View style={styles.menuItemHeader}>
                <Text style={styles.menuItemName}>{item.name || item.product_name}</Text>
                <Text style={styles.menuItemPrice}>₱{Number(item.price).toFixed(2)}</Text>
              </View>
              {!!(item.category || item.category_name) && (
                <View style={styles.menuItemCategory}>
                  <Text style={styles.categoryTag}>{item.category || item.category_name}</Text>
                </View>
              )}
              {item.description ? (
                <Text style={styles.menuItemDescription}>{item.description}</Text>
              ) : null}
              <TouchableOpacity 
                style={styles.reservationButton}
                onPress={() => onAddItem ? onAddItem(item) : handleAddToReservation(item.name || item.product_name)}
              >
                <Text style={styles.reservationButtonText}>
                  {item.is_available ? 'Add to Reservation' : 'Unavailable'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchBarContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#999',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  categoryButton: {
    display: 'none',
  },
  categoryChip: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryChipActive: {
    backgroundColor: '#87CEEB',
    borderColor: '#87CEEB',
  },
  categoryChipText: {
    color: '#333',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: 'white',
  },
  categoryButtonText: {
    fontSize: 16,
    color: '#333',
    marginRight: 8,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  menuItemCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  menuItemCategory: {
    marginBottom: 10,
  },
  categoryTag: {
    backgroundColor: '#87CEEB',
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  reservationButton: {
    backgroundColor: '#87CEEB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  reservationButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
});
