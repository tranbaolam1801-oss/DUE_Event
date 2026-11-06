import os
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, current_app, send_from_directory
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.auth.decorators import permission_required, role_required
from app.repositories import event_repo, facility_repo, finance_repo, report_repo
from app.services import ai_assistant

events_bp = Blueprint('events', __name__)

def _normalize_datetime(dt_str):
    """Chuẩn hóa chuỗi thời gian từ HTML datetime-local về định dạng SQL Server tương thích"""
    if not dt_str:
        return None
    cleaned = dt_str.strip().replace('T', ' ')
    if len(cleaned) == 16:  # 'YYYY-MM-DD HH:MM' -> 'YYYY-MM-DD HH:MM:00'
        cleaned += ':00'
    return cleaned

@events_bp.route('/events')
@login_required
def index():
    search = request.args.get('q', '').strip()
    tab = request.args.get('tab', 'ALL')
    state = request.args.get('state', 'ALL')
    department_id = request.args.get('department_id', 'ALL')
    page = request.args.get('page', 1, type=int)
    if page < 1:
        page = 1
    per_page = 10
    
    # State mapping for tabs
    revision_states = ('REVISION_FACULTY', 'REVISION_UNION', 'REVISION_FACILITY', 'FINANCE_REVISION')
    pending_states = ('PENDING_FACULTY', 'PENDING_UNION', 'PENDING_FACILITY', 'FINANCE_PENDING', 'PAYMENT_APPROVAL')
    approved_states = ('EVENT_APPROVED', 'EVENT_HELD', 'PAYMENT_APPROVED')
    completed_states = ('COMPLETED', 'CLOSED')
    
    state_filter = None
    if state != 'ALL':
        state_filter = state
    elif tab == 'REVISION':
        state_filter = revision_states
    elif tab == 'PENDING':
        state_filter = pending_states
    elif tab == 'APPROVED':
        state_filter = approved_states
    elif tab == 'COMPLETED':
        state_filter = completed_states
        
    events = event_repo.list_events_for_user(
        current_user, 
        search_query=search, 
        state_filter=state_filter,
        dept_filter=department_id if department_id != 'ALL' else None
    )
    states = event_repo.get_event_status_counts()
    departments = event_repo.get_departments()
    
    # Tab counts for current user
    all_user_events = event_repo.list_events_for_user(current_user)
    tab_counts = {
        'ALL': len(all_user_events),
        'REVISION': sum(1 for e in all_user_events if e.get('StateCode') in revision_states),
        'PENDING': sum(1 for e in all_user_events if e.get('StateCode') in pending_states),
        'APPROVED': sum(1 for e in all_user_events if e.get('StateCode') in approved_states),
        'COMPLETED': sum(1 for e in all_user_events if e.get('StateCode') in completed_states),
    }
    
    # Phân trang (Pagination)
    total_items = len(events)
    total_pages = (total_items + per_page - 1) // per_page if total_items > 0 else 1
    if page > total_pages:
        page = total_pages
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_events = events[start_idx:end_idx]
    
    return render_template('events/list.html',
                           events=paginated_events,
                           total_items=total_items,
                           page=page,
                           total_pages=total_pages,
                           per_page=per_page,
                           has_prev=(page > 1),
                           has_next=(page < total_pages),
                           prev_page=page - 1,
                           next_page=page + 1,
                           states=states,
                           departments=departments,
                           current_tab=tab,
                           current_state=state,
                           current_dept=department_id,
                           search_query=search,
                           tab_counts=tab_counts)

@events_bp.route('/events/create', methods=['GET', 'POST'])
@login_required
@permission_required('events.create')
def create():
    departments = event_repo.get_departments()
    
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        dept_id = request.form.get('department_id') or current_user.department_id or 1
        starts_at = _normalize_datetime(request.form.get('starts_at'))
        ends_at = _normalize_datetime(request.form.get('ends_at'))
        attendees = request.form.get('attendees') or None
        objectives = request.form.get('objectives', '').strip()
        description = request.form.get('description', '').strip()
        
        if not title:
            flash('Vui lòng nhập tên sự kiện.', 'danger')
            return render_template('events/create.html', departments=departments)
            
        try:
            # Gọi Stored Procedure usp_CreateEventDraft
            new_id = event_repo.create_event_draft_sp(
                actor_id=current_user.id,
                dept_id=int(dept_id),
                title=title,
                starts_at=starts_at,
                ends_at=ends_at,
                objectives=objectives,
                description=description,
                attendees=int(attendees) if attendees else None
            )
            action_type = request.form.get('action_type', 'save_and_view')
            flash(f'Tạo hồ sơ sự kiện thành công! Mã hồ sơ đã được cấp.', 'success')
            if action_type == 'save_and_list':
                return redirect(url_for('events.index'))
            return redirect(url_for('events.detail', event_id=new_id))
        except Exception as e:
            flash(f'Lỗi khi tạo hồ sơ trong CSDL: {str(e)}', 'danger')
            
    return render_template('events/create.html', departments=departments)

