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

def test_three_click_rule_from_dashboard(client):
    """
    Giáo trình Chương 6 Mục 2.6: Quy tắc 3 cú nhấp chuột (Three-Click Rule)
    Từ Dashboard truy cập được mọi chức năng chính trong <= 3 bước
    """
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    # Nhấp 1: Dashboard redirect tới trang mở đầu /events
    dash_res = client.get('/dashboard', follow_redirects=True)
    assert dash_res.status_code == 200
    dash_html = dash_res.data.decode('utf-8')
    assert "/events/create" in dash_html  # Nhấp 2: Tạo hồ sơ sự kiện ngay tại Dashboard!
    assert "/events" in dash_html         # Nhấp 2: Xem danh sách sự kiện
    assert "/facilities" in dash_html     # Nhấp 2: Xem lịch CSVC

def test_content_awareness_presence(client):
    """
    Giáo trình Chương 6 Mục 2.2: Nhận thức nội dung (Content Awareness)
    Mỗi trang phải có breadcrumb, tiêu đề trang và chỉ báo vai trò rõ ràng
    """
    client.post('/login', data={'username': 'btc1@eventflow.vn', 'password': '123456'})
    res = client.get('/events')
    html = res.data.decode('utf-8')
    assert "header-breadcrumb" in html
    assert "page-title" in html
    assert "role-pill" in html

def test_keyboard_accessibility_markup(client):
    """
    Giáo trình Chương 6 Mục 5 & 12: Hỗ trợ Bàn phím hoàn chỉnh (Keyboard-Only)
    Các form phải có nhãn kết nối for/id, nút submit có thể kích hoạt bằng bàn phím
    """
    res = client.get('/login')
    html = res.data.decode('utf-8')
    assert '<label for="username"' in html
    assert 'id="username"' in html
    assert '<label for="password"' in html
    assert 'id="password"' in html
    assert 'type="submit"' in html
    assert 'id="togglePassword"' in html
    assert 'aria-label=' in html
