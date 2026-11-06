# DANH MỤC MÀN HÌNH HỆ THỐNG MY DUE (UI SCREEN INVENTORY)

> **Dự án**: Cổng thông tin Quản lý Quy trình Xét duyệt và Tổ chức Sự kiện MY DUE  
> **Cơ sở nghiệp vụ**: `ToBe_Nhom3.bpmn`, `Nhom3.docx`, `HỒ SƠ ĐẤU THẦU.docx` (phần Tổ chức Sự kiện)  
> **Quy chuẩn màn hình**: Desktop Web 1440×900 px & Mobile Web 390×844 px  
> **Màu sắc nhận diện DUE**: Xanh dương `#075F9F`, Xanh lá `#0D914B`, Cam `#F36B21`, Trắng `#FFFFFF`, Nền `#F6F8FB`, Viền `#E1E8EF`, Chữ `#18334F`  
> **Ràng buộc**: Giao diện UI/UX mô phỏng thuần túy (Client-side Mockup) – KHÔNG Backend, API, Database.

## 1. BẢNG TỔNG QUAN 37 MÀN HÌNH (00 ĐẾN 36)

| ID | Tên màn hình | Vai trò | Giai đoạn | Layout | Căn cứ BPMN | Phân loại |
|:--:|:-------------|:--------|:----------|:-------|:------------|:----------|
| **00** | Tổng quan quy trình | BCH Liên Chi Đoàn | Tổng quan | `dashboard` | UI đề xuất (Cổng thông tin Single Portal & Chỉ số hoạt động) | **UI đề xuất** |
| **01** | Danh sách hồ sơ sự kiện | BCH Liên Chi Đoàn | Tổng quan | `list` | UI đề xuất (Bảng quản lý tập trung theo dõi vòng đời Ticket ID) | **UI đề xuất** |
| **02** | Chi tiết hồ sơ và tiến độ | BCH Liên Chi Đoàn | Tổng quan | `timeline` | UI đề xuất (Tracking Dashboard đa chặng theo nguyên tắc Hồ sơ đấu thầu) | **UI đề xuất** |
| **03** | Lập kế hoạch và hồ sơ tổ chức | BCH Liên Chi Đoàn | Chuẩn bị | `form` | BPMN Task: Prepare & CheckFields (Khởi tạo sự kiện E-form) | **BPMN task** |
| **04** | Lập dự trù kinh phí | BCH Liên Chi Đoàn | Chuẩn bị | `budget` | UI đề xuất (Bảng dự toán ngân sách chi tiết theo Hồ sơ đấu thầu) | **UI đề xuất** |
| **05** | Rà soát hồ sơ bằng AI | BCH Liên Chi Đoàn | Chuẩn bị | `ai` | BPMN Task: AIReview (Đề xuất ứng dụng AI số 1) | **BPMN task** |
| **06** | Kiểm chứng và hoàn thiện hồ sơ | BCH Liên Chi Đoàn | Chuẩn bị | `checklist` | BPMN Task: BCHConfirm (Tiếp nhận sau AI hoặc sau sửa đổi) | **BPMN task** |
| **07** | Nộp hồ sơ cho BCN Khoa | BCH Liên Chi Đoàn | Duyệt cấp khoa | `submit` | BPMN Task: SubmitKhoa (Tự động hóa số 1 - Chuyển hồ sơ điện tử) | **BPMN task** |
| **08** | Hồ sơ chờ thẩm định cấp khoa | Ban Chủ nhiệm Khoa | Duyệt cấp khoa | `inbox` | UI đề xuất (Hòm thư xử lý nghiệp vụ của Ban Chủ nhiệm Khoa) | **UI đề xuất** |
| **09** | Thẩm định hồ sơ cấp khoa | Ban Chủ nhiệm Khoa | Duyệt cấp khoa | `review` | BPMN Task: ReviewKhoa & Gateway GKhoa (3 nhánh: Sửa / Từ chối / Duyệt) | **BPMN task** |
| **10** | Chỉnh sửa theo góp ý của Khoa | BCH Liên Chi Đoàn | Duyệt cấp khoa | `feedback` | BPMN Task: FixKhoa (Nhánh Sửa của GKhoa) | **BPMN task** |
| **11** | Khoa ký xác nhận hồ sơ | Ban Chủ nhiệm Khoa | Duyệt cấp khoa | `sign` | BPMN Task: SignKhoa (Nhánh Duyệt của GKhoa) | **BPMN task** |
| **12** | Chuyển hồ sơ đến Đoàn trường | Ban Chủ nhiệm Khoa / Hệ thống tự động | Duyệt Đoàn trường | `submit` | BPMN Task: ForwardDoan (Tự động hóa số 2 & 3 - Tự chuyển hồ sơ đã duyệt sang Đoàn trường) | **BPMN task** |
| **13** | Hồ sơ chờ thẩm định Đoàn trường | Đoàn Trường | Duyệt Đoàn trường | `inbox` | UI đề xuất (Hòm thư xét duyệt tập trung của Đoàn Trường) | **UI đề xuất** |
| **14** | Thẩm định hồ sơ tại Đoàn trường | Đoàn Trường | Duyệt Đoàn trường | `review` | BPMN Task: ReviewDoan & Gateway GDoan (3 nhánh: Sửa / Từ chối / Duyệt) | **BPMN task** |
| **15** | Chỉnh sửa theo góp ý Đoàn trường | BCH Liên Chi Đoàn | Duyệt Đoàn trường | `feedback` | BPMN Task: FixDoan (Nhánh Sửa của GDoan) | **BPMN task** |
| **16** | Ký duyệt và đóng dấu kế hoạch | Đoàn Trường | Duyệt Đoàn trường | `sign` | BPMN Task: ApproveDoan (Nhánh Duyệt của GDoan - Cấp phép chính thức) | **BPMN task** |
| **17** | Tạo đơn mượn cơ sở vật chất | BCH Liên Chi Đoàn (Hệ thống tự động) | Cơ sở vật chất | `facilityform` | BPMN Task: FacilityForm (Tự động hóa số 4 & 5 - Điền form mượn CSVC) | **BPMN task** |
| **18** | Đối chiếu lịch và thiết bị | Phòng Cơ sở vật chất / Hệ thống tự động | Cơ sở vật chất | `calendar` | BPMN Task: CheckSchedule (Tự động hóa số 6 - Đối chiếu lịch thời gian thực) | **BPMN task** |
| **19** | AI gợi ý bố trí phòng thiết bị | Phòng Cơ sở vật chất | Cơ sở vật chất | `airesource` | BPMN Task: AISuggest (Đề xuất ứng dụng AI số 2) | **BPMN task** |
| **20** | Xác minh và quyết định CSVC | Phòng Cơ sở vật chất | Cơ sở vật chất | `reviewresource` | BPMN Task: FacilityUser & Gateway GFacility (2 nhánh: Chưa / Có) | **BPMN task** |
| **21** | Điều chỉnh lịch hoặc thiết bị | BCH Liên Chi Đoàn | Cơ sở vật chất | `facilityform` | BPMN Task: AdjustFacility (Nhánh Chưa đáp ứng của GFacility) | **BPMN task** |
| **22** | Xác nhận đặt phòng và thiết bị | Phòng Cơ sở vật chất | Cơ sở vật chất | `sign` | BPMN Task: ApproveFacility (Nhánh Có đáp ứng của GFacility) | **BPMN task** |
| **23** | Chuẩn bị và tổ chức sự kiện | BCH Liên Chi Đoàn | Triển khai | `checklist` | BPMN Task: PrepareEvent (Thực hiện sự kiện thực tế) | **BPMN task** |
| **24** | Hoàn trả cơ sở vật chất | BCH Liên Chi Đoàn | Bàn giao | `return` | BPMN Task: ReturnFacility (Nghiệm thu bàn giao sau sự kiện) | **BPMN task** |
| **25** | Kiểm tra tình trạng hoàn trả | Phòng Cơ sở vật chất | Bàn giao | `checklist` | BPMN Task: VerifyReturn & Gateway GReport (Yêu cầu báo cáo?) | **BPMN task** |
| **26** | AI tạo bản nháp báo cáo | BCH Liên Chi Đoàn | Báo cáo | `ai` | BPMN Task: AIReport (Đề xuất ứng dụng AI số 3) | **BPMN task** |
| **27** | Kiểm tra và xác nhận báo cáo | BCH Liên Chi Đoàn | Báo cáo | `report` | BPMN Task: ReviewReport (BCH rà soát và xác nhận bản báo cáo) | **BPMN task** |
| **28** | Gửi báo cáo đến Đoàn trường | BCH Liên Chi Đoàn / Hệ thống tự động | Báo cáo | `submit` | BPMN Task: AutoReport (Tự động hóa số 8 - Tự gửi báo cáo và lưu vết) | **BPMN task** |
| **29** | Lập và rà soát hồ sơ chứng từ | BCH Liên Chi Đoàn | Thanh toán | `finance` | BPMN Task: PayPackage & AutoForwardPay (Tự động hóa số 7 - Lập và chuyển chứng từ KHTC) | **BPMN task** |
| **30** | Kiểm tra chứng từ thanh toán | Phòng Kế hoạch Tài chính | Thanh toán | `financecheck` | BPMN Task: CheckPay & Gateway GPay (2 nhánh: Thiếu / Đủ) | **BPMN task** |
| **31** | Bổ sung hồ sơ thanh toán | BCH Liên Chi Đoàn | Thanh toán | `feedback` | BPMN Task: FixPay (Nhánh Thiếu của GPay) | **BPMN task** |
| **32** | Trình hồ sơ duyệt thanh toán | Phòng Kế hoạch Tài chính | Thanh toán | `submit` | BPMN Task: SubmitApproval (KHTC lập tờ trình trình cấp thẩm quyền duyệt) | **BPMN task** |
| **33** | Phê duyệt thanh toán | Phòng Kế hoạch Tài chính (hoặc Cấp có thẩm quyền / Ban Giám hiệu) | Thanh toán | `review` | BPMN Task: ApprovePayment & Gateway GApproval (2 nhánh: Không / Có) | **BPMN task** |
| **34** | Thông báo không thanh toán | Phòng Kế hoạch Tài chính | Thanh toán | `notice` | BPMN Task: RefusePay (Nhánh Không của GApproval) | **BPMN task** |
| **35** | Thực hiện thanh toán | Phòng Kế hoạch Tài chính | Thanh toán | `payment` | BPMN Task: PerformPay (Nhánh Có của GApproval) | **BPMN task** |
| **36** | Xác nhận và lưu trữ hồ sơ | BCH Liên Chi Đoàn | Hoàn tất | `archive` | BPMN Task: Close & End Event: End (Hoàn tất toàn bộ quy trình) | **BPMN task** |

