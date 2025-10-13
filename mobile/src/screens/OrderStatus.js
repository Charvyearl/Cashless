import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { ordersAPI } from '../api/client';

export default function OrderStatus({ scope } = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatManila = (input) => {
    try {
      const d = new Date(input);
      return new Intl.DateTimeFormat('en-PH', {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Manila'
      }).format(d);
    } catch (_) {
      return String(input || '');
    }
  };

  const reload = async () => {
    setLoading(true);
    try {
      const params = { limit: 20, status: 'pending' };
      const res = await ordersAPI.listOrders(params);
      if (res?.success) setOrders(res.data.transactions || res.data || []);
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.icon}>🧾</Text>
          <Text style={styles.title}>Order Status</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={reload} disabled={loading}>
            <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {loading ? (
            <Text style={styles.empty}>Loading...</Text>
          ) : orders.length === 0 ? (
            <Text style={styles.empty}>No pending orders</Text>
          ) : (
            <View style={{ width: '100%', gap: 12 }}>
              {orders.map((o) => (
                <View key={o.transaction_id || o.id} style={styles.row}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowType}>pending</Text>
                    <View style={[styles.statusBadge, styles.badgePending]}>
                      <Text style={styles.statusText}>pending</Text>
                    </View>
                  </View>
                  <View style={styles.rowBody}>
                    <Text style={styles.amount}>₱{Number(o.total_amount || o.amount || 0).toFixed(2)}</Text>
                    <Text style={styles.dateText}>{formatManila(o.transaction_date || o.date || '')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  card: {
    backgroundColor: 'white', borderRadius: 15, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  icon: { fontSize: 16, marginRight: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 200 },
  empty: { fontSize: 16, color: '#666' },
  row: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 12, backgroundColor: 'white' },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  rowType: { fontSize: 14, fontWeight: '600', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgePending: { backgroundColor: '#fff7e6' },
  statusText: { fontSize: 12, color: '#333', fontWeight: '600', textTransform: 'capitalize' },
  rowBody: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { fontSize: 16, fontWeight: '700', color: '#2e7d32' },
  dateText: { fontSize: 12, color: '#6b7280' },
  refreshBtn: { backgroundColor: '#87CEEB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  refreshText: { color: 'white', fontWeight: '600' },
});


