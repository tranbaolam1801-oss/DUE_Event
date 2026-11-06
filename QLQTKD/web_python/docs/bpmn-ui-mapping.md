# BẢNG ĐỐI CHIẾU TRUY VẾT BPMN → GIAO DIỆN UI (TRACEABILITY MATRIX)

> **Dự án**: Cổng thông tin Quản lý Quy trình Xét duyệt và Tổ chức Sự kiện MY DUE  
> **Mô hình quy trình gốc**: `ToBe_Nhom3.bpmn` (BPMN 2.0 XML chuẩn mực 5 Lanes)  
> **Mức độ bao phủ**: 100% (Toàn bộ 33 Task, Gateway, Event đều có màn hình hoặc trạng thái tương ứng)  
> **Nguyên tắc phân định**: User Task có giao diện thao tác người dùng; Service Task biểu diễn bằng trạng thái tự động/inline; Gateway XOR thể hiện bằng các nút hành động phân nhánh.

## BẢNG ĐỐI CHIẾU CHI TIẾT TỪNG PHẦN TỬ BPMN

| BPMN ID | Tên phần tử | Loại BPMN | Lane (Vai trò) | Màn hình liên quan | Cách thể hiện trên giao diện UI | Luồng tiếp theo |
|:--------|:------------|:----------|:---------------|:-------------------|:--------------------------------|:----------------|
| `Start` | Khởi tạo yêu cầu tổ chức | `startEvent` | BCH Liên Chi Đoàn | **00, 03** | Nút Tạo hồ sơ mới trên Dashboard và biểu mẫu khởi tạo E-form | `Prepare (Flow_000)` |
| `Prepare` | Lập kế hoạch, dự trù và hồ sơ | `userTask` | BCH Liên Chi Đoàn | **03, 04** | Form nhập liệu đa bước: Thông tin sự kiện, kịch bản, dự trù kinh phí | `CheckFields (Flow_001)` |
| `CheckFields` | Kiểm tra trường bắt buộc | `serviceTask` | BCH Liên Chi Đoàn (Hệ thống) | **03** | Client-side validation inline đỏ dưới từng trường bắt buộc | `AIReview (Flow_002)` |
| `AIReview` | AI rà soát nội dung và gợi ý sửa | `serviceTask` | BCH Liên Chi Đoàn (AI Assistant) | **05** | Giao diện phân tích AI mô phỏng với thẻ gợi ý chỉnh sửa thông minh | `Gateway_0q4ts0h (Flow_0vqvedn) -> BCHConfirm (Flow_03x58u6)` |
| `Gateway_0q4ts0h` | Điểm hội tụ hoàn thiện hồ sơ | `exclusiveGateway (Merge)` | BCH Liên Chi Đoàn | **06** | Hội tụ 3 luồng: Sau AIReview, sau FixKhoa, sau FixDoan | `BCHConfirm (Flow_03x58u6)` |
| `BCHConfirm` | BCH kiểm chứng, hoàn thiện hồ sơ | `userTask` | BCH Liên Chi Đoàn | **06** | Checklist kiểm chứng trách nhiệm và nút Nộp hồ sơ | `SubmitKhoa (Flow_004)` |
| `SubmitKhoa` | Chuyển hồ sơ đến BCN Khoa | `serviceTask` | BCH Liên Chi Đoàn / Hệ thống | **07** | Màn hình biên nhận nộp điện tử tự động và trạng thái chuyển giao | `ReviewKhoa (Flow_005)` |
| `ReviewKhoa` | Thẩm định kế hoạch / nội dung | `userTask` | Ban Chủ nhiệm Khoa | **08, 09** | Hòm thư xử lý Khoa (08) và màn hình thẩm định 3 nhánh hành động (09) | `GKhoa (Flow_006)` |
| `GKhoa` | Kết quả thẩm định Khoa? | `exclusiveGateway (Decision)` | Ban Chủ nhiệm Khoa | **09** | 3 nút lựa chọn: Sửa (Flow_007), Từ chối (Flow_009), Duyệt (Flow_010) | `Sửa -> FixKhoa (10) | Từ chối -> RejectKhoa | Duyệt -> SignKhoa (11)` |
| `FixKhoa` | Tổng hợp góp ý và sửa hồ sơ | `userTask` | BCH Liên Chi Đoàn | **10** | Giao diện tiếp thu ý kiến Khoa và chỉnh sửa kế hoạch | `Gateway_0q4ts0h (Flow_008) -> BCHConfirm (06)` |
| `RejectKhoa` | Không chấp thuận (Khoa từ chối) | `endEvent` | Ban Chủ nhiệm Khoa | **09 (Modal/State)** | Thông báo kết thúc quy trình do Khoa từ chối phê duyệt kèm văn bản giải trình | `Kết thúc quy trình (End of Life)` |
| `SignKhoa` | Khoa ký xác nhận | `userTask` | Ban Chủ nhiệm Khoa | **11** | Giao diện ký duyệt điện tử và đóng dấu số xác thực của BCN Khoa | `ForwardDoan (Flow_011)` |
| `ForwardDoan` | Chuyển hồ sơ đến Đoàn trường | `serviceTask` | Ban Chủ nhiệm Khoa / Hệ thống | **12** | Trạng thái tự động chuyển giao liên cấp kèm cập nhật tiến độ Ticket ID | `ReviewDoan (Flow_012)` |
| `ReviewDoan` | Đoàn trường thẩm định hồ sơ | `userTask` | Đoàn Trường | **13, 14** | Hòm thư xét duyệt Đoàn (13) và màn hình thẩm định an toàn/lịch Đoàn (14) | `GDoan (Flow_013)` |
| `GDoan` | Kết quả thẩm định Đoàn trường? | `exclusiveGateway (Decision)` | Đoàn Trường | **14** | 3 nút lựa chọn: Sửa (Flow_015), Từ chối (Flow_017), Duyệt (Flow_014) | `Sửa -> FixDoan (15) | Từ chối -> RejectDoan | Duyệt -> ApproveDoan (16)` |
| `FixDoan` | Chỉnh sửa theo góp ý Đoàn trường | `userTask` | BCH Liên Chi Đoàn | **15** | Giao diện tiếp thu ý kiến Đoàn trường và chỉnh lý hồ sơ | `Gateway_0q4ts0h (Flow_016) -> BCHConfirm (06)` |
| `RejectDoan` | Không chấp thuận (Đoàn từ chối) | `endEvent` | Đoàn Trường | **14 (Modal/State)** | Thông báo dừng tổ chức do Đoàn trường không phê duyệt | `Kết thúc quy trình (End of Life)` |
| `ApproveDoan` | Ký duyệt, đóng dấu kế hoạch | `userTask` | Đoàn Trường | **16** | Ký duyệt và đóng dấu mộc đỏ số Đoàn Trường phê duyệt - Cho phép tổ chức | `FacilityForm (Flow_018)` |
| `FacilityForm` | Tạo đơn mượn CSVC | `serviceTask` | BCH Liên Chi Đoàn (Hệ thống) | **17** | Tự động điền biểu mẫu mượn địa điểm và thiết bị dựa trên kế hoạch đã duyệt | `CheckSchedule (Flow_019)` |
| `CheckSchedule` | Đối chiếu lịch / danh mục thiết bị | `serviceTask` | Phòng Cơ sở vật chất / Hệ thống | **18** | Lưới lịch Shared Booking Calendar đối chiếu tự động, cảnh báo xung đột giờ | `AISuggest (Flow_020)` |
| `AISuggest` | AI gợi ý bố trí phòng và thiết bị | `serviceTask` | Phòng Cơ sở vật chất (AI Assistant) | **19** | Thẻ so sánh các phương án bố trí không gian và gói thiết bị tối ưu | `FacilityUser (Flow_021)` |
| `FacilityUser` | CSVC xác minh và quyết định | `userTask` | Phòng Cơ sở vật chất | **20** | Bảng thẩm định thực tế của chuyên viên CSVC kèm 2 lựa chọn | `GFacility (Flow_022)` |
| `GFacility` | Đáp ứng cơ sở vật chất? | `exclusiveGateway (Decision)` | Phòng Cơ sở vật chất | **20** | 2 nút quyết định: Chưa đáp ứng (Flow_024) / Có đáp ứng (Flow_023) | `Chưa -> AdjustFacility (21) | Có -> ApproveFacility (22)` |
| `AdjustFacility` | BCH điều chỉnh lịch / thiết bị | `userTask` | BCH Liên Chi Đoàn | **21** | Giao diện chọn lại phòng trống hoặc khung giờ mới theo gợi ý | `FacilityForm (Flow_025)` |
| `ApproveFacility` | CSVC xác nhận đặt phòng, thiết bị | `userTask` | Phòng Cơ sở vật chất | **22** | Phiếu xác nhận cấp phòng điện tử, khóa lịch và phân công kỹ thuật viên | `PrepareEvent (Flow_026)` |
| `PrepareEvent` | BCH chuẩn bị và tổ chức sự kiện | `userTask` | BCH Liên Chi Đoàn | **23** | Checklist điều hành thực tế tại sự kiện và tải lên ảnh minh chứng | `ReturnFacility (Flow_027)` |
| `ReturnFacility` | BCH hoàn trả cơ sở vật chất | `userTask` | BCH Liên Chi Đoàn | **24** | Phiếu đề nghị nghiệm thu hoàn trả tài sản sau khi kết thúc chương trình | `VerifyReturn (Flow_028)` |
| `VerifyReturn` | CSVC kiểm tra tình trạng hoàn trả | `userTask` | Phòng Cơ sở vật chất | **25** | Biên bản kiểm tra nghiệm thu tài sản và xác nhận hoàn trả nguyên vẹn | `GReport (Flow_029)` |
| `GReport` | Yêu cầu báo cáo tổng kết? | `exclusiveGateway (Decision)` | Đoàn Trường / Quy chế | **25** | Điều kiện phân nhánh: Có yêu cầu báo cáo (Flow_031) / Không yêu cầu (Flow_030) | `Có -> AIReport (26) | Không -> MergeReport (Flow_030)` |
| `AIReport` | AI tạo bản nháp báo cáo | `serviceTask` | BCH Liên Chi Đoàn (AI Assistant) | **26** | Giao diện AI tự động tổng hợp số liệu Ticket ID thành dự thảo báo cáo tổng kết | `ReviewReport (Flow_032)` |
| `ReviewReport` | BCH kiểm tra và xác nhận báo cáo | `userTask` | BCH Liên Chi Đoàn | **27** | Trình soạn thảo xem trước, chỉnh sửa và xác nhận báo cáo tổng kết | `AutoReport (Flow_033)` |
| `AutoReport` | Gửi báo cáo đến Đoàn trường | `serviceTask` | BCH Liên Chi Đoàn / Hệ thống | **28** | Trạng thái tự động gửi báo cáo và lưu vết vào hồ sơ sự kiện | `MergeReport (Flow_034)` |
| `MergeReport` | Điểm hội tụ thanh quyết toán | `exclusiveGateway (Merge)` | BCH Liên Chi Đoàn | **29** | Hội tụ 2 luồng: Nhánh không báo cáo (Flow_030) và Nhánh đã gửi báo cáo (Flow_034) | `PayPackage (Flow_035)` |
| `PayPackage` | BCH lập và rà soát chứng từ | `userTask` | BCH Liên Chi Đoàn | **29** | Bảng kê quyết toán kinh phí, tải lên hóa đơn VAT, chứng từ chi tiêu | `AutoForwardPay (Flow_036)` |
| `AutoForwardPay` | Chuyển hồ sơ đến KHTC | `serviceTask` | BCH Liên Chi Đoàn / Hệ thống | **29, 30** | Tự động chuyển hồ sơ chứng từ sang hòm thư công việc KHTC | `CheckPay (Flow_037)` |
| `CheckPay` | KHTC kiểm tra chứng từ | `userTask` | Phòng Kế hoạch Tài chính | **30** | Giao diện kiểm toán chứng từ tài chính đối chiếu dự toán ban đầu | `GPay (Flow_038)` |
| `GPay` | Hồ sơ chứng từ đầy đủ? | `exclusiveGateway (Decision)` | Phòng Kế hoạch Tài chính | **30** | 2 nút quyết định: Thiếu (Flow_040) / Đủ (Flow_039) | `Thiếu -> FixPay (31) | Đủ -> SubmitApproval (32)` |
| `FixPay` | BCH bổ sung hồ sơ thanh toán | `userTask` | BCH Liên Chi Đoàn | **31** | Giao diện tải lên chứng từ bổ sung/thay thế theo yêu cầu KHTC | `AutoForwardPay (Flow_041) -> CheckPay (Flow_037)` |
| `SubmitApproval` | KHTC trình cấp có thẩm quyền duyệt | `userTask` | Phòng Kế hoạch Tài chính | **32** | Tờ trình đề nghị phê duyệt chi thanh toán chuyển cấp thẩm quyền | `ApprovePayment (Flow_042)` |
| `ApprovePayment` | Phê duyệt thanh toán theo thẩm quyền | `userTask` | Phòng KHTC / Cấp thẩm quyền | **33** | Giao diện phê duyệt giải ngân của Chủ tài khoản/Ban Giám hiệu | `GApproval (Flow_043)` |
| `GApproval` | Thanh toán được phê duyệt? | `exclusiveGateway (Decision)` | Phòng KHTC / Cấp thẩm quyền | **33** | 2 nút quyết định: Không duyệt (Flow_044) / Có duyệt (Flow_046) | `Không -> RefusePay (34) | Có -> PerformPay (35)` |
| `RefusePay` | Thông báo không thanh toán | `userTask` | Phòng Kế hoạch Tài chính | **34** | Văn bản thông báo từ chối thanh toán số hóa nêu rõ lý do | `Close (Flow_045)` |
| `PerformPay` | KHTC thực hiện thanh toán | `userTask` | Phòng Kế hoạch Tài chính | **35** | Giao diện giải ngân thực hiện ủy nhiệm chi chuyển khoản ngân hàng | `Close (Flow_047)` |
| `Close` | BCH nhận xác nhận, lưu hồ sơ | `userTask` | BCH Liên Chi Đoàn | **36** | Giao diện lưu trữ điện tử toàn bộ hồ sơ Ticket ID và tải trọn bộ tài liệu | `End (Flow_048)` |
| `End` | Hoàn tất quy trình | `endEvent` | BCH Liên Chi Đoàn | **36** | Huy hiệu hoàn thành vòng đời sự kiện thành công | `Kết thúc quy trình thành công` |

