import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Lock, ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(!!tokenFromUrl);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenEmail, setTokenEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      setVerifying(true);
      api.verifyResetToken(tokenFromUrl)
        .then((res) => {
          if (res.success) {
            setTokenValid(true);
            setTokenEmail(res.email || '');
          } else {
            setTokenValid(false);
            setError('Mã xác thực không hợp lệ hoặc đã hết hạn.');
          }
        })
        .catch((err: any) => {
          setTokenValid(false);
          setError(err.message || 'Không thể xác thực mã khôi phục.');
        })
        .finally(() => {
          setVerifying(false);
        });
    }
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token.trim()) {
      setError('Vui lòng nhập mã xác thực (reset token).');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-[#005FAF] shadow-sm mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Đặt lại mật khẩu mới
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Hệ thống Quản lý Quy trình Tổ chức Sự kiện – DUE
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-10">
          {success ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Đặt lại mật khẩu thành công!
              </h3>
              <p className="text-sm text-slate-600">
                Mật khẩu của bạn đã được cập nhật an toàn. Mọi trạng thái khóa đăng nhập tạm thời đã được gỡ bỏ.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full inline-flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#005FAF] hover:bg-[#004A8A] transition-colors cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </div>
            </div>
          ) : (
            <>
              {verifying ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  <div className="w-6 h-6 border-2 border-[#005FAF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Đang xác thực liên kết khôi phục...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {tokenEmail && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-[#005FAF]" />
                      <span>Đang đặt lại mật khẩu cho tài khoản: <strong>{tokenEmail}</strong></span>
                    </div>
                  )}

                  {!tokenFromUrl && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                        Mã xác thực (Token) *
                      </label>
                      <input
                        type="text"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="Nhập mã xác thực từ email hoặc quản trị viên"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white transition-all font-mono"
                        required
                      />
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        Chưa có mã? <Link to="/forgot-password" className="text-[#005FAF] font-semibold hover:underline">Nhận mã xác minh OTP qua email tại đây</Link>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Mật khẩu mới *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Tối thiểu 6 ký tự"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Xác nhận mật khẩu mới *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white transition-all pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (tokenValid === false && !!tokenFromUrl)}
                    className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-[#005FAF] hover:bg-[#004A8A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005FAF] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {loading ? (
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
                      Quay lại trang Đăng nhập
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
