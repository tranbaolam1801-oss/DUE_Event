# EVENTFLOW — HỆ THỐNG QUẢN LÝ QUY TRÌNH TỔ CHỨC SỰ KIỆN
**Đơn vị sử dụng:** Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE)

---

## 1. Giới thiệu tổng quan
**EventFlow** là ứng dụng web quản lý toàn diện vòng đời quy trình tiếp nhận, xét duyệt đa cấp, mượn cơ sở vật chất, nghiệm thu và thanh quyết toán sự kiện sinh viên.

Ứng dụng được xây dựng theo kiến trúc hiện đại bằng **React 19 + TypeScript + Vite + Tailwind CSS v4 + Recharts + Lucide Icons**, tích hợp sẵn:
- **State Machine Workflow Engine:** Kiểm soát chặt chẽ 34 trạng thái và 9 giai đoạn phê duyệt (BTC nộp -> BCN Khoa xét duyệt -> Đoàn Trường cấp phép -> Kiểm tra CSVC & Trùng lịch -> Nghiệm thu hoàn trả -> Quyết toán KHTC).
- **Hệ thống Kiểm tra Trùng lịch Thông minh:** Tự động phát hiện xung đột lịch phòng và thiết bị theo khoảng thời gian thực tế, cảnh báo trực quan.
- **Trợ lý AI Rà soát & Đề xuất:** Chấm điểm độ hoàn thiện hồ sơ (0 - 100 điểm), phát hiện thiếu sót về an toàn/ngân sách, gợi ý phương án bố trí hội trường và tự động tạo bản nháp báo cáo tổng kết.
- **Dữ liệu Mẫu Phong phú (Rich Mock Data & Local Persistence):** 7 tài khoản demo theo đúng các vai trò nghiệp vụ, 6 hội trường/phòng đa năng, 9 loại thiết bị và 9 sự kiện mẫu bao phủ đầy đủ các tình huống nghiệp vụ thực tế.

---

## 2. Kiến trúc Hệ thống & Công nghệ

### Frontend
- **Framework & Core:** React 19, TypeScript, Vite, React Router v7.
- **Styling:** Tailwind CSS v4, Lucide React Icons.
- **Data & Charts:** Recharts (trực quan hóa thống kê), FullCalendar UI, React Hook Form & Zod.
- **Workflow Engine:** State Machine với 9 giai đoạn và 34 trạng thái nghiệp vụ.

### Backend
- **Nền tảng:** Node.js, Express, TypeScript.
- **Database & ORM:** SQLite (dễ chạy và di động) + Prisma ORM 5.22.
- **Bảo mật:** JWT Authentication (Bearer token), Bcrypt password hashing, Helmet, CORS, Role-based Access Control (RBAC).
- **Validation:** Zod schemas cho tất cả payload đầu vào.
- **AI Service:** Tích hợp bộ máy AI thẩm định hồ sơ, rà soát xung đột và tự động sinh bản nháp báo cáo.

---

## 3. Hướng dẫn Khởi chạy Hệ thống

### Cách 1: Khởi chạy 1 chạm (Khuyên dùng trên Windows)
- **Chạy toàn bộ Full-Stack (cả Frontend + Backend):** Nhấp đúp vào file `CHAY_FULLSTACK.bat`.
  - Backend API sẽ tự khởi động tại `http://localhost:3001`
  - Frontend Web sẽ tự khởi động và mở trình duyệt tại `http://localhost:5173`
- **Chỉ chạy Frontend:** Nhấp đúp vào `CHAY_UNG_DUNG.bat`
- **Chỉ chạy Backend:** Nhấp đúp vào `CHAY_BACKEND.bat`

---

### Cách 2: Khởi chạy thủ công bằng dòng lệnh

