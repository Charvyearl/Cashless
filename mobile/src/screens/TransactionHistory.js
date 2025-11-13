import React, { useEffect, useMemo, useState } from 'react';
import { walletAPI, ordersAPI } from '../api/client';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';

export default function TransactionHistory({ scope, onTransactionUpdate } = {}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null); // { transaction, items, customer }
  const [showDetail, setShowDetail] = useState(false);

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
      const params = { limit: 20 };
      if (scope) params.scope = scope;
      const res = await walletAPI.getTransactions(params);
      if (res?.success) {
        const list = res.data.transactions || [];
        setTransactions(list);
        // Trigger balance update in parent component
        if (onTransactionUpdate) onTransactionUpdate();
      }
    } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  return (
    <View style={styles.container}>
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.transactionIcon}>🕐</Text>
            <Text style={styles.transactionTitle}>Transaction History</Text>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={reload} disabled={loading}>
            <Text style={styles.refreshText}>{loading ? 'Refreshing...' : 'Refresh'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.transactionContent}>
          {loading ? (
            <Text style={styles.emptyStateText}>Loading...</Text>
          ) : transactions.length === 0 ? (
            <Text style={styles.emptyStateText}>No transactions yet</Text>
          ) : (
            <View style={{ width: '100%', gap: 12 }}>
              {transactions.map((t) => {
                const status = (t.status || '').toLowerCase();
                const dateStr = t.created_at || t.date || '';
                const displayDate = formatManila(dateStr);
                const type = t.type || t.transaction_type || 'purchase';
                const amount = Number(t.amount || 0);
                const badgeStyle =
                  status === 'completed' ? styles.badgeCompleted :
                  status === 'pending' ? styles.badgePending :
                  styles.badgeCancelled;
                return (
                  <View
                    key={t.id || t.transaction_id}
                    style={styles.row}
                  >
                    <View style={styles.rowHeader}>
                      <Text style={styles.rowType}>{type}</Text>
                      <View style={[styles.statusBadge, badgeStyle]}>
                        <Text style={styles.statusText}>{status || 'unknown'}</Text>
                      </View>
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.amount}>₱{amount.toFixed(2)}</Text>
                      <Text style={styles.dateText}>{displayDate}</Text>
                    </View>
                    <Text style={styles.linkText}
                      onPress={async () => {
                        try {
                          const res = await ordersAPI.getOrder(t.transaction_id || t.id);
                          if (res?.success) {
                            setDetail(res.data);
                            setShowDetail(true);
                          }
                        } catch (_) {}
                      }}
                    >View items</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
      {showDetail && detail && (
        <View style={styles.detailOverlay}>
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>Transaction #{detail.transaction?.transaction_id}</Text>
            <Text style={styles.detailMeta}>Date: {formatManila(detail.transaction?.transaction_date)}</Text>
            <Text style={styles.detailMeta}>Total: ₱{Number(detail.transaction?.total_amount||0).toFixed(2)}</Text>
            <View style={{ height: 8 }} />
            <View style={{ gap: 8 }}>
              {(detail.items || []).map((it) => (
                <View key={it.transaction_item_id} style={styles.itemRow}>
                  <Text style={styles.itemName}>{it.product_name}</Text>
                  <Text style={styles.itemMeta}>x{it.quantity} @ ₱{Number(it.unit_price).toFixed(2)}</Text>
                  <Text style={styles.itemSubtotal}>₱{Number(it.subtotal).toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <View style={{ height: 12 }} />
            <Text style={styles.closeLink} onPress={() => setShowDetail(false)}>Close</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  transactionCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  transactionIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  transactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshBtn: {
    backgroundColor: '#87CEEB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshText: {
    color: 'white',
    fontWeight: '600',
  },
  transactionContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  row: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'white',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  rowType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCompleted: {
    backgroundColor: '#e6f7ec',
  },
  badgePending: {
    backgroundColor: '#fff7e6',
  },
  badgeCancelled: {
    backgroundColor: '#fdecea',
  },
  statusText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  rowBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2e7d32',
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  linkText: {
    marginTop: 6,
    color: '#2563eb',
    fontWeight: '600',
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  detailMeta: {
    fontSize: 12,
    color: '#666',
  },
  itemRow: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 10,
  },
  itemName: {
    fontWeight: '600',
    color: '#333',
  },
  itemMeta: {
    color: '#666',
  },
  itemSubtotal: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  closeLink: {
    alignSelf: 'flex-end',
    color: '#2563eb',
    fontWeight: '600',
  },
});
