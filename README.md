# MMA301 – ASSIGNMENT 02: INTEGRATED E-COMMERCE MOBILE APPLICATION

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Nền tảng:** React Native (Expo SDK 57) + JavaScript  
> **Sinh viên:** Haonguyen08  
> **Lớp:** MMA301  

---

## 📌 HỒ SƠ ĐÁNH GIÁ & DANH MỤC TÀI LIỆU (DOCUMENTATION INDEX)

Tài liệu đồ án đã được chuẩn hóa và tách riêng thành từng tệp chuyên biệt theo đúng quy định mục 0.1 trong Student Guide:

| Tài liệu | Tệp tin | Nội dung tóm tắt |
|---|---|---|
| **RTM & Quyết định thiết kế** | [docs/RTM_DDR.md](docs/RTM_DDR.md) | Ma trận 12 yêu cầu (R01-R12), Sơ đồ tích hợp (Integration Map) & 7 quyết định thiết kế cốt lõi (DDR). |
| **Ma trận kiểm thử (15 Cases)** | [docs/TEST_MATRIX.md](docs/TEST_MATRIX.md) | Bảng kiểm thử chi tiết 15 kịch bản (Normal, Negative, Edge cases) từ API, Giỏ hàng, Firebase đến Gemini AI. |
| **Nhật ký sửa lỗi (Debug Logs)** | [docs/DEBUG_LOGS.md](docs/DEBUG_LOGS.md) | 2 lỗi thực tế theo quy trình 5 bước: Mismatch thư viện SDK 57 & Hermes-parser Metro bundle export. |
| **Nhật ký sử dụng AI** | [docs/AI_USAGE_LOG.md](docs/AI_USAGE_LOG.md) | Bảng minh bạch sử dụng AI: Prompt, mục đích, phân tích phản biện, phần điều chỉnh và kiểm chứng. |
| **Hướng dẫn vấn đáp & Chỉ code** | [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md) | Khung 5 bước giải thích code, Rehearsal Checklist định vị file trong 30s, câu hỏi trọng tâm & Transfer tasks. |
| **Hướng dẫn đóng gói Release** | [docs/RELEASE_GUIDE.md](docs/RELEASE_GUIDE.md) | Các bước tạo file APK với EAS Build & bằng chứng biên dịch Production Bundle Hermes (`.hbc`). |

---

## 1. TỔNG QUAN DỰ ÁN & BUSINESS WORKFLOW

Ứng dụng **MMA301 E-Commerce** được thiết kế tinh gọn, hiện đại và thân thiện cho người mới học với 8 luồng nghiệp vụ khép kín:

1. **Khởi động (Startup):** Khôi phục trạng thái giỏ hàng từ `AsyncStorage`, đồng bộ danh sách yêu thích và lịch sử đơn hàng từ `Firebase`, tải danh mục sản phẩm từ Remote API (`DummyJSON`).
2. **Duyệt & Tìm kiếm (Browse/Search):** `FlatList` phân trang vô tận (`limit=10`, `skip`), hỗ trợ kéo làm mới (`Pull-to-refresh`), tìm kiếm theo từ khóa tức thì và lọc theo danh mục (beauty, fragrances, furniture, groceries,...).
3. **Chi tiết & Giỏ hàng (Detail & Cart):** Xem hình ảnh, mô tả, đánh giá sao, tồn kho, điều chỉnh số lượng đặt mua, thêm vào giỏ hàng.
4. **Tính toán dẫn xuất (Derived Totals):** Tự động tính tổng số lượng món, tạm tính, phí vận chuyển (miễn phí cho đơn $\ge$ $50$) và tổng tiền thanh toán thông qua `useMemo` (Single Source of Truth).
5. **Đám mây Firebase:** Lưu trữ và đồng bộ hóa Danh sách Yêu thích (Wishlist) và Lịch sử Đơn hàng (Order History) qua Firebase Cloud Database.
6. **Trợ lý Google Gemini AI:** Tiếp nhận nhu cầu mua sắm và ngân sách của người dùng, đưa ngữ cảnh kho hàng (Context) vào Prompt, tạo gợi ý và **xác thực nghiêm ngặt mã sản phẩm (ID Validation)** để chống ảo giác (AI Hallucination).
7. **Thông báo hệ thống (Notification Flow):** Quản lý trạng thái cấp quyền (Granted/Denied); tự động kích hoạt thông báo đẩy cục bộ khi đặt hàng thành công (`Order Placed`) hoặc khuyến mãi (`Flash Sale`).
8. **Khả năng phục hồi (Resilience):** Khi mất mạng hoặc Firebase/Gemini bị lỗi, ứng dụng hiển thị thông báo phản hồi thân thiện, kích hoạt bộ nhớ đệm hoặc thuật toán Fallback cục bộ, tuyệt đối **không làm sập ứng dụng (No Crash)**.

