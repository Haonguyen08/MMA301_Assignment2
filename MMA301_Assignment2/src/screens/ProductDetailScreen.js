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

  const handleIncrease = () => setQuantity((prev) => prev + 1);
  const handleDecrease = () => setQuantity((prev) => Math.max(1, prev - 1));

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
            <Text style={styles.backText}>&lt; Quay lại</Text>
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
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>&lt; Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.title}
        </Text>
        <TouchableOpacity
          onPress={() => toggleWishlist(product)}
          style={[styles.favBtn, wishlisted && styles.favBtnActive]}
        >
          <Text style={[styles.favBtnText, wishlisted && styles.favBtnTextActive]}>
            {wishlisted ? 'Đã lưu' : 'Lưu'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        <View style={styles.body}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{product.category}</Text>
            {product.brand && <Text style={styles.brandText}>Thương hiệu: {product.brand}</Text>}
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRatingRow}>
            <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
            <View style={styles.ratingBox}>
              <Text style={styles.starText}>★</Text>
              <Text style={styles.ratingScore}>{product.rating?.toFixed(1) || '5.0'}</Text>
              <Text style={styles.stockText}>
                {product.stock > 0 ? `(Còn ${product.stock} sp)` : '(Hết hàng)'}
              </Text>
            </View>
          </View>

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
            <Text style={styles.aiConsultText}>Hỏi Trợ lý AI về sản phẩm này</Text>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.infoItemText}>
                {product.warrantyInformation || 'Bảo hành chính hãng 12 tháng'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.bulletText}>•</Text>
              <Text style={styles.infoItemText}>
                {product.shippingInformation || 'Giao hàng tận nơi 2-4 ngày'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.quantityControl}>
          <TouchableOpacity onPress={handleDecrease} style={styles.qtyBtn}>
            <Text style={styles.qtySign}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyValue}>{quantity}</Text>
          <TouchableOpacity onPress={handleIncrease} style={styles.qtyBtn}>
            <Text style={styles.qtySign}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart} activeOpacity={0.85}>
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
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  backText: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginHorizontal: 10,
  },
  favBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  favBtnActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  favBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  favBtnTextActive: {
    color: '#DC2626',
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
  starText: {
    fontSize: 14,
    color: '#F59E0B',
  },
  ratingScore: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 3,
  },
  stockText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 6,
  },
  aiConsultBtn: {
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
    fontWeight: '700',
    fontSize: 13,
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
  bulletText: {
    fontSize: 16,
    color: '#2563EB',
    marginRight: 6,
  },
  infoItemText: {
    fontSize: 13,
    color: '#334155',
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
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  qtySign: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  qtyValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  addToCartBtn: {
    flex: 1,
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
