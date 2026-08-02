'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Users, CreditCard, Coins, ArrowUpRight, ArrowDownRight, Activity, Loader2 } from 'lucide-react';
import api from '@/lib/axios';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.code === 200) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Member Growth (Line Chart)
  const memberGrowthOption = useMemo(() => {
    if (!data?.charts?.memberGrowth) return {};
    
    const dates = data.charts.memberGrowth.map((item: any) => item.date.slice(5)); // '2023-10-01' -> '10-01'
    const counts = data.charts.memberGrowth.map((item: any) => item.count);

    return {
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates,
        axisLine: { lineStyle: { color: '#94a3b8' } }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        {
          name: '新增会员',
          type: 'line',
          smooth: true,
          data: counts,
          itemStyle: { color: '#000000' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 0, 0, 0.2)' },
                { offset: 1, color: 'rgba(0, 0, 0, 0)' }
              ]
            }
          }
        }
      ]
    };
  }, [data]);

  // 2. Transaction Volume (Bar Chart)
  const transactionOption = useMemo(() => {
    if (!data?.charts?.transactionVolume) return {};

    const { dates, recharge, consumption } = data.charts.transactionVolume;
    const formattedDates = dates.map((d: string) => d.slice(5));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: formattedDates,
        axisLine: { lineStyle: { color: '#94a3b8' } }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#94a3b8' }
      },
      series: [
        {
          name: '充值金额',
          type: 'bar',
          stack: 'total',
          barWidth: '40%',
          data: recharge,
          itemStyle: { color: '#000000' }
        },
        {
          name: '消费金额',
          type: 'bar',
          stack: 'total',
          data: consumption.map((v: number) => -v), // Display as negative
          itemStyle: { color: '#a3a3a3' }
        }
      ]
    };
  }, [data]);

  // 3. Member Gender Distribution (Pie Chart)
  const memberGenderOption = useMemo(() => {
    if (!data?.charts?.memberGender) return {};
    
    const labelMap: Record<string, string> = {
        'male': '男',
        'female': '女',
        'unknown': '未知'
    };

    const colorMap: Record<string, string> = {
        'male': '#000000',
        'female': '#737373',
        'unknown': '#d4d4d4'
    };

    const seriesData = data.charts.memberGender.map((item: any) => ({
        value: item.count,
        name: labelMap[item.gender] || item.gender,
        itemStyle: { color: colorMap[item.gender] || '#e5e5e5' }
    }));

    return {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        bottom: '0%',
        left: 'center',
        icon: 'circle'
      },
      series: [
        {
          name: '性别分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData
        }
      ]
    };
  }, [data]);

  // 4. User Channel Distribution (Pie/Bar Chart) - Replaced Points Activity
  const userChannelOption = useMemo(() => {
    if (!data?.charts?.userChannel) return {};

    const seriesData = data.charts.userChannel.map((item: any) => ({
      value: item.count,
      name: item.channel || '未知来源'
    }));

    return {
      color: ['#000000', '#404040', '#737373', '#a3a3a3', '#d4d4d4'],
      tooltip: {
        trigger: 'item'
      },
      legend: {
        top: '5%',
        left: 'center'
      },
      series: [
        {
          name: '用户来源',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: seriesData
        }
      ]
    };
  }, [data]);

  if (loading) {
    return (
        <div className="flex h-[400px] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  if (!data) {
      return <div className="p-6 text-center text-slate-500">暂无数据，请稍后重试。</div>;
  }

  return (
    <div className="p-6 space-y-6 w-full max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="总会员数" 
          value={data.summary.totalMembers.toLocaleString()} 
          trend="动态" 
          trendUp={true} 
          icon={Users} 
          iconBg="bg-slate-200"
          iconColor="text-slate-800"
        />
        <StatsCard 
          title="今日消费额" 
          value={`¥ ${data.summary.todaySales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
          trend="实时" 
          trendUp={true} 
          icon={CreditCard} 
          iconBg="bg-slate-200"
          iconColor="text-slate-800"
        />
        <StatsCard 
          title="积分池总览" 
          value={data.summary.totalPoints.toLocaleString()} 
          trend="累计" 
          trendUp={true} 
          icon={Coins} 
          iconBg="bg-slate-200"
          iconColor="text-slate-800"
        />
        <StatsCard 
          title="活跃度指数" 
          value={`${data.summary.activeRate}%`} 
          trend="7日活跃占比" 
          trendUp={Number(data.summary.activeRate) > 50} 
          icon={Activity} 
          iconBg="bg-slate-200"
          iconColor="text-slate-800"
        />
      </div>

      {/* 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Main Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">会员增长趋势</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">近7天</span>
          </div>
          <ReactECharts option={memberGrowthOption} style={{ height: '300px' }} />
        </div>

        {/* Transaction Analysis */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">收支流水分析</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">本周</span>
          </div>
          <ReactECharts option={transactionOption} style={{ height: '300px' }} />
        </div>

        {/* Pie Chart & Radar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">用户性别分布</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">实时</span>
          </div>
          <ReactECharts option={memberGenderOption} style={{ height: '300px' }} />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">用户画像 (来源渠道)</h3>
            <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">全部</span>
          </div>
          <ReactECharts option={userChannelOption} style={{ height: '300px' }} />
        </div>

      </div>

    </div>
  );
}

function StatsCard({ title, value, trend, trendUp, icon: Icon, iconBg, iconColor }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className={`text-xs font-medium flex items-center gap-1 ${trendUp ? 'text-black' : 'text-slate-600'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </span>
        <span className="text-xs text-slate-400">{trend === '动态' || trend === '实时' ? '数据更新' : '说明'}</span>
      </div>
    </div>
  );
}
