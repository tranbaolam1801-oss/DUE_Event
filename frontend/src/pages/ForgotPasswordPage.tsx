import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';

type Step = 'EMAIL' | 'OTP' | 'RESET_PASSWORD' | 'SUCCESS';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // Wizard Step
  const [currentStep, setCurrentStep] = useState<Step>('EMAIL');

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 2: OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Step 3: New Password
  const [resetSessionToken, setResetSessionToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Status & Loading
  const [generalError, setGeneralError] = useState('');
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);

  // Countdown timer for Resend OTP in Step 2
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 'OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentStep, countdown]);

  // ── BƯỚC 1: Gửi yêu cầu mã OTP qua Email ──────────────────────────────
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setEmailError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Vui lòng nhập địa chỉ email đã đăng ký');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setEmailError('Email không đúng định dạng');
      return;
    }

    setPending(true);
    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setCurrentStep('OTP');
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể gửi yêu cầu xác minh. Vui lòng thử lại sau.');
    } finally {
      setPending(false);
    }
  };

  // ── Gửi lại mã OTP ──────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setGeneralError('');
    setOtpError('');
    setResending(true);

    try {
      await api.forgotPassword(email.trim().toLowerCase());
      setCountdown(60);
      setCanResend(false);
      setOtp('');
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setResending(false);
    }
  };

  // ── BƯỚC 2: Xác thực mã OTP ─────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setOtpError('');

    const cleanOtp = otp.trim().replace(/\s+/g, '');
    if (!cleanOtp) {
      setOtpError('Vui lòng nhập mã xác minh 6 chữ số');
      return;
    }
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Mã xác minh phải bao gồm đúng 6 chữ số');
      return;
    }

    setPending(true);
    try {
      const res = await api.verifyOtp(email.trim().toLowerCase(), cleanOtp);
      if (res.success && res.resetSessionToken) {
        setResetSessionToken(res.resetSessionToken);
        setCurrentStep('RESET_PASSWORD');
      } else {
        setOtpError('Mã xác minh không chính xác hoặc đã hết hạn.');
      }
    } catch (err: any) {
      setOtpError(err.message || 'Mã xác minh không đúng. Vui lòng kiểm tra lại.');
    } finally {
      setPending(false);
    }
  };

  // ── BƯỚC 3: Cập nhật mật khẩu mới ──────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không trùng khớp với mật khẩu mới');
      return;
    }

    setPending(true);
    try {
      await api.resetPassword({
        token: resetSessionToken,
        newPassword,
        confirmPassword,
      });
      setCurrentStep('SUCCESS');
    } catch (err: any) {
      setGeneralError(err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại từ đầu.');
    } finally {
      setPending(false);
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
            {currentStep === 'EMAIL' && 'Khôi phục mật khẩu'}
            {currentStep === 'OTP' && 'Xác minh mã OTP'}
            {currentStep === 'RESET_PASSWORD' && 'Đặt lại mật khẩu mới'}
            {currentStep === 'SUCCESS' && 'Hoàn tất khôi phục'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {currentStep === 'EMAIL' && 'Nhập email đã đăng ký để nhận mã xác minh OTP 6 số'}
            {currentStep === 'OTP' && 'Nhập mã 6 chữ số đã được gửi tới email của bạn'}
            {currentStep === 'RESET_PASSWORD' && 'Thiết lập mật khẩu bảo mật mới cho tài khoản'}
            {currentStep === 'SUCCESS' && 'Mật khẩu đã được cập nhật an toàn'}
          </p>
        </div>

        {/* Thanh tiến trình 3 bước */}
        {currentStep !== 'SUCCESS' && (
          <div className="mb-6 flex items-center justify-between relative px-4">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                currentStep === 'EMAIL'
                  ? 'bg-[#005FAF] text-white ring-4 ring-blue-100'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              1
            </div>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                currentStep === 'OTP'
                  ? 'bg-[#005FAF] text-white ring-4 ring-blue-100'
                  : currentStep === 'RESET_PASSWORD'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              2
            </div>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                currentStep === 'RESET_PASSWORD'
                  ? 'bg-[#005FAF] text-white ring-4 ring-blue-100'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              3
            </div>
          </div>
        )}

        {/* Thông báo lỗi chung */}
        {generalError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{generalError}</span>
          </div>
        )}

        {/* ── BƯỚC 1: NHẬP EMAIL ── */}
        {currentStep === 'EMAIL' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email tài khoản đã đăng ký <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }}
                  placeholder="Ví dụ: btc1@eventflow.vn"
                  className={`w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border transition-all ${
                    emailError
                      ? 'border-red-500 ring-2 ring-red-500/10'
                      : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                  }`}
                  autoFocus
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {emailError && (
                <p className="text-xs text-red-600 mt-1 font-medium">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center min-h-[42px] cursor-pointer disabled:opacity-60"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Gửi mã xác minh'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005FAF] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về đăng nhập</span>
              </Link>
            </div>
          </form>
        )}

        {/* ── BƯỚC 2: NHẬP MÃ OTP 6 CHỮ SỐ ── */}
        {currentStep === 'OTP' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
              <p className="font-semibold text-blue-950">Chúng tôi đã gửi mã xác minh đến email của bạn:</p>
              <p className="font-mono font-bold text-blue-800 mt-0.5 truncate">{email}</p>
              <p className="text-[11px] text-blue-700 mt-1">
                Vui lòng kiểm tra hộp thư đến hoặc thư rác (Spam). Mã có hiệu lực trong 5 phút.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 text-center">
                Mã xác minh OTP (6 chữ số) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setOtp(val);
                    if (otpError) setOtpError('');
                  }}
                  placeholder="• • • • • •"
                  className={`w-full py-2.5 text-center text-2xl font-mono tracking-[0.5em] font-bold text-slate-900 bg-slate-50 border rounded-lg transition-all focus:bg-white ${
                    otpError
                      ? 'border-red-500 ring-2 ring-red-500/10'
                      : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                  }`}
                  autoFocus
                />
              </div>
              {otpError && (
                <p className="text-xs text-red-600 mt-1 font-medium text-center">{otpError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending || otp.length !== 6}
              className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center min-h-[42px] cursor-pointer disabled:opacity-60"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Xác minh mã'
              )}
            </button>

            {/* Nút gửi lại mã với đếm ngược */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={!canResend || resending}
                className="font-semibold text-[#005FAF] hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer disabled:cursor-not-allowed inline-flex items-center gap-1"
              >
                {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
                <span>
                  {canResend ? 'Gửi lại mã OTP' : `Gửi lại mã sau (${countdown}s)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep('EMAIL')}
                className="text-slate-500 hover:text-slate-800"
              >
                Đổi email khác
              </button>
            </div>

            <div className="text-center pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005FAF] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về đăng nhập</span>
              </Link>
            </div>
          </form>
        )}

        {/* ── BƯỚC 3: ĐẶT LẠI MẬT KHẨU MỚI (KHÔNG CẦN NHẬP LẠI TOKEN) ── */}
        {currentStep === 'RESET_PASSWORD' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Xác minh email thành công! Vui lòng thiết lập mật khẩu mới:</span>
            </div>

            {/* Mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Xác nhận mật khẩu mới */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white rounded-lg border border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-600 mt-1 font-medium">{passwordError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center min-h-[42px] cursor-pointer disabled:opacity-60"
            >
              {pending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Cập nhật mật khẩu'
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#005FAF] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay về đăng nhập</span>
              </Link>
            </div>
          </form>
        )}

        {/* ── BƯỚC 4: THÀNH CÔNG ── */}
        {currentStep === 'SUCCESS' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Đặt lại mật khẩu thành công!
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              Mật khẩu mới của bạn đã được cập nhật thành công. Mọi trạng thái khóa đăng nhập tạm thời đã được gỡ bỏ.
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center min-h-[42px] cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
