import threading
import time
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from playwright.sync_api import sync_playwright
from app import create_app
from app.config import Config

TEST_PORT = 5055
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

def run_flask_app():
    app = create_app(Config)
    app.config.update({
        "TESTING": True,
        "WTF_CSRF_ENABLED": False,
    })
    app.run(host="127.0.0.1", port=TEST_PORT, debug=False, use_reloader=False)

def take_all_screenshots():
    print(f"[*] Khởi động Flask server kiểm thử tại {BASE_URL}...")
    server_thread = threading.Thread(target=run_flask_app, daemon=True)
    server_thread.start()
    time.sleep(2)  # Đợi server sẵn sàng

    out_dir = os.path.join(os.getcwd(), "docs", "screenshots")
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ==========================================
        # 1. DESKTOP SCREENS (1440 x 900)
        # ==========================================
        print("\n[*] Chụp ảnh màn hình Desktop 1440x900...")

        # 1.1 Login Page
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.goto(f"{BASE_URL}/login")
        page.wait_for_selector(".login-wrapper")
        page.screenshot(path=os.path.join(out_dir, "01_login_desktop.png"))
        print("  [✓] 01_login_desktop.png")

        # 1.2 BCH Liên Chi Đoàn Landing -> /events
        page.fill("#username", "btc1@eventflow.vn")
        page.fill("#password", "123456")
        page.click("#btnLoginSubmit")
        page.wait_for_selector(".table-responsive, .event-cards-grid")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "02_events_bch_desktop.png"))
        print("  [✓] 02_events_bch_desktop.png (BCH Liên Chi Đoàn Landing)")

        # 1.2b Tạo hồ sơ sự kiện mới -> /events/create
        page.goto(f"{BASE_URL}/events/create")
        page.wait_for_selector(".layout-2col, #createEventForm")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "02b_events_create_desktop.png"))
        print("  [✓] 02b_events_create_desktop.png (Tạo hồ sơ sự kiện mới 2 cột)")

        # 1.3 Event Detail (Tab 1: Overview) -> /events/1
        page.goto(f"{BASE_URL}/events/1")
        page.wait_for_selector(".bpmn-stepper")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "03_event_detail_desktop.png"))
        print("  [✓] 03_event_detail_desktop.png (Chi tiết hồ sơ - Tab Tổng quan)")

        # 1.3b Event Detail (Tab 2: Plan) -> /events/1/tab/plan
        page.goto(f"{BASE_URL}/events/1/tab/plan")
        page.wait_for_selector(".plan-section")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "03b_event_detail_plan_desktop.png"))
        print("  [✓] 03b_event_detail_plan_desktop.png (Chi tiết hồ sơ - Tab Kế hoạch chi tiết)")

        # 1.3c Event Detail (Tab 3: Budget) -> /events/1/tab/budget
        page.goto(f"{BASE_URL}/events/1/tab/budget")
        page.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "03c_event_detail_budget_desktop.png"))
        print("  [✓] 03c_event_detail_budget_desktop.png (Chi tiết hồ sơ - Tab Dự trù kinh phí)")

        # 1.3d Event Detail (Tab 5: Workflow) -> /events/1/tab/workflow
        page.goto(f"{BASE_URL}/events/1/tab/workflow")
        page.wait_for_selector(".workflow-timeline")
        time.sleep(0.5)
        page.screenshot(path=os.path.join(out_dir, "03d_event_detail_workflow_desktop.png"))
        print("  [✓] 03d_event_detail_workflow_desktop.png (Chi tiết hồ sơ - Tab Luồng xét duyệt BPMN)")
        ctx.close()

        # 1.4 Ban Chủ nhiệm Khoa Landing -> /approvals/faculty
        ctx_khoa = browser.new_context(viewport={"width": 1440, "height": 900})
        page_khoa = ctx_khoa.new_page()
        page_khoa.goto(f"{BASE_URL}/login")
        page_khoa.fill("#username", "bcnkhoa@eventflow.vn")
        page_khoa.fill("#password", "123456")
        page_khoa.click("#btnLoginSubmit")
        page_khoa.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_khoa.screenshot(path=os.path.join(out_dir, "04_approvals_faculty_desktop.png"))
        print("  [✓] 04_approvals_faculty_desktop.png (Ban Chủ nhiệm Khoa Landing)")
        ctx_khoa.close()

        # 1.5 Đoàn Trường Landing -> /approvals/union
        ctx_doan = browser.new_context(viewport={"width": 1440, "height": 900})
        page_doan = ctx_doan.new_page()
        page_doan.goto(f"{BASE_URL}/login")
        page_doan.fill("#username", "doantruong@eventflow.vn")
        page_doan.fill("#password", "123456")
        page_doan.click("#btnLoginSubmit")
        page_doan.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_doan.screenshot(path=os.path.join(out_dir, "05_approvals_union_desktop.png"))
        print("  [✓] 05_approvals_union_desktop.png (Đoàn Trường Landing)")
        ctx_doan.close()

        # 1.6 Phòng CSVC Landing -> /facilities (Tab 1: Đăng ký CSVC)
        ctx_csvc = browser.new_context(viewport={"width": 1440, "height": 900})
        page_csvc = ctx_csvc.new_page()
        page_csvc.goto(f"{BASE_URL}/login")
        page_csvc.fill("#username", "csvc@eventflow.vn")
        page_csvc.fill("#password", "123456")
        page_csvc.click("#btnLoginSubmit")
        page_csvc.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_csvc.screenshot(path=os.path.join(out_dir, "06_facilities_requests_desktop.png"))
        page_csvc.screenshot(path=os.path.join(out_dir, "06_facilities_csvc_desktop.png"))
        print("  [✓] 06_facilities_requests_desktop.png (CSVC Tab 1: Đăng ký cơ sở vật chất)")

        # 1.6b Phòng CSVC -> Tab 2: Lịch sử dụng (Calendar)
        page_csvc.goto(f"{BASE_URL}/facilities/schedule")
        page_csvc.wait_for_selector("#facilityCalendar")
        time.sleep(1.0)
        page_csvc.screenshot(path=os.path.join(out_dir, "06b_facilities_schedule_desktop.png"))
        print("  [✓] 06b_facilities_schedule_desktop.png (CSVC Tab 2: Calendar Lịch sử dụng)")

        # 1.6c Phòng CSVC -> Tab 3: Phòng & thiết bị
        page_csvc.goto(f"{BASE_URL}/facilities/catalog")
        page_csvc.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_csvc.screenshot(path=os.path.join(out_dir, "06c_facilities_catalog_desktop.png"))
        print("  [✓] 06c_facilities_catalog_desktop.png (CSVC Tab 3: Phòng & Thiết bị)")

        # 1.6d Phòng CSVC -> Bố trí phòng sự kiện (Assign Room Screen)
        page_csvc.goto(f"{BASE_URL}/facilities/assign/1")
        page_csvc.wait_for_selector("form")
        time.sleep(0.5)
        page_csvc.screenshot(path=os.path.join(out_dir, "06d_facilities_assign_desktop.png"))
        print("  [✓] 06d_facilities_assign_desktop.png (CSVC Bố trí phòng & Thiết bị)")
        ctx_csvc.close()

        # 1.7 Phòng KHTC Landing -> /payments
        ctx_khtc = browser.new_context(viewport={"width": 1440, "height": 900})
        page_khtc = ctx_khtc.new_page()
        page_khtc.goto(f"{BASE_URL}/login")
        page_khtc.fill("#username", "khtc@eventflow.vn")
        page_khtc.fill("#password", "123456")
        page_khtc.click("#btnLoginSubmit")
        page_khtc.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_khtc.screenshot(path=os.path.join(out_dir, "07_finance_khtc_desktop.png"))
        print("  [✓] 07_finance_khtc_desktop.png (Phòng Kế hoạch Tài chính Landing)")
        ctx_khtc.close()

        # 1.8 Quản trị viên Landing -> /admin/users
        ctx_admin = browser.new_context(viewport={"width": 1440, "height": 900})
        page_admin = ctx_admin.new_page()
        page_admin.goto(f"{BASE_URL}/login")
        page_admin.fill("#username", "admin@eventflow.vn")
        page_admin.fill("#password", "123456")
        page_admin.click("#btnLoginSubmit")
        page_admin.wait_for_selector(".table-responsive")
        time.sleep(0.5)
        page_admin.screenshot(path=os.path.join(out_dir, "08_admin_users_desktop.png"))
        print("  [✓] 08_admin_users_desktop.png (Quản trị viên Landing)")
        ctx_admin.close()

        # ==========================================
        # 2. MOBILE RESPONSIVE SCREENS (390 x 844)
        # ==========================================
        print("\n[*] Chụp ảnh màn hình Mobile Responsive 390x844...")
        ctx_mob = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True)
        page_mob = ctx_mob.new_page()

        # 2.1 Mobile Login
        page_mob.goto(f"{BASE_URL}/login")
        page_mob.wait_for_selector(".login-wrapper")
        page_mob.screenshot(path=os.path.join(out_dir, "09_login_mobile.png"))
        print("  [✓] 09_login_mobile.png (Đăng nhập điện thoại)")

        # 2.2 Mobile BCH Events List
        page_mob.fill("#username", "btc1@eventflow.vn")
        page_mob.fill("#password", "123456")
        page_mob.click("#btnLoginSubmit")
        page_mob.wait_for_selector(".table-responsive, .event-cards-grid")
        time.sleep(0.5)
        page_mob.screenshot(path=os.path.join(out_dir, "10_events_bch_mobile.png"))
        print("  [✓] 10_events_bch_mobile.png (Hồ sơ sự kiện điện thoại)")

        # 2.2b Mobile Create Event
        page_mob.goto(f"{BASE_URL}/events/create")
        page_mob.wait_for_selector(".layout-2col, #createEventForm")
        time.sleep(0.5)
        page_mob.screenshot(path=os.path.join(out_dir, "10b_events_create_mobile.png"))
        print("  [✓] 10b_events_create_mobile.png (Tạo hồ sơ sự kiện điện thoại)")

        # 2.3 Mobile Event Detail
        page_mob.goto(f"{BASE_URL}/events/1")
        page_mob.wait_for_selector(".bpmn-stepper")
        time.sleep(0.5)
        page_mob.screenshot(path=os.path.join(out_dir, "11_event_detail_mobile.png"))
        print("  [✓] 11_event_detail_mobile.png (Chi tiết sự kiện điện thoại)")

        # 2.4 Mobile CSVC Calendar
        page_mob.goto(f"{BASE_URL}/facilities/schedule")
        page_mob.wait_for_selector("#facilityCalendar")
        time.sleep(1.0)
        page_mob.screenshot(path=os.path.join(out_dir, "12_facilities_calendar_mobile.png"))
        print("  [✓] 12_facilities_calendar_mobile.png (Calendar CSVC điện thoại)")
        ctx_mob.close()

        browser.close()

    print("\n[SUCCESS] Tất cả 11 ảnh chụp kiểm thử trực quan đã được ghi thành công vào docs/screenshots/!")

if __name__ == "__main__":
    take_all_screenshots()
