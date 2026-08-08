'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Users, CreditCard, Coins, Activity, Loader2, Calendar,
  TrendingUp, UserPlus, ShoppingCart,
  Package, CircleDollarSign, ArrowRight, ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { StatCard } from '@/components/ui';

// ==================== TypeScript 类型定义 ====================

interface MemberGrowthItem { date: string; count: number; }
interface TransactionVolume { dates: string[]; recharge: number[]; consumption: number[]; }
interface GenderItem { gender: string; count: number; }
interface ChannelItem { channel: string; count: number; }
interface DashboardData {
  summary: { totalMembers: number; todaySales: number; totalPoints: number; activeRate: string | number; };
  charts: { memberGrowth: MemberGrowthItem[]; transactionVolume: TransactionVolume; memberGender: GenderItem[]; userChannel: ChannelItem[]; };
}

// 品牌色板（与 globals.css 令牌一致）
const C = {
  brand: '#FF6B5C',
  mint: '#14C8A6',
  sun: '#FFB020',
  purple: '#7C5CFC',
  pink: '#FF6FA5',
  blue: '#3B82F6',
  ink2: '#5B6472',
  ink3: '#939BAA',
  border: '#E7EAF1',
};

function getTodayString(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
}

const tooltipBase = {
  backgroundColor: '#fff',
  borderColor: C.border,
  borderWidth: 1,
  textStyle: { color: C.ink2, fontSize: 13 },
  extraCssText: 'border-radius: 12px; padding: 8px 12px; box-shadow: 0 8px 24px rgba(16,24,40,.12);',
};

