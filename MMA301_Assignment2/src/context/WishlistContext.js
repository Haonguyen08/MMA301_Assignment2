/**
 * =========================================================================
 * WISHLIST & ORDER CONTEXT - QUẢN LÝ DỮ LIỆU ĐỒNG BỘ ĐÁM MÂY (FIREBASE)
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Quản lý danh sách Yêu thích (Wishlist) và Lịch sử Đơn hàng (Orders).
 *    - Đồng bộ với Firebase Cloud và lưu đệm cục bộ (Cache).
 *    - Cung cấp trạng thái Loading / Error / Retry khi thao tác với Firebase.
 * 
 * 2. Input:
 *    - product (thêm/xóa wishlist), orderData (tạo đơn hàng mới).
 * 
 * 3. Trigger:
 *    - Người dùng bấm nút trái tim (Favorite) trên sản phẩm.
 *    - Người dùng bấm nút "Đặt hàng" (Checkout) trong giỏ hàng.
 *    - Kéo làm mới (Pull to refresh) ở màn hình Wishlist/Orders.
 * 
 * 4. Transform:
 *    - Thêm/bớt id sản phẩm khỏi mảng wishlist.
 *    - Tạo object đơn hàng kèm ID, thời gian đặt, danh sách món, tổng tiền.
 *    - Gọi firebaseService để đồng bộ lên Cloud.
 * 
 * 5. Output / Failure:
 *    - Trạng thái wishlist, orders được cập nhật.
 *    - Nếu Firebase lỗi mạng hoặc quyền truy cập: bắt lỗi an toàn, hiển thị thông báo
 *      và giữ dữ liệu trong bộ nhớ đệm (Fallback Cache).
 * =========================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../api/firebaseService';
import { notificationService } from '../api/notificationService';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

  // Tải dữ liệu từ Firebase / Cache khi khởi động
  const loadCloudData = useCallback(async () => {
    setLoading(true);
    setFirebaseError(null);
    try {
      const [fetchedWishlist, fetchedOrders] = await Promise.all([
        firebaseService.fetchWishlist(),
        firebaseService.fetchOrders(),
      ]);
      setWishlist(fetchedWishlist || []);
      setOrders(fetchedOrders || []);
    } catch (err) {
      console.warn('[WishlistContext] Lỗi tải dữ liệu Firebase:', err.message);
      setFirebaseError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCloudData();
  }, [loadCloudData]);

  // Kiểm tra xem sản phẩm có trong Wishlist chưa
  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  // Thêm hoặc xóa sản phẩm khỏi Wishlist
  const toggleWishlist = async (product) => {
    setFirebaseError(null);
    const exists = isWishlisted(product.id);
    const updatedWishlist = exists
      ? wishlist.filter((item) => item.id !== product.id)
      : [
          {
            id: product.id,
            title: product.title,
            price: product.price,
            thumbnail: product.thumbnail || product.images?.[0] || '',
            category: product.category,
            addedAt: new Date().toISOString(),
          },
          ...wishlist,
        ];

    // Cập nhật giao diện trước (Optimistic UI)
    setWishlist(updatedWishlist);

    try {
      await firebaseService.syncWishlist(updatedWishlist);
    } catch (err) {
      console.error('[WishlistContext] Lỗi đồng bộ Wishlist lên Firebase:', err.message);
      setFirebaseError('Không thể đồng bộ lên Firebase: ' + err.message);
    }
  };

  // Tạo đơn hàng mới sau khi Checkout
  const placeOrder = async (cartItems, totalAmount) => {
    setFirebaseError(null);
    const newOrder = {
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cartItems.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        thumbnail: item.thumbnail,
      })),
      totalAmount: totalAmount,
      status: 'Đã xác nhận',
    };

    // Cập nhật state đơn hàng
    setOrders((prev) => [newOrder, ...prev]);

    // Bắn thông báo nghiệp vụ
    await notificationService.notifyOrderSuccess(newOrder.id, totalAmount);

    // Lưu vào Firebase
    try {
      await firebaseService.createOrder(newOrder);
      return { success: true, order: newOrder };
    } catch (err) {
      console.error('[WishlistContext] Lỗi lưu đơn hàng lên Firebase:', err.message);
      setFirebaseError('Đơn hàng đã lưu cục bộ nhưng lỗi Cloud: ' + err.message);
      return { success: true, order: newOrder, cloudWarning: err.message };
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        orders,
        loading,
        firebaseError,
        isWishlisted,
        toggleWishlist,
        placeOrder,
        refreshData: loadCloudData,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist phải được sử dụng bên trong WishlistProvider');
  }
  return context;
};
