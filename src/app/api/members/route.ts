import { getCloudflareContext } from '@opennextjs/cloudflare';
import { success, error, jsonResponse } from '@/lib/utils/response';

export async function GET(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        
        // Pagination params
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');
        const offset = (page - 1) * pageSize;

        let baseQuery = 'FROM members';
        const params: any[] = [];

        if (search) {
            baseQuery += ' WHERE name LIKE ? OR phone LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        // Count total
        const countResult = await db.prepare(`SELECT COUNT(*) as total ${baseQuery}`).bind(...params).first<any>();
        const total = countResult?.total || 0;

        // Get data
        const query = `SELECT * ${baseQuery} ORDER BY id DESC LIMIT ? OFFSET ?`;
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
        console.error('Get members error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function POST(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { name, phone, remark, gender, address, channel, status } = body;

        if (!name || !phone) {
            return jsonResponse(error(400, '姓名和手机号不能为空'), 400);
        }

        const existing = await db.prepare('SELECT id FROM members WHERE phone = ?').bind(phone).first();
        if (existing) {
            return jsonResponse(error(409, '该手机号已存在'), 409);
        }

        const result = await db.prepare(
            'INSERT INTO members (name, phone, remark, balance, points, gender, address, channel, status) VALUES (?, ?, ?, 0, 0, ?, ?, ?, ?)'
        ).bind(
            name, 
            phone, 
            remark || '', 
            gender || 'unknown',
            address || '',
            channel || '',
            status || 'active'
        ).run();

        if (!result.success) {
            return jsonResponse(error(500, '创建会员失败'), 500);
        }

        return jsonResponse(success(null, '会员创建成功'));
    } catch (e: any) {
        console.error('Create member error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}

export async function PUT(request: Request) {
    try {
        const { env } = await getCloudflareContext();
        const db = (env as CloudflareEnv).DB;
        const body = await request.json() as any;
        const { id, name, phone, remark, gender, address, channel, status } = body;

        if (!id) {
            return jsonResponse(error(400, '会员ID不能为空'), 400);
        }

        // Check if member exists
        const member = await db.prepare('SELECT * FROM members WHERE id = ?').bind(id).first<any>();
        if (!member) {
            return jsonResponse(error(404, '会员不存在'), 404);
        }

        // If phone is changing, check for uniqueness
        if (phone && phone !== member.phone) {
            const existing = await db.prepare('SELECT id FROM members WHERE phone = ?').bind(phone).first();
            if (existing) {
                return jsonResponse(error(409, '该手机号已存在'), 409);
            }
        }

        const result = await db.prepare(`
            UPDATE members 
            SET name = ?, phone = ?, remark = ?, gender = ?, address = ?, channel = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `).bind(
            name, 
            phone, 
            remark || '', 
            gender || 'unknown',
            address || '',
            channel || '',
            status || 'active',
            id
        ).run();

        if (!result.success) {
            return jsonResponse(error(500, '更新会员失败'), 500);
        }

        return jsonResponse(success(null, '会员更新成功'));
    } catch (e: any) {
        console.error('Update member error:', e);
        return jsonResponse(error(500, e.message), 500);
    }
}
