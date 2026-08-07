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
  ChevronRight,
} from 'lucide-react';

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

const menuCategories: MenuCategory[] = [
  {
    id: 'main',
    label: '主菜单',
    icon: Home,
    items: [{ id: 'dashboard', label: '首页', icon: LayoutDashboard, path: '/' }],
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
    items: [{ id: 'others', label: '系统配置', icon: MoreHorizontal, path: '/others' }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <aside className="flex w-60 flex-shrink-0 flex-col border-r border-border bg-surface sticky top-0 z-20 h-screen">
      {/* Logo */}
      <div className="px-5 pb-4 pt-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--color-pink) 100%)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/A_cute_kawaii_cartoon_anime_pa_2026-08-07T12-06-47.png"
              alt="乐园会员"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-ink">乐园会员</p>
            <p className="text-[11px] font-medium tracking-wide text-ink-3">管理系统</p>
          </div>
        </Link>
      </div>

      {/* 导航 */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3">
        {menuCategories.map((category) => (
          <div key={category.id}>
            <div className="mb-1.5 flex items-center gap-2 px-2">
              <category.icon className="h-3.5 w-3.5 text-ink-3" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                {category.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {category.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.id}
                    href={item.path}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? 'text-brand-700'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink'
                    }`}
                    style={
                      active
                        ? { background: 'color-mix(in srgb, var(--brand) 12%, transparent)' }
                        : undefined
                    }
                  >
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
                        style={{ background: 'var(--brand)' }}
                      />
                    )}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 ${
                        active
                          ? 'text-brand-700'
                          : 'bg-transparent text-ink-3 group-hover:bg-surface-2 group-hover:text-ink-2'
                      }`}
                      style={
                        active
                          ? { background: 'color-mix(in srgb, var(--brand) 18%, transparent)' }
                          : undefined
                      }
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                    {active && <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-brand-600" />}
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
