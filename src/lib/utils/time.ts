/**
 * Get current China local time string (UTC+8).
 * Cloudflare Workers/D1 run in UTC timezone, so CURRENT_TIMESTAMP returns UTC.
 * This helper generates Asia/Shanghai time for database timestamps.
 *
 * @returns Formatted datetime string "YYYY-MM-DD HH:mm:ss" in China timezone
 */
export function getChinaTime(): string {
    const now = new Date();
    // Convert UTC to China time (UTC+8)
    const chinaTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    return chinaTime.toISOString().replace('T', ' ').substring(0, 19);
}
