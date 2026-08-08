/**
 * 发件箱 API
 * GET  /api/email/outbox — 获取已发送邮件列表
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const offset = Math.max(0, (page - 1) * pageSize);

    const countResult = await db.prepare(
      'SELECT COUNT(*) as total FROM email_outbox'
    ).first<{ total: number }>();
    const total = countResult?.total || 0;

    const rows = await db.prepare(
      'SELECT * FROM email_outbox ORDER BY created_at DESC LIMIT ? OFFSET ?'
    ).bind(pageSize, offset).all();

    return jsonResponse(success({
      list: rows.results || [],
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '获取发件箱失败'));
  }
}