---

## 2. ĐẶC TẢ CHI TIẾT TỪNG MÀN HÌNH

### Màn hình 00: Tổng quan quy trình

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Tổng quan
- **Kiểu Layout**: `dashboard`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Cổng thông tin Single Portal & Chỉ số hoạt động)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Đăng nhập vào hệ thống MY DUE hoặc chọn mục Tổng quan trên Sidebar điều hướng.
- **Input (Dữ liệu vào)**: Bộ lọc năm học, học kỳ, ô tìm kiếm nhanh mã hồ sơ (Ticket ID), trạng thái tiến độ.
- **Output (Dữ liệu ra)**: Bảng điều khiển trực quan hiển thị số lượng hồ sơ (Đang xử lý, Chờ duyệt, Cần chỉnh sửa, Đã hoàn tất), danh sách hồ sơ gần đây và biểu đồ tiến độ.
- **Success State (Thành công)**: Hiển thị đầy đủ số liệu thống kê thời gian thực; bấm vào hàng sự kiện điều hướng trực tiếp sang màn hình chi tiết 02.
- **Error State (Lỗi / Ngoại lệ)**: Không tìm thấy hồ sơ phù hợp bộ lọc -> Hiển thị Empty State kèm nút bấm Tạo hồ sơ sự kiện mới.

### Màn hình 01: Danh sách hồ sơ sự kiện

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Tổng quan
- **Kiểu Layout**: `list`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Bảng quản lý tập trung theo dõi vòng đời Ticket ID)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Bấm mục Hồ sơ sự kiện trên thanh Sidebar điều hướng.
- **Input (Dữ liệu vào)**: Bộ lọc trạng thái (Tất cả, Đang soạn, Chờ Khoa duyệt, Chờ Đoàn duyệt, CSVC, Quyết toán), từ khóa tìm kiếm theo tên hoặc mã sự kiện.
- **Output (Dữ liệu ra)**: Bảng dữ liệu nhiều cột gồm: Mã hồ sơ (Ticket ID), Tên sự kiện, Đơn vị tổ chức, Ngày nộp, Tiến độ hiện tại, Trạng thái hồ sơ, Nút xem chi tiết.
- **Success State (Thành công)**: Danh sách hồ sơ hiển thị đầy đủ kèm Status Badge chuẩn màu thương hiệu DUE (Xanh lá = Đã duyệt, Cam = Cần sửa, Xanh dương = Đang xử lý).
- **Error State (Lỗi / Ngoại lệ)**: Từ khóa tìm kiếm không tồn tại trong hệ thống -> Hiển thị thông báo Không tìm thấy hồ sơ phù hợp kèm nút Xóa bộ lọc.

### Màn hình 02: Chi tiết hồ sơ và tiến độ

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Tổng quan
- **Kiểu Layout**: `timeline`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Tracking Dashboard đa chặng theo nguyên tắc Hồ sơ đấu thầu)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Bấm chọn một sự kiện từ Màn hình 00 hoặc 01.
- **Input (Dữ liệu vào)**: Mã hồ sơ sự kiện (Ticket ID, ví dụ: HS-2026-0042).
- **Output (Dữ liệu ra)**: Thanh tiến trình 7 chặng: Soạn thảo -> Duyệt Khoa -> Duyệt Đoàn -> Đặt CSVC -> Tổ chức -> Báo cáo -> Quyết toán; chi tiết người đang giữ hồ sơ, thời gian xử lý, tài liệu đính kèm.
- **Success State (Thành công)**: Timeline trực quan sáng đèn các mốc đã hoàn thành, mốc hiện tại hiển thị trạng thái động và thông tin người duyệt phụ trách.
- **Error State (Lỗi / Ngoại lệ)**: Hồ sơ bị từ chối ở bước Khoa hoặc Đoàn -> Dấu mốc timeline chuyển sang màu đỏ báo ngưng xử lý kèm biên bản giải trình.

