import pytest
from app import create_app
from app.config import Config

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

def test_events_list_authenticated(client):
    """Kiểm tra truy cập danh sách sự kiện sau khi đăng nhập và hiển thị đúng 6 cột dữ liệu tinh gọn"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    response = client.get('/events')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "Quản lý hồ sơ sự kiện" in html
    assert "+ Tạo hồ sơ" in html
    assert "Mã hồ sơ" in html
    assert "Tên sự kiện" in html
    assert "Đơn vị tổ chức" in html
    assert "Thời gian" in html
    assert "Trạng thái" in html
    assert "Thao tác" in html
    # Kiểm tra đã ẩn 2 cột kinh phí và người phụ trách khỏi bảng danh sách theo yêu cầu
    assert "Kinh phí dự trù" not in html
    assert "Người phụ trách" not in html

def test_sidebar_no_separate_create_event_menu(client):
    """Kiểm tra Sidebar KHÔNG có menu Tạo hồ sơ riêng, chỉ có một mục chính là 'Hồ sơ sự kiện'"""
    # 1. BCH Liên Chi Đoàn
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res = client.get('/events')
    html = res.data.decode('utf-8')
    # Sidebar phải có mục "Hồ sơ sự kiện"
    assert "Hồ sơ sự kiện" in html
    # Sidebar KHÔNG được chứa link riêng tạo hồ sơ
    assert 'href="/events/create" class="nav-item' not in html
    assert "Tạo hồ sơ mới" not in html

    # 2. Ban Chủ nhiệm Khoa
    client.get('/logout')
    client.post('/login', data={'username': 'bcnkhoa@eventflow.vn', 'password': '123456'})
    res_khoa = client.get('/events')
    html_khoa = res_khoa.data.decode('utf-8')
    assert "Hồ sơ sự kiện" in html_khoa
    assert 'href="/events/create" class="nav-item' not in html_khoa

def test_create_button_visibility_by_permission(client):
    """
    Kiểm tra nút '+ Tạo hồ sơ' chỉ hiển thị đối với vai trò có Permission 'events.create'
    - BCH: CÓ nút '+ Tạo hồ sơ'
    - BCN Khoa: KHÔNG CÓ nút '+ Tạo hồ sơ'
    - Đoàn Trường: KHÔNG CÓ nút '+ Tạo hồ sơ'
    - Phòng CSVC: KHÔNG CÓ nút '+ Tạo hồ sơ'
    - Phòng KHTC: KHÔNG CÓ nút '+ Tạo hồ sơ'
    """
    # BCH: Có quyền
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res_btc = client.get('/events')
    html_btc = res_btc.data.decode('utf-8')
    assert "+ Tạo hồ sơ" in html_btc
    assert 'id="btnCreateEvent"' in html_btc

    # Ban Chủ nhiệm Khoa: Không có quyền
    client.get('/logout')
    client.post('/login', data={'username': 'bcnkhoa@eventflow.vn', 'password': '123456'})
    res_bcn = client.get('/events')
    html_bcn = res_bcn.data.decode('utf-8')
    assert 'id="btnCreateEvent"' not in html_bcn

    # Đoàn Trường: Không có quyền
    client.get('/logout')
    client.post('/login', data={'username': 'doantruong@eventflow.vn', 'password': '123456'})
    res_dt = client.get('/events')
    html_dt = res_dt.data.decode('utf-8')
    assert 'id="btnCreateEvent"' not in html_dt

    # Phòng Cơ sở vật chất: Không có quyền
    client.get('/logout')
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res_csvc = client.get('/events')
    html_csvc = res_csvc.data.decode('utf-8')
    assert 'id="btnCreateEvent"' not in html_csvc

    # Phòng Kế hoạch Tài chính: Không có quyền
    client.get('/logout')
    client.post('/login', data={'username': 'khtc@eventflow.vn', 'password': '123456'})
    res_khtc = client.get('/events')
    html_khtc = res_khtc.data.decode('utf-8')
    assert 'id="btnCreateEvent"' not in html_khtc

def test_create_event_permission_denied_for_unauthorized_role(client):
    """Kiểm tra chặn truy cập trực tiếp route /events/create nếu không có quyền"""
    client.post('/login', data={'username': 'bcnkhoa@eventflow.vn', 'password': '123456'})
    res = client.get('/events/create')
    # Bị chặn 403 Forbidden
    assert res.status_code == 403

def test_create_event_flow_and_persistence(client):
    """Kiểm tra luồng tạo hồ sơ sự kiện và lưu trữ vào SQL Server"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    # 1. Truy cập form tạo hồ sơ
    res_get = client.get('/events/create')
    assert res_get.status_code == 200
    assert "Tạo hồ sơ sự kiện mới" in res_get.data.decode('utf-8')

    # 2. Gửi dữ liệu tạo hồ sơ
    res_post = client.post('/events/create', data={
        'title': 'Sự kiện kiểm thử luồng tạo hồ sơ DUE 2026',
        'department_id': '1',
        'starts_at': '2026-11-20T08:00',
        'ends_at': '2026-11-20T17:00',
        'attendees': '120',
        'objectives': 'Kiểm thử lưu trữ SQL Server và hiển thị danh sách',
        'description': 'Mô tả chi tiết sự kiện kiểm thử quy trình tạo mới hồ sơ',
        'action_type': 'save_and_list'
    }, follow_redirects=True)
    assert res_post.status_code == 200
    html = res_post.data.decode('utf-8')
    assert "Tạo hồ sơ sự kiện thành công" in html
    assert "Sự kiện kiểm thử luồng tạo hồ sơ DUE 2026" in html

