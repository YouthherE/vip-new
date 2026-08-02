import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search'); // Member name search
        const type = searchParams.get('type');

        // Pagination params
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const offset = (page - 1) * pageSize;

        let baseQuery = `
            FROM transactions t
            LEFT JOIN members m ON t.member_id = m.id
        `;
        const params: any[] = [];
        const conditions: string[] = [];

        if (search) {
            conditions.push('(m.name LIKE ? OR m.phone LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (type && type !== 'all') {
            conditions.push('t.type = ?');
            params.push(type);
        }

        if (conditions.length > 0) {
            baseQuery += ' WHERE ' + conditions.join(' AND ');
        }

        // Count total
        const countResult = await db.prepare(`SELECT COUNT(*) as total ${baseQuery}`).bind(...params).first<any>();
        const total = countResult?.total || 0;

        // Get data
        const query = `SELECT t.*, m.name as member_name, m.phone as member_phone ${baseQuery} ORDER BY t.id DESC LIMIT ? OFFSET ?`;
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
        console.error('Get transactions error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function PUT(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { id, remark } = body;

        if (!id) {
            return jsonResponse(error(400, '交易ID不能为空'), 400);
        }

        // Check if transaction exists
        const transaction = await db.prepare('SELECT id FROM transactions WHERE id = ?').bind(id).first();
        if (!transaction) {
            return jsonResponse(error(404, '交易记录不存在'), 404);
        }

        const result = await db.prepare(
            'UPDATE transactions SET remark = ? WHERE id = ?'
        ).bind(remark || '', id).run();

        if (!result.success) {
            return jsonResponse(error(500, '更新备注失败'), 500);
        }

        return jsonResponse(success(null, '备注更新成功'));
    } catch (e: any) {
        console.error('Update transaction error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
