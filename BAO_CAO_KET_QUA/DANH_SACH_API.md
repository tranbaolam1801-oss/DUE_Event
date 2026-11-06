# DANH SÁCH KIỂM KÊ VÀ ĐẶC TẢ API THỰC TẾ HỆ THỐNG MY DUE (EVENTFLOW)

> **Dự án:** Hệ thống Quản lý Quy trình Tiếp nhận, Xét duyệt và Cấp phép Tổ chức Sự kiện Sinh viên (MY DUE / EventFlow)  
> **Đơn vị:** Trường Đại học Kinh tế – Đại học Đà Nẵng (DUE)  
> **Thời điểm kiểm kê:** Học kỳ 1, Năm học 2026–2027  
> **Phương pháp kiểm kê:** Phân tích tĩnh toàn bộ mã nguồn (`backend/src/routes`, `backend/src/services`, `backend/src/app.ts`, `frontend/src/services/api.ts`, `frontend/src/contexts/EventContext.tsx`) kết hợp đối chiếu schema Prisma ORM và kiểm thử endpoint thực tế.

---

## 1. TỔNG HỢP SỐ LIỆU KIỂM KÊ HTTP ENDPOINT

| Chỉ số kiểm kê | Số lượng | Giải thích kỹ thuật & Căn cứ mã nguồn |
|---|:---:|---|
| **Tổng số HTTP Endpoint được định tuyến (Reachable Routes)** | **71** | Tính theo số đường dẫn URL mà Express tiếp nhận yêu cầu. Trong đó `bookingRoutes` được gắn vào 3 tiền tố (`/api/bookings`, `/api/facilities`, `/api/equipment`) tạo ra $8 \times 3 = 24$ endpoint có thể truy cập, cộng với các route của 8 module còn lại và route gốc. |
| **Số khai báo hàm xử lý Route riêng biệt (Distinct Route Handlers)** | **55** | Số hàm route handler độc lập được lập trình trong toàn bộ thư mục `backend/src/routes/*.ts` và `backend/src/app.ts`. |
| **Số API trả dữ liệu JSON** | **52 (gốc) / 68 (reachable)** | Có 3 endpoint không trả JSON: (1) `GET /uploads/*` phục vụ file tĩnh, (2) `GET /api/events/:id/attachments/:attachmentId/download` stream nhị phân tải tệp (`res.download`), (3) `GET /api/analytics/export` trả định dạng `text/csv`. Toàn bộ các endpoint còn lại đều trả chuẩn JSON `{ success, data, ... }`. |
| **Số API đã triển khai xử lý thực tế (Concrete Implementation)** | **55 (100%)** | 100% các route handler đều có logic nghiệp vụ đầy đủ kết nối dịch vụ backend (`services/*.ts`) và cơ sở dữ liệu Prisma Client. Không có endpoint nào là stub rỗng (`res.status(501)` hoặc mock TODO). |
| **Số API được Frontend gọi thực tế** | **36** | 36 API được kết nối và gọi thường xuyên từ React Frontend (`EventContext.tsx`, `AuthContext.tsx`, `EventDetailPage.tsx`, `AIReviewPage.tsx`, `api.ts`). |
| **Số API Frontend gọi bị lệch hoặc chưa có ở Backend** | **5** | 5 lời gọi hàm trong `frontend/src/services/api.ts` bị lệch tên endpoint hoặc backend chưa hỗ trợ: `POST /bookings/check-conflict`, `POST /ai/analyze-event`, `POST /ai/suggest-resources`, `POST /ai/draft-report`, `GET /analytics/workflow-bottlenecks`. |
| **Số API Backend đã triển khai nhưng Frontend chưa dùng** | **19** | Bao gồm: `POST /api/auth/logout` (frontend xóa token client-side), `GET /api/auth/permissions`, `GET /api/bookings` (toàn bộ booking), `GET /api/bookings/availability` (frontend kiểm tra lịch local), `PUT /api/settlements/:id`, `PUT /api/settlements/documents/:docId/verify`, `GET /api/notifications/unread-count`, 4 API analytics chuyên sâu (`/approvals`, `/processing-times`, `/budget`, `/resources`), 1 API xuất CSV (`/export`), 2 API AI chuyên biệt (`/resource-suggestions`, `/generate-report`), và 3 API quản lý người dùng (`/api/users`). |

