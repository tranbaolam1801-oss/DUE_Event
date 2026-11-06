# BẢNG ÁNH XẠ BPMN TO-BE VÀO HỆ THỐNG PHẦN MỀM MY DUE (EVENTFLOW)

> **Mô hình quy trình chuẩn:** `ToBe_Nhom3.bpmn` (Định dạng BPMN 2.0 XML)  
> **Tổng số phần tử:** 45 phần tử bao gồm 5 Lanes (Vai trò), 23 User Tasks, 10 Service Tasks, 6 Cổng Exclusive Gateways (XOR) và 4 Sự kiện (Events).  
> **Nguyên tắc phân định:**  
> - `User Task` ánh xạ trực tiếp đến màn hình thao tác của người dùng trên Web Frontend.  
> - `Service Task` ánh xạ đến API Endpoint hoặc hàm xử lý tự động trong Backend Services.  
> - `Exclusive Gateway (XOR)` ánh xạ đến các nút quyết định rẽ nhánh và điều kiện logic trong State Machine.  
> - `Lane` ánh xạ đến ma trận phân quyền dựa trên vai trò (Role-Based Access Control - RBAC).

---

## 1. BẢNG ÁNH XẠ CHI TIẾT TỪNG PHẦN TỬ BPMN TO-BE VÀO HỆ THỐNG

