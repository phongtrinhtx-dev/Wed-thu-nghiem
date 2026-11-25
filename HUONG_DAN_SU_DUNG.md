# HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ KHO & THEO DÕI VẬT CHẤT HÀNG HÓA

> **Hệ thống theo dõi nhập, xuất, tồn kho và xuất báo cáo chuẩn quy chuẩn Quân nhu / Kho vật chất:**
> - **Mẫu 26: PNX-KH/QN17 & Biểu SS14-QN10** (Phiếu nhập kho & Phiếu xuất kho)
> - **Mẫu 09: STD-KH/QN17** (Sổ theo dõi vật chất quân nhu / Thẻ kho)
> - **Mẫu số 1.6 - QN** (Báo cáo kết quả tổng hợp kiểm kê vật chất, trang bị: Phụ lục 1 Dự trữ SSCĐ & Phụ lục 2 Thường xuyên)

---

## 1. Cách khởi động ứng dụng

Bạn có thể chạy ứng dụng theo 2 cách cực kỳ đơn giản:
1. **Cách 1 (Nhanh nhất):** Nhấp đúp chuột vào tệp `Chay-Trang-Web.bat`.
2. **Cách 2:** Mở trực tiếp tệp `index.html` bằng bất kỳ trình duyệt web nào (Google Chrome, Microsoft Edge, Firefox, Cốc Cốc).

*Ứng dụng hoạt động 100% độc lập, không cần cài đặt phần mềm máy chủ (Server), bảo mật dữ liệu tuyệt đối và lưu trữ trực tiếp trên máy của bạn.*

---

## 2. Các tính năng chính của hệ thống

### 📊 1. Bảng điều khiển Tổng quan (Dashboard)
- **Thống kê thời gian thực:** Tổng số mặt hàng quản lý, Tổng tồn kho thực tế, Tổng giá trị thành tiền trong kho (VNĐ), Số lượng giao dịch gần đây.
- **Biểu đồ phẩm cấp chất lượng:** Tự động phân loại tỷ lệ % và số lượng theo 4 cấp chất lượng:
  - **Cấp 1:** Mới 100%, đủ tiêu chuẩn sử dụng.
  - **Cấp 2:** Đã qua sử dụng, phẩm chất còn tốt.
  - **Cấp 3:** Xuống cấp, kém chất lượng, cần sửa chữa bảo dưỡng.
  - **Cấp 4:** Hư hỏng, mất phẩm chất, đề nghị điều đi hoặc thanh xử lý.
- **Cảnh báo tồn kho:** Tự động cảnh báo mặt hàng dưới định mức tồn tối thiểu hoặc có phẩm cấp Cấp 3, Cấp 4 để chủ động lập kế hoạch bổ sung/xử lý.
- **Lịch sử giao dịch gần nhất:** Xem nhanh các phiếu nhập/xuất vừa lập, in trực tiếp hoặc xuất Excel ngay lập tức.

---

### 📥 2. Quản lý Nghiệp vụ Nhập kho (Phiếu nhập - Mẫu 26)
- **Lập phiếu nhập kho:**
  - Nhập thông tin bên giao: Cửa hàng cung cấp, đơn vị cấp trên (Kho Cầu Bươu...), số hợp đồng/lệnh điều động, phương tiện vận chuyển.
  - Thêm nhiều mặt hàng trong cùng 1 phiếu.
  - Nhập **Số lượng phải nhập**, **Số lượng thực nhập**, **Phẩm cấp chất lượng (Cấp 1 - Cấp 4)**, **Đơn giá**.
  - Hệ thống tự động tính thành tiền từng dòng và tổng tiền toàn phiếu (bằng số và tự động sinh chữ tiếng Việt).
- **In ấn & Xuất file:**
  - In trực tiếp phiếu nhập khổ A4 dọc với đầy đủ 4 chữ ký: Người viết phiếu, Người giao hàng, Thủ kho, Người duyệt.
  - Xuất ra tệp Excel (.xlsx/.xls) chuẩn mẫu Mẫu 26: PNX-KH/QN17.

---

### 📤 3. Quản lý Nghiệp vụ Xuất kho (Phiếu xuất - Biểu SS14-QN10 / Mẫu 26)
- **Lập phiếu xuất kho:**
  - Nhập họ tên người nhận, đơn vị (bộ phận) nhận hàng, lý do xuất kho (cấp phát huấn luyện, chuyển cấp dưỡng, trả hàng...).
  - Thêm các mặt hàng xuất kho.
  - **Kiểm tra tồn kho tự động:** Hệ thống hiển thị số lượng tồn kho khả dụng hiện tại của từng mặt hàng và cảnh báo nếu người dùng xuất vượt quá số lượng trong kho nhằm tránh xuất âm.
  - Lựa chọn phẩm cấp xuất (Cấp 1, Cấp 2, Cấp 3, Cấp 4).
  - Tự động tính tổng tiền xuất kho và diễn giải bằng chữ.
