# REQUIREMENT TRACEABILITY MATRIX (RTM) & DESIGN DECISION RECORD (DDR)

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Dự án:** MMA301 E-Commerce Mobile Application  

---

## 1. REQUIREMENT TRACEABILITY MATRIX (RTM)

Bảng đối chiếu yêu cầu tối thiểu giữa mã nguồn triển khai và kịch bản kiểm thử:

| ID | Yêu cầu nghiệp vụ | Bằng chứng UI / Code | Kịch bản kiểm thử tối thiểu | Trạng thái |
|---|---|---|---|---|
| **R01** | Remote product data | `src/api/productService.js` | Gọi API DummyJSON lấy danh mục sản phẩm / Bắt lỗi mạng khi offline | ✅ Đạt (HTTP 200 / Error catch) |
| **R02** | FlatList + pagination / infinite | `src/screens/ProductListScreen.js` | Cuộn đến cuối tải thêm 10 sp, có guard chặn duplicate request | ✅ Đạt (`onEndReached` + `loadingMore` guard) |
| **R03** | Search/filter + refresh | `src/screens/ProductListScreen.js` | Tìm kiếm theo từ khóa, lọc theo Category chips, kéo làm mới `RefreshControl` | ✅ Đạt (Hit/Miss/Refresh hoạt động chuẩn) |
| **R04** | Product detail | `src/screens/ProductDetailScreen.js` | Mở chi tiết sản phẩm theo ID hợp lệ; xử lý lỗi ID không tồn tại | ✅ Đạt (Hiển thị đầy đủ / Báo lỗi 404) |
| **R05** | Cart state | `src/context/CartContext.js`<br>`src/screens/CartScreen.js` | Thêm vào giỏ, tăng/giảm số lượng (+/-), xóa món, làm rỗng giỏ | ✅ Đạt (Context State đồng bộ toàn app) |
| **R06** | Derived totals | `src/context/CartContext.js` (`useMemo`) | Tính tổng số lượng, tạm tính, phí ship, tổng tiền cho 0/1/nhiều sản phẩm | ✅ Đạt (Single Source of Truth) |
| **R07** | Persistence | `src/context/CartContext.js` (`AsyncStorage`) | Tắt ứng dụng, mở lại kiểm tra giỏ hàng được khôi phục nguyên vẹn | ✅ Đạt (`@mma301_ecommerce_cart`) |
| **R08** | Firebase use case | `src/api/firebaseService.js`<br>`src/context/WishlistContext.js`<br>`src/screens/WishlistScreen.js` | Ghi/đọc Danh sách Yêu thích & Đơn hàng lên Firebase; bộ đệm khi offline | ✅ Đạt (REST API + Local Backup Sync) |
| **R09** | Notification flow | `src/api/notificationService.js`<br>`src/screens/SettingsScreen.js` | Xin quyền (Allow/Deny); kích hoạt thông báo Đặt hàng & Flash Sale | ✅ Đạt (`expo-notifications` default channel) |
| **R10** | Gemini AI integration | `src/api/geminiService.js`<br>`src/screens/GeminiAIScreen.js` | Đưa context kho hàng vào Prompt; **Validate loại bỏ ID ảo (Hallucination)** | ✅ Đạt (Valid/Error/Fallback hoạt động tốt) |
| **R11** | Debug evidence | `docs/DEBUG_LOGS.md` | Ghi nhận và khắc phục 2 lỗi thực tế: Metro module mismatch & Hermes-parser | ✅ Đạt (Có đủ 5 bước chuẩn đoán) |
| **R12** | Release build | `docs/RELEASE_GUIDE.md` | Biên dịch thành công 993 modules sang mã máy Hermes (`.hbc`) | ✅ Đạt (0 error, sẵn sàng release) |

---

## 2. SƠ ĐỒ TÍCH HỢP HỆ THỐNG (INTEGRATION MAP)

```
[ User Interaction ]
        │
        ▼
[ Screens / UI Layer ]
(ProductList, ProductDetail, Cart, Wishlist/Orders, GeminiAI, Settings)
        │
        ▼
[ State / Hook Layer ]
(CartContext, WishlistContext, useState, useMemo)
   │                       │
   ▼                       ▼
[ Persistence ]     [ Service Layer ]
(AsyncStorage)      ├── productService  ──► [ Remote API (DummyJSON) ]
                    ├── firebaseService ──► [ Firebase Cloud (Wishlist/Orders) ]
                    ├── geminiService   ──► [ Google Gemini 1.5 Flash ]
                    └── notificationService ──► [ Local Push Notification ]
```

---

## 3. DESIGN DECISION RECORD (DDR) – 7 QUYẾT ĐỊNH CỐT LÕI

