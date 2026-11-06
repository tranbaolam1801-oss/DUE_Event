import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Optional fields (expandable)
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');

  // Status & Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Validate form
  const validateForm = () => {
    const err: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      err.fullName = 'Họ và tên phải có ít nhất 2 ký tự';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      err.email = 'Vui lòng nhập địa chỉ email';
    } else if (!emailRegex.test(email.trim())) {
      err.email = 'Email không đúng định dạng (Ví dụ: sinhvien@due.edu.vn)';
    }

    if (phone.trim()) {
      const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
      if (!phoneRegex.test(phone.trim().replace(/\s+/g, ''))) {
        err.phone = 'Số điện thoại không hợp lệ (cần là số di động Việt Nam 10 số)';
      }
    }

    if (!password) {
      err.password = 'Vui lòng nhập mật khẩu';
    } else if (password.length < 6) {
      err.password = 'Mật khẩu phải có độ dài tối thiểu 6 ký tự';
    }

    if (!confirmPassword) {
      err.confirmPassword = 'Vui lòng xác nhận lại mật khẩu';
    } else if (password !== confirmPassword) {
      err.confirmPassword = 'Mật khẩu xác nhận không trùng khớp';
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validateForm()) return;

    setPending(true);
    try {
      const res = await api.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        department: department.trim() || undefined,
        password,
        confirmPassword,
      });

      setSuccessMessage(res.message || 'Đăng ký tài khoản thành công! Đang chuyển hướng về trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setGeneralError(err.message || 'Đăng ký không thành công. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setPending(false);
    }
  };

  const handleGoogleAuth = async () => {
    setGeneralError('');
    setGoogleLoading(true);
    try {
      // Gọi endpoint xác thực Google thực tế của backend
      await api.googleAuth('');
    } catch (err: any) {
      setGeneralError(
        err.message ||
          'Chức năng đăng ký bằng Google yêu cầu quản trị viên cấu hình GOOGLE_CLIENT_ID trong tệp môi trường máy chủ.'
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-8 my-auto animate-fadeIn">
        
        {/* Header DUE */}
        <div className="text-center mb-6">
          <img
            src="/images/due_logo_emblem.png"
            alt="Logo DUE"
            className="h-14 sm:h-16 w-auto object-contain mx-auto"
          />
          <div className="text-[11px] sm:text-xs font-bold tracking-widest text-[#005FAF]/80 uppercase mt-2.5">
            ĐẠI HỌC ĐÀ NẴNG
          </div>
          <h2 className="text-center font-bold text-sm sm:text-base tracking-wide text-[#005FAF] mt-0.5 uppercase">
            TRƯỜNG ĐẠI HỌC KINH TẾ
          </h2>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-3">
            Tạo tài khoản
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Đăng ký tài khoản dành cho Ban Tổ chức sự kiện (BTC)
          </p>
        </div>

        {/* Thông báo lỗi chung */}
        {generalError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form đăng ký */}
        <form onSubmit={handleRegister} noValidate className="space-y-3.5">
          {/* 1. Họ và tên */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors({ ...errors, fullName: '' });
              }}
              placeholder="Ví dụ: Nguyễn Văn A"
              className={`w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border transition-all ${
                errors.fullName
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
              }`}
            />
            {errors.fullName && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.fullName}</p>
            )}
          </div>

          {/* 2. Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="sinhvien@due.edu.vn"
              className={`w-full px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border transition-all ${
                errors.email
                  ? 'border-red-500 ring-2 ring-red-500/10'
                  : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
              }`}
            />
            {errors.email && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          {/* 3. Mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="Tối thiểu 6 ký tự"
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border transition-all ${
                  errors.password
                    ? 'border-red-500 ring-2 ring-red-500/10'
                    : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.password}</p>
            )}
          </div>

          {/* 4. Xác nhận mật khẩu */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Xác nhận mật khẩu <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                }}
                placeholder="Nhập lại mật khẩu"
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border transition-all ${
                  errors.confirmPassword
                    ? 'border-red-500 ring-2 ring-red-500/10'
                    : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1 font-medium">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Tùy chọn mở rộng: Số điện thoại và Đơn vị */}
          <div>
            <button
              type="button"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="text-xs font-medium text-[#005FAF] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showOptionalFields ? 'Ẩn thông tin bổ sung' : '+ Thêm số điện thoại và đơn vị (tùy chọn)'}</span>
              {showOptionalFields ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showOptionalFields && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="Ví dụ: 0905123456"
                    className="w-full px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1 font-medium">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Đơn vị / Khoa / Câu lạc bộ
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Ví dụ: CLB Kỹ năng DUE"
                    className="w-full px-3.5 py-2 text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6. Nút "Đăng ký tài khoản" */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center min-h-[42px] cursor-pointer disabled:opacity-60"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Đăng ký tài khoản'
              )}
            </button>
          </div>
        </form>

        {/* 7. Dòng phân cách "Hoặc tiếp tục với" */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-slate-500 font-medium">Hoặc tiếp tục với</span>
          </div>
        </div>

        {/* 8. Nút "Tiếp tục với Google" */}
        <div>
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 transition-all flex items-center justify-center gap-2.5 min-h-[42px] cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}</span>
          </button>
        </div>

        {/* 9. Liên kết "Đã có tài khoản? Đăng nhập" */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs sm:text-sm text-slate-600">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-semibold text-[#005FAF] hover:text-[#004A8A] hover:underline"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
};