- **In ấn & Xuất file:**
  - In trực tiếp khổ A4 dọc với 5 chữ ký quy chuẩn: Người viết phiếu, Người nhận hàng, Thủ kho, Chủ nhiệm Hậu cần, Thủ trưởng đơn vị duyệt.
  - Xuất ra tệp Excel (.xlsx/.xls) chuẩn mẫu.

---

### 📖 4. Sổ Theo Dõi Vật Chất Quân Nhu (Mẫu 09: STD-KH/QN17)
- **Theo dõi chi tiết Thẻ kho / Sổ vật chất:**
  - Lọc theo từng mặt hàng hoặc xem toàn bộ kho.
  - Lọc theo khoảng thời gian (Từ ngày... Đến ngày...).
  - Tự động tổng hợp:
    - **Số dư đầu kỳ:** Lũy kế trước thời điểm bắt đầu lọc.
    - **Chi tiết các lần nhập, xuất trong kỳ:** Theo số chứng từ, ngày tháng, đơn vị giao nhận, phẩm cấp, số lượng nhập/xuất, số dư tồn sau từng giao dịch.
    - **Tổng phát sinh trong kỳ:** Tổng nhập và tổng xuất.
    - **Số dư tồn cuối kỳ:** Tính theo thời gian thực kèm tổng giá trị quy đổi ra tiền.
- **In ấn & Xuất file:**
  - In Sổ theo dõi theo khổ giấy A4 ngang chuẩn lưu trữ văn thư.
  - Xuất tệp Excel Mẫu 09 đầy đủ định dạng cột.

---

### 📋 5. Báo Cáo Kiểm Kê Vật Chất, Trang Bị (Mẫu số 1.6 - QN)
- **Tạo đợt kiểm kê định kỳ hoặc đột xuất:**
  - Mặc định hỗ trợ kỳ kiểm kê định kỳ 0h ngày 01/7 hoặc 01/1 hàng năm.
  - Tự động chốt tồn sổ sách tại thời điểm kiểm kê.
  - Bảng kiểm kê gồm 2 phụ lục chuẩn biểu mẫu:
    - **Phụ lục 1:** Vật chất, trang bị Quân nhu Dự trữ SSCĐ (Sẵn sàng chiến đấu).
    - **Phụ lục 2:** Vật chất, trang bị Quân nhu Thường xuyên.
  - Nhập số lượng thực tế kiểm đếm, hệ thống **tự động so sánh với Sổ sách và tính ra chênh lệch Thừa / Thiếu**.
  - Nhập số lượng phân loại theo phẩm cấp chất lượng: **Cấp 1, Cấp 2, Cấp 3, Cấp 4**.
  - Ghi nhận phương án xử lý: Đề nghị điều đi, xin thanh xử lý, giữ nguyên dự trữ, chuyển sử dụng thường xuyên.
- **Xuất báo cáo đa dạng:**
  - **In trực tiếp:** Bản in A4 ngang chuẩn Hội đồng kiểm kê gồm đủ các chữ ký (Thủ kho, Trợ lý tổng hợp, Chủ tịch Hội đồng, Thủ trưởng đơn vị).
  - **Xuất file Excel (.xlsx):** Bao gồm cả Phụ lục 1 và Phụ lục 2.
  - **Xuất file Word (.doc):** Dùng để nộp cấp trên hoặc lưu trữ biên bản.

---

### 📦 6. Quản lý Danh mục Mặt hàng
- Thêm mới, chỉnh sửa, xóa mặt hàng.
- Quản lý theo nhóm: Quân trang, Dụng cụ cấp dưỡng, Quân lương - LTTP, Doanh cụ & Khác.
- Thiết lập đơn vị tính, đơn giá hạch toán, phân loại (Thường xuyên hoặc Dự trữ SSCĐ), định mức tồn an toàn tối thiểu.

---

### 🖨️ 7. Menu Xuất Biểu Mẫu (Export Center)
- Trung tâm tập trung giúp xuất nhanh và xem trước tất cả các biểu mẫu quy chuẩn (Mẫu 26 Nhập, Mẫu 26 Xuất, Mẫu 09 Sổ theo dõi, Mẫu 1.6 Báo cáo kiểm kê) chỉ với 1 cú nhấp chuột.

---

### ⚙️ 8. Cài đặt Đơn vị & Sao lưu Dữ liệu
- **Cấu hình đơn vị:** Thay đổi tên đơn vị cấp trên, đơn vị trực thuộc, phòng/ban hậu cần, tên kho, địa điểm, họ tên các chức danh ký duyệt (Thủ kho, Trợ lý, Chủ nhiệm Hậu cần, Chỉ huy). Thông tin này sẽ tự động hiển thị trên tất cả các phiếu nhập, phiếu xuất và báo cáo.
- **Sao lưu (Backup):** Tải toàn bộ dữ liệu ra tệp `.json` để cất giữ an toàn.
- **Phục hồi (Restore):** Nạp lại dữ liệu từ tệp sao lưu khi chuyển máy tính hoặc cài đặt lại.
- **Khôi phục dữ liệu mẫu:** Khôi phục lại toàn bộ dữ liệu chuẩn trích xuất từ các hồ sơ đính kèm của người dùng bất cứ lúc nào.