---

## 2. BẢNG THỐNG KÊ CHI TIẾT TỪNG API THEO NHÓM NGHIỆP VỤ

### Nhóm 1: Xác thực & Phân quyền (Authentication & Authorization)
*Tiền tố mount:* `/api/auth` (File nguồn: `backend/src/routes/auth.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 1 | `POST` | `/api/auth/login` | Đăng nhập tài khoản, cấp JWT token | Public | `login()` trong `auth.service.ts` | `User` | `api.login` (`LoginPage.tsx`, `AuthContext.tsx`) | Đã triển khai và hoạt động |
| 2 | `GET` | `/api/auth/me` | Lấy thông tin tài khoản hiện tại qua Bearer Token | Đăng nhập (All Roles) | `getUserById()` trong `auth.service.ts` | `User` | `api.getMe` (`AuthContext.tsx`) | Đã triển khai và hoạt động |
| 3 | `GET` | `/api/auth/permissions` | Lấy danh sách ma trận quyền hạn theo vai trò | Đăng nhập (All Roles) | `getPermissionsForRole()` trong `permissions.ts` | Không (In-memory Matrix) | Chưa gọi (Frontend dùng bảng tĩnh) | Đã triển khai ở Backend |
| 4 | `POST` | `/api/auth/logout` | Đăng xuất người dùng | Public / All Roles | Inline Handler | Không | Chưa gọi (Frontend xóa `localStorage`) | Đã triển khai ở Backend |

---

### Nhóm 2: Quản lý Vòng đời & Xét duyệt Hồ sơ (Event Lifecycle & Workflow Engine)
*Tiền tố mount:* `/api/events` (File nguồn: `backend/src/routes/event.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 5 | `GET` | `/api/events` | Lấy danh sách hồ sơ (hỗ trợ search, filter status, phân trang) | Đăng nhập (All Roles) | `getEvents()` trong `event.service.ts` | `Event`, `BudgetItem`, `WorkflowHistory` | `api.getEvents` (`EventContext.tsx` polling 5s) | Đã triển khai và hoạt động |
| 6 | `POST` | `/api/events` | Khởi tạo hồ sơ sự kiện mới (kèm dự trù, lịch trình, đặt phòng) | BTC, ADMIN | `createEvent()` trong `event.service.ts` | `Event`, `BudgetItem`, `EventScheduleItem`, `ResourceBooking` | `api.createEvent` (`EventCreatePage.tsx`) | Đã triển khai và hoạt động |
| 7 | `POST` | `/api/events/import-legacy` | Đồng bộ dữ liệu cũ an toàn từ LocalStorage vào CSDL dùng chung | BTC, ADMIN | Inline Handler (`event.routes.ts`) | `Event`, `SystemSetting` | `request('/events/import-legacy')` (`EventContext.tsx`) | Đã triển khai và hoạt động |
| 8 | `DELETE`| `/api/events/:id` | Xóa mềm hồ sơ ở trạng thái nháp (`DRAFT`) | BTC (chủ sở hữu), ADMIN | Inline Handler (`event.routes.ts`) | `Event`, `ResourceBooking` | `deleteEvent` (`EventContext.tsx`) | Đã triển khai và hoạt động |
| 9 | `PUT` | `/api/events/:id/report` | Lưu/cập nhật bản thảo báo cáo tổng kết sự kiện | BTC, ADMIN | Inline Handler (`event.routes.ts`) | `EventReport` | `saveReport` (`EventContext.tsx`, `ReportPage.tsx`) | Đã triển khai và hoạt động |
| 10 | `POST` | `/api/events/:id/handover` | Lập biên bản bàn giao CSVC trước sự kiện hoặc sau sự kiện | CSVC, ADMIN | Inline Handler (`event.routes.ts`) | `HandoverRecord`, `Event`, `WorkflowHistory` | `addHandoverRecord` (`HandoverPage.tsx`) | Đã triển khai và hoạt động |
| 11 | `GET` | `/api/events/:id` | Xem chi tiết toàn diện 1 hồ sơ (9 tab nghiệp vụ) | Đăng nhập (All Roles) | `getEventById()` trong `event.service.ts` | `Event` + 12 bảng liên kết | `api.getEventById` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 12 | `PUT` | `/api/events/:id` | Cập nhật thông tin hồ sơ (kiểm soát phiên bản chống ghi đè) | BTC, ADMIN | `updateEvent()` trong `event.service.ts` | `Event`, `BudgetItem`, `EventScheduleItem`, `EventVersion` | `api.updateEvent` (`EventEditPage.tsx`) | Đã triển khai và hoạt động |
| 13 | `POST` | `/api/events/:id/submit` | Nộp hồ sơ chính thức lên BCN Khoa xét duyệt | BTC | `submitEvent()` trong `event.service.ts` | `Event`, `WorkflowHistory`, `Notification` | `api.submitEvent` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 14 | `POST` | `/api/events/:id/review` | Phê duyệt/Yêu cầu sửa/Từ chối theo State Machine | BCN_KHOA, DOAN_TRUONG, CSVC, KHTC, ADMIN | `transitionState()` trong `workflow.service.ts` | `Event`, `ApprovalDecision`, `WorkflowHistory`, `Notification` | `api.reviewEvent` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 15 | `GET` | `/api/events/:id/available-actions` | Lấy danh sách nút hành động khả dụng của vai trò hiện tại | Đăng nhập (All Roles) | `getAvailableActions()` trong `workflow.service.ts` | `Event` (Status) | `api.getAvailableActions` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 16 | `GET` | `/api/events/:id/history` | Xem toàn bộ lịch sử audit log và vết chuyển trạng thái | Đăng nhập (All Roles) | `getEventHistory()` trong `event.service.ts` | `WorkflowHistory` | `api.getEventHistory` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 17 | `POST` | `/api/events/:id/attachments` | Tải lên tài liệu đính kèm (Multipart FormData) | Đăng nhập (All Roles) | Multer Storage + Prisma | `Attachment` | `api.uploadAttachment` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 18 | `GET` | `/api/events/:id/attachments/:attachmentId/download` | Tải về tệp đính kèm (Binary Stream) | Public / All Roles | `res.download()` | `Attachment` | Link `<a>` trực tiếp (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |

---

### Nhóm 3: Đặt chỗ & Quản lý Cơ sở vật chất (Resource Booking & Facility Conflict)
*Tiền tố mount:* `/api/bookings` (Được mount đồng thời tại `/api/facilities` và `/api/equipment`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 19 | `GET` | `/api/bookings/facilities` | Lấy danh sách hội trường, phòng chức năng khả dụng | Public / All Roles | Prisma `facility.findMany` | `Facility` | `request('/bookings/facilities')` (`EventContext.tsx`) | Đã triển khai và hoạt động |
| 20 | `GET` | `/api/bookings/equipment` | Lấy danh mục thiết bị âm thanh, ánh sáng, máy chiếu | Public / All Roles | Prisma `equipment.findMany` | `Equipment` | `request('/bookings/equipment')` (`EventContext.tsx`) | Đã triển khai và hoạt động |
| 21 | `GET` | `/api/bookings` | Lấy danh sách toàn bộ phiếu mượn tài sản | Đăng nhập (All Roles) | `getAllBookings()` trong `booking.service.ts` | `ResourceBooking` | Chưa gọi trực tiếp (xem qua Event) | Đã triển khai ở Backend |
| 22 | `GET` | `/api/bookings/availability` | Kiểm tra xung đột lịch hội trường theo thời gian thực | Đăng nhập (All Roles) | `checkAvailability()` trong `booking.service.ts` | `ResourceBooking` | Frontend dùng hàm local `checkFacilityAvailability` | Đã triển khai ở Backend (Lệch giao tiếp) |
| 23 | `POST` | `/api/bookings` | Tạo phiếu giữ chỗ hội trường và mượn thiết bị | Đăng nhập (All Roles) | `createBooking()` trong `booking.service.ts` | `ResourceBooking`, `ResourceBookingItem` | `api.createBooking` (`EventContext.tsx`) | Đã triển khai và hoạt động |
| 24 | `PUT` | `/api/bookings/:id/confirm` | Cán bộ CSVC phê duyệt xác nhận cấp phòng | CSVC, ADMIN | `confirmBooking()` trong `booking.service.ts` | `ResourceBooking`, `Event` | `api.confirmBooking` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 25 | `PUT` | `/api/bookings/:id/reject` | Cán bộ CSVC từ chối đặt chỗ do trùng lịch/bảo trì | CSVC, ADMIN | `rejectBooking()` trong `booking.service.ts` | `ResourceBooking`, `Event` | `api.rejectBooking` (`EventDetailPage.tsx`) | Đã triển khai và hoạt động |
| 26 | `GET` | `/api/bookings/facilities/:id/calendar` | Lấy dữ liệu lịch đặt phòng hiển thị lên Calendar | Public / All Roles | `getBookingsForFacility()` (`booking.service.ts`) | `ResourceBooking` | `api.getFacilityCalendar` (`ResourceCalendarPage.tsx`) | Đã triển khai và hoạt động |

---

### Nhóm 4: Bàn giao, Nghiệm thu & Biên bản Sự cố (Handover, Inspection & Incident)
*Tiền tố mount:* `/api/handover` (File nguồn: `backend/src/routes/handover.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 27 | `POST` | `/api/handover` | Lập biên bản bàn giao CSVC trước khi diễn ra sự kiện | Đăng nhập (CSVC, BTC, ADMIN) | `createHandoverRecord()` (`handover.service.ts`) | `HandoverRecord`, `Event` | `api.createHandover` (`HandoverPage.tsx`) | Đã triển khai và hoạt động |
| 28 | `POST` | `/api/handover/inspection` | Lập biên bản kiểm tra nghiệm thu tài sản sau sự kiện | Đăng nhập (CSVC, ADMIN) | `createReturnInspection()` (`handover.service.ts`) | `ReturnInspection`, `Event` | `api.createInspection` (`HandoverPage.tsx`) | Đã triển khai và hoạt động |
| 29 | `POST` | `/api/handover/incident` | Lập biên bản ghi nhận sự cố hư hỏng/mất mát thiết bị | Đăng nhập (CSVC, BTC, ADMIN) | `createIncidentReport()` (`handover.service.ts`) | `IncidentReport`, `Event` | `api.createIncident` (`HandoverPage.tsx`) | Đã triển khai và hoạt động |
| 30 | `GET` | `/api/handover/:eventId` | Lấy toàn bộ biên bản bàn giao, nghiệm thu, sự cố của sự kiện | Đăng nhập (All Roles) | Prisma multi-query | `HandoverRecord`, `ReturnInspection`, `IncidentReport` | `api.getHandoverRecords` (`HandoverPage.tsx`) | Đã triển khai và hoạt động |

---

### Nhóm 5: Quyết toán Kinh phí & Chứng từ Tài chính (Settlement & Documents)
*Tiền tố mount:* `/api/settlements` (File nguồn: `backend/src/routes/settlement.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 31 | `GET` | `/api/settlements/:eventId` | Lấy chi tiết hồ sơ quyết toán tài chính và chứng từ | Đăng nhập (All Roles) | Prisma `settlement.findFirst` | `Settlement`, `SettlementItem`, `FinancialDocument` | `api.getSettlement` (`SettlementPage.tsx`) | Đã triển khai và hoạt động |
| 32 | `POST` | `/api/settlements` | Khởi tạo bảng kê quyết toán kinh phí thực tế | Đăng nhập (BTC, ADMIN) | `createSettlement()` (`settlement.service.ts`) | `Settlement`, `SettlementItem` | `api.createSettlement` (`SettlementPage.tsx`) | Đã triển khai và hoạt động |
| 33 | `PUT` | `/api/settlements/:id` | Chỉnh sửa số liệu bảng kê quyết toán | Đăng nhập (BTC, ADMIN) | `updateSettlement()` (`settlement.service.ts`) | `Settlement`, `SettlementItem` | Chưa gọi trực tiếp (gọi qua saveSettlement) | Đã triển khai ở Backend |
| 34 | `POST` | `/api/settlements/:id/submit` | Nộp hồ sơ quyết toán lên Phòng KHTC kiểm toán | Đăng nhập (BTC, ADMIN) | `submitSettlement()` (`settlement.service.ts`) | `Settlement`, `Event`, `WorkflowHistory` | `api.submitSettlement` (`SettlementPage.tsx`) | Đã triển khai và hoạt động |
| 35 | `POST` | `/api/settlements/:id/review` | KHTC thẩm định hồ sơ quyết toán (Duyệt/Sửa/Từ chối) | KHTC, ADMIN | `reviewSettlement()` (`settlement.service.ts`) | `Settlement`, `Event`, `WorkflowHistory` | `api.reviewSettlement` (`SettlementPage.tsx`) | Đã triển khai và hoạt động |
| 36 | `POST` | `/api/settlements/:id/documents` | Thêm hóa đơn tài chính VAT / phiếu chi vào hồ sơ | Đăng nhập (BTC, ADMIN) | `addFinancialDocument()` (`settlement.service.ts`) | `FinancialDocument` | `request('/settlements/:id/documents')` (`SettlementPage.tsx`) | Đã triển khai và hoạt động |
| 37 | `PUT` | `/api/settlements/documents/:docId/verify` | Cán bộ KHTC xác thực hóa đơn hợp lệ | KHTC, ADMIN | `verifyFinancialDocument()` (`settlement.service.ts`) | `FinancialDocument` | Chưa có nút thao tác riêng trên UI | Đã triển khai ở Backend |

---

### Nhóm 6: Hệ thống Thông báo Nghiệp vụ (Notifications)
*Tiền tố mount:* `/api/notifications` (File nguồn: `backend/src/routes/notification.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 38 | `GET` | `/api/notifications` | Lấy danh sách thông báo theo tài khoản hiện tại | Đăng nhập (All Roles) | `getNotifications()` (`notification.service.ts`) | `Notification`, `Event` | `request('/notifications')` (`EventContext.tsx` polling) | Đã triển khai và hoạt động |
| 39 | `PUT` | `/api/notifications/:id/read` | Đánh dấu một thông báo là đã đọc | Đăng nhập (All Roles) | `markAsRead()` (`notification.service.ts`) | `Notification` | `request('/notifications/:id/read')` (`NotificationPage.tsx`) | Đã triển khai và hoạt động |
| 40 | `PUT` | `/api/notifications/read-all` | Đánh dấu tất cả thông báo của người dùng là đã đọc | Đăng nhập (All Roles) | `markAllAsRead()` (`notification.service.ts`) | `Notification` | `request('/notifications/read-all')` (`NotificationPage.tsx`) | Đã triển khai và hoạt động |
| 41 | `GET` | `/api/notifications/unread-count`| Lấy số lượng thông báo chưa đọc của người dùng | Đăng nhập (All Roles) | `getUnreadCount()` (`notification.service.ts`) | `Notification` | Frontend tự filter `isRead === false` | Đã triển khai ở Backend |

---

### Nhóm 7: Trợ lý Trí tuệ Nhân tạo Hỗ trợ Quy trình (AI Assistant)
*Tiền tố mount:* `/api/ai` (File nguồn: `backend/src/routes/ai.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 42 | `POST` | `/api/ai/review` | Chấm điểm hồ sơ (0-100), phát hiện rủi ro an toàn, dự toán | Đăng nhập (All Roles) | `reviewApplication()` (`ai.service.ts`) | `Event`, `BudgetItem` | `api.aiReview` (`AIReviewPage.tsx`) | Đã triển khai và hoạt động |
| 43 | `POST` | `/api/ai/resource-suggestions` | Gợi ý địa điểm hội trường và gói thiết bị tối ưu | Đăng nhập (All Roles) | `suggestResources()` (`ai.service.ts`) | `Facility`, `Equipment` | Frontend gọi nhầm `suggest-resources` | Đã triển khai ở Backend (Lệch route) |
| 44 | `POST` | `/api/ai/generate-report` | Tự động tạo bản thảo dự thảo báo cáo tổng kết sự kiện | Đăng nhập (All Roles) | `generateReportDraft()` (`ai.service.ts`) | `Event`, `BudgetItem` | Frontend gọi nhầm `draft-report` | Đã triển khai ở Backend (Lệch route) |

---

### Nhóm 8: Thống kê & Phân tích Tiến độ (Analytics & Dashboard)
*Tiền tố mount:* `/api/analytics` (File nguồn: `backend/src/routes/analytics.routes.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 45 | `GET` | `/api/analytics/dashboard` | Thống kê số lượng hồ sơ theo từng vai trò (chờ duyệt, nháp...) | Đăng nhập (All Roles) | `getDashboardStats()` (`analytics.service.ts`) | `Event`, `WorkflowHistory` | `api.getDashboardStats` (`AnalyticsPage.tsx`) | Đã triển khai và hoạt động |
| 46 | `GET` | `/api/analytics/approvals` | Thống kê tỷ lệ phê duyệt, từ chối, yêu cầu sửa đổi | Đăng nhập (All Roles) | `getApprovalRates()` (`analytics.service.ts`) | `ApprovalDecision` | Chưa gọi (trang hiển thị số liệu tổng hợp) | Đã triển khai ở Backend |
| 47 | `GET` | `/api/analytics/processing-times`| Tính thời gian xử lý chu trình trung bình từng khâu | Đăng nhập (All Roles) | `getProcessingTimes()` (`analytics.service.ts`) | `Event`, `WorkflowHistory` | Chưa gọi | Đã triển khai ở Backend |
| 48 | `GET` | `/api/analytics/budget` | Phân tích cơ cấu và tổng mức giải ngân kinh phí sự kiện | Đăng nhập (All Roles) | `getBudgetAnalysis()` (`analytics.service.ts`) | `BudgetItem`, `Settlement` | Chưa gọi | Đã triển khai ở Backend |
| 49 | `GET` | `/api/analytics/resources` | Thống kê tần suất khai thác phòng và thiết bị của trường | Đăng nhập (All Roles) | `getResourceUtilization()` (`analytics.service.ts`) | `ResourceBooking` | Chưa gọi | Đã triển khai ở Backend |
| 50 | `GET` | `/api/analytics/export` | Xuất toàn bộ danh sách hồ sơ sự kiện ra file CSV tải về | Đăng nhập (All Roles) | Inline CSV Generator | `Event`, `BudgetItem` | Chưa gắn nút tải file trực tiếp trên UI | Đã triển khai ở Backend (Trả file CSV) |

---

### Nhóm 9: Quản trị Người dùng & Hệ thống (User Management & Core)
*Tiền tố mount:* `/api/users` và `/` (File nguồn: `backend/src/routes/user.routes.ts` & `app.ts`)

| STT | HTTP Method | Endpoint | Mục đích nghiệp vụ | Quyền truy cập (RBAC) | Handler & Service | Model liên quan | Frontend sử dụng | Tình trạng triển khai |
|:---:|:---:|---|---|---|---|---|---|:---:|
| 51 | `GET` | `/api/users` | Lấy danh sách toàn bộ người dùng trong hệ thống | ADMIN | Prisma `user.findMany` | `User` | `UserManagementPage.tsx` (dùng mock UI) | Đã triển khai ở Backend |
| 52 | `POST` | `/api/users` | Tạo mới tài khoản người dùng và mã hóa mật khẩu Bcrypt | ADMIN | Prisma `user.create` + bcrypt | `User` | Chưa kết nối UI Form | Đã triển khai ở Backend |
| 53 | `PUT` | `/api/users/:id` | Cập nhật thông tin, kích hoạt/vô hiệu hóa, đổi mật khẩu | ADMIN | Prisma `user.update` | `User` | Chưa kết nối UI Form | Đã triển khai ở Backend |
| 54 | `GET` | `/api/health` | Kiểm tra trạng thái hoạt động (Healthcheck) của API Server | Public | Inline Handler (`app.ts`) | Không | Hệ thống giám sát / Probe | Đã triển khai và hoạt động |
| 55 | `GET` | `/uploads/*` | Phục vụ tệp đính kèm tĩnh (Static File Streaming) | Public | `express.static` | File System | Trình duyệt xem ảnh/file trực tiếp | Đã triển khai và hoạt động |

---

## 3. ĐẶC TẢ CHI TIẾT CÁC ENDPOINT QUAN TRỌNG NHẤT TRONG QUY TRÌNH DUYỆT

### Đặc tả API 1: Nộp hồ sơ xét duyệt chính thức
- **Tên API:** Nộp hồ sơ xét duyệt lên BCN Khoa (`submitEvent`)
- **Nhóm nghiệp vụ:** Event Lifecycle & Workflow Engine
- **Endpoint:** `/api/events/:id/submit`
- **HTTP Method:** `POST`
- **Mục đích:** Chuyển trạng thái hồ sơ từ Bản nháp (`DRAFT`) hoặc Yêu cầu sửa đổi sang Đang xét duyệt vòng Khoa (`FACULTY_REVIEW`), đồng thời gửi thông báo đến các cán bộ thuộc Ban Chủ nhiệm Khoa.
- **Vai trò được phép sử dụng:** `BTC`, `ADMIN`
- **Authentication/Authorization:** Bắt buộc Bearer Token (JWT).
- **Path Parameters:** `id: string` (Mã định danh duy nhất UUID của hồ sơ sự kiện).
- **Request Body:** Không yêu cầu body.
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "e1a2b3c4-...",
    "eventCode": "SK-2026-001",
    "title": "Hội thảo Chuyển đổi số trong Quản trị Kinh doanh 2026",
    "status": "FACULTY_REVIEW",
    "currentVersion": 2
  },
  "message": "Đã nộp hồ sơ thành công"
}
```
- **HTTP Status Codes:**
  - `200 OK`: Nộp hồ sơ thành công, trạng thái đã chuyển.
  - `400 Bad Request`: Hồ sơ thiếu các trường bắt buộc (tên sự kiện, đơn vị tổ chức, thời gian bắt đầu, kết thúc, số lượng tham dự, mục tiêu) hoặc hồ sơ không ở trạng thái được phép nộp.
  - `401 Unauthorized`: Chưa đăng nhập hoặc token hết hạn.
  - `404 Not Found`: Không tìm thấy hồ sơ hoặc hồ sơ đã bị xóa mềm.
- **Validation Rules:**
  - Kiểm tra trạng thái hồ sơ hiện tại phải thuộc: `DRAFT`, `FACULTY_REVISION_REQUESTED`, `UNIVERSITY_REVISION_REQUESTED`, `BUDGET_REVISION_REQUESTED`.
  - Kiểm tra đầy đủ: `title`, `organizingUnit`, `startDate`, `endDate`, `expectedAttendees`, `objectives`.
- **Business Logic & Transaction:**
  1. Sử dụng `prisma.$transaction`.
  2. Cập nhật `status = 'FACULTY_REVIEW'` và tăng `currentVersion`.
  3. Ghi vết `WorkflowHistory` với action `SUBMIT`.
  4. Truy vấn danh sách cán bộ có `role = 'BCN_KHOA'` và tạo thông báo `ACTION_REQUIRED` gửi vào hòm thư nội bộ.
- **Database Models liên quan:** `Event`, `WorkflowHistory`, `Notification`, `User`.
- **File mã nguồn:** `backend/src/routes/event.routes.ts` (L193–L201), `backend/src/services/event.service.ts` (L353–L430).

---

### Đặc tả API 2: Chuyển trạng thái và thẩm định đa cấp
- **Tên API:** Thẩm định chuyển trạng thái hồ sơ (`reviewEvent`)
- **Nhóm nghiệp vụ:** Event Lifecycle & Workflow Engine
- **Endpoint:** `/api/events/:id/review`
- **HTTP Method:** `POST`
- **Mục đích:** Thực hiện chuyển dịch trạng thái nghiệp vụ theo State Machine dựa trên thẩm quyền của vai trò (BCN Khoa, Đoàn Trường, CSVC, KHTC).
- **Vai trò được phép sử dụng:** `BCN_KHOA`, `DOAN_TRUONG`, `CSVC`, `KHTC`, `ADMIN`
- **Authentication/Authorization:** Bearer Token. Kiểm tra vai trò nghiêm ngặt trong State Machine.
- **Path Parameters:** `id: string` (UUID của sự kiện).
- **Request Body:**
```json
{
  "action": "APPROVE",
  "comments": "Hồ sơ đạt yêu cầu, kế hoạch chi tiết, đồng ý phê duyệt chuyển Đoàn Trường.",
  "reason": ""
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "e1a2b3c4-...",
      "status": "UNIVERSITY_REVIEW",
      "currentVersion": 3
    },
    "decision": {
      "id": "dec-...",
      "decision": "APPROVED",
      "stage": "FACULTY",
      "comments": "Hồ sơ đạt yêu cầu..."
    }
  },
  "message": "Thao tác "APPROVE" thành công"
}
```
- **Business Logic & State Machine:**
  - Tra cứu cấu hình State Machine `transitions[currentStatus][action]`.
  - Kiểm tra quyền: `transition.roles.includes(userRole)`. Nếu không thỏa mãn -> trả về lỗi `400: "Bạn không có quyền thực hiện hành động này"`.
  - Tạo bản ghi `ApprovalDecision`.
  - Cập nhật `Event.status = transition.to`.
  - Tạo bản ghi `WorkflowHistory`.
  - Tự động gọi `notifyEventStatusChange` để gửi thông báo cho BTC sự kiện và vai trò ở chặng kế tiếp.
- **Database Models liên quan:** `Event`, `ApprovalDecision`, `WorkflowHistory`, `Notification`.
- **File mã nguồn:** `backend/src/routes/event.routes.ts` (L204–L223), `backend/src/services/workflow.service.ts` (L108–L230).

---

### Đặc tả API 3: Rà soát và chấm điểm hồ sơ bằng Trí tuệ Nhân tạo
- **Tên API:** Rà soát và đánh giá hồ sơ tự động (`aiReview`)
- **Nhóm nghiệp vụ:** AI Assistant
- **Endpoint:** `/api/ai/review`
- **HTTP Method:** `POST`
- **Mục đích:** Phân tích toàn diện hồ sơ (mục tiêu, kế hoạch an toàn, dự toán ngân sách, xung đột phòng) và đưa ra điểm chất lượng (0–100), danh sách cảnh báo thiếu sót và khuyến nghị chỉnh sửa.
- **Vai trò được phép sử dụng:** All Authenticated Users
- **Request Body:**
```json
{
  "eventId": "e1a2b3c4-..."
}
```
- **Response Body (200 OK):**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "grade": "B",
    "recommendations": [
      {
        "type": "WARNING",
        "category": "SAFETY",
        "message": "Sự kiện có trên 300 người tham dự nhưng phương án an toàn chưa nêu rõ vị trí thoát hiểm và nhân sự y tế trực ban."
      },
      {
        "type": "INFO",
        "category": "BUDGET",
        "message": "Chi phí in ấn backdrop và banner đang chiếm 42% tổng ngân sách, vượt mức thông lệ 30% tại DUE."
      }
    ],
    "strengths": [
      "Kế hoạch chi tiết theo từng khung giờ rõ ràng",
      "Đã đăng ký địa điểm Hội trường A có sức chứa phù hợp (500 chỗ)"
    ]
  }
}
```
- **Business Logic:**
  - Đọc thông tin sự kiện cùng bảng dự trù (`budgetItem`) và lịch trình (`eventScheduleItem`).
  - Đánh giá heuristic theo bộ luật nghiệp vụ DUE: độ dài mô tả, kế hoạch rủi ro an toàn theo quy mô số người, tính hợp lý của tỷ trọng ngân sách.
  - Tổng hợp điểm số và trả kết quả cho giao diện `AIReviewPage.tsx`.
- **Database Models liên quan:** `Event`, `BudgetItem`, `EventScheduleItem`.
- **File mã nguồn:** `backend/src/routes/ai.routes.ts` (L12–L24), `backend/src/services/ai.service.ts` (L43–L170).
