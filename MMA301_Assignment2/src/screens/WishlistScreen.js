import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { EmptyState } from '../components/EmptyState';

export const WishlistScreen = ({ route, navigation }) => {
  const initialTab = route.params?.activeTab || 'wishlist';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { wishlist, orders, loading, firebaseError, toggleWishlist, refreshData } = useWishlist();
  const { addToCart } = useCart();

  const renderWishlistItem = ({ item }) => (
    <View style={styles.wishlistCard}>
      {item.thumbnail ? (
        <Image source={{ uri: item.thumbnail }} style={styles.itemImage} resizeMode="cover" />
      ) : (
        <View style={[styles.itemImage, styles.noImage]}>
          <Text style={styles.noImageText}>Ảnh</Text>
        </View>
      )}

      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemPrice}>${Number(item.price).toFixed(2)}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={styles.addCartBtn}
          onPress={() => addToCart(item, 1)}
          activeOpacity={0.8}
        >
          <Text style={styles.addCartText}>Thêm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => toggleWishlist(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.removeText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOrderItem = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status || 'Thành công'}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.orderThumbnails}>
        {item.items?.map((subItem, index) => (
          <View key={index} style={styles.orderThumbWrapper}>
            <Image
              source={{ uri: subItem.thumbnail }}
              style={styles.orderThumb}
              resizeMode="cover"
            />
            <View style={styles.orderQtyBadge}>
              <Text style={styles.orderQtyText}>{subItem.quantity}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.orderFooter}>
        <Text style={styles.orderItemCount}>{item.items?.length || 0} loại sản phẩm</Text>
        <View style={styles.orderTotalRow}>
          <Text style={styles.orderTotalLabel}>Tổng cộng: </Text>
          <Text style={styles.orderTotalValue}>${Number(item.totalAmount).toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'wishlist' && styles.tabButtonActive]}
          onPress={() => setActiveTab('wishlist')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'wishlist' && styles.tabTextActive]}>
            Yêu thích ({wishlist.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'orders' && styles.tabButtonActive]}
          onPress={() => setActiveTab('orders')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Đơn hàng ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {firebaseError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText} numberOfLines={2}>
            {firebaseError}
          </Text>
          <TouchableOpacity onPress={refreshData} style={styles.retrySmallBtn}>
            <Text style={styles.retrySmallText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'wishlist' ? (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={renderWishlistItem}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshData} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có sản phẩm yêu thích"
              message="Hãy bấm nút Lưu ở các sản phẩm để lưu lại vào đây và đồng bộ lên Firebase."
              buttonText="Khám phá ngay"
              onPressButton={() => navigation.navigate('CatalogTab')}
            />
          }
        />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => String(item.id || item.firebaseId)}
          contentContainerStyle={styles.listContent}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refreshData} colors={['#2563EB']} />
          }
          ListEmptyComponent={
            <EmptyState
              title="Chưa có lịch sử đơn hàng"
              message="Các đơn hàng sau khi bạn nhấn Đặt hàng trong giỏ sẽ được lưu trữ và hiển thị chi tiết tại đây."
              buttonText="Xem giỏ hàng"
              onPressButton={() => navigation.navigate('CartTab')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
  },
  errorBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#991B1B',
  },
  retrySmallBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  retrySmallText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  listContent: {
    padding: 12,
    paddingBottom: 24,
  },
  wishlistCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  itemImage: {
    width: 68,
    height: 68,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginTop: 4,
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'center',
    marginLeft: 8,
  },
  addCartBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  addCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  removeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  orderDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#15803D',
    fontWeight: '700',
  },
  orderThumbnails: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  orderThumbWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  orderThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  orderQtyBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderQtyText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  orderItemCount: {
    fontSize: 12,
    color: '#64748B',
  },
  orderTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderTotalLabel: {
    fontSize: 13,
    color: '#334155',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
});
