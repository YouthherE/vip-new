import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { writeOperationLog } from '@/lib/utils/logger';
import { getChinaTime } from '@/lib/utils/time';
import { getAuthUser, requireRole } from '@/lib/utils/auth';

export async function PUT(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // 认证 + 角色校验：仅管理员可上下架商品
        const authUser = await getAuthUser(request, db);
        const roleErr = requireRole(authUser, 'super_admin', 'admin');
        if (roleErr) return roleErr;

        const body = await request.json() as any;
        const { ids, status } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return jsonResponse(error(400, '请选择要操作的商品'), 400);
        }

        if (!status || !['listed', 'unlisted'].includes(status)) {
            return jsonResponse(error(400, '状态值无效'), 400);
        }

        // Use parameterized query for each id to prevent SQL injection
        const placeholders = ids.map(() => '?').join(',');
        const actionText = status === 'listed' ? '上架' : '下架';

        const result = await db.prepare(
            `UPDATE products SET status = ?, updated_at = ? WHERE id IN (${placeholders})`
        ).bind(status, getChinaTime(), ...ids).run();

        if (!result.success) {
            return jsonResponse(error(500, `批量${actionText}失败`), 500);
        }

        await writeOperationLog(request, db, {
            target_type: 'product',
            target_id: ids.join(','),
            action: status === 'listed' ? 'online' : 'offline',
            content: JSON.stringify({ ids, status }),
        });

        return jsonResponse(success(null, `批量${actionText}成功`));
    } catch (e: any) {
        console.error('Batch update product status error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
