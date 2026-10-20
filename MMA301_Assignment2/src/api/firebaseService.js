/**
 * =========================================================================
 * FIREBASE SERVICE - DỊCH VỤ LƯU TRỮ ĐÁM MÂY (WISHLIST & ORDER HISTORY)
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Đảm nhiệm tương tác với Firebase để đồng bộ danh sách yêu thích (Wishlist)
 *      và lịch sử đơn hàng (Order History) lên cơ sở dữ liệu đám mây.
 *    - Sử dụng chuẩn REST API của Firebase: nhẹ nhàng, không gây xung đột package,
 *      chạy ổn định trên mọi môi trường Expo / React Native.
 * 
 * 2. Input:
 *    - wishlistItems: mảng các sản phẩm yêu thích.
 *    - orderRecord: thông tin đơn hàng mới vừa đặt.
 * 
 * 3. Trigger:
 *    - Khi người dùng bấm "Yêu thích" một sản phẩm.
 *    - Khi người dùng bấm "Đặt hàng" (Checkout) trong giỏ hàng.
 *    - Khi người dùng vào màn hình "Yêu thích / Đơn hàng" để kéo làm mới dữ liệu.
 * 
 * 4. Transform:
 *    - Chuyển đổi dữ liệu sang định dạng JSON và gửi PUT/POST/GET đến Firebase endpoint.
 *    - Hỗ trợ chế độ Mô phỏng / Offline Cache tự động nếu chưa cấu hình URL Firebase.
 * 
 * 5. Output / Failure:
 *    - Trả về dữ liệu đã lưu hoặc mảng rỗng nếu chưa có.
 *    - Xử lý ngoại lệ rõ ràng, thông báo lỗi cho giao diện và KHÔNG làm sập app (Crash).
 * =========================================================================
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../config/config';

const LOCAL_WISHLIST_KEY = '@firebase_backup_wishlist';
const LOCAL_ORDERS_KEY = '@firebase_backup_orders';

// Biến cờ giả lập lỗi (dùng cho việc kiểm thử Test Case #10 của Giảng viên)
let forceSimulateError = false;

export const firebaseService = {
  /**
   * Bật/Tắt cờ ép sinh lỗi để kiểm thử tính năng bắt lỗi (Error Handling Demo)
   */
  setSimulateError(shouldError) {
    forceSimulateError = shouldError;
  },

  isSimulatingError() {
    return forceSimulateError;
  },

  /**
   * Lưu danh sách yêu thích (Wishlist) lên Firebase
   * @param {Array} wishlistItems 
   */
  async syncWishlist(wishlistItems) {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Mô phỏng lỗi quyền truy cập: Permission Denied hoặc Mất kết nối DB.');
    }

    // Luôn lưu bản sao dự phòng cục bộ
    await AsyncStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(wishlistItems));

    // Nếu người dùng cấu hình Firebase DB URL thật
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

    // Chế độ mô phỏng thành công
    return wishlistItems;
  },

  /**
   * Lấy danh sách yêu thích (Wishlist) từ Firebase
   */
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

    // Đọc từ local backup
    const cached = await AsyncStorage.getItem(LOCAL_WISHLIST_KEY);
    return cached ? JSON.parse(cached) : [];
  },

  /**
   * Lưu đơn hàng mới (Order) lên Firebase
   * @param {Object} orderRecord 
   */
  async createOrder(orderRecord) {
    if (forceSimulateError) {
      throw new Error('[Firebase Test] Không thể ghi đơn hàng: Lỗi mạng đám mây.');
    }

    // Đọc lịch sử đơn cũ
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

  /**
   * Lấy lịch sử đơn hàng từ Firebase
   */
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
        // Nếu trả về dạng object chứa các key ngẫu nhiên của Firebase
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
