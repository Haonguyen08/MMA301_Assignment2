import { CONFIG } from '../config/config';

export const productService = {
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

  async getCategories() {
    try {
      const url = `${CONFIG.PRODUCT_API_BASE_URL}/categories`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Không thể tải danh mục');
      const data = await response.json();
      return data.map((item) => (typeof item === 'string' ? item : item.slug || item.name));
    } catch (error) {
      console.warn('[productService.getCategories] Dùng danh mục mặc định:', error.message);
      return ['beauty', 'fragrances', 'furniture', 'groceries'];
    }
  },

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
