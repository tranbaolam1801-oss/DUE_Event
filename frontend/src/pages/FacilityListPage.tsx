import React, { useState, useMemo } from 'react';
import {
  Building2,
  Package,
  CheckCircle2,
  XCircle,
  Wrench,
  Plus,
  Users,
  MapPin,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Facility, Equipment } from '../types';

const FACILITY_TYPES = [
  'Hội trường',
  'Phòng họp',
  'Phòng học',
  'Sân thể thao',
  'Không gian ngoài trời',
  'Phòng chức năng khác',
];

const EQUIPMENT_TYPES = [
  'Âm thanh',
  'Ánh sáng',
  'Trình chiếu / Màn hình',
  'Bàn ghế sự kiện',
  'Thiết bị sân khấu',
  'Khác',
];

export const FacilityListPage: React.FC = () => {
  const { facilities, equipment, refresh, showToast } = useEvents();
  const { currentUser } = useAuth();
  const canManage = ['CSVC', 'ADMIN'].includes(currentUser.role);

  const [activeTab, setActiveTab] = useState<'facilities' | 'equipment'>('facilities');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal State for Facility
  const [facilityModalOpen, setFacilityModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [facilityForm, setFacilityForm] = useState({
    code: '',
    name: '',
    type: FACILITY_TYPES[0],
    location: '',
    capacity: 100,
    description: '',
    amenities: '',
  });

  // Modal State for Equipment
  const [equipmentModalOpen, setEquipmentModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [equipmentForm, setEquipmentForm] = useState({
    code: '',
    name: '',
    type: EQUIPMENT_TYPES[0],
    totalQuantity: 10,
    condition: 'GOOD',
    description: '',
  });

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'facility' | 'equipment'; id: string; name: string; code: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.location && f.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = typeFilter === 'ALL' || f.type === typeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && f.isActive !== false) ||
        (statusFilter === 'INACTIVE' && f.isActive === false);
      return matchSearch && matchType && matchStatus;
    });
  }, [facilities, searchTerm, typeFilter, statusFilter]);

  // Filtered equipment
  const filteredEquipment = useMemo(() => {
    return equipment.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'ALL' || eq.type === typeFilter;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && eq.isActive !== false) ||
        (statusFilter === 'INACTIVE' && eq.isActive === false);
      return matchSearch && matchType && matchStatus;
    });
  }, [equipment, searchTerm, typeFilter, statusFilter]);

  // Open modal create facility
  const openCreateFacility = () => {
    setEditingFacility(null);
    setFacilityForm({
      code: `FAC-${Date.now().toString().slice(-4)}`,
      name: '',
      type: FACILITY_TYPES[0],
      location: '',
      capacity: 100,
      description: '',
      amenities: 'Máy chiếu, Âm thanh, Điều hòa, Micro',
    });
    setFacilityModalOpen(true);
  };

  // Open modal edit facility
  const openEditFacility = (f: Facility) => {
    setEditingFacility(f);
    setFacilityForm({
      code: f.code,
      name: f.name,
      type: f.type || FACILITY_TYPES[0],
      location: f.location || '',
      capacity: f.capacity || 100,
      description: f.description || '',
      amenities: Array.isArray(f.amenities) ? f.amenities.join(', ') : f.amenities || '',
    });
    setFacilityModalOpen(true);
  };

  // Save facility
  const handleSaveFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityForm.name.trim() || !facilityForm.code.trim()) {
      showToast('Vui lòng nhập đầy đủ mã và tên cơ sở vật chất', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: facilityForm.code.trim(),
        name: facilityForm.name.trim(),
        type: facilityForm.type,
        location: facilityForm.location.trim(),
        capacity: Number(facilityForm.capacity) || null,
        description: facilityForm.description.trim(),
        amenities: JSON.stringify(facilityForm.amenities.split(',').map((s) => s.trim()).filter(Boolean)),
      };

      if (editingFacility) {
        await api.updateFacility(editingFacility.id, payload);
        showToast('Cập nhật cơ sở vật chất thành công');
      } else {
        await api.createFacility(payload);
        showToast('Thêm cơ sở vật chất mới thành công');
      }
      setFacilityModalOpen(false);
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu cơ sở vật chất', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle facility active status
  const handleToggleFacility = async (f: Facility) => {
    try {
      await api.toggleFacility(f.id);
      showToast(`Đã ${f.isActive === false ? 'kích hoạt lại' : 'vô hiệu hóa'} ${f.name}`);
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  // Open modal create equipment
  const openCreateEquipment = () => {
    setEditingEquipment(null);
    setEquipmentForm({
      code: `EQ-${Date.now().toString().slice(-4)}`,
      name: '',
      type: EQUIPMENT_TYPES[0],
      totalQuantity: 10,
      condition: 'GOOD',
      description: '',
    });
    setEquipmentModalOpen(true);
  };

  // Open modal edit equipment
  const openEditEquipment = (eq: Equipment) => {
    setEditingEquipment(eq);
    setEquipmentForm({
      code: eq.code,
      name: eq.name,
      type: eq.type || EQUIPMENT_TYPES[0],
      totalQuantity: eq.totalQuantity,
      condition: eq.condition || 'GOOD',
      description: eq.description || '',
    });
    setEquipmentModalOpen(true);
  };

  // Save equipment
  const handleSaveEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipmentForm.name.trim() || !equipmentForm.code.trim()) {
      showToast('Vui lòng nhập đầy đủ mã và tên thiết bị', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: equipmentForm.code.trim(),
        name: equipmentForm.name.trim(),
        type: equipmentForm.type,
        totalQuantity: Number(equipmentForm.totalQuantity) || 1,
        condition: equipmentForm.condition,
        description: equipmentForm.description.trim(),
      };

      if (editingEquipment) {
        await api.updateEquipment(editingEquipment.id, payload);
        showToast('Cập nhật trang thiết bị thành công');
      } else {
        await api.createEquipment(payload);
        showToast('Thêm trang thiết bị mới thành công');
      }
      setEquipmentModalOpen(false);
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu thiết bị', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle equipment active status
  const handleToggleEquipment = async (eq: Equipment) => {
    try {
      await api.toggleEquipment(eq.id);
      showToast(`Đã ${eq.isActive === false ? 'kích hoạt lại' : 'vô hiệu hóa'} ${eq.name}`);
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đổi trạng thái', 'error');
    }
  };

  // Execute delete
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.type === 'facility') {
        const res = await api.deleteFacility(deleteTarget.id);
        showToast(res.message || 'Đã xóa cơ sở vật chất');
      } else {
        const res = await api.deleteEquipment(deleteTarget.id);
        showToast(res.message || 'Đã xóa thiết bị');
      }
      setDeleteTarget(null);
      await refresh();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Danh mục Cơ sở vật chất và Thiết bị</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý hội trường, phòng học, trang thiết bị âm thanh ánh sáng và tài nguyên dùng chung toàn trường
          </p>
        </div>

        {/* Tab switch + Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setActiveTab('facilities'); setTypeFilter('ALL'); }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'facilities' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hội trường & Phòng ({facilities.length})
            </button>
            <button
              onClick={() => { setActiveTab('equipment'); setTypeFilter('ALL'); }}
              className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'equipment' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Trang thiết bị ({equipment.length})
            </button>
          </div>

          {canManage && (
            activeTab === 'facilities' ? (
              <button
                type="button"
                onClick={openCreateFacility}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm địa điểm/phòng</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateEquipment}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thiết bị mới</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={activeTab === 'facilities' ? 'Tìm theo tên, mã phòng, vị trí...' : 'Tìm theo tên thiết bị, mã TB...'}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-[#005FAF]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Loại:</span>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="ALL">Tất cả phân loại</option>
            {(activeTab === 'facilities' ? FACILITY_TYPES : EQUIPMENT_TYPES).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đã vô hiệu hóa</option>
          </select>
        </div>
      </div>

      {/* Facilities Tab Content */}
      {activeTab === 'facilities' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredFacilities.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
              Không tìm thấy cơ sở vật chất nào phù hợp bộ lọc.
            </div>
          ) : (
            filteredFacilities.map((f) => {
              const isInactive = f.isActive === false;
              const amenitiesList = Array.isArray(f.amenities)
                ? f.amenities
                : typeof f.amenities === 'string'
                ? f.amenities.startsWith('[')
                  ? JSON.parse(f.amenities || '[]')
                  : f.amenities.split(',').map((s: string) => s.trim())
                : [];

              return (
                <div
                  key={f.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                    isInactive ? 'border-slate-200 opacity-60 bg-slate-50/50' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {f.code}
                      </span>
                      {isInactive ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-500" /> Tạm dừng
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Sẵn sàng sử dụng
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-slate-900">{f.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold shrink-0">
                          {f.type}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{f.location || 'Chưa cập nhật vị trí'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl text-xs font-semibold text-slate-700">
                      <Users className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Sức chứa: {f.capacity || 'Không giới hạn'} chỗ ngồi</span>
                    </div>

                    {f.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">{f.description}</p>
                    )}

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Trang bị sẵn có:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {amenitiesList.length > 0 ? (
                          amenitiesList.map((a: string, i: number) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium"
                            >
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa có thông tin tiện ích</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleFacility(f)}
                        className={`p-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                          isInactive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={isInactive ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditFacility(f)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#005FAF] hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'facility', id: f.id, name: f.name, code: f.code })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                        title="Xóa địa điểm/phòng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Equipment Tab Content */}
      {activeTab === 'equipment' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
                  <th className="py-3 px-4">Mã TB</th>
                  <th className="py-3 px-4">Tên thiết bị</th>
                  <th className="py-3 px-4">Phân loại</th>
                  <th className="py-3 px-4 text-center">Tổng số</th>
                  <th className="py-3 px-4 text-center">Khả dụng</th>
                  <th className="py-3 px-4">Tình trạng</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  {canManage && <th className="py-3 px-4 text-right">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 8 : 7} className="py-8 text-center text-xs text-slate-500">
                      Không tìm thấy thiết bị nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map((eq) => {
                    const isInactive = eq.isActive === false;
                    return (
                      <tr key={eq.id} className={`hover:bg-slate-50/70 ${isInactive ? 'opacity-60 bg-slate-50/40' : ''}`}>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">{eq.code}</td>
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div>{eq.name}</div>
                          {eq.description && <div className="text-[11px] text-slate-400 font-normal">{eq.description}</div>}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{eq.type}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-slate-700">{eq.totalQuantity}</td>
                        <td className="py-3 px-4 text-center font-bold font-mono text-emerald-600">
                          {eq.availableQuantity ?? eq.totalQuantity}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              eq.condition === 'GOOD'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : eq.condition === 'MAINTENANCE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {eq.condition === 'GOOD' ? 'Tốt' : eq.condition === 'MAINTENANCE' ? 'Đang bảo trì' : eq.condition}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isInactive ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isInactive ? 'Tạm dừng' : 'Hoạt động'}
                          </span>
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggleEquipment(eq)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                title={isInactive ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                              >
                                <Power className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditEquipment(eq)}
                                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-[#005FAF] cursor-pointer"
                                title="Chỉnh sửa thiết bị"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ type: 'equipment', id: eq.id, name: eq.name, code: eq.code })}
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer"
                                title="Xóa thiết bị"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Facility Create/Edit Modal */}
      {facilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Building2 className="w-5 h-5 text-[#005FAF]" />
                <span>{editingFacility ? 'Chỉnh sửa cơ sở vật chất' : 'Thêm cơ sở vật chất mới'}</span>
              </div>
              <button
                type="button"
                onClick={() => setFacilityModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveFacility} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã CSVC <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    disabled={Boolean(editingFacility)}
                    value={facilityForm.code}
                    onChange={(e) => setFacilityForm({ ...facilityForm, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Loại CSVC <span className="text-rose-600">*</span></label>
                  <select
                    value={facilityForm.type}
                    onChange={(e) => setFacilityForm({ ...facilityForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    {FACILITY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên địa điểm / phòng <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                  placeholder="Ví dụ: Hội trường E, Phòng Hội thảo B2..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vị trí</label>
                  <input
                    type="text"
                    value={facilityForm.location}
                    onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                    placeholder="Ví dụ: Khu nhà Đa năng, Tầng 3..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sức chứa (chỗ ngồi)</label>
                  <input
                    type="number"
                    min="1"
                    value={facilityForm.capacity}
                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trang bị sẵn có (ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  value={facilityForm.amenities}
                  onChange={(e) => setFacilityForm({ ...facilityForm, amenities: e.target.value })}
                  placeholder="Máy chiếu, 2 Micro, Điều hòa, Bục phát biểu..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả / Lưu ý vận hành</label>
                <textarea
                  rows={2}
                  value={facilityForm.description}
                  onChange={(e) => setFacilityForm({ ...facilityForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setFacilityModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-white cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#005FAF] hover:bg-[#004A8A] text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingFacility ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Create/Edit Modal */}
      {equipmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Package className="w-5 h-5 text-[#005FAF]" />
                <span>{editingEquipment ? 'Chỉnh sửa trang thiết bị' : 'Thêm trang thiết bị mới'}</span>
              </div>
              <button
                type="button"
                onClick={() => setEquipmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEquipment} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã thiết bị <span className="text-rose-600">*</span></label>
                  <input
                    type="text"
                    disabled={Boolean(editingEquipment)}
                    value={equipmentForm.code}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phân loại <span className="text-rose-600">*</span></label>
                  <select
                    value={equipmentForm.type}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    {EQUIPMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên thiết bị <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  value={equipmentForm.name}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                  placeholder="Ví dụ: Loa kéo di động JBL, Bộ 2 Micro không dây..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổng số lượng <span className="text-rose-600">*</span></label>
                  <input
                    type="number"
                    min="1"
                    value={equipmentForm.totalQuantity}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, totalQuantity: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tình trạng</label>
                  <select
                    value={equipmentForm.condition}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, condition: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  >
                    <option value="GOOD">Tốt (Sẵn sàng)</option>
                    <option value="MAINTENANCE">Đang bảo trì</option>
                    <option value="FAIR">Bình thường</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả / Thông số kỹ thuật</label>
                <textarea
                  rows={2}
                  value={equipmentForm.description}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                  placeholder="Công suất, cáp kết nối, vị trí kho lưu trữ..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setEquipmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-white cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-[#005FAF] hover:bg-[#004A8A] text-white cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : editingEquipment ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Xác nhận xóa tài nguyên</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div><span className="font-semibold text-slate-500">Mã:</span> <span className="font-mono font-bold text-blue-600">{deleteTarget.code}</span></div>
                <div><span className="font-semibold text-slate-500">Tên:</span> <span className="font-bold text-slate-800">{deleteTarget.name}</span></div>
                <div><span className="font-semibold text-slate-500">Phân loại:</span> <span>{deleteTarget.type === 'facility' ? 'Cơ sở vật chất / Phòng' : 'Trang thiết bị'}</span></div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold">Lưu ý:</span> Nếu tài nguyên đã từng được sử dụng trong lịch sử mượn hoặc hồ sơ sự kiện, hệ thống sẽ tự động chuyển sang chế độ vô hiệu hóa (soft delete) để không làm mất dữ liệu kiểm toán.
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-white cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{submitting ? 'Đang xử lý...' : 'Xác nhận xóa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
