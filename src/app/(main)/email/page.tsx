'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail, Send, Settings, X, Loader2,
  Search, ChevronLeft, ChevronRight, Star, Trash2,
  RefreshCw, CheckCircle2, AlertTriangle,
  Eye, EyeOff, Paperclip, ArrowLeft,
  Inbox as InboxIcon, Reply,
  Wifi, FileText, ShieldAlert,
} from 'lucide-react';
import api from '@/lib/axios';
import { useToast } from '@/components/ToastProvider';

/** 基础 HTML 消毒：移除 script/iframe/object/embed 标签及事件处理器 */
function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*\/?>/gi, '')
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<script\b[^<]*\/?>/gi, '');
}

// ═══════════════════ Types ═══════════════════

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: number;
  smtp_user: string;
  smtp_pass: string;
  imap_host: string;
  imap_port: number;
  imap_secure: number;
  imap_user: string;
  imap_pass: string;
  from_name: string;
  from_address: string;
  reply_to: string;
  signature: string;
  use_mailchannels: number;
  status: string;
}

interface InboxEmail {
  id: number;
  message_uid: string;
  message_id: string;
  from_address: string;
  from_name: string;
  to_address: string;
  subject: string;
  body_text: string;
  body_html: string;
  has_attachment: number;
  is_read: number;
  is_starred: number;
  is_deleted: number;
  received_at: string;
  created_at: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ═══════════════════ Constants ═══════════════════

const TABS = [
  { id: 'compose', label: '写邮件', icon: Send },
  { id: 'inbox', label: '收件箱', icon: InboxIcon },
] as const;

type TabId = typeof TABS[number]['id'];

const INITIAL_CONFIG: EmailConfig = {
  smtp_host: '',
  smtp_port: 587,
  smtp_secure: 0,
  smtp_user: '',
  smtp_pass: '',
  imap_host: '',
  imap_port: 993,
  imap_secure: 1,
  imap_user: '',
  imap_pass: '',
  from_name: '星光儿童乐园',
  from_address: '',
  reply_to: '',
  signature: '',
  use_mailchannels: 1,
  status: 'inactive',
};

// ═══════════════════ Component ═══════════════════

export default function EmailPage() {
  const toast = useToast();

  // Tab
  const [activeTab, setActiveTab] = useState<TabId>('compose');

  // Config
  const [config, setConfig] = useState<EmailConfig>({ ...INITIAL_CONFIG });
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showImapPass, setShowImapPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingImap, setTestingImap] = useState(false);

  // Config Modal
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Compose
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  // Inbox
  const [inbox, setInbox] = useState<InboxEmail[]>([]);
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxPagination, setInboxPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [inboxFilter, setInboxFilter] = useState('inbox');
  const [inboxSearch, setInboxSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  // Detail
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);

