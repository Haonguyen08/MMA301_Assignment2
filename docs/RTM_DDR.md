# REQUIREMENT TRACEABILITY MATRIX (RTM) & DESIGN DECISION RECORD (DDR)

- Mon hoc: MMA301 - Multiplatform Mobile App Development
- Du an: MMA301 E-Commerce Mobile Application

---

## 1. REQUIREMENT TRACEABILITY MATRIX (RTM)

| ID | Yeu cau nghiep vu | Bang chung UI / Code | Kich ban kiem thu toi thieu | Trang thai |
|---|---|---|---|---|
| R01 | Remote product data | src/api/productService.js | Goi API DummyJSON lay danh muc san pham; bat loi mang khi offline | Dat |
| R02 | FlatList + pagination / infinite | src/screens/ProductListScreen.js | Cuon den cuoi tai them 10 sp, co guard chan duplicate request | Dat |
| R03 | Search/filter + refresh | src/screens/ProductListScreen.js | Tim kiem theo tu khoa, loc category chips, keo lam moi RefreshControl | Dat |
| R04 | Product detail | src/screens/ProductDetailScreen.js | Mo chi tiet theo ID hop le; xu ly loi khi ID khong ton tai | Dat |
| R05 | Cart state | src/context/CartContext.js, src/screens/CartScreen.js | Them vao gio, tang/giam so luong (+/-), xoa mon, lam rong gio | Dat |
| R06 | Derived totals | src/context/CartContext.js (useMemo) | Tinh tong so luong, tam tinh, phi ship, tong tien tu danh sach cartItems | Dat |
| R07 | Persistence | src/context/CartContext.js (AsyncStorage) | Khoi phuc gio hang nguyen ven khi tat app va mo lai | Dat |
| R08 | Firebase use case | src/api/firebaseService.js, src/context/WishlistContext.js | Ghi va doc Wishlist, Order History qua Firebase REST API | Dat |
| R09 | Notification flow | src/api/notificationService.js, src/screens/SettingsScreen.js | Xin quyen thong bao; ban local push khi dat hang va flash sale | Dat |
| R10 | Gemini AI integration | src/api/geminiService.js, src/screens/GeminiAIScreen.js | Gui context kho hang vao prompt; validate loai bo ID ao | Dat |
| R11 | Debug evidence | docs/DEBUG_LOGS.md | 2 loi thuc te: Mismatch SDK 57 va Hermes-parser bundle export | Dat |
| R12 | Release build | docs/RELEASE_GUIDE.md | Bien dich thanh cong sang bytecode Hermes (.hbc), 0 error | Dat |

---

## 2. INTEGRATION MAP

```
[ User Interaction ]
        |
        v
[ Screens / UI Layer ]
(ProductList, ProductDetail, Cart, Wishlist/Orders, GeminiAI, Settings)
        |
        v
[ State / Hook Layer ]
(CartContext, WishlistContext, useState, useMemo)
   |                       |
   v                       v
[ Persistence ]     [ Service Layer ]
(AsyncStorage)      |-- productService  --> [ Remote API (DummyJSON) ]
                    |-- firebaseService --> [ Firebase Cloud (Wishlist/Orders) ]
                    |-- geminiService   --> [ Google Gemini 1.5 Flash ]
                    `-- notificationService --> [ Local Push Notification ]
```

---

## 3. DESIGN DECISION RECORD (DDR)

### Quyet dinh 1: State Management
- Lua chon: React Context API (CartContext, WishlistContext).
- Ly do: Phu hop voi ung dung e-commerce quy mo vua va nho, de doc, khong phat sinh boilerplate phuc tap nhu Redux, thich hop cho sinh vien hoc tap va bao ve code.
- Impact neu doi requirement: Neu mo rong he thong lon, co the thay the Provider bang Redux Toolkit hoac Zustand ma khong can sua lai giao dien Component.

### Quyet dinh 2: Cau truc Service (Separation of Concerns)
- Lua chon: Tach rieng cac file service trong src/api/ (productService, firebaseService, geminiService, notificationService).
- Ly do: Khong goi truc tiep fetch() trong Screen/Component. Giup code de bao tri, de kiem thu va tai su dung.
- Impact neu doi requirement: Neu doi backend API, chi can sua logic ben trong productService.

### Quyet dinh 3: Chien luoc phan trang (Pagination)
- Lua chon: Remote Pagination dua tren limit va skip cua DummyJSON.
- Ly do: Toi uu bang thong va bo nho thiet bi. FlatList su dung onEndReached ket hop co chan onMomentumScrollBegin de tranh duplicate request.
- Impact neu doi requirement: De dang chuyen sang cursor-based pagination bang cach truyen cursor id.

### Quyet dinh 4: Luu tru ben vung (Persistence)
- Lua chon: @react-native-async-storage/async-storage.
- Ly do: Thu vien tieu chuan duoc Expo ho tro, hoat dong bat dong bo dang Key-Value, khong block UI thread.
- Impact neu doi requirement: Neu can quan he phuc tap co the thay the bang SQLite ma van giu nguyen interface Context.

### Quyet dinh 5: Nghiep vu Firebase Cloud
- Lua chon: Luu Wishlist va Order History qua Firebase REST API.
- Ly do: REST API nhe, khong can file google-services.json phuc tap tren native, tranh loi build tren cac moi truong va ho tro che do local cache khi offline.
- Impact neu doi requirement: Co the chuyen sang Firebase SDK bat ky luc nao.

### Quyet dinh 6: Ngu canh va kiem duyet AI (Gemini Context & Validation)
- Lua chon: Gui toi da 15 san pham thuc te vao prompt lam context; xay dung lop validation kiem tra mang recommendedProductIds.
- Ly do: Ngan chan triet de AI Hallucination. Neu ID tra ve khong co trong kho se bi loai bo ngay. Neu offline hoac khong co API key thi tu dong chay thuat toan fallback cuc bo.
- Impact neu doi requirement: Co the doi prompt hoac doi sang model AI khac ma khong anh huong UI.

### Quyet dinh 7: Tinh toan tien gio hang (Derived Totals)
- Lua chon: Tong tien va so luong khong luu vao state rieng ma duoc tinh toan dan xuat (derived) tu mang cartItems qua useMemo.
- Ly do: Dam bao nguyen tac Single Source of Truth. Tranh loi lech tong tien khi so luong hoac gia san pham thay doi.