| STT | BPMN Element ID | Tên hoạt động / Phần tử BPMN | Loại phần tử | Vai trò thực hiện (Lane) | Màn hình liên quan (UI Screen) | API / Hàm Backend xử lý | Điều kiện chuyển trạng thái | File mã nguồn minh chứng | Tình trạng triển khai |
|:---:|:---|---|---|---|---|---|---|---|:---:|
| 1 | `Start` | Khởi tạo yêu cầu tổ chức | `startEvent` | BCH LIÊN CHI ĐOÀN | Dashboard (`/dashboard`), Header | Client-side Router | Bấm nút "Tạo sự kiện mới" | `DashboardPage.tsx` | Đã triển khai và hoạt động |
| 2 | `Prepare` | Lập kế hoạch, dự trù và hồ sơ | `userTask` | BCH LIÊN CHI ĐOÀN | E-Form 5 bước (`/events/create`) | `POST /api/events` | Nhập đủ các trường thông tin cơ bản | `EventCreatePage.tsx`, `event.service.ts` | Đã triển khai và hoạt động |
| 3 | `CheckFields` | Kiểm tra trường bắt buộc | `serviceTask` | BCH LIÊN CHI ĐOÀN (Hệ thống) | Inline Validation (`/events/create`) | Zod Schema Validation (`createEventSchema`) | Hợp lệ tất cả quy tắc schema | `event.routes.ts`, `validate.ts` | Đã triển khai và hoạt động |
| 4 | `AIReview` | AI rà soát nội dung và gợi ý sửa | `serviceTask` | BCH LIÊN CHI ĐOÀN (AI Engine) | Thẩm định AI (`/ai-review`) | `POST /api/ai/review` | Phân tích tự động điểm số & rủi ro | `AIReviewPage.tsx`, `ai.service.ts` | Đã triển khai và hoạt động |
| 5 | `Gateway_0q4ts0h`| Điểm hội tụ hoàn thiện hồ sơ | `exclusiveGateway` | BCH LIÊN CHI ĐOÀN | Chi tiết hồ sơ (`/events/:id`) | Frontend State Machine | Hội tụ sau AI Review hoặc sau khi sửa | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 6 | `BCHConfirm` | BCH kiểm chứng, hoàn thiện hồ sơ | `userTask` | BCH LIÊN CHI ĐOÀN | Chi tiết hồ sơ (`/events/:id`) | `GET /api/events/:id` | BCH rà soát và xác nhận nộp | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 7 | `SubmitKhoa` | Chuyển hồ sơ đến BCN Khoa | `serviceTask` | BCH LIÊN CHI ĐOÀN (Tự động) | Hộp thoại nộp hồ sơ | `POST /api/events/:id/submit` | Trạng thái chuyển sang `FACULTY_REVIEW` | `event.service.ts` (L353) | Đã triển khai và hoạt động |
| 8 | `ReviewKhoa` | Thẩm định kế hoạch / nội dung | `userTask` | BAN CHỦ NHIỆM KHOA | Hàng đợi duyệt (`/approval-queue`) | `GET /api/events` (filter `FACULTY_REVIEW`) | BCN Khoa mở hồ sơ và xem xét | `ApprovalQueuePage.tsx` | Đã triển khai và hoạt động |
| 9 | `GKhoa` | Kết quả thẩm định Khoa? | `exclusiveGateway` | BAN CHỦ NHIỆM KHOA | Modal phê duyệt | `POST /api/events/:id/review` | 3 nhánh: Duyệt (`Flow_010`), Sửa (`Flow_007`), Từ chối (`Flow_009`) | `workflow.service.ts` (L17) | Đã triển khai và hoạt động |
| 10 | `FixKhoa` | Tổng hợp góp ý và sửa hồ sơ | `userTask` | BCH LIÊN CHI ĐOÀN | Chỉnh sửa hồ sơ (`/events/:id/edit`) | `PUT /api/events/:id` | Trạng thái `FACULTY_REVISION_REQUESTED` | `EventEditPage.tsx` | Đã triển khai và hoạt động |
| 11 | `RejectKhoa` | Không chấp thuận (Khoa từ chối) | `endEvent` | BAN CHỦ NHIỆM KHOA | Trạng thái kết thúc | `POST /api/events/:id/review` (`action: REJECT`) | Trạng thái chuyển sang `FACULTY_REJECTED` | `workflow.service.ts` (L20) | Đã triển khai và hoạt động |
| 12 | `SignKhoa` | Khoa ký xác nhận | `userTask` | BAN CHỦ NHIỆM KHOA | Modal Ký duyệt điện tử | `POST /api/events/:id/review` (`action: APPROVE`) | Ghi nhận ý kiến phê duyệt của Khoa | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 13 | `ForwardDoan`| Chuyển hồ sơ đến Đoàn trường | `serviceTask` | BAN CHỦ NHIỆM KHOA (Tự động) | Inline State Machine | `transitionState()` trong `workflow.service.ts` | Trạng thái tự động chuyển sang `UNIVERSITY_REVIEW` | `workflow.service.ts` (L18) | Đã triển khai và hoạt động |
| 14 | `ReviewDoan` | Đoàn trường thẩm định hồ sơ | `userTask` | ĐOÀN TRƯỜNG | Hàng đợi duyệt Đoàn (`/approval-queue`)| `GET /api/events` (filter `UNIVERSITY_REVIEW`) | Chuyên viên Đoàn trường mở hồ sơ | `ApprovalQueuePage.tsx` | Đã triển khai và hoạt động |
| 15 | `GDoan` | Kết quả thẩm định Đoàn trường? | `exclusiveGateway` | ĐOÀN TRƯỜNG | Modal phê duyệt Đoàn | `POST /api/events/:id/review` | 3 nhánh: Duyệt (`Flow_014`), Sửa (`Flow_015`), Từ chối (`Flow_017`) | `workflow.service.ts` (L25) | Đã triển khai và hoạt động |
| 16 | `FixDoan` | Chỉnh sửa theo góp ý Đoàn trường | `userTask` | BCH LIÊN CHI ĐOÀN | Chỉnh sửa hồ sơ (`/events/:id/edit`) | `PUT /api/events/:id` | Trạng thái `UNIVERSITY_REVISION_REQUESTED` | `EventEditPage.tsx` | Đã triển khai và hoạt động |
| 17 | `RejectDoan` | Không chấp thuận (Đoàn từ chối) | `endEvent` | ĐOÀN TRƯỜNG | Trạng thái kết thúc | `POST /api/events/:id/review` (`action: REJECT`) | Trạng thái chuyển sang `UNIVERSITY_REJECTED`| `workflow.service.ts` (L28) | Đã triển khai và hoạt động |
| 18 | `ApproveDoan` | Ký duyệt, đóng dấu kế hoạch | `userTask` | ĐOÀN TRƯỜNG | Màn hình Cấp phép chính thức | `POST /api/events/:id/review` (`action: APPROVE`) | Trạng thái chuyển sang `PERMIT_ISSUED` | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 19 | `FacilityForm`| Tạo đơn mượn CSVC | `serviceTask` | BCH LIÊN CHI ĐOÀN (Tự động) | Tab CSVC (`/events/:id?tab=venue`) | `POST /api/bookings` | Tự động trích xuất thông tin sang booking | `booking.service.ts`, `EventContext.tsx` | Đã triển khai và hoạt động |
| 20 | `CheckSchedule`| Đối chiếu lịch / danh mục thiết bị | `serviceTask` | PHÒNG CƠ SỞ VẬT CHẤT (Tự động) | Lịch đặt phòng (`/calendar`) | `GET /api/bookings/facilities/:id/calendar` | Phát hiện xung đột khoảng thời gian | `booking.service.ts` (L22) | Đã triển khai và hoạt động |
| 21 | `AISuggest` | AI gợi ý bố trí phòng và thiết bị| `serviceTask` | PHÒNG CƠ SỞ VẬT CHẤT (AI Engine)| Hộp thoại gợi ý CSVC | `POST /api/ai/resource-suggestions` | Đề xuất phòng theo quy mô tham dự | `ai.service.ts` (L175) | Đã triển khai ở Backend |
| 22 | `FacilityUser`| CSVC xác minh và quyết định | `userTask` | PHÒNG CƠ SỞ VẬT CHẤT | Hàng đợi CSVC (`/approval-queue`) | `GET /api/events` (filter `FACILITY_REVIEW`) | Cán bộ CSVC kiểm tra hiện trạng | `ApprovalQueuePage.tsx` | Đã triển khai và hoạt động |
| 23 | `GFacility` | Đáp ứng cơ sở vật chất? | `exclusiveGateway` | PHÒNG CƠ SỞ VẬT CHẤT | Nút Duyệt / Báo trùng CSVC | `PUT /api/bookings/:id/confirm` hoặc `reject` | Có đáp ứng (`Flow_023`) / Chưa (`Flow_024`) | `booking.routes.ts` (L82, L93) | Đã triển khai và hoạt động |
| 24 | `AdjustFacility`| BCH điều chỉnh lịch / thiết bị | `userTask` | BCH LIÊN CHI ĐOÀN | Tab CSVC (`/events/:id?tab=venue`) | `PUT /api/events/:id` hoặc tạo booking mới | Trạng thái `FACILITY_CONFLICT` | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 25 | `ApproveFacility`| CSVC xác nhận đặt phòng, thiết bị | `userTask` | PHÒNG CƠ SỞ VẬT CHẤT | Phiếu cấp phòng điện tử | `PUT /api/bookings/:id/confirm` | Trạng thái chuyển sang `FACILITY_RESERVED` | `booking.service.ts` (L120) | Đã triển khai và hoạt động |
| 26 | `PrepareEvent`| BCH chuẩn bị và tổ chức sự kiện | `userTask` | BCH LIÊN CHI ĐOÀN | Tab Điều hành (`/events/:id?tab=overview`)| `POST /api/events/:id/review` (`START_EVENT`) | Trạng thái `EVENT_IN_PROGRESS` | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 27 | `ReturnFacility`| BCH hoàn trả cơ sở vật chất | `userTask` | BCH LIÊN CHI ĐOÀN | Màn hình Hoàn trả CSVC (`/handover`) | `POST /api/events/:id/review` (`END_EVENT`) | Trạng thái `FACILITY_RETURN_PENDING` | `HandoverPage.tsx` | Đã triển khai và hoạt động |
| 28 | `VerifyReturn`| CSVC kiểm tra tình trạng hoàn trả | `userTask` | PHÒNG CƠ SỞ VẬT CHẤT | Biên bản nghiệm thu (`/handover`) | `POST /api/events/:id/handover` (POST_EVENT) | Trạng thái chuyển sang `REPORT_PENDING` | `HandoverPage.tsx`, `event.routes.ts` | Đã triển khai và hoạt động |
| 29 | `GReport` | Yêu cầu báo cáo tổng kết? | `exclusiveGateway` | ĐOÀN TRƯỜNG | Logic nghiệp vụ | Frontend / Workflow Rule | Có yêu cầu (`Flow_031`) / Không (`Flow_030`) | `workflow.service.ts` | Đã triển khai bằng Rule |
| 30 | `AIReport` | AI tạo bản nháp báo cáo | `serviceTask` | BCH LIÊN CHI ĐOÀN (AI Engine) | Trang Báo cáo (`/events/:id/report`) | `POST /api/ai/generate-report` | Tự động tổng hợp số liệu tham dự | `ai.service.ts` (L235) | Đã triển khai ở Backend |
| 31 | `ReviewReport`| BCH kiểm tra và xác nhận báo cáo | `userTask` | BCH LIÊN CHI ĐOÀN | Trình soạn thảo báo cáo (`/report`) | `PUT /api/events/:id/report` | BCH chỉnh sửa và hoàn thiện nội dung | `ReportPage.tsx` | Đã triển khai và hoạt động |
| 32 | `AutoReport` | Gửi báo cáo đến Đoàn trường | `serviceTask` | BCH LIÊN CHI ĐOÀN (Tự động) | Nút Nộp báo cáo chính thức | `PUT /api/events/:id/report` (`status: SUBMITTED`)| Trạng thái chuyển sang `FINANCE_DOCUMENTS_PENDING` | `event.routes.ts` (L138) | Đã triển khai và hoạt động |
| 33 | `MergeReport`| Điểm hội tụ thanh quyết toán | `exclusiveGateway` | BCH LIÊN CHI ĐOÀN | Tab Quyết toán (`/settlement`) | Frontend Router | Hội tụ nhánh có báo cáo và không báo cáo | `SettlementPage.tsx` | Đã triển khai và hoạt động |
| 34 | `PayPackage` | BCH lập và rà soát chứng từ | `userTask` | BCH LIÊN CHI ĐOÀN | Bảng kê thanh toán (`/settlement`) | `POST /api/settlements/:id/documents` | Tải lên hóa đơn VAT, bảng kê chứng từ | `SettlementPage.tsx` | Đã triển khai và hoạt động |
| 35 | `AutoForwardPay`| Chuyển hồ sơ đến KHTC | `serviceTask` | BCH LIÊN CHI ĐOÀN (Tự động) | Nút Nộp quyết toán | `POST /api/settlements/:id/submit` | Trạng thái chuyển sang `FINANCE_REVIEW` | `settlement.service.ts` (L85) | Đã triển khai và hoạt động |
| 36 | `CheckPay` | KHTC kiểm tra chứng từ | `userTask` | PHÒNG KẾ HOẠCH TÀI CHÍNH | Hàng đợi KHTC (`/approval-queue`) | `GET /api/settlements/:eventId` | KHTC kiểm tra tính hợp lệ hóa đơn | `SettlementPage.tsx` | Đã triển khai và hoạt động |
| 37 | `GPay` | Hồ sơ chứng từ đầy đủ? | `exclusiveGateway` | PHÒNG KẾ HOẠCH TÀI CHÍNH | Modal thẩm định KHTC | `POST /api/settlements/:id/review` | Đủ (`Flow_039`) / Thiếu (`Flow_040`) | `settlement.service.ts` (L110)| Đã triển khai và hoạt động |
| 38 | `FixPay` | BCH bổ sung hồ sơ thanh toán | `userTask` | BCH LIÊN CHI ĐOÀN | Bổ sung hóa đơn (`/settlement`) | `POST /api/settlements/:id/documents` | Trạng thái `FINANCE_REVISION_REQUESTED` | `SettlementPage.tsx` | Đã triển khai và hoạt động |
| 39 | `SubmitApproval`| KHTC trình cấp có thẩm quyền duyệt| `userTask` | PHÒNG KẾ HOẠCH TÀI CHÍNH | Tờ trình phê duyệt chi | `POST /api/events/:id/review` (`APPROVE`) | Trạng thái `FINANCE_APPROVAL_PENDING` | `workflow.service.ts` (L98) | Đã triển khai và hoạt động |
| 40 | `ApprovePayment`| Phê duyệt thanh toán theo thẩm quyền| `userTask` | PHÒNG KHTC / CẤP THẨM QUYỀN | Màn hình Ký duyệt giải ngân | `POST /api/events/:id/review` (`SETTLE`) | Lãnh đạo ra quyết định chi ngân sách | `EventDetailPage.tsx` | Đã triển khai và hoạt động |
| 41 | `GApproval` | Thanh toán được phê duyệt? | `exclusiveGateway` | PHÒNG KHTC / CẤP THẨM QUYỀN | Nút Duyệt chi / Từ chối chi | `POST /api/events/:id/review` | Có duyệt (`Flow_046`) / Không duyệt (`Flow_044`)| `workflow.service.ts` (L98) | Đã triển khai và hoạt động |
| 42 | `RefusePay` | Thông báo không thanh toán | `userTask` | PHÒNG KẾ HOẠCH TÀI CHÍNH | Thông báo từ chối thanh toán | `POST /api/events/:id/review` (`REJECT_PAYMENT`) | Trạng thái chuyển sang `PAYMENT_REJECTED` | `workflow.service.ts` (L99) | Đã triển khai và hoạt động |
| 43 | `PerformPay` | KHTC thực hiện thanh toán | `userTask` | PHÒNG KẾ HOẠCH TÀI CHÍNH | Màn hình Lập ủy nhiệm chi ngân hàng | `POST /api/events/:id/review` (`SETTLE`) | Trạng thái chuyển sang `SETTLED` | `workflow.service.ts` (L98) | Đã triển khai và hoạt động |
| 44 | `Close` | BCH nhận xác nhận, lưu hồ sơ | `userTask` | BCH LIÊN CHI ĐOÀN | Hồ sơ lưu trữ điện tử (`/events/:id`) | `POST /api/events/:id/review` (`COMPLETE`) | Trạng thái chuyển sang `COMPLETED` | `workflow.service.ts` (L84) | Đã triển khai và hoạt động |
| 45 | `End` | Hoàn tất quy trình | `endEvent` | BCH LIÊN CHI ĐOÀN | Huy hiệu hoàn thành vòng đời | Không (Terminal State) | Lưu trữ vĩnh viễn trong CSDL | `EventDetailPage.tsx` | Đã triển khai và hoạt động |