### Màn hình 03: Lập kế hoạch và hồ sơ tổ chức

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Chuẩn bị
- **Kiểu Layout**: `form`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: Prepare & CheckFields (Khởi tạo sự kiện E-form)
- **Phân loại**: BPMN task (BPMN Task ID: `Prepare, CheckFields`)
- **Trigger (Kích hoạt)**: Bấm Tạo hồ sơ mới từ Dashboard hoặc Start Event (Start -> Flow_000 -> Prepare).
- **Input (Dữ liệu vào)**: Tên sự kiện, đơn vị tổ chức, thời gian bắt đầu - kết thúc, quy mô số lượng sinh viên, địa điểm dự kiến, mục tiêu, kịch bản chi tiết, danh sách BTC.
- **Output (Dữ liệu ra)**: Bộ dữ liệu kế hoạch sự kiện được lưu nháp hoặc đẩy vào luồng kiểm tra dữ liệu bắt buộc.
- **Success State (Thành công)**: Nhập đầy đủ thông tin hợp lệ -> Hệ thống tự động kiểm tra trường bắt buộc (CheckFields) và kích hoạt AI rà soát nội dung (Flow_002).
- **Error State (Lỗi / Ngoại lệ)**: Bỏ trống trường bắt buộc (Tên sự kiện, thời gian, mục tiêu) -> Hiển thị cảnh báo lỗi đỏ inline ngay dưới ô nhập liệu và cuộn màn hình đến vị trí lỗi.

### Màn hình 04: Lập dự trù kinh phí

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Chuẩn bị
- **Kiểu Layout**: `budget`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Bảng dự toán ngân sách chi tiết theo Hồ sơ đấu thầu)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Bước 2 trong quá trình lập hồ sơ sự kiện (hoặc chuyển tab Dự trù kinh phí).
- **Input (Dữ liệu vào)**: Từng mục chi phí: Tên hạng mục, đơn vị tính, số lượng, đơn giá, nguồn kinh phí (Nhà trường cấp / Đoàn phí / Tài trợ), file báo giá đính kèm.
- **Output (Dữ liệu ra)**: Bảng tổng hợp kinh phí tự động tính tổng tiền, cơ cấu tỷ trọng nguồn kinh phí và file dự trù tài chính chuẩn mẫu.
- **Success State (Thành công)**: Hệ thống tự động tính tổng tiền chính xác, cân đối nguồn thu - chi, hiển thị số tiền bằng chữ chuẩn xác.
- **Error State (Lỗi / Ngoại lệ)**: Chi phí vượt khung định mức quy định của Nhà trường hoặc đơn giá để trống -> Hiển thị cảnh báo màu cam yêu cầu giải trình lý do vượt mức.

### Màn hình 05: Rà soát hồ sơ bằng AI

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Chuẩn bị
- **Kiểu Layout**: `ai`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: AIReview (Đề xuất ứng dụng AI số 1)
- **Phân loại**: BPMN task (BPMN Task ID: `AIReview`)
- **Trigger (Kích hoạt)**: Hoàn thành Màn hình 03 & 04, hệ thống kích hoạt Service Task AIReview (Flow_002).
- **Input (Dữ liệu vào)**: Toàn bộ nội dung kế hoạch sự kiện và bảng dự trù kinh phí đã nhập.
- **Output (Dữ liệu ra)**: Báo cáo đánh giá mức độ hoàn thiện hồ sơ, phát hiện các điểm thiếu sót (ví dụ: thiếu phương án dự phòng thời tiết, timeline sát giờ), gợi ý điều chỉnh câu chữ chuẩn quy chuẩn đại học.
- **Success State (Thành công)**: AI hoàn tất phân tích sau 2 giây mô phỏng, hiển thị 3-5 thẻ gợi ý trực quan có nút Áp dụng nhanh hoặc Bỏ qua.
- **Error State (Lỗi / Ngoại lệ)**: Hồ sơ quá ngắn hoặc thiếu thông tin cốt lõi -> AI cảnh báo dữ liệu chưa đủ điều kiện phân tích, đề nghị nhập thêm kịch bản chi tiết.

### Màn hình 06: Kiểm chứng và hoàn thiện hồ sơ

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Chuẩn bị
- **Kiểu Layout**: `checklist`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: BCHConfirm (Tiếp nhận sau AI hoặc sau sửa đổi)
- **Phân loại**: BPMN task (BPMN Task ID: `BCHConfirm`)
- **Trigger (Kích hoạt)**: Sau bước AIReview hoặc nhận luồng chỉnh sửa từ Khoa (FixKhoa) / Đoàn trường (FixDoan) qua Gateway_0q4ts0h.
- **Input (Dữ liệu vào)**: Bản kế hoạch đã được chỉnh sửa, danh sách checklist kiểm chứng trách nhiệm của BCH.
- **Output (Dữ liệu ra)**: Bộ hồ sơ hoàn thiện cuối cùng kèm chữ ký xác nhận của Bí thư Liên Chi Đoàn sẵn sàng trình Khoa.
- **Success State (Thành công)**: Tích chọn đầy đủ các tiêu chí kiểm chứng (Kế hoạch chuẩn mực, Ngân sách cân đối, Đã tiếp thu ý kiến) -> Nút Nộp hồ sơ sáng xanh kích hoạt.
- **Error State (Lỗi / Ngoại lệ)**: Chưa tích đủ các cam kết chịu trách nhiệm -> Nút nộp bị vô hiệu hóa kèm thông báo nhắc nhở.

### Màn hình 07: Nộp hồ sơ cho BCN Khoa

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Duyệt cấp khoa
- **Kiểu Layout**: `submit`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: SubmitKhoa (Tự động hóa số 1 - Chuyển hồ sơ điện tử)
- **Phân loại**: BPMN task (BPMN Task ID: `SubmitKhoa`)
- **Trigger (Kích hoạt)**: Bấm Nộp hồ sơ tại Màn hình 06 (BCHConfirm -> Flow_004 -> SubmitKhoa).
- **Input (Dữ liệu vào)**: Lệnh nộp hồ sơ, ghi chú đính kèm gửi Ban Chủ nhiệm Khoa.
- **Output (Dữ liệu ra)**: Cập nhật trạng thái Ticket ID sang Chờ BCN Khoa thẩm định, gửi thông báo đẩy đến tài khoản Ban Chủ nhiệm Khoa.
- **Success State (Thành công)**: Hiển thị biên nhận nộp điện tử thành công kèm mã Ticket ID, thời gian nộp và hạn chót phản hồi dự kiến (3 ngày làm việc).
- **Error State (Lỗi / Ngoại lệ)**: Mất kết nối mạng mô phỏng -> Hiển thị cảnh báo lỗi gửi và nút Thử lại.

### Màn hình 08: Hồ sơ chờ thẩm định cấp khoa

- **Vai trò thực hiện**: Ban Chủ nhiệm Khoa
- **Giai đoạn quy trình**: Duyệt cấp khoa
- **Kiểu Layout**: `inbox`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Hòm thư xử lý nghiệp vụ của Ban Chủ nhiệm Khoa)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Ban Chủ nhiệm Khoa đăng nhập hoặc truy cập tab Xét duyệt cấp Khoa.
- **Input (Dữ liệu vào)**: Danh sách hồ sơ do các Liên Chi Đoàn trực thuộc nộp lên.
- **Output (Dữ liệu ra)**: Danh sách hồ sơ chờ thẩm định kèm thông tin: Tên sự kiện, Liên Chi Đoàn nộp, Ngày nộp, Cấp độ ưu tiên, Nút Thẩm định.
- **Success State (Thành công)**: Bấm vào một sự kiện để mở giao diện thẩm định chi tiết Màn hình 09.
- **Error State (Lỗi / Ngoại lệ)**: Không có hồ sơ nào đang chờ -> Hiển thị giao diện Không có hồ sơ chờ duyệt.

### Màn hình 09: Thẩm định hồ sơ cấp khoa

