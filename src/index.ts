/**
 * Cloudflare Worker — Scheduled task for checking expired members.
 *
 * Triggers daily at 5:00 AM Beijing time (21:00 UTC).
 *
 * Deploy separately from the Next.js app:
 *   npx wrangler deploy --config wrangler.toml
 */

export interface Env {
    DB: D1Database;
    CRON_SECRET?: string;
}

async function checkExpiredMembers(env: Env): Promise<{ disabledCount: number; disabledMembers: Array<{ id: number; name: string; expired_at: string }> }> {
    const db = env.DB;

    // Find active members whose membership has expired
    const expired = await db.prepare(`
        SELECT id, name, phone, cartype, expired_at
        FROM members
        WHERE status = 'active'
          AND expired_at IS NOT NULL
          AND expired_at != ''
          AND datetime(expired_at) < datetime('now', 'localtime')
    `).all<{
        id: number;
        name: string;
        phone: string;
        cartype: string;
        expired_at: string;
    }>();

    const expiredMembers = expired.results;

    if (expiredMembers.length === 0) {
        console.log(`[${new Date().toISOString()}] No expired members to disable.`);
        return { disabledCount: 0, disabledMembers: [] };
    }

    // Batch update
    const ids = expiredMembers.map((m) => m.id);
    const placeholders = ids.map(() => '?').join(',');

    const result = await db.prepare(
        `UPDATE members SET status = 'disabled', updated_at = datetime('now', 'localtime') WHERE id IN (${placeholders})`
    ).bind(...ids).run();

    if (!result.success) {
        throw new Error('Failed to update member statuses');
    }

    // Write operation logs
    for (const m of expiredMembers) {
        await db.prepare(
            `INSERT INTO product_operation_logs (target_type, target_id, action, content, created_at)
             VALUES ('member', ?, 'auto_disable', ?, datetime('now', 'localtime'))`
        ).bind(
            m.id,
            JSON.stringify({
                reason: '会员已过期（定时任务自动禁用）',
                name: m.name,
                phone: m.phone,
                cartype: m.cartype,
                expired_at: m.expired_at,
            })
        ).run();
    }

    const logList = expiredMembers.map((m) => `  - ${m.name}(ID:${m.id}) 过期日期: ${m.expired_at}`);
    console.log(`[${new Date().toISOString()}] Disabled ${expiredMembers.length} expired members:\n${logList.join('\n')}`);

    return {
        disabledCount: expiredMembers.length,
        disabledMembers: expiredMembers.map((m) => ({ id: m.id, name: m.name, expired_at: m.expired_at })),
    };
}

// ── HTTP handler (for manual trigger / testing) ──
async function handleHttp(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Simple secret check for manual trigger
    const secret = url.searchParams.get('secret');
    const cronSecret = env.CRON_SECRET || 'vip-cron-secret-2024';
    if (secret !== cronSecret) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        const result = await checkExpiredMembers(env);
        return new Response(JSON.stringify({ success: true, ...result }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (e: any) {
        return new Response(JSON.stringify({ success: false, error: e.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

// ── Scheduled handler ──
async function handleScheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
        const result = await checkExpiredMembers(env);
        console.log(`[${new Date().toISOString()}] Scheduled check complete: ${result.disabledCount} members disabled.`);
    } catch (e: any) {
        console.error(`[${new Date().toISOString()}] Scheduled check failed:`, e);
    }
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        return handleHttp(request, env);
    },
    async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
        return handleScheduled(event, env);
    },
};
