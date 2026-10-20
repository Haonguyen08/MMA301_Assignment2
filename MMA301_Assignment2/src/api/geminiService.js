/**
 * =========================================================================
 * GEMINI AI SERVICE - DỊCH VỤ TRỢ LÝ TƯ VẤN MUA SẮM AI THÔNG MINH
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Gửi ngữ cảnh sản phẩm thật (Catalog Context) và nhu cầu người dùng đến Google Gemini AI.
 *    - Xác thực (Validation) kết quả phản hồi của AI: chỉ chấp nhận các Product ID thực sự
 *      tồn tại trong kho hàng, loại bỏ ID ảo do AI tự bịa ra (Hallucination).
 * 
 * 2. Input:
 *    - userNeed: câu hỏi/yêu cầu của người dùng (ví dụ: "Tìm giúp tôi mỹ phẩm dưới 20$").
 *    - currentCatalog: mảng các sản phẩm thật đang có trong ứng dụng.
 * 
 * 3. Trigger:
 *    - Người dùng bấm nút "Hỏi AI" trên thanh Tab hoặc nút "Tư vấn AI" trong chi tiết sản phẩm.
 * 
 * 4. Transform:
 *    - Đóng gói Prompt chứa danh mục sản phẩm (ID, tên, giá, ngành hàng).
 *    - Gọi Google Gemini REST API (gemini-1.5-flash).
 *    - Trích xuất JSON, lọc và đối chiếu (Match & Validate) mảng ID với catalog thật.
 * 
 * 5. Output / Failure:
 *    - Trả về { advice, recommendedProducts, rejectedIds, isAiSuccess }.
 *    - Nếu mất mạng, hết hạn key hoặc phản hồi lỗi -> Kích hoạt thuật toán Fallback
 *      tự động gợi ý sản phẩm phù hợp dựa trên từ khóa mà không làm sập ứng dụng.
 * =========================================================================
 */

import { CONFIG } from '../config/config';

export const geminiService = {
  /**
   * Phân tích nhu cầu và gợi ý sản phẩm gắn liền với dữ liệu kho hàng
   * @param {string} userNeed - Yêu cầu từ người dùng
   * @param {Array} currentCatalog - Danh mục sản phẩm thật đang hiển thị
   */
  async getShoppingAdvice(userNeed, currentCatalog = []) {
    // 1. Chuẩn bị ngữ cảnh danh mục sản phẩm (Rút gọn để tiết kiệm token và đảm bảo tốc độ)
    const simplifiedCatalog = currentCatalog.slice(0, 15).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      rating: p.rating,
    }));

    // Nếu không có API Key hoặc không có mạng, dùng bộ gợi ý thông minh cục bộ (Fallback)
    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.trim() === '') {
      console.log('[geminiService] Chưa có API Key, sử dụng thuật toán Fallback cục bộ an toàn.');
      return this.localCatalogMatcher(userNeed, currentCatalog, 'Chế độ Trợ lý AI Demo (Không có API Key):');
    }

    try {
      const systemInstruction = `Bạn là trợ lý tư vấn mua sắm chuyên nghiệp cho cửa hàng điện tử.
Dưới đây là danh sách sản phẩm THẬT hiện có trong kho:
${JSON.stringify(simplifiedCatalog)}

Quy tắc bắt buộc:
1. Chỉ được gợi ý các sản phẩm có ID trong danh sách trên.
2. Trả về đúng định dạng JSON duy nhất như sau (không kèm markdown ngoài JSON):
{
  "advice": "Lời khuyên ngắn gọn và hữu ích cho khách hàng",
  "recommendedProductIds": [các số ID nguyên phù hợp nhất]
}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

      // Thiết lập timeout 10 giây để không làm treo giao diện
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemInstruction },
                { text: `Nhu cầu khách hàng: "${userNeed}"` },
              ],
            },
          ],
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gemini API trả về mã lỗi: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Trích xuất JSON từ chuỗi kết quả (xử lý trường hợp có bọc ```json ... ```)
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Định dạng phản hồi AI không đúng chuẩn JSON.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const rawIds = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];

      // =========================================================================
      // BƯỚC VALIDATION CỐT LÕI (BẢO VỆ KHỎI AI HALLUCINATION - YÊU CẦU ĐỀ BÀI)
      // =========================================================================
      const validProducts = [];
      const rejectedIds = [];

      rawIds.forEach((id) => {
        const matched = currentCatalog.find((item) => Number(item.id) === Number(id));
        if (matched) {
          validProducts.push(matched);
        } else {
          rejectedIds.push(id); // Phát hiện và ghi nhận ID ảo do AI tạo ra
        }
      });

      console.log(`[geminiService] Đã duyệt: ${validProducts.length} hợp lệ, ${rejectedIds.length} ID bị từ chối do không có trong kho.`);

      // Nếu không tìm được sản phẩm nào hợp lệ sau khi validate, dùng fallback
      if (validProducts.length === 0) {
        return this.localCatalogMatcher(
          userNeed,
          currentCatalog,
          parsed.advice || 'Gemini đã phân tích nhu cầu của bạn nhưng gợi ý các mặt hàng sau phù hợp hơn:'
        );
      }

      return {
        advice: parsed.advice || 'Dưới đây là các gợi ý tốt nhất dành cho bạn:',
        recommendedProducts: validProducts,
        rejectedIds: rejectedIds,
        isAiSuccess: true,
      };
    } catch (err) {
      console.warn('[geminiService] Lỗi khi gọi Gemini, chuyển sang cơ chế dự phòng an toàn:', err.message);
      return this.localCatalogMatcher(
        userNeed,
        currentCatalog,
        `Hệ thống AI tạm thời bận (${err.message}). Đây là các gợi ý tốt nhất từ kho hàng:`
      );
    }
  },

  /**
   * Thuật toán Fallback cục bộ: Tìm kiếm theo từ khóa / ngân sách để luôn trả về sản phẩm thật
   */
  localCatalogMatcher(userNeed, catalog = [], prefixMessage = '') {
    const query = (userNeed || '').toLowerCase();
    
    // Tìm kiếm sản phẩm theo tên hoặc danh mục
    let matched = catalog.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return title.includes(query) || cat.includes(query) || desc.includes(query);
    });

    // Nếu không khớp từ khóa cụ thể, lấy top sản phẩm có rating cao nhất
    if (matched.length === 0) {
      matched = [...catalog].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    } else {
      matched = matched.slice(0, 3);
    }

    return {
      advice: `${prefixMessage} Chúng tôi đã chọn lọc ra ${matched.length} sản phẩm phù hợp nhất với yêu cầu "${userNeed}".`,
      recommendedProducts: matched,
      rejectedIds: [],
      isAiSuccess: false,
    };
  },
};