---

## 2. PHÂN TÍCH VÀ ĐỐI CHIẾU 10 SERVICE TASKS TRONG BPMN TO-BE

| STT | Service Task ID | Tên Service Task | Cơ chế tự động hóa thực tế trong Backend | Endpoint / Hàm xử lý thực tế | Đánh giá tình trạng triển khai |
|:---:|:---|---|---|---|---|
| 1 | `CheckFields` | Kiểm tra trường bắt buộc | Tự động kiểm tra tính hợp lệ dữ liệu (tên sự kiện, ngày bắt đầu, kết thúc, số người tham dự, mục tiêu) bằng thư viện Zod ngay khi tiếp nhận HTTP Request. | Middleware `validate(createEventSchema)` tại `backend/src/middleware/validate.ts` | **Đã triển khai hoàn chỉnh:** Bắt lỗi trước khi dữ liệu chạm vào Database. |
| 2 | `AIReview` | AI rà soát nội dung và gợi ý sửa | Thuật toán heuristic và mô hình AI thẩm định tính tương thích giữa quy mô người tham dự và diện tích phòng; tính hợp lý của tỷ trọng ngân sách; yêu cầu an toàn PCCC. | `POST /api/ai/review` -> hàm `reviewApplication()` trong `ai.service.ts` | **Đã triển khai hoàn chỉnh:** Trả về điểm số (0-100), cảnh báo rủi ro và gợi ý. |
| 3 | `SubmitKhoa` | Chuyển hồ sơ đến BCN Khoa | Tự động cập nhật trạng thái hồ sơ sang `FACULTY_REVIEW`, tăng số phiên bản `currentVersion`, ghi nhận lịch sử `WorkflowHistory` và tạo thông báo cho toàn bộ tài khoản BCN Khoa. | `POST /api/events/:id/submit` -> hàm `submitEvent()` trong `event.service.ts` | **Đã triển khai hoàn chỉnh:** Đảm bảo toàn vẹn bằng Prisma Database Transaction. |
| 4 | `ForwardDoan`| Chuyển hồ sơ đến Đoàn trường | Khi BCN Khoa bấm duyệt, hệ thống tự động kích hoạt State Machine chuyển hồ sơ sang `UNIVERSITY_REVIEW`, ghi vết quyết định và gửi thông báo cho tài khoản Đoàn Trường. | Hàm `transitionState()` với action `APPROVE` trong `workflow.service.ts` | **Đã triển khai hoàn chỉnh:** Tự động chuyển giao không cần thao tác gửi trung gian. |
| 5 | `FacilityForm`| Tạo đơn mượn CSVC | Hệ thống tự động trích xuất thông tin địa điểm, khung giờ, số lượng thiết bị từ hồ sơ sự kiện đã được duyệt để khởi tạo phiếu giữ chỗ trong bảng `ResourceBooking`. | Hàm `createEvent()` / `createBooking()` trong `booking.service.ts` | **Đã triển khai hoàn chỉnh:** Liên kết khóa ngoại `eventId` và `facilityId`. |
| 6 | `CheckSchedule`| Đối chiếu lịch / danh mục thiết bị | Truy vấn cơ sở dữ liệu tìm kiếm các booking đã xác nhận (`CONFIRMED`) hoặc đang chờ (`PENDING`) có khoảng thời gian giao thoa ($T_{start} < T_{existing\_end} \land T_{end} > T_{existing\_start}$). | Hàm `checkAvailability()` trong `booking.service.ts` và API `GET /api/bookings/availability` | **Đã triển khai hoàn chỉnh:** Phát hiện trùng lịch chính xác theo từng phút. |
| 7 | `AISuggest` | AI gợi ý bố trí phòng và thiết bị| Phân tích số người tham dự kỳ vọng và loại hình sự kiện để gợi ý phòng có sức chứa tối ưu và danh mục thiết bị tiêu chuẩn phù hợp. | `POST /api/ai/resource-suggestions` -> hàm `suggestResources()` trong `ai.service.ts` | **Đã triển khai ở Backend:** Logic thuật toán sẵn sàng, Frontend cần kết nối đúng đường dẫn URL. |
| 8 | `AIReport` | AI tạo bản nháp báo cáo | Tổng hợp số liệu từ `Event`, `BudgetItem`, `WorkflowHistory` để tự động điền sẵn dàn ý báo cáo tổng kết (số người thực tế, tổng kinh phí giải ngân, đánh giá ưu khuyết điểm). | `POST /api/ai/generate-report` -> hàm `generateReportDraft()` trong `ai.service.ts` | **Đã triển khai ở Backend:** Logic tổng hợp dữ liệu hoàn chỉnh. |
| 9 | `AutoReport` | Gửi báo cáo đến Đoàn trường | Khi BCH bấm nộp báo cáo, hệ thống tự động khóa bản thảo, chuyển trạng thái báo cáo sang `SUBMITTED`, lưu vết và thông báo cho Đoàn trường tiếp nhận. | `PUT /api/events/:id/report` tại `event.routes.ts` | **Đã triển khai hoàn chỉnh:** Tự động cập nhật `EventReport.status`. |
| 10 | `AutoForwardPay`| Chuyển hồ sơ đến KHTC | Tự động đóng gói toàn bộ bảng kê quyết toán kinh phí và danh sách tệp đính kèm hóa đơn điện tử chuyển sang hòm thư công việc của Phòng Kế hoạch Tài chính. | `POST /api/settlements/:id/submit` -> hàm `submitSettlement()` trong `settlement.service.ts` | **Đã triển khai hoàn chỉnh:** Chuyển trạng thái sang `FINANCE_REVIEW` và gửi thông báo. |

