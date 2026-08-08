import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getChinaTime } from '@/lib/utils/time';

/**
 * Cron job: Check and disable expired members.
 * Runs daily at 5:00 AM via Cloudflare Workers scheduled trigger.
 * Protected by cron secret to prevent unauthorized access.
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        // Validate cron secret
        const cronSecret = process.env.CRON_SECRET || 'vip-cron-secret-2024';
        if (secret !== cronSecret) {
            // Don't reveal too much info
            return jsonResponse(error(401, 'Unauthorized'), 401);
        }

        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // Find all active members whose membership has expired
        const now = getChinaTime();
        const expired = await db.prepare(`
            SELECT id, name, phone, cartype, expired_at
            FROM members
            WHERE status = 'active'
              AND expired_at IS NOT NULL
              AND expired_at != ''
              AND datetime(expired_at) < ?
        `).bind(now).all<any>();

        const expiredMembers = expired.results;

        if (expiredMembers.length === 0) {
            return jsonResponse(success({
                disabledCount: 0,
                message: '没有需要处理的过期会员',
                checkedAt: new Date().toISOString(),
            }));
        }

        // Batch update: disable all expired members
        const ids = expiredMembers.map((m: any) => m.id);
        const placeholders = ids.map(() => '?').join(',');
        const updateTime = getChinaTime();
        const result = await db.prepare(
            `UPDATE members SET status = 'disabled', updated_at = ? WHERE id IN (${placeholders})`
        ).bind(updateTime, ...ids).run();

        if (!result.success) {
            return jsonResponse(error(500, '批量更新会员状态失败'), 500);
        }

        // Log each disabled member
        const logEntries = expiredMembers.map((m: any) => ({
            target_type: 'member',
            target_id: m.id,
            action: 'auto_disable',
            content: JSON.stringify({
                reason: '会员已过期',
                name: m.name,
                phone: m.phone,
                cartype: m.cartype,
                expired_at: m.expired_at,
            }),
        }));

        for (const entry of logEntries) {
            await db.prepare(
                `INSERT INTO product_operation_logs (target_type, target_id, action, content, created_at) VALUES (?, ?, ?, ?, ?)`
            ).bind(entry.target_type, entry.target_id, entry.action, entry.content, getChinaTime()).run();
        }

        return jsonResponse(success({
            disabledCount: expiredMembers.length,
            disabledMembers: expiredMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                expired_at: m.expired_at,
            })),
            message: `成功禁用 ${expiredMembers.length} 个过期会员`,
            checkedAt: new Date().toISOString(),
        }));
    } catch (e: any) {
        console.error('Check expired members error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
