from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app.auth.decorators import role_required, permission_required
from app.repositories import report_repo, event_repo
from app.services import ai_assistant

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports')
@login_required
def index():
    """Danh sách báo cáo tổng kết sự kiện đã nộp (BPMN: AutoReport -> MergeReport)"""
    reports = report_repo.get_all_reports()
    return render_template('reports/list.html', reports=reports)

@reports_bp.route('/reports/<int:event_id>/create', methods=['GET', 'POST'])
@login_required
@permission_required('reports.create')
def create(event_id):
    """Lập và rà soát báo cáo tổng kết (BPMN: ReviewReport)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    existing_report = report_repo.get_report_by_event(event_id)
    
    if request.method == 'POST':
        content = request.form.get('content', '').strip()
        if not content:
            flash('Nội dung báo cáo không được để trống.', 'danger')
            return render_template('reports/create.html', event=event, report=existing_report)
            
        try:
            report_repo.save_report(event_id, content, is_required=True)
            flash('Lưu báo cáo tổng kết thành công!', 'success')
            return redirect(url_for('reports.view', event_id=event_id))
        except Exception as e:
            flash(f'Lỗi khi lưu báo cáo: {str(e)}', 'danger')

    return render_template('reports/create.html', event=event, report=existing_report)

@reports_bp.route('/reports/<int:event_id>/view')
@login_required
def view(event_id):
    """Xem báo cáo tổng kết hoàn chỉnh"""
    event = event_repo.get_event_detail(event_id)
    report = report_repo.get_report_by_event(event_id)
    if not report:
        flash('Chưa có báo cáo cho sự kiện này.', 'warning')
        return redirect(url_for('events.detail', event_id=event_id))
        
    return render_template('reports/view.html', event=event, report=report)

@reports_bp.route('/reports/<int:event_id>/confirm', methods=['POST'])
@login_required
@role_required('DOAN_TRUONG', 'SYSTEM_ADMIN')
def confirm(event_id):
    """Đoàn Trường xác nhận báo cáo và chuyển sang khâu tài chính"""
    try:
        report_repo.confirm_report(event_id, current_user.id)
        flash('Đoàn Trường đã xác nhận và nghiệm thu báo cáo thành công!', 'success')
    except Exception as e:
        flash(f'Lỗi xác nhận: {str(e)}', 'danger')
    return redirect(url_for('reports.view', event_id=event_id))

@reports_bp.route('/reports/<int:event_id>/ai-draft', methods=['POST'])
@login_required
def ai_draft(event_id):
    """AI tự động tạo bản nháp báo cáo tổng kết (BPMN: AIReport)"""
    event = event_repo.get_event_detail(event_id)
    budget_items = event_repo.get_budget_items(event_id)
    draft_text = ai_assistant.generate_report_draft(event, event, budget_items)
    return jsonify({"draft": draft_text})
