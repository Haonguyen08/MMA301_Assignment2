import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

const LOCAL_WISHLIST_KEY = '@firebase_backup_wishlist';
const LOCAL_ORDERS_KEY = '@firebase_backup_orders';

let forceSimulateError = false;

export const firebaseService = {
  setSimulateError(shouldError) {
    forceSimulateError = shouldError;
  },

  isSimulatingError() {
    return forceSimulateError;
  },

  async syncWishlist(wishlistItems) {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Mô phỏng lỗi quyền truy cập: Permission Denied hoặc Mất kết nối DB.');
    }

    await AsyncStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlistItems));

    if (CONFIG.FIREBASE_DB_URL && CONFIG.FIREBASE_DB_URL.startsWith('http')) {
      try {
        const url = `${CONFIG.FIREBASE_DB_URL.replace(/\/$/, '')}/wishlist.json`;
        const response = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(wishlistItems),
        });

        if (!response.ok) {
          throw new Error(`Firebase Lỗi HTTP: ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.warn('[firebaseService.syncWishlist] Không thể đồng bộ Firebase thật, dùng cache:', err.message);
        throw new Error('Lỗi đồng bộ Firebase: ' + err.message);
      }
    }

    return wishlistItems;
  },

  async fetchWishlist() {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Lỗi tải dữ liệu: Database Offline.');
    }

    if (CONFIG.FIREBASE_DB_URL && CONFIG.FIREBASE_DB_URL.startsWith('http')) {
      try {
        const url = `${CONFIG.FIREBASE_DB_URL.replace(/\/$/, '')}/wishlist.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Lỗi tải: ${response.status}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (err) {
        console.warn('[firebaseService.fetchWishlist] Tải từ cache cục bộ:', err.message);
        const cached = await AsyncStorage.getItem(LOCAL_WISHLIST_KEY);
        return cached ? JSON.parse(cached) : [];
      }
    }

    const cached = await AsyncStorage.getItem(LOCAL_WISHLIST_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  async createOrder(orderRecord) {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Không thể ghi đơn hàng: Lỗi mạng đám mây.');
    }

    const existingOrdersStr = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const existingOrders = existingOrdersStr ? JSON.parse(existingOrdersStr) : [];
    const updatedOrders = [orderRecord, ...existingOrders];
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updatedOrders));

    if (CONFIG.FIREBASE_DB_URL && CONFIG.FIREBASE_DB_URL.startsWith('http')) {
      try {
        const url = `${CONFIG.FIREBASE_DB_URL.replace(/\/$/, '')}/orders.json`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderRecord),
        });
        if (!response.ok) throw new Error(`Firebase POST Lỗi: ${response.status}`);
        return await response.json();
      } catch (err) {
        console.warn('[firebaseService.createOrder] Ghi đơn lên Firebase lỗi:', err.message);
        throw new Error('Lỗi đồng bộ Firebase khi lưu đơn hàng: ' + err.message);
      }
    }

    return { name: `order_${Date.now()}`, ...orderRecord };
  },

  async fetchOrders() {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Không thể đọc danh sách đơn hàng.');
    }

    if (CONFIG.FIREBASE_DB_URL && CONFIG.FIREBASE_DB_URL.startsWith('http')) {
      try {
        const url = `${CONFIG.FIREBASE_DB_URL.replace(/\/$/, '')}/orders.json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Lỗi tải đơn hàng: ${response.status}`);
        const data = await response.json();
        if (!data) return [];
        if (typeof data === 'object' && !Array.isArray(data)) {
          return Object.keys(data).map((key) => ({ firebaseId: key, ...data[key] }));
        }
        return data;
      } catch (err) {
        console.warn('[firebaseService.fetchOrders] Lỗi mạng, lấy từ cache:', err.message);
        const cached = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
        return cached ? JSON.parse(cached) : [];
      }
    }

    const cached = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    return cached ? JSON.parse(cached) : [];
  },
};
