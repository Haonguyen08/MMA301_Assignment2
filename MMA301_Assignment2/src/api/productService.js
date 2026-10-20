/**
 * =========================================================================
 * PRODUCT SERVICE - TẦNG DỊCH VỤ DỮ LIỆU SẢN PHẨM TỪ REMOTE API
 * =========================================================================
 * 1. Purpose (Trách nhiệm):
 *    - Đóng gói các hàm gọi HTTP request tới Remote Server (DummyJSON).
 *    - Tách biệt logic kết nối mạng khỏi giao diện (Screen/UI).
 * 
 * 2. Input:
 *    - skip (số lượng bản ghi bỏ qua), limit (số bản ghi mỗi trang), query (từ khóa tìm kiếm), category, id.
 * 
 * 3. Trigger:
 *    - Được kích hoạt từ ProductListScreen (khi mở màn hình, cuộn trang, tìm kiếm)
 *      hoặc ProductDetailScreen (khi xem chi tiết).
 * 
 * 4. Transform:
 *    - Gửi HTTP GET request bằng fetch(), phân tích JSON phản hồi từ server,
 *      chuẩn hóa danh sách sản phẩm và tổng số bản ghi (total).
 * 
 * 5. Output / Failure:
 *    - Trả về { products, total, hasMore } khi thành công.
 *    - Bắt lỗi mạng (Network Error / Timeout), ném ra thông điệp thân thiện không làm crash app.
 * =========================================================================
 */

import { CONFIG } from '../config/config';

export const productService = {
  /**
   * Lấy danh sách sản phẩm có phân trang (Pagination)
   * @param {number} skip - Vị trí bắt đầu lấy
   * @param {number} limit - Số sản phẩm trên mỗi trang
   */
  async getProducts(skip = 0, limit = CONFIG.PAGINATION_LIMIT) {
    try {
      const url = `${CONFIG.PRODUCT_API_BASE_URL}?limit=${limit}&skip=${skip}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Lỗi máy chủ: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return {
        products: data.products || [],
        total: data.total || 0,
        hasMore: skip + (data.products?.length || 0) < (data.total || 0),
      };
    } catch (error) {
      console.error('[productService.getProducts] Lỗi:', error.message);
      throw new Error(
        error.message.includes('Network')
          ? 'Không có kết nối mạng. Vui lòng kiểm tra Wi-Fi / 4G và thử lại.'
          : error.message || 'Không thể tải danh sách sản phẩm.'
      );
    }
  },

  /**
   * Tìm kiếm sản phẩm theo từ khóa (Search)
   * @param {string} query - Từ khóa tìm kiếm
   * @param {number} skip - Vị trí bắt đầu
   * @param {number} limit - Số sản phẩm
   */
  async searchProducts(query, skip = 0, limit = CONFIG.PAGINATION_LIMIT) {
    try {
      const trimmed = query.trim();
      if (!trimmed) {
        return this.getProducts(0, limit);
      }

      const url = `${CONFIG.PRODUCT_API_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&limit=${limit}&skip=${skip}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Lỗi tìm kiếm: ${response.status}`);
      }

      const data = await response.json();
      return {
        products: data.products || [],
        total: data.total || 0,
        hasMore: skip + (data.products?.length || 0) < (data.total || 0),
      };
    } catch (error) {
      console.error('[productService.searchProducts] Lỗi:', error.message);
      throw new Error('Lỗi tìm kiếm sản phẩm: ' + error.message);
    }
  },

  /**
   * Lấy danh sách danh mục (Categories) để hiển thị bộ lọc (Filter)
   */
  async getCategories() {
    try {
      const url = `${CONFIG.PRODUCT_API_BASE_URL}/categories`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải danh mục');
      const data = await response.json();

      // DummyJSON trả về mảng chuỗi hoặc mảng object ({slug, name}) tùy phiên bản
      return data.map((item) => (typeof item === 'string' ? item : item.slug || item.name));
    } catch (error) {
      console.warn('[productService.getCategories] Dùng danh mục mặc định:', error.message);
      // Fallback danh mục mặc định phòng trường hợp lỗi mạng
      return ['beauty', 'fragrances', 'furniture', 'groceries'];
    }
  },

  /**
   * Lấy sản phẩm theo danh mục cụ thể
   */
  async getProductsByCategory(category, skip = 0, limit = CONFIG.PAGINATION_LIMIT) {
    try {
      const url = `${CONFIG.PRODUCT_API_BASE_URL}/category/${category}?limit=${limit}&skip=${skip}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Lỗi lọc danh mục: ${response.status}`);
      const data = await response.json();
      return {
        products: data.products || [],
        total: data.total || 0,
        hasMore: skip + (data.products?.length || 0) < (data.total || 0),
      };
    } catch (error) {
      console.error('[productService.getProductsByCategory] Lỗi:', error.message);
      throw new Error('Lỗi khi lọc sản phẩm theo danh mục.');
    }
  },

  /**
   * Lấy chi tiết một sản phẩm theo ID (Product Detail)
   * @param {number|string} id - Mã định danh sản phẩm
   */
  async getProductById(id) {
    try {
      if (!id) throw new Error('Mã sản phẩm không hợp lệ.');
      const url = `${CONFIG.PRODUCT_API_BASE_URL}/${id}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Sản phẩm không tồn tại hoặc đã bị xóa.');
        }
        throw new Error(`Lỗi máy chủ (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error('[productService.getProductById] Lỗi:', error.message);
      throw error;
    }
  },
};
