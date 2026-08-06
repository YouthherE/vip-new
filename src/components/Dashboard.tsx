'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import {
  Users, CreditCard, Coins, Activity, Loader2, Calendar,
  TrendingUp, TrendingDown, ArrowRight, UserPlus, ShoppingCart,
  Package, CircleDollarSign, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

// ==================== TypeScript 类型定义 ====================

interface MemberGrowthItem {
  date: string;
  count: number;
}

interface TransactionVolume {
  dates: string[];
  recharge: number[];
  consumption: number[];
}

interface GenderItem {
  gender: string;
  count: number;
}

interface ChannelItem {
  channel: string;
  count: number;
}

interface DashboardData {
  summary: {
    totalMembers: number;
    todaySales: number;
    totalPoints: number;
    activeRate: string | number;
  };
  charts: {
    memberGrowth: MemberGrowthItem[];
    transactionVolume: TransactionVolume;
    memberGender: GenderItem[];
    userChannel: ChannelItem[];
  };
}

interface StatsCardProps {
  title: string;
  value: string;
  subtext: string;
  trendUp: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

// ==================== 工具函数 ====================

function getTodayString(): string {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
}

// ==================== 统计卡片组件 ====================

function StatsCard({ title, value, subtext, trendUp, icon: Icon, iconBg, iconColor, accentColor }: StatsCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-all duration-300">
      {/* 顶部彩色装饰条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor}`} />
      <div className="p-6 pt-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{value}</h3>
          </div>
          <div className={`flex-shrink-0 p-3 rounded-xl ${iconBg} transition-transform duration-300 group-hover:scale-110`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {subtext}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==================== 快捷操作按钮组件 ====================

function QuickAction({ href, icon: Icon, label, desc, color }: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
    >
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

// ==================== 主 Dashboard 组件 ====================

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.code === 200) {
        setData(res.data.data as DashboardData);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // ==================== ECharts 配置 ====================

  // 1. 会员增长趋势（折线图）
  const memberGrowthOption = useMemo(() => {
    if (!data?.charts?.memberGrowth) return {};

    const dates = data.charts.memberGrowth.map((item) => item.date.slice(5));
    const counts = data.charts.memberGrowth.map((item) => item.count);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 },
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        extraCssText: 'border-radius: 12px; padding: 8px 12px;',
      },
      grid: { left: '0%', right: '4%', bottom: '0%', top: '8px', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          name: '新增会员',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { width: 3, color: '#6366f1' },
          itemStyle: { color: '#6366f1' },
          data: counts,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.15)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  // 2. 收支流水分析（柱状图）
  const transactionOption = useMemo(() => {
    if (!data?.charts?.transactionVolume) return {};

    const { dates, recharge, consumption } = data.charts.transactionVolume;
    const formattedDates = dates.map((d) => d.slice(5));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 },
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        extraCssText: 'border-radius: 12px; padding: 8px 12px;',
      },
      legend: {
        data: ['充值', '消费'],
        bottom: 0,
        icon: 'roundRect',
        itemWidth: 12,
        itemHeight: 12,
        textStyle: { color: '#94a3b8', fontSize: 12 },
      },
      grid: { left: '0%', right: '4%', bottom: '36px', top: '8px', containLabel: true },
      xAxis: {
        type: 'category',
        data: formattedDates,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
      },
      series: [
        {
          name: '充值',
          type: 'bar',
          barWidth: '35%',
          data: recharge,
          itemStyle: {
            color: '#10b981',
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: '消费',
          type: 'bar',
          barWidth: '35%',
          data: consumption,
          itemStyle: {
            color: '#f43f5e',
            borderRadius: [6, 6, 0, 0],
          },
        },
      ],
    };
  }, [data]);

  // 3. 会员性别分布（饼图）
  const memberGenderOption = useMemo(() => {
    if (!data?.charts?.memberGender) return {};

    const labelMap: Record<string, string> = {
      male: '男',
      female: '女',
      unknown: '未知',
    };

    const colorMap: Record<string, string> = {
      male: '#6366f1',
      female: '#ec4899',
      unknown: '#cbd5e1',
    };

    const seriesData = data.charts.memberGender.map((item) => ({
      value: item.count,
      name: labelMap[item.gender] || item.gender,
      itemStyle: { color: colorMap[item.gender] || '#e2e8f0' },
    }));

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 },
        extraCssText: 'border-radius: 12px; padding: 8px 12px;',
        formatter: '{b}: {c} 人 ({d}%)',
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      series: [
        {
          name: '性别分布',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    };
  }, [data]);

  // 4. 用户来源渠道（饼图）
  const userChannelOption = useMemo(() => {
    if (!data?.charts?.userChannel) return {};

    const colorPalette = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

    const seriesData = data.charts.userChannel.map((item, idx) => ({
      value: item.count,
      name: item.channel || '未知来源',
      itemStyle: { color: colorPalette[idx % colorPalette.length] },
    }));

    return {
      color: colorPalette,
      tooltip: {
        trigger: 'item',
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 13 },
        extraCssText: 'border-radius: 12px; padding: 8px 12px;',
        formatter: '{b}: {c} 人 ({d}%)',
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: '#64748b', fontSize: 12 },
      },
      series: [
        {
          name: '用户来源',
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 3,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 8,
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          labelLine: { show: false },
          data: seriesData,
        },
      ],
    };
  }, [data]);

  // ==================== 加载状态 ====================

  if (loading) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">加载运营数据中...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Activity className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">暂无数据</p>
          <p className="text-sm text-slate-400 mt-1">请稍后刷新页面重试</p>
        </div>
      </div>
    );
  }

  const todayStr = getTodayString();

  // ==================== 主渲染 ====================

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ============ 欢迎横幅 ============ */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-transparent pointer-events-none" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
                乐园运营数据概览
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                实时追踪会员、交易与经营关键指标
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl text-sm text-slate-600">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-medium">{todayStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 统计卡片（4列） ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="总会员数"
          value={data.summary.totalMembers.toLocaleString()}
          subtext="动态"
          trendUp={true}
          icon={Users}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          accentColor="bg-indigo-500"
        />
        <StatsCard
          title="今日消费额"
          value={`¥ ${data.summary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          subtext="实时"
          trendUp={data.summary.todaySales > 0}
          icon={CreditCard}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          accentColor="bg-emerald-500"
        />
        <StatsCard
          title="积分池总览"
          value={data.summary.totalPoints.toLocaleString()}
          subtext="累计"
          trendUp={true}
          icon={Coins}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accentColor="bg-amber-500"
        />
        <StatsCard
          title="活跃度指数"
          value={`${data.summary.activeRate}%`}
          subtext="7日活跃率"
          trendUp={Number(data.summary.activeRate) > 50}
          icon={Activity}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          accentColor="bg-violet-500"
        />
      </div>

      {/* ============ 图表区域 ============ */}

      {/* Row 1: 会员增长趋势（全宽） */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <TrendingUp size={16} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">会员增长趋势</h3>
              <p className="text-xs text-slate-400">近7天新增会员数量变化</p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
            近7天
          </span>
        </div>
        <div className="px-2">
          <ReactECharts option={memberGrowthOption} style={{ height: '320px' }} />
        </div>
      </div>

      {/* Row 2: 收支流水分析 + 性别分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CircleDollarSign size={16} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">收支流水分析</h3>
                <p className="text-xs text-slate-400">本周充值/消费对比</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              本周
            </span>
          </div>
          <div className="px-2">
            <ReactECharts option={transactionOption} style={{ height: '320px' }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center">
                <Users size={16} className="text-pink-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">会员性别分布</h3>
                <p className="text-xs text-slate-400">全体会员性别占比统计</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              实时
            </span>
          </div>
          <div className="px-2">
            <ReactECharts option={memberGenderOption} style={{ height: '320px' }} />
          </div>
        </div>
      </div>

      {/* Row 3: 用户来源渠道 + 快捷操作 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 来源渠道饼图 - 占3列 */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center">
                <ArrowRight size={16} className="text-cyan-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">用户来源渠道</h3>
                <p className="text-xs text-slate-400">新会员注册渠道分布</p>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
              全部
            </span>
          </div>
          <div className="px-2">
            <ReactECharts option={userChannelOption} style={{ height: '320px' }} />
          </div>
        </div>

        {/* 快捷操作面板 - 占2列 */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Package size={16} className="text-slate-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">快捷操作</h3>
                <p className="text-xs text-slate-400">常用功能快速入口</p>
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 space-y-0.5">
            <QuickAction
              href="/members"
              icon={UserPlus}
              label="新增会员"
              desc="为乐园注册新会员并开卡"
              color="bg-indigo-50 text-indigo-600"
            />
            <QuickAction
              href="/cashier"
              icon={ShoppingCart}
              label="快速收银"
              desc="商品结算与积分消费"
              color="bg-emerald-50 text-emerald-600"
            />
            <QuickAction
              href="/products"
              icon={Package}
              label="商品管理"
              desc="维护商品信息与库存"
              color="bg-amber-50 text-amber-600"
            />
            <QuickAction
              href="/statistics/orders"
              icon={CircleDollarSign}
              label="订单中心"
              desc="查看订单与消费明细"
              color="bg-violet-50 text-violet-600"
            />
          </div>

          {/* 数据摘要区 */}
          <div className="border-t border-slate-50 px-6 py-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">数据摘要</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-800">{data.summary.totalMembers.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">累计会员</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">¥ {data.summary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-slate-400 mt-0.5">今日营业额</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
