export const CONFIG = {
  PRODUCT_API_BASE_URL: process.env.EXPO_PUBLIC_PRODUCT_API_BASE_URL || 'https://dummyjson.com/products',
  GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.5-flash-lite',
  FIREBASE_DB_URL: process.env.EXPO_PUBLIC_FIREBASE_DB_URL || '',
  PAGINATION_LIMIT: 10,
  APP_NAME: 'MMA301 E-Commerce',
  STUDENT_NAME: 'Sinh Viên',
  CLASS_CODE: 'MMA301',
};
