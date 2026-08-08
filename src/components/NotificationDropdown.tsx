'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Bell, X, Clock } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

interface NotificationDropdownProps {
  onClose: () => void;
}

const STORAGE_KEY = 'notifications_read_ids';
const STORAGE_ALL_KEY = 'notifications_all_read';

const MOCK: Notification[] = [
  { id: '1', title: '系统维护通知', content: '系统将于今晚 24:00 进行例行维护，预计耗时 2 小时。', time: '10分钟前', read: false, type: 'warning' },
  { id: '2', title: '新功能上线', content: '会员趋势分析功能现已上线，支持按日期区间查看新增会员曲线。', time: '2小时前', read: false, type: 'success' },
  { id: '3', title: '欢迎加入', content: '欢迎使用星光儿童乐园管理系统，开启您的运营之旅。', time: '1天前', read: true, type: 'info' },
];

function loadReadIds(): Set<string> {
  try {
    const allRead = localStorage.getItem(STORAGE_ALL_KEY);
    if (allRead === '1') return new Set(MOCK.map(n => n.id));
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids])); } catch {}
}

function saveAllRead() {
  try { localStorage.setItem(STORAGE_ALL_KEY, '1'); } catch {}
}

export function getUnreadCount(): number {
  const readIds = loadReadIds();
  return MOCK.filter(n => !readIds.has(n.id)).length;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());

  const notifications = MOCK.map(n => ({ ...n, read: readIds.has(n.id) }));
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = useCallback(() => {
    const all = new Set(MOCK.map(n => n.id));
    setReadIds(all);
    saveAllRead();
    saveReadIds(all);
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      
      <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        <div className="p-4 border-b border-border flex justify-between items-center bg-surface-2/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-ink">消息通知</h3>
            {unreadCount > 0 && (
              <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-ink-2 hover:text-ink px-2 py-1 rounded transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                已读
              </button>
            )}
            <button onClick={onClose} className="text-ink-3 hover:text-ink-2 p-1 hover:bg-surface-2 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-ink-3">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">暂无消息</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-surface-2 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-brand-50/30' : ''}`}
                  onClick={() => handleMarkRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-brand' : 'bg-transparent'}`}></div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium mb-1 ${!notification.read ? 'text-ink' : 'text-ink-2'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-xs text-ink-2 leading-relaxed mb-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-ink-3">
                        <Clock className="w-3 h-3" />
                        <span>{notification.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t border-border bg-surface-2/30 text-center">
          <button className="text-xs text-ink-2 hover:text-ink transition-colors">
            查看全部消息
          </button>
        </div>
      </div>
    </>
  );
}
