# HƯỚNG DẪN TRẢ LỜI PHỎNG VẤN & BẢO VỆ MÃ NGUỒN (INTERVIEW GUIDE)

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Dự án:** MMA301 E-Commerce Mobile Application  
> **Mục tiêu:** Giúp sinh viên nắm chắc luồng dữ liệu, tự tin "mở file và chỉ code" trong vòng $\le$ 30 giây, trả lời trôi chảy các câu hỏi tình huống của Giảng viên.

---

## 1. MÔ HÌNH 5 BƯỚC GIẢI THÍCH MÃ NGUỒN (5-STEP CODE EXPLANATION)

Khi giảng viên chỉ định mở bất kỳ file nào, hãy trình bày ngắn gọn theo 5 ý sau:
1. **Purpose (Mục đích):** File/Component/Hook này giải quyết trách nhiệm gì trong kiến trúc?
2. **Input (Đầu vào):** Props, state, parameter hay URL nào được truyền vào?
3. **Trigger (Kích hoạt):** Hành động nào (sự kiện người dùng bấm, `useEffect` khởi động, cuộn `onEndReached`) kích hoạt đoạn mã này?
4. **Transform (Biến đổi):** Dữ liệu được tính toán, validate, lọc hoặc gọi API xử lý ra sao?
5. **Output / Failure (Đầu ra & Xử lý lỗi):** State/Giao diện nào thay đổi? Khi có lỗi mạng/Firebase/AI thì ứng dụng phản hồi thế nào để không bị crash?

---

## 2. BẢNG TỔNG HỢP "MỞ FILE VÀ CHỈ CODE" (REHEARSAL CHECKLIST TRONG 30 GIÂY)

| Yêu cầu của Giảng viên | Tệp cần mở ngay | Đoạn mã / Vị trí cần chỉ vào |
|---|---|---|
| **Chỉ luồng tải sản phẩm từ API** | `src/api/productService.js` | Hàm `getProducts(skip, limit)` dòng gọi `fetch(url)` và trả về `{ products, total, hasMore }`. |
| **Chỉ cờ chặn FlatList gọi lặp (Guard)** | `src/screens/ProductListScreen.js` | Hàm `handleLoadMore()` kiểm tra điều kiện `if (!loadingMore && hasMore && ...)` và cờ `onMomentumScrollBegin`. |
| **Chỉ cách tính tổng tiền giỏ hàng** | `src/context/CartContext.js` | Khối `useMemo` tính toán `totalCount, subtotal, shippingFee, totalAmount` từ mảng `cartItems`. |
| **Chỉ cách lưu trữ bền vững giỏ hàng** | `src/context/CartContext.js` | Khối `useEffect` đọc `AsyncStorage.getItem` khi mở app và `AsyncStorage.setItem` khi `cartItems` đổi. |
| **Chỉ nơi lưu đơn hàng lên Cloud** | `src/api/firebaseService.js` | Hàm `createOrder()` gửi HTTP POST đến `${FIREBASE_DB_URL}/orders.json` và lưu cache vào `AsyncStorage`. |
| **Chỉ nơi xin quyền & gửi thông báo** | `src/api/notificationService.js` | Hàm `requestPermission()` và `notifyOrderSuccess()`. |
| **Chỉ lớp Validation chống AI Hallucination** | `src/api/geminiService.js` | Vòng lặp `rawIds.forEach()` đối chiếu ID trả về từ AI với danh sách sản phẩm thật trong `currentCatalog`. |
| **Chỉ nơi cấu hình Secrets** | `src/config/config.js` | Nơi khai báo `GEMINI_API_KEY` và `FIREBASE_DB_URL` dưới dạng placeholder an toàn không chứa secret thật. |

---

## 3. CÁC CÂU HỎI VẤN ĐÁP TRỌNG TÂM & CÁCH TRẢ LỜI

