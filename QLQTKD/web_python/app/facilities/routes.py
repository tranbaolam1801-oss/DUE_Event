from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify, abort
from flask_login import login_required, current_user
from app.auth.decorators import permission_required
from app.repositories import facility_repo, event_repo
from app.database import execute_query
from app.services import ai_assistant

facilities_bp = Blueprint('facilities', __name__)

def _normalize_datetime(dt_str):
    """Chuẩn hóa chuỗi thời gian từ HTML datetime-local về định dạng SQL Server tương thích"""
    if not dt_str:
        return None
    cleaned = dt_str.strip().replace('T', ' ')
    if len(cleaned) == 16:  # 'YYYY-MM-DD HH:MM' -> 'YYYY-MM-DD HH:MM:00'
        cleaned += ':00'
    return cleaned

# =========================================================================
# =========================================================================
# TAB 1: YÊU CẦU ĐĂNG KÝ CSVC (/facilities HOẶC /facilities/requests)
# =========================================================================
@facilities_bp.route('/facilities')
@facilities_bp.route('/facilities/requests')
@login_required
@permission_required('facilities.view')
def index():
    """Tab 1: Danh sách yêu cầu CSVC & Hồ sơ sự kiện cần bố trí (BPMN: FacilityRequests)"""
    search = request.args.get('q', '').strip()
    status = request.args.get('status', 'ALL')
    
    requests_list, counts = facility_repo.get_facility_requests_for_user(current_user, search_query=search, status_filter=status)
    
    return render_template('facilities/requests.html',
                           active_tab='requests',
                           requests_list=requests_list,
                           search_query=search,
                           current_status=status,
                           counts=counts,
                           total_reqs=counts['total'],
                           pending_count=counts['pending'],
                           approved_count=counts['approved'])

# =========================================================================
# TAB 2: LỊCH SỬ DỤNG GIẢNG ĐƯỜNG & HỘI TRƯỜNG (/facilities/schedule)
# =========================================================================
@facilities_bp.route('/facilities/schedule')
@login_required
@permission_required('facilities.schedule.view')
def schedule():
    """Tab 2: Lịch sử dụng giảng đường và hội trường dạng Calendar trực quan (Google / Outlook style)"""
    facility_id = request.args.get('facility_id', 'ALL')
    facilities = facility_repo.get_all_facilities()
    calendar_events = facility_repo.get_calendar_events_json(facility_id=facility_id)
    
    return render_template('facilities/schedule.html',
                           active_tab='schedule',
                           facilities=facilities,
                           calendar_events=calendar_events,
                           current_facility_id=facility_id,
                           total_events=len(calendar_events))

@facilities_bp.route('/facilities/api/events')
@login_required
@permission_required('facilities.schedule.view')
def api_events():
    """Endpoint API trả về danh sách sự kiện JSON phục vụ FullCalendar"""
    facility_id = request.args.get('facility_id', 'ALL')
    events = facility_repo.get_calendar_events_json(facility_id=facility_id)
    return jsonify(events)

# =========================================================================
# TAB 3: PHÒNG & THIẾT BỊ (/facilities/catalog)
# =========================================================================
@facilities_bp.route('/facilities/catalog')
@login_required
@permission_required('facilities.view')
def catalog():
    """Tab 3: Danh mục phòng, hội trường, sức chứa và kho thiết bị DUE (BPMN: FacilitiesCatalog)"""
    search = request.args.get('q', '').strip()
    cap_filter = request.args.get('capacity', 'ALL')
    
    facilities = facility_repo.get_all_facilities()
    equipment_items = facility_repo.get_all_equipment_with_availability()
    reservations = facility_repo.get_all_active_reservations()
    active_facility_ids = {r.get('FacilityId') for r in reservations if r.get('FacilityId')}
    
    # Lọc danh mục phòng
    filtered_facilities = []
    for f in facilities:
        f['IsOccupied'] = f['FacilityId'] in active_facility_ids
        match_search = not search or search.lower() in f['Name'].lower() or search.lower() in f['Code'].lower()
        match_cap = True
        cap = int(f.get('Capacity') or 0)
        if cap_filter == 'SMALL':
            match_cap = cap < 100
        elif cap_filter == 'MEDIUM':
            match_cap = 100 <= cap <= 300
        elif cap_filter == 'LARGE':
            match_cap = cap > 300
            
        if match_search and match_cap:
            filtered_facilities.append(f)
            
    return render_template('facilities/catalog.html',
                           active_tab='catalog',
                           facilities=filtered_facilities,
                           equipment_items=equipment_items,
                           search_query=search,
                           current_capacity=cap_filter)

