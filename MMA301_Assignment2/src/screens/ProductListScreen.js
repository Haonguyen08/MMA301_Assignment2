/**
 * =========================================================================
 * PRODUCT LIST SCREEN - MÀN HÌNH DANH SÁCH SẢN PHẨM & TÌM KIẾM
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Hiển thị danh mục sản phẩm remote từ DummyJSON dưới dạng FlatList 2 cột.
 *    - Hỗ trợ Phân trang vô tận (Infinite Scrolling), Kéo làm mới (Pull-to-refresh).
 *    - Tìm kiếm theo từ khóa và Lọc theo Danh mục (Category Filter).
 * 
 * 2. Input:
 *    - Từ khóa tìm kiếm (searchQuery), Danh mục được chọn (selectedCategory).
 * 
 * 3. Trigger:
 *    - useEffect: Tải sản phẩm lần đầu và tải danh sách danh mục.
 *    - onEndReached: Kích hoạt khi cuộn đến cuối danh sách để tải thêm trang tiếp theo.
 *    - onRefresh: Kích hoạt khi người dùng kéo màn hình xuống để làm mới.
 * 
 * 4. Transform:
 *    - Gọi productService, nối thêm dữ liệu vào state: `[...prev, ...newItems]`.
 *    - BẢO VỆ PHÂN TRANG (PAGINATION GUARD): Chặn gọi trùng lặp bằng cờ `loadingMore` và `hasMore`.
 * 
 * 5. Output / Failure:
 *    - Render danh sách ProductCard; hiển thị Skeleton/Spinner khi tải,
 *      EmptyState khi tìm không thấy, và ErrorRetry khi mất kết nối mạng.
 * =========================================================================
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../api/productService';
import { ProductCard } from '../components/ProductCard';
import { LoadingView } from '../components/LoadingView';
import { EmptyState } from '../components/EmptyState';
import { ErrorRetry } from '../components/ErrorRetry';
import { useCart } from '../context/CartContext';
import { CONFIG } from '../config/config';

export const ProductListScreen = ({ navigation }) => {
  const { addToCart } = useCart();

  // State dữ liệu danh mục & sản phẩm
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // State tìm kiếm
  const [searchQuery, setSearchQuery] = useState('');

  // State trạng thái tải (Loading / Pagination / Refreshing / Error)
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // Vị trí con trỏ phân trang (skip offset)
  const skipRef = useRef(0);
  const onEndReachedCalledDuringMomentum = useRef(true);

  // 1. Tải danh mục khi màn hình khởi tạo
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catList = await productService.getCategories();
        setCategories(['all', ...catList]);
      } catch (e) {
        console.warn('Lỗi lấy danh mục:', e);
      }
    };
    loadCategories();
  }, []);

  // 2. Hàm gọi dữ liệu chính (Core fetch data)
  const fetchProductData = useCallback(
    async (isRefresh = false, skip = 0) => {
      if (isRefresh) {
        setErrorMessage(null);
      }

      try {
        let result;
        if (searchQuery.trim().length > 0) {
          result = await productService.searchProducts(searchQuery, skip, CONFIG.PAGINATION_LIMIT);
        } else if (selectedCategory !== 'all') {
          result = await productService.getProductsByCategory(selectedCategory, skip, CONFIG.PAGINATION_LIMIT);
        } else {
          result = await productService.getProducts(skip, CONFIG.PAGINATION_LIMIT);
        }

        if (isRefresh) {
          setProducts(result.products);
        } else {
          // Tránh thêm trùng sản phẩm bằng Map
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const freshItems = result.products.filter((p) => !existingIds.has(p.id));
            return [...prev, ...freshItems];
          });
        }

        setHasMore(result.hasMore);
        skipRef.current = skip + result.products.length;
      } catch (err) {
        setErrorMessage(err.message || 'Không thể tải danh sách sản phẩm.');
      } finally {
        setInitialLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  // 3. Tải lại khi thay đổi danh mục hoặc từ khóa tìm kiếm
  useEffect(() => {
    setInitialLoading(true);
    skipRef.current = 0;
    fetchProductData(true, 0);
  }, [fetchProductData]);

  // 4. Kéo làm mới (Pull-to-refresh)
  const handleRefresh = () => {
    setRefreshing(true);
    skipRef.current = 0;
    fetchProductData(true, 0);
  };

  // 5. Tải thêm khi cuộn xuống đáy (Pagination Guard)
  const handleLoadMore = () => {
    // [CÂU HỎI VẤN ĐÁP]: onEndReached có thể gọi lặp khi nào?
    // Trả lời: Khi chưa khóa loading, onEndReached sẽ bị kích hoạt nhiều lần liên tiếp
    // dẫn đến request trùng lặp. Guard dưới đây giải quyết triệt để vấn đề này.
    if (
      !onEndReachedCalledDuringMomentum.current &&
      !loadingMore &&
      !initialLoading &&
      hasMore &&
      !errorMessage
    ) {
      setLoadingMore(true);
      fetchProductData(false, skipRef.current);
      onEndReachedCalledDuringMomentum.current = true;
    }
  };

  // Render thanh lọc danh mục ngang (Horizontal Chips)
  const renderCategoryFilter = () => (
    <View style={styles.categoryContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              onPress={() => {
                if (selectedCategory !== cat) {
                  setSelectedCategory(cat);
                }
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  // Footer của FlatList: hiển thị Spinner tải thêm hoặc thông báo hết dữ liệu
  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.footerText}>Đang tải thêm...</Text>
        </View>
      );
    }
    if (!hasMore && products.length > 0) {
      return (
        <View style={styles.footerLoader}>
          <Text style={styles.endText}>✓ Đã hiển thị tất cả {products.length} sản phẩm</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header thanh tìm kiếm */}
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm điện thoại, laptop, mỹ phẩm..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Nút truy cập nhanh Trợ lý AI */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('GeminiAI', { catalog: products })}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={18} color="#FFFFFF" />
          <Text style={styles.aiButtonText}>AI</Text>
        </TouchableOpacity>
      </View>

      {/* Thanh bộ lọc danh mục */}
      {renderCategoryFilter()}

      {/* Nội dung chính: Loading / Error / Empty / FlatList */}
      {initialLoading ? (
        <LoadingView message="Đang tải danh mục sản phẩm..." />
      ) : errorMessage && products.length === 0 ? (
        <ErrorRetry message={errorMessage} onRetry={() => fetchProductData(true, 0)} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
              onAddToCart={() => addToCart(item, 1)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          onMomentumScrollBegin={() => {
            onEndReachedCalledDuringMomentum.current = false;
          }}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title="Không tìm thấy sản phẩm"
              message={`Không có kết quả nào phù hợp với "${searchQuery}". Hãy thử từ khóa khác hoặc bỏ chọn danh mục.`}
              buttonText="Xóa tìm kiếm"
              onPressButton={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    marginLeft: 8,
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 4,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 6,
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
  },
  endText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
