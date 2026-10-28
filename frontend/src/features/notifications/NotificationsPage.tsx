import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { NotificationItem } from '../../types';
import { formatDateTime } from '../../lib/utils';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: NotificationItem[]; unread_count: number }>('/notifications');
      setNotifications(res.items);
      setUnreadCount(res.unread_count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.post(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">
              Notification & Alert Centre
            </h1>
            {unreadCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 font-bold border border-red-200">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-ink-secondary mt-0.5">
            Idempotent deadline warnings, task assignments, and institutional case notifications.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="px-3.5 py-2 bg-surface-pure hover:bg-surface-secondary text-navy-900 border border-surface-border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <CheckCheck className="w-4 h-4 text-teal-primary" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-surface-pure rounded-xl border border-surface-border shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-8 h-8 border-2 border-teal-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-ink-secondary">
            No notifications recorded.
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => navigate(`/fdrs/${n.entity_id}`)}
                className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                  !n.read_at ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-surface-secondary/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    n.category === 'OVERDUE'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {n.category === 'OVERDUE' ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-navy-900 group-hover:text-teal-primary transition-colors">
                        {n.title}
                      </h4>
                      {!n.read_at && (
                        <span className="w-2 h-2 rounded-full bg-teal-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ink-secondary mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatDateTime(n.created_at)}</span>
                      <span>&bull;</span>
                      <span className="text-teal-primary font-sans font-semibold group-hover:underline flex items-center gap-0.5">
                        Open Associated Record <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>

                {!n.read_at && (
                  <button
                    onClick={(e) => markAsRead(n.id, e)}
                    className="p-1 text-slate-400 hover:text-navy-900 rounded shrink-0"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