- **Vai trò thực hiện**: Ban Chủ nhiệm Khoa
- **Giai đoạn quy trình**: Duyệt cấp khoa
- **Kiểu Layout**: `review`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ReviewKhoa & Gateway GKhoa (3 nhánh: Sửa / Từ chối / Duyệt)
- **Phân loại**: BPMN task (BPMN Task ID: `ReviewKhoa, GKhoa`)
- **Trigger (Kích hoạt)**: Mở chi tiết hồ sơ từ Màn hình 08 (Flow_005 -> ReviewKhoa).
- **Input (Dữ liệu vào)**: Toàn bộ hồ sơ kế hoạch và dự trù kinh phí của Liên Chi Đoàn; ý kiến thẩm định của Khoa.
- **Output (Dữ liệu ra)**: Quyết định của Khoa tại Exclusive Gateway GKhoa: Nhánh 1: Yêu cầu sửa (Flow_007 -> FixKhoa), Nhánh 2: Từ chối (Flow_009 -> RejectKhoa), Nhánh 3: Duyệt (Flow_010 -> SignKhoa).
- **Success State (Thành công)**: Lựa chọn quyết định được ghi nhận, luồng điều hướng mở đúng màn hình/trạng thái tiếp theo.
- **Error State (Lỗi / Ngoại lệ)**: Bấm Yêu cầu sửa hoặc Từ chối mà để trống lý do -> Hệ thống yêu cầu bắt buộc nhập nội dung phản hồi.

### Màn hình 10: Chỉnh sửa theo góp ý của Khoa

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Duyệt cấp khoa
- **Kiểu Layout**: `feedback`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: FixKhoa (Nhánh Sửa của GKhoa)
- **Phân loại**: BPMN task (BPMN Task ID: `FixKhoa`)
- **Trigger (Kích hoạt)**: Khoa chọn Yêu cầu chỉnh sửa tại GKhoa (Flow_007 -> FixKhoa).
- **Input (Dữ liệu vào)**: Ý kiến nhận xét cụ thể của Ban Chủ nhiệm Khoa, các trường kế hoạch hoặc kinh phí cần điều chỉnh.
- **Output (Dữ liệu ra)**: Bản kế hoạch sự kiện đã được chỉnh lý cập nhật.
- **Success State (Thành công)**: Lưu chỉnh sửa thành công -> Luồng chuyển qua Gateway_0q4ts0h về Màn hình 06 (BCHConfirm) để hoàn thiện nộp lại.
- **Error State (Lỗi / Ngoại lệ)**: Lưu khi chưa thay đổi thông tin theo yêu cầu của Khoa -> Cảnh báo xác nhận lại các điểm lưu ý.

### Màn hình 11: Khoa ký xác nhận hồ sơ

- **Vai trò thực hiện**: Ban Chủ nhiệm Khoa
- **Giai đoạn quy trình**: Duyệt cấp khoa
- **Kiểu Layout**: `sign`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: SignKhoa (Nhánh Duyệt của GKhoa)
- **Phân loại**: BPMN task (BPMN Task ID: `SignKhoa`)
- **Trigger (Kích hoạt)**: Khoa chọn Phê duyệt tại GKhoa (Flow_010 -> SignKhoa).
- **Input (Dữ liệu vào)**: Thao tác xác nhận ký duyệt của đại diện BCN Khoa (chọn chứng thư ký số mô phỏng hoặc nút xác nhận điện tử).
- **Output (Dữ liệu ra)**: Hồ sơ được gắn dấu xác nhận điện tử ĐÃ ĐƯỢC BCN KHOA PHÊ DUYỆT kèm họ tên người ký và thời gian.
- **Success State (Thành công)**: Ký xác nhận thành công -> Kích hoạt Service Task ForwardDoan (Flow_011).
- **Error State (Lỗi / Ngoại lệ)**: Chưa tích cam kết trách nhiệm quản lý của Khoa -> Nút ký bị vô hiệu hóa.

### Màn hình 12: Chuyển hồ sơ đến Đoàn trường

- **Vai trò thực hiện**: Ban Chủ nhiệm Khoa / Hệ thống tự động
- **Giai đoạn quy trình**: Duyệt Đoàn trường
- **Kiểu Layout**: `submit`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ForwardDoan (Tự động hóa số 2 & 3 - Tự chuyển hồ sơ đã duyệt sang Đoàn trường)
- **Phân loại**: BPMN task (BPMN Task ID: `ForwardDoan`)
- **Trigger (Kích hoạt)**: Hoàn tất ký xác nhận cấp Khoa tại Màn hình 11 (SignKhoa -> Flow_011 -> ForwardDoan).
- **Input (Dữ liệu vào)**: Bộ hồ sơ đã được Khoa đóng dấu số và xác nhận tính hợp lệ.
- **Output (Dữ liệu ra)**: Hồ sơ được tự động chuyển đến hòm thư Đoàn trường, cập nhật trạng thái Ticket: Chờ Đoàn trường thẩm định.
- **Success State (Thành công)**: Hiển thị màn hình thông báo chuyển giao liên cấp thành công kèm lịch sử luân chuyển hồ sơ.
- **Error State (Lỗi / Ngoại lệ)**: Không áp dụng (Hệ thống tự động hóa hoàn toàn).

### Màn hình 13: Hồ sơ chờ thẩm định Đoàn trường

- **Vai trò thực hiện**: Đoàn Trường
- **Giai đoạn quy trình**: Duyệt Đoàn trường
- **Kiểu Layout**: `inbox`
- **Căn cứ BPMN / Cơ sở**: UI đề xuất (Hòm thư xét duyệt tập trung của Đoàn Trường)
- **Phân loại**: UI đề xuất (BPMN Task ID: `UI đề xuất`)
- **Trigger (Kích hoạt)**: Cán bộ Đoàn trường đăng nhập hoặc mở tab Thẩm định sự kiện Đoàn trường.
- **Input (Dữ liệu vào)**: Danh sách hồ sơ sự kiện đã qua phê duyệt cấp Khoa từ các Liên Chi Đoàn toàn trường.
- **Output (Dữ liệu ra)**: Danh sách hồ sơ chờ duyệt sắp xếp theo ngày nộp và thời gian dự kiến tổ chức.
- **Success State (Thành công)**: Bấm chọn một sự kiện để mở giao diện thẩm định Màn hình 14.
- **Error State (Lỗi / Ngoại lệ)**: Hòm thư không có hồ sơ tồn đọng -> Hiển thị Tất cả hồ sơ đã được xử lý.

### Màn hình 14: Thẩm định hồ sơ tại Đoàn trường

- **Vai trò thực hiện**: Đoàn Trường
- **Giai đoạn quy trình**: Duyệt Đoàn trường
- **Kiểu Layout**: `review`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ReviewDoan & Gateway GDoan (3 nhánh: Sửa / Từ chối / Duyệt)
- **Phân loại**: BPMN task (BPMN Task ID: `ReviewDoan, GDoan`)
- **Trigger (Kích hoạt)**: Mở chi tiết hồ sơ từ Màn hình 13 (ForwardDoan -> Flow_012 -> ReviewDoan).
- **Input (Dữ liệu vào)**: Bộ hồ sơ đầy đủ (kế hoạch, dự trù kinh phí, xác nhận của Khoa); đối chiếu lịch công tác Đoàn - Hội toàn trường, đánh giá an toàn sự kiện.
- **Output (Dữ liệu ra)**: Quyết định của Đoàn trường tại Exclusive Gateway GDoan: Nhánh 1: Yêu cầu sửa (Flow_015 -> FixDoan), Nhánh 2: Từ chối (Flow_017 -> RejectDoan), Nhánh 3: Duyệt (Flow_014 -> ApproveDoan).
- **Success State (Thành công)**: Ghi nhận quyết định thẩm định chuẩn xác vào lịch sử Ticket ID.
- **Error State (Lỗi / Ngoại lệ)**: Không điền ý kiến khi yêu cầu sửa hoặc từ chối -> Báo lỗi bắt buộc nhập phản hồi.

