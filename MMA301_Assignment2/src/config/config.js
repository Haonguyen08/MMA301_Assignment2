/**
 * Configuration module cho ứng dụng MMA301 E-Commerce App
 * 
 * NGUYÊN TẮC BẢO MẬT:
 * - Không commit API key hoặc secret thật lên GitHub repository.
 * - Sử dụng placeholder, sinh viên có thể điền API key cá nhân khi chạy demo.
 */

export const CONFIG = {
  // Remote Product API (DummyJSON cung cấp dữ liệu thật, hỗ trợ phân trang & tìm kiếm)
  PRODUCT_API_BASE_URL: 'https://dummyjson.com/products',

  // Google Gemini API Configuration
  // Lấy API key miễn phí tại: https://aistudio.google.com/
  // Để trống sẽ tự động kích hoạt chế độ Giả lập AI (Fallback Demo) an toàn
  GEMINI_API_KEY: '', // Điền Gemini API Key của bạn vào đây khi kiểm thử thật
  GEMINI_MODEL: 'gemini-1.5-flash',

  // Firebase Configuration (Sử dụng Firebase Realtime Database hoặc Firestore REST API)
  // Ví dụ: https://your-project-id-default-rtdb.firebaseio.com
  FIREBASE_DB_URL: '', // Điền Firebase DB URL nếu có; nếu trống sẽ dùng chế độ Cloud Mock an toàn

  // Default App Settings
  PAGINATION_LIMIT: 10,
  APP_NAME: 'MMA301 E-Commerce',
  STUDENT_NAME: 'Sinh Viên',
  CLASS_CODE: 'MMA301',
};
