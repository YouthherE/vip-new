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

// ==================== 菜单数据 ====================

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

// ==================== 品类色板（每类一种活力强调色） ====================

const CAT_TONES: Record<string, { accent: string; soft: string; glow: string }> = {
  main: {
    accent: 'var(--brand)',
    soft: 'color-mix(in srgb, var(--brand) 8%, transparent)',
    glow: 'color-mix(in srgb, var(--brand) 20%, transparent)',
  },
  business: {
    accent: 'var(--color-purple)',
    soft: 'color-mix(in srgb, var(--color-purple) 8%, transparent)',
    glow: 'color-mix(in srgb, var(--color-purple) 20%, transparent)',
  },
  stats: {
    accent: 'var(--color-mint)',
    soft: 'color-mix(in srgb, var(--color-mint) 8%, transparent)',
    glow: 'color-mix(in srgb, var(--color-mint) 20%, transparent)',
  },
  settings: {
    accent: 'var(--ink-2)',
    soft: 'color-mix(in srgb, var(--ink-2) 6%, transparent)',
    glow: 'color-mix(in srgb, var(--ink-2) 12%, transparent)',
  },
};

// ==================== 组件 ====================

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <aside
      className="flex w-60 flex-shrink-0 flex-col border-r border-border sticky top-0 z-20 h-screen"
      style={{
        background: 'linear-gradient(180deg, #FFFAF8 0%, #FFFFFF 24%, #FFFFFF 76%, #FFF7F5 100%)',
      }}
    >
      {/* ============ Logo ============ */}
      <div className="px-5 pb-2 pt-6">
        <Link href="/" className="group flex items-center gap-3">
          <div
            className="relative h-10 w-10 overflow-hidden rounded-xl shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105"
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

      {/* ============ 导航 ============ */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {menuCategories.map((cat, idx) => {
          const tone = CAT_TONES[cat.id];
          return (
            <div key={cat.id} className={idx > 0 ? 'mt-5' : ''}>
              {/* 分类标题 - 彩色微胶囊 */}
              <div className="mb-2 flex items-center gap-2.5 px-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-md"
                  style={{ background: tone.soft, color: tone.accent, opacity: 0.85 }}
                >
                  <cat.icon className="h-3 w-3" />
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-ink-2 uppercase">
                  {cat.label}
                </span>
              </div>

              {/* 菜单项 */}
              <div className="space-y-0.5">
                {cat.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'text-brand-700'
                          : 'text-ink-2 hover:text-ink'
                      }`}
                      style={
                        active
                          ? {
                              background: `color-mix(in srgb, ${tone.accent} 10%, transparent)`,
                              boxShadow: `0 1px 4px ${tone.glow}`,
                            }
                          : undefined
                      }
                    >
                      {/* 激活态左侧彩条 */}
                      {active && (
                        <span
                          className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full"
                          style={{
                            background: tone.accent,
                            boxShadow: `0 0 8px ${tone.glow}`,
                          }}
                        />
                      )}

                      {/* 图标微容器 */}
                      <span
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-110"
                        style={
                          active
                            ? {
                                background: `color-mix(in srgb, ${tone.accent} 16%, transparent)`,
                                color: tone.accent,
                              }
                            : { background: 'transparent' }
                        }
                      >
                        <item.icon className="h-4 w-4 transition-colors duration-200" />
                      </span>

                      {/* 文字 */}
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ============ 底部品牌 ============ */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-2 px-3 py-2">
          <div
            className="h-7 w-7 flex-shrink-0 overflow-hidden rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--brand) 0%, var(--color-pink) 100%)' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/A_cute_kawaii_cartoon_anime_pa_2026-08-07T12-06-47.png"
              alt="乐园"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="text-xs font-semibold text-ink truncate">星光儿童乐园</p>
            <p className="text-[10px] text-ink-3">欢乐世界</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
