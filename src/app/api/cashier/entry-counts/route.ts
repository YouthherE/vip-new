import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getChinaTime } from '@/lib/utils/time';

/** GET /api/cashier/entry-counts - 查询今日入园统计 */
export async function GET() {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        const today = getChinaTime().split(' ')[0]; // YYYY-MM-DD

        const rows = await db.prepare(
            'SELECT product_id, product_name, count FROM entry_counts WHERE entry_date = ? ORDER BY product_id'
        ).bind(today).all();

        const list = (rows.results || []) as { product_id: number; product_name: string; count: number }[];

        const total = list.reduce((sum, r) => sum + r.count, 0);

        return jsonResponse(success({ date: today, list, total }));
    } catch (e: unknown) {
        console.error('Get entry counts error:', e);
        return jsonResponse(error(500, (e as Error).message || 'Internal Server Error'), 500);
    }
}
