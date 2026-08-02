'use client';

import { useState, useEffect } from 'react';
import { Camera, Save, X, Edit2, User, Lock } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

export default function ProfilePage() {
  const notify = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
    password: '',
    confirmPassword: ''
  });

  const [savedData, setSavedData] = useState({ ...formData });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load user info from localStorage on mount
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setFormData(prev => ({ ...prev, username: user.username || '' }));
        setSavedData(prev => ({ ...prev, username: user.username || '' }));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Validation
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
      const payload: any = {
        username: formData.username
      };
      
      if (formData.password) {
        payload.password = formData.password;
      }

      const response = await api.put('/user/profile', payload);

      if (response.data.code === 200) {
        const updatedUser = response.data.data;
        
        // Update local state
        setSavedData({ ...formData, password: '', confirmPassword: '' });
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        setIsEditing(false);
        
        // Update localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const newUser = { ...user, ...updatedUser };
            localStorage.setItem('user', JSON.stringify(newUser));
        }
        
        notify.success('个人信息更新成功');
      } else {
        notify.error(response.data.message || '更新失败');
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      notify.error(error.response?.data?.message || '更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...savedData, password: '', confirmPassword: '' });
    setIsEditing(false);
  };

  return (
    <div className="p-6 w-full max-w-[1000px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">个人信息</h2>
            <p className="text-slate-500 text-sm mt-1">管理您的个人资料和账户安全设置</p>
        </div>
        {!isEditing ? (
            <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
            >
                <Edit2 className="w-4 h-4" />
                <span>编辑资料</span>
            </button>
        ) : (
            <div className="flex gap-3">
                <button 
                    onClick={handleCancel}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <X className="w-4 h-4" />
                    <span>取消</span>
                </button>
                <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>保存中...</span>
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            <span>保存更改</span>
                        </>
                    )}
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column - Avatar */}
        <div className="md:col-span-1">
            <div className="glass-card bg-white p-8 rounded-3xl flex flex-col items-center text-center">
                <div className="relative group w-32 h-32 mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-50 shadow-inner">
                        <img 
                            src={formData.avatar} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {isEditing && (
                        <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                            <Camera className="w-8 h-8" />
                        </button>
                    )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-1">{savedData.username}</h3>
                
                <div className="w-full pt-6 border-t border-slate-100 flex justify-between text-sm">
                    <div className="text-center flex-1 border-r border-slate-100">
                        <div className="font-bold text-slate-800">12</div>
                        <div className="text-slate-400 text-xs">项目</div>
                    </div>
                    <div className="text-center flex-1">
                        <div className="font-bold text-slate-800">85%</div>
                        <div className="text-slate-400 text-xs">效率</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column - Form */}
        <div className="md:col-span-2">
            <div className="glass-card bg-white p-8 rounded-3xl space-y-8">
                {/* Basic Info */}
                <section>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">基本信息</h4>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                用户名
                            </label>
                            {isEditing ? (
                                <input 
                                    type="text" 
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                />
                            ) : (
                                <div className="text-slate-800 px-4 py-2 bg-slate-50/50 rounded-xl border border-transparent">
                                    {savedData.username}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="w-full h-px bg-slate-100"></div>

                {/* Security */}
                <section>
                    <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">安全设置</h4>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-slate-400" />
                                密码
                            </label>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        type="password" 
                                        name="password"
                                        placeholder="新密码"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                    <input 
                                        type="password" 
                                        name="confirmPassword"
                                        placeholder="确认新密码"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            ) : (
                                <div className="text-slate-800 px-4 py-2 bg-slate-50/50 rounded-xl border border-transparent tracking-widest">
                                    ••••••••••••
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
      </div>
    </div>
  );
}
