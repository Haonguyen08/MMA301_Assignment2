# NHẬT KÝ SỬA LỖI (DEBUG LOGS – 2 BÀI TOÁN THỰC TẾ)

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Dự án:** MMA301 E-Commerce Mobile Application  
> **Quy trình chuẩn 5 bước:**  
> (1) Mô tả triệu chứng quan sát được $\rightarrow$ (2) Khoanh vùng vị trí $\rightarrow$ (3) Kiểm tra input/state $\rightarrow$ (4) Kiểm tra điểm biến đổi/async $\rightarrow$ (5) Sửa nhỏ nhất & Chạy lại retest.

---

## 🐛 DEBUG LOG 01: LỖI MISMATCH PHIÊN BẢN DEPENDENCY TRÊN EXPO SDK 57

### 1. Triệu chứng quan sát được (Symptom)
- Khi chạy công cụ kiểm định `npx expo-doctor`, hệ thống báo lỗi đỏ dừng kiểm tra:
  ```
  ✖ Check that packages match versions required by installed Expo SDK
  Major version mismatches:
    @react-native-async-storage/async-storage 3.1.1 (expected: 2.2.0)
    expo-device 58.0.5 (expected: ~57.0.2)
    expo-notifications 58.1.5 (expected: ~57.0.23)
  Missing peer dependency: expo-font (Required by @expo/vector-icons)
  4 checks failed.
  ```

### 2. Khoanh vùng (Localization)
- Tệp `package.json` và cấu hình hệ sinh thái Expo Native Modules tại thư mục gốc của ứng dụng.

### 3. Giả thuyết (Hypothesis)
- Lệnh `npm install` mặc định sẽ kéo các gói thư viện phiên bản mới nhất trên registry npm (`latest`), tuy nhiên phiên bản Expo SDK của dự án là 57 (đòi hỏi các module native tương thích cụ thể đã qua kiểm thử tương thích ngược).

### 4. Cách kiểm tra & Root Cause (Nguyên nhân gốc)
- **Kiểm tra:** So sánh các phiên bản trong `package.json` với danh mục khuyến nghị của Expo SDK 57 thông qua CLI.
- **Root Cause:** Xung đột phiên bản Major/Minor giữa thư viện npm tự do với các plugin native của Expo, có nguy cơ gây văng ứng dụng (crash) khi biên dịch sang Android/iOS nếu không được ghim phiên bản chính xác.

### 5. Cách sửa (Fix) & Kết quả Retest
- **Cách sửa:** Chạy lệnh sửa tự động của Expo để đưa tất cả các gói về đúng phiên bản của SDK 57, đồng thời cài đặt bổ sung `expo-font`:
  ```bash
  npx expo install --fix
  npx expo install expo-font
  ```
- **Retest:** Chạy lại `npx expo-doctor` để xác thực lại:
  ```
  Running 21 checks on your project...
  21/21 checks passed. No issues detected!
  ```
  $\rightarrow$ **Kết quả:** Đã giải quyết triệt để 100%, không còn bất kỳ cảnh báo xung đột nào.

---

## 🐛 DEBUG LOG 02: LỖI THIẾU THƯ MỤC CHUYỂN ĐỔI CÚ PHÁP CỦA HERMES-PARSER KHI EXPORT BUNDLE

### 1. Triệu chứng quan sát được (Symptom)
- Khi chạy lệnh đóng gói kiểm tra ứng dụng: `npx expo export -p android`, tiến trình Metro Bundler bị dừng đột ngột với lỗi SyntaxError:
  ```
  Android Bundling failed index.js
  SyntaxError: index.js: Cannot find module '../transform/SimpleTransform'
  Require stack:
  - .../node_modules/hermes-parser/dist/estree/TransformComponentSyntax.js
  - .../node_modules/babel-plugin-syntax-hermes-parser/dist/index.js
  - .../node_modules/expo/node_modules/babel-preset-expo/build/configs/syntax.js
  ```

### 2. Khoanh vùng (Localization)
- Chuỗi Babel Transform của Metro Bundler khi xử lý cú pháp Flow/ESTree của React 19 / React Native 0.86 thông qua `hermes-parser`.

### 3. Giả thuyết (Hypothesis)
- Trong bản phát hành `hermes-parser@0.36.0` do Meta đóng gói trên npm, thư mục `transform` hoặc `traverse` bị khuyết trong thư mục phân phối `dist/`.

### 4. Cách kiểm tra & Root Cause (Nguyên nhân gốc)
- **Kiểm tra:** Viết script kiểm tra sự tồn tại của tệp `SimpleTransform.js` trong tất cả các thư mục `node_modules`.
  Phát hiện: Tệp này có đầy đủ bên trong `@react-native/codegen/node_modules/hermes-parser/dist/transform/SimpleTransform.js`, nhưng lại bị thiếu ở các bản `hermes-parser` lồng trong `expo` và `babel-plugin-syntax-hermes-parser`.
- **Root Cause:** Quá trình tải gói npm giải nén thiếu 3 thư mục `transform`, `traverse`, `utils` trong thư mục `dist/` của các package con, khiến tệp `TransformComponentSyntax.js` không thể `require` được module tương ứng.

### 5. Cách sửa (Fix) & Kết quả Retest
- **Cách sửa:** Đồng bộ hóa tự động toàn bộ 3 thư mục `transform`, `traverse`, `utils` sang các thư mục `hermes-parser/dist` tương ứng trong `node_modules`:
  ```javascript
  ['transform', 'traverse', 'utils'].forEach(sub => {
    copyDir(sourceFromCodegen, targetInHermesParser);
  });
  ```
- **Retest:** Chạy lại lệnh biên dịch Android production bundle:
  ```bash
  npx expo export -p android --no-minify
  ```
  $\rightarrow$ **Kết quả:** Metro Bundler biên dịch thành công **993 modules (100%)**, xuất ra file bytecode `index.hbc` (2.5MB) hoàn chỉnh mà không gặp bất kỳ lỗi nào.
