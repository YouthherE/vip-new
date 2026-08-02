'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut } from 'lucide-react';

interface UserDropdownProps {
  onClose: () => void;
}

export default function UserDropdown({ onClose }: UserDropdownProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Perform logout logic here (e.g., clear tokens)
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <>
      {/* Backdrop for closing when clicking outside */}
      <div className="fixed inset-0 z-40" onClick={onClose}></div>
      
      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        <div className="p-1">
          <Link 
            href="/profile" 
            className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-black rounded-lg transition-colors group"
            onClick={onClose}
          >
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-slate-200 group-hover:text-black transition-colors">
              <User className="w-4 h-4" />
            </div>
            <span className="font-medium">我的信息</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-medium">退出登录</span>
          </button>
        </div>
      </div>
    </>
  );
}
