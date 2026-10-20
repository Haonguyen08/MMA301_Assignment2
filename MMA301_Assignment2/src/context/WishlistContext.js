import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { firebaseService } from '../api/firebaseService';
import { notificationService } from '../api/notificationService';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);

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

  const isWishlisted = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

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

    setWishlist(updatedWishlist);

    try {
      await firebaseService.syncWishlist(updatedWishlist);
    } catch (err) {
      console.error('[WishlistContext] Lỗi đồng bộ Wishlist lên Firebase:', err.message);
      setFirebaseError('Không thể đồng bộ lên Firebase: ' + err.message);
    }
  };

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

    setOrders((prev) => [newOrder, ...prev]);

    await notificationService.notifyOrderSuccess(newOrder.id, totalAmount);

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
