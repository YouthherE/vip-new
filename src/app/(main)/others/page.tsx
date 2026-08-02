'use client';

import { 
  Bot, 
  Network, 
  Calendar, 
  BarChart3, 
  Settings, 
  FileText,
  Lightbulb,
  Mail
} from 'lucide-react';
import Link from 'next/link';

const applications = [
  {
    id: 'ai-assistant',
    title: 'AI 助手',
    description: '智能对话助手，帮您解答问题、编写代码',
    icon: Bot,
    color: 'bg-purple-100 text-purple-600',
    path: '/ai-assistant'
  },
  {
    id: 'mindmap',
    title: '思维导图',
    description: '可视化思维工具，激发无限创意',
    icon: Network,
    color: 'bg-indigo-100 text-indigo-600',
    path: '/mindmap'
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

export default function OthersPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">其它应用</h1>
        <p className="text-slate-500 mt-2">探索更多实用工具，提升工作效率</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {applications.map((app) => (
          <Link 
            href={app.path} 
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
        ))}
      </div>
    </div>
  );
}