// ==================== 主 Dashboard 组件 ====================

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.code === 200) setData(res.data.data as DashboardData);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. 会员增长趋势
  const memberGrowthOption = useMemo(() => {
    if (!data?.charts?.memberGrowth) return {};
    const dates = data.charts.memberGrowth.map((i) => i.date.slice(5));
    const counts = data.charts.memberGrowth.map((i) => i.count);
    return {
      tooltip: { trigger: 'axis', ...tooltipBase },
      grid: { left: '0%', right: '4%', bottom: '0%', top: '8px', containLabel: true },
      xAxis: {
        type: 'category', boundaryGap: false, data: dates,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: C.ink3, fontSize: 11 },
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: C.border, type: 'dashed' } },
        axisLabel: { color: C.ink3, fontSize: 11 },
      },
      series: [{
        name: '新增会员', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
        lineStyle: { width: 3, color: C.brand },
        itemStyle: { color: C.brand },
        data: counts,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
          { offset: 0, color: 'rgba(255,107,92,0.18)' },
          { offset: 1, color: 'rgba(255,107,92,0.01)' },
        ] } },
      }],
    };
  }, [data]);

  // 2. 收支流水
  const transactionOption = useMemo(() => {
    if (!data?.charts?.transactionVolume) return {};
    const { dates, recharge, consumption } = data.charts.transactionVolume;
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...tooltipBase },
      legend: { data: ['充值', '消费'], bottom: 0, icon: 'roundRect', itemWidth: 12, itemHeight: 12, textStyle: { color: C.ink3, fontSize: 12 } },
      grid: { left: '0%', right: '4%', bottom: '36px', top: '8px', containLabel: true },
      xAxis: { type: 'category', data: dates.map((d) => d.slice(5)), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: C.ink3, fontSize: 11 } },
      yAxis: { type: 'value', axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: C.border, type: 'dashed' } }, axisLabel: { color: C.ink3, fontSize: 11 } },
      series: [
        { name: '充值', type: 'bar', barWidth: '35%', data: recharge, itemStyle: { color: C.mint, borderRadius: [6, 6, 0, 0] } },
        { name: '消费', type: 'bar', barWidth: '35%', data: consumption, itemStyle: { color: C.brand, borderRadius: [6, 6, 0, 0] } },
      ],
    };
  }, [data]);

  // 3. 性别分布
  const memberGenderOption = useMemo(() => {
    if (!data?.charts?.memberGender) return {};
    const labelMap: Record<string, string> = { male: '男', female: '女', unknown: '未知' };
    const colorMap: Record<string, string> = { male: C.brand, female: C.pink, unknown: C.ink3 };
    const seriesData = data.charts.memberGender.map((i) => ({
      value: i.count, name: labelMap[i.gender] || i.gender,
      itemStyle: { color: colorMap[i.gender] || C.border },
    }));
    return {
      tooltip: { trigger: 'item', ...tooltipBase, formatter: '{b}: {c} 人 ({d}%)' },
      legend: { bottom: '0%', left: 'center', icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: C.ink2, fontSize: 12 } },
      series: [{
        name: '性别分布', type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 8, label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false }, data: seriesData,
      }],
    };
  }, [data]);

  // 4. 来源渠道
  const userChannelOption = useMemo(() => {
    if (!data?.charts?.userChannel) return {};
    const palette = [C.brand, C.sun, C.mint, C.purple, C.pink, C.blue];
    const seriesData = data.charts.userChannel.map((i, idx) => ({
      value: i.count, name: i.channel || '未知来源', itemStyle: { color: palette[idx % palette.length] },
    }));
    return {
      color: palette,
      tooltip: { trigger: 'item', ...tooltipBase, formatter: '{b}: {c} 人 ({d}%)' },
      legend: { bottom: '0%', left: 'center', icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: C.ink2, fontSize: 12 } },
      series: [{
        name: '用户来源', type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 3 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 8, label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false }, data: seriesData,
      }],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: C.brand }} />
          <p className="text-sm text-ink-3">加载运营数据中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 text-ink-3">
            <Activity className="h-8 w-8" />
          </div>
          <p className="font-medium text-ink">暂无数据</p>
          <p className="mt-1 text-sm text-ink-3">请稍后刷新页面重试</p>
        </div>
      </div>
    );
  }

  const todayStr = getTodayString();
  const quickActions = [
    { href: '/members', icon: UserPlus, label: '新增会员', desc: '为乐园注册新会员并开卡', tone: C.brand },
    { href: '/cashier', icon: ShoppingCart, label: '快速收银', desc: '商品结算与积分消费', tone: C.mint },
    { href: '/products', icon: Package, label: '商品管理', desc: '维护商品信息与库存', tone: C.sun },
    { href: '/statistics/orders', icon: CircleDollarSign, label: '订单中心', desc: '查看订单与消费明细', tone: C.purple },
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] animate-fade-up space-y-6 p-4 sm:p-6 lg:p-8">

      {/* 欢迎横幅 */}
      <div className="card relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(120deg, color-mix(in srgb, var(--brand) 10%, transparent), transparent 55%)' }}
        />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">乐园运营数据概览</h1>
            <p className="mt-1.5 text-sm text-ink-2">实时追踪会员、交易与经营关键指标</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl bg-surface-2 px-3 py-2 text-sm text-ink-2 sm:self-auto">
            <Calendar size={16} className="text-ink-3" />
            <span className="font-medium">{todayStr}</span>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <StatCard label="总会员数" value={data.summary.totalMembers.toLocaleString()} icon={Users} tone="brand" delta="动态" deltaDir="up" />
        <StatCard
          label="今日消费额"
          value={`¥ ${data.summary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={CreditCard} tone="mint" delta="实时" deltaDir={data.summary.todaySales > 0 ? 'up' : 'down'}
        />
        <StatCard label="积分池总览" value={data.summary.totalPoints.toLocaleString()} icon={Coins} tone="sun" delta="累计" deltaDir="up" />
        <StatCard
          label="活跃度指数"
          value={`${data.summary.activeRate}%`}
          icon={Activity} tone="purple" delta="7日活跃率" deltaDir={Number(data.summary.activeRate) > 50 ? 'up' : 'down'}
        />
      </div>

      {/* 会员增长趋势 */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 pb-2 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--brand) 14%, transparent)', color: C.brand }}>
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">会员增长趋势</h3>
              <p className="text-xs text-ink-3">近7天新增会员数量变化</p>
            </div>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">近7天</span>
        </div>
        <div className="px-2">
          <ReactECharts option={memberGrowthOption} style={{ height: '320px' }} />
        </div>
      </div>

      {/* 收支流水 + 性别分布 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 pb-2 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-mint) 14%, transparent)', color: C.mint }}>
                <CircleDollarSign size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">收支流水分析</h3>
                <p className="text-xs text-ink-3">本周充值/消费对比</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">本周</span>
          </div>
          <div className="px-2">
            <ReactECharts option={transactionOption} style={{ height: '320px' }} />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 pb-2 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-pink) 14%, transparent)', color: C.pink }}>
                <Users size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">会员性别分布</h3>
                <p className="text-xs text-ink-3">全体会员性别占比统计</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">实时</span>
          </div>
          <div className="px-2">
            <ReactECharts option={memberGenderOption} style={{ height: '320px' }} />
          </div>
        </div>
      </div>

      {/* 来源渠道 + 快捷操作 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="card overflow-hidden lg:col-span-3">
          <div className="flex items-center justify-between px-6 pb-2 pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: 'color-mix(in srgb, var(--color-blue) 14%, transparent)', color: C.blue }}>
                <ArrowRight size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-ink">用户来源渠道</h3>
                <p className="text-xs text-ink-3">新会员注册渠道分布</p>
              </div>
            </div>
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-3">全部</span>
          </div>
          <div className="px-2">
            <ReactECharts option={userChannelOption} style={{ height: '320px' }} />
          </div>
        </div>

        <div className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-3 px-6 pb-2 pt-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-ink-2">
              <Package size={16} />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink">快捷操作</h3>
              <p className="text-xs text-ink-3">常用功能快速入口</p>
            </div>
          </div>
          <div className="space-y-0.5 px-4 pb-4">
            {quickActions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center gap-4 rounded-xl border border-transparent p-4 transition-colors hover:border-border hover:bg-surface-2"
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white transition-transform duration-200 group-hover:scale-110"
                  style={{ background: a.tone }}
                >
                  <a.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{a.label}</p>
                  <p className="mt-0.5 text-xs text-ink-3">{a.desc}</p>
                </div>
                <ChevronRight size={16} className="flex-shrink-0 text-ink-3 transition-colors group-hover:text-ink-2" />
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-border px-6 py-4">
            <div>
              <p className="text-2xl font-bold text-ink">{data.summary.totalMembers.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-ink-3">累计会员</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">¥ {data.summary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="mt-0.5 text-xs text-ink-3">今日营业额</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
