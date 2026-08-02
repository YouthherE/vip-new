'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Shield, Activity, Globe } from 'lucide-react';

import Link from 'next/link';

import api from '@/lib/axios';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      const response = await api.post('/auth/login', {
        username,
        password
      });

      if (response.data.code === 200) {
        // Store token and user info
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        router.push('/');
      } else {
        setErrorMsg(response.data.message || 'Login failed');
      }
    } catch (err: any) {
        console.error(err);
        setErrorMsg(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
        {/* Left Side - Rendering/Brand Area */}
        <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-between p-12 relative overflow-hidden">
            {/* Abstract Background Pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-slate-800 via-black to-black"></div>
                <svg className="absolute top-0 right-0 text-slate-800 w-1/2 h-full opacity-30 transform translate-x-1/3" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L100 0 L100 100 Z" fill="currentColor" />
                </svg>
            </div>

            {/* Logo/Brand */}
            <div className="relative z-10 flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-black font-bold text-lg">V</span>
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold tracking-tight">VIP 管理系统</span>
                    <span className="text-xs font-medium text-slate-400">单用户版</span>
                </div>
            </div>

            {/* Content/Illustration Placeholder */}
            <div className="relative z-10 space-y-8">
                <div className="space-y-4">
                    <h2 className="text-4xl font-bold leading-tight">
                        专业的会员管理<br/>与数据分析平台
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md">
                        高效管理会员信息、精准追踪交易流水，助您洞察业务增长趋势。
                    </p>
                </div>

                {/* Feature Pills */}
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm">安全可靠</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                        <Activity className="w-4 h-4" />
                        <span className="text-sm">实时数据</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/10">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">云端同步</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 text-sm text-slate-500">
                © 2024 VIP Management System. All rights reserved.
            </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
            <div className="max-w-md w-full">
                <div className="text-center mb-10">
                    <div className="lg:hidden w-12 h-12 bg-black rounded-xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-slate-200">
                        <span className="text-white text-xl font-bold">V</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">欢迎回来</h1>
                    <p className="text-slate-500 mt-2">请登录您的账号以继续</p>
                </div>

                {errorMsg && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">用户名</label>
                        <div className="relative group">
                            <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-black" />
                            <input 
                                name="username"
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-slate-800 placeholder:text-slate-400"
                                placeholder="请输入您的用户名"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-slate-700">密码</label>
                            <a href="#" className="text-xs text-slate-500 hover:text-black font-medium transition-colors">忘记密码？</a>
                        </div>
                        <div className="relative group">
                            <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-black" />
                            <input 
                                name="password"
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-slate-800 placeholder:text-slate-400"
                                placeholder="请输入您的密码"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-black focus:ring-black/20" />
                            <span className="text-sm text-slate-500 group-hover:text-slate-700 transition-colors">记住我</span>
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-black hover:bg-slate-800 text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                登录
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-slate-500">
                    还没有账号？ 
                    <Link href="/register" className="text-black hover:text-slate-700 font-bold ml-1 hover:underline underline-offset-4">立即注册</Link>
                </div>
            </div>
        </div>
    </div>
  );
}
