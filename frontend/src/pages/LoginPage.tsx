import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ChevronDown, X, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// Cơ chế lưu danh sách tài khoản đã đăng nhập
// Key riêng biệt, tách hoàn toàn khỏi eventflow_token (auth) và session
// ─────────────────────────────────────────────────────────────────────────────
const ACCOUNTS_HISTORY_KEY = 'eventflow_accounts_history';

interface SavedAccount {
  email: string;
  lastLogin: string; // ISO 8601
}

/** Đọc danh sách tài khoản đã lưu. Trả về [] nếu chưa có hoặc dữ liệu lỗi. */
function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is SavedAccount =>
        typeof item === 'object' && item !== null &&
        typeof item.email === 'string' && item.email.length > 0
    );
  } catch {
    return [];
  }
}

/**
 * Thêm hoặc cập nhật một tài khoản vào danh sách.
 * - Email đã tồn tại → chỉ cập nhật lastLogin, không tạo bản sao.
 * - Email mới → thêm vào danh sách.
 * - Sắp xếp theo lastLogin giảm dần.
 * - KHÔNG xóa các tài khoản cũ.
 */
function upsertSavedAccount(email: string): SavedAccount[] {
  const list = getSavedAccounts();
  const now = new Date().toISOString();
  const existingIdx = list.findIndex(
    (item) => item.email.toLowerCase() === email.toLowerCase()
  );
  if (existingIdx >= 0) {
    list[existingIdx] = { email: list[existingIdx].email, lastLogin: now };
  } else {
    list.push({ email, lastLogin: now });
  }
  list.sort((a, b) => b.lastLogin.localeCompare(a.lastLogin));
  localStorage.setItem(ACCOUNTS_HISTORY_KEY, JSON.stringify(list));
  return list;
}

/**
 * Xóa một tài khoản khỏi danh sách.
 * Chỉ xóa đúng email được chỉ định, các tài khoản còn lại giữ nguyên.
 */
