import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  ChevronDown,
  CheckCheck,
  ChevronRight,
  Home,
  LogOut,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { formatDateTime } from '../../utils/helpers';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

type HeaderMenu = 'notif' | 'user' | null;

export const Topbar: React.FC<TopbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, events } = useEvents();

  const [openMenu, setOpenMenu] = useState<HeaderMenu>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const showNotifMenu = openMenu === 'notif';
  const showUserMenu = openMenu === 'user';

  const closeMenus = useCallback(() => setOpenMenu(null), []);

  const toggleMenu = useCallback((menu: Exclude<HeaderMenu, null>) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  }, []);

  // Đóng dropdown khi click/chạm ra ngoài vùng nút + panel
  useEffect(() => {
    if (!openMenu) return;

    const handlePointerOutside = (e: PointerEvent) => {
      const target = e.target as Node;
      if (openMenu === 'notif' && notifRef.current && !notifRef.current.contains(target)) {
        setOpenMenu(null);
      }
      if (openMenu === 'user' && userRef.current && !userRef.current.contains(target)) {
        setOpenMenu(null);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('pointerdown', handlePointerOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openMenu]);

  // Đóng dropdown khi chuyển trang
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  const unreadNotifs = notifications.filter((n) => !n.isRead);

  // Dynamic Breadcrumb generation
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Trang chủ', path: '/' }, { label: 'Tổng quan hệ thống' }];
    if (path.startsWith('/events/create'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Hồ sơ sự kiện', path: '/events' }, { label: 'Tạo mới hồ sơ' }];
    if (path.includes('/edit'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Hồ sơ sự kiện', path: '/events' }, { label: 'Chỉnh sửa hồ sơ' }];
    if (path.startsWith('/events/'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Hồ sơ sự kiện', path: '/events' }, { label: 'Chi tiết hồ sơ' }];
    if (path.startsWith('/events'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Hồ sơ sự kiện' }];
    if (path.startsWith('/approvals'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Hàng đợi xét duyệt và Thẩm định' }];
    if (path.startsWith('/calendar'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Lịch hội trường và CSVC' }];
    if (path.startsWith('/facilities'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Cơ sở vật chất và Thiết bị' }];
    if (path.startsWith('/handover'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Bàn giao và Nghiệm thu' }];
    if (path.startsWith('/settlements'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Quyết toán tài chính' }];
    if (path.startsWith('/reports'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Báo cáo tổng kết' }];
    if (path.startsWith('/ai-review'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Trợ lý AI rà soát' }];
    if (path.startsWith('/analytics'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Báo cáo và Thống kê KPI' }];
    if (path.startsWith('/notifications'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Trung tâm thông báo' }];
    if (path.startsWith('/admin/users'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Quản trị người dùng và RBAC' }];
    if (path.startsWith('/admin/settings'))
      return [{ label: 'Trang chủ', path: '/' }, { label: 'Cấu hình tham số hệ thống' }];
    return [{ label: 'Trang chủ', path: '/' }, { label: 'Quản lý quy trình sự kiện' }];
  }, [location.pathname]);

  // Filter events based on search query
  const searchResults = searchQuery.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.eventCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.organizingUnit.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="h-14 sm:h-15 bg-white border-b border-slate-200 shrink-0 px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Button và Breadcrumbs */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 mr-2 flex-1 sm:flex-none">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Mở menu điều hướng"
          className="lg:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1 sm:gap-1.5 text-xs text-slate-500 font-medium truncate">
          <Home className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:block" />}
              {crumb.path ? (
                <Link to={crumb.path} className="hover:text-[#005FAF] transition-colors truncate hidden sm:inline">
                  {crumb.label}
                </Link>
              ) : (
                <span className="font-semibold text-slate-800 truncate text-xs">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Middle: Quick Search (Desktop) */}
      <div className="relative w-60 lg:w-72 hidden md:block shrink-0 mx-2">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện, mã hồ sơ, đơn vị..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 focus:outline-hidden focus:bg-white focus:border-[#005FAF] focus:ring-1 focus:ring-[#005FAF] transition-all"
        />

        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-slate-200 shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">Không tìm thấy sự kiện nào</div>
            ) : (
              searchResults.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    navigate(`/events/${ev.id}`);
                    setSearchQuery('');
                  }}
                  className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#005FAF]">{ev.eventCode}</span>
                    <span className="text-[10px] text-slate-400">{ev.organizingUnit}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-800 line-clamp-1 mt-0.5">{ev.title}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: Actions và User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => toggleMenu('notif')}
            aria-label="Thông báo hệ thống"
            aria-haspopup="menu"
            aria-expanded={showNotifMenu}
            aria-controls="header-notif-menu"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center text-slate-600 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifs.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#DC2626] text-white rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div
              id="header-notif-menu"
              role="menu"
              className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-3.5 bg-[#003D70] text-white flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider">Thông báo hệ thống</div>
                {unreadNotifs.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Đã đọc hết
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">Không có thông báo mới</div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <div
                      key={n.id}
                      role="menuitem"
                      onClick={() => {
                        markNotificationAsRead(n.id);
                        closeMenus();
                        navigate(n.linkUrl);
                      }}
                      className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-800">{n.title}</span>
                        {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#005FAF] shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{n.content}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{formatDateTime(n.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => toggleMenu('user')}
            aria-label="Menu tài khoản"
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            aria-controls="header-user-menu"
            className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 pr-2 sm:pr-3 py-1 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors border border-slate-200/60 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#005FAF] text-white flex items-center justify-center font-bold text-xs">
              {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{currentUser.fullName}</div>
              <div className="text-[10px] text-[#005FAF] font-semibold">{currentUser.role}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserMenu && (
            <div
              id="header-user-menu"
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl p-2 z-50"
            >
              <div className="p-3 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.fullName}</div>
                <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                <div className="text-[11px] text-[#005FAF] font-semibold mt-1">
                  {currentUser.role}
                  {currentUser.department ? ` · ${currentUser.department}` : ''}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenus();
                    logout();
                    navigate('/login');
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