---

## 2. CẤU TRÚC THƯ MỤC ỨNG DỤNG

```
MMA301_Assignment2/
├── docs/                      # Các tài liệu chuyên biệt phục vụ đánh giá rubric
│   ├── RTM_DDR.md             # RTM, Sơ đồ tích hợp & Quyết định thiết kế
│   ├── TEST_MATRIX.md         # Bảng 15 trường hợp kiểm thử chi tiết
│   ├── DEBUG_LOGS.md          # 2 bài toán sửa lỗi thực tế theo 5 bước
│   ├── AI_USAGE_LOG.md        # Nhật ký sử dụng AI có kiểm chứng
│   ├── INTERVIEW_GUIDE.md     # Hướng dẫn trả lời phỏng vấn & diễn tập 30s
│   └── RELEASE_GUIDE.md       # Hướng dẫn build APK & bằng chứng xuất bundle
├── MMA301_Assignment2/
│   ├── App.js                 # Entry point bọc Context Providers & Navigation
│   ├── app.json               # Cấu hình Expo, plugin fonts & notifications
│   ├── package.json           # Dependencies chuẩn hóa Expo SDK 57
│   └── src/
│       ├── config/
│       │   └── config.js      # Cấu hình API URL, Gemini Key, Firebase URL (không lộ secret)
│       ├── api/
│       │   ├── productService.js     # Gọi REST API DummyJSON (phân trang, tìm kiếm, lọc)
│       │   ├── firebaseService.js    # Tương tác Firebase REST (Wishlist, Order, Error Simulator)
│       │   ├── geminiService.js      # Gửi context kho hàng tới Gemini, validate ID chống hallucination
│       │   └── notificationService.js# Quản lý quyền và lên lịch local push notification
│       ├── context/
│       │   ├── CartContext.js        # State giỏ hàng, Derived Totals, AsyncStorage persistence
│       │   └── WishlistContext.js    # State Yêu thích, Đơn hàng, đồng bộ Cloud + Cache
│       ├── components/
│       │   ├── ProductCard.js        # Thẻ sản phẩm chuẩn, giá, rating, nút Thêm & Yêu thích
│       │   ├── CartItem.js           # Dòng món hàng trong giỏ kèm bộ tăng giảm số lượng (+/-)
│       │   ├── LoadingView.js        # Trạng thái đang tải dữ liệu
│       │   ├── EmptyState.js         # Giao diện khi danh sách rỗng kèm nút điều hướng
│       │   └── ErrorRetry.js         # Hộp thông báo lỗi kèm nút "Thử lại"
│       ├── screens/
│       │   ├── ProductListScreen.js  # Danh mục sản phẩm, tìm kiếm, lọc chip, FlatList pagination
│       │   ├── ProductDetailScreen.js# Chi tiết sản phẩm, số lượng, thêm giỏ, kết nối AI
│       │   ├── CartScreen.js         # Quản lý giỏ hàng, bảng tổng tiền dẫn xuất, đặt hàng
│       │   ├── WishlistScreen.js     # Danh sách Yêu thích & Lịch sử Đơn hàng (Firebase)
│       │   ├── GeminiAIScreen.js     # Trợ lý AI tư vấn mua sắm dựa trên kho hàng thực
│       │   └── SettingsScreen.js     # Kiểm tra quyền thông báo, mô phỏng lỗi Firebase, xóa cache
│       └── navigation/
│           └── AppNavigator.js       # Bottom Tabs (5 tab) kết hợp Stack Navigation
```

---