---

## 3. ĐỐI CHIẾU 6 CỔNG RẼ NHÁNH EXCLUSIVE GATEWAY (XOR)

### 1. Cổng `GKhoa` (Kết quả thẩm định của BCN Khoa)
- **ID trong BPMN:** `GKhoa`
- **Vị trí Lane:** BAN CHỦ NHIỆM KHOA
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Duyệt (`Flow_010`)** $\rightarrow$ Đích: `SignKhoa` (Khoa ký xác nhận). Điều kiện: Kế hoạch đạt chuẩn, nội dung lành mạnh, đúng tôn chỉ khoa.
  - Nhánh 2: **Sửa (`Flow_007`)** $\rightarrow$ Đích: `FixKhoa` (BCH sửa hồ sơ). Điều kiện: Kế hoạch thiếu chi tiết, dự trù kinh phí chưa hợp lý $\rightarrow$ Chuyển trạng thái `FACULTY_REVISION_REQUESTED`.
  - Nhánh 3: **Từ chối (`Flow_009`)** $\rightarrow$ Đích: `RejectKhoa` (Kết thúc). Điều kiện: Sự kiện vi phạm quy định hoặc không phù hợp mục tiêu đào tạo $\rightarrow$ Chuyển trạng thái `FACULTY_REJECTED`.

