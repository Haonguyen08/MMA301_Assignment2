/**
 * =========================================================================
 * MMA301 - ASSIGNMENT 02: INTEGRATED E-COMMERCE MOBILE APPLICATION
 * =========================================================================
 * Entry point của ứng dụng React Native / Expo
 * 
 * Luồng dữ liệu và Context Provider:
 * SafeAreaProvider
 *  └── CartProvider (Quản lý giỏ hàng + Derived totals + AsyncStorage)
 *       └── WishlistProvider (Quản lý Yêu thích + Đơn hàng + Firebase Cloud sync)
 *            └── NavigationContainer
 *                 └── AppNavigator (Bottom Tabs & Stack Screens)
 * =========================================================================
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <WishlistProvider>
          <NavigationContainer>
            <AppNavigator />
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          </NavigationContainer>
        </WishlistProvider>
      </CartProvider>
    </SafeAreaProvider>
  );
}
