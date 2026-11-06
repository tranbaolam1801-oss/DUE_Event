/**
 * MY DUE - CLIENT-SIDE INTERACTION SCRIPT
 * Tuân thủ nghiêm túc Giáo trình Chương 6:
 * - Hỗ trợ song song Mouse-Only và Keyboard-Only (Tab, Enter, Space, Esc)
 * - Giảm thiểu thao tác và lỗi nhập liệu (Error Prevention & Feedback)
 * - Tự động tính toán số liệu (Không bắt người dùng tự tính nhẩm)
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Mobile Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('btnSidebarToggle');
    const sidebar = document.getElementById('appSidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function () {
            sidebar.classList.toggle('open');
            const isOpen = sidebar.classList.contains('open');
            sidebarToggleBtn.setAttribute('aria-expanded', isOpen);
        });
    }

    // 2. Hiện / Ẩn mật khẩu (Show/Hide Password Toggle)
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
            togglePasswordBtn.setAttribute('aria-label', isPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu');
            
            const iconSvg = togglePasswordBtn.querySelector('svg');
            if (iconSvg) {
                if (isPassword) {
                    // Biểu tượng mắt gạch chéo
                    iconSvg.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
                } else {
                    // Biểu tượng mắt mở
                    iconSvg.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
                }
            }
        });
    }

    // 3. Quản lý Modal & Focus Trapping cho Bàn phím (Chương 6 Mục 12)
    window.openModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');

        // Tìm phần tử có thể focus đầu tiên để chuyển focus vào modal
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    };

    window.closeModal = function (modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    };

    // Lắng nghe phím ESC để đóng Modal đang mở
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const activeModals = document.querySelectorAll('.modal-overlay.active');
            activeModals.forEach(m => m.classList.remove('active'));
        }
    });

    // 4. Tự động tính tổng tiền dự trù kinh phí (Budget Calculation)
    function calculateBudgetTotals() {
        let total = 0;
        const rows = document.querySelectorAll('.budget-row');
        rows.forEach(row => {
            const qtyInput = row.querySelector('.budget-qty');
            const priceInput = row.querySelector('.budget-price');
            const amountCell = row.querySelector('.budget-amount');

            const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
            const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
            const amount = qty * price;

            if (amountCell) {
                amountCell.textContent = new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
            }
            total += amount;
        });

        const totalDisplay = document.getElementById('budgetTotalDisplay');
        if (totalDisplay) {
            totalDisplay.textContent = new Intl.NumberFormat('vi-VN').format(total) + ' đ';
        }
    }

    const budgetTable = document.getElementById('budgetTable');
    if (budgetTable) {
        budgetTable.addEventListener('input', function (e) {
            if (e.target.classList.contains('budget-qty') || e.target.classList.contains('budget-price')) {
                calculateBudgetTotals();
            }
        });

        const addRowBtn = document.getElementById('btnAddBudgetRow');
        if (addRowBtn) {
            addRowBtn.addEventListener('click', function () {
                const tbody = budgetTable.querySelector('tbody');
                const tr = document.createElement('tr');
                tr.className = 'budget-row';
                tr.innerHTML = `
                    <td><input type="text" name="item_name[]" class="form-control" placeholder="Tên khoản mục..." required></td>
                    <td><input type="number" name="quantity[]" class="form-control budget-qty" value="1" min="0.1" step="any" required></td>
                    <td><input type="number" name="unit_price[]" class="form-control budget-price" value="0" min="0" step="1000" required></td>
                    <td class="budget-amount text-end font-monospace" style="font-weight: 600;">0 đ</td>
                    <td class="text-center">
                        <button type="button" class="btn btn-outline btn-sm text-danger btn-remove-row" title="Xóa dòng" aria-label="Xóa dòng">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
                calculateBudgetTotals();
                tr.querySelector('input').focus();
            });
        }

        budgetTable.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-remove-row');
            if (btn) {
                const row = btn.closest('tr');
                if (row && budgetTable.querySelectorAll('.budget-row').length > 1) {
                    row.remove();
                    calculateBudgetTotals();
                }
            }
        });

        calculateBudgetTotals();
    }

    // 5. Nút đóng Alerts
    document.querySelectorAll('.alert-close').forEach(btn => {
        btn.addEventListener('click', function () {
            const alert = this.closest('.alert');
            if (alert) alert.remove();
        });
    });
});
