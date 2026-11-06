from app.database import execute_query, execute_non_query, get_db_cursor

def get_all_facilities():
    """Lấy danh sách giảng đường, hội trường, phòng chức năng tại DUE"""
    sql = "SELECT FacilityId, Code, Name, Capacity FROM dbo.Facilities WHERE IsActive = 1 ORDER BY Name"
    return execute_query(sql)

def get_all_equipment():
    """Lấy danh mục trang thiết bị, âm thanh, ánh sáng phục vụ sự kiện"""
    sql = "SELECT EquipmentId, Code, Name, TotalQuantity FROM dbo.Equipment WHERE IsActive = 1 ORDER BY Name"
    return execute_query(sql)

def get_facility_request_by_event(event_id):
    """Lấy đơn yêu cầu CSVC gắn với sự kiện"""
    sql = """
        SELECT fr.RequestId, fr.EventId, fr.RequestedBy, fr.RequestedAt, fr.Status, fr.Note,
               u.DisplayName AS RequestedByName
        FROM dbo.FacilityRequests fr
        JOIN dbo.Users u ON u.UserId = fr.RequestedBy
        WHERE fr.EventId = ?
    """
    return execute_query(sql, (event_id,), fetchone=True)

def get_reservations_for_request(request_id):
    """Lấy danh sách phòng đã giữ chỗ trong đơn yêu cầu"""
    sql = """
        SELECT r.ReservationId, r.RequestId, r.FacilityId, f.Code AS FacilityCode, f.Name AS FacilityName,
               r.StartsAt, r.EndsAt, r.Status
        FROM dbo.FacilityReservations r
        JOIN dbo.Facilities f ON f.FacilityId = r.FacilityId
        WHERE r.RequestId = ?
    """
    return execute_query(sql, (request_id,))

def get_equipment_for_request(request_id):
    """Lấy danh sách thiết bị yêu cầu mượn"""
    sql = """
        SELECT er.RequestId, er.EquipmentId, eq.Code AS EquipmentCode, eq.Name AS EquipmentName,
               er.Quantity, eq.TotalQuantity
        FROM dbo.EquipmentRequests er
        JOIN dbo.Equipment eq ON eq.EquipmentId = er.EquipmentId
        WHERE er.RequestId = ?
    """
    return execute_query(sql, (request_id,))

def get_handovers_for_request(request_id):
    """Lấy lịch sử bàn giao và hoàn trả cơ sở vật chất"""
    sql = """
        SELECT h.HandoverId, h.RequestId, h.HandoverType, h.ConditionNote, h.RecordedAt,
               u.DisplayName AS RecordedByName
        FROM dbo.EquipmentHandovers h
        JOIN dbo.Users u ON u.UserId = h.RecordedBy
        WHERE h.RequestId = ?
        ORDER BY h.RecordedAt ASC
    """
    return execute_query(sql, (request_id,))

def check_facility_conflict(facility_id, starts_at, ends_at, exclude_reservation_id=None):
    """Kiểm tra xung đột lịch đặt phòng (trùng thời gian)"""
    sql = """
        SELECT r.ReservationId, r.StartsAt, r.EndsAt, e.Title AS EventTitle, u.DisplayName AS Organizer
        FROM dbo.FacilityReservations r
        JOIN dbo.FacilityRequests fr ON fr.RequestId = r.RequestId
        JOIN dbo.Events e ON e.EventId = fr.EventId
        JOIN dbo.Users u ON u.UserId = e.CreatedBy
        WHERE r.FacilityId = ?
          AND r.Status IN ('HELD', 'CONFIRMED')
          AND r.StartsAt < ? AND r.EndsAt > ?
    """
    params = [facility_id, ends_at, starts_at]
    if exclude_reservation_id:
        sql += " AND r.ReservationId <> ?"
        params.append(exclude_reservation_id)
    return execute_query(sql, tuple(params))

