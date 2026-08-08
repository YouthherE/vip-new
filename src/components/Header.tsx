'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import NotificationDropdown, { getUnreadCount } from './NotificationDropdown';
import UserDropdown from './UserDropdown';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    setHasUnread(getUnreadCount() > 0);
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const handleCloseNotifications = () => {
    setShowNotifications(false);
    // 重新读取未读状态
    setHasUnread(getUnreadCount() > 0);
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold tracking-tight text-ink">运营控制台</h1>
        <span className="hidden rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-medium text-ink-2 sm:inline">
          星光儿童乐园
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className={`btn btn-ghost btn-icon btn-md ${showNotifications ? 'text-ink' : ''}`}
            aria-label="通知"
          >
            <Bell className="h-4 w-4" />
            {hasUnread && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border-2 border-surface bg-danger" />
            )}
          </button>
          {showNotifications && <NotificationDropdown onClose={handleCloseNotifications} />}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`block h-8 w-8 overflow-hidden rounded-full border border-border transition-all hover:ring-2 hover:ring-brand/30 ${
              showUserMenu ? 'ring-2 ring-brand/30' : ''
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://api.dicebear.com/9.x/lorelei/svg?seed=Starlight&backgroundColor=ffdfbf,ffe0bd" alt="管理员" className="h-full w-full object-cover" />
          </button>
          {showUserMenu && <UserDropdown onClose={() => setShowUserMenu(false)} />}
        </div>
      </div>
    </header>
  );
}
