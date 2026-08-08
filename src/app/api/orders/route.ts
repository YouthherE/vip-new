import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';
import { getAuthUser } from '@/lib/utils/auth';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;

        // 认证校验
        const authUser = await getAuthUser(request, db);
        if (!authUser) {
            return jsonResponse(error(401, '未授权，请先登录'), 401);
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const priceType = searchParams.get('priceType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const id = searchParams.get('id'); // Single order detail

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const offset = (page - 1) * pageSize;

        // ── Single order detail ──
        if (id) {
            const order = await db.prepare(
                `SELECT o.*, u.username as operator_name
                 FROM orders o
                 LEFT JOIN users u ON o.operator_id = u.id
                 WHERE o.id = ?`
            ).bind(parseInt(id)).first<any>();

            if (!order) {
                return jsonResponse(error(404, '订单不存在'), 404);
            }

            const items = await db.prepare(
                'SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC'
            ).bind(parseInt(id)).all();

            const logs = await db.prepare(
                `SELECT * FROM product_operation_logs
                 WHERE target_type = 'order' AND target_id = ?
                 ORDER BY created_at DESC`
            ).bind(parseInt(id)).all();

            return jsonResponse(success({
                order,
                items: items.results,
                logs: logs.results,
            }));
        }

        // ── List query ──
        let baseQuery = 'FROM orders o LEFT JOIN users u ON o.operator_id = u.id';
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push('(o.order_no LIKE ? OR o.member_name LIKE ? OR o.member_phone LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (priceType && priceType !== 'all') {
            conditions.push('o.price_type = ?');
            params.push(priceType);
        }

        if (startDate) {
            conditions.push('o.created_at >= ?');
            params.push(startDate);
        }

        if (endDate) {
            conditions.push('o.created_at <= ?');
            params.push(endDate + ' 23:59:59');
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        // Count
        const countResult = await db.prepare(`SELECT COUNT(*) as total ${baseQuery}`).bind(...params).first<any>();
        const total = countResult?.total || 0;

        // Get data
        const query = `SELECT o.*, u.username as operator_name ${baseQuery} ORDER BY o.id DESC LIMIT ? OFFSET ?`;
        params.push(pageSize, offset);

        const results = await db.prepare(query).bind(...params).all();

        return jsonResponse(success({
            list: results.results,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        }));
    } catch (e: any) {
        console.error('Get orders error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
