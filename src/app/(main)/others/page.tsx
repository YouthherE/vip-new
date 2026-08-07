'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Users,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Lightbulb,
  Mail,
  X,
  Loader2,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

const applications = [
  {
    id: 'ai-assistant',
    title: 'AI 助手',
    description: '智能对话助手，帮您解答问题、编写代码',
    icon: Bot,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'employee-management',
    title: '员工管理',
    description: '查看系统注册的所有员工账户信息',
    icon: Users,
    color: 'bg-surface-2 text-brand-700',
  },
  {
    id: 'plans',
    title: '计划管理',
    description: '高效管理团队日程与任务',
    icon: Calendar,
    color: 'bg-orange-100 text-orange-600',
    path: '/plans'
  },
  {
    id: 'inspiration',
    title: '灵感收集',
    description: '随时记录稍纵即逝的灵感火花',
    icon: Lightbulb,
    color: 'bg-yellow-100 text-yellow-600',
    path: '/inspiration'
  },
  {
    id: 'docs',
    title: '项目文档',
    description: '统一管理项目需求、设计和接口文档',
    icon: FileText,
    color: 'bg-pink-100 text-pink-600',
    path: '/docs'
  },
  {
    id: 'reports',
    title: '数据报表',
    description: '多维度数据分析，助力业务决策',
    icon: BarChart3,
    color: 'bg-green-100 text-green-600',
    path: '/reports'
  },
  {
    id: 'email',
    title: '企业邮箱',
    description: '专业安全的企业邮箱服务',
    icon: Mail,
    color: 'bg-cyan-100 text-cyan-600',
    path: '/email'
  },
  {
    id: 'settings',
    title: '系统设置',
    description: '个性化配置您的工作台',
    icon: Settings,
    color: 'bg-surface-2 text-ink-2',
    path: '/settings'
  }
];

const ROLE_OPTIONS = [
  { value: '', label: '全部角色' },
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '普通管理员' },
  { value: 'operator', label: '运营人员' },
];

const ROLE_FORM_OPTIONS = [
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '普通管理员' },
  { value: 'operator', label: '运营人员' },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: '1', label: '启用' },
  { value: '0', label: '禁用' },
];

interface StaffUser {
  id: number;
  username: string;
  role: string;
  roleLabel: string;
  phone: string;
  avatar: string | null;
  status: number;
  created_at: string;
}

interface FormData {
  role: string;
  username: string;
  phone: string;
  password: string;
  confirmPassword: string;
  status: number;
}

const INITIAL_FORM: FormData = {
  role: 'admin',
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  status: 1,
};

