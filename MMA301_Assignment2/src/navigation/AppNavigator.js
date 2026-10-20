/**
 * =========================================================================
 * APP NAVIGATOR - ĐIỀU HƯỚNG GIAO DIỆN CHÍNH
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Quản lý cấu trúc điều hướng toàn ứng dụng với React Navigation v7.
 *    - Kết hợp Bottom Tab Navigator (5 tab chính) và Native Stack Navigator
 *      để điều hướng sang trang Chi tiết sản phẩm (ProductDetail) và Trợ lý AI (GeminiAI).
 * 
 * 2. Structure:
 *    - Root Stack:
 *        + MainTabs (Bottom Tabs: Catalog, Cart, Wishlist/Orders, AI, Settings)
 *        + ProductDetail (Màn hình chi tiết)
 *        + GeminiAI (Trợ lý AI khi gọi từ chi tiết hoặc nút nhanh)
 * 
 * 3. Highlights:
 *    - Hiển thị Badge số lượng món hàng trên Icon Giỏ hàng (Cart Tab Badge).
 *    - Giao diện thân thiện, hiện đại, màu sắc hài hòa dành cho người mới học.
 * =========================================================================
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';

// Import các màn hình
import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { CartScreen } from '../screens/CartScreen';
import { WishlistScreen } from '../screens/WishlistScreen';
import { GeminiAIScreen } from '../screens/GeminiAIScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 1. Cấu hình Bottom Tab Navigator
function MainTabNavigator() {
  const { totalCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'CatalogTab') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'WishlistTab') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'AITab') {
            iconName = focused ? 'sparkles' : 'sparkles-outline';
          } else if (route.name === 'SettingsTab') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="CatalogTab"
        component={ProductListScreen}
        options={{ tabBarLabel: 'Cửa hàng' }}
      />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: 'Giỏ hàng',
          tabBarBadge: totalCount > 0 ? totalCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#EF4444',
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen
        name="WishlistTab"
        component={WishlistScreen}
        options={{ tabBarLabel: 'Yêu thích' }}
      />
      <Tab.Screen
        name="AITab"
        component={GeminiAIScreen}
        options={{
          tabBarLabel: 'Trợ lý AI',
          tabBarActiveTintColor: '#7C3AED',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: 'Cài đặt' }}
      />
    </Tab.Navigator>
  );
}

// 2. Cấu hình Root Stack Navigator
export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="GeminiAI"
        component={GeminiAIScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}
