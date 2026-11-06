import React, { useState } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';

export const SystemSettingsPage: React.FC = () => {
  const { showToast } = useEvents();

  const [settings, setSettings] = useState({
    holdHours: '48',
    maxBudgetLimit: '50000000',
    maxFileSize: '10',
    allowedFileTypes: '.pdf, .docx, .xlsx, .jpg, .png',
    enableAiReview: true,
    autoConflictCheck: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Đã lưu cấu hình hệ thống thành công', 'success');
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cấu hình Hệ thống</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Thiết lập các tham số vận hành quy trình phê duyệt và thời hạn giữ chỗ cơ sở vật chất
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <h2 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>Tham số Quy trình và Cơ sở vật chất</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thời gian giữ chỗ tạm thời CSVC (Giờ):
            </label>
            <input
              type="number"
              value={settings.holdHours}
              onChange={(e) => setSettings({ ...settings, holdHours: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
            <p className="text-[10px] text-slate-400 mt-1">Sau thời gian này nếu không duyệt sẽ tự động giải phóng</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hạn mức ngân sách yêu cầu duyệt đặc biệt (VNĐ):
            </label>
            <input
              type="number"
              value={settings.maxBudgetLimit}
              onChange={(e) => setSettings({ ...settings, maxBudgetLimit: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
            <p className="text-[10px] text-slate-400 mt-1">Vượt quá 50.000.000đ cần trình Ban Giám hiệu</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Dung lượng file tối đa (MB):</label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => setSettings({ ...settings, maxFileSize: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Định dạng file cho phép:</label>
            <input
              type="text"
              value={settings.allowedFileTypes}
              onChange={(e) => setSettings({ ...settings, allowedFileTypes: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div className="pt-2 border-t flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
        </div>
      </form>
    </div>
  );
};
