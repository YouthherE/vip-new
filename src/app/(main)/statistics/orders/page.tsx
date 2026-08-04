'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { TableSkeleton } from '@/components/TableSkeleton';
import { useToast } from '@/components/ToastProvider';
import { Search, X, ChevronLeft, ChevronRight, Loader2, Calendar, Filter, RotateCcw, ShoppingBag, User, CreditCard, Clock, Package } from 'lucide-react';

interface OrderItem {
  id: number;
  product_name: string;
  product_image: string;
  normal_price: number;
  member_price: number;
  sold_price: number;
  price_type: string;
  quantity: number;
  subtotal: number;
}

interface OperationLog {
  id: number;
  target_type: string;
  target_id: number;
  action: string;
  content: string;
  created_at: string;
}

interface OrderDetail {
  order: any;
  items: OrderItem[];
  logs: OperationLog[];
}

interface Order {
  id: number;
  order_no: string;
  member_id: number | null;
  member_name: string;
  member_phone: string;
  price_type: string;
  total_amount: number;
  item_count: number;
  balance_before: number | null;
  balance_after: number | null;
  status: number;
  remark: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PRICE_TYPE_LABELS: Record<string, string> = {
  normal: '普通价',
  member: '会员价',
};

const ACTION_LABELS: Record<string, string> = {
  checkout_normal: '普通购买',
  checkout_member: '会员购买',
  create: '创建',
  update: '更新',
};

export default function OrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    priceType: 'all',
  });

  // Detail modal
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async (page = 1) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize: pagination.pageSize };
      if (search) params.search = search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.priceType && filters.priceType !== 'all') params.priceType = filters.priceType;

      const res = await api.get('/orders', { params });
      if (res.data.code === 200) {
        setOrders(res.data.data.list);
        setPagination(res.data.data.pagination);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(1), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = () => {
    fetchOrders(1);
  };

  const handleReset = () => {
    setSearch('');
    setFilters({ startDate: new Date().toISOString().split('T')[0], endDate: '', priceType: 'all' });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchOrders(newPage);
    }
  };

  const openDetail = async (order: Order) => {
    setSelectedOrder(order);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get('/orders', { params: { id: order.id } });
      if (res.data.code === 200) {
        setDetail(res.data.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('获取订单详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="w-full h-full p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">订单中心</h2>
          <p className="text-slate-500 text-sm mt-1">查看所有订单的基本信息、商品明细、支付信息与操作日志</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Search className="w-3 h-3" /> 搜索
            </label>
            <input
              type="text"
              placeholder="订单号 / 客户姓名 / 手机号"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black w-[240px]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 开始日期
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={e => setFilters({ ...filters, startDate: e.target.value })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> 结束日期
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={e => setFilters({ ...filters, endDate: e.target.value })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" /> 价格类型
            </label>
            <select
              value={filters.priceType}
              onChange={e => setFilters({ ...filters, priceType: e.target.value })}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black"
            >
              <option value="all">全部</option>
              <option value="normal">普通价</option>
              <option value="member">会员价</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            查询
          </button>

          <button
            onClick={handleReset}
            className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> 重置
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-medium">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">订单号</th>
                <th className="px-4 py-3 whitespace-nowrap">客户</th>
                <th className="px-4 py-3 whitespace-nowrap">金额</th>
                <th className="px-4 py-3 whitespace-nowrap">类型</th>
                <th className="px-4 py-3 whitespace-nowrap">数量</th>
                <th className="px-4 py-3 whitespace-nowrap">时间</th>
                <th className="px-4 py-3 whitespace-nowrap">状态</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <TableSkeleton columns={7} rows={10} />
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">暂无订单数据</td></tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openDetail(order)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-indigo-600 font-medium">{order.order_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      {order.member_name ? (
                        <div>
                          <div className="font-medium text-slate-700">{order.member_name}</div>
                          <div className="text-xs text-slate-400">{order.member_phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">散客</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">¥ {order.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.price_type === 'member'
                          ? 'bg-purple-50 text-purple-600 border border-purple-100'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {PRICE_TYPE_LABELS[order.price_type] || order.price_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{order.item_count}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        order.status === 1
                          ? 'bg-green-50 text-green-700 border border-green-100'
                          : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {order.status === 1 ? '已完成' : '已取消'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-between">
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

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col" style={{ maxWidth: '900px', maxHeight: '85vh' }}>
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                订单详情 - {selectedOrder.order_no}
              </h3>
              <button onClick={() => { setSelectedOrder(null); setDetail(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
                </div>
              ) : detail ? (
                <>
                  {/* 订单基本信息 */}
                  <section>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4" /> 订单基本信息
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">订单号</span>
                        <p className="font-mono text-slate-800 font-medium">{detail.order.order_no}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">价格类型</span>
                        <p>{PRICE_TYPE_LABELS[detail.order.price_type] || detail.order.price_type}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">订单金额</span>
                        <p className="font-semibold text-slate-800">¥ {detail.order.total_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">商品总数</span>
                        <p>{detail.order.item_count}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">状态</span>
                        <p className={detail.order.status === 1 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {detail.order.status === 1 ? '已完成' : '已取消'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">下单时间</span>
                        <p className="text-xs">{new Date(detail.order.created_at).toLocaleString('zh-CN')}</p>
                      </div>
                      {detail.order.remark && (
                        <div className="col-span-2">
                          <span className="text-slate-400">备注</span>
                          <p>{detail.order.remark}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 支付信息 */}
                  {detail.order.price_type === 'member' && (
                    <section>
                      <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> 支付信息
                      </h4>
                      <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">支付方式</span>
                          <p className="font-medium text-slate-800">余额支付</p>
                        </div>
                        <div>
                          <span className="text-slate-400">支付前余额</span>
                          <p className="font-mono text-slate-700">¥ {detail.order.balance_before?.toFixed(2) || '-'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">支付后余额</span>
                          <p className="font-mono text-slate-700">¥ {detail.order.balance_after?.toFixed(2) || '-'}</p>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* 客户信息 */}
                  <section>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> 客户信息
                    </h4>
                    <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {detail.order.member_name ? (
                        <>
                          <div>
                            <span className="text-slate-400">客户姓名</span>
                            <p className="font-medium text-slate-800">{detail.order.member_name}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">手机号</span>
                            <p className="font-mono text-slate-700">{detail.order.member_phone}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">会员ID</span>
                            <p>{detail.order.member_id}</p>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-slate-400">类型</span>
                          <p className="text-slate-500">散客（非会员）</p>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* 商品明细 */}
                  <section>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4" /> 商品明细
                    </h4>
                    <div className="overflow-hidden border border-slate-200 rounded-lg">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-500 text-xs uppercase">
                          <tr>
                            <th className="px-4 py-2">商品名称</th>
                            <th className="px-4 py-2">单价</th>
                            <th className="px-4 py-2">数量</th>
                            <th className="px-4 py-2 text-right">小计</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detail.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                  {item.product_image && (
                                    <img src={item.product_image} alt={item.product_name} className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <span className="font-medium text-slate-700">{item.product_name}</span>
                                </div>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className="font-mono text-slate-700">¥ {item.sold_price.toFixed(2)}</span>
                                {item.price_type === 'member' && item.member_price !== item.normal_price && (
                                  <span className="text-xs text-slate-400 line-through ml-1">¥ {item.normal_price.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600">× {item.quantity}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800">¥ {item.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>

                  {/* 操作日志 */}
                  <section>
                    <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> 操作日志
                    </h4>
                    {detail.logs.length === 0 ? (
                      <p className="text-sm text-slate-400 bg-slate-50 rounded-lg p-4">暂无操作日志</p>
                    ) : (
                      <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {detail.logs.map((log) => (
                          <div key={log.id} className="px-4 py-3 flex items-start gap-4 text-sm hover:bg-slate-50">
                            <span className="text-xs text-slate-400 whitespace-nowrap pt-0.5 min-w-[140px]">
                              {new Date(log.created_at).toLocaleString('zh-CN')}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium min-w-[60px] text-center ${
                              log.action === 'checkout_member' ? 'bg-purple-50 text-purple-600' :
                              log.action === 'checkout_normal' ? 'bg-blue-50 text-blue-600' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ACTION_LABELS[log.action] || log.action}
                            </span>
                            <span className="text-slate-600 flex-1">{log.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400">加载失败，请重试</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
