'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';
import { TableSkeleton } from '@/components/TableSkeleton';
import { Search, Plus, Coins, CreditCard, User, Phone, FileText, X, ChevronLeft, ChevronRight, MapPin, Share2, Activity, Calendar, Edit, History as HistoryIcon, Loader2, Download } from 'lucide-react';

interface Member {
  id: number;
  name: string;
  phone: string;
  cardcode: string;
  cartype: string;
  expired_at: string;
  balance: number;
  points: number;
  remark: string;
  gender: string;
  address: string;
  channel: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface Transaction {
  id: number;
  member_id: number;
  type: 'balance' | 'points';
  amount: number;
  balance_after: number;
  remark: string;
  created_at: string;
}

const CARTYPE_LABELS: Record<string, string> = {
  single: '次卡',
  quarterly: '季卡',
  half_year: '半年卡',
  yearly: '年卡',
};

export default function MembersPage() {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  // Forms
  const [memberForm, setMemberForm] = useState({
    id: 0,
    name: '',
    phone: '',
    cardcode: '',
    cartype: 'single',
    expired_at: '',
    remark: '',
    gender: 'unknown',
    address: '',
    channel: '',
    status: 'active'
  });
  const [adjustForm, setAdjustForm] = useState({ type: 'balance', amount: '', remark: '' });

  // Transaction history modal states
  const [isTxnModalOpen, setIsTxnModalOpen] = useState(false);
  const [txnMember, setTxnMember] = useState<Member | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txnPagination, setTxnPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [txnLoading, setTxnLoading] = useState(false);
  const [txnFilters, setTxnFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all'
  });

