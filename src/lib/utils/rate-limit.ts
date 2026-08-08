/**
 * 简易内存级速率限制
 * 基于 IP 或用户名限制短时间内请求频率
 *
 * 注意：Cloudflare Workers 多实例运行，内存非共享，重启后清空。
 * 生产环境建议迁移至 Cloudflare KV 或 D1 持久化存储。
 */

const attempts = new Map<string, { count: number; resetAt: number }>();

/** 惰性清理过期记录（每次 check 时顺便清理，避免顶层 setInterval 副作用） */
function lazyCleanup(now: number) {
  // 每 60 秒才执行一次清理，避免频繁遍历
  if (now - (lazyCleanup as any)._lastClean > 60_000) {
    (lazyCleanup as any)._lastClean = now;
    for (const [key, record] of attempts.entries()) {
      if (now > record.resetAt) attempts.delete(key);
    }
  }
}
(lazyCleanup as any)._lastClean = 0;

/**
 * 检查是否超过限制
 * @param key  标识（IP 或用户名）
 * @param maxAttempts 最大允许次数
 * @param windowMs 时间窗口（毫秒）
 * @returns true = 通过，false = 被限制
 */
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  lazyCleanup(now);
  const record = attempts.get(key);
  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (record.count >= maxAttempts) {
    return false;
  }
  record.count++;
  return true;
}

/**
 * 清空某 key 的计数（如登录成功后重置失败计数）
 */
export function resetRateLimit(key: string): void {
  attempts.delete(key);
}