function removeSavedAccount(email: string): SavedAccount[] {
  const list = getSavedAccounts().filter(
    (item) => item.email.toLowerCase() !== email.toLowerCase()
  );
  localStorage.setItem(ACCOUNTS_HISTORY_KEY, JSON.stringify(list));
  return list;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component LoginPage
// ─────────────────────────────────────────────────────────────────────────────
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithEmail } = useAuth();

  // ── State form ──────────────────────────────────────────────────────────────
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [pending, setPending] = useState(false);

  // ── Danh sách tài khoản đã lưu ─────────────────────────────────────────────
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>(
    () => getSavedAccounts()
  );
  const [showDropdown, setShowDropdown] = useState(false);

  // Ref bao quanh toàn bộ vùng email + dropdown để detect click-outside
  const dropdownWrapperRef = useRef<HTMLDivElement>(null);

  // Điền email gần nhất khi mount
  useEffect(() => {
    const accounts = getSavedAccounts();
    if (accounts.length > 0) {
      setEmail(accounts[0].email);
    }
  }, []);

  // Đóng dropdown khi click ra ngoài vùng email + dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownWrapperRef.current &&
        !dropdownWrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // ── Chọn tài khoản từ danh sách đã lưu ──────────────────────────────────────
  const handleSelectAccount = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setEmailError('');
    setShowDropdown(false);
    setTimeout(() => {
      (document.getElementById('login-password') as HTMLInputElement | null)?.focus();
    }, 30);
  };

  // ── Xóa một tài khoản khỏi danh sách lịch sử ──────────────────────────────
  const handleRemoveAccount = (
    e: React.MouseEvent<HTMLButtonElement>,
    targetEmail: string
  ) => {
    e.stopPropagation();
    const updated = removeSavedAccount(targetEmail);
    setSavedAccounts(updated);
    if (email.toLowerCase() === targetEmail.toLowerCase()) {
      setEmail(updated.length > 0 ? updated[0].email : '');
    }
    if (updated.length === 0) setShowDropdown(false);
  };

  // ── Xử lý đăng nhập ────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Vui lòng nhập email');
      hasError = true;
    } else {
      setEmailError('');
    }

    if (!password.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu');
      hasError = true;
    } else {
      setPasswordError('');
    }

    if (hasError) return;

    setPending(true);
    setGeneralError('');
    try {
      await loginWithEmail(email.trim(), password, rememberMe);
      upsertSavedAccount(email.trim());
      navigate('/');
    } catch (err: any) {
      setGeneralError(err?.message || 'Email hoặc mật khẩu không chính xác');
    } finally {
      setPending(false);
    }
  };

  const hasAccounts = savedAccounts.length > 0;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen min-h-dvh bg-white flex flex-col px-5 py-8 sm:px-6 sm:py-12 lg:bg-[#F6F7FB] lg:p-8">
      <div className="w-full max-w-[460px] mx-auto my-auto lg:max-w-[1200px] lg:flex lg:rounded-2xl lg:shadow-xl lg:border lg:border-slate-200/90 lg:bg-white lg:overflow-hidden">
        {/* ── Left Side: Campus Image (Desktop only: >= 1024px) ── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden select-none min-h-[540px]">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url('/images/SanTruongDUE.jpg')` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(0,95,175,0.12) 0%, rgba(0,61,112,0.72) 50%, rgba(0,43,82,0.95) 100%)',
            }}
          />
          <div className="relative z-10 flex flex-col justify-end h-full p-8 xl:p-10 text-white">
            <span className="text-xs font-bold tracking-widest text-white/90 uppercase">
              ĐẠI HỌC ĐÀ NẴNG
            </span>
            <h1 className="text-2xl xl:text-3xl font-bold text-white tracking-tight mt-1.5 leading-snug">
              Trường Đại học Kinh tế
            </h1>
            <p className="text-xs xl:text-sm text-white/90 leading-relaxed mt-3 font-normal max-w-md">
              Hệ thống tiếp nhận, xét duyệt và cấp phép tổ chức sự kiện số hóa toàn diện –
              Tối ưu hóa quy trình nghiệp vụ, kết nối thông suốt giữa Ban Tổ chức, Ban Chủ
              nhiệm Khoa, Đoàn Trường và các Phòng chức năng.
            </p>
          </div>
        </div>

        {/* Login form */}
        <div className="w-full lg:w-1/2 lg:p-10 lg:flex lg:flex-col lg:justify-center">
          <div className="w-full lg:max-w-[520px] lg:mx-auto">

            {/* Header */}
            <div className="text-center mb-6">
              <img
                src="/images/due_logo_emblem.png"
                alt="Logo DUE"
                className="h-14 sm:h-16 w-auto object-contain mx-auto"
              />
              <div className="text-[11px] sm:text-xs font-bold tracking-widest text-[#005FAF] uppercase mt-3">
                ĐẠI HỌC ĐÀ NẴNG
              </div>
              <h2 className="text-center font-bold text-sm sm:text-base tracking-wide text-[#005FAF] mt-0.5 uppercase">
                TRƯỜNG ĐẠI HỌC KINH TẾ
              </h2>
              <p className="text-center text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Hệ thống quản lý quy trình tổ chức sự kiện
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} noValidate className="space-y-4">

              {/* ── Email Field + Dropdown ── */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>

                <div className="relative" ref={dropdownWrapperRef}>
                  {/* Input row */}
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (e.target.value.trim()) setEmailError('');
                        if (hasAccounts) setShowDropdown(true);
                      }}
                      onFocus={() => {
                        if (hasAccounts) setShowDropdown(true);
                      }}
                      placeholder="Ví dụ: btc1@eventflow.vn"
                      autoComplete="off"
                      className={`w-full px-3.5 py-2.5 text-base text-slate-800
                        placeholder-slate-400 bg-white rounded-lg border transition-all
                        ${emailError
                          ? 'border-[#F37021] ring-2 ring-[#F37021]/20'
                          : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                        }
                        ${hasAccounts ? 'pr-9' : ''}`}
                    />

                    {/* Chevron toggle button */}
                    {hasAccounts && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDropdown((v) => !v);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                          hover:text-slate-600 transition-colors cursor-pointer"
                        title="Xem tài khoản đã đăng nhập"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200
                            ${showDropdown ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Dropdown danh sách tài khoản đã lưu */}
                  {showDropdown && savedAccounts.length > 0 && (
                    <div
                      className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200
                        rounded-xl shadow-xl overflow-hidden"
                      style={{ zIndex: 9999 }}
                    >
                      <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/70">
                        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-500 font-medium">
                          Tài khoản đã đăng nhập ({savedAccounts.length})
                        </span>
                      </div>

                      <ul className="max-h-48 overflow-y-auto py-1">
                        {savedAccounts.map((account) => (
                          <li key={account.email}>
                            <div
                              className="flex items-center justify-between px-3.5 py-2
                                hover:bg-[#f0f7ff] cursor-pointer group transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectAccount(account.email);
                              }}
                            >
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                                  {account.email}
                                </span>
                                <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                                  {new Date(account.lastLogin).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveAccount(e, account.email);
                                }}
                                className="ml-2 flex-shrink-0 w-5 h-5 flex items-center justify-center
                                  rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50
                                  transition-colors opacity-0 group-hover:opacity-100"
                                title={`Xóa ${account.email} khỏi danh sách`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {emailError && (
                  <p className="text-xs text-[#b74245] mt-1 font-medium">{emailError}</p>
                )}
              </div>

              {/* ── Password Field + Quên mật khẩu link ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#005FAF] hover:text-[#003e6e] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value.trim()) setPasswordError('');
                    }}
                    placeholder="Nhập mật khẩu..."
                    className={`w-full pl-3.5 pr-10 py-2.5 text-base text-slate-800
                      placeholder-slate-400 bg-white rounded-lg border transition-all
                      ${passwordError
                        ? 'border-[#b74245] ring-2 ring-[#b74245]/20'
                        : 'border-slate-300 focus:outline-none focus:border-[#005FAF] focus:ring-2 focus:ring-[#005FAF]/20'
                      }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                      hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-xs text-[#b74245] mt-1 font-medium">{passwordError}</p>
                )}
              </div>

              {/* ── Remember Me ── */}
              <div className="pt-0.5">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#005FAF] focus:ring-[#005FAF]
                      border-slate-300 accent-[#005FAF] cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm text-slate-600">
                    Ghi nhớ đăng nhập trên thiết bị này
                  </span>
                </label>
              </div>

              {/* ── Lỗi chung (Bao gồm cảnh báo khóa tài khoản & số lần thử) ── */}
              {generalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs sm:text-sm font-medium flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                  <span>{generalError}</span>
                </div>
              )}

              {/* ── Submit Button ── */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full py-2.5 px-4 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg
                    text-sm font-semibold transition-all shadow-sm flex items-center
                    justify-center min-h-[42px] cursor-pointer disabled:opacity-60"
                >
                  {pending ? 'Đang đăng nhập...' : 'Đăng nhập hệ thống'}
                </button>
              </div>

              {/* ── Đăng ký tài khoản mới link ── */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs sm:text-sm text-slate-600">
                  Chưa có tài khoản?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-[#005FAF] hover:text-[#004A8A] hover:underline inline-flex items-center gap-1"
                  >
                    Đăng ký tài khoản mới
                  </Link>
                </p>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
};