### Câu 1: Vì sao tổng tiền giỏ hàng (Cart total) nên dùng Derived State thay vì lưu vào State riêng?
- **Trả lời:** Em áp dụng nguyên tắc **Single Source of Truth** (Nguồn chân lý duy nhất). Dữ liệu gốc duy nhất là mảng `cartItems`. Nếu ta lưu `totalAmount` thành một `useState` riêng biệt, mỗi lần người dùng thêm, xóa hoặc đổi số lượng, ta phải gọi 2 lần `setState`. Điều này rất dễ dẫn đến lỗi bất đồng bộ (Race condition) khiến tổng tiền hiển thị bị lệch so với các mặt hàng thực tế. Dùng `useMemo` giúp tổng tiền luôn luôn tính toán lại chính xác 100% dựa trên danh sách món hàng.

### Câu 2: Sự kiện `onEndReached` của FlatList có thể bị gọi lặp liên tục khi nào? Bạn đã xử lý thế nào?
- **Trả lời:** `onEndReached` có thể bị gọi lặp nhiều lần nếu người dùng cuộn nhanh đến đáy màn hình trong khi request trước đó chưa kịp hoàn tất, hoặc khi màn hình khởi tạo mà danh sách quá ngắn so với chiều cao thiết bị. Em đã giải quyết triệt để bằng 2 kỹ thuật:
  1. Đặt điều kiện kiểm tra (Guard): `if (!loadingMore && hasMore && !initialLoading)`.
  2. Sử dụng `onMomentumScrollBegin`: Chỉ cho phép tải thêm khi người dùng thực sự có thao tác vuốt cuộn màn hình.

### Câu 3: Làm thế nào để phát hiện nếu Gemini AI bịa ra một sản phẩm không tồn tại (AI Hallucination)?
- **Trả lời:** Em không tin tưởng trực tiếp output của AI. Trong tệp `geminiService.js`, em truyền danh sách sản phẩm thật của kho vào Prompt làm Context. Khi AI trả về mảng `recommendedProductIds`, ứng dụng chạy qua một **Lớp Validation**:
  ```javascript
  const matched = currentCatalog.find(item => Number(item.id) === Number(id));
  if (matched) validProducts.push(matched);
  else rejectedIds.push(id); // Phát hiện và loại bỏ ID ảo
  ```
  Nếu ID không có trong kho hàng, hệ thống loại bỏ ngay lập tức và chỉ hiển thị các sản phẩm có thật cho người dùng tương tác.

### Câu 4: Nếu mất kết nối mạng hoặc Firebase/Gemini bị lỗi, ứng dụng có bị crash không?
- **Trả lời:** Dạ hoàn toàn không. Tất cả các hàm gọi API đều được bọc trong khối `try/catch`. 
  - Khi Firebase lỗi, ứng dụng tự động chuyển sang đọc/ghi vào bộ nhớ đệm cục bộ (`AsyncStorage`) và hiển thị Banner màu đỏ thông báo lỗi kèm nút "Thử lại".
  - Khi Gemini lỗi hoặc chưa nhập API Key, ứng dụng kích hoạt thuật toán **Fallback Matcher** cục bộ để lọc sản phẩm theo từ khóa mà không làm gián đoạn trải nghiệm của người dùng.

---

## 4. BÀI TẬP THỰC HÀNH YÊU CẦU THAY ĐỔI NHANH (TRANSFER TASKS)

Nếu trong buổi chấm giảng viên yêu cầu thực hiện một chỉnh sửa nhỏ trực tiếp:

1. **Thêm tính năng sắp xếp sản phẩm theo Giá (Sort by Price):**
   - *Cách làm:* Trong `ProductListScreen.js`, thêm nút Sort và dùng hàm JavaScript:
     ```javascript
     const sorted = [...products].sort((a, b) => a.price - b.price);
     ```
2. **Thêm ô ghi chú (Note) cho món hàng trong giỏ:**
   - *Cách làm:* Trong `CartItem.js`, thêm một ô `TextInput` cập nhật trường `note` của object item trong `CartContext.js`.
3. **Đổi điều kiện Miễn phí vận chuyển từ $50 sang $100:**
   - *Cách làm:* Trong `CartContext.js`, tìm dòng tính `shipping`:
     ```javascript
     const shipping = count === 0 ? 0 : sum >= 100 ? 0 : 5;
     ```