### 2. Cổng `GDoan` (Kết quả thẩm định của Đoàn trường)
- **ID trong BPMN:** `GDoan`
- **Vị trí Lane:** ĐOÀN TRƯỜNG
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Duyệt (`Flow_014`)** $\rightarrow$ Đích: `ApproveDoan` (Ký duyệt cấp phép). Điều kiện: Hồ sơ đầy đủ điều kiện an toàn, lịch trường không trùng $\rightarrow$ Chuyển trạng thái `PERMIT_ISSUED`.
  - Nhánh 2: **Sửa (`Flow_015`)** $\rightarrow$ Đích: `FixDoan` (BCH chỉnh sửa). Điều kiện: Yêu cầu bổ sung phương án bảo đảm an ninh trật tự $\rightarrow$ Chuyển trạng thái `UNIVERSITY_REVISION_REQUESTED`.
  - Nhánh 3: **Từ chối (`Flow_017`)** $\rightarrow$ Đích: `RejectDoan` (Kết thúc). Điều kiện: Không cấp phép tổ chức $\rightarrow$ Chuyển trạng thái `UNIVERSITY_REJECTED`.

### 3. Cổng `GFacility` (Khả năng đáp ứng Cơ sở vật chất)
- **ID trong BPMN:** `GFacility`
- **Vị trí Lane:** PHÒNG CƠ SỞ VẬT CHẤT
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Có đáp ứng (`Flow_023`)** $\rightarrow$ Đích: `ApproveFacility` (CSVC xác nhận cấp phòng). Điều kiện: Phòng và thiết bị trống trong toàn bộ khung giờ yêu cầu $\rightarrow$ Chuyển trạng thái `FACILITY_RESERVED`.
  - Nhánh 2: **Chưa đáp ứng (`Flow_024`)** $\rightarrow$ Đích: `AdjustFacility` (BCH điều chỉnh). Điều kiện: Phòng đã có đơn vị khác đặt trước hoặc đang bảo trì $\rightarrow$ Chuyển trạng thái `FACILITY_CONFLICT`.

