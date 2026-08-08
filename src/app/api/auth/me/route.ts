import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getAuthUser } from '@/lib/utils/auth';

/**
 * GET /api/auth/me — 获取当前登录用户信息
 * 返回完整 profile（含 phone/email），替代 localStorage 中的敏感数据
 */
export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const authUser = await getAuthUser(request, db);
        if (!authUser) {
            return jsonResponse(error(401, '未授权，请先登录'), 401);
        }

        const user = await db
            .prepare('SELECT id, username, role, phone, email, avatar, status, created_at FROM users WHERE id = ?')
            .bind(authUser.id)
            .first();

        if (!user) {
            return jsonResponse(error(401, '用户不存在'), 401);
        }

        return jsonResponse(success(user));
    } catch (e: any) {
        console.error('GET /api/auth/me error:', e);
        return jsonResponse(error(500, '获取用户信息失败'), 500);
    }
}
