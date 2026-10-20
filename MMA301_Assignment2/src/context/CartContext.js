/**
 * =========================================================================
 * CART CONTEXT - QUẢN LÝ TRẠNG THÁI GIỎ HÀNG VÀ TÍNH TOÁN DỮ LIỆU
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Quản lý danh sách sản phẩm trong giỏ hàng (Cart State).
 *    - Cung cấp các thao tác: Thêm (Add), Sửa số lượng (Update), Xóa (Remove), Xóa sạch (Clear).
 *    - Lưu trữ bền vững (Persistence) với AsyncStorage để khi tắt app mở lại giỏ hàng vẫn còn.
 * 
 * 2. Input:
 *    - product (thông tin sản phẩm), quantity (số lượng mua).
 * 
 * 3. Trigger:
 *    - useEffect khi khởi động: Tải giỏ hàng đã lưu từ AsyncStorage.
 *    - User action: Bấm "Thêm vào giỏ", bấm nút "+" / "-", bấm "Xóa sản phẩm".
 * 
 * 4. Transform:
 *    - Thêm mới hoặc tăng số lượng nếu sản phẩm đã có trong giỏ hàng.
 *    - TÍNH TOÁN DẪN XUẤT (DERIVED TOTALS): Tổng số lượng, tạm tính, phí ship, tổng tiền.
 *      [CÂU HỎI VẤN ĐÁP: Vì sao tổng tiền là Derived State chứ không lưu vào state riêng?
 *       Trả lời: Giữ nguyên tắc Single Source of Truth (Nguồn chân lý duy nhất). Khi đó
 *       tổng tiền luôn chính xác 100% dựa trên danh sách món hàng, không bao giờ bị lệch dữ liệu.]
 * 
 * 5. Output / Failure:
 *    - Cung cấp cartItems, totalCount, subtotal, shippingFee, totalAmount cho toàn ứng dụng.
 * =========================================================================
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@mma301_ecommerce_cart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 1. Khôi phục giỏ hàng khi khởi động ứng dụng (Persistence Restore)
  useEffect(() => {
    const restoreCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch (e) {
        console.error('[CartContext] Lỗi khôi phục giỏ hàng:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    restoreCart();
  }, []);

  // 2. Lưu giỏ hàng mỗi khi danh sách món hàng thay đổi (Persistence Save)
  useEffect(() => {
    if (!isLoaded) return; // Không ghi đè trước khi tải xong lần đầu

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (e) {
        console.error('[CartContext] Lỗi lưu giỏ hàng vào AsyncStorage:', e);
      }
    };

    persistCart();
  }, [cartItems, isLoaded]);

  // Thêm sản phẩm vào giỏ
  const addToCart = (product, quantity = 1) => {
    const validQty = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        // Đã có trong giỏ -> Tăng số lượng
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + validQty,
        };
        return updated;
      }

      // Chưa có -> Thêm mới vào đầu danh sách
      return [
        {
          id: product.id,
          title: product.title,
          price: Number(product.price) || 0,
          thumbnail: product.thumbnail || product.images?.[0] || '',
          category: product.category,
          quantity: validQty,
        },
        ...prevItems,
      ];
    });
  };

  // Cập nhật số lượng của một sản phẩm
  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    setCartItems((prevItems) => {
      if (qty <= 0) {
        // Nếu số lượng <= 0 thì tự động xóa khỏi giỏ
        return prevItems.filter((item) => item.id !== productId);
      }

      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      );
    });
  };

  // Xóa sản phẩm khỏi giỏ
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  // Xóa sạch giỏ hàng (sau khi Đặt hàng thành công)
  const clearCart = () => {
    setCartItems([]);
  };

  // =========================================================================
  // TÍNH TOÁN DẪN XUẤT (DERIVED STATE / TOTALS) DÙNG USEMEMO ĐỂ TỐI ƯU HIỆU NĂNG
  // =========================================================================
  const { totalCount, subtotal, shippingFee, totalAmount } = useMemo(() => {
    let count = 0;
    let sum = 0;

    for (const item of cartItems) {
      const q = item.quantity || 1;
      const p = item.price || 0;
      count += q;
      sum += p * q;
    }

    // Miễn phí vận chuyển nếu giỏ hàng rỗng hoặc đơn từ $50 trở lên
    const shipping = count === 0 ? 0 : sum >= 50 ? 0 : 5;
    const finalTotal = sum + shipping;

    return {
      totalCount: count,
      subtotal: Math.round(sum * 100) / 100,
      shippingFee: shipping,
      totalAmount: Math.round(finalTotal * 100) / 100,
    };
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoaded,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        subtotal,
        shippingFee,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
};
