'use client';

import { useState, useEffect } from 'react';
import { Camera, Save, X, Edit2, Users, Clock, Target, Phone, Mail, MapPin, Calendar, Shield, FileText, User, Lock } from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

type TabType = 'basic' | 'security' | 'logs';

const TABS: { key: TabType; label: string; icon: string; IconComponent: React.ComponentType<{ className?: string }> }[] = [
  { key: 'basic', label: '基本资料', icon: '📝', IconComponent: FileText },
  { key: 'security', label: '安全设置', icon: '🔒', IconComponent: Shield },
  { key: 'logs', label: '操作日志', icon: '📋', IconComponent: FileText },
];

export default function ProfilePage() {
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>({});
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    avatar: '',
    password: '',
    confirmPassword: ''
  });
  const [savedData, setSavedData] = useState({ ...formData });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeRate: 0,
    tenure: ''
  });
  const [lastLogin, setLastLogin] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserData(user);

        const avatar = user.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(user.username || 'Starlight')}&backgroundColor=ffdfbf`;
        const defaults = {
          username: user.username || '',
          email: user.email || '',
          phone: user.phone || '',
          address: user.address || '',
          bio: user.bio || '',
          avatar,
          password: '',
          confirmPassword: ''
        };
        setFormData(defaults);
        setSavedData(defaults);

        // Calculate tenure from created_at
        if (user.created_at) {
          const created = new Date(user.created_at);
          const now = new Date();
          const diffMs = now.getTime() - created.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffYears = Math.floor(diffDays / 365);
          const diffMonths = Math.floor((diffDays % 365) / 30);

          if (diffYears > 0) {
            setStats(prev => ({ ...prev, tenure: `${diffYears}年${diffMonths}个月` }));
          } else if (diffMonths > 0) {
            setStats(prev => ({ ...prev, tenure: `${diffMonths}个月` }));
          } else {
            setStats(prev => ({ ...prev, tenure: `${Math.max(diffDays, 1)}天` }));
          }
        }

        // Try to get last login from localStorage
        const lastLoginStr = localStorage.getItem('lastLogin');
        if (lastLoginStr) {
          setLastLogin(lastLoginStr);
        } else if (user.updated_at) {
          setLastLogin(user.updated_at);
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }

    fetchStats();
    fetchLatestProfile();
  }, []);

  // 从服务端获取最新的用户资料（管理员可能已修改该用户信息）
  const fetchLatestProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json()) as { code?: number; data?: any };
      if (res.ok && json.code === 200 && json.data) {
        const fresh = json.data;
        // 不将敏感字段写回 localStorage
        const { phone, email, ...safeFresh } = fresh;
        localStorage.setItem('user', JSON.stringify(safeFresh));
        setUserData(fresh);
        
        const avatar = fresh.avatar || `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(fresh.username || 'Starlight')}&backgroundColor=ffdfbf`;
        const updatedDefaults = {
          username: fresh.username || '',
          email: fresh.email || '',
          phone: fresh.phone || '',
          address: fresh.address || '',
          bio: fresh.bio || '',
          avatar,
          password: '',
          confirmPassword: ''
        };
        setFormData(updatedDefaults);
        setSavedData(updatedDefaults);
      }
    } catch (_) {
      // 失败则继续使用 localStorage 中的旧数据
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      if (response.data.code === 200) {
        const { totalMembers, activeRate } = response.data.data.summary;
        setStats(prev => ({ ...prev, totalMembers: totalMembers || 0, activeRate: activeRate || 0 }));
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      notify.error('用户名不能为空');
      return;
    }

    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        notify.error('两次输入的密码不一致');
        return;
      }
      if (formData.password.length < 6) {
        notify.error('密码长度不能少于6位');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: { username: string; password?: string; phone?: string; address?: string; email?: string; bio?: string } = { username: formData.username };

      if (formData.password) {
        payload.password = formData.password;
      }

      // Include extended fields
      if (formData.email !== savedData.email) payload.email = formData.email;
      if (formData.phone !== savedData.phone) payload.phone = formData.phone;
      if (formData.address !== savedData.address) payload.address = formData.address;
      if (formData.bio !== savedData.bio) payload.bio = formData.bio;

      const response = await api.put('/user/profile', payload);

      if (response.data.code === 200) {
        const updatedUser = response.data.data;

        // Merge and update saved data
        const newSaved = {
          ...savedData,
          username: updatedUser.username || formData.username,
          email: updatedUser.email ?? formData.email,
          phone: updatedUser.phone ?? formData.phone,
          address: updatedUser.address ?? formData.address,
          bio: updatedUser.bio ?? formData.bio,
          avatar: updatedUser.avatar ?? formData.avatar,
          password: '',
          confirmPassword: ''
        };
        setSavedData(newSaved);
        setFormData(newSaved);
        setIsEditing(false);

        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const newUser = { ...user, ...updatedUser };
          localStorage.setItem('user', JSON.stringify(newUser));
        }

        // Update lastLogin
        const now = new Date().toLocaleString('zh-CN');
        localStorage.setItem('lastLogin', now);
        setLastLogin(now);

        notify.success('个人信息更新成功');
      } else {
        notify.error(response.data.message || '更新失败');
      }
    } catch (error: unknown) {
      console.error('Update profile error:', error);
      const err = error as { response?: { data?: { message?: string } } };
      notify.error(err.response?.data?.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...savedData, password: '', confirmPassword: '' });
    setIsEditing(false);
    setActiveTab('basic');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: number | string) => {
    if (status === 1 || status === 'active') {
      return { label: '在线', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' };
    }
    return { label: '离线', color: 'bg-surface-2 text-ink-2 border-border-strong', dot: 'bg-ink-3' };
  };

  const statusBadge = getStatusBadge(userData.status);

  return (
    <div className="p-6 w-full max-w-[1100px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-ink">个人信息</h2>
        <p className="text-ink-2 text-sm mt-1">管理您的个人资料和账户安全设置</p>
      </div>

      {/* Main Card - Two Column Layout */}
      <div className="flex flex-col lg:flex-row rounded-3xl overflow-hidden shadow-soft bg-surface border border-border">

        {/* ==================== LEFT PANEL ==================== */}
        <div className="w-full lg:w-[280px] flex-shrink-0 bg-gradient-to-b from-surface-2 to-surface p-6 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-border">

          {/* Avatar Section */}
          <div className="relative group mb-5">
            <div className="w-28 h-28 rounded-2xl overflow-hidden border-4 border-surface shadow-lg shadow-brand">
              <img
                src={formData.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            {isEditing && (
              <button className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                <Camera className="w-8 h-8" />
              </button>
            )}
          </div>

          {/* Username */}
          <h3 className="text-lg font-bold text-ink mb-1">
            {savedData.username || '未设置'}
          </h3>

          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusBadge.color} mb-5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
            {statusBadge.label}
          </span>

          {/* Divider */}
          <div className="w-full h-px bg-surface-2 mb-5"></div>

          {/* Stats Cards */}
          <div className="w-full space-y-3">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-brand-600" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-ink leading-tight">
                  {stats.totalMembers.toLocaleString()}
                </div>
                <div className="text-xs text-ink-3">管理会员</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-ink leading-tight">
                  {stats.tenure || '--'}
                </div>
                <div className="text-xs text-ink-3">在职时长</div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface border border-border shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <div className="text-lg font-bold text-ink leading-tight">
                  {stats.activeRate}%
                </div>
                <div className="text-xs text-ink-3">会员活跃率</div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== RIGHT PANEL ==================== */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Tab Navigation */}
          <div className="flex border-b border-border px-4 sm:px-6">
            {TABS.map((tab) => {
              const TabIcon = tab.IconComponent;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium relative transition-colors cursor-pointer
                    ${activeTab === tab.key
                      ? 'text-brand-700'
                      : 'text-ink-2 hover:text-ink'
                    }`}
                >
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {/* Active indicator */}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-6">

            {/* ===== 基本资料 Tab ===== */}
            {activeTab === 'basic' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Header name (large, like docx) */}
                <div>
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">管理员账号</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="text-xl font-bold text-ink w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-ink">{savedData.username}</h3>
                      <p className="text-sm text-ink-3 mt-1 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" />
                        管理员账号
                      </p>
                    </>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-surface-2"></div>

                {/* Field Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  {/* Email */}
                  <FieldItem
                    label="邮 箱"
                    icon={<Mail className="w-4 h-4" />}
                    name="email"
                    value={formData.email}
                    savedValue={savedData.email}
                    isEditing={isEditing}
                    placeholder="未设置"
                    onChange={handleInputChange}
                  />

                  {/* Phone */}
                  <FieldItem
                    label="手 机 号"
                    icon={<Phone className="w-4 h-4" />}
                    name="phone"
                    value={formData.phone}
                    savedValue={savedData.phone}
                    isEditing={isEditing}
                    placeholder="未设置"
                    onChange={handleInputChange}
                  />

                  {/* Address */}
                  <FieldItem
                    label="地 址"
                    icon={<MapPin className="w-4 h-4" />}
                    name="address"
                    value={formData.address}
                    savedValue={savedData.address}
                    isEditing={isEditing}
                    placeholder="未设置"
                    onChange={handleInputChange}
                    span={2}
                  />

                  {/* Created At (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      注册时间
                    </label>
                    <div className="text-sm text-ink px-0 py-1">
                      {formatDate(userData.created_at)}
                    </div>
                  </div>

                  {/* Status (read-only) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      状 态
                    </label>
                    <div className="py-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusBadge.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio / Introduction */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-medium text-ink-3 uppercase tracking-wider">个人简介</label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={2}
                      placeholder="介绍一下自己..."
                      className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm resize-none"
                    />
                  ) : (
                    <div className="text-sm text-ink-2 bg-surface-2/50 rounded-xl px-4 py-2.5 border border-transparent min-h-[2.5rem]">
                      {savedData.bio || '暂无简介'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== 安全设置 Tab ===== */}
            {activeTab === 'security' && (
              <div className="space-y-5 animate-in fade-in duration-200 max-w-lg">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-1">修改密码</h3>
                  <p className="text-sm text-ink-3">建议使用至少6位字符的强密码</p>
                </div>

                <div className="w-full h-px bg-surface-2"></div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        新密码
                      </label>
                      <input
                        type="password"
                        name="password"
                        placeholder="请输入新密码"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        确认新密码
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="请再次输入新密码"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-ink-2">
                      <Lock className="w-4 h-4 text-ink-3" />
                      <span className="text-sm">密码</span>
                    </div>
                    <div className="text-ink-3 tracking-widest text-lg">••••••••••••</div>
                  </div>
                )}
              </div>
            )}

            {/* ===== 操作日志 Tab ===== */}
            {activeTab === 'logs' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <h3 className="text-lg font-semibold text-ink mb-1">操作日志</h3>
                  <p className="text-sm text-ink-3">账户相关的重要操作记录</p>
                </div>

                <div className="w-full h-px bg-surface-2"></div>

                <div className="space-y-3">
                  {/* Log entry 1 - Account created */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm text-ink">账户创建</p>
                      <p className="text-xs text-ink-3 mt-0.5">
                        {userData.created_at ? formatDate(userData.created_at) : '--'}
                      </p>
                    </div>
                  </div>

                  {/* Log entry 2 - Last update */}
                  {userData.updated_at && userData.updated_at !== userData.created_at && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Edit2 className="w-4 h-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm text-ink">信息更新</p>
                        <p className="text-xs text-ink-3 mt-0.5">{formatDate(userData.updated_at)}</p>
                      </div>
                    </div>
                  )}

                  {/* Log entry 3 - Last login (from localStorage) */}
                  {lastLogin && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-sm text-ink">上次登录</p>
                        <p className="text-xs text-ink-3 mt-0.5">{lastLogin}</p>
                      </div>
                    </div>
                  )}

                  {/* Placeholder if no logs */}
                  {!userData.created_at && !userData.updated_at && !lastLogin && (
                    <div className="text-center py-12 text-ink-3">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-ink-3" />
                      <p className="text-sm">暂无操作记录</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ==================== Footer ==================== */}
          <div className="border-t border-border px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Last login info */}
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <Clock className="w-3.5 h-3.5" />
              <span>最后登录：{lastLogin || formatDate(userData.updated_at) || '--'}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-surface border border-border-strong text-ink-2 rounded-xl hover:bg-surface-2 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>取消</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-surface/30 border-t-white rounded-full animate-spin" />
                        <span>保存中...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>💾 保存更改</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand text-sm font-medium cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>编辑资料</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable field display/edit component */
function FieldItem({
  label,
  icon,
  name,
  value,
  savedValue,
  isEditing,
  placeholder = '未设置',
  onChange,
  span = 1,
}: {
  label: string;
  icon: React.ReactNode;
  name: string;
  value: string;
  savedValue: string;
  isEditing: boolean;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  span?: number;
}) {
  const colSpan = span === 2 ? 'sm:col-span-2' : '';

  return (
    <div className={`space-y-1.5 ${colSpan}`}>
      <label className="text-xs font-medium text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
        <span className="flex items-center">{icon}</span>
        {label}
      </label>
      {isEditing ? (
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border-strong focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
        />
      ) : (
        <div className="text-sm text-ink px-0 py-1">
          {savedValue || <span className="text-ink-3">{placeholder}</span>}
        </div>
      )}
    </div>
  );
}
