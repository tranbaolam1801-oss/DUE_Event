from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField
from wtforms.validators import DataRequired, Email, Length

class LoginForm(FlaskForm):
    username = StringField(
        'Email trường', 
        validators=[DataRequired(message='Vui lòng nhập email'), Email(message='Email không đúng định dạng')],
        render_kw={"placeholder": "Ví dụ: btc1@eventflow.vn", "autocomplete": "username", "autofocus": True}
    )
    password = PasswordField(
        'Mật khẩu', 
        validators=[DataRequired(message='Vui lòng nhập mật khẩu'), Length(min=6, message='Mật khẩu tối thiểu 6 ký tự')],
        render_kw={"placeholder": "Nhập mật khẩu...", "autocomplete": "current-password"}
    )
    remember = BooleanField('Ghi nhớ đăng nhập trên thiết bị này')
    submit = SubmitField('Đăng nhập hệ thống')
