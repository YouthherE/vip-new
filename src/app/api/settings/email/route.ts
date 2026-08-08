/**
 * 邮箱配置 API
 * GET  /api/settings/email  — 获取邮箱配置（密码脱敏）
 * PUT  /api/settings/email  — 更新邮箱配置（仅 super_admin）
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getEmailConfig, updateEmailConfig, maskPassword } from '@/lib/services/email';
import { verifyJWT } from '@/lib/utils/jwt';

/**
 * 校验请求是否为 super_admin
 */
async function requireSuperAdmin(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  const payload = await verifyJWT(token);
  return payload?.role === 'super_admin' || payload?.username === 'admin';
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;

    const config = await getEmailConfig(db);
    if (!config) {
      return jsonResponse(error(404, '邮箱配置不存在'));
    }

    // 脱敏密码
    return jsonResponse(success({
      ...config,
      smtp_pass: maskPassword(config.smtp_pass),
      imap_pass: maskPassword(config.imap_pass),
    }));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '获取邮箱配置失败'));
  }
}

export async function PUT(request: Request) {
  try {
    // 权限校验：仅超级管理员可编辑
    const isSuperAdmin = await requireSuperAdmin(request);
    if (!isSuperAdmin) {
      return jsonResponse(error(403, '仅超级管理员可配置邮箱'));
    }

    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const body = await request.json();

    // 允许更新的字段
    const allowedFields = [
      'smtp_host', 'smtp_port', 'smtp_secure', 'smtp_user', 'smtp_pass',
      'imap_host', 'imap_port', 'imap_secure', 'imap_user', 'imap_pass',
      'from_name', 'from_address', 'reply_to', 'signature',
      'use_mailchannels', 'status',
    ];

    const data: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // 如果密码是脱敏值（含 ****），跳过不更新
        if ((key === 'smtp_pass' || key === 'imap_pass') && typeof body[key] === 'string' && body[key].includes('****')) {
          continue;
        }
        data[key] = body[key];
      }
    }

    const config = await updateEmailConfig(db, data);
    if (!config) {
      return jsonResponse(error(404, '邮箱配置不存在'));
    }

    return jsonResponse(success({
      ...config,
      smtp_pass: maskPassword(config.smtp_pass),
      imap_pass: maskPassword(config.imap_pass),
    }, '邮箱配置更新成功'));
  } catch (e: any) {
    return jsonResponse(error(500, e.message || '更新邮箱配置失败'));
  }
}