# =========================================================================
# NGHIỆP VỤ CSVC: BỐ TRÍ PHÒNG CHO SỰ KIỆN (CHỈ DÀNH CHO PHÒNG CSVC / ADMIN)
# =========================================================================
@facilities_bp.route('/facilities/assign/<int:event_id>', methods=['GET', 'POST'])
@login_required
@permission_required('facilities.assign')
def assign_facility(event_id):
    """
    Chức năng nghiệp vụ dành riêng cho nhân viên Phòng CSVC: Bố trí hội trường & thiết bị
    Kiểm tra nghiêm ngặt quyền 'facilities.assign', nếu BCH truy cập sẽ trả về HTTP 403 Forbidden.
    """
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('facilities.index'))
        
    facilities = facility_repo.get_all_facilities()
    equipment_list = facility_repo.get_all_equipment()
    facility_req = facility_repo.get_facility_request_by_event(event_id)
    existing_reservations = facility_repo.get_reservations_for_request(facility_req['RequestId']) if facility_req else []
    
    if request.method == 'POST':
        selected_facility_id = request.form.get('facility_id')
        starts_at = _normalize_datetime(request.form.get('starts_at')) or _normalize_datetime(str(event.get('StartsAt')))
        ends_at = _normalize_datetime(request.form.get('ends_at')) or _normalize_datetime(str(event.get('EndsAt')))
        note = request.form.get('note', '').strip()
        auto_approve = request.form.get('auto_approve') == '1'
        
        # Danh mục thiết bị phân bổ
        equipment_counts = {}
        for eq in equipment_list:
            qty = request.form.get(f"eq_{eq['EquipmentId']}", 0)
            if int(qty) > 0:
                equipment_counts[eq['EquipmentId']] = int(qty)
                
        try:
            # 1. Tạo hoặc cập nhật FacilityRequest
            req_id = facility_repo.create_or_update_facility_request(
                event_id=event_id,
                requested_by=event.get('CreatedBy') or current_user.id,
                note=note
            )
            
            # 2. Cập nhật thiết bị
            facility_repo.save_equipment_requests(req_id, equipment_counts)
            
            # 3. Giữ chỗ phòng có kiểm tra chống trùng lịch (Anti-collision)
            if selected_facility_id and starts_at and ends_at:
                conflicts = facility_repo.check_facility_conflict(int(selected_facility_id), starts_at, ends_at)
                if conflicts:
                    flash(f'Cảnh báo: Hội trường này đã có lịch đặt ({conflicts[0]["EventTitle"]}). Vui lòng chọn địa điểm hoặc khung giờ khác!', 'warning')
                    return render_template('facilities/assign.html',
                                           event=event,
                                           facilities=facilities,
                                           equipment_list=equipment_list,
                                           facility_req=facility_req,
                                           existing_reservations=existing_reservations)
                else:
                    facility_repo.reserve_facility_sp(req_id, int(selected_facility_id), starts_at, ends_at)
            
            # 4. Nếu xác nhận phê duyệt ngay
            if auto_approve:
                execute_query("UPDATE dbo.FacilityRequests SET Status = 'APPROVED' WHERE RequestId = ?", (req_id,))
                execute_query("UPDATE dbo.FacilityReservations SET Status = 'CONFIRMED' WHERE RequestId = ?", (req_id,))
                if event.get('StateCode') == 'PENDING_FACILITY':
                    event_repo.transition_event_sp(event_id, current_user.id, 'APPROVE', note or 'CSVC đã bố trí phòng và duyệt cấp địa điểm.')
                flash('Bố trí và phê duyệt cấp cơ sở vật chất thành công!', 'success')
            else:
                flash('Bố trí phòng thành công! Bản phân bổ đã được lưu vào hệ thống.', 'success')
                
            return redirect(url_for('facilities.review_request', request_id=req_id))
        except Exception as e:
            flash(f'Lỗi khi bố trí CSVC: {str(e)}', 'danger')
            
    return render_template('facilities/assign.html',
                           event=event,
                           facilities=facilities,
                           equipment_list=equipment_list,
                           facility_req=facility_req,
                           existing_reservations=existing_reservations)

