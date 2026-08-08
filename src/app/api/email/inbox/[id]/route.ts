/**
 * 单封邮件操作 API
 * GET    /api/email/inbox/[id]  — 获取邮件详情
 * PATCH  /api/email/inbox/[id]  — 更新邮件状态（已读/标星/删除）
 * DELETE /api/email/inbox/[id]  — 永久删除
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const { id } = await params;
    const idNum = parseInt(id);

    const row = await db.prepare(
      'SELECT * FROM email_inbox WHERE id = ?'
    ).bind(idNum).first();

    if (!row) {
      return jsonResponse(error(404, '邮件不存在'));
    }

    return jsonResponse(success(row));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '获取邮件失败'));
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const body = await request.json();
    const { id } = await params;
    const idNum = parseInt(id);

    const { action } = body; // read | unread | star | unstar | trash | restore

    const existing = await db.prepare(
      'SELECT id FROM email_inbox WHERE id = ?'
    ).bind(idNum).first();

    if (!existing) {
      return jsonResponse(error(404, '邮件不存在'));
    }

    switch (action) {
      case 'read':
        await db.prepare('UPDATE email_inbox SET is_read = 1 WHERE id = ?').bind(idNum).run();
        break;
      case 'unread':
        await db.prepare('UPDATE email_inbox SET is_read = 0 WHERE id = ?').bind(idNum).run();
        break;
      case 'star':
        await db.prepare('UPDATE email_inbox SET is_starred = 1 WHERE id = ?').bind(idNum).run();
        break;
      case 'unstar':
        await db.prepare('UPDATE email_inbox SET is_starred = 0 WHERE id = ?').bind(idNum).run();
        break;
      case 'trash':
        await db.prepare('UPDATE email_inbox SET is_deleted = 1 WHERE id = ?').bind(idNum).run();
        break;
      case 'restore':
        await db.prepare('UPDATE email_inbox SET is_deleted = 0 WHERE id = ?').bind(idNum).run();
        break;
      default:
        return jsonResponse(error(400, '无效操作，支持: read/unread/star/unstar/trash/restore'));
    }

    const updated = await db.prepare(
      'SELECT * FROM email_inbox WHERE id = ?'
    ).bind(idNum).first();

    return jsonResponse(success(updated, '操作成功'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '更新邮件失败'));
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const { id } = await params;
    const idNum = parseInt(id);

    const existing = await db.prepare(
      'SELECT id FROM email_inbox WHERE id = ?'
    ).bind(idNum).first();

    if (!existing) {
      return jsonResponse(error(404, '邮件不存在'));
    }

    await db.prepare('DELETE FROM email_inbox WHERE id = ?').bind(idNum).run();

    return jsonResponse(success(null, '邮件已永久删除'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '删除邮件失败'));
  }
}
