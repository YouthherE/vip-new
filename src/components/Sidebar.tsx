'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MoreHorizontal,
  Users,
  BarChart3,
  TrendingUp,
  Package,
  ShoppingBag,
  ShoppingCart,
  Home,
  Sparkles,
  PieChart,
  Settings,
  ChevronRight
} from 'lucide-react';

// ==================== 类型定义 ====================

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

interface MenuCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItem[];
}

// ==================== 熊猫 Logo 图标 ====================

function PandaIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 小圆耳 */}
      <circle cx="8" cy="10" r="5" fill="#1e293b" />
      <circle cx="36" cy="10" r="5" fill="#1e293b" />

      {/* 胖脸 */}
      <ellipse cx="22" cy="22" rx="17" ry="12.5" fill="white" stroke="#cbd5e1" strokeWidth="1.2" />

      {/* 腮红 — 粉嫩圆点 */}
      <ellipse cx="6" cy="25" rx="3.5" ry="2.2" fill="#fda4af" opacity="0.55" />
      <ellipse cx="38" cy="25" rx="3.5" ry="2.2" fill="#fda4af" opacity="0.55" />

      {/* ===== 左眼（卡通多层星眸） ===== */}
      <ellipse cx="10.5" cy="19" rx="7.5" ry="8.5" fill="#1e293b" transform="rotate(-10 10.5 19)" />
      <circle cx="11.5" cy="18" r="3.8" fill="white" />
      <circle cx="11.5" cy="18" r="2.2" fill="#1e293b" />
      <circle cx="12.8" cy="16.3" r="1.4" fill="white" />
      <circle cx="9.8" cy="19" r="0.7" fill="white" />

      {/* ===== 右眼（卡通多层星眸） ===== */}
      <ellipse cx="33.5" cy="19" rx="7.5" ry="8.5" fill="#1e293b" transform="rotate(10 33.5 19)" />
      <circle cx="32.5" cy="18" r="3.8" fill="white" />
      <circle cx="32.5" cy="18" r="2.2" fill="#1e293b" />
      <circle cx="33.8" cy="16.3" r="1.4" fill="white" />
      <circle cx="30.8" cy="19" r="0.7" fill="white" />

      {/* 小鼻头 */}
      <ellipse cx="22" cy="26" rx="2.3" ry="1.6" fill="#1e293b" />

      {/* 咧嘴笑 */}
      <path
        d="M15 29.5 Q22 35 29 29.5"
        stroke="#1e293b"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ==================== 常量 ====================

const menuCategories: MenuCategory[] = [
  {
    id: 'main',
    label: '主菜单',
    icon: Home,
    items: [
      { id: 'dashboard', label: '首页', icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    id: 'business',
    label: '业务功能',
    icon: Sparkles,
    items: [
      { id: 'cashier', label: '收银台', icon: ShoppingCart, path: '/cashier' },
      { id: 'members', label: '会员管理', icon: Users, path: '/members' },
      { id: 'products', label: '商品管理', icon: Package, path: '/products' },
    ],
  },
  {
    id: 'stats',
    label: '数据统计',
    icon: PieChart,
    items: [
      { id: 'stats-orders', label: '订单中心', icon: ShoppingBag, path: '/statistics/orders' },
      { id: 'stats-transactions', label: '收支流水', icon: BarChart3, path: '/statistics/transactions' },
      { id: 'stats-members', label: '会员趋势', icon: TrendingUp, path: '/statistics/members' },
    ],
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: Settings,
    items: [
      { id: 'others', label: '系统配置', icon: MoreHorizontal, path: '/others' },
    ],
  },
];

// ==================== 组件 ====================

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    return pathname === path;
  };

  return (
    <aside className="w-56 flex-shrink-0 border-r border-slate-200/80 flex flex-col h-screen sticky top-0 z-20 bg-gradient-to-b from-white via-white to-slate-50/50">
      
      {/* ========== Logo 区域 ========== */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm group-hover:shadow-md group-hover:border-slate-300 transition-all duration-300 p-0.5">
            <PandaIcon className="w-full h-full" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-800 tracking-tight">乐园会员</p>
            <p className="text-[11px] font-medium text-slate-400 tracking-wide">管理系统</p>
          </div>
        </Link>
      </div>

      {/* ========== 导航菜单 ========== */}
      <nav className="flex-1 px-3 space-y-5 overflow-y-auto">
        {menuCategories.map((category) => (
          <div key={category.id}>
            {/* 分类标题 */}
            <div className="flex items-center gap-2 px-2 mb-1.5">
              <category.icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {category.label}
              </span>
            </div>

            {/* 菜单项列表 */}
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'bg-indigo-50/80 text-indigo-700'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/80'
                    }`}
                  >
                    {/* 激活状态左侧指示条 */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-r-full" />
                    )}

                    {/* 图标 */}
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        active
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-transparent text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200/60'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>

                    {/* 文字 */}
                    <span className="truncate">{item.label}</span>

                    {/* 激活时右侧小箭头 */}
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400 ml-auto flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

    </aside>
  );
}