---

## CHI TIẾT CÁC CỔNG RẼ NHÁNH XOR VÀ CÁCH MÔ PHỎNG PROTOTYPE

### 1. Cổng `GKhoa` (Kết quả thẩm định của BCN Khoa)
- **Nhánh Duyệt (`Flow_010`)**: Bấm nút **Phê duyệt** (màu xanh lá `#0D914B`) -> Mở Màn hình 11 (`SignKhoa`) để ký duyệt.
- **Nhánh Sửa (`Flow_007`)**: Bấm nút **Yêu cầu chỉnh sửa** (màu cam `#F36B21`) -> Mở popup nhập lý do -> Chuyển luồng sang Màn hình 10 (`FixKhoa`) cho BCH sửa.
- **Nhánh Từ chối (`Flow_009`)**: Bấm nút **Từ chối** (màu đỏ) -> Mở modal xác nhận từ chối hoàn toàn -> Kết thúc quy trình tại `RejectKhoa`.

### 2. Cổng `GDoan` (Kết quả thẩm định của Đoàn Trường)
- **Nhánh Duyệt (`Flow_014`)**: Bấm nút **Ký duyệt & Cấp phép** -> Mở Màn hình 16 (`ApproveDoan`) để đóng dấu mộc số.
- **Nhánh Sửa (`Flow_015`)**: Bấm nút **Yêu cầu chỉnh sửa** -> Mở Màn hình 15 (`FixDoan`) cho BCH cập nhật lại.
- **Nhánh Từ chối (`Flow_017`)**: Bấm nút **Không chấp thuận** -> Kết thúc sự kiện tại `RejectDoan`.

