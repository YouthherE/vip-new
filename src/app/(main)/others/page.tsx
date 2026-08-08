'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Calendar,
  BarChart3,
  Settings,
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
  CreditCard,
  Info,
  Lock,
  Check,
  TrendingUp,
  Activity,
} from 'lucide-react';
import Link from 'next/link';
import ReactECharts from 'echarts-for-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

const applications = [
  {
    id: 'employee-management',
    title: '员工管理',
    description: '查看系统注册的所有员工账户信息',
    icon: Users,
    color: 'bg-surface-2 text-brand-700',
  },
  {
    id: 'payment-config',
    title: '支付配置',
    description: '管理微信支付、支付宝商户参数',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-600',
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
    id: 'reports',
    title: '数据报表',
    description: '多维度数据分析，助力业务决策',
    icon: BarChart3,
    color: 'bg-green-100 text-green-600',
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

// ── 数据报表类型 ──
interface TrendItem { months: string[]; revenue: number[]; orders: number[]; }
interface ChannelOrderItem { channel: string; orderCount: number; amount: number; }
interface PieItem { name: string; value: number; }
interface TopMemberItem { rank: number; id: number; name: string; phone: string; txnCount: number; totalSpent: number; }
interface FunnelItem { name: string; value: number; }
interface RegionItem { name: string; value: number; }

interface ReportsData {
  revenueTrend: TrendItem;
  channelOrders: ChannelOrderItem[];
  memberTiers: PieItem[];
  multiMetric: { months: string[]; revenue: number[]; recharge: number[]; };
  activityDistribution: PieItem[];
  top10Members: TopMemberItem[];
  conversionFunnel: FunnelItem[];
  regionDistribution: RegionItem[];
}

// 科技蓝/青配色系统
const C = {
  cyan: '#00E5FF',
  blue: '#2979FF',
  purple: '#B388FF',
  green: '#00E676',
  orange: '#FF9100',
  pink: '#FF4081',
  gold: '#FFD740',
  dark: '#0A0E27',
  card: '#0D132E',
  border: '#1E2A4A',
  text: '#A8B5D0',
  dim: '#5A6988',
};

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      setCanManage(user?.role === 'super_admin' || user?.username === 'admin');
      setCurrentUserId(user?.id ?? null);
    } catch {
      setCanManage(false);
    }
  }, []);

  // ── 支付配置 ──
  const [showPaymentConfig, setShowPaymentConfig] = useState(false);
  const [paymentCfgLoading, setPaymentCfgLoading] = useState(false);
  const [paymentCfgSaving, setPaymentCfgSaving] = useState(false);
  const [paymentCfgForm, setPaymentCfgForm] = useState({
    wechatAppId: '',
    wechatMchId: '',
    wechatApiV3Key: '',
    wechatPrivateKey: '',
    wechatCertSerialNo: '',
    wechatNotifyUrl: '',
    alipayAppId: '',
    alipayPrivateKey: '',
    alipayPublicKey: '',
  });
  const [paymentCfgConfigured, setPaymentCfgConfigured] = useState(false);
  // 敏感字段显隐控制
  const [showPaymentSecrets, setShowPaymentSecrets] = useState<Record<string, boolean>>({});
  const togglePaymentSecret = (key: string) => {
    setShowPaymentSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── 数据报表 ──
  const [showReport, setShowReport] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportsData | null>(null);

  const handleOpenReport = async () => {
    setShowReport(true);
    setReportLoading(true);
    try {
      const res = await api.get('/dashboard/reports');
      if (res.data.code === 200 && res.data.data) {
        setReportData(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setReportLoading(false);
    }
  };

  const reportCharts = useMemo(() => {
    if (!reportData) return null;

    const colorPalette = [C.cyan, C.blue, C.purple, C.green, C.orange, C.pink, C.gold];

    // ── 1. 趋势变化（营收 + 订单双Y轴折线图）──
    const revenueTrendOpt = {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
      },
      legend: {
        data: ['营收(元)', '订单数'],
        bottom: 0,
        textStyle: { color: '#5A6988', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: reportData.revenueTrend.months,
        axisLabel: { color: '#5A6988', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1E2A4A' } },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: '营收(元)',
          nameTextStyle: { color: '#5A6988', fontSize: 10 },
          axisLabel: { color: '#5A6988', fontSize: 10 },
          splitLine: { lineStyle: { color: '#1E2A4A', type: 'dashed' as const } },
        },
        {
          type: 'value' as const,
          name: '订单数',
          nameTextStyle: { color: '#5A6988', fontSize: 10 },
          axisLabel: { color: '#5A6988', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '营收(元)',
          type: 'line',
          data: reportData.revenueTrend.revenue,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: C.cyan, width: 2.5 },
          itemStyle: { color: C.cyan },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0,229,255,0.2)' },
                { offset: 1, color: 'rgba(0,229,255,0.0)' },
              ],
            },
          },
        },
        {
          name: '订单数',
          type: 'line',
          yAxisIndex: 1,
          data: reportData.revenueTrend.orders,
          smooth: true,
          symbol: 'diamond',
          symbolSize: 4,
          lineStyle: { color: C.orange, width: 2.5 },
          itemStyle: { color: C.orange },
        },
      ],
    };

    // ── 2. 对比分析（各渠道订单 - 横向柱状图）──
    const channelOrdersOpt = {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
      },
      grid: { left: '3%', right: '8%', top: '3%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value' as const,
        axisLabel: { color: '#5A6988', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1E2A4A', type: 'dashed' as const } },
      },
      yAxis: {
        type: 'category' as const,
        data: reportData.channelOrders.map(c => c.channel).reverse(),
        axisLabel: { color: '#A8B5D0', fontSize: 11 },
        axisLine: { lineStyle: { color: '#1E2A4A' } },
        axisTick: { show: false },
      },
      series: [{
        name: '订单数',
        type: 'bar',
        data: reportData.channelOrders.map(c => c.orderCount).reverse(),
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: C.blue },
              { offset: 1, color: C.cyan },
            ],
          },
        },
        barMaxWidth: 22,
        label: { show: true, position: 'right' as const, color: '#5A6988', fontSize: 10 },
      }],
    };

    // ── 3. 占比分析（会员等级 - 环形图）──
    const memberTiersOpt = {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
        formatter: '{b}: {c}人 ({d}%)',
      },
      legend: {
        orient: 'vertical' as const,
        right: '2%',
        top: 'middle',
        itemGap: 6,
        textStyle: { color: '#5A6988', fontSize: 10 },
      },
      series: [{
        name: '会员等级',
        type: 'pie',
        radius: ['45%', '65%'],
        center: ['35%', '50%'],
        data: reportData.memberTiers,
        color: colorPalette,
        label: { show: false },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,229,255,0.4)' },
          label: { show: true, color: '#A8B5D0', fontSize: 12 },
        },
        itemStyle: { borderColor: C.dark, borderWidth: 3 },
      }],
    };

    // ── 4. 多维度对比（分组柱状图：营收 vs 充值）──
    const multiMetricOpt = {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
      },
      legend: {
        data: ['营收', '充值'],
        bottom: 0,
        textStyle: { color: '#5A6988', fontSize: 11 },
      },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: reportData.multiMetric.months,
        axisLabel: { color: '#5A6988', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1E2A4A' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: '#5A6988', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1E2A4A', type: 'dashed' as const } },
      },
      series: [
        {
          name: '营收',
          type: 'bar',
          data: reportData.multiMetric.revenue,
          itemStyle: { color: C.cyan, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 16,
          barGap: '20%',
        },
        {
          name: '充值',
          type: 'bar',
          data: reportData.multiMetric.recharge,
          itemStyle: { color: C.purple, borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 16,
        },
      ],
    };

    // ── 5. 数据分布（消费频次 - 直方图）──
    const activityOpt = {
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
      },
      grid: { left: '3%', right: '4%', top: '5%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: reportData.activityDistribution.map(d => d.name),
        axisLabel: { color: '#5A6988', fontSize: 10 },
        axisLine: { lineStyle: { color: '#1E2A4A' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        name: '人数',
        nameTextStyle: { color: '#5A6988', fontSize: 10 },
        axisLabel: { color: '#5A6988', fontSize: 10 },
        splitLine: { lineStyle: { color: '#1E2A4A', type: 'dashed' as const } },
      },
      series: [{
        name: '人数',
        type: 'bar',
        data: reportData.activityDistribution.map((d, i) => ({
          value: d.value,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#B388FF' },
                { offset: 1, color: '#2979FF' },
              ],
            },
          },
        })),
        barMaxWidth: 36,
      }],
    };

    // ── 7. 转化漏斗 ──
    const funnelOpt = {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
        formatter: '{b}: {c}人',
      },
      series: [{
        name: '转化漏斗',
        type: 'funnel',
        left: '10%',
        top: 10,
        bottom: 10,
        width: '80%',
        min: 0,
        max: reportData.conversionFunnel[0]?.value || 1,
        sort: 'descending' as const,
        gap: 3,
        label: {
          show: true,
          position: 'inside' as const,
          formatter: '{b}\n{c}人',
          color: '#fff',
          fontSize: 11,
          lineHeight: 18,
        },
        itemStyle: {
          borderColor: C.dark,
          borderWidth: 2,
          borderRadius: 4,
        },
        data: reportData.conversionFunnel.map((f, i) => ({
          ...f,
          itemStyle: { color: colorPalette[i] },
        })),
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,229,255,0.3)' },
        },
      }],
    };

    // ── 8. 地域分布（Treemap 模拟热力图）──
    const regionOpt = {
      tooltip: {
        trigger: 'item' as const,
        backgroundColor: '#0D132E',
        borderColor: '#1E2A4A',
        textStyle: { color: '#A8B5D0', fontSize: 12 },
        formatter: '{b}: {c}人',
      },
      series: [{
        type: 'treemap',
        roam: false,
        nodeClick: false as const,
        breadcrumb: { show: false },
        label: {
          show: true,
          formatter: '{b}\n{c}人',
          color: '#fff',
          fontSize: 10,
          lineHeight: 16,
        },
        data: reportData.regionDistribution.map((r, i) => ({
          ...r,
          itemStyle: {
            color: colorPalette[i % colorPalette.length],
            borderColor: C.dark,
            borderWidth: 2,
            borderRadius: 4,
          },
        })),
        levels: [
          { itemStyle: { borderWidth: 0, gapWidth: 4 } },
        ],
      }],
    };

    return {
      revenueTrend: revenueTrendOpt,
      channelOrders: channelOrdersOpt,
      memberTiers: memberTiersOpt,
      multiMetric: multiMetricOpt,
      activity: activityOpt,
      funnel: funnelOpt,
      region: regionOpt,
    };
  }, [reportData]);

  const handleOpenPaymentConfig = async () => {
    setShowPaymentConfig(true);
    setShowPaymentSecrets({});
    setPaymentCfgLoading(true);
    try {
      const res = await api.get('/settings/payment');
      if (res.data.code === 200 && res.data.data?.configured) {
        const c = res.data.data.config;
        setPaymentCfgForm({
          wechatAppId: c.wechatAppId || '',
          wechatMchId: c.wechatMchId || '',
          wechatApiV3Key: c.wechatApiV3Key || '',
          wechatPrivateKey: c.wechatPrivateKey || '',
          wechatCertSerialNo: c.wechatCertSerialNo || '',
          wechatNotifyUrl: c.wechatNotifyUrl || '',
          alipayAppId: c.alipayAppId || '',
          alipayPrivateKey: c.alipayPrivateKey || '',
          alipayPublicKey: c.alipayPublicKey || '',
        });
        setPaymentCfgConfigured(true);
      } else {
        setPaymentCfgConfigured(false);
      }
    } catch {
      // ignore
    } finally {
      setPaymentCfgLoading(false);
    }
  };

  const handleSavePaymentConfig = async () => {
    setPaymentCfgSaving(true);
    try {
      const res = await api.put('/settings/payment', paymentCfgForm);
      if (res.data.code === 200) {
        toast.success('支付配置已保存');
        setPaymentCfgConfigured(true);
        setShowPaymentConfig(false);
      } else {
        toast.error(res.data.message || '保存失败');
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || '保存失败');
    } finally {
      setPaymentCfgSaving(false);
    }
  };

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
    if (currentUserId === user.id) {
      toast.error('不能删除自己的账户');
      return;
    }
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    setDeleteSubmitting(true);

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

  // ================================================================
  //  Render
  // ================================================================
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">功能配置</h1>
        <p className="text-ink-2 mt-2">管理支付平台、员工账户等系统功能</p>
      </div>

      {/* ── Application Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {applications.map((app) => {
          if (app.id === 'employee-management') {
            return (
              <button
                key={app.id}
                onClick={handleOpenStaff}
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
          if (app.id === 'payment-config') {
            return (
              <button
                key={app.id}
                onClick={handleOpenPaymentConfig}
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
          if (app.id === 'reports') {
            return (
              <button
                key={app.id}
                onClick={handleOpenReport}
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

      {/* ═══════════════════════ Employee Management Modal ═══════════════════════ */}
      {showStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="modal-card w-full max-w-5xl h-[82vh]">
            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-ink">员工管理</h3>
                <span className="text-xs text-ink-3">共 {pagination.total} 人</span>
              </div>
              <button onClick={() => setShowStaff(false)} className="text-ink-3 hover:text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Toolbar */}
            <div className="px-5 py-3 flex items-center gap-2 border-b border-border flex-shrink-0">
              <div className="relative flex-shrink-0 w-36">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                <input
                  type="text"
                  placeholder="搜索…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-border-strong rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-[4.5rem] pl-2 pr-5 py-1.5 bg-surface-2 border border-border-strong rounded-full text-xs text-ink-2 focus:outline-none focus:ring-2 focus:ring-brand/20 flex-shrink-0 truncate"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-[4.5rem] pl-2 pr-5 py-1.5 bg-surface-2 border border-border-strong rounded-full text-xs text-ink-2 focus:outline-none focus:ring-2 focus:ring-brand/20 flex-shrink-0 truncate"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {(search || roleFilter || statusFilter !== '') && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-ink-3 hover:text-ink-2 flex-shrink-0 ml-1"
                >
                  清除
                </button>
              )}
              {canManage && (
                <button onClick={handleOpenAdd} className="btn btn-primary btn-sm ml-auto flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                  新增
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
                                disabled={currentUserId === user.id}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  currentUserId === user.id
                                    ? 'text-ink-4 cursor-not-allowed opacity-40'
                                    : 'text-ink-3 hover:text-red-600 hover:bg-red-50'
                                }`}
                                title={currentUserId === user.id ? '不能删除自己的账户' : '删除'}
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start px-8 pt-8 pb-5">
              <div>
                <h3 className="text-2xl font-semibold text-[#1a1a1a] leading-tight">
                  {formMode === 'add' ? '新增员工' : '编辑员工'}
                </h3>
                <p className="text-sm text-[#666] mt-1">
                  {formMode === 'add' ? '创建新的员工账户' : '修改员工信息'}
                </p>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 pb-8 space-y-4 max-h-[55vh] overflow-y-auto">
              {/* Row 1: 角色 | 状态 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    角色 <span className="text-[#e74c3c] ml-1">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className={`w-full px-4 py-3 border rounded-lg text-sm text-[#1a1a1a] bg-white transition-all duration-200 focus:outline-none ${
                      formErrors.role
                        ? 'border-[#ff4d4f] focus:border-[#ff4d4f] shadow-[0_0_0_2px_rgba(255,77,79,0.15)]'
                        : 'border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40'
                    }`}
                  >
                    {ROLE_FORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  {formErrors.role && (
                    <p className="text-xs text-[#ff4d4f]">{formErrors.role}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    状态 <span className="text-xs font-normal text-[#999] ml-2">(选填)</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>

              {/* Row 2: 账户名 | 手机号 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    账户名 {formMode === 'add' && <span className="text-[#e74c3c] ml-1">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="例如：zhangsan"
                    disabled={formMode === 'edit'}
                    className={`w-full px-4 py-3 border rounded-lg text-sm placeholder:text-[#aaa] transition-all duration-200 focus:outline-none ${
                      formMode === 'edit' ? 'bg-[#f5f5f5] text-[#999] cursor-not-allowed border-[#d9d9d9]' : 'bg-white text-[#1a1a1a]'
                    } ${
                      formErrors.username
                        ? 'border-[#ff4d4f] focus:border-[#ff4d4f] shadow-[0_0_0_2px_rgba(255,77,79,0.15)]'
                        : formMode !== 'edit' ? 'border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40' : ''
                    }`}
                  />
                  {formErrors.username && (
                    <p className="text-xs text-[#ff4d4f]">{formErrors.username}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    手机号 <span className="text-xs font-normal text-[#999] ml-2">(选填)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="例如：13800138000"
                    maxLength={11}
                    className={`w-full px-4 py-3 border rounded-lg text-sm placeholder:text-[#aaa] bg-white text-[#1a1a1a] transition-all duration-200 focus:outline-none ${
                      formErrors.phone
                        ? 'border-[#ff4d4f] focus:border-[#ff4d4f] shadow-[0_0_0_2px_rgba(255,77,79,0.15)]'
                        : 'border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-[#ff4d4f]">{formErrors.phone}</p>
                  )}
                </div>
              </div>

              {/* Row 3: 密码 | 确认密码 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    密码{' '}
                    {formMode === 'add' ? (
                      <span className="text-[#e74c3c] ml-1">*</span>
                    ) : (
                      <span className="text-xs font-normal text-[#999] ml-2">(留空则不修改密码)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={formMode === 'add' ? '至少6位字符' : '留空则不修改密码'}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm placeholder:text-[#aaa] bg-white text-[#1a1a1a] transition-all duration-200 focus:outline-none ${
                        formErrors.password
                          ? 'border-[#ff4d4f] focus:border-[#ff4d4f] shadow-[0_0_0_2px_rgba(255,77,79,0.15)]'
                          : 'border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.password && (
                    <p className="text-xs text-[#ff4d4f]">{formErrors.password}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#333]">
                    确认密码{' '}
                    {formMode === 'add' ? (
                      <span className="text-[#e74c3c] ml-1">*</span>
                    ) : (
                      <span className="text-xs font-normal text-[#999] ml-2">(填写密码时才需确认)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="请再次输入密码"
                      disabled={formMode === 'edit' && !formData.password}
                      className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm placeholder:text-[#aaa] transition-all duration-200 focus:outline-none ${
                        formMode === 'edit' && !formData.password ? 'bg-[#f5f5f5] text-[#999] cursor-not-allowed border-[#d9d9d9]' : 'bg-white text-[#1a1a1a]'
                      } ${
                        formErrors.confirmPassword
                          ? 'border-[#ff4d4f] focus:border-[#ff4d4f] shadow-[0_0_0_2px_rgba(255,77,79,0.15)]'
                          : formMode === 'edit' && !formData.password ? '' : 'border-[#d9d9d9] focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={formMode === 'edit' && !formData.password}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666] disabled:opacity-30 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formErrors.confirmPassword && (
                    <p className="text-xs text-[#ff4d4f]">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-[#e8e8e8] flex justify-end gap-3 bg-[#fafafa]">
              <button
                onClick={() => setShowFormModal(false)}
                className="px-5 py-2.5 border border-[#d9d9d9] rounded-lg text-sm font-medium text-[#666] hover:text-[#1a1a1a] hover:border-[#1890ff] bg-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleFormSubmit}
                disabled={formSubmitting}
                className="px-5 py-2.5 bg-[#1890ff] text-white text-sm font-semibold rounded-lg hover:bg-[#40a9ff] hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1890ff] disabled:hover:shadow-none flex items-center gap-2"
              >
                {formSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {formSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Delete Confirmation Modal ═══════════════════════ */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-[#1a1a1a] mb-2">确认删除该员工？</h3>
              <p className="text-sm text-[#666] leading-relaxed">
                您确定要删除 <span className="font-semibold text-[#1a1a1a]">{deletingUser.username}</span> 吗？此操作不可撤销。
              </p>
            </div>
            <div className="px-8 pb-8 flex justify-center gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2.5 border border-[#d9d9d9] rounded-lg text-sm font-medium text-[#666] hover:text-[#1a1a1a] hover:border-[#1890ff] bg-white transition-all"
              >
                取消
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteSubmitting}
                className="px-6 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500 disabled:hover:shadow-none flex items-center gap-2"
              >
                {deleteSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {deleteSubmitting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Payment Config Modal ═══════════════════════ */}
      {showPaymentConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start px-8 pt-8 pb-5 flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-semibold text-[#1a1a1a] leading-tight">支付配置</h3>
                  {paymentCfgConfigured && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                      <Check className="w-3 h-3" />已配置
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#666]">配置微信支付与支付宝商户参数</p>
              </div>
              <button
                onClick={() => { setShowPaymentConfig(false); setShowPaymentSecrets({}); }}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-8 pb-8 space-y-5 overflow-y-auto flex-1">
              {paymentCfgLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-7 h-7 animate-spin text-[#1890ff]" />
                  <span className="text-sm text-[#666]">加载配置中...</span>
                </div>
              ) : (
                <>
                  {/* ── 微信支付 ── */}
                  <div className="rounded-xl border border-[#e8e8e8] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#e8e8e8] bg-[#fafafa]">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-green-500 text-white shadow-sm shadow-green-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">微信支付</span>
                      <span className="text-xs text-[#999] ml-auto">WeChat Pay V3</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {/* APP ID */}
                        <div className="space-y-2">
                          <label className="text-sm text-[#666] font-medium">
                            APP ID <span className="text-[#e74c3c] ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            value={paymentCfgForm.wechatAppId}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatAppId: e.target.value })}
                            placeholder="wx1234567890abcdef"
                            className="w-full px-3 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                        </div>
                        {/* 商户号 */}
                        <div className="space-y-2">
                          <label className="text-sm text-[#666] font-medium">
                            商户号 <span className="text-[#e74c3c] ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            value={paymentCfgForm.wechatMchId}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatMchId: e.target.value })}
                            placeholder="1234567890"
                            className="w-full px-3 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 证书序列号 */}
                        <div className="space-y-2">
                          <label className="text-sm text-[#666] font-medium">
                            证书序列号 <span className="text-[#e74c3c] ml-0.5">*</span>
                          </label>
                          <input
                            type="text"
                            value={paymentCfgForm.wechatCertSerialNo}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatCertSerialNo: e.target.value })}
                            placeholder="证书序列号"
                            className="w-full px-3 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                        </div>
                        {/* API V3 密钥 */}
                        <div className="space-y-2">
                          <label className="text-sm text-[#666] font-medium flex items-center gap-1.5">
                            API V3 密钥 <span className="text-[#e74c3c]">*</span>
                            <Lock className="w-3.5 h-3.5 text-[#e74c3c]" />
                          </label>
                          <div className="relative">
                            <input
                              type={showPaymentSecrets['wechatApiV3Key'] ? 'text' : 'password'}
                              value={paymentCfgForm.wechatApiV3Key}
                              onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatApiV3Key: e.target.value })}
                              placeholder="32位密钥"
                              className="w-full px-3 py-3 pr-11 border border-[#d9d9d9] rounded-lg text-sm font-mono text-[#1a1a1a] bg-[#fffbe6] placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                            />
                            <button
                              type="button"
                              onClick={() => togglePaymentSecret('wechatApiV3Key')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md text-[#999] hover:text-[#666] hover:bg-black/5 transition-all"
                              title={showPaymentSecrets['wechatApiV3Key'] ? '隐藏' : '显示'}
                            >
                              {showPaymentSecrets['wechatApiV3Key'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* 商户私钥 */}
                      <div className="space-y-2">
                        <label className="text-sm text-[#666] font-medium flex items-center gap-1.5">
                          商户私钥 (PEM) <span className="text-[#e74c3c]">*</span>
                          <Lock className="w-3.5 h-3.5 text-[#e74c3c]" />
                          <span className="font-normal text-[#999] ml-auto text-xs">粘贴完整 PEM 内容</span>
                        </label>
                        <div className="relative">
                          <textarea
                            value={paymentCfgForm.wechatPrivateKey}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatPrivateKey: e.target.value })}
                            placeholder={'-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'}
                            rows={3}
                            style={showPaymentSecrets['wechatPrivateKey'] ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
                            className="w-full px-3 py-3 pr-11 border border-[#d9d9d9] rounded-lg text-xs font-mono text-[#1a1a1a] leading-relaxed bg-[#fffbe6] placeholder:text-[#bfbfbf] resize-none transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                          <button
                            type="button"
                            onClick={() => togglePaymentSecret('wechatPrivateKey')}
                            className="absolute right-2.5 top-2.5 flex items-center justify-center w-7 h-7 rounded-md text-[#999] hover:text-[#666] hover:bg-black/5 transition-all"
                            title={showPaymentSecrets['wechatPrivateKey'] ? '隐藏' : '显示'}
                          >
                            {showPaymentSecrets['wechatPrivateKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* 回调地址 */}
                      <div className="space-y-2">
                        <label className="text-sm text-[#666] font-medium">
                          支付回调地址 <span className="text-[#999] font-normal text-xs">(选填)</span>
                        </label>
                        <input
                          type="text"
                          value={paymentCfgForm.wechatNotifyUrl}
                          onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, wechatNotifyUrl: e.target.value })}
                          placeholder="https://your-domain.com/api/payment/notify"
                          className="w-full px-3 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── 支付宝 ── */}
                  <div className="rounded-xl border border-[#e8e8e8] bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[#e8e8e8] bg-[#fafafa]">
                      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-500 text-white shadow-sm shadow-blue-200">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                      </div>
                      <span className="text-sm font-semibold text-[#1a1a1a]">支付宝</span>
                      <span className="text-xs text-[#999] ml-auto">Alipay</span>
                    </div>
                    <div className="p-5 space-y-4">
                      {/* APP ID */}
                      <div className="space-y-2 max-w-sm">
                        <label className="text-sm text-[#666] font-medium">
                          APP ID <span className="text-[#e74c3c] ml-0.5">*</span>
                        </label>
                        <input
                          type="text"
                          value={paymentCfgForm.alipayAppId}
                          onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, alipayAppId: e.target.value })}
                          placeholder="2021xxxxxxxxxxxx"
                          className="w-full px-3 py-3 border border-[#d9d9d9] rounded-lg text-sm text-[#1a1a1a] bg-white placeholder:text-[#bfbfbf] transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                        />
                      </div>
                      {/* 应用私钥 */}
                      <div className="space-y-2">
                        <label className="text-sm text-[#666] font-medium flex items-center gap-1.5">
                          应用私钥 (PEM) <span className="text-[#e74c3c]">*</span>
                          <Lock className="w-3.5 h-3.5 text-[#e74c3c]" />
                          <span className="font-normal text-[#999] ml-auto text-xs">粘贴完整 PEM 内容</span>
                        </label>
                        <div className="relative">
                          <textarea
                            value={paymentCfgForm.alipayPrivateKey}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, alipayPrivateKey: e.target.value })}
                            placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
                            rows={3}
                            style={showPaymentSecrets['alipayPrivateKey'] ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
                            className="w-full px-3 py-3 pr-11 border border-[#d9d9d9] rounded-lg text-xs font-mono text-[#1a1a1a] leading-relaxed bg-[#fffbe6] placeholder:text-[#bfbfbf] resize-none transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                          <button
                            type="button"
                            onClick={() => togglePaymentSecret('alipayPrivateKey')}
                            className="absolute right-2.5 top-2.5 flex items-center justify-center w-7 h-7 rounded-md text-[#999] hover:text-[#666] hover:bg-black/5 transition-all"
                            title={showPaymentSecrets['alipayPrivateKey'] ? '隐藏' : '显示'}
                          >
                            {showPaymentSecrets['alipayPrivateKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      {/* 支付宝公钥 */}
                      <div className="space-y-2">
                        <label className="text-sm text-[#666] font-medium flex items-center gap-1.5">
                          支付宝公钥 (PEM) <span className="text-[#e74c3c]">*</span>
                          <Lock className="w-3.5 h-3.5 text-[#e74c3c]" />
                          <span className="font-normal text-[#999] ml-auto text-xs">粘贴完整 PEM 内容</span>
                        </label>
                        <div className="relative">
                          <textarea
                            value={paymentCfgForm.alipayPublicKey}
                            onChange={(e) => setPaymentCfgForm({ ...paymentCfgForm, alipayPublicKey: e.target.value })}
                            placeholder={'-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----'}
                            rows={3}
                            style={showPaymentSecrets['alipayPublicKey'] ? {} : { WebkitTextSecurity: 'disc' } as React.CSSProperties}
                            className="w-full px-3 py-3 pr-11 border border-[#d9d9d9] rounded-lg text-xs font-mono text-[#1a1a1a] leading-relaxed bg-[#fffbe6] placeholder:text-[#bfbfbf] resize-none transition-all duration-200 focus:outline-none focus:border-[#1890ff] focus:shadow-[0_0_0_2px_rgba(24,144,255,0.15)] hover:border-[#1890ff]/40"
                          />
                          <button
                            type="button"
                            onClick={() => togglePaymentSecret('alipayPublicKey')}
                            className="absolute right-2.5 top-2.5 flex items-center justify-center w-7 h-7 rounded-md text-[#999] hover:text-[#666] hover:bg-black/5 transition-all"
                            title={showPaymentSecrets['alipayPublicKey'] ? '隐藏' : '显示'}
                          >
                            {showPaymentSecrets['alipayPublicKey'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-8 py-4 border-t border-[#e8e8e8] flex justify-between items-center bg-[#fafafa] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#faad14]" />
                <p className="text-xs text-[#999]">DB 配置优先于环境变量，仅超级管理员可修改</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowPaymentConfig(false); setShowPaymentSecrets({}); }}
                  className="px-5 py-2.5 border border-[#d9d9d9] rounded-lg text-sm font-medium text-[#666] hover:text-[#1a1a1a] hover:border-[#1890ff] bg-white transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleSavePaymentConfig}
                  disabled={paymentCfgSaving || paymentCfgLoading}
                  className="px-5 py-2.5 bg-[#1890ff] text-white text-sm font-semibold rounded-lg hover:bg-[#40a9ff] hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1890ff] disabled:hover:shadow-none flex items-center gap-2"
                >
                  {paymentCfgSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {paymentCfgSaving ? '保存中...' : '保存配置'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ Data Report Modal ═══════════════════════ */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-[90vw] h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-[#1E2A4A] shadow-2xl shadow-black/40"
            style={{ background: 'linear-gradient(135deg, #0A0E27 0%, #0D132E 40%, #0F1A3A 100%)' }}
          >
            {/* ══ Header ══ */}
            <div className="px-6 py-2 border-b border-[#1E2A4A] flex items-center justify-between flex-shrink-0 bg-[#0D132E]/80 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-[#00E5FF] to-[#2979FF] shadow-[0_0_12px_rgba(0,229,255,0.4)]" />
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">DATA DASHBOARD</h3>
                    <p className="text-xs text-[#5A6988] tracking-widest uppercase mt-0.5">Real-time Analytics</p>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 pl-4 border-l border-[#1E2A4A]">
                  {['营收趋势', '渠道对比', '等级分布', '多维指标', '消费频次', '转化漏斗', '地域分布', 'Top10'].map((label) => (
                    <span key={label} className="px-2.5 py-1 text-[10px] text-[#5A6988] bg-[#111633] border border-[#1E2A4A] rounded-full">
                      {label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E676] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E676]" />
                  </span>
                  <span className="text-[10px] text-[#00E676] font-mono tracking-wider">LIVE</span>
                </div>
                <button
                  onClick={() => { setShowReport(false); setReportData(null); }}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[#5A6988] hover:text-white hover:bg-[#1E2A4A] transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ══ Content ══ */}
            <div className="flex-1 px-4 py-3 custom-scrollbar">
              {reportLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin text-[#00E5FF] mx-auto" />
                      <div className="absolute inset-0 w-12 h-12 mx-auto rounded-full border border-[#1E2A4A] animate-pulse" />
                    </div>
                    <p className="text-[#5A6988] text-sm mt-4 tracking-wider">LOADING ANALYTICS...</p>
                  </div>
                </div>
              ) : !reportData ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-[#1E2A4A] mx-auto mb-4" />
                    <p className="text-[#5A6988] text-sm">暂无数据</p>
                    <button
                      onClick={handleOpenReport}
                      className="mt-3 px-5 py-2 text-xs font-medium text-[#00E5FF] bg-[#111633] border border-[#1E2A4A] hover:border-[#00E5FF]/50 hover:bg-[#0D132E] rounded-lg transition-all"
                    >
                      RETRY
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ══ Row 1: 趋势变化(8) + 会员等级(4) ══ */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* 趋势变化 */}
                    <div className="col-span-12 lg:col-span-8 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#2979FF]/40 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00E5FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                              <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-white">趋势变化</h4>
                              <p className="text-[10px] text-[#5A6988]">营收 / 订单趋势</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-[#5A6988]">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00E5FF]" />营收</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF9100]" />订单</span>
                          </div>
                        </div>
                        {reportCharts?.revenueTrend && (
                          <ReactECharts option={reportCharts.revenueTrend} style={{ height: 155 }} notMerge lazyUpdate />
                        )}
                      </div>
                    </div>

                    {/* 占比分析 - 会员等级 */}
                    <div className="col-span-12 lg:col-span-4 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#B388FF]/40 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[#B388FF]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                            <svg className="w-4 h-4 text-[#B388FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="8" r="4"/><path d="M12 12c-4 0-8 2-8 6h16c0-4-4-6-8-6z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">占比分析</h4>
                            <p className="text-[10px] text-[#5A6988]">会员等级分布</p>
                          </div>
                        </div>
                        {reportCharts?.memberTiers && (
                          <ReactECharts option={reportCharts.memberTiers} style={{ height: 155 }} notMerge lazyUpdate />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ══ Row 2: 各渠道订单(4) + 多维度对比(4) + 消费频次(4) ══ */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* 对比分析 - 各渠道订单 */}
                    <div className="col-span-12 md:col-span-4 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#2979FF]/40 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                          <BarChart3 className="w-4 h-4 text-[#2979FF]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">对比分析</h4>
                          <p className="text-[10px] text-[#5A6988]">各渠道订单</p>
                        </div>
                      </div>
                      {reportCharts?.channelOrders && (
                        <ReactECharts option={reportCharts.channelOrders} style={{ height: 140 }} notMerge lazyUpdate />
                      )}
                    </div>

                    {/* 多维度对比 */}
                    <div className="col-span-12 md:col-span-4 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#00E5FF]/40 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#00E5FF]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">多维度对比</h4>
                          <p className="text-[10px] text-[#5A6988]">营收 vs 充值</p>
                        </div>
                      </div>
                      {reportCharts?.multiMetric && (
                        <ReactECharts option={reportCharts.multiMetric} style={{ height: 140 }} notMerge lazyUpdate />
                      )}
                    </div>

                    {/* 数据分布 - 消费频次 */}
                    <div className="col-span-12 md:col-span-4 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#FF9100]/40 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-0.5">
                        <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                          <Activity className="w-4 h-4 text-[#FF9100]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">数据分布</h4>
                          <p className="text-[10px] text-[#5A6988]">消费频次直方图</p>
                        </div>
                      </div>
                      {reportCharts?.activity && (
                        <ReactECharts option={reportCharts.activity} style={{ height: 140 }} notMerge lazyUpdate />
                      )}
                    </div>
                  </div>

                  {/* ══ Row 3: 转化漏斗(6) + 地域分布(6) ══ */}
                  <div className="grid grid-cols-12 gap-3">
                    {/* 转化漏斗 */}
                    <div className="col-span-12 lg:col-span-6 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#FF4081]/40 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#FF4081]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 3l-8 8-3-3-7 7"/><path d="M15 3h6v6"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">转化漏斗</h4>
                          <p className="text-[10px] text-[#5A6988]">注册 → 消费 → 复购</p>
                        </div>
                      </div>
                      {reportCharts?.funnel && (
                        <ReactECharts option={reportCharts.funnel} style={{ height: 140 }} notMerge lazyUpdate />
                      )}
                    </div>

                    {/* 地域分布 */}
                    <div className="col-span-12 lg:col-span-6 bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#00E676]/40 transition-all duration-300">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                          <svg className="w-4 h-4 text-[#00E676]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">地域分布</h4>
                          <p className="text-[10px] text-[#5A6988]">渠道 → 区域热力图</p>
                        </div>
                      </div>
                      {reportCharts?.region && (
                        <ReactECharts option={reportCharts.region} style={{ height: 140 }} notMerge lazyUpdate />
                      )}
                    </div>
                  </div>

                  {/* ══ Row 4: Top10 排行榜 ══ */}
                  <div className="bg-[#0D132E] rounded-xl border border-[#1E2A4A] p-3 hover:border-[#FFD740]/40 transition-all duration-300">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-[#111633] border border-[#1E2A4A] flex items-center justify-center">
                        <svg className="w-4 h-4 text-[#FFD740]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/>
                          <path d="M10 22V8h4v14"/><rect x="2" y="18" width="20" height="4" rx="1"/>
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">排名</h4>
                        <p className="text-[10px] text-[#5A6988]">Top10 消费会员</p>
                      </div>
                      <div className="ml-auto text-[10px] text-[#5A6988]">
                        共 {reportData.top10Members.length} 条
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#1E2A4A]">
                            <th className="text-left py-1 px-3 text-[10px] text-[#5A6988] font-medium uppercase tracking-wider w-12">#</th>
                            <th className="text-left py-1 px-3 text-[10px] text-[#5A6988] font-medium uppercase tracking-wider">会员</th>
                            <th className="text-left py-1 px-3 text-[10px] text-[#5A6988] font-medium uppercase tracking-wider">手机号</th>
                            <th className="text-right py-1 px-3 text-[10px] text-[#5A6988] font-medium uppercase tracking-wider">交易笔数</th>
                            <th className="text-right py-1 px-3 text-[10px] text-[#5A6988] font-medium uppercase tracking-wider">消费总额</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.top10Members.map((m) => (
                            <tr key={m.id} className="border-b border-[#111633] hover:bg-[#111633]/60 transition-colors group">
                              <td className="py-1 px-3">
                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${
                                  m.rank <= 3
                                    ? 'bg-gradient-to-br from-[#FFD740] to-[#FF9100] text-black'
                                    : 'bg-[#111633] text-[#5A6988] border border-[#1E2A4A]'
                                }`}>
                                  {m.rank}
                                </span>
                              </td>
                              <td className="py-1 px-3">
                                <span className="text-[#A8B5D0] group-hover:text-white transition-colors font-medium">
                                  {m.name}
                                </span>
                              </td>
                              <td className="py-1 px-3">
                                <code className="text-[11px] text-[#5A6988] bg-[#0A0E27] px-2 py-0.5 rounded border border-[#1E2A4A]">
                                  {m.phone}
                                </code>
                              </td>
                              <td className="py-1 px-3 text-right">
                                <span className="text-[#A8B5D0] font-mono text-xs">{m.txnCount} 笔</span>
                              </td>
                              <td className="py-1 px-3 text-right">
                                <span className="text-[#00E5FF] font-mono font-semibold">
                                  ¥{m.totalSpent.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ══ Footer ══ */}
            <div className="px-4 py-1.5 border-t border-[#1E2A4A] flex items-center justify-between flex-shrink-0 bg-[#0D132E]/80">
              <span className="text-[10px] text-[#5A6988] tracking-wider">POWERED BY ECHARTS · REAL-TIME DATA</span>
              <span className="text-[10px] text-[#3A4A6A] tracking-wider font-mono">
                {new Date().toISOString().replace('T', ' ').substring(0, 19)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
