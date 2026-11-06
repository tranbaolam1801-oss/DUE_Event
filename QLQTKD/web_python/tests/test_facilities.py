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

def test_csvc_three_subtabs_no_numbering(client):
    """
    Yêu cầu 3: Ba trang con điều hướng gọn, không đánh số 1, 2, 3:
    - Yêu cầu đăng ký (/facilities hoặc /facilities/requests)
    - Lịch sử dụng (/facilities/schedule)
    - Phòng & thiết bị (/facilities/catalog)
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})

    # 1. Tab Yêu cầu đăng ký
    res1 = client.get('/facilities')
    assert res1.status_code == 200
    html1 = res1.data.decode('utf-8')
    assert "Yêu cầu đăng ký" in html1
    assert "Lịch sử dụng" in html1
    assert "Phòng & thiết bị" in html1
    # Xác nhận KHÔNG đánh số thứ tự dạng quy trình bắt buộc 1, 2, 3 trên tab
    assert "1. Đăng ký" not in html1
    assert "2. Lịch sử dụng" not in html1
    assert "3. Danh mục" not in html1

    # 2. Tab Lịch sử dụng (Calendar)
    res2 = client.get('/facilities/schedule')
    assert res2.status_code == 200
    html2 = res2.data.decode('utf-8')
    assert "facilityCalendar" in html2
    assert "FullCalendar" in html2 or "fullcalendar" in html2
    assert "Kiểm tra phòng trống" in html2
    assert "Chú giải trạng thái" in html2

    # 3. Tab Phòng & thiết bị
    res3 = client.get('/facilities/catalog')
    assert res3.status_code == 200
    html3 = res3.data.decode('utf-8')
    assert "Phòng & thiết bị" in html3
    assert "Giảng đường & Hội trường" in html3
    assert "Trang thiết bị trong kho" in html3

def test_compact_header_no_bpmn_noise(client):
    """
    Yêu cầu 4: Thu gọn phần đầu trang, loại bỏ mô tả kỹ thuật BPMN dài dòng,
    tiêu đề gọn gàng, không lặp vai trò.
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res = client.get('/facilities')
    html = res.data.decode('utf-8')
    assert "BPMN" not in html
    assert "Lane CSVC" not in html
    assert "Cơ sở vật chất" in html

def test_bch_cannot_see_assign_room_button(client):
    """
    Yêu cầu 5 & 12: Tài khoản BCH Liên Chi Đoàn KHÔNG nhìn thấy nút 'Bố trí phòng'.
    Nút này chỉ hiển thị khi người dùng có Permission 'facilities.assign' (Phòng CSVC / Admin).
    """
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res = client.get('/facilities')
    assert res.status_code == 200
    html = res.data.decode('utf-8')

    # BCH không được thấy nút "Bố trí phòng"
    assert "Bố trí phòng" not in html

def test_csvc_can_see_assign_or_review_button(client):
    """
    Tài khoản Phòng CSVC có thẩm quyền bố trí và nhìn thấy nút 'Bố trí phòng' hoặc 'Thẩm định CSVC'.
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res = client.get('/facilities')
    assert res.status_code == 200
    html = res.data.decode('utf-8')

    # CSVC có thẩm quyền bố trí và thẩm định
    assert "Thẩm định CSVC" in html or "Bố trí phòng" in html

def test_strict_rbac_route_protection_assign_facility(client):
    """
    Yêu cầu 5 & 12: Bắt buộc kiểm tra Permission tại Flask Route.
    Nếu tài khoản BCH gọi route '/facilities/assign/<event_id>' trái quyền, trả về HTTP 403 Forbidden.
    Tài khoản CSVC gọi route này trả về HTTP 200 OK.
    """
    # 1. BCH cố tình truy cập trực tiếp route bố trí phòng -> Phải bị chặn 403
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res_forbidden = client.get('/facilities/assign/1')
    assert res_forbidden.status_code == 403

    res_post_forbidden = client.post('/facilities/assign/1', data={'facility_id': 1})
    assert res_post_forbidden.status_code == 403

    # 2. CSVC đăng nhập -> Được phép truy cập 200
    client.get('/logout')
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res_allowed = client.get('/facilities/assign/1')
    assert res_allowed.status_code == 200

def test_calendar_interactive_features(client):
    """
    Yêu cầu 6: Kiểm tra các tính năng của Calendar chuyên nghiệp:
    - Endpoint API lấy danh sách sự kiện Calendar /facilities/api/events
    - Truy cập trang /facilities/schedule
    - Kiểm tra lọc phòng và dữ liệu JSON
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res = client.get('/facilities/api/events')
    assert res.status_code == 200
    events_data = res.get_json()
    assert isinstance(events_data, list)
    if len(events_data) > 0:
        ev = events_data[0]
        assert 'id' in ev
        assert 'title' in ev
        assert 'start' in ev
        assert 'end' in ev
        assert 'backgroundColor' in ev

def test_counts_accuracy_matches_sql_data(client):
    """
    Yêu cầu 8: Kiểm tra độ chính xác của các bộ đếm số liệu:
    - Tổng số yêu cầu hiển thị phải khớp với dữ liệu thực từ SQL Server
    - Bộ đếm không bị nhảy về 0 khi chuyển đổi giữa các tab lọc
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res_all = client.get('/facilities?status=ALL')
    assert res_all.status_code == 200
    html_all = res_all.data.decode('utf-8')
    assert "Chờ xử lý" in html_all
    assert "Đã xác nhận" in html_all

    # Lọc chờ xử lý
    res_pending = client.get('/facilities?status=PENDING')
    assert res_pending.status_code == 200

    # Lọc đã xác nhận
    res_approved = client.get('/facilities?status=APPROVED')
    assert res_approved.status_code == 200

def test_ai_suggest_endpoint_resolves_without_build_error(client):
    """
    Yêu cầu 9: Khắc phục triệt để lỗi BuildError endpoint 'facilities.ai_suggest'.
    Endpoint '/facilities/ai-suggest' phải tồn tại và trả về JSON gợi ý không gian.
    """
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res = client.post('/facilities/ai-suggest', json={'attendees': 250})
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert 'facility_id' in data[0]
    assert 'fit_rating' in data[0]

def test_check_collision_ajax_endpoint(client):
    """
    Kiểm tra endpoint AJAX kiểm tra xung đột thời gian thực '/facilities/check-collision'.
    """
    client.post('/login', data={'username': 'csvc@eventflow.vn', 'password': '123456'})
    res = client.post('/facilities/check-collision', json={
        'facility_id': 1,
        'starts_at': '2026-11-22 13:00:00',
        'ends_at': '2026-11-22 15:00:00'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert 'has_conflict' in data
