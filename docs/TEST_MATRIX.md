# BẢNG MA TRẬN KIỂM THỬ (TEST MATRIX – 15 TEST CASES)

> **Môn học:** MMA301 – Multiplatform Mobile App Development  
> **Dự án:** MMA301 E-Commerce Mobile Application  
> **Quy chuẩn:** Phủ đầy đủ 15 trường hợp kiểm thử (Normal, Negative, Edge cases) theo yêu cầu Section 5 trong Student Guide.

---

## BẢNG TỔNG HỢP KIỂM THỬ

| # | Nhóm chức năng | Kịch bản kiểm thử (Case) | Thao tác thực hiện | Kết quả mong đợi | Kết quả thực tế & Bằng chứng | Trạng thái |
|---|---|---|---|---|---|---|
| **1** | **API** | Load catalog thành công | Mở ứng dụng lần đầu | Tải 10 sản phẩm đầu tiên từ DummyJSON, hiển thị trên FlatList | Danh sách 10 sản phẩm hiển thị đầy đủ hình ảnh, giá, rating | ✅ ĐẠT |
| **2** | **API** | Network error (Mất mạng) | Bật chế độ máy bay hoặc ngắt kết nối Wi-Fi/4G | Hiển thị thông báo lỗi thân thiện, kèm nút "Thử lại", app không bị crash | Hiển thị component `ErrorRetry` màu đỏ với nút reload | ✅ ĐẠT |
| **3** | **List** | Empty state (Danh sách trống) | Tìm kiếm từ khóa không tồn tại (vd: "spkhongco999") | Hiển thị màn hình rỗng thông báo không tìm thấy kết quả | Hiển thị component `EmptyState` kèm nút "Xóa tìm kiếm" | ✅ ĐẠT |
| **4** | **Pagination** | End of list (Cuộn đến đáy) | Cuộn FlatList liên tục qua nhiều trang | Nạp dần các trang kế tiếp; khi tới sản phẩm cuối (194), hiện thông báo hoàn tất | Footer hiển thị: "✓ Đã hiển thị tất cả sản phẩm" | ✅ ĐẠT |
| **5** | **Search** | Hit / Miss (Tìm đúng & Sai) | Gõ từ khóa "phone" $\rightarrow$ sau đó gõ "xyz123" | "phone" trả về các dòng điện thoại; "xyz123" trả về trạng thái rỗng | Kết quả lọc chính xác theo từ khóa | ✅ ĐẠT |
| **6** | **Cart** | Add same item (Thêm trùng) | Bấm nút "Thêm vào giỏ" cùng một sản phẩm 2 lần | Không tạo dòng mới; số lượng sản phẩm tăng lên 2; tổng tiền nhân đôi | Món hàng có `quantity: 2`, tổng tiền cập nhật chuẩn xác | ✅ ĐẠT |
| **7** | **Cart** | Quantity 0 / Remove | Bấm nút "-" khi số lượng đang là 1 hoặc bấm biểu tượng thùng rác | Món hàng tự động bị xóa khỏi giỏ; tổng tiền trừ đi tương ứng | Món hàng biến mất khỏi danh sách giỏ hàng | ✅ ĐẠT |
| **8** | **Persistence**| Restart app (Khôi phục) | Thêm 2 món vào giỏ $\rightarrow$ Tắt hẳn ứng dụng $\rightarrow$ Mở lại | Giỏ hàng tự động khôi phục đúng 2 sản phẩm và số lượng từ `AsyncStorage` | Dữ liệu được restore nguyên vẹn từ key `@mma301_ecommerce_cart` | ✅ ĐẠT |
| **9** | **Firebase** | Write / Read (Lưu & Đọc) | Bấm "Yêu thích" một món $\rightarrow$ Chuyển sang Tab Yêu thích | Dữ liệu được ghi nhận và hiển thị ngay trên Tab Yêu thích | Món hàng hiển thị trong Wishlist, đồng bộ Firebase REST | ✅ ĐẠT |
| **10**| **Firebase** | Error Handling (Lỗi mạng/quyền) | Bật Switch "Mô phỏng lỗi Firebase" trong màn hình Cài đặt | App không bị văng; hiển thị Banner cảnh báo lỗi và giữ dữ liệu cache | Hiển thị banner cảnh báo: "Lỗi đồng bộ Firebase", có nút Thử lại | ✅ ĐẠT |
| **11**| **Notification**| Permission Denied (Từ chối) | Chọn "Don't allow" khi popup hệ thống hỏi cấp quyền | App không crash; màn hình Cài đặt hiển thị trạng thái "Denied" | Trạng thái hiển thị rõ ràng, có hướng dẫn mở Settings thiết bị | ✅ ĐẠT |
| **12**| **Notification**| Allowed / Event (Bắn thông báo)| Nhấn "Đặt hàng ngay" trong giỏ hàng | Điện thoại nhận được Local Push Notification xác nhận mã đơn hàng | Pop-up thông báo hiển thị: "🎉 Đặt hàng thành công! Đơn hàng #..." | ✅ ĐẠT |
| **13**| **Gemini** | Valid prompt (Tư vấn chuẩn) | Nhập: "Gợi ý mỹ phẩm dưỡng da dưới 30$" | AI phản hồi lời khuyên hữu ích kèm các thẻ sản phẩm thật trong kho | Hiển thị thẻ sản phẩm có hình ảnh, giá và nút "Xem chi tiết" | ✅ ĐẠT |
| **14**| **Gemini** | Invalid / Hallucination | Trả về ID 99999 không tồn tại trong kho | Lớp Validation phát hiện và loại bỏ ID ảo, chỉ hiển thị sản phẩm thật | Banner xác nhận: "Đã xác thực sản phẩm thực tế (Đã loại bỏ ID ảo)" | ✅ ĐẠT |
| **15**| **Release** | Production Build | Chạy lệnh `npx expo export -p android` | Toàn bộ 993 modules JavaScript và assets biên dịch thành công sang `.hbc` | Bundle xuất ra thư mục dist với dung lượng 2.5MB, 0 lỗi | ✅ ĐẠT |

---

## HƯỚNG DẪN THỰC HIỆN KIỂM THỬ TRỰC TIẾP TRÊN MÁY CHẤM

1. **Kiểm thử Offline & Bắt lỗi mạng (Test 2 & 10):**
   - Vào Tab **Cài đặt** $\rightarrow$ Bật công tắc **"Mô phỏng lỗi Firebase (Test #10)"**.
   - Chuyển sang Tab **Yêu thích** $\rightarrow$ Kéo làm mới $\rightarrow$ Quan sát Banner thông báo lỗi màu đỏ xuất hiện, ứng dụng vẫn hoạt động bình thường mà không bị crash.
2. **Kiểm thử Thông báo đơn hàng (Test 12):**
   - Thêm bất kỳ sản phẩm nào vào giỏ hàng $\rightarrow$ Vào Tab **Giỏ hàng** $\rightarrow$ Bấm **"Tiến hành Đặt hàng"** $\rightarrow$ Xác nhận.
   - Quan sát thanh thông báo trên đỉnh màn hình điện thoại nhận được alert tức thì.
3. **Kiểm thử Chống ảo giác AI (Test 14):**
   - Vào Tab **Trợ lý AI** $\rightarrow$ Bấm câu hỏi mẫu: *"Gợi ý mỹ phẩm dưỡng da giá tốt dưới 30$"*.
   - Đọc kết quả phân tích: Dòng thông báo màu xanh chứng minh hệ thống đã đối chiếu và xác thực ID sản phẩm với kho hàng thực tế trước khi hiển thị thẻ sản phẩm.
