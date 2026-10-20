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
