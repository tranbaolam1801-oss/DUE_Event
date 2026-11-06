from flask import Flask, render_template
from app.config import Config
from app.extensions import login_manager, csrf
from app.repositories import user_repo

def create_app(config_class=Config):
    """Application Factory pattern cho MY DUE Flask"""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Khởi tạo extensions
    login_manager.init_app(app)
    csrf.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        try:
            return user_repo.get_user_by_id(int(user_id))
        except Exception:
            return None

    # Đăng ký Blueprints
    from app.auth.routes import auth_bp
    from app.dashboard.routes import dashboard_bp
    from app.events.routes import events_bp
    from app.approvals.routes import approvals_bp
    from app.facilities.routes import facilities_bp
    from app.reports.routes import reports_bp
    from app.payments.routes import payments_bp
    from app.admin.routes import admin_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(approvals_bp)
    app.register_blueprint(facilities_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(payments_bp)
    app.register_blueprint(admin_bp)

    # Template filters và context processors phục vụ giao diện tiếng Việt & nhận diện DUE
    @app.template_filter('currency')
    def currency_filter(value):
        if value is None:
            return "0 đ"
        try:
            return f"{float(value):,.0f} đ".replace(',', '.')
        except (ValueError, TypeError):
            return "0 đ"

    @app.template_filter('datetime_vn')
    def datetime_vn_filter(value):
        if not value:
            return "—"
        try:
            # Hỗ trợ chuỗi hoặc datetime object
            from datetime import datetime
            if isinstance(value, str):
                dt = datetime.fromisoformat(value.replace('Z', ''))
            else:
                dt = value
            return dt.strftime("%d/%m/%Y %H:%M")
        except Exception:
            return str(value)

    @app.template_filter('status_badge_class')
    def status_badge_class(code):
        state_map = {
            'DRAFT': 'badge-draft',
            'PENDING_FACULTY': 'badge-pending',
            'REVISION_FACULTY': 'badge-revision',
            'REJECTED_FACULTY': 'badge-rejected',
            'PENDING_UNION': 'badge-pending',
            'REVISION_UNION': 'badge-revision',
            'REJECTED_UNION': 'badge-rejected',
            'PENDING_FACILITY': 'badge-pending',
            'REVISION_FACILITY': 'badge-revision',
            'EVENT_APPROVED': 'badge-approved',
            'EVENT_HELD': 'badge-info',
            'RETURN_PENDING': 'badge-pending',
            'REPORT_PENDING': 'badge-pending',
            'FINANCE_PENDING': 'badge-pending',
            'FINANCE_REVISION': 'badge-revision',
            'PAYMENT_APPROVAL': 'badge-pending',
            'PAYMENT_APPROVED': 'badge-approved',
            'PAYMENT_REJECTED': 'badge-rejected',
            'COMPLETED': 'badge-completed'
        }
        return state_map.get(code, 'badge-default')

    # Error Handlers
    @app.errorhandler(403)
    def forbidden_error(error):
        return render_template('errors/403.html'), 403

    @app.errorhandler(404)
    def not_found_error(error):
        return render_template('errors/404.html'), 404

    @app.errorhandler(500)
    def internal_error(error):
        return render_template('errors/500.html'), 500

    return app