export default function OthersPage() {
  const toast = useToast();

  // ── Modal Visibility ──
  const [showAiChat, setShowAiChat] = useState(false);
  const [showStaff, setShowStaff] = useState(false);

  // ── Staff Data ──
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ── Form Modal ──
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [formData, setFormData] = useState<FormData>({ ...INITIAL_FORM });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Delete Confirm Modal ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<StaffUser | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // ── 当前用户权限 ──
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      // role 列可能尚未迁移，兜底：username 为 admin 的视作超级管理员
      setCanManage(user?.role === 'super_admin' || user?.username === 'admin');
    } catch {
      setCanManage(false);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getNameInitial = (username: string) => {
    return (username || '?').charAt(0).toUpperCase();
  };

  // ── Fetch Users ──
  const fetchStaffUsers = useCallback(async (pageNum = 1) => {
    setStaffLoading(true);
    try {
      const params: Record<string, string | number> = { page: pageNum, pageSize: 10, sortBy: 'created_at', sortOrder: 'desc' };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.status = statusFilter;

      const res = await api.get('/users', { params });
      if (res.data.code === 200) {
        const data = res.data.data;
        setStaffUsers(data.list || []);
        setPagination({
          page: data.page,
          pageSize: data.pageSize,
          total: data.total,
          totalPages: data.totalPages,
        });
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setStaffLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  // ── Handlers ──
  const handleOpenStaff = () => {
    setShowStaff(true);
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    fetchStaffUsers(1);
  };

  const handleSearch = () => {
    fetchStaffUsers(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchStaffUsers(newPage);
  };

  const handleClearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    // Trigger fetch via useEffect
  };

  useEffect(() => {
    if (showStaff) {
      fetchStaffUsers(1);
    }
  }, [showStaff, search, roleFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Form Handlers ──
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.role) {
      errors.role = '请选择角色';
    }
    if (formMode === 'add' && !formData.username.trim()) {
      errors.username = '账户名不能为空';
    }
    if (formData.phone.trim() && !/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      errors.phone = '请输入正确的11位手机号';
    }
    if (formMode === 'add' || formData.password) {
      if (formMode === 'add' && !formData.password) {
        errors.password = '请输入密码';
      } else if (formData.password && formData.password.length < 6) {
        errors.password = '密码至少6位';
      }
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次密码不一致';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAdd = () => {
    setFormMode('add');
    setEditingUser(null);
    setFormData({ ...INITIAL_FORM });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowFormModal(true);
  };

  const handleOpenEdit = (user: StaffUser) => {
    setFormMode('edit');
    setEditingUser(user);
    setFormData({
      role: user.role || 'admin',
      username: user.username,
      phone: user.phone || '',
      password: '',
      confirmPassword: '',
      status: user.status,
    });
    setFormErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowFormModal(true);
  };

  const handleFormSubmit = async () => {
    if (!validateForm()) return;
    setFormSubmitting(true);

    try {
      if (formMode === 'add') {
        const res = await api.post('/users', {
          role: formData.role,
          username: formData.username.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          status: formData.status,
        });

        if (res.data.code === 200) {
          toast.success('员工添加成功！');
          setShowFormModal(false);
          fetchStaffUsers(pagination.page);
        } else if (res.data.code === 409) {
          toast.error('账户名已存在，请更换');
          setFormErrors({ username: '账户名已存在' });
        } else {
          toast.error(res.data.message || '添加失败');
        }
      } else {
        if (!editingUser) return;
        const res = await api.put('/users', {
          id: editingUser.id,
          role: formData.role,
          phone: formData.phone.trim(),
          password: formData.password || undefined,
          status: formData.status,
        });

        if (res.data.code === 200) {
          toast.success('员工信息更新成功！');
          setShowFormModal(false);
          fetchStaffUsers(pagination.page);
        } else if (res.data.code === 409) {
          toast.error(res.data.message);
        } else {
          toast.error(res.data.message || '更新失败');
        }
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || '请检查并修正表单中的错误';
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Delete Handlers ──
  const handleOpenDelete = (user: StaffUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteSubmitting(true);

    // 不能删除自己
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (currentUser && currentUser.id === deletingUser.id) {
        toast.error('不能删除自己的账号');
        setDeleteSubmitting(false);
        return;
      }
    } catch {
      // ignore
    }

    try {
      const res = await api.delete(`/users?id=${deletingUser.id}`);
      if (res.data.code === 200) {
        toast.success('员工已删除！');
        setShowDeleteModal(false);
        fetchStaffUsers(pagination.page);
      } else {
        toast.error(res.data.message || '删除失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '删除失败');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // ── Render ──
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">其它应用</h1>
        <p className="text-ink-2 mt-2">探索更多实用工具，提升工作效率</p>
      </div>

      {/* ── Application Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {applications.map((app) => {
          if (app.id === 'ai-assistant' || app.id === 'employee-management') {
            return (
              <button
                key={app.id}
                onClick={() => {
                  if (app.id === 'ai-assistant') setShowAiChat(true);
                  else handleOpenStaff();
                }}
                className="group bg-surface p-6 rounded-xl border border-border-strong hover:shadow-md hover:border-brand transition-all duration-200 flex flex-col items-start text-left cursor-pointer"
              >
                <div className={`p-3 rounded-lg mb-4 ${app.color} group-hover:scale-110 transition-transform duration-200`}>
                  <app.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2 group-hover:text-brand-700 transition-colors">
                  {app.title}
                </h3>
                <p className="text-sm text-ink-2 leading-relaxed">
                  {app.description}
                </p>
              </button>
            );
          }

          return (
            <Link
              href={(app as any).path || '/'}
              key={app.id}
              className="group bg-surface p-6 rounded-xl border border-border-strong hover:shadow-md hover:border-brand transition-all duration-200 flex flex-col items-start"
            >
              <div className={`p-3 rounded-lg mb-4 ${app.color} group-hover:scale-110 transition-transform duration-200`}>
                <app.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2 group-hover:text-brand-700 transition-colors">
                {app.title}
              </h3>
              <p className="text-sm text-ink-2 leading-relaxed">
                {app.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ═══════════════════════ AI Chat Modal ═══════════════════════ */}
      {showAiChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-ink">AI 助手</h3>
              </div>
              <button onClick={() => setShowAiChat(false)} className="text-ink-3 hover:text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe
              src="https://wenxin.baidu.com/?extParams=%7B%22enter_type%22%3A%22home_operate%22%7D"
              className="flex-1 w-full border-0"
              title="AI 助手"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        </div>
      )}

      {/* ═══════════════════════ Employee Management Modal ═══════════════════════ */}
      {showStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-surface-2 text-brand-700">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-ink">员工管理</h3>
                <span className="text-xs text-ink-3 ml-2">
                  ({pagination.total} 人)
                </span>
              </div>
              <div className="flex items-center gap-3">
                {canManage && (
                  <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-1.5 px-3 py-2 bg-surface-20 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    新增员工
                  </button>
                )}
                <button onClick={() => setShowStaff(false)} className="text-ink-3 hover:text-ink-2">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-b border-border flex-shrink-0">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  placeholder="搜索账户名、手机号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand-600"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-surface-2 border border-border-strong rounded-lg text-sm text-ink-2 focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-surface-2 border border-border-strong rounded-lg text-sm text-ink-2 focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>

              {/* Clear Filters */}
              {(search || roleFilter || statusFilter !== '') && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-brand-600 hover:text-brand-700 font-medium flex-shrink-0"
                >
                  清除筛选
                </button>
              )}
            </div>

            {/* Table Body */}
            <div className="overflow-y-auto flex-1">
              {staffLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-ink-3">
                  <Users className="w-12 h-12 mb-3 text-ink-3" />
                  <p className="text-sm mb-2">暂无员工数据</p>
                  {(search || roleFilter || statusFilter !== '') && (
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                    >
                      清除筛选条件
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 sticky top-0 z-10">
                    <tr className="text-left text-ink-2 text-xs uppercase">
                      <th className="px-5 py-3 font-medium whitespace-nowrap">账户名</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">角色</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">手机号</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">创建时间</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">状态</th>
                      <th className="px-5 py-3 font-medium whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {staffUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-surface-2/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                              {getNameInitial(user.username)}
                            </div>
                            <span className="font-medium text-ink whitespace-nowrap font-mono text-xs">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'super_admin'
                              ? 'bg-purple-50 text-purple-600'
                              : user.role === 'operator'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-surface-2 text-ink-2'
                          }`}>
                            {user.roleLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-ink-2 whitespace-nowrap">
                          {user.phone || '-'}
                        </td>
                        <td className="px-5 py-3 text-ink-2 whitespace-nowrap text-xs">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 1
                              ? 'bg-green-50 text-green-600'
                              : 'bg-surface-2 text-ink-2'
                          }`}>
                            {user.status === 1 ? '启用' : '禁用'}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          {canManage ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(user)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-brand-700 hover:bg-surface-2 transition-colors"
                                title="编辑"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(user)}
                                className="p-1.5 rounded-lg text-ink-3 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-ink-3">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-surface-2/50 flex-shrink-0">
                <span className="text-xs text-ink-2">
                  共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (pagination.totalPages <= 7) return true;
                      if (p === 1 || p === pagination.totalPages) return true;
                      if (Math.abs(p - pagination.page) <= 1) return true;
                      return false;
                    })
                    .map((p, idx, arr) => {
                      // Add ellipsis
                      const showEllipsisBefore = idx > 0 && arr[idx - 1] !== p - 1;
                      return (
                        <div key={p} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="px-1 text-ink-3 text-xs">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(p)}
                            className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                              pagination.page === p
                                ? 'bg-surface-20 text-white'
                                : 'text-ink-2 hover:bg-surface-2'
                            }`}
                          >
                            {p}
                          </button>
                        </div>
                      );
                    })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════ Add / Edit Employee Form Modal ═══════════════════════ */}
      {showFormModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-surface-2 text-brand-700">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-ink">
                  {formMode === 'add' ? '新增员工' : '编辑员工'}
                </h3>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-ink-3 hover:text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* 角色 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  角色 <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.role
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                      : 'border-border-strong focus:ring-brand/20 focus:border-brand-600'
                  }`}
                >
                  {ROLE_FORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {formErrors.role && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.role}</p>
                )}
              </div>

              {/* 账户名 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  账户名 {formMode === 'add' && <span className="text-red-400">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="请输入登录账户名"
                  disabled={formMode === 'edit'}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    formMode === 'edit' ? 'bg-surface-2 text-ink-2 cursor-not-allowed' : ''
                  } ${
                    formErrors.username
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                      : 'border-border-strong focus:ring-brand/20 focus:border-brand-600'
                  }`}
                />
                {formErrors.username && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.username}</p>
                )}
              </div>

              {/* 手机号 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  手机号 <span className="text-ink-3 font-normal text-xs">(选填)</span>
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="请输入11位手机号"
                  maxLength={11}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    formErrors.phone
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                      : 'border-border-strong focus:ring-brand/20 focus:border-brand-600'
                  }`}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>
                )}
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  密码{' '}
                  {formMode === 'add' ? (
                    <span className="text-red-400">*</span>
                  ) : (
                    <span className="text-ink-3 font-normal text-xs">(留空则不修改密码)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={formMode === 'add' ? '请输入密码（至少6位）' : '留空则不修改密码'}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      formErrors.password
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                        : 'border-border-strong focus:ring-brand/20 focus:border-brand-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>
                )}
              </div>

              {/* 确认密码 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  确认密码{' '}
                  {formMode === 'add' ? (
                    <span className="text-red-400">*</span>
                  ) : (
                    <span className="text-ink-3 font-normal text-xs">(填写密码时才需确认)</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="请再次输入密码"
                    disabled={formMode === 'edit' && !formData.password}
                    className={`w-full px-3 py-2 pr-10 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                      formMode === 'edit' && !formData.password ? 'bg-surface-2 text-ink-3 cursor-not-allowed' : ''
                    } ${
                      formErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
                        : 'border-border-strong focus:ring-brand/20 focus:border-brand-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={formMode === 'edit' && !formData.password}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 disabled:opacity-30"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.confirmPassword}</p>
                )}
              </div>

              {/* 状态 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  状态 <span className="text-ink-3 font-normal text-xs">(选填)</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand-600"
                >
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
                </select>
              </div>
            </div>

            {/* Form Footer */}
            <div className="p-5 border-t border-border flex justify-end gap-3 bg-surface-2/50">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 border border-border-strong rounded-lg text-sm text-ink-2 hover:bg-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formSubmitting}
                className="px-4 py-2 bg-surface-20 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Delete Confirmation Modal ═══════════════════════ */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="modal-card w-full max-w-md">
            <div className="p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-ink mb-2">确认删除该员工？</h3>
              <p className="text-sm text-ink-2">
                您确定要删除 <span className="font-semibold text-ink">{deletingUser.username}</span> 吗？此操作不可撤销。
              </p>
            </div>
            <div className="modal-footer/50">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 border border-border-strong rounded-lg text-sm text-ink-2 hover:bg-surface transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="px-6 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
