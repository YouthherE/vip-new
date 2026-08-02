'use client';

import { useState } from 'react';
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

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: '系统维护通知',
      content: '系统将于今晚 24:00 进行例行维护，预计耗时 2 小时。',
      time: '10分钟前',
      read: false,
      type: 'warning'
    },
    {
      id: '2',
      title: '新功能上线',
      content: 'AI 写作助手功能现已上线，快来体验吧！',
      time: '2小时前',
      read: false,
      type: 'success'
    },
    {
      id: '3',
      title: '欢迎加入',
      content: '欢迎来到 Nebula Workspace，开始您的创作之旅。',
      time: '1天前',
      read: true,
      type: 'info'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <>
        {/* Backdrop for closing when clicking outside */}
        <div className="fixed inset-0 z-40" onClick={onClose}></div>
        
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
            <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">消息通知</h3>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button 
                            onClick={handleMarkAllRead}
                            className="text-xs text-black hover:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            title="全部已读"
                        >
                            <Check className="w-3 h-3" />
                            已读
                        </button>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">暂无消息</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map(notification => (
                            <div 
                                key={notification.id} 
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.read ? 'bg-slate-100/50' : ''}`}
                                onClick={() => handleMarkRead(notification.id)}
                            >
                                <div className="flex gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notification.read ? 'bg-black' : 'bg-slate-200'}`}></div>
                                    <div className="flex-1">
                                        <h4 className={`text-sm font-medium mb-1 ${!notification.read ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {notification.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                            {notification.content}
                                        </p>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
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
            
            <div className="p-3 border-t border-slate-50 bg-slate-50/30 text-center">
                <button className="text-xs text-slate-500 hover:text-black transition-colors">
                    查看全部消息
                </button>
            </div>
        </div>
    </>
  );
}
