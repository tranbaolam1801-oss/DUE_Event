import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Shield,
  Edit3,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  Eye,
  X,
  AlertCircle,
  Phone,
  Mail,
  Building,
  RefreshCw,
  Calendar,
  Check,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, User } from '../types';
import { roleNames, formatDateTime } from '../utils/helpers';
import { api } from '../services/api';

export const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Drawer State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [drawerMode, setDrawerMode] = useState<'VIEW' | 'EDIT'>('VIEW');
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  // Lock/Unlock Confirmation Modal State
  const [lockModalUser, setLockModalUser] = useState<User | null>(null);
  const [lockModalAction, setLockModalAction] = useState<'LOCK' | 'UNLOCK' | null>(null);
  const [lockReason, setLockReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Form State for Edit/Create
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'BTC' as UserRole,
    department: '',
    phone: '',
    isActive: true,
    newPassword: '',
  });

  // Tải danh sách người dùng từ API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (!Array.isArray(res?.data)) throw new Error('Phản hồi danh sách tài khoản không hợp lệ');
      setUsers(res.data);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không tải được danh sách tài khoản từ máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Kiểm tra quyền Quản trị viên
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="p-8 max-w-lg mx-auto text-center bg-white rounded-2xl border border-red-200 shadow-sm mt-12">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Truy cập bị từ chối</h2>
        <p className="text-sm text-slate-600 mt-2">
          Chức năng Quản trị người dùng và phân quyền chỉ dành riêng cho tài khoản Quản trị viên hệ thống (ADMIN).
        </p>
      </div>
    );
  }

  // Lọc người dùng
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !searchQuery.trim() ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = selectedRole === 'ALL' || u.role === selectedRole;

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && u.isActive !== false) ||
        (selectedStatus === 'LOCKED' && u.isActive === false);

      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  // Mở Drawer ở chế độ Xem chi tiết
  const handleOpenViewDrawer = (user: User) => {
    setSelectedUser(user);
    setDrawerMode('VIEW');
    setDrawerError('');
    setFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      role: user.role || 'BTC',
      department: user.department || '',
      phone: user.phone || '',
      isActive: user.isActive !== false,
      newPassword: '',
    });
  };

  // Chuyển Drawer sang chế độ Chỉnh sửa
  const handleSwitchToEdit = () => {
    setDrawerMode('EDIT');
    setDrawerError('');
  };

  // Đóng Drawer
  const handleCloseDrawer = () => {
    setSelectedUser(null);
    setDrawerError('');
  };

  // Mở Modal Xác nhận Khóa / Mở khóa
  const handleOpenLockModal = (user: User) => {
    if (user.isActive !== false && (user.id === currentUser.id || user.email === currentUser.email)) {
      alert('Bạn không thể tự khóa tài khoản Quản trị viên đang đăng nhập của chính mình.');
      return;
    }
    setLockModalUser(user);
    setLockModalAction(user.isActive !== false ? 'LOCK' : 'UNLOCK');
    setLockReason('');
    setActionError('');
  };

  // Thực hiện Khóa hoặc Mở khóa tài khoản
  const handleConfirmLockAction = async () => {
    if (!lockModalUser || !lockModalAction) return;
    setActionLoading(true);
    setActionError('');

    try {
      if (lockModalAction === 'LOCK') {
        const res = await api.lockUser(lockModalUser.id, lockReason);
        setSuccessMessage(res.message || `Đã khóa tài khoản ${lockModalUser.fullName} thành công.`);
      } else {
        const res = await api.unlockUser(lockModalUser.id);
        setSuccessMessage(res.message || `Đã mở khóa tài khoản ${lockModalUser.fullName} thành công.`);
      }
      setTimeout(() => setSuccessMessage(''), 4000);

      const nextActive = lockModalAction === 'UNLOCK';
      // Cập nhật selectedUser nếu đang hiển thị trong Drawer
      if (selectedUser?.id === lockModalUser.id) {
        setSelectedUser({ ...selectedUser, isActive: nextActive });
      }
      // Cập nhật danh sách người dùng local ngay lập tức
      setUsers((prev) =>
        prev.map((u) => (u.id === lockModalUser.id ? { ...u, isActive: nextActive } : u))
      );

      // Đóng modal xác nhận
      setLockModalUser(null);
      setLockModalAction(null);

      // Đồng bộ lại từ database
      fetchUsers();
    } catch (err: any) {
      setActionError(err.message || 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mở Modal Tạo mới
  const handleOpenCreate = () => {
    setIsCreateModalOpen(true);
    setCreateError('');
    setFormData({
      fullName: '',
      email: '',
      role: 'BTC',
      department: '',
      phone: '',
      isActive: true,
      newPassword: '',
    });
  };

  // Lưu chỉnh sửa người dùng
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setDrawerLoading(true);
    setDrawerError('');

    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        role: formData.role,
        department: formData.department.trim(),
        phone: formData.phone.trim(),
        isActive: formData.isActive,
      };
      if (formData.newPassword.trim()) {
        payload.password = formData.newPassword.trim();
      }

      const res = await api.updateUser(selectedUser.id, payload);
      const updated = res.data || { ...selectedUser, ...payload };

      setSuccessMessage(`Đã cập nhật thông tin tài khoản ${formData.fullName} thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);

      setSelectedUser(updated);
      setDrawerMode('VIEW');
      fetchUsers();
    } catch (err: any) {
      setDrawerError(err.message || 'Không thể cập nhật người dùng. Vui lòng thử lại.');
    } finally {
      setDrawerLoading(false);
    }
  };

  // Tạo người dùng mới
  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError('');

    try {
      await api.createUser({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.newPassword || '123456',
        role: formData.role,
        department: formData.department.trim() || undefined,
        phone: formData.phone.trim() || undefined,
      });

      setSuccessMessage(`Đã tạo tài khoản ${formData.fullName} thành công!`);
      setTimeout(() => setSuccessMessage(''), 4000);
      setIsCreateModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Không thể tạo người dùng. Vui lòng thử lại.');
    } finally {
      setCreateLoading(false);
    }
  };

  // Màu sắc badge vai trò
  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-blue-100 text-[#003D70] border-blue-300';
      case 'BTC':
        return 'bg-blue-50 text-[#005FAF] border-blue-200';
      case 'BCN_KHOA':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'DOAN_TRUONG':
        return 'bg-[#E8F1FA] text-[#004A8A] border-blue-200';
      case 'CSVC':
        return 'bg-orange-50 text-[#D45F1A] border-orange-200';
      case 'KHTC':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tiêu đề trang và nút thêm tài khoản */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Quản trị người dùng và phân quyền
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Danh sách tài khoản và phân cấp vai trò thẩm định theo quy chế Trường Đại học Kinh tế – Đại học Đà Nẵng
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#005FAF]' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* Thông báo thành công */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Thanh tìm kiếm và bộ lọc */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white transition-all"
          />
        </div>

        {/* Lọc theo Vai trò */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="BTC">Ban Tổ chức (BTC)</option>
            <option value="BCN_KHOA">Ban Chủ nhiệm Khoa</option>
            <option value="DOAN_TRUONG">Đoàn Trường</option>
            <option value="CSVC">Cơ sở vật chất</option>
            <option value="KHTC">Kế hoạch - Tài chính</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>

        {/* Lọc theo Trạng thái (ACTIVE / LOCKED) */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:border-[#005FAF] focus:bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="LOCKED">Đã khóa</option>
          </select>
        </div>
      </div>

      {/* Hiển thị số lượng kết quả */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>{loading ? 'Đang tải danh sách tài khoản…' : <>Hiển thị <strong>{filteredUsers.length}</strong> / <strong>{users.length}</strong> tài khoản</>}</span>
        {(searchQuery || selectedRole !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('ALL');
              setSelectedStatus('ALL');
            }}
            className="text-[#005FAF] hover:underline font-medium cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* ── DESKTOP VIEW (>= 768px): Bảng 5 CỘT CHÍNH GỌN GÀNG (Không cuộn ngang) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <th className="py-3 px-4 w-[32%]">Người dùng</th>
              <th className="py-3 px-4 w-[28%]">Email</th>
              <th className="py-3 px-4 w-[20%]">Vai trò</th>
              <th className="py-3 px-4 w-[12%] text-center">Trạng thái</th>
              <th className="py-3 px-4 w-[8%] text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Đang tải tài khoản…</td></tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  Không tìm thấy tài khoản nào phù hợp
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isActive = u.isActive !== false;
                return (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenViewDrawer(u)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* 1. Người dùng: Avatar nhỏ, họ và tên */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-[#005FAF] flex items-center justify-center text-xs font-bold shrink-0">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="truncate">{u.fullName}</span>
                      </div>
                    </td>

                    {/* 2. Email */}
                    <td className="py-3.5 px-4 text-slate-600 text-xs sm:text-[13px] truncate font-normal">
                      {u.email}
                    </td>

                    {/* 3. Vai trò */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border ${getRoleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {roleNames[u.role] || u.role}
                      </span>
                    </td>

                    {/* 4. Trạng thái (Đang hoạt động: Xanh | Đã khóa: Đỏ) */}
                    <td className="py-3.5 px-4 text-center">
                      {isActive ? (
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-block whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* 5. Thao tác: Biểu tượng con mắt xem chi tiết */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenViewDrawer(u)}
                        className="p-1.5 text-slate-400 hover:text-[#005FAF] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Xem chi tiết tài khoản"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MOBILE VIEW (< 768px): Danh sách card dọc ── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-slate-400"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Đang tải tài khoản…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Không tìm thấy người dùng nào phù hợp
          </div>
        ) : (
          filteredUsers.map((u) => {
            const isActive = u.isActive !== false;
            return (
              <div
                key={u.id}
                onClick={() => handleOpenViewDrawer(u)}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5 cursor-pointer hover:border-blue-200 transition-colors"
              >
                {/* Header card: Avatar + Tên + Badge trạng thái */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#005FAF] flex items-center justify-center text-xs font-bold shrink-0">
                      {u.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">{u.fullName}</div>
                      <span
                        className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeStyle(
                          u.role
                        )}`}
                      >
                        {roleNames[u.role] || u.role}
                      </span>
                    </div>
                  </div>

                  {isActive ? (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      Đã khóa
                    </span>
                  )}
                </div>

                {/* Email và Nút Xem chi tiết */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate min-w-0 pr-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-xs text-slate-600 truncate font-normal">{u.email}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenViewDrawer(u);
                    }}
                    className="p-1.5 bg-blue-50 text-[#005FAF] hover:bg-blue-100 rounded-lg flex items-center gap-1 text-xs font-semibold shrink-0 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── DRAWER PANEL TRƯỢT TỪ BÊN PHẢI (Right-side Drawer) ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay nền mờ */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col h-full transform transition-transform duration-300 animate-slideInRight">
              
              {/* 1. Header cố định của Drawer */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#005FAF] flex items-center justify-center shrink-0">
                    {drawerMode === 'VIEW' ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900 truncate tracking-tight">
                      {drawerMode === 'VIEW' ? 'Thông tin chi tiết tài khoản' : 'Chỉnh sửa tài khoản'}
                    </h3>
                    <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5 font-normal">{selectedUser.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  title="Đóng bảng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Khu vực nội dung có cuộn dọc độc lập */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
                {drawerError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{drawerError}</span>
                  </div>
                )}

                {/* ── CHẾ ĐỘ XEM CHI TIẾT (VIEW MODE) ── */}
                {drawerMode === 'VIEW' && (
                  <div className="space-y-4">
                    {/* Card tóm tắt người dùng */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#005FAF] text-white flex items-center justify-center font-semibold text-lg shadow-sm shrink-0">
                        {selectedUser.fullName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-slate-900 truncate tracking-tight">
                          {selectedUser.fullName}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeStyle(
                              selectedUser.role
                            )}`}
                          >
                            {roleNames[selectedUser.role] || selectedUser.role}
                          </span>
                          {/* Badge trạng thái chuẩn quy định */}
                          {selectedUser.isActive !== false ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              Đã khóa
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Danh sách thông tin chi tiết */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <Mail className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-medium text-slate-500 mb-0.5">Email đăng nhập</div>
                          <div className="text-sm sm:text-[15px] font-normal text-slate-800 break-all leading-normal">
                            {selectedUser.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <Building className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-medium text-slate-500 mb-0.5">Đơn vị / Khoa công tác</div>
                          <div className="text-sm sm:text-[15px] font-normal text-slate-800 leading-normal">
                            {selectedUser.department || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <Phone className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-medium text-slate-500 mb-0.5">Số điện thoại liên hệ</div>
                          <div className="text-sm sm:text-[15px] font-normal text-slate-800 leading-normal">
                            {selectedUser.phone || 'Chưa cập nhật'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <Calendar className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-medium text-slate-500 mb-0.5">Ngày tạo tài khoản</div>
                          <div className="text-sm sm:text-[15px] font-normal text-slate-800 leading-normal">
                            {selectedUser.createdAt ? formatDateTime(selectedUser.createdAt) : 'Hệ thống khởi tạo'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
                        <Shield className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-[13px] font-medium text-slate-500 mb-0.5">Phân quyền nghiệp vụ</div>
                          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5 font-normal">
                            {selectedUser.role === 'ADMIN' && 'Toàn quyền cấu hình hệ thống, quản lý người dùng và giám sát BPMN.'}
                            {selectedUser.role === 'BTC' && 'Nộp hồ sơ sự kiện, mượn cơ sở vật chất và nộp quyết toán kinh phí.'}
                            {selectedUser.role === 'BCN_KHOA' && 'Thẩm định hồ sơ sự kiện của sinh viên và các CLB thuộc Khoa.'}
                            {selectedUser.role === 'DOAN_TRUONG' && 'Xét duyệt và cấp phép tổ chức sự kiện cấp Đoàn - Hội sinh viên.'}
                            {selectedUser.role === 'CSVC' && 'Thẩm định xung đột lịch hội trường, bàn giao và nghiệm thu phòng.'}
                            {selectedUser.role === 'KHTC' && 'Thẩm định dự toán ngân sách và duyệt thanh quyết toán chứng từ.'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CHẾ ĐỘ CHỈNH SỬA (EDIT MODE) ── */}
                {drawerMode === 'EDIT' && (
                  <form id="drawer-edit-form" onSubmit={handleSaveEdit} className="space-y-4">
                    {/* Họ và tên */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                        required
                      />
                    </div>

                    {/* Email (Readonly) */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1">
                        Email tài khoản (Cố định)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-600 cursor-not-allowed"
                      />
                    </div>

                    {/* Vai trò nghiệp vụ */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1">
                        Vai trò nghiệp vụ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white font-medium"
                      >
                        <option value="BTC">Ban Tổ chức (BTC)</option>
                        <option value="BCN_KHOA">Ban Chủ nhiệm Khoa</option>
                        <option value="DOAN_TRUONG">Đoàn Trường</option>
                        <option value="CSVC">Cơ sở vật chất</option>
                        <option value="KHTC">Kế hoạch - Tài chính</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                      </select>
                    </div>

                    {/* Đơn vị / Khoa */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1">
                        Đơn vị / Khoa công tác
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Ví dụ: Khoa Quản trị kinh doanh"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                      />
                    </div>

                    {/* Số điện thoại */}
                    <div>
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ví dụ: 0905123456"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                      />
                    </div>

                    {/* Trạng thái hoạt động */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-[#005FAF] border-slate-300 focus:ring-[#005FAF] accent-[#005FAF]"
                        />
                        <span className="text-xs sm:text-sm font-semibold text-slate-800">
                          Tài khoản đang hoạt động (Cho phép đăng nhập)
                        </span>
                      </label>
                      <p className="text-[11px] text-slate-500 mt-1 pl-6">
                        Bỏ chọn để khóa tài khoản này khi có vi phạm hoặc cần đình chỉ truy cập. Dữ liệu tài khoản vẫn được giữ nguyên.
                      </p>
                    </div>

                    {/* Đặt lại mật khẩu mới */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                        <span>Đặt lại mật khẩu mới (để trống nếu giữ nguyên)</span>
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        placeholder="Nhập mật khẩu mới cho tài khoản này..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                      />
                    </div>
                  </form>
                )}
              </div>

              {/* 3. Footer cố định phía dưới của Drawer */}
              <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-3 shrink-0">
                {drawerMode === 'VIEW' ? (
                  <>
                    {/* Nút Khóa / Mở khóa tài khoản tại footer Drawer */}
                    {selectedUser.id === currentUser.id ? (
                      <div
                        className="px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                        title="Bạn không thể tự khóa tài khoản của chính mình"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Tài khoản của bạn</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenLockModal(selectedUser)}
                        className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors border shadow-2xs ${
                          selectedUser.isActive !== false
                            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        {selectedUser.isActive !== false ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{selectedUser.isActive !== false ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCloseDrawer}
                        className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToEdit}
                        className="px-4 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Chỉnh sửa</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setDrawerMode('VIEW')}
                      disabled={drawerLoading}
                      className="px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="submit"
                      form="drawer-edit-form"
                      disabled={drawerLoading}
                      className="px-4 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      {drawerLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Lưu thay đổi</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN (Đúng chuẩn yêu cầu) ── */}
      {lockModalUser && lockModalAction && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            {/* Header */}
            <div
              className={`px-5 py-4 border-b flex items-center justify-between ${
                lockModalAction === 'LOCK' ? 'bg-rose-50/80 border-rose-100' : 'bg-emerald-50/80 border-emerald-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    lockModalAction === 'LOCK' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {lockModalAction === 'LOCK' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {lockModalAction === 'LOCK' ? 'Xác nhận khóa tài khoản' : 'Xác nhận mở khóa tài khoản'}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5 font-normal">{lockModalUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLockModalUser(null);
                  setLockModalAction(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Thông tin đối tượng */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#005FAF] font-bold flex items-center justify-center shrink-0">
                  {lockModalUser.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate">{lockModalUser.fullName}</div>
                  <div className="text-[11px] text-slate-500 truncate">{lockModalUser.department || roleNames[lockModalUser.role]}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeStyle(lockModalUser.role)}`}>
                  {lockModalUser.role}
                </span>
              </div>

              {/* Nội dung xác nhận theo đúng quy định */}
              {lockModalAction === 'LOCK' ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập hoặc tiếp tục sử dụng hệ thống cho đến khi được mở khóa. Dữ liệu tài khoản vẫn được giữ nguyên.
                  </p>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Lý do khóa tài khoản (phục vụ quản trị và kiểm toán):
                    </label>
                    <textarea
                      rows={2}
                      value={lockReason}
                      onChange={(e) => setLockReason(e.target.value)}
                      placeholder="Nhập lý do khóa tài khoản (ví dụ: Tạm đình chỉ theo yêu cầu phòng Tổ chức - Hành chính...)"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-rose-500 focus:bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    Bạn có muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại bằng thông tin xác thực hiện có.
                  </p>
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 leading-relaxed">
                    Sau khi mở khóa, người dùng có thể đăng nhập bình thường bằng email và mật khẩu cũ mà không cần tạo lại tài khoản hay đổi mật khẩu.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Buttons: [Hủy] [Xác nhận] */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/90 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLockModalUser(null);
                  setLockModalAction(null);
                }}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                Hủy
              </button>

              <button
                type="button"
                onClick={handleConfirmLockAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5 ${
                  lockModalAction === 'LOCK'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#005FAF] hover:bg-[#004A8A]'
                }`}
              >
                {actionLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : lockModalAction === 'LOCK' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Xác nhận khóa</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Xác nhận mở khóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL THÊM TÀI KHOẢN MỚI ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#005FAF]" />
                <span>Thêm tài khoản người dùng mới</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCreate} className="p-5 space-y-3.5">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@due.edu.vn"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vai trò nghiệp vụ <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white font-medium"
                >
                  <option value="BTC">Ban Tổ chức (BTC)</option>
                  <option value="BCN_KHOA">Ban Chủ nhiệm Khoa</option>
                  <option value="DOAN_TRUONG">Đoàn Trường</option>
                  <option value="CSVC">Cơ sở vật chất</option>
                  <option value="KHTC">Kế hoạch - Tài chính</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn vị / Khoa công tác
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Ví dụ: Khoa Thống kê - Tin học"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0905123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật khẩu khởi tạo
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Mặc định: 123456"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#005FAF]/20 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {createLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Tạo tài khoản</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