## 3. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Di chuyển vào thư mục Expo
```bash
cd "MMA301_Assignment2"
```

### Bước 2: Cài đặt các gói phụ thuộc đã chuẩn hóa
```bash
npm install
```

### Bước 3: Khởi động ứng dụng
```bash
npm start
```
- Mở ứng dụng **Expo Go** trên điện thoại Android/iOS và quét mã QR trên màn hình terminal để bắt đầu trải nghiệm.

### Bước 4: Cấu hình Secret (Tùy chọn)
Mở tệp `src/config/config.js` để điền API key cá nhân nếu muốn kiểm thử với AI hoặc Cloud thật:
```javascript
export const CONFIG = {
  PRODUCT_API_BASE_URL: 'https://dummyjson.com/products',
  GEMINI_API_KEY: '', // Điền Gemini API Key nếu có (để trống app dùng chế độ Demo an toàn)
  GEMINI_MODEL: 'gemini-1.5-flash',
  FIREBASE_DB_URL: '', // Điền URL Firebase DB nếu có (để trống app dùng Cloud Simulation)
};
```

---

## 4. GỢI Ý LỆNH GIT COMMIT THEO TỪNG MILESTONE

Theo quy chuẩn của đồ án, sinh viên nên commit theo từng chức năng nhỏ (Milestone):

### 🔹 Milestone 1: Điều hướng & Khung sườn giao diện (M1)
```bash
git add MMA301_Assignment2/src/navigation/ MMA301_Assignment2/App.js
git commit -m "feat(M1): setup navigation container, bottom tabs and stack structure"
```

### 🔹 Milestone 2: Dữ liệu Remote API & Danh mục sản phẩm (M2)
```bash
git add MMA301_Assignment2/src/config/ MMA301_Assignment2/src/api/productService.js MMA301_Assignment2/src/components/ProductCard.js MMA301_Assignment2/src/screens/ProductListScreen.js
git commit -m "feat(M2): implement remote product catalog with pagination, search and categories"
```

### 🔹 Milestone 3: Chi tiết sản phẩm & Quản lý giỏ hàng (M3)
```bash
git add MMA301_Assignment2/src/screens/ProductDetailScreen.js MMA301_Assignment2/src/context/CartContext.js MMA301_Assignment2/src/components/CartItem.js MMA301_Assignment2/src/screens/CartScreen.js
git commit -m "feat(M3): add product detail view and cart state management with derived totals"
```

### 🔹 Milestone 4: Lưu trữ bền vững AsyncStorage & Trạng thái UI (M4)
```bash
git add MMA301_Assignment2/src/components/LoadingView.js MMA301_Assignment2/src/components/EmptyState.js MMA301_Assignment2/src/components/ErrorRetry.js
git commit -m "feat(M4): integrate AsyncStorage persistence and state handling (loading/empty/error)"
```

### 🔹 Milestone 5: Nghiệp vụ Đám mây Firebase (M5)
```bash
git add MMA301_Assignment2/src/api/firebaseService.js MMA301_Assignment2/src/context/WishlistContext.js MMA301_Assignment2/src/screens/WishlistScreen.js
git commit -m "feat(M5): integrate Firebase cloud sync for wishlist and order history records"
```

### 🔹 Milestone 6: Quy trình Thông báo hệ thống (M6)
```bash
git add MMA301_Assignment2/src/api/notificationService.js MMA301_Assignment2/src/screens/SettingsScreen.js MMA301_Assignment2/app.json
git commit -m "feat(M6): implement notification permissions and order business event flow"
```

### 🔹 Milestone 7: Trợ lý Mua sắm Gemini AI (M7)
```bash
git add MMA301_Assignment2/src/api/geminiService.js MMA301_Assignment2/src/screens/GeminiAIScreen.js
git commit -m "feat(M7): integrate Gemini AI assistant with catalog context and hallucination validation"
```

### 🔹 Milestone 8 & 9: Kiểm thử, Debug Hardening & Tài liệu hoàn thiện (M8-M9)
```bash
git add .gitignore README.md docs/ MMA301_Assignment2/package.json MMA301_Assignment2/package-lock.json
git commit -m "docs(M8-M9): separate documentation, complete test matrix, debug logs and release verification"
```