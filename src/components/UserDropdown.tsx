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
      
      <div className="absolute right-0 top-full mt-1.5 w-36 bg-surface rounded-lg shadow-lg border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
        <div className="p-0.5">
          <Link 
            href="/profile" 
            className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-surface-2 hover:text-black rounded-md transition-colors group"
            onClick={onClose}
          >
            <div className="p-1 bg-surface-2 rounded-md text-ink-2 group-hover:bg-surface-2 group-hover:text-black transition-colors">
              <User className="w-3 h-3" />
            </div>
            <span>我的信息</span>
          </Link>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-red-50 hover:text-red-600 rounded-md transition-colors group"
          >
            <div className="p-1 bg-surface-2 rounded-md text-ink-2 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
              <LogOut className="w-3 h-3" />
            </div>
            <span>退出登录</span>
          </button>
        </div>
      </div>
    </>
  );
}