def create_or_update_facility_request(event_id, requested_by, note=None):
    """Tạo hoặc cập nhật yêu cầu CSVC cho sự kiện"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("SELECT RequestId FROM dbo.FacilityRequests WHERE EventId = ?", (event_id,))
        row = cur.fetchone()
        if row:
            request_id = row[0]
            cur.execute("""
                UPDATE dbo.FacilityRequests 
                SET Note = ?, Status = 'PENDING', RequestedAt = SYSUTCDATETIME()
                WHERE RequestId = ?
            """, (note, request_id))
            return request_id
        else:
            cur.execute("""
                INSERT INTO dbo.FacilityRequests(EventId, RequestedBy, Note, Status)
                OUTPUT INSERTED.RequestId
                VALUES(?, ?, ?, 'PENDING');
            """, (event_id, requested_by, note))
            return cur.fetchone()[0]

def reserve_facility_sp(request_id, facility_id, starts_at, ends_at):
    """Gọi Stored Procedure usp_ReserveFacility đảm bảo chống trùng lịch bằng UPDLOCK/HOLDLOCK"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            SET NOCOUNT ON;
            EXEC dbo.usp_ReserveFacility 
                @RequestId = ?, 
                @FacilityId = ?, 
                @StartsAt = ?, 
                @EndsAt = ?;
        """, (request_id, facility_id, starts_at, ends_at))
        row = cur.fetchone()
        return row[0] if row else None

def save_equipment_requests(request_id, equipment_items):
    """Lưu danh sách thiết bị yêu cầu"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("DELETE FROM dbo.EquipmentRequests WHERE RequestId = ?", (request_id,))
        for eq_id, qty in equipment_items.items():
            if int(qty) > 0:
                cur.execute("""
                    INSERT INTO dbo.EquipmentRequests(RequestId, EquipmentId, Quantity)
                    VALUES(?, ?, ?)
                """, (request_id, int(eq_id), int(qty)))

def record_handover(request_id, handover_type, recorded_by, note=None):
    """Ghi nhận biên bản bàn giao (ISSUE) hoặc hoàn trả (RETURN)"""
    with get_db_cursor(commit=True) as cur:
        cur.execute("""
            INSERT INTO dbo.EquipmentHandovers(RequestId, HandoverType, ConditionNote, RecordedBy)
            VALUES(?, ?, ?, ?)
        """, (request_id, handover_type, note, recorded_by))

def get_all_active_reservations(facility_id=None, date_filter=None):
    """Lấy danh sách các lịch đặt phòng với bộ lọc tùy chọn"""
    where_clauses = ["r.Status IN ('HELD', 'CONFIRMED')"]
    params = []

    if facility_id and facility_id != 'ALL':
        where_clauses.append("r.FacilityId = ?")
        params.append(int(facility_id))

    if date_filter:
        where_clauses.append("CAST(r.StartsAt AS DATE) = ?")
        params.append(date_filter)

    sql = f"""
        SELECT r.ReservationId, r.FacilityId, f.Code AS FacilityCode, f.Name AS FacilityName, f.Capacity,
               r.StartsAt, r.EndsAt, r.Status, e.TicketCode, e.Title AS EventTitle, e.EventId,
               d.Name AS DepartmentName, u.DisplayName AS OrganizerName
        FROM dbo.FacilityReservations r
        JOIN dbo.Facilities f ON f.FacilityId = r.FacilityId
        JOIN dbo.FacilityRequests fr ON fr.RequestId = r.RequestId
        JOIN dbo.Events e ON e.EventId = fr.EventId
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = e.CreatedBy
        WHERE {' AND '.join(where_clauses)}
        ORDER BY r.StartsAt ASC
    """
    return execute_query(sql, tuple(params))

def get_facility_requests_for_user(user, search_query=None, status_filter=None):
    """
    Lấy danh sách yêu cầu và hồ sơ sự kiện cần xử lý CSVC phân quyền theo vai trò.
    Chỉ lấy những sự kiện thực sự có liên quan đến CSVC (có FacilityRequest hoặc đang ở bước PENDING_FACILITY, EVENT_APPROVED, RETURN_PENDING).
    Trả về: (requests_list, counts_dict)
    """
    where_clauses = ["(fr.RequestId IS NOT NULL OR e.StateCode IN ('PENDING_FACILITY', 'EVENT_APPROVED', 'EVENT_HELD', 'RETURN_PENDING'))"]
    params = []

    if search_query:
        where_clauses.append("(e.Title LIKE ? OR e.TicketCode LIKE ? OR d.Name LIKE ?)")
        search_param = f"%{search_query.strip()}%"
        params.extend([search_param, search_param, search_param])

    # Phạm vi người dùng theo vai trò
    if user.has_role('BCH_LIEN_CHI_DOAN') and not user.has_role('SYSTEM_ADMIN', 'PHONG_CSVC'):
        where_clauses.append("(e.CreatedBy = ? OR e.OrganizerDepartmentId = ?)")
        params.extend([user.id, user.department_id or 1])
    elif not user.has_role('SYSTEM_ADMIN', 'PHONG_CSVC'):
        where_clauses.append("e.OrganizerDepartmentId = ?")
        params.append(user.department_id or 1)

    sql = f"""
        SELECT e.EventId, e.TicketCode, e.Title, d.Name AS DepartmentName,
               u.DisplayName AS OrganizerName, e.StartsAt, e.EndsAt, e.ExpectedAttendees,
               e.StateCode, s.StateName, fr.RequestId, 
               COALESCE(fr.Status, CASE WHEN e.StateCode = 'PENDING_FACILITY' THEN 'PENDING' ELSE 'DRAFT' END) AS RequestStatus,
               fr.RequestedAt, fr.Note,
               f.Name AS FacilityName, f.Code AS FacilityCode
        FROM dbo.Events e
        JOIN dbo.WorkflowStates s ON s.StateCode = e.StateCode
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = e.CreatedBy
        LEFT JOIN dbo.FacilityRequests fr ON fr.EventId = e.EventId
        LEFT JOIN dbo.FacilityReservations r ON r.RequestId = fr.RequestId
        LEFT JOIN dbo.Facilities f ON f.FacilityId = r.FacilityId
        WHERE {' AND '.join(where_clauses)}
        ORDER BY e.StartsAt ASC
    """
    all_rows = execute_query(sql, tuple(params))

    # Tính toán bộ đếm chính xác dựa trên dữ liệu thật của người dùng
    total_count = len(all_rows)
    pending_count = sum(1 for r in all_rows if r.get('RequestStatus') == 'PENDING' or (not r.get('RequestId') and r.get('StateCode') == 'PENDING_FACILITY'))
    approved_count = sum(1 for r in all_rows if r.get('RequestStatus') == 'APPROVED')

    # Áp dụng bộ lọc trạng thái nếu có
    filtered_rows = []
    for r in all_rows:
        st = r.get('RequestStatus')
        if status_filter == 'PENDING':
            if st == 'PENDING' or (not r.get('RequestId') and r.get('StateCode') == 'PENDING_FACILITY'):
                filtered_rows.append(r)
        elif status_filter == 'APPROVED':
            if st == 'APPROVED':
                filtered_rows.append(r)
        else:
            filtered_rows.append(r)

    counts = {
        'total': total_count,
        'pending': pending_count,
        'approved': approved_count
    }
    return filtered_rows, counts

