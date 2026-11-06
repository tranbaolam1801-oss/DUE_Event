# BÁO CÁO PHÂN TÍCH CÁC ĐIỂM CHƯA XÁC MINH, LỆCH PHA VÀ NGUY CƠ LỖI HỆ THỐNG MY DUE

> **Mục tiêu:** Phân tích thực chứng từ mã nguồn thực tế để giải đáp triệt để 8 câu hỏi kiểm tra về các vấn đề đồng bộ quy trình: BCH gửi hồ sơ nhưng BCN Khoa không thấy; số lượng đếm hồ sơ không thống nhất giữa các màn hình; thông báo không xuất hiện đúng vai trò nhận.

---

## 1. GIẢI ĐÁP 8 CÂU HỎI TRUY VẾT QUY TRÌNH DUYỆT THỰC TẾ

### Câu 1: API nào cập nhật trạng thái hồ sơ?
- **Căn cứ mã nguồn:**
  1. `POST /api/events/:id/submit`: Do `BTC` gọi khi hoàn thành hồ sơ nháp. Cập nhật `Event.status` từ `DRAFT` (hoặc `*_REVISION_REQUESTED`) sang `FACULTY_REVIEW`. Tăng `currentVersion` lên 1 và ghi vết `WorkflowHistory` với action `SUBMIT`. (Minh chứng: `backend/src/services/event.service.ts` dòng 353–430).
  2. `POST /api/events/:id/review`: Do `BCN_KHOA`, `DOAN_TRUONG`, `CSVC`, `KHTC`, `ADMIN` gọi. Sử dụng động cơ State Machine `transitionState()` trong `backend/src/services/workflow.service.ts` (dòng 108–230) để cập nhật `Event.status` theo ma trận 34 trạng thái.
  3. `POST /api/events/:id/handover`: Do `CSVC` gọi khi xác nhận bàn giao cơ sở vật chất, cập nhật trạng thái hồ sơ sang `FACILITY_HANDED_OVER` hoặc `REPORT_PENDING` (Minh chứng: `backend/src/routes/event.routes.ts` dòng 148–164).

### Câu 2: API nào lấy danh sách hồ sơ chờ duyệt?
- **Căn cứ mã nguồn:**
  - Backend cung cấp API: `GET /api/events` (truyền tham số truy vấn `status`, `search`, `page`, `limit`).
  - **Phát hiện quan trọng:** Ở tầng Backend (`getEvents` trong `event.service.ts` dòng 246–273), câu lệnh truy vấn CSDL:
    ```typescript
    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status;
    ```
    Backend **KHÔNG** tự động lọc hồ sơ theo vai trò người gọi mà trả về toàn bộ hồ sơ trong trường nếu không truyền `status`.
  - Việc lọc "Hồ sơ chờ duyệt của riêng tôi" được thực hiện ở tầng **Frontend** tại file `frontend/src/pages/ApprovalQueuePage.tsx` (dòng 26–37) dựa trên mảng `events` được context đồng bộ về:
    - BCN Khoa lọc: `e.status === 'FACULTY_REVIEW'`
    - Đoàn Trường lọc: `['UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACULTY_APPROVED'].includes(e.status)`
    - CSVC lọc: `['FACILITY_REVIEW', 'FACILITY_RETURN_PENDING', 'PERMIT_ISSUED'].includes(e.status)`
    - KHTC lọc: `['FINANCE_REVIEW', 'FINANCE_APPROVAL_PENDING'].includes(e.status)`

### Câu 3: API nào tạo thông báo?
- **Căn cứ mã nguồn:**
  - Không có API HTTP công khai riêng để client tự ý tạo thông báo. Việc tạo thông báo được thực thi **ngầm (Server-side Trigger)** bên trong database transaction của 2 hàm backend:
    1. Hàm `submitEvent()` (`event.service.ts` L406–420): Khi hồ sơ nộp thành công, hệ thống tìm toàn bộ user có `role = 'BCN_KHOA'` và gọi `tx.notification.create`.
    2. Hàm `notifyEventStatusChange()` (`notification.service.ts` L98–145): Được gọi tự động trong `transitionState()` mỗi khi trạng thái hồ sơ thay đổi, tạo 1 thông báo cho người tạo hồ sơ (`createdById`) và thông báo cho vai trò tiếp nhận ở chặng tiếp theo (`targetRole`).

### Câu 4: API nào lấy thông báo cho người dùng?
- **Căn cứ mã nguồn:**
  - API: `GET /api/notifications` (tại `backend/src/routes/notification.routes.ts` dòng 12–24).
  - Hàm xử lý: `getNotifications(userId)` trong `notification.service.ts` (dòng 16–43).
  - Câu truy vấn CSDL: `prisma.notification.findMany({ where: { userId } })`.
  - **Ý nghĩa:** Thông báo được gán đích danh theo `userId`. Người dùng phải đăng nhập bằng đúng tài khoản có `id` tương ứng thì mới nhận được thông báo.