  // Permission
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      setCanManage(user?.role === 'super_admin' || user?.username === 'admin');
    } catch {
      setCanManage(false);
    }
  }, []);

  // ═══════════════════ Fetch Config ═══════════════════

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await api.get('/settings/email');
      if (res.data.code === 200 && res.data.data) {
        setConfig(res.data.data);
      }
    } catch {
      // ignore
    } finally {
      setConfigLoading(false);
    }
  }, []);

  // ═══════════════════ Open Config Modal ═══════════════════

  const handleOpenConfig = () => {
    if (!canManage) {
      toast.info('仅超级管理员可配置邮箱');
      return;
    }
    setShowConfigModal(true);
    fetchConfig();
    setShowSmtpPass(false);
    setShowImapPass(false);
  };

  // ═══════════════════ Save Config ═══════════════════

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      const res = await api.put('/settings/email', config);
      if (res.data.code === 200) {
        toast.success('邮箱配置保存成功');
        fetchConfig();
      } else {
        toast.error(res.data.message || '保存失败');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '保存失败');
    } finally {
      setConfigSaving(false);
    }
  };

  // ═══════════════════ Test SMTP ═══════════════════

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    try {
      const res = await api.post('/email/test', { type: 'smtp' });
      if (res.data.code === 200) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || 'SMTP 测试失败');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'SMTP 测试失败');
    } finally {
      setTestingSmtp(false);
    }
  };

  // ═══════════════════ Test IMAP ═══════════════════

  const handleTestImap = async () => {
    setTestingImap(true);
    try {
      const res = await api.post('/email/test', { type: 'imap' });
      if (res.data.code === 200) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message || 'IMAP 测试失败');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'IMAP 测试失败');
    } finally {
      setTestingImap(false);
    }
  };

  // ═══════════════════ Send Email ═══════════════════

  const handleSend = async () => {
    if (!composeTo.trim()) {
      toast.error('请输入收件人邮箱');
      return;
    }
    if (!composeSubject.trim()) {
      toast.error('请输入邮件主题');
      return;
    }

    setComposeSending(true);
    try {
      const res = await api.post('/email/send', {
        to: [{ address: composeTo.trim() }],
        subject: composeSubject,
        body: composeBody + (config.signature ? `\n\n---\n${config.signature}` : ''),
      });
      if (res.data.code === 200) {
        toast.success('邮件发送成功');
        setComposeTo('');
        setComposeSubject('');
        setComposeBody('');
      } else {
        toast.error(res.data.message || '发送失败');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '发送失败');
    } finally {
      setComposeSending(false);
    }
  };

  // ═══════════════════ Fetch Inbox ═══════════════════

  const fetchInbox = useCallback(async (page = 1) => {
    setInboxLoading(true);
    try {
      const params: Record<string, string | number> = { page, pageSize: 20, filter: inboxFilter };
      if (inboxSearch) params.search = inboxSearch;

      const res = await api.get('/email/inbox', { params });
      if (res.data.code === 200) {
        const data = res.data.data;
        setInbox(data.list || []);
        setInboxPagination(data.pagination);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '获取收件箱失败');
    } finally {
      setInboxLoading(false);
    }
  }, [inboxFilter, inboxSearch, toast]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchInbox(1);
    }
  }, [activeTab, inboxFilter, inboxSearch, fetchInbox]);

  // ═══════════════════ Sync from IMAP ═══════════════════

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.post('/email/inbox');
      if (res.data.code === 200) {
        toast.success(res.data.message);
        fetchInbox(1);
      } else {
        toast.error(res.data.message || '同步失败');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || '同步失败');
    } finally {
      setSyncing(false);
    }
  };

  // ═══════════════════ Email Actions ═══════════════════

  const handleEmailAction = async (id: number, action: string) => {
    try {
      await api.patch(`/email/inbox/${id}`, { action });
      if (action === 'trash') {
        toast.success('邮件已移至回收站');
      }
      fetchInbox(inboxPagination.page);
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleOpenEmail = async (email: InboxEmail) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      try {
        await api.patch(`/email/inbox/${email.id}`, { action: 'read' });
        fetchInbox(inboxPagination.page);
      } catch { /* ignore */ }
    }
  };

  // ═══════════════════ Helpers ═══════════════════

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatFullDate = (dateStr: string) => {
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

  const truncate = (text: string, maxLen: number) => {
    if (!text) return '';
    return text.length > maxLen ? text.substring(0, maxLen) + '...' : text;
  };

  const getInitial = (name: string) => {
    return (name || '?').charAt(0).toUpperCase();
  };

  const senderColor = (name: string) => {
    const colors = ['#f97316', '#8b5cf6', '#06b6d4', '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < (name || '?').length; i++) {
      hash = (hash * 31 + (name || '?').charCodeAt(i)) % colors.length;
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // 输入框 disabled class（非超管时用）
  const inputDisabled = !canManage;
  const disabledClass = inputDisabled ? 'bg-surface-2 text-ink-2 cursor-not-allowed opacity-80' : '';

  // ═══════════════════ Render: Compose Tab ═══════════════════

  const renderCompose = () => (
    <div className="max-w-3xl">
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border bg-surface-2">
          <h3 className="font-semibold text-sm text-ink">新邮件</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink-2 w-16 flex-shrink-0">收件人</label>
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              placeholder="recipient@example.com"
              className="flex-1 px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-ink-2 w-16 flex-shrink-0">主题</label>
            <input
              type="text"
              value={composeSubject}
              onChange={(e) => setComposeSubject(e.target.value)}
              placeholder="请输入邮件主题"
              className="flex-1 px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none"
            />
          </div>
          <div>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={14}
              placeholder="请输入邮件正文..."
              className="w-full px-3 py-3 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none resize-none"
            />
          </div>
        </div>
        <div className="px-5 py-3 border-t border-border bg-surface-2 flex items-center justify-between">
          {/* 邮箱状态指示 */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config.status === 'active' ? 'bg-green-500' : 'bg-ink-3'}`} />
            <span className="text-xs text-ink-2">
              {config.status === 'active' ? '邮箱已激活' : '邮箱未激活'}
            </span>
            <button
              onClick={handleOpenConfig}
              className="ml-1 text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              配置
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setComposeTo(''); setComposeSubject(''); setComposeBody(''); }}
              className="px-4 py-2 border border-border-strong rounded-lg text-sm text-ink-2 hover:bg-surface transition-colors"
            >
              清空
            </button>
            <button
              onClick={handleSend}
              disabled={composeSending || config.status !== 'active'}
              title={config.status !== 'active' ? '请先激活邮箱配置' : '发送邮件'}
              className="flex items-center gap-2 px-5 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {composeSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════ Render: Inbox Tab ═══════════════════

  const renderInbox = () => (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-surface-2 rounded-lg p-1">
          {[
            { value: 'inbox', label: '全部' },
            { value: 'unread', label: '未读' },
            { value: 'starred', label: '星标' },
            { value: 'trash', label: '回收站' },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setInboxFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                inboxFilter === f.value
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-ink-2 hover:text-ink'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="relative w-48">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="text"
            value={inboxSearch}
            onChange={(e) => setInboxSearch(e.target.value)}
            placeholder="搜索邮件..."
            className="w-full pl-8 pr-3 py-1.5 bg-surface-2 border border-border-strong rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          同步邮件
        </button>
      </div>

      {/* Content */}
      {selectedEmail ? (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-surface-2 flex items-center gap-3">
            <button
              onClick={() => setSelectedEmail(null)}
              className="p-1 rounded-lg text-ink-3 hover:text-ink-2 hover:bg-surface transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h3 className="font-semibold text-sm text-ink flex-1 truncate">{selectedEmail.subject}</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleEmailAction(selectedEmail.id, 'star')}
                className="p-1.5 rounded-lg text-ink-3 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                title="标星"
              >
                <Star className={`w-4 h-4 ${selectedEmail.is_starred ? 'text-amber-500 fill-amber-500' : ''}`} />
              </button>
              <button
                onClick={() => handleEmailAction(selectedEmail.id, 'trash')}
                className="p-1.5 rounded-lg text-ink-3 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="删除"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 border-b border-border">
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: senderColor(selectedEmail.from_name || selectedEmail.from_address) }}
              >
                {getInitial(selectedEmail.from_name || selectedEmail.from_address)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink">{selectedEmail.from_name || selectedEmail.from_address}</span>
                  <span className="text-xs text-ink-3">{selectedEmail.from_address}</span>
                </div>
                <p className="text-xs text-ink-3 mt-0.5">收件人: {selectedEmail.to_address}</p>
                <p className="text-xs text-ink-3 mt-0.5">{formatFullDate(selectedEmail.received_at)}</p>
              </div>
            </div>
          </div>

          <div className="p-5 min-h-[300px]">
            {selectedEmail.body_html ? (
              <div
                className="text-sm text-ink leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedEmail.body_html) }}
              />
            ) : (
              <pre className="text-sm text-ink leading-relaxed font-sans whitespace-pre-wrap">
                {selectedEmail.body_text || '(无正文内容)'}
              </pre>
            )}
          </div>

          <div className="px-5 py-3 border-t border-border bg-surface-2 flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedEmail(null);
                setActiveTab('compose');
                setComposeTo(selectedEmail.from_address);
                setComposeSubject(`Re: ${selectedEmail.subject}`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border-strong rounded-lg text-xs text-ink-2 hover:bg-surface transition-colors"
            >
              <Reply className="w-3.5 h-3.5" />
              回复
            </button>
          </div>
        </div>
      ) : inboxLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
        </div>
      ) : inbox.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-ink-3 bg-surface rounded-xl border border-border">
          {inboxFilter === 'trash' ? (
            <Trash2 className="w-12 h-12 mb-3 text-ink-3" />
          ) : (
            <Mail className="w-12 h-12 mb-3 text-ink-3" />
          )}
          <p className="text-sm mb-2">
            {inboxFilter === 'trash' ? '回收站为空' : '收件箱为空'}
          </p>
          {inboxFilter !== 'trash' && (
            <button
              onClick={handleSync}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              从 IMAP 同步邮件
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {inbox.map((email) => (
                <button
                  key={email.id}
                  onClick={() => handleOpenEmail(email)}
                  className={`w-full px-5 py-3 flex items-center gap-3 text-left hover:bg-surface-2 transition-colors ${
                    !email.is_read ? 'bg-brand-50/30' : ''
                  }`}
                >
                  <div className="flex-shrink-0 w-2">
                    {!email.is_read && <div className="w-2 h-2 rounded-full bg-brand-600" />}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmailAction(email.id, email.is_starred ? 'unstar' : 'star');
                    }}
                    className="flex-shrink-0 p-0.5 text-ink-3 hover:text-amber-500"
                  >
                    <Star className={`w-3.5 h-3.5 ${email.is_starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: senderColor(email.from_name || email.from_address) }}
                  >
                    {getInitial(email.from_name || email.from_address)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm truncate ${!email.is_read ? 'font-semibold text-ink' : 'text-ink'}`}>
                        {email.from_name || email.from_address}
                      </span>
                      {email.has_attachment === 1 && <Paperclip className="w-3 h-3 text-ink-3 flex-shrink-0" />}
                    </div>
                    <p className={`text-sm truncate ${!email.is_read ? 'font-semibold text-ink' : 'text-ink-2'}`}>
                      {email.subject || '(无主题)'}
                    </p>
                    <p className="text-xs text-ink-3 truncate mt-0.5">
                      {truncate(email.body_text || '', 80)}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs text-ink-3 whitespace-nowrap">{formatDate(email.received_at)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (inboxFilter === 'trash') {
                          handleEmailAction(email.id, 'restore');
                        } else {
                          handleEmailAction(email.id, 'trash');
                        }
                      }}
                      className="p-1 rounded text-ink-3 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {inboxPagination.total > 0 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <span className="text-xs text-ink-2">
                共 {inboxPagination.total} 封, 第 {inboxPagination.page}/{inboxPagination.totalPages} 页
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => fetchInbox(inboxPagination.page - 1)}
                  disabled={inboxPagination.page <= 1}
                  className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-ink-2 px-2">{inboxPagination.page}</span>
                <button
                  onClick={() => fetchInbox(inboxPagination.page + 1)}
                  disabled={inboxPagination.page >= inboxPagination.totalPages}
                  className="p-1.5 rounded-lg text-ink-2 hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  // ═══════════════════ Main Render ═══════════════════

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">企业邮箱</h1>
            <p className="text-sm text-ink-2 mt-0.5">配置邮箱服务，发送和接收邮件</p>
          </div>
        </div>
        <button
          onClick={handleOpenConfig}
          title={!canManage ? '仅超级管理员可配置' : '邮箱配置'}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canManage
              ? 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100'
              : 'bg-surface-2 text-ink-3 cursor-not-allowed'
          }`}
        >
          <Settings className="w-4 h-4" />
          邮箱配置
          {!canManage && <ShieldAlert className="w-3.5 h-3.5 text-ink-3" />}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-surface-2 rounded-xl p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedEmail(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'inbox' && inboxPagination.total > 0 && (
                <span className="ml-1 bg-brand-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                  {inboxPagination.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'compose' && renderCompose()}
      {activeTab === 'inbox' && renderInbox()}

      {/* ═══════════════════ Config Modal ═══════════════════ */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-ink">邮箱配置</h3>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  config.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {config.status === 'active' ? '已激活' : '未激活'}
                </span>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-ink-3 hover:text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {configLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                </div>
              ) : (
                <>
                  {/* Status Banner */}
                  <div className={`rounded-lg p-4 flex items-center gap-3 ${
                    config.status === 'active' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
                  }`}>
                    {config.status === 'active' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink">
                        {config.status === 'active' ? '邮箱服务已激活' : '邮箱服务未激活'}
                      </p>
                      <p className="text-xs text-ink-2 mt-0.5">
                        {config.status === 'active'
                          ? 'SMTP 和 IMAP 已配置完成，可正常收发邮件'
                          : '请配置以下 SMTP/IMAP 信息后激活邮箱服务'}
                      </p>
                    </div>
                    <button
                      onClick={() => setConfig({ ...config, status: config.status === 'active' ? 'inactive' : 'active' })}
                      disabled={!canManage}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        config.status === 'active'
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {config.status === 'active' ? '停用' : '激活'}
                    </button>
                  </div>

                  {/* SMTP Section */}
                  <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2">
                      <Send className="w-4 h-4 text-brand-700" />
                      <h4 className="font-semibold text-sm text-ink">SMTP 发件服务器</h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">服务器地址</label>
                          <input
                            type="text"
                            value={config.smtp_host}
                            onChange={(e) => setConfig({ ...config, smtp_host: e.target.value })}
                            disabled={inputDisabled}
                            placeholder="smtp.example.com"
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">端口</label>
                          <input
                            type="number"
                            value={config.smtp_port}
                            onChange={(e) => setConfig({ ...config, smtp_port: parseInt(e.target.value) || 587 })}
                            disabled={inputDisabled}
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">用户名</label>
                          <input
                            type="text"
                            value={config.smtp_user}
                            onChange={(e) => setConfig({ ...config, smtp_user: e.target.value })}
                            disabled={inputDisabled}
                            placeholder="user@example.com"
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">密码</label>
                          <div className="relative">
                            <input
                              type={showSmtpPass ? 'text' : 'password'}
                              value={config.smtp_pass}
                              onChange={(e) => setConfig({ ...config, smtp_pass: e.target.value })}
                              disabled={inputDisabled}
                              placeholder="SMTP 授权码"
                              className={`w-full px-3 py-2 pr-10 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowSmtpPass(!showSmtpPass)}
                              disabled={inputDisabled}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 disabled:opacity-30"
                            >
                              {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink mb-1">连接方式</label>
                        <select
                          value={config.smtp_secure}
                          onChange={(e) => setConfig({ ...config, smtp_secure: parseInt(e.target.value) })}
                          disabled={inputDisabled}
                          className={`w-full md:w-48 px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                        >
                          <option value={0}>STARTTLS (推荐)</option>
                          <option value={1}>SSL/TLS</option>
                        </select>
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={handleTestSmtp}
                          disabled={testingSmtp || !config.smtp_host || !canManage}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                          测试 SMTP
                        </button>
                        <span className="text-xs text-ink-3">测试发送一封邮件到发件地址</span>
                      </div>
                    </div>
                  </div>

                  {/* IMAP Section */}
                  <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2">
                      <InboxIcon className="w-4 h-4 text-purple-600" />
                      <h4 className="font-semibold text-sm text-ink">IMAP 收件服务器</h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">服务器地址</label>
                          <input
                            type="text"
                            value={config.imap_host}
                            onChange={(e) => setConfig({ ...config, imap_host: e.target.value })}
                            disabled={inputDisabled}
                            placeholder="imap.example.com"
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">端口</label>
                          <input
                            type="number"
                            value={config.imap_port}
                            onChange={(e) => setConfig({ ...config, imap_port: parseInt(e.target.value) || 993 })}
                            disabled={inputDisabled}
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">用户名</label>
                          <input
                            type="text"
                            value={config.imap_user}
                            onChange={(e) => setConfig({ ...config, imap_user: e.target.value })}
                            disabled={inputDisabled}
                            placeholder="user@example.com"
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">密码</label>
                          <div className="relative">
                            <input
                              type={showImapPass ? 'text' : 'password'}
                              value={config.imap_pass}
                              onChange={(e) => setConfig({ ...config, imap_pass: e.target.value })}
                              disabled={inputDisabled}
                              placeholder="IMAP 密码/授权码"
                              className={`w-full px-3 py-2 pr-10 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowImapPass(!showImapPass)}
                              disabled={inputDisabled}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 hover:text-ink-2 disabled:opacity-30"
                            >
                              {showImapPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="pt-2 flex items-center gap-3">
                        <button
                          onClick={handleTestImap}
                          disabled={testingImap || !config.imap_host || !canManage}
                          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {testingImap ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                          测试 IMAP
                        </button>
                        <span className="text-xs text-ink-3">验证 IMAP 登录和收件箱可用性</span>
                      </div>
                    </div>
                  </div>

                  {/* Sender Info */}
                  <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
                    <div className="px-5 py-3 border-b border-border bg-surface flex items-center gap-2">
                      <FileText className="w-4 h-4 text-ink-2" />
                      <h4 className="font-semibold text-sm text-ink">发件信息</h4>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">发件人名称</label>
                          <input
                            type="text"
                            value={config.from_name}
                            onChange={(e) => setConfig({ ...config, from_name: e.target.value })}
                            disabled={inputDisabled}
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-ink mb-1">发件人邮箱</label>
                          <input
                            type="email"
                            value={config.from_address}
                            onChange={(e) => setConfig({ ...config, from_address: e.target.value })}
                            disabled={inputDisabled}
                            placeholder="noreply@example.com"
                            className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink mb-1">回复地址</label>
                        <input
                          type="email"
                          value={config.reply_to}
                          onChange={(e) => setConfig({ ...config, reply_to: e.target.value })}
                          disabled={inputDisabled}
                          placeholder="留空则使用发件人地址"
                          className={`w-full md:w-80 px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none ${disabledClass}`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-ink mb-1">签名（自动附加在邮件末尾）</label>
                        <textarea
                          value={config.signature}
                          onChange={(e) => setConfig({ ...config, signature: e.target.value })}
                          disabled={inputDisabled}
                          rows={3}
                          placeholder="此致&#10;星光儿童乐园团队"
                          className={`w-full px-3 py-2 border border-border-strong rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand-600 outline-none resize-none ${disabledClass}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.use_mailchannels === 1}
                            onChange={(e) => setConfig({ ...config, use_mailchannels: e.target.checked ? 1 : 0 })}
                            disabled={inputDisabled}
                            className="w-4 h-4 rounded border-border-strong text-brand-700 focus:ring-brand disabled:opacity-50"
                          />
                          <span className="text-xs text-ink-2">使用 MailChannels 发送（Cloudflare Workers 免费通道）</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex justify-between items-center bg-surface-2/50 flex-shrink-0">
              <span className="text-xs text-ink-3">
                {canManage ? '' : '仅超级管理员可编辑邮箱配置'}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-border-strong rounded-lg text-sm text-ink-2 hover:bg-surface transition-colors"
                >
                  取消
                </button>
                {canManage && (
                  <button
                    onClick={handleSaveConfig}
                    disabled={configSaving}
                    className="flex items-center gap-2 px-5 py-2 bg-surface-20 text-white text-sm font-medium rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {configSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    保存配置
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