@events_bp.route('/events/<int:event_id>')
@events_bp.route('/events/<int:event_id>/tab/<string:active_tab>')
@login_required
def detail(event_id, active_tab=None):
    if not active_tab:
        active_tab = request.args.get('tab', 'overview')
    
    valid_tabs = ('overview', 'plan', 'budget', 'facilities', 'workflow', 'report', 'settlement', 'attachments')
    if active_tab not in valid_tabs:
        active_tab = 'overview'

    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    budget_items = event_repo.get_budget_items(event_id)
    history = event_repo.get_workflow_history(event_id)
    transitions = event_repo.get_available_transitions(event_id, current_user)
    
    # Lấy thông tin CSVC gắn với sự kiện (nếu có)
    facility_req = facility_repo.get_facility_request_by_event(event_id)
    reservations = []
    equipment = []
    handovers = []
    if facility_req:
        reservations = facility_repo.get_reservations_for_request(facility_req['RequestId'])
        equipment = facility_repo.get_equipment_for_request(facility_req['RequestId'])
        handovers = facility_repo.get_handovers_for_request(facility_req['RequestId'])
        
    # Lấy báo cáo và tài chính
    report = report_repo.get_report_by_event(event_id)
    payment = finance_repo.get_payment_request_by_event(event_id)
    payment_decisions = []
    if payment:
        payment_decisions = finance_repo.get_payment_decisions(payment['PaymentRequestId'])
    
    # Lấy danh sách tệp đính kèm
    documents = event_repo.get_event_documents(event_id)
    
    # Tính tổng dự trù kinh phí
    total_budget = sum(float(b.get('EstimatedAmount', 0)) for b in budget_items)

    # Danh mục kiểm tra điều kiện nộp hồ sơ (Submission Validation Checklist)
    submission_checklist = {
        'has_plan': bool(event.get('Objectives') and event.get('ProgramContent')),
        'has_budget': len(budget_items) > 0,
        'has_schedule': bool(event.get('StartsAt') and event.get('EndsAt')),
    }
    submission_checklist['is_ready'] = (
        submission_checklist['has_plan'] and 
        submission_checklist['has_budget'] and 
        submission_checklist['has_schedule']
    )

    return render_template('events/detail.html',
                           event=event,
                           active_tab=active_tab,
                           budget_items=budget_items,
                           total_budget=total_budget,
                           history=history,
                           transitions=transitions,
                           facility_req=facility_req,
                           reservations=reservations,
                           equipment=equipment,
                           handovers=handovers,
                           report=report,
                           payment=payment,
                           payment_decisions=payment_decisions,
                           documents=documents,
                           submission_checklist=submission_checklist)

