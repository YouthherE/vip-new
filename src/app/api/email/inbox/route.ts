/**
 * 收件箱 API
 * GET    /api/email/inbox        — 获取收件箱列表（支持分页和筛选）
 * POST   /api/email/inbox        — 从 IMAP 同步新邮件
 * DELETE /api/email/inbox        — 清空已删除的邮件
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getEmailConfig, IMAPClient, parseRawEmail } from '@/lib/services/email';

/**
 * GET — 获取收件箱列表
 */
export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const url = new URL(request.url);

    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20');
    const filter = url.searchParams.get('filter') || 'inbox'; // inbox | unread | starred | trash
    const search = url.searchParams.get('search') || '';

    const offset = Math.max(0, (page - 1) * pageSize);

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    switch (filter) {
      case 'unread':
        whereClause += ' AND is_read = 0 AND is_deleted = 0';
        break;
      case 'starred':
        whereClause += ' AND is_starred = 1 AND is_deleted = 0';
        break;
      case 'trash':
        whereClause += ' AND is_deleted = 1';
        break;
      default:
        whereClause += ' AND is_deleted = 0';
    }

    if (search) {
      whereClause += ' AND (from_name LIKE ? OR from_address LIKE ? OR subject LIKE ?)';
      const keyword = `%${search}%`;
      params.push(keyword, keyword, keyword);
    }

    // 统计总数
    const countResult = await db.prepare(
      `SELECT COUNT(*) as total FROM email_inbox ${whereClause}`
    ).bind(...params).first<{ total: number }>();
    const total = countResult?.total || 0;

    // 查询列表
    const rows = await db.prepare(
      `SELECT * FROM email_inbox ${whereClause} ORDER BY received_at DESC LIMIT ? OFFSET ?`
    ).bind(...params, pageSize, offset).all();

    return jsonResponse(success({
      list: rows.results || [],
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '获取收件箱失败'));
  }
}

/**
 * POST — 从 IMAP 拉取新邮件
 */
export async function POST() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const config = await getEmailConfig(db);
    if (!config || !config.imap_host || !config.imap_user || !config.imap_pass) {
      return jsonResponse(error(400, 'IMAP 配置不完整'));
    }

    const client = new IMAPClient(
      config.imap_host,
      config.imap_port,
      config.imap_user,
      config.imap_pass
    );

    let fetchedCount = 0;

    try {
      await client.connect();
      await client.login();
      await client.selectInbox();

      const emails = await client.fetchUnseen();

      for (const raw of emails) {
        try {
          const parsed = parseRawEmail(raw.body || raw.raw);

          // 去重检查
          const existing = await db.prepare(
            'SELECT id FROM email_inbox WHERE message_uid = ? OR (message_id = ? AND message_id != \'\')'
          ).bind(raw.uid, parsed.messageId).first();

          if (existing) continue;

          await db.prepare(`
            INSERT INTO email_inbox (message_uid, message_id, from_address, from_name, to_address, reply_to, subject, body_text, body_html, received_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            raw.uid,
            parsed.messageId,
            parsed.fromAddress,
            parsed.fromName,
            parsed.toAddress,
            parsed.replyTo,
            parsed.subject,
            parsed.bodyText,
            parsed.bodyHtml,
            parsed.receivedAt,
          ).run();

          fetchedCount++;
        } catch {
          // 单封邮件解析失败不影响其他
          continue;
        }
      }
    } finally {
      await client.close();
    }

    return jsonResponse(success({ fetchedCount }, `成功同步 ${fetchedCount} 封新邮件`));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '同步邮件失败'));
  }
}

/**
 * DELETE — 清空回收站（永久删除 is_deleted=1 的邮件）
 */
export async function DELETE() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const result = await db.prepare(
      'DELETE FROM email_inbox WHERE is_deleted = 1'
    ).run();

    return jsonResponse(success({ deletedCount: result.meta?.changes }, '回收站已清空'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '清空回收站失败'));
  }
}
