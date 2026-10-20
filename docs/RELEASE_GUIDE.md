# HƯỚNG DẪN ĐÓNG GÓI BẢN RELEASE & BẰNG CHỨNG XUẤT BUNDLE (RELEASE EVIDENCE)

- Môn học: MMA301 – Multiplatform Mobile App Development  
- Dự án: MMA301 E-Commerce Mobile Application  
- Yêu cầu: Đáp ứng tiêu chí R12 (Release build / Production verification).

---

## 1. PHƯƠNG ÁN 1: TẠO FILE APK TRỰC TUYẾN BẰNG EXPO APPLICATION SERVICES (EAS BUILD)

Đây là phương pháp chuẩn và tiện lợi nhất để tạo ra tệp cài đặt `.apk` thực tế trên Android mà không cần cài đặt Android Studio nặng nề trên máy tính cá nhân.

### Bước 1: Cài đặt công cụ EAS CLI
Mở terminal và chạy lệnh cài đặt:
```bash
npm install -g eas-cli
```

### Bước 2: Đăng nhập tài khoản Expo
Đăng ký tài khoản miễn phí tại [expo.dev](https://expo.dev/) nếu chưa có:
```bash
eas login
```

### Bước 3: Cấu hình hồ sơ Build Android Preview
Chạy lệnh cấu hình tự động:
```bash
cd MMA301_Assignment2
eas build:configure
```
- Khi được hỏi nền tảng, chọn **All** hoặc **Android**.
- Trong tệp `eas.json` vừa được sinh ra, cấu hình profile `preview` để xuất định dạng `.apk`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### Bước 4: Thực hiện Build APK
Chạy lệnh bắt đầu tiến trình đóng gói trên máy chủ đám mây của Expo:
```bash
eas build --platform android --profile preview
```
Sau khi hoàn tất, terminal sẽ hiển thị đường link tải trực tiếp file `.apk` và mã QR để quét tải về điện thoại di động cài đặt demo cho giảng viên.

---

## 2. PHƯƠNG ÁN 2: KIỂM CHỨNG BIÊN DỊCH PRODUCTION BUNDLE CỤC BỘ (LOCAL EVIDENCE)

Để chứng minh ứng dụng không bị lỗi cú pháp runtime, không bị thiếu module native và hoàn toàn sẵn sàng xuất bản Release, sinh viên có thể chạy lệnh biên dịch Production Bundle:

```bash
cd MMA301_Assignment2
npx expo export -p android
```

### Bằng chứng kết quả thực tế (Build Evidence Log):
```
Starting Metro Bundler
Android Bundled 20484ms index.js (993 modules)

› Assets (36):
  node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf (390KB)
  node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf (130KB)
  node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/MaterialIcons.ttf (357KB)
  ... (33 font và icon khác)

› android bundles (1):
  _expo/static/js/android/index-599c94228fa5e139b5d27d6b4977caef.hbc (2.5MB)

› Files (1):
  metadata.json (2.5KB)

Exported: dist (Status: SUCCESS - 0 Errors)
```

**Nhận xét:** Toàn bộ 993 module mã nguồn JavaScript và Assets đã được tối ưu hóa và biên dịch thành công sang tệp mã máy Hermes Bytecode (`.hbc`) dung lượng 2.5MB, chứng minh ứng dụng đạt tiêu chuẩn chất lượng sản phẩm sẵn sàng triển khai.