### Màn hình 15: Chỉnh sửa theo góp ý Đoàn trường

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Duyệt Đoàn trường
- **Kiểu Layout**: `feedback`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: FixDoan (Nhánh Sửa của GDoan)
- **Phân loại**: BPMN task (BPMN Task ID: `FixDoan`)
- **Trigger (Kích hoạt)**: Đoàn trường chọn Yêu cầu chỉnh sửa tại GDoan (Flow_015 -> FixDoan).
- **Input (Dữ liệu vào)**: Nội dung chỉ đạo chỉnh sửa của Đoàn trường, khung cập nhật nội dung sự kiện.
- **Output (Dữ liệu ra)**: Hồ sơ đã tiếp thu chỉnh sửa chuyển qua Gateway_0q4ts0h về Màn hình 06 (BCHConfirm) để nộp lại.
- **Success State (Thành công)**: Lưu thay đổi thành công, hệ thống đánh dấu các điểm khác biệt so với bản trình lần trước.
- **Error State (Lỗi / Ngoại lệ)**: Chưa sửa đổi các nội dung bắt buộc do Đoàn trường yêu cầu -> Cảnh báo nhắc nhở.

### Màn hình 16: Ký duyệt và đóng dấu kế hoạch

- **Vai trò thực hiện**: Đoàn Trường
- **Giai đoạn quy trình**: Duyệt Đoàn trường
- **Kiểu Layout**: `sign`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ApproveDoan (Nhánh Duyệt của GDoan - Cấp phép chính thức)
- **Phân loại**: BPMN task (BPMN Task ID: `ApproveDoan`)
- **Trigger (Kích hoạt)**: Đoàn trường chọn Phê duyệt tại GDoan (Flow_014 -> ApproveDoan).
- **Input (Dữ liệu vào)**: Thao tác ký số của Bí thư/Phó Bí thư Đoàn trường, nhập số quyết định phê duyệt kế hoạch.
- **Output (Dữ liệu ra)**: Văn bản kế hoạch chính thức được đóng dấu mộc số ĐOÀN TRƯỜNG ĐÃ PHÊ DUYỆT - CHO PHÉP TỔ CHỨC.
- **Success State (Thành công)**: Ký duyệt đóng dấu thành công -> Tự động kích hoạt Service Task FacilityForm (Flow_018) tạo đơn mượn CSVC.
- **Error State (Lỗi / Ngoại lệ)**: Thiếu số hiệu văn bản phê duyệt -> Cảnh báo yêu cầu nhập mã văn thư Đoàn.

### Màn hình 17: Tạo đơn mượn cơ sở vật chất

- **Vai trò thực hiện**: BCH Liên Chi Đoàn (Hệ thống tự động)
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `facilityform`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: FacilityForm (Tự động hóa số 4 & 5 - Điền form mượn CSVC)
- **Phân loại**: BPMN task (BPMN Task ID: `FacilityForm`)
- **Trigger (Kích hoạt)**: Sau khi Đoàn trường ký duyệt (Flow_018 -> FacilityForm) hoặc sau khi BCH điều chỉnh lịch (Flow_025 -> FacilityForm).
- **Input (Dữ liệu vào)**: Dữ liệu kế hoạch đã duyệt (Ngày, giờ, số người, phòng/hội trường mong muốn, micro, máy chiếu, âm thanh).
- **Output (Dữ liệu ra)**: Đơn đăng ký mượn địa điểm và thiết bị số hóa chuẩn mẫu gửi Phòng CSVC.
- **Success State (Thành công)**: Hệ thống tự điền 100% dữ liệu kế thừa từ hồ sơ đã duyệt -> Chuyển sang Service Task CheckSchedule (Flow_019).
- **Error State (Lỗi / Ngoại lệ)**: Khung giờ đăng ký bị thiếu hoặc không đúng định dạng -> Cảnh báo yêu cầu kiểm tra lại thời gian.

### Màn hình 18: Đối chiếu lịch và thiết bị

- **Vai trò thực hiện**: Phòng Cơ sở vật chất / Hệ thống tự động
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `calendar`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: CheckSchedule (Tự động hóa số 6 - Đối chiếu lịch thời gian thực)
- **Phân loại**: BPMN task (BPMN Task ID: `CheckSchedule`)
- **Trigger (Kích hoạt)**: Kích hoạt tự động sau khi tạo đơn mượn CSVC (FacilityForm -> Flow_019 -> CheckSchedule).
- **Input (Dữ liệu vào)**: Khung giờ mượn, hội trường yêu cầu và danh mục thiết bị kỹ thuật.
- **Output (Dữ liệu ra)**: Lịch Shared Booking Calendar trực quan (Xanh = Trống, Đỏ = Trùng/Bận/Bảo trì); kết quả đối chiếu tồn kho thiết bị.
- **Success State (Thành công)**: Không có xung đột lịch phòng và thiết bị đủ số lượng -> Kích hoạt Service Task AISuggest (Flow_020).
- **Error State (Lỗi / Ngoại lệ)**: Hội trường đã có đơn vị khác đặt trước -> Bật cảnh báo Xung đột lịch (Conflict Alert) đỏ rực trên lịch.

### Màn hình 19: AI gợi ý bố trí phòng thiết bị

- **Vai trò thực hiện**: Phòng Cơ sở vật chất
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `airesource`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: AISuggest (Đề xuất ứng dụng AI số 2)
- **Phân loại**: BPMN task (BPMN Task ID: `AISuggest`)
- **Trigger (Kích hoạt)**: Sau bước đối chiếu lịch (CheckSchedule -> Flow_020 -> AISuggest).
- **Input (Dữ liệu vào)**: Quy mô sự kiện, tính chất chương trình, tình trạng lịch các hội trường và thiết bị trong kho.
- **Output (Dữ liệu ra)**: AI phân tích đưa ra phương án bố trí tối ưu (ví dụ: Hội trường H sức chứa 350 chỗ + Gói âm thanh chuẩn 4 mic không dây + 2 màn chiếu phụ).
- **Success State (Thành công)**: Hiển thị bảng so sánh phương án AI đề xuất kèm nút Áp dụng gợi ý để chuyển sang bước chuyên viên xác minh (Flow_021).
- **Error State (Lỗi / Ngoại lệ)**: Kho thiếu thiết bị chuyên dụng -> AI gợi ý phương án điều chỉnh cấu hình hoặc khung giờ khác còn trống.

### Màn hình 20: Xác minh và quyết định CSVC

- **Vai trò thực hiện**: Phòng Cơ sở vật chất
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `reviewresource`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: FacilityUser & Gateway GFacility (2 nhánh: Chưa / Có)
- **Phân loại**: BPMN task (BPMN Task ID: `FacilityUser, GFacility`)
- **Trigger (Kích hoạt)**: Chuyên viên CSVC tiếp nhận phương án từ Màn hình 19 (Flow_021 -> FacilityUser).
- **Input (Dữ liệu vào)**: Đơn mượn của BCH, lịch phòng thực tế, gợi ý của AI, tình trạng kỹ thuật thiết bị.
- **Output (Dữ liệu ra)**: Quyết định tại Exclusive Gateway GFacility: Nhánh 1: Chưa đáp ứng (Flow_024 -> AdjustFacility), Nhánh 2: Có đáp ứng (Flow_023 -> ApproveFacility).
- **Success State (Thành công)**: Lựa chọn quyết định chuẩn xác, luồng chuyển hướng thông minh.
- **Error State (Lỗi / Ngoại lệ)**: Chọn Chưa đáp ứng mà không ghi chú nguyên nhân -> Bắt buộc nhập lý do (ví dụ: Hội trường A trùng lịch bảo trì âm thanh).