#### Khởi chạy Backend:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
# Server lắng nghe tại: http://localhost:3001
```

#### Khởi chạy Frontend:
```bash
cd frontend
npm install
npm run dev
# Web app chạy tại: http://localhost:5173
```

### Timeline, dự toán và tệp đính kèm
- Có thể lưu bản nháp ở bất kỳ bước nào; nút **Tiếp tục** trong danh sách hồ sơ mở lại bản nháp và nạp lại timeline, dự toán, cơ sở vật chất cùng các tệp đã lưu.
- Tại bước 2 và 3, có thể tải `.xlsx`, `.xls`, `.docx` hoặc `.pdf`. Chỉ `.xlsx` có bảng phù hợp được trích xuất xem trước; người dùng phải xác nhận mới thêm các dòng vào biểu mẫu. Các định dạng khác vẫn là tệp tham chiếu, không được tự coi là dữ liệu có cấu trúc.
- Nộp hồ sơ yêu cầu ít nhất một dòng timeline có khung giờ và nội dung. Tệp dự toán chưa được chuyển thành khoản chi không được coi là tổng dự toán đã xác minh.
- Môi trường production phải dùng bucket **private** của Supabase Storage và cấu hình `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`. Production không lưu tệp lâu dài trên ổ đĩa ứng dụng; nếu thiếu Storage config, upload sẽ báo lỗi thay vì trả thành công giả.

---

## 4. Danh sách Tài khoản Demo & Hướng dẫn Kiểm thử

Hệ thống có sẵn tính năng **"Đổi vai trò 1 chạm"** ngay tại thanh Sidebar hoặc góc trên màn hình, hoặc bạn có thể đăng nhập bằng email và mật khẩu (mật khẩu mặc định: `123456`):

| Vai trò | Họ tên & Đơn vị | Email | Mật khẩu | Quyền hạn chính |
|---|---|---|---|---|
| **1. BTC** | Nguyễn Văn An (CLB Tin học DUE) | `btc1@eventflow.vn` / `btc@due.edu.vn` | `123456` | Tạo hồ sơ 5 bước, gửi duyệt, nộp báo cáo, nộp chứng từ |
| **2. BCN Khoa** | PGS.TS. Lê Văn Cường (Khoa QTKD) | `bcnkhoa@eventflow.vn` / `bcn@due.edu.vn` | `123456` | Xét duyệt nội dung vòng 1 (Chấp thuận, Sửa, Từ chối) |
| **3. Đoàn Trường** | ThS. Phạm Thị Dung (VP Đoàn - Hội) | `doantruong@eventflow.vn` / `doantruong@due.edu.vn` | `123456` | Thẩm định điều kiện, cấp phép chính thức, đóng hồ sơ |
| **4. CSVC** | Nguyễn Hữu Em (Phòng CSVC & TB) | `csvc@eventflow.vn` / `csvc@due.edu.vn` | `123456` | Quản lý hội trường, phát hiện trùng lịch, bàn giao, nghiệm thu |
| **5. KHTC** | Trần Văn Phúc (Phòng KHTC) | `khtc@eventflow.vn` / `khtc@due.edu.vn` | `123456` | Kiểm tra hóa đơn VAT, chứng từ hợp lệ, duyệt quyết toán |
| **6. Admin** | Lê Hoàng Admin (TT CNTT) | `admin@eventflow.vn` / `admin@due.edu.vn` | `123456` | Quản trị người dùng, cấu hình tham số hệ thống |

---

## 5. Danh mục REST API (Backend)

| Nhóm API | Method | Endpoint | Quyền truy cập | Mô tả |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/login` | Công khai | Đăng nhập hệ thống, trả về JWT Token |
| | `GET` | `/api/auth/me` | Đăng nhập | Lấy thông tin cá nhân hiện tại |
| **Events** | `GET` | `/api/events` | Đăng nhập | Danh sách hồ sơ, hỗ trợ tìm kiếm & lọc trạng thái |
| | `POST` | `/api/events` | BTC, Admin | Tạo mới hồ sơ sự kiện |
| | `GET` | `/api/events/:id` | Đăng nhập | Xem chi tiết hồ sơ & 9 tab nghiệp vụ |
| | `PUT` | `/api/events/:id` | BTC, Admin | Chỉnh sửa hồ sơ (sinh phiên bản mới) |
| | `POST` | `/api/events/:id/submit` | BTC | Nộp hồ sơ xét duyệt chính thức |
| | `POST` | `/api/events/:id/review` | BCN, Đoàn, CSVC, KHTC | Phê duyệt chuyển trạng thái theo State Machine |
| | `GET` | `/api/events/:id/history` | Đăng nhập | Xem toàn bộ nhật ký phê duyệt (Audit log) |
| **CSVC** | `POST` | `/api/bookings/check-conflict`| Đăng nhập | Kiểm tra trùng lịch hội trường theo thời gian thực |
| | `POST` | `/api/bookings` | BTC, CSVC | Tạo yêu cầu giữ chỗ cơ sở vật chất |
| | `PUT` | `/api/bookings/:id/confirm` | CSVC, Admin | Phê duyệt xác nhận giữ chỗ chính thức |
| | `PUT` | `/api/bookings/:id/reject` | CSVC, Admin | Từ chối hoặc yêu cầu đổi phòng |
| | `GET` | `/api/bookings/facilities/:id/calendar` | Đăng nhập | Lấy lịch sử dụng chi tiết của hội trường |
| **Nghiệm thu**| `POST` | `/api/handover/records` | CSVC, BTC | Lập biên bản bàn giao phòng trước giờ G |
| | `POST` | `/api/handover/inspections` | CSVC, BTC | Lập biên bản nghiệm thu & hoàn trả CSVC |
| | `POST` | `/api/handover/incidents` | CSVC, BTC | Lập biên bản sự cố, hư hao thiết bị |
| **Quyết toán**| `GET` | `/api/settlements/:eventId` | Đăng nhập | Lấy hồ sơ quyết toán tài chính |
| | `POST` | `/api/settlements` | BTC | Khởi tạo bảng kê chứng từ quyết toán |
| | `POST` | `/api/settlements/:id/submit`| BTC | Nộp quyết toán sang Phòng KHTC |
| | `POST` | `/api/settlements/:id/review`| KHTC, Admin | Phê duyệt quyết toán / Yêu cầu bổ sung chứng từ |
| **Trợ lý AI**| `POST` | `/api/ai/analyze-event` | Đăng nhập | Chấm điểm hồ sơ, rà soát rủi ro an toàn & ngân sách |
| | `POST` | `/api/ai/suggest-resources` | Đăng nhập | Gợi ý hội trường & thiết bị phù hợp quy mô |
| | `POST` | `/api/ai/draft-report` | BTC, Admin | Sinh bản nháp báo cáo tổng kết tự động |
| **Thống kê** | `GET` | `/api/analytics/dashboard` | Đăng nhập | Thống kê số lượng, tiến độ theo trạng thái |
| | `GET` | `/api/analytics/workflow-bottlenecks` | Đăng nhập | Đo lường thời gian xử lý trung bình từng phòng ban |

