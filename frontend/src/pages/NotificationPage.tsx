import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { formatDateTime } from '../utils/helpers';

export const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useEvents();

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Trung tâm Thông báo</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Các cập nhật trạng thái hồ sơ, thông báo nhắc duyệt và cảnh báo tài nguyên
          </p>
        </div>

        <button
          onClick={markAllNotificationsAsRead}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
        >
          <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">Không có thông báo nào</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markNotificationAsRead(n.id);
                navigate(n.linkUrl);
              }}
              className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                !n.isRead ? 'bg-blue-50/40' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-900">{n.title}</span>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.content}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDateTime(n.createdAt)}</span>
                </div>
              </div>

              <ExternalLink className="w-4 h-4 text-slate-300 hover:text-blue-600 shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
