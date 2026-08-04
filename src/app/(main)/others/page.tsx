'use client';

import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';

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
    color: 'bg-indigo-100 text-indigo-600',
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
    color: 'bg-slate-100 text-slate-600',
    path: '/settings'
  }
];

interface StaffUser {
  id: number;
  username: string;
  avatar: string | null;
  status: number;
  created_at: string;
}

export default function OthersPage() {
  const [showAiChat, setShowAiChat] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);

  const fetchStaffUsers = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.code === 200) {
        setStaffUsers(res.data.data);
      }
    } catch (e) {
      console.error('Failed to fetch users:', e);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleOpenStaff = () => {
    setShowStaff(true);
    fetchStaffUsers();
  };

  // Handle click for special cards
  const handleCardClick = (appId: string) => {
    if (appId === 'ai-assistant') {
      setShowAiChat(true);
    } else if (appId === 'employee-management') {
      handleOpenStaff();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('zh-CN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">其它应用</h1>
        <p className="text-slate-500 mt-2">探索更多实用工具，提升工作效率</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {applications.map((app) => {
          // Cards that open modals
          if (app.id === 'ai-assistant' || app.id === 'employee-management') {
            return (
              <button
                key={app.id}
                onClick={() => handleCardClick(app.id)}
                className="group bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col items-start text-left cursor-pointer"
              >
                <div className={`p-3 rounded-lg mb-4 ${app.color} group-hover:scale-110 transition-transform duration-200`}>
                  <app.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                  {app.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {app.description}
                </p>
              </button>
            );
          }

          // Regular link cards
          return (
            <Link
              href={(app as any).path || '/'}
              key={app.id}
              className="group bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col items-start"
            >
              <div className={`p-3 rounded-lg mb-4 ${app.color} group-hover:scale-110 transition-transform duration-200`}>
                <app.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">
                {app.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {app.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* ──── AI Chat Modal ──── */}
      {showAiChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 text-purple-600">
                  <Bot className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">AI 助手</h3>
              </div>
              <button onClick={() => setShowAiChat(false)} className="text-slate-400 hover:text-slate-600">
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

      {/* ──── Employee Management Modal ──── */}
      {showStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">员工管理</h3>
                <span className="text-xs text-slate-400 ml-2">
                  ({staffUsers.length} 人)
                </span>
              </div>
              <button onClick={() => setShowStaff(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {staffLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : staffUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users className="w-10 h-10 mb-2 text-slate-300" />
                  <p className="text-sm">暂无员工数据</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr className="text-left text-slate-500 text-xs uppercase">
                      <th className="px-5 py-3 font-medium">用户名</th>
                      <th className="px-5 py-3 font-medium">状态</th>
                      <th className="px-5 py-3 font-medium">注册时间</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {staffUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-800">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 1
                              ? 'bg-green-50 text-green-600'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {user.status === 1 ? '正常' : '禁用'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {formatDate(user.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50 flex-shrink-0">
              <button
                onClick={() => setShowStaff(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-white transition-colors text-sm"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
