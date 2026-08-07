'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Calendar, Users, TrendingUp, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

export default function MemberStatisticsPage() {
  const notify = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  // Default to last 30 days
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        start: filters.startDate,
        end: filters.endDate
      });
      
      const res = await api.get(`/statistics/members?${queryParams.toString()}`);
      if (res.data.code === 200) {
        setData(res.data.data);
      } else {
        notify.error(res.data.message || '获取数据失败');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch stats:', error);
      const err = error as { message?: string };
      notify.error(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleReset = () => {
    const defaultFilters = {
        startDate: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    };
    
    setFilters(defaultFilters);
    
    setTimeout(() => {
        const queryParams = new URLSearchParams({
            start: defaultFilters.startDate,
            end: defaultFilters.endDate
        });
        
        api.get(`/statistics/members?${queryParams.toString()}`).then(res => {
             if (res.data.code === 200) {
                setData(res.data.data);
              }
        });
    }, 0);
  };

  // Chart Option
  const chartOption = useMemo(() => {
    if (!data?.list) return {};

    const dates = data.list.map((item: { date: string }) => item.date.slice(5));
    const counts = data.list.map((item: { count: number }) => item.count);

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
        minInterval: 1, // Ensure integer values for member counts
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
                { offset: 0, color: 'rgba(0, 0, 0, 0.3)' },
                { offset: 1, color: 'rgba(0, 0, 0, 0)' }
              ]
            }
          }
        }
      ]
    };
  }, [data]);

  return (
    <div className="w-full h-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-ink">会员增长趋势</h2>
          <p className="text-ink-2 text-sm mt-1">查看会员注册与增长的详细统计数据</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border-strong shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 开始日期
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-surface-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-ink-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 结束日期
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-surface-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <div className="w-4 h-4 border-2 border-surface/30 border-t-white rounded-full animate-spin" /> : '查询'}
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-surface text-ink-2 border border-border-strong rounded-lg text-sm font-medium hover:bg-surface-2 hover:text-ink transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            重置
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-2xl border border-border-strong shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-surface-2 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-2 text-ink mb-2">
              <div className="p-2 bg-surface-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-ink" />
              </div>
              <span className="font-medium">期间新增会员</span>
            </div>
            <div className="text-3xl font-bold text-ink">
              {loading ? '-' : (data?.summary?.totalNewMembers || 0)}
            </div>
            <div className="text-xs text-ink-3 mt-1">
                {filters.startDate} 至 {filters.endDate}
            </div>
          </div>
        </div>

        <div className="bg-surface p-6 rounded-2xl border border-border-strong shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-surface-2 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-2 text-ink mb-2">
              <div className="p-2 bg-surface-2 rounded-lg">
                <Users className="w-5 h-5 text-ink" />
              </div>
              <span className="font-medium">当前会员总数</span>
            </div>
            <div className="text-3xl font-bold text-ink">
              {loading ? '-' : (data?.summary?.totalMembers || 0)}
            </div>
            <div className="text-xs text-ink-3 mt-1">
                截止当前
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface p-6 rounded-2xl border border-border-strong shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-ink">增长趋势图</h3>
        </div>
        {loading ? (
            <div className="h-[400px] flex items-center justify-center text-ink-3">加载中...</div>
        ) : data ? (
            <ReactECharts option={chartOption} style={{ height: '400px' }} />
        ) : (
            <div className="h-[400px] flex items-center justify-center text-ink-3">暂无数据</div>
        )}
      </div>
    </div>
  );
}
