'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Activity, Search, RefreshCw } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

export default function TransactionStatisticsPage() {
  const notify = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  // Default to last 30 days
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: 'all', // all, recharge, consume
    member: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        start: filters.startDate,
        end: filters.endDate,
        type: filters.type,
      });
      if (filters.member) {
        queryParams.append('member', filters.member);
      }
      
      const res = await api.get(`/statistics/transactions?${queryParams.toString()}`);
      if (res.data.code === 200) {
        setData(res.data.data);
      } else {
        notify.error(res.data.message || '获取数据失败');
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
      notify.error(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    
    if (name === 'member') {
        if (value.length >= 1) {
            fetchSuggestions(value);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }
  };

  const fetchSuggestions = async (query: string) => {
    setSuggestionLoading(true);
    try {
        const res = await api.get('/members', {
            params: { search: query, page: 1, pageSize: 5 }
        });
        if (res.data.code === 200) {
            setSuggestions(res.data.data.list);
            setShowSuggestions(true);
        }
    } catch (error) {
        console.error('Failed to fetch suggestions:', error);
    } finally {
        setSuggestionLoading(false);
    }
  };

  const selectMember = (member: any) => {
    setFilters(prev => ({ ...prev, member: member.name })); // Or member.phone, or combination
    setShowSuggestions(false);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowSuggestions(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleReset = () => {
    setFilters({
      startDate: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      type: 'all',
      member: ''
    });
    // Trigger fetch after state update in next render cycle or manually call fetch with default params
    // Since state update is async, we can just let the user click search or use useEffect dependency if we wanted auto-fetch.
    // Here, to make it instant, we can call fetchData with defaults, but let's stick to just resetting the form for now 
    // and maybe trigger a fetch? 
    // Better UX: Reset and immediately fetch default data.
    
    const defaultFilters = {
        startDate: new Date(new Date().setDate(new Date().getDate() - 29)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        type: 'all',
        member: ''
    };
    
    // We need to use a separate function or pass params to fetchData to avoid stale state issues if we call it immediately
    // For simplicity, let's just reset state and let user click search, OR use a timeout/useEffect. 
    // Actually, let's modify fetchData to accept optional params or just wait for the user.
    // Common pattern: Reset button just resets form. But user might expect data to reset too.
    
    // Let's implement immediate reset + fetch
    setFilters(defaultFilters);
    
    // We can't call fetchData() immediately because it uses `filters` state which hasn't updated yet.
    // We can refactor fetchData to accept args, or just duplicate the logic slightly for reset.
    // Refactoring fetchData is cleaner.
    
    setTimeout(() => {
        // This is a bit hacky but works for simple cases. 
        // A better way is to move fetchData logic to accept params.
        // Let's just reset the form for now as per "Reset Button" standard behavior usually implies resetting criteria.
        // If user wants to see default data, they can click search. 
        // BUT, often "Reset" implies "Show me default view".
        
        // Let's do this:
        const queryParams = new URLSearchParams({
            start: defaultFilters.startDate,
            end: defaultFilters.endDate,
            type: defaultFilters.type,
        });
        
        api.get(`/statistics/transactions?${queryParams.toString()}`).then(res => {
             if (res.data.code === 200) {
                setData(res.data.data);
              }
        });
    }, 0);
  };


  // Chart Option
  const chartOption = useMemo(() => {
    if (!data?.list) return {};

    const dates = data.list.map((item: any) => item.date.slice(5)); // '2023-10-01' -> '10-01'
    const rechargeData = data.list.map((item: any) => item.recharge);
    const consumeData = data.list.map((item: any) => item.consumption); // Use positive value for display

    const series = [];

    if (filters.type === 'all' || filters.type === 'recharge') {
      series.push({
        name: '充值金额',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { color: '#000000', borderRadius: [4, 4, 0, 0] },
        data: rechargeData
      });
    }

    if (filters.type === 'all' || filters.type === 'consume') {
      series.push({
        name: '消费金额',
        type: 'bar',
        barMaxWidth: 30,
        itemStyle: { color: '#737373', borderRadius: [4, 4, 0, 0] },
        data: consumeData
      });
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      legend: {
        bottom: 0,
        data: ['充值金额', '消费金额']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b' }
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9' } },
        axisLabel: { color: '#64748b' }
      },
      series: series
    };
  }, [data, filters.type]);

  return (
    <div className="w-full h-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">收支流水统计</h2>
          <p className="text-slate-500 text-sm mt-1">查看会员充值与消费的详细统计数据</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 开始日期
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 结束日期
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> 交易类型
            </label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black min-w-[120px]"
            >
              <option value="all">全部</option>
              <option value="recharge">仅充值</option>
              <option value="consume">仅消费</option>
            </select>
          </div>

          <div className="space-y-1 relative" onClick={(e) => e.stopPropagation()}>
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Search className="w-3 h-3" /> 会员搜索
            </label>
            <input
              type="text"
              name="member"
              placeholder="姓名或手机号"
              value={filters.member}
              onChange={handleFilterChange}
              onFocus={() => { if(filters.member) setShowSuggestions(true); }}
              autoComplete="off"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black w-[160px]"
            />
            {showSuggestions && (
                <div className="absolute top-full left-0 w-[240px] bg-white border border-slate-200 rounded-lg shadow-xl mt-1 z-50 max-h-[300px] overflow-y-auto">
                    {suggestionLoading ? (
                        <div className="p-3 text-center text-xs text-slate-400">加载中...</div>
                    ) : suggestions.length > 0 ? (
                        <ul className="py-1">
                            {suggestions.map((item) => (
                                <li 
                                    key={item.id}
                                    onClick={() => selectMember(item)}
                                    className="px-3 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                >
                                    <div className="text-sm font-medium text-slate-700">{item.name}</div>
                                    <div className="text-xs text-slate-400">{item.phone}</div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-3 text-center text-xs text-slate-400">无匹配会员</div>
                    )}
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            查询
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            重置
          </button>
        </form>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <div className="p-2 bg-slate-200 rounded-lg">
                <TrendingUp className="w-5 h-5 text-slate-800" />
              </div>
              <span className="font-medium">期间总充值</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {loading ? '-' : `¥${data?.summary?.totalRecharge?.toLocaleString() || 0}`}
            </div>
            <div className="text-xs text-slate-400 mt-1">
                {filters.startDate} 至 {filters.endDate}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <div className="p-2 bg-slate-200 rounded-lg">
                <TrendingDown className="w-5 h-5 text-slate-800" />
              </div>
              <span className="font-medium">期间总消费</span>
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {loading ? '-' : `¥${data?.summary?.totalConsumption?.toLocaleString() || 0}`}
            </div>
             <div className="text-xs text-slate-400 mt-1">
                {filters.startDate} 至 {filters.endDate}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
          <div className="relative">
            <div className="flex items-center gap-2 text-slate-800 mb-2">
              <div className="p-2 bg-slate-200 rounded-lg">
                <Activity className="w-5 h-5 text-slate-800" />
              </div>
              <span className="font-medium">净收支</span>
            </div>
            <div className={`text-3xl font-bold ${data?.summary?.netIncome >= 0 ? 'text-slate-800' : 'text-slate-600'}`}>
              {loading ? '-' : `¥${data?.summary?.netIncome?.toLocaleString() || 0}`}
            </div>
             <div className="text-xs text-slate-400 mt-1">
                充值 - 消费
            </div>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-1 h-6 bg-black rounded-full" />
            趋势分析
        </h3>
        <div className="w-full h-[400px]">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          ) : (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          )}
        </div>
      </div>
    </div>
  );
}
