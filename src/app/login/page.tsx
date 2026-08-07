'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastErr, setToastErr] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ptsRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);
  const dimsRef = useRef({ w: 0, h: 0 });

  // ──── Toast ────
  const showToast = useCallback((msg: string, isErr = false) => {
    setToastMsg(msg);
    setToastErr(isErr);
    setToastVisible(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2600);
  }, []);

  // ──── Particle canvas ────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const w = (dimsRef.current.w = window.innerWidth * dpr);
      const h = (dimsRef.current.h = window.innerHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      const count = Math.min(90, Math.floor(window.innerWidth / 16));
      ptsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25 * dpr,
        vy: (Math.random() - 0.5) * 0.25 * dpr,
        r: (Math.random() * 1.6 + 0.6) * dpr,
      }));
    };

    const draw = () => {
      const { w, h } = dimsRef.current;
      const pts = ptsRef.current;
      const linkDist = 140 * dpr;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d = Math.hypot(dx, dy);
          if (d < linkDist) {
            const a = (1 - d / linkDist) * 0.32;
            ctx.strokeStyle = `rgba(255,107,92,${a})`;
            ctx.lineWidth = dpr * 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        ctx.fillStyle = 'rgba(170,190,255,0.55)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) animRef.current = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', () => { resize(); if (reduce) draw(); });
    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  // ──── Login handler ────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username.trim()) { showToast('请输入账户 / 手机号', true); return; }
    if (!password.trim()) { showToast('请输入登录密码', true); return; }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { username: username.trim(), password });
      if (response.data.code === 200) {
        const { token, user } = response.data.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        showToast('登录成功，正在进入控制台…');
        setTimeout(() => router.push('/'), 600);
      } else {
        showToast(response.data.message || '登录失败', true);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(e.response?.data?.message || '登录失败，请检查账号密码', true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* ──── Ambient background layers ──── */}
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(48vw 48vw at 12% 18%, rgba(124,92,252,0.30), transparent 60%), ' +
            'radial-gradient(46vw 46vw at 88% 82%, rgba(255,111,165,0.22), transparent 60%), ' +
            'radial-gradient(40vw 40vw at 78% 12%, rgba(255,111,165,0.16), transparent 60%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,111,165,0.05) 1px, transparent 1px), ' +
            'linear-gradient(90deg, rgba(255,111,165,0.05) 1px, transparent 1px)',
          backgroundSize: '46px 46px',
          WebkitMaskImage: 'radial-gradient(circle at 50% 40%, #000 0%, transparent 78%)',
          maskImage: 'radial-gradient(circle at 50% 40%, #000 0%, transparent 78%)',
        }}
      />
      <div className="fixed inset-x-0 h-[2px] z-[1] pointer-events-none animate-[sweep_7s_linear_infinite] opacity-60"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,107,92,0.55), transparent)',
        }}
      />
      <div className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(120% 100% at 50% 0%, transparent 55%, rgba(3,6,14,0.85))',
        }}
      />

      {/* ──── Main shell ──── */}
      <main className="relative z-[2] min-h-screen grid lg:grid-cols-[1.05fr_0.95fr] max-w-[1320px] mx-auto p-[clamp(18px,3vw,44px)]">

        {/* Brand panel */}
        <section className="flex flex-col justify-between p-[clamp(28px,4vw,56px)] p-[clamp(28px,4vw,60px)] border-b lg:border-b-0 lg:border-r border-[rgba(255,111,165,0.14)]">

          <div className="flex items-center gap-3.5">
            <div
              className="w-[46px] h-[46px] rounded-[13px] grid place-items-center shrink-0"
              style={{
                background: 'linear-gradient(140deg, var(--brand), var(--color-pink))',
                boxShadow: '0 8px 30px rgba(255,107,92,0.28)',
              }}
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#04141a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold tracking-[0.14em]" style={{ fontFamily: 'var(--font-sans)' }}>
                星光儿童乐园
              </div>
              <div className="text-[10px] tracking-[0.42em] text-[#6b789c] font-medium mt-[3px]">
                STARLIGHT KIDS
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="inline-flex items-center gap-2 mb-[18px] text-[11px] tracking-[0.32em] text-[var(--brand)] uppercase"
              style={{ fontFamily: 'monospace' }}>
              <span className="w-[26px] h-px bg-[var(--brand)] inline-block" />
              SECURE ACCESS
            </div>
            <h1 className="text-[clamp(30px,3.6vw,46px)] leading-[1.1] tracking-[-0.01em] font-semibold text-[#eef3ff]">
              开启您的<br /><span className="text-[var(--brand)]">会员欢乐世界</span>
            </h1>
            <p className="mt-[18px] max-w-[40ch] leading-[1.65] text-[14.5px] text-[#aab6d4]">
              统一管理会员档案、权益等级与营销触达。登录后即可进入实时运营驾驶舱。
            </p>
          </div>

          <div className="flex items-center gap-2.5 mt-10 text-xs text-[#6b789c]" style={{ fontFamily: 'monospace' }}>
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--brand)] animate-pulse" />
            SYSTEM ONLINE · v3.2.1 · 端到端加密
          </div>
        </section>

        {/* Login panel */}
        <section className="grid place-items-center p-[clamp(20px,3vw,48px)]">
          <form
            onSubmit={handleLogin}
            className="w-full max-w-[400px] rounded-[20px] border border-[rgba(255,111,165,0.32)] p-[clamp(28px,3.4vw,40px)] relative overflow-hidden"
            noValidate
            style={{
              background: 'rgba(16,24,46,0.55)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 30px 80px -30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-px opacity-60"
              style={{ background: 'linear-gradient(90deg, transparent, var(--brand), transparent)' }}
            />

            {/* Header */}
            <div className="flex justify-between items-start mb-[26px]">
              <div>
                <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-[#eef3ff]">
                  欢迎回来
                </h2>
                <p className="text-[12.5px] text-[#6b789c] mt-[5px]">
                  请输入账户信息以进入控制台
                </p>
              </div>
              <button
                type="button"
                className="text-[11px] text-[#aab6d4] border border-[rgba(255,111,165,0.14)] rounded-lg px-2.5 py-1.5 bg-transparent hover:border-[rgba(255,111,165,0.32)] hover:text-[#eef3ff] transition-colors"
                style={{ fontFamily: 'monospace' }}
                onClick={() => showToast('已切换为中文（演示）')}
              >
                中文 / EN
              </button>
            </div>

            {/* Account */}
            <div className="mb-[18px]">
              <label
                htmlFor="account"
                className="block text-[11.5px] tracking-[0.06em] text-[#aab6d4] mb-2 uppercase"
                style={{ fontFamily: 'monospace' }}
              >
                账户 / 手机号
              </label>
              <div
                className="flex items-center gap-2.5 bg-[#0f1729] border border-[rgba(255,111,165,0.14)] rounded-[14px] px-3.5 transition-all duration-300 focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_rgba(255,107,92,0.13)] focus-within:bg-[#16203a]"
              >
                <span className="text-[#6b789c] grid place-items-center shrink-0" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                  </svg>
                </span>
                <input
                  id="account"
                  name="username"
                  type="text"
                  placeholder="手机号 / 邮箱 / 会员ID"
                  autoComplete="username"
                  required
                  className="flex-1 bg-transparent border-none outline-none text-[#eef3ff] text-[14.5px] py-3.5 placeholder:text-[#6b789c] font-sans"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-[18px]">
              <label
                htmlFor="password"
                className="block text-[11.5px] tracking-[0.06em] text-[#aab6d4] mb-2 uppercase"
                style={{ fontFamily: 'monospace' }}
              >
                密码
              </label>
              <div
                className="flex items-center gap-2.5 bg-[#0f1729] border border-[rgba(255,111,165,0.14)] rounded-[14px] px-3.5 transition-all duration-300 focus-within:border-[var(--brand)] focus-within:shadow-[0_0_0_3px_rgba(255,107,92,0.13)] focus-within:bg-[#16203a]"
              >
                <span className="text-[#6b789c] grid place-items-center shrink-0" aria-hidden>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="输入登录密码"
                  autoComplete="current-password"
                  required
                  className="flex-1 bg-transparent border-none outline-none text-[#eef3ff] text-[14.5px] py-3.5 placeholder:text-[#6b789c] font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="bg-transparent border-none text-[#6b789c] cursor-pointer grid place-items-center p-1 rounded-md hover:text-[var(--brand)] transition-colors shrink-0"
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.9 17.9A10.4 10.4 0 0 1 12 19C5 19 1 12 1 12a18 18 0 0 1 5.1-5.9M9.9 4.2A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a18 18 0 0 1-2.2 3.2M1 1l22 22M9.5 9.5a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex justify-between items-center my-1 mb-[22px] text-[13px]">
              <label className="inline-flex items-center gap-[9px] cursor-pointer text-[#aab6d4] select-none">
                <input type="checkbox" className="absolute opacity-0 pointer-events-none peer" />
                <span className="w-[17px] h-[17px] rounded-[5px] border border-[rgba(255,111,165,0.32)] grid place-items-center transition-all duration-300 bg-[#0f1729] peer-checked:bg-[var(--brand)] peer-checked:border-[var(--brand)] peer-focus-visible:outline-2 peer-focus-visible:outline peer-focus-visible:outline-[var(--brand)] peer-focus-visible:outline-offset-2">
                  <svg className="w-[11px] h-[11px] opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="#04141a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l5 5 9-11" />
                  </svg>
                </span>
                记住我
              </label>
              <a href="#" className="text-[#aab6d4] no-underline hover:text-[var(--brand)] transition-colors">
                忘记密码？
              </a>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full border-none cursor-pointer rounded-[14px] py-[15px] text-[14.5px] font-semibold text-[#04141a] relative overflow-hidden transition-all duration-300 flex items-center justify-center gap-[9px] font-sans enabled:hover:-translate-y-px enabled:active:translate-y-0 disabled:opacity-70 disabled:cursor-progress"
              style={{
                background: 'linear-gradient(100deg, var(--brand), var(--color-pink))',
                boxShadow: '0 12px 30px -10px rgba(255,107,92,0.5)',
              }}
            >
              {/* Shimmer */}
              <span
                className="absolute top-0 -left-[120%] w-[60%] h-full opacity-0 disabled:opacity-0"
                style={{
                  background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.45), transparent)',
                  transform: 'skewX(-20deg)',
                  animation: 'shimmer 3.6s infinite',
                }}
              />
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-[rgba(4,20,26,0.35)] border-t-[#04141a] rounded-full animate-spin" />
              ) : (
                <span>登录系统</span>
              )}
            </button>

            {/* Signup link */}
            <p className="text-center mt-6 text-[13px] text-[#6b789c]">
              还没有账户？{' '}
              <Link href="/register" className="text-[var(--brand)] no-underline font-semibold hover:underline">
                申请开通席位
              </Link>
            </p>
          </form>
        </section>
      </main>

      {/* ──── Toast ──── */}
      <div
        className={`fixed left-1/2 bottom-8 -translate-x-1/2 z-30 px-5 py-3.5 rounded-xl text-[13px] flex items-center gap-2.5 pointer-events-none transition-all duration-300 ${
          toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
        style={{
          background: 'rgba(20,30,56,0.7)',
          border: `1px solid ${toastErr ? 'rgba(255,107,125,0.5)' : 'rgba(255,111,165,0.32)'}`,
          backdropFilter: 'blur(14px)',
          color: '#eef3ff',
        }}
      >
        <span className={`w-2 h-2 rounded-full ${toastErr ? 'bg-[#ff6b7d]' : 'bg-[var(--brand)]'}`} />
        {toastMsg}
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% { left: -120%; }
          55%, 100% { left: 130%; }
        }
        @keyframes sweep {
          0% { top: -2px; }
          100% { top: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          *, ::before, ::after { animation-duration: 0.01ms !important; }
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          box-shadow: 0 0 0 1000px #0f1729 inset !important;
          -webkit-text-fill-color: #eef3ff !important;
          caret-color: #eef3ff;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>
    </>
  );
}
