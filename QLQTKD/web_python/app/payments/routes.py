from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from app.auth.decorators import role_required, permission_required
from app.repositories import finance_repo, event_repo

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/finance')
@login_required
def index():
    """Hòm thư chứng từ và danh sách hồ sơ thanh quyết toán (BPMN: CheckPay)"""
    payments = finance_repo.get_all_payment_requests()
    return render_template('payments/list.html', payments=payments)

@payments_bp.route('/finance/create/<int:event_id>', methods=['GET', 'POST'])
@login_required
@permission_required('payments.submit')
def create(event_id):
    """BCH lập và rà soát hồ sơ chứng từ thanh toán (BPMN: PayPackage)"""
    event = event_repo.get_event_detail(event_id)
    if not event:
        flash('Hồ sơ sự kiện không tồn tại.', 'danger')
        return redirect(url_for('events.index'))
        
    budget_items = event_repo.get_budget_items(event_id)
    total_estimated = sum(float(b.get('EstimatedAmount', 0)) for b in budget_items)
    existing_payment = finance_repo.get_payment_request_by_event(event_id)
    
    if request.method == 'POST':
        amount_str = request.form.get('amount', '').replace(',', '').strip()
        try:
            amount = float(amount_str)
            if amount < 0:
                raise ValueError("Số tiền không âm")
        except ValueError:
            flash('Vui lòng nhập số tiền quyết toán hợp lệ.', 'danger')
            return render_template('payments/create.html', event=event, total_estimated=total_estimated, payment=existing_payment)
            
        try:
            pr_id = finance_repo.create_or_update_payment_request(
                event_id=event_id,
                amount=amount,
                submitted_by=current_user.id
            )
            flash('Gửi hồ sơ quyết toán kinh phí đến Phòng Kế hoạch - Tài chính thành công!', 'success')
            return redirect(url_for('events.detail', event_id=event_id))
        except Exception as e:
            flash(f'Lỗi khi gửi hồ sơ: {str(e)}', 'danger')

    return render_template('payments/create.html', event=event, total_estimated=total_estimated, payment=existing_payment)

@payments_bp.route('/finance/review/<int:payment_request_id>', methods=['GET', 'POST'])
@login_required
@role_required('PHONG_KHTC', 'SYSTEM_ADMIN')
def review(payment_request_id):
    """KHTC kiểm tra chứng từ thanh toán (BPMN: CheckPay -> GPay)"""
    sql = """
        SELECT pr.PaymentRequestId, pr.EventId, pr.Amount, pr.Status, pr.SubmittedBy,
               pr.ApprovedBy, pr.ApprovedAt, pr.PaidAt,
               u.DisplayName AS SubmittedByName,
               e.Title AS EventTitle, e.TicketCode, d.Name AS DepartmentName
        FROM dbo.PaymentRequests pr
        JOIN dbo.Events e ON e.EventId = pr.EventId
        JOIN dbo.Departments d ON d.DepartmentId = e.OrganizerDepartmentId
        JOIN dbo.Users u ON u.UserId = pr.SubmittedBy
        WHERE pr.PaymentRequestId = ?
    """
    from app.database import execute_query
    payment = execute_query(sql, (payment_request_id,), fetchone=True)
    if not payment:
        flash('Hồ sơ quyết toán không tồn tại.', 'danger')
        return redirect(url_for('payments.index'))
        
    decisions = finance_repo.get_payment_decisions(payment_request_id)
    budget_items = event_repo.get_budget_items(payment['EventId'])
    
    return render_template('payments/review.html',
                           payment=payment,
                           decisions=decisions,
                           budget_items=budget_items)

@payments_bp.route('/finance/authorize/<int:payment_request_id>', methods=['POST'])
@login_required
@role_required('APPROVAL_AUTHORITY', 'SYSTEM_ADMIN')
def authorize(payment_request_id):
    """Cấp có thẩm quyền phê duyệt quyết định chi (BPMN: ApprovePayment / RefusePay)"""
    decision_code = request.form.get('decision_code', 'APPROVED')
    reason = request.form.get('reason', '').strip()
    
    if decision_code == 'REJECTED' and not reason:
        flash('Bắt buộc phải ghi rõ lý do không chấp thuận thanh toán.', 'danger')
        return redirect(url_for('payments.review', payment_request_id=payment_request_id))
        
    try:
        finance_repo.record_payment_decision(
            payment_request_id=payment_request_id,
            decision_by=current_user.id,
            decision_code=decision_code,
            reason=reason or None
        )
        msg = "Phê duyệt chi thanh toán thành công!" if decision_code == 'APPROVED' else "Đã từ chối chi thanh toán."
        flash(msg, 'success' if decision_code == 'APPROVED' else 'warning')
    except Exception as e:
        flash(f'Lỗi khi ra quyết định: {str(e)}', 'danger')
        
    return redirect(url_for('payments.review', payment_request_id=payment_request_id))

@payments_bp.route('/finance/record-paid/<int:payment_request_id>', methods=['POST'])
@login_required
@role_required('PHONG_KHTC', 'SYSTEM_ADMIN')
def record_paid(payment_request_id):
    """KHTC thực hiện giải ngân chi tiền chuyển khoản (BPMN: PerformPay -> COMPLETED)"""
    try:
        finance_repo.record_paid(payment_request_id)
        flash('Đã ghi nhận hoàn tất giải ngân chuyển khoản thành công!', 'success')
    except Exception as e:
        flash(f'Lỗi ghi nhận giải ngân: {str(e)}', 'danger')
        
    return redirect(url_for('payments.review', payment_request_id=payment_request_id))