### 4. Cổng `GReport` (Yêu cầu nộp báo cáo tổng kết)
- **ID trong BPMN:** `GReport`
- **Vị trí Lane:** ĐOÀN TRƯỜNG / QUY CHẾ
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Có yêu cầu (`Flow_031`)** $\rightarrow$ Đích: `AIReport` (AI tạo bản nháp báo cáo). Điều kiện: Sự kiện có quy mô lớn hoặc có hỗ trợ kinh phí Đoàn - Hội $\rightarrow$ Kích hoạt chu trình nộp báo cáo.
  - Nhánh 2: **Không yêu cầu (`Flow_030`)** $\rightarrow$ Đích: `MergeReport` (Tiếp tục thanh quyết toán). Điều kiện: Sự kiện quy mô nhỏ cấp CLB tự túc $\rightarrow$ Bỏ qua bước báo cáo, chuyển thẳng sang quyết toán.

### 5. Cổng `GPay` (Tính đầy đủ hợp lệ của bộ chứng từ tài chính)
- **ID trong BPMN:** `GPay`
- **Vị trí Lane:** PHÒNG KẾ HOẠCH TÀI CHÍNH
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Đủ (`Flow_039`)** $\rightarrow$ Đích: `SubmitApproval` (Trình cấp thẩm quyền duyệt chi). Điều kiện: Hóa đơn điện tử VAT hợp pháp, đầy đủ chữ ký nghiệm thu và phiếu chi.
  - Nhánh 2: **Thiếu (`Flow_040`)** $\rightarrow$ Đích: `FixPay` (BCH bổ sung chứng từ). Điều kiện: Hóa đơn sai thông tin mã số thuế, thiếu chứng từ thanh toán ngân hàng $\rightarrow$ Chuyển trạng thái `FINANCE_REVISION_REQUESTED`.