# =========================================================================
# ĐĂNG KÝ CSVC DÀNH CHO BCH LIÊN CHI ĐOÀN (/facilities/request/<event_id>)
# =========================================================================
@facilities_bp.route('/facilities/request/<int:event_id>', methods=['GET', 'POST'])
@login_required
@permission_required('facilities.request')
def request_facility(event_id):
    """BCH Liên Chi Đoàn lập đơn đề xuất mượn cơ sở vật chất (BPMN: FacilityForm)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    facilities = facility_repo.get_all_facilities()
    equipment_list = facility_repo.get_all_equipment()
    facility_req = facility_repo.get_facility_request_by_event(event_id)
    
    if request.method == 'POST':
        note = request.form.get('note', '').strip()
        selected_facility_id = request.form.get('facility_id')
        starts_at = _normalize_datetime(request.form.get('starts_at')) or _normalize_datetime(str(event.get('StartsAt')))
        ends_at = _normalize_datetime(request.form.get('ends_at')) or _normalize_datetime(str(event.get('EndsAt')))
        
        # Thiết bị
        equipment_counts = {}
        for eq in equipment_list:
            qty = request.form.get(f"eq_{eq['EquipmentId']}", 0)
            if int(qty) > 0:
                equipment_counts[eq['EquipmentId']] = int(qty)
                
        try:
            req_id = facility_repo.create_or_update_facility_request(
                event_id=event_id,
                requested_by=current_user.id,
                note=note
            )
            facility_repo.save_equipment_requests(req_id, equipment_counts)
            
            if selected_facility_id and starts_at and ends_at:
                conflicts = facility_repo.check_facility_conflict(int(selected_facility_id), starts_at, ends_at)
                if conflicts:
                    flash(f'Cảnh báo: Hội trường này đã có lịch đặt ({conflicts[0]["EventTitle"]}). Bạn vẫn có thể gửi đơn để CSVC xem xét bố trí thay thế!', 'warning')
                else:
                    facility_repo.reserve_facility_sp(req_id, int(selected_facility_id), starts_at, ends_at)
                    
            flash('Gửi yêu cầu cơ sở vật chất thành công!', 'success')
            return redirect(url_for('events.detail', event_id=event_id))
        except Exception as e:
            flash(f'Lỗi khi gửi yêu cầu CSVC: {str(e)}', 'danger')
            
    return render_template('facilities/request.html',
                           event=event,
                           facilities=facilities,
                           equipment_list=equipment_list,
                           facility_req=facility_req)

# =========================================================================
# AI ASSISTANT: GỢI Ý BỐ TRÍ KHÔNG GIAN TỐI ƯU (BPMN: AISuggest)
# =========================================================================
@facilities_bp.route('/facilities/ai-suggest', methods=['POST'])
@login_required
def ai_suggest():
    """AI gợi ý bố trí phòng và thiết bị tối ưu theo quy mô sự kiện (BPMN: AISuggest)"""
    data = request.get_json() or {}
    attendees = data.get('attendees', 100)
    facilities = facility_repo.get_all_facilities()
    suggestions = ai_assistant.suggest_facility_allocation(attendees, facilities)
    return jsonify(suggestions)

# =========================================================================
# KIỂM TRA XUNG ĐỘT THỜI GIAN THỰC (LIVE COLLISION CHECK)
# =========================================================================
@facilities_bp.route('/facilities/check-collision', methods=['POST'])
@login_required
def check_collision():
    """Kiểm tra xung đột lịch biểu qua AJAX"""
    data = request.get_json() or {}
    facility_id = data.get('facility_id')
    starts_at = _normalize_datetime(data.get('starts_at'))
    ends_at = _normalize_datetime(data.get('ends_at'))
    
    if not facility_id or not starts_at or not ends_at:
        return jsonify({"has_conflict": False, "message": "Thiếu dữ liệu kiểm tra."})
        
    conflicts = facility_repo.check_facility_conflict(int(facility_id), starts_at, ends_at)
    if conflicts:
        return jsonify({
            "has_conflict": True,
            "conflict_event": conflicts[0]['EventTitle'],
            "organizer": conflicts[0].get('Organizer', 'Đơn vị khác'),
            "starts_at": str(conflicts[0]['StartsAt']),
            "ends_at": str(conflicts[0]['EndsAt'])
        })
    return jsonify({"has_conflict": False, "message": "Khung giờ hoàn toàn khả dụng!"})

# =========================================================================
# THẨM ĐỊNH & XÁC NHẬN CẤP CSVC (CHỈ DÀNH CHO PHÒNG CSVC / ADMIN)
# =========================================================================
@facilities_bp.route('/facilities/review/<int:request_id>', methods=['GET', 'POST'])
@login_required
@permission_required('facilities.assign')
def review_request(request_id):
    """Phòng Cơ sở vật chất thẩm định và xử lý yêu cầu mượn phòng (BPMN: CheckSchedule -> ApproveFacility)"""
    sql = """
        SELECT fr.RequestId, fr.EventId, fr.RequestedBy, fr.RequestedAt, fr.Status, fr.Note,
               e.TicketCode, e.Title AS EventTitle, e.StartsAt, e.EndsAt, e.ExpectedAttendees,
               d.Name AS DepartmentName, u.DisplayName AS RequestedByName
        FROM dbo.FacilityRequests fr
        JOIN dbo.Events e ON e.EventId = fr.EventId
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = fr.RequestedBy
        WHERE fr.RequestId = ?
    """
    req_data = execute_query(sql, (request_id,), fetchone=True)
    if not req_data:
        flash('Yêu cầu CSVC không tồn tại.', 'danger')
        return redirect(url_for('facilities.index'))
        
    reservations = facility_repo.get_reservations_for_request(request_id)
    equipment_items = facility_repo.get_equipment_for_request(request_id)
    handovers = facility_repo.get_handovers_for_request(request_id)
    
    if request.method == 'POST':
        action = request.form.get('action') # APPROVE, REVISION
        note = request.form.get('note', '').strip()
        
        try:
            if action == 'APPROVE':
                execute_query("UPDATE dbo.FacilityRequests SET Status = 'APPROVED' WHERE RequestId = ?", (request_id,))
                execute_query("UPDATE dbo.FacilityReservations SET Status = 'CONFIRMED' WHERE RequestId = ?", (request_id,))
                event_repo.transition_event_sp(req_data['EventId'], current_user.id, 'APPROVE', note)
                flash('Phê duyệt cấp cơ sở vật chất thành công!', 'success')
            elif action == 'REVISION':
                event_repo.transition_event_sp(req_data['EventId'], current_user.id, 'REQUEST_REVISION', note)
                flash('Đã gửi yêu cầu điều chỉnh cơ sở vật chất.', 'warning')
                
            return redirect(url_for('facilities.review_request', request_id=request_id))
        except Exception as e:
            flash(f'Lỗi xử lý yêu cầu CSVC: {str(e)}', 'danger')
            
    return render_template('facilities/review.html',
                           req_data=req_data,
                           req_info=req_data,
                           reservations=reservations,
                           equipment_items=equipment_items,
                           handovers=handovers)

# =========================================================================
# LẬP BIÊN BẢN BÀN GIAO / HOÀN TRẢ TÀI SẢN (BPMN: Handover & Return)
# =========================================================================
@facilities_bp.route('/facilities/review/<int:request_id>/handover', methods=['POST'])
@login_required
@permission_required('facilities.handover')
def handover_action(request_id):
    """Ghi nhận biên bản bàn giao (ISSUE) hoặc nghiệm thu hoàn trả (RETURN)"""
    handover_type = request.form.get('handover_type', 'ISSUE')
    condition_note = request.form.get('condition_note', '').strip()
    
    try:
        facility_repo.record_handover(request_id, handover_type, current_user.id, condition_note)
        flash(f'Đã ghi nhận {"biên bản bàn giao CSVC trước sự kiện" if handover_type == "ISSUE" else "biên bản nghiệm thu hoàn trả sau sự kiện"} thành công!', 'success')
    except Exception as e:
        flash(f'Lỗi khi ghi nhận biên bản: {str(e)}', 'danger')
        
    return redirect(url_for('facilities.review_request', request_id=request_id))