  const fetchMembers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/members', { 
        params: { 
          search,
          page,
          pageSize: pagination.pageSize
        } 
      });
      if (res.data.code === 200) {
        setMembers(res.data.data.list);
        setPagination(res.data.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchMembers(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...memberForm,
        phone: memberForm.phone.replace(/\s+/g, '')
      };

      if (formMode === 'add') {
        const res = await api.post('/members', dataToSubmit);
        if (res.data.code === 200) {
          setIsFormOpen(false);
          fetchMembers(1);
          toast.success('会员添加成功');
        } else {
          toast.error(res.data.message);
        }
      } else {
        const res = await api.put('/members', dataToSubmit);
        if (res.data.code === 200) {
            setIsFormOpen(false);
            fetchMembers(pagination.page);
            toast.success('会员信息更新成功');
        } else {
            toast.error(res.data.message);
        }
      }
    } catch (e: any) {
        toast.error(e.response?.data?.message || '操作失败');
    }
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    try {
      const res = await api.post('/members/adjust', {
        memberId: selectedMember.id,
        type: adjustForm.type,
        amount: Number(adjustForm.amount),
        remark: adjustForm.remark
      });
      if (res.data.code === 200) {
        setIsAdjustOpen(false);
        setAdjustForm({ type: 'balance', amount: '', remark: '' });
        fetchMembers(pagination.page);
        toast.success('变动记录添加成功');
      } else {
        toast.error(res.data.message);
      }
    } catch (e: any) {
        toast.error(e.response?.data?.message || '变动失败');
    }
  };

  const openAdd = () => {
      setFormMode('add');
      setMemberForm({
        id: 0,
        name: '',
        phone: '',
        cardcode: '',
        cartype: 'single',
        expired_at: '',
        remark: '',
        gender: 'unknown',
        address: '',
        channel: '',
        status: 'active'
      });
      setIsFormOpen(true);
  };

  const openEdit = (member: Member) => {
      setFormMode('edit');
      setMemberForm({
        id: member.id,
        name: member.name,
        phone: member.phone,
        cardcode: member.cardcode || '',
        cartype: member.cartype || 'single',
        expired_at: member.expired_at ? member.expired_at.split('T')[0] : '',
        remark: member.remark || '',
        gender: member.gender || 'unknown',
        address: member.address || '',
        channel: member.channel || '',
        status: member.status || 'active'
      });
      setIsFormOpen(true);
  };

  const openAdjust = (member: Member) => {
    setSelectedMember(member);
    setAdjustForm({ type: 'balance', amount: '', remark: '' }); 
    setIsAdjustOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchMembers(newPage);
    }
  };

  const openTxnModal = (member: Member) => {
    // Default startDate to 30 days ago
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startStr = thirtyDaysAgo.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];

    setTxnMember(member);
    setTxnFilters({ startDate: startStr, endDate: endStr, type: 'all' });
    setIsTxnModalOpen(true);
    fetchTransactions(member.id, 1, { startDate: startStr, endDate: endStr, type: 'all' });
  };

  const fetchTransactions = async (memberId: number, page = 1, filters = txnFilters) => {
    setTxnLoading(true);
    try {
      const params: any = {
        memberId,
        page,
        pageSize: txnPagination.pageSize,
      };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.type && filters.type !== 'all') params.type = filters.type;

      const res = await api.get('/transactions', { params });
      if (res.data.code === 200) {
        setTransactions(res.data.data.list);
        setTxnPagination(res.data.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTxnLoading(false);
    }
  };

  const handleTxnSearch = () => {
    if (txnMember) {
      fetchTransactions(txnMember.id, 1);
    }
  };

  const handleTxnPageChange = (newPage: number) => {
    if (txnMember && newPage >= 1 && newPage <= txnPagination.totalPages) {
      fetchTransactions(txnMember.id, newPage);
    }
  };

  const handleExportCSV = async () => {
    if (!txnMember) return;
    try {
      const params: any = {
        memberId: txnMember.id,
        pageSize: 10000, // fetch all for export
      };
      if (txnFilters.startDate) params.startDate = txnFilters.startDate;
      if (txnFilters.endDate) params.endDate = txnFilters.endDate;
      if (txnFilters.type && txnFilters.type !== 'all') params.type = txnFilters.type;

      const res = await api.get('/transactions', { params });
      if (res.data.code === 200) {
        const list = res.data.data.list as Transaction[];
        const headers = ['时间', '变动金额', '变动后余额', '类型', '备注'];
        const rows = list.map((t: Transaction) => [
          new Date(t.created_at).toLocaleString('zh-CN'),
          (t.amount >= 0 ? '+' : '') + t.amount.toFixed(2),
          t.balance_after.toFixed(2),
          t.type === 'balance' ? '余额' : '积分',
          t.remark || '',
        ]);

        const csvContent = '﻿' + [headers, ...rows]
          .map(row => row.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(','))
          .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `余额变动明细_${txnMember.name}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex-shrink-0 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
                {loading && search ? (
                    <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                ) : (
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                )}
                <input 
                type="text" 
                placeholder="搜索会员姓名或手机号..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
            </div>
          </div>
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新增会员
          </button>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">ID</th>
                <th className="px-4 py-3 whitespace-nowrap">会员</th>
                <th className="px-4 py-3 whitespace-nowrap">会员卡号</th>
                <th className="px-4 py-3 whitespace-nowrap">会员类型</th>
                <th className="px-4 py-3 whitespace-nowrap">过期日期</th>
                <th className="px-4 py-3 whitespace-nowrap">性别</th>
                <th className="px-4 py-3 whitespace-nowrap">余额</th>
                <th className="px-4 py-3 whitespace-nowrap">积分</th>
                <th className="px-4 py-3 whitespace-nowrap">状态</th>
                <th className="px-4 py-3 whitespace-nowrap">渠道</th>
                <th className="px-4 py-3 whitespace-nowrap">地址</th>
                <th className="px-4 py-3 whitespace-nowrap">备注</th>
                <th className="px-4 py-3 whitespace-nowrap">注册时间</th>
                <th className="px-4 py-3 whitespace-nowrap">更新时间</th>
                <th className="px-4 py-3 text-right whitespace-nowrap bg-slate-50 sticky right-0 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={15} rows={10} />
              ) : members.length === 0 ? (
                <tr><td colSpan={15} className="px-6 py-8 text-center text-slate-400">暂无会员数据</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500">{member.id}</td>
                    <td className="px-4 py-3">
                        <div>
                            <div className="font-medium text-slate-800">{member.name}</div>
                            <div className="text-xs text-slate-400 font-mono">{member.phone}</div>
                        </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs">{member.cardcode || '-'}</td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            member.cartype === 'yearly' ? 'bg-purple-50 text-purple-600' :
                            member.cartype === 'half_year' ? 'bg-blue-50 text-blue-600' :
                            member.cartype === 'quarterly' ? 'bg-cyan-50 text-cyan-600' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {member.cartype === 'yearly' ? '年卡' :
                             member.cartype === 'half_year' ? '半年卡' :
                             member.cartype === 'quarterly' ? '季卡' : '次卡'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                        {member.expired_at ? new Date(member.expired_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                            member.gender === 'male' ? 'bg-blue-50 text-blue-600' :
                            member.gender === 'female' ? 'bg-pink-50 text-pink-600' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                            {member.gender === 'male' ? '男' : member.gender === 'female' ? '女' : '未知'}
                        </span>
                    </td>
                    <td className="px-4 py-3">
                        <button
                            onClick={() => openTxnModal(member)}
                            className="font-medium text-blue-600 underline hover:text-blue-800 transition-colors cursor-pointer text-left"
                            title="查看余额变动明细"
                        >
                            ¥ {member.balance.toFixed(2)}
                        </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-amber-600">{member.points}</td>
                    <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            member.status === 'active' 
                                ? 'bg-green-50 text-green-700 border border-green-100' 
                                : 'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                            {member.status === 'active' ? '正常' : '过期'}
                        </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{member.channel || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={member.address}>{member.address || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={member.remark}>{member.remark || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{new Date(member.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{new Date(member.updated_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right bg-white sticky right-0 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.1)] group-hover:bg-slate-50">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                            onClick={() => openEdit(member)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                            title="编辑"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => openAdjust(member)}
                            className="text-slate-400 hover:text-amber-600 transition-colors p-1"
                            title="变动余额/积分"
                        >
                            <Coins className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between flex-shrink-0">
            <div className="text-sm text-slate-500">
                共 {pagination.total} 条，页码 {pagination.page}/{pagination.totalPages || 1}
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Member Form Modal (Add/Edit) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{formMode === 'add' ? '新增会员' : '编辑会员'}</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
                <form id="memberForm" onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">姓名 <span className="text-red-500">*</span></label>
                    <input 
                    required
                    value={memberForm.name}
                    onChange={e => setMemberForm({...memberForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="请输入会员姓名"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">手机号 <span className="text-red-500">*</span></label>
                    <input
                    required
                    value={memberForm.phone}
                    onChange={e => setMemberForm({...memberForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="请输入手机号码"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">会员卡号</label>
                    <input
                    value={memberForm.cardcode}
                    onChange={e => setMemberForm({...memberForm, cardcode: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="非必填"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">会员类型 <span className="text-red-500">*</span></label>
                    <select
                        required
                        value={memberForm.cartype}
                        onChange={e => setMemberForm({...memberForm, cartype: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="single">次卡</option>
                        <option value="quarterly">季卡</option>
                        <option value="half_year">半年卡</option>
                        <option value="yearly">年卡</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        过期日期
                        {memberForm.cartype !== 'single' && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                        type="date"
                        required={memberForm.cartype !== 'single'}
                        value={memberForm.expired_at}
                        onChange={e => setMemberForm({...memberForm, expired_at: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">性别</label>
                    <select 
                        value={memberForm.gender}
                        onChange={e => setMemberForm({...memberForm, gender: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="unknown">未知</option>
                        <option value="male">男</option>
                        <option value="female">女</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">状态</label>
                    <select 
                        value={memberForm.status}
                        onChange={e => setMemberForm({...memberForm, status: e.target.value})}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                        <option value="active">正常</option>
                        <option value="disabled">过期</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">注册渠道</label>
                    <input 
                    value={memberForm.channel}
                    onChange={e => setMemberForm({...memberForm, channel: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="例如：微信、门店推荐"
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">地址</label>
                    <input 
                    value={memberForm.address}
                    onChange={e => setMemberForm({...memberForm, address: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="请输入详细地址"
                    />
                </div>

                <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">备注</label>
                    <textarea 
                    value={memberForm.remark}
                    onChange={e => setMemberForm({...memberForm, remark: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="选填"
                    rows={3}
                    />
                </div>
                </form>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors">取消</button>
                <button type="submit" form="memberForm" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                    {formMode === 'add' ? '确认添加' : '保存修改'}
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Modal */}
      {isAdjustOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">余额/积分变动</h3>
              <button onClick={() => setIsAdjustOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <span className="font-medium text-slate-700">{selectedMember.name}</span>
                <div className="flex gap-4 text-sm">
                    <span className="text-emerald-600">余额: {selectedMember.balance}</span>
                    <span className="text-amber-600">积分: {selectedMember.points}</span>
                </div>
            </div>
            <form onSubmit={handleAdjustSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setAdjustForm({...adjustForm, type: 'balance'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${adjustForm.type === 'balance' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <CreditCard className="w-4 h-4" /> 余额
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustForm({...adjustForm, type: 'points'})}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${adjustForm.type === 'points' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <Coins className="w-4 h-4" /> 积分
                  </button>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">变动数量</label>
                <div className="relative">
                    <input
                    required
                    type="number"
                    step="0.01"
                    value={adjustForm.amount}
                    onChange={e => setAdjustForm({...adjustForm, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="正数增加，负数扣除"
                    />
                </div>
                <p className="text-xs text-slate-400">输入负数（如 -100）表示扣除</p>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">备注</label>
                <textarea
                required
                value={adjustForm.remark}
                onChange={e => setAdjustForm({...adjustForm, remark: e.target.value})}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="请输入变动原因"
                rows={2}
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200">
                    确认变动
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {isTxnModalOpen && txnMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col" style={{ maxWidth: '1000px', maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                余额变动明细 - {txnMember.name}{txnMember.cardcode ? `（卡号：${txnMember.cardcode}）` : ''}
              </h3>
              <button onClick={() => setIsTxnModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex-shrink-0">
              <span className="text-sm text-slate-600">当前余额：</span>
              <span className="text-lg font-bold text-slate-800">¥ {txnMember.balance.toFixed(2)}</span>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">开始日期</label>
                  <input
                    type="date"
                    value={txnFilters.startDate}
                    onChange={e => setTxnFilters({...txnFilters, startDate: e.target.value})}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">结束日期</label>
                  <input
                    type="date"
                    value={txnFilters.endDate}
                    onChange={e => setTxnFilters({...txnFilters, endDate: e.target.value})}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-slate-500">类型</label>
                  <select
                    value={txnFilters.type}
                    onChange={e => setTxnFilters({...txnFilters, type: e.target.value})}
                    className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="all">全部</option>
                    <option value="balance">余额变动</option>
                    <option value="points">积分变动</option>
                  </select>
                </div>
                <button
                  onClick={handleTxnSearch}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  查询
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-auto flex-1" style={{ minHeight: '360px' }}>
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap">时间</th>
                    <th className="px-4 py-3 whitespace-nowrap">变动金额</th>
                    <th className="px-4 py-3 whitespace-nowrap">变动后余额</th>
                    <th className="px-4 py-3 whitespace-nowrap">类型</th>
                    <th className="px-4 py-3 whitespace-nowrap">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txnLoading ? (
                    <TableSkeleton columns={5} rows={8} />
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 text-center text-slate-400" style={{ height: '280px', verticalAlign: 'middle' }}>暂无余额变动记录</td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                          {new Date(t.created_at).toLocaleString('zh-CN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium" style={{ color: t.amount >= 0 ? '#00C853' : '#FF1744' }}>
                            {t.amount >= 0 ? '+' : ''}{t.amount.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono">
                          {t.balance_after.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                            t.type === 'balance'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                            {t.type === 'balance' ? '余额' : '积分'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-sm max-w-[200px] truncate" title={t.remark}>
                          {t.remark || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination + Export */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-slate-500">
                共 {txnPagination.total} 条，页码 {txnPagination.page}/{txnPagination.totalPages || 1}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <button
                    onClick={() => handleTxnPageChange(txnPagination.page - 1)}
                    disabled={txnPagination.page <= 1}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleTxnPageChange(txnPagination.page + 1)}
                    disabled={txnPagination.page >= txnPagination.totalPages}
                    className="p-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> 导出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