### Câu 5: Các API có sử dụng chung nguồn dữ liệu không?
- **Căn cứ mã nguồn:**
  - **CÓ:** Toàn bộ Backend Express API kết nối chung một cơ sở dữ liệu SQLite duy nhất tại `backend/prisma/dev.db` thông qua `PrismaClient` Singleton (`backend/src/config/database.ts`).
  - Tất cả các bảng `Event`, `Notification`, `WorkflowHistory`, `ResourceBooking`, `Settlement` đều nằm trong cùng một schema CSDL quan hệ.
  - Tuy nhiên, Frontend React lưu dữ liệu sự kiện trong React State của `EventContext.tsx` và thực hiện cơ chế Polling 5 giây một lần (`setInterval(refresh, 5000)`). Khi vừa thực hiện thao tác xong, nếu người dùng chuyển màn hình trước khi chu kỳ 5 giây hoàn thành hoặc trước khi Promise `run()` giải quyết xong, giao diện có thể hiển thị dữ liệu chưa kịp đồng bộ từ bộ nhớ tạm.

### Câu 6: Điều kiện lọc theo vai trò là gì?
- **Căn cứ mã nguồn:**
  - Trong Backend API `GET /api/analytics/dashboard` (`analytics.service.ts` dòng 20–30):
    - Nếu `role === 'BTC'` $\rightarrow$ gán điều kiện `createdById = userId`.
    - Nếu `role === 'BCN_KHOA'` $\rightarrow$ `status: 'FACULTY_REVIEW'`.
    - Nếu `role === 'DOAN_TRUONG'` $\rightarrow$ `status in ['UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'PERMIT_ISSUED']`.
    - Nếu `role === 'CSVC'` $\rightarrow$ `status in ['FACILITY_REVIEW', 'FACILITY_RETURN_PENDING']`.
    - Nếu `role === 'KHTC'` $\rightarrow$ `status in ['FINANCE_REVIEW', 'FINANCE_APPROVAL_PENDING']`.
  - Trong Frontend `ApprovalQueuePage.tsx` (dòng 26–37):
    - Áp dụng bộ lọc JavaScript trên mảng client-side `events` tương tự như trên.

### Câu 7: Có chênh lệch giữa API danh sách và API bộ đếm không?
- **CĂN CỨ BẰNG CHỨNG XÁC THỰC: CÓ SỰ LỆCH PHA LỚN!**
  - **Tại `DashboardPage.tsx` (Frontend - Dòng 28–30):**
    ```typescript
    const pendingApproval = events.filter((e) =>
      ['FACULTY_REVIEW', 'UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACILITY_REVIEW', 'FINANCE_REVIEW'].includes(e.status)
    ).length;
    ```
    $ightarrow$ **Nguyên nhân lỗi:** Trang Dashboard tính con số "Đang chờ duyệt" bằng cách gộp TẤT CẢ các hồ sơ đang nằm ở bất kỳ khâu duyệt nào trong toàn trường, **hoàn toàn không lọc theo vai trò của người đang đăng nhập**!
  - **Tại `ApprovalQueuePage.tsx` (Frontend - Dòng 27):**
    Nếu cán bộ Khoa đăng nhập (`currentUser.role === 'BCN_KHOA'`), trang này chỉ hiển thị các hồ sơ có trạng thái `FACULTY_REVIEW`.
  - **Hệ quả thực tế:** Cán bộ BCN Khoa vừa đăng nhập vào Dashboard nhìn thấy con số "Đang duyệt: 8 hồ sơ" (vì tính cả hồ sơ của Đoàn Trường, CSVC, KHTC), nhưng khi click vào "Hàng đợi xét duyệt" thì chỉ thấy 1 hồ sơ của Khoa mình. Điều này gây hiểu lầm là hệ thống bị mất hồ sơ!

