import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { CartItem } from '../components/CartItem';
import { EmptyState } from '../components/EmptyState';

export const CartScreen = ({ navigation }) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalCount,
    subtotal,
    shippingFee,
    totalAmount,
  } = useCart();

  const { placeOrder } = useWishlist();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleConfirmClear = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa sạch', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    Alert.alert(
      'Xác nhận đặt hàng',
      `Tổng thanh toán: $${totalAmount.toFixed(2)} cho ${totalCount} sản phẩm.\nBạn có muốn tiếp tục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đặt hàng',
          onPress: async () => {
            setIsPlacingOrder(true);
            try {
              const res = await placeOrder(cartItems, totalAmount);
              clearCart();

              let alertMsg = `Mã đơn hàng: ${res.order.id}\nCảm ơn bạn đã mua sắm! Thông báo xác nhận đã được gửi.`;
              if (res.cloudWarning) {
                alertMsg += `\n(Ghi chú: ${res.cloudWarning})`;
              }

              Alert.alert('Đặt hàng thành công!', alertMsg, [
                {
                  text: 'Xem đơn hàng',
                  onPress: () => navigation.navigate('WishlistTab', { activeTab: 'orders' }),
                },
                { text: 'Tiếp tục mua sắm', onPress: () => navigation.navigate('CatalogTab') },
              ]);
            } catch (err) {
              Alert.alert('Lỗi đặt hàng', err.message || 'Không thể xử lý đơn hàng lúc này.');
            } finally {
              setIsPlacingOrder(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Giỏ hàng của bạn</Text>
          <Text style={styles.itemCountBadge}>({totalCount} món)</Text>
        </View>

        {cartItems.length > 0 && (
          <TouchableOpacity onPress={handleConfirmClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <EmptyState
          title="Giỏ hàng trống"
          message="Bạn chưa thêm sản phẩm nào vào giỏ. Hãy dạo quanh cửa hàng để chọn món đồ yêu thích nhé!"
          buttonText="Mua sắm ngay"
          onPressButton={() => navigation.navigate('CatalogTab')}
        />
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
              />
            )}
          />

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính ({totalCount} sản phẩm):</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển:</Text>
              <Text style={[styles.summaryValue, shippingFee === 0 && styles.freeShipping]}>
                {shippingFee === 0 ? 'Miễn phí' : `$${shippingFee.toFixed(2)}`}
              </Text>
            </View>

            {shippingFee > 0 && (
              <Text style={styles.freeShipHint}>
                * Mua thêm ${(50 - subtotal).toFixed(2)} để được Miễn phí vận chuyển!
              </Text>
            )}

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={[styles.checkoutBtn, isPlacingOrder && styles.disabledBtn]}
              onPress={handleCheckout}
              disabled={isPlacingOrder}
              activeOpacity={0.85}
            >
              {isPlacingOrder ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.checkoutText}>Tiến hành Đặt hàng</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemCountBadge: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  listContent: {
    padding: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  freeShipping: {
    color: '#10B981',
    fontWeight: '700',
  },
  freeShipHint: {
    fontSize: 11,
    color: '#2563EB',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2563EB',
  },
  checkoutBtn: {
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