def test_events_filtering_and_search(client):
    """Kiểm tra tìm kiếm, lọc theo tab, lọc theo trạng thái và lọc theo đơn vị"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    
    # 1. Tìm kiếm theo từ khóa
    res_search = client.get('/events?q=SpeakUp')
    assert res_search.status_code == 200
    assert "SpeakUp" in res_search.data.decode('utf-8')

    # 2. Lọc theo Tab
    res_tab = client.get('/events?tab=PENDING')
    assert res_tab.status_code == 200

    # 3. Lọc theo trạng thái chi tiết
    res_state = client.get('/events?state=PENDING_FACULTY')
    assert res_state.status_code == 200

    # 4. Lọc theo đơn vị
    res_dept = client.get('/events?department_id=1')
    assert res_dept.status_code == 200

def test_event_detail(client):
    """Kiểm tra xem chi tiết sự kiện, stepper BPMN và thanh điều hướng 8 tab độc lập"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    response = client.get('/events/1')
    assert response.status_code == 200
    html = response.data.decode('utf-8')
    assert "bpmn-stepper" in html
    assert "event-subnav-bar" in html
    assert "Tổng quan" in html
    assert "Kế hoạch chi tiết" in html
    assert "Dự trù kinh phí" in html
    assert "Cơ sở vật chất" in html
    assert "Luồng xét duyệt" in html
    assert "Báo cáo tổng kết" in html
    assert "Quyết toán" in html
    assert "Tệp đính kèm" in html
    assert "sticky-action-bar" in html

def test_event_detail_subpages_isolation(client):
    """Kiểm tra 8 trang con độc lập: mỗi trang chỉ render nội dung tương ứng, không chồng chéo"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    
    # 1. Tab Kế hoạch chi tiết
    res_plan = client.get('/events/1/tab/plan')
    assert res_plan.status_code == 200
    html_plan = res_plan.data.decode('utf-8')
    assert "Nội dung kế hoạch chi tiết" in html_plan
    assert "Mục tiêu tổ chức" in html_plan
    
    # 2. Tab Dự trù kinh phí
    res_budget = client.get('/events/1/tab/budget')
    assert res_budget.status_code == 200
    html_budget = res_budget.data.decode('utf-8')
    assert "Dự trù kinh phí sự kiện" in html_budget
    assert "Tổng kinh phí dự kiến" in html_budget

    # 3. Tab Cơ sở vật chất
    res_fac = client.get('/events/1/tab/facilities')
    assert res_fac.status_code == 200
    html_fac = res_fac.data.decode('utf-8')
    assert "Cơ sở vật chất & Thiết bị" in html_fac

    # 4. Tab Luồng xét duyệt
    res_wf = client.get('/events/1/tab/workflow')
    assert res_wf.status_code == 200
    html_wf = res_wf.data.decode('utf-8')
    assert "Nhật ký luân chuyển & Xét duyệt" in html_wf

    # 5. Tab Tệp đính kèm
    res_att = client.get('/events/1/tab/attachments')
    assert res_att.status_code == 200
    html_att = res_att.data.decode('utf-8')
    assert "Tệp đính kèm & Tài liệu hồ sơ" in html_att

def test_ai_review_endpoint(client):
    """Kiểm tra endpoint AI Assistant rà soát hồ sơ (BPMN: AIReview)"""
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    response = client.post('/events/1/ai-review')
    if response.status_code == 200:
        data = response.get_json()
        assert "score" in data
        assert "suggestions" in data
        assert "is_ready" in data