### 3. Cổng `GFacility` (Khả năng đáp ứng của Phòng CSVC)
- **Nhánh Có (`Flow_023`)**: Bấm nút **Xác nhận đặt phòng** -> Mở Màn hình 22 (`ApproveFacility`) cấp phiếu sử dụng.
- **Nhánh Chưa (`Flow_024`)**: Bấm nút **Chưa đáp ứng / Báo trùng** -> Mở Màn hình 21 (`AdjustFacility`) cho BCH chọn phương án thay thế.

### 4. Cổng `GReport` (Yêu cầu nộp báo cáo tổng kết)
- **Nhánh Có (`Flow_031`)**: Quy chế yêu cầu nộp báo cáo -> Hệ thống tự kích hoạt Màn hình 26 (`AIReport`) tạo bản nháp.
- **Nhánh Không (`Flow_030`)**: Sự kiện nhỏ không cần báo cáo -> Chuyển thẳng qua `MergeReport` đến Màn hình 29 (`PayPackage`) quyết toán tài chính.

### 5. Cổng `GPay` (Tính đầy đủ hợp lệ của bộ chứng từ tại KHTC)
- **Nhánh Đủ (`Flow_039`)**: Chứng từ đầy đủ hóa đơn VAT -> Mở Màn hình 32 (`SubmitApproval`) lập tờ trình chi.
- **Nhánh Thiếu (`Flow_040`)**: Hóa đơn sai/thiếu -> Mở Màn hình 31 (`FixPay`) cho BCH bổ sung chứng từ.

### 6. Cổng `GApproval` (Phê duyệt chi thanh toán tối cao)
- **Nhánh Có (`Flow_046`)**: Lãnh đạo duyệt chi -> Mở Màn hình 35 (`PerformPay`) lập ủy nhiệm chi giải ngân tiền.
- **Nhánh Không (`Flow_044`)**: Lãnh đạo không duyệt chi -> Mở Màn hình 34 (`RefusePay`) thông báo không thanh toán.