@events_bp.route('/events/<int:event_id>/attachments/upload', methods=['POST'])
@login_required
def upload_attachment(event_id):
    """Tải lên tệp đính kèm cho hồ sơ sự kiện (PDF, DOCX, XLSX, Ảnh)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    doc_type = request.form.get('document_type', 'Tài liệu kế hoạch').strip()
    uploaded_file = request.files.get('file')
    
    if not uploaded_file or not uploaded_file.filename:
        flash('Vui lòng chọn tệp tin cần tải lên.', 'warning')
        return redirect(url_for('events.detail', event_id=event_id, tab='attachments'))
        
    original_name = uploaded_file.filename
    safe_name = secure_filename(original_name)
    mime_type = uploaded_file.content_type or 'application/octet-stream'
    
    # Đường dẫn lưu trữ cục bộ
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', f'event_{event_id}')
    os.makedirs(upload_dir, exist_ok=True)
    
    storage_filename = f"{int(os.times().system * 1000)}_{safe_name}"
    file_path = os.path.join(upload_dir, storage_filename)
    uploaded_file.save(file_path)
    file_size = os.path.getsize(file_path)
    
    try:
        event_repo.add_event_document(
            event_id=event_id,
            doc_type=doc_type,
            original_name=original_name,
            storage_key=storage_filename,
            mime_type=mime_type,
            file_size=file_size,
            uploaded_by=current_user.id
        )
        flash(f'Đã tải lên tệp "{original_name}" thành công!', 'success')
    except Exception as e:
        flash(f'Lỗi lưu thông tin tệp vào CSDL: {str(e)}', 'danger')
        
    return redirect(url_for('events.detail', event_id=event_id, tab='attachments'))

@events_bp.route('/events/<int:event_id>/attachments/<int:doc_id>/delete', methods=['POST'])
@login_required
def delete_attachment(event_id, doc_id):
    """Xóa tệp đính kèm nếu là người tải hoặc quản trị viên"""
    try:
        event_repo.delete_event_document(doc_id, event_id)
        flash('Đã xóa tệp đính kèm thành công.', 'success')
    except Exception as e:
        flash(f'Không thể xóa tệp: {str(e)}', 'danger')
    return redirect(url_for('events.detail', event_id=event_id, tab='attachments'))

@events_bp.route('/events/<int:event_id>/attachments/<int:doc_id>/download')
@login_required
def download_attachment(event_id, doc_id):
    """Tải xuống tệp đính kèm từ thư mục lưu trữ cục bộ"""
    docs = event_repo.get_event_documents(event_id)
    doc = next((d for d in docs if d['DocumentId'] == doc_id), None)
    if not doc:
        flash('Tệp đính kèm không tồn tại.', 'danger')
        return redirect(url_for('events.detail', event_id=event_id, tab='attachments'))
        
    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', f'event_{event_id}')
    file_path = os.path.join(upload_dir, doc['StorageKey'])
    if not os.path.exists(file_path):
        flash('Tệp vật lý không tìm thấy trên máy chủ lưu trữ.', 'warning')
        return redirect(url_for('events.detail', event_id=event_id, tab='attachments'))
        
    return send_from_directory(upload_dir, doc['StorageKey'], download_name=doc['OriginalFileName'], as_attachment=True)

@events_bp.route('/events/<int:event_id>/edit', methods=['GET', 'POST'])
@login_required
@permission_required('events.edit')
def edit(event_id):
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    if request.method == 'POST':
        title = request.form.get('title', '').strip()
        description = request.form.get('description', '').strip()
        starts_at = _normalize_datetime(request.form.get('starts_at'))
        ends_at = _normalize_datetime(request.form.get('ends_at'))
        attendees = request.form.get('attendees') or None
        objectives = request.form.get('objectives', '').strip()
        content = request.form.get('content', '').strip()
        timeline = request.form.get('timeline', '').strip()
        staffing = request.form.get('staffing', '').strip()
        risk_plan = request.form.get('risk_plan', '').strip()
        
        try:
            event_repo.update_event_plan(
                event_id=event_id,
                title=title,
                description=description,
                starts_at=starts_at,
                ends_at=ends_at,
                attendees=int(attendees) if attendees else None,
                objectives=objectives,
                content=content,
                timeline=timeline,
                staffing=staffing,
                risk_plan=risk_plan
            )
            flash('Cập nhật kế hoạch sự kiện thành công!', 'success')
            return redirect(url_for('events.detail', event_id=event_id, tab='plan'))
        except Exception as e:
            flash(f'Lỗi khi lưu dữ liệu: {str(e)}', 'danger')
            
    return render_template('events/edit.html', event=event)

@events_bp.route('/events/<int:event_id>/budget', methods=['GET', 'POST'])
@login_required
@permission_required('events.edit')
def budget(event_id):
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    if request.method == 'POST':
        names = request.form.getlist('item_name[]')
        qtys = request.form.getlist('quantity[]')
        prices = request.form.getlist('unit_price[]')
        
        items = []
        for n, q, p in zip(names, qtys, prices):
            if n.strip():
                try:
                    items.append({
                        "name": n.strip(),
                        "qty": float(q),
                        "price": float(p)
                    })
                except ValueError:
                    pass
                    
        try:
            event_repo.save_budget_items(event_id, items)
            flash('Lưu bảng dự trù kinh phí thành công!', 'success')
            return redirect(url_for('events.detail', event_id=event_id, tab='budget'))
        except Exception as e:
            flash(f'Lỗi lưu dự trù kinh phí: {str(e)}', 'danger')
            
    items = event_repo.get_budget_items(event_id)
    return render_template('events/budget.html', event=event, items=items)

@events_bp.route('/events/<int:event_id>/action/<action_code>', methods=['POST'])
@login_required
def action(event_id, action_code):
    """
    Thực thi chuyển trạng thái theo BPMN thông qua Stored Procedure usp_TransitionEvent
    Bảo đảm quy tắc: Lý do/góp ý là bắt buộc khi REJECT hoặc REQUEST_REVISION
    """
    comment = request.form.get('comment', '').strip()
    
    if action_code in ('REJECT', 'REQUEST_REVISION', 'REQUEST_DOCUMENTS') and not comment:
        flash('Bắt buộc phải nhập ý kiến hoặc lý do khi từ chối / yêu cầu chỉnh sửa.', 'danger')
        return redirect(url_for('events.detail', event_id=event_id))
        
    try:
        result = event_repo.transition_event_sp(
            event_id=event_id,
            actor_id=current_user.id,
            action_code=action_code,
            comment=comment or None
        )
        if result:
            flash(f'Chuyển trạng thái hồ sơ thành công sang: {result["current_state"]}', 'success')
        else:
            flash('Thực thi thao tác thành công.', 'success')
    except Exception as e:
        flash(f'Không thể thực hiện thao tác: {str(e)}', 'danger')
        
    return redirect(url_for('events.detail', event_id=event_id))

@events_bp.route('/events/<int:event_id>/ai-review', methods=['POST'])
@login_required
def ai_review(event_id):
    """Gọi công cụ AI rà soát nội dung hồ sơ (BPMN: AIReview)"""
    event = event_repo.get_event_detail(event_id)
    budget_items = event_repo.get_budget_items(event_id)
    
    res = ai_assistant.review_event_proposal(
        title=event.get('Title'),
        objectives=event.get('Objectives'),
        program_content=event.get('ProgramContent'),
        timeline=event.get('Timeline'),
        staffing=event.get('Staffing'),
        risk_plan=event.get('RiskPlan'),
        budget_items=budget_items,
        expected_attendees=event.get('ExpectedAttendees')
    )
    return jsonify(res)
