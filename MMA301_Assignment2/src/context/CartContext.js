import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = '@mma301_ecommerce_cart';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

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

  useEffect(() => {
    if (!isLoaded) return;

    const persistCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (e) {
        console.error('[CartContext] Lỗi lưu giỏ hàng vào AsyncStorage:', e);
      }
    };

    persistCart();
  }, [cartItems, isLoaded]);

  const addToCart = (product, quantity = 1) => {
    const validQty = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + validQty,
        };
        return updated;
      }

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

  const updateQuantity = (productId, newQuantity) => {
    const qty = parseInt(newQuantity, 10);

    setCartItems((prevItems) => {
      if (qty <= 0) {
        return prevItems.filter((item) => item.id !== productId);
      }

      return prevItems.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      );
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const { totalCount, subtotal, shippingFee, totalAmount } = useMemo(() => {
    let count = 0;
    let sum = 0;

    for (const item of cartItems) {
      const q = item.quantity || 1;
      const p = item.price || 0;
      count += q;
      sum += p * q;
    }

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
