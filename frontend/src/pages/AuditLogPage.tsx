import React from 'react';
import { Link } from 'react-router-dom';
import { useEvents } from '../contexts/EventContext';
import { formatDateTime, roleNames } from '../utils/helpers';

export const AuditLogPage: React.FC = () => {
  const { events, loading } = useEvents();
  const entries = events
    .flatMap((event) => event.history.map((item) => ({
      ...item,
      eventId: event.id,
      eventCode: event.eventCode,
      eventTitle: event.title,
    })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Nhật ký xử lý</h1>
        <p className="mt-1 text-xs text-slate-500">Lịch sử thao tác và chuyển trạng thái của các hồ sơ sự kiện.</p>
      </header>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading && entries.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">Đang tải nhật ký...</p>
        ) : entries.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-500">Chưa có hoạt động nào được ghi nhận.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Người thực hiện</th>
                  <th className="px-4 py-3">Hồ sơ</th>
                  <th className="px-4 py-3">Thao tác</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={`${entry.eventId}-${entry.id}`} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(entry.timestamp)}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{entry.actorName || 'Hệ thống'}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {roleNames[entry.actorRole] || entry.actorRole || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/events/${entry.eventId}`} className="font-semibold text-blue-700 hover:underline">
                        {entry.eventCode}
                      </Link>
                      <div className="mt-0.5 max-w-xs truncate text-slate-600">{entry.eventTitle}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{entry.action}</td>
                    <td className="max-w-sm whitespace-pre-wrap px-4 py-3 text-slate-600">{entry.comments || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