---

## 6. Hướng dẫn Đẩy lên GitHub (Git & GitHub Setup)

Repository Git cục bộ đã được khởi tạo và commit đầy đủ mã nguồn. Để đẩy lên kho GitHub cá nhân của bạn:

```bash
# 1. Mở terminal tại thư mục gốc eventflow
cd C:\Users\Admin\.gemini\antigravity\scratch\eventflow

# 2. Tạo một repository mới trên GitHub (ví dụ: eventflow-due)
# 3. Gắn URL remote GitHub (thay <YOUR_GITHUB_REPO_URL> bằng link GitHub của bạn):
git remote add origin https://github.com/<username>/eventflow-due.git

# 4. Đẩy mã nguồn lên branch main:
git branch -M main
git push -u origin main
```

---

## 4. Danh sách các Trang & Tính năng Đã Hoàn thiện

1. **Trang Đăng nhập (`/login`):** Thiết kế giao diện nhận diện thương hiệu Đại học Kinh tế – ĐHĐN, hỗ trợ đăng nhập email/mật khẩu và chọn nhanh vai trò demo 1 chạm.
2. **Dashboard Tổng quan (`/`):** Thống kê số lượng hồ sơ theo trạng thái, biểu đồ tiến độ Recharts, nhật ký xử lý theo thời gian thực và phím tắt nghiệp vụ.
3. **Danh sách Hồ sơ (`/events`):** Bảng dữ liệu tìm kiếm đa tiêu chí, lọc theo trạng thái (Chờ duyệt, Cần sửa, Cấp phép, Hoàn tất), lọc theo Khoa/đơn vị.
4. **Chi tiết Hồ sơ Trọng tâm (`/events/:id`):** 
   - Thanh tiến trình **Workflow Stepper 9 giai đoạn**.
   - Hộp hành động động theo vai trò (Chấp thuận, Yêu cầu sửa kèm lý do, Từ chối, Giữ chỗ, Bàn giao, Quyết toán).
   - 9 Tab nghiệp vụ: Thông tin chung, Kịch bản (Agenda), Dự toán kinh phí, Đăng ký CSVC, Tài liệu đính kèm, Lịch sử phê duyệt, Bàn giao & Nghiệm thu, Quyết toán KHTC, Báo cáo tổng kết.
