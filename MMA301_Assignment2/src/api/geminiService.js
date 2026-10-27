import { CONFIG } from '../config/config';

export const geminiService = {
  async getShoppingAdvice(userNeed, currentCatalog = []) {
    const simplifiedCatalog = currentCatalog.slice(0, 15).map((p) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      category: p.category,
      rating: p.rating,
    }));

    if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.trim() === '') {
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

      const modelsToTry = [...new Set([CONFIG.GEMINI_MODEL, 'gemini-3.5-flash-lite', 'gemini-2.5-flash'].filter(Boolean))];
      let response = null;
      let lastError = null;

      for (const model of modelsToTry) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const res = await fetch(endpoint, {
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

          if (res.ok) {
            response = res;
            break;
          } else {
            lastError = `Model ${model} báo lỗi: ${res.status}`;
          }
        } catch (e) {
          lastError = e.message;
        }
      }

      if (!response) {
        throw new Error(lastError || 'Không kết nối được tới dịch vụ Gemini');
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Định dạng phản hồi AI không đúng chuẩn JSON.');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const rawIds = Array.isArray(parsed.recommendedProductIds) ? parsed.recommendedProductIds : [];

      const validProducts = [];
      const rejectedIds = [];

      rawIds.forEach((id) => {
        const matched = currentCatalog.find((item) => Number(item.id) === Number(id));
        if (matched) {
          validProducts.push(matched);
        } else {
          rejectedIds.push(id);
        }
      });

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

  localCatalogMatcher(userNeed, catalog = [], prefixMessage = '') {
    const query = (userNeed || '').toLowerCase();
    
    let matched = catalog.filter((p) => {
      const title = (p.title || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return title.includes(query) || cat.includes(query) || desc.includes(query);
    });

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
