"""
Dịch vụ AI Hỗ trợ theo đề xuất To-Be (Nhom3.docx)
Minh bạch phạm vi: Hỗ trợ rà soát cấu trúc hồ sơ, gợi ý bố trí CSVC và dự thảo báo cáo.
Mọi gợi ý đều cần người dùng có thẩm quyền kiểm tra và phê duyệt.
"""

def review_event_proposal(title, objectives, program_content, timeline, staffing, risk_plan, budget_items, expected_attendees):
    """
    1. AI rà soát nội dung và gợi ý sửa (BPMN: AIReview)
    Kiểm tra độ đầy đủ và đưa ra khuyến nghị cải tiến
    """
    suggestions = []
    completeness_score = 100
    
    if not title or len(title.strip()) < 10:
        suggestions.append({
            "field": "Tiêu đề",
            "type": "warning",
            "message": "Tên sự kiện cần rõ ràng, nêu bật mục đích (ví dụ: 'Hội thảo Khoa học Sinh viên Nghiên cứu & Khởi nghiệp 2026')."
        })
        completeness_score -= 15
        
    if not objectives or len(objectives.strip()) < 30:
        suggestions.append({
            "field": "Mục tiêu & Ý nghĩa",
            "type": "info",
            "message": "Nên cụ thể hóa mục tiêu theo chuẩn SMART (số lượng sinh viên tiếp cận, kỹ năng đạt được)."
        })
        completeness_score -= 15
        
    if not timeline or len(timeline.strip()) < 30:
        suggestions.append({
            "field": "Tiến độ & Timeline",
            "type": "warning",
            "message": "Chưa có mốc thời gian chuẩn bị và tổng duyệt chi tiết. Khuyến nghị lập lịch trước ít nhất 5 ngày."
        })
        completeness_score -= 15
        
    if not staffing or len(staffing.strip()) < 20:
        suggestions.append({
            "field": "Phân công nhân sự",
            "type": "info",
            "message": "Khuyến nghị phân định rõ: Trưởng ban, Tiểu ban Hậu cần, Tiểu ban Truyền thông, Tiểu ban Kỹ thuật."
        })
        completeness_score -= 10
        
    if not risk_plan or len(risk_plan.strip()) < 20:
        suggestions.append({
            "field": "Dự phòng rủi ro",
            "type": "warning",
            "message": "Cần bổ sung phương án ứng phó sự cố: mất điện, mưa bão, âm thanh trục trặc, sơ cứu y tế."
        })
        completeness_score -= 20
        
    if not budget_items or len(budget_items) == 0:
        suggestions.append({
            "field": "Dự trù kinh phí",
            "type": "danger",
            "message": "Chưa có danh mục dự toán kinh phí. Cần kê khai các mục in ấn, nước uống, bồi dưỡng diễn giả."
        })
        completeness_score -= 25

    return {
        "score": max(20, completeness_score),
        "is_ready": completeness_score >= 70,
        "suggestions": suggestions,
        "summary": "Hồ sơ đã đạt tiêu chuẩn cơ bản" if completeness_score >= 70 else "Hồ sơ cần hoàn thiện thêm một số mục trọng yếu"
    }

def suggest_facility_allocation(expected_attendees, facilities):
    """
    2. AI gợi ý bố trí phòng và thiết bị (BPMN: AISuggest)
    Gợi ý giảng đường / hội trường có sức chứa tối ưu và không lãng phí
    """
    attendees = int(expected_attendees or 100)
    recommendations = []
    
    for f in facilities:
        cap = int(f.get('Capacity') or 0)
        if cap >= attendees and cap <= attendees * 2.5:
            recommendations.append({
                "facility_id": f['FacilityId'],
                "name": f['Name'],
                "code": f['Code'],
                "capacity": cap,
                "fit_rating": "Rất phù hợp (Tỷ lệ lấp đầy tối ưu)",
                "recommended_equipment": ["Micro không dây (02 cái)", "Máy chiếu & Màn chiếu", "Hệ thống âm thanh hội trường"]
            })
        elif cap >= attendees:
            recommendations.append({
                "facility_id": f['FacilityId'],
                "name": f['Name'],
                "code": f['Code'],
                "capacity": cap,
                "fit_rating": "Có thể sử dụng (Sức chứa lớn hơn nhu cầu)",
                "recommended_equipment": ["Micro không dây (04 cái)", "Máy chiếu công suất lớn", "Âm thanh & Ánh sáng sân khấu"]
            })
            
    if not recommendations and facilities:
        # Lấy phòng lớn nhất
        largest = max(facilities, key=lambda x: x.get('Capacity', 0))
        recommendations.append({
            "facility_id": largest['FacilityId'],
            "name": largest['Name'],
            "code": largest['Code'],
            "capacity": largest.get('Capacity', 0),
            "fit_rating": "Cần xem xét chia phiên hoặc mở rộng không gian",
            "recommended_equipment": ["Hệ thống màn hình LED phụ", "Âm thanh tăng cường"]
        })
        
    return recommendations

def generate_report_draft(event, plans, budget_items):
    """
    3. AI tạo bản nháp báo cáo tổng kết (BPMN: AIReport)
    Tổng hợp dữ liệu sự kiện để tạo văn bản báo cáo hoàn chỉnh
    """
    title = event.get('Title', 'Sự kiện')
    dept = event.get('DepartmentName', 'Liên Chi Đoàn')
    attendees = event.get('ExpectedAttendees', 150)
    starts = str(event.get('StartsAt', ''))[:10]
    total_budget = sum(float(b.get('EstimatedAmount', 0)) for b in budget_items)
    
    draft = f"""CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập – Tự do – Hạnh phúc
---------------------------------
BÁO CÁO TỔNG KẾT TỔ CHỨC SỰ KIỆN

1. THÔNG TIN CHUNG:
- Tên sự kiện: {title}
- Đơn vị chủ trì: {dept}
- Thời gian tổ chức: {starts}
- Địa điểm: Trường Đại học Kinh tế – Đại học Đà Nẵng
- Số lượng đại biểu & sinh viên tham dự: {attendees} người

2. KẾT QUẢ ĐẠT ĐƯỢC:
- Sự kiện diễn ra thành công tốt đẹp theo đúng kế hoạch đã được Ban Chủ nhiệm Khoa và Đoàn Trường phê duyệt.
- Chương trình thu hút đông đảo sinh viên tham gia nhiệt tình, đảm bảo an ninh trật tự, an toàn phòng chống cháy nổ và vệ sinh môi trường học đường.
- Mục tiêu chính đạt được: {plans.get('Objectives', 'Hoàn thành các chỉ tiêu đề ra trong kế hoạch')}

3. TỔNG KẾT TÀI CHÍNH & CƠ SỞ VẬT CHẤT:
- Tổng kinh phí thực tế đã chi: {total_budget:,.0f} VNĐ (Có đầy đủ hóa đơn chứng từ hợp lệ kèm theo).
- Tình trạng tài sản và cơ sở vật chất: Đã hoàn trả đầy đủ, nguyên vẹn cho Phòng Cơ sở vật chất theo biên bản kiểm tra.

4. BÀI HỌC KINH NGHIỆM & KIẾN NGHỊ:
- Tiếp tục duy trì công tác phối hợp chặt chẽ giữa Ban tổ chức và các đơn vị chức năng trong trường.
- Kính trình Ban Thường vụ Đoàn Trường nghiệm thu và lưu trữ hồ sơ."""

    return draft
