# Đồng bộ hồ sơ giữa hai máy

1. Trên máy chủ, đóng các cửa sổ EventFlow cũ, chạy `CHAY_FULLSTACK.bat`. File này build bản mới, khởi động API cổng 3001 và web cổng 5173. Giữ cả hai cửa sổ đang chạy.
2. Máy chủ mở http://localhost:5173/. Máy khác mở http://IP-MAY-CHU:5173/ (dùng IP hiện tại của máy chủ).
3. Đăng nhập bằng email và mật khẩu. Tài khoản mẫu được thêm khi thiếu: `btc1@eventflow.vn`, `bcnkhoa@eventflow.vn`, `doantruong@eventflow.vn`, `csvc@eventflow.vn`, `khtc@eventflow.vn`, `admin@eventflow.vn`; mật khẩu khởi tạo `123456`. Tài khoản đã có giữ nguyên mật khẩu. Nút chọn vai trò chỉ chọn email, vẫn phải đăng nhập.
4. Máy A tạo và nộp hồ sơ; máy B đăng nhập cùng tài khoản hoặc tài khoản xét duyệt phù hợp. Danh sách tự tải lại mỗi 5 giây và khi quay lại cửa sổ. BTC chỉ xem hồ sơ của mình, tài khoản xét duyệt xem danh sách chung.

## Hồ sơ cũ

Mở đúng trình duyệt và đúng địa chỉ đã tạo hồ sơ trước đây (localhost và IP có bộ nhớ riêng). Trong hộp “Hồ sơ cũ”, tải bản sao JSON trước, rồi chọn “Nhập hồ sơ cũ lên máy chủ” khi đăng nhập tài khoản chủ hồ sơ.

Hồ sơ được nhập thành bản nháp để kiểm tra và nộp lại. Nội dung, dự toán và lịch trình được nhập; đặt phòng, lịch sử duyệt, bàn giao, quyết toán và báo cáo cũ không tự áp dụng vào quy trình đang chạy. Toàn bộ bản gốc vẫn ở localStorage và được lưu trong SystemSetting của database khi nhập thành công. Nhập lại cùng hồ sơ không tạo bản trùng. Không xóa localStorage nếu chưa kiểm tra bản sao.

## Lưu trữ và xử lý lỗi

Dữ liệu dùng chung ở `backend/prisma/dev.db` trên máy chủ. Sao lưu file này khi backend đã dừng. Không chạy `db:seed` để khởi động: lệnh seed cũ xóa dữ liệu. `db:init` mới chỉ thêm tài khoản/phòng/thiết bị còn thiếu, không xóa hồ sơ.

Frontend gọi `/api` qua proxy của máy chủ; `localhost:3001` trong vite.config.ts là đúng vì proxy chạy trên máy chủ. Không đặt VITE_API_URL thành localhost trên máy khách.

Nếu mất kết nối, trang hiển thị lỗi đồng bộ; thao tác thất bại không báo lưu thành công. Khi hai máy sửa cùng hồ sơ, bản sửa cũ bị từ chối để tránh ghi đè. Cần tải lại trang và áp dụng lại chỉnh sửa.

Các chứng từ/đính kèm trong giao diện hiện tại chủ yếu là thông tin mô tả; bản sửa này không bổ sung chức năng tải và lưu nội dung file nhị phân.
