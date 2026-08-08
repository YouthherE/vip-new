/**
 * 邮箱统计 API
 * GET /api/email/stats — 获取未读数、总数等统计
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const [unread, total, sent] = await Promise.all([
      db.prepare('SELECT COUNT(*) as count FROM email_inbox WHERE is_read = 0 AND is_deleted = 0').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM email_inbox WHERE is_deleted = 0').first<{ count: number }>(),
      db.prepare('SELECT COUNT(*) as count FROM email_outbox').first<{ count: number }>(),
    ]);

    return jsonResponse(success({
      unread: unread?.count || 0,
      totalInbox: total?.count || 0,
      totalSent: sent?.count || 0,
    }));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '获取统计失败'));
  }
}