### Màn hình 21: Điều chỉnh lịch hoặc thiết bị

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `facilityform`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: AdjustFacility (Nhánh Chưa đáp ứng của GFacility)
- **Phân loại**: BPMN task (BPMN Task ID: `AdjustFacility`)
- **Trigger (Kích hoạt)**: Phòng CSVC chọn Chưa đáp ứng tại GFacility (Flow_024 -> AdjustFacility).
- **Input (Dữ liệu vào)**: Lý do chưa đáp ứng của CSVC, danh sách các khung giờ và phòng còn trống do hệ thống đề xuất.
- **Output (Dữ liệu ra)**: Lựa chọn điều chỉnh phòng mới hoặc khung giờ mới (ví dụ: chuyển từ Hội trường A sang Hội trường H).
- **Success State (Thành công)**: Lưu phương án điều chỉnh thành công -> Quay lại Service Task FacilityForm (Flow_025) để hệ thống tự động đối chiếu lại.
- **Error State (Lỗi / Ngoại lệ)**: Chọn lại khung giờ vẫn đang báo đỏ (đã có người đặt) -> Hệ thống chặn không cho lưu.

### Màn hình 22: Xác nhận đặt phòng và thiết bị

- **Vai trò thực hiện**: Phòng Cơ sở vật chất
- **Giai đoạn quy trình**: Cơ sở vật chất
- **Kiểu Layout**: `sign`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ApproveFacility (Nhánh Có đáp ứng của GFacility)
- **Phân loại**: BPMN task (BPMN Task ID: `ApproveFacility`)
- **Trigger (Kích hoạt)**: Phòng CSVC xác nhận Có đáp ứng tại GFacility (Flow_023 -> ApproveFacility).
- **Input (Dữ liệu vào)**: Xác nhận của lãnh đạo Phòng CSVC, phân công cán bộ kỹ thuật trực hỗ trợ âm thanh ánh sáng.
- **Output (Dữ liệu ra)**: Phiếu bàn giao đặt phòng điện tử, khóa vị trí hội trường trên Booking Calendar toàn trường.
- **Success State (Thành công)**: Xác nhận cấp phòng thành công -> Hồ sơ chuyển sang giai đoạn chuẩn bị tổ chức sự kiện (PrepareEvent qua Flow_026).
- **Error State (Lỗi / Ngoại lệ)**: Chưa chọn cán bộ kỹ thuật phụ trách trực -> Cảnh báo nhắc nhở phân công người bàn giao.

### Màn hình 23: Chuẩn bị và tổ chức sự kiện

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Triển khai
- **Kiểu Layout**: `checklist`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: PrepareEvent (Thực hiện sự kiện thực tế)
- **Phân loại**: BPMN task (BPMN Task ID: `PrepareEvent`)
- **Trigger (Kích hoạt)**: Đến ngày tổ chức theo lịch đã duyệt (ApproveFacility -> Flow_026 -> PrepareEvent).
- **Input (Dữ liệu vào)**: Checklist triển khai: Nhận phòng, kiểm tra mic/máy chiếu, đón tiếp khách mời, điểm danh sinh viên, chụp ảnh minh chứng hoạt động.
- **Output (Dữ liệu ra)**: Nhật ký tổ chức sự kiện hoàn thành, ghi nhận số lượng người tham gia thực tế và ảnh minh chứng.
- **Success State (Thành công)**: Tích chọn hoàn thành tất cả các mục tổ chức -> Nút Chuyển sang hoàn trả CSVC sáng xanh (Flow_027 -> ReturnFacility).
- **Error State (Lỗi / Ngoại lệ)**: Phát sinh sự cố kỹ thuật ngoài kế hoạch -> Nhập biên bản ghi nhận sự cố để phục vụ giải trình hoàn trả.

### Màn hình 24: Hoàn trả cơ sở vật chất

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Bàn giao
- **Kiểu Layout**: `return`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ReturnFacility (Nghiệm thu bàn giao sau sự kiện)
- **Phân loại**: BPMN task (BPMN Task ID: `ReturnFacility`)
- **Trigger (Kích hoạt)**: Sự kiện kết thúc (PrepareEvent -> Flow_027 -> ReturnFacility).
- **Input (Dữ liệu vào)**: Bản tự kiểm kê tài sản hoàn trả: Tình trạng vệ sinh hội trường, số lượng micro/dây nối hoàn trả, chụp ảnh hiện trường sau sự kiện.
- **Output (Dữ liệu ra)**: Phiếu đề nghị kiểm tra nghiệm thu hoàn trả gửi sang Phòng CSVC.
- **Success State (Thành công)**: Gửi yêu cầu hoàn trả thành công -> Chuyển sang bước CSVC kiểm tra nghiệm thu (VerifyReturn qua Flow_028).
- **Error State (Lỗi / Ngoại lệ)**: Phát hiện tài sản hư hại hoặc mất mát mà chưa giải trình -> Yêu cầu điền Biên bản giải trình sự cố tài sản.

### Màn hình 25: Kiểm tra tình trạng hoàn trả

- **Vai trò thực hiện**: Phòng Cơ sở vật chất
- **Giai đoạn quy trình**: Bàn giao
- **Kiểu Layout**: `checklist`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: VerifyReturn & Gateway GReport (Yêu cầu báo cáo?)
- **Phân loại**: BPMN task (BPMN Task ID: `VerifyReturn, GReport`)
- **Trigger (Kích hoạt)**: Phòng CSVC nhận thông báo hoàn trả từ BCH (ReturnFacility -> Flow_028 -> VerifyReturn).
- **Input (Dữ liệu vào)**: Kết quả kiểm tra thực tế tại hội trường của cán bộ CSVC: Tình trạng thiết bị, độ sạch sẽ hội trường.
- **Output (Dữ liệu ra)**: Biên bản nghiệm thu hoàn trả tài sản có xác nhận của CSVC; kích hoạt Exclusive Gateway GReport: Nhánh Có báo cáo (Flow_031 -> AIReport), Nhánh Không báo cáo (Flow_030 -> MergeReport -> PayPackage).
- **Success State (Thành công)**: Ký biên bản nghiệm thu thành công, mở khóa phòng trên Booking Calendar.
- **Error State (Lỗi / Ngoại lệ)**: Thiết bị hỏng hóc chưa có biên bản xử lý trách nhiệm -> Cảnh báo tạm dừng nghiệm thu.

### Màn hình 26: AI tạo bản nháp báo cáo

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Báo cáo
- **Kiểu Layout**: `ai`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: AIReport (Đề xuất ứng dụng AI số 3)
- **Phân loại**: BPMN task (BPMN Task ID: `AIReport`)
- **Trigger (Kích hoạt)**: Gateway GReport rẽ nhánh Có yêu cầu báo cáo (Flow_031 -> AIReport).
- **Input (Dữ liệu vào)**: Toàn bộ dữ liệu sự kiện trong Ticket ID: Mục tiêu, kế hoạch, số lượng sinh viên tham gia thực tế, hình ảnh minh chứng, biên bản CSVC.
- **Output (Dữ liệu ra)**: Bản nháp Báo cáo tổng kết sự kiện tự động tạo sẵn theo thể thức chuẩn của Đoàn trường (gồm: Kết quả đạt được, Thuận lợi - Khó khăn, Kiến nghị).
- **Success State (Thành công)**: AI tạo dự thảo báo cáo thành công với đầy đủ các đề mục chuẩn sau 2 giây mô phỏng -> Chuyển sang Màn hình 27 (Flow_032).
- **Error State (Lỗi / Ngoại lệ)**: Dữ liệu minh chứng bị thiếu -> AI đánh dấu nhắc người dùng bổ sung số liệu định lượng.

