# NHẬT KÝ SỬ DỤNG AI (AI USAGE & ENGINEERING PRACTICE LOG)

- Môn học: MMA301 – Multiplatform Mobile App Development  
- Dự án: MMA301 E-Commerce Mobile Application  
- Nguyên tắc: Sử dụng AI minh bạch, có kiểm soát; không dùng AI tạo trọn bộ mã nguồn mà không hiểu; mọi đoạn mã do AI hỗ trợ đều được phân tích, điều chỉnh và kiểm chứng bằng test case thực tế (Theo mục 9 trong Student Guide).

---

## 1. QUY TRÌNH ÁP DỤNG: ASK -> INSPECT -> ADAPT -> RUN -> EXPLAIN -> RECORD

1. **Ask:** Đặt câu hỏi hoặc yêu cầu cụ thể, nêu rõ giới hạn kỹ thuật (React Native, Expo, JavaScript thuần, giao diện cho người mới học).
2. **Inspect:** Đọc kỹ output do AI sinh ra, nhận diện các rủi ro (lệch thư viện, dùng package nặng, code phức tạp quá mức cần thiết).
3. **Adapt:** Điều chỉnh mã nguồn cho phù hợp với kiến trúc dự án, bổ sung xử lý lỗi và logic kiểm soát.
4. **Run:** Chạy các kịch bản kiểm thử (Test Matrix) đối chiếu kết quả.
5. **Explain:** Tự giải thích mục đích, input, trigger, transform, output của từng khối lệnh.
6. **Record:** Ghi chép chi tiết vào nhật ký bên dưới.

---

## 2. BẢNG NHẬT KÝ SỬ DỤNG AI CHI TIẾT

| # | Nhiệm vụ & Prompt thực tế | Mục đích kỹ thuật | Kết quả AI ban đầu | Sinh viên đã điều chỉnh gì? (Adaptation) | Cách kiểm chứng (Verification) |
|---|---|---|---|---|---|
| 1 | *"Gợi ý kiến trúc thư mục cho ứng dụng E-Commerce React Native tuân thủ Separation of Concerns và dễ giải thích cho người mới học."* | Phân tách rõ ràng giữa Screen (UI), Context (State), Service (API), và Config. | AI gợi ý mô hình phân tầng sử dụng Redux Toolkit, Redux Saga và thư viện Axios. | **Từ chối Redux** vì quá nhiều boilerplate phức tạp. Chuyển sang dùng **React Context API** (`CartContext`, `WishlistContext`) và native `fetch()` để mã nguồn dễ đọc, tinh gọn và dễ trả lời phỏng vấn. | Kiểm tra cây thư mục, đảm bảo các màn hình không gọi trực tiếp `fetch()` mà thông qua các hàm đóng gói trong tầng `src/api/`. |
| 2 | *"Viết hàm gọi Gemini API nhận vào nhu cầu khách hàng và danh sách sản phẩm thật, yêu cầu loại bỏ các ID ảo nếu AI bịa ra."* | Triển khai yêu cầu R10 (Gemini AI Integration) và giải quyết câu hỏi kiểm tra Hallucination của giảng viên. | AI đề xuất gọi API dạng chat hội thoại tự do, trả về đoạn văn bản thuần túy không có cấu trúc cố định. | **Yêu cầu AI trả về định dạng JSON nghiêm ngặt** `{ advice, recommendedProductIds }`. Bổ sung thuật toán duyệt mảng ID, lọc bỏ các ID không tồn tại trong kho hàng, đồng thời thêm cơ chế **Local Fallback Matcher** khi mất mạng. | Viết script kiểm thử với danh sách 3 sản phẩm mẫu và kiểm tra trường hợp AI trả về ID số 99999 -> Hệ thống lọc bỏ ID 99999 thành công và báo cáo vào mảng `rejectedIds`. |
| 3 | *"Viết logic tính toán tổng tiền, số lượng và phí vận chuyển cho giỏ hàng trong CartContext."* | Đáp ứng yêu cầu R06 (Derived Totals) và giải thích nguyên tắc Single Source of Truth. | AI đề xuất tạo 3 state độc lập: `const [subtotal, setSubtotal] = useState(0);`, `const [total, setTotal]...` và cập nhật bằng nhiều hàm riêng lẻ. | **Từ chối lưu vào state độc lập** vì dễ gây hiện tượng bất đồng bộ dữ liệu (Sync Anomalies). Chuyển sang sử dụng hook `useMemo` để tính toán dẫn xuất trực tiếp từ mảng `cartItems`. | Chạy kịch bản thêm 2 sản phẩm trùng nhau -> Số lượng tăng lên 2 và tổng tiền tự động nhân đôi ngay tức thì mà không cần thêm bất kỳ lệnh `setState` phụ nào. |
| 4 | *"Cách cấu hình thông báo cục bộ khi đặt hàng thành công bằng expo-notifications trên Android."* | Thực hiện yêu cầu R09 (Notification Business Workflow). | AI cung cấp đoạn code cũ dùng cú pháp Notifications v0.24 không tương thích với Expo SDK 57. | Cập nhật theo cú pháp mới nhất: khai báo Channel với `AndroidImportance.MAX`, xin quyền thông qua `requestPermissionsAsync()`, và bọc xử lý lỗi nếu người dùng bấm từ chối quyền (Denied). | Thử nghiệm trên Android: Nhấn "Đặt hàng" -> Thanh trạng thái điện thoại hiển thị pop-up thông báo thành công kèm mã đơn hàng. |


