/**
 * =========================================================================
 * PRODUCT DETAIL SCREEN - MÀN HÌNH CHI TIẾT SẢN PHẨM
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Hiển thị đầy đủ thông tin chi tiết một sản phẩm theo ID: hình ảnh, giá, mô tả, đánh giá, tồn kho.
 *    - Thao tác: Tăng/giảm số lượng đặt mua, Thêm vào giỏ hàng (Cart), Lưu yêu thích (Firebase Wishlist).
 *    - Điểm kết nối Trợ lý AI (Gemini AI Entry Point) để tư vấn sản phẩm đang xem.
 * 
 * 2. Input:
 *    - route.params.productId: ID của sản phẩm được truyền từ ProductListScreen.
 * 
 * 3. Trigger:
 *    - useEffect: Tải chi tiết sản phẩm qua productService.getProductById(productId).
 *    - User actions: Bấm nút tăng giảm số lượng, bấm "Thêm vào giỏ", bấm icon Yêu thích.
 * 
 * 4. Transform:
 *    - Validate ID: Nếu ID rỗng hoặc API trả về 404, hiển thị trạng thái lỗi rõ ràng (R04).
 * 
 * 5. Output / Failure:
 *    - Hiển thị giao diện chi tiết đẹp mắt, phản hồi thông báo (Toast/Alert) khi thêm giỏ thành công.
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { productService } from '../api/productService';
import { LoadingView } from '../components/LoadingView';
import { ErrorRetry } from '../components/ErrorRetry';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export const ProductDetailScreen = ({ route, navigation }) => {
  const { productId } = route.params || {};
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // 1. Tải thông tin sản phẩm
  const loadDetail = async () => {
    if (!productId) {
      setErrorMessage('Không tìm thấy mã sản phẩm hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (err) {
      setErrorMessage(err.message || 'Không thể tải thông tin sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [productId]);

  // Xử lý tăng giảm số lượng
  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => Math.max(1, prev - 1));

  // Thêm vào giỏ hàng
  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    Alert.alert(
      'Thành công',
      `Đã thêm ${quantity} sản phẩm "${product.title}" vào giỏ hàng!`,
      [
        { text: 'Tiếp tục xem' },
        { text: 'Xem giỏ hàng', onPress: () => navigation.navigate('CartTab') },
      ]
    );
  };

  if (loading) {
    return <LoadingView message="Đang tải thông tin sản phẩm..." />;
  }

  if (errorMessage || !product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        </View>
        <ErrorRetry message={errorMessage || 'Sản phẩm không tồn tại.'} onRetry={loadDetail} />
      </SafeAreaView>
    );
  }

  const wishlisted = isWishlisted(product.id);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header điều hướng */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <TouchableOpacity onPress={() => toggleWishlist(product)} style={styles.iconBtn}>
          <Ionicons
            name={wishlisted ? 'heart' : 'heart-outline'}
            size={24}
            color={wishlisted ? '#EF4444' : '#0F172A'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ảnh sản phẩm */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: product.thumbnail || product.images?.[0] }}
            style={styles.productImage}
            resizeMode="contain"
          />
          {product.discountPercentage && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{Math.round(product.discountPercentage)}%</Text>
            </View>
          )}
        </View>

        {/* Thông tin cơ bản */}
        <View style={styles.body}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            {product.brand && <Text style={styles.brandText}>Thương hiệu: {product.brand}</Text>}
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRatingRow}>
            <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingScore}>{product.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.stockText}>
                {product.stock > 0 ? `(Còn ${product.stock} sp)` : '(Hết hàng)'}
              </Text>
            </View>
          </View>

          {/* Nút Tư vấn AI gắn với ngữ cảnh sản phẩm này */}
          <TouchableOpacity
            style={styles.aiConsultBtn}
            onPress={() =>
              navigation.navigate('GeminiAI', {
                initialPrompt: `Tư vấn cho tôi về sản phẩm: "${product.title}" (Giá $${product.price}, danh mục ${product.category}). Sản phẩm này có phù hợp không và ưu điểm là gì?`,
                catalog: [product],
              })
            }
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={18} color="#7C3AED" />
            <Text style={styles.aiConsultText}>Hỏi Trợ lý AI về sản phẩm này</Text>
            <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
          </TouchableOpacity>

          {/* Mô tả chi tiết */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Thông tin bảo hành & giao hàng */}
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
              <Text style={styles.infoItemText}>
                {product.warrantyInformation || 'Bảo hành chính hãng 12 tháng'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="cube-outline" size={20} color="#3B82F6" />
              <Text style={styles.infoItemText}>
                {product.shippingInformation || 'Giao hàng tận nơi 2-4 ngày'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Thanh công cụ thêm vào giỏ hàng dưới đáy */}
      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={handleDecrease} style={styles.qtyBtn}>
            <Ionicons name="remove" size={18} color="#334155" />
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity onPress={handleIncrease} style={styles.qtyBtn}>
            <Ionicons name="add" size={18} color="#334155" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.85}>
          <Ionicons name="cart" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartText}>Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginHorizontal: 12,
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  imageWrapper: {
    height: 280,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '90%',
    height: '90%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  body: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  brandText: {
    fontSize: 12,
    color: '#64748B',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 28,
  },
  priceRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
  },
  stockText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  aiConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  aiConsultText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoItemText: {
    fontSize: 13,
    color: '#334155',
    marginLeft: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 12,
  },
  qtyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563EB',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