### 6. Cổng `GApproval` (Phê duyệt chi thanh toán theo thẩm quyền)
- **ID trong BPMN:** `GApproval`
- **Vị trí Lane:** PHÒNG KHTC / CẤP CÓ THẨM QUYỀN
- **Quy tắc điều kiện & Các nhánh rẽ:**
  - Nhánh 1: **Có duyệt (`Flow_046`)** $\rightarrow$ Đích: `PerformPay` (KHTC thực hiện thanh toán). Điều kiện: Chủ tài khoản/Ban Giám hiệu ký duyệt giải ngân $\rightarrow$ Chuyển trạng thái `SETTLED`.
  - Nhánh 2: **Không duyệt (`Flow_044`)** $\rightarrow$ Đích: `RefusePay` (Thông báo không thanh toán). Điều kiện: Chi sai mục đích hoặc vượt trần ngân sách cho phép $\rightarrow$ Chuyển trạng thái `PAYMENT_REJECTED`.

---

## 4. MA TRẬN ĐỐI CHIẾU LANE (VAI TRÒ) VÀ PHÂN QUYỀN TRUY CẬP (RBAC)

| Tên Lane trong BPMN | Mã vai trò hệ thống (`UserRole`) | Quyền thao tác Hồ sơ (`Event`) | Quyền Đặt phòng (`Booking`) | Quyền Bàn giao (`Handover`) | Quyền Quyết toán (`Settlement`) | Quyền Quản trị (`User`) |
|---|:---:|---|---|---|---|---|
| **BCH LIÊN CHI ĐOÀN** | `BTC` | Tạo mới, Sửa nháp, Nộp hồ sơ, Nộp báo cáo | Đăng ký mượn địa điểm & thiết bị | Ký nhận bàn giao, đề nghị hoàn trả | Lập bảng kê, tải lên hóa đơn VAT, Nộp quyết toán | Không |
| **BAN CHỦ NHIỆM KHOA** | `BCN_KHOA` | Thẩm định Vòng 1: Phê duyệt, Yêu cầu sửa, Từ chối | Xem thông tin mượn phòng | Xem biên bản bàn giao | Xem dự toán kinh phí | Không |
| **ĐOÀN TRƯỜNG** | `DOAN_TRUONG` | Thẩm định Vòng 2: Cấp phép chính thức (`PERMIT_ISSUED`), Duyệt báo cáo | Xem lịch sử dụng CSVC toàn trường | Xem biên bản hoàn trả | Xem báo cáo tài chính tổng hợp | Không |
| **PHÒNG CƠ SỞ VẬT CHẤT**| `CSVC` | Xem hồ sơ đã cấp phép để bố trí hội trường | Duyệt cấp phòng, Từ chối báo trùng, Phân công kỹ thuật viên | Lập biên bản bàn giao, Kiểm tra nghiệm thu, Lập biên bản sự cố | Xem hiện trạng tài sản | Không |
| **PHÒNG KẾ HOẠCH TÀI CHÍNH**| `KHTC` | Xem hồ sơ và dự toán đã được phê duyệt | Xem thông tin địa điểm | Xem biên bản nghiệm thu | Kiểm toán hóa đơn, Yêu cầu bổ sung, Duyệt chi giải ngân | Không |
| **QUẢN TRỊ VIÊN HỆ THỐNG**| `ADMIN` | Toàn quyền kiểm soát và can thiệp quy trình | Toàn quyền quản lý phòng & thiết bị | Toàn quyền xác nhận biên bản | Toàn quyền xử lý quyết toán | Quản lý người dùng, phân quyền, cấu hình hệ thống |
