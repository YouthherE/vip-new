'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useToast } from '@/components/ToastProvider';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Coins, CreditCard, ChevronLeft, ChevronRight, Loader2, Edit, X } from 'lucide-react';

interface Transaction {
  id: number;
  member_id: number;
  member_name: string;
  member_phone: string;
  type: 'balance' | 'points';
  amount: number;
  balance_after: number;
  remark: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const toast = useToast();

  // Edit remark state
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [remarkForm, setRemarkForm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/transactions', { 
        params: { 
          search,
          type: typeFilter,
          page,
          pageSize: pagination.pageSize
        } 
      });
      if (res.data.code === 200) {
        setTransactions(res.data.data.list);
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
        fetchTransactions(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchTransactions(newPage);
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setRemarkForm(transaction.remark || '');
  };

  const handleUpdateRemark = async () => {
    if (!editingTransaction) return;
    
    setIsSubmitting(true);
    try {
        const res = await api.put('/transactions', {
            id: editingTransaction.id,
            remark: remarkForm
        });
        
        if (res.data.code === 200) {
            toast.success('备注更新成功');
            setEditingTransaction(null);
            fetchTransactions(pagination.page); // Refresh list
        } else {
            toast.error(res.data.msg || '更新失败');
        }
    } catch (e: any) {
        console.error(e);
        toast.error(e.response?.data?.msg || '更新失败，请重试');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex-shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
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
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                    <option value="all">全部类型</option>
                    <option value="balance">余额变动</option>
                    <option value="points">积分变动</option>
                    </select>
                </div>
             </div>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">时间</th>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">会员</th>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">变动类型</th>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">变动金额/数量</th>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">变动后余额</th>
                <th className="px-6 py-3 text-left tracking-wider bg-slate-50">备注</th>
                <th className="px-6 py-3 text-right tracking-wider bg-slate-50">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={6} rows={10} />
              ) : transactions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">暂无变动记录</td></tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-sm whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-700">{t.member_name}</div>
                        <div className="text-xs text-slate-400 font-mono">{t.member_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {t.type === 'balance' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          <CreditCard className="w-3 h-3" /> 余额
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                          <Coins className="w-3 h-3" /> 积分
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium flex items-center gap-1 ${t.amount >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {t.amount >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                        {t.amount > 0 ? '+' : ''}{t.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">
                      {t.balance_after.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm max-w-xs truncate" title={t.remark}>
                      {t.remark || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button
                            onClick={() => handleEditClick(t)}
                            className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"
                            title="修改备注"
                        >
                            <Edit className="w-4 h-4" />
                        </button>
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

      {/* Edit Remark Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800">修改备注</h3>
                    <button 
                        onClick={() => setEditingTransaction(null)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">备注内容</label>
                        <textarea
                            value={remarkForm}
                            onChange={(e) => setRemarkForm(e.target.value)}
                            placeholder="请输入备注信息..."
                            rows={4}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={() => setEditingTransaction(null)}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm font-medium"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleUpdateRemark}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-indigo-200 text-sm font-medium"
                        >
                            {isSubmitting ? '保存中...' : '保存修改'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
