/**
 * =========================================================================
 * GEMINI AI SCREEN - TRỢ LÝ TƯ VẤN MUA SẮM THÔNG MINH
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Cung cấp tính năng Trợ lý AI (Google Gemini) gắn với dữ liệu kho hàng thực tế.
 *    - Tiếp nhận nhu cầu khách hàng (ngân sách, sở thích, tính năng cần tìm).
 *    - Gửi ngữ cảnh (Context) sản phẩm thực tế cho Gemini để nhận tư vấn và đề xuất.
 *    - VALIDATION BẮT BUỘC: Lọc và xác thực mảng ID sản phẩm, loại trừ ảo giác (Hallucination)
 *      trước khi hiển thị cho người dùng tương tác.
 * 
 * 2. Input:
 *    - route.params.initialPrompt: câu hỏi mở đầu (nếu chuyển từ ProductDetailScreen sang).
 *    - route.params.catalog: danh sách sản phẩm hiện tại để cung cấp Context cho AI.
 * 
 * 3. Trigger:
 *    - Người dùng chọn một câu hỏi gợi ý nhanh hoặc tự nhập câu hỏi rồi bấm "Gửi".
 * 
 * 4. Transform:
 *    - Đóng gói request, gọi geminiService.getShoppingAdvice().
 *    - Phân tích kết quả: kiểm tra các ID hợp lệ, tính số lượng ID bị từ chối (rejected).
 * 
 * 5. Output / Failure:
 *    - Hiển thị lời khuyên của AI, nhãn minh bạch về kết quả kiểm định ID,
 *      và thẻ sản phẩm thật có thể bấm vào xem chi tiết hoặc thêm vào giỏ ngay.
 * =========================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { geminiService } from '../api/geminiService';
import { productService } from '../api/productService';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export const GeminiAIScreen = ({ route, navigation }) => {
  const { initialPrompt, catalog: initialCatalog } = route.params || {};
  const { addToCart } = useCart();

  const [query, setQuery] = useState(initialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState(initialCatalog || []);
  const [aiResult, setAiResult] = useState(null);

  // Câu hỏi gợi ý sẵn giúp người mới học hoặc giảng viên demo nhanh
  const quickPrompts = [
    'Gợi ý mỹ phẩm dưỡng da giá tốt dưới 30$',
    'Tìm nước hoa thơm lâu cho nam và nữ',
    'Sản phẩm nội thất gia dụng được đánh giá cao',
    'Gợi ý 2 món đồ làm quà tặng sinh nhật',
  ];

  // Nếu chưa có sẵn catalog từ màn hình trước, tự động tải sản phẩm để làm ngữ cảnh
  useEffect(() => {
    if (!catalog || catalog.length === 0) {
      const loadContextCatalog = async () => {
        try {
          const res = await productService.getProducts(0, 20);
          setCatalog(res.products || []);
        } catch (e) {
          console.warn('Lỗi tải danh mục cho AI:', e);
        }
      };
      loadContextCatalog();
    }
  }, [catalog]);

  // Nếu có initialPrompt được truyền sang từ ProductDetail, tự động kích hoạt
  useEffect(() => {
    if (initialPrompt && catalog.length > 0) {
      handleAskAI(initialPrompt);
    }
  }, [initialPrompt, catalog.length > 0]);

  // Xử lý gửi câu hỏi cho Gemini
  const handleAskAI = async (textToAsk) => {
    const promptText = (textToAsk || query).trim();
    if (!promptText) return;

    setLoading(true);
    setAiResult(null);

    try {
      const result = await geminiService.getShoppingAdvice(promptText, catalog);
      setAiResult(result);
    } catch (err) {
      console.error('Lỗi hỏi Gemini:', err);
      setAiResult({
        advice: 'Không thể kết nối đến Trợ lý AI lúc này. Vui lòng thử lại sau ít phút.',
        recommendedProducts: [],
        rejectedIds: [],
        isAiSuccess: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header màn hình AI */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>Trợ lý Mua sắm Gemini AI</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Giới thiệu & Hướng dẫn */}
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>Tư vấn mua sắm theo ngữ cảnh kho hàng</Text>
            <Text style={styles.introSub}>
              Gemini AI sẽ phân tích nhu cầu, đối chiếu với danh mục sản phẩm hiện có và gợi ý
              chính xác sản phẩm thực tế kèm giá bán.
            </Text>
          </View>

          {/* Gợi ý câu hỏi nhanh (Quick Prompts) */}
          <Text style={styles.sectionLabel}>Gợi ý câu hỏi nhanh:</Text>
          <View style={styles.quickPromptContainer}>
            {quickPrompts.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickPromptChip}
                onPress={() => {
                  setQuery(item);
                  handleAskAI(item);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={14} color="#6D28D9" />
                <Text style={styles.quickPromptText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Khung nhập câu hỏi */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập nhu cầu của bạn (Ví dụ: Tìm đồ gia dụng dưới $50)..."
              placeholderTextColor="#94A3B8"
              value={query}
              onChangeText={setQuery}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!query.trim() || loading) && styles.sendBtnDisabled]}
              onPress={() => handleAskAI(query)}
              disabled={!query.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Hiển thị kết quả AI */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text style={styles.loadingText}>Gemini đang phân tích kho hàng và nhu cầu...</Text>
            </View>
          )}

          {aiResult && !loading && (
            <View style={styles.resultContainer}>
              {/* Hộp lời khuyên */}
              <View style={styles.adviceBox}>
                <View style={styles.adviceHeader}>
                  <Ionicons name="bulb-outline" size={20} color="#7C3AED" />
                  <Text style={styles.adviceTitle}>Lời khuyên từ Trợ lý:</Text>
                </View>
                <Text style={styles.adviceText}>{aiResult.advice}</Text>
              </View>

              {/* Bằng chứng Validation chống ảo giác (R10) */}
              <View style={styles.validationNotice}>
                <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
                <Text style={styles.validationText}>
                  Đã xác thực: {aiResult.recommendedProducts.length} sản phẩm thực tế có trong kho.
                  {aiResult.rejectedIds?.length > 0 &&
                    ` (Đã loại bỏ ${aiResult.rejectedIds.length} ID ảo không tồn tại)`}
                </Text>
              </View>

              {/* Danh sách thẻ sản phẩm gợi ý */}
              {aiResult.recommendedProducts.length > 0 ? (
                <View style={styles.productsSection}>
                  <Text style={styles.productsTitle}>Sản phẩm phù hợp được đề xuất:</Text>
                  {aiResult.recommendedProducts.map((prod) => (
                    <View key={prod.id} style={styles.cardWrapper}>
                      <ProductCard
                        product={prod}
                        onPress={() => navigation.navigate('ProductDetail', { productId: prod.id })}
                        onAddToCart={() => addToCart(prod, 1)}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noMatchText}>
                  Không tìm thấy sản phẩm nào hoàn toàn khớp. Hãy thử điều chỉnh mức giá hoặc từ khóa.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    backgroundColor: '#7C3AED',
    padding: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#5B21B6',
    marginBottom: 4,
  },
  introSub: {
    fontSize: 12,
    color: '#6D28D9',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  quickPromptContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  quickPromptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderWidth: 1,
    borderColor: '#E9D5FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  quickPromptText: {
    fontSize: 12,
    color: '#6D28D9',
    marginLeft: 6,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 20,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 14,
    color: '#0F172A',
    paddingHorizontal: 8,
  },
  sendBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: '#C4B5FD',
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '500',
  },
  resultContainer: {
    marginTop: 8,
  },
  adviceBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#5B21B6',
    marginLeft: 6,
  },
  adviceText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  validationText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  productsSection: {
    marginTop: 8,
  },
  productsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  noMatchText: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 13,
    marginTop: 16,
  },
});