5. **Tạo Sự kiện Mới (`/events/create`):** Biểu mẫu chuẩn hóa 5 bước, thêm/xóa dòng kịch bản và dự trù kinh phí tự động tính tổng tiền, kiểm tra trùng lịch phòng ngay lúc chọn.
6. **Chỉnh sửa Hồ sơ (`/events/:id/edit`):** Cho phép BTC cập nhật thông tin và lưu lý do sửa đổi tạo phiên bản mới (v1 -> v2).
7. **Hàng đợi Phê duyệt (`/approvals`):** Hộp thư xử lý thông minh tự động lọc các hồ sơ đang chờ hành động của vai trò hiện tại (BCN Khoa, Đoàn trường, CSVC, KHTC).
8. **Lịch Cơ sở vật chất (`/calendar`):** Lịch trực quan hiển thị các khung giờ đã đặt của từng hội trường, tự động bôi đỏ cảnh báo khi có xung đột thời gian.
9. **Danh mục Phòng & Thiết bị (`/facilities`):** Quản lý chi tiết sức chứa, tiện ích sẵn có của 6 hội trường/phòng và tình trạng khả dụng của 9 loại thiết bị.
10. **Bàn giao & Nghiệm thu (`/handover`):** Lập biên bản bàn giao phòng trước sự kiện và biên bản nghiệm thu hoàn trả sau sự kiện (có ghi nhận sự cố hư hỏng).
11. **Quyết toán Tài chính (`/settlements`):** Bảng so sánh dự toán vs thực tế, danh mục hóa đơn VAT/biên nhận, nút kiểm tra tính hợp lệ và phê duyệt chi cho KHTC.
12. **Báo cáo Tổng kết (`/reports`):** Ghi nhận số liệu tham gia thực tế, tích hợp nút **"AI Tạo bản nháp báo cáo"** tự động điền kết quả, thách thức và bài học kinh nghiệm.
13. **Trợ lý AI Rà soát (`/ai-review`):** Thẩm định hồ sơ độc lập, chấm điểm 0 - 100, phát hiện rủi ro PCCC, vượt hạn mức chi và gợi ý phương án phòng tối ưu.
14. **Báo cáo Thống kê & Đo lường (`/analytics`):** Đo lường thời gian xử lý trung bình từng đơn vị, tỷ lệ duyệt đạt chuẩn, tỷ lệ giải quyết trùng phòng, kèm nút **Xuất dữ liệu CSV**.
15. **Trung tâm Thông báo (`/notifications`):** Thông báo biến động trạng thái hồ sơ, nhắc việc cho các phòng ban, đánh dấu đã đọc.
16. **Quản trị Người dùng & Cấu hình (`/admin/users`, `/admin/settings`):** Phân quyền vai trò và cài đặt thời hạn giữ chỗ tạm thời (48h), hạn mức duyệt đặc biệt (50tr).