def get_calendar_events_json(facility_id=None):
    """
    Lấy danh sách các lịch đặt phòng đã xác nhận / giữ chỗ định dạng chuẩn cho FullCalendar.
    Đồng bộ mã màu nhận diện DUE: #0E9045 (Approved/Confirmed), #FE751E (Held/Pending).
    """
    reservations = get_all_active_reservations(facility_id=facility_id, date_filter=None)
    
    calendar_events = []
    for r in reservations:
        status = r.get('Status')
        is_confirmed = (status == 'CONFIRMED')
        color = '#0E9045' if is_confirmed else '#FE751E'
        status_vn = 'Đã duyệt cấp' if is_confirmed else 'Đang giữ chỗ'
        
        title = f"{r.get('FacilityName')}: {r.get('EventTitle')}"
        starts_str = r['StartsAt'].isoformat() if hasattr(r['StartsAt'], 'isoformat') else str(r['StartsAt']).replace(' ', 'T')
        ends_str = r['EndsAt'].isoformat() if hasattr(r['EndsAt'], 'isoformat') else str(r['EndsAt']).replace(' ', 'T')
        
        calendar_events.append({
            'id': str(r.get('ReservationId')),
            'title': title,
            'start': starts_str,
            'end': ends_str,
            'backgroundColor': color,
            'borderColor': color,
            'textColor': '#FFFFFF',
            'className': 'fc-event-confirmed' if is_confirmed else 'fc-event-held',
            'extendedProps': {
                'reservationId': r.get('ReservationId'),
                'ticketCode': r.get('TicketCode'),
                'eventTitle': r.get('EventTitle'),
                'facilityName': r.get('FacilityName'),
                'facilityCode': r.get('FacilityCode'),
                'departmentName': r.get('DepartmentName'),
                'organizerName': r.get('OrganizerName'),
                'capacity': r.get('Capacity'),
                'status': status,
                'statusVn': status_vn,
                'eventId': r.get('EventId')
            }
        })
    return calendar_events

def get_all_equipment_with_availability():
    """Lấy danh mục thiết bị cùng số lượng đang mượn và số lượng còn khả dụng"""
    sql = """
        SELECT eq.EquipmentId, eq.Code, eq.Name, eq.TotalQuantity,
               ISNULL(SUM(CASE WHEN fr.Status IN ('APPROVED', 'PENDING') THEN er.Quantity ELSE 0 END), 0) AS InUseQuantity
        FROM dbo.Equipment eq
        LEFT JOIN dbo.EquipmentRequests er ON er.EquipmentId = eq.EquipmentId
        LEFT JOIN dbo.FacilityRequests fr ON fr.RequestId = er.RequestId
        WHERE eq.IsActive = 1
        GROUP BY eq.EquipmentId, eq.Code, eq.Name, eq.TotalQuantity
    """
    items = execute_query(sql)
    for it in items:
        it['AvailableQuantity'] = max(0, it['TotalQuantity'] - it['InUseQuantity'])
    return items
