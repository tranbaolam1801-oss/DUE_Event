from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from app.auth.forms import LoginForm
from app.repositories import user_repo

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for(current_user.get_landing_endpoint()))
    
    form = LoginForm()
    
    # Cho phép click nhanh tài khoản demo từ query param (tiện dụng theo Chương 6: Minimize User Effort)
    quick_email = request.args.get('email')
    if quick_email and request.method == 'GET':
        form.username.data = quick_email
        form.password.data = '123456'

    if form.validate_on_submit():
        email = form.username.data.strip()
        password = form.password.data
        
        user_row = user_repo.get_user_by_username(email)
        if not user_row:
            flash('Tài khoản không tồn tại trong hệ thống MY DUE.', 'danger')
            return render_template('auth/login.html', form=form)
        
        if not user_row['IsActive']:
            flash('Tài khoản này đã bị khóa hoặc chưa được kích hoạt.', 'warning')
            return render_template('auth/login.html', form=form)
        
        if not user_repo.verify_password(user_row['PasswordHash'], password):
            flash('Mật khẩu không chính xác. Vui lòng kiểm tra lại.', 'danger')
            return render_template('auth/login.html', form=form)
        
        # Đăng nhập thành công: tải thực thể User với đầy đủ vai trò và quyền từ CSDL
        user = user_repo.get_user_by_id(user_row['UserId'])
        login_user(user, remember=form.remember.data)
        
        flash(f'Chào mừng {user.display_name} ({user.role_title}) đăng nhập thành công!', 'success')
        
        next_page = request.args.get('next')
        if next_page and next_page.startswith('/') and next_page not in ('/dashboard', '/'):
            return redirect(next_page)
        return redirect(url_for(user.get_landing_endpoint()))
        
    return render_template('auth/login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Bạn đã đăng xuất khỏi hệ thống thành công.', 'info')
    return redirect(url_for('auth.login'))