### Màn hình 27: Kiểm tra và xác nhận báo cáo

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Báo cáo
- **Kiểu Layout**: `report`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ReviewReport (BCH rà soát và xác nhận bản báo cáo)
- **Phân loại**: BPMN task (BPMN Task ID: `ReviewReport`)
- **Trigger (Kích hoạt)**: Hoàn tất tạo nháp từ Màn hình 26 (AIReport -> Flow_032 -> ReviewReport).
- **Input (Dữ liệu vào)**: Bản nháp báo cáo do AI tạo, các số liệu thực tế được chỉnh sửa bổ sung, ý kiến của Bí thư Liên Chi Đoàn.
- **Output (Dữ liệu ra)**: Báo cáo tổng kết sự kiện chính thức đã ký xác nhận của BCH Liên Chi Đoàn.
- **Success State (Thành công)**: Bấm Xác nhận và gửi báo cáo -> Kích hoạt Service Task AutoReport (Flow_033).
- **Error State (Lỗi / Ngoại lệ)**: Để trống các chỉ tiêu kết quả bắt buộc -> Cảnh báo nhắc bổ sung số liệu hoàn thiện.

### Màn hình 28: Gửi báo cáo đến Đoàn trường

- **Vai trò thực hiện**: BCH Liên Chi Đoàn / Hệ thống tự động
- **Giai đoạn quy trình**: Báo cáo
- **Kiểu Layout**: `submit`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: AutoReport (Tự động hóa số 8 - Tự gửi báo cáo và lưu vết)
- **Phân loại**: BPMN task (BPMN Task ID: `AutoReport`)
- **Trigger (Kích hoạt)**: BCH bấm xác nhận tại Màn hình 27 (ReviewReport -> Flow_033 -> AutoReport).
- **Input (Dữ liệu vào)**: Báo cáo tổng kết hoàn chỉnh đã xác nhận.
- **Output (Dữ liệu ra)**: Báo cáo được tự chuyển đến hòm thư Đoàn trường, cập nhật hồ sơ lưu trữ và chuyển luồng qua MergeReport (Flow_034 -> Flow_035 -> PayPackage).
- **Success State (Thành công)**: Thông báo: Báo cáo tổng kết đã được gửi thành công đến Đoàn trường và lưu vào hồ sơ Ticket ID.
- **Error State (Lỗi / Ngoại lệ)**: Không áp dụng (Tự động hóa hoàn toàn).

### Màn hình 29: Lập và rà soát hồ sơ chứng từ

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `finance`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: PayPackage & AutoForwardPay (Tự động hóa số 7 - Lập và chuyển chứng từ KHTC)
- **Phân loại**: BPMN task (BPMN Task ID: `PayPackage, AutoForwardPay`)
- **Trigger (Kích hoạt)**: Sau khi qua Merge Gateway MergeReport (Flow_035 -> PayPackage).
- **Input (Dữ liệu vào)**: Hóa đơn giá trị gia tăng (VAT), phiếu chi, hợp đồng biểu diễn/thuê thiết bị, bảng kê chi tiết, ảnh minh chứng chi tiêu, thông tin tài khoản thụ hưởng.
- **Output (Dữ liệu ra)**: Bộ hồ sơ thanh quyết toán tài chính số hóa hoàn chỉnh.
- **Success State (Thành công)**: Tổng chi phí thực tế khớp hoặc có giải trình chênh lệch hợp lệ -> Bấm Gửi KHTC kích hoạt Service Task AutoForwardPay (Flow_036 -> Flow_037 -> CheckPay).
- **Error State (Lỗi / Ngoại lệ)**: Khoản chi trên 200.000 VNĐ thiếu hóa đơn tài chính hợp lệ -> Cảnh báo đỏ yêu cầu đính kèm hóa đơn hợp lệ.

### Màn hình 30: Kiểm tra chứng từ thanh toán

- **Vai trò thực hiện**: Phòng Kế hoạch Tài chính
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `financecheck`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: CheckPay & Gateway GPay (2 nhánh: Thiếu / Đủ)
- **Phân loại**: BPMN task (BPMN Task ID: `CheckPay, GPay`)
- **Trigger (Kích hoạt)**: KHTC tiếp nhận hồ sơ từ AutoForwardPay (Flow_037 -> CheckPay).
- **Input (Dữ liệu vào)**: Bộ chứng từ của BCH, đối chiếu với Bảng dự trù kinh phí ban đầu đã được Khoa và Đoàn duyệt.
- **Output (Dữ liệu ra)**: Quyết định tại Exclusive Gateway GPay: Nhánh 1: Thiếu chứng từ (Flow_040 -> FixPay), Nhánh 2: Đầy đủ chứng từ (Flow_039 -> SubmitApproval).
- **Success State (Thành công)**: Ghi nhận kết quả kiểm toán chứng từ chính xác, rõ ràng.
- **Error State (Lỗi / Ngoại lệ)**: Chọn Thiếu mà không ghi chú cụ thể chứng từ bị từ chối/bổ sung -> Bắt buộc nhập chi tiết lỗi chứng từ.

### Màn hình 31: Bổ sung hồ sơ thanh toán

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `feedback`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: FixPay (Nhánh Thiếu của GPay)
- **Phân loại**: BPMN task (BPMN Task ID: `FixPay`)
- **Trigger (Kích hoạt)**: KHTC chọn Thiếu tại GPay (Flow_040 -> FixPay).
- **Input (Dữ liệu vào)**: Ý kiến yêu cầu bổ sung/giải trình của KHTC, khung tải lên hóa đơn/phiếu thu bổ sung thay thế.
- **Output (Dữ liệu ra)**: Bộ chứng từ đã được bổ sung hoàn chỉnh -> Gửi lại KHTC qua AutoForwardPay (Flow_041 -> Flow_037 -> CheckPay).
- **Success State (Thành công)**: Tải lên đủ chứng từ bổ sung theo yêu cầu -> Nút Nộp lại kích hoạt thành công.
- **Error State (Lỗi / Ngoại lệ)**: Chưa tải lên chứng từ thay thế cho hóa đơn bị từ chối -> Nút nộp bị vô hiệu hóa.

### Màn hình 32: Trình hồ sơ duyệt thanh toán

- **Vai trò thực hiện**: Phòng Kế hoạch Tài chính
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `submit`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: SubmitApproval (KHTC lập tờ trình trình cấp thẩm quyền duyệt)
- **Phân loại**: BPMN task (BPMN Task ID: `SubmitApproval`)
- **Trigger (Kích hoạt)**: KHTC xác nhận Đủ tại GPay (Flow_039 -> SubmitApproval).
- **Input (Dữ liệu vào)**: Bộ chứng từ hợp lệ, tổng số tiền đề nghị thanh toán, tài khoản thụ hưởng, nguồn ngân sách chi trả.
- **Output (Dữ liệu ra)**: Tờ trình phê duyệt thanh toán chuyển sang cấp có thẩm quyền (Flow_042 -> ApprovePayment).
- **Success State (Thành công)**: Tờ trình được lập thành công kèm chữ ký nháy của Trưởng phòng KHTC.
- **Error State (Lỗi / Ngoại lệ)**: Số tiền trên tờ trình sai lệch so với tổng giá trị hóa đơn -> Cảnh báo khóa tờ trình.

### Màn hình 33: Phê duyệt thanh toán

