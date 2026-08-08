/**
 * GET  /api/settings/payment  — 读取支付配置（脱敏）
 * PUT  /api/settings/payment  — 更新支付配置（仅超级管理员）
 */
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { verifyJWT } from '@/lib/utils/jwt';
import { getPaymentConfigs, savePaymentConfigs, maskSecret } from '@/lib/services/payment-config';

/** 从 JWT 中获取用户信息 */
async function getUser(request: Request): Promise<{ id: number; role: string } | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token);
    if (!payload || !payload.id) return null;
    return { id: payload.id as number, role: (payload.role as string) || '' };
  } catch {
    return null;
  }
}

/** 从 DB 中查询用户角色 */
async function getUserRole(db: D1Database, userId: number): Promise<string> {
  const user = await db.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first<{ role: string }>();
  return user?.role || '';
}

export async function GET(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const user = await getUser(request);
    if (!user) return jsonResponse(error(401, '未登录'), 401);

    const config = await getPaymentConfigs(db);
    if (!config) {
      return jsonResponse(success({ configured: false, config: null }, '暂无支付配置'));
    }

    // 脱敏返回
    return jsonResponse(success({
      configured: true,
      config: {
        wechatAppId: config.wechatAppId || '',
        wechatMchId: config.wechatMchId || '',
        wechatApiV3Key: maskSecret(config.wechatApiV3Key || ''),
        wechatPrivateKey: maskSecret(config.wechatPrivateKey || ''),
        wechatCertSerialNo: config.wechatCertSerialNo || '',
        wechatNotifyUrl: config.wechatNotifyUrl || '',
        alipayAppId: config.alipayAppId || '',
        alipayPrivateKey: maskSecret(config.alipayPrivateKey || ''),
        alipayPublicKey: maskSecret(config.alipayPublicKey || ''),
      },
    }));
  } catch (e: any) {
    console.error('Get payment config error:', e);
    return jsonResponse(error(500, e.message), 500);
  }
}

export async function PUT(request: Request) {
  try {
    const { env } = await getCloudflareContext();
    const db = (env as CloudflareEnv).DB;
    const user = await getUser(request);
    if (!user) return jsonResponse(error(401, '未登录'), 401);

    // 仅超级管理员可修改支付配置
    const role = await getUserRole(db, user.id);
    if (role !== 'super_admin') {
      return jsonResponse(error(403, '仅超级管理员可修改支付配置'), 403);
    }

    const body = await request.json() as any;

    await savePaymentConfigs(db, {
      wechatAppId: body.wechatAppId || undefined,
      wechatMchId: body.wechatMchId || undefined,
      wechatApiV3Key: body.wechatApiV3Key || undefined,
      wechatPrivateKey: body.wechatPrivateKey || undefined,
      wechatCertSerialNo: body.wechatCertSerialNo || undefined,
      wechatNotifyUrl: body.wechatNotifyUrl || undefined,
      alipayAppId: body.alipayAppId || undefined,
      alipayPrivateKey: body.alipayPrivateKey || undefined,
      alipayPublicKey: body.alipayPublicKey || undefined,
    });

    return jsonResponse(success(null, '支付配置已保存'));
  } catch (e: any) {
    console.error('Save payment config error:', e);
    return jsonResponse(error(500, e.message), 500);
  }
}
