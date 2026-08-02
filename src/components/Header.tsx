'use client';

import { useState } from 'react';
import { Search, Bell } from 'lucide-react';
import Link from 'next/link';
import NotificationDropdown from './NotificationDropdown';
import UserDropdown from './UserDropdown';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-slate-200 bg-white sticky top-0 z-50 relative">
      <div>
        {/* <h1 className="text-base font-bold text-slate-800">您好👋</h1> */}
      </div>
      
      <div className="flex items-center gap-4">
        {/* <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="搜索文档、计划..." 
            className="pl-9 pr-3 py-1.5 bg-slate-100 rounded-full text-xs text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-56 transition-all"
          />
        </div> */}
        
        {/* <div className="relative">
            <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-1.5 transition-colors rounded-full cursor-pointer ${showNotifications ? 'text-black bg-slate-100' : 'text-slate-400 hover:text-black'}`}
            >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            
            {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
            )}
        </div> */}
        
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-black/20 transition-all ${showUserMenu ? 'ring-2 ring-black/20' : ''}`}
          >
               <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
          </button>
          
          {showUserMenu && (
            <UserDropdown onClose={() => setShowUserMenu(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
