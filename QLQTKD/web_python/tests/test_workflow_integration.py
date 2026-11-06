import pytest
from app import create_app
from app.config import Config
from app.repositories import event_repo, facility_repo, user_repo, finance_repo

@pytest.fixture
def app():
    app = create_app(Config)
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
    })
    yield app

@pytest.fixture
def client(app):
    return app.test_client()

def test_full_workflow_end_to_end():
    """
    Kiểm thử luồng nghiệp vụ To-Be đầy đủ qua các Stored Procedures trong SQL Server:
    BTC (Draft) -> Khoa -> Đoàn Trường -> CSVC -> Diễn ra -> Hoàn trả -> Báo cáo -> KHTC -> Cấp duyệt -> Chi trả -> Hoàn tất.
    """
    # 1. BTC1 tạo hồ sơ nháp
    btc_user = user_repo.get_user_by_username('btc1@eventflow.vn')
    assert btc_user is not None
    actor_id = btc_user['UserId']

    event_id = event_repo.create_event_draft_sp(
        actor_id=actor_id,
        dept_id=2,  # Khoa QTKD (bcnkhoa DepartmentId = 2)
        title="[TEST] Hội thảo Đổi mới Sáng tạo & Khởi nghiệp DUE 2026",
        starts_at="2026-11-15 08:00:00",
        ends_at="2026-11-15 11:30:00",
        objectives="Thúc đẩy tinh thần khởi nghiệp đổi mới sáng tạo trong sinh viên DUE.",
        description="Chương trình bao gồm tọa đàm cùng chuyên gia và triển lãm dự án.",
        attendees=180
    )
    assert event_id is not None
    print(f"Created Test Event ID: {event_id}")

    # Kiểm tra hồ sơ tạo xong có trạng thái DRAFT
    evt = event_repo.get_event_detail(event_id)
    assert evt['StateCode'] == 'DRAFT'

    # Thêm dự trù kinh phí
    event_repo.save_budget_items(event_id, [
        {"name": "In ấn tài liệu & Name tag", "qty": 180, "price": 15000},
        {"name": "Nước uống & Tea break", "qty": 180, "price": 25000},
        {"name": "Bồi dưỡng diễn giả chuyên đề", "qty": 2, "price": 2000000}
    ])
    items = event_repo.get_budget_items(event_id)
    assert len(items) == 3

    # 2. BTC gửi hồ sơ lên Ban Chủ nhiệm Khoa (DRAFT -> PENDING_FACULTY)
    res_submit = event_repo.transition_event_sp(event_id, actor_id, 'SUBMIT')
    assert res_submit['current_state'] == 'PENDING_FACULTY'

    # 3. BCN Khoa thẩm định và phê duyệt (PENDING_FACULTY -> PENDING_UNION)
    bcn_user = user_repo.get_user_by_username('bcnkhoa@eventflow.vn')
    res_khoa = event_repo.transition_event_sp(event_id, bcn_user['UserId'], 'APPROVE', comment="Khoa thống nhất nội dung kế hoạch.")
    assert res_khoa['current_state'] == 'PENDING_UNION'

    # 4. Đoàn Trường thẩm định và phê duyệt (PENDING_UNION -> PENDING_FACILITY)
    doan_user = user_repo.get_user_by_username('doantruong@eventflow.vn')
    res_doan = event_repo.transition_event_sp(event_id, doan_user['UserId'], 'APPROVE', comment="Đoàn trường đồng ý phê duyệt tổ chức.")
    assert res_doan['current_state'] == 'PENDING_FACILITY'

    # 5. CSVC thẩm định và phê duyệt cấp phòng (PENDING_FACILITY -> EVENT_APPROVED)
    csvc_user = user_repo.get_user_by_username('csvc@eventflow.vn')
    res_csvc = event_repo.transition_event_sp(event_id, csvc_user['UserId'], 'APPROVE', comment="Đã bố trí Hội trường A và thiết bị.")
    assert res_csvc['current_state'] == 'EVENT_APPROVED'

    # 6. Ghi nhận sự kiện đã diễn ra (EVENT_APPROVED -> EVENT_HELD)
    res_held = event_repo.transition_event_sp(event_id, actor_id, 'RECORD_EVENT_HELD')
    assert res_held['current_state'] == 'EVENT_HELD'

    # 7. Yêu cầu hoàn trả tài sản (EVENT_HELD -> RETURN_PENDING)
    res_return = event_repo.transition_event_sp(event_id, actor_id, 'REQUEST_RETURN')
    assert res_return['current_state'] == 'RETURN_PENDING'

    # 8. CSVC nghiệm thu tài sản và yêu cầu báo cáo (RETURN_PENDING -> REPORT_PENDING)
    res_rep_req = event_repo.transition_event_sp(event_id, csvc_user['UserId'], 'REQUIRE_REPORT')
    assert res_rep_req['current_state'] == 'REPORT_PENDING'

    # 9. BTC nộp báo cáo tổng kết (REPORT_PENDING -> FINANCE_PENDING)
    res_rep_sub = event_repo.transition_event_sp(event_id, actor_id, 'SUBMIT_REPORT')
    assert res_rep_sub['current_state'] == 'FINANCE_PENDING'

    # 10. KHTC kiểm tra chứng từ và trình cấp thẩm quyền duyệt (FINANCE_PENDING -> PAYMENT_APPROVAL)
    khtc_user = user_repo.get_user_by_username('khtc@eventflow.vn')
    res_khtc = event_repo.transition_event_sp(event_id, khtc_user['UserId'], 'SUBMIT_TO_AUTHORITY')
    assert res_khtc['current_state'] == 'PAYMENT_APPROVAL'

    # 11. Cấp thẩm quyền (Admin / Authority) duyệt chi (PAYMENT_APPROVAL -> PAYMENT_APPROVED)
    admin_user = user_repo.get_user_by_username('admin@eventflow.vn')
    res_auth = event_repo.transition_event_sp(event_id, admin_user['UserId'], 'APPROVE')
    assert res_auth['current_state'] == 'PAYMENT_APPROVED'

    # 12. KHTC thực hiện giải ngân chi trả và hoàn tất quy trình (PAYMENT_APPROVED -> COMPLETED)
    res_comp = event_repo.transition_event_sp(event_id, khtc_user['UserId'], 'RECORD_PAID')
    assert res_comp['current_state'] == 'COMPLETED'

    # Kiểm tra lịch sử ghi vết trong WorkflowHistory
    history = event_repo.get_workflow_history(event_id)
    assert len(history) >= 11
    print(f"End-to-End Workflow for Event {event_id} verified successfully!")