### Câu 8: Có nguy cơ lỗi ở việc xác định người nhận hồ sơ không?
- **CĂN CỨ BẰNG CHỨNG XÁC THỰC: CÓ 2 NGUY CƠ RỦI RO LỚN!**
  1. **Nguy cơ 1: Thiếu phân vùng theo Khoa (Multi-tenancy Department Issue):**
     - Trong `submitEvent()` (`event.service.ts` dòng 407–409):
       ```typescript
       const bcnUsers = await tx.user.findMany({
         where: { role: UserRole.BCN_KHOA, isActive: true },
       });
       ```
     - Hệ thống truy vấn **TẤT CẢ** các tài khoản có vai trò `BCN_KHOA` trong toàn trường, không đối chiếu trường `organizingUnit` của sự kiện với trường `department` của người dùng. Do đó, nếu CLB Tin học trực thuộc Khoa Thống kê - Tin học nộp hồ sơ, thì Trưởng khoa QTKD hay Trưởng khoa Ngân hàng cũng đều nhận được thông báo xét duyệt.
  2. **Nguy cơ 2: Loại trừ nhầm thông báo khi kiểm thử bằng 1 tài khoản (`self-exclusion bug`):**
     - Trong `notifyEventStatusChange()` (`notification.service.ts` dòng 132):
       ```typescript
       if (u.id !== event.createdById) { ... tạo thông báo ... }
       ```
     - Logic này nhằm tránh gửi thông báo cho chính mình. Tuy nhiên, trong quá trình phát triển và kiểm thử, người dùng thường sử dụng tính năng "Đổi vai trò 1 chạm" hoặc tạo sự kiện bằng tài khoản admin/test rồi chuyển sang vai trò duyệt. Nếu tài khoản test vô tình trùng `id`, thông báo đến người nhận sẽ bị hệ thống âm thầm hủy bỏ, dẫn đến việc vai trò nhận không nhận được bất kỳ thông báo nào.
  3. **Nguy cơ 3: Token không làm mới khi chuyển vai trò nhanh trên giao diện:**
     - Nút "Đổi vai trò 1 chạm" trên thanh Topbar (`AuthContext.tsx` dòng 76) ban đầu chỉ cập nhật state React của User mà không phải lúc nào cũng gửi lại request login để nhận Token JWT mới. Khi gửi request lên Backend, middleware `authenticate` giải mã token cũ và vẫn nhận diện người dùng là vai trò cũ, dẫn đến việc bị từ chối quyền (lỗi 403) hoặc lấy thông báo của người cũ.

---

## 2. BẢNG TỔNG HỢP CÁC ĐIỂM CHƯA HOÀN THIỆN VÀ LỆCH PHA GIỮA FRONTEND VÀ BACKEND

| STT | Vị trí phát hiện | Mã nguồn Frontend | Mã nguồn Backend | Bản chất kỹ thuật | Đánh giá rủi ro & Hướng khắc phục |
|:---:|---|---|---|---|---|
| 1 | Kiểm tra trùng lịch CSVC | Gọi `POST /api/bookings/check-conflict` (`api.ts` L97) | Cung cấp `GET /api/bookings/availability` (`booking.routes.ts` L53) | Lệch phương thức HTTP (POST vs GET) và đường dẫn URL. | Frontend hiện phải dùng hàm kiểm tra offline `checkFacilityAvailability` trong `EventContext.tsx`. Cần chuẩn hóa lại 1 API duy nhất. |
| 2 | Gợi ý địa điểm bằng AI | Gọi `POST /api/ai/suggest-resources` (`api.ts` L131) | Cung cấp `POST /api/ai/resource-suggestions` (`ai.routes.ts` L27) | Lệch tên endpoint URL (`suggest-resources` vs `resource-suggestions`). | Request gửi từ frontend sẽ nhận mã lỗi 404 Not Found nếu gọi hàm này từ `api.ts`. |
| 3 | Tự động sinh báo cáo AI | Gọi `POST /api/ai/draft-report` (`api.ts` L136) | Cung cấp `POST /api/ai/generate-report` (`ai.routes.ts` L42) | Lệch tên endpoint URL (`draft-report` vs `generate-report`). | Request gửi từ frontend sẽ nhận mã lỗi 404 Not Found. |
| 4 | Thống kê điểm nghẽn quy trình | Gọi `GET /api/analytics/workflow-bottlenecks` (`api.ts` L182) | Chưa có route này trong `analytics.routes.ts` | Endpoint được khai báo ở client nhưng chưa có controller ở server. | Frontend sẽ nhận lỗi 404 nếu gọi. Hiện tại trang Analytics đang hiển thị biểu đồ từ số liệu tổng hợp của `events`. |
| 5 | Quản lý người dùng thực tế | `UserManagementPage.tsx` đang render dữ liệu mẫu in-memory `mockUsers` | Backend đã có đủ bộ API CRUD hoàn chỉnh: `GET/POST/PUT /api/users` | Chưa nối dây (Wiring) giữa trang UI và API Backend. | Thao tác thêm/sửa nhân viên trên màn hình này chưa lưu bền vững xuống SQLite database. |
| 6 | Cơ chế đẩy thông báo tức thời | Frontend dùng Polling lặp lại mỗi 5 giây (`setInterval`) | Backend chưa cấu hình WebSocket (Socket.io) hoặc Server-Sent Events (SSE) | Kiến trúc truyền thông Polling tiêu tốn tài nguyên máy chủ khi số lượng client tăng cao. | Chấp nhận được trong quy mô đồ án môn học MIS3047; cần nâng cấp lên WebSocket trong giai đoạn thương mại hóa. |
| 7 | Tích hợp Trí tuệ Nhân tạo | Backend cấu hình biến `AI_PROVIDER = "rule-based"` nếu không có `AI_API_KEY` | Logic AI hiện đang hoạt động theo bộ luật heuristic nghiệp vụ nội bộ của DUE | Chưa gọi API ra mô hình ngôn ngữ lớn bên ngoài (Google Gemini API). | Cần giữ nguyên định danh là "Hệ chuyên gia dựa trên luật" (Rule-based Expert System) trong báo cáo khoa học để bảo đảm tính trung thực. |