- **Vai trò thực hiện**: Phòng Kế hoạch Tài chính (hoặc Cấp có thẩm quyền / Ban Giám hiệu)
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `review`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: ApprovePayment & Gateway GApproval (2 nhánh: Không / Có)
- **Phân loại**: BPMN task (BPMN Task ID: `ApprovePayment, GApproval`)
- **Trigger (Kích hoạt)**: Cấp thẩm quyền mở tờ trình từ Màn hình 32 (Flow_042 -> ApprovePayment).
- **Input (Dữ liệu vào)**: Tờ trình thanh toán, biên bản nghiệm thu sự kiện, kết quả thẩm định tài chính của KHTC.
- **Output (Dữ liệu ra)**: Quyết định tại Exclusive Gateway GApproval: Nhánh 1: Không được duyệt (Flow_044 -> RefusePay), Nhánh 2: Có được duyệt (Flow_046 -> PerformPay).
- **Success State (Thành công)**: Ghi nhận quyết định phê duyệt tài chính tối cao vào hồ sơ Ticket ID.
- **Error State (Lỗi / Ngoại lệ)**: Chọn Không phê duyệt mà không ghi lý do -> Bắt buộc nhập văn bản giải trình từ chối.

### Màn hình 34: Thông báo không thanh toán

- **Vai trò thực hiện**: Phòng Kế hoạch Tài chính
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `notice`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: RefusePay (Nhánh Không của GApproval)
- **Phân loại**: BPMN task (BPMN Task ID: `RefusePay`)
- **Trigger (Kích hoạt)**: Cấp thẩm quyền chọn Không phê duyệt tại GApproval (Flow_044 -> RefusePay).
- **Input (Dữ liệu vào)**: Lý do không phê duyệt chi thanh toán (ví dụ: chi phí ngoài danh mục cho phép hoặc sai nguồn vốn).
- **Output (Dữ liệu ra)**: Thông báo từ chối thanh toán chính thức gửi đến BCH Liên Chi Đoàn và chuyển sang bước đóng hồ sơ Close (Flow_045 -> Close).
- **Success State (Thành công)**: Phát hành thông báo từ chối thanh toán số hóa thành công, lưu vào lịch sử Ticket ID.
- **Error State (Lỗi / Ngoại lệ)**: Không áp dụng.

### Màn hình 35: Thực hiện thanh toán

- **Vai trò thực hiện**: Phòng Kế hoạch Tài chính
- **Giai đoạn quy trình**: Thanh toán
- **Kiểu Layout**: `payment`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: PerformPay (Nhánh Có của GApproval)
- **Phân loại**: BPMN task (BPMN Task ID: `PerformPay`)
- **Trigger (Kích hoạt)**: Cấp thẩm quyền chọn Có phê duyệt tại GApproval (Flow_046 -> PerformPay).
- **Input (Dữ liệu vào)**: Lệnh chi tiền, ủy nhiệm chi, thông tin tài khoản thụ hưởng của Liên Chi Đoàn/Nhà cung cấp.
- **Output (Dữ liệu ra)**: Ủy nhiệm chi / Biên lai điện tử xác nhận đã giải ngân thanh toán thành công (Flow_047 -> Close).
- **Success State (Thành công)**: Xác nhận chuyển tiền thành công, đính kèm chứng từ ngân hàng số hóa vào hồ sơ Ticket ID.
- **Error State (Lỗi / Ngoại lệ)**: Số tài khoản thụ hưởng không hợp lệ -> Cảnh báo kiểm tra lại thông tin ngân hàng.

### Màn hình 36: Xác nhận và lưu trữ hồ sơ

- **Vai trò thực hiện**: BCH Liên Chi Đoàn
- **Giai đoạn quy trình**: Hoàn tất
- **Kiểu Layout**: `archive`
- **Căn cứ BPMN / Cơ sở**: BPMN Task: Close & End Event: End (Hoàn tất toàn bộ quy trình)
- **Phân loại**: BPMN task (BPMN Task ID: `Close, End`)
- **Trigger (Kích hoạt)**: Tiếp nhận kết quả từ RefusePay (Flow_045) hoặc PerformPay (Flow_047) chuyển về Close.
- **Input (Dữ liệu vào)**: Thông báo hoàn tất (thanh toán thành công hoặc không thanh toán), toàn bộ tài liệu trong vòng đời Ticket ID.
- **Output (Dữ liệu ra)**: Hồ sơ sự kiện được đóng dấu điện tử ĐÃ LƯU TRỮ VÀ HOÀN TẤT, kết thúc quy trình tại End Event End (Flow_048).
- **Success State (Thành công)**: Hiển thị huy hiệu Hoàn tất quy trình, cho phép xuất trọn bộ hồ sơ điện tử (PDF Export) để lưu trữ nội bộ.
- **Error State (Lỗi / Ngoại lệ)**: Không áp dụng.

## 3. TỔNG KẾT 8 BƯỚC TỰ ĐỘNG HÓA & 3 ỨNG DỤNG AI

### 8 Bước Tự Động Hóa (Nhom3.docx)
1. **Nộp hồ sơ cho BCN Khoa** (`SubmitKhoa` - Màn hình 07): Tự động chuyển giao điện tử và gửi thông báo tức thời, loại bỏ nộp giấy.
2. **Chuẩn bị hồ sơ đã duyệt cấp Khoa** (Màn hình 11): Tự động đóng gói hồ sơ có xác nhận của Khoa theo mẫu chuẩn.
3. **Nộp hồ sơ cho Đoàn trường** (`ForwardDoan` - Màn hình 12): Tự động định tuyến hồ sơ đến hòm thư Đoàn trường kèm trạng thái thời gian thực.
4. **Lập đơn mượn CSVC** (`FacilityForm` - Màn hình 17): Kế thừa 100% dữ liệu kế hoạch đã duyệt, tự động điền đơn mượn địa điểm và thiết bị.
5. **Gửi yêu cầu sử dụng CSVC**: Tự động gửi đơn mượn đến Phòng CSVC và nhắc nhở cán bộ phụ trách.
6. **Kiểm tra thời gian, phòng và thiết bị** (`CheckSchedule` - Màn hình 18): Hệ thống đối chiếu Shared Calendar thời gian thực, cảnh báo đỏ khi trùng lịch.
7. **Gửi hồ sơ cho Phòng KHTC** (`AutoForwardPay` - Màn hình 29/30): Tự động chuyển bộ chứng từ tài chính sang hòm thư công việc của KHTC.
8. **Gửi báo cáo cho Đoàn trường** (`AutoReport` - Màn hình 28): Tự động gửi báo cáo tổng kết sau khi BCH xác nhận hoàn tất và lưu vết lịch sử.

### 3 Ứng Dụng AI Đề Xuất (Nhom3.docx)
> [!IMPORTANT]
> AI trong MY DUE chỉ đóng vai trò hỗ trợ gợi ý (Assistant/Copilot), quyền ra quyết định tối cao luôn thuộc về con người có thẩm quyền.

1. **AI rà soát nội dung kế hoạch sự kiện** (`AIReview` - Màn hình 05): Hỗ trợ đọc hiểu nội dung, phát hiện thiếu sót (timeline, phương án dự phòng) và gợi ý chỉnh sửa câu chữ chuẩn hóa.
2. **AI gợi ý bố trí phòng và thiết bị** (`AISuggest` - Màn hình 19): Phân tích quy mô người tham gia và tính chất sự kiện để đề xuất phương án hội trường và gói thiết bị âm thanh/ánh sáng tối ưu.
3. **AI tạo bản nháp báo cáo tổng kết** (`AIReport` - Màn hình 26): Tự động tổng hợp số liệu thực tế, ảnh minh chứng thành dự thảo báo cáo tổng kết chuẩn thể thức quy định.

