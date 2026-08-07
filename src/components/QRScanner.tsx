'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, ScanLine, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);
  /** 标记 scanner.start() 是否已成功 resolve（摄像头真正就绪） */
  const isRunningRef = useRef(false);
  const containerId = 'qr-scanner-container';

  useEffect(() => {
    // 清理容器中可能残留的旧 video 元素（Strict Mode 双重挂载会导致叠加）
    const container = document.getElementById(containerId);
    if (container) container.innerHTML = '';

    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    const startScanner = async () => {
      try {
        setError('');

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            isRunningRef.current = false;

            scanner.stop().catch(() => {});
            const el = document.getElementById(containerId);
            if (el) el.innerHTML = '';
            onScan(decodedText);
          },
          () => {
            // scan failure — ignore, keep trying
          }
        );

        // start() resolve 了才标记为运行中
        isRunningRef.current = true;
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || '无法打开摄像头，请检查权限');
      }
    };

    startScanner();

    return () => {
      if (isRunningRef.current) {
        isRunningRef.current = false;
        scannerRef.current?.stop().catch(() => {});
      }
      // 清理容器 DOM，防止 Strict Mode 双重挂载残留 video 元素
      const el = document.getElementById(containerId);
      if (el) el.innerHTML = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 手动关闭时确保 scanner 停止 */
  const handleClose = () => {
    if (isRunningRef.current) {
      isRunningRef.current = false;
      scannerRef.current?.stop().catch(() => {});
    }
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <ScanLine size={16} className="text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-ink text-base">扫描支付码</h3>
              <p className="text-xs text-ink-3">请将顾客付款码对准摄像头</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-surface-2 text-ink-3 hover:text-ink transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-slate-950">
          {error ? (
            <div className="flex flex-col items-center justify-center h-[360px] gap-4 text-slate-300">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                <CameraOff size={28} className="text-slate-500" />
              </div>
              <div className="text-center px-6">
                <p className="font-medium text-slate-300 mb-1">无法访问摄像头</p>
                <p className="text-xs text-slate-500">{error}</p>
              </div>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                返回
              </button>
            </div>
          ) : (
            <>
              <div id={containerId} className="w-full" style={{ minHeight: '360px' }} />
              {/* Scanning overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-52 border-2 border-brand/70 rounded-2xl relative">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-3 border-l-3 border-brand rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-3 border-r-3 border-brand rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-3 border-l-3 border-brand rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-3 border-r-3 border-brand rounded-br-lg" />
                  {/* Scanning line animation */}
                  <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2">
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-brand to-transparent animate-pulse" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer hint */}
        {!error && (
          <div className="px-6 py-3 bg-surface-2 flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-ink-3">
              <span className="w-3 h-3 rounded bg-green-400" />
              微信支付
            </div>
            <span className="text-ink-3">|</span>
            <div className="flex items-center gap-1.5 text-xs text-ink-3">
              <span className="w-3 h-3 rounded bg-blue-400" />
              支付宝
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