### Quyết định 1: Lựa chọn State Management
- **Lựa chọn:** React Context API (`CartContext`, `WishlistContext`).
- **Lý do:** Ứng dụng E-Commerce cỡ vừa với các luồng trạng thái tập trung (Giỏ hàng, Yêu thích, Đơn hàng). Context API là giải pháp native nhẹ, dễ đọc, không phát sinh boilerplate phức tạp như Redux Toolkit, rất phù hợp cho sinh viên mới học và dễ bảo vệ trước giảng viên.
- **Impact nếu đổi requirement:** Nếu mở rộng ứng dụng lên quy mô doanh nghiệp với hàng trăm action phức tạp, có thể thay tầng Provider bằng Redux Toolkit/Zustand mà không cần viết lại giao diện Component.

### Quyết định 2: Cấu trúc Service & Tách biệt trách nhiệm (Separation of Concerns)
- **Lựa chọn:** Tách riêng các file Service độc lập trong `src/api/` (`productService.js`, `firebaseService.js`, `geminiService.js`, `notificationService.js`).
- **Lý do:** Không viết trực tiếp logic `fetch()` hay gọi API bên trong Component UI. Giúp mã nguồn dễ bảo trì, dễ viết test và tái sử dụng ở nhiều màn hình khác nhau.
- **Impact nếu đổi requirement:** Nếu đổi nhà cung cấp API (ví dụ từ DummyJSON sang backend tự viết), chỉ cần sửa đổi logic bên trong `productService.js`.

### Quyết định 3: Chiến lược phân trang (Pagination Strategy)
- **Lựa chọn:** Remote Pagination dựa trên `limit` và `skip` từ DummyJSON.
- **Lý do:** Tối ưu băng thông mạng và RAM của thiết bị di động. Chỉ nạp 10 sản phẩm mỗi lần, sử dụng `FlatList onEndReached` kết hợp cờ chặn `onMomentumScrollBegin` để triệt tiêu hiện tượng duplicate request.
- **Impact nếu đổi requirement:** Dễ dàng chuyển đổi sang cursor-based pagination bằng cách thay thế tham số `skip` bằng con trỏ ID.

### Quyết định 4: Lưu trữ dữ liệu bền vững (Persistence)
- **Lựa chọn:** `@react-native-async-storage/async-storage`.
- **Lý do:** Thư viện chuẩn được Expo bảo trợ, lưu trữ bất đồng bộ dưới dạng Key-Value không gây nghẽn UI Thread.
- **Impact nếu đổi requirement:** Nếu cần truy vấn quan hệ phức tạp, có thể nâng cấp lên SQLite mà vẫn giữ nguyên interface của Context.

### Quyết định 5: Nghiệp vụ lưu trữ Đám mây (Firebase Use Case)
- **Lựa chọn:** Lưu **Wishlist** (Sản phẩm yêu thích) và **Order History** (Lịch sử đơn hàng) qua Firebase REST API.
- **Lý do:** REST API không đòi hỏi cấu hình `google-services.json` phức tạp, tránh hoàn toàn lỗi build trên môi trường native, đồng thời hỗ trợ cơ chế Local Backup Sync khi mất kết nối mạng.
- **Impact nếu đổi requirement:** Có thể chuyển đổi sang Firestore SDK hoặc Realtime DB SDK bất kỳ lúc nào.

### Quyết định 6: Ngữ cảnh & Kiểm duyệt AI (Gemini Context & Validation)
- **Lựa chọn:** Gửi danh mục 15 sản phẩm thực tế vào Prompt làm Context; xây dựng **lớp Validation kiểm duyệt `recommendedProductIds`** trước khi hiển thị.
- **Lý do:** Ngăn chặn triệt để hiện tượng AI Hallucination (tự bịa mã sản phẩm). Nếu Gemini trả về ID không tồn tại trong kho, ứng dụng sẽ lọc bỏ ngay lập tức. Nếu mất mạng hoặc không có API key, app tự động kích hoạt bộ gợi ý Fallback thông minh.
- **Impact nếu đổi requirement:** Có thể đổi prompt hoặc đổi sang model khác mà không ảnh hưởng đến tầng giao diện.

### Quyết định 7: Kiến trúc tính toán tiền giỏ hàng (Derived Totals)
- **Lựa chọn:** Tổng tiền giỏ hàng **không lưu vào state độc lập** mà được suy ra (derived) từ mảng `cartItems` thông qua `useMemo`.
- **Lý do:** Đảm bảo nguyên tắc **Single Source of Truth**. Tránh lỗi bất đồng bộ state khiến số lượng và tổng tiền bị lệch nhau khi người dùng thao tác nhanh.
